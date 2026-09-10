import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { C as resolveMediaUrl, mt as cn } from "./router-DO0psBY1.mjs";
import { a as resolveLongVideoUrl } from "./video-data-DEi_TAri.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/VideoPoster-CZ1CpE7-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Shows the custom thumbnail when present, otherwise falls back to the
* first frame of the video itself (`#t=0.5`) so cards never render blank.
*/
function VideoPoster({ thumbnailUrl, mediaUrl, alt, className }) {
	const [frameUrl, setFrameUrl] = (0, import_react.useState)(null);
	const [resolvedThumbnail, setResolvedThumbnail] = (0, import_react.useState)(null);
	const [frameFailed, setFrameFailed] = (0, import_react.useState)(false);
	const [thumbnailFailed, setThumbnailFailed] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setThumbnailFailed(false);
		setFrameFailed(false);
		setFrameUrl(null);
		setResolvedThumbnail(null);
	}, [thumbnailUrl, mediaUrl]);
	(0, import_react.useEffect)(() => {
		if (!thumbnailUrl) return;
		let alive = true;
		resolveMediaUrl(thumbnailUrl, "videos").then((url) => {
			if (alive) setResolvedThumbnail(url || thumbnailUrl);
		});
		return () => {
			alive = false;
		};
	}, [thumbnailUrl]);
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
	if ((resolvedThumbnail || thumbnailUrl) && !thumbnailFailed) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: resolvedThumbnail || thumbnailUrl || void 0,
		alt,
		loading: "lazy",
		onError: () => setThumbnailFailed(true),
		className: cn("pointer-events-none h-full w-full object-cover", className)
	});
	if (frameUrl && !frameFailed) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
		src: frameUrl,
		muted: true,
		playsInline: true,
		preload: "metadata",
		tabIndex: -1,
		"aria-label": alt,
		onError: () => setFrameFailed(true),
		className: cn("pointer-events-none h-full w-full object-cover", className)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("h-full w-full bg-gradient-to-br from-zinc-800 to-zinc-900", className) });
}
//#endregion
export { VideoPoster as t };
