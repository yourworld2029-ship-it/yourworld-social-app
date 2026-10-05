import { isValidMp4RangeResponse } from "@/lib/video-playback-engine";

export async function verifyRangedMp4PlaybackUrl(
  url: string,
  request: typeof fetch = fetch,
) {
  const response = await request(url, {
    method: "GET",
    headers: { Range: "bytes=0-1" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const contentType = response.headers.get("content-type");
  const contentRange = response.headers.get("content-range");
  const isValid = isValidMp4RangeResponse(response.status, contentType, contentRange);
  await response.body?.cancel().catch(() => undefined);
  if (!isValid) {
    throw new Error(
      `Storage playback requires video/mp4 and byte-range support (received ${response.status}, ${contentType ?? "unknown MIME type"}).`,
    );
  }
  return url;
}
