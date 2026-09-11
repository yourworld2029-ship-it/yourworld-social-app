/** Samples a few JPEG frames from a local video URL for automated content scanning. */
export async function sampleVideoFrames(src: string, count = 3): Promise<string[]> {
  if (typeof document === "undefined" || !src) return [];

  const video = document.createElement("video");
  video.src = src;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  video.preload = "auto";

  const ready = await new Promise<boolean>((resolve) => {
    let settled = false;
    const timeout = window.setTimeout(() => finish(false), 8000);
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      video.removeEventListener("loadedmetadata", onMetadata);
      video.removeEventListener("error", onError);
      resolve(ok);
    };
    const onMetadata = () => finish(true);
    const onError = () => finish(false);
    video.addEventListener("loadedmetadata", onMetadata, { once: true });
    video.addEventListener("error", onError, { once: true });
  });

  try {
    if (!ready || !isFinite(video.duration) || video.duration <= 0) return [];

    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 640 / Math.max(video.videoWidth || 640, 1));
    canvas.width = Math.max(2, Math.round((video.videoWidth || 640) * scale));
    canvas.height = Math.max(2, Math.round((video.videoHeight || 360) * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];

    const frames: string[] = [];
    for (let i = 1; i <= count; i++) {
      const t = (video.duration * i) / (count + 1);
      const seeked = await new Promise<boolean>((resolve) => {
        let settled = false;
        const timeout = window.setTimeout(() => finish(false), 6000);
        const finish = (ok: boolean) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          video.removeEventListener("seeked", onSeeked);
          video.removeEventListener("error", onError);
          resolve(ok);
        };
        const onSeeked = () => finish(true);
        const onError = () => finish(false);
        video.addEventListener("seeked", onSeeked, { once: true });
        video.addEventListener("error", onError, { once: true });
        try {
          video.currentTime = Math.min(t, Math.max(0, video.duration - 0.1));
        } catch {
          finish(false);
          return;
        }
      });
      if (!seeked) break;
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        const base64 = dataUrl.split(",")[1];
        if (base64) frames.push(base64);
      } catch {
        break;
      }
    }
    return frames;
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
  }
}

/**
 * Creates a durable JPEG poster from a local video file.
 *
 * This intentionally samples at 1.0 seconds instead of the first frame:
 * opening frames are often black, contain a fade-in, or have not rendered a
 * useful subject yet. Callers can upload the returned Blob to storage.
 */
export async function generateVideoThumbnail(
  videoFile: Blob,
  requestedTime = 1.0,
): Promise<Blob | null> {
  if (typeof document === "undefined" || !videoFile.size) return null;

  const video = document.createElement("video");
  const objectUrl = URL.createObjectURL(videoFile);
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  video.src = objectUrl;

  const waitFor = (
    eventName: "loadedmetadata" | "seeked",
    timeoutMs: number,
  ) =>
    new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (ok: boolean) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        video.removeEventListener(eventName, onEvent);
        video.removeEventListener("error", onError);
        resolve(ok);
      };
      const onEvent = () => finish(true);
      const onError = () => finish(false);
      const timeout = window.setTimeout(() => finish(false), timeoutMs);
      video.addEventListener(eventName, onEvent, { once: true });
      video.addEventListener("error", onError, { once: true });
    });

  try {
    if (!(await waitFor("loadedmetadata", 8_000))) return null;
    if (!Number.isFinite(video.duration) || video.duration <= 0) return null;

    const target = Math.min(
      Math.max(0, requestedTime),
      Math.max(0, video.duration - 0.1),
    );
    try {
      video.currentTime = target;
    } catch {
      return null;
    }
    if (!(await waitFor("seeked", 8_000))) return null;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 360;
    const scale = Math.min(1, 1280 / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(2, Math.round(width * scale));
    canvas.height = Math.max(2, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.85);
    });
  } catch (error) {
    console.warn("Could not generate video thumbnail", error);
    return null;
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}
