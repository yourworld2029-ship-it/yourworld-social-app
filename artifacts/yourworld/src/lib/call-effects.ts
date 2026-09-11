export type CallVideoEffect = "none" | "beauty" | "vivid" | "mono";

export const CALL_VIDEO_EFFECTS: Array<{ value: CallVideoEffect; label: string }> = [
  { value: "none", label: "None" },
  { value: "beauty", label: "Beauty" },
  { value: "vivid", label: "Vivid" },
  { value: "mono", label: "Mono" },
];

type VideoFrameCallbackVideoElement = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: () => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

export type CallVideoEffectPipeline = {
  track: MediaStreamTrack;
  stop: () => void;
};

/**
 * Produces a processed video track for the peer connection, rather than only
 * styling the local preview. Canvas capture is intentionally progressive:
 * browsers without captureStream continue to use the unprocessed camera track.
 */
export async function createCallVideoEffect(
  source: MediaStreamTrack,
  effect: Exclude<CallVideoEffect, "none">,
): Promise<CallVideoEffectPipeline | null> {
  if (typeof document === "undefined" || typeof HTMLCanvasElement === "undefined") return null;
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
    video.remove();
    return null;
  }

  const width = Math.max(320, video.videoWidth || 1280);
  const height = Math.max(240, video.videoHeight || 720);
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const captureStream = (
    canvas as HTMLCanvasElement & { captureStream?: (frameRate?: number) => MediaStream }
  ).captureStream?.(30);
  if (!context || !captureStream) {
    video.pause();
    video.srcObject = null;
    video.remove();
    return null;
  }

  const filters: Record<Exclude<CallVideoEffect, "none">, string> = {
    beauty: "blur(0.65px) saturate(1.08) brightness(1.04)",
    vivid: "saturate(1.28) contrast(1.08) brightness(1.02)",
    mono: "grayscale(1) contrast(1.08)",
  };
  let stopped = false;
  let frameHandle: number | null = null;
  let intervalHandle: number | null = null;

  const draw = () => {
    if (stopped) return;
    context.filter = filters[effect];
    context.drawImage(video, 0, 0, width, height);
    context.filter = "none";
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
    return null;
  }
  track.contentHint = "motion";

  return {
    track,
    stop: () => {
      stopped = true;
      if (intervalHandle !== null) window.clearInterval(intervalHandle);
      if (frameHandle !== null && video.cancelVideoFrameCallback) {
        video.cancelVideoFrameCallback(frameHandle);
      }
      track.stop();
      captureStream.getTracks().forEach((item) => item.stop());
      video.pause();
      video.srcObject = null;
      video.remove();
    },
  };
}
