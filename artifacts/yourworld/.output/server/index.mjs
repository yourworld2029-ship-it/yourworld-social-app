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
		"mtime": "2026-09-02T05:42:16.026Z",
		"size": 163,
		"path": "../public/favicon.svg"
	},
	"/manifest.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"1ea-6VxqHNj9+exgLrKEoBUp7bg4ak0\"",
		"mtime": "2026-09-02T05:42:16.027Z",
		"size": 490,
		"path": "../public/manifest.webmanifest"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"16-iUOtJ2RsHfdY9DoQxaq0wz1LZCU\"",
		"mtime": "2026-09-02T05:42:16.027Z",
		"size": 22,
		"path": "../public/robots.txt"
	},
	"/assets/ChannelContentList-Ce2eRs60.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"58e-cH49ityenw928qFpO02t9guYtic\"",
		"mtime": "2026-09-02T05:42:13.311Z",
		"size": 1422,
		"path": "../public/assets/ChannelContentList-Ce2eRs60.js"
	},
	"/assets/ClientOnly-BLQ6U6R8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13f-j0SNX9405wGpvG+wmmJESUTpnZI\"",
		"mtime": "2026-09-02T05:42:13.311Z",
		"size": 319,
		"path": "../public/assets/ClientOnly-BLQ6U6R8.js"
	},
	"/assets/Avatar-dYqLEEJD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"227-d4SpGnZm22Ptjh5ZO2lTElbEanc\"",
		"mtime": "2026-09-02T05:42:13.311Z",
		"size": 551,
		"path": "../public/assets/Avatar-dYqLEEJD.js"
	},
	"/assets/FollowListDialog-DOdrPfXh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24ae-SSViHoPpxXoMPO5jVhAbh5D2W+M\"",
		"mtime": "2026-09-02T05:42:13.311Z",
		"size": 9390,
		"path": "../public/assets/FollowListDialog-DOdrPfXh.js"
	},
	"/assets/LiveLocationSheet-DmWggiuL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"139f-RV2LvuxDV6XO5Z/U8ClqkxizyPs\"",
		"mtime": "2026-09-02T05:42:13.311Z",
		"size": 5023,
		"path": "../public/assets/LiveLocationSheet-DmWggiuL.js"
	},
	"/assets/ShareSheet-CtTm4oEg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a3bc-wTzptcpjGh0AQwogqFGO9YbXUqw\"",
		"mtime": "2026-09-02T05:42:13.311Z",
		"size": 41916,
		"path": "../public/assets/ShareSheet-CtTm4oEg.js"
	},
	"/assets/account-D3AgLfUn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"599f-XLuvYXAIDI8q7VKCbSS+W1O5GRA\"",
		"mtime": "2026-09-02T05:42:13.312Z",
		"size": 22943,
		"path": "../public/assets/account-D3AgLfUn.js"
	},
	"/assets/alerts-count-FtJN_wgf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5fd-UXPbSpsRh+2AY5U8WXI3erKyLIU\"",
		"mtime": "2026-09-02T05:42:13.312Z",
		"size": 1533,
		"path": "../public/assets/alerts-count-FtJN_wgf.js"
	},
	"/assets/button-DBJRGcmy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"589-5ubpPPCNCiM9QRsyMt0EndFDvus\"",
		"mtime": "2026-09-02T05:42:13.312Z",
		"size": 1417,
		"path": "../public/assets/button-DBJRGcmy.js"
	},
	"/assets/VideoPoster-COg48NEi.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"491f-MY62Idu+Ug0XC7jF8MCdmJZMeL4\"",
		"mtime": "2026-09-02T05:42:13.312Z",
		"size": 18719,
		"path": "../public/assets/VideoPoster-COg48NEi.js"
	},
	"/assets/auth-BIskrnZx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4988-KWNT51Gn9ZPPpkOnNp08iosU2hY\"",
		"mtime": "2026-09-02T05:42:13.312Z",
		"size": 18824,
		"path": "../public/assets/auth-BIskrnZx.js"
	},
	"/assets/channel.analytics-DnzrLR-H.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"952-dmN4rSkObS7CYkxUBX+UR+4goPc\"",
		"mtime": "2026-09-02T05:42:13.312Z",
		"size": 2386,
		"path": "../public/assets/channel.analytics-DnzrLR-H.js"
	},
	"/assets/channel.create-C5GtOuE5.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1942-l8NPK1ELeLMAiVwFGe6z0/wbgUY\"",
		"mtime": "2026-09-02T05:42:13.312Z",
		"size": 6466,
		"path": "../public/assets/channel.create-C5GtOuE5.js"
	},
	"/assets/channel.monetization-KI87GGAj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9ab-CoHRbCoOPXAfKUvfcK8xHwU1BIE\"",
		"mtime": "2026-09-02T05:42:13.312Z",
		"size": 2475,
		"path": "../public/assets/channel.monetization-KI87GGAj.js"
	},
	"/assets/channel.posts-CdrO13HG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"101-AKxJ+fFd5rmIauufbL+DPTD19rU\"",
		"mtime": "2026-09-02T05:42:13.312Z",
		"size": 257,
		"path": "../public/assets/channel.posts-CdrO13HG.js"
	},
	"/assets/channel.reels-CM9VUjcN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"101-w+oYEy44oaMeoPMLtpTgknUBFps\"",
		"mtime": "2026-09-02T05:42:13.312Z",
		"size": 257,
		"path": "../public/assets/channel.reels-CM9VUjcN.js"
	},
	"/assets/channel.subscribers-B6-Lyxla.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"546-2ko54kvrnYOabNP0jV0FKOeLXwE\"",
		"mtime": "2026-09-02T05:42:13.312Z",
		"size": 1350,
		"path": "../public/assets/channel.subscribers-B6-Lyxla.js"
	},
	"/assets/channel.videos-BmwhLMwZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"103-tizBRuGZ48Bs8ZJesuEh2XA5eLg\"",
		"mtime": "2026-09-02T05:42:13.312Z",
		"size": 259,
		"path": "../public/assets/channel.videos-BmwhLMwZ.js"
	},
	"/assets/chat-delete-BVTZGYPV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d6-c2+HcO61RuonLbBkq86L6aQyAjc\"",
		"mtime": "2026-09-02T05:42:13.312Z",
		"size": 1238,
		"path": "../public/assets/chat-delete-BVTZGYPV.js"
	},
	"/assets/channel-data-Ctiq2G7r.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a77-zoucJ5Mqwdv8DdfRAUhi9/X11Co\"",
		"mtime": "2026-09-02T05:42:13.312Z",
		"size": 2679,
		"path": "../public/assets/channel-data-Ctiq2G7r.js"
	},
	"/favicon.png": {
		"type": "image/png",
		"etag": "\"16c7-sHfgQvyMV/xhC2ahSs44WAoIC94\"",
		"mtime": "2026-09-02T05:42:16.026Z",
		"size": 5831,
		"path": "../public/favicon.png"
	},
	"/icon-512.png": {
		"type": "image/png",
		"etag": "\"10033-25w1u01xl/8gQOyAqgrSdkaxdio\"",
		"mtime": "2026-09-02T05:42:16.026Z",
		"size": 65587,
		"path": "../public/icon-512.png"
	},
	"/assets/chat.index-YuTv7i45.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"232e-NK/NkirIeGWR/wR8vdaPeQFs5jc\"",
		"mtime": "2026-09-02T05:42:13.312Z",
		"size": 9006,
		"path": "../public/assets/chat.index-YuTv7i45.js"
	},
	"/assets/copyright-policy-C0Wa00lT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"236d-7QMvpFLf0RlK1CSj53fJ4z+R0XQ\"",
		"mtime": "2026-09-02T05:42:13.312Z",
		"size": 9069,
		"path": "../public/assets/copyright-policy-C0Wa00lT.js"
	},
	"/assets/createLucideIcon-zYGWgMV3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d5-q/IYz1LzVgYGf/TuxC8seyNvMeM\"",
		"mtime": "2026-09-02T05:42:13.313Z",
		"size": 1237,
		"path": "../public/assets/createLucideIcon-zYGWgMV3.js"
	},
	"/assets/createServerFn-BGDcIRqo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1144-paEDUcwkSMCDxhVMJo/iHeL2a6E\"",
		"mtime": "2026-09-02T05:42:13.313Z",
		"size": 4420,
		"path": "../public/assets/createServerFn-BGDcIRqo.js"
	},
	"/assets/dialog-CH2HRVZw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7a8-5YS4+CuVo8mchVy1zPdVgSVmuPg\"",
		"mtime": "2026-09-02T05:42:13.313Z",
		"size": 1960,
		"path": "../public/assets/dialog-CH2HRVZw.js"
	},
	"/assets/dist-7DHJbmHc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1cc7-WmlEqZx3QjHh6rMuq/jHoa40r6E\"",
		"mtime": "2026-09-02T05:42:13.313Z",
		"size": 7367,
		"path": "../public/assets/dist-7DHJbmHc.js"
	},
	"/assets/dist-9_rQ_Grk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b66-ac4Zo3/Yjuo/arQBE7AOafHNEQo\"",
		"mtime": "2026-09-02T05:42:13.313Z",
		"size": 2918,
		"path": "../public/assets/dist-9_rQ_Grk.js"
	},
	"/assets/dist-CLFYYV_a.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109b-KIOR7l1fjLX2GUfzLqR1BOMiHBM\"",
		"mtime": "2026-09-02T05:42:13.313Z",
		"size": 4251,
		"path": "../public/assets/dist-CLFYYV_a.js"
	},
	"/assets/chevron-left-DCWi8AFo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"82-Nyvjp0DClAKo4jztQSU4y179D+s\"",
		"mtime": "2026-09-02T05:42:13.312Z",
		"size": 130,
		"path": "../public/assets/chevron-left-DCWi8AFo.js"
	},
	"/assets/client-DnLkyxmB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"33f26-QVVoJE3EmmLwW1i5YzRBcnecoLI\"",
		"mtime": "2026-09-02T05:42:13.312Z",
		"size": 212774,
		"path": "../public/assets/client-DnLkyxmB.js"
	},
	"/assets/dist-C_-2UDJZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12ec-1FEwp+yc7Uz7u+XDlTSNw74V3YU\"",
		"mtime": "2026-09-02T05:42:13.313Z",
		"size": 4844,
		"path": "../public/assets/dist-C_-2UDJZ.js"
	},
	"/assets/dist-CSh0JRas.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"282-bbAH945W13H5yJRf2ozLbkv9mmM\"",
		"mtime": "2026-09-02T05:42:13.313Z",
		"size": 642,
		"path": "../public/assets/dist-CSh0JRas.js"
	},
	"/assets/dist-DLQt2BcY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2a9-YZYgEHXuUd8kv7q1LqyYawzzkok\"",
		"mtime": "2026-09-02T05:42:13.313Z",
		"size": 681,
		"path": "../public/assets/dist-DLQt2BcY.js"
	},
	"/assets/ellipsis-DJa7oDhq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e2-oM+1pCz1H9Iz76NYx8Bi8JeXN7A\"",
		"mtime": "2026-09-02T05:42:13.313Z",
		"size": 226,
		"path": "../public/assets/ellipsis-DJa7oDhq.js"
	},
	"/assets/dist-Djdv0oiS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1399-ihQxlrv+hH9tV+MdxDN6nQjmzbY\"",
		"mtime": "2026-09-02T05:42:13.313Z",
		"size": 5017,
		"path": "../public/assets/dist-Djdv0oiS.js"
	},
	"/assets/dist-DzKbB2qR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6448-VjH84bT8g3UObxtUL63dqPzjyEE\"",
		"mtime": "2026-09-02T05:42:13.313Z",
		"size": 25672,
		"path": "../public/assets/dist-DzKbB2qR.js"
	},
	"/assets/es2015-DwyJt8vE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6190-ilXu9jOkwmKu9nhCu/WcHOX0hPU\"",
		"mtime": "2026-09-02T05:42:13.314Z",
		"size": 24976,
		"path": "../public/assets/es2015-DwyJt8vE.js"
	},
	"/assets/eye-DI6Zkgpx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"100-uvX4r8l9otdsHr/G9bhXYGwdLwI\"",
		"mtime": "2026-09-02T05:42:13.314Z",
		"size": 256,
		"path": "../public/assets/eye-DI6Zkgpx.js"
	},
	"/assets/geo-data-CYKNiDfb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6ce-DiXeUwOVv3S5GUs0RTxhIQieJkk\"",
		"mtime": "2026-09-02T05:42:13.314Z",
		"size": 1742,
		"path": "../public/assets/geo-data-CYKNiDfb.js"
	},
	"/assets/image-plus-BEyUefMp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16b-jM/otUDosKLzeNczaPUhwq6ohjw\"",
		"mtime": "2026-09-02T05:42:13.314Z",
		"size": 363,
		"path": "../public/assets/image-plus-BEyUefMp.js"
	},
	"/assets/html2canvas-DCcDvdvP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"30b50-/NW/tvs1950d+adFAmG+0O5qROc\"",
		"mtime": "2026-09-02T05:42:13.314Z",
		"size": 199504,
		"path": "../public/assets/html2canvas-DCcDvdvP.js"
	},
	"/assets/index.es-FTJv9H1B.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24f8c-YZ8vlDJKjB+I7jlGdzLjEgxL4rU\"",
		"mtime": "2026-09-02T05:42:13.314Z",
		"size": 151436,
		"path": "../public/assets/index.es-FTJv9H1B.js"
	},
	"/assets/input-D9CKMmua.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"298-6ftwFSIAwKXgWBK08wsPk356AGE\"",
		"mtime": "2026-09-02T05:42:13.314Z",
		"size": 664,
		"path": "../public/assets/input-D9CKMmua.js"
	},
	"/assets/invariant-DrlDULPJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ce1-ZRQDfkQPt4jYb9usOOHjNrKdLto\"",
		"mtime": "2026-09-02T05:42:13.315Z",
		"size": 3297,
		"path": "../public/assets/invariant-DrlDULPJ.js"
	},
	"/assets/index-B9eSEf7R.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a4d93-mZu53dlPcR1xJ2cwMpeESdnulb0\"",
		"mtime": "2026-09-02T05:42:13.308Z",
		"size": 675219,
		"path": "../public/assets/index-B9eSEf7R.js"
	},
	"/assets/link-DS1dcRyo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3feb-TtYfNRNFNE5e7QSTbP8vYKNJ8SM\"",
		"mtime": "2026-09-02T05:42:13.315Z",
		"size": 16363,
		"path": "../public/assets/link-DS1dcRyo.js"
	},
	"/assets/matchContext-BLaZZjXw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b8-BSjivHXemCqEV+wXXsCe5P0ODLQ\"",
		"mtime": "2026-09-02T05:42:13.315Z",
		"size": 184,
		"path": "../public/assets/matchContext-BLaZZjXw.js"
	},
	"/assets/moment._momentId-BhxGC27h.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3e5b-rInVdlw/+xk6wNBQ750bQHs9Azg\"",
		"mtime": "2026-09-02T05:42:13.315Z",
		"size": 15963,
		"path": "../public/assets/moment._momentId-BhxGC27h.js"
	},
	"/assets/moment.index-D_QEV6JZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c22-ZDmz20kqOfMoC4nLsc+IfXJ9GoE\"",
		"mtime": "2026-09-02T05:42:13.315Z",
		"size": 3106,
		"path": "../public/assets/moment.index-D_QEV6JZ.js"
	},
	"/assets/navigation-C8MoOCIK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"94-7DknCKydA7aq83O7EnlD43AHz04\"",
		"mtime": "2026-09-02T05:42:13.315Z",
		"size": 148,
		"path": "../public/assets/navigation-C8MoOCIK.js"
	},
	"/assets/not-found-DIgawKw1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"37-RTB6YH5iXRKeXz1Sn6ZQ+vS0lnc\"",
		"mtime": "2026-09-02T05:42:13.315Z",
		"size": 55,
		"path": "../public/assets/not-found-DIgawKw1.js"
	},
	"/assets/notifications-uW2STu3z.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"17e6-KFBn6ccTswg+KsBbAqulF8vpE2w\"",
		"mtime": "2026-09-02T05:42:13.315Z",
		"size": 6118,
		"path": "../public/assets/notifications-uW2STu3z.js"
	},
	"/assets/orbit-CDlWE5i6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f7-1LtvpP2192DN8L4sF4Gl+1Qg/TU\"",
		"mtime": "2026-09-02T05:42:13.315Z",
		"size": 2295,
		"path": "../public/assets/orbit-CDlWE5i6.js"
	},
	"/assets/orbit-match-H9B19Z5U.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a96-en60ncld2snrseiwMWVu6CM4F9k\"",
		"mtime": "2026-09-02T05:42:13.315Z",
		"size": 2710,
		"path": "../public/assets/orbit-match-H9B19Z5U.js"
	},
	"/assets/orbit-mood-D1SQ3wAI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4f8-0OOOjx3oF76Cb8sSgFsOxSYcYUs\"",
		"mtime": "2026-09-02T05:42:13.315Z",
		"size": 1272,
		"path": "../public/assets/orbit-mood-D1SQ3wAI.js"
	},
	"/assets/orbit-store-BKmjI2m2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3b4d-8DNRJgovTeegUn/ZnD32Q8bowQI\"",
		"mtime": "2026-09-02T05:42:13.315Z",
		"size": 15181,
		"path": "../public/assets/orbit-store-BKmjI2m2.js"
	},
	"/assets/orbit.chat._userId-Bxgtvgvk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9a93-zpLLilaISBQnChCUi6bsDofdPsI\"",
		"mtime": "2026-09-02T05:42:13.315Z",
		"size": 39571,
		"path": "../public/assets/orbit.chat._userId-Bxgtvgvk.js"
	},
	"/assets/orbit.create-DBd24maS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"84a0-/ByCmSb0k8mwk7NT5GUP+weaKug\"",
		"mtime": "2026-09-02T05:42:13.315Z",
		"size": 33952,
		"path": "../public/assets/orbit.create-DBd24maS.js"
	},
	"/assets/orbit.index-CLpHbwBQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"72f7-U1SP425xaN8fF06ajgj4P4TZVdM\"",
		"mtime": "2026-09-02T05:42:13.315Z",
		"size": 29431,
		"path": "../public/assets/orbit.index-CLpHbwBQ.js"
	},
	"/assets/orbit._profileId-BYi22kjc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2839-u4vooL4lUh+BZX8WZa/V+8uB4CM\"",
		"mtime": "2026-09-02T05:42:13.315Z",
		"size": 10297,
		"path": "../public/assets/orbit._profileId-BYi22kjc.js"
	},
	"/assets/orbit.me-xvVqEcRW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1929-MP4k54RwnMyyloaFsdvPsMuq3BY\"",
		"mtime": "2026-09-02T05:42:13.315Z",
		"size": 6441,
		"path": "../public/assets/orbit.me-xvVqEcRW.js"
	},
	"/assets/orbit.messages-smd_1KK1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"337f-5t1xA3ZkgUapxl8jfA2K/87wZCo\"",
		"mtime": "2026-09-02T05:42:13.315Z",
		"size": 13183,
		"path": "../public/assets/orbit.messages-smd_1KK1.js"
	},
	"/assets/orbit.notifications-Bs3bYraP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cd9-8e6alCrEzWROi+T+5lBVXwLw5Po\"",
		"mtime": "2026-09-02T05:42:13.316Z",
		"size": 3289,
		"path": "../public/assets/orbit.notifications-Bs3bYraP.js"
	},
	"/assets/orbit.privacy-DYgQxad_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3b97-IpMOps4h5MRF0LzBB5JOQLWqZ1Y\"",
		"mtime": "2026-09-02T05:42:13.316Z",
		"size": 15255,
		"path": "../public/assets/orbit.privacy-DYgQxad_.js"
	},
	"/assets/pin-BeE_zRtQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"31a-l5uaPsRPR+8pJDClvFJdvEKdlT4\"",
		"mtime": "2026-09-02T05:42:13.316Z",
		"size": 794,
		"path": "../public/assets/pin-BeE_zRtQ.js"
	},
	"/assets/post-1-DzPUIwl-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a3-/lHontMBav2cWjMxgEOVmCwkchs\"",
		"mtime": "2026-09-02T05:42:13.316Z",
		"size": 163,
		"path": "../public/assets/post-1-DzPUIwl-.js"
	},
	"/assets/post-1-uxYyj4Yn.jpg": {
		"type": "image/jpeg",
		"etag": "\"2621b-tADwOglKGR4PvLgzJyB6lOA0+b8\"",
		"mtime": "2026-09-02T05:42:13.319Z",
		"size": 156187,
		"path": "../public/assets/post-1-uxYyj4Yn.jpg"
	},
	"/assets/post.create-C-BhBvtY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15b5-j+fuymGe+rZzw0v3J/70WNHQ/Tc\"",
		"mtime": "2026-09-02T05:42:13.316Z",
		"size": 5557,
		"path": "../public/assets/post.create-C-BhBvtY.js"
	},
	"/assets/privacy-CgXHbKvW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c79-ONgypre2XQ/COw0vQJmCJyYauGU\"",
		"mtime": "2026-09-02T05:42:13.316Z",
		"size": 3193,
		"path": "../public/assets/privacy-CgXHbKvW.js"
	},
	"/assets/profile-Ca4jQBp3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7cf2-M2J0s1z72d9yXmiBV1e7H/TowPo\"",
		"mtime": "2026-09-02T05:42:13.316Z",
		"size": 31986,
		"path": "../public/assets/profile-Ca4jQBp3.js"
	},
	"/assets/profiles-map-BYKXlQLv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"32c-lhH+EGZ+LTDmA8T4myD4tx0h5oA\"",
		"mtime": "2026-09-02T05:42:13.316Z",
		"size": 812,
		"path": "../public/assets/profiles-map-BYKXlQLv.js"
	},
	"/assets/purify.es-ChwZkWde.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"68bc-bPPRDEosU/Lqj+2Oyi1ue22LViM\"",
		"mtime": "2026-09-02T05:42:13.316Z",
		"size": 26812,
		"path": "../public/assets/purify.es-ChwZkWde.js"
	},
	"/assets/react-dom-BS6Gh_TR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e08-9bSgZZ4q4Ni+kAtZEKfL9G1hHrE\"",
		"mtime": "2026-09-02T05:42:13.316Z",
		"size": 3592,
		"path": "../public/assets/react-dom-BS6Gh_TR.js"
	},
	"/assets/redirect-DtIAAt0y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e1-KhpEIx1LNSnb7dNYxiNI58wV9MY\"",
		"mtime": "2026-09-02T05:42:13.316Z",
		"size": 481,
		"path": "../public/assets/redirect-DtIAAt0y.js"
	},
	"/assets/reel-1-DgXdxb9U.jpg": {
		"type": "image/jpeg",
		"etag": "\"158de-632G9IqzPFNj16hyS2vSq2z3WoA\"",
		"mtime": "2026-09-02T05:42:13.319Z",
		"size": 88286,
		"path": "../public/assets/reel-1-DgXdxb9U.jpg"
	},
	"/assets/reel-2-D6ICrDT7.jpg": {
		"type": "image/jpeg",
		"etag": "\"1d3c4-QU1Rig2/vTeF6slkXtMXSVa68U0\"",
		"mtime": "2026-09-02T05:42:13.319Z",
		"size": 119748,
		"path": "../public/assets/reel-2-D6ICrDT7.jpg"
	},
	"/assets/reel-3-BYUKUHRv.jpg": {
		"type": "image/jpeg",
		"etag": "\"8bae-hivl0InXk3Rn4aAy5LSO54t+UZE\"",
		"mtime": "2026-09-02T05:42:13.319Z",
		"size": 35758,
		"path": "../public/assets/reel-3-BYUKUHRv.jpg"
	},
	"/assets/reels-BXShmlSk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2fea-zEnccnt5tReWV36DZIkpSrrL18I\"",
		"mtime": "2026-09-02T05:42:13.316Z",
		"size": 12266,
		"path": "../public/assets/reels-BXShmlSk.js"
	},
	"/assets/reset-password-NX2-BclC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"52a-5aGwPYJggZerZcmaWGKkK4UB0Uc\"",
		"mtime": "2026-09-02T05:42:13.316Z",
		"size": 1322,
		"path": "../public/assets/reset-password-NX2-BclC.js"
	},
	"/assets/root-DLTE-HSj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20-vSYConOtSP6ciwr9zKsPixNwWmc\"",
		"mtime": "2026-09-02T05:42:13.316Z",
		"size": 32,
		"path": "../public/assets/root-DLTE-HSj.js"
	},
	"/assets/rolldown-runtime-hePW80VL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2cc-fA8td6k29UVF6JoPfhOPkceTK1M\"",
		"mtime": "2026-09-02T05:42:13.316Z",
		"size": 716,
		"path": "../public/assets/rolldown-runtime-hePW80VL.js"
	},
	"/assets/route-BrulaAuC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8c-DaN3p3A87jhlpLaKoDFMJCwUUdQ\"",
		"mtime": "2026-09-02T05:42:13.317Z",
		"size": 140,
		"path": "../public/assets/route-BrulaAuC.js"
	},
	"/assets/routes-MW1Z8Udw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85d9-h0B3iLXgXktUTbBIFSouQaU2EdI\"",
		"mtime": "2026-09-02T05:42:13.317Z",
		"size": 34265,
		"path": "../public/assets/routes-MW1Z8Udw.js"
	},
	"/assets/scan-face-CM2bv4DP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a5-2sX7qfOwFGs4b0QZiHDo+LUoaas\"",
		"mtime": "2026-09-02T05:42:13.317Z",
		"size": 421,
		"path": "../public/assets/scan-face-CM2bv4DP.js"
	},
	"/assets/settings-2-x6U2komm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fc-airYhkVLobsDhkRjcuibMjh1Kz4\"",
		"mtime": "2026-09-02T05:42:13.317Z",
		"size": 252,
		"path": "../public/assets/settings-2-x6U2komm.js"
	},
	"/assets/search-DZ9JtbBH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"268e-Q1rulq29wphq2I/MckMnv/ou2zU\"",
		"mtime": "2026-09-02T05:42:13.317Z",
		"size": 9870,
		"path": "../public/assets/search-DZ9JtbBH.js"
	},
	"/assets/sheet-DbtPZby2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8a5-89x7iIR4cnxy1urC/lRvQPI1dqo\"",
		"mtime": "2026-09-02T05:42:13.317Z",
		"size": 2213,
		"path": "../public/assets/sheet-DbtPZby2.js"
	},
	"/assets/shield-TvVcHHSx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"190-IQZ0HXDtipzveT7dmmgPX6/2kng\"",
		"mtime": "2026-09-02T05:42:13.317Z",
		"size": 400,
		"path": "../public/assets/shield-TvVcHHSx.js"
	},
	"/assets/settings-63gKAQz_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e7-H6UEAhV97AbbPJvTM0mgapeyVN4\"",
		"mtime": "2026-09-02T05:42:13.317Z",
		"size": 487,
		"path": "../public/assets/settings-63gKAQz_.js"
	},
	"/assets/square-nG_BaMNK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"93-N5UoPnJn75SEYhz/11HKB4AH68Y\"",
		"mtime": "2026-09-02T05:42:13.317Z",
		"size": 147,
		"path": "../public/assets/square-nG_BaMNK.js"
	},
	"/assets/shield-check-DbLP09Mr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"140-kO2Skvjk1wqz1iVSYj10tG7kAAg\"",
		"mtime": "2026-09-02T05:42:13.317Z",
		"size": 320,
		"path": "../public/assets/shield-check-DbLP09Mr.js"
	},
	"/assets/switch-VqAbDBiO.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1109-6K2x+paDWbzhEZRTj70zdgHOQcA\"",
		"mtime": "2026-09-02T05:42:13.317Z",
		"size": 4361,
		"path": "../public/assets/switch-VqAbDBiO.js"
	},
	"/assets/styles-DN26rvSz.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"33bd8-NuCHSBQh61PG8cFr+zBlJj1HYSw\"",
		"mtime": "2026-09-02T05:42:13.319Z",
		"size": 211928,
		"path": "../public/assets/styles-DN26rvSz.css"
	},
	"/assets/textarea-CkQBhi2_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"232-Npm5g54cC77nD4163LJVOk1D8BU\"",
		"mtime": "2026-09-02T05:42:13.317Z",
		"size": 562,
		"path": "../public/assets/textarea-CkQBhi2_.js"
	},
	"/assets/terms-BCQ9xP4C.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"df8-Xbp7FC0Qs9PM+cRsBpiVVh2IQR8\"",
		"mtime": "2026-09-02T05:42:13.317Z",
		"size": 3576,
		"path": "../public/assets/terms-BCQ9xP4C.js"
	},
	"/assets/trending-up-T-j540VG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"af-VufyDUdJnT8AG3XdA1pKr1QLzBo\"",
		"mtime": "2026-09-02T05:42:13.318Z",
		"size": 175,
		"path": "../public/assets/trending-up-T-j540VG.js"
	},
	"/assets/triangle-alert-B2hpeTrU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109-hAh5bu7wpC/dyrDkPv2HRWFdK0E\"",
		"mtime": "2026-09-02T05:42:13.318Z",
		"size": 265,
		"path": "../public/assets/triangle-alert-B2hpeTrU.js"
	},
	"/assets/u._userId-CobyYoUm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16b1-YQ4tgniGY0/9bgZfgAK/W1k9QWY\"",
		"mtime": "2026-09-02T05:42:13.318Z",
		"size": 5809,
		"path": "../public/assets/u._userId-CobyYoUm.js"
	},
	"/assets/useMatch-CG_Qo4VA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"26c-mf+6Kl2KU/dZTKCvH3wHxYMjLA8\"",
		"mtime": "2026-09-02T05:42:13.318Z",
		"size": 620,
		"path": "../public/assets/useMatch-CG_Qo4VA.js"
	},
	"/assets/useRouter-BP8vT1kh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f38-UAwyZ71XUq5pvhwLvcQ+ekWdEeM\"",
		"mtime": "2026-09-02T05:42:13.318Z",
		"size": 7992,
		"path": "../public/assets/useRouter-BP8vT1kh.js"
	},
	"/assets/useServerFn-CzzciFve.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19d-Q2chUu1zNyiLPgJ8BU4VVAVaG7A\"",
		"mtime": "2026-09-02T05:42:13.318Z",
		"size": 413,
		"path": "../public/assets/useServerFn-CzzciFve.js"
	},
	"/assets/useStore-Bwiy6pX7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"786-iVUaSoWn1x0ZE/FkYImHA2AwxQw\"",
		"mtime": "2026-09-02T05:42:13.318Z",
		"size": 1926,
		"path": "../public/assets/useStore-Bwiy6pX7.js"
	},
	"/assets/video-data-BxF7dwzp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a5f-dG5dzyu5mOKLEjg+zwObZ56O7bE\"",
		"mtime": "2026-09-02T05:42:13.318Z",
		"size": 6751,
		"path": "../public/assets/video-data-BxF7dwzp.js"
	},
	"/assets/video._videoId-ByWwo1X6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2666-MZiiLPmZjBX2cwPO7TjlOg818Tg\"",
		"mtime": "2026-09-02T05:42:13.318Z",
		"size": 9830,
		"path": "../public/assets/video._videoId-ByWwo1X6.js"
	},
	"/assets/video.upload-BHwyeTTp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"264e-mfdoTwEXdT3ozCKWyeWn2xP0Qac\"",
		"mtime": "2026-09-02T05:42:13.318Z",
		"size": 9806,
		"path": "../public/assets/video.upload-BHwyeTTp.js"
	},
	"/assets/wallet-B35XC-kr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"650c4-zEyQ5Y13RyrLdOU9uofuwCdY3gk\"",
		"mtime": "2026-09-02T05:42:13.318Z",
		"size": 413892,
		"path": "../public/assets/wallet-B35XC-kr.js"
	},
	"/assets/yw-download-DwNrhE_c.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"511-/EgO3q0AkwboSGQj5DEH2DCwOEE\"",
		"mtime": "2026-09-02T05:42:13.319Z",
		"size": 1297,
		"path": "../public/assets/yw-download-DwNrhE_c.js"
	},
	"/assets/yw-logo-BXjnypdM.png": {
		"type": "image/png",
		"etag": "\"b8bf9-XKz0DAyp9GBS6zs069mBfmp0ubE\"",
		"mtime": "2026-09-02T05:42:13.319Z",
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
