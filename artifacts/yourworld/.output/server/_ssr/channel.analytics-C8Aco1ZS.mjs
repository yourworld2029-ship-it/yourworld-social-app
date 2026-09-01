import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { S as TrendingUp } from "../_libs/lucide-react.mjs";
import { a as channelReels, c as channelVideos, l as formatCount, o as channelStats, r as StatTile, t as ChannelHeader, u as viewsSeries } from "./channel-data-BD2RqW0C.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/channel.analytics-C8Aco1ZS.js
var import_jsx_runtime = require_jsx_runtime();
var top = [...channelVideos, ...channelReels].sort((a, b) => b.views - a.views).slice(0, 4);
function ChannelAnalytics() {
	const max = Math.max(...viewsSeries);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen pb-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChannelHeader, { title: "Analytics" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3 px-4 pt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Views · 30d",
						value: formatCount(channelStats.views30d),
						hint: "+18% vs last month"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Watch hours",
						value: formatCount(channelStats.watchHours),
						hint: "Last 365 days"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Subscribers",
						value: formatCount(channelStats.subscribers),
						hint: "+284 this week"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Avg. view rate",
						value: "61%",
						hint: "Across all formats"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-4 pt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "surface-card rounded-3xl p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, {
								className: "h-4 w-4 text-muted-foreground",
								strokeWidth: 1.8
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold",
								children: "Daily views · last 14 days"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-28 items-end gap-1.5 pt-4",
							role: "img",
							"aria-label": "Daily views trend for the last 14 days",
							children: viewsSeries.map((v, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex-1 rounded-t-md bg-foreground/80",
								style: { height: `${v / max * 100}%` }
							}, i))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "pt-2 text-[11px] text-muted-foreground",
							children: [
								"Peak day ",
								formatCount(max * 1e3),
								" views · trending upward"
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-4 pt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "surface-card overflow-hidden rounded-3xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-4 pt-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
						children: "Top performing"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "pt-1",
						children: top.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center gap-3 border-b border-border px-4 py-3 last:border-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: t.thumb,
									alt: "",
									loading: "lazy",
									className: "h-11 w-16 rounded-xl object-cover"
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
						}, t.id))
					})]
				})
			})
		]
	});
}
//#endregion
export { ChannelAnalytics as component };
