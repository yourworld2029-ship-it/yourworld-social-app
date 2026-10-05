import { isStorageSizeLimitError } from "@/lib/storage-upload-request";
import type { ProgressFn } from "@/lib/storage-upload";
import type { LongVideoCompressionResult } from "@/lib/video-compression";

type UploadResult = { error: string | null };

export async function retryLongVideoUploadWithCompression<T extends UploadResult>(options: {
  source: Blob;
  initialResult: T;
  upload: (file: Blob) => Promise<T>;
  compress: (file: Blob) => Promise<LongVideoCompressionResult>;
  maxBytes: number;
  onProgress?: ProgressFn;
  signal?: AbortSignal;
}): Promise<{ result: T; compressionResult: LongVideoCompressionResult | null }> {
  if (!options.initialResult.error || !isStorageSizeLimitError(options.initialResult.error)) {
    return { result: options.initialResult, compressionResult: null };
  }
  if (options.signal?.aborted) {
    return {
      result: { ...options.initialResult, error: "Upload cancelled" },
      compressionResult: null,
    };
  }

  options.onProgress?.(0, "Optimizing video for storage retry", null);
  let compressionResult: LongVideoCompressionResult;
  try {
    compressionResult = await options.compress(options.source);
  } catch {
    return {
      result: {
        ...options.initialResult,
        error:
          "The upload exceeded the 500 MB storage limit, and the video could not be compressed. Choose a smaller or shorter video.",
      },
      compressionResult: null,
    };
  }

  if (options.signal?.aborted) {
    return {
      result: { ...options.initialResult, error: "Upload cancelled" },
      compressionResult: null,
    };
  }
  if (
    !compressionResult.compressed ||
    compressionResult.blob.size <= 0 ||
    compressionResult.blob.size >= options.source.size ||
    compressionResult.blob.size >= options.maxBytes
  ) {
    return {
      result: {
        ...options.initialResult,
        error:
          "The upload exceeded the 500 MB storage limit, and compression could not produce a smaller file under the limit.",
      },
      compressionResult: null,
    };
  }

  options.onProgress?.(0, "Retrying upload with compressed video", null);
  return {
    result: await options.upload(compressionResult.blob),
    compressionResult,
  };
}
