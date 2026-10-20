export const VERIFICATION_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const VERIFICATION_VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const VERIFICATION_DOCUMENT_ACCEPT =
  ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf";

const DOCUMENT_MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
};

export const VERIFICATION_DOCUMENT_SIZE_ERROR =
  "File size exceeds 10MB. Please choose a smaller file.";
export const VERIFICATION_VIDEO_SIZE_ERROR =
  "Video size exceeds 50MB. Please upload a compressed or shorter clip under 50MB.";

export function verificationDocumentMimeType(file: File): string | null {
  const mimeType = file.type.trim().toLowerCase();
  if (Object.values(DOCUMENT_MIME_BY_EXTENSION).includes(mimeType)) return mimeType;
  const extension = file.name.split(".").pop()?.trim().toLowerCase() ?? "";
  return DOCUMENT_MIME_BY_EXTENSION[extension] ?? null;
}

export function validateVerificationDocumentFile(file: File): string {
  if (file.size > VERIFICATION_DOCUMENT_MAX_BYTES) {
    throw new Error(VERIFICATION_DOCUMENT_SIZE_ERROR);
  }
  if (file.size <= 0 || !verificationDocumentMimeType(file)) {
    throw new Error("Choose a JPG, JPEG, PNG, or PDF document.");
  }
  return verificationDocumentMimeType(file)!;
}

export function validateVerificationVideoSize(file: File) {
  if (file.size > VERIFICATION_VIDEO_MAX_BYTES) {
    throw new Error(VERIFICATION_VIDEO_SIZE_ERROR);
  }
}
