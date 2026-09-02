import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as useChannelData, i as formatCount, r as StatTile, t as ChannelHeader } from "./channel-data-BdEe--a2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/channel.analytics-BxtWxEss.js
var import_jsx_runtime = require_jsx_runtime();
function ChannelAnalytics() {
	const { stats, videos, reels } = useChannelData();
	const top = [...videos, ...reels].sort((a, b) => b.views - a.views).slice(0, 4);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen pb-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChannelHeader, { title: "Analytics" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3 px-4 pt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Total views",
						value: formatCount(stats.views30d)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Watch hours",
						value: formatCount(stats.watchHours),
						hint: "No live watch-time source yet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Subscribers",
						value: formatCount(stats.subscribers)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Published",
						value: formatCount(stats.posts)
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
						children: [top.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
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
						}, t.id)), top.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
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
