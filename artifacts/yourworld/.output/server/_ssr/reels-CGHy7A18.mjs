import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $t as EllipsisVertical, Bt as Heart, D as Star, Dn as Bookmark, Kt as Flag, Ot as Lock, U as Send, Xt as EyeOff, Yt as Eye, c as VolumeX, h as UserX, l as Volume2, pt as Music2, tn as Download, xt as MessageCircle } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as useSocialPosts, D as timeAgo, L as isVideoQualityTier, R as qualityTierFromDimensions, ct as useDoubleTapLike, lt as useYw, mt as cn, w as resolveMediaUrl, y as getLocalMedia } from "./router-CUrMMPk_.mjs";
import { t as YwAvatar } from "./Avatar-CueYIKO4.mjs";
import { a as downloadWithWatermark, i as downloadVideoInBackground, o as sanitizeDownloadName, r as downloadVideoAtQuality, t as downloadAudioOnly } from "./yw-download-oci3K4X3.mjs";
import { t as formatCount } from "./yw-data-CyapVFm6.mjs";
import { n as DownloadSheet, r as ShareSheet, t as CommentsSheet } from "./DownloadSheet-BNPLmGa2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reels-CGHy7A18.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ReelsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		id: "yw-reels-scroller",
		className: "no-scrollbar h-[calc(100dvh-4.75rem)] snap-y snap-mandatory overflow-y-scroll overscroll-y-contain bg-background [-webkit-overflow-scrolling:touch] [scroll-snap-stop:always] [scroll-behavior:smooth]",
		"aria-label": "Reels",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReelsList, {})
	});
}
function ReelsList() {
	const [active, setActive] = (0, import_react.useState)(0);
	const [audioEnabled, setAudioEnabled] = (0, import_react.useState)(false);
	const nodes = (0, import_react.useRef)([]);
	const { posts: dbReels, toggleLike: toggleDbLike, countView, currentUserId } = useSocialPosts("reel");
	const viewedRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const items = dbReels.map((p) => ({
		reel: {
			id: p.id,
			userId: p.user_id,
			poster: p.media_url,
			caption: p.caption,
			hashtags: p.hashtags ?? [],
			audio: p.audio ?? "original audio",
			likes: p.likeCount,
			views: p.views ?? 0,
			commentCount: p.commentCount,
			shares: 0,
			allowDownload: p.allow_download,
			originalWidth: p.original_width,
			originalHeight: p.original_height,
			sourceQualityTier: (() => {
				const row = p;
				return isVideoQualityTier(row.source_quality_tier) ? row.source_quality_tier : qualityTierFromDimensions(row.original_width, row.original_height);
			})(),
			durationSeconds: p.duration_seconds,
			createdAt: p.created_at
		},
		author: p.author,
		likedByMe: p.likedByMe,
		mediaUrl: p.media_url,
		mediaType: p.media_type
	}));
	(0, import_react.useEffect)(() => {
		const reel = dbReels[active];
		if (!reel || viewedRef.current.has(reel.id) || !currentUserId) return;
		countView(reel.id).then((counted) => {
			if (counted) viewedRef.current.add(reel.id);
		}).catch((error) => console.error("Unable to register reel view", error));
	}, [
		active,
		countView,
		currentUserId,
		dbReels
	]);
	(0, import_react.useEffect)(() => {
		const io = new IntersectionObserver((entries) => {
			let best = null;
			for (const e of entries) {
				const i = Number(e.target.dataset.index);
				if (!best || e.intersectionRatio > best.ratio) best = {
					i,
					ratio: e.intersectionRatio
				};
			}
			if (best && best.ratio > .5) setActive(best.i);
		}, { threshold: [
			0,
			.5,
			.75,
			1
		] });
		nodes.current.forEach((n) => n && io.observe(n));
		return () => io.disconnect();
	}, [items.length]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: items.map(({ reel, author, likedByMe, mediaUrl, mediaType }, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		"data-index": i,
		ref: (el) => {
			nodes.current[i] = el;
		},
		className: "relative h-[calc(100dvh-4.75rem)] w-full snap-start snap-always overflow-hidden [contain:layout_paint_size] [content-visibility:auto]",
		children: Math.abs(i - active) <= 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReelItem, {
			reel,
			active: i === active,
			audioEnabled,
			onEnableAudio: () => setAudioEnabled(true),
			onDisableAudio: () => setAudioEnabled(false),
			author,
			likedByMe,
			mediaUrl,
			mediaType,
			commentsDisabled: !!dbReels[i]?.comments_off,
			onDbLike: () => toggleDbLike(reel.id)
		}) : null
	}, reel.id)) });
}
var REEL_DURATION = 15;
/**
* Renders reel media with graceful recovery: if the stored URL fails to load
* (expired signed URL, missing public URL) we retry with a freshly resolved
* Supabase URL, then with a local blob URL from this session, then fall back
* to an image.
*/
function ReelMedia({ url, type, alt, active, mediaRef, muted, paused = false, onTimeUpdate, onEnded }) {
	const [src, setSrc] = (0, import_react.useState)(url);
	const [asImage, setAsImage] = (0, import_react.useState)(!type.startsWith("video"));
	const tried = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	(0, import_react.useEffect)(() => {
		tried.current = /* @__PURE__ */ new Set();
		setSrc(url);
		setAsImage(!type.startsWith("video"));
	}, [url, type]);
	const handleError = (0, import_react.useCallback)(() => {
		tried.current.add(src);
		(async () => {
			const local = getLocalMedia(url);
			if (local && !tried.current.has(local)) {
				setSrc(local);
				return;
			}
			const resolved = await resolveMediaUrl(url);
			if (resolved && !tried.current.has(resolved)) {
				setSrc(resolved);
				return;
			}
			setAsImage(true);
		})();
	}, [src, url]);
	const videoRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const v = videoRef.current;
		if (!v || asImage) return;
		v.muted = muted;
		if (!muted) v.volume = 1;
	}, [
		asImage,
		muted,
		src
	]);
	(0, import_react.useEffect)(() => {
		const v = videoRef.current;
		if (!v || asImage) return;
		if (active && !paused) v.play().catch(() => {});
		else v.pause();
	}, [
		active,
		asImage,
		src,
		paused
	]);
	const className = cn("h-full w-full object-cover will-change-transform [backface-visibility:hidden]", active && asImage && "animate-kenburns", paused && "[animation-play-state:paused]");
	if (asImage) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		ref: (el) => {
			mediaRef.current = el;
		},
		src,
		alt,
		decoding: "async",
		loading: "eager",
		onError: handleError,
		className
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
		ref: (el) => {
			videoRef.current = el;
			mediaRef.current = el;
		},
		src,
		playsInline: true,
		muted,
		preload: "metadata",
		onError: handleError,
		onTimeUpdate,
		onEnded,
		className
	});
}
function ReelItem({ reel, active, author, likedByMe, mediaUrl, mediaType, audioEnabled = false, onEnableAudio, onDisableAudio, commentsDisabled = false, onDbLike }) {
	const user = author;
	const { saved, following, toggleSave, toggleFollow } = useYw();
	const { burst, onDoubleTap } = useDoubleTapLike(reel.id);
	const [expanded, setExpanded] = (0, import_react.useState)(false);
	const [menuOpen, setMenuOpen] = (0, import_react.useState)(false);
	const muted = !audioEnabled;
	const lastTap = (0, import_react.useRef)(0);
	const isLiked = !!likedByMe;
	const isSaved = !!saved[reel.id];
	const [liking, setLiking] = (0, import_react.useState)(false);
	const [downloadOpen, setDownloadOpen] = (0, import_react.useState)(false);
	const [progress, setProgress] = (0, import_react.useState)(0);
	const [scrubbing, setScrubbing] = (0, import_react.useState)(false);
	const [held, setHeld] = (0, import_react.useState)(false);
	const [tappedPause, setTappedPause] = (0, import_react.useState)(false);
	const paused = held || tappedPause;
	const barRef = (0, import_react.useRef)(null);
	const mediaRef = (0, import_react.useRef)(null);
	const seekRaf = (0, import_react.useRef)(null);
	const pendingSeek = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => () => {
		if (seekRaf.current !== null) cancelAnimationFrame(seekRaf.current);
	}, []);
	const handleTimeUpdate = (0, import_react.useCallback)((event) => {
		const video = event.currentTarget;
		if (video.duration && !Number.isNaN(video.duration)) {
			const currentProgress = video.currentTime / video.duration * 100;
			setProgress(Math.min(100, Math.max(0, currentProgress)));
		}
	}, []);
	const handleEnded = (0, import_react.useCallback)((event) => {
		const video = event.currentTarget;
		setProgress(0);
		if (!active) return;
		video.currentTime = 0;
		video.play().catch(() => {});
	}, [active]);
	const seekFromEvent = (0, import_react.useCallback)((clientX) => {
		const el = barRef.current;
		if (!el) return;
		const r = el.getBoundingClientRect();
		const nextProgress = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
		setProgress(nextProgress * 100);
		pendingSeek.current = nextProgress;
		if (seekRaf.current !== null) return;
		seekRaf.current = requestAnimationFrame(() => {
			seekRaf.current = null;
			const video = mediaRef.current instanceof HTMLVideoElement ? mediaRef.current : null;
			const target = pendingSeek.current;
			pendingSeek.current = null;
			if (video && target !== null && Number.isFinite(video.duration) && video.duration > 0) video.currentTime = target * video.duration;
		});
	}, [mediaRef]);
	const onBarPointerDown = (e) => {
		e.stopPropagation();
		e.target.setPointerCapture?.(e.pointerId);
		setScrubbing(true);
		seekFromEvent(e.clientX);
	};
	const onBarPointerMove = (e) => {
		if (!scrubbing) return;
		e.stopPropagation();
		seekFromEvent(e.clientX);
	};
	const endScrub = () => setScrubbing(false);
	const pointers = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	const pinchStart = (0, import_react.useRef)({
		dist: 0,
		scale: 1
	});
	const transform = (0, import_react.useRef)({
		scale: 1,
		x: 0,
		y: 0
	});
	const applyTransform = () => {
		const el = mediaRef.current;
		if (!el) return;
		const { scale, x, y } = transform.current;
		el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
	};
	const holdTimer = (0, import_react.useRef)(null);
	const holdStart = (0, import_react.useRef)({
		x: 0,
		y: 0
	});
	const heldRef = (0, import_react.useRef)(false);
	const cancelHold = () => {
		if (holdTimer.current) {
			clearTimeout(holdTimer.current);
			holdTimer.current = null;
		}
		if (heldRef.current) {
			heldRef.current = false;
			setHeld(false);
		}
	};
	const onPointerDown = (e) => {
		pointers.current.set(e.pointerId, {
			x: e.clientX,
			y: e.clientY
		});
		if (pointers.current.size === 1) {
			holdStart.current = {
				x: e.clientX,
				y: e.clientY
			};
			if (holdTimer.current) clearTimeout(holdTimer.current);
			holdTimer.current = setTimeout(() => {
				heldRef.current = true;
				setHeld(true);
			}, 200);
		}
		if (pointers.current.size === 2) {
			cancelHold();
			const [a, b] = [...pointers.current.values()];
			pinchStart.current = {
				dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
				scale: transform.current.scale
			};
			const el = mediaRef.current;
			if (el) el.style.transition = "none";
		}
	};
	const onPointerMove = (e) => {
		if (!pointers.current.has(e.pointerId)) return;
		pointers.current.set(e.pointerId, {
			x: e.clientX,
			y: e.clientY
		});
		if (pointers.current.size === 1 && !heldRef.current) {
			const dx = e.clientX - holdStart.current.x;
			const dy = e.clientY - holdStart.current.y;
			if (Math.hypot(dx, dy) > 12) cancelHold();
		}
		if (pointers.current.size !== 2) return;
		e.preventDefault();
		const [a, b] = [...pointers.current.values()];
		const dist = Math.hypot(a.x - b.x, a.y - b.y);
		const scale = Math.min(4, Math.max(1, dist / pinchStart.current.dist * pinchStart.current.scale));
		transform.current.scale = scale;
		applyTransform();
	};
	const releasePointer = (e) => {
		pointers.current.delete(e.pointerId);
		cancelHold();
		if (pointers.current.size < 2 && transform.current.scale !== 1) {
			transform.current = {
				scale: 1,
				x: 0,
				y: 0
			};
			const el = mediaRef.current;
			if (el) el.style.transition = "transform 260ms cubic-bezier(.22,1,.36,1)";
			applyTransform();
		}
	};
	(0, import_react.useEffect)(() => () => cancelHold(), []);
	const handleTap = () => {
		enableAudio();
		const now = Date.now();
		if (now - lastTap.current < 300) {
			onDoubleTap();
			lastTap.current = 0;
			return;
		}
		lastTap.current = now;
		setTappedPause((v) => !v);
	};
	const enableAudio = (0, import_react.useCallback)(() => {
		onEnableAudio?.();
		const video = mediaRef.current instanceof HTMLVideoElement ? mediaRef.current : null;
		if (!video) return;
		video.muted = false;
		video.volume = 1;
	}, [mediaRef, onEnableAudio]);
	const toggleAudio = () => {
		if (audioEnabled) {
			const video = mediaRef.current instanceof HTMLVideoElement ? mediaRef.current : null;
			if (video) video.muted = true;
			onDisableAudio?.();
			return;
		}
		enableAudio();
		const video = mediaRef.current instanceof HTMLVideoElement ? mediaRef.current : null;
		if (video && active && !paused) video.play().catch(() => {});
	};
	const handleDownload = async (choice) => {
		if (!user) return;
		const isVideo = mediaType?.startsWith("video") && Boolean(mediaUrl);
		if (isVideo && !choice) {
			setDownloadOpen(true);
			return;
		}
		const source = mediaUrl ?? reel.poster;
		const toastId = toast.loading(isVideo && choice === "mp3" ? "Preparing MP3 audio… 0%" : isVideo ? `Downloading ${choice} video… 0%` : "Preparing image download…");
		try {
			if (isVideo) {
				const playableUrl = getLocalMedia(source) ?? await resolveMediaUrl(source);
				const baseName = sanitizeDownloadName(reel.caption, `yw-reel-${reel.id}`);
				if (choice === "mp3") await downloadAudioOnly(playableUrl, baseName, (percent) => toast.loading(`Preparing MP3 audio... ${percent}%`, { id: toastId }));
				else if (choice === "original" || choice === reel.sourceQualityTier) await downloadVideoInBackground(playableUrl, `${baseName}.mp4`, (percent) => toast.loading(`Downloading ${choice} video... ${percent}%`, { id: toastId }));
				else if (choice) await downloadVideoAtQuality(playableUrl, baseName, choice, (percent) => toast.loading(`Creating ${choice} video... ${percent}%`, { id: toastId }));
				toast.success("Saved to your device", { id: toastId });
			} else {
				await downloadWithWatermark(reel.poster, user.username, `yw-reel-${reel.id}.jpg`);
				toast.success("Downloaded in original quality with YW watermark", { id: toastId });
			}
		} catch {
			toast.error("Download failed", { id: toastId });
		}
	};
	const handleLike = async () => {
		if (!onDbLike || liking) return;
		setLiking(true);
		try {
			await onDbLike();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Couldn't update like");
		} finally {
			setLiking(false);
		}
	};
	if (!user) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "absolute inset-0 touch-pan-y select-none overflow-hidden",
			onClick: handleTap,
			onDoubleClick: onDoubleTap,
			onContextMenu: (e) => e.preventDefault(),
			onPointerDown,
			onPointerMove,
			onPointerUp: releasePointer,
			onPointerCancel: releasePointer,
			onPointerLeave: releasePointer,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReelMedia, {
					url: mediaUrl ?? reel.poster,
					type: mediaType ?? "image",
					alt: reel.caption,
					active,
					mediaRef,
					muted,
					paused,
					onTimeUpdate: handleTimeUpdate,
					onEnded: handleEnded
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 veil" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("pointer-events-none absolute inset-0 transition-opacity duration-200", paused ? "bg-black/20 opacity-100" : "opacity-0") }),
				tappedPause && !held && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
						viewBox: "0 0 24 24",
						className: "h-16 w-16 text-white/90 drop-shadow-lg",
						fill: "currentColor",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 5v14l11-7z" })
					})
				})
			]
		}),
		burst && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 animate-burst fill-primary text-primary" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-lg font-bold drop-shadow",
				children: "Reels"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: toggleAudio,
					className: "grid h-8 w-8 place-items-center rounded-full bg-background/40 backdrop-blur",
					"aria-label": muted ? "Turn sound on" : "Mute reel",
					children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "h-4 w-4" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-full bg-background/40 px-3 py-1 text-xs backdrop-blur",
					children: "Following"
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "absolute bottom-4 left-0 right-16 space-y-2 px-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/u/$userId",
						params: { userId: reel.userId },
						className: "flex min-w-0 items-center gap-2.5 transition-opacity active:opacity-70",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YwAvatar, {
							user,
							size: 36,
							className: "ring-2 ring-foreground/30"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 truncate text-sm font-semibold drop-shadow",
							children: [
								"@",
								user.username,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "ml-1.5 font-normal text-foreground/70",
									children: ["• ", reel.createdAt ? timeAgo(reel.createdAt) : "Just now"]
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => toggleFollow(user.id),
						className: cn("rounded-full border px-3 py-1 text-xs font-semibold transition-colors", following[user.id] ? "border-border bg-background/40 text-muted-foreground" : "border-foreground/50"),
						children: following[user.id] ? "Following" : "Follow"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setExpanded((v) => !v),
					className: "block text-left text-sm drop-shadow",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn(!expanded && "line-clamp-1"),
						children: reel.caption
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-accent",
						children: [" ", reel.hashtags.map((h) => `#${h}`).join(" ")]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex items-center gap-1.5 text-xs text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Music2, { className: "h-3.5 w-3.5" }),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate",
							children: reel.audio
						})
					]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "absolute bottom-14 right-2 flex flex-col items-center gap-2.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
					onClick: () => void handleLike(),
					label: formatCount(reel.likes),
					active: isLiked,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, {
						strokeWidth: 1.8,
						className: cn("h-[18px] w-[18px]", isLiked && "fill-primary text-primary")
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
					label: `${formatCount(reel.views ?? 0)} views`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {
						strokeWidth: 1.8,
						className: "h-[18px] w-[18px]"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommentsSheet, {
					postId: reel.id,
					commentsDisabled,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
						label: formatCount(reel.commentCount),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {
							strokeWidth: 1.8,
							className: "h-[18px] w-[18px]"
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
					onClick: () => toggleSave(reel.id),
					label: "Save",
					active: isSaved,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, {
						strokeWidth: 1.8,
						className: cn("h-[18px] w-[18px]", isSaved && "fill-foreground")
					})
				}),
				reel.allowDownload ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
					onClick: handleDownload,
					label: "Download",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
						strokeWidth: 1.8,
						className: "h-[18px] w-[18px]"
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
					onClick: () => toast("The creator turned downloads off for this reel"),
					label: "Off",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
						strokeWidth: 1.8,
						className: "h-[17px] w-[17px] text-muted-foreground"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShareSheet, {
					title: reel.caption,
					media: mediaUrl ?? reel.poster,
					mediaKind: mediaType === "video" ? "video" : "photo",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
						label: formatCount(reel.shares),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
							strokeWidth: 1.8,
							className: "h-[18px] w-[18px]"
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
						onClick: () => setMenuOpen((v) => !v),
						label: "More",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EllipsisVertical, {
							strokeWidth: 1.8,
							className: "h-[18px] w-[18px]"
						})
					})
				})
			]
		}),
		menuOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			"aria-label": "Close menu",
			onClick: () => setMenuOpen(false),
			className: "absolute inset-0 z-40 cursor-default bg-background/30 backdrop-blur-[2px]"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			role: "menu",
			className: "absolute bottom-16 right-3 z-50 w-56 overflow-hidden rounded-2xl border border-border/60 bg-background/85 shadow-2xl backdrop-blur-xl animate-rise",
			children: [
				{
					icon: EyeOff,
					label: "Not Interested"
				},
				{
					icon: UserX,
					label: "Don't Recommend Creator"
				},
				{
					icon: Flag,
					label: "Report"
				},
				{
					icon: VolumeX,
					label: "Mute Creator"
				},
				{
					icon: Star,
					label: "Add to Favorites"
				}
			].map(({ icon: Icon, label }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				role: "menuitem",
				onClick: () => {
					setMenuOpen(false);
					toast(label);
				},
				className: "flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-medium transition-colors hover:bg-foreground/10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					strokeWidth: 1.6,
					className: "h-[17px] w-[17px] text-muted-foreground"
				}), label]
			}, label))
		})] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: barRef,
			role: "slider",
			"aria-label": "Seek",
			"aria-valuemin": 0,
			"aria-valuemax": 100,
			"aria-valuenow": Math.round(progress),
			tabIndex: 0,
			onPointerDown: onBarPointerDown,
			onPointerMove: onBarPointerMove,
			onPointerUp: endScrub,
			onPointerCancel: endScrub,
			onClick: (e) => e.stopPropagation(),
			className: "absolute inset-x-0 bottom-0 flex touch-none cursor-pointer items-end px-3 pb-3 pt-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative w-full",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("w-full overflow-hidden rounded-full bg-foreground/20 transition-all duration-200", scrubbing ? "h-1.5" : "h-[3px]"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("h-full rounded-full bg-foreground transition-[width] duration-100 ease-linear", scrubbing && "transition-none"),
						style: { width: `${progress}%` }
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("pointer-events-none absolute top-1/2 -ml-[7px] h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-foreground shadow-lg transition-transform duration-200", scrubbing ? "scale-100" : "scale-0"),
					style: { left: `${progress}%` }
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DownloadSheet, {
			open: downloadOpen,
			onOpenChange: setDownloadOpen,
			title: reel.caption || "YourWorld reel",
			durationSeconds: reel.durationSeconds ?? REEL_DURATION,
			sourceQualityTier: reel.sourceQualityTier ?? null,
			onDownload: handleDownload
		})
	] });
}
function Action({ children, label, onClick, active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: cn("group flex w-11 flex-col items-center gap-1 text-foreground transition-transform duration-150 active:scale-90", active && "animate-pop"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("grid h-9 w-9 place-items-center rounded-full border border-foreground/15 bg-background/25 shadow-[0_6px_20px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors group-hover:bg-background/40", active && "border-primary/40 bg-primary/15"),
			children
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "w-full truncate text-[8px] font-semibold tracking-wide text-foreground/85 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]",
			children: label
		})]
	});
}
//#endregion
export { ReelsPage as component };
