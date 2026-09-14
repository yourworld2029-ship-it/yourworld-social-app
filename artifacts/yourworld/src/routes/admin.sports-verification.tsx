import { useCallback, useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  FileText,
  Globe2,
  ShieldAlert,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getSportsProfile, type SportsProfileInfo } from "@/components/yw/SportsProfile";
import { useAuth } from "@/lib/auth-store";
import { resolveMediaUrl } from "@/lib/social-data";
import { supabase } from "@/integrations/supabase/client";
import { STORAGE_BUCKETS } from "@/lib/storage-upload";

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

type ReviewProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  category: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  verification_requested: boolean | null;
  updated_at: string | null;
};

type ReviewDocument = {
  path: string;
  name: string;
  mimeType: string;
  size: number | null;
  url: string | null;
};

type SportsVerificationApplication = {
  profile: ReviewProfile;
  sportsProfile: SportsProfileInfo;
  avatarUrl: string | null;
  sportsIntroductionUrl: string | null;
  documents: ReviewDocument[];
};

function AdminSportsVerification() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [applications, setApplications] = useState<SportsVerificationApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");
      if (!alive) return;
      if (roleError) {
        setIsAdmin(false);
        return;
      }
      setIsAdmin(Boolean(data?.length));
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("verification_requested", true)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as unknown as ReviewProfile[];
    const pendingSportsProfiles = rows
      .map((profile) => ({ profile, sportsProfile: toSportsProfile(profile) }))
      .filter((entry): entry is { profile: ReviewProfile; sportsProfile: SportsProfileInfo } =>
        Boolean(entry.sportsProfile),
      );

    const next = await Promise.all(
      pendingSportsProfiles.map(async ({ profile, sportsProfile }) => {
        const [avatarUrl, sportsIntroductionUrl, documents] = await Promise.all([
          profile.avatar_url ? resolveMediaUrl(profile.avatar_url, STORAGE_BUCKETS.avatars) : null,
          sportsProfile.sportsIntroductionPath
            ? resolveMediaUrl(sportsProfile.sportsIntroductionPath, STORAGE_BUCKETS.videos)
            : null,
          loadDocuments(profile.id),
        ]);
        return { profile, sportsProfile, avatarUrl, sportsIntroductionUrl, documents };
      }),
    );
    setApplications(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  const updateApplication = async (
    application: SportsVerificationApplication,
    decision: "approve" | "reject",
  ) => {
    setBusy(application.profile.id);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        is_verified: decision === "approve",
        verification_requested: false,
      })
      .eq("id", application.profile.id);
    setBusy(null);
    if (updateError) {
      toast.error(updateError.message);
      return;
    }
    setApplications((current) =>
      current.filter((entry) => entry.profile.id !== application.profile.id),
    );
    toast.success(decision === "approve" ? "Sports Profile verified" : "Verification rejected");
  };

  if (isAdmin === null) {
    return <div className="min-h-screen bg-[#09090b] p-6 text-sm text-zinc-400">Loading…</div>;
  }

  if (!isAdmin) {
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
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/profile" })}
            className="p-1 text-zinc-300 hover:text-white"
            aria-label="Back to profile"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Sports Verification</h1>
            <p className="text-sm text-zinc-500">Review submitted Sports Profiles.</p>
          </div>
        </div>

        {loading ? <p className="text-sm text-zinc-400">Loading applications…</p> : null}
        {error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
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
              onApprove={() => void updateApplication(application, "approve")}
              onReject={() => void updateApplication(application, "reject")}
              onKeepPending={() => toast.success("Application remains pending")}
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
  onApprove,
  onReject,
  onKeepPending,
}: {
  application: SportsVerificationApplication;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onKeepPending: () => void;
}) {
  const { profile, sportsProfile } = application;
  const title =
    sportsProfile.status === "Not recorded"
      ? `${sportsProfile.role}`
      : `${sportsProfile.status.toUpperCase()} ${sportsProfile.role.toUpperCase()}`;
  const qualification = [sportsProfile.coachQualification, sportsProfile.qualificationYear]
    .filter((value) => value !== "Not recorded")
    .join(" · ");

  return (
    <article className="rounded-3xl border border-amber-200/20 bg-[#141418] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.2)]">
      <div className="flex items-start gap-3">
        {application.avatarUrl ? (
          <img
            src={application.avatarUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-amber-200/30"
          />
        ) : (
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-amber-200/10 text-amber-100">
            <UserRound className="h-6 w-6" />
          </div>
        )}
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
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <ReviewValue icon={<Trophy />} label="Sport" value={sportsProfile.sport} />
        <ReviewValue icon={<UserRound />} label="Role" value={sportsProfile.role} />
        <ReviewValue
          icon={<Globe2 />}
          label="Representation"
          value={sportsProfile.represents}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ReviewSection title="Qualification">
          <p>{qualification || "Not recorded"}</p>
          {sportsProfile.institution !== "Not recorded" ? (
            <p className="mt-1">Institution: {sportsProfile.institution}</p>
          ) : null}
          {sportsProfile.coachingExperience !== "Not recorded" ? (
            <p className="mt-1 whitespace-pre-wrap">
              Experience: {sportsProfile.coachingExperience}
            </p>
          ) : null}
        </ReviewSection>
        <ReviewSection title="Achievements">
          <ReviewList items={sportsProfile.achievements} empty="No achievements submitted." />
        </ReviewSection>
        <ReviewSection title="Tournament details">
          <ReviewList items={sportsProfile.tournaments} empty="No tournament details submitted." />
        </ReviewSection>
        <ReviewSection title="Medals">
          <ReviewList items={sportsProfile.medals} empty="No medals submitted." />
        </ReviewSection>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ReviewSection title="Sports Introduction">
          {application.sportsIntroductionUrl ? (
            <video
              src={application.sportsIntroductionUrl}
              controls
              playsInline
              preload="metadata"
              className="aspect-[9/16] max-h-80 w-full rounded-xl bg-black object-contain"
            />
          ) : (
            <p>No Sports Introduction submitted.</p>
          )}
        </ReviewSection>
        <ReviewSection title="Verification documents">
          {application.documents.length ? (
            <div className="space-y-2">
              {application.documents.map((document) => (
                <a
                  key={document.path}
                  href={document.url ?? undefined}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={`flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] p-2 ${
                    document.url ? "text-amber-100 hover:bg-white/[0.08]" : "text-zinc-500"
                  }`}
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 truncate">{document.name}</span>
                </a>
              ))}
            </div>
          ) : (
            <p>No verification documents submitted.</p>
          )}
        </ReviewSection>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50"
        >
          <Check size={16} /> Approve / Verify
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-500/25 disabled:opacity-50"
        >
          <X size={16} /> Reject
        </button>
        <button
          type="button"
          onClick={onKeepPending}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl border border-amber-200/20 px-4 py-2.5 text-sm font-semibold text-amber-100 hover:bg-amber-200/10 disabled:opacity-50"
        >
          Keep Pending
        </button>
      </div>
    </article>
  );
}

function ReviewValue({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
        <span className="h-3.5 w-3.5">{icon}</span>
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
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

function toSportsProfile(profile: ReviewProfile) {
  return getSportsProfile({
    is_verified: profile.is_verified === true,
    category: profile.category ?? "",
    bio: profile.bio ?? "",
    location: profile.location ?? "",
    username: profile.username ?? undefined,
    displayName: profile.display_name ?? undefined,
    verification_requested: profile.verification_requested === true,
  });
}

async function loadDocuments(ownerId: string): Promise<ReviewDocument[]> {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKETS.documents).list(ownerId, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) return [];

  return await Promise.all(
    (data ?? [])
      .filter((file) => Boolean(file.id && file.name))
      .map(async (file) => {
        const path = `${ownerId}/${file.name}`;
        const { data: signed } = await supabase.storage
          .from(STORAGE_BUCKETS.documents)
          .createSignedUrl(path, 60 * 60);
        return {
          path,
          name: file.name,
          mimeType: file.metadata?.mimetype ?? "application/octet-stream",
          size: typeof file.metadata?.size === "number" ? file.metadata.size : null,
          url: signed?.signedUrl ?? null,
        };
      }),
  );
}