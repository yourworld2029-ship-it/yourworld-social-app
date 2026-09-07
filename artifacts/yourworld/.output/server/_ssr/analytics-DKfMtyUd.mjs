//#region node_modules/.nitro/vite/services/ssr/assets/analytics-DKfMtyUd.js
/**
* Replit injects the Umami tracker for published website artifacts.
* Analytics is optional and must never interrupt a user flow.
*/
function trackEvent(name, data) {
	if (typeof window === "undefined") return;
	try {
		window.umami?.track(name, data);
	} catch {}
}
//#endregion
export { trackEvent as t };
