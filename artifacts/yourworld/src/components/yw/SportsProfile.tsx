import { useEffect, useState } from "react";
import type React from "react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CalendarDays,
  ChevronRight,
  FileCheck2,
  Globe2,
  LockKeyhole,
  Mail,
  MapPin,
  Medal,
  Pencil,
  Phone,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  Trash2,
  Upload,
  UserRound,
  Video,
} from "lucide-react";
import type {
  SportsVerificationDetails,
  SportsVerificationEvidenceKind,
} from "@/lib/profile-data";
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

const RECOGNIZED_COMPETITIONS = [
  "Olympic Games",
  "Paralympic Games",
  "World Championships",
  "World Games",
  "Asian Games",
  "Asian Championships",
  "Commonwealth Games",
  "South Asian Games",
  "South Asian Championships",
  "World University Games / FISU World University Games",
  "Asian University Games",
  "Asian Indoor & Martial Arts Games",
  "Youth Olympic Games",
  "Asian Youth Games",
  "World Youth Championships",
  "World Junior Championships",
  "World U23 Championships",
  "World Cup",
  "Asian Cup",
  "World Para Championships",
  "Asian Para Games",
  "Commonwealth Youth Games",
  "National Games (India)",
  "Khelo India Games",
  "Other Recognized Competition",
] as const;

const NATIONAL_COMPETITIONS = [
  "National Games (India)",
  "All India Inter-University / All India University Games",
  "Khelo India Games",
] as const;

const INTERNATIONAL_COMPETITIONS = RECOGNIZED_COMPETITIONS.filter(
  (competition) => !NATIONAL_COMPETITIONS.includes(competition as (typeof NATIONAL_COMPETITIONS)[number]),
);

const TOURNAMENT_YEARS = Array.from({ length: 126 }, (_, index) =>
  String(new Date().getFullYear() - index),
);

type TournamentMedal = "Gold" | "Silver" | "Bronze" | "No Medal";

export type SportsTournament = {
  name: string;
  date: string;
  level: string;
  result: string;
  startYear?: string;
  startDate?: string;
  endYear?: string;
  endDate?: string;
  country?: string;
  hostLocation?: string;
  medal?: TournamentMedal;
  eventPosition?: string;
  teamCountry?: string;
  roleResponsibility?: string;
};

export type SportsMedal = {
  type: "Gold" | "Silver" | "Bronze";
  tournament: string;
  year: string;
};

export type SportsProfileDraft = {
  username: string;
  role: "Player" | "Coach";
  sport: string;
  eventPosition: string;
  representation: "National" | "International" | "";
  tournaments: SportsTournament[];
  medals: SportsMedal[];
  achievements: string;
  coachName: string;
  coachQualification: string;
  qualificationYear: string;
  institution: string;
  coachingExperience: string;
  teamDetails: string;
  sportsIntroductionPath?: string;
};

type SportsEditorField =
  | "username"
  | "role"
  | "sport"
  | "eventPosition"
  | "representation"
  | "tournaments"
  | "medals"
  | "achievements"
  | "coachName"
  | "coachQualification"
  | "qualificationYear"
  | "institution"
  | "coachingExperience"
  | "teamDetails"
  | "verification";

export type SportsProfileInfo = {
  badge: string;
  role: "Player" | "Coach";
  username?: string;
  sport: string;
  eventPosition: string;
  status: "International" | "National" | "Not recorded";
  represents: string;
  verified: boolean;
  verificationRequested?: boolean;
  sportsIntroductionPath?: string;
  publicDetails: string;
  tournaments: string[];
  medals: string[];
  tournamentDetails?: SportsTournament[];
  medalDetails?: SportsMedal[];
  achievements: string[];
  coachName: string;
  coachQualification: string;
  qualificationYear: string;
  institution: string;
  coachingExperience: string;
  teamDetails: string;
};

type SportsProfileSource = {
  is_verified: boolean;
  category: string;
  bio: string;
  location: string;
  username?: string;
  displayName?: string;
  verification_requested?: boolean;
};

export function getSportsProfile(profile: SportsProfileSource): SportsProfileInfo | null {
  const category = profile.category.trim();
  const roleMatch = /^(athlete|player|coach)(?:\s*[-·•|:]|$)/i.exec(category);
  if (!roleMatch) return null;

  const role = roleMatch[1].toLowerCase() === "coach" ? "Coach" : "Player";
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
  const verified = profile.is_verified === true && profile.verification_requested !== true;
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
          ? ""
          : status === "National"
            ? "🇮🇳 NATIONAL PLAYER"
            : "✅ VERIFIED PLAYER"
        : "PLAYER PROFILE";

  return {
    badge,
    role,
    username: profile.username,
    sport: inferSport(category, profile.bio),
    eventPosition:
      extractLabeledValue(profile.bio, ["event", "event/position", "position", "specialty"]) ||
      "Not recorded",
    status,
    represents:
      extractLabeledValue(profile.bio, ["represents", "country", "team"]) ||
      profile.location.trim() ||
      "Not specified",
    verified,
    verificationRequested: profile.verification_requested === true,
    sportsIntroductionPath:
      extractLabeledValue(profile.bio, ["sports introduction", "sports introduction video"]) || undefined,
    publicDetails: stripSportsFields(profile.bio),
    tournaments: tournamentDetails.length
      ? tournamentDetails.map(formatTournament)
      : tournamentLines,
    medals: medalDetails.length ? medalDetails.map(formatMedal) : medalLines,
    tournamentDetails,
    medalDetails,
    achievements: extractRelevantLines(profile.bio, /achievement|award|champion|record|trophy/i),
    coachName:
      extractLabeledValue(profile.bio, ["coach name"]) ||
      profile.displayName?.trim() ||
      profile.username?.trim() ||
      "Not recorded",
    coachQualification:
      extractLabeledValue(profile.bio, [
        "coaching qualification",
        "coach / qualification",
        "coach qualification",
        "qualification",
        "qualifications",
        "license",
        "licence",
        "certification",
        "certified",
      ]) || "Not recorded",
    qualificationYear:
      extractLabeledValue(profile.bio, [
        "qualification / ns nis year",
        "qualification year",
        "ns nis year",
        "nsnis year",
      ]) || "Not recorded",
    institution:
      extractLabeledValue(profile.bio, ["institution", "where completed", "completed at"]) ||
      "Not recorded",
    coachingExperience:
      extractLabeledValue(profile.bio, ["coaching experience", "experience"]) || "Not recorded",
    teamDetails:
      extractLabeledValue(profile.bio, ["tournament / team details", "team details"]) || "Not recorded",
  };
}

/** Provides the existing editor with an empty Player profile until the user chooses a role. */
export function getOrCreateSportsProfile(profile: SportsProfileSource): SportsProfileInfo {
  return (
    getSportsProfile(profile) ?? {
      badge: "PLAYER PROFILE",
      role: "Player",
      username: profile.username,
      sport: "Not specified",
      eventPosition: "Not recorded",
      status: "Not recorded",
      represents: profile.location.trim() || "Not specified",
      verified: false,
      verificationRequested: profile.verification_requested === true,
      publicDetails: stripSportsFields(profile.bio),
      tournaments: [],
      medals: [],
      tournamentDetails: [],
      medalDetails: [],
      achievements: [],
      coachName: profile.displayName?.trim() || profile.username?.trim() || "Not recorded",
      coachQualification: "Not recorded",
      qualificationYear: "Not recorded",
      institution: "Not recorded",
      coachingExperience: "Not recorded",
      teamDetails: "Not recorded",
    }
  );
}

export function toSportsProfileDraft(profile: SportsProfileInfo): SportsProfileDraft {
  return {
    username: profile.username ?? "",
    role: profile.role,
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
    coachName: profile.coachName === "Not recorded" ? "" : profile.coachName,
    coachQualification:
      profile.coachQualification === "Not recorded" ? "" : profile.coachQualification,
    qualificationYear: profile.qualificationYear === "Not recorded" ? "" : profile.qualificationYear,
    institution: profile.institution === "Not recorded" ? "" : profile.institution,
    coachingExperience:
      profile.coachingExperience === "Not recorded" ? "" : profile.coachingExperience,
    teamDetails: profile.teamDetails === "Not recorded" ? "" : profile.teamDetails,
    sportsIntroductionPath: profile.sportsIntroductionPath ?? "",
  };
}

export function serializeSportsProfileBio(currentBio: string, draft: SportsProfileDraft) {
  const preserved = currentBio
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !isSportsFieldLine(line));
  const fields =
    draft.role === "Coach"
      ? [
          draft.sport.trim() ? `Sport: ${draft.sport.trim()}` : "",
          draft.coachName.trim() ? `Coach Name: ${draft.coachName.trim()}` : "",
          draft.coachQualification.trim()
            ? `Coaching Qualification: ${draft.coachQualification.trim()}`
            : "",
          draft.qualificationYear.trim()
            ? `Qualification / NS NIS Year: ${draft.qualificationYear.trim()}`
            : "",
          draft.institution.trim() ? `Institution / Where completed: ${draft.institution.trim()}` : "",
          draft.coachingExperience.trim()
            ? `Coaching Experience: ${draft.coachingExperience.trim()}`
            : "",
          draft.sportsIntroductionPath?.trim()
            ? `Sports Introduction: ${draft.sportsIntroductionPath.trim()}`
            : "",
          ...draft.tournaments
            .filter((item) => item.name.trim())
            .map(serializeTournament),
          draft.teamDetails.trim() ? `Tournament / Team details: ${draft.teamDetails.trim()}` : "",
        ].filter(Boolean)
      : [
          draft.sport.trim() ? `Sport: ${draft.sport.trim()}` : "",
          draft.eventPosition.trim() ? `Event / position: ${draft.eventPosition.trim()}` : "",
          draft.representation ? `Representation: ${draft.representation}` : "",
          draft.sportsIntroductionPath?.trim()
            ? `Sports Introduction: ${draft.sportsIntroductionPath.trim()}`
            : "",
          ...draft.tournaments
            .filter((item) => item.name.trim())
            .map(serializeTournament),
          ...draft.medals
            .filter((item) => item.tournament.trim() || item.year.trim())
            .map((item) =>
              ["Medal:", item.type, item.tournament.trim(), item.year.trim()]
                .filter(Boolean)
                .join(" | "),
            ),
          ...draft.achievements
            .split(/\r?\n/)
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => `Achievement: ${item}`),
        ].filter(Boolean);

  return [...preserved, ...fields].join("\n").trim();
}

function inferSport(category: string, bio: string) {
  const categorySport = category
    .replace(/^(athlete|player|coach)\b/i, "")
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
    .map(parseTournamentValue)
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
  return [
    item.name,
    formatTournamentDateRange(item),
    item.country,
    item.hostLocation,
    item.result,
    item.medal && item.medal !== "No Medal" ? item.medal : "",
    item.eventPosition,
    item.teamCountry,
    item.roleResponsibility,
    item.level,
  ]
    .filter(Boolean)
    .join(" · ");
}

function parseTournamentValue(value: string): SportsTournament {
  const parts = value.split(/\s*\|\s*/).map((part) => part.trim());
  const keyed = new Map<string, string>();
  const legacyParts: string[] = [];

  for (const part of parts) {
    const separator = part.indexOf(":");
    if (separator === -1) {
      legacyParts.push(part);
      continue;
    }
    const key = part.slice(0, separator).trim().toLowerCase().replace(/\s+/g, " ");
    const fieldValue = part.slice(separator + 1).trim();
    if (
      [
        "tournament",
        "competition",
        "start year",
        "start date",
        "end year",
        "end date",
        "country",
        "city / host location",
        "host location",
        "city",
        "result",
        "achievement",
        "medal",
        "event / position",
        "event",
        "position",
        "team / country",
        "team / country coached",
        "role / responsibility",
        "level",
        "date",
      ].includes(key)
    ) {
      keyed.set(key, fieldValue);
    } else {
      legacyParts.push(part);
    }
  }

  if (!keyed.size) {
    const [name = "", date = "", level = "", result = ""] = parts;
    return { name, date, level, result };
  }

  const hasStructuredFields = Array.from(keyed.keys()).some(
    (key) => key !== "tournament" && key !== "competition",
  );
  if (!hasStructuredFields) {
    const [date = "", level = "", result = ""] = legacyParts;
    return {
      name: keyed.get("tournament") || keyed.get("competition") || legacyParts[0] || "",
      date,
      level,
      result,
    };
  }

  const date = keyed.get("date") || "";
  return {
    name: keyed.get("tournament") || keyed.get("competition") || legacyParts[0] || "",
    date,
    level: keyed.get("level") || "",
    result: keyed.get("result") || keyed.get("achievement") || "",
    startYear: keyed.get("start year") || (/^\d{4}$/.test(date) ? date : ""),
    startDate: keyed.get("start date") || "",
    endYear: keyed.get("end year") || "",
    endDate: keyed.get("end date") || "",
    country: keyed.get("country") || "",
    hostLocation:
      keyed.get("city / host location") || keyed.get("host location") || keyed.get("city") || "",
    medal: normalizeTournamentMedal(keyed.get("medal")),
    eventPosition: keyed.get("event / position") || keyed.get("event") || keyed.get("position") || "",
    teamCountry: keyed.get("team / country") || keyed.get("team / country coached") || "",
    roleResponsibility: keyed.get("role / responsibility") || "",
  };
}

function normalizeTournamentMedal(value?: string): TournamentMedal | undefined {
  if (!value) return undefined;
  if (/silver/i.test(value)) return "Silver";
  if (/bronze/i.test(value)) return "Bronze";
  if (/gold/i.test(value)) return "Gold";
  if (/no medal|none/i.test(value)) return "No Medal";
  return undefined;
}

function isNationalCompetition(name: string) {
  return NATIONAL_COMPETITIONS.includes(name as (typeof NATIONAL_COMPETITIONS)[number]);
}

function nationalCompetitionLabel(name: string) {
  if (name === "National Games (India)") return "NATIONAL GAMES";
  if (name === "Khelo India Games") return "KHELO INDIA GAMES";
  return "ALL INDIA UNIVERSITY";
}

function tournamentYear(item: SportsTournament) {
  return item.startYear || item.endYear || item.startDate?.slice(0, 4) || item.date.match(/\b\d{4}\b/)?.[0] || "";
}

function medalEmoji(medal?: TournamentMedal) {
  if (medal === "Gold") return "🥇";
  if (medal === "Silver") return "🥈";
  if (medal === "Bronze") return "🥉";
  return "";
}

function serializeTournament(item: SportsTournament) {
  const startDate = item.startDate?.trim() || item.date.trim();
  return [
    `Tournament: ${item.name.trim()}`,
    item.startYear?.trim() ? `Start Year: ${item.startYear.trim()}` : "",
    startDate ? `Start Date: ${startDate}` : "",
    item.endYear?.trim() ? `End Year: ${item.endYear.trim()}` : "",
    item.endDate?.trim() ? `End Date: ${item.endDate.trim()}` : "",
    item.country?.trim() ? `Country: ${item.country.trim()}` : "",
    item.hostLocation?.trim() ? `City / Host Location: ${item.hostLocation.trim()}` : "",
    item.result.trim() ? `Result: ${item.result.trim()}` : "",
    item.medal ? `Medal: ${item.medal}` : "",
    item.eventPosition?.trim() ? `Event / Position: ${item.eventPosition.trim()}` : "",
    item.teamCountry?.trim() ? `Team / Country: ${item.teamCountry.trim()}` : "",
    item.roleResponsibility?.trim() ? `Role / Responsibility: ${item.roleResponsibility.trim()}` : "",
    item.level.trim() ? `Level: ${item.level.trim()}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

function formatTournamentDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatTournamentDateRange(item: SportsTournament) {
  const start = item.startDate || item.date || item.startYear || "";
  const end = item.endDate || item.endYear || "";
  if (!start) return end ? formatTournamentDate(end) : "";
  if (!end) return formatTournamentDate(start);
  return `${formatTournamentDate(start)} – ${formatTournamentDate(end)}`;
}

function formatMedal(item: SportsMedal) {
  return [item.type, item.tournament, item.year].filter(Boolean).join(" · ");
}

function isSportsFieldLine(line: string) {
  return /^(sport|sports|discipline|game|event(?:\s*\/\s*position)?|position|specialty|representation|represents|status|country|team|tournament|medal|achievement|award|sports\s+introduction(?:\s+video)?|coach(?:\s*\/\s*qualification|\s+qualification)?|coach\s+name|coaching\s+qualification|qualification(?:\s*\/\s*ns\s*nis\s*year|\s+year)?|qualifications|license|licence|certification|certified|institution(?:\s*\/\s*where\s+completed)?|where\s+completed|completed\s+at|coaching\s+experience|experience|tournament\s*\/\s*team\s+details|team\s+details|sports\s*id|sportsid)\s*:/i.test(
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
  compact = false,
  onClick,
}: {
  profile: SportsProfileInfo;
  compact?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-testid="button-sports-profile-details"
      aria-label="Sports Details"
      onClick={onClick}
      className={`relative w-full overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-[#19151f] via-[#17151d] to-[#0c0d13] text-left shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition-transform active:scale-[0.99] ${
        compact ? "mt-3 rounded-2xl p-3" : "mt-4 p-4"
      }`}
    >
      <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`grid shrink-0 place-items-center border border-amber-200/25 bg-amber-300/10 text-amber-200 ${compact ? "h-9 w-9 rounded-xl" : "h-11 w-11 rounded-2xl"}`}>
            <Trophy className={compact ? "h-4 w-4" : "h-5 w-5"} />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-200/75">
              Sports Identity / Sports Details
            </p>
            <p className="mt-0.5 truncate text-[13px] font-semibold text-white">
              {profile.verified ? "Verified athletic identity" : "Sports Profile"}
            </p>
          </div>
        </div>
        <ChevronRight className={`${compact ? "mt-0.5 h-4 w-4" : "mt-1 h-5 w-5"} shrink-0 text-amber-200/70`} />
      </div>

    </button>
  );
}

export function SportsDetailsPanel({
  profile,
  isOwner,
  onSave,
  sportsIntroductionUrl,
  sportsIntroductionUploading = false,
  sportsIntroductionProgress = 0,
  onUploadSportsIntroduction,
  onDeleteSportsIntroduction,
  onSubmitVerification,
  duplicateSubmissionWarning,
  onDismissDuplicateSubmissionWarning,
  onOpenVerificationReview,
  verificationSubmitting = false,
  verificationDetails,
  verificationDetailsLoading = false,
  verificationDetailsSaving = false,
  onSaveVerificationDetails,
  onUploadVerificationEvidence,
  onDeleteVerificationEvidence,
  onPreviewVerificationEvidence,
  verificationEvidenceUploading = null,
}: {
  profile: SportsProfileInfo;
  isOwner: boolean;
  onSave?: (draft: SportsProfileDraft) => void | Promise<void>;
  sportsIntroductionUrl?: string | null;
  sportsIntroductionUploading?: boolean;
  sportsIntroductionProgress?: number;
  onUploadSportsIntroduction?: (file: File) => void;
  onDeleteSportsIntroduction?: () => void;
  onSubmitVerification?: (details: SportsVerificationDetails) => void | Promise<void>;
  duplicateSubmissionWarning?: string | null;
  onDismissDuplicateSubmissionWarning?: () => void;
  onOpenVerificationReview?: () => void;
  verificationSubmitting?: boolean;
  verificationDetails?: SportsVerificationDetails | null;
  verificationDetailsLoading?: boolean;
  verificationDetailsSaving?: boolean;
  onSaveVerificationDetails?: (details: SportsVerificationDetails) => void | Promise<void>;
  onUploadVerificationEvidence?: (
    kind: SportsVerificationEvidenceKind,
    file: File,
  ) => void | Promise<void>;
  onDeleteVerificationEvidence?: (
    kind: SportsVerificationEvidenceKind,
  ) => void | Promise<void>;
  onPreviewVerificationEvidence?: (
    kind: SportsVerificationEvidenceKind,
    path: string,
  ) => void | Promise<void>;
  verificationEvidenceUploading?: SportsVerificationEvidenceKind | null;
}) {
  const [editorField, setEditorField] = useState<SportsEditorField | null>(null);
  const [draft, setDraft] = useState<SportsProfileDraft>(() => toSportsProfileDraft(profile));
  const [saving, setSaving] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [verificationDraft, setVerificationDraft] = useState<SportsVerificationDetails>(
    () => verificationDetails ?? emptySportsVerificationDetails(),
  );
  const editable = isOwner && Boolean(onSave);
  const isCoach = profile.role === "Coach";
  const isInternational = profile.status === "International";
  const reviewStatus = verificationDetails?.reviewStatus ?? "not_submitted";
  const verificationLocked =
    profile.verified ||
    profile.verificationRequested ||
    reviewStatus === "pending" ||
    reviewStatus === "approved";
  const verificationUnderReview = profile.verificationRequested || reviewStatus === "pending";
  useEffect(() => {
    setVerificationDraft(verificationDetails ?? emptySportsVerificationDetails());
  }, [verificationDetails]);
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
            {profile.badge ? (
              <p className="mt-1 text-lg font-semibold text-white">{profile.badge}</p>
            ) : null}
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
        <SportsDetailStat
          icon={<UserRound />}
          label="Role"
          value={profile.role}
          onClick={editable ? () => openEditor("role") : undefined}
        />
        {!isCoach ? (
          <SportsDetailStat
            icon={<Globe2 />}
            label="Status"
            value={profile.status}
            onClick={editable ? () => openEditor("representation") : undefined}
          />
        ) : null}
        <SportsDetailStat
          icon={<BadgeCheck />}
          label="Verification"
          value={profile.verified ? "Verified" : "Not verified"}
          onClick={editable ? () => openEditor("verification") : undefined}
        />
      </div>

      {isCoach ? (
        <>
          <CoachProfileSection profile={profile} editable={editable} onEdit={openEditor} />
          <SportsTournamentSection profile={profile} editable={editable} onEdit={openEditor} />
        </>
      ) : (
        <>
          <SportsTournamentSection profile={profile} editable={editable} onEdit={openEditor} />

        </>
      )}

      {isOwner ? (
        <SportsVerificationDetailsSection
          details={verificationDraft}
          isInternational={isInternational}
          loading={verificationDetailsLoading}
          saving={verificationDetailsSaving}
          uploading={verificationEvidenceUploading}
          onChange={setVerificationDraft}
          onSave={onSaveVerificationDetails}
          onUploadEvidence={onUploadVerificationEvidence}
           onDeleteEvidence={onDeleteVerificationEvidence}
           onPreviewEvidence={onPreviewVerificationEvidence}
           locked={verificationLocked}
           underReview={verificationUnderReview}
          profile={profile}
          sportsIntroductionUrl={sportsIntroductionUrl}
          sportsIntroductionUploading={sportsIntroductionUploading}
          sportsIntroductionProgress={sportsIntroductionProgress}
          onUploadSportsIntroduction={onUploadSportsIntroduction}
          onDeleteSportsIntroduction={onDeleteSportsIntroduction}
        />
      ) : null}

      {!isOwner && profile.sportsIntroductionPath ? (
        <SportsIntroductionSection
          profile={profile}
          isOwner={false}
          sportsIntroductionUrl={sportsIntroductionUrl}
          sportsIntroductionUploading={sportsIntroductionUploading}
          sportsIntroductionProgress={sportsIntroductionProgress}
          onUploadSportsIntroduction={onUploadSportsIntroduction}
          onDeleteSportsIntroduction={onDeleteSportsIntroduction}
        />
      ) : null}

      {isOwner ? (
        <SportsDetailsSection
          icon={<ShieldCheck />}
          title="Terms & Conditions"
          description="Review these requirements before submitting your Sports Profile for verification."
        >
          <details className="rounded-2xl border border-amber-200/15 bg-gradient-to-br from-amber-200/[0.08] via-white/[0.035] to-transparent">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-amber-100">
              <span className="flex items-center justify-between gap-3">
                <span>Verification terms</span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Tap to read
                </span>
              </span>
            </summary>
            <div className="border-t border-white/10 px-4 py-3">
              <ul className="list-disc space-y-1.5 pl-5 text-xs leading-5 text-zinc-300">
                <li>I confirm that all information submitted by me is true and accurate.</li>
                <li>
                  I am responsible for the authenticity of my certificates, achievements and sports
                  information.
                </li>
                <li>Fake, forged, altered or misleading documents/information are strictly prohibited.</li>
                <li>
                  YourWorld may reject or revoke verification if submitted information is found to be
                  false.
                </li>
                <li>YourWorld may restrict or suspend accounts involved in fraudulent verification.</li>
                <li>
                  YourWorld may take appropriate legal action or other remedies permitted under
                  applicable law where applicable.
                </li>
                <li>Verification documents remain private and are used for verification purposes.</li>
                <li>
                  The Sports Introduction video may be displayed publicly as part of the verified sports
                  profile.
                </li>
                <li>
                  YourWorld may retain verification records/evidence for legitimate security,
                  verification and legal purposes.
                </li>
                <li>Verification review typically takes between 12 to 72 working hours.</li>
                <li>
                  YourWorld reserves the right to cross-verify tournament certificates with recognized
                  sports federations/bodies.
                </li>
              </ul>
            </div>
          </details>
          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-zinc-200">
            <input
              type="checkbox"
              checked={termsAgreed}
              onChange={(event) => setTermsAgreed(event.target.checked)}
              className="mt-1 h-4 w-4 accent-amber-200"
            />
            <span>I Agree to the Terms &amp; Conditions</span>
          </label>
          {profile.verified ? (
            <div
              data-testid="sports-verification-status"
              className="mt-4 rounded-2xl border border-emerald-200/30 bg-gradient-to-r from-emerald-300/[0.16] via-amber-200/[0.08] to-transparent px-4 py-3"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">✓ Verified</p>
              <p className="mt-1 text-sm font-semibold text-white">Sports Profile Verified Successfully</p>
            </div>
          ) : profile.verificationRequested ? (
            <p
              data-testid="sports-verification-status"
              className="mt-4 rounded-2xl border border-amber-200/20 bg-amber-200/[0.08] px-4 py-3 text-sm text-amber-100"
            >
              Pending Verification
            </p>
          ) : (
            <>
              {verificationDetails?.reviewStatus === "rejected" ||
              verificationDetails?.reviewStatus === "correction_requested" ? (
                <div
                  data-testid="sports-verification-review-feedback"
                  className="mt-4 rounded-2xl border border-red-200/20 bg-red-200/[0.08] px-4 py-3"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-200">
                    {verificationDetails.reviewStatus === "correction_requested"
                      ? "Correction requested"
                      : "Verification rejected"}
                  </p>
                  {verificationDetails.reviewReason ? (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-200">
                      {verificationDetails.reviewReason}
                    </p>
                  ) : null}
                </div>
              ) : null}
            <Button
              type="button"
              data-testid="button-submit-sports-verification"
              disabled={!termsAgreed || verificationSubmitting}
              onClick={() => void onSubmitVerification?.(verificationDraftOr(verificationDraft))}
              className="mt-4 w-full rounded-full bg-amber-200 text-black hover:bg-amber-100"
            >
              {verificationSubmitting
                ? "Submitting…"
                : verificationDetails?.reviewStatus === "correction_requested" ||
                    verificationDetails?.reviewStatus === "rejected"
                  ? "Resubmit for Verification"
                  : "Submit for Verification"}
            </Button>
            </>
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
          onOpenVerificationReview={onOpenVerificationReview}
        />
      ) : null}
      <Dialog
        open={Boolean(duplicateSubmissionWarning)}
        onOpenChange={(open) => {
          if (!open) onDismissDuplicateSubmissionWarning?.();
        }}
      >
        <DialogContent className="border-red-200/20 bg-[#151116] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-100">Duplicate submission blocked</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-6 text-zinc-300">
            {duplicateSubmissionWarning ||
              "This Document / Identity is Already Registered. This identity or document has already been submitted or verified on another account. Duplicate submissions are strictly prohibited."}
          </p>
          <Button
            type="button"
            className="mt-2 w-full rounded-full bg-red-200 text-black hover:bg-red-100"
            onClick={() => onDismissDuplicateSubmissionWarning?.()}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function emptySportsVerificationDetails(): SportsVerificationDetails {
  return {
    fullName: "",
    fatherName: "",
    dateOfBirth: "",
    address: "",
    passportNumber: "",
    certificateNumber: "",
    identityDetailsConfirmed: false,
    villageTown: "",
    district: "",
    state: "",
    country: "India",
    mobileNumber: "",
    email: "",
    sportsCertificate: null,
    passportFirstPage: null,
    passportVisaStampPage: null,
    tournamentPhoto: null,
  };
}

function SportsIntroductionSection({
  profile,
  isOwner,
  sportsIntroductionUrl,
  sportsIntroductionUploading,
  sportsIntroductionProgress,
  onUploadSportsIntroduction,
  onDeleteSportsIntroduction,
  locked = false,
}: {
  profile: SportsProfileInfo;
  isOwner: boolean;
  sportsIntroductionUrl?: string | null;
  sportsIntroductionUploading: boolean;
  sportsIntroductionProgress: number;
  onUploadSportsIntroduction?: (file: File) => void;
  onDeleteSportsIntroduction?: () => void;
  locked?: boolean;
}) {
  return (
    <SportsDetailsSection
      icon={<Video />}
      title="Sports Introduction"
      description="One short vertical video in your own natural voice. No music or platform-added audio."
    >
      {profile.sportsIntroductionPath ? (
        sportsIntroductionUrl ? (
          <video
            data-testid="sports-introduction-video"
            src={sportsIntroductionUrl}
            controls
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            playsInline
            preload="metadata"
            className="aspect-[9/16] max-h-80 w-full rounded-2xl border border-amber-200/15 bg-black object-contain"
          />
        ) : (
          <p className="text-sm text-zinc-500">Loading your Sports Introduction…</p>
        )
      ) : (
        <div className="rounded-2xl border border-dashed border-amber-200/20 bg-amber-200/[0.04] p-4">
          <p className="text-sm leading-6 text-zinc-300">
            Introduce yourself in your own voice and tell people about your sport, role, major
            achievements and sports journey.
          </p>
        </div>
      )}
      {isOwner && !locked ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label
            htmlFor="sports-introduction-upload"
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-200/20 ${
              sportsIntroductionUploading ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            {sportsIntroductionUploading
              ? `Uploading ${sportsIntroductionProgress}%`
              : profile.sportsIntroductionPath
                ? "Replace video"
                : "Upload video"}
          </label>
          <input
            id="sports-introduction-upload"
            type="file"
            accept="video/*"
            className="sr-only"
            disabled={sportsIntroductionUploading}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (file) onUploadSportsIntroduction?.(file);
            }}
          />
          {profile.sportsIntroductionPath ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={sportsIntroductionUploading}
              onClick={onDeleteSportsIntroduction}
              className="rounded-full text-red-200 hover:bg-red-400/10 hover:text-red-100"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete video
            </Button>
          ) : null}
        </div>
      ) : locked ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-100/70">
          <LockKeyhole className="h-3.5 w-3.5" />
          Locked after submission
        </p>
      ) : null}
    </SportsDetailsSection>
  );
}

function SportsVerificationDetailsSection({
  details,
  isInternational,
  loading,
  saving,
  uploading,
  onChange,
  onSave,
  onUploadEvidence,
  onDeleteEvidence,
  onPreviewEvidence,
  profile,
  sportsIntroductionUrl,
  sportsIntroductionUploading,
  sportsIntroductionProgress,
  onUploadSportsIntroduction,
  onDeleteSportsIntroduction,
  locked,
  underReview,
}: {
  details: SportsVerificationDetails;
  isInternational: boolean;
  loading: boolean;
  saving: boolean;
  uploading: SportsVerificationEvidenceKind | null;
  onChange: (details: SportsVerificationDetails) => void;
  onSave?: (details: SportsVerificationDetails) => void | Promise<void>;
  onUploadEvidence?: (kind: SportsVerificationEvidenceKind, file: File) => void | Promise<void>;
  profile: SportsProfileInfo;
  sportsIntroductionUrl?: string | null;
  sportsIntroductionUploading: boolean;
  sportsIntroductionProgress: number;
  onUploadSportsIntroduction?: (file: File) => void;
  onDeleteSportsIntroduction?: () => void;
  onDeleteEvidence?: (
    kind: SportsVerificationEvidenceKind,
  ) => void | Promise<void>;
  onPreviewEvidence?: (
    kind: SportsVerificationEvidenceKind,
    path: string,
  ) => void | Promise<void>;
  locked: boolean;
  underReview: boolean;
}) {
  const setField = (
    field:
      | "fullName"
      | "fatherName"
      | "dateOfBirth"
      | "address"
      | "passportNumber"
      | "certificateNumber"
      | "villageTown"
      | "district"
      | "state"
      | "country",
    value: string,
  ) =>
    onChange({ ...details, [field]: value });

  return (
    <SportsDetailsSection
      icon={<MapPin />}
      title="Verification Details"
      description="These details are used only for Sports Verification and are not shown on your public profile."
    >
      {loading ? (
        <p className="text-sm text-zinc-500">Loading your verification details…</p>
      ) : (
        <div className="space-y-4">
          {underReview ? (
            <div
              data-testid="sports-verification-under-review"
              className="rounded-2xl border border-amber-200/25 bg-amber-200/[0.08] px-4 py-3 text-sm font-semibold text-amber-100"
            >
              Under Review (12 to 72 working hours)
            </div>
          ) : null}
          <div className="space-y-3 rounded-2xl border border-amber-200/15 bg-amber-200/[0.04] p-3">
            <div>
              <p className="text-sm font-semibold text-white">Identity details</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Enter your name, father&apos;s name, and date of birth exactly as shown on your identity
                documents.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs text-zinc-400">
                Full Name
                <Input
                  value={details.fullName}
                  onChange={(event) => setField("fullName", event.target.value)}
                  placeholder="Exactly as on your identity document"
                  maxLength={200}
                  disabled={saving || locked}
                  className="border-white/10 bg-white/[0.04] text-sm text-white"
                />
              </label>
              <label className="space-y-1.5 text-xs text-zinc-400">
                Father&apos;s Name
                <Input
                  value={details.fatherName}
                  onChange={(event) => setField("fatherName", event.target.value)}
                  placeholder="Exactly as on your identity document"
                  maxLength={200}
                  disabled={saving || locked}
                  className="border-white/10 bg-white/[0.04] text-sm text-white"
                />
              </label>
              <label className="space-y-1.5 text-xs text-zinc-400">
                Date of Birth (DOB)
                <Input
                  type="date"
                  value={details.dateOfBirth}
                  onChange={(event) => setField("dateOfBirth", event.target.value)}
                  disabled={saving || locked}
                  className="border-white/10 bg-white/[0.04] text-sm text-white"
                />
              </label>
              <label className="space-y-1.5 text-xs text-zinc-400">
                Sport Certificate Number
                <Input
                  value={details.certificateNumber}
                  onChange={(event) => setField("certificateNumber", event.target.value)}
                  placeholder="Certificate number"
                  maxLength={120}
                  disabled={saving || locked}
                  className="border-white/10 bg-white/[0.04] text-sm text-white"
                />
              </label>
            </div>
            <label className="space-y-1.5 text-xs text-zinc-400">
              Address
              <Textarea
                value={details.address}
                onChange={(event) => setField("address", event.target.value)}
                placeholder="Current residential address"
                maxLength={500}
                disabled={saving || locked}
                className="min-h-20 border-white/10 bg-white/[0.04] text-sm text-white"
              />
            </label>
            {isInternational ? (
              <label className="space-y-1.5 text-xs text-zinc-400">
                Passport Number
                <Input
                  value={details.passportNumber}
                  onChange={(event) => setField("passportNumber", event.target.value)}
                  placeholder="Passport number"
                  maxLength={120}
                  disabled={saving || locked}
                  className="border-white/10 bg-white/[0.04] text-sm text-white"
                />
              </label>
            ) : null}
            <label className="flex cursor-pointer items-start gap-3 pt-1 text-xs leading-5 text-zinc-300">
              <input
                type="checkbox"
                checked={details.identityDetailsConfirmed}
                onChange={(event) =>
                  onChange({ ...details, identityDetailsConfirmed: event.target.checked })
                }
                disabled={saving || locked}
                className="mt-1 h-4 w-4 accent-amber-200"
              />
              <span>
                I confirm that my Full Name, Father&apos;s Name, and DOB match my identity documents exactly.
              </span>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs text-zinc-400">
              Village / Town
              <Input
                value={details.villageTown}
                onChange={(event) => setField("villageTown", event.target.value)}
                placeholder="Village or town"
                maxLength={120}
                disabled={saving || locked}
                className="border-white/10 bg-white/[0.04] text-sm text-white"
              />
            </label>
            <label className="space-y-1.5 text-xs text-zinc-400">
              District
              <Input
                value={details.district}
                onChange={(event) => setField("district", event.target.value)}
                placeholder="District"
                maxLength={120}
                disabled={saving || locked}
                className="border-white/10 bg-white/[0.04] text-sm text-white"
              />
            </label>
            <label className="space-y-1.5 text-xs text-zinc-400">
              State
              <Input
                value={details.state}
                onChange={(event) => setField("state", event.target.value)}
                placeholder="State"
                maxLength={120}
                disabled={saving || locked}
                className="border-white/10 bg-white/[0.04] text-sm text-white"
              />
            </label>
            <label className="space-y-1.5 text-xs text-zinc-400">
              Country
              <Input
                value={details.country}
                onChange={(event) => setField("country", event.target.value)}
                placeholder="Country"
                maxLength={120}
                disabled={saving || locked}
                className="border-white/10 bg-white/[0.04] text-sm text-white"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ReadOnlyVerificationValue
              icon={<Phone className="h-3.5 w-3.5" />}
              label="Mobile Number"
              value={details.mobileNumber || "Not provided on this account"}
            />
            <ReadOnlyVerificationValue
              icon={<Mail className="h-3.5 w-3.5" />}
              label="Gmail / Email"
              value={details.email || "Not provided on this account"}
            />
          </div>

          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.025] p-3">
            <div>
              <p className="text-sm font-semibold text-white">Private verification evidence</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Uploaded files are visible only to you and authorized verification reviewers.
              </p>
            </div>
            <VerificationEvidenceRow
              accept="application/pdf,image/jpeg,image/png"
              evidence={details.sportsCertificate}
              kind="sportsCertificate"
              label="Sports Certificate"
              uploading={uploading}
              onUpload={onUploadEvidence}
               onDelete={onDeleteEvidence}
               onPreview={onPreviewEvidence}
               locked={locked}
            />
            <VerificationEvidenceRow
              accept="image/jpeg,image/png,image/webp"
              evidence={details.tournamentPhoto}
              kind="tournamentPhoto"
              label="Tournament Photo"
              hint="A clear photo from the submitted tournament or competition."
              uploading={uploading}
              onUpload={onUploadEvidence}
              onDelete={onDeleteEvidence}
              onPreview={onPreviewEvidence}
              locked={locked}
            />
            {isInternational ? (
              <>
                <VerificationEvidenceRow
                  accept="application/pdf,image/jpeg,image/png"
                  evidence={details.passportFirstPage}
                  kind="passportFirstPage"
                  label="Passport First Page"
                  uploading={uploading}
                  onUpload={onUploadEvidence}
                   onDelete={onDeleteEvidence}
                   onPreview={onPreviewEvidence}
                   locked={locked}
                />
                <VerificationEvidenceRow
                  accept="application/pdf,image/jpeg,image/png"
                  evidence={details.passportVisaStampPage}
                  kind="passportVisaStampPage"
                  label="Passport Visa / Stamp Page"
                  hint="The page showing the visa or stamp for the tournament/game country."
                  uploading={uploading}
                  onUpload={onUploadEvidence}
                   onDelete={onDeleteEvidence}
                   onPreview={onPreviewEvidence}
                   locked={locked}
                />
              </>
            ) : null}
            <SportsIntroductionSection
              profile={profile}
              isOwner
              sportsIntroductionUrl={sportsIntroductionUrl}
              sportsIntroductionUploading={sportsIntroductionUploading}
              sportsIntroductionProgress={sportsIntroductionProgress}
              onUploadSportsIntroduction={onUploadSportsIntroduction}
              onDeleteSportsIntroduction={onDeleteSportsIntroduction}
              locked={locked}
            />
          </div>

          <Button
            type="button"
            disabled={saving || locked || !onSave}
            onClick={() => void onSave?.(verificationDraftOr(details))}
            className="w-full rounded-full bg-amber-200 text-black hover:bg-amber-100"
          >
            {saving ? "Saving verification details…" : "Save Verification Details"}
          </Button>
        </div>
      )}
    </SportsDetailsSection>
  );
}

function verificationDraftOr(details: SportsVerificationDetails) {
  return {
    ...details,
    fullName: details.fullName.trim(),
    fatherName: details.fatherName.trim(),
    dateOfBirth: details.dateOfBirth.trim(),
    address: details.address.trim(),
    passportNumber: details.passportNumber.trim(),
    certificateNumber: details.certificateNumber.trim(),
    villageTown: details.villageTown.trim(),
    district: details.district.trim(),
    state: details.state.trim(),
    country: details.country.trim() || "India",
  };
}

function ReadOnlyVerificationValue({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate text-sm text-zinc-300">{value}</p>
    </div>
  );
}

function VerificationEvidenceRow({
  accept,
  evidence,
  kind,
  label,
  hint,
  uploading,
  onUpload,
  onDelete,
  onPreview,
  locked,
}: {
  accept: string;
  evidence: SportsVerificationDetails["sportsCertificate"];
  kind: SportsVerificationEvidenceKind;
  label: string;
  hint?: string;
  uploading: SportsVerificationEvidenceKind | null;
  onUpload?: (kind: SportsVerificationEvidenceKind, file: File) => void | Promise<void>;
  onDelete?: (kind: SportsVerificationEvidenceKind) => void | Promise<void>;
  onPreview?: (kind: SportsVerificationEvidenceKind, path: string) => void | Promise<void>;
  locked: boolean;
}) {
  const inputId = `sports-verification-${kind}`;
  const isUploading = uploading === kind;
  return (
    <div className="flex flex-wrap items-start gap-3 rounded-xl border border-white/10 bg-black/10 p-3">
      <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{hint || "Private upload"}</p>
        <p className="mt-1 text-xs text-zinc-400">{evidence ? "Uploaded" : "Not uploaded"}</p>
      </div>
      <div className="ml-auto flex shrink-0 flex-wrap justify-end gap-2">
        {evidence && onPreview ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void onPreview(kind, evidence.path)}
            className="rounded-full text-amber-100 hover:bg-amber-200/10"
          >
            Preview
          </Button>
        ) : null}
        {evidence && onDelete && !locked ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isUploading}
            onClick={() => void onDelete(kind)}
            className="rounded-full text-red-200 hover:bg-red-400/10 hover:text-red-100"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        ) : null}
        {!locked ? (
          <label
            htmlFor={inputId}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-200/20 ${
              isUploading ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            {isUploading ? "Uploading…" : evidence ? "Replace" : "Upload"}
          </label>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-500">
            <LockKeyhole className="h-3.5 w-3.5" />
            Locked
          </span>
        )}
      </div>
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={isUploading || locked || !onUpload}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) void onUpload?.(kind, file);
        }}
      />
    </div>
  );
}

export function VerifiedSportsProfilePromo({ onOpenDetails }: { onOpenDetails: () => void }) {
  const playerPoints = [
    "Sport",
    "Event / Position",
    "National / International",
    "Tournament Details",
    "Medals",
    "Achievements",
    "Coach Details",
    "Private Certificate/Documents",
  ];
  const coachPoints = [
    "Coach Name",
    "Sport",
    "Coaching Qualification",
    "NS NIS / Qualification Year",
    "Institution",
    "Coaching Experience",
    "Tournament / Team Details",
    "Private Qualification Documents",
  ];
  const verificationSteps = [
    "Sports Details",
    "Documents",
    "Verification Video",
    "Terms & Conditions",
    "I Agree",
    "Submit for Verification",
  ];

  return (
    <section
      data-testid="promo-verified-sports-profile"
      className="group relative isolate overflow-hidden rounded-[2rem] border border-amber-200/25 bg-[#111017] shadow-[0_24px_70px_-30px_rgba(245,189,72,0.38)] animate-rise"
    >
      <div className="pointer-events-none absolute -right-24 -top-28 -z-10 h-72 w-72 rounded-full bg-amber-300/[0.12] blur-3xl transition-transform duration-700 group-hover:scale-110" />
      <div className="pointer-events-none absolute -bottom-28 -left-24 -z-10 h-56 w-56 rounded-full bg-orange-200/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/70 to-transparent" />

      <div className="relative px-5 pb-5 pt-6 sm:px-6 sm:pb-6">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-amber-200/30 bg-amber-200/[0.1] text-amber-200 shadow-[0_8px_24px_-12px_rgba(245,189,72,0.9)]">
            <BadgeCheck className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p
              data-testid="text-verified-profile-promo-title"
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200/80"
            >
              🏆 YOURWORLD VERIFIED SPORTS PROFILE
            </p>
            <h2
              data-testid="text-verified-profile-promo-tagline"
              className="mt-2 max-w-md font-display text-[1.55rem] font-semibold leading-[1.05] tracking-[-0.045em] text-white sm:text-[1.8rem]"
            >
              Your Talent. Your Achievement. Your Identity. Verified.
            </h2>
          </div>
        </div>

        <p
          data-testid="text-verified-profile-promo-intro"
          className="mt-5 max-w-lg text-sm leading-6 text-zinc-300"
        >
          Players and Coaches can create a professional Sports Profile directly on YourWorld.
          Build a credible public identity backed by private verification materials.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <PromoList
            testId="promo-player-profile-points"
            eyebrow="Player profile"
            icon={<Trophy className="h-4 w-4" />}
            points={playerPoints}
          />
          <PromoList
            testId="promo-coach-profile-points"
            eyebrow="Coach profile"
            icon={<UserRound className="h-4 w-4" />}
            points={coachPoints}
          />
        </div>

        <div
          data-testid="promo-verification-process"
          className="mt-3 rounded-2xl border border-amber-200/15 bg-black/20 p-4"
        >
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-amber-200" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200/80">
              Verification process
            </p>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {verificationSteps.map((step, index) => (
              <div
                key={step}
                data-testid={`promo-verification-step-${index + 1}`}
                className="flex min-w-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-2.5 py-2 text-xs text-zinc-300"
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-200/10 text-[10px] font-bold text-amber-200">
                  {index + 1}
                </span>
                <span className="min-w-0 leading-4">{step}</span>
                {index < verificationSteps.length - 1 ? (
                  <ArrowRight className="ml-auto hidden h-3.5 w-3.5 shrink-0 text-amber-200/50 sm:block" />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div
            data-testid="promo-verified-badge-message"
            className="rounded-2xl border border-amber-200/25 bg-amber-200/[0.08] p-4"
          >
            <div className="flex items-start gap-2.5">
              <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
              <p className="text-xs leading-5 text-amber-50/90">
                Successful verification gives a premium YourWorld Verified Sports Badge and verified
                sports information can be displayed publicly.
              </p>
            </div>
          </div>
          <div
            data-testid="promo-privacy-message"
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
          >
            <div className="flex items-start gap-2.5">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300" />
              <p className="text-xs leading-5 text-zinc-300">
                Certificates and verification documents remain private and are accessible only through
                authorized verification access.
              </p>
            </div>
          </div>
        </div>

        <div
          data-testid="promo-false-information-policy"
          className="mt-3 rounded-2xl border border-red-200/15 bg-red-950/20 p-4"
        >
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200/80">
                Accuracy matters
              </p>
              <p className="mt-1.5 text-xs leading-5 text-zinc-300">
                Genuine and accurate information is required; fake, forged, altered or misleading
                certificates/achievements may result in rejection or revocation, badge removal, account
                restriction/suspension, and appropriate legal action or other remedies permitted under
                applicable law.
              </p>
            </div>
          </div>
        </div>

        <div
          data-testid="promo-verified-profile-footer"
          className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-4"
        >
          <p className="flex items-center gap-2 text-[11px] text-zinc-500">
            <Check className="h-3.5 w-3.5 text-amber-200" />
            A premium sports credential built for public trust.
          </p>
          <Button
            type="button"
            data-testid="button-open-sports-details"
            className="w-full rounded-full bg-amber-200 text-black hover:bg-amber-100"
            onClick={onOpenDetails}
          >
            Open Sports Details
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function PromoList({
  testId,
  eyebrow,
  icon,
  points,
}: {
  testId: string;
  eyebrow: string;
  icon: React.ReactNode;
  points: string[];
}) {
  return (
    <div data-testid={testId} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center gap-2 text-amber-200">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-200/10">{icon}</span>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-200">{eyebrow}</p>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {points.map((point, index) => (
          <li
            key={point}
            data-testid={`${testId}-item-${index + 1}`}
            className="flex items-start gap-2 text-xs leading-4 text-zinc-400"
          >
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-200/80" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SportsTournamentSection({
  profile,
  editable,
  onEdit,
}: {
  profile: SportsProfileInfo;
  editable: boolean;
  onEdit: (field: SportsEditorField) => void;
}) {
  const isNational = profile.status === "National";
  const sectionTitle =
    profile.status === "National"
      ? "National Competition"
      : profile.status === "International"
        ? "International Competitions"
        : "Tournaments / Competitions";
  const tournaments: SportsTournament[] =
    profile.tournamentDetails?.length
      ? profile.tournamentDetails
      : profile.tournaments.map((name) => ({
          name: name.replace(/^tournament\s*:\s*/i, "").trim(),
          date: "",
          level: "",
          result: "",
        }));

  return (
    <SportsDetailsSection
      icon={<CalendarDays />}
      title={sectionTitle}
      description={
        isNational
          ? "Select one of the three recognized national competitions and record verified medal achievements."
          : "Build a professional sports timeline from recognized competitions."
      }
    >
      {tournaments.length ? (
        <ol data-testid="sports-tournament-timeline" className="space-y-3">
          {tournaments.map((item, index) => {
            const verifiedNationalMedal =
              isNational &&
              profile.verified &&
              isNationalCompetition(item.name) &&
              Boolean(item.medal && item.medal !== "No Medal");
            const displayMedal = isNational
              ? verifiedNationalMedal
                ? item.medal
                : ""
              : item.medal;
            const metadata = [
              formatTournamentDateRange(item),
              item.country,
              item.hostLocation,
              item.level ? `Level: ${item.level}` : "",
              item.result ? `Result: ${item.result}` : "",
              displayMedal ? `Medal: ${displayMedal}` : "",
              item.eventPosition ? `Event: ${item.eventPosition}` : "",
              item.teamCountry ? `Team / Country: ${item.teamCountry}` : "",
              item.roleResponsibility ? `Role: ${item.roleResponsibility}` : "",
            ].filter(Boolean);

            return (
              <li
                key={`${item.name}-${index}`}
                data-testid={`sports-tournament-entry-${index + 1}`}
                className="relative flex gap-3"
              >
                <span className="relative mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-amber-200/25 bg-amber-200/10 text-amber-200">
                  <Trophy className="h-4 w-4" />
                </span>
                {index < tournaments.length - 1 ? (
                  <span className="absolute left-4 top-9 h-[calc(100%+0.25rem)] w-px bg-amber-200/15" />
                ) : null}
                <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                  {verifiedNationalMedal ? (
                    <div data-testid={`verified-national-medal-${index + 1}`} className="space-y-1">
                      <p className="font-semibold uppercase tracking-wide text-white">
                        🇮🇳 {nationalCompetitionLabel(item.name)}
                      </p>
                      <p className="text-sm font-semibold text-amber-200">
                        {medalEmoji(item.medal)} {item.medal} Medal
                      </p>
                      {tournamentYear(item) ? (
                        <p className="text-xs text-zinc-400">📅 {tournamentYear(item)}</p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="font-semibold text-white">{item.name}</p>
                  )}
                  {metadata.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {metadata.map((value, metadataIndex) => (
                        <span
                          key={`${value}-${metadataIndex}`}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-zinc-300"
                        >
                          {value}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p data-testid="sports-tournament-empty" className="text-sm text-zinc-500">
          No public tournament or competition details listed.
        </p>
      )}
      {editable ? (
        <EditLink label="Add or edit tournaments / competitions" onClick={() => onEdit("tournaments")} />
      ) : null}
    </SportsDetailsSection>
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

function CoachProfileSection({
  profile,
  editable,
  onEdit,
}: {
  profile: SportsProfileInfo;
  editable: boolean;
  onEdit: (field: SportsEditorField) => void;
}) {
  return (
    <SportsDetailsSection
      icon={<ShieldCheck />}
      title="COACH PROFILE"
      description="Professional coaching identity and qualification details."
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <CoachProfileValue
          label="Coach Name"
          value={profile.coachName}
          editable={editable}
          onEdit={() => onEdit("coachName")}
        />
        <CoachProfileValue
          label="Sport"
          value={profile.sport}
          editable={editable}
          onEdit={() => onEdit("sport")}
        />
        <CoachProfileValue
          label="Coaching Qualification"
          value={profile.coachQualification}
          editable={editable}
          onEdit={() => onEdit("coachQualification")}
        />
        <CoachProfileValue
          label="Qualification / NS NIS Year"
          value={profile.qualificationYear}
          editable={editable}
          onEdit={() => onEdit("qualificationYear")}
        />
        <CoachProfileValue
          label="Institution / Where completed"
          value={profile.institution}
          editable={editable}
          onEdit={() => onEdit("institution")}
        />
        <CoachProfileValue
          label="Coaching Experience"
          value={profile.coachingExperience}
          editable={editable}
          onEdit={() => onEdit("coachingExperience")}
        />
        <CoachProfileValue
          label="Tournament / Team details"
          value={profile.teamDetails}
          editable={editable}
          onEdit={() => onEdit("teamDetails")}
        />
      </div>
    </SportsDetailsSection>
  );
}

function CoachProfileValue({
  label,
  value,
  editable,
  onEdit,
}: {
  label: string;
  value: string;
  editable: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
      {editable ? <EditLink label="Edit" onClick={onEdit} /> : null}
    </div>
  );
}

function TournamentEntryEditor({
  item,
  index,
  role,
  representation,
  onChange,
  onRemove,
}: {
  item: SportsTournament;
  index: number;
  role: SportsProfileDraft["role"];
  representation: SportsProfileDraft["representation"];
  onChange: (index: number, changes: Partial<SportsTournament>) => void;
  onRemove: () => void;
}) {
  const isNational = representation === "National";
  const competitionListId =
    representation === "International"
      ? "international-sports-competitions"
      : "recognized-sports-competitions";
  const showNationalMedal = isNational && isNationalCompetition(item.name);

  return (
    <div className={editorCardClass}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">
          Tournament / Competition {index + 1}
        </p>
        <button
          type="button"
          data-testid={`button-remove-tournament-${index + 1}`}
          aria-label={`Remove tournament ${index + 1}`}
          onClick={onRemove}
          className="text-zinc-500 transition-colors hover:text-red-300"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <EditorField
        label={isNational ? "National Competition" : "International Competition"}
        hint={
          isNational
            ? "Choose one of the three recognized national competitions."
            : "Search recognized international competitions or enter another one."
        }
      >
        {isNational ? (
          <select
            data-testid={`select-national-competition-${index + 1}`}
            value={item.name}
            onChange={(event) => onChange(index, { name: event.target.value, medal: undefined })}
            className={editorSelectClass}
          >
            <option value="">Select national competition</option>
            {NATIONAL_COMPETITIONS.map((competition) => (
              <option key={competition} value={competition}>
                {competition}
              </option>
            ))}
          </select>
        ) : (
          <Input
            list={competitionListId}
            data-testid={`input-tournament-name-${index + 1}`}
            value={item.name}
            onChange={(event) => onChange(index, { name: event.target.value })}
            className={editorInputClass}
            placeholder="Search or enter a competition"
          />
        )}
      </EditorField>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-400">Start Year</span>
          <select
            data-testid={`select-tournament-start-year-${index + 1}`}
            value={item.startYear ?? ""}
            onChange={(event) => onChange(index, { startYear: event.target.value })}
            className={editorSelectClass}
          >
            <option value="">Select year</option>
            {TOURNAMENT_YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-400">Start Date</span>
          <Input
            type="date"
            data-testid={`input-tournament-start-date-${index + 1}`}
            value={item.startDate ?? ""}
            onChange={(event) => onChange(index, { startDate: event.target.value })}
            className={editorInputClass}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-400">End Year</span>
          <select
            data-testid={`select-tournament-end-year-${index + 1}`}
            value={item.endYear ?? ""}
            onChange={(event) => onChange(index, { endYear: event.target.value })}
            className={editorSelectClass}
          >
            <option value="">Select year</option>
            {TOURNAMENT_YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-400">End Date</span>
          <Input
            type="date"
            data-testid={`input-tournament-end-date-${index + 1}`}
            value={item.endDate ?? ""}
            onChange={(event) => onChange(index, { endDate: event.target.value })}
            className={editorInputClass}
          />
        </label>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Input
          data-testid={`input-tournament-country-${index + 1}`}
          value={item.country ?? ""}
          onChange={(event) => onChange(index, { country: event.target.value })}
          className={editorInputClass}
          placeholder="Country"
        />
        <Input
          data-testid={`input-tournament-location-${index + 1}`}
          value={item.hostLocation ?? ""}
          onChange={(event) => onChange(index, { hostLocation: event.target.value })}
          className={editorInputClass}
          placeholder="City / host location"
        />
        {isNational ? (
          showNationalMedal ? (
            <select
              data-testid={`select-national-medal-${index + 1}`}
              value={item.medal === "No Medal" ? "" : item.medal ?? ""}
              onChange={(event) =>
                onChange(index, {
                  medal: event.target.value ? (event.target.value as TournamentMedal) : undefined,
                })
              }
              className={editorSelectClass}
            >
              <option value="">Select medal (optional)</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
              <option value="Bronze">Bronze</option>
            </select>
          ) : null
        ) : (
          <select
            data-testid={`select-tournament-medal-${index + 1}`}
            value={item.medal ?? ""}
            onChange={(event) =>
              onChange(index, {
                medal: event.target.value ? (event.target.value as TournamentMedal) : undefined,
              })
            }
            className={editorSelectClass}
          >
            <option value="">Medal (optional)</option>
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
            <option value="Bronze">Bronze</option>
            <option value="No Medal">No Medal</option>
          </select>
        )}
        {role === "Coach" ? (
          <>
            <Input
              data-testid={`input-tournament-team-country-${index + 1}`}
              value={item.teamCountry ?? ""}
              onChange={(event) => onChange(index, { teamCountry: event.target.value })}
              className={editorInputClass}
              placeholder="Team / Country coached"
            />
            <Input
              data-testid={`input-tournament-role-${index + 1}`}
              value={item.roleResponsibility ?? ""}
              onChange={(event) => onChange(index, { roleResponsibility: event.target.value })}
              className={editorInputClass}
              placeholder="Role / Responsibility"
            />
          </>
        ) : null}
      </div>
    </div>
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
  onOpenVerificationReview,
}: {
  open: boolean;
  field: SportsEditorField | null;
  draft: SportsProfileDraft;
  setDraft: React.Dispatch<React.SetStateAction<SportsProfileDraft>>;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onOpenVerificationReview?: () => void;
}) {
  const updateTournament = (index: number, changes: Partial<SportsTournament>) => {
    setDraft((current) => ({
      ...current,
      tournaments: current.tournaments.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...changes } : entry,
      ),
    }));
  };

  const title =
    field === "username"
      ? "Edit sports username"
      : field === "role"
        ? "Choose role"
      : field === "sport"
        ? "Choose your sport"
        : field === "eventPosition"
          ? "Edit position / event"
          : field === "representation"
            ? "Choose representation"
            : field === "tournaments"
              ? "Add tournaments / competitions"
              : field === "medals"
                ? "Edit medals"
                : field === "achievements"
                  ? "Edit achievements"
                  : field === "coachQualification"
                    ? "Edit coaching qualification"
                    : field === "qualificationYear"
                      ? "Edit qualification year"
                      : field === "institution"
                        ? "Edit institution"
                        : field === "coachingExperience"
                          ? "Edit coaching experience"
                          : field === "teamDetails"
                            ? "Edit tournament / team details"
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

        {field === "role" ? (
          <EditorField label="Role" hint="Choose one sports profile role.">
            <select
              value={draft.role}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  role: event.target.value as SportsProfileDraft["role"],
                }))
              }
              className={editorSelectClass}
            >
              <option value="Player">Player</option>
              <option value="Coach">Coach</option>
            </select>
          </EditorField>
        ) : null}

        {field === "coachName" ? (
          <EditorField label="Coach Name">
            <Input
              value={draft.coachName}
              onChange={(event) => setDraft((current) => ({ ...current, coachName: event.target.value }))}
              className={editorInputClass}
              placeholder="Your coaching name"
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
            <datalist id="recognized-sports-competitions">
              {RECOGNIZED_COMPETITIONS.map((competition) => (
                <option key={competition} value={competition} />
              ))}
            </datalist>
            <datalist id="international-sports-competitions">
              {INTERNATIONAL_COMPETITIONS.map((competition) => (
                <option key={competition} value={competition} />
              ))}
            </datalist>
            {draft.tournaments.map((item, index) => (
              <TournamentEntryEditor
                key={`tournament-${index}`}
                item={item}
                index={index}
                role={draft.role}
                representation={draft.representation}
                onChange={updateTournament}
                onRemove={() =>
                  setDraft((current) => ({
                    ...current,
                    tournaments: current.tournaments.filter((_, itemIndex) => itemIndex !== index),
                  }))
                }
              />
            ))}
            <AddRowButton
              testId="button-add-tournament"
              label="Add tournament / competition"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  tournaments: [
                    ...current.tournaments,
                    {
                      name: "",
                      date: "",
                      level: "",
                      result: "",
                      startYear: "",
                      startDate: "",
                      endYear: "",
                      endDate: "",
                      country: "",
                      hostLocation: "",
                      medal: undefined,
                      eventPosition: "",
                      teamCountry: "",
                      roleResponsibility: "",
                    },
                  ],
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
          <EditorField label="Coaching Qualification">
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

        {field === "qualificationYear" ? (
          <EditorField label="Qualification / NS NIS Year">
            <Input
              value={draft.qualificationYear}
              onChange={(event) =>
                setDraft((current) => ({ ...current, qualificationYear: event.target.value }))
              }
              className={editorInputClass}
              placeholder="2024"
            />
          </EditorField>
        ) : null}

        {field === "institution" ? (
          <EditorField label="Institution / Where completed">
            <Input
              value={draft.institution}
              onChange={(event) => setDraft((current) => ({ ...current, institution: event.target.value }))}
              className={editorInputClass}
              placeholder="Institution name"
            />
          </EditorField>
        ) : null}

        {field === "coachingExperience" ? (
          <EditorField label="Coaching Experience">
            <Textarea
              value={draft.coachingExperience}
              onChange={(event) =>
                setDraft((current) => ({ ...current, coachingExperience: event.target.value }))
              }
              rows={5}
              className={`${editorInputClass} min-h-28`}
              placeholder="Years, teams, and coaching experience"
            />
          </EditorField>
        ) : null}

        {field === "teamDetails" ? (
          <EditorField label="Tournament / Team details">
            <Textarea
              value={draft.teamDetails}
              onChange={(event) => setDraft((current) => ({ ...current, teamDetails: event.target.value }))}
              rows={5}
              className={`${editorInputClass} min-h-28`}
              placeholder="Teams coached, tournaments, and results"
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
            disabled={saving}
            onClick={() => {
              if (field === "verification") {
                onOpenChange(false);
                onOpenVerificationReview?.();
                return;
              }
              void onSave();
            }}
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

function AddRowButton({
  label,
  onClick,
  testId,
}: {
  label: string;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
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
