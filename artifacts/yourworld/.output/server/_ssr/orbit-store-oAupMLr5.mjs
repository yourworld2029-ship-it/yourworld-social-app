import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { St as notifyOrbitPrefsChanged, xt as ORBIT_KEY } from "./router-B6YSQPVc.mjs";
import { a as loadOrbitStateRemote, c as saveOrbitPrivacyRemote, d as sendOrbitRequestMessageRemote, f as setOrbitConnectionRemote, l as saveOrbitProfileRemote, m as setOrbitRequestStatusRemote, p as setOrbitLikeRemote, u as sendOrbitChatRequestRemote } from "./orbit-live-BqfCVEZi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/orbit-store-oAupMLr5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
		photos: mine.filter((m) => m.kind === "photo").length,
		total: mine.length
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
			return sendOrbitChatRequestRemote(id, intro).then((requestId) => {
				if (!requestId) return false;
				setState((s) => s.requests[id] ? s : {
					...s,
					requests: {
						...s.requests,
						[id]: {
							direction: "outgoing",
							status: "pending",
							intro,
							messages: [{
								id: `${requestId}-intro`,
								kind: "text",
								text: intro,
								me: true
							}]
						}
					}
				});
				return true;
			}).catch(() => false);
		},
		sendRequestMessage: async (id, msg) => {
			const existing = state.requests[id];
			if (existing?.status === "declined" || existing?.status === "accepted") return false;
			const { total } = countRequestMessages(existing);
			if (total >= 3) return false;
			const result = await sendOrbitRequestMessageRemote(id, msg);
			if (!result.ok) return false;
			setState((s) => {
				const req = s.requests[id] ?? {
					direction: "outgoing",
					status: "pending"
				};
				const messages = [...req.messages ?? [], {
					...msg,
					id: result.id ?? `${id}-${(req.messages?.length ?? 0) + 1}`,
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
		acceptRequest: async (id) => {
			if (!await setOrbitRequestStatusRemote(id, "accepted").catch(() => false)) return false;
			setState((s) => ({
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
			return true;
		},
		declineRequest: async (id) => {
			if (!await setOrbitRequestStatusRemote(id, "declined").catch(() => false)) return false;
			setState((s) => ({
				...s,
				requests: {
					...s.requests,
					[id]: {
						...s.requests[id] ?? { direction: "incoming" },
						status: "declined"
					}
				}
			}));
			return true;
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
export { clearSessionUnlock as a, useOrbit as c, OrbitProvider as i, useScreenCaptureShield as l, ORBIT_HOBBIES as n, countRequestMessages as o, ORBIT_LOOKING_FOR as r, isUnlockedForSession as s, LOCKED_MESSAGE as t };
