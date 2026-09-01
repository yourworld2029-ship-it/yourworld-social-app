import { t as supabase } from "./client-CjFhEasO.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chat-delete-CgFKxYs0.js
/**
* Deleting a conversation is always "delete for me":
* my own messages are removed everywhere, and the rest of the thread is
* hidden from my side only. The other person keeps their copy.
*/
var isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
var HIDDEN_DM_KEY = "yw-hidden-threads";
var HIDDEN_ORBIT_KEY = "yw-hidden-orbit-chats";
function readHidden(key) {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(key);
		const list = raw ? JSON.parse(raw) : [];
		return Array.isArray(list) ? list.filter((v) => typeof v === "string") : [];
	} catch {
		return [];
	}
}
function writeHidden(key, ids) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(key, JSON.stringify([...new Set(ids)].slice(-500)));
	} catch {}
}
var hiddenThreadIds = () => readHidden(HIDDEN_DM_KEY);
var hiddenOrbitPeerIds = () => readHidden(HIDDEN_ORBIT_KEY);
/** Delete one or many direct-message threads for the signed-in user. */
async function deleteDirectThreads(threadIds) {
	const ids = [...new Set(threadIds)].filter(Boolean);
	if (!ids.length) return;
	writeHidden(HIDDEN_DM_KEY, [...readHidden(HIDDEN_DM_KEY), ...ids]);
	const { data: auth } = await supabase.auth.getUser();
	const me = auth.user?.id;
	if (!me) return;
	await supabase.from("direct_messages").delete().in("thread_id", ids).eq("sender_id", me);
	await supabase.from("thread_participants").delete().in("thread_id", ids).eq("user_id", me);
}
/** Delete one or many Orbit conversations for the signed-in user. */
async function deleteOrbitConversations(peerIds) {
	const ids = [...new Set(peerIds)].filter(isUuid);
	if (!ids.length) return;
	writeHidden(HIDDEN_ORBIT_KEY, [...readHidden(HIDDEN_ORBIT_KEY), ...ids]);
	const { data: auth } = await supabase.auth.getUser();
	const me = auth.user?.id;
	if (!me) return;
	const now = (/* @__PURE__ */ new Date()).toISOString();
	await supabase.from("orbit_messages").delete().eq("sender_id", me).in("recipient_id", ids);
	await supabase.from("orbit_chat_settings").upsert(ids.map((peer_id) => ({
		user_id: me,
		peer_id,
		cleared_before: now
	})), { onConflict: "user_id,peer_id" });
}
//#endregion
export { hiddenThreadIds as i, deleteOrbitConversations as n, hiddenOrbitPeerIds as r, deleteDirectThreads as t };
