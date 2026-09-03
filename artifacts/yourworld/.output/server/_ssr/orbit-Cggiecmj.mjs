import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { l as Outlet, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { kt as Lock, yn as ChevronLeft } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-nQzdb24v.mjs";
import { t as Input } from "./input-BZfqTwhW.mjs";
import { d as useOrbit, i as OrbitProvider, l as isUnlockedForSession } from "./orbit-store-Cse433qo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/orbit-Cggiecmj.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Blocks the whole Orbit tree behind the device PIN/password when the lock is on. */
function OrbitLockGate({ children }) {
	const orbit = useOrbit();
	const [unlocked, setUnlocked] = (0, import_react.useState)(false);
	const [value, setValue] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setUnlocked(isUnlockedForSession());
	}, []);
	if (!orbit.hydrated) return null;
	if (!orbit.privacy.lockEnabled || unlocked) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
	const submit = async (e) => {
		e.preventDefault();
		setBusy(true);
		const ok = await orbit.verifyOrbitPin(value);
		setBusy(false);
		if (ok) setUnlocked(true);
		else {
			setError(true);
			setValue("");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "flex items-center gap-2 px-3 py-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/settings",
				"aria-label": "Back to settings",
				className: "grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
					className: "h-5 w-5",
					strokeWidth: 1.8
				})
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-sm flex-col items-center px-6 pt-16 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid h-14 w-14 place-items-center rounded-3xl bg-secondary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
						className: "h-6 w-6",
						strokeWidth: 1.7
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "pt-5 font-display text-xl font-bold",
					children: "Orbit is locked"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "pt-1.5 text-sm leading-relaxed text-muted-foreground",
					children: "Enter your Orbit PIN or password to continue. It never leaves this device."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: submit,
					className: "w-full pt-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "password",
							inputMode: "numeric",
							autoFocus: true,
							autoComplete: "current-password",
							value,
							maxLength: 64,
							onChange: (e) => {
								setValue(e.target.value);
								setError(false);
							},
							placeholder: "Orbit PIN",
							"aria-label": "Orbit PIN or password",
							"aria-invalid": error,
							className: "h-12 rounded-xl text-center tracking-[0.4em]"
						}),
						error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "pt-2 text-xs text-destructive",
							children: "Incorrect PIN. Try again."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: !value.trim() || busy,
							className: "mt-4 h-12 w-full rounded-full",
							children: "Unlock Orbit"
						})
					]
				})
			]
		})]
	});
}
function OrbitLayout() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitLockGate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) });
}
//#endregion
export { OrbitLayout as component };
