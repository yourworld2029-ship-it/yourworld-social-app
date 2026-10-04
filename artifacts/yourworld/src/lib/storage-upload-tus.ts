import { supabase } from "@/integrations/supabase/client";
import { readableUploadError } from "@/lib/storage-upload-request";
import {
  createTusProgressReporter,
  getTusRetryDelayMs,
  isRetryableTusError,
  getStorageResumableUploadEndpoint,
  RESUMABLE_UPLOAD_CHUNK_SIZE,
} from "@/lib/storage-upload-tus-utils";

export type TusUploadProgress = (percent: number, detail?: string) => void;

export async function uploadLargeStorageObjectWithTus(options: {
  bucket: string;
  path: string;
  file: Blob;
  contentType: string;
  cacheControl: string;
  onProgress?: TusUploadProgress;
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

  const { Upload } = await import("tus-js-client");
  options.onProgress?.(0, "Uploading");

  return new Promise((resolve) => {
    let settled = false;
    let retryAttempt = 0;
    let lastPercent = 0;
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
      reportProgress(lastPercent, "Connection interrupted; resuming upload.");
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
      retryDelays: [0, 3000, 5000, 10_000, 20_000, 30_000, 60_000],
      uploadDataDuringCreation: true,
      fingerprint: () =>
        Promise.resolve(
          `yourworld:${endpoint}:${options.bucket}/${options.path}:${options.file.size}:${options.file.type}`,
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
      onProgress: (bytesUploaded, bytesTotal) => {
        const percent =
          bytesTotal > 0 ? Math.min(99, Math.round((bytesUploaded / bytesTotal) * 100)) : 0;
        retryAttempt = 0;
        lastPercent = percent;
        reportProgress(percent, "Uploading");
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
        reportProgress(100, "Upload complete");
        finish(null);
      },
      });
      activeUpload = upload;

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

    reportProgress(0, "Uploading");
    options.signal?.addEventListener("abort", abortTransfer, { once: true });
    if (options.signal?.aborted) abortTransfer();
    else void startAttempt();
  });
}