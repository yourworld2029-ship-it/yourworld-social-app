import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ProfileAvatar-D70Oc6MY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ProfileAvatar({ user }) {
	const imgUrl = [
		user?.avatar_url,
		user?.profile_pic,
		user?.profile_image
	].map((value) => value?.trim()).find(Boolean) ?? "";
	const initial = (user?.full_name || user?.username || "U").trim().charAt(0).toUpperCase() || "U";
	const [imageFailed, setImageFailed] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setImageFailed(false);
	}, [imgUrl]);
	if (!imgUrl || imageFailed) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "text-white font-semibold text-base flex h-full w-full items-center justify-center",
		children: initial
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: imgUrl,
		alt: "",
		className: "w-full h-full object-cover rounded-full",
		onError: (event) => {
			event.currentTarget.style.display = "none";
			setImageFailed(true);
		}
	});
}
//#endregion
export { ProfileAvatar as t };
