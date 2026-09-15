import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as useChannelData, i as formatCount, r as StatTile, t as ChannelHeader } from "./channel-data-DWHB5kHf.mjs";
import { t as VideoPoster } from "./VideoPoster-BFapwIdR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/channel.analytics-Byf28rCf.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ChannelAnalytics() {
	const [periodDays, setPeriodDays] = (0, import_react.useState)(30);
	const { stats, videos, reels, loading, watchTimeError } = useChannelData(periodDays);
	const top = [...videos, ...reels].sort((a, b) => b.views - a.views).slice(0, 4);
	const statValue = (value) => loading ? "…" : formatCount(value);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen pb-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChannelHeader, { title: "Analytics" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2 overflow-x-auto px-4 pt-4 no-scrollbar",
				children: [
					7,
					30,
					90
				].map((days) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setPeriodDays(days),
					className: `rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${periodDays === days ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`,
					children: [
						"Last ",
						days,
						" days"
					]
				}, days))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3 px-4 pt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Total views",
						value: statValue(stats.views30d)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Watch hours",
						value: statValue(stats.watchHours),
						hint: watchTimeError ? "Watch time unavailable" : `Last ${periodDays} days`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Subscribers",
						value: statValue(stats.subscribers)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Published",
						value: statValue(stats.posts)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-4 pt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "surface-card overflow-hidden rounded-3xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-4 pt-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
						children: "Top performing"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "pt-1",
						children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "px-4 py-8 text-center text-sm text-muted-foreground",
							children: "Loading content…"
						}) : top.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center gap-3 border-b border-border px-4 py-3 last:border-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoPoster, {
									mediaUrl: t.mediaUrl,
									thumbnailUrl: t.thumb,
									alt: t.title,
									className: "h-11 w-16 rounded-xl"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block truncate text-sm font-medium",
										children: t.title
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-[11px] text-muted-foreground",
										children: t.publishedAt
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "shrink-0 text-xs font-semibold",
									children: formatCount(t.views)
								})
							]
						}, t.id)), !loading && top.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "px-4 py-8 text-center text-sm text-muted-foreground",
							children: "No published content yet."
						})]
					})]
				})
			})
		]
	});
}
//#endregion
export { ChannelAnalytics as component };
