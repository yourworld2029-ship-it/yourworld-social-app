import { supabase } from "@/integrations/supabase/client";
import { readableUploadError } from "@/lib/storage-upload-request";

const CLOUDFLARE_TUS_ENDPOINT = "/api/media/cloudflare-tus-upload";
const CLOUDFLARE_TUS_CHUNK_SIZE = 5 * 1024 * 1024;

export async function uploadCloudflareStreamWithTus(options: {
  bucket: "videos" | "reels";
  path: string;
  file: Blob;
  contentType: string;
  requireSignedURLs: boolean;
  onProgress?: (percent: number) => void;
}): Promise<{ streamUid: string | null; error: string | null }> {
  if (typeof window === "undefined") {
    return { streamUid: null, error: "Cloudflare upload requires a browser session." };
  }

  const { Upload } = await import("tus-js-client");
  const endpoint = new URL(CLOUDFLARE_TUS_ENDPOINT, window.location.origin).toString();
  const filename = options.path.split("/").pop() || "video";

  return new Promise((resolve) => {
    let settled = false;
    let streamUid: string | null = null;
    const finish = (error: string | null) => {
      if (settled) return;
      settled = true;
      resolve({ streamUid: error ? null : streamUid, error });
    };

    const upload = new Upload(options.file, {
      endpoint,
      chunkSize: CLOUDFLARE_TUS_CHUNK_SIZE,
      retryDelays: [0, 3000, 5000, 10_000, 20_000],
      uploadDataDuringCreation: false,
      fingerprint: () =>
        Promise.resolve(
          `yourworld:cloudflare:${options.bucket}/${options.path}:${options.file.size}:${options.contentType}`,
        ),
      storeFingerprintForResuming: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: options.bucket,
        objectName: options.path,
        contentType: options.contentType,
        name: filename,
        requiresSignedUrls: String(options.requireSignedURLs),
      },
      onBeforeRequest: async (request) => {
        let requestUrl: URL;
        try {
          requestUrl = new URL(request.getURL(), window.location.href);
        } catch {
          return;
        }
        if (
          requestUrl.origin !== window.location.origin ||
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
        options.onProgress?.(percent);
      },
      onError: (error) => finish(readableUploadError(error)),
      onSuccess: () => {
        if (!streamUid) {
          finish("Cloudflare completed the upload without returning a video ID.");
          return;
        }
        options.onProgress?.(100);
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