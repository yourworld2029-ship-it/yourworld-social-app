import type { ProgressFn } from "@/lib/storage-upload";

const OPTIMIZING_LABEL = "Optimizing Video for Ultra-Fast Upload...";
const MAX_PRESERVED_DIMENSION = 3_840;
const HEAVY_SOURCE_MAX_DIMENSION = 2_560;
const LARGE_RECORDING_BYTES = 64 * 1024 * 1024;

const RECORDER_MIME_CANDIDATES = [
  'video/mp4;codecs="avc1.640028"',
  'video/mp4;codecs="avc1.4D401F"',
  'video/mp4;codecs="avc1.42E01E"',
  "video/mp4",
  'video/mp4;codecs="av01.0.08M.08"',
  'video/webm;codecs="vp9,opus"',
  'video/webm;codecs="vp8,opus"',
  'video/webm;codecs="av01.0.08M.08,opus"',
  "video/webm",
];

export type VideoMetadata = {
  width: number;
  height: number;
  duration: number;
};

export function selectSupportedRecorderMimeType(
  isSupported: (mimeType: string) => boolean,
) {
  return RECORDER_MIME_CANDIDATES.find((mimeType) => isSupported(mimeType)) ?? null;
}

function supportedMimeType() {
  if (typeof MediaRecorder === "undefined") return null;
  return selectSupportedRecorderMimeType((mimeType) =>
    MediaRecorder.isTypeSupported(mimeType),
  );
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

function outputSize(metadata: VideoMetadata, maxDimension = MAX_PRESERVED_DIMENSION) {
  const scale = Math.min(
    1,
    maxDimension / Math.max(metadata.width, metadata.height),
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
  size: { width: number; height: number },
  onProgress?: ProgressFn,
) {
  return new Promise<Blob>((resolve, reject) => {
    const video = document.createElement("video");
    video.src = sourceUrl;
    video.preload = "auto";
    // Keep the source element audible so captureStream exposes the original
    // audio instead of producing a silent optimized file.
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const canvasContext = canvas.getContext("2d", { alpha: false });
    const captureStream = canvas.captureStream?.(60);
    const sourceStream = (video as HTMLVideoElement & {
      captureStream?: () => MediaStream;
    }).captureStream?.();

    if (!canvasContext || !captureStream) {
      captureStream?.getTracks().forEach((track) => track.stop());
      reject(new Error("This browser cannot optimize videos locally."));
      return;
    }

    // Never publish a locally re-encoded video without its source audio.
    // Some browsers expose captured audio tracks only after playback begins,
    // so the track check and attachment happen immediately before recording.
    if (!sourceStream) {
      captureStream.getTracks().forEach((track) => track.stop());
      video.removeAttribute("src");
      video.load();
      reject(new Error("Audio capture is unavailable during optimization."));
      return;
    }

    const target = targetBitrates(metadata);
    const audioBitsPerSecond = Math.floor(target.audioBitsPerSecond * bitrateFactor);
    const videoBitsPerSecond = Math.floor(target.videoBitsPerSecond * bitrateFactor);
    let tracks: MediaStreamTrack[] = [];
    let recorder: MediaRecorder | null = null;
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
      else resolve(new Blob(chunks, { type: recorder?.mimeType || mimeType }));
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

    video.onerror = () => finish(new Error("Video playback failed during optimization."));

    void video.play()
      .then(() => {
        const sourceAudioTracks = sourceStream.getAudioTracks();
        if (sourceAudioTracks.length === 0) {
          finish(new Error("Audio track could not be preserved during optimization."));
          return;
        }
        // MediaRecorder snapshots the stream tracks at construction time.
        // Attach the source audio before constructing the recorder so the
        // optimized result cannot silently become video-only.
        const output = new MediaStream([
          ...captureStream.getVideoTracks(),
          ...sourceAudioTracks,
        ]);
        tracks = output.getTracks();
        try {
          recorder = new MediaRecorder(output, {
            mimeType,
            videoBitsPerSecond: Math.max(48_000, videoBitsPerSecond),
            audioBitsPerSecond,
          });
        } catch {
          finish(new Error("This browser cannot encode an optimized video."));
          return;
        }
        recorder.ondataavailable = (event) => {
          if (event.data.size) chunks.push(event.data);
        };
        recorder.onerror = () => finish(new Error("Video optimization failed."));
        recorder.onstop = () => finish();
        video.onended = () => {
          if (recorder?.state !== "inactive") recorder?.stop();
        };
        recorder.start(1000);
        raf = requestAnimationFrame(draw);
      })
      .catch(() => finish(new Error("Video playback was blocked during optimization.")));
  });
}

/**
 * Best-effort adaptive compression. It only re-encodes a source when its
 * measured bitrate is materially above a resolution-appropriate target.
 * 1080p and 2K sources keep their native dimensions. Large 4K+ recordings
 * can be reduced to 2.5K; exceptionally large sources are capped at 4K.
 *
 * This is never an upload-size gate. If metadata, codecs, or device resources
 * are unavailable, the original Blob is returned for direct Storage upload.
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

  const sourceBitsPerSecond = (source.size * 8) / metadata.duration;
  const sourceMaxDimension = Math.max(metadata.width, metadata.height);
  const shouldDownscale =
    sourceMaxDimension > HEAVY_SOURCE_MAX_DIMENSION &&
    source.size >= LARGE_RECORDING_BYTES;
  const targetSize = outputSize(
    metadata,
    shouldDownscale ? HEAVY_SOURCE_MAX_DIMENSION : MAX_PRESERVED_DIMENSION,
  );
  const outputMetadata = { ...metadata, ...targetSize };
  const target = targetBitrates(outputMetadata);
  const shouldCompress =
    sourceMaxDimension > MAX_PRESERVED_DIMENSION ||
    sourceBitsPerSecond > target.totalBitsPerSecond * 1.15 ||
    shouldDownscale;
  if (!shouldCompress) return source;

  const mimeType = supportedMimeType();
  if (!mimeType) return source;

  const encodeUrl = URL.createObjectURL(source);
  try {
    const factors = [1, 0.82, 0.68];
    for (const factor of factors) {
      const optimized = await encodeVideo(
        encodeUrl,
        outputMetadata,
        mimeType,
        factor,
        targetSize,
        (percent) => onProgress?.(percent, `${OPTIMIZING_LABEL} ${percent}%`),
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