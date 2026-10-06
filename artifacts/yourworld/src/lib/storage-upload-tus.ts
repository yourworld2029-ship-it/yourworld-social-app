import { supabase } from "@/integrations/supabase/client";
import { readableUploadError } from "@/lib/storage-upload-request";
import type {
  UploadByteProgress,
  UploadRequestProgress,
} from "@/lib/storage-upload-request";
import {
  createTusFileFingerprint,
  createTusProgressReporter,
  getTusRetryDelayMs,
  isRetryableTusError,
  getStorageResumableUploadEndpoint,
  RESUMABLE_UPLOAD_CHUNK_SIZE,
  TUS_RETRY_DELAYS,
} from "@/lib/storage-upload-tus-utils";

export type TusUploadProgress = UploadRequestProgress;

export async function uploadLargeStorageObjectWithTus(options: {
  bucket: string;
  path: string;
  file: Blob;
  contentType: string;
  cacheControl: string;
  onProgress?: TusUploadProgress;
  reportByteProgress?: boolean;
  signal?: AbortSignal;
}): Promise<{ error: string | null }> {
  const projectUrl = import.meta.env["VITE_SUPABASE_URL"];
  const publishableKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!projectUrl || !publishableKey) {
    return {
      error: "Resumable upload is not configured for this Supabase project.",
    };
  }

  let endpoint: string;
  try {
    endpoint = getStorageResumableUploadEndpoint(projectUrl);
  } catch (error) {
    return { error: readableUploadError(error) };
  }

  const tusClient = await import("tus-js-client");
  if (!tusClient.canStoreURLs || !tusClient.defaultOptions.urlStorage) {
    return {
      error:
        "This device cannot persist resumable upload sessions. Enable local storage and retry.",
    };
  }
  const { Upload } = tusClient;

  return new Promise((resolve) => {
    let settled = false;
    let uploadUrlWasCreated = false;
    let retryAttempt = 0;
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
    const finish = (error: string | null) => {
      if (settled) return;
      settled = true;
      options.signal?.removeEventListener("abort", abortTransfer);
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = null;
      if (error) reportProgress.cancel();
      else reportProgress.flush();
      resolve({ error });
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
        finish(readableUploadError(error));
        return;
      }
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
        chunkSize: RESUMABLE_UPLOAD_CHUNK_SIZE,
        retryDelays: TUS_RETRY_DELAYS,
        uploadDataDuringCreation: true,
        urlStorage: tusClient.defaultOptions.urlStorage,
        fingerprint: () =>
          Promise.resolve(
            createTusFileFingerprint(
              `yourworld:${endpoint}:${options.bucket}/${options.path}`,
              options.file,
              options.path.split("/").pop() || "upload",
            ),
          ),
        storeFingerprintForResuming: true,
        removeFingerprintOnSuccess: true,
        headers: { apikey: publishableKey },
        metadata: {
          bucketName: options.bucket,
          objectName: options.path,
          contentType: options.contentType,
          cacheControl: options.cacheControl,
        },
        onBeforeRequest: async (request) => {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          const accessToken = data.session?.access_token;
          if (!accessToken) throw new Error("Your sign-in expired. Sign in and try again.");
          request.setHeader("Authorization", `Bearer ${accessToken}`);
          request.setHeader("apikey", publishableKey);
        },
        onAfterResponse: async (_request, response) => {
          if (response.getStatus() === 401) {
            await supabase.auth.refreshSession();
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
          reportProgress(lastPercent, "Uploading", lastByteProgress);
        },
        onError: (error) => {
          activeUpload = null;
          if (options.signal?.aborted) finish("Upload cancelled");
          else recoverFromTransientFailure(error);
        },
        onSuccess: () => {
          activeUpload = null;
          if (options.signal?.aborted) {
            finish("Upload cancelled");
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

    reportProgress(
      0,
      options.reportByteProgress ? "Connecting to resumable uploader" : "Uploading",
      options.reportByteProgress ? null : undefined,
    );
    options.signal?.addEventListener("abort", abortTransfer, { once: true });
    if (options.signal?.aborted) abortTransfer();
    else void startAttempt();
  });
}