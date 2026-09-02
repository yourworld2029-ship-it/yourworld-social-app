import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { L as Shield, a as X, ft as Navigation, un as Clock3, xn as Check } from "../_libs/lucide-react.mjs";
import { B as cn } from "./router-CiO-AyXV.mjs";
import { n as SheetContent, t as Sheet } from "./sheet-D7b6s527.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/LiveLocationSheet-D-e8NBdd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Never defaults to "always" — the user must pick a window explicitly. */
var liveLocationDurations = [
	{
		id: "15m",
		label: "15 minutes",
		ms: 9e5
	},
	{
		id: "1h",
		label: "1 hour",
		ms: 36e5
	},
	{
		id: "8h",
		label: "8 hours",
		ms: 288e5
	},
	{
		id: "manual",
		label: "Until I stop",
		ms: null
	}
];
var idle = {
	active: false,
	endsAt: null,
	accuracyM: null,
	updatedAt: null,
	error: null,
	peerSharing: false
};
/**
* Privacy-first live location.
* - Nothing is read or transmitted until `start()` runs from a user tap.
* - Coordinates stay in this hook's ref and are never persisted or rendered.
* - `stop()` immediately clears the watch and every stored fix.
*/
function useLiveLocation() {
	const [session, setSession] = (0, import_react.useState)(idle);
	const watchId = (0, import_react.useRef)(null);
	const timer = (0, import_react.useRef)(null);
	/** Latest exact fix — kept in memory only, cleared on stop. */
	const lastFix = (0, import_react.useRef)(null);
	const teardown = (0, import_react.useCallback)(() => {
		if (watchId.current !== null && typeof navigator !== "undefined") navigator.geolocation?.clearWatch(watchId.current);
		watchId.current = null;
		if (timer.current !== null) window.clearTimeout(timer.current);
		timer.current = null;
		lastFix.current = null;
	}, []);
	const stop = (0, import_react.useCallback)(() => {
		teardown();
		setSession({ ...idle });
	}, [teardown]);
	(0, import_react.useEffect)(() => teardown, [teardown]);
	return {
		session,
		start: (0, import_react.useCallback)((duration) => new Promise((resolve) => {
			if (typeof navigator === "undefined" || !navigator.geolocation) {
				setSession((s) => ({
					...s,
					error: "Location isn't available on this device."
				}));
				resolve(false);
				return;
			}
			let settled = false;
			const endsAt = duration.ms === null ? null : Date.now() + duration.ms;
			watchId.current = navigator.geolocation.watchPosition((pos) => {
				lastFix.current = {
					lat: pos.coords.latitude,
					lng: pos.coords.longitude
				};
				setSession((s) => ({
					...s,
					active: true,
					endsAt,
					error: null,
					accuracyM: Math.round(pos.coords.accuracy),
					updatedAt: Date.now()
				}));
				if (!settled) {
					settled = true;
					resolve(true);
				}
			}, (err) => {
				teardown();
				setSession({
					...idle,
					error: err.code === err.PERMISSION_DENIED ? "Location permission was declined. Nothing was shared." : "Couldn't get a location fix. Nothing was shared."
				});
				if (!settled) {
					settled = true;
					resolve(false);
				}
			}, {
				enableHighAccuracy: true,
				maximumAge: 5e3,
				timeout: 15e3
			});
			if (endsAt !== null) timer.current = window.setTimeout(() => stop(), endsAt - Date.now());
		}), [stop, teardown]),
		stop,
		setPeerSharing: (0, import_react.useCallback)((peerSharing) => setSession((s) => ({
			...s,
			peerSharing
		})), [])
	};
}
var remainingLabel = (endsAt) => {
	if (endsAt === null) return "until you stop";
	const mins = Math.max(0, Math.round((endsAt - Date.now()) / 6e4));
	if (mins >= 60) return `for ${Math.round(mins / 60)}h`;
	return `for ${mins} min`;
};
function LiveLocationSheet({ open, onOpenChange, peerName, onConfirm }) {
	const [duration, setDuration] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const close = () => {
		setDuration(null);
		setBusy(false);
		onOpenChange(false);
	};
	const confirm = async () => {
		if (!duration || busy) return;
		setBusy(true);
		const ok = await onConfirm(duration);
		setBusy(false);
		if (ok) close();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange: (o) => o ? onOpenChange(true) : close(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
			side: "bottom",
			className: "max-h-[88dvh] overflow-y-auto rounded-t-3xl border-border/60 p-0 [&>button]:hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 pb-8 pt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-11 w-11 place-items-center rounded-2xl bg-secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, {
								className: "h-5 w-5",
								strokeWidth: 1.7
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: close,
							"aria-label": "Close",
							className: "grid h-8 w-8 place-items-center rounded-full bg-secondary/70 transition-transform active:scale-90",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
								className: "h-4 w-4",
								strokeWidth: 1.8
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "pt-4 font-display text-lg font-bold",
						children: "Share live location"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "pt-1.5 text-sm leading-relaxed text-muted-foreground",
						children: [peerName, " will see where you are while sharing is on. Sharing is off until you choose a time window below."]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 flex items-start gap-2 rounded-2xl bg-secondary/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, {
								className: "mt-0.5 h-3.5 w-3.5 shrink-0",
								strokeWidth: 1.8
							}),
							"Your exact position stays private until you tap Start, stops the moment you tap Stop, and is never shared with anyone else. ",
							peerName,
							" decides separately whether to share back."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "pt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
						children: "Share for"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-2 gap-2 pt-2.5",
						children: liveLocationDurations.map((d) => {
							const on = duration?.id === d.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								"aria-pressed": on,
								onClick: () => setDuration(d),
								className: cn("flex items-center justify-between gap-2 rounded-2xl border px-3.5 py-3 text-left text-sm font-medium transition-colors", on ? "border-transparent brand-gradient text-primary-foreground" : "border-border/60 bg-secondary/50 hover:bg-secondary"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, {
										className: "h-4 w-4 shrink-0 opacity-80",
										strokeWidth: 1.7
									}), d.label]
								}), on && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
									className: "h-4 w-4 shrink-0",
									strokeWidth: 2.2
								})]
							}, d.id);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2 pt-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: close,
							className: "rounded-full border border-border/60 py-3 text-sm font-semibold transition-colors hover:bg-secondary",
							children: "Not now"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: !duration || busy,
							onClick: confirm,
							className: "rounded-full brand-gradient py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-40",
							children: busy ? "Asking permission…" : "Start sharing"
						})]
					})
				]
			})
		})
	});
}
//#endregion
export { remainingLabel as n, useLiveLocation as r, LiveLocationSheet as t };
