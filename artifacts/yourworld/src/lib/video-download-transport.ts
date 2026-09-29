export type TransferProgressFn = (
  bytesTransferred: number,
  totalBytes: number,
) => void;

const DOWNLOAD_CHUNK_SIZE = 4 * 1024 * 1024;
const MAX_PARALLEL_DOWNLOADS = 4;

export function sanitizeDownloadName(value: string, fallback: string) {
  const clean = value
    .replace(/[^\p{L}\p{N}\s._-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 90);
  return clean || fallback;
}

export function attachmentMediaUrl(src: string, fileName: string) {
  try {
    const url = new URL(src);
    if (!/\/storage\/v1\/object\/(?:sign|public|authenticated)\//i.test(url.pathname)) {
      return src;
    }
    url.searchParams.set(
      "download",
      sanitizeDownloadName(fileName, "yourworld-media"),
    );
    return url.toString();
  } catch {
    return src;
  }
}

function reportTransfer(
  onProgress: ((percent: number) => void) | undefined,
  onTransferProgress: TransferProgressFn | undefined,
  bytesTransferred: number,
  totalBytes: number,
  force = false,
) {
  const now = Date.now();
  const key = onTransferProgress as (TransferProgressFn & { lastReportAt?: number }) | undefined;
  if (force || !key || now - (key.lastReportAt ?? 0) >= 200) {
    if (key) key.lastReportAt = now;
    onTransferProgress?.(bytesTransferred, totalBytes);
    if (totalBytes > 0) {
      onProgress?.(Math.min(99, Math.round((bytesTransferred / totalBytes) * 100)));
    }
  }
}

async function responseToBlob(
  response: Response,
  onProgress?: (percent: number) => void,
  onTransferProgress?: TransferProgressFn,
) {
  const totalBytes = Number(response.headers.get("content-length")) || 0;
  const contentType = response.headers.get("content-type") || "video/mp4";
  const reader = response.body?.getReader();
  if (!reader) {
    const blob = await response.blob();
    reportTransfer(onProgress, onTransferProgress, blob.size, totalBytes || blob.size, true);
    if (!blob.size) throw new Error("Video download returned an empty file");
    onProgress?.(100);
    return blob;
  }

  const chunks: ArrayBuffer[] = [];
  let bytesTransferred = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value?.byteLength) continue;
      chunks.push(
        value.buffer.slice(
          value.byteOffset,
          value.byteOffset + value.byteLength,
        ) as ArrayBuffer,
      );
      bytesTransferred += value.byteLength;
      reportTransfer(
        onProgress,
        onTransferProgress,
        bytesTransferred,
        totalBytes,
      );
    }
  } finally {
    reader.releaseLock();
  }

  if (!bytesTransferred) throw new Error("Video download returned an empty file");
  const blob = new Blob(chunks, { type: contentType });
  reportTransfer(
    onProgress,
    onTransferProgress,
    bytesTransferred,
    totalBytes || bytesTransferred,
    true,
  );
  onProgress?.(100);
  return blob;
}

async function fetchDirect(
  src: string,
  onProgress?: (percent: number) => void,
  onTransferProgress?: TransferProgressFn,
) {
  const response = await fetch(src, { cache: "no-store" });
  if (!response.ok) throw new Error(`Video download failed (${response.status})`);
  return responseToBlob(response, onProgress, onTransferProgress);
}

function parseContentRange(value: string | null) {
  const match = value?.match(/^bytes\s+(\d+)-(\d+)\/(\d+)$/i);
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2]);
  const total = Number(match[3]);
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    !Number.isSafeInteger(total) ||
    start < 0 ||
    end < start ||
    total <= end
  ) {
    return null;
  }
  return { start, end, total };
}

async function fetchInParallelRanges(
  src: string,
  onProgress?: (percent: number) => void,
  onTransferProgress?: TransferProgressFn,
) {
  const controller = new AbortController();
  onProgress?.(0);
  const firstResponse = await fetch(src, {
    headers: { Range: `bytes=0-${DOWNLOAD_CHUNK_SIZE - 1}` },
    cache: "no-store",
    signal: controller.signal,
  });

  // Some storage/CDN endpoints ignore Range. Their full response is already
  // useful, so consume it as a stream instead of requesting it a second time.
  if (firstResponse.status !== 206) {
    if (!firstResponse.ok) {
      throw new Error(`Video download failed (${firstResponse.status})`);
    }
    return responseToBlob(firstResponse, onProgress, onTransferProgress);
  }

  const firstRange = parseContentRange(firstResponse.headers.get("content-range"));
  if (
    !firstRange ||
    firstRange.start !== 0 ||
    firstRange.end !== Math.min(DOWNLOAD_CHUNK_SIZE, firstRange.total) - 1
  ) {
    throw new Error("Video server returned an invalid byte range");
  }

  const totalBytes = firstRange.total;
  const firstChunk = await firstResponse.arrayBuffer();
  const expectedFirstChunkSize = firstRange.end + 1;
  if (firstChunk.byteLength !== expectedFirstChunkSize) {
    throw new Error("Video server returned an incomplete byte range");
  }

  const chunkCount = Math.ceil(totalBytes / DOWNLOAD_CHUNK_SIZE);
  const chunks = new Array<ArrayBuffer>(chunkCount);
  chunks[0] = firstChunk;
  let bytesTransferred = firstChunk.byteLength;
  reportTransfer(onProgress, onTransferProgress, bytesTransferred, totalBytes);

  if (chunkCount > 1) {
    let nextChunkIndex = 1;
    let rangeUnsupported = false;
    const downloadNextRange = async () => {
      while (!rangeUnsupported) {
        const chunkIndex = nextChunkIndex++;
        if (chunkIndex >= chunkCount) return;
        const start = chunkIndex * DOWNLOAD_CHUNK_SIZE;
        const end = Math.min(start + DOWNLOAD_CHUNK_SIZE, totalBytes) - 1;
        const response = await fetch(src, {
          headers: { Range: `bytes=${start}-${end}` },
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.status === 200) {
          rangeUnsupported = true;
          await response.body?.cancel().catch(() => {});
          return;
        }
        if (response.status !== 206) {
          throw new Error(`Video download failed (${response.status})`);
        }

        const range = parseContentRange(response.headers.get("content-range"));
        if (
          !range ||
          range.start !== start ||
          range.end !== end ||
          range.total !== totalBytes
        ) {
          throw new Error("Video server returned an invalid byte range");
        }
        const chunk = await response.arrayBuffer();
        if (chunk.byteLength !== end - start + 1) {
          throw new Error("Video server returned an incomplete byte range");
        }
        chunks[chunkIndex] = chunk;
        bytesTransferred += chunk.byteLength;
        reportTransfer(onProgress, onTransferProgress, bytesTransferred, totalBytes);
      }
    };

    try {
      await Promise.all(
        Array.from(
          { length: Math.min(MAX_PARALLEL_DOWNLOADS, chunkCount - 1) },
          () => downloadNextRange(),
        ),
      );
    } catch (error) {
      controller.abort();
      throw error;
    }

    if (rangeUnsupported) {
      controller.abort();
      return fetchDirect(src, onProgress, onTransferProgress);
    }
  }

  const contentType = firstResponse.headers.get("content-type") || "video/mp4";
  const blob = new Blob(chunks, { type: contentType });
  if (!blob.size) throw new Error("Video download returned an empty file");
  reportTransfer(onProgress, onTransferProgress, totalBytes, totalBytes, true);
  onProgress?.(100);
  return blob;
}

/** Uses parallel byte ranges when supported, with a streamed full-response fallback. */
export async function fetchVideoBlob(
  src: string,
  onProgress?: (percent: number) => void,
  fileName?: string,
  onTransferProgress?: TransferProgressFn,
) {
  const downloadSrc = fileName ? attachmentMediaUrl(src, fileName) : src;
  return fetchInParallelRanges(downloadSrc, onProgress, onTransferProgress);
}