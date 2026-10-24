const FASTSTART_BUCKETS = new Set(["videos", "reels", "moments"]);

export function shouldRunServerFastStart(options: {
  bucket: string;
  contentType: string;
  cloudflareStream: boolean;
}) {
  if (
    !options.contentType.toLowerCase().startsWith("video/") ||
    !FASTSTART_BUCKETS.has(options.bucket)
  ) {
    return false;
  }

  // Long Videos use Cloudflare Stream for playback preparation. Remuxing the
  // same large file synchronously in the API adds a second heavy server pass.
  if (options.bucket === "videos" && options.cloudflareStream) return false;

  return true;
}
