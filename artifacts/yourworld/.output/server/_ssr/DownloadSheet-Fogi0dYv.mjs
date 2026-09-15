import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $t as Download, At as LoaderCircle, Wt as Film, cn as Circle, dn as CircleDot, kn as AudioLines } from "../_libs/lucide-react.mjs";
import { J as VIDEO_QUALITY_TIERS, X as estimateDownloadSizeMb, Y as availableVideoQualityTiers, Z as formatDownloadSizeMb, gt as cn } from "./router-DAt39S6o.mjs";
import { a as SheetTitle, i as SheetHeader, n as SheetContent, r as SheetDescription, t as Sheet } from "./sheet-DHc3jaiH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/DownloadSheet-Fogi0dYv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var QUALITY_COPY = {
	"2160p": {
		title: "4K Ultra HD (2160p)",
		description: "High bitrate"
	},
	"1440p": {
		title: "2K QHD (1440p)",
		description: "Sharp high-definition video"
	},
	"1080p": {
		title: "Full HD (1080p)",
		description: "Balanced quality and file size"
	},
	"720p": {
		title: "HD (720p)",
		description: "Good quality for everyday viewing"
	},
	"480p": {
		title: "Standard (480p / 360p)",
		description: "Smaller file for slower connections"
	}
};
function DownloadSheet({ open, onOpenChange, title, durationSeconds, sourceQualityTier, onDownload }) {
	const choices = (0, import_react.useMemo)(() => {
		return [
			...(sourceQualityTier ? availableVideoQualityTiers(sourceQualityTier) : VIDEO_QUALITY_TIERS.slice(0, 5)).filter((choice) => choice.id !== "4320p").map((choice) => choice.id),
			"original",
			"mp3"
		];
	}, [sourceQualityTier]);
	const [selected, setSelected] = (0, import_react.useState)(sourceQualityTier ?? "original");
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (open) setSelected(sourceQualityTier ?? "original");
	}, [open, sourceQualityTier]);
	const submit = async () => {
		setBusy(true);
		try {
			await onDownload(selected);
			onOpenChange(false);
		} finally {
			setBusy(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			side: "bottom",
			className: "rounded-t-3xl border-zinc-800 bg-[#15151a] px-4 pb-8 text-white",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetHeader, {
				className: "mx-auto max-w-lg pb-4 pt-1 text-left",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, {
					className: "text-base text-white",
					children: "Download Video / Audio"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetDescription, {
					className: "truncate text-xs text-zinc-400",
					children: title
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-lg space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-1 pt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400",
						children: "Video Qualities"
					}),
					choices.filter((choice) => choice !== "mp3").map((choice) => {
						const isOriginal = choice === "original";
						const isSelected = choice === selected;
						const quality = choice !== "original" && choice !== "4320p" ? QUALITY_COPY[choice] : null;
						const size = formatDownloadSizeMb(estimateDownloadSizeMb(durationSeconds, choice));
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "radio",
							"aria-checked": isSelected,
							disabled: busy,
							onClick: () => setSelected(choice),
							className: cn("flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left shadow-sm transition-all active:scale-[0.99]", isSelected ? "border-pink-500/70 bg-pink-500/10" : "border-zinc-800 bg-zinc-900/70 hover:border-zinc-700 hover:bg-zinc-800", busy && "opacity-60"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-800 text-zinc-200",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Film, { size: 18 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "block text-sm font-semibold",
										children: [isOriginal ? "Original Video File (Source Quality)" : quality?.title, !isOriginal && choice === sourceQualityTier && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "ml-2 text-[10px] font-medium text-pink-300",
											children: "SOURCE"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "mt-0.5 block text-[11px] text-zinc-400",
										children: [
											isOriginal ? "Original source file" : quality?.description,
											" · ",
											size
										]
									})]
								}),
								isSelected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleDot, {
									size: 22,
									className: "shrink-0 text-pink-500"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, {
									size: 22,
									className: "shrink-0 text-zinc-600"
								})
							]
						}, choice);
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-1 pt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400",
						children: "Audio Only"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						role: "radio",
						"aria-checked": selected === "mp3",
						disabled: busy,
						onClick: () => setSelected("mp3"),
						className: cn("flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left shadow-sm transition-all active:scale-[0.99]", selected === "mp3" ? "border-pink-500/70 bg-pink-500/10" : "border-zinc-800 bg-zinc-900/70 hover:border-zinc-700 hover:bg-zinc-800", busy && "opacity-60"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-800 text-zinc-200",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudioLines, { size: 18 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-sm font-semibold",
									children: "MP3 Audio"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "mt-0.5 block text-[11px] text-zinc-400",
									children: ["Extracted / direct audio stream · ", formatDownloadSizeMb(estimateDownloadSizeMb(durationSeconds, "mp3"))]
								})]
							}),
							selected === "mp3" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleDot, {
								size: 22,
								className: "shrink-0 text-pink-500"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, {
								size: 22,
								className: "shrink-0 text-zinc-600"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: busy,
						onClick: () => void submit(),
						className: "mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-bold text-black transition-transform active:scale-[0.98] disabled:opacity-50",
						children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
							size: 17,
							className: "animate-spin"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 17 }), busy ? "Preparing download…" : "Download Selected"]
					})
				]
			})]
		})
	});
}
//#endregion
export { DownloadSheet as t };
