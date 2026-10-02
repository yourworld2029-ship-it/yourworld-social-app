export function isHlsMediaUrl(url: string) {
  return /\.m3u8(?:$|[?#])/i.test(url);
}

export function supportsNativeHls(video: Pick<HTMLVideoElement, "canPlayType">) {
  return Boolean(
    video.canPlayType("application/vnd.apple.mpegurl") ||
      video.canPlayType("application/x-mpegURL"),
  );
}

export function isPlayableMediaUrl(url: string) {
  return /^(?:https?:|blob:|data:)/i.test(url);
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