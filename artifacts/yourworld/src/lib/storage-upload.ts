import { Upload } from "tus-js-client";
import { supabase } from "@/integrations/supabase/client";
import { normalizeSupabaseProjectUrl } from "@/integrations/supabase/url";

export type ProgressFn = (percent: number, detail?: string) => void;

/** Supabase recommends 6 MiB TUS chunks for reliable resumable uploads. */
export const TUS_CHUNK_SIZE_BYTES = 6 * 1024 * 1024;
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
} as const;

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
  return `${url}/storage/v1/upload/resumable`;
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
  if (error instanceof Error && error.message) return error.message;
  return "The resumable upload failed. Please try again.";
}

/**
 * Uploads a Blob through Supabase Storage's resumable TUS endpoint.
 *
 * tus-js-client sends the file in 6 MiB PATCH requests, persists its upload
 * fingerprint for resume support, and retries interrupted chunks. The
 * `uploadDataDuringCreation` option lets Supabase receive the first chunk with
 * the creation request instead of sending the whole file as one payload.
 */
function uploadTus(
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
      retryDelays: [1_000, 3_000],
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
): Promise<{ url: string | null; error: string | null }> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("Could not authorize storage upload", sessionError);
    return { url: null, error: sessionError.message };
  }
  const token = sessionData.session?.access_token;
  if (!token) return { url: null, error: "You need to sign in to upload." };

  let upload: { error: string | null };
  try {
    upload = await uploadTus(
      bucket,
      path,
      blob,
      contentType,
      token,
      storageConfig().key,
      onProgress,
      cacheControl,
    );
  } catch (error) {
    console.error(`Storage upload failed for ${bucket}/${path}`, error);
    return { url: null, error: readableUploadError(error) };
  }

  if (upload.error) {
    console.error(`Storage upload failed for ${bucket}/${path}: ${upload.error}`);
    return { url: null, error: upload.error };
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signError || !signed?.signedUrl) {
    console.error(`Failed to sign uploaded media ${bucket}/${path}`, signError);
    return {
      url: null,
      error: signError?.message ?? "Upload completed, but the media URL could not be created.",
    };
  }
  onProgress?.(100);
  return { url: signed.signedUrl, error: null };
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
      return { url: null, error };
    }
    const blob = await response.blob();
    return uploadWithProgress(bucket, path, blob, blob.type || fallbackType, onProgress);
  } catch (error) {
    console.error("Could not prepare media for upload", error);
    return {
      url: null,
      error: error instanceof Error ? error.message : "Could not prepare media for upload.",
    };
  }
}