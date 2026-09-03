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
		"mtime": "2026-09-03T03:21:33.923Z",
		"size": 163,
		"path": "../public/favicon.svg"
	},
	"/favicon.png": {
		"type": "image/png",
		"etag": "\"16c7-sHfgQvyMV/xhC2ahSs44WAoIC94\"",
		"mtime": "2026-09-03T03:21:33.923Z",
		"size": 5831,
		"path": "../public/favicon.png"
	},
	"/manifest.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"1ea-6VxqHNj9+exgLrKEoBUp7bg4ak0\"",
		"mtime": "2026-09-03T03:21:33.923Z",
		"size": 490,
		"path": "../public/manifest.webmanifest"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"16-iUOtJ2RsHfdY9DoQxaq0wz1LZCU\"",
		"mtime": "2026-09-03T03:21:33.923Z",
		"size": 22,
		"path": "../public/robots.txt"
	},
	"/assets/Avatar-g8P9-tJ5.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"225-bz0voXPGnP3JBkr7PlRr3meA1Lc\"",
		"mtime": "2026-09-03T03:21:31.523Z",
		"size": 549,
		"path": "../public/assets/Avatar-g8P9-tJ5.js"
	},
	"/assets/ChannelContentList-B3mKiBSG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"58e-gOJ8zLrqqBgVZKn3hZ7lcDvE534\"",
		"mtime": "2026-09-03T03:21:31.523Z",
		"size": 1422,
		"path": "../public/assets/ChannelContentList-B3mKiBSG.js"
	},
	"/assets/ClientOnly-BLQ6U6R8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13f-j0SNX9405wGpvG+wmmJESUTpnZI\"",
		"mtime": "2026-09-03T03:21:31.523Z",
		"size": 319,
		"path": "../public/assets/ClientOnly-BLQ6U6R8.js"
	},
	"/assets/FollowListDialog-0AStl_r-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16f6-rwJXNB9i/U+AegOAyuqJdnWGEGk\"",
		"mtime": "2026-09-03T03:21:31.523Z",
		"size": 5878,
		"path": "../public/assets/FollowListDialog-0AStl_r-.js"
	},
	"/assets/LiveLocationSheet-NSfv6slC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"139d-DAjwUCXR7R7IldKJ+Nyq4Py4znU\"",
		"mtime": "2026-09-03T03:21:31.523Z",
		"size": 5021,
		"path": "../public/assets/LiveLocationSheet-NSfv6slC.js"
	},
	"/assets/VideoPoster--_SzfjlJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4a66-ZBsEJaOEQi+oBlE0u5pIIkrUSbY\"",
		"mtime": "2026-09-03T03:21:31.523Z",
		"size": 19046,
		"path": "../public/assets/VideoPoster--_SzfjlJ.js"
	},
	"/assets/ShareSheet-DSeG1FAG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a2ed-hIh60uAoCintNwVZ2c5p2XH1u/g\"",
		"mtime": "2026-09-03T03:21:31.523Z",
		"size": 41709,
		"path": "../public/assets/ShareSheet-DSeG1FAG.js"
	},
	"/assets/alerts-count-BzzCcFm0.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5fb-ie0WLxIL+3hY59+07SYnlEeHqs8\"",
		"mtime": "2026-09-03T03:21:31.523Z",
		"size": 1531,
		"path": "../public/assets/alerts-count-BzzCcFm0.js"
	},
	"/assets/auth-CNuZXGWD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"218c-5GK8lqw67kKZBhflpwU2Dx76nkQ\"",
		"mtime": "2026-09-03T03:21:31.523Z",
		"size": 8588,
		"path": "../public/assets/auth-CNuZXGWD.js"
	},
	"/assets/button-D7d4WRHo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"587-afEobqUeo2uCjleEhQy+EaiZbxw\"",
		"mtime": "2026-09-03T03:21:31.523Z",
		"size": 1415,
		"path": "../public/assets/button-D7d4WRHo.js"
	},
	"/assets/account-BYqI2sfT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5b18-PbgvspPEI09siCtNPkiJAnyE8Oc\"",
		"mtime": "2026-09-03T03:21:31.523Z",
		"size": 23320,
		"path": "../public/assets/account-BYqI2sfT.js"
	},
	"/assets/channel.analytics-CPino2JM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f5-QnSVEbBknm/0mOtAhj96wOZLxEs\"",
		"mtime": "2026-09-03T03:21:31.523Z",
		"size": 2293,
		"path": "../public/assets/channel.analytics-CPino2JM.js"
	},
	"/assets/channel-data-DdMHIqdB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"10a5-uINow4L1k1gOjxavHRcpoAQJBaQ\"",
		"mtime": "2026-09-03T03:21:31.523Z",
		"size": 4261,
		"path": "../public/assets/channel-data-DdMHIqdB.js"
	},
	"/assets/channel.create-D2RTkvZ-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1942-2ePksGgck3Sq5iOc54jwiCr7EEw\"",
		"mtime": "2026-09-03T03:21:31.523Z",
		"size": 6466,
		"path": "../public/assets/channel.create-D2RTkvZ-.js"
	},
	"/assets/channel.monetization-D9f9AFtD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a94-HjGMDzgYzPKpIi3Xan4GSTspINY\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 2708,
		"path": "../public/assets/channel.monetization-D9f9AFtD.js"
	},
	"/assets/channel.posts-Ds3Sn0ZH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11f-8sFhNpX960kDDLtRa/dDKETAmxg\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 287,
		"path": "../public/assets/channel.posts-Ds3Sn0ZH.js"
	},
	"/assets/channel.reels-B5wkwZCb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11f-tnmv+eH9jStYJDAe8DA2+Zbwyqs\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 287,
		"path": "../public/assets/channel.reels-B5wkwZCb.js"
	},
	"/assets/channel.subscribers--VuYVVME.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"542-ivBE5DBUwqxtnjy1rLrmym2y1io\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 1346,
		"path": "../public/assets/channel.subscribers--VuYVVME.js"
	},
	"/assets/channel.videos-Tk5USvGB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"122-XMxkP++H1/bXx9LLmgKN9+btj6w\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 290,
		"path": "../public/assets/channel.videos-Tk5USvGB.js"
	},
	"/assets/chat-delete-BWnXjUwz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d6-F4POm6AJ7zxlvQ1Mi4p4PecYRbc\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 1238,
		"path": "../public/assets/chat-delete-BWnXjUwz.js"
	},
	"/icon-512.png": {
		"type": "image/png",
		"etag": "\"10033-25w1u01xl/8gQOyAqgrSdkaxdio\"",
		"mtime": "2026-09-03T03:21:33.923Z",
		"size": 65587,
		"path": "../public/icon-512.png"
	},
	"/assets/chat.index-BhFSpkRl.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"232e-HB7kRdYpdsr4LTWU4+pp5PI8Fs4\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 9006,
		"path": "../public/assets/chat.index-BhFSpkRl.js"
	},
	"/assets/chevron-left-DCWi8AFo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"82-Nyvjp0DClAKo4jztQSU4y179D+s\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 130,
		"path": "../public/assets/chevron-left-DCWi8AFo.js"
	},
	"/assets/client-D19Pvsyp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"33951-Ze603q9QjhtVz8UfQjB6ZfjgD/U\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 211281,
		"path": "../public/assets/client-D19Pvsyp.js"
	},
	"/assets/copyright-policy-BST6lsbq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"236d-czFyEMvXkew2slFsRya2YM+ZOYk\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 9069,
		"path": "../public/assets/copyright-policy-BST6lsbq.js"
	},
	"/assets/createLucideIcon-zYGWgMV3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d5-q/IYz1LzVgYGf/TuxC8seyNvMeM\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 1237,
		"path": "../public/assets/createLucideIcon-zYGWgMV3.js"
	},
	"/assets/createServerFn-G2Crp4xF.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1144-sqm0ClckxkiCidkwdFWrYz4V4dA\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 4420,
		"path": "../public/assets/createServerFn-G2Crp4xF.js"
	},
	"/assets/dialog-Dei1rFqF.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7a6-kOWyZbe+RMrJXrl/kT9dXGhxUvY\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 1958,
		"path": "../public/assets/dialog-Dei1rFqF.js"
	},
	"/assets/dist-7DHJbmHc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1cc7-WmlEqZx3QjHh6rMuq/jHoa40r6E\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 7367,
		"path": "../public/assets/dist-7DHJbmHc.js"
	},
	"/assets/dist-9_rQ_Grk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b66-ac4Zo3/Yjuo/arQBE7AOafHNEQo\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 2918,
		"path": "../public/assets/dist-9_rQ_Grk.js"
	},
	"/assets/dist-B_TsfhQC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12ec-50OukGdhiHTrsLHdbxo4Teb+lZk\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 4844,
		"path": "../public/assets/dist-B_TsfhQC.js"
	},
	"/assets/dist-DLQt2BcY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2a9-YZYgEHXuUd8kv7q1LqyYawzzkok\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 681,
		"path": "../public/assets/dist-DLQt2BcY.js"
	},
	"/assets/dist-DMVvHKTm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"282-y0ACQq2FlWB7wmbkemKrd5yAQ4A\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 642,
		"path": "../public/assets/dist-DMVvHKTm.js"
	},
	"/assets/dist-Dc1n-yF1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6448-vuz42QELlr/MD5R/axhRUlCLg+s\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 25672,
		"path": "../public/assets/dist-Dc1n-yF1.js"
	},
	"/assets/dist-Djdv0oiS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1399-ihQxlrv+hH9tV+MdxDN6nQjmzbY\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 5017,
		"path": "../public/assets/dist-Djdv0oiS.js"
	},
	"/assets/dist-DuAOcOVW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109b-xpDAA1NE+Fc3cZIccxM3BihTJF4\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 4251,
		"path": "../public/assets/dist-DuAOcOVW.js"
	},
	"/assets/ellipsis-DJa7oDhq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e2-oM+1pCz1H9Iz76NYx8Bi8JeXN7A\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 226,
		"path": "../public/assets/ellipsis-DJa7oDhq.js"
	},
	"/assets/es2015-CgrRkN0C.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6195-mYq/PhgVmyZLYt9Ix4j8WTXNBXY\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 24981,
		"path": "../public/assets/es2015-CgrRkN0C.js"
	},
	"/assets/eye-DI6Zkgpx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"100-uvX4r8l9otdsHr/G9bhXYGwdLwI\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 256,
		"path": "../public/assets/eye-DI6Zkgpx.js"
	},
	"/assets/geo-data-CYKNiDfb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6ce-DiXeUwOVv3S5GUs0RTxhIQieJkk\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 1742,
		"path": "../public/assets/geo-data-CYKNiDfb.js"
	},
	"/assets/html2canvas-DCcDvdvP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"30b50-/NW/tvs1950d+adFAmG+0O5qROc\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 199504,
		"path": "../public/assets/html2canvas-DCcDvdvP.js"
	},
	"/assets/image-plus-BEyUefMp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16b-jM/otUDosKLzeNczaPUhwq6ohjw\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 363,
		"path": "../public/assets/image-plus-BEyUefMp.js"
	},
	"/assets/index.es-B-5FAP3N.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24f8c-IILPN+SYiVUd2kawHQcOljfagSU\"",
		"mtime": "2026-09-03T03:21:31.524Z",
		"size": 151436,
		"path": "../public/assets/index.es-B-5FAP3N.js"
	},
	"/assets/input-3Mby4E5p.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"296-dHIJ2k/vMj65Pvy/6yAcBAvN4Fw\"",
		"mtime": "2026-09-03T03:21:31.525Z",
		"size": 662,
		"path": "../public/assets/input-3Mby4E5p.js"
	},
	"/assets/index-D1Z36w78.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a579c-O4Iu/P153IM9Ag6syFVjsk86e1s\"",
		"mtime": "2026-09-03T03:21:31.520Z",
		"size": 677788,
		"path": "../public/assets/index-D1Z36w78.js"
	},
	"/assets/invariant-DrlDULPJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ce1-ZRQDfkQPt4jYb9usOOHjNrKdLto\"",
		"mtime": "2026-09-03T03:21:31.525Z",
		"size": 3297,
		"path": "../public/assets/invariant-DrlDULPJ.js"
	},
	"/assets/link-DS1dcRyo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3feb-TtYfNRNFNE5e7QSTbP8vYKNJ8SM\"",
		"mtime": "2026-09-03T03:21:31.525Z",
		"size": 16363,
		"path": "../public/assets/link-DS1dcRyo.js"
	},
	"/assets/matchContext-BLaZZjXw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b8-BSjivHXemCqEV+wXXsCe5P0ODLQ\"",
		"mtime": "2026-09-03T03:21:31.525Z",
		"size": 184,
		"path": "../public/assets/matchContext-BLaZZjXw.js"
	},
	"/assets/moment._momentId-BVgP4Utx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3e5b-W/Z2ntLShF5bSIAX2c6kRXM6C3A\"",
		"mtime": "2026-09-03T03:21:31.525Z",
		"size": 15963,
		"path": "../public/assets/moment._momentId-BVgP4Utx.js"
	},
	"/assets/moment.index-ByktfZVt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c22-/EjDEk91MK93gar0Th9yPD/UzfA\"",
		"mtime": "2026-09-03T03:21:31.525Z",
		"size": 3106,
		"path": "../public/assets/moment.index-ByktfZVt.js"
	},
	"/assets/navigation-C8MoOCIK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"94-7DknCKydA7aq83O7EnlD43AHz04\"",
		"mtime": "2026-09-03T03:21:31.525Z",
		"size": 148,
		"path": "../public/assets/navigation-C8MoOCIK.js"
	},
	"/assets/not-found-DIgawKw1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"37-RTB6YH5iXRKeXz1Sn6ZQ+vS0lnc\"",
		"mtime": "2026-09-03T03:21:31.525Z",
		"size": 55,
		"path": "../public/assets/not-found-DIgawKw1.js"
	},
	"/assets/notifications-BYImfth3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"17e6-8bjE8FiGoMVx2SRlWLbmSFtJBgY\"",
		"mtime": "2026-09-03T03:21:31.525Z",
		"size": 6118,
		"path": "../public/assets/notifications-BYImfth3.js"
	},
	"/assets/orbit-B9U433-V.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f5-vgAfvOj5HvBwhqnEy8cN2geI3pU\"",
		"mtime": "2026-09-03T03:21:31.525Z",
		"size": 2293,
		"path": "../public/assets/orbit-B9U433-V.js"
	},
	"/assets/orbit-match-D_tmuxxe.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a94-H4sGXJJ099IttC5pb4UB8Te3SlQ\"",
		"mtime": "2026-09-03T03:21:31.525Z",
		"size": 2708,
		"path": "../public/assets/orbit-match-D_tmuxxe.js"
	},
	"/assets/orbit-mood-D1SQ3wAI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4f8-0OOOjx3oF76Cb8sSgFsOxSYcYUs\"",
		"mtime": "2026-09-03T03:21:31.525Z",
		"size": 1272,
		"path": "../public/assets/orbit-mood-D1SQ3wAI.js"
	},
	"/assets/orbit-store-CjvZlhiW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3109-5XgFmhcmwYOhoIzoQvuWH8jU3ng\"",
		"mtime": "2026-09-03T03:21:31.525Z",
		"size": 12553,
		"path": "../public/assets/orbit-store-CjvZlhiW.js"
	},
	"/assets/orbit._profileId-cPEf7tdo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2832-CJg9GsR08M0dhWWB3x6vXpXz9YQ\"",
		"mtime": "2026-09-03T03:21:31.525Z",
		"size": 10290,
		"path": "../public/assets/orbit._profileId-cPEf7tdo.js"
	},
	"/assets/orbit.chat._userId-D3qV71cX.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9ae0-1Hfjm7E7r5kOz11n8Oh8LSYMg+c\"",
		"mtime": "2026-09-03T03:21:31.525Z",
		"size": 39648,
		"path": "../public/assets/orbit.chat._userId-D3qV71cX.js"
	},
	"/assets/orbit.create-DB3k29fr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"849e-geJSEZr2BwX+4pSaPPqJmDN9xZg\"",
		"mtime": "2026-09-03T03:21:31.525Z",
		"size": 33950,
		"path": "../public/assets/orbit.create-DB3k29fr.js"
	},
	"/assets/orbit.index-eTTtZ26k.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"72f5-BugG4Ib6dmcjt4Fwn+KjOrhy44g\"",
		"mtime": "2026-09-03T03:21:31.526Z",
		"size": 29429,
		"path": "../public/assets/orbit.index-eTTtZ26k.js"
	},
	"/assets/orbit.me-93dOwLat.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1929-w0Qe83lp/2TpLPb4+WgXMAR7O48\"",
		"mtime": "2026-09-03T03:21:31.526Z",
		"size": 6441,
		"path": "../public/assets/orbit.me-93dOwLat.js"
	},
	"/assets/orbit.messages-vfLISfqx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"337f-SHW9Bzfhn6Ldn5MOv2TRv3ppXiM\"",
		"mtime": "2026-09-03T03:21:31.526Z",
		"size": 13183,
		"path": "../public/assets/orbit.messages-vfLISfqx.js"
	},
	"/assets/orbit.notifications-Dse3kHPJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cd9-/8EvNce3Yd0OV3rMjG6d729yj+A\"",
		"mtime": "2026-09-03T03:21:31.526Z",
		"size": 3289,
		"path": "../public/assets/orbit.notifications-Dse3kHPJ.js"
	},
	"/assets/orbit.privacy-C3ViBpsC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3b97-1IW66g0r7/AKQ7ELWV+xoy/F/D4\"",
		"mtime": "2026-09-03T03:21:31.529Z",
		"size": 15255,
		"path": "../public/assets/orbit.privacy-C3ViBpsC.js"
	},
	"/assets/pin-BeE_zRtQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"31a-l5uaPsRPR+8pJDClvFJdvEKdlT4\"",
		"mtime": "2026-09-03T03:21:31.529Z",
		"size": 794,
		"path": "../public/assets/pin-BeE_zRtQ.js"
	},
	"/assets/post-1-uxYyj4Yn.jpg": {
		"type": "image/jpeg",
		"etag": "\"2621b-tADwOglKGR4PvLgzJyB6lOA0+b8\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 156187,
		"path": "../public/assets/post-1-uxYyj4Yn.jpg"
	},
	"/assets/post.create-DpVmc02n.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15b5-RQ23Mtr2eFsnSN3gGcCE27Qyws8\"",
		"mtime": "2026-09-03T03:21:31.529Z",
		"size": 5557,
		"path": "../public/assets/post.create-DpVmc02n.js"
	},
	"/assets/privacy-LxLKjNgL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c79-/ZfrWFOLTCbYdUkJTcrP/Tc20UE\"",
		"mtime": "2026-09-03T03:21:31.529Z",
		"size": 3193,
		"path": "../public/assets/privacy-LxLKjNgL.js"
	},
	"/assets/profile-CzHb6Q0i.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7d1b-K9oZrRROtSqxdA9LyFXXzjVnDWs\"",
		"mtime": "2026-09-03T03:21:31.529Z",
		"size": 32027,
		"path": "../public/assets/profile-CzHb6Q0i.js"
	},
	"/assets/profiles-map-DT10KoJv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"32a-4lxr1/2LhDCRxVO2mb+XMX1IS8w\"",
		"mtime": "2026-09-03T03:21:31.529Z",
		"size": 810,
		"path": "../public/assets/profiles-map-DT10KoJv.js"
	},
	"/assets/react-dom-BS6Gh_TR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e08-9bSgZZ4q4Ni+kAtZEKfL9G1hHrE\"",
		"mtime": "2026-09-03T03:21:31.529Z",
		"size": 3592,
		"path": "../public/assets/react-dom-BS6Gh_TR.js"
	},
	"/assets/redirect-DtIAAt0y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e1-KhpEIx1LNSnb7dNYxiNI58wV9MY\"",
		"mtime": "2026-09-03T03:21:31.529Z",
		"size": 481,
		"path": "../public/assets/redirect-DtIAAt0y.js"
	},
	"/assets/reel-1-DgXdxb9U.jpg": {
		"type": "image/jpeg",
		"etag": "\"158de-632G9IqzPFNj16hyS2vSq2z3WoA\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 88286,
		"path": "../public/assets/reel-1-DgXdxb9U.jpg"
	},
	"/assets/reel-2-D6ICrDT7.jpg": {
		"type": "image/jpeg",
		"etag": "\"1d3c4-QU1Rig2/vTeF6slkXtMXSVa68U0\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 119748,
		"path": "../public/assets/reel-2-D6ICrDT7.jpg"
	},
	"/assets/reel-3-BYUKUHRv.jpg": {
		"type": "image/jpeg",
		"etag": "\"8bae-hivl0InXk3Rn4aAy5LSO54t+UZE\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 35758,
		"path": "../public/assets/reel-3-BYUKUHRv.jpg"
	},
	"/assets/reels-CdUU70ly.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"300a-WTh7MKDxoiFz4nUEvB/XBPgKQHE\"",
		"mtime": "2026-09-03T03:21:31.529Z",
		"size": 12298,
		"path": "../public/assets/reels-CdUU70ly.js"
	},
	"/assets/reset-password-DnBnaQQl.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"52a-8wJztdk57dZ4uWYEobTg/z6tVFo\"",
		"mtime": "2026-09-03T03:21:31.529Z",
		"size": 1322,
		"path": "../public/assets/reset-password-DnBnaQQl.js"
	},
	"/assets/rolldown-runtime-hePW80VL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2cc-fA8td6k29UVF6JoPfhOPkceTK1M\"",
		"mtime": "2026-09-03T03:21:31.529Z",
		"size": 716,
		"path": "../public/assets/rolldown-runtime-hePW80VL.js"
	},
	"/assets/root-DLTE-HSj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20-vSYConOtSP6ciwr9zKsPixNwWmc\"",
		"mtime": "2026-09-03T03:21:31.529Z",
		"size": 32,
		"path": "../public/assets/root-DLTE-HSj.js"
	},
	"/assets/route-dhnueaho.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8c-aWfVKofd61Z+Cr7iDDS6ATWqZlc\"",
		"mtime": "2026-09-03T03:21:31.529Z",
		"size": 140,
		"path": "../public/assets/route-dhnueaho.js"
	},
	"/assets/routes-Cp9s9u9l.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8621-OXC2+g9vN2c5oSA2bIWo3kTmaT8\"",
		"mtime": "2026-09-03T03:21:31.529Z",
		"size": 34337,
		"path": "../public/assets/routes-Cp9s9u9l.js"
	},
	"/assets/scan-face-CM2bv4DP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a5-2sX7qfOwFGs4b0QZiHDo+LUoaas\"",
		"mtime": "2026-09-03T03:21:31.529Z",
		"size": 421,
		"path": "../public/assets/scan-face-CM2bv4DP.js"
	},
	"/assets/search-L5UUYgKd.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2cdc-pd8VGKVqGgkpZBLDVdkPlurrI7Q\"",
		"mtime": "2026-09-03T03:21:31.529Z",
		"size": 11484,
		"path": "../public/assets/search-L5UUYgKd.js"
	},
	"/assets/settings-2-x6U2komm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fc-airYhkVLobsDhkRjcuibMjh1Kz4\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 252,
		"path": "../public/assets/settings-2-x6U2komm.js"
	},
	"/assets/settings-63gKAQz_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e7-H6UEAhV97AbbPJvTM0mgapeyVN4\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 487,
		"path": "../public/assets/settings-63gKAQz_.js"
	},
	"/assets/sheet-CaApUGog.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8a3-BWjbURhRK5hWDt7K53hg5VgOtmU\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 2211,
		"path": "../public/assets/sheet-CaApUGog.js"
	},
	"/assets/shield-TvVcHHSx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"190-IQZ0HXDtipzveT7dmmgPX6/2kng\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 400,
		"path": "../public/assets/shield-TvVcHHSx.js"
	},
	"/assets/purify.es-ChwZkWde.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"68bc-bPPRDEosU/Lqj+2Oyi1ue22LViM\"",
		"mtime": "2026-09-03T03:21:31.529Z",
		"size": 26812,
		"path": "../public/assets/purify.es-ChwZkWde.js"
	},
	"/assets/shield-check-DbLP09Mr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"140-kO2Skvjk1wqz1iVSYj10tG7kAAg\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 320,
		"path": "../public/assets/shield-check-DbLP09Mr.js"
	},
	"/assets/square-nG_BaMNK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"93-N5UoPnJn75SEYhz/11HKB4AH68Y\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 147,
		"path": "../public/assets/square-nG_BaMNK.js"
	},
	"/assets/styles-DvC5Kgeq.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"33abb-SfJH/06v0sZBXsDgd6GP1gAHkIQ\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 211643,
		"path": "../public/assets/styles-DvC5Kgeq.css"
	},
	"/assets/switch-CrXJW8B4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1109-TjCf9bYJQhYSMk3TI2mY+Ii3Ypo\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 4361,
		"path": "../public/assets/switch-CrXJW8B4.js"
	},
	"/assets/terms-CMld_B2c.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"df8-hWeJX6JVvedIR1XROmMm3JdwvnI\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 3576,
		"path": "../public/assets/terms-CMld_B2c.js"
	},
	"/assets/textarea-Cv9vAvN0.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"230-1swO7ieOOrEpGb2XCVEHyXiwjAw\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 560,
		"path": "../public/assets/textarea-Cv9vAvN0.js"
	},
	"/assets/triangle-alert-B2hpeTrU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109-hAh5bu7wpC/dyrDkPv2HRWFdK0E\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 265,
		"path": "../public/assets/triangle-alert-B2hpeTrU.js"
	},
	"/assets/useMatch-CG_Qo4VA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"26c-mf+6Kl2KU/dZTKCvH3wHxYMjLA8\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 620,
		"path": "../public/assets/useMatch-CG_Qo4VA.js"
	},
	"/assets/useServerFn-CzzciFve.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19d-Q2chUu1zNyiLPgJ8BU4VVAVaG7A\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 413,
		"path": "../public/assets/useServerFn-CzzciFve.js"
	},
	"/assets/u._userId-D_r4eYj3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16cf-urVq82oFqP40j1cso+UYs1Fh4Yk\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 5839,
		"path": "../public/assets/u._userId-D_r4eYj3.js"
	},
	"/assets/useRouter-BP8vT1kh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f38-UAwyZ71XUq5pvhwLvcQ+ekWdEeM\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 7992,
		"path": "../public/assets/useRouter-BP8vT1kh.js"
	},
	"/assets/useStore-Bwiy6pX7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"786-iVUaSoWn1x0ZE/FkYImHA2AwxQw\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 1926,
		"path": "../public/assets/useStore-Bwiy6pX7.js"
	},
	"/assets/video-data-CcnhKixd.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"209b-VVHEzYm1kMYV9YQGbt94uhDIrXw\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 8347,
		"path": "../public/assets/video-data-CcnhKixd.js"
	},
	"/assets/video._videoId-CeW7lkXF.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"26b0-CnYV5D8/aANHAhdw4cxdpFDuQ6M\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 9904,
		"path": "../public/assets/video._videoId-CeW7lkXF.js"
	},
	"/assets/video.upload-CanmFL_k.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"264e-fxh4/EI/yciS3f5Akaz+NhxvxqI\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 9806,
		"path": "../public/assets/video.upload-CanmFL_k.js"
	},
	"/assets/yw-data-Bd96njiI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85-tVhY2OnWfg4oPW2g2MxJpBstjUk\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 133,
		"path": "../public/assets/yw-data-Bd96njiI.js"
	},
	"/assets/yw-download-DwNrhE_c.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"511-/EgO3q0AkwboSGQj5DEH2DCwOEE\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 1297,
		"path": "../public/assets/yw-download-DwNrhE_c.js"
	},
	"/assets/wallet-DC2KgJ2a.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"650c4-izVpFsstd5G1ZixQ2LoZfppC5Vc\"",
		"mtime": "2026-09-03T03:21:31.530Z",
		"size": 413892,
		"path": "../public/assets/wallet-DC2KgJ2a.js"
	},
	"/assets/yw-logo-BXjnypdM.png": {
		"type": "image/png",
		"etag": "\"b8bf9-XKz0DAyp9GBS6zs069mBfmp0ubE\"",
		"mtime": "2026-09-03T03:21:31.531Z",
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
