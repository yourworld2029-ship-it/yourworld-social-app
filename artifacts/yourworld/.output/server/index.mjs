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
		"mtime": "2026-09-02T11:31:46.461Z",
		"size": 163,
		"path": "../public/favicon.svg"
	},
	"/manifest.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"1ea-6VxqHNj9+exgLrKEoBUp7bg4ak0\"",
		"mtime": "2026-09-02T11:31:46.461Z",
		"size": 490,
		"path": "../public/manifest.webmanifest"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"16-iUOtJ2RsHfdY9DoQxaq0wz1LZCU\"",
		"mtime": "2026-09-02T11:31:46.462Z",
		"size": 22,
		"path": "../public/robots.txt"
	},
	"/assets/Avatar-Dn9WXBwH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"225-O4rA2ZVMwqN8+w8Lx7GQhXLgS90\"",
		"mtime": "2026-09-02T11:31:43.529Z",
		"size": 549,
		"path": "../public/assets/Avatar-Dn9WXBwH.js"
	},
	"/assets/ChannelContentList-DJMTioQr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"58e-uBtHli+OJpUNvpUS5CpaTfSTQZg\"",
		"mtime": "2026-09-02T11:31:43.530Z",
		"size": 1422,
		"path": "../public/assets/ChannelContentList-DJMTioQr.js"
	},
	"/assets/ClientOnly-BLQ6U6R8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13f-j0SNX9405wGpvG+wmmJESUTpnZI\"",
		"mtime": "2026-09-02T11:31:43.530Z",
		"size": 319,
		"path": "../public/assets/ClientOnly-BLQ6U6R8.js"
	},
	"/assets/FollowListDialog-CZb22Vzf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16f5-hPMtUjJEl+tOK16dQ/R1vI0OHyg\"",
		"mtime": "2026-09-02T11:31:43.530Z",
		"size": 5877,
		"path": "../public/assets/FollowListDialog-CZb22Vzf.js"
	},
	"/assets/LiveLocationSheet-CaajG0AM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"139d-arWbFM/jScLzP+MCmky64il6uRY\"",
		"mtime": "2026-09-02T11:31:43.530Z",
		"size": 5021,
		"path": "../public/assets/LiveLocationSheet-CaajG0AM.js"
	},
	"/assets/VideoPoster-Dlr1Jbz5.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"491d-Iv0sqHfOrbbZm4Az7wP8o3orGLc\"",
		"mtime": "2026-09-02T11:31:43.530Z",
		"size": 18717,
		"path": "../public/assets/VideoPoster-Dlr1Jbz5.js"
	},
	"/assets/ShareSheet-D4qVm5Ib.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a2ed-fuwSTEdrsa2bjGYpUo0L08mtND8\"",
		"mtime": "2026-09-02T11:31:43.530Z",
		"size": 41709,
		"path": "../public/assets/ShareSheet-D4qVm5Ib.js"
	},
	"/assets/alerts-count-DHSuNaMv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5fb-ylA9uzbMrqUws9vmDeouuy5XUEo\"",
		"mtime": "2026-09-02T11:31:43.530Z",
		"size": 1531,
		"path": "../public/assets/alerts-count-DHSuNaMv.js"
	},
	"/assets/auth-D_jmtrlL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4ef3-aaQ1KiDW0vvVQk39rWI5A5IDngU\"",
		"mtime": "2026-09-02T11:31:43.530Z",
		"size": 20211,
		"path": "../public/assets/auth-D_jmtrlL.js"
	},
	"/assets/button-BNOxETpn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"587-jrZPiQ8E6w9fTLFztYkUQ7LUFuA\"",
		"mtime": "2026-09-02T11:31:43.530Z",
		"size": 1415,
		"path": "../public/assets/button-BNOxETpn.js"
	},
	"/assets/account-PB0u08G4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5b18-PvkklOmMCGhUsN+oPBgTDMSrHog\"",
		"mtime": "2026-09-02T11:31:43.530Z",
		"size": 23320,
		"path": "../public/assets/account-PB0u08G4.js"
	},
	"/assets/channel-data-B4V4cFgo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e46-HyHuNG2JEheW+RCubfVL0114Z6A\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 3654,
		"path": "../public/assets/channel-data-B4V4cFgo.js"
	},
	"/assets/channel.analytics-D5j7sv02.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"692-4Hq/cSo82uSRKe5PCvBrvvz82qc\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 1682,
		"path": "../public/assets/channel.analytics-D5j7sv02.js"
	},
	"/assets/channel.create-B3zvgZNy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1942-lZhsVO2lB86yb1+jM1VssI6JEws\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 6466,
		"path": "../public/assets/channel.create-B3zvgZNy.js"
	},
	"/favicon.png": {
		"type": "image/png",
		"etag": "\"16c7-sHfgQvyMV/xhC2ahSs44WAoIC94\"",
		"mtime": "2026-09-02T11:31:46.461Z",
		"size": 5831,
		"path": "../public/favicon.png"
	},
	"/assets/channel.posts-DGSxsxg-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11f-LoIdpXQOLcUXxwn3Ax6iLzd8sEw\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 287,
		"path": "../public/assets/channel.posts-DGSxsxg-.js"
	},
	"/assets/channel.reels-BVTupMtm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11f-iKH39tzmR63Ey3nNfElDEFI9oJ8\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 287,
		"path": "../public/assets/channel.reels-BVTupMtm.js"
	},
	"/assets/channel.subscribers-D9FBvMeH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"542-9qh2PC7kODQdxFkaRLcPFm6eNCI\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 1346,
		"path": "../public/assets/channel.subscribers-D9FBvMeH.js"
	},
	"/assets/channel.videos-Cjnup2s-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"122-sF7RoHlTrTpzHGav7Et7AK9w4+8\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 290,
		"path": "../public/assets/channel.videos-Cjnup2s-.js"
	},
	"/assets/chat-delete-D_ha7tQk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d6-IhZrxTirr014i4++zc6Dgi4JX/w\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 1238,
		"path": "../public/assets/chat-delete-D_ha7tQk.js"
	},
	"/icon-512.png": {
		"type": "image/png",
		"etag": "\"10033-25w1u01xl/8gQOyAqgrSdkaxdio\"",
		"mtime": "2026-09-02T11:31:46.461Z",
		"size": 65587,
		"path": "../public/icon-512.png"
	},
	"/assets/channel.monetization-BF4q48_W.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9b8-F3mdSfXsw0Vz0zqz9Cin5fg2BWY\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 2488,
		"path": "../public/assets/channel.monetization-BF4q48_W.js"
	},
	"/assets/chat.index-D_pbBLti.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"232e-q6lhI1DoNyQR1yNal7ypZInJbJA\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 9006,
		"path": "../public/assets/chat.index-D_pbBLti.js"
	},
	"/assets/chevron-left-DlyFNyTL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"82-TLSJ9o76pP4849ZhGnlcPycPPKY\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 130,
		"path": "../public/assets/chevron-left-DlyFNyTL.js"
	},
	"/assets/client-Crb0DbGz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"33944-0qHfMClpy1zoBqW+bwkMXim3Sgo\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 211268,
		"path": "../public/assets/client-Crb0DbGz.js"
	},
	"/assets/copyright-policy-DwdXFj1N.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"236d-ruZHiYPvg3pcYddM5/atG8D5o44\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 9069,
		"path": "../public/assets/copyright-policy-DwdXFj1N.js"
	},
	"/assets/createLucideIcon-DPkGYVZz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"504-5NkKb79g7I1PawY0FRL0+SSBUyc\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 1284,
		"path": "../public/assets/createLucideIcon-DPkGYVZz.js"
	},
	"/assets/createServerFn-B_-vWw43.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1144-hQSA07VvyJeju4yYJawLod34ZsU\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 4420,
		"path": "../public/assets/createServerFn-B_-vWw43.js"
	},
	"/assets/dialog-Dy1eOGv4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7a6-7fdXBErcwsJtVSzz17upm/0Mqaw\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 1958,
		"path": "../public/assets/dialog-Dy1eOGv4.js"
	},
	"/assets/dist-7DHJbmHc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1cc7-WmlEqZx3QjHh6rMuq/jHoa40r6E\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 7367,
		"path": "../public/assets/dist-7DHJbmHc.js"
	},
	"/assets/dist-9_rQ_Grk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b66-ac4Zo3/Yjuo/arQBE7AOafHNEQo\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 2918,
		"path": "../public/assets/dist-9_rQ_Grk.js"
	},
	"/assets/dist-BBs97vxf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6448-fldm3LWS6Q2nXcRmg40mS1jHNKM\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 25672,
		"path": "../public/assets/dist-BBs97vxf.js"
	},
	"/assets/dist-ChhcN3pS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12ec-//hCpgxrdxHsUrHvyHTpVLeTtao\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 4844,
		"path": "../public/assets/dist-ChhcN3pS.js"
	},
	"/assets/dist-DLQt2BcY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2a9-YZYgEHXuUd8kv7q1LqyYawzzkok\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 681,
		"path": "../public/assets/dist-DLQt2BcY.js"
	},
	"/assets/dist-Djdv0oiS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1399-ihQxlrv+hH9tV+MdxDN6nQjmzbY\"",
		"mtime": "2026-09-02T11:31:43.531Z",
		"size": 5017,
		"path": "../public/assets/dist-Djdv0oiS.js"
	},
	"/assets/dist-hKyEoAj7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"282-+OzeMtoAhUvzFmFbOEnHna3isBo\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 642,
		"path": "../public/assets/dist-hKyEoAj7.js"
	},
	"/assets/dist-yp-2tsEm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109b-fv193BiWFIE6I5aBGD0O54gtDIE\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 4251,
		"path": "../public/assets/dist-yp-2tsEm.js"
	},
	"/assets/ellipsis-Cr25Q2rp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e2-/z6hkO4nQ6JnL/AGJfSp30X8aXM\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 226,
		"path": "../public/assets/ellipsis-Cr25Q2rp.js"
	},
	"/assets/eye-BK0UpyNG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"100-A33tXPvhIkn6WwjbSVDRD69KiNs\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 256,
		"path": "../public/assets/eye-BK0UpyNG.js"
	},
	"/assets/geo-data-CYKNiDfb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6ce-DiXeUwOVv3S5GUs0RTxhIQieJkk\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 1742,
		"path": "../public/assets/geo-data-CYKNiDfb.js"
	},
	"/assets/image-plus-CSVe9NIl.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16b-0oGlM4YXxER9PZej+TINHXJiRsk\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 363,
		"path": "../public/assets/image-plus-CSVe9NIl.js"
	},
	"/assets/html2canvas-DCcDvdvP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"30b50-/NW/tvs1950d+adFAmG+0O5qROc\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 199504,
		"path": "../public/assets/html2canvas-DCcDvdvP.js"
	},
	"/assets/index-D_cFauz7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a52bc-CaChP2mKNTet/wpsl1SkhRAF7kA\"",
		"mtime": "2026-09-02T11:31:43.525Z",
		"size": 676540,
		"path": "../public/assets/index-D_cFauz7.js"
	},
	"/assets/input-bSCds0el.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"296-AUauUJiaNZlGKwchdGxlApBvAEM\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 662,
		"path": "../public/assets/input-bSCds0el.js"
	},
	"/assets/link-BMHV4qGB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"400e-GXz/UXHS63w0ykbLf0SehAYKIek\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 16398,
		"path": "../public/assets/link-BMHV4qGB.js"
	},
	"/assets/es2015--DrBlcKE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6190-jP+wsDeJlMMXZLV/wlo95YsSNZw\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 24976,
		"path": "../public/assets/es2015--DrBlcKE.js"
	},
	"/assets/index.es-BMH7p1p4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24f8c-qPyfAxIlOeBILflEdXlXHDNh5CA\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 151436,
		"path": "../public/assets/index.es-BMH7p1p4.js"
	},
	"/assets/matchContext-BLaZZjXw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b8-BSjivHXemCqEV+wXXsCe5P0ODLQ\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 184,
		"path": "../public/assets/matchContext-BLaZZjXw.js"
	},
	"/assets/moment._momentId-VPxNVunw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3e5b-ZVfGjG24N12BAe7m9u7YZstWaBA\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 15963,
		"path": "../public/assets/moment._momentId-VPxNVunw.js"
	},
	"/assets/moment.index-CB_7HdWx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c22-n1AFWysY6iiIDT069YCaGSj7+VA\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 3106,
		"path": "../public/assets/moment.index-CB_7HdWx.js"
	},
	"/assets/navigation-DcHOYObD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"94-yeKBLJuye8MxqbggtJWvuAd4oI0\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 148,
		"path": "../public/assets/navigation-DcHOYObD.js"
	},
	"/assets/not-found-DIgawKw1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"37-RTB6YH5iXRKeXz1Sn6ZQ+vS0lnc\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 55,
		"path": "../public/assets/not-found-DIgawKw1.js"
	},
	"/assets/notifications-DivEuCjr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"17e6-I0PKbK5p/uQ+iZ8RE5y98hPrkfY\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 6118,
		"path": "../public/assets/notifications-DivEuCjr.js"
	},
	"/assets/orbit-GHQJuRUs.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f5-e3vZPmK/nkMe5L8nv6L1rJiTN9o\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 2293,
		"path": "../public/assets/orbit-GHQJuRUs.js"
	},
	"/assets/orbit-match-CoOKF8us.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a94-azt/2e4NA8xs3YLrhgeO+1vAeW4\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 2708,
		"path": "../public/assets/orbit-match-CoOKF8us.js"
	},
	"/assets/orbit-mood-D1SQ3wAI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4f8-0OOOjx3oF76Cb8sSgFsOxSYcYUs\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 1272,
		"path": "../public/assets/orbit-mood-D1SQ3wAI.js"
	},
	"/assets/orbit-store-CaPNroSm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3107-0GaltBDQ/2pMFQiUrd+H9C1WWoc\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 12551,
		"path": "../public/assets/orbit-store-CaPNroSm.js"
	},
	"/assets/orbit.create-ZDUYC8_y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"84a0-H0dYyVUW9d/2WXmqrfk5GSeGywM\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 33952,
		"path": "../public/assets/orbit.create-ZDUYC8_y.js"
	},
	"/assets/orbit._profileId-DzBb4MDs.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2832-vPprncq2C0bkgs3jK1PUHDe9vg4\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 10290,
		"path": "../public/assets/orbit._profileId-DzBb4MDs.js"
	},
	"/assets/orbit.index-DcvbKqdl.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"72f5-VzqJjxEuyMSLZFGD+HqoKHGsVsk\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 29429,
		"path": "../public/assets/orbit.index-DcvbKqdl.js"
	},
	"/assets/orbit.me-C1R6ID7A.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1929-So/Q9MNpjm6INFDfcMsDpFdqlMM\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 6441,
		"path": "../public/assets/orbit.me-C1R6ID7A.js"
	},
	"/assets/orbit.messages-RKB73RxM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"337f-uAfd0E53re/mVDY2KcaNdIcjx5M\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 13183,
		"path": "../public/assets/orbit.messages-RKB73RxM.js"
	},
	"/assets/orbit.chat._userId-CafA9W8z.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9ae0-FhAImyZo78MjmWMwfESWf633KDo\"",
		"mtime": "2026-09-02T11:31:43.532Z",
		"size": 39648,
		"path": "../public/assets/orbit.chat._userId-CafA9W8z.js"
	},
	"/assets/orbit.notifications-DO6fW9WY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cd9-pP5cPeNHPpmTey98j0Rx16RFpVA\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 3289,
		"path": "../public/assets/orbit.notifications-DO6fW9WY.js"
	},
	"/assets/orbit.privacy-P_Mew7yX.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3b97-/ZrLTzvccutietRxr5qfEt29jT8\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 15255,
		"path": "../public/assets/orbit.privacy-P_Mew7yX.js"
	},
	"/assets/pin-DwWQGMV3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"31a-mzeqC9fqTBof4PFinuh+8ifvLVA\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 794,
		"path": "../public/assets/pin-DwWQGMV3.js"
	},
	"/assets/post-1-uxYyj4Yn.jpg": {
		"type": "image/jpeg",
		"etag": "\"2621b-tADwOglKGR4PvLgzJyB6lOA0+b8\"",
		"mtime": "2026-09-02T11:31:43.534Z",
		"size": 156187,
		"path": "../public/assets/post-1-uxYyj4Yn.jpg"
	},
	"/assets/post.create-Bf6COxwi.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15b5-/oh7kh/Hv3Lfm6A8H5dr5whi4a8\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 5557,
		"path": "../public/assets/post.create-Bf6COxwi.js"
	},
	"/assets/privacy-BpFaVaVU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c79-op7yZBe9mxuXXLdpJAS+iBnmao8\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 3193,
		"path": "../public/assets/privacy-BpFaVaVU.js"
	},
	"/assets/profile-DV245-VV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7d15-07Ayho5dr2dO0hn5oxq1/5CNLkM\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 32021,
		"path": "../public/assets/profile-DV245-VV.js"
	},
	"/assets/profiles-map-DZTYV8dt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"32a-wtDk8K9VD943FpPOAXE/q6f65Pg\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 810,
		"path": "../public/assets/profiles-map-DZTYV8dt.js"
	},
	"/assets/purify.es-ChwZkWde.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"68bc-bPPRDEosU/Lqj+2Oyi1ue22LViM\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 26812,
		"path": "../public/assets/purify.es-ChwZkWde.js"
	},
	"/assets/react-dom-BS6Gh_TR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e08-9bSgZZ4q4Ni+kAtZEKfL9G1hHrE\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 3592,
		"path": "../public/assets/react-dom-BS6Gh_TR.js"
	},
	"/assets/redirect-DtIAAt0y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e1-KhpEIx1LNSnb7dNYxiNI58wV9MY\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 481,
		"path": "../public/assets/redirect-DtIAAt0y.js"
	},
	"/assets/reel-1-DgXdxb9U.jpg": {
		"type": "image/jpeg",
		"etag": "\"158de-632G9IqzPFNj16hyS2vSq2z3WoA\"",
		"mtime": "2026-09-02T11:31:43.534Z",
		"size": 88286,
		"path": "../public/assets/reel-1-DgXdxb9U.jpg"
	},
	"/assets/reel-2-D6ICrDT7.jpg": {
		"type": "image/jpeg",
		"etag": "\"1d3c4-QU1Rig2/vTeF6slkXtMXSVa68U0\"",
		"mtime": "2026-09-02T11:31:43.534Z",
		"size": 119748,
		"path": "../public/assets/reel-2-D6ICrDT7.jpg"
	},
	"/assets/reel-3-BYUKUHRv.jpg": {
		"type": "image/jpeg",
		"etag": "\"8bae-hivl0InXk3Rn4aAy5LSO54t+UZE\"",
		"mtime": "2026-09-02T11:31:43.534Z",
		"size": 35758,
		"path": "../public/assets/reel-3-BYUKUHRv.jpg"
	},
	"/assets/reels-BSnr8dVP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3009-YYCToleBQIzyUBAO9spD5sRSGRI\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 12297,
		"path": "../public/assets/reels-BSnr8dVP.js"
	},
	"/assets/reset-password-V_m5d8hb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"52a-NwNTQ6JnJxhixc60pyDnJpYW2Fk\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 1322,
		"path": "../public/assets/reset-password-V_m5d8hb.js"
	},
	"/assets/rolldown-runtime-hePW80VL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2cc-fA8td6k29UVF6JoPfhOPkceTK1M\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 716,
		"path": "../public/assets/rolldown-runtime-hePW80VL.js"
	},
	"/assets/root-DLTE-HSj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20-vSYConOtSP6ciwr9zKsPixNwWmc\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 32,
		"path": "../public/assets/root-DLTE-HSj.js"
	},
	"/assets/route-D49UgvGd.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8c-uj2tO4VZHbwI7VIMTLkZCgmONm4\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 140,
		"path": "../public/assets/route-D49UgvGd.js"
	},
	"/assets/scan-face-a_aZ3Xac.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a5-QqVYakLM4cfbrdNR3SRIkYdjOjM\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 421,
		"path": "../public/assets/scan-face-a_aZ3Xac.js"
	},
	"/assets/search-CjghqlTX.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2cdc-sdYp9qf848hDvjs2PUy/TbERFCo\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 11484,
		"path": "../public/assets/search-CjghqlTX.js"
	},
	"/assets/routes-AVD8KpU4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85f9-LKn1PYKkpog14xenrssQox7k2NU\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 34297,
		"path": "../public/assets/routes-AVD8KpU4.js"
	},
	"/assets/settings-2-D1vHSBO9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fc-Nw+ox0aeKSDJxcf6WnR96dfTqvY\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 252,
		"path": "../public/assets/settings-2-D1vHSBO9.js"
	},
	"/assets/settings-B3T0zmRQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e7-yOnMb5H94XhaFxjSSdn4Oo3E86M\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 487,
		"path": "../public/assets/settings-B3T0zmRQ.js"
	},
	"/assets/sheet-BMo8Sv3v.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8a3-bGLQSH10Ym1kbP2JVGyBHM/8ST4\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 2211,
		"path": "../public/assets/sheet-BMo8Sv3v.js"
	},
	"/assets/shield-CllXcJoB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"190-bb4PPFbBw92XHFmjzbPjfu9lJQs\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 400,
		"path": "../public/assets/shield-CllXcJoB.js"
	},
	"/assets/shield-check-BNgPKxDN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"140-dWnr+kXmrVAXXo3czEk7sCBT3yk\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 320,
		"path": "../public/assets/shield-check-BNgPKxDN.js"
	},
	"/assets/square-C6qnbFR0.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"93-gcnQeLh4bAlLOG21aF2jE0WHbNo\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 147,
		"path": "../public/assets/square-C6qnbFR0.js"
	},
	"/assets/styles-Da0TAZKS.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"33baf-Eix2vPIruNFmYQOVoPFjKyf+Z4g\"",
		"mtime": "2026-09-02T11:31:43.534Z",
		"size": 211887,
		"path": "../public/assets/styles-Da0TAZKS.css"
	},
	"/assets/switch-BJDHYAC6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1109-dyyvUkO64UzxyYnFu3KcW/w/svw\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 4361,
		"path": "../public/assets/switch-BJDHYAC6.js"
	},
	"/assets/terms-CYn_-pFt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"df8-DJ4UPBBZoxz0UYCvnqKCZxSWeu0\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 3576,
		"path": "../public/assets/terms-CYn_-pFt.js"
	},
	"/assets/textarea-4iSm6VWT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"230-xVnAbA2X+lt5MyXJcKMehCBCFwA\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 560,
		"path": "../public/assets/textarea-4iSm6VWT.js"
	},
	"/assets/triangle-alert-D9rJnf0c.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109-yKx7pYUvNkoRMJO+q8P8MDrX/8g\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 265,
		"path": "../public/assets/triangle-alert-D9rJnf0c.js"
	},
	"/assets/u._userId-BO4HY04U.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16d4-Eu7mtiSjJOspg45jnhrj/086nGk\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 5844,
		"path": "../public/assets/u._userId-BO4HY04U.js"
	},
	"/assets/useMatch-Elx7aJhD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"294-lSKkzgQ/JTaAs/BURclMH+6p+SA\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 660,
		"path": "../public/assets/useMatch-Elx7aJhD.js"
	},
	"/assets/useRouter-BP8vT1kh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f38-UAwyZ71XUq5pvhwLvcQ+ekWdEeM\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 7992,
		"path": "../public/assets/useRouter-BP8vT1kh.js"
	},
	"/assets/useServerFn-CzzciFve.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19d-Q2chUu1zNyiLPgJ8BU4VVAVaG7A\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 413,
		"path": "../public/assets/useServerFn-CzzciFve.js"
	},
	"/assets/useStore-Bwiy6pX7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"786-iVUaSoWn1x0ZE/FkYImHA2AwxQw\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 1926,
		"path": "../public/assets/useStore-Bwiy6pX7.js"
	},
	"/assets/utils-BILtoX7V.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cad-Kenb+C6Rj1fctKIlGu2IfrGxB6c\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 3245,
		"path": "../public/assets/utils-BILtoX7V.js"
	},
	"/assets/video-data-C5AHbeS1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a2e-ymuU+Qj7mL8zrnd910lsw4ekb8s\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 6702,
		"path": "../public/assets/video-data-C5AHbeS1.js"
	},
	"/assets/video._videoId-BSaChXcT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2688-dUYh7KcZ0YqBc16qMwYliWz7Oxc\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 9864,
		"path": "../public/assets/video._videoId-BSaChXcT.js"
	},
	"/assets/video.upload-Ckx0zJT6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"264e-5NQRvpXlZSTfXO2TkDonhasc8rQ\"",
		"mtime": "2026-09-02T11:31:43.533Z",
		"size": 9806,
		"path": "../public/assets/video.upload-Ckx0zJT6.js"
	},
	"/assets/wallet-B9sDwjS2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"650bf-Xx3eppkwdCopFsXpVdFiPJBWQZE\"",
		"mtime": "2026-09-02T11:31:43.534Z",
		"size": 413887,
		"path": "../public/assets/wallet-B9sDwjS2.js"
	},
	"/assets/yw-data-Bd96njiI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85-tVhY2OnWfg4oPW2g2MxJpBstjUk\"",
		"mtime": "2026-09-02T11:31:43.534Z",
		"size": 133,
		"path": "../public/assets/yw-data-Bd96njiI.js"
	},
	"/assets/yw-download-DwNrhE_c.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"511-/EgO3q0AkwboSGQj5DEH2DCwOEE\"",
		"mtime": "2026-09-02T11:31:43.534Z",
		"size": 1297,
		"path": "../public/assets/yw-download-DwNrhE_c.js"
	},
	"/assets/yw-logo-BXjnypdM.png": {
		"type": "image/png",
		"etag": "\"b8bf9-XKz0DAyp9GBS6zs069mBfmp0ubE\"",
		"mtime": "2026-09-02T11:31:43.534Z",
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
