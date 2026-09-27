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
export type NationalAwardEvidenceKind = "certificate" | "introduction";
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
  "country" | "certificate" | "introductionVideo"
> & {
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