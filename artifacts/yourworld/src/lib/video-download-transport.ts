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
  const response = await fetch(src, { method: "GET", cache: "no-store" });
  if (!response.ok) throw new Error(`Video download failed (${response.status})`);
  if (response.status === 206) {
    throw new Error("Video server returned a partial response");
  }
  return responseToBlob(response, onProgress, onTransferProgress);
}

/** Downloads the complete source in one ordinary GET for offline storage. */
export async function fetchVideoBlob(
  src: string,
  onProgress?: (percent: number) => void,
  fileName?: string,
  onTransferProgress?: TransferProgressFn,
) {
  const downloadSrc = fileName ? attachmentMediaUrl(src, fileName) : src;
  onProgress?.(0);
  return fetchDirect(downloadSrc, onProgress, onTransferProgress);
}