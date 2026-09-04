import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { An as Ban, Bt as Heart, Ht as Handshake, Kt as Flag, O as Square, Ot as Lock, Tn as Camera, Tt as MapPin, at as Phone, dt as Navigation, j as Sparkles, jn as BadgeCheck, u as Video, vn as ChevronLeft, xt as MessageCircle } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { l as useCall, o as Route$12 } from "./router-CBRKXEw0.mjs";
import { r as useChatNames } from "./chat-names-Dnk0YJkG.mjs";
import { a as approxDistance, d as useOrbit, f as useOrbitProfile } from "./orbit-store-CboCDVmk.mjs";
import { n as useOrbitMatches, t as sendOrbitMatch } from "./orbit-match-CNDtFxKp.mjs";
import { t as moodById } from "./orbit-mood--S38GIFY.mjs";
import { n as remainingLabel, r as useLiveLocation, t as LiveLocationSheet } from "./LiveLocationSheet-D1W3UYLt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/orbit._profileId-CWeTLan3.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Calls, live location and safety actions for one Orbit person.
* Invites now live in the Orbit chat input bar.
* Every action stays locked until there is a match/connection, and calling can
* be switched off entirely from Orbit privacy settings.
*/
function OrbitCallActions({ profile }) {
	const orbit = useOrbit();
	const live = useLiveLocation();
	const connected = !!orbit.connected[profile.id];
	const blocked = orbit.privacy.blocked.includes(profile.id);
	const callsOn = orbit.privacy.callsEnabled;
	const callAudienceAllows = orbit.privacy.whoCanCall !== "nobody" && (orbit.privacy.whoCanCall !== "connections" || connected);
	const call = useCall();
	const [locationOpen, setLocationOpen] = (0, import_react.useState)(false);
	const gate = (action) => () => {
		if (blocked) {
			toast.error(`${profile.name} is blocked. Unblock to continue.`);
			return;
		}
		if (!connected) {
			toast.warning("Available after you match or connect", { description: "Calls unlock once you're connected on Orbit." });
			return;
		}
		action();
	};
	const startCall = (mode) => gate(() => {
		if (!callsOn) {
			toast.warning("Calls are turned off in your Orbit privacy settings.");
			return;
		}
		if (!callAudienceAllows) {
			toast.warning(orbit.privacy.whoCanCall === "nobody" ? "Your Orbit call privacy is set to nobody." : "Calls are available to Orbit connections only.");
			return;
		}
		call.startCall({
			peerId: profile.id,
			peerName: profile.name,
			mode: mode === "video" ? "video" : "audio"
		});
	})();
	const shareLocation = gate(() => {
		if (!orbit.privacy.liveLocationEnabled) {
			toast.warning("Turn on live location sharing in Orbit privacy first.");
			return;
		}
		setLocationOpen(true);
	});
	const report = () => toast.success(`Report submitted for ${profile.name}`, { description: "Our safety team reviews every report." });
	const toggleBlock = () => {
		orbit.toggleBlocked(profile.id);
		toast.success(blocked ? `${profile.name} unblocked` : `${profile.name} blocked`);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "pt-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
					children: "Calls & safety"
				}), !connected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-1 text-[11px] text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
						className: "h-3 w-3",
						strokeWidth: 2
					}), " After match"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-2 pt-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						icon: Phone,
						label: "Voice",
						locked: !connected || !callsOn || !callAudienceAllows,
						onClick: () => startCall("voice")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						icon: Video,
						label: "Video",
						locked: !connected || !callsOn || !callAudienceAllows,
						onClick: () => startCall("video")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						icon: Navigation,
						label: "Live location",
						locked: !connected,
						active: live.session.active,
						onClick: shareLocation
					})
				]
			}),
			live.session.active && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/50 px-3.5 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted-foreground",
					children: [
						"Sharing live location with ",
						profile.name,
						" ",
						remainingLabel(live.session.endsAt)
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => {
						live.stop();
						toast.success("Live location stopped");
					},
					className: "flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-[11px] font-semibold text-background",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, {
						className: "h-3 w-3",
						strokeWidth: 2.4
					}), " Stop"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 flex items-start gap-2 rounded-2xl bg-secondary/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {
					className: "mt-0.5 h-3.5 w-3.5 shrink-0",
					strokeWidth: 1.8
				}), orbit.privacy.screenshotAlerts ? "Screenshot alerts are on — if a screenshot or recording is detected, you'll both be notified." : "Screenshot alerts are off. Turn them on in Orbit privacy to be notified of screen captures."]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2 pt-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: toggleBlock,
					className: "flex items-center justify-center gap-2 rounded-full border border-border/60 py-3 text-xs font-semibold transition-colors hover:bg-secondary",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, {
							className: "h-4 w-4",
							strokeWidth: 1.8
						}),
						" ",
						blocked ? "Unblock" : "Block"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: report,
					className: "flex items-center justify-center gap-2 rounded-full border border-border/60 py-3 text-xs font-semibold transition-colors hover:bg-secondary",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, {
						className: "h-4 w-4",
						strokeWidth: 1.8
					}), " Report"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveLocationSheet, {
				open: locationOpen,
				onOpenChange: setLocationOpen,
				peerName: profile.name,
				onConfirm: async (d) => {
					const ok = await live.start(d);
					if (ok) toast.success(`Sharing live location with ${profile.name}`);
					else toast.error(live.session.error ?? "Nothing was shared.");
					return ok;
				}
			})
		]
	});
}
function Tile({ icon: Icon, label, onClick, locked, active }) {
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
				className: "absolute right-1.5 top-1.5 h-3 w-3 text-muted-foreground/70",
				strokeWidth: 2
			})
		]
	});
}
function OrbitProfilePage() {
	const { profileId } = Route$12.useParams();
	const navigate = useNavigate();
	const orbit = useOrbit();
	const { nameFor } = useChatNames();
	const { profile: p } = useOrbitProfile(profileId);
	const { mutual, likedByMe, likesMe, refresh: refreshMatches } = useOrbitMatches();
	const iMatched = likedByMe.includes(profileId);
	const isMatch = mutual.includes(profileId);
	const theyMatched = likesMe.includes(profileId);
	const onMatch = async (name) => {
		const next = !iMatched;
		const res = await sendOrbitMatch(profileId, next);
		refreshMatches();
		if (!res.ok) {
			toast.error("Couldn't send that match — try again.");
			return;
		}
		if (!next) toast.success("Match withdrawn");
		else if (res.mutual) toast.success(`It's a match with ${name}! Chat unlocked.`);
		else toast.success(`Match sent to ${name}`);
	};
	if (!p) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-screen place-items-center px-6 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground",
			children: "This Orbit profile is not available."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/orbit",
			className: "mt-4 inline-block rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background",
			children: "Back to Orbit"
		})] })
	});
	const mood = moodById(p.mood);
	const gate = (action) => () => {
		if (!orbit.hasProfile) {
			toast.warning("Create an Orbit Profile to use this.");
			return;
		}
		action();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen pb-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-40 flex items-center gap-2 border-b border-border glass px-3 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => navigate({ to: "/orbit" }),
					"aria-label": "Back to Orbit feed",
					className: "grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
						className: "h-5 w-5",
						strokeWidth: 1.8
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-lg font-bold",
					children: nameFor(p.id, p.name)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative aspect-[4/5] w-full overflow-hidden",
				children: [p.photo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: p.photo,
					alt: `${p.name}, ${p.headline}`,
					className: "h-full w-full object-cover"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid h-full w-full place-items-center font-display text-7xl font-bold text-foreground",
					style: { backgroundImage: `linear-gradient(140deg, oklch(0.5 0.18 ${p.hue}), oklch(0.28 0.1 ${p.hue + 40}))` },
					"aria-hidden": true,
					children: p.name.charAt(0)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,oklch(0.12_0.02_290/0.92),transparent)] p-5 pt-20",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "font-display text-2xl font-bold",
								children: [
									nameFor(p.id, p.name),
									", ",
									p.age
								]
							}), p.verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, {
								className: "h-5 w-5 fill-[oklch(0.62_0.17_255)] text-background",
								strokeWidth: 1.8
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: p.headline
						}),
						mood && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mt-2 inline-flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-1 text-[11px] font-medium backdrop-blur",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								"aria-hidden": true,
								className: "grid h-4 w-4 place-items-center rounded-full bg-primary/20 text-[9px] font-bold text-primary",
								children: mood.label.charAt(0)
							}), mood.label]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "flex items-center gap-1 pt-1.5 text-xs text-muted-foreground/90",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
									className: "h-3.5 w-3.5",
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "px-5 pt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-relaxed text-muted-foreground",
						children: p.about
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1.5 pt-4",
						children: p.interests.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "chip rounded-full px-3 py-1 text-[11px] font-medium",
							children: t
						}, t))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-4 gap-2 pt-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
								icon: Heart,
								label: "Like",
								active: !!orbit.liked[p.id],
								locked: !orbit.hasProfile,
								onClick: gate(() => {
									orbit.toggleLike(p.id);
									toast.success(orbit.liked[p.id] ? "Like removed" : `You liked ${p.name}`);
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
								icon: MessageCircle,
								label: "Message",
								locked: !orbit.hasProfile,
								onClick: gate(() => navigate({
									to: "/orbit/chat/$userId",
									params: { userId: p.id }
								}))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
								icon: Handshake,
								label: "Connect",
								active: !!orbit.connected[p.id],
								locked: !orbit.hasProfile,
								onClick: gate(() => {
									orbit.toggleConnect(p.id);
									toast.success(orbit.connected[p.id] ? "Connection withdrawn" : "Connection request sent");
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
								icon: Sparkles,
								label: isMatch ? "Matched" : iMatched ? "Sent" : "Match",
								active: iMatched || isMatch,
								locked: !orbit.hasProfile,
								onClick: gate(() => void onMatch(p.name))
							})
						]
					}),
					(isMatch || theyMatched) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex items-center gap-3 rounded-2xl bg-secondary/60 px-3.5 py-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
								className: "h-4 w-4 shrink-0 text-primary",
								strokeWidth: 1.8
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "min-w-0 flex-1 text-xs text-muted-foreground",
								children: isMatch ? `You and ${p.name} matched — chat is unlocked.` : `${p.name} matched you. Match back to unlock chat.`
							}),
							isMatch ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/orbit/chat/$userId",
								params: { userId: p.id },
								className: "shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-semibold text-primary-foreground transition-transform active:scale-95",
								children: "Chat"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: gate(() => void onMatch(p.name)),
								className: "shrink-0 rounded-full bg-foreground px-3.5 py-1.5 text-[11px] font-semibold text-background transition-transform active:scale-95",
								children: "Match back"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitCallActions, { profile: p }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "pt-5 text-[11px] leading-relaxed text-muted-foreground",
						children: "Only approximate areas are ever shown — never an exact location."
					})
				]
			})
		]
	});
}
function Action({ icon: Icon, label, onClick, active, locked }) {
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
//#endregion
export { OrbitProfilePage as component };
