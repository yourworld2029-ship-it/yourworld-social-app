function mediaPath(url: string) {
  try {
    return decodeURIComponent(new URL(url, "https://media.invalid").pathname).toLowerCase();
  } catch {
    const path = url.split(/[?#]/, 1)[0] ?? "";
    try {
      return decodeURIComponent(path).toLowerCase();
    } catch {
      return path.toLowerCase();
    }
  }
}

export function isHlsMediaUrl(url: string, contentType?: string | null) {
  const mimeType = contentType?.split(";", 1)[0]?.trim().toLowerCase();
  if (
    mimeType === "application/vnd.apple.mpegurl" ||
    mimeType === "application/x-mpegurl" ||
    mimeType === "audio/mpegurl" ||
    mimeType === "audio/x-mpegurl"
  ) {
    return true;
  }
  const path = mediaPath(url);
  return /\.m3u8$/i.test(path) || /\/manifest\/video\.m3u8$/i.test(path);
}

/** Prefer a Reel's playable media_url; video_url is normally a retained storage source. */
export function reelPlaybackSource(mediaUrl: unknown, retainedSource: unknown) {
  const playbackUrl = typeof mediaUrl === "string" ? mediaUrl.trim() : "";
  if (playbackUrl) return playbackUrl;
  const source = typeof retainedSource === "string" ? retainedSource.trim() : "";
  if (!source) return null;
  return source.replace(/^reels\//i, "");
}

export function isValidMp4RangeResponse(
  status: number,
  contentType: string | null,
  contentRange: string | null,
) {
  const mimeType = contentType?.split(";", 1)[0]?.trim().toLowerCase();
  if (status !== 206 || mimeType !== "video/mp4") return false;
  return !contentRange || /^bytes\s+0-1\/(?:\d+|\*)$/i.test(contentRange.trim());
}

export function safeMediaUrlForLog(value: string) {
  try {
    const url = new URL(value, "https://media.invalid");
    if (url.protocol === "blob:" || url.protocol === "data:") return url.protocol;
    return `${url.origin === "https://media.invalid" ? "" : url.origin}${url.pathname}`;
  } catch {
    return (value.split(/[?#]/, 1)[0] ?? "").slice(0, 240);
  }
}

export function supportsNativeHls(video: Pick<HTMLVideoElement, "canPlayType">) {
  return Boolean(
    video.canPlayType("application/vnd.apple.mpegurl") ||
      video.canPlayType("application/x-mpegURL"),
  );
}

export type NativeVideoSupport = "probably" | "maybe" | "unsupported" | "unknown";

const VIDEO_CODEC_TYPES = {
  av1Mp4: [
    'video/mp4; codecs="av01.0.08M.08"',
    'video/mp4;codecs="av01.0.08M.08"',
  ],
  h264Mp4: [
    'video/mp4; codecs="avc1.42E01E"',
    'video/mp4; codecs="avc1.4D401F"',
    'video/mp4; codecs="avc1.640028"',
    "video/mp4",
  ],
  webm: [
    'video/webm; codecs="vp9"',
    'video/webm; codecs="vp8"',
    'video/webm; codecs="av01.0.08M.08"',
    "video/webm",
  ],
} as const;

export function detectNativeVideoSupport(
  video: Pick<HTMLVideoElement, "canPlayType">,
  url: string,
): NativeVideoSupport {
  const path = mediaPath(url);
  if (isHlsMediaUrl(url)) {
    const hlsResult =
      video.canPlayType("application/vnd.apple.mpegurl") ||
      video.canPlayType("application/x-mpegURL");
    return hlsResult === "probably" || hlsResult === "maybe" ? hlsResult : "unsupported";
  }

  const candidates = /\.webm$/i.test(path)
    ? VIDEO_CODEC_TYPES.webm
    : /\.mp4$/i.test(path)
      ? [...VIDEO_CODEC_TYPES.h264Mp4, ...VIDEO_CODEC_TYPES.av1Mp4]
      : null;
  if (!candidates) return "unknown";

  let sawMaybe = false;
  for (const mimeType of candidates) {
    const result = video.canPlayType(mimeType);
    if (result === "probably") return "probably";
    if (result === "maybe") sawMaybe = true;
  }
  return sawMaybe ? "maybe" : "unsupported";
}

export function isPlayableMediaUrl(url: string) {
  return /^(?:https?:|blob:|data:)/i.test(url);
}

export function firstPlayablePlaybackFallback(
  sourceUrl: string,
  fallbackUrls: readonly string[] | undefined,
) {
  return (
    fallbackUrls?.find(
      (url) => url !== sourceUrl && isPlayableMediaUrl(url),
    ) ?? null
  );
}

export function canAutoplayPublicVideo(access: string | undefined, price?: number | null) {
  return access === "public" && Number(price ?? 0) <= 0;
}

export function mediaErrorName(error: unknown) {
  if (!error || typeof error !== "object" || !("name" in error)) return "";
  return typeof error.name === "string" ? error.name : "";
}

export function isAutoplayPolicyError(error: unknown) {
  return mediaErrorName(error) === "NotAllowedError";
}

export function attemptVideoPlay(
  video: Pick<HTMLVideoElement, "play">,
): Promise<void> {
  try {
    return Promise.resolve(video.play()).then(() => undefined);
  } catch (error) {
    return Promise.reject(error);
  }
}