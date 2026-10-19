import { isEvidenceFlaggedForReview } from "@/lib/verification-review";

export const NATIONAL_AWARD_OPTIONS = [
  { value: "bharat_ratna", label: "Bharat Ratna 🎖️" },
  { value: "padma_award", label: "Padma Award (Vibhushan / Bhushan / Shri) 🎖️" },
  { value: "param_vir_ashoka_chakra", label: "Param Vir / Ashoka Chakra ⚔️" },
  { value: "shaurya_kirti_chakra", label: "Shaurya / Kirti Chakra ⚔️" },
  { value: "sena_medal_gallantry", label: "Sena Medal (Gallantry) 🇮🇳" },
  {
    value: "presidents_police_medal_gallantry",
    label: "President's Police Medal for Gallantry (PPMG) 🛡️",
  },
] as const;

export type NationalAwardCode = (typeof NATIONAL_AWARD_OPTIONS)[number]["value"];
export type NationalAwardEvidenceKind = "certificate" | "introduction" | "identity";
export const NATIONAL_AWARD_EVIDENCE_KINDS: readonly NationalAwardEvidenceKind[] = [
  "identity",
  "certificate",
  "introduction",
];

export function canRepairNationalAwardEvidence(
  reviewReason: string | null | undefined,
  kind: NationalAwardEvidenceKind,
) {
  return isEvidenceFlaggedForReview(reviewReason, kind, NATIONAL_AWARD_EVIDENCE_KINDS);
}

export type NationalAwardStatus =
  | "not_submitted"
  | "draft"
  | "pending"
  | "pending_verification"
  | "approved"
  | "rejected";

export const NATIONAL_AWARD_TERMS_VERSION = "national-award-v1";

export type NationalAwardEvidence = {
  path: string;
  name: string;
  mimeType: string;
  size: number;
};

export const INDIAN_IDENTITY_PROOF_TYPES = [
  { value: "aadhaar", label: "Aadhaar" },
  { value: "indian_passport", label: "Indian Passport" },
  { value: "voter_id", label: "Voter ID" },
] as const;

export type IndianIdentityProofType =
  (typeof INDIAN_IDENTITY_PROOF_TYPES)[number]["value"];

export type NationalAwardFormValues = {
  fullName: string;
  fatherName: string;
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  villageTown: string;
  district: string;
  state: string;
  country: "India";
  identityDetailsConfirmed: boolean;
  awardCode: NationalAwardCode | "";
  awardYear: string;
  indianIdentityProofType: IndianIdentityProofType | "";
  indianIdentityProof: NationalAwardEvidence | null;
  certificate: NationalAwardEvidence | null;
  introductionVideo: NationalAwardEvidence | null;
};

export type NationalAwardVerificationDetails = NationalAwardFormValues & {
  status: NationalAwardStatus;
  reviewReason: string | null;
  submittedAt: string | null;
};

export type NationalAwardSubmissionInput = Omit<
  NationalAwardFormValues,
  "country" | "certificate" | "introductionVideo" | "indianIdentityProof"
> & {
  indianIdentityProofPath: string;
  indianIdentityProofFileName: string;
  certificatePath: string;
  certificateFileName: string;
  introductionVideoPath: string;
  introductionFileName: string;
  termsAccepted: true;
};

export type NationalAwardPublicBadge = {
  awardCode: NationalAwardCode;
  awardYear: number;
  verifiedAt: string;
};

export const NATIONAL_AWARD_YEARS = Array.from(
  { length: 2026 - 1947 + 1 },
  (_, index) => String(1947 + index),
);

export function formatNationalAwardDobInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function parseNationalAwardDobInput(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  if (
    year < 1 ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatNationalAwardDobDisplay(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

export function isValidNationalAwardDobIso(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  return parseNationalAwardDobInput(`${match[3]}/${match[2]}/${match[1]}`) === value;
}

export function nationalAwardLabel(awardCode: NationalAwardCode): string {
  switch (awardCode) {
    case "bharat_ratna":
      return "🎖️ BHARAT RATNA AWARDEE 🇮🇳";
    case "padma_award":
      return "🎖️ PADMA AWARDEE 🇮🇳";
    case "param_vir_ashoka_chakra":
      return "⚔️ PARAM VIR / ASHOKA CHAKRA 🇮🇳";
    case "shaurya_kirti_chakra":
      return "⚔️ SHAURYA / KIRTI CHAKRA 🇮🇳";
    case "sena_medal_gallantry":
      return "🎖️ SENA MEDAL (GALLANTRY) 🇮🇳";
    case "presidents_police_medal_gallantry":
      return "🛡️ PRESIDENT'S POLICE MEDAL FOR GALLANTRY 🇮🇳";
  }
}

export function isNationalAwardCode(value: string): value is NationalAwardCode {
  return NATIONAL_AWARD_OPTIONS.some((option) => option.value === value);
}