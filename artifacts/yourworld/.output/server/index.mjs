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
		"mtime": "2026-09-02T15:05:13.412Z",
		"size": 163,
		"path": "../public/favicon.svg"
	},
	"/manifest.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"1ea-6VxqHNj9+exgLrKEoBUp7bg4ak0\"",
		"mtime": "2026-09-02T15:05:13.412Z",
		"size": 490,
		"path": "../public/manifest.webmanifest"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"16-iUOtJ2RsHfdY9DoQxaq0wz1LZCU\"",
		"mtime": "2026-09-02T15:05:13.412Z",
		"size": 22,
		"path": "../public/robots.txt"
	},
	"/assets/Avatar-DAuXCs9z.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"225-EtRUwzd1yTd6okx4P+g94ebs3ow\"",
		"mtime": "2026-09-02T15:05:10.903Z",
		"size": 549,
		"path": "../public/assets/Avatar-DAuXCs9z.js"
	},
	"/assets/ChannelContentList-BQTgphdk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"58e-RgqEV9A462AOTB6qpUoWwypTgEs\"",
		"mtime": "2026-09-02T15:05:10.903Z",
		"size": 1422,
		"path": "../public/assets/ChannelContentList-BQTgphdk.js"
	},
	"/assets/ClientOnly-BLQ6U6R8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13f-j0SNX9405wGpvG+wmmJESUTpnZI\"",
		"mtime": "2026-09-02T15:05:10.903Z",
		"size": 319,
		"path": "../public/assets/ClientOnly-BLQ6U6R8.js"
	},
	"/assets/FollowListDialog-KXuJyU7g.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16f5-DNOYl0EwN6HU09YWP6Om3Yfpcbo\"",
		"mtime": "2026-09-02T15:05:10.903Z",
		"size": 5877,
		"path": "../public/assets/FollowListDialog-KXuJyU7g.js"
	},
	"/icon-512.png": {
		"type": "image/png",
		"etag": "\"10033-25w1u01xl/8gQOyAqgrSdkaxdio\"",
		"mtime": "2026-09-02T15:05:13.412Z",
		"size": 65587,
		"path": "../public/icon-512.png"
	},
	"/assets/VideoPoster-BvFLvojC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4a68-xSMHQfZKAy0qGh4l8ituoyUmPR4\"",
		"mtime": "2026-09-02T15:05:10.904Z",
		"size": 19048,
		"path": "../public/assets/VideoPoster-BvFLvojC.js"
	},
	"/assets/alerts-count-DHSuNaMv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5fb-ylA9uzbMrqUws9vmDeouuy5XUEo\"",
		"mtime": "2026-09-02T15:05:10.904Z",
		"size": 1531,
		"path": "../public/assets/alerts-count-DHSuNaMv.js"
	},
	"/assets/auth--ZZV2x9V.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"218c-J0rGvjZMzG5Y/t1EK6GsdC/Igio\"",
		"mtime": "2026-09-02T15:05:10.904Z",
		"size": 8588,
		"path": "../public/assets/auth--ZZV2x9V.js"
	},
	"/assets/ShareSheet-DteElq2z.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a2ed-fy87BJPwcGakQDcvIkKRIrJSZpc\"",
		"mtime": "2026-09-02T15:05:10.904Z",
		"size": 41709,
		"path": "../public/assets/ShareSheet-DteElq2z.js"
	},
	"/assets/button-Dl7H3DII.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"587-nkXEqSDQQ72Ozb8YUYs5jCx8JIk\"",
		"mtime": "2026-09-02T15:05:10.904Z",
		"size": 1415,
		"path": "../public/assets/button-Dl7H3DII.js"
	},
	"/assets/channel-data-C0uD39U_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ffe-FQuqudJRA4Qhby8Fe3Jx+NI37ag\"",
		"mtime": "2026-09-02T15:05:10.904Z",
		"size": 4094,
		"path": "../public/assets/channel-data-C0uD39U_.js"
	},
	"/assets/channel.analytics-DlBgTw34.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f5-XwM4bLm9UuStcMDRdTbKCXtEu1k\"",
		"mtime": "2026-09-02T15:05:10.904Z",
		"size": 2293,
		"path": "../public/assets/channel.analytics-DlBgTw34.js"
	},
	"/assets/account-BfnKJDD1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5b18-anCK7h5ADI8f4ZQyEuDgxDaWL3k\"",
		"mtime": "2026-09-02T15:05:10.904Z",
		"size": 23320,
		"path": "../public/assets/account-BfnKJDD1.js"
	},
	"/assets/channel.create-7YkqgFmf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1942-zk26Rbh1OxEDsKXPEJ0XQlQdsOY\"",
		"mtime": "2026-09-02T15:05:10.904Z",
		"size": 6466,
		"path": "../public/assets/channel.create-7YkqgFmf.js"
	},
	"/assets/channel.posts-BaMYO3kL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11f-qF6NSiK8RflulG1xDyPdUn+nWr8\"",
		"mtime": "2026-09-02T15:05:10.905Z",
		"size": 287,
		"path": "../public/assets/channel.posts-BaMYO3kL.js"
	},
	"/assets/channel.monetization-DghcB7jT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a94-DQc1u9nIXzPlhsqMm8RLiZWfUwk\"",
		"mtime": "2026-09-02T15:05:10.904Z",
		"size": 2708,
		"path": "../public/assets/channel.monetization-DghcB7jT.js"
	},
	"/assets/channel.reels-6zQ0Wz6i.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11f-e5QcQHOSrSwxOZtGkeUVnJhpAtA\"",
		"mtime": "2026-09-02T15:05:10.905Z",
		"size": 287,
		"path": "../public/assets/channel.reels-6zQ0Wz6i.js"
	},
	"/assets/chat-delete-D_ha7tQk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d6-IhZrxTirr014i4++zc6Dgi4JX/w\"",
		"mtime": "2026-09-02T15:05:10.905Z",
		"size": 1238,
		"path": "../public/assets/chat-delete-D_ha7tQk.js"
	},
	"/assets/channel.subscribers-CBJRbZ6C.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"542-abN4LTGHyDefzt4o6RwjugXB3Bo\"",
		"mtime": "2026-09-02T15:05:10.905Z",
		"size": 1346,
		"path": "../public/assets/channel.subscribers-CBJRbZ6C.js"
	},
	"/assets/channel.videos-B0qoA4u6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"122-bzKAiHW6dbhbr6H3Xrb5/XukMW0\"",
		"mtime": "2026-09-02T15:05:10.905Z",
		"size": 290,
		"path": "../public/assets/channel.videos-B0qoA4u6.js"
	},
	"/assets/LiveLocationSheet-Cv9OMQY4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"139d-KP7W97TGYI0QpPjA6ORilD7BaM0\"",
		"mtime": "2026-09-02T15:05:10.903Z",
		"size": 5021,
		"path": "../public/assets/LiveLocationSheet-Cv9OMQY4.js"
	},
	"/favicon.png": {
		"type": "image/png",
		"etag": "\"16c7-sHfgQvyMV/xhC2ahSs44WAoIC94\"",
		"mtime": "2026-09-02T15:05:13.412Z",
		"size": 5831,
		"path": "../public/favicon.png"
	},
	"/assets/chevron-left-DCWi8AFo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"82-Nyvjp0DClAKo4jztQSU4y179D+s\"",
		"mtime": "2026-09-02T15:05:10.905Z",
		"size": 130,
		"path": "../public/assets/chevron-left-DCWi8AFo.js"
	},
	"/assets/chat.index-9u65lLvj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"232e-vVsXN3HeARqed3JPFLUlEKi7s1g\"",
		"mtime": "2026-09-02T15:05:10.905Z",
		"size": 9006,
		"path": "../public/assets/chat.index-9u65lLvj.js"
	},
	"/assets/copyright-policy-BnIfq4OW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"236d-w0Mc+jKKjljUtkkPdjKRAw3GVSg\"",
		"mtime": "2026-09-02T15:05:10.905Z",
		"size": 9069,
		"path": "../public/assets/copyright-policy-BnIfq4OW.js"
	},
	"/assets/createLucideIcon-zYGWgMV3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d5-q/IYz1LzVgYGf/TuxC8seyNvMeM\"",
		"mtime": "2026-09-02T15:05:10.905Z",
		"size": 1237,
		"path": "../public/assets/createLucideIcon-zYGWgMV3.js"
	},
	"/assets/createServerFn-CmWB3-eN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1144-dV2j5g6gsalY7cb40a7EHaaJVyg\"",
		"mtime": "2026-09-02T15:05:10.906Z",
		"size": 4420,
		"path": "../public/assets/createServerFn-CmWB3-eN.js"
	},
	"/assets/dialog-BE2qB9lE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7a6-0nWjV5lFkf5qIsFxKTj3bg20cXc\"",
		"mtime": "2026-09-02T15:05:10.906Z",
		"size": 1958,
		"path": "../public/assets/dialog-BE2qB9lE.js"
	},
	"/assets/dist-7DHJbmHc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1cc7-WmlEqZx3QjHh6rMuq/jHoa40r6E\"",
		"mtime": "2026-09-02T15:05:10.906Z",
		"size": 7367,
		"path": "../public/assets/dist-7DHJbmHc.js"
	},
	"/assets/dist-9_rQ_Grk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b66-ac4Zo3/Yjuo/arQBE7AOafHNEQo\"",
		"mtime": "2026-09-02T15:05:10.906Z",
		"size": 2918,
		"path": "../public/assets/dist-9_rQ_Grk.js"
	},
	"/assets/dist-BBs97vxf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6448-fldm3LWS6Q2nXcRmg40mS1jHNKM\"",
		"mtime": "2026-09-02T15:05:10.906Z",
		"size": 25672,
		"path": "../public/assets/dist-BBs97vxf.js"
	},
	"/assets/dist-ChhcN3pS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12ec-//hCpgxrdxHsUrHvyHTpVLeTtao\"",
		"mtime": "2026-09-02T15:05:10.906Z",
		"size": 4844,
		"path": "../public/assets/dist-ChhcN3pS.js"
	},
	"/assets/dist-DLQt2BcY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2a9-YZYgEHXuUd8kv7q1LqyYawzzkok\"",
		"mtime": "2026-09-02T15:05:10.906Z",
		"size": 681,
		"path": "../public/assets/dist-DLQt2BcY.js"
	},
	"/assets/dist-Djdv0oiS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1399-ihQxlrv+hH9tV+MdxDN6nQjmzbY\"",
		"mtime": "2026-09-02T15:05:10.906Z",
		"size": 5017,
		"path": "../public/assets/dist-Djdv0oiS.js"
	},
	"/assets/dist-yp-2tsEm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109b-fv193BiWFIE6I5aBGD0O54gtDIE\"",
		"mtime": "2026-09-02T15:05:10.906Z",
		"size": 4251,
		"path": "../public/assets/dist-yp-2tsEm.js"
	},
	"/assets/dist-j7I1HKNx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"282-sBrbNP3icQnR3pbchepcoobn54k\"",
		"mtime": "2026-09-02T15:05:10.906Z",
		"size": 642,
		"path": "../public/assets/dist-j7I1HKNx.js"
	},
	"/assets/ellipsis-DJa7oDhq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e2-oM+1pCz1H9Iz76NYx8Bi8JeXN7A\"",
		"mtime": "2026-09-02T15:05:10.906Z",
		"size": 226,
		"path": "../public/assets/ellipsis-DJa7oDhq.js"
	},
	"/assets/es2015--DrBlcKE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6190-jP+wsDeJlMMXZLV/wlo95YsSNZw\"",
		"mtime": "2026-09-02T15:05:10.906Z",
		"size": 24976,
		"path": "../public/assets/es2015--DrBlcKE.js"
	},
	"/assets/eye-DI6Zkgpx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"100-uvX4r8l9otdsHr/G9bhXYGwdLwI\"",
		"mtime": "2026-09-02T15:05:10.906Z",
		"size": 256,
		"path": "../public/assets/eye-DI6Zkgpx.js"
	},
	"/assets/geo-data-CYKNiDfb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6ce-DiXeUwOVv3S5GUs0RTxhIQieJkk\"",
		"mtime": "2026-09-02T15:05:10.906Z",
		"size": 1742,
		"path": "../public/assets/geo-data-CYKNiDfb.js"
	},
	"/assets/html2canvas-DCcDvdvP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"30b50-/NW/tvs1950d+adFAmG+0O5qROc\"",
		"mtime": "2026-09-02T15:05:10.906Z",
		"size": 199504,
		"path": "../public/assets/html2canvas-DCcDvdvP.js"
	},
	"/assets/image-plus-BEyUefMp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16b-jM/otUDosKLzeNczaPUhwq6ohjw\"",
		"mtime": "2026-09-02T15:05:10.906Z",
		"size": 363,
		"path": "../public/assets/image-plus-BEyUefMp.js"
	},
	"/assets/index.es-2HWdnhPL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24f8c-eDXmZuWpNUD+HzrcLl9l6QpUDfs\"",
		"mtime": "2026-09-02T15:05:10.907Z",
		"size": 151436,
		"path": "../public/assets/index.es-2HWdnhPL.js"
	},
	"/assets/input-DqYzGBEk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"296-bh9a9dcEuizKj0qbtw6YTyrRqgI\"",
		"mtime": "2026-09-02T15:05:10.907Z",
		"size": 662,
		"path": "../public/assets/input-DqYzGBEk.js"
	},
	"/assets/client-Crb0DbGz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"33944-0qHfMClpy1zoBqW+bwkMXim3Sgo\"",
		"mtime": "2026-09-02T15:05:10.905Z",
		"size": 211268,
		"path": "../public/assets/client-Crb0DbGz.js"
	},
	"/assets/index-DQpdPhHB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a5287-sGULCGJaYJgt0MZ/WAYbw9E+Vjo\"",
		"mtime": "2026-09-02T15:05:10.900Z",
		"size": 676487,
		"path": "../public/assets/index-DQpdPhHB.js"
	},
	"/assets/invariant-DrlDULPJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ce1-ZRQDfkQPt4jYb9usOOHjNrKdLto\"",
		"mtime": "2026-09-02T15:05:10.907Z",
		"size": 3297,
		"path": "../public/assets/invariant-DrlDULPJ.js"
	},
	"/assets/link-DS1dcRyo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3feb-TtYfNRNFNE5e7QSTbP8vYKNJ8SM\"",
		"mtime": "2026-09-02T15:05:10.907Z",
		"size": 16363,
		"path": "../public/assets/link-DS1dcRyo.js"
	},
	"/assets/matchContext-BLaZZjXw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b8-BSjivHXemCqEV+wXXsCe5P0ODLQ\"",
		"mtime": "2026-09-02T15:05:10.907Z",
		"size": 184,
		"path": "../public/assets/matchContext-BLaZZjXw.js"
	},
	"/assets/moment._momentId-DtY8hMQq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3e5b-fOVtHaly/hODmqOG4tSQPAy0Yjg\"",
		"mtime": "2026-09-02T15:05:10.907Z",
		"size": 15963,
		"path": "../public/assets/moment._momentId-DtY8hMQq.js"
	},
	"/assets/moment.index-DOrNfYkP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c22-pD47Yhf6oD7nCO++HSNljSh5nuI\"",
		"mtime": "2026-09-02T15:05:10.907Z",
		"size": 3106,
		"path": "../public/assets/moment.index-DOrNfYkP.js"
	},
	"/assets/navigation-C8MoOCIK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"94-7DknCKydA7aq83O7EnlD43AHz04\"",
		"mtime": "2026-09-02T15:05:10.907Z",
		"size": 148,
		"path": "../public/assets/navigation-C8MoOCIK.js"
	},
	"/assets/not-found-DIgawKw1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"37-RTB6YH5iXRKeXz1Sn6ZQ+vS0lnc\"",
		"mtime": "2026-09-02T15:05:10.907Z",
		"size": 55,
		"path": "../public/assets/not-found-DIgawKw1.js"
	},
	"/assets/notifications-Cze-8YMI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"17e6-MKuEv6W5oHHOtE9buy/z6wktwKA\"",
		"mtime": "2026-09-02T15:05:10.907Z",
		"size": 6118,
		"path": "../public/assets/notifications-Cze-8YMI.js"
	},
	"/assets/orbit-BMmw7R8Y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f5-3/EyqoLRV/osRHjOF9ihx4hmL8c\"",
		"mtime": "2026-09-02T15:05:10.907Z",
		"size": 2293,
		"path": "../public/assets/orbit-BMmw7R8Y.js"
	},
	"/assets/orbit-match-CoOKF8us.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a94-azt/2e4NA8xs3YLrhgeO+1vAeW4\"",
		"mtime": "2026-09-02T15:05:10.907Z",
		"size": 2708,
		"path": "../public/assets/orbit-match-CoOKF8us.js"
	},
	"/assets/orbit-store-COzs-uff.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3107-s5V8tPGVHnnBL+J49qU3kBPdPXE\"",
		"mtime": "2026-09-02T15:05:10.908Z",
		"size": 12551,
		"path": "../public/assets/orbit-store-COzs-uff.js"
	},
	"/assets/orbit-mood-D1SQ3wAI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4f8-0OOOjx3oF76Cb8sSgFsOxSYcYUs\"",
		"mtime": "2026-09-02T15:05:10.907Z",
		"size": 1272,
		"path": "../public/assets/orbit-mood-D1SQ3wAI.js"
	},
	"/assets/orbit.create-Du4DKPFd.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"84a0-Htd62undjokYwNwjWsOYnT2L3lY\"",
		"mtime": "2026-09-02T15:05:10.908Z",
		"size": 33952,
		"path": "../public/assets/orbit.create-Du4DKPFd.js"
	},
	"/assets/orbit.chat._userId-CbZKK313.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9ae0-/ztLCEKRgVi/l+ZEoHzuDnWl38o\"",
		"mtime": "2026-09-02T15:05:10.908Z",
		"size": 39648,
		"path": "../public/assets/orbit.chat._userId-CbZKK313.js"
	},
	"/assets/orbit.me-yxTuv-G7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1929-qUBPzZjzfYJQvD9T/R03LN4J9t0\"",
		"mtime": "2026-09-02T15:05:10.908Z",
		"size": 6441,
		"path": "../public/assets/orbit.me-yxTuv-G7.js"
	},
	"/assets/orbit.index-5hE1Cnu6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"72f5-/5RzW+4OZidVWPUok2ZAz+3vm5A\"",
		"mtime": "2026-09-02T15:05:10.908Z",
		"size": 29429,
		"path": "../public/assets/orbit.index-5hE1Cnu6.js"
	},
	"/assets/orbit.notifications-Bn8HBekQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cd9-QG0JJBmTrYC5qkeRiATpACnZ04E\"",
		"mtime": "2026-09-02T15:05:10.908Z",
		"size": 3289,
		"path": "../public/assets/orbit.notifications-Bn8HBekQ.js"
	},
	"/assets/orbit.messages-CYlrMGCE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"337f-wYUcK2UJequ2B3+g/wjhV5MmLz0\"",
		"mtime": "2026-09-02T15:05:10.908Z",
		"size": 13183,
		"path": "../public/assets/orbit.messages-CYlrMGCE.js"
	},
	"/assets/orbit.privacy-BcVZXjN0.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3b97-Vv74w5cSA3JF6RbL2iIGXltiEfg\"",
		"mtime": "2026-09-02T15:05:10.908Z",
		"size": 15255,
		"path": "../public/assets/orbit.privacy-BcVZXjN0.js"
	},
	"/assets/pin-BeE_zRtQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"31a-l5uaPsRPR+8pJDClvFJdvEKdlT4\"",
		"mtime": "2026-09-02T15:05:10.908Z",
		"size": 794,
		"path": "../public/assets/pin-BeE_zRtQ.js"
	},
	"/assets/post-1-uxYyj4Yn.jpg": {
		"type": "image/jpeg",
		"etag": "\"2621b-tADwOglKGR4PvLgzJyB6lOA0+b8\"",
		"mtime": "2026-09-02T15:05:10.916Z",
		"size": 156187,
		"path": "../public/assets/post-1-uxYyj4Yn.jpg"
	},
	"/assets/privacy-DRKhqf4_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c79-oUo5GxsrBcYSCuc91TjIA4umiv8\"",
		"mtime": "2026-09-02T15:05:10.908Z",
		"size": 3193,
		"path": "../public/assets/privacy-DRKhqf4_.js"
	},
	"/assets/post.create-JXUCVNrn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15b5-Q5BW+iZVSXSUpuAgK133rXHGtnE\"",
		"mtime": "2026-09-02T15:05:10.908Z",
		"size": 5557,
		"path": "../public/assets/post.create-JXUCVNrn.js"
	},
	"/assets/profiles-map-DZTYV8dt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"32a-wtDk8K9VD943FpPOAXE/q6f65Pg\"",
		"mtime": "2026-09-02T15:05:10.908Z",
		"size": 810,
		"path": "../public/assets/profiles-map-DZTYV8dt.js"
	},
	"/assets/profile-D75Dmey3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7d15-7z95l1SAoi+xr4LafWHV3fH/+qo\"",
		"mtime": "2026-09-02T15:05:10.908Z",
		"size": 32021,
		"path": "../public/assets/profile-D75Dmey3.js"
	},
	"/assets/orbit._profileId-B3PXg0qN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2832-wmZoVqssFNur4qLpSHMSSbWZj2Q\"",
		"mtime": "2026-09-02T15:05:10.908Z",
		"size": 10290,
		"path": "../public/assets/orbit._profileId-B3PXg0qN.js"
	},
	"/assets/react-dom-BS6Gh_TR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e08-9bSgZZ4q4Ni+kAtZEKfL9G1hHrE\"",
		"mtime": "2026-09-02T15:05:10.908Z",
		"size": 3592,
		"path": "../public/assets/react-dom-BS6Gh_TR.js"
	},
	"/assets/redirect-DtIAAt0y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e1-KhpEIx1LNSnb7dNYxiNI58wV9MY\"",
		"mtime": "2026-09-02T15:05:10.908Z",
		"size": 481,
		"path": "../public/assets/redirect-DtIAAt0y.js"
	},
	"/assets/reel-2-D6ICrDT7.jpg": {
		"type": "image/jpeg",
		"etag": "\"1d3c4-QU1Rig2/vTeF6slkXtMXSVa68U0\"",
		"mtime": "2026-09-02T15:05:10.918Z",
		"size": 119748,
		"path": "../public/assets/reel-2-D6ICrDT7.jpg"
	},
	"/assets/reel-1-DgXdxb9U.jpg": {
		"type": "image/jpeg",
		"etag": "\"158de-632G9IqzPFNj16hyS2vSq2z3WoA\"",
		"mtime": "2026-09-02T15:05:10.918Z",
		"size": 88286,
		"path": "../public/assets/reel-1-DgXdxb9U.jpg"
	},
	"/assets/reel-3-BYUKUHRv.jpg": {
		"type": "image/jpeg",
		"etag": "\"8bae-hivl0InXk3Rn4aAy5LSO54t+UZE\"",
		"mtime": "2026-09-02T15:05:10.920Z",
		"size": 35758,
		"path": "../public/assets/reel-3-BYUKUHRv.jpg"
	},
	"/assets/reset-password-ChreJItf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"52a-gwrUgybY1oxq155uYQukk9PtNOY\"",
		"mtime": "2026-09-02T15:05:10.909Z",
		"size": 1322,
		"path": "../public/assets/reset-password-ChreJItf.js"
	},
	"/assets/reels-g4rLsUbe.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3009-kX/r6KbQN4i+cJmbq/6dDcEI0mA\"",
		"mtime": "2026-09-02T15:05:10.908Z",
		"size": 12297,
		"path": "../public/assets/reels-g4rLsUbe.js"
	},
	"/assets/rolldown-runtime-hePW80VL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2cc-fA8td6k29UVF6JoPfhOPkceTK1M\"",
		"mtime": "2026-09-02T15:05:10.909Z",
		"size": 716,
		"path": "../public/assets/rolldown-runtime-hePW80VL.js"
	},
	"/assets/root-DLTE-HSj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20-vSYConOtSP6ciwr9zKsPixNwWmc\"",
		"mtime": "2026-09-02T15:05:10.909Z",
		"size": 32,
		"path": "../public/assets/root-DLTE-HSj.js"
	},
	"/assets/route-BVcubkRz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8c-BHbfyJQhKsdM0PcQH+B/TGtTius\"",
		"mtime": "2026-09-02T15:05:10.909Z",
		"size": 140,
		"path": "../public/assets/route-BVcubkRz.js"
	},
	"/assets/search-DoBad-r0.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2cdc-/npZVlGGWMlqfZY9K9OGG2wsByI\"",
		"mtime": "2026-09-02T15:05:10.909Z",
		"size": 11484,
		"path": "../public/assets/search-DoBad-r0.js"
	},
	"/assets/scan-face-CM2bv4DP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a5-2sX7qfOwFGs4b0QZiHDo+LUoaas\"",
		"mtime": "2026-09-02T15:05:10.909Z",
		"size": 421,
		"path": "../public/assets/scan-face-CM2bv4DP.js"
	},
	"/assets/settings-2-x6U2komm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fc-airYhkVLobsDhkRjcuibMjh1Kz4\"",
		"mtime": "2026-09-02T15:05:10.909Z",
		"size": 252,
		"path": "../public/assets/settings-2-x6U2komm.js"
	},
	"/assets/settings-63gKAQz_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e7-H6UEAhV97AbbPJvTM0mgapeyVN4\"",
		"mtime": "2026-09-02T15:05:10.910Z",
		"size": 487,
		"path": "../public/assets/settings-63gKAQz_.js"
	},
	"/assets/purify.es-ChwZkWde.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"68bc-bPPRDEosU/Lqj+2Oyi1ue22LViM\"",
		"mtime": "2026-09-02T15:05:10.908Z",
		"size": 26812,
		"path": "../public/assets/purify.es-ChwZkWde.js"
	},
	"/assets/routes-P-JXxonp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8620-0J/gCaHfdv7veT2flPS87/Y248w\"",
		"mtime": "2026-09-02T15:05:10.909Z",
		"size": 34336,
		"path": "../public/assets/routes-P-JXxonp.js"
	},
	"/assets/shield-TvVcHHSx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"190-IQZ0HXDtipzveT7dmmgPX6/2kng\"",
		"mtime": "2026-09-02T15:05:10.910Z",
		"size": 400,
		"path": "../public/assets/shield-TvVcHHSx.js"
	},
	"/assets/shield-check-DbLP09Mr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"140-kO2Skvjk1wqz1iVSYj10tG7kAAg\"",
		"mtime": "2026-09-02T15:05:10.910Z",
		"size": 320,
		"path": "../public/assets/shield-check-DbLP09Mr.js"
	},
	"/assets/square-nG_BaMNK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"93-N5UoPnJn75SEYhz/11HKB4AH68Y\"",
		"mtime": "2026-09-02T15:05:10.910Z",
		"size": 147,
		"path": "../public/assets/square-nG_BaMNK.js"
	},
	"/assets/styles-DvC5Kgeq.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"33abb-SfJH/06v0sZBXsDgd6GP1gAHkIQ\"",
		"mtime": "2026-09-02T15:05:10.920Z",
		"size": 211643,
		"path": "../public/assets/styles-DvC5Kgeq.css"
	},
	"/assets/sheet-D0aGgT1c.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8a3-+dwkcbxreWhDMlwpLg5Wq4Ka6TA\"",
		"mtime": "2026-09-02T15:05:10.910Z",
		"size": 2211,
		"path": "../public/assets/sheet-D0aGgT1c.js"
	},
	"/assets/switch-Clz5giF9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1109-NY4q1fbOLVNE1PrX9R6aNJGvlzQ\"",
		"mtime": "2026-09-02T15:05:10.910Z",
		"size": 4361,
		"path": "../public/assets/switch-Clz5giF9.js"
	},
	"/assets/terms-BjJLCIcI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"df8-5aEIPozWUTA0kDf/I6cl2j/Jnp4\"",
		"mtime": "2026-09-02T15:05:10.910Z",
		"size": 3576,
		"path": "../public/assets/terms-BjJLCIcI.js"
	},
	"/assets/textarea-vlwpbeYd.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"230-OFCdLg92+ynktEbzVUB245GNa4Y\"",
		"mtime": "2026-09-02T15:05:10.910Z",
		"size": 560,
		"path": "../public/assets/textarea-vlwpbeYd.js"
	},
	"/assets/triangle-alert-B2hpeTrU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109-hAh5bu7wpC/dyrDkPv2HRWFdK0E\"",
		"mtime": "2026-09-02T15:05:10.910Z",
		"size": 265,
		"path": "../public/assets/triangle-alert-B2hpeTrU.js"
	},
	"/assets/u._userId-Depu-vmF.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16d4-3dM+C7dWKRcb3p6gtm0nY7QHEhQ\"",
		"mtime": "2026-09-02T15:05:10.910Z",
		"size": 5844,
		"path": "../public/assets/u._userId-Depu-vmF.js"
	},
	"/assets/useMatch-CG_Qo4VA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"26c-mf+6Kl2KU/dZTKCvH3wHxYMjLA8\"",
		"mtime": "2026-09-02T15:05:10.910Z",
		"size": 620,
		"path": "../public/assets/useMatch-CG_Qo4VA.js"
	},
	"/assets/useRouter-BP8vT1kh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f38-UAwyZ71XUq5pvhwLvcQ+ekWdEeM\"",
		"mtime": "2026-09-02T15:05:10.910Z",
		"size": 7992,
		"path": "../public/assets/useRouter-BP8vT1kh.js"
	},
	"/assets/useServerFn-CzzciFve.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19d-Q2chUu1zNyiLPgJ8BU4VVAVaG7A\"",
		"mtime": "2026-09-02T15:05:10.911Z",
		"size": 413,
		"path": "../public/assets/useServerFn-CzzciFve.js"
	},
	"/assets/useStore-Bwiy6pX7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"786-iVUaSoWn1x0ZE/FkYImHA2AwxQw\"",
		"mtime": "2026-09-02T15:05:10.911Z",
		"size": 1926,
		"path": "../public/assets/useStore-Bwiy6pX7.js"
	},
	"/assets/video-data-DptUNPZG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1fc7-JaLIjY3leROL1pNEyZp98BAa8sI\"",
		"mtime": "2026-09-02T15:05:10.911Z",
		"size": 8135,
		"path": "../public/assets/video-data-DptUNPZG.js"
	},
	"/assets/video._videoId-Bt9-CPVI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"26af-2w9cpCieZYq3wv0eP9EFs3prUNU\"",
		"mtime": "2026-09-02T15:05:10.911Z",
		"size": 9903,
		"path": "../public/assets/video._videoId-Bt9-CPVI.js"
	},
	"/assets/video.upload-ChwGtlYD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"264e-jxXCfBx5Ug+cFvIBsKsFD+w/jmE\"",
		"mtime": "2026-09-02T15:05:10.911Z",
		"size": 9806,
		"path": "../public/assets/video.upload-ChwGtlYD.js"
	},
	"/assets/yw-data-Bd96njiI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85-tVhY2OnWfg4oPW2g2MxJpBstjUk\"",
		"mtime": "2026-09-02T15:05:10.916Z",
		"size": 133,
		"path": "../public/assets/yw-data-Bd96njiI.js"
	},
	"/assets/yw-download-DwNrhE_c.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"511-/EgO3q0AkwboSGQj5DEH2DCwOEE\"",
		"mtime": "2026-09-02T15:05:10.916Z",
		"size": 1297,
		"path": "../public/assets/yw-download-DwNrhE_c.js"
	},
	"/assets/wallet-C8hI4zRX.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"650bf-4IsEVxkCUsisZZDvbeGIWzgOG9M\"",
		"mtime": "2026-09-02T15:05:10.911Z",
		"size": 413887,
		"path": "../public/assets/wallet-C8hI4zRX.js"
	},
	"/assets/yw-logo-BXjnypdM.png": {
		"type": "image/png",
		"etag": "\"b8bf9-XKz0DAyp9GBS6zs069mBfmp0ubE\"",
		"mtime": "2026-09-02T15:05:10.922Z",
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
