import { supabase } from "@/integrations/supabase/client";
import { readableUploadError } from "@/lib/storage-upload-request";
import { mediaApiUrl } from "@/lib/media-api-url";
import type {
  UploadByteProgress,
  UploadRequestProgress,
} from "@/lib/storage-upload-request";
import {
  CLOUDFLARE_TUS_CHUNK_SIZE,
  CLOUDFLARE_TUS_MIN_CHUNK_SIZE,
  createTusFileFingerprint,
  createTusProgressReporter,
  canFallbackAfterCloudflareTusFailure,
  getCloudflareTusChunkSize,
  getTusRetryDelayMs,
  isRetryableTusError,
  TUS_RETRY_DELAYS,
} from "@/lib/storage-upload-tus-utils";

const CLOUDFLARE_TUS_ENDPOINT = "/api/media/cloudflare-tus-upload";
const VIDEO_TUS_INACTIVITY_TIMEOUT_MS = 120_000;

export async function uploadCloudflareStreamWithTus(options: {
  bucket: "videos" | "reels";
  path: string;
  file: Blob;
  contentType: string;
  requireSignedURLs: boolean;
  onProgress?: UploadRequestProgress;
  reportByteProgress?: boolean;
  signal?: AbortSignal;
  getChunkSize?: () => number;
}): Promise<{
  streamUid: string | null;
  error: string | null;
  fallbackAllowed: boolean;
}> {
  if (typeof window === "undefined") {
    return {
      streamUid: null,
      error: "Cloudflare upload requires a browser session.",
      fallbackAllowed: false,
    };
  }

  let tusClient: typeof import("tus-js-client");
  try {
    tusClient = await import("tus-js-client");
  } catch (error) {
    return {
      streamUid: null,
      error: readableUploadError(error),
      fallbackAllowed:
        canFallbackAfterCloudflareTusFailure(error) || !options.requireSignedURLs,
    };
  }
  if (!tusClient.canStoreURLs || !tusClient.defaultOptions.urlStorage) {
    return {
      streamUid: null,
      error:
        "This device cannot persist resumable upload sessions. Enable local storage and retry.",
      fallbackAllowed: false,
    };
  }
  const { Upload } = tusClient;
  const endpoint = new URL(mediaApiUrl(CLOUDFLARE_TUS_ENDPOINT), window.location.origin).toString();
  const filename = options.path.split("/").pop() || "video";

  return new Promise((resolve) => {
    let settled = false;
    let uploadUrlWasCreated = false;
    let streamUid: string | null = null;
    let retryAttempt = 0;
    let useMicroChunks = false;
    let lastPercent = 0;
    let lastByteProgress: UploadByteProgress | null | undefined =
      options.reportByteProgress ? null : undefined;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let activeUpload: { abort: () => Promise<void> } | null = null;
    const reportProgress = createTusProgressReporter(options.onProgress);
    const abortTransfer = () => {
      if (settled) return;
      const runningUpload = activeUpload;
      activeUpload = null;
      finish("Upload cancelled");
      if (runningUpload) void runningUpload.abort().catch(() => undefined);
    };
    const finish = (error: string | null, fallbackAllowed = false) => {
      if (settled) return;
      settled = true;
      options.signal?.removeEventListener("abort", abortTransfer);
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = null;
      if (error) reportProgress.cancel();
      else reportProgress.flush();
      resolve({
        streamUid: error ? null : streamUid,
        error,
        fallbackAllowed: error ? fallbackAllowed : false,
      });
    };

    const recoverFromTransientFailure = (error: unknown) => {
      if (settled) return;
      activeUpload = null;
      if (options.signal?.aborted) {
        finish("Upload cancelled");
        return;
      }
      const isOnline = typeof navigator === "undefined" || navigator.onLine;
      if (!isRetryableTusError(error, isOnline)) {
        finish(
          readableUploadError(error),
          canFallbackAfterCloudflareTusFailure(error, isOnline),
        );
        return;
      }
      useMicroChunks = true;
      const delay = getTusRetryDelayMs(retryAttempt++);
      reportProgress(lastPercent, "Connection interrupted; resuming upload.", lastByteProgress);
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void startAttempt();
      }, delay);
    };

    const startAttempt = async () => {
      if (settled) return;
      if (options.signal?.aborted) {
        finish("Upload cancelled");
        return;
      }
      const upload = new Upload(options.file, {
        endpoint,
        chunkSize: getCloudflareTusChunkSize(
          useMicroChunks
            ? CLOUDFLARE_TUS_MIN_CHUNK_SIZE
            : options.getChunkSize?.() ?? CLOUDFLARE_TUS_CHUNK_SIZE,
        ),
        urlStorage: tusClient.defaultOptions.urlStorage,
        uploadDataDuringCreation: false,
        fingerprint: () =>
          Promise.resolve(
            createTusFileFingerprint(
              `yourworld:cloudflare:${options.bucket}/${options.path}`,
              options.file,
              filename,
            ),
          ),
        storeFingerprintForResuming: true,
        removeFingerprintOnSuccess: true,
        retryDelays: TUS_RETRY_DELAYS,
        metadata: {
          bucketName: options.bucket,
          objectName: options.path,
          contentType: options.contentType,
          name: filename,
          requiresSignedUrls: String(options.requireSignedURLs),
        },
        onBeforeRequest: async (request) => {
          if (options.bucket === "videos" && typeof XMLHttpRequest !== "undefined") {
            const xhr = request.getUnderlyingObject();
            if (xhr instanceof XMLHttpRequest) {
              let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
              const clearInactivityTimer = () => {
                if (inactivityTimer) clearTimeout(inactivityTimer);
                inactivityTimer = null;
              };
              const resetInactivityTimer = () => {
                clearInactivityTimer();
                inactivityTimer = setTimeout(() => {
                  if (xhr.readyState === XMLHttpRequest.DONE) return;
                  xhr.dispatchEvent(new Event("error"));
                  xhr.abort();
                }, VIDEO_TUS_INACTIVITY_TIMEOUT_MS);
              };
              xhr.upload.addEventListener("progress", resetInactivityTimer);
              xhr.upload.addEventListener("loadstart", resetInactivityTimer, { once: true });
              xhr.addEventListener("loadend", clearInactivityTimer, { once: true });
              resetInactivityTimer();
            }
          }

          let requestUrl: URL;
          try {
            requestUrl = new URL(request.getURL(), window.location.href);
          } catch {
            return;
          }
          if (
            requestUrl.origin !== new URL(endpoint).origin ||
            request.getMethod().toUpperCase() === "OPTIONS"
          ) {
            return;
          }

          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          const accessToken = data.session?.access_token;
          if (!accessToken) throw new Error("Your sign-in expired. Sign in and try again.");
          request.setHeader("Authorization", `Bearer ${accessToken}`);
        },
        onAfterResponse: (_request, response) => {
          const headerValue = response.getHeader("stream-media-id");
          if (headerValue && /^[a-zA-Z0-9_-]{8,128}$/.test(headerValue)) {
            streamUid = headerValue;
          }
        },
        onUploadUrlAvailable: () => {
          uploadUrlWasCreated = true;
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percent =
            bytesTotal > 0 ? Math.min(99, Math.round((bytesUploaded / bytesTotal) * 100)) : 0;
          if (percent > lastPercent) retryAttempt = 0;
          lastPercent = Math.max(lastPercent, percent);
          lastByteProgress = options.reportByteProgress
            ? bytesTotal > 0
              ? { bytesUploaded, bytesTotal }
              : null
            : undefined;
          reportProgress(
            lastPercent,
            options.reportByteProgress ? "Uploading to Cloudflare Stream" : undefined,
            lastByteProgress,
          );
        },
        onError: recoverFromTransientFailure,
        onSuccess: () => {
          activeUpload = null;
          if (options.signal?.aborted) {
            finish("Upload cancelled");
            return;
          }
          if (!streamUid) {
            finish(
              "Cloudflare completed the upload without returning a video ID.",
              true,
            );
            return;
          }
          lastByteProgress = options.reportByteProgress
            ? {
                bytesUploaded: options.file.size,
                bytesTotal: options.file.size,
              }
            : undefined;
          reportProgress(100, "Upload complete", lastByteProgress);
          finish(null);
        },
      });
      activeUpload = upload;

      try {
        const previousUploads = await upload.findPreviousUploads();
        if (settled) return;
        const previousUpload = previousUploads.find((entry) => Boolean(entry.uploadUrl));
        if (previousUpload) {
          upload.resumeFromPreviousUpload(previousUpload);
        } else if (previousUploads.length > 0 || uploadUrlWasCreated) {
          finish(
            "The saved upload session is unavailable. Refusing to restart this upload from 0%.",
          );
          return;
        }
        upload.start();
      } catch (error) {
        recoverFromTransientFailure(error);
      }
    };

    if (options.reportByteProgress) {
      reportProgress(0, "Connecting to Cloudflare Stream", null);
    }
    options.signal?.addEventListener("abort", abortTransfer, { once: true });
    if (options.signal?.aborted) abortTransfer();
    else void startAttempt();
  });
}