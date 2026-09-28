import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Clock3,
  FileText,
  Globe2,
  ShieldAlert,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getSportsProfile, type SportsProfileInfo } from "@/components/yw/SportsProfile";
import { historyBackOr } from "@/lib/navigation";
import {
  listSportsVerificationApplications,
  reviewSportsVerification,
  type AdminVerificationApplication,
} from "@/lib/sports-verification.functions";

export const Route = createFileRoute("/admin/sports-verification")({
  head: () => ({
    meta: [
      { title: "Sports Verification Admin — YourWorld" },
      {
        name: "description",
        content: "Review submitted YourWorld Sports Verification applications.",
      },
    ],
  }),
  component: AdminSportsVerification,
});

type ReviewApplication = AdminVerificationApplication & {
  sportsProfile: SportsProfileInfo | null;
};

function AdminSportsVerification() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [applications, setApplications] = useState<ReviewApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listSportsVerificationApplications();
      setAuthorized(true);
      setApplications(
        result.applications.map((application) => ({
          ...application,
          sportsProfile: toSportsProfile(application),
        })),
      );
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Could not load review requests.";
      if (message.toLowerCase().includes("forbidden") || message.toLowerCase().includes("admin access")) {
        setAuthorized(false);
        setError(null);
      } else {
        setAuthorized(true);
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateApplication = async (
    application: ReviewApplication,
    action: "approve" | "reject" | "request_correction",
    reason?: string,
  ) => {
    setBusy(application.profile.id);
    try {
      await reviewSportsVerification({
        data: {
          applicantUserId: application.profile.id,
          action,
          reason: reason?.trim() || undefined,
        },
      });
      setApplications((current) =>
        current.filter((entry) => entry.profile.id !== application.profile.id),
      );
      toast.success(
        action === "approve"
          ? "Sports Verification approved"
          : action === "reject"
            ? "Sports Verification rejected"
            : "Correction request sent",
      );
    } catch (reviewError) {
      toast.error(reviewError instanceof Error ? reviewError.message : "Could not save the review decision.");
    } finally {
      setBusy(null);
    }
  };

  if (loading && authorized === null) {
    return <div className="min-h-screen bg-[#09090b] p-6 text-sm text-zinc-400">Checking admin access…</div>;
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-[#09090b] p-6 text-white">
        <div className="mx-auto max-w-md rounded-2xl border border-zinc-800 bg-[#141418] p-6 text-center">
          <ShieldAlert className="mx-auto mb-3 text-red-500" size={28} />
          <h1 className="text-lg font-bold">Admins only</h1>
          <p className="mt-1 text-sm text-zinc-400">
            You do not have access to Sports Verification review.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] p-4 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => historyBackOr(() => void navigate({ to: "/profile" }))}
            className="p-1 text-zinc-300 hover:text-white"
            aria-label="Back to profile"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">Sports Verification Review</h1>
            <p className="text-sm text-zinc-500">
              Pending applications require a manual decision within 72 hours.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.06] disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <nav
          aria-label="Admin verification sections"
          className="mb-5 flex flex-wrap gap-2"
        >
          <span
            data-testid="tab-sports-verification"
            aria-current="page"
            className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100"
          >
            Sports Verification
          </span>
          <Link
            to="/admin/national-awards"
            data-testid="tab-national-award-verification"
            className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-400 hover:bg-white/[0.06] hover:text-white"
          >
            Award Verification Requests
          </Link>
        </nav>

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        {!loading && !error && applications.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-[#141418] p-6 text-sm text-zinc-400">
            No pending Sports Verification applications.
          </div>
        ) : null}

        <div className="space-y-5">
          {applications.map((application) => (
            <ApplicationCard
              key={application.profile.id}
              application={application}
              busy={busy === application.profile.id}
              onReview={(action, reason) => void updateApplication(application, action, reason)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function ApplicationCard({
  application,
  busy,
  onReview,
}: {
  application: ReviewApplication;
  busy: boolean;
  onReview: (action: "approve" | "reject" | "request_correction", reason?: string) => void;
}) {
  const [reason, setReason] = useState("");
  const { profile, details } = application;
  const sportsProfile = application.sportsProfile;
  const title = sportsProfile
    ? `${sportsProfile.status === "Not recorded" ? "" : `${sportsProfile.status} `}${sportsProfile.role}`
    : "Sports profile";
  const qualification = sportsProfile
    ? [sportsProfile.coachQualification, sportsProfile.qualificationYear]
        .filter((value) => value !== "Not recorded")
        .join(" · ")
    : "";
  const reviewNeedsReason = reason.trim().length === 0;

  return (
    <article className="rounded-3xl border border-amber-200/20 bg-[#141418] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.2)]">
      <div className="flex items-start gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-amber-200/10 text-amber-100">
          <UserRound className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold">
            {profile.display_name || profile.username || "Unnamed applicant"}
          </p>
          <p className="text-xs text-zinc-500">@{profile.username || "—"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/30 bg-amber-200/10 px-2.5 py-1 text-[10px] font-bold text-amber-100">
              <BadgeCheck className="h-3.5 w-3.5" />
              {title}
            </span>
            <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold text-amber-200">
              Pending
            </span>
            {application.overdue ? (
              <span className="rounded-full bg-red-400/10 px-2.5 py-1 text-[10px] font-semibold text-red-200">
                72-hour deadline passed
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <ReviewValue icon={<Trophy />} label="Sport" value={sportsProfile?.sport ?? "Not recorded"} />
        <ReviewValue icon={<UserRound />} label="Role" value={sportsProfile?.role ?? "Not recorded"} />
        <ReviewValue
          icon={<Globe2 />}
          label="Representation"
          value={sportsProfile?.represents ?? "Not recorded"}
        />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <ReviewValue label="Full Name" value={details.fullName || "—"} />
        <ReviewValue label="Father's Name" value={details.fatherName || "—"} />
        <ReviewValue label="Date of Birth" value={details.dateOfBirth || "—"} />
        <ReviewValue label="Certificate Number" value={details.certificateNumber || "—"} />
        {details.passportNumber ? (
          <ReviewValue label="Passport Number" value={details.passportNumber} />
        ) : null}
        <ReviewValue label="Address" value={details.address || "—"} />
        <ReviewValue label="Village / Town" value={details.villageTown || "—"} />
        <ReviewValue label="District" value={details.district || "—"} />
        <ReviewValue label="State" value={details.state || "—"} />
        <ReviewValue label="Country" value={details.country || "—"} />
        <ReviewValue label="Account email" value={application.accountEmail || details.email || "—"} />
        <ReviewValue label="Mobile number" value={application.accountMobile || details.mobileNumber || "—"} />
        <ReviewValue
          icon={<Clock3 />}
          label="Submitted"
          value={formatDate(application.submittedAt)}
        />
        <ReviewValue
          icon={<Clock3 />}
          label="Review deadline"
          value={formatDate(application.deadlineAt)}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ReviewSection title="Qualification">
          <p>{qualification || "Not recorded"}</p>
          {sportsProfile?.institution !== "Not recorded" ? (
            <p className="mt-1">Institution: {sportsProfile?.institution}</p>
          ) : null}
        </ReviewSection>
        <ReviewSection title="Achievements">
          <ReviewList items={sportsProfile?.achievements ?? []} empty="No achievements submitted." />
        </ReviewSection>
        <ReviewSection title="Tournament details">
          <ReviewList items={sportsProfile?.tournaments ?? []} empty="No tournament details submitted." />
        </ReviewSection>
        <ReviewSection title="Medals">
          <ReviewList items={sportsProfile?.medals ?? []} empty="No medals submitted." />
        </ReviewSection>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ReviewSection title="Sports Introduction">
          {application.sportsIntroductionUrl ? (
            <video
              src={application.sportsIntroductionUrl}
              controls
              playsInline
              preload="none"
              className="aspect-[9/16] max-h-80 w-full rounded-xl bg-black object-contain"
            />
          ) : (
            <p>No Sports Introduction submitted.</p>
          )}
        </ReviewSection>
        <ReviewSection title="Private verification documents">
          <div className="space-y-2">
            {application.documents.map((document) => (
              <a
                key={document.kind}
                href={document.url ?? undefined}
                target="_blank"
                rel="noreferrer noopener"
                className={`flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] p-2 ${
                  document.url ? "text-amber-100 hover:bg-white/[0.08]" : "text-zinc-500"
                }`}
                aria-disabled={!document.url}
              >
                {document.kind === "tournamentPhoto" ? (
                  <FileText className="h-4 w-4 shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 shrink-0" />
                )}
                <span className="min-w-0 truncate">
                  {document.url ? document.name : `${document.kind} not submitted`}
                </span>
              </a>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-zinc-500">
            Links are temporary private review URLs and are never included in user-facing or support email content.
          </p>
        </ReviewSection>
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Rejection / correction reason
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Required for Reject or Request Correction"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-amber-200/50"
          />
        </label>
        {application.reviewReason ? (
          <p className="mt-2 text-xs text-zinc-500">Previous note: {application.reviewReason}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onReview("approve")}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50"
          >
            <Check size={16} /> Approve
          </button>
          <button
            type="button"
            onClick={() => onReview("request_correction", reason)}
            disabled={busy || reviewNeedsReason}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200/20 px-4 py-2.5 text-sm font-semibold text-amber-100 hover:bg-amber-200/10 disabled:opacity-50"
          >
            <FileText size={16} /> Request Correction
          </button>
          <button
            type="button"
            onClick={() => onReview("reject", reason)}
            disabled={busy || reviewNeedsReason}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-500/25 disabled:opacity-50"
          >
            <X size={16} /> Reject
          </button>
        </div>
      </div>
    </article>
  );
}

function toSportsProfile(application: AdminVerificationApplication) {
  return getSportsProfile({
    is_verified: application.profile.is_verified === true,
    category: application.profile.category ?? "",
    bio: application.profile.bio ?? "",
    location: application.details.villageTown,
    username: application.profile.username ?? undefined,
    displayName: application.profile.display_name ?? undefined,
    verification_requested: true,
  });
}

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString();
}

function ReviewValue({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
        {icon ? <span className="h-3.5 w-3.5">{icon}</span> : null}
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm text-zinc-300">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-200/80">{title}</h2>
      {children}
    </section>
  );
}

function ReviewList({ items, empty }: { items: string[]; empty: string }) {
  return items.length ? (
    <ul className="list-disc space-y-1 pl-4">
      {items.map((item) => (
        <li key={item} className="whitespace-pre-wrap">
          {item}
        </li>
      ))}
    </ul>
  ) : (
    <p>{empty}</p>
  );
}