import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { hasAdminConsoleAccess } from "@/lib/admin-access-policy";
import { escapeEmailHtml, sendTransactionalEmail } from "@/lib/email.server";

type AdminClient = Awaited<ReturnType<typeof getAdminClient>>;
type AdminRpcClient = {
  rpc: (
    functionName: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

type AdminProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  full_name: string | null;
  is_verified: boolean | null;
  verification_requested: boolean | null;
};

function claimsFor(context: { claims: unknown }) {
  return (context.claims ?? {}) as {
    aal?: string;
    amr?: Array<{ method?: string }>;
    email?: string;
  };
}

function assuranceLevel(context: { claims: unknown }) {
  return claimsFor(context).aal ?? "aal1";
}

async function getAdminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function requireOwnerAdmin(context: { userId: string; claims: unknown }, stepUp = true) {
  const admin = await getAdminClient();
  const email = claimsFor(context).email;
  const ownerEmail = hasAdminConsoleAccess(email, null);

  if (!ownerEmail) {
    const { data, error } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", context.userId)
        .eq("role", "admin")
        .maybeSingle();

    if (error || !hasAdminConsoleAccess(email, data?.role)) {
      throw new Error("Forbidden: owner admin access is required.");
    }
  }
  if (stepUp && assuranceLevel(context) !== "aal2") {
    throw new Error("Admin MFA is required. Complete the two-step verification challenge and try again.");
  }
  return admin;
}

async function writeAudit(
  admin: AdminClient,
  context: { userId: string; claims: unknown },
  targetUserId: string | null,
  action: string,
  reason: string,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await admin.from("admin_action_audit").insert({
    admin_user_id: context.userId,
    target_user_id: targetUserId,
    action,
    reason,
    assurance_level: assuranceLevel(context),
    metadata,
  });
  if (error) throw new Error(error.message);
}

async function profileMap(admin: AdminClient, ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length) return new Map<string, AdminProfile>();
  const { data, error } = await admin
    .from("profiles")
    .select("id,username,display_name,full_name,is_verified,verification_requested")
    .in("id", uniqueIds);
  if (error) throw new Error(error.message);
  return new Map(((data ?? []) as AdminProfile[]).map((profile) => [profile.id, profile]));
}

export type AdminConsoleData = {
  pendingVerificationCount: number | null;
  pendingUserReportsCount: number | null;
  pendingCopyrightReportsCount: number | null;
  loadErrors: {
    overview: string | null;
    userReports: string | null;
    copyrightReports: string | null;
    other: string | null;
    profileLookup: string | null;
  };
  userReports: Array<{
    id: string;
    reporterId: string;
    reportedUserId: string;
    reporter: AdminProfile | null;
    reportedUser: AdminProfile | null;
    surface: string;
    threadId: string | null;
    messageId: string | null;
    reportedPostId: string | null;
    reportedContentId: string | null;
    contentType: string | null;
    reason: string;
    description: string | null;
    status: string;
    createdAt: string;
    reviewedAt: string | null;
    resolutionReason: string | null;
  }>;
  copyrightReports: Array<{
    id: string;
    reporterId: string;
    reporter: AdminProfile | null;
    reporterFullName: string | null;
    contactEmail: string | null;
    reportedPostId: string | null;
    reportedMomentId: string | null;
    originalWorkLink: string | null;
    infringingContentLink: string | null;
    reason: string | null;
    status: string;
    createdAt: string;
    resolutionReason: string | null;
  }>;
  monetization: Array<{
    userId: string;
    profile: AdminProfile | null;
    status: string | null;
    earningsTotal: number | null;
    pendingPayout: number | null;
    createdAt: string | null;
    payoutHeld: boolean;
  }>;
  restrictions: Array<{
    id: string;
    userId: string;
    profile: AdminProfile | null;
    restrictionType: "suspended" | "blocked";
    reason: string;
    startsAt: string;
    endsAt: string | null;
    createdAt: string;
  }>;
  payoutHolds: Array<{
    id: string;
    userId: string;
    profile: AdminProfile | null;
    reason: string;
    status: string;
    createdAt: string;
  }>;
  audit: Array<{
    id: string;
    adminUserId: string;
    targetUserId: string | null;
    action: string;
    reason: string;
    assuranceLevel: string;
    createdAt: string;
  }>;
};

export const listAdminConsole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // The configured owner may read the console without another MFA gate.
    // Identity still comes from the authenticated Supabase JWT; all other
    // admin reads and sensitive mutations retain their existing AAL2 checks.
    const ownerRead = hasAdminConsoleAccess(claimsFor(context).email, null);
    const admin = await requireOwnerAdmin(context, !ownerRead);
    const [
      pendingVerification,
      userReportsResult,
      copyrightReportsResult,
      pendingUserReportsResult,
      pendingCopyrightReportsResult,
      monetizationResult,
      restrictionsResult,
      payoutHoldsResult,
      auditResult,
    ] = await Promise.all([
      admin
        .from("sports_verification_details")
        .select("user_id", { count: "exact", head: true })
        .eq("review_status", "pending")
        .not("submitted_at", "is", null),
      admin.from("user_reports").select("*").order("created_at", { ascending: false }).limit(100),
      admin.from("copyright_reports").select("*").order("created_at", { ascending: false }).limit(100),
      admin.from("user_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("copyright_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      admin
        .from("monetization")
        .select("user_id,status,earnings_total,pending_payout,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      admin
        .from("admin_account_restrictions")
        .select("*")
        .is("lifted_at", null)
        .order("created_at", { ascending: false })
        .limit(100),
      admin
        .from("admin_payout_holds")
        .select("*")
        .eq("status", "held")
        .order("created_at", { ascending: false })
        .limit(100),
      admin.from("admin_action_audit").select("*").order("created_at", { ascending: false }).limit(200),
    ]);

    const userReportRows = (userReportsResult.data ?? []) as Array<Record<string, unknown>>;
    const copyrightRows = (copyrightReportsResult.data ?? []) as Array<Record<string, unknown>>;
    const monetizationRows = (monetizationResult.data ?? []) as Array<Record<string, unknown>>;
    const restrictionRows = (restrictionsResult.data ?? []) as Array<Record<string, unknown>>;
    const payoutHoldRows = (payoutHoldsResult.data ?? []) as Array<Record<string, unknown>>;
    const ids = [
      ...userReportRows.flatMap((row) => [String(row.reporter_id ?? ""), String(row.reported_user_id ?? "")]),
      ...copyrightRows.map((row) => String(row.reporter_user_id ?? "")),
      ...monetizationRows.map((row) => String(row.user_id ?? "")),
      ...restrictionRows.map((row) => String(row.user_id ?? "")),
      ...payoutHoldRows.map((row) => String(row.user_id ?? "")),
    ];
    let profiles = new Map<string, AdminProfile>();
    let profileLookupError: string | null = null;
    try {
      profiles = await profileMap(admin, ids);
    } catch (error) {
      profileLookupError = error instanceof Error ? error.message : "Could not load report profiles.";
    }
    const heldUserIds = new Set(payoutHoldRows.map((row) => String(row.user_id)));
    const overviewErrors = [
      pendingVerification.error?.message,
      pendingUserReportsResult.error?.message,
      pendingCopyrightReportsResult.error?.message,
    ].filter(Boolean);
    const otherErrors = [
      monetizationResult.error?.message,
      restrictionsResult.error?.message,
      payoutHoldsResult.error?.message,
      auditResult.error?.message,
    ].filter(Boolean);

    return {
      pendingVerificationCount: pendingVerification.error ? null : pendingVerification.count ?? 0,
      pendingUserReportsCount: pendingUserReportsResult.error
        ? userReportsResult.error
          ? null
          : userReportRows.filter((row) => row.status === "pending").length
        : Math.max(
            pendingUserReportsResult.count ?? 0,
            userReportRows.filter((row) => row.status === "pending").length,
          ),
      pendingCopyrightReportsCount: pendingCopyrightReportsResult.error
        ? copyrightReportsResult.error
          ? null
          : copyrightRows.filter((row) => row.status === "pending").length
        : Math.max(
            pendingCopyrightReportsResult.count ?? 0,
            copyrightRows.filter((row) => row.status === "pending").length,
          ),
      loadErrors: {
        overview: overviewErrors.length ? overviewErrors.join("; ") : null,
        userReports: userReportsResult.error?.message ?? null,
        copyrightReports: copyrightReportsResult.error?.message ?? null,
        other: otherErrors.length ? otherErrors.join("; ") : null,
        profileLookup: profileLookupError,
      },
      userReports: userReportRows.map((row) => ({
        id: String(row.id),
        reporterId: String(row.reporter_id),
        reportedUserId: String(row.reported_user_id),
        reporter: profiles.get(String(row.reporter_id)) ?? null,
        reportedUser: profiles.get(String(row.reported_user_id)) ?? null,
        surface: String(row.surface ?? "unknown"),
        threadId: (row.thread_id as string | null) ?? null,
        messageId: (row.message_id as string | null) ?? null,
        reportedPostId: (row.reported_post_id as string | null) ?? null,
        reportedContentId:
          (row.reported_content_id as string | null) ??
          (row.reported_post_id as string | null) ??
          null,
        contentType: (row.content_type as string | null) ?? null,
        reason: String(row.reason ?? ""),
        description: (row.description as string | null) ?? null,
        status: String(row.status ?? "pending"),
        createdAt: String(row.created_at),
        reviewedAt: (row.reviewed_at as string | null) ?? null,
        resolutionReason: (row.resolution_reason as string | null) ?? null,
      })),
      copyrightReports: copyrightRows.map((row) => ({
        id: String(row.id),
        reporterId: String(row.reporter_user_id),
        reporter: profiles.get(String(row.reporter_user_id)) ?? null,
        reporterFullName: (row.reporter_full_name as string | null) ?? null,
        contactEmail: (row.contact_email as string | null) ?? null,
        reportedPostId: (row.reported_post_id as string | null) ?? null,
        reportedMomentId: (row.reported_moment_id as string | null) ?? null,
        originalWorkLink: (row.original_work_link as string | null) ?? null,
        infringingContentLink: (row.infringing_content_link as string | null) ?? null,
        reason: (row.reason as string | null) ?? null,
        status: String(row.status ?? "pending"),
        createdAt: String(row.created_at),
        resolutionReason: (row.resolution_reason as string | null) ?? null,
      })),
      monetization: monetizationRows.map((row) => ({
        userId: String(row.user_id),
        profile: profiles.get(String(row.user_id)) ?? null,
        status: (row.status as string | null) ?? null,
        earningsTotal: row.earnings_total == null ? null : Number(row.earnings_total),
        pendingPayout: row.pending_payout == null ? null : Number(row.pending_payout),
        createdAt: (row.created_at as string | null) ?? null,
        payoutHeld: heldUserIds.has(String(row.user_id)),
      })),
      restrictions: restrictionRows.map((row) => ({
        id: String(row.id),
        userId: String(row.user_id),
        profile: profiles.get(String(row.user_id)) ?? null,
        restrictionType: row.restriction_type as "suspended" | "blocked",
        reason: String(row.reason),
        startsAt: String(row.starts_at),
        endsAt: (row.ends_at as string | null) ?? null,
        createdAt: String(row.created_at),
      })),
      payoutHolds: payoutHoldRows.map((row) => ({
        id: String(row.id),
        userId: String(row.user_id),
        profile: profiles.get(String(row.user_id)) ?? null,
        reason: String(row.reason),
        status: String(row.status),
        createdAt: String(row.created_at),
      })),
      audit: ((auditResult.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.id),
        adminUserId: String(row.admin_user_id),
        targetUserId: (row.target_user_id as string | null) ?? null,
        action: String(row.action),
        reason: String(row.reason),
        assuranceLevel: String(row.assurance_level),
        createdAt: String(row.created_at),
      })),
    } satisfies AdminConsoleData;
  });

const reviewUserReportSchema = z.object({
  reportId: z.string().uuid(),
  action: z.enum(["resolve", "dismiss"]),
  reason: z.string().trim().min(1).max(2000),
});

export const reviewUserReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => reviewUserReportSchema.parse(data))
  .handler(async ({ data, context }) => {
    const admin = await requireOwnerAdmin(context);
    const now = new Date().toISOString();
    const status = data.action === "resolve" ? "resolved" : "dismissed";
    const { data: report, error: reportError } = await admin
      .from("user_reports")
      .update({ status, resolution_reason: data.reason, reviewed_at: now, reviewed_by: context.userId })
      .eq("id", data.reportId)
      .eq("status", "pending")
      .select("reported_user_id,reported_content_id")
      .maybeSingle();
    if (reportError) throw new Error(reportError.message);
    if (!report) throw new Error("This moderation report is no longer pending.");
    await writeAudit(admin, context, report.reported_user_id, `user_report_${data.action}`, data.reason, {
      reportId: data.reportId,
      reportedContentId: report.reported_content_id ?? null,
    });
    return { status };
  });

const copyrightReviewSchema = z.object({
  reportId: z.string().uuid(),
  action: z.enum(["takedown", "reject"]),
  reason: z.string().trim().min(1).max(2000),
});

export const reviewCopyrightReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => copyrightReviewSchema.parse(data))
  .handler(async ({ data, context }) => {
    const admin = await requireOwnerAdmin(context);
    const { data: report, error: readError } = await admin
      .from("copyright_reports")
      .select("id,reporter_user_id,reported_post_id,reported_moment_id,status")
      .eq("id", data.reportId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!report || report.status !== "pending") throw new Error("This copyright report is no longer pending.");

    if (data.action === "takedown") {
      if (report.reported_post_id) {
        const { error } = await admin.from("posts").delete().eq("id", report.reported_post_id);
        if (error) throw new Error(error.message);
      }
      if (report.reported_moment_id) {
        const { error } = await admin.from("moments").delete().eq("id", report.reported_moment_id);
        if (error) throw new Error(error.message);
      }
    }

    const now = new Date().toISOString();
    const { error: updateError } = await admin
      .from("copyright_reports")
      .update({
        status: data.action === "takedown" ? "resolved" : "rejected",
        resolution_reason: data.reason,
        reviewed_by: context.userId,
        reviewed_at: now,
        resolved_at: now,
      })
      .eq("id", data.reportId)
      .eq("status", "pending");
    if (updateError) throw new Error(updateError.message);
    await writeAudit(admin, context, report.reporter_user_id, `copyright_${data.action}`, data.reason, {
      reportId: data.reportId,
      reportedPostId: report.reported_post_id,
      reportedMomentId: report.reported_moment_id,
    });
    return { status: data.action === "takedown" ? "resolved" : "rejected" };
  });

const restrictionSchema = z.object({
  targetUserId: z.string().uuid(),
  action: z.enum(["suspend", "block", "lift_suspension", "lift_block"]),
  reason: z.string().trim().min(1).max(2000),
  durationHours: z.number().int().min(1).max(24 * 365).nullable().optional(),
});

export const updateAccountRestriction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => restrictionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const admin = await requireOwnerAdmin(context);
    if (data.targetUserId === context.userId) throw new Error("An admin cannot restrict their own account.");
    const restrictionType = data.action.includes("suspension") ? "suspended" : "blocked";

    if (data.action.startsWith("lift_")) {
      const { error } = await admin
        .from("admin_account_restrictions")
        .update({ lifted_at: new Date().toISOString(), lifted_by: context.userId })
        .eq("user_id", data.targetUserId)
        .eq("restriction_type", restrictionType)
        .is("lifted_at", null);
      if (error) throw new Error(error.message);
    } else {
      const endsAt = data.durationHours
        ? new Date(Date.now() + data.durationHours * 60 * 60 * 1000).toISOString()
        : null;
      const { error } = await admin.from("admin_account_restrictions").insert({
        user_id: data.targetUserId,
        restriction_type: restrictionType,
        reason: data.reason,
        created_by: context.userId,
        ends_at: endsAt,
      });
      if (error) throw new Error(error.message);
    }

    await writeAudit(admin, context, data.targetUserId, `account_${data.action}`, data.reason, {
      durationHours: data.durationHours ?? null,
    });
    return { action: data.action };
  });

const payoutHoldSchema = z.object({
  targetUserId: z.string().uuid(),
  action: z.enum(["hold", "release"]),
  reason: z.string().trim().min(1).max(2000),
});

export const updatePayoutHold = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => payoutHoldSchema.parse(data))
  .handler(async ({ data, context }) => {
    const admin = await requireOwnerAdmin(context);
    if (data.action === "hold") {
      const { error } = await admin.from("admin_payout_holds").insert({
        user_id: data.targetUserId,
        reason: data.reason,
        created_by: context.userId,
      });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await admin
        .from("admin_payout_holds")
        .update({ status: "released", released_at: new Date().toISOString(), released_by: context.userId })
        .eq("user_id", data.targetUserId)
        .eq("status", "held");
      if (error) throw new Error(error.message);
    }
    await writeAudit(admin, context, data.targetUserId, `payout_${data.action}`, data.reason);
    return { action: data.action };
  });

export type AdminPayoutRequest = {
  id: string;
  userId: string;
  amount: number;
  netAmount: number;
  tdsDeducted: number;
  status: string;
  currency: "INR" | "USD";
  payoutWindowStart: string | null;
  createdAt: string;
  profile: AdminProfile | null;
  payoutProfile: {
    holderName: string | null;
    legalName: string | null;
    bankName: string | null;
    accountNumber: string | null;
    ifsc: string | null;
    upiId: string | null;
    swiftBic: string | null;
    bankCountry: string | null;
    payoutMethod: "bank" | "paypal" | null;
    routingAba: string | null;
    iban: string | null;
    paypalEmail: string | null;
    taxIdentifier: string | null;
  } | null;
};

export type AdminPayoutRequestsResponse = {
  requests: AdminPayoutRequest[];
  error?: string;
};

export type AdminInternationalPayoutKyc = {
  userId: string;
  country: string;
  legalName: string;
  taxIdentifier: string;
  payoutMethod: "bank" | "paypal";
  routingAba: string | null;
  accountNumber: string | null;
  iban: string | null;
  swiftBic: string | null;
  bankName: string | null;
  paypalEmail: string | null;
  usTaxResidentDeclaration: boolean;
  nonIndianResidentDeclaration: boolean;
  submittedAt: string;
};

export const listAdminPayoutRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminPayoutRequestsResponse> => {
    let admin: AdminClient;
    try {
      admin = await requireOwnerAdmin(context);
    } catch (error) {
      return {
        requests: [],
        error: error instanceof Error ? error.message : "Admin payout access could not be verified.",
      };
    }
    const { data, error } = await admin
      .from("payout_requests")
      .select(
        "id,user_id,amount,net_amount,tds_deducted,status,currency,payout_window_start,created_at",
      )
      .in("status", ["processing", "approved"])
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) return { requests: [], error: error.message };

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const userIds = [...new Set(rows.map((row) => String(row.user_id ?? "")).filter(Boolean))];
    const usdUserIds = [...new Set(
      rows
        .filter((row) => row.currency === "USD")
        .map((row) => String(row.user_id ?? ""))
        .filter(Boolean),
    )];
    const rpcClient = context.supabase as unknown as AdminRpcClient;
    let profiles: Map<string, AdminProfile>;
    let payoutResult;
    try {
      [profiles, payoutResult] = await Promise.all([
        profileMap(admin, userIds),
        userIds.length
          ? admin
              .from("creator_payout_profiles")
              .select(
                "user_id,holder_name,bank_name,account_number,ifsc,upi_id,swift_bic,bank_country",
              )
              .in("user_id", userIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
    } catch (loadError) {
      return {
        requests: [],
        error: loadError instanceof Error ? loadError.message : "Payout profile details could not be read.",
      };
    }
    if (payoutResult.error) return { requests: [], error: payoutResult.error.message };
    let internationalResult: { data: unknown; error: { message: string } | null };
    try {
      internationalResult = usdUserIds.length
        ? await rpcClient.rpc("admin_get_international_payout_profiles", { p_user_ids: usdUserIds })
        : { data: [], error: null };
    } catch (loadError) {
      return {
        requests: [],
        error: loadError instanceof Error ? loadError.message : "International payout details could not be read.",
      };
    }
    if (internationalResult.error) return { requests: [], error: internationalResult.error.message };

    const internationalProfiles = new Map(
      (Array.isArray(internationalResult.data)
        ? (internationalResult.data as Array<Record<string, unknown>>)
        : []
      ).map((row) => [
        String(row.userId),
        {
          payoutMethod: row.payoutMethod === "paypal" ? "paypal" as const : "bank" as const,
          legalName: row.legalName ? String(row.legalName) : null,
          routingAba: row.routingAba ? String(row.routingAba) : null,
          accountNumber: row.accountNumber ? String(row.accountNumber) : null,
          iban: row.iban ? String(row.iban) : null,
          swiftBic: row.swiftBic ? String(row.swiftBic) : null,
          bankName: row.bankName ? String(row.bankName) : null,
          paypalEmail: row.paypalEmail ? String(row.paypalEmail) : null,
          taxIdentifier: row.taxIdentifier ? String(row.taxIdentifier) : null,
        },
      ]),
    );
    const payoutProfiles = new Map<string, NonNullable<AdminPayoutRequest["payoutProfile"]>>(
      ((payoutResult.data ?? []) as Array<Record<string, unknown>>).map((row) => [
        String(row.user_id),
        {
          holderName: row.holder_name ? String(row.holder_name) : null,
          legalName: null,
          bankName: row.bank_name ? String(row.bank_name) : null,
          accountNumber: row.account_number ? String(row.account_number) : null,
          ifsc: row.ifsc ? String(row.ifsc) : null,
          upiId: row.upi_id ? String(row.upi_id) : null,
          swiftBic: row.swift_bic ? String(row.swift_bic) : null,
          bankCountry: row.bank_country ? String(row.bank_country) : null,
          payoutMethod: null,
          routingAba: null,
          iban: null,
          paypalEmail: null,
          taxIdentifier: null,
        } as NonNullable<AdminPayoutRequest["payoutProfile"]>,
      ]),
    );
    for (const [userId, profile] of internationalProfiles) {
      const base = payoutProfiles.get(userId);
      payoutProfiles.set(userId, {
        holderName: base?.holderName ?? null,
        legalName: profile.legalName ?? base?.legalName ?? null,
        bankName: profile.bankName ?? base?.bankName ?? null,
        accountNumber: profile.accountNumber ?? base?.accountNumber ?? null,
        ifsc: base?.ifsc ?? null,
        upiId: base?.upiId ?? null,
        swiftBic: profile.swiftBic ?? base?.swiftBic ?? null,
        bankCountry: base?.bankCountry ?? null,
        payoutMethod: profile.payoutMethod,
        routingAba: profile.routingAba ?? null,
        iban: profile.iban ?? null,
        paypalEmail: profile.paypalEmail ?? null,
        taxIdentifier: profile.taxIdentifier ?? null,
      });
    }
    if (usdUserIds.length) {
      await writeAudit(
        admin,
        context,
        null,
        "view_international_payout_payment_details",
        "Viewed USD payout destination details after Admin MFA",
        { userCount: usdUserIds.length },
      );
    }

    const requests = rows.map((row) => {
        const userId = String(row.user_id);
        return {
          id: String(row.id),
          userId,
          amount: Number(row.amount ?? 0),
          netAmount: Number(row.net_amount ?? 0),
          tdsDeducted: Number(row.tds_deducted ?? 0),
          status: String(row.status ?? ""),
          currency: row.currency === "USD" ? "USD" as const : "INR" as const,
          payoutWindowStart: row.payout_window_start ? String(row.payout_window_start) : null,
          createdAt: String(row.created_at ?? ""),
          profile: profiles.get(userId) ?? null,
          payoutProfile: payoutProfiles.get(userId) ?? null,
        };
      });
    return { requests: Array.isArray(requests) ? requests : [] };
  });

export const listAdminInternationalPayoutKyc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ requests: AdminInternationalPayoutKyc[]; error?: string }> => {
    let admin: AdminClient;
    try {
      admin = await requireOwnerAdmin(context);
    } catch (error) {
      return {
        requests: [],
        error: error instanceof Error ? error.message : "Admin payout access could not be verified.",
      };
    }
    const rpcClient = context.supabase as unknown as AdminRpcClient;
    let result: { data: unknown; error: { message: string } | null };
    try {
      result = await rpcClient.rpc("admin_list_international_payout_kyc");
    } catch (loadError) {
      return {
        requests: [],
        error: loadError instanceof Error ? loadError.message : "International payout KYC could not be read.",
      };
    }
    const { data, error } = result;
    if (error) return { requests: [], error: error.message };
    const requests = Array.isArray(data) ? (data as AdminInternationalPayoutKyc[]) : [];
    if (requests.length > 0) {
      try {
        await writeAudit(
          admin,
          context,
          null,
          "view_international_payout_kyc_queue",
          "Viewed pending international payout KYC after Admin MFA",
          { requestCount: requests.length },
        );
      } catch (auditError) {
        return {
          requests: [],
          error: auditError instanceof Error ? auditError.message : "The KYC access audit could not be saved.",
        };
      }
    }
    return { requests: Array.isArray(requests) ? requests : [] };
  });

export const reviewAdminInternationalPayoutKyc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) =>
    z.object({
      userId: z.string().uuid(),
      action: z.enum(["verified", "rejected"]),
      reason: z.string().trim().min(3).max(2000),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const admin = await requireOwnerAdmin(context);
    const rpcClient = context.supabase as unknown as AdminRpcClient;
    const { error } = await rpcClient.rpc("admin_review_international_payout_profile", {
      p_user_id: data.userId,
      p_action: data.action,
      p_reason: data.reason,
    });
    if (error) throw new Error(error.message);
    await writeAudit(
      admin,
      context,
      data.userId,
      `international_payout_kyc_${data.action}`,
      data.reason,
      { reviewStatus: data.action },
    );
    let emailSent = false;
    let emailReason = "Creator has no confirmed email address.";
    const { data: applicantAuth, error: applicantAuthError } =
      await admin.auth.admin.getUserById(data.userId);
    if (applicantAuthError) {
      console.warn("[payout-kyc] Could not retrieve creator email for the review update.");
    } else if (applicantAuth.user?.email && applicantAuth.user.email_confirmed_at) {
      const approved = data.action === "verified";
      const message = approved
        ? "Your international payout details have been approved. Future eligible payouts remain in USD and follow the monthly payout window."
        : `Your international payout details need changes before they can be approved. Reviewer note: ${data.reason}`;
      const result = await sendTransactionalEmail({
        to: applicantAuth.user.email,
        subject: approved
          ? "Your YourWorld payout KYC is approved"
          : "Action needed for your YourWorld payout KYC",
        text: message,
        html: `<p>${escapeEmailHtml(message)}</p><p>Open Monetization &amp; Wallet in YourWorld to review your details.</p><p>— YourWorld Creator Admin</p>`,
      });
      emailSent = result.sent;
      if (!result.sent) {
        emailReason = result.reason;
        console.warn("[payout-kyc] Creator review email was not sent.");
      }
    }
    return { userId: data.userId, reviewStatus: data.action, emailSent, emailReason };
  });

const resolvePayoutSchema = z
  .object({
    requestId: z.string().uuid(),
    action: z.enum(["completed", "failed"]),
    reason: z.string().trim().min(1).max(2000),
    paymentReference: z.string().trim().max(200).optional().default(""),
  })
  .superRefine((value, context) => {
    if (value.action === "completed" && !value.paymentReference) {
      context.addIssue({
        code: "custom",
        path: ["paymentReference"],
        message: "Enter the external transfer reference before marking this payout paid.",
      });
    }
  });

export const resolveAdminPayoutRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => resolvePayoutSchema.parse(data))
  .handler(async ({ data, context }) => {
    await requireOwnerAdmin(context);
    const db = context.supabase as unknown as {
      rpc: (
        functionName: string,
        args: Record<string, string>,
      ) => Promise<{ data: unknown; error: { message: string } | null }>;
    };
    const { error } = await db.rpc("admin_resolve_payout_request", {
      p_request_id: data.requestId,
      p_action: data.action,
      p_reason: data.reason,
      p_payment_reference: data.paymentReference,
    });
    if (error) throw new Error(error.message);
    return { ok: true, action: data.action };
  });