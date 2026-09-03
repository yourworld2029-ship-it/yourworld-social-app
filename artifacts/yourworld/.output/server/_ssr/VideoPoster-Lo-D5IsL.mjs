import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { At as LockOpen, E as Sun, Gt as Gauge, Pt as Languages, Tn as Captions, Tt as Maximize, V as Settings, X as Repeat, _t as MonitorPlay, c as VolumeX, kt as Lock, l as Volume2, vt as Minimize, wn as Cast, xn as Check, yn as ChevronLeft } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { U as isAuthSessionMissing, tt as cn } from "./router-COLtD0vp.mjs";
import { a as resolveLongVideoUrl, s as useVideoWatchTime } from "./video-data-6x0zjqIe.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/VideoPoster-Lo-D5IsL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Permanently delete my own post. */
async function deletePost(postId) {
	const { error } = await supabase.from("posts").delete().eq("id", postId);
	if (error) throw error;
}
/** Saved-post bookmarks for the signed-in user, synced with the database. */
function usePostSaves() {
	const [saved, setSaved] = (0, import_react.useState)({});
	const meRef = (0, import_react.useRef)(null);
	const load = (0, import_react.useCallback)(async () => {
		const { data: auth, error: authError } = await supabase.auth.getUser();
		if (authError) {
			if (isAuthSessionMissing(authError)) {
				meRef.current = null;
				setSaved({});
				return;
			}
			console.error("Unable to load saved posts", authError);
			toast.error("Couldn't load saved posts.");
			return;
		}
		const me = auth.user?.id ?? null;
		meRef.current = me;
		if (!me) {
			setSaved({});
			return;
		}
		const { data, error } = await supabase.from("post_saves").select("post_id").eq("user_id", me);
		if (error) {
			console.error("Unable to load saved posts", error);
			toast.error("Couldn't load saved posts.");
			return;
		}
		const next = {};
		for (const row of data ?? []) next[row.post_id] = true;
		setSaved(next);
	}, []);
	(0, import_react.useEffect)(() => {
		load();
		const { data: sub } = supabase.auth.onAuthStateChange(() => void load());
		const channel = supabase.channel(`post-saves:${crypto.randomUUID()}`).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "post_saves"
		}, () => void load()).subscribe();
		return () => {
			sub.subscription.unsubscribe();
			supabase.removeChannel(channel);
		};
	}, [load]);
	return {
		saved,
		toggleSave: (0, import_react.useCallback)(async (postId) => {
			const me = meRef.current;
			if (!me) return false;
			let next = false;
			setSaved((prev) => {
				next = !prev[postId];
				return {
					...prev,
					[postId]: next
				};
			});
			const { error } = next ? await supabase.from("post_saves").upsert({
				post_id: postId,
				user_id: me
			}, {
				onConflict: "post_id,user_id",
				ignoreDuplicates: true
			}) : await supabase.from("post_saves").delete().eq("post_id", postId).eq("user_id", me);
			if (error) {
				console.error("Unable to update saved post", error);
				setSaved((prev) => ({
					...prev,
					[postId]: !next
				}));
				throw error;
			}
			return next;
		}, []),
		reload: load
	};
}
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
	const [showUI, setShowUI] = (0, import_react.useState)(true);
	const [menu, setMenu] = (0, import_react.useState)(null);
	const [toastMsg, setToastMsg] = (0, import_react.useState)(null);
	const [viewPortrait] = (0, import_react.useState)(!!portrait);
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
			v.loop = loop;
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
	(0, import_react.useEffect)(() => {
		const onFs = () => setFullscreen(!!document.fullscreenElement);
		document.addEventListener("fullscreenchange", onFs);
		return () => document.removeEventListener("fullscreenchange", onFs);
	}, []);
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
				if (!viewPortrait) try {
					await screen.orientation.lock?.("landscape");
				} catch {}
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
		if (g?.mode === "queue" && Math.abs(g.dy) > 90) onSwipeQueue?.(g.dy < 0 ? 1 : -1, viewPortrait);
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: wrapRef,
		onMouseMove: poke,
		className: cn("relative w-full overflow-hidden bg-black select-none", fullscreen ? "h-full w-full rounded-none" : cn("rounded-2xl", viewPortrait ? "aspect-[9/16]" : "aspect-video"), className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
				ref: vidRef,
				src,
				poster: poster ?? void 0,
				playsInline: true,
				preload: "auto",
				style: {
					filter: `brightness(${brightness})`,
					transform: fullscreen && zoom > 1 ? `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` : void 0,
					transformOrigin: "center center",
					transition: pinch.current ? "none" : "transform 120ms ease-out"
				},
				className: cn("h-full w-full", fullscreen ? "object-contain" : "object-cover"),
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
				onLoadedMetadata: (e) => {
					const video = e.currentTarget;
					setDur(video.duration || 0);
					setSourceHeight(video.videoHeight || 0);
					onOrientationChange?.(video.videoHeight > video.videoWidth);
					readMediaTracks();
				},
				onTimeUpdate: (e) => {
					const v = e.currentTarget;
					const previous = lastPlaybackTime.current;
					const delta = previous === null ? 0 : v.currentTime - previous;
					if (!v.paused && delta > 0 && delta <= Math.max(2.5, v.playbackRate * 2.5)) onWatchTime?.(delta);
					lastPlaybackTime.current = v.currentTime;
					setTime(v.currentTime);
					if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
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
/**
* Shows the custom thumbnail when present, otherwise falls back to the
* first frame of the video itself (`#t=0.5`) so cards never render blank.
*/
function VideoPoster({ thumbnailUrl, mediaUrl, alt, className }) {
	const [frameUrl, setFrameUrl] = (0, import_react.useState)(null);
	const [frameFailed, setFrameFailed] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setFrameFailed(false);
		if (thumbnailUrl || !mediaUrl) return;
		let alive = true;
		resolveLongVideoUrl(mediaUrl).then((url) => {
			if (alive && url) setFrameUrl(`${url}${url.includes("#") ? "" : "#t=0.5"}`);
		});
		return () => {
			alive = false;
		};
	}, [thumbnailUrl, mediaUrl]);
	if (thumbnailUrl) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: thumbnailUrl,
		alt,
		loading: "lazy",
		className: cn("h-full w-full object-cover", className)
	});
	if (frameUrl && !frameFailed) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
		src: frameUrl,
		muted: true,
		playsInline: true,
		preload: "metadata",
		"aria-label": alt,
		onError: () => setFrameFailed(true),
		className: cn("h-full w-full object-cover", className)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("h-full w-full bg-gradient-to-br from-zinc-800 to-zinc-900", className) });
}
//#endregion
export { usePostSaves as i, VideoPoster as n, deletePost as r, TrackedVideoPlayer as t };
