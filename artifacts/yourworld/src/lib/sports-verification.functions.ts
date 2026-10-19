import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  countryCodeForSportsCountry,
  isIndiaSportsCountry,
  isIndianIdentityProofType,
} from "@/lib/sports-country";

export const SPORTS_VERIFICATION_DUPLICATE_MESSAGE =
  "Yeh sports account pehle se bana hua hai. Duplicate registration allowed nahi hai.";

const sportsVerificationSubmissionSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your Full Name exactly as shown on your identity document.").max(200),
  fatherName: z
    .string()
    .trim()
    .min(1, "Enter your Father's Name exactly as shown on your identity document.")
    .max(200),
  dateOfBirth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid Date of Birth.")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return (
        Number.isFinite(date.getTime()) &&
        date.toISOString().slice(0, 10) === value &&
        date.getTime() <= Date.now()
      );
    }, "Enter a real Date of Birth that is not in the future."),
  identityDetailsConfirmed: z.literal(true, {
    errorMap: () => ({
      message: "Confirm that your Full Name, Father's Name, and DOB match your identity documents exactly.",
    }),
  }),
  upgradeToInternational: z.boolean().optional().default(false),
});

const reviewActionSchema = z.object({
  applicantUserId: z.string().uuid(),
  action: z.enum(["approve", "reject", "request_correction"]),
  reason: z.string().trim().max(2000).optional(),
  identityProofConfirmed: z.boolean().optional(),
});

type AdminProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  category: string | null;
  bio: string | null;
  country?: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  verification_requested: boolean | null;
  updated_at: string | null;
};

type VerificationDetailsRow = {
  user_id: string;
  full_name: string;
  father_name: string;
  date_of_birth: string | null;
  address: string;
  passport_number: string;
  certificate_number: string;
  identity_details_confirmed: boolean;
  passport_number_normalized?: string | null;
  certificate_number_normalized?: string | null;
  identity_key?: string | null;
  village_town: string;
  district: string;
  state: string;
  country: string;
  mobile_number: string;
  email: string;
  sports_certificate_path: string | null;
  passport_first_page_path: string | null;
  passport_visa_stamp_page_path: string | null;
  tournament_photo_path: string | null;
  indian_identity_proof_path: string | null;
  indian_identity_proof_type: string | null;
  review_status?: string | null;
  upgrade_to_international?: boolean;
  review_reason?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  updated_at: string;
};

export type ReviewDocument = {
  kind:
    | "sportsCertificate"
    | "passportFirstPage"
    | "passportVisaStampPage"
    | "tournamentPhoto"
    | "indianIdentityProof";
  name: string;
  mimeType: string;
  url: string | null;
};

export type AdminVerificationApplication = {
  profile: AdminProfileRow;
  details: {
    fullName: string;
    fatherName: string;
    dateOfBirth: string | null;
    address: string;
    passportNumber: string;
    certificateNumber: string;
    villageTown: string;
    district: string;
    state: string;
    country: string;
    email: string;
    mobileNumber: string;
    indianIdentityProofType: string | null;
  };
  accountEmail: string | null;
  accountMobile: string | null;
  status: "pending";
  upgradeToInternational: boolean;
  reviewReason: string | null;
  submittedAt: string | null;
  deadlineAt: string | null;
  overdue: boolean;
  sportsIntroductionUrl: string | null;
  documents: ReviewDocument[];
  nationalIdentityProofRequired: boolean;
};

async function getAdminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function normalizeIdentityPart(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function identityKeyForSubmission(data: {
  fullName: string;
  fatherName: string;
  dateOfBirth: string;
}) {
  return `${normalizeIdentityPart(data.fullName)}|${normalizeIdentityPart(data.fatherName)}|${data.dateOfBirth}`;
}

function setInternationalRepresentation(bio: string | null | undefined) {
  const lines = (bio ?? "").split(/\r?\n/);
  const representationLine = /^\s*(?:representation|represents|status)\s*:/i;
  const remaining = lines.filter((line) => !representationLine.test(line));
  return ["Representation: International", ...remaining].filter(Boolean).join("\n");
}

function representationFromProfile(profile: Pick<AdminProfileRow, "bio" | "category">) {
  return (
    valueAfterLabel(profile.bio ?? null, ["representation", "represents", "status"]) ??
    (/international/i.test(profile.category ?? "")
      ? "International"
      : /national/i.test(profile.category ?? "")
        ? "National"
        : "")
  );
}

function isDuplicateIdentityError(error: { code?: string; message?: string } | null | undefined) {
  return (
    error?.code === "23505" ||
    /duplicate key|sports_verification_active_(passport|certificate|identity)_unique/i.test(
      error?.message ?? "",
    )
  );
}

async function findExistingIdentity(
  admin: Awaited<ReturnType<typeof getAdminClient>>,
  ownerId: string,
  data: z.infer<typeof sportsVerificationSubmissionSchema>,
) {
  const base = () =>
    admin
      .from("sports_verification_details")
      .select("user_id")
      .neq("user_id", ownerId)
      .in("review_status", ["pending", "approved"])
      .limit(1);
  const { data: existing, error } = await base().eq(
    "identity_key",
    identityKeyForSubmission(data),
  );
  if (error) throw new Error(error.message);
  return existing?.[0]?.user_id ?? null;
}

async function requireSportsVerificationAdmin(userId: string) {
  const admin = await getAdminClient();
  const { data, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error || !data) {
    throw new Error("Forbidden: Sports Verification admin access is required.");
  }
  return admin;
}

function requireAdminStepUp(claims: unknown) {
  const aal = (claims as { aal?: string } | null | undefined)?.aal ?? "aal1";
  if (aal !== "aal2") {
    throw new Error("Admin MFA is required. Complete the two-step verification challenge and try again.");
  }
}

function valueAfterLabel(text: string | null, labels: string[]) {
  if (!text) return null;
  const normalizedLabels = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const match = text.match(
    new RegExp(`(?:^|\\n)\\s*(?:${normalizedLabels.join("|")})\\s*:\\s*(.+?)(?=\\n|$)`, "i"),
  );
  return match?.[1]?.trim() || null;
}

function extractSportsIntroductionPath(bio: string | null) {
  const value = valueAfterLabel(bio, ["Sports Introduction", "Sports Introduction Video"]);
  return value && !/^none$/i.test(value) ? value : null;
}

async function ensurePublicSportsIntroductionReel(
  admin: Awaited<ReturnType<typeof getAdminClient>>,
  ownerId: string,
  username: string | null,
  sourcePath: string,
) {
  if (
    !sourcePath.startsWith(`${ownerId}/sports-introduction/`) ||
    sourcePath.includes("..")
  ) {
    throw new Error("The Sports Introduction video path is invalid.");
  }

  const fileName = sourcePath.split("/").at(-1) || "sports-introduction.mp4";
  const reelPath = `${ownerId}/sports-introduction/${fileName}`;
  const caption = `Sports Verification Intro • @${username?.trim() || "you"}`;
  const { data: existing, error: existingError } = await admin
    .from("posts")
    .select("id,caption,title")
    .eq("user_id", ownerId)
    .eq("kind", "reel")
    .eq("media_url", reelPath)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing?.id) {
    if (existing.caption !== caption || existing.title !== "Sports Verification Intro") {
      const { error: updateError } = await admin
        .from("posts")
        .update({ caption, title: "Sports Verification Intro" })
        .eq("id", existing.id);
      if (updateError) throw new Error(updateError.message);
    }
    return existing.id;
  }

  const { data: source, error: downloadError } = await admin.storage
    .from("videos")
    .download(sourcePath);
  if (downloadError || !source) {
    throw new Error(downloadError?.message ?? "The Sports Introduction video is unavailable.");
  }

  const { error: uploadError } = await admin.storage.from("reels").upload(reelPath, source, {
    cacheControl: "86400",
    contentType: source.type || "video/mp4",
    upsert: true,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data: created, error: insertError } = await admin
    .from("posts")
    .insert({
      user_id: ownerId,
      kind: "reel",
      is_reel: true,
      media_url: reelPath,
      media_type: "video",
      thumbnail_url: null,
      title: "Sports Verification Intro",
      caption,
      hashtags: [],
      audio: null,
      allow_download: true,
      audience: "everyone",
      tagged_user_ids: [],
      viewer_user_ids: [],
    })
    .select("id")
    .single();
  if (insertError) {
    // A retry can race another submission after the storage copy. Re-read the
    // deterministic media path before surfacing a duplicate error.
    const { data: raced } = await admin
      .from("posts")
      .select("id,caption,title")
      .eq("user_id", ownerId)
      .eq("kind", "reel")
      .eq("media_url", reelPath)
      .maybeSingle();
    if (raced?.id) {
      if (raced.caption !== caption || raced.title !== "Sports Verification Intro") {
        await admin
          .from("posts")
          .update({ caption, title: "Sports Verification Intro" })
          .eq("id", raced.id);
      }
      return raced.id;
    }
    throw new Error(insertError.message);
  }
  return created.id;
}

function documentName(path: string) {
  return path.split("/").at(-1) || "verification document";
}

async function createPrivateSignedUrl(
  admin: Awaited<ReturnType<typeof getAdminClient>>,
  bucket: string,
  ownerId: string,
  path: string | null,
) {
  if (!path || path.includes("..") || !path.startsWith(`${ownerId}/`)) return null;
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, 15 * 60);
  return error ? null : data?.signedUrl ?? null;
}

async function verifyStoredIndianIdentityProof(
  admin: Awaited<ReturnType<typeof getAdminClient>>,
  ownerId: string,
  details: VerificationDetailsRow,
) {
  const path = details.indian_identity_proof_path;
  const prefix = `${ownerId}/sports-verification/indianIdentityProof/`;
  if (!path || !path.startsWith(prefix) || path.includes("..")) {
    throw new Error("Upload a valid private Indian identity proof before continuing.");
  }
  const fileName = path.slice(prefix.length);
  if (!fileName || fileName.includes("/")) {
    throw new Error("The Indian identity proof file path is invalid.");
  }
  const { data, error } = await admin.storage
    .from("documents")
    .list(`${ownerId}/sports-verification/indianIdentityProof`, {
      limit: 100,
      search: fileName,
    });
  if (error) throw new Error(`Could not verify the Indian identity proof upload: ${error.message}`);
  const file = data?.find((entry) => entry.name === fileName);
  const metadata = (file?.metadata ?? {}) as Record<string, unknown>;
  const mimeType = String(metadata.mimetype ?? metadata.contentType ?? "");
  const size = Number(metadata.size ?? 0);
  if (
    !file ||
    !new Set(["application/pdf", "image/jpeg", "image/png"]).has(mimeType) ||
    !Number.isFinite(size) ||
    size <= 0 ||
    size > 15 * 1024 * 1024
  ) {
    throw new Error("The Indian identity proof is missing or is not an accepted file type.");
  }
}

async function buildDocuments(
  admin: Awaited<ReturnType<typeof getAdminClient>>,
  ownerId: string,
  details: VerificationDetailsRow | null,
  international: boolean,
  nationalIdentityProofRequired = false,
): Promise<ReviewDocument[]> {
  if (!details) return [];
  const entries: Array<[ReviewDocument["kind"], string | null]> = [
    ["sportsCertificate", details.sports_certificate_path],
    ["tournamentPhoto", details.tournament_photo_path],
  ] as const;
  if (international) {
    entries.splice(1, 0, ["passportFirstPage", details.passport_first_page_path]);
    entries.splice(2, 0, ["passportVisaStampPage", details.passport_visa_stamp_page_path]);
  }
  if (nationalIdentityProofRequired) {
    entries.push(["indianIdentityProof", details.indian_identity_proof_path]);
  }

  return Promise.all(
    entries.map(async ([kind, path]) => ({
      kind,
      name: path ? documentName(path) : `${kind} not submitted`,
      mimeType: kind === "tournamentPhoto" ? "image/*" : "application/octet-stream",
      url: await createPrivateSignedUrl(admin, "documents", ownerId, path),
    })),
  );
}

function deadlineFor(submittedAt: string | null) {
  if (!submittedAt) return null;
  const timestamp = Date.parse(submittedAt);
  return Number.isFinite(timestamp) ? new Date(timestamp + 72 * 60 * 60 * 1000).toISOString() : null;
}

export const listSportsVerificationApplications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await requireSportsVerificationAdmin(context.userId);
    requireAdminStepUp(context.claims);
    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select(
        "id,username,display_name,category,bio,avatar_url,is_verified,verification_requested,updated_at",
      )
      .eq("verification_requested", true)
      .order("updated_at", { ascending: true })
      .limit(100);

    if (profilesError) throw new Error(profilesError.message);
    const rows = (profiles ?? []) as AdminProfileRow[];
    if (!rows.length) return { applications: [] as AdminVerificationApplication[] };

    const ids = rows.map((profile) => profile.id);
    const { data: detailRows, error: detailsError } = await admin
      .from("sports_verification_details")
      .select("*")
      .in("user_id", ids);
    if (detailsError) throw new Error(detailsError.message);

    const detailsByUser = new Map(
      ((detailRows ?? []) as VerificationDetailsRow[]).map((details) => [details.user_id, details]),
    );

    const applications = await Promise.all(
      rows.map(async (profile) => {
        const details = detailsByUser.get(profile.id) ?? null;
        const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
        const submittedAt = details?.submitted_at ?? details?.updated_at ?? profile.updated_at;
        const deadlineAt = deadlineFor(submittedAt);
        const international = /^international$/i.test(
          valueAfterLabel(profile.bio, ["Representation", "Represents", "Country", "Team"]) ?? "",
        ) || details?.upgrade_to_international === true;
        const nationalIdentityProofRequired =
          !details?.upgrade_to_international &&
          isIndiaSportsCountry(details?.country) &&
          /^national$/i.test(
            valueAfterLabel(profile.bio, ["Representation", "Represents", "Country", "Team"]) ?? "",
          );
        const [sportsIntroductionUrl, documents] = await Promise.all([
          createPrivateSignedUrl(
            admin,
            "videos",
            profile.id,
            extractSportsIntroductionPath(profile.bio),
          ),
          buildDocuments(admin, profile.id, details, international, nationalIdentityProofRequired),
        ]);

        return {
          profile,
          details: {
            fullName: details?.full_name ?? "",
            fatherName: details?.father_name ?? "",
            dateOfBirth: details?.date_of_birth ?? null,
            address: details?.address ?? "",
            passportNumber: details?.passport_number ?? "",
            certificateNumber: details?.certificate_number ?? "",
            villageTown: details?.village_town ?? "",
            district: details?.district ?? "",
            state: details?.state ?? "",
            country: details?.country ?? "",
            email: details?.email ?? "",
            mobileNumber: details?.mobile_number ?? "",
            indianIdentityProofType: details?.indian_identity_proof_type ?? null,
          },
          accountEmail: authUser.user?.email ?? details?.email ?? null,
          accountMobile: authUser.user?.phone ?? details?.mobile_number ?? null,
          status: "pending" as const,
          upgradeToInternational: details?.upgrade_to_international === true,
          reviewReason: details?.review_reason ?? null,
          submittedAt,
          deadlineAt,
          overdue: Boolean(deadlineAt && Date.parse(deadlineAt) < Date.now()),
          sportsIntroductionUrl,
          documents,
          nationalIdentityProofRequired,
        };
      }),
    );

    return { applications };
  });

export const reviewSportsVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => reviewActionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const admin = await requireSportsVerificationAdmin(context.userId);
    requireAdminStepUp(context.claims);
    const reason = data.reason?.trim() || null;
    if ((data.action === "reject" || data.action === "request_correction") && !reason) {
      throw new Error("A reason is required for rejection or correction requests.");
    }

    const { data: profile, error: profileReadError } = await admin
      .from("profiles")
      .select("id,is_verified,verification_requested,bio,category,country")
      .eq("id", data.applicantUserId)
      .maybeSingle();
    if (profileReadError) throw new Error(profileReadError.message);
    if (!profile?.verification_requested) {
      throw new Error("This Sports Verification request is no longer pending.");
    }

    const { data: requestDetails, error: requestDetailsError } = await admin
      .from("sports_verification_details")
      .select("*")
      .eq("user_id", data.applicantUserId)
      .maybeSingle();
    if (requestDetailsError) throw new Error(requestDetailsError.message);
    const isInternationalUpgrade = requestDetails?.upgrade_to_international === true;
    if (data.action === "approve" && !isInternationalUpgrade) {
      const countryCode = countryCodeForSportsCountry(profile.country);
      if (!countryCode) {
        throw new Error("Select a valid nationality/country before approving this application.");
      }
      if (countryCodeForSportsCountry(requestDetails?.country) !== countryCode) {
        throw new Error("The submitted verification country no longer matches the profile country.");
      }
      const representation = representationFromProfile(profile);
      if (countryCode !== "IN" && !/^international$/i.test(representation)) {
        throw new Error("Applicants outside India can only be approved for International representation.");
      }
      if (countryCode === "IN" && /^national$/i.test(representation)) {
        if (
          !requestDetails?.indian_identity_proof_path ||
          !isIndianIdentityProofType(requestDetails.indian_identity_proof_type)
        ) {
          throw new Error("Aadhaar, an Indian Passport, or Voter ID is required before National approval.");
        }
        if (data.identityProofConfirmed !== true) {
          throw new Error("Confirm that the uploaded identity proof is Indian-issued before approving.");
        }
        await verifyStoredIndianIdentityProof(admin, data.applicantUserId, requestDetails);
      }
    }
    const now = new Date().toISOString();
    const status =
      data.action === "approve"
        ? "approved"
        : data.action === "reject"
          ? "rejected"
          : "correction_requested";
    const persistedStatus =
      isInternationalUpgrade && data.action !== "approve" ? "approved" : status;

    const { data: updatedProfile, error: profileError } = await admin
      .from("profiles")
      .update({
        is_verified: data.action === "approve" || isInternationalUpgrade,
        verification_requested: false,
        ...(data.action === "approve" && isInternationalUpgrade
          ? { bio: setInternationalRepresentation(profile.bio) }
          : {}),
      })
      .eq("id", data.applicantUserId)
      .eq("verification_requested", true)
      .select("id")
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);
    if (!updatedProfile) {
      throw new Error("This Sports Verification request is no longer pending.");
    }

    const { error: detailsError } = await admin.from("sports_verification_details").upsert(
      {
        user_id: data.applicantUserId,
        review_status: persistedStatus,
        review_reason: reason,
        reviewed_at: now,
        reviewed_by: context.userId,
        upgrade_to_international: isInternationalUpgrade
          ? data.action === "request_correction"
          : undefined,
        updated_at: now,
      },
      { onConflict: "user_id" },
    );
    if (detailsError) throw new Error(detailsError.message);

    const { error: auditError } = await admin.from("sports_verification_review_audit").insert({
      applicant_user_id: data.applicantUserId,
      admin_user_id: context.userId,
      action: data.action,
      reason,
    });
    if (auditError) throw new Error(auditError.message);

    return { status, reason };
  });

async function notifySupportOfSubmission(
  profile: AdminProfileRow,
  details: VerificationDetailsRow | null,
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[sports-verification] RESEND_API_KEY is not configured; support notification skipped.");
    return { sent: false, reason: "Support email service is not configured." };
  }

  const categoryParts = (profile.category ?? "").split("·").map((part) => part.trim());
  const role = categoryParts[0] || "Sports profile";
  const sport = categoryParts[1] || valueAfterLabel(profile.bio, ["Sport"]) || "Not recorded";
  const representation =
    valueAfterLabel(profile.bio, ["Representation", "Represents", "Country", "Team"]) || "Not recorded";
  const submittedAt = details?.submitted_at ?? new Date().toISOString();
  const appUrl = process.env.REPLIT_APP_URL || "https://your-world-social-app--yourworld2029.replit.app";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: "YourWorld Verification <onboarding@resend.dev>",
      to: [process.env.SUPPORT_EMAIL || "yourworld2029@gmail.com"],
      subject: "New Sports Verification request",
      html: [
        "<p>New verification request</p>",
        `<p>User name: ${escapeHtml(profile.display_name || profile.username || "Unnamed applicant")}</p>`,
        `<p>Username: @${escapeHtml(profile.username || "—")}</p>`,
        `<p>Sport: ${escapeHtml(sport)}</p>`,
        `<p>Player/Coach: ${escapeHtml(role)}</p>`,
        `<p>National/International: ${escapeHtml(representation)}</p>`,
        `<p>Submission time: ${escapeHtml(submittedAt)}</p>`,
        `<p>Review: <a href="${escapeAttribute(`${appUrl}/admin/sports-verification`)}">${escapeHtml(
          `${appUrl}/admin/sports-verification`,
        )}</a></p>`,
      ].join(""),
    }),
  });

  if (!response.ok) {
    console.error("[sports-verification] Support notification failed", response.status);
    return { sent: false, reason: "Support notification could not be sent." };
  }
  return { sent: true, reason: null };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

export const submitSportsVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => sportsVerificationSubmissionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const admin = await getAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select(
        "id,username,display_name,category,bio,avatar_url,is_verified,verification_requested,updated_at,country",
      )
      .eq("id", context.userId)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);
    if (!profile) throw new Error("Your profile could not be found.");

    const { data: currentDetails, error: currentDetailsError } = await admin
      .from("sports_verification_details")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (currentDetailsError) throw new Error(currentDetailsError.message);

    const existingIdentity = await findExistingIdentity(admin, context.userId, data);
    if (existingIdentity) {
      throw new Error(SPORTS_VERIFICATION_DUPLICATE_MESSAGE);
    }

    const sportsIntroductionPath = extractSportsIntroductionPath(profile.bio);
    if (!sportsIntroductionPath) {
      throw new Error("Upload your Sports Introduction video before submitting verification.");
    }

    if (profile.verification_requested) {
      await ensurePublicSportsIntroductionReel(
        admin,
        context.userId,
        profile.username,
        sportsIntroductionPath,
      );
      return {
        submittedAt: currentDetails?.submitted_at ?? new Date().toISOString(),
        notification: { sent: true, reason: null },
        introPublished: true,
      };
    }

    if (data.upgradeToInternational) {
      if (
        profile.is_verified !== true ||
        currentDetails?.review_status !== "approved" &&
          currentDetails?.review_status !== "rejected" &&
          currentDetails?.review_status !== "correction_requested" ||
        !/^national$/i.test(representationFromProfile(profile))
      ) {
        throw new Error("Only approved National sports accounts can request an International upgrade.");
      }
      if (
        identityKeyForSubmission(data) !==
        identityKeyForSubmission({
          fullName: currentDetails?.full_name ?? "",
          fatherName: currentDetails?.father_name ?? "",
          dateOfBirth: currentDetails?.date_of_birth ?? "",
        })
      ) {
        throw new Error("Identity details cannot be changed during an International upgrade.");
      }
    } else if (profile.is_verified || currentDetails?.review_status === "approved") {
      throw new Error("This Sports Verification request is already approved.");
    }
    if (!data.upgradeToInternational) {
      const countryCode = countryCodeForSportsCountry(profile.country);
      if (!countryCode) {
        throw new Error("Choose your Country / Region in Edit Profile before submitting.");
      }
      if (countryCodeForSportsCountry(currentDetails?.country) !== countryCode) {
        throw new Error("Save verification details again to match the Country / Region on your profile.");
      }
      const representation = representationFromProfile(profile);
      if (countryCode !== "IN" && !/^international$/i.test(representation)) {
        throw new Error("Applicants outside India can apply only for International Player or Coach verification.");
      }
      if (countryCode === "IN" && /^national$/i.test(representation)) {
        if (
          !currentDetails?.indian_identity_proof_path ||
          !isIndianIdentityProofType(currentDetails.indian_identity_proof_type)
        ) {
          throw new Error("Upload Aadhaar, an Indian Passport, or Voter ID before applying under National representation.");
        }
        await verifyStoredIndianIdentityProof(admin, context.userId, currentDetails);
      }
    }

    const now = new Date().toISOString();
    const detailsPayload = {
        user_id: context.userId,
        full_name: data.fullName,
        father_name: data.fatherName,
        date_of_birth: data.dateOfBirth,
        identity_details_confirmed: true,
          ...(data.upgradeToInternational ? { upgrade_to_international: true } : {}),
        ...(!data.upgradeToInternational
          ? {
              country: profile.country,
              indian_identity_proof_path: currentDetails?.indian_identity_proof_path ?? null,
              indian_identity_proof_type: currentDetails?.indian_identity_proof_type ?? null,
            }
          : {}),
        review_status: "pending",
        review_reason: null,
        submitted_at: now,
        reviewed_at: null,
        reviewed_by: null,
        updated_at: now,
    };
    const { user_id: applicantId, ...upgradeDetailsPayload } = detailsPayload;
    const { error: detailsError } = data.upgradeToInternational
      ? await admin
          .from("sports_verification_details")
          .update(upgradeDetailsPayload)
          .eq("user_id", applicantId)
      : await admin
          .from("sports_verification_details")
          .upsert(detailsPayload, { onConflict: "user_id" });
    if (detailsError) {
      if (isDuplicateIdentityError(detailsError)) {
        throw new Error(SPORTS_VERIFICATION_DUPLICATE_MESSAGE);
      }
      throw new Error(detailsError.message);
    }

    const { error: requestError } = await admin
      .from("profiles")
      .update({
        is_verified: data.upgradeToInternational,
        verification_requested: true,
      })
      .eq("id", context.userId);
    if (requestError) throw new Error(requestError.message);

    await ensurePublicSportsIntroductionReel(
      admin,
      context.userId,
      profile.username,
      sportsIntroductionPath,
    );

    const { data: details } = await admin
      .from("sports_verification_details")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    const notification = await notifySupportOfSubmission(
      (data.upgradeToInternational
        ? {
            ...(profile as AdminProfileRow),
            bio: setInternationalRepresentation(profile.bio),
          }
        : (profile as AdminProfileRow)),
      (details as VerificationDetailsRow | null) ?? null,
    );

    return { submittedAt: now, notification };
  });