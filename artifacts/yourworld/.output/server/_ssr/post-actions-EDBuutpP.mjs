import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { rt as isAuthSessionMissing } from "./router-CDfbqX6_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/post-actions-EDBuutpP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
/** Permanently delete my own post. */
async function deletePost(postId) {
	const { error } = await supabase.from("posts").delete().eq("id", postId);
	if (error) throw error;
}
/** Saved-post bookmarks for the signed-in user, synced with the database. */
function usePostSaves() {
	const [saved, setSaved] = (0, import_react.useState)({});
	const meRef = (0, import_react.useRef)(null);
	const load = (0, import_react.useCallback)(async () => {
		const { data: auth, error: authError } = await supabase.auth.getUser();
		if (authError) {
			if (isAuthSessionMissing(authError)) {
				meRef.current = null;
				setSaved({});
				return;
			}
			console.error("Unable to load saved posts", authError);
			meRef.current = null;
			setSaved({});
			return;
		}
		const me = auth.user?.id ?? null;
		meRef.current = me;
		if (!me) {
			setSaved({});
			return;
		}
		const { data, error } = await supabase.from("post_saves").select("post_id").eq("user_id", me);
		if (error) {
			console.error("Unable to load saved posts", error);
			setSaved({});
			return;
		}
		const next = {};
		for (const row of data ?? []) next[row.post_id] = true;
		setSaved(next);
	}, []);
	(0, import_react.useEffect)(() => {
		load();
		const { data: sub } = supabase.auth.onAuthStateChange(() => void load());
		const channel = supabase.channel(`post-saves:${crypto.randomUUID()}`).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "post_saves"
		}, () => void load()).subscribe();
		return () => {
			sub.subscription.unsubscribe();
			supabase.removeChannel(channel);
		};
	}, [load]);
	return {
		saved,
		toggleSave: (0, import_react.useCallback)(async (postId) => {
			const me = meRef.current;
			if (!me) return false;
			let next = false;
			setSaved((prev) => {
				next = !prev[postId];
				return {
					...prev,
					[postId]: next
				};
			});
			const { error } = next ? await supabase.from("post_saves").upsert({
				post_id: postId,
				user_id: me
			}, {
				onConflict: "post_id,user_id",
				ignoreDuplicates: true
			}) : await supabase.from("post_saves").delete().eq("post_id", postId).eq("user_id", me);
			if (error) {
				console.error("Unable to update saved post", error);
				setSaved((prev) => ({
					...prev,
					[postId]: !next
				}));
				throw error;
			}
			return next;
		}, []),
		reload: load
	};
}
//#endregion
export { usePostSaves as n, deletePost as t };
