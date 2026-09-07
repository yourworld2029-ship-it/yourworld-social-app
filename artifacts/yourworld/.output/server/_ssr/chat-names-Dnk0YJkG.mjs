import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chat-names-Dnk0YJkG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
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
//#endregion
export { setChatNameLocal as n, useChatNames as r, saveChatDisplayName as t };
