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
		"mtime": "2026-09-02T10:56:41.503Z",
		"size": 163,
		"path": "../public/favicon.svg"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"16-iUOtJ2RsHfdY9DoQxaq0wz1LZCU\"",
		"mtime": "2026-09-02T10:56:41.503Z",
		"size": 22,
		"path": "../public/robots.txt"
	},
	"/assets/Avatar-BxolxfnM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"225-6CBmt7+aJEUaLVgs7LmW2rOPh0E\"",
		"mtime": "2026-09-02T10:56:38.699Z",
		"size": 549,
		"path": "../public/assets/Avatar-BxolxfnM.js"
	},
	"/assets/ChannelContentList-CY9QEmfC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"58e-J3f6n0wm/eK12V6uEXuSZWl+UVY\"",
		"mtime": "2026-09-02T10:56:38.699Z",
		"size": 1422,
		"path": "../public/assets/ChannelContentList-CY9QEmfC.js"
	},
	"/assets/ClientOnly-BLQ6U6R8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13f-j0SNX9405wGpvG+wmmJESUTpnZI\"",
		"mtime": "2026-09-02T10:56:38.699Z",
		"size": 319,
		"path": "../public/assets/ClientOnly-BLQ6U6R8.js"
	},
	"/assets/FollowListDialog-DoBjV7IJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16f5-qYty3VWYDr/yEQA2g6Hqr33dhG8\"",
		"mtime": "2026-09-02T10:56:38.699Z",
		"size": 5877,
		"path": "../public/assets/FollowListDialog-DoBjV7IJ.js"
	},
	"/assets/LiveLocationSheet-DOEQf777.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"139d-fDJOD5d4uh10qIdGyaao5MdPLsk\"",
		"mtime": "2026-09-02T10:56:38.699Z",
		"size": 5021,
		"path": "../public/assets/LiveLocationSheet-DOEQf777.js"
	},
	"/assets/ShareSheet-B8FyCxDg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a2ed-4jU5RVa9/zYmGjovYvUebaTAE3o\"",
		"mtime": "2026-09-02T10:56:38.699Z",
		"size": 41709,
		"path": "../public/assets/ShareSheet-B8FyCxDg.js"
	},
	"/assets/account-BzpJw_i7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5b18-y4ln3szOyVt4eP8SHmmAO2j+lYU\"",
		"mtime": "2026-09-02T10:56:38.699Z",
		"size": 23320,
		"path": "../public/assets/account-BzpJw_i7.js"
	},
	"/assets/VideoPoster-CAWHwyqn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"491d-cNFH0jXt6J/yDnvpTKVa3QzAI10\"",
		"mtime": "2026-09-02T10:56:38.699Z",
		"size": 18717,
		"path": "../public/assets/VideoPoster-CAWHwyqn.js"
	},
	"/assets/alerts-count-DHSuNaMv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5fb-ylA9uzbMrqUws9vmDeouuy5XUEo\"",
		"mtime": "2026-09-02T10:56:38.699Z",
		"size": 1531,
		"path": "../public/assets/alerts-count-DHSuNaMv.js"
	},
	"/assets/button-BLcesfyB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"587-IRzRNzfoP7Ux8pwPO/GimwmPO4U\"",
		"mtime": "2026-09-02T10:56:38.700Z",
		"size": 1415,
		"path": "../public/assets/button-BLcesfyB.js"
	},
	"/assets/channel-data-DQkc7QBg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"dd4-zKljK1ti4WmBFREM2NfRLyAXK2Q\"",
		"mtime": "2026-09-02T10:56:38.700Z",
		"size": 3540,
		"path": "../public/assets/channel-data-DQkc7QBg.js"
	},
	"/assets/auth-ZWlB05Uu.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4bfd-PZQN2nf0LRdE9/HOh6Eu09cNm5I\"",
		"mtime": "2026-09-02T10:56:38.700Z",
		"size": 19453,
		"path": "../public/assets/auth-ZWlB05Uu.js"
	},
	"/assets/channel.analytics-C5AUo5nv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"692-amCs1bw7bHdXwXAOiqZHGkR+u+w\"",
		"mtime": "2026-09-02T10:56:38.700Z",
		"size": 1682,
		"path": "../public/assets/channel.analytics-C5AUo5nv.js"
	},
	"/assets/channel.monetization-Dnxy49Oy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9b8-XiTX2MGsrfLDHmTXZlaz95Um+M4\"",
		"mtime": "2026-09-02T10:56:38.700Z",
		"size": 2488,
		"path": "../public/assets/channel.monetization-Dnxy49Oy.js"
	},
	"/assets/channel.create-3hf9l6Eu.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1942-NDzTnru5siBqlVBbNfZnfOfeGQ8\"",
		"mtime": "2026-09-02T10:56:38.700Z",
		"size": 6466,
		"path": "../public/assets/channel.create-3hf9l6Eu.js"
	},
	"/assets/channel.posts-B2gSNQ3k.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11f-gOo6R5PeOjBWh5xrGrwC+rZLPLk\"",
		"mtime": "2026-09-02T10:56:38.700Z",
		"size": 287,
		"path": "../public/assets/channel.posts-B2gSNQ3k.js"
	},
	"/assets/channel.reels-mSbR7Bvd.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11f-itONlk/9RcPuWURofcrrGS8OZ1s\"",
		"mtime": "2026-09-02T10:56:38.700Z",
		"size": 287,
		"path": "../public/assets/channel.reels-mSbR7Bvd.js"
	},
	"/assets/channel.subscribers-B3D3GlEQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"542-QWrHVLicSKQ/aHLiqHBHc2/QWzo\"",
		"mtime": "2026-09-02T10:56:38.700Z",
		"size": 1346,
		"path": "../public/assets/channel.subscribers-B3D3GlEQ.js"
	},
	"/assets/channel.videos-BKmY_Ke9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"122-NckYBa9U5MrSus0NC1ogkBRqWOI\"",
		"mtime": "2026-09-02T10:56:38.700Z",
		"size": 290,
		"path": "../public/assets/channel.videos-BKmY_Ke9.js"
	},
	"/assets/chat-delete-D_ha7tQk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d6-IhZrxTirr014i4++zc6Dgi4JX/w\"",
		"mtime": "2026-09-02T10:56:38.700Z",
		"size": 1238,
		"path": "../public/assets/chat-delete-D_ha7tQk.js"
	},
	"/manifest.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"1ea-6VxqHNj9+exgLrKEoBUp7bg4ak0\"",
		"mtime": "2026-09-02T10:56:41.503Z",
		"size": 490,
		"path": "../public/manifest.webmanifest"
	},
	"/favicon.png": {
		"type": "image/png",
		"etag": "\"16c7-sHfgQvyMV/xhC2ahSs44WAoIC94\"",
		"mtime": "2026-09-02T10:56:41.503Z",
		"size": 5831,
		"path": "../public/favicon.png"
	},
	"/icon-512.png": {
		"type": "image/png",
		"etag": "\"10033-25w1u01xl/8gQOyAqgrSdkaxdio\"",
		"mtime": "2026-09-02T10:56:41.503Z",
		"size": 65587,
		"path": "../public/icon-512.png"
	},
	"/assets/chat.index-CQDUB70x.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"232e-aZ6pY/97/SKqMDyynU+o+h1XaNo\"",
		"mtime": "2026-09-02T10:56:38.700Z",
		"size": 9006,
		"path": "../public/assets/chat.index-CQDUB70x.js"
	},
	"/assets/chevron-left-DCWi8AFo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"82-Nyvjp0DClAKo4jztQSU4y179D+s\"",
		"mtime": "2026-09-02T10:56:38.701Z",
		"size": 130,
		"path": "../public/assets/chevron-left-DCWi8AFo.js"
	},
	"/assets/client-Crb0DbGz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"33944-0qHfMClpy1zoBqW+bwkMXim3Sgo\"",
		"mtime": "2026-09-02T10:56:38.701Z",
		"size": 211268,
		"path": "../public/assets/client-Crb0DbGz.js"
	},
	"/assets/createLucideIcon-zYGWgMV3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d5-q/IYz1LzVgYGf/TuxC8seyNvMeM\"",
		"mtime": "2026-09-02T10:56:38.701Z",
		"size": 1237,
		"path": "../public/assets/createLucideIcon-zYGWgMV3.js"
	},
	"/assets/createServerFn-Begb0GFt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1144-zkErKUqp6CRnNV5SK3DOra02Zsc\"",
		"mtime": "2026-09-02T10:56:38.701Z",
		"size": 4420,
		"path": "../public/assets/createServerFn-Begb0GFt.js"
	},
	"/assets/dialog-DvmezJsw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7a6-tEp2k6DAjDuzRJA0HQE+ApU3ANU\"",
		"mtime": "2026-09-02T10:56:38.701Z",
		"size": 1958,
		"path": "../public/assets/dialog-DvmezJsw.js"
	},
	"/assets/dist-7DHJbmHc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1cc7-WmlEqZx3QjHh6rMuq/jHoa40r6E\"",
		"mtime": "2026-09-02T10:56:38.701Z",
		"size": 7367,
		"path": "../public/assets/dist-7DHJbmHc.js"
	},
	"/assets/copyright-policy-BIcrFUhN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"236d-EV5n37X2aPbWhIEnFb1nkJW/DZY\"",
		"mtime": "2026-09-02T10:56:38.701Z",
		"size": 9069,
		"path": "../public/assets/copyright-policy-BIcrFUhN.js"
	},
	"/assets/dist-9_rQ_Grk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b66-ac4Zo3/Yjuo/arQBE7AOafHNEQo\"",
		"mtime": "2026-09-02T10:56:38.701Z",
		"size": 2918,
		"path": "../public/assets/dist-9_rQ_Grk.js"
	},
	"/assets/dist-BBs97vxf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6448-fldm3LWS6Q2nXcRmg40mS1jHNKM\"",
		"mtime": "2026-09-02T10:56:38.701Z",
		"size": 25672,
		"path": "../public/assets/dist-BBs97vxf.js"
	},
	"/assets/dist-ChhcN3pS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12ec-//hCpgxrdxHsUrHvyHTpVLeTtao\"",
		"mtime": "2026-09-02T10:56:38.701Z",
		"size": 4844,
		"path": "../public/assets/dist-ChhcN3pS.js"
	},
	"/assets/dist-DLQt2BcY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2a9-YZYgEHXuUd8kv7q1LqyYawzzkok\"",
		"mtime": "2026-09-02T10:56:38.701Z",
		"size": 681,
		"path": "../public/assets/dist-DLQt2BcY.js"
	},
	"/assets/dist-Djdv0oiS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1399-ihQxlrv+hH9tV+MdxDN6nQjmzbY\"",
		"mtime": "2026-09-02T10:56:38.702Z",
		"size": 5017,
		"path": "../public/assets/dist-Djdv0oiS.js"
	},
	"/assets/dist-yp-2tsEm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109b-fv193BiWFIE6I5aBGD0O54gtDIE\"",
		"mtime": "2026-09-02T10:56:38.702Z",
		"size": 4251,
		"path": "../public/assets/dist-yp-2tsEm.js"
	},
	"/assets/ellipsis-DJa7oDhq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e2-oM+1pCz1H9Iz76NYx8Bi8JeXN7A\"",
		"mtime": "2026-09-02T10:56:38.702Z",
		"size": 226,
		"path": "../public/assets/ellipsis-DJa7oDhq.js"
	},
	"/assets/es2015--DrBlcKE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6190-jP+wsDeJlMMXZLV/wlo95YsSNZw\"",
		"mtime": "2026-09-02T10:56:38.702Z",
		"size": 24976,
		"path": "../public/assets/es2015--DrBlcKE.js"
	},
	"/assets/geo-data-CYKNiDfb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6ce-DiXeUwOVv3S5GUs0RTxhIQieJkk\"",
		"mtime": "2026-09-02T10:56:38.702Z",
		"size": 1742,
		"path": "../public/assets/geo-data-CYKNiDfb.js"
	},
	"/assets/eye-DI6Zkgpx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"100-uvX4r8l9otdsHr/G9bhXYGwdLwI\"",
		"mtime": "2026-09-02T10:56:38.702Z",
		"size": 256,
		"path": "../public/assets/eye-DI6Zkgpx.js"
	},
	"/assets/image-plus-BEyUefMp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16b-jM/otUDosKLzeNczaPUhwq6ohjw\"",
		"mtime": "2026-09-02T10:56:38.702Z",
		"size": 363,
		"path": "../public/assets/image-plus-BEyUefMp.js"
	},
	"/assets/html2canvas-DCcDvdvP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"30b50-/NW/tvs1950d+adFAmG+0O5qROc\"",
		"mtime": "2026-09-02T10:56:38.702Z",
		"size": 199504,
		"path": "../public/assets/html2canvas-DCcDvdvP.js"
	},
	"/assets/index.es-YPlwZlKk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24f8c-vr4BjPacLlGBTgJYH08FEY+lJcU\"",
		"mtime": "2026-09-02T10:56:38.702Z",
		"size": 151436,
		"path": "../public/assets/index.es-YPlwZlKk.js"
	},
	"/assets/index-CJYyf1r9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a5192-eU6vrQ1qF9J/PTCkTSf62PGfyyE\"",
		"mtime": "2026-09-02T10:56:38.694Z",
		"size": 676242,
		"path": "../public/assets/index-CJYyf1r9.js"
	},
	"/assets/input-BGTiluOP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"296-5rTk1JivvCtkaU7xlnfm2k6wQLc\"",
		"mtime": "2026-09-02T10:56:38.702Z",
		"size": 662,
		"path": "../public/assets/input-BGTiluOP.js"
	},
	"/assets/invariant-DrlDULPJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ce1-ZRQDfkQPt4jYb9usOOHjNrKdLto\"",
		"mtime": "2026-09-02T10:56:38.703Z",
		"size": 3297,
		"path": "../public/assets/invariant-DrlDULPJ.js"
	},
	"/assets/dist-WVJl43E9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"282-jiv2RkXmSxVfV3VTdCf0h8WxTZw\"",
		"mtime": "2026-09-02T10:56:38.702Z",
		"size": 642,
		"path": "../public/assets/dist-WVJl43E9.js"
	},
	"/assets/matchContext-BLaZZjXw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b8-BSjivHXemCqEV+wXXsCe5P0ODLQ\"",
		"mtime": "2026-09-02T10:56:38.703Z",
		"size": 184,
		"path": "../public/assets/matchContext-BLaZZjXw.js"
	},
	"/assets/moment._momentId-C6LV2qXl.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3e5b-l4PRwIRH2Ioov4pw1Eilkat9i5E\"",
		"mtime": "2026-09-02T10:56:38.703Z",
		"size": 15963,
		"path": "../public/assets/moment._momentId-C6LV2qXl.js"
	},
	"/assets/moment.index-BYrymzD7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c22-3/ZbeZMbig4RmUfrJg9OugwZcSg\"",
		"mtime": "2026-09-02T10:56:38.703Z",
		"size": 3106,
		"path": "../public/assets/moment.index-BYrymzD7.js"
	},
	"/assets/navigation-C8MoOCIK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"94-7DknCKydA7aq83O7EnlD43AHz04\"",
		"mtime": "2026-09-02T10:56:38.703Z",
		"size": 148,
		"path": "../public/assets/navigation-C8MoOCIK.js"
	},
	"/assets/link-DS1dcRyo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3feb-TtYfNRNFNE5e7QSTbP8vYKNJ8SM\"",
		"mtime": "2026-09-02T10:56:38.703Z",
		"size": 16363,
		"path": "../public/assets/link-DS1dcRyo.js"
	},
	"/assets/not-found-DIgawKw1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"37-RTB6YH5iXRKeXz1Sn6ZQ+vS0lnc\"",
		"mtime": "2026-09-02T10:56:38.703Z",
		"size": 55,
		"path": "../public/assets/not-found-DIgawKw1.js"
	},
	"/assets/notifications-B9Mr7uiY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"17e6-JDIa8D2iMN0mTaTq/qtmdQ7GU7M\"",
		"mtime": "2026-09-02T10:56:38.703Z",
		"size": 6118,
		"path": "../public/assets/notifications-B9Mr7uiY.js"
	},
	"/assets/orbit-5QjfaZoU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f5-74FeK183bxVqwxvRCn65SCeWxTk\"",
		"mtime": "2026-09-02T10:56:38.703Z",
		"size": 2293,
		"path": "../public/assets/orbit-5QjfaZoU.js"
	},
	"/assets/orbit-match-CoOKF8us.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a94-azt/2e4NA8xs3YLrhgeO+1vAeW4\"",
		"mtime": "2026-09-02T10:56:38.703Z",
		"size": 2708,
		"path": "../public/assets/orbit-match-CoOKF8us.js"
	},
	"/assets/orbit-mood-D1SQ3wAI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4f8-0OOOjx3oF76Cb8sSgFsOxSYcYUs\"",
		"mtime": "2026-09-02T10:56:38.703Z",
		"size": 1272,
		"path": "../public/assets/orbit-mood-D1SQ3wAI.js"
	},
	"/assets/orbit-store-C2ktuQca.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3107-mgGz7rK/K9iHBu5ZPPZ6rSdD/NU\"",
		"mtime": "2026-09-02T10:56:38.703Z",
		"size": 12551,
		"path": "../public/assets/orbit-store-C2ktuQca.js"
	},
	"/assets/orbit._profileId-Cc7Cb1Ux.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2832-6YZMsQqiaAnfTaBBHNx88fOASfg\"",
		"mtime": "2026-09-02T10:56:38.703Z",
		"size": 10290,
		"path": "../public/assets/orbit._profileId-Cc7Cb1Ux.js"
	},
	"/assets/orbit.chat._userId-Ca0CuJSc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9ae0-l7e78/jDjncYX8n3Jpe/HO/tKPs\"",
		"mtime": "2026-09-02T10:56:38.703Z",
		"size": 39648,
		"path": "../public/assets/orbit.chat._userId-Ca0CuJSc.js"
	},
	"/assets/orbit.create-B8VV2qeb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"84a0-l0oMODjQSnH7LsxM7V3KUkKsiVs\"",
		"mtime": "2026-09-02T10:56:38.704Z",
		"size": 33952,
		"path": "../public/assets/orbit.create-B8VV2qeb.js"
	},
	"/assets/orbit.index-rudagyaq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"72f5-2b7OyMeKBMI82tIYtEAfepHWmpc\"",
		"mtime": "2026-09-02T10:56:38.704Z",
		"size": 29429,
		"path": "../public/assets/orbit.index-rudagyaq.js"
	},
	"/assets/orbit.me-I7EY20Zk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1929-+hSTyqZp3eC5zQgBCy/T/qPotXM\"",
		"mtime": "2026-09-02T10:56:38.704Z",
		"size": 6441,
		"path": "../public/assets/orbit.me-I7EY20Zk.js"
	},
	"/assets/orbit.messages-Cs8wZSft.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"337f-q1XaOAwZGi9zmJcTqEzfYih9bto\"",
		"mtime": "2026-09-02T10:56:38.704Z",
		"size": 13183,
		"path": "../public/assets/orbit.messages-Cs8wZSft.js"
	},
	"/assets/orbit.notifications-BW1p5blf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cd9-E7r/5SMWDhiv4fs1USjtnaZ4a5o\"",
		"mtime": "2026-09-02T10:56:38.704Z",
		"size": 3289,
		"path": "../public/assets/orbit.notifications-BW1p5blf.js"
	},
	"/assets/orbit.privacy-BrwrIq4k.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3b97-r3Ljgffe7ZkjN10yOXLb7ZhsuVo\"",
		"mtime": "2026-09-02T10:56:38.704Z",
		"size": 15255,
		"path": "../public/assets/orbit.privacy-BrwrIq4k.js"
	},
	"/assets/pin-BeE_zRtQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"31a-l5uaPsRPR+8pJDClvFJdvEKdlT4\"",
		"mtime": "2026-09-02T10:56:38.704Z",
		"size": 794,
		"path": "../public/assets/pin-BeE_zRtQ.js"
	},
	"/assets/post-1-uxYyj4Yn.jpg": {
		"type": "image/jpeg",
		"etag": "\"2621b-tADwOglKGR4PvLgzJyB6lOA0+b8\"",
		"mtime": "2026-09-02T10:56:38.707Z",
		"size": 156187,
		"path": "../public/assets/post-1-uxYyj4Yn.jpg"
	},
	"/assets/post.create-REX9dcLV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15b5-iB7RlcYmyvvJXxWTLufEMSC7sCQ\"",
		"mtime": "2026-09-02T10:56:38.704Z",
		"size": 5557,
		"path": "../public/assets/post.create-REX9dcLV.js"
	},
	"/assets/privacy-DHCvRh7A.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c79-XDdiwFGRwKsQ3KHQcAIoGw0beng\"",
		"mtime": "2026-09-02T10:56:38.704Z",
		"size": 3193,
		"path": "../public/assets/privacy-DHCvRh7A.js"
	},
	"/assets/profile-BiHzUXZC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7d15-epays+EvAcIj4IhgUilz08oF3u4\"",
		"mtime": "2026-09-02T10:56:38.704Z",
		"size": 32021,
		"path": "../public/assets/profile-BiHzUXZC.js"
	},
	"/assets/profiles-map-DZTYV8dt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"32a-wtDk8K9VD943FpPOAXE/q6f65Pg\"",
		"mtime": "2026-09-02T10:56:38.704Z",
		"size": 810,
		"path": "../public/assets/profiles-map-DZTYV8dt.js"
	},
	"/assets/purify.es-ChwZkWde.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"68bc-bPPRDEosU/Lqj+2Oyi1ue22LViM\"",
		"mtime": "2026-09-02T10:56:38.704Z",
		"size": 26812,
		"path": "../public/assets/purify.es-ChwZkWde.js"
	},
	"/assets/react-dom-BS6Gh_TR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e08-9bSgZZ4q4Ni+kAtZEKfL9G1hHrE\"",
		"mtime": "2026-09-02T10:56:38.704Z",
		"size": 3592,
		"path": "../public/assets/react-dom-BS6Gh_TR.js"
	},
	"/assets/redirect-DtIAAt0y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e1-KhpEIx1LNSnb7dNYxiNI58wV9MY\"",
		"mtime": "2026-09-02T10:56:38.705Z",
		"size": 481,
		"path": "../public/assets/redirect-DtIAAt0y.js"
	},
	"/assets/reel-1-DgXdxb9U.jpg": {
		"type": "image/jpeg",
		"etag": "\"158de-632G9IqzPFNj16hyS2vSq2z3WoA\"",
		"mtime": "2026-09-02T10:56:38.707Z",
		"size": 88286,
		"path": "../public/assets/reel-1-DgXdxb9U.jpg"
	},
	"/assets/reel-3-BYUKUHRv.jpg": {
		"type": "image/jpeg",
		"etag": "\"8bae-hivl0InXk3Rn4aAy5LSO54t+UZE\"",
		"mtime": "2026-09-02T10:56:38.707Z",
		"size": 35758,
		"path": "../public/assets/reel-3-BYUKUHRv.jpg"
	},
	"/assets/reels-B1a4ul-q.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3009-6xWlDczrhYJH21t8T+OsfxxbKAE\"",
		"mtime": "2026-09-02T10:56:38.705Z",
		"size": 12297,
		"path": "../public/assets/reels-B1a4ul-q.js"
	},
	"/assets/reel-2-D6ICrDT7.jpg": {
		"type": "image/jpeg",
		"etag": "\"1d3c4-QU1Rig2/vTeF6slkXtMXSVa68U0\"",
		"mtime": "2026-09-02T10:56:38.707Z",
		"size": 119748,
		"path": "../public/assets/reel-2-D6ICrDT7.jpg"
	},
	"/assets/reset-password--cqYoRQ5.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"52a-GsVDOXDBw4TgFlASCiNlrpqtiaE\"",
		"mtime": "2026-09-02T10:56:38.705Z",
		"size": 1322,
		"path": "../public/assets/reset-password--cqYoRQ5.js"
	},
	"/assets/rolldown-runtime-hePW80VL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2cc-fA8td6k29UVF6JoPfhOPkceTK1M\"",
		"mtime": "2026-09-02T10:56:38.705Z",
		"size": 716,
		"path": "../public/assets/rolldown-runtime-hePW80VL.js"
	},
	"/assets/root-DLTE-HSj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20-vSYConOtSP6ciwr9zKsPixNwWmc\"",
		"mtime": "2026-09-02T10:56:38.705Z",
		"size": 32,
		"path": "../public/assets/root-DLTE-HSj.js"
	},
	"/assets/route-D9L05631.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8c-chLxgAWJeXcItV8852Hw3Y8eqhA\"",
		"mtime": "2026-09-02T10:56:38.705Z",
		"size": 140,
		"path": "../public/assets/route-D9L05631.js"
	},
	"/assets/routes-DQCtbR_2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85f9-IZTxGSNWvoy5m5mCH5OxDOwf3Q4\"",
		"mtime": "2026-09-02T10:56:38.705Z",
		"size": 34297,
		"path": "../public/assets/routes-DQCtbR_2.js"
	},
	"/assets/scan-face-CM2bv4DP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a5-2sX7qfOwFGs4b0QZiHDo+LUoaas\"",
		"mtime": "2026-09-02T10:56:38.705Z",
		"size": 421,
		"path": "../public/assets/scan-face-CM2bv4DP.js"
	},
	"/assets/search-DeJyDIt3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2c8b-N3ecmnH3rTGexuJqo7banYBiR9Q\"",
		"mtime": "2026-09-02T10:56:38.705Z",
		"size": 11403,
		"path": "../public/assets/search-DeJyDIt3.js"
	},
	"/assets/settings-2-x6U2komm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fc-airYhkVLobsDhkRjcuibMjh1Kz4\"",
		"mtime": "2026-09-02T10:56:38.705Z",
		"size": 252,
		"path": "../public/assets/settings-2-x6U2komm.js"
	},
	"/assets/settings-63gKAQz_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e7-H6UEAhV97AbbPJvTM0mgapeyVN4\"",
		"mtime": "2026-09-02T10:56:38.705Z",
		"size": 487,
		"path": "../public/assets/settings-63gKAQz_.js"
	},
	"/assets/sheet-D2Sm2cbw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8a3-wY2eZ0qhkqENfxcZQQse8S4bPtw\"",
		"mtime": "2026-09-02T10:56:38.706Z",
		"size": 2211,
		"path": "../public/assets/sheet-D2Sm2cbw.js"
	},
	"/assets/shield-TvVcHHSx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"190-IQZ0HXDtipzveT7dmmgPX6/2kng\"",
		"mtime": "2026-09-02T10:56:38.706Z",
		"size": 400,
		"path": "../public/assets/shield-TvVcHHSx.js"
	},
	"/assets/shield-check-DbLP09Mr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"140-kO2Skvjk1wqz1iVSYj10tG7kAAg\"",
		"mtime": "2026-09-02T10:56:38.706Z",
		"size": 320,
		"path": "../public/assets/shield-check-DbLP09Mr.js"
	},
	"/assets/square-nG_BaMNK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"93-N5UoPnJn75SEYhz/11HKB4AH68Y\"",
		"mtime": "2026-09-02T10:56:38.706Z",
		"size": 147,
		"path": "../public/assets/square-nG_BaMNK.js"
	},
	"/assets/styles-BT4BsmZ3.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"33a86-lXGAk1lAYnD3fBE8EscNvVL21l0\"",
		"mtime": "2026-09-02T10:56:38.708Z",
		"size": 211590,
		"path": "../public/assets/styles-BT4BsmZ3.css"
	},
	"/assets/switch-BoleDrDn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1109-kIDBgxLODDbW/XQN5G6wO6D/oKE\"",
		"mtime": "2026-09-02T10:56:38.706Z",
		"size": 4361,
		"path": "../public/assets/switch-BoleDrDn.js"
	},
	"/assets/terms-D308obja.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"df8-6n68gDMlOUqLU0QIc6cTVpMOKAw\"",
		"mtime": "2026-09-02T10:56:38.706Z",
		"size": 3576,
		"path": "../public/assets/terms-D308obja.js"
	},
	"/assets/textarea-BV1tietX.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"230-iocTXmieBPEPrZulMegGFPidlpc\"",
		"mtime": "2026-09-02T10:56:38.706Z",
		"size": 560,
		"path": "../public/assets/textarea-BV1tietX.js"
	},
	"/assets/triangle-alert-B2hpeTrU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109-hAh5bu7wpC/dyrDkPv2HRWFdK0E\"",
		"mtime": "2026-09-02T10:56:38.706Z",
		"size": 265,
		"path": "../public/assets/triangle-alert-B2hpeTrU.js"
	},
	"/assets/useRouter-BP8vT1kh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f38-UAwyZ71XUq5pvhwLvcQ+ekWdEeM\"",
		"mtime": "2026-09-02T10:56:38.706Z",
		"size": 7992,
		"path": "../public/assets/useRouter-BP8vT1kh.js"
	},
	"/assets/useServerFn-CzzciFve.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19d-Q2chUu1zNyiLPgJ8BU4VVAVaG7A\"",
		"mtime": "2026-09-02T10:56:38.706Z",
		"size": 413,
		"path": "../public/assets/useServerFn-CzzciFve.js"
	},
	"/assets/useStore-Bwiy6pX7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"786-iVUaSoWn1x0ZE/FkYImHA2AwxQw\"",
		"mtime": "2026-09-02T10:56:38.706Z",
		"size": 1926,
		"path": "../public/assets/useStore-Bwiy6pX7.js"
	},
	"/assets/useMatch-CG_Qo4VA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"26c-mf+6Kl2KU/dZTKCvH3wHxYMjLA8\"",
		"mtime": "2026-09-02T10:56:38.706Z",
		"size": 620,
		"path": "../public/assets/useMatch-CG_Qo4VA.js"
	},
	"/assets/video-data-_K3WWELw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a2e-Uyzi4ZY0GydtDG1umFlBXYNgCyE\"",
		"mtime": "2026-09-02T10:56:38.706Z",
		"size": 6702,
		"path": "../public/assets/video-data-_K3WWELw.js"
	},
	"/assets/video._videoId-tsosiP9S.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2688-rcZWm1Gx2+SGNK6N6A+SJa/hCrw\"",
		"mtime": "2026-09-02T10:56:38.706Z",
		"size": 9864,
		"path": "../public/assets/video._videoId-tsosiP9S.js"
	},
	"/assets/video.upload-ZycKfm5q.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"264e-XUv3ZzZSy+6IrTUM7tR52oWMrcg\"",
		"mtime": "2026-09-02T10:56:38.707Z",
		"size": 9806,
		"path": "../public/assets/video.upload-ZycKfm5q.js"
	},
	"/assets/u._userId-GVdbE25N.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16d4-UZyZyWNOPanD5LEZ0uGT5fSe1KU\"",
		"mtime": "2026-09-02T10:56:38.706Z",
		"size": 5844,
		"path": "../public/assets/u._userId-GVdbE25N.js"
	},
	"/assets/yw-data-Bd96njiI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85-tVhY2OnWfg4oPW2g2MxJpBstjUk\"",
		"mtime": "2026-09-02T10:56:38.707Z",
		"size": 133,
		"path": "../public/assets/yw-data-Bd96njiI.js"
	},
	"/assets/yw-download-DwNrhE_c.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"511-/EgO3q0AkwboSGQj5DEH2DCwOEE\"",
		"mtime": "2026-09-02T10:56:38.707Z",
		"size": 1297,
		"path": "../public/assets/yw-download-DwNrhE_c.js"
	},
	"/assets/yw-logo-BXjnypdM.png": {
		"type": "image/png",
		"etag": "\"b8bf9-XKz0DAyp9GBS6zs069mBfmp0ubE\"",
		"mtime": "2026-09-02T10:56:38.708Z",
		"size": 756729,
		"path": "../public/assets/yw-logo-BXjnypdM.png"
	},
	"/assets/wallet-CiCBdgu7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"650bf-JF7NUCrfgw7omcKDh461OxmC4Ww\"",
		"mtime": "2026-09-02T10:56:38.707Z",
		"size": 413887,
		"path": "../public/assets/wallet-CiCBdgu7.js"
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
