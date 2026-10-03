import {
  IMMUTABLE_MEDIA_CACHE_CONTROL,
  STORAGE_BUCKETS,
  uploadWithProgress,
  type ProgressFn,
} from "@/lib/storage-upload";
import { generateVideoThumbnail } from "@/lib/video-frames";

/** Unique paths let browsers safely keep generated thumbnails for one year. */
export const VIDEO_THUMBNAIL_CACHE_CONTROL = IMMUTABLE_MEDIA_CACHE_CONTROL;

function thumbnailPath(uid: string, contentType: string) {
  const extension =
    contentType === "image/webp" ? "webp" : contentType === "image/png" ? "png" : "jpg";
  return `${uid}/thumb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
}

async function toBlob(source: Blob | string) {
  if (typeof source !== "string") return source;
  const response = await fetch(source);
  if (!response.ok) throw new Error("The selected video thumbnail source is unavailable.");
  return response.blob();
}

async function encodeThumbnail(blob: Blob): Promise<Blob> {
  if (typeof Image === "undefined") return blob;
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not decode the thumbnail."));
      element.src = objectUrl;
    });
    const scale = Math.min(1, 960 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) return blob;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const webp = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.78),
    );
    if (webp?.type === "image/webp") return webp;
    const jpeg = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82),
    );
    return jpeg ?? blob;
  } catch {
    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Uploads a compact JPEG/WebP thumbnail with long-lived immutable caching. */
export async function uploadVideoThumbnail(
  source: Blob | string,
  uid: string,
  onProgress?: ProgressFn,
  bucket: string = STORAGE_BUCKETS.thumbnails,
): Promise<{ url: string | null; storagePath: string | null; error: string | null }> {
  try {
    const blob = await encodeThumbnail(await toBlob(source));
    const contentType = blob.type.startsWith("image/") ? blob.type : "image/jpeg";
    const result = await uploadWithProgress(
      bucket,
      thumbnailPath(uid, contentType),
      blob,
      contentType,
      onProgress,
      VIDEO_THUMBNAIL_CACHE_CONTROL,
    );
    return {
      url: result.url,
      storagePath: result.storagePath,
      error: result.error,
    };
  } catch (error) {
    return {
      url: null,
      storagePath: null,
      error: error instanceof Error ? error.message : "Could not upload the video thumbnail.",
    };
  }
}

/** Captures a frame after the opening second and uploads it as a durable thumbnail. */
export async function generateAndUploadVideoThumbnail(
  videoFile: Blob,
  uid: string,
  onProgress?: ProgressFn,
  bucket: string = STORAGE_BUCKETS.thumbnails,
): Promise<{ url: string | null; storagePath: string | null; error: string | null }> {
  const thumbnail = await generateVideoThumbnail(videoFile, 1);
  if (!thumbnail) {
    return {
      url: null,
      storagePath: null,
      error: "Could not capture a thumbnail frame from this video.",
    };
  }
  return uploadVideoThumbnail(thumbnail, uid, onProgress, bucket);
}