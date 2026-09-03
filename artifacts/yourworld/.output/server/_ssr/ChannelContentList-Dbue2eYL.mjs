import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { Bt as Heart, Yt as Eye } from "../_libs/lucide-react.mjs";
import { i as formatCount, t as ChannelHeader } from "./channel-data-BfF42f60.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ChannelContentList-Dbue2eYL.js
var import_jsx_runtime = require_jsx_runtime();
function ChannelContentList({ title, items, emptyLabel }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen pb-12",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChannelHeader, { title }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3 px-4 pt-4",
			children: [items.map((it, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "surface-card animate-rise flex gap-3 overflow-hidden rounded-3xl p-2.5",
				style: { animationDelay: `${i * 40}ms` },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: it.thumb,
					alt: it.title,
					loading: "lazy",
					className: "h-20 w-28 shrink-0 rounded-2xl object-cover"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1 py-0.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "line-clamp-2 text-sm font-semibold leading-snug",
							children: it.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "pt-1 text-[11px] text-muted-foreground",
							children: it.publishedAt
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 pt-2 text-[11px] text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {
									className: "h-3.5 w-3.5",
									strokeWidth: 1.7
								}), formatCount(it.views)]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, {
									className: "h-3.5 w-3.5",
									strokeWidth: 1.7
								}), formatCount(it.likes)]
							})]
						})
					]
				})]
			}, it.id)), items.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-16 text-center text-sm text-muted-foreground",
				children: emptyLabel
			})]
		})]
	});
}
//#endregion
export { ChannelContentList as t };
