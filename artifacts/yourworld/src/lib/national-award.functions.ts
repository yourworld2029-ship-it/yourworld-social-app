import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  isNationalAwardCode,
  NATIONAL_AWARD_OPTIONS,
  type NationalAwardCode,
  type NationalAwardEvidence,
  type NationalAwardEvidenceKind,
  type NationalAwardPublicBadge,
  type NationalAwardStatus,
  type NationalAwardVerificationDetails,
} from "@/lib/national-award";

const evidenceBucket = "national-award-evidence";
const maxCertificateSize = 15 * 1024 * 1024;
const maxIntroductionSize = 100 * 1024 * 1024;
const certificateMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const introductionMimeTypes = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

type NationalAwardRow = {
  user_id: string;
  full_name: string;
  father_name: string;
  date_of_birth: string;
  phone_number: string;
  email: string;
  village_town: string;
  district: string;
  state: string;
  country: "India";
  identity_details_confirmed: boolean;
  award_code: string;
  award_year: number;
  certificate_path: string;
  certificate_file_name: string;
  certificate_mime_type: string;
  certificate_size: number;
  introduction_path: string;
  introduction_file_name: string;
  introduction_mime_type: string;
  introduction_size: number;
  review_status: Exclude<NationalAwardStatus, "not_submitted">;
  review_reason: string | null;
  submitted_at: string;
};

async function getAdminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function emptyDetails(): NationalAwardVerificationDetails {
  return {
    fullName: "",
    fatherName: "",
    dateOfBirth: "",
    phoneNumber: "",
    email: "",
    villageTown: "",
    district: "",
    state: "",
    country: "India",
    identityDetailsConfirmed: false,
    awardCode: "",
    awardYear: "",
    certificate: null,
    introductionVideo: null,
    status: "not_submitted",
    reviewReason: null,
    submittedAt: null,
  };
}

function evidenceFromRow(
  path: string,
  name: string,
  mimeType: string,
  size: number,
): NationalAwardEvidence {
  return { path, name, mimeType, size: Number(size) };
}

function mapRow(row: NationalAwardRow | null): NationalAwardVerificationDetails {
  if (!row) return emptyDetails();

  return {
    fullName: row.full_name,
    fatherName: row.father_name,
    dateOfBirth: row.date_of_birth,
    phoneNumber: row.phone_number,
    email: row.email,
    villageTown: row.village_town,
    district: row.district,
    state: row.state,
    country: "India",
    identityDetailsConfirmed: row.identity_details_confirmed,
    awardCode: isNationalAwardCode(row.award_code) ? row.award_code : "",
    awardYear: String(row.award_year),
    certificate: evidenceFromRow(
      row.certificate_path,
      row.certificate_file_name,
      row.certificate_mime_type,
      row.certificate_size,
    ),
    introductionVideo: evidenceFromRow(
      row.introduction_path,
      row.introduction_file_name,
      row.introduction_mime_type,
      row.introduction_size,
    ),
    status: row.review_status,
    reviewReason: row.review_reason,
    submittedAt: row.submitted_at,
  };
}

export const getNationalAwardVerificationDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await getAdminClient();
    const { data, error } = await admin
      .from("national_award_verifications")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(`Could not load National Award Verification: ${error.message}`);
    return mapRow((data as NationalAwardRow | null) ?? null);
  });

const submissionSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  fatherName: z.string().trim().min(1).max(120),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phoneNumber: z.string().trim().min(5).max(32),
  email: z.string().trim().email().max(254),
  villageTown: z.string().trim().min(1).max(120),
  district: z.string().trim().min(1).max(120),
  state: z.string().trim().min(1).max(120),
  identityDetailsConfirmed: z.literal(true),
  awardCode: z.string().refine(isNationalAwardCode, "Select a valid National Award."),
  awardYear: z.coerce.number().int().min(1947).max(2026),
  certificatePath: z.string().min(1).max(512),
  certificateFileName: z.string().trim().min(1).max(255),
  introductionPath: z.string().min(1).max(512),
  introductionFileName: z.string().trim().min(1).max(255),
});

async function findStoredEvidence(
  admin: Awaited<ReturnType<typeof getAdminClient>>,
  userId: string,
  kind: NationalAwardEvidenceKind,
  path: string,
) {
  const expectedPath = `${userId}/${kind}/evidence`;
  if (path !== expectedPath) {
    throw new Error("The uploaded evidence does not belong to this account.");
  }

  const { data, error } = await admin.storage
    .from(evidenceBucket)
    .list(`${userId}/${kind}`, { limit: 20, search: "evidence" });
  if (error) throw new Error(`Could not confirm uploaded evidence: ${error.message}`);

  const file = data?.find((entry) => entry.name === "evidence");
  if (!file) throw new Error("Upload the required verification evidence before submitting.");

  const metadata = (file.metadata ?? {}) as Record<string, unknown>;
  const mimeType = String(metadata.mimetype ?? metadata.contentType ?? "");
  const size = Number(metadata.size ?? 0);
  const allowedTypes =
    kind === "certificate" ? certificateMimeTypes : introductionMimeTypes;
  const maxSize = kind === "certificate" ? maxCertificateSize : maxIntroductionSize;

  if (!allowedTypes.has(mimeType) || !Number.isFinite(size) || size <= 0 || size > maxSize) {
    throw new Error(
      kind === "certificate"
        ? "Use a PDF or image certificate smaller than 15 MB."
        : "Use an MP4, WebM, or MOV introduction video smaller than 100 MB.",
    );
  }

  return {
    path,
    mimeType,
    size,
  };
}

function validateDateOfBirth(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value ||
    value > new Date().toISOString().slice(0, 10)
  ) {
    throw new Error("Enter a valid date of birth that is not in the future.");
  }
}

export const submitNationalAwardVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => submissionSchema.parse(data))
  .handler(async ({ data, context }) => {
    validateDateOfBirth(data.dateOfBirth);
    const admin = await getAdminClient();
    const [certificate, introduction] = await Promise.all([
      findStoredEvidence(admin, context.userId, "certificate", data.certificatePath),
      findStoredEvidence(admin, context.userId, "introduction", data.introductionPath),
    ]);

    const awardCode = data.awardCode as NationalAwardCode;
    if (!NATIONAL_AWARD_OPTIONS.some((option) => option.value === awardCode)) {
      throw new Error("Select a valid National Award.");
    }

    const { data: status, error } = await admin.rpc(
      "submit_national_award_verification",
      {
        p_user_id: context.userId,
        p_full_name: data.fullName,
        p_father_name: data.fatherName,
        p_date_of_birth: data.dateOfBirth,
        p_phone_number: data.phoneNumber,
        p_email: data.email,
        p_village_town: data.villageTown,
        p_district: data.district,
        p_state: data.state,
        p_award_code: awardCode,
        p_award_year: data.awardYear,
        p_certificate_path: certificate.path,
        p_certificate_file_name: data.certificateFileName,
        p_certificate_mime_type: certificate.mimeType,
        p_certificate_size: certificate.size,
        p_introduction_path: introduction.path,
        p_introduction_file_name: data.introductionFileName,
        p_introduction_mime_type: introduction.mimeType,
        p_introduction_size: introduction.size,
      },
    );
    if (error) throw new Error(error.message);
    if (status !== "pending_verification") {
      throw new Error("National Award Verification could not be submitted.");
    }

    const { data: savedRow, error: savedError } = await admin
      .from("national_award_verifications")
      .select("*")
      .eq("user_id", context.userId)
      .single();
    if (savedError) throw new Error(savedError.message);
    return mapRow(savedRow as NationalAwardRow);
  });

function requireAdminStepUp(claims: unknown) {
  const aal = (claims as { aal?: string } | null | undefined)?.aal ?? "aal1";
  if (aal !== "aal2") {
    throw new Error(
      "Admin MFA is required. Complete the two-step verification challenge and try again.",
    );
  }
}

async function requireNationalAwardAdmin(userId: string, claims: unknown) {
  const admin = await getAdminClient();
  const { data, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) {
    throw new Error("Forbidden: National Award Verification admin access is required.");
  }
  requireAdminStepUp(claims);
  return admin;
}

export const listNationalAwardVerificationApplications = createServerFn({
  method: "POST",
})
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await requireNationalAwardAdmin(context.userId, context.claims);
    const { data, error } = await admin
      .from("national_award_verifications")
      .select("*")
      .eq("review_status", "pending_verification")
      .order("submitted_at", { ascending: true })
      .limit(100);
    if (error) throw new Error(`Could not load Award Verification requests: ${error.message}`);

    const applications = await Promise.all(
      ((data ?? []) as NationalAwardRow[]).map(async (row) => {
        const [certificateResult, introductionResult] = await Promise.all([
          admin.storage
            .from(evidenceBucket)
            .createSignedUrl(row.certificate_path, 300),
          admin.storage
            .from(evidenceBucket)
            .createSignedUrl(row.introduction_path, 300),
        ]);
        if (certificateResult.error || introductionResult.error) {
          throw new Error("Could not create secure links for the submitted evidence.");
        }

        return {
          userId: row.user_id,
          fullName: row.full_name,
          fatherName: row.father_name,
          dateOfBirth: row.date_of_birth,
          phoneNumber: row.phone_number,
          email: row.email,
          villageTown: row.village_town,
          district: row.district,
          state: row.state,
          country: "India" as const,
          awardCode: row.award_code as NationalAwardCode,
          awardYear: row.award_year,
          status: row.review_status,
          reviewReason: row.review_reason,
          submittedAt: row.submitted_at,
          certificateName: row.certificate_file_name,
          certificateUrl: certificateResult.data.signedUrl,
          introductionName: row.introduction_file_name,
          introductionUrl: introductionResult.data.signedUrl,
        };
      }),
    );

    return { applications };
  });

const reviewSchema = z.object({
  applicantUserId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(1000).optional().nullable(),
});

export const reviewNationalAwardVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => reviewSchema.parse(data))
  .handler(async ({ data, context }) => {
    const admin = await requireNationalAwardAdmin(context.userId, context.claims);
    const reason = data.reason?.trim() || null;
    if (data.action === "reject" && !reason) {
      throw new Error("A reason is required when rejecting an Award Verification request.");
    }

    const { data: status, error } = await admin.rpc(
      "review_national_award_verification",
      {
        p_user_id: data.applicantUserId,
        p_admin_user_id: context.userId,
        p_action: data.action,
        p_reason: reason,
      },
    );
    if (error) throw new Error(error.message);
    if (status !== "approved" && status !== "rejected") {
      throw new Error("The Award Verification request could not be reviewed.");
    }
    return { status, reason };
  });

export type { NationalAwardPublicBadge };