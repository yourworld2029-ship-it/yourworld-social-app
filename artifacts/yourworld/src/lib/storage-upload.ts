import { Upload } from "tus-js-client";
import { supabase } from "@/integrations/supabase/client";
import { normalizeSupabaseProjectUrl } from "@/integrations/supabase/url";
import { getAdaptivePerformanceSnapshot, waitForNetwork } from "@/lib/adaptive-performance";
import {
  getTusParallelUploadCount,
  TUS_CHUNK_SIZE_BYTES,
} from "@/lib/storage-upload-strategy";

export type ProgressFn = (percent: number, detail?: string) => void;

export { TUS_CHUNK_SIZE_BYTES } from "@/lib/storage-upload-strategy";
export const RESUMABLE_UPLOAD_THRESHOLD_BYTES = 25 * 1024 * 1024;

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

function storageConfig() {
  return {
    url: normalizeSupabaseProjectUrl(
      (import.meta.env?.["VITE_SUPABASE_URL"] as string | undefined) ?? "",
    ),
    key:
      (import.meta.env?.["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined) ?? "",
  };
}

function resumableUploadEndpoint() {
  const { url } = storageConfig();
  const projectUrl = new URL(url);
  const projectHost = projectUrl.hostname.match(/^([^.]+)\.supabase\.co$/i);
  if (projectHost) {
    projectUrl.hostname = `${projectHost[1]}.storage.supabase.co`;
  }
  return `${projectUrl.origin}/storage/v1/upload/resumable`;
}

let tusConcatenationSupport: boolean | null = null;
let tusConcatenationSupportCheck: Promise<boolean> | null = null;

function supportsTusConcatenation(
  token: string,
  supabaseKey: string,
): Promise<boolean> {
  if (tusConcatenationSupport !== null) {
    return Promise.resolve(tusConcatenationSupport);
  }
  if (!tusConcatenationSupportCheck) {
    tusConcatenationSupportCheck = (async () => {
      const controller = new AbortController();
      const timeout = globalThis.setTimeout(() => controller.abort(), 4_000);
      try {
        const response = await fetch(resumableUploadEndpoint(), {
          method: "OPTIONS",
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: supabaseKey,
            "Tus-Resumable": "1.0.0",
          },
          signal: controller.signal,
        });
        if (!response.ok) return null;
        const extensions = response.headers.get("Tus-Extension") ?? "";
        return (
          extensions
            .split(",")
            .some((extension) => extension.trim().toLowerCase() === "concatenation")
        );
      } catch {
        // If discovery fails or the header is not exposed by CORS, use the
        // ordinary single-stream TUS upload rather than risking corrupt parts.
        return null;
      } finally {
        globalThis.clearTimeout(timeout);
      }
    })().then((supported) => {
      if (supported !== null) tusConcatenationSupport = supported;
      return supported === true;
    }).finally(() => {
      tusConcatenationSupportCheck = null;
    });
  }
  return tusConcatenationSupportCheck;
}

function uploadMetadata(
  bucket: string,
  path: string,
  contentType: string,
  cacheControl: string,
) {
  return {
    bucketName: bucket,
    objectName: path,
    contentType,
    cacheControl,
  };
}

function readableUploadError(error: unknown) {
  if (typeof error === "string" && error.trim()) return error;
  if (error instanceof Error && error.message) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string" &&
    (error as { message: string }).message
  ) {
    return (error as { message: string }).message;
  }
  return "The storage upload failed. Please try again.";
}

/**
 * The regular Storage upload endpoint is more reliable than TUS for the
 * video buckets. It does not expose byte-level progress, so report the
 * request lifecycle rather than pretending to know bytes sent.
 */
async function uploadDirect(
  bucket: string,
  path: string,
  fileOrBlob: Blob,
  contentType: string,
  onProgress?: ProgressFn,
  cacheControl = "3600",
): Promise<{ error: string | null }> {
  onProgress?.(0, "Uploading");
  try {
    const { error } = await supabase.storage.from(bucket).upload(path, fileOrBlob, {
      cacheControl,
      upsert: false,
      contentType,
    });
    if (error) {
      const message = readableUploadError(error);
      console.error(`Direct storage upload failed for ${bucket}/${path}: ${message}`, error);
      return { error: message };
    }
    onProgress?.(100);
    return { error: null };
  } catch (error) {
    const message = readableUploadError(error);
    console.error(`Direct storage upload failed for ${bucket}/${path}: ${message}`, error);
    return { error: message };
  }
}

/**
 * Uploads a Blob through Supabase Storage's resumable TUS endpoint.
 *
 * tus-js-client sends the file in 6 MiB PATCH requests, persists its upload
 * fingerprint for resume support, and retries interrupted chunks. The
 * `uploadDataDuringCreation` option lets Supabase receive the first chunk with
 * the creation request instead of sending the whole file as one payload.
 */
function uploadTusInWindow(
  bucket: string,
  path: string,
  blob: Blob,
  contentType: string,
  token: string,
  supabaseKey: string,
  onProgress?: ProgressFn,
  cacheControl = "3600",
): Promise<{ error: string | null }> {
  return new Promise((resolve) => {
    let settled = false;
    let waitingForNetwork = false;
    const finish = (error: string | null) => {
      if (settled) return;
      settled = true;
      resolve({ error });
    };

    const upload = new Upload(blob, {
      endpoint: resumableUploadEndpoint(),
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseKey,
        "x-upsert": "false",
      },
      metadata: uploadMetadata(bucket, path, contentType, cacheControl),
      chunkSize: TUS_CHUNK_SIZE_BYTES,
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      // Initial request + two retries = three attempts per failed chunk.
      retryDelays:
        getAdaptivePerformanceSnapshot().networkQuality === "weak"
          ? [2_000]
          : getAdaptivePerformanceSnapshot().networkQuality === "offline"
            ? []
            : [1_000, 3_000],
      onProgress: (bytesSent, bytesTotal) => {
        const percent = bytesTotal
          ? Math.min(99, Math.floor((bytesSent / bytesTotal) * 100))
          : 0;
        const totalChunks = Math.max(1, Math.ceil(bytesTotal / TUS_CHUNK_SIZE_BYTES));
        const completedChunks = Math.min(totalChunks, Math.ceil(bytesSent / TUS_CHUNK_SIZE_BYTES));
        const chunkLabel = bytesTotal > RESUMABLE_UPLOAD_THRESHOLD_BYTES
          ? `Chunk ${completedChunks}/${totalChunks}`
          : undefined;
        onProgress?.(percent, chunkLabel);
      },
      onSuccess: () => {
        onProgress?.(100);
        finish(null);
      },
      onError: (error) => {
        if (
          !waitingForNetwork &&
          getAdaptivePerformanceSnapshot().networkQuality === "offline"
        ) {
          waitingForNetwork = true;
          void waitForNetwork().then((recovered) => {
            waitingForNetwork = false;
            if (recovered && !settled) {
              upload.start();
              return;
            }
            finish(readableUploadError(error));
          });
          return;
        }
        console.error(`TUS upload failed for ${bucket}/${path}`, error);
        finish(readableUploadError(error));
      },
    });

    try {
      upload.start();
    } catch (error) {
      console.error(`Could not start TUS upload for ${bucket}/${path}`, error);
      finish(readableUploadError(error));
    }
  });
}

async function uploadTus(
  bucket: string,
  path: string,
  blob: Blob,
  contentType: string,
  token: string,
  supabaseKey: string,
  onProgress?: ProgressFn,
  cacheControl = "3600",
): Promise<{ error: string | null }> {
  if (typeof Worker === "undefined") {
    return uploadTusInWindow(
      bucket,
      path,
      blob,
      contentType,
      token,
      supabaseKey,
      onProgress,
      cacheControl,
    );
  }

  const isVideoUpload =
    contentType.toLowerCase().startsWith("video/") ||
    bucket === STORAGE_BUCKETS.videos ||
    bucket === STORAGE_BUCKETS.reels;
  const requestedParallelUploads = isVideoUpload
    ? getTusParallelUploadCount(blob.size, true)
    : 1;
  let parallelUploads = 1;
  if (requestedParallelUploads > 1) {
    onProgress?.(0, "Preparing resumable upload");
    if (await supportsTusConcatenation(token, supabaseKey)) {
      parallelUploads = requestedParallelUploads;
    }
  }

  let worker: Worker;
  try {
    worker = new Worker(new URL("./storage-upload.worker.ts", import.meta.url), {
      type: "module",
    });
  } catch {
    return uploadTusInWindow(
      bucket,
      path,
      blob,
      contentType,
      token,
      supabaseKey,
      onProgress,
      cacheControl,
    );
  }

  return new Promise((resolve) => {
    let settled = false;
    let waitingForNetwork = false;
    const finish = (error: string | null) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      resolve({ error });
    };

    worker.onmessage = (event: MessageEvent) => {
      const message = event.data as
        | { type: "progress"; bytesSent: number; bytesTotal: number }
        | { type: "success" }
        | { type: "offline" }
        | { type: "error"; message: string };
      if (message.type === "progress") {
        const percent = message.bytesTotal
          ? Math.min(99, Math.floor((message.bytesSent / message.bytesTotal) * 100))
          : 0;
        const totalChunks = Math.max(
          1,
          Math.ceil(message.bytesTotal / TUS_CHUNK_SIZE_BYTES),
        );
        const completedChunks = Math.min(
          totalChunks,
          Math.ceil(message.bytesSent / TUS_CHUNK_SIZE_BYTES),
        );
        onProgress?.(
          percent,
          message.bytesTotal > RESUMABLE_UPLOAD_THRESHOLD_BYTES
            ? `Chunk ${completedChunks}/${totalChunks}`
            : undefined,
        );
        return;
      }
      if (message.type === "success") {
        onProgress?.(100);
        finish(null);
        return;
      }
      if (message.type === "offline") {
        if (waitingForNetwork) return;
        waitingForNetwork = true;
        void waitForNetwork().then((recovered) => {
          waitingForNetwork = false;
          if (recovered && !settled) worker.postMessage({ type: "resume" });
          else finish("The upload stopped because the network connection was lost.");
        });
        return;
      }
      if (message.type === "error") {
        finish(message.message || "The resumable upload failed.");
      }
    };

    worker.onerror = (event) => {
      console.error(`TUS upload worker failed for ${bucket}/${path}`, event.message);
      finish(event.message || "The resumable upload worker failed.");
    };

    const networkQuality = getAdaptivePerformanceSnapshot().networkQuality;
    const retryDelays =
      networkQuality === "weak"
        ? [2_000, 4_000, 8_000, 16_000, 30_000]
        : [1_000, 2_000, 4_000, 8_000, 16_000, 30_000];
    try {
      worker.postMessage({
        type: "start",
        endpoint: resumableUploadEndpoint(),
        bucket,
        path,
        blob,
        contentType,
        token,
        supabaseKey,
        cacheControl,
        chunkSize: TUS_CHUNK_SIZE_BYTES,
        parallelUploads,
        retryDelays,
      });
    } catch {
      worker.terminate();
      void uploadTusInWindow(
        bucket,
        path,
        blob,
        contentType,
        token,
        supabaseKey,
        onProgress,
        cacheControl,
      ).then(({ error }) => resolve({ error }));
    }
  });
}

/**
 * Uploads a Blob with real byte-level progress and returns a durable signed
 * URL for the just-uploaded object.
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
    return {
      url: null,
      storagePath: null,
      error: "You appear to be offline. Reconnect and try again.",
    };
  }
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("Could not authorize storage upload", sessionError);
    return { url: null, storagePath: null, error: sessionError.message };
  }
  const token = sessionData.session?.access_token;
  if (!token) {
    return { url: null, storagePath: null, error: "You need to sign in to upload." };
  }

  let upload: { error: string | null };
  try {
    const reportProgress: ProgressFn = (percent, detail) => {
      onProgress?.(needsFastStart ? Math.min(percent, 97) : percent, detail);
    };
    upload =
      bucket === STORAGE_BUCKETS.videos || bucket === STORAGE_BUCKETS.reels
        ? await uploadDirect(bucket, path, blob, contentType, reportProgress, cacheControl)
        : await uploadTus(
            bucket,
            path,
            blob,
            contentType,
            token,
            storageConfig().key,
            reportProgress,
            cacheControl,
          );
  } catch (error) {
    console.error(`Storage upload failed for ${bucket}/${path}`, error);
    return { url: null, storagePath: null, error: readableUploadError(error) };
  }

  if (upload.error) {
    console.error(`Storage upload failed for ${bucket}/${path}: ${upload.error}`);
    return { url: null, storagePath: null, error: upload.error };
  }

  let finalPath = path;
  if (needsFastStart) {
    onProgress?.(98, "Preparing video for playback");
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
      console.error(`Video processing request failed for ${bucket}`, error);
      return {
        url: null,
        storagePath: null,
        error: "The video uploaded, but playback preparation failed. Please try again.",
      };
    }

    const result: unknown = await response.json().catch(() => null);
    const responseData =
      result && typeof result === "object" ? (result as Record<string, unknown>) : null;
    if (!response.ok) {
      const message =
        typeof responseData?.error === "string"
          ? responseData.error
          : "The video uploaded, but playback preparation failed.";
      return { url: null, storagePath: null, error: message };
    }
    if (
      typeof responseData?.path !== "string" ||
      responseData.contentType !== "video/mp4" ||
      responseData.faststart !== true
    ) {
      return {
        url: null,
        storagePath: null,
        error: "The video processor returned an invalid response.",
      };
    }
    finalPath = responseData.path;
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(finalPath, 60 * 60 * 24 * 365);
  if (signError || !signed?.signedUrl) {
    console.error(`Failed to sign uploaded media ${bucket}/${finalPath}`, signError);
    return {
      url: null,
      storagePath: null,
      error: signError?.message ?? "Upload completed, but the media URL could not be created.",
    };
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
    console.error("Could not prepare media for upload", error);
    return {
      url: null,
      storagePath: null,
      error: error instanceof Error ? error.message : "Could not prepare media for upload.",
    };
  }
}