import { o as __toESM } from "../_runtime.mjs";
import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.mjs";
import { n as inr, t as computeBreakdown } from "./payout-math-C0joRY5F.mjs";
import { t as normalizeSupabaseProjectUrl } from "./url-DRM0tSlT.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as useLocation, c as createRouter, d as createFileRoute, f as createRootRouteWithContext, i as HeadContent, l as Outlet, m as useNavigate, o as useRouterState, p as Link, r as Scripts, u as lazyRouteComponent, v as redirect } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { n as clsx } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { $ as Radio, Dt as Mail, Jt as Film, Mn as BadgeCheck, T as SwitchCamera, Ut as Handshake, Vt as Heart, _ as UserPlus, a as X, bt as MicOff, c as VolumeX, d as VideoOff, et as Plus, gn as CircleAlert, hn as CircleCheck, i as ZapOff, j as Sparkles, jt as LoaderCircle, kn as Bell, l as Volume2, m as User, ot as Phone, r as Zap, sn as Coins, st as PhoneOff, tn as Earth, u as Video, wt as Megaphone, xt as MessageSquare, yt as Mic, zt as House } from "../_libs/lucide-react.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
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
//#region node_modules/.nitro/vite/services/ssr/assets/storage-upload-CeU57yZG.js
/** Supabase recommends 6 MiB TUS chunks for reliable resumable uploads. */
var TUS_CHUNK_SIZE_BYTES = 6291456;
var TUS_VERSION = "1.0.0";
var TUS_MAX_RETRIES = 5;
var STORAGE_BUCKETS = {
	videos: "videos",
	reels: "reels",
	moments: "moments",
	voiceNotes: "voice_notes",
	channels: "channels",
	monetization: "monetization",
	messages: "messages",
	calls: "calls",
	avatars: "avatars"
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
	const url = new URL(storageConfig().url);
	if (url.hostname.endsWith(".supabase.co") && !url.hostname.endsWith(".storage.supabase.co")) url.hostname = url.hostname.replace(/\.supabase\.co$/, ".storage.supabase.co");
	url.pathname = "/storage/v1/upload/resumable";
	url.search = "";
	url.hash = "";
	return url.toString();
}
function base64Metadata(value) {
	const bytes = new TextEncoder().encode(value);
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
}
function tusError(response) {
	let detail = "";
	try {
		const body = JSON.parse(response.responseText);
		detail = body.message || body.error || "";
	} catch {
		detail = (response.responseText || "").slice(0, 160);
	}
	return `Upload failed (${response.status || "network error"})${detail ? `: ${detail}` : ""}`;
}
function tusRequest(method, url, headers, body, onProgress) {
	return new Promise((resolve) => {
		try {
			const xhr = new XMLHttpRequest();
			xhr.open(method, url, true);
			xhr.responseType = "text";
			for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
			if (method === "PATCH") xhr.upload.onprogress = (event) => {
				if (event.lengthComputable) onProgress?.(event.loaded);
			};
			xhr.onload = () => {
				const offsetHeader = xhr.getResponseHeader("Upload-Offset");
				const parsedOffset = offsetHeader === null ? null : Number.parseInt(offsetHeader, 10);
				resolve({
					status: xhr.status,
					location: xhr.getResponseHeader("Location"),
					offset: Number.isFinite(parsedOffset) ? parsedOffset : null,
					body: xhr.responseText || "",
					error: xhr.status >= 200 && xhr.status < 300 ? null : tusError(xhr)
				});
			};
			xhr.onerror = () => resolve({
				status: 0,
				location: null,
				offset: null,
				body: "",
				error: "Network error while uploading"
			});
			xhr.ontimeout = () => resolve({
				status: 0,
				location: null,
				offset: null,
				body: "",
				error: "Upload timed out"
			});
			xhr.onabort = () => resolve({
				status: 0,
				location: null,
				offset: null,
				body: "",
				error: "Upload cancelled"
			});
			xhr.send(body);
		} catch (error) {
			resolve({
				status: 0,
				location: null,
				offset: null,
				body: "",
				error: error instanceof Error ? error.message : "Upload failed"
			});
		}
	});
}
var wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function isRetryableTusStatus(status) {
	return status === 0 || status === 408 || status === 409 || status === 429 || status >= 500;
}
/**
* Uploads a blob through Supabase Storage's resumable TUS endpoint.
*
* The browser only sends 6 MiB PATCH requests, so multi-GB files never become
* one request or a base64 payload. If a PATCH fails, HEAD recovers the server
* offset before retrying, allowing the upload to continue from the last byte.
*/
async function uploadTus(bucket, path, blob, contentType, token, onProgress) {
	const endpoint = resumableUploadEndpoint();
	const { key: supabaseKey } = storageConfig();
	const commonHeaders = {
		authorization: `Bearer ${token}`,
		apikey: supabaseKey,
		"tus-resumable": TUS_VERSION
	};
	const metadata = [
		`bucketName ${base64Metadata(bucket)}`,
		`objectName ${base64Metadata(path)}`,
		`contentType ${base64Metadata(contentType)}`,
		`cacheControl ${base64Metadata("3600")}`
	].join(",");
	let created = null;
	for (let attempt = 0; attempt <= TUS_MAX_RETRIES; attempt += 1) {
		created = await tusRequest("POST", endpoint, {
			...commonHeaders,
			"upload-length": String(blob.size),
			"upload-metadata": metadata,
			"x-upsert": "false"
		}, null);
		if (!created.error) break;
		if (!isRetryableTusStatus(created.status) || attempt === TUS_MAX_RETRIES) return { error: created.error };
		await wait(500 * 2 ** attempt);
	}
	if (!created || created.error || !created.location) return { error: created?.error ?? "Upload session could not be created." };
	const uploadUrl = new URL(created.location, endpoint).toString();
	let offset = created.offset ?? 0;
	onProgress?.(blob.size ? Math.min(99, Math.floor(offset / blob.size * 100)) : 99);
	while (offset < blob.size) {
		const chunk = blob.slice(offset, Math.min(offset + TUS_CHUNK_SIZE_BYTES, blob.size));
		let chunkComplete = false;
		let lastError = "Chunk upload failed";
		for (let attempt = 0; attempt <= TUS_MAX_RETRIES; attempt += 1) {
			const sentFrom = offset;
			const response = await tusRequest("PATCH", uploadUrl, {
				...commonHeaders,
				"content-type": "application/offset+octet-stream",
				"upload-offset": String(sentFrom)
			}, chunk, (loaded) => {
				const totalLoaded = Math.min(blob.size, sentFrom + loaded);
				onProgress?.(Math.min(99, Math.floor(totalLoaded / blob.size * 100)));
			});
			if (!response.error) {
				const nextOffset = response.offset ?? sentFrom + chunk.size;
				if (nextOffset <= sentFrom || nextOffset > blob.size) return { error: "Storage returned an invalid upload offset." };
				offset = nextOffset;
				chunkComplete = true;
				break;
			}
			lastError = response.error;
			if (!isRetryableTusStatus(response.status) || attempt === TUS_MAX_RETRIES) break;
			const head = await tusRequest("HEAD", uploadUrl, commonHeaders, null);
			if (!head.error && head.offset !== null) {
				if (head.offset > blob.size) return { error: "Storage returned an invalid upload offset." };
				offset = head.offset;
				if (offset >= blob.size) {
					chunkComplete = true;
					break;
				}
				if (offset !== sentFrom) {
					chunkComplete = true;
					break;
				}
			}
			await wait(500 * 2 ** attempt);
		}
		if (!chunkComplete) return { error: lastError };
	}
	onProgress?.(100);
	return { error: null };
}
/**
* Uploads a blob with real byte-level progress and returns a signed URL.
* Supabase Storage's resumable TUS endpoint handles the actual file transfer.
*/
async function uploadWithProgress(bucket, path, blob, contentType, onProgress) {
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
	const upload = await uploadTus(bucket, path, blob, contentType, token, onProgress);
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
//#region node_modules/.nitro/vite/services/ssr/assets/router-COLtD0vp.js
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var styles_default = "/assets/styles-BqCEAeiA.css";
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
/** Ids the signed-in user currently follows. */
async function fetchMyFollowing() {
	const { data: s } = await supabase.auth.getSession();
	const uid = s.session?.user.id;
	if (!uid) return [];
	const { data } = await supabase.from("follows").select("following_id").eq("follower_id", uid);
	return (data ?? []).map((r) => r.following_id);
}
/** Follow / unfollow a real user. Throws when signed out or on a DB error. */
async function setFollow(targetId, on) {
	const { data: s } = await supabase.auth.getSession();
	const uid = s.session?.user.id;
	if (!uid) throw new Error("Sign in to follow people");
	if (uid === targetId) throw new Error("You can't follow yourself");
	if (on) {
		const { error } = await supabase.from("follows").upsert({
			follower_id: uid,
			following_id: targetId
		}, {
			onConflict: "follower_id,following_id",
			ignoreDuplicates: true
		});
		if (error) throw new Error(error.message);
	} else {
		const { error } = await supabase.from("follows").delete().eq("follower_id", uid).eq("following_id", targetId);
		if (error) throw new Error(error.message);
	}
}
async function counts(userId) {
	const { data: rows } = await supabase.rpc("get_follow_counts", { ids: [userId] });
	const row = (rows ?? [])[0];
	return {
		followers: Number(row?.followers ?? 0),
		following: Number(row?.following ?? 0)
	};
}
/** Live follower / following counts for a user, kept fresh via realtime. */
function useFollowCounts(userId) {
	const [data, setData] = (0, import_react.useState)({
		followers: 0,
		following: 0
	});
	const reload = (0, import_react.useCallback)(async () => {
		if (!userId) return setData({
			followers: 0,
			following: 0
		});
		setData(await counts(userId));
	}, [userId]);
	(0, import_react.useEffect)(() => {
		reload();
		if (!userId) return;
		let ch = null;
		try {
			ch = supabase.channel(`follows:${userId}:${crypto.randomUUID()}`).on("postgres_changes", {
				event: "*",
				schema: "public",
				table: "follows",
				filter: `following_id=eq.${userId}`
			}, () => void reload()).on("postgres_changes", {
				event: "*",
				schema: "public",
				table: "follows",
				filter: `follower_id=eq.${userId}`
			}, () => void reload()).subscribe();
		} catch (err) {
			console.error("[useFollowCounts] realtime unavailable", err);
		}
		return () => {
			const c = ch;
			ch = null;
			if (c) setTimeout(() => void supabase.removeChannel(c), 0);
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
	(0, import_react.useEffect)(() => {
		if (!open || !userId) return;
		let cancelled = false;
		(async () => {
			setLoading(true);
			const { data: rows } = await supabase.rpc("list_follows", {
				_user_id: userId,
				_kind: kind,
				_limit: 500
			});
			const ids = (rows ?? []).map((r) => r.id).filter(Boolean);
			if (!ids.length) {
				if (!cancelled) {
					setUsers([]);
					setLoading(false);
				}
				return;
			}
			const { data: profiles } = await supabase.rpc("get_public_profiles", { ids });
			if (cancelled) return;
			const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
			setUsers(ids.map((id) => {
				const p = byId.get(id);
				return {
					id,
					username: p?.username ?? "user",
					display_name: p?.display_name ?? p?.username ?? "YourWorld user",
					avatar_url: p?.avatar_url ?? null
				};
			}));
			setLoading(false);
		})();
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
		loading
	};
}
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
				const ids = await fetchMyFollowing();
				if (cancelled) return;
				setFollowing(Object.fromEntries(ids.map((id) => [id, true])));
			} catch {}
			try {
				const { data: auth } = await supabase.auth.getUser();
				const me = auth.user?.id ?? null;
				meRef.current = me;
				if (!me || cancelled) {
					setLiked({});
					setSaved({});
					return;
				}
				const [likes, saves] = await Promise.all([supabase.from("post_likes").select("post_id").eq("user_id", me), supabase.from("post_saves").select("post_id").eq("user_id", me)]);
				if (cancelled) return;
				const toToggles = (rows) => Object.fromEntries((rows ?? []).map((row) => [row.post_id, true]));
				setLiked(toToggles(likes.data));
				setSaved(toToggles(saves.data));
			} catch {}
		};
		sync();
		const { data: sub } = supabase.auth.onAuthStateChange(() => void sync());
		const channel = supabase.channel("yw-interactions").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "post_likes"
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
		const { error } = on ? await supabase.from(table).upsert({
			post_id: postId,
			user_id: me
		}, {
			onConflict: "post_id,user_id",
			ignoreDuplicates: true
		}) : await supabase.from(table).delete().eq("post_id", postId).eq("user_id", me);
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
		persistToggle("post_likes", id, next, (v) => setLiked((p) => ({
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
		let next = false;
		setFollowing((p) => {
			next = !p[id];
			return {
				...p,
				[id]: next
			};
		});
		if (!isRealUserId(id)) {
			setFollowing((p) => ({
				...p,
				[id]: false
			}));
			return;
		}
		setFollow(id, next).catch((e) => {
			setFollowing((p) => ({
				...p,
				[id]: !next
			}));
			toast.error(e instanceof Error ? e.message : "Couldn't update follow");
		});
	}, []);
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
var KEY$1 = "yw.notifications.v2";
function loadPersisted() {
	if (typeof window === "undefined") return {};
	try {
		return JSON.parse(window.localStorage.getItem(KEY$1) ?? "{}");
	} catch {
		return {};
	}
}
var NotificationsContext = (0, import_react.createContext)(null);
var ts = (v) => new Date(v).getTime();
/** Builds the whole notification feed from real database activity. */
async function fetchEvents() {
	const { data: auth } = await supabase.auth.getUser();
	const me = auth.user?.id;
	if (!me) return [];
	const { data: myPostRows } = await supabase.from("posts").select("id,kind").eq("user_id", me);
	const myPosts = myPostRows ?? [];
	const postIds = myPosts.map((p) => p.id);
	const { data: threadRows } = await supabase.from("thread_participants").select("thread_id").eq("user_id", me);
	const threadIds = [...new Set((threadRows ?? []).map((t) => t.thread_id))];
	const [likes, comments, follows, dms, orbitMsgs, orbitLikes, myOrbitLikes, requests, connections] = await Promise.all([
		postIds.length ? supabase.from("post_likes").select("id,post_id,user_id,created_at").in("post_id", postIds).neq("user_id", me).order("created_at", { ascending: false }).limit(40) : Promise.resolve({ data: [] }),
		postIds.length ? supabase.from("post_comments").select("id,post_id,user_id,body,created_at").in("post_id", postIds).neq("user_id", me).order("created_at", { ascending: false }).limit(40) : Promise.resolve({ data: [] }),
		supabase.from("follows").select("id,follower_id,created_at").eq("following_id", me).order("created_at", { ascending: false }).limit(40),
		threadIds.length ? supabase.from("direct_messages").select("id,thread_id,sender_id,content,media_type,created_at").in("thread_id", threadIds).neq("sender_id", me).order("created_at", { ascending: false }).limit(40) : Promise.resolve({ data: [] }),
		supabase.from("orbit_messages").select("id,sender_id,kind,text,created_at").eq("recipient_id", me).order("created_at", { ascending: false }).limit(40),
		supabase.from("orbit_likes").select("id,user_id,created_at").eq("target_id", me).order("created_at", { ascending: false }).limit(40),
		supabase.from("orbit_likes").select("target_id").eq("user_id", me),
		supabase.from("orbit_chat_requests").select("id,requester_id,intro,status,created_at").eq("addressee_id", me).order("created_at", { ascending: false }).limit(30),
		supabase.from("orbit_connections").select("id,requester_id,addressee_id,status,updated_at").or(`requester_id.eq.${me},addressee_id.eq.${me}`).order("updated_at", { ascending: false }).limit(30)
	]);
	const rows = {
		likes: likes.data ?? [],
		comments: comments.data ?? [],
		follows: follows.data ?? [],
		dms: dms.data ?? [],
		orbitMsgs: orbitMsgs.data ?? [],
		orbitLikes: orbitLikes.data ?? [],
		requests: requests.data ?? [],
		connections: connections.data ?? []
	};
	const likedByMe = new Set((myOrbitLikes.data ?? []).map((r) => r.target_id));
	const peerIds = [.../* @__PURE__ */ new Set([
		...rows.likes.map((r) => r.user_id),
		...rows.comments.map((r) => r.user_id),
		...rows.follows.map((r) => r.follower_id),
		...rows.dms.map((r) => r.sender_id),
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
		body: r.body,
		at: ts(r.created_at),
		to: postLink(r.post_id)
	});
	for (const r of rows.follows) out.push({
		id: `follow-${r.id}`,
		kind: "follower",
		title: `${nameOf(r.follower_id)} started following you`,
		at: ts(r.created_at),
		to: `/u/${r.follower_id}`
	});
	for (const r of rows.dms) out.push({
		id: `dm-${r.id}`,
		kind: "message",
		title: `New message from ${nameOf(r.sender_id)}`,
		body: r.media_type && r.media_type !== "text" ? "Sent an attachment" : r.content,
		at: ts(r.created_at),
		to: `/chat/${r.thread_id}`
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
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const { hideOrbitNotifications } = useOrbitAppPrefs();
	(0, import_react.useEffect)(() => {
		const p = loadPersisted();
		setPrefs({
			...defaultPrefs,
			...p.prefs ?? {}
		});
		if (typeof p.live === "boolean") setLive(p.live);
		setReadIds(p.read ?? []);
		setRemovedIds(p.removed ?? []);
		setHydrated(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		try {
			window.localStorage.setItem(KEY$1, JSON.stringify({
				prefs,
				live,
				read: readIds.slice(0, 500),
				removed: removedIds.slice(0, 500)
			}));
		} catch {}
	}, [
		prefs,
		live,
		readIds,
		removedIds,
		hydrated
	]);
	const load = (0, import_react.useCallback)(async () => {
		try {
			setEvents(await fetchEvents());
		} catch {}
	}, []);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		load();
		const { data: sub } = supabase.auth.onAuthStateChange(() => void load());
		return () => sub.subscription.unsubscribe();
	}, [hydrated, load]);
	(0, import_react.useEffect)(() => {
		if (!hydrated || !live) return;
		const tables = [
			"post_likes",
			"post_comments",
			"follows",
			"direct_messages",
			"orbit_messages",
			"orbit_likes",
			"orbit_chat_requests",
			"orbit_connections"
		];
		let timer = null;
		const reload = () => {
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => void load(), 2e3);
		};
		let channel = supabase.channel("yw-notifications");
		for (const table of tables) channel = channel.on("postgres_changes", {
			event: "*",
			schema: "public",
			table
		}, reload);
		channel.subscribe();
		return () => {
			if (timer) clearTimeout(timer);
			supabase.removeChannel(channel);
		};
	}, [
		hydrated,
		live,
		load
	]);
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
var missingColumnPatterns = [/Could not find the '([^']+)' column/i, /column (?:[\w.]+\.)?["']?([\w]+)["']? does not exist/i];
function missingColumn(error) {
	const text = [error?.message, error?.details].filter(Boolean).join(" ");
	for (const pattern of missingColumnPatterns) {
		const match = text.match(pattern);
		if (match?.[1]) return match[1];
	}
	return null;
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
		if (!result.error) return result;
		const column = missingColumn(result.error);
		if (!column || removed.has(column) || !(column in payload)) return result;
		removed.add(column);
		const alias = aliases[column];
		const value = payload[column];
		delete payload[column];
		if (alias && !(alias in payload)) payload[alias] = column === "kind" && value === "post" ? "story" : value;
	}
	return write(payload);
}
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
	const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1e3));
	if (s < 60) return `${s}s ago`;
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
	if (cached) return cached;
	const path = storagePathFrom(url, bucket);
	if (!path) return url;
	const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 86400);
	if (error || !data?.signedUrl) return url;
	const next = data.signedUrl;
	signedCache.set(url, next);
	return next;
}
/** Live list of posts of a given kind, with author, like and comment counts. */
async function loadSocialPosts(kind, client = supabase) {
	const { data: sessionData } = await client.auth.getSession();
	const uid = sessionData.session?.user.id ?? null;
	let { data: posts, error } = await client.from("posts").select("*").eq("kind", kind).order("created_at", { ascending: false }).limit(50);
	if (missingColumn(error) === "kind") {
		const legacyKind = kind === "post" ? "story" : kind;
		const legacy = await client.from("posts").select("*").eq("type", legacyKind).order("created_at", { ascending: false }).limit(50);
		posts = legacy.data;
		error = legacy.error;
		if (missingColumn(error) === "type") {
			const unfiltered = await client.from("posts").select("*").order("created_at", { ascending: false }).limit(100);
			posts = (unfiltered.data ?? []).filter((row) => postKind(row) === kind);
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
	const [{ data: profiles }, { data: likes }, { data: comments }] = await Promise.all([
		client.rpc("get_public_profiles", { ids: authorIds }),
		client.from("post_likes").select("post_id,user_id").in("post_id", ids),
		client.from("post_comments").select("post_id").in("post_id", ids)
	]);
	const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
	return {
		posts: posts.map((p) => ({
			...normalizePostRow(p),
			author: toUser(profileById.get(p.user_id), p.user_id),
			likeCount: (likes ?? []).filter((l) => l.post_id === p.id).length,
			commentCount: (comments ?? []).filter((c) => c.post_id === p.id).length,
			likedByMe: !!uid && (likes ?? []).some((l) => l.post_id === p.id && l.user_id === uid)
		})),
		currentUserId: uid
	};
}
function useSocialPosts(kind) {
	const [rows, setRows] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [me, setMe] = (0, import_react.useState)(null);
	const muteUntil = (0, import_react.useRef)(0);
	const load = (0, import_react.useCallback)(async () => {
		if (Date.now() < muteUntil.current) return;
		const next = await loadSocialPosts(kind);
		setMe(next.currentUserId);
		setRows(next.posts);
		setLoading(false);
	}, [kind]);
	(0, import_react.useEffect)(() => {
		load();
		let timer;
		const queue = () => {
			window.clearTimeout(timer);
			timer = window.setTimeout(() => void load(), 500);
		};
		let channel = null;
		const boot = window.setTimeout(() => {
			channel = supabase.channel(`social-${kind}`).on("postgres_changes", {
				event: "*",
				schema: "public",
				table: "posts"
			}, queue).on("postgres_changes", {
				event: "*",
				schema: "public",
				table: "post_likes"
			}, queue).on("postgres_changes", {
				event: "*",
				schema: "public",
				table: "post_comments"
			}, queue).subscribe();
		}, 300);
		return () => {
			window.clearTimeout(boot);
			window.clearTimeout(timer);
			if (channel) supabase.removeChannel(channel);
		};
	}, [kind, load]);
	return {
		posts: rows,
		loading,
		currentUserId: me,
		toggleLike: (0, import_react.useCallback)(async (postId) => {
			if (!me) return;
			muteUntil.current = Date.now() + 1500;
			let wasLiked = false;
			setRows((prev) => prev.map((r) => {
				if (r.id !== postId) return r;
				wasLiked = !!r.likedByMe;
				return {
					...r,
					likedByMe: !r.likedByMe,
					likeCount: r.likeCount + (r.likedByMe ? -1 : 1)
				};
			}));
			if (wasLiked) {
				const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", me);
				if (error) {
					await load();
					throw error;
				}
			} else {
				const { error } = await supabase.from("post_likes").upsert({
					post_id: postId,
					user_id: me
				}, {
					onConflict: "post_id,user_id",
					ignoreDuplicates: true
				});
				if (error) {
					await load();
					throw error;
				}
			}
		}, [me, load]),
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
/** Uploads a rendered reel and inserts it into the posts table (kind = "reel"). */
async function publishReel(opts) {
	const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
	if (sessionError) {
		console.error("Could not authorize reel publishing", sessionError);
		return { error: sessionError.message };
	}
	const uid = sessionData.session?.user.id;
	if (!uid) return { error: "You need to sign in to post a reel." };
	let mediaUrl = opts.fileUrl;
	if (/^(blob:|data:)/.test(opts.fileUrl)) try {
		const blob = await (await fetch(opts.fileUrl)).blob();
		const ext = blob.type.includes("webm") ? "webm" : "mp4";
		const path = `${uid}/${Date.now()}.${ext}`;
		const { url, error: upErr } = await uploadWithProgress(STORAGE_BUCKETS.reels, path, blob, blob.type || "video/mp4", opts.onProgress);
		if (upErr || !url) {
			console.error("Reel storage upload failed", upErr);
			return { error: upErr ?? "Upload failed" };
		}
		mediaUrl = url;
	} catch (e) {
		console.error("Reel upload preparation failed", e);
		return { error: e instanceof Error ? e.message : "Upload failed" };
	}
	else opts.onProgress?.(100);
	const { error } = await writeCompat((payload) => supabase.from("posts").insert(payload), {
		user_id: uid,
		kind: "reel",
		media_url: mediaUrl,
		media_type: "video",
		caption: opts.caption ?? "",
		hashtags: opts.hashtags ?? [],
		audio: opts.audio ?? null,
		allow_download: opts.allowDownload ?? true,
		location: opts.location ?? null,
		link: opts.link ?? null,
		audience: opts.audience ?? "everyone",
		tagged_user_ids: opts.taggedUserIds ?? [],
		viewer_user_ids: opts.viewerUserIds ?? []
	}, { kind: "type" });
	if (error) console.error("Reel database insert failed", error);
	else rememberLocalMedia(mediaUrl, opts.fileUrl);
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
	if (/^(blob:|data:)/.test(opts.fileUrl)) try {
		const blob = await (await fetch(opts.fileUrl)).blob();
		const type = blob.type || (opts.mediaType === "video" ? "video/mp4" : "image/jpeg");
		const ext = type.split("/")[1]?.split(";")[0] || (opts.mediaType === "video" ? "mp4" : "jpg");
		const path = `${uid}/post-${Date.now()}.${ext}`;
		const { url, error: upErr } = await uploadWithProgress(STORAGE_BUCKETS.videos, path, blob, type, opts.onProgress);
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
	const { error } = await writeCompat((payload) => supabase.from("posts").insert(payload), {
		user_id: uid,
		kind: "post",
		media_url: mediaUrl,
		media_type: opts.mediaType,
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
/** Live messages for one chat thread. */
function useThreadMessages(threadId, opts = {}) {
	const staleTime = opts.staleTime ?? 0;
	const [messages, setMessages] = (0, import_react.useState)(() => cacheGet(`thread:${threadId}`) ?? []);
	const [me, setMe] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(() => (cacheGet(`thread:${threadId}`) ?? []).length === 0);
	const [hasMore, setHasMore] = (0, import_react.useState)(true);
	const [loadingMore, setLoadingMore] = (0, import_react.useState)(false);
	const messagesRef = (0, import_react.useRef)([]);
	(0, import_react.useEffect)(() => {
		messagesRef.current = messages;
		const persistable = messages.filter((m) => !m.id.startsWith("tmp-"));
		cacheSet(`thread:${threadId}`, persistable.slice(-40));
		saveCachedThread(`dm:${threadId}`, persistable);
	}, [messages, threadId]);
	(0, import_react.useEffect)(() => {
		let alive = true;
		loadCachedThread(`dm:${threadId}`).then((rows) => {
			if (!alive || !rows?.length) return;
			setMessages((prev) => {
				const map = new Map(rows.map((r) => [r.id, r]));
				for (const m of prev) map.set(m.id, m);
				return [...map.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
			});
			setLoading(false);
		});
		return () => {
			alive = false;
		};
	}, [threadId]);
	const load = (0, import_react.useCallback)(async () => {
		const { data } = await supabase.from("direct_messages").select("id,thread_id,sender_id,content,media_url,media_type,is_read,created_at").eq("thread_id", threadId).order("created_at", { ascending: false }).limit(40);
		const rows = (data ?? []).slice().reverse();
		setHasMore(rows.length >= 40);
		setMessages((prev) => {
			const map = new Map(prev.filter((m) => !m.id.startsWith("tmp-")).map((m) => [m.id, m]));
			const oldest = rows[0]?.created_at;
			if (oldest) {
				for (const [id, m] of map) if (m.created_at >= oldest) map.delete(id);
			}
			for (const r of rows) map.set(r.id, r);
			return [...[...map.values()].sort((a, b) => a.created_at.localeCompare(b.created_at)), ...prev.filter((m) => m.id.startsWith("tmp-"))];
		});
		setLoading(false);
	}, [threadId]);
	/** Infinite scroll: pull the previous page of older messages. */
	const loadOlder = (0, import_react.useCallback)(async () => {
		const oldest = messagesRef.current.find((m) => !m.id.startsWith("tmp-"))?.created_at;
		if (!oldest || loadingMore || !hasMore) return;
		setLoadingMore(true);
		const { data } = await supabase.from("direct_messages").select("id,thread_id,sender_id,content,media_url,media_type,is_read,created_at").eq("thread_id", threadId).lt("created_at", oldest).order("created_at", { ascending: false }).limit(40);
		const rows = (data ?? []).slice().reverse();
		setHasMore(rows.length >= 40);
		if (rows.length) setMessages((prev) => {
			const map = new Map(rows.map((r) => [r.id, r]));
			for (const m of prev) map.set(m.id, m);
			return [...map.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
		});
		setLoadingMore(false);
	}, [
		threadId,
		loadingMore,
		hasMore
	]);
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(({ data }) => setMe(data.session?.user.id ?? null));
		load();
		let channel = null;
		let retry = null;
		let alive = true;
		let subscribeCount = 0;
		const upsert = (row) => setMessages((prev) => prev.some((m) => m.id === row.id) ? prev.map((m) => m.id === row.id ? row : m) : [...prev, row].sort((a, b) => a.created_at.localeCompare(b.created_at)));
		const subscribe = () => {
			if (!alive) return;
			subscribeCount++;
			channel = supabase.channel(`thread-${threadId}-${Math.random().toString(36).slice(2)}`).on("postgres_changes", {
				event: "*",
				schema: "public",
				table: "direct_messages",
				filter: `thread_id=eq.${threadId}`
			}, (payload) => {
				if (payload.eventType === "DELETE") {
					const gone = payload.old?.id;
					if (gone) setMessages((prev) => prev.filter((m) => m.id !== gone));
					return;
				}
				const row = payload.new;
				if (row?.id) upsert(row);
				else load();
			}).subscribe((status) => {
				if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
					const failedChannel = channel;
					channel = null;
					if (failedChannel && status !== "CLOSED") window.setTimeout(() => void supabase.removeChannel(failedChannel), 0);
					if (!alive) return;
					if (!retry) retry = setTimeout(() => {
						retry = null;
						subscribe();
					}, 1500);
				} else if (status === "SUBSCRIBED") {
					if (subscribeCount > 1) load();
				}
			});
		};
		subscribe();
		const resync = () => {
			if (staleTime === Infinity) return;
			if (document.visibilityState === "visible") load();
		};
		document.addEventListener("visibilitychange", resync);
		window.addEventListener("online", resync);
		return () => {
			alive = false;
			if (retry) clearTimeout(retry);
			document.removeEventListener("visibilitychange", resync);
			window.removeEventListener("online", resync);
			if (channel) supabase.removeChannel(channel);
		};
	}, [
		threadId,
		load,
		staleTime
	]);
	const send = (0, import_react.useCallback)(async (payload) => {
		if (!me) return { error: "no-session" };
		const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
		const optimistic = {
			id: tempId,
			thread_id: threadId,
			sender_id: me,
			content: payload.content ?? "",
			media_url: payload.media_url ?? null,
			media_type: payload.media_type ?? "text",
			is_read: false,
			created_at: (/* @__PURE__ */ new Date()).toISOString()
		};
		setMessages((prev) => [...prev, optimistic]);
		const { data, error } = await supabase.from("direct_messages").insert({
			thread_id: threadId,
			sender_id: me,
			content: payload.content ?? "",
			media_url: payload.media_url ?? null,
			media_type: payload.media_type ?? "text"
		}).select("*").maybeSingle();
		flagChatMessage({
			surface: "social",
			text: payload.content,
			threadId,
			messageId: data?.id ?? null
		});
		if (error) setMessages((prev) => prev.filter((m) => m.id !== tempId));
		else if (data) {
			const row = data;
			setMessages((prev) => prev.some((m) => m.id === row.id) ? prev.filter((m) => m.id !== tempId) : prev.map((m) => m.id === tempId ? row : m));
		}
		return { error: error?.message ?? null };
	}, [me, threadId]);
	const remove = (0, import_react.useCallback)(async (ids) => {
		if (!ids.length) return;
		setMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
		await supabase.from("direct_messages").delete().in("id", ids);
	}, []);
	/** Marks incoming messages as read (blue ticks on the sender's side). */
	const markRead = (0, import_react.useCallback)(async (ids) => {
		if (!me || !ids.length) return;
		setMessages((prev) => prev.map((m) => ids.includes(m.id) ? {
			...m,
			is_read: true
		} : m));
		await supabase.from("direct_messages").update({ is_read: true }).in("id", ids);
	}, [me]);
	/** Burns a view-once photo after the recipient opened it (permanent, both sides). */
	const burnMedia = (0, import_react.useCallback)(async (id) => {
		const row = messagesRef.current.find((m) => m.id === id);
		const remaining = messagesRef.current.filter((m) => m.id !== id);
		messagesRef.current = remaining;
		setMessages(remaining);
		cacheSet(`thread:${threadId}`, remaining.filter((m) => !m.id.startsWith("tmp-")).slice(-40));
		await supabase.rpc("burn_view_once", { _msg_id: id });
		const url = row?.media_url;
		if (url && /^https?:/.test(url)) for (const bucket of [STORAGE_BUCKETS.messages, STORAGE_BUCKETS.voiceNotes]) {
			const path = storagePathFrom(url, bucket);
			if (path && path !== url) {
				await supabase.storage.from(bucket).remove([path]);
				break;
			}
		}
	}, [threadId]);
	return (0, import_react.useMemo)(() => ({
		messages,
		loading,
		loadingMore,
		hasMore,
		loadOlder,
		currentUserId: me,
		send,
		remove,
		markRead,
		burnMedia,
		reload: load
	}), [
		messages,
		loading,
		loadingMore,
		hasMore,
		loadOlder,
		me,
		send,
		remove,
		markRead,
		burnMedia,
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
	if (!peerId) {
		const { data: parts } = await supabase.from("thread_participants").select("user_id").eq("thread_id", threadId);
		peerId = (parts ?? []).map((p) => p.user_id).find((id) => id !== me) ?? null;
	}
	if (!peerId) {
		const { data: msgs } = await supabase.from("direct_messages").select("sender_id").eq("thread_id", threadId).limit(50);
		peerId = (msgs ?? []).map((m) => m.sender_id).find((id) => id !== me) ?? null;
	}
	if (!peerId && UUID_RE.test(threadId) && threadId !== me) peerId = threadId;
	if (!peerId) return {
		peerId: null,
		peerName: "Unknown user",
		avatarUrl: null
	};
	const { data: profileRows } = await supabase.rpc("get_public_profiles", { ids: [peerId] });
	const profile = (profileRows ?? [])[0] ?? null;
	return {
		peerId,
		peerName: profile?.display_name || profile?.username || `User ${peerId.slice(0, 6)}`,
		avatarUrl: profile?.avatar_url ?? null
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
async function createPostComment(postId, userId, body, client = supabase) {
	const text = body.trim();
	if (!text) return {
		data: null,
		error: null
	};
	const result = await client.from("post_comments").insert({
		post_id: postId,
		user_id: userId,
		body: text
	}).select("id,created_at").maybeSingle();
	return {
		data: result.data,
		error: result.error
	};
}
async function deletePostComment(id, client = supabase) {
	return { error: (await client.from("post_comments").delete().eq("id", id)).error };
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
		const { data: rows } = await supabase.from("post_comments").select("id,post_id,user_id,body,created_at,pinned,pinned_at").eq("post_id", postId).order("created_at", { ascending: true });
		if (!rows?.length) {
			setComments([]);
			setLoading(false);
			return;
		}
		const authorIds = [...new Set(rows.map((r) => r.user_id))];
		const { data: profiles } = await supabase.rpc("get_public_profiles", { ids: authorIds });
		const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
		const mapped = rows.map((r) => {
			const p = profileById.get(r.user_id);
			return {
				id: r.id,
				userId: r.user_id,
				username: p?.username ?? `user${r.user_id.slice(0, 4)}`,
				displayName: p?.display_name ?? p?.username ?? "YourWorld user",
				avatarUrl: p?.avatar_url ?? null,
				body: r.body,
				createdAt: r.created_at,
				pinned: !!r.pinned,
				pinnedAt: r.pinned_at ?? null
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
				table: "post_comments",
				filter: `post_id=eq.${postId}`
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
	const send = (0, import_react.useCallback)(async (body) => {
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
			pinnedAt: null
		}]);
		const { error } = await createPostComment(postId, me, text);
		if (error) {
			setComments((prev) => prev.filter((c) => c.id !== tempId));
			return false;
		} else load();
		return true;
	}, [
		postId,
		me,
		load
	]);
	const isPostOwner = !!me && !!postOwnerId && me === postOwnerId;
	const pinnedCount = comments.filter((c) => c.pinned).length;
	return {
		comments,
		loading,
		send,
		remove: (0, import_react.useCallback)(async (id) => {
			const snapshot = comments;
			setComments((prev) => prev.filter((c) => c.id !== id));
			const { error } = await deletePostComment(id);
			if (error) setComments(snapshot);
			return !error;
		}, [comments]),
		togglePin: (0, import_react.useCallback)(async (id) => {
			const target = comments.find((c) => c.id === id);
			if (!target || !isPostOwner) return false;
			const next = !target.pinned;
			if (next && pinnedCount >= 4) return false;
			const snapshot = comments;
			setComments((prev) => [...prev.map((c) => c.id === id ? {
				...c,
				pinned: next,
				pinnedAt: next ? (/* @__PURE__ */ new Date()).toISOString() : null
			} : c)].sort((a, b) => {
				if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
				if (a.pinned && b.pinned) return (a.pinnedAt ?? "").localeCompare(b.pinnedAt ?? "");
				return a.createdAt.localeCompare(b.createdAt);
			}));
			const { error } = await supabase.from("post_comments").update({ pinned: next }).eq("id", id);
			if (error) {
				setComments(snapshot);
				return false;
			}
			load();
			return true;
		}, [
			comments,
			isPostOwner,
			pinnedCount,
			load
		]),
		me,
		postOwnerId,
		isPostOwner,
		pinnedCount
	};
}
var MomentContext = (0, import_react.createContext)(null);
function rowToMoment(row, views, replies, author, uid) {
	const p = row.payload ?? {};
	return {
		id: row.id,
		kind: row.kind ?? "photo",
		media: row.media_url ?? "",
		mediaType: row.media_type ?? void 0,
		text: row.text ?? "",
		textBg: row.text_bg ?? "",
		music: p["music"],
		musicUrl: p["musicUrl"],
		musicStart: p["musicStart"],
		musicEnd: p["musicEnd"],
		musicVolume: p["musicVolume"],
		stickers: p["stickers"] ?? [],
		drawing: p["drawing"],
		trim: p["trim"],
		crop: p["crop"],
		location: p["location"],
		mentions: p["mentions"] ?? [],
		privacy: row.privacy ?? "everyone",
		duration: row.duration === 12 ? 12 : 24,
		effect: p["effect"] ?? "none",
		ai: p["ai"] ?? {},
		allowDownload: row.allow_download,
		screenshotAlert: row.screenshot_alert,
		allowReactions: p["allowReactions"] ?? true,
		allowReplies: p["allowReplies"] ?? true,
		allowSharing: p["allowSharing"] ?? true,
		showLocation: p["showLocation"] ?? true,
		saveToArchive: p["saveToArchive"] ?? true,
		poll: row.poll,
		createdAt: new Date(row.created_at).getTime(),
		expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : new Date(row.created_at).getTime() + (row.duration === 12 ? 12 : 24) * 36e5,
		archived: row.archived,
		viewers: views,
		replies,
		author,
		mine: !!uid && row.user_id === uid
	};
}
function payloadOf(m) {
	return {
		music: m.music ?? null,
		musicUrl: m.musicUrl ?? null,
		musicStart: m.musicStart ?? null,
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
	const ext = type.includes("audio") ? type.includes("wav") ? "wav" : type.includes("mp4") || type.includes("m4a") ? "m4a" : "mp3" : type.includes("video") ? type.includes("webm") ? "webm" : "mp4" : type.includes("png") ? "png" : "jpg";
	const path = `${uid}/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
	const { url, error } = await uploadWithProgress(STORAGE_BUCKETS.moments, path, blob, type, onProgress);
	if (error && !url) throw new Error(error);
	return path;
}
/** Signs media and music paths so any allowed viewer can play the moment. */
async function signMomentMedia(list) {
	const paths = [...new Set(list.flatMap((m) => [m.media, m.musicUrl]).filter((path) => !!path && !/^(https?:|data:|blob:)/.test(path)))];
	if (!paths.length) return list;
	const { data, error } = await supabase.storage.from(STORAGE_BUCKETS.moments).createSignedUrls(paths, 21600);
	if (error) throw new Error(`Moment media could not be opened: ${error.message}`);
	const byPath = new Map((data ?? []).filter((d) => d.signedUrl && d.path).map((d) => [d.path, d.signedUrl]));
	return list.map((m) => ({
		...m,
		media: byPath.get(m.media) ?? m.media,
		musicUrl: m.musicUrl ? byPath.get(m.musicUrl) ?? m.musicUrl : void 0
	}));
}
function MomentProvider({ children }) {
	const [moments, setMoments] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [now, setNow] = (0, import_react.useState)(() => Date.now());
	const uidRef = (0, import_react.useRef)(null);
	const archivingRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const load = (0, import_react.useCallback)(async () => {
		const { data: auth, error: authError } = await supabase.auth.getUser();
		if (authError) {
			if (isAuthSessionMissing(authError)) {
				uidRef.current = null;
				setMoments([]);
				setLoading(false);
				return;
			}
			console.error("Failed to load the signed-in user for moments", authError);
			toast.error("Couldn't load moments. Please try again.");
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
		const { data: rows, error: momentsError } = await supabase.from("moments").select("*").order("created_at", { ascending: false }).limit(200);
		if (momentsError) {
			console.error("Failed to load moments", momentsError);
			toast.error("Couldn't load moments. Please try again.");
			setLoading(false);
			return;
		}
		const list = rows ?? [];
		if (!list.length) {
			setMoments([]);
			setLoading(false);
			return;
		}
		const ids = list.map((r) => r.id);
		const authorIds = [...new Set(list.map((r) => r.user_id))];
		const [viewsResult, repliesResult, profilesResult] = await Promise.all([
			supabase.from("moment_views").select("*").in("moment_id", ids),
			supabase.from("moment_replies").select("*").in("moment_id", ids),
			supabase.rpc("get_public_profiles", { ids: authorIds })
		]);
		const relatedError = viewsResult.error ?? repliesResult.error ?? profilesResult.error;
		if (relatedError) {
			console.error("Failed to load moment details", relatedError);
			toast.error("Some moment details couldn't be loaded.");
		}
		const views = viewsResult.data;
		const replies = repliesResult.data;
		const profiles = profilesResult.data;
		const profileById = new Map((profiles ?? []).map((p) => [p.id, {
			id: p.id,
			username: p.username ?? "user",
			name: p.display_name ?? p.username ?? "User",
			avatar: p.avatar_url
		}]));
		const mapped = list.map((row) => rowToMoment(row, (views ?? []).filter((v) => v.moment_id === row.id).map((v) => ({
			userId: v.viewer_id,
			at: new Date(v.created_at).getTime(),
			liked: v.liked,
			screenshot: v.screenshot
		})), (replies ?? []).filter((r) => r.moment_id === row.id).map((r) => ({
			id: r.id,
			userId: r.user_id,
			text: r.text,
			at: new Date(r.created_at).getTime()
		})), profileById.get(row.user_id), uid));
		setMoments(await signMomentMedia(mapped));
		setLoading(false);
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
		const expiredMine = moments.filter((m) => m.mine && !m.archived && m.expiresAt && m.expiresAt <= now && !m.id.startsWith("pending-") && !archivingRef.current.has(m.id));
		if (!expiredMine.length) return;
		const ids = expiredMine.map((m) => m.id);
		ids.forEach((id) => archivingRef.current.add(id));
		setMoments((current) => current.map((moment) => ids.includes(moment.id) ? {
			...moment,
			archived: true
		} : moment));
		supabase.from("moments").update({ archived: true }).in("id", ids).then(({ error }) => {
			ids.forEach((id) => archivingRef.current.delete(id));
			if (error) {
				console.error("Automatic moment archive failed", error);
				toast.error("Couldn't archive an expired moment.");
				load();
			}
		});
	}, [
		moments,
		now,
		load
	]);
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
				const hours = m.duration === 12 ? 12 : 24;
				const { error } = await supabase.from("moments").insert({
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
					privacy: m.privacy,
					duration: hours,
					allow_download: m.allowDownload,
					screenshot_alert: m.screenshotAlert,
					poll: m.poll,
					expires_at: new Date(Date.now() + hours * 36e5).toISOString()
				});
				setMoments((p) => p.filter((x) => x.id !== tempId));
				if (error) {
					console.error("Moment database insert failed", error);
					toast.error(error.message);
					return { error: error.message };
				}
				await load();
				return { error: null };
			})();
		},
		deleteMoment: (id) => {
			setMoments((p) => p.filter((m) => m.id !== id));
			(async () => {
				const repliesResult = await supabase.from("moment_replies").delete().eq("moment_id", id);
				const viewsResult = await supabase.from("moment_views").delete().eq("moment_id", id);
				const childError = repliesResult.error ?? viewsResult.error;
				if (childError) {
					console.error("Failed to remove moment activity", childError);
					toast.error("Couldn't delete this moment.");
					await load();
					return;
				}
				const { error } = await supabase.from("moments").delete().eq("id", id);
				if (error) {
					console.error("Moment deletion failed", error);
					toast.error("Couldn't delete this moment");
					await load();
					return;
				}
				await load();
			})();
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
			patch(id, (m) => ({
				...m,
				replies: [...m.replies, {
					id: `tmp-${Date.now()}`,
					userId: uid,
					text: body,
					at: Date.now()
				}]
			}));
			const { error } = await supabase.from("moment_replies").insert({
				moment_id: id,
				user_id: uid,
				text: body
			});
			if (error) {
				console.error("Moment reply failed", error);
				toast.error("Couldn't send your reply.");
				load();
				return { error: error.message };
			}
			const target = moments.find((m) => m.id === id);
			const ownerId = target?.author?.id;
			if (ownerId && ownerId !== uid) {
				const threadId = dmThreadId(uid, ownerId);
				const { error: messageError } = await supabase.from("direct_messages").insert({
					thread_id: threadId,
					sender_id: uid,
					content: body,
					media_url: target?.media ?? null,
					media_type: "text"
				});
				if (messageError) {
					console.error("Moment reply chat delivery failed", messageError);
					toast.error("Reply saved, but chat delivery failed.");
				}
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
			supabase.from("moment_views").upsert({
				moment_id: id,
				viewer_id: uid,
				...liked === void 0 ? {} : { liked }
			}, { onConflict: "moment_id,viewer_id" }).then(({ error }) => {
				if (!error) return;
				console.error("Moment view registration failed", error);
				toast.error("Couldn't update this moment.");
			});
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
function useMoments() {
	const ctx = (0, import_react.useContext)(MomentContext);
	if (!ctx) throw new Error("useMoments must be used inside MomentProvider");
	return ctx;
}
/** CSS filter chain for the selected AI camera tools + effects. */
function aiFilterCss(ai, effect) {
	const parts = [];
	if (ai.beauty) parts.push("brightness(1.08) saturate(1.06) contrast(0.96) blur(0.4px)");
	if (ai.filter) parts.push("hue-rotate(-12deg) saturate(1.25)");
	if (ai.background) parts.push("contrast(1.12) saturate(1.3)");
	if (ai.cartoon) parts.push("contrast(1.5) saturate(1.7) brightness(1.05)");
	if (ai.eraser) parts.push("brightness(1.02)");
	if (effect === "greenscreen") parts.push("saturate(1.4) hue-rotate(8deg)");
	return parts.join(" ") || "none";
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
var ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:global.stun.twilio.com:3478" }];
var CallCtx = (0, import_react.createContext)({
	startCall: async () => {},
	myCallId: null,
	isGuest: true
});
var useCall = () => (0, import_react.useContext)(CallCtx);
var uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
var GUEST_KEY = "yw.guest-call-id";
/** Stable per-browser temporary id so signed-out users can still ring and be rung. */
function getGuestCallId() {
	if (typeof window === "undefined") return "";
	try {
		const existing = window.localStorage.getItem(GUEST_KEY);
		if (existing) return existing;
		const fresh = `guest-${uid()}`;
		window.localStorage.setItem(GUEST_KEY, fresh);
		return fresh;
	} catch {
		return `guest-${uid()}`;
	}
}
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
/** HTML5 <audio> ringtone: incoming ring, or ringback while our outgoing call connects. */
function useRingtone(kind) {
	(0, import_react.useEffect)(() => {
		if (!kind || typeof window === "undefined") return;
		let audio = null;
		try {
			if (kind === "incoming") incomingUrl ??= buildRingToneUrl([440, 480], 1.2, 3);
			else ringbackUrl ??= buildRingToneUrl([440, 480], 1, 4);
			audio = new Audio(kind === "incoming" ? incomingUrl : ringbackUrl);
			audio.loop = true;
			audio.volume = kind === "incoming" ? 1 : .6;
			audio.play().catch(() => {});
		} catch {}
		if (kind === "incoming" && navigator.vibrate) try {
			navigator.vibrate([
				400,
				300,
				400,
				300,
				400
			]);
		} catch {}
		return () => {
			if (audio) {
				audio.pause();
				audio.src = "";
			}
			if (navigator.vibrate) try {
				navigator.vibrate(0);
			} catch {}
		};
	}, [kind]);
}
function CallProvider({ children }) {
	const [authId, setAuthId] = (0, import_react.useState)(null);
	const [guestId, setGuestId] = (0, import_react.useState)(null);
	const me = authId ?? guestId;
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
	const hideTimer = (0, import_react.useRef)(null);
	const ringTimer = (0, import_react.useRef)(null);
	const pcRef = (0, import_react.useRef)(null);
	const localStream = (0, import_react.useRef)(null);
	const sigRef = (0, import_react.useRef)(null);
	const pendingIce = (0, import_react.useRef)([]);
	const localVideo = (0, import_react.useRef)(null);
	const remoteVideo = (0, import_react.useRef)(null);
	const remoteAudio = (0, import_react.useRef)(null);
	const remoteStream = (0, import_react.useRef)(null);
	/** Call ids we've already reacted to (broadcast + database ring paths). */
	const seenCalls = (0, import_react.useRef)(/* @__PURE__ */ new Set());
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
	useRingtone(phase === "incoming" ? "incoming" : phase === "outgoing" ? "ringback" : null);
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
			if (remoteAudio.current) remoteAudio.current.muted = !next;
			if (remoteVideo.current) remoteVideo.current.muted = true;
			return next;
		});
	}, []);
	(0, import_react.useEffect)(() => {
		setGuestId(getGuestCallId());
		supabase.auth.getUser().then(({ data }) => setAuthId(data.user?.id ?? null));
		const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
			setAuthId(session?.user.id ?? null);
		});
		return () => sub.subscription.unsubscribe();
	}, []);
	const teardown = (0, import_react.useCallback)(() => {
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
			try {
				pc.close();
			} catch {}
		}
		pcRef.current = null;
		if (sigRef.current) {
			supabase.removeChannel(sigRef.current);
			sigRef.current = null;
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
		setPhase("idle");
		setCall(null);
		setMicOn(true);
		setCamOn(true);
		setFacingMode("user");
		setFlashOn(false);
		setSwapped(false);
		setControlsVisible(true);
	}, []);
	const signal = (0, import_react.useCallback)((payload) => {
		sigRef.current?.send({
			type: "broadcast",
			event: "signal",
			payload
		});
	}, []);
	/**
	* Sends a broadcast over REST instead of joining the topic.
	* Realtime RLS only lets you *read* your own `calls-user-<id>` topic, so a
	* caller can never subscribe to the callee's ring topic — but it may write
	* to it. REST delivery uses only that write permission, which makes rings,
	* cancels and declines arrive instantly in both Social and Orbit chats.
	*/
	const httpBroadcast = (0, import_react.useCallback)(async (topic, event, payload) => {
		const ch = supabase.channel(topic, { config: { private: true } });
		try {
			const { data } = await supabase.auth.getSession();
			await supabase.realtime.setAuth(data.session?.access_token);
			await ch.httpSend(event, payload);
		} catch (err) {
			console.error("[call] broadcast failed", topic, event, err);
		} finally {
			supabase.removeChannel(ch);
		}
	}, []);
	const attachStreams = (0, import_react.useCallback)(() => {
		if (localVideo.current && localStream.current) {
			localVideo.current.srcObject = localStream.current;
			localVideo.current.play().catch(() => {});
		}
		if (remoteStream.current) {
			if (remoteVideo.current) {
				remoteVideo.current.srcObject = remoteStream.current;
				remoteVideo.current.play().catch(() => {});
			}
			if (remoteAudio.current) {
				remoteAudio.current.srcObject = remoteStream.current;
				remoteAudio.current.play().catch(() => {});
			}
		}
	}, []);
	const getMedia = (0, import_react.useCallback)(async (mode) => {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: mode === "video" ? {
				facingMode,
				width: { ideal: 1280 }
			} : false
		});
		localStream.current = stream;
		attachStreams();
		return stream;
	}, [attachStreams, facingMode]);
	const phaseRef = (0, import_react.useRef)("idle");
	(0, import_react.useEffect)(() => {
		phaseRef.current = phase;
	}, [phase]);
	(0, import_react.useEffect)(() => {
		if (phase !== "incoming") return;
		const t = window.setTimeout(() => {
			toast.message("Missed call");
			teardown();
		}, 45e3);
		return () => window.clearTimeout(t);
	}, [phase, teardown]);
	const callRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		callRef.current = call;
	}, [call]);
	const meRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		meRef.current = me;
	}, [me]);
	const isGuestRef = (0, import_react.useRef)(true);
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
		if (c.peerId.startsWith("guest-")) return;
		if (loggedCall.current === c.callId) return;
		loggedCall.current = c.callId;
		const durMs = connectedAt.current ? Date.now() - connectedAt.current : null;
		connectedAt.current = null;
		const fmtDur = (ms) => {
			const s = Math.max(1, Math.round(ms / 1e3));
			return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
		};
		const label = c.mode === "video" ? "Video" : "Voice";
		const text = outcome === "answered" && durMs != null ? `${label} call · ${fmtDur(durMs)}` : outcome === "declined" ? `${label} call declined` : `Missed ${label.toLowerCase()} call`;
		try {
			if (c.threadId) await supabase.from("direct_messages").insert({
				thread_id: c.threadId,
				sender_id: meId,
				content: text,
				media_type: "system"
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
	const createPeer = (0, import_react.useCallback)((stream) => {
		const pc = new RTCPeerConnection({
			iceServers: ICE_SERVERS,
			iceCandidatePoolSize: 4
		});
		pcRef.current = pc;
		stream.getTracks().forEach((t) => pc.addTrack(t, stream));
		pc.onicecandidate = (e) => {
			if (e.candidate) signal({
				type: "ice",
				candidate: e.candidate.toJSON()
			});
		};
		pc.ontrack = (e) => {
			let s = e.streams[0] ?? remoteStream.current;
			if (!s) s = new MediaStream();
			if (!e.streams[0] && !s.getTracks().includes(e.track)) s.addTrack(e.track);
			remoteStream.current = s;
			const attachNow = () => {
				if (remoteVideo.current) {
					remoteVideo.current.srcObject = s;
					remoteVideo.current.play().catch(() => {});
				}
				if (remoteAudio.current) {
					remoteAudio.current.srcObject = s;
					remoteAudio.current.play().catch(() => {});
				}
			};
			attachNow();
			requestAnimationFrame(attachNow);
			requestAnimationFrame(() => requestAnimationFrame(attachNow));
		};
		pc.onconnectionstatechange = () => {
			if (pc.connectionState === "connected") {
				connectedAt.current ??= Date.now();
				setPhase("active");
			}
			if (pc.connectionState === "failed") {
				toast.error("Call connection failed");
				logCallOutcome("missed");
				teardown();
			}
		};
		return pc;
	}, [
		signal,
		teardown,
		logCallOutcome
	]);
	const flushIce = (0, import_react.useCallback)(async () => {
		const pc = pcRef.current;
		if (!pc) return;
		for (const c of pendingIce.current) try {
			await pc.addIceCandidate(new RTCIceCandidate(c));
		} catch {}
		pendingIce.current = [];
	}, []);
	const openSignalChannel = (0, import_react.useCallback)((callId, mode, isCaller) => new Promise((resolve) => {
		(async () => {
			const { data: sess } = await supabase.auth.getSession();
			await supabase.realtime.setAuth(sess.session?.access_token);
			const ch = supabase.channel(`rtc-${callId}`, { config: {
				broadcast: { self: false },
				private: true
			} });
			sigRef.current = ch;
			ch.on("broadcast", { event: "signal" }, async ({ payload }) => {
				const pc = pcRef.current;
				try {
					if (payload.type === "accept" && isCaller) {
						setPhase("connecting");
						const stream = localStream.current ?? await getMedia(mode);
						const peer = pcRef.current ?? createPeer(stream);
						const offer = await peer.createOffer();
						await peer.setLocalDescription(offer);
						signal({
							type: "offer",
							sdp: peer.localDescription
						});
					} else if (payload.type === "offer" && !isCaller) {
						const stream = localStream.current ?? await getMedia(mode);
						const peer = pcRef.current ?? createPeer(stream);
						await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
						await flushIce();
						const answer = await peer.createAnswer();
						await peer.setLocalDescription(answer);
						signal({
							type: "answer",
							sdp: peer.localDescription
						});
						setPhase("connecting");
					} else if (payload.type === "answer" && pc) {
						await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
						await flushIce();
					} else if (payload.type === "ice") {
						if (pc?.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
						else pendingIce.current.push(payload.candidate);
					} else if (payload.type === "end") {
						toast.message("Call ended");
						logCallOutcome(connectedAt.current ? "answered" : "missed");
						teardown();
					} else if (payload.type === "decline") {
						toast.message("Call declined");
						logCallOutcome("declined");
						teardown();
					}
				} catch (err) {
					console.error("[call] signal error", err);
				}
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
		})().catch((error) => {
			console.error("[call] signalling setup failed", error);
			resolve();
		});
	}), [
		createPeer,
		flushIce,
		getMedia,
		signal,
		teardown,
		logCallOutcome
	]);
	(0, import_react.useEffect)(() => {
		if (!me) return;
		let ch = null;
		let retry = null;
		let alive = true;
		let connecting = false;
		const listen = async () => {
			if (!alive || connecting || ch) return;
			connecting = true;
			const { data } = await supabase.auth.getSession();
			if (!alive) {
				connecting = false;
				return;
			}
			await supabase.realtime.setAuth(data.session?.access_token);
			if (!alive) {
				connecting = false;
				return;
			}
			const nextChannel = supabase.channel(`calls-user-${me}`, { config: {
				broadcast: { self: false },
				private: true
			} }).on("broadcast", { event: "ring" }, ({ payload }) => {
				if (!payload?.callId || seenCalls.current.has(payload.callId)) return;
				if (!String(payload.callId).includes(me)) return;
				markSeen(payload.callId);
				if (pcRef.current || phaseRef.current !== "idle") {
					httpBroadcast(`rtc-${payload.callId}`, "signal", { type: "decline" });
					return;
				}
				setCall({
					callId: payload.callId,
					mode: payload.mode,
					peerId: payload.fromId,
					peerName: payload.fromName ?? "Incoming call",
					incoming: true
				});
				setPhase("incoming");
				toast.message(`Incoming ${payload.mode === "video" ? "video" : "voice"} call`, { description: payload.fromName ?? "Someone is calling you" });
			}).on("broadcast", { event: "cancel" }, () => {
				if (phaseRef.current === "incoming") {
					toast.message("Missed call");
					teardown();
				}
			}).subscribe((status) => {
				if (status === "SUBSCRIBED") connecting = false;
				if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
					if (ch === nextChannel) ch = null;
					connecting = false;
					if (status !== "CLOSED") window.setTimeout(() => void supabase.removeChannel(nextChannel), 0);
					if (alive && !retry) retry = setTimeout(() => {
						retry = null;
						listen();
					}, 1500);
				}
			});
			ch = nextChannel;
		};
		listen();
		const wake = () => {
			if (document.visibilityState === "visible" && !ch && !connecting) listen();
		};
		document.addEventListener("visibilitychange", wake);
		window.addEventListener("online", wake);
		return () => {
			alive = false;
			if (retry) clearTimeout(retry);
			document.removeEventListener("visibilitychange", wake);
			window.removeEventListener("online", wake);
			if (ch) supabase.removeChannel(ch);
		};
	}, [
		me,
		teardown,
		httpBroadcast,
		markSeen
	]);
	(0, import_react.useEffect)(() => {
		if (!authId) return;
		const me2 = authId;
		const ch = supabase.channel(`calls-db-${me2}`).on("postgres_changes", {
			event: "INSERT",
			schema: "public",
			table: "calls",
			filter: `callee_id=eq.${me2}`
		}, ({ new: row }) => {
			const callId = String(row.call_id ?? "");
			if (!callId || seenCalls.current.has(callId)) return;
			if (row.status !== "ringing") return;
			if (Date.now() - new Date(String(row.created_at)).getTime() > 6e4) return;
			markSeen(callId);
			if (pcRef.current || phaseRef.current !== "idle") {
				supabase.from("calls").update({ status: "declined" }).eq("call_id", callId);
				httpBroadcast(`rtc-${callId}`, "signal", { type: "decline" });
				return;
			}
			const mode = row.mode === "video" ? "video" : "audio";
			setCall({
				callId,
				mode,
				peerId: String(row.caller_id),
				peerName: row.caller_name || "Incoming call",
				incoming: true
			});
			setPhase("incoming");
			toast.message(`Incoming ${mode === "video" ? "video" : "voice"} call`, { description: row.caller_name || "Someone is calling you" });
		}).on("postgres_changes", {
			event: "UPDATE",
			schema: "public",
			table: "calls",
			filter: `callee_id=eq.${me2}`
		}, ({ new: row }) => {
			const callId = String(row.call_id ?? "");
			const status = String(row.status ?? "");
			if (phaseRef.current !== "incoming") return;
			if (callId !== callRef.current?.callId) return;
			if (status === "ended" || status === "cancelled") {
				toast.message("Missed call");
				teardown();
			}
		}).subscribe();
		return () => {
			supabase.removeChannel(ch);
		};
	}, [
		authId,
		teardown,
		httpBroadcast,
		markSeen
	]);
	const startCall = (0, import_react.useCallback)(async ({ threadId, peerId, peerName, mode }) => {
		if (!me) {
			toast.error("Calling isn't ready yet — try again in a moment");
			return;
		}
		let target = peerId ?? null;
		if (!target && threadId && !isGuest) {
			const { data } = await supabase.from("thread_participants").select("user_id").eq("thread_id", threadId);
			target = (data ?? []).map((r) => r.user_id).find((id) => id !== me) ?? null;
		}
		if (!target) {
			toast.error(isGuest ? "Guest calls need the other person's call ID" : "This person isn't reachable for calls yet");
			return;
		}
		const callId = `${[me, target].sort().join(".")}.${uid()}`;
		let myName = "Guest";
		if (!isGuest) {
			const { data: myProfile } = await supabase.from("profiles").select("display_name, username").eq("id", me).maybeSingle();
			myName = myProfile?.display_name || myProfile?.username || "Someone";
		}
		setCall({
			callId,
			mode,
			peerId: target,
			peerName: peerName ?? "Calling…",
			incoming: false,
			threadId: threadId ?? null
		});
		setPhase("outgoing");
		try {
			await getMedia(mode);
		} catch {
			toast.error("Camera / microphone permission denied");
			teardown();
			return;
		}
		createPeer(localStream.current);
		await openSignalChannel(callId, mode, true);
		const ringPayload = {
			callId,
			mode,
			fromId: me,
			fromName: myName,
			threadId
		};
		markSeen(callId);
		if (!isGuest) {
			const { error } = await supabase.from("calls").insert({
				call_id: callId,
				caller_id: me,
				callee_id: target,
				caller_name: myName,
				mode,
				thread_id: threadId ?? null,
				status: "ringing"
			});
			if (error) {
				toast.error(`Call could not start: ${error.message}`);
				teardown();
				return;
			}
		}
		httpBroadcast(`calls-user-${target}`, "ring", ringPayload);
		let sent = 1;
		const timer = window.setInterval(() => {
			if (phaseRef.current !== "outgoing" || sent >= 4) {
				window.clearInterval(timer);
				return;
			}
			sent++;
			httpBroadcast(`calls-user-${target}`, "ring", ringPayload);
		}, 1500);
		if (ringTimer.current) window.clearTimeout(ringTimer.current);
		ringTimer.current = window.setTimeout(() => {
			ringTimer.current = null;
			if (phaseRef.current !== "outgoing") return;
			window.clearInterval(timer);
			toast.message("No answer");
			httpBroadcast(`calls-user-${target}`, "cancel", { callId });
			supabase.from("calls").update({ status: "cancelled" }).eq("call_id", callId);
			logCallOutcome("missed");
			teardown();
		}, 45e3);
	}, [
		me,
		isGuest,
		getMedia,
		createPeer,
		openSignalChannel,
		teardown,
		httpBroadcast,
		logCallOutcome,
		markSeen
	]);
	const accept = (0, import_react.useCallback)(async () => {
		if (!call) return;
		if (ringTimer.current) {
			window.clearTimeout(ringTimer.current);
			ringTimer.current = null;
		}
		setPhase("connecting");
		try {
			await getMedia(call.mode);
		} catch {
			toast.error("Camera / microphone permission denied");
			supabase.from("calls").update({ status: "declined" }).eq("call_id", call.callId);
			teardown();
			return;
		}
		createPeer(localStream.current);
		await openSignalChannel(call.callId, call.mode, false);
		signal({ type: "accept" });
		const { error } = await supabase.from("calls").update({ status: "accepted" }).eq("call_id", call.callId);
		if (error) {
			toast.error(`Call could not connect: ${error.message}`);
			teardown();
		}
	}, [
		call,
		getMedia,
		createPeer,
		openSignalChannel,
		signal,
		teardown
	]);
	const hangup = (0, import_react.useCallback)(async () => {
		if (call && phase === "incoming") {
			httpBroadcast(`rtc-${call.callId}`, "signal", { type: "decline" });
			supabase.from("calls").update({ status: "declined" }).eq("call_id", call.callId);
		} else if (call) {
			signal({ type: "end" });
			httpBroadcast(`rtc-${call.callId}`, "signal", { type: "end" });
			httpBroadcast(`calls-user-${call.peerId}`, "cancel", { callId: call.callId });
			supabase.from("calls").update({ status: "ended" }).eq("call_id", call.callId);
			logCallOutcome(connectedAt.current ? "answered" : "missed");
		}
		teardown();
	}, [
		call,
		phase,
		signal,
		teardown,
		httpBroadcast,
		logCallOutcome
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
		if (oldTrack) {
			oldTrack.stop();
			localStream.current?.removeTrack(oldTrack);
		}
		setFlashOn(false);
		try {
			const newVideoTrack = (await navigator.mediaDevices.getUserMedia({
				audio: false,
				video: {
					facingMode: { ideal: next },
					width: { ideal: 1280 }
				}
			})).getVideoTracks()[0];
			const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");
			if (sender && newVideoTrack) await sender.replaceTrack(newVideoTrack);
			if (localStream.current && newVideoTrack) localStream.current.addTrack(newVideoTrack);
			setFacingMode(next);
			attachStreams();
		} catch {
			toast.error("Couldn't switch camera");
			try {
				const t = (await navigator.mediaDevices.getUserMedia({
					audio: false,
					video: {
						facingMode: { ideal: facingMode },
						width: { ideal: 1280 }
					}
				})).getVideoTracks()[0];
				const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");
				if (sender && t) await sender.replaceTrack(t);
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
		if (!peerId || peerId.startsWith("guest-")) return;
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
		isGuest
	}), [
		startCall,
		me,
		isGuest
	]);
	const statusText = phase === "incoming" ? `Incoming ${call?.mode === "video" ? "video" : "voice"} call…` : phase === "outgoing" ? "Ringing…" : phase === "connecting" ? "Connecting…" : "Connected";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CallCtx.Provider, {
		value,
		children: [children, call && phase !== "idle" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "fixed inset-0 z-[100] flex flex-col justify-between bg-zinc-950 p-6 text-white",
			onClick: phase === "incoming" ? void 0 : pokeControls,
			children: [
				call.mode === "video" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						ref: remoteVideo,
						autoPlay: true,
						playsInline: true,
						muted: true,
						onClick: swapped ? (e) => {
							e.stopPropagation();
							setSwapped(false);
						} : void 0,
						className: swapped ? "absolute right-4 top-28 z-20 h-40 w-28 cursor-pointer rounded-2xl border border-white/20 object-cover shadow-2xl transition-all active:scale-95" : "absolute inset-0 z-0 h-full w-full object-cover"
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
						className: swapped ? "absolute inset-0 z-0 h-full w-full object-cover" : "absolute right-4 top-28 z-20 h-40 w-28 cursor-pointer rounded-2xl border border-white/20 object-cover shadow-2xl transition-all active:scale-95"
					}),
					phase !== "incoming" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `absolute right-3 top-3 z-[9999] flex items-center gap-2 rounded-full border border-white/15 bg-black/40 p-1.5 shadow-lg backdrop-blur-xl transition-all duration-300 ${controlsVisible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"}`,
						onClick: (e) => e.stopPropagation(),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => void flipCamera(),
								className: "grid h-9 w-9 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/10 active:scale-90",
								"aria-label": "Flip camera",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchCamera, { size: 17 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => void toggleFlash(),
								className: "grid h-9 w-9 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/10 active:scale-90",
								"aria-label": "Toggle flashlight",
								children: flashOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, {
									size: 17,
									className: "text-yellow-400"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZapOff, { size: 17 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: toggleSpeaker,
								className: "grid h-9 w-9 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/10 active:scale-90",
								"aria-label": "Toggle speaker",
								children: speakerOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { size: 17 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { size: 17 })
							})
						]
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
					ref: remoteAudio,
					autoPlay: true,
					className: "hidden"
				}),
				phase === "incoming" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-0 z-0 overflow-hidden",
					children: [peerAvatar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: peerAvatar,
						alt: "",
						"aria-hidden": true,
						className: "h-full w-full scale-125 object-cover opacity-60 blur-3xl"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-full bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.35),transparent_65%)]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/85" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative z-10 flex flex-1 flex-col items-center justify-center gap-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex h-40 w-40 items-center justify-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-0 animate-ping rounded-full bg-emerald-400/20" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute inset-4 animate-ping rounded-full bg-emerald-400/25",
								style: { animationDelay: "0.6s" }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-6 rounded-full ring-1 ring-white/25" }),
							peerAvatar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: peerAvatar,
								alt: call.peerName,
								className: "relative h-28 w-28 rounded-full object-cover shadow-[0_0_40px_rgba(16,185,129,0.45)]"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "relative grid h-28 w-28 place-items-center rounded-full bg-white/10 text-4xl font-bold backdrop-blur-md shadow-[0_0_40px_rgba(16,185,129,0.45)]",
								children: call.peerName?.charAt(0)?.toUpperCase() || "?"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-2xl font-semibold tracking-tight drop-shadow-lg",
							children: call.peerName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-md",
							children: call.mode === "video" ? "Incoming video call" : "Incoming voice call"
						})]
					})]
				})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `relative z-10 mt-12 flex flex-col gap-1 px-2 transition-opacity duration-300 ${controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-bold drop-shadow-lg",
						children: call.peerName
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "animate-pulse text-xs font-bold text-emerald-400 drop-shadow-lg",
						children: statusText
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative z-10 mb-10 flex items-center justify-center gap-6",
					children: phase === "incoming" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex w-full items-center justify-between px-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => void hangup(),
							className: "flex flex-col items-center gap-2",
							"aria-label": "Decline call",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-16 w-16 place-items-center rounded-full bg-red-600 shadow-[0_10px_30px_-6px_rgba(220,38,38,0.8)] transition-transform active:scale-90",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneOff, { size: 26 })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-white/70",
								children: "Decline"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => void accept(),
							className: "flex flex-col items-center gap-2",
							"aria-label": "Accept call",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-16 w-16 animate-bounce place-items-center rounded-full bg-emerald-500 shadow-[0_10px_30px_-6px_rgba(16,185,129,0.85)] transition-transform active:scale-90",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { size: 26 })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-white/70",
								children: "Accept"
							})]
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `flex items-center gap-4 rounded-full border border-white/10 bg-black/40 px-4 py-2.5 shadow-2xl backdrop-blur-xl transition-all duration-300 ${controlsVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`,
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
								onClick: () => void hangup(),
								className: "grid h-12 w-12 place-items-center rounded-full bg-red-600 text-white shadow-[0_8px_24px_-6px_rgba(220,38,38,0.8)] transition-transform active:scale-90",
								"aria-label": "End call",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneOff, { size: 20 })
							})
						]
					})
				})
			]
		})]
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
	const timers = (0, import_react.useRef)([]);
	(0, import_react.useEffect)(() => () => {
		timers.current.forEach(clearTimeout);
	}, []);
	const patch = (0, import_react.useCallback)((id, next) => {
		setTasks((prev) => prev.map((t) => t.id === id ? {
			...t,
			...next
		} : t));
	}, []);
	const dismiss = (0, import_react.useCallback)((id) => {
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
		let result;
		try {
			result = await runner((p) => patch(id, {
				progress: p,
				status: p >= 100 ? "processing" : "uploading"
			}));
		} catch (e) {
			result = { error: e instanceof Error ? e.message : "Upload failed" };
		}
		if (result.error) {
			patch(id, {
				status: "error",
				error: result.error
			});
			timers.current.push(setTimeout(() => dismiss(id), 8e3));
		} else {
			patch(id, {
				status: "done",
				progress: 100
			});
			timers.current.push(setTimeout(() => dismiss(id), 6e3));
		}
		return result;
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
								children: t.status === "error" ? t.error : t.status === "done" ? t.label : t.status === "processing" ? "Finishing up…" : `${t.progress}% · ${t.label}`
							})]
						}),
						t.status === "done" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: t.viewTo,
							onClick: () => dismiss(t.id),
							className: "shrink-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-1.5 text-[11px] font-bold text-white",
							children: "View"
						}) : t.status === "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
							size: 18,
							className: "shrink-0 text-red-400"
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
var Route$45 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"
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
	const { queryClient } = Route$45.useRouteContext();
	const { pathname } = useLocation();
	const [createOpen, setCreateOpen] = (0, import_react.useState)(false);
	const hideNav = pathname.startsWith("/orbit") || pathname.startsWith("/auth") || pathname.startsWith("/create") || pathname.startsWith("/moment/create") || pathname.startsWith("/channel/create");
	(0, import_react.useEffect)(() => {
		setCreateOpen(false);
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SafeProvider, {
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
		}) })
	});
}
var $$splitComponentImporter$43 = () => import("./routes-DRCcZN2c.mjs");
var Route$44 = createFileRoute("/")({
	component: lazyRouteComponent($$splitComponentImporter$43, "component"),
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
var $$splitComponentImporter$42 = () => import("./route-Di7iQBCH.mjs");
var Route$43 = createFileRoute("/_authenticated")({
	ssr: false,
	beforeLoad: async ({ location }) => {
		const { data, error } = await supabase.auth.getUser();
		if (error || !data.user) throw redirect({
			to: "/auth",
			search: { redirect: location.href }
		});
		return { user: data.user };
	},
	component: lazyRouteComponent($$splitComponentImporter$42, "component")
});
var $$splitComponentImporter$41 = () => import("./account-56ZRlA7F.mjs");
var Route$42 = createFileRoute("/account")({
	head: () => ({ meta: [{ title: "Account — YourWorld" }] }),
	component: lazyRouteComponent($$splitComponentImporter$41, "component")
});
var $$splitComponentImporter$40 = () => import("./auth-Cd_o_t22.mjs");
var Route$41 = createFileRoute("/auth")({ component: lazyRouteComponent($$splitComponentImporter$40, "component") });
var $$splitComponentImporter$39 = () => import("./channel-DOqQDY5z.mjs");
var Route$40 = createFileRoute("/channel")({ component: lazyRouteComponent($$splitComponentImporter$39, "component") });
var $$splitComponentImporter$38 = () => import("./copyright-policy-CU2VgRpK.mjs");
var Route$39 = createFileRoute("/copyright-policy")({
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
	component: lazyRouteComponent($$splitComponentImporter$38, "component")
});
var $$splitComponentImporter$37 = () => import("./create-DdzZFyvh.mjs");
var Route$38 = createFileRoute("/create")({
	validateSearch: (search) => ({ mode: search.mode === "live" ? "live" : "reel" }),
	head: () => ({ meta: [
		{ title: "Camera & Pro Edits Studio — YourWorld" },
		{
			name: "description",
			content: "Shoot in 4K/60fps with flip camera, pinch zoom and one-tap record, then jump straight into the YourWorld Pro Edits Studio."
		},
		{
			property: "og:title",
			content: "Camera & Pro Edits Studio — YourWorld"
		},
		{
			property: "og:description",
			content: "Capture posts, reels and live moments in ultra HD, then edit them instantly."
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
	component: lazyRouteComponent($$splitComponentImporter$37, "component")
});
var $$splitComponentImporter$36 = () => import("./licenses-BYcusFDE.mjs");
var Route$37 = createFileRoute("/licenses")({
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
	component: lazyRouteComponent($$splitComponentImporter$36, "component")
});
var $$splitComponentImporter$35 = () => import("./notifications-TIkYGp5j.mjs");
var Route$36 = createFileRoute("/notifications")({
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
	component: lazyRouteComponent($$splitComponentImporter$35, "component")
});
var $$splitComponentImporter$34 = () => import("./orbit-BU6_cHMm.mjs");
var Route$35 = createFileRoute("/orbit")({ component: lazyRouteComponent($$splitComponentImporter$34, "component") });
var $$splitComponentImporter$33 = () => import("./privacy-CoY-PyCl.mjs");
var Route$34 = createFileRoute("/privacy")({
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
	component: lazyRouteComponent($$splitComponentImporter$33, "component")
});
var $$splitComponentImporter$32 = () => import("./profile-Cie7bIZn.mjs");
var Route$33 = createFileRoute("/profile")({
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
	component: lazyRouteComponent($$splitComponentImporter$32, "component")
});
var $$splitComponentImporter$31 = () => import("./reels-BBVYzKBa.mjs");
var Route$32 = createFileRoute("/reels")({
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
	component: lazyRouteComponent($$splitComponentImporter$31, "component")
});
/**
* Renders reel media with graceful recovery: if the stored URL fails to load
* (expired signed URL, missing public URL) we retry with a freshly resolved
* Supabase URL, then with a local blob URL from this session, then fall back
* to an image.
*/
var $$splitComponentImporter$30 = () => import("./reset-password-CLNY0nyx.mjs");
var Route$31 = createFileRoute("/reset-password")({
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
	component: lazyRouteComponent($$splitComponentImporter$30, "component")
});
var $$splitComponentImporter$29 = () => import("./search-DhgCF2hd.mjs");
var Route$30 = createFileRoute("/search")({
	head: () => ({ meta: [{ title: "Search · YourWorld" }] }),
	component: lazyRouteComponent($$splitComponentImporter$29, "component")
});
var $$splitComponentImporter$28 = () => import("./settings-C-ZH6X9C.mjs");
var Route$29 = createFileRoute("/settings")({
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
	component: lazyRouteComponent($$splitComponentImporter$28, "component")
});
var BASE_URL = "";
var Route$28 = createFileRoute("/sitemap.xml")({ server: { handlers: { GET: async () => {
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
var $$splitComponentImporter$27 = () => import("./terms-CI9_OL7X.mjs");
var Route$27 = createFileRoute("/terms")({
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
	component: lazyRouteComponent($$splitComponentImporter$27, "component")
});
var $$splitComponentImporter$26 = () => import("./wallet-C-LxSWhV.mjs");
var Route$26 = createFileRoute("/wallet")({
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
	component: lazyRouteComponent($$splitComponentImporter$26, "component")
});
var $$splitComponentImporter$25 = () => import("./admin.copyright-reports-CxL9hmbR.mjs");
var Route$25 = createFileRoute("/admin/copyright-reports")({
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
	component: lazyRouteComponent($$splitComponentImporter$25, "component")
});
var $$splitComponentImporter$24 = () => import("./channel.index-FuPPrQ2y.mjs");
var Route$24 = createFileRoute("/channel/")({ component: lazyRouteComponent($$splitComponentImporter$24, "component") });
var $$splitComponentImporter$23 = () => import("./channel.analytics-gV9ZyzpI.mjs");
var Route$23 = createFileRoute("/channel/analytics")({
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
	component: lazyRouteComponent($$splitComponentImporter$23, "component")
});
var $$splitComponentImporter$22 = () => import("./channel.create-CQPSTI_H.mjs");
var Route$22 = createFileRoute("/channel/create")({
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
	component: lazyRouteComponent($$splitComponentImporter$22, "component")
});
var $$splitComponentImporter$21 = () => import("./channel.monetization-C3SZtdXj.mjs");
var Route$21 = createFileRoute("/channel/monetization")({
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
	component: lazyRouteComponent($$splitComponentImporter$21, "component")
});
var $$splitComponentImporter$20 = () => import("./channel.posts-19_1fumx.mjs");
var Route$20 = createFileRoute("/channel/posts")({
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
	component: lazyRouteComponent($$splitComponentImporter$20, "component")
});
var $$splitComponentImporter$19 = () => import("./channel.reels-ShqveL3s.mjs");
var Route$19 = createFileRoute("/channel/reels")({
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
	component: lazyRouteComponent($$splitComponentImporter$19, "component")
});
var $$splitComponentImporter$18 = () => import("./channel.subscribers-CCjygQk7.mjs");
var Route$18 = createFileRoute("/channel/subscribers")({
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
	component: lazyRouteComponent($$splitComponentImporter$18, "component")
});
var $$splitComponentImporter$17 = () => import("./channel.videos-CvgGJvjr.mjs");
var Route$17 = createFileRoute("/channel/videos")({
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
	component: lazyRouteComponent($$splitComponentImporter$17, "component")
});
var $$splitComponentImporter$16 = () => import("./moment.index-DLq_Kvxv.mjs");
var Route$16 = createFileRoute("/moment/")({
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
	component: lazyRouteComponent($$splitComponentImporter$16, "component")
});
var $$splitComponentImporter$15 = () => import("./moment._momentId-D1ihJNeo.mjs");
/** photo / text segment length (ms) */
/** long videos are split into chunks of this many seconds */
var Route$15 = createFileRoute("/moment/$momentId")({
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
	component: lazyRouteComponent($$splitComponentImporter$15, "component")
});
var $$splitComponentImporter$14 = () => import("./moment.create-CrQxU8Xa.mjs");
var Route$14 = createFileRoute("/moment/create")({ component: lazyRouteComponent($$splitComponentImporter$14, "component") });
var $$splitComponentImporter$13 = () => import("./orbit.index-DJQfL4O4.mjs");
var Route$13 = createFileRoute("/orbit/")({
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
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
var $$splitComponentImporter$12 = () => import("./orbit._profileId-BIbHXXMp.mjs");
var Route$12 = createFileRoute("/orbit/$profileId")({
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
	component: lazyRouteComponent($$splitComponentImporter$12, "component")
});
var $$splitComponentImporter$11 = () => import("./orbit.create-CaISCoS3.mjs");
var Route$11 = createFileRoute("/orbit/create")({
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
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
var $$splitComponentImporter$10 = () => import("./orbit.me-BK5XHLqX.mjs");
var Route$10 = createFileRoute("/orbit/me")({
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
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("./orbit.messages-DhtqkVhh.mjs");
var Route$9 = createFileRoute("/orbit/messages")({
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
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./orbit.notifications-9oJmZksH.mjs");
var Route$8 = createFileRoute("/orbit/notifications")({
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
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./orbit.privacy-ufH3Eo_Y.mjs");
var Route$7 = createFileRoute("/orbit/privacy")({
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
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./post.create-CYz3uFk4.mjs");
var Route$6 = createFileRoute("/post/create")({
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
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./u._userId-CVzHMcdo.mjs");
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
var $$splitComponentImporter$4 = () => import("./video._videoId-BYfV-b3X.mjs");
var Route$4 = createFileRoute("/video/$videoId")({
	head: () => ({ meta: [
		{ title: "YourWorld — Watch" },
		{
			name: "description",
			content: "Watch long-form videos on YourWorld with a sticky premium player, comments and recommendations."
		},
		{
			property: "og:title",
			content: "YourWorld — Watch"
		},
		{
			property: "og:description",
			content: "Watch long-form videos on YourWorld."
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
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./video.upload-eckDfV3K.mjs");
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
var $$splitComponentImporter$2 = () => import("./chat.index-J6BfEx8B.mjs");
var Route$2 = createFileRoute("/_authenticated/chat/")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./chat._threadId-ioHt1e_m.mjs");
var Route$1 = createFileRoute("/_authenticated/chat/$threadId")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./orbit.chat._userId-QCN9lu5T.mjs");
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
var IndexRoute = Route$44.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$45
});
var AuthenticatedRouteRoute = Route$43.update({
	id: "/_authenticated",
	getParentRoute: () => Route$45
});
var AccountRoute = Route$42.update({
	id: "/account",
	path: "/account",
	getParentRoute: () => Route$45
});
var AuthRoute = Route$41.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$45
});
var ChannelRoute = Route$40.update({
	id: "/channel",
	path: "/channel",
	getParentRoute: () => Route$45
});
var CopyrightPolicyRoute = Route$39.update({
	id: "/copyright-policy",
	path: "/copyright-policy",
	getParentRoute: () => Route$45
});
var CreateRoute = Route$38.update({
	id: "/create",
	path: "/create",
	getParentRoute: () => Route$45
});
var LicensesRoute = Route$37.update({
	id: "/licenses",
	path: "/licenses",
	getParentRoute: () => Route$45
});
var NotificationsRoute = Route$36.update({
	id: "/notifications",
	path: "/notifications",
	getParentRoute: () => Route$45
});
var OrbitRoute = Route$35.update({
	id: "/orbit",
	path: "/orbit",
	getParentRoute: () => Route$45
});
var PrivacyRoute = Route$34.update({
	id: "/privacy",
	path: "/privacy",
	getParentRoute: () => Route$45
});
var ProfileRoute = Route$33.update({
	id: "/profile",
	path: "/profile",
	getParentRoute: () => Route$45
});
var ReelsRoute = Route$32.update({
	id: "/reels",
	path: "/reels",
	getParentRoute: () => Route$45
});
var ResetPasswordRoute = Route$31.update({
	id: "/reset-password",
	path: "/reset-password",
	getParentRoute: () => Route$45
});
var SearchRoute = Route$30.update({
	id: "/search",
	path: "/search",
	getParentRoute: () => Route$45
});
var SettingsRoute = Route$29.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => Route$45
});
var SitemapDotxmlRoute = Route$28.update({
	id: "/sitemap.xml",
	path: "/sitemap.xml",
	getParentRoute: () => Route$45
});
var TermsRoute = Route$27.update({
	id: "/terms",
	path: "/terms",
	getParentRoute: () => Route$45
});
var WalletRoute = Route$26.update({
	id: "/wallet",
	path: "/wallet",
	getParentRoute: () => Route$45
});
var AdminCopyrightReportsRoute = Route$25.update({
	id: "/admin/copyright-reports",
	path: "/admin/copyright-reports",
	getParentRoute: () => Route$45
});
var ChannelIndexRoute = Route$24.update({
	id: "/",
	path: "/",
	getParentRoute: () => ChannelRoute
});
var ChannelAnalyticsRoute = Route$23.update({
	id: "/analytics",
	path: "/analytics",
	getParentRoute: () => ChannelRoute
});
var ChannelCreateRoute = Route$22.update({
	id: "/create",
	path: "/create",
	getParentRoute: () => ChannelRoute
});
var ChannelMonetizationRoute = Route$21.update({
	id: "/monetization",
	path: "/monetization",
	getParentRoute: () => ChannelRoute
});
var ChannelPostsRoute = Route$20.update({
	id: "/posts",
	path: "/posts",
	getParentRoute: () => ChannelRoute
});
var ChannelReelsRoute = Route$19.update({
	id: "/reels",
	path: "/reels",
	getParentRoute: () => ChannelRoute
});
var ChannelSubscribersRoute = Route$18.update({
	id: "/subscribers",
	path: "/subscribers",
	getParentRoute: () => ChannelRoute
});
var ChannelVideosRoute = Route$17.update({
	id: "/videos",
	path: "/videos",
	getParentRoute: () => ChannelRoute
});
var MomentIndexRoute = Route$16.update({
	id: "/moment/",
	path: "/moment/",
	getParentRoute: () => Route$45
});
var MomentMomentIdRoute = Route$15.update({
	id: "/moment/$momentId",
	path: "/moment/$momentId",
	getParentRoute: () => Route$45
});
var MomentCreateRoute = Route$14.update({
	id: "/moment/create",
	path: "/moment/create",
	getParentRoute: () => Route$45
});
var OrbitIndexRoute = Route$13.update({
	id: "/",
	path: "/",
	getParentRoute: () => OrbitRoute
});
var OrbitProfileIdRoute = Route$12.update({
	id: "/$profileId",
	path: "/$profileId",
	getParentRoute: () => OrbitRoute
});
var OrbitCreateRoute = Route$11.update({
	id: "/create",
	path: "/create",
	getParentRoute: () => OrbitRoute
});
var OrbitMeRoute = Route$10.update({
	id: "/me",
	path: "/me",
	getParentRoute: () => OrbitRoute
});
var OrbitMessagesRoute = Route$9.update({
	id: "/messages",
	path: "/messages",
	getParentRoute: () => OrbitRoute
});
var OrbitNotificationsRoute = Route$8.update({
	id: "/notifications",
	path: "/notifications",
	getParentRoute: () => OrbitRoute
});
var OrbitPrivacyRoute = Route$7.update({
	id: "/privacy",
	path: "/privacy",
	getParentRoute: () => OrbitRoute
});
var PostCreateRoute = Route$6.update({
	id: "/post/create",
	path: "/post/create",
	getParentRoute: () => Route$45
});
var UUserIdRoute = Route$5.update({
	id: "/u/$userId",
	path: "/u/$userId",
	getParentRoute: () => Route$45
});
var VideoVideoIdRoute = Route$4.update({
	id: "/video/$videoId",
	path: "/video/$videoId",
	getParentRoute: () => Route$45
});
var VideoUploadRoute = Route$3.update({
	id: "/video/upload",
	path: "/video/upload",
	getParentRoute: () => Route$45
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
	UUserIdRoute,
	VideoVideoIdRoute,
	VideoUploadRoute,
	MomentIndexRoute
};
var routeTree = Route$45._addFileChildren(rootRouteChildren)._addFileTypes();
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
export { useFollowCounts as $, missingColumn as A, cacheSet as B, resolveMediaUrl as C, useSocialPosts as D, usePostComments as E, uploadSourceWithProgress as F, ORBIT_KINDS as G, unregisterBlob as H, needsProtectionWarning as I, useNotifications as J, kindMeta as K, loadCachedThread as L, postKind as M, writeCompat as N, useThreadMessages as O, STORAGE_BUCKETS as P, setFollow as Q, saveCachedThread as R, rememberLocalMedia as S, timeAgo as T, isAuthSessionMissing as U, registerBlob as V, NOTIFICATION_KINDS as W, useYw as X, useDoubleTapLike as Y, isRealUserId as Z, useMoments as _, Route$5 as a, publishPost as b, useUploads as c, COUNTRIES as d, useFollowList as et, emptyChannel as f, aiFilterCss as g, useAuth as h, Route$4 as i, notifyOrbitPrefsChanged as it, normalizePostRow as j, useThreadPeer as k, useCall as l, useSearch as m, Route as n, uploadWithProgress as nt, Route$12 as o, useChannel as p, timeAgo$1 as q, Route$1 as r, ORBIT_KEY as rt, Route$38 as s, router_exports as t, cn as tt, CHANNEL_CATEGORIES as u, dmThreadId as v, resolveThreadPeer as w, publishReel as x, getLocalMedia as y, cacheGet as z };
