import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { Bt as Heart, C as Trash2, Dn as Bookmark, G as Search, Qt as Ellipsis, U as Send, Xt as EyeOff, Yt as Eye, _n as ChevronRight, bn as Check, cn as Clock, dn as Circle, et as Plus, jt as Link2, tn as Download, tt as Play, xt as MessageCircle } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { D as timeAgo, Y as useYw, _ as useMoments, et as cn } from "./router-uAPs3Pmt.mjs";
import { n as useAlertsCount } from "./alerts-count-DzTrAmD5.mjs";
import { a as Label2, c as Root2, d as SubTrigger2, f as Trigger, i as ItemIndicator2, l as Separator2, n as Content2, o as Portal2, r as Item2, s as RadioItem2, t as CheckboxItem2, u as SubContent2 } from "../_libs/@radix-ui/react-dropdown-menu+[...].mjs";
import { t as formatCount } from "./yw-data-CyapVFm6.mjs";
import { n as ShareSheet, t as CommentsSheet } from "./ShareSheet-C6_dViCt.mjs";
import { a as resolveLongVideoUrl, n as formatDuration, o as useLongVideos, r as formatViews } from "./video-data-BBW1zTtE.mjs";
import { i as usePostSaves, n as VideoPoster, r as deletePost, t as TrackedVideoPlayer } from "./VideoPoster-BNZKnK1O.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DIuOFBaA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DropdownMenu = Root2;
var DropdownMenuTrigger = Trigger;
var DropdownMenuSubTrigger = import_react.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SubTrigger2, {
	ref,
	className: cn("flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", inset && "pl-8", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-auto" })]
}));
DropdownMenuSubTrigger.displayName = SubTrigger2.displayName;
var DropdownMenuSubContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubContent2, {
	ref,
	className: cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}));
DropdownMenuSubContent.displayName = SubContent2.displayName;
var DropdownMenuContent = import_react.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	sideOffset,
	className: cn("z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}) }));
DropdownMenuContent.displayName = Content2.displayName;
var DropdownMenuItem = import_react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0", inset && "pl-8", className),
	...props
}));
DropdownMenuItem.displayName = Item2.displayName;
var DropdownMenuCheckboxItem = import_react.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CheckboxItem2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	checked,
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemIndicator2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) })
	}), children]
}));
DropdownMenuCheckboxItem.displayName = CheckboxItem2.displayName;
var DropdownMenuRadioItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RadioItem2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemIndicator2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "h-2 w-2 fill-current" }) })
	}), children]
}));
DropdownMenuRadioItem.displayName = RadioItem2.displayName;
var DropdownMenuLabel = import_react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label2, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
	...props
}));
DropdownMenuLabel.displayName = Label2.displayName;
var DropdownMenuSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator2, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
DropdownMenuSeparator.displayName = Separator2.displayName;
var DropdownMenuShortcut = ({ className, ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("ml-auto text-xs tracking-widest opacity-60", className),
		...props
	});
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";
var stopHandlers = /* @__PURE__ */ new Map();
var activeId = null;
/** Called by a card when it wants to play. Stops whoever is playing now. */
function requestPlayback(id) {
	if (activeId && activeId !== id) stopHandlers.get(activeId)?.();
	activeId = id;
}
/** Called when a card stops on its own (scroll away, ended, unmount). */
function releasePlayback(id) {
	if (activeId === id) activeId = null;
}
/** Register a stop callback for a card. Returns an unsubscribe fn. */
function onStopRequested(id, stop) {
	stopHandlers.set(id, stop);
	return () => {
		stopHandlers.delete(id);
		if (activeId === id) activeId = null;
	};
}
var queue = [];
function setVideoQueue(items) {
	queue = items;
}
/** Next (dir=1) or previous (dir=-1) item matching the given orientation. */
function getAdjacentVideo(currentId, portrait, dir) {
	const matching = queue.filter((item) => item.portrait === portrait);
	if (matching.length === 0) return null;
	const index = matching.findIndex((item) => item.id === currentId);
	if (index === -1) return dir === 1 ? matching[0] : matching[matching.length - 1];
	const next = index + dir;
	if (next < 0 || next >= matching.length) return null;
	return matching[next];
}
/** Warm the browser cache for a media URL so playback starts instantly. */
var warmed = /* @__PURE__ */ new Map();
function warmVideo(url) {
	if (typeof document === "undefined" || !url || warmed.has(url)) return;
	const el = document.createElement("video");
	el.preload = "auto";
	el.muted = true;
	el.playsInline = true;
	el.src = url;
	try {
		el.load();
	} catch {}
	warmed.set(url, el);
	if (warmed.size > 6) {
		const oldest = warmed.keys().next().value;
		if (oldest) {
			const victim = warmed.get(oldest);
			if (victim) {
				victim.removeAttribute("src");
				victim.load();
			}
			warmed.delete(oldest);
		}
	}
}
/** Feed card for long-form videos — supports 16:9 and 9:16 playback. */
function LongVideoCard({ video, onView, onLike, currentUserId = null, isSaved = false, onToggleSave, onDeleted }) {
	const { following, toggleFollow } = useYw();
	const navigate = useNavigate();
	const [playing, setPlaying] = (0, import_react.useState)(false);
	const [src, setSrc] = (0, import_react.useState)(null);
	const [hidden, setHidden] = (0, import_react.useState)(false);
	const [commentCount, setCommentCount] = (0, import_react.useState)(video.commentCount);
	const [liking, setLiking] = (0, import_react.useState)(false);
	const [playerPortrait, setPlayerPortrait] = (0, import_react.useState)(video.orientation === "portrait");
	const [active, setActive] = (0, import_react.useState)({
		id: video.id,
		title: video.title,
		mediaUrl: video.mediaUrl,
		thumbnailUrl: video.thumbnailUrl,
		portrait: video.orientation === "portrait"
	});
	const urlCache = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	const counted = (0, import_react.useRef)(false);
	const cardRef = (0, import_react.useRef)(null);
	const playingRef = (0, import_react.useRef)(false);
	/** Resolve + warm a media URL once, so a click plays instantly. */
	const prefetch = import_react.useCallback(async (mediaUrl) => {
		const cached = urlCache.current.get(mediaUrl);
		if (cached) return cached;
		const url = await resolveLongVideoUrl(mediaUrl);
		urlCache.current.set(mediaUrl, url);
		warmVideo(url);
		return url;
	}, []);
	const start = async () => {
		requestPlayback(video.id);
		playingRef.current = true;
		const ready = urlCache.current.get(active.mediaUrl);
		if (ready) {
			setSrc(ready);
			setPlaying(true);
		}
		const url = ready ?? await prefetch(active.mediaUrl);
		if (!playingRef.current) return;
		setSrc(url);
		setPlaying(true);
		if (!counted.current) {
			counted.current = true;
			onView(video.id);
		}
	};
	/** Fullscreen swipe → next/previous video with the SAME orientation. */
	const swipeQueue = async (dir, portraitMode) => {
		const next = getAdjacentVideo(active.id, portraitMode, dir);
		if (!next) return;
		const url = await prefetch(next.mediaUrl);
		setActive(next);
		setPlayerPortrait(next.portrait);
		setSrc(url);
		setPlaying(true);
		const after = getAdjacentVideo(next.id, portraitMode, dir);
		if (after) prefetch(after.mediaUrl);
	};
	const startRef = (0, import_react.useRef)(start);
	startRef.current = start;
	(0, import_react.useEffect)(() => onStopRequested(video.id, () => {
		playingRef.current = false;
		setPlaying(false);
	}), [video.id]);
	(0, import_react.useEffect)(() => {
		const el = cardRef.current;
		if (!el) return;
		const observer = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) {
				prefetch(video.mediaUrl);
				observer.disconnect();
			}
		}, { rootMargin: "800px 0px" });
		observer.observe(el);
		return () => observer.disconnect();
	}, [prefetch, video.mediaUrl]);
	(0, import_react.useEffect)(() => {
		const el = cardRef.current;
		if (!el) return;
		const observer = new IntersectionObserver(([entry]) => {
			if (entry.intersectionRatio >= .6) {
				if (!playingRef.current) startRef.current();
			} else if (entry.intersectionRatio < .35 && playingRef.current) {
				playingRef.current = false;
				setPlaying(false);
				releasePlayback(video.id);
			}
		}, { threshold: [
			0,
			.35,
			.6,
			1
		] });
		observer.observe(el);
		return () => observer.disconnect();
	}, [video.id]);
	const isMine = currentUserId === video.userId;
	const isFollowing = !!following[video.userId];
	const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/?post=${video.id}` : void 0;
	const handleDownload = async () => {
		const toastId = toast.loading("Preparing download…");
		try {
			const url = src ?? await resolveLongVideoUrl(video.mediaUrl);
			const response = await fetch(url);
			if (!response.ok) throw new Error("Download failed");
			const blobUrl = URL.createObjectURL(await response.blob());
			const a = document.createElement("a");
			a.href = blobUrl;
			a.download = `yw-${video.id}.mp4`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1e3);
			toast.success("Saved to your device", { id: toastId });
		} catch {
			toast.error("Couldn't save this video", { id: toastId });
		}
	};
	const handleSave = async () => {
		if (!onToggleSave) return;
		if (!currentUserId) {
			toast.error("Sign in to save videos");
			return;
		}
		try {
			const savedNow = await onToggleSave(video.id);
			toast.success(savedNow === false ? "Removed from saved" : "Video saved");
		} catch {
			toast.error("Couldn't update saved videos");
		}
	};
	const handleLike = async () => {
		if (!currentUserId) {
			toast.error("Sign in to like videos");
			return;
		}
		if (liking) return;
		setLiking(true);
		try {
			await onLike(video.id);
		} catch {
			toast.error("Couldn't update like");
		} finally {
			setLiking(false);
		}
	};
	const copyLink = async () => {
		try {
			await navigator.clipboard.writeText(shareUrl ?? "");
			toast.success("Link copied");
		} catch {
			toast.error("Could not copy link");
		}
	};
	const handleDelete = async () => {
		try {
			await deletePost(video.id);
			setHidden(true);
			onDeleted?.(video.id);
			toast.success("Video deleted");
		} catch {
			toast.error("Couldn't delete this video");
		}
	};
	const upcoming = !!video.scheduledAt && new Date(video.scheduledAt).getTime() > Date.now();
	if (hidden) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		ref: cardRef,
		className: "space-y-3 overflow-hidden border-y border-zinc-800/80 bg-[#141418] shadow-2xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `relative w-full overflow-hidden bg-black ${playerPortrait ? "aspect-[9/16]" : "aspect-video"}`,
			children: playing && src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrackedVideoPlayer, {
				src,
				title: active.title,
				poster: active.thumbnailUrl,
				portrait: active.portrait,
				watchVideoId: active.id,
				watchTimeEnabled: !!currentUserId,
				onOrientationChange: setPlayerPortrait,
				onSwipeQueue: swipeQueue,
				hideAuxControls: true,
				className: "rounded-none"
			}, active.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => navigate({
					to: "/video/$videoId",
					params: { videoId: video.id }
				}),
				"aria-label": `Open ${video.title}`,
				className: "group relative h-full w-full",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoPoster, {
						thumbnailUrl: video.thumbnailUrl,
						mediaUrl: video.mediaUrl,
						alt: video.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute inset-0 grid place-items-center bg-black/25",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-14 w-14 place-items-center rounded-full bg-white/90 text-black transition-transform group-active:scale-90",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
								size: 22,
								className: "ml-0.5 fill-black"
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold",
						children: formatDuration(video.durationSeconds)
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-2 px-3 pb-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-sm font-bold leading-snug text-white",
						children: video.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex shrink-0 items-center gap-1.5",
						children: [!isMine && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => toggleFollow(video.userId),
							className: cn("rounded-full px-3 py-1 text-[11px] font-semibold transition-all active:scale-95", isFollowing ? "bg-zinc-800 text-white" : "bg-pink-500 text-white"),
							children: isFollowing ? "Following" : "Follow"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								"aria-label": "More options",
								className: "p-1 text-zinc-400 hover:text-white",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { size: 18 })
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
							align: "end",
							className: "w-52",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
									onClick: copyLink,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "mr-2 h-4 w-4" }), " Copy link"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
									onClick: handleSave,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { className: "mr-2 h-4 w-4" }),
										" ",
										isSaved ? "Remove from saved" : "Save video"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
									onClick: handleDownload,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-2 h-4 w-4" }), " Download"]
								}),
								!isMine && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
									onClick: () => setHidden(true),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "mr-2 h-4 w-4" }), " Not interested"]
								}),
								isMine && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
									onClick: handleDelete,
									className: "text-destructive focus:text-destructive",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "mr-2 h-4 w-4" }), " Delete video"]
								})
							]
						})] })]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 text-[11px] text-zinc-400",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/u/$userId",
							params: { userId: video.userId },
							className: "flex items-center gap-2 transition-opacity active:opacity-70",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-6 w-6 place-items-center rounded-full bg-[#8b2fc9] text-[11px] font-bold text-white",
								children: video.author.letter
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-semibold text-zinc-200",
								children: ["@", video.author.username]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 12 }),
								" ",
								formatViews(video.views)
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: timeAgo(video.createdAt) })
					]
				}),
				upcoming && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-[11px] font-semibold text-amber-400",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { size: 12 }),
						" Scheduled for",
						" ",
						new Date(video.scheduledAt).toLocaleString()
					]
				}),
				video.caption && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "line-clamp-2 text-xs leading-relaxed text-zinc-300",
					children: video.caption
				}),
				video.hashtags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1.5",
					children: video.hashtags.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400",
						children: t
					}, t))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between pt-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: handleLike,
								"aria-label": "Like",
								disabled: liking,
								className: "flex items-center gap-1 text-xs text-zinc-300 transition-transform active:scale-75 disabled:opacity-60",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, {
									size: 20,
									className: video.likedByMe ? "fill-pink-500 text-pink-500" : "text-zinc-300"
								}), video.likeCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold",
									children: formatCount(video.likeCount)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommentsSheet, {
								postId: video.id,
								onCountChange: setCommentCount,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									"aria-label": "Comments",
									className: "flex items-center gap-1 text-xs text-zinc-300 transition-transform active:scale-75",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 20 }), commentCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold",
										children: formatCount(commentCount)
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShareSheet, {
								title: video.title,
								url: shareUrl,
								media: src ?? void 0,
								mediaKind: "video",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									"aria-label": "Share",
									className: "text-zinc-300 transition-transform active:scale-75",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { size: 18 })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: handleDownload,
								"aria-label": "Download",
								className: "text-zinc-400 transition-transform hover:text-white active:scale-75",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 18 })
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleSave,
						"aria-label": "Save",
						className: "text-zinc-300 transition-transform active:scale-75",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, {
							size: 20,
							className: isSaved ? "fill-white text-white" : "text-zinc-300"
						})
					})]
				})
			]
		})]
	});
}
var yw_logo_default = "/assets/yw-logo-BXjnypdM.png";
function HomePage() {
	const navigate = useNavigate();
	const [hydrated, setHydrated] = import_react.useState(false);
	const { videos, loading, currentUserId, countView, toggleLike, reload } = useLongVideos();
	const { saved, toggleSave } = usePostSaves();
	const { moments } = useMoments();
	const { count: alertCount } = useAlertsCount();
	import_react.useEffect(() => setHydrated(true), []);
	import_react.useEffect(() => {
		setVideoQueue(videos.map((v) => ({
			id: v.id,
			title: v.title,
			mediaUrl: v.mediaUrl,
			thumbnailUrl: v.thumbnailUrl,
			portrait: v.orientation === "portrait"
		})));
	}, [videos]);
	const myLatest = import_react.useMemo(() => moments.find((m) => m.mine), [moments]);
	const stories = import_react.useMemo(() => {
		const seen = /* @__PURE__ */ new Set();
		const list = [];
		for (const m of moments) {
			if (m.mine) continue;
			const uid = m.author?.id;
			if (!uid) continue;
			if (!seen.has(uid)) {
				seen.add(uid);
				list.push({
					userId: uid,
					username: m.author?.username ?? "user",
					displayName: m.author?.name || m.author?.username || "user",
					avatarUrl: m.author?.avatar ?? void 0,
					hasUnseen: true,
					momentId: m.id
				});
			}
		}
		return list;
	}, [moments]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-black text-white pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-50 flex items-center justify-between border-b border-neutral-900 bg-black px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: yw_logo_default,
						alt: "YourWorld",
						className: "h-8 w-auto object-contain"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-bold text-xl tracking-tight bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent",
						children: "YourWorld"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/search",
						className: "p-2 rounded-full hover:bg-neutral-900 text-neutral-200 transition-colors",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "w-5 h-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/notifications",
						className: "relative p-2 rounded-full hover:bg-neutral-900 text-neutral-200 transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "w-5 h-5" }), alertCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute top-1 right-1 w-4 h-4 bg-pink-600 text-[10px] font-bold rounded-full flex items-center justify-center text-white",
							children: alertCount > 9 ? "9+" : alertCount
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 px-4 py-3 overflow-x-auto no-scrollbar border-b border-neutral-900/60 bg-black",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center gap-1 shrink-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							if (myLatest) navigate({
								to: "/moment/$momentId",
								params: { momentId: myLatest.id }
							});
							else navigate({ to: "/moment/create" });
						},
						className: "relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-full h-full rounded-full bg-neutral-900 border-2 border-black overflow-hidden flex items-center justify-center",
							children: myLatest?.media ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: myLatest.media,
								alt: "My moment",
								className: "w-full h-full object-cover"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-6 h-6 text-pink-500" })
						}), myLatest && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							role: "button",
							"aria-label": "Add another moment",
							onClick: (e) => {
								e.stopPropagation();
								navigate({ to: "/moment/create" });
							},
							className: "absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-pink-500 border-2 border-black flex items-center justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-3.5 h-3.5 text-white" })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-neutral-300 font-medium truncate max-w-[68px]",
						children: "Your moment"
					})]
				}), stories.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center gap-1 shrink-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							if (s.momentId) navigate({
								to: "/moment/$momentId",
								params: { momentId: s.momentId }
							});
						},
						className: "w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 via-purple-500 to-yellow-500 flex items-center justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-full h-full rounded-full bg-neutral-900 border-2 border-black overflow-hidden",
							children: s.avatarUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: s.avatarUrl,
								alt: s.displayName,
								className: "h-full w-full object-cover",
								loading: "lazy"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-full h-full bg-neutral-800 flex items-center justify-center text-sm font-bold text-neutral-300",
								children: (s.displayName || s.username)?.[0]?.toUpperCase() || "U"
							})
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-neutral-400 truncate max-w-[68px]",
						children: s.displayName
					})]
				}, s.userId))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "max-w-lg mx-auto px-2 sm:px-4 py-4 space-y-4",
				children: !hydrated || loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-center py-12 text-neutral-500 text-sm",
					children: "Loading feed..."
				}) : videos.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-center py-12 text-neutral-500 text-sm",
					children: "No videos yet. Be the first to share!"
				}) : videos.map((video) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LongVideoCard, {
					video,
					currentUserId,
					onView: countView,
					onLike: toggleLike,
					isSaved: !!saved[video.id],
					onToggleSave: toggleSave,
					onDeleted: () => reload()
				}, video.id))
			})
		]
	});
}
//#endregion
export { HomePage as component };
