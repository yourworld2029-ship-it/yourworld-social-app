import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $ as Radio, H as Settings2, a as X, vn as ChevronLeft, xn as CheckCheck } from "../_libs/lucide-react.mjs";
import { at as kindMeta, it as ORBIT_KINDS, mt as cn, ot as timeAgo$1, rt as NOTIFICATION_KINDS, st as useNotifications } from "./router-DbBkWxv5.mjs";
import { t as markAlertsSeen } from "./alerts-count-DzTrAmD5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notifications-DIkRPXKW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function NotificationsPage() {
	(0, import_react.useEffect)(() => {
		markAlertsSeen();
	}, []);
	const { items: allItems, unreadHome: unread, unreadByKind, prefs, live, setLive, setPref, markRead, markAllRead, remove } = useNotifications();
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [tuning, setTuning] = (0, import_react.useState)(false);
	const navigate = useNavigate();
	/** Orbit, Connections and Matches live only inside the Orbit section.
	*  Message alerts are hidden here — they already live in the Chats inbox. */
	const items = (0, import_react.useMemo)(() => allItems.filter((i) => !ORBIT_KINDS.includes(i.kind) && i.kind !== "message"), [allItems]);
	const homeKinds = (0, import_react.useMemo)(() => NOTIFICATION_KINDS.filter((k) => !ORBIT_KINDS.includes(k.id) && k.id !== "message"), []);
	const list = (0, import_react.useMemo)(() => {
		return [...filter === "all" ? items : filter === "unread" ? items.filter((i) => !i.read) : items.filter((i) => i.kind === filter)].sort((a, b) => b.at - a.at);
	}, [items, filter]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen pb-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-40 border-b border-border glass",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 px-3 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							"aria-label": "Back",
							className: "grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
								className: "h-5 w-5",
								strokeWidth: 1.8
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-lg font-bold",
							children: "Notifications"
						}),
						unread > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground",
							children: unread
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ml-auto flex items-center gap-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setLive(!live),
									"aria-pressed": live,
									"aria-label": "Toggle real-time updates",
									className: cn("grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90", live ? "text-primary" : "text-muted-foreground"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, {
										className: cn("h-[18px] w-[18px]", live && "animate-pulse"),
										strokeWidth: 1.8
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: markAllRead,
									"aria-label": "Mark all as read",
									className: "grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-transform active:scale-90",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCheck, {
										className: "h-[18px] w-[18px]",
										strokeWidth: 1.8
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setTuning((t) => !t),
									"aria-label": "Notification preferences",
									"aria-expanded": tuning,
									className: cn("grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90", tuning ? "text-foreground" : "text-muted-foreground"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, {
										className: "h-[18px] w-[18px]",
										strokeWidth: 1.8
									})
								})
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "no-scrollbar flex gap-2 overflow-x-auto px-3 pb-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							active: filter === "all",
							onClick: () => setFilter("all"),
							label: "All"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							active: filter === "unread",
							onClick: () => setFilter("unread"),
							label: "Unread",
							count: unread
						}),
						homeKinds.filter((k) => prefs[k.id]).map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							active: filter === k.id,
							onClick: () => setFilter(k.id),
							label: k.label,
							count: unreadByKind[k.id]
						}, k.id))
					]
				})]
			}),
			tuning && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				"aria-label": "Notification types",
				className: "px-4 pt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "surface-card overflow-hidden rounded-3xl",
					children: homeKinds.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-3 border-b border-border px-4 py-3 last:border-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "chip grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(k.icon, {
									className: "h-4 w-4",
									strokeWidth: 1.8
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "min-w-0 flex-1 truncate text-sm font-medium",
								children: k.label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								role: "switch",
								"aria-checked": prefs[k.id],
								"aria-label": `${k.label} notifications`,
								onClick: () => setPref(k.id, !prefs[k.id]),
								className: cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", prefs[k.id] ? "bg-primary" : "bg-muted"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform", prefs[k.id] ? "translate-x-[22px]" : "translate-x-0.5") })
							})
						]
					}, k.id))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				"aria-label": "Activity",
				className: "px-3 pt-4",
				children: list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "py-16 text-center text-sm text-muted-foreground",
					children: "You're all caught up."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: list.map((n, i) => {
						const meta = kindMeta(n.kind);
						const Icon = meta.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "animate-rise",
							style: { animationDelay: `${Math.min(i, 8) * 26}ms` },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: cn("surface-card flex items-start gap-3 rounded-2xl px-3.5 py-3 transition-colors", !n.read && "bg-[color-mix(in_oklab,var(--primary)_8%,transparent)]"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => {
										markRead(n.id);
										if (n.to) navigate({ to: n.to });
									},
									className: "flex min-w-0 flex-1 items-start gap-3 text-left",
									children: [n.thumbnailUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-muted",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: n.thumbnailUrl,
											alt: "",
											className: "h-full w-full object-cover",
											loading: "lazy"
										}), !n.read && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" })]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "chip relative grid h-10 w-10 shrink-0 place-items-center rounded-full",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
											className: cn("h-[18px] w-[18px]", meta.tint),
											strokeWidth: 1.7
										}), !n.read && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "min-w-0 flex-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-baseline gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: cn("min-w-0 flex-1 text-sm leading-snug", n.read ? "text-foreground/85" : "font-semibold"),
													children: n.title
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "shrink-0 text-[11px] text-muted-foreground",
													children: timeAgo$1(n.at)
												})]
											}),
											n.body && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mt-0.5 block truncate text-xs text-muted-foreground",
												children: n.body
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mt-1 block text-[10px] uppercase tracking-wide text-muted-foreground/70",
												children: meta.label
											})
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => remove(n.id),
									"aria-label": "Dismiss notification",
									className: "grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-transform active:scale-90",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
										className: "h-4 w-4",
										strokeWidth: 1.8
									})
								})]
							})
						}, n.id);
					})
				})
			})
		]
	});
}
function Chip({ active, onClick, label, count }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		"aria-pressed": active,
		className: cn("shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95", active ? "bg-foreground text-background" : "chip text-muted-foreground"),
		children: [label, count ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "ml-1.5 text-[10px] font-semibold",
			children: count
		}) : null]
	});
}
//#endregion
export { NotificationsPage as component };
