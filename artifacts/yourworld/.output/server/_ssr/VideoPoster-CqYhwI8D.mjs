import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { mt as cn, x as resolveMediaUrl } from "./router-B6YSQPVc.mjs";
import { a as resolveLongVideoUrl } from "./video-data-BmWgcJEu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/VideoPoster-CqYhwI8D.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Shows the custom thumbnail when present, otherwise falls back to the
* first frame of the video itself (`#t=1.0`) so cards never render blank.
*/
function VideoPoster({ thumbnailUrl, mediaUrl, alt, className }) {
	const [frameUrl, setFrameUrl] = (0, import_react.useState)(null);
	const [resolvedThumbnail, setResolvedThumbnail] = (0, import_react.useState)(null);
	const [frameFailed, setFrameFailed] = (0, import_react.useState)(false);
	const [thumbnailFailed, setThumbnailFailed] = (0, import_react.useState)(false);
	const [loadState, setLoadState] = (0, import_react.useState)("loading");
	(0, import_react.useEffect)(() => {
		setThumbnailFailed(false);
		setFrameFailed(false);
		setFrameUrl(null);
		setResolvedThumbnail(null);
		setLoadState("loading");
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
			if (alive && url) setFrameUrl(`${url}${url.includes("#") ? "" : "#t=1.0"}`);
		});
		return () => {
			alive = false;
		};
	}, [
		thumbnailFailed,
		thumbnailUrl,
		mediaUrl
	]);
	const showThumbnail = (resolvedThumbnail || thumbnailUrl) && !thumbnailFailed;
	const showFrame = frameUrl && !frameFailed && !showThumbnail;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("relative h-full w-full overflow-hidden bg-zinc-900", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			"aria-hidden": "true",
			className: cn("absolute inset-0 bg-[linear-gradient(110deg,#18181b_8%,#27272a_18%,#18181b_33%)] bg-[length:200%_100%] transition-opacity duration-300", loadState === "loading" ? "animate-thumbnail-shimmer opacity-100" : "opacity-0")
		}), showThumbnail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: resolvedThumbnail || thumbnailUrl || void 0,
			alt,
			loading: "lazy",
			decoding: "async",
			onLoad: () => setLoadState("loaded"),
			onError: () => {
				setThumbnailFailed(true);
				setLoadState("loading");
			},
			className: cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-300", loadState === "loaded" ? "opacity-100" : "opacity-0")
		}) : showFrame ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
			src: frameUrl,
			muted: true,
			playsInline: true,
			preload: "metadata",
			tabIndex: -1,
			"aria-label": alt,
			onLoadedData: () => setLoadState("loaded"),
			onError: () => {
				setFrameFailed(true);
				setLoadState("error");
			},
			className: cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-300", loadState === "loaded" ? "opacity-100" : "opacity-0")
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950" })]
	});
}
//#endregion
export { VideoPoster as t };
