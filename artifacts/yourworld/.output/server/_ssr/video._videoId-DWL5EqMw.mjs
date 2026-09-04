import { m as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/video._videoId-DWL5EqMw.js
var import_jsx_runtime = require_jsx_runtime();
function VideoErrorFallback() {
	const navigate = useNavigate();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 gap-4 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-lg",
			children: "Video not found or unavailable."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => window.history.length > 1 ? window.history.back() : void navigate({ to: "/" }),
			className: "px-4 py-2 bg-pink-600 rounded-lg text-white font-medium",
			children: "Go Back"
		})]
	});
}
//#endregion
export { VideoErrorFallback as t };
