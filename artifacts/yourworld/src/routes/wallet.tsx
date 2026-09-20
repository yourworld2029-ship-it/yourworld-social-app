import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CheckCircle2, Coins, ExternalLink, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { computeBreakdown, inr, MIN_PAYOUT, type GrossBySource } from "@/lib/payout-math";
import { submitPayoutRequest } from "@/lib/payouts.functions";
import { postKind } from "@/lib/supabase-compat";
import { historyBackOr } from "@/lib/navigation";
import { useVerifiedSportsIdentity } from "@/lib/sports-identity";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Monetization & Wallet — YourWorld" },
      {
        name: "description",
        content:
          "Track creator earnings, course sales, VIP memberships, payouts and download GST/TDS tax invoices.",
      },
      { property: "og:title", content: "Monetization & Wallet — YourWorld" },
      {
        property: "og:description",
        content: "Earnings, courses, payouts and tax invoices for YourWorld creators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WalletPage,
});

const STANDARD_TRACKER_REQUIREMENTS = {
  followers: 15000,
  watchHours: 2500,
  videoViews: 150000,
  badgeTag: null,
};
const NATIONAL_TRACKER_REQUIREMENTS = {
  followers: 12000,
  watchHours: 2000,
  videoViews: 100000,
  badgeTag: "National Athlete Benefit",
};
const INTERNATIONAL_TRACKER_REQUIREMENTS = {
  followers: 10000,
  watchHours: 1500,
  videoViews: 70000,
  badgeTag: "International Athlete Benefit",
};

function trackerRequirements(identity: ReturnType<typeof useVerifiedSportsIdentity>) {
  if (identity?.status === "International") return INTERNATIONAL_TRACKER_REQUIREMENTS;
  if (identity?.status === "National") return NATIONAL_TRACKER_REQUIREMENTS;
  return STANDARD_TRACKER_REQUIREMENTS;
}

type KycStatus = "pending" | "verified" | "rejected";
type PayoutSchedule = "15_days" | "30_days";

type PayoutRequestRow = {
  id: string;
  user_id: string;
  amount: number;
  net_amount: number;
  tds_deducted: number;
  status: "processing" | "completed" | "failed" | string;
  schedule_type: PayoutSchedule;
  form_16a_url: string | null;
  failure_reason: string | null;
  completed_at: string | null;
  created_at: string;
};

type Details = {
  creator_email: string;
  upi_id: string;
  bank_account: string;
  ifsc_code: string;
  account_holder: string;
  pan_number: string;
};

const emptyDetails: Details = {
  creator_email: "",
  upi_id: "",
  bank_account: "",
  ifsc_code: "",
  account_holder: "",
  pan_number: "",
};

function MonetizationTermsCheckbox({
  accepted,
  onChange,
}: {
  accepted: boolean;
  onChange: (accepted: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-[#141418] p-4 text-xs leading-relaxed text-zinc-300">
      <input
        type="checkbox"
        checked={accepted}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 accent-indigo-500"
      />
      <span>
        I accept the{" "}
        <Link to="/terms/monetization" className="font-semibold text-indigo-300 underline">
          Creator Monetization Terms & Conditions
        </Link>
        .
      </span>
    </label>
  );
}

function WalletPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const sportsIdentity = useVerifiedSportsIdentity(user?.id ?? null);
  const runPayout = useServerFn(submitPayoutRequest);

  const [gross, setGross] = useState<GrossBySource>({ ads: 0, course: 0, vip: 0 });
  const [cumulativeDirectSalesNet, setCumulativeDirectSalesNet] = useState(0);
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [schedule, setSchedule] = useState<PayoutSchedule>("15_days");
  const [kycStatus, setKycStatus] = useState<KycStatus>("pending");
  const [eligible, setEligible] = useState(false);
  const [stats, setStats] = useState({ followers: 0, watchHours: 0, videoViews: 0 });
  const [payouts, setPayouts] = useState<PayoutRequestRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;
    let alive = true;
    (async () => {
      const [
        { data: earnings },
        { data: allEarnings },
        { data: det },
        { data: payoutHistory },
        { count: followerCount },
        { data: myPosts },
        { data: watchHours },
      ] = await Promise.all([
          supabase
            .from("creator_earnings")
            .select("source, gross_amount")
            .eq("user_id", uid)
            .is("payout_id", null)
            .is("payout_request_id", null),
          supabase.from("creator_earnings").select("source, gross_amount").eq("user_id", uid),
          supabase.from("creator_payout_profiles").select("*").eq("user_id", uid).maybeSingle(),
          supabase
            .from("payout_requests")
            .select("*")
            .eq("user_id", uid)
            .order("created_at", { ascending: false }),
          supabase
            .from("follows")
            .select("id", { count: "exact", head: true })
            .eq("following_id", uid),
          supabase.from("posts").select("*").eq("user_id", uid),
          supabase.rpc("get_channel_watch_hours", {
            _channel_id: uid,
            _period_start: new Date(0).toISOString(),
          }),
        ]);
      if (!alive) return;
      const next: GrossBySource = { ads: 0, course: 0, vip: 0 };
      for (const row of earnings ?? []) {
        const key = row.source as keyof GrossBySource;
        if (key in next) next[key] += Number(row.gross_amount ?? 0);
      }
      setGross(next);
      const cumulativeDirectGross: GrossBySource = { ads: 0, course: 0, vip: 0 };
      for (const row of allEarnings ?? []) {
        const key = row.source as keyof GrossBySource;
        if (key === "course" || key === "vip") {
          cumulativeDirectGross[key] += Number(row.gross_amount ?? 0);
        }
      }
      setCumulativeDirectSalesNet(computeBreakdown(cumulativeDirectGross).creatorShare);
      if (det) {
        setDetails({
          creator_email: det.email ?? "",
          upi_id: det.upi_id ?? "",
          bank_account: det.account_number ?? "",
          ifsc_code: det.ifsc ?? "",
          account_holder: det.holder_name ?? "",
          pan_number: det.pan_number ?? "",
        });
        setSchedule(det.payout_schedule === "30_days" ? "30_days" : "15_days");
        setKycStatus(
          det.kyc_status === "verified" || det.kyc_status === "rejected"
            ? det.kyc_status
            : "pending",
        );
        setEligible(Boolean(det.monetization_eligible));
        setTermsAccepted(Boolean(det.terms_accepted_at));
      } else {
        setDetails((d) => ({ ...d, creator_email: user?.email ?? "" }));
        setKycStatus("pending");
        setTermsAccepted(false);
      }
      setPayouts((payoutHistory ?? []) as PayoutRequestRow[]);

      let videoViews = 0;
      for (const p of myPosts ?? []) {
        const kind = postKind(p);
        if (kind === "video") {
          videoViews += Number(p.views_count ?? p.views ?? 0);
        }
      }
      const rawWatchHours =
        typeof watchHours === "number"
          ? watchHours
          : Number((watchHours as { watch_hours?: number } | null)?.watch_hours ?? 0);
      setStats({
        followers: Number(followerCount ?? 0),
        watchHours: Number.isFinite(rawWatchHours)
          ? Math.round(Math.max(0, rawWatchHours) * 100) / 100
          : 0,
        videoViews,
      });
    })();
    return () => {
      alive = false;
    };
  }, [user?.id, user?.email]);

  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;
    const channel = supabase
      .channel(`payout-requests-${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payout_requests", filter: `user_id=eq.${uid}` },
        async () => {
          const { data } = await supabase
            .from("payout_requests")
            .select("*")
            .eq("user_id", uid)
            .order("created_at", { ascending: false });
          if (data) setPayouts(data as PayoutRequestRow[]);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const b = computeBreakdown(gross);
  const requirements = trackerRequirements(sportsIdentity);
  const canApply =
    stats.followers >= requirements.followers &&
    (stats.watchHours >= requirements.watchHours || stats.videoViews >= requirements.videoViews);
  const directSalesBalance = computeBreakdown({
    ads: 0,
    course: gross.course,
    vip: gross.vip,
  }).creatorShare;
  const directSalesUnlocked = cumulativeDirectSalesNet >= MIN_PAYOUT;
  const showWallet = eligible || canApply || directSalesUnlocked;

  const saveDetails = async () => {
    if (!user?.id) return;
    if (!termsAccepted) {
      toast.error("Accept the Creator Monetization Terms before saving payout details");
      return;
    }
    setSaving(true);
    const nextKycStatus: KycStatus = kycStatus === "verified" ? "verified" : "pending";
    const { error } = await supabase
      .from("creator_payout_profiles")
      .upsert(
        {
          user_id: user.id,
          email: details.creator_email,
          upi_id: details.upi_id,
          account_number: details.bank_account,
          ifsc: details.ifsc_code,
          holder_name: details.account_holder,
          pan_number: details.pan_number,
          payout_schedule: schedule,
          kyc_status: nextKycStatus,
          monetization_eligible: eligible,
          terms_accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setKycStatus(nextKycStatus);
    toast.success(
      nextKycStatus === "verified"
        ? "Payout details saved"
        : "Payout details saved. KYC is now under review.",
    );
  };

  const applyForMonetization = async () => {
    if (!user?.id || !canApply) return;
    if (!termsAccepted) {
      toast.error("Accept the Creator Monetization Terms before applying");
      return;
    }
    setApplying(true);
    const { error } = await supabase
      .from("creator_payout_profiles")
      .upsert(
        {
          user_id: user.id,
          email: details.creator_email,
          upi_id: details.upi_id,
          account_number: details.bank_account,
          ifsc: details.ifsc_code,
          holder_name: details.account_holder,
          pan_number: details.pan_number,
          payout_schedule: schedule,
          kyc_status: kycStatus,
          monetization_eligible: true,
          terms_accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    setApplying(false);
    if (error) return toast.error(error.message);
    setEligible(true);
    toast.success("Monetization unlocked — welcome to the program!");
  };

  const withdraw = async () => {
    if (!termsAccepted) {
      toast.error("Accept the Creator Monetization Terms before requesting a payout");
      return;
    }
    if (kycStatus !== "verified") {
      toast.error("KYC verification is required before requesting a payout");
      return;
    }
    setProcessing(true);
    try {
      const res = await runPayout({});
      const payout = res.payoutRequest as PayoutRequestRow;
      setPayouts((p) => [payout, ...p]);
      setGross({ ads: 0, course: 0, vip: 0 });
      toast.success("Payout request submitted successfully. Processing via your chosen schedule.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payout failed");
    } finally {
      setProcessing(false);
    }
  };

  const trackers = [
    { label: "Followers", value: stats.followers, target: requirements.followers, unit: "Followers" },
    { label: "Watch Hours", value: stats.watchHours, target: requirements.watchHours, unit: "Hours" },
    { label: "Video Views", value: stats.videoViews, target: requirements.videoViews, unit: "Views" },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] pb-16 font-sans text-white">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-zinc-800 bg-[#09090b]/90 px-4 py-3 backdrop-blur">
        <button
          onClick={() => historyBackOr(() => void navigate({ to: "/settings" }))}
          aria-label="Back to settings"
          className="p-1 text-zinc-300 hover:text-white"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">Monetization & Wallet</h1>
      </header>

      <div className="space-y-4 p-4">
        {!showWallet ? (
          <>
            <section className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-[#17171c] to-[#101014] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Monetization Eligibility Tracker
              </p>
              {requirements.badgeTag ? (
                <p className="pt-1 text-[11px] font-semibold text-indigo-300">{requirements.badgeTag}</p>
              ) : null}
              <p className="pt-2 text-sm text-zinc-300">
                Reach {requirements.followers.toLocaleString("en-IN")} followers and either{" "}
                {requirements.watchHours.toLocaleString("en-IN")} watch hours or{" "}
                {requirements.videoViews.toLocaleString("en-IN")} video views to join the program.
              </p>
            </section>

            {trackers.map((t) => {
              const pct = Math.min(100, Math.round((t.value / t.target) * 100));
              return (
                <section
                  key={t.label}
                  className="rounded-2xl border border-zinc-800 bg-[#141418] p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{t.label}</p>
                    <p className="text-[11px] text-zinc-400">
                      {t.value.toLocaleString("en-IN")} / {t.target.toLocaleString("en-IN")} {t.unit}
                    </p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-[width] duration-700 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="pt-1.5 text-[10px] text-zinc-500">{pct}% complete</p>
                </section>
              );
            })}

            <MonetizationTermsCheckbox accepted={termsAccepted} onChange={setTermsAccepted} />
            <button
              onClick={applyForMonetization}
              disabled={!canApply || applying || !termsAccepted}
              className="w-full rounded-full bg-indigo-500 py-3 text-sm font-semibold disabled:opacity-50"
            >
              {applying ? "Applying…" : "Apply for Monetization Program"}
            </button>

            <section className="rounded-2xl border border-zinc-800 bg-[#141418] p-4">
              <h2 className="text-sm font-bold">Day 1 Direct Earnings</h2>
              <p className="pt-1.5 text-sm font-semibold text-zinc-200">
                Current sales balance: {inr(directSalesBalance)}
              </p>
              <p className="pt-1.5 text-[11px] leading-relaxed text-zinc-500">
                Earn ₹5,000 from courses/memberships to unlock bank withdrawal (Current:{" "}
                {inr(directSalesBalance)} / ₹5,000)
              </p>
            </section>
          </>
        ) : (
          <>
            {canApply && !eligible ? (
              <section className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4">
                <p className="text-sm font-semibold">Standard ad monetization threshold reached</p>
                <p className="pt-1 text-[11px] leading-relaxed text-zinc-400">
                  Apply to save your monetization eligibility and keep earning from ad revenue.
                </p>
                <button
                  onClick={applyForMonetization}
                    disabled={applying || !termsAccepted}
                  className="mt-3 w-full rounded-full bg-indigo-500 py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  {applying ? "Applying…" : "Apply for Monetization Program"}
                </button>
              </section>
            ) : null}

            {/* Total earnings */}
            <section className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-[#17171c] to-[#101014] p-5">
              <div className="flex items-center gap-2 text-zinc-400">
                <Wallet size={16} />
                <p className="text-[11px] font-semibold uppercase tracking-wide">
                  Total Earnings (Net Creator Share)
                </p>
              </div>
              <p className="pt-2 text-3xl font-extrabold">{inr(b.creatorShare)}</p>
              <p className="pt-1 text-[11px] text-zinc-500">
                Net creator earnings, before any payout-time TDS deduction.
              </p>
            </section>

            {/* Revenue breakdown */}
            <section className="grid grid-cols-3 gap-3">
              {[
                { label: "Ad & View Earnings", v: b.creatorBySource.ads },
                { label: "Course Earnings", v: b.creatorBySource.course },
                { label: "VIP Memberships", v: b.creatorBySource.vip },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl border border-zinc-800 bg-[#141418] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    {c.label}
                  </p>
                  <p className="pt-1.5 text-sm font-bold">{inr(c.v)}</p>
                </div>
              ))}
            </section>

            <section className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4">
              <p className="text-sm font-semibold">Payout preview</p>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between gap-3 text-zinc-300">
                  <span>Requested amount</span>
                  <span className="font-semibold text-white">{inr(b.creatorShare)}</span>
                </div>
                <div className="flex justify-between gap-3 text-zinc-400">
                  <span>TDS under Section 194-O (1%)</span>
                  <span>- {inr(b.tds)}</span>
                </div>
                <div className="flex justify-between gap-3 border-t border-indigo-300/20 pt-2 font-semibold text-white">
                  <span>Net payout to bank</span>
                  <span>{inr(b.net)}</span>
                </div>
              </div>
            </section>

            <MonetizationTermsCheckbox accepted={termsAccepted} onChange={setTermsAccepted} />

            {/* Payout details */}
            <section className="rounded-2xl border border-zinc-800 bg-[#141418] p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold">Payout & Bank Details</h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                    kycStatus === "verified"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : kycStatus === "rejected"
                        ? "border-red-500/30 bg-red-500/10 text-red-300"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {kycStatus === "verified" ? <CheckCircle2 size={12} /> : null}
                  KYC Status:{" "}
                  {kycStatus === "verified"
                    ? "Verified"
                    : kycStatus === "rejected"
                      ? "Rejected"
                      : "Under Review"}
                </span>
              </div>
              <div className="grid gap-2.5 pt-3">
                {(
                  [
                    ["creator_email", "Creator Email ID", "you@gmail.com"],
                    ["upi_id", "UPI ID", "name@upi"],
                    ["bank_account", "Bank Account Number", "Account number"],
                    ["ifsc_code", "IFSC Code", "IFSC0000000"],
                    ["account_holder", "Account Holder Name", "Full name as per bank"],
                    ["pan_number", "PAN Card Number", "ABCDE1234F"],
                  ] as Array<[keyof Details, string, string]>
                ).map(([key, label, ph]) => (
                  <label key={key} className="block">
                    <span className="mb-1 block text-[11px] text-zinc-500">{label}</span>
                    <input
                      value={details[key]}
                      onChange={(e) => setDetails((d) => ({ ...d, [key]: e.target.value }))}
                      placeholder={ph}
                      className="w-full rounded-xl border border-zinc-800 bg-[#0f0f13] px-3 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
                    />
                  </label>
                ))}
                <label className="block">
                  <span className="mb-1 block text-[11px] text-zinc-500">Auto-Payout Schedule</span>
                  <select
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value as PayoutSchedule)}
                    className="w-full rounded-xl border border-zinc-800 bg-[#0f0f13] px-3 py-2.5 text-sm outline-none focus:border-zinc-600"
                  >
                    <option value="15_days">Every 15 Days</option>
                    <option value="30_days">Every 30 Days</option>
                  </select>
                </label>
              </div>
              <button
                onClick={saveDetails}
                disabled={saving || !termsAccepted}
                className="mt-3 w-full rounded-full bg-white py-2.5 text-sm font-semibold text-black disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Details"}
              </button>
            </section>

            {/* Withdraw */}
            <div>
              <button
                onClick={withdraw}
                disabled={
                  processing ||
                  b.creatorShare < MIN_PAYOUT ||
                  kycStatus !== "verified" ||
                  !termsAccepted
                }
                className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 py-3 text-sm font-semibold disabled:opacity-50"
              >
                {processing ? <Loader2 className="animate-spin" size={16} /> : <Coins size={16} />}
                {processing ? "Processing payout…" : `Request Payout (Net ${inr(b.net)})`}
              </button>
              <p className="pt-2 text-center text-[11px] text-zinc-500">
                {!termsAccepted
                  ? "Accept the Creator Monetization Terms before requesting a payout"
                  : kycStatus !== "verified"
                  ? "KYC verification is required before requesting a payout"
                  : b.creatorShare < MIN_PAYOUT
                  ? "Minimum available balance for payout is ₹5,000"
                  : `Processing via your ${schedule === "15_days" ? "15 Days" : "30 Days"} Cycle / Direct Bank.`}
              </p>
            </div>

            {/* History */}
            <section className="rounded-2xl border border-zinc-800 bg-[#141418] p-4">
              <h2 className="text-sm font-bold">Payout History</h2>
              {payouts.length === 0 ? (
                <p className="pt-2 text-[11px] text-zinc-500">
                  No payouts yet. Your statements and Form 16A certificates will appear here.
                </p>
              ) : (
                <ul className="divide-y divide-zinc-800/80 pt-1">
                  {payouts.map((p) => (
                    <li key={p.id} className="flex items-start gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{inr(Number(p.amount))}</p>
                        <p className="pt-0.5 text-[11px] text-zinc-400">
                          {p.schedule_type === "15_days" ? "15 Days Cycle" : "30 Days Cycle"} / Direct Bank
                        </p>
                        <p className="truncate pt-0.5 text-[11px] text-zinc-500">
                          {new Date(p.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            p.status === "completed"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : p.status === "failed"
                                ? "bg-red-500/15 text-red-300"
                                : "bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          {p.status === "completed"
                            ? "Completed"
                            : p.status === "failed"
                              ? "Failed"
                              : "Processing"}
                        </span>
                        {p.status === "completed" ? (
                          p.form_16a_url ? (
                            <a
                              href={p.form_16a_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[10px] font-semibold text-zinc-300 hover:text-white"
                            >
                              <ExternalLink size={12} /> Form 16A
                            </a>
                          ) : (
                            <span className="text-right text-[10px] text-zinc-500">
                              Form 16A pending
                            </span>
                          )
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="pt-3 text-[10px] leading-relaxed text-zinc-500">
                Form 16A tax certificates are issued against your PAN at the end of each financial
                quarter and will be listed in this section.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
