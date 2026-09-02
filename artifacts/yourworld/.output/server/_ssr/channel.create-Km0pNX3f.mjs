import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { En as Camera, Lt as Image, j as Sparkles, kt as Lock, tn as Earth, yn as ChevronLeft } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as emptyChannel, S as COUNTRIES, w as useChannel, x as CHANNEL_CATEGORIES } from "./router-CyuUkWV_.mjs";
import { t as Button } from "./button-BmMlQxPH.mjs";
import { t as Input } from "./input-D5M3x18p.mjs";
import { t as Textarea } from "./textarea-Cu4GbGPS.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/channel.create-Km0pNX3f.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ChannelCreate() {
	const { channel, hasChannel, saveChannel } = useChannel();
	const navigate = useNavigate();
	const [draft, setDraft] = (0, import_react.useState)(channel ?? emptyChannel());
	const logoInput = (0, import_react.useRef)(null);
	const bannerInput = (0, import_react.useRef)(null);
	const set = (k, v) => setDraft((d) => ({
		...d,
		[k]: v
	}));
	const pick = (file, key) => {
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.error("Please choose an image file");
			return;
		}
		if (file.size > 8388608) {
			toast.error("Image must be under 8 MB");
			return;
		}
		set(key, URL.createObjectURL(file));
	};
	const valid = draft.name.trim().length >= 2 && draft.handle.trim().length >= 3;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen pb-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-40 flex items-center gap-2 border-b border-border glass px-3 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: hasChannel ? "/channel" : "/settings",
					"aria-label": "Go back",
					className: "grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
						className: "h-5 w-5",
						strokeWidth: 1.8
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-lg font-bold",
					children: hasChannel ? "Edit Channel" : "Create Channel"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-4 pt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card overflow-hidden rounded-3xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative h-32 w-full bg-secondary",
						children: [
							draft.banner ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: draft.banner,
								alt: "Channel banner preview",
								className: "h-full w-full object-cover"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid h-full w-full place-items-center text-xs text-muted-foreground",
								children: "Channel banner"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => bannerInput.current?.click(),
								className: "absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-background/70 px-3 py-1.5 text-[11px] font-medium backdrop-blur transition-transform active:scale-95",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, {
									className: "h-3.5 w-3.5",
									strokeWidth: 1.7
								}), "Banner"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: bannerInput,
								type: "file",
								accept: "image/*",
								hidden: true,
								onChange: (e) => pick(e.target.files?.[0], "banner")
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => logoInput.current?.click(),
								"aria-label": "Change channel logo",
								className: "relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary transition-transform active:scale-95",
								children: draft.logo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: draft.logo,
									alt: "Channel logo preview",
									className: "h-full w-full object-cover"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {
									className: "h-5 w-5 text-muted-foreground",
									strokeWidth: 1.7
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: logoInput,
								type: "file",
								accept: "image/*",
								hidden: true,
								onChange: (e) => pick(e.target.files?.[0], "logo")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs leading-relaxed text-muted-foreground",
								children: "Add a square logo and a wide banner. Images stay on your device until you publish."
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4 px-4 pt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Channel Name",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: draft.name,
							maxLength: 50,
							onChange: (e) => set("name", e.target.value),
							placeholder: "Your channel name",
							className: "h-11 rounded-xl"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "@ Username",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground",
								children: "@"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: draft.handle,
								maxLength: 30,
								onChange: (e) => set("handle", e.target.value.replace(/[^\w.]/g, "").toLowerCase()),
								placeholder: "channel.handle",
								className: "h-11 rounded-xl pl-7"
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Category",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-2",
							children: CHANNEL_CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": draft.category === c,
								onClick: () => set("category", c),
								className: `rounded-full px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95 ${draft.category === c ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`,
								children: c
							}, c))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
						label: "Description",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							value: draft.description,
							maxLength: 300,
							rows: 5,
							onChange: (e) => set("description", e.target.value),
							placeholder: "What your channel is about",
							className: "min-h-28 rounded-xl leading-relaxed"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "pt-1 text-right text-[11px] text-muted-foreground",
							children: [draft.description.length, "/300"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Visibility",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VisibilityTile, {
								icon: Earth,
								label: "Public",
								hint: "Anyone can find and subscribe",
								active: draft.visibility === "public",
								onClick: () => set("visibility", "public")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VisibilityTile, {
								icon: Lock,
								label: "Private",
								hint: "Only people you invite",
								active: draft.visibility === "private",
								onClick: () => set("visibility", "private")
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Country (optional)",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-2",
							children: COUNTRIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": draft.country === c,
								onClick: () => set("country", draft.country === c ? "" : c),
								className: `rounded-full px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95 ${draft.country === c ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`,
								children: c
							}, c))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3 border-t border-border/60 pt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							className: "h-11 rounded-full",
							onClick: () => navigate({ to: hasChannel ? "/channel" : "/settings" }),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							className: "h-11 rounded-full",
							disabled: !valid,
							onClick: () => {
								saveChannel({
									...draft,
									createdAt: channel?.createdAt ?? Date.now()
								});
								toast.success(hasChannel ? "Channel updated" : "Channel created");
								navigate({ to: "/channel" });
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
								className: "mr-1.5 h-4 w-4",
								strokeWidth: 1.8
							}), hasChannel ? "Save Changes" : "Create Channel"]
						})]
					})
				]
			})
		]
	});
}
function VisibilityTile({ icon: Icon, label, hint, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		"aria-pressed": active,
		onClick,
		className: `rounded-2xl px-3.5 py-3 text-left transition-all active:scale-95 ${active ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: "h-[18px] w-[18px]",
				strokeWidth: 1.7
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-1.5 block text-sm font-semibold",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block text-[11px] opacity-80",
				children: hint
			})
		]
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
		children: label
	}), children] });
}
//#endregion
export { ChannelCreate as component };
