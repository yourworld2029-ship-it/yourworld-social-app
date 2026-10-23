export const MAX_REEL_VIDEO_BYTES = 500 * 1024 * 1024;
export const MAX_LONG_VIDEO_BYTES = 2_000_000_000;

export function getVideoUploadSizeError(
  bucket: string,
  contentType: string,
  sizeBytes: number,
): string | null {
  if (!contentType.toLowerCase().startsWith("video/")) return null;

  if (bucket === "reels" && sizeBytes > MAX_REEL_VIDEO_BYTES) {
    return "Reels support videos up to 500 MiB. For larger videos, use Videos upload.";
  }
  if (bucket === "videos" && sizeBytes > MAX_LONG_VIDEO_BYTES) {
    return "Videos must be 2 GB or smaller.";
  }
  return null;
}

export function getReelVideoSizeError(sizeBytes: number) {
  return getVideoUploadSizeError("reels", "video/mp4", sizeBytes);
}
