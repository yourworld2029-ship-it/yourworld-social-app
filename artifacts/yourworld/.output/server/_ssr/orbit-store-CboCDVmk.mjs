import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { bt as ORBIT_KEY, xt as notifyOrbitPrefsChanged } from "./router-CUrMMPk_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/orbit-store-CboCDVmk.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
			const { data, error } = await supabase.rpc("discover_orbit_profiles", { ids: null });
			if (cancelled) return;
			if (error || !data) {
				setLoading(false);
				return;
			}
			const list = data.filter((r) => r.user_id !== me).map(rowToOrbitProfile);
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
			const { data } = await supabase.rpc("discover_orbit_profiles", { ids: [id] });
			if (cancelled) return;
			const row = data?.[0];
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
/** A url that only exists in this browser tab and can never load for anyone else. */
var isLocalObjectUrl = (url) => url.startsWith("blob:") || url.startsWith("data:");
/**
* Uploads one Orbit photo/video to storage and returns a durable signed url.
* Returns null when the user is signed out or the upload fails.
*/
async function uploadOrbitMedia(file) {
	const id = await uid();
	if (!id) return null;
	const ext = (file.name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
	const path = `${id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
	const { error } = await supabase.storage.from(ORBIT_BUCKET).upload(path, file, {
		contentType: file.type || void 0,
		upsert: false
	});
	if (error) {
		console.error("[orbit] media upload failed", error.message);
		return null;
	}
	const { data, error: signError } = await supabase.storage.from(ORBIT_BUCKET).createSignedUrl(path, ORBIT_SIGN_SECONDS);
	if (signError) {
		console.error("[orbit] media signing failed", signError.message);
		return null;
	}
	return data?.signedUrl ?? null;
}
var ORBIT_HOBBIES = [
	"Travel",
	"Adventure",
	"Trip with Friends",
	"Shopping",
	"Friends & Fun",
	"Music",
	"Movies",
	"Food",
	"Photography",
	"Reading",
	"Gaming",
	"Fashion",
	"Art",
	"Technology",
	"Business",
	"Pets",
	"Sleeping",
	"Sports",
	"Gym & Fitness",
	"Other"
];
var ORBIT_LOOKING_FOR = [
	"Women",
	"Men",
	"Everyone"
];
function countRequestMessages(req) {
	const mine = (req?.messages ?? []).filter((m) => m.me);
	return {
		texts: mine.filter((m) => m.kind === "text").length,
		photos: mine.filter((m) => m.kind === "photo").length
	};
}
var defaultPrivacy = {
	orbitEnabled: true,
	paused: false,
	hiddenProfile: false,
	visibility: "public",
	whoCanLike: "everyone",
	whoCanMessage: "connections",
	whoCanConnect: "everyone",
	liveLocationEnabled: false,
	whoCanRequestLiveLocation: "connections",
	callsEnabled: true,
	whoCanCall: "connections",
	hiddenFrom: [],
	blocked: [],
	screenshotProtection: true,
	screenshotAlerts: true,
	approximateLocationOnly: true,
	aiFakeDetection: true,
	hideFlaggedProfiles: false,
	verification: "none",
	showMood: true,
	lockEnabled: false,
	pinSalt: null,
	pinHash: null,
	hideOrbitEntry: false,
	hideOrbitNotifications: false
};
var defaultState = {
	profile: null,
	privacy: defaultPrivacy,
	liked: {},
	connected: {},
	requests: {}
};
var KEY = ORBIT_KEY;
var UNLOCK_KEY = "yw.orbit.unlocked";
function randomSalt() {
	const bytes = /* @__PURE__ */ new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
/** PIN is hashed with a per-device salt; the raw value never leaves the input. */
async function digestPin(salt, pin) {
	const data = new TextEncoder().encode(`${salt}:${pin}`);
	const buf = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}
/** Constant-time-ish string compare so timing never leaks the digest. */
function safeEqual(a, b) {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}
function markUnlockedForSession() {
	try {
		window.sessionStorage.setItem(UNLOCK_KEY, "1");
	} catch {}
}
function isUnlockedForSession() {
	try {
		return window.sessionStorage.getItem(UNLOCK_KEY) === "1";
	} catch {
		return false;
	}
}
function clearSessionUnlock() {
	try {
		window.sessionStorage.removeItem(UNLOCK_KEY);
	} catch {}
}
var OrbitContext = (0, import_react.createContext)(null);
function OrbitProvider({ children }) {
	const [state, setState] = (0, import_react.useState)(defaultState);
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		try {
			const raw = window.localStorage.getItem(KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				setState({
					...defaultState,
					...parsed,
					privacy: {
						...defaultPrivacy,
						...parsed.privacy ?? {}
					},
					requests: parsed.requests ?? {}
				});
			}
		} catch {}
		setHydrated(true);
	}, []);
	/** Pull the signed-in user's real Orbit data and keep local state in sync. */
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const pull = async () => {
			const remote = await loadOrbitStateRemote();
			if (cancelled || !remote) return;
			setState((s) => {
				if (!remote.profile && s.profile) saveOrbitProfileRemote(s.profile, s.privacy);
				return {
					...s,
					profile: remote.profile ?? s.profile,
					privacy: {
						...s.privacy,
						...remote.privacy ?? {}
					},
					liked: remote.liked,
					connected: remote.connected,
					requests: remote.requests
				};
			});
		};
		pull();
		const { data: sub } = supabase.auth.onAuthStateChange((event) => {
			if (event === "SIGNED_IN" || event === "SIGNED_OUT") pull();
		});
		const channel = supabase.channel("orbit-requests-sync").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "orbit_chat_requests"
		}, () => void pull()).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "orbit_request_messages"
		}, () => void pull()).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "orbit_connections"
		}, () => void pull()).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "orbit_likes"
		}, () => void pull()).subscribe();
		return () => {
			cancelled = true;
			sub.subscription.unsubscribe();
			supabase.removeChannel(channel);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		try {
			window.localStorage.setItem(KEY, JSON.stringify(state));
			notifyOrbitPrefsChanged();
		} catch {}
	}, [state, hydrated]);
	const setPrivacy = (0, import_react.useCallback)((patch) => setState((s) => {
		const privacy = {
			...s.privacy,
			...patch
		};
		saveOrbitPrivacyRemote(privacy);
		return {
			...s,
			privacy
		};
	}), []);
	const toggleIn = (list, id) => list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
	const value = (0, import_react.useMemo)(() => ({
		...state,
		hydrated,
		hasProfile: state.profile !== null,
		saveProfile: (p) => setState((s) => {
			saveOrbitProfileRemote(p, s.privacy);
			return {
				...s,
				profile: p
			};
		}),
		setMood: (mood) => setState((s) => {
			if (!s.profile) return s;
			const profile = {
				...s.profile,
				mood
			};
			saveOrbitProfileRemote(profile, s.privacy);
			return {
				...s,
				profile
			};
		}),
		setPrivacy,
		setOrbitPin: async (pin) => {
			const salt = randomSalt();
			const pinHash = await digestPin(salt, pin);
			setState((s) => {
				const privacy = {
					...s.privacy,
					lockEnabled: true,
					pinSalt: salt,
					pinHash
				};
				saveOrbitPrivacyRemote(privacy);
				return {
					...s,
					privacy
				};
			});
			markUnlockedForSession();
		},
		verifyOrbitPin: async (pin) => {
			const { pinSalt, pinHash } = state.privacy;
			if (!pinSalt || !pinHash) return false;
			const ok = safeEqual(await digestPin(pinSalt, pin), pinHash);
			if (ok) markUnlockedForSession();
			return ok;
		},
		disableOrbitLock: () => setState((s) => {
			const privacy = {
				...s.privacy,
				lockEnabled: false,
				pinSalt: null,
				pinHash: null
			};
			saveOrbitPrivacyRemote(privacy);
			return {
				...s,
				privacy
			};
		}),
		toggleHiddenFrom: (id) => setState((s) => {
			const privacy = {
				...s.privacy,
				hiddenFrom: toggleIn(s.privacy.hiddenFrom, id)
			};
			saveOrbitPrivacyRemote(privacy);
			return {
				...s,
				privacy
			};
		}),
		toggleBlocked: (id) => setState((s) => {
			const privacy = {
				...s.privacy,
				blocked: toggleIn(s.privacy.blocked, id)
			};
			saveOrbitPrivacyRemote(privacy);
			return {
				...s,
				privacy
			};
		}),
		sendChatRequest: (id, intro) => {
			sendOrbitChatRequestRemote(id, intro);
			setState((s) => s.requests[id] ? s : {
				...s,
				requests: {
					...s.requests,
					[id]: {
						direction: "outgoing",
						status: "pending",
						intro,
						messages: [{
							id: `${id}-1`,
							kind: "text",
							text: intro,
							me: true
						}]
					}
				}
			});
		},
		sendRequestMessage: (id, msg) => {
			const existing = state.requests[id];
			if (existing?.status === "declined") return false;
			const { texts, photos } = countRequestMessages(existing);
			if (msg.kind === "text" && texts >= 3) return false;
			if (msg.kind === "photo" && photos >= 2) return false;
			sendOrbitRequestMessageRemote(id, msg);
			setState((s) => {
				const req = s.requests[id] ?? {
					direction: "outgoing",
					status: "pending"
				};
				const messages = [...req.messages ?? [], {
					...msg,
					id: `${id}-${(req.messages?.length ?? 0) + 1}`,
					me: true
				}];
				return {
					...s,
					requests: {
						...s.requests,
						[id]: {
							...req,
							intro: req.intro ?? (msg.kind === "text" ? msg.text : void 0),
							messages
						}
					}
				};
			});
			return true;
		},
		acceptRequest: (id) => {
			setOrbitRequestStatusRemote(id, "accepted");
			return setState((s) => ({
				...s,
				connected: {
					...s.connected,
					[id]: true
				},
				requests: {
					...s.requests,
					[id]: {
						...s.requests[id] ?? { direction: "incoming" },
						status: "accepted"
					}
				}
			}));
		},
		declineRequest: (id) => {
			setOrbitRequestStatusRemote(id, "declined");
			return setState((s) => ({
				...s,
				requests: {
					...s.requests,
					[id]: {
						...s.requests[id] ?? { direction: "incoming" },
						status: "declined"
					}
				}
			}));
		},
		toggleLike: (id) => {
			const previous = !!state.liked[id];
			const next = !previous;
			setState((s) => ({
				...s,
				liked: {
					...s.liked,
					[id]: next
				}
			}));
			setOrbitLikeRemote(id, next).catch(() => {
				setState((s) => ({
					...s,
					liked: {
						...s.liked,
						[id]: previous
					}
				}));
			});
		},
		toggleConnect: (id) => setState((s) => {
			const next = !s.connected[id];
			setOrbitConnectionRemote(id, next);
			return {
				...s,
				connected: {
					...s.connected,
					[id]: next
				}
			};
		})
	}), [
		state,
		hydrated,
		setPrivacy
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitContext.Provider, {
		value,
		children
	});
}
function useOrbit() {
	const ctx = (0, import_react.useContext)(OrbitContext);
	if (!ctx) throw new Error("useOrbit must be used inside OrbitProvider");
	return ctx;
}
var LOCKED_MESSAGE = "Create your Orbit Profile to unlock all Orbit features.";
/**
* Best-effort screen-capture protection. Browsers cannot block OS-level
* screenshots, so we obscure content whenever the app loses focus/visibility
* and tell the user when full protection can't be enforced.
*/
function useScreenCaptureShield(enabled) {
	const [obscured, setObscured] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!enabled) {
			setObscured(false);
			return;
		}
		const hide = () => setObscured(true);
		const show = () => setObscured(false);
		const onVisibility = () => setObscured(document.visibilityState !== "visible");
		window.addEventListener("blur", hide);
		window.addEventListener("focus", show);
		document.addEventListener("visibilitychange", onVisibility);
		return () => {
			window.removeEventListener("blur", hide);
			window.removeEventListener("focus", show);
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, [enabled]);
	return obscured;
}
//#endregion
export { approxDistance as a, isLocalObjectUrl as c, useOrbit as d, useOrbitProfile as f, OrbitProvider as i, isUnlockedForSession as l, useScreenCaptureShield as m, ORBIT_HOBBIES as n, clearSessionUnlock as o, useOrbitProfiles as p, ORBIT_LOOKING_FOR as r, countRequestMessages as s, LOCKED_MESSAGE as t, uploadOrbitMedia as u };
