import { t as normalizeSupabaseProjectUrl } from "./url-DRM0tSlT.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client-D6FET1DN.js
function isNewSupabaseApiKey(value) {
	return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}
function createSupabaseFetch(supabaseKey) {
	return (input, init) => {
		const headers = new Headers(typeof Request !== "undefined" && input instanceof Request ? input.headers : void 0);
		if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
		if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) headers.delete("Authorization");
		headers.set("apikey", supabaseKey);
		return fetch(input, {
			...init,
			headers
		});
	};
}
function createSupabaseClient() {
	const CONFIGURED_SUPABASE_URL = {
		"BASE_URL": "/",
		"DEV": false,
		"MODE": "production",
		"PROD": true,
		"SSR": true,
		"TSS_DEV_SERVER": "false",
		"TSS_DEV_SSR_STYLES_BASEPATH": "/",
		"TSS_DEV_SSR_STYLES_ENABLED": "true",
		"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
		"TSS_INLINE_CSS_ENABLED": "false",
		"TSS_ROUTER_BASEPATH": "",
		"TSS_SERVER_FN_BASE": "/_serverFn/",
		"VITE_APP_URL": "https://your-world-social-app--yourworld2029.replit.app",
		"VITE_SUPABASE_PROJECT_ID": "mvvliwuldgcmrqffrfgi",
		"VITE_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_by8rV8Qfj_n4nTB-y4MJnw_soEAst3r",
		"VITE_SUPABASE_URL": "https://pnpfybcdxynfooylxqou.supabase.co"
	}["VITE_SUPABASE_URL"];
	const SUPABASE_PUBLISHABLE_KEY = {
		"BASE_URL": "/",
		"DEV": false,
		"MODE": "production",
		"PROD": true,
		"SSR": true,
		"TSS_DEV_SERVER": "false",
		"TSS_DEV_SSR_STYLES_BASEPATH": "/",
		"TSS_DEV_SSR_STYLES_ENABLED": "true",
		"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
		"TSS_INLINE_CSS_ENABLED": "false",
		"TSS_ROUTER_BASEPATH": "",
		"TSS_SERVER_FN_BASE": "/_serverFn/",
		"VITE_APP_URL": "https://your-world-social-app--yourworld2029.replit.app",
		"VITE_SUPABASE_PROJECT_ID": "mvvliwuldgcmrqffrfgi",
		"VITE_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_by8rV8Qfj_n4nTB-y4MJnw_soEAst3r",
		"VITE_SUPABASE_URL": "https://pnpfybcdxynfooylxqou.supabase.co"
	}["VITE_SUPABASE_PUBLISHABLE_KEY"];
	if (!CONFIGURED_SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
		const message = `Missing Supabase environment variable(s): ${[...!CONFIGURED_SUPABASE_URL ? ["SUPABASE_URL"] : [], ...!SUPABASE_PUBLISHABLE_KEY ? ["SUPABASE_PUBLISHABLE_KEY"] : []].join(", ")}. Configure them in Replit Secrets and republish.`;
		console.error(`[Supabase] ${message}`);
		throw new Error(message);
	}
	const SUPABASE_URL = normalizeSupabaseProjectUrl(CONFIGURED_SUPABASE_URL);
	return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
		global: { fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY) },
		auth: {
			persistSession: true,
			autoRefreshToken: true
		}
	});
}
var _supabase;
var supabase = new Proxy({}, { get(_, prop, receiver) {
	if (!_supabase) _supabase = createSupabaseClient();
	return Reflect.get(_supabase, prop, receiver);
} });
//#endregion
export { supabase as t };
