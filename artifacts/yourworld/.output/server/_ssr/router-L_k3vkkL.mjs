import { o as __toESM } from "../_runtime.mjs";
import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.mjs";
import { n as inr, t as computeBreakdown } from "./payout-math-C0joRY5F.mjs";
import { t as normalizeSupabaseProjectUrl } from "./url-DRM0tSlT.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as Upload } from "../_libs/tus-js-client+url-parse.mjs";
import { a as useLocation, c as createRouter, d as createFileRoute, f as createRootRouteWithContext, i as HeadContent, l as Outlet, m as useNavigate, o as useRouterState, p as Link, r as Scripts, u as lazyRouteComponent, v as redirect } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { r as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { n as clsx } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { $ as Radio, Bt as Handshake, Dn as BadgeCheck, It as House, N as Sparkles, O as SwitchCamera, Ot as LockKeyhole, Rt as Heart, Ut as Film, Z as RefreshCw, Zt as Earth, _t as MicOff, at as Phone, c as Volume2, dn as CircleCheck, et as Plus, fn as CircleAlert, g as UserPlus, gt as Mic, ht as MonitorUp, i as X, kt as LoaderCircle, l as Video, n as Zap, nn as Coins, ot as PhoneOff, p as User, r as ZapOff, s as VolumeX, u as VideoOff, vt as MessageSquare, wn as Bell, wt as Mail, xt as Megaphone } from "../_libs/lucide-react.mjs";
import { n as get, r as set, t as createStore } from "../_libs/idb-keyval.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/orbit-prefs-DGGmpotl.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var ORBIT_KEY = "yw.orbit.v1";
var ORBIT_PREFS_EVENT = "yw:orbit-prefs";
var fallback = {
	hideOrbitEntry: false,
	hideOrbitNotifications: false
};
/** Reads the Orbit app-level prefs straight from storage — safe outside OrbitProvider. */
function readOrbitPrefs() {
	if (typeof window === "undefined") return fallback;
	try {
		const raw = window.localStorage.getItem(ORBIT_KEY);
		if (!raw) return fallback;
		const parsed = JSON.parse(raw);
		return {
			hideOrbitEntry: !!parsed.privacy?.hideOrbitEntry,
			hideOrbitNotifications: !!parsed.privacy?.hideOrbitNotifications
		};
	} catch {
		return fallback;
	}
}
function notifyOrbitPrefsChanged() {
	if (typeof window !== "undefined") window.dispatchEvent(new Event(ORBIT_PREFS_EVENT));
}
/** Live app-level Orbit prefs, usable anywhere in the app. */
function useOrbitAppPrefs() {
	const [prefs, setPrefs] = (0, import_react.useState)(fallback);
	(0, import_react.useEffect)(() => {
		const sync = () => setPrefs(readOrbitPrefs());
		sync();
		window.addEventListener(ORBIT_PREFS_EVENT, sync);
		window.addEventListener("storage", sync);
		return () => {
			window.removeEventListener(ORBIT_PREFS_EVENT, sync);
			window.removeEventListener("storage", sync);
		};
	}, []);
	return prefs;
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/adaptive-performance-D50dBioI.js
var SERVER_SNAPSHOT = {
	networkQuality: "normal",
	deviceCapability: "capable",
	effectiveType: null,
	downlinkMbps: null,
	rttMs: null,
	saveData: false,
	recommendedVideoTier: "720p",
	videoBitrate: 1e6,
	videoFrameRate: 24,
	videoScaleResolutionDownBy: 1
};
var snapshot = SERVER_SNAPSHOT;
var started = false;
var mediaPenaltyUntil = 0;
var listeners = /* @__PURE__ */ new Set();
function connectionInfo() {
	if (typeof navigator === "undefined") return null;
	return navigator.connection ?? null;
}
function deviceCapability() {
	if (typeof navigator === "undefined") return "capable";
	const memory = Number(navigator.deviceMemory);
	const cores = Number(navigator.hardwareConcurrency);
	const hasSmallScreen = typeof window !== "undefined" && Math.min(window.innerWidth, window.innerHeight) <= 360;
	if (Number.isFinite(memory) && memory > 0 && memory <= 2 || Number.isFinite(cores) && cores > 0 && cores <= 4 && memory <= 4 || hasSmallScreen) return "constrained";
	return "capable";
}
function classifyNetworkQuality(input) {
	if (input.online === false) return "offline";
	if (input.saveData || input.effectiveType === "slow-2g" || input.effectiveType === "2g") return "weak";
	const downlink = Number(input.downlink);
	const rtt = Number(input.rtt);
	if (Number.isFinite(downlink) && downlink > 0 && downlink < 1.2 || Number.isFinite(rtt) && rtt >= 600) return "weak";
	if (input.effectiveType === "5g" || Number.isFinite(downlink) && downlink >= 8 && (!Number.isFinite(rtt) || rtt < 180)) return "fast";
	return "normal";
}
function classifyNetwork(info) {
	return classifyNetworkQuality({
		online: typeof navigator === "undefined" ? true : navigator.onLine !== false,
		effectiveType: info?.effectiveType,
		downlink: info?.downlink,
		rtt: info?.rtt,
		saveData: info?.saveData
	});
}
function lowerQuality(quality) {
	if (quality === "fast") return "normal";
	if (quality === "normal") return "weak";
	return quality;
}
function buildSnapshot() {
	const info = connectionInfo();
	let quality = classifyNetwork(info);
	if (quality !== "offline" && mediaPenaltyUntil > Date.now()) quality = lowerQuality(quality);
	const capability = deviceCapability();
	const constrained = capability === "constrained";
	if (quality === "fast") return {
		networkQuality: quality,
		deviceCapability: capability,
		effectiveType: info?.effectiveType ?? null,
		downlinkMbps: Number.isFinite(Number(info?.downlink)) ? Number(info?.downlink) : null,
		rttMs: Number.isFinite(Number(info?.rtt)) ? Number(info?.rtt) : null,
		saveData: info?.saveData === true,
		recommendedVideoTier: constrained ? "1080p" : "2160p",
		videoBitrate: constrained ? 15e5 : 25e5,
		videoFrameRate: 30,
		videoScaleResolutionDownBy: 1
	};
	if (quality === "weak" || quality === "offline") return {
		networkQuality: quality,
		deviceCapability: capability,
		effectiveType: info?.effectiveType ?? null,
		downlinkMbps: Number.isFinite(Number(info?.downlink)) ? Number(info?.downlink) : null,
		rttMs: Number.isFinite(Number(info?.rtt)) ? Number(info?.rtt) : null,
		saveData: info?.saveData === true,
		recommendedVideoTier: "480p",
		videoBitrate: 45e4,
		videoFrameRate: 15,
		videoScaleResolutionDownBy: constrained ? 2 : 1.5
	};
	return {
		networkQuality: quality,
		deviceCapability: capability,
		effectiveType: info?.effectiveType ?? null,
		downlinkMbps: Number.isFinite(Number(info?.downlink)) ? Number(info?.downlink) : null,
		rttMs: Number.isFinite(Number(info?.rtt)) ? Number(info?.rtt) : null,
		saveData: info?.saveData === true,
		recommendedVideoTier: constrained ? "720p" : "1080p",
		videoBitrate: constrained ? 7e5 : 1e6,
		videoFrameRate: 24,
		videoScaleResolutionDownBy: constrained ? 1.5 : 1
	};
}
function refresh() {
	const next = buildSnapshot();
	if (JSON.stringify(next) === JSON.stringify(snapshot)) return;
	snapshot = next;
	listeners.forEach((listener) => listener());
}
function start() {
	if (started || typeof window === "undefined") return;
	started = true;
	const info = connectionInfo();
	const update = () => refresh();
	window.addEventListener("online", update);
	window.addEventListener("offline", update);
	info?.addEventListener?.("change", update);
	snapshot = buildSnapshot();
}
function subscribe(listener) {
	start();
	listeners.add(listener);
	return () => listeners.delete(listener);
}
function getSnapshot() {
	start();
	return snapshot;
}
function getAdaptivePerformanceSnapshot() {
	return getSnapshot();
}
function useAdaptivePerformance() {
	return (0, import_react.useSyncExternalStore)(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}
function reportAdaptiveMediaEvent(event) {
	if (event === "stalled" || event === "waiting") mediaPenaltyUntil = Date.now() + 15e3;
	else if (Date.now() >= mediaPenaltyUntil) mediaPenaltyUntil = 0;
	refresh();
}
function waitForNetwork(timeoutMs = 3e4) {
	if (getAdaptivePerformanceSnapshot().networkQuality !== "offline") return Promise.resolve(true);
	return new Promise((resolve) => {
		let timer = null;
		const stop = subscribe(() => {
			if (getAdaptivePerformanceSnapshot().networkQuality === "offline") return;
			if (timer) window.clearTimeout(timer);
			stop();
			resolve(true);
		});
		timer = window.setTimeout(() => {
			stop();
			resolve(getAdaptivePerformanceSnapshot().networkQuality !== "offline");
		}, timeoutMs);
	});
}
function adaptiveCameraCaptureAttempts(facingMode) {
	const profile = getAdaptivePerformanceSnapshot();
	const dimensions = profile.networkQuality === "weak" || profile.networkQuality === "offline" ? {
		width: 640,
		height: 480,
		frameRate: 24
	} : profile.networkQuality === "normal" || profile.deviceCapability === "constrained" ? {
		width: 960,
		height: 540,
		frameRate: 30
	} : {
		width: 1280,
		height: 720,
		frameRate: 30
	};
	const audio = {
		echoCancellation: true,
		noiseSuppression: true,
		autoGainControl: true
	};
	return [
		{
			video: {
				facingMode,
				width: {
					ideal: dimensions.width,
					max: dimensions.width
				},
				height: {
					ideal: dimensions.height,
					max: dimensions.height
				},
				frameRate: {
					ideal: dimensions.frameRate,
					max: dimensions.frameRate
				}
			},
			audio
		},
		{
			video: { facingMode },
			audio
		},
		{
			video: { facingMode },
			audio: true
		}
	];
}
function AdaptiveMediaController() {
	const performance = useAdaptivePerformance();
	(0, import_react.useEffect)(() => {
		const videos = /* @__PURE__ */ new Set();
		const visible = /* @__PURE__ */ new WeakMap();
		const handlers = /* @__PURE__ */ new Map();
		const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				const video = entry.target;
				const isVisible = entry.isIntersecting && entry.intersectionRatio > .15;
				visible.set(video, isVisible);
				if (!isVisible && !video.paused && !video.srcObject) video.pause();
				syncVideo(video, performance, isVisible);
			});
		}, { threshold: [
			0,
			.15,
			.5
		] }) : null;
		const syncVideo = (video, current, isVisible = true) => {
			if (video.srcObject) return;
			video.playsInline = true;
			if (current.networkQuality === "offline" || !isVisible && video.paused || current.networkQuality === "weak" && video.paused) video.preload = "none";
			else video.preload = "metadata";
		};
		const observeVideo = (video) => {
			if (videos.has(video)) {
				syncVideo(video, performance, visible.get(video) ?? true);
				return;
			}
			videos.add(video);
			visible.set(video, true);
			const play = () => {
				if (video.srcObject) return;
				videos.forEach((other) => {
					if (other !== video && !other.srcObject && !other.dataset.adaptiveMulti && !other.paused) other.pause();
				});
			};
			const waiting = () => reportAdaptiveMediaEvent("waiting");
			const playing = () => reportAdaptiveMediaEvent("playing");
			handlers.set(video, {
				play,
				waiting,
				playing
			});
			video.addEventListener("play", play);
			video.addEventListener("waiting", waiting);
			video.addEventListener("stalled", waiting);
			video.addEventListener("playing", playing);
			io?.observe(video);
			syncVideo(video, performance);
		};
		const scan = () => document.querySelectorAll("video").forEach((video) => observeVideo(video));
		scan();
		const mutation = typeof MutationObserver !== "undefined" ? new MutationObserver(scan) : null;
		mutation?.observe(document.body, {
			childList: true,
			subtree: true
		});
		return () => {
			mutation?.disconnect();
			io?.disconnect();
			handlers.forEach((handler, video) => {
				video.removeEventListener("play", handler.play);
				video.removeEventListener("waiting", handler.waiting);
				video.removeEventListener("stalled", handler.waiting);
				video.removeEventListener("playing", handler.playing);
			});
			videos.clear();
		};
	}, [performance]);
	return null;
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/storage-upload-DykOWkCd.js
/** Supabase recommends 6 MiB TUS chunks for reliable resumable uploads. */
var TUS_CHUNK_SIZE_BYTES = 6291456;
var STORAGE_BUCKETS = {
	videos: "videos",
	reels: "reels",
	moments: "moments",
	voiceNotes: "voice_notes",
	channels: "channels",
	monetization: "monetization",
	messages: "messages",
	calls: "calls",
	avatars: "avatars",
	uploads: "uploads",
	documents: "documents"
};
function storageConfig() {
	return {
		url: normalizeSupabaseProjectUrl({
			"BASE_URL": "/",
			"DEV": false,
			"MODE": "production",
			"PROD": true,
			"SSR": true,
			"TSS_DEV_SERVER": "false",
			"TSS_DEV_SSR_STYLES_BASEPATH": "/",
			"TSS_DEV_SSR_STYLES_ENABLED": "true",
			"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
			"TSS_INLINE_CSS_ENABLED": "false",
			"TSS_ROUTER_BASEPATH": "",
			"TSS_SERVER_FN_BASE": "/_serverFn/",
			"VITE_APP_URL": "https://your-world-social-app--yourworld2029.replit.app",
			"VITE_SUPABASE_PROJECT_ID": "mvvliwuldgcmrqffrfgi",
			"VITE_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_by8rV8Qfj_n4nTB-y4MJnw_soEAst3r",
			"VITE_SUPABASE_URL": "https://pnpfybcdxynfooylxqou.supabase.co"
		}["VITE_SUPABASE_URL"] ?? ""),
		key: {
			"BASE_URL": "/",
			"DEV": false,
			"MODE": "production",
			"PROD": true,
			"SSR": true,
			"TSS_DEV_SERVER": "false",
			"TSS_DEV_SSR_STYLES_BASEPATH": "/",
			"TSS_DEV_SSR_STYLES_ENABLED": "true",
			"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
			"TSS_INLINE_CSS_ENABLED": "false",
			"TSS_ROUTER_BASEPATH": "",
			"TSS_SERVER_FN_BASE": "/_serverFn/",
			"VITE_APP_URL": "https://your-world-social-app--yourworld2029.replit.app",
			"VITE_SUPABASE_PROJECT_ID": "mvvliwuldgcmrqffrfgi",
			"VITE_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_by8rV8Qfj_n4nTB-y4MJnw_soEAst3r",
			"VITE_SUPABASE_URL": "https://pnpfybcdxynfooylxqou.supabase.co"
		}["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? ""
	};
}
function resumableUploadEndpoint() {
	const { url } = storageConfig();
	return `${url}/storage/v1/upload/resumable`;
}
function uploadMetadata(bucket, path, contentType, cacheControl) {
	return {
		bucketName: bucket,
		objectName: path,
		contentType,
		cacheControl
	};
}
function readableUploadError(error) {
	if (error instanceof Error && error.message) return error.message;
	return "The resumable upload failed. Please try again.";
}
/**
* Uploads a Blob through Supabase Storage's resumable TUS endpoint.
*
* tus-js-client sends the file in 6 MiB PATCH requests, persists its upload
* fingerprint for resume support, and retries interrupted chunks. The
* `uploadDataDuringCreation` option lets Supabase receive the first chunk with
* the creation request instead of sending the whole file as one payload.
*/
function uploadTus(bucket, path, blob, contentType, token, supabaseKey, onProgress, cacheControl = "3600") {
	return new Promise((resolve) => {
		let settled = false;
		let waitingForNetwork = false;
		const finish = (error) => {
			if (settled) return;
			settled = true;
			resolve({ error });
		};
		const upload = new Upload(blob, {
			endpoint: resumableUploadEndpoint(),
			headers: {
				Authorization: `Bearer ${token}`,
				apikey: supabaseKey,
				"x-upsert": "false"
			},
			metadata: uploadMetadata(bucket, path, contentType, cacheControl),
			chunkSize: TUS_CHUNK_SIZE_BYTES,
			uploadDataDuringCreation: true,
			removeFingerprintOnSuccess: true,
			retryDelays: getAdaptivePerformanceSnapshot().networkQuality === "weak" ? [2e3] : getAdaptivePerformanceSnapshot().networkQuality === "offline" ? [] : [1e3, 3e3],
			onProgress: (bytesSent, bytesTotal) => {
				const percent = bytesTotal ? Math.min(99, Math.floor(bytesSent / bytesTotal * 100)) : 0;
				const totalChunks = Math.max(1, Math.ceil(bytesTotal / TUS_CHUNK_SIZE_BYTES));
				const completedChunks = Math.min(totalChunks, Math.ceil(bytesSent / TUS_CHUNK_SIZE_BYTES));
				const chunkLabel = bytesTotal > 26214400 ? `Chunk ${completedChunks}/${totalChunks}` : void 0;
				onProgress?.(percent, chunkLabel);
			},
			onSuccess: () => {
				onProgress?.(100);
				finish(null);
			},
			onError: (error) => {
				if (!waitingForNetwork && getAdaptivePerformanceSnapshot().networkQuality === "offline") {
					waitingForNetwork = true;
					waitForNetwork().then((recovered) => {
						waitingForNetwork = false;
						if (recovered && !settled) {
							upload.start();
							return;
						}
						finish(readableUploadError(error));
					});
					return;
				}
				console.error(`TUS upload failed for ${bucket}/${path}`, error);
				finish(readableUploadError(error));
			}
		});
		try {
			upload.start();
		} catch (error) {
			console.error(`Could not start TUS upload for ${bucket}/${path}`, error);
			finish(readableUploadError(error));
		}
	});
}
/**
* Uploads a Blob with real byte-level progress and returns a durable signed
* URL for the just-uploaded object.
*/
async function uploadWithProgress(bucket, path, blob, contentType, onProgress, cacheControl = "3600") {
	if (getAdaptivePerformanceSnapshot().networkQuality === "offline") return {
		url: null,
		error: "You appear to be offline. Reconnect and try again."
	};
	const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
	if (sessionError) {
		console.error("Could not authorize storage upload", sessionError);
		return {
			url: null,
			error: sessionError.message
		};
	}
	const token = sessionData.session?.access_token;
	if (!token) return {
		url: null,
		error: "You need to sign in to upload."
	};
	let upload;
	try {
		upload = await uploadTus(bucket, path, blob, contentType, token, storageConfig().key, onProgress, cacheControl);
	} catch (error) {
		console.error(`Storage upload failed for ${bucket}/${path}`, error);
		return {
			url: null,
			error: readableUploadError(error)
		};
	}
	if (upload.error) {
		console.error(`Storage upload failed for ${bucket}/${path}: ${upload.error}`);
		return {
			url: null,
			error: upload.error
		};
	}
	const { data: signed, error: signError } = await supabase.storage.from(bucket).createSignedUrl(path, 31536e3);
	if (signError || !signed?.signedUrl) {
		console.error(`Failed to sign uploaded media ${bucket}/${path}`, signError);
		return {
			url: null,
			error: signError?.message ?? "Upload completed, but the media URL could not be created."
		};
	}
	onProgress?.(100);
	return {
		url: signed.signedUrl,
		error: null
	};
}
async function uploadSourceWithProgress(bucket, path, source, fallbackType, onProgress) {
	try {
		const response = await fetch(source);
		if (!response.ok) {
			const error = "The selected media is no longer available.";
			console.error(error, {
				source,
				status: response.status
			});
			return {
				url: null,
				error
			};
		}
		const blob = await response.blob();
		return uploadWithProgress(bucket, path, blob, blob.type || fallbackType, onProgress);
	} catch (error) {
		console.error("Could not prepare media for upload", error);
		return {
			url: null,
			error: error instanceof Error ? error.message : "Could not prepare media for upload."
		};
	}
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/supabase-compat-D8BB5K0X.js
var missingColumnPatterns = [/Could not find the '([^']+)' column/i, /column (?:[\w.]+\.)?["']?([\w]+)["']? does not exist/i];
function missingColumn(error) {
	const text = [error?.message, error?.details].filter(Boolean).join(" ");
	for (const pattern of missingColumnPatterns) {
		const match = text.match(pattern);
		if (match?.[1]) return match[1];
	}
	return null;
}
function missingTable(error, table) {
	if (error?.code !== "PGRST205") return false;
	const text = [error.message, error.details].filter(Boolean).join(" ");
	return new RegExp(`(?:public\\.)?${table}\\b`, "i").test(text);
}
function postKind(row) {
	const explicit = row.kind ?? row.type;
	if (explicit === "reel" || explicit === "video") return explicit;
	if (Number(row.duration_seconds ?? 0) >= 90 || typeof row.title === "string" && row.title.trim().length > 0) return "video";
	return "post";
}
function normalizePostRow(row) {
	return {
		...row,
		kind: postKind(row)
	};
}
/**
* Retries a write only when PostgREST explicitly reports a missing column.
* This supports older, data-bearing schemas without resets or broad migrations.
*/
async function writeCompat(write, initial, aliases = {}) {
	const payload = { ...initial };
	const removed = /* @__PURE__ */ new Set();
	for (let attempt = 0; attempt <= Object.keys(initial).length; attempt += 1) {
		const result = await write(payload);
		if (!result.error) return {
			...result,
			removedColumns: [...removed]
		};
		const column = missingColumn(result.error);
		if (!column || removed.has(column) || !(column in payload)) return {
			...result,
			removedColumns: [...removed]
		};
		removed.add(column);
		const alias = aliases[column];
		const value = payload[column];
		delete payload[column];
		if (alias && !(alias in payload)) payload[alias] = column === "kind" && value === "post" ? "story" : value;
	}
	return {
		...await write(payload),
		removedColumns: [...removed]
	};
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-L_k3vkkL.js
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var styles_default = "/assets/styles-B7zpxzDM.css";
function BottomNav({ onOpenCreate }) {
	if (useLocation().pathname === "/create") return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/60 px-4 py-2",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md mx-auto flex items-center justify-around",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex flex-col items-center gap-1 text-[10px] text-zinc-400 hover:text-white",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "w-5 h-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Home" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/reels",
					search: {
						reelId: void 0,
						userId: void 0,
						initialVideoId: void 0,
						returnTo: void 0
					},
					className: "flex flex-col items-center gap-1 text-[10px] text-zinc-400 hover:text-white",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Film, { className: "w-5 h-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Video" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => onOpenCreate?.(),
					"aria-label": "Open create menu",
					className: "w-12 h-12 -mt-5 bg-gradient-to-tr from-pink-500 via-purple-500 to-amber-400 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-6 h-6 stroke-[3]" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/chat",
					className: "flex flex-col items-center gap-1 text-[10px] text-zinc-400 hover:text-white",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "w-5 h-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Chat" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/profile",
					className: "flex flex-col items-center gap-1 text-[10px] text-zinc-400 hover:text-white",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "w-5 h-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Profile" })]
				})
			]
		})
	});
}
function CreateSheet({ isOpen, onClose }) {
	const navigate = useNavigate();
	if (!isOpen) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md bg-zinc-950 text-white rounded-3xl border border-zinc-800 p-5 flex flex-col gap-4 animate-in slide-in-from-bottom duration-200",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between pb-2 border-b border-zinc-800",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-bold",
					children: "Create"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onClose,
					className: "p-1 rounded-full bg-zinc-900 hover:bg-zinc-800",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-5 h-5" })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							onClose();
							navigate({
								to: "/create",
								search: { mode: "reel" }
							});
						},
						className: "flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/50 text-left transition",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-3 rounded-xl bg-zinc-800 text-pink-400",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, { className: "w-6 h-6" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-bold text-sm",
							children: "Reel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-zinc-400",
							children: "Short video"
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							onClose();
							navigate({ to: "/video/upload" });
						},
						className: "flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/50 text-left transition",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-3 rounded-xl bg-zinc-800 text-sky-400",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Film, { className: "w-6 h-6" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-bold text-sm",
							children: "Long Video"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-zinc-400",
							children: "Upload horizontal or vertical long-form video"
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							onClose();
							navigate({
								to: "/create",
								search: { mode: "live" }
							});
						},
						className: "flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/50 text-left transition",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-3 rounded-xl bg-zinc-800 text-red-500",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, { className: "w-6 h-6" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-bold text-sm",
							children: "Live"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-zinc-400",
							children: "Stream to your world right now"
						})] })]
					})
				]
			})]
		})
	});
}
var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var isRealUserId = (id) => UUID.test(id);
var EMPTY_COUNTS = {
	followers: null,
	following: null,
	unavailable: false,
	error: null
};
/** Ids the signed-in user currently follows. */
async function fetchMyFollowing() {
	const { data: session } = await supabase.auth.getSession();
	const uid = session.session?.user.id;
	if (!uid) return [];
	const { data, error } = await supabase.from("follows").select("following_id").eq("follower_id", uid);
	if (error) throw error;
	return (data ?? []).map((row) => row.following_id);
}
/** Read whether the current user (or an explicitly supplied user) follows a target. */
async function fetchIsFollowing(targetId, followerId) {
	const { data: s } = await supabase.auth.getSession();
	const uid = followerId ?? s.session?.user.id;
	if (!uid || !isRealUserId(targetId) || uid === targetId) return false;
	const { data, error } = await supabase.from("follows").select("id").eq("follower_id", uid).eq("following_id", targetId).maybeSingle();
	if (error) throw error;
	return Boolean(data);
}
/** Follow / unfollow a real user with an idempotent row mutation. */
async function setFollow(targetId, on) {
	const { data: s } = await supabase.auth.getSession();
	const uid = s.session?.user.id;
	if (!uid) throw new Error("Sign in to follow people");
	if (uid === targetId) throw new Error("You can't follow yourself");
	if (!isRealUserId(targetId)) throw new Error("Invalid user");
	const { data: existing, error: lookupError } = await supabase.from("follows").select("id").eq("follower_id", uid).eq("following_id", targetId).maybeSingle();
	if (lookupError) throw lookupError;
	if (on && !existing) {
		const { error } = await supabase.from("follows").insert({
			follower_id: uid,
			following_id: targetId
		});
		if (error && error.code !== "23505") throw error;
	} else if (!on && existing) {
		const { error } = await supabase.from("follows").delete().eq("follower_id", uid).eq("following_id", targetId);
		if (error) throw error;
	}
	let followers = 0;
	let following_count = 0;
	try {
		const { data: rows, error } = await supabase.rpc("get_follow_counts", { ids: [targetId, uid] });
		if (!error) {
			followers = Number(rows?.find((row) => row.id === targetId)?.followers ?? 0);
			following_count = Number(rows?.find((row) => row.id === uid)?.following ?? 0);
		}
	} catch {}
	return {
		following: on,
		followers,
		following_count
	};
}
/** Live follower / following counts for a user, kept fresh via realtime. */
function useFollowCounts(userId) {
	const [data, setData] = (0, import_react.useState)(EMPTY_COUNTS);
	const reload = (0, import_react.useCallback)(async () => {
		if (!userId || !isRealUserId(userId)) {
			setData({
				...EMPTY_COUNTS,
				unavailable: Boolean(userId),
				error: userId ? "Invalid user id" : null
			});
			return;
		}
		setData({
			followers: null,
			following: null,
			unavailable: false,
			error: null
		});
		const { data: rows, error } = await supabase.rpc("get_follow_counts", { ids: [userId] });
		if (error) {
			setData({
				followers: null,
				following: null,
				unavailable: false,
				error: error.message
			});
			return;
		}
		const row = rows?.[0];
		setData({
			followers: Number(row?.followers ?? 0),
			following: Number(row?.following ?? 0),
			unavailable: false,
			error: null
		});
	}, [userId]);
	(0, import_react.useEffect)(() => {
		reload();
		const channel = supabase.channel(`follow-counts-${userId ?? "none"}`).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "follows"
		}, () => void reload()).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [userId, reload]);
	return {
		...data,
		reload
	};
}
/** People who follow `userId`, or people `userId` follows. */
function useFollowList(userId, kind, open) {
	const [users, setUsers] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!open || !userId || !isRealUserId(userId)) return;
		let cancelled = false;
		setLoading(true);
		setError(null);
		(async () => {
			const { data: rows, error: rowsError } = await supabase.rpc("list_follows", {
				_user_id: userId,
				_kind: kind,
				_limit: 500
			});
			if (rowsError) throw rowsError;
			const ids = (rows ?? []).map((row) => row.id);
			if (!ids.length) {
				if (!cancelled) {
					setUsers([]);
					setLoading(false);
				}
				return;
			}
			const { data: profiles, error: profileError } = await supabase.rpc("get_public_profiles", { ids });
			if (profileError) throw profileError;
			const next = (profiles ?? []).map((profile) => ({
				id: profile.id,
				username: profile.username ?? "user",
				display_name: profile.display_name ?? profile.username ?? "YourWorld user",
				avatar_url: profile.avatar_url ?? null
			}));
			if (!cancelled) {
				setUsers(next);
				setLoading(false);
			}
		})().catch((cause) => {
			if (!cancelled) {
				setUsers([]);
				setLoading(false);
				setError(cause instanceof Error ? cause.message : "Couldn't load follows");
			}
		});
		return () => {
			cancelled = true;
		};
	}, [
		userId,
		kind,
		open
	]);
	return {
		users,
		loading,
		error
	};
}
var interactionDb = supabase;
var StoreContext = (0, import_react.createContext)(null);
function YwStoreProvider({ children }) {
	const [liked, setLiked] = (0, import_react.useState)({});
	const [saved, setSaved] = (0, import_react.useState)({});
	const [following, setFollowing] = (0, import_react.useState)({});
	const [drafts, setDrafts] = (0, import_react.useState)([]);
	const meRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const sync = async () => {
			try {
				const { data: auth } = await supabase.auth.getUser();
				const me = auth.user?.id ?? null;
				meRef.current = me;
				if (!me || cancelled) {
					setLiked({});
					setSaved({});
					setFollowing({});
					return;
				}
				const [likes, saves, follows] = await Promise.all([
					supabase.from("likes").select("post_id").eq("user_id", me),
					supabase.from("post_saves").select("post_id").eq("user_id", me),
					fetchMyFollowing()
				]);
				if (cancelled) return;
				const toToggles = (rows) => Object.fromEntries((rows ?? []).map((row) => [row.post_id, true]));
				setLiked(toToggles(likes.data));
				setSaved(toToggles(saves.data));
				setFollowing(Object.fromEntries(follows.map((id) => [id, true])));
			} catch {}
		};
		sync();
		const { data: sub } = supabase.auth.onAuthStateChange(() => void sync());
		const channel = supabase.channel("yw-interactions").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "likes"
		}, () => void sync()).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "post_saves"
		}, () => void sync()).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "follows"
		}, () => void sync()).subscribe();
		return () => {
			cancelled = true;
			sub.subscription.unsubscribe();
			supabase.removeChannel(channel);
		};
	}, []);
	const persistToggle = (0, import_react.useCallback)(async (table, postId, on, revert) => {
		if (!isRealUserId(postId)) {
			revert(false);
			return;
		}
		const me = meRef.current ?? (await supabase.auth.getUser()).data.user?.id ?? null;
		meRef.current = me;
		if (!me) {
			revert(!on);
			toast.error("Sign in to continue");
			return;
		}
		const { error } = on ? await interactionDb.from(table).upsert({
			post_id: postId,
			user_id: me
		}, {
			onConflict: "post_id,user_id",
			ignoreDuplicates: true
		}) : await interactionDb.from(table).delete().eq("post_id", postId).eq("user_id", me);
		if (error && !(on && error.code === "23505")) {
			revert(!on);
			toast.error(error.message);
		}
	}, []);
	const toggleLike = (0, import_react.useCallback)((id) => {
		let next = false;
		setLiked((p) => {
			next = !p[id];
			return {
				...p,
				[id]: next
			};
		});
		persistToggle("likes", id, next, (v) => setLiked((p) => ({
			...p,
			[id]: v
		})));
	}, [persistToggle]);
	const toggleSave = (0, import_react.useCallback)((id) => {
		let next = false;
		setSaved((p) => {
			next = !p[id];
			return {
				...p,
				[id]: next
			};
		});
		persistToggle("post_saves", id, next, (v) => setSaved((p) => ({
			...p,
			[id]: v
		})));
	}, [persistToggle]);
	const toggleFollow = (0, import_react.useCallback)((id) => {
		if (!isRealUserId(id)) return;
		const next = !following[id];
		setFollowing((current) => ({
			...current,
			[id]: next
		}));
		setFollow(id, next).catch((e) => {
			setFollowing((current) => ({
				...current,
				[id]: !next
			}));
			toast.error(e instanceof Error ? e.message : "Couldn't update follow");
		});
	}, [following]);
	const addDraft = (0, import_react.useCallback)((d) => setDrafts((p) => [d, ...p]), []);
	const removeDraft = (0, import_react.useCallback)((id) => setDrafts((p) => p.filter((x) => x.id !== id)), []);
	const value = (0, import_react.useMemo)(() => ({
		liked,
		saved,
		following,
		toggleLike,
		toggleSave,
		toggleFollow,
		drafts,
		addDraft,
		removeDraft
	}), [
		liked,
		saved,
		following,
		drafts,
		toggleLike,
		toggleSave,
		toggleFollow,
		addDraft,
		removeDraft
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreContext.Provider, {
		value,
		children
	});
}
function useYw() {
	const ctx = (0, import_react.useContext)(StoreContext);
	if (!ctx) throw new Error("useYw must be used inside YwStoreProvider");
	return ctx;
}
function useDoubleTapLike(id) {
	const { liked, toggleLike } = useYw();
	const [burst, setBurst] = (0, import_react.useState)(false);
	const timerRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => () => {
		if (timerRef.current !== null) window.clearTimeout(timerRef.current);
	}, []);
	return {
		burst,
		onDoubleTap: (0, import_react.useCallback)(() => {
			if (!liked[id]) toggleLike(id);
			setBurst(true);
			if (timerRef.current !== null) window.clearTimeout(timerRef.current);
			timerRef.current = window.setTimeout(() => setBurst(false), 700);
		}, [
			id,
			liked,
			toggleLike
		])
	};
}
var liveDb = supabase;
var NOTIFICATION_KINDS = [
	{
		id: "like",
		label: "Likes",
		emoji: "",
		icon: Heart,
		tint: "text-rose-400"
	},
	{
		id: "comment",
		label: "Comments",
		emoji: "",
		icon: MessageSquare,
		tint: "text-sky-400"
	},
	{
		id: "follower",
		label: "New Followers",
		emoji: "",
		icon: UserPlus,
		tint: "text-violet-400"
	},
	{
		id: "orbit",
		label: "Orbit",
		emoji: "",
		icon: Earth,
		tint: "text-emerald-400"
	},
	{
		id: "connection",
		label: "Connections",
		emoji: "",
		icon: Handshake,
		tint: "text-teal-400"
	},
	{
		id: "match",
		label: "Matches",
		emoji: "",
		icon: Sparkles,
		tint: "text-pink-400"
	},
	{
		id: "message",
		label: "Messages",
		emoji: "",
		icon: Mail,
		tint: "text-blue-400"
	},
	{
		id: "channel",
		label: "Channel Updates",
		emoji: "",
		icon: Megaphone,
		tint: "text-orange-400"
	},
	{
		id: "verification",
		label: "Verification",
		emoji: "",
		icon: BadgeCheck,
		tint: "text-cyan-400"
	},
	{
		id: "monetization",
		label: "Monetization",
		emoji: "",
		icon: Coins,
		tint: "text-amber-400"
	},
	{
		id: "system",
		label: "System",
		emoji: "",
		icon: Bell,
		tint: "text-muted-foreground"
	}
];
/** Kinds suppressed by the "Hide Orbit notifications" privacy control. */
var ORBIT_KINDS = [
	"orbit",
	"connection",
	"match"
];
var kindMeta = (k) => NOTIFICATION_KINDS.find((m) => m.id === k) ?? NOTIFICATION_KINDS[NOTIFICATION_KINDS.length - 1];
var defaultPrefs = Object.fromEntries(NOTIFICATION_KINDS.map((k) => [k.id, true]));
var NotificationsContext = (0, import_react.createContext)(null);
var ts = (v) => new Date(v).getTime();
/** Builds the whole notification feed from real database activity. */
async function fetchEvents() {
	const { data: auth } = await supabase.auth.getUser();
	const me = auth.user?.id;
	if (!me) return [];
	const { data: myPostRows } = await liveDb.from("posts").select("id,kind").eq("user_id", me);
	const myPosts = (myPostRows ?? []).filter((post) => post.kind !== "moment");
	const postIds = myPosts.map((p) => p.id);
	const [likes, comments, dms, momentNotifications, orbitMsgs, orbitLikes, myOrbitLikes, requests, connections, chatSettings] = await Promise.all([
		postIds.length ? liveDb.from("likes").select("id,post_id,user_id,created_at").in("post_id", postIds).neq("user_id", me).order("created_at", { ascending: false }).limit(40) : Promise.resolve({ data: [] }),
		postIds.length ? liveDb.from("comments").select("id,post_id,user_id,content,created_at").in("post_id", postIds).neq("user_id", me).order("created_at", { ascending: false }).limit(40) : Promise.resolve({ data: [] }),
		supabase.from("messages").select("id,sender_id,receiver_id,content,media_url,voice_note_url,created_at").eq("receiver_id", me).order("created_at", { ascending: false }).limit(40),
		supabase.from("notifications").select("id,actor_id,kind,title,body,entity_type,entity_id,metadata,read,created_at").eq("recipient_id", me).order("created_at", { ascending: false }).limit(80),
		supabase.from("orbit_messages").select("id,sender_id,kind,text,created_at").eq("recipient_id", me).order("created_at", { ascending: false }).limit(40),
		supabase.from("orbit_likes").select("id,user_id,created_at").eq("target_id", me).order("created_at", { ascending: false }).limit(40),
		supabase.from("orbit_likes").select("target_id").eq("user_id", me),
		supabase.from("orbit_chat_requests").select("id,requester_id,intro,status,created_at").eq("addressee_id", me).order("created_at", { ascending: false }).limit(30),
		supabase.from("orbit_connections").select("id,requester_id,addressee_id,status,updated_at").or(`requester_id.eq.${me},addressee_id.eq.${me}`).order("updated_at", { ascending: false }).limit(30),
		supabase.from("orbit_chat_settings").select("peer_id,muted").eq("user_id", me)
	]);
	const mutedPeerIds = new Set((chatSettings.data ?? []).filter((setting) => setting.muted).map((setting) => setting.peer_id));
	const rows = {
		likes: likes.data ?? [],
		comments: comments.data ?? [],
		dms: (dms.data ?? []).filter((message) => !mutedPeerIds.has(message.sender_id)),
		momentNotifications: momentNotifications.data ?? [],
		orbitMsgs: (orbitMsgs.data ?? []).filter((message) => !mutedPeerIds.has(message.sender_id)),
		orbitLikes: orbitLikes.data ?? [],
		requests: requests.data ?? [],
		connections: connections.data ?? []
	};
	const likedByMe = new Set((myOrbitLikes.data ?? []).map((r) => r.target_id));
	const peerIds = [.../* @__PURE__ */ new Set([
		...rows.likes.map((r) => r.user_id),
		...rows.comments.map((r) => r.user_id),
		...rows.dms.map((r) => r.sender_id),
		...rows.momentNotifications.flatMap((r) => r.actor_id ? [r.actor_id] : []),
		...rows.orbitMsgs.map((r) => r.sender_id),
		...rows.orbitLikes.map((r) => r.user_id),
		...rows.requests.map((r) => r.requester_id),
		...rows.connections.map((r) => r.requester_id === me ? r.addressee_id : r.requester_id)
	])];
	const names = {};
	if (peerIds.length) {
		const { data } = await supabase.rpc("get_public_profiles", { ids: peerIds });
		for (const p of data ?? []) names[p.id] = p.display_name ?? p.username ?? "Someone";
	}
	const nameOf = (id) => names[id] ?? "Someone";
	const postKind = new Map(myPosts.map((p) => [p.id, p.kind]));
	const postLink = (id) => postKind.get(id) === "reel" ? "/reels" : "/";
	const momentIds = rows.momentNotifications.filter((n) => n.entity_type === "moment" && n.entity_id).map((n) => n.entity_id);
	const momentMedia = /* @__PURE__ */ new Map();
	if (momentIds.length) {
		const { data: moments } = await liveDb.from("posts").select("id,media_url,thumbnail_url").in("id", [...new Set(momentIds)]);
		for (const moment of moments ?? []) {
			const url = moment.thumbnail_url ?? moment.media_url;
			if (url) momentMedia.set(moment.id, url);
		}
		const paths = [.../* @__PURE__ */ new Set([...momentMedia.values()])].filter((url) => !/^(https?:|data:|blob:)/.test(url));
		if (paths.length) {
			const { data: signed } = await supabase.storage.from(STORAGE_BUCKETS.moments).createSignedUrls(paths, 21600);
			const signedByPath = new Map((signed ?? []).filter((item) => item.signedUrl && item.path).map((item) => [item.path, item.signedUrl]));
			for (const [id, url] of momentMedia) momentMedia.set(id, signedByPath.get(url) ?? url);
		}
	}
	const out = [];
	for (const r of rows.likes) out.push({
		id: `like-${r.id}`,
		kind: "like",
		title: `${nameOf(r.user_id)} liked your post`,
		at: ts(r.created_at),
		to: postLink(r.post_id)
	});
	for (const r of rows.comments) out.push({
		id: `comment-${r.id}`,
		kind: "comment",
		title: `${nameOf(r.user_id)} commented on your post`,
		body: r.content,
		at: ts(r.created_at),
		to: postLink(r.post_id)
	});
	for (const r of rows.dms) out.push({
		id: `dm-${r.id}`,
		kind: "message",
		title: `New message from ${nameOf(r.sender_id)}`,
		body: r.voice_note_url ? "Sent a voice note" : r.media_url ? "Sent an attachment" : r.content,
		at: ts(r.created_at),
		to: `/chat/dm_${[r.sender_id, r.receiver_id].sort().join("_")}`
	});
	for (const r of rows.momentNotifications) out.push({
		id: `notification-${r.id}`,
		kind: r.kind === "like" ? "like" : "system",
		title: r.entity_type === "moment" && r.actor_id ? `${nameOf(r.actor_id)} liked your Moment` : r.title,
		body: r.body ?? void 0,
		at: ts(r.created_at),
		to: r.entity_type === "moment" && r.entity_id ? `/moment/${r.entity_id}` : void 0,
		thumbnailUrl: r.entity_type === "moment" && r.entity_id ? momentMedia.get(r.entity_id) ?? null : null
	});
	for (const r of rows.orbitMsgs) out.push({
		id: `om-${r.id}`,
		kind: "message",
		title: `Orbit message from ${nameOf(r.sender_id)}`,
		body: r.kind === "text" ? r.text ?? "" : "Sent an attachment",
		at: ts(r.created_at),
		to: `/orbit/chat/${r.sender_id}`
	});
	for (const r of rows.orbitLikes) {
		const mutual = likedByMe.has(r.user_id);
		out.push({
			id: `olike-${r.id}`,
			kind: mutual ? "match" : "orbit",
			title: mutual ? `You matched with ${nameOf(r.user_id)}` : `${nameOf(r.user_id)} liked your Orbit profile`,
			at: ts(r.created_at),
			to: mutual ? `/orbit/chat/${r.user_id}` : "/orbit/messages"
		});
	}
	for (const r of rows.requests) out.push({
		id: `req-${r.id}`,
		kind: "connection",
		title: r.status === "accepted" ? `You accepted ${nameOf(r.requester_id)}'s chat request` : `${nameOf(r.requester_id)} sent you a chat request`,
		body: r.intro ?? void 0,
		at: ts(r.created_at),
		to: "/orbit/messages"
	});
	for (const r of rows.connections) {
		if (r.status !== "accepted") continue;
		const peer = r.requester_id === me ? r.addressee_id : r.requester_id;
		out.push({
			id: `conn-${r.id}`,
			kind: "connection",
			title: `You and ${nameOf(peer)} are connected`,
			at: ts(r.updated_at),
			to: `/orbit/chat/${peer}`
		});
	}
	return out.sort((a, b) => b.at - a.at).slice(0, 120);
}
function NotificationsProvider({ children }) {
	const [events, setEvents] = (0, import_react.useState)([]);
	const [prefs, setPrefs] = (0, import_react.useState)(defaultPrefs);
	const [live, setLive] = (0, import_react.useState)(true);
	const [readIds, setReadIds] = (0, import_react.useState)([]);
	const [removedIds, setRemovedIds] = (0, import_react.useState)([]);
	const { hideOrbitNotifications } = useOrbitAppPrefs();
	const load = (0, import_react.useCallback)(async () => {
		try {
			setEvents(await fetchEvents());
		} catch (error) {
			console.error("Unable to load notifications", error);
			setEvents([]);
		}
	}, []);
	(0, import_react.useEffect)(() => {
		load();
		const { data: sub } = supabase.auth.onAuthStateChange(() => void load());
		return () => sub.subscription.unsubscribe();
	}, [load]);
	(0, import_react.useEffect)(() => {
		if (!live) return;
		let timer = null;
		const reload = () => {
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => void load(), 350);
		};
		let alive = true;
		let retry = null;
		let channel = null;
		const subscribe = () => {
			if (!alive) return;
			channel = supabase.channel(`yw-notifications-${Math.random().toString(36).slice(2)}`).on("postgres_changes", {
				event: "*",
				schema: "public",
				table: "likes"
			}, reload).on("postgres_changes", {
				event: "*",
				schema: "public",
				table: "comments"
			}, reload).on("postgres_changes", {
				event: "*",
				schema: "public",
				table: "messages"
			}, reload).on("postgres_changes", {
				event: "INSERT",
				schema: "public",
				table: "notifications"
			}, reload).subscribe((status) => {
				if (status === "SUBSCRIBED") {
					load();
					return;
				}
				if (![
					"CHANNEL_ERROR",
					"TIMED_OUT",
					"CLOSED"
				].includes(status) || !alive || retry) return;
				retry = setTimeout(() => {
					retry = null;
					if (channel) supabase.removeChannel(channel);
					channel = null;
					subscribe();
				}, 1500);
			});
		};
		subscribe();
		const resyncOnVisible = () => {
			if (document.visibilityState === "visible") load();
		};
		const resyncOnOnline = () => void load();
		document.addEventListener("visibilitychange", resyncOnVisible);
		window.addEventListener("online", resyncOnOnline);
		return () => {
			if (timer) clearTimeout(timer);
			alive = false;
			if (retry) clearTimeout(retry);
			document.removeEventListener("visibilitychange", resyncOnVisible);
			window.removeEventListener("online", resyncOnOnline);
			if (channel) supabase.removeChannel(channel);
		};
	}, [live, load]);
	const setPref = (0, import_react.useCallback)((k, v) => {
		setPrefs((p) => ({
			...p,
			[k]: v
		}));
	}, []);
	const value = (0, import_react.useMemo)(() => {
		const read = new Set(readIds);
		const removed = new Set(removedIds);
		const visible = events.filter((i) => !removed.has(i.id)).filter((i) => prefs[i.kind] && !(hideOrbitNotifications && ORBIT_KINDS.includes(i.kind))).map((i) => ({
			...i,
			read: read.has(i.id)
		}));
		const unreadByKind = Object.fromEntries(NOTIFICATION_KINDS.map((k) => [k.id, visible.filter((i) => i.kind === k.id && !i.read).length]));
		return {
			items: visible,
			unread: visible.filter((i) => !i.read).length,
			unreadHome: visible.filter((i) => !i.read && !ORBIT_KINDS.includes(i.kind)).length,
			unreadOrbit: visible.filter((i) => !i.read && ORBIT_KINDS.includes(i.kind)).length,
			unreadByKind,
			prefs,
			live,
			setLive,
			setPref,
			markRead: (id) => setReadIds((p) => p.includes(id) ? p : [id, ...p]),
			markAllRead: () => setReadIds((p) => [.../* @__PURE__ */ new Set([...events.map((e) => e.id), ...p])]),
			remove: (id) => setRemovedIds((p) => p.includes(id) ? p : [id, ...p]),
			clearAll: () => setRemovedIds((p) => [.../* @__PURE__ */ new Set([...events.map((e) => e.id), ...p])])
		};
	}, [
		events,
		prefs,
		live,
		setPref,
		hideOrbitNotifications,
		readIds,
		removedIds
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotificationsContext.Provider, {
		value,
		children
	});
}
function useNotifications() {
	const ctx = (0, import_react.useContext)(NotificationsContext);
	if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
	return ctx;
}
function timeAgo$1(at) {
	const s = Math.max(1, Math.round((Date.now() - at) / 1e3));
	if (s < 60) return `${s}s`;
	const m = Math.round(s / 60);
	if (m < 60) return `${m}m`;
	const h = Math.round(m / 60);
	if (h < 24) return `${h}h`;
	return `${Math.round(h / 24)}d`;
}
var MomentContext = (0, import_react.createContext)(null);
function useMoments() {
	const ctx = (0, import_react.useContext)(MomentContext);
	if (!ctx) throw new Error("useMoments must be used inside MomentProvider");
	return ctx;
}
function isAuthSessionMissing(error) {
	if (!error || typeof error !== "object") return false;
	const candidate = error;
	return candidate.name === "AuthSessionMissingError" || candidate.message === "Auth session missing!";
}
/**
* Keeps the original Blob behind an object URL alive so background uploads
* still work after the creating screen unmounts (which revokes the URL).
*/
var registry = /* @__PURE__ */ new Map();
function registerBlob(url, blob) {
	registry.set(url, blob);
}
function getRegisteredBlob(url) {
	return registry.get(url) ?? null;
}
function unregisterBlob(url) {
	registry.delete(url);
}
/** Tiny localStorage cache so chat/media UI can paint instantly before the network answers. */
var PREFIX = "yw:cache:";
function cacheGet(key, maxAgeMs = 864e5) {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(PREFIX + key);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!parsed || Date.now() - parsed.t > maxAgeMs) return null;
		return parsed.v;
	} catch {
		return null;
	}
}
function cacheSet(key, value) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(PREFIX + key, JSON.stringify({
			t: Date.now(),
			v: value
		}));
	} catch {}
}
/**
* IndexedDB-backed chat history cache (Telegram/WhatsApp style local-first store).
* Threads paint from disk instantly — even offline — before the network answers.
*/
var store = typeof window === "undefined" ? null : createStore("yw-chat", "threads");
async function loadCachedThread(key) {
	if (!store) return null;
	try {
		return await get(key, store) ?? null;
	} catch {
		return null;
	}
}
function saveCachedThread(key, rows) {
	if (!store) return;
	try {
		set(key, rows.slice(-200), store);
	} catch {}
}
var OPTIMIZING_LABEL = "Optimizing Video for Ultra-Fast Upload...";
var MAX_PRESERVED_DIMENSION = 3840;
function supportedMimeType() {
	if (typeof MediaRecorder === "undefined") return null;
	return [
		"video/webm;codecs=vp9,opus",
		"video/webm;codecs=vp8,opus",
		"video/webm"
	].find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}
function readVideoMetadata(blobUrl) {
	return new Promise((resolve) => {
		const video = document.createElement("video");
		let timeout = setTimeout(() => {
			cleanup();
			resolve(null);
		}, 15e3);
		const cleanup = () => {
			if (timeout) clearTimeout(timeout);
			timeout = null;
			video.removeAttribute("src");
			try {
				video.load();
			} catch {}
		};
		video.preload = "metadata";
		video.muted = true;
		video.playsInline = true;
		video.onloadedmetadata = () => {
			const duration = video.duration;
			if (!Number.isFinite(duration) || duration <= 0 || !video.videoWidth || !video.videoHeight) {
				cleanup();
				resolve(null);
				return;
			}
			const metadata = {
				width: video.videoWidth,
				height: video.videoHeight,
				duration
			};
			cleanup();
			resolve(metadata);
		};
		video.onerror = () => {
			cleanup();
			resolve(null);
		};
		video.src = blobUrl;
	});
}
function even(value) {
	return Math.max(2, Math.floor(value / 2) * 2);
}
function outputSize(metadata) {
	const scale = Math.min(1, MAX_PRESERVED_DIMENSION / Math.max(metadata.width, metadata.height));
	return {
		width: even(metadata.width * scale),
		height: even(metadata.height * scale)
	};
}
function targetBitrates(metadata) {
	const maxDimension = Math.max(metadata.width, metadata.height);
	const videoBitsPerSecond = maxDimension <= 1920 ? 8e6 : maxDimension <= 2560 ? 16e6 : 35e6;
	return {
		videoBitsPerSecond,
		audioBitsPerSecond: 192e3,
		totalBitsPerSecond: videoBitsPerSecond + 192e3
	};
}
function encodeVideo(sourceUrl, metadata, mimeType, bitrateFactor, onProgress) {
	return new Promise((resolve, reject) => {
		const video = document.createElement("video");
		video.src = sourceUrl;
		video.preload = "auto";
		video.muted = false;
		video.defaultMuted = false;
		video.volume = 1;
		video.playsInline = true;
		video.crossOrigin = "anonymous";
		const canvas = document.createElement("canvas");
		const size = outputSize(metadata);
		canvas.width = size.width;
		canvas.height = size.height;
		const canvasContext = canvas.getContext("2d", { alpha: false });
		const captureStream = canvas.captureStream?.(60);
		const sourceStream = video.captureStream?.();
		if (!canvasContext || !captureStream) {
			captureStream?.getTracks().forEach((track) => track.stop());
			reject(/* @__PURE__ */ new Error("This browser cannot optimize videos locally."));
			return;
		}
		if (!sourceStream) {
			captureStream.getTracks().forEach((track) => track.stop());
			video.removeAttribute("src");
			video.load();
			reject(/* @__PURE__ */ new Error("Audio capture is unavailable during optimization."));
			return;
		}
		const target = targetBitrates(metadata);
		const audioBitsPerSecond = Math.floor(target.audioBitsPerSecond * bitrateFactor);
		const videoBitsPerSecond = Math.floor(target.videoBitsPerSecond * bitrateFactor);
		let tracks = [];
		let recorder = null;
		const chunks = [];
		let raf = 0;
		let settled = false;
		let lastProgress = -1;
		const finish = (error) => {
			if (settled) return;
			settled = true;
			cancelAnimationFrame(raf);
			tracks.forEach((track) => track.stop());
			video.pause();
			video.removeAttribute("src");
			try {
				video.load();
			} catch {}
			if (error) reject(error);
			else resolve(new Blob(chunks, { type: mimeType }));
		};
		const draw = () => {
			if (settled) return;
			if (video.readyState >= 2) {
				canvasContext.drawImage(video, 0, 0, size.width, size.height);
				const progress = Math.min(99, Math.max(0, Math.round(video.currentTime / metadata.duration * 100)));
				if (progress !== lastProgress) {
					lastProgress = progress;
					onProgress?.(progress);
				}
			}
			raf = requestAnimationFrame(draw);
		};
		video.onerror = () => finish(/* @__PURE__ */ new Error("Video playback failed during optimization."));
		video.play().then(() => {
			const sourceAudioTracks = sourceStream.getAudioTracks();
			if (sourceAudioTracks.length === 0) {
				finish(/* @__PURE__ */ new Error("Audio track could not be preserved during optimization."));
				return;
			}
			const output = new MediaStream([...captureStream.getVideoTracks(), ...sourceAudioTracks]);
			tracks = output.getTracks();
			try {
				recorder = new MediaRecorder(output, {
					mimeType,
					videoBitsPerSecond: Math.max(48e3, videoBitsPerSecond),
					audioBitsPerSecond
				});
			} catch {
				finish(/* @__PURE__ */ new Error("This browser cannot encode an optimized video."));
				return;
			}
			recorder.ondataavailable = (event) => {
				if (event.data.size) chunks.push(event.data);
			};
			recorder.onerror = () => finish(/* @__PURE__ */ new Error("Video optimization failed."));
			recorder.onstop = () => finish();
			video.onended = () => {
				if (recorder?.state !== "inactive") recorder?.stop();
			};
			recorder.start(1e3);
			raf = requestAnimationFrame(draw);
		}).catch(() => finish(/* @__PURE__ */ new Error("Video playback was blocked during optimization.")));
	});
}
/**
* Best-effort adaptive compression. It only re-encodes a source when its
* measured bitrate is materially above a resolution-appropriate target.
* 1080p, 2K, and 4K sources keep their native dimensions; sources above 4K
* may be reduced to 4K so the result remains crisp without uploading waste.
*
* This is never an upload-size gate. If metadata, codecs, or device resources
* are unavailable, the original Blob is returned and TUS uploads it directly.
*/
async function optimizeVideoBlob(source, onProgress) {
	if (!source.type.startsWith("video/")) return source;
	const sourceUrl = URL.createObjectURL(source);
	let metadata = null;
	try {
		metadata = await readVideoMetadata(sourceUrl);
	} finally {
		URL.revokeObjectURL(sourceUrl);
	}
	if (!metadata) return source;
	const target = targetBitrates(metadata);
	if (!(source.size * 8 / metadata.duration > target.totalBitsPerSecond * 1.15)) return source;
	const mimeType = supportedMimeType();
	if (!mimeType) return source;
	const encodeUrl = URL.createObjectURL(source);
	try {
		for (const factor of [
			1,
			.82,
			.68
		]) {
			const optimized = await encodeVideo(encodeUrl, metadata, mimeType, factor, (percent) => onProgress?.(percent, `${OPTIMIZING_LABEL} ${percent}%`));
			if (optimized.size < source.size * .9) {
				onProgress?.(100, `${OPTIMIZING_LABEL} 100%`);
				return optimized;
			}
		}
		return source;
	} catch (error) {
		console.warn("Adaptive video compression unavailable; uploading the original source.", error);
		return source;
	} finally {
		URL.revokeObjectURL(encodeUrl);
	}
}
/** Samples a few JPEG frames from a local video URL for automated content scanning. */
async function sampleVideoFrames(src, count = 3) {
	if (typeof document === "undefined" || !src) return [];
	const video = document.createElement("video");
	video.src = src;
	video.muted = true;
	video.playsInline = true;
	video.crossOrigin = "anonymous";
	video.preload = "auto";
	const ready = await new Promise((resolve) => {
		let settled = false;
		const timeout = window.setTimeout(() => finish(false), 8e3);
		const finish = (ok) => {
			if (settled) return;
			settled = true;
			window.clearTimeout(timeout);
			video.removeEventListener("loadedmetadata", onMetadata);
			video.removeEventListener("error", onError);
			resolve(ok);
		};
		const onMetadata = () => finish(true);
		const onError = () => finish(false);
		video.addEventListener("loadedmetadata", onMetadata, { once: true });
		video.addEventListener("error", onError, { once: true });
	});
	try {
		if (!ready || !isFinite(video.duration) || video.duration <= 0) return [];
		const canvas = document.createElement("canvas");
		const scale = Math.min(1, 640 / Math.max(video.videoWidth || 640, 1));
		canvas.width = Math.max(2, Math.round((video.videoWidth || 640) * scale));
		canvas.height = Math.max(2, Math.round((video.videoHeight || 360) * scale));
		const ctx = canvas.getContext("2d");
		if (!ctx) return [];
		const frames = [];
		for (let i = 1; i <= count; i++) {
			const t = video.duration * i / (count + 1);
			if (!await new Promise((resolve) => {
				let settled = false;
				const timeout = window.setTimeout(() => finish(false), 6e3);
				const finish = (ok) => {
					if (settled) return;
					settled = true;
					window.clearTimeout(timeout);
					video.removeEventListener("seeked", onSeeked);
					video.removeEventListener("error", onError);
					resolve(ok);
				};
				const onSeeked = () => finish(true);
				const onError = () => finish(false);
				video.addEventListener("seeked", onSeeked, { once: true });
				video.addEventListener("error", onError, { once: true });
				try {
					video.currentTime = Math.min(t, Math.max(0, video.duration - .1));
				} catch {
					finish(false);
					return;
				}
			})) break;
			try {
				ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
				const base64 = canvas.toDataURL("image/jpeg", .6).split(",")[1];
				if (base64) frames.push(base64);
			} catch {
				break;
			}
		}
		return frames;
	} finally {
		video.pause();
		video.removeAttribute("src");
		video.load();
	}
}
/**
* Creates a durable JPEG poster from a local video file.
*
* This intentionally samples at 1.0 seconds instead of the first frame:
* opening frames are often black, contain a fade-in, or have not rendered a
* useful subject yet. Callers can upload the returned Blob to storage.
*/
async function generateVideoThumbnail(videoFile, requestedTime = 1) {
	if (typeof document === "undefined" || !videoFile.size) return null;
	const video = document.createElement("video");
	const objectUrl = URL.createObjectURL(videoFile);
	video.preload = "metadata";
	video.muted = true;
	video.playsInline = true;
	video.src = objectUrl;
	const waitFor = (eventName, timeoutMs) => new Promise((resolve) => {
		let settled = false;
		const finish = (ok) => {
			if (settled) return;
			settled = true;
			window.clearTimeout(timeout);
			video.removeEventListener(eventName, onEvent);
			video.removeEventListener("error", onError);
			resolve(ok);
		};
		const onEvent = () => finish(true);
		const onError = () => finish(false);
		const timeout = window.setTimeout(() => finish(false), timeoutMs);
		video.addEventListener(eventName, onEvent, { once: true });
		video.addEventListener("error", onError, { once: true });
	});
	try {
		if (!await waitFor("loadedmetadata", 8e3)) return null;
		if (!Number.isFinite(video.duration) || video.duration <= 0) return null;
		const target = Math.min(Math.max(0, requestedTime), Math.max(0, video.duration - .1));
		try {
			video.currentTime = target;
		} catch {
			return null;
		}
		if (!await waitFor("seeked", 8e3)) return null;
		const width = video.videoWidth || 640;
		const height = video.videoHeight || 360;
		const scale = Math.min(1, 1280 / Math.max(width, height));
		const canvas = document.createElement("canvas");
		canvas.width = Math.max(2, Math.round(width * scale));
		canvas.height = Math.max(2, Math.round(height * scale));
		const context = canvas.getContext("2d");
		if (!context) return null;
		context.drawImage(video, 0, 0, canvas.width, canvas.height);
		return await new Promise((resolve) => {
			canvas.toBlob(resolve, "image/jpeg", .85);
		});
	} catch (error) {
		console.warn("Could not generate video thumbnail", error);
		return null;
	} finally {
		video.pause();
		video.removeAttribute("src");
		video.load();
		URL.revokeObjectURL(objectUrl);
	}
}
/** Unique paths let browsers safely keep generated thumbnails for one year. */
var VIDEO_THUMBNAIL_CACHE_CONTROL = "31536000, immutable";
function thumbnailPath(uid) {
	return `${uid}/thumb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
}
async function toBlob(source) {
	if (typeof source !== "string") return source;
	const response = await fetch(source);
	if (!response.ok) throw new Error("The selected video thumbnail source is unavailable.");
	return response.blob();
}
/** Uploads a custom or generated JPEG thumbnail with long-lived immutable caching. */
async function uploadVideoThumbnail(source, uid, onProgress) {
	try {
		const blob = await toBlob(source);
		return await uploadWithProgress(STORAGE_BUCKETS.videos, thumbnailPath(uid), blob, "image/jpeg", onProgress, VIDEO_THUMBNAIL_CACHE_CONTROL);
	} catch (error) {
		return {
			url: null,
			error: error instanceof Error ? error.message : "Could not upload the video thumbnail."
		};
	}
}
/** Captures the high-quality 1.0s frame and uploads it as a durable thumbnail. */
async function generateAndUploadVideoThumbnail(videoFile, uid, onProgress) {
	const thumbnail = await generateVideoThumbnail(videoFile, 1);
	if (!thumbnail) return {
		url: null,
		error: null
	};
	return uploadVideoThumbnail(thumbnail, uid, onProgress);
}
/**
* Silent background compliance monitoring for direct messages.
* Nothing here renders in the chat UI — matches are only recorded server-side.
*/
var TERMS = [
	"WhatsApp",
	"Phone Number",
	"GPay",
	"Paytm",
	"UPI",
	"Cash",
	"Direct Transfer",
	"@gmail.com",
	"Instagram DM",
	"Call Me",
	"Account Number",
	"PhonePe"
];
/** Sensitive payment/contact keywords that trigger the Social DM warning modal. */
var WARN_TERMS = [
	"account number",
	"phonepe",
	"phone pe",
	"paytm",
	"google pay",
	"gpay",
	"upi",
	"bank details",
	"ifsc",
	"whatsapp",
	"number"
];
/** True when a Social DM draft contains sensitive payment/contact hints. */
function needsProtectionWarning(text) {
	if (!text) return false;
	const haystack = text.toLowerCase();
	if (WARN_TERMS.some((t) => haystack.includes(t))) return true;
	return /(?:\d[\s-]?){7,}/.test(haystack);
}
function matchComplianceTerms(text) {
	if (!text) return [];
	const haystack = text.toLowerCase();
	return TERMS.filter((t) => haystack.includes(t.toLowerCase()));
}
/**
* Records a violation quietly. Never throws and never surfaces UI feedback,
* so the chat experience is completely undisturbed.
*/
function flagChatMessage(input) {
	const matched = matchComplianceTerms(input.text);
	if (!matched.length) return;
	(async () => {
		try {
			const { data } = await supabase.auth.getUser();
			const uid = data.user?.id;
			if (!uid) return;
			await supabase.from("chat_compliance_flags").insert({
				user_id: uid,
				surface: input.surface,
				thread_id: input.threadId ?? null,
				peer_id: input.peerId ?? null,
				message_id: input.messageId ?? null,
				matched_terms: matched,
				excerpt: (input.text ?? "").slice(0, 240)
			});
		} catch {}
	})();
}
var isMissingUniqueViewRpc = (error) => error?.code === "PGRST202" || /register_unique_view|unique_views/i.test([error?.message, error?.details].filter(Boolean).join(" "));
var isDuplicate = (error) => error?.code === "23505" || /duplicate key|already exists/i.test(error?.message ?? "");
/**
* Atomically records one view for one authenticated user and content type.
* The RPC returns true only when it inserted a new unique key and incremented
* the content counter. Replays and cross-tab races return false.
*/
async function registerUniqueView(contentId, contentType, client = supabase) {
	if (!contentId) return false;
	const { data, error } = await client.rpc("register_unique_view", {
		_content_id: contentId,
		_content_type: contentType
	});
	if (!error) return data === true;
	if (!isMissingUniqueViewRpc(error)) {
		console.error("Unable to register unique view", error);
		throw error;
	}
	const { data: session } = await client.auth.getSession();
	const uid = session.session?.user.id;
	if (!uid) return false;
	if (contentType === "moment") {
		const momentResult = await client.from("moment_views").insert({
			moment_id: contentId,
			viewer_id: uid
		});
		if (!momentResult.error) return true;
		if (isDuplicate(momentResult.error)) return false;
		if (!missingTable(momentResult.error, "moment_views")) {
			console.error("Unable to register legacy moment view", momentResult.error);
			throw momentResult.error;
		}
	}
	const postResult = await client.from("post_views").insert({
		post_id: contentId,
		viewer_id: uid
	});
	if (!postResult.error) return true;
	if (isDuplicate(postResult.error)) return false;
	console.error("Unable to register legacy post view", postResult.error);
	throw postResult.error;
}
var MIN_REEL_DURATION_MESSAGE = "Reel must be at least 5 seconds long.";
var MAX_REEL_DURATION_MESSAGE = "Reels are limited to a maximum of 90 seconds.";
var VIDEO_QUALITY_TIERS = [
	{
		id: "480p",
		label: "480p",
		shortSide: 480,
		bitrate: 9e5
	},
	{
		id: "720p",
		label: "720p",
		shortSide: 720,
		bitrate: 25e5
	},
	{
		id: "1080p",
		label: "1080p",
		shortSide: 1080,
		bitrate: 5e6
	},
	{
		id: "1440p",
		label: "1440p / 2K",
		shortSide: 1440,
		bitrate: 9e6
	},
	{
		id: "2160p",
		label: "2160p / 4K",
		shortSide: 2160,
		bitrate: 18e6
	},
	{
		id: "4320p",
		label: "4320p / 8K",
		shortSide: 4320,
		bitrate: 45e6
	}
];
function qualityTierFromDimensions(width, height) {
	const w = Number(width);
	const h = Number(height);
	if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) return null;
	const shortSide = Math.min(w, h);
	let tier = "480p";
	for (const candidate of VIDEO_QUALITY_TIERS) if (shortSide >= candidate.shortSide) tier = candidate.id;
	return tier;
}
function isVideoQualityTier(value) {
	return VIDEO_QUALITY_TIERS.some((candidate) => candidate.id === value);
}
function availableVideoQualityTiers(sourceTier) {
	if (!sourceTier) return [];
	const sourceIndex = VIDEO_QUALITY_TIERS.findIndex((candidate) => candidate.id === sourceTier);
	return VIDEO_QUALITY_TIERS.slice(0, sourceIndex + 1);
}
function estimateDownloadSizeMb(durationSeconds, tier) {
	const duration = Math.max(0, Number(durationSeconds) || 0);
	if (tier === "original") return null;
	if (tier === "mp3") return Math.max(1, Math.ceil(duration * 128e3 / 8 / 1e6));
	const definition = VIDEO_QUALITY_TIERS.find((candidate) => candidate.id === tier);
	if (!definition) return null;
	return Math.max(1, Math.ceil(duration * (definition.bitrate + 128e3) / 8 / 1e6));
}
function formatDownloadSizeMb(sizeMb) {
	if (sizeMb == null || !Number.isFinite(sizeMb)) return "Size varies";
	return sizeMb >= 1e3 ? `about ${(sizeMb / 1e3).toFixed(1)} GB` : `about ${sizeMb} MB`;
}
var AFTER_VIEW_DELAY_MS = 15e3;
var AUTO_DELETE_OPTIONS = [
	{
		value: "off",
		label: "Off"
	},
	{
		value: "after_view",
		label: "After View"
	},
	{
		value: "6_hours",
		label: "6 Hours"
	},
	{
		value: "24_hours",
		label: "24 Hours"
	}
];
function autoDeleteLabel(setting) {
	return AUTO_DELETE_OPTIONS.find((option) => option.value === setting)?.label ?? "Off";
}
function autoDeleteSeconds(setting) {
	if (setting === "6_hours") return 21600;
	if (setting === "24_hours") return 86400;
	return 0;
}
function autoDeleteExpiresAt(setting, now = Date.now()) {
	const seconds = autoDeleteSeconds(setting);
	return seconds ? new Date(now + seconds * 1e3).toISOString() : null;
}
function expiresAtForAutoDelete(setting, now = Date.now()) {
	return autoDeleteExpiresAt(setting, now);
}
function afterViewExpiresAt(viewedAt = Date.now()) {
	return new Date(viewedAt + AFTER_VIEW_DELAY_MS).toISOString();
}
function normalizeAutoDeleteSetting(value, legacySeconds = 0) {
	if (value === "after_view" || value === "6_hours" || value === "24_hours") return value;
	if (Number(legacySeconds) >= 86400) return "24_hours";
	if (Number(legacySeconds) > 0) return "6_hours";
	return "off";
}
var liveSocialTable = (client, table) => client.from(table);
var liveCommentLikesTable = (client) => client.from("comment_likes");
var hueFromId = (id) => {
	let h = 0;
	for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
	return h;
};
var toUser = (p, id) => ({
	id,
	username: p?.username ?? `user${id.slice(0, 4)}`,
	name: p?.display_name ?? p?.username ?? "YourWorld user",
	hue: hueFromId(id)
});
function timeAgo(iso) {
	const timestamp = new Date(iso).getTime();
	if (!Number.isFinite(timestamp)) return "Just now";
	const s = Math.max(0, Math.round((Date.now() - timestamp) / 1e3));
	if (s < 60) return "Just now";
	if (s < 3600) return `${Math.round(s / 60)}m ago`;
	if (s < 86400) return `${Math.round(s / 3600)}h ago`;
	return `${Math.round(s / 86400)}d ago`;
}
/** Local blob URLs kept for media the current session just uploaded. */
var localMedia = /* @__PURE__ */ new Map();
/** Remember a local blob/object URL as a fallback for a remote media URL. */
function rememberLocalMedia(remoteUrl, localUrl) {
	if (remoteUrl && /^(blob:|data:)/.test(localUrl)) localMedia.set(remoteUrl, localUrl);
}
function getLocalMedia(remoteUrl) {
	return localMedia.get(remoteUrl) ?? null;
}
var signedCache = /* @__PURE__ */ new Map();
function storagePathFrom(url, bucket) {
	if (!/^https?:/.test(url)) return url.replace(/^\/+/, "");
	const m = url.match(new RegExp(`/storage/v1/object/(?:sign|public)/${bucket}/([^?]+)`));
	return m ? decodeURIComponent(m[1]) : null;
}
/**
* Turns a stored media reference into a URL the <video>/<img> tag can load.
* Handles bare storage paths and expired signed URLs by re-signing, and falls
* back to the bucket's public URL.
*/
async function resolveMediaUrl(url, bucket = "reels") {
	if (!url) return url;
	if (/^(blob:|data:)/.test(url)) return url;
	const cached = signedCache.get(url);
	if (cached && cached.expiresAt > Date.now()) return cached.url;
	if (cached) signedCache.delete(url);
	const path = storagePathFrom(url, bucket);
	if (!path) return url;
	const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 86400);
	if (error || !data?.signedUrl) return url;
	const next = data.signedUrl;
	signedCache.set(url, {
		url: next,
		expiresAt: Date.now() + 792e5
	});
	return next;
}
/** Live list of posts of a given kind, with author, like and comment counts. */
async function loadSocialPosts(kind, client = supabase, userId) {
	const { data: sessionData } = await client.auth.getSession();
	const uid = sessionData.session?.user.id ?? null;
	const scoped = Boolean(userId);
	let query = client.from("posts").select("*");
	if (kind === "creator-media") query = query.in("kind", ["reel", "video"]);
	else query = query.eq("kind", kind);
	if (userId) query = query.eq("user_id", userId);
	let { data: posts, error } = await query.order("created_at", { ascending: false }).limit(scoped ? 100 : 50);
	if (missingColumn(error) === "kind") {
		const legacyKind = kind === "post" ? "story" : kind;
		let legacyQuery = client.from("posts").select("*").eq("type", legacyKind);
		if (userId) legacyQuery = legacyQuery.eq("user_id", userId);
		const legacy = await legacyQuery.order("created_at", { ascending: false }).limit(scoped ? 100 : 50);
		posts = legacy.data;
		error = legacy.error;
		if (missingColumn(error) === "type" || kind === "creator-media") {
			let unfilteredQuery = client.from("posts").select("*");
			if (userId) unfilteredQuery = unfilteredQuery.eq("user_id", userId);
			const unfiltered = await unfilteredQuery.order("created_at", { ascending: false }).limit(100);
			posts = (unfiltered.data ?? []).filter((row) => kind === "creator-media" ? postKind(row) === "reel" || postKind(row) === "video" : postKind(row) === kind);
			error = unfiltered.error;
		}
	}
	if (error || !posts?.length) {
		if (error) console.error(`Unable to load ${kind} feed`, error);
		return {
			posts: [],
			currentUserId: uid
		};
	}
	const ids = posts.map((p) => p.id);
	const authorIds = [...new Set(posts.map((p) => p.user_id))];
	const [profilesResult, likesResult, commentsResult] = await Promise.all([
		client.rpc("get_public_profiles", { ids: authorIds }),
		liveSocialTable(client, "likes").select("post_id,user_id").in("post_id", ids),
		liveSocialTable(client, "comments").select("post_id").in("post_id", ids)
	]);
	const { data: profiles } = profilesResult;
	const { data: likes, error: likesError } = likesResult;
	const { data: comments } = commentsResult;
	if (likesError) console.error(`Unable to load ${kind} likes`, likesError);
	const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
	const likeRows = likes ?? [];
	const commentRows = comments ?? [];
	return {
		posts: posts.map((p) => ({
			...normalizePostRow(p),
			views: Number(p.views ?? p.views_count ?? 0),
			author: toUser(profileById.get(p.user_id), p.user_id),
			authorAvatarUrl: profileById.get(p.user_id)?.avatar_url ?? null,
			likeCount: likeRows.filter((like) => like.post_id === p.id).length,
			commentCount: commentRows.filter((comment) => comment.post_id === p.id).length,
			likedByMe: !!uid && likeRows.some((like) => like.post_id === p.id && like.user_id === uid)
		})),
		currentUserId: uid
	};
}
function useSocialPosts(kind, userId) {
	const [rows, setRows] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [me, setMe] = (0, import_react.useState)(null);
	const muteUntil = (0, import_react.useRef)(0);
	const pendingLikes = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const viewedRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const load = (0, import_react.useCallback)(async () => {
		if (Date.now() < muteUntil.current) return;
		const next = await loadSocialPosts(kind, supabase, userId);
		setMe(next.currentUserId);
		setRows(next.posts);
		setLoading(false);
	}, [kind, userId]);
	(0, import_react.useEffect)(() => {
		load();
		let timer;
		const queue = () => {
			window.clearTimeout(timer);
			timer = window.setTimeout(() => void load(), 500);
		};
		let channel = null;
		const boot = window.setTimeout(() => {
			channel = supabase.channel(`social-${kind}-${userId ?? "all"}`).on("postgres_changes", {
				event: "*",
				schema: "public",
				table: "posts"
			}, queue).on("postgres_changes", {
				event: "*",
				schema: "public",
				table: "likes"
			}, queue).on("postgres_changes", {
				event: "*",
				schema: "public",
				table: "comments"
			}, queue).subscribe();
		}, 300);
		return () => {
			window.clearTimeout(boot);
			window.clearTimeout(timer);
			if (channel) supabase.removeChannel(channel);
		};
	}, [
		kind,
		load,
		userId
	]);
	return {
		posts: rows,
		loading,
		currentUserId: me,
		toggleLike: (0, import_react.useCallback)(async (postId) => {
			if (!me) throw new Error("Sign in required");
			if (pendingLikes.current.has(postId)) return;
			pendingLikes.current.add(postId);
			muteUntil.current = Date.now() + 1500;
			let wasLiked = false;
			setRows((prev) => prev.map((r) => {
				if (r.id !== postId) return r;
				wasLiked = !!r.likedByMe;
				return {
					...r,
					likedByMe: !r.likedByMe,
					likeCount: Math.max(0, r.likeCount + (r.likedByMe ? -1 : 1))
				};
			}));
			try {
				if (wasLiked) {
					const { error } = await liveSocialTable(supabase, "likes").delete().eq("post_id", postId).eq("user_id", me);
					if (error) throw error;
				} else {
					const { error } = await liveSocialTable(supabase, "likes").upsert({
						post_id: postId,
						user_id: me
					}, {
						onConflict: "post_id,user_id",
						ignoreDuplicates: true
					});
					if (error) throw error;
				}
			} catch (error) {
				setRows((prev) => prev.map((row) => {
					if (row.id !== postId) return row;
					const optimisticLiked = row.likedByMe;
					return {
						...row,
						likedByMe: wasLiked,
						likeCount: Math.max(0, row.likeCount + (optimisticLiked === wasLiked ? 0 : wasLiked ? 1 : -1))
					};
				}));
				throw error;
			} finally {
				pendingLikes.current.delete(postId);
			}
		}, [me]),
		countView: (0, import_react.useCallback)(async (postId) => {
			if (viewedRef.current.has(postId)) return false;
			const current = rows.find((row) => row.id === postId);
			if (!await registerUniqueView(postId, current?.kind === "reel" ? "reel" : current?.kind === "post" ? "post" : "video")) return false;
			viewedRef.current.add(postId);
			setRows((prev) => prev.map((row) => row.id === postId ? {
				...row,
				views: (row.views ?? 0) + 1
			} : row));
			return true;
		}, [rows]),
		bumpComment: (0, import_react.useCallback)((postId, delta = 1) => {
			muteUntil.current = Date.now() + 1500;
			setRows((prev) => prev.map((r) => r.id === postId ? {
				...r,
				commentCount: Math.max(0, r.commentCount + delta)
			} : r));
		}, []),
		reload: load
	};
}
function asRecord(value) {
	return value && typeof value === "object" ? value : null;
}
function isExpiringMediaMessage(row) {
	const metadata = asRecord(row.metadata);
	return Boolean(row.media_url || row.voice_note_url || metadata?.expiring_media === true || metadata?.view_once === true);
}
function momentContextFromRow(row) {
	const metadata = asRecord(row.metadata);
	const preview = asRecord(metadata?.preview);
	const momentId = typeof row.moment_id === "string" ? row.moment_id : typeof metadata?.moment_id === "string" ? metadata.moment_id : null;
	if (!momentId) return {
		moment_id: null,
		moment_media_url: null,
		moment_created_at: null
	};
	return {
		moment_id: momentId,
		moment_media_url: typeof row.moment_media_url === "string" ? row.moment_media_url : typeof metadata?.moment_media_url === "string" ? metadata.moment_media_url : typeof preview?.media_url === "string" ? preview.media_url : null,
		moment_created_at: typeof row.moment_created_at === "string" ? row.moment_created_at : typeof metadata?.moment_created_at === "string" ? metadata.moment_created_at : typeof preview?.created_at === "string" ? preview.created_at : null
	};
}
var toDbMessage = (row) => ({
	id: typeof row.id === "string" ? row.id : "",
	sender_id: typeof row.sender_id === "string" ? row.sender_id : "",
	receiver_id: typeof row.receiver_id === "string" ? row.receiver_id : "",
	content: typeof row.content === "string" ? row.content : "",
	media_url: typeof row.media_url === "string" ? row.media_url : null,
	voice_note_url: typeof row.voice_note_url === "string" ? row.voice_note_url : null,
	metadata: asRecord(row.metadata),
	is_read: row.is_read === true,
	created_at: typeof row.created_at === "string" ? row.created_at : (/* @__PURE__ */ new Date(0)).toISOString(),
	...momentContextFromRow(row),
	auto_delete_setting: row.auto_delete_setting ?? "off",
	auto_delete_mode: row.auto_delete_mode ?? row.auto_delete_setting ?? "off",
	expires_at: row.expires_at ?? null,
	is_deleted: row.is_deleted === true,
	is_viewed: row.is_viewed === true,
	viewed_at: row.viewed_at ?? null,
	is_system_message: row.is_system_message === true,
	conversation_id: row.conversation_id ?? null,
	media_type: row.voice_note_url ? "audio" : row.media_url ? "image" : "text"
});
var isRenderablePublicMessage = (row, _viewerId, now = Date.now()) => (!row.expires_at || new Date(row.expires_at).getTime() > now) && row.is_deleted !== true;
function isMissingAutoDeleteColumn(error) {
	const text = typeof error === "string" ? error : error && typeof error === "object" ? String(error.message ?? "") : "";
	return /schema cache|does not exist/i.test(text) && /\b(auto_delete_mode|expires_at|is_deleted)\b/i.test(text);
}
var migrationTables = supabase;
async function setUserBlock(blockerId, blockedId, blocked) {
	return (blocked ? await migrationTables.from("user_blocks").insert({
		blocker_id: blockerId,
		blocked_id: blockedId
	}) : await migrationTables.from("user_blocks").delete().eq("blocker_id", blockerId).eq("blocked_id", blockedId)).error?.message ?? null;
}
async function reportSocialUser(reporterId, reportedUserId, threadId) {
	return (await migrationTables.from("user_reports").upsert({
		reporter_id: reporterId,
		reported_user_id: reportedUserId,
		surface: "social",
		thread_id: threadId,
		reason: "User report"
	}, { onConflict: "reporter_id,reported_user_id,surface" })).error?.message ?? null;
}
/** Uploads the original reel file without client-side re-encoding or rendering. */
async function publishDirectReel(opts) {
	const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
	if (sessionError) {
		console.error("Could not authorize direct reel publishing", sessionError);
		return { error: sessionError.message };
	}
	const uid = sessionData.session?.user.id;
	if (!uid) return { error: "You need to sign in to post a reel." };
	if (opts.durationSeconds < 5) return { error: MIN_REEL_DURATION_MESSAGE };
	if (opts.durationSeconds > 90) return { error: MAX_REEL_DURATION_MESSAGE };
	const extension = opts.file.name.split(".").pop()?.toLowerCase() || "mp4";
	const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
	const { url: mediaUrl, error: uploadError } = await uploadWithProgress(STORAGE_BUCKETS.reels, path, opts.file, opts.file.type || "video/mp4", (percent, detail) => opts.onProgress?.(Math.min(88, Math.round(percent * .88)), detail));
	if (uploadError || !mediaUrl) {
		console.error("Direct reel storage upload failed", uploadError);
		return { error: uploadError ?? "Upload failed" };
	}
	let thumbnailUrl = null;
	try {
		const thumbnailUpload = opts.thumbnail ? await uploadVideoThumbnail(opts.thumbnail, uid, (percent, detail) => opts.onProgress?.(88 + Math.round(percent * .1), detail)) : await generateAndUploadVideoThumbnail(opts.file, uid, (percent, detail) => opts.onProgress?.(88 + Math.round(percent * .1), detail));
		if (thumbnailUpload.error || !thumbnailUpload.url) console.warn("Direct reel thumbnail upload failed", thumbnailUpload.error);
		else thumbnailUrl = thumbnailUpload.url;
	} catch (error) {
		console.warn("Automatic reel thumbnail generation failed", error);
	}
	const { error } = await writeCompat((payload) => supabase.from("posts").insert(payload), {
		user_id: uid,
		kind: "reel",
		is_reel: true,
		media_url: mediaUrl,
		media_type: "video",
		thumbnail_url: thumbnailUrl,
		title: opts.title.trim(),
		caption: opts.caption?.trim() ?? "",
		hashtags: opts.hashtags ?? [],
		audio: null,
		allow_download: true,
		audience: "everyone",
		tagged_user_ids: [],
		viewer_user_ids: [],
		duration_seconds: Math.round(opts.durationSeconds),
		original_width: opts.originalWidth ?? null,
		original_height: opts.originalHeight ?? null,
		source_quality_tier: qualityTierFromDimensions(opts.originalWidth, opts.originalHeight)
	}, { kind: "type" });
	opts.onProgress?.(100);
	if (error) console.error("Direct reel database insert failed", error);
	return { error: error?.message ?? null };
}
/** Uploads a photo/video and inserts it into the posts table (kind = "post"). */
async function publishPost(opts) {
	const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
	if (sessionError) {
		console.error("Could not authorize post publishing", sessionError);
		return { error: sessionError.message };
	}
	const uid = sessionData.session?.user.id;
	if (!uid) return { error: "You need to sign in to create a post." };
	let mediaUrl = opts.fileUrl;
	let sourceBlob = opts.file ?? null;
	if (/^(blob:|data:)/.test(opts.fileUrl)) try {
		const blob = opts.file ?? await (await fetch(opts.fileUrl)).blob();
		sourceBlob = blob;
		const type = blob.type || (opts.mediaType === "video" ? "video/mp4" : "image/jpeg");
		const uploadBlob = opts.mediaType === "video" ? await optimizeVideoBlob(blob, (percent, detail) => opts.onProgress?.(Math.round(percent * .45), detail)) : blob;
		const uploadType = uploadBlob.type || type;
		const ext = uploadType.split("/")[1]?.split(";")[0] || (opts.mediaType === "video" ? "mp4" : "jpg");
		const path = `${uid}/post-${Date.now()}.${ext}`;
		const { url, error: upErr } = await uploadWithProgress(STORAGE_BUCKETS.videos, path, uploadBlob, uploadType, (percent) => opts.onProgress?.(opts.mediaType === "video" ? 45 + Math.round(percent * .55) : percent));
		if (upErr || !url) {
			console.error("Post storage upload failed", upErr);
			return { error: upErr ?? "Upload failed" };
		}
		mediaUrl = url;
	} catch (e) {
		console.error("Post upload preparation failed", e);
		return { error: e instanceof Error ? e.message : "Upload failed" };
	}
	else opts.onProgress?.(100);
	let thumbnailUrl = null;
	if (opts.mediaType === "video" && sourceBlob) {
		const thumbnail = await generateAndUploadVideoThumbnail(sourceBlob, uid);
		if (thumbnail.error) console.warn("Post thumbnail upload failed", thumbnail.error);
		thumbnailUrl = thumbnail.url;
	}
	const { error } = await writeCompat((payload) => supabase.from("posts").insert(payload), {
		user_id: uid,
		kind: "post",
		media_url: mediaUrl,
		media_type: opts.mediaType,
		thumbnail_url: thumbnailUrl,
		caption: opts.caption ?? "",
		hashtags: opts.hashtags ?? [],
		location: opts.location ?? null,
		allow_download: opts.allowDownload ?? true,
		audience: opts.audience ?? "everyone",
		tagged_user_ids: [],
		viewer_user_ids: []
	}, { kind: "type" });
	if (error) console.error("Post database insert failed", error);
	else rememberLocalMedia(mediaUrl, opts.fileUrl);
	return { error: error?.message ?? null };
}
async function ensureThreadConversation(threadId, pair) {
	const [participantOneId, participantTwoId] = [...pair].sort();
	const existing = await supabase.from("conversations").select("id,auto_delete_setting").eq("thread_id", threadId).maybeSingle();
	if (!existing.error && existing.data) return existing.data;
	if (existing.error && !/thread_id|schema cache|does not exist/i.test(existing.error.message)) {
		console.error("[social-chat] conversation lookup failed", existing.error);
		return null;
	}
	const created = await supabase.from("conversations").upsert({
		thread_id: threadId,
		participant_one_id: participantOneId,
		participant_two_id: participantTwoId,
		auto_delete_setting: "off"
	}, { onConflict: "thread_id" }).select("id,auto_delete_setting").maybeSingle();
	if (created.error || !created.data) {
		console.error("[social-chat] conversation create failed", created.error);
		return null;
	}
	return created.data;
}
/** Live public.messages records for the canonical two-person route id. */
function useThreadMessages(threadId, _opts = {}) {
	const pair = (0, import_react.useMemo)(() => dmThreadPair(threadId), [threadId]);
	const [messages, setMessages] = (0, import_react.useState)(() => cacheGet(`thread:${threadId}`) ?? []);
	const [conversationId, setConversationId] = (0, import_react.useState)(null);
	const [me, setMe] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [loadingMore, setLoadingMore] = (0, import_react.useState)(false);
	const [hasMore, setHasMore] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(pair ? null : "Invalid chat address.");
	const messagesRef = (0, import_react.useRef)([]);
	const meRef = (0, import_react.useRef)(null);
	const clearChannelRef = (0, import_react.useRef)(null);
	const clearGenerationRef = (0, import_react.useRef)(0);
	const afterViewTimersRef = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	(0, import_react.useEffect)(() => {
		messagesRef.current = messages;
		cacheSet(`thread:${threadId}`, messages.filter((m) => !m.id.startsWith("tmp-")).slice(-40));
	}, [messages, threadId]);
	const belongs = (0, import_react.useCallback)((row) => !!pair && (row.sender_id === pair[0] && row.receiver_id === pair[1] || row.sender_id === pair[1] && row.receiver_id === pair[0]), [pair]);
	const merge = (0, import_react.useCallback)((rows) => setMessages((prev) => {
		const next = new Map(prev.map((m) => [m.id, m]));
		rows.filter(belongs).filter((row) => isRenderablePublicMessage(row, meRef.current)).map(toDbMessage).forEach((m) => next.set(m.id, m));
		return [...next.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
	}), [belongs]);
	const queryRows = (0, import_react.useCallback)(async (before) => {
		if (!pair) return [];
		try {
			const now = (/* @__PURE__ */ new Date()).toISOString();
			const fetchRows = async (withExpiryFilter, withDeletedFilter) => {
				let query = supabase.from("messages").select("*").or(`and(sender_id.eq.${pair[0]},receiver_id.eq.${pair[1]}),and(sender_id.eq.${pair[1]},receiver_id.eq.${pair[0]})`);
				if (withExpiryFilter) query = query.or(`expires_at.is.null,expires_at.gt.${now}`);
				if (withDeletedFilter) query = query.eq("is_deleted", false);
				query = query.order("created_at", { ascending: false }).limit(40);
				if (before) query = query.lt("created_at", before);
				return await query;
			};
			let result = await fetchRows(true, true);
			if (result.error && isMissingAutoDeleteColumn(result.error)) result = await fetchRows(false, false);
			if (result.error) {
				console.error("[social-chat] message fetch failed", result.error);
				return null;
			}
			return result.data ?? [];
		} catch (cause) {
			console.error("[social-chat] message fetch threw", cause);
			return null;
		}
	}, [pair]);
	const load = (0, import_react.useCallback)(async () => {
		if (!pair) {
			setLoading(false);
			return;
		}
		const generation = clearGenerationRef.current;
		try {
			const rows = await queryRows();
			if (rows === null) return;
			if (generation !== clearGenerationRef.current) return;
			merge(rows);
			setHasMore(rows.length >= 40);
			setError(null);
		} catch (cause) {
			console.error("[social-chat] message load failed", cause);
			setError(null);
		} finally {
			setLoading(false);
		}
	}, [
		pair,
		queryRows,
		merge
	]);
	const loadOlder = (0, import_react.useCallback)(async () => {
		const oldest = messagesRef.current.filter((m) => !m.id.startsWith("tmp-")).sort((a, b) => a.created_at.localeCompare(b.created_at))[0]?.created_at;
		if (!oldest || loadingMore || !hasMore) return;
		const generation = clearGenerationRef.current;
		setLoadingMore(true);
		try {
			const rows = await queryRows(oldest);
			if (rows === null) return;
			if (generation !== clearGenerationRef.current) return;
			merge(rows);
			setHasMore(rows.length >= 40);
			setError(null);
		} catch (cause) {
			console.error("[social-chat] older message load failed", cause);
			setError(null);
		} finally {
			setLoadingMore(false);
		}
	}, [
		queryRows,
		merge,
		loadingMore,
		hasMore
	]);
	(0, import_react.useEffect)(() => {
		let alive = true;
		let retry = null;
		let channel = null;
		const bootstrap = async () => {
			try {
				const { data } = await supabase.auth.getSession();
				if (!alive) return;
				const id = data.session?.user.id ?? null;
				meRef.current = id;
				setMe(id);
				if (id && pair) {
					const conversation = await ensureThreadConversation(threadId, pair);
					if (!alive) return;
					setConversationId(conversation?.id ?? null);
				} else setConversationId(null);
				load();
			} catch (cause) {
				console.error("[social-chat] session/bootstrap failed", cause);
				if (alive) setLoading(false);
			}
		};
		bootstrap();
		const subscribe = () => {
			if (!alive) return;
			channel = supabase.channel(`messages-${threadId}-${Math.random().toString(36).slice(2)}`).on("postgres_changes", {
				event: "*",
				schema: "public",
				table: "messages"
			}, (payload) => {
				const row = payload.new ?? payload.old;
				if (!row?.id) return;
				if (payload.eventType === "DELETE") {
					setMessages((prev) => prev.filter((m) => m.id !== row.id));
					return;
				}
				if (!belongs(row)) return;
				if (!isRenderablePublicMessage(row, meRef.current)) setMessages((prev) => prev.filter((m) => m.id !== row.id));
				else merge([row]);
			}).subscribe((status) => {
				if (status === "SUBSCRIBED") {
					load();
					return;
				}
				if (![
					"CHANNEL_ERROR",
					"TIMED_OUT",
					"CLOSED"
				].includes(status) || !alive || retry) return;
				retry = setTimeout(() => {
					retry = null;
					if (channel) {
						channel.unsubscribe();
						supabase.removeChannel(channel);
					}
					channel = null;
					subscribe();
				}, 1500);
			});
		};
		subscribe();
		const resyncOnVisible = () => {
			if (document.visibilityState === "visible") load();
		};
		const resyncOnOnline = () => void load();
		document.addEventListener("visibilitychange", resyncOnVisible);
		window.addEventListener("online", resyncOnOnline);
		return () => {
			alive = false;
			if (retry) clearTimeout(retry);
			document.removeEventListener("visibilitychange", resyncOnVisible);
			window.removeEventListener("online", resyncOnOnline);
			if (channel) {
				channel.unsubscribe();
				supabase.removeChannel(channel);
			}
		};
	}, [
		threadId,
		pair,
		load,
		belongs,
		merge
	]);
	(0, import_react.useEffect)(() => {
		if (!conversationId) return;
		const channel = supabase.channel(`social-chat-clear-${conversationId}`).on("broadcast", { event: "chat_cleared" }, ({ payload }) => {
			if (payload?.conversationId !== conversationId) return;
			clearGenerationRef.current += 1;
			afterViewTimersRef.current.forEach((timer) => clearTimeout(timer));
			afterViewTimersRef.current.clear();
			messagesRef.current = [];
			setMessages([]);
			setHasMore(false);
			cacheSet(`thread:${threadId}`, []);
		}).subscribe();
		clearChannelRef.current = channel;
		return () => {
			if (clearChannelRef.current === channel) clearChannelRef.current = null;
			channel.unsubscribe();
			supabase.removeChannel(channel);
		};
	}, [conversationId, threadId]);
	(0, import_react.useEffect)(() => {
		const sweep = () => {
			setMessages((prev) => prev.filter((message) => isRenderablePublicMessage(message, meRef.current)));
			supabase.rpc("delete_expired_chat_messages");
		};
		sweep();
		const timer = window.setInterval(sweep, 3e4);
		return () => window.clearInterval(timer);
	}, []);
	const deleteAfterView = (0, import_react.useCallback)(async (id) => {
		if (!me) return;
		const { error: deleteError } = await supabase.rpc("delete_expired_chat_messages");
		if (deleteError) {
			setError(deleteError.message);
			return;
		}
		const now = Date.now();
		setMessages((prev) => prev.filter((message) => message.id !== id && (!message.expires_at || Date.parse(message.expires_at) > now)));
	}, [me]);
	(0, import_react.useEffect)(() => {
		if (!me) return;
		messages.forEach((message) => {
			if (message.receiver_id !== me || message.auto_delete_mode !== "after_view" || !isExpiringMediaMessage(message) || !message.is_viewed || message.is_deleted || afterViewTimersRef.current.has(message.id)) return;
			const viewedAt = message.viewed_at ? Date.parse(message.viewed_at) : Date.now();
			const expiresAt = message.expires_at ? Date.parse(message.expires_at) : viewedAt + AFTER_VIEW_DELAY_MS;
			const delay = Math.max(0, expiresAt - Date.now());
			const timer = setTimeout(() => {
				afterViewTimersRef.current.delete(message.id);
				deleteAfterView(message.id);
			}, delay);
			afterViewTimersRef.current.set(message.id, timer);
		});
	}, [
		messages,
		me,
		deleteAfterView
	]);
	(0, import_react.useEffect)(() => () => {
		afterViewTimersRef.current.forEach((timer) => clearTimeout(timer));
		afterViewTimersRef.current.clear();
	}, []);
	const send = (0, import_react.useCallback)(async (payload) => {
		if (!me || !pair || !pair.includes(me)) return { error: "You are not authorized for this chat." };
		if (!conversationId) return { error: "Chat is still syncing. Try again in a moment." };
		const receiverId = pair.find((id) => id !== me);
		const { data: blockRow, error: blockError } = await supabase.from("user_blocks").select("blocker_id").or(`and(blocker_id.eq.${me},blocked_id.eq.${receiverId}),and(blocker_id.eq.${receiverId},blocked_id.eq.${me})`).limit(1).maybeSingle();
		if (blockError) return { error: blockError.message };
		if (blockRow) return { error: "This conversation is blocked." };
		const conversationResult = await supabase.from("conversations").select("auto_delete_setting").eq("id", conversationId).maybeSingle();
		if (conversationResult.error || !conversationResult.data) return { error: conversationResult.error?.message ?? "Could not read chat settings." };
		const conversation = conversationResult.data;
		const expiringMedia = Boolean(payload.expiringMedia || payload.viewOnce || payload.media_url || payload.voice_note_url);
		const requestedMode = payload.autoDeleteMode ?? payload.autoDeleteSetting ?? normalizeAutoDeleteSetting(conversation.auto_delete_setting);
		const autoDeleteMode = payload.isSystemMessage ? "off" : requestedMode === "after_view" && !expiringMedia ? "off" : payload.viewOnce || payload.expiringMedia ? "after_view" : requestedMode;
		const metadata = {
			...payload.metadata ?? {},
			...expiringMedia ? { expiring_media: true } : {},
			...payload.viewOnce ? { view_once: true } : {}
		};
		const expiresAt = expiresAtForAutoDelete(autoDeleteMode);
		const tempId = `tmp-${Date.now()}`;
		const optimistic = toDbMessage({
			id: tempId,
			sender_id: me,
			receiver_id: receiverId,
			content: payload.content ?? "",
			media_url: payload.media_url ?? null,
			voice_note_url: payload.voice_note_url ?? null,
			metadata,
			is_read: false,
			created_at: (/* @__PURE__ */ new Date()).toISOString(),
			auto_delete_setting: autoDeleteMode,
			auto_delete_mode: autoDeleteMode,
			expires_at: expiresAt,
			is_deleted: false,
			is_viewed: false,
			viewed_at: null,
			is_system_message: payload.isSystemMessage === true,
			conversation_id: conversationId
		});
		setMessages((prev) => [...prev, optimistic]);
		const { data, error: insertError } = await supabase.from("messages").insert({
			sender_id: me,
			receiver_id: receiverId,
			content: optimistic.content,
			media_url: optimistic.media_url,
			voice_note_url: optimistic.voice_note_url,
			metadata,
			conversation_id: conversationId,
			is_system_message: payload.isSystemMessage === true,
			auto_delete_setting: autoDeleteMode,
			auto_delete_mode: autoDeleteMode,
			expires_at: expiresAt,
			is_deleted: false
		}).select("*").maybeSingle();
		if (insertError) {
			setMessages((prev) => prev.filter((m) => m.id !== tempId));
			setError(insertError.message);
			return { error: insertError.message };
		}
		if (data) merge([data]);
		setMessages((prev) => prev.filter((m) => m.id !== tempId));
		flagChatMessage({
			surface: "social",
			text: payload.content,
			threadId,
			messageId: data?.id ?? null
		});
		return { error: null };
	}, [
		me,
		pair,
		threadId,
		conversationId,
		merge
	]);
	const remove = (0, import_react.useCallback)(async (ids) => {
		if (!me || !ids.length) return;
		const { error: deleteError } = await supabase.from("messages").delete().in("id", ids).eq("sender_id", me);
		if (deleteError) {
			setError(deleteError.message);
			return;
		}
		setMessages((prev) => prev.filter((m) => !ids.includes(m.id) || m.sender_id !== me));
	}, [me]);
	const clearForEveryone = (0, import_react.useCallback)(async () => {
		if (!me || !conversationId) return { error: "Chat is still syncing. Try again in a moment." };
		const { error: clearError } = await supabase.rpc("clear_social_conversation", { _conversation_id: conversationId });
		if (clearError) {
			setError(clearError.message);
			return { error: clearError.message };
		}
		clearGenerationRef.current += 1;
		afterViewTimersRef.current.forEach((timer) => clearTimeout(timer));
		afterViewTimersRef.current.clear();
		messagesRef.current = [];
		setMessages([]);
		setHasMore(false);
		cacheSet(`thread:${threadId}`, []);
		const channel = clearChannelRef.current;
		if (channel) await channel.send({
			type: "broadcast",
			event: "chat_cleared",
			payload: { conversationId }
		});
		return { error: null };
	}, [
		conversationId,
		me,
		threadId
	]);
	const markRead = (0, import_react.useCallback)(async (ids) => {
		if (!me || !ids.length) return;
		const { error: updateError } = await supabase.from("messages").update({ is_read: true }).in("id", ids).eq("receiver_id", me);
		if (updateError) {
			setError(updateError.message);
			return;
		}
		const viewedAt = (/* @__PURE__ */ new Date()).toISOString();
		const { error: viewedError } = await supabase.from("messages").update({
			is_viewed: true,
			viewed_at: viewedAt,
			expires_at: afterViewExpiresAt(Date.parse(viewedAt))
		}).in("id", ids).eq("receiver_id", me).eq("auto_delete_mode", "after_view").eq("is_deleted", false);
		if (viewedError) {
			setError(viewedError.message);
			return;
		}
		setMessages((prev) => prev.map((m) => ids.includes(m.id) && m.receiver_id === me ? {
			...m,
			is_read: true,
			is_viewed: m.auto_delete_mode === "after_view" ? true : m.is_viewed,
			viewed_at: m.auto_delete_mode === "after_view" ? viewedAt : m.viewed_at,
			expires_at: m.auto_delete_mode === "after_view" ? afterViewExpiresAt(Date.parse(viewedAt)) : m.expires_at
		} : m));
	}, [me]);
	return (0, import_react.useMemo)(() => ({
		messages,
		loading,
		loadingMore,
		hasMore,
		loadOlder,
		currentUserId: me,
		conversationId,
		send,
		remove,
		clearForEveryone,
		markRead,
		error,
		reload: load
	}), [
		messages,
		loading,
		loadingMore,
		hasMore,
		loadOlder,
		me,
		conversationId,
		send,
		remove,
		clearForEveryone,
		markRead,
		error,
		load
	]);
}
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Deterministic thread id for a 1:1 chat — identical for both users. */
function dmThreadId(a, b) {
	return `dm_${[a, b].sort().join("_")}`;
}
/** Reads the two user ids out of a canonical thread id. */
function dmThreadPair(threadId) {
	const m = /^dm_([0-9a-f-]{36})_([0-9a-f-]{36})$/i.exec(threadId);
	return m ? [m[1], m[2]] : null;
}
/** Resolves the other participant of a DM thread (id + display name). */
async function resolveThreadPeer(threadId, me) {
	let peerId = null;
	const pair = dmThreadPair(threadId);
	if (pair) peerId = pair.find((id) => id !== me) ?? pair[0];
	if (!peerId && UUID_RE.test(threadId) && threadId !== me) peerId = threadId;
	if (!peerId) return {
		peerId: null,
		peerName: "Unknown user",
		avatarUrl: null
	};
	const { data: profileRows } = await supabase.rpc("get_public_profiles", { ids: [peerId] });
	const profile = (profileRows ?? [])[0] ?? null;
	const rawAvatarUrl = profile?.avatar_url || profile?.profile_pic || profile?.profile_image || null;
	return {
		peerId,
		peerName: profile?.display_name || profile?.username || `User ${peerId.slice(0, 6)}`,
		avatarUrl: rawAvatarUrl ? await resolveMediaUrl(rawAvatarUrl, "avatars") : null
	};
}
function useThreadPeer(threadId, me) {
	const [peer, setPeer] = (0, import_react.useState)({
		peerId: null,
		peerName: "",
		avatarUrl: null
	});
	(0, import_react.useEffect)(() => {
		let alive = true;
		resolveThreadPeer(threadId, me).then((p) => {
			if (alive) setPeer(p);
		});
		return () => {
			alive = false;
		};
	}, [threadId, me]);
	return peer;
}
async function createPostComment(postId, userId, body, client = supabase, parentCommentId = null) {
	const text = body.trim();
	if (!text) return {
		data: null,
		error: null
	};
	const basePayload = {
		post_id: postId,
		user_id: userId,
		content: text
	};
	let result = await liveSocialTable(client, "comments").insert(parentCommentId ? {
		...basePayload,
		parent_comment_id: parentCommentId
	} : basePayload).select("id,created_at").maybeSingle();
	if (result.error && parentCommentId && missingColumn(result.error)) result = await liveSocialTable(client, "comments").insert(basePayload).select("id,created_at").maybeSingle();
	return {
		data: result.data,
		error: result.error
	};
}
async function deletePostComment(id, client = supabase) {
	return { error: (await liveSocialTable(client, "comments").delete().eq("id", id)).error };
}
/** Real comments for a post or reel: live fetch, optimistic post, realtime sync. */
function usePostComments(postId) {
	const [comments, setComments] = (0, import_react.useState)([]);
	const [me, setMe] = (0, import_react.useState)(null);
	const [postOwnerId, setPostOwnerId] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const load = (0, import_react.useCallback)(async () => {
		if (!postId) {
			setComments([]);
			setLoading(false);
			return;
		}
		const { data: sessionData } = await supabase.auth.getSession();
		const uid = sessionData.session?.user.id ?? null;
		setMe(uid);
		const { data: postRow } = await supabase.from("posts").select("user_id").eq("id", postId).maybeSingle();
		setPostOwnerId(postRow?.user_id ?? null);
		let { data: rows, error: commentsError } = await liveSocialTable(supabase, "comments").select("id,post_id,user_id,content,created_at,parent_comment_id,likes_count").eq("post_id", postId).order("created_at", { ascending: true });
		if (missingColumn(commentsError)) {
			const fallback = await liveSocialTable(supabase, "comments").select("id,post_id,user_id,content,created_at").eq("post_id", postId).order("created_at", { ascending: true });
			rows = fallback.data;
			commentsError = fallback.error;
		}
		if (commentsError) {
			console.error("[usePostComments] unable to load comments", commentsError);
			setComments([]);
			setLoading(false);
			return;
		}
		const commentRows = rows ?? [];
		if (!commentRows.length) {
			setComments([]);
			setLoading(false);
			return;
		}
		const authorIds = [...new Set(commentRows.map((row) => row.user_id))];
		const [{ data: profiles }, likesResult] = await Promise.all([supabase.rpc("get_public_profiles", { ids: authorIds }), liveCommentLikesTable(supabase).select("comment_id,user_id").in("comment_id", commentRows.map((row) => row.id))]);
		const likeRows = likesResult.data ?? [];
		if (likesResult.error) console.error("[usePostComments] unable to load comment likes", likesResult.error);
		const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
		const mapped = commentRows.map((r) => {
			const p = profileById.get(r.user_id);
			return {
				id: r.id,
				userId: r.user_id,
				username: p?.username ?? `user${r.user_id.slice(0, 4)}`,
				displayName: p?.display_name ?? p?.username ?? "YourWorld user",
				avatarUrl: p?.avatar_url ?? null,
				body: r.content,
				createdAt: r.created_at,
				pinned: false,
				pinnedAt: null,
				parentCommentId: r.parent_comment_id ?? null,
				likesCount: likeRows.filter((like) => like.comment_id === r.id).length || Number(r.likes_count ?? 0),
				likedByMe: !!uid && likeRows.some((like) => like.comment_id === r.id && like.user_id === uid)
			};
		});
		mapped.sort((a, b) => {
			if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
			if (a.pinned && b.pinned) return (a.pinnedAt ?? "").localeCompare(b.pinnedAt ?? "");
			return a.createdAt.localeCompare(b.createdAt);
		});
		setComments(mapped);
		setLoading(false);
	}, [postId]);
	(0, import_react.useEffect)(() => {
		load();
		if (!postId) return;
		const topic = `post-comments-${postId}-${Math.random().toString(36).slice(2)}`;
		let channel = null;
		try {
			channel = supabase.channel(topic).on("postgres_changes", {
				event: "*",
				schema: "public",
				table: "comments",
				filter: `post_id=eq.${postId}`
			}, () => void load()).on("postgres_changes", {
				event: "*",
				schema: "public",
				table: "comment_likes"
			}, () => void load()).subscribe();
		} catch (err) {
			console.error("[usePostComments] realtime unavailable", err);
		}
		return () => {
			const ch = channel;
			channel = null;
			if (ch) setTimeout(() => void supabase.removeChannel(ch), 0);
		};
	}, [postId, load]);
	const sendReply = (0, import_react.useCallback)(async (body, parentCommentId = null) => {
		if (!postId || !me || !body.trim()) return false;
		const text = body.trim();
		const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
		setComments((prev) => [...prev, {
			id: tempId,
			userId: me,
			username: "you",
			displayName: "You",
			avatarUrl: null,
			body: text,
			createdAt: (/* @__PURE__ */ new Date()).toISOString(),
			pinned: false,
			pinnedAt: null,
			parentCommentId,
			likesCount: 0,
			likedByMe: false
		}]);
		const { error } = await createPostComment(postId, me, text, supabase, parentCommentId);
		if (error) {
			setComments((prev) => prev.filter((c) => c.id !== tempId));
			return false;
		}
		load();
		return true;
	}, [
		postId,
		me,
		load
	]);
	const send = (0, import_react.useCallback)(async (body) => sendReply(body), [sendReply]);
	const toggleLike = (0, import_react.useCallback)(async (id) => {
		if (!me) return false;
		const target = comments.find((comment) => comment.id === id);
		if (!target || id.startsWith("tmp-")) return false;
		const wasLiked = target.likedByMe;
		setComments((prev) => prev.map((comment) => comment.id === id ? {
			...comment,
			likedByMe: !wasLiked,
			likesCount: Math.max(0, comment.likesCount + (wasLiked ? -1 : 1))
		} : comment));
		if ((wasLiked ? await liveCommentLikesTable(supabase).delete().eq("comment_id", id).eq("user_id", me) : await liveCommentLikesTable(supabase).upsert({
			comment_id: id,
			user_id: me
		}, {
			onConflict: "comment_id,user_id",
			ignoreDuplicates: true
		})).error) {
			setComments((prev) => prev.map((comment) => comment.id === id ? {
				...comment,
				likedByMe: wasLiked,
				likesCount: Math.max(0, comment.likesCount + (wasLiked ? 1 : -1))
			} : comment));
			return false;
		}
		return true;
	}, [comments, me]);
	const isPostOwner = !!me && !!postOwnerId && me === postOwnerId;
	const pinnedCount = comments.filter((c) => c.pinned).length;
	return {
		comments,
		loading,
		send,
		sendReply,
		toggleLike,
		remove: (0, import_react.useCallback)(async (id) => {
			const snapshot = comments;
			setComments((prev) => prev.filter((c) => c.id !== id));
			const { error } = await deletePostComment(id);
			if (error) setComments(snapshot);
			return !error;
		}, [comments]),
		togglePin: (0, import_react.useCallback)(async (id) => {
			if (!comments.find((c) => c.id === id) || !isPostOwner) return false;
			return false;
		}, [comments, isPostOwner]),
		me,
		postOwnerId,
		isPostOwner,
		pinnedCount
	};
}
var momentDb = supabase;
var MOMENT_WITH_PROFILE_SELECT = "*, profiles:user_id (id, full_name, display_name, username, avatar_url, profile_pic, profile_image)";
function profileFromMomentRow(row) {
	const nested = row.profiles ?? row.user;
	return (Array.isArray(nested) ? nested[0] : nested) ?? (row.avatar_url || row.profile_pic || row.profile_image ? {
		id: row.user_id,
		avatar_url: row.avatar_url,
		profile_pic: row.profile_pic,
		profile_image: row.profile_image
	} : null);
}
function hasProfileJoinError(error) {
	const message = error && typeof error === "object" ? String(error.message ?? "") : String(error ?? "");
	return /relationship|schema cache|profiles:user_id|column .*does not exist|could not find the .*column/i.test(message);
}
function postRowToMoment(row) {
	const createdAt = typeof row.created_at === "string" ? row.created_at : (/* @__PURE__ */ new Date()).toISOString();
	const durationHours = 24;
	return {
		id: String(row.id),
		user_id: String(row.user_id),
		kind: String(row.media_type ?? "photo").startsWith("video") ? "video" : "photo",
		media_url: typeof row.media_url === "string" ? row.media_url : null,
		media_type: typeof row.media_type === "string" ? row.media_type : null,
		text: typeof row.caption === "string" ? row.caption : "",
		text_bg: "",
		payload: null,
		privacy: typeof row.audience === "string" ? row.audience : "everyone",
		duration: durationHours,
		allow_download: row.allow_download !== false,
		screenshot_alert: false,
		poll: null,
		archived: row.archived === true,
		created_at: createdAt,
		expires_at: new Date(new Date(createdAt).getTime() + durationHours * 36e5).toISOString()
	};
}
function rowToMoment(row, views, replies, author, uid) {
	const p = row.payload ?? {};
	const audioStart = row.audio_start_time !== null && row.audio_start_time !== void 0 ? Number(row.audio_start_time) : Number(p.musicStart);
	const audioVolume = row.volume !== null && row.volume !== void 0 ? Number(row.volume) : Number(p.musicVolume);
	const createdAt = Date.parse(row.created_at);
	const createdAtMs = Number.isFinite(createdAt) ? createdAt : Date.now();
	const expiresAt = row.expires_at ? Date.parse(row.expires_at) : NaN;
	const kind = row.kind === "video" || row.kind === "text" || row.kind === "photo" ? row.kind : "photo";
	const privacy = row.privacy === "followers" || row.privacy === "close" || row.privacy === "onlyme" || row.privacy === "everyone" ? row.privacy : "everyone";
	return {
		id: row.id,
		kind,
		media: typeof row.media_url === "string" ? row.media_url : "",
		mediaType: typeof row.media_type === "string" ? row.media_type : void 0,
		text: row.text ?? "",
		textBg: row.text_bg ?? "",
		music: typeof p.music === "string" ? p.music : void 0,
		musicTitle: typeof row.music_title === "string" ? row.music_title : typeof p.musicTitle === "string" ? p.musicTitle : void 0,
		musicArtist: typeof row.music_artist === "string" ? row.music_artist : typeof p.musicArtist === "string" ? p.musicArtist : void 0,
		musicUrl: typeof row.audio_url === "string" ? row.audio_url : typeof p.musicUrl === "string" ? p.musicUrl : void 0,
		musicStart: Number.isFinite(audioStart) ? audioStart : void 0,
		audioStartTime: Number.isFinite(audioStart) ? audioStart : void 0,
		musicEnd: typeof p.musicEnd === "number" ? p.musicEnd : void 0,
		musicVolume: Number.isFinite(audioVolume) ? audioVolume : void 0,
		stickers: Array.isArray(p.stickers) ? p.stickers : [],
		drawing: typeof p.drawing === "string" ? p.drawing : void 0,
		trim: p.trim,
		crop: p.crop,
		location: typeof p.location === "string" ? p.location : void 0,
		mentions: Array.isArray(p.mentions) ? p.mentions.filter((mention) => typeof mention === "string") : [],
		privacy,
		duration: 24,
		effect: p.effect === "boomerang" || p.effect === "slowmo" || p.effect === "reverse" || p.effect === "greenscreen" ? p.effect : "none",
		ai: p.ai && typeof p.ai === "object" ? p.ai : {},
		allowDownload: row.allow_download !== false,
		screenshotAlert: row.screenshot_alert === true,
		allowReactions: p.allowReactions !== false,
		allowReplies: p.allowReplies !== false,
		allowSharing: p.allowSharing !== false,
		showLocation: p.showLocation !== false,
		saveToArchive: p.saveToArchive !== false,
		poll: row.poll ?? null,
		createdAt: createdAtMs,
		expiresAt: Number.isFinite(expiresAt) ? expiresAt : createdAtMs + 864e5,
		archived: row.archived === true,
		viewers: views,
		replies,
		author,
		mine: !!uid && row.user_id === uid
	};
}
function payloadOf(m) {
	return {
		music: m.music ?? null,
		musicTitle: m.musicTitle ?? null,
		musicArtist: m.musicArtist ?? null,
		musicUrl: m.musicUrl ?? null,
		musicStart: m.musicStart ?? m.audioStartTime ?? null,
		musicEnd: m.musicEnd ?? null,
		musicVolume: m.musicVolume ?? null,
		stickers: m.stickers ?? [],
		drawing: m.drawing ?? null,
		trim: m.trim ?? null,
		crop: m.crop ?? null,
		location: m.location ?? null,
		mentions: m.mentions ?? [],
		effect: m.effect ?? "none",
		ai: m.ai ?? {},
		allowReactions: m.allowReactions ?? true,
		allowReplies: m.allowReplies ?? true,
		allowSharing: m.allowSharing ?? true,
		showLocation: m.showLocation ?? true,
		saveToArchive: m.saveToArchive ?? true
	};
}
/** Uploads a blob/data url to the private moments bucket; returns the storage path. */
async function uploadMomentMedia(uid, src, mediaType, prefix = "media", onProgress) {
	if (!src || !src.startsWith("blob:") && !src.startsWith("data:")) return src;
	let blob = getRegisteredBlob(src);
	if (!blob) {
		const res = await fetch(src);
		if (!res.ok) throw new Error("Media is no longer available on this device");
		blob = await res.blob();
	}
	const hinted = mediaType && mediaType.includes("/") ? mediaType : "";
	const type = blob.type || hinted || (mediaType === "video" ? "video/mp4" : mediaType === "audio" ? "audio/mpeg" : "image/jpeg");
	const uploadBlob = type.startsWith("video/") ? await optimizeVideoBlob(blob, (percent, detail) => onProgress?.(percent, detail)) : blob;
	const uploadType = uploadBlob.type || type;
	const ext = uploadType.includes("audio") ? type.includes("wav") ? "wav" : type.includes("mp4") || type.includes("m4a") ? "m4a" : "mp3" : uploadType.includes("video") ? uploadType.includes("webm") ? "webm" : "mp4" : uploadType.includes("png") ? "png" : "jpg";
	const path = `${uid}/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
	const { url, error } = await uploadWithProgress(STORAGE_BUCKETS.moments, path, uploadBlob, uploadType, (percent) => onProgress?.(type.startsWith("video/") ? 45 + Math.round(percent * .55) : percent));
	if (error && !url) throw new Error(error);
	return path;
}
/** Signs media and music paths so any allowed viewer can play the moment. */
async function signMomentMedia(list) {
	const values = list.flatMap((m) => [m.media, m.musicUrl]).filter((value) => !!value && !/^(data:|blob:)/.test(value));
	const valueToPath = new Map(values.flatMap((value) => {
		const path = storagePathFromMomentValue(value);
		return path ? [[value, path]] : [];
	}));
	const paths = [...new Set(valueToPath.values())];
	if (!paths.length) return list;
	const { data, error } = await supabase.storage.from(STORAGE_BUCKETS.moments).createSignedUrls(paths, 21600);
	if (error) return list.map((moment) => ({
		...moment,
		media: moment.media && valueToPath.has(moment.media) ? "" : moment.media,
		musicUrl: moment.musicUrl && valueToPath.has(moment.musicUrl) ? void 0 : moment.musicUrl
	}));
	const byPath = new Map((data ?? []).filter((d) => d.signedUrl && d.path).map((d) => [d.path, d.signedUrl]));
	return list.map((m) => {
		const mediaPath = m.media ? valueToPath.get(m.media) : void 0;
		const musicPath = m.musicUrl ? valueToPath.get(m.musicUrl) : void 0;
		return {
			...m,
			media: (mediaPath && byPath.get(mediaPath)) ?? m.media,
			musicUrl: m.musicUrl ? (musicPath && byPath.get(musicPath)) ?? m.musicUrl : void 0
		};
	});
}
function storagePathFromMomentValue(value) {
	if (typeof value !== "string" || !value || /^(blob:|data:)/.test(value)) return null;
	if (!/^https?:\/\//.test(value)) return value;
	try {
		const pathname = decodeURIComponent(new URL(value).pathname);
		const markerIndex = pathname.indexOf("/storage/v1/object/");
		if (markerIndex < 0) return null;
		const segments = pathname.slice(markerIndex + 19).split("/");
		const bucketIndex = segments.indexOf(STORAGE_BUCKETS.moments);
		return bucketIndex >= 0 ? segments.slice(bucketIndex + 1).join("/") || null : null;
	} catch {
		return null;
	}
}
async function deleteMomentRows(table, filters) {
	try {
		let query = momentDb.from(table).delete();
		for (const [column, value] of filters) query = query.eq(column, value);
		const result = await query;
		if (!result.error || missingTable(result.error, table)) return null;
		return result.error.message ?? `Couldn't remove ${table}`;
	} catch (cause) {
		return cause instanceof Error ? cause.message : `Couldn't remove ${table}`;
	}
}
function MomentProvider({ children }) {
	const [moments, setMoments] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [now, setNow] = (0, import_react.useState)(() => Date.now());
	const uidRef = (0, import_react.useRef)(null);
	const archivingRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const expiredArchiveCheckedRef = (0, import_react.useRef)(false);
	const deletedMomentIdsRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const loadInFlightRef = (0, import_react.useRef)(false);
	const reloadAfterLoadRef = (0, import_react.useRef)(false);
	const load = (0, import_react.useCallback)(async () => {
		if (loadInFlightRef.current) {
			reloadAfterLoadRef.current = true;
			return;
		}
		loadInFlightRef.current = true;
		try {
			const { data: auth, error: authError } = await supabase.auth.getUser();
			if (authError) {
				if (isAuthSessionMissing(authError)) {
					uidRef.current = null;
					setMoments([]);
					setLoading(false);
					return;
				}
				uidRef.current = null;
				setMoments([]);
				setLoading(false);
				return;
			}
			const uid = auth.user?.id ?? null;
			uidRef.current = uid;
			if (!uid) {
				setMoments([]);
				setLoading(false);
				return;
			}
			let momentsResult = await supabase.from("moments").select(MOMENT_WITH_PROFILE_SELECT).or(`expires_at.is.null,expires_at.gt.${(/* @__PURE__ */ new Date()).toISOString()},user_id.eq.${uid}`).order("created_at", { ascending: false }).limit(200);
			if (momentsResult.error && hasProfileJoinError(momentsResult.error)) momentsResult = await supabase.from("moments").select("*").or(`expires_at.is.null,expires_at.gt.${(/* @__PURE__ */ new Date()).toISOString()},user_id.eq.${uid}`).order("created_at", { ascending: false }).limit(200);
			let rows = momentsResult.data;
			let momentsError = momentsResult.error;
			let usesPostsFallback = false;
			if (missingTable(momentsError, "moments")) {
				let postsResult = await supabase.from("posts").select(MOMENT_WITH_PROFILE_SELECT).or(`expires_at.is.null,expires_at.gt.${(/* @__PURE__ */ new Date()).toISOString()},user_id.eq.${uid}`).order("created_at", { ascending: false }).limit(200);
				if (postsResult.error && hasProfileJoinError(postsResult.error)) postsResult = await supabase.from("posts").select("*").or(`expires_at.is.null,expires_at.gt.${(/* @__PURE__ */ new Date()).toISOString()},user_id.eq.${uid}`).order("created_at", { ascending: false }).limit(200);
				rows = (postsResult.data ?? []).filter((row) => row.kind === "moment");
				momentsError = postsResult.error;
				usesPostsFallback = true;
			}
			if (momentsError) {
				setMoments([]);
				setLoading(false);
				return;
			}
			const list = usesPostsFallback ? (rows ?? []).map((row) => postRowToMoment(row)) : rows ?? [];
			if (!list.length) {
				setMoments([]);
				setLoading(false);
				return;
			}
			const ids = list.map((r) => r.id);
			const authorIds = [...new Set(list.map((r) => r.user_id))];
			const [viewsResult, repliesResult, likesResult, profilesResult, uniqueViewsResult] = await Promise.all([
				usesPostsFallback ? Promise.resolve({
					data: [],
					error: null
				}) : supabase.from("moment_views").select("*").in("moment_id", ids),
				usesPostsFallback ? Promise.resolve({
					data: [],
					error: null
				}) : supabase.from("moment_replies").select("*").in("moment_id", ids),
				momentDb.from("moment_likes").select("moment_id,user_id,created_at").in("moment_id", ids),
				supabase.rpc("get_public_profiles", { ids: authorIds }),
				momentDb.from("unique_views").select("user_id,content_id,content_type,viewed_at").in("content_id", ids).eq("content_type", "moment")
			]);
			let likes = likesResult.data ?? [];
			const likesError = likesResult.error;
			if (missingTable(likesError, "moment_likes")) likes = ((await momentDb.from("likes").select("post_id,user_id,created_at").in("post_id", ids)).data ?? []).map((like) => ({
				moment_id: like.post_id,
				user_id: like.user_id,
				created_at: like.created_at
			}));
			const views = viewsResult.data ?? [];
			const replies = repliesResult.data ?? [];
			const profiles = profilesResult.data ?? [];
			const uniqueViews = missingTable(uniqueViewsResult.error, "unique_views") ? [] : uniqueViewsResult.data ?? [];
			const profileById = new Map(profiles.map((p) => [p.id, {
				id: p.id,
				username: p.username ?? "user",
				name: p.display_name ?? p.full_name ?? p.username ?? "User",
				avatar: p.avatar_url || p.profile_pic || p.profile_image || null
			}]));
			const mapped = list.map((row) => rowToMoment(row, [
				...views.filter((view) => view.moment_id === row.id),
				...uniqueViews.filter((view) => view.content_id === row.id && view.content_type === "moment").map((view) => ({
					moment_id: row.id,
					viewer_id: view.user_id,
					liked: false,
					screenshot: false,
					created_at: view.viewed_at
				})),
				...likes.filter((like) => like.moment_id === row.id).map((like) => ({
					moment_id: row.id,
					viewer_id: like.user_id,
					liked: true,
					screenshot: false,
					created_at: like.created_at
				}))
			].reduce((all, v) => {
				const existing = all.find((viewer) => viewer.userId === v.viewer_id);
				if (existing) {
					existing.liked = existing.liked || v.liked;
					existing.screenshot = existing.screenshot || v.screenshot;
				} else all.push({
					userId: v.viewer_id,
					at: new Date(v.created_at).getTime(),
					liked: v.liked,
					screenshot: v.screenshot
				});
				return all;
			}, []), replies.filter((reply) => reply.moment_id === row.id).map((reply) => ({
				id: reply.id,
				userId: reply.user_id,
				text: reply.text,
				at: new Date(reply.created_at).getTime()
			})), (() => {
				const embedded = profileFromMomentRow(row);
				const rpcProfile = profileById.get(row.user_id);
				if (!embedded && !rpcProfile) return void 0;
				return {
					id: row.user_id,
					username: embedded?.username ?? rpcProfile?.username ?? "user",
					name: embedded?.display_name ?? embedded?.full_name ?? rpcProfile?.name ?? embedded?.username ?? "User",
					avatar: embedded?.avatar_url?.trim() || embedded?.profile_pic?.trim() || embedded?.profile_image?.trim() || rpcProfile?.avatar || null
				};
			})(), uid));
			const signedMoments = await signMomentMedia((await Promise.all(mapped.map(async (moment) => {
				const author = moment.author;
				const avatar = author?.avatar;
				if (!avatar) return moment;
				return {
					...moment,
					author: {
						...author,
						avatar: await resolveMediaUrl(avatar, "avatars")
					}
				};
			}))).filter((moment) => !deletedMomentIdsRef.current.has(moment.id)));
			setMoments(signedMoments.filter((moment) => !deletedMomentIdsRef.current.has(moment.id)));
			setLoading(false);
		} catch {
			setLoading(false);
		} finally {
			loadInFlightRef.current = false;
			if (reloadAfterLoadRef.current) {
				reloadAfterLoadRef.current = false;
				load();
			}
		}
	}, []);
	(0, import_react.useEffect)(() => {
		load();
		let reloadTimer;
		const queueReload = () => {
			window.clearTimeout(reloadTimer);
			reloadTimer = window.setTimeout(() => void load(), 300);
		};
		const channel = supabase.channel("moments-live").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "moments"
		}, queueReload).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "moment_views"
		}, queueReload).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "moment_replies"
		}, queueReload).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "moment_likes"
		}, queueReload).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "unique_views"
		}, queueReload).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "posts"
		}, queueReload).subscribe();
		const { data: sub } = supabase.auth.onAuthStateChange(() => void load());
		return () => {
			window.clearTimeout(reloadTimer);
			supabase.removeChannel(channel);
			sub.subscription.unsubscribe();
		};
	}, [load]);
	(0, import_react.useEffect)(() => {
		const t = setInterval(() => setNow(Date.now()), 3e4);
		return () => clearInterval(t);
	}, []);
	(0, import_react.useEffect)(() => {
		if (expiredArchiveCheckedRef.current || !moments.length) return;
		expiredArchiveCheckedRef.current = true;
		const currentTime = Date.now();
		const expiredMine = moments.filter((m) => m.mine && !m.archived && m.expiresAt && m.expiresAt <= currentTime && !m.id.startsWith("pending-") && !archivingRef.current.has(m.id));
		if (!expiredMine.length) return;
		const ids = expiredMine.map((m) => m.id);
		ids.forEach((id) => archivingRef.current.add(id));
		setMoments((current) => current.map((moment) => ids.includes(moment.id) ? {
			...moment,
			archived: true
		} : moment));
		(async () => {
			try {
				await supabase.from("moments").update({ archived: true }).in("id", ids).lte("expires_at", new Date(currentTime).toISOString());
			} catch {} finally {
				ids.forEach((id) => archivingRef.current.delete(id));
			}
		})();
	}, [moments]);
	const patch = (0, import_react.useCallback)((id, fn) => setMoments((p) => p.map((m) => m.id === id ? fn(m) : m)), []);
	const value = (0, import_react.useMemo)(() => ({
		moments: moments.filter((m) => !m.archived && !(m.expiresAt && m.expiresAt <= now)),
		archive: moments.filter((m) => m.archived || (m.expiresAt ? m.expiresAt <= now : false)),
		loading,
		addMoment: (m) => {
			const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
			const optimistic = {
				...m,
				id: tempId,
				createdAt: Date.now(),
				archived: false,
				viewers: [],
				replies: [],
				mine: true
			};
			setMoments((p) => [optimistic, ...p]);
			return (async () => {
				const uid = uidRef.current ?? (await supabase.auth.getUser()).data.user?.id ?? null;
				if (!uid) {
					toast.error("Sign in to publish a moment");
					setMoments((p) => p.filter((x) => x.id !== tempId));
					return { error: "Sign in to publish a moment" };
				}
				let media = "";
				let musicUrl = m.musicUrl;
				const uploadsLocalMusic = !!musicUrl && (musicUrl.startsWith("blob:") || musicUrl.startsWith("data:"));
				if (m.media) try {
					media = await uploadMomentMedia(uid, m.media, m.mediaType, "media", uploadsLocalMusic && m.onUploadProgress ? (percent) => m.onUploadProgress?.(Math.round(percent * .8)) : m.onUploadProgress);
				} catch (e) {
					console.error("Moment media upload failed", e);
					toast.error(e instanceof Error ? e.message : "Couldn't upload this moment's media");
					setMoments((p) => p.filter((x) => x.id !== tempId));
					return { error: e instanceof Error ? e.message : "Couldn't upload this moment's media" };
				}
				if (uploadsLocalMusic && musicUrl) {
					const localMusic = musicUrl;
					try {
						musicUrl = await uploadMomentMedia(uid, localMusic, "audio", "music", m.onUploadProgress ? (percent) => m.onUploadProgress?.(Math.round(80 + percent * .2)) : void 0);
					} catch (e) {
						console.error("Moment music upload failed", e);
						toast.error(e instanceof Error ? e.message : "Couldn't upload the moment song");
						musicUrl = void 0;
					}
				}
				if (musicUrl && /^(blob:|data:)/.test(musicUrl)) musicUrl = void 0;
				if (m.kind !== "text" && !media) {
					toast.error("Couldn't upload this moment's media");
					setMoments((p) => p.filter((x) => x.id !== tempId));
					return { error: "Couldn't upload this moment's media" };
				}
				const hours = 24;
				let error = null;
				try {
					const result = await writeCompat((payload) => supabase.from("moments").insert(payload), {
						user_id: uid,
						kind: m.kind,
						media_url: media || null,
						media_type: m.mediaType ?? null,
						text: m.text ?? "",
						text_bg: m.textBg ?? "",
						payload: payloadOf({
							...m,
							musicUrl
						}),
						audio_url: musicUrl ?? null,
						music_title: m.musicTitle ?? m.music ?? null,
						music_artist: m.musicArtist ?? null,
						audio_start_time: m.audioStartTime ?? m.musicStart ?? null,
						volume: m.musicVolume ?? null,
						privacy: m.privacy,
						duration: hours,
						allow_download: m.allowDownload,
						screenshot_alert: m.screenshotAlert,
						poll: m.poll,
						expires_at: new Date(Date.now() + hours * 36e5).toISOString()
					});
					if (missingTable(result.error, "moments")) {
						const fallback = await writeCompat((payload) => supabase.from("posts").insert(payload), {
							user_id: uid,
							kind: "moment",
							media_url: media || "",
							media_type: m.mediaType ?? (m.kind === "video" ? "video" : "image"),
							caption: m.text ?? "",
							audience: m.privacy,
							duration_seconds: hours,
							allow_download: m.allowDownload,
							audio: musicUrl ?? null,
							archived: false
						}, { kind: "type" });
						error = fallback.error ? { message: fallback.error.message ?? "Couldn't save this moment" } : null;
					} else error = result.error ? { message: result.error.message ?? "Couldn't save this moment" } : null;
				} catch (e) {
					console.error("Moment database insert threw unexpectedly", e);
					error = { message: e instanceof Error ? e.message : "Couldn't save this moment" };
				}
				setMoments((p) => p.filter((x) => x.id !== tempId));
				if (error) {
					console.error("Moment database insert failed", error);
					toast.error(error.message);
					return { error: error.message };
				}
				await load();
				return { error: null };
			})().catch((e) => {
				console.error("Moment publish failed unexpectedly", e);
				const message = e instanceof Error ? e.message : "Couldn't publish this moment";
				toast.error(message);
				setMoments((p) => p.filter((x) => x.id !== tempId));
				return { error: message };
			});
		},
		deleteMoment: async (id) => {
			deletedMomentIdsRef.current.add(id);
			setMoments((p) => p.filter((m) => m.id !== id));
			try {
				const { data: auth, error: authError } = await supabase.auth.getUser();
				const uid = auth.user?.id ?? null;
				if (authError || !uid) throw new Error("Sign in to delete this moment.");
				const momentResult = await momentDb.from("moments").select("*").eq("id", id);
				let row = momentResult.data?.[0] ?? null;
				let usesPostsFallback = false;
				if (missingTable(momentResult.error, "moments")) {
					const postsResult = await momentDb.from("posts").select("*").eq("id", id);
					if (postsResult.error) throw new Error(postsResult.error.message ?? "Couldn't find this moment.");
					row = postsResult.data?.[0] ?? null;
					usesPostsFallback = true;
				} else if (momentResult.error) throw new Error(momentResult.error.message ?? "Couldn't find this moment.");
				if (!row || String(row.user_id) !== uid) throw new Error("You can only delete your own moment.");
				if (usesPostsFallback && row.kind !== "moment" && row.type !== "moment") throw new Error("This moment is no longer available.");
				const payload = row.payload && typeof row.payload === "object" ? row.payload : {};
				const mediaPaths = [
					storagePathFromMomentValue(row.media_url),
					storagePathFromMomentValue(payload.musicUrl),
					storagePathFromMomentValue(row.audio)
				].filter((path) => !!path);
				const requiredChildError = (await Promise.all([deleteMomentRows("moment_replies", [["moment_id", id]]), deleteMomentRows("moment_views", [["moment_id", id]])])).find(Boolean);
				if (requiredChildError) throw new Error(requiredChildError);
				(await Promise.all([
					deleteMomentRows("moment_likes", [["moment_id", id]]),
					deleteMomentRows("unique_views", [["content_id", id], ["content_type", "moment"]]),
					deleteMomentRows("likes", [["post_id", id]]),
					deleteMomentRows("post_views", [["post_id", id]])
				])).filter(Boolean).forEach((message) => {
					console.warn("Moment interaction cleanup skipped", message);
				});
				const deleteResult = usesPostsFallback ? await momentDb.from("posts").delete().eq("id", id).eq("user_id", uid) : await momentDb.from("moments").delete().eq("id", id).eq("user_id", uid);
				if (deleteResult.error) throw new Error(deleteResult.error.message ?? "Couldn't delete this moment.");
				if (mediaPaths.length) {
					const { error: storageError } = await supabase.storage.from(STORAGE_BUCKETS.moments).remove([...new Set(mediaPaths)]);
					if (storageError) throw new Error(storageError.message ?? "Couldn't delete this moment's media.");
				}
				try {
					await load();
				} catch (refreshError) {
					console.error("Moment cache refresh failed after deletion", refreshError);
				}
				return { error: null };
			} catch (cause) {
				deletedMomentIdsRef.current.delete(id);
				console.error("Moment deletion failed", cause);
				try {
					await load();
				} catch (refreshError) {
					console.error("Moment cache refresh failed after deletion failure", refreshError);
				}
				return { error: cause instanceof Error ? cause.message : "Couldn't delete this moment." };
			}
		},
		archiveMoment: (id) => {
			patch(id, (m) => ({
				...m,
				archived: true
			}));
			supabase.from("moments").update({ archived: true }).eq("id", id).then(({ error }) => {
				if (!error) return;
				console.error("Moment archive failed", error);
				toast.error("Couldn't archive this moment.");
				patch(id, (m) => ({
					...m,
					archived: false
				}));
			});
		},
		restoreMoment: (id) => {
			patch(id, (m) => ({
				...m,
				archived: false
			}));
			supabase.from("moments").update({ archived: false }).eq("id", id).then(({ error }) => {
				if (!error) return;
				console.error("Moment restore failed", error);
				toast.error("Couldn't restore this moment.");
				patch(id, (m) => ({
					...m,
					archived: true
				}));
			});
		},
		addReply: async (id, text) => {
			const uid = uidRef.current;
			const body = text.trim();
			if (!uid || !body) return { error: "no-session" };
			const target = moments.find((m) => m.id === id);
			const ownerId = target?.author?.id;
			if (!ownerId || ownerId === uid) return { error: "invalid-target" };
			patch(id, (m) => ({
				...m,
				replies: [...m.replies, {
					id: `tmp-${Date.now()}`,
					userId: uid,
					text: body,
					at: Date.now()
				}]
			}));
			const replyResult = await momentDb.from("moment_replies").insert({
				moment_id: id,
				user_id: uid,
				text: body
			});
			if (replyResult.error && !missingTable(replyResult.error, "moment_replies")) {
				console.error("Moment reply failed", replyResult.error);
				toast.error("Couldn't send your reply.");
				load();
				return { error: replyResult.error.message ?? "Couldn't save the reply." };
			}
			const threadId = dmThreadId(uid, ownerId);
			const conversation = await ensureThreadConversation(threadId, [uid, ownerId]);
			if (!conversation) return { error: "Chat conversation could not be synchronized." };
			const autoDeleteMode = normalizeAutoDeleteSetting(conversation.auto_delete_setting);
			const messageResult = await writeCompat((payload) => momentDb.from("messages").insert(payload), {
				sender_id: uid,
				receiver_id: ownerId,
				content: body,
				media_url: target.media || null,
				moment_id: id,
				moment_media_url: target.media || null,
				moment_created_at: new Date(target.createdAt).toISOString(),
				conversation_id: conversation.id,
				is_system_message: false,
				auto_delete_setting: autoDeleteMode,
				auto_delete_mode: autoDeleteMode,
				is_deleted: false,
				metadata: {
					type: "moment_reply",
					moment_id: id,
					moment_media_url: target.media || null,
					moment_created_at: new Date(target.createdAt).toISOString(),
					thread_id: threadId,
					preview: {
						kind: target.kind,
						text: target.text,
						media_url: target.media || null,
						created_at: new Date(target.createdAt).toISOString()
					}
				}
			});
			if (messageResult.error) {
				console.error("Moment reply chat delivery failed", messageResult.error);
				toast.error(replyResult.error ? "Reply couldn't be delivered to chat." : "Reply saved, but chat delivery failed.");
				return { error: messageResult.error.message ?? "Chat delivery failed." };
			}
			return { error: null };
		},
		votePoll: (id, option) => {
			const target = moments.find((m) => m.id === id);
			if (!target?.poll || target.poll.myVote !== null) return;
			const votes = [...target.poll.votes];
			votes[option] += 1;
			const poll = {
				...target.poll,
				votes,
				myVote: option
			};
			patch(id, (m) => ({
				...m,
				poll
			}));
			if (target.mine) supabase.from("moments").update({ poll }).eq("id", id).then(({ error }) => {
				if (!error) return;
				console.error("Moment poll update failed", error);
				toast.error("Couldn't save your vote.");
				load();
			});
		},
		registerScreenshot: (id) => {
			const uid = uidRef.current;
			if (!uid) return;
			supabase.from("moment_views").upsert({
				moment_id: id,
				viewer_id: uid,
				screenshot: true
			}, { onConflict: "moment_id,viewer_id" }).then(({ error }) => {
				if (!error) return;
				console.error("Moment screenshot registration failed", error);
				toast.error("Couldn't record the screenshot alert.");
			});
		},
		registerView: (id, liked) => {
			const uid = uidRef.current;
			if (!uid || id.startsWith("pending-")) return;
			(async () => {
				if (liked !== void 0) {
					const likeResult = liked ? await momentDb.from("moment_likes").upsert({
						moment_id: id,
						user_id: uid
					}, { onConflict: "moment_id,user_id" }) : await momentDb.from("moment_likes").delete().eq("moment_id", id).eq("user_id", uid);
					if (!likeResult.error) return;
					if (!missingTable(likeResult.error, "moment_likes")) {
						console.error("Moment like update failed", likeResult.error);
						return;
					}
					if (liked) {
						const legacy = await momentDb.from("likes").upsert({
							post_id: id,
							user_id: uid
						}, { onConflict: "post_id,user_id" });
						if (!legacy.error) return;
						console.error("Legacy Moment like update failed", legacy.error);
						return;
					}
					const legacy = await momentDb.from("likes").delete().eq("post_id", id).eq("user_id", uid);
					if (legacy.error) console.error("Legacy Moment unlike failed", legacy.error);
					return;
				}
				try {
					if (!await registerUniqueView(id, "moment")) return;
					patch(id, (moment) => {
						if (moment.viewers.some((viewer) => viewer.userId === uid)) return moment;
						return {
							...moment,
							viewers: [...moment.viewers, {
								userId: uid,
								at: Date.now(),
								liked: false,
								screenshot: false
							}]
						};
					});
				} catch (error) {
					console.error("Moment view registration failed", error);
				}
			})();
		},
		reload: load
	}), [
		moments,
		loading,
		patch,
		load,
		now
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MomentContext.Provider, {
		value,
		children
	});
}
var AuthContext = (0, import_react.createContext)(null);
/** Routes reachable without a session. */
var PUBLIC_ROUTES = ["/auth", "/reset-password"];
function isPublicRoute(pathname) {
	return PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
function AuthProvider({ children }) {
	const [session, setSession] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
			setSession(next);
			setLoading(false);
		});
		supabase.auth.getSession().then(({ data }) => {
			setSession(data.session);
			setLoading(false);
		});
		return () => sub.subscription.unsubscribe();
	}, []);
	const value = (0, import_react.useMemo)(() => ({
		session,
		user: session?.user ?? null,
		loading,
		signOut: async () => {
			await supabase.auth.signOut();
		}
	}), [session, loading]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthContext.Provider, {
		value,
		children
	});
}
function useAuth() {
	const ctx = (0, import_react.useContext)(AuthContext);
	if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
	return ctx;
}
/** Blocks every non-public route until a session exists. */
function AuthGate({ children }) {
	const { session, loading } = useAuth();
	const navigate = useNavigate();
	const publicRoute = isPublicRoute(useRouterState({ select: (s) => s.location.pathname }));
	(0, import_react.useEffect)(() => {
		if (loading) return;
		if (!publicRoute && !session) navigate({
			to: "/auth",
			replace: true
		});
	}, [
		loading,
		navigate,
		publicRoute,
		session
	]);
	if (loading && !publicRoute) return null;
	if (!publicRoute && !session) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var STORAGE_KEY = "yw_search_history";
var MAX_HISTORY = 10;
function loadHistory() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}
function saveHistory(entries) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
	} catch {}
}
var SearchContext = (0, import_react.createContext)(null);
function SearchProvider({ children }) {
	const [history, setHistory] = (0, import_react.useState)(loadHistory);
	const push = (0, import_react.useCallback)((entry) => {
		setHistory((prev) => {
			const filtered = prev.filter((e) => !(e.kind === entry.kind && e.label === entry.label));
			const next = [{
				...entry,
				id: `${Date.now()}-${Math.random()}`
			}, ...filtered].slice(0, MAX_HISTORY);
			saveHistory(next);
			return next;
		});
	}, []);
	const remove = (0, import_react.useCallback)((id) => {
		setHistory((prev) => {
			const next = prev.filter((e) => e.id !== id);
			saveHistory(next);
			return next;
		});
	}, []);
	const clear = (0, import_react.useCallback)(() => {
		setHistory([]);
		saveHistory([]);
	}, []);
	const value = (0, import_react.useMemo)(() => ({
		history,
		push,
		remove,
		clear
	}), [
		history,
		push,
		remove,
		clear
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SearchContext.Provider, {
		value,
		children
	});
}
function useSearch() {
	const ctx = (0, import_react.useContext)(SearchContext);
	if (!ctx) throw new Error("useSearch must be used within SearchProvider");
	return ctx;
}
var CHANNEL_CATEGORIES = [
	"Entertainment",
	"Music",
	"Gaming",
	"Education",
	"Tech",
	"Sports",
	"Travel",
	"Food",
	"Fashion",
	"Business",
	"News",
	"Fitness"
];
var COUNTRIES = [
	"India",
	"United States",
	"United Kingdom",
	"Canada",
	"Australia",
	"Germany",
	"Japan",
	"Brazil",
	"Nigeria",
	"Singapore"
];
var emptyChannel = () => ({
	name: "",
	handle: "",
	category: CHANNEL_CATEGORIES[0],
	description: "",
	visibility: "public",
	country: "",
	logo: null,
	banner: null,
	createdAt: Date.now()
});
var KEY = "yw.channel.v1";
var ChannelContext = (0, import_react.createContext)(null);
function ChannelProvider({ children }) {
	const [state, setState] = (0, import_react.useState)({ channel: null });
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		try {
			const raw = window.localStorage.getItem(KEY);
			if (raw) setState(JSON.parse(raw));
		} catch {}
		setHydrated(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		try {
			window.localStorage.setItem(KEY, JSON.stringify(state));
		} catch {}
	}, [state, hydrated]);
	const saveChannel = (0, import_react.useCallback)((c) => setState({ channel: c }), []);
	const updateChannel = (0, import_react.useCallback)((patch) => setState((s) => s.channel ? { channel: {
		...s.channel,
		...patch
	} } : s), []);
	const value = (0, import_react.useMemo)(() => ({
		channel: state.channel,
		hasChannel: state.channel !== null,
		hydrated,
		saveChannel,
		updateChannel
	}), [
		state.channel,
		hydrated,
		saveChannel,
		updateChannel
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChannelContext.Provider, {
		value,
		children
	});
}
function useChannel() {
	const ctx = (0, import_react.useContext)(ChannelContext);
	if (!ctx) throw new Error("useChannel must be used inside ChannelProvider");
	return ctx;
}
var SERVICE_WORKER_URL = "/sw.js";
var BANNER_SHOWN_KEY = "yw-call-notification-banner-shown";
var registrationPromise = null;
function hasSeenCallNotificationBanner() {
	try {
		return window.localStorage.getItem(BANNER_SHOWN_KEY) === "1";
	} catch {
		return false;
	}
}
function markCallNotificationBannerSeen() {
	try {
		window.localStorage.setItem(BANNER_SHOWN_KEY, "1");
	} catch {}
}
function registerCallServiceWorker() {
	if (typeof window === "undefined" || !("serviceWorker" in navigator)) return Promise.resolve(null);
	registrationPromise ??= navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: "/" }).catch((error) => {
		console.error("[call-notifications] service worker registration failed", error);
		return null;
	});
	return registrationPromise;
}
/**
* Creates a Web Push subscription when the deployment supplies a public VAPID
* key. The worker still handles provider-delivered pushes without this optional
* client-side subscription path, and the key is never treated as a secret.
*/
async function enableCallNotifications() {
	if (typeof window === "undefined" || !("Notification" in window)) return {
		permission: "unsupported",
		subscription: null
	};
	const permission = await Notification.requestPermission();
	if (permission !== "granted") return {
		permission,
		subscription: null
	};
	const registration = await registerCallServiceWorker();
	if (!registration || !("pushManager" in registration)) return {
		permission,
		subscription: null
	};
	return {
		permission,
		subscription: null
	};
}
async function getExistingCallPushSubscription() {
	const registration = await registerCallServiceWorker();
	if (!registration || !("pushManager" in registration)) return null;
	try {
		return await registration.pushManager.getSubscription();
	} catch {
		return null;
	}
}
function serializeCallPushSubscription(subscription) {
	const json = subscription.toJSON();
	return {
		endpoint: subscription.endpoint,
		subscription: {
			endpoint: subscription.endpoint,
			expirationTime: json.expirationTime ?? null,
			keys: json.keys ?? {}
		}
	};
}
async function showIncomingCallNotification(details) {
	if (typeof window === "undefined" || !("Notification" in window)) return false;
	if (Notification.permission !== "granted") return false;
	const registration = await registerCallServiceWorker();
	if (!registration) return false;
	try {
		await registration.showNotification(`Incoming ${details.mode === "video" ? "video" : "audio"} call`, {
			body: `${details.peerName} is calling you on YourWorld`,
			icon: "/icon-512.png",
			badge: "/favicon.png",
			tag: `yw-call-${details.callId}`,
			renotify: true,
			requireInteraction: true,
			silent: false,
			vibrate: [
				200,
				100,
				200,
				100,
				400
			],
			sound: "default",
			actions: [{
				action: "accept",
				title: "Accept"
			}, {
				action: "decline",
				title: "Decline"
			}],
			data: details
		});
		return true;
	} catch (error) {
		console.error("[call-notifications] notification failed", error);
		return false;
	}
}
function readCallNotificationAction() {
	if (typeof window === "undefined") return null;
	const params = new URLSearchParams(window.location.search);
	const callId = params.get("callId");
	const action = params.get("callAction");
	const mode = params.get("callMode");
	const peerName = params.get("peerName");
	if (!callId || action !== "accept" && action !== "decline") return null;
	if (mode !== "audio" && mode !== "video") return null;
	if (!peerName) return null;
	window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash}`);
	return {
		callId,
		action,
		mode,
		peerName
	};
}
/**
* Production TURN credentials must be short-lived and injected by the
* deployment. The old public/demo relay credentials were intentionally
* removed; STUN remains a safe development fallback.
*/
var CALL_ICE_SERVERS = (() => {
	try {
		const parsed = null;
		return Array.isArray(parsed) ? parsed : null;
	} catch {
		return null;
	}
})() ?? [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }];
var CALL_AUDIO_CONSTRAINTS = {
	echoCancellation: true,
	noiseSuppression: true,
	autoGainControl: true,
	sampleRate: 48e3,
	sampleSize: 16,
	channelCount: 1
};
function callVideoProfile(quality = getAdaptivePerformanceSnapshot().networkQuality) {
	if (quality === "weak" || quality === "offline") return {
		width: 640,
		height: 480,
		frameRate: 15
	};
	if (quality === "normal") return {
		width: 960,
		height: 540,
		frameRate: 24
	};
	return {
		width: 1280,
		height: 720,
		frameRate: 30
	};
}
function callVideoConstraints(facingMode = "user") {
	const profile = callVideoProfile();
	return {
		width: {
			ideal: profile.width,
			max: profile.width
		},
		height: {
			ideal: profile.height,
			max: profile.height
		},
		frameRate: {
			ideal: profile.frameRate,
			max: profile.frameRate
		},
		facingMode
	};
}
function fallbackVideoConstraints(facingMode, width, height, frameRate) {
	return {
		width: {
			ideal: width,
			max: width
		},
		height: {
			ideal: height,
			max: height
		},
		frameRate: {
			ideal: frameRate,
			max: frameRate
		},
		facingMode
	};
}
async function getFirstAvailableMedia(attempts) {
	let lastError = null;
	for (const constraints of attempts) try {
		return await navigator.mediaDevices.getUserMedia(constraints);
	} catch (error) {
		lastError = error;
	}
	throw lastError ?? /* @__PURE__ */ new Error("Unable to access camera and microphone");
}
/**
* Try the requested HD profile first, then relax only unsupported hardware
* constraints so calls still work on older phones and browsers.
*/
async function getCallMedia(mode, facingMode = "user") {
	const profile = callVideoProfile();
	return getFirstAvailableMedia(mode === "video" ? [
		{
			audio: CALL_AUDIO_CONSTRAINTS,
			video: callVideoConstraints(facingMode)
		},
		{
			audio: CALL_AUDIO_CONSTRAINTS,
			video: fallbackVideoConstraints(facingMode, profile.width, profile.height, profile.frameRate)
		},
		{
			audio: {
				echoCancellation: true,
				noiseSuppression: true,
				autoGainControl: true
			},
			video: fallbackVideoConstraints(facingMode, profile.width, profile.height, profile.frameRate)
		}
	] : [{
		audio: CALL_AUDIO_CONSTRAINTS,
		video: false
	}, {
		audio: {
			echoCancellation: true,
			noiseSuppression: true,
			autoGainControl: true
		},
		video: false
	}]);
}
/**
* Camera replacement must not request another microphone stream. Keep the
* existing audio sender and only reopen the selected camera at the same HD
* profile used when the call started.
*/
function getCallVideo(facingMode = "user") {
	const profile = callVideoProfile();
	return getFirstAvailableMedia([
		{
			audio: false,
			video: callVideoConstraints(facingMode)
		},
		{
			audio: false,
			video: fallbackVideoConstraints(facingMode, profile.width, profile.height, profile.frameRate)
		},
		{
			audio: false,
			video: fallbackVideoConstraints(facingMode, profile.width, profile.height, profile.frameRate)
		}
	]);
}
/**
* Keep one full-resolution video layer with a predictable 1.5 Mbps ceiling.
* The fallback removes networkPriority for browsers that reject that optional
* encoding field while preserving the bitrate and priority settings.
*/
async function tuneCallVideoSender(sender) {
	if (sender.track?.kind !== "video") return;
	const performance = getAdaptivePerformanceSnapshot();
	const current = sender.getParameters();
	const tuned = (current.encodings?.length ? current.encodings : [{}]).map((encoding) => ({
		...encoding,
		maxBitrate: performance.videoBitrate,
		maxFramerate: performance.videoFrameRate,
		priority: "high",
		networkPriority: "high",
		scaleResolutionDownBy: performance.videoScaleResolutionDownBy
	}));
	try {
		current.encodings = tuned;
		current.degradationPreference = performance.networkQuality === "fast" ? "maintain-framerate" : "balanced";
		await sender.setParameters(current);
	} catch {
		const fallback = sender.getParameters();
		fallback.encodings = tuned.map(({ networkPriority: _networkPriority, ...encoding }) => encoding);
		fallback.degradationPreference = performance.networkQuality === "fast" ? "maintain-framerate" : "balanced";
		try {
			await sender.setParameters(fallback);
		} catch {}
	}
}
async function prioritizeCallAudioSender(sender) {
	if (sender.track?.kind !== "audio") return;
	const current = sender.getParameters();
	const tuned = (current.encodings?.length ? current.encodings : [{}]).map((encoding) => ({
		...encoding,
		priority: "high",
		networkPriority: "high"
	}));
	try {
		current.encodings = tuned;
		await sender.setParameters(current);
	} catch {
		const fallback = sender.getParameters();
		fallback.encodings = tuned.map(({ networkPriority: _networkPriority, ...encoding }) => encoding);
		try {
			await sender.setParameters(fallback);
		} catch {}
	}
}
var CALL_VIDEO_EFFECTS = [
	{
		value: "none",
		label: "None"
	},
	{
		value: "beauty",
		label: "Beauty"
	},
	{
		value: "vivid",
		label: "Vivid"
	},
	{
		value: "mono",
		label: "Mono"
	}
];
/**
* Produces a processed video track for the peer connection, rather than only
* styling the local preview. Canvas capture is intentionally progressive:
* browsers without captureStream continue to use the unprocessed camera track.
*/
async function createCallVideoEffect(source, effect) {
	if (typeof document === "undefined" || typeof HTMLCanvasElement === "undefined") return null;
	const canvas = document.createElement("canvas");
	const video = document.createElement("video");
	video.srcObject = new MediaStream([source]);
	video.muted = true;
	video.playsInline = true;
	video.setAttribute("aria-hidden", "true");
	video.style.position = "fixed";
	video.style.left = "-10000px";
	video.style.width = "1px";
	video.style.height = "1px";
	document.body.appendChild(video);
	try {
		await video.play();
	} catch {
		video.remove();
		return null;
	}
	const width = Math.max(320, video.videoWidth || 1280);
	const height = Math.max(240, video.videoHeight || 720);
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d");
	const captureStream = canvas.captureStream?.(30);
	if (!context || !captureStream) {
		video.pause();
		video.srcObject = null;
		video.remove();
		return null;
	}
	const filters = {
		beauty: "blur(0.65px) saturate(1.08) brightness(1.04)",
		vivid: "saturate(1.28) contrast(1.08) brightness(1.02)",
		mono: "grayscale(1) contrast(1.08)"
	};
	let stopped = false;
	let frameHandle = null;
	let intervalHandle = null;
	const draw = () => {
		if (stopped) return;
		context.filter = filters[effect];
		context.drawImage(video, 0, 0, width, height);
		context.filter = "none";
		if (video.requestVideoFrameCallback) frameHandle = video.requestVideoFrameCallback(draw);
	};
	if (video.requestVideoFrameCallback) frameHandle = video.requestVideoFrameCallback(draw);
	else intervalHandle = window.setInterval(draw, 33);
	const track = captureStream.getVideoTracks()[0];
	if (!track) {
		video.pause();
		video.srcObject = null;
		video.remove();
		return null;
	}
	track.contentHint = "motion";
	return {
		track,
		stop: () => {
			stopped = true;
			if (intervalHandle !== null) window.clearInterval(intervalHandle);
			if (frameHandle !== null && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(frameHandle);
			track.stop();
			captureStream.getTracks().forEach((item) => item.stop());
			video.pause();
			video.srcObject = null;
			video.remove();
		}
	};
}
/**
* The deployed calls/user_blocks schema is newer than generated Supabase types.
* Keep that compatibility boundary local rather than modifying generated code.
*/
var callDb = supabase;
function asSessionDescription(value) {
	if (!value || typeof value !== "object") return null;
	const description = value;
	if (description.type !== "offer" && description.type !== "answer" && description.type !== "pranswer" && description.type !== "rollback" || description.sdp !== void 0 && typeof description.sdp !== "string") return null;
	return {
		type: description.type,
		sdp: description.sdp
	};
}
function asIceCandidate(value) {
	if (!value || typeof value !== "object") return null;
	const candidate = value;
	if (typeof candidate.candidate !== "string" || candidate.sdpMid !== void 0 && candidate.sdpMid !== null && typeof candidate.sdpMid !== "string" || candidate.sdpMLineIndex !== void 0 && candidate.sdpMLineIndex !== null && typeof candidate.sdpMLineIndex !== "number" || candidate.usernameFragment !== void 0 && typeof candidate.usernameFragment !== "string") return null;
	return candidate;
}
function optimizeCallSdp(sdp) {
	const maxVideoKbps = Math.max(300, Math.round(getAdaptivePerformanceSnapshot().videoBitrate / 1e3));
	const startVideoKbps = Math.max(200, Math.round(maxVideoKbps * .65));
	const minVideoKbps = Math.max(100, Math.round(maxVideoKbps * .4));
	const lines = sdp.split("\r\n");
	const qualityPayloads = /* @__PURE__ */ new Set();
	const opusPayloads = /* @__PURE__ */ new Set();
	const opusFmtpPayloads = /* @__PURE__ */ new Set();
	let mediaSection = null;
	for (const line of lines) {
		if (line.startsWith("m=audio ")) mediaSection = "audio";
		else if (line.startsWith("m=video ")) mediaSection = "video";
		else if (line.startsWith("m=")) mediaSection = null;
		if (mediaSection !== "audio") continue;
		const rtpmap = /^a=rtpmap:(\d+)\s+([^/]+)\//i.exec(line);
		if (rtpmap && /^opus$/i.test(rtpmap[2])) opusPayloads.add(rtpmap[1]);
		const fmtp = /^a=fmtp:(\d+)\s+/.exec(line);
		if (fmtp && opusPayloads.has(fmtp[1])) opusFmtpPayloads.add(fmtp[1]);
	}
	let inVideoSection = false;
	let hasVideoBitrate = false;
	const output = [];
	for (const line of lines) {
		if (line.startsWith("m=")) inVideoSection = line.startsWith("m=video ");
		if (line.startsWith("m=audio ") && opusPayloads.size) {
			const parts = line.trim().split(/\s+/);
			const header = parts.slice(0, 3);
			const payloads = parts.slice(3);
			const orderedPayloads = [...payloads.filter((payload) => opusPayloads.has(payload)), ...payloads.filter((payload) => !opusPayloads.has(payload))];
			output.push([...header, ...orderedPayloads].join(" "));
			continue;
		}
		if (inVideoSection && line.startsWith("m=video ")) {
			output.push(line);
			output.push(`b=AS:${maxVideoKbps}`);
			hasVideoBitrate = true;
			continue;
		}
		if (inVideoSection && line.startsWith("a=rtpmap:")) {
			const match = /^a=rtpmap:(\d+)\s+([^/]+)\//i.exec(line);
			if (match && /^(VP8|VP9|H264)$/i.test(match[2])) qualityPayloads.add(match[1]);
		}
		if (inVideoSection && line.startsWith("b=")) {
			if (line.startsWith("b=AS:")) {
				if (!hasVideoBitrate) output.push(`b=AS:${maxVideoKbps}`);
				hasVideoBitrate = true;
			} else output.push(line);
			continue;
		}
		if (inVideoSection && line.startsWith("a=fmtp:")) {
			const match = /^a=fmtp:(\d+)\s*(.*)$/.exec(line);
			if (match && qualityPayloads.has(match[1])) {
				if (!match[2].includes("x-google-max-bitrate")) {
					output.push(`${line};x-google-start-bitrate=${startVideoKbps};x-google-min-bitrate=${minVideoKbps};x-google-max-bitrate=${maxVideoKbps}`);
					continue;
				}
			}
		}
		if (!inVideoSection && opusPayloads.has((/^a=fmtp:(\d+)\s*/.exec(line) ?? [])[1] ?? "")) {
			const match = /^a=fmtp:(\d+)\s*(.*)$/.exec(line);
			if (match) {
				const params = match[2].split(";").map((param) => param.trim()).filter((param) => param && !/^minptime=/i.test(param) && !/^useinbandfec=/i.test(param));
				output.push(`a=fmtp:${match[1]} ${[
					...params,
					"minptime=10",
					"useinbandfec=1"
				].join(";")}`);
				continue;
			}
		}
		if (!inVideoSection && line.startsWith("a=rtpmap:") && opusPayloads.has((/^a=rtpmap:(\d+)\s+/.exec(line) ?? [])[1] ?? "")) {
			const payload = (/^a=rtpmap:(\d+)\s+/.exec(line) ?? [])[1];
			output.push(line);
			if (!opusFmtpPayloads.has(payload)) output.push(`a=fmtp:${payload} minptime=10;useinbandfec=1`);
			continue;
		}
		output.push(line);
	}
	return output.join("\r\n");
}
function optimizedSessionDescription(description) {
	return description.sdp ? {
		...description,
		sdp: optimizeCallSdp(description.sdp)
	} : description;
}
var CallCtx = (0, import_react.createContext)({
	startCall: async () => {},
	myCallId: null,
	isGuest: true,
	clearCallHistory: () => {}
});
var useCall = () => (0, import_react.useContext)(CallCtx);
/** Builds a looping ring tone as a WAV data URL playable by an HTML5 <audio> element. */
function buildRingToneUrl(freqs, onSec, cycleSec) {
	const rate = 22050;
	const total = Math.floor(rate * cycleSec);
	const bytes = 44 + total * 2;
	const buf = new ArrayBuffer(bytes);
	const view = new DataView(buf);
	const str = (off, s) => {
		for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
	};
	str(0, "RIFF");
	view.setUint32(4, bytes - 8, true);
	str(8, "WAVEfmt ");
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, 1, true);
	view.setUint32(24, rate, true);
	view.setUint32(28, rate * 2, true);
	view.setUint16(32, 2, true);
	view.setUint16(34, 16, true);
	str(36, "data");
	view.setUint32(40, total * 2, true);
	for (let i = 0; i < total; i++) {
		const t = i / rate;
		let v = 0;
		if (t < onSec) {
			for (const f of freqs) v += Math.sin(2 * Math.PI * f * t);
			v /= freqs.length;
			const fade = Math.min(1, t / .02, (onSec - t) / .02);
			v *= Math.max(0, fade) * .35;
		}
		view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 32767, true);
	}
	let bin = "";
	const u8 = new Uint8Array(buf);
	for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
	return `data:audio/wav;base64,${btoa(bin)}`;
}
var incomingUrl = null;
var ringbackUrl = null;
var activeRingtones = /* @__PURE__ */ new Set();
function stopAllRingtones() {
	for (const audio of activeRingtones) {
		audio.pause();
		audio.currentTime = 0;
		audio.src = "";
		activeRingtones.delete(audio);
	}
	if (typeof navigator !== "undefined" && navigator.vibrate) try {
		navigator.vibrate(0);
	} catch {}
}
/** HTML5 <audio> ringtone: incoming ring, or ringback while our outgoing call connects. */
function useRingtone(kind) {
	(0, import_react.useEffect)(() => {
		if (!kind || typeof window === "undefined") return;
		let audio = null;
		try {
			if (kind === "incoming") incomingUrl ??= buildRingToneUrl([440, 480], 1.2, 3);
			else ringbackUrl ??= buildRingToneUrl([440, 480], 1, 4);
			audio = new Audio(kind === "incoming" ? incomingUrl : ringbackUrl);
			activeRingtones.add(audio);
			audio.loop = true;
			audio.volume = kind === "incoming" ? 1 : .6;
			audio.play().catch(() => {});
		} catch {}
		if (kind === "incoming" && navigator.vibrate) try {
			navigator.vibrate([
				200,
				100,
				200,
				100,
				400
			]);
		} catch {}
		return () => {
			if (audio) {
				audio.pause();
				audio.currentTime = 0;
				audio.src = "";
				activeRingtones.delete(audio);
			}
			if (navigator.vibrate) try {
				navigator.vibrate(0);
			} catch {}
		};
	}, [kind]);
}
function CallProvider({ children }) {
	const [authId, setAuthId] = (0, import_react.useState)(null);
	const me = authId;
	const isGuest = !authId;
	const [call, setCall] = (0, import_react.useState)(null);
	const [phase, setPhase] = (0, import_react.useState)("idle");
	const [micOn, setMicOn] = (0, import_react.useState)(true);
	const [camOn, setCamOn] = (0, import_react.useState)(true);
	const [facingMode, setFacingMode] = (0, import_react.useState)("user");
	const [flashOn, setFlashOn] = (0, import_react.useState)(false);
	/** WhatsApp-style: tap the PiP to swap which stream fills the screen. */
	const [swapped, setSwapped] = (0, import_react.useState)(false);
	const [peerAvatar, setPeerAvatar] = (0, import_react.useState)(null);
	/** Auto-hiding call controls: visible on activity, hidden after 3s. */
	const [controlsVisible, setControlsVisible] = (0, import_react.useState)(true);
	const [speakerOn, setSpeakerOn] = (0, import_react.useState)(true);
	const [networkState, setNetworkState] = (0, import_react.useState)("stable");
	const [screenSharing, setScreenSharing] = (0, import_react.useState)(false);
	const [videoEffect, setVideoEffect] = (0, import_react.useState)("none");
	const hideTimer = (0, import_react.useRef)(null);
	const ringTimer = (0, import_react.useRef)(null);
	const pcRef = (0, import_react.useRef)(null);
	const localStream = (0, import_react.useRef)(null);
	const sigRef = (0, import_react.useRef)(null);
	const pendingLocalIce = (0, import_react.useRef)([]);
	const pendingIce = (0, import_react.useRef)([]);
	const fallbackSignals = (0, import_react.useRef)({});
	const receiveSignalRef = (0, import_react.useRef)(null);
	const signalQueueRef = (0, import_react.useRef)(Promise.resolve());
	const localVideo = (0, import_react.useRef)(null);
	const remoteVideo = (0, import_react.useRef)(null);
	const remoteAudio = (0, import_react.useRef)(null);
	const remoteStream = (0, import_react.useRef)(null);
	const remoteAudioMuted = (0, import_react.useRef)(false);
	const cameraSourceTrack = (0, import_react.useRef)(null);
	const videoEffectPipeline = (0, import_react.useRef)(null);
	const screenShareStream = (0, import_react.useRef)(null);
	const reconnectTimer = (0, import_react.useRef)(null);
	const reconnectAttempt = (0, import_react.useRef)(0);
	const callRef = (0, import_react.useRef)(null);
	const meRef = (0, import_react.useRef)(null);
	const isGuestRef = (0, import_react.useRef)(true);
	/** Call ids we've already reacted to (broadcast + database ring paths). */
	const seenCalls = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const signalCallIdRef = (0, import_react.useRef)(null);
	const signalReadyRef = (0, import_react.useRef)(null);
	const openSignalChannelRef = (0, import_react.useRef)(null);
	/** Remember handled call ids without growing the set forever. */
	const markSeen = (0, import_react.useCallback)((id) => {
		const set = seenCalls.current;
		set.add(id);
		if (set.size > 200) for (const k of Array.from(set).slice(0, set.size - 200)) set.delete(k);
	}, []);
	/** Set when the peer connection reaches "connected" — used for call duration. */
	const connectedAt = (0, import_react.useRef)(null);
	/** Ensures the call-log chat message is written exactly once per call. */
	const loggedCall = (0, import_react.useRef)(null);
	/** Prevent an already-active call from recreating a log after its chat was cleared. */
	const clearedCallPeers = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const logCallOutcomeRef = (0, import_react.useRef)(null);
	const pendingNotificationAction = (0, import_react.useRef)(null);
	const [showNotificationBanner, setShowNotificationBanner] = (0, import_react.useState)(false);
	const [elapsedSeconds, setElapsedSeconds] = (0, import_react.useState)(0);
	const adaptivePerformance = useAdaptivePerformance();
	useRingtone(phase === "incoming" ? "incoming" : phase === "outgoing" ? "ringback" : null);
	(0, import_react.useEffect)(() => {
		registerCallServiceWorker();
	}, []);
	(0, import_react.useEffect)(() => {
		if (!me || typeof window === "undefined" || !("Notification" in window)) return;
		if (Notification.permission === "default" && !hasSeenCallNotificationBanner()) setShowNotificationBanner(true);
	}, [me]);
	const activeCallId = call?.callId;
	(0, import_react.useEffect)(() => {
		const peer = pcRef.current;
		if (!peer || !activeCallId || phase === "idle") return;
		for (const sender of peer.getSenders()) if (sender.track?.kind === "video") tuneCallVideoSender(sender);
		else if (sender.track?.kind === "audio") prioritizeCallAudioSender(sender);
	}, [
		adaptivePerformance.networkQuality,
		adaptivePerformance.videoBitrate,
		adaptivePerformance.videoFrameRate,
		adaptivePerformance.videoScaleResolutionDownBy,
		activeCallId,
		phase
	]);
	(0, import_react.useEffect)(() => {
		const fromUrl = readCallNotificationAction();
		if (fromUrl) pendingNotificationAction.current = fromUrl;
		const onMessage = (event) => {
			if (event.data?.type !== "call-notification-click" || !event.data.callId) return;
			pendingNotificationAction.current = event.data;
		};
		navigator.serviceWorker?.addEventListener("message", onMessage);
		return () => navigator.serviceWorker?.removeEventListener("message", onMessage);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!call || phase === "idle" || phase === "incoming") {
			setControlsVisible(true);
			return;
		}
		setControlsVisible(true);
		hideTimer.current = window.setTimeout(() => setControlsVisible(false), 3e3);
		return () => {
			if (hideTimer.current) window.clearTimeout(hideTimer.current);
		};
	}, [call, phase]);
	const pokeControls = (0, import_react.useCallback)(() => {
		setControlsVisible((v) => {
			const next = !v;
			if (hideTimer.current) window.clearTimeout(hideTimer.current);
			if (next) hideTimer.current = window.setTimeout(() => setControlsVisible(false), 3e3);
			return next;
		});
	}, []);
	const toggleSpeaker = (0, import_react.useCallback)(() => {
		setSpeakerOn((on) => {
			const next = !on;
			remoteAudioMuted.current = !next;
			if (remoteAudio.current) remoteAudio.current.muted = !next;
			if (remoteVideo.current) remoteVideo.current.muted = !next;
			return next;
		});
	}, []);
	(0, import_react.useEffect)(() => {
		supabase.auth.getUser().then(({ data }) => setAuthId(data.user?.id ?? null));
		const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
			setAuthId(session?.user.id ?? null);
		});
		return () => sub.subscription.unsubscribe();
	}, []);
	(0, import_react.useEffect)(() => {
		if (!me || typeof window === "undefined" || !("Notification" in window)) return;
		if (Notification.permission !== "granted") return;
		getExistingCallPushSubscription().then((subscription) => {
			if (!subscription) return;
			const serialized = serializeCallPushSubscription(subscription);
			callDb.from("call_push_subscriptions").upsert({
				user_id: me,
				endpoint: serialized.endpoint,
				provider: "webpush",
				subscription: serialized.subscription,
				user_agent: navigator.userAgent.slice(0, 500),
				last_seen_at: (/* @__PURE__ */ new Date()).toISOString()
			}, { onConflict: "user_id,endpoint" });
		});
	}, [me]);
	(0, import_react.useEffect)(() => {
		const onOnline = () => {
			if (pcRef.current?.connectionState === "disconnected" || pcRef.current?.connectionState === "failed") pcRef.current.dispatchEvent(new Event("connectionstatechange"));
		};
		window.addEventListener("online", onOnline);
		return () => window.removeEventListener("online", onOnline);
	}, []);
	const teardown = (0, import_react.useCallback)((options) => {
		stopAllRingtones();
		if (reconnectTimer.current) {
			window.clearTimeout(reconnectTimer.current);
			reconnectTimer.current = null;
		}
		reconnectAttempt.current = 0;
		videoEffectPipeline.current?.stop();
		videoEffectPipeline.current = null;
		screenShareStream.current?.getTracks().forEach((track) => track.stop());
		screenShareStream.current = null;
		cameraSourceTrack.current = null;
		localStream.current?.getTracks().forEach((t) => t.stop());
		localStream.current = null;
		remoteStream.current?.getTracks().forEach((t) => t.stop());
		remoteStream.current = null;
		for (const el of [
			localVideo.current,
			remoteVideo.current,
			remoteAudio.current
		]) if (el) {
			try {
				el.pause();
			} catch {}
			el.srcObject = null;
		}
		const pc = pcRef.current;
		if (pc) {
			pc.onicecandidate = null;
			pc.ontrack = null;
			pc.onconnectionstatechange = null;
			pc.getSenders().forEach((s) => s.track?.stop());
			pc.getReceivers().forEach((r) => r.track?.stop());
			try {
				pc.close();
			} catch {}
		}
		pcRef.current = null;
		pendingLocalIce.current = [];
		if (!options?.keepSignal) {
			if (sigRef.current) {
				supabase.removeChannel(sigRef.current);
				sigRef.current = null;
			}
			signalCallIdRef.current = null;
			signalReadyRef.current = null;
		}
		if (hideTimer.current) {
			window.clearTimeout(hideTimer.current);
			hideTimer.current = null;
		}
		if (ringTimer.current) {
			window.clearTimeout(ringTimer.current);
			ringTimer.current = null;
		}
		connectedAt.current = null;
		pendingIce.current = [];
		receiveSignalRef.current = null;
		setPhase("idle");
		setCall(null);
		setMicOn(true);
		setCamOn(true);
		setSpeakerOn(true);
		setNetworkState("stable");
		setScreenSharing(false);
		setVideoEffect("none");
		remoteAudioMuted.current = false;
		setFacingMode("user");
		setFlashOn(false);
		setSwapped(false);
		setControlsVisible(true);
		setElapsedSeconds(0);
	}, []);
	const previousAuthId = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const wasAuthenticated = previousAuthId.current !== null;
		const authChanged = previousAuthId.current !== authId;
		previousAuthId.current = authId;
		if (!wasAuthenticated || !authChanged) return;
		const activeCall = callRef.current;
		if (activeCall) {
			sigRef.current?.send({
				type: "broadcast",
				event: "END_CALL",
				payload: {
					callId: activeCall.callId,
					reason: "auth_lost"
				}
			});
			callDb.from("calls").update({
				status: "ended",
				ended_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", activeCall.callId);
			logCallOutcomeRef.current?.(connectedAt.current ? "answered" : "missed");
		}
		teardown();
	}, [authId, teardown]);
	const signal = (0, import_react.useCallback)((payload) => {
		const callId = callRef.current?.callId;
		const event = typeof payload.type === "string" ? payload.type : "signal";
		const broadcastPayload = callId ? {
			...payload,
			callId
		} : payload;
		sigRef.current?.send({
			type: "broadcast",
			event,
			payload: broadcastPayload
		});
		const c = callRef.current;
		const sender = meRef.current;
		if (c && sender) {
			const prior = fallbackSignals.current[c.callId];
			const candidateKey = c.incoming ? "receiver_candidates" : "caller_candidates";
			const candidate = payload.type === "ICE_CANDIDATE" ? payload.candidate : null;
			const data = {
				...prior ?? {},
				sender_id: sender,
				payload,
				candidates: prior?.candidates ?? [],
				[candidateKey]: candidate ? [...prior?.[candidateKey] ?? [], candidate].slice(-64) : prior?.[candidateKey] ?? [],
				at: (/* @__PURE__ */ new Date()).toISOString()
			};
			fallbackSignals.current[c.callId] = data;
			callDb.from("calls").update({ signal_data: data }).eq("id", c.callId);
		}
	}, []);
	const broadcastEndCall = (0, import_react.useCallback)((callId) => {
		return sigRef.current?.send({
			type: "broadcast",
			event: "END_CALL",
			payload: { callId }
		}) ?? Promise.resolve();
	}, []);
	const persistDescription = (0, import_react.useCallback)(async (callId, field, description) => {
		const { data } = await callDb.from("calls").select("signal_data").eq("id", callId).maybeSingle();
		const next = {
			...data?.signal_data ?? {},
			[field]: description,
			at: (/* @__PURE__ */ new Date()).toISOString()
		};
		fallbackSignals.current[callId] = next;
		const { error } = await callDb.from("calls").update({ signal_data: next }).eq("id", callId);
		if (error) throw error;
	}, []);
	const playRemoteMedia = (0, import_react.useCallback)(() => {
		const elements = [remoteVideo.current, remoteAudio.current];
		for (const element of elements) {
			if (!element?.srcObject) continue;
			element.muted = remoteAudioMuted.current;
			element.play().catch((error) => {
				console.debug("[call] remote media autoplay pending", error);
			});
		}
	}, []);
	const attachStreams = (0, import_react.useCallback)(() => {
		if (localVideo.current && localStream.current) {
			localVideo.current.srcObject = localStream.current;
			localVideo.current.play().catch(() => {});
		}
		if (remoteStream.current) {
			if (callRef.current?.mode === "video" && remoteVideo.current) remoteVideo.current.srcObject = remoteStream.current;
			if (callRef.current?.mode !== "video" && remoteAudio.current) remoteAudio.current.srcObject = remoteStream.current;
			playRemoteMedia();
		}
	}, [playRemoteMedia]);
	const getMedia = (0, import_react.useCallback)(async (mode) => {
		const stream = await getCallMedia(mode, facingMode);
		for (const track of stream.getVideoTracks()) track.contentHint = "motion";
		localStream.current = stream;
		cameraSourceTrack.current = stream.getVideoTracks()[0] ?? null;
		attachStreams();
		return stream;
	}, [attachStreams, facingMode]);
	const applyVideoEffect = (0, import_react.useCallback)(async (nextEffect) => {
		const source = cameraSourceTrack.current;
		const peer = pcRef.current;
		const stream = localStream.current;
		if (!source || !stream || !peer) return;
		const current = stream.getVideoTracks()[0] ?? null;
		videoEffectPipeline.current?.stop();
		videoEffectPipeline.current = null;
		let nextTrack = source;
		if (nextEffect !== "none") {
			const pipeline = await createCallVideoEffect(source, nextEffect);
			if (!pipeline) {
				toast.error("This browser cannot apply live video effects");
				setVideoEffect("none");
				return;
			}
			videoEffectPipeline.current = pipeline;
			nextTrack = pipeline.track;
		}
		const sender = peer.getSenders().find((item) => item.track?.kind === "video");
		if (sender) {
			await sender.replaceTrack(nextTrack);
			await tuneCallVideoSender(sender);
		}
		if (current && current !== nextTrack) stream.removeTrack(current);
		if (!stream.getVideoTracks().includes(nextTrack)) stream.addTrack(nextTrack);
		setVideoEffect(nextEffect);
		attachStreams();
	}, [attachStreams]);
	const restoreCameraTrack = (0, import_react.useCallback)(async () => {
		if (!localStream.current || !pcRef.current || !cameraSourceTrack.current) return;
		const current = localStream.current.getVideoTracks()[0] ?? null;
		const sender = pcRef.current.getSenders().find((item) => item.track?.kind === "video");
		const nextTrack = videoEffectPipeline.current?.track ?? cameraSourceTrack.current;
		if (sender) {
			await sender.replaceTrack(nextTrack);
			await tuneCallVideoSender(sender);
		}
		if (current && current !== nextTrack) localStream.current.removeTrack(current);
		if (!localStream.current.getVideoTracks().includes(nextTrack)) localStream.current.addTrack(nextTrack);
		attachStreams();
	}, [attachStreams]);
	const toggleScreenShare = (0, import_react.useCallback)(async () => {
		if (!pcRef.current || !localStream.current || !call || call.mode !== "video") return;
		if (screenSharing) {
			screenShareStream.current?.getTracks().forEach((track) => track.stop());
			screenShareStream.current = null;
			await restoreCameraTrack();
			setScreenSharing(false);
			return;
		}
		if (!navigator.mediaDevices.getDisplayMedia) {
			toast.error("Screen sharing is not supported on this browser");
			return;
		}
		try {
			const shared = await navigator.mediaDevices.getDisplayMedia({
				video: { frameRate: {
					ideal: 30,
					max: 30
				} },
				audio: false
			});
			const track = shared.getVideoTracks()[0];
			if (!track) throw new Error("No screen track was returned");
			const sender = pcRef.current.getSenders().find((item) => item.track?.kind === "video");
			const current = localStream.current.getVideoTracks()[0] ?? null;
			if (sender) {
				await sender.replaceTrack(track);
				await tuneCallVideoSender(sender);
			}
			if (current) localStream.current.removeTrack(current);
			localStream.current.addTrack(track);
			screenShareStream.current = shared;
			setScreenSharing(true);
			track.onended = () => {
				(async () => {
					screenShareStream.current = null;
					await restoreCameraTrack();
					setScreenSharing(false);
				})();
			};
			attachStreams();
		} catch (error) {
			if (error?.name !== "AbortError") toast.error(error instanceof Error ? error.message : "Screen sharing could not start");
		}
	}, [
		attachStreams,
		call,
		restoreCameraTrack,
		screenSharing
	]);
	const phaseRef = (0, import_react.useRef)("idle");
	(0, import_react.useEffect)(() => {
		phaseRef.current = phase;
	}, [phase]);
	(0, import_react.useEffect)(() => {
		if (phase !== "incoming") return;
		const t = window.setTimeout(() => {
			toast.message("Missed call");
			const c = callRef.current;
			if (c) callDb.from("calls").update({
				status: "declined",
				ended_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", c.callId).eq("status", "ringing");
			signal({
				type: "END_CALL",
				reason: "timeout"
			});
			stopAllRingtones();
			teardown();
		}, 45e3);
		return () => window.clearTimeout(t);
	}, [
		phase,
		teardown,
		signal
	]);
	(0, import_react.useEffect)(() => {
		callRef.current = call;
	}, [call]);
	(0, import_react.useEffect)(() => {
		meRef.current = me;
	}, [me]);
	(0, import_react.useEffect)(() => {
		isGuestRef.current = isGuest;
	}, [isGuest]);
	/**
	* Writes a permanent call-log entry into the chat so both sides can see who
	* called, whether it was answered (with duration) or missed/declined. Only
	* the caller writes it, and only once per call — the other side receives it
	* through the normal chat realtime subscription.
	*/
	const logCallOutcome = (0, import_react.useCallback)(async (outcome) => {
		const c = callRef.current;
		const meId = meRef.current;
		if (!c || c.incoming || !meId || isGuestRef.current) return;
		if (clearedCallPeers.current.has(c.peerId)) return;
		if (loggedCall.current === c.callId) return;
		loggedCall.current = c.callId;
		const durMs = connectedAt.current ? Date.now() - connectedAt.current : null;
		connectedAt.current = null;
		const fmtDur = (ms) => {
			const s = Math.max(0, Math.floor(ms / 1e3));
			return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
		};
		const label = c.mode === "video" ? "Video" : "Voice";
		const text = outcome === "answered" && durMs != null ? `${label} Call ended • ${fmtDur(durMs)}` : `Missed ${label} Call`;
		try {
			if (c.threadId) await supabase.from("messages").insert({
				sender_id: meId,
				receiver_id: c.peerId,
				content: text,
				media_url: null,
				voice_note_url: null,
				metadata: {}
			});
			else await supabase.from("orbit_messages").insert({
				sender_id: meId,
				recipient_id: c.peerId,
				kind: "system",
				text
			});
		} catch (err) {
			console.error("[call] log insert failed", err);
		}
	}, []);
	logCallOutcomeRef.current = logCallOutcome;
	const createPeer = (0, import_react.useCallback)((stream) => {
		const pc = new RTCPeerConnection({
			iceServers: CALL_ICE_SERVERS,
			iceCandidatePoolSize: 4
		});
		pcRef.current = pc;
		stream.getTracks().forEach((t) => pc.addTrack(t, stream));
		for (const sender of pc.getSenders()) {
			if (sender.track?.kind === "video") tuneCallVideoSender(sender);
			if (sender.track?.kind === "audio") prioritizeCallAudioSender(sender);
		}
		pc.onicecandidate = (e) => {
			if (!e.candidate) return;
			if (callRef.current) signal({
				type: "ICE_CANDIDATE",
				candidate: e.candidate.toJSON()
			});
			else pendingLocalIce.current.push(e.candidate.toJSON());
		};
		pc.ontrack = (e) => {
			let s = e.streams[0] ?? remoteStream.current;
			if (!s) s = new MediaStream();
			if (!e.streams[0] && !s.getTracks().includes(e.track)) s.addTrack(e.track);
			remoteStream.current = s;
			const attachNow = () => {
				if (callRef.current?.mode === "video" && remoteVideo.current) remoteVideo.current.srcObject = s;
				if (callRef.current?.mode !== "video" && remoteAudio.current) remoteAudio.current.srcObject = s;
				playRemoteMedia();
			};
			attachNow();
			requestAnimationFrame(attachNow);
			requestAnimationFrame(() => requestAnimationFrame(attachNow));
		};
		const scheduleReconnect = () => {
			if (reconnectTimer.current || !callRef.current || phaseRef.current === "idle") return;
			const attempt = reconnectAttempt.current;
			if (attempt >= 4) {
				toast.error("Call connection could not be recovered");
				const currentCall = callRef.current;
				if (currentCall) {
					signal({
						type: "END_CALL",
						reason: "reconnect_failed"
					});
					callDb.from("calls").update({
						status: "ended",
						ended_at: (/* @__PURE__ */ new Date()).toISOString()
					}).eq("id", currentCall.callId);
				}
				logCallOutcome("missed");
				teardown();
				return;
			}
			reconnectAttempt.current += 1;
			setNetworkState("reconnecting");
			const delay = Math.min(1e4, 1e3 * 2 ** attempt);
			reconnectTimer.current = window.setTimeout(() => {
				reconnectTimer.current = null;
				(async () => {
					try {
						if (pcRef.current !== pc || !callRef.current) return;
						pc.restartIce?.();
						const offer = await pc.createOffer({ iceRestart: true });
						const optimizedOffer = {
							...offer,
							sdp: optimizeCallSdp(offer.sdp ?? "")
						};
						await pc.setLocalDescription(optimizedOffer);
						const description = pc.localDescription;
						if (!description) throw new Error("ICE restart offer was not created");
						await persistDescription(callRef.current.callId, "offer", description);
						signal({
							type: "CALL_OFFER",
							sdp: description,
							reconnect: true
						});
					} catch (error) {
						console.debug("[call] ICE restart attempt failed", error);
						scheduleReconnect();
					}
				})();
			}, delay);
		};
		pc.onconnectionstatechange = () => {
			if (pc.connectionState === "connected") {
				stopAllRingtones();
				reconnectAttempt.current = 0;
				setNetworkState("stable");
				connectedAt.current ??= Date.now();
				setPhase("active");
				const currentCall = callRef.current;
				if (currentCall) callDb.from("calls").update({ status: "connected" }).eq("id", currentCall.callId);
			}
			if (pc.connectionState === "disconnected" || pc.connectionState === "failed") scheduleReconnect();
		};
		return pc;
	}, [
		signal,
		teardown,
		logCallOutcome,
		playRemoteMedia,
		persistDescription
	]);
	const flushIce = (0, import_react.useCallback)(async () => {
		const pc = pcRef.current;
		if (!pc) return;
		for (const c of pendingIce.current) try {
			await pc.addIceCandidate(new RTCIceCandidate(c));
		} catch {}
		pendingIce.current = [];
	}, []);
	const openSignalChannel = (0, import_react.useCallback)((callId, mode, isCaller) => {
		if (signalCallIdRef.current === callId && signalReadyRef.current) return signalReadyRef.current;
		const ready = new Promise((resolve) => {
			(async () => {
				const { data: sess } = await supabase.auth.getSession();
				await supabase.realtime.setAuth(sess.session?.access_token);
				const ch = supabase.channel(`call_${callId}`, { config: { broadcast: { self: false } } });
				sigRef.current = ch;
				const receive = async (payload, eventType) => {
					const pc = pcRef.current;
					const type = typeof payload.type === "string" ? payload.type : eventType;
					try {
						if ((type === "CALL_ACCEPT" || type === "accept") && isCaller) {
							setPhase("connecting");
							const stream = localStream.current ?? await getMedia(mode);
							const peer = pcRef.current ?? createPeer(stream);
							let offerDescription = peer.localDescription;
							if (!offerDescription) {
								const offer = await peer.createOffer({
									offerToReceiveAudio: true,
									offerToReceiveVideo: mode === "video"
								});
								const optimizedOffer = {
									...offer,
									sdp: optimizeCallSdp(offer.sdp ?? "")
								};
								await peer.setLocalDescription(optimizedOffer);
								offerDescription = peer.localDescription;
							}
							if (!offerDescription) throw new Error("no offer was created");
							await persistDescription(callId, "offer", offerDescription);
							signal({
								type: "CALL_OFFER",
								sdp: offerDescription
							});
						} else if ((type === "CALL_OFFER" || type === "offer") && (!isCaller || payload.reconnect === true) && phaseRef.current !== "incoming") {
							const remoteOffer = asSessionDescription(payload.sdp);
							if (!remoteOffer) return;
							const stream = localStream.current ?? await getMedia(mode);
							const peer = pcRef.current ?? createPeer(stream);
							if (peer.remoteDescription?.sdp && peer.remoteDescription.sdp === remoteOffer.sdp && peer.signalingState !== "have-local-offer") return;
							await peer.setRemoteDescription(new RTCSessionDescription(optimizedSessionDescription(remoteOffer)));
							await flushIce();
							const answer = await peer.createAnswer();
							const optimizedAnswer = {
								...answer,
								sdp: optimizeCallSdp(answer.sdp ?? "")
							};
							await peer.setLocalDescription(optimizedAnswer);
							const answerDescription = peer.localDescription;
							if (!answerDescription) return;
							sigRef.current?.send({
								type: "broadcast",
								event: "CALL_ANSWER",
								payload: {
									type: "CALL_ANSWER",
									callId,
									sdp: answerDescription,
									reconnect: payload.reconnect === true
								}
							});
							await persistDescription(callId, "answer", answerDescription);
							setPhase("connecting");
						} else if ((type === "CALL_ANSWER" || type === "answer") && pc && (pc.signalingState === "have-local-offer" || !pc.remoteDescription)) {
							const remoteAnswer = asSessionDescription(payload.sdp);
							if (!remoteAnswer) return;
							await pc.setRemoteDescription(new RTCSessionDescription(optimizedSessionDescription(remoteAnswer)));
							await flushIce();
							stopAllRingtones();
							setPhase("connecting");
						} else if (type === "ICE_CANDIDATE" || type === "ice") {
							const candidate = asIceCandidate(payload.candidate);
							if (!candidate) return;
							if (pc?.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(candidate));
							else pendingIce.current.push(candidate);
						} else if (type === "END_CALL") {
							if (payload.callId && payload.callId !== callId) return;
							stopAllRingtones();
							const reason = payload.reason === "rejected" || payload.reason === "declined";
							toast.message(reason ? "Call declined" : "Call ended");
							logCallOutcome(reason ? "declined" : connectedAt.current ? "answered" : "missed");
							teardown();
						}
					} catch (err) {
						console.error("[call] signal error", err);
					}
				};
				const enqueueReceive = (payload, eventType) => {
					const next = signalQueueRef.current.then(() => receive(payload, eventType));
					signalQueueRef.current = next.catch(() => {});
					return next;
				};
				receiveSignalRef.current = enqueueReceive;
				for (const event of [
					"CALL_ACCEPT",
					"CALL_OFFER",
					"CALL_ANSWER",
					"ICE_CANDIDATE",
					"END_CALL"
				]) ch.on("broadcast", { event }, ({ payload }) => {
					enqueueReceive(payload, event);
				});
				ch.on("broadcast", { event: "signal" }, ({ payload }) => {
					enqueueReceive(payload);
				});
				let settled = false;
				const done = () => {
					if (settled) return;
					settled = true;
					resolve();
				};
				const guard = setTimeout(done, 8e3);
				ch.subscribe((status) => {
					if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
						clearTimeout(guard);
						done();
					}
				});
				callDb.from("calls").select("signal_data").eq("id", callId).maybeSingle().then(({ data }) => {
					const stored = data?.signal_data;
					if (stored?.sender_id && stored.sender_id !== meRef.current) (async () => {
						if (stored.payload) await enqueueReceive(stored.payload);
						for (const candidate of stored.candidates ?? []) await enqueueReceive({
							type: "ICE_CANDIDATE",
							candidate
						});
						const remoteCandidates = isCaller ? stored.receiver_candidates : stored.caller_candidates;
						for (const candidate of remoteCandidates ?? []) await enqueueReceive({
							type: "ICE_CANDIDATE",
							candidate
						});
					})();
				});
			})().catch((error) => {
				console.error("[call] signalling setup failed", error);
				resolve();
			});
		});
		signalCallIdRef.current = callId;
		signalReadyRef.current = ready;
		return ready;
	}, [
		createPeer,
		flushIce,
		getMedia,
		signal,
		teardown,
		logCallOutcome,
		persistDescription
	]);
	openSignalChannelRef.current = openSignalChannel;
	(0, import_react.useEffect)(() => {
		if (!authId) return;
		const me2 = authId;
		let alive = true;
		const blocked = async (peerId) => {
			const { data } = await callDb.from("user_blocks").select("blocker_id").or(`blocker_id.eq.${me2},blocked_id.eq.${me2}`).limit(20);
			return (data ?? []).some((row) => row.blocker_id === peerId || row.blocked_id === peerId);
		};
		const ring = async (raw) => {
			const row = raw;
			if (!alive || row.receiver_id !== me2 || row.status !== "ringing" || seenCalls.current.has(row.id)) return;
			if (Date.now() - new Date(row.created_at).getTime() > 45e3) return;
			if (await blocked(row.caller_id)) {
				callDb.from("calls").update({
					status: "declined",
					ended_at: (/* @__PURE__ */ new Date()).toISOString()
				}).eq("id", row.id);
				return;
			}
			markSeen(row.id);
			if (pcRef.current || phaseRef.current !== "idle") {
				callDb.from("calls").update({
					status: "declined",
					ended_at: (/* @__PURE__ */ new Date()).toISOString()
				}).eq("id", row.id);
				return;
			}
			const { data: callerProfile } = await supabase.from("profiles").select("display_name,username,avatar_url").eq("id", row.caller_id).maybeSingle();
			const peerName = callerProfile?.display_name || callerProfile?.username || "YourWorld caller";
			const nextCall = {
				callId: row.id,
				mode: row.call_type,
				peerId: row.caller_id,
				peerName,
				avatarUrl: callerProfile?.avatar_url ?? null,
				incoming: true
			};
			const storedSignal = row.signal_data;
			if (storedSignal && typeof storedSignal === "object") fallbackSignals.current[row.id] = storedSignal;
			setCall(nextCall);
			callRef.current = nextCall;
			setPhase("incoming");
			openSignalChannelRef.current?.(row.id, row.call_type, false);
			toast.message(`Incoming ${row.call_type === "video" ? "video" : "audio"} call`);
			if (document.visibilityState !== "visible") showIncomingCallNotification({
				callId: row.id,
				mode: row.call_type,
				peerName
			});
		};
		const update = ({ new: raw }) => {
			const row = raw;
			if (row.receiver_id !== me2 && row.caller_id !== me2) return;
			if (row.receiver_id === me2 && row.status === "ringing") ring(row);
			if (row.id === callRef.current?.callId && (row.status === "ended" || row.status === "cancelled" || row.status === "declined" || row.status === "rejected" || row.status === "busy")) {
				stopAllRingtones();
				toast.message(row.status === "declined" || row.status === "rejected" ? "Call declined" : row.status === "busy" ? "User is busy" : "Call ended");
				logCallOutcomeRef.current?.(row.status === "declined" ? "declined" : "missed");
				teardown();
			}
			const stored = row.signal_data;
			if (stored?.sender_id && stored.sender_id !== me2) (async () => {
				if (stored.payload) await receiveSignalRef.current?.(stored.payload);
				for (const candidate of stored.candidates ?? []) await receiveSignalRef.current?.({
					type: "ICE_CANDIDATE",
					candidate
				});
				const remoteCandidates = row.caller_id === me2 ? stored.receiver_candidates : stored.caller_candidates;
				for (const candidate of remoteCandidates ?? []) await receiveSignalRef.current?.({
					type: "ICE_CANDIDATE",
					candidate
				});
			})();
		};
		const ch = supabase.channel(`calls-db-${me2}`).on("postgres_changes", {
			event: "INSERT",
			schema: "public",
			table: "calls",
			filter: `receiver_id=eq.${me2}`
		}, ({ new: row }) => {
			ring(row);
		}).on("postgres_changes", {
			event: "UPDATE",
			schema: "public",
			table: "calls"
		}, update).subscribe();
		callDb.from("calls").select("*").eq("receiver_id", me2).eq("status", "ringing").then(({ data }) => {
			for (const row of data ?? []) ring(row);
		});
		const pollCalls = async () => {
			if (!alive) return;
			const { data } = await callDb.from("calls").select("*").or(`caller_id.eq.${me2},receiver_id.eq.${me2}`).order("created_at", { ascending: false }).limit(30);
			for (const row of data ?? []) {
				if (!alive) return;
				if (row.receiver_id === me2 && row.status === "ringing") ring(row);
				if (row.id !== callRef.current?.callId) continue;
				update({ new: row });
				if (row.status === "ended" || row.status === "declined" || row.status === "cancelled" || row.status === "rejected" || row.status === "busy") continue;
				const record = row.signal_data;
				if (row.caller_id === me2 && record?.answer) await receiveSignalRef.current?.({
					type: "CALL_ANSWER",
					callId: row.id,
					sdp: record.answer
				});
				if (row.receiver_id === me2 && record?.offer && phaseRef.current === "connecting") await receiveSignalRef.current?.({
					type: "CALL_OFFER",
					callId: row.id,
					sdp: record.offer
				});
				const remoteCandidates = row.caller_id === me2 ? record?.receiver_candidates : record?.caller_candidates;
				for (const candidate of remoteCandidates ?? []) await receiveSignalRef.current?.({
					type: "ICE_CANDIDATE",
					candidate
				});
			}
		};
		pollCalls();
		const pollTimer = window.setInterval(() => void pollCalls(), 1e3);
		return () => {
			alive = false;
			window.clearInterval(pollTimer);
			supabase.removeChannel(ch);
		};
	}, [
		authId,
		teardown,
		markSeen
	]);
	const startCall = (0, import_react.useCallback)(async ({ threadId, peerId, peerName, mode }) => {
		if (!authId) {
			toast.error("Sign in to make a call");
			return;
		}
		let target = peerId ?? null;
		if (!target && threadId) {
			const { data } = await supabase.from("thread_participants").select("user_id").eq("thread_id", threadId);
			target = (data ?? []).map((r) => r.user_id).find((id) => id !== me) ?? null;
		}
		if (!target || target === authId) {
			toast.error("This person isn't reachable for calls yet");
			return;
		}
		const { data: blocks } = await callDb.from("user_blocks").select("blocker_id,blocked_id").or(`blocker_id.eq.${authId},blocked_id.eq.${authId}`);
		if ((blocks ?? []).some((block) => block.blocker_id === target || block.blocked_id === target)) {
			toast.error("Calls are unavailable because one of you has blocked the other.");
			return;
		}
		try {
			await getMedia(mode);
		} catch {
			toast.error("Camera / microphone permission denied");
			teardown();
			return;
		}
		let callId = null;
		try {
			const stream = localStream.current;
			const peer = createPeer(stream);
			const offer = await peer.createOffer({
				offerToReceiveAudio: true,
				offerToReceiveVideo: mode === "video"
			});
			const optimizedOffer = {
				...offer,
				sdp: optimizeCallSdp(offer.sdp ?? "")
			};
			await peer.setLocalDescription(optimizedOffer);
			const offerDescription = peer.localDescription;
			if (!offerDescription) throw new Error("no offer was created");
			const initialSignal = {
				offer: offerDescription,
				caller_candidates: [...pendingLocalIce.current],
				sender_id: authId,
				at: (/* @__PURE__ */ new Date()).toISOString()
			};
			const { data: inserted, error } = await callDb.from("calls").insert({
				caller_id: authId,
				receiver_id: target,
				call_type: mode,
				status: "ringing",
				signal_data: initialSignal
			}).select("id").single();
			callId = inserted?.id ?? null;
			if (error || !callId) throw new Error(error?.message ?? "no call id was returned");
			supabase.functions.invoke("send-call-push", { body: {
				callId,
				receiverId: target,
				mode,
				peerName: peerName ?? "YourWorld caller"
			} }).then(({ error: pushError }) => {
				if (pushError) console.debug("[call-notifications] background push unavailable", pushError);
			});
			const nextCall = {
				callId,
				mode,
				peerId: target,
				peerName: peerName ?? "Calling…",
				incoming: false,
				threadId: threadId ?? null
			};
			clearedCallPeers.current.delete(target);
			fallbackSignals.current[callId] = initialSignal;
			pendingLocalIce.current = [];
			setCall(nextCall);
			callRef.current = nextCall;
			setPhase("outgoing");
			await openSignalChannel(callId, mode, true);
			signal({
				type: "CALL_OFFER",
				sdp: offerDescription
			});
			markSeen(callId);
			for (const candidate of initialSignal.caller_candidates ?? []) signal({
				type: "ICE_CANDIDATE",
				candidate
			});
			if (ringTimer.current) window.clearTimeout(ringTimer.current);
			ringTimer.current = window.setTimeout(() => {
				ringTimer.current = null;
				if (phaseRef.current !== "outgoing") return;
				toast.message("No answer");
				signal({
					type: "END_CALL",
					reason: "timeout"
				});
				stopAllRingtones();
				callDb.from("calls").update({
					status: "cancelled",
					ended_at: (/* @__PURE__ */ new Date()).toISOString()
				}).eq("id", callId);
				logCallOutcome("missed");
				teardown();
			}, 45e3);
		} catch (error) {
			if (callId) callDb.from("calls").update({
				status: "cancelled",
				ended_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", callId);
			toast.error(`Call could not start: ${error instanceof Error ? error.message : "unexpected setup error"}`);
			teardown();
		}
	}, [
		authId,
		me,
		getMedia,
		createPeer,
		openSignalChannel,
		signal,
		teardown,
		logCallOutcome,
		markSeen
	]);
	const clearCallHistory = (0, import_react.useCallback)((peerId) => {
		if (peerId) clearedCallPeers.current.add(peerId);
	}, []);
	const accept = (0, import_react.useCallback)(async () => {
		if (!call || !authId) return;
		const { data: blocks } = await callDb.from("user_blocks").select("blocker_id,blocked_id").or(`blocker_id.eq.${authId},blocked_id.eq.${authId}`);
		if ((blocks ?? []).some((block) => block.blocker_id === call.peerId || block.blocked_id === call.peerId)) {
			toast.error("Calls are unavailable because one of you has blocked the other.");
			signal({
				type: "END_CALL",
				reason: "rejected"
			});
			callDb.from("calls").update({
				status: "declined",
				ended_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", call.callId);
			teardown();
			return;
		}
		if (ringTimer.current) {
			window.clearTimeout(ringTimer.current);
			ringTimer.current = null;
		}
		setPhase("connecting");
		try {
			await getMedia(call.mode);
		} catch {
			toast.error("Camera / microphone permission denied");
			signal({
				type: "END_CALL",
				reason: "rejected"
			});
			callDb.from("calls").update({
				status: "declined",
				ended_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", call.callId);
			teardown();
			return;
		}
		try {
			createPeer(localStream.current);
			await openSignalChannel(call.callId, call.mode, false);
			const { error } = await supabase.from("calls").update({ status: "accepted" }).eq("id", call.callId);
			if (error) throw error;
			sigRef.current?.send({
				type: "broadcast",
				event: "CALL_ACCEPT",
				payload: {
					type: "CALL_ACCEPT",
					callId: call.callId
				}
			});
			const { data: callRow } = await callDb.from("calls").select("signal_data").eq("id", call.callId).maybeSingle();
			const storedOffer = callRow?.signal_data?.offer;
			if (storedOffer) await receiveSignalRef.current?.({
				type: "CALL_OFFER",
				callId: call.callId,
				sdp: storedOffer
			});
		} catch (error) {
			toast.error(`Call could not connect: ${error instanceof Error ? error.message : "unexpected setup error"}`);
			signal({
				type: "END_CALL",
				reason: "failed"
			});
			callDb.from("calls").update({
				status: "ended",
				ended_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", call.callId);
			teardown();
		}
	}, [
		call,
		authId,
		getMedia,
		createPeer,
		openSignalChannel,
		signal,
		teardown
	]);
	const hangup = (0, import_react.useCallback)(async () => {
		stopAllRingtones();
		if (!call) {
			teardown();
			return;
		}
		const callId = call.callId;
		const channel = sigRef.current;
		const wasConnected = connectedAt.current !== null;
		const broadcastPromise = broadcastEndCall(callId);
		const dbPromise = callDb.from("calls").update({
			status: "ended",
			ended_at: (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", callId);
		teardown({ keepSignal: true });
		logCallOutcome(wasConnected ? "answered" : "missed");
		await Promise.allSettled([broadcastPromise, dbPromise]);
		if (channel && sigRef.current === channel) {
			await supabase.removeChannel(channel);
			sigRef.current = null;
		}
		signalCallIdRef.current = null;
		signalReadyRef.current = null;
	}, [
		call,
		teardown,
		broadcastEndCall,
		logCallOutcome
	]);
	(0, import_react.useEffect)(() => {
		if (phase !== "active") {
			setElapsedSeconds(0);
			return;
		}
		const update = () => {
			setElapsedSeconds(connectedAt.current ? Math.max(0, Math.floor((Date.now() - connectedAt.current) / 1e3)) : 0);
		};
		update();
		const timer = window.setInterval(update, 1e3);
		return () => window.clearInterval(timer);
	}, [phase, call?.callId]);
	(0, import_react.useEffect)(() => {
		const pending = pendingNotificationAction.current;
		if (!pending || !call || phase !== "incoming" || pending.callId !== call.callId) return;
		pendingNotificationAction.current = null;
		if (pending.action === "accept") accept();
		else hangup();
	}, [
		accept,
		call,
		hangup,
		phase
	]);
	const toggleMic = () => {
		const track = localStream.current?.getAudioTracks()[0];
		if (track) {
			track.enabled = !track.enabled;
			setMicOn(track.enabled);
		}
	};
	const toggleCam = () => {
		const track = localStream.current?.getVideoTracks()[0];
		if (track) {
			track.enabled = !track.enabled;
			setCamOn(track.enabled);
		}
	};
	const toggleFlash = (0, import_react.useCallback)(async () => {
		const track = localStream.current?.getVideoTracks()[0];
		if (!track) return;
		try {
			await track.applyConstraints({ advanced: [{ torch: !flashOn }] });
			setFlashOn(!flashOn);
		} catch {
			toast.error("Flashlight not supported on this device");
		}
	}, [flashOn]);
	const flipCamera = (0, import_react.useCallback)(async () => {
		const next = facingMode === "user" ? "environment" : "user";
		const oldTrack = localStream.current?.getVideoTracks()[0] ?? null;
		videoEffectPipeline.current?.stop();
		videoEffectPipeline.current = null;
		cameraSourceTrack.current?.stop();
		cameraSourceTrack.current = null;
		if (oldTrack) {
			oldTrack.stop();
			localStream.current?.removeTrack(oldTrack);
		}
		setFlashOn(false);
		try {
			const newVideoTrack = (await getCallVideo(next)).getVideoTracks()[0];
			newVideoTrack.contentHint = "motion";
			cameraSourceTrack.current = newVideoTrack;
			const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");
			if (sender && newVideoTrack) {
				await sender.replaceTrack(newVideoTrack);
				await tuneCallVideoSender(sender);
			}
			if (localStream.current && newVideoTrack) localStream.current.addTrack(newVideoTrack);
			setFacingMode(next);
			setVideoEffect("none");
			attachStreams();
		} catch {
			toast.error("Couldn't switch camera");
			try {
				const t = (await getCallVideo(facingMode)).getVideoTracks()[0];
				const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");
				if (sender && t) {
					await sender.replaceTrack(t);
					await tuneCallVideoSender(sender);
				}
				if (localStream.current && t) localStream.current.addTrack(t);
				attachStreams();
			} catch {}
		}
	}, [facingMode, attachStreams]);
	(0, import_react.useEffect)(() => {
		if (!call || phase === "idle") return;
		attachStreams();
		const t = window.setTimeout(attachStreams, 250);
		return () => window.clearTimeout(t);
	}, [
		call,
		phase,
		attachStreams
	]);
	(0, import_react.useEffect)(() => {
		setSwapped(false);
		setPeerAvatar(null);
		const peerId = call?.peerId;
		if (!peerId) return;
		let cancelled = false;
		(async () => {
			const { data } = await supabase.from("profiles").select("avatar_url").eq("id", peerId).maybeSingle();
			if (!cancelled && data?.avatar_url) setPeerAvatar(data.avatar_url);
		})();
		return () => {
			cancelled = true;
		};
	}, [call?.peerId]);
	(0, import_react.useEffect)(() => () => teardown(), [teardown]);
	const value = (0, import_react.useMemo)(() => ({
		startCall,
		myCallId: me,
		isGuest,
		clearCallHistory
	}), [
		startCall,
		me,
		isGuest,
		clearCallHistory
	]);
	const statusText = phase === "incoming" ? `Incoming ${call?.mode === "video" ? "video" : "audio"} call…` : phase === "outgoing" ? "Ringing…" : phase === "connecting" ? "Connecting…" : "Connected";
	const caller = call ? {
		name: call.peerName,
		avatar_url: call.avatarUrl ?? peerAvatar
	} : null;
	const callClock = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`;
	const enableNotifications = async () => {
		markCallNotificationBannerSeen();
		setShowNotificationBanner(false);
		const result = await enableCallNotifications();
		if (result.permission === "granted") {
			if (result.subscription && me) {
				const serialized = serializeCallPushSubscription(result.subscription);
				const { error } = await callDb.from("call_push_subscriptions").upsert({
					user_id: me,
					endpoint: serialized.endpoint,
					provider: "webpush",
					subscription: serialized.subscription,
					user_agent: navigator.userAgent.slice(0, 500),
					last_seen_at: (/* @__PURE__ */ new Date()).toISOString()
				}, { onConflict: "user_id,endpoint" });
				if (error) console.debug("[call-notifications] subscription sync pending", error);
			}
			toast.success("Call and message notifications enabled");
		} else if (result.permission === "denied") toast.message("Notifications remain disabled");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CallCtx.Provider, {
		value,
		children: [
			children,
			showNotificationBanner && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-x-4 bottom-5 z-[200] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/95 p-4 text-white shadow-2xl backdrop-blur-2xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/20 text-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-5 w-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold",
							children: "Enable Call & Message Notifications"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-white/60",
							children: "Get notified when someone calls while YourWorld is closed."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => void enableNotifications(),
						className: "shrink-0 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground",
						children: "Enable"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							markCallNotificationBannerSeen();
							setShowNotificationBanner(false);
						},
						"aria-label": "Dismiss notification prompt",
						className: "absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3.5 w-3.5" })
					})
				]
			}),
			call && phase !== "idle" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `fixed inset-0 z-[100] flex flex-col justify-between overflow-hidden p-6 text-white ${phase === "incoming" ? "bg-zinc-950/95 backdrop-blur-xl" : "bg-zinc-950"}`,
				onClick: phase === "incoming" ? void 0 : () => {
					playRemoteMedia();
					pokeControls();
				},
				children: [
					phase !== "incoming" && call.mode === "audio" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute inset-0 z-0 overflow-hidden bg-[radial-gradient(circle_at_50%_34%,rgba(99,102,241,0.35),transparent_58%),linear-gradient(160deg,#09090b,#18122e_55%,#09090b)]",
						children: [
							peerAvatar && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: peerAvatar,
								alt: "",
								"aria-hidden": true,
								className: "absolute inset-0 h-full w-full scale-125 object-cover opacity-35 blur-3xl"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-black/35 backdrop-blur-3xl" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "absolute left-1/2 top-[40%] flex h-64 w-64 -translate-x-1/2 -translate-y-1/2 items-center justify-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-0 animate-ping rounded-full bg-indigo-400/10" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "absolute inset-5 animate-ping rounded-full bg-fuchsia-400/10",
										style: { animationDelay: "0.7s" }
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-10 rounded-full border border-white/20 bg-white/5 backdrop-blur-xl" }),
									peerAvatar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: peerAvatar,
										alt: call.peerName,
										className: "relative h-32 w-32 rounded-full object-cover shadow-[0_0_70px_rgba(129,140,248,0.5)]"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "relative grid h-32 w-32 place-items-center rounded-full bg-white/10 text-5xl font-bold shadow-[0_0_70px_rgba(129,140,248,0.5)] backdrop-blur-xl",
										children: call.peerName?.charAt(0)?.toUpperCase() || "?"
									})
								]
							})
						]
					}),
					call.mode === "video" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
							ref: remoteVideo,
							autoPlay: true,
							playsInline: true,
							muted: false,
							onLoadedMetadata: playRemoteMedia,
							onClick: swapped ? (e) => {
								e.stopPropagation();
								setSwapped(false);
							} : void 0,
							className: swapped ? "absolute right-4 top-28 z-20 h-40 w-28 cursor-pointer rounded-2xl border border-white/20 object-cover shadow-2xl transition-all active:scale-95" : "absolute inset-0 z-0 h-full w-full object-cover",
							style: { transform: "translateZ(0)" }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
							ref: localVideo,
							autoPlay: true,
							playsInline: true,
							muted: true,
							onClick: swapped ? void 0 : (e) => {
								e.stopPropagation();
								setSwapped(true);
							},
							className: swapped ? "absolute inset-0 z-0 h-full w-full object-cover" : "absolute right-4 top-28 z-20 h-40 w-28 cursor-pointer rounded-2xl border border-white/20 object-cover shadow-2xl transition-all active:scale-95",
							style: { transform: "translateZ(0)" }
						}),
						phase !== "incoming" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/55 via-transparent to-black/75" }),
						phase !== "incoming" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `absolute right-3 top-3 z-[9999] flex items-center gap-2 rounded-full border border-white/15 bg-black/40 p-1.5 shadow-lg backdrop-blur-xl transition-all duration-300 ${controlsVisible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"}`,
							onClick: (e) => e.stopPropagation(),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => void toggleFlash(),
								className: "grid h-9 w-9 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/10 active:scale-90",
								"aria-label": "Toggle flashlight",
								children: flashOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, {
									size: 17,
									className: "text-yellow-400"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZapOff, { size: 17 })
							})
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
						ref: remoteAudio,
						autoPlay: true,
						playsInline: true,
						muted: false,
						onLoadedMetadata: playRemoteMedia,
						className: "hidden"
					}),
					phase !== "incoming" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute left-1/2 top-[max(1.25rem,env(safe-area-inset-top,0px))] z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm font-semibold tracking-[0.12em] text-white/90 shadow-xl backdrop-blur-2xl",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: phase === "active" ? callClock : statusText }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1 text-[10px] tracking-normal text-emerald-300",
								title: "WebRTC media is protected by DTLS-SRTP. Application-level E2EE keying is not active in this web build.",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockKeyhole, { className: "h-3 w-3" }), "Encrypted"]
							}),
							networkState === "reconnecting" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1 text-[10px] tracking-normal text-amber-300",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-3 w-3 animate-spin" }), "Reconnecting"]
							})
						]
					}),
					phase === "incoming" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute inset-0 z-0 overflow-hidden bg-[radial-gradient(circle_at_50%_38%,rgba(168,85,247,0.34),transparent_36%),radial-gradient(circle_at_50%_72%,rgba(6,182,212,0.12),transparent_48%)]",
						children: [caller?.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: caller.avatar_url,
							alt: "",
							"aria-hidden": true,
							className: "h-full w-full scale-125 object-cover opacity-20 blur-3xl"
						}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-black/45 backdrop-blur-3xl" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-24 pt-12",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative flex h-52 w-52 items-center justify-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute h-36 w-36 scale-125 animate-pulse rounded-full border border-fuchsia-400/50 bg-fuchsia-500/10 opacity-40 shadow-[0_0_55px_rgba(217,70,239,0.5)]" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute h-36 w-36 scale-[1.45] animate-pulse rounded-full border border-cyan-300/40 bg-cyan-400/5 opacity-40 shadow-[0_0_70px_rgba(34,211,238,0.35)]",
									style: { animationDelay: "0.7s" }
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute h-44 w-44 rounded-full border border-white/15 bg-white/5 shadow-[0_0_70px_rgba(168,85,247,0.28)] backdrop-blur-xl" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "relative grid h-36 w-36 place-items-center overflow-hidden rounded-full border-2 border-white/40 shadow-[0_0_50px_rgba(168,85,247,0.4)]",
									children: caller?.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: caller.avatar_url,
										alt: caller.name,
										className: "h-28 w-28 rounded-full object-cover border-2 border-white/40"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-tr from-fuchsia-600 via-purple-600 to-cyan-500 text-5xl font-black text-white shadow-[0_0_50px_rgba(217,70,239,0.5)]",
										children: (caller?.name || "U").charAt(0).toUpperCase()
									})
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex flex-col items-center gap-3 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-6 text-3xl font-extrabold tracking-wider text-white drop-shadow-md",
								children: call.peerName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "inline-flex items-center gap-2 rounded-full border border-fuchsia-300/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 shadow-[0_0_24px_rgba(168,85,247,0.25)] backdrop-blur-2xl",
								children: [call.mode === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, { className: "h-4 w-4 text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.9)]" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "h-4 w-4 text-violet-300 drop-shadow-[0_0_8px_rgba(196,181,253,0.8)]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: call.mode === "video" ? "Incoming Video Call..." : "Incoming Audio Call..." })]
							})]
						})]
					})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `relative z-10 mt-12 flex flex-col gap-1 px-2 transition-opacity duration-300 ${controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-bold drop-shadow-lg",
							children: call.peerName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-bold text-emerald-400 drop-shadow-lg",
							children: phase === "active" ? "HD connection" : statusText
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative z-10 mb-[max(1.5rem,env(safe-area-inset-bottom,0px))] flex items-center justify-center gap-6",
						children: phase === "incoming" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex w-full items-center justify-center gap-16 px-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => void hangup(),
								className: "flex flex-col items-center gap-2.5 text-white/80 transition-transform active:scale-90",
								"aria-label": "Decline call",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-16 w-16 place-items-center rounded-full border border-red-500/50 bg-red-500/20 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-colors hover:bg-red-600",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneOff, { size: 26 })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-medium",
									children: "Decline"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => void accept(),
								className: "flex flex-col items-center gap-2.5 text-white transition-transform active:scale-90",
								"aria-label": "Accept call",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_0_35px_rgba(16,185,129,0.6)] transition-colors hover:bg-emerald-600",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { size: 26 })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-medium",
									children: "Accept"
								})]
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2.5 shadow-2xl backdrop-blur-2xl transition-all duration-300 ${controlsVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`,
							onClick: (e) => e.stopPropagation(),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: toggleMic,
									className: `grid h-11 w-11 place-items-center rounded-full transition-all active:scale-90 ${micOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-600 text-white"}`,
									"aria-label": "Toggle microphone",
									children: micOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { size: 19 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MicOff, { size: 19 })
								}),
								call.mode === "video" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: toggleCam,
									className: `grid h-11 w-11 place-items-center rounded-full transition-all active:scale-90 ${camOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-600 text-white"}`,
									"aria-label": "Toggle camera",
									children: camOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, { size: 19 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoOff, { size: 19 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: toggleSpeaker,
									className: "grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-90",
									"aria-label": "Toggle speaker",
									children: speakerOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { size: 19 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { size: 19 })
								}),
								call.mode === "video" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => void flipCamera(),
									className: "grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-90",
									"aria-label": "Flip camera",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchCamera, { size: 19 })
								}),
								call.mode === "video" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => void toggleScreenShare(),
									className: `grid h-11 w-11 place-items-center rounded-full transition-all active:scale-90 ${screenSharing ? "bg-cyan-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`,
									"aria-label": screenSharing ? "Stop screen sharing" : "Share screen",
									title: screenSharing ? "Stop screen sharing" : "Share screen",
									children: screenSharing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonitorUp, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonitorUp, { size: 18 })
								}),
								call.mode === "video" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => {
										const next = CALL_VIDEO_EFFECTS[(CALL_VIDEO_EFFECTS.findIndex((item) => item.value === videoEffect) + 1) % CALL_VIDEO_EFFECTS.length].value;
										applyVideoEffect(next);
									},
									className: `grid h-11 w-11 place-items-center rounded-full transition-all active:scale-90 ${videoEffect !== "none" ? "bg-fuchsia-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`,
									"aria-label": `Video effect: ${CALL_VIDEO_EFFECTS.find((item) => item.value === videoEffect)?.label ?? "None"}`,
									title: `Video effect: ${CALL_VIDEO_EFFECTS.find((item) => item.value === videoEffect)?.label ?? "None"}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 18 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => void hangup(),
									className: "grid h-12 w-12 place-items-center rounded-full bg-red-600 text-white shadow-[0_8px_24px_-6px_rgba(220,38,38,0.8)] transition-transform active:scale-90",
									"aria-label": "End call",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneOff, { size: 20 })
								})
							]
						})
					})
				]
			})
		]
	});
}
var UploadCtx = (0, import_react.createContext)(null);
function useUploads() {
	const ctx = (0, import_react.useContext)(UploadCtx);
	if (!ctx) throw new Error("useUploads must be used inside <UploadProvider>");
	return ctx;
}
function UploadProvider({ children }) {
	const [tasks, setTasks] = (0, import_react.useState)([]);
	const timers = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	(0, import_react.useEffect)(() => () => {
		timers.current.forEach(clearTimeout);
		timers.current.clear();
	}, []);
	const patch = (0, import_react.useCallback)((id, next) => {
		setTasks((prev) => prev.map((t) => t.id === id ? {
			...t,
			...next
		} : t));
	}, []);
	const dismiss = (0, import_react.useCallback)((id) => {
		const timer = timers.current.get(id);
		if (timer) {
			clearTimeout(timer);
			timers.current.delete(id);
		}
		setTasks((prev) => prev.filter((t) => t.id !== id));
	}, []);
	const startUpload = (0, import_react.useCallback)(async (meta, runner) => {
		const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
		setTasks((prev) => [...prev, {
			id,
			progress: 0,
			status: "uploading",
			...meta
		}]);
		const run = async () => {
			const previousTimer = timers.current.get(id);
			if (previousTimer) {
				clearTimeout(previousTimer);
				timers.current.delete(id);
			}
			patch(id, {
				progress: 0,
				status: "processing",
				error: null,
				detail: null,
				retry: void 0
			});
			let result;
			try {
				result = await runner((p, detail) => patch(id, {
					progress: p,
					status: detail?.toLowerCase().includes("optim") || p >= 100 ? "processing" : "uploading",
					detail: detail ?? null
				}));
			} catch (e) {
				result = { error: e instanceof Error ? e.message : "Upload failed" };
			}
			if (result.error) {
				patch(id, {
					status: "error",
					error: result.error,
					detail: null,
					retry: () => void run()
				});
				timers.current.set(id, setTimeout(() => dismiss(id), 3e4));
			} else {
				patch(id, {
					status: "done",
					progress: 100,
					detail: null,
					retry: void 0
				});
				timers.current.set(id, setTimeout(() => dismiss(id), 6e3));
			}
			return result;
		};
		return run();
	}, [patch, dismiss]);
	const active = tasks.some((t) => t.status === "uploading" || t.status === "processing");
	(0, import_react.useEffect)(() => {
		if (!active) return;
		const handler = (e) => {
			e.preventDefault();
			e.returnValue = "";
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [active]);
	const value = (0, import_react.useMemo)(() => ({
		tasks,
		startUpload,
		dismiss
	}), [
		tasks,
		startUpload,
		dismiss
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(UploadCtx.Provider, {
		value,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UploadProgressStack, {})]
	});
}
var TITLE = {
	reel: "Uploading reel",
	video: "Uploading video",
	post: "Uploading post",
	moment: "Uploading moment"
};
function UploadProgressStack() {
	const { tasks, dismiss } = useUploads();
	if (!tasks.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none fixed inset-x-0 top-0 z-[70] flex flex-col items-center gap-2 px-3 pt-3",
		children: tasks.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "status",
			"aria-live": "polite",
			className: "pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-[#141418]/95 shadow-xl backdrop-blur-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 px-3 py-2.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-900",
							children: t.thumbnail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: t.thumbnail,
								alt: "",
								className: "h-full w-full object-cover"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid h-full w-full place-items-center text-zinc-500",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
									size: 16,
									className: "animate-spin"
								})
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-[13px] font-semibold text-white",
								children: t.status === "done" ? "Upload complete" : t.status === "error" ? "Upload failed" : TITLE[t.kind]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-[11px] text-zinc-400",
								children: t.status === "error" ? t.error : t.status === "done" ? t.label : t.detail ? `${t.progress}% · ${t.detail}` : t.status === "processing" ? "Finishing up…" : `${t.progress}% · ${t.label}`
							})]
						}),
						t.status === "done" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: t.viewTo,
							onClick: () => dismiss(t.id),
							className: "shrink-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-1.5 text-[11px] font-bold text-white",
							children: "View"
						}) : t.status === "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex shrink-0 items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
								size: 18,
								className: "text-red-400"
							}), t.retry && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: t.retry,
								className: "flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-bold text-red-300",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { size: 12 }), " Retry"]
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "shrink-0 text-[11px] font-bold tabular-nums text-pink-400",
							children: [t.progress, "%"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => dismiss(t.id),
							"aria-label": "Dismiss upload notification",
							className: "shrink-0 text-zinc-500 hover:text-white",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 15 })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-1 w-full bg-zinc-800",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `h-full transition-[width] duration-300 ${t.status === "error" ? "bg-red-500" : t.status === "done" ? "bg-emerald-500" : "bg-gradient-to-r from-pink-500 to-purple-500"}`,
						style: { width: `${t.status === "done" ? 100 : t.progress}%` }
					})
				}),
				t.status === "done" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "sr-only",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { size: 12 }), " done"]
				})
			]
		}, t.id))
	});
}
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
var netFor = (source, gross) => {
	const key = source === "ads" || source === "course" || source === "vip" ? source : "ads";
	return computeBreakdown({
		ads: key === "ads" ? gross : 0,
		course: key === "course" ? gross : 0,
		vip: key === "vip" ? gross : 0
	}).net;
};
/** Atomic pop-up whenever earnings land in the creator's wallet. */
function EarningsCreditWatcher() {
	(0, import_react.useEffect)(() => {
		let channel = null;
		let cancelled = false;
		(async () => {
			const { data } = await supabase.auth.getUser();
			const uid = data.user?.id;
			if (!uid || cancelled) return;
			channel = supabase.channel(`earnings-credit-${uid}`).on("postgres_changes", {
				event: "INSERT",
				schema: "public",
				table: "creator_earnings",
				filter: `user_id=eq.${uid}`
			}, (payload) => {
				const row = payload.new;
				const net = netFor(String(row.source ?? "ads"), Number(row.gross_amount ?? 0));
				if (net <= 0) return;
				toast.success(`Earnings credited: ${inr(net)} added to your Monetization Wallet.`);
			}).subscribe();
		})();
		return () => {
			cancelled = true;
			if (channel) supabase.removeChannel(channel);
		};
	}, []);
	return null;
}
/**
* Catches render errors from a single provider subtree so one broken
* provider (Realtime, calls, moments, etc.) does NOT take down the whole
* app with a generic "This page didn't load" screen.
*
* On error it renders `null` (the provider's data is just unavailable) and
* logs the failure so we can diagnose it later.
*/
var SafeProvider = class extends import_react.Component {
	state = { hasError: false };
	static getDerivedStateFromError() {
		return { hasError: true };
	}
	componentDidCatch(error, info) {
		console.error(`[SafeProvider:${this.props.name}]`, error, info.componentStack);
	}
	render() {
		if (this.state.hasError) return this.props.fallback ?? null;
		return this.props.children;
	}
};
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error("[RootErrorBoundary]", error);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or heading back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "mt-4 max-h-40 overflow-auto rounded-lg bg-zinc-900 p-3 text-left text-[11px] leading-tight text-red-300 whitespace-pre-wrap break-all",
					children: String(error?.message ?? error)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							reset();
							window.location.reload();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$46 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, interactive-widget=resizes-content"
			},
			{ title: "YourWorld — Share your world" },
			{
				name: "description",
				content: "YourWorld (YW) is a social app for moments, feeds and full-screen reels."
			},
			{
				name: "theme-color",
				content: "#0e0e14"
			},
			{
				name: "apple-mobile-web-app-capable",
				content: "yes"
			},
			{
				name: "apple-mobile-web-app-status-bar-style",
				content: "black-translucent"
			},
			{
				property: "og:title",
				content: "YourWorld — Share your world"
			},
			{
				property: "og:description",
				content: "Moments, feed and full-screen reels in one dark, fast social app."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "preconnect",
				href: "https://mvvliwuldgcmrqffrfgi.supabase.co"
			},
			{
				rel: "dns-prefetch",
				href: "https://mvvliwuldgcmrqffrfgi.supabase.co"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap"
			},
			{
				rel: "manifest",
				href: "/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/icon-512.png"
			},
			{
				rel: "icon",
				href: "/favicon.png",
				type: "image/png"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$46.useRouteContext();
	const { pathname } = useLocation();
	const [createOpen, setCreateOpen] = (0, import_react.useState)(false);
	const hideNav = pathname.startsWith("/orbit") || pathname.startsWith("/auth") || pathname.startsWith("/create") || pathname.startsWith("/moment/create") || pathname.startsWith("/channel/create");
	(0, import_react.useEffect)(() => {
		setCreateOpen(false);
		toast.dismiss();
	}, [pathname]);
	(0, import_react.useEffect)(() => {
		const onError = (e) => {
			console.error("[globalError]", e.message, e.filename, e.lineno);
		};
		const onRejection = (e) => {
			console.error("[unhandledRejection]", e.reason);
		};
		window.addEventListener("error", onError);
		window.addEventListener("unhandledrejection", onRejection);
		return () => {
			window.removeEventListener("error", onError);
			window.removeEventListener("unhandledrejection", onRejection);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdaptiveMediaController, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SafeProvider, {
			name: "YwStore",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(YwStoreProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SafeProvider, {
				name: "Notifications",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotificationsProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SafeProvider, {
					name: "Moments",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MomentProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SafeProvider, {
						name: "Search",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SearchProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SafeProvider, {
							name: "Channel",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChannelProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SafeProvider, {
								name: "Call",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CallProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SafeProvider, {
									name: "Upload",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(UploadProvider, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthGate, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: cn("mx-auto min-h-screen w-full max-w-lg", hideNav ? "" : "pb-20"),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
											}),
											!hideNav && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, { onOpenCreate: () => setCreateOpen(true) }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreateSheet, {
												isOpen: createOpen,
												onClose: () => setCreateOpen(false)
											})
										] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EarningsCreditWatcher, {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, { position: "top-center" })
									] })
								}) })
							}) })
						}) })
					}) })
				}) })
			}) })
		}) })]
	});
}
var $$splitComponentImporter$44 = () => import("./routes-DnIUdxSA.mjs");
var Route$45 = createFileRoute("/")({
	component: lazyRouteComponent($$splitComponentImporter$44, "component"),
	head: () => ({ meta: [
		{ title: "YourWorld – Moments, Reels & Chat" },
		{
			name: "description",
			content: "YourWorld (YW) is a premium social app for sharing moments, reels, stories and private chat."
		},
		{
			property: "og:title",
			content: "YourWorld – Moments, Reels & Chat"
		},
		{
			property: "og:description",
			content: "Share moments, watch reels and chat privately on YourWorld."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] })
});
var $$splitComponentImporter$43 = () => import("./route-Di7iQBCH.mjs");
var Route$44 = createFileRoute("/_authenticated")({
	ssr: false,
	beforeLoad: async ({ location }) => {
		const { data, error } = await supabase.auth.getUser();
		if (error || !data.user) throw redirect({
			to: "/auth",
			search: { redirect: location.href }
		});
		return { user: data.user };
	},
	component: lazyRouteComponent($$splitComponentImporter$43, "component")
});
var $$splitComponentImporter$42 = () => import("./account-BQWL_kLx.mjs");
var Route$43 = createFileRoute("/account")({
	head: () => ({ meta: [{ title: "Account — YourWorld" }] }),
	component: lazyRouteComponent($$splitComponentImporter$42, "component")
});
var $$splitComponentImporter$41 = () => import("./auth-BPkA5WS7.mjs");
var Route$42 = createFileRoute("/auth")({ component: lazyRouteComponent($$splitComponentImporter$41, "component") });
var $$splitComponentImporter$40 = () => import("./channel-DOqQDY5z.mjs");
var Route$41 = createFileRoute("/channel")({ component: lazyRouteComponent($$splitComponentImporter$40, "component") });
var $$splitComponentImporter$39 = () => import("./copyright-policy-CU2VgRpK.mjs");
var Route$40 = createFileRoute("/copyright-policy")({
	head: () => ({ meta: [
		{ title: "Copyright & DMCA Policy — YourWorld" },
		{
			name: "description",
			content: "YourWorld respects intellectual property. Read our DMCA Safe Harbor policy, takedown procedure, designated copyright agent, and repeat infringer policy."
		},
		{
			property: "og:title",
			content: "Copyright & DMCA Policy — YourWorld"
		},
		{
			property: "og:description",
			content: "DMCA Safe Harbor policy, takedown procedure, designated copyright agent, counter-notification and repeat infringer policy for YourWorld."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$39, "component")
});
var $$splitComponentImporter$38 = () => import("./create-BUXNIjai.mjs");
var Route$39 = createFileRoute("/create")({
	validateSearch: (search) => ({ mode: search.mode === "live" ? "live" : "reel" }),
	head: () => ({ meta: [{ title: "Upload a Reel — YourWorld" }, {
		name: "description",
		content: "Upload and publish a Reel directly from your device."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$38, "component")
});
var $$splitComponentImporter$37 = () => import("./licenses-BYcusFDE.mjs");
var Route$38 = createFileRoute("/licenses")({
	head: () => ({ meta: [
		{ title: "Open Source Licenses — YourWorld" },
		{
			name: "description",
			content: "Open source licenses and attributions for the libraries and components used in YourWorld."
		},
		{
			property: "og:title",
			content: "Open Source Licenses — YourWorld"
		},
		{
			property: "og:description",
			content: "Open source licenses and attributions for YourWorld."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$37, "component")
});
var $$splitComponentImporter$36 = () => import("./notifications-BkGrdqUP.mjs");
var Route$37 = createFileRoute("/notifications")({
	head: () => ({ meta: [
		{ title: "Notifications — YourWorld" },
		{
			name: "description",
			content: "Real-time likes, comments, followers, Orbit matches, messages, channel, verification and monetization alerts on YourWorld."
		},
		{
			property: "og:title",
			content: "Notifications — YourWorld"
		},
		{
			property: "og:description",
			content: "Every YourWorld alert in one premium, real-time activity feed."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$36, "component")
});
var $$splitComponentImporter$35 = () => import("./orbit-DNcvURXK.mjs");
var Route$36 = createFileRoute("/orbit")({ component: lazyRouteComponent($$splitComponentImporter$35, "component") });
var $$splitComponentImporter$34 = () => import("./privacy-CoY-PyCl.mjs");
var Route$35 = createFileRoute("/privacy")({
	head: () => ({ meta: [
		{ title: "Privacy Policy — YourWorld" },
		{
			name: "description",
			content: "YourWorld Privacy Policy — how we collect, use, store, and protect your personal information and content."
		},
		{
			property: "og:title",
			content: "Privacy Policy — YourWorld"
		},
		{
			property: "og:description",
			content: "How YourWorld collects, uses, stores, and protects your personal information and content."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$34, "component")
});
var $$splitComponentImporter$33 = () => import("./profile-BFRpCchY.mjs");
var Route$34 = createFileRoute("/profile")({
	head: () => ({ meta: [
		{ title: "Profile — YourWorld" },
		{
			name: "description",
			content: "Your YourWorld profile: followers, following, saved posts, reels and account settings."
		},
		{
			property: "og:title",
			content: "Profile — YourWorld"
		},
		{
			property: "og:description",
			content: "Followers, following, saved posts and settings on YourWorld."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$33, "component")
});
var $$splitComponentImporter$32 = () => import("./reels-CCl7o7oB.mjs");
var Route$33 = createFileRoute("/reels")({
	validateSearch: (search) => {
		const reelId = typeof search.reelId === "string" ? search.reelId.trim() : "";
		const userId = typeof search.userId === "string" ? search.userId.trim() : "";
		const initialVideoId = typeof search.initialVideoId === "string" ? search.initialVideoId.trim() : "";
		const returnTo = search.returnTo === "profile" || search.returnTo === "public" ? search.returnTo : void 0;
		return {
			reelId: reelId || void 0,
			userId: userId || void 0,
			initialVideoId: initialVideoId || void 0,
			returnTo
		};
	},
	head: () => ({ meta: [
		{ title: "Reels — YourWorld" },
		{
			name: "description",
			content: "Full-screen vertical reels you swipe through: like, comment, share, save and download when the creator allows it."
		},
		{
			property: "og:title",
			content: "Reels — YourWorld"
		},
		{
			property: "og:description",
			content: "Swipe through full-screen vertical reels on YourWorld."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$32, "component")
});
/**
* Renders reel media with graceful recovery: if the stored URL fails to load
* (expired signed URL, missing public URL) we retry with a freshly resolved
* Supabase URL, then with a local blob URL from this session, then fall back
* to an image.
*/
var $$splitComponentImporter$31 = () => import("./reset-password-C6v_0oxB.mjs");
var Route$32 = createFileRoute("/reset-password")({
	head: () => ({ meta: [
		{ title: "Set a new password — YourWorld" },
		{
			name: "description",
			content: "Choose a new password for your YourWorld account."
		},
		{
			property: "og:title",
			content: "Set a new password — YourWorld"
		},
		{
			property: "og:description",
			content: "Choose a new password for your YourWorld account."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$31, "component")
});
var $$splitComponentImporter$30 = () => import("./search-BVqQdgkG.mjs");
var Route$31 = createFileRoute("/search")({
	head: () => ({ meta: [{ title: "Search · YourWorld" }] }),
	component: lazyRouteComponent($$splitComponentImporter$30, "component")
});
var $$splitComponentImporter$29 = () => import("./settings-fOgfiBp_.mjs");
var Route$30 = createFileRoute("/settings")({
	head: () => ({ meta: [
		{ title: "Settings — YourWorld" },
		{
			name: "description",
			content: "Manage your YourWorld account, privacy, notifications, appearance and support preferences in one place."
		},
		{
			property: "og:title",
			content: "Settings — YourWorld"
		},
		{
			property: "og:description",
			content: "Account, privacy, notifications, appearance and support settings for YourWorld."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$29, "component")
});
var BASE_URL = "";
var Route$29 = createFileRoute("/sitemap.xml")({ server: { handlers: { GET: async () => {
	const xml = [
		`<?xml version="1.0" encoding="UTF-8"?>`,
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
		...[
			{
				path: "/",
				changefreq: "hourly",
				priority: "1.0"
			},
			{
				path: "/reels",
				changefreq: "hourly",
				priority: "0.9"
			},
			{
				path: "/create",
				changefreq: "monthly",
				priority: "0.5"
			},
			{
				path: "/profile",
				changefreq: "daily",
				priority: "0.6"
			}
		].map((e) => [
			`  <url>`,
			`    <loc>${BASE_URL}${e.path}</loc>`,
			e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
			e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
			e.priority ? `    <priority>${e.priority}</priority>` : null,
			`  </url>`
		].filter(Boolean).join("\n")),
		`</urlset>`
	].join("\n");
	return new Response(xml, { headers: {
		"Content-Type": "application/xml",
		"Cache-Control": "public, max-age=3600"
	} });
} } } });
var $$splitComponentImporter$28 = () => import("./terms-CI9_OL7X.mjs");
var Route$28 = createFileRoute("/terms")({
	head: () => ({ meta: [
		{ title: "Terms of Service — YourWorld" },
		{
			name: "description",
			content: "YourWorld Terms of Service — the rules and conditions that govern your use of the YourWorld social platform."
		},
		{
			property: "og:title",
			content: "Terms of Service — YourWorld"
		},
		{
			property: "og:description",
			content: "Rules and conditions that govern your use of the YourWorld social platform."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$28, "component")
});
var $$splitComponentImporter$27 = () => import("./wallet-CuTgoq-V.mjs");
var Route$27 = createFileRoute("/wallet")({
	head: () => ({ meta: [
		{ title: "Monetization & Wallet — YourWorld" },
		{
			name: "description",
			content: "Track creator earnings, course sales, VIP memberships, payouts and download GST/TDS tax invoices."
		},
		{
			property: "og:title",
			content: "Monetization & Wallet — YourWorld"
		},
		{
			property: "og:description",
			content: "Earnings, courses, payouts and tax invoices for YourWorld creators."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$27, "component")
});
var $$splitComponentImporter$26 = () => import("./admin.copyright-reports-FIUQ60O3.mjs");
var Route$26 = createFileRoute("/admin/copyright-reports")({
	head: () => ({ meta: [
		{ title: "DMCA Reports Admin — YourWorld" },
		{
			name: "description",
			content: "Review copyright takedown reports, compare reported media with proof links, and resolve claims."
		},
		{
			property: "og:title",
			content: "DMCA Reports Admin — YourWorld"
		},
		{
			property: "og:description",
			content: "Admin dashboard for reviewing YourWorld copyright takedown reports."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$26, "component")
});
var $$splitComponentImporter$25 = () => import("./channel.index-FuPPrQ2y.mjs");
var Route$25 = createFileRoute("/channel/")({ component: lazyRouteComponent($$splitComponentImporter$25, "component") });
var $$splitComponentImporter$24 = () => import("./channel.analytics-BWL1tTxF.mjs");
var Route$24 = createFileRoute("/channel/analytics")({
	head: () => ({ meta: [
		{ title: "Channel Analytics — YourWorld" },
		{
			name: "description",
			content: "Views, watch time, subscriber growth and top performing content for your channel."
		},
		{
			property: "og:title",
			content: "Channel Analytics — YourWorld"
		},
		{
			property: "og:description",
			content: "Understand how your channel is growing on YourWorld."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$24, "component")
});
var $$splitComponentImporter$23 = () => import("./channel.create-OXsS-Mw9.mjs");
var Route$23 = createFileRoute("/channel/create")({
	head: () => ({ meta: [
		{ title: "Create your Channel — YourWorld" },
		{
			name: "description",
			content: "Set up a YourWorld Channel with a logo, banner, category and description. Publish videos, reels and posts to your subscribers."
		},
		{
			property: "og:title",
			content: "Create your Channel — YourWorld"
		},
		{
			property: "og:description",
			content: "Launch a premium channel with analytics, subscribers and monetization."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$23, "component")
});
var $$splitComponentImporter$22 = () => import("./channel.monetization-DyRG32s7.mjs");
var Route$22 = createFileRoute("/channel/monetization")({
	head: () => ({ meta: [
		{ title: "Channel Monetization — YourWorld" },
		{
			name: "description",
			content: "Check your monetization eligibility and start earning from your YourWorld channel once you qualify."
		},
		{
			property: "og:title",
			content: "Channel Monetization — YourWorld"
		},
		{
			property: "og:description",
			content: "Eligibility, requirements and earnings for your channel."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$22, "component")
});
var $$splitComponentImporter$21 = () => import("./channel.posts-B3vljSYz.mjs");
var Route$21 = createFileRoute("/channel/posts")({
	head: () => ({ meta: [
		{ title: "Channel Posts — YourWorld" },
		{
			name: "description",
			content: "Manage and review the posts published on your YourWorld channel."
		},
		{
			property: "og:title",
			content: "Channel Posts — YourWorld"
		},
		{
			property: "og:description",
			content: "Performance of every item published to your channel."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$21, "component")
});
var $$splitComponentImporter$20 = () => import("./channel.reels-DAIkXEmQ.mjs");
var Route$20 = createFileRoute("/channel/reels")({
	head: () => ({ meta: [
		{ title: "Channel Reels — YourWorld" },
		{
			name: "description",
			content: "Manage and review the reels published on your YourWorld channel."
		},
		{
			property: "og:title",
			content: "Channel Reels — YourWorld"
		},
		{
			property: "og:description",
			content: "Performance of every item published to your channel."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$20, "component")
});
var $$splitComponentImporter$19 = () => import("./channel.subscribers-D93pmt1g.mjs");
var Route$19 = createFileRoute("/channel/subscribers")({
	head: () => ({ meta: [
		{ title: "Channel Subscribers — YourWorld" },
		{
			name: "description",
			content: "See who subscribed to your channel and when they joined."
		},
		{
			property: "og:title",
			content: "Channel Subscribers — YourWorld"
		},
		{
			property: "og:description",
			content: "Your recent subscribers on YourWorld."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$19, "component")
});
var $$splitComponentImporter$18 = () => import("./channel.videos-Cbiu71jx.mjs");
var Route$18 = createFileRoute("/channel/videos")({
	head: () => ({ meta: [
		{ title: "Channel Videos — YourWorld" },
		{
			name: "description",
			content: "Manage and review the videos published on your YourWorld channel."
		},
		{
			property: "og:title",
			content: "Channel Videos — YourWorld"
		},
		{
			property: "og:description",
			content: "Performance of every item published to your channel."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$18, "component")
});
var $$splitComponentImporter$17 = () => import("./moment.index-CrhIICK1.mjs");
var Route$17 = createFileRoute("/moment/")({
	head: () => ({ meta: [
		{ title: "Your Moments — YourWorld" },
		{
			name: "description",
			content: "Browse the moments you shared, check views and likes, revisit your archive or capture a new moment."
		},
		{
			property: "og:title",
			content: "Your Moments — YourWorld"
		},
		{
			property: "og:description",
			content: "Your live moments, archive, views and likes in one place."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$17, "component")
});
var $$splitComponentImporter$16 = () => import("./moment._momentId-BlSQZawB.mjs");
/** photo / text segment length (ms) */
/** Must stay aligned with the upload trim windows. */
var Route$16 = createFileRoute("/moment/$momentId")({
	head: () => ({ meta: [
		{ title: "Moment — YourWorld" },
		{
			name: "description",
			content: "Watch this moment on YourWorld with Snapchat-style segmented playback."
		},
		{
			property: "og:title",
			content: "Moment — YourWorld"
		},
		{
			property: "og:description",
			content: "Watch this moment on YourWorld."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$16, "component")
});
var $$splitComponentImporter$15 = () => import("./moment.create-V9-hALME.mjs");
var Route$15 = createFileRoute("/moment/create")({ component: lazyRouteComponent($$splitComponentImporter$15, "component") });
var $$splitComponentImporter$14 = () => import("./orbit.index-BvDJqCyG.mjs");
var Route$14 = createFileRoute("/orbit/")({
	head: () => ({ meta: [
		{ title: "Orbit — Private social discovery on YourWorld" },
		{
			name: "description",
			content: "Browse Orbit profiles anonymously. Create an Orbit Profile to like, message, connect and match — with approximate location only."
		},
		{
			property: "og:title",
			content: "Orbit — Private social discovery on YourWorld"
		},
		{
			property: "og:description",
			content: "Privacy-first discovery: browse freely, unlock Orbit features when you're ready."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$14, "component")
});
var $$splitComponentImporter$13 = () => import("./orbit._profileId-BuXvVquB.mjs");
var Route$13 = createFileRoute("/orbit/$profileId")({
	head: () => ({ meta: [
		{ title: "Orbit Profile — YourWorld" },
		{
			name: "description",
			content: "View a full Orbit profile: hobbies, about and approximate area only — never an exact location."
		},
		{
			property: "og:title",
			content: "Orbit Profile — YourWorld"
		},
		{
			property: "og:description",
			content: "Full Orbit profile with privacy-first, approximate location only."
		},
		{
			property: "og:type",
			content: "profile"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
var $$splitComponentImporter$12 = () => import("./orbit.create-Be7i2d9-.mjs");
var Route$12 = createFileRoute("/orbit/create")({
	head: () => ({ meta: [
		{ title: "Create your Orbit Profile — YourWorld" },
		{
			name: "description",
			content: "Set up an Orbit Profile to like, message, connect and match. Separate from your main profile and deletable anytime."
		},
		{
			property: "og:title",
			content: "Create your Orbit Profile — YourWorld"
		},
		{
			property: "og:description",
			content: "A separate, private Orbit identity with approximate location only."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$12, "component")
});
var $$splitComponentImporter$11 = () => import("./orbit.me-C7vSOxiQ.mjs");
var Route$11 = createFileRoute("/orbit/me")({
	head: () => ({ meta: [
		{ title: "My Orbit Profile — YourWorld" },
		{
			name: "description",
			content: "See your own Orbit profile exactly as others do, edit your details, and add photos or an intro video."
		},
		{
			property: "og:title",
			content: "My Orbit Profile — YourWorld"
		},
		{
			property: "og:description",
			content: "View and edit your Orbit profile, photos and intro video."
		},
		{
			property: "og:type",
			content: "profile"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
var $$splitComponentImporter$10 = () => import("./orbit.messages-DXjtADM2.mjs");
var Route$10 = createFileRoute("/orbit/messages")({
	head: () => ({ meta: [
		{ title: "Orbit Messages & Matches — YourWorld" },
		{
			name: "description",
			content: "Your private Orbit chats, pending requests and mutual matches — kept separate from your main YourWorld conversations."
		},
		{
			property: "og:title",
			content: "Orbit Messages & Matches — YourWorld"
		},
		{
			property: "og:description",
			content: "Private Orbit chats, requests and mutual matches in one place."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("./orbit.notifications-RGNd05Ua.mjs");
var Route$9 = createFileRoute("/orbit/notifications")({
	head: () => ({ meta: [
		{ title: "Orbit Notifications — YourWorld" },
		{
			name: "description",
			content: "Orbit, connection and match alerts, kept private inside the Orbit section of YourWorld."
		},
		{
			property: "og:title",
			content: "Orbit Notifications — YourWorld"
		},
		{
			property: "og:description",
			content: "Your Orbit, connection and match alerts in one private place."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./orbit.privacy-BjoyE2kq.mjs");
var Route$8 = createFileRoute("/orbit/privacy")({
	head: () => ({ meta: [
		{ title: "Orbit Privacy & Safety — YourWorld" },
		{
			name: "description",
			content: "Control Orbit visibility, who can like, message and connect, hidden and blocked users, and screen-capture protection."
		},
		{
			property: "og:title",
			content: "Orbit Privacy & Safety — YourWorld"
		},
		{
			property: "og:description",
			content: "Visibility, permissions, hidden users, blocking and capture protection for Orbit."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./post.create-Bt6RNCTu.mjs");
var Route$7 = createFileRoute("/post/create")({
	head: () => ({ meta: [
		{ title: "Create a Post — YourWorld" },
		{
			name: "description",
			content: "Share a photo or video post on YourWorld with a caption, hashtags, location and audience controls."
		},
		{
			property: "og:title",
			content: "Create a Post — YourWorld"
		},
		{
			property: "og:description",
			content: "Post a photo or video with caption, hashtags and location to your YourWorld feed."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./reel._reelId-RQeklAQu.mjs");
/**
* Keep direct reel detail links compatible with the full-screen reel player.
* The player owns loading, not-found handling, and focus behavior on /reels.
*/
var Route$6 = createFileRoute("/reel/$reelId")({
	beforeLoad: ({ params }) => {
		const reelId = typeof params.reelId === "string" ? params.reelId.trim() : "";
		throw redirect({
			to: "/reels",
			search: {
				reelId: reelId || void 0,
				userId: void 0,
				initialVideoId: void 0,
				returnTo: void 0
			}
		});
	},
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./u._userId-CF7YPf8E.mjs");
var Route$5 = createFileRoute("/u/$userId")({
	head: () => ({ meta: [
		{ title: "Creator Profile — YourWorld" },
		{
			name: "description",
			content: "View a YourWorld creator profile: their posts, reels, long videos, followers and following."
		},
		{
			property: "og:title",
			content: "Creator Profile — YourWorld"
		},
		{
			property: "og:description",
			content: "Posts, reels and videos from a YourWorld creator."
		},
		{
			property: "og:type",
			content: "profile"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitNotFoundComponentImporter = () => import("./video._videoId-BLgeTCLN.mjs");
var $$splitErrorComponentImporter = () => import("./video._videoId-DluYQf7j.mjs");
var $$splitComponentImporter$4 = () => import("./video._videoId-ChKN8BAg.mjs");
var Route$4 = createFileRoute("/video/$videoId")({
	component: lazyRouteComponent($$splitComponentImporter$4, "component"),
	errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent"),
	notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent")
});
var $$splitComponentImporter$3 = () => import("./video.upload-wHtGA7Ho.mjs");
var Route$3 = createFileRoute("/video/upload")({
	head: () => ({ meta: [
		{ title: "Upload a Long Video — YourWorld" },
		{
			name: "description",
			content: "Upload long-form horizontal or vertical videos to YourWorld with a title, description, custom thumbnail, categories and scheduled release."
		},
		{
			property: "og:title",
			content: "Upload a Long Video — YourWorld"
		},
		{
			property: "og:description",
			content: "Publish or schedule long-form videos with thumbnails and categories."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./chat.index-CWtmK-mI.mjs");
var Route$2 = createFileRoute("/_authenticated/chat/")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./chat._threadId-BPE8SZAr.mjs");
var Route$1 = createFileRoute("/_authenticated/chat/$threadId")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./orbit.chat._userId-XzJpOizZ.mjs");
var Route = createFileRoute("/orbit/chat/$userId")({
	head: () => ({ meta: [
		{ title: "Orbit Chat — YourWorld" },
		{
			name: "description",
			content: "A private Orbit conversation, kept separate from your main YourWorld chats."
		},
		{
			property: "og:title",
			content: "Orbit Chat — YourWorld"
		},
		{
			property: "og:description",
			content: "Private one-to-one Orbit conversation."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
/** Invites travel as a tagged text message so both sides see the same card. */
var IndexRoute = Route$45.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$46
});
var AuthenticatedRouteRoute = Route$44.update({
	id: "/_authenticated",
	getParentRoute: () => Route$46
});
var AccountRoute = Route$43.update({
	id: "/account",
	path: "/account",
	getParentRoute: () => Route$46
});
var AuthRoute = Route$42.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$46
});
var ChannelRoute = Route$41.update({
	id: "/channel",
	path: "/channel",
	getParentRoute: () => Route$46
});
var CopyrightPolicyRoute = Route$40.update({
	id: "/copyright-policy",
	path: "/copyright-policy",
	getParentRoute: () => Route$46
});
var CreateRoute = Route$39.update({
	id: "/create",
	path: "/create",
	getParentRoute: () => Route$46
});
var LicensesRoute = Route$38.update({
	id: "/licenses",
	path: "/licenses",
	getParentRoute: () => Route$46
});
var NotificationsRoute = Route$37.update({
	id: "/notifications",
	path: "/notifications",
	getParentRoute: () => Route$46
});
var OrbitRoute = Route$36.update({
	id: "/orbit",
	path: "/orbit",
	getParentRoute: () => Route$46
});
var PrivacyRoute = Route$35.update({
	id: "/privacy",
	path: "/privacy",
	getParentRoute: () => Route$46
});
var ProfileRoute = Route$34.update({
	id: "/profile",
	path: "/profile",
	getParentRoute: () => Route$46
});
var ReelsRoute = Route$33.update({
	id: "/reels",
	path: "/reels",
	getParentRoute: () => Route$46
});
var ResetPasswordRoute = Route$32.update({
	id: "/reset-password",
	path: "/reset-password",
	getParentRoute: () => Route$46
});
var SearchRoute = Route$31.update({
	id: "/search",
	path: "/search",
	getParentRoute: () => Route$46
});
var SettingsRoute = Route$30.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => Route$46
});
var SitemapDotxmlRoute = Route$29.update({
	id: "/sitemap.xml",
	path: "/sitemap.xml",
	getParentRoute: () => Route$46
});
var TermsRoute = Route$28.update({
	id: "/terms",
	path: "/terms",
	getParentRoute: () => Route$46
});
var WalletRoute = Route$27.update({
	id: "/wallet",
	path: "/wallet",
	getParentRoute: () => Route$46
});
var AdminCopyrightReportsRoute = Route$26.update({
	id: "/admin/copyright-reports",
	path: "/admin/copyright-reports",
	getParentRoute: () => Route$46
});
var ChannelIndexRoute = Route$25.update({
	id: "/",
	path: "/",
	getParentRoute: () => ChannelRoute
});
var ChannelAnalyticsRoute = Route$24.update({
	id: "/analytics",
	path: "/analytics",
	getParentRoute: () => ChannelRoute
});
var ChannelCreateRoute = Route$23.update({
	id: "/create",
	path: "/create",
	getParentRoute: () => ChannelRoute
});
var ChannelMonetizationRoute = Route$22.update({
	id: "/monetization",
	path: "/monetization",
	getParentRoute: () => ChannelRoute
});
var ChannelPostsRoute = Route$21.update({
	id: "/posts",
	path: "/posts",
	getParentRoute: () => ChannelRoute
});
var ChannelReelsRoute = Route$20.update({
	id: "/reels",
	path: "/reels",
	getParentRoute: () => ChannelRoute
});
var ChannelSubscribersRoute = Route$19.update({
	id: "/subscribers",
	path: "/subscribers",
	getParentRoute: () => ChannelRoute
});
var ChannelVideosRoute = Route$18.update({
	id: "/videos",
	path: "/videos",
	getParentRoute: () => ChannelRoute
});
var MomentIndexRoute = Route$17.update({
	id: "/moment/",
	path: "/moment/",
	getParentRoute: () => Route$46
});
var MomentMomentIdRoute = Route$16.update({
	id: "/moment/$momentId",
	path: "/moment/$momentId",
	getParentRoute: () => Route$46
});
var MomentCreateRoute = Route$15.update({
	id: "/moment/create",
	path: "/moment/create",
	getParentRoute: () => Route$46
});
var OrbitIndexRoute = Route$14.update({
	id: "/",
	path: "/",
	getParentRoute: () => OrbitRoute
});
var OrbitProfileIdRoute = Route$13.update({
	id: "/$profileId",
	path: "/$profileId",
	getParentRoute: () => OrbitRoute
});
var OrbitCreateRoute = Route$12.update({
	id: "/create",
	path: "/create",
	getParentRoute: () => OrbitRoute
});
var OrbitMeRoute = Route$11.update({
	id: "/me",
	path: "/me",
	getParentRoute: () => OrbitRoute
});
var OrbitMessagesRoute = Route$10.update({
	id: "/messages",
	path: "/messages",
	getParentRoute: () => OrbitRoute
});
var OrbitNotificationsRoute = Route$9.update({
	id: "/notifications",
	path: "/notifications",
	getParentRoute: () => OrbitRoute
});
var OrbitPrivacyRoute = Route$8.update({
	id: "/privacy",
	path: "/privacy",
	getParentRoute: () => OrbitRoute
});
var PostCreateRoute = Route$7.update({
	id: "/post/create",
	path: "/post/create",
	getParentRoute: () => Route$46
});
var ReelReelIdRoute = Route$6.update({
	id: "/reel/$reelId",
	path: "/reel/$reelId",
	getParentRoute: () => Route$46
});
var UUserIdRoute = Route$5.update({
	id: "/u/$userId",
	path: "/u/$userId",
	getParentRoute: () => Route$46
});
var VideoVideoIdRoute = Route$4.update({
	id: "/video/$videoId",
	path: "/video/$videoId",
	getParentRoute: () => Route$46
});
var VideoUploadRoute = Route$3.update({
	id: "/video/upload",
	path: "/video/upload",
	getParentRoute: () => Route$46
});
var AuthenticatedChatIndexRoute = Route$2.update({
	id: "/chat/",
	path: "/chat/",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedChatThreadIdRoute = Route$1.update({
	id: "/chat/$threadId",
	path: "/chat/$threadId",
	getParentRoute: () => AuthenticatedRouteRoute
});
var OrbitChatUserIdRoute = Route.update({
	id: "/chat/$userId",
	path: "/chat/$userId",
	getParentRoute: () => OrbitRoute
});
var AuthenticatedRouteRouteChildren = {
	AuthenticatedChatThreadIdRoute,
	AuthenticatedChatIndexRoute
};
var AuthenticatedRouteRouteWithChildren = AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren);
var ChannelRouteChildren = {
	ChannelAnalyticsRoute,
	ChannelCreateRoute,
	ChannelMonetizationRoute,
	ChannelPostsRoute,
	ChannelReelsRoute,
	ChannelSubscribersRoute,
	ChannelVideosRoute,
	ChannelIndexRoute
};
var ChannelRouteWithChildren = ChannelRoute._addFileChildren(ChannelRouteChildren);
var OrbitRouteChildren = {
	OrbitProfileIdRoute,
	OrbitCreateRoute,
	OrbitMeRoute,
	OrbitMessagesRoute,
	OrbitNotificationsRoute,
	OrbitPrivacyRoute,
	OrbitIndexRoute,
	OrbitChatUserIdRoute
};
var rootRouteChildren = {
	IndexRoute,
	AuthenticatedRouteRoute: AuthenticatedRouteRouteWithChildren,
	AccountRoute,
	AuthRoute,
	ChannelRoute: ChannelRouteWithChildren,
	CopyrightPolicyRoute,
	CreateRoute,
	LicensesRoute,
	NotificationsRoute,
	OrbitRoute: OrbitRoute._addFileChildren(OrbitRouteChildren),
	PrivacyRoute,
	ProfileRoute,
	ReelsRoute,
	ResetPasswordRoute,
	SearchRoute,
	SettingsRoute,
	SitemapDotxmlRoute,
	TermsRoute,
	WalletRoute,
	AdminCopyrightReportsRoute,
	MomentMomentIdRoute,
	MomentCreateRoute,
	PostCreateRoute,
	ReelReelIdRoute,
	UUserIdRoute,
	VideoVideoIdRoute,
	VideoUploadRoute,
	MomentIndexRoute
};
var routeTree = Route$46._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function DefaultErrorComponent({ error }) {
	console.error("[RouterError]", error);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4 text-foreground",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => window.location.reload(),
						className: "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground",
						children: "Go home"
					})]
				})
			]
		})
	});
}
function DefaultNotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4 text-foreground",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-6xl font-bold",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "This page or profile doesn't exist or may have been removed."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
					children: "Go home"
				})
			]
		})
	});
}
var getRouter = () => {
	const queryClient = new QueryClient({ defaultOptions: { queries: {
		staleTime: 6e4,
		gcTime: 3e5,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		retry: 1
	} } });
	return createRouter({
		routeTree,
		defaultErrorComponent: DefaultErrorComponent,
		defaultNotFoundComponent: DefaultNotFoundComponent,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadDelay: 30,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { unregisterBlob as $, autoDeleteLabel as A, registerUniqueView as B, setUserBlock as C, useThreadMessages as D, useSocialPosts as E, availableVideoQualityTiers as F, uploadVideoThumbnail as G, normalizePostRow as H, estimateDownloadSizeMb as I, loadCachedThread as J, sampleVideoFrames as K, formatDownloadSizeMb as L, expiresAtForAutoDelete as M, normalizeAutoDeleteSetting as N, useThreadPeer as O, VIDEO_QUALITY_TIERS as P, registerBlob as Q, isVideoQualityTier as R, resolveThreadPeer as S, notifyOrbitPrefsChanged as St, usePostComments as T, needsProtectionWarning as U, missingColumn as V, generateAndUploadVideoThumbnail as W, cacheGet as X, saveCachedThread as Y, cacheSet as Z, publishDirectReel as _, STORAGE_BUCKETS as _t, Route$13 as a, timeAgo$1 as at, reportSocialUser as b, adaptiveCameraCaptureAttempts as bt, useCall as c, useYw as ct, emptyChannel as d, setFollow as dt, isAuthSessionMissing as et, useChannel as f, useFollowCounts as ft, getLocalMedia as g, writeCompat as gt, dmThreadId as h, postKind as ht, Route$5 as i, kindMeta as it, autoDeleteSeconds as j, AUTO_DELETE_OPTIONS as k, CHANNEL_CATEGORIES as l, fetchIsFollowing as lt, useAuth as m, cn as mt, Route as n, NOTIFICATION_KINDS as nt, Route$33 as o, useNotifications as ot, useSearch as p, useFollowList as pt, optimizeVideoBlob as q, Route$1 as r, ORBIT_KINDS as rt, useUploads as s, useDoubleTapLike as st, router_exports as t, useMoments as tt, COUNTRIES as u, isRealUserId as ut, publishPost as v, uploadSourceWithProgress as vt, timeAgo as w, resolveMediaUrl as x, ORBIT_KEY as xt, rememberLocalMedia as y, uploadWithProgress as yt, qualityTierFromDimensions as z };
