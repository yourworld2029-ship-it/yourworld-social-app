import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { Ct as Lock, F as SlidersHorizontal, G as ScanFace, Ht as EyeOff, I as Shield, It as Handshake, L as ShieldCheck, Pt as Heart, Rt as Flag, V as Settings2, W as Search, _t as MessageCircle, b as TriangleAlert, bn as Ban, bt as MapPin, en as Clock3, gn as CalendarHeart, h as UserRound, i as X, j as Sparkles, lt as Navigation, un as ChevronLeft, vn as Bell, xn as BadgeCheck } from "../_libs/lucide-react.mjs";
import { mt as cn, ot as useNotifications } from "./router-DO0psBY1.mjs";
import { n as SheetContent, t as Sheet } from "./sheet-DNq5-y6u.mjs";
import { _ as useOrbitProfiles, t as approxDistance } from "./orbit-live-bjPOplr-.mjs";
import { c as useOrbit, l as useScreenCaptureShield, n as ORBIT_HOBBIES, r as ORBIT_LOOKING_FOR, t as LOCKED_MESSAGE } from "./orbit-store-Dqto1MGT.mjs";
import { n as useOrbitMatches, t as sendOrbitMatch } from "./orbit-match-CNDtFxKp.mjs";
import { n as moodMatchScore, t as moodById } from "./orbit-mood--S38GIFY.mjs";
import { n as remainingLabel, r as useLiveLocation, t as LiveLocationSheet } from "./LiveLocationSheet-C6P3roXD.mjs";
import { n as citiesOf, r as statesOf, t as GEO_COUNTRIES } from "./geo-data-BFsPnKb3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/orbit.index-BgDVw26L.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* On-device heuristic "AI fake profile detection".
* Runs entirely client-side on public profile fields — no personal data leaves
* the device, and it never sees location coordinates.
*/
function analyzeProfile(p) {
	const handleDigits = (p.handle.match(/\d/g) ?? []).length;
	const signals = [
		{
			label: "Photo passes authenticity check",
			ok: true
		},
		{
			label: "Bio reads as human-written",
			ok: p.about.trim().length >= 40
		},
		{
			label: "Interests look consistent",
			ok: p.interests.length >= 3
		},
		{
			label: "Handle isn't auto-generated",
			ok: handleDigits <= 3
		},
		{
			label: "Identity verified",
			ok: !!p.verified
		}
	];
	const passed = signals.filter((s) => s.ok).length;
	const score = Math.round(passed / signals.length * 100);
	const level = score >= 80 ? "trusted" : score >= 55 ? "review" : "flagged";
	return {
		score,
		level,
		label: level === "trusted" ? "Authenticity checked" : level === "review" ? "Low signal — stay cautious" : "Possible fake profile",
		signals
	};
}
var meetupCategories = [
	{
		id: "cafes",
		emoji: "",
		label: "Cafés"
	},
	{
		id: "restaurants",
		emoji: "",
		label: "Restaurants"
	},
	{
		id: "parks",
		emoji: "",
		label: "Parks"
	},
	{
		id: "malls",
		emoji: "",
		label: "Shopping Malls"
	},
	{
		id: "cinemas",
		emoji: "",
		label: "Movie Theatres"
	},
	{
		id: "bowling",
		emoji: "",
		label: "Bowling"
	},
	{
		id: "attractions",
		emoji: "",
		label: "Tourist Attractions"
	}
];
var catalogue = [
	{
		id: "p1",
		name: "Lantern Row Coffee",
		category: "cafes",
		area: "Central district",
		safety: "Busy all day, street-facing seating",
		hours: "7:00 – 21:00",
		fairness: "Roughly midway"
	},
	{
		id: "p2",
		name: "Blue Hour Espresso Bar",
		category: "cafes",
		area: "Station quarter",
		safety: "Inside a staffed transit hall",
		hours: "6:30 – 22:00",
		fairness: "Short trip for both"
	},
	{
		id: "p3",
		name: "The Copper Table",
		category: "restaurants",
		area: "Old town",
		safety: "Open kitchen, always staffed",
		hours: "11:00 – 23:00",
		fairness: "Roughly midway"
	},
	{
		id: "p4",
		name: "Night Market Hall",
		category: "restaurants",
		area: "Riverside",
		safety: "Public food hall, high footfall",
		hours: "12:00 – 23:30",
		fairness: "Slightly closer to you"
	},
	{
		id: "p5",
		name: "Willow Commons Park",
		category: "parks",
		area: "Green belt",
		safety: "Lit main paths, daytime recommended",
		hours: "Daylight hours",
		fairness: "Roughly midway"
	},
	{
		id: "p6",
		name: "Harbour Promenade",
		category: "parks",
		area: "Coastal district",
		safety: "Open waterfront, constant foot traffic",
		hours: "Daylight hours",
		fairness: "Short trip for both"
	},
	{
		id: "p7",
		name: "Meridian Galleria",
		category: "malls",
		area: "Central district",
		safety: "Security on site, indoor meeting points",
		hours: "10:00 – 22:00",
		fairness: "Roughly midway"
	},
	{
		id: "p8",
		name: "Northside Arcade",
		category: "malls",
		area: "Studio quarter",
		safety: "Staffed entrances, camera coverage",
		hours: "10:00 – 21:00",
		fairness: "Slightly closer to them"
	},
	{
		id: "p9",
		name: "Aurora Cinema 8",
		category: "cinemas",
		area: "Central district",
		safety: "Ticketed public venue, lit lobby",
		hours: "11:00 – 00:30",
		fairness: "Roughly midway"
	},
	{
		id: "p10",
		name: "Reel House Cinematheque",
		category: "cinemas",
		area: "Old town",
		safety: "Small public theatre, staffed foyer",
		hours: "14:00 – 23:00",
		fairness: "Short trip for both"
	},
	{
		id: "p11",
		name: "Strike Lane Bowling",
		category: "bowling",
		area: "Riverside",
		safety: "Family venue, staffed until close",
		hours: "12:00 – 00:00",
		fairness: "Roughly midway"
	},
	{
		id: "p12",
		name: "Pinpoint Social Club",
		category: "bowling",
		area: "Station quarter",
		safety: "Open-plan lanes beside a transit hub",
		hours: "13:00 – 23:00",
		fairness: "Short trip for both"
	},
	{
		id: "p13",
		name: "City Museum Steps",
		category: "attractions",
		area: "Old town",
		safety: "Landmark plaza, always public",
		hours: "9:00 – 18:00",
		fairness: "Roughly midway"
	},
	{
		id: "p14",
		name: "Observatory Lookout",
		category: "attractions",
		area: "Green belt",
		safety: "Ticketed viewpoint with staff on site",
		hours: "10:00 – 20:00",
		fairness: "Slightly closer to them"
	}
];
/** Public places only, filtered by category. Hotels are never included. */
var placesFor = (category) => catalogue.filter((p) => p.category === category);
var meetupTimeSlots = [
	"Today evening",
	"Tomorrow morning",
	"This weekend"
];
var meetupMessage = (place, when) => `Meetup suggestion — ${place.name}\n${categoryLabel(place.category)} · ${place.area} (approx. area only)\n${when} · open ${place.hours}\n${place.safety}`;
var categoryLabel = (id) => {
	return meetupCategories.find((x) => x.id === id)?.label ?? "Public place";
};
function MeetupSheet({ open, onOpenChange, onSend, initialCategory, title = "Plan a meetup" }) {
	const [category, setCategory] = (0, import_react.useState)(initialCategory ?? "cafes");
	const [when, setWhen] = (0, import_react.useState)(meetupTimeSlots[0]);
	const places = placesFor(category);
	(0, import_react.useEffect)(() => {
		if (open && initialCategory) setCategory(initialCategory);
	}, [open, initialCategory]);
	const send = (place) => {
		onSend(meetupMessage(place, when));
		onOpenChange(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
			side: "bottom",
			className: "max-h-[88dvh] overflow-y-auto rounded-t-3xl border-border/60 p-0 [&>button]:hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 pb-8 pt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-11 w-11 place-items-center rounded-2xl bg-secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
								className: "h-5 w-5",
								strokeWidth: 1.7
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => onOpenChange(false),
							"aria-label": "Close",
							className: "grid h-8 w-8 place-items-center rounded-full bg-secondary/70 transition-transform active:scale-90",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
								className: "h-4 w-4",
								strokeWidth: 1.8
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "pt-4 font-display text-lg font-bold",
						children: title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "pt-1.5 text-sm leading-relaxed text-muted-foreground",
						children: "Safe, busy public places picked from the approximate areas you both share."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 flex items-start gap-2 rounded-2xl bg-secondary/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, {
							className: "mt-0.5 h-3.5 w-3.5 shrink-0",
							strokeWidth: 1.8
						}), "Exact locations are never shared — only general areas. Hotels and private stays are excluded."]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
						children: meetupCategories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setCategory(c.id),
							"aria-pressed": category === c.id,
							className: cn("shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors", category === c.id ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"),
							children: c.label
						}, c.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex gap-2",
						children: meetupTimeSlots.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setWhen(t),
							"aria-pressed": when === t,
							className: cn("flex-1 rounded-full px-2 py-2 text-[11px] font-medium transition-colors", when === t ? "bg-secondary text-foreground" : "text-muted-foreground"),
							children: t
						}, t))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-2",
						children: places.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-2xl border border-border/60 bg-secondary/40 p-3.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold",
									children: p.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "pt-0.5 text-xs text-muted-foreground",
									children: [
										p.area,
										" · ",
										p.fairness
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground/85",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, {
											className: "h-3 w-3",
											strokeWidth: 1.8
										}),
										" ",
										p.hours,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											"aria-hidden": true,
											children: "·"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, {
											className: "h-3 w-3",
											strokeWidth: 1.8
										}),
										" ",
										p.safety
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => send(p),
									className: "mt-3 h-10 w-full rounded-full brand-gradient text-xs font-semibold text-primary-foreground transition-transform active:scale-[0.99]",
									children: "Send suggestion"
								})
							]
						}, p.id))
					})
				]
			})
		})
	});
}
function OrbitLockedSheet({ open, onOpenChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
			side: "bottom",
			className: "rounded-t-3xl border-border/60 p-0 [&>button]:hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 pb-8 pt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-11 w-11 place-items-center rounded-2xl bg-secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
								className: "h-5 w-5",
								strokeWidth: 1.7
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => onOpenChange(false),
							"aria-label": "Close",
							className: "grid h-8 w-8 place-items-center rounded-full bg-secondary/70 transition-transform active:scale-90",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
								className: "h-4 w-4",
								strokeWidth: 1.8
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "pt-4 font-display text-lg font-bold",
						children: "Orbit locked"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "pt-1.5 text-sm leading-relaxed text-muted-foreground",
						children: LOCKED_MESSAGE
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "pt-2 text-xs leading-relaxed text-muted-foreground/80",
						children: "Browsing stays free and anonymous. Your Orbit Profile is separate from your main YourWorld profile and can be paused or deleted anytime."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/orbit/create",
						onClick: () => onOpenChange(false),
						className: "mt-5 flex h-12 w-full items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background transition-transform active:scale-[0.99]",
						children: "Create Orbit Profile"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => onOpenChange(false),
						className: "mt-2 h-11 w-full rounded-full text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
						children: "Keep browsing"
					})
				]
			})
		})
	});
}
var emptyOrbitFilters = {
	query: "",
	country: "",
	state: "",
	city: "",
	minAge: 18,
	maxAge: 60,
	gender: "Everyone",
	lookingFor: "",
	hobbies: []
};
function activeFilterCount(f) {
	let n = 0;
	if (f.country) n += 1;
	if (f.state) n += 1;
	if (f.city) n += 1;
	if (f.minAge !== 18 || f.maxAge !== 60) n += 1;
	if (f.gender !== "Everyone") n += 1;
	if (f.lookingFor) n += 1;
	if (f.hobbies.length) n += 1;
	return n;
}
/** Pure client-side matcher — no location beyond the public city is used. */
function matchesOrbitFilters(p, f) {
	const q = f.query.trim().toLowerCase();
	if (q && !p.name.toLowerCase().includes(q)) return false;
	if (f.country && p.country !== f.country) return false;
	if (f.state && p.state !== f.state) return false;
	if (f.city && p.city !== f.city) return false;
	if (p.age < f.minAge || p.age > f.maxAge) return false;
	if (f.gender !== "Everyone" && p.gender !== f.gender) return false;
	if (f.lookingFor && p.lookingFor !== f.lookingFor) return false;
	if (f.hobbies.length && !f.hobbies.some((h) => p.hobbies.includes(h))) return false;
	return true;
}
var selectClass = "h-11 w-full rounded-2xl bg-secondary px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
var labelClass = "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
function OrbitFilterBar({ filters, onChange, onOpen, resultCount }) {
	const count = activeFilterCount(filters);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 pt-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-secondary px-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
					className: "h-4 w-4 shrink-0 text-muted-foreground",
					strokeWidth: 1.8
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "search",
					value: filters.query,
					onChange: (e) => onChange({
						...filters,
						query: e.target.value
					}),
					placeholder: "Search by name",
					"aria-label": "Search Orbit profiles by name",
					className: "min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: onOpen,
				"aria-label": "Open Orbit filters",
				className: "relative grid h-11 w-11 shrink-0 place-items-center rounded-full chip transition-transform active:scale-90",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, {
					className: "h-[18px] w-[18px]",
					strokeWidth: 1.7
				}), count > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[9px] font-bold text-background",
					children: count
				})]
			})]
		}), (count > 0 || filters.query.trim()) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between pt-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[11px] text-muted-foreground",
				children: [
					resultCount,
					" ",
					resultCount === 1 ? "profile" : "profiles",
					" match"
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => onChange(emptyOrbitFilters),
				className: "text-[11px] font-medium text-muted-foreground transition-opacity active:opacity-60",
				children: "Clear all"
			})]
		})]
	});
}
function OrbitFiltersSheet({ open, onOpenChange, filters, onChange, resultCount }) {
	const set = (patch) => onChange({
		...filters,
		...patch
	});
	const toggleHobby = (h) => set({ hobbies: filters.hobbies.includes(h) ? filters.hobbies.filter((x) => x !== h) : [...filters.hobbies, h] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
			side: "bottom",
			className: "max-h-[88vh] overflow-y-auto rounded-t-3xl border-border/60 p-0 [&>button]:hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 pb-8 pt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-lg font-bold",
							children: "Filters"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => onOpenChange(false),
							"aria-label": "Close filters",
							className: "grid h-8 w-8 place-items-center rounded-full bg-secondary/70 transition-transform active:scale-90",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
								className: "h-4 w-4",
								strokeWidth: 1.8
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4 pt-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: "f-country",
								className: labelClass,
								children: "Country"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								id: "f-country",
								value: filters.country,
								onChange: (e) => set({
									country: e.target.value,
									state: "",
									city: ""
								}),
								className: `${selectClass} mt-1.5`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Any country"
								}), GEO_COUNTRIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: c.name,
									children: c.name
								}, c.name))]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: "f-state",
								className: labelClass,
								children: "State"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								id: "f-state",
								value: filters.state,
								disabled: !filters.country,
								onChange: (e) => set({
									state: e.target.value,
									city: ""
								}),
								className: `${selectClass} mt-1.5 disabled:opacity-50`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Any state"
								}), statesOf(filters.country).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: s.name,
									children: s.name
								}, s.name))]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: "f-city",
								className: labelClass,
								children: "City"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								id: "f-city",
								value: filters.city,
								disabled: !filters.state,
								onChange: (e) => set({ city: e.target.value }),
								className: `${selectClass} mt-1.5 disabled:opacity-50`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Any city"
								}), citiesOf(filters.country, filters.state).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: c,
									children: c
								}, c))]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: labelClass,
								children: [
									"Age range · ",
									filters.minAge,
									"–",
									filters.maxAge
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3 pt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "range",
									min: 18,
									max: 60,
									value: filters.minAge,
									"aria-label": "Minimum age",
									onChange: (e) => set({ minAge: Math.min(Number(e.target.value), filters.maxAge) }),
									className: "h-1.5 w-full accent-[currentColor]"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "range",
									min: 18,
									max: 60,
									value: filters.maxAge,
									"aria-label": "Maximum age",
									onChange: (e) => set({ maxAge: Math.max(Number(e.target.value), filters.minAge) }),
									className: "h-1.5 w-full accent-[currentColor]"
								})]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: labelClass,
								children: "Show me"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex gap-2 pt-2",
								children: [
									"Women",
									"Men",
									"Everyone"
								].map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-pressed": filters.gender === g,
									onClick: () => set({ gender: g }),
									className: `flex-1 rounded-full px-3 py-2 text-xs font-medium transition-all active:scale-95 ${filters.gender === g ? "bg-foreground text-background" : "chip text-muted-foreground"}`,
									children: g
								}, g))
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: "f-looking",
								className: labelClass,
								children: "Looking for"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								id: "f-looking",
								value: filters.lookingFor,
								onChange: (e) => set({ lookingFor: e.target.value }),
								className: `${selectClass} mt-1.5`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Any preference"
								}), ORBIT_LOOKING_FOR.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: o,
									children: o
								}, o))]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: labelClass,
								children: "Hobbies"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-1.5 pt-2",
								children: ORBIT_HOBBIES.map((h) => {
									const active = filters.hobbies.includes(h);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-pressed": active,
										onClick: () => toggleHobby(h),
										className: `rounded-full px-3 py-1.5 text-[11px] font-medium transition-all active:scale-95 ${active ? "bg-foreground text-background" : "chip text-muted-foreground"}`,
										children: h
									}, h);
								})
							})] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "pt-4 text-[11px] leading-relaxed text-muted-foreground",
						children: "Country and state are only used to narrow results — only the city is ever shown publicly, and exact locations are never shared."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2 pt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => onChange(emptyOrbitFilters),
							className: "h-12 flex-1 rounded-full chip text-sm font-medium text-muted-foreground transition-transform active:scale-[0.99]",
							children: "Reset"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => onOpenChange(false),
							className: "h-12 flex-[1.4] rounded-full bg-foreground text-sm font-semibold text-background transition-transform active:scale-[0.99]",
							children: [
								"Show ",
								resultCount,
								" ",
								resultCount === 1 ? "profile" : "profiles"
							]
						})]
					})
				]
			})
		})
	});
}
function OrbitBrowse() {
	const orbit = useOrbit();
	const { unreadOrbit: orbitUnread } = useNotifications();
	const [locked, setLocked] = (0, import_react.useState)(false);
	const [menuFor, setMenuFor] = (0, import_react.useState)(null);
	const [meetupFor, setMeetupFor] = (0, import_react.useState)(null);
	const [liveFor, setLiveFor] = (0, import_react.useState)(null);
	const [filters, setFilters] = (0, import_react.useState)(emptyOrbitFilters);
	const [filtersOpen, setFiltersOpen] = (0, import_react.useState)(false);
	const [searchOpen, setSearchOpen] = (0, import_react.useState)(false);
	const live = useLiveLocation();
	const obscured = useScreenCaptureShield(orbit.privacy.screenshotProtection);
	const { profiles: orbitProfiles } = useOrbitProfiles();
	const navigate = useNavigate();
	const { mutual, likedByMe, refresh: refreshMatches } = useOrbitMatches();
	const onMatch = async (id, name) => {
		const next = !likedByMe.includes(id);
		const res = await sendOrbitMatch(id, next);
		refreshMatches();
		if (!res.ok) {
			toast.error("Couldn't send that match — try again.");
			return;
		}
		if (!next) toast.success("Match withdrawn");
		else if (res.mutual) toast.success(`It's a match with ${name}! Chat unlocked.`);
		else toast.success(`Match sent to ${name}`);
	};
	const visible = (0, import_react.useMemo)(() => orbitProfiles.filter((p) => !orbit.privacy.blocked.includes(p.id) && !orbit.privacy.hiddenFrom.includes(p.id) && !(orbit.privacy.aiFakeDetection && orbit.privacy.hideFlaggedProfiles && analyzeProfile(p).level === "flagged")), [
		orbitProfiles,
		orbit.privacy.blocked,
		orbit.privacy.hiddenFrom,
		orbit.privacy.aiFakeDetection,
		orbit.privacy.hideFlaggedProfiles
	]);
	const myMood = orbit.profile?.mood ?? null;
	/** Same-mood and similar-interest people are surfaced first. */
	const ranked = (0, import_react.useMemo)(() => {
		const myInterests = orbit.profile?.hobbies ?? [];
		return visible.filter((p) => matchesOrbitFilters(p, filters)).sort((a, b) => moodMatchScore(b, myMood, myInterests) - moodMatchScore(a, myMood, myInterests));
	}, [
		visible,
		myMood,
		orbit.profile?.hobbies,
		filters
	]);
	const gate = (action) => () => {
		if (!orbit.hasProfile) {
			setLocked(true);
			return;
		}
		action();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen pb-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-50 flex items-center gap-1.5 border-b border-border bg-background px-3 pb-2.5 pt-[calc(env(safe-area-inset-top,0px)+0.625rem)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/settings",
						"aria-label": "Back to settings",
						className: "grid h-8 w-8 place-items-center rounded-full transition-transform active:scale-90",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
							className: "h-[18px] w-[18px]",
							strokeWidth: 1.8
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-base font-bold",
						children: "Orbit"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setSearchOpen((v) => !v),
						"aria-label": searchOpen ? "Close search" : "Open search",
						"aria-pressed": searchOpen,
						className: "grid h-8 w-8 place-items-center rounded-full chip transition-transform active:scale-90",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
							className: "h-[15px] w-[15px]",
							strokeWidth: 1.7
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/orbit/notifications",
						"aria-label": orbitUnread > 0 ? `Orbit notifications, ${orbitUnread} unread` : "Orbit notifications",
						className: "relative ml-auto grid h-8 w-8 place-items-center rounded-full chip transition-transform active:scale-90",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, {
							className: "h-[15px] w-[15px]",
							strokeWidth: 1.6
						}), orbitUnread > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute -right-0.5 -top-0.5 grid h-[14px] min-w-[14px] place-items-center rounded-full bg-primary px-1 text-[8px] font-bold leading-none text-primary-foreground ring-2 ring-background",
							children: orbitUnread > 99 ? "99+" : orbitUnread
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/orbit/messages",
						"aria-label": "Orbit messages",
						className: "grid h-8 w-8 place-items-center rounded-full chip transition-transform active:scale-90",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {
							className: "h-[15px] w-[15px]",
							strokeWidth: 1.6
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/orbit/me",
						"aria-label": "My Orbit profile",
						className: "grid h-8 w-8 place-items-center rounded-full chip transition-transform active:scale-90",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, {
							className: "h-[15px] w-[15px]",
							strokeWidth: 1.6
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/orbit/privacy",
						"aria-label": "Orbit privacy & safety",
						className: "grid h-8 w-8 place-items-center rounded-full chip transition-transform active:scale-90",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, {
							className: "h-[15px] w-[15px]",
							strokeWidth: 1.6
						})
					})
				]
			}),
			!orbit.hasProfile && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-4 pt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card flex items-start gap-3 rounded-3xl p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-secondary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
							className: "h-5 w-5",
							strokeWidth: 1.7
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold",
								children: "Create your Orbit ID"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "pt-0.5 text-xs leading-relaxed text-muted-foreground",
								children: "Browse freely — an Orbit ID unlocks likes, messages and matches. Only approximate areas are ever shown."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/orbit/create",
								className: "mt-3 inline-flex rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition-transform active:scale-95",
								children: "Create Orbit ID"
							})
						]
					})]
				})
			}),
			searchOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitFilterBar, {
				filters,
				onChange: setFilters,
				onOpen: () => setFiltersOpen(true),
				resultCount: ranked.length
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `no-scrollbar flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden px-4 pt-4 ${obscured ? "pointer-events-none blur-xl" : ""}`,
				children: [ranked.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "surface-card animate-rise relative w-full max-w-md shrink-0 snap-center overflow-hidden rounded-[28px]",
					style: { animationDelay: `${i * 40}ms` },
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/u/$userId",
							params: { userId: p.id },
							"aria-label": `Open ${p.name}'s Orbit profile`,
							className: "relative block aspect-[4/5] w-full overflow-hidden",
							children: [p.photo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: p.photo,
								alt: `${p.name}, ${p.headline}`,
								loading: "lazy",
								className: "h-full w-full object-cover"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid h-full w-full place-items-center font-display text-6xl font-bold text-foreground",
								style: { backgroundImage: `linear-gradient(140deg, oklch(0.5 0.18 ${p.hue}), oklch(0.28 0.1 ${p.hue + 40}))` },
								"aria-hidden": true,
								children: p.name.charAt(0)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,oklch(0.12_0.02_290/0.92),transparent)] p-4 pt-16",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
											className: "font-display text-lg font-bold",
											children: [
												p.name,
												", ",
												p.age
											]
										}), p.verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, {
											className: "h-4 w-4 fill-[oklch(0.62_0.17_255)] text-background",
											strokeWidth: 1.8
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: p.headline
									}),
									moodById(p.mood) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "mt-1.5 inline-flex items-center gap-1 rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-medium backdrop-blur",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												"aria-hidden": true,
												className: "grid h-3.5 w-3.5 place-items-center rounded-full bg-primary/20 text-[8px] font-bold text-primary",
												children: moodById(p.mood).label.charAt(0)
											}),
											moodById(p.mood).label,
											myMood && p.mood === myMood && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted-foreground",
												children: "· same as you"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "flex items-center gap-1 pt-1 text-[11px] text-muted-foreground/90",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
												className: "h-3 w-3",
												strokeWidth: 1.8
											}),
											p.area,
											" · ",
											approxDistance(p.distanceKm)
										]
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setMenuFor(menuFor === p.id ? null : p.id),
							"aria-label": `Safety options for ${p.name}`,
							className: "absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-background/60 backdrop-blur transition-transform active:scale-90",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, {
								className: "h-[15px] w-[15px]",
								strokeWidth: 1.7
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm leading-relaxed text-muted-foreground",
									children: p.about
								}),
								orbit.privacy.aiFakeDetection && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrustChip, { profile: p }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex flex-wrap gap-1.5 pt-3",
									children: p.interests.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "chip rounded-full px-3 py-1 text-[11px] font-medium",
										children: t
									}, t))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-4 gap-2 pt-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitAction, {
											icon: Heart,
											label: "Like",
											active: !!orbit.liked[p.id],
											locked: !orbit.hasProfile,
											onClick: gate(() => {
												orbit.toggleLike(p.id);
												toast.success(orbit.liked[p.id] ? "Like removed" : `You liked ${p.name}`);
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitAction, {
											icon: MessageCircle,
											label: "Message",
											locked: !orbit.hasProfile,
											onClick: gate(() => navigate({
												to: "/orbit/chat/$userId",
												params: { userId: p.id }
											}))
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitAction, {
											icon: Handshake,
											label: "Connect",
											active: !!orbit.connected[p.id],
											locked: !orbit.hasProfile,
											onClick: gate(() => {
												orbit.toggleConnect(p.id);
												toast.success(orbit.connected[p.id] ? "Connection withdrawn" : "Connection request sent");
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitAction, {
											icon: Sparkles,
											label: mutual.includes(p.id) ? "Matched" : likedByMe.includes(p.id) ? "Sent" : "Match",
											active: mutual.includes(p.id) || likedByMe.includes(p.id),
											locked: !orbit.hasProfile,
											onClick: gate(() => void onMatch(p.id, p.name))
										})
									]
								}),
								orbit.connected[p.id] && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 rounded-2xl bg-secondary/60 p-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "pb-2 text-[11px] font-medium text-muted-foreground",
										children: "Connected — chat, meetups and live location unlocked"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => setMeetupFor(p),
											className: "flex flex-col items-center gap-1 rounded-2xl bg-background/50 py-2.5 text-[10px] font-medium text-muted-foreground transition-transform active:scale-95",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarHeart, {
												className: "h-[18px] w-[18px]",
												strokeWidth: 1.7
											}), "Plan meetup"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => {
												if (!orbit.privacy.liveLocationEnabled) {
													toast.warning("Turn on live location sharing in Privacy & Safety first.");
													return;
												}
												setLiveFor(p);
											},
											className: "flex flex-col items-center gap-1 rounded-2xl bg-background/50 py-2.5 text-[10px] font-medium text-muted-foreground transition-transform active:scale-95",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, {
												className: "h-[18px] w-[18px]",
												strokeWidth: 1.7
											}), "Live location"]
										})]
									})]
								})
							]
						}),
						menuFor === p.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SafetyMenu, {
							profile: p,
							onClose: () => setMenuFor(null)
						})
					]
				}, p.id)), ranked.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "w-full py-16 text-center text-sm text-muted-foreground",
					children: "No Orbit profiles match your search or filters."
				})]
			}),
			ranked.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-4 pt-3 text-center text-[11px] text-muted-foreground",
				children: "Swipe left or right to browse · tap a photo or name to open the profile"
			}),
			obscured && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "fixed inset-x-0 bottom-6 z-50 px-6 text-center text-xs text-muted-foreground",
				children: "Orbit content hidden while the app is in the background."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitLockedSheet, {
				open: locked,
				onOpenChange: setLocked
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitFiltersSheet, {
				open: filtersOpen,
				onOpenChange: setFiltersOpen,
				filters,
				onChange: setFilters,
				resultCount: ranked.length
			}),
			live.session.active && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-x-4 bottom-4 z-50 flex items-center gap-3 rounded-full border border-border/60 glass px-4 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-[oklch(0.72_0.19_145)]" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "min-w-0 flex-1 truncate text-xs",
						children: ["Live location on ", remainingLabel(live.session.endsAt)]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							live.stop();
							toast.success("Live location stopped");
						},
						className: "shrink-0 rounded-full bg-foreground px-3 py-1.5 text-[11px] font-semibold text-background",
						children: "Stop"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MeetupSheet, {
				open: meetupFor !== null,
				onOpenChange: (o) => !o && setMeetupFor(null),
				onSend: () => {
					toast.success(`Meetup suggestion sent to ${meetupFor?.name}`);
					setMeetupFor(null);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveLocationSheet, {
				open: liveFor !== null,
				onOpenChange: (o) => !o && setLiveFor(null),
				peerName: liveFor?.name ?? "",
				onConfirm: async (duration) => {
					const ok = await live.start(duration);
					toast[ok ? "success" : "error"](ok ? `Sharing live location with ${liveFor?.name}` : "Nothing was shared");
					if (ok) setLiveFor(null);
					return ok;
				}
			})
		]
	});
}
function TrustChip({ profile }) {
	const t = analyzeProfile(profile);
	const tone = t.level === "trusted" ? "text-[oklch(0.75_0.16_150)]" : t.level === "review" ? "text-muted-foreground" : "text-destructive";
	const Icon = t.level === "flagged" ? TriangleAlert : ScanFace;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: `flex items-center gap-1.5 pt-3 text-[11px] font-medium ${tone}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: "h-3.5 w-3.5 shrink-0",
				strokeWidth: 1.8
			}),
			t.label,
			" · ",
			t.score,
			"%"
		]
	});
}
function OrbitAction({ icon: Icon, label, onClick, active, locked }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		"aria-label": locked ? `${label} — locked` : label,
		className: `relative flex flex-col items-center gap-1 rounded-2xl py-2.5 transition-all active:scale-95 ${active ? "bg-foreground text-background" : "chip text-muted-foreground"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: "h-[18px] w-[18px]",
				strokeWidth: 1.7
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[10px] font-medium",
				children: label
			}),
			locked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
				className: "absolute right-2 top-2 h-3 w-3 text-muted-foreground/70",
				strokeWidth: 2
			})
		]
	});
}
function SafetyMenu({ profile, onClose }) {
	const orbit = useOrbit();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": "Close menu",
		onClick: onClose,
		className: "fixed inset-0 z-40 cursor-default"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "absolute right-4 top-14 z-50 w-56 overflow-hidden rounded-2xl border border-border/60 glass",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuRow, {
				icon: EyeOff,
				label: "Hide me from this user",
				onClick: () => {
					orbit.toggleHiddenFrom(profile.id);
					toast.success(`You are now hidden from ${profile.name}`);
					onClose();
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuRow, {
				icon: Ban,
				label: "Block user",
				onClick: () => {
					orbit.toggleBlocked(profile.id);
					toast.success(`${profile.name} blocked`);
					onClose();
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuRow, {
				icon: Flag,
				label: "Report user",
				danger: true,
				onClick: () => {
					toast.success("Report sent to the Orbit safety team");
					onClose();
				}
			})
		]
	})] });
}
function MenuRow({ icon: Icon, label, onClick, danger }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: `flex w-full items-center gap-2.5 border-b border-border/60 px-3.5 py-3 text-left text-sm last:border-0 transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)] ${danger ? "text-destructive" : ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			className: "h-4 w-4 shrink-0",
			strokeWidth: 1.7
		}), label]
	});
}
//#endregion
export { OrbitBrowse as component };
