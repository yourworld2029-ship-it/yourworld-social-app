import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/secret-chats-C2KcRray.js
var import_react = /* @__PURE__ */ __toESM(require_react());
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
//#endregion
export { useSecretChats as i, randomPinSalt as n, saveSecretChatLock as r, hashPin as t };
