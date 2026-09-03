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
		"mtime": "2026-09-03T05:29:41.526Z",
		"size": 163,
		"path": "../public/favicon.svg"
	},
	"/manifest.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"1ea-6VxqHNj9+exgLrKEoBUp7bg4ak0\"",
		"mtime": "2026-09-03T05:29:41.526Z",
		"size": 490,
		"path": "../public/manifest.webmanifest"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"16-iUOtJ2RsHfdY9DoQxaq0wz1LZCU\"",
		"mtime": "2026-09-03T05:29:41.527Z",
		"size": 22,
		"path": "../public/robots.txt"
	},
	"/assets/Avatar-COHSd4wn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"225-PjnJEuhNKF2QfZFJwnpiJLO7c+I\"",
		"mtime": "2026-09-03T05:29:38.769Z",
		"size": 549,
		"path": "../public/assets/Avatar-COHSd4wn.js"
	},
	"/assets/ChannelContentList-CbsFOrAg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"58e-ly3lCZxRs9qvDLs8IDrJ9HAqXDI\"",
		"mtime": "2026-09-03T05:29:38.774Z",
		"size": 1422,
		"path": "../public/assets/ChannelContentList-CbsFOrAg.js"
	},
	"/assets/ClientOnly-BLQ6U6R8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13f-j0SNX9405wGpvG+wmmJESUTpnZI\"",
		"mtime": "2026-09-03T05:29:38.774Z",
		"size": 319,
		"path": "../public/assets/ClientOnly-BLQ6U6R8.js"
	},
	"/assets/FollowListDialog-W0gAZMLq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16f6-WB1kK6JXR3Nmepj+Gt8qGT7C0NU\"",
		"mtime": "2026-09-03T05:29:38.774Z",
		"size": 5878,
		"path": "../public/assets/FollowListDialog-W0gAZMLq.js"
	},
	"/assets/LiveLocationSheet-ORrf3sWD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"139d-IzU6QO6zI+BwcOe9mNGrEsXDM5w\"",
		"mtime": "2026-09-03T05:29:38.774Z",
		"size": 5021,
		"path": "../public/assets/LiveLocationSheet-ORrf3sWD.js"
	},
	"/assets/ShareSheet-BN2Y77Q4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a35b-NFnLvDcIjZKqVzg2qJkffX06g3M\"",
		"mtime": "2026-09-03T05:29:38.774Z",
		"size": 41819,
		"path": "../public/assets/ShareSheet-BN2Y77Q4.js"
	},
	"/assets/VideoPoster-CZL-SNdU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4a67-KaLVTKaxxMofkbDkZhUhew/u2zQ\"",
		"mtime": "2026-09-03T05:29:38.774Z",
		"size": 19047,
		"path": "../public/assets/VideoPoster-CZL-SNdU.js"
	},
	"/assets/account-Cahwoknb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5b18-ANZ2Hcakahh34UIe9/6V5lHUMW0\"",
		"mtime": "2026-09-03T05:29:38.774Z",
		"size": 23320,
		"path": "../public/assets/account-Cahwoknb.js"
	},
	"/assets/alerts-count-Bu5JJUic.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5fb-hhjL8z5ibfPAKj2FQk/czl8xkHo\"",
		"mtime": "2026-09-03T05:29:38.775Z",
		"size": 1531,
		"path": "../public/assets/alerts-count-Bu5JJUic.js"
	},
	"/assets/auth-ChVuYIjB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"218c-joLjqlN/HKSvjAz62dXYnpXjTTg\"",
		"mtime": "2026-09-03T05:29:38.775Z",
		"size": 8588,
		"path": "../public/assets/auth-ChVuYIjB.js"
	},
	"/assets/button-BITOCrNj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"587-AmXND37X2GbBjXjzCb82Y5bz1bg\"",
		"mtime": "2026-09-03T05:29:38.775Z",
		"size": 1415,
		"path": "../public/assets/button-BITOCrNj.js"
	},
	"/assets/channel-data-G255RHJI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"10a5-yLMavzNql+pI7NVbeErM6wVYd/k\"",
		"mtime": "2026-09-03T05:29:38.775Z",
		"size": 4261,
		"path": "../public/assets/channel-data-G255RHJI.js"
	},
	"/assets/channel.analytics-DgXJAEXl.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f5-fJOnmAQxo92TQivyoCmWLit54Uk\"",
		"mtime": "2026-09-03T05:29:38.775Z",
		"size": 2293,
		"path": "../public/assets/channel.analytics-DgXJAEXl.js"
	},
	"/assets/channel.create-DqRneGy1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1c1a-NIy9B5OZbhK1yp0iCkQvm8TNXfU\"",
		"mtime": "2026-09-03T05:29:38.776Z",
		"size": 7194,
		"path": "../public/assets/channel.create-DqRneGy1.js"
	},
	"/assets/channel.monetization-DuC80FPD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ca2-8ZAbYow09JFl5dBczmSycrxWqQ0\"",
		"mtime": "2026-09-03T05:29:38.776Z",
		"size": 3234,
		"path": "../public/assets/channel.monetization-DuC80FPD.js"
	},
	"/assets/channel.posts-DpAr2kWe.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11f-eruAQwoNNSFletZhCwnjwG2vNRQ\"",
		"mtime": "2026-09-03T05:29:38.776Z",
		"size": 287,
		"path": "../public/assets/channel.posts-DpAr2kWe.js"
	},
	"/assets/channel.reels-DW7PANEs.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11f-3DDFsXnq1BBeXqMMV6dKEgrFh3E\"",
		"mtime": "2026-09-03T05:29:38.777Z",
		"size": 287,
		"path": "../public/assets/channel.reels-DW7PANEs.js"
	},
	"/assets/channel.subscribers-Dr-gq9tz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"542-D8xdTP+o+Smnl2Mfe8o8OgSuqck\"",
		"mtime": "2026-09-03T05:29:38.777Z",
		"size": 1346,
		"path": "../public/assets/channel.subscribers-Dr-gq9tz.js"
	},
	"/assets/channel.videos-tw_kJTrw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"122-IF/1g54BSTX/A1nwd9dcO/A/hYs\"",
		"mtime": "2026-09-03T05:29:38.777Z",
		"size": 290,
		"path": "../public/assets/channel.videos-tw_kJTrw.js"
	},
	"/assets/chat-delete-BpQsZRyT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d6-9A13RYtYGuICaUADRNjUyjcAWD0\"",
		"mtime": "2026-09-03T05:29:38.777Z",
		"size": 1238,
		"path": "../public/assets/chat-delete-BpQsZRyT.js"
	},
	"/favicon.png": {
		"type": "image/png",
		"etag": "\"16c7-sHfgQvyMV/xhC2ahSs44WAoIC94\"",
		"mtime": "2026-09-03T05:29:41.526Z",
		"size": 5831,
		"path": "../public/favicon.png"
	},
	"/icon-512.png": {
		"type": "image/png",
		"etag": "\"10033-25w1u01xl/8gQOyAqgrSdkaxdio\"",
		"mtime": "2026-09-03T05:29:41.526Z",
		"size": 65587,
		"path": "../public/icon-512.png"
	},
	"/assets/chevron-left-DCWi8AFo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"82-Nyvjp0DClAKo4jztQSU4y179D+s\"",
		"mtime": "2026-09-03T05:29:38.777Z",
		"size": 130,
		"path": "../public/assets/chevron-left-DCWi8AFo.js"
	},
	"/assets/chat.index-ekIY_KXo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"232e-lmWwQi3JjuW8zXhyWLc/0EouQL0\"",
		"mtime": "2026-09-03T05:29:38.777Z",
		"size": 9006,
		"path": "../public/assets/chat.index-ekIY_KXo.js"
	},
	"/assets/client-BbE0fNkQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"33951-k4wh9wXmwUAPeqg7Qtu5m00Mdnw\"",
		"mtime": "2026-09-03T05:29:38.777Z",
		"size": 211281,
		"path": "../public/assets/client-BbE0fNkQ.js"
	},
	"/assets/copyright-policy-C1NBOGwt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"236d-JMUrsI2MRReAbLAjw+lzZ3wnNG0\"",
		"mtime": "2026-09-03T05:29:38.778Z",
		"size": 9069,
		"path": "../public/assets/copyright-policy-C1NBOGwt.js"
	},
	"/assets/createLucideIcon-zYGWgMV3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d5-q/IYz1LzVgYGf/TuxC8seyNvMeM\"",
		"mtime": "2026-09-03T05:29:38.778Z",
		"size": 1237,
		"path": "../public/assets/createLucideIcon-zYGWgMV3.js"
	},
	"/assets/createServerFn-BkPFE9sV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1144-k7RezZb+51Drrk+zxbBlSogP3mw\"",
		"mtime": "2026-09-03T05:29:38.779Z",
		"size": 4420,
		"path": "../public/assets/createServerFn-BkPFE9sV.js"
	},
	"/assets/dialog-Cye866fy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7a6-sDMmHzdTXipjx7LTSU/HodWTfl8\"",
		"mtime": "2026-09-03T05:29:38.779Z",
		"size": 1958,
		"path": "../public/assets/dialog-Cye866fy.js"
	},
	"/assets/dist-7DHJbmHc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1cc7-WmlEqZx3QjHh6rMuq/jHoa40r6E\"",
		"mtime": "2026-09-03T05:29:38.779Z",
		"size": 7367,
		"path": "../public/assets/dist-7DHJbmHc.js"
	},
	"/assets/dist-9_rQ_Grk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b66-ac4Zo3/Yjuo/arQBE7AOafHNEQo\"",
		"mtime": "2026-09-03T05:29:38.779Z",
		"size": 2918,
		"path": "../public/assets/dist-9_rQ_Grk.js"
	},
	"/assets/dist-B4Hb8c3W.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6448-8HSXYRMbJJwnvH+cKi6O5w08a08\"",
		"mtime": "2026-09-03T05:29:38.779Z",
		"size": 25672,
		"path": "../public/assets/dist-B4Hb8c3W.js"
	},
	"/assets/dist-CAjJETD7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12ec-fizUMBLLwA4HcsvU/caK2W8B+Fw\"",
		"mtime": "2026-09-03T05:29:38.779Z",
		"size": 4844,
		"path": "../public/assets/dist-CAjJETD7.js"
	},
	"/assets/dist-DLQt2BcY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2a9-YZYgEHXuUd8kv7q1LqyYawzzkok\"",
		"mtime": "2026-09-03T05:29:38.779Z",
		"size": 681,
		"path": "../public/assets/dist-DLQt2BcY.js"
	},
	"/assets/dist-Djdv0oiS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1399-ihQxlrv+hH9tV+MdxDN6nQjmzbY\"",
		"mtime": "2026-09-03T05:29:38.779Z",
		"size": 5017,
		"path": "../public/assets/dist-Djdv0oiS.js"
	},
	"/assets/dist-WhE__8jJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"282-2qZ9uSx94mmmWL8xZbCAFy6UhMs\"",
		"mtime": "2026-09-03T05:29:38.780Z",
		"size": 642,
		"path": "../public/assets/dist-WhE__8jJ.js"
	},
	"/assets/dist-YUfc_ov7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109b-ncBeFhLFfbNnafvus9D9hFOLycw\"",
		"mtime": "2026-09-03T05:29:38.780Z",
		"size": 4251,
		"path": "../public/assets/dist-YUfc_ov7.js"
	},
	"/assets/ellipsis-DJa7oDhq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e2-oM+1pCz1H9Iz76NYx8Bi8JeXN7A\"",
		"mtime": "2026-09-03T05:29:38.780Z",
		"size": 226,
		"path": "../public/assets/ellipsis-DJa7oDhq.js"
	},
	"/assets/es2015-BPVIJJU9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6195-3ehYcCCUc/e9m2kykU+ajReL9PM\"",
		"mtime": "2026-09-03T05:29:38.780Z",
		"size": 24981,
		"path": "../public/assets/es2015-BPVIJJU9.js"
	},
	"/assets/eye-DI6Zkgpx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"100-uvX4r8l9otdsHr/G9bhXYGwdLwI\"",
		"mtime": "2026-09-03T05:29:38.780Z",
		"size": 256,
		"path": "../public/assets/eye-DI6Zkgpx.js"
	},
	"/assets/geo-data-CYKNiDfb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6ce-DiXeUwOVv3S5GUs0RTxhIQieJkk\"",
		"mtime": "2026-09-03T05:29:38.780Z",
		"size": 1742,
		"path": "../public/assets/geo-data-CYKNiDfb.js"
	},
	"/assets/html2canvas-DCcDvdvP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"30b50-/NW/tvs1950d+adFAmG+0O5qROc\"",
		"mtime": "2026-09-03T05:29:38.780Z",
		"size": 199504,
		"path": "../public/assets/html2canvas-DCcDvdvP.js"
	},
	"/assets/image-plus-BEyUefMp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16b-jM/otUDosKLzeNczaPUhwq6ohjw\"",
		"mtime": "2026-09-03T05:29:38.782Z",
		"size": 363,
		"path": "../public/assets/image-plus-BEyUefMp.js"
	},
	"/assets/index.es-DKTPiWPH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24f8c-1Uti91a2DheyF7Y0hCuTlm5mhYc\"",
		"mtime": "2026-09-03T05:29:38.782Z",
		"size": 151436,
		"path": "../public/assets/index.es-DKTPiWPH.js"
	},
	"/assets/index-D_3S8T2U.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a53da-Xco2HXHLuSpfpzWa2ncRYbKKy/k\"",
		"mtime": "2026-09-03T05:29:38.765Z",
		"size": 676826,
		"path": "../public/assets/index-D_3S8T2U.js"
	},
	"/assets/input-C7ftr7JN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"296-PJA68qymQ4F/fwYrxYyTOStXGnM\"",
		"mtime": "2026-09-03T05:29:38.783Z",
		"size": 662,
		"path": "../public/assets/input-C7ftr7JN.js"
	},
	"/assets/invariant-DrlDULPJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ce1-ZRQDfkQPt4jYb9usOOHjNrKdLto\"",
		"mtime": "2026-09-03T05:29:38.783Z",
		"size": 3297,
		"path": "../public/assets/invariant-DrlDULPJ.js"
	},
	"/assets/link-DS1dcRyo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3feb-TtYfNRNFNE5e7QSTbP8vYKNJ8SM\"",
		"mtime": "2026-09-03T05:29:38.783Z",
		"size": 16363,
		"path": "../public/assets/link-DS1dcRyo.js"
	},
	"/assets/matchContext-BLaZZjXw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b8-BSjivHXemCqEV+wXXsCe5P0ODLQ\"",
		"mtime": "2026-09-03T05:29:38.783Z",
		"size": 184,
		"path": "../public/assets/matchContext-BLaZZjXw.js"
	},
	"/assets/moment._momentId-C6z8LiO1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3e5b-CsSLLhUHKy2SQgWngbZPdXmHGVw\"",
		"mtime": "2026-09-03T05:29:38.783Z",
		"size": 15963,
		"path": "../public/assets/moment._momentId-C6z8LiO1.js"
	},
	"/assets/moment.index-CSGYhJ84.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c22-lIpwy4UaTT5NMaiWiK+XReq46A8\"",
		"mtime": "2026-09-03T05:29:38.784Z",
		"size": 3106,
		"path": "../public/assets/moment.index-CSGYhJ84.js"
	},
	"/assets/navigation-C8MoOCIK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"94-7DknCKydA7aq83O7EnlD43AHz04\"",
		"mtime": "2026-09-03T05:29:38.784Z",
		"size": 148,
		"path": "../public/assets/navigation-C8MoOCIK.js"
	},
	"/assets/not-found-DIgawKw1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"37-RTB6YH5iXRKeXz1Sn6ZQ+vS0lnc\"",
		"mtime": "2026-09-03T05:29:38.784Z",
		"size": 55,
		"path": "../public/assets/not-found-DIgawKw1.js"
	},
	"/assets/notifications-Bo_2oToT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"17e6-6CKNy9L8mV9I4aMckMhKMT4ke6o\"",
		"mtime": "2026-09-03T05:29:38.784Z",
		"size": 6118,
		"path": "../public/assets/notifications-Bo_2oToT.js"
	},
	"/assets/orbit-W-nqMXgt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f5-CST3kR9s2U9rrNIylDSst2UPzCU\"",
		"mtime": "2026-09-03T05:29:38.784Z",
		"size": 2293,
		"path": "../public/assets/orbit-W-nqMXgt.js"
	},
	"/assets/orbit-match-DTyf9Maf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a94-UYKAjprC4KOaaYJhX5yp+rK43F8\"",
		"mtime": "2026-09-03T05:29:38.785Z",
		"size": 2708,
		"path": "../public/assets/orbit-match-DTyf9Maf.js"
	},
	"/assets/orbit-mood-D1SQ3wAI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4f8-0OOOjx3oF76Cb8sSgFsOxSYcYUs\"",
		"mtime": "2026-09-03T05:29:38.785Z",
		"size": 1272,
		"path": "../public/assets/orbit-mood-D1SQ3wAI.js"
	},
	"/assets/orbit-store-w499eFr5.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3151-+u7Ui/m/EmuIO7YURDMaJFcDI3M\"",
		"mtime": "2026-09-03T05:29:38.785Z",
		"size": 12625,
		"path": "../public/assets/orbit-store-w499eFr5.js"
	},
	"/assets/orbit._profileId-mhYyRsHs.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2837-gY0OXVJAl0wsWB0DnQRyNJZEIwU\"",
		"mtime": "2026-09-03T05:29:38.785Z",
		"size": 10295,
		"path": "../public/assets/orbit._profileId-mhYyRsHs.js"
	},
	"/assets/orbit.chat._userId-Bm5C5y2X.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9ae2-LELBTfuvoDp6brIVnLLD6KWqLTI\"",
		"mtime": "2026-09-03T05:29:38.785Z",
		"size": 39650,
		"path": "../public/assets/orbit.chat._userId-Bm5C5y2X.js"
	},
	"/assets/orbit.create-BEc6HvmJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"84a0-z++uUeThvOfVsB83IbzlWDu03S8\"",
		"mtime": "2026-09-03T05:29:38.785Z",
		"size": 33952,
		"path": "../public/assets/orbit.create-BEc6HvmJ.js"
	},
	"/assets/orbit.index-oE8Repm2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"72f5-HjlqZUFkAKCkTPUQg0zF+4wHSpo\"",
		"mtime": "2026-09-03T05:29:38.786Z",
		"size": 29429,
		"path": "../public/assets/orbit.index-oE8Repm2.js"
	},
	"/assets/orbit.me-DJwQpduD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1929-hvYrMt76xlENAGwOOGzKMm3CZ+8\"",
		"mtime": "2026-09-03T05:29:38.786Z",
		"size": 6441,
		"path": "../public/assets/orbit.me-DJwQpduD.js"
	},
	"/assets/orbit.messages-CliFyCyg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"337f-ySGuyuPyVZxRDbpuXjA2jW2owjY\"",
		"mtime": "2026-09-03T05:29:38.786Z",
		"size": 13183,
		"path": "../public/assets/orbit.messages-CliFyCyg.js"
	},
	"/assets/orbit.notifications-C07sHdAT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cd9-IamDh2tGyiJ4X+2hnplQ+96ttP4\"",
		"mtime": "2026-09-03T05:29:38.786Z",
		"size": 3289,
		"path": "../public/assets/orbit.notifications-C07sHdAT.js"
	},
	"/assets/orbit.privacy-gKyU6clr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3b97-ZfLID3OBFt/xZ+5Ai21T35t4TP0\"",
		"mtime": "2026-09-03T05:29:38.786Z",
		"size": 15255,
		"path": "../public/assets/orbit.privacy-gKyU6clr.js"
	},
	"/assets/pin-BeE_zRtQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"31a-l5uaPsRPR+8pJDClvFJdvEKdlT4\"",
		"mtime": "2026-09-03T05:29:38.786Z",
		"size": 794,
		"path": "../public/assets/pin-BeE_zRtQ.js"
	},
	"/assets/post-1-uxYyj4Yn.jpg": {
		"type": "image/jpeg",
		"etag": "\"2621b-tADwOglKGR4PvLgzJyB6lOA0+b8\"",
		"mtime": "2026-09-03T05:29:38.797Z",
		"size": 156187,
		"path": "../public/assets/post-1-uxYyj4Yn.jpg"
	},
	"/assets/post.create-BRJ7e3RP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15b5-GWxAFuRoqiIcMlHnir0PszA+/UE\"",
		"mtime": "2026-09-03T05:29:38.786Z",
		"size": 5557,
		"path": "../public/assets/post.create-BRJ7e3RP.js"
	},
	"/assets/privacy-ClVqtr8A.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c79-0uI62YzC+D9iRvt8wZZ0e4U7XRQ\"",
		"mtime": "2026-09-03T05:29:38.787Z",
		"size": 3193,
		"path": "../public/assets/privacy-ClVqtr8A.js"
	},
	"/assets/profile-D1GL5JAV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7d1b-hR1Dh30mTsWV3wI25IeaibyDNdE\"",
		"mtime": "2026-09-03T05:29:38.787Z",
		"size": 32027,
		"path": "../public/assets/profile-D1GL5JAV.js"
	},
	"/assets/profiles-map-BqIzEUC0.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"32a-nHFNmPiHQAycZOOfphch2nkP4bg\"",
		"mtime": "2026-09-03T05:29:38.787Z",
		"size": 810,
		"path": "../public/assets/profiles-map-BqIzEUC0.js"
	},
	"/assets/purify.es-ChwZkWde.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"68bc-bPPRDEosU/Lqj+2Oyi1ue22LViM\"",
		"mtime": "2026-09-03T05:29:38.787Z",
		"size": 26812,
		"path": "../public/assets/purify.es-ChwZkWde.js"
	},
	"/assets/react-dom-BS6Gh_TR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e08-9bSgZZ4q4Ni+kAtZEKfL9G1hHrE\"",
		"mtime": "2026-09-03T05:29:38.787Z",
		"size": 3592,
		"path": "../public/assets/react-dom-BS6Gh_TR.js"
	},
	"/assets/redirect-DtIAAt0y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e1-KhpEIx1LNSnb7dNYxiNI58wV9MY\"",
		"mtime": "2026-09-03T05:29:38.788Z",
		"size": 481,
		"path": "../public/assets/redirect-DtIAAt0y.js"
	},
	"/assets/reel-2-D6ICrDT7.jpg": {
		"type": "image/jpeg",
		"etag": "\"1d3c4-QU1Rig2/vTeF6slkXtMXSVa68U0\"",
		"mtime": "2026-09-03T05:29:38.801Z",
		"size": 119748,
		"path": "../public/assets/reel-2-D6ICrDT7.jpg"
	},
	"/assets/reel-3-BYUKUHRv.jpg": {
		"type": "image/jpeg",
		"etag": "\"8bae-hivl0InXk3Rn4aAy5LSO54t+UZE\"",
		"mtime": "2026-09-03T05:29:38.804Z",
		"size": 35758,
		"path": "../public/assets/reel-3-BYUKUHRv.jpg"
	},
	"/assets/reels-CP5DnZJ3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"300a-5VhLJwisQDRVhQldd5fxP7GpNzM\"",
		"mtime": "2026-09-03T05:29:38.788Z",
		"size": 12298,
		"path": "../public/assets/reels-CP5DnZJ3.js"
	},
	"/assets/reset-password-Z_xqC3LP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"52a-B22WJdKeEi1Sf2vgQfQ8Z9HrctQ\"",
		"mtime": "2026-09-03T05:29:38.788Z",
		"size": 1322,
		"path": "../public/assets/reset-password-Z_xqC3LP.js"
	},
	"/assets/rolldown-runtime-hePW80VL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2cc-fA8td6k29UVF6JoPfhOPkceTK1M\"",
		"mtime": "2026-09-03T05:29:38.788Z",
		"size": 716,
		"path": "../public/assets/rolldown-runtime-hePW80VL.js"
	},
	"/assets/root-DLTE-HSj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20-vSYConOtSP6ciwr9zKsPixNwWmc\"",
		"mtime": "2026-09-03T05:29:38.788Z",
		"size": 32,
		"path": "../public/assets/root-DLTE-HSj.js"
	},
	"/assets/route-D3FKis5-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8c-QQF2x17taIzk2iQdJUg/CzxBg3M\"",
		"mtime": "2026-09-03T05:29:38.788Z",
		"size": 140,
		"path": "../public/assets/route-D3FKis5-.js"
	},
	"/assets/routes-BDcqiMy7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8626-t6Sej/FrVJLNgO0DNhtXcq4HWDc\"",
		"mtime": "2026-09-03T05:29:38.789Z",
		"size": 34342,
		"path": "../public/assets/routes-BDcqiMy7.js"
	},
	"/assets/scan-face-CM2bv4DP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a5-2sX7qfOwFGs4b0QZiHDo+LUoaas\"",
		"mtime": "2026-09-03T05:29:38.789Z",
		"size": 421,
		"path": "../public/assets/scan-face-CM2bv4DP.js"
	},
	"/assets/search-RiQ4pbhY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2cdc-MhBl665FtmTurcc6OQb8cvYyUd4\"",
		"mtime": "2026-09-03T05:29:38.789Z",
		"size": 11484,
		"path": "../public/assets/search-RiQ4pbhY.js"
	},
	"/assets/settings-2-x6U2komm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fc-airYhkVLobsDhkRjcuibMjh1Kz4\"",
		"mtime": "2026-09-03T05:29:38.789Z",
		"size": 252,
		"path": "../public/assets/settings-2-x6U2komm.js"
	},
	"/assets/settings-63gKAQz_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e7-H6UEAhV97AbbPJvTM0mgapeyVN4\"",
		"mtime": "2026-09-03T05:29:38.789Z",
		"size": 487,
		"path": "../public/assets/settings-63gKAQz_.js"
	},
	"/assets/sheet-BS3M7d9I.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8a3-rzAIaSFoH/lpNiC3unUwy1ff6tM\"",
		"mtime": "2026-09-03T05:29:38.789Z",
		"size": 2211,
		"path": "../public/assets/sheet-BS3M7d9I.js"
	},
	"/assets/shield-TvVcHHSx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"190-IQZ0HXDtipzveT7dmmgPX6/2kng\"",
		"mtime": "2026-09-03T05:29:38.790Z",
		"size": 400,
		"path": "../public/assets/shield-TvVcHHSx.js"
	},
	"/assets/shield-check-DbLP09Mr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"140-kO2Skvjk1wqz1iVSYj10tG7kAAg\"",
		"mtime": "2026-09-03T05:29:38.790Z",
		"size": 320,
		"path": "../public/assets/shield-check-DbLP09Mr.js"
	},
	"/assets/square-nG_BaMNK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"93-N5UoPnJn75SEYhz/11HKB4AH68Y\"",
		"mtime": "2026-09-03T05:29:38.790Z",
		"size": 147,
		"path": "../public/assets/square-nG_BaMNK.js"
	},
	"/assets/storage-upload-CJCdUhHQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13b7-0xGHUVaYE5PH170dxI4jVgPa0Wc\"",
		"mtime": "2026-09-03T05:29:38.790Z",
		"size": 5047,
		"path": "../public/assets/storage-upload-CJCdUhHQ.js"
	},
	"/assets/styles-DvC5Kgeq.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"33abb-SfJH/06v0sZBXsDgd6GP1gAHkIQ\"",
		"mtime": "2026-09-03T05:29:38.805Z",
		"size": 211643,
		"path": "../public/assets/styles-DvC5Kgeq.css"
	},
	"/assets/reel-1-DgXdxb9U.jpg": {
		"type": "image/jpeg",
		"etag": "\"158de-632G9IqzPFNj16hyS2vSq2z3WoA\"",
		"mtime": "2026-09-03T05:29:38.799Z",
		"size": 88286,
		"path": "../public/assets/reel-1-DgXdxb9U.jpg"
	},
	"/assets/switch-CzQdEh9o.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1109-ZnS37M00HnI5MGxHw9JB9blVPLA\"",
		"mtime": "2026-09-03T05:29:38.790Z",
		"size": 4361,
		"path": "../public/assets/switch-CzQdEh9o.js"
	},
	"/assets/terms-D5clwnd8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"df8-HPUc9cKkPW68c6qWU5Otv/3swqI\"",
		"mtime": "2026-09-03T05:29:38.790Z",
		"size": 3576,
		"path": "../public/assets/terms-D5clwnd8.js"
	},
	"/assets/textarea-DcD53ihc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"230-1ARRs+Osx6y1PiHKBOJW4EqJbjU\"",
		"mtime": "2026-09-03T05:29:38.790Z",
		"size": 560,
		"path": "../public/assets/textarea-DcD53ihc.js"
	},
	"/assets/triangle-alert-B2hpeTrU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109-hAh5bu7wpC/dyrDkPv2HRWFdK0E\"",
		"mtime": "2026-09-03T05:29:38.791Z",
		"size": 265,
		"path": "../public/assets/triangle-alert-B2hpeTrU.js"
	},
	"/assets/u._userId-DS8JV1oh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16cf-68xENbsXu5Sy0gRCm+3h63KKuaM\"",
		"mtime": "2026-09-03T05:29:38.791Z",
		"size": 5839,
		"path": "../public/assets/u._userId-DS8JV1oh.js"
	},
	"/assets/useMatch-CG_Qo4VA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"26c-mf+6Kl2KU/dZTKCvH3wHxYMjLA8\"",
		"mtime": "2026-09-03T05:29:38.791Z",
		"size": 620,
		"path": "../public/assets/useMatch-CG_Qo4VA.js"
	},
	"/assets/useRouter-BP8vT1kh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f38-UAwyZ71XUq5pvhwLvcQ+ekWdEeM\"",
		"mtime": "2026-09-03T05:29:38.791Z",
		"size": 7992,
		"path": "../public/assets/useRouter-BP8vT1kh.js"
	},
	"/assets/useServerFn-CzzciFve.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19d-Q2chUu1zNyiLPgJ8BU4VVAVaG7A\"",
		"mtime": "2026-09-03T05:29:38.792Z",
		"size": 413,
		"path": "../public/assets/useServerFn-CzzciFve.js"
	},
	"/assets/useStore-Bwiy6pX7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"786-iVUaSoWn1x0ZE/FkYImHA2AwxQw\"",
		"mtime": "2026-09-03T05:29:38.792Z",
		"size": 1926,
		"path": "../public/assets/useStore-Bwiy6pX7.js"
	},
	"/assets/video-data-DO9UYinV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"210f-HcjGSewJCy/A7pEmUjJGKOBVW8E\"",
		"mtime": "2026-09-03T05:29:38.792Z",
		"size": 8463,
		"path": "../public/assets/video-data-DO9UYinV.js"
	},
	"/assets/video._videoId-cNV0zjYa.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"26b0-rnMD9E8BXAmxprcLx2Y+2gQv1Lk\"",
		"mtime": "2026-09-03T05:29:38.793Z",
		"size": 9904,
		"path": "../public/assets/video._videoId-cNV0zjYa.js"
	},
	"/assets/video.upload-ShaxgzpI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"264e-9i9v/LIHME1rgKFXFJPZ5+buZCk\"",
		"mtime": "2026-09-03T05:29:38.793Z",
		"size": 9806,
		"path": "../public/assets/video.upload-ShaxgzpI.js"
	},
	"/assets/wallet-behQYZeg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6509f-LbidYWGKK1oD2T2CpMiGSldyS/g\"",
		"mtime": "2026-09-03T05:29:38.793Z",
		"size": 413855,
		"path": "../public/assets/wallet-behQYZeg.js"
	},
	"/assets/yw-data-Bd96njiI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85-tVhY2OnWfg4oPW2g2MxJpBstjUk\"",
		"mtime": "2026-09-03T05:29:38.797Z",
		"size": 133,
		"path": "../public/assets/yw-data-Bd96njiI.js"
	},
	"/assets/yw-download-DwNrhE_c.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"511-/EgO3q0AkwboSGQj5DEH2DCwOEE\"",
		"mtime": "2026-09-03T05:29:38.797Z",
		"size": 1297,
		"path": "../public/assets/yw-download-DwNrhE_c.js"
	},
	"/assets/yw-logo-BXjnypdM.png": {
		"type": "image/png",
		"etag": "\"b8bf9-XKz0DAyp9GBS6zs069mBfmp0ubE\"",
		"mtime": "2026-09-03T05:29:38.807Z",
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
