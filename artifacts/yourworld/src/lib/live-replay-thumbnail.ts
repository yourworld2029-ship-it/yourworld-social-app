const MAX_POSTER_DIMENSION = 1280;

export function getLiveReplayPosterDimensions(
  width: number,
  height: number,
  maxDimension = MAX_POSTER_DIMENSION,
) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(maxDimension) ||
    width <= 0 ||
    height <= 0 ||
    maxDimension <= 0
  ) {
    return { width: 0, height: 0 };
  }
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export async function createLiveReplayPoster(source: Blob | string): Promise<Blob | null> {
  if (typeof document === "undefined" || typeof URL === "undefined") return null;

  const video = document.createElement("video");
  const canvas = document.createElement("canvas");
  const objectUrl = source instanceof Blob ? URL.createObjectURL(source) : null;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  if (!objectUrl) video.crossOrigin = "anonymous";

  try {
    const loaded = new Promise<boolean>((resolve) => {
      let timeout = 0;
      const cleanup = () => {
        window.clearTimeout(timeout);
        video.removeEventListener("loadeddata", onLoaded);
        video.removeEventListener("error", onError);
      };
      const onLoaded = () => {
        cleanup();
        resolve(video.videoWidth > 0 && video.videoHeight > 0);
      };
      const onError = () => {
        cleanup();
        resolve(false);
      };
      video.addEventListener("loadeddata", onLoaded, { once: true });
      video.addEventListener("error", onError, { once: true });
      timeout = window.setTimeout(onError, 15000);
    });

    video.src = objectUrl ?? source as string;
    video.load();
    if (!(await loaded)) return null;

    const size = getLiveReplayPosterDimensions(video.videoWidth, video.videoHeight);
    if (!size.width || !size.height) return null;
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return null;
    context.drawImage(video, 0, 0, size.width, size.height);
    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.88);
    });
  } catch {
    return null;
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}
