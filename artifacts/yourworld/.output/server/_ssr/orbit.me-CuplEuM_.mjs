import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { Lt as ImagePlus, Tt as MapPin, j as Sparkles, st as Pencil, u as Video, vn as ChevronLeft } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Button } from "./button-BLnOldoS.mjs";
import { c as isLocalObjectUrl, d as useOrbit, u as uploadOrbitMedia } from "./orbit-store-CboCDVmk.mjs";
import { t as moodById } from "./orbit-mood--S38GIFY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/orbit.me-CuplEuM_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OrbitMyProfile() {
	const orbit = useOrbit();
	const navigate = useNavigate();
	const photoInput = (0, import_react.useRef)(null);
	const videoInput = (0, import_react.useRef)(null);
	const p = orbit.profile;
	if (!p) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-screen place-items-center px-6 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground",
			children: "You don't have an Orbit profile yet."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/orbit/create",
			className: "mt-4 inline-block rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background",
			children: "Create Orbit Profile"
		})] })
	});
	const mood = moodById(p.mood ?? void 0);
	const usable = p.photos.filter((m) => !isLocalObjectUrl(m.url));
	const cover = usable.find((m) => m.kind !== "video");
	const videos = usable.filter((m) => m.kind === "video");
	const addMedia = async (files, kind) => {
		if (!files?.length) return;
		const room = 6 - p.photos.length;
		if (room <= 0) {
			toast.warning(`You can keep up to 6 items.`);
			return;
		}
		const picked = Array.from(files).slice(0, room);
		const toastId = toast.loading(kind === "video" ? "Uploading video…" : "Uploading photo…");
		const next = [];
		for (const f of picked) {
			const url = await uploadOrbitMedia(f);
			if (!url) continue;
			next.push({
				id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
				url,
				style: "real",
				kind
			});
		}
		if (!next.length) {
			toast.error("Upload failed. Please try again.", { id: toastId });
			return;
		}
		orbit.saveProfile({
			...p,
			photos: [...p.photos, ...next]
		});
		toast.success(kind === "video" ? "Video added to your Orbit profile" : "Photo added", { id: toastId });
	};
	const removeMedia = (id) => {
		orbit.saveProfile({
			...p,
			photos: p.photos.filter((m) => m.id !== id)
		});
		toast.success("Removed");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen pb-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-40 flex items-center gap-2 border-b border-border glass px-3 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => navigate({ to: "/orbit" }),
						"aria-label": "Back to Orbit feed",
						className: "grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
							className: "h-5 w-5",
							strokeWidth: 1.8
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-lg font-bold",
						children: "My Orbit Profile"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/orbit/create",
						"aria-label": "Edit Orbit profile",
						className: "ml-auto flex items-center gap-1.5 rounded-full chip px-3 py-1.5 text-xs font-semibold transition-transform active:scale-95",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, {
							className: "h-3.5 w-3.5",
							strokeWidth: 1.9
						}), "Edit"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative aspect-[4/5] w-full overflow-hidden bg-secondary",
				children: [cover ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: cover.url,
					alt: `${p.name}'s Orbit photo`,
					className: "h-full w-full object-cover"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid h-full w-full place-items-center text-sm text-muted-foreground",
					children: "No photo yet"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,oklch(0.12_0.02_290/0.92),transparent)] p-5 pt-20",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "font-display text-2xl font-bold",
							children: [p.name, p.age ? `, ${p.age}` : ""]
						}),
						mood && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mt-2 inline-flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-1 text-[11px] font-medium backdrop-blur",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								"aria-hidden": true,
								className: "grid h-4 w-4 place-items-center rounded-full bg-primary/20 text-[9px] font-bold text-primary",
								children: mood.label.charAt(0)
							}), mood.label]
						}),
						(p.city || p.country) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "flex items-center gap-1 pt-1.5 text-xs text-muted-foreground/90",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
								className: "h-3.5 w-3.5",
								strokeWidth: 1.8
							}), [p.city, p.country].filter(Boolean).join(" · ")]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-6 px-5 pt-5",
				children: [
					p.about && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-relaxed text-muted-foreground",
						children: p.about
					}),
					p.hobbies.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1.5",
						children: p.hobbies.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "chip rounded-full px-3 py-1 text-[11px] font-medium",
							children: t
						}, t))
					}),
					p.lookingFor && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-center gap-1.5 text-xs text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
								className: "h-3.5 w-3.5",
								strokeWidth: 1.8
							}),
							"Looking for: ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium text-foreground",
								children: p.lookingFor
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between pb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
								children: "Photos & Video"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[11px] text-muted-foreground",
								children: [
									usable.length,
									"/",
									6
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-3 gap-2.5",
							children: usable.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative aspect-[3/4] overflow-hidden rounded-2xl bg-secondary",
								children: [m.kind === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
									src: m.url,
									muted: true,
									playsInline: true,
									controls: true,
									className: "h-full w-full object-cover"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: m.url,
									alt: "",
									className: "h-full w-full object-cover"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => removeMedia(m.id),
									className: "absolute right-1.5 top-1.5 rounded-full bg-background/75 px-2 py-0.5 text-[10px] font-semibold backdrop-blur transition-transform active:scale-90",
									children: "Remove"
								})]
							}, m.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-3 pt-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "secondary",
								className: "h-11 rounded-full",
								onClick: () => photoInput.current?.click(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, {
									className: "mr-1.5 h-4 w-4",
									strokeWidth: 1.8
								}), "Add photo"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "secondary",
								className: "h-11 rounded-full",
								onClick: () => videoInput.current?.click(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, {
									className: "mr-1.5 h-4 w-4",
									strokeWidth: 1.8
								}), "Add video"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: photoInput,
							type: "file",
							accept: "image/*",
							multiple: true,
							hidden: true,
							onChange: (e) => {
								addMedia(e.target.files, "photo");
								e.target.value = "";
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: videoInput,
							type: "file",
							accept: "video/*",
							hidden: true,
							onChange: (e) => {
								addMedia(e.target.files, "video");
								e.target.value = "";
							}
						}),
						videos.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "pt-2 text-[11px] text-muted-foreground",
							children: "Add a short intro video so people get a real feel for you."
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "h-11 w-full rounded-full",
						onClick: () => navigate({ to: "/orbit/create" }),
						children: "Edit profile details"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] leading-relaxed text-muted-foreground",
						children: "This is exactly how your Orbit profile appears to others — only your approximate area is ever shown."
					})
				]
			})
		]
	});
}
//#endregion
export { OrbitMyProfile as component };
