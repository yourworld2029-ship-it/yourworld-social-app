import type { ProgressFn } from "@/lib/storage-upload";

const OPTIMIZING_LABEL = "Optimizing Video for Ultra-Fast Upload...";
const MAX_PRESERVED_DIMENSION = 3_840;

export type VideoMetadata = {
  width: number;
  height: number;
  duration: number;
};

function supportedMimeType() {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

export function readVideoMetadata(blobUrl: string): Promise<VideoMetadata | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    let timeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      cleanup();
      resolve(null);
    }, 15_000);
    const cleanup = () => {
      if (timeout) clearTimeout(timeout);
      timeout = null;
      video.removeAttribute("src");
      try {
        video.load();
      } catch {
        // The element is disposable.
      }
    };
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => {
      const duration = video.duration;
      if (
        !Number.isFinite(duration) ||
        duration <= 0 ||
        !video.videoWidth ||
        !video.videoHeight
      ) {
        cleanup();
        resolve(null);
        return;
      }
      const metadata = { width: video.videoWidth, height: video.videoHeight, duration };
      cleanup();
      resolve(metadata);
    };
    video.onerror = () => {
      cleanup();
      resolve(null);
    };
    video.src = blobUrl;
  });
}

function even(value: number) {
  return Math.max(2, Math.floor(value / 2) * 2);
}

function outputSize(metadata: VideoMetadata) {
  const scale = Math.min(
    1,
    MAX_PRESERVED_DIMENSION / Math.max(metadata.width, metadata.height),
  );
  return {
    width: even(metadata.width * scale),
    height: even(metadata.height * scale),
  };
}

function targetBitrates(metadata: VideoMetadata) {
  const maxDimension = Math.max(metadata.width, metadata.height);
  const videoBitsPerSecond =
    maxDimension <= 1_920
      ? 8_000_000
      : maxDimension <= 2_560
        ? 16_000_000
        : 35_000_000;
  return {
    videoBitsPerSecond,
    audioBitsPerSecond: 192_000,
    totalBitsPerSecond: videoBitsPerSecond + 192_000,
  };
}

function encodeVideo(
  sourceUrl: string,
  metadata: VideoMetadata,
  mimeType: string,
  bitrateFactor: number,
  onProgress?: ProgressFn,
) {
  return new Promise<Blob>((resolve, reject) => {
    const video = document.createElement("video");
    video.src = sourceUrl;
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    const canvas = document.createElement("canvas");
    const size = outputSize(metadata);
    canvas.width = size.width;
    canvas.height = size.height;
    const canvasContext = canvas.getContext("2d", { alpha: false });
    const captureStream = canvas.captureStream?.(60);
    const sourceStream = (video as HTMLVideoElement & {
      captureStream?: () => MediaStream;
    }).captureStream?.();

    if (!canvasContext || !captureStream) {
      reject(new Error("This browser cannot optimize videos locally."));
      return;
    }

    const target = targetBitrates(metadata);
    const audioBitsPerSecond = Math.floor(target.audioBitsPerSecond * bitrateFactor);
    const videoBitsPerSecond = Math.floor(target.videoBitsPerSecond * bitrateFactor);
    const tracks = [
      ...captureStream.getVideoTracks(),
      ...(sourceStream?.getAudioTracks() ?? []),
    ];
    const output = new MediaStream(tracks);
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(output, {
        mimeType,
        videoBitsPerSecond: Math.max(48_000, videoBitsPerSecond),
        audioBitsPerSecond,
      });
    } catch {
      tracks.forEach((track) => track.stop());
      reject(new Error("This browser cannot encode an optimized video."));
      return;
    }

    const chunks: Blob[] = [];
    let raf = 0;
    let settled = false;
    let lastProgress = -1;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      cancelAnimationFrame(raf);
      tracks.forEach((track) => track.stop());
      video.pause();
      video.removeAttribute("src");
      try {
        video.load();
      } catch {
        // The element is disposable.
      }
      if (error) reject(error);
      else resolve(new Blob(chunks, { type: mimeType }));
    };
    const draw = () => {
      if (settled) return;
      if (video.readyState >= 2) {
        canvasContext.drawImage(video, 0, 0, size.width, size.height);
        const progress = Math.min(
          99,
          Math.max(0, Math.round((video.currentTime / metadata.duration) * 100)),
        );
        if (progress !== lastProgress) {
          lastProgress = progress;
          onProgress?.(progress);
        }
      }
      raf = requestAnimationFrame(draw);
    };

    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onerror = () => finish(new Error("Video optimization failed."));
    recorder.onstop = () => finish();
    video.onended = () => {
      if (recorder.state !== "inactive") recorder.stop();
    };
    video.onerror = () => finish(new Error("Video playback failed during optimization."));

    void video.play()
      .then(() => {
        recorder.start(1000);
        raf = requestAnimationFrame(draw);
      })
      .catch(() => finish(new Error("Video playback was blocked during optimization.")));
  });
}

/**
 * Best-effort adaptive compression. It only re-encodes a source when its
 * measured bitrate is materially above a resolution-appropriate target.
 * 1080p, 2K, and 4K sources keep their native dimensions; sources above 4K
 * may be reduced to 4K so the result remains crisp without uploading waste.
 *
 * This is never an upload-size gate. If metadata, codecs, or device resources
 * are unavailable, the original Blob is returned and TUS uploads it directly.
 */
export async function optimizeVideoBlob(
  source: Blob,
  onProgress?: ProgressFn,
): Promise<Blob> {
  if (!source.type.startsWith("video/")) return source;
  const sourceUrl = URL.createObjectURL(source);
  let metadata: VideoMetadata | null = null;
  try {
    metadata = await readVideoMetadata(sourceUrl);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
  if (!metadata) return source;

  const target = targetBitrates(metadata);
  const sourceBitsPerSecond = (source.size * 8) / metadata.duration;
  const shouldCompress = sourceBitsPerSecond > target.totalBitsPerSecond * 1.15;
  if (!shouldCompress) return source;

  const mimeType = supportedMimeType();
  if (!mimeType) return source;

  const encodeUrl = URL.createObjectURL(source);
  try {
    const factors = [1, 0.82, 0.68];
    for (const factor of factors) {
      const optimized = await encodeVideo(encodeUrl, metadata, mimeType, factor, (percent) =>
        onProgress?.(percent, `${OPTIMIZING_LABEL} ${percent}%`),
      );
      if (optimized.size < source.size * 0.9) {
        onProgress?.(100, `${OPTIMIZING_LABEL} 100%`);
        return optimized;
      }
    }
    return source;
  } catch (error) {
    console.warn("Adaptive video compression unavailable; uploading the original source.", error);
    return source;
  } finally {
    URL.revokeObjectURL(encodeUrl);
  }
}

export async function optimizeVideoSource(
  sourceUrl: string,
  onProgress?: ProgressFn,
): Promise<Blob> {
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error("The selected video is no longer available.");
  return optimizeVideoBlob(await response.blob(), onProgress);
}