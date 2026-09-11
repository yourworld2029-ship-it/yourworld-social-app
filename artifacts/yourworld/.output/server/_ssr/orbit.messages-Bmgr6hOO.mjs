import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { G as Search, M as Sparkles, N as Sparkle, Pt as Heart, S as Trash2, _t as MessageCircle, fn as Check, i as X, kt as Inbox, un as ChevronLeft } from "../_libs/lucide-react.mjs";
import { mt as cn } from "./router-CdQ9trai.mjs";
import { r as useChatNames } from "./chat-names-Dnk0YJkG.mjs";
import { i as useSecretChats } from "./secret-chats-ByDwMw3Q.mjs";
import { n as deleteOrbitConversations, r as hiddenOrbitPeerIds } from "./chat-delete-BqPUWt2Q.mjs";
import { t as useProfiles } from "./profiles-map-Btj60IGp.mjs";
import { _ as useOrbitProfiles } from "./orbit-live-BqfCVEZi.mjs";
import { c as useOrbit } from "./orbit-store-oAupMLr5.mjs";
import { n as useOrbitMatches, r as useOrbitThreadPreviews } from "./orbit-match-CNDtFxKp.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/orbit.messages-Bmgr6hOO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function timeShort(at) {
	const diff = Date.now() - at;
	const m = Math.floor(diff / 6e4);
	if (m < 1) return "now";
	if (m < 60) return `${m}m`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h`;
	return `${Math.floor(h / 24)}d`;
}
function Avatar({ p, size = 48 }) {
	const avatarUrl = p.photo?.trim();
	const initial = p.name.trim().charAt(0).toUpperCase() || "?";
	return avatarUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: avatarUrl,
		alt: p.name,
		loading: "lazy",
		style: {
			width: size,
			height: size
		},
		className: "h-full w-full shrink-0 rounded-full object-cover"
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		style: {
			width: size,
			height: size,
			backgroundImage: `linear-gradient(140deg, oklch(0.55 0.17 ${p.hue}), oklch(0.3 0.1 ${p.hue + 40}))`
		},
		"aria-hidden": true,
		className: "grid shrink-0 place-items-center rounded-full font-display text-base font-bold text-background",
		children: initial
	});
}
function OrbitMessagesPage() {
	const orbit = useOrbit();
	const { profiles: orbitProfiles } = useOrbitProfiles();
	const { mutual, likesMe, likedByMe } = useOrbitMatches();
	const previews = useOrbitThreadPreviews();
	const [tab, setTab] = (0, import_react.useState)("chats");
	const [q, setQ] = (0, import_react.useState)("");
	const [selecting, setSelecting] = (0, import_react.useState)(false);
	const [selected, setSelected] = (0, import_react.useState)([]);
	const [hidden, setHidden] = (0, import_react.useState)(() => hiddenOrbitPeerIds());
	const pressTimer = (0, import_react.useRef)(null);
	const longPressed = (0, import_react.useRef)(false);
	const toggleSelect = (id) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
	const exitSelect = () => {
		setSelecting(false);
		setSelected([]);
	};
	const startPress = (id) => {
		longPressed.current = false;
		pressTimer.current = window.setTimeout(() => {
			longPressed.current = true;
			setSelecting(true);
			setSelected([id]);
		}, 400);
	};
	const cancelPress = () => {
		if (pressTimer.current) window.clearTimeout(pressTimer.current);
		pressTimer.current = null;
	};
	const visible = (0, import_react.useMemo)(() => orbitProfiles.filter((p) => !orbit.privacy.blocked.includes(p.id) && !orbit.privacy.hiddenFrom.includes(p.id)), [
		orbitProfiles,
		orbit.privacy.blocked,
		orbit.privacy.hiddenFrom
	]);
	const byId = (0, import_react.useMemo)(() => new Map(visible.map((p) => [p.id, p])), [visible]);
	const chatIds = (0, import_react.useMemo)(() => [.../* @__PURE__ */ new Set([
		...Object.keys(orbit.connected).filter((id) => orbit.connected[id]),
		...Object.keys(previews),
		...Object.entries(orbit.requests).filter(([, r]) => r.status === "accepted").map(([id]) => id)
	])], [
		orbit.connected,
		orbit.requests,
		previews
	]);
	const requestIds = (0, import_react.useMemo)(() => Object.entries(orbit.requests).filter(([, r]) => r.status === "pending").map(([id]) => id), [orbit.requests]);
	const matchIds = (0, import_react.useMemo)(() => [.../* @__PURE__ */ new Set([
		...mutual,
		...likesMe,
		...likedByMe
	])].filter((id) => !orbit.privacy.blocked.includes(id) && !orbit.privacy.hiddenFrom.includes(id)), [
		mutual,
		likesMe,
		likedByMe,
		orbit.privacy.blocked,
		orbit.privacy.hiddenFrom
	]);
	const missingIds = (0, import_react.useMemo)(() => [.../* @__PURE__ */ new Set([
		...chatIds,
		...requestIds,
		...matchIds
	])].filter((id) => !byId.has(id)), [
		chatIds,
		requestIds,
		matchIds,
		byId
	]);
	const { get: getProfile } = useProfiles(missingIds);
	const resolve = (0, import_react.useCallback)((id) => {
		const known = byId.get(id);
		if (known) return known;
		const u = getProfile(id);
		return {
			id,
			name: u.name,
			handle: u.username,
			age: 0,
			area: "",
			country: "",
			state: "",
			city: "",
			gender: "Women",
			lookingFor: "Everyone",
			hobbies: [],
			distanceKm: 0,
			headline: "",
			about: "",
			interests: [],
			photo: u.avatarUrl ?? "",
			hue: u.hue
		};
	}, [byId, getProfile]);
	const chats = (0, import_react.useMemo)(() => {
		return chatIds.filter((id) => !hidden.includes(id)).map(resolve).sort((a, b) => (previews[b.id]?.at ?? 0) - (previews[a.id]?.at ?? 0));
	}, [
		chatIds,
		resolve,
		previews,
		hidden
	]);
	const requests = (0, import_react.useMemo)(() => requestIds.map((id) => ({
		p: resolve(id),
		r: orbit.requests[id]
	})), [
		requestIds,
		orbit.requests,
		resolve
	]);
	const matches = (0, import_react.useMemo)(() => {
		const set = new Set(mutual);
		const likeSet = new Set(likesMe);
		return matchIds.map((id) => ({
			p: resolve(id),
			mutual: set.has(id),
			theyLiked: likeSet.has(id)
		})).sort((a, b) => Number(b.mutual) - Number(a.mutual) || Number(b.theyLiked) - Number(a.theyLiked));
	}, [
		matchIds,
		mutual,
		likesMe,
		resolve
	]);
	const { nameFor } = useChatNames();
	const { isHidden } = useSecretChats(q);
	const pinQuery = /^\d{4,8}$/.test(q.trim());
	const term = q.trim().toLowerCase();
	const respondToRequest = async (id, action) => {
		if (action === "accepted" ? await orbit.acceptRequest(id) : await orbit.declineRequest(id)) toast.success(action === "accepted" ? "Request accepted!" : "Request declined.");
		else toast.error(action === "accepted" ? "This request could not be accepted. Please try again." : "This request could not be declined. Please try again.");
	};
	const openChats = chats.filter((p) => !isHidden(p.id));
	const chatList = pinQuery ? openChats : term ? openChats.filter((p) => p.name.toLowerCase().includes(term)) : openChats;
	const matchList = term ? matches.filter((m) => m.p.name.toLowerCase().includes(term)) : matches;
	const reqList = term ? requests.filter((r) => r.p.name.toLowerCase().includes(term)) : requests;
	const counts = {
		chats: chats.length,
		requests: requests.length,
		matches: mutual.length
	};
	const allSelected = chatList.length > 0 && selected.length === chatList.length;
	const removeSelected = async () => {
		const ids = [...selected];
		if (!ids.length) return;
		setHidden((prev) => [...prev, ...ids]);
		exitSelect();
		await deleteOrbitConversations(ids);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen pb-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-40 border-b border-border glass px-3 pb-2.5 pt-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/orbit",
								"aria-label": "Back to Orbit",
								className: "grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
									className: "h-5 w-5",
									strokeWidth: 1.8
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-lg font-bold",
								children: "Orbit"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/orbit",
								className: "ml-auto flex items-center gap-1.5 rounded-full chip px-3 py-1.5 text-[11px] font-semibold transition-transform active:scale-95",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
									className: "h-3.5 w-3.5",
									strokeWidth: 1.8
								}), "Discover"]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2.5 flex items-center gap-2 rounded-full bg-secondary px-3 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
							className: "h-4 w-4 shrink-0 text-muted-foreground",
							strokeWidth: 1.8
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: q,
							onChange: (e) => setQ(e.target.value),
							placeholder: "Search Orbit people",
							"aria-label": "Search Orbit people",
							className: "min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2.5 grid grid-cols-3 gap-1 rounded-full bg-secondary p-1",
						children: [
							"chats",
							"requests",
							"matches"
						].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setTab(t),
							"aria-pressed": tab === t,
							className: cn("relative rounded-full py-1.5 text-[12px] font-semibold capitalize transition-colors", tab === t ? "bg-background shadow-sm" : "text-muted-foreground"),
							children: [t, counts[t] > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold leading-none text-primary-foreground",
								children: counts[t]
							})]
						}, t))
					})
				]
			}),
			tab === "chats" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				"aria-label": "Orbit chats",
				className: "px-3 pt-3",
				children: [chatList.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-2 flex items-center gap-2",
					children: selecting ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: exitSelect,
							"aria-label": "Cancel selection",
							className: "grid h-8 w-8 place-items-center rounded-full chip",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
								className: "h-4 w-4",
								strokeWidth: 1.8
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs font-semibold",
							children: [selected.length, " selected"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setSelected(allSelected ? [] : chatList.map((p) => p.id)),
							className: "ml-auto rounded-full chip px-3 py-1.5 text-[11px] font-semibold",
							children: allSelected ? "Clear all" : "Select all"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => void removeSelected(),
							disabled: !selected.length,
							"aria-label": "Delete selected chats",
							className: "grid h-8 w-8 place-items-center rounded-full bg-destructive text-destructive-foreground disabled:opacity-40",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
								className: "h-4 w-4",
								strokeWidth: 1.8
							})
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setSelecting(true),
						className: "ml-auto rounded-full chip px-3 py-1.5 text-[11px] font-semibold",
						children: "Select"
					})
				}), chatList.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: MessageCircle,
					title: "No conversations yet",
					body: "Connect or match with someone in Orbit to start chatting."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: chatList.map((p) => {
					const prev = previews[p.id];
					const isSel = selected.includes(p.id);
					const inner = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						selecting && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("grid h-5 w-5 shrink-0 place-items-center rounded-full border", isSel ? "border-primary bg-primary text-primary-foreground" : "border-border"),
							children: isSel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
								className: "h-3 w-3",
								strokeWidth: 2.4
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, { p }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-baseline gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "min-w-0 flex-1 truncate text-sm font-semibold",
									children: nameFor(p.id, p.name)
								}), prev && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "shrink-0 text-[11px] text-muted-foreground",
									children: timeShort(prev.at)
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-xs text-muted-foreground",
								children: prev ? `${prev.mine ? "You: " : ""}${prev.text}` : "Connected on Orbit · say hello"
							})]
						}),
						mutual.includes(p.id) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
							className: "h-4 w-4 shrink-0 text-primary",
							strokeWidth: 1.8
						})
					] });
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: selecting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => toggleSelect(p.id),
						"aria-pressed": isSel,
						className: cn("flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors", isSel && "bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]"),
						children: inner
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/orbit/chat/$userId",
						params: { userId: p.id },
						onPointerDown: () => startPress(p.id),
						onPointerUp: cancelPress,
						onPointerLeave: cancelPress,
						onContextMenu: (e) => {
							e.preventDefault();
							setSelecting(true);
							setSelected([p.id]);
						},
						onClick: (e) => {
							if (longPressed.current) {
								e.preventDefault();
								longPressed.current = false;
							}
						},
						className: "flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]",
						children: inner
					}) }, p.id);
				}) })]
			}),
			tab === "requests" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				"aria-label": "Orbit requests",
				className: "px-3 pt-3",
				children: reqList.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: Inbox,
					title: "No pending requests",
					body: "Chat requests you send or receive show up here until they're answered."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: reqList.map(({ p, r }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "surface-card rounded-2xl px-3 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/orbit/$profileId",
							params: { profileId: p.id },
							"aria-label": `View ${nameFor(p.id, p.name)}'s Orbit profile`,
							className: "flex items-center gap-3 rounded-xl transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
								p,
								size: 44
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-sm font-semibold",
									children: nameFor(p.id, p.name)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "truncate text-xs text-muted-foreground",
									children: [r.direction === "incoming" ? "Wants to chat" : "Request sent", r.intro ? ` · ${r.intro}` : ""]
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2.5 flex gap-2",
							children: r.direction === "incoming" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => void respondToRequest(p.id, "accepted"),
								className: "flex-1 rounded-full bg-primary py-2 text-xs font-semibold text-primary-foreground transition-transform active:scale-95",
								children: "Accept"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => void respondToRequest(p.id, "declined"),
								className: "flex-1 rounded-full border border-border py-2 text-xs font-semibold transition-transform active:scale-95",
								children: "Decline"
							})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/orbit/chat/$userId",
								params: { userId: p.id },
								className: "flex-1 rounded-full border border-border py-2 text-center text-xs font-semibold transition-transform active:scale-95",
								children: "Open request"
							})
						})]
					}, p.id))
				})
			}),
			tab === "matches" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				"aria-label": "Orbit matches",
				className: "px-3 pt-3",
				children: matchList.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: Heart,
					title: "No matches yet",
					body: "Tap Match on a profile in Orbit — when they match you back you'll both unlock chat."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: matchList.map(({ p, mutual: isMutual, theyLiked }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "surface-card flex items-center gap-3 rounded-2xl px-3 py-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/u/$userId",
							params: { userId: p.id },
							className: "flex min-w-0 flex-1 items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
								p,
								size: 44
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "block truncate text-sm font-semibold",
									children: [
										nameFor(p.id, p.name),
										", ",
										p.age
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-xs text-muted-foreground",
									children: isMutual ? "It's a match — chat unlocked" : theyLiked ? "Matched you — match back to chat" : "Waiting for them to match back"
								})]
							})]
						}), isMutual ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/orbit/chat/$userId",
							params: { userId: p.id },
							className: "shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-semibold text-primary-foreground transition-transform active:scale-95",
							children: "Chat"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold", theyLiked ? "bg-foreground text-background" : "chip text-muted-foreground"),
							children: theyLiked ? "Match back" : "Pending"
						})]
					}, p.id))
				})
			})
		]
	});
}
function EmptyState({ icon: Icon, title, body }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-5 pt-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mx-auto grid h-28 w-28 place-items-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-0 animate-[spin_18s_linear_infinite] rounded-full border border-border" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-4 animate-[spin_12s_linear_infinite_reverse] rounded-full border border-dashed border-border" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-0 animate-[pulse_3s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_65%)]" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid h-13 w-13 place-items-center rounded-2xl bg-secondary p-3.5 shadow-lg",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
							className: "h-6 w-6",
							strokeWidth: 1.6
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkle, {
						className: "absolute right-1 top-2 h-4 w-4 animate-[pulse_2.4s_ease-in-out_infinite] text-muted-foreground",
						strokeWidth: 1.6
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pt-6 text-center font-display text-base font-bold",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mx-auto max-w-xs pt-1 text-center text-xs leading-relaxed text-muted-foreground",
				children: body
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center pt-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/orbit",
					className: "flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-transform active:scale-95",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
						className: "h-4 w-4",
						strokeWidth: 1.8
					}), "Discover people"]
				})
			})
		]
	});
}
//#endregion
export { OrbitMessagesPage as component };
