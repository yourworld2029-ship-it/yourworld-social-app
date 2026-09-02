import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { V as cn } from "./router-Bk-zbPoI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/Avatar-DYpIJvfu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function YwAvatarBase({ user, size = 40, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("grid shrink-0 place-items-center rounded-full font-display font-bold text-foreground", className),
		style: {
			width: size,
			height: size,
			fontSize: size * .38,
			backgroundImage: `linear-gradient(140deg, oklch(0.55 0.2 ${user.hue}), oklch(0.32 0.12 ${user.hue + 40}))`
		},
		"aria-hidden": true,
		children: user.name.charAt(0)
	});
}
var YwAvatar = (0, import_react.memo)(YwAvatarBase);
//#endregion
export { YwAvatar as t };
