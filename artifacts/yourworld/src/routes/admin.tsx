import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, LockKeyhole, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { historyBackLink } from "@/lib/navigation";
import {
  getAdminSecurityStatus,
  listAdminConsole,
  reviewCopyrightReport,
  reviewUserReport,
  updateAccountRestriction,
  updatePayoutHold,
  type AdminConsoleData,
} from "@/lib/admin-console.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — YourWorld" },
      {
        name: "description",
        content: "Owner-only YourWorld moderation, verification, copyright, and payout review console.",
      },
    ],
  }),
  component: AdminConsole,
});

type Tab = "overview" | "verification" | "reports" | "copyright" | "payouts" | "accounts" | "audit";

function AdminConsole() {
  const [security, setSecurity] = useState<{
    isAdmin: boolean;
    assuranceLevel: string;
    requiresMfa: boolean;
  } | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [data, setData] = useState<AdminConsoleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  const checkSecurity = useCallback(async () => {
    setSecurityError(null);
    try {
      const result = await getAdminSecurityStatus();
      setSecurity(result);
    } catch (error) {
      setSecurityError(error instanceof Error ? error.message : "Admin access is unavailable.");
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await listAdminConsole());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load the admin console.";
      if (message.toLowerCase().includes("mfa")) {
        setSecurity((current) => (current ? { ...current, requiresMfa: true } : current));
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkSecurity();
  }, [checkSecurity]);

  useEffect(() => {
    if (security?.isAdmin && !security.requiresMfa) void load();
  }, [load, security]);

  if (securityError) {
    return <AdminDenied message={securityError} />;
  }
  if (!security) {
    return <AdminLoading />;
  }
  if (security.requiresMfa) {
    return <MfaGate onComplete={() => void checkSecurity()} />;
  }

  const counts = data
    ? {
        reports: data.userReports.filter((report) => report.status === "pending").length,
        copyright: data.copyrightReports.filter((report) => report.status === "pending").length,
        restrictions: data.restrictions.length,
        payoutHolds: data.payoutHolds.length,
      }
    : null;

  return (
    <main className="min-h-screen bg-[#09090b] p-4 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-wrap items-center gap-3">
          <Link
            to="/profile"
            onClick={historyBackLink}
            className="p-1 text-zinc-300 hover:text-white"
            aria-label="Back to profile"
          >
            <ArrowLeft size={22} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Admin Console</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" /> Owner + MFA
              </span>
            </div>
            <p className="text-sm text-zinc-500">Moderation actions are server-authorized and permanently audited.</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.06] disabled:opacity-50"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={14} /> Refresh
          </button>
        </header>

        <div className="grid gap-4 lg:grid-cols-[190px_1fr]">
          <nav className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">
            {(
              [
                ["overview", "Overview"],
                ["verification", "Sports Verification"],
                ["reports", "User Reports"],
                ["copyright", "Copyright / DMCA"],
                ["payouts", "Payout Review"],
                ["accounts", "Account Actions"],
                ["audit", "Audit Log"],
              ] as Array<[Tab, string]>
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={`whitespace-nowrap rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                  tab === value ? "bg-white/10 text-white" : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
              >
                {label}
              </button>
            ))}
            <Link
              to="/admin/national-awards"
              data-testid="link-admin-national-award-verification"
              className="whitespace-nowrap rounded-xl px-3 py-2 text-left text-xs font-semibold text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200"
            >
              Award Verification Requests
            </Link>
          </nav>

          <section className="min-w-0">
            {tab === "overview" ? <Overview data={data} counts={counts} /> : null}
            {tab === "verification" ? <VerificationTab count={data?.pendingVerificationCount ?? 0} /> : null}
            {tab === "reports" ? <ReportsTab data={data} onChanged={() => void load()} /> : null}
            {tab === "copyright" ? <CopyrightTab data={data} onChanged={() => void load()} /> : null}
            {tab === "payouts" ? <PayoutsTab data={data} onChanged={() => void load()} /> : null}
            {tab === "accounts" ? <AccountsTab data={data} onChanged={() => void load()} /> : null}
            {tab === "audit" ? <AuditTab data={data} /> : null}
          </section>
        </div>
      </div>
    </main>
  );
}

function MfaGate({ onComplete }: { onComplete: () => void }) {
  const [adminFactor, setAdminFactor] = useState<{ id: string; friendly_name?: string } | null>(null);
  const [enrollment, setEnrollment] = useState<{ id: string; qr_code: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadFactors = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      toast.error(error.message);
    } else {
      const existingAdminFactor =
        data.all.find((factor) => factor.factor_type === "totp" && factor.friendly_name === "YourWorld Admin") ??
        data.totp.find((factor) => factor.status === "verified") ??
        null;
      setAdminFactor(existingAdminFactor);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadFactors();
  }, [loadFactors]);

  const enroll = async () => {
    setBusy(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "YourWorld Admin",
    });
    if (error) toast.error(error.message);
    else setEnrollment({ id: data.id, qr_code: data.totp.qr_code, secret: data.totp.secret });
    setBusy(false);
  };

  const verify = async () => {
    const factorId = enrollment?.id ?? adminFactor?.id;
    if (!factorId || !/^\d{6}$/.test(code)) {
      toast.error("Enter the six-digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
      toast.error(challengeError.message);
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (error) {
      toast.error(error.message);
    } else {
      await supabase.auth.refreshSession();
      toast.success("Admin MFA verified.");
      onComplete();
    }
    setBusy(false);
  };

  return (
    <main className="min-h-screen bg-[#09090b] p-4 text-white">
      <div className="mx-auto mt-12 max-w-lg rounded-3xl border border-amber-200/20 bg-[#141418] p-6">
        <LockKeyhole className="mb-4 text-amber-200" size={28} />
        <h1 className="text-xl font-bold">Admin MFA required</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Sensitive moderation, verification, account, and payout actions require a verified authenticator step.
        </p>
        {loading ? (
          <p className="mt-5 text-sm text-zinc-500">Checking your verified factors…</p>
        ) : enrollment ? (
          <div className="mt-5 space-y-4">
            <img src={enrollment.qr_code} alt="Scan this QR code in your authenticator app" className="mx-auto h-48 w-48 rounded-xl bg-white p-2" />
            <p className="break-all rounded-xl bg-black/30 p-3 text-xs text-zinc-300">
              Manual setup key: {enrollment.secret}
            </p>
            <MfaCodeInput code={code} setCode={setCode} onVerify={() => void verify()} busy={busy} />
          </div>
        ) : adminFactor ? (
          <div className="mt-5">
            <p className="mb-3 text-sm text-emerald-300">A verified authenticator is already enrolled.</p>
            <MfaCodeInput code={code} setCode={setCode} onVerify={() => void verify()} busy={busy} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void enroll()}
            disabled={busy}
            className="mt-5 rounded-xl bg-amber-300 px-4 py-3 text-sm font-bold text-black hover:bg-amber-200 disabled:opacity-50"
          >
            Set up authenticator MFA
          </button>
        )}
      </div>
    </main>
  );
}

function MfaCodeInput({
  code,
  setCode,
  onVerify,
  busy,
}: {
  code: string;
  setCode: (value: string) => void;
  onVerify: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex gap-2">
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="123456"
        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-center tracking-[0.35em] text-white outline-none focus:border-amber-200/50"
      />
      <button
        type="button"
        onClick={onVerify}
        disabled={busy || code.length !== 6}
        className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-black disabled:opacity-50"
      >
        Verify
      </button>
    </div>
  );
}

function Overview({
  data,
  counts,
}: {
  data: AdminConsoleData | null;
  counts: { reports: number; copyright: number; restrictions: number; payoutHolds: number } | null;
}) {
  const cards = [
    ["Pending verification", data?.pendingVerificationCount ?? "—", "verification"],
    ["User reports", counts?.reports ?? "—", "reports"],
    ["Copyright reports", counts?.copyright ?? "—", "copyright"],
    ["Active restrictions", counts?.restrictions ?? "—", "accounts"],
    ["Payout holds", counts?.payoutHolds ?? "—", "payouts"],
  ] as const;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-[#141418] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.05] p-4 text-sm text-zinc-300">
        <div className="flex items-center gap-2 font-semibold text-emerald-200">
          <CheckCircle2 size={17} /> Owner-only controls are active
        </div>
        <p className="mt-2 leading-6">
          Every sensitive decision requires the existing admin role, an AAL2 MFA session, and a reason. Payout holds restrict processing only; they do not confiscate funds or decide refunds.
        </p>
      </div>
    </div>
  );
}

function VerificationTab({ count }: { count: number }) {
  return (
    <Panel title="Sports Verification" description="Review private verification submissions with the existing secure document viewer.">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200/15 bg-amber-200/[0.05] p-4">
        <div>
          <p className="font-semibold text-amber-100">{count} pending request{count === 1 ? "" : "s"}</p>
          <p className="mt-1 text-xs text-zinc-500">Documents remain private and are served only through short-lived signed URLs.</p>
        </div>
        <Link to="/admin/sports-verification" className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-bold text-black hover:bg-amber-200">
          Open verification review
        </Link>
      </div>
    </Panel>
  );
}

function ReportsTab({ data, onChanged }: { data: AdminConsoleData | null; onChanged: () => void }) {
  return (
    <Panel title="User Reports" description="Resolve or dismiss user-submitted reports. Account restrictions are separate decisions and require their own reason.">
      {!data?.userReports.length ? <Empty text="No user reports." /> : data.userReports.map((report) => <UserReportCard key={report.id} report={report} onChanged={onChanged} />)}
    </Panel>
  );
}

function UserReportCard({ report, onChanged }: { report: AdminConsoleData["userReports"][number]; onChanged: () => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const review = async (action: "resolve" | "dismiss") => {
    if (!reason.trim()) return toast.error("A review reason is required.");
    setBusy(true);
    try {
      await reviewUserReport({ data: { reportId: report.id, action, reason } });
      toast.success(`Report ${action === "resolve" ? "resolved" : "dismissed"}.`);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not review report.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <CaseCard title={`${displayProfile(report.reportedUser)} · ${report.surface}`} status={report.status} createdAt={report.createdAt}>
      <p className="text-sm text-zinc-300">{report.reason}</p>
      <p className="mt-2 text-xs text-zinc-500">Reporter: {displayProfile(report.reporter)}</p>
      {report.status === "pending" ? <DecisionControls reason={reason} setReason={setReason} busy={busy} onResolve={() => void review("resolve")} onDismiss={() => void review("dismiss")} /> : null}
    </CaseCard>
  );
}

function CopyrightTab({ data, onChanged }: { data: AdminConsoleData | null; onChanged: () => void }) {
  return (
    <Panel title="Copyright / DMCA" description="Review takedown claims. Takedown deletes only the reported post or Moment, and every decision is audited.">
      {!data?.copyrightReports.length ? <Empty text="No copyright reports." /> : data.copyrightReports.map((report) => <CopyrightCard key={report.id} report={report} onChanged={onChanged} />)}
    </Panel>
  );
}

function CopyrightCard({ report, onChanged }: { report: AdminConsoleData["copyrightReports"][number]; onChanged: () => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const review = async (action: "takedown" | "reject") => {
    if (!reason.trim()) return toast.error("A review reason is required.");
    setBusy(true);
    try {
      await reviewCopyrightReport({ data: { reportId: report.id, action, reason } });
      toast.success(action === "takedown" ? "Content removed and report resolved." : "Copyright report rejected.");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not review copyright report.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <CaseCard title={`Claim from ${displayProfile(report.reporter)}`} status={report.status} createdAt={report.createdAt}>
      <div className="grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
        <a href={report.originalWorkLink ?? undefined} target="_blank" rel="noreferrer noopener" className="break-all text-indigo-300 hover:underline">Original work: {report.originalWorkLink || "—"}</a>
        <a href={report.infringingContentLink ?? undefined} target="_blank" rel="noreferrer noopener" className="break-all text-indigo-300 hover:underline">Reported content: {report.infringingContentLink || "—"}</a>
      </div>
      <p className="mt-2 text-sm text-zinc-300">{report.reason || "No claim detail provided."}</p>
      {report.status === "pending" ? <DecisionControls reason={reason} setReason={setReason} busy={busy} resolveLabel="Takedown & resolve" dismissLabel="Reject claim" onResolve={() => void review("takedown")} onDismiss={() => void review("reject")} /> : null}
    </CaseCard>
  );
}

function PayoutsTab({ data, onChanged }: { data: AdminConsoleData | null; onChanged: () => void }) {
  return (
    <Panel title="Monetization & Payout Review" description="Review monetization status and place or release a payout hold. A report never confiscates money or decides a refund by itself.">
      {!data?.monetization.length && !data?.payoutHolds.length ? <Empty text="No monetization records or payout holds." /> : null}
      <div className="space-y-3">
        {data?.monetization.map((row) => <PayoutCard key={row.userId} row={row} onChanged={onChanged} />)}
        {data?.payoutHolds.map((hold) => <CaseCard key={hold.id} title={`Held payout · ${displayProfile(hold.profile)}`} status={hold.status} createdAt={hold.createdAt}><p className="text-sm text-zinc-300">{hold.reason}</p></CaseCard>)}
      </div>
    </Panel>
  );
}

function PayoutCard({ row, onChanged }: { row: AdminConsoleData["monetization"][number]; onChanged: () => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const action = row.payoutHeld ? "release" : "hold";
  const run = async () => {
    if (!reason.trim()) return toast.error("A reason is required.");
    setBusy(true);
    try {
      await updatePayoutHold({ data: { targetUserId: row.userId, action, reason } });
      toast.success(action === "hold" ? "Payout processing held." : "Payout hold released.");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update payout hold.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <CaseCard title={displayProfile(row.profile)} status={row.status || "not set"} createdAt={row.createdAt}>
      <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
        <span>Earnings: {formatCurrency(row.earningsTotal)}</span>
        <span>Pending payout: {formatCurrency(row.pendingPayout)}</span>
        <span>{row.payoutHeld ? "Payout hold active" : "No payout hold"}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required review reason" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white outline-none" />
        <button type="button" onClick={() => void run()} disabled={busy} className="rounded-xl bg-amber-300 px-3 py-2 text-xs font-bold text-black disabled:opacity-50">{action === "hold" ? "Hold payout" : "Release hold"}</button>
      </div>
    </CaseCard>
  );
}

function AccountsTab({ data, onChanged }: { data: AdminConsoleData | null; onChanged: () => void }) {
  const [targetUserId, setTargetUserId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (action: "suspend" | "block" | "lift_suspension" | "lift_block") => {
    if (!targetUserId.trim() || !reason.trim()) return toast.error("Target user ID and reason are required.");
    setBusy(true);
    try {
      await updateAccountRestriction({ data: { targetUserId: targetUserId.trim(), action, reason, durationHours: null } });
      toast.success("Account restriction updated.");
      setReason("");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update account restriction.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Panel title="Account Actions" description="Use the exact target user ID from a reviewed case. Suspend and block actions are separate, reasoned, and audited.">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)} placeholder="Target user UUID" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none" />
          <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required action reason" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["suspend", "block", "lift_suspension", "lift_block"] as const).map((action) => (
            <button key={action} type="button" onClick={() => void run(action)} disabled={busy} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/[0.06] disabled:opacity-50">{action.replace("_", " ")}</button>
          ))}
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {!data?.restrictions.length ? <Empty text="No active account restrictions." /> : data.restrictions.map((restriction) => (
          <CaseCard key={restriction.id} title={`${restriction.restrictionType} · ${displayProfile(restriction.profile)}`} status="active" createdAt={restriction.createdAt}>
            <p className="text-sm text-zinc-300">{restriction.reason}</p>
            <p className="mt-1 text-xs text-zinc-500">Target: {restriction.userId}</p>
          </CaseCard>
        ))}
      </div>
    </Panel>
  );
}

function AuditTab({ data }: { data: AdminConsoleData | null }) {
  return (
    <Panel title="Immutable Audit Log" description="Sensitive actions are append-only and include actor, target, action, reason, assurance level, and timestamp.">
      {!data?.audit.length ? <Empty text="No admin actions recorded." /> : (
        <div className="space-y-2">
          {data.audit.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-semibold text-amber-100">{entry.action}</span>
                <span className="text-zinc-500">{formatDate(entry.createdAt)} · {entry.assuranceLevel}</span>
              </div>
              <p className="mt-1 text-zinc-300">{entry.reason}</p>
              <p className="mt-1 break-all text-zinc-600">Target: {entry.targetUserId || "—"} · Admin: {entry.adminUserId}</p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function DecisionControls({
  reason,
  setReason,
  busy,
  onResolve,
  onDismiss,
  resolveLabel = "Resolve",
  dismissLabel = "Dismiss",
}: {
  reason: string;
  setReason: (value: string) => void;
  busy: boolean;
  onResolve: () => void;
  onDismiss: () => void;
  resolveLabel?: string;
  dismissLabel?: string;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required reason" className="min-w-[220px] flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white outline-none" />
      <button type="button" onClick={onResolve} disabled={busy} className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-bold text-black disabled:opacity-50">{resolveLabel}</button>
      <button type="button" onClick={onDismiss} disabled={busy} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 disabled:opacity-50">{dismissLabel}</button>
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#141418] p-4">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 mb-4 text-sm text-zinc-500">{description}</p>
      {children}
    </div>
  );
}

function CaseCard({ title, status, createdAt, children }: { title: string; status: string; createdAt: string | null; children: ReactNode }) {
  return (
    <article className="mb-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{title}</h3>
        <span className="rounded-full bg-amber-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200">{status}</span>
        <span className="text-[10px] text-zinc-600">{formatDate(createdAt)}</span>
      </div>
      {children}
    </article>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-zinc-500">{text}</div>;
}

function AdminDenied({ message }: { message: string }) {
  return <main className="min-h-screen bg-[#09090b] p-6 text-white"><div className="mx-auto mt-12 max-w-md rounded-2xl border border-zinc-800 bg-[#141418] p-6 text-center"><ShieldAlert className="mx-auto mb-3 text-red-500" size={28} /><h1 className="text-lg font-bold">Owner admin access required</h1><p className="mt-2 text-sm text-zinc-400">{message}</p></div></main>;
}

function AdminLoading() {
  return <main className="min-h-screen bg-[#09090b] p-6 text-sm text-zinc-400">Checking owner admin access…</main>;
}

function displayProfile(profile: AdminConsoleData["userReports"][number]["reportedUser"] | null) {
  return profile?.display_name || profile?.full_name || profile?.username || "Unknown user";
}

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString();
}

function formatCurrency(value: number | null) {
  return value == null ? "—" : `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}