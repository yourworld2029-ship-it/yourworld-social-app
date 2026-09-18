import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const SPORTS_VERIFICATION_DUPLICATE_MESSAGE =
  "This Document / Identity is Already Registered. This identity or document has already been submitted or verified on another account. Duplicate submissions are strictly prohibited.";

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
});

const reviewActionSchema = z.object({
  applicantUserId: z.string().uuid(),
  action: z.enum(["approve", "reject", "request_correction"]),
  reason: z.string().trim().max(2000).optional(),
});

type AdminProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  category: string | null;
  bio: string | null;
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
  review_status?: string | null;
  review_reason?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  updated_at: string;
};

export type ReviewDocument = {
  kind: "sportsCertificate" | "passportFirstPage" | "passportVisaStampPage" | "tournamentPhoto";
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
  };
  accountEmail: string | null;
  accountMobile: string | null;
  status: "pending";
  reviewReason: string | null;
  submittedAt: string | null;
  deadlineAt: string | null;
  overdue: boolean;
  sportsIntroductionUrl: string | null;
  documents: ReviewDocument[];
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
  const { data: existing, error: existingError } = await admin
    .from("posts")
    .select("id")
    .eq("user_id", ownerId)
    .eq("kind", "reel")
    .eq("media_url", reelPath)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing?.id) return existing.id;

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
      title: "Sports Introduction",
      caption: "Sports Introduction",
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
      .select("id")
      .eq("user_id", ownerId)
      .eq("kind", "reel")
      .eq("media_url", reelPath)
      .maybeSingle();
    if (raced?.id) return raced.id;
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

async function buildDocuments(
  admin: Awaited<ReturnType<typeof getAdminClient>>,
  ownerId: string,
  details: VerificationDetailsRow | null,
  international: boolean,
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
          valueAfterLabel(profile.bio, ["Represents", "Country", "Team"]) ?? "",
        );
        const [sportsIntroductionUrl, documents] = await Promise.all([
          createPrivateSignedUrl(
            admin,
            "videos",
            profile.id,
            extractSportsIntroductionPath(profile.bio),
          ),
          buildDocuments(admin, profile.id, details, international),
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
          },
          accountEmail: authUser.user?.email ?? details?.email ?? null,
          accountMobile: authUser.user?.phone ?? details?.mobile_number ?? null,
          status: "pending" as const,
          reviewReason: details?.review_reason ?? null,
          submittedAt,
          deadlineAt,
          overdue: Boolean(deadlineAt && Date.parse(deadlineAt) < Date.now()),
          sportsIntroductionUrl,
          documents,
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
      .select("id,is_verified,verification_requested")
      .eq("id", data.applicantUserId)
      .maybeSingle();
    if (profileReadError) throw new Error(profileReadError.message);
    if (!profile?.verification_requested) {
      throw new Error("This Sports Verification request is no longer pending.");
    }

    const now = new Date().toISOString();
    const status =
      data.action === "approve"
        ? "approved"
        : data.action === "reject"
          ? "rejected"
          : "correction_requested";

    const { data: updatedProfile, error: profileError } = await admin
      .from("profiles")
      .update({
        is_verified: data.action === "approve",
        verification_requested: false,
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
        review_status: status,
        review_reason: reason,
        reviewed_at: now,
        reviewed_by: context.userId,
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
    valueAfterLabel(profile.bio, ["Represents", "Country", "Team"]) || "Not recorded";
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
        "id,username,display_name,category,bio,avatar_url,is_verified,verification_requested,updated_at",
      )
      .eq("id", context.userId)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);
    if (!profile) throw new Error("Your profile could not be found.");

    const sportsIntroductionPath = extractSportsIntroductionPath(profile.bio);
    if (!sportsIntroductionPath) {
      throw new Error("Upload your Sports Introduction video before submitting verification.");
    }

    const { data: currentDetails, error: currentDetailsError } = await admin
      .from("sports_verification_details")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (currentDetailsError) throw new Error(currentDetailsError.message);

    if (profile.is_verified) {
      throw new Error("This Sports Verification request is already approved.");
    }

    if (profile.verification_requested) {
      await ensurePublicSportsIntroductionReel(admin, context.userId, sportsIntroductionPath);
      return {
        submittedAt: currentDetails?.submitted_at ?? new Date().toISOString(),
        notification: { sent: true, reason: null },
      };
    }

    if (currentDetails?.review_status === "approved") {
      throw new Error("This Sports Verification request is already approved.");
    }

    const existingIdentity = await findExistingIdentity(admin, context.userId, data);
    if (existingIdentity) {
      throw new Error(SPORTS_VERIFICATION_DUPLICATE_MESSAGE);
    }

    const now = new Date().toISOString();
    const { error: detailsError } = await admin
      .from("sports_verification_details")
      .upsert(
        {
        user_id: context.userId,
        full_name: data.fullName,
        father_name: data.fatherName,
        date_of_birth: data.dateOfBirth,
        identity_details_confirmed: true,
        review_status: "pending",
        review_reason: null,
        submitted_at: now,
        reviewed_at: null,
        reviewed_by: null,
        updated_at: now,
        },
        { onConflict: "user_id" },
      );
    if (detailsError) {
      if (isDuplicateIdentityError(detailsError)) {
        throw new Error(SPORTS_VERIFICATION_DUPLICATE_MESSAGE);
      }
      throw new Error(detailsError.message);
    }

    const { error: requestError } = await admin
      .from("profiles")
      .update({ is_verified: false, verification_requested: true })
      .eq("id", context.userId);
    if (requestError) throw new Error(requestError.message);

    await ensurePublicSportsIntroductionReel(admin, context.userId, sportsIntroductionPath);

    const { data: details } = await admin
      .from("sports_verification_details")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    const notification = await notifySupportOfSubmission(
      profile as AdminProfileRow,
      (details as VerificationDetailsRow | null) ?? null,
    );

    return { submittedAt: now, notification };
  });