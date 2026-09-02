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
		"mtime": "2026-09-02T10:32:05.711Z",
		"size": 163,
		"path": "../public/favicon.svg"
	},
	"/manifest.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"1ea-6VxqHNj9+exgLrKEoBUp7bg4ak0\"",
		"mtime": "2026-09-02T10:32:05.711Z",
		"size": 490,
		"path": "../public/manifest.webmanifest"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"16-iUOtJ2RsHfdY9DoQxaq0wz1LZCU\"",
		"mtime": "2026-09-02T10:32:05.711Z",
		"size": 22,
		"path": "../public/robots.txt"
	},
	"/assets/Avatar-B-Pm8PA8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"225-t6cM2PRnYuG7kHDElAWttZ8yzxE\"",
		"mtime": "2026-09-02T10:32:02.853Z",
		"size": 549,
		"path": "../public/assets/Avatar-B-Pm8PA8.js"
	},
	"/assets/ChannelContentList-gvjjiQiA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"58e-8cEic1YaT+gQnT0SxiUvfAafPPQ\"",
		"mtime": "2026-09-02T10:32:02.858Z",
		"size": 1422,
		"path": "../public/assets/ChannelContentList-gvjjiQiA.js"
	},
	"/assets/ClientOnly-BLQ6U6R8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13f-j0SNX9405wGpvG+wmmJESUTpnZI\"",
		"mtime": "2026-09-02T10:32:02.858Z",
		"size": 319,
		"path": "../public/assets/ClientOnly-BLQ6U6R8.js"
	},
	"/assets/LiveLocationSheet-KFgZ3FXB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"139d-nsY0SucbrGDMYBKDTDFZxeevy/4\"",
		"mtime": "2026-09-02T10:32:02.858Z",
		"size": 5021,
		"path": "../public/assets/LiveLocationSheet-KFgZ3FXB.js"
	},
	"/assets/FollowListDialog-C_lR3k20.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24ae-JdTG7nG0MLC1M2s+AY98YgP/MSI\"",
		"mtime": "2026-09-02T10:32:02.858Z",
		"size": 9390,
		"path": "../public/assets/FollowListDialog-C_lR3k20.js"
	},
	"/assets/VideoPoster-CofiBBKK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"491d-quURcF/IS5WlZcRhc6637QmaRO4\"",
		"mtime": "2026-09-02T10:32:02.859Z",
		"size": 18717,
		"path": "../public/assets/VideoPoster-CofiBBKK.js"
	},
	"/assets/ShareSheet-D5Hmj8rC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a3bc-+H9kuWl+LuYupJNPpUm5ebbnen4\"",
		"mtime": "2026-09-02T10:32:02.859Z",
		"size": 41916,
		"path": "../public/assets/ShareSheet-D5Hmj8rC.js"
	},
	"/assets/alerts-count-DHSuNaMv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5fb-ylA9uzbMrqUws9vmDeouuy5XUEo\"",
		"mtime": "2026-09-02T10:32:02.860Z",
		"size": 1531,
		"path": "../public/assets/alerts-count-DHSuNaMv.js"
	},
	"/assets/account-DETrzScT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"599f-u6hgxYIF7GuR1kyPivskfU1aly4\"",
		"mtime": "2026-09-02T10:32:02.860Z",
		"size": 22943,
		"path": "../public/assets/account-DETrzScT.js"
	},
	"/assets/auth-DUQX5GHP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4db5-pL5+RyQgulNIU5HzoJhI0SPSpsc\"",
		"mtime": "2026-09-02T10:32:02.860Z",
		"size": 19893,
		"path": "../public/assets/auth-DUQX5GHP.js"
	},
	"/assets/button-CFzFWFkK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"587-z6rKPYiQ2TAcziw1mFzwn+9PD4s\"",
		"mtime": "2026-09-02T10:32:02.860Z",
		"size": 1415,
		"path": "../public/assets/button-CFzFWFkK.js"
	},
	"/assets/channel-data-BlHzNSOe.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a76-aRyltGxX6esJFuD32Pcul7izqew\"",
		"mtime": "2026-09-02T10:32:02.860Z",
		"size": 2678,
		"path": "../public/assets/channel-data-BlHzNSOe.js"
	},
	"/assets/channel.analytics-B-0GU_rj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"952-pLpJyAZFj0kEmm3gqA2DK4jP7Gw\"",
		"mtime": "2026-09-02T10:32:02.860Z",
		"size": 2386,
		"path": "../public/assets/channel.analytics-B-0GU_rj.js"
	},
	"/assets/channel.create-kSzmDMI_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1942-s4QrqQX3VnXIXGDrksJdcK+pneY\"",
		"mtime": "2026-09-02T10:32:02.860Z",
		"size": 6466,
		"path": "../public/assets/channel.create-kSzmDMI_.js"
	},
	"/assets/channel.monetization-C1iUuYQv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9ab-4uxAlqIEbe2qQ4xTBIhBvjMTr1w\"",
		"mtime": "2026-09-02T10:32:02.861Z",
		"size": 2475,
		"path": "../public/assets/channel.monetization-C1iUuYQv.js"
	},
	"/assets/channel.posts-CUjzmVn1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"101-lUNNlPcyik7ele2pGNwX9CUqQLA\"",
		"mtime": "2026-09-02T10:32:02.861Z",
		"size": 257,
		"path": "../public/assets/channel.posts-CUjzmVn1.js"
	},
	"/assets/channel.subscribers--CIxoFZR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"546-cUrZONu9WQLGnZuy/4TOzNbXb6A\"",
		"mtime": "2026-09-02T10:32:02.861Z",
		"size": 1350,
		"path": "../public/assets/channel.subscribers--CIxoFZR.js"
	},
	"/assets/channel.videos-D_BLeNK7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"103-MTV7dbVG/kdy6cBVCPY7ZlBA+i4\"",
		"mtime": "2026-09-02T10:32:02.861Z",
		"size": 259,
		"path": "../public/assets/channel.videos-D_BLeNK7.js"
	},
	"/assets/chat-delete-D_ha7tQk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d6-IhZrxTirr014i4++zc6Dgi4JX/w\"",
		"mtime": "2026-09-02T10:32:02.861Z",
		"size": 1238,
		"path": "../public/assets/chat-delete-D_ha7tQk.js"
	},
	"/assets/channel.reels-Dk6mgPGp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"101-V52xTMIAPcq6KQr9ObHcSGOzHsQ\"",
		"mtime": "2026-09-02T10:32:02.861Z",
		"size": 257,
		"path": "../public/assets/channel.reels-Dk6mgPGp.js"
	},
	"/assets/chat.index-D4gB5AAt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"232e-DoRAnPsTpDAx0xu9HbDtAf4Uazs\"",
		"mtime": "2026-09-02T10:32:02.861Z",
		"size": 9006,
		"path": "../public/assets/chat.index-D4gB5AAt.js"
	},
	"/assets/chevron-left-BGT2jwps.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"82-ERuk4ciqoitY59aZYOvT5rXPubs\"",
		"mtime": "2026-09-02T10:32:02.861Z",
		"size": 130,
		"path": "../public/assets/chevron-left-BGT2jwps.js"
	},
	"/assets/client-Crb0DbGz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"33944-0qHfMClpy1zoBqW+bwkMXim3Sgo\"",
		"mtime": "2026-09-02T10:32:02.861Z",
		"size": 211268,
		"path": "../public/assets/client-Crb0DbGz.js"
	},
	"/assets/copyright-policy-A0iyX6lf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"236d-kqdt00GSsn1g7fJkLHZlYmt1bAA\"",
		"mtime": "2026-09-02T10:32:02.862Z",
		"size": 9069,
		"path": "../public/assets/copyright-policy-A0iyX6lf.js"
	},
	"/assets/createLucideIcon-iH0benOB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11ae-iZkrx063T21juaJiUfhtmAuWlDk\"",
		"mtime": "2026-09-02T10:32:02.862Z",
		"size": 4526,
		"path": "../public/assets/createLucideIcon-iH0benOB.js"
	},
	"/assets/createServerFn-CJb-NcQQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1144-Q1IWT70PqwaSrR93aoURK9XsdDM\"",
		"mtime": "2026-09-02T10:32:02.862Z",
		"size": 4420,
		"path": "../public/assets/createServerFn-CJb-NcQQ.js"
	},
	"/assets/dialog-FxhoQVdP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7a6-dpzxuIEEJlTDDJ7xIGW1Hro/YYU\"",
		"mtime": "2026-09-02T10:32:02.862Z",
		"size": 1958,
		"path": "../public/assets/dialog-FxhoQVdP.js"
	},
	"/assets/dist-7DHJbmHc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1cc7-WmlEqZx3QjHh6rMuq/jHoa40r6E\"",
		"mtime": "2026-09-02T10:32:02.862Z",
		"size": 7367,
		"path": "../public/assets/dist-7DHJbmHc.js"
	},
	"/assets/dist-9_rQ_Grk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b66-ac4Zo3/Yjuo/arQBE7AOafHNEQo\"",
		"mtime": "2026-09-02T10:32:02.862Z",
		"size": 2918,
		"path": "../public/assets/dist-9_rQ_Grk.js"
	},
	"/assets/dist-B2STVHEh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"282-cSR0JH2nXO13PsbJgoZl3wps454\"",
		"mtime": "2026-09-02T10:32:02.862Z",
		"size": 642,
		"path": "../public/assets/dist-B2STVHEh.js"
	},
	"/assets/dist-ChhcN3pS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12ec-//hCpgxrdxHsUrHvyHTpVLeTtao\"",
		"mtime": "2026-09-02T10:32:02.863Z",
		"size": 4844,
		"path": "../public/assets/dist-ChhcN3pS.js"
	},
	"/assets/dist-BBs97vxf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6448-fldm3LWS6Q2nXcRmg40mS1jHNKM\"",
		"mtime": "2026-09-02T10:32:02.862Z",
		"size": 25672,
		"path": "../public/assets/dist-BBs97vxf.js"
	},
	"/assets/dist-DLQt2BcY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2a9-YZYgEHXuUd8kv7q1LqyYawzzkok\"",
		"mtime": "2026-09-02T10:32:02.863Z",
		"size": 681,
		"path": "../public/assets/dist-DLQt2BcY.js"
	},
	"/assets/dist-Djdv0oiS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1399-ihQxlrv+hH9tV+MdxDN6nQjmzbY\"",
		"mtime": "2026-09-02T10:32:02.863Z",
		"size": 5017,
		"path": "../public/assets/dist-Djdv0oiS.js"
	},
	"/assets/dist-yp-2tsEm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109b-fv193BiWFIE6I5aBGD0O54gtDIE\"",
		"mtime": "2026-09-02T10:32:02.863Z",
		"size": 4251,
		"path": "../public/assets/dist-yp-2tsEm.js"
	},
	"/assets/ellipsis-rhQ8hK2I.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e2-kniN9aLnDwR8hGdO1SdHAp1Aa1w\"",
		"mtime": "2026-09-02T10:32:02.863Z",
		"size": 226,
		"path": "../public/assets/ellipsis-rhQ8hK2I.js"
	},
	"/assets/es2015--DrBlcKE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6190-jP+wsDeJlMMXZLV/wlo95YsSNZw\"",
		"mtime": "2026-09-02T10:32:02.863Z",
		"size": 24976,
		"path": "../public/assets/es2015--DrBlcKE.js"
	},
	"/assets/eye-Cz0ahPpn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"100-lX+zQR+cqhEnMI/2k9v01YhOoc0\"",
		"mtime": "2026-09-02T10:32:02.863Z",
		"size": 256,
		"path": "../public/assets/eye-Cz0ahPpn.js"
	},
	"/assets/geo-data-CYKNiDfb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6ce-DiXeUwOVv3S5GUs0RTxhIQieJkk\"",
		"mtime": "2026-09-02T10:32:02.863Z",
		"size": 1742,
		"path": "../public/assets/geo-data-CYKNiDfb.js"
	},
	"/assets/html2canvas-DCcDvdvP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"30b50-/NW/tvs1950d+adFAmG+0O5qROc\"",
		"mtime": "2026-09-02T10:32:02.863Z",
		"size": 199504,
		"path": "../public/assets/html2canvas-DCcDvdvP.js"
	},
	"/assets/image-plus-BJqdZ4Uv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16b-b6wu4WhgvBU2BX3lTBUCpm3c0bc\"",
		"mtime": "2026-09-02T10:32:02.863Z",
		"size": 363,
		"path": "../public/assets/image-plus-BJqdZ4Uv.js"
	},
	"/assets/index.es-CT2ExK7l.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24f8c-iEWSws4MjR80sD3CNtVhZFBgw8I\"",
		"mtime": "2026-09-02T10:32:02.863Z",
		"size": 151436,
		"path": "../public/assets/index.es-CT2ExK7l.js"
	},
	"/assets/index-CtCXbgxk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a5a4a-R+eZrWj4+/3lR3Tdr6GS/1easgw\"",
		"mtime": "2026-09-02T10:32:02.849Z",
		"size": 678474,
		"path": "../public/assets/index-CtCXbgxk.js"
	},
	"/assets/input-CcN_9pcr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"296-LiC1GHZZQbPd/3D5fbi7wnbma+M\"",
		"mtime": "2026-09-02T10:32:02.863Z",
		"size": 662,
		"path": "../public/assets/input-CcN_9pcr.js"
	},
	"/assets/link-C9MlbRvy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3ff2-K55DZb2LWnCkqRjf9bKcwFxzabE\"",
		"mtime": "2026-09-02T10:32:02.864Z",
		"size": 16370,
		"path": "../public/assets/link-C9MlbRvy.js"
	},
	"/assets/matchContext-BLaZZjXw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b8-BSjivHXemCqEV+wXXsCe5P0ODLQ\"",
		"mtime": "2026-09-02T10:32:02.864Z",
		"size": 184,
		"path": "../public/assets/matchContext-BLaZZjXw.js"
	},
	"/assets/moment._momentId-BtYUN7Ak.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3e5b-M6VjkDfS8zyeQh9k3luAMtzqx9U\"",
		"mtime": "2026-09-02T10:32:02.864Z",
		"size": 15963,
		"path": "../public/assets/moment._momentId-BtYUN7Ak.js"
	},
	"/assets/moment.index-DdgBRfPK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c22-PlUNqCl7QnDQDU4OGV/IA92HvPs\"",
		"mtime": "2026-09-02T10:32:02.864Z",
		"size": 3106,
		"path": "../public/assets/moment.index-DdgBRfPK.js"
	},
	"/assets/not-found-DIgawKw1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"37-RTB6YH5iXRKeXz1Sn6ZQ+vS0lnc\"",
		"mtime": "2026-09-02T10:32:02.864Z",
		"size": 55,
		"path": "../public/assets/not-found-DIgawKw1.js"
	},
	"/assets/notifications-CDxEhjMM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"17e9-kzGyX9ZFJf+LXjbz1chZrUYxhew\"",
		"mtime": "2026-09-02T10:32:02.864Z",
		"size": 6121,
		"path": "../public/assets/notifications-CDxEhjMM.js"
	},
	"/assets/orbit-BMibH0Vp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f5-QaV3k4ybsiuWFuIcXR6J7sNXa9g\"",
		"mtime": "2026-09-02T10:32:02.864Z",
		"size": 2293,
		"path": "../public/assets/orbit-BMibH0Vp.js"
	},
	"/assets/orbit-match-CoOKF8us.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a94-azt/2e4NA8xs3YLrhgeO+1vAeW4\"",
		"mtime": "2026-09-02T10:32:02.864Z",
		"size": 2708,
		"path": "../public/assets/orbit-match-CoOKF8us.js"
	},
	"/assets/orbit-mood-D1SQ3wAI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4f8-0OOOjx3oF76Cb8sSgFsOxSYcYUs\"",
		"mtime": "2026-09-02T10:32:02.864Z",
		"size": 1272,
		"path": "../public/assets/orbit-mood-D1SQ3wAI.js"
	},
	"/assets/orbit-store-BqYOJk0T.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3b30-NFb5UhjWXMW98GBk0wUniSYB5KI\"",
		"mtime": "2026-09-02T10:32:02.864Z",
		"size": 15152,
		"path": "../public/assets/orbit-store-BqYOJk0T.js"
	},
	"/assets/orbit._profileId-clAarWCJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2837-JqQHGpTqdrvK6mhNKHt+jwLh6e0\"",
		"mtime": "2026-09-02T10:32:02.864Z",
		"size": 10295,
		"path": "../public/assets/orbit._profileId-clAarWCJ.js"
	},
	"/assets/orbit.chat._userId-Czmor9k-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9a8a-nuY5PpLvze2vHxfIGcQgdPdwvUE\"",
		"mtime": "2026-09-02T10:32:02.865Z",
		"size": 39562,
		"path": "../public/assets/orbit.chat._userId-Czmor9k-.js"
	},
	"/assets/orbit.create-CvLLvTLn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"849e-Zk086O2XitS+a9rbSSRvsF0/7eE\"",
		"mtime": "2026-09-02T10:32:02.865Z",
		"size": 33950,
		"path": "../public/assets/orbit.create-CvLLvTLn.js"
	},
	"/assets/orbit.index-IeIMMSwy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"72f6-9PAuP73s7JUSdxymR5/g+heWGc4\"",
		"mtime": "2026-09-02T10:32:02.865Z",
		"size": 29430,
		"path": "../public/assets/orbit.index-IeIMMSwy.js"
	},
	"/assets/orbit.me-uAAnY6aR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1929-/WCE+V9bZVN0/gQd9hDFXpIzycw\"",
		"mtime": "2026-09-02T10:32:02.865Z",
		"size": 6441,
		"path": "../public/assets/orbit.me-uAAnY6aR.js"
	},
	"/assets/orbit.messages-CkqlKqoR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"337f-VJQm8574GQG/DPu83ZtHvl/Sozc\"",
		"mtime": "2026-09-02T10:32:02.865Z",
		"size": 13183,
		"path": "../public/assets/orbit.messages-CkqlKqoR.js"
	},
	"/assets/orbit.notifications-DhV1KP-Z.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cdc-Tc9zu4SYG1zX0pohJ560ISjutjU\"",
		"mtime": "2026-09-02T10:32:02.865Z",
		"size": 3292,
		"path": "../public/assets/orbit.notifications-DhV1KP-Z.js"
	},
	"/assets/navigation-Cnljyh5z.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"94-ith/TJtb6BPN7Z0ZIt1ctQ9FIOY\"",
		"mtime": "2026-09-02T10:32:02.864Z",
		"size": 148,
		"path": "../public/assets/navigation-Cnljyh5z.js"
	},
	"/assets/orbit.privacy-BKixvzz4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3b97-K9eLaBtGrtzM2zx/vOzDePqKfro\"",
		"mtime": "2026-09-02T10:32:02.865Z",
		"size": 15255,
		"path": "../public/assets/orbit.privacy-BKixvzz4.js"
	},
	"/assets/pin-CkplOlfx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"31a-BDyTehNT7oLof4JKMNQJQOnFV0Y\"",
		"mtime": "2026-09-02T10:32:02.865Z",
		"size": 794,
		"path": "../public/assets/pin-CkplOlfx.js"
	},
	"/assets/post-1-uxYyj4Yn.jpg": {
		"type": "image/jpeg",
		"etag": "\"2621b-tADwOglKGR4PvLgzJyB6lOA0+b8\"",
		"mtime": "2026-09-02T10:32:02.867Z",
		"size": 156187,
		"path": "../public/assets/post-1-uxYyj4Yn.jpg"
	},
	"/assets/post.create-CofXbQcw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15b5-rKHY5s0rCeNxfhER3RggqXcoNkY\"",
		"mtime": "2026-09-02T10:32:02.865Z",
		"size": 5557,
		"path": "../public/assets/post.create-CofXbQcw.js"
	},
	"/assets/privacy-BAzL8Ebl.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c79-GEozFWUSq7h0we9yQgkSAdNouQY\"",
		"mtime": "2026-09-02T10:32:02.865Z",
		"size": 3193,
		"path": "../public/assets/privacy-BAzL8Ebl.js"
	},
	"/assets/profile-bt6fi_Fw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7cef-NcGHSLVWSS4xLCNW9MBYWR+87Wo\"",
		"mtime": "2026-09-02T10:32:02.865Z",
		"size": 31983,
		"path": "../public/assets/profile-bt6fi_Fw.js"
	},
	"/assets/profiles-map-DZTYV8dt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"32a-wtDk8K9VD943FpPOAXE/q6f65Pg\"",
		"mtime": "2026-09-02T10:32:02.865Z",
		"size": 810,
		"path": "../public/assets/profiles-map-DZTYV8dt.js"
	},
	"/assets/purify.es-ChwZkWde.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"68bc-bPPRDEosU/Lqj+2Oyi1ue22LViM\"",
		"mtime": "2026-09-02T10:32:02.865Z",
		"size": 26812,
		"path": "../public/assets/purify.es-ChwZkWde.js"
	},
	"/assets/react-dom-BS6Gh_TR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e08-9bSgZZ4q4Ni+kAtZEKfL9G1hHrE\"",
		"mtime": "2026-09-02T10:32:02.865Z",
		"size": 3592,
		"path": "../public/assets/react-dom-BS6Gh_TR.js"
	},
	"/assets/redirect-DtIAAt0y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e1-KhpEIx1LNSnb7dNYxiNI58wV9MY\"",
		"mtime": "2026-09-02T10:32:02.865Z",
		"size": 481,
		"path": "../public/assets/redirect-DtIAAt0y.js"
	},
	"/assets/reel-1-DgXdxb9U.jpg": {
		"type": "image/jpeg",
		"etag": "\"158de-632G9IqzPFNj16hyS2vSq2z3WoA\"",
		"mtime": "2026-09-02T10:32:02.867Z",
		"size": 88286,
		"path": "../public/assets/reel-1-DgXdxb9U.jpg"
	},
	"/assets/reel-2-D6ICrDT7.jpg": {
		"type": "image/jpeg",
		"etag": "\"1d3c4-QU1Rig2/vTeF6slkXtMXSVa68U0\"",
		"mtime": "2026-09-02T10:32:02.867Z",
		"size": 119748,
		"path": "../public/assets/reel-2-D6ICrDT7.jpg"
	},
	"/assets/reel-3-BYUKUHRv.jpg": {
		"type": "image/jpeg",
		"etag": "\"8bae-hivl0InXk3Rn4aAy5LSO54t+UZE\"",
		"mtime": "2026-09-02T10:32:02.868Z",
		"size": 35758,
		"path": "../public/assets/reel-3-BYUKUHRv.jpg"
	},
	"/assets/reels-XP7Ouo4d.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2fec-tma/NNKRa8slKkxsPuwzUJfUzkI\"",
		"mtime": "2026-09-02T10:32:02.865Z",
		"size": 12268,
		"path": "../public/assets/reels-XP7Ouo4d.js"
	},
	"/assets/reset-password-CGLC1KMH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"52a-u7HKhcgmvqfrWg12GlNBV80/UDk\"",
		"mtime": "2026-09-02T10:32:02.865Z",
		"size": 1322,
		"path": "../public/assets/reset-password-CGLC1KMH.js"
	},
	"/assets/rolldown-runtime-hePW80VL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2cc-fA8td6k29UVF6JoPfhOPkceTK1M\"",
		"mtime": "2026-09-02T10:32:02.866Z",
		"size": 716,
		"path": "../public/assets/rolldown-runtime-hePW80VL.js"
	},
	"/assets/root-DLTE-HSj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20-vSYConOtSP6ciwr9zKsPixNwWmc\"",
		"mtime": "2026-09-02T10:32:02.866Z",
		"size": 32,
		"path": "../public/assets/root-DLTE-HSj.js"
	},
	"/assets/route-Cihwbjub.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8c-FRQ9V7JyZ7W/nd758qLjwyAYI0U\"",
		"mtime": "2026-09-02T10:32:02.866Z",
		"size": 140,
		"path": "../public/assets/route-Cihwbjub.js"
	},
	"/assets/routes-CgyAK13r.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85d8-a8tLwVIv1M04nMxAbVxYw9VHkXc\"",
		"mtime": "2026-09-02T10:32:02.866Z",
		"size": 34264,
		"path": "../public/assets/routes-CgyAK13r.js"
	},
	"/assets/scan-face-sxFWmzsE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a5-Y2UqQgSBEwu4kMD85vELLlBh5sU\"",
		"mtime": "2026-09-02T10:32:02.866Z",
		"size": 421,
		"path": "../public/assets/scan-face-sxFWmzsE.js"
	},
	"/assets/search-Dz83hZ0v.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"268e-/okJS5RwMjtLnk9xwJYJ60SUkpk\"",
		"mtime": "2026-09-02T10:32:02.866Z",
		"size": 9870,
		"path": "../public/assets/search-Dz83hZ0v.js"
	},
	"/assets/settings-2-DSFw16E7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fc-YjyE4RHbgnoS6p0S+zqs7eJcFM0\"",
		"mtime": "2026-09-02T10:32:02.866Z",
		"size": 252,
		"path": "../public/assets/settings-2-DSFw16E7.js"
	},
	"/assets/settings-B8tT_OA8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e7-c/L/cGC0JKMHerkblJe9r5odcUw\"",
		"mtime": "2026-09-02T10:32:02.866Z",
		"size": 487,
		"path": "../public/assets/settings-B8tT_OA8.js"
	},
	"/assets/sheet-DJ16CAEG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8a3-GiYxP56LRykPmSFmVZQ1dwiuOnI\"",
		"mtime": "2026-09-02T10:32:02.866Z",
		"size": 2211,
		"path": "../public/assets/sheet-DJ16CAEG.js"
	},
	"/assets/shield-O8mWKBL4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"190-qYcBr3BJ1sz5uAodpsukY/3VDkI\"",
		"mtime": "2026-09-02T10:32:02.866Z",
		"size": 400,
		"path": "../public/assets/shield-O8mWKBL4.js"
	},
	"/assets/shield-check-DY8Z9tNx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"140-L6ywdP9awPA8hdPfOGQbhYx+fUI\"",
		"mtime": "2026-09-02T10:32:02.866Z",
		"size": 320,
		"path": "../public/assets/shield-check-DY8Z9tNx.js"
	},
	"/assets/square-BUgAbszy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"93-LiQ+yvv0l7q/zYMX4gm1OaVkvu0\"",
		"mtime": "2026-09-02T10:32:02.866Z",
		"size": 147,
		"path": "../public/assets/square-BUgAbszy.js"
	},
	"/assets/styles-BzXXNpPA.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"33c1a-9/Qh4f5gsf0jC2iwvIp7sbNE5mY\"",
		"mtime": "2026-09-02T10:32:02.868Z",
		"size": 211994,
		"path": "../public/assets/styles-BzXXNpPA.css"
	},
	"/assets/switch-3PSOTq9h.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1109-Qhm6F2h37ry2GBa8O8eva3guYiI\"",
		"mtime": "2026-09-02T10:32:02.866Z",
		"size": 4361,
		"path": "../public/assets/switch-3PSOTq9h.js"
	},
	"/assets/terms-DQnrx1z4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"df8-2d9KeCyyMRvyAScpc0UqOzB4rV0\"",
		"mtime": "2026-09-02T10:32:02.866Z",
		"size": 3576,
		"path": "../public/assets/terms-DQnrx1z4.js"
	},
	"/assets/textarea-C00HuGmh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"230-DWl4lJAVADVWArTEBIUuvtrcrj0\"",
		"mtime": "2026-09-02T10:32:02.866Z",
		"size": 560,
		"path": "../public/assets/textarea-C00HuGmh.js"
	},
	"/assets/trending-up-YAe1ltwH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"af-bdI8M5ZUUy+k0LXNzLsLEwvahuk\"",
		"mtime": "2026-09-02T10:32:02.866Z",
		"size": 175,
		"path": "../public/assets/trending-up-YAe1ltwH.js"
	},
	"/assets/triangle-alert-B6YStwX3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109-WYZYJPE9R6glDPY3oOf+/Ic7M0Y\"",
		"mtime": "2026-09-02T10:32:02.866Z",
		"size": 265,
		"path": "../public/assets/triangle-alert-B6YStwX3.js"
	},
	"/assets/u._userId-B2LLNsm1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16b1-g8694duBuwZi5y+3J6FQn+zOhA8\"",
		"mtime": "2026-09-02T10:32:02.866Z",
		"size": 5809,
		"path": "../public/assets/u._userId-B2LLNsm1.js"
	},
	"/assets/useMatch-Cn1trAC4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"273-wnGXhbrsNtrK+zBZ+tntohdhYhU\"",
		"mtime": "2026-09-02T10:32:02.866Z",
		"size": 627,
		"path": "../public/assets/useMatch-Cn1trAC4.js"
	},
	"/assets/useRouter-BP8vT1kh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f38-UAwyZ71XUq5pvhwLvcQ+ekWdEeM\"",
		"mtime": "2026-09-02T10:32:02.867Z",
		"size": 7992,
		"path": "../public/assets/useRouter-BP8vT1kh.js"
	},
	"/assets/useServerFn-CzzciFve.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19d-Q2chUu1zNyiLPgJ8BU4VVAVaG7A\"",
		"mtime": "2026-09-02T10:32:02.867Z",
		"size": 413,
		"path": "../public/assets/useServerFn-CzzciFve.js"
	},
	"/assets/useStore-Bwiy6pX7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"786-iVUaSoWn1x0ZE/FkYImHA2AwxQw\"",
		"mtime": "2026-09-02T10:32:02.867Z",
		"size": 1926,
		"path": "../public/assets/useStore-Bwiy6pX7.js"
	},
	"/assets/video-data-BgpjTVn0.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a81-rJ1feiTaS42wWfQVXacUruO6Byc\"",
		"mtime": "2026-09-02T10:32:02.867Z",
		"size": 6785,
		"path": "../public/assets/video-data-BgpjTVn0.js"
	},
	"/assets/video._videoId-Bn5DJYwL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2666-f/53ccvhEFTCYREmRJchyFS1mus\"",
		"mtime": "2026-09-02T10:32:02.867Z",
		"size": 9830,
		"path": "../public/assets/video._videoId-Bn5DJYwL.js"
	},
	"/assets/video.upload-CatLB1w8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"264e-flN1wFpYTLqUJx0AAbdJw6Rl33s\"",
		"mtime": "2026-09-02T10:32:02.867Z",
		"size": 9806,
		"path": "../public/assets/video.upload-CatLB1w8.js"
	},
	"/assets/wallet-CB697LN0.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"650c9-tdYdPDlpZ7klM58SWCwyZpMNPjM\"",
		"mtime": "2026-09-02T10:32:02.867Z",
		"size": 413897,
		"path": "../public/assets/wallet-CB697LN0.js"
	},
	"/assets/yw-download-DwNrhE_c.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"511-/EgO3q0AkwboSGQj5DEH2DCwOEE\"",
		"mtime": "2026-09-02T10:32:02.867Z",
		"size": 1297,
		"path": "../public/assets/yw-download-DwNrhE_c.js"
	},
	"/assets/yw-logo-BXjnypdM.png": {
		"type": "image/png",
		"etag": "\"b8bf9-XKz0DAyp9GBS6zs069mBfmp0ubE\"",
		"mtime": "2026-09-02T10:32:02.868Z",
		"size": 756729,
		"path": "../public/assets/yw-logo-BXjnypdM.png"
	},
	"/icon-512.png": {
		"type": "image/png",
		"etag": "\"10033-25w1u01xl/8gQOyAqgrSdkaxdio\"",
		"mtime": "2026-09-02T10:32:05.711Z",
		"size": 65587,
		"path": "../public/icon-512.png"
	},
	"/favicon.png": {
		"type": "image/png",
		"etag": "\"16c7-sHfgQvyMV/xhC2ahSs44WAoIC94\"",
		"mtime": "2026-09-02T10:32:05.711Z",
		"size": 5831,
		"path": "../public/favicon.png"
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
