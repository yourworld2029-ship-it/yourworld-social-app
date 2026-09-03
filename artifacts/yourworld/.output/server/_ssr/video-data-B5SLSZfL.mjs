import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { M as missingColumn, N as normalizePostRow, S as rememberLocalMedia, et as postKind, it as uploadWithProgress, nt as STORAGE_BUCKETS, tt as writeCompat, w as resolveMediaUrl, y as getLocalMedia } from "./router-BjFN5xak.mjs";
import { r as createServerFn } from "./server-BfEtEjqm.mjs";
import { i as stringType, n as booleanType, r as objectType, t as arrayType } from "../_libs/zod.mjs";
import { t as createSsrRpc } from "./createSsrRpc-BjT2FPBA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/video-data-B5SLSZfL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
/** Samples a few JPEG frames from a local video URL for automated content scanning. */
async function sampleVideoFrames(src, count = 3) {
	if (typeof document === "undefined" || !src) return [];
	const video = document.createElement("video");
	video.src = src;
	video.muted = true;
	video.playsInline = true;
	video.crossOrigin = "anonymous";
	video.preload = "auto";
	if (!await new Promise((resolve) => {
		const done = (ok) => resolve(ok);
		video.onloadedmetadata = () => done(true);
		video.onerror = () => done(false);
		setTimeout(() => done(false), 8e3);
	}) || !isFinite(video.duration) || video.duration <= 0) return [];
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
			const onSeeked = () => {
				video.removeEventListener("seeked", onSeeked);
				resolve(true);
			};
			video.addEventListener("seeked", onSeeked);
			try {
				video.currentTime = Math.min(t, Math.max(0, video.duration - .1));
			} catch {
				resolve(false);
			}
			setTimeout(() => resolve(false), 6e3);
		})) break;
		try {
			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
			const base64 = canvas.toDataURL("image/jpeg", .6).split(",")[1];
			if (base64) frames.push(base64);
		} catch {
			break;
		}
	}
	video.src = "";
	video.load();
	return frames;
}
var schema = objectType({
	title: stringType().trim().max(300).default(""),
	description: stringType().trim().max(4e3).default(""),
	tags: arrayType(stringType().max(60)).max(30).default([]),
	paidPromotion: booleanType().default(false),
	/** Up to 3 base64 JPEG frames sampled from the video (no data: prefix). */
	frames: arrayType(stringType().max(4e6)).max(3).default([])
});
/** Scans a video's sampled frames + metadata with Gemini before it is published. */
var scanVideoContent = createServerFn({ method: "POST" }).validator((data) => schema.parse(data)).handler(createSsrRpc("b7569d16e2c715517e1807b35b3080d925733e31ad9f310c9701eeb3c4597e99"));
var VIDEO_CATEGORIES = [
	"Vlog",
	"Podcast",
	"Tutorial",
	"Tech",
	"Gaming",
	"Music",
	"Travel",
	"Fitness",
	"Comedy",
	"Education",
	"News",
	"Food"
];
var formatDuration = (s) => {
	if (!s || s < 0) return "0:00";
	const h = Math.floor(s / 3600);
	const m = Math.floor(s % 3600 / 60);
	const sec = Math.floor(s % 60);
	return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
};
var formatViews = (n) => n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M views` : n >= 1e3 ? `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K views` : `${n} ${n === 1 ? "view" : "views"}`;
/** Start a server-timed session after the player begins authenticated playback. */
async function startVideoWatchSession(postId, client = supabase) {
	if (!postId) return {
		sessionId: null,
		error: null
	};
	const { data, error } = await client.rpc("start_video_watch_session", { _post_id: postId });
	return {
		sessionId: data ?? null,
		error: error?.message ?? null
	};
}
/** Ask the server to credit only elapsed time observed for this session. */
async function recordVideoWatchHeartbeat(sessionId, client = supabase) {
	if (!sessionId) return {
		creditedSeconds: 0,
		error: null
	};
	const { data, error } = await client.rpc("record_video_watch_heartbeat", { _session_id: sessionId });
	return {
		creditedSeconds: typeof data === "number" ? data : 0,
		error: error?.message ?? null
	};
}
/**
* Buffers small playback deltas and periodically persists them as one event.
* A failed write is put back into the buffer so a transient network error does
* not silently discard watch time.
*/
function useVideoWatchTime(videoId, enabled) {
	const pendingRef = (0, import_react.useRef)(0);
	const flushingRef = (0, import_react.useRef)(false);
	const sessionIdRef = (0, import_react.useRef)(null);
	const startingRef = (0, import_react.useRef)(null);
	const lastActivityAtRef = (0, import_react.useRef)(0);
	const ensureSession = (0, import_react.useCallback)(async () => {
		if (!enabled || !videoId) return null;
		if (sessionIdRef.current) return sessionIdRef.current;
		if (startingRef.current) return startingRef.current;
		startingRef.current = startVideoWatchSession(videoId).then((result) => {
			startingRef.current = null;
			sessionIdRef.current = result.error ? null : result.sessionId;
			return sessionIdRef.current;
		});
		return startingRef.current;
	}, [enabled, videoId]);
	const flush = (0, import_react.useCallback)(async () => {
		if (flushingRef.current || !enabled || !videoId || pendingRef.current < 1) return;
		flushingRef.current = true;
		const sessionId = await ensureSession();
		if (!sessionId) {
			flushingRef.current = false;
			return;
		}
		const playedSeconds = pendingRef.current;
		pendingRef.current = 0;
		const result = await recordVideoWatchHeartbeat(sessionId);
		flushingRef.current = false;
		if (result.error) {
			pendingRef.current += playedSeconds;
			sessionIdRef.current = null;
		}
		if (pendingRef.current >= 10) flush();
	}, [
		enabled,
		ensureSession,
		videoId
	]);
	const report = (0, import_react.useCallback)((seconds) => {
		if (!enabled || !Number.isFinite(seconds) || seconds <= 0) return;
		const now = Date.now();
		if (lastActivityAtRef.current && now - lastActivityAtRef.current > 3e3) {
			sessionIdRef.current = null;
			startingRef.current = null;
			pendingRef.current = 0;
		}
		lastActivityAtRef.current = now;
		pendingRef.current += Math.min(seconds, 10);
		if (!sessionIdRef.current) ensureSession();
		if (pendingRef.current >= 10) flush();
	}, [
		enabled,
		ensureSession,
		flush
	]);
	(0, import_react.useEffect)(() => {
		const flushOnLeave = () => void flush();
		window.addEventListener("pagehide", flushOnLeave);
		document.addEventListener("visibilitychange", flushOnLeave);
		return () => {
			window.removeEventListener("pagehide", flushOnLeave);
			document.removeEventListener("visibilitychange", flushOnLeave);
			flush();
		};
	}, [flush]);
	return report;
}
/**
* Long videos are stored with durable signed URLs. Keep those URLs intact:
* attempting to re-sign them as an anonymous viewer is masked by Supabase as
* "not found", and a generated public URL cannot read the private bucket.
*/
async function resolveLongVideoUrl(url) {
	if (!url) return url;
	const local = getLocalMedia(url);
	if (local) return local;
	if (/^(https?:|blob:|data:)/.test(url)) return url;
	return resolveMediaUrl(url, STORAGE_BUCKETS.videos);
}
async function uploadToStorage(blobUrl, uid, ext, fallbackType, onProgress) {
	try {
		const blob = await (await fetch(blobUrl)).blob();
		const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
		const { url } = await uploadWithProgress(STORAGE_BUCKETS.videos, path, blob, blob.type || fallbackType, onProgress);
		return url;
	} catch (error) {
		console.error("Video storage upload failed", error);
		return null;
	}
}
/** Uploads a long-form video (and optional custom thumbnail) and stores the post. */
var BRAND_PROMO_HINTS = [
	"sponsored by",
	"paid partnership",
	"brand deal",
	"promo code",
	"affiliate link",
	"use my code"
];
async function publishLongVideo(opts) {
	const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
	if (sessionError) {
		console.error("Could not authorize video publishing", sessionError);
		return { error: sessionError.message };
	}
	const uid = sessionData.session?.user.id;
	if (!uid) return { error: "You need to sign in to publish a video." };
	let mediaUrl = opts.fileUrl;
	if (/^(blob:|data:)/.test(mediaUrl)) {
		const up = await uploadToStorage(mediaUrl, uid, "mp4", "video/mp4", (p) => opts.onProgress?.(Math.min(97, Math.round(p * .97))));
		if (!up) return { error: "Video upload failed. Please try again." };
		mediaUrl = up;
	}
	let thumb = opts.thumbnailUrl ?? null;
	if (thumb && /^(blob:|data:)/.test(thumb)) {
		thumb = await uploadToStorage(thumb, uid, "jpg", "image/jpeg");
		if (!thumb) return { error: "Thumbnail upload failed. Please try again." };
	}
	let scan = null;
	try {
		const frames = await sampleVideoFrames(opts.fileUrl, 3);
		scan = await scanVideoContent({ data: {
			title: opts.title ?? "",
			description: opts.description ?? "",
			tags: opts.tags ?? [],
			paidPromotion: !!opts.paidPromotion,
			frames
		} });
	} catch {
		scan = null;
	}
	if (scan?.decision === "block") return { error: scan.reason || "This video can't be published because it appears to violate our content safety guidelines." };
	const needsReview = !!opts.paidPromotion && !opts.officialSponsorshipId || BRAND_PROMO_HINTS.some((k) => `${opts.title} ${opts.description ?? ""}`.toLowerCase().includes(k)) || scan?.decision === "review" || !!scan?.sponsorship || (scan?.brands?.length ?? 0) > 0;
	let insertError = null;
	try {
		const result = await writeCompat((payload) => supabase.from("posts").insert(payload), {
			user_id: uid,
			kind: "video",
			media_url: mediaUrl,
			media_type: "video",
			title: opts.title.trim(),
			caption: opts.description ?? "",
			hashtags: opts.tags ?? [],
			thumbnail_url: thumb,
			orientation: opts.orientation,
			duration_seconds: opts.durationSeconds ? Math.round(opts.durationSeconds) : null,
			scheduled_at: opts.scheduledAt ?? null,
			paid_promotion: !!opts.paidPromotion,
			review_status: needsReview ? "pending_review" : "approved",
			review_note: needsReview ? "Video under routine compliance check before publishing." : null,
			allow_download: true,
			audience: "everyone",
			tagged_user_ids: [],
			viewer_user_ids: []
		}, { kind: "type" });
		insertError = result.error ? { message: result.error.message ?? "Could not save the video." } : null;
	} catch (error) {
		console.error("Long-video database insert threw unexpectedly", error);
		insertError = { message: error instanceof Error ? error.message : "Could not save the video." };
	}
	opts.onProgress?.(100);
	if (insertError) console.error("Long-video database insert failed", insertError);
	else rememberLocalMedia(mediaUrl, opts.fileUrl);
	return { error: insertError?.message ?? null };
}
/** Live list of published long videos (scheduled ones appear at their release time). */
function useLongVideos() {
	const [videos, setVideos] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [me, setMe] = (0, import_react.useState)(null);
	const load = (0, import_react.useCallback)(async () => {
		const { data: sessionData } = await supabase.auth.getSession();
		const uid = sessionData.session?.user.id ?? null;
		setMe(uid);
		let { data: posts, error } = await supabase.from("posts").select("*").eq("kind", "video").order("created_at", { ascending: false }).limit(30);
		if (missingColumn(error) === "kind") {
			const legacy = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(100);
			posts = (legacy.data ?? []).filter((row) => postKind(row) === "video");
			error = legacy.error;
		}
		if (error || !posts?.length) {
			if (error) console.error("Unable to load videos", error);
			setVideos([]);
			setLoading(false);
			return;
		}
		const now = Date.now();
		const visible = posts.map(normalizePostRow).filter((p) => !p.scheduled_at || new Date(p.scheduled_at).getTime() <= now || uid && p.user_id === uid).filter((p) => p.review_status !== "pending_review" || uid && p.user_id === uid);
		const ids = visible.map((p) => p.id);
		const authorIds = [...new Set(visible.map((p) => p.user_id))];
		const [{ data: profiles }, { data: likes }, { data: comments }] = await Promise.all([
			supabase.rpc("get_public_profiles", { ids: authorIds }),
			supabase.from("post_likes").select("post_id,user_id").in("post_id", ids),
			supabase.from("post_comments").select("post_id").in("post_id", ids)
		]);
		const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
		const next = visible.map((p) => {
			const prof = byId.get(p.user_id);
			const username = prof?.username ?? `user${p.user_id.slice(0, 4)}`;
			const name = prof?.display_name ?? username;
			return {
				id: p.id,
				userId: p.user_id,
				title: p.title || p.caption || "Untitled video",
				caption: p.caption ?? "",
				mediaUrl: p.media_url,
				thumbnailUrl: p.thumbnail_url,
				orientation: p.orientation === "portrait" ? "portrait" : "landscape",
				durationSeconds: p.duration_seconds,
				views: p.views ?? 0,
				hashtags: p.hashtags ?? [],
				createdAt: p.created_at,
				scheduledAt: p.scheduled_at,
				author: {
					name,
					username,
					letter: (name || "Y").charAt(0).toUpperCase()
				},
				likeCount: (likes ?? []).filter((l) => l.post_id === p.id).length,
				commentCount: (comments ?? []).filter((c) => c.post_id === p.id).length,
				likedByMe: !!uid && (likes ?? []).some((l) => l.post_id === p.id && l.user_id === uid)
			};
		});
		setVideos(next);
		setLoading(false);
	}, []);
	(0, import_react.useEffect)(() => {
		load();
		let timer;
		const queue = () => {
			window.clearTimeout(timer);
			timer = window.setTimeout(() => void load(), 500);
		};
		let channel = null;
		const boot = window.setTimeout(() => {
			channel = supabase.channel("long-videos").on("postgres_changes", {
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
	}, [load]);
	const viewedRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	return {
		videos,
		loading,
		currentUserId: me,
		countView: (0, import_react.useCallback)(async (id) => {
			if (viewedRef.current.has(id)) return;
			viewedRef.current.add(id);
			const { data: sessionData } = await supabase.auth.getSession();
			const uid = sessionData.session?.user.id;
			if (!uid) return;
			const { error } = await supabase.from("post_views").insert({
				post_id: id,
				viewer_id: uid
			});
			if (error) return;
			setVideos((prev) => prev.map((v) => v.id === id ? {
				...v,
				views: v.views + 1
			} : v));
		}, []),
		toggleLike: (0, import_react.useCallback)(async (id) => {
			if (!me) throw new Error("Sign in required");
			let wasLiked = false;
			setVideos((prev) => prev.map((v) => {
				if (v.id !== id) return v;
				wasLiked = v.likedByMe;
				return {
					...v,
					likedByMe: !v.likedByMe,
					likeCount: v.likeCount + (v.likedByMe ? -1 : 1)
				};
			}));
			const { error } = wasLiked ? await supabase.from("post_likes").delete().eq("post_id", id).eq("user_id", me) : await supabase.from("post_likes").upsert({
				post_id: id,
				user_id: me
			}, {
				onConflict: "post_id,user_id",
				ignoreDuplicates: true
			});
			if (error) {
				setVideos((prev) => prev.map((v) => v.id === id ? {
					...v,
					likedByMe: wasLiked,
					likeCount: v.likeCount + (wasLiked ? 1 : -1)
				} : v));
				throw error;
			}
		}, [me]),
		reload: load
	};
}
//#endregion
export { resolveLongVideoUrl as a, publishLongVideo as i, formatDuration as n, useLongVideos as o, formatViews as r, useVideoWatchTime as s, VIDEO_CATEGORIES as t };
