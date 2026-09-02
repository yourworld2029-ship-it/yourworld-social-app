globalThis.__nitro_main__ = import.meta.url;
import { n as serve, t as NodeResponse } from "./_libs/srvx.mjs";
import { i as toEventHandler, n as defineHandler, o as HTTPError, r as defineLazyEventHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { i as withoutTrailingSlash, n as joinURL, r as withLeadingSlash, t as decodePath } from "./_libs/ufo.mjs";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
//#region #nitro-vite-setup
function lazyService(loader) {
	let promise, mod;
	return { fetch(req) {
		if (mod) return mod.fetch(req);
		if (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
		return promise.then((mod) => mod.fetch(req));
	} };
}
var services = { ["ssr"]: lazyService(() => import("./_ssr/ssr.mjs")) };
globalThis.__nitro_vite_envs__ = services;
//#endregion
//#region ../../node_modules/.pnpm/nitro@3.0.260603-beta_drizzle-orm@0.45.2_@types+pg@8.20.0_pg@8.22.0_postgres@3.4.9__jit_f7280ed15d50a4c568f05ea55ad35156/node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/favicon.svg": {
		"type": "image/svg+xml",
		"etag": "\"a3-Yvco5K08sGQeN5F1GHJoyPC6SS4\"",
		"mtime": "2026-09-02T11:39:40.055Z",
		"size": 163,
		"path": "../public/favicon.svg"
	},
	"/manifest.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"1ea-6VxqHNj9+exgLrKEoBUp7bg4ak0\"",
		"mtime": "2026-09-02T11:39:40.055Z",
		"size": 490,
		"path": "../public/manifest.webmanifest"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"16-iUOtJ2RsHfdY9DoQxaq0wz1LZCU\"",
		"mtime": "2026-09-02T11:39:40.055Z",
		"size": 22,
		"path": "../public/robots.txt"
	},
	"/assets/Avatar-CtG9DNrT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"225-+bGhqBWCo3/aCEsILMblfMi9EKs\"",
		"mtime": "2026-09-02T11:39:37.056Z",
		"size": 549,
		"path": "../public/assets/Avatar-CtG9DNrT.js"
	},
	"/assets/ChannelContentList-B4pi3tqI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"58e-tRaFfgH7WW+vOd6F4Hiyf7fWrpY\"",
		"mtime": "2026-09-02T11:39:37.056Z",
		"size": 1422,
		"path": "../public/assets/ChannelContentList-B4pi3tqI.js"
	},
	"/assets/ClientOnly-BLQ6U6R8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13f-j0SNX9405wGpvG+wmmJESUTpnZI\"",
		"mtime": "2026-09-02T11:39:37.056Z",
		"size": 319,
		"path": "../public/assets/ClientOnly-BLQ6U6R8.js"
	},
	"/assets/FollowListDialog-DBGrh11m.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16f5-RKn8v28w8YvPz93sXtzRgB4XVCw\"",
		"mtime": "2026-09-02T11:39:37.057Z",
		"size": 5877,
		"path": "../public/assets/FollowListDialog-DBGrh11m.js"
	},
	"/assets/LiveLocationSheet-BAzMN3t7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"139d-uc2BCs/+HhGC/AnZSaVrcPewncs\"",
		"mtime": "2026-09-02T11:39:37.057Z",
		"size": 5021,
		"path": "../public/assets/LiveLocationSheet-BAzMN3t7.js"
	},
	"/assets/VideoPoster-CRwC0V_a.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"491d-GNkbM6kGNQHP+DmgFqBrLaE6xtM\"",
		"mtime": "2026-09-02T11:39:37.057Z",
		"size": 18717,
		"path": "../public/assets/VideoPoster-CRwC0V_a.js"
	},
	"/assets/account-peL5cGcV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5b18-tlT3mr1MVdtREu6Lonl6MD84KGY\"",
		"mtime": "2026-09-02T11:39:37.057Z",
		"size": 23320,
		"path": "../public/assets/account-peL5cGcV.js"
	},
	"/assets/alerts-count-DHSuNaMv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5fb-ylA9uzbMrqUws9vmDeouuy5XUEo\"",
		"mtime": "2026-09-02T11:39:37.058Z",
		"size": 1531,
		"path": "../public/assets/alerts-count-DHSuNaMv.js"
	},
	"/assets/auth-F9NstD1n.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4ffe-+NP8FvBjQYco7hVylodp1i3rJlg\"",
		"mtime": "2026-09-02T11:39:37.058Z",
		"size": 20478,
		"path": "../public/assets/auth-F9NstD1n.js"
	},
	"/assets/button-DZ4hVxz7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"587-Vz6X5p+E89a5vxjVzO/ZjmAxLBg\"",
		"mtime": "2026-09-02T11:39:37.058Z",
		"size": 1415,
		"path": "../public/assets/button-DZ4hVxz7.js"
	},
	"/assets/channel.analytics-Dhv640NH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"692-a6xCYOl1NCbX8dxn9SBO4gNQJGc\"",
		"mtime": "2026-09-02T11:39:37.058Z",
		"size": 1682,
		"path": "../public/assets/channel.analytics-Dhv640NH.js"
	},
	"/assets/channel-data-nkbMqsZJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e46-4sWsTSoa9TBiao76C687DjZY5Eg\"",
		"mtime": "2026-09-02T11:39:37.058Z",
		"size": 3654,
		"path": "../public/assets/channel-data-nkbMqsZJ.js"
	},
	"/assets/channel.create-zvIKfvgt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1942-tjwcS/xldblz7IF203RGk8+q92I\"",
		"mtime": "2026-09-02T11:39:37.058Z",
		"size": 6466,
		"path": "../public/assets/channel.create-zvIKfvgt.js"
	},
	"/assets/channel.monetization-B79K2-3W.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9b8-Cwed6hOY+Pr5gM2S4Ip1QX6oEB8\"",
		"mtime": "2026-09-02T11:39:37.058Z",
		"size": 2488,
		"path": "../public/assets/channel.monetization-B79K2-3W.js"
	},
	"/assets/channel.posts-BiGvE6rV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11f-cLNN1EHH5rIUi8xU9r/pGAmjmzE\"",
		"mtime": "2026-09-02T11:39:37.058Z",
		"size": 287,
		"path": "../public/assets/channel.posts-BiGvE6rV.js"
	},
	"/assets/channel.reels-D7QfW0Su.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11f-sAAulnamF4325ays+hRUWLYqP0Y\"",
		"mtime": "2026-09-02T11:39:37.058Z",
		"size": 287,
		"path": "../public/assets/channel.reels-D7QfW0Su.js"
	},
	"/assets/channel.subscribers-BWdMQfN8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"542-2EOL/d7JI3CV8GOgYmQzukmahng\"",
		"mtime": "2026-09-02T11:39:37.058Z",
		"size": 1346,
		"path": "../public/assets/channel.subscribers-BWdMQfN8.js"
	},
	"/assets/channel.videos-ARjMOvKj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"122-bHOkqaeRcTFSPWW4ci3tWWt+oXU\"",
		"mtime": "2026-09-02T11:39:37.058Z",
		"size": 290,
		"path": "../public/assets/channel.videos-ARjMOvKj.js"
	},
	"/assets/chat-delete-D_ha7tQk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d6-IhZrxTirr014i4++zc6Dgi4JX/w\"",
		"mtime": "2026-09-02T11:39:37.058Z",
		"size": 1238,
		"path": "../public/assets/chat-delete-D_ha7tQk.js"
	},
	"/assets/ShareSheet-DofprFmL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a2ed-Uq1IBT+BnxuE/ZbgLXEG3/PLZ2c\"",
		"mtime": "2026-09-02T11:39:37.057Z",
		"size": 41709,
		"path": "../public/assets/ShareSheet-DofprFmL.js"
	},
	"/icon-512.png": {
		"type": "image/png",
		"etag": "\"10033-25w1u01xl/8gQOyAqgrSdkaxdio\"",
		"mtime": "2026-09-02T11:39:40.055Z",
		"size": 65587,
		"path": "../public/icon-512.png"
	},
	"/favicon.png": {
		"type": "image/png",
		"etag": "\"16c7-sHfgQvyMV/xhC2ahSs44WAoIC94\"",
		"mtime": "2026-09-02T11:39:40.055Z",
		"size": 5831,
		"path": "../public/favicon.png"
	},
	"/assets/chevron-left-DCWi8AFo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"82-Nyvjp0DClAKo4jztQSU4y179D+s\"",
		"mtime": "2026-09-02T11:39:37.058Z",
		"size": 130,
		"path": "../public/assets/chevron-left-DCWi8AFo.js"
	},
	"/assets/chat.index-Fb6LmW-2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"232e-3sVGMwP9TORmPhN+iwdcRIIYCS4\"",
		"mtime": "2026-09-02T11:39:37.058Z",
		"size": 9006,
		"path": "../public/assets/chat.index-Fb6LmW-2.js"
	},
	"/assets/copyright-policy-C1JCNB3w.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"236d-YUeZXXVlZB6Q6do8k2pxGGmJgpw\"",
		"mtime": "2026-09-02T11:39:37.061Z",
		"size": 9069,
		"path": "../public/assets/copyright-policy-C1JCNB3w.js"
	},
	"/assets/createLucideIcon-zYGWgMV3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d5-q/IYz1LzVgYGf/TuxC8seyNvMeM\"",
		"mtime": "2026-09-02T11:39:37.061Z",
		"size": 1237,
		"path": "../public/assets/createLucideIcon-zYGWgMV3.js"
	},
	"/assets/client-Crb0DbGz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"33944-0qHfMClpy1zoBqW+bwkMXim3Sgo\"",
		"mtime": "2026-09-02T11:39:37.058Z",
		"size": 211268,
		"path": "../public/assets/client-Crb0DbGz.js"
	},
	"/assets/createServerFn-DmINZ2_W.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1144-RCg45onP4Wo+y3fyAbUFRyRtG3c\"",
		"mtime": "2026-09-02T11:39:37.061Z",
		"size": 4420,
		"path": "../public/assets/createServerFn-DmINZ2_W.js"
	},
	"/assets/dist-7DHJbmHc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1cc7-WmlEqZx3QjHh6rMuq/jHoa40r6E\"",
		"mtime": "2026-09-02T11:39:37.061Z",
		"size": 7367,
		"path": "../public/assets/dist-7DHJbmHc.js"
	},
	"/assets/dialog-CHLIaiZK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7a6-onEheUtX4Iu0+072tuwKsncGye0\"",
		"mtime": "2026-09-02T11:39:37.061Z",
		"size": 1958,
		"path": "../public/assets/dialog-CHLIaiZK.js"
	},
	"/assets/dist-9_rQ_Grk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b66-ac4Zo3/Yjuo/arQBE7AOafHNEQo\"",
		"mtime": "2026-09-02T11:39:37.061Z",
		"size": 2918,
		"path": "../public/assets/dist-9_rQ_Grk.js"
	},
	"/assets/dist-ChhcN3pS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12ec-//hCpgxrdxHsUrHvyHTpVLeTtao\"",
		"mtime": "2026-09-02T11:39:37.061Z",
		"size": 4844,
		"path": "../public/assets/dist-ChhcN3pS.js"
	},
	"/assets/dist-DLQt2BcY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2a9-YZYgEHXuUd8kv7q1LqyYawzzkok\"",
		"mtime": "2026-09-02T11:39:37.061Z",
		"size": 681,
		"path": "../public/assets/dist-DLQt2BcY.js"
	},
	"/assets/dist-Djdv0oiS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1399-ihQxlrv+hH9tV+MdxDN6nQjmzbY\"",
		"mtime": "2026-09-02T11:39:37.061Z",
		"size": 5017,
		"path": "../public/assets/dist-Djdv0oiS.js"
	},
	"/assets/dist-Dr7K4enD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"282-/0lWtYlyZLBEGw5/LGqeoP9vajA\"",
		"mtime": "2026-09-02T11:39:37.061Z",
		"size": 642,
		"path": "../public/assets/dist-Dr7K4enD.js"
	},
	"/assets/dist-BBs97vxf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6448-fldm3LWS6Q2nXcRmg40mS1jHNKM\"",
		"mtime": "2026-09-02T11:39:37.061Z",
		"size": 25672,
		"path": "../public/assets/dist-BBs97vxf.js"
	},
	"/assets/dist-yp-2tsEm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109b-fv193BiWFIE6I5aBGD0O54gtDIE\"",
		"mtime": "2026-09-02T11:39:37.061Z",
		"size": 4251,
		"path": "../public/assets/dist-yp-2tsEm.js"
	},
	"/assets/ellipsis-DJa7oDhq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e2-oM+1pCz1H9Iz76NYx8Bi8JeXN7A\"",
		"mtime": "2026-09-02T11:39:37.061Z",
		"size": 226,
		"path": "../public/assets/ellipsis-DJa7oDhq.js"
	},
	"/assets/eye-DI6Zkgpx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"100-uvX4r8l9otdsHr/G9bhXYGwdLwI\"",
		"mtime": "2026-09-02T11:39:37.061Z",
		"size": 256,
		"path": "../public/assets/eye-DI6Zkgpx.js"
	},
	"/assets/geo-data-CYKNiDfb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6ce-DiXeUwOVv3S5GUs0RTxhIQieJkk\"",
		"mtime": "2026-09-02T11:39:37.061Z",
		"size": 1742,
		"path": "../public/assets/geo-data-CYKNiDfb.js"
	},
	"/assets/image-plus-BEyUefMp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16b-jM/otUDosKLzeNczaPUhwq6ohjw\"",
		"mtime": "2026-09-02T11:39:37.062Z",
		"size": 363,
		"path": "../public/assets/image-plus-BEyUefMp.js"
	},
	"/assets/html2canvas-DCcDvdvP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"30b50-/NW/tvs1950d+adFAmG+0O5qROc\"",
		"mtime": "2026-09-02T11:39:37.061Z",
		"size": 199504,
		"path": "../public/assets/html2canvas-DCcDvdvP.js"
	},
	"/assets/es2015--DrBlcKE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6190-jP+wsDeJlMMXZLV/wlo95YsSNZw\"",
		"mtime": "2026-09-02T11:39:37.061Z",
		"size": 24976,
		"path": "../public/assets/es2015--DrBlcKE.js"
	},
	"/assets/input-BBnJIaH6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"296-1NymB3ER3bK4TEd7jUH7nJz1d8M\"",
		"mtime": "2026-09-02T11:39:37.062Z",
		"size": 662,
		"path": "../public/assets/input-BBnJIaH6.js"
	},
	"/assets/invariant-DrlDULPJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ce1-ZRQDfkQPt4jYb9usOOHjNrKdLto\"",
		"mtime": "2026-09-02T11:39:37.062Z",
		"size": 3297,
		"path": "../public/assets/invariant-DrlDULPJ.js"
	},
	"/assets/index.es-i3T1aSpw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24f8c-T1ecpr/CNXKPmzNVl24QIz0kkIY\"",
		"mtime": "2026-09-02T11:39:37.062Z",
		"size": 151436,
		"path": "../public/assets/index.es-i3T1aSpw.js"
	},
	"/assets/index-BW2hG9Sy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a52ba-6kTGa3e5xp5kFiT9L67mJ3EX9Mk\"",
		"mtime": "2026-09-02T11:39:37.050Z",
		"size": 676538,
		"path": "../public/assets/index-BW2hG9Sy.js"
	},
	"/assets/link-DS1dcRyo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3feb-TtYfNRNFNE5e7QSTbP8vYKNJ8SM\"",
		"mtime": "2026-09-02T11:39:37.062Z",
		"size": 16363,
		"path": "../public/assets/link-DS1dcRyo.js"
	},
	"/assets/matchContext-BLaZZjXw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b8-BSjivHXemCqEV+wXXsCe5P0ODLQ\"",
		"mtime": "2026-09-02T11:39:37.062Z",
		"size": 184,
		"path": "../public/assets/matchContext-BLaZZjXw.js"
	},
	"/assets/moment._momentId-wDh7bJ-z.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3e5b-sqzCeDbKG4/Nsgl8So3ljimhwyY\"",
		"mtime": "2026-09-02T11:39:37.062Z",
		"size": 15963,
		"path": "../public/assets/moment._momentId-wDh7bJ-z.js"
	},
	"/assets/moment.index-BMHm-saV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c22-YEJiDkUTbR/2pWkh8boyoLPyS6c\"",
		"mtime": "2026-09-02T11:39:37.062Z",
		"size": 3106,
		"path": "../public/assets/moment.index-BMHm-saV.js"
	},
	"/assets/navigation-C8MoOCIK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"94-7DknCKydA7aq83O7EnlD43AHz04\"",
		"mtime": "2026-09-02T11:39:37.062Z",
		"size": 148,
		"path": "../public/assets/navigation-C8MoOCIK.js"
	},
	"/assets/not-found-DIgawKw1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"37-RTB6YH5iXRKeXz1Sn6ZQ+vS0lnc\"",
		"mtime": "2026-09-02T11:39:37.062Z",
		"size": 55,
		"path": "../public/assets/not-found-DIgawKw1.js"
	},
	"/assets/notifications-C1xlhTpo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"17e6-iy3eHD3quWDDlRADB7INtwJ2THs\"",
		"mtime": "2026-09-02T11:39:37.062Z",
		"size": 6118,
		"path": "../public/assets/notifications-C1xlhTpo.js"
	},
	"/assets/orbit-C6c_9S2_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f5-UrlN4wgaC32lh9U3KollLKqPmqw\"",
		"mtime": "2026-09-02T11:39:37.062Z",
		"size": 2293,
		"path": "../public/assets/orbit-C6c_9S2_.js"
	},
	"/assets/orbit-match-CoOKF8us.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a94-azt/2e4NA8xs3YLrhgeO+1vAeW4\"",
		"mtime": "2026-09-02T11:39:37.062Z",
		"size": 2708,
		"path": "../public/assets/orbit-match-CoOKF8us.js"
	},
	"/assets/orbit-mood-D1SQ3wAI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4f8-0OOOjx3oF76Cb8sSgFsOxSYcYUs\"",
		"mtime": "2026-09-02T11:39:37.063Z",
		"size": 1272,
		"path": "../public/assets/orbit-mood-D1SQ3wAI.js"
	},
	"/assets/orbit-store-Cx_S156E.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3107-EL0XeVA+wVxdkYOme3aabLHKj+M\"",
		"mtime": "2026-09-02T11:39:37.063Z",
		"size": 12551,
		"path": "../public/assets/orbit-store-Cx_S156E.js"
	},
	"/assets/orbit._profileId-CmJTyvrg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2832-CB0HemQG2PBBrk1q8nQAiWsHGNs\"",
		"mtime": "2026-09-02T11:39:37.063Z",
		"size": 10290,
		"path": "../public/assets/orbit._profileId-CmJTyvrg.js"
	},
	"/assets/orbit.chat._userId-BqGyIxf5.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9ae0-IxeDpuIVqFFVGhKYqqZ6K0FaX9s\"",
		"mtime": "2026-09-02T11:39:37.063Z",
		"size": 39648,
		"path": "../public/assets/orbit.chat._userId-BqGyIxf5.js"
	},
	"/assets/orbit.create-DdoielY-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"84a0-2nQv6hqgB5MuHWuj6iIGLPRpATg\"",
		"mtime": "2026-09-02T11:39:37.063Z",
		"size": 33952,
		"path": "../public/assets/orbit.create-DdoielY-.js"
	},
	"/assets/orbit.me-kIDNHrax.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1929-NBszpXs+Jvr5P3EXZcu05hYaiTE\"",
		"mtime": "2026-09-02T11:39:37.063Z",
		"size": 6441,
		"path": "../public/assets/orbit.me-kIDNHrax.js"
	},
	"/assets/orbit.messages-BOd9wRWj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"337f-Irm0epnt6zuFbl3jC36AhdaerHY\"",
		"mtime": "2026-09-02T11:39:37.063Z",
		"size": 13183,
		"path": "../public/assets/orbit.messages-BOd9wRWj.js"
	},
	"/assets/orbit.index-C--yP4r1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"72f5-QCoDtPxHi4u+MM7rPOV+pIC/5TI\"",
		"mtime": "2026-09-02T11:39:37.063Z",
		"size": 29429,
		"path": "../public/assets/orbit.index-C--yP4r1.js"
	},
	"/assets/orbit.notifications-C6ad6CvK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cd9-4du49ClbF4ZlfROyuORT9x1x0ag\"",
		"mtime": "2026-09-02T11:39:37.063Z",
		"size": 3289,
		"path": "../public/assets/orbit.notifications-C6ad6CvK.js"
	},
	"/assets/orbit.privacy-DD64Wg1Y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3b97-Im8VjnyP8vCAcyAXvVYBHwU1o14\"",
		"mtime": "2026-09-02T11:39:37.063Z",
		"size": 15255,
		"path": "../public/assets/orbit.privacy-DD64Wg1Y.js"
	},
	"/assets/pin-BeE_zRtQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"31a-l5uaPsRPR+8pJDClvFJdvEKdlT4\"",
		"mtime": "2026-09-02T11:39:37.063Z",
		"size": 794,
		"path": "../public/assets/pin-BeE_zRtQ.js"
	},
	"/assets/post-1-uxYyj4Yn.jpg": {
		"type": "image/jpeg",
		"etag": "\"2621b-tADwOglKGR4PvLgzJyB6lOA0+b8\"",
		"mtime": "2026-09-02T11:39:37.066Z",
		"size": 156187,
		"path": "../public/assets/post-1-uxYyj4Yn.jpg"
	},
	"/assets/post.create-DdWjAUcA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15b5-u3GQiRNJMVM7ewpxl1AKrvhq3g4\"",
		"mtime": "2026-09-02T11:39:37.063Z",
		"size": 5557,
		"path": "../public/assets/post.create-DdWjAUcA.js"
	},
	"/assets/privacy-CqWgHgzc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c79-2N5xC1isxTzf9wILa20pz6reFiQ\"",
		"mtime": "2026-09-02T11:39:37.063Z",
		"size": 3193,
		"path": "../public/assets/privacy-CqWgHgzc.js"
	},
	"/assets/profile-Cxl0cR52.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7d15-wWC9mky4imtg/qqBQEB5A7qBaiQ\"",
		"mtime": "2026-09-02T11:39:37.064Z",
		"size": 32021,
		"path": "../public/assets/profile-Cxl0cR52.js"
	},
	"/assets/profiles-map-DZTYV8dt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"32a-wtDk8K9VD943FpPOAXE/q6f65Pg\"",
		"mtime": "2026-09-02T11:39:37.064Z",
		"size": 810,
		"path": "../public/assets/profiles-map-DZTYV8dt.js"
	},
	"/assets/purify.es-ChwZkWde.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"68bc-bPPRDEosU/Lqj+2Oyi1ue22LViM\"",
		"mtime": "2026-09-02T11:39:37.064Z",
		"size": 26812,
		"path": "../public/assets/purify.es-ChwZkWde.js"
	},
	"/assets/redirect-DtIAAt0y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e1-KhpEIx1LNSnb7dNYxiNI58wV9MY\"",
		"mtime": "2026-09-02T11:39:37.064Z",
		"size": 481,
		"path": "../public/assets/redirect-DtIAAt0y.js"
	},
	"/assets/react-dom-BS6Gh_TR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e08-9bSgZZ4q4Ni+kAtZEKfL9G1hHrE\"",
		"mtime": "2026-09-02T11:39:37.064Z",
		"size": 3592,
		"path": "../public/assets/react-dom-BS6Gh_TR.js"
	},
	"/assets/reel-1-DgXdxb9U.jpg": {
		"type": "image/jpeg",
		"etag": "\"158de-632G9IqzPFNj16hyS2vSq2z3WoA\"",
		"mtime": "2026-09-02T11:39:37.066Z",
		"size": 88286,
		"path": "../public/assets/reel-1-DgXdxb9U.jpg"
	},
	"/assets/reel-2-D6ICrDT7.jpg": {
		"type": "image/jpeg",
		"etag": "\"1d3c4-QU1Rig2/vTeF6slkXtMXSVa68U0\"",
		"mtime": "2026-09-02T11:39:37.066Z",
		"size": 119748,
		"path": "../public/assets/reel-2-D6ICrDT7.jpg"
	},
	"/assets/reels-BnF7Vfs8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3009-N1VqPaeB+AdctQPx8bMExVYZt4g\"",
		"mtime": "2026-09-02T11:39:37.064Z",
		"size": 12297,
		"path": "../public/assets/reels-BnF7Vfs8.js"
	},
	"/assets/reset-password-CqNf25hM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"52a-JnZJ3y8zMGt2IKELt1a4D/NfaaI\"",
		"mtime": "2026-09-02T11:39:37.064Z",
		"size": 1322,
		"path": "../public/assets/reset-password-CqNf25hM.js"
	},
	"/assets/reel-3-BYUKUHRv.jpg": {
		"type": "image/jpeg",
		"etag": "\"8bae-hivl0InXk3Rn4aAy5LSO54t+UZE\"",
		"mtime": "2026-09-02T11:39:37.067Z",
		"size": 35758,
		"path": "../public/assets/reel-3-BYUKUHRv.jpg"
	},
	"/assets/rolldown-runtime-hePW80VL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2cc-fA8td6k29UVF6JoPfhOPkceTK1M\"",
		"mtime": "2026-09-02T11:39:37.064Z",
		"size": 716,
		"path": "../public/assets/rolldown-runtime-hePW80VL.js"
	},
	"/assets/route-DYYicAWm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8c-UDfLyoDPWaNLhRnhe23syeLZJ0c\"",
		"mtime": "2026-09-02T11:39:37.064Z",
		"size": 140,
		"path": "../public/assets/route-DYYicAWm.js"
	},
	"/assets/root-DLTE-HSj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20-vSYConOtSP6ciwr9zKsPixNwWmc\"",
		"mtime": "2026-09-02T11:39:37.064Z",
		"size": 32,
		"path": "../public/assets/root-DLTE-HSj.js"
	},
	"/assets/routes-Dh1I77wL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85f9-SxxChPYPDYXN+VWMpSn5XiFdKIs\"",
		"mtime": "2026-09-02T11:39:37.064Z",
		"size": 34297,
		"path": "../public/assets/routes-Dh1I77wL.js"
	},
	"/assets/scan-face-CM2bv4DP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a5-2sX7qfOwFGs4b0QZiHDo+LUoaas\"",
		"mtime": "2026-09-02T11:39:37.064Z",
		"size": 421,
		"path": "../public/assets/scan-face-CM2bv4DP.js"
	},
	"/assets/search-BNh6d8_K.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2cdc-l4mVle8HghAqvHNCBOj1X9UmI/U\"",
		"mtime": "2026-09-02T11:39:37.064Z",
		"size": 11484,
		"path": "../public/assets/search-BNh6d8_K.js"
	},
	"/assets/settings-63gKAQz_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e7-H6UEAhV97AbbPJvTM0mgapeyVN4\"",
		"mtime": "2026-09-02T11:39:37.065Z",
		"size": 487,
		"path": "../public/assets/settings-63gKAQz_.js"
	},
	"/assets/settings-2-x6U2komm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fc-airYhkVLobsDhkRjcuibMjh1Kz4\"",
		"mtime": "2026-09-02T11:39:37.064Z",
		"size": 252,
		"path": "../public/assets/settings-2-x6U2komm.js"
	},
	"/assets/sheet-leLev5ko.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8a3-rY9LvZIWncHkcaUFtlHWyj1UDeY\"",
		"mtime": "2026-09-02T11:39:37.065Z",
		"size": 2211,
		"path": "../public/assets/sheet-leLev5ko.js"
	},
	"/assets/shield-TvVcHHSx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"190-IQZ0HXDtipzveT7dmmgPX6/2kng\"",
		"mtime": "2026-09-02T11:39:37.065Z",
		"size": 400,
		"path": "../public/assets/shield-TvVcHHSx.js"
	},
	"/assets/shield-check-DbLP09Mr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"140-kO2Skvjk1wqz1iVSYj10tG7kAAg\"",
		"mtime": "2026-09-02T11:39:37.065Z",
		"size": 320,
		"path": "../public/assets/shield-check-DbLP09Mr.js"
	},
	"/assets/square-nG_BaMNK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"93-N5UoPnJn75SEYhz/11HKB4AH68Y\"",
		"mtime": "2026-09-02T11:39:37.065Z",
		"size": 147,
		"path": "../public/assets/square-nG_BaMNK.js"
	},
	"/assets/styles-BT4BsmZ3.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"33a86-lXGAk1lAYnD3fBE8EscNvVL21l0\"",
		"mtime": "2026-09-02T11:39:37.067Z",
		"size": 211590,
		"path": "../public/assets/styles-BT4BsmZ3.css"
	},
	"/assets/switch-BG-VOEQt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1109-cMDOx5+gSDnLOfn/20uAcFVjFRg\"",
		"mtime": "2026-09-02T11:39:37.065Z",
		"size": 4361,
		"path": "../public/assets/switch-BG-VOEQt.js"
	},
	"/assets/textarea-DTrIDnbq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"230-xhLmF9bPHovlIwHVJ//wS8GbTFI\"",
		"mtime": "2026-09-02T11:39:37.065Z",
		"size": 560,
		"path": "../public/assets/textarea-DTrIDnbq.js"
	},
	"/assets/terms-BGXcR8AI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"df8-9Wm58yyTMGLNlETkr/7gG3iXNHE\"",
		"mtime": "2026-09-02T11:39:37.065Z",
		"size": 3576,
		"path": "../public/assets/terms-BGXcR8AI.js"
	},
	"/assets/triangle-alert-B2hpeTrU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109-hAh5bu7wpC/dyrDkPv2HRWFdK0E\"",
		"mtime": "2026-09-02T11:39:37.065Z",
		"size": 265,
		"path": "../public/assets/triangle-alert-B2hpeTrU.js"
	},
	"/assets/useMatch-CG_Qo4VA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"26c-mf+6Kl2KU/dZTKCvH3wHxYMjLA8\"",
		"mtime": "2026-09-02T11:39:37.065Z",
		"size": 620,
		"path": "../public/assets/useMatch-CG_Qo4VA.js"
	},
	"/assets/u._userId-B1XXwm6r.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16d4-N65AMExGKCuwK9aOkACQJGnPakE\"",
		"mtime": "2026-09-02T11:39:37.065Z",
		"size": 5844,
		"path": "../public/assets/u._userId-B1XXwm6r.js"
	},
	"/assets/useRouter-BP8vT1kh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f38-UAwyZ71XUq5pvhwLvcQ+ekWdEeM\"",
		"mtime": "2026-09-02T11:39:37.065Z",
		"size": 7992,
		"path": "../public/assets/useRouter-BP8vT1kh.js"
	},
	"/assets/useServerFn-CzzciFve.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19d-Q2chUu1zNyiLPgJ8BU4VVAVaG7A\"",
		"mtime": "2026-09-02T11:39:37.065Z",
		"size": 413,
		"path": "../public/assets/useServerFn-CzzciFve.js"
	},
	"/assets/useStore-Bwiy6pX7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"786-iVUaSoWn1x0ZE/FkYImHA2AwxQw\"",
		"mtime": "2026-09-02T11:39:37.065Z",
		"size": 1926,
		"path": "../public/assets/useStore-Bwiy6pX7.js"
	},
	"/assets/video-data-DyP6RRNg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a2e-P0lkI0Mikx9JLihPLFpz4aagnEY\"",
		"mtime": "2026-09-02T11:39:37.066Z",
		"size": 6702,
		"path": "../public/assets/video-data-DyP6RRNg.js"
	},
	"/assets/video._videoId-DH18u1vQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2688-mxy/WdYZPPf0XMslPtiwVs+n5U8\"",
		"mtime": "2026-09-02T11:39:37.066Z",
		"size": 9864,
		"path": "../public/assets/video._videoId-DH18u1vQ.js"
	},
	"/assets/video.upload-Bs7i-jRO.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"264e-gNCiosOgJvgZTsNuvN30TYH6UsI\"",
		"mtime": "2026-09-02T11:39:37.066Z",
		"size": 9806,
		"path": "../public/assets/video.upload-Bs7i-jRO.js"
	},
	"/assets/wallet-BN50r2fx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"650bf-ORw4tM113z+l21sqFC1qOoZBiCA\"",
		"mtime": "2026-09-02T11:39:37.066Z",
		"size": 413887,
		"path": "../public/assets/wallet-BN50r2fx.js"
	},
	"/assets/yw-data-Bd96njiI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85-tVhY2OnWfg4oPW2g2MxJpBstjUk\"",
		"mtime": "2026-09-02T11:39:37.066Z",
		"size": 133,
		"path": "../public/assets/yw-data-Bd96njiI.js"
	},
	"/assets/yw-download-DwNrhE_c.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"511-/EgO3q0AkwboSGQj5DEH2DCwOEE\"",
		"mtime": "2026-09-02T11:39:37.066Z",
		"size": 1297,
		"path": "../public/assets/yw-download-DwNrhE_c.js"
	},
	"/assets/yw-logo-BXjnypdM.png": {
		"type": "image/png",
		"etag": "\"b8bf9-XKz0DAyp9GBS6zs069mBfmp0ubE\"",
		"mtime": "2026-09-02T11:39:37.067Z",
		"size": 756729,
		"path": "../public/assets/yw-logo-BXjnypdM.png"
	}
};
//#endregion
//#region #nitro/virtual/public-assets-node
function readAsset(id) {
	const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
	return promises.readFile(resolve(serverDir, public_assets_data_default[id].path));
}
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
function getAsset(id) {
	return public_assets_data_default[id];
}
//#endregion
//#region ../../node_modules/.pnpm/nitro@3.0.260603-beta_drizzle-orm@0.45.2_@types+pg@8.20.0_pg@8.22.0_postgres@3.4.9__jit_f7280ed15d50a4c568f05ea55ad35156/node_modules/nitro/dist/runtime/internal/static.mjs
var METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
var EncodingMap = {
	gzip: ".gz",
	br: ".br",
	zstd: ".zst"
};
var static_default = defineHandler((event) => {
	if (event.req.method && !METHODS.has(event.req.method)) return;
	let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
	let asset;
	const encodings = [...(event.req.headers.get("accept-encoding") || "").split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
	for (const encoding of encodings) for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
		const _asset = getAsset(_id);
		if (_asset) {
			asset = _asset;
			id = _id;
			break;
		}
	}
	if (!asset) {
		if (isPublicAssetURL(id)) {
			event.res.headers.delete("Cache-Control");
			throw new HTTPError({ status: 404 });
		}
		return;
	}
	if (encodings.length > 1) event.res.headers.append("Vary", "Accept-Encoding");
	if (event.req.headers.get("if-none-match") === asset.etag) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	const ifModifiedSinceH = event.req.headers.get("if-modified-since");
	const mtimeDate = new Date(asset.mtime);
	if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	if (asset.type) event.res.headers.set("Content-Type", asset.type);
	if (asset.etag && !event.res.headers.has("ETag")) event.res.headers.set("ETag", asset.etag);
	if (asset.mtime && !event.res.headers.has("Last-Modified")) event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
	if (asset.encoding && !event.res.headers.has("Content-Encoding")) event.res.headers.set("Content-Encoding", asset.encoding);
	if (asset.size > 0 && !event.res.headers.has("Content-Length")) event.res.headers.set("Content-Length", asset.size.toString());
	return readAsset(id);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_38ikjE = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_38ikjE
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
var globalMiddleware = [toEventHandler(static_default)].filter(Boolean);
//#endregion
//#region ../../node_modules/.pnpm/nitro@3.0.260603-beta_drizzle-orm@0.45.2_@types+pg@8.20.0_pg@8.22.0_postgres@3.4.9__jit_f7280ed15d50a4c568f05ea55ad35156/node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~middleware"].push(...globalMiddleware);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		middleware.push(...h3App["~middleware"]);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region ../../node_modules/.pnpm/nitro@3.0.260603-beta_drizzle-orm@0.45.2_@types+pg@8.20.0_pg@8.22.0_postgres@3.4.9__jit_f7280ed15d50a4c568f05ea55ad35156/node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region ../../node_modules/.pnpm/nitro@3.0.260603-beta_drizzle-orm@0.45.2_@types+pg@8.20.0_pg@8.22.0_postgres@3.4.9__jit_f7280ed15d50a4c568f05ea55ad35156/node_modules/nitro/dist/runtime/internal/error/hooks.mjs
function _captureError(error, type) {
	console.error(`[${type}]`, error);
	useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
	process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
	process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
//#endregion
//#region #nitro/virtual/tracing
var tracingSrvxPlugins = [];
//#endregion
//#region ../../node_modules/.pnpm/nitro@3.0.260603-beta_drizzle-orm@0.45.2_@types+pg@8.20.0_pg@8.22.0_postgres@3.4.9__jit_f7280ed15d50a4c568f05ea55ad35156/node_modules/nitro/dist/presets/node/runtime/node-server.mjs
var _parsedPort = Number.parseInt(process.env.NITRO_PORT ?? process.env.PORT ?? "");
var port = Number.isNaN(_parsedPort) ? 3e3 : _parsedPort;
var host = process.env.NITRO_HOST || process.env.HOST;
var cert = process.env.NITRO_SSL_CERT;
var key = process.env.NITRO_SSL_KEY;
var nitroApp = useNitroApp();
serve({
	port,
	hostname: host,
	tls: cert && key ? {
		cert,
		key
	} : void 0,
	fetch: nitroApp.fetch,
	plugins: [...tracingSrvxPlugins]
});
trapUnhandledErrors();
var node_server_default = {};
//#endregion
export { node_server_default as default };
