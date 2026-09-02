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
		"mtime": "2026-09-02T13:55:17.592Z",
		"size": 163,
		"path": "../public/favicon.svg"
	},
	"/manifest.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"1ea-6VxqHNj9+exgLrKEoBUp7bg4ak0\"",
		"mtime": "2026-09-02T13:55:17.592Z",
		"size": 490,
		"path": "../public/manifest.webmanifest"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"16-iUOtJ2RsHfdY9DoQxaq0wz1LZCU\"",
		"mtime": "2026-09-02T13:55:17.592Z",
		"size": 22,
		"path": "../public/robots.txt"
	},
	"/assets/Avatar-DMWg8ePJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"225-rBPfnJCwDOiG0jcaeF3tio8pAbU\"",
		"mtime": "2026-09-02T13:55:15.403Z",
		"size": 549,
		"path": "../public/assets/Avatar-DMWg8ePJ.js"
	},
	"/assets/ChannelContentList-DwVvHu9L.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"58e-dTudPRuv0OLbsfHgwVGjxBOyfGw\"",
		"mtime": "2026-09-02T13:55:15.403Z",
		"size": 1422,
		"path": "../public/assets/ChannelContentList-DwVvHu9L.js"
	},
	"/assets/ClientOnly-BLQ6U6R8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13f-j0SNX9405wGpvG+wmmJESUTpnZI\"",
		"mtime": "2026-09-02T13:55:15.403Z",
		"size": 319,
		"path": "../public/assets/ClientOnly-BLQ6U6R8.js"
	},
	"/assets/FollowListDialog-GQh6kAqz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16f5-LmljqDX2K7FvSrv1bV2Ys4Hp2fQ\"",
		"mtime": "2026-09-02T13:55:15.403Z",
		"size": 5877,
		"path": "../public/assets/FollowListDialog-GQh6kAqz.js"
	},
	"/assets/LiveLocationSheet-D00FP1EW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"139d-pYcKJ1pZgl3bSIPYPqbBrKGEyWA\"",
		"mtime": "2026-09-02T13:55:15.403Z",
		"size": 5021,
		"path": "../public/assets/LiveLocationSheet-D00FP1EW.js"
	},
	"/assets/ShareSheet-D1Zg6aek.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a2ed-H+tQQ7nag0RAQu8zncP712NjiNg\"",
		"mtime": "2026-09-02T13:55:15.403Z",
		"size": 41709,
		"path": "../public/assets/ShareSheet-D1Zg6aek.js"
	},
	"/assets/VideoPoster-MyP0BvAY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"491d-oWL5BYsOMf46R0M4+hyFUYLwJGg\"",
		"mtime": "2026-09-02T13:55:15.403Z",
		"size": 18717,
		"path": "../public/assets/VideoPoster-MyP0BvAY.js"
	},
	"/assets/alerts-count-DHSuNaMv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5fb-ylA9uzbMrqUws9vmDeouuy5XUEo\"",
		"mtime": "2026-09-02T13:55:15.403Z",
		"size": 1531,
		"path": "../public/assets/alerts-count-DHSuNaMv.js"
	},
	"/assets/auth-D5wGuyoF.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"218c-uVVpDmrNmNTwnzbBNYQlAbgdxl8\"",
		"mtime": "2026-09-02T13:55:15.403Z",
		"size": 8588,
		"path": "../public/assets/auth-D5wGuyoF.js"
	},
	"/assets/button-BweNGZ7U.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"587-AvM2ON3iyj+kJbdK6SRl2upQGu4\"",
		"mtime": "2026-09-02T13:55:15.404Z",
		"size": 1415,
		"path": "../public/assets/button-BweNGZ7U.js"
	},
	"/assets/channel-data-D91ePqT7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e46-KFt62NRFYBHOA2naqS3Y5f3eEmQ\"",
		"mtime": "2026-09-02T13:55:15.404Z",
		"size": 3654,
		"path": "../public/assets/channel-data-D91ePqT7.js"
	},
	"/assets/account-bY3lSZtz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5b18-ugA4MXJVPSGrqcSltHLp1cv3n08\"",
		"mtime": "2026-09-02T13:55:15.403Z",
		"size": 23320,
		"path": "../public/assets/account-bY3lSZtz.js"
	},
	"/assets/channel.analytics-Cr791_c_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"692-eWxHPsUjJZfUbOEP2QwuHds904o\"",
		"mtime": "2026-09-02T13:55:15.404Z",
		"size": 1682,
		"path": "../public/assets/channel.analytics-Cr791_c_.js"
	},
	"/assets/channel.create-DTo8o9db.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1942-SA++cPZYjj4qN2iz1g7CSyOMuyo\"",
		"mtime": "2026-09-02T13:55:15.404Z",
		"size": 6466,
		"path": "../public/assets/channel.create-DTo8o9db.js"
	},
	"/assets/channel.monetization-Bi_eIPnd.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9b8-ePGAkfZk4zhSEi8dPGERpwfxFOU\"",
		"mtime": "2026-09-02T13:55:15.404Z",
		"size": 2488,
		"path": "../public/assets/channel.monetization-Bi_eIPnd.js"
	},
	"/assets/channel.posts-2twncCgN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11f-nUVYBZ9Wbj2Pkv/7q8+91Yi8FqE\"",
		"mtime": "2026-09-02T13:55:15.404Z",
		"size": 287,
		"path": "../public/assets/channel.posts-2twncCgN.js"
	},
	"/assets/channel.reels-DailgkYb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11f-6y/gyDcgiAa5ZE8prcGtEJIQ3LA\"",
		"mtime": "2026-09-02T13:55:15.404Z",
		"size": 287,
		"path": "../public/assets/channel.reels-DailgkYb.js"
	},
	"/assets/channel.subscribers-B8JSGozF.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"542-EMh4OdGZokny0HxX27Q2YNlEizQ\"",
		"mtime": "2026-09-02T13:55:15.404Z",
		"size": 1346,
		"path": "../public/assets/channel.subscribers-B8JSGozF.js"
	},
	"/assets/channel.videos-BU598PO2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"122-ZyG3g27JMb1u14lC7dUV0FSqfc0\"",
		"mtime": "2026-09-02T13:55:15.404Z",
		"size": 290,
		"path": "../public/assets/channel.videos-BU598PO2.js"
	},
	"/icon-512.png": {
		"type": "image/png",
		"etag": "\"10033-25w1u01xl/8gQOyAqgrSdkaxdio\"",
		"mtime": "2026-09-02T13:55:17.592Z",
		"size": 65587,
		"path": "../public/icon-512.png"
	},
	"/assets/chat-delete-D_ha7tQk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d6-IhZrxTirr014i4++zc6Dgi4JX/w\"",
		"mtime": "2026-09-02T13:55:15.404Z",
		"size": 1238,
		"path": "../public/assets/chat-delete-D_ha7tQk.js"
	},
	"/favicon.png": {
		"type": "image/png",
		"etag": "\"16c7-sHfgQvyMV/xhC2ahSs44WAoIC94\"",
		"mtime": "2026-09-02T13:55:17.592Z",
		"size": 5831,
		"path": "../public/favicon.png"
	},
	"/assets/chat.index-V-9kqS-P.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"232e-Q4pfdputbKbWbZUT8n7FqPYcS7s\"",
		"mtime": "2026-09-02T13:55:15.404Z",
		"size": 9006,
		"path": "../public/assets/chat.index-V-9kqS-P.js"
	},
	"/assets/chevron-left-DCWi8AFo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"82-Nyvjp0DClAKo4jztQSU4y179D+s\"",
		"mtime": "2026-09-02T13:55:15.404Z",
		"size": 130,
		"path": "../public/assets/chevron-left-DCWi8AFo.js"
	},
	"/assets/client-Crb0DbGz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"33944-0qHfMClpy1zoBqW+bwkMXim3Sgo\"",
		"mtime": "2026-09-02T13:55:15.404Z",
		"size": 211268,
		"path": "../public/assets/client-Crb0DbGz.js"
	},
	"/assets/copyright-policy-CNBhrJa_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"236d-jXrNPy2NERyEhPGTILhqbv7O1fs\"",
		"mtime": "2026-09-02T13:55:15.404Z",
		"size": 9069,
		"path": "../public/assets/copyright-policy-CNBhrJa_.js"
	},
	"/assets/createLucideIcon-zYGWgMV3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d5-q/IYz1LzVgYGf/TuxC8seyNvMeM\"",
		"mtime": "2026-09-02T13:55:15.404Z",
		"size": 1237,
		"path": "../public/assets/createLucideIcon-zYGWgMV3.js"
	},
	"/assets/createServerFn-DdqwDp2t.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1144-HxHpKw+ZDzbU+Ej7oY0N9FFKa4o\"",
		"mtime": "2026-09-02T13:55:15.404Z",
		"size": 4420,
		"path": "../public/assets/createServerFn-DdqwDp2t.js"
	},
	"/assets/dialog-D7WfFBCK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7a6-Y0evETjUgpmONkW5SCGYVCZ4NM4\"",
		"mtime": "2026-09-02T13:55:15.404Z",
		"size": 1958,
		"path": "../public/assets/dialog-D7WfFBCK.js"
	},
	"/assets/dist-7DHJbmHc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1cc7-WmlEqZx3QjHh6rMuq/jHoa40r6E\"",
		"mtime": "2026-09-02T13:55:15.404Z",
		"size": 7367,
		"path": "../public/assets/dist-7DHJbmHc.js"
	},
	"/assets/dist-9_rQ_Grk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b66-ac4Zo3/Yjuo/arQBE7AOafHNEQo\"",
		"mtime": "2026-09-02T13:55:15.404Z",
		"size": 2918,
		"path": "../public/assets/dist-9_rQ_Grk.js"
	},
	"/assets/dist-BBs97vxf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6448-fldm3LWS6Q2nXcRmg40mS1jHNKM\"",
		"mtime": "2026-09-02T13:55:15.404Z",
		"size": 25672,
		"path": "../public/assets/dist-BBs97vxf.js"
	},
	"/assets/dist-BLQT0aCw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"282-rjiG/1KotnpeAMF878CFJqtugmM\"",
		"mtime": "2026-09-02T13:55:15.405Z",
		"size": 642,
		"path": "../public/assets/dist-BLQT0aCw.js"
	},
	"/assets/dist-ChhcN3pS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12ec-//hCpgxrdxHsUrHvyHTpVLeTtao\"",
		"mtime": "2026-09-02T13:55:15.405Z",
		"size": 4844,
		"path": "../public/assets/dist-ChhcN3pS.js"
	},
	"/assets/dist-DLQt2BcY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2a9-YZYgEHXuUd8kv7q1LqyYawzzkok\"",
		"mtime": "2026-09-02T13:55:15.405Z",
		"size": 681,
		"path": "../public/assets/dist-DLQt2BcY.js"
	},
	"/assets/dist-Djdv0oiS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1399-ihQxlrv+hH9tV+MdxDN6nQjmzbY\"",
		"mtime": "2026-09-02T13:55:15.405Z",
		"size": 5017,
		"path": "../public/assets/dist-Djdv0oiS.js"
	},
	"/assets/dist-yp-2tsEm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109b-fv193BiWFIE6I5aBGD0O54gtDIE\"",
		"mtime": "2026-09-02T13:55:15.405Z",
		"size": 4251,
		"path": "../public/assets/dist-yp-2tsEm.js"
	},
	"/assets/ellipsis-DJa7oDhq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e2-oM+1pCz1H9Iz76NYx8Bi8JeXN7A\"",
		"mtime": "2026-09-02T13:55:15.405Z",
		"size": 226,
		"path": "../public/assets/ellipsis-DJa7oDhq.js"
	},
	"/assets/es2015--DrBlcKE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6190-jP+wsDeJlMMXZLV/wlo95YsSNZw\"",
		"mtime": "2026-09-02T13:55:15.405Z",
		"size": 24976,
		"path": "../public/assets/es2015--DrBlcKE.js"
	},
	"/assets/eye-DI6Zkgpx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"100-uvX4r8l9otdsHr/G9bhXYGwdLwI\"",
		"mtime": "2026-09-02T13:55:15.405Z",
		"size": 256,
		"path": "../public/assets/eye-DI6Zkgpx.js"
	},
	"/assets/geo-data-CYKNiDfb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6ce-DiXeUwOVv3S5GUs0RTxhIQieJkk\"",
		"mtime": "2026-09-02T13:55:15.405Z",
		"size": 1742,
		"path": "../public/assets/geo-data-CYKNiDfb.js"
	},
	"/assets/html2canvas-DCcDvdvP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"30b50-/NW/tvs1950d+adFAmG+0O5qROc\"",
		"mtime": "2026-09-02T13:55:15.405Z",
		"size": 199504,
		"path": "../public/assets/html2canvas-DCcDvdvP.js"
	},
	"/assets/image-plus-BEyUefMp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16b-jM/otUDosKLzeNczaPUhwq6ohjw\"",
		"mtime": "2026-09-02T13:55:15.405Z",
		"size": 363,
		"path": "../public/assets/image-plus-BEyUefMp.js"
	},
	"/assets/index.es-Bj03PUZJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24f8c-xeYhLBtbXLELBCfhuT6cIJ0nXAU\"",
		"mtime": "2026-09-02T13:55:15.405Z",
		"size": 151436,
		"path": "../public/assets/index.es-Bj03PUZJ.js"
	},
	"/assets/input-D8hI2UWX.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"296-JmwBLHF52FCJHX9pLGsHSceWnfI\"",
		"mtime": "2026-09-02T13:55:15.405Z",
		"size": 662,
		"path": "../public/assets/input-D8hI2UWX.js"
	},
	"/assets/index-vH6ALGJ_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a52ba-+IiR1B7C4y4eiOWSrKs/HYZkSeg\"",
		"mtime": "2026-09-02T13:55:15.401Z",
		"size": 676538,
		"path": "../public/assets/index-vH6ALGJ_.js"
	},
	"/assets/invariant-DrlDULPJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ce1-ZRQDfkQPt4jYb9usOOHjNrKdLto\"",
		"mtime": "2026-09-02T13:55:15.405Z",
		"size": 3297,
		"path": "../public/assets/invariant-DrlDULPJ.js"
	},
	"/assets/link-DS1dcRyo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3feb-TtYfNRNFNE5e7QSTbP8vYKNJ8SM\"",
		"mtime": "2026-09-02T13:55:15.406Z",
		"size": 16363,
		"path": "../public/assets/link-DS1dcRyo.js"
	},
	"/assets/moment._momentId-CgGcUF2y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3e5b-bGfkijmQQfWXY0k865DGvccQS4g\"",
		"mtime": "2026-09-02T13:55:15.406Z",
		"size": 15963,
		"path": "../public/assets/moment._momentId-CgGcUF2y.js"
	},
	"/assets/moment.index-BAaCq2M_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c22-EPGQ3aSHsAFaZDaRoE23oOFqtm0\"",
		"mtime": "2026-09-02T13:55:15.406Z",
		"size": 3106,
		"path": "../public/assets/moment.index-BAaCq2M_.js"
	},
	"/assets/navigation-C8MoOCIK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"94-7DknCKydA7aq83O7EnlD43AHz04\"",
		"mtime": "2026-09-02T13:55:15.406Z",
		"size": 148,
		"path": "../public/assets/navigation-C8MoOCIK.js"
	},
	"/assets/not-found-DIgawKw1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"37-RTB6YH5iXRKeXz1Sn6ZQ+vS0lnc\"",
		"mtime": "2026-09-02T13:55:15.406Z",
		"size": 55,
		"path": "../public/assets/not-found-DIgawKw1.js"
	},
	"/assets/notifications-9fZY_cvJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"17e6-FwUxFa0hgeiDO7gcq31pGhzK0fc\"",
		"mtime": "2026-09-02T13:55:15.406Z",
		"size": 6118,
		"path": "../public/assets/notifications-9fZY_cvJ.js"
	},
	"/assets/orbit-Dyhpxkv4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f5-IoyNllBSWOPeJ5qIdyV9WANY6W8\"",
		"mtime": "2026-09-02T13:55:15.406Z",
		"size": 2293,
		"path": "../public/assets/orbit-Dyhpxkv4.js"
	},
	"/assets/orbit-mood-D1SQ3wAI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4f8-0OOOjx3oF76Cb8sSgFsOxSYcYUs\"",
		"mtime": "2026-09-02T13:55:15.406Z",
		"size": 1272,
		"path": "../public/assets/orbit-mood-D1SQ3wAI.js"
	},
	"/assets/orbit-store-tLKMoktc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3107-VYqH5vlJL4CZOjuBgHViV5ilOnU\"",
		"mtime": "2026-09-02T13:55:15.406Z",
		"size": 12551,
		"path": "../public/assets/orbit-store-tLKMoktc.js"
	},
	"/assets/orbit._profileId-DSX3Fvro.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2832-Qf3MTIH7aAM3jMihDnW+E55/KdU\"",
		"mtime": "2026-09-02T13:55:15.406Z",
		"size": 10290,
		"path": "../public/assets/orbit._profileId-DSX3Fvro.js"
	},
	"/assets/orbit.create-ugMolobx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"84a0-VXKCtuuIGE+sZuI5eSQAtXPI2Mg\"",
		"mtime": "2026-09-02T13:55:15.406Z",
		"size": 33952,
		"path": "../public/assets/orbit.create-ugMolobx.js"
	},
	"/assets/matchContext-BLaZZjXw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b8-BSjivHXemCqEV+wXXsCe5P0ODLQ\"",
		"mtime": "2026-09-02T13:55:15.406Z",
		"size": 184,
		"path": "../public/assets/matchContext-BLaZZjXw.js"
	},
	"/assets/orbit.index-BRw-tJne.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"72f5-HJFgEHkzoatT0Vi9Nw0kLJcTTTg\"",
		"mtime": "2026-09-02T13:55:15.406Z",
		"size": 29429,
		"path": "../public/assets/orbit.index-BRw-tJne.js"
	},
	"/assets/orbit-match-CoOKF8us.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a94-azt/2e4NA8xs3YLrhgeO+1vAeW4\"",
		"mtime": "2026-09-02T13:55:15.406Z",
		"size": 2708,
		"path": "../public/assets/orbit-match-CoOKF8us.js"
	},
	"/assets/orbit.me-CCW1pfTS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1929-M8dPyv9REYwaRkps000O/3DDf58\"",
		"mtime": "2026-09-02T13:55:15.406Z",
		"size": 6441,
		"path": "../public/assets/orbit.me-CCW1pfTS.js"
	},
	"/assets/orbit.messages-BliUiI9-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"337f-7SBy+fOLb2bnTz1hRUBollxvzx8\"",
		"mtime": "2026-09-02T13:55:15.406Z",
		"size": 13183,
		"path": "../public/assets/orbit.messages-BliUiI9-.js"
	},
	"/assets/orbit.notifications-BwKRT-PA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cd9-bLrde4mN7YFfL50G93zyCw/Z4c8\"",
		"mtime": "2026-09-02T13:55:15.406Z",
		"size": 3289,
		"path": "../public/assets/orbit.notifications-BwKRT-PA.js"
	},
	"/assets/orbit.chat._userId-CWX9Z1qe.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9ae0-gaAssQABkTZl79gprFghHI9MlPo\"",
		"mtime": "2026-09-02T13:55:15.406Z",
		"size": 39648,
		"path": "../public/assets/orbit.chat._userId-CWX9Z1qe.js"
	},
	"/assets/orbit.privacy-QrL1_KsL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3b97-b4JifYHQeoam87REkxrv9iVaQzI\"",
		"mtime": "2026-09-02T13:55:15.407Z",
		"size": 15255,
		"path": "../public/assets/orbit.privacy-QrL1_KsL.js"
	},
	"/assets/pin-BeE_zRtQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"31a-l5uaPsRPR+8pJDClvFJdvEKdlT4\"",
		"mtime": "2026-09-02T13:55:15.407Z",
		"size": 794,
		"path": "../public/assets/pin-BeE_zRtQ.js"
	},
	"/assets/post.create-URPlkAuv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15b5-C8KfCSU0a2yXU0vDTZFZ3hstz30\"",
		"mtime": "2026-09-02T13:55:15.407Z",
		"size": 5557,
		"path": "../public/assets/post.create-URPlkAuv.js"
	},
	"/assets/privacy-9vxN7ikw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c79-qsn6c4oK+/u+YRdPjZnVonNZV3I\"",
		"mtime": "2026-09-02T13:55:15.407Z",
		"size": 3193,
		"path": "../public/assets/privacy-9vxN7ikw.js"
	},
	"/assets/post-1-uxYyj4Yn.jpg": {
		"type": "image/jpeg",
		"etag": "\"2621b-tADwOglKGR4PvLgzJyB6lOA0+b8\"",
		"mtime": "2026-09-02T13:55:15.409Z",
		"size": 156187,
		"path": "../public/assets/post-1-uxYyj4Yn.jpg"
	},
	"/assets/profile-Bqp891zw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7d15-4ieQbJETW/3DIDsAaK4jKTUnbmQ\"",
		"mtime": "2026-09-02T13:55:15.407Z",
		"size": 32021,
		"path": "../public/assets/profile-Bqp891zw.js"
	},
	"/assets/profiles-map-DZTYV8dt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"32a-wtDk8K9VD943FpPOAXE/q6f65Pg\"",
		"mtime": "2026-09-02T13:55:15.407Z",
		"size": 810,
		"path": "../public/assets/profiles-map-DZTYV8dt.js"
	},
	"/assets/purify.es-ChwZkWde.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"68bc-bPPRDEosU/Lqj+2Oyi1ue22LViM\"",
		"mtime": "2026-09-02T13:55:15.407Z",
		"size": 26812,
		"path": "../public/assets/purify.es-ChwZkWde.js"
	},
	"/assets/redirect-DtIAAt0y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e1-KhpEIx1LNSnb7dNYxiNI58wV9MY\"",
		"mtime": "2026-09-02T13:55:15.407Z",
		"size": 481,
		"path": "../public/assets/redirect-DtIAAt0y.js"
	},
	"/assets/react-dom-BS6Gh_TR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e08-9bSgZZ4q4Ni+kAtZEKfL9G1hHrE\"",
		"mtime": "2026-09-02T13:55:15.407Z",
		"size": 3592,
		"path": "../public/assets/react-dom-BS6Gh_TR.js"
	},
	"/assets/reel-2-D6ICrDT7.jpg": {
		"type": "image/jpeg",
		"etag": "\"1d3c4-QU1Rig2/vTeF6slkXtMXSVa68U0\"",
		"mtime": "2026-09-02T13:55:15.410Z",
		"size": 119748,
		"path": "../public/assets/reel-2-D6ICrDT7.jpg"
	},
	"/assets/reel-1-DgXdxb9U.jpg": {
		"type": "image/jpeg",
		"etag": "\"158de-632G9IqzPFNj16hyS2vSq2z3WoA\"",
		"mtime": "2026-09-02T13:55:15.410Z",
		"size": 88286,
		"path": "../public/assets/reel-1-DgXdxb9U.jpg"
	},
	"/assets/reel-3-BYUKUHRv.jpg": {
		"type": "image/jpeg",
		"etag": "\"8bae-hivl0InXk3Rn4aAy5LSO54t+UZE\"",
		"mtime": "2026-09-02T13:55:15.410Z",
		"size": 35758,
		"path": "../public/assets/reel-3-BYUKUHRv.jpg"
	},
	"/assets/reels-CAT9b_XX.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3009-iO/SAR1rxVYB2lfrXG9UfYUFT3s\"",
		"mtime": "2026-09-02T13:55:15.407Z",
		"size": 12297,
		"path": "../public/assets/reels-CAT9b_XX.js"
	},
	"/assets/reset-password-CsuVFocD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"52a-JWgpBCdR/QjExPze6QdXAqfYKKA\"",
		"mtime": "2026-09-02T13:55:15.407Z",
		"size": 1322,
		"path": "../public/assets/reset-password-CsuVFocD.js"
	},
	"/assets/rolldown-runtime-hePW80VL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2cc-fA8td6k29UVF6JoPfhOPkceTK1M\"",
		"mtime": "2026-09-02T13:55:15.407Z",
		"size": 716,
		"path": "../public/assets/rolldown-runtime-hePW80VL.js"
	},
	"/assets/root-DLTE-HSj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20-vSYConOtSP6ciwr9zKsPixNwWmc\"",
		"mtime": "2026-09-02T13:55:15.407Z",
		"size": 32,
		"path": "../public/assets/root-DLTE-HSj.js"
	},
	"/assets/route-DoG2w3-N.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8c-vF4OHLCq6FUW8kGayATlm2CClqo\"",
		"mtime": "2026-09-02T13:55:15.407Z",
		"size": 140,
		"path": "../public/assets/route-DoG2w3-N.js"
	},
	"/assets/routes-CrItBbKU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85f9-NvMxGGjyKSolGyGVYqbi791nRps\"",
		"mtime": "2026-09-02T13:55:15.407Z",
		"size": 34297,
		"path": "../public/assets/routes-CrItBbKU.js"
	},
	"/assets/search-D9hK6XxE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2cdc-nF5LXezomXnppS72HWerNipTVBI\"",
		"mtime": "2026-09-02T13:55:15.407Z",
		"size": 11484,
		"path": "../public/assets/search-D9hK6XxE.js"
	},
	"/assets/scan-face-CM2bv4DP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a5-2sX7qfOwFGs4b0QZiHDo+LUoaas\"",
		"mtime": "2026-09-02T13:55:15.407Z",
		"size": 421,
		"path": "../public/assets/scan-face-CM2bv4DP.js"
	},
	"/assets/settings-2-x6U2komm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fc-airYhkVLobsDhkRjcuibMjh1Kz4\"",
		"mtime": "2026-09-02T13:55:15.408Z",
		"size": 252,
		"path": "../public/assets/settings-2-x6U2komm.js"
	},
	"/assets/settings-63gKAQz_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e7-H6UEAhV97AbbPJvTM0mgapeyVN4\"",
		"mtime": "2026-09-02T13:55:15.408Z",
		"size": 487,
		"path": "../public/assets/settings-63gKAQz_.js"
	},
	"/assets/sheet-B6SknDfn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8a3-4Qe5OQRkl0MiuKtQY7DM5Y0Dp28\"",
		"mtime": "2026-09-02T13:55:15.408Z",
		"size": 2211,
		"path": "../public/assets/sheet-B6SknDfn.js"
	},
	"/assets/shield-TvVcHHSx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"190-IQZ0HXDtipzveT7dmmgPX6/2kng\"",
		"mtime": "2026-09-02T13:55:15.408Z",
		"size": 400,
		"path": "../public/assets/shield-TvVcHHSx.js"
	},
	"/assets/shield-check-DbLP09Mr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"140-kO2Skvjk1wqz1iVSYj10tG7kAAg\"",
		"mtime": "2026-09-02T13:55:15.408Z",
		"size": 320,
		"path": "../public/assets/shield-check-DbLP09Mr.js"
	},
	"/assets/square-nG_BaMNK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"93-N5UoPnJn75SEYhz/11HKB4AH68Y\"",
		"mtime": "2026-09-02T13:55:15.408Z",
		"size": 147,
		"path": "../public/assets/square-nG_BaMNK.js"
	},
	"/assets/styles-DvC5Kgeq.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"33abb-SfJH/06v0sZBXsDgd6GP1gAHkIQ\"",
		"mtime": "2026-09-02T13:55:15.410Z",
		"size": 211643,
		"path": "../public/assets/styles-DvC5Kgeq.css"
	},
	"/assets/switch-CI_9swbH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1109-h4kwsrKNbH3rthcnZhvpA8KAjTY\"",
		"mtime": "2026-09-02T13:55:15.408Z",
		"size": 4361,
		"path": "../public/assets/switch-CI_9swbH.js"
	},
	"/assets/terms-DGh-pvVD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"df8-pqOV87kPwKMYHAil8WDWKJTPYrs\"",
		"mtime": "2026-09-02T13:55:15.408Z",
		"size": 3576,
		"path": "../public/assets/terms-DGh-pvVD.js"
	},
	"/assets/textarea-CKi3eetq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"230-0dMDTZN4JsNyFQxGBzvz20lpvNA\"",
		"mtime": "2026-09-02T13:55:15.408Z",
		"size": 560,
		"path": "../public/assets/textarea-CKi3eetq.js"
	},
	"/assets/triangle-alert-B2hpeTrU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109-hAh5bu7wpC/dyrDkPv2HRWFdK0E\"",
		"mtime": "2026-09-02T13:55:15.409Z",
		"size": 265,
		"path": "../public/assets/triangle-alert-B2hpeTrU.js"
	},
	"/assets/u._userId-DaztJymp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16d4-zkWa9ZaZL8LUV3kJ+T9OL7F2Ee0\"",
		"mtime": "2026-09-02T13:55:15.409Z",
		"size": 5844,
		"path": "../public/assets/u._userId-DaztJymp.js"
	},
	"/assets/useRouter-BP8vT1kh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f38-UAwyZ71XUq5pvhwLvcQ+ekWdEeM\"",
		"mtime": "2026-09-02T13:55:15.409Z",
		"size": 7992,
		"path": "../public/assets/useRouter-BP8vT1kh.js"
	},
	"/assets/useMatch-CG_Qo4VA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"26c-mf+6Kl2KU/dZTKCvH3wHxYMjLA8\"",
		"mtime": "2026-09-02T13:55:15.409Z",
		"size": 620,
		"path": "../public/assets/useMatch-CG_Qo4VA.js"
	},
	"/assets/useServerFn-CzzciFve.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19d-Q2chUu1zNyiLPgJ8BU4VVAVaG7A\"",
		"mtime": "2026-09-02T13:55:15.409Z",
		"size": 413,
		"path": "../public/assets/useServerFn-CzzciFve.js"
	},
	"/assets/useStore-Bwiy6pX7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"786-iVUaSoWn1x0ZE/FkYImHA2AwxQw\"",
		"mtime": "2026-09-02T13:55:15.409Z",
		"size": 1926,
		"path": "../public/assets/useStore-Bwiy6pX7.js"
	},
	"/assets/video-data-BexNVb7W.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a2e-gZIIPak+PmpmpUusVqEPo+/lQ4Q\"",
		"mtime": "2026-09-02T13:55:15.409Z",
		"size": 6702,
		"path": "../public/assets/video-data-BexNVb7W.js"
	},
	"/assets/video._videoId-Bsx5Ka9n.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2688-HrE2XKYBrqQDqCr0u6h0eTQ7v2Y\"",
		"mtime": "2026-09-02T13:55:15.409Z",
		"size": 9864,
		"path": "../public/assets/video._videoId-Bsx5Ka9n.js"
	},
	"/assets/video.upload-CvuitOy2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"264e-DqnYJkZIcRlRDpsAnCkHtXlbcG0\"",
		"mtime": "2026-09-02T13:55:15.409Z",
		"size": 9806,
		"path": "../public/assets/video.upload-CvuitOy2.js"
	},
	"/assets/wallet-1XZPa64g.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"650bf-y8J/HU2sWhkKgBdcsFLIkRjIgTE\"",
		"mtime": "2026-09-02T13:55:15.409Z",
		"size": 413887,
		"path": "../public/assets/wallet-1XZPa64g.js"
	},
	"/assets/yw-data-Bd96njiI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85-tVhY2OnWfg4oPW2g2MxJpBstjUk\"",
		"mtime": "2026-09-02T13:55:15.409Z",
		"size": 133,
		"path": "../public/assets/yw-data-Bd96njiI.js"
	},
	"/assets/yw-download-DwNrhE_c.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"511-/EgO3q0AkwboSGQj5DEH2DCwOEE\"",
		"mtime": "2026-09-02T13:55:15.409Z",
		"size": 1297,
		"path": "../public/assets/yw-download-DwNrhE_c.js"
	},
	"/assets/yw-logo-BXjnypdM.png": {
		"type": "image/png",
		"etag": "\"b8bf9-XKz0DAyp9GBS6zs069mBfmp0ubE\"",
		"mtime": "2026-09-02T13:55:15.410Z",
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
