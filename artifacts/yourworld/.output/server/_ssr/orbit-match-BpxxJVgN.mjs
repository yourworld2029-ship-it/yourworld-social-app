import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-CjFhEasO.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/orbit-match-BpxxJVgN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
/** Trailing debounce so a burst of realtime rows triggers a single refetch. */
function debounced(fn, ms) {
	let t = null;
	const run = () => {
		if (t) clearTimeout(t);
		t = setTimeout(fn, ms);
	};
	run.cancel = () => {
		if (t) clearTimeout(t);
		t = null;
	};
	return run;
}
var isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
/** Live mutual-like matching, straight from the database (both directions). */
function useOrbitMatches() {
	const [likedByMe, setLikedByMe] = (0, import_react.useState)([]);
	const [likesMe, setLikesMe] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [tick, setTick] = (0, import_react.useState)(0);
	const refresh = (0, import_react.useCallback)(() => setTick((t) => t + 1), []);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const load = async () => {
			const { data: auth } = await supabase.auth.getUser();
			const me = auth.user?.id;
			if (!me) {
				if (!cancelled) {
					setLikedByMe([]);
					setLikesMe([]);
					setLoading(false);
				}
				return;
			}
			const [mine, theirs] = await Promise.all([supabase.from("orbit_likes").select("target_id").eq("user_id", me), supabase.from("orbit_likes").select("user_id").eq("target_id", me)]);
			if (cancelled) return;
			setLikedByMe((mine.data ?? []).map((r) => r.target_id));
			setLikesMe((theirs.data ?? []).map((r) => r.user_id));
			setLoading(false);
		};
		load();
		const reload = debounced(() => void load(), 800);
		const channel = supabase.channel("orbit-likes-live").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "orbit_likes"
		}, reload).subscribe();
		return () => {
			cancelled = true;
			reload.cancel();
			supabase.removeChannel(channel);
		};
	}, [tick]);
	const set = new Set(likesMe);
	return {
		likedByMe,
		likesMe,
		mutual: likedByMe.filter((id) => set.has(id)),
		loading,
		refresh
	};
}
/**
* Sends (or withdraws) a real match like.
* Returns whether the two people now match each other.
*/
async function sendOrbitMatch(targetId, liked) {
	const { data: auth } = await supabase.auth.getUser();
	const me = auth.user?.id;
	if (!me || !isUuid(targetId)) return {
		ok: false,
		mutual: false
	};
	if (!liked) {
		await supabase.from("orbit_likes").delete().eq("user_id", me).eq("target_id", targetId);
		return {
			ok: true,
			mutual: false
		};
	}
	const { error } = await supabase.from("orbit_likes").upsert({
		user_id: me,
		target_id: targetId
	}, { onConflict: "user_id,target_id" });
	if (error && !/duplicate/i.test(error.message)) return {
		ok: false,
		mutual: false
	};
	const { data } = await supabase.from("orbit_likes").select("user_id").eq("user_id", targetId).eq("target_id", me).maybeSingle();
	const mutual = !!data;
	if (mutual) await supabase.from("orbit_connections").upsert({
		requester_id: me,
		addressee_id: targetId,
		status: "accepted"
	}, { onConflict: "requester_id,addressee_id" });
	return {
		ok: true,
		mutual
	};
}
/** Last message per Orbit peer, live. */
function useOrbitThreadPreviews() {
	const [previews, setPreviews] = (0, import_react.useState)({});
	const meRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const load = async () => {
			const { data: auth } = await supabase.auth.getUser();
			const me = auth.user?.id;
			meRef.current = me ?? null;
			if (!me) return;
			const { data } = await supabase.from("orbit_messages").select("id,sender_id,recipient_id,kind,text,created_at").or(`sender_id.eq.${me},recipient_id.eq.${me}`).order("created_at", { ascending: false }).limit(300);
			if (cancelled || !data) return;
			const next = {};
			for (const r of data) {
				const peer = r.sender_id === me ? r.recipient_id : r.sender_id;
				if (next[peer]) continue;
				next[peer] = {
					peerId: peer,
					text: r.kind === "photo" ? "Photo" : r.kind === "video" ? "Video" : r.kind === "audio" ? "Voice message" : r.text ?? "",
					at: new Date(r.created_at).getTime(),
					mine: r.sender_id === me,
					unread: 0
				};
			}
			setPreviews(next);
		};
		load();
		const reload = debounced(() => void load(), 800);
		const channel = supabase.channel("orbit-thread-previews").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "orbit_messages"
		}, reload).subscribe();
		return () => {
			cancelled = true;
			reload.cancel();
			supabase.removeChannel(channel);
		};
	}, []);
	return previews;
}
//#endregion
export { useOrbitMatches as n, useOrbitThreadPreviews as r, sendOrbitMatch as t };
