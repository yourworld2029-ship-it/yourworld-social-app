import { supabase } from "@/integrations/supabase/client";
import { normalizeSupabaseProjectUrl } from "@/integrations/supabase/url";

export type ProgressFn = (percent: number) => void;

/** Supabase recommends 6 MiB TUS chunks for reliable resumable uploads. */
export const TUS_CHUNK_SIZE_BYTES = 6 * 1024 * 1024;
const TUS_VERSION = "1.0.0";
const TUS_MAX_RETRIES = 5;

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

const SUPABASE_URL = normalizeSupabaseProjectUrl(
  (import.meta.env?.["VITE_SUPABASE_URL"] as string | undefined) ?? "",
);
const SUPABASE_KEY =
  (import.meta.env?.["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined) ?? "";

function resumableUploadEndpoint() {
  const url = new URL(SUPABASE_URL);
  // Supabase's direct Storage hostname avoids the general API gateway's
  // request-size path and is recommended for large resumable uploads.
  if (url.hostname.endsWith(".supabase.co") && !url.hostname.endsWith(".storage.supabase.co")) {
    url.hostname = url.hostname.replace(/\.supabase\.co$/, ".storage.supabase.co");
  }
  url.pathname = "/storage/v1/upload/resumable";
  url.search = "";
  url.hash = "";
  return url.toString();
}

type TusResponse = {
  status: number;
  location: string | null;
  offset: number | null;
  body: string;
  error: string | null;
};

function base64Metadata(value: string) {
  // Storage paths are normally ASCII, but metadata can contain Unicode MIME
  // parameters and must still be valid TUS base64.
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function tusError(response: XMLHttpRequest) {
  let detail = "";
  try {
    const body = JSON.parse(response.responseText) as { message?: string; error?: string };
    detail = body.message || body.error || "";
  } catch {
    detail = (response.responseText || "").slice(0, 160);
  }
  return `Upload failed (${response.status || "network error"})${detail ? `: ${detail}` : ""}`;
}

function tusRequest(
  method: "POST" | "HEAD" | "PATCH",
  url: string,
  headers: Record<string, string>,
  body: Blob | null,
  onProgress?: (loaded: number) => void,
): Promise<TusResponse> {
  return new Promise((resolve) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.responseType = "text";
      for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
      if (method === "PATCH") {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) onProgress?.(event.loaded);
        };
      }
      xhr.onload = () => {
        const offsetHeader = xhr.getResponseHeader("Upload-Offset");
        const parsedOffset = offsetHeader === null ? null : Number.parseInt(offsetHeader, 10);
        resolve({
          status: xhr.status,
          location: xhr.getResponseHeader("Location"),
          offset: Number.isFinite(parsedOffset) ? parsedOffset : null,
          body: xhr.responseText || "",
          error: xhr.status >= 200 && xhr.status < 300 ? null : tusError(xhr),
        });
      };
      xhr.onerror = () =>
        resolve({
          status: 0,
          location: null,
          offset: null,
          body: "",
          error: "Network error while uploading",
        });
      xhr.ontimeout = () =>
        resolve({
          status: 0,
          location: null,
          offset: null,
          body: "",
          error: "Upload timed out",
        });
      xhr.onabort = () =>
        resolve({
          status: 0,
          location: null,
          offset: null,
          body: "",
          error: "Upload cancelled",
        });
      xhr.send(body);
    } catch (error) {
      resolve({
        status: 0,
        location: null,
        offset: null,
        body: "",
        error: error instanceof Error ? error.message : "Upload failed",
      });
    }
  });
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryableTusStatus(status: number) {
  return status === 0 || status === 408 || status === 409 || status === 429 || status >= 500;
}

/**
 * Uploads a blob through Supabase Storage's resumable TUS endpoint.
 *
 * The browser only sends 6 MiB PATCH requests, so multi-GB files never become
 * one request or a base64 payload. If a PATCH fails, HEAD recovers the server
 * offset before retrying, allowing the upload to continue from the last byte.
 */
async function uploadTus(
  bucket: string,
  path: string,
  blob: Blob,
  contentType: string,
  token: string,
  onProgress?: ProgressFn,
): Promise<{ error: string | null }> {
  const endpoint = resumableUploadEndpoint();
  const commonHeaders = {
    authorization: `Bearer ${token}`,
    apikey: SUPABASE_KEY,
    "tus-resumable": TUS_VERSION,
  };
  const metadata = [
    `bucketName ${base64Metadata(bucket)}`,
    `objectName ${base64Metadata(path)}`,
    `contentType ${base64Metadata(contentType)}`,
    `cacheControl ${base64Metadata("3600")}`,
  ].join(",");

  let created: TusResponse | null = null;
  for (let attempt = 0; attempt <= TUS_MAX_RETRIES; attempt += 1) {
    created = await tusRequest(
      "POST",
      endpoint,
      {
        ...commonHeaders,
        "upload-length": String(blob.size),
        "upload-metadata": metadata,
        "x-upsert": "false",
      },
      null,
    );
    if (!created.error) break;
    if (!isRetryableTusStatus(created.status) || attempt === TUS_MAX_RETRIES) {
      return { error: created.error };
    }
    await wait(500 * 2 ** attempt);
  }

  if (!created || created.error || !created.location) {
    return { error: created?.error ?? "Upload session could not be created." };
  }

  const uploadUrl = new URL(created.location, endpoint).toString();
  let offset = created.offset ?? 0;
  onProgress?.(blob.size ? Math.min(99, Math.floor((offset / blob.size) * 100)) : 99);

  while (offset < blob.size) {
    const chunk = blob.slice(offset, Math.min(offset + TUS_CHUNK_SIZE_BYTES, blob.size));
    let chunkComplete = false;
    let lastError = "Chunk upload failed";

    for (let attempt = 0; attempt <= TUS_MAX_RETRIES; attempt += 1) {
      const sentFrom = offset;
      const response = await tusRequest(
        "PATCH",
        uploadUrl,
        {
          ...commonHeaders,
          "content-type": "application/offset+octet-stream",
          "upload-offset": String(sentFrom),
        },
        chunk,
        (loaded) => {
          const totalLoaded = Math.min(blob.size, sentFrom + loaded);
          onProgress?.(Math.min(99, Math.floor((totalLoaded / blob.size) * 100)));
        },
      );

      if (!response.error) {
        const nextOffset = response.offset ?? sentFrom + chunk.size;
        if (nextOffset <= sentFrom || nextOffset > blob.size) {
          return { error: "Storage returned an invalid upload offset." };
        }
        offset = nextOffset;
        chunkComplete = true;
        break;
      }

      lastError = response.error;
      if (!isRetryableTusStatus(response.status) || attempt === TUS_MAX_RETRIES) break;

      // A connection can drop after Storage commits a chunk but before the
      // browser receives 204. Recover the authoritative offset before retry.
      const head = await tusRequest("HEAD", uploadUrl, commonHeaders, null);
      if (!head.error && head.offset !== null) {
        if (head.offset > blob.size) return { error: "Storage returned an invalid upload offset." };
        offset = head.offset;
        if (offset >= blob.size) {
          chunkComplete = true;
          break;
        }
        if (offset !== sentFrom) {
          chunkComplete = true;
          break;
        }
      }
      await wait(500 * 2 ** attempt);
    }

    if (!chunkComplete) return { error: lastError };
  }

  onProgress?.(100);
  return { error: null };
}

/**
 * Uploads a blob with real byte-level progress and returns a signed URL.
 * Supabase Storage's resumable TUS endpoint handles the actual file transfer.
 */
export async function uploadWithProgress(
  bucket: string,
  path: string,
  blob: Blob,
  contentType: string,
  onProgress?: ProgressFn,
): Promise<{ url: string | null; error: string | null }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return { url: null, error: "You need to sign in to upload." };

  const upload = await uploadTus(bucket, path, blob, contentType, token, onProgress);
  if (upload.error) return { url: null, error: upload.error };

  const { data: signed, error: signError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signError || !signed?.signedUrl) {
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
    if (!response.ok) return { url: null, error: "The selected media is no longer available." };
    const blob = await response.blob();
    return uploadWithProgress(bucket, path, blob, blob.type || fallbackType, onProgress);
  } catch (error) {
    return {
      url: null,
      error: error instanceof Error ? error.message : "Could not prepare media for upload.",
    };
  }
}
