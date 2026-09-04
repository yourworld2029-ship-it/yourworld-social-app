import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $ as Radio, At as LoaderCircle, C as Trash2, D as Star, F as SlidersVertical, Fn as ArrowLeft, G as Search, Gt as FolderClock, It as Image, K as Scissors, N as Smile, Nn as AtSign, Q as Redo2, T as SwitchCamera, Tt as MapPin, Vt as Hash, Wt as Gauge, a as X, b as Type, bn as Check, c as VolumeX, ct as Pause, en as Earth, et as Plus, ft as Music, i as ZapOff, in as Copy, j as Sparkles, jt as Link2, k as SquareSplitHorizontal, l as Volume2, n as ZoomIn, pt as Music2, r as Zap, rn as Crop, t as ZoomOut, tt as Play, v as Upload, y as Undo2 } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { G as reelSequenceDuration, H as MAX_REEL_DURATION_MESSAGE, S as publishReel, U as MIN_REEL_DURATION_MESSAGE, V as MAX_REEL_CLIPS_MESSAGE, W as capReelSequence, c as Route$39, l as useUploads } from "./router-DtlJAjv-.mjs";
import { t as trackEvent } from "./analytics-DKfMtyUd.mjs";
import { t as NO_COPYRIGHT_MUSIC } from "./MusicVault-DRjBxX4j.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/create-BvNoztT2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CameraCapture({ onClose, onCapture, onPick, onDrafts, allowedModes }) {
	const modes = allowedModes && allowedModes.length ? allowedModes : [
		"POST",
		"REEL",
		"LIVE"
	];
	const videoRef = (0, import_react.useRef)(null);
	const streamRef = (0, import_react.useRef)(null);
	const recorderRef = (0, import_react.useRef)(null);
	const chunksRef = (0, import_react.useRef)([]);
	const pinchRef = (0, import_react.useRef)(null);
	const [facing, setFacing] = (0, import_react.useState)("user");
	const [mode, setMode] = (0, import_react.useState)(modes.includes("REEL") ? "REEL" : modes[0]);
	const [recording, setRecording] = (0, import_react.useState)(false);
	const [elapsed, setElapsed] = (0, import_react.useState)(0);
	const [zoom, setZoom] = (0, import_react.useState)(1);
	const [zoomRange, setZoomRange] = (0, import_react.useState)({
		min: 1,
		max: 5,
		native: false
	});
	const [error, setError] = (0, import_react.useState)(null);
	const [flash, setFlash] = (0, import_react.useState)("off");
	const [torchable, setTorchable] = (0, import_react.useState)(false);
	const [screenFlash, setScreenFlash] = (0, import_react.useState)(false);
	const [liveTitle, setLiveTitle] = (0, import_react.useState)("");
	const [isLive, setIsLive] = (0, import_react.useState)(false);
	const start = (0, import_react.useCallback)(async (mode) => {
		streamRef.current?.getTracks().forEach((t) => t.stop());
		let maxW = 1920;
		let maxFps = 60;
		try {
			const probe = navigator.mediaDevices.getSupportedConstraints?.() ?? {};
			if (probe.width && probe.frameRate) {
				const caps = (await navigator.mediaDevices.enumerateDevices()).find((d) => d.kind === "videoinput")?.getCapabilities?.();
				if (caps?.width?.max) maxW = Math.min(caps.width.max, 3840);
				if (caps?.frameRate?.max) maxFps = Math.min(caps.frameRate.max, 60);
			}
		} catch {}
		const audio = {
			echoCancellation: true,
			noiseSuppression: true,
			autoGainControl: true
		};
		const tiers = [
			{
				video: {
					facingMode: { ideal: mode },
					width: { ideal: maxW },
					height: { ideal: Math.round(maxW * 9 / 16) },
					frameRate: {
						ideal: maxFps,
						min: 24
					},
					resizeMode: "none"
				},
				audio
			},
			{
				video: {
					facingMode: { ideal: mode },
					width: { ideal: 1920 },
					height: { ideal: 1080 },
					frameRate: {
						ideal: Math.min(maxFps, 60),
						min: 24
					}
				},
				audio
			},
			{
				video: {
					facingMode: { ideal: mode },
					width: { ideal: 1280 },
					height: { ideal: 720 },
					frameRate: { ideal: 30 }
				},
				audio
			},
			{
				video: { facingMode: mode },
				audio: true
			},
			{
				video: true,
				audio: false
			}
		];
		let stream = null;
		for (const c of tiers) try {
			stream = await navigator.mediaDevices.getUserMedia(c);
			break;
		} catch {}
		if (!stream) {
			setError("Camera permission is blocked. Enable it in your browser settings.");
			return;
		}
		streamRef.current = stream;
		if (videoRef.current) {
			videoRef.current.srcObject = stream;
			videoRef.current.play().catch(() => {});
		}
		const caps = stream.getVideoTracks()[0]?.getCapabilities?.() ?? {};
		setTorchable(Boolean(caps.torch));
		if (caps.zoom && caps.zoom.max > caps.zoom.min) {
			setZoomRange({
				min: caps.zoom.min,
				max: caps.zoom.max,
				native: true
			});
			setZoom(caps.zoom.min);
		} else {
			setZoomRange({
				min: 1,
				max: 5,
				native: false
			});
			setZoom(1);
		}
		setError(null);
	}, []);
	const setTorch = (0, import_react.useCallback)(async (on) => {
		const track = streamRef.current?.getVideoTracks()[0];
		if (!track) return;
		try {
			await track.applyConstraints({ advanced: [{ torch: on }] });
		} catch {}
	}, []);
	/** Rough ambient-light read from the live preview, used by Auto mode. */
	const isDarkScene = (0, import_react.useCallback)(() => {
		const v = videoRef.current;
		if (!v || !v.videoWidth) return false;
		const c = document.createElement("canvas");
		c.width = 32;
		c.height = 32;
		const ctx = c.getContext("2d", { willReadFrequently: true });
		if (!ctx) return false;
		ctx.drawImage(v, 0, 0, 32, 32);
		const { data } = ctx.getImageData(0, 0, 32, 32);
		let sum = 0;
		for (let i = 0; i < data.length; i += 4) sum += .299 * data[i] + .587 * data[i + 1] + .114 * data[i + 2];
		return sum / (data.length / 4) < 70;
	}, []);
	const flashWanted = (0, import_react.useCallback)(() => flash === "on" ? true : flash === "auto" ? isDarkScene() : false, [flash, isDarkScene]);
	(0, import_react.useEffect)(() => {
		if (facing !== "environment") return;
		setTorch(flash === "on" && recording);
		return () => {
			setTorch(false);
		};
	}, [
		facing,
		flash,
		recording,
		setTorch
	]);
	(0, import_react.useEffect)(() => {
		start(facing);
		return () => {
			streamRef.current?.getTracks().forEach((t) => t.stop());
		};
	}, [facing, start]);
	const applyZoom = (0, import_react.useCallback)((next) => {
		const clamped = Math.min(zoomRange.max, Math.max(zoomRange.min, next));
		setZoom(clamped);
		if (!zoomRange.native) return;
		(streamRef.current?.getVideoTracks()[0])?.applyConstraints({ advanced: [{ zoom: clamped }] }).catch(() => {});
	}, [zoomRange]);
	const onTouchStart = (e) => {
		if (e.touches.length !== 2) return;
		const [a, b] = [e.touches[0], e.touches[1]];
		pinchRef.current = {
			dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
			zoom
		};
	};
	const onTouchMove = (e) => {
		if (e.touches.length !== 2 || !pinchRef.current) return;
		const [a, b] = [e.touches[0], e.touches[1]];
		const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
		applyZoom(pinchRef.current.zoom * (d / pinchRef.current.dist));
	};
	const onTouchEnd = () => {
		pinchRef.current = null;
	};
	(0, import_react.useEffect)(() => {
		const el = videoRef.current?.parentElement;
		if (!el) return;
		const onWheel = (e) => {
			e.preventDefault();
			const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
			applyZoom(zoom * Math.exp(-dy * .0015));
		};
		el.addEventListener("wheel", onWheel, { passive: false });
		return () => el.removeEventListener("wheel", onWheel);
	}, [applyZoom, zoom]);
	(0, import_react.useEffect)(() => {
		if (!recording) return;
		const id = window.setInterval(() => setElapsed((s) => s + 1), 1e3);
		return () => window.clearInterval(id);
	}, [recording]);
	(0, import_react.useEffect)(() => {
		if (recording && elapsed >= 80) stopRecording();
	}, [elapsed, recording]);
	const grabPhoto = () => {
		const v = videoRef.current;
		if (!v) return;
		const canvas = document.createElement("canvas");
		canvas.width = v.videoWidth || 1080;
		canvas.height = v.videoHeight || 1920;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		if (!zoomRange.native && zoom > 1) {
			const w = canvas.width / zoom;
			const h = canvas.height / zoom;
			ctx.drawImage(v, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h, 0, 0, canvas.width, canvas.height);
		} else ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
		canvas.toBlob((blob) => {
			if (!blob) return;
			onCapture([new File([blob], `yw_${Date.now()}.jpg`, { type: "image/jpeg" })]);
		}, "image/jpeg", .95);
	};
	const shootPhoto = async () => {
		if (!flashWanted()) return grabPhoto();
		if (facing === "user" || !torchable) {
			setScreenFlash(true);
			await new Promise((r) => window.setTimeout(r, 220));
			grabPhoto();
			window.setTimeout(() => setScreenFlash(false), 140);
		} else {
			await setTorch(true);
			await new Promise((r) => window.setTimeout(r, 260));
			grabPhoto();
			window.setTimeout(() => void setTorch(false), 200);
		}
	};
	const startRecording = () => {
		const stream = streamRef.current;
		if (!stream) return;
		if (mode === "REEL" && stream.getAudioTracks().length === 0) {
			toast.error("Microphone audio is required to record a reel.");
			return;
		}
		const mimeType = [
			"video/mp4;codecs=avc1,mp4a.40.2",
			"video/mp4;codecs=h264,aac",
			"video/mp4;codecs=avc1.640029,mp4a.40.2",
			"video/mp4",
			"video/webm;codecs=vp8,opus",
			"video/webm;codecs=vp9,opus",
			"video/webm;codecs=h264,opus",
			"video/webm"
		].find((t) => MediaRecorder.isTypeSupported(t));
		const s = stream.getVideoTracks()[0]?.getSettings() ?? {};
		const pixels = (s.width ?? 1920) * (s.height ?? 1080);
		const fpsFactor = (s.frameRate ?? 30) / 30;
		const videoBitsPerSecond = Math.round(Math.min(24e6, Math.max(4e6, pixels * .12 * fpsFactor)));
		const rec = new MediaRecorder(stream, mimeType ? {
			mimeType,
			videoBitsPerSecond,
			audioBitsPerSecond: 128e3
		} : { videoBitsPerSecond });
		chunksRef.current = [];
		rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
		rec.onstop = () => {
			const type = rec.mimeType || "video/webm";
			const blob = new Blob(chunksRef.current, { type });
			const ext = type.includes("mp4") ? "mp4" : "webm";
			onCapture([new File([blob], `yw_${Date.now()}.${ext}`, { type })]);
		};
		rec.start(1e3);
		recorderRef.current = rec;
		setElapsed(0);
		setRecording(true);
		if (flashWanted()) {
			if (facing === "user" || !torchable) setScreenFlash(true);
			else setTorch(true);
		}
	};
	const stopRecording = () => {
		recorderRef.current?.stop();
		recorderRef.current = null;
		setRecording(false);
		setScreenFlash(false);
		setTorch(false);
	};
	const onShutter = () => {
		if (mode === "LIVE") {
			if (isLive) {
				setIsLive(false);
				toast.success("Live ended");
				return;
			}
			setIsLive(true);
			toast.success(liveTitle ? `Going live: ${liveTitle}` : "You are live!");
			return;
		}
		if (mode === "POST") return void shootPhoto();
		if (recording) {
			if (elapsed < 5) {
				toast.error("Keep recording — reels need at least 5 seconds");
				return;
			}
			return stopRecording();
		}
		startRecording();
	};
	const zoomPct = (zoom - zoomRange.min) / (zoomRange.max - zoomRange.min) * 100;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex h-full w-full flex-col justify-between overflow-hidden bg-black text-white select-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 touch-none",
				style: {
					transform: "translateZ(0)",
					backfaceVisibility: "hidden",
					contain: "strict"
				},
				onTouchStart,
				onTouchMove,
				onTouchEnd,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
					ref: videoRef,
					autoPlay: true,
					playsInline: true,
					muted: true,
					disablePictureInPicture: true,
					className: "h-full w-full object-cover",
					style: {
						transform: `translateZ(0) ${facing === "user" ? "scaleX(-1) " : ""}scale(${zoomRange.native ? 1 : zoom})`,
						willChange: "transform",
						backfaceVisibility: "hidden",
						perspective: 1e3,
						imageRendering: "auto"
					}
				})
			}),
			screenFlash && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: `pointer-events-none absolute inset-0 z-40 bg-white transition-opacity duration-150 ${recording ? "opacity-40" : "opacity-95"}`
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-x-6 top-1/2 z-30 -translate-y-1/2 rounded-2xl bg-zinc-900/90 p-4 text-center text-xs font-semibold",
				children: error
			}),
			mode === "LIVE" && !isLive && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-x-0 top-20 z-30 flex justify-center px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-sm rounded-2xl border border-red-500/40 bg-black/70 p-3 backdrop-blur-md",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-red-400",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, { size: 12 }), " Live Title"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						value: liveTitle,
						onChange: (e) => setLiveTitle(e.target.value),
						maxLength: 80,
						placeholder: "Give your live a title...",
						className: "w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white placeholder-white/40 focus:border-red-500 focus:outline-none"
					})]
				})
			}),
			isLive && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute left-1/2 top-20 z-30 -translate-x-1/2 flex items-center gap-2 rounded-full bg-red-500/90 px-4 py-1.5 text-[11px] font-black uppercase tracking-wide shadow-lg",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 animate-pulse rounded-full bg-white" }),
					"LIVE",
					liveTitle && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "ml-1 font-bold normal-case opacity-90",
						children: ["· ", liveTitle]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-20 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						"aria-label": "Close camera",
						className: "rounded-full bg-black/40 p-2 backdrop-blur-md active:scale-90",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 20 })
					}),
					recording && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 rounded-full bg-red-500/90 px-3 py-1 text-[11px] font-black tabular-nums",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 animate-pulse rounded-full bg-white" }),
							String(Math.floor(elapsed / 60)).padStart(2, "0"),
							":",
							String(elapsed % 60).padStart(2, "0")
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setFlash((f) => f === "off" ? "on" : f === "on" ? "auto" : "off"),
							"aria-label": `Flashlight ${flash}`,
							title: facing === "environment" && !torchable && flash !== "off" ? "No LED detected — screen flash will be used" : `Flashlight ${flash}`,
							className: `relative rounded-full p-2 backdrop-blur-md active:scale-90 ${flash === "off" ? "bg-black/40 text-white" : "bg-yellow-400 text-black"}`,
							children: [flash === "off" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZapOff, { size: 20 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { size: 20 }), flash === "auto" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute -bottom-0.5 -right-0.5 rounded-full bg-black px-1 text-[8px] font-black leading-[12px] text-yellow-400",
								children: "A"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setFacing((f) => f === "user" ? "environment" : "user"),
							"aria-label": "Flip camera",
							className: "rounded-full bg-black/40 p-2 backdrop-blur-md active:scale-90",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchCamera, { size: 20 })
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomIn, {
						size: 14,
						className: "text-white/70"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex h-40 w-9 items-center justify-center rounded-full border border-white/10 bg-black/35 backdrop-blur-md",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute bottom-3 top-3 w-1 rounded-full bg-white/20" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "absolute bottom-3 w-1 rounded-full bg-white",
								style: { height: `calc((100% - 24px) * ${zoomPct / 100})` }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								"aria-label": "Zoom",
								min: zoomRange.min,
								max: zoomRange.max,
								step: (zoomRange.max - zoomRange.min) / 100,
								value: zoom,
								onChange: (e) => applyZoom(Number(e.target.value)),
								className: "absolute h-9 w-40 origin-center -rotate-90 cursor-pointer opacity-0"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomOut, {
						size: 14,
						className: "text-white/70"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-black tabular-nums",
						children: [zoom.toFixed(1), "x"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-20 flex flex-col items-center gap-4 bg-gradient-to-t from-black/80 to-transparent pb-6 pt-8",
				children: [modes.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-7 text-[11px] font-black uppercase tracking-wide",
					children: modes.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => !recording && setMode(m),
						className: mode === m ? "text-white" : "text-white/50",
						children: [m, mode === m && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mx-auto mt-1 block h-1 w-1 rounded-full bg-white" })]
					}, m))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex w-full items-center justify-around px-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: onPick,
							className: "flex flex-col items-center gap-1 active:scale-90",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-11 w-11 place-items-center rounded-2xl border border-white/25 bg-black/40 backdrop-blur-md",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { size: 20 })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] font-bold text-white/80",
								children: "Add"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: onShutter,
							"aria-label": mode === "LIVE" ? isLive ? "End live" : "Go live" : recording ? "Stop recording" : "Capture",
							className: mode === "LIVE" ? "flex h-16 items-center gap-2 rounded-full border-2 border-red-400 bg-red-500/90 px-8 font-black uppercase tracking-wide text-white shadow-[0_0_24px_rgba(239,68,68,0.6)] active:scale-95" : "grid h-20 w-20 place-items-center rounded-full border-4 border-white active:scale-95",
							children: mode === "LIVE" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, {
								size: 20,
								className: isLive ? "animate-pulse" : ""
							}), isLive ? "End Live" : "Go Live"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: recording ? "h-7 w-7 rounded-md bg-red-500 transition-all" : "h-14 w-14 rounded-full bg-red-500 transition-all" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: onDrafts,
							className: "flex flex-col items-center gap-1 active:scale-90",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-11 w-11 place-items-center rounded-2xl border border-white/25 bg-black/40 backdrop-blur-md",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderClock, { size: 20 })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] font-bold text-white/80",
								children: "Drafts"
							})]
						})
					]
				})]
			})
		]
	});
}
var peakCache = /* @__PURE__ */ new Map();
async function loadPeaks(url, buckets = 320) {
	const hit = peakCache.get(url);
	if (hit) return hit;
	const browserWindow = window;
	const Ctx = browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
	if (!Ctx) return [];
	const ctx = new Ctx();
	try {
		const buf = await (await fetch(url)).arrayBuffer();
		const data = (await ctx.decodeAudioData(buf.slice(0))).getChannelData(0);
		const step = Math.max(1, Math.floor(data.length / buckets));
		const peaks = [];
		for (let i = 0; i < buckets; i++) {
			let max = 0;
			const base = i * step;
			for (let j = 0; j < step; j += 8) {
				const v = Math.abs(data[base + j] || 0);
				if (v > max) max = v;
			}
			peaks.push(max);
		}
		const norm = Math.max(.02, Math.max(...peaks));
		const out = peaks.map((p) => p / norm);
		peakCache.set(url, out);
		return out;
	} catch {
		return [];
	} finally {
		ctx.close().catch(() => {});
	}
}
function Waveform({ url, from, to, duration }) {
	const [peaks, setPeaks] = (0, import_react.useState)([]);
	const canvasRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		let alive = true;
		loadPeaks(url).then((p) => {
			if (alive) setPeaks(p);
		});
		return () => {
			alive = false;
		};
	}, [url]);
	(0, import_react.useEffect)(() => {
		const c = canvasRef.current;
		if (!c) return;
		const w = c.clientWidth || 1;
		const h = c.clientHeight || 1;
		const dpr = window.devicePixelRatio || 1;
		c.width = Math.max(1, Math.floor(w * dpr));
		c.height = Math.max(1, Math.floor(h * dpr));
		const ctx = c.getContext("2d");
		if (!ctx) return;
		ctx.scale(dpr, dpr);
		ctx.clearRect(0, 0, w, h);
		if (!peaks.length || !duration) return;
		const a = Math.floor(from / duration * peaks.length);
		const b = Math.max(a + 1, Math.floor(to / duration * peaks.length));
		const slice = peaks.slice(a, b);
		const bars = Math.min(slice.length, Math.floor(w / 3));
		const bucket = Math.max(1, Math.floor(slice.length / Math.max(1, bars)));
		ctx.fillStyle = "rgba(5, 150, 105, 0.85)";
		for (let i = 0; i < bars; i++) {
			let max = 0;
			for (let j = 0; j < bucket; j++) {
				const v = slice[i * bucket + j] || 0;
				if (v > max) max = v;
			}
			const bh = Math.max(2, max * (h - 4));
			ctx.fillRect(i * 3, (h - bh) / 2, 2, bh);
		}
	}, [
		peaks,
		from,
		to,
		duration
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref: canvasRef,
		className: "absolute inset-0 w-full h-full"
	});
}
function AudioTrackLane({ track, totalDuration, currentTime = 0, onChange, onPick, onRemove, width }) {
	const laneRef = (0, import_react.useRef)(null);
	const total = Math.max(.5, totalDuration || .5);
	if (!track) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex items-center h-10 mt-1",
		style: { minWidth: width },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			onClick: onPick,
			style: { width },
			className: "h-10 flex items-center gap-2 px-3 rounded-md text-[10px] font-bold bg-muted text-muted-foreground border border-dashed border-border",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-3 h-3" }), " Add audio track"]
		})
	});
	const visible = Math.max(.1, track.clipEnd - track.clipStart);
	const audioPlaybackProgress = Math.min(1, Math.max(0, (currentTime - track.start) / Math.max(.1, visible)));
	const drag = (mode) => (e) => {
		e.preventDefault();
		e.stopPropagation();
		const lane = laneRef.current;
		if (!lane) return;
		const rect = lane.getBoundingClientRect();
		const startX = e.clientX;
		const base = { ...track };
		const secPerPx = total / Math.max(1, rect.width);
		const move = (ev) => {
			const d = (ev.clientX - startX) * secPerPx;
			if (mode === "move") {
				const next = Math.min(Math.max(0, base.start + d), Math.max(0, total - .1));
				onChange({
					...base,
					start: next
				});
			} else if (mode === "left") {
				const next = Math.min(Math.max(0, base.clipStart + d), base.clipEnd - .2);
				onChange({
					...base,
					clipStart: next
				});
			} else {
				const next = Math.max(Math.min(base.duration, base.clipEnd + d), base.clipStart + .2);
				onChange({
					...base,
					clipEnd: next
				});
			}
		};
		const up = () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
	};
	const leftPct = Math.min(100, track.start / total * 100);
	const widthPct = Math.max(6, Math.min(100 - leftPct, visible / total * 100));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-1",
		style: { minWidth: width },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: laneRef,
			className: "relative h-10 rounded-md bg-emerald-500/10 border border-emerald-500/30 overflow-hidden",
			style: { width },
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				onPointerDown: drag("move"),
				className: "absolute inset-y-0 bg-emerald-500/25 border border-emerald-600/50 rounded-md touch-none cursor-grab overflow-hidden",
				style: {
					left: `${leftPct}%`,
					width: `${widthPct}%`
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pointer-events-none absolute inset-y-0 z-10 w-px bg-white shadow-[0_0_7px_rgba(255,255,255,0.9)]",
						style: { left: `${audioPlaybackProgress * 100}%` }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waveform, {
						url: track.url,
						from: track.clipStart,
						to: track.clipEnd,
						duration: track.duration || track.clipEnd
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute inset-x-0 top-0 flex items-center gap-1 px-4 pointer-events-none",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Music2, { className: "w-2.5 h-2.5 text-emerald-800 flex-shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[9px] font-black text-emerald-900 truncate",
							children: track.title
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						onPointerDown: drag("left"),
						className: "absolute left-0 inset-y-0 w-3 bg-emerald-600 cursor-ew-resize touch-none flex items-center justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-4 w-[2px] bg-white/80 rounded" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						onPointerDown: drag("right"),
						className: "absolute right-0 inset-y-0 w-3 bg-emerald-600 cursor-ew-resize touch-none flex items-center justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-4 w-[2px] bg-white/80 rounded" })
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between px-1 pt-0.5",
			style: { width },
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-[9px] font-mono text-muted-foreground",
				children: [
					"in ",
					track.clipStart.toFixed(1),
					"s · out ",
					track.clipEnd.toFixed(1),
					"s · @",
					" ",
					track.start.toFixed(1),
					"s"
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onPick,
					className: "text-[9px] font-black uppercase text-emerald-700",
					children: "Change"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onRemove,
					className: "text-destructive",
					"aria-label": "Remove audio",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-3 h-3" })
				})]
			})]
		})]
	});
}
var BASE_CELL = 112;
var fmt = (s) => {
	const t = Math.max(0, Math.floor(s || 0));
	return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};
var clipLen = (c) => {
	const dur = c.duration || 0;
	const start = c.trimStart ?? 0;
	const end = c.trimEnd ?? dur;
	return Math.min(90, Math.max(.1, end - start));
};
var thumbCache = /* @__PURE__ */ new Map();
var thumbInFlight = /* @__PURE__ */ new Map();
var thumbnailWorker;
var thumbnailRequestId = 0;
var thumbnailWorkerRequests = /* @__PURE__ */ new Map();
function getThumbnailWorker() {
	if (thumbnailWorker !== void 0) return thumbnailWorker;
	if (typeof Worker === "undefined") {
		thumbnailWorker = null;
		return thumbnailWorker;
	}
	try {
		const worker = new Worker(new URL("./thumbnail-worker.ts", import.meta.url), { type: "module" });
		worker.addEventListener("message", (event) => {
			const pending = thumbnailWorkerRequests.get(event.data.id);
			if (!pending) return;
			thumbnailWorkerRequests.delete(event.data.id);
			if (event.data.blob) pending.resolve(event.data.blob);
			else pending.reject(new Error(event.data.error ?? "thumbnail encode failed"));
		});
		worker.addEventListener("error", () => {
			for (const [id, pending] of thumbnailWorkerRequests) {
				thumbnailWorkerRequests.delete(id);
				pending.reject(/* @__PURE__ */ new Error("thumbnail worker failed"));
			}
			worker.terminate();
			thumbnailWorker = null;
		});
		thumbnailWorker = worker;
	} catch {
		thumbnailWorker = null;
	}
	return thumbnailWorker;
}
function encodeThumbnailInWorker(bitmap, width, height) {
	const worker = getThumbnailWorker();
	if (!worker) return Promise.reject(/* @__PURE__ */ new Error("thumbnail worker unavailable"));
	const id = ++thumbnailRequestId;
	return new Promise((resolve, reject) => {
		thumbnailWorkerRequests.set(id, {
			resolve,
			reject
		});
		try {
			worker.postMessage({
				id,
				bitmap,
				width,
				height
			}, [bitmap]);
		} catch (error) {
			thumbnailWorkerRequests.delete(id);
			reject(error instanceof Error ? error : /* @__PURE__ */ new Error("thumbnail transfer failed"));
		}
	});
}
function grabFrame(url, time) {
	const key = `${url}@${time.toFixed(2)}`;
	const hit = thumbCache.get(key);
	if (hit) return Promise.resolve(hit);
	const inflight = thumbInFlight.get(key);
	if (inflight) return inflight;
	const pending = new Promise((resolve, reject) => {
		const v = document.createElement("video");
		v.crossOrigin = "anonymous";
		v.muted = true;
		v.playsInline = true;
		v.preload = "auto";
		v.src = url;
		const cleanup = () => {
			v.removeAttribute("src");
			try {
				v.load();
			} catch {}
		};
		const capture = async () => {
			try {
				const w = 160;
				const ratio = v.videoHeight ? v.videoHeight / v.videoWidth : 16 / 9;
				const h = Math.max(1, Math.round(w * ratio));
				let blob = null;
				if (typeof createImageBitmap === "function" && getThumbnailWorker()) try {
					blob = await encodeThumbnailInWorker(await createImageBitmap(v), w, h);
				} catch {}
				if (!blob) {
					const canvas = Object.assign(document.createElement("canvas"), {
						width: w,
						height: h
					});
					const ctx = canvas.getContext("2d");
					if (!ctx) throw new Error("no thumbnail context");
					ctx.drawImage(v, 0, 0, w, h);
					blob = await new Promise((blobResolve, blobReject) => {
						canvas.toBlob((value) => value ? blobResolve(value) : blobReject(/* @__PURE__ */ new Error("thumbnail blob failed")), "image/jpeg", .65);
					});
				}
				const data = URL.createObjectURL(blob);
				thumbCache.set(key, data);
				cleanup();
				resolve(data);
			} catch (e) {
				cleanup();
				reject(e);
			}
		};
		let settled = false;
		let seekTimer = null;
		const finish = (fn) => {
			if (settled) return;
			settled = true;
			if (seekTimer) clearTimeout(seekTimer);
			v.removeEventListener("seeked", onSeeked);
			fn();
		};
		const onSeeked = () => {
			capture().catch((error) => finish(() => {
				cleanup();
				reject(error);
			}));
		};
		const onLoaded = () => {
			const t = Math.min(Math.max(.05, time), Math.max(.05, (v.duration || 1) - .05));
			v.addEventListener("seeked", onSeeked, { once: true });
			seekTimer = setTimeout(() => {
				if (v.readyState >= 2) onSeeked();
				else finish(() => {
					cleanup();
					reject(/* @__PURE__ */ new Error("thumbnail seek timed out"));
				});
			}, 1500);
			try {
				v.currentTime = t;
			} catch {
				onSeeked();
			}
		};
		const onError = () => finish(() => {
			cleanup();
			reject(/* @__PURE__ */ new Error("thumb load failed"));
		});
		v.addEventListener("loadeddata", onLoaded, { once: true });
		v.addEventListener("error", onError, { once: true });
	});
	thumbInFlight.set(key, pending);
	pending.then(() => thumbInFlight.delete(key), () => thumbInFlight.delete(key));
	return pending;
}
function useThumbnails(clips) {
	const [thumbs, setThumbs] = (0, import_react.useState)({});
	const sig = clips.map((c) => `${c.id}:${c.url ?? ""}`).join("|");
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		(async () => {
			for (const c of clips) {
				if (!c.url) continue;
				const at = (c.trimStart ?? 0) + .1;
				try {
					const data = await grabFrame(c.url, at);
					if (cancelled) return;
					setThumbs((prev) => prev[c.id] === data ? prev : {
						...prev,
						[c.id]: data
					});
				} catch {}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [sig]);
	return thumbs;
}
function LightTimelineBase({ clips, activeIndex, currentTime, totalDuration: requestedTotalDuration, playFraction, isPlaying, audioLabel: _audioLabel, onAddAudio, isMuted, onToggleMute, onSelect, onAdd, onTrim, onScrub, onReorder, audioTrack, onAudioChange, onAudioRemove }) {
	const totalDuration = Math.min(90, Math.max(0, requestedTotalDuration));
	const scrollRef = (0, import_react.useRef)(null);
	const userScrollRef = (0, import_react.useRef)(false);
	const userTimer = (0, import_react.useRef)(null);
	const padRef = (0, import_react.useRef)(0);
	const [dragIndex, setDragIndex] = (0, import_react.useState)(null);
	const [dragOffset, setDragOffset] = (0, import_react.useState)(0);
	const dragRef = (0, import_react.useRef)(null);
	const pressTimer = (0, import_react.useRef)(null);
	const thumbs = useThumbnails(clips);
	const [timelineZoom, setTimelineZoom] = (0, import_react.useState)(1);
	const cell = Math.round(BASE_CELL * timelineZoom);
	const pinchRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const el = scrollRef.current;
		if (!el) return;
		const set = () => {
			padRef.current = el.clientWidth / 2;
			el.style.paddingLeft = `${padRef.current}px`;
			el.style.paddingRight = `${padRef.current}px`;
		};
		set();
		window.addEventListener("resize", set);
		return () => window.removeEventListener("resize", set);
	}, []);
	(0, import_react.useEffect)(() => {
		const el = scrollRef.current;
		if (!el) return;
		const distance = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
		const start = (event) => {
			if (event.touches.length === 2) pinchRef.current = {
				distance: distance(event.touches[0], event.touches[1]),
				zoom: timelineZoom
			};
		};
		const move = (event) => {
			const pinch = pinchRef.current;
			if (!pinch || event.touches.length !== 2) return;
			const nextDistance = distance(event.touches[0], event.touches[1]);
			const nextZoom = Math.min(2.25, Math.max(.75, pinch.zoom * (nextDistance / Math.max(1, pinch.distance))));
			setTimelineZoom(nextZoom);
		};
		const end = () => {
			pinchRef.current = null;
		};
		el.addEventListener("touchstart", start, { passive: true });
		el.addEventListener("touchmove", move, { passive: true });
		el.addEventListener("touchend", end, { passive: true });
		el.addEventListener("touchcancel", end, { passive: true });
		return () => {
			el.removeEventListener("touchstart", start);
			el.removeEventListener("touchmove", move);
			el.removeEventListener("touchend", end);
			el.removeEventListener("touchcancel", end);
		};
	}, [timelineZoom]);
	const autoRaf = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const el = scrollRef.current;
		if (!el || userScrollRef.current) return;
		const frac = playFraction ?? 0;
		const target = activeIndex * cell + frac * cell;
		if (autoRaf.current) cancelAnimationFrame(autoRaf.current);
		autoRaf.current = requestAnimationFrame(() => {
			autoRaf.current = null;
			if (userScrollRef.current) return;
			if (Math.abs(el.scrollLeft - target) > .5) el.scrollLeft = target;
		});
		return () => {
			if (autoRaf.current) cancelAnimationFrame(autoRaf.current);
			autoRaf.current = null;
		};
	}, [
		activeIndex,
		playFraction,
		cell
	]);
	const scrubRaf = (0, import_react.useRef)(null);
	const handleScroll = (0, import_react.useCallback)(() => {
		const el = scrollRef.current;
		if (!el || !userScrollRef.current || !onScrub) return;
		if (scrubRaf.current) return;
		scrubRaf.current = requestAnimationFrame(() => {
			scrubRaf.current = null;
			const x = Math.max(0, el.scrollLeft);
			const idx = Math.min(clips.length - 1, Math.floor(x / cell));
			onScrub(idx, Math.min(1, Math.max(0, (x - idx * cell) / cell)));
		});
	}, [
		clips.length,
		onScrub,
		cell
	]);
	const markUser = (0, import_react.useCallback)(() => {
		userScrollRef.current = true;
		if (userTimer.current) clearTimeout(userTimer.current);
		userTimer.current = setTimeout(() => {
			userScrollRef.current = false;
		}, 260);
	}, []);
	const beginPress = (index) => (e) => {
		if (!onReorder) return;
		const startX = e.clientX;
		if (pressTimer.current) clearTimeout(pressTimer.current);
		pressTimer.current = setTimeout(() => {
			dragRef.current = {
				index,
				startX,
				moved: false
			};
			setDragIndex(index);
			setDragOffset(0);
			if (navigator.vibrate) try {
				navigator.vibrate(12);
			} catch {}
		}, 320);
		const move = (ev) => {
			const d = dragRef.current;
			if (!d) {
				if (Math.abs(ev.clientX - startX) > 6 && pressTimer.current) {
					clearTimeout(pressTimer.current);
					pressTimer.current = null;
				}
				return;
			}
			d.moved = true;
			setDragOffset(ev.clientX - d.startX);
		};
		const up = () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
			if (pressTimer.current) {
				clearTimeout(pressTimer.current);
				pressTimer.current = null;
			}
			const d = dragRef.current;
			dragRef.current = null;
			if (d) {
				const shift = Math.round(dragOffsetRef.current / cell);
				const to = Math.min(clips.length - 1, Math.max(0, d.index + shift));
				if (to !== d.index) onReorder?.(d.index, to);
			}
			setDragIndex(null);
			setDragOffset(0);
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
	};
	const dragOffsetRef = (0, import_react.useRef)(0);
	dragOffsetRef.current = dragOffset;
	const snapMarkers = (0, import_react.useMemo)(() => {
		let offset = 0;
		return clips.slice(0, -1).map((clip, index) => {
			offset += clipLen(clip);
			return {
				index,
				left: offset / Math.max(totalDuration, .1) * clips.length * cell
			};
		});
	}, [
		clips,
		totalDuration,
		cell
	]);
	const audioMarkerLeft = audioTrack ? audioTrack.start / Math.max(totalDuration, .1) * clips.length * cell : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full select-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between px-4 pb-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onToggleMute,
						className: "grid h-7 w-7 place-items-center rounded-full bg-muted/70 text-muted-foreground transition-transform duration-150 active:scale-90",
						"aria-label": isMuted ? "Unmute" : "Mute",
						children: isMuted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "w-3.5 h-3.5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "rounded-full bg-muted/60 px-3 py-0.5 text-[11px] font-black tabular-nums text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
						children: [
							fmt(currentTime),
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted-foreground",
								children: ["/ ", fmt(totalDuration)]
							})
						]
					}),
					clips.length < 5 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onAdd,
						className: "grid h-7 w-7 place-items-center rounded-full bg-muted/70 text-muted-foreground transition-transform duration-150 active:scale-90",
						"aria-label": "Add clip",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-3.5 h-3.5" })
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "w-7 text-center text-[9px] font-black text-orange-500",
						"aria-label": "Maximum clips reached",
						children: "5/5"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-none absolute left-1/2 top-0 bottom-0 z-20 -translate-x-1/2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-[2px] rounded-full bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.55)]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-orange-500 shadow" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					ref: scrollRef,
					onScroll: handleScroll,
					onPointerDown: markUser,
					onTouchStart: markUser,
					onWheel: markUser,
					className: "overflow-x-auto overflow-y-hidden scrollbar-none overscroll-x-contain",
					style: {
						WebkitOverflowScrolling: "touch",
						touchAction: "pan-x",
						contain: "paint"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex items-center h-16",
						style: {
							width: Math.max(cell, clips.length * cell),
							willChange: "transform"
						},
						children: [
							clips.map((clip, i) => {
								const selected = i === activeIndex;
								const dur = clip.duration || 0;
								const tStart = clip.trimStart ?? 0;
								const tEnd = clip.trimEnd ?? dur;
								const startPct = dur ? tStart / dur * 100 : 0;
								const endPct = dur ? tEnd / dur * 100 : 100;
								const trimDrag = (side) => (e) => {
									if (!onTrim || !dur) return;
									e.preventDefault();
									e.stopPropagation();
									const cellEl = e.currentTarget.parentElement;
									if (!cellEl) return;
									const rect = cellEl.getBoundingClientRect();
									const move = (ev) => {
										const t = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width)) * dur;
										if (side === "start") onTrim(i, Math.min(t, tEnd - .2), tEnd);
										else onTrim(i, tStart, Math.max(t, tStart + .2));
									};
									const up = () => {
										window.removeEventListener("pointermove", move);
										window.removeEventListener("pointerup", up);
									};
									window.addEventListener("pointermove", move);
									window.addEventListener("pointerup", up);
								};
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									onPointerDown: beginPress(i),
									onPointerUp: () => {
										if (dragIndex === null) onSelect?.(i);
									},
									style: {
										width: cell,
										transform: dragIndex === i ? `translate3d(${dragOffset}px,0,0) scale(1.06)` : "translate3d(0,0,0)",
										zIndex: dragIndex === i ? 30 : void 0,
										touchAction: dragIndex === i ? "none" : void 0,
										willChange: dragIndex === i ? "transform" : void 0,
										transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)"
									},
									className: `relative h-16 flex-shrink-0 bg-muted overflow-hidden cursor-pointer duration-200 [transition-property:opacity,transform,box-shadow] ${dragIndex === i ? "shadow-2xl ring-2 ring-inset ring-orange-500 opacity-100" : ""} ${selected ? "opacity-100 ring-2 ring-inset ring-orange-500 z-10 shadow-[0_6px_18px_-8px_rgba(249,115,22,0.8)]" : "opacity-45"}`,
									children: [
										thumbs[clip.id] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: thumbs[clip.id],
											alt: "",
											draggable: false,
											loading: "lazy",
											decoding: "async",
											className: "absolute inset-0 w-full h-full object-cover pointer-events-none"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "absolute inset-x-0 bottom-0 flex items-center justify-center bg-background/55 backdrop-blur-[2px]",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-[9px] font-black tabular-nums text-foreground/80",
												children: [
													"#",
													i + 1,
													" · ",
													clipLen(clip).toFixed(1),
													"s"
												]
											})
										}),
										i > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute left-0 top-0 bottom-0 w-[2px] bg-background" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "absolute inset-y-0 left-0 bg-background/70 pointer-events-none",
											style: { width: `${startPct}%` }
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "absolute inset-y-0 right-0 bg-background/70 pointer-events-none",
											style: { width: `${100 - endPct}%` }
										}),
										selected && dur > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											onPointerDown: trimDrag("start"),
											className: "absolute inset-y-0 w-3 rounded-l-md bg-orange-500 cursor-ew-resize touch-none flex items-center justify-center z-20 shadow-md",
											style: { left: `${startPct}%` },
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-5 w-[2px] bg-white/90 rounded" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											onPointerDown: trimDrag("end"),
											className: "absolute inset-y-0 w-3 -translate-x-full rounded-r-md bg-orange-500 cursor-ew-resize touch-none flex items-center justify-center z-20 shadow-md",
											style: { left: `${endPct}%` },
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-5 w-[2px] bg-white/90 rounded" })
										})] })
									]
								}, clip.id || i);
							}),
							snapMarkers.map((marker) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "pointer-events-none absolute top-0 bottom-0 w-px bg-white/35",
								style: { left: marker.left }
							}, `cut-${marker.index}`)),
							audioMarkerLeft !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "pointer-events-none absolute top-0 bottom-0 w-px bg-emerald-300/75 shadow-[0_0_8px_rgba(110,231,183,0.7)]",
								style: { left: audioMarkerLeft }
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudioTrackLane, {
						track: audioTrack ?? null,
						totalDuration,
						currentTime,
						width: Math.max(cell, clips.length * cell),
						onChange: (next) => onAudioChange?.(next),
						onPick: () => onAddAudio?.(),
						onRemove: () => onAudioRemove?.()
					})]
				})]
			}),
			isPlaying ? null : null
		]
	});
}
var LightTimeline = import_react.memo(LightTimelineBase);
var vertexSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = vec2((a_position.x + 1.0) * 0.5, (1.0 - a_position.y) * 0.5);
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;
var fragmentSource = `
  precision mediump float;
  varying vec2 v_uv;
  uniform sampler2D u_texture;
  uniform vec2 u_mediaScale;
  uniform float u_contrast;
  uniform float u_saturation;
  uniform float u_warmth;
  uniform float u_grain;
  uniform float u_time;
  uniform int u_filter;

  vec3 hueShift(vec3 color, float angle) {
    const mat3 toYIQ = mat3(
      0.299, 0.587, 0.114,
      0.596, -0.275, -0.321,
      0.212, -0.523, 0.311
    );
    const mat3 toRGB = mat3(
      1.0, 0.956, 0.621,
      1.0, -0.272, -0.647,
      1.0, -1.106, 1.703
    );
    vec3 yiq = toYIQ * color;
    float hue = atan(yiq.z, yiq.y) + angle;
    float chroma = sqrt(yiq.y * yiq.y + yiq.z * yiq.z);
    return clamp(toRGB * vec3(yiq.x, chroma * cos(hue), chroma * sin(hue)), 0.0, 1.0);
  }

  void main() {
    vec2 uv = (v_uv - 0.5) / u_mediaScale + 0.5;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.0);
      return;
    }
    vec4 source = texture2D(u_texture, uv);
    vec3 color = source.rgb;
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    float saturation = u_saturation;
    float contrast = u_contrast;

    if (u_filter == 1) {
      saturation *= 1.35;
      contrast *= 1.08;
    } else if (u_filter == 2) {
      color = vec3(luminance);
      contrast *= 1.16;
    } else if (u_filter == 3) {
      color = hueShift(color, 1.15);
      saturation *= 1.35;
      contrast *= 1.12;
    } else if (u_filter == 4) {
      color.r += 0.06;
      color.b -= 0.035;
      saturation *= 1.15;
    }

    color = mix(vec3(luminance), color, saturation);
    color = (color - 0.5) * contrast + 0.5;
    color.r += u_warmth * 0.08;
    color.b -= u_warmth * 0.05;

    float noise = fract(sin(dot(v_uv * (u_time + 1.0), vec2(12.9898, 78.233))) * 43758.5453);
    color += (noise - 0.5) * u_grain;
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), source.a);
  }
`;
function compileShader(gl, type, source) {
	const shader = gl.createShader(type);
	if (!shader) throw new Error("WebGL shader unavailable");
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const error = gl.getShaderInfoLog(shader) ?? "shader compile failed";
		gl.deleteShader(shader);
		throw new Error(error);
	}
	return shader;
}
function createProgram(gl) {
	const program = gl.createProgram();
	if (!program) throw new Error("WebGL program unavailable");
	const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
	const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "WebGL program link failed");
	return program;
}
function GpuVideoPreview({ videoRef, filter, contrast = 1, saturation = 1, warmth = 0, grain = 0, className, style, onCapability }) {
	const canvasRef = (0, import_react.useRef)(null);
	const settingsRef = (0, import_react.useRef)({
		filter,
		contrast,
		saturation,
		warmth,
		grain
	});
	settingsRef.current = {
		filter,
		contrast,
		saturation,
		warmth,
		grain
	};
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const gl = canvas.getContext("webgl", {
			alpha: false,
			antialias: false,
			powerPreference: "high-performance",
			preserveDrawingBuffer: false
		});
		if (!gl) {
			onCapability?.(false);
			return;
		}
		let program;
		try {
			program = createProgram(gl);
		} catch (error) {
			console.warn("[reel-editor] WebGL preview unavailable", error);
			onCapability?.(false);
			return;
		}
		const position = gl.createBuffer();
		const texture = gl.createTexture();
		if (!position || !texture) {
			onCapability?.(false);
			return;
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, position);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			-1,
			-1,
			1,
			-1,
			-1,
			1,
			1,
			1
		]), gl.STATIC_DRAW);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.useProgram(program);
		const positionLocation = gl.getAttribLocation(program, "a_position");
		gl.enableVertexAttribArray(positionLocation);
		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
		const locations = {
			mediaScale: gl.getUniformLocation(program, "u_mediaScale"),
			contrast: gl.getUniformLocation(program, "u_contrast"),
			saturation: gl.getUniformLocation(program, "u_saturation"),
			warmth: gl.getUniformLocation(program, "u_warmth"),
			grain: gl.getUniformLocation(program, "u_grain"),
			time: gl.getUniformLocation(program, "u_time"),
			filter: gl.getUniformLocation(program, "u_filter")
		};
		const filterIds = {
			none: 0,
			vivid: 1,
			noir: 2,
			cyber: 3,
			warm: 4
		};
		let raf = 0;
		let alive = true;
		const resize = () => {
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
			const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
			if (canvas.width !== width || canvas.height !== height) {
				canvas.width = width;
				canvas.height = height;
				gl.viewport(0, 0, width, height);
			}
		};
		const resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(canvas);
		onCapability?.(true);
		const draw = (now) => {
			if (!alive) return;
			resize();
			const currentVideo = videoRef.current;
			if (currentVideo && currentVideo.readyState >= 2 && currentVideo.videoWidth > 0) {
				const canvasRatio = canvas.width / Math.max(1, canvas.height);
				const videoRatio = currentVideo.videoWidth / Math.max(1, currentVideo.videoHeight);
				const mediaScale = canvasRatio > videoRatio ? [1, videoRatio / canvasRatio] : [canvasRatio / videoRatio, 1];
				const settings = settingsRef.current;
				gl.useProgram(program);
				gl.bindTexture(gl.TEXTURE_2D, texture);
				try {
					gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, currentVideo);
					gl.uniform2f(locations.mediaScale, mediaScale[0], mediaScale[1]);
					gl.uniform1f(locations.contrast, settings.contrast);
					gl.uniform1f(locations.saturation, settings.saturation);
					gl.uniform1f(locations.warmth, settings.warmth);
					gl.uniform1f(locations.grain, settings.grain);
					gl.uniform1f(locations.time, now * .001);
					gl.uniform1i(locations.filter, filterIds[settings.filter]);
					gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
				} catch {
					onCapability?.(false);
				}
			}
			raf = requestAnimationFrame(draw);
		};
		raf = requestAnimationFrame(draw);
		return () => {
			alive = false;
			cancelAnimationFrame(raf);
			resizeObserver.disconnect();
			gl.deleteTexture(texture);
			gl.deleteBuffer(position);
			gl.deleteProgram(program);
		};
	}, [onCapability, videoRef]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref: canvasRef,
		"aria-hidden": "true",
		className,
		style: {
			...style,
			pointerEvents: "none",
			willChange: "contents"
		}
	});
}
/**
* Bakes the selected music track into the exported reel.
*
* Plays the clip in real time, draws every frame to a canvas and mixes the
* clip's own audio with the trimmed music through the Web Audio API, then
* records the combined stream with MediaRecorder.
*/
function getAudioContextConstructor() {
	const browserWindow = window;
	return browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
}
function pickMime() {
	return [
		"video/webm;codecs=vp9,opus",
		"video/webm;codecs=vp8,opus",
		"video/mp4",
		"video/webm"
	].find((m) => MediaRecorder.isTypeSupported?.(m));
}
function getReelRenderCapabilities() {
	const canCapture = typeof HTMLCanvasElement !== "undefined" && typeof HTMLCanvasElement.prototype.captureStream === "function";
	const hasWebCodecs = typeof window !== "undefined" && "VideoEncoder" in window && "VideoFrame" in window;
	return {
		canCapture,
		mediaRecorder: typeof MediaRecorder !== "undefined",
		webCodecs: hasWebCodecs,
		preferredEncoder: hasWebCodecs ? "webcodecs" : "media-recorder"
	};
}
function canMuxReel() {
	const capabilities = getReelRenderCapabilities();
	return typeof window !== "undefined" && capabilities.mediaRecorder && !!getAudioContextConstructor() && capabilities.canCapture;
}
/** Returns an object URL of the rendered video (with music), or null on failure. */
async function renderReelWithMusic(opts) {
	if (!canMuxReel()) return null;
	const { videoUrl, music } = opts;
	const video = document.createElement("video");
	video.src = videoUrl;
	video.crossOrigin = "anonymous";
	video.playsInline = true;
	video.muted = false;
	video.defaultMuted = false;
	video.volume = 1;
	video.preload = "auto";
	const audio = music ? new Audio() : null;
	if (audio && music) {
		audio.src = music.url;
		audio.crossOrigin = "anonymous";
		audio.muted = false;
		audio.defaultMuted = false;
		audio.volume = 1;
		audio.preload = "auto";
	}
	const Ctx = getAudioContextConstructor();
	if (!Ctx) return null;
	const actx = new Ctx();
	let recorder = null;
	const cleanup = () => {
		try {
			if (recorder?.state !== "inactive") recorder?.stop();
		} catch {}
		try {
			video.pause();
		} catch {}
		try {
			audio?.pause();
		} catch {}
		actx.close().catch(() => {});
	};
	try {
		await new Promise((resolve, reject) => {
			const ok = () => resolve();
			video.addEventListener("loadedmetadata", ok, { once: true });
			video.addEventListener("error", () => reject(/* @__PURE__ */ new Error("video load")), { once: true });
			video.load();
		});
		if (audio) await new Promise((resolve) => {
			if (audio.readyState >= 1) return resolve();
			audio.addEventListener("loadedmetadata", () => resolve(), { once: true });
			audio.addEventListener("error", () => resolve(), { once: true });
			audio.load();
		});
		const start = Math.max(0, opts.trimStart ?? 0);
		const requestedEnd = opts.trimEnd;
		const end = Math.min(video.duration || 0, start + 90, requestedEnd != null && requestedEnd > start ? requestedEnd : video.duration || 0);
		const span = Math.max(.2, end - start);
		if (span < 5) throw new Error("Reel duration is below the minimum");
		const sourceWidth = video.videoWidth || 720;
		const sourceHeight = video.videoHeight || 1280;
		const landscape = sourceWidth >= sourceHeight;
		const maxDimension = opts.resolution === "HD" ? 1920 : 3840;
		const maxShortDimension = opts.resolution === "HD" ? 1080 : 2160;
		const scale = landscape ? Math.min(maxDimension / sourceWidth, maxShortDimension / sourceHeight) : Math.min(maxShortDimension / sourceWidth, maxDimension / sourceHeight);
		const canvas = document.createElement("canvas");
		canvas.width = Math.max(2, Math.round(sourceWidth * scale));
		canvas.height = Math.max(2, Math.round(sourceHeight * scale));
		const g = canvas.getContext("2d", { alpha: false });
		if (!g) throw new Error("no canvas ctx");
		const dest = actx.createMediaStreamDestination();
		let sourceAudioConnected = false;
		try {
			const vSrc = actx.createMediaElementSource(video);
			const vGain = actx.createGain();
			vGain.gain.value = .85;
			vSrc.connect(vGain).connect(dest);
			sourceAudioConnected = true;
		} catch {}
		if (audio && music) {
			const aSrc = actx.createMediaElementSource(audio);
			const aGain = actx.createGain();
			aGain.gain.value = music.volume ?? 1;
			aSrc.connect(aGain).connect(dest);
		}
		const fps = opts.fps ?? 60;
		const stream = new MediaStream([...canvas.captureStream(fps).getVideoTracks(), ...dest.stream.getAudioTracks()]);
		if (!sourceAudioConnected && !music) throw new Error("The source video has no audio track to preserve.");
		const mime = pickMime();
		recorder = new MediaRecorder(stream, mime ? {
			mimeType: mime,
			videoBitsPerSecond: opts.resolution === "HD" ? 18e6 : 5e7,
			audioBitsPerSecond: 256e3
		} : void 0);
		const chunks = [];
		recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
		const done = new Promise((resolve) => {
			recorder.onstop = () => resolve(new Blob(chunks, { type: mime || "video/webm" }));
		});
		video.currentTime = start;
		await new Promise((r) => video.addEventListener("seeked", () => r(), { once: true }));
		const speed = Math.min(10, Math.max(.1, opts.speed ?? 1));
		const ramp = opts.speedRamp ?? "constant";
		const playbackRateAt = () => {
			const progress = Math.min(1, Math.max(0, (video.currentTime - start) / span));
			if (ramp === "up") return .1 + (speed - .1) * progress;
			if (ramp === "down") return speed - (speed - .1) * progress;
			return speed;
		};
		video.playbackRate = speed;
		const videoWithPitch = video;
		if ("preservesPitch" in videoWithPitch) videoWithPitch.preservesPitch = true;
		if ("webkitPreservesPitch" in videoWithPitch) videoWithPitch.webkitPreservesPitch = true;
		if (audio) {
			audio.playbackRate = speed;
			const audioWithPitch = audio;
			if ("preservesPitch" in audioWithPitch) audioWithPitch.preservesPitch = true;
			if ("webkitPreservesPitch" in audioWithPitch) audioWithPitch.webkitPreservesPitch = true;
		}
		await actx.resume().catch(() => {});
		await video.play();
		recorder.start(200);
		const musicSpan = music ? Math.max(.2, music.clipEnd - music.clipStart) : 0;
		const filter = opts.filter ?? "none";
		const gradingFilter = [
			filter === "vivid" ? "saturate(1.35) contrast(1.08)" : filter === "noir" ? "grayscale(1) contrast(1.16)" : filter === "cyber" ? "saturate(1.35) hue-rotate(65deg) contrast(1.12)" : filter === "warm" ? "sepia(0.22) saturate(1.15) brightness(1.03)" : "",
			`contrast(${opts.contrast ?? 1})`,
			`saturate(${opts.saturation ?? 1})`,
			opts.warmth ? `sepia(${Math.min(1, Math.abs(opts.warmth) * .28)})` : "",
			opts.warmth && opts.warmth < 0 ? "hue-rotate(180deg)" : ""
		].filter(Boolean).join(" ");
		const grainCanvas = document.createElement("canvas");
		grainCanvas.width = 64;
		grainCanvas.height = 64;
		const grainContext = grainCanvas.getContext("2d");
		if (grainContext) {
			const pixels = grainContext.createImageData(64, 64);
			for (let i = 0; i < pixels.data.length; i += 4) {
				const value = Math.random() > .5 ? 255 : 0;
				pixels.data[i] = value;
				pixels.data[i + 1] = value;
				pixels.data[i + 2] = value;
				pixels.data[i + 3] = 255;
			}
			grainContext.putImageData(pixels, 0, 0);
		}
		const grainPattern = grainContext ? g.createPattern(grainCanvas, "repeat") : null;
		let musicOn = false;
		let raf = 0;
		const draw = () => {
			g.filter = gradingFilter || "none";
			g.drawImage(video, 0, 0, canvas.width, canvas.height);
			g.filter = "none";
			if (grainPattern && (opts.grain ?? 0) > 0) {
				g.globalAlpha = Math.min(.16, (opts.grain ?? 0) * .9);
				g.fillStyle = grainPattern;
				g.fillRect(0, 0, canvas.width, canvas.height);
				g.globalAlpha = 1;
			}
			const currentRate = playbackRateAt();
			video.playbackRate = currentRate;
			if (audio) audio.playbackRate = currentRate;
			const elapsed = (video.currentTime - start) / Math.max(.1, currentRate);
			const rel = music ? elapsed - Math.max(0, music.start - start) : -1;
			if (audio && music && rel >= 0 && rel <= musicSpan) {
				const t = music.clipStart + rel * speed;
				if (!musicOn) {
					musicOn = true;
					try {
						audio.currentTime = t;
					} catch {}
					audio.play().catch(() => {});
				} else if (Math.abs(audio.currentTime - t) > .35) try {
					audio.currentTime = t;
				} catch {}
			} else if (musicOn && audio) {
				musicOn = false;
				audio.pause();
			}
			opts.onProgress?.(Math.min(99, elapsed / (span / speed) * 100));
			raf = requestAnimationFrame(draw);
		};
		raf = requestAnimationFrame(draw);
		await new Promise((resolve) => {
			let tick = null;
			const startedAt = performance.now();
			const stop = () => {
				video.removeEventListener("ended", stop);
				if (tick !== null) window.clearInterval(tick);
				resolve();
			};
			video.addEventListener("ended", stop);
			tick = window.setInterval(() => {
				const outputElapsed = (performance.now() - startedAt) / 1e3;
				if (video.currentTime >= end - .05 || outputElapsed >= 90) stop();
			}, 100);
		});
		cancelAnimationFrame(raf);
		video.pause();
		audio?.pause();
		recorder.stop();
		const blob = await done;
		actx.close().catch(() => {});
		opts.onProgress?.(100);
		if (!blob.size) return null;
		return URL.createObjectURL(blob);
	} catch (error) {
		console.error("Reel music render failed", error);
		cleanup();
		return null;
	}
}
var renderReel = renderReelWithMusic;
function initials(p) {
	return (p.display_name || p.username || "U").slice(0, 1).toUpperCase();
}
function PeoplePicker({ title, selected, onToggle, onClose }) {
	const [query, setQuery] = (0, import_react.useState)("");
	const [people, setPeople] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		let alive = true;
		setLoading(true);
		const t = window.setTimeout(async () => {
			const { data: s } = await supabase.auth.getSession();
			const uid = s.session?.user.id ?? null;
			const { data } = await supabase.rpc("search_profiles", { search: query.trim() });
			if (!alive) return;
			setPeople((data ?? []).filter((p) => p.id !== uid));
			setLoading(false);
		}, 200);
		return () => {
			alive = false;
			window.clearTimeout(t);
		};
	}, [query]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "absolute inset-0 z-20 flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 border-b border-border/60 px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onClose,
					"aria-label": "Back",
					className: "grid h-8 w-8 place-items-center rounded-full bg-secondary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-sm font-bold",
					children: title
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-4 py-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 rounded-full bg-secondary px-3.5 py-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-4 w-4 shrink-0 text-muted-foreground" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: query,
							onChange: (e) => setQuery(e.target.value),
							placeholder: "Search people",
							"aria-label": "Search people",
							className: "min-w-0 flex-1 bg-transparent text-sm outline-none"
						}),
						loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin text-muted-foreground" })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "flex-1 space-y-1 overflow-y-auto px-2 pb-6",
				children: [people.map((p) => {
					const on = selected.includes(p.id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => onToggle(p),
						className: "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-secondary/60",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-xs font-bold",
								children: p.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: p.avatar_url,
									alt: "",
									className: "h-full w-full object-cover"
								}) : initials(p)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-sm font-semibold",
									children: p.display_name || p.username || "User"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "block truncate text-[11px] text-muted-foreground",
									children: ["@", p.username || "user"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `grid h-5 w-5 place-items-center rounded-full border ${on ? "border-transparent bg-orange-500 text-white" : "border-border"}`,
								children: on && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3 w-3" })
							})
						]
					}) }, p.id);
				}), !loading && people.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "py-8 text-center text-xs text-muted-foreground",
					children: "No people found"
				})]
			})
		]
	});
}
function ReelPublishSheet({ open, previewUrl, posting, onClose, onShare }) {
	const [caption, setCaption] = (0, import_react.useState)("");
	const [location, setLocation] = (0, import_react.useState)("");
	const [link, setLink] = (0, import_react.useState)("");
	const [showLink, setShowLink] = (0, import_react.useState)(false);
	const [audience, setAudience] = (0, import_react.useState)("everyone");
	const [tagged, setTagged] = (0, import_react.useState)([]);
	const [closeFriends, setCloseFriends] = (0, import_react.useState)([]);
	const [picker, setPicker] = (0, import_react.useState)("none");
	const hashtags = (0, import_react.useMemo)(() => Array.from(new Set((caption.match(/#[\p{L}\p{N}_]+/gu) ?? []).map((h) => h.slice(1)))), [caption]);
	if (!open) return null;
	const toggle = (list, set) => (p) => set(list.some((x) => x.id === p.id) ? list.filter((x) => x.id !== p.id) : [...list, p]);
	const row = "flex w-full items-center gap-3 border-b border-border/50 px-4 py-3.5 text-left";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[60] flex justify-center bg-black/60 backdrop-blur-sm",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative flex h-full w-full max-w-md flex-col bg-background text-foreground",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 border-b border-border/60 px-4 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: onClose,
							"aria-label": "Close",
							className: "grid h-8 w-8 place-items-center rounded-full bg-secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "flex-1 text-sm font-black uppercase tracking-wide",
							children: "New reel"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: posting,
							onClick: () => onShare({
								caption: caption.trim(),
								hashtags,
								location: location.trim() || null,
								link: showLink && link.trim() ? link.trim() : null,
								audience,
								taggedUserIds: tagged.map((p) => p.id),
								viewerUserIds: audience === "close_friends" ? closeFriends.map((p) => p.id) : []
							}),
							className: "rounded-full bg-orange-500 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-white disabled:opacity-60",
							children: posting ? "Sharing…" : "Share"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 overflow-y-auto pb-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-3 px-4 py-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-24 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary",
								children: previewUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
									src: previewUrl,
									muted: true,
									playsInline: true,
									className: "h-full w-full object-cover"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								value: caption,
								onChange: (e) => setCaption(e.target.value),
								placeholder: "Write a caption… use #hashtags",
								"aria-label": "Caption",
								className: "h-24 min-w-0 flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
							})]
						}),
						hashtags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-1.5 px-4 pb-3",
							children: hashtags.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hash, { className: "h-3 w-3" }), h]
							}, h))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "border-t border-border/50",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setPicker("tag"),
									className: row,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AtSign, { className: "h-4 w-4 text-muted-foreground" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "flex-1 text-sm font-medium",
											children: "Tag people"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "max-w-[45%] truncate text-xs text-muted-foreground",
											children: tagged.length ? tagged.map((p) => p.username || p.display_name).join(", ") : "Add"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: row,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: location,
										onChange: (e) => setLocation(e.target.value),
										placeholder: "Add location",
										"aria-label": "Location",
										className: "flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
									})]
								}),
								showLink ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: row,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: link,
										onChange: (e) => setLink(e.target.value),
										placeholder: "https://your-link.com",
										"aria-label": "Link",
										inputMode: "url",
										className: "flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
									})]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setShowLink(true),
									className: row,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "h-4 w-4 text-muted-foreground" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "flex-1 text-sm font-medium",
											children: "Add link"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-muted-foreground",
											children: "Add"
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "px-4 pt-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-[11px] font-black uppercase tracking-widest text-muted-foreground",
									children: "Audience"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 space-y-2",
									children: [{
										id: "everyone",
										label: "Everyone",
										desc: "Anyone on YourWorld can watch",
										Icon: Earth
									}, {
										id: "close_friends",
										label: "Close friends",
										desc: "Only the people you choose",
										Icon: Star
									}].map((o) => {
										const on = audience === o.id;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => {
												setAudience(o.id);
												if (o.id === "close_friends" && closeFriends.length === 0) setPicker("close");
											},
											className: `flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors ${on ? "border-orange-500 bg-orange-500/10" : "border-border/60 bg-secondary/40"}`,
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(o.Icon, { className: `h-4 w-4 ${on ? "text-orange-500" : "text-muted-foreground"}` }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "min-w-0 flex-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "block text-sm font-semibold",
														children: o.label
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "block truncate text-[11px] text-muted-foreground",
														children: o.desc
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: `grid h-5 w-5 place-items-center rounded-full border ${on ? "border-transparent bg-orange-500 text-white" : "border-border"}`,
													children: on && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3 w-3" })
												})
											]
										}, o.id);
									})
								}),
								audience === "close_friends" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 rounded-2xl border border-border/60 bg-secondary/40 p-3.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-semibold",
											children: closeFriends.length ? `${closeFriends.length} people can see this` : "Nobody added yet"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setPicker("close"),
											className: "rounded-full bg-orange-500 px-3 py-1 text-[11px] font-bold text-white",
											children: "Add people"
										})]
									}), closeFriends.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "pt-2 text-[11px] text-muted-foreground",
										children: closeFriends.map((p) => `@${p.username || "user"}`).join(", ")
									})]
								})
							]
						})
					]
				}),
				picker === "tag" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PeoplePicker, {
					title: "Tag people",
					selected: tagged.map((p) => p.id),
					onToggle: toggle(tagged, setTagged),
					onClose: () => setPicker("none")
				}),
				picker === "close" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PeoplePicker, {
					title: "Close friends",
					selected: closeFriends.map((p) => p.id),
					onToggle: toggle(closeFriends, setCloseFriends),
					onClose: () => setPicker("none")
				})
			]
		})
	});
}
var TOOL_MENU = [
	{
		id: "TRIM",
		label: "Trim",
		Icon: Scissors
	},
	{
		id: "MUSIC",
		label: "Music",
		Icon: Music
	},
	{
		id: "FILTER",
		label: "Filter",
		Icon: SlidersVertical
	},
	{
		id: "EFFECT",
		label: "Effect",
		Icon: Sparkles
	},
	{
		id: "TEXT",
		label: "Text",
		Icon: Type
	},
	{
		id: "STICKER",
		label: "Sticker",
		Icon: Smile
	},
	{
		id: "SPEED",
		label: "Speed",
		Icon: Gauge
	},
	{
		id: "CROP",
		label: "Crop",
		Icon: Crop
	}
];
var fmtSec = (s) => {
	const v = Math.max(0, Math.floor(s || 0));
	return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;
};
var capEditorClips = (clips) => capReelSequence(clips, 90);
function CreateStudioPage() {
	const navigate = useNavigate();
	const { mode } = Route$39.useSearch();
	const { startUpload } = useUploads();
	const [clips, setClips] = (0, import_react.useState)([]);
	const [activeClipIndex, setActiveClipIndex] = (0, import_react.useState)(0);
	const [isPlaying, setIsPlaying] = (0, import_react.useState)(true);
	const [isMuted, setIsMuted] = (0, import_react.useState)(false);
	const [activeToolPanel, setActiveToolPanel] = (0, import_react.useState)("NONE");
	const [currentTime, setCurrentTime] = (0, import_react.useState)(0);
	const [playFraction, setPlayFraction] = (0, import_react.useState)(0);
	const [customTextInput, setCustomTextInput] = (0, import_react.useState)("");
	const [showMusicPicker, setShowMusicPicker] = (0, import_react.useState)(false);
	const [showExport, setShowExport] = (0, import_react.useState)(false);
	const [exportRes, setExportRes] = (0, import_react.useState)("4K");
	const [exportStage, setExportStage] = (0, import_react.useState)("choose");
	const [exportProgress, setExportProgress] = (0, import_react.useState)(0);
	const [posting, setPosting] = (0, import_react.useState)(false);
	const [exportedUrl, setExportedUrl] = (0, import_react.useState)(null);
	const backgroundExportUrls = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const [gpuPreviewEnabled, setGpuPreviewEnabled] = (0, import_react.useState)(false);
	const handleGpuCapability = import_react.useCallback((enabled) => {
		setGpuPreviewEnabled(enabled);
	}, []);
	const notifyMaxDuration = import_react.useCallback(() => {
		setActiveToolPanel("TRIM");
		toast.info(MAX_REEL_DURATION_MESSAGE);
	}, []);
	(0, import_react.useEffect)(() => {
		const retainedUrls = backgroundExportUrls.current;
		return () => {
			if (exportedUrl && !retainedUrls.has(exportedUrl)) URL.revokeObjectURL(exportedUrl);
		};
	}, [exportedUrl]);
	const startExport = async () => {
		const clip = clips[activeClipIndex] ?? clips[0];
		if (!clip?.url) return;
		if (totalDuration < 5) {
			toast.error(MIN_REEL_DURATION_MESSAGE);
			return;
		}
		if (totalDuration > 90) {
			notifyMaxDuration();
			return;
		}
		setExportStage("saving");
		setExportProgress(0);
		const rendered = await renderReel({
			videoUrl: clip.url,
			trimStart: clip.trimStart ?? 0,
			trimEnd: Math.min(90, clip.trimEnd ?? clip.duration ?? 90),
			music: audioTrack ?? void 0,
			resolution: exportRes,
			fps: 60,
			speed: clip.speed,
			speedRamp: clip.speedRamp,
			filter: clip.filter,
			contrast: clip.contrast ?? 1,
			saturation: clip.saturation ?? 1,
			warmth: clip.warmth ?? 0,
			grain: clip.grain ?? 0,
			onProgress: setExportProgress
		});
		if (!rendered) {
			setExportStage("choose");
			toast.error("This browser could not render the reel. Try Chrome or Safari.");
			return;
		}
		setExportedUrl(rendered);
		setExportProgress(100);
		setExportStage("done");
	};
	const saveToGallery = () => {
		const url = exportedUrl || clips[activeClipIndex]?.url || clips[0]?.url;
		if (!url) return;
		const a = document.createElement("a");
		a.href = url;
		a.download = `yourworld-${exportRes}-${Date.now()}.webm`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		toast.success(`Saved ${exportRes} video to your gallery`);
		setShowExport(false);
	};
	const [showPublish, setShowPublish] = (0, import_react.useState)(false);
	const postReel = async (meta) => {
		const clip = clips[activeClipIndex] ?? clips[0];
		const url = clip?.url;
		if (!url) {
			toast.error("Nothing to post yet");
			return;
		}
		if (totalDuration < 5) {
			toast.error(MIN_REEL_DURATION_MESSAGE);
			return;
		}
		if (totalDuration > 90) {
			notifyMaxDuration();
			return;
		}
		setPosting(true);
		const caption = meta.caption || clip?.textOverlay || "";
		let uploadUrl = exportedUrl || url;
		if (!exportedUrl && audioTrack && canMuxReel()) {
			const t = toast.loading("Adding music to your reel…");
			const trimEnd = Math.min(90, clip?.trimEnd ?? clip?.duration ?? 90);
			const baked = await renderReel({
				videoUrl: url,
				trimStart: clip?.trimStart ?? 0,
				trimEnd: trimEnd && trimEnd > 0 ? trimEnd : void 0,
				music: {
					url: audioTrack.url,
					start: audioTrack.start,
					clipStart: audioTrack.clipStart,
					clipEnd: audioTrack.clipEnd
				},
				resolution: "HD",
				fps: 60,
				speed: clip?.speed,
				speedRamp: clip?.speedRamp,
				filter: clip?.filter,
				contrast: clip?.contrast ?? 1,
				saturation: clip?.saturation ?? 1,
				warmth: clip?.warmth ?? 0,
				grain: clip?.grain ?? 0
			});
			toast.dismiss(t);
			if (!baked) {
				setPosting(false);
				toast.error("Music could not be added. Reel was not posted—please try again.");
				return;
			}
			uploadUrl = baked;
		} else if (audioTrack) {
			setPosting(false);
			toast.error("This browser cannot export reel audio. Try Chrome or Safari.");
			return;
		}
		if (exportedUrl) backgroundExportUrls.current.add(exportedUrl);
		startUpload({
			kind: "reel",
			label: caption || "New reel",
			thumbnail: null,
			viewTo: "/reels"
		}, (onProgress) => publishReel({
			fileUrl: uploadUrl,
			file: exportedUrl ? null : clip?.file,
			caption,
			hashtags: meta.hashtags,
			location: meta.location,
			link: meta.link,
			audience: meta.audience,
			taggedUserIds: meta.taggedUserIds,
			viewerUserIds: meta.viewerUserIds,
			audio: audioTrack?.title ?? null,
			durationSeconds: totalDuration,
			originalWidth: clip?.originalWidth ?? null,
			originalHeight: clip?.originalHeight ?? null,
			onProgress
		})).then(({ error }) => {
			if (error) toast.error(error);
			else {
				trackEvent("reel_published", {
					surface: "create_studio",
					clip_count: clips.length,
					has_music: Boolean(audioTrack),
					export_resolution: exportedUrl ? exportRes : "source",
					scheduled: false
				});
				if (exportedUrl) {
					backgroundExportUrls.current.delete(exportedUrl);
					URL.revokeObjectURL(exportedUrl);
				}
				toast.success("Reel posted");
			}
		});
		setPosting(false);
		setShowPublish(false);
		setShowExport(false);
		navigate({
			to: "/reels",
			search: { reelId: void 0 }
		});
	};
	const [audioTrack, setAudioTrack] = (0, import_react.useState)(null);
	const pastRef = (0, import_react.useRef)([]);
	const futureRef = (0, import_react.useRef)([]);
	const lastSnapRef = (0, import_react.useRef)({
		clips: [],
		audioTrack: null
	});
	const skipHistoryRef = (0, import_react.useRef)(false);
	const [historyVersion, setHistoryVersion] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const snap = {
			clips,
			audioTrack
		};
		if (lastSnapRef.current.clips === clips && lastSnapRef.current.audioTrack === audioTrack) return;
		if (skipHistoryRef.current) {
			skipHistoryRef.current = false;
			lastSnapRef.current = snap;
			setHistoryVersion((v) => v + 1);
			return;
		}
		pastRef.current = [...pastRef.current.slice(-49), lastSnapRef.current];
		futureRef.current = [];
		lastSnapRef.current = snap;
		setHistoryVersion((v) => v + 1);
	}, [clips, audioTrack]);
	const applySnapshot = (snap) => {
		skipHistoryRef.current = true;
		const capped = capEditorClips(snap.clips);
		if (reelSequenceDuration(snap.clips) > 90) notifyMaxDuration();
		setClips(capped);
		setAudioTrack(snap.audioTrack);
		setActiveClipIndex((i) => Math.min(i, Math.max(0, capped.length - 1)));
	};
	const handleUndo = () => {
		const prev = pastRef.current.pop();
		if (!prev) {
			toast("Nothing to undo");
			setHistoryVersion((v) => v + 1);
			return;
		}
		futureRef.current = [...futureRef.current, lastSnapRef.current];
		applySnapshot(prev);
		toast("Undone");
	};
	const handleRedo = () => {
		const next = futureRef.current.pop();
		if (!next) {
			toast("Nothing to redo");
			setHistoryVersion((v) => v + 1);
			return;
		}
		pastRef.current = [...pastRef.current, lastSnapRef.current];
		applySnapshot(next);
		toast("Redone");
	};
	const canUndo = pastRef.current.length > 0 && historyVersion >= 0;
	const canRedo = futureRef.current.length > 0;
	const handleAudioSelect = (e) => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;
		const url = URL.createObjectURL(file);
		const probe = document.createElement("audio");
		probe.preload = "metadata";
		probe.src = url;
		probe.addEventListener("loadedmetadata", () => {
			const dur = isFinite(probe.duration) && probe.duration > 0 ? probe.duration : 30;
			setAudioTrack({
				id: `up_${Date.now()}`,
				title: file.name.replace(/\.[^.]+$/, ""),
				url,
				start: 0,
				clipStart: 0,
				clipEnd: dur,
				duration: dur
			});
			setShowMusicPicker(false);
			toast.success("Music added from your device");
		});
		probe.addEventListener("error", () => toast.error("Could not read that audio file"));
	};
	const totalDuration = reelSequenceDuration(clips);
	const fileInputRef = (0, import_react.useRef)(null);
	const audioInputRef = (0, import_react.useRef)(null);
	const videoRef = (0, import_react.useRef)(null);
	const videoSlotsRef = (0, import_react.useRef)([null, null]);
	const slotClipIndexRef = (0, import_react.useRef)([null, null]);
	const activeVideoSlotRef = (0, import_react.useRef)(0);
	const [activeVideoSlot, setActiveVideoSlot] = (0, import_react.useState)(0);
	const audioElRef = (0, import_react.useRef)(null);
	const stageRef = (0, import_react.useRef)(null);
	const scrubbingRef = (0, import_react.useRef)(false);
	const transitionTimerRef = (0, import_react.useRef)(null);
	const scrubTimerRef = (0, import_react.useRef)(null);
	const dragRafRef = (0, import_react.useRef)(null);
	const seekRafRef = (0, import_react.useRef)(null);
	const pendingSeekRef = (0, import_react.useRef)(null);
	const globalTimeRef = (0, import_react.useRef)(0);
	const [textSelected, setTextSelected] = (0, import_react.useState)(false);
	const viewportPointersRef = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	const viewportGestureRef = (0, import_react.useRef)(null);
	const textGestureRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const viewportPointers = viewportPointersRef.current;
		return () => {
			if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);
			if (seekRafRef.current) cancelAnimationFrame(seekRafRef.current);
			if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
			if (scrubTimerRef.current) clearTimeout(scrubTimerRef.current);
			viewportPointers.clear();
			textGestureRef.current = null;
		};
	}, []);
	const scheduleFrame = (fn) => {
		if (dragRafRef.current) return;
		dragRafRef.current = requestAnimationFrame(() => {
			dragRafRef.current = null;
			fn();
		});
	};
	const addFiles = (files) => {
		if (clips.length + files.length > 5) {
			toast.error(MAX_REEL_CLIPS_MESSAGE);
			return;
		}
		const newClips = files.map((f, i) => ({
			id: `c_${Date.now()}_${i}`,
			url: URL.createObjectURL(f),
			file: f,
			speed: 1,
			speedRamp: "constant",
			rotation: 0,
			filter: "none",
			textOverlay: "",
			volume: 1,
			trimStart: 0,
			crop: 1,
			cropX: 0,
			cropY: 0,
			textX: 50,
			textY: 50,
			textSize: 1,
			contrast: 1,
			saturation: 1,
			warmth: 0,
			grain: 0
		}));
		setExportedUrl((previous) => {
			if (previous) URL.revokeObjectURL(previous);
			return null;
		});
		setClips((prev) => [...prev, ...newClips]);
		setActiveClipIndex(clips.length);
		for (const clip of newClips) {
			const probe = document.createElement("video");
			probe.preload = "metadata";
			probe.src = clip.url;
			probe.onloadedmetadata = () => {
				const duration = Number.isFinite(probe.duration) && probe.duration > 0 ? probe.duration : 0;
				if (!duration) {
					toast.error("Could not read the selected video duration.");
					return;
				}
				setClips((previous) => {
					const measured = previous.map((item) => item.id === clip.id ? {
						...item,
						duration,
						originalWidth: probe.videoWidth || void 0,
						originalHeight: probe.videoHeight || void 0
					} : item);
					if (reelSequenceDuration(measured) > 90) notifyMaxDuration();
					return capEditorClips(measured);
				});
			};
			probe.onerror = () => toast.error("Could not read the selected video duration.");
		}
	};
	const handleMediaSelect = (e) => {
		const files = e.target.files;
		if (!files) return;
		addFiles(Array.from(files));
		e.target.value = "";
	};
	const currentClip = clips[activeClipIndex];
	(0, import_react.useEffect)(() => {
		setActiveClipIndex((index) => Math.min(index, Math.max(0, clips.length - 1)));
	}, [clips.length]);
	const updateCurrentClip = (key, val) => {
		setExportedUrl((previous) => {
			if (previous) URL.revokeObjectURL(previous);
			return null;
		});
		setClips((prev) => prev.map((c, i) => i === activeClipIndex ? {
			...c,
			[key]: val
		} : c));
	};
	const clamp = (n, a = 0, b = 100) => Math.min(b, Math.max(a, n));
	const clampCropOffset = (value, scale) => {
		const maxOffset = Math.max(0, (scale - 1) * 50);
		return Math.min(maxOffset, Math.max(-maxOffset, value));
	};
	const stagePct = (e) => {
		const r = stageRef.current?.getBoundingClientRect();
		if (!r) return {
			x: 50,
			y: 50
		};
		return {
			x: clamp((e.clientX - r.left) / r.width * 100),
			y: clamp((e.clientY - r.top) / r.height * 100)
		};
	};
	const startViewportGesture = (e) => {
		if (e.pointerType === "mouse" && e.button !== 0) return;
		e.preventDefault();
		const point = {
			x: e.clientX,
			y: e.clientY
		};
		viewportPointersRef.current.set(e.pointerId, point);
		e.currentTarget.setPointerCapture?.(e.pointerId);
		const points = [...viewportPointersRef.current.values()];
		if (points.length === 1) viewportGestureRef.current = {
			distance: 0,
			midpoint: point,
			crop: currentClip?.crop ?? 1,
			cropX: currentClip?.cropX ?? 0,
			cropY: currentClip?.cropY ?? 0
		};
		else if (points.length === 2) {
			const [first, second] = points;
			viewportGestureRef.current = {
				distance: Math.hypot(second.x - first.x, second.y - first.y),
				midpoint: {
					x: (first.x + second.x) / 2,
					y: (first.y + second.y) / 2
				},
				crop: currentClip?.crop ?? 1,
				cropX: currentClip?.cropX ?? 0,
				cropY: currentClip?.cropY ?? 0
			};
		}
	};
	const moveViewportGesture = (e) => {
		if (!viewportPointersRef.current.has(e.pointerId)) return;
		viewportPointersRef.current.set(e.pointerId, {
			x: e.clientX,
			y: e.clientY
		});
		const gesture = viewportGestureRef.current;
		if (!gesture || !currentClip) return;
		const points = [...viewportPointersRef.current.values()];
		const rect = stageRef.current?.getBoundingClientRect();
		if (!rect) return;
		const update = (crop, cropX, cropY) => {
			const next = {
				crop,
				cropX: clampCropOffset(cropX, crop),
				cropY: clampCropOffset(cropY, crop)
			};
			setClips((prev) => prev.map((clip, index) => index === activeClipIndex ? {
				...clip,
				...next
			} : clip));
		};
		if (points.length >= 2) {
			const [first, second] = points;
			const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
			const midpoint = {
				x: (first.x + second.x) / 2,
				y: (first.y + second.y) / 2
			};
			const dx = (midpoint.x - gesture.midpoint.x) / rect.width * 100;
			const dy = (midpoint.y - gesture.midpoint.y) / rect.height * 100;
			update(clamp(gesture.crop * (distance / Math.max(1, gesture.distance)), 1, 4), gesture.cropX + dx, gesture.cropY + dy);
		} else if (points.length === 1) {
			const point = points[0];
			const dx = (point.x - gesture.midpoint.x) / rect.width * 100;
			const dy = (point.y - gesture.midpoint.y) / rect.height * 100;
			update(gesture.crop, gesture.cropX + dx, gesture.cropY + dy);
		}
	};
	const endViewportGesture = (e) => {
		viewportPointersRef.current.delete(e.pointerId);
		if (viewportPointersRef.current.size === 0) viewportGestureRef.current = null;
	};
	const updateTextFromGesture = (gesture) => {
		const rect = stageRef.current?.getBoundingClientRect();
		const points = [...gesture.pointers.values()];
		if (!rect || !points.length) return;
		let nextX = gesture.textX;
		let nextY = gesture.textY;
		let nextSize = gesture.textSize;
		if (gesture.mode === "resize" && points.length === 1) {
			const center = {
				x: rect.left + gesture.textX / 100 * rect.width,
				y: rect.top + gesture.textY / 100 * rect.height
			};
			const distance = Math.max(12, Math.hypot(points[0].x - center.x, points[0].y - center.y));
			nextSize = clamp(gesture.textSize * (distance / Math.max(12, gesture.distance)), .65, 3);
		} else if (points.length >= 2) {
			const [first, second] = points;
			const distance = Math.max(12, Math.hypot(second.x - first.x, second.y - first.y));
			const midpoint = {
				x: (first.x + second.x) / 2,
				y: (first.y + second.y) / 2
			};
			nextSize = clamp(gesture.textSize * (distance / Math.max(12, gesture.distance)), .65, 3);
			nextX = clamp(gesture.textX + (midpoint.x - gesture.midpoint.x) / rect.width * 100);
			nextY = clamp(gesture.textY + (midpoint.y - gesture.midpoint.y) / rect.height * 100);
		} else {
			const point = points[0];
			nextX = clamp(gesture.textX + (point.x - gesture.start.x) / rect.width * 100);
			nextY = clamp(gesture.textY + (point.y - gesture.start.y) / rect.height * 100);
		}
		gesture.element.style.left = `${nextX}%`;
		gesture.element.style.top = `${nextY}%`;
		gesture.element.style.fontSize = `${1.1 * nextSize}rem`;
		scheduleFrame(() => setClips((prev) => prev.map((clip, index) => index === activeClipIndex ? {
			...clip,
			textX: nextX,
			textY: nextY,
			textSize: nextSize
		} : clip)));
	};
	const handleTextPointerMove = (e) => {
		const gesture = textGestureRef.current;
		if (!gesture || !gesture.pointers.has(e.pointerId)) return;
		gesture.pointers.set(e.pointerId, {
			x: e.clientX,
			y: e.clientY
		});
		updateTextFromGesture(gesture);
	};
	const handleTextPointerEnd = (e) => {
		const gesture = textGestureRef.current;
		if (!gesture) return;
		gesture.pointers.delete(e.pointerId);
		if (gesture.pointers.size === 0) {
			window.removeEventListener("pointermove", handleTextPointerMove);
			window.removeEventListener("pointerup", handleTextPointerEnd);
			window.removeEventListener("pointercancel", handleTextPointerEnd);
			textGestureRef.current = null;
		}
	};
	const startTextGesture = (e, mode = "move", target) => {
		e.preventDefault();
		e.stopPropagation();
		const el = target ?? e.currentTarget;
		e.currentTarget.setPointerCapture?.(e.pointerId);
		setTextSelected(true);
		const point = {
			x: e.clientX,
			y: e.clientY
		};
		const currentX = currentClip?.textX ?? 50;
		const currentY = currentClip?.textY ?? 50;
		const currentSize = currentClip?.textSize ?? 1;
		const rect = stageRef.current?.getBoundingClientRect();
		const center = rect ? {
			x: rect.left + currentX / 100 * rect.width,
			y: rect.top + currentY / 100 * rect.height
		} : point;
		const existing = textGestureRef.current;
		if (existing) {
			const first = [...existing.pointers.values()][0];
			existing.pointers.set(e.pointerId, point);
			if (existing.pointers.size === 2 && first) {
				existing.distance = Math.max(12, Math.hypot(point.x - first.x, point.y - first.y));
				existing.midpoint = {
					x: (point.x + first.x) / 2,
					y: (point.y + first.y) / 2
				};
				existing.textX = currentClip?.textX ?? existing.textX;
				existing.textY = currentClip?.textY ?? existing.textY;
				existing.textSize = currentClip?.textSize ?? existing.textSize;
			}
			return;
		}
		textGestureRef.current = {
			pointers: /* @__PURE__ */ new Map([[e.pointerId, point]]),
			start: point,
			textX: currentX,
			textY: currentY,
			textSize: currentSize,
			distance: Math.max(12, Math.hypot(point.x - center.x, point.y - center.y)),
			midpoint: point,
			mode,
			element: el
		};
		window.addEventListener("pointermove", handleTextPointerMove, { passive: true });
		window.addEventListener("pointerup", handleTextPointerEnd);
		window.addEventListener("pointercancel", handleTextPointerEnd);
	};
	const startCropDrag = (e, mode) => {
		e.preventDefault();
		e.stopPropagation();
		const box = currentClip?.cropBox ?? {
			x: 10,
			y: 10,
			w: 80,
			h: 80
		};
		const origin = stagePct(e);
		const move = (ev) => {
			const p = stagePct(ev);
			const dx = p.x - origin.x;
			const dy = p.y - origin.y;
			const next = { ...box };
			if (mode === "move") {
				next.x = clamp(box.x + dx, 0, 100 - box.w);
				next.y = clamp(box.y + dy, 0, 100 - box.h);
			} else {
				const right = box.x + box.w;
				const bottom = box.y + box.h;
				if (mode === "nw" || mode === "sw") {
					next.x = clamp(box.x + dx, 0, right - 10);
					next.w = right - next.x;
				} else next.w = clamp(box.w + dx, 10, 100 - box.x);
				if (mode === "nw" || mode === "ne") {
					next.y = clamp(box.y + dy, 0, bottom - 10);
					next.h = bottom - next.y;
				} else next.h = clamp(box.h + dy, 10, 100 - box.y);
			}
			scheduleFrame(() => setClips((prev) => prev.map((c, i) => i === activeClipIndex ? {
				...c,
				cropBox: next
			} : c)));
		};
		const end = () => {
			if (dragRafRef.current) {
				cancelAnimationFrame(dragRafRef.current);
				dragRafRef.current = null;
			}
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", end);
		};
		window.addEventListener("pointermove", move, { passive: true });
		window.addEventListener("pointerup", end);
	};
	const applyAspect = (ratio) => {
		if (ratio === null) {
			setClips((prev) => prev.map((c, i) => i === activeClipIndex ? {
				...c,
				cropBox: void 0
			} : c));
			return;
		}
		const stage = stageRef.current?.getBoundingClientRect();
		const vid = videoRef.current?.getBoundingClientRect();
		if (!stage || !vid || !stage.width || !stage.height) return;
		const vx = (vid.left - stage.left) / stage.width * 100;
		const vy = (vid.top - stage.top) / stage.height * 100;
		const vw = vid.width / stage.width * 100;
		const vh = vid.height / stage.height * 100;
		let boxWpx = vid.width;
		let boxHpx = boxWpx / ratio;
		if (boxHpx > vid.height) {
			boxHpx = vid.height;
			boxWpx = boxHpx * ratio;
		}
		const w = boxWpx / vid.width * vw;
		const h = boxHpx / vid.height * vh;
		const next = {
			x: vx + (vw - w) / 2,
			y: vy + (vh - h) / 2,
			w,
			h
		};
		setClips((prev) => prev.map((c, i) => i === activeClipIndex ? {
			...c,
			cropBox: next
		} : c));
	};
	const lastSyncRef = (0, import_react.useRef)({
		frac: -1,
		time: -1
	});
	const syncTime = import_react.useCallback(() => {
		const v = videoRef.current;
		if (!v) return;
		const c = clips[activeClipIndex];
		const dur = c?.duration || v.duration || 0;
		const start = c?.trimStart ?? 0;
		const end = c?.trimEnd ?? dur;
		const span = Math.max(.01, end - start);
		const frac = Math.min(1, Math.max(0, (v.currentTime - start) / span));
		let before = 0;
		for (let i = 0; i < activeClipIndex; i++) {
			const p = clips[i];
			const pd = p?.duration || 0;
			before += Math.max(0, (p?.trimEnd ?? pd) - (p?.trimStart ?? 0));
		}
		const global = Math.min(90, before + frac * span);
		globalTimeRef.current = global;
		const last = lastSyncRef.current;
		if (Math.abs(last.frac - frac) > .0015) {
			last.frac = frac;
			setPlayFraction(frac);
		}
		if (Math.abs(last.time - global) > .08) {
			last.time = global;
			setCurrentTime(global);
		}
	}, [clips, activeClipIndex]);
	(0, import_react.useEffect)(() => {
		if (!isPlaying) return;
		let raf = 0;
		const loop = () => {
			syncTime();
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, [isPlaying, syncTime]);
	(0, import_react.useEffect)(() => {
		if (videoRef.current && currentClip) {
			videoRef.current.playbackRate = currentClip.speed;
			videoRef.current.volume = currentClip.volume;
		}
		if (audioElRef.current && currentClip) {
			audioElRef.current.playbackRate = currentClip.speed;
			const audio = audioElRef.current;
			if ("preservesPitch" in audio) audio.preservesPitch = true;
			if ("webkitPreservesPitch" in audio) audio.webkitPreservesPitch = true;
		}
	}, [currentClip, activeClipIndex]);
	(0, import_react.useEffect)(() => {
		const activeSlot = activeVideoSlotRef.current;
		const nextSlot = activeSlot === 0 ? 1 : 0;
		const activeVideo = videoSlotsRef.current[activeSlot];
		const preloadVideo = videoSlotsRef.current[nextSlot];
		const activeClip = clips[activeClipIndex];
		if (!activeVideo || !activeClip?.url) return;
		videoRef.current = activeVideo;
		activeVideo.muted = isMuted;
		activeVideo.preload = "auto";
		const start = activeClip.trimStart ?? 0;
		const end = activeClip.trimEnd;
		const ready = () => {
			if (scrubbingRef.current) return;
			if (activeVideo.currentTime < start - .05 || end != null && activeVideo.currentTime > end + .05) try {
				activeVideo.currentTime = start;
			} catch {}
			if (isPlaying) activeVideo.play().catch(() => {});
		};
		if (slotClipIndexRef.current[activeSlot] !== activeClipIndex || activeVideo.src !== activeClip.url) {
			activeVideo.pause();
			activeVideo.src = activeClip.url;
			slotClipIndexRef.current[activeSlot] = activeClipIndex;
			activeVideo.load();
			activeVideo.addEventListener("canplay", ready, { once: true });
		} else if (activeVideo.readyState >= 2) ready();
		else activeVideo.addEventListener("canplay", ready, { once: true });
		const nextIndex = clips.length ? (activeClipIndex + 1) % clips.length : null;
		const nextClip = nextIndex == null ? null : clips[nextIndex];
		if (preloadVideo && nextClip?.url) {
			preloadVideo.pause();
			preloadVideo.muted = true;
			preloadVideo.preload = "auto";
			preloadVideo.playbackRate = nextClip.speed;
			preloadVideo.volume = nextClip.volume;
			if (slotClipIndexRef.current[nextSlot] !== nextIndex || preloadVideo.src !== nextClip.url) {
				preloadVideo.src = nextClip.url;
				slotClipIndexRef.current[nextSlot] = nextIndex;
				preloadVideo.load();
			}
		}
		return () => activeVideo.removeEventListener("canplay", ready);
	}, [
		clips,
		activeClipIndex,
		currentClip,
		isPlaying,
		isMuted,
		activeVideoSlot
	]);
	const advancingRef = (0, import_react.useRef)(0);
	const advanceClip = import_react.useCallback(() => {
		if (!clips.length) return;
		const now = Date.now();
		if (now - advancingRef.current < 400) return;
		advancingRef.current = now;
		const next = (activeClipIndex + 1) % clips.length;
		const nextClip = clips[next];
		const currentVideo = videoRef.current;
		if (!nextClip || !currentVideo) return;
		const start = nextClip.trimStart ?? 0;
		if (nextClip.url === currentClip?.url) {
			currentVideo.playbackRate = nextClip.speed;
			currentVideo.volume = nextClip.volume;
			try {
				currentVideo.currentTime = start;
			} catch {}
			if (isPlaying) currentVideo.play().catch(() => {});
			setActiveClipIndex(next);
			return;
		}
		const nextSlot = activeVideoSlotRef.current === 0 ? 1 : 0;
		const nextVideo = videoSlotsRef.current[nextSlot];
		if (!nextVideo) return;
		let switched = false;
		const switchWhenReady = () => {
			if (switched || nextVideo.readyState < 2) return;
			switched = true;
			nextVideo.removeEventListener("canplay", switchWhenReady);
			try {
				nextVideo.currentTime = start;
			} catch {}
			nextVideo.muted = isMuted;
			nextVideo.playbackRate = nextClip.speed;
			nextVideo.volume = nextClip.volume;
			const playNext = nextVideo.play();
			const activate = () => {
				if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
				currentVideo.pause();
				videoRef.current = nextVideo;
				activeVideoSlotRef.current = nextSlot;
				setActiveVideoSlot(nextSlot);
				setActiveClipIndex(next);
				setIsPlaying(true);
			};
			playNext.then(activate).catch(() => activate());
		};
		nextVideo.addEventListener("canplay", switchWhenReady);
		if (nextVideo.readyState >= 2) switchWhenReady();
		else nextVideo.load();
		transitionTimerRef.current = setTimeout(() => {
			if (!switched) switchWhenReady();
		}, 1200);
	}, [
		clips,
		activeClipIndex,
		currentClip?.url,
		isMuted,
		isPlaying
	]);
	(0, import_react.useEffect)(() => {
		const v = videoRef.current;
		if (!v || !currentClip) return;
		const start = currentClip.trimStart ?? 0;
		const end = currentClip.trimEnd;
		const seek = () => {
			if (scrubbingRef.current) return;
			if (Math.abs(v.currentTime - start) > .05) v.currentTime = start;
		};
		if (v.readyState >= 1) seek();
		else v.addEventListener("loadedmetadata", seek, { once: true });
		const onTime = () => {
			if (scrubbingRef.current) return;
			if (end && v.currentTime >= end) advanceClip();
			else if (v.currentTime < start - .1) v.currentTime = start;
		};
		v.addEventListener("timeupdate", onTime);
		v.addEventListener("ended", advanceClip);
		return () => {
			v.removeEventListener("timeupdate", onTime);
			v.removeEventListener("ended", advanceClip);
			v.removeEventListener("loadedmetadata", seek);
		};
	}, [
		activeClipIndex,
		currentClip,
		advanceClip
	]);
	(0, import_react.useEffect)(() => {
		const v = videoRef.current;
		const a = audioElRef.current;
		if (!v || !a || !audioTrack) return;
		const sync = () => {
			const global = globalTimeRef.current;
			const span = Math.max(.1, audioTrack.clipEnd - audioTrack.clipStart);
			const rel = global - audioTrack.start;
			const t = audioTrack.clipStart + rel * (currentClip?.speed ?? 1);
			if (rel >= 0 && rel <= span && !v.paused) {
				if (Math.abs(a.currentTime - t) > .25) a.currentTime = t;
				if (a.paused) a.play().catch(() => {});
			} else if (!a.paused) a.pause();
		};
		const onPause = () => a.pause();
		v.addEventListener("timeupdate", sync);
		v.addEventListener("seeking", sync);
		v.addEventListener("play", sync);
		v.addEventListener("pause", onPause);
		return () => {
			v.removeEventListener("timeupdate", sync);
			v.removeEventListener("seeking", sync);
			v.removeEventListener("play", sync);
			v.removeEventListener("pause", onPause);
			a.pause();
		};
	}, [
		audioTrack,
		activeClipIndex,
		currentClip?.speed
	]);
	const handleSplit = () => {
		const v = videoRef.current;
		if (!currentClip || clips.length >= 5) {
			toast.error(MAX_REEL_CLIPS_MESSAGE);
			return;
		}
		const dur = currentClip.duration || v?.duration || 0;
		const start = currentClip.trimStart ?? 0;
		const end = currentClip.trimEnd ?? dur;
		const at = v ? v.currentTime : (start + end) / 2;
		if (!(at > start + .15 && at < end - .15)) {
			toast.error("Move the playhead inside the clip to split");
			return;
		}
		setClips((prev) => {
			const next = [...prev];
			next[activeClipIndex] = {
				...currentClip,
				trimEnd: at
			};
			next.splice(activeClipIndex + 1, 0, {
				...currentClip,
				id: `c_${Date.now()}`,
				trimStart: at,
				trimEnd: end
			});
			return next;
		});
		toast.success("Clip split");
	};
	const handleDuplicate = () => {
		if (!currentClip || clips.length >= 5) {
			toast.error(MAX_REEL_CLIPS_MESSAGE);
			return;
		}
		const copy = {
			...currentClip,
			id: `c_${Date.now()}`
		};
		const updated = [...clips];
		updated.splice(activeClipIndex + 1, 0, copy);
		if (reelSequenceDuration(updated) > 90) notifyMaxDuration();
		const capped = capEditorClips(updated);
		setClips(capped);
		setActiveClipIndex(Math.min(activeClipIndex + 1, Math.max(0, capped.length - 1)));
	};
	const handleDelete = () => {
		if (clips.length === 0) return;
		const updated = clips.filter((_, i) => i !== activeClipIndex);
		setClips(updated);
		setActiveClipIndex(Math.max(0, activeClipIndex - 1));
	};
	const selectClip = (index) => {
		const clip = clips[index];
		if (!clip) return;
		setTextSelected(false);
		const currentSlot = activeVideoSlotRef.current;
		const matchingSlot = slotClipIndexRef.current.findIndex((value) => value === index);
		if (matchingSlot >= 0 && matchingSlot !== currentSlot) {
			const nextVideo = videoSlotsRef.current[matchingSlot];
			const oldVideo = videoSlotsRef.current[currentSlot];
			if (nextVideo) {
				nextVideo.pause();
				nextVideo.muted = isMuted;
				try {
					nextVideo.currentTime = clip.trimStart ?? 0;
				} catch {}
				oldVideo?.pause();
				videoRef.current = nextVideo;
				activeVideoSlotRef.current = matchingSlot;
				setActiveVideoSlot(matchingSlot);
			}
		}
		setActiveClipIndex(index);
		setIsPlaying(false);
		videoSlotsRef.current[matchingSlot >= 0 ? matchingSlot : currentSlot]?.pause();
	};
	const togglePlay = () => {
		if (!videoRef.current) return;
		if (isPlaying) {
			videoRef.current.pause();
			setTextSelected(false);
		} else videoRef.current.play().catch(() => {});
		setIsPlaying(!isPlaying);
	};
	const handleToolMenu = (id) => {
		if (id === "MUSIC") return setShowMusicPicker(true);
		if (id === "EFFECT") return updateCurrentClip("filter", currentClip?.filter === "vivid" ? "none" : "vivid");
		setActiveToolPanel(activeToolPanel === id ? "NONE" : id);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-[99999] bg-background text-foreground font-sans flex flex-col overflow-hidden select-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "file",
				ref: fileInputRef,
				onChange: handleMediaSelect,
				multiple: true,
				accept: "video/*,image/*",
				className: "hidden"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "file",
				ref: audioInputRef,
				accept: "audio/*",
				onChange: handleAudioSelect,
				className: "hidden"
			}),
			clips.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CameraCapture, {
				allowedModes: mode === "live" ? ["LIVE"] : ["REEL"],
				onClose: () => navigate({ to: "/" }),
				onCapture: (files) => addFiles(files),
				onPick: () => fileInputRef.current?.click(),
				onDrafts: () => toast("No drafts yet — capture something first")
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 min-h-0 flex flex-col bg-background text-foreground relative",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-shrink-0 flex justify-between items-center px-4 py-2 bg-card z-30 border-b border-border",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setClips([]),
								className: "p-2 bg-muted rounded-full text-foreground",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 18 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] font-black uppercase tracking-wide text-muted-foreground",
								children: "Edit"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									if (totalDuration < 5) {
										toast.error(MIN_REEL_DURATION_MESSAGE);
										return;
									}
									if (totalDuration > 90) {
										notifyMaxDuration();
										return;
									}
									setExportStage("choose");
									setExportProgress(0);
									setShowExport(true);
								},
								className: "bg-orange-500 hover:bg-orange-600 text-white font-black px-3.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wide shadow-sm active:scale-95 transition",
								children: "SAVE"
							})
						]
					}),
					showExport && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "w-full sm:max-w-sm bg-card text-foreground rounded-t-2xl sm:rounded-2xl p-5 shadow-xl",
							children: [
								exportStage === "choose" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-sm font-black uppercase tracking-wide mb-1",
										children: "Export video"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground mb-4",
										children: "Choose output resolution"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid grid-cols-2 gap-2 mb-5",
										children: ["4K", "HD"].map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => setExportRes(r),
											className: `py-2.5 rounded-lg text-xs font-bold border transition ${exportRes === r ? "bg-orange-500 text-white border-orange-500" : "bg-muted text-foreground border-border"}`,
											children: r
										}, r))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => setShowExport(false),
											className: "flex-1 py-2.5 rounded-lg bg-muted text-foreground text-xs font-bold",
											children: "Cancel"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: startExport,
											className: "flex-1 py-2.5 rounded-lg bg-orange-500 text-white text-xs font-black uppercase",
											children: ["Export ", exportRes]
										})]
									})
								] }),
								exportStage === "saving" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
										className: "text-sm font-black uppercase tracking-wide mb-1",
										children: ["Saving ", exportRes]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground mb-4",
										children: "Rendering to your device gallery…"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-2 w-full rounded-full bg-muted overflow-hidden",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-full bg-orange-500 transition-all duration-150",
											style: { width: `${exportProgress}%` }
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2 text-right text-[11px] font-mono text-muted-foreground",
										children: [Math.round(exportProgress), "%"]
									})
								] }),
								exportStage === "done" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-sm font-black uppercase tracking-wide mb-1",
										children: "Export complete"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[11px] text-muted-foreground mb-4",
										children: [exportRes, " video is ready."]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => {
												if (totalDuration < 5) {
													toast.error("Reel must be at least 5 seconds long.");
													return;
												}
												if (totalDuration > 90) {
													notifyMaxDuration();
													return;
												}
												setShowPublish(true);
											},
											disabled: posting,
											className: "w-full py-3 rounded-lg bg-orange-500 text-white text-xs font-black uppercase tracking-wide disabled:opacity-60",
											children: "Next: caption & audience"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: saveToGallery,
											className: "w-full py-3 rounded-lg bg-muted text-foreground text-xs font-black uppercase tracking-wide",
											children: "Save to Gallery"
										})]
									})
								] })
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReelPublishSheet, {
						open: showPublish,
						previewUrl: clips[activeClipIndex]?.url ?? clips[0]?.url,
						posting,
						onClose: () => setShowPublish(false),
						onShare: (meta) => void postReel(meta)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 min-h-0 w-full flex items-center justify-center relative bg-black overflow-hidden",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							ref: stageRef,
							onPointerDown: startViewportGesture,
							onPointerMove: moveViewportGesture,
							onPointerUp: endViewportGesture,
							onPointerCancel: endViewportGesture,
							className: "relative h-full max-h-full w-auto max-w-full aspect-[9/16] flex items-center justify-center touch-none bg-black overflow-hidden",
							style: { contain: "layout paint size" },
							children: [
								[0, 1].map((slot) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
									ref: (node) => {
										videoSlotsRef.current[slot] = node;
										if (slot === activeVideoSlot) videoRef.current = node;
									},
									autoPlay: slot === activeVideoSlot,
									playsInline: true,
									preload: "auto",
									muted: slot === activeVideoSlot ? isMuted : true,
									onTimeUpdate: slot === activeVideoSlot ? syncTime : void 0,
									onSeeked: slot === activeVideoSlot ? syncTime : void 0,
									onEnded: slot === activeVideoSlot ? advanceClip : void 0,
									onLoadedMetadata: slot === activeVideoSlot ? (e) => {
										const d = e.currentTarget.duration;
										if (isFinite(d) && d > 0 && !currentClip?.duration) setClips((previous) => {
											const measured = previous.map((item, index) => index === activeClipIndex ? {
												...item,
												duration: d
											} : item);
											if (reelSequenceDuration(measured) > 90) notifyMaxDuration();
											return capEditorClips(measured);
										});
									} : void 0,
									"aria-hidden": slot !== activeVideoSlot,
									tabIndex: -1,
									className: `absolute inset-0 h-full w-full object-contain will-change-transform transition-opacity duration-75 ${slot === activeVideoSlot && !gpuPreviewEnabled ? "opacity-100" : "opacity-0"}`,
									style: {
										transform: `translate3d(${currentClip?.cropX ?? 0}%,${currentClip?.cropY ?? 0}%,0) rotate(${currentClip?.rotation || 0}deg) scale(${currentClip?.crop ?? 1})`,
										backfaceVisibility: "hidden",
										clipPath: currentClip?.cropBox ? `inset(${currentClip.cropBox.y}% ${100 - (currentClip.cropBox.x + currentClip.cropBox.w)}% ${100 - (currentClip.cropBox.y + currentClip.cropBox.h)}% ${currentClip.cropBox.x}%)` : void 0,
										filter: currentClip?.filter === "vivid" ? "saturate(1.35) contrast(1.08)" : currentClip?.filter === "noir" ? "grayscale(1) contrast(1.16)" : currentClip?.filter === "cyber" ? "saturate(1.35) hue-rotate(65deg) contrast(1.12)" : currentClip?.filter === "warm" ? "sepia(0.22) saturate(1.15) brightness(1.03)" : "none"
									}
								}, slot)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GpuVideoPreview, {
									videoRef,
									filter: currentClip?.filter ?? "none",
									contrast: currentClip?.contrast ?? 1,
									saturation: currentClip?.saturation ?? 1,
									warmth: currentClip?.warmth ?? 0,
									grain: currentClip?.grain ?? 0,
									onCapability: handleGpuCapability,
									className: `absolute inset-0 h-full w-full object-contain transition-opacity duration-200 ${gpuPreviewEnabled ? "opacity-100" : "opacity-0"}`,
									style: {
										transform: `translate3d(${currentClip?.cropX ?? 0}%,${currentClip?.cropY ?? 0}%,0) rotate(${currentClip?.rotation || 0}deg) scale(${currentClip?.crop ?? 1})`,
										clipPath: currentClip?.cropBox ? `inset(${currentClip.cropBox.y}% ${100 - (currentClip.cropBox.x + currentClip.cropBox.w)}% ${100 - (currentClip.cropBox.y + currentClip.cropBox.h)}% ${currentClip.cropBox.x}%)` : void 0
									}
								}),
								activeToolPanel === "CROP" && currentClip && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									onPointerDown: (e) => startCropDrag(e, "move"),
									className: "absolute border-2 border-orange-500 bg-orange-500/10 cursor-move touch-none",
									style: {
										left: `${currentClip.cropBox?.x ?? 10}%`,
										top: `${currentClip.cropBox?.y ?? 10}%`,
										width: `${currentClip.cropBox?.w ?? 80}%`,
										height: `${currentClip.cropBox?.h ?? 80}%`
									},
									children: [
										"nw",
										"ne",
										"sw",
										"se"
									].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										onPointerDown: (e) => startCropDrag(e, h),
										className: "absolute w-5 h-5 bg-orange-500 rounded-full border-2 border-white shadow touch-none",
										style: {
											left: h.includes("w") ? -10 : void 0,
											right: h.includes("e") ? -10 : void 0,
											top: h.startsWith("n") ? -10 : void 0,
											bottom: h.startsWith("s") ? -10 : void 0
										}
									}, h))
								}),
								currentClip?.textOverlay && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									onPointerDown: (e) => startTextGesture(e),
									onClick: (e) => {
										e.stopPropagation();
										setTextSelected(true);
									},
									className: `absolute -translate-x-1/2 -translate-y-1/2 bg-white/85 text-foreground font-black px-4 py-2 rounded-xl border shadow-lg backdrop-blur-sm cursor-move touch-none select-none ${textSelected && !isPlaying ? "border-orange-400" : "border-transparent"}`,
									style: {
										left: `${currentClip.textX ?? 50}%`,
										top: `${currentClip.textY ?? 50}%`,
										fontSize: `${1.1 * (currentClip.textSize ?? 1)}rem`
									},
									children: [currentClip.textOverlay, textSelected && !isPlaying && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											"aria-hidden": "true",
											onPointerDown: (e) => startTextGesture(e, "resize", e.currentTarget.parentElement),
											className: "absolute -left-2 -top-2 h-3.5 w-3.5 rounded-full border-2 border-white bg-orange-500 shadow"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											"aria-hidden": "true",
											onPointerDown: (e) => startTextGesture(e, "resize", e.currentTarget.parentElement),
											className: "absolute -right-2 -top-2 h-3.5 w-3.5 rounded-full border-2 border-white bg-orange-500 shadow"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											"aria-hidden": "true",
											onPointerDown: (e) => startTextGesture(e, "resize", e.currentTarget.parentElement),
											className: "absolute -bottom-2 -left-2 h-3.5 w-3.5 rounded-full border-2 border-white bg-orange-500 shadow"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											"aria-hidden": "true",
											onPointerDown: (e) => startTextGesture(e, "resize", e.currentTarget.parentElement),
											className: "absolute -bottom-2 -right-2 h-3.5 w-3.5 rounded-full border-2 border-white bg-orange-500 shadow"
										})
									] })]
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-shrink-0 flex items-center justify-between px-4 py-2 bg-card/95 backdrop-blur-xl border-t border-border",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: togglePlay,
								className: "w-10 h-10 rounded-full bg-gradient-to-b from-orange-400 to-orange-600 text-white flex items-center justify-center shadow-[0_6px_16px_-6px_rgba(249,115,22,0.9)] transition-transform duration-150 ease-out active:scale-90",
								"aria-label": isPlaying ? "Pause" : "Play",
								children: isPlaying ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { size: 18 })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-[11px] font-bold tabular-nums text-muted-foreground",
								children: [
									"Clip ",
									activeClipIndex + 1,
									"/",
									clips.length,
									" · ",
									currentClip?.speed,
									"x"
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center gap-1.5 text-muted-foreground",
							children: [
								{
									key: "undo",
									Icon: Undo2,
									label: "Undo",
									onClick: handleUndo,
									disabled: !canUndo
								},
								{
									key: "redo",
									Icon: Redo2,
									label: "Redo",
									onClick: handleRedo,
									disabled: !canRedo
								},
								{
									key: "split",
									Icon: SquareSplitHorizontal,
									label: "Split clip at playhead",
									onClick: handleSplit
								},
								{
									key: "dup",
									Icon: Copy,
									label: "Duplicate clip",
									onClick: handleDuplicate
								},
								{
									key: "del",
									Icon: Trash2,
									label: "Delete clip",
									onClick: handleDelete,
									danger: true
								}
							].map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: b.onClick,
								disabled: b.disabled,
								"aria-label": b.label,
								className: `grid h-8 w-8 place-items-center rounded-full bg-muted/60 transition-transform duration-150 ease-out active:scale-90 ${b.disabled ? "opacity-35" : b.danger ? "text-destructive" : "text-foreground"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(b.Icon, { size: 15 })
							}, b.key))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-shrink-0 bg-card/95 backdrop-blur-xl border-t border-border px-2 py-1.5 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none overscroll-x-contain",
						style: { WebkitOverflowScrolling: "touch" },
						children: TOOL_MENU.map((t) => {
							const active = activeToolPanel === t.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => handleToolMenu(t.id),
								style: { transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" },
								className: `flex flex-col items-center justify-center gap-0.5 min-w-[44px] py-1.5 px-1 rounded-2xl text-[8px] font-extrabold uppercase tracking-tight flex-shrink-0 border duration-200 [transition-property:transform,background-color,color,box-shadow] active:scale-90 ${active ? "bg-gradient-to-b from-orange-400 to-orange-600 text-white border-orange-500 shadow-[0_6px_14px_-8px_rgba(249,115,22,0.95)] scale-[1.04]" : "bg-muted/70 text-foreground border-transparent"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(t.Icon, { size: 15 }), t.label]
							}, t.id);
						})
					}),
					activeToolPanel !== "NONE" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-shrink-0 bg-card/95 backdrop-blur-xl border-t border-border p-3 flex flex-col gap-2",
						style: { animation: "yw-rise 220ms cubic-bezier(0.22,1,0.36,1) both" },
						children: [
							activeToolPanel === "TRIM" && currentClip && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[10px] font-bold uppercase text-muted-foreground",
										children: ["Trim clip ", activeClipIndex + 1]
									}),
									["trimStart", "trimEnd"].map((k) => {
										const dur = currentClip.duration || 0;
										const val = k === "trimStart" ? currentClip.trimStart ?? 0 : currentClip.trimEnd ?? dur;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "flex items-center gap-3 text-[10px] font-bold text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "w-10",
													children: k === "trimStart" ? "Start" : "End"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "range",
													min: 0,
													max: dur || 1,
													step: .05,
													value: val,
													onChange: (e) => {
														const n = Number(e.target.value);
														const s = currentClip.trimStart ?? 0;
														const en = currentClip.trimEnd ?? dur;
														if (k === "trimStart") updateCurrentClip("trimStart", Math.min(n, en - .2));
														else updateCurrentClip("trimEnd", Math.max(n, s + .2));
													},
													className: "flex-1 accent-orange-500"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "w-10 text-right font-mono",
													children: [val.toFixed(1), "s"]
												})
											]
										}, k);
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: handleSplit,
										className: "self-start text-[10px] font-black uppercase text-orange-600",
										children: "Split at playhead"
									})
								]
							}),
							activeToolPanel === "CROP" && currentClip && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex gap-2 overflow-x-auto pb-1 scrollbar-none",
										children: [
											{
												label: "Free",
												r: null
											},
											{
												label: "9:16",
												r: 9 / 16
											},
											{
												label: "4:5",
												r: 4 / 5
											},
											{
												label: "1:1",
												r: 1
											},
											{
												label: "4:3",
												r: 4 / 3
											},
											{
												label: "16:9",
												r: 16 / 9
											}
										].map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => applyAspect(a.r),
											className: "px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase border border-border bg-muted text-foreground flex-shrink-0 active:scale-95 transition",
											children: a.label
										}, a.label))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-semibold text-muted-foreground",
										children: "Drag the box on the video to crop freely."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-center gap-3 text-[10px] font-bold text-muted-foreground",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crop, {
												size: 14,
												className: "text-orange-500"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "range",
												min: 1,
												max: 3,
												step: .05,
												value: currentClip.crop ?? 1,
												onChange: (e) => updateCurrentClip("crop", Number(e.target.value)),
												className: "flex-1 accent-orange-500"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "w-12 text-right font-mono",
												children: [(currentClip.crop ?? 1).toFixed(2), "x"]
											})
										]
									})
								]
							}),
							activeToolPanel === "FILTER" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex gap-2 overflow-x-auto pb-1 scrollbar-none",
									children: [
										"none",
										"vivid",
										"noir",
										"cyber",
										"warm"
									].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => updateCurrentClip("filter", f),
										className: `px-4 py-2 rounded-xl font-bold text-xs uppercase border transition flex-shrink-0 ${currentClip?.filter === f ? "bg-orange-500 text-white border-orange-500" : "bg-muted text-foreground border-border"}`,
										children: f
									}, f))
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-2 gap-x-4 gap-y-2",
									children: [
										[
											"contrast",
											"Contrast",
											.6,
											1.6,
											.01,
											currentClip?.contrast ?? 1
										],
										[
											"saturation",
											"Saturation",
											0,
											2,
											.01,
											currentClip?.saturation ?? 1
										],
										[
											"warmth",
											"Warmth",
											-1,
											1,
											.01,
											currentClip?.warmth ?? 0
										],
										[
											"grain",
											"Film grain",
											0,
											.18,
											.01,
											currentClip?.grain ?? 0
										]
									].map(([key, label, min, max, step, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex min-w-0 items-center gap-2 text-[10px] font-bold text-muted-foreground",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "w-14 truncate",
												children: label
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "range",
												min,
												max,
												step,
												value,
												onChange: (e) => updateCurrentClip(key, Number(e.target.value)),
												className: "min-w-0 flex-1 accent-orange-500"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "w-8 text-right font-mono text-foreground",
												children: Number(value).toFixed(2)
											})
										]
									}, key))
								})]
							}),
							activeToolPanel === "SPEED" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-3 py-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, {
												size: 15,
												className: "text-orange-500"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "range",
												min: .1,
												max: 10,
												step: .05,
												value: currentClip?.speed ?? 1,
												onChange: (e) => updateCurrentClip("speed", Number(e.target.value)),
												className: "flex-1 accent-orange-500"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "w-12 text-right text-xs font-black tabular-nums",
												children: [(currentClip?.speed ?? 1).toFixed(2), "x"]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex items-center gap-2 overflow-x-auto scrollbar-none",
										children: [
											.1,
											.25,
											.5,
											1,
											2,
											4,
											8,
											10
										].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: () => updateCurrentClip("speed", s),
											className: `px-3 py-1.5 rounded-xl font-bold text-xs border transition flex-shrink-0 ${currentClip?.speed === s ? "bg-orange-500 text-white border-orange-500" : "bg-muted text-foreground border-border"}`,
											children: [s, "x"]
										}, s))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] font-black uppercase tracking-wider text-muted-foreground",
											children: "Ramp"
										}), [
											"constant",
											"up",
											"down"
										].map((ramp) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => updateCurrentClip("speedRamp", ramp),
											className: `rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase ${(currentClip?.speedRamp ?? "constant") === ramp ? "border-orange-500 bg-orange-500 text-white" : "border-border bg-muted text-foreground"}`,
											children: ramp === "constant" ? "Flat" : ramp
										}, ramp))]
									})
								]
							}),
							activeToolPanel === "STICKER" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex gap-2 overflow-x-auto pb-1 scrollbar-none",
								children: [
									"Flame",
									"Spark",
									"Cool",
									"Mint",
									"Audio",
									"Place",
									"Care",
									"Energy"
								].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => updateCurrentClip("textOverlay", s),
									className: "w-11 h-11 flex-shrink-0 rounded-2xl bg-muted text-[10px] font-semibold flex items-center justify-center",
									children: s
								}, s))
							}),
							activeToolPanel === "TEXT" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									value: customTextInput,
									onChange: (e) => setCustomTextInput(e.target.value),
									placeholder: "Type text overlay...",
									className: "flex-1 bg-muted border border-border rounded-xl px-4 py-2 text-xs font-bold text-foreground focus:outline-none"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => {
										updateCurrentClip("textOverlay", customTextInput);
										setTextSelected(true);
										setActiveToolPanel("NONE");
									},
									className: "bg-orange-500 text-white px-4 py-2 rounded-xl font-bold text-xs",
									children: "Apply"
								})]
							})
						]
					}, activeToolPanel),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-shrink-0 pb-[max(0.25rem,env(safe-area-inset-bottom))]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LightTimeline, {
							clips,
							activeIndex: activeClipIndex,
							currentTime,
							totalDuration,
							playFraction,
							isPlaying,
							audioLabel: audioTrack?.title,
							audioTrack,
							onAudioChange: (next) => setAudioTrack(next),
							onAudioRemove: () => setAudioTrack(null),
							onAddAudio: () => setShowMusicPicker(true),
							isMuted,
							onToggleMute: () => setIsMuted(!isMuted),
							onSelect: (i) => {
								scrubbingRef.current = false;
								if (scrubTimerRef.current) clearTimeout(scrubTimerRef.current);
								selectClip(i);
							},
							onTrim: (i, start, end) => {
								const source = clips[i];
								const duration = source?.duration ?? 0;
								const snap = (value) => {
									const points = [
										0,
										duration,
										source?.trimStart ?? 0,
										source?.trimEnd ?? duration
									];
									const nearest = points.reduce((best, point) => Math.abs(point - value) < Math.abs(best - value) ? point : best, points[0] ?? value);
									return Math.abs(nearest - value) < .12 ? nearest : value;
								};
								const nextStart = snap(start);
								const nextEnd = snap(end);
								if (Math.abs(nextStart - start) > .001 || Math.abs(nextEnd - end) > .001) try {
									navigator.vibrate?.(6);
								} catch {}
								setClips((prev) => {
									const measured = prev.map((c, idx) => idx === i ? {
										...c,
										trimStart: nextStart,
										trimEnd: nextEnd
									} : c);
									if (reelSequenceDuration(measured) > 90) notifyMaxDuration();
									return capEditorClips(measured);
								});
							},
							onAdd: () => fileInputRef.current?.click(),
							onReorder: (from, to) => {
								setClips((prev) => {
									const next = [...prev];
									const [moved] = next.splice(from, 1);
									next.splice(to, 0, moved);
									return next;
								});
								setActiveClipIndex(to);
								toast.success("Clip moved");
							},
							onScrub: (i, frac) => {
								const v = videoRef.current;
								scrubbingRef.current = true;
								if (scrubTimerRef.current) clearTimeout(scrubTimerRef.current);
								scrubTimerRef.current = setTimeout(() => {
									scrubbingRef.current = false;
								}, 220);
								if (i !== activeClipIndex) setActiveClipIndex(i);
								const clip = clips[i];
								if (!v || !clip) return;
								const dur = clip.duration || v.duration || 0;
								if (!dur || !isFinite(dur)) return;
								const start = clip.trimStart ?? 0;
								const end = clip.trimEnd ?? dur;
								if (!v.paused) {
									v.pause();
									setIsPlaying(false);
								}
								const rawTarget = Math.min(end, Math.max(start, start + frac * (end - start)));
								const nearest = [start, end].reduce((best, point) => Math.abs(point - rawTarget) < Math.abs(best - rawTarget) ? point : best, rawTarget);
								const target = Math.abs(nearest - rawTarget) < .12 ? nearest : rawTarget;
								if (target !== rawTarget) try {
									navigator.vibrate?.(6);
								} catch {}
								pendingSeekRef.current = target;
								if (seekRafRef.current) return;
								seekRafRef.current = requestAnimationFrame(() => {
									seekRafRef.current = null;
									const t = pendingSeekRef.current;
									if (t == null || !videoRef.current) return;
									const vid = videoRef.current;
									if (Math.abs(vid.currentTime - t) < .02) return;
									if (typeof vid.fastSeek === "function") vid.fastSeek(t);
									else vid.currentTime = t;
								});
							}
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
						ref: audioElRef,
						src: audioTrack?.url,
						preload: "auto",
						className: "hidden"
					}),
					showMusicPicker && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute inset-0 z-[60] bg-foreground/30 flex items-end",
						onClick: () => setShowMusicPicker(false),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "w-full bg-card border-t border-border rounded-t-3xl p-4 max-h-[70%] overflow-y-auto",
							onClick: (e) => e.stopPropagation(),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] font-black uppercase tracking-wide text-muted-foreground mb-3",
									children: "Music Library"
								}),
								audioTrack && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-3 p-3 rounded-2xl bg-muted/70 border border-border",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between mb-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[11px] font-black truncate text-foreground",
												children: audioTrack.title
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-[10px] font-mono text-muted-foreground",
												children: [
													fmtSec(audioTrack.clipStart),
													" → ",
													fmtSec(audioTrack.clipEnd)
												]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "block text-[10px] font-bold uppercase text-muted-foreground mb-1",
											children: "Start in song"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "range",
											min: 0,
											max: Math.max(.2, audioTrack.duration - .2),
											step: .1,
											value: audioTrack.clipStart,
											onChange: (e) => {
												const s = Number(e.target.value);
												setAudioTrack((t) => t ? {
													...t,
													clipStart: s,
													clipEnd: Math.max(s + .5, t.clipEnd)
												} : t);
											},
											className: "w-full accent-orange-500 mb-2"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "block text-[10px] font-bold uppercase text-muted-foreground mb-1",
											children: "End in song"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "range",
											min: .2,
											max: audioTrack.duration,
											step: .1,
											value: audioTrack.clipEnd,
											onChange: (e) => {
												const en = Number(e.target.value);
												setAudioTrack((t) => t ? {
													...t,
													clipEnd: en,
													clipStart: Math.min(t.clipStart, en - .5)
												} : t);
											},
											className: "w-full accent-orange-500 mb-2"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "block text-[10px] font-bold uppercase text-muted-foreground mb-1",
											children: [
												"Place at ",
												fmtSec(audioTrack.start),
												" on video"
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "range",
											min: 0,
											max: Math.max(.5, totalDuration),
											step: .1,
											value: Math.min(audioTrack.start, Math.max(.5, totalDuration)),
											onChange: (e) => setAudioTrack((t) => t ? {
												...t,
												start: Number(e.target.value)
											} : t),
											className: "w-full accent-orange-500"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex gap-2 mt-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => {
													const a = audioElRef.current;
													if (!a || !audioTrack) return;
													try {
														a.currentTime = audioTrack.clipStart;
													} catch {}
													a.play().catch(() => {});
													window.setTimeout(() => a.pause(), 4e3);
												},
												className: "flex-1 py-2 rounded-xl bg-orange-500 text-white text-[11px] font-black uppercase",
												children: "Preview"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => setShowMusicPicker(false),
												className: "flex-1 py-2 rounded-xl bg-card border border-border text-[11px] font-black uppercase text-foreground",
												children: "Done"
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => audioInputRef.current?.click(),
									className: "w-full mb-3 flex items-center gap-3 p-3 rounded-2xl border border-dashed border-orange-500/50 bg-orange-500/10 text-left active:scale-[0.99] transition",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { size: 16 })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex-1 min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-xs font-black text-foreground",
											children: "Upload from device"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-[10px] text-muted-foreground",
											children: "Pick any song from your gallery or storage"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-2",
									children: [NO_COPYRIGHT_MUSIC.map((m) => {
										const [mm, ss] = m.duration.split(":").map(Number);
										const secs = (mm || 0) * 60 + (ss || 0);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: () => {
												setAudioTrack({
													id: m.id,
													title: m.title,
													url: m.url,
													start: 0,
													clipStart: 0,
													clipEnd: secs,
													duration: secs
												});
												setShowMusicPicker(false);
												toast.success(`${m.title} added to audio track`);
											},
											className: "flex items-center gap-3 p-3 rounded-2xl bg-muted text-left active:scale-[0.99] transition",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "w-9 h-9 rounded-xl bg-orange-500/15 text-orange-600 flex items-center justify-center",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Music, { size: 16 })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "flex-1 min-w-0",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "block text-xs font-bold truncate text-foreground",
														children: m.title
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "block text-[10px] text-muted-foreground truncate",
														children: [
															m.artist,
															" · ",
															m.category
														]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[10px] font-mono text-muted-foreground",
													children: m.duration
												})
											]
										}, m.id);
									}), audioTrack && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => {
											setAudioTrack(null);
											setShowMusicPicker(false);
										},
										className: "p-3 rounded-2xl bg-destructive/10 text-destructive text-xs font-bold",
										children: "Remove audio track"
									})]
								})
							]
						})
					})
				]
			})
		]
	});
}
//#endregion
export { CreateStudioPage as component };
