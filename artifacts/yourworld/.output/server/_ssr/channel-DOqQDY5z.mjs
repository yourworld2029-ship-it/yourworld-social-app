import { a as useLocation, l as Outlet, m as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { Bt as FileText, Jt as DollarSign, f as Users, l as Video, mn as ChartNoAxesColumn, wn as ArrowLeft, yt as Megaphone, zt as Film } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/channel-DOqQDY5z.js
var import_jsx_runtime = require_jsx_runtime();
function ChannelLayout() {
	const navigate = useNavigate();
	const location = useLocation();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-[#09090b] text-white font-sans pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-0 z-40 bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center justify-between",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => navigate({ to: "/settings" }),
						className: "p-1 text-zinc-300 hover:text-white",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 22 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-bold text-base",
						children: "Channel Studio"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-6" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2 overflow-x-auto p-3 border-b border-zinc-800/80 no-scrollbar bg-[#09090b]",
				children: [
					{
						label: "Create",
						path: "/channel/create",
						icon: Megaphone
					},
					{
						label: "Posts",
						path: "/channel/posts",
						icon: FileText
					},
					{
						label: "Videos",
						path: "/channel/videos",
						icon: Video
					},
					{
						label: "Reels",
						path: "/channel/reels",
						icon: Film
					},
					{
						label: "Subscribers",
						path: "/channel/subscribers",
						icon: Users
					},
					{
						label: "Analytics",
						path: "/channel/analytics",
						icon: ChartNoAxesColumn
					},
					{
						label: "Monetization",
						path: "/channel/monetization",
						icon: DollarSign
					}
				].map((tab) => {
					const Icon = tab.icon;
					const isActive = location.pathname === tab.path;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => navigate({ to: tab.path }),
						className: `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${isActive ? "bg-white text-black" : "bg-zinc-900 text-zinc-400 hover:text-white"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 14 }), tab.label]
					}, tab.path);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
			})
		]
	});
}
//#endregion
export { ChannelLayout as component };
