import { i as __toESM } from "../_runtime.mjs";
import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.mjs";
import { n as inr, t as computeBreakdown } from "./payout-math-C0joRY5F.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as supabase } from "./client-CjFhEasO.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as get, r as set, t as createStore } from "../_libs/idb-keyval.mjs";
import { a as useLocation, c as createRouter, d as createFileRoute, f as createRootRouteWithContext, g as useRouter, i as HeadContent, l as Outlet, m as useNavigate, o as useRouterState, p as Link, r as Scripts, u as lazyRouteComponent, v as redirect } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { n as useQueryClient, t as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { n as clsx } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { $ as Radio, $t as ExternalLink, An as Bell, At as Lock, B as Share2, Bt as House, C as Trash2, Cn as CheckCheck, Ct as MessageCircle, D as Star, Dn as Camera, Dt as MapPin, E as Sun, F as SlidersVertical, G as Search, Gt as Grid3x3, Ht as Heart, In as ArrowLeft, It as Info, Jt as Flag, K as Scissors, Kt as Gauge, Ln as Archive, Mt as LoaderCircle, N as Smile, Nn as BadgeCheck, Nt as Link2, Ot as Mail, Pn as AtSign, Q as Redo2, Qt as EyeOff, Rt as Image$1, Sn as Check, St as MessageSquare, T as SwitchCamera, Tt as Megaphone, U as Send, Ut as Hash, Wt as Handshake, Xt as FileText, Y as RotateCcw, Yt as Film, Z as RefreshCw, _ as UserPlus, _n as CircleAlert, a as X, an as Crop, at as PictureInPicture2, b as Type, bt as Mic, c as VolumeX, cn as Coins, ct as Pencil, d as VideoOff, dt as Orbit, et as Plus, gn as CircleCheck, h as UserX, hn as CircleQuestionMark, ht as Moon, i as ZapOff, in as DollarSign, j as Sparkles, jn as BellOff, k as SquareSplitHorizontal, kt as LogOut, l as Volume2, lt as Pause, m as User, mn as CircleX, mt as Music2, n as ZoomIn, nn as Earth, on as Copy, ot as Phone, p as Users, pt as Music, qt as FolderClock, r as Zap, rn as Download, s as Wallet, sn as Contrast, st as PhoneOff, t as ZoomOut, tn as EllipsisVertical, tt as Play, u as Video, un as Clock, ut as Palette, v as Upload, vn as ChevronUp, w as Timer, wn as ChartNoAxesColumn, xn as ChevronDown, xt as MicOff, y as Undo2, yn as ChevronRight, z as ShieldAlert } from "../_libs/lucide-react.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
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
//#region node_modules/.nitro/vite/services/ssr/assets/chat-db-DvIJS8RK.js
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
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/social-data-Dwb6TwDo.js
var SUPABASE_URL = {
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
	"VITE_SUPABASE_PROJECT_ID": "mvvliwuldgcmrqffrfgi",
	"VITE_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_FX67iB7JD8ZhYG5tJSct7w_V2niUGGf",
	"VITE_SUPABASE_URL": "https://mvvliwuldgcmrqffrfgi.supabase.co"
}["VITE_SUPABASE_URL"] ?? "";
var SUPABASE_KEY = {
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
	"VITE_SUPABASE_PROJECT_ID": "mvvliwuldgcmrqffrfgi",
	"VITE_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_FX67iB7JD8ZhYG5tJSct7w_V2niUGGf",
	"VITE_SUPABASE_URL": "https://mvvliwuldgcmrqffrfgi.supabase.co"
}["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? "";
/**
* Uploads a blob to a storage bucket with real byte-level progress (XHR based,
* because the Supabase JS client cannot report upload progress).
* Returns a long-lived signed URL, or the raw path as a fallback.
*/
async function uploadWithProgress(bucket, path, blob, contentType, onProgress) {
	const { data: sessionData } = await supabase.auth.getSession();
	const token = sessionData.session?.access_token;
	if (!token) return {
		url: null,
		error: "You need to sign in to upload."
	};
	const endpoint = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
	const err = await new Promise((resolve) => {
		try {
			const xhr = new XMLHttpRequest();
			xhr.open("POST", endpoint, true);
			xhr.setRequestHeader("authorization", `Bearer ${token}`);
			xhr.setRequestHeader("apikey", SUPABASE_KEY);
			xhr.setRequestHeader("x-upsert", "false");
			xhr.setRequestHeader("content-type", contentType);
			xhr.upload.onprogress = (e) => {
				if (e.lengthComputable) onProgress?.(Math.min(99, Math.round(e.loaded / e.total * 100)));
			};
			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) return resolve(null);
				let detail = "";
				try {
					const body = JSON.parse(xhr.responseText);
					detail = body.message || body.error || "";
				} catch {
					detail = (xhr.responseText || "").slice(0, 120);
				}
				resolve(`Upload failed (${xhr.status})${detail ? `: ${detail}` : ""}`);
			};
			xhr.onerror = () => resolve("Network error while uploading");
			xhr.onabort = () => resolve("Upload cancelled");
			xhr.send(blob);
		} catch (e) {
			resolve(e instanceof Error ? e.message : "Upload failed");
		}
	});
	if (err) return {
		url: null,
		error: err
	};
	const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(path, 31536e3);
	onProgress?.(100);
	return {
		url: signed?.signedUrl ?? path,
		error: null
	};
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
function timeAgo$1(iso) {
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
	const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 86400);
	const next = data?.signedUrl ?? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl ?? url;
	signedCache.set(url, next);
	return next;
}
/** Live list of posts of a given kind, with author, like and comment counts. */
function useSocialPosts(kind) {
	const [rows, setRows] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [me, setMe] = (0, import_react.useState)(null);
	const muteUntil = (0, import_react.useRef)(0);
	const load = (0, import_react.useCallback)(async () => {
		if (Date.now() < muteUntil.current) return;
		const { data: sessionData } = await supabase.auth.getSession();
		const uid = sessionData.session?.user.id ?? null;
		setMe(uid);
		const { data: posts, error } = await supabase.from("posts").select("*").eq("kind", kind).order("created_at", { ascending: false }).limit(50);
		if (error || !posts?.length) {
			setRows([]);
			setLoading(false);
			return;
		}
		const ids = posts.map((p) => p.id);
		const authorIds = [...new Set(posts.map((p) => p.user_id))];
		const [{ data: profiles }, { data: likes }, { data: comments }] = await Promise.all([
			supabase.rpc("get_public_profiles", { ids: authorIds }),
			supabase.from("post_likes").select("post_id,user_id").in("post_id", ids),
			supabase.from("post_comments").select("post_id").in("post_id", ids)
		]);
		const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
		const next = posts.map((p) => ({
			...p,
			author: toUser(profileById.get(p.user_id), p.user_id),
			likeCount: (likes ?? []).filter((l) => l.post_id === p.id).length,
			commentCount: (comments ?? []).filter((c) => c.post_id === p.id).length,
			likedByMe: !!uid && (likes ?? []).some((l) => l.post_id === p.id && l.user_id === uid)
		}));
		setRows(next);
		cacheSet(`feed:${kind}`, next.slice(0, 20));
		setLoading(false);
	}, [kind]);
	(0, import_react.useEffect)(() => {
		const cached = cacheGet(`feed:${kind}`, 6e5);
		if (cached?.length) {
			setRows(cached);
			setLoading(false);
		}
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
	const { data: sessionData } = await supabase.auth.getSession();
	const uid = sessionData.session?.user.id;
	if (!uid) return { error: "You need to sign in to post a reel." };
	let mediaUrl = opts.fileUrl;
	if (/^(blob:|data:)/.test(opts.fileUrl)) try {
		const blob = await (await fetch(opts.fileUrl)).blob();
		const ext = blob.type.includes("webm") ? "webm" : "mp4";
		const { url, error: upErr } = await uploadWithProgress("reels", `${uid}/${Date.now()}.${ext}`, blob, blob.type || "video/mp4", opts.onProgress);
		if (upErr || !url) return { error: upErr ?? "Upload failed" };
		mediaUrl = url;
	} catch (e) {
		return { error: e instanceof Error ? e.message : "Upload failed" };
	}
	else opts.onProgress?.(100);
	const { error } = await supabase.from("posts").insert({
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
	});
	if (!error) rememberLocalMedia(mediaUrl, opts.fileUrl);
	return { error: error?.message ?? null };
}
/** Uploads a photo/video and inserts it into the posts table (kind = "post"). */
async function publishPost(opts) {
	const { data: sessionData } = await supabase.auth.getSession();
	const uid = sessionData.session?.user.id;
	if (!uid) return { error: "You need to sign in to create a post." };
	let mediaUrl = opts.fileUrl;
	if (/^(blob:|data:)/.test(opts.fileUrl)) try {
		const blob = await (await fetch(opts.fileUrl)).blob();
		const type = blob.type || (opts.mediaType === "video" ? "video/mp4" : "image/jpeg");
		const ext = type.split("/")[1]?.split(";")[0] || (opts.mediaType === "video" ? "mp4" : "jpg");
		const { url, error: upErr } = await uploadWithProgress("reels", `${uid}/post-${Date.now()}.${ext}`, blob, type, opts.onProgress);
		if (upErr || !url) return { error: upErr ?? "Upload failed" };
		mediaUrl = url;
	} catch (e) {
		return { error: e instanceof Error ? e.message : "Upload failed" };
	}
	else opts.onProgress?.(100);
	const { error } = await supabase.from("posts").insert({
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
	});
	if (!error) rememberLocalMedia(mediaUrl, opts.fileUrl);
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
	}, [threadId, load]);
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
		if (url && /^https?:/.test(url)) for (const bucket of ["chat-files", "reels"]) {
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
		if (!postId || !me || !body.trim()) return;
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
		const { error } = await supabase.from("post_comments").insert({
			post_id: postId,
			user_id: me,
			body: text
		}).select("id,created_at").maybeSingle();
		if (error) setComments((prev) => prev.filter((c) => c.id !== tempId));
		else load();
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
			const { error } = await supabase.from("post_comments").delete().eq("id", id);
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
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-vYM24oNZ.js
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var styles_default = "/assets/styles-B5SVwh3n.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
	const message = error instanceof Response ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` : error instanceof Error ? error.message : String(error);
	window.__lovableReportRuntimeError?.({
		message,
		stack: error instanceof Error ? error.stack : void 0,
		filename: window.location.pathname
	});
}
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
					onClick: onOpenCreate,
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
function timeAgo(at) {
	const s = Math.max(1, Math.round((Date.now() - at) / 1e3));
	if (s < 60) return `${s}s`;
	const m = Math.round(s / 60);
	if (m < 60) return `${m}m`;
	const h = Math.round(m / 60);
	if (h < 24) return `${h}h`;
	return `${Math.round(h / 24)}d`;
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
async function uploadMomentMedia(uid, src, mediaType, prefix = "media") {
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
	const { url, error } = await uploadWithProgress("moments", path, blob, type);
	if (error && !url) throw new Error(error);
	return path;
}
/** Signs media and music paths so any allowed viewer can play the moment. */
async function signMomentMedia(list) {
	const paths = [...new Set(list.flatMap((m) => [m.media, m.musicUrl]).filter((path) => !!path && !/^(https?:|data:|blob:)/.test(path)))];
	if (!paths.length) return list;
	const { data } = await supabase.storage.from("moments").createSignedUrls(paths, 21600);
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
		const { data: auth } = await supabase.auth.getUser();
		const uid = auth.user?.id ?? null;
		uidRef.current = uid;
		if (!uid) {
			setMoments([]);
			setLoading(false);
			return;
		}
		const { data: rows } = await supabase.from("moments").select("*").order("created_at", { ascending: false }).limit(200);
		const list = rows ?? [];
		if (!list.length) {
			setMoments([]);
			setLoading(false);
			return;
		}
		const ids = list.map((r) => r.id);
		const authorIds = [...new Set(list.map((r) => r.user_id))];
		const [{ data: views }, { data: replies }, { data: profiles }] = await Promise.all([
			supabase.from("moment_views").select("*").in("moment_id", ids),
			supabase.from("moment_replies").select("*").in("moment_id", ids),
			supabase.rpc("get_public_profiles", { ids: authorIds })
		]);
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
			if (error) load();
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
			(async () => {
				const uid = uidRef.current ?? (await supabase.auth.getUser()).data.user?.id ?? null;
				if (!uid) {
					toast.error("Sign in to publish a moment");
					setMoments((p) => p.filter((x) => x.id !== tempId));
					return;
				}
				let media = "";
				let musicUrl = m.musicUrl;
				if (m.media) try {
					media = await uploadMomentMedia(uid, m.media, m.mediaType);
				} catch (e) {
					toast.error(e instanceof Error ? e.message : "Couldn't upload this moment's media");
					setMoments((p) => p.filter((x) => x.id !== tempId));
					return;
				}
				if (musicUrl?.startsWith("blob:") || musicUrl?.startsWith("data:")) {
					const localMusic = musicUrl;
					try {
						musicUrl = await uploadMomentMedia(uid, localMusic, "audio", "music");
					} catch (e) {
						toast.error(e instanceof Error ? e.message : "Couldn't upload the moment song");
						musicUrl = void 0;
					}
				}
				if (musicUrl && /^(blob:|data:)/.test(musicUrl)) musicUrl = void 0;
				if (m.kind !== "text" && !media) {
					toast.error("Couldn't upload this moment's media");
					setMoments((p) => p.filter((x) => x.id !== tempId));
					return;
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
				if (error) toast.error("Couldn't publish this moment");
				await load();
			})();
			return optimistic;
		},
		deleteMoment: (id) => {
			setMoments((p) => p.filter((m) => m.id !== id));
			(async () => {
				await supabase.from("moment_replies").delete().eq("moment_id", id);
				await supabase.from("moment_views").delete().eq("moment_id", id);
				const { error } = await supabase.from("moments").delete().eq("id", id);
				if (error) {
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
			supabase.from("moments").update({ archived: true }).eq("id", id);
		},
		restoreMoment: (id) => {
			patch(id, (m) => ({
				...m,
				archived: false
			}));
			supabase.from("moments").update({ archived: false }).eq("id", id);
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
			if (error) return { error: error.message };
			const target = moments.find((m) => m.id === id);
			const ownerId = target?.author?.id;
			if (ownerId && ownerId !== uid) {
				const threadId = dmThreadId(uid, ownerId);
				await supabase.from("direct_messages").insert({
					thread_id: threadId,
					sender_id: uid,
					content: body,
					media_url: target?.media ?? null,
					media_type: "text"
				});
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
			if (target.mine) supabase.from("moments").update({ poll }).eq("id", id);
		},
		registerScreenshot: (id) => {
			const uid = uidRef.current;
			if (!uid) return;
			supabase.from("moment_views").upsert({
				moment_id: id,
				viewer_id: uid,
				screenshot: true
			}, { onConflict: "moment_id,viewer_id" });
		},
		registerView: (id, liked) => {
			const uid = uidRef.current;
			if (!uid || id.startsWith("pending-")) return;
			supabase.from("moment_views").upsert({
				moment_id: id,
				viewer_id: uid,
				...liked === void 0 ? {} : { liked }
			}, { onConflict: "moment_id,viewer_id" });
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
	useNavigate();
	isPublicRoute(useRouterState({ select: (s) => s.location.pathname }));
	(0, import_react.useEffect)(() => {
		if (loading) return;
	}, [loading]);
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
	}, [call?.callId, phase]);
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
		attachStreams,
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
	const openSignalChannel = (0, import_react.useCallback)((callId, mode, isCaller) => new Promise(async (resolve) => {
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
		if (!isGuest) supabase.from("calls").insert({
			call_id: callId,
			caller_id: me,
			callee_id: target,
			caller_name: myName,
			mode,
			thread_id: threadId ?? null,
			status: "ringing"
		});
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
		supabase.from("calls").update({ status: "accepted" }).eq("call_id", call.callId);
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
	post: "Uploading post"
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
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
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
var $$splitComponentImporter$35 = () => import("./routes-C3_G1UlH.mjs");
var Route$44 = createFileRoute("/")({
	component: lazyRouteComponent($$splitComponentImporter$35, "component"),
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
var $$splitComponentImporter$34 = () => import("./route-Di7iQBCH.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$34, "component")
});
var $$splitComponentImporter$33 = () => import("./account-bzZyBIJx.mjs");
var Route$42 = createFileRoute("/account")({
	head: () => ({ meta: [{ title: "Account — YourWorld" }] }),
	component: lazyRouteComponent($$splitComponentImporter$33, "component")
});
var $$splitComponentImporter$32 = () => import("./auth-ChSgt4Hf.mjs");
var Route$41 = createFileRoute("/auth")({ component: lazyRouteComponent($$splitComponentImporter$32, "component") });
var Route$40 = createFileRoute("/channel")({ component: ChannelLayout });
function ChannelLayout() {
	const navigate = useNavigate();
	const location = useLocation();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-[#09090b] text-white font-sans pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-0 z-40 bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center justify-between",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => navigate({ to: "/settings" }),
						className: "p-1 text-zinc-300 hover:text-white",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 22 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-bold text-base",
						children: "Channel Studio"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-6" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2 overflow-x-auto p-3 border-b border-zinc-800/80 no-scrollbar bg-[#09090b]",
				children: [
					{
						label: "Create",
						path: "/channel/create",
						icon: Megaphone
					},
					{
						label: "Posts",
						path: "/channel/posts",
						icon: FileText
					},
					{
						label: "Videos",
						path: "/channel/videos",
						icon: Video
					},
					{
						label: "Reels",
						path: "/channel/reels",
						icon: Film
					},
					{
						label: "Subscribers",
						path: "/channel/subscribers",
						icon: Users
					},
					{
						label: "Analytics",
						path: "/channel/analytics",
						icon: ChartNoAxesColumn
					},
					{
						label: "Monetization",
						path: "/channel/monetization",
						icon: DollarSign
					}
				].map((tab) => {
					const Icon = tab.icon;
					const isActive = location.pathname === tab.path;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => navigate({ to: tab.path }),
						className: `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${isActive ? "bg-white text-black" : "bg-zinc-900 text-zinc-400 hover:text-white"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 14 }), tab.label]
					}, tab.path);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
			})
		]
	});
}
var $$splitComponentImporter$31 = () => import("./copyright-policy-CU2VgRpK.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$31, "component")
});
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
		const mimeType = [
			"video/mp4;codecs=h264,aac",
			"video/mp4;codecs=avc1.640029",
			"video/mp4",
			"video/webm;codecs=h264,opus",
			"video/webm;codecs=vp9,opus",
			"video/webm;codecs=vp8,opus",
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
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image$1, { size: 20 })
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
	const Ctx = window.AudioContext || window.webkitAudioContext;
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
function AudioTrackLane({ track, totalDuration, onChange, onPick, onRemove, width }) {
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
var CELL = 112;
var fmt = (s) => {
	const t = Math.max(0, Math.floor(s || 0));
	return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};
var clipLen = (c) => {
	const dur = c.duration || 0;
	const start = c.trimStart ?? 0;
	const end = c.trimEnd ?? dur;
	return Math.max(.1, end - start);
};
var thumbCache = /* @__PURE__ */ new Map();
function grabFrame(url, time) {
	const key = `${url}@${time.toFixed(2)}`;
	const hit = thumbCache.get(key);
	if (hit) return Promise.resolve(hit);
	return new Promise((resolve, reject) => {
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
		const onSeeked = () => {
			try {
				const canvas = document.createElement("canvas");
				const w = 160;
				const ratio = v.videoHeight ? v.videoHeight / v.videoWidth : 16 / 9;
				canvas.width = w;
				canvas.height = Math.max(1, Math.round(w * ratio));
				const ctx = canvas.getContext("2d");
				if (!ctx) throw new Error("no ctx");
				ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
				const data = canvas.toDataURL("image/jpeg", .6);
				thumbCache.set(key, data);
				cleanup();
				resolve(data);
			} catch (e) {
				cleanup();
				reject(e);
			}
		};
		v.addEventListener("loadeddata", () => {
			const t = Math.min(Math.max(.05, time), Math.max(.05, (v.duration || 1) - .05));
			v.addEventListener("seeked", onSeeked, { once: true });
			try {
				v.currentTime = t;
			} catch {
				onSeeked();
			}
		}, { once: true });
		v.addEventListener("error", () => {
			cleanup();
			reject(/* @__PURE__ */ new Error("thumb load failed"));
		}, { once: true });
	});
}
function useThumbnails(clips) {
	const [thumbs, setThumbs] = (0, import_react.useState)({});
	const sig = clips.map((c) => `${c.id}:${c.url ?? ""}:${(c.trimStart ?? 0).toFixed(2)}`).join("|");
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
function LightTimelineBase({ clips, activeIndex, currentTime, totalDuration, playFraction, isPlaying, audioLabel, onAddAudio, isMuted, onToggleMute, onSelect, onAdd, onTrim, onScrub, onReorder, audioTrack, onAudioChange, onAudioRemove }) {
	const scrollRef = (0, import_react.useRef)(null);
	const userScrollRef = (0, import_react.useRef)(false);
	const userTimer = (0, import_react.useRef)(null);
	const padRef = (0, import_react.useRef)(0);
	const [dragIndex, setDragIndex] = (0, import_react.useState)(null);
	const [dragOffset, setDragOffset] = (0, import_react.useState)(0);
	const dragRef = (0, import_react.useRef)(null);
	const pressTimer = (0, import_react.useRef)(null);
	const lens = (0, import_react.useMemo)(() => clips.map(clipLen), [clips]);
	const thumbs = useThumbnails(clips);
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
	const autoRaf = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const el = scrollRef.current;
		if (!el || userScrollRef.current) return;
		const frac = playFraction ?? 0;
		const target = activeIndex * CELL + frac * CELL;
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
		lens
	]);
	const scrubRaf = (0, import_react.useRef)(null);
	const handleScroll = (0, import_react.useCallback)(() => {
		const el = scrollRef.current;
		if (!el || !userScrollRef.current || !onScrub) return;
		if (scrubRaf.current) return;
		scrubRaf.current = requestAnimationFrame(() => {
			scrubRaf.current = null;
			const x = Math.max(0, el.scrollLeft);
			const idx = Math.min(clips.length - 1, Math.floor(x / CELL));
			onScrub(idx, Math.min(1, Math.max(0, (x - idx * CELL) / CELL)));
		});
	}, [clips.length, onScrub]);
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
				const shift = Math.round(dragOffsetRef.current / CELL);
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onAdd,
						className: "grid h-7 w-7 place-items-center rounded-full bg-muted/70 text-muted-foreground transition-transform duration-150 active:scale-90",
						"aria-label": "Add clip",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-3.5 h-3.5" })
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
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center h-16",
						style: { willChange: "transform" },
						children: clips.map((clip, i) => {
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
									width: CELL,
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
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudioTrackLane, {
						track: audioTrack ?? null,
						totalDuration,
						width: Math.max(CELL, clips.length * CELL),
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
function pickMime() {
	return [
		"video/webm;codecs=vp9,opus",
		"video/webm;codecs=vp8,opus",
		"video/webm",
		"video/mp4"
	].find((m) => MediaRecorder.isTypeSupported?.(m));
}
function canMuxReel() {
	return typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && !!(window.AudioContext || window.webkitAudioContext) && typeof HTMLCanvasElement.prototype.captureStream === "function";
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
	video.preload = "auto";
	const audio = new Audio();
	audio.src = music.url;
	audio.crossOrigin = "anonymous";
	audio.preload = "auto";
	const actx = new (window.AudioContext || window.webkitAudioContext)();
	let recorder = null;
	const cleanup = () => {
		try {
			recorder?.state !== "inactive" && recorder?.stop();
		} catch {}
		try {
			video.pause();
		} catch {}
		try {
			audio.pause();
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
		await new Promise((resolve) => {
			if (audio.readyState >= 1) return resolve();
			audio.addEventListener("loadedmetadata", () => resolve(), { once: true });
			audio.addEventListener("error", () => resolve(), { once: true });
			audio.load();
		});
		const start = Math.max(0, opts.trimStart ?? 0);
		const requestedEnd = opts.trimEnd;
		const end = Math.min(video.duration || 0, requestedEnd != null && requestedEnd > start ? requestedEnd : video.duration || 0);
		const span = Math.max(.2, end - start);
		const canvas = document.createElement("canvas");
		canvas.width = video.videoWidth || 720;
		canvas.height = video.videoHeight || 1280;
		const g = canvas.getContext("2d");
		if (!g) throw new Error("no canvas ctx");
		const dest = actx.createMediaStreamDestination();
		try {
			const vSrc = actx.createMediaElementSource(video);
			const vGain = actx.createGain();
			vGain.gain.value = .85;
			vSrc.connect(vGain).connect(dest);
		} catch {}
		const aSrc = actx.createMediaElementSource(audio);
		const aGain = actx.createGain();
		aGain.gain.value = music.volume ?? 1;
		aSrc.connect(aGain).connect(dest);
		const stream = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...dest.stream.getAudioTracks()]);
		const mime = pickMime();
		recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : void 0);
		const chunks = [];
		recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
		const done = new Promise((resolve) => {
			recorder.onstop = () => resolve(new Blob(chunks, { type: mime || "video/webm" }));
		});
		video.currentTime = start;
		await new Promise((r) => video.addEventListener("seeked", () => r(), { once: true }));
		await actx.resume().catch(() => {});
		recorder.start(200);
		await video.play();
		const musicSpan = Math.max(.2, music.clipEnd - music.clipStart);
		let musicOn = false;
		let raf = 0;
		const draw = () => {
			g.drawImage(video, 0, 0, canvas.width, canvas.height);
			const rel = video.currentTime - start - Math.max(0, music.start - start);
			if (rel >= 0 && rel <= musicSpan) {
				const t = music.clipStart + rel;
				if (!musicOn) {
					musicOn = true;
					try {
						audio.currentTime = t;
					} catch {}
					audio.play().catch(() => {});
				} else if (Math.abs(audio.currentTime - t) > .35) try {
					audio.currentTime = t;
				} catch {}
			} else if (musicOn) {
				musicOn = false;
				audio.pause();
			}
			opts.onProgress?.(Math.min(99, (video.currentTime - start) / span * 100));
			raf = requestAnimationFrame(draw);
		};
		raf = requestAnimationFrame(draw);
		await new Promise((resolve) => {
			const stop = () => {
				video.removeEventListener("ended", stop);
				resolve();
			};
			video.addEventListener("ended", stop);
			const tick = window.setInterval(() => {
				if (video.currentTime >= end - .05) {
					window.clearInterval(tick);
					stop();
				}
			}, 100);
		});
		cancelAnimationFrame(raf);
		video.pause();
		audio.pause();
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
	component: CreateStudioPage
});
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
		id: "PIP",
		label: "PIP",
		Icon: PictureInPicture2
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
function CreateStudioPage() {
	const navigate = useNavigate();
	const { mode } = Route$38.useSearch();
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
	const startExport = () => {
		setExportStage("saving");
		setExportProgress(0);
		const step = () => {
			setExportProgress((p) => {
				if (p >= 100) return 100;
				const next = Math.min(100, p + Math.random() * 9 + 3);
				if (next >= 100) {
					window.setTimeout(() => setExportStage("done"), 300);
					return 100;
				}
				window.setTimeout(step, 120);
				return next;
			});
		};
		window.setTimeout(step, 150);
	};
	const saveToGallery = () => {
		const url = clips[activeClipIndex]?.url || clips[0]?.url;
		if (!url) return;
		const a = document.createElement("a");
		a.href = url;
		a.download = `yourworld-${exportRes}-${Date.now()}.mp4`;
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
			toast.error("Reel is too short — it must be at least 5 seconds.");
			return;
		}
		if (totalDuration > 80) {
			toast.error("Reel is too long — trim it to 80 seconds or less.");
			return;
		}
		setPosting(true);
		const caption = meta.caption || clip?.textOverlay || "";
		let uploadUrl = url;
		if (audioTrack && canMuxReel()) {
			const t = toast.loading("Adding music to your reel…");
			const trimEnd = clip?.trimEnd ?? clip?.duration;
			const baked = await renderReelWithMusic({
				videoUrl: url,
				trimStart: clip?.trimStart ?? 0,
				trimEnd: trimEnd && trimEnd > 0 ? trimEnd : void 0,
				music: {
					url: audioTrack.url,
					start: audioTrack.start,
					clipStart: audioTrack.clipStart,
					clipEnd: audioTrack.clipEnd
				}
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
		startUpload({
			kind: "reel",
			label: caption || "New reel",
			thumbnail: null,
			viewTo: "/reels"
		}, (onProgress) => publishReel({
			fileUrl: uploadUrl,
			caption,
			hashtags: meta.hashtags,
			location: meta.location,
			link: meta.link,
			audience: meta.audience,
			taggedUserIds: meta.taggedUserIds,
			viewerUserIds: meta.viewerUserIds,
			audio: audioTrack?.title ?? null,
			onProgress
		})).then(({ error }) => {
			if (error) toast.error(error);
			else toast.success("Reel posted");
		});
		setPosting(false);
		setShowPublish(false);
		setShowExport(false);
		navigate({ to: "/reels" });
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
		setClips(snap.clips);
		setAudioTrack(snap.audioTrack);
		setActiveClipIndex((i) => Math.min(i, Math.max(0, snap.clips.length - 1)));
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
	const totalDuration = clips.reduce((acc, c) => {
		const d = c.duration || 0;
		const start = c.trimStart ?? 0;
		const end = c.trimEnd ?? d;
		return acc + Math.max(0, end - start);
	}, 0);
	const fileInputRef = (0, import_react.useRef)(null);
	const audioInputRef = (0, import_react.useRef)(null);
	const videoRef = (0, import_react.useRef)(null);
	const audioElRef = (0, import_react.useRef)(null);
	const stageRef = (0, import_react.useRef)(null);
	const scrubbingRef = (0, import_react.useRef)(false);
	const loadedUrlRef = (0, import_react.useRef)(null);
	const scrubTimerRef = (0, import_react.useRef)(null);
	const dragRafRef = (0, import_react.useRef)(null);
	const seekRafRef = (0, import_react.useRef)(null);
	const pendingSeekRef = (0, import_react.useRef)(null);
	const globalTimeRef = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		return () => {
			if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);
			if (seekRafRef.current) cancelAnimationFrame(seekRafRef.current);
			if (scrubTimerRef.current) clearTimeout(scrubTimerRef.current);
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
		const remaining = 10 - clips.length;
		if (remaining <= 0) {
			toast.error("Maximum 10 clips limit reached!");
			return;
		}
		const newClips = files.slice(0, remaining).map((f, i) => ({
			id: `c_${Date.now()}_${i}`,
			url: URL.createObjectURL(f),
			speed: 1,
			rotation: 0,
			filter: "none",
			textOverlay: "",
			volume: 1,
			trimStart: 0,
			crop: 1,
			textX: 50,
			textY: 50
		}));
		setClips((prev) => [...prev, ...newClips]);
		setActiveClipIndex(clips.length);
	};
	const handleMediaSelect = (e) => {
		const files = e.target.files;
		if (!files) return;
		addFiles(Array.from(files));
		e.target.value = "";
	};
	const currentClip = clips[activeClipIndex];
	const updateCurrentClip = (key, val) => {
		setClips((prev) => prev.map((c, i) => i === activeClipIndex ? {
			...c,
			[key]: val
		} : c));
	};
	const clamp = (n, a = 0, b = 100) => Math.min(b, Math.max(a, n));
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
	const startTextDrag = (e) => {
		e.preventDefault();
		e.stopPropagation();
		const el = e.currentTarget;
		el.setPointerCapture?.(e.pointerId);
		const move = (ev) => {
			const p = stagePct(ev);
			el.style.left = `${p.x}%`;
			el.style.top = `${p.y}%`;
			scheduleFrame(() => setClips((prev) => prev.map((c, i) => i === activeClipIndex ? {
				...c,
				textX: p.x,
				textY: p.y
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
			let next = { ...box };
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
		const global = before + frac * span;
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
	}, [currentClip, activeClipIndex]);
	(0, import_react.useEffect)(() => {
		const v = videoRef.current;
		const url = currentClip?.url;
		if (!v || !url) return;
		const start = currentClip?.trimStart ?? 0;
		const end = currentClip?.trimEnd;
		const ready = () => {
			if (scrubbingRef.current) return;
			if (v.currentTime < start - .05 || end != null && v.currentTime > end + .05) try {
				v.currentTime = start;
			} catch {}
			if (isPlaying) v.play().catch(() => {});
		};
		if (loadedUrlRef.current !== url) {
			loadedUrlRef.current = url;
			v.src = url;
			v.load();
			v.addEventListener("loadeddata", ready, { once: true });
			return () => v.removeEventListener("loadeddata", ready);
		}
		if (v.readyState >= 2) {
			ready();
			return;
		}
		v.addEventListener("loadeddata", ready, { once: true });
		return () => v.removeEventListener("loadeddata", ready);
	}, [
		currentClip?.url,
		currentClip?.trimStart,
		currentClip?.trimEnd,
		activeClipIndex,
		isPlaying
	]);
	const advancingRef = (0, import_react.useRef)(0);
	const advanceClip = import_react.useCallback(() => {
		const v = videoRef.current;
		if (!clips.length) return;
		const now = Date.now();
		if (now - advancingRef.current < 400) return;
		advancingRef.current = now;
		const next = (activeClipIndex + 1) % clips.length;
		const nextClip = clips[next];
		setIsPlaying(true);
		if (v && nextClip && nextClip.url === currentClip?.url) {
			try {
				v.currentTime = nextClip.trimStart ?? 0;
			} catch {}
			v.play().catch(() => {});
		}
		setActiveClipIndex(next);
	}, [
		clips,
		activeClipIndex,
		currentClip?.url
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
		if (v.readyState >= 1 && loadedUrlRef.current === currentClip.url) seek();
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
		currentClip?.trimStart,
		currentClip?.trimEnd,
		currentClip?.url,
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
			const t = audioTrack.clipStart + rel;
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
		audioTrack?.url,
		audioTrack?.start,
		audioTrack?.clipStart,
		audioTrack?.clipEnd,
		activeClipIndex
	]);
	const handleSplit = () => {
		const v = videoRef.current;
		if (!currentClip || clips.length >= 10) {
			toast.error("Maximum 10 clips limit reached!");
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
		if (!currentClip || clips.length >= 10) {
			toast.error("Maximum 10 clips limit reached!");
			return;
		}
		const copy = {
			...currentClip,
			id: `c_${Date.now()}`
		};
		const updated = [...clips];
		updated.splice(activeClipIndex + 1, 0, copy);
		setClips(updated);
		setActiveClipIndex(activeClipIndex + 1);
	};
	const handleDelete = () => {
		if (clips.length === 0) return;
		const updated = clips.filter((_, i) => i !== activeClipIndex);
		setClips(updated);
		setActiveClipIndex(Math.max(0, activeClipIndex - 1));
	};
	const togglePlay = () => {
		if (!videoRef.current) return;
		if (isPlaying) videoRef.current.pause();
		else videoRef.current.play();
		setIsPlaying(!isPlaying);
	};
	const handleToolMenu = (id) => {
		if (id === "MUSIC") return setShowMusicPicker(true);
		if (id === "EFFECT") return updateCurrentClip("filter", currentClip?.filter === "vivid" ? "none" : "vivid");
		if (id === "PIP") {
			const v = videoRef.current;
			if (document.pictureInPictureElement) document.exitPictureInPicture();
			else if (v?.requestPictureInPicture) v.requestPictureInPicture().catch(() => toast.error("Picture-in-picture unavailable"));
			else toast.error("Picture-in-picture unavailable");
			return;
		}
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
										className: "grid grid-cols-4 gap-2 mb-5",
										children: [
											"8K",
											"4K",
											"2K",
											"HD"
										].map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
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
													toast.error("Reel is too short — it must be at least 5 seconds.");
													return;
												}
												if (totalDuration > 80) {
													toast.error("Reel is too long — trim it to 80 seconds or less.");
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
							className: "relative h-full w-full flex items-center justify-center touch-none",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
									ref: videoRef,
									autoPlay: true,
									playsInline: true,
									muted: isMuted,
									onTimeUpdate: syncTime,
									onSeeked: syncTime,
									onLoadedMetadata: (e) => {
										const d = e.currentTarget.duration;
										if (isFinite(d) && d > 0 && !currentClip?.duration) updateCurrentClip("duration", d);
									},
									onEmptied: () => {
										loadedUrlRef.current = null;
									},
									className: "h-full w-full object-cover will-change-transform",
									style: {
										transform: `translateZ(0) rotate(${currentClip?.rotation || 0}deg) scale(${currentClip?.crop ?? 1})`,
										clipPath: currentClip?.cropBox ? `inset(${currentClip.cropBox.y}% ${100 - (currentClip.cropBox.x + currentClip.cropBox.w)}% ${100 - (currentClip.cropBox.y + currentClip.cropBox.h)}% ${currentClip.cropBox.x}%)` : void 0,
										filter: currentClip?.filter === "vivid" ? "saturate(2) contrast(1.1)" : currentClip?.filter === "noir" ? "grayscale(1) contrast(1.2)" : currentClip?.filter === "cyber" ? "hue-rotate(90deg) contrast(1.2)" : currentClip?.filter === "warm" ? "sepia(0.5) saturate(1.4)" : "none"
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
								currentClip?.textOverlay && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									onPointerDown: startTextDrag,
									className: "absolute -translate-x-1/2 -translate-y-1/2 bg-white/85 text-foreground font-black px-4 py-2 rounded-xl text-lg border border-orange-400 shadow-lg backdrop-blur-sm cursor-move touch-none select-none",
									style: {
										left: `${currentClip.textX ?? 50}%`,
										top: `${currentClip.textY ?? 50}%`
									},
									children: currentClip.textOverlay
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
							activeToolPanel === "FILTER" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
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
							}),
							activeToolPanel === "SPEED" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex gap-2 justify-around py-1",
								children: [
									.25,
									.5,
									1,
									2,
									4
								].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => updateCurrentClip("speed", s),
									className: `px-4 py-1.5 rounded-xl font-bold text-xs border transition ${currentClip?.speed === s ? "bg-orange-500 text-white border-orange-500" : "bg-muted text-foreground border-border"}`,
									children: [s, "x"]
								}, s))
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
								const v = videoRef.current;
								const clip = clips[i];
								setActiveClipIndex(i);
								if (!v || !clip) return;
								scrubbingRef.current = false;
								if (scrubTimerRef.current) clearTimeout(scrubTimerRef.current);
								const start = clip.trimStart ?? 0;
								const applySeek = () => {
									try {
										v.currentTime = start;
									} catch {}
									v.pause();
									setIsPlaying(false);
								};
								if (clip.url && loadedUrlRef.current !== clip.url) {
									loadedUrlRef.current = clip.url;
									v.src = clip.url;
									v.load();
									v.addEventListener("loadeddata", applySeek, { once: true });
								} else if (v.readyState >= 1) applySeek();
								else v.addEventListener("loadeddata", applySeek, { once: true });
							},
							onTrim: (i, start, end) => {
								setClips((prev) => prev.map((c, idx) => idx === i ? {
									...c,
									trimStart: start,
									trimEnd: end
								} : c));
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
								const target = Math.min(end, Math.max(start, start + frac * (end - start)));
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
	component: LicensesPage
});
var LICENSES = [
	{
		name: "React",
		license: "MIT License",
		notice: "Copyright (c) Meta Platforms, Inc. and affiliates."
	},
	{
		name: "TanStack Router / TanStack Start",
		license: "MIT License",
		notice: "Copyright (c) Tanner Linsley."
	},
	{
		name: "Supabase JavaScript Client",
		license: "MIT License",
		notice: "Copyright (c) Supabase, Inc."
	},
	{
		name: "Tailwind CSS",
		license: "MIT License",
		notice: "Copyright (c) Adam Wathan and Tailwind Labs LLC."
	},
	{
		name: "Lucide React Icons",
		license: "ISC License",
		notice: "Copyright (c) Lucide Contributors."
	},
	{
		name: "shadcn/ui Components",
		license: "MIT License",
		notice: "Copyright (c) shadcn."
	},
	{
		name: "Sonner (toasts)",
		license: "MIT License",
		notice: "Copyright (c) Emil Kowalski."
	},
	{
		name: "Zod",
		license: "MIT License",
		notice: "Copyright (c) Colin McDonnell."
	}
];
var MIT_TEXT = `Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;
function LicensesPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-[#09090b] text-white font-sans p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-2xl mx-auto",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold mt-2 mb-1",
					children: "Open Source Licenses"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-zinc-400 mb-6",
					children: "YourWorld is built with the following open source software. We are grateful to their authors and communities."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3",
					children: LICENSES.map((lib) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-zinc-800 bg-[#141418] p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-sm",
								children: lib.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] font-medium text-indigo-400",
								children: lib.license
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-zinc-500 mt-1",
							children: lib.notice
						})]
					}, lib.name))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-zinc-800 bg-[#141418] p-4 mt-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold mb-2",
						children: "MIT License (Full Text)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-400 font-mono",
						children: MIT_TEXT
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] text-zinc-600 mt-6 text-center",
					children: "YourWorld © 2026. All rights reserved."
				})
			]
		})
	});
}
var $$splitComponentImporter$30 = () => import("./notifications-ciJpa6Xr.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$30, "component")
});
var $$splitComponentImporter$29 = () => import("./orbit-CGLlVi1d.mjs");
var Route$35 = createFileRoute("/orbit")({ component: lazyRouteComponent($$splitComponentImporter$29, "component") });
var $$splitComponentImporter$28 = () => import("./privacy-CoY-PyCl.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$28, "component")
});
var $$splitComponentImporter$27 = () => import("./profile-CduJBzw6.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$27, "component")
});
var $$splitComponentImporter$26 = () => import("./reels-z_W3aoh1.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$26, "component")
});
/**
* Renders reel media with graceful recovery: if the stored URL fails to load
* (expired signed URL, missing public URL) we retry with a freshly resolved
* Supabase URL, then with a local blob URL from this session, then fall back
* to an image.
*/
var $$splitComponentImporter$25 = () => import("./reset-password-CDF-1oAz.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$25, "component")
});
var $$splitComponentImporter$24 = () => import("./search-BxWRs11z.mjs");
var Route$30 = createFileRoute("/search")({
	head: () => ({ meta: [{ title: "Search · YourWorld" }] }),
	component: lazyRouteComponent($$splitComponentImporter$24, "component")
});
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
	component: SettingsPage
});
function SettingsPage() {
	const navigate = useNavigate();
	const { signOut, user } = useAuth();
	const queryClient = useQueryClient();
	const [panel, setPanel] = (0, import_react.useState)(null);
	const [reportStep, setReportStep] = (0, import_react.useState)(null);
	const [dmca, setDmca] = (0, import_react.useState)({
		contentLink: "",
		originalWork: "",
		description: "",
		email: "",
		fullName: ""
	});
	const [dmcaAgree, setDmcaAgree] = (0, import_react.useState)(false);
	const [submittingDmca, setSubmittingDmca] = (0, import_react.useState)(false);
	const submitDmca = async () => {
		const contentLink = dmca.contentLink.trim();
		const originalWork = dmca.originalWork.trim();
		const description = dmca.description.trim();
		const email = dmca.email.trim();
		const fullName = dmca.fullName.trim();
		if (!contentLink || !originalWork || !description || !email || !fullName) {
			toast.error("Please fill in all required fields");
			return;
		}
		let validProof = false;
		try {
			const u = new URL(originalWork);
			validProof = u.protocol === "http:" || u.protocol === "https:";
		} catch {
			validProof = false;
		}
		if (!validProof) {
			toast.error("Please enter a valid proof URL (must start with http:// or https://)");
			return;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			toast.error("Please enter a valid contact email");
			return;
		}
		if (!dmcaAgree) {
			toast.error("You must accept the legal declaration to submit");
			return;
		}
		if (!user) {
			toast.error("Please sign in to submit a report");
			return;
		}
		setSubmittingDmca(true);
		const { error } = await supabase.from("copyright_reports").insert({
			reporter_user_id: user.id,
			reporter_full_name: fullName.slice(0, 200),
			infringing_content_link: contentLink.slice(0, 2e3),
			original_work_link: originalWork.slice(0, 2e3),
			reason: description.slice(0, 2e3),
			contact_email: email.slice(0, 255)
		});
		setSubmittingDmca(false);
		if (error) {
			toast.error("Could not submit report. Please try again.");
			return;
		}
		toast.success("DMCA report submitted successfully");
		setDmca({
			contentLink: "",
			originalWork: "",
			description: "",
			email: "",
			fullName: ""
		});
		setDmcaAgree(false);
		setReportStep(null);
		setPanel(null);
	};
	const [toggles, setToggles] = (0, import_react.useState)({
		privateAccount: false,
		allowDownloads: true,
		activityStatus: true,
		likes: true,
		comments: true,
		followers: true,
		messages: true,
		channel: true,
		system: true,
		reduceMotion: false,
		compact: false
	});
	const flip = (k) => setToggles((t) => ({
		...t,
		[k]: !t[k]
	}));
	const handleLogout = async () => {
		await queryClient.cancelQueries();
		queryClient.clear();
		await signOut();
		navigate({
			to: "/auth",
			search: { redirect: void 0 },
			replace: true
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-[#09090b] text-white p-4 font-sans select-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 mb-6 mt-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => navigate({ to: "/profile" }),
					className: "p-1 text-zinc-300 hover:text-white",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 22 })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-bold",
					children: "Settings"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-[#141418] rounded-2xl p-2 border border-zinc-800 space-y-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "button",
						tabIndex: 0,
						onClick: () => navigate({ to: "/account" }),
						className: "flex items-center justify-between p-3.5 hover:bg-zinc-800/50 rounded-xl cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, {
								className: "text-zinc-400",
								size: 20
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-sm",
								children: "Account"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "text-zinc-600",
							size: 18
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						onClick: () => navigate({ to: "/channel/create" }),
						className: "flex items-center justify-between p-3.5 hover:bg-zinc-800/50 rounded-xl cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, {
								className: "text-zinc-400",
								size: 20
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-semibold text-sm",
								children: "Create Channel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-zinc-500",
								children: "Videos, reels, posts & analytics"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "text-zinc-600",
							size: 18
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "button",
						tabIndex: 0,
						onClick: () => navigate({ to: "/wallet" }),
						className: "flex items-center justify-between p-3.5 hover:bg-zinc-800/50 rounded-xl cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, {
								className: "text-zinc-400",
								size: 20
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-semibold text-sm",
								children: "Monetization & Wallet"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-zinc-500",
								children: "Earnings, courses, payouts & tax invoices"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "text-zinc-600",
							size: 18
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						onClick: () => navigate({ to: "/orbit" }),
						className: "flex items-center justify-between p-3.5 hover:bg-zinc-800/50 rounded-xl cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Orbit, {
								className: "text-zinc-400",
								size: 20
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-semibold text-sm",
								children: "Orbit"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-zinc-500",
								children: "Private social discovery"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "text-zinc-600",
							size: 18
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "button",
						tabIndex: 0,
						onClick: () => setPanel("privacy"),
						className: "flex items-center justify-between p-3.5 hover:bg-zinc-800/50 rounded-xl cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
								className: "text-zinc-400",
								size: 20
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-semibold text-sm",
								children: "Privacy & Downloads"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-zinc-500",
								children: "Blocked accounts"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "text-zinc-600",
							size: 18
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "button",
						tabIndex: 0,
						onClick: () => setPanel("notifications"),
						className: "flex items-center justify-between p-3.5 hover:bg-zinc-800/50 rounded-xl cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, {
								className: "text-zinc-400",
								size: 20
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-semibold text-sm",
								children: "Notifications"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-zinc-500",
								children: "Likes, Orbit, channel & system alerts"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "text-zinc-600",
							size: 18
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "button",
						tabIndex: 0,
						onClick: () => setPanel("appearance"),
						className: "flex items-center justify-between p-3.5 hover:bg-zinc-800/50 rounded-xl cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Palette, {
								className: "text-zinc-400",
								size: 20
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-sm",
								children: "Appearance"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "text-zinc-600",
							size: 18
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "button",
						tabIndex: 0,
						onClick: () => setPanel("help"),
						className: "flex items-center justify-between p-3.5 hover:bg-zinc-800/50 rounded-xl cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleQuestionMark, {
								className: "text-zinc-400",
								size: 20
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-sm",
								children: "Help & Support"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "text-zinc-600",
							size: 18
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "button",
						tabIndex: 0,
						onClick: () => setPanel("about"),
						className: "flex items-center justify-between p-3.5 hover:bg-zinc-800/50 rounded-xl cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								className: "text-zinc-400",
								size: 20
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-sm",
								children: "About"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "text-zinc-600",
							size: 18
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: handleLogout,
						className: "border-t border-zinc-800/80 pt-2 p-3.5 flex w-full items-center gap-4 text-red-500 cursor-pointer hover:bg-red-950/20 rounded-xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { size: 20 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-sm",
							children: "Log Out"
						})]
					})
				]
			}),
			panel === "privacy" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Privacy & Downloads",
				onClose: () => setPanel(null),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Private account",
						hint: "Only approved followers can see your posts",
						on: toggles.privateAccount,
						onClick: () => flip("privateAccount")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Allow downloads",
						hint: "Let others save your reels with watermark",
						on: toggles.allowDownloads,
						onClick: () => flip("allowDownloads")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Show activity status",
						hint: "Display when you were last active",
						on: toggles.activityStatus,
						onClick: () => flip("activityStatus")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Blocked accounts",
						hint: "No blocked accounts"
					})
				]
			}),
			panel === "notifications" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Notifications",
				onClose: () => setPanel(null),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Likes",
						on: toggles.likes,
						onClick: () => flip("likes")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Comments",
						on: toggles.comments,
						onClick: () => flip("comments")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "New followers",
						on: toggles.followers,
						onClick: () => flip("followers")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Messages",
						on: toggles.messages,
						onClick: () => flip("messages")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Channel & monetization",
						on: toggles.channel,
						onClick: () => flip("channel")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "System alerts",
						on: toggles.system,
						onClick: () => flip("system")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Open activity feed",
						onClick: () => navigate({ to: "/notifications" })
					})
				]
			}),
			panel === "appearance" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Appearance",
				onClose: () => setPanel(null),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Theme",
						hint: "Premium Dark (default)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Reduce motion",
						hint: "Minimise animations and transitions",
						on: toggles.reduceMotion,
						onClick: () => flip("reduceMotion")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Compact layout",
						hint: "Tighter spacing in feed and lists",
						on: toggles.compact,
						onClick: () => flip("compact")
					})
				]
			}),
			panel === "help" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Help & Support",
				onClose: () => setPanel(null),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Help center",
						hint: "Guides and troubleshooting"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Report a problem",
						hint: "Tell us what went wrong",
						onClick: () => setReportStep("options")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { label: "Community guidelines" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Copyright & DMCA Policy",
						hint: "Takedown procedure & Safe Harbor",
						onClick: () => navigate({ to: "/copyright-policy" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Contact support",
						hint: "Yourworld2029@gmail.com",
						onClick: () => {
							window.location.href = "mailto:Yourworld2029@gmail.com";
						}
					})
				]
			}),
			reportStep === "options" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Report a problem",
				onClose: () => setReportStep(null),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Copyright Infringement (DMCA)",
						hint: "Report stolen content",
						onClick: () => setReportStep("dmca")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Technical Bug",
						hint: "App errors or crashes",
						onClick: () => {
							window.location.href = "mailto:Yourworld2029@gmail.com?subject=" + encodeURIComponent("Technical Bug Report");
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Community Violation",
						hint: "Harassment, spam or abuse",
						onClick: () => {
							window.location.href = "mailto:Yourworld2029@gmail.com?subject=" + encodeURIComponent("Community Violation Report");
						}
					})
				]
			}),
			reportStep === "dmca" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "DMCA Takedown Request",
				onClose: () => setReportStep(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3 p-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DmcaField, {
							label: "Content Link / ID *",
							value: dmca.contentLink,
							onChange: (v) => setDmca((d) => ({
								...d,
								contentLink: v
							})),
							placeholder: "Link or ID of the infringing content"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DmcaField, {
							label: "Original Work / Proof URL *",
							type: "url",
							value: dmca.originalWork,
							onChange: (v) => setDmca((d) => ({
								...d,
								originalWork: v
							})),
							placeholder: "https://link-to-your-original-work"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-semibold text-zinc-400 mb-1",
							children: "Description of ownership *"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: dmca.description,
							onChange: (e) => setDmca((d) => ({
								...d,
								description: e.target.value
							})),
							placeholder: "Explain that you own the original work",
							maxLength: 2e3,
							rows: 4,
							className: "w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-white outline-none focus:border-indigo-500"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DmcaField, {
							label: "Your Full Legal Name *",
							value: dmca.fullName,
							onChange: (v) => setDmca((d) => ({
								...d,
								fullName: v
							})),
							placeholder: "Full name of rights owner or agent"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DmcaField, {
							label: "Contact Email *",
							type: "email",
							value: dmca.email,
							onChange: (v) => setDmca((d) => ({
								...d,
								email: v
							})),
							placeholder: "you@example.com"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: dmcaAgree,
								onChange: (e) => setDmcaAgree(e.target.checked),
								className: "mt-0.5 h-4 w-4 shrink-0 accent-indigo-500"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] leading-relaxed text-zinc-300",
								children: "I confirm under penalty of perjury/account termination that I am the rightful owner or authorized agent of this copyrighted content."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: submitDmca,
							disabled: submittingDmca || !dmcaAgree,
							className: "w-full rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50",
							children: submittingDmca ? "Submitting…" : "Submit DMCA Report"
						})
					]
				})
			}),
			panel === "about" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "About",
				onClose: () => setPanel(null),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "YourWorld",
						hint: "Version 1.0.0"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Terms of Service",
						onClick: () => navigate({ to: "/terms" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Privacy Policy",
						onClick: () => navigate({ to: "/privacy" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Copyright & DMCA Policy",
						hint: "Takedown procedure & Safe Harbor",
						onClick: () => navigate({ to: "/copyright-policy" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Licenses",
						onClick: () => navigate({ to: "/licenses" })
					})
				]
			})
		]
	});
}
function Panel({ title, onClose, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 bg-black/70",
			onClick: onClose,
			"aria-hidden": true
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": title,
			className: "relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-zinc-800 bg-[#141418] p-4 max-h-[85vh] overflow-y-auto",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-base font-bold",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onClose,
					"aria-label": "Close",
					className: "p-1.5 text-zinc-400 hover:text-white",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18 })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-1",
				children
			})]
		})]
	});
}
function Row({ label, hint, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: "flex w-full items-center justify-between rounded-xl p-3 text-left hover:bg-zinc-800/50",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-sm font-semibold",
			children: label
		}), hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-[11px] text-zinc-500",
			children: hint
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
			className: "text-zinc-600",
			size: 18
		})]
	});
}
function DmcaField({ label, value, onChange, placeholder, type = "text" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: "block text-xs font-semibold text-zinc-400 mb-1",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		value,
		onChange: (e) => onChange(e.target.value),
		placeholder,
		maxLength: 2e3,
		className: "w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-white outline-none focus:border-indigo-500"
	})] });
}
function Toggle({ label, hint, on, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between rounded-xl p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "min-w-0 pr-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block text-sm font-semibold",
				children: label
			}), hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block text-[11px] text-zinc-500",
				children: hint
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			role: "switch",
			"aria-checked": on,
			"aria-label": label,
			onClick,
			className: `relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-indigo-500" : "bg-zinc-700"}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}` })
		})]
	});
}
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
var $$splitComponentImporter$23 = () => import("./terms-CI9_OL7X.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$23, "component")
});
var $$splitComponentImporter$22 = () => import("./wallet-D-bHqVuM.mjs").then((n) => n.t);
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
	component: lazyRouteComponent($$splitComponentImporter$22, "component")
});
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
	component: AdminCopyrightReports
});
function AdminCopyrightReports() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [isAdmin, setIsAdmin] = (0, import_react.useState)(null);
	const [reports, setReports] = (0, import_react.useState)([]);
	const [media, setMedia] = (0, import_react.useState)({});
	const [busy, setBusy] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let alive = true;
		(async () => {
			if (!user) {
				setIsAdmin(false);
				return;
			}
			const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
			if (!alive) return;
			setIsAdmin(!!data && data.length > 0);
		})();
		return () => {
			alive = false;
		};
	}, [user]);
	const load = import_react.useCallback(async () => {
		const { data, error } = await supabase.from("copyright_reports").select("*").order("created_at", { ascending: false }).limit(200);
		if (error) return;
		const rows = data ?? [];
		setReports(rows);
		const next = {};
		await Promise.all(rows.map(async (r) => {
			if (r.reported_post_id) {
				const { data: p } = await supabase.from("posts").select("media_url, media_type, caption").eq("id", r.reported_post_id).maybeSingle();
				if (p) next[r.id] = {
					url: p.media_url,
					type: p.media_type,
					caption: p.caption
				};
			} else if (r.reported_moment_id) {
				const { data: m } = await supabase.from("moments").select("media_url, media_type, text").eq("id", r.reported_moment_id).maybeSingle();
				if (m) next[r.id] = {
					url: m.media_url,
					type: m.media_type,
					caption: m.text
				};
			}
		}));
		setMedia(next);
	}, []);
	(0, import_react.useEffect)(() => {
		if (isAdmin) load();
	}, [isAdmin, load]);
	const approve = async (r) => {
		setBusy(r.id);
		try {
			if (r.reported_post_id) {
				const { error } = await supabase.from("posts").delete().eq("id", r.reported_post_id);
				if (error) throw error;
			} else if (r.reported_moment_id) {
				const { error } = await supabase.from("moments").delete().eq("id", r.reported_moment_id);
				if (error) throw error;
			}
			const { error } = await supabase.from("copyright_reports").update({
				status: "resolved",
				resolved_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", r.id);
			if (error) throw error;
			toast.success("Media removed and report resolved");
			await load();
		} catch {
			toast.error("Could not complete the takedown");
		} finally {
			setBusy(null);
		}
	};
	const reject = async (r) => {
		setBusy(r.id);
		const { error } = await supabase.from("copyright_reports").update({
			status: "rejected",
			reporter_flagged: true,
			resolved_at: (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", r.id);
		setBusy(null);
		if (error) {
			toast.error("Could not reject the report");
			return;
		}
		toast.success("Report dismissed and reporter flagged for spam");
		await load();
	};
	if (isAdmin === null) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-[#09090b] p-6 text-sm text-zinc-400",
		children: "Loading…"
	});
	if (!isAdmin) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-[#09090b] p-6 text-white",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-md rounded-2xl border border-zinc-800 bg-[#141418] p-6 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, {
					className: "mx-auto mb-3 text-red-500",
					size: 28
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-lg font-bold",
					children: "Admins only"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-zinc-400",
					children: "You do not have access to the DMCA dashboard."
				})
			]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-[#09090b] p-4 text-white",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 mt-2 flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => navigate({ to: "/settings" }),
					className: "p-1 text-zinc-300 hover:text-white",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 22 })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-bold",
					children: "DMCA Reports"
				})]
			}),
			reports.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-2xl border border-zinc-800 bg-[#141418] p-6 text-sm text-zinc-400",
				children: "No copyright reports yet."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-4",
				children: reports.map((r) => {
					const m = media[r.id];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-zinc-800 bg-[#141418] p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `rounded-full px-2 py-0.5 font-semibold ${r.status === "resolved" ? "bg-emerald-500/15 text-emerald-400" : r.status === "rejected" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`,
										children: r.status
									}),
									r.reporter_flagged && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded-full bg-red-500/15 px-2 py-0.5 font-semibold text-red-400",
										children: "spam flagged"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: new Date(r.created_at).toLocaleString() })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-3 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-zinc-800 bg-zinc-900/60 p-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mb-2 text-xs font-bold text-zinc-300",
											children: "Reported Media"
										}),
										m?.url ? m.type?.startsWith("video") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
											src: m.url,
											controls: true,
											className: "max-h-56 w-full rounded-lg bg-black"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: m.url,
											alt: "Reported media",
											className: "max-h-56 w-full rounded-lg object-contain"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "rounded-lg border border-dashed border-zinc-700 p-4 text-[11px] text-zinc-500",
											children: "Media preview unavailable"
										}),
										m?.caption && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 line-clamp-3 text-[11px] text-zinc-400",
											children: m.caption
										}),
										r.infringing_content_link && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: r.infringing_content_link,
											target: "_blank",
											rel: "noreferrer noopener",
											className: "mt-2 inline-flex items-center gap-1 break-all text-[11px] text-indigo-400 hover:underline",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 12 }),
												" ",
												r.infringing_content_link
											]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-zinc-800 bg-zinc-900/60 p-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mb-2 text-xs font-bold text-zinc-300",
											children: "Reporter's Original Proof"
										}),
										r.original_work_link ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: r.original_work_link,
											target: "_blank",
											rel: "noreferrer noopener",
											className: "inline-flex items-center gap-1 break-all text-[11px] text-indigo-400 hover:underline",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 12 }),
												" ",
												r.original_work_link
											]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[11px] text-zinc-500",
											children: "No proof link provided"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
											className: "mt-3 space-y-1 text-[11px] text-zinc-400",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-zinc-500",
													children: "Name: "
												}), r.reporter_full_name || "—"] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-zinc-500",
													children: "Email: "
												}), r.contact_email || "—"] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "whitespace-pre-wrap",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-zinc-500",
														children: "Claim: "
													}), r.reason || "—"]
												})
											]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => approve(r),
									disabled: busy === r.id || r.status !== "pending",
									className: "inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 16 }), " Approve & Delete Media"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => reject(r),
									disabled: busy === r.id || r.status !== "pending",
									className: "inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { size: 16 }), " Reject Fake Report"]
								})]
							})
						]
					}, r.id);
				})
			})
		]
	});
}
var Route$24 = createFileRoute("/channel/")({ component: ChannelIndexPage });
function ChannelIndexPage() {
	const navigate = useNavigate();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-[#09090b] text-white p-4 font-sans select-none pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => navigate({ to: "/settings" }),
					className: "p-1 text-zinc-300 hover:text-white",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 22 })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-bold",
					children: "Create Channel"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-[#141418] border border-zinc-800 rounded-2xl p-4 space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full h-32 bg-zinc-900 border border-dashed border-zinc-700 rounded-xl flex items-center justify-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-xs text-zinc-400 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image$1, { size: 16 }), " Channel banner"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "absolute top-2 right-2 bg-zinc-800 px-3 py-1 rounded-lg text-xs font-semibold",
						children: "Banner"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 20 })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-zinc-400 max-w-[200px]",
						children: "Add a square logo and a wide banner."
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4 mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-xs text-zinc-400 font-semibold block mb-1",
					children: "CHANNEL NAME"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "text",
					placeholder: "Your channel name",
					className: "w-full bg-[#141418] border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-pink-500"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-xs text-zinc-400 font-semibold block mb-1",
					children: "@ USERNAME"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "text",
					placeholder: "@channel.handle",
					className: "w-full bg-[#141418] border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-pink-500"
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "w-full mt-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-bold text-sm",
				children: "Create Channel"
			})
		]
	});
}
var $$splitComponentImporter$21 = () => import("./channel.analytics-C8Aco1ZS.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$21, "component")
});
var $$splitComponentImporter$20 = () => import("./channel.create-e-42gkP4.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$20, "component")
});
var $$splitComponentImporter$19 = () => import("./channel.monetization-Bjum6aQ1.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$19, "component")
});
var $$splitComponentImporter$18 = () => import("./channel.posts-BaSOp1Wp.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$18, "component")
});
var $$splitComponentImporter$17 = () => import("./channel.reels-D8wFoyoZ.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$17, "component")
});
var $$splitComponentImporter$16 = () => import("./channel.subscribers-DXdbCnkY.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$16, "component")
});
var $$splitComponentImporter$15 = () => import("./channel.videos-Dc0j0_Mh.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$15, "component")
});
var $$splitComponentImporter$14 = () => import("./moment.index-C5YzLWdH.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$14, "component")
});
var $$splitComponentImporter$13 = () => import("./moment._momentId-yWhUNKz3.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
var Route$14 = createFileRoute("/moment/create")({ component: MomentCreatePage });
var FULL_RECT = {
	x: 0,
	y: 0,
	w: 1,
	h: 1
};
var clamp01 = (v) => Math.min(1, Math.max(0, v));
/** Moments are published in chunks of at most this many seconds. */
var MAX_PART_SECONDS = 20;
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
/** Splits a duration into consecutive parts of at most MAX_PART_SECONDS. */
var splitIntoParts = (duration) => {
	if (!duration || duration <= MAX_PART_SECONDS) return [{
		start: 0,
		end: duration || 0
	}];
	const count = Math.ceil(duration / MAX_PART_SECONDS);
	return Array.from({ length: count }, (_, i) => ({
		start: i * MAX_PART_SECONDS,
		end: Math.min(duration, (i + 1) * MAX_PART_SECONDS)
	}));
};
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
	const [cameraResolution, setCameraResolution] = (0, import_react.useState)("");
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
	const [durationHours, setDurationHours] = (0, import_react.useState)(12);
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
	const getCapabilities = () => {
		const track = getVideoTrack();
		if (!track) return null;
		try {
			if (typeof track.getCapabilities !== "function") return null;
			return track.getCapabilities();
		} catch {
			return null;
		}
	};
	const startCamera = async () => {
		setCameraReady(false);
		setCameraError("");
		try {
			streamRef.current?.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("Camera is not supported by this browser.");
			const audioConstraint = {
				echoCancellation: true,
				noiseSuppression: true,
				autoGainControl: true
			};
			const requests = [
				{
					video: {
						facingMode,
						width: { ideal: 1280 },
						height: { ideal: 720 },
						frameRate: {
							ideal: 60,
							max: 60
						}
					},
					audio: audioConstraint
				},
				{
					video: {
						facingMode,
						width: { ideal: 1280 },
						height: { ideal: 720 },
						frameRate: { ideal: 30 }
					},
					audio: audioConstraint
				},
				{
					video: { facingMode },
					audio: true
				}
			];
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
	};
	(0, import_react.useEffect)(() => {
		if (step !== 0) return;
		startCamera();
		return () => {
			streamRef.current?.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		};
	}, [facingMode, step]);
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
		setAudioUrl(url);
		setSelectedAudio(file.name.replace(/\.[^.]+$/, ""));
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
	const setupDrawingCanvas = () => {
		const canvas = drawingCanvasRef.current;
		if (!canvas) return;
		const parent = canvas.parentElement;
		if (!parent) return;
		canvas.width = parent.clientWidth;
		canvas.height = parent.clientHeight;
		clearDrawing();
	};
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
	}, [step]);
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
		resetEditor();
		setStep(0);
	};
	const handlePublish = async () => {
		if (!mediaUrl) return;
		const createdAt = /* @__PURE__ */ new Date();
		const expiresAt = new Date(createdAt.getTime() + durationHours * 60 * 60 * 1e3);
		const newId = (suffix) => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${suffix}`;
		const parts = isVideo ? splitIntoParts(await readVideoDuration(mediaUrl)) : [{
			start: 0,
			end: 0
		}];
		const base = {
			mediaUrl,
			mediaType: isVideo ? "video" : "image",
			caption: caption || textLayers[0]?.text || overlayText,
			audio: selectedAudio,
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
			caption: parts.length > 1 ? `${base.caption ? `${base.caption} ` : ""}(${index + 1}/${parts.length})` : base.caption
		}));
		const existing = JSON.parse(localStorage.getItem("yw_moments") || "[]");
		localStorage.setItem("yw_moments", JSON.stringify([...newMoments, ...existing]));
		for (const part of newMoments) addMoment({
			kind: isVideo ? "video" : "photo",
			media: mediaUrl,
			mediaType: part.mediaType,
			text: part.caption ?? "",
			textBg: "",
			music: selectedAudio ?? void 0,
			musicUrl: audioUrl ?? void 0,
			musicStart: audioUrl ? audioStart : void 0,
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
			poll: null
		});
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
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2 mb-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DurationButton, {
						active: durationHours === 12,
						title: "12 Hours",
						onClick: () => setDurationHours(12)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DurationButton, {
						active: durationHours === 24,
						title: "24 Hours",
						onClick: () => setDurationHours(24)
					})]
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
var $$splitComponentImporter$12 = () => import("./orbit.index-4unZId8_.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$12, "component")
});
var $$splitComponentImporter$11 = () => import("./orbit._profileId-C__KJqwY.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
var $$splitComponentImporter$10 = () => import("./orbit.create-C0FK6yp5.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("./orbit.me-VJwCGIxH.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./orbit.messages-CWzBnaXk.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./orbit.notifications-DfdHPJnP.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./orbit.privacy-D0d5NaBT.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./post.create-Cpd64qr8.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./u._userId-BAnVYHpS.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./video._videoId-D6IrrA_U.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./video.upload-Ct23WJaU.mjs");
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
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./chat.index-UukeA1JR.mjs");
var Route$2 = createFileRoute("/_authenticated/chat/")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var PHOTO_FILTERS = [
	{
		id: "normal",
		name: "Original",
		class: "",
		css: "none"
	},
	{
		id: "soft-glow",
		name: "Soft Glow",
		class: "brightness-110 contrast-95 saturate-110 sepia-[0.15]",
		css: "brightness(1.1) contrast(0.95) saturate(1.1) sepia(0.15)"
	},
	{
		id: "vivid",
		name: "Vivid Pop",
		class: "saturate-150 contrast-105",
		css: "saturate(1.5) contrast(1.05)"
	},
	{
		id: "warm",
		name: "Warm Sun",
		class: "sepia-[0.25] saturate-125 brightness-105",
		css: "sepia(0.25) saturate(1.25) brightness(1.05)"
	},
	{
		id: "cool",
		name: "Cool Aesthetic",
		class: "hue-rotate-15 saturate-110",
		css: "hue-rotate(15deg) saturate(1.1)"
	},
	{
		id: "vintage",
		name: "Retro Vintage",
		class: "sepia-[0.4] contrast-110 brightness-95",
		css: "sepia(0.4) contrast(1.1) brightness(0.95)"
	},
	{
		id: "mono",
		name: "Noir B&W",
		class: "grayscale contrast-125",
		css: "grayscale(1) contrast(1.25)"
	}
];
var TEXT_COLORS = [
	"#ffffff",
	"#000000",
	"#f43f5e",
	"#f59e0b",
	"#22c55e",
	"#38bdf8",
	"#a855f7"
];
var STICKER_EMOJIS = [
	"Smile",
	"Love",
	"Party",
	"Cool",
	"Joy",
	"Tears",
	"Flame",
	"Heart",
	"Spark",
	"Celebrate",
	"Like",
	"Support",
	"Perfect",
	"Rainbow",
	"Star",
	"Pizza",
	"Coffee",
	"Pup",
	"Bloom",
	"Launch"
];
var loadImage$1 = (src) => new Promise((resolve, reject) => {
	const img = new Image();
	img.crossOrigin = "anonymous";
	img.onload = () => resolve(img);
	img.onerror = reject;
	img.src = src;
});
/** Crops a data URL to the normalized rect (0..1 values). */
async function cropImage(src, rect) {
	const img = await loadImage$1(src);
	const sx = Math.max(0, Math.round(rect.x * img.naturalWidth));
	const sy = Math.max(0, Math.round(rect.y * img.naturalHeight));
	const sw = Math.max(1, Math.round(rect.w * img.naturalWidth));
	const sh = Math.max(1, Math.round(rect.h * img.naturalHeight));
	const canvas = document.createElement("canvas");
	canvas.width = sw;
	canvas.height = sh;
	const ctx = canvas.getContext("2d");
	if (!ctx) return src;
	ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
	return canvas.toDataURL("image/png");
}
/** Flattens the filter + overlays into a single PNG data URL. */
async function renderPhoto(src, filterCss, overlays) {
	try {
		const img = await loadImage$1(src);
		const canvas = document.createElement("canvas");
		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight;
		const ctx = canvas.getContext("2d");
		if (!ctx) return src;
		ctx.filter = filterCss || "none";
		ctx.drawImage(img, 0, 0);
		ctx.filter = "none";
		const unit = canvas.height / 100;
		for (const o of overlays) {
			const px = o.x * canvas.width;
			const py = o.y * canvas.height;
			ctx.font = `bold ${Math.round(o.size * unit)}px system-ui, sans-serif`;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			if (o.kind === "text") {
				ctx.lineWidth = Math.max(2, o.size * unit * .08);
				ctx.strokeStyle = "rgba(0,0,0,0.55)";
				ctx.strokeText(o.value, px, py);
				ctx.fillStyle = o.color;
			} else ctx.fillStyle = "#ffffff";
			ctx.fillText(o.value, px, py);
		}
		return canvas.toDataURL("image/png");
	} catch {
		return src;
	}
}
/**
* Subtle repeating diagonal username watermark.
* Purely decorative + deterrent: never intercepts pointer events.
*/
var UserWatermark = import_react.memo(function UserWatermark({ username, className = "" }) {
	const label = username.startsWith("@") ? username : `@${username}`;
	const rows = Array.from({ length: 10 });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"aria-hidden": true,
		className: `pointer-events-none absolute inset-0 z-20 overflow-hidden select-none ${className}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-[-30%] flex -rotate-[24deg] flex-col justify-around",
			children: rows.map((_, r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-around whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.3em] text-foreground/[0.045]",
				children: Array.from({ length: 6 }).map((__, c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }, c))
			}, r))
		})
	});
});
/** Image with native lazy-loading + a skeleton placeholder to avoid layout shift. */
var LazyImage = (0, import_react.memo)(function LazyImage({ className, wrapperClassName, onLoad, ...props }) {
	const [loaded, setLoaded] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn("relative block overflow-hidden", wrapperClassName),
		children: [!loaded && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			"aria-hidden": true,
			className: "absolute inset-0 animate-pulse bg-muted/40"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			...props,
			loading: props.loading ?? "lazy",
			decoding: props.decoding ?? "async",
			onLoad: (e) => {
				setLoaded(true);
				onLoad?.(e);
			},
			className: cn("transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0", className)
		})]
	});
});
var readAsDataUrl = (file) => new Promise((resolve, reject) => {
	const r = new FileReader();
	r.onload = () => resolve(r.result);
	r.onerror = reject;
	r.readAsDataURL(file);
});
var loadImage = (src) => new Promise((resolve, reject) => {
	const img = new Image();
	img.onload = () => resolve(img);
	img.onerror = reject;
	img.src = src;
});
/**
* Downscales + re-encodes an image file to a compact JPEG data URL.
* Falls back to the raw data URL if anything goes wrong.
*/
async function compressImageFile(file, opts = {}) {
	const { maxDim = 1600, quality = .82 } = opts;
	const dataUrl = await readAsDataUrl(file);
	if (file.type === "image/gif") return dataUrl;
	try {
		const img = await loadImage(dataUrl);
		const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
		if (scale >= 1 && file.size < 4e5) return dataUrl;
		const canvas = document.createElement("canvas");
		canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
		canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
		const ctx = canvas.getContext("2d");
		if (!ctx) return dataUrl;
		ctx.imageSmoothingQuality = "high";
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		const out = canvas.toDataURL("image/jpeg", quality);
		return out.length < dataUrl.length ? out : dataUrl;
	} catch {
		return dataUrl;
	}
}
/**
* Best-effort screenshot / screen-recording detection.
* Browsers can't observe OS captures directly, so we watch for the signals we
* do get: PrintScreen keys, and the brief focus/visibility loss that accompanies
* a system capture UI. Fires `onCapture` (throttled) instead of alerting.
*/
function useCaptureDetect(enabled, onCapture) {
	const cb = (0, import_react.useRef)(onCapture);
	cb.current = onCapture;
	(0, import_react.useEffect)(() => {
		if (!enabled || typeof window === "undefined") return;
		let last = 0;
		const fire = (kind) => {
			const now = Date.now();
			if (now - last < 4e3) return;
			last = now;
			cb.current(kind);
		};
		const onKey = (e) => {
			if (e.key === "PrintScreen" || e.metaKey && e.shiftKey && [
				"3",
				"4",
				"5"
			].includes(e.key)) fire(e.key === "5" ? "recording" : "screenshot");
		};
		const onVisibility = () => {
			if (document.visibilityState === "hidden") fire("screenshot");
		};
		window.addEventListener("keyup", onKey);
		document.addEventListener("visibilitychange", onVisibility);
		return () => {
			window.removeEventListener("keyup", onKey);
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, [enabled]);
}
var currentUser = {
	id: "u0",
	username: "you",
	name: "Your World",
	hue: 320,
	verified: true,
	category: "Creator",
	location: "Tokyo, Japan",
	website: "yourworld.app/you",
	bio: "Night photographer and reel maker · collecting small moments\nNeon streets, slow mornings and long exposures\nShot on 35mm · edits in the dark\n#nightwalk #neon #filmlook — collabs open, DM @riko.night\nNew drop every Friday → https://yourworld.app/you"
};
var users = [
	{
		id: "u1",
		username: "riko.night",
		name: "Riko Tan",
		hue: 300
	},
	{
		id: "u2",
		username: "sea.salt",
		name: "Mara Vega",
		hue: 190
	},
	{
		id: "u3",
		username: "spinsolo",
		name: "Ada Kim",
		hue: 40
	},
	{
		id: "u4",
		username: "slowbrunch",
		name: "Noah Ferre",
		hue: 15
	},
	{
		id: "u5",
		username: "wavelen",
		name: "Kai Oduya",
		hue: 250
	},
	{
		id: "u6",
		username: "moss.club",
		name: "Ines Roth",
		hue: 150
	}
];
var byId = (id) => users.find((u) => u.id === id) ?? currentUser;
var hashtags = [
	{
		tag: "streetphotography",
		postCount: 78e5,
		trending: true
	},
	{
		tag: "tokyo",
		postCount: 21e5,
		trending: true
	},
	{
		tag: "goldenhour",
		postCount: 45e5,
		trending: true
	},
	{
		tag: "cinematic",
		postCount: 78e4,
		trending: true
	},
	{
		tag: "nightwalk",
		postCount: 482e3,
		trending: true
	},
	{
		tag: "surf",
		postCount: 12e5,
		trending: true
	},
	{
		tag: "neon",
		postCount: 89e4
	},
	{
		tag: "35mm",
		postCount: 95e4
	},
	{
		tag: "filmlook",
		postCount: 32e4
	},
	{
		tag: "ocean",
		postCount: 56e5
	},
	{
		tag: "brunch",
		postCount: 34e5
	},
	{
		tag: "slowmornings",
		postCount: 156e3
	},
	{
		tag: "minimalism",
		postCount: 23e5
	},
	{
		tag: "darkmode",
		postCount: 445e3
	},
	{
		tag: "coffeetime",
		postCount: 19e5
	},
	{
		tag: "analog",
		postCount: 61e4
	},
	{
		tag: "architecture",
		postCount: 81e5
	},
	{
		tag: "portrait",
		postCount: 12e6
	}
];
var suggestedUsers = [
	{
		id: "u1",
		username: "riko.night",
		name: "Riko Tan",
		hue: 300,
		verified: true,
		category: "Photographer",
		followerCount: 48200
	},
	{
		id: "u2",
		username: "sea.salt",
		name: "Mara Vega",
		hue: 190,
		category: "Surfer",
		followerCount: 31800
	},
	{
		id: "u3",
		username: "spinsolo",
		name: "Ada Kim",
		hue: 40,
		verified: true,
		category: "DJ · Producer",
		followerCount: 92400
	},
	{
		id: "u4",
		username: "slowbrunch",
		name: "Noah Ferre",
		hue: 15,
		category: "Food & Travel",
		followerCount: 14600
	},
	{
		id: "u5",
		username: "wavelen",
		name: "Kai Oduya",
		hue: 250,
		category: "Filmmaker",
		followerCount: 67100
	},
	{
		id: "u6",
		username: "moss.club",
		name: "Ines Roth",
		hue: 150,
		verified: true,
		category: "Artist",
		followerCount: 23900
	}
];
var formatCount = (n) => {
	if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
	if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
	return `${n}`;
};
/**
* Live presence for a chat thread: who else is in the room and whether the
* peer is currently typing. Uses a Supabase Realtime presence channel.
*/
function useThreadPresence(threadId, me) {
	const [peerOnline, setPeerOnline] = (0, import_react.useState)(false);
	const [peerTyping, setPeerTyping] = (0, import_react.useState)(false);
	const channelRef = (0, import_react.useRef)(null);
	const typingUntil = (0, import_react.useRef)(0);
	const tick = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!me || !threadId) return;
		const channel = supabase.channel(`presence-thread-${threadId}`, { config: { presence: { key: me } } });
		channelRef.current = channel;
		const sync = () => {
			const state = channel.presenceState();
			const others = Object.entries(state).filter(([key]) => key !== me).flatMap(([, metas]) => metas);
			setPeerOnline(others.length > 0);
			setPeerTyping(others.some((m) => (m.typing_until ?? 0) > Date.now()));
		};
		channel.on("presence", { event: "sync" }, sync).on("presence", { event: "join" }, sync).on("presence", { event: "leave" }, sync).subscribe((status) => {
			if (status === "SUBSCRIBED") channel.track({
				user_id: me,
				typing_until: 0,
				online_at: (/* @__PURE__ */ new Date()).toISOString()
			});
		});
		tick.current = setInterval(sync, 1e3);
		return () => {
			if (tick.current) clearInterval(tick.current);
			channelRef.current = null;
			supabase.removeChannel(channel);
		};
	}, [threadId, me]);
	/** Call on every keystroke — throttled to one track() per second. */
	const setTyping = (0, import_react.useCallback)((typing) => {
		const channel = channelRef.current;
		if (!channel || !me) return;
		const now = Date.now();
		if (typing && now < typingUntil.current - 2e3) return;
		typingUntil.current = typing ? now + 3e3 : 0;
		channel.track({
			user_id: me,
			typing_until: typingUntil.current,
			online_at: (/* @__PURE__ */ new Date()).toISOString()
		});
	}, [me]);
	return (0, import_react.useMemo)(() => ({
		peerOnline,
		peerTyping,
		setTyping
	}), [
		peerOnline,
		peerTyping,
		setTyping
	]);
}
/**
* Per-contact custom display names (the "Change Display Name" chat option).
* Stored in `orbit_chat_settings.display_name` for the signed-in user and
* mirrored in a tiny in-memory + localStorage map so every screen (chat header,
* chat lists, profile views) shows the custom name instantly.
*/
var LS_KEY = "yw.chat.names";
var cache = null;
var listeners = /* @__PURE__ */ new Set();
var localRevision = 0;
function readLocal() {
	try {
		const raw = window.localStorage.getItem(LS_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}
function writeLocal(map) {
	try {
		window.localStorage.setItem(LS_KEY, JSON.stringify(map));
	} catch {}
}
function emit() {
	listeners.forEach((l) => l());
}
function getChatNames() {
	if (cache) return cache;
	cache = typeof window === "undefined" ? {} : readLocal();
	return cache;
}
/** Update locally (instant) — the caller persists to the database. */
function setChatNameLocal(peerId, name) {
	if (!peerId) return;
	const map = { ...getChatNames() };
	if (name && name.trim()) map[peerId] = name.trim();
	else delete map[peerId];
	cache = map;
	localRevision += 1;
	writeLocal(map);
	emit();
}
/** Persist a custom display name for a contact, forever, until changed again. */
async function saveChatDisplayName(peerId, name) {
	if (!peerId) return false;
	setChatNameLocal(peerId, name);
	const { data } = await supabase.auth.getUser();
	const me = data.user?.id;
	if (!me) return false;
	const { error } = await supabase.from("orbit_chat_settings").upsert({
		user_id: me,
		peer_id: peerId,
		display_name: name?.trim() || null
	}, { onConflict: "user_id,peer_id" });
	return !error;
}
/** Pull every saved custom name for the signed-in user into the local map. */
async function refreshChatNames() {
	const revisionAtStart = localRevision;
	const { data: auth } = await supabase.auth.getUser();
	const me = auth.user?.id;
	if (!me) return;
	const { data, error } = await supabase.from("orbit_chat_settings").select("peer_id,display_name").eq("user_id", me);
	if (error || revisionAtStart !== localRevision) return;
	const rows = data ?? [];
	const map = {};
	rows.forEach((r) => {
		if (r.display_name && r.display_name.trim()) map[r.peer_id] = r.display_name.trim();
	});
	cache = map;
	writeLocal(map);
	emit();
}
/** Subscribe a component to custom-name changes. */
function useChatNames() {
	const [names, setNames] = (0, import_react.useState)(() => getChatNames());
	(0, import_react.useEffect)(() => {
		const sync = () => setNames({ ...getChatNames() });
		listeners.add(sync);
		refreshChatNames();
		return () => {
			listeners.delete(sync);
		};
	}, []);
	return {
		names,
		nameFor: (peerId, fallback) => (peerId ? names[peerId] : void 0) || fallback
	};
}
var DEFAULTS = {
	displayName: null,
	secretLock: false,
	secretPinSalt: null,
	secretPinHash: null,
	viewOnce: false,
	autoDelete: 0,
	screenshotAlert: true,
	recordingAlert: true,
	muted: false,
	blocked: false
};
function useChatSettings(peerId) {
	const [settings, setSettings] = (0, import_react.useState)(DEFAULTS);
	const [ready, setReady] = (0, import_react.useState)(false);
	const meRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		let alive = true;
		setReady(false);
		if (!peerId) return;
		(async () => {
			const { data: auth } = await supabase.auth.getUser();
			const me = auth.user?.id ?? null;
			meRef.current = me;
			if (!me || !alive) return;
			const { data } = await supabase.from("orbit_chat_settings").select("display_name,secret_lock_enabled,secret_pin_salt,secret_pin_hash,view_once_mode,auto_delete_seconds,screenshot_alert,recording_alert,muted,blocked").eq("user_id", me).eq("peer_id", peerId).maybeSingle();
			if (!alive) return;
			const row = data;
			if (row) setSettings({
				displayName: row.display_name,
				secretLock: row.secret_lock_enabled,
				secretPinSalt: row.secret_pin_salt,
				secretPinHash: row.secret_pin_hash,
				viewOnce: row.view_once_mode,
				autoDelete: row.auto_delete_seconds ?? 0,
				screenshotAlert: row.screenshot_alert,
				recordingAlert: row.recording_alert,
				muted: row.muted,
				blocked: !!row.blocked
			});
			setReady(true);
		})();
		return () => {
			alive = false;
		};
	}, [peerId]);
	return {
		settings,
		ready,
		patch: (0, import_react.useCallback)((next) => {
			setSettings((prev) => {
				const merged = {
					...prev,
					...next
				};
				const me = meRef.current;
				if (me && peerId) supabase.from("orbit_chat_settings").upsert({
					user_id: me,
					peer_id: peerId,
					display_name: merged.displayName,
					secret_lock_enabled: merged.secretLock,
					secret_pin_salt: merged.secretPinSalt,
					secret_pin_hash: merged.secretPinHash,
					view_once_mode: merged.viewOnce,
					auto_delete_seconds: merged.autoDelete,
					screenshot_alert: merged.screenshotAlert,
					recording_alert: merged.recordingAlert,
					muted: merged.muted,
					blocked: merged.blocked
				}, { onConflict: "user_id,peer_id" });
				return merged;
			});
		}, [peerId])
	};
}
/**
* Shared Secret Chat Lock helpers used by both Social and Orbit message lists.
* Locked conversations disappear from the list/search until the exact PIN is
* typed into the search bar; opening them still requires the PIN.
*/
function randomPinSalt() {
	const bytes = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(16));
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function hashPin(salt, pin) {
	const bytes = new TextEncoder().encode(`${salt}:${pin}`);
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
/** Persist only this user's lock fields for one peer, atomically. */
async function saveSecretChatLock(peerId, enabled, salt, hash) {
	const { data: auth, error: authError } = await supabase.auth.getUser();
	const userId = auth.user?.id;
	if (authError || !userId) throw authError ?? /* @__PURE__ */ new Error("Not signed in");
	const { error } = await supabase.from("orbit_chat_settings").upsert({
		user_id: userId,
		peer_id: peerId,
		secret_lock_enabled: enabled,
		secret_pin_salt: salt,
		secret_pin_hash: hash
	}, { onConflict: "user_id,peer_id" });
	if (error) throw error;
}
async function fetchLocked() {
	const { data: auth } = await supabase.auth.getUser();
	const me = auth.user?.id;
	if (!me) return [];
	const { data } = await supabase.from("orbit_chat_settings").select("peer_id,secret_pin_salt,secret_pin_hash,secret_lock_enabled").eq("user_id", me).eq("secret_lock_enabled", true);
	return (data ?? []).map((r) => ({
		peerId: String(r["peer_id"]),
		salt: r["secret_pin_salt"] ?? null,
		hash: r["secret_pin_hash"] ?? null
	}));
}
/**
* @param query current text in the message search bar — an exact PIN match
*              temporarily reveals the matching locked chat(s).
*/
function useSecretChats(query) {
	const [locked, setLocked] = (0, import_react.useState)([]);
	const [revealed, setRevealed] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		let alive = true;
		const refresh = () => {
			fetchLocked().then((rows) => {
				if (alive) setLocked(rows);
			});
		};
		refresh();
		const channel = supabase.channel("secret-chats").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "orbit_chat_settings"
		}, refresh).subscribe();
		window.addEventListener("focus", refresh);
		document.addEventListener("visibilitychange", refresh);
		return () => {
			alive = false;
			window.removeEventListener("focus", refresh);
			document.removeEventListener("visibilitychange", refresh);
			supabase.removeChannel(channel);
		};
	}, []);
	const pin = query.trim();
	(0, import_react.useEffect)(() => {
		let alive = true;
		if (!/^\d{4,8}$/.test(pin) || locked.length === 0) {
			setRevealed((prev) => prev.length ? [] : prev);
			return;
		}
		(async () => {
			const hits = [];
			for (const row of locked) {
				if (!row.salt || !row.hash) continue;
				if (await hashPin(row.salt, pin) === row.hash) hits.push(row.peerId);
			}
			if (alive) setRevealed(hits);
		})();
		return () => {
			alive = false;
		};
	}, [pin, locked]);
	const lockedIds = (0, import_react.useMemo)(() => locked.map((l) => l.peerId), [locked]);
	return {
		lockedIds,
		revealed,
		isHidden: (0, import_react.useCallback)((peerId) => !!peerId && lockedIds.includes(peerId) && !revealed.includes(peerId), [lockedIds, revealed]),
		hasReveal: revealed.length > 0
	};
}
/**
* In-app PIN prompt for Secret Chat Lock.
* Replaces window.prompt(), which freezes the whole app inside embedded
* previews/webviews and made the Secret Lock option look broken.
*/
function PinDialog({ open, title, description, confirmLabel = "Confirm", error, onCancel, onSubmit }) {
	const [pin, setPin] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (open) setPin("");
	}, [open]);
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[200] grid place-items-center bg-black/80 px-6 backdrop-blur-sm",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "w-full max-w-xs space-y-4 rounded-2xl bg-zinc-900 p-6 text-center text-white shadow-2xl",
			onSubmit: (e) => {
				e.preventDefault();
				onSubmit(pin);
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
					size: 26,
					className: "mx-auto text-purple-400"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-base font-bold",
					children: title
				}), description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-zinc-400",
					children: description
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: pin,
					onChange: (e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8)),
					inputMode: "numeric",
					type: "password",
					autoFocus: true,
					"aria-label": "Chat PIN",
					className: "h-12 w-full rounded-xl bg-zinc-800 px-4 text-center text-lg outline-none"
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium text-red-400",
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onCancel,
						className: "h-11 flex-1 rounded-xl bg-zinc-800 text-sm font-semibold text-zinc-300",
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						className: "h-11 flex-1 rounded-xl bg-purple-600 text-sm font-bold",
						children: confirmLabel
					})]
				})
			]
		})
	});
}
var Route$1 = createFileRoute("/_authenticated/chat/$threadId")({ component: ChatThreadPage });
function MenuItem({ icon, label, onClick, state, danger }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: `w-full text-left px-3 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-3 ${danger ? "text-red-400 hover:bg-red-950/40" : "text-zinc-200 hover:bg-zinc-800/80"}`,
		children: [
			icon,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex-1",
				children: label
			}),
			state !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: `h-4 w-7 rounded-full transition-colors ${state ? "bg-purple-600" : "bg-zinc-700"} relative`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${state ? "left-3.5" : "left-0.5"}` })
			})
		]
	});
}
function ChatThreadPage() {
	const navigate = useNavigate();
	const router = useRouter();
	const [selectedImage, setSelectedImage] = (0, import_react.useState)(null);
	const [protectionWarning, setProtectionWarning] = (0, import_react.useState)(null);
	const [caption, setCaption] = (0, import_react.useState)("");
	const [isViewOnce, setIsViewOnce] = (0, import_react.useState)(false);
	const [isHD, setIsHD] = (0, import_react.useState)(true);
	const [selectedFilter, setSelectedFilter] = (0, import_react.useState)("normal");
	const [showFilters, setShowFilters] = (0, import_react.useState)(false);
	const filters = PHOTO_FILTERS;
	const [overlays, setOverlays] = (0, import_react.useState)([]);
	const [activeTool, setActiveTool] = (0, import_react.useState)(null);
	const [textColor, setTextColor] = (0, import_react.useState)(TEXT_COLORS[0]);
	const [textDraft, setTextDraft] = (0, import_react.useState)("");
	const [cropRect, setCropRect] = (0, import_react.useState)(null);
	const cropStart = (0, import_react.useRef)(null);
	const dragId = (0, import_react.useRef)(null);
	const imageBoxRef = (0, import_react.useRef)(null);
	const [openedOnce, setOpenedOnce] = (0, import_react.useState)([]);
	const [viewOnceOpen, setViewOnceOpen] = (0, import_react.useState)(null);
	const handleClosePreview = () => {
		if (selectedImage?.startsWith("blob:")) URL.revokeObjectURL(selectedImage);
		setSelectedImage(null);
		setCaption("");
		setIsViewOnce(false);
		setSelectedFilter("normal");
		setShowFilters(false);
		setOverlays([]);
		setActiveTool(null);
		setCropRect(null);
		setTextDraft("");
	};
	const { threadId } = Route$1.useParams();
	(0, import_react.useEffect)(() => {
		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(threadId)) return;
		let alive = true;
		supabase.auth.getSession().then(({ data }) => {
			const uid = data.session?.user.id;
			if (!alive || !uid || uid === threadId) return;
			navigate({
				to: "/chat/$threadId",
				params: { threadId: dmThreadId(uid, threadId) },
				replace: true
			});
		});
		return () => {
			alive = false;
		};
	}, [threadId, navigate]);
	const { startCall } = useCall();
	const { messages: dbMessages, currentUserId, send: sendToDb, remove: removeFromDb, markRead, burnMedia, loading: messagesLoading, loadingMore, hasMore, loadOlder } = useThreadMessages(threadId, { staleTime: Infinity });
	const messagesEndRef = (0, import_react.useRef)(null);
	const scrollRef = (0, import_react.useRef)(null);
	const keepScrollRef = (0, import_react.useRef)(null);
	const fileInputRef = (0, import_react.useRef)(null);
	const cameraInputRef = (0, import_react.useRef)(null);
	const mediaRecorderRef = (0, import_react.useRef)(null);
	const [message, setMessage] = (0, import_react.useState)("");
	const [localMessages, setLocalMessages] = (0, import_react.useState)([]);
	const [hiddenIds, setHiddenIds] = (0, import_react.useState)([]);
	const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit"
	});
	const messages = (0, import_react.useMemo)(() => {
		return [...dbMessages.map((m) => ({
			id: m.id,
			text: m.media_type === "text" ? m.content : m.content || void 0,
			image: m.media_type.startsWith("image") ? m.media_url ?? void 0 : void 0,
			audio: m.media_type === "audio" ? m.media_url ?? void 0 : void 0,
			sender: m.sender_id === currentUserId ? "me" : "them",
			system: m.media_type === "system",
			time: fmtTime(m.created_at),
			ts: new Date(m.created_at).getTime(),
			read: m.is_read,
			viewOnce: m.media_type.startsWith("image_once"),
			opened: m.media_type === "image_once_opened"
		})), ...localMessages].filter((m) => !hiddenIds.includes(m.id)).sort((a, b) => a.ts - b.ts);
	}, [
		dbMessages,
		localMessages,
		hiddenIds,
		currentUserId
	]);
	(0, import_react.useEffect)(() => {
		if (!currentUserId) return;
		const unread = dbMessages.filter((m) => m.sender_id !== currentUserId && !m.is_read).map((m) => m.id);
		if (unread.length) markRead(unread);
	}, [
		dbMessages,
		currentUserId,
		markRead
	]);
	const [showEmojis, setShowEmojis] = (0, import_react.useState)(false);
	const [showOptionsMenu, setShowOptionsMenu] = (0, import_react.useState)(false);
	const [isRecording, setIsRecording] = (0, import_react.useState)(false);
	const [recordingTime, setRecordingTime] = (0, import_react.useState)(0);
	const [playingAudioId, setPlayingAudioId] = (0, import_react.useState)(null);
	const [selectMode, setSelectMode] = (0, import_react.useState)(false);
	const [selectedIds, setSelectedIds] = (0, import_react.useState)([]);
	const [actionSheetId, setActionSheetId] = (0, import_react.useState)(null);
	const longPressRef = (0, import_react.useRef)(null);
	const peer = useThreadPeer(threadId, currentUserId);
	const { peerOnline, peerTyping, setTyping } = useThreadPresence(threadId, currentUserId);
	(0, import_react.useEffect)(() => {
		if (!viewOnceOpen) return;
		const row = dbMessages.find((m) => m.id === viewOnceOpen.id);
		if (row && (!row.media_url || row.media_type === "image_once_opened")) {
			setOpenedOnce((prev) => prev.includes(viewOnceOpen.id) ? prev : [...prev, viewOnceOpen.id]);
			setViewOnceOpen(null);
		}
	}, [dbMessages, viewOnceOpen]);
	const { settings, patch } = useChatSettings(peer.peerId);
	const { nameFor } = useChatNames();
	const displayName = nameFor(peer.peerId, settings.displayName ?? peer.peerName ?? "");
	const openPeerProfile = {
		preload: () => {
			if (!peer.peerId) return;
			router.preloadRoute({
				to: "/u/$userId",
				params: { userId: peer.peerId }
			}).catch(() => {});
		},
		go: () => {
			if (!peer.peerId) return;
			navigate({
				to: "/u/$userId",
				params: { userId: peer.peerId }
			});
		}
	};
	const [nameDialogOpen, setNameDialogOpen] = (0, import_react.useState)(false);
	const [nameDraft, setNameDraft] = (0, import_react.useState)("");
	const setDisplayName = (n) => {
		patch({ displayName: n });
		saveChatDisplayName(peer.peerId ?? "", n);
	};
	const secretLock = settings.secretLock;
	const [chatUnlocked, setChatUnlocked] = (0, import_react.useState)(false);
	const [unlockPin, setUnlockPin] = (0, import_react.useState)("");
	const [unlockError, setUnlockError] = (0, import_react.useState)(null);
	const [pinMode, setPinMode] = (0, import_react.useState)(null);
	const [pinError, setPinError] = (0, import_react.useState)(null);
	const toggleSecretLock = () => {
		if (!peer.peerId) {
			pushSystem("Chat is still loading");
			return;
		}
		setPinError(null);
		setPinMode(secretLock ? "remove" : "set");
	};
	const submitPin = async (pin) => {
		const peerId = peer.peerId;
		if (!peerId) return;
		try {
			if (pinMode === "remove") {
				const salt = settings.secretPinSalt;
				const hash = settings.secretPinHash;
				if (!pin || !salt || !hash || await hashPin(salt, pin) !== hash) {
					setPinError("Incorrect PIN");
					return;
				}
				await saveSecretChatLock(peerId, false, null, null);
				patch({
					secretLock: false,
					secretPinSalt: null,
					secretPinHash: null
				});
				setChatUnlocked(true);
				setPinMode(null);
				pushSystem("Secret lock disabled");
				return;
			}
			if (!/^\d{4,8}$/.test(pin)) {
				setPinError("Use a 4-8 digit PIN");
				return;
			}
			const salt = randomPinSalt();
			const hash = await hashPin(salt, pin);
			await saveSecretChatLock(peerId, true, salt, hash);
			patch({
				secretLock: true,
				secretPinSalt: salt,
				secretPinHash: hash
			});
			setChatUnlocked(true);
			setPinMode(null);
			pushSystem("Secret lock enabled");
		} catch (err) {
			console.error("[secret-lock] save failed", err);
			setPinError("Couldn't save. Check your connection and try again.");
		}
	};
	const viewOnce = settings.viewOnce;
	const autoDelete = settings.autoDelete;
	const screenshotAlert = settings.screenshotAlert;
	const recordingAlert = settings.recordingAlert;
	const muted = settings.muted;
	const blocked = settings.blocked;
	const [reported, setReported] = (0, import_react.useState)(false);
	const pushSystem = (text) => setLocalMessages((prev) => [...prev, {
		id: `local-${Date.now()}-${Math.random()}`,
		system: true,
		sender: "me",
		text,
		ts: Date.now(),
		local: true,
		time: (/* @__PURE__ */ new Date()).toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit"
		})
	}]);
	const startLongPress = (id) => {
		if (longPressRef.current) clearTimeout(longPressRef.current);
		longPressRef.current = setTimeout(() => setActionSheetId(id), 450);
	};
	const cancelLongPress = () => {
		if (longPressRef.current) clearTimeout(longPressRef.current);
		longPressRef.current = null;
	};
	const toggleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
	const deleteIds = (ids) => {
		setLocalMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
		setHiddenIds((prev) => [...prev, ...ids]);
		removeFromDb(ids.filter((id) => !id.startsWith("local-")));
		setSelectedIds([]);
	};
	const exitSelectMode = () => {
		setSelectMode(false);
		setSelectedIds([]);
	};
	(0, import_react.useEffect)(() => () => cancelLongPress(), []);
	const EMOJIS = [
		"Like",
		"Heart",
		"Laugh",
		"Flame",
		"Celebrate",
		"Love",
		"Applause",
		"Support",
		"Launch",
		"Perfect"
	];
	const didFirstScroll = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		if (keepScrollRef.current !== null && scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight - keepScrollRef.current;
			keepScrollRef.current = null;
			return;
		}
		const id = requestAnimationFrame(() => {
			messagesEndRef.current?.scrollIntoView({
				behavior: didFirstScroll.current ? "smooth" : "auto",
				block: "end"
			});
			didFirstScroll.current = true;
		});
		return () => cancelAnimationFrame(id);
	}, [messages, isRecording]);
	const onScrollMessages = () => {
		const el = scrollRef.current;
		if (!el || el.scrollTop > 80 || loadingMore || !hasMore) return;
		keepScrollRef.current = el.scrollHeight;
		loadOlder();
	};
	useCaptureDetect(true, (kind) => {
		if (kind === "recording" ? !recordingAlert : !screenshotAlert) return;
		pushSystem(`${currentUser.name} took a ${kind === "recording" ? "recording" : "screenshot"}`);
	});
	(0, import_react.useEffect)(() => {
		if (!autoDelete) return;
		const t = setInterval(() => {
			const cutoff = Date.now() - autoDelete * 1e3;
			setLocalMessages((prev) => prev.filter((m) => m.ts >= cutoff));
		}, 1e3);
		return () => clearInterval(t);
	}, [autoDelete]);
	(0, import_react.useEffect)(() => {
		let timer;
		if (isRecording) timer = setInterval(() => setRecordingTime((prev) => prev + 1), 1e3);
		else setRecordingTime(0);
		return () => clearInterval(timer);
	}, [isRecording]);
	const pushLocal = (partial) => setLocalMessages((prev) => [...prev, {
		...partial,
		id: `local-${Date.now()}-${Math.random()}`,
		ts: Date.now(),
		local: true,
		time: (/* @__PURE__ */ new Date()).toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit"
		})
	}]);
	const doSend = (currentMsg) => {
		if (currentUserId) sendToDb({
			content: currentMsg,
			media_type: "text"
		});
		else pushLocal({
			text: currentMsg,
			sender: "me"
		});
		setMessage("");
		setShowEmojis(false);
	};
	const handleSend = () => {
		if (!message.trim() || blocked) return;
		if (needsProtectionWarning(message)) {
			setProtectionWarning(message);
			return;
		}
		doSend(message);
	};
	const handleImageSelect = async (e) => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;
		const compressed = await compressImageFile(file, {
			maxDim: 1600,
			quality: .82
		});
		setCaption("");
		setIsViewOnce(false);
		setSelectedFilter("normal");
		setShowFilters(false);
		setSelectedImage(compressed);
	};
	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const recorder = new MediaRecorder(stream);
			mediaRecorderRef.current = recorder;
			const chunks = [];
			recorder.ondataavailable = (e) => chunks.push(e.data);
			recorder.onstop = () => {
				const blob = new Blob(chunks, { type: "audio/webm" });
				const audioUrl = URL.createObjectURL(blob);
				pushLocal({
					audio: audioUrl,
					sender: "me"
				});
				stream.getTracks().forEach((t) => t.stop());
			};
			recorder.start();
			setIsRecording(true);
		} catch (err) {
			console.error("Microphone error", err);
		}
	};
	const stopRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop();
			setIsRecording(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "fixed inset-0 z-50 bg-black text-white font-sans flex flex-col justify-between overflow-hidden",
			children: [
				secretLock && !chatUnlocked && settings.secretPinHash ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 z-[95] grid place-items-center bg-black px-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "w-full max-w-xs space-y-4 text-center",
						onSubmit: (e) => {
							e.preventDefault();
							(async () => {
								const salt = settings.secretPinSalt;
								const hash = settings.secretPinHash;
								if (!salt || !hash || await hashPin(salt, unlockPin) !== hash) {
									setUnlockError("Incorrect PIN");
									setUnlockPin("");
									return;
								}
								setUnlockError(null);
								setChatUnlocked(true);
								setUnlockPin("");
							})();
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
								size: 28,
								className: "mx-auto text-purple-400"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-lg font-bold",
								children: "Secret chat locked"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-zinc-400",
								children: "Enter your PIN to open this conversation."
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: unlockPin,
								onChange: (e) => {
									setUnlockPin(e.target.value.replace(/\D/g, "").slice(0, 8));
									setUnlockError(null);
								},
								inputMode: "numeric",
								type: "password",
								autoFocus: true,
								"aria-label": "Secret chat PIN",
								className: "h-12 w-full rounded-xl bg-zinc-900 px-4 text-center text-lg outline-none"
							}),
							unlockError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium text-red-400",
								children: unlockError
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								className: "h-11 w-full rounded-xl bg-purple-600 text-sm font-bold",
								children: "Unlock"
							})
						]
					})
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "file",
					ref: fileInputRef,
					accept: "image/*",
					className: "hidden",
					onChange: handleImageSelect
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "file",
					ref: cameraInputRef,
					accept: "image/*",
					capture: "environment",
					className: "hidden",
					onChange: handleImageSelect
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative z-[70] flex items-center justify-between px-4 py-3 bg-zinc-950/90 border-b border-zinc-800/80 backdrop-blur-md shrink-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => navigate({ to: ".." }),
									className: "p-1 text-zinc-300 hover:text-white",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 22 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative cursor-pointer",
									onPointerDown: openPeerProfile.preload,
									onClick: openPeerProfile.go,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md",
										children: (displayName || "U").charAt(0).toUpperCase()
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `absolute bottom-0 right-0 w-3 h-3 border-2 border-black rounded-full ${peerOnline ? "bg-emerald-500" : "bg-zinc-600"}` })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-bold text-sm leading-tight text-white flex items-center gap-1 cursor-pointer",
										onPointerDown: openPeerProfile.preload,
										onClick: openPeerProfile.go,
										children: [
											displayName,
											secretLock && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
												size: 12,
												className: "text-purple-400"
											}),
											muted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellOff, {
												size: 12,
												className: "text-zinc-500"
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] font-medium",
										children: blocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-red-400",
											children: "Blocked"
										}) : peerTyping ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-purple-400",
											children: "typing..."
										}) : peerOnline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-emerald-400",
											children: "Online"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-zinc-500",
											children: "Offline"
										})
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4 text-zinc-300",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => void startCall({
										threadId,
										peerId: peer.peerId ?? void 0,
										peerName: displayName,
										mode: "audio"
									}),
									"aria-label": "Voice call",
									className: "hover:text-white",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { size: 20 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => void startCall({
										threadId,
										peerId: peer.peerId ?? void 0,
										peerName: displayName,
										mode: "video"
									}),
									"aria-label": "Video call",
									className: "hover:text-white",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, { size: 20 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setShowOptionsMenu(!showOptionsMenu),
									className: "hover:text-white",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EllipsisVertical, { size: 20 })
								})
							]
						}),
						showOptionsMenu && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "fixed inset-0 z-[75]",
							onClick: () => setShowOptionsMenu(false)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "absolute right-4 top-14 w-64 bg-zinc-900/95 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-[80] backdrop-blur-md animate-in fade-in zoom-in-95 duration-150",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, {
										size: 16,
										className: "text-zinc-400"
									}),
									label: "Change Display Name",
									onClick: () => {
										setNameDraft(displayName);
										setNameDialogOpen(true);
										setShowOptionsMenu(false);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
										size: 16,
										className: "text-zinc-400"
									}),
									label: "Secret Lock Chat",
									state: secretLock,
									onClick: () => {
										toggleSecretLock();
										setShowOptionsMenu(false);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, {
										size: 16,
										className: "text-zinc-400"
									}),
									label: "View Once Mode",
									state: viewOnce,
									onClick: () => {
										patch({ viewOnce: !viewOnce });
										pushSystem(`View once mode ${!viewOnce ? "on" : "off"}`);
										setShowOptionsMenu(false);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
										size: 16,
										className: "text-zinc-400"
									}),
									label: autoDelete ? `Auto Delete: ${autoDelete}s` : "Auto Delete Messages",
									state: autoDelete > 0,
									onClick: () => {
										const next = autoDelete === 0 ? 60 : autoDelete === 60 ? 300 : autoDelete === 300 ? 3600 : 0;
										patch({ autoDelete: next });
										pushSystem(next ? `Messages will auto delete after ${next}s` : "Auto delete turned off");
										setShowOptionsMenu(false);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {
										size: 16,
										className: "text-zinc-400"
									}),
									label: "Screenshot Alert",
									state: screenshotAlert,
									onClick: () => {
										patch({ screenshotAlert: !screenshotAlert });
										pushSystem(`Screenshot alerts ${!screenshotAlert ? "on" : "off"}`);
										setShowOptionsMenu(false);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoOff, {
										size: 16,
										className: "text-zinc-400"
									}),
									label: "Screen Recording Alert",
									state: recordingAlert,
									onClick: () => {
										patch({ recordingAlert: !recordingAlert });
										pushSystem(`Recording alerts ${!recordingAlert ? "on" : "off"}`);
										setShowOptionsMenu(false);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellOff, {
										size: 16,
										className: "text-zinc-400"
									}),
									label: "Mute Notifications",
									state: muted,
									onClick: () => {
										patch({ muted: !muted });
										pushSystem(`Notifications ${!muted ? "muted" : "unmuted"}`);
										setShowOptionsMenu(false);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
										size: 16,
										className: "text-zinc-400"
									}),
									label: "Clear Chat",
									onClick: () => {
										deleteIds(messages.map((m) => m.id));
										exitSelectMode();
										setShowOptionsMenu(false);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									danger: true,
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserX, {
										size: 16,
										className: "text-red-400"
									}),
									label: blocked ? "Unblock User" : "Block User",
									state: blocked,
									onClick: () => {
										patch({ blocked: !blocked });
										pushSystem(`${displayName} ${!blocked ? "blocked" : "unblocked"}`);
										setShowOptionsMenu(false);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									danger: true,
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, {
										size: 16,
										className: "text-red-400"
									}),
									label: reported ? "Reported" : "Report User",
									state: reported,
									onClick: () => {
										if (!reported) {
											setReported(true);
											pushSystem(`${displayName} reported. Our team will review.`);
										}
										setShowOptionsMenu(false);
									}
								})
							]
						})] })
					]
				}),
				protectionWarning !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "fixed inset-0 z-[140] grid place-items-center bg-black/70 px-6",
					onClick: () => setProtectionWarning(null),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						onClick: (e) => e.stopPropagation(),
						className: "w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-bold text-white",
								children: "Platform Protection Warning"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs leading-relaxed text-zinc-400",
								children: "For escrow protection, secure payouts, and valid tax invoices, please use official In-App Sponsorship deals. Direct off-platform payments are not protected."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 flex flex-col gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => {
										setProtectionWarning(null);
										navigate({ to: "/wallet" });
									},
									className: "w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground",
									children: "Create Official Sponsorship Deal"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => {
										const text = protectionWarning;
										setProtectionWarning(null);
										doSend(text);
									},
									className: "w-full rounded-xl border border-zinc-700 px-4 py-2.5 text-xs font-semibold text-zinc-300",
									children: "Proceed Anyway"
								})]
							})
						]
					})
				}),
				selectMode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: exitSelectMode,
							className: "text-xs font-semibold text-zinc-300",
							children: "Cancel"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs font-bold text-white",
							children: [selectedIds.length, " selected"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => {
								deleteIds(selectedIds);
								setSelectMode(false);
							},
							disabled: selectedIds.length === 0,
							className: `text-xs font-bold flex items-center gap-1 ${selectedIds.length ? "text-red-400" : "text-zinc-600"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 15 }), " Delete"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					ref: scrollRef,
					onScroll: onScrollMessages,
					className: "relative flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] p-4 space-y-3.5 bg-zinc-950/50",
					onClick: () => setShowOptionsMenu(false),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserWatermark, {
							username: currentUser.username,
							className: "fixed text-white"
						}),
						loadingMore ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "py-1 text-center text-[11px] text-zinc-500",
							children: "Loading older messages…"
						}) : null,
						messagesLoading && messages.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-3.5",
							"aria-hidden": true,
							children: [
								0,
								1,
								2,
								3,
								4,
								5
							].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `flex ${i % 2 ? "justify-end" : "justify-start"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-10 animate-pulse rounded-2xl bg-gradient-to-r from-zinc-800/70 via-zinc-700/60 to-zinc-800/70 bg-[length:200%_100%]",
									style: { width: `${45 + i * 37 % 30}%` }
								})
							}, i))
						}),
						messages.map((m) => m.system ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mx-auto w-fit rounded-full bg-zinc-800/70 px-3 py-1 text-center text-[11px] text-zinc-400",
							children: m.text
						}, m.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							onPointerDown: () => !selectMode && startLongPress(m.id),
							onPointerUp: cancelLongPress,
							onPointerLeave: cancelLongPress,
							onContextMenu: (e) => {
								e.preventDefault();
								if (!selectMode) setActionSheetId(m.id);
							},
							onClick: () => selectMode && toggleSelect(m.id),
							className: `flex flex-col ${m.sender === "me" ? "items-end" : "items-start"} ${selectMode && selectedIds.includes(m.id) ? "rounded-2xl bg-purple-500/10 ring-1 ring-purple-500/40" : ""} ${selectMode ? "cursor-pointer select-none px-1 py-1" : ""}`,
							children: [
								selectMode && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `mb-1 flex h-4 w-4 items-center justify-center rounded-full border ${selectedIds.includes(m.id) ? "border-purple-500 bg-purple-600 text-white" : "border-zinc-600"}`,
									children: selectedIds.includes(m.id) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 11 })
								}),
								m.text && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.sender === "me" ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-xs" : "bg-zinc-800/90 text-zinc-100 rounded-bl-xs border border-zinc-700/50"}`,
									children: m.text
								}),
								m.image && m.viewOnce && m.sender === "them" && !m.opened && !openedOnce.includes(m.id) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => {
										setViewOnceOpen({
											id: m.id,
											url: m.image
										});
									},
									className: "max-w-[75%] flex items-center gap-2 rounded-2xl border border-emerald-600/60 bg-emerald-950/30 px-4 py-3 text-xs font-bold text-emerald-400",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "w-5 h-5 rounded-full border border-emerald-500 flex items-center justify-center",
										children: "1"
									}), "Tap to view once"]
								}) : m.image && !(m.viewOnce && (m.opened || openedOnce.includes(m.id))) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "max-w-[75%] rounded-2xl overflow-hidden border border-zinc-800 shadow-lg",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyImage, {
										src: m.image,
										alt: "Attachment",
										wrapperClassName: "w-full",
										className: "w-full h-auto object-cover max-h-60"
									})
								}) : null,
								m.viewOnce && m.sender === "them" && (m.opened || openedOnce.includes(m.id)) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "max-w-[75%] flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-800/70 px-4 py-3 text-xs font-semibold text-zinc-400",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { size: 15 }), " Opened"]
								}),
								m.audio && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `flex items-center gap-3 px-4 py-3 rounded-2xl min-w-[200px] ${m.sender === "me" ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : "bg-zinc-800 text-white border border-zinc-700"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => {
											const aud = new Audio(m.audio);
											if (playingAudioId === m.id) setPlayingAudioId(null);
											else {
												setPlayingAudioId(m.id);
												aud.play();
												aud.onended = () => setPlayingAudioId(null);
											}
										},
										className: "p-2 bg-white/20 rounded-full",
										children: playingAudioId === m.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { size: 16 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { size: 16 })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1 flex flex-col gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-full h-1 bg-white/40 rounded-full overflow-hidden",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `h-full bg-white ${playingAudioId === m.id ? "w-2/3 animate-pulse" : "w-0"}` })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] opacity-80",
											children: "Voice Note"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-[10px] text-zinc-500 mt-1 px-1 flex items-center gap-1",
									children: [m.time, m.sender === "me" && (m.local ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
										size: 12,
										className: "text-zinc-500"
									}) : m.read ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCheck, {
										size: 12,
										className: "text-sky-400"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCheck, {
										size: 12,
										className: "text-zinc-500"
									}))]
								})
							]
						}, m.id)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: messagesEndRef })
					]
				}),
				actionSheetId !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "fixed inset-0 z-[60] flex items-end bg-black/60 backdrop-blur-sm",
					onClick: () => setActionSheetId(null),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "w-full rounded-t-3xl border-t border-zinc-800 bg-zinc-900 p-3 pb-6",
						onClick: (e) => e.stopPropagation(),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => {
									deleteIds([actionSheetId]);
									setActionSheetId(null);
								},
								className: "w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-950/40",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 18 }), " Delete Message"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => {
									setSelectMode(true);
									setSelectedIds([actionSheetId]);
									setActionSheetId(null);
								},
								className: "w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCheck, { size: 18 }), " Select Multiple"]
							})
						]
					})
				}),
				showEmojis && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-2 p-3 bg-zinc-900 border-t border-zinc-800 overflow-x-auto",
					children: EMOJIS.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setMessage((prev) => prev + e),
						className: "text-2xl p-2 hover:bg-zinc-800 rounded-xl",
						children: e
					}, e))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "p-3 bg-zinc-950/95 border-t border-zinc-800/80 backdrop-blur-md flex items-center gap-2 shrink-0",
					children: blocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex-1 text-center text-xs font-semibold text-zinc-500 py-2",
						children: [
							"You blocked ",
							displayName,
							". Unblock from the menu to message."
						]
					}) : isRecording ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 flex items-center justify-between bg-red-950/40 border border-red-500/50 rounded-full px-4 py-2 text-red-400",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs font-mono font-bold",
								children: [
									"Recording ",
									recordingTime,
									"s"
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: stopRecording,
							className: "p-1.5 bg-red-600 text-white rounded-full text-xs font-bold",
							children: "Send"
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => fileInputRef.current?.click(),
							className: "p-2 text-zinc-400 hover:text-white",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image$1, { size: 22 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: startRecording,
							className: "p-2 text-zinc-400 hover:text-white",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { size: 22 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 relative flex items-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": "Open camera",
									className: "w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white mr-2 shrink-0",
									onClick: () => cameraInputRef.current?.click(),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 18 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									value: message,
									onChange: (e) => {
										setMessage(e.target.value);
										setTyping(e.target.value.trim().length > 0);
									},
									onBlur: () => setTyping(false),
									onKeyDown: (e) => {
										if (e.key === "Enter") {
											setTyping(false);
											handleSend();
										}
									},
									placeholder: "Message...",
									className: "w-full bg-zinc-900 border border-zinc-800 rounded-full py-2.5 pl-4 pr-10 text-sm text-white focus:outline-none"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setShowEmojis(!showEmojis),
									className: "absolute right-3 text-zinc-400 hover:text-white",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smile, { size: 18 })
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: handleSend,
							className: `p-2.5 rounded-full flex items-center justify-center ${message.trim() ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white" : "bg-zinc-800 text-zinc-500 cursor-not-allowed"}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { size: 18 })
						})
					] })
				})
			]
		}),
		viewOnceOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "fixed inset-0 z-[95] bg-black flex flex-col",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between p-4 text-white",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-xs font-bold text-emerald-400 flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { size: 14 }), " View once"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => {
						setViewOnceOpen(null);
					},
					className: "p-2 bg-zinc-800/80 rounded-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 20 })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex-1 flex items-center justify-center p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyImage, {
					src: viewOnceOpen.url,
					alt: "View once",
					loading: "eager",
					onLoad: () => {
						const openedId = viewOnceOpen.id;
						setOpenedOnce((prev) => prev.includes(openedId) ? prev : [...prev, openedId]);
						burnMedia(openedId);
					},
					wrapperClassName: "max-h-full max-w-full",
					className: "max-h-full max-w-full object-contain rounded-lg"
				})
			})]
		}),
		selectedImage && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "fixed inset-0 bg-black z-50 flex flex-col justify-between p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between text-white pt-2 px-2 z-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: handleClosePreview,
						className: "p-2 bg-zinc-800/80 rounded-full hover:bg-zinc-700",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 20 })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setIsHD(!isHD),
								className: `px-2 py-0.5 text-xs font-bold border rounded transition-all ${isHD ? "border-emerald-500 text-emerald-400 bg-emerald-950/40" : "border-zinc-600 text-zinc-400"}`,
								children: "HD"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setShowFilters(!showFilters),
								className: `p-2 rounded-full transition-all ${showFilters ? "bg-emerald-500 text-black" : "bg-zinc-800/80 text-zinc-200"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 18 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setActiveTool((t) => t === "crop" ? null : "crop");
									setCropRect(null);
								},
								className: `p-2 rounded-full transition-all ${activeTool === "crop" ? "bg-emerald-500 text-black" : "bg-zinc-800/80 text-zinc-300"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crop, { size: 18 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setActiveTool((t) => t === "emoji" ? null : "emoji"),
								className: `p-2 rounded-full transition-all ${activeTool === "emoji" ? "bg-emerald-500 text-black" : "bg-zinc-800/80 text-zinc-300"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smile, { size: 18 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setActiveTool((t) => t === "text" ? null : "text"),
								className: `p-2 rounded-full transition-all ${activeTool === "text" ? "bg-emerald-500 text-black" : "bg-zinc-800/80 text-zinc-300"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Type, { size: 18 })
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					ref: imageBoxRef,
					className: "flex-1 flex items-center justify-center my-2 overflow-hidden relative touch-none",
					onPointerDown: (e) => {
						if (activeTool !== "crop") return;
						const r = imageBoxRef.current.getBoundingClientRect();
						cropStart.current = {
							x: (e.clientX - r.left) / r.width,
							y: (e.clientY - r.top) / r.height
						};
						setCropRect({
							x: cropStart.current.x,
							y: cropStart.current.y,
							w: 0,
							h: 0
						});
					},
					onPointerMove: (e) => {
						const r = imageBoxRef.current.getBoundingClientRect();
						const nx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
						const ny = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
						if (activeTool === "crop" && cropStart.current) {
							const s = cropStart.current;
							setCropRect({
								x: Math.min(s.x, nx),
								y: Math.min(s.y, ny),
								w: Math.abs(nx - s.x),
								h: Math.abs(ny - s.y)
							});
							return;
						}
						if (dragId.current) {
							const id = dragId.current;
							setOverlays((prev) => prev.map((o) => o.id === id ? {
								...o,
								x: nx,
								y: ny
							} : o));
						}
					},
					onPointerUp: () => {
						cropStart.current = null;
						dragId.current = null;
					},
					onPointerLeave: () => {
						cropStart.current = null;
						dragId.current = null;
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: selectedImage,
							alt: "Preview",
							draggable: false,
							className: `max-h-full max-w-full object-contain rounded-lg transition-all duration-300 ${filters.find((f) => f.id === selectedFilter)?.class || ""}`
						}),
						overlays.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onPointerDown: (e) => {
								e.stopPropagation();
								dragId.current = o.id;
							},
							onDoubleClick: () => setOverlays((prev) => prev.filter((x) => x.id !== o.id)),
							style: {
								left: `${o.x * 100}%`,
								top: `${o.y * 100}%`,
								color: o.color,
								fontSize: `${o.size * 4}px`,
								textShadow: o.kind === "text" ? "0 1px 4px rgba(0,0,0,0.7)" : void 0
							},
							className: "absolute -translate-x-1/2 -translate-y-1/2 font-bold leading-none cursor-move select-none touch-none",
							children: o.value
						}, o.id)),
						activeTool === "crop" && cropRect && cropRect.w > .02 && cropRect.h > .02 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute border-2 border-emerald-400 bg-emerald-400/10 pointer-events-none",
							style: {
								left: `${cropRect.x * 100}%`,
								top: `${cropRect.y * 100}%`,
								width: `${cropRect.w * 100}%`,
								height: `${cropRect.h * 100}%`
							}
						})
					]
				}),
				activeTool === "crop" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-center gap-3 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[11px] text-zinc-400",
						children: "Drag on the photo to select an area"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: !cropRect || cropRect.w < .02 || cropRect.h < .02,
						onClick: async () => {
							if (!selectedImage || !cropRect) return;
							const next = await cropImage(selectedImage, cropRect);
							setSelectedImage(next);
							setCropRect(null);
							setActiveTool(null);
						},
						className: "px-4 py-1.5 rounded-full bg-emerald-500 text-black text-xs font-bold disabled:bg-zinc-800 disabled:text-zinc-500",
						children: "Apply crop"
					})]
				}),
				activeTool === "emoji" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-2 overflow-x-auto py-2 px-1 no-scrollbar",
					children: STICKER_EMOJIS.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setOverlays((prev) => [...prev, {
							id: `o-${Date.now()}-${Math.random()}`,
							kind: "emoji",
							value: e,
							x: .5,
							y: .5,
							color: "#fff",
							size: 10
						}]),
						className: "text-2xl p-2 bg-zinc-800 rounded-xl shrink-0",
						children: e
					}, e))
				}),
				activeTool === "text" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2 py-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								value: textDraft,
								onChange: (ev) => setTextDraft(ev.target.value),
								placeholder: "Type text...",
								style: { color: textColor },
								className: "flex-1 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-2 text-sm font-bold focus:outline-none"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									if (!textDraft.trim()) return;
									setOverlays((prev) => [...prev, {
										id: `o-${Date.now()}-${Math.random()}`,
										kind: "text",
										value: textDraft.trim(),
										x: .5,
										y: .4,
										color: textColor,
										size: 8
									}]);
									setTextDraft("");
								},
								className: "px-4 py-2 rounded-full bg-emerald-500 text-black text-xs font-bold",
								children: "Add"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-2 px-1",
							children: TEXT_COLORS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setTextColor(c),
								style: { background: c },
								className: `w-6 h-6 rounded-full border-2 ${textColor === c ? "border-emerald-400 scale-110" : "border-zinc-700"}`
							}, c))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] text-zinc-500 px-1",
							children: "Drag overlays to move, double-tap to remove."
						})
					]
				}),
				showFilters && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-2 overflow-x-auto py-2 px-1 my-1 no-scrollbar justify-start sm:justify-center",
					children: filters.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setSelectedFilter(f.id),
						className: `px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedFilter === f.id ? "bg-emerald-500 text-black font-bold scale-105" : "bg-zinc-800 text-zinc-300 border border-zinc-700"}`,
						children: f.name
					}, f.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 pb-2 z-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center bg-zinc-900 border border-zinc-700/80 rounded-full px-4 py-2 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image$1, {
								size: 18,
								className: "text-zinc-400"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								placeholder: "Add a caption...",
								value: caption,
								onChange: (e) => setCaption(e.target.value),
								className: "bg-transparent text-white text-sm flex-1 focus:outline-none"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setIsViewOnce(!isViewOnce),
								className: `w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${isViewOnce ? "bg-emerald-500 text-black scale-110 shadow-lg shadow-emerald-500/30" : "bg-zinc-800 text-white border border-zinc-600"}`,
								children: "1"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center justify-end px-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: async () => {
								if (!selectedImage) return;
								const filterCss = filters.find((f) => f.id === selectedFilter)?.css ?? "none";
								const finalImage = await renderPhoto(selectedImage, filterCss, overlays);
								if (currentUserId) sendToDb({
									media_url: finalImage,
									media_type: isViewOnce ? "image_once" : "image",
									content: caption
								});
								else pushLocal({
									image: finalImage,
									text: caption || void 0,
									sender: "me",
									viewOnce: isViewOnce
								});
								handleClosePreview();
							},
							className: "w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
								size: 20,
								className: "ml-0.5"
							})
						})
					})]
				})
			]
		}),
		nameDialogOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-6",
			onClick: () => setNameDialogOpen(false),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-xs rounded-2xl border border-zinc-800 bg-zinc-900 p-4",
				onClick: (e) => e.stopPropagation(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 text-sm font-semibold text-white",
						children: "Change Display Name"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						autoFocus: true,
						value: nameDraft,
						onChange: (e) => setNameDraft(e.target.value),
						placeholder: "Display name",
						className: "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex justify-end gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "rounded-xl px-3 py-2 text-sm text-zinc-400",
							onClick: () => setNameDialogOpen(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white",
							onClick: () => {
								const next = nameDraft.trim();
								if (next) {
									setDisplayName(next);
									pushSystem(`Display name changed to ${next}`);
								}
								setNameDialogOpen(false);
							},
							children: "Save"
						})]
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PinDialog, {
			open: pinMode !== null,
			title: pinMode === "remove" ? "Remove Secret Lock" : "Create chat PIN",
			description: pinMode === "remove" ? "Enter the PIN for this chat to remove the lock." : "Choose a 4-8 digit PIN. You'll need it to open this chat.",
			confirmLabel: pinMode === "remove" ? "Remove" : "Lock chat",
			error: pinError,
			onCancel: () => {
				setPinMode(null);
				setPinError(null);
			},
			onSubmit: (pin) => void submitPin(pin)
		})
	] });
}
var $$splitComponentImporter = () => import("./orbit.chat._userId-M5evdGEh.mjs");
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
export { useSocialPosts as $, NOTIFICATION_KINDS as A, useFollowList as B, COUNTRIES as C, useAuth as D, useSearch as E, useDoubleTapLike as F, getLocalMedia as G, cacheGet as H, useYw as I, resolveMediaUrl as J, publishPost as K, isRealUserId as L, kindMeta as M, timeAgo as N, aiFilterCss as O, useNotifications as P, usePostComments as Q, setFollow as R, CHANNEL_CATEGORIES as S, useChannel as T, cacheSet as U, cn as V, dmThreadId as W, timeAgo$1 as X, resolveThreadPeer as Y, uploadWithProgress as Z, Route$4 as _, useSecretChats as a, useUploads as b, useChatNames as c, formatCount as d, loadCachedThread as et, hashtags as f, UserWatermark as g, compressImageFile as h, saveSecretChatLock as i, ORBIT_KINDS as j, useMoments as k, byId as l, useCaptureDetect as m, Route as n, ORBIT_KEY as nt, saveChatDisplayName as o, suggestedUsers as p, rememberLocalMedia as q, PinDialog as r, notifyOrbitPrefsChanged as rt, setChatNameLocal as s, router_exports as t, saveCachedThread as tt, currentUser as u, Route$5 as v, emptyChannel as w, useCall as x, Route$12 as y, useFollowCounts as z };
