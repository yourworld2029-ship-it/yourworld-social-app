import { t as normalizeSupabaseProjectUrl } from "./url-DRM0tSlT.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
import { r as createServerFn } from "./server-DM7kTLrZ.mjs";
import { t as createServerRpc } from "./createServerRpc-BdBKEfTD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/quick-demo-login.functions-ClSwZK27.js
/**
* Signs the visitor into the pre-created, verified demo account.
*
* The account credentials are server-only Replit Secrets. Returning the
* resulting normal Supabase session is intentional: the browser needs it for
* the existing auth listener and RLS-backed app data.
*/
var quickDemoLogin_createServerFn_handler = createServerRpc({
	id: "70b79855b04b79bb31ecfada102732747d708881fcc912dbc3ef6de685f8da02",
	name: "quickDemoLogin",
	filename: "src/lib/quick-demo-login.functions.ts"
}, (opts) => quickDemoLogin.__executeServer(opts));
var quickDemoLogin = createServerFn({ method: "POST" }).handler(quickDemoLogin_createServerFn_handler, async () => {
	const configuredUrl = process.env["SUPABASE_URL"];
	const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
	const email = process.env["SUPABASE_DEMO_EMAIL"];
	const password = process.env["SUPABASE_DEMO_PASSWORD"];
	if (!configuredUrl || !publishableKey || !email || !password) throw new Error("Quick Demo Login is not configured yet.");
	const { data, error } = await createClient(normalizeSupabaseProjectUrl(configuredUrl), publishableKey, { auth: {
		persistSession: false,
		autoRefreshToken: false
	} }).auth.signInWithPassword({
		email,
		password
	});
	if (error || !data.session) {
		console.error("[Quick Demo Login] Supabase sign-in failed", error?.message ?? "No session returned");
		throw new Error("Quick Demo Login is temporarily unavailable.");
	}
	return {
		accessToken: data.session.access_token,
		refreshToken: data.session.refresh_token
	};
});
//#endregion
export { quickDemoLogin_createServerFn_handler };
