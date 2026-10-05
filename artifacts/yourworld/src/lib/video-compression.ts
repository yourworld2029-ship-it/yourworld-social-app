import type { ProgressFn } from "@/lib/storage-upload";
import {
  VIDEO_QUALITY_TIERS,
  qualityTierFromDimensions,
  type VideoQualityTier,
} from "@/lib/video-quality";

const OPTIMIZING_LABEL = "Preparing optimized video...";
const UPLOAD_MAX_TIER: VideoQualityTier = "1080p";
export const VIDEO_UPLOAD_BITRATE = 2_500_000;
const uploadReadyVideoBlobs = new WeakSet<Blob>();
const LARGE_SOURCE_COMPRESSION_REQUIRED_BYTES = 300 * 1024 * 1024;

export function markVideoBlobAsUploadReady(blob: Blob) {
  uploadReadyVideoBlobs.add(blob);
}

export function markVideoBlobAsOptimized(blob: Blob) {
  markVideoBlobAsUploadReady(blob);
}

export function isVideoBlobUploadReady(blob: Blob) {
  return uploadReadyVideoBlobs.has(blob);
}

export function isNativeOptimizedVideo(blob: Blob) {
  return isVideoBlobUploadReady(blob);
}

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

function outputSize(metadata: VideoMetadata, maxShortSide: number) {
  const scale = Math.min(1, maxShortSide / Math.min(metadata.width, metadata.height));
  return {
    width: even(metadata.width * scale),
    height: even(metadata.height * scale),
  };
}

function tierIndex(tier: VideoQualityTier) {
  return VIDEO_QUALITY_TIERS.findIndex((candidate) => candidate.id === tier);
}

export function qualityTierForOutput(
  width: number,
  height: number,
  target: VideoQualityTier,
) {
  const sourceTier = qualityTierFromDimensions(width, height);
  if (!sourceTier) return null;
  return tierIndex(sourceTier) < tierIndex(target) ? sourceTier : target;
}

export function outputSizeForQuality(
  metadata: VideoMetadata,
  tier: VideoQualityTier,
) {
  const definition = VIDEO_QUALITY_TIERS.find((candidate) => candidate.id === tier);
  if (!definition) throw new Error("Unsupported video quality");
  return outputSize(metadata, definition.shortSide);
}

function targetBitrates(tier: VideoQualityTier, videoBitrateOverride?: number) {
  const videoBitsPerSecond =
    videoBitrateOverride ??
    VIDEO_QUALITY_TIERS.find((candidate) => candidate.id === tier)?.bitrate ??
    5_000_000;
  return {
    videoBitsPerSecond,
    audioBitsPerSecond: 128_000,
    totalBitsPerSecond: videoBitsPerSecond + 128_000,
  };
}

function encodeVideo(
  sourceUrl: string,
  metadata: VideoMetadata,
  tier: VideoQualityTier,
  mimeType: string,
  bitrateFactor: number,
  size: { width: number; height: number },
  onProgress?: ProgressFn,
  videoBitrateOverride?: number,
  signal?: AbortSignal,
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
    const captureStream = canvas.captureStream?.(30);
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

    const target = targetBitrates(tier, videoBitrateOverride);
    const audioBitsPerSecond = Math.floor(target.audioBitsPerSecond * bitrateFactor);
    const videoBitsPerSecond = Math.floor(target.videoBitsPerSecond * bitrateFactor);
    let tracks: MediaStreamTrack[] = [];
    let recorder: MediaRecorder | null = null;
    const chunks: Blob[] = [];
    let raf = 0;
    let settled = false;
    let lastProgress = -1;
    let abortHandler: (() => void) | null = null;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      if (abortHandler) signal?.removeEventListener("abort", abortHandler);
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
    abortHandler = () => {
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // The recorder may already be stopping.
        }
      }
      finish(new Error("Video encoding was cancelled."));
    };
    if (signal?.aborted) {
      abortHandler();
      return;
    }
    signal?.addEventListener("abort", abortHandler, { once: true });
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
 * Uploads are capped at 1080p; lower-resolution sources are never upscaled.
 *
 * This is never an upload-size gate. If metadata, codecs, or device resources
 * are unavailable, the original Blob is returned for direct Storage upload.
 */
export async function optimizeVideoBlob(
  source: Blob,
  onProgress?: ProgressFn,
  onOutputDimensions?: (dimensions: { width: number; height: number }) => void,
): Promise<Blob> {
  if (!source.type.startsWith("video/")) return source;
  if (isVideoBlobUploadReady(source)) return source;
  const requiresCompression = source.size > LARGE_SOURCE_COMPRESSION_REQUIRED_BYTES;
  let metadata: VideoMetadata | null = null;
  let sourceUrl: string | null = null;
  try {
    sourceUrl = URL.createObjectURL(source);
    metadata = await readVideoMetadata(sourceUrl);
  } catch (error) {
    if (requiresCompression) {
      throw new Error("This video is too large to upload without local compression.", {
        cause: error,
      });
    }
    console.warn("Video metadata optimization unavailable; uploading the original source.", error);
    return source;
  } finally {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  }
  if (!metadata) {
    if (requiresCompression) {
      throw new Error("Video details could not be read, so this large video cannot be compressed.");
    }
    return source;
  }
  onOutputDimensions?.({ width: metadata.width, height: metadata.height });

  const sourceBitsPerSecond = (source.size * 8) / metadata.duration;
  const sourceTier = qualityTierFromDimensions(metadata.width, metadata.height);
  if (!sourceTier) {
    if (requiresCompression) {
      throw new Error("This video cannot be compressed to a supported upload quality.");
    }
    return source;
  }
  const targetTier = qualityTierForOutput(metadata.width, metadata.height, UPLOAD_MAX_TIER);
  if (!targetTier) {
    if (requiresCompression) {
      throw new Error("This video cannot be compressed to a supported upload quality.");
    }
    return source;
  }
  const targetSize = outputSizeForQuality(metadata, targetTier);
  const outputMetadata = { ...metadata, ...targetSize };
  const target = targetBitrates(targetTier, VIDEO_UPLOAD_BITRATE);
  const shouldDownscale = targetSize.width < metadata.width || targetSize.height < metadata.height;
  const shouldCompress =
    shouldDownscale ||
    sourceTier !== targetTier ||
    sourceBitsPerSecond > target.totalBitsPerSecond * 1.15;
  if (!shouldCompress) return source;

  const mimeType = supportedMimeType();
  if (!mimeType) {
    if (requiresCompression) {
      throw new Error("This device cannot compress the selected video.");
    }
    return source;
  }

  const encodeUrl = URL.createObjectURL(source);
  try {
    const optimized = await encodeVideo(
      encodeUrl,
      outputMetadata,
      targetTier,
      mimeType,
      1,
      targetSize,
      (percent) => onProgress?.(percent, `${OPTIMIZING_LABEL} ${percent}%`),
      VIDEO_UPLOAD_BITRATE,
    );
    if (optimized.size >= source.size * 0.9) {
      if (requiresCompression) {
        throw new Error("Video compression did not reduce this file enough to upload safely.");
      }
      return source;
    }
    onOutputDimensions?.(targetSize);
    onProgress?.(100, `${OPTIMIZING_LABEL} 100%`);
    return optimized;
  } catch (error) {
    if (requiresCompression) {
      throw error instanceof Error
        ? error
        : new Error("Video compression failed. The original was not uploaded.");
    }
    console.warn("Adaptive video compression unavailable; uploading the original source.", error);
    return source;
  } finally {
    URL.revokeObjectURL(encodeUrl);
  }
}

export async function transcodeVideoBlobToQuality(
  source: Blob,
  requestedTier: VideoQualityTier,
  onProgress?: ProgressFn,
): Promise<{ blob: Blob; quality: VideoQualityTier }> {
  if (!source.type.startsWith("video/")) {
    throw new Error("The selected file is not a video.");
  }
  const sourceUrl = URL.createObjectURL(source);
  let metadata: VideoMetadata | null;
  try {
    metadata = await readVideoMetadata(sourceUrl);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
  if (!metadata) throw new Error("Video dimensions could not be read for quality conversion.");

  const actualTier = qualityTierForOutput(
    metadata.width,
    metadata.height,
    requestedTier,
  );
  if (!actualTier) throw new Error("Video dimensions could not be read for quality conversion.");
  const target = VIDEO_QUALITY_TIERS.find((candidate) => candidate.id === actualTier);
  if (!target) throw new Error("Unsupported video quality");
  const size = outputSizeForQuality(metadata, actualTier);
  const targetBits = targetBitrates(actualTier);
  const sourceBitsPerSecond = (source.size * 8) / metadata.duration;
  const needsResize = size.width < metadata.width || size.height < metadata.height;
  if (!needsResize && sourceBitsPerSecond <= targetBits.totalBitsPerSecond * 1.15) {
    onProgress?.(100, `Using source video (${actualTier})`);
    return { blob: source, quality: actualTier };
  }

  const mimeType = supportedMimeType();
  if (!mimeType) {
    throw new Error("This device cannot encode a video at the selected quality.");
  }

  const encodeUrl = URL.createObjectURL(source);
  try {
    const blob = await encodeVideo(
      encodeUrl,
      { ...metadata, ...size },
      actualTier,
      mimeType,
      1,
      size,
      (percent) => onProgress?.(percent, `Preparing ${actualTier} video · ${percent}%`),
    );
    if (!blob.size) throw new Error("Video quality conversion produced an empty file.");
    onProgress?.(100, `Prepared ${actualTier} video`);
    return { blob, quality: actualTier };
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

export const MAX_LONG_VIDEO_INPUT_BYTES = 1_000_000_000;
export const MAX_LONG_VIDEO_LOCAL_COMPRESSION_BYTES = 300 * 1024 * 1024;
export const MAX_LONG_VIDEO_LOCAL_COMPRESSION_DURATION_SECONDS = 5 * 60;
export const LONG_VIDEO_AUDIO_BITRATE = 128_000;
const LONG_VIDEO_MIN_OUTPUT_BITRATE = 48_000;
const LONG_VIDEO_MAX_OUTPUT_BITRATE = 24_000_000;
const LONG_VIDEO_BYTES_PER_MB = 1_000_000;
const LONG_VIDEO_MP4_RECORDER_MIME_CANDIDATES = [
  'video/mp4;codecs="avc1.640028"',
  'video/mp4;codecs="avc1.4D401F"',
  'video/mp4;codecs="avc1.42E01E"',
  "video/mp4",
];

export type LongVideoCompressionTier = "aggressive" | "balanced" | "light";

export type LongVideoCompressionPlan = {
  tier: LongVideoCompressionTier;
  targetOutputBytes: number;
  videoBitrate: number;
};

export type LongVideoCompressionResult = {
  blob: Blob;
  width: number | null;
  height: number | null;
  tier: LongVideoCompressionTier | null;
  compressed: boolean;
};

export function shouldAttemptLongVideoLocalCompression(
  sourceBytes: number,
  durationSeconds: number,
) {
  return (
    Number.isFinite(sourceBytes) &&
    sourceBytes > 0 &&
    sourceBytes <= MAX_LONG_VIDEO_LOCAL_COMPRESSION_BYTES &&
    Number.isFinite(durationSeconds) &&
    durationSeconds > 0 &&
    durationSeconds <= MAX_LONG_VIDEO_LOCAL_COMPRESSION_DURATION_SECONDS
  );
}

export function getLongVideoCompressionPlan(
  sourceBytes: number,
  durationSeconds: number,
): LongVideoCompressionPlan {
  if (!Number.isFinite(sourceBytes) || sourceBytes <= 0) {
    throw new Error("The selected video file is empty or invalid.");
  }
  if (sourceBytes > MAX_LONG_VIDEO_INPUT_BYTES) {
    throw new Error("Long videos must be 1 GB or smaller.");
  }
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error("The selected video duration is invalid.");
  }

  let tier: LongVideoCompressionTier;
  let targetOutputBytes: number;
  if (sourceBytes >= 500 * LONG_VIDEO_BYTES_PER_MB) {
    tier = "aggressive";
    targetOutputBytes = Math.min(
      100 * LONG_VIDEO_BYTES_PER_MB,
      Math.max(70 * LONG_VIDEO_BYTES_PER_MB, Math.round(sourceBytes * 0.1)),
    );
  } else if (sourceBytes >= 100 * LONG_VIDEO_BYTES_PER_MB) {
    tier = "balanced";
    targetOutputBytes = Math.round(sourceBytes * 0.5);
  } else {
    tier = "light";
    targetOutputBytes = Math.round(sourceBytes * 0.7);
  }

  // MediaRecorder accepts bitrate targets, not CRF; derive the video bitrate
  // from the requested file-size budget while reserving space for AAC audio.
  const targetTotalBitrate = (targetOutputBytes * 8) / durationSeconds;
  const videoBitrate = Math.max(
    LONG_VIDEO_MIN_OUTPUT_BITRATE,
    Math.min(
      LONG_VIDEO_MAX_OUTPUT_BITRATE,
      Math.floor(targetTotalBitrate - LONG_VIDEO_AUDIO_BITRATE),
    ),
  );
  return { tier, targetOutputBytes, videoBitrate };
}

export function selectSupportedFastStartMp4MimeType(
  isSupported: (mimeType: string) => boolean,
) {
  return LONG_VIDEO_MP4_RECORDER_MIME_CANDIDATES.find(isSupported) ?? null;
}

export async function hasFastStartMp4Layout(blob: Blob) {
  if (!blob.type.toLowerCase().includes("mp4") || blob.size < 16) return false;

  let offset = 0;
  let sawMovieMetadata = false;
  let sawFileType = false;
  let boxesScanned = 0;
  while (offset + 8 <= blob.size && boxesScanned < 10_000) {
    const header = await blob.slice(offset, Math.min(blob.size, offset + 16)).arrayBuffer();
    if (header.byteLength < 8) return false;

    const view = new DataView(header);
    const size32 = view.getUint32(0);
    const type = String.fromCharCode(
      view.getUint8(4),
      view.getUint8(5),
      view.getUint8(6),
      view.getUint8(7),
    );
    if (offset === 0) {
      if (type !== "ftyp") return false;
      sawFileType = true;
    }
    if (type === "mdat") return sawFileType && sawMovieMetadata;
    if (type === "moov") sawMovieMetadata = true;
    if (size32 === 0) return false;

    let boxSize = size32;
    let headerSize = 8;
    if (size32 === 1) {
      if (header.byteLength < 16) return false;
      const extendedSize = view.getBigUint64(8);
      if (extendedSize > BigInt(Number.MAX_SAFE_INTEGER)) return false;
      boxSize = Number(extendedSize);
      headerSize = 16;
    }
    if (boxSize < headerSize || offset + boxSize > blob.size) return false;
    offset += boxSize;
    boxesScanned += 1;
  }
  return false;
}

function selectLongVideoRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") return null;
  return selectSupportedFastStartMp4MimeType((mimeType) =>
    MediaRecorder.isTypeSupported(mimeType),
  );
}

export async function compressLongVideoByTier(
  source: Blob,
  options: { signal?: AbortSignal; onProgress?: ProgressFn } = {},
): Promise<LongVideoCompressionResult> {
  if (source.size > MAX_LONG_VIDEO_INPUT_BYTES) {
    throw new Error("Long videos must be 1 GB or smaller.");
  }

  let sourceUrl: string | null = null;
  let metadata: VideoMetadata | null = null;
  let plan: LongVideoCompressionPlan | null = null;
  const originalResult = (): LongVideoCompressionResult => {
    markVideoBlobAsUploadReady(source);
    return {
      blob: source,
      width: metadata?.width ?? null,
      height: metadata?.height ?? null,
      tier: plan?.tier ?? null,
      compressed: false,
    };
  };

  try {
    if (!source.type.startsWith("video/") || source.size === 0) return originalResult();
    // Large originals go straight to resumable upload. Encoding them locally
    // can take as long as the video itself and delays the first uploaded byte.
    if (source.size > MAX_LONG_VIDEO_LOCAL_COMPRESSION_BYTES) return originalResult();
    if (typeof document === "undefined" || typeof MediaRecorder === "undefined") {
      return originalResult();
    }
    sourceUrl = URL.createObjectURL(source);
    metadata = await readVideoMetadata(sourceUrl);
    if (options.signal?.aborted) return originalResult();
    if (!metadata) return originalResult();
    if (!shouldAttemptLongVideoLocalCompression(source.size, metadata.duration)) {
      return originalResult();
    }

    plan = getLongVideoCompressionPlan(source.size, metadata.duration);
    const mimeType = selectLongVideoRecorderMimeType();
    const qualityTier = qualityTierForOutput(metadata.width, metadata.height, "1080p");
    if (!mimeType || !qualityTier) return originalResult();

    const outputSize = outputSizeForQuality(metadata, qualityTier);
    const encoded = await encodeVideo(
      sourceUrl,
      metadata,
      qualityTier,
      mimeType,
      1,
      outputSize,
      options.onProgress,
      plan.videoBitrate,
      options.signal,
    );
    if (
      options.signal?.aborted ||
      encoded.size <= 0 ||
      encoded.size >= source.size ||
      !(await hasFastStartMp4Layout(encoded))
    ) {
      return originalResult();
    }

    markVideoBlobAsUploadReady(encoded);
    return {
      blob: encoded,
      width: outputSize.width,
      height: outputSize.height,
      tier: plan.tier,
      compressed: true,
    };
  } catch (error) {
    if (options.signal?.aborted) return originalResult();
    console.warn("Long-video compression unavailable; using the original upload.", error);
    return originalResult();
  } finally {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  }
}