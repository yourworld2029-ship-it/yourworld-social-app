import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  OPERATIONS_ADMIN_EMAIL,
  SUPPORT_ADMIN_EMAIL,
} from "@/lib/admin-routing";

type AdminClient = Awaited<ReturnType<typeof getAdminClient>>;

const ADMIN_ROLE_LOOKUP_TIMEOUT_MS = 8_000;

export type AdminProfile = {
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

function emailFromClaims(context: { claims: unknown }) {
  return claimsFor(context).email?.trim().toLowerCase() ?? "";
}

function withTimeout<T>(
  operation: PromiseLike<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([Promise.resolve(operation), timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

async function getAdminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function requireOwnerAdmin(context: { userId: string; claims: unknown }, stepUp = true) {
  const admin = await getAdminClient();
  let hasRole = false;
  let lookupFailed = false;
  try {
    const { data, error } = await withTimeout(
      admin
        .from("user_roles")
        .select("role")
        .eq("user_id", context.userId)
        .eq("role", "admin")
        .maybeSingle(),
      ADMIN_ROLE_LOOKUP_TIMEOUT_MS,
      "Admin role check timed out. Please retry.",
    );
    hasRole = Boolean(data);
    lookupFailed = Boolean(error);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Admin role check timed out. Please retry."
    ) {
      throw error;
    }
    throw new Error("Could not verify the admin role. Please retry.");
  }

  if (lookupFailed) {
    throw new Error("Could not verify the admin role. Please retry.");
  }
  if (!hasRole) {
    throw new Error("Forbidden: owner admin access is required.");
  }
  if (stepUp && assuranceLevel(context) !== "aal2") {
    throw new Error("Admin MFA is required. Complete the two-step verification challenge and try again.");
  }
  return admin;
}

async function requireSupportAdmin(context: { userId: string; claims: unknown }) {
  await requireOwnerAdmin(context);
  if (emailFromClaims(context) !== SUPPORT_ADMIN_EMAIL) {
    throw new Error("Forbidden: this action is restricted to the support administrator.");
  }
  return getAdminClient();
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
  pendingVerificationCount: number;
  userReports: Array<{
    id: string;
    reporterId: string;
    reportedUserId: string;
    reporter: AdminProfile | null;
    reportedUser: AdminProfile | null;
    surface: string;
    threadId: string | null;
    messageId: string | null;
    reason: string;
    status: string;
    createdAt: string;
    reviewedAt: string | null;
    resolutionReason: string | null;
  }>;
  copyrightReports: Array<{
    id: string;
    reporterId: string;
    reporter: AdminProfile | null;
    reportedPostId: string | null;
    reportedMomentId: string | null;
    originalWorkLink: string | null;
    infringingContentLink: string | null;
    reason: string | null;
    contactEmail: string | null;
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

export const getAdminSecurityStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireOwnerAdmin(context, false);
    const email = emailFromClaims(context);
    return {
      isAdmin: true,
      isOperationsAdmin: email === OPERATIONS_ADMIN_EMAIL,
      isSupportAdmin: email === SUPPORT_ADMIN_EMAIL,
      assuranceLevel: assuranceLevel(context),
      requiresMfa: assuranceLevel(context) !== "aal2",
    };
  });

export const inviteOperationsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await requireSupportAdmin(context);
    let existing: Awaited<
      ReturnType<typeof admin.auth.admin.listUsers>
    >["data"]["users"][number] | undefined;
    for (let page = 1; !existing; page += 1) {
      const { data: listedUsers, error: listError } =
        await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (listError) throw new Error("Could not check the operations account.");
      existing = listedUsers.users.find(
        (user) => user.email?.trim().toLowerCase() === OPERATIONS_ADMIN_EMAIL,
      );
      if (existing || listedUsers.users.length < 1000) break;
    }
    let invitedUserId = existing?.id ?? null;
    let invitationSent = false;

    if (!existing || !existing.email_confirmed_at) {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(
        OPERATIONS_ADMIN_EMAIL,
      );
      if (error) throw new Error(`Could not send the secure admin invite: ${error.message}`);
      invitedUserId = data.user?.id ?? invitedUserId;
      invitationSent = true;
    }

    if (!invitedUserId) {
      throw new Error("Supabase did not return the invited account.");
    }

    const { error: roleError } = await admin.from("user_roles").upsert(
      { user_id: invitedUserId, role: "admin" },
      { onConflict: "user_id,role" },
    );
    if (roleError) throw new Error(`Invite sent, but the admin role was not saved: ${roleError.message}`);

    await writeAudit(
      admin,
      context,
      invitedUserId,
      "operations_admin_invited",
      "Provisioned the dedicated operations administrator.",
      { email: OPERATIONS_ADMIN_EMAIL, invitationSent },
    );

    return {
      email: OPERATIONS_ADMIN_EMAIL,
      invitationSent,
      emailAlreadyVerified: Boolean(existing?.email_confirmed_at),
      roleAssigned: true,
    };
  });

export const listAdminConsole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await requireOwnerAdmin(context);
    const operationsOnly = emailFromClaims(context) === OPERATIONS_ADMIN_EMAIL;
    const [
      pendingVerification,
      userReportsResult,
      copyrightReportsResult,
      monetizationResult,
      restrictionsResult,
      payoutHoldsResult,
      auditResult,
    ] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }).eq("verification_requested", true),
      operationsOnly
        ? Promise.resolve({ data: [], error: null })
        : admin.from("user_reports").select("*").order("created_at", { ascending: false }).limit(100),
      operationsOnly
        ? Promise.resolve({ data: [], error: null })
        : admin.from("copyright_reports").select("*").order("created_at", { ascending: false }).limit(100),
      admin
        .from("monetization")
        .select("user_id,status,earnings_total,pending_payout,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      operationsOnly
        ? Promise.resolve({ data: [], error: null })
        : admin
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
      operationsOnly
        ? Promise.resolve({ data: [], error: null })
        : admin.from("admin_action_audit").select("*").order("created_at", { ascending: false }).limit(200),
    ]);

    for (const result of [
      userReportsResult,
      copyrightReportsResult,
      monetizationResult,
      restrictionsResult,
      payoutHoldsResult,
      auditResult,
    ]) {
      if (result.error) throw new Error(result.error.message);
    }

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
    const profiles = await profileMap(admin, ids);
    const heldUserIds = new Set(payoutHoldRows.map((row) => String(row.user_id)));

    return {
      pendingVerificationCount: pendingVerification.count ?? 0,
      userReports: userReportRows.map((row) => ({
        id: String(row.id),
        reporterId: String(row.reporter_id),
        reportedUserId: String(row.reported_user_id),
        reporter: profiles.get(String(row.reporter_id)) ?? null,
        reportedUser: profiles.get(String(row.reported_user_id)) ?? null,
        surface: String(row.surface ?? "unknown"),
        threadId: (row.thread_id as string | null) ?? null,
        messageId: (row.message_id as string | null) ?? null,
        reason: String(row.reason ?? ""),
        status: String(row.status ?? "pending"),
        createdAt: String(row.created_at),
        reviewedAt: (row.reviewed_at as string | null) ?? null,
        resolutionReason: (row.resolution_reason as string | null) ?? null,
      })),
      copyrightReports: copyrightRows.map((row) => ({
        id: String(row.id),
        reporterId: String(row.reporter_user_id),
        reporter: profiles.get(String(row.reporter_user_id)) ?? null,
        reportedPostId: (row.reported_post_id as string | null) ?? null,
        reportedMomentId: (row.reported_moment_id as string | null) ?? null,
        originalWorkLink: (row.original_work_link as string | null) ?? null,
        infringingContentLink: (row.infringing_content_link as string | null) ?? null,
        reason: (row.reason as string | null) ?? null,
        contactEmail: (row.contact_email as string | null) ?? null,
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
    const admin = await requireSupportAdmin(context);
    const now = new Date().toISOString();
    const status = data.action === "resolve" ? "resolved" : "dismissed";
    const { data: report, error: reportError } = await admin
      .from("user_reports")
      .update({ status, resolution_reason: data.reason, reviewed_at: now, reviewed_by: context.userId })
      .eq("id", data.reportId)
      .eq("status", "pending")
      .select("reported_user_id")
      .maybeSingle();
    if (reportError) throw new Error(reportError.message);
    if (!report) throw new Error("This moderation report is no longer pending.");
    await writeAudit(admin, context, report.reported_user_id, `user_report_${data.action}`, data.reason, {
      reportId: data.reportId,
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
    const admin = await requireSupportAdmin(context);
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
    const admin = await requireSupportAdmin(context);
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

const payoutRequestPageSchema = z.object({
  page: z.number().int().min(0).max(10000).default(0),
});

export type AdminPayoutRequest = {
  id: string;
  userId: string;
  profile: AdminProfile | null;
  email: string;
  kycStatus: string;
  amount: number;
  netAmount: number;
  tdsDeducted: number;
  status: string;
  scheduleType: string;
  createdAt: string;
  completedAt: string | null;
  paymentReference: string | null;
};

export const listAdminPayoutRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => payoutRequestPageSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    const admin = await requireOwnerAdmin(context);
    const pageSize = 20;
    const start = data.page * pageSize;
    const { data: requestRows, error: requestError, count } = await admin
      .from("payout_requests")
      .select(
        "id,user_id,amount,net_amount,tds_deducted,status,schedule_type,created_at,completed_at,admin_payment_reference",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(start, start + pageSize - 1);
    if (requestError) throw new Error(requestError.message);

    const rows = (requestRows ?? []) as Array<Record<string, unknown>>;
    const userIds = [...new Set(rows.map((row) => String(row.user_id ?? "")).filter(Boolean))];
    if (!userIds.length) return { requests: [], hasMore: false, total: count ?? 0, page: data.page };

    const [payoutProfiles, profiles] = await Promise.all([
      admin
        .from("creator_payout_profiles")
        .select("user_id,email,kyc_status")
        .in("user_id", userIds),
      profileMap(admin, userIds),
    ]);
    if (payoutProfiles.error) throw new Error(payoutProfiles.error.message);
    const payoutByUser = new Map(
      ((payoutProfiles.data ?? []) as Array<Record<string, unknown>>).map((profile) => [
        String(profile.user_id),
        profile,
      ]),
    );

    return {
      requests: rows.map((row) => {
        const userId = String(row.user_id);
        const payout = payoutByUser.get(userId);
        return {
          id: String(row.id),
          userId,
          profile: profiles.get(userId) ?? null,
          email: String(payout?.email ?? ""),
          kycStatus: String(payout?.kyc_status ?? "unknown"),
          amount: Number(row.amount ?? 0),
          netAmount: Number(row.net_amount ?? 0),
          tdsDeducted: Number(row.tds_deducted ?? 0),
          status: String(row.status ?? "processing"),
          scheduleType: String(row.schedule_type ?? ""),
          createdAt: String(row.created_at ?? ""),
          completedAt: (row.completed_at as string | null) ?? null,
          paymentReference: (row.admin_payment_reference as string | null) ?? null,
        };
      }),
      hasMore: start + rows.length < (count ?? 0),
      total: count ?? rows.length,
      page: data.page,
    };
  });

const payoutDestinationSchema = z.object({ requestId: z.string().uuid() });

export const getAdminPayoutDestination = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => payoutDestinationSchema.parse(data))
  .handler(async ({ data, context }) => {
    const admin = await requireOwnerAdmin(context);
    const { data: request, error: requestError } = await admin
      .from("payout_requests")
      .select("user_id")
      .eq("id", data.requestId)
      .maybeSingle();
    if (requestError) throw new Error(requestError.message);
    if (!request) throw new Error("This payout request no longer exists.");

    const { data: destination, error } = await admin
      .from("creator_payout_profiles")
      .select("email,upi_id,account_number,ifsc,holder_name,pan_number")
      .eq("user_id", request.user_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!destination) throw new Error("The creator has no saved payout destination.");

    await writeAudit(
      admin,
      context,
      String(request.user_id),
      "payout_destination_viewed",
      "Admin opened payout destination details.",
      { requestId: data.requestId },
    );
    return {
      email: String(destination.email ?? ""),
      upiId: String(destination.upi_id ?? ""),
      accountNumber: String(destination.account_number ?? ""),
      ifsc: String(destination.ifsc ?? ""),
      accountHolder: String(destination.holder_name ?? ""),
      panNumber: String(destination.pan_number ?? ""),
    };
  });

const payoutRequestReviewSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(["pending", "approve", "paid"]),
  reason: z.string().trim().min(1).max(1000),
  paymentReference: z.string().trim().max(120).optional(),
});

export const reviewAdminPayoutRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => payoutRequestReviewSchema.parse(data))
  .handler(async ({ data, context }) => {
    const admin = await requireOwnerAdmin(context);
    if (data.action === "paid" && !data.paymentReference?.trim()) {
      throw new Error("Enter the bank/UPI transaction reference after the transfer is complete.");
    }

    const { data: current, error: readError } = await admin
      .from("payout_requests")
      .select("id,user_id,status")
      .eq("id", data.requestId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!current) throw new Error("This payout request no longer exists.");
    if (current.status === "completed") {
      throw new Error("A completed payout cannot be changed.");
    }
    if (data.action === "paid" && current.status !== "approved") {
      throw new Error("Approve the payout before marking it paid.");
    }
    if (data.action === "approve" || data.action === "paid") {
      const { data: hold, error: holdError } = await admin
        .from("admin_payout_holds")
        .select("id")
        .eq("user_id", current.user_id)
        .eq("status", "held")
        .maybeSingle();
      if (holdError) throw new Error(holdError.message);
      if (hold) throw new Error("This creator has an active payout hold. Resolve the hold before approving payment.");
    }

    const nextStatus =
      data.action === "approve"
        ? "approved"
        : data.action === "paid"
          ? "completed"
          : "processing";
    const update = await admin
      .from("payout_requests")
      .update({
        status: nextStatus,
        completed_at: data.action === "paid" ? new Date().toISOString() : null,
        admin_payment_reference:
          data.action === "paid" ? data.paymentReference!.trim() : null,
      })
      .eq("id", data.requestId)
      .eq("status", current.status)
      .select("id,user_id,status")
      .maybeSingle();
    if (update.error) throw new Error(update.error.message);
    if (!update.data) throw new Error("The payout changed while you were reviewing it. Refresh and try again.");

    await writeAudit(
      admin,
      context,
      String(current.user_id),
      `payout_request_${data.action}`,
      data.reason,
      {
        requestId: data.requestId,
        previousStatus: current.status,
        status: nextStatus,
        paymentReference: data.action === "paid" ? data.paymentReference!.trim() : null,
      },
    );
    return { status: nextStatus };
  });