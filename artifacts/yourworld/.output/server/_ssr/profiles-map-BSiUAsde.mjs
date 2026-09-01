import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-CjFhEasO.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profiles-map-BSiUAsde.js
var import_react = /* @__PURE__ */ __toESM(require_react());
function hueOf(id) {
	let h = 0;
	for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) % 360;
	return h;
}
function fallbackUser(id) {
	return {
		id,
		username: "user",
		name: "User",
		hue: hueOf(id)
	};
}
/** Resolves real profiles for a list of user ids (username, name, avatar). */
function useProfiles(ids) {
	const key = (0, import_react.useMemo)(() => [...new Set(ids)].sort().join(","), [ids]);
	const [map, setMap] = (0, import_react.useState)({});
	(0, import_react.useEffect)(() => {
		const list = key ? key.split(",") : [];
		if (!list.length) {
			setMap({});
			return;
		}
		let alive = true;
		(async () => {
			const { data } = await supabase.rpc("get_public_profiles", { ids: list });
			if (!alive) return;
			const next = {};
			for (const p of data ?? []) next[p.id] = {
				id: p.id,
				username: p.username ?? "user",
				name: p.display_name ?? p.username ?? "User",
				hue: hueOf(p.id),
				avatarUrl: p.avatar_url
			};
			setMap(next);
		})();
		return () => {
			alive = false;
		};
	}, [key]);
	return {
		map,
		get: (id) => map[id] ?? {
			...fallbackUser(id),
			avatarUrl: null
		}
	};
}
//#endregion
export { useProfiles as t };
