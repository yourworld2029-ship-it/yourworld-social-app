/**
 * Bakes the selected music track into the exported reel.
 *
 * Plays the clip in real time, draws every frame to a canvas and mixes the
 * clip's own audio with the trimmed music through the Web Audio API, then
 * records the combined stream with MediaRecorder.
 */
import {
  MAX_REEL_DURATION_SECONDS,
  MIN_REEL_DURATION_SECONDS,
} from "@/lib/reel-editor";

export type MuxMusic = {
  url: string;
  /** where the music starts on the video timeline (seconds) */
  start: number;
  /** trim window inside the song */
  clipStart: number;
  clipEnd: number;
  /** 0..1 */
  volume?: number;
};

export type MuxOptions = {
  videoUrl: string;
  trimStart?: number;
  trimEnd?: number;
  music?: MuxMusic;
  resolution?: "HD" | "4K";
  fps?: 30 | 60;
  speed?: number;
  speedRamp?: "constant" | "up" | "down";
  filter?: "none" | "vivid" | "noir" | "cyber" | "warm";
  contrast?: number;
  saturation?: number;
  warmth?: number;
  grain?: number;
  onProgress?: (pct: number) => void;
};

type AudioContextWindow = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

function getAudioContextConstructor() {
  const browserWindow = window as AudioContextWindow;
  return browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
}

function pickMime(): string | undefined {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/mp4",
    "video/webm",
  ];
  return candidates.find((m) => MediaRecorder.isTypeSupported?.(m));
}

export function getReelRenderCapabilities() {
  const canCapture = typeof HTMLCanvasElement !== "undefined" &&
    typeof HTMLCanvasElement.prototype.captureStream === "function";
  const hasWebCodecs = typeof window !== "undefined" &&
    "VideoEncoder" in window &&
    "VideoFrame" in window;
  return {
    canCapture,
    mediaRecorder: typeof MediaRecorder !== "undefined",
    webCodecs: hasWebCodecs,
    preferredEncoder: hasWebCodecs ? "webcodecs" as const : "media-recorder" as const,
  };
}

export function canMuxReel(): boolean {
  const capabilities = getReelRenderCapabilities();
  return (
    typeof window !== "undefined" &&
    capabilities.mediaRecorder &&
    !!getAudioContextConstructor() &&
    capabilities.canCapture
  );
}

/** Returns an object URL of the rendered video (with music), or null on failure. */
export async function renderReelWithMusic(opts: MuxOptions): Promise<string | null> {
  if (!canMuxReel()) return null;
  const { videoUrl, music } = opts;

  const video = document.createElement("video");
  video.src = videoUrl;
  video.crossOrigin = "anonymous";
  video.playsInline = true;
  video.muted = true;
  video.preload = "auto";

  const audio = music ? new Audio() : null;
  if (audio && music) {
    audio.src = music.url;
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
  }

  const Ctx = getAudioContextConstructor();
  if (!Ctx) return null;
  const actx = new Ctx();
  let recorder: MediaRecorder | null = null;

  const cleanup = () => {
    try {
      if (recorder?.state !== "inactive") recorder?.stop();
    } catch {
      /* noop */
    }
    try { video.pause(); } catch { /* noop */ }
      try { audio?.pause(); } catch { /* noop */ }
    void actx.close().catch(() => {});
  };

  try {
    await new Promise<void>((resolve, reject) => {
      const ok = () => resolve();
      video.addEventListener("loadedmetadata", ok, { once: true });
      video.addEventListener("error", () => reject(new Error("video load")), { once: true });
      video.load();
    });
    if (audio) {
      await new Promise<void>((resolve) => {
        if (audio.readyState >= 1) return resolve();
        audio.addEventListener("loadedmetadata", () => resolve(), { once: true });
        audio.addEventListener("error", () => resolve(), { once: true });
        audio.load();
      });
    }

    const start = Math.max(0, opts.trimStart ?? 0);
    const requestedEnd = opts.trimEnd;
    const end = Math.min(
      video.duration || 0,
      start + MAX_REEL_DURATION_SECONDS,
      requestedEnd != null && requestedEnd > start ? requestedEnd : video.duration || 0,
    );
    const span = Math.max(0.2, end - start);
    if (span < MIN_REEL_DURATION_SECONDS) {
      throw new Error("Reel duration is below the minimum");
    }

    const sourceWidth = video.videoWidth || 720;
    const sourceHeight = video.videoHeight || 1280;
    const landscape = sourceWidth >= sourceHeight;
    const maxDimension = opts.resolution === "HD" ? 1920 : 3840;
    const maxShortDimension = opts.resolution === "HD" ? 1080 : 2160;
    const scale = landscape
      ? Math.min(maxDimension / sourceWidth, maxShortDimension / sourceHeight)
      : Math.min(maxShortDimension / sourceWidth, maxDimension / sourceHeight);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(2, Math.round(sourceWidth * scale));
    canvas.height = Math.max(2, Math.round(sourceHeight * scale));
    const g = canvas.getContext("2d", { alpha: false });
    if (!g) throw new Error("no canvas ctx");

    const dest = actx.createMediaStreamDestination();

    // clip's own audio
    try {
      const vSrc = actx.createMediaElementSource(video);
      const vGain = actx.createGain();
      vGain.gain.value = 0.85;
      vSrc.connect(vGain).connect(dest);
    } catch { /* video may have no audio track */ }

    // music
    if (audio && music) {
      const aSrc = actx.createMediaElementSource(audio);
      const aGain = actx.createGain();
      aGain.gain.value = music.volume ?? 1;
      aSrc.connect(aGain).connect(dest);
    }

    const fps = opts.fps ?? 60;
    const stream = new MediaStream([
      ...canvas.captureStream(fps).getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ]);

    const mime = pickMime();
    recorder = new MediaRecorder(
      stream,
      mime
        ? {
            mimeType: mime,
            videoBitsPerSecond: opts.resolution === "HD" ? 18_000_000 : 50_000_000,
            audioBitsPerSecond: 256_000,
          }
        : undefined,
    );
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise<Blob>((resolve) => {
      recorder!.onstop = () => resolve(new Blob(chunks, { type: mime || "video/webm" }));
    });

    video.currentTime = start;
    await new Promise<void>((r) => video.addEventListener("seeked", () => r(), { once: true }));

    const speed = Math.min(10, Math.max(0.1, opts.speed ?? 1));
    const ramp = opts.speedRamp ?? "constant";
    const playbackRateAt = () => {
      const progress = Math.min(1, Math.max(0, (video.currentTime - start) / span));
      if (ramp === "up") return 0.1 + (speed - 0.1) * progress;
      if (ramp === "down") return speed - (speed - 0.1) * progress;
      return speed;
    };
    video.playbackRate = speed;
    const videoWithPitch = video as HTMLVideoElement & { preservesPitch?: boolean; webkitPreservesPitch?: boolean };
    if ("preservesPitch" in videoWithPitch) videoWithPitch.preservesPitch = true;
    if ("webkitPreservesPitch" in videoWithPitch) videoWithPitch.webkitPreservesPitch = true;
    if (audio) {
      audio.playbackRate = speed;
      const audioWithPitch = audio as HTMLAudioElement & { preservesPitch?: boolean; webkitPreservesPitch?: boolean };
      if ("preservesPitch" in audioWithPitch) audioWithPitch.preservesPitch = true;
      if ("webkitPreservesPitch" in audioWithPitch) audioWithPitch.webkitPreservesPitch = true;
    }
    await actx.resume().catch(() => {});
    recorder.start(200);
    await video.play();

    // music scheduling relative to the clip window
    const musicSpan = music ? Math.max(0.2, music.clipEnd - music.clipStart) : 0;
    const filter = opts.filter ?? "none";
    const gradingFilter = [
      filter === "vivid" ? "saturate(1.35) contrast(1.08)" :
      filter === "noir" ? "grayscale(1) contrast(1.16)" :
      filter === "cyber" ? "saturate(1.35) hue-rotate(65deg) contrast(1.12)" :
      filter === "warm" ? "sepia(0.22) saturate(1.15) brightness(1.03)" : "",
      `contrast(${opts.contrast ?? 1})`,
      `saturate(${opts.saturation ?? 1})`,
      opts.warmth ? `sepia(${Math.min(1, Math.abs(opts.warmth) * 0.28)})` : "",
      opts.warmth && opts.warmth < 0 ? "hue-rotate(180deg)" : "",
    ].filter(Boolean).join(" ");
    const grainCanvas = document.createElement("canvas");
    grainCanvas.width = 64;
    grainCanvas.height = 64;
    const grainContext = grainCanvas.getContext("2d");
    if (grainContext) {
      const pixels = grainContext.createImageData(64, 64);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const value = Math.random() > 0.5 ? 255 : 0;
        pixels.data[i] = value;
        pixels.data[i + 1] = value;
        pixels.data[i + 2] = value;
        pixels.data[i + 3] = 255;
      }
      grainContext.putImageData(pixels, 0, 0);
    }
    const grainPattern = grainContext ? g.createPattern(grainCanvas, "repeat") : null;
    let musicOn = false;
    let raf = 0;
    const draw = () => {
      g.filter = gradingFilter || "none";
      g.drawImage(video, 0, 0, canvas.width, canvas.height);
      g.filter = "none";
      if (grainPattern && (opts.grain ?? 0) > 0) {
        g.globalAlpha = Math.min(0.16, (opts.grain ?? 0) * 0.9);
        g.fillStyle = grainPattern;
        g.fillRect(0, 0, canvas.width, canvas.height);
        g.globalAlpha = 1;
      }
      const currentRate = playbackRateAt();
      video.playbackRate = currentRate;
      if (audio) audio.playbackRate = currentRate;
      const elapsed = (video.currentTime - start) / Math.max(0.1, currentRate);
      const rel = music ? elapsed - Math.max(0, music.start - start) : -1;
      if (audio && music && rel >= 0 && rel <= musicSpan) {
        const t = music.clipStart + rel * speed;
        if (!musicOn) {
          musicOn = true;
          try { audio.currentTime = t; } catch { /* noop */ }
          void audio.play().catch(() => {});
        } else if (Math.abs(audio.currentTime - t) > 0.35) {
          try { audio.currentTime = t; } catch { /* noop */ }
        }
      } else if (musicOn && audio) {
        musicOn = false;
        audio.pause();
      }
      opts.onProgress?.(Math.min(99, (elapsed / (span / speed)) * 100));
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    await new Promise<void>((resolve) => {
      let tick: number | null = null;
      const startedAt = performance.now();
      const stop = () => {
        video.removeEventListener("ended", stop);
        if (tick !== null) window.clearInterval(tick);
        resolve();
      };
      video.addEventListener("ended", stop);
      tick = window.setInterval(() => {
        const outputElapsed = (performance.now() - startedAt) / 1000;
        if (
          video.currentTime >= end - 0.05 ||
          outputElapsed >= MAX_REEL_DURATION_SECONDS
        ) {
          stop();
        }
      }, 100);
    });

    cancelAnimationFrame(raf);
    video.pause();
    audio?.pause();
    recorder.stop();
    const blob = await done;
    void actx.close().catch(() => {});
    opts.onProgress?.(100);
    if (!blob.size) return null;
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Reel music render failed", error);
    cleanup();
    return null;
  }
}

export const renderReel = renderReelWithMusic;
