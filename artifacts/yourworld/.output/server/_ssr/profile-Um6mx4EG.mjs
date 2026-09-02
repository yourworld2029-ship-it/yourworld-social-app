import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-DidqkCgA.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime, a as Overlay2, c as Title2, i as Description2, n as Cancel, o as Portal2, r as Content2, s as Root2, t as Action } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { C as Trash2, Dn as Camera, Dt as MapPin, Gt as Grid3x3, Ht as Heart, Ln as Archive, Nn as BadgeCheck, Nt as Link2, Sn as Check, U as Send, V as Settings, a as X, bn as ChevronLeft, ct as Pencil, en as Ellipsis, et as Plus, it as PinOff, kn as Bookmark, rt as Pin, tt as Play, wt as MessageCircleOff, yn as ChevronRight, zt as ImagePlus } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { B as cn, F as useYw, O as useMoments, R as useFollowCounts, d as useMyProfile, f as useResolvedMedia, h as UserWatermark, l as deleteMyPost, m as compressImageFile, u as updateMyPost } from "./router-BiZTSwF5.mjs";
import { t as YwAvatar } from "./Avatar-DDnO9R12.mjs";
import { n as SheetContent, t as Sheet } from "./sheet-gYmMopak.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, t as Dialog } from "./dialog-BwzCtjyo.mjs";
import { n as buttonVariants, t as Button } from "./button-BEY3rWmZ.mjs";
import { t as Input } from "./input-Dyfj6ERE.mjs";
import { t as Textarea } from "./textarea-DZaLozEm.mjs";
import { t as Switch } from "./switch-ZTCXJC09.mjs";
import { t as formatCount } from "./yw-data-CyapVFm6.mjs";
import { a as TabsTrigger, i as TabsList, n as Tabs, r as TabsContent, t as FollowListDialog } from "./FollowListDialog-DdVDWoHJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-Um6mx4EG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var AlertDialog = Root2;
var AlertDialogPortal = Portal2;
var AlertDialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlay2, {
	className: cn("fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
AlertDialogOverlay.displayName = Overlay2.displayName;
var AlertDialogContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props
})] }));
AlertDialogContent.displayName = Content2.displayName;
var AlertDialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
AlertDialogHeader.displayName = "AlertDialogHeader";
var AlertDialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
AlertDialogFooter.displayName = "AlertDialogFooter";
var AlertDialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Title2, {
	ref,
	className: cn("text-lg font-semibold", className),
	...props
}));
AlertDialogTitle.displayName = Title2.displayName;
var AlertDialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Description2, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
AlertDialogDescription.displayName = Description2.displayName;
var AlertDialogAction = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
	ref,
	className: cn(buttonVariants(), className),
	...props
}));
AlertDialogAction.displayName = Action.displayName;
var AlertDialogCancel = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cancel, {
	ref,
	className: cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className),
	...props
}));
AlertDialogCancel.displayName = Cancel.displayName;
var TOKEN = /(https?:\/\/[^\s]+|www\.[^\s]+|#[\p{L}\p{N}_]+|@[\w.]+)/gu;
function renderLine(line, key) {
	const parts = line.split(TOKEN);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: parts.map((part, i) => {
		if (!part) return null;
		if (/^(https?:\/\/|www\.)/i.test(part)) {
			const href = part.startsWith("http") ? part : `https://${part}`;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href,
				target: "_blank",
				rel: "noopener noreferrer",
				className: "text-primary underline-offset-2 hover:underline",
				children: part.replace(/^https?:\/\//, "")
			}, i);
		}
		if (part.startsWith("#") || part.startsWith("@")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-primary",
			children: part
		}, i);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: part }, i);
	}) }, key);
}
function Bio({ text }) {
	const ref = (0, import_react.useRef)(null);
	const [expanded, setExpanded] = (0, import_react.useState)(false);
	const [overflows, setOverflows] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el) return;
		const check = () => {
			const prev = el.style.webkitLineClamp;
			el.style.webkitLineClamp = "5";
			setOverflows(el.scrollHeight - el.clientHeight > 1);
			el.style.webkitLineClamp = prev;
		};
		check();
		const ro = new ResizeObserver(check);
		ro.observe(el);
		return () => ro.disconnect();
	}, [text]);
	const lines = text.split("\n");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pt-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			ref,
			className: "whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground",
			style: expanded ? void 0 : {
				display: "-webkit-box",
				WebkitBoxOrient: "vertical",
				WebkitLineClamp: 5,
				overflow: "hidden"
			},
			children: lines.map((l, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [renderLine(l, `l${i}`), i < lines.length - 1 ? "\n" : null] }, i))
		}), overflows && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => setExpanded((v) => !v),
			className: "mt-1 text-xs font-semibold text-foreground/80 transition-opacity active:opacity-60",
			"aria-expanded": expanded,
			children: expanded ? "Show less" : "Show more"
		})]
	});
}
var CATEGORIES = [
	"Creator",
	"Athlete",
	"Business",
	"Gamer",
	"Artist",
	"Musician",
	"Photographer"
];
var BIO_MAX = 300;
function EditProfileSheet({ open, onOpenChange, user, value, onSave }) {
	const [draft, setDraft] = (0, import_react.useState)(value);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const avatarInput = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (open) setDraft(value);
	}, [open, value]);
	const set = (k, v) => setDraft((d) => ({
		...d,
		[k]: v
	}));
	const pick = (file, key) => {
		if (!file) return;
		setDraft((d) => ({
			...d,
			[key]: URL.createObjectURL(file),
			[key === "avatarUrl" ? "avatarFile" : "coverFile"]: file
		}));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			side: "bottom",
			className: "max-h-[92svh] overflow-y-auto rounded-t-3xl border-border/60 p-0 [&>button]:hidden",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-0 z-10 flex items-center justify-between border-b border-border/60 glass px-4 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => onOpenChange(false),
						"aria-label": "Close",
						className: "grid h-8 w-8 place-items-center rounded-full bg-secondary/70 transition-transform active:scale-90",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
							className: "h-4 w-4",
							strokeWidth: 1.8
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-base font-bold",
						children: "Edit Profile"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-8" })
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-4 pb-8 pt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative overflow-hidden rounded-3xl bg-secondary/60",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4 p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => avatarInput.current?.click(),
								className: "relative shrink-0 transition-transform active:scale-95",
								"aria-label": "Change profile photo",
								children: [draft.avatarUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: draft.avatarUrl,
									alt: "",
									className: "h-[68px] w-[68px] rounded-full object-cover"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(YwAvatar, {
									user,
									size: 68
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute -bottom-0.5 -right-0.5 grid h-7 w-7 place-items-center rounded-full border-2 border-background bg-foreground text-background",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {
										className: "h-3.5 w-3.5",
										strokeWidth: 1.9
									})
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: "Tap the photo to update your profile picture."
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: avatarInput,
						type: "file",
						accept: "image/*",
						hidden: true,
						onChange: (e) => pick(e.target.files?.[0], "avatarUrl")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4 pt-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Display Name",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: draft.name,
									maxLength: 40,
									onChange: (e) => set("name", e.target.value),
									className: "h-11 rounded-xl"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Username",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground",
										children: "@"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: draft.username,
										maxLength: 30,
										onChange: (e) => set("username", e.target.value.replace(/[^\w.]/g, "").toLowerCase()),
										className: "h-11 rounded-xl pl-7"
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Category",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex flex-wrap gap-2",
									children: CATEGORIES.map((c) => {
										const active = draft.category === c;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => set("category", active ? "" : c),
											className: `rounded-full px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95 ${active ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`,
											children: c
										}, c);
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
								label: "Bio",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									value: draft.bio,
									maxLength: BIO_MAX,
									rows: 5,
									onChange: (e) => set("bio", e.target.value),
									className: "min-h-28 rounded-xl leading-relaxed"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "pt-1 text-right text-[11px] text-muted-foreground",
									children: [
										draft.bio.length,
										"/",
										BIO_MAX
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => toast.success("Verification request submitted for review"),
								className: "flex w-full items-center justify-between rounded-2xl bg-secondary px-4 py-3.5 text-left transition-transform active:scale-[0.99]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, {
										className: "h-5 w-5 fill-[oklch(0.62_0.17_255)] text-background",
										strokeWidth: 1.8
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-medium",
										children: "Verification Request"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground",
									children: "Apply"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 grid grid-cols-2 gap-3 border-t border-border/60 pt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							className: "h-11 rounded-full",
							onClick: () => onOpenChange(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "h-11 rounded-full",
							disabled: saving,
							onClick: async () => {
								setSaving(true);
								try {
									await onSave(draft);
									onOpenChange(false);
									toast.success("Profile updated");
								} catch (e) {
									toast.error(e instanceof Error ? e.message : "Could not save profile");
								} finally {
									setSaving(false);
								}
							},
							children: saving ? "Saving…" : "Save Changes"
						})]
					})
				]
			})]
		})
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
		children: label
	}), children] });
}
var MAX_COVER_EDGE = 320;
function Thumb({ src, video }) {
	if (!src) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-full bg-muted" });
	if (video) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
		src,
		muted: true,
		playsInline: true,
		preload: "metadata",
		className: "h-full w-full object-cover"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src,
		alt: "",
		loading: "lazy",
		className: "h-full w-full object-cover"
	});
}
function Highlights({ userId, posts }) {
	const { archive } = useMoments();
	const [highlights, setHighlights] = (0, import_react.useState)([]);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [step, setStep] = (0, import_react.useState)(0);
	const [selected, setSelected] = (0, import_react.useState)(/* @__PURE__ */ new Map());
	const [title, setTitle] = (0, import_react.useState)("");
	const [cover, setCover] = (0, import_react.useState)(null);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const coverInput = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!userId) return;
		let cancelled = false;
		supabase.from("highlights").select("*").eq("user_id", userId).order("created_at", { ascending: true }).then(({ data, error }) => {
			if (cancelled || error) return;
			setHighlights(data ?? []);
		});
		return () => {
			cancelled = true;
		};
	}, [userId]);
	const storyItems = (0, import_react.useMemo)(() => archive.map((m) => ({
		source: "story",
		refId: m.id,
		thumb: m.media ?? "",
		media: m.media,
		mediaType: m.kind === "video" ? "video" : "image"
	})), [archive]);
	const topReels = (0, import_react.useMemo)(() => [...posts].filter((p) => p.media_type?.startsWith("video") || p.kind === "reel" || p.kind === "video").sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).map((p) => ({
		source: "post",
		refId: p.id,
		thumb: p.media_url,
		media: p.media_url,
		mediaType: "video"
	})), [posts]);
	const postItems = (0, import_react.useMemo)(() => posts.map((p) => ({
		source: "post",
		refId: p.id,
		thumb: p.media_url,
		media: p.media_url,
		mediaType: p.media_type
	})), [posts]);
	const toggle = (item) => {
		setSelected((prev) => {
			const next = new Map(prev);
			const key = `${item.source}:${item.refId}`;
			if (next.has(key)) next.delete(key);
			else next.set(key, item);
			return next;
		});
	};
	const reset = () => {
		setStep(0);
		setSelected(/* @__PURE__ */ new Map());
		setTitle("");
		setCover(null);
	};
	const pickCover = async (file) => {
		if (!file) return;
		try {
			const dataUrl = await compressImageFile(file, {
				maxDim: MAX_COVER_EDGE,
				quality: .8
			});
			setCover(dataUrl);
		} catch {
			toast.error("Could not load that image");
		}
	};
	const save = async () => {
		if (!userId) return;
		if (!title.trim()) {
			toast.error("Add a highlight title");
			return;
		}
		const items = [...selected.values()];
		if (!items.length) {
			toast.error("Select at least one item");
			return;
		}
		setSaving(true);
		try {
			const payload = {
				user_id: userId,
				title: title.trim(),
				cover_url: cover ?? items[0]?.thumb ?? null,
				items
			};
			const { data, error } = await supabase.from("highlights").insert(payload).select("*").single();
			if (error) throw error;
			setHighlights((h) => [...h, data]);
			toast.success("Highlight added");
			setOpen(false);
			reset();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not save highlight");
		} finally {
			setSaving(false);
		}
	};
	const renderGrid = (items) => {
		if (!items.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "py-10 text-center text-sm text-muted-foreground",
			children: "Nothing here yet."
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-3 gap-1.5",
			children: items.map((item) => {
				const key = `${item.source}:${item.refId}`;
				const active = selected.has(key);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => toggle(item),
					className: "relative aspect-square overflow-hidden rounded-lg border border-border bg-muted transition-transform active:scale-95",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thumb, {
							src: item.thumb,
							video: item.mediaType === "video"
						}),
						active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground shadow",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3 w-3" })
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("absolute inset-0 transition-colors", active ? "bg-primary/20 ring-2 ring-inset ring-primary" : "bg-transparent") })
					]
				}, key);
			})
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "px-4 pt-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "no-scrollbar flex gap-4 overflow-x-auto pb-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setOpen(true),
				className: "flex w-[68px] shrink-0 flex-col items-center gap-1.5 transition-transform active:scale-95",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid h-[60px] w-[60px] place-items-center rounded-full border border-border/60 bg-muted/40 backdrop-blur-md",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
						className: "h-6 w-6 text-muted-foreground",
						strokeWidth: 1.8
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "w-full truncate text-center text-[11px] text-muted-foreground",
					children: "New"
				})]
			}), highlights.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex w-[68px] shrink-0 flex-col items-center gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "h-[60px] w-[60px] overflow-hidden rounded-full border border-border/60 bg-muted/40 p-[2px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block h-full w-full overflow-hidden rounded-full",
						children: h.cover_url ? h.items?.[0]?.mediaType === "video" && !h.cover_url.startsWith("data:") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thumb, {
							src: h.cover_url,
							video: true
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thumb, { src: h.cover_url }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-full w-full place-items-center bg-muted text-xs font-semibold text-muted-foreground",
							children: h.title.slice(0, 1).toUpperCase()
						})
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "w-full truncate text-center text-[11px] text-muted-foreground",
					children: h.title
				})]
			}, h.id))]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open,
			onOpenChange: (o) => {
				setOpen(o);
				if (!o) reset();
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "max-w-md border-border/60 bg-background/80 p-0 backdrop-blur-xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, {
					className: "px-4 pt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: step === 0 ? "New highlight" : "Name your highlight" })
				}), step === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "px-4 pb-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
						defaultValue: "stories",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
							className: "grid w-full grid-cols-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "stories",
									children: "Stories"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "top",
									children: "Top Reels/Videos"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "posts",
									children: "Posts"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 max-h-[46vh] overflow-y-auto pr-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
									value: "stories",
									className: "mt-0",
									children: renderGrid(storyItems)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
									value: "top",
									className: "mt-0",
									children: renderGrid(topReels)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
									value: "posts",
									className: "mt-0",
									children: renderGrid(postItems)
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between pt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-muted-foreground",
							children: [selected.size, " selected"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							className: "rounded-full",
							disabled: !selected.size,
							onClick: () => setStep(1),
							children: ["Next ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-1 h-4 w-4" })]
						})]
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 px-4 pb-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => coverInput.current?.click(),
								className: "relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted/40 transition-transform active:scale-95",
								children: [cover ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thumb, { src: cover }) : selected.size ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thumb, {
									src: [...selected.values()][0]?.thumb,
									video: [...selected.values()][0]?.mediaType === "video"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-full w-full place-items-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "h-6 w-6 text-muted-foreground" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute inset-0 grid place-items-center bg-black/25 opacity-0 transition-opacity hover:opacity-100",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "h-5 w-5 text-white" })
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: title,
									onChange: (e) => setTitle(e.target.value),
									placeholder: "Highlight title",
									maxLength: 30,
									className: "bg-muted/40"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "pt-1.5 text-[11px] text-muted-foreground",
									children: "Tap the circle to set a custom cover (optional)."
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: coverInput,
							type: "file",
							accept: "image/*",
							className: "hidden",
							onChange: (e) => void pickCover(e.target.files?.[0])
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "ghost",
								className: "rounded-full",
								onClick: () => setStep(0),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "mr-1 h-4 w-4" }), " Back"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "rounded-full",
								disabled: saving,
								onClick: () => void save(),
								children: saving ? "Saving…" : "Save highlight"
							})]
						})
					]
				})]
			})
		})]
	});
}
function ProfilePage() {
	const { saved } = useYw();
	const { profile, avatarSrc, grid, reels, posts, loading, save, userId, reload } = useMyProfile();
	const [editOpen, setEditOpen] = (0, import_react.useState)(false);
	const counts = useFollowCounts(userId);
	const [listOpen, setListOpen] = (0, import_react.useState)(false);
	const [listTab, setListTab] = (0, import_react.useState)("followers");
	const [manage, setManage] = (0, import_react.useState)(null);
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [caption, setCaption] = (0, import_react.useState)("");
	const [location, setLocation] = (0, import_react.useState)("");
	const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const openManage = (post) => {
		setManage(post);
		setEditing(false);
		setCaption(post.caption ?? "");
		setLocation(post.location ?? "");
	};
	const startEdit = (post) => {
		setCaption(post.caption ?? "");
		setLocation(post.location ?? "");
		setEditing(true);
	};
	const patchManaged = async (patch, msg) => {
		if (!manage) return;
		const prev = manage;
		setManage({
			...manage,
			...patch
		});
		try {
			await updateMyPost(prev.id, patch);
			toast.success(msg);
			await reload();
		} catch (e) {
			setManage(prev);
			toast.error(e instanceof Error ? e.message : "Couldn't update");
		}
	};
	const sortPinned = (list) => [...list].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
	const savedPosts = posts.filter((p) => saved[p.id]);
	const media = useResolvedMedia([...posts.map((p) => p.media_url)]);
	const src = (u) => media[u] ?? u;
	const avatarUser = {
		id: userId ?? "me",
		username: profile.username || "you",
		name: profile.display_name || profile.username || "You",
		hue: 280
	};
	const editValue = {
		name: profile.display_name,
		username: profile.username,
		category: profile.category,
		bio: profile.bio,
		location: profile.location,
		website: profile.website,
		avatarUrl: avatarSrc ?? void 0
	};
	if (!loading && !userId) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative min-h-screen",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "sticky top-0 z-40 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border glass px-4 py-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-xl font-bold",
				children: "Profile"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/settings",
				"aria-label": "Settings",
				className: "transition-transform active:scale-90",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "h-6 w-6" })
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid place-items-center px-6 py-24 text-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Sign in to see your profile."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/auth",
				className: "mt-4 inline-block rounded-full bg-foreground px-5 py-2 text-xs font-semibold text-background",
				children: "Sign in"
			})] })
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative pb-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserWatermark, { username: profile.username }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-40 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border glass px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "flex min-w-0 items-center gap-1.5 font-display text-xl font-bold",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "truncate",
						children: ["@", profile.username || "…"]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/settings",
					"aria-label": "Settings",
					className: "transition-transform active:scale-90",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "h-6 w-6" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "px-4 pt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-[86px] w-[86px] shrink-0 place-items-center rounded-full p-[3px] ring-story",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-full w-full place-items-center rounded-full bg-background p-[2px]",
								children: avatarSrc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: avatarSrc,
									alt: "",
									className: "h-[74px] w-[74px] rounded-full object-cover"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(YwAvatar, {
									user: avatarUser,
									size: 74
								})
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "grid flex-1 grid-cols-3 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Posts",
									value: formatCount(posts.length)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Followers",
									value: formatCount(counts.followers),
									onClick: () => {
										setListTab("followers");
										setListOpen(true);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Following",
									value: formatCount(counts.following),
									onClick: () => {
										setListTab("following");
										setListOpen(true);
									}
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pt-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: profile.display_name || "Add your name"
							}),
							profile.category ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: profile.category
							}) : null,
							profile.bio ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bio, { text: profile.bio }) : null,
							(profile.location || profile.website) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 text-xs",
								children: [profile.location ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-1 text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
										className: "h-3.5 w-3.5",
										strokeWidth: 1.8
									}), profile.location]
								}) : null, profile.website ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: profile.website.startsWith("http") ? profile.website : `https://${profile.website}`,
									target: "_blank",
									rel: "noopener noreferrer",
									className: "flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, {
										className: "h-3.5 w-3.5",
										strokeWidth: 1.8
									}), profile.website.replace(/^https?:\/\//, "")]
								}) : null]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2 pt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							className: "h-10 rounded-full",
							onClick: () => setEditOpen(true),
							children: "Edit profile"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							className: "h-10 rounded-full",
							onClick: async () => {
								const url = `${window.location.origin}/profile`;
								try {
									if (navigator.share) await navigator.share({
										title: profile.username,
										url
									});
									else {
										await navigator.clipboard.writeText(url);
										toast.success("Profile link copied");
									}
								} catch {}
							},
							children: "Share profile"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Highlights, {
				userId,
				posts
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
				defaultValue: "grid",
				className: "pt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
						className: "grid w-full grid-cols-3 rounded-none border-y border-border bg-transparent p-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "grid",
								className: "rounded-none py-3",
								"aria-label": "Posts",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Grid3x3, { className: "h-5 w-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "reels",
								className: "rounded-none py-3",
								"aria-label": "Reels",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "h-5 w-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "saved",
								className: "rounded-none py-3",
								"aria-label": "Saved",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { className: "h-5 w-5" })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "grid",
						className: "mt-0",
						children: grid.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaGrid, {
							onSelect: openManage,
							items: sortPinned(grid).map((p) => ({
								src: src(p.media_url),
								type: p.media_type,
								post: p
							}))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { text: loading ? "Loading your posts…" : "No posts yet. Create your first one." })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "reels",
						className: "mt-0",
						children: reels.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaGrid, {
							onSelect: openManage,
							items: sortPinned(reels).map((p) => ({
								src: src(p.media_url),
								type: p.media_type,
								post: p
							}))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { text: loading ? "Loading reels…" : "No reels yet." })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "saved",
						className: "mt-0",
						children: savedPosts.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaGrid, { items: savedPosts.map((p) => ({
							src: src(p.media_url),
							type: p.media_type
						})) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { text: "Nothing saved yet. Tap the bookmark on a post to keep it here." })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: !!manage && !editing,
				onOpenChange: (o) => !o && setManage(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
					side: "bottom",
					className: "rounded-t-3xl border-border px-0 pb-6 pt-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/40" }), manage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-h-[70vh] overflow-y-auto",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "h-5 w-5" }),
								label: "Hide like count to others",
								sub: "Only you will see the total number of likes.",
								toggle: !!manage.hide_like_count,
								onToggle: (v) => patchManaged({ hide_like_count: v }, v ? "Like count hidden" : "Like count visible")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-5 w-5" }),
								label: "Hide share count",
								sub: "Others won't see how many times this was shared.",
								toggle: !!manage.hide_share_count,
								onToggle: (v) => patchManaged({ hide_share_count: v }, v ? "Share count hidden" : "Share count visible")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircleOff, { className: "h-5 w-5" }),
								label: "Turn off commenting",
								sub: "No one can comment on this post.",
								toggle: !!manage.comments_off,
								onToggle: (v) => patchManaged({ comments_off: v }, v ? "Commenting turned off" : "Commenting turned on")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: manage.pinned ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PinOff, { className: "h-5 w-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: "h-5 w-5" }),
								label: manage.pinned ? "Unpin from your grid" : "Pin to your main grid",
								onClick: () => patchManaged({ pinned: !manage.pinned }, manage.pinned ? "Unpinned" : "Pinned to your grid")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-5 w-5" }),
								label: "Edit",
								onClick: () => startEdit(manage)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "h-5 w-5" }),
								label: "Copy link",
								onClick: async () => {
									try {
										await navigator.clipboard.writeText(`${window.location.origin}/?post=${manage.id}`);
										toast.success("Link copied");
									} catch {
										toast.error("Couldn't copy link");
									}
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Archive, { className: "h-5 w-5" }),
								label: manage.archived ? "Unarchive" : "Archive",
								onClick: () => patchManaged({ archived: !manage.archived }, manage.archived ? "Unarchived" : "Archived")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-5 w-5" }),
								label: "Delete",
								destructive: true,
								onClick: () => setConfirmDelete(true)
							})
						]
					}) : null]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!manage && editing,
				onOpenChange: (o) => !o && setEditing(false),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-md gap-0 overflow-hidden p-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, {
						className: "grid grid-cols-[auto_1fr_auto] items-center border-b border-border px-4 py-3 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "sm",
								className: "h-8 px-2",
								onClick: () => setEditing(false),
								children: "Cancel"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
								className: "text-sm font-semibold",
								children: ["Edit ", manage?.kind === "reel" ? "reel" : "post"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								className: "h-8 rounded-full px-4",
								disabled: busy,
								onClick: async () => {
									if (!manage) return;
									setBusy(true);
									try {
										await updateMyPost(manage.id, {
											caption,
											location: location.trim() || null
										});
										toast.success("Updated");
										setEditing(false);
										setManage(null);
										await reload();
									} catch (e) {
										toast.error(e instanceof Error ? e.message : "Couldn't update");
									} finally {
										setBusy(false);
									}
								},
								children: busy ? "Saving…" : "Done"
							})
						]
					}), manage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-h-[75vh] overflow-y-auto",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "relative bg-secondary",
							children: manage.media_type?.startsWith("video") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
								src: src(manage.media_url),
								controls: true,
								playsInline: true,
								className: "max-h-64 w-full object-contain"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: src(manage.media_url),
								alt: "",
								className: "max-h-64 w-full object-contain"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1 px-4 py-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-3 py-1.5",
									children: [avatarSrc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: avatarSrc,
										alt: "",
										className: "h-9 w-9 rounded-full object-cover"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(YwAvatar, {
										user: avatarUser,
										size: 36
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "pb-1 text-sm font-semibold",
												children: ["@", profile.username || "you"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
												value: caption,
												onChange: (e) => setCaption(e.target.value.slice(0, 2200)),
												placeholder: "Write a caption…",
												rows: 4,
												className: "resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "pt-1 text-right text-[11px] text-muted-foreground",
												children: [caption.length, "/2,200"]
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 border-t border-border py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
										className: "h-5 w-5 shrink-0 text-muted-foreground",
										strokeWidth: 1.8
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: location,
										onChange: (e) => setLocation(e.target.value),
										placeholder: "Add location",
										className: "w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between border-t border-border py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm",
										children: "Hide like count to others"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: "Only you will see total likes."
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
										checked: !!manage.hide_like_count,
										onCheckedChange: (v) => patchManaged({ hide_like_count: v }, v ? "Like count hidden" : "Like count visible")
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between border-t border-border py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm",
										children: "Turn off commenting"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: "No one can comment on this post."
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
										checked: !!manage.comments_off,
										onCheckedChange: (v) => patchManaged({ comments_off: v }, v ? "Commenting turned off" : "Commenting turned on")
									})]
								})
							]
						})]
					}) : null]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: confirmDelete,
				onOpenChange: setConfirmDelete,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogTitle, { children: [
					"Delete this ",
					manage?.kind === "reel" ? "reel" : "post",
					"?"
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "This permanently removes it and its media. This can't be undone." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Cancel" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					onClick: async () => {
						if (!manage) return;
						try {
							await deleteMyPost(manage);
							toast.success("Deleted");
							setManage(null);
							await reload();
						} catch (e) {
							toast.error(e instanceof Error ? e.message : "Couldn't delete");
						}
					},
					children: "Delete"
				})] })] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditProfileSheet, {
				open: editOpen,
				onOpenChange: setEditOpen,
				user: avatarUser,
				value: editValue,
				onSave: save
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FollowListDialog, {
				open: listOpen,
				onOpenChange: setListOpen,
				userId,
				tab: listTab,
				onTabChange: setListTab
			})
		]
	});
}
function OptionRow({ icon, label, sub, toggle, onToggle, onClick, destructive }) {
	const content = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex w-full items-center gap-3 px-5 py-3.5 text-left",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: destructive ? "text-destructive" : "text-foreground",
				children: icon
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `block text-sm font-medium ${destructive ? "text-destructive" : "text-foreground"}`,
					children: label
				}), sub ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-xs text-muted-foreground",
					children: sub
				}) : null]
			}),
			onToggle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
				checked: !!toggle,
				onCheckedChange: onToggle,
				onClick: (e) => e.stopPropagation()
			}) : null
		]
	});
	if (onToggle) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "w-full",
		children: content
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: "w-full transition-colors active:bg-secondary",
		children: content
	});
}
function Empty({ text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "px-4 py-10 text-center text-sm text-muted-foreground",
		children: text
	});
}
function Stat({ label, value, onClick }) {
	const body = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
		className: "font-display text-lg font-bold",
		children: value
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
		className: "text-xs text-muted-foreground",
		children: label
	})] });
	if (!onClick) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: body });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: "rounded-xl py-0.5 transition-transform active:scale-95",
		children: body
	});
}
function MediaGrid({ items, onSelect }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "grid grid-cols-3 gap-0.5",
		children: items.map((it, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "relative aspect-square overflow-hidden bg-secondary",
			children: [
				it.type?.startsWith("video") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
					src: it.src,
					muted: true,
					playsInline: true,
					preload: "metadata",
					className: "h-full w-full object-cover"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: it.src,
					alt: "",
					loading: "lazy",
					className: "h-full w-full object-cover"
				}),
				it.type?.startsWith("video") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "absolute left-1.5 top-1.5 h-4 w-4 fill-current text-white drop-shadow" }) : null,
				it.post?.pinned ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: "absolute bottom-1.5 left-1.5 h-4 w-4 fill-current text-white drop-shadow" }) : null,
				it.post && onSelect ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Open post",
					onClick: () => onSelect(it.post),
					className: "absolute inset-0"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Edit or delete",
					onClick: (e) => {
						e.stopPropagation();
						onSelect(it.post);
					},
					className: "absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-background/70 backdrop-blur transition-transform active:scale-90",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, {
						className: "h-4 w-4",
						strokeWidth: 2
					})
				})] }) : null
			]
		}, `${it.src}-${i}`))
	});
}
//#endregion
export { ProfilePage as component };
