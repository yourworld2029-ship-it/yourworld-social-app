import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { Ct as Lock } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/PinDialog-BLZhpZHS.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Best-effort screenshot / screen-recording detection.
* Browsers can't observe OS captures directly, so we watch for the signals we
* do get: PrintScreen and macOS capture shortcuts, plus the brief focus/
* visibility loss that accompanies a system capture UI. Fires `onCapture`
* (throttled) instead of alerting.
*/
function useCaptureDetect(enabled, onCapture) {
	const cb = (0, import_react.useRef)(onCapture);
	cb.current = onCapture;
	(0, import_react.useEffect)(() => {
		if (!enabled || typeof window === "undefined") return;
		let last = 0;
		const fire = (kind) => {
			const now = Date.now();
			if (now - last < 4e3) return;
			last = now;
			cb.current(kind);
		};
		const onKey = (e) => {
			if (e.key === "PrintScreen" || e.metaKey && e.shiftKey && [
				"3",
				"4",
				"5"
			].includes(e.key)) fire(e.key === "5" ? "recording" : "screenshot");
		};
		const onVisibility = () => {
			if (document.visibilityState === "hidden") fire("screenshot");
		};
		const onBlur = () => fire("screenshot");
		window.addEventListener("keydown", onKey);
		window.addEventListener("keyup", onKey);
		window.addEventListener("blur", onBlur);
		document.addEventListener("visibilitychange", onVisibility);
		return () => {
			window.removeEventListener("keydown", onKey);
			window.removeEventListener("keyup", onKey);
			window.removeEventListener("blur", onBlur);
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, [enabled]);
}
/**
* In-app PIN prompt for Secret Chat Lock.
* Replaces window.prompt(), which freezes the whole app inside embedded
* previews/webviews and made the Secret Lock option look broken.
*/
function PinDialog({ open, title, description, confirmLabel = "Confirm", error, onCancel, onSubmit }) {
	const [pin, setPin] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (open) setPin("");
	}, [open]);
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[200] grid place-items-center bg-black/80 px-6 backdrop-blur-sm",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "w-full max-w-xs space-y-4 rounded-2xl bg-zinc-900 p-6 text-center text-white shadow-2xl",
			onSubmit: (e) => {
				e.preventDefault();
				onSubmit(pin);
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
					size: 26,
					className: "mx-auto text-purple-400"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-base font-bold",
					children: title
				}), description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-zinc-400",
					children: description
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: pin,
					onChange: (e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8)),
					inputMode: "numeric",
					type: "password",
					autoFocus: true,
					"aria-label": "Chat PIN",
					className: "h-12 w-full rounded-xl bg-zinc-800 px-4 text-center text-lg outline-none"
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium text-red-400",
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onCancel,
						className: "h-11 flex-1 rounded-xl bg-zinc-800 text-sm font-semibold text-zinc-300",
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						className: "h-11 flex-1 rounded-xl bg-purple-600 text-sm font-bold",
						children: confirmLabel
					})]
				})
			]
		})
	});
}
//#endregion
export { useCaptureDetect as n, PinDialog as t };
