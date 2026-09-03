import type { ProgressFn } from "@/lib/storage-upload";

/** Leave headroom below Supabase's 50 MB single-object limit. */
export const MAX_OPTIMIZED_VIDEO_BYTES = 45 * 1024 * 1024;
const TARGET_VIDEO_BYTES = 42 * 1024 * 1024;
const OPTIMIZING_LABEL = "Optimizing Video for Ultra-Fast Upload...";

type VideoMetadata = {
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

function readMetadata(blobUrl: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    let timeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      cleanup();
      reject(new Error("Video metadata timed out. Try a shorter video."));
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
        reject(new Error("Could not read video duration."));
        return;
      }
      const metadata = { width: video.videoWidth, height: video.videoHeight, duration };
      cleanup();
      resolve(metadata);
    };
    video.onerror = () => {
      cleanup();
      reject(new Error("Could not decode this video on your device."));
    };
    video.src = blobUrl;
  });
}

function even(value: number) {
  return Math.max(2, Math.floor(value / 2) * 2);
}

function outputSize(metadata: VideoMetadata) {
  const scale = Math.min(1, 1920 / Math.max(metadata.width, metadata.height));
  return {
    width: even(metadata.width * scale),
    height: even(metadata.height * scale),
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

    const totalBits = TARGET_VIDEO_BYTES * 8 * bitrateFactor;
    const totalBitsPerSecond = totalBits / metadata.duration;
    const audioBitsPerSecond = Math.min(
      128_000,
      Math.max(64_000, Math.floor(totalBitsPerSecond * 0.12)),
    );
    const videoBitsPerSecond = Math.max(
      48_000,
      Math.min(12_000_000, Math.floor(totalBitsPerSecond - audioBitsPerSecond)),
    );
    const tracks = [
      ...captureStream.getVideoTracks(),
      ...(sourceStream?.getAudioTracks() ?? []),
    ];
    const output = new MediaStream(tracks);
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(output, {
        mimeType,
        videoBitsPerSecond,
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
 * Re-encodes video through a hardware-accelerated browser media pipeline when
 * available. The canvas keeps the source at up to 1080p while MediaRecorder
 * bounds bitrate and includes the source audio track.
 */
export async function optimizeVideoBlob(
  source: Blob,
  onProgress?: ProgressFn,
): Promise<Blob> {
  if (!source.type.startsWith("video/")) return source;
  const mimeType = supportedMimeType();
  if (!mimeType) {
    if (source.size < MAX_OPTIMIZED_VIDEO_BYTES) return source;
    throw new Error("This browser cannot optimize videos larger than 45 MB.");
  }

  const sourceUrl = URL.createObjectURL(source);
  try {
    const metadata = await readMetadata(sourceUrl);
    const factors = [1, 0.72, 0.5];
    for (const factor of factors) {
      const optimized = await encodeVideo(sourceUrl, metadata, mimeType, factor, (percent) =>
        onProgress?.(percent, `${OPTIMIZING_LABEL} ${percent}%`),
      );
      if (optimized.size < MAX_OPTIMIZED_VIDEO_BYTES) {
        onProgress?.(100, `${OPTIMIZING_LABEL} 100%`);
        return optimized;
      }
    }
    throw new Error("Could not reduce this video below the 45 MB upload limit.");
  } finally {
    URL.revokeObjectURL(sourceUrl);
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