import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime, a as Overlay2, c as Title2, i as Description2, n as Cancel, o as Portal2, r as Content2, s as Root2, t as Action } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { At as Link2, C as Trash2, Ct as MapPin, Ft as ImagePlus, H as Settings, Rt as Heart, W as Send, Yt as Ellipsis, _n as Check, b as Trophy, bn as Camera, bt as MessageCircleOff, c as Volume2, ct as Pause, et as Plus, hn as ChevronLeft, i as X, it as PinOff, jn as Archive, mn as ChevronRight, rt as Pin, s as VolumeX, st as Pencil, tt as Play } from "../_libs/lucide-react.mjs";
import { D as useFollowCounts, F as resolveMediaUrl, _t as STORAGE_BUCKETS, gt as cn, v as useMoments, vt as uploadSourceWithProgress } from "./router-DSPbIB2C.mjs";
import { a as deleteSportsVerificationEvidence, c as saveSportsVerificationDetails, d as uploadSportsIntroduction, f as uploadSportsVerificationEvidence, i as deleteSportsIntroduction, l as updateMyPost, m as useResolvedMedia, n as deleteMyPost, o as getSportsVerificationDetails, p as useMyProfile, r as deleteSportsDocument, s as listSportsDocuments, t as createSportsDocumentSignedUrl, u as uploadSportsDocument } from "./profile-data-DYAZp4F3.mjs";
import { t as YwAvatar } from "./Avatar-BmKMpbQ9.mjs";
import { a as SheetTitle, i as SheetHeader, n as SheetContent, r as SheetDescription, t as Sheet } from "./sheet-xVnlJ_yC.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, t as Dialog } from "./dialog-CZ1_F9-X.mjs";
import { n as buttonVariants, t as Button } from "./button-CoK01aFA.mjs";
import { t as Input } from "./input-DEjJP4kV.mjs";
import { t as Textarea } from "./textarea-DzTTW2g-.mjs";
import { a as serializeSportsProfileBio, i as getSportsProfile, n as SportsProfileBadge, o as toSportsProfileDraft, r as SportsProfileCard, t as SportsDetailsPanel } from "./SportsProfile-BLQg8ciW.mjs";
import { t as VideoPoster } from "./VideoPoster-BFapwIdR.mjs";
import { t as UserWatermark } from "./UserWatermark-Cj3id9i0.mjs";
import { t as compressImageFile } from "./image-compress-CFm7ihuA.mjs";
import { t as Switch } from "./switch-CK1XGwZB.mjs";
import { t as formatCount } from "./yw-data-CyapVFm6.mjs";
import { a as TabsTrigger, i as TabsList, n as Tabs, r as TabsContent, t as FollowListDialog } from "./FollowListDialog-D198NnA2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-BEQWCCwM.js
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
	"Business",
	"Gamer",
	"Artist",
	"Musician",
	"Photographer"
];
var BIO_MAX = 300;
function EditProfileSheet({ open, onOpenChange, user, value, onSave, sportsProfile, onOpenSportsDetails }) {
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
							sportsProfile && onOpenSportsDetails ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsProfileCard, {
								profile: sportsProfile,
								onClick: onOpenSportsDetails
							}) : null
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
	const { moments, archive } = useMoments();
	const [highlights, setHighlights] = (0, import_react.useState)([]);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [step, setStep] = (0, import_react.useState)(0);
	const [selected, setSelected] = (0, import_react.useState)(/* @__PURE__ */ new Map());
	const [title, setTitle] = (0, import_react.useState)("");
	const [cover, setCover] = (0, import_react.useState)(null);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [viewer, setViewer] = (0, import_react.useState)(null);
	const coverInput = (0, import_react.useRef)(null);
	const loadHighlights = (0, import_react.useCallback)(async (ownerId) => {
		const { data, error } = await supabase.from("highlights").select("*").eq("user_id", ownerId).order("created_at", { ascending: true });
		if (error) {
			console.error("[highlights] load failed", {
				ownerId,
				code: error.code,
				message: error.message,
				details: error.details,
				hint: error.hint
			});
			throw error;
		}
		const next = data ?? [];
		setHighlights(next);
		return next;
	}, []);
	(0, import_react.useEffect)(() => {
		if (!userId) return;
		let cancelled = false;
		loadHighlights(userId).catch((error) => {
			if (cancelled) return;
			console.error("[highlights] initial load failed", error);
		});
		return () => {
			cancelled = true;
		};
	}, [loadHighlights, userId]);
	const storyItems = (0, import_react.useMemo)(() => [...moments, ...archive].filter((m) => m.mine).map((m) => ({
		source: "story",
		refId: m.id,
		thumb: m.media ?? "",
		media: m.media,
		mediaType: m.kind === "video" ? "video" : "image"
	})), [moments, archive]);
	const topReels = (0, import_react.useMemo)(() => [...posts].filter((p) => p.kind === "reel").sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).map((p) => ({
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
			const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
			if (sessionError) throw sessionError;
			const sessionUserId = sessionData.session?.user.id;
			if (!sessionUserId) throw new Error("Sign in to save a highlight");
			if (sessionUserId !== userId) throw new Error("You can only save highlights to your own profile");
			const coverSource = cover ?? items[0]?.thumb ?? null;
			let coverUrl = coverSource;
			if (coverSource?.startsWith("data:")) {
				const path = `${sessionUserId}/highlight-${crypto.randomUUID()}.jpg`;
				const upload = await uploadSourceWithProgress(STORAGE_BUCKETS.uploads, path, coverSource, "image/jpeg");
				if (upload.error || !upload.url) {
					console.error("[highlights] custom cover upload failed", {
						bucket: STORAGE_BUCKETS.uploads,
						path,
						error: upload.error
					});
					throw new Error(upload.error ?? "Could not upload the highlight cover");
				}
				coverUrl = upload.url;
			}
			const payload = {
				user_id: sessionUserId,
				title: title.trim(),
				cover_url: coverUrl ?? null,
				items: items.map(({ source, refId, thumb, media, mediaType }) => ({
					source,
					refId,
					thumb,
					media: media ?? null,
					mediaType: mediaType ?? null
				}))
			};
			const { data, error } = await supabase.from("highlights").insert(payload).select("id,user_id,title,cover_url,items,created_at").single();
			if (error) {
				console.error("[highlights] insert failed", {
					userId: sessionUserId,
					itemCount: items.length,
					hasCustomCover: Boolean(cover),
					code: error.code,
					message: error.message,
					details: error.details,
					hint: error.hint
				});
				throw error;
			}
			const saved = data;
			setHighlights((h) => [...h, saved]);
			try {
				await loadHighlights(sessionUserId);
			} catch (refreshError) {
				console.error("[highlights] saved but refresh failed", refreshError);
			}
			toast.success("Highlight added");
			setOpen(false);
			reset();
		} catch (e) {
			console.error("[highlights] save failed", {
				userId,
				itemCount: items.length,
				hasCustomCover: Boolean(cover),
				error: e
			});
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
		className: "mx-auto max-w-3xl px-3 pt-3 sm:px-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "no-scrollbar flex gap-3.5 overflow-x-auto pb-0.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setOpen(true),
					className: "flex w-[64px] shrink-0 flex-col items-center gap-1 transition-transform active:scale-95",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid h-[56px] w-[56px] place-items-center rounded-full border border-white/10 bg-white/[0.045] shadow-[0_6px_18px_-12px_rgba(0,0,0,0.9)] backdrop-blur-md",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
							className: "h-5 w-5 text-muted-foreground",
							strokeWidth: 1.8
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "w-full truncate text-center text-[10px] font-medium text-muted-foreground",
						children: "New"
					})]
				}), highlights.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setViewer(h),
					className: "flex w-[64px] shrink-0 flex-col items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "h-[56px] w-[56px] overflow-hidden rounded-full border border-white/15 bg-white/[0.045] p-[2px] shadow-[0_6px_18px_-12px_rgba(0,0,0,0.9)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block h-full w-full overflow-hidden rounded-full",
							children: h.cover_url ? h.items?.[0]?.mediaType === "video" && !h.cover_url.startsWith("data:") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thumb, {
								src: h.cover_url,
								video: true
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thumb, { src: h.cover_url }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-full w-full place-items-center bg-white/[0.08] text-xs font-semibold text-muted-foreground",
								children: h.title.slice(0, 1).toUpperCase()
							})
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "w-full truncate text-center text-[10px] font-medium text-muted-foreground",
						children: h.title
					})]
				}, h.id))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
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
										children: "Reels"
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
			}),
			viewer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HighlightViewer, {
				highlight: viewer,
				onClose: () => setViewer(null)
			}) : null
		]
	});
}
function HighlightViewer({ highlight, onClose }) {
	const [index, setIndex] = (0, import_react.useState)(0);
	const [progress, setProgress] = (0, import_react.useState)(0);
	const [paused, setPaused] = (0, import_react.useState)(false);
	const [muted, setMuted] = (0, import_react.useState)(true);
	const videoRef = (0, import_react.useRef)(null);
	const current = highlight.items[index];
	(0, import_react.useEffect)(() => {
		setProgress(0);
		setPaused(false);
	}, [index]);
	(0, import_react.useEffect)(() => {
		if (!current || current.mediaType === "video" || paused) return;
		const timer = window.setInterval(() => {
			setProgress((p) => {
				if (p >= 100) {
					if (index >= highlight.items.length - 1) onClose();
					else setIndex((i) => i + 1);
					return 0;
				}
				return p + 2;
			});
		}, 100);
		return () => window.clearInterval(timer);
	}, [
		current,
		paused,
		index,
		highlight.items.length,
		onClose
	]);
	(0, import_react.useEffect)(() => {
		if (!videoRef.current) return;
		if (paused) videoRef.current.pause();
		else videoRef.current.play().catch(() => {});
	}, [paused, index]);
	if (!current) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[9999] flex items-center justify-center bg-black",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative h-full w-full max-w-md overflow-hidden",
			children: [
				highlight.items.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute left-2 right-2 top-3 z-20 h-1 overflow-hidden rounded-full bg-white/30",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full bg-white",
						style: { width: i < index ? "100%" : i === index ? `${progress}%` : "0%" }
					})
				}, i)),
				current.mediaType === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
					ref: videoRef,
					src: current.media ?? current.thumb,
					autoPlay: true,
					muted,
					playsInline: true,
					className: "h-full w-full object-contain",
					onTimeUpdate: (e) => {
						const v = e.currentTarget;
						if (v.duration) setProgress(v.currentTime / v.duration * 100);
					},
					onEnded: () => index >= highlight.items.length - 1 ? onClose() : setIndex((i) => i + 1)
				}, current.refId) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: current.media ?? current.thumb,
					alt: "",
					className: "h-full w-full object-contain"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-x-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-black/75 to-transparent px-3 pb-8 pt-7",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-semibold text-white",
						children: highlight.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setPaused((p) => !p),
								className: "grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur-xl",
								"aria-label": paused ? "Play" : "Pause",
								children: paused ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "h-4 w-4" })
							}),
							current.mediaType === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setMuted((m) => !m),
								className: "grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur-xl",
								"aria-label": "Toggle sound",
								children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "h-4 w-4" })
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: onClose,
								className: "grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur-xl",
								"aria-label": "Close",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Previous clip",
					onClick: () => setIndex((i) => Math.max(0, i - 1)),
					className: "absolute inset-y-0 left-0 z-20 w-2/5"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Next clip",
					onClick: () => index >= highlight.items.length - 1 ? onClose() : setIndex((i) => i + 1),
					className: "absolute inset-y-0 right-0 z-20 w-3/5"
				}),
				paused ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "pointer-events-none absolute bottom-8 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "mr-1 inline h-3 w-3" }), "Paused"]
				}) : null
			]
		})
	});
}
var SPORTS_VERIFICATION_TEST_DELAY_MS = 12e4;
function ProfilePage() {
	const { profile, avatarSrc, coverSrc, grid, reels, posts, savedPosts, loading, mediaLoading, save, userId, reload } = useMyProfile();
	const navigate = useNavigate();
	const [editOpen, setEditOpen] = (0, import_react.useState)(false);
	const counts = useFollowCounts(userId);
	const [listOpen, setListOpen] = (0, import_react.useState)(false);
	const [listTab, setListTab] = (0, import_react.useState)("followers");
	const [manage, setManage] = (0, import_react.useState)(null);
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [title, setTitle] = (0, import_react.useState)("");
	const [caption, setCaption] = (0, import_react.useState)("");
	const [location, setLocation] = (0, import_react.useState)("");
	const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [sportsDetailsOpen, setSportsDetailsOpen] = (0, import_react.useState)(false);
	const [sportsDocuments, setSportsDocuments] = (0, import_react.useState)([]);
	const [sportsDocumentsLoading, setSportsDocumentsLoading] = (0, import_react.useState)(false);
	const [sportsDocumentsError, setSportsDocumentsError] = (0, import_react.useState)(null);
	const [sportsDocumentsUploading, setSportsDocumentsUploading] = (0, import_react.useState)(false);
	const [sportsDocumentToDelete, setSportsDocumentToDelete] = (0, import_react.useState)(null);
	const [sportsDocumentDeleting, setSportsDocumentDeleting] = (0, import_react.useState)(false);
	const [sportsIntroductionUrl, setSportsIntroductionUrl] = (0, import_react.useState)(null);
	const [sportsIntroductionUploading, setSportsIntroductionUploading] = (0, import_react.useState)(false);
	const [sportsIntroductionProgress, setSportsIntroductionProgress] = (0, import_react.useState)(0);
	const [sportsVerificationDetails, setSportsVerificationDetails] = (0, import_react.useState)(null);
	const [sportsVerificationDetailsLoading, setSportsVerificationDetailsLoading] = (0, import_react.useState)(false);
	const [sportsVerificationDetailsSaving, setSportsVerificationDetailsSaving] = (0, import_react.useState)(false);
	const [sportsVerificationEvidenceUploading, setSportsVerificationEvidenceUploading] = (0, import_react.useState)(null);
	const [sportsVerificationSubmitting, setSportsVerificationSubmitting] = (0, import_react.useState)(false);
	const sportsVerificationTimer = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		return () => {
			if (sportsVerificationTimer.current !== null) {
				window.clearTimeout(sportsVerificationTimer.current);
				sportsVerificationTimer.current = null;
			}
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!userId || userId !== profile.id || !profile.verification_requested || profile.is_verified || sportsVerificationTimer.current !== null) return;
		sportsVerificationTimer.current = window.setTimeout(async () => {
			sportsVerificationTimer.current = null;
			try {
				await save({
					name: profile.display_name,
					username: profile.username,
					category: profile.category,
					bio: profile.bio,
					location: profile.location,
					website: profile.website,
					avatarUrl: profile.avatar_url ?? void 0,
					isVerified: true,
					verificationRequested: false
				});
				toast.success("Sports Profile Verified Successfully");
			} catch (error) {
				toast.error(error instanceof Error ? error.message : "Sports Profile verification could not be completed.");
			}
		}, SPORTS_VERIFICATION_TEST_DELAY_MS);
		return () => {
			if (sportsVerificationTimer.current !== null) {
				window.clearTimeout(sportsVerificationTimer.current);
				sportsVerificationTimer.current = null;
			}
		};
	}, [
		profile,
		save,
		userId
	]);
	const openManage = (post) => {
		setManage(post);
		setEditing(false);
		setTitle(post.title ?? "");
		setCaption(post.caption ?? "");
		setLocation(post.location ?? "");
	};
	const startEdit = (post) => {
		setTitle(post.title ?? "");
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
	const openViewer = (post) => {
		const id = typeof post?.id === "string" ? post.id.trim() : "";
		if (!id) {
			toast.error("This media is unavailable.");
			return;
		}
		if (post.kind === "reel") {
			navigate({
				to: "/reels",
				search: {
					reelId: void 0,
					userId: post.user_id,
					initialVideoId: id,
					returnTo: "profile"
				}
			});
			return;
		}
		navigate({
			to: "/reels",
			search: {
				reelId: void 0,
				userId: post.user_id,
				initialVideoId: id,
				returnTo: "profile"
			}
		});
	};
	const reelMedia = useResolvedMedia([...posts, ...savedPosts].filter((p) => p.kind === "reel").map((p) => p.media_url), "reels");
	const videoMedia = useResolvedMedia([...posts, ...savedPosts].filter((p) => p.kind === "video").map((p) => p.media_url), "videos");
	const src = (u) => reelMedia[u] ?? videoMedia[u] ?? u;
	const avatarUser = {
		id: userId ?? "me",
		username: profile.username || "you",
		name: profile.display_name || profile.username || "You",
		hue: 280
	};
	const sportsProfile = getSportsProfile({
		...profile,
		username: profile.username,
		displayName: profile.display_name
	});
	const hasSportsProfile = Boolean(sportsProfile);
	const isVerifiedSports = Boolean(sportsProfile?.verified);
	const sportsNameBadge = isVerifiedSports && sportsProfile ? sportsProfile.role === "Coach" ? "VERIFIED COACH" : sportsProfile.status !== "Not recorded" ? `${sportsProfile.status.toUpperCase()} PLAYER` : "VERIFIED PLAYER" : null;
	(0, import_react.useEffect)(() => {
		if (!sportsDetailsOpen || !hasSportsProfile || !userId || userId !== profile.id) {
			setSportsDocuments([]);
			setSportsDocumentsError(null);
			setSportsDocumentsLoading(false);
			return;
		}
		let cancelled = false;
		setSportsDocumentsLoading(true);
		setSportsDocumentsError(null);
		listSportsDocuments(userId).then((documents) => {
			if (!cancelled) setSportsDocuments(documents);
		}).catch((error) => {
			if (!cancelled) {
				setSportsDocuments([]);
				setSportsDocumentsError(error instanceof Error ? error.message : "Documents are unavailable.");
			}
		}).finally(() => {
			if (!cancelled) setSportsDocumentsLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, [
		hasSportsProfile,
		profile.id,
		sportsDetailsOpen,
		userId
	]);
	(0, import_react.useEffect)(() => {
		const path = sportsProfile?.sportsIntroductionPath;
		if (!sportsDetailsOpen || !path) {
			setSportsIntroductionUrl(null);
			return;
		}
		let cancelled = false;
		resolveMediaUrl(path, STORAGE_BUCKETS.videos).then((url) => {
			if (!cancelled) setSportsIntroductionUrl(url);
		});
		return () => {
			cancelled = true;
		};
	}, [sportsDetailsOpen, sportsProfile?.sportsIntroductionPath]);
	(0, import_react.useEffect)(() => {
		if (!sportsDetailsOpen || !userId || userId !== profile.id || !hasSportsProfile) {
			setSportsVerificationDetails(null);
			setSportsVerificationDetailsLoading(false);
			return;
		}
		let cancelled = false;
		setSportsVerificationDetailsLoading(true);
		getSportsVerificationDetails(userId).then((details) => {
			if (!cancelled) setSportsVerificationDetails(details);
		}).catch((error) => {
			if (!cancelled) {
				setSportsVerificationDetails(null);
				toast.error(error instanceof Error ? error.message : "Verification details are unavailable.");
			}
		}).finally(() => {
			if (!cancelled) setSportsVerificationDetailsLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, [
		profile.bio,
		profile.category,
		profile.id,
		sportsDetailsOpen,
		hasSportsProfile,
		userId
	]);
	const openSportsDocument = async (document, download) => {
		if (!userId || userId !== profile.id) return;
		try {
			const url = await createSportsDocumentSignedUrl(userId, document.path);
			const anchor = window.document.createElement("a");
			anchor.href = url;
			anchor.rel = "noopener noreferrer";
			if (download) anchor.download = document.name;
			else anchor.target = "_blank";
			anchor.click();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "This document is unavailable.");
		}
	};
	const handleSportsDocumentUpload = async (file) => {
		if (!userId || userId !== profile.id) return;
		setSportsDocumentsUploading(true);
		try {
			const document = await uploadSportsDocument(userId, file);
			setSportsDocuments((current) => [document, ...current]);
			toast.success("Document uploaded securely");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Couldn't upload this document.");
		} finally {
			setSportsDocumentsUploading(false);
		}
	};
	const handleSportsDocumentDelete = async () => {
		if (!sportsDocumentToDelete || !userId || userId !== profile.id) return;
		const document = sportsDocumentToDelete;
		setSportsDocumentDeleting(true);
		try {
			await deleteSportsDocument(userId, document.path);
			setSportsDocuments((current) => current.filter((item) => item.path !== document.path));
			setSportsDocumentToDelete(null);
			toast.success("Document deleted");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Couldn't delete this document.");
		} finally {
			setSportsDocumentDeleting(false);
		}
	};
	const handleSportsIntroductionUpload = async (file) => {
		if (!userId || userId !== profile.id || !sportsProfile) return;
		const previousPath = sportsProfile.sportsIntroductionPath;
		setSportsIntroductionUploading(true);
		setSportsIntroductionProgress(0);
		try {
			const nextPath = await uploadSportsIntroduction(userId, file, (progress) => setSportsIntroductionProgress(progress));
			const draft = toSportsProfileDraft(sportsProfile);
			draft.sportsIntroductionPath = nextPath;
			await saveSportsDetails(draft);
			if (previousPath && previousPath !== nextPath) await deleteSportsIntroduction(userId, previousPath);
			toast.success(previousPath ? "Sports Introduction replaced" : "Sports Introduction uploaded");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Couldn't upload this video.");
		} finally {
			setSportsIntroductionUploading(false);
		}
	};
	const handleSportsIntroductionDelete = async () => {
		if (!userId || userId !== profile.id || !sportsProfile?.sportsIntroductionPath) return;
		const path = sportsProfile.sportsIntroductionPath;
		setSportsIntroductionUploading(true);
		try {
			await deleteSportsIntroduction(userId, path);
			const draft = toSportsProfileDraft(sportsProfile);
			draft.sportsIntroductionPath = "";
			await saveSportsDetails(draft);
			toast.success("Sports Introduction deleted");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Couldn't delete this video.");
		} finally {
			setSportsIntroductionUploading(false);
		}
	};
	const handleSaveSportsVerificationDetails = async (details) => {
		if (!userId || userId !== profile.id) return;
		setSportsVerificationDetailsSaving(true);
		try {
			const savedDetails = await saveSportsVerificationDetails(userId, details);
			setSportsVerificationDetails(savedDetails);
			toast.success("Verification details saved");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Couldn't save verification details.");
		} finally {
			setSportsVerificationDetailsSaving(false);
		}
	};
	const handleSportsVerificationEvidenceUpload = async (kind, file) => {
		if (!userId || userId !== profile.id) return;
		setSportsVerificationEvidenceUploading(kind);
		try {
			const currentDetails = sportsVerificationDetails ?? await getSportsVerificationDetails(userId);
			const previousEvidence = currentDetails[kind];
			const uploaded = await uploadSportsVerificationEvidence(userId, kind, file);
			const nextDetails = {
				...currentDetails,
				[kind]: uploaded
			};
			const savedDetails = await saveSportsVerificationDetails(userId, nextDetails);
			setSportsVerificationDetails(savedDetails);
			if (previousEvidence?.path && previousEvidence.path !== uploaded.path) await deleteSportsVerificationEvidence(userId, previousEvidence.path);
			toast.success("Private verification evidence uploaded");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Couldn't upload verification evidence.");
		} finally {
			setSportsVerificationEvidenceUploading(null);
		}
	};
	const editValue = {
		name: profile.display_name,
		username: profile.username,
		category: profile.category,
		bio: profile.bio,
		location: profile.location,
		website: profile.website,
		avatarUrl: avatarSrc ?? void 0,
		verificationRequested: profile.verification_requested
	};
	const saveSportsDetails = async (draft) => {
		if (!sportsProfile) return;
		await save({
			...editValue,
			username: draft.username.trim() || profile.username,
			category: `${draft.role}${draft.sport.trim() ? ` · ${draft.sport.trim()}` : ""}`,
			bio: serializeSportsProfileBio(profile.bio, draft)
		});
		toast.success("Sports details saved");
	};
	const handleSubmitSportsVerification = async () => {
		if (!userId || userId !== profile.id || profile.verification_requested || profile.is_verified) return;
		setSportsVerificationSubmitting(true);
		try {
			await save({
				...editValue,
				verificationRequested: true
			});
			toast.success("Verification request submitted");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Couldn't submit for verification.");
		} finally {
			setSportsVerificationSubmitting(false);
		}
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
		className: "relative min-h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_15%_0%,rgba(214,93,177,0.11),transparent_32%),radial-gradient(circle_at_92%_18%,rgba(115,93,214,0.10),transparent_30%)] pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserWatermark, { username: profile.username }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "header-lux sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-3 sm:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[9px] font-semibold uppercase tracking-[0.3em] text-amber-200/70",
						children: "YourWorld"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						"data-testid": "text-profile-username",
						className: "mt-0.5 truncate font-display text-[15px] font-bold tracking-tight",
						children: ["@", profile.username || "…"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					"data-testid": "link-profile-settings",
					to: "/settings",
					"aria-label": "Settings",
					className: "action-btn grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "h-[18px] w-[18px]" })
				})]
			}),
			coverSrc ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative h-28 overflow-hidden sm:h-36",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: coverSrc,
						alt: "",
						className: "h-full w-full scale-105 object-cover opacity-60"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-b from-black/10 via-background/25 to-background" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute bottom-3 left-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/70 backdrop-blur-md sm:left-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-amber-300" }), "Athlete profile"]
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative h-20 overflow-hidden bg-[radial-gradient(circle_at_85%_10%,rgba(216,180,91,0.22),transparent_32%),linear-gradient(135deg,rgba(210,56,151,0.16),transparent_55%)] sm:h-24",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-x-3 bottom-4 h-px bg-gradient-to-r from-transparent via-amber-200/40 to-transparent sm:inset-x-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "relative mx-auto -mt-9 max-w-3xl px-3 sm:-mt-11 sm:px-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-[1.5rem] border border-white/[0.13] bg-[linear-gradient(145deg,rgba(33,25,39,0.95),rgba(10,12,18,0.97)_58%,rgba(20,15,30,0.97))] p-3 shadow-[0_24px_70px_-30px_rgba(0,0,0,0.98),0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur-xl sm:rounded-[1.75rem] sm:p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 sm:gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-[76px] w-[76px] shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#f4d58d,#d987c4_48%,#8647d2)] p-[3px] shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_12px_34px_-12px_rgba(231,135,196,0.8)] sm:h-[92px] sm:w-[92px]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-full w-full place-items-center rounded-full bg-[#0c0d12] p-[3px]",
									children: avatarSrc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										"data-testid": "img-profile-avatar",
										src: avatarSrc,
										alt: "",
										className: "h-full w-full rounded-full object-cover"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(YwAvatar, {
										user: avatarUser,
										size: 84
									})
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1 pt-0.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-x-2 gap-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										"data-testid": "text-profile-display-name",
										className: "font-display text-[17px] font-bold tracking-tight sm:text-xl",
										children: profile.display_name || "Add your name"
									}), sportsNameBadge ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsProfileBadge, {
										badge: sportsNameBadge,
										verified: true
									}) : null]
								}), isVerifiedSports && sportsProfile ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-amber-100/80",
									children: [
										sportsProfile.sport,
										" · ",
										sportsProfile.role
									]
								}) : profile.category ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
									children: profile.category
								}) : null]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							"data-testid": "stats-profile",
							className: "mt-3 grid grid-cols-3 divide-x divide-white/10 rounded-xl border border-white/10 bg-black/25 py-2 shadow-inner shadow-white/[0.02]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Posts",
									value: mediaLoading ? "—" : formatCount(posts.length)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Followers",
									value: counts.followers === null ? "—" : formatCount(counts.followers),
									onClick: () => {
										setListTab("followers");
										setListOpen(true);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Following",
									value: counts.following === null ? "—" : formatCount(counts.following),
									onClick: () => {
										setListTab("following");
										setListOpen(true);
									}
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pt-3.5",
							children: [profile.bio ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bio, { text: isVerifiedSports ? sportsProfile?.publicDetails || profile.bio : profile.bio }) : null, profile.location || profile.website ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 text-xs",
								children: [profile.location ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-1.5 text-zinc-400",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
										className: "h-3.5 w-3.5 text-amber-200/80",
										strokeWidth: 1.8
									}), profile.location]
								}) : null, profile.website ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: profile.website.startsWith("http") ? profile.website : `https://${profile.website}`,
									target: "_blank",
									rel: "noopener noreferrer",
									className: "flex items-center gap-1.5 font-medium text-fuchsia-200 underline-offset-2 hover:underline",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, {
										className: "h-3.5 w-3.5",
										strokeWidth: 1.8
									}), profile.website.replace(/^https?:\/\//, "")]
								}) : null]
							}) : null]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-2 pt-3.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								"data-testid": "button-edit-profile",
								variant: "secondary",
								className: "h-9 rounded-lg border-0 bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3 text-xs font-semibold text-white shadow-[0_8px_20px_-10px_rgba(217,70,239,0.9)] hover:from-fuchsia-400 hover:to-violet-400",
								onClick: () => setEditOpen(true),
								children: "Edit profile"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								"data-testid": "button-share-profile",
								variant: "secondary",
								className: "h-9 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-xs font-semibold hover:bg-white/[0.12]",
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
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Highlights, {
				userId,
				posts: posts.map((post) => ({
					...post,
					media_url: src(post.media_url)
				}))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
				defaultValue: "videos",
				className: "mx-auto w-full max-w-3xl pt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
						className: "mx-3 grid w-auto grid-cols-3 rounded-xl border border-white/10 bg-black/20 p-1 backdrop-blur-xl sm:mx-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "videos",
								className: "rounded-lg py-2 text-[11px] data-[state=active]:bg-white/[0.09] data-[state=active]:text-white",
								"aria-label": "Videos",
								children: "Videos"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "reels",
								className: "rounded-lg py-2 text-[11px] data-[state=active]:bg-white/[0.09] data-[state=active]:text-white",
								"aria-label": "Reels",
								children: "Reels"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "saved",
								className: "rounded-lg py-2 text-[11px] data-[state=active]:bg-white/[0.09] data-[state=active]:text-white",
								"aria-label": "Saved",
								children: "Saved"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "videos",
						className: "mt-0",
						children: grid.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaGrid, {
							onOpen: openViewer,
							onManage: openManage,
							items: sortPinned(grid).map((p) => ({
								src: src(p.media_url),
								type: p.kind === "video" ? "video" : p.media_type,
								post: p,
								ratio: mediaAspect(p)
							}))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { text: mediaLoading ? "Loading your posts…" : "No posts yet. Create your first one." })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "reels",
						className: "mt-0",
						children: reels.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaGrid, {
							onOpen: openViewer,
							onManage: openManage,
							items: sortPinned(reels).map((p) => ({
								src: src(p.media_url),
								type: "video",
								post: p,
								ratio: mediaAspect(p)
							}))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { text: mediaLoading ? "Loading reels…" : "No reels yet." })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "saved",
						className: "mt-0",
						children: savedPosts.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaGrid, {
							onOpen: openViewer,
							items: savedPosts.map((p) => ({
								src: src(p.media_url),
								type: "video",
								post: p,
								ratio: mediaAspect(p)
							}))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { text: "Nothing saved yet. Tap the bookmark on a post to keep it here." })
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
			sportsProfile ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: sportsDetailsOpen,
				onOpenChange: setSportsDetailsOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
					side: "bottom",
					className: "max-h-[90vh] overflow-y-auto rounded-t-[2rem] border-amber-200/20 bg-[#0b0c12] px-4 pb-8 pt-5 text-white sm:mx-auto sm:max-w-xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, {
						className: "mb-5 pr-8 text-left",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-11 w-11 place-items-center rounded-2xl border border-amber-200/25 bg-amber-300/10 text-amber-200",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { className: "h-5 w-5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, {
								className: "text-left text-xl text-white",
								children: "Sports Details"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetDescription, {
								className: "text-left text-zinc-400",
								children: "Public sports identity and verified profile information."
							})] })]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SportsDetailsPanel, {
						profile: sportsProfile,
						isOwner: Boolean(userId && userId === profile.id),
						documents: sportsDocuments,
						documentsLoading: sportsDocumentsLoading,
						documentsError: sportsDocumentsError,
						documentsUploading: sportsDocumentsUploading,
						onUploadDocument: handleSportsDocumentUpload,
						onDocumentAction: openSportsDocument,
						onDeleteDocument: setSportsDocumentToDelete,
						onSave: saveSportsDetails,
						sportsIntroductionUrl,
						sportsIntroductionUploading,
						sportsIntroductionProgress,
						onUploadSportsIntroduction: handleSportsIntroductionUpload,
						onDeleteSportsIntroduction: handleSportsIntroductionDelete,
						verificationDetails: sportsVerificationDetails,
						verificationDetailsLoading: sportsVerificationDetailsLoading,
						verificationDetailsSaving: sportsVerificationDetailsSaving,
						onSaveVerificationDetails: handleSaveSportsVerificationDetails,
						onUploadVerificationEvidence: handleSportsVerificationEvidenceUpload,
						verificationEvidenceUploading: sportsVerificationEvidenceUploading,
						onSubmitVerification: handleSubmitSportsVerification,
						onOpenVerificationReview: () => {
							setSportsDetailsOpen(false);
							navigate({ to: "/admin/sports-verification" });
						},
						verificationSubmitting: sportsVerificationSubmitting
					})]
				})
			}) : null,
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
											title,
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
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												"data-testid": "input-edit-post-title",
												value: title,
												onChange: (e) => setTitle(e.target.value.slice(0, 180)),
												placeholder: "Add a title",
												className: "mb-2 w-full border-b border-border/60 bg-transparent pb-2 text-sm font-semibold outline-none placeholder:text-muted-foreground"
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: Boolean(sportsDocumentToDelete),
				onOpenChange: (open) => {
					if (!open && !sportsDocumentDeleting) setSportsDocumentToDelete(null);
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "Delete this document?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogDescription, { children: [
					"This permanently removes ",
					sportsDocumentToDelete?.name.split("/").at(-1) || "this document",
					"from your private sports documents. This can't be undone."
				] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, {
					disabled: sportsDocumentDeleting,
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					disabled: sportsDocumentDeleting,
					onClick: (event) => {
						event.preventDefault();
						handleSportsDocumentDelete();
					},
					children: sportsDocumentDeleting ? "Deleting…" : "Delete"
				})] })] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditProfileSheet, {
				open: editOpen,
				onOpenChange: setEditOpen,
				user: avatarUser,
				value: editValue,
				onSave: save,
				sportsProfile,
				onOpenSportsDetails: () => {
					setEditOpen(false);
					setSportsDetailsOpen(true);
				}
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
		"data-testid": "status-profile-empty",
		className: "px-4 py-14 text-center text-sm text-muted-foreground",
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
function MediaGrid({ items, onOpen, onManage }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		"data-testid": "grid-profile-media",
		className: "grid grid-cols-3 gap-1.5 bg-transparent px-3 sm:px-4",
		children: items.map((it, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			"data-testid": `card-profile-media-${it.post?.id ?? i}`,
			className: "media-frame relative overflow-hidden rounded-lg bg-secondary",
			style: { aspectRatio: it.ratio ?? 1 },
			children: [
				it.post?.kind === "video" || it.post?.kind === "reel" || it.type?.startsWith("video") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoPoster, {
					mediaUrl: it.src,
					thumbnailUrl: it.post?.thumbnail_url,
					alt: "",
					className: "h-full w-full object-cover"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: it.src,
					alt: "",
					loading: "lazy",
					className: "h-full w-full object-cover"
				}),
				it.post?.kind === "reel" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "h-3 w-3 fill-current" }), formatCount(it.post.views_count ?? it.post.views ?? 0)]
				}) : it.post?.kind === "video" || it.type?.startsWith("video") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "h-3.5 w-3.5 fill-current" })
				}) : null,
				it.post?.pinned ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: "absolute bottom-1.5 left-1.5 h-4 w-4 fill-current text-white drop-shadow" }) : null,
				it.post?.kind !== "reel" && it.post?.views != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "absolute bottom-1.5 right-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm",
					children: [formatCount(it.post.views), " views"]
				}) : null,
				it.post?.duration_seconds != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute right-1.5 top-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white",
					children: formatDuration(it.post.duration_seconds)
				}) : null,
				it.post && onOpen && (it.post.kind === "reel" || it.post.kind === "video" || it.type?.startsWith("video")) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": `Open ${it.post.kind === "reel" ? "reel" : "post"}`,
					"data-testid": `button-open-media-${it.post.id}`,
					onClick: () => {
						const post = it.post;
						if (!post || typeof post.id !== "string" || !post.id.trim()) return;
						onOpen(post);
					},
					className: "absolute inset-0 z-10"
				}), onManage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Manage post",
					"data-testid": `button-manage-media-${it.post.id}`,
					onClick: (e) => {
						e.stopPropagation();
						onManage(it.post);
					},
					className: "absolute right-1.5 top-1.5 z-20 grid h-7 w-7 place-items-center rounded-full bg-background/75 backdrop-blur transition-transform active:scale-90",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, {
						className: "h-4 w-4",
						strokeWidth: 2
					})
				}) : null] }) : null
			]
		}, `${it.post?.id ?? it.src}-${i}`))
	});
}
function mediaAspect(post) {
	const width = post.original_width;
	const height = post.original_height;
	if (width && height && width > 0 && height > 0) return Math.min(1.65, Math.max(.62, width / height));
	return post.kind === "reel" ? .8 : 1;
}
function formatDuration(seconds) {
	const total = Math.max(0, Math.round(seconds));
	if (total >= 3600) return `${Math.floor(total / 3600)}:${String(Math.floor(total % 3600 / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
//#endregion
export { ProfilePage as component };
