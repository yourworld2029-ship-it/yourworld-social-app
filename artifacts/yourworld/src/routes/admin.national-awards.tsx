import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Clock3, FileText, RefreshCw, ShieldAlert, Video, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NATIONAL_AWARD_OPTIONS } from "@/lib/national-award";
import {
  listNationalAwardVerificationApplications,
  reviewNationalAwardVerification,
} from "@/lib/national-award.functions";

export const Route = createFileRoute("/admin/national-awards")({
  head: () => ({
    meta: [
      { title: "National Award Verification — YourWorld" },
      {
        name: "description",
        content: "Review private National Award Verification submissions.",
      },
    ],
  }),
  component: NationalAwardVerificationAdminPage,
});

type Application = Awaited<
  ReturnType<typeof listNationalAwardVerificationApplications>
>["applications"][number];

function NationalAwardVerificationAdminPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listNationalAwardVerificationApplications();
      setApplications(result.applications);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Could not load Award Verification requests.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (application: Application, action: "approve" | "reject") => {
    const reason = reasons[application.userId]?.trim() ?? "";
    if (action === "reject" && !reason) {
      toast.error("Add a reason before rejecting this request.");
      return;
    }

    setBusyUserId(application.userId);
    try {
      await reviewNationalAwardVerification({
        data: {
          applicantUserId: application.userId,
          action,
          reason: action === "reject" ? reason : null,
        },
      });
      toast.success(
        action === "approve"
          ? "National Award Verification approved."
          : "National Award Verification rejected.",
      );
      setApplications((current) =>
        current.filter((item) => item.userId !== application.userId),
      );
      setReasons((current) => {
        const next = { ...current };
        delete next[application.userId];
        return next;
      });
      await load();
    } catch (reviewError) {
      toast.error(
        reviewError instanceof Error
          ? reviewError.message
          : "Could not review this Award Verification request.",
      );
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#09090b] p-4 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 mt-2 flex flex-wrap items-center gap-3">
          <Link
            to="/admin"
            data-testid="link-award-verification-admin"
            aria-label="Back to Admin"
            className="p-1 text-zinc-300 hover:text-white"
          >
            <ArrowLeft size={22} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 data-testid="text-award-verification-title" className="text-xl font-bold">
              Award Verification Requests
            </h1>
            <p className="text-sm text-zinc-500">
              Private award evidence is available only to admins with two-step verification.
            </p>
          </div>
          <Button
            type="button"
            data-testid="button-refresh-award-requests"
            variant="outline"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-xl border-white/10 text-zinc-200 hover:bg-white/[0.06]"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </header>

        <nav
          aria-label="Admin verification sections"
          className="mb-5 flex flex-wrap gap-2"
        >
          <Link
            to="/admin/sports-verification"
            data-testid="tab-sports-verification"
            className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-400 hover:bg-white/[0.06] hover:text-white"
          >
            Sports Verification
          </Link>
          <span
            data-testid="tab-national-award-verification"
            aria-current="page"
            className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100"
          >
            Award Verification Requests
          </span>
        </nav>

        {error ? (
          <div
            data-testid="status-award-verification-error"
            role="alert"
            className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"
          >
            <p className="flex items-center gap-2 font-semibold">
              <ShieldAlert className="h-4 w-4" />
              Unable to load Award Verification
            </p>
            <p className="mt-1">{error}</p>
          </div>
        ) : null}

        {loading && applications.length === 0 ? (
          <div
            data-testid="status-award-verification-loading"
            className="space-y-3"
          >
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]"
              />
            ))}
          </div>
        ) : null}

        {!loading && !error && applications.length === 0 ? (
          <div
            data-testid="status-award-verification-empty"
            className="rounded-2xl border border-white/10 bg-white/[0.025] p-8 text-center"
          >
            <Check className="mx-auto h-8 w-8 text-emerald-300" />
            <p className="mt-3 text-sm font-semibold text-zinc-200">
              No pending Award Verification requests
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              New submissions will appear here for review.
            </p>
          </div>
        ) : null}

        <div className="space-y-4">
          {applications.map((application) => {
            const awardLabel =
              NATIONAL_AWARD_OPTIONS.find(
                (option) => option.value === application.awardCode,
              )?.label ?? "National Award";
            const busy = busyUserId === application.userId;

            return (
              <article
                key={application.userId}
                data-testid={`card-award-request-${application.userId}`}
                className="rounded-2xl border border-white/10 bg-[#101012] p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2
                        data-testid={`text-award-applicant-${application.userId}`}
                        className="text-base font-bold text-white"
                      >
                        {application.fullName}
                      </h2>
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/25 bg-amber-200/[0.08] px-2.5 py-1 text-[10px] font-bold text-amber-100">
                        <Clock3 className="h-3 w-3" />
                        Pending verification
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-400">
                      {awardLabel} · {application.awardYear}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Submitted {new Date(application.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-x-6 gap-y-3 border-y border-white/8 py-4 text-sm sm:grid-cols-2">
                  <Detail label="Father's Name" value={application.fatherName} />
                  <Detail label="Date of Birth" value={application.dateOfBirth} />
                  <Detail label="Phone Number" value={application.phoneNumber} />
                  <Detail label="Email" value={application.email} />
                  <Detail
                    label="Address"
                    value={`${application.villageTown}, ${application.district}, ${application.state}, India`}
                  />
                  <Detail label="Award Year" value={String(application.awardYear)} />
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <EvidenceLink
                    testId={`link-award-certificate-${application.userId}`}
                    icon={<FileText className="h-4 w-4" />}
                    label="View certificate / gazette"
                    fileName={application.certificateName}
                    url={application.certificateUrl}
                  />
                  <EvidenceLink
                    testId={`link-award-introduction-${application.userId}`}
                    icon={<Video className="h-4 w-4" />}
                    label="View award introduction video"
                    fileName={application.introductionName}
                    url={application.introductionUrl}
                  />
                </div>

                <div className="mt-4">
                  <label
                    htmlFor={`award-reason-${application.userId}`}
                    className="mb-1.5 block text-xs font-medium text-zinc-400"
                  >
                    Rejection reason (required to reject)
                  </label>
                  <Textarea
                    id={`award-reason-${application.userId}`}
                    data-testid={`input-award-rejection-reason-${application.userId}`}
                    value={reasons[application.userId] ?? ""}
                    onChange={(event) =>
                      setReasons((current) => ({
                        ...current,
                        [application.userId]: event.target.value,
                      }))
                    }
                    maxLength={1000}
                    rows={2}
                    placeholder="Explain what needs to be corrected"
                    className="resize-y border-white/10 bg-black text-sm text-white placeholder:text-zinc-600"
                  />
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    data-testid={`button-reject-award-${application.userId}`}
                    variant="outline"
                    onClick={() => void review(application, "reject")}
                    disabled={busy || loading}
                    className="rounded-xl border-rose-300/25 text-rose-200 hover:bg-rose-400/10"
                  >
                    <X className="mr-2 h-4 w-4" />
                    {busy ? "Saving…" : "Reject"}
                  </Button>
                  <Button
                    type="button"
                    data-testid={`button-approve-award-${application.userId}`}
                    onClick={() => void review(application, "approve")}
                    disabled={busy || loading}
                    className="rounded-xl bg-amber-300 font-bold text-black hover:bg-amber-200"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {busy ? "Saving…" : "Approve"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </p>
      <p className="mt-0.5 break-words text-sm text-zinc-200">{value}</p>
    </div>
  );
}

function EvidenceLink({
  testId,
  icon,
  label,
  fileName,
  url,
}: {
  testId: string;
  icon: ReactNode;
  label: string;
  fileName: string;
  url: string;
}) {
  return (
    <a
      data-testid={testId}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3 hover:bg-white/[0.05]"
    >
      <span className="text-amber-200">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-zinc-200">{label}</span>
        <span className="mt-0.5 block truncate text-[10px] text-zinc-500">{fileName}</span>
      </span>
    </a>
  );
}