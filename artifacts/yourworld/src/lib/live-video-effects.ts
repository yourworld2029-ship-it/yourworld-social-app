export const LIVE_BEAUTY_EFFECTS = [
  { value: "natural", label: "Natural" },
  { value: "smooth", label: "Smooth" },
  { value: "bright", label: "Bright" },
  { value: "glow", label: "Glow" },
  { value: "soft-beauty", label: "Soft Beauty" },
  { value: "warm-tone", label: "Warm Tone" },
] as const;

export type LiveBeautyEffect =
  | "off"
  | (typeof LIVE_BEAUTY_EFFECTS)[number]["value"];

export type LiveBeautySettings = {
  effect: LiveBeautyEffect;
  intensity: number;
};

export type LiveVideoEffectPipeline = {
  track: MediaStreamTrack;
  sourceTrackId: string;
  setSettings: (settings: LiveBeautySettings) => void;
  stop: () => void;
};

function normalizeIntensity(intensity: number) {
  return Math.max(0, Math.min(100, intensity)) / 100;
}

export function getLiveBeautyFilter(effect: LiveBeautyEffect, intensity: number) {
  const amount = normalizeIntensity(intensity);
  if (effect === "off" || amount === 0) return "none";

  switch (effect) {
    case "natural":
      return `brightness(${1 + amount * 0.025}) saturate(${1 + amount * 0.035})`;
    case "smooth":
      return `brightness(${1 + amount * 0.045}) contrast(${1 - amount * 0.075}) saturate(${1 + amount * 0.055})`;
    case "bright":
      return `brightness(${1 + amount * 0.18}) contrast(${1 + amount * 0.015}) saturate(${1 + amount * 0.06})`;
    case "glow":
      return `brightness(${1 + amount * 0.11}) contrast(${1 - amount * 0.025}) saturate(${1 + amount * 0.09})`;
    case "soft-beauty":
      return `blur(${amount * 0.8}px) brightness(${1 + amount * 0.05}) contrast(${1 - amount * 0.075}) saturate(${1 + amount * 0.04})`;
    case "warm-tone":
      return `sepia(${amount * 0.22}) saturate(${1 + amount * 0.08}) brightness(${1 + amount * 0.025})`;
    default:
      return "none";
  }
}

type VideoFrameCallbackVideoElement = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: () => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

export async function createLiveVideoEffect(
  source: MediaStreamTrack,
  settings: LiveBeautySettings,
): Promise<LiveVideoEffectPipeline | null> {
  if (
    typeof document === "undefined" ||
    typeof HTMLCanvasElement === "undefined" ||
    source.readyState !== "live"
  ) {
    return null;
  }

  const canvas = document.createElement("canvas");
  const video = document.createElement("video") as VideoFrameCallbackVideoElement;
  const sourceStream = new MediaStream([source]);
  video.srcObject = sourceStream;
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("aria-hidden", "true");
  video.style.position = "fixed";
  video.style.left = "-10000px";
  video.style.width = "1px";
  video.style.height = "1px";
  document.body.appendChild(video);

  try {
    await video.play();
  } catch {
    video.srcObject = null;
    video.remove();
    return null;
  }

  const width = Math.max(320, video.videoWidth || source.getSettings().width || 1280);
  const height = Math.max(240, video.videoHeight || source.getSettings().height || 720);
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  const captureStream = (
    canvas as HTMLCanvasElement & { captureStream?: (frameRate?: number) => MediaStream }
  ).captureStream?.(30);

  if (!context || !captureStream || !("filter" in context)) {
    video.pause();
    video.srcObject = null;
    video.remove();
    captureStream?.getTracks().forEach((track) => track.stop());
    return null;
  }

  let currentSettings = settings;
  let stopped = false;
  let frameHandle: number | null = null;
  let intervalHandle: number | null = null;

  const draw = () => {
    if (stopped) return;
    if (video.readyState >= 2 && video.videoWidth > 0) {
      const intensity = normalizeIntensity(currentSettings.intensity);
      if (currentSettings.effect === "glow" && intensity > 0) {
        context.save();
        context.globalAlpha = 0.12 + intensity * 0.18;
        context.filter = `blur(${2 + intensity * 5}px) brightness(${1.1 + intensity * 0.3})`;
        context.drawImage(video, 0, 0, width, height);
        context.restore();
      }
      context.filter = getLiveBeautyFilter(
        currentSettings.effect,
        currentSettings.intensity,
      );
      context.drawImage(video, 0, 0, width, height);
      context.filter = "none";
    }
    if (video.requestVideoFrameCallback) {
      frameHandle = video.requestVideoFrameCallback(draw);
    }
  };

  if (video.requestVideoFrameCallback) {
    frameHandle = video.requestVideoFrameCallback(draw);
  } else {
    intervalHandle = window.setInterval(draw, 33);
  }

  const track = captureStream.getVideoTracks()[0];
  if (!track) {
    video.pause();
    video.srcObject = null;
    video.remove();
    captureStream.getTracks().forEach((item) => item.stop());
    return null;
  }
  track.contentHint = "motion";

  return {
    track,
    sourceTrackId: source.id,
    setSettings: (nextSettings) => {
      currentSettings = nextSettings;
    },
    stop: () => {
      if (stopped) return;
      stopped = true;
      if (intervalHandle !== null) window.clearInterval(intervalHandle);
      if (frameHandle !== null && video.cancelVideoFrameCallback) {
        video.cancelVideoFrameCallback(frameHandle);
      }
      captureStream.getTracks().forEach((item) => item.stop());
      video.pause();
      video.srcObject = null;
      video.remove();
    },
  };
}
