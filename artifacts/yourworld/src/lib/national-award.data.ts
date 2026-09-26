import { supabase } from "@/integrations/supabase/client";
import {
  isNationalAwardCode,
  type NationalAwardEvidence,
  type NationalAwardEvidenceKind,
  type NationalAwardPublicBadge,
} from "@/lib/national-award";

const evidenceBucket = "national-award-evidence";
const maxCertificateSize = 15 * 1024 * 1024;
const maxIntroductionSize = 100 * 1024 * 1024;

const allowedMimeTypes: Record<NationalAwardEvidenceKind, Set<string>> = {
  certificate: new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ]),
  introduction: new Set(["video/mp4", "video/webm", "video/quicktime"]),
};

export async function uploadNationalAwardEvidence(
  userId: string,
  kind: NationalAwardEvidenceKind,
  file: File,
): Promise<NationalAwardEvidence> {
  if (!userId) throw new Error("Sign in before uploading verification evidence.");

  const maxSize =
    kind === "certificate" ? maxCertificateSize : maxIntroductionSize;
  if (!allowedMimeTypes[kind].has(file.type) || file.size <= 0 || file.size > maxSize) {
    throw new Error(
      kind === "certificate"
        ? "Choose a PDF, JPG, PNG, or WebP certificate under 15 MB."
        : "Choose an MP4, WebM, or MOV introduction video under 100 MB.",
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