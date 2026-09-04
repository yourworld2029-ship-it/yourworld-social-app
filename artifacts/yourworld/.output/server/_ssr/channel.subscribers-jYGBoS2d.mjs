import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as useChannelData, i as formatCount, t as ChannelHeader } from "./channel-data-Bza1v6DU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/channel.subscribers-jYGBoS2d.js
var import_jsx_runtime = require_jsx_runtime();
function ChannelSubscribers() {
	const { stats, subscribers } = useChannelData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen pb-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChannelHeader, { title: "Subscribers" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-4 pt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card rounded-3xl p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-2xl font-bold",
						children: formatCount(stats.subscribers)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Total subscribers"
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2 px-4 pt-4",
				children: subscribers.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "surface-card animate-rise flex items-center gap-3 rounded-2xl p-3",
					style: { animationDelay: `${i * 35}ms` },
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": true,
							className: "grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-background",
							style: { background: `oklch(0.72 0.15 ${s.hue})` },
							children: s.name.charAt(0)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-sm font-medium",
								children: s.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "block truncate text-xs text-muted-foreground",
								children: ["@", s.handle]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "shrink-0 text-[11px] text-muted-foreground",
							children: s.since
						})
					]
				}, s.id))
			})
		]
	});
}
//#endregion
export { ChannelSubscribers as component };
