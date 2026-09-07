import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/UserWatermark-Cj3id9i0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Subtle repeating diagonal username watermark.
* Purely decorative + deterrent: never intercepts pointer events.
*/
var UserWatermark = import_react.memo(function UserWatermark({ username, className = "" }) {
	const label = username.startsWith("@") ? username : `@${username}`;
	const rows = Array.from({ length: 10 });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"aria-hidden": true,
		className: `pointer-events-none absolute inset-0 z-20 overflow-hidden select-none ${className}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-[-30%] flex -rotate-[24deg] flex-col justify-around",
			children: rows.map((_, r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-around whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.3em] text-foreground/[0.045]",
				children: Array.from({ length: 6 }).map((__, c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }, c))
			}, r))
		})
	});
});
//#endregion
export { UserWatermark as t };
