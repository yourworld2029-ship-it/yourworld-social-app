import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as X, vn as ChevronLeft, xn as CheckCheck } from "../_libs/lucide-react.mjs";
import { G as kindMeta, K as timeAgo$1, W as ORBIT_KINDS, et as cn, q as useNotifications } from "./router-uAPs3Pmt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/orbit.notifications-DfkHRaOV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OrbitNotificationsPage() {
	const { items, unreadOrbit, markRead, markAllRead, remove } = useNotifications();
	const navigate = useNavigate();
	const list = (0, import_react.useMemo)(() => items.filter((i) => ORBIT_KINDS.includes(i.kind) && i.kind !== "message").sort((a, b) => b.at - a.at), [items]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen pb-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "sticky top-0 z-40 flex items-center gap-2 border-b border-border glass px-3 py-3",
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
					children: "Orbit Notifications"
				}),
				unreadOrbit > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground",
					children: unreadOrbit
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: markAllRead,
					"aria-label": "Mark all as read",
					className: "ml-auto grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-transform active:scale-90",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCheck, {
						className: "h-[18px] w-[18px]",
						strokeWidth: 1.8
					})
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			"aria-label": "Orbit activity",
			className: "px-3 pt-4",
			children: list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-16 text-center text-sm text-muted-foreground",
				children: "No Orbit activity yet."
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
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
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
		})]
	});
}
//#endregion
export { OrbitNotificationsPage as component };
