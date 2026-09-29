export const RESUMABLE_UPLOAD_CHUNK_SIZE = 6 * 1024 * 1024;

export function shouldUseResumableStorageUpload(fileSize: number) {
  return Number.isSafeInteger(fileSize) && fileSize > RESUMABLE_UPLOAD_CHUNK_SIZE;
}

export function getStorageResumableUploadEndpoint(projectUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(projectUrl.trim());
  } catch {
    throw new Error("The configured Supabase project URL is invalid.");
  }

  const suffix = ".supabase.co";
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(suffix)) {
    throw new Error("Resumable uploads require the configured HTTPS Supabase project URL.");
  }

  const projectRef = parsed.hostname.slice(0, -suffix.length);
  if (!projectRef) {
    throw new Error("The configured Supabase project URL is missing its project reference.");
  }

  return `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`;
}