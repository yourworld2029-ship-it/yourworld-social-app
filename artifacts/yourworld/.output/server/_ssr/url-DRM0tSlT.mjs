//#region node_modules/.nitro/vite/services/ssr/assets/url-DRM0tSlT.js
var SUPABASE_HOST_SUFFIX = ".supabase.co";
/**
* Supabase clients require the project origin, not a PostgREST endpoint.
* Replit's Supabase connector may expose a URL ending in /rest/v1; strip any
* path, query, or hash before supabase-js appends its own service routes.
*/
function normalizeSupabaseProjectUrl(value) {
	let url;
	try {
		url = new URL(value.trim());
	} catch {
		throw new Error("SUPABASE_URL must be a valid HTTPS URL.");
	}
	if (url.protocol !== "https:" || !url.hostname.endsWith(SUPABASE_HOST_SUFFIX)) throw new Error("SUPABASE_URL must use the HTTPS project origin ending in .supabase.co.");
	return url.origin;
}
//#endregion
export { normalizeSupabaseProjectUrl as t };
