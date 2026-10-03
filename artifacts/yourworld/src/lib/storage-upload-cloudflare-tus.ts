import { supabase } from "@/integrations/supabase/client";
import { readableUploadError } from "@/lib/storage-upload-request";
import { mediaApiUrl } from "@/lib/media-api-url";
import {
  CLOUDFLARE_TUS_CHUNK_SIZE,
  createTusProgressReporter,
  getTusRetryDelayMs,
  isRetryableTusError,
} from "@/lib/storage-upload-tus-utils";

const CLOUDFLARE_TUS_ENDPOINT = "/api/media/cloudflare-tus-upload";
const VIDEO_TUS_INACTIVITY_TIMEOUT_MS = 120_000;
const MAX_VIDEO_TUS_RESUMES = 3;

function mayFallbackToStorageAfterTusFailure(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const details = error as {
    originalResponse?: { getStatus?: () => number };
  };
  let status: number | undefined;
  try {
    status = details.originalResponse?.getStatus?.();
  } catch {
    status = undefined;
  }
  // 424 is returned only when Cloudflare itself rejects the upstream upload.
  // App authentication and ownership denials (401/403) must remain failures.
  if (status === 424) return true;
  if (status === 401 || status === 403) return false;
  return isRetryableTusError(
    error,
    typeof navigator === "undefined" || navigator.onLine,
  );
}

export async function uploadCloudflareStreamWithTus(options: {
  bucket: "videos" | "reels";
  path: string;
  file: Blob;
  contentType: string;
  requireSignedURLs: boolean;
  onProgress?: (percent: number) => void;
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

  const { Upload } = await import("tus-js-client");
  const endpoint = new URL(mediaApiUrl(CLOUDFLARE_TUS_ENDPOINT), window.location.origin).toString();
  const filename = options.path.split("/").pop() || "video";

  return new Promise((resolve) => {
    let settled = false;
    let streamUid: string | null = null;
    let retryAttempt = 0;
    let lastPercent = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const reportProgress = createTusProgressReporter(options.onProgress);
    const finish = (error: string | null, fallbackAllowed = false) => {
      if (settled) return;
      settled = true;
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
      const isOnline = typeof navigator === "undefined" || navigator.onLine;
      if (!isRetryableTusError(error, isOnline)) {
        finish(
          readableUploadError(error),
          mayFallbackToStorageAfterTusFailure(error),
        );
        return;
      }
      if (options.bucket === "videos" && retryAttempt >= MAX_VIDEO_TUS_RESUMES) {
        finish(readableUploadError(error), true);
        return;
      }
      const delay = getTusRetryDelayMs(retryAttempt++);
      reportProgress(lastPercent, "Connection interrupted; resuming upload.");
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void startAttempt();
      }, delay);
    };

    const startAttempt = async () => {
      if (settled) return;
      const upload = new Upload(options.file, {
        endpoint,
        chunkSize: CLOUDFLARE_TUS_CHUNK_SIZE,
        uploadDataDuringCreation: false,
        fingerprint: () =>
          Promise.resolve(
            `yourworld:cloudflare:${options.bucket}/${options.path}:${options.file.size}:${options.contentType}`,
          ),
        storeFingerprintForResuming: true,
        removeFingerprintOnSuccess: true,
        retryDelays:
          options.bucket === "videos"
            ? [0, 1000, 3000]
            : [0, 3000, 5000, 10_000, 20_000, 30_000, 60_000],
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
        onProgress: (bytesUploaded, bytesTotal) => {
          const percent =
            bytesTotal > 0 ? Math.min(99, Math.round((bytesUploaded / bytesTotal) * 100)) : 0;
          if (percent > lastPercent) retryAttempt = 0;
          lastPercent = Math.max(lastPercent, percent);
          reportProgress(lastPercent);
        },
        onError: recoverFromTransientFailure,
        onSuccess: () => {
          if (!streamUid) {
            finish(
              "Cloudflare completed the upload without returning a video ID.",
              true,
            );
            return;
          }
          reportProgress(100);
          finish(null);
        },
      });

      try {
        const previousUploads = await upload.findPreviousUploads().catch(() => []);
        if (settled) return;
        if (previousUploads.length > 0) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }
        upload.start();
      } catch (error) {
        recoverFromTransientFailure(error);
      }
    };

    void startAttempt();
  });
}