import { supabase } from "@/integrations/supabase/client";
import { getAdaptivePerformanceSnapshot } from "@/lib/adaptive-performance";
import {
  readableUploadError,
  runDirectUploadRequest,
} from "@/lib/storage-upload-request";

export type ProgressFn = (percent: number, detail?: string) => void;

export const STORAGE_BUCKETS = {
  videos: "videos",
  reels: "reels",
  moments: "moments",
  voiceNotes: "voice_notes",
  channels: "channels",
  monetization: "monetization",
  messages: "messages",
  calls: "calls",
  avatars: "avatars",
  uploads: "uploads",
  documents: "documents",
  thumbnails: "thumbnails",
} as const;

/** Uploaded video and poster objects use unique paths, so they can be cached immutably. */
export const IMMUTABLE_MEDIA_CACHE_CONTROL = "31536000, immutable";
const FASTSTART_BUCKETS = new Set(["videos", "reels", "moments"]);

/**
 * The standard Storage endpoint sends the Blob as one request. It does not
 * expose byte-level progress, so report the start and complete only on response.
 */
async function uploadDirect(
  bucket: string,
  path: string,
  file: Blob,
  contentType: string,
  onProgress?: ProgressFn,
  cacheControl = "3600",
): Promise<{ error: string | null }> {
  const result = await runDirectUploadRequest(
    () =>
      supabase.storage.from(bucket).upload(path, file, {
        cacheControl,
        upsert: false,
        contentType,
      }),
    onProgress,
  );
  if (result.error) {
    console.error(
      `Direct storage upload failed for ${bucket}/${path}: ${result.error}`,
    );
  }
  return result;
}

/**
 * Uploads a Blob directly to Supabase Storage and returns a durable signed URL.
 */
export async function uploadWithProgress(
  bucket: string,
  path: string,
  blob: Blob,
  contentType: string,
  onProgress?: ProgressFn,
  cacheControl = "3600",
): Promise<{ url: string | null; storagePath: string | null; error: string | null }> {
  const needsFastStart =
    contentType.toLowerCase().startsWith("video/") && FASTSTART_BUCKETS.has(bucket);
  if (getAdaptivePerformanceSnapshot().networkQuality === "offline") {
    const error = "You appear to be offline. Reconnect and try again.";
    console.error(`Direct storage upload failed for ${bucket}/${path}: ${error}`);
    return { url: null, storagePath: null, error };
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("Could not authorize storage upload", sessionError);
    return { url: null, storagePath: null, error: sessionError.message };
  }
  const token = sessionData.session?.access_token;
  if (!token) {
    const error = "You need to sign in to upload.";
    console.error(`Direct storage upload failed for ${bucket}/${path}: ${error}`);
    return { url: null, storagePath: null, error };
  }

  let upload: { error: string | null };
  try {
    upload = await uploadDirect(bucket, path, blob, contentType, onProgress, cacheControl);
  } catch (error) {
    const message = readableUploadError(error);
    console.error(`Storage upload failed for ${bucket}/${path}: ${message}`, error);
    return { url: null, storagePath: null, error: message };
  }

  if (upload.error) {
    return { url: null, storagePath: null, error: upload.error };
  }

  let finalPath = path;
  if (needsFastStart) {
    onProgress?.(100, "Preparing video for playback");
    let response: Response;
    try {
      response = await fetch("/api/media/transcode", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bucket, path }),
      });
    } catch (error) {
      const message = readableUploadError(error);
      const uploadError = `The video uploaded, but playback preparation failed: ${message}`;
      console.error(`Video processing request failed for ${bucket}/${path}: ${message}`, error);
      return { url: null, storagePath: null, error: uploadError };
    }

    const result: unknown = await response.json().catch(() => null);
    const responseData =
      result && typeof result === "object" ? (result as Record<string, unknown>) : null;
    if (!response.ok) {
      const message =
        typeof responseData?.error === "string"
          ? responseData.error
          : `Video playback preparation failed (${response.status} ${response.statusText}).`;
      console.error(`Video processing failed for ${bucket}/${path}: ${message}`);
      return { url: null, storagePath: null, error: message };
    }
    if (
      typeof responseData?.path !== "string" ||
      responseData.contentType !== "video/mp4" ||
      responseData.faststart !== true
    ) {
      const error = "The video processor returned an invalid response.";
      console.error(`Video processing failed for ${bucket}/${path}: ${error}`);
      return { url: null, storagePath: null, error };
    }
    finalPath = responseData.path;
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(finalPath, 60 * 60 * 24 * 365);
  if (signError || !signed?.signedUrl) {
    const error =
      signError?.message ?? "Upload completed, but the media URL could not be created.";
    console.error(`Failed to sign uploaded media ${bucket}/${finalPath}: ${error}`, signError);
    return { url: null, storagePath: null, error };
  }
  if (finalPath !== path) {
    const { error: removeError } = await supabase.storage.from(bucket).remove([path]);
    if (removeError) {
      console.warn(`Could not remove unprocessed source video from ${bucket}`, removeError);
    }
  }
  onProgress?.(100);
  return { url: signed.signedUrl, storagePath: finalPath, error: null };
}

export async function uploadSourceWithProgress(
  bucket: string,
  path: string,
  source: string,
  fallbackType: string,
  onProgress?: ProgressFn,
) {
  try {
    const response = await fetch(source);
    if (!response.ok) {
      const error = "The selected media is no longer available.";
      console.error(error, { source, status: response.status });
      return { url: null, storagePath: null, error };
    }
    const blob = await response.blob();
    return uploadWithProgress(bucket, path, blob, blob.type || fallbackType, onProgress);
  } catch (error) {
    const message = readableUploadError(error);
    console.error(`Could not prepare media for upload: ${message}`, error);
    return {
      url: null,
      storagePath: null,
      error: message,
    };
  }
}