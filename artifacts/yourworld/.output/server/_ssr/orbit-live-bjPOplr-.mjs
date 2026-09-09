import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/orbit-live-bjPOplr-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
/** Distance is always bucketed so an exact position can never be derived. */
var approxDistance = (km) => {
	if (km < 2) return "Under 2 km away";
	if (km < 5) return "~5 km away";
	if (km < 10) return "~10 km away";
	if (km < 25) return "~25 km away";
	return "50 km+ away";
};
/** Real Orbit profiles loaded from the database, keyed by user id. */
var liveRegistry = /* @__PURE__ */ new Map();
function registerOrbitProfiles(list) {
	for (const p of list) liveRegistry.set(p.id, p);
}
var orbitById = (id) => liveRegistry.get(id);
var ORBIT_PUBLIC_COLUMNS = "user_id,name,age,country,state,city,about,hobbies,looking_for,gender,photos,original_photo_privacy,mood,orbit_enabled,visible,updated_at";
/** Stable pseudo-random number from an id, so hue/distance never jump around. */
function hashOf(id) {
	let h = 0;
	for (let i = 0; i < id.length; i += 1) h = h * 31 + id.charCodeAt(i) >>> 0;
	return h;
}
function rowToOrbitProfile(row) {
	const h = hashOf(row.user_id);
	const photos = Array.isArray(row.photos) ? row.photos : [];
	const gender = row.gender === "Men" ? "Men" : "Women";
	const lookingFor = row.looking_for === "Men" || row.looking_for === "Everyone" ? row.looking_for : "Women";
	return {
		id: row.user_id,
		name: row.name,
		handle: row.name.toLowerCase().replace(/\s+/g, "."),
		age: row.age,
		area: row.city || "Nearby",
		country: row.country,
		state: row.state,
		city: row.city,
		gender,
		lookingFor,
		hobbies: row.hobbies ?? [],
		distanceKm: h % 48 + 1,
		headline: (row.hobbies ?? []).slice(0, 3).join(" · ") || "On Orbit",
		about: row.about,
		interests: row.hobbies ?? [],
		photo: photos.find((m) => m.url && !/^(blob|data):/.test(m.url))?.url ?? "",
		hue: h % 360,
		mood: row.mood ?? void 0
	};
}
async function discoverOrbitRows(ids) {
	const { data, error } = await supabase.rpc("discover_orbit_profiles", { ids: ids ?? null });
	if (!error && data) return data;
	let query = supabase.from("orbit_profiles").select(ORBIT_PUBLIC_COLUMNS).eq("orbit_enabled", true).eq("visible", true);
	if (ids?.length) query = query.in("user_id", ids);
	if (ids && ids.length === 0) return [];
	const fallback = await query;
	if (fallback.error) {
		console.error("[orbit] profile discovery failed", fallback.error);
		return [];
	}
	return fallback.data ?? [];
}
async function fetchOrbitProfileRow(id) {
	return (await discoverOrbitRows([id]))[0] ?? null;
}
function draftToRow(user_id, p, privacy) {
	return {
		user_id,
		name: p.name.trim(),
		age: Number(p.age) || 18,
		country: p.country,
		state: p.state,
		city: p.city,
		about: p.about,
		hobbies: p.hobbies,
		looking_for: p.lookingFor,
		photos: p.photos,
		original_photo_privacy: p.originalPhotoPrivacy,
		mood: p.mood ?? null,
		orbit_enabled: privacy ? privacy.orbitEnabled && !privacy.paused : true,
		visible: privacy ? privacy.visibility !== "hidden" && !privacy.hiddenProfile : true
	};
}
function rowToDraft(row) {
	return {
		name: row.name,
		age: String(row.age),
		country: row.country,
		state: row.state,
		city: row.city,
		about: row.about,
		hobbies: row.hobbies ?? [],
		lookingFor: row.looking_for,
		photos: Array.isArray(row.photos) ? row.photos : [],
		originalPhotoPrivacy: row.original_photo_privacy ?? "matched",
		mood: row.mood ?? null
	};
}
/** Live discovery feed: every other user with Orbit on and a visible profile. */
function useOrbitProfiles() {
	const [profiles, setProfiles] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const load = async () => {
			const { data: auth } = await supabase.auth.getUser();
			const me = auth.user?.id;
			if (cancelled) return;
			const list = (await discoverOrbitRows()).filter((r) => r.user_id !== me).map(rowToOrbitProfile);
			registerOrbitProfiles(list);
			setProfiles(list);
			setLoading(false);
		};
		load();
		let timer = null;
		const reload = () => {
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => void load(), 1e3);
		};
		const channel = supabase.channel("orbit-profiles-feed").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "orbit_profiles"
		}, reload).subscribe();
		return () => {
			cancelled = true;
			if (timer) clearTimeout(timer);
			supabase.removeChannel(channel);
		};
	}, []);
	return {
		profiles,
		loading
	};
}
async function uid() {
	const { data } = await supabase.auth.getUser();
	return data.user?.id ?? null;
}
async function saveOrbitProfileRemote(p, privacy) {
	const id = await uid();
	if (!id) return {
		ok: false,
		reason: "signed-out"
	};
	const { error } = await supabase.from("orbit_profiles").upsert(draftToRow(id, p, privacy), { onConflict: "user_id" });
	if (error) {
		console.error("[orbit] profile save failed", error.message);
		return {
			ok: false,
			reason: "error",
			message: error.message
		};
	}
	return { ok: true };
}
async function saveOrbitPrivacyRemote(privacy) {
	const id = await uid();
	if (!id) return;
	await supabase.from("orbit_settings").upsert({
		user_id: id,
		privacy
	}, { onConflict: "user_id" });
	await supabase.from("orbit_profiles").update({
		orbit_enabled: privacy.orbitEnabled && !privacy.paused,
		visible: privacy.visibility !== "hidden" && !privacy.hiddenProfile
	}).eq("user_id", id);
}
var isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
async function setOrbitLikeRemote(targetId, liked) {
	const id = await uid();
	if (!id) throw new Error("Sign in to continue");
	if (!isUuid(targetId)) throw new Error("Invalid Orbit profile");
	const { error } = liked ? await supabase.from("orbit_likes").upsert({
		user_id: id,
		target_id: targetId
	}, {
		onConflict: "user_id,target_id",
		ignoreDuplicates: true
	}) : await supabase.from("orbit_likes").delete().eq("user_id", id).eq("target_id", targetId);
	if (error) throw error;
}
async function setOrbitConnectionRemote(targetId, connected) {
	const id = await uid();
	if (!id || !isUuid(targetId)) return;
	if (connected) await supabase.from("orbit_connections").upsert({
		requester_id: id,
		addressee_id: targetId,
		status: "accepted"
	}, { onConflict: "requester_id,addressee_id" });
	else await supabase.from("orbit_connections").delete().eq("requester_id", id).eq("addressee_id", targetId);
}
async function sendOrbitChatRequestRemote(targetId, intro) {
	const id = await uid();
	if (!id || !isUuid(targetId)) return null;
	const { data } = await supabase.from("orbit_chat_requests").upsert({
		requester_id: id,
		addressee_id: targetId,
		intro,
		status: "pending"
	}, { onConflict: "requester_id,addressee_id" }).select("id").maybeSingle();
	const requestId = data?.id ?? null;
	if (requestId && intro) await supabase.from("orbit_request_messages").insert({
		request_id: requestId,
		sender_id: id,
		kind: "text",
		text: intro
	});
	return requestId;
}
async function sendOrbitRequestMessageRemote(targetId, msg) {
	const id = await uid();
	if (!id || !isUuid(targetId)) return;
	const { data } = await supabase.from("orbit_chat_requests").select("id").or(`and(requester_id.eq.${id},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${id})`).maybeSingle();
	const requestId = data?.id;
	if (!requestId) return;
	await supabase.from("orbit_request_messages").insert({
		request_id: requestId,
		sender_id: id,
		kind: msg.kind,
		text: msg.text ?? null,
		url: msg.url ?? null
	});
}
async function setOrbitRequestStatusRemote(targetId, status) {
	const id = await uid();
	if (!id || !isUuid(targetId)) return;
	await supabase.from("orbit_chat_requests").update({ status }).or(`and(requester_id.eq.${id},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${id})`);
	if (status === "accepted") await supabase.from("orbit_connections").upsert({
		requester_id: id,
		addressee_id: targetId,
		status: "accepted"
	}, { onConflict: "requester_id,addressee_id" });
}
/** One-shot load of everything the signed-in user has on Orbit. */
async function loadOrbitStateRemote() {
	const id = await uid();
	if (!id) return null;
	const [profileRes, settingsRes, likesRes, connRes, reqRes] = await Promise.all([
		supabase.from("orbit_profiles").select("*").eq("user_id", id).maybeSingle(),
		supabase.from("orbit_settings").select("privacy").eq("user_id", id).maybeSingle(),
		supabase.from("orbit_likes").select("target_id").eq("user_id", id),
		supabase.from("orbit_connections").select("requester_id,addressee_id,status"),
		supabase.from("orbit_chat_requests").select("id,requester_id,addressee_id,intro,status")
	]);
	const liked = {};
	for (const r of likesRes.data ?? []) liked[r.target_id] = true;
	const connected = {};
	for (const c of connRes.data ?? []) {
		if (c.status !== "accepted") continue;
		connected[c.requester_id === id ? c.addressee_id : c.requester_id] = true;
	}
	const rows = reqRes.data ?? [];
	const requests = {};
	if (rows.length) {
		const { data: msgs } = await supabase.from("orbit_request_messages").select("id,request_id,sender_id,kind,text,url").in("request_id", rows.map((r) => r.id)).order("created_at", { ascending: true });
		for (const r of rows) {
			const other = r.requester_id === id ? r.addressee_id : r.requester_id;
			requests[other] = {
				direction: r.requester_id === id ? "outgoing" : "incoming",
				status: r.status,
				intro: r.intro ?? void 0,
				messages: (msgs ?? []).filter((m) => m.request_id === r.id).map((m) => ({
					id: m.id,
					kind: m.kind === "photo" ? "photo" : "text",
					text: m.text ?? void 0,
					url: m.url ?? void 0,
					me: m.sender_id === id
				}))
			};
		}
	}
	const row = profileRes.data;
	return {
		profile: row ? rowToDraft(row) : null,
		privacy: settingsRes.data?.privacy ?? null,
		liked,
		connected,
		requests
	};
}
/** Single Orbit profile by user id — falls back to a direct fetch on deep links. */
function useOrbitProfile(id) {
	const [profile, setProfile] = (0, import_react.useState)(() => orbitById(id));
	const [loading, setLoading] = (0, import_react.useState)(!orbitById(id));
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const known = orbitById(id);
		setProfile(known);
		if (known) {
			setLoading(false);
			return;
		}
		setLoading(true);
		(async () => {
			if (cancelled) return;
			const row = await fetchOrbitProfileRow(id);
			if (cancelled) return;
			if (row) {
				const mapped = rowToOrbitProfile(row);
				registerOrbitProfiles([mapped]);
				setProfile(mapped);
			}
			setLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [id]);
	return {
		profile,
		loading
	};
}
var ORBIT_BUCKET = "orbit-media";
/** Long-lived signed link so profile media renders without extra round trips. */
var ORBIT_SIGN_SECONDS = 15768e4;
/** Blob URLs only exist in this browser tab; Data URLs are persistent fallbacks. */
var isLocalObjectUrl = (url) => url.startsWith("blob:");
/**
* Uploads one Orbit photo/video to storage and returns a durable signed url.
* Returns null when the user is signed out or the upload fails.
*/
async function uploadOrbitMedia(file) {
	const id = await uid();
	if (!id) return null;
	const ext = (file.name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
	const path = `${id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
	const buckets = await orbitBucketCandidates();
	let lastError = "No Orbit storage bucket accepted this upload.";
	for (const bucket of buckets) try {
		const { error } = await supabase.storage.from(bucket).upload(path, file, {
			contentType: file.type || void 0,
			upsert: false
		});
		if (error) {
			lastError = error.message;
			console.error("[orbit] media upload rejected", {
				bucket,
				fileName: file.name,
				fileType: file.type,
				path,
				code: error.name,
				statusCode: error.statusCode,
				message: error.message
			});
			continue;
		}
		const { data, error: signError } = await supabase.storage.from(bucket).createSignedUrl(path, ORBIT_SIGN_SECONDS);
		if (signError || !data?.signedUrl) {
			lastError = signError?.message ?? `Bucket "${bucket}" returned no signed URL.`;
			console.error("[orbit] media signing rejected", {
				bucket,
				fileName: file.name,
				path,
				code: signError?.name,
				statusCode: signError?.statusCode,
				message: lastError
			});
			continue;
		}
		return data.signedUrl;
	} catch (error) {
		lastError = error instanceof Error ? error.message : String(error);
		console.error("[orbit] media upload threw", {
			bucket,
			fileName: file.name,
			fileType: file.type,
			path,
			error
		});
	}
	try {
		const dataUrl = await fileAsDataUrl(file);
		console.warn("[orbit] storage unavailable; using a temporary Data URL fallback", {
			fileName: file.name,
			fileType: file.type,
			attemptedBuckets: buckets,
			lastError
		});
		return dataUrl;
	} catch (error) {
		console.error("[orbit] Data URL fallback failed", {
			fileName: file.name,
			fileType: file.type,
			attemptedBuckets: buckets,
			lastStorageError: lastError,
			error
		});
		return null;
	}
}
var ORBIT_BUCKETS = [
	ORBIT_BUCKET,
	"avatars",
	"media",
	"videos",
	"public"
];
async function orbitBucketCandidates() {
	try {
		const { data, error } = await supabase.storage.listBuckets();
		if (!error && data?.length) {
			const active = new Set(data.map((bucket) => bucket.name));
			const available = ORBIT_BUCKETS.filter((bucket) => active.has(bucket));
			if (available.length) return available;
		}
		if (error) console.warn("[orbit] storage bucket discovery failed; trying configured fallbacks", {
			message: error.message,
			statusCode: error.statusCode
		});
	} catch (error) {
		console.warn("[orbit] storage bucket discovery threw; trying configured fallbacks", error);
	}
	return [...ORBIT_BUCKETS];
}
function fileAsDataUrl(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string" && reader.result) resolve(reader.result);
			else reject(/* @__PURE__ */ new Error("The browser returned an empty media preview."));
		};
		reader.onerror = () => reject(reader.error ?? /* @__PURE__ */ new Error("The browser could not read this file."));
		reader.readAsDataURL(file);
	});
}
/** Client-side metadata check shared by the create and edit Orbit media pickers. */
function isOrbitVideoDurationValid(file) {
	return new Promise((resolve) => {
		const video = document.createElement("video");
		const objectUrl = URL.createObjectURL(file);
		video.preload = "metadata";
		video.src = objectUrl;
		const finish = (valid) => {
			URL.revokeObjectURL(objectUrl);
			video.removeAttribute("src");
			video.load();
			resolve(valid);
		};
		video.onloadedmetadata = () => {
			finish(video.duration >= 1 && video.duration <= 15.5 && Number.isFinite(video.duration));
		};
		video.onerror = () => finish(false);
	});
}
/** Persists only the media array for an already-created profile. */
async function saveOrbitPhotosRemote(photos) {
	const id = await uid();
	if (!id) return;
	const { error } = await supabase.from("orbit_profiles").update({ photos }).eq("user_id", id);
	if (error) console.error("[orbit] media array save failed", {
		userId: id,
		message: error.message,
		code: error.code,
		details: error.details,
		hint: error.hint
	});
}
//#endregion
export { useOrbitProfiles as _, loadOrbitStateRemote as a, saveOrbitPrivacyRemote as c, sendOrbitRequestMessageRemote as d, setOrbitConnectionRemote as f, useOrbitProfile as g, uploadOrbitMedia as h, isOrbitVideoDurationValid as i, saveOrbitProfileRemote as l, setOrbitRequestStatusRemote as m, fetchOrbitProfileRow as n, rowToOrbitProfile as o, setOrbitLikeRemote as p, isLocalObjectUrl as r, saveOrbitPhotosRemote as s, approxDistance as t, sendOrbitChatRequestRemote as u };
