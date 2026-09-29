import { supabase } from "@/integrations/supabase/client";
import { readableUploadError } from "@/lib/storage-upload-request";
import {
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
    const finish = (error: string | null) => {
      if (settled) return;
      settled = true;
      resolve({ error });
    };

    const upload = new Upload(options.file, {
      endpoint,
      chunkSize: RESUMABLE_UPLOAD_CHUNK_SIZE,
      retryDelays: [0, 3000, 5000, 10_000, 20_000],
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
        options.onProgress?.(percent, "Uploading");
      },
      onError: (error) => finish(readableUploadError(error)),
      onSuccess: () => {
        options.onProgress?.(100, "Upload complete");
        finish(null);
      },
    });

    try {
      void upload
        .findPreviousUploads()
        .then((previousUploads) => {
          if (previousUploads.length > 0) {
            upload.resumeFromPreviousUpload(previousUploads[0]);
          }
          upload.start();
        })
        .catch(() => upload.start());
    } catch (error) {
      finish(readableUploadError(error));
    }
  });
}