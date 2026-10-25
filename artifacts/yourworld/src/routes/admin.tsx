import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, LockKeyhole, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { historyBackLink } from "@/lib/navigation";
import { useAdminAccess } from "@/lib/use-admin-access";
import { describeAdminResponseShape, findAdminConsolePayload } from "@/lib/admin-console-response";
import { readAdminConsoleApi } from "@/lib/admin-console-api";
import { NationalAwardVerificationAdminPanel } from "./admin.national-awards";
import {
  resolveAdminPayoutRequest,
  reviewAdminInternationalPayoutKyc,
  reviewCopyrightReport,
  reviewUserReport,
  updateAccountRestriction,
  updatePayoutHold,
  type AdminConsoleData,
  type AdminPayoutRequest,
  type AdminInternationalPayoutKyc,
} from "@/lib/admin-console.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — YourWorld" },
      {
        name: "description",
        content: "YourWorld moderation, verification, copyright, and payout review console for admins.",
      },
    ],
  }),
  component: AdminConsole,
});

type Tab = "overview" | "verification" | "reports" | "copyright" | "payouts" | "accounts" | "audit" | "awards";

function unwrapAdminResult(value: unknown): unknown {
  let current = value;
  for (let depth = 0; depth < 3; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) break;
    const payload = current as Record<string, unknown>;
    if ("result" in payload && payload.result !== undefined) {
      current = payload.result;
      continue;
    }
    if (!("requests" in payload) && "data" in payload && payload.data !== undefined) {
      current = payload.data;
      continue;
    }
    break;
  }
  return current;
}

function getAdminRequests<T>(value: unknown): { requests: T[]; error?: string } | null {
  const payload = unwrapAdminResult(value);
  if (Array.isArray(payload)) return { requests: payload as T[] };
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (!Array.isArray(record.requests)) return null;
  return {
    requests: record.requests as T[],
    ...(typeof record.error === "string" ? { error: record.error } : {}),
  };
}

function AdminConsole() {
  const navigate = useNavigate();
  const access = useAdminAccess();
  const [mfaOpen, setMfaOpen] = useState(false);
  const [data, setData] = useState<AdminConsoleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tab, setTab] = useState<Tab>("overview");
  const [mfaVerified, setMfaVerified] = useState<boolean | null>(null);
  const loadInFlight = useRef<Promise<void> | null>(null);
  const openMfa = useCallback(() => setMfaOpen(true), []);

  const load = useCallback(() => {
    if (mfaVerified !== true) return Promise.resolve();
    if (loadInFlight.current) return loadInFlight.current;
    const request = (async () => {
      setLoading(true);
      setLoadError(null);
      setRefreshKey((current) => current + 1);
      try {
        const rawResponse = await readAdminConsoleApi<unknown>("console");
        const response = findAdminConsolePayload(rawResponse);
        if (!response) {
          const shape = describeAdminResponseShape(rawResponse);
          throw new Error(`Admin Console response format was not recognized (received: ${shape}).`);
        }
        setData(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not load the admin console.";
        if (message.toLowerCase().includes("mfa")) setMfaVerified(false);
        setLoadError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    })();
    loadInFlight.current = request;
    void request.finally(() => {
      if (loadInFlight.current === request) loadInFlight.current = null;
    });
    return request;
  }, [mfaVerified]);

  useEffect(() => {
    if (access.status !== "allowed") {
      setMfaVerified(null);
      return;
    }

    let active = true;
    const syncMfaState = async () => {
      try {
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (active) setMfaVerified(!error && data.currentLevel === "aal2");
      } catch {
        if (active) setMfaVerified(false);
      }
    };
    void syncMfaState();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => {
        if (active) void syncMfaState();
      }, 0);
    });
    const onFocus = () => {
      if (document.visibilityState === "visible") void syncMfaState();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [access.status]);

  useEffect(() => {
    if (access.status === "allowed" && mfaVerified === true) void load();
  }, [access.status, load, mfaVerified]);

  useEffect(() => {
    if (access.status !== "allowed" || mfaVerified !== true || (tab !== "reports" && tab !== "copyright")) return;
    const refreshReports = () => {
      if (document.visibilityState === "visible") void load();
    };
    window.addEventListener("focus", refreshReports);
    document.addEventListener("visibilitychange", refreshReports);
    window.addEventListener("yw-app-resume", refreshReports);
    return () => {
      window.removeEventListener("focus", refreshReports);
      document.removeEventListener("visibilitychange", refreshReports);
      window.removeEventListener("yw-app-resume", refreshReports);
    };
  }, [access.status, load, mfaVerified, tab]);

  const selectTab = (nextTab: Tab) => {
    setTab(nextTab);
    void load();
  };

  useEffect(() => {
    if (access.status !== "allowed") {
      setData(null);
      setMfaOpen(false);
    }
  }, [access.status]);

  if (access.status === "checking") {
    return <AdminLoading />;
  }
  if (access.status !== "allowed") {
    return (
      <AdminDenied
        title={access.status === "error" ? "Admin access could not be verified" : "Admin access required"}
        message={access.message ?? "This account does not have the admin role."}
      />
    );
  }
  if (mfaOpen) {
    return (
      <MfaGate
        onCancel={() => setMfaOpen(false)}
        onComplete={() => {
          setMfaOpen(false);
          setMfaVerified(true);
        }}
      />
    );
  }

  const counts = data
    ? {
        reports: data.pendingUserReportsCount,
        copyright: data.pendingCopyrightReportsCount,
        restrictions: data.restrictions.length,
        payoutHolds: data.payoutHolds.length,
      }
    : null;

  return (
    <main
      className="min-h-screen bg-[#09090b] px-4 pb-5 text-white"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 24px)" }}
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 space-y-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/profile"
              onClick={historyBackLink}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-300 transition hover:bg-white/[0.07] hover:text-white"
              aria-label="Back to profile"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="text-[22px] font-bold tracking-tight">Admin Console</h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-300/[0.08] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5" /> Admin access
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">Moderation and verification</p>
            </div>
          </div>
          <div className="flex gap-2 sm:justify-end">
            {mfaVerified ? (
              <div role="status" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200/15 bg-emerald-200/[0.05] px-4 py-2.5 text-xs font-semibold text-emerald-100 sm:flex-none">
                <ShieldCheck size={14} /> MFA verified
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setMfaOpen(true)}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-amber-200/20 bg-amber-200/[0.04] px-4 py-2.5 text-xs font-semibold text-amber-100 transition hover:bg-amber-200/10 active:scale-[0.98] sm:flex-none"
              >
                <LockKeyhole size={14} /> Verify MFA
              </button>
            )}
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-white/[0.07] active:scale-[0.98] disabled:opacity-50 sm:flex-none"
            >
              <RefreshCw className={loading ? "animate-spin" : ""} size={14} /> Refresh
            </button>
          </div>
        </header>

        {data?.loadErrors.other || data?.loadErrors.profileLookup ? (
          <p role="status" className="mb-4 rounded-xl border border-amber-200/15 bg-amber-200/[0.04] p-3 text-xs text-amber-100/90">
            Some admin data could not be loaded: {[data.loadErrors.other, data.loadErrors.profileLookup].filter(Boolean).join("; ")}
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[190px_1fr]">
          <nav
            aria-label="Admin Console sections"
            className="flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain pr-6 pb-1 lg:flex-col lg:overflow-visible lg:pr-0"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
          >
            {(
              [
                ["overview", "Overview"],
                ["verification", "Sports Verification"],
                ["reports", "User Reports"],
                ["copyright", "Copyright / DMCA"],
                ["payouts", "Payout Review"],
                ["accounts", "Account Actions"],
                ["audit", "Audit Log"],
                ["awards", "Award Verification Requests"],
              ] as Array<[Tab, string]>
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => selectTab(value)}
                className={`min-h-10 shrink-0 rounded-xl border px-4 py-2.5 text-left text-xs font-semibold transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/50 lg:w-full ${
                  tab === value
                    ? "border-white/10 bg-white/[0.09] text-white shadow-[0_4px_18px_rgba(0,0,0,0.2)]"
                    : "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-zinc-100"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <section key={tab} className="min-w-0 animate-in fade-in-0 slide-in-from-bottom-1 duration-200">
            {tab === "overview" ? <Overview data={data} counts={counts} /> : null}
            {tab === "verification" ? (
              <VerificationTab
                count={data?.pendingVerificationCount ?? 0}
                onOpenReview={() => void navigate({ to: "/admin/sports-verification" })}
              />
            ) : null}
            {tab === "reports" ? <ReportsTab data={data} loading={loading} error={loadError ?? data?.loadErrors.userReports ?? null} onChanged={() => void load()} /> : null}
            {tab === "copyright" ? <CopyrightTab data={data} loading={loading} error={loadError ?? data?.loadErrors.copyrightReports ?? null} onChanged={() => void load()} /> : null}
            {tab === "payouts" ? (
              <PayoutsTab
                data={data}
                onChanged={() => void load()}
                onVerifyMfa={openMfa}
                refreshKey={refreshKey}
                mfaVerified={mfaVerified === true}
              />
            ) : null}
            {tab === "accounts" ? <AccountsTab data={data} onChanged={() => void load()} /> : null}
            {tab === "audit" ? <AuditTab data={data} /> : null}
            {tab === "awards" ? <NationalAwardVerificationAdminPanel refreshKey={refreshKey} /> : null}
          </section>
        </div>
      </div>
    </main>
  );
}

function MfaGate({ onComplete, onCancel }: { onComplete: () => void; onCancel: () => void }) {
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
      const { data: assurance, error: assuranceError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError || assurance.currentLevel !== "aal2") {
        toast.error(assuranceError?.message ?? "MFA verified, but the active session is not yet at AAL2. Please retry.");
      } else {
        toast.success("Admin MFA verified.");
        onComplete();
      }
    }
    setBusy(false);
  };

  return (
    <main className="min-h-screen bg-[#09090b] p-4 text-white">
      <div className="mx-auto mt-12 max-w-lg rounded-3xl border border-amber-200/20 bg-[#141418] p-6">
        <button
          type="button"
          onClick={onCancel}
          className="mb-4 rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-white/[0.06] hover:text-white"
        >
          Back to Admin Console
        </button>
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
  counts: { reports: number | null; copyright: number | null; restrictions: number; payoutHolds: number } | null;
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
          <CheckCircle2 size={17} /> Admin controls are protected
        </div>
        <p className="mt-2 leading-6">
          Every sensitive decision requires the existing admin role, an AAL2 MFA session, and a reason. Payout holds restrict processing only; they do not confiscate funds or decide refunds.
        </p>
      </div>
    </div>
  );
}

function VerificationTab({ count, onOpenReview }: { count: number; onOpenReview: () => void }) {
  return (
    <Panel title="Sports Verification" description="Review private verification submissions with the existing secure document viewer.">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200/15 bg-amber-200/[0.05] p-4">
        <div>
          <p className="font-semibold text-amber-100">{count} pending request{count === 1 ? "" : "s"}</p>
          <p className="mt-1 text-xs text-zinc-500">Documents remain private and are served only through short-lived signed URLs.</p>
        </div>
        <button type="button" onClick={onOpenReview} className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-bold text-black hover:bg-amber-200">
          Open verification review
        </button>
      </div>
    </Panel>
  );
}

function ReportsTab({
  data,
  loading,
  error,
  onChanged,
}: {
  data: AdminConsoleData | null;
  loading: boolean;
  error: string | null;
  onChanged: () => void;
}) {
  return (
    <Panel title="User Reports" description="Resolve or dismiss user-submitted reports. Account restrictions are separate decisions and require their own reason.">
      {error ? <p role="alert" className="mb-3 rounded-xl border border-red-300/20 bg-red-300/[0.06] p-3 text-xs text-red-200">{error}</p> : null}
      {!data ? (
        <Empty text={loading ? "Loading user reports…" : error ? "Reports could not be loaded. Verify MFA, then use Refresh." : "No reports loaded. Use Refresh to try again."} />
      ) : error ? (
        <Empty text="Reports could not be loaded. Use Refresh to try again." />
      ) : loading && data.userReports.length === 0 ? (
        <Empty text="Checking for new reports…" />
      ) : !data.userReports.length ? (
        <Empty text="No user reports." />
      ) : (
        data.userReports.map((report) => <UserReportCard key={report.id} report={report} onChanged={onChanged} />)
      )}
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
  const contentId = report.reportedContentId ?? report.reportedPostId;
  const typeValue = report.contentType?.toLowerCase() ?? "";
  const watchType = typeValue.includes("reel") ? "reel" : typeValue.includes("video") ? "video" : null;
  const contentLabel = watchType === "reel" ? "Reel" : watchType === "video" ? "Video" : contentId ? "Post" : report.surface;
  return (
    <CaseCard
      title={`${displayProfile(report.reportedUser)} · ${contentLabel}`}
      status={report.status}
      createdAt={report.createdAt}
    >
      <p className="text-sm text-zinc-300">{report.reason}</p>
      {report.description ? <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-400">{report.description}</p> : null}
      <p className="mt-2 text-xs text-zinc-500">Reporter: {displayProfile(report.reporter)}</p>
      {contentId ? (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
          <span className="break-all text-zinc-500">Reported content ID: {contentId}</span>
          {watchType ? (
            <Link
              to="/watch/$contentId"
              params={{ contentId }}
              search={{ type: watchType, reportReview: true }}
              className="font-semibold text-indigo-300 underline underline-offset-2 hover:text-indigo-200"
            >
              Preview reported {watchType}
            </Link>
          ) : null}
        </div>
      ) : null}
      {report.status === "pending" ? <DecisionControls reason={reason} setReason={setReason} busy={busy} onResolve={() => void review("resolve")} onDismiss={() => void review("dismiss")} /> : null}
    </CaseCard>
  );
}

function CopyrightTab({
  data,
  loading,
  error,
  onChanged,
}: {
  data: AdminConsoleData | null;
  loading: boolean;
  error: string | null;
  onChanged: () => void;
}) {
  return (
    <Panel title="Copyright / DMCA" description="Review takedown claims. Takedown deletes only the reported post or Moment, and every decision is audited.">
      {error ? <p role="alert" className="mb-3 rounded-xl border border-red-300/20 bg-red-300/[0.06] p-3 text-xs text-red-200">{error}</p> : null}
      {error
        ? <Empty text="Copyright reports could not be loaded. Use Refresh to try again." />
        : !data?.copyrightReports.length
        ? <Empty text={loading ? "Loading copyright claims…" : error ? "Copyright claims could not be loaded. Verify MFA, then use Refresh." : "No copyright reports."} />
        : data.copyrightReports.map((report) => <CopyrightCard key={report.id} report={report} onChanged={onChanged} />)}
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
    <CaseCard title={`Claim from ${report.reporterFullName || displayProfile(report.reporter)}`} status={report.status} createdAt={report.createdAt}>
      <div className="grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
        <a href={report.originalWorkLink ?? undefined} target="_blank" rel="noreferrer noopener" className="break-all text-indigo-300 hover:underline">Original work: {report.originalWorkLink || "—"}</a>
        <a href={report.infringingContentLink ?? undefined} target="_blank" rel="noreferrer noopener" className="break-all text-indigo-300 hover:underline">Reported content: {report.infringingContentLink || "—"}</a>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
        {report.contactEmail ? <span>Claimant email: {report.contactEmail}</span> : null}
        {report.reportedPostId ? <span>Video / post ID: {report.reportedPostId}</span> : null}
        {report.reportedMomentId ? <span>Moment ID: {report.reportedMomentId}</span> : null}
      </div>
      <p className="mt-2 text-sm text-zinc-300">{report.reason || "No claim detail provided."}</p>
      {report.status === "pending" ? <DecisionControls reason={reason} setReason={setReason} busy={busy} resolveLabel="Takedown & resolve" dismissLabel="Reject claim" onResolve={() => void review("takedown")} onDismiss={() => void review("reject")} /> : null}
    </CaseCard>
  );
}

function PayoutsTab({
  data,
  onChanged,
  onVerifyMfa,
  refreshKey,
  mfaVerified,
}: {
  data: AdminConsoleData | null;
  onChanged: () => void;
  onVerifyMfa: () => void;
  refreshKey: number;
  mfaVerified: boolean;
}) {
  return (
    <Panel
      title="Monetization & Payout Review"
      description="Review monthly payout requests and place or release a payout hold. External transfers are entered manually after payment."
    >
      <InternationalPayoutKycQueue onVerifyMfa={onVerifyMfa} refreshKey={refreshKey} mfaVerified={mfaVerified} />
      <ManualPayoutQueue onVerifyMfa={onVerifyMfa} refreshKey={refreshKey} mfaVerified={mfaVerified} />
      {!data?.monetization.length && !data?.payoutHolds.length ? <Empty text="No monetization records or payout holds." /> : null}
      <div className="space-y-3">
        {data?.monetization.map((row) => <PayoutCard key={row.userId} row={row} onChanged={onChanged} />)}
        {data?.payoutHolds.map((hold) => <CaseCard key={hold.id} title={`Held payout · ${displayProfile(hold.profile)}`} status={hold.status} createdAt={hold.createdAt}><p className="text-sm text-zinc-300">{hold.reason}</p></CaseCard>)}
      </div>
    </Panel>
  );
}

function InternationalPayoutKycQueue({
  onVerifyMfa,
  refreshKey,
  mfaVerified,
}: {
  onVerifyMfa: () => void;
  refreshKey: number;
  mfaVerified: boolean;
}) {
  const [requests, setRequests] = useState<AdminInternationalPayoutKyc[]>([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    if (!mfaVerified) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = getAdminRequests<AdminInternationalPayoutKyc>(
        await readAdminConsoleApi<unknown>("internationalPayoutKyc"),
      );
      if (!result) {
        setRequests([]);
        toast.error("International KYC requests could not be read. Refresh to try again.");
        return;
      }
      if (result.error) {
        setRequests([]);
        if (result.error.toLowerCase().includes("mfa")) onVerifyMfa();
        else toast.error(result.error);
        return;
      }
      setRequests(result.requests);
    } catch (error) {
      setRequests([]);
      const message = error instanceof Error ? error.message : "Could not load international KYC.";
      if (message.toLowerCase().includes("mfa")) onVerifyMfa();
      else toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [mfaVerified, onVerifyMfa]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const review = async (request: AdminInternationalPayoutKyc, action: "verified" | "rejected") => {
    const selectedReason = reason[request.userId]?.trim() ?? "";
    if (selectedReason.length < 3) {
      toast.error("Add a review reason before deciding.");
      return;
    }
    if (action === "rejected" && !window.confirm("Reject these payout details and require the creator to resubmit?")) {
      return;
    }
    setBusyId(request.userId);
    try {
      const result = await reviewAdminInternationalPayoutKyc({
        data: { userId: request.userId, action, reason: selectedReason },
      });
      if (result.emailSent) {
        toast.success(action === "verified" ? "International payout KYC approved and creator notified." : "International payout KYC rejected and creator notified.");
      } else {
        toast.warning(`KYC decision saved, but the creator email was not sent. ${result.emailReason}`);
      }
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not review international payout details.";
      if (message.toLowerCase().includes("mfa")) onVerifyMfa();
      else toast.error(message);
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white">International payout KYC</h3>
          <p className="mt-1 text-[11px] text-zinc-500">
            Tax and bank details are decrypted for Admin MFA review only. Approve KYC before any USD disbursal.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-200 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Refresh KYC"}
        </button>
      </div>
      {!mfaVerified ? (
        <p className="mt-3 text-xs text-amber-200/80">Verify admin MFA to load payout requests.</p>
      ) : null}
      {mfaVerified && !loading && requests.length === 0 ? (
        <p className="mt-3 text-xs text-zinc-500">No pending international payout applications.</p>
      ) : null}
      <div className="mt-3 space-y-3">
        {requests.map((request) => (
          <article key={request.userId} className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">{request.legalName}</p>
                <p className="mt-0.5 text-[11px] text-zinc-400">
                  {request.country} · {request.payoutMethod === "paypal" ? "PayPal" : "Bank"} · submitted{" "}
                  {new Date(request.submittedAt).toLocaleString()}
                </p>
                <p className="mt-1 break-all text-[11px] text-zinc-500">User ID: {request.userId}</p>
              </div>
              <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-200">
                Pending review
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-zinc-300 sm:grid-cols-2">
              <p>Tax / National ID: <span className="font-mono text-white">{request.taxIdentifier}</span></p>
              {request.payoutMethod === "paypal" ? (
                <p>PayPal email: <span className="text-white">{request.paypalEmail || "—"}</span></p>
              ) : request.country.trim().toLowerCase().match(/^(united states|united states of america|usa|us|u\.s\.|u\.s\.a\.)$/) ? (
                <>
                  <p>Routing / ABA: <span className="font-mono text-white">{request.routingAba || "—"}</span></p>
                  <p>Account number: <span className="font-mono text-white">{request.accountNumber || "—"}</span></p>
                </>
              ) : (
                <>
                  <p>IBAN: <span className="font-mono text-white">{request.iban || "—"}</span></p>
                  <p>SWIFT / BIC: <span className="font-mono text-white">{request.swiftBic || "—"}</span></p>
                  <p>Bank name: <span className="text-white">{request.bankName || "—"}</span></p>
                </>
              )}
              <p className="sm:col-span-2">
                Declaration:{" "}
                <span className="text-white">
                  {request.country.trim().toLowerCase().match(/^(united states|united states of america|usa|us|u\.s\.|u\.s\.a\.)$/)
                    ? request.usTaxResidentDeclaration ? "US tax-residency declaration accepted" : "Missing"
                    : request.nonIndianResidentDeclaration ? "Non-Indian residency declaration accepted" : "Missing"}
                </span>
              </p>
            </div>
            <label className="mt-3 block">
              <span className="mb-1 block text-[10px] text-zinc-500">Admin review reason (required)</span>
              <textarea
                value={reason[request.userId] ?? ""}
                onChange={(event) => setReason((current) => ({ ...current, [request.userId]: event.target.value }))}
                rows={2}
                maxLength={2000}
                placeholder="Record the verification decision"
                className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-white/25"
              />
            </label>
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => void review(request, "rejected")}
                disabled={busyId === request.userId}
                className="rounded-xl border border-red-400/30 px-3 py-2 text-xs text-red-200 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => void review(request, "verified")}
                disabled={busyId === request.userId}
                className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
              >
                {busyId === request.userId ? "Reviewing…" : "Approve KYC"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ManualPayoutQueue({
  onVerifyMfa,
  refreshKey,
  mfaVerified,
}: {
  onVerifyMfa: () => void;
  refreshKey: number;
  mfaVerified: boolean;
}) {
  const [requests, setRequests] = useState<AdminPayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reason, setReason] = useState<Record<string, string>>({});
  const [reference, setReference] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    if (!mfaVerified) {
      setRequests([]);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = getAdminRequests<AdminPayoutRequest>(
        await readAdminConsoleApi<unknown>("payoutRequests"),
      );
      if (!result) {
        setRequests([]);
        setError("Payout requests could not be read. Refresh to try again.");
        return;
      }
      if (result.error) {
        setRequests([]);
        setError(result.error);
        if (result.error.toLowerCase().includes("mfa")) onVerifyMfa();
        return;
      }
      setRequests(result.requests);
    } catch (loadError) {
      setRequests([]);
      const message = loadError instanceof Error ? loadError.message : "Could not load payout requests.";
      setError(message);
      if (message.toLowerCase().includes("mfa")) onVerifyMfa();
    } finally {
      setLoading(false);
    }
  }, [mfaVerified, onVerifyMfa]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const resolve = async (request: AdminPayoutRequest, action: "completed" | "failed") => {
    const selectedReason = reason[request.id]?.trim() ?? "";
    const paymentReference = reference[request.id]?.trim() ?? "";
    if (!selectedReason) return toast.error("Add a reason for the payout review.");
    if (action === "completed" && !paymentReference) {
      return toast.error("Enter the external bank transfer reference first.");
    }
    if (
      action === "failed" &&
      !window.confirm("Mark this payout request as failed and return its balance to the wallet?")
    ) {
      return;
    }
    setBusyId(request.id);
    try {
      await resolveAdminPayoutRequest({
        data: {
          requestId: request.id,
          action,
          reason: selectedReason,
          paymentReference,
        },
      });
      toast.success(action === "completed" ? "Payout marked as paid." : "Payout failed; balance released.");
      setReason((current) => ({ ...current, [request.id]: "" }));
      setReference((current) => ({ ...current, [request.id]: "" }));
      await load();
    } catch (resolveError) {
      toast.error(resolveError instanceof Error ? resolveError.message : "Could not resolve payout.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white">Manual transfers</h3>
          <p className="mt-1 text-[11px] text-zinc-500">
            Private bank details are shown only after Admin MFA. Complete transfers during the assigned monthly 1–5 window.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-200 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Refresh requests"}
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-3">
          <p className="text-xs text-amber-100">{error}</p>
          {error.toLowerCase().includes("mfa") ? (
            <button
              type="button"
              onClick={onVerifyMfa}
              className="mt-2 rounded-lg bg-amber-200 px-3 py-2 text-xs font-bold text-black"
            >
              Verify MFA
            </button>
          ) : null}
        </div>
      ) : null}

      {!mfaVerified ? (
        <p className="mt-3 text-xs text-amber-200/80">Verify admin MFA to load payout requests.</p>
      ) : null}
      {mfaVerified && !loading && !error && requests.length === 0 ? (
        <p className="mt-3 rounded-xl border border-white/5 px-3 py-3 text-xs text-zinc-500">
          No payout requests are waiting for manual review.
        </p>
      ) : null}

      <div className="mt-3 space-y-3">
        {requests.map((request) => (
          <article key={request.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{displayProfile(request.profile)}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {formatPayoutMoney(request.amount, request.currency)} requested ·{" "}
                  {formatPayoutMoney(request.netAmount, request.currency)} net after TDS
                </p>
                <p className="mt-1 text-[10px] text-zinc-500">
                  Monthly window begins{" "}
                  {request.payoutWindowStart
                    ? new Date(`${request.payoutWindowStart}T00:00:00`).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "not set"}
                </p>
              </div>
              <span className="rounded-full border border-amber-300/15 px-2 py-1 text-[10px] uppercase text-amber-200">
                {request.status}
              </span>
            </div>

            <div className="mt-3 grid gap-1.5 rounded-lg bg-white/[0.03] p-3 text-xs text-zinc-300 sm:grid-cols-2">
              {request.currency === "INR" ? (
                <>
                  <p>Payee: {request.payoutProfile?.holderName || "Not provided"}</p>
                  <p>Bank: {request.payoutProfile?.bankName || "—"}</p>
                  <p className="break-all">Account / IBAN: {request.payoutProfile?.accountNumber || "—"}</p>
                  <p>IFSC: {request.payoutProfile?.ifsc || "—"}</p>
                  <p>SWIFT / BIC: {request.payoutProfile?.swiftBic || "—"}</p>
                  <p>UPI: {request.payoutProfile?.upiId || "—"}</p>
                  <p>Bank country: {request.payoutProfile?.bankCountry || "—"}</p>
                </>
              ) : (
                <>
                  <p>Payee: {request.payoutProfile?.legalName || "Not provided"}</p>
                  <p>Method: {request.payoutProfile?.payoutMethod === "paypal" ? "PayPal" : "Bank transfer"}</p>
                  {request.payoutProfile?.payoutMethod === "paypal" ? (
                    <p className="break-all">PayPal: {request.payoutProfile.paypalEmail || "—"}</p>
                  ) : request.payoutProfile?.iban ? (
                    <>
                      <p className="break-all">IBAN: {request.payoutProfile.iban}</p>
                      <p>SWIFT / BIC: {request.payoutProfile.swiftBic || "—"}</p>
                      <p>Bank: {request.payoutProfile.bankName || "—"}</p>
                    </>
                  ) : (
                    <>
                      <p>Routing / ABA: {request.payoutProfile?.routingAba || "—"}</p>
                      <p className="break-all">Account: {request.payoutProfile?.accountNumber || "—"}</p>
                    </>
                  )}
                  <p>Country: {request.payoutProfile?.bankCountry || "—"}</p>
                </>
              )}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input
                value={reference[request.id] ?? ""}
                onChange={(event) =>
                  setReference((current) => ({ ...current, [request.id]: event.target.value }))
                }
                placeholder="External transfer reference (required to mark paid)"
                className="min-w-0 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs outline-none focus:border-white/25"
              />
              <input
                value={reason[request.id] ?? ""}
                onChange={(event) =>
                  setReason((current) => ({ ...current, [request.id]: event.target.value }))
                }
                placeholder="Required audit reason"
                className="min-w-0 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs outline-none focus:border-white/25"
              />
            </div>
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={busyId === request.id}
                onClick={() => void resolve(request, "failed")}
                className="rounded-xl border border-red-300/20 px-3 py-2 text-xs font-semibold text-red-200 disabled:opacity-50"
              >
                Fail & release
              </button>
              <button
                type="button"
                disabled={busyId === request.id}
                onClick={() => void resolve(request, "completed")}
                className="rounded-xl bg-emerald-300 px-3 py-2 text-xs font-bold text-black disabled:opacity-50"
              >
                {busyId === request.id ? "Saving…" : "Mark transfer paid"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatPayoutMoney(amount: number, currency: "INR" | "USD") {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
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
    <div className="rounded-2xl border border-white/10 bg-[#121215] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)] sm:p-5">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mb-4 mt-1 text-[13px] leading-5 text-zinc-400">{description}</p>
      {children}
    </div>
  );
}

function CaseCard({ title, status, createdAt, children }: { title: string; status: string; createdAt: string | null; children: ReactNode }) {
  return (
    <article className="mb-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition-colors duration-200 hover:border-white/15">
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

function AdminDenied({ title, message }: { title: string; message: string }) {
  return <main className="min-h-screen bg-[#09090b] p-6 text-white"><div className="mx-auto mt-12 max-w-md rounded-2xl border border-zinc-800 bg-[#141418] p-6 text-center"><ShieldAlert className="mx-auto mb-3 text-red-500" size={28} /><h1 className="text-lg font-bold">{title}</h1><p className="mt-2 text-sm text-zinc-400">{message}</p></div></main>;
}

function AdminLoading() {
  return <main className="min-h-screen bg-[#09090b] p-6 text-sm text-zinc-400">Checking admin access…</main>;
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