export type TransferProgressFn = (
  bytesTransferred: number,
  totalBytes: number,
) => void;

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

async function readResponseWithProgress(
  response: Response,
  onProgress?: (percent: number) => void,
  onTransferProgress?: TransferProgressFn,
) {
  const total =
    Number(response.headers.get("content-length")) ||
    Number(response.headers.get("content-range")?.match(/\/(\d+)$/)?.[1]) ||
    0;
  if (!response.body) {
    const blob = await response.blob();
    onTransferProgress?.(blob.size, total || blob.size);
    onProgress?.(100);
    return blob;
  }

  const reader = response.body.getReader();
  const chunks: ArrayBuffer[] = [];
  let loaded = 0;
  onProgress?.(0);
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(
      value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer,
    );
    loaded += value.byteLength;
    onTransferProgress?.(loaded, total);
    if (total > 0) onProgress?.(Math.min(99, Math.round((loaded / total) * 100)));
  }
  onProgress?.(100);
  return new Blob(chunks, {
    type: response.headers.get("content-type") || "video/mp4",
  });
}

type ByteRange = {
  start: number;
  end: number;
};

function parseContentRange(value: string | null) {
  const match = value?.match(/^bytes\s+(\d+)-(\d+)\/(\d+)$/i);
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2]);
  const total = Number(match[3]);
  if (![start, end, total].every(Number.isSafeInteger) || end < start || total <= end) {
    return null;
  }
  return { start, end, total };
}

function splitByteRanges(total: number): ByteRange[] {
  const count = Math.min(4, total);
  return Array.from({ length: count }, (_, index) => ({
    start: Math.floor((index * total) / count),
    end: Math.floor(((index + 1) * total) / count) - 1,
  }));
}

async function readRangeResponse(
  response: Response,
  range: ByteRange,
  total: number,
  onBytes?: (bytes: number) => void,
) {
  const contentRange = parseContentRange(response.headers.get("content-range"));
  const expectedLength = range.end - range.start + 1;
  const contentLengthHeader = response.headers.get("content-length");
  const declaredLength = contentLengthHeader === null ? null : Number(contentLengthHeader);
  if (
    response.status !== 206 ||
    !contentRange ||
    contentRange.start !== range.start ||
    contentRange.end !== range.end ||
    contentRange.total !== total ||
    (declaredLength !== null &&
      (!Number.isFinite(declaredLength) || declaredLength !== expectedLength))
  ) {
    throw new Error("Range response was invalid");
  }

  if (!response.body) {
    const blob = await response.blob();
    if (blob.size !== expectedLength) throw new Error("Range response length was invalid");
    onBytes?.(blob.size);
    return blob;
  }

  const reader = response.body.getReader();
  const chunks: ArrayBuffer[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    loaded += value.byteLength;
    if (loaded > expectedLength) {
      throw new Error("Range response exceeded its requested length");
    }
    chunks.push(
      value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer,
    );
    onBytes?.(value.byteLength);
  }
  if (loaded !== expectedLength) throw new Error("Range response was truncated");
  return new Blob(chunks, {
    type: response.headers.get("content-type") || "video/mp4",
  });
}

async function fetchWithFourRanges(
  src: string,
  onProgress?: (percent: number) => void,
  onTransferProgress?: TransferProgressFn,
) {
  const probe = await fetch(src, {
    headers: { Range: "bytes=0-0" },
    cache: "no-store",
  });
  const probeRange = parseContentRange(probe.headers.get("content-range"));
  if (probe.body) await probe.body.cancel().catch(() => {});
  if (probe.status !== 206 || !probeRange || probeRange.start !== 0 || probeRange.end !== 0) {
    throw new Error("Range requests are unsupported");
  }

  const total = probeRange.total;
  const ranges = splitByteRanges(total);
  let loaded = 0;
  onProgress?.(0);
  const controller = new AbortController();
  let parts: Blob[];
  try {
    parts = await Promise.all(
      ranges.map(async (range) => {
        const response = await fetch(src, {
          headers: { Range: `bytes=${range.start}-${range.end}` },
          cache: "no-store",
          signal: controller.signal,
        });
        return readRangeResponse(response, range, total, (bytes) => {
          loaded += bytes;
          onTransferProgress?.(loaded, total);
          onProgress?.(Math.min(99, Math.round((loaded / total) * 100)));
        });
      }),
    );
  } catch (error) {
    controller.abort();
    throw error;
  }
  const blob = new Blob(parts, { type: parts[0]?.type || "video/mp4" });
  if (blob.size !== total) throw new Error("Combined range response length was invalid");
  onTransferProgress?.(total, total);
  onProgress?.(100);
  return blob;
}

/** Uses four validated byte ranges, falling back to one streamed request. */
export async function fetchVideoBlob(
  src: string,
  onProgress?: (percent: number) => void,
  fileName?: string,
  onTransferProgress?: TransferProgressFn,
) {
  const downloadSrc = fileName ? attachmentMediaUrl(src, fileName) : src;
  try {
    return await fetchWithFourRanges(downloadSrc, onProgress, onTransferProgress);
  } catch {
    onProgress?.(0);
    onTransferProgress?.(0, 0);
    const response = await fetch(downloadSrc);
    if (!response.ok) throw new Error(`Video download failed (${response.status})`);
    return readResponseWithProgress(response, onProgress, onTransferProgress);
  }
}