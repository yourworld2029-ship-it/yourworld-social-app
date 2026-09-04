import { m as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { Fn as ArrowLeft, It as Image, Tn as Camera } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/channel.index-FuPPrQ2y.js
var import_jsx_runtime = require_jsx_runtime();
function ChannelIndexPage() {
	const navigate = useNavigate();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-[#09090b] text-white p-4 font-sans select-none pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => navigate({ to: "/settings" }),
					className: "p-1 text-zinc-300 hover:text-white",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 22 })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-bold",
					children: "Create Channel"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-[#141418] border border-zinc-800 rounded-2xl p-4 space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full h-32 bg-zinc-900 border border-dashed border-zinc-700 rounded-xl flex items-center justify-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-xs text-zinc-400 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { size: 16 }), " Channel banner"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "absolute top-2 right-2 bg-zinc-800 px-3 py-1 rounded-lg text-xs font-semibold",
						children: "Banner"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 20 })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-zinc-400 max-w-[200px]",
						children: "Add a square logo and a wide banner."
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4 mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-xs text-zinc-400 font-semibold block mb-1",
					children: "CHANNEL NAME"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "text",
					placeholder: "Your channel name",
					className: "w-full bg-[#141418] border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-pink-500"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-xs text-zinc-400 font-semibold block mb-1",
					children: "@ USERNAME"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "text",
					placeholder: "@channel.handle",
					className: "w-full bg-[#141418] border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-pink-500"
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "w-full mt-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-bold text-sm",
				children: "Create Channel"
			})
		]
	});
}
//#endregion
export { ChannelIndexPage as component };
