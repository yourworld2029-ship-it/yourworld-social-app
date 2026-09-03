import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _t as STORAGE_BUCKETS, gt as writeCompat, q as normalizePostRow, w as resolveMediaUrl } from "./router-DICQhfH7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-data-c5wOg2Ub.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var empty = {
	id: "",
	username: "",
	display_name: "",
	bio: "",
	category: "",
	location: "",
	website: "",
	avatar_url: null,
	cover_url: null
};
async function signedIfNeeded(url) {
	if (!url) return null;
	return resolveMediaUrl(url, "avatars");
}
/** Real signed-in profile: row from the database plus the user's own media. */
function useMyProfile() {
	const [userId, setUserId] = (0, import_react.useState)(null);
	const [profile, setProfile] = (0, import_react.useState)(empty);
	const [avatarSrc, setAvatarSrc] = (0, import_react.useState)(null);
	const [coverSrc, setCoverSrc] = (0, import_react.useState)(null);
	const [posts, setPosts] = (0, import_react.useState)([]);
	const [savedPosts, setSavedPosts] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const load = (0, import_react.useCallback)(async () => {
		const { data: sessionData } = await supabase.auth.getSession();
		const uid = sessionData.session?.user.id ?? null;
		setUserId(uid);
		if (!uid) {
			setProfile(empty);
			setPosts([]);
			setSavedPosts([]);
			setLoading(false);
			return;
		}
		const [{ data: row }, { data: myPosts }, { data: saves }] = await Promise.all([
			supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
			supabase.from("posts").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(100),
			supabase.from("post_saves").select("post_id").eq("user_id", uid)
		]);
		const savedIds = (saves ?? []).map((s) => s.post_id);
		const savedResult = savedIds.length ? await supabase.from("posts").select("*").in("id", savedIds).limit(200) : {
			data: [],
			error: null
		};
		const email = sessionData.session?.user.email ?? "";
		const next = {
			id: uid,
			username: row?.username ?? email.split("@")[0] ?? `user${uid.slice(0, 4)}`,
			display_name: row?.display_name ?? row?.username ?? "YourWorld user",
			bio: row?.bio ?? "",
			category: row?.category ?? "",
			location: row?.location ?? "",
			website: row?.website ?? "",
			avatar_url: row?.avatar_url ?? null,
			cover_url: row?.cover_url ?? null
		};
		setProfile(next);
		setPosts((myPosts ?? []).map(normalizePostRow));
		setSavedPosts((savedResult.data ?? []).map(normalizePostRow).filter((post) => post.kind === "video" || post.kind === "reel"));
		setAvatarSrc(await signedIfNeeded(next.avatar_url));
		setCoverSrc(await signedIfNeeded(next.cover_url));
		setLoading(false);
	}, []);
	(0, import_react.useEffect)(() => {
		load();
		const { data: sub } = supabase.auth.onAuthStateChange(() => void load());
		return () => sub.subscription.unsubscribe();
	}, [load]);
	const uploadImage = (0, import_react.useCallback)(async (file, kind, uid) => {
		const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
		const path = `${uid}/${kind}-${Date.now()}.${ext}`;
		const { error } = await supabase.storage.from("avatars").upload(path, file, {
			contentType: file.type || "image/jpeg",
			upsert: true
		});
		if (error) {
			console.error("Profile image upload failed", error);
			throw new Error(error.message);
		}
		return path;
	}, []);
	const save = (0, import_react.useCallback)(async (edit) => {
		const { data: sessionData } = await supabase.auth.getSession();
		const uid = sessionData.session?.user.id;
		if (!uid) throw new Error("Sign in to update your profile");
		let avatarPath = profile.avatar_url;
		let coverPath = profile.cover_url;
		if (edit.avatarFile) avatarPath = await uploadImage(edit.avatarFile, "avatar", uid);
		if (edit.coverFile) coverPath = await uploadImage(edit.coverFile, "cover", uid);
		const { error } = await writeCompat((payload) => supabase.from("profiles").upsert(payload, { onConflict: "id" }), {
			id: uid,
			username: edit.username || null,
			display_name: edit.name || null,
			bio: edit.bio || null,
			category: edit.category || null,
			location: edit.location || null,
			website: edit.website || null,
			avatar_url: avatarPath,
			cover_url: coverPath
		});
		if (error) {
			console.error("Profile update failed", error);
			throw new Error(error.message);
		}
		await load();
	}, [
		profile.avatar_url,
		profile.cover_url,
		uploadImage,
		load
	]);
	return {
		userId,
		profile,
		avatarSrc,
		coverSrc,
		posts,
		savedPosts,
		grid: (0, import_react.useMemo)(() => posts.filter((p) => p.kind === "video" || p.kind !== "reel" && p.media_type?.startsWith("video")), [posts]),
		reels: (0, import_react.useMemo)(() => posts.filter((p) => p.kind === "reel"), [posts]),
		loading,
		save,
		reload: load
	};
}
/** Update a post/reel you own (caption, hashtags, location, download flag). */
async function updateMyPost(postId, patch) {
	const next = {};
	if (patch.title !== void 0) next.title = patch.title.trim();
	if (patch.caption !== void 0) {
		next.caption = patch.caption;
		next.hashtags = Array.from(new Set((patch.caption.match(/#[\p{L}\p{N}_]+/gu) ?? []).map((h) => h.slice(1))));
	}
	if (patch.location !== void 0) next.location = patch.location;
	if (patch.allow_download !== void 0) next.allow_download = patch.allow_download;
	if (patch.hide_like_count !== void 0) next.hide_like_count = patch.hide_like_count;
	if (patch.hide_share_count !== void 0) next.hide_share_count = patch.hide_share_count;
	if (patch.comments_off !== void 0) next.comments_off = patch.comments_off;
	if (patch.pinned !== void 0) next.pinned = patch.pinned;
	if (patch.archived !== void 0) next.archived = patch.archived;
	const { error } = await supabase.from("posts").update(next).eq("id", postId);
	if (error) {
		console.error("Post update failed", error);
		throw new Error(error.message);
	}
}
/** Permanently delete a post/reel you own, plus its stored media file. */
async function deleteMyPost(post) {
	const bucket = post.kind === "reel" ? STORAGE_BUCKETS.reels : STORAGE_BUCKETS.videos;
	const url = post.media_url ?? "";
	if (url && !/^(blob:|data:)/.test(url)) {
		const path = /^https?:/.test(url) ? url.match(new RegExp(`/storage/v1/object/(?:sign|public)/${bucket}/([^?]+)`))?.[1] : url.replace(/^\/+/, "");
		if (path) {
			const { error: storageError } = await supabase.storage.from(bucket).remove([decodeURIComponent(path)]);
			if (storageError) console.error(`Failed to remove media from ${bucket}`, storageError);
		}
	}
	const { error } = await supabase.from("posts").delete().eq("id", post.id);
	if (error) {
		console.error("Post deletion failed", error);
		throw new Error(error.message);
	}
}
/** Resolves a stored media reference to something an <img> can render. */
function useResolvedMedia(urls, bucket = "reels") {
	const [map, setMap] = (0, import_react.useState)({});
	const key = urls.join("|");
	(0, import_react.useEffect)(() => {
		let alive = true;
		Promise.all(urls.map(async (u) => [u, await resolveMediaUrl(u, bucket)])).then((pairs) => {
			if (alive) setMap(Object.fromEntries(pairs));
		});
		return () => {
			alive = false;
		};
	}, [key, bucket]);
	return map;
}
//#endregion
export { useResolvedMedia as i, updateMyPost as n, useMyProfile as r, deleteMyPost as t };
