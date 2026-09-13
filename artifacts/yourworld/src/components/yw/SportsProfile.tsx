import { useState } from "react";
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
  Pencil,
  Plus,
  ShieldCheck,
  Trophy,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import type { SportsDocument } from "@/lib/profile-data";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const SPORTS_CATALOGUE = [
  "Archery",
  "Athletics",
  "Badminton",
  "Baseball",
  "Basketball",
  "Boxing",
  "Cricket",
  "Cycling",
  "Diving",
  "Fencing",
  "Field hockey",
  "Football",
  "Golf",
  "Gymnastics",
  "Handball",
  "Ice hockey",
  "Judo",
  "Kabaddi",
  "Karate",
  "Kho kho",
  "Motorsport",
  "Rowing",
  "Rugby",
  "Sailing",
  "Shooting",
  "Skateboarding",
  "Skiing",
  "Snowboarding",
  "Squash",
  "Swimming",
  "Table tennis",
  "Taekwondo",
  "Tennis",
  "Triathlon",
  "Volleyball",
  "Weightlifting",
  "Wrestling",
] as const;

export type SportsTournament = {
  name: string;
  date: string;
  level: string;
  result: string;
};

export type SportsMedal = {
  type: "Gold" | "Silver" | "Bronze";
  tournament: string;
  year: string;
};

export type SportsProfileDraft = {
  username: string;
  sport: string;
  eventPosition: string;
  representation: "National" | "International" | "";
  tournaments: SportsTournament[];
  medals: SportsMedal[];
  achievements: string;
  coachQualification: string;
  sportsId: string;
};

type SportsEditorField =
  | "username"
  | "sport"
  | "eventPosition"
  | "representation"
  | "tournaments"
  | "medals"
  | "achievements"
  | "coachQualification"
  | "sportsId"
  | "verification";

export type SportsProfileInfo = {
  badge: string;
  role: "Athlete" | "Coach";
  username?: string;
  sport: string;
  eventPosition: string;
  status: "International" | "National" | "Not recorded";
  sportsId: string | null;
  represents: string;
  verified: boolean;
  publicDetails: string;
  tournaments: string[];
  medals: string[];
  tournamentDetails?: SportsTournament[];
  medalDetails?: SportsMedal[];
  achievements: string[];
  coachQualification: string;
};

export function getSportsProfile(profile: {
  is_verified: boolean;
  category: string;
  bio: string;
  location: string;
  username?: string;
}): SportsProfileInfo | null {
  const category = profile.category.trim();
  const roleMatch = /^(athlete|coach)(?:\s*[-·•|:]|$)/i.exec(category);
  if (!roleMatch) return null;

  const role = roleMatch[1].toLowerCase() === "coach" ? "Coach" : "Athlete";
  const source = `${category} ${profile.bio}`.toLowerCase();
  const labeledRepresentation = extractLabeledValue(profile.bio, [
    "representation",
    "represents",
    "status",
  ]);
  const statusSource = labeledRepresentation || source;
  const status = statusSource.toLowerCase().includes("international")
    ? "International"
    : statusSource.toLowerCase().includes("national")
      ? "National"
      : "Not recorded";
  const verified = profile.is_verified === true;
  const tournamentDetails = parseTournamentDetails(profile.bio);
  const medalDetails = parseMedalDetails(profile.bio);
  const tournamentLines = extractRelevantLines(profile.bio, /tournament|league|championship|cup|games|meet/i);
  const medalLines = extractRelevantLines(profile.bio, /medal|gold|silver|bronze/i);
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
    username: profile.username,
    sport: inferSport(category, profile.bio),
    eventPosition:
      extractLabeledValue(profile.bio, ["event", "event/position", "position", "specialty"]) ||
      "Not recorded",
    status,
    sportsId: extractLabeledValue(profile.bio, ["sports id", "sportsid"]),
    represents:
      extractLabeledValue(profile.bio, ["represents", "country", "team"]) ||
      profile.location.trim() ||
      "Not specified",
    verified,
    publicDetails: stripSportsFields(profile.bio),
    tournaments: tournamentDetails.length
      ? tournamentDetails.map(formatTournament)
      : tournamentLines,
    medals: medalDetails.length ? medalDetails.map(formatMedal) : medalLines,
    tournamentDetails,
    medalDetails,
    achievements: extractRelevantLines(profile.bio, /achievement|award|champion|record|trophy/i),
    coachQualification:
      extractLabeledValue(profile.bio, [
        "coach / qualification",
        "coach qualification",
        "qualification",
        "qualifications",
        "license",
        "licence",
        "certification",
        "certified",
      ]) || "Not recorded",
  };
}

export function toSportsProfileDraft(profile: SportsProfileInfo): SportsProfileDraft {
  return {
    username: profile.username ?? "",
    sport: profile.sport === "Not specified" ? "" : profile.sport,
    eventPosition: profile.eventPosition === "Not recorded" ? "" : profile.eventPosition,
    representation: profile.status === "Not recorded" ? "" : profile.status,
    tournaments:
      profile.tournamentDetails?.length
        ? profile.tournamentDetails
        : profile.tournaments.map((name) => ({
            name: name.replace(/^tournament\s*:\s*/i, "").trim(),
            date: "",
            level: "",
            result: "",
          })),
    medals:
      profile.medalDetails?.length
        ? profile.medalDetails
        : profile.medals.map((line) => ({
            type: /silver/i.test(line) ? "Silver" : /bronze/i.test(line) ? "Bronze" : "Gold",
            tournament: line.replace(/^medal\s*:\s*/i, "").trim(),
            year: "",
          })),
    achievements: profile.achievements.join("\n"),
    coachQualification:
      profile.coachQualification === "Not recorded" ? "" : profile.coachQualification,
    sportsId: profile.sportsId ?? "",
  };
}

export function serializeSportsProfileBio(currentBio: string, draft: SportsProfileDraft) {
  const preserved = currentBio
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !isSportsFieldLine(line));
  const fields = [
    draft.sport.trim() ? `Sport: ${draft.sport.trim()}` : "",
    draft.eventPosition.trim() ? `Event / position: ${draft.eventPosition.trim()}` : "",
    draft.representation ? `Representation: ${draft.representation}` : "",
    ...draft.tournaments
      .filter((item) => item.name.trim())
      .map((item) =>
        [
          "Tournament:",
          item.name.trim(),
          item.date.trim(),
          item.level.trim(),
          item.result.trim(),
        ]
          .filter(Boolean)
          .join(" | "),
      ),
    ...draft.medals
      .filter((item) => item.tournament.trim() || item.year.trim())
      .map((item) =>
        ["Medal:", item.type, item.tournament.trim(), item.year.trim()].filter(Boolean).join(" | "),
      ),
    ...draft.achievements
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => `Achievement: ${item}`),
    draft.coachQualification.trim()
      ? `Coach / qualification: ${draft.coachQualification.trim()}`
      : "",
    draft.sportsId.trim() ? `Sports ID: ${draft.sportsId.trim()}` : "",
  ].filter(Boolean);

  return [...preserved, ...fields].join("\n").trim();
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
        .filter((line) => line && pattern.test(line) && !isSportsFieldLine(line)),
    ),
  );
}

function parseTournamentDetails(text: string): SportsTournament[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*tournament\s*:\s*(.+)$/i)?.[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => {
      const [name, date = "", level = "", result = ""] = value
        .split(/\s*\|\s*/)
        .map((part) => part.trim());
      return { name, date, level, result };
    })
    .filter((item) => item.name);
}

function parseMedalDetails(text: string): SportsMedal[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*medal\s*:\s*(.+)$/i)?.[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => {
      const [type = "Gold", tournament = "", year = ""] = value
        .split(/\s*\|\s*/)
        .map((part) => part.trim());
      const normalizedType: SportsMedal["type"] = /silver/i.test(type)
        ? "Silver"
        : /bronze/i.test(type)
          ? "Bronze"
          : "Gold";
      return { type: normalizedType, tournament, year };
    })
    .filter((item) => item.tournament || item.year);
}

function formatTournament(item: SportsTournament) {
  return [item.name, item.date, item.level, item.result].filter(Boolean).join(" · ");
}

function formatMedal(item: SportsMedal) {
  return [item.type, item.tournament, item.year].filter(Boolean).join(" · ");
}

function isSportsFieldLine(line: string) {
  return /^(sport|sports|discipline|game|event(?:\s*\/\s*position)?|position|specialty|representation|represents|status|country|team|tournament|medal|achievement|award|coach(?:\s*\/\s*qualification|\s+qualification)?|qualification|qualifications|license|licence|certification|certified|sports\s*id|sportsid)\s*:/i.test(
    line,
  );
}

function stripSportsFields(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !isSportsFieldLine(line))
    .join("\n");
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
  onDeleteDocument,
  onSave,
}: {
  profile: SportsProfileInfo;
  isOwner: boolean;
  documents: SportsDocument[];
  documentsLoading: boolean;
  documentsError: string | null;
  documentsUploading: boolean;
  onUploadDocument: (file: File) => void;
  onDocumentAction: (document: SportsDocument, download: boolean) => void;
  onDeleteDocument: (document: SportsDocument) => void;
  onSave?: (draft: SportsProfileDraft) => void | Promise<void>;
}) {
  const [editorField, setEditorField] = useState<SportsEditorField | null>(null);
  const [draft, setDraft] = useState<SportsProfileDraft>(() => toSportsProfileDraft(profile));
  const [saving, setSaving] = useState(false);
  const editable = isOwner && Boolean(onSave);
  const openEditor = (field: SportsEditorField) => {
    setDraft(toSportsProfileDraft(profile));
    setEditorField(field);
  };
  const saveDraft = async () => {
    if (!onSave || editorField === "verification") {
      setEditorField(null);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
      setEditorField(null);
    } finally {
      setSaving(false);
    }
  };

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
          <div className="flex items-center gap-2">
            {editable ? (
              <button
                type="button"
                onClick={() => openEditor("username")}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-200/20"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            ) : null}
            <ShieldCheck className="h-6 w-6 shrink-0 text-amber-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <SportsDetailStat
          icon={<Medal />}
          label="Sport"
          value={profile.sport}
          onClick={editable ? () => openEditor("sport") : undefined}
        />
        <SportsDetailStat icon={<UserRound />} label="Role" value={profile.role} />
        <SportsDetailStat
          icon={<Trophy />}
          label="Event / position"
          value={profile.eventPosition}
          onClick={editable ? () => openEditor("eventPosition") : undefined}
        />
        <SportsDetailStat
          icon={<Globe2 />}
          label="Status"
          value={profile.status}
          onClick={editable ? () => openEditor("representation") : undefined}
        />
        <SportsDetailStat
          icon={<BadgeCheck />}
          label="Verification"
          value={profile.verified ? "Verified" : "Not verified"}
          onClick={editable ? () => openEditor("verification") : undefined}
        />
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
        {editable ? (
          <EditLink label="Edit tournament details" onClick={() => openEditor("tournaments")} />
        ) : null}
      </SportsDetailsSection>

      <SportsDetailsSection icon={<Medal />} title="Medals">
        <SportsDetailList items={profile.medals} empty="No public medal details listed." />
        {editable ? <EditLink label="Edit medals" onClick={() => openEditor("medals")} /> : null}
      </SportsDetailsSection>

      <SportsDetailsSection icon={<Trophy />} title="Achievements">
        <SportsDetailList items={profile.achievements} empty="No public achievement details listed." />
        {editable ? (
          <EditLink label="Edit achievements" onClick={() => openEditor("achievements")} />
        ) : null}
      </SportsDetailsSection>

      <SportsDetailsSection icon={<ShieldCheck />} title="Coach / qualification">
        <p className="text-sm text-zinc-300">{profile.coachQualification}</p>
        {editable ? (
          <EditLink label="Edit coach / qualification" onClick={() => openEditor("coachQualification")} />
        ) : null}
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
                    <button
                      type="button"
                      aria-label={`Delete ${displayName}`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-300 transition-colors hover:bg-red-400/10 hover:text-red-300"
                      onClick={() => onDeleteDocument(document)}
                    >
                      <Trash2 className="h-4 w-4" />
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

      {editable ? (
        <SportsDetailsEditor
          open={Boolean(editorField)}
          field={editorField}
          draft={draft}
          setDraft={setDraft}
          saving={saving}
          onOpenChange={(open) => !open && setEditorField(null)}
          onSave={saveDraft}
        />
      ) : null}
    </div>
  );
}

function SportsDetailStat({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
        <span className="h-3.5 w-3.5 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-left transition-colors hover:border-amber-200/30 hover:bg-amber-200/[0.06]"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      {content}
    </div>
  );
}

function EditLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-200 transition-colors hover:text-amber-100"
    >
      <Pencil className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function SportsDetailsEditor({
  open,
  field,
  draft,
  setDraft,
  saving,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  field: SportsEditorField | null;
  draft: SportsProfileDraft;
  setDraft: React.Dispatch<React.SetStateAction<SportsProfileDraft>>;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}) {
  const title =
    field === "username"
      ? "Edit sports username"
      : field === "sport"
        ? "Choose your sport"
        : field === "eventPosition"
          ? "Edit position / event"
          : field === "representation"
            ? "Choose representation"
            : field === "tournaments"
              ? "Edit tournaments"
              : field === "medals"
                ? "Edit medals"
                : field === "achievements"
                  ? "Edit achievements"
                  : field === "coachQualification"
                    ? "Edit coach / qualification"
                    : field === "sportsId"
                      ? "Edit Sports ID"
                      : "Verification status";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88svh] max-w-lg overflow-y-auto rounded-3xl border-amber-200/20 bg-[#0b0c12] text-white">
        <DialogHeader>
          <DialogTitle className="text-left text-xl text-white">{title}</DialogTitle>
        </DialogHeader>

        {field === "username" ? (
          <EditorField label="Username" hint="This updates the existing profile username.">
            <Input
              value={draft.username}
              maxLength={30}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  username: event.target.value.replace(/[^\w.]/g, "").toLowerCase(),
                }))
              }
              className={editorInputClass}
              placeholder="yourusername"
            />
          </EditorField>
        ) : null}

        {field === "sport" ? (
          <EditorField label="Sport" hint="Choose from the sports catalogue or enter another sport.">
            <select
              value={SPORTS_CATALOGUE.includes(draft.sport as (typeof SPORTS_CATALOGUE)[number]) ? draft.sport : "Other"}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  sport: event.target.value === "Other" ? "" : event.target.value,
                }))
              }
              className={editorSelectClass}
            >
              {SPORTS_CATALOGUE.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
              <option value="Other">Other sport</option>
            </select>
            {!SPORTS_CATALOGUE.includes(draft.sport as (typeof SPORTS_CATALOGUE)[number]) ? (
              <Input
                value={draft.sport}
                onChange={(event) => setDraft((current) => ({ ...current, sport: event.target.value }))}
                className={editorInputClass}
                placeholder="Enter another sport"
              />
            ) : null}
          </EditorField>
        ) : null}

        {field === "eventPosition" ? (
          <EditorField label="Position / event">
            <Input
              value={draft.eventPosition}
              onChange={(event) =>
                setDraft((current) => ({ ...current, eventPosition: event.target.value }))
              }
              className={editorInputClass}
              placeholder="Goalkeeper, 100m, Singles…"
            />
          </EditorField>
        ) : null}

        {field === "representation" ? (
          <EditorField label="Representation">
            <select
              value={draft.representation}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  representation: event.target.value as SportsProfileDraft["representation"],
                }))
              }
              className={editorSelectClass}
            >
              <option value="">Not recorded</option>
              <option value="National">National</option>
              <option value="International">International</option>
            </select>
          </EditorField>
        ) : null}

        {field === "tournaments" ? (
          <div className="space-y-3">
            {draft.tournaments.map((item, index) => (
              <div key={`tournament-${index}`} className={editorCardClass}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">
                    Tournament {index + 1}
                  </p>
                  <button
                    type="button"
                    aria-label={`Remove tournament ${index + 1}`}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        tournaments: current.tournaments.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                    className="text-zinc-500 transition-colors hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["name", "date", "level", "result"] as const).map((key) => (
                    <Input
                      key={key}
                      value={item[key]}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          tournaments: current.tournaments.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, [key]: event.target.value } : entry,
                          ),
                        }))
                      }
                      className={editorInputClass}
                      placeholder={
                        key === "name"
                          ? "Tournament name"
                          : key === "date"
                            ? "Year / date"
                            : key === "level"
                              ? "Level"
                              : "Result / participation"
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
            <AddRowButton
              label="Add tournament"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  tournaments: [...current.tournaments, { name: "", date: "", level: "", result: "" }],
                }))
              }
            />
          </div>
        ) : null}

        {field === "medals" ? (
          <div className="space-y-3">
            {draft.medals.map((item, index) => (
              <div key={`medal-${index}`} className={editorCardClass}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">
                    Medal {index + 1}
                  </p>
                  <button
                    type="button"
                    aria-label={`Remove medal ${index + 1}`}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        medals: current.medals.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                    className="text-zinc-500 transition-colors hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <select
                    value={item.type}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        medals: current.medals.map((entry, entryIndex) =>
                          entryIndex === index
                            ? { ...entry, type: event.target.value as SportsMedal["type"] }
                            : entry,
                        ),
                      }))
                    }
                    className={editorSelectClass}
                  >
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Bronze">Bronze</option>
                  </select>
                  {(["tournament", "year"] as const).map((key) => (
                    <Input
                      key={key}
                      value={item[key]}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          medals: current.medals.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, [key]: event.target.value } : entry,
                          ),
                        }))
                      }
                      className={editorInputClass}
                      placeholder={key === "tournament" ? "Tournament" : "Year"}
                    />
                  ))}
                </div>
              </div>
            ))}
            <AddRowButton
              label="Add medal"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  medals: [...current.medals, { type: "Gold", tournament: "", year: "" }],
                }))
              }
            />
          </div>
        ) : null}

        {field === "achievements" ? (
          <EditorField label="Achievements" hint="Add one achievement per line.">
            <Textarea
              value={draft.achievements}
              onChange={(event) =>
                setDraft((current) => ({ ...current, achievements: event.target.value }))
              }
              rows={6}
              className={`${editorInputClass} min-h-32`}
              placeholder={"National champion\nPersonal best…"}
            />
          </EditorField>
        ) : null}

        {field === "coachQualification" ? (
          <EditorField label="Coach / qualification">
            <Input
              value={draft.coachQualification}
              onChange={(event) =>
                setDraft((current) => ({ ...current, coachQualification: event.target.value }))
              }
              className={editorInputClass}
              placeholder="Level 2 coaching licence"
            />
          </EditorField>
        ) : null}

        {field === "sportsId" ? (
          <EditorField label="Sports ID" hint="Saved as part of the public sports profile.">
            <Input
              value={draft.sportsId}
              onChange={(event) => setDraft((current) => ({ ...current, sportsId: event.target.value }))}
              className={editorInputClass}
              placeholder="Enter Sports ID"
            />
          </EditorField>
        ) : null}

        {field === "verification" ? (
          <div className={editorCardClass}>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
              <p className="text-sm leading-6 text-zinc-400">
                Verification is controlled by the existing profile verification state and cannot be
                self-claimed. Private documents remain available below for the owner/admin review flow.
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-full bg-amber-200 text-black hover:bg-amber-100"
            disabled={saving || field === "verification"}
            onClick={() => void onSave()}
          >
            {saving ? "Saving…" : field === "verification" ? "Managed by review" : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const editorInputClass =
  "h-11 rounded-xl border-white/10 bg-white/[0.06] text-white placeholder:text-zinc-500 focus-visible:ring-amber-200/40";
const editorSelectClass =
  "h-11 w-full rounded-xl border border-white/10 bg-[#171820] px-3 text-sm text-white outline-none focus:border-amber-200/50";
const editorCardClass = "rounded-2xl border border-white/10 bg-white/[0.035] p-3";

function EditorField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">{label}</p>
        {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-amber-200/30 px-3 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-200/10"
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
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