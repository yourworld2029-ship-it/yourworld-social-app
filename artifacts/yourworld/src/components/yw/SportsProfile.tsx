import type React from "react";
import {
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Globe2,
  Medal,
  ShieldCheck,
  Trophy,
  Upload,
  UserRound,
} from "lucide-react";
import type { SportsDocument } from "@/lib/profile-data";

export type SportsProfileInfo = {
  badge: string;
  role: "Athlete" | "Coach";
  sport: string;
  eventPosition: string;
  status: "International" | "National" | "Not recorded";
  sportsId: string | null;
  represents: string;
  verified: boolean;
  publicDetails: string;
  tournaments: string[];
  medals: string[];
  achievements: string[];
  coachQualification: string;
};

export function getSportsProfile(profile: {
  is_verified: boolean;
  category: string;
  bio: string;
  location: string;
}): SportsProfileInfo | null {
  const category = profile.category.trim();
  const roleMatch = /^(athlete|coach)(?:\s*[-·•|:]|$)/i.exec(category);
  if (!roleMatch) return null;

  const role = roleMatch[1].toLowerCase() === "coach" ? "Coach" : "Athlete";
  const source = `${category} ${profile.bio}`.toLowerCase();
  const status = source.includes("international")
    ? "International"
    : source.includes("national")
      ? "National"
      : "Not recorded";
  const verified = profile.is_verified === true;
  const badge =
    role === "Coach"
      ? verified
        ? "🏆 VERIFIED COACH"
        : "COACH PROFILE"
      : verified
        ? status === "International"
          ? "🌍 INTERNATIONAL PLAYER"
          : status === "National"
            ? "🇮🇳 NATIONAL PLAYER"
            : "✅ VERIFIED ATHLETE"
        : "ATHLETE PROFILE";

  return {
    badge,
    role,
    sport: inferSport(category, profile.bio),
    eventPosition:
      extractLabeledValue(profile.bio, ["event", "event/position", "position", "specialty"]) ||
      "Not recorded",
    status,
    sportsId: extractLabeledValue(profile.bio, ["sports id", "sportsid"]),
    represents: profile.location.trim() || "Not specified",
    verified,
    publicDetails: profile.bio.trim(),
    tournaments: extractRelevantLines(profile.bio, /tournament|league|championship|cup|games|meet/i),
    medals: extractRelevantLines(profile.bio, /medal|gold|silver|bronze/i),
    achievements: extractRelevantLines(profile.bio, /achievement|award|champion|record|trophy/i),
    coachQualification:
      extractLabeledValue(profile.bio, [
        "qualification",
        "qualifications",
        "license",
        "licence",
        "certification",
        "certified",
      ]) || "Not recorded",
  };
}

function inferSport(category: string, bio: string) {
  const categorySport = category
    .replace(/^(athlete|coach)\b/i, "")
    .replace(/^[\s·•:|-]+/, "")
    .trim();
  if (categorySport) return categorySport;

  const labeledSport = extractLabeledValue(bio, ["sport", "sports", "discipline", "game"]);
  if (labeledSport) return labeledSport;

  const hashtag = bio.match(/#([a-z][a-z0-9-]{2,})/i)?.[1];
  const normalizedHashtag = hashtag?.replace(/(coach|player|athlete)$/i, "");
  if (normalizedHashtag && !/^(sports?|training|fitness|ytshorts)$/i.test(normalizedHashtag)) {
    return humanize(normalizedHashtag);
  }
  return "Not specified";
}

function extractLabeledValue(text: string, labels: string[]) {
  const labelPattern = labels.join("|");
  const match = new RegExp(`(?:${labelPattern})\\s*[:\\-]\\s*([^\\n|]+)`, "i").exec(text);
  return match?.[1]?.trim() || null;
}

function extractRelevantLines(text: string, pattern: RegExp) {
  return Array.from(
    new Set(
      text
        .split(/\r?\n|[|;]/)
        .map((line) => line.trim())
        .filter((line) => line && pattern.test(line)),
    ),
  );
}

function humanize(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function SportsProfileBadge({
  badge,
  verified,
}: {
  badge: SportsProfileInfo["badge"];
  verified: boolean;
}) {
  return (
    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-amber-200/30 bg-amber-200/10 px-2.5 py-1 text-[10px] font-bold text-amber-100">
      {verified ? <BadgeCheck className="h-3.5 w-3.5" /> : <Medal className="h-3.5 w-3.5" />}
      {badge}
    </span>
  );
}

export function SportsProfileCard({
  profile,
  onClick,
}: {
  profile: SportsProfileInfo;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-testid="button-sports-profile-details"
      aria-label="Premium sports profile"
      onClick={onClick}
      className="relative mt-4 w-full overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-[#19151f] via-[#17151d] to-[#0c0d13] p-4 text-left shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition-transform active:scale-[0.99]"
    >
      <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-amber-200/25 bg-amber-300/10 text-amber-200">
            <Trophy className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/75">
              Premium sports profile
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-white">
              {profile.verified ? "Verified athletic identity" : "Sports identity"}
            </p>
          </div>
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-amber-200/70" />
      </div>

      <dl className="relative mt-4 grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.035] py-3 text-center">
        <div className="px-2">
          <dt className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500">
            <Medal className="h-3 w-3" />
            Sport
          </dt>
          <dd className="mt-1 truncate text-xs font-semibold text-white">{profile.sport}</dd>
        </div>
        <div className="px-2">
          <dt className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500">
            <UserRound className="h-3 w-3" />
            Role
          </dt>
          <dd className="mt-1 truncate text-xs font-semibold text-white">{profile.role}</dd>
        </div>
        <div className="px-2">
          <dt className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500">
            <Globe2 className="h-3 w-3" />
            {profile.status}
          </dt>
          <dd className="mt-1 truncate text-xs font-semibold text-white">
            {profile.verified ? "Verified" : "Not verified"}
          </dd>
        </div>
      </dl>
    </button>
  );
}

export function SportsDetailsPanel({
  profile,
  isOwner,
  documents,
  documentsLoading,
  documentsError,
  documentsUploading,
  onUploadDocument,
  onDocumentAction,
}: {
  profile: SportsProfileInfo;
  isOwner: boolean;
  documents: SportsDocument[];
  documentsLoading: boolean;
  documentsError: string | null;
  documentsUploading: boolean;
  onUploadDocument: (file: File) => void;
  onDocumentAction: (document: SportsDocument, download: boolean) => void;
}) {
  return (
    <div data-testid="panel-sports-details" className="space-y-4">
      <div className="rounded-3xl border border-amber-200/20 bg-gradient-to-br from-amber-200/10 via-white/[0.04] to-transparent p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/75">
              Sports identity
            </p>
            <p className="mt-1 text-lg font-semibold text-white">{profile.badge}</p>
          </div>
          <ShieldCheck className="h-6 w-6 shrink-0 text-amber-200" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <SportsDetailStat icon={<Medal />} label="Sport" value={profile.sport} />
        <SportsDetailStat icon={<UserRound />} label="Role" value={profile.role} />
        <SportsDetailStat icon={<Trophy />} label="Event / position" value={profile.eventPosition} />
        <SportsDetailStat icon={<Globe2 />} label="Status" value={profile.status} />
        <SportsDetailStat
          icon={<BadgeCheck />}
          label="Verification"
          value={profile.verified ? "Verified" : "Not verified"}
        />
        <SportsDetailStat icon={<ShieldCheck />} label="Sports ID" value={profile.sportsId || "Not recorded"} />
      </div>

      <SportsDetailsSection icon={<Globe2 />} title="Public sports details">
        {profile.publicDetails ? (
          <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">{profile.publicDetails}</p>
        ) : (
          <p className="text-sm text-zinc-500">No additional public sports details listed.</p>
        )}
        {profile.represents !== "Not specified" ? (
          <p className="mt-3 text-xs text-zinc-500">
            Represents: <span className="text-zinc-300">{profile.represents}</span>
          </p>
        ) : null}
      </SportsDetailsSection>

      <SportsDetailsSection icon={<CalendarDays />} title="Tournaments">
        <SportsDetailList items={profile.tournaments} empty="No public tournament details listed." />
      </SportsDetailsSection>

      <SportsDetailsSection icon={<Medal />} title="Medals">
        <SportsDetailList items={profile.medals} empty="No public medal details listed." />
      </SportsDetailsSection>

      <SportsDetailsSection icon={<Trophy />} title="Achievements">
        <SportsDetailList items={profile.achievements} empty="No public achievement details listed." />
      </SportsDetailsSection>

      <SportsDetailsSection icon={<ShieldCheck />} title="Coach / qualification">
        <p className="text-sm text-zinc-300">{profile.coachQualification}</p>
      </SportsDetailsSection>

      {isOwner ? (
        <SportsDetailsSection
          icon={<FileText />}
          title="Documents"
          description="Private verification documents visible only to you."
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">PDF, JPG, or PNG up to 15 MB.</p>
            <label
              htmlFor="sports-document-upload"
              className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-200/20 ${
                documentsUploading ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              {documentsUploading ? "Uploading…" : "Upload"}
            </label>
            <input
              id="sports-document-upload"
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              className="sr-only"
              disabled={documentsUploading}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = "";
                if (file) onUploadDocument(file);
              }}
            />
          </div>
          {documentsLoading ? (
            <p className="text-sm text-zinc-500">Loading your documents…</p>
          ) : documentsError ? (
            <p className="text-sm text-red-300">{documentsError}</p>
          ) : documents.length ? (
            <div className="space-y-2">
              {documents.map((document) => {
                const displayName = document.name.split("/").at(-1) || "Verification document";
                return (
                  <div
                    key={document.path}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3"
                  >
                    <FileText className="h-5 w-5 shrink-0 text-amber-200" />
                    <p className="min-w-0 flex-1 truncate text-sm text-zinc-200">{displayName}</p>
                    <button
                      type="button"
                      aria-label={`Open ${displayName}`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-300 transition-colors hover:bg-white/10"
                      onClick={() => onDocumentAction(document, false)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Download ${displayName}`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-300 transition-colors hover:bg-white/10"
                      onClick={() => onDocumentAction(document, true)}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No verification documents uploaded.</p>
          )}
        </SportsDetailsSection>
      ) : null}
    </div>
  );
}

function SportsDetailStat({
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
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
        <span className="h-3.5 w-3.5 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function SportsDetailsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-amber-200 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {description ? <p className="text-xs text-zinc-500">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function SportsDetailList({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-zinc-500">{empty}</p>;
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="rounded-2xl bg-white/[0.035] px-3 py-2 text-sm text-zinc-300">
          {item}
        </li>
      ))}
    </ul>
  );
}