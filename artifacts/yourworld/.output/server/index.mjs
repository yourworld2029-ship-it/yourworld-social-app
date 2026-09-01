globalThis.__nitro_main__ = import.meta.url;
import { n as defineLazyEventHandler, r as HTTPError, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { t as HookableCore } from "./_libs/hookable.mjs";
import { t as FastResponse } from "./_libs/srvx.mjs";
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
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/favicon.svg": {
		"type": "image/svg+xml",
		"etag": "\"a3-Yvco5K08sGQeN5F1GHJoyPC6SS4\"",
		"mtime": "2026-09-01T17:22:50.065Z",
		"size": 163,
		"path": "../public/favicon.svg"
	},
	"/icon-512.png": {
		"type": "image/png",
		"etag": "\"10033-25w1u01xl/8gQOyAqgrSdkaxdio\"",
		"mtime": "2026-09-01T17:22:50.065Z",
		"size": 65587,
		"path": "../public/icon-512.png"
	},
	"/manifest.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"1ea-6VxqHNj9+exgLrKEoBUp7bg4ak0\"",
		"mtime": "2026-09-01T17:22:50.066Z",
		"size": 490,
		"path": "../public/manifest.webmanifest"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"16-iUOtJ2RsHfdY9DoQxaq0wz1LZCU\"",
		"mtime": "2026-09-01T17:22:50.065Z",
		"size": 22,
		"path": "../public/robots.txt"
	},
	"/assets/Avatar-CvwU-ZiY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"227-B25382/kA7seSqnnqCiqYmtIVPE\"",
		"mtime": "2026-09-01T17:22:47.690Z",
		"size": 551,
		"path": "../public/assets/Avatar-CvwU-ZiY.js"
	},
	"/assets/ChannelContentList-BxvateUp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"58e-9f+6cNWfyixzCzvjVK1CnOdK2Wc\"",
		"mtime": "2026-09-01T17:22:47.690Z",
		"size": 1422,
		"path": "../public/assets/ChannelContentList-BxvateUp.js"
	},
	"/assets/ClientOnly-BLQ6U6R8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13f-j0SNX9405wGpvG+wmmJESUTpnZI\"",
		"mtime": "2026-09-01T17:22:47.690Z",
		"size": 319,
		"path": "../public/assets/ClientOnly-BLQ6U6R8.js"
	},
	"/assets/FollowListDialog-DP-FrZW1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24ae-/3kwiTcDKgMdKSDUaWF0vyLRL40\"",
		"mtime": "2026-09-01T17:22:47.690Z",
		"size": 9390,
		"path": "../public/assets/FollowListDialog-DP-FrZW1.js"
	},
	"/assets/LiveLocationSheet-LdAzJInY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"139f-0KROvR4/s63vbldwEY39p2c21TM\"",
		"mtime": "2026-09-01T17:22:47.690Z",
		"size": 5023,
		"path": "../public/assets/LiveLocationSheet-LdAzJInY.js"
	},
	"/assets/ShareSheet-BW9lcgIt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a3bc-MY6oKpa2CLKmUufjCzfwd1RerdU\"",
		"mtime": "2026-09-01T17:22:47.690Z",
		"size": 41916,
		"path": "../public/assets/ShareSheet-BW9lcgIt.js"
	},
	"/assets/VideoPoster-CroxDvPE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"465f-yt2xyqbcIpUUIEIZ6H1LG4K1GaQ\"",
		"mtime": "2026-09-01T17:22:47.690Z",
		"size": 18015,
		"path": "../public/assets/VideoPoster-CroxDvPE.js"
	},
	"/assets/account-_Qf9-bPS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"599f-f7Wh/Nhq7N8ReBrmp/Xz5kzEYDg\"",
		"mtime": "2026-09-01T17:22:47.690Z",
		"size": 22943,
		"path": "../public/assets/account-_Qf9-bPS.js"
	},
	"/assets/alerts-count-FtJN_wgf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5fd-UXPbSpsRh+2AY5U8WXI3erKyLIU\"",
		"mtime": "2026-09-01T17:22:47.690Z",
		"size": 1533,
		"path": "../public/assets/alerts-count-FtJN_wgf.js"
	},
	"/assets/auth-B9ShzcnI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"47f7-rPdhpYkMiXFQBsL7QOL3ss2QH4k\"",
		"mtime": "2026-09-01T17:22:47.691Z",
		"size": 18423,
		"path": "../public/assets/auth-B9ShzcnI.js"
	},
	"/assets/button-BmFs48kR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"589-gTM7LaDvKFQwU6oJtjmOWJlyEQc\"",
		"mtime": "2026-09-01T17:22:47.691Z",
		"size": 1417,
		"path": "../public/assets/button-BmFs48kR.js"
	},
	"/assets/channel-data-Ctiq2G7r.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a77-zoucJ5Mqwdv8DdfRAUhi9/X11Co\"",
		"mtime": "2026-09-01T17:22:47.691Z",
		"size": 2679,
		"path": "../public/assets/channel-data-Ctiq2G7r.js"
	},
	"/assets/channel.analytics-DnzrLR-H.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"952-dmN4rSkObS7CYkxUBX+UR+4goPc\"",
		"mtime": "2026-09-01T17:22:47.691Z",
		"size": 2386,
		"path": "../public/assets/channel.analytics-DnzrLR-H.js"
	},
	"/assets/channel.create-OvuyqfyS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1942-uXZQCDlTdEKiMVgky7Jh5jXNGJM\"",
		"mtime": "2026-09-01T17:22:47.691Z",
		"size": 6466,
		"path": "../public/assets/channel.create-OvuyqfyS.js"
	},
	"/assets/channel.monetization-DYtfW2IH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9ab-/K4LnJQWK75ltAO8aaRNu6piWQM\"",
		"mtime": "2026-09-01T17:22:47.691Z",
		"size": 2475,
		"path": "../public/assets/channel.monetization-DYtfW2IH.js"
	},
	"/assets/channel.posts-BY7tloKm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"101-NSw8681xYYnt57mSgvSFbkndSSY\"",
		"mtime": "2026-09-01T17:22:47.691Z",
		"size": 257,
		"path": "../public/assets/channel.posts-BY7tloKm.js"
	},
	"/assets/channel.reels-BX7LK7GZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"101-gz/fy0F6gIoO0uQFjaP/61wpEpM\"",
		"mtime": "2026-09-01T17:22:47.691Z",
		"size": 257,
		"path": "../public/assets/channel.reels-BX7LK7GZ.js"
	},
	"/assets/channel.subscribers-B6-Lyxla.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"546-2ko54kvrnYOabNP0jV0FKOeLXwE\"",
		"mtime": "2026-09-01T17:22:47.691Z",
		"size": 1350,
		"path": "../public/assets/channel.subscribers-B6-Lyxla.js"
	},
	"/assets/channel.videos-CzNug7bR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"103-Dvt4c6LsjEtThjoMLTnZe7ZaGuw\"",
		"mtime": "2026-09-01T17:22:47.691Z",
		"size": 259,
		"path": "../public/assets/channel.videos-CzNug7bR.js"
	},
	"/assets/chat-delete-BVTZGYPV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d6-c2+HcO61RuonLbBkq86L6aQyAjc\"",
		"mtime": "2026-09-01T17:22:47.691Z",
		"size": 1238,
		"path": "../public/assets/chat-delete-BVTZGYPV.js"
	},
	"/favicon.png": {
		"type": "image/png",
		"etag": "\"16c7-sHfgQvyMV/xhC2ahSs44WAoIC94\"",
		"mtime": "2026-09-01T17:22:50.065Z",
		"size": 5831,
		"path": "../public/favicon.png"
	},
	"/assets/chat.index-DNvS-yje.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"232e-3T1Fp80h0KeG6anHS4TKohSRwHg\"",
		"mtime": "2026-09-01T17:22:47.691Z",
		"size": 9006,
		"path": "../public/assets/chat.index-DNvS-yje.js"
	},
	"/assets/chevron-left-DCWi8AFo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"82-Nyvjp0DClAKo4jztQSU4y179D+s\"",
		"mtime": "2026-09-01T17:22:47.691Z",
		"size": 130,
		"path": "../public/assets/chevron-left-DCWi8AFo.js"
	},
	"/assets/client-DnLkyxmB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"33f26-QVVoJE3EmmLwW1i5YzRBcnecoLI\"",
		"mtime": "2026-09-01T17:22:47.691Z",
		"size": 212774,
		"path": "../public/assets/client-DnLkyxmB.js"
	},
	"/assets/copyright-policy-De4IcyAZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"236d-N/nfT+gwtyE2KFfv7MoSLgp+cgs\"",
		"mtime": "2026-09-01T17:22:47.691Z",
		"size": 9069,
		"path": "../public/assets/copyright-policy-De4IcyAZ.js"
	},
	"/assets/createLucideIcon-zYGWgMV3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d5-q/IYz1LzVgYGf/TuxC8seyNvMeM\"",
		"mtime": "2026-09-01T17:22:47.691Z",
		"size": 1237,
		"path": "../public/assets/createLucideIcon-zYGWgMV3.js"
	},
	"/assets/dialog-im3Gjagv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7a8-xntLj2cpRJdRi7GKqpb6aICzNeI\"",
		"mtime": "2026-09-01T17:22:47.692Z",
		"size": 1960,
		"path": "../public/assets/dialog-im3Gjagv.js"
	},
	"/assets/dist-9_rQ_Grk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b66-ac4Zo3/Yjuo/arQBE7AOafHNEQo\"",
		"mtime": "2026-09-01T17:22:47.692Z",
		"size": 2918,
		"path": "../public/assets/dist-9_rQ_Grk.js"
	},
	"/assets/createServerFn-D-WfB0xj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1144-oWTs3Z0FVKEe7Qp5/R0e6D+zzQM\"",
		"mtime": "2026-09-01T17:22:47.692Z",
		"size": 4420,
		"path": "../public/assets/createServerFn-D-WfB0xj.js"
	},
	"/assets/dist-7DHJbmHc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1cc7-WmlEqZx3QjHh6rMuq/jHoa40r6E\"",
		"mtime": "2026-09-01T17:22:47.692Z",
		"size": 7367,
		"path": "../public/assets/dist-7DHJbmHc.js"
	},
	"/assets/dist-BDe-Qr21.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"282-qxFRpY5XJ402YP4uj5tzvG2PRic\"",
		"mtime": "2026-09-01T17:22:47.692Z",
		"size": 642,
		"path": "../public/assets/dist-BDe-Qr21.js"
	},
	"/assets/dist-CLFYYV_a.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109b-KIOR7l1fjLX2GUfzLqR1BOMiHBM\"",
		"mtime": "2026-09-01T17:22:47.692Z",
		"size": 4251,
		"path": "../public/assets/dist-CLFYYV_a.js"
	},
	"/assets/dist-C_-2UDJZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12ec-1FEwp+yc7Uz7u+XDlTSNw74V3YU\"",
		"mtime": "2026-09-01T17:22:47.692Z",
		"size": 4844,
		"path": "../public/assets/dist-C_-2UDJZ.js"
	},
	"/assets/dist-DLQt2BcY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2a9-YZYgEHXuUd8kv7q1LqyYawzzkok\"",
		"mtime": "2026-09-01T17:22:47.692Z",
		"size": 681,
		"path": "../public/assets/dist-DLQt2BcY.js"
	},
	"/assets/dist-Djdv0oiS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1399-ihQxlrv+hH9tV+MdxDN6nQjmzbY\"",
		"mtime": "2026-09-01T17:22:47.692Z",
		"size": 5017,
		"path": "../public/assets/dist-Djdv0oiS.js"
	},
	"/assets/dist-DzKbB2qR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6448-VjH84bT8g3UObxtUL63dqPzjyEE\"",
		"mtime": "2026-09-01T17:22:47.692Z",
		"size": 25672,
		"path": "../public/assets/dist-DzKbB2qR.js"
	},
	"/assets/ellipsis-DJa7oDhq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e2-oM+1pCz1H9Iz76NYx8Bi8JeXN7A\"",
		"mtime": "2026-09-01T17:22:47.692Z",
		"size": 226,
		"path": "../public/assets/ellipsis-DJa7oDhq.js"
	},
	"/assets/es2015-DwyJt8vE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6190-ilXu9jOkwmKu9nhCu/WcHOX0hPU\"",
		"mtime": "2026-09-01T17:22:47.692Z",
		"size": 24976,
		"path": "../public/assets/es2015-DwyJt8vE.js"
	},
	"/assets/eye-DI6Zkgpx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"100-uvX4r8l9otdsHr/G9bhXYGwdLwI\"",
		"mtime": "2026-09-01T17:22:47.692Z",
		"size": 256,
		"path": "../public/assets/eye-DI6Zkgpx.js"
	},
	"/assets/geo-data-CYKNiDfb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6ce-DiXeUwOVv3S5GUs0RTxhIQieJkk\"",
		"mtime": "2026-09-01T17:22:47.692Z",
		"size": 1742,
		"path": "../public/assets/geo-data-CYKNiDfb.js"
	},
	"/assets/image-plus-BEyUefMp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16b-jM/otUDosKLzeNczaPUhwq6ohjw\"",
		"mtime": "2026-09-01T17:22:47.693Z",
		"size": 363,
		"path": "../public/assets/image-plus-BEyUefMp.js"
	},
	"/assets/html2canvas-DCcDvdvP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"30b50-/NW/tvs1950d+adFAmG+0O5qROc\"",
		"mtime": "2026-09-01T17:22:47.692Z",
		"size": 199504,
		"path": "../public/assets/html2canvas-DCcDvdvP.js"
	},
	"/assets/index.es-D7keRxUV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24f8c-CPus8pcO2hiA4sMfgpWo8Dja2Ks\"",
		"mtime": "2026-09-01T17:22:47.693Z",
		"size": 151436,
		"path": "../public/assets/index.es-D7keRxUV.js"
	},
	"/assets/input-5y6Ddqj3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"298-pI0Oa45VnDryhRXcPtAH6hZlSPQ\"",
		"mtime": "2026-09-01T17:22:47.693Z",
		"size": 664,
		"path": "../public/assets/input-5y6Ddqj3.js"
	},
	"/assets/index-DkAR2ozZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a4d93-lL5R2pIn8Dt+g5bM/NYmC0QOkj0\"",
		"mtime": "2026-09-01T17:22:47.686Z",
		"size": 675219,
		"path": "../public/assets/index-DkAR2ozZ.js"
	},
	"/assets/invariant-DrlDULPJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ce1-ZRQDfkQPt4jYb9usOOHjNrKdLto\"",
		"mtime": "2026-09-01T17:22:47.693Z",
		"size": 3297,
		"path": "../public/assets/invariant-DrlDULPJ.js"
	},
	"/assets/link-DS1dcRyo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3feb-TtYfNRNFNE5e7QSTbP8vYKNJ8SM\"",
		"mtime": "2026-09-01T17:22:47.693Z",
		"size": 16363,
		"path": "../public/assets/link-DS1dcRyo.js"
	},
	"/assets/matchContext-BLaZZjXw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b8-BSjivHXemCqEV+wXXsCe5P0ODLQ\"",
		"mtime": "2026-09-01T17:22:47.693Z",
		"size": 184,
		"path": "../public/assets/matchContext-BLaZZjXw.js"
	},
	"/assets/moment._momentId-Dbhn0Gbe.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3e5b-wnLyLiWYQMLW8ekRq9ym490e+pU\"",
		"mtime": "2026-09-01T17:22:47.693Z",
		"size": 15963,
		"path": "../public/assets/moment._momentId-Dbhn0Gbe.js"
	},
	"/assets/moment.index-apk5hxyN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c22-j8owN0QYM/g/iqOZ/N3Rf58HpA0\"",
		"mtime": "2026-09-01T17:22:47.693Z",
		"size": 3106,
		"path": "../public/assets/moment.index-apk5hxyN.js"
	},
	"/assets/navigation-C8MoOCIK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"94-7DknCKydA7aq83O7EnlD43AHz04\"",
		"mtime": "2026-09-01T17:22:47.693Z",
		"size": 148,
		"path": "../public/assets/navigation-C8MoOCIK.js"
	},
	"/assets/not-found-DIgawKw1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"37-RTB6YH5iXRKeXz1Sn6ZQ+vS0lnc\"",
		"mtime": "2026-09-01T17:22:47.693Z",
		"size": 55,
		"path": "../public/assets/not-found-DIgawKw1.js"
	},
	"/assets/notifications-OdoIkl2y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"17e6-tYziPEgq9m8++/Y9udYLU7vVtdo\"",
		"mtime": "2026-09-01T17:22:47.693Z",
		"size": 6118,
		"path": "../public/assets/notifications-OdoIkl2y.js"
	},
	"/assets/orbit-DO8HmEzm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f7-V9E+dNMCi7T+TyXfPkNq/Z8HvyE\"",
		"mtime": "2026-09-01T17:22:47.693Z",
		"size": 2295,
		"path": "../public/assets/orbit-DO8HmEzm.js"
	},
	"/assets/orbit-match-H9B19Z5U.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a96-en60ncld2snrseiwMWVu6CM4F9k\"",
		"mtime": "2026-09-01T17:22:47.693Z",
		"size": 2710,
		"path": "../public/assets/orbit-match-H9B19Z5U.js"
	},
	"/assets/orbit-mood-D1SQ3wAI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4f8-0OOOjx3oF76Cb8sSgFsOxSYcYUs\"",
		"mtime": "2026-09-01T17:22:47.693Z",
		"size": 1272,
		"path": "../public/assets/orbit-mood-D1SQ3wAI.js"
	},
	"/assets/orbit-store-CUqI8k_Q.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3b4d-vxhHIU+LsqsRaYHSXcexaswdD20\"",
		"mtime": "2026-09-01T17:22:47.693Z",
		"size": 15181,
		"path": "../public/assets/orbit-store-CUqI8k_Q.js"
	},
	"/assets/orbit._profileId-CXoCXTK9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2839-MWGy+93z1HSab3Za9SPE4I0Ac50\"",
		"mtime": "2026-09-01T17:22:47.694Z",
		"size": 10297,
		"path": "../public/assets/orbit._profileId-CXoCXTK9.js"
	},
	"/assets/orbit.chat._userId-CznCDRoz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9a93-Y8TLxjz3nE+6H8AfCeR/smrS3Kg\"",
		"mtime": "2026-09-01T17:22:47.694Z",
		"size": 39571,
		"path": "../public/assets/orbit.chat._userId-CznCDRoz.js"
	},
	"/assets/orbit.create-Cb5NKSgl.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"84a0-LwjPfJU717H5/MxWDOtwTUsi22M\"",
		"mtime": "2026-09-01T17:22:47.694Z",
		"size": 33952,
		"path": "../public/assets/orbit.create-Cb5NKSgl.js"
	},
	"/assets/orbit.me-BvoUKUjo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1929-YZGoosmDs9CMjiBhptu7HYpxfdE\"",
		"mtime": "2026-09-01T17:22:47.694Z",
		"size": 6441,
		"path": "../public/assets/orbit.me-BvoUKUjo.js"
	},
	"/assets/orbit.index-CNMaebhM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"72f7-O73rIffslL74vnz1662rLe0vRyI\"",
		"mtime": "2026-09-01T17:22:47.694Z",
		"size": 29431,
		"path": "../public/assets/orbit.index-CNMaebhM.js"
	},
	"/assets/orbit.messages-BhtGY5Nq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"337f-Je+s1Z596/lLYOjiAJUTtuOyoUk\"",
		"mtime": "2026-09-01T17:22:47.694Z",
		"size": 13183,
		"path": "../public/assets/orbit.messages-BhtGY5Nq.js"
	},
	"/assets/orbit.notifications-BcEcJO7Q.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cd9-/JsEVIB4Z+xowSOFa8qj62dQgtA\"",
		"mtime": "2026-09-01T17:22:47.694Z",
		"size": 3289,
		"path": "../public/assets/orbit.notifications-BcEcJO7Q.js"
	},
	"/assets/orbit.privacy-D6ANnzDo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3b97-zakcORKYSVRPKwFBAiFHEpJMCjo\"",
		"mtime": "2026-09-01T17:22:47.694Z",
		"size": 15255,
		"path": "../public/assets/orbit.privacy-D6ANnzDo.js"
	},
	"/assets/pin-BeE_zRtQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"31a-l5uaPsRPR+8pJDClvFJdvEKdlT4\"",
		"mtime": "2026-09-01T17:22:47.694Z",
		"size": 794,
		"path": "../public/assets/pin-BeE_zRtQ.js"
	},
	"/assets/post-1-DzPUIwl-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a3-/lHontMBav2cWjMxgEOVmCwkchs\"",
		"mtime": "2026-09-01T17:22:47.694Z",
		"size": 163,
		"path": "../public/assets/post-1-DzPUIwl-.js"
	},
	"/assets/post-1-uxYyj4Yn.jpg": {
		"type": "image/jpeg",
		"etag": "\"2621b-tADwOglKGR4PvLgzJyB6lOA0+b8\"",
		"mtime": "2026-09-01T17:22:47.697Z",
		"size": 156187,
		"path": "../public/assets/post-1-uxYyj4Yn.jpg"
	},
	"/assets/post.create-DTixRz6A.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15b5-IYRpSDbo51kZQJKuEJT6Z2TXXSI\"",
		"mtime": "2026-09-01T17:22:47.694Z",
		"size": 5557,
		"path": "../public/assets/post.create-DTixRz6A.js"
	},
	"/assets/privacy-agR7ee75.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c79-d6rh3bRl32hXQnne3eNGekCPzBU\"",
		"mtime": "2026-09-01T17:22:47.694Z",
		"size": 3193,
		"path": "../public/assets/privacy-agR7ee75.js"
	},
	"/assets/profile-DAwJMeNU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7cf2-ju1gFgyhg0P/bJfQTGYp8oJyoVc\"",
		"mtime": "2026-09-01T17:22:47.695Z",
		"size": 31986,
		"path": "../public/assets/profile-DAwJMeNU.js"
	},
	"/assets/profiles-map-BYKXlQLv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"32c-lhH+EGZ+LTDmA8T4myD4tx0h5oA\"",
		"mtime": "2026-09-01T17:22:47.695Z",
		"size": 812,
		"path": "../public/assets/profiles-map-BYKXlQLv.js"
	},
	"/assets/react-dom-BS6Gh_TR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e08-9bSgZZ4q4Ni+kAtZEKfL9G1hHrE\"",
		"mtime": "2026-09-01T17:22:47.695Z",
		"size": 3592,
		"path": "../public/assets/react-dom-BS6Gh_TR.js"
	},
	"/assets/redirect-DtIAAt0y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e1-KhpEIx1LNSnb7dNYxiNI58wV9MY\"",
		"mtime": "2026-09-01T17:22:47.695Z",
		"size": 481,
		"path": "../public/assets/redirect-DtIAAt0y.js"
	},
	"/assets/reel-1-DgXdxb9U.jpg": {
		"type": "image/jpeg",
		"etag": "\"158de-632G9IqzPFNj16hyS2vSq2z3WoA\"",
		"mtime": "2026-09-01T17:22:47.697Z",
		"size": 88286,
		"path": "../public/assets/reel-1-DgXdxb9U.jpg"
	},
	"/assets/reel-2-D6ICrDT7.jpg": {
		"type": "image/jpeg",
		"etag": "\"1d3c4-QU1Rig2/vTeF6slkXtMXSVa68U0\"",
		"mtime": "2026-09-01T17:22:47.697Z",
		"size": 119748,
		"path": "../public/assets/reel-2-D6ICrDT7.jpg"
	},
	"/assets/reel-3-BYUKUHRv.jpg": {
		"type": "image/jpeg",
		"etag": "\"8bae-hivl0InXk3Rn4aAy5LSO54t+UZE\"",
		"mtime": "2026-09-01T17:22:47.697Z",
		"size": 35758,
		"path": "../public/assets/reel-3-BYUKUHRv.jpg"
	},
	"/assets/reels-zhP8_ODb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2fea-CuXSNNBhPoeOpbN00L7T4zhx9vQ\"",
		"mtime": "2026-09-01T17:22:47.695Z",
		"size": 12266,
		"path": "../public/assets/reels-zhP8_ODb.js"
	},
	"/assets/reset-password-CXSBXoKY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"52a-DOQIIB6JM/Op5rNOG0bzwv936bE\"",
		"mtime": "2026-09-01T17:22:47.695Z",
		"size": 1322,
		"path": "../public/assets/reset-password-CXSBXoKY.js"
	},
	"/assets/rolldown-runtime-hePW80VL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2cc-fA8td6k29UVF6JoPfhOPkceTK1M\"",
		"mtime": "2026-09-01T17:22:47.695Z",
		"size": 716,
		"path": "../public/assets/rolldown-runtime-hePW80VL.js"
	},
	"/assets/root-DLTE-HSj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20-vSYConOtSP6ciwr9zKsPixNwWmc\"",
		"mtime": "2026-09-01T17:22:47.695Z",
		"size": 32,
		"path": "../public/assets/root-DLTE-HSj.js"
	},
	"/assets/route-DLOfJtkh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8c-ZnhVWUy1+yBCiYJMQQndJlzz/lM\"",
		"mtime": "2026-09-01T17:22:47.695Z",
		"size": 140,
		"path": "../public/assets/route-DLOfJtkh.js"
	},
	"/assets/routes-BuscDitw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85f8-0kRpmReZ3u/zuuxNZ5uyY0UmH8U\"",
		"mtime": "2026-09-01T17:22:47.695Z",
		"size": 34296,
		"path": "../public/assets/routes-BuscDitw.js"
	},
	"/assets/scan-face-CM2bv4DP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a5-2sX7qfOwFGs4b0QZiHDo+LUoaas\"",
		"mtime": "2026-09-01T17:22:47.695Z",
		"size": 421,
		"path": "../public/assets/scan-face-CM2bv4DP.js"
	},
	"/assets/search-BP6NY4hL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"268e-A5ekSVrpMuVr3fg5nGMSJTqYcmk\"",
		"mtime": "2026-09-01T17:22:47.695Z",
		"size": 9870,
		"path": "../public/assets/search-BP6NY4hL.js"
	},
	"/assets/settings-2-x6U2komm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fc-airYhkVLobsDhkRjcuibMjh1Kz4\"",
		"mtime": "2026-09-01T17:22:47.695Z",
		"size": 252,
		"path": "../public/assets/settings-2-x6U2komm.js"
	},
	"/assets/purify.es-ChwZkWde.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"68bc-bPPRDEosU/Lqj+2Oyi1ue22LViM\"",
		"mtime": "2026-09-01T17:22:47.695Z",
		"size": 26812,
		"path": "../public/assets/purify.es-ChwZkWde.js"
	},
	"/assets/settings-63gKAQz_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e7-H6UEAhV97AbbPJvTM0mgapeyVN4\"",
		"mtime": "2026-09-01T17:22:47.696Z",
		"size": 487,
		"path": "../public/assets/settings-63gKAQz_.js"
	},
	"/assets/sheet-Pk5k1Oio.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8a5-0Ozh364JuLr+NotDexNWkJUeyqY\"",
		"mtime": "2026-09-01T17:22:47.696Z",
		"size": 2213,
		"path": "../public/assets/sheet-Pk5k1Oio.js"
	},
	"/assets/shield-TvVcHHSx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"190-IQZ0HXDtipzveT7dmmgPX6/2kng\"",
		"mtime": "2026-09-01T17:22:47.696Z",
		"size": 400,
		"path": "../public/assets/shield-TvVcHHSx.js"
	},
	"/assets/shield-check-DbLP09Mr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"140-kO2Skvjk1wqz1iVSYj10tG7kAAg\"",
		"mtime": "2026-09-01T17:22:47.696Z",
		"size": 320,
		"path": "../public/assets/shield-check-DbLP09Mr.js"
	},
	"/assets/square-nG_BaMNK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"93-N5UoPnJn75SEYhz/11HKB4AH68Y\"",
		"mtime": "2026-09-01T17:22:47.696Z",
		"size": 147,
		"path": "../public/assets/square-nG_BaMNK.js"
	},
	"/assets/styles-B5SVwh3n.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"33b28-t09MSoduqx7GXpChPJwaW2MiOjU\"",
		"mtime": "2026-09-01T17:22:47.697Z",
		"size": 211752,
		"path": "../public/assets/styles-B5SVwh3n.css"
	},
	"/assets/switch-DDvEN1FH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1109-1ZtT6ZxPoz83ZD2kPsZs5sgQx28\"",
		"mtime": "2026-09-01T17:22:47.696Z",
		"size": 4361,
		"path": "../public/assets/switch-DDvEN1FH.js"
	},
	"/assets/terms-DlkJeZhk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"df8-uEmsLs+u1jXG9832+M/obmITDG4\"",
		"mtime": "2026-09-01T17:22:47.696Z",
		"size": 3576,
		"path": "../public/assets/terms-DlkJeZhk.js"
	},
	"/assets/textarea-CQ0Jwxsl.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"232-wwbLncW5YYRCIa2T7cUHIBSmxQo\"",
		"mtime": "2026-09-01T17:22:47.696Z",
		"size": 562,
		"path": "../public/assets/textarea-CQ0Jwxsl.js"
	},
	"/assets/trending-up-T-j540VG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"af-VufyDUdJnT8AG3XdA1pKr1QLzBo\"",
		"mtime": "2026-09-01T17:22:47.696Z",
		"size": 175,
		"path": "../public/assets/trending-up-T-j540VG.js"
	},
	"/assets/triangle-alert-B2hpeTrU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109-hAh5bu7wpC/dyrDkPv2HRWFdK0E\"",
		"mtime": "2026-09-01T17:22:47.696Z",
		"size": 265,
		"path": "../public/assets/triangle-alert-B2hpeTrU.js"
	},
	"/assets/u._userId-B1lUC3DL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16b1-HM3Fr2TttVHouk65o0mgOzONr68\"",
		"mtime": "2026-09-01T17:22:47.696Z",
		"size": 5809,
		"path": "../public/assets/u._userId-B1lUC3DL.js"
	},
	"/assets/useMatch-CG_Qo4VA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"26c-mf+6Kl2KU/dZTKCvH3wHxYMjLA8\"",
		"mtime": "2026-09-01T17:22:47.696Z",
		"size": 620,
		"path": "../public/assets/useMatch-CG_Qo4VA.js"
	},
	"/assets/useRouter-BP8vT1kh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f38-UAwyZ71XUq5pvhwLvcQ+ekWdEeM\"",
		"mtime": "2026-09-01T17:22:47.696Z",
		"size": 7992,
		"path": "../public/assets/useRouter-BP8vT1kh.js"
	},
	"/assets/useServerFn-CzzciFve.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19d-Q2chUu1zNyiLPgJ8BU4VVAVaG7A\"",
		"mtime": "2026-09-01T17:22:47.696Z",
		"size": 413,
		"path": "../public/assets/useServerFn-CzzciFve.js"
	},
	"/assets/useStore-Bwiy6pX7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"786-iVUaSoWn1x0ZE/FkYImHA2AwxQw\"",
		"mtime": "2026-09-01T17:22:47.696Z",
		"size": 1926,
		"path": "../public/assets/useStore-Bwiy6pX7.js"
	},
	"/assets/video-data-fcmvjmCi.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19f2-6LjxTlOkAQJejt6FJFu+QmiaLDo\"",
		"mtime": "2026-09-01T17:22:47.696Z",
		"size": 6642,
		"path": "../public/assets/video-data-fcmvjmCi.js"
	},
	"/assets/video._videoId-CLiiK5AV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2682-+zIickvudy8D/Yx3baoP4jyHw6M\"",
		"mtime": "2026-09-01T17:22:47.696Z",
		"size": 9858,
		"path": "../public/assets/video._videoId-CLiiK5AV.js"
	},
	"/assets/video.upload-DjL_j8CZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"264e-DuV2e853/DfaoamcdR20pmDmhBA\"",
		"mtime": "2026-09-01T17:22:47.696Z",
		"size": 9806,
		"path": "../public/assets/video.upload-DjL_j8CZ.js"
	},
	"/assets/wallet-D3Ujpuxw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"650c4-DYymK70l+YiGBE4Zb4lelTeKv2U\"",
		"mtime": "2026-09-01T17:22:47.696Z",
		"size": 413892,
		"path": "../public/assets/wallet-D3Ujpuxw.js"
	},
	"/assets/yw-download-DwNrhE_c.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"511-/EgO3q0AkwboSGQj5DEH2DCwOEE\"",
		"mtime": "2026-09-01T17:22:47.697Z",
		"size": 1297,
		"path": "../public/assets/yw-download-DwNrhE_c.js"
	},
	"/assets/yw-logo-BXjnypdM.png": {
		"type": "image/png",
		"etag": "\"b8bf9-XKz0DAyp9GBS6zs069mBfmp0ubE\"",
		"mtime": "2026-09-01T17:22:47.697Z",
		"size": 756729,
		"path": "../public/assets/yw-logo-BXjnypdM.png"
	}
};
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
//#endregion
//#region ../../node_modules/.pnpm/nitro@3.0.260603-beta_drizzle-orm@0.45.2_@types+pg@8.20.0_pg@8.22.0_postgres@3.4.9__jit_f7280ed15d50a4c568f05ea55ad35156/node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
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
var _lazy_5Dn9AX = defineLazyEventHandler(() => import("./_chunks/renderer-template.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_5Dn9AX
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
[].filter(Boolean);
//#endregion
//#region ../../node_modules/.pnpm/nitro@3.0.260603-beta_drizzle-orm@0.45.2_@types+pg@8.20.0_pg@8.22.0_postgres@3.4.9__jit_f7280ed15d50a4c568f05ea55ad35156/node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new FastResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
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
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
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
function useNitroHooks() {
	const nitroApp = useNitroApp();
	const hooks = nitroApp.hooks;
	if (hooks) return hooks;
	return nitroApp.hooks = new HookableCore();
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
//#region ../../node_modules/.pnpm/nitro@3.0.260603-beta_drizzle-orm@0.45.2_@types+pg@8.20.0_pg@8.22.0_postgres@3.4.9__jit_f7280ed15d50a4c568f05ea55ad35156/node_modules/nitro/dist/presets/cloudflare/runtime/_module-handler.mjs
function createHandler(hooks) {
	const nitroApp = useNitroApp();
	const nitroHooks = useNitroHooks();
	return {
		async fetch(request, env, context) {
			globalThis.__env__ = env;
			augmentReq(request, {
				env,
				context
			});
			const ctxExt = {};
			const url = new URL(request.url);
			if (hooks.fetch) {
				const res = await hooks.fetch(request, env, context, url, ctxExt);
				if (res) return res;
			}
			return await nitroApp.fetch(request);
		},
		scheduled(controller, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:scheduled", {
				controller,
				env,
				context
			}) || Promise.resolve());
		},
		email(message, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:email", {
				message,
				event: message,
				env,
				context
			}) || Promise.resolve());
		},
		queue(batch, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:queue", {
				batch,
				event: batch,
				env,
				context
			}) || Promise.resolve());
		},
		tail(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:tail", {
				traces,
				env,
				context
			}) || Promise.resolve());
		},
		trace(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:trace", {
				traces,
				env,
				context
			}) || Promise.resolve());
		}
	};
}
function augmentReq(cfReq, ctx) {
	const req = cfReq;
	req.ip = cfReq.headers.get("cf-connecting-ip") || void 0;
	req.runtime ??= { name: "cloudflare" };
	req.runtime.cloudflare = {
		...req.runtime.cloudflare,
		...ctx
	};
	req.waitUntil = ctx.context?.waitUntil.bind(ctx.context);
}
//#endregion
//#region ../../node_modules/.pnpm/nitro@3.0.260603-beta_drizzle-orm@0.45.2_@types+pg@8.20.0_pg@8.22.0_postgres@3.4.9__jit_f7280ed15d50a4c568f05ea55ad35156/node_modules/nitro/dist/presets/cloudflare/runtime/cloudflare-module.mjs
var cloudflare_module_default = createHandler({ fetch(cfRequest, env, context, url) {
	if (env.ASSETS && isPublicAssetURL(url.pathname)) return env.ASSETS.fetch(cfRequest);
} });
//#endregion
export { cloudflare_module_default as default };
