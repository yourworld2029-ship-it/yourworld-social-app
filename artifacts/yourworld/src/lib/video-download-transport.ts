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

async function fetchDirect(
  src: string,
  onProgress?: (percent: number) => void,
  onTransferProgress?: TransferProgressFn,
) {
  const response = await fetch(src, { cache: "no-store" });
  if (!response.ok) throw new Error(`Video download failed (${response.status})`);
  onProgress?.(0);
  const blob = await response.blob();
  if (!blob.size) throw new Error("Video download returned an empty file");
  const total = Number(response.headers.get("content-length")) || blob.size;
  onTransferProgress?.(blob.size, total);
  onProgress?.(100);
  return blob;
}

/** Fetches the complete source response in one request. */
export async function fetchVideoBlob(
  src: string,
  onProgress?: (percent: number) => void,
  fileName?: string,
  onTransferProgress?: TransferProgressFn,
) {
  const downloadSrc = fileName ? attachmentMediaUrl(src, fileName) : src;
  return fetchDirect(downloadSrc, onProgress, onTransferProgress);
}