import { t as supabase } from "./client-D6FET1DN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chat-delete-BqPUWt2Q.js
/**
* Deleting a conversation is always "delete for me":
* my own messages are removed everywhere, and the rest of the thread is
* hidden from my side only. The other person keeps their copy.
*/
var isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
var dmPair = (id) => {
	const match = /^dm_([0-9a-f-]{36})_([0-9a-f-]{36})$/i.exec(id);
	return match ? [match[1], match[2]] : null;
};
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
	await Promise.all(ids.map(async (id) => {
		const pair = dmPair(id);
		if (!pair || !pair.includes(me)) return;
		const peerId = pair.find((userId) => userId !== me);
		if (!peerId) return;
		await supabase.from("messages").delete().eq("sender_id", me).eq("receiver_id", peerId);
	}));
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
