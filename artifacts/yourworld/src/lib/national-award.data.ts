import { supabase } from "@/integrations/supabase/client";
import {
  isNationalAwardCode,
  type NationalAwardEvidence,
  type NationalAwardEvidenceKind,
  type NationalAwardPublicBadge,
} from "@/lib/national-award";

const evidenceBucket = "national-award-evidence";
const maxCertificateSize = 15 * 1024 * 1024;
const maxIdentitySize = 15 * 1024 * 1024;
const maxIntroductionSize = 100 * 1024 * 1024;

const allowedMimeTypes: Record<NationalAwardEvidenceKind, Set<string>> = {
  certificate: new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ]),
  introduction: new Set(["video/mp4", "video/webm", "video/quicktime"]),
  identity: new Set(["application/pdf", "image/jpeg", "image/png"]),
};

export async function validateNationalAwardIntroductionVideo(file: File) {
  if (!allowedMimeTypes.introduction.has(file.type) || file.size <= 0 || file.size > maxIntroductionSize) {
    throw new Error("Choose an MP4, WebM, or MOV introduction video under 100 MB.");
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

  if (kind === "introduction") {
    await validateNationalAwardIntroductionVideo(file);
  }

  const maxSize =
    kind === "introduction"
      ? maxIntroductionSize
      : kind === "identity"
        ? maxIdentitySize
        : maxCertificateSize;
  if (!allowedMimeTypes[kind].has(file.type) || file.size <= 0 || file.size > maxSize) {
    throw new Error(
      kind === "introduction"
        ? "Choose an MP4, WebM, or MOV introduction video under 100 MB."
        : kind === "identity"
          ? "Choose Aadhaar, Indian Passport, or Voter ID as a PDF, JPG, or PNG under 15 MB."
          : "Choose a PDF, JPG, PNG, or WebP certificate under 15 MB.",
    );
  }

  const path = `${userId}/${kind}/evidence`;
  const { error } = await supabase.storage.from(evidenceBucket).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
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
    mimeType: file.type,
    size: file.size,
  };
}

export async function getNationalAwardIntroductionPreviewUrl(path: string) {
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