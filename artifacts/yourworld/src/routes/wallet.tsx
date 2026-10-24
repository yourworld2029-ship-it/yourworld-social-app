import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CheckCircle2, Coins, ExternalLink, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import {
  computeBreakdown,
  earningsForCurrency,
  formatPayoutAmount,
  isUnitedStatesPayoutCountry,
  meetsMonetizationTargets,
  minimumPayout,
  payoutCurrencyForCountry,
  round2,
  TDS_RATE,
  type GrossBySource,
  type PayoutCurrency,
} from "@/lib/payout-math";
import {
  getInternationalPayoutProfile,
  saveInternationalPayoutProfile,
  submitPayoutRequest,
} from "@/lib/payouts.functions";
import { postKind } from "@/lib/supabase-compat";
import { historyBackOr } from "@/lib/navigation";
import { useVerifiedSportsIdentity } from "@/lib/sports-identity";
import { useAdminAccess } from "@/lib/use-admin-access";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
type PayoutSchedule = "monthly_1_5";

type PayoutRequestRow = {
  id: string;
  user_id: string;
  amount: number;
  net_amount: number;
  tds_deducted: number;
  status: "processing" | "completed" | "failed" | string;
  schedule_type: PayoutSchedule | "15_days" | "30_days";
  currency?: PayoutCurrency;
  payout_window_start?: string | null;
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
  bank_name: string;
  swift_bic: string;
};

type InternationalPayoutForm = {
  legalName: string;
  taxIdentifier: string;
  payoutMethod: "bank" | "paypal";
  routingAba: string;
  accountNumber: string;
  iban: string;
  swiftBic: string;
  bankName: string;
  paypalEmail: string;
  usTaxResidentDeclaration: boolean;
  nonIndianResidentDeclaration: boolean;
};

const emptyInternationalPayoutForm: InternationalPayoutForm = {
  legalName: "",
  taxIdentifier: "",
  payoutMethod: "bank",
  routingAba: "",
  accountNumber: "",
  iban: "",
  swiftBic: "",
  bankName: "",
  paypalEmail: "",
  usTaxResidentDeclaration: false,
  nonIndianResidentDeclaration: false,
};

const emptyDetails: Details = {
  creator_email: "",
  upi_id: "",
  bank_account: "",
  ifsc_code: "",
  account_holder: "",
  pan_number: "",
  bank_name: "",
  swift_bic: "",
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
  const adminAccess = useAdminAccess();
  const sportsIdentity = useVerifiedSportsIdentity(user?.id ?? null);
  const runPayout = useServerFn(submitPayoutRequest);
  const loadInternationalPayout = useServerFn(getInternationalPayoutProfile);
  const saveInternationalPayout = useServerFn(saveInternationalPayoutProfile);

  const [gross, setGross] = useState<GrossBySource>({ ads: 0, course: 0, vip: 0 });
  const [videoNet, setVideoNet] = useState(0);
  const [cumulativeDirectSalesNet, setCumulativeDirectSalesNet] = useState(0);
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [country, setCountry] = useState("");
  const [countryLoaded, setCountryLoaded] = useState(false);
  const [internationalDetails, setInternationalDetails] =
    useState<InternationalPayoutForm>(emptyInternationalPayoutForm);
  const [internationalReviewReason, setInternationalReviewReason] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<KycStatus>("pending");
  const [eligible, setEligible] = useState(false);
  const [stats, setStats] = useState({ followers: 0, watchHours: 0, videoViews: 0 });
  const [nationalAwardApproved, setNationalAwardApproved] = useState(false);
  const [payouts, setPayouts] = useState<PayoutRequestRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [payoutPreviewRequested, setPayoutPreviewRequested] = useState(false);
  const [payoutPreviewCountry, setPayoutPreviewCountry] = useState("India");

  useEffect(() => {
    const uid = user?.id;
    setNationalAwardApproved(false);
    setCountryLoaded(false);
    setCountry("");
    setInternationalDetails(emptyInternationalPayoutForm);
    setInternationalReviewReason(null);
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
        { data: nationalAwardVerification, error: nationalAwardError },
        { data: profileCountry },
      ] = await Promise.all([
          supabase
            .from("creator_earnings")
            .select("source, gross_amount, creator_amount, currency")
            .eq("user_id", uid)
            .is("payout_id", null)
            .is("payout_request_id", null),
          supabase
            .from("creator_earnings")
            .select("source, gross_amount, creator_amount, currency")
            .eq("user_id", uid),
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
          supabase
            .from("national_award_verifications")
            .select("review_status")
            .eq("user_id", uid)
            .maybeSingle(),
          supabase.from("profiles").select("country").eq("id", uid).maybeSingle(),
        ]);
      if (!alive) return;
      if (nationalAwardError) {
        console.error("Could not load National Award status for monetization eligibility", nationalAwardError);
      }
      setNationalAwardApproved(
        !nationalAwardError && nationalAwardVerification?.review_status === "approved",
      );
      const savedCountry = String(profileCountry?.country ?? "");
      const activeCurrency = payoutCurrencyForCountry(savedCountry);
      setCountry(savedCountry);
      const next: GrossBySource = { ads: 0, course: 0, vip: 0 };
      const activeEarnings = (earnings ?? []) as Array<{
        source: string;
        gross_amount: number | string | null;
        creator_amount?: number | string | null;
        currency?: string | null;
      }>;
      const currentCurrencyEarnings = earningsForCurrency(activeEarnings, activeCurrency);
      for (const row of currentCurrencyEarnings) {
        const key = row.source as keyof GrossBySource;
        if (key in next) next[key] += Number(row.gross_amount ?? 0);
      }
      setGross(next);
      const unpaidVideoNet = currentCurrencyEarnings.reduce((sum, row) => {
        return row.source === "video" ? sum + Number(row.creator_amount ?? 0) : sum;
      }, 0);
      setVideoNet(round2(unpaidVideoNet));

      const cumulativeDirectGross: GrossBySource = { ads: 0, course: 0, vip: 0 };
      let cumulativeVideoNet = 0;
      const currentAllEarnings = earningsForCurrency(
        (allEarnings ?? []) as Array<{
          source: string;
          gross_amount?: number | string | null;
          creator_amount?: number | string | null;
          currency?: string | null;
        }>,
        activeCurrency,
      );
      for (const typedRow of currentAllEarnings) {
        if (typedRow.source === "video") {
          cumulativeVideoNet += Number(typedRow.creator_amount ?? 0);
          continue;
        }
        const key = typedRow.source as keyof GrossBySource;
        if (key === "course" || key === "vip") {
          cumulativeDirectGross[key] += Number(typedRow.gross_amount ?? 0);
        }
      }
      setCumulativeDirectSalesNet(
        round2(computeBreakdown(cumulativeDirectGross).creatorShare + cumulativeVideoNet),
      );
      if (det) {
        setDetails({
          creator_email: det.email ?? "",
          upi_id: det.upi_id ?? "",
          bank_account: det.account_number ?? "",
          ifsc_code: det.ifsc ?? "",
          account_holder: det.holder_name ?? "",
          pan_number: det.pan_number ?? "",
          bank_name: det.bank_name ?? "",
          swift_bic: det.swift_bic ?? "",
        });
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

      if (activeCurrency === "USD") {
        try {
          const { profile: internationalProfile } = await loadInternationalPayout({});
          if (!alive) return;
          if (internationalProfile) {
            setInternationalDetails({
              legalName: internationalProfile.legalName ?? "",
              taxIdentifier: internationalProfile.taxIdentifier ?? "",
              payoutMethod: internationalProfile.payoutMethod === "paypal" ? "paypal" : "bank",
              routingAba: internationalProfile.routingAba ?? "",
              accountNumber: internationalProfile.accountNumber ?? "",
              iban: internationalProfile.iban ?? "",
              swiftBic: internationalProfile.swiftBic ?? "",
              bankName: internationalProfile.bankName ?? "",
              paypalEmail: internationalProfile.paypalEmail ?? "",
              usTaxResidentDeclaration: Boolean(internationalProfile.usTaxResidentDeclaration),
              nonIndianResidentDeclaration: Boolean(internationalProfile.nonIndianResidentDeclaration),
            });
            setKycStatus(internationalProfile.reviewStatus);
            setInternationalReviewReason(internationalProfile.reviewReason);
          } else {
            setInternationalDetails(emptyInternationalPayoutForm);
            setKycStatus("pending");
            setInternationalReviewReason(null);
          }
        } catch (internationalLoadError) {
          console.error("Could not load international payout details", internationalLoadError);
          setInternationalDetails(emptyInternationalPayoutForm);
          setKycStatus("pending");
          setInternationalReviewReason(null);
          toast.error("Could not load saved international payout details. Please retry.");
        }
      } else {
        setInternationalDetails(emptyInternationalPayoutForm);
        setInternationalReviewReason(null);
      }
      setCountryLoaded(true);

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
  }, [loadInternationalPayout, user?.id, user?.email]);

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
  const sportsRequirements = trackerRequirements(sportsIdentity);
  const requirements = nationalAwardApproved
    ? INTERNATIONAL_TRACKER_REQUIREMENTS
    : sportsRequirements;
  const payoutCurrency: PayoutCurrency = payoutCurrencyForCountry(country);
  const payoutMinimum = minimumPayout(payoutCurrency);
  const benefitTags = [
    sportsRequirements.badgeTag,
    nationalAwardApproved ? "National Awardee Benefit" : null,
  ].filter((tag): tag is string => Boolean(tag));
  const canApply = meetsMonetizationTargets(stats, requirements);
  const directSalesBalance =
    computeBreakdown({
    ads: 0,
    course: gross.course,
    vip: gross.vip,
    }).creatorShare + videoNet;
  const totalNetCreatorEarnings = round2(b.creatorShare + videoNet);
  const totalTds = round2(b.tds + videoNet * TDS_RATE);
  const totalNetPayout = round2(totalNetCreatorEarnings - totalTds);
  const directSalesUnlocked = cumulativeDirectSalesNet >= payoutMinimum;
  const previewMode = payoutPreviewRequested && adminAccess.status === "allowed";
  const formCountry = previewMode ? payoutPreviewCountry : country;
  const formCurrency = payoutCurrencyForCountry(formCountry);
  const showWallet = previewMode || eligible || canApply || directSalesUnlocked;

  const saveDetails = async () => {
    if (!user?.id) return;
    if (!termsAccepted) {
      toast.error("Accept the Creator Monetization Terms before saving payout details");
      return;
    }
    if (payoutCurrency === "USD") {
      const isUs = isUnitedStatesPayoutCountry(country);
      if (isUs && !internationalDetails.usTaxResidentDeclaration) {
        toast.error("Confirm the US tax-residency declaration before continuing");
        return;
      }
      if (!isUs && !internationalDetails.nonIndianResidentDeclaration) {
        toast.error("Confirm the non-Indian residency declaration before continuing");
        return;
      }
      setSaving(true);
      try {
        const result = await saveInternationalPayout({
          data: {
            legalName: internationalDetails.legalName,
            taxIdentifier: internationalDetails.taxIdentifier,
            payoutMethod: internationalDetails.payoutMethod,
            routingAba: internationalDetails.routingAba,
            accountNumber: internationalDetails.accountNumber,
            iban: internationalDetails.iban,
            swiftBic: internationalDetails.swiftBic,
            bankName: internationalDetails.bankName,
            paypalEmail: internationalDetails.paypalEmail,
            usTaxResidentDeclaration: internationalDetails.usTaxResidentDeclaration,
            nonIndianResidentDeclaration: internationalDetails.nonIndianResidentDeclaration,
          },
        });
        setKycStatus(result.reviewStatus);
        setInternationalReviewReason(null);
        toast.success(
          result.reviewStatus === "verified"
            ? "International payout details saved"
            : "Submitted for manual admin review before any payout",
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save payout details");
      } finally {
        setSaving(false);
      }
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
          payout_currency: payoutCurrency,
          bank_name: details.bank_name,
          swift_bic: details.swift_bic,
          bank_country: country,
          payout_schedule: "monthly_1_5" satisfies PayoutSchedule,
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
          payout_currency: payoutCurrency,
          bank_name: details.bank_name,
          swift_bic: details.swift_bic,
          bank_country: country,
          payout_schedule: "monthly_1_5" satisfies PayoutSchedule,
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
      setVideoNet(0);
      toast.success("Payout request submitted. It will be reviewed in the monthly 1–5 window.");
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
        {adminAccess.status === "allowed" ? (
          <button
            type="button"
            onClick={() => setPayoutPreviewRequested((open) => !open)}
            className="ml-auto rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1.5 text-[11px] font-semibold text-indigo-200"
          >
            {previewMode ? "Exit preview" : "Preview payout forms"}
          </button>
        ) : null}
      </header>

      <div className="space-y-4 p-4">
        {previewMode ? (
          <section className="rounded-2xl border border-indigo-400/30 bg-indigo-400/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-indigo-100">Read-only payout UI preview</p>
                <p className="pt-1 text-xs text-indigo-100/70">
                  No saved payout data is shown. Changes, submissions, and transfers are disabled.
                </p>
              </div>
              <label className="min-w-40">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-indigo-100/70">
                  Preview country
                </span>
                <Select value={payoutPreviewCountry} onValueChange={setPayoutPreviewCountry}>
                  <SelectTrigger
                    aria-label="Preview payout country"
                    className="h-[42px] w-full rounded-xl border-indigo-300/30 bg-[#0f0f13] px-3 py-2 text-sm text-white shadow-none focus:ring-0"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[200] border-white/10 bg-[#17171c] text-white shadow-xl">
                    <SelectItem value="India" className="cursor-pointer text-white focus:bg-indigo-500/20 focus:text-white">
                      India · INR
                    </SelectItem>
                    <SelectItem value="United States" className="cursor-pointer text-white focus:bg-indigo-500/20 focus:text-white">
                      United States · USD
                    </SelectItem>
                    <SelectItem value="United Kingdom" className="cursor-pointer text-white focus:bg-indigo-500/20 focus:text-white">
                      United Kingdom · USD
                    </SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </div>
          </section>
        ) : null}
        {!showWallet ? (
          <>
            <section className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-[#17171c] to-[#101014] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Monetization Eligibility Tracker
              </p>
              {benefitTags.map((tag) => (
                <p key={tag} className="pt-1 text-[11px] font-semibold text-indigo-300">
                  {tag}
                </p>
              ))}
              <p className="pt-2 text-sm text-zinc-300">
                Reach all three requirements to join: {requirements.followers.toLocaleString("en-IN")} followers,{" "}
                {requirements.watchHours.toLocaleString("en-IN")} watch hours, and{" "}
                {requirements.videoViews.toLocaleString("en-IN")} video views.
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
                Current sales balance: {formatPayoutAmount(directSalesBalance, payoutCurrency)}
              </p>
              <p className="pt-1.5 text-[11px] leading-relaxed text-zinc-500">
                Earn {formatPayoutAmount(payoutMinimum, payoutCurrency)} from courses/memberships to unlock withdrawal (Current:{" "}
                {formatPayoutAmount(directSalesBalance, payoutCurrency)} /{" "}
                {formatPayoutAmount(payoutMinimum, payoutCurrency)})
              </p>
            </section>
          </>
        ) : (
          <>
            {!previewMode && canApply && !eligible ? (
              <section className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4">
                <p className="text-sm font-semibold">Monetization threshold reached</p>
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
            <section className={`rounded-2xl border border-zinc-800 bg-gradient-to-br from-[#17171c] to-[#101014] p-5 ${previewMode ? "hidden" : ""}`}>
              <div className="flex items-center gap-2 text-zinc-400">
                <Wallet size={16} />
                <p className="text-[11px] font-semibold uppercase tracking-wide">
                  Total Earnings (Net Creator Share)
                </p>
              </div>
              <p className="pt-2 text-3xl font-extrabold">
                {formatPayoutAmount(totalNetCreatorEarnings, payoutCurrency)}
              </p>
              <p className="pt-1 text-[11px] text-zinc-500">
                Net creator earnings, before any payout-time TDS deduction.
              </p>
            </section>
            {/* Revenue breakdown */}
            <section className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${previewMode ? "hidden" : ""}`}>
              {[
                { label: "Ad & View Earnings", v: b.creatorBySource.ads },
                { label: "Course Earnings", v: b.creatorBySource.course },
                { label: "VIP Memberships", v: b.creatorBySource.vip },
                { label: "Paid Video Net", v: videoNet },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl border border-zinc-800 bg-[#141418] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    {c.label}
                  </p>
                  <p className="pt-1.5 text-sm font-bold">{formatPayoutAmount(c.v, payoutCurrency)}</p>
                </div>
              ))}
            </section>

            <section className={`rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4 ${previewMode ? "hidden" : ""}`}>
              <p className="text-sm font-semibold">Payout preview</p>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between gap-3 text-zinc-300">
                  <span>Requested amount</span>
                  <span className="font-semibold text-white">
                    {formatPayoutAmount(totalNetCreatorEarnings, payoutCurrency)}
                  </span>
                </div>
                <div className="flex justify-between gap-3 text-zinc-400">
                  <span>TDS under Section 194-O (1%)</span>
                  <span>- {formatPayoutAmount(totalTds, payoutCurrency)}</span>
                </div>
                <div className="flex justify-between gap-3 border-t border-indigo-300/20 pt-2 font-semibold text-white">
                  <span>Net payout to bank</span>
                  <span>{formatPayoutAmount(totalNetPayout, payoutCurrency)}</span>
                </div>
              </div>
            </section>

            {!previewMode ? (
              <MonetizationTermsCheckbox accepted={termsAccepted} onChange={setTermsAccepted} />
            ) : null}

            {/* Payout details */}
            <section className="rounded-2xl border border-zinc-800 bg-[#141418] p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold">
                  {previewMode ? "Payout Details Preview" : "Payout & Bank Details"}
                </h2>
                {previewMode ? (
                  <span className="rounded-full border border-indigo-400/30 bg-indigo-400/10 px-2.5 py-1 text-[10px] font-semibold text-indigo-200">
                    Preview only
                  </span>
                ) : (
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
                )}
              </div>
              <div className="grid gap-2.5 pt-3">
                {!countryLoaded ? (
                  <div className="rounded-xl border border-zinc-800 bg-[#0f0f13] px-3 py-3 text-sm text-zinc-400">
                    Loading payout country…
                  </div>
                ) : formCurrency === "INR" ? (
                  [
                    ["creator_email", "Creator Email ID", "you@gmail.com"],
                    ["upi_id", "UPI ID (optional)", "name@upi"],
                    ["bank_account", "Bank Account Number", "Account number"],
                    ["ifsc_code", "IFSC Code", "IFSC0000000"],
                    ["account_holder", "Account Holder Name", "Full name as per bank"],
                    ["pan_number", "PAN Card Number", "ABCDE1234F"],
                  ].map(([key, label, ph]) => (
                    <label key={key} className="block">
                      <span className="mb-1 block text-[11px] text-zinc-500">{label}</span>
                      <input
                        value={previewMode ? "" : details[key as keyof Details]}
                        readOnly={previewMode}
                        onChange={(e) =>
                          setDetails((d) => ({ ...d, [key as keyof Details]: e.target.value }))
                        }
                        placeholder={String(ph)}
                        className="w-full rounded-xl border border-zinc-800 bg-[#0f0f13] px-3 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
                      />
                    </label>
                  ))
                ) : (
                  <>
                    <p className="text-xs text-zinc-400">
                      International payouts are held for manual admin review and paid only in USD.
                    </p>
                    <label className="block">
                      <span className="mb-1 block text-[11px] text-zinc-500">
                        Full Legal Name {isUnitedStatesPayoutCountry(formCountry) ? "(as per government ID)" : "(as per Passport / National ID)"}
                      </span>
                      <input
                        autoComplete="name"
                        value={previewMode ? "" : internationalDetails.legalName}
                        readOnly={previewMode}
                        onChange={(e) =>
                          setInternationalDetails((d) => ({ ...d, legalName: e.target.value }))
                        }
                        placeholder="Full legal name"
                        className="w-full rounded-xl border border-zinc-800 bg-[#0f0f13] px-3 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] text-zinc-500">
                        {isUnitedStatesPayoutCountry(formCountry)
                          ? "Tax Identification Number: SSN / ITIN"
                          : "Tax ID / National ID Number (TIN / National ID / Passport No.)"}
                      </span>
                      <input
                        autoComplete="off"
                        value={previewMode ? "" : internationalDetails.taxIdentifier}
                        readOnly={previewMode}
                        onChange={(e) =>
                          setInternationalDetails((d) => ({ ...d, taxIdentifier: e.target.value }))
                        }
                        placeholder={
                          isUnitedStatesPayoutCountry(formCountry) ? "9-digit SSN or ITIN" : "Tax / National ID or Passport number"
                        }
                        className="w-full rounded-xl border border-zinc-800 bg-[#0f0f13] px-3 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] text-zinc-500">Payout Method</span>
                      <Select
                        value={internationalDetails.payoutMethod}
                        disabled={previewMode}
                        onValueChange={(value) =>
                          setInternationalDetails((d) => {
                            const payoutMethod = value === "paypal" ? "paypal" : "bank";
                            return payoutMethod === "paypal"
                              ? {
                                  ...d,
                                  payoutMethod,
                                  routingAba: "",
                                  accountNumber: "",
                                  iban: "",
                                  swiftBic: "",
                                  bankName: "",
                                }
                              : { ...d, payoutMethod, paypalEmail: "" };
                          })
                        }
                      >
                        <SelectTrigger
                          aria-label="Payout method"
                          className="h-[42px] w-full rounded-xl border-zinc-800 bg-[#0f0f13] px-3 py-2.5 text-sm text-white shadow-none focus:border-zinc-600 focus:ring-0"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[200] border-white/10 bg-[#17171c] text-white shadow-xl">
                          <SelectItem value="bank" className="cursor-pointer text-white focus:bg-indigo-500/20 focus:text-white">
                          {isUnitedStatesPayoutCountry(formCountry) ? "Direct Bank Transfer" : "International Bank"}
                          </SelectItem>
                          <SelectItem value="paypal" className="cursor-pointer text-white focus:bg-indigo-500/20 focus:text-white">
                            PayPal
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </label>
                    {internationalDetails.payoutMethod === "paypal" ? (
                      <label className="block">
                        <span className="mb-1 block text-[11px] text-zinc-500">PayPal Email</span>
                        <input
                          type="email"
                          autoComplete="email"
                          value={previewMode ? "" : internationalDetails.paypalEmail}
                          readOnly={previewMode}
                          onChange={(e) =>
                            setInternationalDetails((d) => ({ ...d, paypalEmail: e.target.value }))
                          }
                          placeholder="you@example.com"
                          className="w-full rounded-xl border border-zinc-800 bg-[#0f0f13] px-3 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
                        />
                        <span className="mt-1 block text-[10px] text-zinc-500">
                          Each PayPal email can be linked to one YourWorld account only.
                        </span>
                      </label>
                    ) : isUnitedStatesPayoutCountry(formCountry) ? (
                      <>
                        <label className="block">
                          <span className="mb-1 block text-[11px] text-zinc-500">Routing / ABA Number</span>
                          <input
                            inputMode="numeric"
                            autoComplete="off"
                            value={previewMode ? "" : internationalDetails.routingAba}
                            readOnly={previewMode}
                            onChange={(e) =>
                              setInternationalDetails((d) => ({ ...d, routingAba: e.target.value }))
                            }
                            placeholder="9-digit routing number"
                            className="w-full rounded-xl border border-zinc-800 bg-[#0f0f13] px-3 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[11px] text-zinc-500">Account Number</span>
                          <input
                            inputMode="numeric"
                            autoComplete="off"
                            value={previewMode ? "" : internationalDetails.accountNumber}
                            readOnly={previewMode}
                            onChange={(e) =>
                              setInternationalDetails((d) => ({ ...d, accountNumber: e.target.value }))
                            }
                            placeholder="Bank account number"
                            className="w-full rounded-xl border border-zinc-800 bg-[#0f0f13] px-3 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
                          />
                        </label>
                      </>
                    ) : (
                      <>
                        <label className="block">
                          <span className="mb-1 block text-[11px] text-zinc-500">IBAN</span>
                          <input
                            autoComplete="off"
                            value={previewMode ? "" : internationalDetails.iban}
                            readOnly={previewMode}
                            onChange={(e) =>
                              setInternationalDetails((d) => ({ ...d, iban: e.target.value }))
                            }
                            placeholder="International Bank Account Number"
                            className="w-full rounded-xl border border-zinc-800 bg-[#0f0f13] px-3 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[11px] text-zinc-500">SWIFT / BIC Code</span>
                          <input
                            autoComplete="off"
                            value={previewMode ? "" : internationalDetails.swiftBic}
                            readOnly={previewMode}
                            onChange={(e) =>
                              setInternationalDetails((d) => ({ ...d, swiftBic: e.target.value }))
                            }
                            placeholder="8 or 11 characters"
                            className="w-full rounded-xl border border-zinc-800 bg-[#0f0f13] px-3 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[11px] text-zinc-500">Bank Name</span>
                          <input
                            autoComplete="organization"
                            value={previewMode ? "" : internationalDetails.bankName}
                            readOnly={previewMode}
                            onChange={(e) =>
                              setInternationalDetails((d) => ({ ...d, bankName: e.target.value }))
                            }
                            placeholder="Bank name"
                            className="w-full rounded-xl border border-zinc-800 bg-[#0f0f13] px-3 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
                          />
                        </label>
                      </>
                    )}
                    <label className="flex items-start gap-2.5 rounded-xl border border-zinc-800 bg-[#0f0f13] p-3 text-xs leading-5 text-zinc-300">
                      <input
                        type="checkbox"
                        checked={!previewMode && (
                          isUnitedStatesPayoutCountry(formCountry)
                            ? internationalDetails.usTaxResidentDeclaration
                            : internationalDetails.nonIndianResidentDeclaration
                        )}
                        disabled={previewMode}
                        onChange={(e) =>
                          setInternationalDetails((d) =>
                            isUnitedStatesPayoutCountry(formCountry)
                              ? { ...d, usTaxResidentDeclaration: e.target.checked }
                              : { ...d, nonIndianResidentDeclaration: e.target.checked },
                          )
                        }
                        className="mt-1 accent-fuchsia-500"
                      />
                      <span>
                        {isUnitedStatesPayoutCountry(formCountry)
                          ? "I certify under penalty of perjury that I am a US tax resident and these details belong to me."
                          : "I confirm that I am a non-Indian resident, these banking/tax details legally belong to me, and all earnings are subject to local tax laws."}
                      </span>
                    </label>
                    {!previewMode && kycStatus === "rejected" ? (
                      <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                        Review issue: {internationalReviewReason || "Update your payout details and resubmit for admin review."}
                      </p>
                    ) : null}
                  </>
                )}
                <label className="block">
                  <span className="mb-1 block text-[11px] text-zinc-500">Payout Currency</span>
                  <div className="rounded-xl border border-zinc-800 bg-[#0f0f13] px-3 py-2.5 text-sm">
                    {countryLoaded ? `${formCurrency} · ${previewMode ? "Preview country" : "Based on your saved country"}` : "Loading country…"}
                  </div>
                  {formCurrency === "USD" ? (
                    <p className="pt-1 text-[10px] text-zinc-500">Bank country: {formCountry || "Not set"}</p>
                  ) : null}
                </label>
                {previewMode ? (
                  <div className="rounded-xl border border-zinc-800 bg-[#0f0f13] px-3 py-2.5 text-sm">
                    <span className="block text-[11px] text-zinc-500">Minimum withdrawal</span>
                    <span>{formatPayoutAmount(minimumPayout(formCurrency), formCurrency)}</span>
                  </div>
                ) : null}
                <div className="rounded-xl border border-zinc-800 bg-[#0f0f13] px-3 py-2.5">
                  <span className="block text-[11px] text-zinc-500">Monthly Payout Window</span>
                  <span className="text-sm">Every month, from the 1st through the 5th</span>
                </div>
              </div>
              {previewMode ? (
                <div className="mt-3 w-full rounded-full bg-white/10 py-2.5 text-center text-sm font-semibold text-zinc-400">
                  Preview only · saving disabled
                </div>
              ) : (
                <button
                  onClick={saveDetails}
                  disabled={saving || !termsAccepted || !countryLoaded}
                  className="mt-3 w-full rounded-full bg-white py-2.5 text-sm font-semibold text-black disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save Details"}
                </button>
              )}
            </section>

            {/* Withdraw */}
            <div className={previewMode ? "hidden" : ""}>
              <button
                onClick={withdraw}
                disabled={
                  processing ||
                  totalNetCreatorEarnings < payoutMinimum ||
                  kycStatus !== "verified" ||
                  !termsAccepted
                }
                className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 py-3 text-sm font-semibold disabled:opacity-50"
              >
                {processing ? <Loader2 className="animate-spin" size={16} /> : <Coins size={16} />}
                {processing
                  ? "Submitting payout request…"
                  : `Request Payout (Net ${formatPayoutAmount(totalNetPayout, payoutCurrency)})`}
              </button>
              <p className="pt-2 text-center text-[11px] text-zinc-500">
                {!termsAccepted
                  ? "Accept the Creator Monetization Terms before requesting a payout"
                  : kycStatus !== "verified"
                  ? "KYC verification is required before requesting a payout"
                  : totalNetCreatorEarnings < payoutMinimum
                  ? `Minimum available balance for payout is ${formatPayoutAmount(payoutMinimum, payoutCurrency)}`
                  : "Manual payout review; transfers are processed in the monthly 1–5 window."}
              </p>
            </div>

            {/* History */}
            <section className={`rounded-2xl border border-zinc-800 bg-[#141418] p-4 ${previewMode ? "hidden" : ""}`}>
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
                        <p className="truncate text-sm font-semibold">
                          {formatPayoutAmount(Number(p.amount), p.currency ?? "INR")}
                        </p>
                        <p className="pt-0.5 text-[11px] text-zinc-400">
                          {p.schedule_type === "monthly_1_5"
                            ? `Monthly 1–5 · ${p.currency ?? "INR"}`
                            : `Historical payout schedule · ${p.currency ?? "INR"}`}
                        </p>
                        {p.payout_window_start ? (
                          <p className="text-[10px] text-zinc-500">
                            Window starts{" "}
                            {new Date(`${p.payout_window_start}T00:00:00`).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        ) : null}
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
