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
		"mtime": "2026-09-02T04:41:21.272Z",
		"size": 163,
		"path": "../public/favicon.svg"
	},
	"/manifest.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"1ea-6VxqHNj9+exgLrKEoBUp7bg4ak0\"",
		"mtime": "2026-09-02T04:41:21.272Z",
		"size": 490,
		"path": "../public/manifest.webmanifest"
	},
	"/assets/Avatar-DU_bxa8F.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"227-S4aj0nCYeQzV9Om902NPpbtfQUg\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 551,
		"path": "../public/assets/Avatar-DU_bxa8F.js"
	},
	"/assets/ChannelContentList-ZExlHxmr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"58e-bGB+vNApC3yBsdYUm/hqkwrco5Q\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 1422,
		"path": "../public/assets/ChannelContentList-ZExlHxmr.js"
	},
	"/assets/ClientOnly-BLQ6U6R8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13f-j0SNX9405wGpvG+wmmJESUTpnZI\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 319,
		"path": "../public/assets/ClientOnly-BLQ6U6R8.js"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"16-iUOtJ2RsHfdY9DoQxaq0wz1LZCU\"",
		"mtime": "2026-09-02T04:41:21.272Z",
		"size": 22,
		"path": "../public/robots.txt"
	},
	"/assets/FollowListDialog-B3-nFScE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24ae-RCYe0gCwGHJGXvRGdYyqWFwV8eU\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 9390,
		"path": "../public/assets/FollowListDialog-B3-nFScE.js"
	},
	"/assets/ShareSheet-DBWXyvtt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a3bc-qopGGU83Jcogfuib+TqYiQB3q+4\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 41916,
		"path": "../public/assets/ShareSheet-DBWXyvtt.js"
	},
	"/assets/LiveLocationSheet-ChhKuvQh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"139f-leenlwN2kuAdeDQtv928LBI7F0Q\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 5023,
		"path": "../public/assets/LiveLocationSheet-ChhKuvQh.js"
	},
	"/assets/alerts-count-FtJN_wgf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5fd-UXPbSpsRh+2AY5U8WXI3erKyLIU\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 1533,
		"path": "../public/assets/alerts-count-FtJN_wgf.js"
	},
	"/assets/auth-C4xDbPX8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"47f7-K29EqE8uHw5JfMwVmGTgpribDvc\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 18423,
		"path": "../public/assets/auth-C4xDbPX8.js"
	},
	"/assets/button-Bg0hSSBV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"589-Bl0ZWTEl6ni1LFpvN8pZ9MUQv5c\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 1417,
		"path": "../public/assets/button-Bg0hSSBV.js"
	},
	"/assets/channel-data-Ctiq2G7r.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a77-zoucJ5Mqwdv8DdfRAUhi9/X11Co\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 2679,
		"path": "../public/assets/channel-data-Ctiq2G7r.js"
	},
	"/assets/channel.create-BOt55FRW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1942-OQcffTJw2Ib4B5GaLNb2++9r32E\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 6466,
		"path": "../public/assets/channel.create-BOt55FRW.js"
	},
	"/assets/channel.analytics-DnzrLR-H.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"952-dmN4rSkObS7CYkxUBX+UR+4goPc\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 2386,
		"path": "../public/assets/channel.analytics-DnzrLR-H.js"
	},
	"/assets/channel.monetization-DnbP66N1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9ab-lUo6bVcss3mcr7KmJ2UPbe0fWwE\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 2475,
		"path": "../public/assets/channel.monetization-DnbP66N1.js"
	},
	"/assets/VideoPoster-BwpP1SJn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4901-xM0G1gz8sbAYLOwpBkXF+WNF6hQ\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 18689,
		"path": "../public/assets/VideoPoster-BwpP1SJn.js"
	},
	"/assets/channel.posts-D0K5gvyd.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"101-mH9n3UsFgQgcSXGrpixg0WaoP3Y\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 257,
		"path": "../public/assets/channel.posts-D0K5gvyd.js"
	},
	"/assets/channel.reels-SikOgKso.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"101-7qfbLF0L0/E5f29a1bUSgCyEzQU\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 257,
		"path": "../public/assets/channel.reels-SikOgKso.js"
	},
	"/assets/account-C2edgyVK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"599f-MxApiyBCcws2baz5TjKcrYfJXeY\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 22943,
		"path": "../public/assets/account-C2edgyVK.js"
	},
	"/assets/channel.subscribers-B6-Lyxla.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"546-2ko54kvrnYOabNP0jV0FKOeLXwE\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 1350,
		"path": "../public/assets/channel.subscribers-B6-Lyxla.js"
	},
	"/assets/channel.videos-Bbox1xUA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"103-1nA3Do+FnYfP3ZHgjY/fIrnXcHg\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 259,
		"path": "../public/assets/channel.videos-Bbox1xUA.js"
	},
	"/assets/chat-delete-BVTZGYPV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d6-c2+HcO61RuonLbBkq86L6aQyAjc\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 1238,
		"path": "../public/assets/chat-delete-BVTZGYPV.js"
	},
	"/icon-512.png": {
		"type": "image/png",
		"etag": "\"10033-25w1u01xl/8gQOyAqgrSdkaxdio\"",
		"mtime": "2026-09-02T04:41:21.272Z",
		"size": 65587,
		"path": "../public/icon-512.png"
	},
	"/favicon.png": {
		"type": "image/png",
		"etag": "\"16c7-sHfgQvyMV/xhC2ahSs44WAoIC94\"",
		"mtime": "2026-09-02T04:41:21.272Z",
		"size": 5831,
		"path": "../public/favicon.png"
	},
	"/assets/chat.index-CM6vxkM2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"232e-mBr3+gvgcgsQpoXWjlnwaHrN+j8\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 9006,
		"path": "../public/assets/chat.index-CM6vxkM2.js"
	},
	"/assets/chevron-left-DCWi8AFo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"82-Nyvjp0DClAKo4jztQSU4y179D+s\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 130,
		"path": "../public/assets/chevron-left-DCWi8AFo.js"
	},
	"/assets/client-DnLkyxmB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"33f26-QVVoJE3EmmLwW1i5YzRBcnecoLI\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 212774,
		"path": "../public/assets/client-DnLkyxmB.js"
	},
	"/assets/copyright-policy-BGlgXRyV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"236d-GAldPyeqQIqCjgPqCWyxPTqh9OA\"",
		"mtime": "2026-09-02T04:41:18.334Z",
		"size": 9069,
		"path": "../public/assets/copyright-policy-BGlgXRyV.js"
	},
	"/assets/createLucideIcon-zYGWgMV3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d5-q/IYz1LzVgYGf/TuxC8seyNvMeM\"",
		"mtime": "2026-09-02T04:41:18.335Z",
		"size": 1237,
		"path": "../public/assets/createLucideIcon-zYGWgMV3.js"
	},
	"/assets/createServerFn-COM72CaX.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1144-k3qqAOcOi2N1dThREIONEgdxyPE\"",
		"mtime": "2026-09-02T04:41:18.335Z",
		"size": 4420,
		"path": "../public/assets/createServerFn-COM72CaX.js"
	},
	"/assets/dialog-DrXauidg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7a8-o4bm04lzzvJBDGjBQntu0ZsGSWg\"",
		"mtime": "2026-09-02T04:41:18.335Z",
		"size": 1960,
		"path": "../public/assets/dialog-DrXauidg.js"
	},
	"/assets/dist-7DHJbmHc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1cc7-WmlEqZx3QjHh6rMuq/jHoa40r6E\"",
		"mtime": "2026-09-02T04:41:18.335Z",
		"size": 7367,
		"path": "../public/assets/dist-7DHJbmHc.js"
	},
	"/assets/dist-9_rQ_Grk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b66-ac4Zo3/Yjuo/arQBE7AOafHNEQo\"",
		"mtime": "2026-09-02T04:41:18.335Z",
		"size": 2918,
		"path": "../public/assets/dist-9_rQ_Grk.js"
	},
	"/assets/dist-CLFYYV_a.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109b-KIOR7l1fjLX2GUfzLqR1BOMiHBM\"",
		"mtime": "2026-09-02T04:41:18.335Z",
		"size": 4251,
		"path": "../public/assets/dist-CLFYYV_a.js"
	},
	"/assets/dist-C_-2UDJZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12ec-1FEwp+yc7Uz7u+XDlTSNw74V3YU\"",
		"mtime": "2026-09-02T04:41:18.335Z",
		"size": 4844,
		"path": "../public/assets/dist-C_-2UDJZ.js"
	},
	"/assets/dist-DLQt2BcY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2a9-YZYgEHXuUd8kv7q1LqyYawzzkok\"",
		"mtime": "2026-09-02T04:41:18.335Z",
		"size": 681,
		"path": "../public/assets/dist-DLQt2BcY.js"
	},
	"/assets/dist-Djdv0oiS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1399-ihQxlrv+hH9tV+MdxDN6nQjmzbY\"",
		"mtime": "2026-09-02T04:41:18.335Z",
		"size": 5017,
		"path": "../public/assets/dist-Djdv0oiS.js"
	},
	"/assets/dist-DzKbB2qR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6448-VjH84bT8g3UObxtUL63dqPzjyEE\"",
		"mtime": "2026-09-02T04:41:18.335Z",
		"size": 25672,
		"path": "../public/assets/dist-DzKbB2qR.js"
	},
	"/assets/dist-FtW7UEdW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"282-k6H6IOTG2huxV+XFaUveSrVzc9M\"",
		"mtime": "2026-09-02T04:41:18.335Z",
		"size": 642,
		"path": "../public/assets/dist-FtW7UEdW.js"
	},
	"/assets/ellipsis-DJa7oDhq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e2-oM+1pCz1H9Iz76NYx8Bi8JeXN7A\"",
		"mtime": "2026-09-02T04:41:18.335Z",
		"size": 226,
		"path": "../public/assets/ellipsis-DJa7oDhq.js"
	},
	"/assets/es2015-DwyJt8vE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6190-ilXu9jOkwmKu9nhCu/WcHOX0hPU\"",
		"mtime": "2026-09-02T04:41:18.335Z",
		"size": 24976,
		"path": "../public/assets/es2015-DwyJt8vE.js"
	},
	"/assets/eye-DI6Zkgpx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"100-uvX4r8l9otdsHr/G9bhXYGwdLwI\"",
		"mtime": "2026-09-02T04:41:18.335Z",
		"size": 256,
		"path": "../public/assets/eye-DI6Zkgpx.js"
	},
	"/assets/geo-data-CYKNiDfb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6ce-DiXeUwOVv3S5GUs0RTxhIQieJkk\"",
		"mtime": "2026-09-02T04:41:18.335Z",
		"size": 1742,
		"path": "../public/assets/geo-data-CYKNiDfb.js"
	},
	"/assets/html2canvas-DCcDvdvP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"30b50-/NW/tvs1950d+adFAmG+0O5qROc\"",
		"mtime": "2026-09-02T04:41:18.335Z",
		"size": 199504,
		"path": "../public/assets/html2canvas-DCcDvdvP.js"
	},
	"/assets/image-plus-BEyUefMp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16b-jM/otUDosKLzeNczaPUhwq6ohjw\"",
		"mtime": "2026-09-02T04:41:18.336Z",
		"size": 363,
		"path": "../public/assets/image-plus-BEyUefMp.js"
	},
	"/assets/index.es-BXxD-i3r.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24f8c-ZQh+5n9coV2sCpo6ofT9g+a/eng\"",
		"mtime": "2026-09-02T04:41:18.336Z",
		"size": 151436,
		"path": "../public/assets/index.es-BXxD-i3r.js"
	},
	"/assets/index-DVnTOQcI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a4d93-1d8EM7xIrM7d43Ide8kofj99X6o\"",
		"mtime": "2026-09-02T04:41:18.329Z",
		"size": 675219,
		"path": "../public/assets/index-DVnTOQcI.js"
	},
	"/assets/invariant-DrlDULPJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ce1-ZRQDfkQPt4jYb9usOOHjNrKdLto\"",
		"mtime": "2026-09-02T04:41:18.336Z",
		"size": 3297,
		"path": "../public/assets/invariant-DrlDULPJ.js"
	},
	"/assets/input-DKsOdn2O.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"298-7PE8Q+9T09dTttKRytSEduFWnGg\"",
		"mtime": "2026-09-02T04:41:18.336Z",
		"size": 664,
		"path": "../public/assets/input-DKsOdn2O.js"
	},
	"/assets/matchContext-BLaZZjXw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b8-BSjivHXemCqEV+wXXsCe5P0ODLQ\"",
		"mtime": "2026-09-02T04:41:18.336Z",
		"size": 184,
		"path": "../public/assets/matchContext-BLaZZjXw.js"
	},
	"/assets/moment._momentId-ykYfWPLG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3e5b-HUMNlcf/vzmJd5Paz/CnN8ldmyA\"",
		"mtime": "2026-09-02T04:41:18.336Z",
		"size": 15963,
		"path": "../public/assets/moment._momentId-ykYfWPLG.js"
	},
	"/assets/moment.index-CXW_z3Ue.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c22-gSsbwDH3Bq+FbA1e33c5QZp6qlI\"",
		"mtime": "2026-09-02T04:41:18.336Z",
		"size": 3106,
		"path": "../public/assets/moment.index-CXW_z3Ue.js"
	},
	"/assets/navigation-C8MoOCIK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"94-7DknCKydA7aq83O7EnlD43AHz04\"",
		"mtime": "2026-09-02T04:41:18.336Z",
		"size": 148,
		"path": "../public/assets/navigation-C8MoOCIK.js"
	},
	"/assets/not-found-DIgawKw1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"37-RTB6YH5iXRKeXz1Sn6ZQ+vS0lnc\"",
		"mtime": "2026-09-02T04:41:18.336Z",
		"size": 55,
		"path": "../public/assets/not-found-DIgawKw1.js"
	},
	"/assets/notifications-BKZg4mhU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"17e6-IiC+OzIvM4BvGnOIfyZcVN+h2u0\"",
		"mtime": "2026-09-02T04:41:18.336Z",
		"size": 6118,
		"path": "../public/assets/notifications-BKZg4mhU.js"
	},
	"/assets/orbit-OjyN2Pod.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f7-HZWNCO8nFDg8FKVHsfAemn7HUoc\"",
		"mtime": "2026-09-02T04:41:18.336Z",
		"size": 2295,
		"path": "../public/assets/orbit-OjyN2Pod.js"
	},
	"/assets/orbit-match-H9B19Z5U.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a96-en60ncld2snrseiwMWVu6CM4F9k\"",
		"mtime": "2026-09-02T04:41:18.336Z",
		"size": 2710,
		"path": "../public/assets/orbit-match-H9B19Z5U.js"
	},
	"/assets/orbit-mood-D1SQ3wAI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4f8-0OOOjx3oF76Cb8sSgFsOxSYcYUs\"",
		"mtime": "2026-09-02T04:41:18.336Z",
		"size": 1272,
		"path": "../public/assets/orbit-mood-D1SQ3wAI.js"
	},
	"/assets/orbit-store-BeXn3lZ1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3b4d-JvjgBbK35Ous/J+YLzWn2Tt5fcA\"",
		"mtime": "2026-09-02T04:41:18.336Z",
		"size": 15181,
		"path": "../public/assets/orbit-store-BeXn3lZ1.js"
	},
	"/assets/orbit._profileId-Bt4unFEt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2839-wKduvxXmQXSNMRjXRcajx7a05sg\"",
		"mtime": "2026-09-02T04:41:18.336Z",
		"size": 10297,
		"path": "../public/assets/orbit._profileId-Bt4unFEt.js"
	},
	"/assets/orbit.chat._userId-Z3uRKVAh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9a93-NbF8ZxhyyMHaR1vGLA+qTYcdX/U\"",
		"mtime": "2026-09-02T04:41:18.337Z",
		"size": 39571,
		"path": "../public/assets/orbit.chat._userId-Z3uRKVAh.js"
	},
	"/assets/orbit.create-BLuPQu_A.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"84a0-bgft8pV0SuWSWz5Kqj2KG99VsKk\"",
		"mtime": "2026-09-02T04:41:18.337Z",
		"size": 33952,
		"path": "../public/assets/orbit.create-BLuPQu_A.js"
	},
	"/assets/orbit.index-CqFqMtpZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"72f7-MYTSyo4C0ZQ5wYIPhL31qq6DN1Y\"",
		"mtime": "2026-09-02T04:41:18.337Z",
		"size": 29431,
		"path": "../public/assets/orbit.index-CqFqMtpZ.js"
	},
	"/assets/orbit.me-C2TOrute.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1929-NyNanIskjG9kOMqE0ixEIbmbnlU\"",
		"mtime": "2026-09-02T04:41:18.337Z",
		"size": 6441,
		"path": "../public/assets/orbit.me-C2TOrute.js"
	},
	"/assets/orbit.messages-B95AYmZl.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"337f-3f2CG8ybf4n1EAPwanNppnRMI74\"",
		"mtime": "2026-09-02T04:41:18.337Z",
		"size": 13183,
		"path": "../public/assets/orbit.messages-B95AYmZl.js"
	},
	"/assets/orbit.notifications-C0ebzrPR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cd9-IJM18aC/YesvClR25dZuYXzHc/Y\"",
		"mtime": "2026-09-02T04:41:18.337Z",
		"size": 3289,
		"path": "../public/assets/orbit.notifications-C0ebzrPR.js"
	},
	"/assets/orbit.privacy-DRXFH7p1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3b97-WopLWOdfI9oEC3ioroQPt5teriw\"",
		"mtime": "2026-09-02T04:41:18.337Z",
		"size": 15255,
		"path": "../public/assets/orbit.privacy-DRXFH7p1.js"
	},
	"/assets/pin-BeE_zRtQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"31a-l5uaPsRPR+8pJDClvFJdvEKdlT4\"",
		"mtime": "2026-09-02T04:41:18.337Z",
		"size": 794,
		"path": "../public/assets/pin-BeE_zRtQ.js"
	},
	"/assets/post-1-DzPUIwl-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a3-/lHontMBav2cWjMxgEOVmCwkchs\"",
		"mtime": "2026-09-02T04:41:18.337Z",
		"size": 163,
		"path": "../public/assets/post-1-DzPUIwl-.js"
	},
	"/assets/post-1-uxYyj4Yn.jpg": {
		"type": "image/jpeg",
		"etag": "\"2621b-tADwOglKGR4PvLgzJyB6lOA0+b8\"",
		"mtime": "2026-09-02T04:41:18.339Z",
		"size": 156187,
		"path": "../public/assets/post-1-uxYyj4Yn.jpg"
	},
	"/assets/post.create-C2EFVTjG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15b5-sD9CMcXiqnUnW3CDE+K8erQpAz4\"",
		"mtime": "2026-09-02T04:41:18.337Z",
		"size": 5557,
		"path": "../public/assets/post.create-C2EFVTjG.js"
	},
	"/assets/link-DS1dcRyo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3feb-TtYfNRNFNE5e7QSTbP8vYKNJ8SM\"",
		"mtime": "2026-09-02T04:41:18.336Z",
		"size": 16363,
		"path": "../public/assets/link-DS1dcRyo.js"
	},
	"/assets/profile-DTu5Ndsz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7cf2-bahZ/wx408Gx5ag/L/+Q4h2Ytww\"",
		"mtime": "2026-09-02T04:41:18.337Z",
		"size": 31986,
		"path": "../public/assets/profile-DTu5Ndsz.js"
	},
	"/assets/profiles-map-BYKXlQLv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"32c-lhH+EGZ+LTDmA8T4myD4tx0h5oA\"",
		"mtime": "2026-09-02T04:41:18.337Z",
		"size": 812,
		"path": "../public/assets/profiles-map-BYKXlQLv.js"
	},
	"/assets/purify.es-ChwZkWde.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"68bc-bPPRDEosU/Lqj+2Oyi1ue22LViM\"",
		"mtime": "2026-09-02T04:41:18.337Z",
		"size": 26812,
		"path": "../public/assets/purify.es-ChwZkWde.js"
	},
	"/assets/privacy-BjOGYs5U.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c79-8pC5wLYpg3ebH8DRi2GVC4wTsA4\"",
		"mtime": "2026-09-02T04:41:18.337Z",
		"size": 3193,
		"path": "../public/assets/privacy-BjOGYs5U.js"
	},
	"/assets/react-dom-BS6Gh_TR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e08-9bSgZZ4q4Ni+kAtZEKfL9G1hHrE\"",
		"mtime": "2026-09-02T04:41:18.337Z",
		"size": 3592,
		"path": "../public/assets/react-dom-BS6Gh_TR.js"
	},
	"/assets/redirect-DtIAAt0y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e1-KhpEIx1LNSnb7dNYxiNI58wV9MY\"",
		"mtime": "2026-09-02T04:41:18.337Z",
		"size": 481,
		"path": "../public/assets/redirect-DtIAAt0y.js"
	},
	"/assets/reel-1-DgXdxb9U.jpg": {
		"type": "image/jpeg",
		"etag": "\"158de-632G9IqzPFNj16hyS2vSq2z3WoA\"",
		"mtime": "2026-09-02T04:41:18.340Z",
		"size": 88286,
		"path": "../public/assets/reel-1-DgXdxb9U.jpg"
	},
	"/assets/reel-2-D6ICrDT7.jpg": {
		"type": "image/jpeg",
		"etag": "\"1d3c4-QU1Rig2/vTeF6slkXtMXSVa68U0\"",
		"mtime": "2026-09-02T04:41:18.340Z",
		"size": 119748,
		"path": "../public/assets/reel-2-D6ICrDT7.jpg"
	},
	"/assets/reel-3-BYUKUHRv.jpg": {
		"type": "image/jpeg",
		"etag": "\"8bae-hivl0InXk3Rn4aAy5LSO54t+UZE\"",
		"mtime": "2026-09-02T04:41:18.340Z",
		"size": 35758,
		"path": "../public/assets/reel-3-BYUKUHRv.jpg"
	},
	"/assets/reels-CWIdIaSV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2fea-ozkKwSsX3ZSjchb7ZiBpxnqmTY4\"",
		"mtime": "2026-09-02T04:41:18.338Z",
		"size": 12266,
		"path": "../public/assets/reels-CWIdIaSV.js"
	},
	"/assets/reset-password-CtlTX7h7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"52a-KlzrqeIO5iPcrqTT3fTovbhQmF8\"",
		"mtime": "2026-09-02T04:41:18.338Z",
		"size": 1322,
		"path": "../public/assets/reset-password-CtlTX7h7.js"
	},
	"/assets/rolldown-runtime-hePW80VL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2cc-fA8td6k29UVF6JoPfhOPkceTK1M\"",
		"mtime": "2026-09-02T04:41:18.338Z",
		"size": 716,
		"path": "../public/assets/rolldown-runtime-hePW80VL.js"
	},
	"/assets/root-DLTE-HSj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20-vSYConOtSP6ciwr9zKsPixNwWmc\"",
		"mtime": "2026-09-02T04:41:18.338Z",
		"size": 32,
		"path": "../public/assets/root-DLTE-HSj.js"
	},
	"/assets/route-DH3xeIgs.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8c-rF+t7aA9JGOF897bC1sXx0FYxKs\"",
		"mtime": "2026-09-02T04:41:18.338Z",
		"size": 140,
		"path": "../public/assets/route-DH3xeIgs.js"
	},
	"/assets/routes-DnKldbkI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85f8-tDNGsSy9B5ZMliXKslVVCOKp1/M\"",
		"mtime": "2026-09-02T04:41:18.338Z",
		"size": 34296,
		"path": "../public/assets/routes-DnKldbkI.js"
	},
	"/assets/scan-face-CM2bv4DP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a5-2sX7qfOwFGs4b0QZiHDo+LUoaas\"",
		"mtime": "2026-09-02T04:41:18.338Z",
		"size": 421,
		"path": "../public/assets/scan-face-CM2bv4DP.js"
	},
	"/assets/search-D-TPnCYc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"268e-fgXtNzWksfVeJxBIHd+PP3orcOQ\"",
		"mtime": "2026-09-02T04:41:18.338Z",
		"size": 9870,
		"path": "../public/assets/search-D-TPnCYc.js"
	},
	"/assets/settings-2-x6U2komm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fc-airYhkVLobsDhkRjcuibMjh1Kz4\"",
		"mtime": "2026-09-02T04:41:18.338Z",
		"size": 252,
		"path": "../public/assets/settings-2-x6U2komm.js"
	},
	"/assets/settings-63gKAQz_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e7-H6UEAhV97AbbPJvTM0mgapeyVN4\"",
		"mtime": "2026-09-02T04:41:18.338Z",
		"size": 487,
		"path": "../public/assets/settings-63gKAQz_.js"
	},
	"/assets/sheet-Bzyq6qxn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8a5-Fjx/bJaVELMp+fZIqb4zBv0qs9A\"",
		"mtime": "2026-09-02T04:41:18.338Z",
		"size": 2213,
		"path": "../public/assets/sheet-Bzyq6qxn.js"
	},
	"/assets/shield-TvVcHHSx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"190-IQZ0HXDtipzveT7dmmgPX6/2kng\"",
		"mtime": "2026-09-02T04:41:18.338Z",
		"size": 400,
		"path": "../public/assets/shield-TvVcHHSx.js"
	},
	"/assets/shield-check-DbLP09Mr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"140-kO2Skvjk1wqz1iVSYj10tG7kAAg\"",
		"mtime": "2026-09-02T04:41:18.338Z",
		"size": 320,
		"path": "../public/assets/shield-check-DbLP09Mr.js"
	},
	"/assets/square-nG_BaMNK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"93-N5UoPnJn75SEYhz/11HKB4AH68Y\"",
		"mtime": "2026-09-02T04:41:18.338Z",
		"size": 147,
		"path": "../public/assets/square-nG_BaMNK.js"
	},
	"/assets/styles-DN26rvSz.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"33bd8-NuCHSBQh61PG8cFr+zBlJj1HYSw\"",
		"mtime": "2026-09-02T04:41:18.340Z",
		"size": 211928,
		"path": "../public/assets/styles-DN26rvSz.css"
	},
	"/assets/switch-CD_a5F3A.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1109-AzHR8FW4d3ByFR8jsvrMkvheJyA\"",
		"mtime": "2026-09-02T04:41:18.338Z",
		"size": 4361,
		"path": "../public/assets/switch-CD_a5F3A.js"
	},
	"/assets/terms-DeXu13vF.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"df8-6z80XFy89xSN6L88EtiMJX9HGVg\"",
		"mtime": "2026-09-02T04:41:18.338Z",
		"size": 3576,
		"path": "../public/assets/terms-DeXu13vF.js"
	},
	"/assets/textarea-DT5gOGeJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"232-TWiqdGiGJOGCGTngMWm/Zysm9zQ\"",
		"mtime": "2026-09-02T04:41:18.339Z",
		"size": 562,
		"path": "../public/assets/textarea-DT5gOGeJ.js"
	},
	"/assets/trending-up-T-j540VG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"af-VufyDUdJnT8AG3XdA1pKr1QLzBo\"",
		"mtime": "2026-09-02T04:41:18.339Z",
		"size": 175,
		"path": "../public/assets/trending-up-T-j540VG.js"
	},
	"/assets/triangle-alert-B2hpeTrU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109-hAh5bu7wpC/dyrDkPv2HRWFdK0E\"",
		"mtime": "2026-09-02T04:41:18.339Z",
		"size": 265,
		"path": "../public/assets/triangle-alert-B2hpeTrU.js"
	},
	"/assets/u._userId-DyUlYvbY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16b1-LA9h/sWSaMjaf6nRB9+7/vMvCPk\"",
		"mtime": "2026-09-02T04:41:18.339Z",
		"size": 5809,
		"path": "../public/assets/u._userId-DyUlYvbY.js"
	},
	"/assets/useMatch-CG_Qo4VA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"26c-mf+6Kl2KU/dZTKCvH3wHxYMjLA8\"",
		"mtime": "2026-09-02T04:41:18.339Z",
		"size": 620,
		"path": "../public/assets/useMatch-CG_Qo4VA.js"
	},
	"/assets/useRouter-BP8vT1kh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f38-UAwyZ71XUq5pvhwLvcQ+ekWdEeM\"",
		"mtime": "2026-09-02T04:41:18.339Z",
		"size": 7992,
		"path": "../public/assets/useRouter-BP8vT1kh.js"
	},
	"/assets/useServerFn-CzzciFve.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19d-Q2chUu1zNyiLPgJ8BU4VVAVaG7A\"",
		"mtime": "2026-09-02T04:41:18.339Z",
		"size": 413,
		"path": "../public/assets/useServerFn-CzzciFve.js"
	},
	"/assets/useStore-Bwiy6pX7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"786-iVUaSoWn1x0ZE/FkYImHA2AwxQw\"",
		"mtime": "2026-09-02T04:41:18.339Z",
		"size": 1926,
		"path": "../public/assets/useStore-Bwiy6pX7.js"
	},
	"/assets/video._videoId-Bz4aNcpG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2682-Ntj0KFX0zhz1wL7D3lgvsgcFi/g\"",
		"mtime": "2026-09-02T04:41:18.339Z",
		"size": 9858,
		"path": "../public/assets/video._videoId-Bz4aNcpG.js"
	},
	"/assets/video.upload-CANVg7bB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"264e-xBTyEjTY7V3FgUaat9WUr/Jbb+I\"",
		"mtime": "2026-09-02T04:41:18.339Z",
		"size": 9806,
		"path": "../public/assets/video.upload-CANVg7bB.js"
	},
	"/assets/video-data-CDyiNPLD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19f2-ugLA+0+djujiZMqY+NvZne4MQKs\"",
		"mtime": "2026-09-02T04:41:18.339Z",
		"size": 6642,
		"path": "../public/assets/video-data-CDyiNPLD.js"
	},
	"/assets/yw-download-DwNrhE_c.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"511-/EgO3q0AkwboSGQj5DEH2DCwOEE\"",
		"mtime": "2026-09-02T04:41:18.339Z",
		"size": 1297,
		"path": "../public/assets/yw-download-DwNrhE_c.js"
	},
	"/assets/wallet-DXBObu_G.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"650c4-Qe4rrKgxAzcHPhmlA1yuVDZdVHs\"",
		"mtime": "2026-09-02T04:41:18.339Z",
		"size": 413892,
		"path": "../public/assets/wallet-DXBObu_G.js"
	},
	"/assets/yw-logo-BXjnypdM.png": {
		"type": "image/png",
		"etag": "\"b8bf9-XKz0DAyp9GBS6zs069mBfmp0ubE\"",
		"mtime": "2026-09-02T04:41:18.340Z",
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
