import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime, a as Overlay2, c as Title2, i as Description2, n as Cancel, o as Portal2, r as Content2, s as Root2, t as Action } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { An as Archive, At as Link2, C as Trash2, Ct as MapPin, En as BadgeCheck, Ft as ImagePlus, H as Settings, Jt as Ellipsis, Rt as Heart, St as Medal, W as Send, Wt as FileText, Xt as Earth, Zt as Download, _ as Upload, b as Trophy, bt as MessageCircleOff, c as Volume2, ct as Pause, et as Plus, gn as Check, h as UserRound, i as X, it as PinOff, l as Video, mn as ChevronLeft, pn as ChevronRight, qt as ExternalLink, rt as Pin, s as VolumeX, st as Pencil, tt as Play, xn as CalendarDays, yn as Camera, z as ShieldCheck } from "../_libs/lucide-react.mjs";
import { _t as STORAGE_BUCKETS, ft as useFollowCounts, mt as cn, tt as useMoments, vt as uploadSourceWithProgress, x as resolveMediaUrl } from "./router-B6YSQPVc.mjs";
import { a as listSportsDocuments, c as uploadSportsIntroduction, i as deleteSportsIntroduction, l as useMyProfile, n as deleteMyPost, o as updateMyPost, r as deleteSportsDocument, s as uploadSportsDocument, t as createSportsDocumentSignedUrl, u as useResolvedMedia } from "./profile-data-0iL2_XCW.mjs";
import { t as YwAvatar } from "./Avatar-YfnvIQsa.mjs";
import { a as SheetTitle, i as SheetHeader, n as SheetContent, r as SheetDescription, t as Sheet } from "./sheet-BCneecYX.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, t as Dialog } from "./dialog-CvvqE0mJ.mjs";
import { n as buttonVariants, t as Button } from "./button-QVaE-7g5.mjs";
import { t as Input } from "./input-BVD91v_k.mjs";
import { t as VideoPoster } from "./VideoPoster-CqYhwI8D.mjs";
import { t as Textarea } from "./textarea-D1j9dq7B.mjs";
import { t as UserWatermark } from "./UserWatermark-Cj3id9i0.mjs";
import { t as compressImageFile } from "./image-compress-CFm7ihuA.mjs";
import { t as Switch } from "./switch-CBQqxPSC.mjs";
import { t as formatCount } from "./yw-data-CyapVFm6.mjs";
import { a as TabsTrigger, i as TabsList, n as Tabs, r as TabsContent, t as FollowListDialog } from "./FollowListDialog-CxZiwgRk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-Bg2y87a3.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var AlertDialog = Root2;
var AlertDialogPortal = Portal2;
var AlertDialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlay2, {
	className: cn("fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
AlertDialogOverlay.displayName = Overlay2.displayName;
var AlertDialogContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props
})] }));
AlertDialogContent.displayName = Content2.displayName;
var AlertDialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
AlertDialogHeader.displayName = "AlertDialogHeader";
var AlertDialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
AlertDialogFooter.displayName = "AlertDialogFooter";
var AlertDialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Title2, {
	ref,
	className: cn("text-lg font-semibold", className),
	...props
}));
AlertDialogTitle.displayName = Title2.displayName;
var AlertDialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Description2, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
AlertDialogDescription.displayName = Description2.displayName;
var AlertDialogAction = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
	ref,
	className: cn(buttonVariants(), className),
	...props
}));
AlertDialogAction.displayName = Action.displayName;
var AlertDialogCancel = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cancel, {
	ref,
	className: cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className),
	...props
}));
AlertDialogCancel.displayName = Cancel.displayName;
var TOKEN = /(https?:\/\/[^\s]+|www\.[^\s]+|#[\p{L}\p{N}_]+|@[\w.]+)/gu;
function renderLine(line, key) {
	const parts = line.split(TOKEN);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: parts.map((part, i) => {
		if (!part) return null;
		if (/^(https?:\/\/|www\.)/i.test(part)) {
			const href = part.startsWith("http") ? part : `https://${part}`;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href,
				target: "_blank",
				rel: "noopener noreferrer",
				className: "text-primary underline-offset-2 hover:underline",
				children: part.replace(/^https?:\/\//, "")
			}, i);
		}
		if (part.startsWith("#") || part.startsWith("@")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-primary",
			children: part
		}, i);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: part }, i);
	}) }, key);
}
function Bio({ text }) {
	const ref = (0, import_react.useRef)(null);
	const [expanded, setExpanded] = (0, import_react.useState)(false);
	const [overflows, setOverflows] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el) return;
		const check = () => {
			const prev = el.style.webkitLineClamp;
			el.style.webkitLineClamp = "5";
			setOverflows(el.scrollHeight - el.clientHeight > 1);
			el.style.webkitLineClamp = prev;
		};
		check();
		const ro = new ResizeObserver(check);
		ro.observe(el);
		return () => ro.disconnect();
	}, [text]);
	const lines = text.split("\n");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pt-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			ref,
			className: "whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground",
			style: expanded ? void 0 : {
				display: "-webkit-box",
				WebkitBoxOrient: "vertical",
				WebkitLineClamp: 5,
				overflow: "hidden"
			},
			children: lines.map((l, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [renderLine(l, `l${i}`), i < lines.length - 1 ? "\n" : null] }, i))
		}), overflows && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => setExpanded((v) => !v),
			className: "mt-1 text-xs font-semibold text-foreground/80 transition-opacity active:opacity-60",
			"aria-expanded": expanded,
			children: expanded ? "Show less" : "Show more"
		})]
	});
}
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
function medalEmoji(medal) {
	if (medal === "Gold") return "🥇";
	if (medal === "Silver") return "🥈";
	if (medal === "Bronze") return "🥉";
	return "";
}
function tournamentYear(item) {
	return item.startYear || item.endYear || item.startDate?.slice(0, 4) || item.date.match(/\b\d{4}\b/)?.[0] || "";
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
function SportsProfileCard({ profile, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		"data-testid": "button-sports-profile-details",
		"aria-label": "Sports Details",
		onClick,
		className: "relative mt-4 w-full overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-[#19151f] via-[#17151d] to-[#0c0d13] p-4 text-left shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition-transform active:scale-[0.99]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-amber-300/10 blur-3xl" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-amber-200/25 bg-amber-300/10 text-amber-200",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { className: "h-5 w-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/75",
							children: "Sports Identity / Sports Details"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 truncate text-sm font-semibold text-white",
							children: profile.verified ? "Verified athletic identity" : "Sports identity"
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "mt-1 h-5 w-5 shrink-0 text-amber-200/70" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "relative mt-4 grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.035] py-3 text-center",
				onClick: (event) => event.stopPropagation(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
							className: "flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Medal, { className: "h-3 w-3" }), "Sport"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "mt-1 truncate text-xs font-semibold text-white",
							children: profile.sport
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
							className: "flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, { className: "h-3 w-3" }), "Role"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "mt-1 truncate text-xs font-semibold text-white",
							children: profile.role
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
							className: "flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Earth, { className: "h-3 w-3" }), profile.status]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "mt-1 truncate text-xs font-semibold text-white",
							children: profile.verified ? "Verified" : "Not verified"
						})]
					})
				]
			})
		]
	});
}
function SportsDetailsPanel({ profile, isOwner, documents, documentsLoading, documentsError, documentsUploading, onUploadDocument, onDocumentAction, onDeleteDocument, onSave, sportsIntroductionUrl, sportsIntroductionUploading = false, sportsIntroductionProgress = 0, onUploadSportsIntroduction, onDeleteSportsIntroduction, onSubmitVerification, verificationSubmitting = false }) {
	const [editorField, setEditorField] = (0, import_react.useState)(null);
	const [draft, setDraft] = (0, import_react.useState)(() => toSportsProfileDraft(profile));
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [termsAgreed, setTermsAgreed] = (0, import_react.useState)(false);
	const editable = isOwner && Boolean(onSave);
	const isCoach = profile.role === "Coach";
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
			isCoach ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachProfileSection, {
				profile,
				editable,
				onEdit: openEditor
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsTournamentSection, {
				profile,
				editable,
				onEdit: openEditor
			})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsTournamentSection, {
					profile,
					editable,
					onEdit: openEditor
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SportsDetailsSection, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Medal, {}),
					title: "Medals",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsDetailList, {
						items: profile.medals,
						empty: "No public medal details listed."
					}), editable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditLink, {
						label: "Edit medals",
						onClick: () => openEditor("medals")
					}) : null]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SportsDetailsSection, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, {}),
					title: "Achievements",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsDetailList, {
						items: profile.achievements,
						empty: "No public achievement details listed."
					}), editable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditLink, {
						label: "Edit achievements",
						onClick: () => openEditor("achievements")
					}) : null]
				})
			] }),
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
						open: true,
						className: "rounded-2xl border border-white/10 bg-white/[0.035]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
							className: "cursor-pointer px-4 py-3 text-sm font-semibold text-amber-100",
							children: "Verification terms"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "max-h-56 overflow-y-auto border-t border-white/10 px-4 py-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-300",
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
					profile.verified ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						"data-testid": "sports-verification-status",
						className: "mt-4 rounded-2xl border border-emerald-200/20 bg-emerald-300/[0.08] px-4 py-3 text-sm text-emerald-100",
						children: "Verified Sports Profile"
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
				onSave: saveDraft
			}) : null
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
function SportsDetailsEditor({ open, field, draft, setDraft, saving, onOpenChange, onSave }) {
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
						disabled: saving || field === "verification",
						onClick: () => void onSave(),
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
function SportsDetailList({ items, empty }) {
	if (!items.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-zinc-500",
		children: empty
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "space-y-2",
		children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
			className: "rounded-2xl bg-white/[0.035] px-3 py-2 text-sm text-zinc-300",
			children: item
		}, item))
	});
}
var CATEGORIES = [
	"Creator",
	"Business",
	"Gamer",
	"Artist",
	"Musician",
	"Photographer"
];
var BIO_MAX = 300;
function EditProfileSheet({ open, onOpenChange, user, value, onSave, sportsProfile, onOpenSportsDetails }) {
	const [draft, setDraft] = (0, import_react.useState)(value);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const avatarInput = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (open) setDraft(value);
	}, [open, value]);
	const set = (k, v) => setDraft((d) => ({
		...d,
		[k]: v
	}));
	const pick = (file, key) => {
		if (!file) return;
		setDraft((d) => ({
			...d,
			[key]: URL.createObjectURL(file),
			[key === "avatarUrl" ? "avatarFile" : "coverFile"]: file
		}));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			side: "bottom",
			className: "max-h-[92svh] overflow-y-auto rounded-t-3xl border-border/60 p-0 [&>button]:hidden",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-0 z-10 flex items-center justify-between border-b border-border/60 glass px-4 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => onOpenChange(false),
						"aria-label": "Close",
						className: "grid h-8 w-8 place-items-center rounded-full bg-secondary/70 transition-transform active:scale-90",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
							className: "h-4 w-4",
							strokeWidth: 1.8
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-base font-bold",
						children: "Edit Profile"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-8" })
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-4 pb-8 pt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative overflow-hidden rounded-3xl bg-secondary/60",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4 p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => avatarInput.current?.click(),
								className: "relative shrink-0 transition-transform active:scale-95",
								"aria-label": "Change profile photo",
								children: [draft.avatarUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: draft.avatarUrl,
									alt: "",
									className: "h-[68px] w-[68px] rounded-full object-cover"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(YwAvatar, {
									user,
									size: 68
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute -bottom-0.5 -right-0.5 grid h-7 w-7 place-items-center rounded-full border-2 border-background bg-foreground text-background",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {
										className: "h-3.5 w-3.5",
										strokeWidth: 1.9
									})
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: "Tap the photo to update your profile picture."
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: avatarInput,
						type: "file",
						accept: "image/*",
						hidden: true,
						onChange: (e) => pick(e.target.files?.[0], "avatarUrl")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4 pt-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Display Name",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: draft.name,
									maxLength: 40,
									onChange: (e) => set("name", e.target.value),
									className: "h-11 rounded-xl"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Username",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground",
										children: "@"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: draft.username,
										maxLength: 30,
										onChange: (e) => set("username", e.target.value.replace(/[^\w.]/g, "").toLowerCase()),
										className: "h-11 rounded-xl pl-7"
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Category",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex flex-wrap gap-2",
									children: CATEGORIES.map((c) => {
										const active = draft.category === c;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => set("category", active ? "" : c),
											className: `rounded-full px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95 ${active ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`,
											children: c
										}, c);
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
								label: "Bio",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									value: draft.bio,
									maxLength: BIO_MAX,
									rows: 5,
									onChange: (e) => set("bio", e.target.value),
									className: "min-h-28 rounded-xl leading-relaxed"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "pt-1 text-right text-[11px] text-muted-foreground",
									children: [
										draft.bio.length,
										"/",
										BIO_MAX
									]
								})]
							}),
							sportsProfile && onOpenSportsDetails ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsProfileCard, {
								profile: sportsProfile,
								onClick: onOpenSportsDetails
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 grid grid-cols-2 gap-3 border-t border-border/60 pt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							className: "h-11 rounded-full",
							onClick: () => onOpenChange(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "h-11 rounded-full",
							disabled: saving,
							onClick: async () => {
								setSaving(true);
								try {
									await onSave(draft);
									onOpenChange(false);
									toast.success("Profile updated");
								} catch (e) {
									toast.error(e instanceof Error ? e.message : "Could not save profile");
								} finally {
									setSaving(false);
								}
							},
							children: saving ? "Saving…" : "Save Changes"
						})]
					})
				]
			})]
		})
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
		children: label
	}), children] });
}
var MAX_COVER_EDGE = 320;
function Thumb({ src, video }) {
	if (!src) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-full bg-muted" });
	if (video) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
		src,
		muted: true,
		playsInline: true,
		preload: "metadata",
		className: "h-full w-full object-cover"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src,
		alt: "",
		loading: "lazy",
		className: "h-full w-full object-cover"
	});
}
function Highlights({ userId, posts }) {
	const { moments, archive } = useMoments();
	const [highlights, setHighlights] = (0, import_react.useState)([]);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [step, setStep] = (0, import_react.useState)(0);
	const [selected, setSelected] = (0, import_react.useState)(/* @__PURE__ */ new Map());
	const [title, setTitle] = (0, import_react.useState)("");
	const [cover, setCover] = (0, import_react.useState)(null);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [viewer, setViewer] = (0, import_react.useState)(null);
	const coverInput = (0, import_react.useRef)(null);
	const loadHighlights = (0, import_react.useCallback)(async (ownerId) => {
		const { data, error } = await supabase.from("highlights").select("*").eq("user_id", ownerId).order("created_at", { ascending: true });
		if (error) {
			console.error("[highlights] load failed", {
				ownerId,
				code: error.code,
				message: error.message,
				details: error.details,
				hint: error.hint
			});
			throw error;
		}
		const next = data ?? [];
		setHighlights(next);
		return next;
	}, []);
	(0, import_react.useEffect)(() => {
		if (!userId) return;
		let cancelled = false;
		loadHighlights(userId).catch((error) => {
			if (cancelled) return;
			console.error("[highlights] initial load failed", error);
		});
		return () => {
			cancelled = true;
		};
	}, [loadHighlights, userId]);
	const storyItems = (0, import_react.useMemo)(() => [...moments, ...archive].filter((m) => m.mine).map((m) => ({
		source: "story",
		refId: m.id,
		thumb: m.media ?? "",
		media: m.media,
		mediaType: m.kind === "video" ? "video" : "image"
	})), [moments, archive]);
	const topReels = (0, import_react.useMemo)(() => [...posts].filter((p) => p.kind === "reel").sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).map((p) => ({
		source: "post",
		refId: p.id,
		thumb: p.media_url,
		media: p.media_url,
		mediaType: "video"
	})), [posts]);
	const postItems = (0, import_react.useMemo)(() => posts.map((p) => ({
		source: "post",
		refId: p.id,
		thumb: p.media_url,
		media: p.media_url,
		mediaType: p.media_type
	})), [posts]);
	const toggle = (item) => {
		setSelected((prev) => {
			const next = new Map(prev);
			const key = `${item.source}:${item.refId}`;
			if (next.has(key)) next.delete(key);
			else next.set(key, item);
			return next;
		});
	};
	const reset = () => {
		setStep(0);
		setSelected(/* @__PURE__ */ new Map());
		setTitle("");
		setCover(null);
	};
	const pickCover = async (file) => {
		if (!file) return;
		try {
			const dataUrl = await compressImageFile(file, {
				maxDim: MAX_COVER_EDGE,
				quality: .8
			});
			setCover(dataUrl);
		} catch {
			toast.error("Could not load that image");
		}
	};
	const save = async () => {
		if (!userId) return;
		if (!title.trim()) {
			toast.error("Add a highlight title");
			return;
		}
		const items = [...selected.values()];
		if (!items.length) {
			toast.error("Select at least one item");
			return;
		}
		setSaving(true);
		try {
			const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
			if (sessionError) throw sessionError;
			const sessionUserId = sessionData.session?.user.id;
			if (!sessionUserId) throw new Error("Sign in to save a highlight");
			if (sessionUserId !== userId) throw new Error("You can only save highlights to your own profile");
			const coverSource = cover ?? items[0]?.thumb ?? null;
			let coverUrl = coverSource;
			if (coverSource?.startsWith("data:")) {
				const path = `${sessionUserId}/highlight-${crypto.randomUUID()}.jpg`;
				const upload = await uploadSourceWithProgress(STORAGE_BUCKETS.uploads, path, coverSource, "image/jpeg");
				if (upload.error || !upload.url) {
					console.error("[highlights] custom cover upload failed", {
						bucket: STORAGE_BUCKETS.uploads,
						path,
						error: upload.error
					});
					throw new Error(upload.error ?? "Could not upload the highlight cover");
				}
				coverUrl = upload.url;
			}
			const payload = {
				user_id: sessionUserId,
				title: title.trim(),
				cover_url: coverUrl ?? null,
				items: items.map(({ source, refId, thumb, media, mediaType }) => ({
					source,
					refId,
					thumb,
					media: media ?? null,
					mediaType: mediaType ?? null
				}))
			};
			const { data, error } = await supabase.from("highlights").insert(payload).select("id,user_id,title,cover_url,items,created_at").single();
			if (error) {
				console.error("[highlights] insert failed", {
					userId: sessionUserId,
					itemCount: items.length,
					hasCustomCover: Boolean(cover),
					code: error.code,
					message: error.message,
					details: error.details,
					hint: error.hint
				});
				throw error;
			}
			const saved = data;
			setHighlights((h) => [...h, saved]);
			try {
				await loadHighlights(sessionUserId);
			} catch (refreshError) {
				console.error("[highlights] saved but refresh failed", refreshError);
			}
			toast.success("Highlight added");
			setOpen(false);
			reset();
		} catch (e) {
			console.error("[highlights] save failed", {
				userId,
				itemCount: items.length,
				hasCustomCover: Boolean(cover),
				error: e
			});
			toast.error(e instanceof Error ? e.message : "Could not save highlight");
		} finally {
			setSaving(false);
		}
	};
	const renderGrid = (items) => {
		if (!items.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "py-10 text-center text-sm text-muted-foreground",
			children: "Nothing here yet."
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-3 gap-1.5",
			children: items.map((item) => {
				const key = `${item.source}:${item.refId}`;
				const active = selected.has(key);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => toggle(item),
					className: "relative aspect-square overflow-hidden rounded-lg border border-border bg-muted transition-transform active:scale-95",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thumb, {
							src: item.thumb,
							video: item.mediaType === "video"
						}),
						active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground shadow",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3 w-3" })
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("absolute inset-0 transition-colors", active ? "bg-primary/20 ring-2 ring-inset ring-primary" : "bg-transparent") })
					]
				}, key);
			})
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "px-4 pt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "no-scrollbar flex gap-4 overflow-x-auto pb-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setOpen(true),
					className: "flex w-[68px] shrink-0 flex-col items-center gap-1.5 transition-transform active:scale-95",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid h-[60px] w-[60px] place-items-center rounded-full border border-border/60 bg-muted/40 backdrop-blur-md",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
							className: "h-6 w-6 text-muted-foreground",
							strokeWidth: 1.8
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "w-full truncate text-center text-[11px] text-muted-foreground",
						children: "New"
					})]
				}), highlights.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setViewer(h),
					className: "flex w-[68px] shrink-0 flex-col items-center gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "h-[60px] w-[60px] overflow-hidden rounded-full border border-border/60 bg-muted/40 p-[2px]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block h-full w-full overflow-hidden rounded-full",
							children: h.cover_url ? h.items?.[0]?.mediaType === "video" && !h.cover_url.startsWith("data:") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thumb, {
								src: h.cover_url,
								video: true
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thumb, { src: h.cover_url }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-full w-full place-items-center bg-muted text-xs font-semibold text-muted-foreground",
								children: h.title.slice(0, 1).toUpperCase()
							})
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "w-full truncate text-center text-[11px] text-muted-foreground",
						children: h.title
					})]
				}, h.id))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open,
				onOpenChange: (o) => {
					setOpen(o);
					if (!o) reset();
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-md border-border/60 bg-background/80 p-0 backdrop-blur-xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, {
						className: "px-4 pt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: step === 0 ? "New highlight" : "Name your highlight" })
					}), step === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-4 pb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
							defaultValue: "stories",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
								className: "grid w-full grid-cols-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
										value: "stories",
										children: "Stories"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
										value: "top",
										children: "Reels"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
										value: "posts",
										children: "Posts"
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 max-h-[46vh] overflow-y-auto pr-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
										value: "stories",
										className: "mt-0",
										children: renderGrid(storyItems)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
										value: "top",
										className: "mt-0",
										children: renderGrid(topReels)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
										value: "posts",
										className: "mt-0",
										children: renderGrid(postItems)
									})
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between pt-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-muted-foreground",
								children: [selected.size, " selected"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "rounded-full",
								disabled: !selected.size,
								onClick: () => setStep(1),
								children: ["Next ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-1 h-4 w-4" })]
							})]
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4 px-4 pb-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => coverInput.current?.click(),
									className: "relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted/40 transition-transform active:scale-95",
									children: [cover ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thumb, { src: cover }) : selected.size ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thumb, {
										src: [...selected.values()][0]?.thumb,
										video: [...selected.values()][0]?.mediaType === "video"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "grid h-full w-full place-items-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "h-6 w-6 text-muted-foreground" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "absolute inset-0 grid place-items-center bg-black/25 opacity-0 transition-opacity hover:opacity-100",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "h-5 w-5 text-white" })
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: title,
										onChange: (e) => setTitle(e.target.value),
										placeholder: "Highlight title",
										maxLength: 30,
										className: "bg-muted/40"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "pt-1.5 text-[11px] text-muted-foreground",
										children: "Tap the circle to set a custom cover (optional)."
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: coverInput,
								type: "file",
								accept: "image/*",
								className: "hidden",
								onChange: (e) => void pickCover(e.target.files?.[0])
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "ghost",
									className: "rounded-full",
									onClick: () => setStep(0),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "mr-1 h-4 w-4" }), " Back"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "rounded-full",
									disabled: saving,
									onClick: () => void save(),
									children: saving ? "Saving…" : "Save highlight"
								})]
							})
						]
					})]
				})
			}),
			viewer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HighlightViewer, {
				highlight: viewer,
				onClose: () => setViewer(null)
			}) : null
		]
	});
}
function HighlightViewer({ highlight, onClose }) {
	const [index, setIndex] = (0, import_react.useState)(0);
	const [progress, setProgress] = (0, import_react.useState)(0);
	const [paused, setPaused] = (0, import_react.useState)(false);
	const [muted, setMuted] = (0, import_react.useState)(true);
	const videoRef = (0, import_react.useRef)(null);
	const current = highlight.items[index];
	(0, import_react.useEffect)(() => {
		setProgress(0);
		setPaused(false);
	}, [index]);
	(0, import_react.useEffect)(() => {
		if (!current || current.mediaType === "video" || paused) return;
		const timer = window.setInterval(() => {
			setProgress((p) => {
				if (p >= 100) {
					if (index >= highlight.items.length - 1) onClose();
					else setIndex((i) => i + 1);
					return 0;
				}
				return p + 2;
			});
		}, 100);
		return () => window.clearInterval(timer);
	}, [
		current,
		paused,
		index,
		highlight.items.length,
		onClose
	]);
	(0, import_react.useEffect)(() => {
		if (!videoRef.current) return;
		if (paused) videoRef.current.pause();
		else videoRef.current.play().catch(() => {});
	}, [paused, index]);
	if (!current) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[9999] flex items-center justify-center bg-black",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative h-full w-full max-w-md overflow-hidden",
			children: [
				highlight.items.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute left-2 right-2 top-3 z-20 h-1 overflow-hidden rounded-full bg-white/30",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full bg-white",
						style: { width: i < index ? "100%" : i === index ? `${progress}%` : "0%" }
					})
				}, i)),
				current.mediaType === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
					ref: videoRef,
					src: current.media ?? current.thumb,
					autoPlay: true,
					muted,
					playsInline: true,
					className: "h-full w-full object-contain",
					onTimeUpdate: (e) => {
						const v = e.currentTarget;
						if (v.duration) setProgress(v.currentTime / v.duration * 100);
					},
					onEnded: () => index >= highlight.items.length - 1 ? onClose() : setIndex((i) => i + 1)
				}, current.refId) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: current.media ?? current.thumb,
					alt: "",
					className: "h-full w-full object-contain"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-x-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-black/75 to-transparent px-3 pb-8 pt-7",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-semibold text-white",
						children: highlight.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setPaused((p) => !p),
								className: "grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur-xl",
								"aria-label": paused ? "Play" : "Pause",
								children: paused ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "h-4 w-4" })
							}),
							current.mediaType === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setMuted((m) => !m),
								className: "grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur-xl",
								"aria-label": "Toggle sound",
								children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "h-4 w-4" })
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: onClose,
								className: "grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur-xl",
								"aria-label": "Close",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Previous clip",
					onClick: () => setIndex((i) => Math.max(0, i - 1)),
					className: "absolute inset-y-0 left-0 z-20 w-2/5"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Next clip",
					onClick: () => index >= highlight.items.length - 1 ? onClose() : setIndex((i) => i + 1),
					className: "absolute inset-y-0 right-0 z-20 w-3/5"
				}),
				paused ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "pointer-events-none absolute bottom-8 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "mr-1 inline h-3 w-3" }), "Paused"]
				}) : null
			]
		})
	});
}
function ProfilePage() {
	const { profile, avatarSrc, coverSrc, grid, reels, posts, savedPosts, loading, save, userId, reload } = useMyProfile();
	const navigate = useNavigate();
	const [editOpen, setEditOpen] = (0, import_react.useState)(false);
	const counts = useFollowCounts(userId);
	const [listOpen, setListOpen] = (0, import_react.useState)(false);
	const [listTab, setListTab] = (0, import_react.useState)("followers");
	const [manage, setManage] = (0, import_react.useState)(null);
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [title, setTitle] = (0, import_react.useState)("");
	const [caption, setCaption] = (0, import_react.useState)("");
	const [location, setLocation] = (0, import_react.useState)("");
	const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [sportsDetailsOpen, setSportsDetailsOpen] = (0, import_react.useState)(false);
	const [sportsDocuments, setSportsDocuments] = (0, import_react.useState)([]);
	const [sportsDocumentsLoading, setSportsDocumentsLoading] = (0, import_react.useState)(false);
	const [sportsDocumentsError, setSportsDocumentsError] = (0, import_react.useState)(null);
	const [sportsDocumentsUploading, setSportsDocumentsUploading] = (0, import_react.useState)(false);
	const [sportsDocumentToDelete, setSportsDocumentToDelete] = (0, import_react.useState)(null);
	const [sportsDocumentDeleting, setSportsDocumentDeleting] = (0, import_react.useState)(false);
	const [sportsIntroductionUrl, setSportsIntroductionUrl] = (0, import_react.useState)(null);
	const [sportsIntroductionUploading, setSportsIntroductionUploading] = (0, import_react.useState)(false);
	const [sportsIntroductionProgress, setSportsIntroductionProgress] = (0, import_react.useState)(0);
	const [sportsVerificationSubmitting, setSportsVerificationSubmitting] = (0, import_react.useState)(false);
	const openManage = (post) => {
		setManage(post);
		setEditing(false);
		setTitle(post.title ?? "");
		setCaption(post.caption ?? "");
		setLocation(post.location ?? "");
	};
	const startEdit = (post) => {
		setTitle(post.title ?? "");
		setCaption(post.caption ?? "");
		setLocation(post.location ?? "");
		setEditing(true);
	};
	const patchManaged = async (patch, msg) => {
		if (!manage) return;
		const prev = manage;
		setManage({
			...manage,
			...patch
		});
		try {
			await updateMyPost(prev.id, patch);
			toast.success(msg);
			await reload();
		} catch (e) {
			setManage(prev);
			toast.error(e instanceof Error ? e.message : "Couldn't update");
		}
	};
	const sortPinned = (list) => [...list].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
	const openViewer = (post) => {
		const id = typeof post?.id === "string" ? post.id.trim() : "";
		if (!id) {
			toast.error("This media is unavailable.");
			return;
		}
		if (post.kind === "reel") {
			navigate({
				to: "/reels",
				search: {
					reelId: void 0,
					userId: post.user_id,
					initialVideoId: id,
					returnTo: "profile"
				}
			});
			return;
		}
		navigate({
			to: "/reels",
			search: {
				reelId: void 0,
				userId: post.user_id,
				initialVideoId: id,
				returnTo: "profile"
			}
		});
	};
	const reelMedia = useResolvedMedia([...posts, ...savedPosts].filter((p) => p.kind === "reel").map((p) => p.media_url), "reels");
	const videoMedia = useResolvedMedia([...posts, ...savedPosts].filter((p) => p.kind === "video").map((p) => p.media_url), "videos");
	const src = (u) => reelMedia[u] ?? videoMedia[u] ?? u;
	const avatarUser = {
		id: userId ?? "me",
		username: profile.username || "you",
		name: profile.display_name || profile.username || "You",
		hue: 280
	};
	const sportsProfile = getSportsProfile({
		...profile,
		username: profile.username,
		displayName: profile.display_name
	});
	const hasSportsProfile = Boolean(sportsProfile);
	const sportsNameBadge = sportsProfile?.verified && sportsProfile.status !== "Not recorded" ? `${sportsProfile.status.toUpperCase()} ${sportsProfile.role.toUpperCase()}` : null;
	const sportsQualification = sportsProfile && [sportsProfile.coachQualification, sportsProfile.qualificationYear].filter((value) => value && value !== "Not recorded").join(" · ");
	const sportsCountry = sportsProfile && sportsProfile.represents !== "Not specified" ? sportsProfile.represents : null;
	(0, import_react.useEffect)(() => {
		if (!sportsDetailsOpen || !hasSportsProfile || !userId || userId !== profile.id) {
			setSportsDocuments([]);
			setSportsDocumentsError(null);
			setSportsDocumentsLoading(false);
			return;
		}
		let cancelled = false;
		setSportsDocumentsLoading(true);
		setSportsDocumentsError(null);
		listSportsDocuments(userId).then((documents) => {
			if (!cancelled) setSportsDocuments(documents);
		}).catch((error) => {
			if (!cancelled) {
				setSportsDocuments([]);
				setSportsDocumentsError(error instanceof Error ? error.message : "Documents are unavailable.");
			}
		}).finally(() => {
			if (!cancelled) setSportsDocumentsLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, [
		hasSportsProfile,
		profile.id,
		sportsDetailsOpen,
		userId
	]);
	(0, import_react.useEffect)(() => {
		const path = sportsProfile?.sportsIntroductionPath;
		if (!sportsDetailsOpen || !path) {
			setSportsIntroductionUrl(null);
			return;
		}
		let cancelled = false;
		resolveMediaUrl(path, STORAGE_BUCKETS.videos).then((url) => {
			if (!cancelled) setSportsIntroductionUrl(url);
		});
		return () => {
			cancelled = true;
		};
	}, [sportsDetailsOpen, sportsProfile?.sportsIntroductionPath]);
	const openSportsDocument = async (document, download) => {
		if (!userId || userId !== profile.id) return;
		try {
			const url = await createSportsDocumentSignedUrl(userId, document.path);
			const anchor = window.document.createElement("a");
			anchor.href = url;
			anchor.rel = "noopener noreferrer";
			if (download) anchor.download = document.name;
			else anchor.target = "_blank";
			anchor.click();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "This document is unavailable.");
		}
	};
	const handleSportsDocumentUpload = async (file) => {
		if (!userId || userId !== profile.id) return;
		setSportsDocumentsUploading(true);
		try {
			const document = await uploadSportsDocument(userId, file);
			setSportsDocuments((current) => [document, ...current]);
			toast.success("Document uploaded securely");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Couldn't upload this document.");
		} finally {
			setSportsDocumentsUploading(false);
		}
	};
	const handleSportsDocumentDelete = async () => {
		if (!sportsDocumentToDelete || !userId || userId !== profile.id) return;
		const document = sportsDocumentToDelete;
		setSportsDocumentDeleting(true);
		try {
			await deleteSportsDocument(userId, document.path);
			setSportsDocuments((current) => current.filter((item) => item.path !== document.path));
			setSportsDocumentToDelete(null);
			toast.success("Document deleted");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Couldn't delete this document.");
		} finally {
			setSportsDocumentDeleting(false);
		}
	};
	const handleSportsIntroductionUpload = async (file) => {
		if (!userId || userId !== profile.id || !sportsProfile) return;
		const previousPath = sportsProfile.sportsIntroductionPath;
		setSportsIntroductionUploading(true);
		setSportsIntroductionProgress(0);
		try {
			const nextPath = await uploadSportsIntroduction(userId, file, (progress) => setSportsIntroductionProgress(progress));
			const draft = toSportsProfileDraft(sportsProfile);
			draft.sportsIntroductionPath = nextPath;
			await saveSportsDetails(draft);
			if (previousPath && previousPath !== nextPath) await deleteSportsIntroduction(userId, previousPath);
			toast.success(previousPath ? "Sports Introduction replaced" : "Sports Introduction uploaded");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Couldn't upload this video.");
		} finally {
			setSportsIntroductionUploading(false);
		}
	};
	const handleSportsIntroductionDelete = async () => {
		if (!userId || userId !== profile.id || !sportsProfile?.sportsIntroductionPath) return;
		const path = sportsProfile.sportsIntroductionPath;
		setSportsIntroductionUploading(true);
		try {
			const draft = toSportsProfileDraft(sportsProfile);
			draft.sportsIntroductionPath = "";
			await saveSportsDetails(draft);
			await deleteSportsIntroduction(userId, path);
			toast.success("Sports Introduction deleted");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Couldn't delete this video.");
		} finally {
			setSportsIntroductionUploading(false);
		}
	};
	const editValue = {
		name: profile.display_name,
		username: profile.username,
		category: profile.category,
		bio: profile.bio,
		location: profile.location,
		website: profile.website,
		avatarUrl: avatarSrc ?? void 0,
		verificationRequested: profile.verification_requested
	};
	const saveSportsDetails = async (draft) => {
		if (!sportsProfile) return;
		await save({
			...editValue,
			username: draft.username.trim() || profile.username,
			category: `${draft.role}${draft.sport.trim() ? ` · ${draft.sport.trim()}` : ""}`,
			bio: serializeSportsProfileBio(profile.bio, draft)
		});
		toast.success("Sports details saved");
	};
	const handleSubmitSportsVerification = async () => {
		if (!userId || userId !== profile.id || profile.verification_requested || profile.is_verified) return;
		setSportsVerificationSubmitting(true);
		try {
			await save({
				...editValue,
				verificationRequested: true
			});
			toast.success("Verification request submitted");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Couldn't submit for verification.");
		} finally {
			setSportsVerificationSubmitting(false);
		}
	};
	if (!loading && !userId) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative min-h-screen",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "sticky top-0 z-40 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border glass px-4 py-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-xl font-bold",
				children: "Profile"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/settings",
				"aria-label": "Settings",
				className: "transition-transform active:scale-90",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "h-6 w-6" })
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid place-items-center px-6 py-24 text-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Sign in to see your profile."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/auth",
				className: "mt-4 inline-block rounded-full bg-foreground px-5 py-2 text-xs font-semibold text-background",
				children: "Sign in"
			})] })
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative overflow-hidden pb-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserWatermark, { username: profile.username }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "header-lux sticky top-0 z-40 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					"data-testid": "text-profile-username",
					className: "flex min-w-0 items-center gap-2 font-display text-lg font-bold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-xs font-black text-primary",
						children: "YW"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "truncate",
						children: ["@", profile.username || "…"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					"data-testid": "link-profile-settings",
					to: "/settings",
					"aria-label": "Settings",
					className: "action-btn grid h-9 w-9 place-items-center rounded-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "h-6 w-6" })
				})]
			}),
			coverSrc ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative h-28 overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: coverSrc,
					alt: "",
					className: "h-full w-full object-cover opacity-70"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-b from-background/10 via-background/30 to-background" })]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-10 bg-gradient-to-b from-primary/10 to-transparent" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "-mt-2 px-4 pt-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-[86px] w-[86px] shrink-0 place-items-center rounded-full p-[3px] ring-story",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-full w-full place-items-center rounded-full bg-background p-[2px]",
								children: avatarSrc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									"data-testid": "img-profile-avatar",
									src: avatarSrc,
									alt: "",
									className: "h-[74px] w-[74px] rounded-full object-cover"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(YwAvatar, {
									user: avatarUser,
									size: 74
								})
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										"data-testid": "text-profile-display-name",
										className: "font-semibold",
										children: profile.display_name || "Add your name"
									}), sportsNameBadge ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsProfileBadge, {
										badge: sportsNameBadge,
										verified: true
									}) : null]
								}),
								sportsProfile ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-1 space-y-0.5 text-xs text-muted-foreground",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "font-medium text-foreground",
											children: [
												sportsProfile.sport,
												" · ",
												sportsProfile.role
											]
										}),
										sportsQualification ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Qualification: ", sportsQualification] }) : null,
										sportsCountry ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["🌐 ", sportsCountry] }) : null
									]
								}) : profile.category ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-muted-foreground",
									children: profile.category
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
									"data-testid": "stats-profile",
									className: "mt-3 grid grid-cols-3 text-center",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
											label: "Posts",
											value: formatCount(posts.length)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
											label: "Followers",
											value: counts.followers === null ? "—" : formatCount(counts.followers),
											onClick: () => {
												setListTab("followers");
												setListOpen(true);
											}
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
											label: "Following",
											value: counts.following === null ? "—" : formatCount(counts.following),
											onClick: () => {
												setListTab("following");
												setListOpen(true);
											}
										})
									]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pt-3",
						children: [profile.bio ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bio, { text: profile.bio }) : null, (profile.location || profile.website) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 text-xs",
							children: [profile.location ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1 text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
									className: "h-3.5 w-3.5",
									strokeWidth: 1.8
								}), profile.location]
							}) : null, profile.website ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: profile.website.startsWith("http") ? profile.website : `https://${profile.website}`,
								target: "_blank",
								rel: "noopener noreferrer",
								className: "flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, {
									className: "h-3.5 w-3.5",
									strokeWidth: 1.8
								}), profile.website.replace(/^https?:\/\//, "")]
							}) : null]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2 pt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							"data-testid": "button-edit-profile",
							variant: "secondary",
							className: "h-10 rounded-full",
							onClick: () => setEditOpen(true),
							children: "Edit profile"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							"data-testid": "button-share-profile",
							variant: "secondary",
							className: "h-10 rounded-full",
							onClick: async () => {
								const url = `${window.location.origin}/profile`;
								try {
									if (navigator.share) await navigator.share({
										title: profile.username,
										url
									});
									else {
										await navigator.clipboard.writeText(url);
										toast.success("Profile link copied");
									}
								} catch {}
							},
							children: "Share profile"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Highlights, {
				userId,
				posts: posts.map((post) => ({
					...post,
					media_url: src(post.media_url)
				}))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
				defaultValue: "videos",
				className: "pt-7",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
						className: "grid w-full grid-cols-3 rounded-none border-y border-border/70 bg-background/70 p-0 backdrop-blur-xl",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "videos",
								className: "rounded-none py-3 text-xs data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur-md",
								"aria-label": "Videos",
								children: "Videos"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "reels",
								className: "rounded-none py-3 text-xs data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur-md",
								"aria-label": "Reels",
								children: "Reels"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "saved",
								className: "rounded-none py-3 text-xs data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur-md",
								"aria-label": "Saved",
								children: "Saved"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "videos",
						className: "mt-0",
						children: grid.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaGrid, {
							onOpen: openViewer,
							onManage: openManage,
							items: sortPinned(grid).map((p) => ({
								src: src(p.media_url),
								type: p.kind === "video" ? "video" : p.media_type,
								post: p,
								ratio: mediaAspect(p)
							}))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { text: loading ? "Loading your posts…" : "No posts yet. Create your first one." })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "reels",
						className: "mt-0",
						children: reels.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaGrid, {
							onOpen: openViewer,
							onManage: openManage,
							items: sortPinned(reels).map((p) => ({
								src: src(p.media_url),
								type: "video",
								post: p,
								ratio: mediaAspect(p)
							}))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { text: loading ? "Loading reels…" : "No reels yet." })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "saved",
						className: "mt-0",
						children: savedPosts.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaGrid, {
							onOpen: openViewer,
							items: savedPosts.map((p) => ({
								src: src(p.media_url),
								type: "video",
								post: p,
								ratio: mediaAspect(p)
							}))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { text: "Nothing saved yet. Tap the bookmark on a post to keep it here." })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: !!manage && !editing,
				onOpenChange: (o) => !o && setManage(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
					side: "bottom",
					className: "rounded-t-3xl border-border px-0 pb-6 pt-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/40" }), manage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-h-[70vh] overflow-y-auto",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "h-5 w-5" }),
								label: "Hide like count to others",
								sub: "Only you will see the total number of likes.",
								toggle: !!manage.hide_like_count,
								onToggle: (v) => patchManaged({ hide_like_count: v }, v ? "Like count hidden" : "Like count visible")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-5 w-5" }),
								label: "Hide share count",
								sub: "Others won't see how many times this was shared.",
								toggle: !!manage.hide_share_count,
								onToggle: (v) => patchManaged({ hide_share_count: v }, v ? "Share count hidden" : "Share count visible")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircleOff, { className: "h-5 w-5" }),
								label: "Turn off commenting",
								sub: "No one can comment on this post.",
								toggle: !!manage.comments_off,
								onToggle: (v) => patchManaged({ comments_off: v }, v ? "Commenting turned off" : "Commenting turned on")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: manage.pinned ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PinOff, { className: "h-5 w-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: "h-5 w-5" }),
								label: manage.pinned ? "Unpin from your grid" : "Pin to your main grid",
								onClick: () => patchManaged({ pinned: !manage.pinned }, manage.pinned ? "Unpinned" : "Pinned to your grid")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-5 w-5" }),
								label: "Edit",
								onClick: () => startEdit(manage)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "h-5 w-5" }),
								label: "Copy link",
								onClick: async () => {
									try {
										await navigator.clipboard.writeText(`${window.location.origin}/?post=${manage.id}`);
										toast.success("Link copied");
									} catch {
										toast.error("Couldn't copy link");
									}
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Archive, { className: "h-5 w-5" }),
								label: manage.archived ? "Unarchive" : "Archive",
								onClick: () => patchManaged({ archived: !manage.archived }, manage.archived ? "Unarchived" : "Archived")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-5 w-5" }),
								label: "Delete",
								destructive: true,
								onClick: () => setConfirmDelete(true)
							})
						]
					}) : null]
				})
			}),
			sportsProfile ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: sportsDetailsOpen,
				onOpenChange: setSportsDetailsOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
					side: "bottom",
					className: "max-h-[90vh] overflow-y-auto rounded-t-[2rem] border-amber-200/20 bg-[#0b0c12] px-4 pb-8 pt-5 text-white sm:mx-auto sm:max-w-xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, {
						className: "mb-5 pr-8 text-left",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-11 w-11 place-items-center rounded-2xl border border-amber-200/25 bg-amber-300/10 text-amber-200",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { className: "h-5 w-5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, {
								className: "text-left text-xl text-white",
								children: "Sports Details"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetDescription, {
								className: "text-left text-zinc-400",
								children: "Public sports identity and verified profile information."
							})] })]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsDetailsPanel, {
						profile: sportsProfile,
						isOwner: Boolean(userId && userId === profile.id),
						documents: sportsDocuments,
						documentsLoading: sportsDocumentsLoading,
						documentsError: sportsDocumentsError,
						documentsUploading: sportsDocumentsUploading,
						onUploadDocument: handleSportsDocumentUpload,
						onDocumentAction: openSportsDocument,
						onDeleteDocument: setSportsDocumentToDelete,
						onSave: saveSportsDetails,
						sportsIntroductionUrl,
						sportsIntroductionUploading,
						sportsIntroductionProgress,
						onUploadSportsIntroduction: handleSportsIntroductionUpload,
						onDeleteSportsIntroduction: handleSportsIntroductionDelete,
						onSubmitVerification: handleSubmitSportsVerification,
						verificationSubmitting: sportsVerificationSubmitting
					})]
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!manage && editing,
				onOpenChange: (o) => !o && setEditing(false),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-md gap-0 overflow-hidden p-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, {
						className: "grid grid-cols-[auto_1fr_auto] items-center border-b border-border px-4 py-3 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "sm",
								className: "h-8 px-2",
								onClick: () => setEditing(false),
								children: "Cancel"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
								className: "text-sm font-semibold",
								children: ["Edit ", manage?.kind === "reel" ? "reel" : "post"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								className: "h-8 rounded-full px-4",
								disabled: busy,
								onClick: async () => {
									if (!manage) return;
									setBusy(true);
									try {
										await updateMyPost(manage.id, {
											title,
											caption,
											location: location.trim() || null
										});
										toast.success("Updated");
										setEditing(false);
										setManage(null);
										await reload();
									} catch (e) {
										toast.error(e instanceof Error ? e.message : "Couldn't update");
									} finally {
										setBusy(false);
									}
								},
								children: busy ? "Saving…" : "Done"
							})
						]
					}), manage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-h-[75vh] overflow-y-auto",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "relative bg-secondary",
							children: manage.media_type?.startsWith("video") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
								src: src(manage.media_url),
								controls: true,
								playsInline: true,
								className: "max-h-64 w-full object-contain"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: src(manage.media_url),
								alt: "",
								className: "max-h-64 w-full object-contain"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1 px-4 py-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-3 py-1.5",
									children: [avatarSrc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: avatarSrc,
										alt: "",
										className: "h-9 w-9 rounded-full object-cover"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(YwAvatar, {
										user: avatarUser,
										size: 36
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "pb-1 text-sm font-semibold",
												children: ["@", profile.username || "you"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
												value: caption,
												onChange: (e) => setCaption(e.target.value.slice(0, 2200)),
												placeholder: "Write a caption…",
												rows: 4,
												className: "resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												"data-testid": "input-edit-post-title",
												value: title,
												onChange: (e) => setTitle(e.target.value.slice(0, 180)),
												placeholder: "Add a title",
												className: "mb-2 w-full border-b border-border/60 bg-transparent pb-2 text-sm font-semibold outline-none placeholder:text-muted-foreground"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "pt-1 text-right text-[11px] text-muted-foreground",
												children: [caption.length, "/2,200"]
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 border-t border-border py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
										className: "h-5 w-5 shrink-0 text-muted-foreground",
										strokeWidth: 1.8
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: location,
										onChange: (e) => setLocation(e.target.value),
										placeholder: "Add location",
										className: "w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between border-t border-border py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm",
										children: "Hide like count to others"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: "Only you will see total likes."
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
										checked: !!manage.hide_like_count,
										onCheckedChange: (v) => patchManaged({ hide_like_count: v }, v ? "Like count hidden" : "Like count visible")
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between border-t border-border py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm",
										children: "Turn off commenting"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: "No one can comment on this post."
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
										checked: !!manage.comments_off,
										onCheckedChange: (v) => patchManaged({ comments_off: v }, v ? "Commenting turned off" : "Commenting turned on")
									})]
								})
							]
						})]
					}) : null]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: confirmDelete,
				onOpenChange: setConfirmDelete,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogTitle, { children: [
					"Delete this ",
					manage?.kind === "reel" ? "reel" : "post",
					"?"
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "This permanently removes it and its media. This can't be undone." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Cancel" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					onClick: async () => {
						if (!manage) return;
						try {
							await deleteMyPost(manage);
							toast.success("Deleted");
							setManage(null);
							await reload();
						} catch (e) {
							toast.error(e instanceof Error ? e.message : "Couldn't delete");
						}
					},
					children: "Delete"
				})] })] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: Boolean(sportsDocumentToDelete),
				onOpenChange: (open) => {
					if (!open && !sportsDocumentDeleting) setSportsDocumentToDelete(null);
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "Delete this document?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogDescription, { children: [
					"This permanently removes ",
					sportsDocumentToDelete?.name.split("/").at(-1) || "this document",
					"from your private sports documents. This can't be undone."
				] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, {
					disabled: sportsDocumentDeleting,
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					disabled: sportsDocumentDeleting,
					onClick: (event) => {
						event.preventDefault();
						handleSportsDocumentDelete();
					},
					children: sportsDocumentDeleting ? "Deleting…" : "Delete"
				})] })] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditProfileSheet, {
				open: editOpen,
				onOpenChange: setEditOpen,
				user: avatarUser,
				value: editValue,
				onSave: save,
				sportsProfile,
				onOpenSportsDetails: () => {
					setEditOpen(false);
					setSportsDetailsOpen(true);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FollowListDialog, {
				open: listOpen,
				onOpenChange: setListOpen,
				userId,
				tab: listTab,
				onTabChange: setListTab
			})
		]
	});
}
function OptionRow({ icon, label, sub, toggle, onToggle, onClick, destructive }) {
	const content = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex w-full items-center gap-3 px-5 py-3.5 text-left",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: destructive ? "text-destructive" : "text-foreground",
				children: icon
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `block text-sm font-medium ${destructive ? "text-destructive" : "text-foreground"}`,
					children: label
				}), sub ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-xs text-muted-foreground",
					children: sub
				}) : null]
			}),
			onToggle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
				checked: !!toggle,
				onCheckedChange: onToggle,
				onClick: (e) => e.stopPropagation()
			}) : null
		]
	});
	if (onToggle) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "w-full",
		children: content
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: "w-full transition-colors active:bg-secondary",
		children: content
	});
}
function Empty({ text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		"data-testid": "status-profile-empty",
		className: "px-4 py-14 text-center text-sm text-muted-foreground",
		children: text
	});
}
function Stat({ label, value, onClick }) {
	const body = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
		className: "font-display text-lg font-bold",
		children: value
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
		className: "text-xs text-muted-foreground",
		children: label
	})] });
	if (!onClick) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: body });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: "rounded-xl py-0.5 transition-transform active:scale-95",
		children: body
	});
}
function MediaGrid({ items, onOpen, onManage }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		"data-testid": "grid-profile-media",
		className: "grid grid-cols-3 gap-1 bg-background",
		children: items.map((it, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			"data-testid": `card-profile-media-${it.post?.id ?? i}`,
			className: "media-frame relative overflow-hidden bg-secondary",
			style: { aspectRatio: it.ratio ?? 1 },
			children: [
				it.post?.kind === "video" || it.post?.kind === "reel" || it.type?.startsWith("video") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoPoster, {
					mediaUrl: it.src,
					thumbnailUrl: it.post?.thumbnail_url,
					alt: "",
					className: "h-full w-full object-cover"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: it.src,
					alt: "",
					loading: "lazy",
					className: "h-full w-full object-cover"
				}),
				it.post?.kind === "reel" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "h-3 w-3 fill-current" }), formatCount(it.post.views_count ?? it.post.views ?? 0)]
				}) : it.post?.kind === "video" || it.type?.startsWith("video") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "h-3.5 w-3.5 fill-current" })
				}) : null,
				it.post?.pinned ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: "absolute bottom-1.5 left-1.5 h-4 w-4 fill-current text-white drop-shadow" }) : null,
				it.post?.kind !== "reel" && it.post?.views != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "absolute bottom-1.5 right-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm",
					children: [formatCount(it.post.views), " views"]
				}) : null,
				it.post?.duration_seconds != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute right-1.5 top-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white",
					children: formatDuration(it.post.duration_seconds)
				}) : null,
				it.post && onOpen && (it.post.kind === "reel" || it.post.kind === "video" || it.type?.startsWith("video")) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": `Open ${it.post.kind === "reel" ? "reel" : "post"}`,
					"data-testid": `button-open-media-${it.post.id}`,
					onClick: () => {
						const post = it.post;
						if (!post || typeof post.id !== "string" || !post.id.trim()) return;
						onOpen(post);
					},
					className: "absolute inset-0 z-10"
				}), onManage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Manage post",
					"data-testid": `button-manage-media-${it.post.id}`,
					onClick: (e) => {
						e.stopPropagation();
						onManage(it.post);
					},
					className: "absolute right-1.5 top-1.5 z-20 grid h-7 w-7 place-items-center rounded-full bg-background/75 backdrop-blur transition-transform active:scale-90",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, {
						className: "h-4 w-4",
						strokeWidth: 2
					})
				}) : null] }) : null
			]
		}, `${it.post?.id ?? it.src}-${i}`))
	});
}
function mediaAspect(post) {
	const width = post.original_width;
	const height = post.original_height;
	if (width && height && width > 0 && height > 0) return Math.min(1.65, Math.max(.62, width / height));
	return post.kind === "reel" ? .8 : 1;
}
function formatDuration(seconds) {
	const total = Math.max(0, Math.round(seconds));
	if (total >= 3600) return `${Math.floor(total / 3600)}:${String(Math.floor(total % 3600 / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
//#endregion
export { ProfilePage as component };
