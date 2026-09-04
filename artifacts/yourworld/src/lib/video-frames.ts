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
