export type UploadRequestProgress = (percent: number, detail?: string) => void;

export function readableUploadError(error: unknown) {
  if (typeof error === "string" && error.trim()) return error;
  if (error instanceof Error && error.message) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string" &&
    (error as { message: string }).message
  ) {
    return (error as { message: string }).message;
  }
  return "The storage upload failed. Please try again.";
}

/**
 * Supabase's standard upload request has no byte progress event. Keep the
 * task in Uploading until the response arrives, then report transfer complete.
 */
export async function runDirectUploadRequest(
  request: () => Promise<{ error: unknown | null }>,
  onProgress?: UploadRequestProgress,
): Promise<{ error: string | null }> {
  onProgress?.(0, "Uploading");
  try {
    const { error } = await request();
    if (error) return { error: readableUploadError(error) };
    onProgress?.(100, "Upload complete");
    return { error: null };
  } catch (error) {
    return { error: readableUploadError(error) };
  }
}