export const TUS_CHUNK_SIZE_BYTES = 6 * 1024 * 1024;

const MIN_PARALLEL_PART_SIZE_BYTES = 5 * 1024 * 1024;
const MIN_PARALLEL_UPLOADS = 3;
const MAX_PARALLEL_UPLOADS = 4;

/**
 * Supabase TUS parallel parts require the server's concatenation extension.
 * Use 3–4 streams only for large files when that capability is confirmed.
 */
export function getTusParallelUploadCount(
  fileSizeBytes: number,
  supportsConcatenation: boolean,
): number {
  if (
    !supportsConcatenation ||
    !Number.isFinite(fileSizeBytes) ||
    fileSizeBytes < MIN_PARALLEL_PART_SIZE_BYTES * MIN_PARALLEL_UPLOADS
  ) {
    return 1;
  }

  return Math.min(
    MAX_PARALLEL_UPLOADS,
    Math.max(MIN_PARALLEL_UPLOADS, Math.floor(fileSizeBytes / TUS_CHUNK_SIZE_BYTES)),
  );
}