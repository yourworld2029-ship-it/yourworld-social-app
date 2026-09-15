import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $t as Download, A as Star, Dt as Lock, F as Smile, Ft as Image$1, Ht as Grid3x3, Mn as Archive, Q as Redo2, Qt as Earth, V as Share2, Y as RotateCcw, Z as RefreshCw, _n as ChevronDown, bt as MessageCircle, c as Volume2, ct as Pencil, f as Users, ft as Music, hn as ChevronRight, i as X, k as Sun, lt as Pause, mn as ChevronUp, mt as Moon, n as Zap, nn as Contrast, r as ZapOff, s as VolumeX, tn as Crop, tt as Play, ut as Palette, v as Undo2, vn as Check, w as Timer, wt as MapPin, xn as Camera, y as Type, zt as Heart } from "../_libs/lucide-react.mjs";
import { bt as adaptiveCameraCaptureAttempts, g as unregisterBlob, h as registerBlob, s as useUploads, v as useMoments } from "./router-BTQBfqQy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/moment-parts-CwmVu3F-.js
/** Splits a duration into consecutive moment-sized segments. */
function splitMomentIntoParts(duration) {
	if (!duration || duration <= 30) return [{
		start: 0,
		end: duration || 0
	}];
	const count = Math.ceil(duration / 30);
	return Array.from({ length: count }, (_, index) => ({
		start: index * 30,
		end: Math.min(duration, (index + 1) * 30)
	}));
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/moment.create-CDuyZ6bD.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var NO_COPYRIGHT_MUSIC = [
	{
		id: "1",
		title: "Cyber Vibe",
		artist: "YourWorld Originals",
		category: "Trending",
		duration: "2:15",
		url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3"
	},
	{
		id: "2",
		title: "Chill Lofi Beats",
		artist: "NoCopyrightSounds",
		category: "Lo-Fi",
		duration: "1:48",
		url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3"
	},
	{
		id: "3",
		title: "Cinematic Trailer",
		artist: "World Vault",
		category: "Cinematic",
		duration: "2:05",
		url: "https://cdn.pixabay.com/download/audio/2021/09/06/audio_8fa389f41f.mp3"
	},
	{
		id: "4",
		title: "Dark Drill Beat",
		artist: "Prod. YourWorld",
		category: "Drill",
		duration: "1:30",
		url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3"
	}
];
var FULL_RECT = {
	x: 0,
	y: 0,
	w: 1,
	h: 1
};
var clamp01 = (v) => Math.min(1, Math.max(0, v));
/** Moments are published in chunks of at most this many seconds. */
var fmtTime = (s) => {
	const total = Math.max(0, Math.floor(s || 0));
	const m = Math.floor(total / 60);
	const sec = total % 60;
	return `${m}:${String(sec).padStart(2, "0")}`;
};
/** Reads the duration of a video url (0 when unknown). */
var readVideoDuration = (url) => new Promise((resolve) => {
	const probe = document.createElement("video");
	probe.preload = "metadata";
	probe.muted = true;
	const done = (v) => resolve(Number.isFinite(v) && v > 0 ? v : 0);
	probe.onloadedmetadata = () => done(probe.duration);
	probe.onerror = () => done(0);
	probe.src = url;
});
var FILTERS = {
	normal: {
		name: "Normal",
		css: ""
	},
	vivid: {
		name: "Vivid",
		css: "saturate(1.45) contrast(1.08)"
	},
	warm: {
		name: "Warm",
		css: "sepia(.16) saturate(1.25) hue-rotate(-8deg)"
	},
	cool: {
		name: "Cool",
		css: "saturate(.95) hue-rotate(12deg) contrast(1.05)"
	},
	mono: {
		name: "Mono",
		css: "grayscale(1) contrast(1.1)"
	},
	dramatic: {
		name: "Drama",
		css: "contrast(1.35) saturate(1.15)"
	},
	fade: {
		name: "Fade",
		css: "contrast(.9) saturate(.8) brightness(1.08)"
	},
	dream: {
		name: "Dream",
		css: "brightness(1.08) saturate(1.15) contrast(.92)"
	}
};
function MomentCreatePage() {
	const navigate = useNavigate();
	const { addMoment } = useMoments();
	const { startUpload } = useUploads();
	const videoRef = (0, import_react.useRef)(null);
	const streamRef = (0, import_react.useRef)(null);
	const captureCanvasRef = (0, import_react.useRef)(null);
	const mediaRecorderRef = (0, import_react.useRef)(null);
	const recordedChunksRef = (0, import_react.useRef)([]);
	const imageInputRef = (0, import_react.useRef)(null);
	const audioInputRef = (0, import_react.useRef)(null);
	const drawingCanvasRef = (0, import_react.useRef)(null);
	const pinchStartDistance = (0, import_react.useRef)(null);
	const [facingMode, setFacingMode] = (0, import_react.useState)("user");
	const [captureMode, setCaptureMode] = (0, import_react.useState)("photo");
	const [cameraReady, setCameraReady] = (0, import_react.useState)(false);
	const [cameraError, setCameraError] = (0, import_react.useState)("");
	const [isRecording, setIsRecording] = (0, import_react.useState)(false);
	const [recordingSeconds, setRecordingSeconds] = (0, import_react.useState)(0);
	const [isFlashOn, setIsFlashOn] = (0, import_react.useState)(false);
	const [isGridOn, setIsGridOn] = (0, import_react.useState)(false);
	const [isNightMode, setIsNightMode] = (0, import_react.useState)(false);
	const [zoom, setZoom] = (0, import_react.useState)(1);
	const [maxZoom, setMaxZoom] = (0, import_react.useState)(1);
	const [timerSeconds, setTimerSeconds] = (0, import_react.useState)(null);
	const [timerRunning, setTimerRunning] = (0, import_react.useState)(false);
	const [qualityLabel, setQualityLabel] = (0, import_react.useState)("AUTO");
	const [, setCameraResolution] = (0, import_react.useState)("");
	const [step, setStep] = (0, import_react.useState)(0);
	const [mediaUrl, setMediaUrl] = (0, import_react.useState)(null);
	const [mediaBlob, setMediaBlob] = (0, import_react.useState)(null);
	const [isVideo, setIsVideo] = (0, import_react.useState)(false);
	const [selectedFilter, setSelectedFilter] = (0, import_react.useState)("normal");
	const [brightness, setBrightness] = (0, import_react.useState)(100);
	const [contrast, setContrast] = (0, import_react.useState)(100);
	const [saturation, setSaturation] = (0, import_react.useState)(100);
	const [cropRatio, setCropRatio] = (0, import_react.useState)("original");
	const [rotation, setRotation] = (0, import_react.useState)(0);
	const [videoSpeed, setVideoSpeed] = (0, import_react.useState)(1);
	const [videoMuted, setVideoMuted] = (0, import_react.useState)(false);
	const [selectedAudio, setSelectedAudio] = (0, import_react.useState)(null);
	const [musicTitle, setMusicTitle] = (0, import_react.useState)(null);
	const [musicArtist, setMusicArtist] = (0, import_react.useState)(null);
	const [audioUrl, setAudioUrl] = (0, import_react.useState)(null);
	const [audioDuration, setAudioDuration] = (0, import_react.useState)(0);
	const [audioStart, setAudioStart] = (0, import_react.useState)(0);
	const [audioEnd, setAudioEnd] = (0, import_react.useState)(0);
	const [audioVolume, setAudioVolume] = (0, import_react.useState)(.8);
	const [audioPlaying, setAudioPlaying] = (0, import_react.useState)(false);
	const [showMusicLibrary, setShowMusicLibrary] = (0, import_react.useState)(false);
	const [showMusicPanel, setShowMusicPanel] = (0, import_react.useState)(false);
	const [panel, setPanel] = (0, import_react.useState)(null);
	const [showFinalPreview, setShowFinalPreview] = (0, import_react.useState)(false);
	const [photoSeconds, setPhotoSeconds] = (0, import_react.useState)(15);
	const previewAudioRef = (0, import_react.useRef)(null);
	const [caption, setCaption] = (0, import_react.useState)("");
	const [overlayText, setOverlayText] = (0, import_react.useState)("");
	const [showTextInput, setShowTextInput] = (0, import_react.useState)(false);
	const [textColor, setTextColor] = (0, import_react.useState)("#ffffff");
	const [textSize, setTextSize] = (0, import_react.useState)(28);
	const [textX, setTextX] = (0, import_react.useState)(50);
	const [textY, setTextY] = (0, import_react.useState)(45);
	const [textLayers, setTextLayers] = (0, import_react.useState)([]);
	const [activeTextId, setActiveTextId] = (0, import_react.useState)(null);
	const frameRef = (0, import_react.useRef)(null);
	const updateActiveText = (patch) => setTextLayers((items) => items.map((item) => item.id === activeTextId ? {
		...item,
		...patch
	} : item));
	const [cropRect, setCropRect] = (0, import_react.useState)(FULL_RECT);
	const [cropMode, setCropMode] = (0, import_react.useState)(false);
	const [cropDraft, setCropDraft] = (0, import_react.useState)(FULL_RECT);
	const cropStyle = () => ({
		left: `${-cropRect.x / cropRect.w * 100}%`,
		top: `${-cropRect.y / cropRect.h * 100}%`,
		width: `${100 / cropRect.w}%`,
		height: `${100 / cropRect.h}%`
	});
	const [stickers, setStickers] = (0, import_react.useState)([]);
	const [drawMode, setDrawMode] = (0, import_react.useState)(false);
	const [drawColor, setDrawColor] = (0, import_react.useState)("#ffffff");
	const [drawSize, setDrawSize] = (0, import_react.useState)(6);
	const drawingHistory = (0, import_react.useRef)([]);
	const drawingHistoryIndex = (0, import_react.useRef)(-1);
	const isDrawing = (0, import_react.useRef)(false);
	const [audience, setAudience] = (0, import_react.useState)("everyone");
	const [durationHours, setDurationHours] = (0, import_react.useState)(24);
	const [allowPoll, setAllowPoll] = (0, import_react.useState)(false);
	const [screenshotAlert, setScreenshotAlert] = (0, import_react.useState)(true);
	const [allowDownloads, setAllowDownloads] = (0, import_react.useState)(true);
	const [saveToArchive, setSaveToArchive] = (0, import_react.useState)(true);
	const [allowReplies, setAllowReplies] = (0, import_react.useState)(true);
	const [allowReactions, setAllowReactions] = (0, import_react.useState)(true);
	const [showLocation, setShowLocation] = (0, import_react.useState)(false);
	const [allowSharing, setAllowSharing] = (0, import_react.useState)(true);
	const getVideoTrack = () => {
		return streamRef.current?.getVideoTracks()[0] || null;
	};
	const getCapabilities = (0, import_react.useCallback)(() => {
		const track = getVideoTrack();
		if (!track) return null;
		try {
			if (typeof track.getCapabilities !== "function") return null;
			return track.getCapabilities();
		} catch {
			return null;
		}
	}, []);
	const startCamera = (0, import_react.useCallback)(async () => {
		setCameraReady(false);
		setCameraError("");
		try {
			streamRef.current?.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("Camera is not supported by this browser.");
			const requests = adaptiveCameraCaptureAttempts(facingMode);
			let stream = null;
			for (const constraints of requests) try {
				stream = await navigator.mediaDevices.getUserMedia(constraints);
				if (stream) break;
			} catch {
				continue;
			}
			if (!stream) throw new Error("Camera permission denied or camera unavailable.");
			streamRef.current = stream;
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				await videoRef.current.play().catch(() => {});
			}
			const settings = stream.getVideoTracks()[0].getSettings();
			const width = settings.width || 0;
			const height = settings.height || 0;
			if (width && height) {
				setCameraResolution(`${width} × ${height}`);
				if (width >= 3840 || height >= 2160) setQualityLabel("4K");
				else if (width >= 1920 || height >= 1080) setQualityLabel("1080P");
				else if (width >= 1280 || height >= 720) setQualityLabel("HD");
				else setQualityLabel("AUTO");
			}
			const zoomCapability = getCapabilities()?.zoom;
			if (zoomCapability && typeof zoomCapability === "object") {
				const z = zoomCapability;
				setMaxZoom(z.max || 1);
				setZoom(z.min || 1);
			} else {
				setMaxZoom(1);
				setZoom(1);
			}
			setCameraReady(true);
		} catch (error) {
			console.error(error);
			setCameraError(error instanceof Error ? error.message : "Unable to start camera.");
		}
	}, [facingMode, getCapabilities]);
	(0, import_react.useEffect)(() => {
		if (step !== 0) return;
		startCamera();
		return () => {
			streamRef.current?.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		};
	}, [
		facingMode,
		startCamera,
		step
	]);
	const applyZoom = async (value) => {
		const track = getVideoTrack();
		if (!track) return;
		const capabilities = getCapabilities();
		if (!capabilities?.zoom) return;
		try {
			const z = capabilities.zoom;
			const min = z.min || 1;
			const max = z.max || 1;
			const next = Math.max(min, Math.min(max, value));
			await track.applyConstraints({ advanced: [{ zoom: next }] });
			setZoom(next);
		} catch {}
	};
	const getTouchDistance = (touches) => {
		if (touches.length < 2) return null;
		const a = touches[0];
		const b = touches[1];
		const dx = a.clientX - b.clientX;
		const dy = a.clientY - b.clientY;
		return Math.sqrt(dx * dx + dy * dy);
	};
	const handlePinchStart = (event) => {
		const distance = getTouchDistance(event.touches);
		if (distance) pinchStartDistance.current = distance;
	};
	const handlePinchMove = (event) => {
		const current = getTouchDistance(event.touches);
		if (!current || !pinchStartDistance.current) return;
		const difference = current - pinchStartDistance.current;
		applyZoom(zoom + difference / 180);
		pinchStartDistance.current = current;
	};
	const handlePinchEnd = () => {
		pinchStartDistance.current = null;
	};
	const toggleFlash = async () => {
		const track = getVideoTrack();
		if (!track) return;
		const capabilities = getCapabilities();
		if (!capabilities || !("torch" in capabilities)) return;
		try {
			await track.applyConstraints({ advanced: [{ torch: !isFlashOn }] });
			setIsFlashOn((value) => !value);
		} catch {
			console.log("Torch unavailable");
		}
	};
	const performPhotoCapture = () => {
		const video = videoRef.current;
		if (!video) return;
		const width = video.videoWidth || 1280;
		const height = video.videoHeight || 720;
		const canvas = captureCanvasRef.current || document.createElement("canvas");
		captureCanvasRef.current = canvas;
		if (canvas.width !== width) canvas.width = width;
		if (canvas.height !== height) canvas.height = height;
		const ctx = canvas.getContext("2d", {
			alpha: false,
			desynchronized: true,
			willReadFrequently: false
		});
		if (!ctx) return;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		if (facingMode === "user") {
			ctx.translate(width, 0);
			ctx.scale(-1, 1);
		}
		ctx.drawImage(video, 0, 0, width, height);
		canvas.toBlob((blob) => {
			if (!blob) return;
			const url = URL.createObjectURL(blob);
			registerBlob(url, blob);
			setMediaBlob(blob);
			setMediaUrl(url);
			setIsVideo(false);
			resetEditor();
			setStep(1);
		}, "image/jpeg", .92);
	};
	const capturePhoto = () => {
		if (timerRunning) return;
		if (!timerSeconds) {
			performPhotoCapture();
			return;
		}
		setTimerRunning(true);
		window.setTimeout(() => {
			performPhotoCapture();
			setTimerRunning(false);
		}, timerSeconds * 1e3);
	};
	const getMimeType = () => {
		return [
			"video/mp4;codecs=h264,aac",
			"video/webm;codecs=h264,opus",
			"video/webm;codecs=vp8,opus",
			"video/webm",
			"video/mp4"
		].find((type) => MediaRecorder.isTypeSupported(type)) || "";
	};
	const startRecording = () => {
		const stream = streamRef.current;
		if (!stream || isRecording) return;
		try {
			recordedChunksRef.current = [];
			const mimeType = getMimeType();
			const recorder = mimeType ? new MediaRecorder(stream, {
				mimeType,
				videoBitsPerSecond: 6e6,
				audioBitsPerSecond: 128e3
			}) : new MediaRecorder(stream);
			recorder.ondataavailable = (event) => {
				if (event.data.size > 0) recordedChunksRef.current.push(event.data);
			};
			recorder.onstop = () => {
				const blob = new Blob(recordedChunksRef.current, { type: mimeType || "video/webm" });
				const url = URL.createObjectURL(blob);
				registerBlob(url, blob);
				setMediaBlob(blob);
				setMediaUrl(url);
				setIsVideo(true);
				resetEditor();
				setStep(1);
				setRecordingSeconds(0);
			};
			mediaRecorderRef.current = recorder;
			recorder.start(1e3);
			setIsRecording(true);
			setRecordingSeconds(0);
		} catch (error) {
			console.error("Recording failed", error);
		}
	};
	const stopRecording = () => {
		const recorder = mediaRecorderRef.current;
		if (!recorder) return;
		if (recorder.state !== "inactive") recorder.stop();
		setIsRecording(false);
	};
	(0, import_react.useEffect)(() => {
		if (!isRecording) return;
		const interval = window.setInterval(() => {
			setRecordingSeconds((seconds) => seconds + 1);
		}, 1e3);
		return () => window.clearInterval(interval);
	}, [isRecording]);
	const handleShutter = () => {
		if (captureMode === "photo") capturePhoto();
		else if (isRecording) stopRecording();
		else startRecording();
	};
	const handleMediaUpload = (event) => {
		const file = event.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
		const url = URL.createObjectURL(file);
		registerBlob(url, file);
		setMediaBlob(file);
		setMediaUrl(url);
		setIsVideo(file.type.startsWith("video/"));
		resetEditor();
		setStep(1);
		event.target.value = "";
	};
	const handleAudioUpload = (event) => {
		const file = event.target.files?.[0];
		if (!file) return;
		const url = URL.createObjectURL(file);
		registerBlob(url, file);
		if (audioUrl?.startsWith("blob:")) {
			URL.revokeObjectURL(audioUrl);
			unregisterBlob(audioUrl);
		}
		const title = file.name.replace(/\.[^.]+$/, "");
		setAudioUrl(url);
		setSelectedAudio(title);
		setMusicTitle(title);
		setMusicArtist(null);
		setAudioDuration(0);
		setAudioStart(0);
		setAudioEnd(0);
		setShowMusicPanel(true);
		const probe = new Audio();
		probe.preload = "metadata";
		probe.src = url;
		probe.onloadedmetadata = () => {
			const dur = Number.isFinite(probe.duration) && probe.duration > 0 ? probe.duration : 0;
			setAudioDuration(dur);
			setAudioStart(0);
			setAudioEnd(Math.min(dur, 30) || dur);
		};
		event.target.value = "";
	};
	const removeAudio = () => {
		if (audioUrl?.startsWith("blob:")) {
			URL.revokeObjectURL(audioUrl);
			unregisterBlob(audioUrl);
		}
		setAudioUrl(null);
		setSelectedAudio(null);
		setMusicTitle(null);
		setMusicArtist(null);
		setAudioDuration(0);
		setAudioStart(0);
		setAudioEnd(0);
		setAudioPlaying(false);
		setShowMusicPanel(false);
	};
	const toggleAudioPreview = () => {
		const el = previewAudioRef.current;
		if (!el) return;
		if (el.paused) {
			el.currentTime = audioStart;
			el.volume = audioVolume;
			el.play().catch(() => {});
			setAudioPlaying(true);
		} else {
			el.pause();
			setAudioPlaying(false);
		}
	};
	const resetEditor = () => {
		setSelectedFilter("normal");
		setBrightness(100);
		setContrast(100);
		setSaturation(100);
		setCropRatio("original");
		setRotation(0);
		setVideoSpeed(1);
		setVideoMuted(false);
		setOverlayText("");
		setCaption("");
		setStickers([]);
		setDrawMode(false);
		setTextLayers([]);
		setActiveTextId(null);
		setCropRect(FULL_RECT);
		setCropDraft(FULL_RECT);
		setCropMode(false);
		clearDrawing();
	};
	const getMediaStyle = () => {
		return {
			filter: `${FILTERS[selectedFilter].css} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
			transform: `rotate(${rotation}deg) translateZ(0)`,
			willChange: "filter, transform",
			backfaceVisibility: "hidden",
			transition: "filter .15s linear, transform .2s cubic-bezier(.22,1,.36,1)"
		};
	};
	const cropClass = () => {
		switch (cropRatio) {
			case "9:16": return "aspect-[9/16]";
			case "4:5": return "aspect-[4/5]";
			case "1:1": return "aspect-square";
			default: return "w-full h-full";
		}
	};
	const rotateMedia = () => {
		setRotation((value) => (value + 90) % 360);
	};
	const addText = () => {
		setShowTextInput(true);
		setCropMode(false);
		const layer = {
			id: Date.now(),
			text: "YourWorld",
			x: 50,
			y: 45,
			size: 28,
			rotation: 0,
			color: textColor
		};
		setTextLayers((items) => [...items, layer]);
		setActiveTextId(layer.id);
		setOverlayText(layer.text);
	};
	const addSticker = (emoji) => {
		setStickers((items) => [...items, {
			id: Date.now(),
			emoji,
			x: 50,
			y: 55,
			size: 55
		}]);
	};
	const removeSticker = (id) => {
		setStickers((items) => items.filter((item) => item.id !== id));
	};
	const setupDrawingCanvas = (0, import_react.useCallback)(() => {
		const canvas = drawingCanvasRef.current;
		if (!canvas) return;
		const parent = canvas.parentElement;
		if (!parent) return;
		canvas.width = parent.clientWidth;
		canvas.height = parent.clientHeight;
		clearDrawing();
	}, []);
	const saveDrawingState = () => {
		const canvas = drawingCanvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
		drawingHistory.current = drawingHistory.current.slice(0, drawingHistoryIndex.current + 1);
		drawingHistory.current.push(data);
		drawingHistoryIndex.current = drawingHistory.current.length - 1;
	};
	const clearDrawing = () => {
		const canvas = drawingCanvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		drawingHistory.current = [];
		drawingHistoryIndex.current = -1;
	};
	const getPointerPosition = (event) => {
		const canvas = drawingCanvasRef.current;
		if (!canvas) return {
			x: 0,
			y: 0
		};
		const rect = canvas.getBoundingClientRect();
		const clientX = "touches" in event ? event.touches[0]?.clientX : event.clientX;
		const clientY = "touches" in event ? event.touches[0]?.clientY : event.clientY;
		return {
			x: clientX - rect.left,
			y: clientY - rect.top
		};
	};
	const startDrawing = (event) => {
		if (!drawMode) return;
		event.preventDefault();
		const canvas = drawingCanvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const position = getPointerPosition(event);
		ctx.beginPath();
		ctx.moveTo(position.x, position.y);
		ctx.lineWidth = drawSize;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.strokeStyle = drawColor;
		isDrawing.current = true;
	};
	const draw = (event) => {
		if (!drawMode || !isDrawing.current) return;
		event.preventDefault();
		const canvas = drawingCanvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const position = getPointerPosition(event);
		ctx.lineTo(position.x, position.y);
		ctx.stroke();
	};
	const stopDrawing = () => {
		if (!isDrawing.current) return;
		isDrawing.current = false;
		saveDrawingState();
	};
	const undoDrawing = () => {
		const canvas = drawingCanvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		if (drawingHistoryIndex.current <= 0) {
			clearDrawing();
			return;
		}
		drawingHistoryIndex.current--;
		const data = drawingHistory.current[drawingHistoryIndex.current];
		ctx.putImageData(data, 0, 0);
	};
	const redoDrawing = () => {
		const canvas = drawingCanvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		if (drawingHistoryIndex.current >= drawingHistory.current.length - 1) return;
		drawingHistoryIndex.current++;
		const data = drawingHistory.current[drawingHistoryIndex.current];
		ctx.putImageData(data, 0, 0);
	};
	(0, import_react.useEffect)(() => {
		if (step !== 1) return;
		const timer = window.setTimeout(() => {
			setupDrawingCanvas();
		}, 100);
		return () => window.clearTimeout(timer);
	}, [setupDrawingCanvas, step]);
	(0, import_react.useEffect)(() => {
		const video = document.querySelector("video[data-editor-video]");
		if (!video || !isVideo) return;
		video.playbackRate = videoSpeed;
		video.muted = videoMuted;
	}, [
		videoSpeed,
		videoMuted,
		isVideo,
		mediaUrl
	]);
	const downloadPhotoWithEdits = async () => {
		if (!mediaUrl || !mediaBlob || isVideo) return;
		const image = new Image();
		image.src = mediaUrl;
		await new Promise((resolve) => {
			image.onload = () => resolve();
		});
		const canvas = document.createElement("canvas");
		const sx = cropRect.x * image.naturalWidth;
		const sy = cropRect.y * image.naturalHeight;
		const sw = cropRect.w * image.naturalWidth;
		const sh = cropRect.h * image.naturalHeight;
		canvas.width = sw;
		canvas.height = sh;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.save();
		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.rotate(rotation * Math.PI / 180);
		ctx.filter = `${FILTERS[selectedFilter].css} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
		ctx.drawImage(image, sx, sy, sw, sh, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
		ctx.restore();
		const link = document.createElement("a");
		link.href = canvas.toDataURL("image/jpeg", .98);
		link.download = `yourworld-moment-${Date.now()}.jpg`;
		link.click();
	};
	const handleDownload = async () => {
		if (!mediaUrl) return;
		if (!isVideo) {
			await downloadPhotoWithEdits();
			return;
		}
		const link = document.createElement("a");
		link.href = mediaUrl;
		link.download = `yourworld-moment-${Date.now()}.webm`;
		link.click();
	};
	const retake = () => {
		if (mediaUrl) URL.revokeObjectURL(mediaUrl);
		if (audioUrl) URL.revokeObjectURL(audioUrl);
		setMediaUrl(null);
		setMediaBlob(null);
		setIsVideo(false);
		setSelectedAudio(null);
		setAudioUrl(null);
		setMusicTitle(null);
		setMusicArtist(null);
		resetEditor();
		setStep(0);
	};
	const handlePublish = async () => {
		if (!mediaUrl) return;
		const createdAt = /* @__PURE__ */ new Date();
		const expiresAt = new Date(createdAt.getTime() + durationHours * 60 * 60 * 1e3);
		const newId = (suffix) => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${suffix}`;
		const parts = isVideo ? splitMomentIntoParts(await readVideoDuration(mediaUrl)) : [{
			start: 0,
			end: 0
		}];
		const base = {
			mediaUrl,
			mediaType: isVideo ? "video" : "image",
			caption: caption || textLayers[0]?.text || overlayText,
			audio: selectedAudio,
			musicTitle,
			musicArtist,
			privacy: audience,
			durationHours,
			createdAt: createdAt.toISOString(),
			expiresAt: expiresAt.toISOString(),
			filter: selectedFilter,
			brightness,
			contrast,
			saturation,
			cropRatio,
			rotation,
			videoSpeed,
			allowPoll,
			screenshotAlert,
			allowDownloads,
			saveToArchive,
			allowReplies,
			allowReactions,
			showLocation,
			allowSharing
		};
		const newMoments = parts.map((part, index) => ({
			...base,
			id: newId(index),
			trim: isVideo ? {
				start: part.start,
				end: part.end
			} : void 0,
			partIndex: index + 1,
			partCount: parts.length,
			caption: base.caption
		}));
		const existing = JSON.parse(localStorage.getItem("yw_moments") || "[]");
		localStorage.setItem("yw_moments", JSON.stringify([...newMoments, ...existing]));
		for (const part of newMoments) await startUpload({
			kind: "moment",
			label: part.caption ?? "New moment",
			thumbnail: null,
			viewTo: "/moment"
		}, (onProgress) => addMoment({
			kind: isVideo ? "video" : "photo",
			media: mediaUrl,
			mediaType: part.mediaType,
			text: part.caption ?? "",
			textBg: "",
			music: selectedAudio ?? void 0,
			musicTitle: musicTitle ?? void 0,
			musicArtist: musicArtist ?? void 0,
			musicUrl: audioUrl ?? void 0,
			musicStart: audioUrl ? audioStart : void 0,
			audioStartTime: audioUrl ? audioStart : void 0,
			musicEnd: audioUrl ? audioEnd : void 0,
			musicVolume: audioUrl ? audioVolume : void 0,
			stickers: [],
			trim: part.trim ?? (!isVideo && audioUrl ? {
				start: 0,
				end: photoSeconds
			} : void 0),
			mentions: [],
			allowReactions,
			allowReplies,
			allowSharing,
			showLocation,
			saveToArchive,
			privacy: audience === "close_friends" ? "close" : audience === "only_me" ? "onlyme" : audience,
			duration: durationHours,
			effect: "none",
			ai: {},
			allowDownload: allowDownloads,
			screenshotAlert,
			poll: null,
			onUploadProgress: onProgress
		}));
		navigate({ to: "/moment" });
	};
	const [showExtraTools, setShowExtraTools] = (0, import_react.useState)(false);
	const [snapDuration, setSnapDuration] = (0, import_react.useState)(null);
	if (step === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative w-full h-screen bg-black text-white overflow-hidden select-none",
		onTouchStart: handlePinchStart,
		onTouchMove: handlePinchMove,
		onTouchEnd: handlePinchEnd,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: imageInputRef,
				type: "file",
				accept: "image/*,video/*",
				className: "hidden",
				onChange: handleMediaUpload
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
				ref: videoRef,
				autoPlay: true,
				playsInline: true,
				muted: true,
				className: `gpu-layer absolute inset-0 w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`,
				style: { filter: isNightMode ? "brightness(1.2) contrast(1.1)" : void 0 }
			}),
			isGridOn && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 z-10 grid grid-cols-3 grid-rows-3 pointer-events-none",
				children: Array.from({ length: 9 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "border border-white/25" }, i))
			}),
			cameraError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/70",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-zinc-900 rounded-3xl p-7 text-center max-w-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {
							size: 45,
							className: "mx-auto mb-4"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl font-bold mb-2",
							children: "Camera unavailable"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-zinc-400 mb-5",
							children: cameraError
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: startCamera,
							className: "bg-white text-black rounded-full px-7 py-3 font-bold",
							children: "Try Again"
						})
					]
				})
			}),
			isRecording && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute top-5 left-1/2 -translate-x-1/2 z-40 bg-black/65 backdrop-blur-xl rounded-full px-5 py-2 flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-semibold",
					children: [
						Math.floor(recordingSeconds / 60).toString().padStart(2, "0"),
						":",
						(recordingSeconds % 60).toString().padStart(2, "0")
					]
				})]
			}),
			timerRunning && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 z-50 flex items-center justify-center pointer-events-none",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-7xl font-black",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {
						className: "h-16 w-16",
						strokeWidth: 1.4
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute top-0 left-0 right-0 z-30 p-4 pt-5 flex justify-between items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => navigate({ to: ".." }),
					className: "w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 25 })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "bg-black/45 backdrop-blur-xl rounded-full px-3 py-1.5 text-xs font-bold",
						children: qualityLabel
					}), cameraReady && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-2.5 h-2.5 bg-green-400 rounded-full" })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "gpu-layer absolute right-3 top-20 z-30 flex flex-col items-end gap-3",
				children: [
					[
						{
							key: "flash",
							label: "Flash",
							icon: isFlashOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, {
								size: 19,
								className: "text-yellow-300"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZapOff, { size: 19 }),
							active: isFlashOn,
							onClick: toggleFlash
						},
						{
							key: "timer",
							label: timerSeconds ? `Timer ${timerSeconds}s` : "Timer",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timer, { size: 19 }),
							active: !!timerSeconds,
							onClick: () => setTimerSeconds((value) => value === null ? 3 : value === 3 ? 10 : null)
						},
						{
							key: "grid",
							label: "Grid",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Grid3x3, { size: 19 }),
							active: isGridOn,
							onClick: () => setIsGridOn((value) => !value)
						},
						{
							key: "flip",
							label: "Flip",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { size: 19 }),
							active: false,
							onClick: () => setFacingMode((value) => value === "user" ? "environment" : "user")
						}
					].map((tool) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: tool.onClick,
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]",
							children: tool.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `w-10 h-10 rounded-full backdrop-blur-xl flex items-center justify-center ${tool.active ? "bg-white text-black" : "bg-black/45 text-white"}`,
							children: tool.icon
						})]
					}, tool.key)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setShowExtraTools((value) => !value),
						"aria-label": "More tools",
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]",
							children: showExtraTools ? "Less" : "More"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "w-10 h-10 rounded-full bg-black/45 backdrop-blur-xl flex items-center justify-center",
							children: showExtraTools ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { size: 19 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 19 })
						})]
					}),
					showExtraTools && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => applyZoom(zoom >= maxZoom ? 1 : zoom + .5),
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]",
							children: "Zoom"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "w-10 h-10 rounded-full bg-black/45 backdrop-blur-xl flex items-center justify-center text-[11px] font-bold",
							children: [zoom.toFixed(1), "x"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setIsNightMode((value) => !value),
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]",
							children: "Night"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `w-10 h-10 rounded-full backdrop-blur-xl flex items-center justify-center ${isNightMode ? "bg-white text-black" : "bg-black/45 text-white"}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { size: 19 })
						})]
					})] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute bottom-0 left-0 right-0 z-30 pb-8 pt-24 bg-gradient-to-t from-black/90 to-transparent",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex justify-center mb-5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-4 bg-black/45 backdrop-blur-xl px-4 py-1 rounded-full text-[11px]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setCaptureMode("photo"),
								className: captureMode === "photo" ? "font-bold" : "text-white/45",
								children: "PHOTO"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setCaptureMode("video"),
								className: captureMode === "video" ? "font-bold" : "text-white/45",
								children: "VIDEO"
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-around px-7",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => imageInputRef.current?.click(),
								className: "flex flex-col items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-14 h-14 rounded-full bg-black/50 backdrop-blur-xl border border-white/25 flex items-center justify-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image$1, { size: 23 })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-semibold text-white/90",
									children: "Memories"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: handleShutter,
								className: `w-24 h-24 rounded-full border-[5px] ${isRecording ? "border-red-500" : "border-white"} p-1`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `w-full h-full ${isRecording ? "bg-red-500 rounded-2xl scale-75" : "bg-white rounded-full"}` })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setShowExtraTools((value) => !value),
								className: "flex flex-col items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-14 h-14 rounded-full bg-black/50 backdrop-blur-xl border border-white/25 flex items-center justify-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { size: 23 })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-semibold text-white/90",
									children: "Lenses"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-center text-xs text-white/50 mt-4",
						children: captureMode === "photo" ? "Tap to capture" : "Tap to start / stop"
					})
				]
			})
		]
	});
	if (step === 1) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative w-full h-screen bg-black text-white overflow-hidden select-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: audioInputRef,
				type: "file",
				accept: "audio/*",
				className: "hidden",
				onChange: handleAudioUpload
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 flex items-center justify-center overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					ref: frameRef,
					className: `relative ${cropRatio === "original" ? "w-full h-full" : `${cropClass()} w-full max-w-full`}`,
					children: [
						mediaUrl && (isVideo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
							"data-editor-video": true,
							src: mediaUrl,
							autoPlay: true,
							loop: true,
							playsInline: true,
							muted: videoMuted,
							className: "absolute object-cover",
							style: {
								...cropStyle(),
								...getMediaStyle()
							}
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: mediaUrl,
							alt: "Moment",
							className: "absolute object-cover",
							style: {
								...cropStyle(),
								...getMediaStyle()
							}
						})),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
							ref: drawingCanvasRef,
							className: `absolute inset-0 w-full h-full z-20 ${drawMode ? "pointer-events-auto" : "pointer-events-none"}`,
							onMouseDown: startDrawing,
							onMouseMove: draw,
							onMouseUp: stopDrawing,
							onMouseLeave: stopDrawing,
							onTouchStart: startDrawing,
							onTouchMove: draw,
							onTouchEnd: stopDrawing
						}),
						textLayers.map((layer) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextLayerView, {
							layer,
							active: layer.id === activeTextId,
							frameRef,
							locked: drawMode || cropMode,
							onSelect: () => {
								setActiveTextId(layer.id);
								setOverlayText(layer.text);
								setTextColor(layer.color);
								setTextSize(layer.size);
								setShowTextInput(true);
							},
							onChange: (patch) => setTextLayers((items) => items.map((item) => item.id === layer.id ? {
								...item,
								...patch
							} : item)),
							onRemove: () => {
								setTextLayers((items) => items.filter((item) => item.id !== layer.id));
								setActiveTextId(null);
							}
						}, layer.id)),
						stickers.map((sticker) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onDoubleClick: () => removeSticker(sticker.id),
							className: "absolute z-30 -translate-x-1/2 -translate-y-1/2",
							style: {
								left: `${sticker.x}%`,
								top: `${sticker.y}%`,
								fontSize: `${sticker.size}px`
							},
							children: sticker.emoji
						}, sticker.id)),
						cropMode && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CropOverlay, {
							rect: cropDraft,
							onChange: setCropDraft,
							frameRef
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/80 to-transparent z-40 pointer-events-none" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/95 to-transparent z-40 pointer-events-none" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute top-4 left-4 right-4 z-50 flex justify-between items-start",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: retake,
						className: "w-11 h-11 rounded-full bg-black/60 backdrop-blur-xl flex items-center justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							setShowTextInput(false);
							setDrawMode(false);
							setCropMode(false);
							setShowMusicPanel(false);
							setPanel(null);
							setShowMusicLibrary(true);
						},
						className: "absolute left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-sm font-bold whitespace-nowrap active:scale-95",
						children: "Add a Sound"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2",
						children: isVideo && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "px-4 py-2 rounded-full bg-black/60 backdrop-blur-xl text-xs font-bold",
							children: "VIDEO"
						})
					})
				]
			}),
			(() => {
				const closeAll = () => {
					setShowTextInput(false);
					setDrawMode(false);
					setCropMode(false);
					setShowMusicPanel(false);
					setPanel(null);
				};
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "gpu-layer absolute right-3 top-24 z-[85] flex flex-col items-end gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorTool, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, {}),
							label: "Draw",
							active: drawMode,
							onClick: () => {
								const next = drawMode;
								closeAll();
								if (!next) setDrawMode(true);
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorTool, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Type, {}),
							label: "Text",
							active: showTextInput,
							onClick: () => {
								closeAll();
								addText();
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorTool, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smile, {}),
							label: "Stickers",
							active: panel === "sticker",
							onClick: () => {
								const next = panel === "sticker";
								closeAll();
								if (!next) setPanel("sticker");
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorTool, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crop, {}),
							label: "Crop & Rotate",
							active: cropMode,
							onClick: () => {
								const next = cropMode;
								closeAll();
								if (!next) {
									setCropDraft(cropRect);
									setCropMode(true);
								}
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorTool, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Palette, {}),
							label: "Filters",
							active: panel === "filter",
							onClick: () => {
								const next = panel === "filter";
								closeAll();
								if (!next) setPanel("filter");
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorTool, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timer, {}),
							label: snapDuration ? `Timer ${snapDuration}s` : "Timer",
							active: !!snapDuration,
							onClick: () => setSnapDuration((value) => value === null ? 3 : value === 3 ? 5 : value === 5 ? 10 : null)
						})
					]
				});
			})(),
			showTextInput && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "gpu-layer transition-transform duration-200 ease-out absolute bottom-0 left-0 right-0 z-[80] bg-black/90 backdrop-blur-2xl rounded-t-3xl p-4 pb-8 border-t border-white/10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						autoFocus: true,
						value: overlayText,
						onChange: (e) => {
							setOverlayText(e.target.value);
							updateActiveText({ text: e.target.value });
						},
						placeholder: "Write text...",
						className: "w-full bg-white/10 rounded-xl px-4 py-3 outline-none"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center gap-2 mt-3",
						children: [
							"#ffffff",
							"#ff3b81",
							"#00e5ff",
							"#ffd400",
							"#55ff66"
						].map((color) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => {
								setTextColor(color);
								updateActiveText({ color });
							},
							className: "w-8 h-8 rounded-full border-2 border-white/50",
							style: { backgroundColor: color }
						}, color))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						min: "18",
						max: "120",
						value: textSize,
						onChange: (e) => {
							const size = Number(e.target.value);
							setTextSize(size);
							updateActiveText({ size });
						},
						className: "w-full mt-3"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2 mt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: "10",
							max: "90",
							value: textX,
							onChange: (e) => {
								setTextX(Number(e.target.value));
								updateActiveText({ x: Number(e.target.value) });
							}
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: "10",
							max: "90",
							value: textY,
							onChange: (e) => {
								setTextY(Number(e.target.value));
								updateActiveText({ y: Number(e.target.value) });
							}
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] text-white/50 mb-1",
							children: "Rotate"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: "-180",
							max: "180",
							value: textLayers.find((item) => item.id === activeTextId)?.rotation ?? 0,
							onChange: (e) => updateActiveText({ rotation: Number(e.target.value) }),
							className: "w-full"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2 mt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: addText,
							className: "flex-1 py-2 rounded-xl bg-white/10 text-xs font-bold",
							children: "Add text"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setShowTextInput(false),
							className: "flex-1 py-2 rounded-xl bg-white text-black text-xs font-bold",
							children: "Done"
						})]
					})
				]
			}),
			cropMode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "gpu-layer transition-transform duration-200 ease-out absolute bottom-0 left-0 right-0 z-[80] bg-black/90 backdrop-blur-2xl rounded-t-3xl p-4 pb-8 border-t border-white/10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-white/60 mb-3",
						children: "Drag the corners to crop freely"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2 overflow-x-auto no-scrollbar mb-3",
						children: [
							"original",
							"9:16",
							"4:5",
							"1:1"
						].map((ratio) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setCropRatio(ratio),
							className: `px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${cropRatio === ratio ? "bg-white text-black" : "bg-white/10"}`,
							children: ratio
						}, ratio))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									setCropDraft(FULL_RECT);
									setCropRect(FULL_RECT);
								},
								className: "px-4 py-3 rounded-2xl bg-white/10 text-xs font-bold",
								children: "Reset"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: rotateMedia,
								className: "px-4 py-3 rounded-2xl bg-white/10 text-xs font-bold flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { size: 14 }), "Rotate"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									setCropDraft(cropRect);
									setCropMode(false);
								},
								className: "flex-1 py-3 rounded-2xl bg-white/10 text-xs font-bold",
								children: "Cancel"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									setCropRect(cropDraft);
									setCropMode(false);
								},
								className: "flex-1 py-3 rounded-2xl bg-white text-black text-xs font-bold",
								children: "Apply"
							})
						]
					})
				]
			}),
			drawMode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "gpu-layer transition-transform duration-200 ease-out absolute bottom-0 left-0 right-0 z-[80] bg-black/90 backdrop-blur-2xl rounded-t-3xl p-4 pb-8 border-t border-white/10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2 mb-3",
						children: [
							"#ffffff",
							"#ff0055",
							"#00e5ff",
							"#ffd400",
							"#55ff55"
						].map((color) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setDrawColor(color),
							className: "w-8 h-8 rounded-full border border-white/50",
							style: { backgroundColor: color }
						}, color))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						min: "2",
						max: "25",
						value: drawSize,
						onChange: (e) => setDrawSize(Number(e.target.value))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2 mt-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: undoDrawing,
								className: "p-2 bg-white/10 rounded-xl",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Undo2, {})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: redoDrawing,
								className: "p-2 bg-white/10 rounded-xl",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Redo2, {})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: clearDrawing,
								className: "px-3 bg-white/10 rounded-xl text-xs",
								children: "Clear"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setDrawMode(false),
								className: "ml-auto px-5 rounded-xl bg-white text-black text-xs font-black",
								children: "Done"
							})
						]
					})
				]
			}),
			panel === "sticker" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "gpu-layer transition-transform duration-200 ease-out absolute bottom-0 left-0 right-0 z-[80] bg-black/90 backdrop-blur-2xl rounded-t-3xl px-4 pt-4 pb-8 border-t border-white/10 flex gap-2 overflow-x-auto no-scrollbar",
				children: [
					"Heart",
					"Laugh",
					"Flame",
					"Love",
					"Cool",
					"Party",
					"Applause",
					"Perfect",
					"Star",
					"Energy"
				].map((emoji) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => addSticker(emoji),
					className: "min-w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-xl text-[10px] font-semibold",
					children: emoji
				}, emoji))
			}),
			panel === "filter" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "gpu-layer transition-transform duration-200 ease-out absolute bottom-0 left-0 right-0 z-[80] bg-black/90 backdrop-blur-2xl rounded-t-3xl px-4 pt-4 pb-8 border-t border-white/10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto no-scrollbar -mx-1 px-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-3",
							children: Object.keys(FILTERS).map((filter) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setSelectedFilter(filter),
								className: `px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold ${selectedFilter === filter ? "bg-white text-black" : "bg-white/10"}`,
								children: FILTERS[filter].name
							}, filter))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex gap-3 overflow-x-auto no-scrollbar",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Adjust, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, {}),
								value: brightness,
								min: 60,
								max: 140,
								onChange: setBrightness
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Adjust, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Contrast, {}),
								value: contrast,
								min: 60,
								max: 140,
								onChange: setContrast
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Adjust, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Palette, {}),
								value: saturation,
								min: 0,
								max: 180,
								onChange: setSaturation
							}),
							isVideo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Adjust, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {}),
								value: videoSpeed,
								min: .5,
								max: 2,
								step: .25,
								onChange: setVideoSpeed
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setVideoMuted((value) => !value),
								className: "w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-xl flex items-center justify-center",
								children: videoMuted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, {})
							})] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setPanel(null),
						className: "mt-4 w-full py-2.5 rounded-full bg-white text-black text-xs font-black",
						children: "Done"
					})
				]
			}),
			audioUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
				ref: previewAudioRef,
				src: audioUrl,
				preload: "metadata",
				className: "hidden",
				onEnded: () => setAudioPlaying(false),
				onTimeUpdate: (e) => {
					const el = e.currentTarget;
					if (audioEnd > audioStart && el.currentTime >= audioEnd) el.currentTime = audioStart;
				}
			}),
			selectedAudio && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => setShowMusicPanel((v) => !v),
				className: "absolute top-4 left-1/2 -translate-x-1/2 z-[60] bg-black/70 backdrop-blur-xl rounded-full px-4 py-2 text-xs flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Music, { size: 14 }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "max-w-36 truncate",
						children: selectedAudio
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-[10px] text-white/60 font-mono",
						children: [
							fmtTime(audioStart),
							"–",
							fmtTime(audioEnd)
						]
					})
				]
			}),
			showMusicLibrary && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-0 z-[95] flex flex-col justify-end bg-black/60 backdrop-blur-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "flex-1",
					onClick: () => setShowMusicLibrary(false),
					"aria-label": "Close music library"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "gpu-layer rounded-t-3xl border-t border-white/10 bg-neutral-950 p-4 pb-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-black uppercase tracking-wide",
							children: "Add music"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => {
								setShowMusicLibrary(false);
								audioInputRef.current?.click();
							},
							className: "rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase",
							children: "From device"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "max-h-64 space-y-2 overflow-y-auto",
						children: NO_COPYRIGHT_MUSIC.map((track) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => {
								if (audioUrl?.startsWith("blob:")) {
									URL.revokeObjectURL(audioUrl);
									unregisterBlob(audioUrl);
								}
								setAudioUrl(track.url);
								setSelectedAudio(`${track.title} — ${track.artist}`);
								setMusicTitle(track.title);
								setMusicArtist(track.artist);
								setAudioDuration(0);
								setAudioStart(0);
								setAudioEnd(0);
								setShowMusicLibrary(false);
								setShowMusicPanel(true);
							},
							className: "flex w-full items-center gap-3 rounded-2xl bg-white/5 p-3 text-left active:scale-[0.98]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-white/10",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Music, { size: 16 })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-xs font-bold",
									children: track.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "block truncate text-[10px] text-white/50",
									children: [
										track.artist,
										" · ",
										track.category,
										" · ",
										track.duration
									]
								})]
							})]
						}, track.id))
					})]
				})]
			}),
			showMusicPanel && audioUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "gpu-layer transition-transform duration-200 ease-out absolute bottom-0 left-0 right-0 z-[80] bg-black/90 backdrop-blur-2xl rounded-t-3xl p-4 pb-8 border-t border-white/10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 mb-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: toggleAudioPreview,
								className: "w-10 h-10 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0",
								children: audioPlaying ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { size: 18 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-bold truncate",
									children: selectedAudio
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[10px] text-white/50 font-mono",
									children: [
										fmtTime(audioStart),
										" –",
										" ",
										fmtTime(audioEnd),
										" ·",
										" ",
										(audioEnd - audioStart).toFixed(1),
										"s"
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setShowMusicLibrary(true),
								className: "px-3 py-1.5 rounded-full bg-white/10 text-[10px] font-black uppercase",
								children: "Change"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: removeAudio,
								className: "px-3 py-1.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-black uppercase",
								children: "Remove"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "block text-[10px] uppercase tracking-wider text-white/50 mb-1",
						children: "Start"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						min: 0,
						max: Math.max(.1, audioDuration),
						step: .1,
						value: audioStart,
						onChange: (e) => {
							const v = Math.min(Number(e.target.value), audioEnd - .5);
							setAudioStart(Math.max(0, v));
							if (previewAudioRef.current) previewAudioRef.current.currentTime = Math.max(0, v);
						},
						className: "w-full accent-pink-500"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "block text-[10px] uppercase tracking-wider text-white/50 mt-2 mb-1",
						children: "End"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						min: 0,
						max: Math.max(.1, audioDuration),
						step: .1,
						value: audioEnd,
						onChange: (e) => setAudioEnd(Math.max(audioStart + .5, Number(e.target.value))),
						className: "w-full accent-pink-500"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "block text-[10px] uppercase tracking-wider text-white/50 mt-2 mb-1",
						children: "Volume"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						min: 0,
						max: 1,
						step: .05,
						value: audioVolume,
						onChange: (e) => {
							const v = Number(e.target.value);
							setAudioVolume(v);
							if (previewAudioRef.current) previewAudioRef.current.volume = v;
						},
						className: "w-full accent-pink-500"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setShowMusicPanel(false),
						className: "mt-3 w-full py-2 rounded-full bg-gradient-to-r from-cyan-400 via-pink-500 to-pink-600 text-xs font-black",
						children: "Done"
					})
				]
			}),
			!(showTextInput || drawMode || cropMode || showMusicPanel || panel) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute bottom-40 left-0 right-0 z-[65] px-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-3 overflow-x-auto no-scrollbar py-1",
					children: Object.keys(FILTERS).map((filter) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setSelectedFilter(filter),
						className: "flex flex-col items-center gap-1 shrink-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `w-14 h-14 rounded-full overflow-hidden border-2 bg-zinc-800 ${selectedFilter === filter ? "border-white" : "border-white/30"}`,
							children: mediaUrl && !isVideo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: mediaUrl,
								decoding: "async",
								loading: "lazy",
								alt: FILTERS[filter].name,
								className: "w-full h-full object-cover",
								style: { filter: FILTERS[filter].css || void 0 }
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block w-full h-full bg-gradient-to-br from-zinc-600 to-zinc-900",
								style: { filter: FILTERS[filter].css || void 0 }
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[9px] font-semibold text-white/85",
							children: FILTERS[filter].name
						})]
					}, filter))
				})
			}),
			!(showTextInput || drawMode || cropMode || showMusicPanel || panel) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute bottom-24 left-0 right-0 z-[70] px-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: caption,
					onChange: (e) => setCaption(e.target.value),
					placeholder: "Add a caption...",
					className: "w-full bg-black/70 backdrop-blur-xl border border-white/10 rounded-full px-5 py-3.5 outline-none text-sm"
				})
			}),
			!(showTextInput || drawMode || cropMode || showMusicPanel || panel) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute bottom-0 left-0 right-0 z-[70] flex items-center justify-between gap-3 px-4 pb-6 pt-4 bg-gradient-to-t from-black via-black/70 to-transparent backdrop-blur-md",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleDownload,
						"aria-label": "Download",
						className: "w-12 h-12 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 flex items-center justify-center active:scale-95",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 20 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setShowFinalPreview(true),
						className: "px-5 py-3 rounded-full bg-zinc-800/90 backdrop-blur-xl border border-white/10 text-sm font-bold active:scale-95",
						children: "+ Stories"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setShowFinalPreview(true),
						className: "px-6 py-3 rounded-full bg-gradient-to-r from-cyan-400 via-pink-500 to-pink-600 font-black text-sm flex items-center gap-1.5 active:scale-95",
						children: ["Send to", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 18 })]
					})
				]
			}),
			showFinalPreview && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-[120] bg-black flex flex-col",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between px-4 pt-5 pb-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setShowFinalPreview(false),
								className: "w-11 h-11 rounded-full bg-white/10 flex items-center justify-center",
								"aria-label": "Back to editor",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-black uppercase tracking-wide",
								children: "Preview"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-11" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 min-h-0 flex items-center justify-center px-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative w-full h-full max-h-full rounded-2xl overflow-hidden bg-zinc-900",
							children: [mediaUrl && isVideo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
								src: mediaUrl,
								className: "w-full h-full object-contain",
								style: getMediaStyle(),
								autoPlay: true,
								loop: true,
								playsInline: true,
								muted: !!audioUrl
							}) : mediaUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: mediaUrl,
								alt: "Moment preview",
								className: "w-full h-full object-contain",
								style: getMediaStyle()
							}) : null, caption && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "absolute bottom-4 left-4 right-4 text-center text-sm font-semibold bg-black/60 backdrop-blur-xl rounded-2xl px-4 py-2",
								children: caption
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-4 pb-6 pt-3 space-y-3",
						children: [
							selectedAudio && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-white/70 font-semibold",
								children: selectedAudio
							}),
							!isVideo && audioUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between text-xs font-bold mb-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Photo duration" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [photoSeconds, "s"] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min: 5,
								max: 40,
								step: 1,
								value: photoSeconds,
								onChange: (e) => setPhotoSeconds(Number(e.target.value)),
								className: "w-full accent-pink-500"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									setShowFinalPreview(false);
									setStep(2);
								},
								className: "w-full py-3.5 rounded-full bg-gradient-to-r from-cyan-400 via-pink-500 to-pink-600 font-black text-sm active:scale-95",
								children: "Continue"
							})
						]
					})
				]
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "w-full h-screen bg-[#101010] text-white overflow-y-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-xl mx-auto px-5 pt-5 pb-10",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between mb-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setStep(1),
							className: "w-11 h-11 rounded-full bg-white/5 flex items-center justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-lg font-bold",
							children: "Share Moment"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-11" })
					]
				}),
				mediaUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative w-28 h-40 rounded-2xl overflow-hidden mx-auto mb-5",
					children: isVideo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						src: mediaUrl,
						muted: true,
						playsInline: true,
						className: "w-full h-full object-cover"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: mediaUrl,
						className: "w-full h-full object-cover",
						alt: "Moment"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { title: "AUDIENCE" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2 mb-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudienceButton, {
							active: audience === "everyone",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Earth, {}),
							title: "Everyone",
							subtitle: "Anyone on YourWorld",
							onClick: () => setAudience("everyone")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudienceButton, {
							active: audience === "followers",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, {}),
							title: "Followers",
							subtitle: "People who follow you",
							onClick: () => setAudience("followers")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudienceButton, {
							active: audience === "close_friends",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {}),
							title: "Close Friends",
							subtitle: "Your green-list",
							onClick: () => setAudience("close_friends")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudienceButton, {
							active: audience === "only_me",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {}),
							title: "Only Me",
							subtitle: "Private",
							onClick: () => setAudience("only_me")
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { title: "DURATION" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-2 mb-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DurationButton, {
						active: durationHours === 24,
						title: "24 Hours",
						onClick: () => setDurationHours(24)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { title: "INTERACTION & SAFETY" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingRow, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {}),
							title: "Add a poll",
							subtitle: "Let viewers vote",
							checked: allowPoll,
							onChange: () => setAllowPoll((v) => !v)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingRow, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, {}),
							title: "Allow reactions",
							subtitle: "Viewers can react",
							checked: allowReactions,
							onChange: () => setAllowReactions((v) => !v)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingRow, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {}),
							title: "Allow replies",
							subtitle: "Viewers can reply",
							checked: allowReplies,
							onChange: () => setAllowReplies((v) => !v)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingRow, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, {}),
							title: "Screenshot alert",
							subtitle: "Best-effort detection",
							checked: screenshotAlert,
							onChange: () => setScreenshotAlert((v) => !v)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingRow, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}),
							title: "Allow downloads",
							subtitle: "Viewers can save",
							checked: allowDownloads,
							onChange: () => setAllowDownloads((v) => !v)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingRow, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Archive, {}),
							title: "Save to archive",
							subtitle: "Keep private copy",
							checked: saveToArchive,
							onChange: () => setSaveToArchive((v) => !v)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingRow, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {}),
							title: "Show location",
							subtitle: "Share location",
							checked: showLocation,
							onChange: () => setShowLocation((v) => !v)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingRow, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, {}),
							title: "Allow sharing",
							subtitle: "Let viewers share",
							checked: allowSharing,
							onChange: () => setAllowSharing((v) => !v)
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex items-center gap-2.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleDownload,
						"aria-label": "Save to gallery",
						className: "h-12 w-12 shrink-0 rounded-full border border-white/15 bg-white/[0.06] flex items-center justify-center active:scale-95 transition",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 18 })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: handlePublish,
						className: "flex-1 py-3.5 rounded-full bg-gradient-to-r from-cyan-400 via-pink-500 to-pink-600 font-bold text-[15px] flex items-center justify-center gap-2",
						children: ["Share Moment", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { size: 17 })]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-center text-[10px] text-zinc-500",
					children: "Save to gallery ya seedha share karein"
				})
			]
		})
	});
}
function EditorTool({ icon, label, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: "flex items-center gap-2",
		title: label,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `w-10 h-10 rounded-full backdrop-blur-xl flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5 ${active ? "bg-white text-black" : "bg-black/50 text-white"}`,
			children: icon
		})]
	});
}
function Adjust({ icon, value, min, max, step = 1, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-[130px] bg-black/65 backdrop-blur-xl rounded-2xl px-3 py-2 flex items-center gap-2",
		children: [icon, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "range",
			min,
			max,
			step,
			value,
			onChange: (e) => onChange(Number(e.target.value)),
			className: "w-full"
		})]
	});
}
function SectionTitle({ title }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
		className: "text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-semibold mb-2",
		children: title
	});
}
function AudienceButton({ active, icon, title, subtitle, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: `text-left rounded-2xl px-3 py-2.5 border transition-colors ${active ? "border-pink-500/70 bg-pink-500/10" : "border-white/10 bg-white/[0.04]"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between mb-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `[&>svg]:h-4 [&>svg]:w-4 ${active ? "text-pink-400" : "text-zinc-400"}`,
					children: icon
				}), active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
					size: 13,
					className: "text-pink-400"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-semibold text-[12px] leading-tight",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[10px] text-zinc-500 mt-0.5 leading-tight",
				children: subtitle
			})
		]
	});
}
function DurationButton({ active, title, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick,
		className: `py-2.5 rounded-2xl border text-[12px] font-semibold transition-colors ${active ? "border-pink-500/70 bg-pink-500/10" : "border-white/10 bg-white/[0.04] text-zinc-400"}`,
		children: title
	});
}
function SettingRow({ icon, title, subtitle, checked, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick: onChange,
		className: "w-full rounded-2xl bg-white/[0.04] border border-white/10 px-3 py-2.5 flex items-center gap-3 text-left",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "w-7 h-7 shrink-0 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 [&>svg]:h-3.5 [&>svg]:w-3.5",
				children: icon
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-semibold text-[12px] leading-tight",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[10px] text-zinc-500 mt-0.5 leading-tight",
					children: subtitle
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				role: "switch",
				"aria-checked": checked,
				className: `relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-300 ease-out ${checked ? "bg-pink-500" : "bg-zinc-700"}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `absolute top-[3px] left-[3px] h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ease-out ${checked ? "translate-x-5" : "translate-x-0"}` })
			})
		]
	});
}
function TextLayerView({ layer, active, locked, frameRef, onSelect, onChange, onRemove }) {
	const drag = (0, import_react.useRef)(null);
	const frameRect = () => frameRef.current?.getBoundingClientRect();
	const centerPx = () => {
		const r = frameRect();
		if (!r) return {
			cx: 0,
			cy: 0
		};
		return {
			cx: r.left + layer.x / 100 * r.width,
			cy: r.top + layer.y / 100 * r.height
		};
	};
	const start = (mode) => (e) => {
		if (locked) return;
		e.stopPropagation();
		e.preventDefault();
		e.target.setPointerCapture?.(e.pointerId);
		onSelect();
		drag.current = {
			mode,
			startX: e.clientX,
			startY: e.clientY,
			size: layer.size,
			rotation: layer.rotation,
			x: layer.x,
			y: layer.y
		};
	};
	const move = (e) => {
		const d = drag.current;
		const r = frameRect();
		if (!d || !r) return;
		if (d.mode === "move") {
			onChange({
				x: Math.min(100, Math.max(0, d.x + (e.clientX - d.startX) / r.width * 100)),
				y: Math.min(100, Math.max(0, d.y + (e.clientY - d.startY) / r.height * 100))
			});
			return;
		}
		const { cx, cy } = centerPx();
		const startDist = Math.hypot(d.startX - cx, d.startY - cy) || 1;
		const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
		const startAngle = Math.atan2(d.startY - cy, d.startX - cx);
		const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
		onChange({
			size: Math.min(140, Math.max(12, Math.round(d.size * (dist / startDist)))),
			rotation: Math.round(d.rotation + (angle - startAngle) * 180 / Math.PI)
		});
	};
	const end = (e) => {
		e.target.releasePointerCapture?.(e.pointerId);
		drag.current = null;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "absolute z-30",
		style: {
			left: `${layer.x}%`,
			top: `${layer.y}%`,
			transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
			touchAction: "none",
			pointerEvents: locked ? "none" : "auto"
		},
		onPointerDown: start("move"),
		onPointerMove: move,
		onPointerUp: end,
		onPointerCancel: end,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `px-2 py-1 font-black text-center whitespace-nowrap ${active ? "border border-dashed border-white/70 rounded-xl" : ""}`,
			style: {
				color: layer.color,
				fontSize: `${layer.size}px`,
				textShadow: "0 2px 8px rgba(0,0,0,.7)"
			},
			children: layer.text || " "
		}), active && !locked && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			onPointerDown: (e) => e.stopPropagation(),
			onClick: onRemove,
			className: "absolute -top-3 -left-3 w-7 h-7 rounded-full bg-black/80 border border-white/20 flex items-center justify-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14 })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			onPointerDown: start("scale"),
			onPointerMove: move,
			onPointerUp: end,
			onPointerCancel: end,
			className: "absolute -bottom-3 -right-3 w-7 h-7 rounded-full bg-white text-black flex items-center justify-center cursor-nwse-resize",
			style: { touchAction: "none" },
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { size: 13 })
		})] })]
	});
}
function CropOverlay({ rect, onChange, frameRef }) {
	const drag = (0, import_react.useRef)(null);
	const start = (handle) => (e) => {
		e.stopPropagation();
		e.preventDefault();
		e.target.setPointerCapture?.(e.pointerId);
		drag.current = {
			handle,
			startX: e.clientX,
			startY: e.clientY,
			rect
		};
	};
	const move = (e) => {
		const d = drag.current;
		const r = frameRef.current?.getBoundingClientRect();
		if (!d || !r) return;
		const dx = (e.clientX - d.startX) / r.width;
		const dy = (e.clientY - d.startY) / r.height;
		const b = d.rect;
		const MIN = .1;
		if (d.handle === "move") {
			onChange({
				...b,
				x: Math.min(1 - b.w, Math.max(0, b.x + dx)),
				y: Math.min(1 - b.h, Math.max(0, b.y + dy))
			});
			return;
		}
		let x = b.x;
		let y = b.y;
		let w = b.w;
		let h = b.h;
		const right = b.x + b.w;
		const bottom = b.y + b.h;
		if (d.handle === "nw" || d.handle === "sw") {
			x = clamp01(Math.min(right - MIN, b.x + dx));
			w = right - x;
		} else w = Math.max(MIN, Math.min(1 - b.x, b.w + dx));
		if (d.handle === "nw" || d.handle === "ne") {
			y = clamp01(Math.min(bottom - MIN, b.y + dy));
			h = bottom - y;
		} else h = Math.max(MIN, Math.min(1 - b.y, b.h + dy));
		onChange({
			x,
			y,
			w,
			h
		});
	};
	const end = (e) => {
		e.target.releasePointerCapture?.(e.pointerId);
		drag.current = null;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-[55]",
		style: { touchAction: "none" },
		onPointerMove: move,
		onPointerUp: end,
		onPointerCancel: end,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "absolute border-2 border-white",
			style: {
				left: `${rect.x * 100}%`,
				top: `${rect.y * 100}%`,
				width: `${rect.w * 100}%`,
				height: `${rect.h * 100}%`,
				boxShadow: "0 0 0 9999px rgba(0,0,0,.45)"
			},
			onPointerDown: start("move"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none",
				children: Array.from({ length: 9 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "border border-white/25" }, i))
			}), [
				["nw", "-top-2 -left-2 cursor-nwse-resize"],
				["ne", "-top-2 -right-2 cursor-nesw-resize"],
				["sw", "-bottom-2 -left-2 cursor-nesw-resize"],
				["se", "-bottom-2 -right-2 cursor-nwse-resize"]
			].map(([id, cls]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				onPointerDown: start(id),
				className: `absolute w-5 h-5 rounded-full bg-white ${cls}`,
				style: { touchAction: "none" }
			}, id))]
		})
	});
}
//#endregion
export { MomentCreatePage as component };
