import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { F as resolveMediaUrl, _t as STORAGE_BUCKETS, it as writeCompat, nt as normalizePostRow, yt as uploadWithProgress } from "./router-DSPbIB2C.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-data-DYAZp4F3.js
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
	cover_url: null,
	is_verified: false,
	verification_requested: false
};
async function signedIfNeeded(url) {
	if (!url) return null;
	return resolveMediaUrl(url, "avatars");
}
async function requireDocumentOwner(ownerId) {
	const { data, error } = await supabase.auth.getSession();
	if (error) throw new Error(error.message);
	if (data.session?.user.id !== ownerId) throw new Error("Only the document owner can access sports documents.");
}
function evidenceFromPath(path, kind) {
	if (!path) return null;
	return {
		path,
		name: path.split("/").at(-1) || kind,
		mimeType: "application/octet-stream",
		size: null,
		updatedAt: null
	};
}
function emptySportsVerificationDetails(email = "", mobileNumber = "") {
	return {
		villageTown: "",
		district: "",
		state: "",
		country: "India",
		mobileNumber,
		email,
		sportsCertificate: null,
		passportFirstPage: null,
		passportVisaStampPage: null,
		tournamentPhoto: null
	};
}
async function getSportsVerificationDetails(ownerId) {
	await requireDocumentOwner(ownerId);
	const { data: sessionData } = await supabase.auth.getSession();
	const sessionEmail = sessionData.session?.user.email ?? "";
	const sessionMobile = sessionData.session?.user.phone ?? "";
	const { data, error } = await supabase.from("sports_verification_details").select("*").eq("user_id", ownerId).maybeSingle();
	if (error) throw new Error(error.message);
	if (!data) return emptySportsVerificationDetails(sessionEmail, sessionMobile);
	return {
		villageTown: data.village_town ?? "",
		district: data.district ?? "",
		state: data.state ?? "",
		country: data.country || "India",
		mobileNumber: sessionMobile || data.mobile_number || "",
		email: sessionEmail || data.email || "",
		sportsCertificate: evidenceFromPath(data.sports_certificate_path, "sportsCertificate"),
		passportFirstPage: evidenceFromPath(data.passport_first_page_path, "passportFirstPage"),
		passportVisaStampPage: evidenceFromPath(data.passport_visa_stamp_page_path, "passportVisaStampPage"),
		tournamentPhoto: evidenceFromPath(data.tournament_photo_path, "tournamentPhoto")
	};
}
async function saveSportsVerificationDetails(ownerId, details) {
	await requireDocumentOwner(ownerId);
	const { data: sessionData } = await supabase.auth.getSession();
	const sessionEmail = sessionData.session?.user.email ?? "";
	const sessionMobile = sessionData.session?.user.phone ?? "";
	const payload = {
		user_id: ownerId,
		village_town: details.villageTown.trim(),
		district: details.district.trim(),
		state: details.state.trim(),
		country: details.country.trim() || "India",
		mobile_number: sessionMobile || details.mobileNumber.trim(),
		email: sessionEmail || details.email.trim(),
		sports_certificate_path: details.sportsCertificate?.path ?? null,
		passport_first_page_path: details.passportFirstPage?.path ?? null,
		passport_visa_stamp_page_path: details.passportVisaStampPage?.path ?? null,
		tournament_photo_path: details.tournamentPhoto?.path ?? null,
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	};
	const { data, error } = await supabase.from("sports_verification_details").upsert(payload).select("*").single();
	if (error) throw new Error(error.message);
	return {
		villageTown: data.village_town,
		district: data.district,
		state: data.state,
		country: data.country || "India",
		mobileNumber: sessionMobile || data.mobile_number,
		email: sessionEmail || data.email,
		sportsCertificate: evidenceFromPath(data.sports_certificate_path, "sportsCertificate"),
		passportFirstPage: evidenceFromPath(data.passport_first_page_path, "passportFirstPage"),
		passportVisaStampPage: evidenceFromPath(data.passport_visa_stamp_page_path, "passportVisaStampPage"),
		tournamentPhoto: evidenceFromPath(data.tournament_photo_path, "tournamentPhoto")
	};
}
var verificationEvidenceRules = {
	sportsCertificate: {
		allowedTypes: /* @__PURE__ */ new Set([
			"application/pdf",
			"image/jpeg",
			"image/png"
		]),
		maxBytes: 15728640,
		message: "Upload a PDF, JPG, or PNG sports certificate up to 15 MB."
	},
	passportFirstPage: {
		allowedTypes: /* @__PURE__ */ new Set([
			"application/pdf",
			"image/jpeg",
			"image/png"
		]),
		maxBytes: 15728640,
		message: "Upload a PDF, JPG, or PNG passport page up to 15 MB."
	},
	passportVisaStampPage: {
		allowedTypes: /* @__PURE__ */ new Set([
			"application/pdf",
			"image/jpeg",
			"image/png"
		]),
		maxBytes: 15728640,
		message: "Upload a PDF, JPG, or PNG visa/stamp page up to 15 MB."
	},
	tournamentPhoto: {
		allowedTypes: /* @__PURE__ */ new Set([
			"image/jpeg",
			"image/png",
			"image/webp"
		]),
		maxBytes: 15728640,
		message: "Upload a JPG, PNG, or WebP tournament photo up to 15 MB."
	}
};
async function uploadSportsVerificationEvidence(ownerId, kind, file) {
	await requireDocumentOwner(ownerId);
	const rule = verificationEvidenceRules[kind];
	if (!rule.allowedTypes.has(file.type) || file.size > rule.maxBytes) throw new Error(rule.message);
	const name = safeDocumentFileName(file.name);
	const path = `${ownerId}/sports-verification/${kind}/${Date.now()}-${name}`;
	const { error } = await supabase.storage.from(STORAGE_BUCKETS.documents).upload(path, file, {
		cacheControl: "3600",
		contentType: file.type,
		upsert: false
	});
	if (error) throw new Error(error.message);
	return {
		path,
		name,
		mimeType: file.type,
		size: file.size,
		updatedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
}
async function deleteSportsVerificationEvidence(ownerId, path) {
	await requireDocumentOwner(ownerId);
	if (!path.startsWith(`${ownerId}/sports-verification/`) || path.includes("..")) throw new Error("Invalid Sports Verification evidence path.");
	const { error } = await supabase.storage.from(STORAGE_BUCKETS.documents).remove([path]);
	if (error) throw new Error(error.message);
}
async function listSportsDocuments(ownerId) {
	await requireDocumentOwner(ownerId);
	return (await listSportsDocumentFiles(ownerId)).filter((file) => Boolean(file.id && file.name)).map((file) => ({
		path: `${ownerId}/${file.name}`,
		name: file.name,
		mimeType: file.metadata?.mimetype ?? "application/octet-stream",
		size: typeof file.metadata?.size === "number" ? file.metadata.size : null,
		updatedAt: file.updated_at ?? file.created_at ?? null
	}));
}
async function listSportsDocumentFiles(ownerId) {
	const { data, error } = await supabase.storage.from(STORAGE_BUCKETS.documents).list(ownerId, {
		limit: 100,
		sortBy: {
			column: "created_at",
			order: "desc"
		}
	});
	if (error) throw new Error(error.message);
	return data ?? [];
}
function safeDocumentFileName(name) {
	return (name.split(/[\\/]/).at(-1)?.trim() || "certificate").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "certificate";
}
async function uploadSportsDocument(ownerId, file) {
	await requireDocumentOwner(ownerId);
	if (!(/* @__PURE__ */ new Set([
		"application/pdf",
		"image/jpeg",
		"image/png"
	])).has(file.type)) throw new Error("Upload a PDF, JPG, or PNG certificate.");
	if (file.size > 15728640) throw new Error("Certificates must be 15 MB or smaller.");
	const name = safeDocumentFileName(file.name);
	const path = `${ownerId}/${Date.now()}-${name}`;
	const { error } = await supabase.storage.from(STORAGE_BUCKETS.documents).upload(path, file, {
		cacheControl: "3600",
		contentType: file.type,
		upsert: false
	});
	if (error) throw new Error(error.message);
	return {
		path,
		name,
		mimeType: file.type,
		size: file.size,
		updatedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
}
async function createSportsDocumentSignedUrl(ownerId, path) {
	await requireDocumentOwner(ownerId);
	if (!path.startsWith(`${ownerId}/`) || path.includes("..")) throw new Error("Invalid sports document path.");
	const { data, error } = await supabase.storage.from(STORAGE_BUCKETS.documents).createSignedUrl(path, 300);
	if (error || !data?.signedUrl) throw new Error(error?.message ?? "This document is unavailable.");
	return data.signedUrl;
}
async function deleteSportsDocument(ownerId, path) {
	await requireDocumentOwner(ownerId);
	if (!path.startsWith(`${ownerId}/`) || path.includes("..")) throw new Error("Invalid sports document path.");
	const { error } = await supabase.storage.from(STORAGE_BUCKETS.documents).remove([path]);
	if (error) throw new Error(error.message);
}
function safeSportsIntroductionFileName(name) {
	return (name.split(/[\\/]/).at(-1)?.trim() || "sports-introduction").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "sports-introduction";
}
async function validateSportsIntroductionVideo(file) {
	if (!file.type.startsWith("video/")) throw new Error("Upload a video for your Sports Introduction.");
	if (file.size > 104857600) throw new Error("Sports Introduction videos must be 100 MB or smaller.");
	const previewUrl = URL.createObjectURL(file);
	try {
		const metadata = await new Promise((resolve, reject) => {
			const video = document.createElement("video");
			video.preload = "metadata";
			video.onloadedmetadata = () => resolve({
				duration: video.duration,
				width: video.videoWidth,
				height: video.videoHeight
			});
			video.onerror = () => reject(/* @__PURE__ */ new Error("This video could not be read."));
			video.src = previewUrl;
		});
		if (!Number.isFinite(metadata.duration) || metadata.duration <= 0) throw new Error("This video duration could not be read.");
		if (metadata.duration > 90) throw new Error("Sports Introduction videos must be 90 seconds or shorter.");
		if (metadata.width <= 0 || metadata.height <= 0 || metadata.height <= metadata.width) throw new Error("Sports Introduction videos must be vertical.");
	} finally {
		URL.revokeObjectURL(previewUrl);
	}
}
async function uploadSportsIntroduction(ownerId, file, onProgress) {
	await requireDocumentOwner(ownerId);
	await validateSportsIntroductionVideo(file);
	const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
	const path = `${ownerId}/sports-introduction/${Date.now()}-${safeSportsIntroductionFileName(file.name.replace(/\.[^.]+$/, ""))}.${extension}`;
	const result = await uploadWithProgress(STORAGE_BUCKETS.videos, path, file, file.type, onProgress, "86400");
	if (result.error) throw new Error(result.error);
	return path;
}
async function deleteSportsIntroduction(ownerId, path) {
	await requireDocumentOwner(ownerId);
	if (!path.startsWith(`${ownerId}/sports-introduction/`) || path.includes("..")) throw new Error("Invalid Sports Introduction path.");
	const { error } = await supabase.storage.from(STORAGE_BUCKETS.videos).remove([path]);
	if (error) throw new Error(error.message);
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
	const [mediaLoading, setMediaLoading] = (0, import_react.useState)(true);
	const loadInFlight = (0, import_react.useRef)(null);
	const loadedUserId = (0, import_react.useRef)(null);
	const load = (0, import_react.useCallback)(async (force = false) => {
		if (loadInFlight.current) return loadInFlight.current;
		const request = (async () => {
			const { data: sessionData } = await supabase.auth.getSession();
			const uid = sessionData.session?.user.id ?? null;
			if (!force && uid === loadedUserId.current) return;
			setUserId(uid);
			if (!uid) {
				loadedUserId.current = null;
				setProfile(empty);
				setAvatarSrc(null);
				setCoverSrc(null);
				setPosts([]);
				setSavedPosts([]);
				setMediaLoading(false);
				setLoading(false);
				return;
			}
			const { data: row } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
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
				cover_url: row?.cover_url ?? null,
				is_verified: row?.is_verified === true,
				verification_requested: row?.verification_requested === true
			};
			loadedUserId.current = uid;
			setProfile(next);
			setLoading(false);
			setMediaLoading(true);
			Promise.all([signedIfNeeded(next.avatar_url), signedIfNeeded(next.cover_url)]).then(([nextAvatarSrc, nextCoverSrc]) => {
				setAvatarSrc(nextAvatarSrc);
				setCoverSrc(nextCoverSrc);
			});
			const loadSecondary = async () => {
				try {
					const [{ data: myPosts }, { data: saves }] = await Promise.all([supabase.from("posts").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(100), supabase.from("post_saves").select("post_id").eq("user_id", uid)]);
					const savedIds = (saves ?? []).map((s) => s.post_id);
					const savedResult = savedIds.length ? await supabase.from("posts").select("*").in("id", savedIds).limit(200) : {
						data: [],
						error: null
					};
					setPosts((myPosts ?? []).map(normalizePostRow));
					setSavedPosts((savedResult.data ?? []).map(normalizePostRow).filter((post) => post.kind === "video" || post.kind === "reel"));
				} finally {
					setMediaLoading(false);
				}
			};
			loadSecondary();
		})();
		loadInFlight.current = request;
		try {
			await request;
		} finally {
			if (loadInFlight.current === request) loadInFlight.current = null;
		}
	}, []);
	(0, import_react.useEffect)(() => {
		load();
		const { data: sub } = supabase.auth.onAuthStateChange((event) => {
			if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") load();
		});
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
			cover_url: coverPath,
			is_verified: edit.isVerified ?? profile.is_verified,
			verification_requested: edit.verificationRequested ?? profile.verification_requested
		});
		if (error) {
			console.error("Profile update failed", error);
			throw new Error(error.message);
		}
		await load(true);
	}, [
		profile.avatar_url,
		profile.cover_url,
		profile.is_verified,
		profile.verification_requested,
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
		mediaLoading,
		save,
		reload: () => load(true)
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
export { deleteSportsVerificationEvidence as a, saveSportsVerificationDetails as c, uploadSportsIntroduction as d, uploadSportsVerificationEvidence as f, deleteSportsIntroduction as i, updateMyPost as l, useResolvedMedia as m, deleteMyPost as n, getSportsVerificationDetails as o, useMyProfile as p, deleteSportsDocument as r, listSportsDocuments as s, createSportsDocumentSignedUrl as t, uploadSportsDocument as u };
