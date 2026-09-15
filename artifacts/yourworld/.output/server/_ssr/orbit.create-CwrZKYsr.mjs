import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as Star, Ct as MapPin, Et as Lock, N as Sparkles, Zt as Earth, _n as Check, a as WandSparkles, bn as Camera, et as Plus, gn as ChevronDown, hn as ChevronLeft, i as X, kt as LoaderCircle, l as Video, pn as ChevronUp } from "../_libs/lucide-react.mjs";
import { gt as cn } from "./router-D5PnWEBl.mjs";
import { t as Button } from "./button--M3mzSuG.mjs";
import { t as Input } from "./input-XakTmJAx.mjs";
import { t as Textarea } from "./textarea-CyRzx3LG.mjs";
import { h as uploadOrbitMedia, i as isOrbitVideoDurationValid, r as isLocalObjectUrl, s as saveOrbitPhotosRemote } from "./orbit-live-BqfCVEZi.mjs";
import { c as useOrbit, n as ORBIT_HOBBIES, r as ORBIT_LOOKING_FOR } from "./orbit-store-oAupMLr5.mjs";
import { n as citiesOf, r as statesOf, t as GEO_COUNTRIES } from "./geo-data-BFsPnKb3.mjs";
import { a as SelectItemIndicator, c as SelectPortal, d as SelectSeparator$1, f as SelectTrigger$1, i as SelectItem$1, l as SelectScrollDownButton$1, m as SelectViewport, n as SelectContent$1, o as SelectItemText, p as SelectValue$1, r as SelectIcon, s as SelectLabel$1, t as Select$1, u as SelectScrollUpButton$1 } from "../_libs/@radix-ui/react-select+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/orbit.create-CwrZKYsr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STYLES = [
	{
		id: "real",
		label: "Real Photo"
	},
	{
		id: "avatar",
		label: "Avatar / AI Photo"
	},
	{
		id: "stylized",
		label: "Stylized Photo"
	}
];
var PRIVACY = [
	{
		id: "matched",
		label: "Only Matched Users",
		hint: "Visible after match.",
		recommended: true
	},
	{
		id: "permission",
		label: "Only with My Permission",
		hint: "You approve every request."
	},
	{
		id: "everyone",
		label: "Everyone",
		hint: "Visible to everyone."
	}
];
var STYLE_ICON = {
	real: Camera,
	avatar: WandSparkles,
	stylized: Sparkles
};
var PRIVACY_ICON = {
	matched: Star,
	permission: Lock,
	everyone: Earth
};
function OrbitPhotos({ photos, privacy, onChange, onPrivacyChange }) {
	const input = (0, import_react.useRef)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const videoInput = (0, import_react.useRef)(null);
	const full = photos.length >= 6;
	const visible = photos.filter((p) => !isLocalObjectUrl(p.url));
	const add = async (files, kind = "photo") => {
		if (!files?.length) return;
		const room = 6 - photos.length;
		const picked = Array.from(files).slice(0, room);
		if (!picked.length) return;
		if (kind === "video" && !await isOrbitVideoDurationValid(picked[0])) {
			toast.error("Video duration must be 1 to 15 seconds.");
			return;
		}
		setBusy(true);
		const toastId = toast.loading(kind === "video" ? "Uploading video…" : "Uploading…");
		let workingPhotos = [...photos];
		let saved = 0;
		let usedFallback = false;
		try {
			for (const f of picked) {
				const url = await uploadOrbitMedia(f);
				if (!url) continue;
				usedFallback ||= url.startsWith("data:");
				const media = {
					id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
					url,
					style: "real",
					kind
				};
				workingPhotos = [...workingPhotos, media];
				saved += 1;
				onChange(workingPhotos);
				saveOrbitPhotosRemote(workingPhotos);
			}
		} catch (error) {
			console.error("[orbit] media picker failed", {
				kind,
				fileCount: picked.length,
				error
			});
		} finally {
			setBusy(false);
		}
		if (!saved) {
			toast.error("We couldn’t save this media. Please try again.", {
				id: toastId,
				description: "Storage was unavailable and a temporary preview could not be created."
			});
			return;
		}
		if (usedFallback) {
			toast.warning(kind === "video" ? "Video added with a temporary fallback." : "Photo added with a temporary fallback.", {
				id: toastId,
				description: "Storage was unavailable, so this preview is kept directly in your profile."
			});
			return;
		}
		toast.success(kind === "video" ? "Video added" : "Uploaded", { id: toastId });
	};
	const remove = (id) => onChange(photos.filter((p) => p.id !== id));
	const setStyle = (id, style) => onChange(photos.map((p) => p.id === id ? {
		...p,
		style
	} : p));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-2.5",
				children: [
					visible.map((p, i) => {
						const Icon = STYLE_ICON[p.style];
						const isVideo = p.kind === "video";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative aspect-[3/4] overflow-hidden rounded-2xl bg-secondary",
							children: [
								isVideo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
									src: p.url,
									muted: true,
									playsInline: true,
									loop: true,
									controls: false,
									className: "h-full w-full object-cover"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: p.url,
									alt: "",
									className: "h-full w-full object-cover"
								}),
								i === 0 && !isVideo && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute left-1.5 top-1.5 rounded-full bg-background/75 px-2 py-0.5 text-[10px] font-medium backdrop-blur",
									children: "Main"
								}),
								isVideo && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute left-1.5 top-1.5 rounded-full bg-background/75 px-2 py-0.5 text-[10px] font-medium backdrop-blur",
									children: "Video"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => remove(p.id),
									"aria-label": isVideo ? "Remove video" : "Remove photo",
									className: "absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-background/75 backdrop-blur transition-transform active:scale-90",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
										className: "h-3.5 w-3.5",
										strokeWidth: 1.9
									})
								}),
								!isVideo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "absolute inset-x-1.5 bottom-1.5 flex items-center gap-1 rounded-full bg-background/70 px-1.5 py-1 backdrop-blur",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
										className: "h-3 w-3 shrink-0 text-muted-foreground",
										strokeWidth: 1.8
									}), STYLES.map((s) => {
										const StyleIcon = STYLE_ICON[s.id];
										return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-label": s.label,
											"aria-pressed": p.style === s.id,
											onClick: () => setStyle(p.id, s.id),
											className: `grid h-5 flex-1 place-items-center rounded-full text-[11px] transition-all active:scale-90 ${p.style === s.id ? "bg-foreground/90" : "opacity-45"}`,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StyleIcon, {
												className: "h-3 w-3",
												strokeWidth: 1.8
											})
										}, s.id);
									})]
								})
							]
						}, p.id);
					}),
					busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						role: "status",
						"aria-label": "Uploading media",
						className: "relative grid aspect-[3/4] place-items-center overflow-hidden rounded-2xl border border-primary/30 bg-secondary/70",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col items-center gap-2 text-xs text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 animate-spin text-primary" }),
								"Uploading…",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute inset-x-3 bottom-3 h-1 overflow-hidden rounded-full bg-background/70",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-2/5 animate-pulse rounded-full bg-primary" })
								})
							]
						})
					}),
					!full && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => !busy && input.current?.click(),
						disabled: busy,
						className: "grid aspect-[3/4] place-items-center rounded-2xl border border-dashed border-border bg-secondary/40 text-muted-foreground transition-transform active:scale-95",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex flex-col items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
								className: "h-5 w-5",
								strokeWidth: 1.8
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px]",
								children: busy ? "Uploading…" : "Add photo"
							})]
						})
					}),
					!full && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => !busy && videoInput.current?.click(),
						disabled: busy,
						className: "grid aspect-[3/4] place-items-center rounded-2xl border border-dashed border-border bg-secondary/40 text-muted-foreground transition-transform active:scale-95",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex flex-col items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, {
								className: "h-5 w-5",
								strokeWidth: 1.8
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px]",
								children: "Add video"
							})]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: input,
				type: "file",
				accept: "image/*",
				multiple: true,
				hidden: true,
				onChange: (e) => {
					add(e.target.files, "photo");
					e.target.value = "";
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: videoInput,
				type: "file",
				accept: "video/*",
				hidden: true,
				onChange: (e) => {
					add(e.target.files, "video");
					e.target.value = "";
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[11px] text-muted-foreground",
				children: [
					"At least 1 photo is required · ",
					visible.length,
					"/",
					6,
					" added. You can also add a short intro video. Tap the icons on a photo to set its style."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl bg-secondary/50 p-3.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-center gap-1.5 text-xs font-semibold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
							className: "h-3.5 w-3.5",
							strokeWidth: 1.9
						}), "Original Photo Privacy"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "pt-1 text-[11px] text-muted-foreground",
						children: "Choose who can view your original photo."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-1.5 pt-3",
						children: PRIVACY.map((o) => {
							const active = privacy === o.id;
							const PrivacyIcon = PRIVACY_ICON[o.id];
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								"aria-pressed": active,
								onClick: () => onPrivacyChange(o.id),
								className: `flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all active:scale-[0.99] ${active ? "bg-foreground text-background" : "bg-background/60"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${active ? "border-background" : "border-border"}`,
									children: active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 rounded-full bg-background" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex flex-wrap items-center gap-1.5 text-sm font-medium",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrivacyIcon, {
												className: "h-3.5 w-3.5",
												strokeWidth: 1.8
											}),
											o.label,
											o.recommended && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${active ? "bg-background/20" : "bg-secondary text-muted-foreground"}`,
												children: "Recommended"
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `block pt-0.5 text-[11px] ${active ? "opacity-70" : "text-muted-foreground"}`,
										children: o.hint
									})]
								})]
							}, o.id);
						})
					})
				]
			})
		]
	});
}
var Select = Select$1;
var SelectValue = SelectValue$1;
var SelectTrigger = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectTrigger$1, {
	ref,
	className: cn("flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectIcon, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4 opacity-50" })
	})]
}));
SelectTrigger.displayName = SelectTrigger$1.displayName;
var SelectScrollUpButton = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpButton$1, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "h-4 w-4" })
}));
SelectScrollUpButton.displayName = SelectScrollUpButton$1.displayName;
var SelectScrollDownButton = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownButton$1, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4" })
}));
SelectScrollDownButton.displayName = SelectScrollDownButton$1.displayName;
var SelectContent = import_react.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent$1, {
	ref,
	className: cn("relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className),
	position,
	...props,
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpButton, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectViewport, {
			className: cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),
			children
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownButton, {})
	]
}) }));
SelectContent.displayName = SelectContent$1.displayName;
var SelectLabel = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectLabel$1, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", className),
	...props
}));
SelectLabel.displayName = SelectLabel$1.displayName;
var SelectItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem$1, {
	ref,
	className: cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemText, { children })]
}));
SelectItem.displayName = SelectItem$1.displayName;
var SelectSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectSeparator$1, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
SelectSeparator.displayName = SelectSeparator$1.displayName;
function OrbitCreate() {
	const orbit = useOrbit();
	const navigate = useNavigate();
	const [draft, setDraft] = (0, import_react.useState)({
		name: "",
		age: "",
		country: "",
		state: "",
		city: "",
		about: "",
		hobbies: [],
		lookingFor: "",
		photos: [],
		originalPhotoPrivacy: "matched",
		mood: null,
		...orbit.profile ?? {}
	});
	const set = (k, v) => setDraft((d) => ({
		...d,
		[k]: v
	}));
	const valid = draft.name.trim() && Number(draft.age) >= 18 && draft.photos.length >= 1 && draft.country && draft.city;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen pb-12",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "sticky top-0 z-40 flex items-center gap-2 border-b border-border glass px-3 py-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/orbit",
				"aria-label": "Back to Orbit",
				className: "grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
					className: "h-5 w-5",
					strokeWidth: 1.8
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-lg font-bold",
				children: orbit.hasProfile ? "Edit Orbit Profile" : "Create Orbit Profile"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4 px-4 pt-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Profile Photos",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitPhotos, {
						photos: draft.photos,
						privacy: draft.originalPhotoPrivacy,
						onChange: (p) => set("photos", p),
						onPrivacyChange: (p) => set("originalPhotoPrivacy", p)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Orbit Display Name",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: draft.name,
						maxLength: 40,
						onChange: (e) => set("name", e.target.value),
						placeholder: "How you appear in Orbit",
						className: "h-11 rounded-xl"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Age (18+)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: draft.age,
						inputMode: "numeric",
						maxLength: 2,
						onChange: (e) => set("age", e.target.value.replace(/\D/g, "")),
						placeholder: "18",
						className: "h-11 rounded-xl"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
					label: "Location",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: draft.country,
								maxLength: 56,
								list: "orbit-countries",
								placeholder: "Country",
								onChange: (e) => set("country", e.target.value),
								className: "h-11 rounded-xl"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
								id: "orbit-countries",
								children: GEO_COUNTRIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: c.name }, c.name))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: draft.state,
								maxLength: 56,
								list: "orbit-states",
								placeholder: "State / Region",
								onChange: (e) => set("state", e.target.value),
								className: "h-11 rounded-xl"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
								id: "orbit-states",
								children: statesOf(draft.country).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: s.name }, s.name))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: draft.city,
								maxLength: 56,
								list: "orbit-cities",
								placeholder: "City",
								onChange: (e) => set("city", e.target.value),
								className: "h-11 rounded-xl"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
								id: "orbit-cities",
								children: citiesOf(draft.country, draft.state).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: c }, c))
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-center gap-1 pt-2 text-[11px] text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
							className: "h-3 w-3",
							strokeWidth: 1.8
						}), "Only your city is visible publicly — your exact location is never shared."]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
					label: "Looking For",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: draft.lookingFor || void 0,
						onValueChange: (v) => set("lookingFor", v),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "h-11 rounded-xl",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select Preference" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: ORBIT_LOOKING_FOR.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: o,
							children: o
						}, o)) })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "pt-2 text-[11px] text-muted-foreground",
						children: "Only used to personalize Orbit recommendations and matching. You can change it anytime."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
					label: `Hobbies (Max 5)`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						children: ORBIT_HOBBIES.map((t) => {
							const active = draft.hobbies.includes(t);
							const full = draft.hobbies.length >= 5;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": active,
								disabled: !active && full,
								onClick: () => set("hobbies", active ? draft.hobbies.filter((x) => x !== t) : [...draft.hobbies, t]),
								className: `rounded-full px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95 disabled:opacity-40 ${active ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`,
								children: t
							}, t);
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "pt-2 text-[11px] text-muted-foreground",
						children: [
							draft.hobbies.length,
							"/",
							5,
							" selected"
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
					label: "About",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						value: draft.about,
						maxLength: 300,
						rows: 5,
						onChange: (e) => set("about", e.target.value),
						placeholder: "A little about you",
						className: "min-h-28 rounded-xl leading-relaxed"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "pt-1 text-right text-[11px] text-muted-foreground",
						children: [draft.about.length, "/300"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-3 border-t border-border/60 pt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						className: "h-11 rounded-full",
						onClick: () => navigate({ to: "/orbit" }),
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "h-11 rounded-full",
						disabled: !valid,
						onClick: async () => {
							orbit.saveProfile(draft);
							const { data } = await supabase.auth.getUser();
							if (data.user) toast.success("Orbit Profile created — all features unlocked");
							else toast.warning("Saved on this device — sign in so others can find your Orbit ID");
							navigate({ to: "/orbit" });
						},
						children: orbit.hasProfile ? "Save Changes" : "Create Profile"
					})]
				})
			]
		})]
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
		children: label
	}), children] });
}
//#endregion
export { OrbitCreate as component };
