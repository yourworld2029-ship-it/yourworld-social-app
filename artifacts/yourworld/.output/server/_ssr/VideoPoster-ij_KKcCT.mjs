import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { ot as cn } from "./router-BP4WBONR.mjs";
import { a as resolveLongVideoUrl } from "./video-data-C2RufTYy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/VideoPoster-ij_KKcCT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Shows the custom thumbnail when present, otherwise falls back to the
* first frame of the video itself (`#t=0.5`) so cards never render blank.
*/
function VideoPoster({ thumbnailUrl, mediaUrl, alt, className }) {
	const [frameUrl, setFrameUrl] = (0, import_react.useState)(null);
	const [frameFailed, setFrameFailed] = (0, import_react.useState)(false);
	const [thumbnailFailed, setThumbnailFailed] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setThumbnailFailed(false);
		setFrameFailed(false);
		setFrameUrl(null);
	}, [thumbnailUrl, mediaUrl]);
	(0, import_react.useEffect)(() => {
		if (thumbnailUrl && !thumbnailFailed || !mediaUrl) return;
		let alive = true;
		resolveLongVideoUrl(mediaUrl).then((url) => {
			if (alive && url) setFrameUrl(`${url}${url.includes("#") ? "" : "#t=0.5"}`);
		});
		return () => {
			alive = false;
		};
	}, [
		thumbnailFailed,
		thumbnailUrl,
		mediaUrl
	]);
	if (thumbnailUrl && !thumbnailFailed) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: thumbnailUrl,
		alt,
		loading: "lazy",
		onError: () => setThumbnailFailed(true),
		className: cn("h-full w-full object-cover", className)
	});
	if (frameUrl && !frameFailed) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
		src: frameUrl,
		muted: true,
		playsInline: true,
		preload: "metadata",
		"aria-label": alt,
		onError: () => setFrameFailed(true),
		className: cn("h-full w-full object-cover", className)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("h-full w-full bg-gradient-to-br from-zinc-800 to-zinc-900", className) });
}
//#endregion
export { VideoPoster as t };
