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
		"mtime": "2026-09-03T04:37:37.060Z",
		"size": 163,
		"path": "../public/favicon.svg"
	},
	"/manifest.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"1ea-6VxqHNj9+exgLrKEoBUp7bg4ak0\"",
		"mtime": "2026-09-03T04:37:37.060Z",
		"size": 490,
		"path": "../public/manifest.webmanifest"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"16-iUOtJ2RsHfdY9DoQxaq0wz1LZCU\"",
		"mtime": "2026-09-03T04:37:37.060Z",
		"size": 22,
		"path": "../public/robots.txt"
	},
	"/assets/Avatar-ByANIoCL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"225-oXu6K0Q7g9kboTOsUOc4Pd5BJbE\"",
		"mtime": "2026-09-03T04:37:34.742Z",
		"size": 549,
		"path": "../public/assets/Avatar-ByANIoCL.js"
	},
	"/assets/ChannelContentList-T6j1jKcT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"58e-PzIVeqFFmul+qsS3EMNJ4A0kfZU\"",
		"mtime": "2026-09-03T04:37:34.745Z",
		"size": 1422,
		"path": "../public/assets/ChannelContentList-T6j1jKcT.js"
	},
	"/assets/ClientOnly-BLQ6U6R8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13f-j0SNX9405wGpvG+wmmJESUTpnZI\"",
		"mtime": "2026-09-03T04:37:34.745Z",
		"size": 319,
		"path": "../public/assets/ClientOnly-BLQ6U6R8.js"
	},
	"/assets/FollowListDialog-B2lKY-Li.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16f6-523XyEikFgQE3C4D5TmRdAhD2jc\"",
		"mtime": "2026-09-03T04:37:34.745Z",
		"size": 5878,
		"path": "../public/assets/FollowListDialog-B2lKY-Li.js"
	},
	"/assets/LiveLocationSheet-COEoot7s.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"139d-cWly9oQ2G4kATxhl8H7JZjcf+v0\"",
		"mtime": "2026-09-03T04:37:34.745Z",
		"size": 5021,
		"path": "../public/assets/LiveLocationSheet-COEoot7s.js"
	},
	"/assets/ShareSheet-Ek-4In0U.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a339-bo5xVESpnTtU8aLZEcFuI1wbghI\"",
		"mtime": "2026-09-03T04:37:34.745Z",
		"size": 41785,
		"path": "../public/assets/ShareSheet-Ek-4In0U.js"
	},
	"/assets/VideoPoster-o6CwIOkq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4a67-h50B2oOF6KAAJWMP/otMNm3cBOI\"",
		"mtime": "2026-09-03T04:37:34.746Z",
		"size": 19047,
		"path": "../public/assets/VideoPoster-o6CwIOkq.js"
	},
	"/assets/account-DW_g7GuL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5b18-IzjCURqqcrPWPczAwsE3AvTO8UY\"",
		"mtime": "2026-09-03T04:37:34.746Z",
		"size": 23320,
		"path": "../public/assets/account-DW_g7GuL.js"
	},
	"/assets/alerts-count-BzzCcFm0.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5fb-ie0WLxIL+3hY59+07SYnlEeHqs8\"",
		"mtime": "2026-09-03T04:37:34.746Z",
		"size": 1531,
		"path": "../public/assets/alerts-count-BzzCcFm0.js"
	},
	"/assets/auth-C-muf0W3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"218c-EfshiQesn7tZh7nyc5AaeE/KWzQ\"",
		"mtime": "2026-09-03T04:37:34.746Z",
		"size": 8588,
		"path": "../public/assets/auth-C-muf0W3.js"
	},
	"/assets/button-B86gswgO.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"587-I7wZ0UZsHNxH9yTGfVOxvgUgEqc\"",
		"mtime": "2026-09-03T04:37:34.746Z",
		"size": 1415,
		"path": "../public/assets/button-B86gswgO.js"
	},
	"/assets/channel-data-Da61DvAT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"10a5-eaElEoaaKasmONqNfLzbW8C1Sjg\"",
		"mtime": "2026-09-03T04:37:34.746Z",
		"size": 4261,
		"path": "../public/assets/channel-data-Da61DvAT.js"
	},
	"/assets/channel.analytics-DNm8lX6C.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f5-+1U1s6vVcPPquFQl6KNPy/Uif74\"",
		"mtime": "2026-09-03T04:37:34.746Z",
		"size": 2293,
		"path": "../public/assets/channel.analytics-DNm8lX6C.js"
	},
	"/assets/channel.create-0Luis4uv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1c1a-+YWF51Lfvc6WpkgysTLWwTo7gns\"",
		"mtime": "2026-09-03T04:37:34.746Z",
		"size": 7194,
		"path": "../public/assets/channel.create-0Luis4uv.js"
	},
	"/assets/channel.monetization-B6ThxmFd.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ca2-Ola8yW+554/3UFQKlP4eNYiYpGQ\"",
		"mtime": "2026-09-03T04:37:34.746Z",
		"size": 3234,
		"path": "../public/assets/channel.monetization-B6ThxmFd.js"
	},
	"/assets/channel.posts-BDu9rKJK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11f-auHszNWf2ys/gRjYHqWeJ/S7bfA\"",
		"mtime": "2026-09-03T04:37:34.746Z",
		"size": 287,
		"path": "../public/assets/channel.posts-BDu9rKJK.js"
	},
	"/assets/channel.reels-BnvYCJWK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11f-B91LlXMFh3U60OQv9XN/o5+ctC0\"",
		"mtime": "2026-09-03T04:37:34.746Z",
		"size": 287,
		"path": "../public/assets/channel.reels-BnvYCJWK.js"
	},
	"/assets/channel.subscribers-CLK9KFCz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"542-ORTxtGvX42JcToB1JCk4mBkasV0\"",
		"mtime": "2026-09-03T04:37:34.746Z",
		"size": 1346,
		"path": "../public/assets/channel.subscribers-CLK9KFCz.js"
	},
	"/assets/chat-delete-BWnXjUwz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d6-F4POm6AJ7zxlvQ1Mi4p4PecYRbc\"",
		"mtime": "2026-09-03T04:37:34.747Z",
		"size": 1238,
		"path": "../public/assets/chat-delete-BWnXjUwz.js"
	},
	"/assets/channel.videos-B9CDn2my.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"122-OKY6bHETI+D7WTMd6PfDoqowlVQ\"",
		"mtime": "2026-09-03T04:37:34.747Z",
		"size": 290,
		"path": "../public/assets/channel.videos-B9CDn2my.js"
	},
	"/icon-512.png": {
		"type": "image/png",
		"etag": "\"10033-25w1u01xl/8gQOyAqgrSdkaxdio\"",
		"mtime": "2026-09-03T04:37:37.060Z",
		"size": 65587,
		"path": "../public/icon-512.png"
	},
	"/favicon.png": {
		"type": "image/png",
		"etag": "\"16c7-sHfgQvyMV/xhC2ahSs44WAoIC94\"",
		"mtime": "2026-09-03T04:37:37.060Z",
		"size": 5831,
		"path": "../public/favicon.png"
	},
	"/assets/chat.index-D7B6kpN9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"232e-Yosm39+9WT7Mwope4HWwwukrMS8\"",
		"mtime": "2026-09-03T04:37:34.747Z",
		"size": 9006,
		"path": "../public/assets/chat.index-D7B6kpN9.js"
	},
	"/assets/chevron-left-DCWi8AFo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"82-Nyvjp0DClAKo4jztQSU4y179D+s\"",
		"mtime": "2026-09-03T04:37:34.747Z",
		"size": 130,
		"path": "../public/assets/chevron-left-DCWi8AFo.js"
	},
	"/assets/client-D19Pvsyp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"33951-Ze603q9QjhtVz8UfQjB6ZfjgD/U\"",
		"mtime": "2026-09-03T04:37:34.747Z",
		"size": 211281,
		"path": "../public/assets/client-D19Pvsyp.js"
	},
	"/assets/createLucideIcon-zYGWgMV3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d5-q/IYz1LzVgYGf/TuxC8seyNvMeM\"",
		"mtime": "2026-09-03T04:37:34.747Z",
		"size": 1237,
		"path": "../public/assets/createLucideIcon-zYGWgMV3.js"
	},
	"/assets/copyright-policy-DbT2u661.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"236d-ZJuhA/L14nuyjx+RfwN4+ICQPOA\"",
		"mtime": "2026-09-03T04:37:34.747Z",
		"size": 9069,
		"path": "../public/assets/copyright-policy-DbT2u661.js"
	},
	"/assets/createServerFn-DFrGWrYY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1144-94b+rfGxqTRf9ovIJBLFLlGohMM\"",
		"mtime": "2026-09-03T04:37:34.747Z",
		"size": 4420,
		"path": "../public/assets/createServerFn-DFrGWrYY.js"
	},
	"/assets/dialog-BRCv-PHt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7a6-vTFipa1JEQDbdPDcjOSbptUza5g\"",
		"mtime": "2026-09-03T04:37:34.747Z",
		"size": 1958,
		"path": "../public/assets/dialog-BRCv-PHt.js"
	},
	"/assets/dist-7DHJbmHc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1cc7-WmlEqZx3QjHh6rMuq/jHoa40r6E\"",
		"mtime": "2026-09-03T04:37:34.747Z",
		"size": 7367,
		"path": "../public/assets/dist-7DHJbmHc.js"
	},
	"/assets/dist-9_rQ_Grk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b66-ac4Zo3/Yjuo/arQBE7AOafHNEQo\"",
		"mtime": "2026-09-03T04:37:34.747Z",
		"size": 2918,
		"path": "../public/assets/dist-9_rQ_Grk.js"
	},
	"/assets/dist-B_TsfhQC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12ec-50OukGdhiHTrsLHdbxo4Teb+lZk\"",
		"mtime": "2026-09-03T04:37:34.747Z",
		"size": 4844,
		"path": "../public/assets/dist-B_TsfhQC.js"
	},
	"/assets/dist-DLQt2BcY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2a9-YZYgEHXuUd8kv7q1LqyYawzzkok\"",
		"mtime": "2026-09-03T04:37:34.747Z",
		"size": 681,
		"path": "../public/assets/dist-DLQt2BcY.js"
	},
	"/assets/dist-Dc1n-yF1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6448-vuz42QELlr/MD5R/axhRUlCLg+s\"",
		"mtime": "2026-09-03T04:37:34.747Z",
		"size": 25672,
		"path": "../public/assets/dist-Dc1n-yF1.js"
	},
	"/assets/dist-Djdv0oiS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1399-ihQxlrv+hH9tV+MdxDN6nQjmzbY\"",
		"mtime": "2026-09-03T04:37:34.747Z",
		"size": 5017,
		"path": "../public/assets/dist-Djdv0oiS.js"
	},
	"/assets/dist-DuAOcOVW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109b-xpDAA1NE+Fc3cZIccxM3BihTJF4\"",
		"mtime": "2026-09-03T04:37:34.748Z",
		"size": 4251,
		"path": "../public/assets/dist-DuAOcOVW.js"
	},
	"/assets/dist-vEEVMogm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"282-NXei5B5yj+1pYneRQPbzxWU86GI\"",
		"mtime": "2026-09-03T04:37:34.748Z",
		"size": 642,
		"path": "../public/assets/dist-vEEVMogm.js"
	},
	"/assets/ellipsis-DJa7oDhq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e2-oM+1pCz1H9Iz76NYx8Bi8JeXN7A\"",
		"mtime": "2026-09-03T04:37:34.748Z",
		"size": 226,
		"path": "../public/assets/ellipsis-DJa7oDhq.js"
	},
	"/assets/es2015-CgrRkN0C.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6195-mYq/PhgVmyZLYt9Ix4j8WTXNBXY\"",
		"mtime": "2026-09-03T04:37:34.748Z",
		"size": 24981,
		"path": "../public/assets/es2015-CgrRkN0C.js"
	},
	"/assets/eye-DI6Zkgpx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"100-uvX4r8l9otdsHr/G9bhXYGwdLwI\"",
		"mtime": "2026-09-03T04:37:34.748Z",
		"size": 256,
		"path": "../public/assets/eye-DI6Zkgpx.js"
	},
	"/assets/geo-data-CYKNiDfb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6ce-DiXeUwOVv3S5GUs0RTxhIQieJkk\"",
		"mtime": "2026-09-03T04:37:34.748Z",
		"size": 1742,
		"path": "../public/assets/geo-data-CYKNiDfb.js"
	},
	"/assets/html2canvas-DCcDvdvP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"30b50-/NW/tvs1950d+adFAmG+0O5qROc\"",
		"mtime": "2026-09-03T04:37:34.748Z",
		"size": 199504,
		"path": "../public/assets/html2canvas-DCcDvdvP.js"
	},
	"/assets/image-plus-BEyUefMp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16b-jM/otUDosKLzeNczaPUhwq6ohjw\"",
		"mtime": "2026-09-03T04:37:34.748Z",
		"size": 363,
		"path": "../public/assets/image-plus-BEyUefMp.js"
	},
	"/assets/index.es-qJJ3d5XC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24f8c-266m9OIenjuZddUKzCc3Un3SwSQ\"",
		"mtime": "2026-09-03T04:37:34.748Z",
		"size": 151436,
		"path": "../public/assets/index.es-qJJ3d5XC.js"
	},
	"/assets/input-_K1DO4oD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"296-caBqZi+XbgiehmJsWFDlskgmyLg\"",
		"mtime": "2026-09-03T04:37:34.748Z",
		"size": 662,
		"path": "../public/assets/input-_K1DO4oD.js"
	},
	"/assets/invariant-DrlDULPJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ce1-ZRQDfkQPt4jYb9usOOHjNrKdLto\"",
		"mtime": "2026-09-03T04:37:34.749Z",
		"size": 3297,
		"path": "../public/assets/invariant-DrlDULPJ.js"
	},
	"/assets/index-Bqm_L6xZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a51cd-bejBpFx+BI5cUkvNZcQcP6+Xb/4\"",
		"mtime": "2026-09-03T04:37:34.738Z",
		"size": 676301,
		"path": "../public/assets/index-Bqm_L6xZ.js"
	},
	"/assets/link-DS1dcRyo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3feb-TtYfNRNFNE5e7QSTbP8vYKNJ8SM\"",
		"mtime": "2026-09-03T04:37:34.749Z",
		"size": 16363,
		"path": "../public/assets/link-DS1dcRyo.js"
	},
	"/assets/matchContext-BLaZZjXw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b8-BSjivHXemCqEV+wXXsCe5P0ODLQ\"",
		"mtime": "2026-09-03T04:37:34.749Z",
		"size": 184,
		"path": "../public/assets/matchContext-BLaZZjXw.js"
	},
	"/assets/moment._momentId-TTksMAPx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3e5b-jpRtXm44LlYVHL96xn6H0vsJjRw\"",
		"mtime": "2026-09-03T04:37:34.749Z",
		"size": 15963,
		"path": "../public/assets/moment._momentId-TTksMAPx.js"
	},
	"/assets/moment.index-C01E9Q-r.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c22-JvzxTM6Q/MaVZZHIxoiBdtTxAAY\"",
		"mtime": "2026-09-03T04:37:34.749Z",
		"size": 3106,
		"path": "../public/assets/moment.index-C01E9Q-r.js"
	},
	"/assets/not-found-DIgawKw1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"37-RTB6YH5iXRKeXz1Sn6ZQ+vS0lnc\"",
		"mtime": "2026-09-03T04:37:34.749Z",
		"size": 55,
		"path": "../public/assets/not-found-DIgawKw1.js"
	},
	"/assets/navigation-C8MoOCIK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"94-7DknCKydA7aq83O7EnlD43AHz04\"",
		"mtime": "2026-09-03T04:37:34.749Z",
		"size": 148,
		"path": "../public/assets/navigation-C8MoOCIK.js"
	},
	"/assets/notifications-BcTj5x8a.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"17e6-HeOSJEmJiKTuzO4M6sYsPGKjTKs\"",
		"mtime": "2026-09-03T04:37:34.749Z",
		"size": 6118,
		"path": "../public/assets/notifications-BcTj5x8a.js"
	},
	"/assets/orbit-DFCInEUk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f5-yNpY40KsqCof56wkqsrFf0VmY9A\"",
		"mtime": "2026-09-03T04:37:34.749Z",
		"size": 2293,
		"path": "../public/assets/orbit-DFCInEUk.js"
	},
	"/assets/orbit-match-D_tmuxxe.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a94-H4sGXJJ099IttC5pb4UB8Te3SlQ\"",
		"mtime": "2026-09-03T04:37:34.749Z",
		"size": 2708,
		"path": "../public/assets/orbit-match-D_tmuxxe.js"
	},
	"/assets/orbit-mood-D1SQ3wAI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4f8-0OOOjx3oF76Cb8sSgFsOxSYcYUs\"",
		"mtime": "2026-09-03T04:37:34.749Z",
		"size": 1272,
		"path": "../public/assets/orbit-mood-D1SQ3wAI.js"
	},
	"/assets/orbit-store-D6iDaHdN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3151-nphIah7aAqizCsXuFQnay0hcABw\"",
		"mtime": "2026-09-03T04:37:34.749Z",
		"size": 12625,
		"path": "../public/assets/orbit-store-D6iDaHdN.js"
	},
	"/assets/orbit._profileId-BOEazYfI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2837-3u0JJPptARCOmCTvrCKSDWs8zWU\"",
		"mtime": "2026-09-03T04:37:34.749Z",
		"size": 10295,
		"path": "../public/assets/orbit._profileId-BOEazYfI.js"
	},
	"/assets/orbit.chat._userId-BJs65Ruc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9ae2-47EK34vp6h4ViOaZItdT86tsT2c\"",
		"mtime": "2026-09-03T04:37:34.749Z",
		"size": 39650,
		"path": "../public/assets/orbit.chat._userId-BJs65Ruc.js"
	},
	"/assets/orbit.create-D7O5ikuE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"84a0-nkWNGiAaxuI2rqW8cYVzqstAaZc\"",
		"mtime": "2026-09-03T04:37:34.750Z",
		"size": 33952,
		"path": "../public/assets/orbit.create-D7O5ikuE.js"
	},
	"/assets/orbit.index-DZSFklSw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"72f5-sD7mEfnm9yBhc7Gy4VOEqYhsceg\"",
		"mtime": "2026-09-03T04:37:34.750Z",
		"size": 29429,
		"path": "../public/assets/orbit.index-DZSFklSw.js"
	},
	"/assets/orbit.me-BIOm8X5_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1929-Vt8dybMGWBygtb4ZnuGe1FJ53SU\"",
		"mtime": "2026-09-03T04:37:34.750Z",
		"size": 6441,
		"path": "../public/assets/orbit.me-BIOm8X5_.js"
	},
	"/assets/orbit.messages-CVu5tszw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"337f-7Qz6FEOPvw9SQQ1CanVqUM4gsm8\"",
		"mtime": "2026-09-03T04:37:34.750Z",
		"size": 13183,
		"path": "../public/assets/orbit.messages-CVu5tszw.js"
	},
	"/assets/orbit.notifications-Bj-zviub.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cd9-UN0pVR3gRjGPE0DvYxni1lowH6M\"",
		"mtime": "2026-09-03T04:37:34.750Z",
		"size": 3289,
		"path": "../public/assets/orbit.notifications-Bj-zviub.js"
	},
	"/assets/orbit.privacy-rONxAY-B.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3b97-2P0m1Cu0/R53BBZwcn+AgfqdSXo\"",
		"mtime": "2026-09-03T04:37:34.750Z",
		"size": 15255,
		"path": "../public/assets/orbit.privacy-rONxAY-B.js"
	},
	"/assets/pin-BeE_zRtQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"31a-l5uaPsRPR+8pJDClvFJdvEKdlT4\"",
		"mtime": "2026-09-03T04:37:34.750Z",
		"size": 794,
		"path": "../public/assets/pin-BeE_zRtQ.js"
	},
	"/assets/post.create-Bp_HJg73.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15b5-J83uF7o99LoOMT1dp259faMiTSY\"",
		"mtime": "2026-09-03T04:37:34.750Z",
		"size": 5557,
		"path": "../public/assets/post.create-Bp_HJg73.js"
	},
	"/assets/post-1-uxYyj4Yn.jpg": {
		"type": "image/jpeg",
		"etag": "\"2621b-tADwOglKGR4PvLgzJyB6lOA0+b8\"",
		"mtime": "2026-09-03T04:37:34.753Z",
		"size": 156187,
		"path": "../public/assets/post-1-uxYyj4Yn.jpg"
	},
	"/assets/privacy-6pK2uZZX.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c79-Q2eF4J4+loGnuB0OE4+SK+lhpVY\"",
		"mtime": "2026-09-03T04:37:34.750Z",
		"size": 3193,
		"path": "../public/assets/privacy-6pK2uZZX.js"
	},
	"/assets/profile-ByOvjzlM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7d1b-ahRKmqYuVKo58BMac7rbWoC6QMs\"",
		"mtime": "2026-09-03T04:37:34.750Z",
		"size": 32027,
		"path": "../public/assets/profile-ByOvjzlM.js"
	},
	"/assets/profiles-map-DT10KoJv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"32a-4lxr1/2LhDCRxVO2mb+XMX1IS8w\"",
		"mtime": "2026-09-03T04:37:34.750Z",
		"size": 810,
		"path": "../public/assets/profiles-map-DT10KoJv.js"
	},
	"/assets/redirect-DtIAAt0y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e1-KhpEIx1LNSnb7dNYxiNI58wV9MY\"",
		"mtime": "2026-09-03T04:37:34.750Z",
		"size": 481,
		"path": "../public/assets/redirect-DtIAAt0y.js"
	},
	"/assets/reel-1-DgXdxb9U.jpg": {
		"type": "image/jpeg",
		"etag": "\"158de-632G9IqzPFNj16hyS2vSq2z3WoA\"",
		"mtime": "2026-09-03T04:37:34.753Z",
		"size": 88286,
		"path": "../public/assets/reel-1-DgXdxb9U.jpg"
	},
	"/assets/reel-3-BYUKUHRv.jpg": {
		"type": "image/jpeg",
		"etag": "\"8bae-hivl0InXk3Rn4aAy5LSO54t+UZE\"",
		"mtime": "2026-09-03T04:37:34.754Z",
		"size": 35758,
		"path": "../public/assets/reel-3-BYUKUHRv.jpg"
	},
	"/assets/reel-2-D6ICrDT7.jpg": {
		"type": "image/jpeg",
		"etag": "\"1d3c4-QU1Rig2/vTeF6slkXtMXSVa68U0\"",
		"mtime": "2026-09-03T04:37:34.753Z",
		"size": 119748,
		"path": "../public/assets/reel-2-D6ICrDT7.jpg"
	},
	"/assets/purify.es-ChwZkWde.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"68bc-bPPRDEosU/Lqj+2Oyi1ue22LViM\"",
		"mtime": "2026-09-03T04:37:34.750Z",
		"size": 26812,
		"path": "../public/assets/purify.es-ChwZkWde.js"
	},
	"/assets/reels-p1phYzQ_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"300a-5vSFZ7kwpOs/MqPvIlksL89xGuw\"",
		"mtime": "2026-09-03T04:37:34.751Z",
		"size": 12298,
		"path": "../public/assets/reels-p1phYzQ_.js"
	},
	"/assets/react-dom-BS6Gh_TR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e08-9bSgZZ4q4Ni+kAtZEKfL9G1hHrE\"",
		"mtime": "2026-09-03T04:37:34.750Z",
		"size": 3592,
		"path": "../public/assets/react-dom-BS6Gh_TR.js"
	},
	"/assets/reset-password-__UFvmb_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"52a-2huYwWPSREEOMPQ8vXrnUET6JM8\"",
		"mtime": "2026-09-03T04:37:34.751Z",
		"size": 1322,
		"path": "../public/assets/reset-password-__UFvmb_.js"
	},
	"/assets/rolldown-runtime-hePW80VL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2cc-fA8td6k29UVF6JoPfhOPkceTK1M\"",
		"mtime": "2026-09-03T04:37:34.751Z",
		"size": 716,
		"path": "../public/assets/rolldown-runtime-hePW80VL.js"
	},
	"/assets/root-DLTE-HSj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20-vSYConOtSP6ciwr9zKsPixNwWmc\"",
		"mtime": "2026-09-03T04:37:34.751Z",
		"size": 32,
		"path": "../public/assets/root-DLTE-HSj.js"
	},
	"/assets/route-vW3LY8WL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8c-f6KeXfegQGJ5cYAwwWa9E7pdfdc\"",
		"mtime": "2026-09-03T04:37:34.751Z",
		"size": 140,
		"path": "../public/assets/route-vW3LY8WL.js"
	},
	"/assets/routes-Di6hXKTC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8626-nAYM/pLNxrYH9JNh3ousMZfv9Xc\"",
		"mtime": "2026-09-03T04:37:34.751Z",
		"size": 34342,
		"path": "../public/assets/routes-Di6hXKTC.js"
	},
	"/assets/scan-face-CM2bv4DP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a5-2sX7qfOwFGs4b0QZiHDo+LUoaas\"",
		"mtime": "2026-09-03T04:37:34.751Z",
		"size": 421,
		"path": "../public/assets/scan-face-CM2bv4DP.js"
	},
	"/assets/search-DWRPpy-g.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2cdc-nBD72DzQRiUFzYVkDQZkXJHJpi0\"",
		"mtime": "2026-09-03T04:37:34.751Z",
		"size": 11484,
		"path": "../public/assets/search-DWRPpy-g.js"
	},
	"/assets/settings-63gKAQz_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e7-H6UEAhV97AbbPJvTM0mgapeyVN4\"",
		"mtime": "2026-09-03T04:37:34.751Z",
		"size": 487,
		"path": "../public/assets/settings-63gKAQz_.js"
	},
	"/assets/sheet-DH2kquHJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8a3-pmy5SXAgF9jA1Z7899qeLf4u/aY\"",
		"mtime": "2026-09-03T04:37:34.751Z",
		"size": 2211,
		"path": "../public/assets/sheet-DH2kquHJ.js"
	},
	"/assets/shield-TvVcHHSx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"190-IQZ0HXDtipzveT7dmmgPX6/2kng\"",
		"mtime": "2026-09-03T04:37:34.751Z",
		"size": 400,
		"path": "../public/assets/shield-TvVcHHSx.js"
	},
	"/assets/shield-check-DbLP09Mr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"140-kO2Skvjk1wqz1iVSYj10tG7kAAg\"",
		"mtime": "2026-09-03T04:37:34.751Z",
		"size": 320,
		"path": "../public/assets/shield-check-DbLP09Mr.js"
	},
	"/assets/square-nG_BaMNK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"93-N5UoPnJn75SEYhz/11HKB4AH68Y\"",
		"mtime": "2026-09-03T04:37:34.751Z",
		"size": 147,
		"path": "../public/assets/square-nG_BaMNK.js"
	},
	"/assets/storage-upload-Co-g0cTU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b2d-zpqrgZWc6Cv+xXcPNfwv8fT75V8\"",
		"mtime": "2026-09-03T04:37:34.751Z",
		"size": 2861,
		"path": "../public/assets/storage-upload-Co-g0cTU.js"
	},
	"/assets/settings-2-x6U2komm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fc-airYhkVLobsDhkRjcuibMjh1Kz4\"",
		"mtime": "2026-09-03T04:37:34.751Z",
		"size": 252,
		"path": "../public/assets/settings-2-x6U2komm.js"
	},
	"/assets/styles-DvC5Kgeq.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"33abb-SfJH/06v0sZBXsDgd6GP1gAHkIQ\"",
		"mtime": "2026-09-03T04:37:34.754Z",
		"size": 211643,
		"path": "../public/assets/styles-DvC5Kgeq.css"
	},
	"/assets/switch-CNhC4dYX.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1109-svIJtJj7qdbNWYCwXCI4wt2Vqas\"",
		"mtime": "2026-09-03T04:37:34.751Z",
		"size": 4361,
		"path": "../public/assets/switch-CNhC4dYX.js"
	},
	"/assets/terms-d7R0FOKG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"df8-l4OMeqbabPCRgOQHmwW1fYsCDkM\"",
		"mtime": "2026-09-03T04:37:34.751Z",
		"size": 3576,
		"path": "../public/assets/terms-d7R0FOKG.js"
	},
	"/assets/textarea-BO1T7eEo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"230-9eYKQqZMxutq/Bse29ltiPjLHQE\"",
		"mtime": "2026-09-03T04:37:34.752Z",
		"size": 560,
		"path": "../public/assets/textarea-BO1T7eEo.js"
	},
	"/assets/u._userId-B71XScys.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16cf-NfhZkjLvEIIze/v3coJlJWOXNnc\"",
		"mtime": "2026-09-03T04:37:34.752Z",
		"size": 5839,
		"path": "../public/assets/u._userId-B71XScys.js"
	},
	"/assets/useMatch-CG_Qo4VA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"26c-mf+6Kl2KU/dZTKCvH3wHxYMjLA8\"",
		"mtime": "2026-09-03T04:37:34.752Z",
		"size": 620,
		"path": "../public/assets/useMatch-CG_Qo4VA.js"
	},
	"/assets/useRouter-BP8vT1kh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f38-UAwyZ71XUq5pvhwLvcQ+ekWdEeM\"",
		"mtime": "2026-09-03T04:37:34.752Z",
		"size": 7992,
		"path": "../public/assets/useRouter-BP8vT1kh.js"
	},
	"/assets/useServerFn-CzzciFve.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19d-Q2chUu1zNyiLPgJ8BU4VVAVaG7A\"",
		"mtime": "2026-09-03T04:37:34.752Z",
		"size": 413,
		"path": "../public/assets/useServerFn-CzzciFve.js"
	},
	"/assets/useStore-Bwiy6pX7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"786-iVUaSoWn1x0ZE/FkYImHA2AwxQw\"",
		"mtime": "2026-09-03T04:37:34.752Z",
		"size": 1926,
		"path": "../public/assets/useStore-Bwiy6pX7.js"
	},
	"/assets/video-data-CbMng3BP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"210f-X0mY6oE6PNDE/vHe93rrj4rDYTs\"",
		"mtime": "2026-09-03T04:37:34.752Z",
		"size": 8463,
		"path": "../public/assets/video-data-CbMng3BP.js"
	},
	"/assets/video._videoId-QiwwbY0B.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"26b0-DH0frCVT6JiPWRKUVkpvYaT84UY\"",
		"mtime": "2026-09-03T04:37:34.752Z",
		"size": 9904,
		"path": "../public/assets/video._videoId-QiwwbY0B.js"
	},
	"/assets/triangle-alert-B2hpeTrU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109-hAh5bu7wpC/dyrDkPv2HRWFdK0E\"",
		"mtime": "2026-09-03T04:37:34.752Z",
		"size": 265,
		"path": "../public/assets/triangle-alert-B2hpeTrU.js"
	},
	"/assets/video.upload-18zXpxOj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"264e-/9EnrfAGwUnTKmoGpFiPFfKBERg\"",
		"mtime": "2026-09-03T04:37:34.752Z",
		"size": 9806,
		"path": "../public/assets/video.upload-18zXpxOj.js"
	},
	"/assets/wallet-DvYFc6O6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6509f-Z1Rhs6d0XH0ii2Xh4bdOc1V0euM\"",
		"mtime": "2026-09-03T04:37:34.752Z",
		"size": 413855,
		"path": "../public/assets/wallet-DvYFc6O6.js"
	},
	"/assets/yw-data-Bd96njiI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85-tVhY2OnWfg4oPW2g2MxJpBstjUk\"",
		"mtime": "2026-09-03T04:37:34.753Z",
		"size": 133,
		"path": "../public/assets/yw-data-Bd96njiI.js"
	},
	"/assets/yw-download-DwNrhE_c.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"511-/EgO3q0AkwboSGQj5DEH2DCwOEE\"",
		"mtime": "2026-09-03T04:37:34.753Z",
		"size": 1297,
		"path": "../public/assets/yw-download-DwNrhE_c.js"
	},
	"/assets/yw-logo-BXjnypdM.png": {
		"type": "image/png",
		"etag": "\"b8bf9-XKz0DAyp9GBS6zs069mBfmp0ubE\"",
		"mtime": "2026-09-03T04:37:34.754Z",
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
