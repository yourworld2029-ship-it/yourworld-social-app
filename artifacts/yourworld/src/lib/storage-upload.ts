import { mediaApiUrl } from "@/lib/media-api-url";
import { supabase } from "@/integrations/supabase/client";
import { getAdaptivePerformanceSnapshot } from "@/lib/adaptive-performance";
import {
  readableUploadError,
  runAbortableDirectUploadRequest,
  runDirectUploadRequest,
  type UploadByteProgress,
  type UploadRequestProgress,
} from "@/lib/storage-upload-request";
import { uploadCloudflareStreamWithTus } from "@/lib/storage-upload-cloudflare-tus";
import { uploadLargeStorageObjectWithTus } from "@/lib/storage-upload-tus";
import { getVideoUploadSizeError } from "@/lib/video-upload-limits";
import {
  getTusChunkSize,
  RESUMABLE_UPLOAD_CHUNK_SIZE,
  shouldUseResumableStorageUpload,
  shouldUseStoragePlaybackFallback,
  WEAK_NETWORK_TUS_CHUNK_SIZE,
} from "@/lib/storage-upload-tus-utils";
import { shouldRunServerFastStart } from "@/lib/video-upload-processing";

export type ProgressFn = UploadRequestProgress;
export type VideoStreamUploadOptions = {
  cloudflareStream?: boolean;
  requireSignedURLs?: boolean;
  /** Allows public long videos to use their uploaded Storage copy if Stream fails. */
  fallbackToStorage?: boolean;
  /** Exposes real TUS byte counts for Long Video uploads only. */
  reportByteProgress?: boolean;
  signal?: AbortSignal;
};

export const STORAGE_BUCKETS = {
  videos: "videos",
  reels: "reels",
  liveReplays: "live-replays",
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
async function removeCanceledStorageObjects(bucket: string, paths: string[]) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  if (!uniquePaths.length) return;
  try {
    const { error } = await supabase.storage.from(bucket).remove(uniquePaths);
    if (error) console.warn(`Could not clean up a cancelled upload in ${bucket}`, error);
  } catch (error) {
    console.warn(`Could not clean up a cancelled upload in ${bucket}`, error);
  }
}

async function uploadDirect(
  bucket: string,
  path: string,
  file: Blob,
  contentType: string,
  onProgress?: ProgressFn,
  cacheControl = "3600",
  signal?: AbortSignal,
  accessToken?: string,
  reportByteProgress = false,
  getChunkSize: () => number = () => RESUMABLE_UPLOAD_CHUNK_SIZE,
): Promise<{ error: string | null }> {
  if (signal?.aborted) return { error: "Upload cancelled" };
  const initialChunkSize = getChunkSize();
  if (shouldUseResumableStorageUpload(
    file.size,
    initialChunkSize === WEAK_NETWORK_TUS_CHUNK_SIZE,
  )) {
    const result = await uploadLargeStorageObjectWithTus({
      bucket,
      path,
      file,
      contentType,
      cacheControl,
      onProgress,
      reportByteProgress,
      signal,
      getChunkSize,
    });
    if (result.error) {
      console.error(`Resumable storage upload failed for ${bucket}/${path}: ${result.error}`);
    }
    return result;
  }

  if (signal) {
    const projectUrl = import.meta.env["VITE_SUPABASE_URL"];
    const publishableKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    if (!projectUrl || !publishableKey || !accessToken) {
      return { error: "Direct Storage upload is not configured for this session." };
    }
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const endpoint = `${projectUrl.replace(/\/+$/, "")}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`;
    return runAbortableDirectUploadRequest(
      async (requestSignal) => {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            apikey: publishableKey,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": contentType,
            "Cache-Control": `max-age=${cacheControl}`,
            "x-upsert": "false",
          },
          body: file,
          signal: requestSignal,
        });
        const body: unknown = await response.json().catch(() => null);
        if (response.ok) return { error: null };
        const details =
          body && typeof body === "object" ? (body as Record<string, unknown>) : null;
        return {
          error: {
            message:
              (typeof details?.message === "string" && details.message) ||
              (typeof details?.error === "string" && details.error) ||
              `Storage upload failed (${response.status} ${response.statusText}).`,
          },
        };
      },
      onProgress,
      signal,
    );
  }

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
  options: VideoStreamUploadOptions = {},
): Promise<{
  url: string | null;
  storagePath: string | null;
  error: string | null;
  streamUid?: string | null;
  posterUrl?: string | null;
  durationSeconds?: number | null;
}> {
  const sizeError = getVideoUploadSizeError(bucket, contentType, blob.size);
  if (sizeError) {
    return { url: null, storagePath: null, error: sizeError };
  }

  const needsFastStart = shouldRunServerFastStart({
    bucket,
    contentType,
    cloudflareStream: options.cloudflareStream === true,
  });
  const needsCloudflareStream =
    options.cloudflareStream === true &&
    contentType.toLowerCase().startsWith("video/") &&
    (bucket === STORAGE_BUCKETS.videos || bucket === STORAGE_BUCKETS.reels);
  const networkSnapshot = getAdaptivePerformanceSnapshot();
  if (networkSnapshot.networkQuality === "offline") {
    const error = "You appear to be offline. Reconnect and try again.";
    console.error(`Direct storage upload failed for ${bucket}/${path}: ${error}`);
    return { url: null, storagePath: null, error };
  }
  if (options.signal?.aborted) {
    return { url: null, storagePath: null, error: "Upload cancelled" };
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
    const getChunkSize = () => getTusChunkSize(getAdaptivePerformanceSnapshot());
    const sourceProgress = needsCloudflareStream && onProgress
      ? (percent: number, detail?: string, byteProgress?: UploadByteProgress | null) =>
          onProgress(Math.round(percent * 0.45), detail, byteProgress)
      : onProgress;
    upload = await uploadDirect(
      bucket,
      path,
      blob,
      contentType,
      sourceProgress,
      cacheControl,
      options.signal,
      token,
      options.reportByteProgress,
      getChunkSize,
    );
  } catch (error) {
    const message = readableUploadError(error);
    console.error(`Storage upload failed for ${bucket}/${path}: ${message}`, error);
    return { url: null, storagePath: null, error: message };
  }

  if (upload.error) {
    return { url: null, storagePath: null, error: upload.error };
  }
  if (options.signal?.aborted) {
    await removeCanceledStorageObjects(bucket, [path]);
    return { url: null, storagePath: null, error: "Upload cancelled" };
  }

  let finalPath = path;
  let streamPlaybackUrl: string | null = null;
  let streamUid: string | null = null;
  let streamPosterUrl: string | null = null;
  let streamDurationSeconds: number | null = null;
  let useStoragePlaybackFallback = false;
  if (needsFastStart) {
    onProgress?.(needsCloudflareStream ? 48 : 97, "Preparing video for playback");
    let response: Response;
    try {
      response = await fetch(mediaApiUrl("/api/media/transcode"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: options.signal,
        body: JSON.stringify({
          bucket,
          path,
          cloudflareStream: false,
          requireSignedURLs: options.requireSignedURLs ?? true,
        }),
      });
    } catch (error) {
      if (options.signal?.aborted) {
        await removeCanceledStorageObjects(bucket, [path, finalPath]);
        return { url: null, storagePath: null, error: "Upload cancelled" };
      }
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
    if (typeof responseData?.path === "string" && responseData.path) {
      finalPath = responseData.path;
    } else {
      console.warn("Transcode skipped or incomplete, using original upload path:", path);
      finalPath = path;
    }
  }

  if (needsCloudflareStream) {
    const canFallbackToStorage = shouldUseStoragePlaybackFallback({
      bucket,
      fallbackToStorage: options.fallbackToStorage,
      requireSignedURLs: options.requireSignedURLs,
    });
    const selectStoragePlaybackFallback = () => {
      if (!canFallbackToStorage) return false;
      useStoragePlaybackFallback = true;
      streamUid = null;
      streamPlaybackUrl = null;
      streamPosterUrl = null;
      streamDurationSeconds = null;
      onProgress?.(94, "Finishing with secure video storage");
      return true;
    };

    const reportByteProgress = options.reportByteProgress === true;
    onProgress?.(
      65,
      reportByteProgress ? "Connecting to Cloudflare Stream" : "Uploading video to Cloudflare Stream",
      reportByteProgress ? null : undefined,
    );
    const cloudflareBucket =
      bucket === STORAGE_BUCKETS.videos ? STORAGE_BUCKETS.videos : STORAGE_BUCKETS.reels;
    const tusResult = await uploadCloudflareStreamWithTus({
      bucket: cloudflareBucket,
      path: finalPath,
      file: blob,
      contentType,
      requireSignedURLs: options.requireSignedURLs ?? true,
      onProgress: (percent, detail, byteProgress) =>
        onProgress?.(
          65 + Math.round(percent * 0.28),
          reportByteProgress ? detail ?? "Uploading video to Cloudflare Stream" : undefined,
          reportByteProgress ? byteProgress : undefined,
        ),
      reportByteProgress,
      signal: options.signal,
      getChunkSize: () => getTusChunkSize(getAdaptivePerformanceSnapshot()),
    });
    if (options.signal?.aborted) {
      await removeCanceledStorageObjects(bucket, [path, finalPath]);
      return { url: null, storagePath: null, error: "Upload cancelled" };
    }
    if (tusResult.error || !tusResult.streamUid) {
      if (!tusResult.fallbackAllowed || !selectStoragePlaybackFallback()) {
        return {
          url: null,
          storagePath: null,
          error: tusResult.error ?? "Cloudflare Stream did not return a video ID.",
        };
      }
    } else {
      streamUid = tusResult.streamUid;

      onProgress?.(94, "Finalizing Cloudflare playback");
      const { data: currentSession, error: currentSessionError } =
        await supabase.auth.getSession();
      const currentToken = currentSession.session?.access_token;
      if (currentSessionError || !currentToken) {
        return {
          url: null,
          storagePath: null,
          error: currentSessionError?.message ?? "Your sign-in expired. Sign in and try again.",
        };
      }

      let assetResponse: Response | null = null;
      try {
        assetResponse = await fetch(mediaApiUrl("/api/media/cloudflare-stream-asset"), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${currentToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ streamUid: tusResult.streamUid }),
        });
      } catch (error) {
        const message = readableUploadError(error);
        if (!selectStoragePlaybackFallback()) {
          return {
            url: null,
            storagePath: null,
            error: `The video uploaded, but Cloudflare playback could not be verified: ${message}`,
          };
        }
      }

      if (!useStoragePlaybackFallback && assetResponse) {
        const assetPayload: unknown = await assetResponse.json().catch(() => null);
        const asset =
          assetPayload && typeof assetPayload === "object"
            ? (assetPayload as Record<string, unknown>)
            : null;
        if (!assetResponse.ok || typeof asset?.playbackUrl !== "string") {
          const message =
            typeof asset?.error === "string"
              ? asset.error
              : `Cloudflare playback verification failed (${assetResponse.status}).`;
          if (
            assetResponse.status === 401 ||
            assetResponse.status === 403 ||
            !selectStoragePlaybackFallback()
          ) {
            return { url: null, storagePath: null, error: message };
          }
        } else {
          streamUid =
            typeof asset.streamUid === "string" ? asset.streamUid : tusResult.streamUid;
          streamPlaybackUrl = asset.playbackUrl;
          streamPosterUrl = typeof asset.posterUrl === "string" ? asset.posterUrl : null;
          streamDurationSeconds =
            typeof asset.durationSeconds === "number" &&
            Number.isFinite(asset.durationSeconds) &&
            asset.durationSeconds > 0
              ? asset.durationSeconds
              : null;
        }
      }
    }
  }

  if (options.signal?.aborted) {
    await removeCanceledStorageObjects(bucket, [path, finalPath]);
    return { url: null, storagePath: null, error: "Upload cancelled" };
  }
  let signedUrl: string | null = null;
  if (!needsCloudflareStream || useStoragePlaybackFallback) {
    const { data: signed, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(finalPath, 60 * 60 * 24 * 365);
    if (signError || !signed?.signedUrl) {
      const error =
        signError?.message ?? "Upload completed, but the media URL could not be created.";
      console.error(`Failed to sign uploaded media ${bucket}/${finalPath}: ${error}`, signError);
      return { url: null, storagePath: null, error };
    }
    signedUrl = signed.signedUrl;
  }
  if (options.signal?.aborted) {
    await removeCanceledStorageObjects(bucket, [path, finalPath]);
    return { url: null, storagePath: null, error: "Upload cancelled" };
  }
  if (finalPath !== path) {
    const { error: removeError } = await supabase.storage.from(bucket).remove([path]);
    if (removeError) {
      console.warn(`Could not remove unprocessed source video from ${bucket}`, removeError);
    }
  }
  onProgress?.(100);
  return {
    url: streamPlaybackUrl ?? signedUrl,
    storagePath: finalPath,
    error: null,
    streamUid,
    posterUrl: streamPosterUrl,
    durationSeconds: streamDurationSeconds,
  };
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