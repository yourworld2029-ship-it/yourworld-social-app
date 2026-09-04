/**
 * Downloads media at original resolution with a small semi-transparent YW
 * logo and the creator's @username watermark burned in.
 */
import {
  VIDEO_QUALITY_TIERS,
  type VideoQualityTier,
} from "@/lib/video-quality";

const VIDEO_DOWNLOAD_CACHE = "yourworld-video-downloads-v1";
const activeVideoDownloads = new Map<string, Promise<void>>();
const serviceWorkerTasks = new Map<
  string,
  {
    cacheKey: string;
    fileName: string;
    onProgress?: (percent: number) => void;
    resolve: (started: boolean) => void;
    reject: (error: Error) => void;
    started: boolean;
    timeout: number;
  }
>();
let serviceWorkerListenerInstalled = false;

function downloadCacheKey(src: string, fileName: string) {
  return `${location.origin}/__yw-video-download/${encodeURIComponent(src)}?name=${encodeURIComponent(fileName)}`;
}

function installServiceWorkerListener() {
  if (serviceWorkerListenerInstalled || !("serviceWorker" in navigator)) return;
  serviceWorkerListenerInstalled = true;
  navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => {
    const data = event.data as {
      type?: string;
      id?: string;
      percent?: number;
      error?: string;
    };
    if (!data.id) return;
    const task = serviceWorkerTasks.get(data.id);
    if (!task) return;
    if (data.type === "yw-video-download-started") {
      task.started = true;
      window.clearTimeout(task.timeout);
    } else if (data.type === "yw-video-download-progress") {
      task.onProgress?.(Math.max(0, Math.min(99, data.percent ?? 0)));
    } else if (data.type === "yw-video-download-error") {
      window.clearTimeout(task.timeout);
      serviceWorkerTasks.delete(data.id);
      if (task.started) task.reject(new Error(data.error || "Video download failed"));
      else task.resolve(false);
    } else if (data.type === "yw-video-download-ready") {
      window.clearTimeout(task.timeout);
      serviceWorkerTasks.delete(data.id);
      task.resolve(true);
    }
  });
}

async function getVideoDownloadWorker() {
  if (!("serviceWorker" in navigator)) return null;
  installServiceWorkerListener();
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    const worker = registration.active ?? registration.waiting ?? registration.installing;
    if (!worker) return null;
    if (worker.state === "installing") {
      await new Promise<void>((resolve) => {
        const timeout = window.setTimeout(resolve, 2_000);
        worker.addEventListener("statechange", () => {
          if (worker.state !== "installing") {
            window.clearTimeout(timeout);
            resolve();
          }
        }, { once: true });
      });
    }
    return registration.active ?? registration.waiting ?? worker;
  } catch {
    return null;
  }
}

async function downloadThroughServiceWorker(
  src: string,
  fileName: string,
  cacheKey: string,
  onProgress?: (percent: number) => void,
) {
  const worker = await getVideoDownloadWorker();
  if (!worker) return false;
  const id = `video-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const started = await new Promise<boolean>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      if (!serviceWorkerTasks.get(id)?.started) {
        serviceWorkerTasks.delete(id);
        resolve(false);
      }
    }, 2_500);
    serviceWorkerTasks.set(id, {
      cacheKey,
      fileName,
      onProgress,
      resolve,
      reject,
      started: false,
      timeout,
    });
    worker.postMessage({
      type: "yw-start-video-download",
      id,
      url: src,
      cacheKey,
      fileName,
    });
  });
  if (!started) return false;

  // The worker resolves its ready message only after CacheStorage contains
  // the complete response. This is the only point where a native save starts.
  const cache = await caches.open(VIDEO_DOWNLOAD_CACHE);
  const cached = await cache.match(cacheKey);
  if (!cached) throw new Error("Completed video download was not found");
  const blob = await cached.blob();
  onProgress?.(100);
  triggerBlobDownload(new Blob([blob], { type: "video/mp4" }), fileName);
  return true;
}

export function sanitizeDownloadName(value: string, fallback: string) {
  const clean = value
    .replace(/[^\p{L}\p{N}\s._-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 90);
  return clean || fallback;
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.type = "video/mp4";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

async function readResponseWithProgress(
  response: Response,
  onProgress?: (percent: number) => void,
) {
  const total = Number(response.headers.get("content-length")) || 0;
  if (!response.body) {
    const blob = await response.blob();
    onProgress?.(100);
    return blob;
  }

  const reader = response.body.getReader();
  const chunks: ArrayBuffer[] = [];
  let loaded = 0;
  onProgress?.(0);
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(
      value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer,
    );
    loaded += value.byteLength;
    if (total > 0) onProgress?.(Math.min(99, Math.round((loaded / total) * 100)));
  }
  onProgress?.(100);
  return new Blob(chunks, { type: "video/mp4" });
}

/**
 * Streams a video without blocking the player, persists the completed bytes
 * in CacheStorage, and triggers a native .mp4 save. The task map is module
 * scoped so route/card unmounts do not cancel an active download.
 */
export async function downloadVideoInBackground(
  src: string,
  fileName: string,
  onProgress?: (percent: number) => void,
) {
  const key = `${src}|${fileName}`;
  const existing = activeVideoDownloads.get(key);
  if (existing) return existing;

  const task = (async () => {
    const cacheKey = downloadCacheKey(src, fileName);
    let blob: Blob | null = null;
    try {
      if ("caches" in window) {
        const cache = await caches.open(VIDEO_DOWNLOAD_CACHE);
        const cached = await cache.match(cacheKey);
        if (cached) {
          blob = await cached.blob();
          onProgress?.(100);
        }
      }

      if (!blob) {
        const handledByServiceWorker = await downloadThroughServiceWorker(
          src,
          fileName,
          cacheKey,
          onProgress,
        );
        if (handledByServiceWorker) return;

        const response = await fetch(src, { cache: "force-cache" });
        if (!response.ok) throw new Error(`Video download failed (${response.status})`);
        blob = await readResponseWithProgress(response, onProgress);
        if ("caches" in window) {
          try {
            const cache = await caches.open(VIDEO_DOWNLOAD_CACHE);
            await cache.put(
              cacheKey,
              new Response(blob, {
                headers: {
                  "Content-Type": "video/mp4",
                  "Cache-Control": "private, max-age=86400",
                },
              }),
            );
          } catch {
            // Quota/private-mode failures must not prevent the native save.
          }
        }
      }

      triggerBlobDownload(new Blob([blob], { type: "video/mp4" }), fileName);
    } finally {
      activeVideoDownloads.delete(key);
    }
  })();

  activeVideoDownloads.set(key, task);
  return task;
}

function recorderMime(audioOnly: boolean) {
  const candidates = audioOnly
    ? ["audio/mpeg", "audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
    : ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/mp4"];
  return candidates.find((mime) => MediaRecorder.isTypeSupported?.(mime)) ?? "";
}

function extensionForMime(mime: string, fallback: "mp4" | "mp3" | "webm") {
  if (mime.includes("mpeg")) return "mp3";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4")) return "mp4";
  return fallback;
}

async function loadVideoForExport(src: string) {
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.playsInline = true;
  video.preload = "auto";
  video.src = src;
  await new Promise<void>((resolve, reject) => {
    video.addEventListener("loadedmetadata", () => resolve(), { once: true });
    video.addEventListener("error", () => reject(new Error("The video could not be read")), { once: true });
    video.load();
  });
  if (!video.duration || !Number.isFinite(video.duration)) {
    throw new Error("The video duration is unavailable");
  }
  return video;
}

function audioContextConstructor() {
  const browserWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext };
  return browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
}

/**
 * Creates a lower-resolution copy in the browser. This keeps the existing
 * signed-URL download path for source quality and only processes when the
 * viewer explicitly chooses a smaller tier.
 */
export async function downloadVideoAtQuality(
  src: string,
  fileNameBase: string,
  quality: VideoQualityTier,
  onProgress?: (percent: number) => void,
) {
  const target = VIDEO_QUALITY_TIERS.find((candidate) => candidate.id === quality);
  if (!target) throw new Error("Unsupported video quality");
  if (typeof MediaRecorder === "undefined" || !HTMLCanvasElement.prototype.captureStream) {
    throw new Error("This browser cannot create a quality-specific video download");
  }
  const video = await loadVideoForExport(src);
  const Ctx = audioContextConstructor();
  if (!Ctx) throw new Error("This browser cannot export video audio");

  const sourceShortSide = Math.min(video.videoWidth, video.videoHeight);
  const scale = Math.min(1, target.shortSide / Math.max(1, sourceShortSide));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.floor((video.videoWidth * scale) / 2) * 2);
  canvas.height = Math.max(2, Math.floor((video.videoHeight * scale) / 2) * 2);
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Canvas unavailable");

  const audioContext = new Ctx();
  const audioDestination = audioContext.createMediaStreamDestination();
  try {
    audioContext.createMediaElementSource(video).connect(audioDestination);
  } catch {
    // Some source files have no audio track; video export can continue.
  }
  const stream = new MediaStream([
    ...canvas.captureStream(30).getVideoTracks(),
    ...audioDestination.stream.getAudioTracks(),
  ]);
  const mime = recorderMime(false);
  const recorder = new MediaRecorder(
    stream,
    mime ? { mimeType: mime, videoBitsPerSecond: target.bitrate, audioBitsPerSecond: 128_000 } : undefined,
  );
  const chunks: BlobPart[] = [];
  let raf = 0;
  const result = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onerror = () => reject(new Error("Video export failed"));
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime || "video/webm" }));
  });
  const draw = () => {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    onProgress?.(Math.min(99, Math.round((video.currentTime / video.duration) * 100)));
    if (!video.ended) raf = requestAnimationFrame(draw);
  };
  const stop = () => {
    if (recorder.state !== "inactive") recorder.stop();
  };
  video.addEventListener("ended", stop, { once: true });
  video.muted = false;
  await audioContext.resume().catch(() => {});
  recorder.start(250);
  await video.play();
  raf = requestAnimationFrame(draw);
  const blob = await result.finally(() => {
    cancelAnimationFrame(raf);
    video.pause();
    void audioContext.close().catch(() => {});
  });
  onProgress?.(100);
  triggerBlobDownload(
    blob,
    `${sanitizeDownloadName(fileNameBase, "yourworld-video")}.${extensionForMime(mime, "webm")}`,
  );
}

/** Extracts an audio-only download. Browsers that support audio/mpeg produce a true MP3. */
export async function downloadAudioOnly(
  src: string,
  fileNameBase: string,
  onProgress?: (percent: number) => void,
) {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("This browser cannot export audio");
  }
  const video = await loadVideoForExport(src);
  const Ctx = audioContextConstructor();
  if (!Ctx) throw new Error("This browser cannot export audio");
  const audioContext = new Ctx();
  const destination = audioContext.createMediaStreamDestination();
  audioContext.createMediaElementSource(video).connect(destination);
  const mime = recorderMime(true);
  const recorder = new MediaRecorder(
    destination.stream,
    mime ? { mimeType: mime, audioBitsPerSecond: 128_000 } : undefined,
  );
  const chunks: BlobPart[] = [];
  const result = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onerror = () => reject(new Error("Audio export failed"));
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime || "audio/webm" }));
  });
  const update = () => {
    onProgress?.(Math.min(99, Math.round((video.currentTime / video.duration) * 100)));
  };
  const stop = () => {
    video.removeEventListener("timeupdate", update);
    if (recorder.state !== "inactive") recorder.stop();
  };
  video.addEventListener("timeupdate", update);
  video.addEventListener("ended", stop, { once: true });
  await audioContext.resume().catch(() => {});
  recorder.start(250);
  await video.play();
  const blob = await result.finally(() => {
    video.pause();
    void audioContext.close().catch(() => {});
  });
  onProgress?.(100);
  triggerBlobDownload(
    blob,
    `${sanitizeDownloadName(fileNameBase, "yourworld-audio")}.${extensionForMime(mime, "webm")}`,
  );
}

export async function downloadWithWatermark(src: string, username: string, fileName: string) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.drawImage(img, 0, 0);

  const unit = Math.max(canvas.width, canvas.height) * 0.032;
  const pad = unit * 0.9;
  const x = pad;
  const y = canvas.height - pad;

  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = unit * 0.5;

  // YW mark
  ctx.font = `700 ${unit}px Sora, system-ui, sans-serif`;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("YW", x, y);
  const markWidth = ctx.measureText("YW").width;

  // creator handle
  ctx.globalAlpha = 0.45;
  ctx.font = `600 ${unit * 0.62}px Manrope, system-ui, sans-serif`;
  ctx.fillText(`@${username}`, x + markWidth + unit * 0.4, y);
  ctx.restore();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.98),
  );
  if (!blob) throw new Error("Export failed");

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
/** Generic saver for any media (video/audio/photo) — keeps original bytes. */
export async function downloadMedia(src: string, fileName: string) {
  const blob = await (await fetch(src, { cache: "force-cache" })).blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

/** Photo → watermarked jpg, anything else → raw file. */
export async function downloadMomentMedia(
  src: string,
  kind: "photo" | "video" | "text",
  username: string,
  id: string,
) {
  if (kind === "photo") {
    try {
      await downloadWithWatermark(src, username, `yw-moment-${id}.jpg`);
      return;
    } catch {
      /* fall through to raw download */
    }
  }
  await downloadMedia(src, `yw-moment-${id}.${kind === "video" ? "mp4" : "jpg"}`);
}
