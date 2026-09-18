import {
  IMMUTABLE_MEDIA_CACHE_CONTROL,
  STORAGE_BUCKETS,
  uploadWithProgress,
  type ProgressFn,
} from "@/lib/storage-upload";
import { generateVideoThumbnail } from "@/lib/video-frames";

/** Unique paths let browsers safely keep generated thumbnails for one year. */
export const VIDEO_THUMBNAIL_CACHE_CONTROL = IMMUTABLE_MEDIA_CACHE_CONTROL;

function thumbnailPath(uid: string) {
  return `${uid}/thumb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
}

async function toBlob(source: Blob | string) {
  if (typeof source !== "string") return source;
  const response = await fetch(source);
  if (!response.ok) throw new Error("The selected video thumbnail source is unavailable.");
  return response.blob();
}

/** Uploads a custom or generated JPEG thumbnail with long-lived immutable caching. */
export async function uploadVideoThumbnail(
  source: Blob | string,
  uid: string,
  onProgress?: ProgressFn,
): Promise<{ url: string | null; error: string | null }> {
  try {
    const blob = await toBlob(source);
    const result = await uploadWithProgress(
      STORAGE_BUCKETS.videos,
      thumbnailPath(uid),
      blob,
      "image/jpeg",
      onProgress,
      VIDEO_THUMBNAIL_CACHE_CONTROL,
    );
    return result;
  } catch (error) {
    return {
      url: null,
      error: error instanceof Error ? error.message : "Could not upload the video thumbnail.",
    };
  }
}

/** Captures the high-quality 1.0s frame and uploads it as a durable thumbnail. */
export async function generateAndUploadVideoThumbnail(
  videoFile: Blob,
  uid: string,
  onProgress?: ProgressFn,
): Promise<{ url: string | null; error: string | null }> {
  const thumbnail = await generateVideoThumbnail(videoFile, 1.0);
  if (!thumbnail) return { url: null, error: null };
  return uploadVideoThumbnail(thumbnail, uid, onProgress);
}