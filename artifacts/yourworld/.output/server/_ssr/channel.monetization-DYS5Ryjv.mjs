import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { At as Lock, Sn as Check, cn as Coins } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Button } from "./button-CJwJANT3.mjs";
import { l as formatCount, n as MONETIZATION, o as channelStats, t as ChannelHeader } from "./channel-data-BD2RqW0C.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/channel.monetization-DYS5Ryjv.js
var import_jsx_runtime = require_jsx_runtime();
function ChannelMonetization() {
	const reqs = [{
		label: `${formatCount(MONETIZATION.minSubscribers)} subscribers`,
		value: channelStats.subscribers,
		target: MONETIZATION.minSubscribers
	}, {
		label: `${formatCount(MONETIZATION.minWatchHours)} watch hours`,
		value: channelStats.watchHours,
		target: MONETIZATION.minWatchHours
	}];
	const eligible = reqs.every((r) => r.value >= r.target);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen pb-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChannelHeader, { title: "Monetization" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-4 pt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card flex items-start gap-3 rounded-3xl p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-secondary",
						children: eligible ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coins, {
							className: "h-5 w-5",
							strokeWidth: 1.7
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
							className: "h-[18px] w-[18px]",
							strokeWidth: 1.7
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold",
							children: eligible ? "You're eligible to monetize" : "Monetization locked"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "pt-0.5 text-xs leading-relaxed text-muted-foreground",
							children: eligible ? "Apply once and earnings start on your next published video." : "Keep publishing — monetization unlocks automatically when you meet both requirements."
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-3 px-4 pt-4",
				children: reqs.map((r) => {
					const pct = Math.min(100, Math.round(r.value / r.target * 100));
					const done = r.value >= r.target;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "surface-card rounded-3xl p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `grid h-5 w-5 place-items-center rounded-full ${done ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
										className: "h-3 w-3",
										strokeWidth: 2.4
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "flex-1 text-sm font-medium",
									children: r.label
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										formatCount(r.value),
										" / ",
										formatCount(r.target)
									]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 h-1.5 overflow-hidden rounded-full bg-secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full rounded-full bg-foreground",
								style: { width: `${pct}%` }
							})
						})]
					}, r.label);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-4 pt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "h-11 w-full rounded-full",
					disabled: !eligible,
					onClick: () => toast.success("Monetization application submitted for review"),
					children: eligible ? "Apply for monetization" : "Not eligible yet"
				})
			})
		]
	});
}
//#endregion
export { ChannelMonetization as component };
