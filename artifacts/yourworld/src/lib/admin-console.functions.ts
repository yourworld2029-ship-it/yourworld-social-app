import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AdminClient = Awaited<ReturnType<typeof getAdminClient>>;

type AdminProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  full_name: string | null;
  is_verified: boolean | null;
  verification_requested: boolean | null;
};

function claimsFor(context: { claims: unknown }) {
  return (context.claims ?? {}) as { aal?: string; amr?: Array<{ method?: string }> };
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
  const { data, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error || !data) {
    throw new Error("Forbidden: owner admin access is required.");
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
    return {
      isAdmin: true,
      assuranceLevel: assuranceLevel(context),
      requiresMfa: assuranceLevel(context) !== "aal2",
    };
  });

export const listAdminConsole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await requireOwnerAdmin(context);
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
      admin.from("user_reports").select("*").order("created_at", { ascending: false }).limit(100),
      admin.from("copyright_reports").select("*").order("created_at", { ascending: false }).limit(100),
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
    const admin = await requireOwnerAdmin(context);
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