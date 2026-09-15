import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { C as Trash2, Ct as MapPin, Dn as BadgeCheck, Gt as FileCheckCorner, Jt as ExternalLink, Qt as Download, Sn as CalendarDays, St as Medal, Wt as FileText, Zt as Earth, _ as Upload, at as Phone, b as Trophy, et as Plus, h as UserRound, l as Video, mn as ChevronRight, st as Pencil, wt as Mail, z as ShieldCheck } from "../_libs/lucide-react.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, t as Dialog } from "./dialog-CZ1_F9-X.mjs";
import { t as Button } from "./button-CoK01aFA.mjs";
import { t as Input } from "./input-DEjJP4kV.mjs";
import { t as Textarea } from "./textarea-DzTTW2g-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/SportsProfile-BLQg8ciW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SPORTS_CATALOGUE = [
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
	"Wrestling"
];
var RECOGNIZED_COMPETITIONS = [
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
	"Other Recognized Competition"
];
var NATIONAL_COMPETITIONS = [
	"National Games (India)",
	"All India Inter-University / All India University Games",
	"Khelo India Games"
];
var INTERNATIONAL_COMPETITIONS = RECOGNIZED_COMPETITIONS.filter((competition) => !NATIONAL_COMPETITIONS.includes(competition));
var TOURNAMENT_YEARS = Array.from({ length: 126 }, (_, index) => String((/* @__PURE__ */ new Date()).getFullYear() - index));
function getSportsProfile(profile) {
	const category = profile.category.trim();
	const roleMatch = /^(athlete|player|coach)(?:\s*[-·•|:]|$)/i.exec(category);
	if (!roleMatch) return null;
	const role = roleMatch[1].toLowerCase() === "coach" ? "Coach" : "Player";
	const source = `${category} ${profile.bio}`.toLowerCase();
	const statusSource = extractLabeledValue(profile.bio, [
		"representation",
		"represents",
		"status"
	]) || source;
	const status = statusSource.toLowerCase().includes("international") ? "International" : statusSource.toLowerCase().includes("national") ? "National" : "Not recorded";
	const verified = profile.is_verified === true;
	const tournamentDetails = parseTournamentDetails(profile.bio);
	const medalDetails = parseMedalDetails(profile.bio);
	const tournamentLines = extractRelevantLines(profile.bio, /tournament|league|championship|cup|games|meet/i);
	const medalLines = extractRelevantLines(profile.bio, /medal|gold|silver|bronze/i);
	return {
		badge: role === "Coach" ? verified ? "🏆 VERIFIED COACH" : "COACH PROFILE" : verified ? status === "International" ? "🌍 INTERNATIONAL PLAYER" : status === "National" ? "🇮🇳 NATIONAL PLAYER" : "✅ VERIFIED PLAYER" : "PLAYER PROFILE",
		role,
		username: profile.username,
		sport: inferSport(category, profile.bio),
		eventPosition: extractLabeledValue(profile.bio, [
			"event",
			"event/position",
			"position",
			"specialty"
		]) || "Not recorded",
		status,
		represents: extractLabeledValue(profile.bio, [
			"represents",
			"country",
			"team"
		]) || profile.location.trim() || "Not specified",
		verified,
		verificationRequested: profile.verification_requested === true,
		sportsIntroductionPath: extractLabeledValue(profile.bio, ["sports introduction", "sports introduction video"]) || void 0,
		publicDetails: stripSportsFields(profile.bio),
		tournaments: tournamentDetails.length ? tournamentDetails.map(formatTournament) : tournamentLines,
		medals: medalDetails.length ? medalDetails.map(formatMedal) : medalLines,
		tournamentDetails,
		medalDetails,
		achievements: extractRelevantLines(profile.bio, /achievement|award|champion|record|trophy/i),
		coachName: extractLabeledValue(profile.bio, ["coach name"]) || profile.displayName?.trim() || profile.username?.trim() || "Not recorded",
		coachQualification: extractLabeledValue(profile.bio, [
			"coaching qualification",
			"coach / qualification",
			"coach qualification",
			"qualification",
			"qualifications",
			"license",
			"licence",
			"certification",
			"certified"
		]) || "Not recorded",
		qualificationYear: extractLabeledValue(profile.bio, [
			"qualification / ns nis year",
			"qualification year",
			"ns nis year",
			"nsnis year"
		]) || "Not recorded",
		institution: extractLabeledValue(profile.bio, [
			"institution",
			"where completed",
			"completed at"
		]) || "Not recorded",
		coachingExperience: extractLabeledValue(profile.bio, ["coaching experience", "experience"]) || "Not recorded",
		teamDetails: extractLabeledValue(profile.bio, ["tournament / team details", "team details"]) || "Not recorded"
	};
}
function toSportsProfileDraft(profile) {
	return {
		username: profile.username ?? "",
		role: profile.role,
		sport: profile.sport === "Not specified" ? "" : profile.sport,
		eventPosition: profile.eventPosition === "Not recorded" ? "" : profile.eventPosition,
		representation: profile.status === "Not recorded" ? "" : profile.status,
		tournaments: profile.tournamentDetails?.length ? profile.tournamentDetails : profile.tournaments.map((name) => ({
			name: name.replace(/^tournament\s*:\s*/i, "").trim(),
			date: "",
			level: "",
			result: ""
		})),
		medals: profile.medalDetails?.length ? profile.medalDetails : profile.medals.map((line) => ({
			type: /silver/i.test(line) ? "Silver" : /bronze/i.test(line) ? "Bronze" : "Gold",
			tournament: line.replace(/^medal\s*:\s*/i, "").trim(),
			year: ""
		})),
		achievements: profile.achievements.join("\n"),
		coachName: profile.coachName === "Not recorded" ? "" : profile.coachName,
		coachQualification: profile.coachQualification === "Not recorded" ? "" : profile.coachQualification,
		qualificationYear: profile.qualificationYear === "Not recorded" ? "" : profile.qualificationYear,
		institution: profile.institution === "Not recorded" ? "" : profile.institution,
		coachingExperience: profile.coachingExperience === "Not recorded" ? "" : profile.coachingExperience,
		teamDetails: profile.teamDetails === "Not recorded" ? "" : profile.teamDetails,
		sportsIntroductionPath: profile.sportsIntroductionPath ?? ""
	};
}
function serializeSportsProfileBio(currentBio, draft) {
	const preserved = currentBio.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !isSportsFieldLine(line));
	const fields = draft.role === "Coach" ? [
		draft.sport.trim() ? `Sport: ${draft.sport.trim()}` : "",
		draft.coachName.trim() ? `Coach Name: ${draft.coachName.trim()}` : "",
		draft.coachQualification.trim() ? `Coaching Qualification: ${draft.coachQualification.trim()}` : "",
		draft.qualificationYear.trim() ? `Qualification / NS NIS Year: ${draft.qualificationYear.trim()}` : "",
		draft.institution.trim() ? `Institution / Where completed: ${draft.institution.trim()}` : "",
		draft.coachingExperience.trim() ? `Coaching Experience: ${draft.coachingExperience.trim()}` : "",
		draft.sportsIntroductionPath?.trim() ? `Sports Introduction: ${draft.sportsIntroductionPath.trim()}` : "",
		...draft.tournaments.filter((item) => item.name.trim()).map(serializeTournament),
		draft.teamDetails.trim() ? `Tournament / Team details: ${draft.teamDetails.trim()}` : ""
	].filter(Boolean) : [
		draft.sport.trim() ? `Sport: ${draft.sport.trim()}` : "",
		draft.eventPosition.trim() ? `Event / position: ${draft.eventPosition.trim()}` : "",
		draft.representation ? `Representation: ${draft.representation}` : "",
		draft.sportsIntroductionPath?.trim() ? `Sports Introduction: ${draft.sportsIntroductionPath.trim()}` : "",
		...draft.tournaments.filter((item) => item.name.trim()).map(serializeTournament),
		...draft.medals.filter((item) => item.tournament.trim() || item.year.trim()).map((item) => [
			"Medal:",
			item.type,
			item.tournament.trim(),
			item.year.trim()
		].filter(Boolean).join(" | ")),
		...draft.achievements.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).map((item) => `Achievement: ${item}`)
	].filter(Boolean);
	return [...preserved, ...fields].join("\n").trim();
}
function inferSport(category, bio) {
	const categorySport = category.replace(/^(athlete|player|coach)\b/i, "").replace(/^[\s·•:|-]+/, "").trim();
	if (categorySport) return categorySport;
	const labeledSport = extractLabeledValue(bio, [
		"sport",
		"sports",
		"discipline",
		"game"
	]);
	if (labeledSport) return labeledSport;
	const normalizedHashtag = (bio.match(/#([a-z][a-z0-9-]{2,})/i)?.[1])?.replace(/(coach|player|athlete)$/i, "");
	if (normalizedHashtag && !/^(sports?|training|fitness|ytshorts)$/i.test(normalizedHashtag)) return humanize(normalizedHashtag);
	return "Not specified";
}
function extractLabeledValue(text, labels) {
	const labelPattern = labels.join("|");
	return new RegExp(`(?:${labelPattern})\\s*[:\\-]\\s*([^\\n|]+)`, "i").exec(text)?.[1]?.trim() || null;
}
function extractRelevantLines(text, pattern) {
	return Array.from(new Set(text.split(/\r?\n|[|;]/).map((line) => line.trim()).filter((line) => line && pattern.test(line) && !isSportsFieldLine(line))));
}
function parseTournamentDetails(text) {
	return text.split(/\r?\n/).map((line) => line.match(/^\s*tournament\s*:\s*(.+)$/i)?.[1]).filter((value) => Boolean(value)).map(parseTournamentValue).filter((item) => item.name);
}
function parseMedalDetails(text) {
	return text.split(/\r?\n/).map((line) => line.match(/^\s*medal\s*:\s*(.+)$/i)?.[1]).filter((value) => Boolean(value)).map((value) => {
		const [type = "Gold", tournament = "", year = ""] = value.split(/\s*\|\s*/).map((part) => part.trim());
		return {
			type: /silver/i.test(type) ? "Silver" : /bronze/i.test(type) ? "Bronze" : "Gold",
			tournament,
			year
		};
	}).filter((item) => item.tournament || item.year);
}
function formatTournament(item) {
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
		item.level
	].filter(Boolean).join(" · ");
}
function parseTournamentValue(value) {
	const parts = value.split(/\s*\|\s*/).map((part) => part.trim());
	const keyed = /* @__PURE__ */ new Map();
	const legacyParts = [];
	for (const part of parts) {
		const separator = part.indexOf(":");
		if (separator === -1) {
			legacyParts.push(part);
			continue;
		}
		const key = part.slice(0, separator).trim().toLowerCase().replace(/\s+/g, " ");
		const fieldValue = part.slice(separator + 1).trim();
		if ([
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
			"date"
		].includes(key)) keyed.set(key, fieldValue);
		else legacyParts.push(part);
	}
	if (!keyed.size) {
		const [name = "", date = "", level = "", result = ""] = parts;
		return {
			name,
			date,
			level,
			result
		};
	}
	if (!Array.from(keyed.keys()).some((key) => key !== "tournament" && key !== "competition")) {
		const [date = "", level = "", result = ""] = legacyParts;
		return {
			name: keyed.get("tournament") || keyed.get("competition") || legacyParts[0] || "",
			date,
			level,
			result
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
		hostLocation: keyed.get("city / host location") || keyed.get("host location") || keyed.get("city") || "",
		medal: normalizeTournamentMedal(keyed.get("medal")),
		eventPosition: keyed.get("event / position") || keyed.get("event") || keyed.get("position") || "",
		teamCountry: keyed.get("team / country") || keyed.get("team / country coached") || "",
		roleResponsibility: keyed.get("role / responsibility") || ""
	};
}
function normalizeTournamentMedal(value) {
	if (!value) return void 0;
	if (/silver/i.test(value)) return "Silver";
	if (/bronze/i.test(value)) return "Bronze";
	if (/gold/i.test(value)) return "Gold";
	if (/no medal|none/i.test(value)) return "No Medal";
}
function isNationalCompetition(name) {
	return NATIONAL_COMPETITIONS.includes(name);
}
function nationalCompetitionLabel(name) {
	if (name === "National Games (India)") return "NATIONAL GAMES";
	if (name === "Khelo India Games") return "KHELO INDIA GAMES";
	return "ALL INDIA UNIVERSITY";
}
function tournamentYear(item) {
	return item.startYear || item.endYear || item.startDate?.slice(0, 4) || item.date.match(/\b\d{4}\b/)?.[0] || "";
}
function medalEmoji(medal) {
	if (medal === "Gold") return "🥇";
	if (medal === "Silver") return "🥈";
	if (medal === "Bronze") return "🥉";
	return "";
}
function serializeTournament(item) {
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
		item.level.trim() ? `Level: ${item.level.trim()}` : ""
	].filter(Boolean).join(" | ");
}
function formatTournamentDate(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
	const [year, month, day] = value.split("-").map(Number);
	return new Intl.DateTimeFormat("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		timeZone: "UTC"
	}).format(new Date(Date.UTC(year, month - 1, day)));
}
function formatTournamentDateRange(item) {
	const start = item.startDate || item.date || item.startYear || "";
	const end = item.endDate || item.endYear || "";
	if (!start) return end ? formatTournamentDate(end) : "";
	if (!end) return formatTournamentDate(start);
	return `${formatTournamentDate(start)} – ${formatTournamentDate(end)}`;
}
function formatMedal(item) {
	return [
		item.type,
		item.tournament,
		item.year
	].filter(Boolean).join(" · ");
}
function isSportsFieldLine(line) {
	return /^(sport|sports|discipline|game|event(?:\s*\/\s*position)?|position|specialty|representation|represents|status|country|team|tournament|medal|achievement|award|sports\s+introduction(?:\s+video)?|coach(?:\s*\/\s*qualification|\s+qualification)?|coach\s+name|coaching\s+qualification|qualification(?:\s*\/\s*ns\s*nis\s*year|\s+year)?|qualifications|license|licence|certification|certified|institution(?:\s*\/\s*where\s+completed)?|where\s+completed|completed\s+at|coaching\s+experience|experience|tournament\s*\/\s*team\s+details|team\s+details|sports\s*id|sportsid)\s*:/i.test(line);
}
function stripSportsFields(text) {
	return text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !isSportsFieldLine(line)).join("\n");
}
function humanize(value) {
	return value.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function SportsProfileBadge({ badge, verified }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "mt-1.5 inline-flex items-center gap-1 rounded-full border border-amber-200/30 bg-amber-200/10 px-2.5 py-1 text-[10px] font-bold text-amber-100",
		children: [verified ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Medal, { className: "h-3.5 w-3.5" }), badge]
	});
}
function SportsProfileCard({ profile, compact = false, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		"data-testid": "button-sports-profile-details",
		"aria-label": "Sports Details",
		onClick,
		className: `relative w-full overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-[#19151f] via-[#17151d] to-[#0c0d13] text-left shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition-transform active:scale-[0.99] ${compact ? "mt-3 rounded-2xl p-3" : "mt-4 p-4"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-amber-300/10 blur-3xl" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `grid shrink-0 place-items-center border border-amber-200/25 bg-amber-300/10 text-amber-200 ${compact ? "h-9 w-9 rounded-xl" : "h-11 w-11 rounded-2xl"}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { className: compact ? "h-4 w-4" : "h-5 w-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[9px] font-bold uppercase tracking-[0.18em] text-amber-200/75",
							children: "Sports Identity / Sports Details"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 truncate text-[13px] font-semibold text-white",
							children: profile.verified ? "Verified athletic identity" : "Sports Profile"
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: `${compact ? "mt-0.5 h-4 w-4" : "mt-1 h-5 w-5"} shrink-0 text-amber-200/70` })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: `relative grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.035] text-center ${compact ? "mt-3 py-2" : "mt-4 py-3"}`,
				onClick: (event) => event.stopPropagation(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
							className: "flex items-center justify-center gap-1 text-[9px] uppercase tracking-wider text-zinc-500",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Medal, { className: "h-3 w-3" }), profile.verified ? "Sport" : "Sports"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "mt-0.5 truncate text-[11px] font-semibold text-white",
							children: profile.verified ? profile.sport : "Profile"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
							className: "flex items-center justify-center gap-1 text-[9px] uppercase tracking-wider text-zinc-500",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, { className: "h-3 w-3" }), profile.verified ? "Role" : "Details"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "mt-0.5 truncate text-[11px] font-semibold text-white",
							children: profile.verified ? profile.role : "Open"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
							className: "flex items-center justify-center gap-1 text-[9px] uppercase tracking-wider text-zinc-500",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Earth, { className: "h-3 w-3" }), profile.verified ? profile.status : "Access"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "mt-0.5 truncate text-[11px] font-semibold text-white",
							children: profile.verified ? "Verified" : "View"
						})]
					})
				]
			})
		]
	});
}
function SportsDetailsPanel({ profile, isOwner, documents, documentsLoading, documentsError, documentsUploading, onUploadDocument, onDocumentAction, onDeleteDocument, onSave, sportsIntroductionUrl, sportsIntroductionUploading = false, sportsIntroductionProgress = 0, onUploadSportsIntroduction, onDeleteSportsIntroduction, onSubmitVerification, onOpenVerificationReview, verificationSubmitting = false, verificationDetails, verificationDetailsLoading = false, verificationDetailsSaving = false, onSaveVerificationDetails, onUploadVerificationEvidence, verificationEvidenceUploading = null }) {
	const [editorField, setEditorField] = (0, import_react.useState)(null);
	const [draft, setDraft] = (0, import_react.useState)(() => toSportsProfileDraft(profile));
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [termsAgreed, setTermsAgreed] = (0, import_react.useState)(false);
	const [verificationDraft, setVerificationDraft] = (0, import_react.useState)(() => verificationDetails ?? emptySportsVerificationDetails());
	const editable = isOwner && Boolean(onSave);
	const isCoach = profile.role === "Coach";
	const isInternational = profile.status === "International";
	(0, import_react.useEffect)(() => {
		if (verificationDetails) setVerificationDraft(verificationDetails);
	}, [verificationDetails]);
	const openEditor = (field) => {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "panel-sports-details",
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-3xl border border-amber-200/20 bg-gradient-to-br from-amber-200/10 via-white/[0.04] to-transparent p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/75",
						children: "Sports identity"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-lg font-semibold text-white",
						children: profile.badge
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [editable ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => openEditor("username"),
							className: "inline-flex items-center gap-1.5 rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-200/20",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-3.5 w-3.5" }), "Edit"]
						}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-6 w-6 shrink-0 text-amber-200" })]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsDetailStat, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Medal, {}),
						label: "Sport",
						value: profile.sport,
						onClick: editable ? () => openEditor("sport") : void 0
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsDetailStat, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, {}),
						label: "Role",
						value: profile.role,
						onClick: editable ? () => openEditor("role") : void 0
					}),
					!isCoach ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsDetailStat, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Earth, {}),
						label: "Status",
						value: profile.status,
						onClick: editable ? () => openEditor("representation") : void 0
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsDetailStat, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, {}),
						label: "Verification",
						value: profile.verified ? "Verified" : "Not verified",
						onClick: editable ? () => openEditor("verification") : void 0
					})
				]
			}),
			editable && !isCoach ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-x-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditLink, {
					label: "Edit medals",
					onClick: () => openEditor("medals")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditLink, {
					label: "Edit achievements",
					onClick: () => openEditor("achievements")
				})]
			}) : null,
			isCoach ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachProfileSection, {
				profile,
				editable,
				onEdit: openEditor
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsTournamentSection, {
				profile,
				editable,
				onEdit: openEditor
			})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsTournamentSection, {
				profile,
				editable,
				onEdit: openEditor
			}) }),
			isOwner ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsVerificationDetailsSection, {
				details: verificationDraft,
				isInternational,
				loading: verificationDetailsLoading,
				saving: verificationDetailsSaving,
				uploading: verificationEvidenceUploading,
				onChange: setVerificationDraft,
				onSave: onSaveVerificationDetails,
				onUploadEvidence: onUploadVerificationEvidence
			}) : null,
			isOwner ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SportsDetailsSection, {
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {}),
				title: isCoach ? "Qualification Documents" : "Documents",
				description: isCoach ? "Private NS NIS and coaching qualification documents visible only to you." : "Private verification documents visible only to you.",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex items-center justify-between gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-zinc-500",
							children: "PDF, JPG, or PNG up to 15 MB."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							htmlFor: "sports-document-upload",
							className: `inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-200/20 ${documentsUploading ? "pointer-events-none opacity-60" : ""}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-3.5 w-3.5" }), documentsUploading ? "Uploading…" : isCoach ? "Upload qualification" : "Upload"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							id: "sports-document-upload",
							type: "file",
							accept: "application/pdf,image/jpeg,image/png",
							className: "sr-only",
							disabled: documentsUploading,
							onChange: (event) => {
								const file = event.currentTarget.files?.[0];
								event.currentTarget.value = "";
								if (file) onUploadDocument(file);
							}
						})
					]
				}), documentsLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-zinc-500",
					children: "Loading your documents…"
				}) : documentsError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-red-300",
					children: documentsError
				}) : documents.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2",
					children: documents.map((document) => {
						const displayName = document.name.split("/").at(-1) || "Verification document";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-5 w-5 shrink-0 text-amber-200" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "min-w-0 flex-1 truncate text-sm text-zinc-200",
									children: displayName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": `Open ${displayName}`,
									className: "grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-300 transition-colors hover:bg-white/10",
									onClick: () => onDocumentAction(document, false),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "h-4 w-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": `Download ${displayName}`,
									className: "grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-300 transition-colors hover:bg-white/10",
									onClick: () => onDocumentAction(document, true),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "h-4 w-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": `Delete ${displayName}`,
									className: "grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-300 transition-colors hover:bg-red-400/10 hover:text-red-300",
									onClick: () => onDeleteDocument(document),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
								})
							]
						}, document.path);
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-zinc-500",
					children: "No verification documents uploaded."
				})]
			}) : null,
			isOwner || profile.sportsIntroductionPath ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SportsDetailsSection, {
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, {}),
				title: "Sports Introduction",
				description: "One short vertical video in your own natural voice. No music or platform-added audio.",
				children: [profile.sportsIntroductionPath ? sportsIntroductionUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
					"data-testid": "sports-introduction-video",
					src: sportsIntroductionUrl,
					controls: true,
					controlsList: "nodownload noplaybackrate",
					disablePictureInPicture: true,
					playsInline: true,
					preload: "metadata",
					className: "aspect-[9/16] max-h-80 w-full rounded-2xl border border-amber-200/15 bg-black object-contain"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-zinc-500",
					children: "Loading your Sports Introduction…"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-2xl border border-dashed border-amber-200/20 bg-amber-200/[0.04] p-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-6 text-zinc-300",
						children: "Introduce yourself in your own voice and tell people about your sport, role, major achievements and sports journey."
					})
				}), isOwner ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							htmlFor: "sports-introduction-upload",
							className: `inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-200/20 ${sportsIntroductionUploading ? "pointer-events-none opacity-60" : ""}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-3.5 w-3.5" }), sportsIntroductionUploading ? `Uploading ${sportsIntroductionProgress}%` : profile.sportsIntroductionPath ? "Replace video" : "Upload video"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							id: "sports-introduction-upload",
							type: "file",
							accept: "video/*",
							className: "sr-only",
							disabled: sportsIntroductionUploading,
							onChange: (event) => {
								const file = event.currentTarget.files?.[0];
								event.currentTarget.value = "";
								if (file) onUploadSportsIntroduction?.(file);
							}
						}),
						profile.sportsIntroductionPath ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							variant: "ghost",
							size: "sm",
							disabled: sportsIntroductionUploading,
							onClick: onDeleteSportsIntroduction,
							className: "rounded-full text-red-200 hover:bg-red-400/10 hover:text-red-100",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "mr-1.5 h-3.5 w-3.5" }), "Delete video"]
						}) : null
					]
				}) : null]
			}) : null,
			isOwner ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SportsDetailsSection, {
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {}),
				title: "Terms & Conditions",
				description: "Review these requirements before submitting your Sports Profile for verification.",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
						className: "rounded-2xl border border-amber-200/15 bg-gradient-to-br from-amber-200/[0.08] via-white/[0.035] to-transparent",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
							className: "cursor-pointer list-none px-4 py-3 text-sm font-semibold text-amber-100",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Verification terms" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-medium uppercase tracking-wider text-zinc-500",
									children: "Tap to read"
								})]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border-t border-white/10 px-4 py-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "list-disc space-y-1.5 pl-5 text-xs leading-5 text-zinc-300",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "I confirm that all information submitted by me is true and accurate." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "I am responsible for the authenticity of my certificates, achievements and sports information." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Fake, forged, altered or misleading documents/information are strictly prohibited." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "YourWorld may reject or revoke verification if submitted information is found to be false." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "YourWorld may restrict or suspend accounts involved in fraudulent verification." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "YourWorld may take appropriate legal action or other remedies permitted under applicable law where applicable." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Verification documents remain private and are used for verification purposes." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The Sports Introduction video may be displayed publicly as part of the verified sports profile." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "YourWorld may retain verification records/evidence for legitimate security, verification and legal purposes." })
								]
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mt-4 flex cursor-pointer items-start gap-3 text-sm text-zinc-200",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: termsAgreed,
							onChange: (event) => setTermsAgreed(event.target.checked),
							className: "mt-1 h-4 w-4 accent-amber-200"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "I Agree to the Terms & Conditions" })]
					}),
					profile.verified ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						"data-testid": "sports-verification-status",
						className: "mt-4 rounded-2xl border border-emerald-200/30 bg-gradient-to-r from-emerald-300/[0.16] via-amber-200/[0.08] to-transparent px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold uppercase tracking-[0.18em] text-emerald-200",
							children: "✓ Verified"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm font-semibold text-white",
							children: "Sports Profile Verified Successfully"
						})]
					}) : profile.verificationRequested ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						"data-testid": "sports-verification-status",
						className: "mt-4 rounded-2xl border border-amber-200/20 bg-amber-200/[0.08] px-4 py-3 text-sm text-amber-100",
						children: "Pending Verification"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						"data-testid": "button-submit-sports-verification",
						disabled: !termsAgreed || verificationSubmitting,
						onClick: () => void onSubmitVerification?.(),
						className: "mt-4 w-full rounded-full bg-amber-200 text-black hover:bg-amber-100",
						children: verificationSubmitting ? "Submitting…" : "Submit for Verification"
					})
				]
			}) : null,
			editable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsDetailsEditor, {
				open: Boolean(editorField),
				field: editorField,
				draft,
				setDraft,
				saving,
				onOpenChange: (open) => !open && setEditorField(null),
				onSave: saveDraft,
				onOpenVerificationReview
			}) : null
		]
	});
}
function emptySportsVerificationDetails() {
	return {
		villageTown: "",
		district: "",
		state: "",
		country: "India",
		mobileNumber: "",
		email: "",
		sportsCertificate: null,
		passportFirstPage: null,
		passportVisaStampPage: null,
		tournamentPhoto: null
	};
}
function SportsVerificationDetailsSection({ details, isInternational, loading, saving, uploading, onChange, onSave, onUploadEvidence }) {
	const setField = (field, value) => onChange({
		...details,
		[field]: value
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsDetailsSection, {
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {}),
		title: "Verification Details",
		description: "These details are used only for Sports Verification and are not shown on your public profile.",
		children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-zinc-500",
			children: "Loading your verification details…"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "space-y-1.5 text-xs text-zinc-400",
							children: ["Village / Town", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: details.villageTown,
								onChange: (event) => setField("villageTown", event.target.value),
								placeholder: "Village or town",
								maxLength: 120,
								disabled: saving,
								className: "border-white/10 bg-white/[0.04] text-sm text-white"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "space-y-1.5 text-xs text-zinc-400",
							children: ["District", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: details.district,
								onChange: (event) => setField("district", event.target.value),
								placeholder: "District",
								maxLength: 120,
								disabled: saving,
								className: "border-white/10 bg-white/[0.04] text-sm text-white"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "space-y-1.5 text-xs text-zinc-400",
							children: ["State", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: details.state,
								onChange: (event) => setField("state", event.target.value),
								placeholder: "State",
								maxLength: 120,
								disabled: saving,
								className: "border-white/10 bg-white/[0.04] text-sm text-white"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "space-y-1.5 text-xs text-zinc-400",
							children: ["Country", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: details.country,
								onChange: (event) => setField("country", event.target.value),
								placeholder: "Country",
								maxLength: 120,
								disabled: saving,
								className: "border-white/10 bg-white/[0.04] text-sm text-white"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadOnlyVerificationValue, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "h-3.5 w-3.5" }),
						label: "Mobile Number",
						value: details.mobileNumber || "Not provided on this account"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadOnlyVerificationValue, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "h-3.5 w-3.5" }),
						label: "Gmail / Email",
						value: details.email || "Not provided on this account"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2 rounded-2xl border border-white/10 bg-white/[0.025] p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold text-white",
							children: "Private verification evidence"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs leading-5 text-zinc-500",
							children: "Uploaded files are visible only to you and authorized verification reviewers."
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VerificationEvidenceRow, {
							accept: "application/pdf,image/jpeg,image/png",
							evidence: details.sportsCertificate,
							kind: "sportsCertificate",
							label: "Sports Certificate",
							uploading,
							onUpload: onUploadEvidence
						}),
						isInternational ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VerificationEvidenceRow, {
								accept: "application/pdf,image/jpeg,image/png",
								evidence: details.passportFirstPage,
								kind: "passportFirstPage",
								label: "Passport First Page",
								uploading,
								onUpload: onUploadEvidence
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VerificationEvidenceRow, {
								accept: "application/pdf,image/jpeg,image/png",
								evidence: details.passportVisaStampPage,
								kind: "passportVisaStampPage",
								label: "Passport Visa / Stamp Page",
								hint: "The page showing the visa or stamp for the tournament/game country.",
								uploading,
								onUpload: onUploadEvidence
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VerificationEvidenceRow, {
								accept: "image/jpeg,image/png,image/webp",
								evidence: details.tournamentPhoto,
								kind: "tournamentPhoto",
								label: "One Tournament Photo",
								hint: "You should be clearly visible with a medal or in India blazer/team representation.",
								uploading,
								onUpload: onUploadEvidence
							})
						] }) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					disabled: saving || !onSave,
					onClick: () => void onSave?.(verificationDraftOr(details)),
					className: "w-full rounded-full bg-amber-200 text-black hover:bg-amber-100",
					children: saving ? "Saving verification details…" : "Save Verification Details"
				})
			]
		})
	});
}
function verificationDraftOr(details) {
	return {
		...details,
		villageTown: details.villageTown.trim(),
		district: details.district.trim(),
		state: details.state.trim(),
		country: details.country.trim() || "India"
	};
}
function ReadOnlyVerificationValue({ icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-2.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500",
			children: [icon, label]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 truncate text-sm text-zinc-300",
			children: value
		})]
	});
}
function VerificationEvidenceRow({ accept, evidence, kind, label, hint, uploading, onUpload }) {
	const inputId = `sports-verification-${kind}`;
	const isUploading = uploading === kind;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-start gap-3 rounded-xl border border-white/10 bg-black/10 p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileCheckCorner, { className: "mt-0.5 h-4 w-4 shrink-0 text-amber-200" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium text-zinc-200",
						children: label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-0.5 text-xs text-zinc-500",
						children: hint || "Private upload"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-zinc-400",
						children: evidence ? "Uploaded" : "Not uploaded"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				htmlFor: inputId,
				className: `inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-200/20 ${isUploading ? "pointer-events-none opacity-60" : ""}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-3.5 w-3.5" }), isUploading ? "Uploading…" : evidence ? "Replace" : "Upload"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				id: inputId,
				type: "file",
				accept,
				className: "sr-only",
				disabled: isUploading || !onUpload,
				onChange: (event) => {
					const file = event.currentTarget.files?.[0];
					event.currentTarget.value = "";
					if (file) onUpload?.(kind, file);
				}
			})
		]
	});
}
function SportsTournamentSection({ profile, editable, onEdit }) {
	const isNational = profile.status === "National";
	const sectionTitle = profile.status === "National" ? "National Competition" : profile.status === "International" ? "International Competitions" : "Tournaments / Competitions";
	const tournaments = profile.tournamentDetails?.length ? profile.tournamentDetails : profile.tournaments.map((name) => ({
		name: name.replace(/^tournament\s*:\s*/i, "").trim(),
		date: "",
		level: "",
		result: ""
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SportsDetailsSection, {
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, {}),
		title: sectionTitle,
		description: isNational ? "Select one of the three recognized national competitions and record verified medal achievements." : "Build a professional sports timeline from recognized competitions.",
		children: [tournaments.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			"data-testid": "sports-tournament-timeline",
			className: "space-y-3",
			children: tournaments.map((item, index) => {
				const verifiedNationalMedal = isNational && profile.verified && isNationalCompetition(item.name) && Boolean(item.medal && item.medal !== "No Medal");
				const displayMedal = isNational ? verifiedNationalMedal ? item.medal : "" : item.medal;
				const metadata = [
					formatTournamentDateRange(item),
					item.country,
					item.hostLocation,
					item.level ? `Level: ${item.level}` : "",
					item.result ? `Result: ${item.result}` : "",
					displayMedal ? `Medal: ${displayMedal}` : "",
					item.eventPosition ? `Event: ${item.eventPosition}` : "",
					item.teamCountry ? `Team / Country: ${item.teamCountry}` : "",
					item.roleResponsibility ? `Role: ${item.roleResponsibility}` : ""
				].filter(Boolean);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					"data-testid": `sports-tournament-entry-${index + 1}`,
					className: "relative flex gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "relative mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-amber-200/25 bg-amber-200/10 text-amber-200",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { className: "h-4 w-4" })
						}),
						index < tournaments.length - 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute left-4 top-9 h-[calc(100%+0.25rem)] w-px bg-amber-200/15" }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.035] p-3",
							children: [verifiedNationalMedal ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								"data-testid": `verified-national-medal-${index + 1}`,
								className: "space-y-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "font-semibold uppercase tracking-wide text-white",
										children: ["🇮🇳 ", nationalCompetitionLabel(item.name)]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm font-semibold text-amber-200",
										children: [
											medalEmoji(item.medal),
											" ",
											item.medal,
											" Medal"
										]
									}),
									tournamentYear(item) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-zinc-400",
										children: ["📅 ", tournamentYear(item)]
									}) : null
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold text-white",
								children: item.name
							}), metadata.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 flex flex-wrap gap-1.5",
								children: metadata.map((value, metadataIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-zinc-300",
									children: value
								}, `${value}-${metadataIndex}`))
							}) : null]
						})
					]
				}, `${item.name}-${index}`);
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			"data-testid": "sports-tournament-empty",
			className: "text-sm text-zinc-500",
			children: "No public tournament or competition details listed."
		}), editable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditLink, {
			label: "Add or edit tournaments / competitions",
			onClick: () => onEdit("tournaments")
		}) : null]
	});
}
function SportsDetailStat({ icon, label, value, onClick }) {
	const content = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "h-3.5 w-3.5 [&>svg]:h-3.5 [&>svg]:w-3.5",
			children: icon
		}), label]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-1 truncate text-sm font-semibold text-white",
		children: value
	})] });
	if (onClick) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: "rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-left transition-colors hover:border-amber-200/30 hover:bg-amber-200/[0.06]",
		children: content
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-2xl border border-white/10 bg-white/[0.035] p-3",
		children: content
	});
}
function EditLink({ label, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: "mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-200 transition-colors hover:text-amber-100",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-3.5 w-3.5" }), label]
	});
}
function CoachProfileSection({ profile, editable, onEdit }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsDetailsSection, {
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {}),
		title: "COACH PROFILE",
		description: "Professional coaching identity and qualification details.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-2 sm:grid-cols-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachProfileValue, {
					label: "Coach Name",
					value: profile.coachName,
					editable,
					onEdit: () => onEdit("coachName")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachProfileValue, {
					label: "Sport",
					value: profile.sport,
					editable,
					onEdit: () => onEdit("sport")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachProfileValue, {
					label: "Coaching Qualification",
					value: profile.coachQualification,
					editable,
					onEdit: () => onEdit("coachQualification")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachProfileValue, {
					label: "Qualification / NS NIS Year",
					value: profile.qualificationYear,
					editable,
					onEdit: () => onEdit("qualificationYear")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachProfileValue, {
					label: "Institution / Where completed",
					value: profile.institution,
					editable,
					onEdit: () => onEdit("institution")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachProfileValue, {
					label: "Coaching Experience",
					value: profile.coachingExperience,
					editable,
					onEdit: () => onEdit("coachingExperience")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachProfileValue, {
					label: "Tournament / Team details",
					value: profile.teamDetails,
					editable,
					onEdit: () => onEdit("teamDetails")
				})
			]
		})
	});
}
function CoachProfileValue({ label, value, editable, onEdit }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-white/10 bg-white/[0.035] p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[10px] uppercase tracking-wider text-zinc-500",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm font-semibold text-white",
				children: value
			}),
			editable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditLink, {
				label: "Edit",
				onClick: onEdit
			}) : null
		]
	});
}
function TournamentEntryEditor({ item, index, role, representation, onChange, onRemove }) {
	const isNational = representation === "National";
	const competitionListId = representation === "International" ? "international-sports-competitions" : "recognized-sports-competitions";
	const showNationalMedal = isNational && isNationalCompetition(item.name);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: editorCardClass,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs font-semibold uppercase tracking-wider text-amber-200/80",
					children: ["Tournament / Competition ", index + 1]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"data-testid": `button-remove-tournament-${index + 1}`,
					"aria-label": `Remove tournament ${index + 1}`,
					onClick: onRemove,
					className: "text-zinc-500 transition-colors hover:text-red-300",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorField, {
				label: isNational ? "National Competition" : "International Competition",
				hint: isNational ? "Choose one of the three recognized national competitions." : "Search recognized international competitions or enter another one.",
				children: isNational ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					"data-testid": `select-national-competition-${index + 1}`,
					value: item.name,
					onChange: (event) => onChange(index, {
						name: event.target.value,
						medal: void 0
					}),
					className: editorSelectClass,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						children: "Select national competition"
					}), NATIONAL_COMPETITIONS.map((competition) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: competition,
						children: competition
					}, competition))]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					list: competitionListId,
					"data-testid": `input-tournament-name-${index + 1}`,
					value: item.name,
					onChange: (event) => onChange(index, { name: event.target.value }),
					className: editorInputClass,
					placeholder: "Search or enter a competition"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid gap-2 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-medium text-zinc-400",
							children: "Start Year"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							"data-testid": `select-tournament-start-year-${index + 1}`,
							value: item.startYear ?? "",
							onChange: (event) => onChange(index, { startYear: event.target.value }),
							className: editorSelectClass,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Select year"
							}), TOURNAMENT_YEARS.map((year) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: year,
								children: year
							}, year))]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-medium text-zinc-400",
							children: "Start Date"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							"data-testid": `input-tournament-start-date-${index + 1}`,
							value: item.startDate ?? "",
							onChange: (event) => onChange(index, { startDate: event.target.value }),
							className: editorInputClass
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-medium text-zinc-400",
							children: "End Year"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							"data-testid": `select-tournament-end-year-${index + 1}`,
							value: item.endYear ?? "",
							onChange: (event) => onChange(index, { endYear: event.target.value }),
							className: editorSelectClass,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Select year"
							}), TOURNAMENT_YEARS.map((year) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: year,
								children: year
							}, year))]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-medium text-zinc-400",
							children: "End Date"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							"data-testid": `input-tournament-end-date-${index + 1}`,
							value: item.endDate ?? "",
							onChange: (event) => onChange(index, { endDate: event.target.value }),
							className: editorInputClass
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid gap-2 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						"data-testid": `input-tournament-country-${index + 1}`,
						value: item.country ?? "",
						onChange: (event) => onChange(index, { country: event.target.value }),
						className: editorInputClass,
						placeholder: "Country"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						"data-testid": `input-tournament-location-${index + 1}`,
						value: item.hostLocation ?? "",
						onChange: (event) => onChange(index, { hostLocation: event.target.value }),
						className: editorInputClass,
						placeholder: "City / host location"
					}),
					isNational ? showNationalMedal ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						"data-testid": `select-national-medal-${index + 1}`,
						value: item.medal === "No Medal" ? "" : item.medal ?? "",
						onChange: (event) => onChange(index, { medal: event.target.value ? event.target.value : void 0 }),
						className: editorSelectClass,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Select medal (optional)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "Gold",
								children: "Gold"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "Silver",
								children: "Silver"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "Bronze",
								children: "Bronze"
							})
						]
					}) : null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						"data-testid": `select-tournament-medal-${index + 1}`,
						value: item.medal ?? "",
						onChange: (event) => onChange(index, { medal: event.target.value ? event.target.value : void 0 }),
						className: editorSelectClass,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Medal (optional)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "Gold",
								children: "Gold"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "Silver",
								children: "Silver"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "Bronze",
								children: "Bronze"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "No Medal",
								children: "No Medal"
							})
						]
					}),
					role === "Coach" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						"data-testid": `input-tournament-team-country-${index + 1}`,
						value: item.teamCountry ?? "",
						onChange: (event) => onChange(index, { teamCountry: event.target.value }),
						className: editorInputClass,
						placeholder: "Team / Country coached"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						"data-testid": `input-tournament-role-${index + 1}`,
						value: item.roleResponsibility ?? "",
						onChange: (event) => onChange(index, { roleResponsibility: event.target.value }),
						className: editorInputClass,
						placeholder: "Role / Responsibility"
					})] }) : null
				]
			})
		]
	});
}
function SportsDetailsEditor({ open, field, draft, setDraft, saving, onOpenChange, onSave, onOpenVerificationReview }) {
	const updateTournament = (index, changes) => {
		setDraft((current) => ({
			...current,
			tournaments: current.tournaments.map((entry, entryIndex) => entryIndex === index ? {
				...entry,
				...changes
			} : entry)
		}));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-h-[88svh] max-w-lg overflow-y-auto rounded-3xl border-amber-200/20 bg-[#0b0c12] text-white",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "text-left text-xl text-white",
					children: field === "username" ? "Edit sports username" : field === "role" ? "Choose role" : field === "sport" ? "Choose your sport" : field === "eventPosition" ? "Edit position / event" : field === "representation" ? "Choose representation" : field === "tournaments" ? "Add tournaments / competitions" : field === "medals" ? "Edit medals" : field === "achievements" ? "Edit achievements" : field === "coachQualification" ? "Edit coaching qualification" : field === "qualificationYear" ? "Edit qualification year" : field === "institution" ? "Edit institution" : field === "coachingExperience" ? "Edit coaching experience" : field === "teamDetails" ? "Edit tournament / team details" : "Verification status"
				}) }),
				field === "username" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorField, {
					label: "Username",
					hint: "This updates the existing profile username.",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: draft.username,
						maxLength: 30,
						onChange: (event) => setDraft((current) => ({
							...current,
							username: event.target.value.replace(/[^\w.]/g, "").toLowerCase()
						})),
						className: editorInputClass,
						placeholder: "yourusername"
					})
				}) : null,
				field === "role" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorField, {
					label: "Role",
					hint: "Choose one sports profile role.",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: draft.role,
						onChange: (event) => setDraft((current) => ({
							...current,
							role: event.target.value
						})),
						className: editorSelectClass,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "Player",
							children: "Player"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "Coach",
							children: "Coach"
						})]
					})
				}) : null,
				field === "coachName" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorField, {
					label: "Coach Name",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: draft.coachName,
						onChange: (event) => setDraft((current) => ({
							...current,
							coachName: event.target.value
						})),
						className: editorInputClass,
						placeholder: "Your coaching name"
					})
				}) : null,
				field === "sport" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(EditorField, {
					label: "Sport",
					hint: "Choose from the sports catalogue or enter another sport.",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: SPORTS_CATALOGUE.includes(draft.sport) ? draft.sport : "Other",
						onChange: (event) => setDraft((current) => ({
							...current,
							sport: event.target.value === "Other" ? "" : event.target.value
						})),
						className: editorSelectClass,
						children: [SPORTS_CATALOGUE.map((sport) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: sport,
							children: sport
						}, sport)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "Other",
							children: "Other sport"
						})]
					}), !SPORTS_CATALOGUE.includes(draft.sport) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: draft.sport,
						onChange: (event) => setDraft((current) => ({
							...current,
							sport: event.target.value
						})),
						className: editorInputClass,
						placeholder: "Enter another sport"
					}) : null]
				}) : null,
				field === "eventPosition" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorField, {
					label: "Position / event",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: draft.eventPosition,
						onChange: (event) => setDraft((current) => ({
							...current,
							eventPosition: event.target.value
						})),
						className: editorInputClass,
						placeholder: "Goalkeeper, 100m, Singles…"
					})
				}) : null,
				field === "representation" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorField, {
					label: "Representation",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: draft.representation,
						onChange: (event) => setDraft((current) => ({
							...current,
							representation: event.target.value
						})),
						className: editorSelectClass,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Not recorded"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "National",
								children: "National"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "International",
								children: "International"
							})
						]
					})
				}) : null,
				field === "tournaments" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
							id: "recognized-sports-competitions",
							children: RECOGNIZED_COMPETITIONS.map((competition) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: competition }, competition))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
							id: "international-sports-competitions",
							children: INTERNATIONAL_COMPETITIONS.map((competition) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: competition }, competition))
						}),
						draft.tournaments.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TournamentEntryEditor, {
							item,
							index,
							role: draft.role,
							representation: draft.representation,
							onChange: updateTournament,
							onRemove: () => setDraft((current) => ({
								...current,
								tournaments: current.tournaments.filter((_, itemIndex) => itemIndex !== index)
							}))
						}, `tournament-${index}`)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddRowButton, {
							testId: "button-add-tournament",
							label: "Add tournament / competition",
							onClick: () => setDraft((current) => ({
								...current,
								tournaments: [...current.tournaments, {
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
									medal: void 0,
									eventPosition: "",
									teamCountry: "",
									roleResponsibility: ""
								}]
							}))
						})
					]
				}) : null,
				field === "medals" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [draft.medals.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: editorCardClass,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-2 flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs font-semibold uppercase tracking-wider text-amber-200/80",
								children: ["Medal ", index + 1]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": `Remove medal ${index + 1}`,
								onClick: () => setDraft((current) => ({
									...current,
									medals: current.medals.filter((_, itemIndex) => itemIndex !== index)
								})),
								className: "text-zinc-500 transition-colors hover:text-red-300",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-2 sm:grid-cols-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: item.type,
								onChange: (event) => setDraft((current) => ({
									...current,
									medals: current.medals.map((entry, entryIndex) => entryIndex === index ? {
										...entry,
										type: event.target.value
									} : entry)
								})),
								className: editorSelectClass,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "Gold",
										children: "Gold"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "Silver",
										children: "Silver"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "Bronze",
										children: "Bronze"
									})
								]
							}), ["tournament", "year"].map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: item[key],
								onChange: (event) => setDraft((current) => ({
									...current,
									medals: current.medals.map((entry, entryIndex) => entryIndex === index ? {
										...entry,
										[key]: event.target.value
									} : entry)
								})),
								className: editorInputClass,
								placeholder: key === "tournament" ? "Tournament" : "Year"
							}, key))]
						})]
					}, `medal-${index}`)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddRowButton, {
						label: "Add medal",
						onClick: () => setDraft((current) => ({
							...current,
							medals: [...current.medals, {
								type: "Gold",
								tournament: "",
								year: ""
							}]
						}))
					})]
				}) : null,
				field === "achievements" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorField, {
					label: "Achievements",
					hint: "Add one achievement per line.",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						value: draft.achievements,
						onChange: (event) => setDraft((current) => ({
							...current,
							achievements: event.target.value
						})),
						rows: 6,
						className: `${editorInputClass} min-h-32`,
						placeholder: "National champion\nPersonal best…"
					})
				}) : null,
				field === "coachQualification" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorField, {
					label: "Coaching Qualification",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: draft.coachQualification,
						onChange: (event) => setDraft((current) => ({
							...current,
							coachQualification: event.target.value
						})),
						className: editorInputClass,
						placeholder: "Level 2 coaching licence"
					})
				}) : null,
				field === "qualificationYear" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorField, {
					label: "Qualification / NS NIS Year",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: draft.qualificationYear,
						onChange: (event) => setDraft((current) => ({
							...current,
							qualificationYear: event.target.value
						})),
						className: editorInputClass,
						placeholder: "2024"
					})
				}) : null,
				field === "institution" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorField, {
					label: "Institution / Where completed",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: draft.institution,
						onChange: (event) => setDraft((current) => ({
							...current,
							institution: event.target.value
						})),
						className: editorInputClass,
						placeholder: "Institution name"
					})
				}) : null,
				field === "coachingExperience" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorField, {
					label: "Coaching Experience",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						value: draft.coachingExperience,
						onChange: (event) => setDraft((current) => ({
							...current,
							coachingExperience: event.target.value
						})),
						rows: 5,
						className: `${editorInputClass} min-h-28`,
						placeholder: "Years, teams, and coaching experience"
					})
				}) : null,
				field === "teamDetails" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorField, {
					label: "Tournament / Team details",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						value: draft.teamDetails,
						onChange: (event) => setDraft((current) => ({
							...current,
							teamDetails: event.target.value
						})),
						rows: 5,
						className: `${editorInputClass} min-h-28`,
						placeholder: "Teams coached, tournaments, and results"
					})
				}) : null,
				field === "verification" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: editorCardClass,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "mt-0.5 h-5 w-5 shrink-0 text-amber-200" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm leading-6 text-zinc-400",
							children: "Verification is controlled by the existing profile verification state and cannot be self-claimed. Private documents remain available below for the owner/admin review flow."
						})]
					})
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex justify-end gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "secondary",
						className: "rounded-full",
						onClick: () => onOpenChange(false),
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						className: "rounded-full bg-amber-200 text-black hover:bg-amber-100",
						disabled: saving,
						onClick: () => {
							if (field === "verification") {
								onOpenChange(false);
								onOpenVerificationReview?.();
								return;
							}
							onSave();
						},
						children: saving ? "Saving…" : field === "verification" ? "Managed by review" : "Save changes"
					})]
				})
			]
		})
	});
}
var editorInputClass = "h-11 rounded-xl border-white/10 bg-white/[0.06] text-white placeholder:text-zinc-500 focus-visible:ring-amber-200/40";
var editorSelectClass = "h-11 w-full rounded-xl border border-white/10 bg-[#171820] px-3 text-sm text-white outline-none focus:border-amber-200/50";
var editorCardClass = "rounded-2xl border border-white/10 bg-white/[0.035] p-3";
function EditorField({ label, hint, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs font-semibold uppercase tracking-wider text-amber-200/80",
			children: label
		}), hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-xs text-zinc-500",
			children: hint
		}) : null] }), children]
	});
}
function AddRowButton({ label, onClick, testId }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		"data-testid": testId,
		onClick,
		className: "inline-flex items-center gap-1.5 rounded-full border border-dashed border-amber-200/30 px-3 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-200/10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-3.5 w-3.5" }), label]
	});
}
function SportsDetailsSection({ icon, title, description, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-3xl border border-white/10 bg-white/[0.025] p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-amber-200 [&>svg]:h-4 [&>svg]:w-4",
				children: icon
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-sm font-semibold text-white",
				children: title
			}), description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-zinc-500",
				children: description
			}) : null] })]
		}), children]
	});
}
//#endregion
export { serializeSportsProfileBio as a, getSportsProfile as i, SportsProfileBadge as n, toSportsProfileDraft as o, SportsProfileCard as r, SportsDetailsPanel as t };
