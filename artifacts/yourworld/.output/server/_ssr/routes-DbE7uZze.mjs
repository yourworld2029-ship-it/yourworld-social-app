import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { Bt as Heart, C as Trash2, Cn as Cast, Dn as Bookmark, E as Sun, G as Search, Nt as Languages, Ot as Lock, Qt as Ellipsis, U as Send, V as Settings, Wt as Gauge, X as Repeat, Xt as EyeOff, Yt as Eye, _n as ChevronRight, _t as Minimize, bn as Check, c as VolumeX, cn as Clock, dn as Circle, et as Plus, gt as MonitorPlay, jt as Link2, kt as LockOpen, l as Volume2, tn as Download, tt as Play, vn as ChevronLeft, wn as Captions, wt as Maximize, xt as MessageCircle } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { O as timeAgo, g as useAuth, ht as cn, ut as useYw, v as useMoments } from "./router-CDfbqX6_.mjs";
import { i as downloadVideoInBackground, o as sanitizeDownloadName, r as downloadVideoAtQuality, t as downloadAudioOnly } from "./yw-download-kEfjmZty.mjs";
import { n as useAlertsCount } from "./alerts-count-DzTrAmD5.mjs";
import { a as Label2, c as Root2, d as SubTrigger2, f as Trigger, i as ItemIndicator2, l as Separator2, n as Content2, o as Portal2, r as Item2, s as RadioItem2, t as CheckboxItem2, u as SubContent2 } from "../_libs/@radix-ui/react-dropdown-menu+[...].mjs";
import { a as resolveLongVideoUrl, n as formatDuration, o as useLongVideos, r as formatViews, s as useVideoWatchTime } from "./video-data-DdLRS1yb.mjs";
import { t as VideoPoster } from "./VideoPoster-CqPVgglG.mjs";
import { t as formatCount } from "./yw-data-CyapVFm6.mjs";
import { n as DownloadSheet, r as ShareSheet, t as CommentsSheet } from "./DownloadSheet-B30eEkVI.mjs";
import { n as usePostSaves, t as deletePost } from "./post-actions-EDBuutpP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DbE7uZze.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SPEEDS = [
	.25,
	.5,
	.75,
	1,
	1.25,
	1.5,
	1.75,
	2
];
function fmt(t) {
	if (!Number.isFinite(t)) return "0:00";
	const s = Math.floor(t % 60);
	const m = Math.floor(t / 60) % 60;
	const h = Math.floor(t / 3600);
	const mm = h ? String(m).padStart(2, "0") : String(m);
	return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}
/** Premium player: YouTube-style controls + MX Player gestures (seek, volume, brightness, lock, fit). */
function PremiumVideoPlayer({ src, poster, title, portrait, autoPlay, className, onOrientationChange, onSwipeQueue, onWatchTime, hideAuxControls }) {
	const wrapRef = (0, import_react.useRef)(null);
	const vidRef = (0, import_react.useRef)(null);
	const [playing, setPlaying] = (0, import_react.useState)(!!autoPlay);
	const [muted, setMuted] = (0, import_react.useState)(false);
	const [volume, setVolume] = (0, import_react.useState)(1);
	const [brightness, setBrightness] = (0, import_react.useState)(1);
	const [time, setTime] = (0, import_react.useState)(0);
	const [dur, setDur] = (0, import_react.useState)(0);
	const [buffered, setBuffered] = (0, import_react.useState)(0);
	const [speed, setSpeed] = (0, import_react.useState)(1);
	const [quality, setQuality] = (0, import_react.useState)("Auto");
	const [sourceHeight, setSourceHeight] = (0, import_react.useState)(0);
	const [loop, setLoop] = (0, import_react.useState)(false);
	const [locked, setLocked] = (0, import_react.useState)(false);
	const [fullscreen, setFullscreen] = (0, import_react.useState)(false);
	const [isVertical, setIsVertical] = (0, import_react.useState)(!!portrait);
	const [aspectRatio, setAspectRatio] = (0, import_react.useState)(null);
	const [showUI, setShowUI] = (0, import_react.useState)(true);
	const [menu, setMenu] = (0, import_react.useState)(null);
	const [toastMsg, setToastMsg] = (0, import_react.useState)(null);
	const [captionTracks, setCaptionTracks] = (0, import_react.useState)([]);
	const [caption, setCaption] = (0, import_react.useState)("Off");
	const [audioTracks, setAudioTracks] = (0, import_react.useState)([]);
	const [audio, setAudio] = (0, import_react.useState)("Original");
	const [mediaError, setMediaError] = (0, import_react.useState)(false);
	const hideTimer = (0, import_react.useRef)(null);
	const gesture = (0, import_react.useRef)(null);
	const lastTap = (0, import_react.useRef)(0);
	const lastPlaybackTime = (0, import_react.useRef)(null);
	const [showBrightBar, setShowBrightBar] = (0, import_react.useState)(false);
	const brightBarTimer = (0, import_react.useRef)(null);
	const [zoom, setZoom] = (0, import_react.useState)(1);
	const [pan, setPan] = (0, import_react.useState)({
		x: 0,
		y: 0
	});
	const [showZoomBadge, setShowZoomBadge] = (0, import_react.useState)(false);
	const zoomBadgeTimer = (0, import_react.useRef)(null);
	const pinch = (0, import_react.useRef)(null);
	const flashBrightBar = (0, import_react.useCallback)(() => {
		setShowBrightBar(true);
		if (brightBarTimer.current) window.clearTimeout(brightBarTimer.current);
		brightBarTimer.current = window.setTimeout(() => setShowBrightBar(false), 900);
	}, []);
	(0, import_react.useEffect)(() => () => {
		if (brightBarTimer.current) window.clearTimeout(brightBarTimer.current);
	}, []);
	const flash = (0, import_react.useCallback)((m) => {
		setToastMsg(m);
		window.setTimeout(() => setToastMsg((c) => c === m ? null : c), 700);
	}, []);
	const poke = (0, import_react.useCallback)(() => {
		setShowUI(true);
		if (hideTimer.current) window.clearTimeout(hideTimer.current);
		hideTimer.current = window.setTimeout(() => setShowUI(false), 2800);
	}, []);
	(0, import_react.useEffect)(() => () => {
		if (hideTimer.current) window.clearTimeout(hideTimer.current);
	}, []);
	const toggle = (0, import_react.useCallback)(() => {
		const v = vidRef.current;
		if (!v) return;
		if (v.paused) {
			setMediaError(false);
			v.play().catch(() => {
				setPlaying(false);
				setShowUI(true);
				setMediaError(true);
			});
		} else v.pause();
	}, []);
	const seekBy = (0, import_react.useCallback)((d) => {
		const v = vidRef.current;
		if (!v) return;
		v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + d));
		flash(`${d > 0 ? "+" : ""}${d}s`);
	}, [flash]);
	(0, import_react.useEffect)(() => {
		const v = vidRef.current;
		if (v) {
			v.playbackRate = speed;
			v.volume = volume;
			v.muted = muted;
			v.loop = false;
		}
	}, [
		speed,
		volume,
		muted,
		loop
	]);
	(0, import_react.useEffect)(() => {
		setMediaError(false);
		if (!autoPlay) return;
		const video = vidRef.current;
		if (!video) return;
		let active = true;
		video.play().catch(() => {
			if (!active) return;
			setPlaying(false);
			setShowUI(true);
			setMediaError(true);
		});
		return () => {
			active = false;
		};
	}, [src, autoPlay]);
	const lockScreenOrientation = (0, import_react.useCallback)(async (vertical) => {
		try {
			await screen.orientation.lock?.(vertical ? "portrait-primary" : "landscape");
		} catch {}
	}, []);
	(0, import_react.useEffect)(() => {
		const onFs = () => {
			const active = !!document.fullscreenElement;
			setFullscreen(active);
			if (active) lockScreenOrientation(isVertical);
			else try {
				screen.orientation.unlock?.();
			} catch {}
		};
		document.addEventListener("fullscreenchange", onFs);
		return () => document.removeEventListener("fullscreenchange", onFs);
	}, [isVertical, lockScreenOrientation]);
	(0, import_react.useEffect)(() => {
		setIsVertical(!!portrait);
		setAspectRatio(null);
	}, [portrait, src]);
	(0, import_react.useEffect)(() => {
		if (!fullscreen) {
			setZoom(1);
			setPan({
				x: 0,
				y: 0
			});
			setShowZoomBadge(false);
			pinch.current = null;
			if (zoomBadgeTimer.current) window.clearTimeout(zoomBadgeTimer.current);
		}
	}, [fullscreen]);
	(0, import_react.useEffect)(() => () => {
		if (zoomBadgeTimer.current) window.clearTimeout(zoomBadgeTimer.current);
	}, []);
	const toggleFullscreen = async () => {
		const el = wrapRef.current;
		if (!el) return;
		try {
			if (document.fullscreenElement) {
				await document.exitFullscreen();
				try {
					screen.orientation.unlock?.();
				} catch {}
			} else {
				await el.requestFullscreen();
				await lockScreenOrientation(isVertical);
			}
		} catch {}
	};
	const cast = async () => {
		const v = vidRef.current;
		if (!v) {
			flash("Cast unavailable");
			return;
		}
		try {
			if (v.remote?.prompt) {
				await v.remote.prompt();
				return;
			}
			if (v.webkitShowPlaybackTargetPicker) {
				v.webkitShowPlaybackTargetPicker();
				return;
			}
			flash("Cast not supported on this device");
		} catch {
			flash("Cast unavailable");
		}
	};
	const readMediaTracks = (0, import_react.useCallback)(() => {
		const video = vidRef.current;
		if (!video) return;
		const captions = Array.from(video.textTracks).map((track, index) => ({
			index,
			label: track.label || track.language || `Captions ${index + 1}`
		}));
		setCaptionTracks(captions);
		const tracks = video.audioTracks;
		const availableAudio = tracks ? Array.from(tracks).map((track, index) => ({
			index,
			label: track.label || track.language || `Audio ${index + 1}`
		})) : [];
		setAudioTracks(availableAudio);
		const activeAudio = tracks ? Array.from(tracks).find((track) => track.enabled) : void 0;
		setAudio(activeAudio?.label || activeAudio?.language || "Original");
	}, []);
	const pickCaption = (value) => {
		const video = vidRef.current;
		if (!video) return;
		Array.from(video.textTracks).forEach((track, index) => {
			track.mode = value !== "Off" && captionTracks[index]?.label === value ? "showing" : "disabled";
		});
		setCaption(value);
		setMenu(null);
		flash(value === "Off" ? "Captions off" : `Captions · ${value}`);
	};
	const pickAudio = (value) => {
		const video = vidRef.current;
		if (!video?.audioTracks) {
			setMenu(null);
			flash("Original audio");
			return;
		}
		Array.from(video.audioTracks).forEach((track, index) => {
			track.enabled = audioTracks[index]?.label === value;
		});
		setAudio(value);
		setMenu(null);
		flash(`Audio · ${value}`);
	};
	const onPointerDown = (e) => {
		if (locked) return;
		gesture.current = {
			x: e.clientX,
			y: e.clientY,
			mode: null,
			t0: vidRef.current?.currentTime ?? 0,
			dy: 0
		};
	};
	const onPointerMove = (e) => {
		const g = gesture.current;
		if (!g || locked) return;
		const dx = e.clientX - g.x;
		const dy = e.clientY - g.y;
		g.dy = dy;
		if (pinch.current) return;
		if (!g.mode) {
			if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
			const rect = wrapRef.current?.getBoundingClientRect();
			const rightHalf = rect ? e.clientX - rect.left > rect.width / 2 : true;
			g.mode = Math.abs(dy) >= Math.abs(dx) ? fullscreen ? rightHalf ? onSwipeQueue ? "queue" : "vol" : "bright" : rightHalf ? "vol" : "bright" : "seek";
		}
		if (g.mode === "queue") return;
		if (g.mode === "seek") {
			const v = vidRef.current;
			if (!v) return;
			const nt = Math.max(0, Math.min(v.duration || 0, g.t0 + dx / 6));
			v.currentTime = nt;
			flash(fmt(nt));
		} else if (g.mode === "vol") {
			const nv = Math.max(0, Math.min(1, volume - dy / 250));
			setVolume(nv);
			setMuted(nv === 0);
			flash(`Volume ${Math.round(nv * 100)}%`);
		} else {
			const nb = Math.max(.25, Math.min(1.6, brightness - dy / 250));
			setBrightness(nb);
			if (fullscreen) flashBrightBar();
			else flash(`Brightness ${Math.round(nb * 100)}%`);
		}
	};
	const onPointerUp = () => {
		const g = gesture.current;
		gesture.current = null;
		if (g?.mode === "queue" && Math.abs(g.dy) > 90) onSwipeQueue?.(g.dy < 0 ? 1 : -1, isVertical);
	};
	const touchMid = (t) => ({
		x: (t[0].clientX + t[1].clientX) / 2,
		y: (t[0].clientY + t[1].clientY) / 2,
		d: Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
	});
	const onTouchStart = (e) => {
		if (!fullscreen || locked || e.touches.length !== 2) return;
		const m = touchMid(e.touches);
		gesture.current = null;
		pinch.current = {
			dist: m.d || 1,
			cx: m.x,
			cy: m.y,
			zoom,
			pan
		};
		setShowZoomBadge(true);
		if (zoomBadgeTimer.current) window.clearTimeout(zoomBadgeTimer.current);
	};
	const onTouchMove = (e) => {
		const p = pinch.current;
		if (!p || !fullscreen || e.touches.length !== 2) return;
		e.preventDefault();
		const m = touchMid(e.touches);
		const next = Math.max(1, Math.min(3, p.zoom * (m.d / p.dist)));
		setZoom(next);
		const limit = (v) => Math.max(-400, Math.min(400, v));
		setPan({
			x: limit(p.pan.x + (m.x - p.cx)),
			y: limit(p.pan.y + (m.y - p.cy))
		});
	};
	const onTouchEnd = (e) => {
		if (e.touches.length < 2) {
			pinch.current = null;
			if (zoomBadgeTimer.current) window.clearTimeout(zoomBadgeTimer.current);
			zoomBadgeTimer.current = window.setTimeout(() => setShowZoomBadge(false), 500);
		}
		if (zoom <= 1.01) setPan({
			x: 0,
			y: 0
		});
	};
	const onTapZone = (side) => {
		if (locked) {
			poke();
			return;
		}
		if (side === "c") {
			lastTap.current = 0;
			toggle();
			return;
		}
		const now = Date.now();
		if (now - lastTap.current < 300) {
			seekBy(side === "l" ? -10 : 10);
			lastTap.current = 0;
		} else {
			lastTap.current = now;
			window.setTimeout(() => {
				if (lastTap.current) {
					lastTap.current = 0;
					poke();
				}
			}, 260);
		}
	};
	const progress = dur ? time / dur * 100 : 0;
	const qualityOptions = (0, import_react.useMemo)(() => {
		const available = sourceHeight ? [
			2160,
			1440,
			1080,
			720,
			480,
			360,
			240
		].filter((height) => height <= sourceHeight) : [
			1080,
			720,
			480,
			360
		];
		return [
			"Auto",
			sourceHeight ? `Original · ${sourceHeight}p` : "Original",
			...available.map((height) => `${height}p`)
		].filter((option, index, options) => options.indexOf(option) === index);
	}, [sourceHeight]);
	const handleMetadata = (0, import_react.useCallback)((e) => {
		const { videoWidth, videoHeight, duration } = e.currentTarget;
		const vertical = videoHeight > videoWidth;
		setIsVertical(vertical);
		setAspectRatio(videoWidth > 0 && videoHeight > 0 ? videoWidth / videoHeight : null);
		setDur(duration || 0);
		setSourceHeight(videoHeight || 0);
		onOrientationChange?.(vertical);
		readMediaTracks();
	}, [onOrientationChange, readMediaTracks]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: wrapRef,
		onMouseMove: poke,
		style: !fullscreen && aspectRatio ? { aspectRatio: String(aspectRatio) } : void 0,
		className: cn("relative w-full overflow-hidden bg-black select-none", fullscreen ? "flex h-full w-full items-center justify-center rounded-none" : cn("mx-auto rounded-xl", isVertical ? "max-h-[75vh] aspect-[9/16]" : "aspect-[16/9]"), className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
				ref: vidRef,
				src,
				poster: poster ?? void 0,
				playsInline: true,
				muted,
				preload: "metadata",
				style: {
					filter: `brightness(${brightness})`,
					transform: fullscreen && zoom > 1 ? `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` : void 0,
					transformOrigin: "center center",
					transition: pinch.current ? "none" : "transform 120ms ease-out"
				},
				className: cn("h-full w-full", "object-contain"),
				onPlay: (e) => {
					lastPlaybackTime.current = e.currentTarget.currentTime;
					setPlaying(true);
					poke();
				},
				onPause: () => {
					lastPlaybackTime.current = null;
					setPlaying(false);
					setShowUI(true);
				},
				onError: () => {
					setPlaying(false);
					setShowUI(true);
					setMediaError(true);
				},
				onLoadedMetadata: handleMetadata,
				onTimeUpdate: (e) => {
					const v = e.currentTarget;
					const previous = lastPlaybackTime.current;
					const delta = previous === null ? 0 : v.currentTime - previous;
					if (!v.paused && delta > 0 && delta <= Math.max(2.5, v.playbackRate * 2.5)) onWatchTime?.(delta);
					lastPlaybackTime.current = v.currentTime;
					setTime(v.currentTime);
					if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
				},
				onEnded: (e) => {
					const v = e.currentTarget;
					setTime(0);
					setBuffered(0);
					lastPlaybackTime.current = 0;
					if (loop) {
						v.currentTime = 0;
						v.play().catch(() => {
							setPlaying(false);
							setShowUI(true);
						});
					} else {
						setPlaying(false);
						setShowUI(true);
					}
				}
			}),
			mediaError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-0 z-30 grid place-items-center bg-black/75 px-6 text-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold text-white",
					children: "Video unavailable"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-zinc-400",
					children: "This video source could not be played on this device."
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-0 flex",
				style: { touchAction: fullscreen ? "none" : void 0 },
				onPointerDown,
				onPointerMove,
				onPointerUp,
				onPointerCancel: onPointerUp,
				onTouchStart,
				onTouchMove,
				onTouchEnd,
				onTouchCancel: onTouchEnd,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full flex-1",
						onClick: () => onTapZone("l")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full flex-1",
						onClick: () => onTapZone("c")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full flex-1",
						onClick: () => onTapZone("r")
					})
				]
			}),
			toastMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-black/70 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur",
				children: toastMsg
			}),
			fullscreen && showBrightBar && !locked && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute left-6 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-2 rounded-full bg-black/60 px-2 py-3 backdrop-blur",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, {
						size: 16,
						className: "text-white"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative h-32 w-1.5 overflow-hidden rounded-full bg-white/25",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute bottom-0 w-full rounded-full bg-white transition-[height] duration-100",
							style: { height: `${Math.round((brightness - .25) / 1.35 * 100)}%` }
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-[10px] font-semibold tabular-nums text-white",
						children: [Math.round(brightness * 100), "%"]
					})
				]
			}),
			fullscreen && zoom > 1.01 && showZoomBadge && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute right-4 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur transition-opacity duration-300",
				children: [Math.round(zoom * 100), "%"]
			}),
			locked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 z-[55]",
				onClick: (e) => e.stopPropagation(),
				onPointerDown: (e) => e.stopPropagation(),
				onTouchStart: (e) => e.stopPropagation(),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: (e) => {
						e.stopPropagation();
						setLocked(false);
						flash("Unlocked");
					},
					className: "absolute left-3 top-1/2 z-[70] -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-black/60 text-white backdrop-blur",
					"aria-label": "Unlock controls",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockOpen, { size: 18 })
				})
			}),
			!locked && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("pointer-events-none absolute inset-0 z-40 transition-opacity duration-200", showUI || !playing ? "opacity-100" : "opacity-0"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pointer-events-auto flex items-start justify-end gap-2 bg-gradient-to-b from-black/80 to-transparent p-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative z-10 flex items-center gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
								label: "Lock screen",
								onClick: () => {
									setLocked(true);
									flash("Locked");
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { size: 16 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
								label: "Cast",
								onClick: () => {
									cast();
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cast, { size: 16 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
								label: "Settings",
								onClick: () => setMenu(menu ? null : "root"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { size: 16 })
							})
						]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-auto absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t from-black/90 to-transparent px-3 pb-3 pt-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative h-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "absolute inset-x-0 top-1.5 h-1 rounded-full bg-white/25",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full rounded-full bg-white/40",
									style: { width: `${dur ? buffered / dur * 100 : 0}%` }
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "absolute top-1.5 h-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500",
								style: { width: `${progress}%` }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "absolute top-0 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white bg-pink-500 shadow",
								style: { left: `${progress}%` }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min: 0,
								max: dur || 0,
								step: .1,
								value: time,
								"aria-label": "Seek",
								onChange: (e) => {
									const v = vidRef.current;
									if (v) {
										v.currentTime = Number(e.target.value);
										setTime(Number(e.target.value));
									}
								},
								className: "absolute inset-0 h-4 w-full cursor-pointer opacity-0"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between text-[11px] font-semibold text-white/85",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									setMuted((m) => !m);
								},
								"aria-label": "Mute",
								children: muted || volume === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { size: 16 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { size: 16 })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "tabular-nums",
								children: [
									fmt(time),
									" / ",
									fmt(dur)
								]
							})]
						}), hideAuxControls ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setLoop((l) => !l),
								"aria-label": "Loop",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Repeat, {
									size: 16,
									className: loop ? "text-pink-400" : ""
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: toggleFullscreen,
								"aria-label": "Fullscreen",
								children: fullscreen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minimize, { size: 16 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Maximize, { size: 16 })
							})]
						})]
					})]
				})]
			}),
			menu && !locked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm",
				onClick: () => setMenu(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative max-h-[70vh] w-full overflow-y-auto rounded-t-[16px] bg-[#1f1f1f] text-white shadow-2xl",
					onClick: (e) => e.stopPropagation(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "sticky top-0 z-10 flex flex-col gap-2 bg-[#1f1f1f] px-4 pb-2 pt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mx-auto h-1.5 w-10 rounded-full bg-white/25" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium text-white/90",
							children: menu === "root" ? "Settings" : title || "Settings"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-2 pb-4 pt-1",
						children: [
							menu === "root" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-0.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, { size: 18 }),
										label: "Playback speed",
										value: `${speed}x`,
										onClick: () => setMenu("speed")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonitorPlay, { size: 18 }),
										label: "Quality",
										value: quality,
										onClick: () => setMenu("quality")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Captions, { size: 18 }),
										label: "Captions",
										value: caption,
										onClick: () => setMenu("captions")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Languages, { size: 18 }),
										label: "Audio track",
										value: audio,
										onClick: () => setMenu("audio")
									})
								]
							}),
							menu === "speed" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionList, {
								title: "Playback speed",
								options: SPEEDS.map((s) => `${s}x`),
								active: `${speed}x`,
								onPick: (o) => {
									setSpeed(parseFloat(o));
									setMenu(null);
									flash(`${o}`);
								}
							}),
							menu === "quality" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionList, {
								title: "Quality",
								options: qualityOptions,
								active: quality,
								onPick: (option) => {
									setQuality(option);
									setMenu("root");
									flash(`Quality · ${option}`);
								},
								onBack: () => setMenu("root")
							}),
							menu === "captions" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionList, {
								title: "Captions",
								options: ["Off", ...captionTracks.map((track) => track.label)],
								active: caption,
								onPick: pickCaption,
								emptyHint: captionTracks.length === 0 ? "This video has no caption tracks" : void 0
							}),
							menu === "audio" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionList, {
								title: "Audio track",
								options: audioTracks.length ? audioTracks.map((track) => track.label) : ["Original"],
								active: audio,
								onPick: pickAudio,
								emptyHint: audioTracks.length === 0 ? "No alternate language track was uploaded" : void 0
							})
						]
					})]
				})
			})
		]
	});
}
function IconBtn({ children, label, onClick, big }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onPointerDown: (e) => e.stopPropagation(),
		onTouchStart: (e) => e.stopPropagation(),
		onClick: (e) => {
			e.stopPropagation();
			onClick();
		},
		"aria-label": label,
		className: cn("pointer-events-auto grid place-items-center rounded-full bg-black/45 text-white backdrop-blur transition-transform active:scale-90", big ? "h-11 w-11" : "h-8 w-8"),
		children
	});
}
function Row({ icon, label, value, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: "flex w-full items-center gap-4 px-4 py-3.5 text-left text-[15px] text-white transition-colors hover:bg-white/10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-white/70",
				children: icon
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex-1 font-normal",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm text-white/60",
				children: value
			})
		]
	});
}
function OptionList({ title, options, active, onPick, emptyHint, onBack }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-0.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 px-4 pb-1 pt-2",
				children: [onBack && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onBack,
					"aria-label": "Back to settings",
					className: "grid h-8 w-8 place-items-center rounded-full text-white/80 hover:bg-white/10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 20 })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[15px] font-medium text-white",
					children: title
				})]
			}),
			emptyHint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-4 pb-2 text-xs text-white/50",
				children: emptyHint
			}),
			options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => onPick(o),
				className: cn("flex w-full items-center justify-between px-4 py-3 text-[15px] transition-colors hover:bg-white/10", o === active ? "text-white" : "text-white/90"),
				children: [o, o === active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-white",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 18 })
				})]
			}, o))
		]
	});
}
/**
* Keeps each watch-time buffer scoped to one mounted player. Queue navigation
* mounts a fresh instance, so an in-flight flush can never be reassigned to
* the next video.
*/
function TrackedVideoPlayer({ watchVideoId, watchTimeEnabled, ...playerProps }) {
	const reportWatchTime = useVideoWatchTime(watchVideoId, watchTimeEnabled);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PremiumVideoPlayer, {
		...playerProps,
		onWatchTime: reportWatchTime
	});
}
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
	el.preload = "metadata";
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
	const [downloadOpen, setDownloadOpen] = (0, import_react.useState)(false);
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
			Promise.resolve(onView(video.id)).catch((error) => {
				counted.current = false;
				console.error("Unable to register long-video view", error);
			});
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
	const handleDownload = () => {
		setDownloadOpen(true);
	};
	const downloadSelected = async (choice) => {
		const toastId = toast.loading("Downloading video... 0%");
		try {
			const url = src ?? await resolveLongVideoUrl(video.mediaUrl);
			const baseName = sanitizeDownloadName(video.title, `yw-${video.id}`);
			if (choice === "mp3") await downloadAudioOnly(url, baseName, (percent) => toast.loading(`Preparing MP3 audio... ${percent}%`, { id: toastId }));
			else if (choice === "original" || choice === video.sourceQualityTier) await downloadVideoInBackground(url, `${baseName}.mp4`, (percent) => toast.loading(`Downloading ${choice} video... ${percent}%`, { id: toastId }));
			else await downloadVideoAtQuality(url, baseName, choice, (percent) => toast.loading(`Creating ${choice} video... ${percent}%`, { id: toastId }));
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
	const openViewer = () => {
		const id = typeof video?.id === "string" ? video.id.trim() : "";
		if (!id) {
			toast.error("This video is unavailable.");
			return;
		}
		navigate({
			to: "/video/$videoId",
			params: { videoId: id }
		});
	};
	const upcoming = !!video.scheduledAt && new Date(video.scheduledAt).getTime() > Date.now();
	if (hidden) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		ref: cardRef,
		className: "space-y-3 overflow-hidden border-y border-zinc-800/80 bg-[#141418] shadow-2xl",
		children: [
			playing && src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrackedVideoPlayer, {
				src,
				title: active.title,
				poster: active.thumbnailUrl,
				portrait: active.portrait,
				watchVideoId: active.id,
				watchTimeEnabled: !!currentUserId,
				onOrientationChange: setPlayerPortrait,
				onSwipeQueue: swipeQueue,
				hideAuxControls: true
			}, active.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("relative mx-auto w-full overflow-hidden bg-black", playerPortrait ? "max-h-[75vh] aspect-[9/16]" : "aspect-[16/9]"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: openViewer,
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
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
									commentsDisabled: !!video.commentsOff,
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
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DownloadSheet, {
				open: downloadOpen,
				onOpenChange: setDownloadOpen,
				title: video.title,
				durationSeconds: video.durationSeconds,
				sourceQualityTier: video.sourceQualityTier,
				onDownload: downloadSelected
			})
		]
	});
}
var yw_logo_default = "/assets/yw-logo-BXjnypdM.png";
function MomentAvatar({ username, src, alt }) {
	const [imageFailed, setImageFailed] = import_react.useState(false);
	const initial = (username.trim().charAt(0) || "U").toUpperCase();
	import_react.useEffect(() => {
		setImageFailed(false);
	}, [src]);
	if (!src || imageFailed) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		role: "img",
		"aria-label": `${alt} avatar`,
		className: "grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-xl font-extrabold leading-none text-white",
		children: initial
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src,
		alt,
		onError: () => setImageFailed(true),
		className: "h-full w-full rounded-full object-cover",
		loading: "lazy"
	});
}
function HomePage() {
	const navigate = useNavigate();
	const [hydrated, setHydrated] = import_react.useState(false);
	const { videos, loading, currentUserId, countView, toggleLike, reload } = useLongVideos();
	const { saved, toggleSave } = usePostSaves();
	const { moments } = useMoments();
	const { user } = useAuth();
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
	const userMetadata = user?.user_metadata ?? {};
	const myUsername = myLatest?.author?.username || (typeof userMetadata.username === "string" ? userMetadata.username : null) || (typeof userMetadata.user_name === "string" ? userMetadata.user_name : null) || (typeof user?.email === "string" ? user.email.split("@")[0] : null) || "user";
	const myAvatarUrl = myLatest?.author?.avatar || (typeof userMetadata.avatar_url === "string" ? userMetadata.avatar_url : null) || (typeof userMetadata.picture === "string" ? userMetadata.picture : null);
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
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MomentAvatar, {
								username: myUsername,
								src: myAvatarUrl,
								alt: "Your avatar"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							role: "button",
							"aria-label": "Add another moment",
							onClick: (e) => {
								e.stopPropagation();
								navigate({ to: "/moment/create" });
							},
							className: "absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-pink-500 border-2 border-black",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
								className: "h-3 w-3 text-white",
								strokeWidth: 3
							})
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
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MomentAvatar, {
								username: s.username,
								src: s.avatarUrl,
								alt: s.displayName
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
