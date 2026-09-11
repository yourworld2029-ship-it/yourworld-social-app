import { m as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { sn as CircleAlert, wn as ArrowLeft } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-B4be1Qgc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/video._videoId-EYKDngFm.js
var import_jsx_runtime = require_jsx_runtime();
function VideoErrorFallback() {
	const navigate = useNavigate();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col items-center justify-center gap-4 bg-black p-6 text-center text-white",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "h-12 w-12 text-pink-500" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-xl font-bold",
				children: "Video not available"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-xs text-sm text-gray-400",
				children: "This video could not be loaded or was removed."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: () => window.history.length > 1 ? window.history.back() : void navigate({ to: "/" }),
				className: "mt-2 rounded-full bg-pink-600 px-6 py-2 text-white hover:bg-pink-700",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "mr-2 h-4 w-4" }), " Go Back"]
			})
		]
	});
}
//#endregion
export { VideoErrorFallback as t };
