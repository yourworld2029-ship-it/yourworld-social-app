import { supabase } from "@/integrations/supabase/client";
import { assertNationalAwardEvidenceEditable } from "@/lib/national-award.functions";
import {
  isNationalAwardCode,
  type NationalAwardEvidence,
  type NationalAwardEvidenceKind,
  type NationalAwardPublicBadge,
} from "@/lib/national-award";
import {
  VERIFICATION_DOCUMENT_MAX_BYTES,
  VERIFICATION_VIDEO_MAX_BYTES,
  validateVerificationDocumentFile,
  validateVerificationVideoSize,
} from "@/lib/verification-upload-rules";

const evidenceBucket = "national-award-evidence";
const maxCertificateSize = VERIFICATION_DOCUMENT_MAX_BYTES;
const maxIdentitySize = VERIFICATION_DOCUMENT_MAX_BYTES;
const maxIntroductionSize = VERIFICATION_VIDEO_MAX_BYTES;

const allowedMimeTypes: Record<NationalAwardEvidenceKind, Set<string>> = {
  certificate: new Set(["application/pdf", "image/jpeg", "image/png"]),
  introduction: new Set(["video/mp4", "video/webm", "video/quicktime"]),
  identity: new Set(["application/pdf", "image/jpeg", "image/png"]),
};

export async function validateNationalAwardIntroductionVideo(file: File) {
  validateVerificationVideoSize(file);
  if (!allowedMimeTypes.introduction.has(file.type) || file.size <= 0) {
    throw new Error("Choose an MP4, WebM, or MOV introduction video under 50 MB.");
  }

  const previewUrl = URL.createObjectURL(file);
  try {
    const metadata = await new Promise<{ duration: number; width: number; height: number }>(
      (resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () =>
          resolve({
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
          });
        video.onerror = () => reject(new Error("This video could not be read."));
        video.src = previewUrl;
      },
    );
    if (!Number.isFinite(metadata.duration) || metadata.duration < 5 || metadata.duration > 50) {
      throw new Error("Video must be between 5 and 50 seconds");
    }
    if (metadata.width <= 0 || metadata.height <= metadata.width) {
      throw new Error("Choose a vertical 9:16 introduction video.");
    }
  } finally {
    URL.revokeObjectURL(previewUrl);
  }
}

export async function uploadNationalAwardEvidence(
  userId: string,
  kind: NationalAwardEvidenceKind,
  file: File,
): Promise<NationalAwardEvidence> {
  if (!userId) throw new Error("Sign in before uploading verification evidence.");
  await assertNationalAwardEvidenceEditable({ data: { kind } });

  const contentType =
    kind === "introduction" ? file.type : validateVerificationDocumentFile(file);
  if (kind === "introduction") {
    await validateNationalAwardIntroductionVideo(file);
  }

  const maxSize =
    kind === "introduction"
      ? maxIntroductionSize
      : kind === "identity"
        ? maxIdentitySize
        : maxCertificateSize;
  if (
    !allowedMimeTypes[kind].has(contentType) ||
    file.size <= 0 ||
    file.size > maxSize
  ) {
    throw new Error(
      kind === "introduction"
        ? "Choose an MP4, WebM, or MOV introduction video under 50 MB."
        : kind === "identity"
          ? "Choose Aadhaar, Indian Passport, or Voter ID as a PDF, JPG, or PNG under 10 MB."
          : "Choose a PDF, JPG, or PNG certificate under 10 MB.",
    );
  }

  const path = `${userId}/${kind}/evidence`;
  const { error } = await supabase.storage.from(evidenceBucket).upload(path, file, {
    cacheControl: "3600",
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`Could not upload this file: ${error.message}`);

  const name = file.name
    .replace(/[\\/]/g, " ")
    .split("")
    .map((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127 ? " " : character;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 255);

  return {
    path,
    name: name || "Evidence file",
    mimeType: contentType,
    size: file.size,
  };
}

export async function getNationalAwardIntroductionPreviewUrl(path: string) {
  return getNationalAwardEvidencePreviewUrl(path);
}

export async function getNationalAwardEvidencePreviewUrl(path: string) {
  if (!path || path.includes("..")) throw new Error("Invalid introduction video path.");
  const { data, error } = await supabase.storage
    .from(evidenceBucket)
    .createSignedUrl(path, 60 * 5);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Could not load the introduction video preview.");
  }
  return data.signedUrl;
}

export async function getPublicNationalAwardBadge(
  userId: string,
): Promise<NationalAwardPublicBadge | null> {
  const { data, error } = await supabase
    .from("national_award_public_badges")
    .select("award_code,award_year,verified_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Could not load the National Award badge: ${error.message}`);
  if (!data) return null;
  if (!isNationalAwardCode(data.award_code)) {
    throw new Error("The approved National Award badge has an unknown award code.");
  }

  return {
    awardCode: data.award_code,
    awardYear: data.award_year,
    verifiedAt: data.verified_at,
  };
}