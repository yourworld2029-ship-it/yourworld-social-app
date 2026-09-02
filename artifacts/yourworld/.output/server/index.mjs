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
		"mtime": "2026-09-02T08:16:52.477Z",
		"size": 163,
		"path": "../public/favicon.svg"
	},
	"/manifest.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"1ea-6VxqHNj9+exgLrKEoBUp7bg4ak0\"",
		"mtime": "2026-09-02T08:16:52.477Z",
		"size": 490,
		"path": "../public/manifest.webmanifest"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"16-iUOtJ2RsHfdY9DoQxaq0wz1LZCU\"",
		"mtime": "2026-09-02T08:16:52.477Z",
		"size": 22,
		"path": "../public/robots.txt"
	},
	"/assets/Avatar-CxiuhJyT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"225-b9552GSFNTGqUwgwLrRXvc8oM+M\"",
		"mtime": "2026-09-02T08:16:49.307Z",
		"size": 549,
		"path": "../public/assets/Avatar-CxiuhJyT.js"
	},
	"/assets/ClientOnly-BLQ6U6R8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13f-j0SNX9405wGpvG+wmmJESUTpnZI\"",
		"mtime": "2026-09-02T08:16:49.313Z",
		"size": 319,
		"path": "../public/assets/ClientOnly-BLQ6U6R8.js"
	},
	"/assets/FollowListDialog-cHHjW-H0.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24ae-XqVI2Ym814q+lP43u+LenrU0mBs\"",
		"mtime": "2026-09-02T08:16:49.313Z",
		"size": 9390,
		"path": "../public/assets/FollowListDialog-cHHjW-H0.js"
	},
	"/assets/LiveLocationSheet-Cv0e7Ued.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"139d-FTjHQ5FDW5g5RrLRUmA02P+nhdQ\"",
		"mtime": "2026-09-02T08:16:49.313Z",
		"size": 5021,
		"path": "../public/assets/LiveLocationSheet-Cv0e7Ued.js"
	},
	"/assets/ChannelContentList-CgJ0qgnT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"58e-eMZpJSHvYL45uVEOAdcBBfaUjXU\"",
		"mtime": "2026-09-02T08:16:49.313Z",
		"size": 1422,
		"path": "../public/assets/ChannelContentList-CgJ0qgnT.js"
	},
	"/assets/VideoPoster-CI7PHRCg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"491d-yRlceXlIjPam/E40TG/LsvoRa1I\"",
		"mtime": "2026-09-02T08:16:49.314Z",
		"size": 18717,
		"path": "../public/assets/VideoPoster-CI7PHRCg.js"
	},
	"/assets/ShareSheet-Uay41DgH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a3bc-Oi4cASVg9iYVt+QFQDcFEWNJNrE\"",
		"mtime": "2026-09-02T08:16:49.313Z",
		"size": 41916,
		"path": "../public/assets/ShareSheet-Uay41DgH.js"
	},
	"/assets/account-D8h6aMag.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"599f-fR4j3QTY9TAB3r6dUnQk+fQ0v3Y\"",
		"mtime": "2026-09-02T08:16:49.314Z",
		"size": 22943,
		"path": "../public/assets/account-D8h6aMag.js"
	},
	"/assets/auth-W9005MYN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4c06-D3tk7K38Ey/oatIF6PMHgXOl76o\"",
		"mtime": "2026-09-02T08:16:49.314Z",
		"size": 19462,
		"path": "../public/assets/auth-W9005MYN.js"
	},
	"/assets/button-C121WwsP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"587-CBdjpuJyozZ6aoM7crUJ4wE0m3Y\"",
		"mtime": "2026-09-02T08:16:49.314Z",
		"size": 1415,
		"path": "../public/assets/button-C121WwsP.js"
	},
	"/assets/channel-data-Ctiq2G7r.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a77-zoucJ5Mqwdv8DdfRAUhi9/X11Co\"",
		"mtime": "2026-09-02T08:16:49.314Z",
		"size": 2679,
		"path": "../public/assets/channel-data-Ctiq2G7r.js"
	},
	"/assets/channel.analytics-DnzrLR-H.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"952-dmN4rSkObS7CYkxUBX+UR+4goPc\"",
		"mtime": "2026-09-02T08:16:49.314Z",
		"size": 2386,
		"path": "../public/assets/channel.analytics-DnzrLR-H.js"
	},
	"/assets/channel.create-aPuPCDum.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1942-6d33Z+z7ID5r/wXqLCzYZmjgHKI\"",
		"mtime": "2026-09-02T08:16:49.314Z",
		"size": 6466,
		"path": "../public/assets/channel.create-aPuPCDum.js"
	},
	"/assets/channel.monetization-Cb4DIyXE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9ab-ZmL6e9LxWZlaYs0VxmBUgXqakao\"",
		"mtime": "2026-09-02T08:16:49.315Z",
		"size": 2475,
		"path": "../public/assets/channel.monetization-Cb4DIyXE.js"
	},
	"/assets/alerts-count-CxbN1RU8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5fb-8QXwN0cNCM/FVtAyOIoWzQF2kc4\"",
		"mtime": "2026-09-02T08:16:49.314Z",
		"size": 1531,
		"path": "../public/assets/alerts-count-CxbN1RU8.js"
	},
	"/assets/channel.posts-Jf2SHtkW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"101-OROSuuP9joMoi8sUypnK1LyqMeo\"",
		"mtime": "2026-09-02T08:16:49.315Z",
		"size": 257,
		"path": "../public/assets/channel.posts-Jf2SHtkW.js"
	},
	"/assets/channel.reels-FKdKGuJx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"101-C/eLzAFQZoz7j8PmQ4khcqrpy/k\"",
		"mtime": "2026-09-02T08:16:49.315Z",
		"size": 257,
		"path": "../public/assets/channel.reels-FKdKGuJx.js"
	},
	"/assets/channel.subscribers-B6-Lyxla.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"546-2ko54kvrnYOabNP0jV0FKOeLXwE\"",
		"mtime": "2026-09-02T08:16:49.315Z",
		"size": 1350,
		"path": "../public/assets/channel.subscribers-B6-Lyxla.js"
	},
	"/assets/chat-delete-D1OIpqcN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d6-eFTdG6EaRjKg+08h7oJ/wRYNCk0\"",
		"mtime": "2026-09-02T08:16:49.315Z",
		"size": 1238,
		"path": "../public/assets/chat-delete-D1OIpqcN.js"
	},
	"/assets/channel.videos-DcTDxrNZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"103-fya7ya+CCCEn097KENjvSHIqJ20\"",
		"mtime": "2026-09-02T08:16:49.315Z",
		"size": 259,
		"path": "../public/assets/channel.videos-DcTDxrNZ.js"
	},
	"/icon-512.png": {
		"type": "image/png",
		"etag": "\"10033-25w1u01xl/8gQOyAqgrSdkaxdio\"",
		"mtime": "2026-09-02T08:16:52.477Z",
		"size": 65587,
		"path": "../public/icon-512.png"
	},
	"/favicon.png": {
		"type": "image/png",
		"etag": "\"16c7-sHfgQvyMV/xhC2ahSs44WAoIC94\"",
		"mtime": "2026-09-02T08:16:52.477Z",
		"size": 5831,
		"path": "../public/favicon.png"
	},
	"/assets/chevron-left-DCWi8AFo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"82-Nyvjp0DClAKo4jztQSU4y179D+s\"",
		"mtime": "2026-09-02T08:16:49.315Z",
		"size": 130,
		"path": "../public/assets/chevron-left-DCWi8AFo.js"
	},
	"/assets/chat.index-CBILkf9i.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"232e-6KLKzocnu9ul+b0wSPGaDmuhTN4\"",
		"mtime": "2026-09-02T08:16:49.315Z",
		"size": 9006,
		"path": "../public/assets/chat.index-CBILkf9i.js"
	},
	"/assets/copyright-policy-339InrW9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"236d-sxfj3MtGUpaFsN05DJpfg45j3ig\"",
		"mtime": "2026-09-02T08:16:49.316Z",
		"size": 9069,
		"path": "../public/assets/copyright-policy-339InrW9.js"
	},
	"/assets/createLucideIcon-zYGWgMV3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d5-q/IYz1LzVgYGf/TuxC8seyNvMeM\"",
		"mtime": "2026-09-02T08:16:49.316Z",
		"size": 1237,
		"path": "../public/assets/createLucideIcon-zYGWgMV3.js"
	},
	"/assets/createServerFn-D_zFvuKt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1144-wCFwCjN8OQw+qNOUe3UcXiECuck\"",
		"mtime": "2026-09-02T08:16:49.316Z",
		"size": 4420,
		"path": "../public/assets/createServerFn-D_zFvuKt.js"
	},
	"/assets/dialog-CDMAfVIY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7a6-M3L3Q/iMIYMtPV7MXnQDHxQTY5Q\"",
		"mtime": "2026-09-02T08:16:49.317Z",
		"size": 1958,
		"path": "../public/assets/dialog-CDMAfVIY.js"
	},
	"/assets/dist-7DHJbmHc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1cc7-WmlEqZx3QjHh6rMuq/jHoa40r6E\"",
		"mtime": "2026-09-02T08:16:49.317Z",
		"size": 7367,
		"path": "../public/assets/dist-7DHJbmHc.js"
	},
	"/assets/dist-9_rQ_Grk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b66-ac4Zo3/Yjuo/arQBE7AOafHNEQo\"",
		"mtime": "2026-09-02T08:16:49.317Z",
		"size": 2918,
		"path": "../public/assets/dist-9_rQ_Grk.js"
	},
	"/assets/dist-BS4-dGgN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6448-PfVbWvBb+u+F8tEPCCldi5MDcgM\"",
		"mtime": "2026-09-02T08:16:49.317Z",
		"size": 25672,
		"path": "../public/assets/dist-BS4-dGgN.js"
	},
	"/assets/dist-DLQt2BcY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2a9-YZYgEHXuUd8kv7q1LqyYawzzkok\"",
		"mtime": "2026-09-02T08:16:49.317Z",
		"size": 681,
		"path": "../public/assets/dist-DLQt2BcY.js"
	},
	"/assets/dist-DZ_rxpRs.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12ec-O4R+zST1RVT/jeNx/T/Y/HfL/gQ\"",
		"mtime": "2026-09-02T08:16:49.317Z",
		"size": 4844,
		"path": "../public/assets/dist-DZ_rxpRs.js"
	},
	"/assets/dist-Djdv0oiS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1399-ihQxlrv+hH9tV+MdxDN6nQjmzbY\"",
		"mtime": "2026-09-02T08:16:49.317Z",
		"size": 5017,
		"path": "../public/assets/dist-Djdv0oiS.js"
	},
	"/assets/dist-_x8pLa6q.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109b-A2Ze5UOdRv1pnh20SEXWTPC9aA4\"",
		"mtime": "2026-09-02T08:16:49.317Z",
		"size": 4251,
		"path": "../public/assets/dist-_x8pLa6q.js"
	},
	"/assets/dist-rWBzeZjT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"282-Bz1Z4pSIXLoU2e9LuIG/StMMiFw\"",
		"mtime": "2026-09-02T08:16:49.317Z",
		"size": 642,
		"path": "../public/assets/dist-rWBzeZjT.js"
	},
	"/assets/ellipsis-DJa7oDhq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e2-oM+1pCz1H9Iz76NYx8Bi8JeXN7A\"",
		"mtime": "2026-09-02T08:16:49.318Z",
		"size": 226,
		"path": "../public/assets/ellipsis-DJa7oDhq.js"
	},
	"/assets/es2015-D7svfb08.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6190-1f/M4JT8m2eKJA4Rp3rmS/lNCBA\"",
		"mtime": "2026-09-02T08:16:49.318Z",
		"size": 24976,
		"path": "../public/assets/es2015-D7svfb08.js"
	},
	"/assets/eye-DI6Zkgpx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"100-uvX4r8l9otdsHr/G9bhXYGwdLwI\"",
		"mtime": "2026-09-02T08:16:49.318Z",
		"size": 256,
		"path": "../public/assets/eye-DI6Zkgpx.js"
	},
	"/assets/geo-data-CYKNiDfb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6ce-DiXeUwOVv3S5GUs0RTxhIQieJkk\"",
		"mtime": "2026-09-02T08:16:49.318Z",
		"size": 1742,
		"path": "../public/assets/geo-data-CYKNiDfb.js"
	},
	"/assets/html2canvas-DCcDvdvP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"30b50-/NW/tvs1950d+adFAmG+0O5qROc\"",
		"mtime": "2026-09-02T08:16:49.318Z",
		"size": 199504,
		"path": "../public/assets/html2canvas-DCcDvdvP.js"
	},
	"/assets/image-plus-BEyUefMp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16b-jM/otUDosKLzeNczaPUhwq6ohjw\"",
		"mtime": "2026-09-02T08:16:49.319Z",
		"size": 363,
		"path": "../public/assets/image-plus-BEyUefMp.js"
	},
	"/assets/index.es-Du32c6tU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24f8c-TJN0iHNzlmzz2rFx8ZPfrND4Kmc\"",
		"mtime": "2026-09-02T08:16:49.319Z",
		"size": 151436,
		"path": "../public/assets/index.es-Du32c6tU.js"
	},
	"/assets/client-9Nl5eXHU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"33839-l3OjBFXudoawqKm3W2evD7NaWWo\"",
		"mtime": "2026-09-02T08:16:49.315Z",
		"size": 211001,
		"path": "../public/assets/client-9Nl5eXHU.js"
	},
	"/assets/input-CDXEZyBu.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"296-b7cTPl+IDesAcD8AHRlxDTtchus\"",
		"mtime": "2026-09-02T08:16:49.320Z",
		"size": 662,
		"path": "../public/assets/input-CDXEZyBu.js"
	},
	"/assets/invariant-DrlDULPJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ce1-ZRQDfkQPt4jYb9usOOHjNrKdLto\"",
		"mtime": "2026-09-02T08:16:49.320Z",
		"size": 3297,
		"path": "../public/assets/invariant-DrlDULPJ.js"
	},
	"/assets/index-Csn5Fvrf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a4c12-c1Ug42BoWklbfmVOy+g+PfFhIEY\"",
		"mtime": "2026-09-02T08:16:49.303Z",
		"size": 674834,
		"path": "../public/assets/index-Csn5Fvrf.js"
	},
	"/assets/link-DS1dcRyo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3feb-TtYfNRNFNE5e7QSTbP8vYKNJ8SM\"",
		"mtime": "2026-09-02T08:16:49.320Z",
		"size": 16363,
		"path": "../public/assets/link-DS1dcRyo.js"
	},
	"/assets/matchContext-BLaZZjXw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b8-BSjivHXemCqEV+wXXsCe5P0ODLQ\"",
		"mtime": "2026-09-02T08:16:49.320Z",
		"size": 184,
		"path": "../public/assets/matchContext-BLaZZjXw.js"
	},
	"/assets/moment._momentId-BbNPnlMO.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3e5b-LeO9OH1ln80q5kWqHf60vzVUHoc\"",
		"mtime": "2026-09-02T08:16:49.321Z",
		"size": 15963,
		"path": "../public/assets/moment._momentId-BbNPnlMO.js"
	},
	"/assets/moment.index-CIMzoTjw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c22-XZBWLLy/woW8HclEDZgnfks4z08\"",
		"mtime": "2026-09-02T08:16:49.321Z",
		"size": 3106,
		"path": "../public/assets/moment.index-CIMzoTjw.js"
	},
	"/assets/navigation-C8MoOCIK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"94-7DknCKydA7aq83O7EnlD43AHz04\"",
		"mtime": "2026-09-02T08:16:49.321Z",
		"size": 148,
		"path": "../public/assets/navigation-C8MoOCIK.js"
	},
	"/assets/not-found-DIgawKw1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"37-RTB6YH5iXRKeXz1Sn6ZQ+vS0lnc\"",
		"mtime": "2026-09-02T08:16:49.321Z",
		"size": 55,
		"path": "../public/assets/not-found-DIgawKw1.js"
	},
	"/assets/notifications-BiYwLtuM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"17e6-dYxRKGBtXbjMkdzeTC01AcJCwgA\"",
		"mtime": "2026-09-02T08:16:49.321Z",
		"size": 6118,
		"path": "../public/assets/notifications-BiYwLtuM.js"
	},
	"/assets/orbit-match-90vyJmU9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a94-he50r0/aAlw1W4Eh17w+HmWiJDE\"",
		"mtime": "2026-09-02T08:16:49.321Z",
		"size": 2708,
		"path": "../public/assets/orbit-match-90vyJmU9.js"
	},
	"/assets/orbit-BdNDAP_M.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f5-N44TC4ckoKnwVU8PVWxD76Tg1Sk\"",
		"mtime": "2026-09-02T08:16:49.321Z",
		"size": 2293,
		"path": "../public/assets/orbit-BdNDAP_M.js"
	},
	"/assets/orbit-mood-D1SQ3wAI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4f8-0OOOjx3oF76Cb8sSgFsOxSYcYUs\"",
		"mtime": "2026-09-02T08:16:49.321Z",
		"size": 1272,
		"path": "../public/assets/orbit-mood-D1SQ3wAI.js"
	},
	"/assets/orbit._profileId-4uutvAii.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2837-X+ZoSK4yMnIZ4B0x3zH2HLY1ZEU\"",
		"mtime": "2026-09-02T08:16:49.322Z",
		"size": 10295,
		"path": "../public/assets/orbit._profileId-4uutvAii.js"
	},
	"/assets/orbit-store-BAd48NHD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3b4b-rOUIMkARag3FS3RB/+j8oUQrWBo\"",
		"mtime": "2026-09-02T08:16:49.321Z",
		"size": 15179,
		"path": "../public/assets/orbit-store-BAd48NHD.js"
	},
	"/assets/orbit.create-OgrbiPGt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"849e-f7hnej19L+6Pgcau19Yv7fjw+cQ\"",
		"mtime": "2026-09-02T08:16:49.322Z",
		"size": 33950,
		"path": "../public/assets/orbit.create-OgrbiPGt.js"
	},
	"/assets/orbit.index-DgNHgr6p.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"72f5-aCSAWNK7w+g3r9fuzkbTjeh2HSo\"",
		"mtime": "2026-09-02T08:16:49.322Z",
		"size": 29429,
		"path": "../public/assets/orbit.index-DgNHgr6p.js"
	},
	"/assets/orbit.me-BdF3NsDx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1929-iHzW1PScnGLYDFq7+r6j2qEJ7t4\"",
		"mtime": "2026-09-02T08:16:49.323Z",
		"size": 6441,
		"path": "../public/assets/orbit.me-BdF3NsDx.js"
	},
	"/assets/orbit.messages-CqediIqk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"337f-r8lP9Pw8BGhDyih99+XxUL5Yd0E\"",
		"mtime": "2026-09-02T08:16:49.323Z",
		"size": 13183,
		"path": "../public/assets/orbit.messages-CqediIqk.js"
	},
	"/assets/orbit.notifications-B9PkKZcA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cd9-UxFNq4DPEiWHrJLbRNJt4OPqumM\"",
		"mtime": "2026-09-02T08:16:49.323Z",
		"size": 3289,
		"path": "../public/assets/orbit.notifications-B9PkKZcA.js"
	},
	"/assets/orbit.privacy-D_MoZ6bQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3b97-jicGc+kczb1+RgimVN1PG49+Y8k\"",
		"mtime": "2026-09-02T08:16:49.323Z",
		"size": 15255,
		"path": "../public/assets/orbit.privacy-D_MoZ6bQ.js"
	},
	"/assets/pin-BeE_zRtQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"31a-l5uaPsRPR+8pJDClvFJdvEKdlT4\"",
		"mtime": "2026-09-02T08:16:49.323Z",
		"size": 794,
		"path": "../public/assets/pin-BeE_zRtQ.js"
	},
	"/assets/orbit.chat._userId-Cddrf_49.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9a91-n9+ywAmPdzuKf09RGXBUuMe2WkA\"",
		"mtime": "2026-09-02T08:16:49.322Z",
		"size": 39569,
		"path": "../public/assets/orbit.chat._userId-Cddrf_49.js"
	},
	"/assets/post-1-DzPUIwl-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a3-/lHontMBav2cWjMxgEOVmCwkchs\"",
		"mtime": "2026-09-02T08:16:49.323Z",
		"size": 163,
		"path": "../public/assets/post-1-DzPUIwl-.js"
	},
	"/assets/post-1-uxYyj4Yn.jpg": {
		"type": "image/jpeg",
		"etag": "\"2621b-tADwOglKGR4PvLgzJyB6lOA0+b8\"",
		"mtime": "2026-09-02T08:16:49.344Z",
		"size": 156187,
		"path": "../public/assets/post-1-uxYyj4Yn.jpg"
	},
	"/assets/post.create-C1cFbjPV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15b5-CLeSoG9seAwUXraWLvk3WTBllgE\"",
		"mtime": "2026-09-02T08:16:49.324Z",
		"size": 5557,
		"path": "../public/assets/post.create-C1cFbjPV.js"
	},
	"/assets/privacy-X5koqbAI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c79-ygD+N5um3ZBb7t9Z4hOjDsT9W9Q\"",
		"mtime": "2026-09-02T08:16:49.324Z",
		"size": 3193,
		"path": "../public/assets/privacy-X5koqbAI.js"
	},
	"/assets/profile-CbEtxP1A.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7cf2-hA/qbYxkRUL2Atl8kILE53vdPMM\"",
		"mtime": "2026-09-02T08:16:49.324Z",
		"size": 31986,
		"path": "../public/assets/profile-CbEtxP1A.js"
	},
	"/assets/profiles-map-D921igmT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"32a-/aUGZBIt88bZk4hLkdLwlBFMI5U\"",
		"mtime": "2026-09-02T08:16:49.324Z",
		"size": 810,
		"path": "../public/assets/profiles-map-D921igmT.js"
	},
	"/assets/purify.es-ChwZkWde.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"68bc-bPPRDEosU/Lqj+2Oyi1ue22LViM\"",
		"mtime": "2026-09-02T08:16:49.324Z",
		"size": 26812,
		"path": "../public/assets/purify.es-ChwZkWde.js"
	},
	"/assets/react-dom-BS6Gh_TR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e08-9bSgZZ4q4Ni+kAtZEKfL9G1hHrE\"",
		"mtime": "2026-09-02T08:16:49.324Z",
		"size": 3592,
		"path": "../public/assets/react-dom-BS6Gh_TR.js"
	},
	"/assets/redirect-DtIAAt0y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e1-KhpEIx1LNSnb7dNYxiNI58wV9MY\"",
		"mtime": "2026-09-02T08:16:49.328Z",
		"size": 481,
		"path": "../public/assets/redirect-DtIAAt0y.js"
	},
	"/assets/reel-2-D6ICrDT7.jpg": {
		"type": "image/jpeg",
		"etag": "\"1d3c4-QU1Rig2/vTeF6slkXtMXSVa68U0\"",
		"mtime": "2026-09-02T08:16:49.345Z",
		"size": 119748,
		"path": "../public/assets/reel-2-D6ICrDT7.jpg"
	},
	"/assets/reel-3-BYUKUHRv.jpg": {
		"type": "image/jpeg",
		"etag": "\"8bae-hivl0InXk3Rn4aAy5LSO54t+UZE\"",
		"mtime": "2026-09-02T08:16:49.349Z",
		"size": 35758,
		"path": "../public/assets/reel-3-BYUKUHRv.jpg"
	},
	"/assets/reels-C4LU4eFW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2fea-8n6u5CsFqisn6Or1ako+lVwWBqo\"",
		"mtime": "2026-09-02T08:16:49.328Z",
		"size": 12266,
		"path": "../public/assets/reels-C4LU4eFW.js"
	},
	"/assets/reset-password-C8k6NamB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"52a-Uu2soeS2Gd3kHymzjw5IEDDur70\"",
		"mtime": "2026-09-02T08:16:49.328Z",
		"size": 1322,
		"path": "../public/assets/reset-password-C8k6NamB.js"
	},
	"/assets/reel-1-DgXdxb9U.jpg": {
		"type": "image/jpeg",
		"etag": "\"158de-632G9IqzPFNj16hyS2vSq2z3WoA\"",
		"mtime": "2026-09-02T08:16:49.345Z",
		"size": 88286,
		"path": "../public/assets/reel-1-DgXdxb9U.jpg"
	},
	"/assets/rolldown-runtime-hePW80VL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2cc-fA8td6k29UVF6JoPfhOPkceTK1M\"",
		"mtime": "2026-09-02T08:16:49.328Z",
		"size": 716,
		"path": "../public/assets/rolldown-runtime-hePW80VL.js"
	},
	"/assets/root-DLTE-HSj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20-vSYConOtSP6ciwr9zKsPixNwWmc\"",
		"mtime": "2026-09-02T08:16:49.328Z",
		"size": 32,
		"path": "../public/assets/root-DLTE-HSj.js"
	},
	"/assets/route-BUNIGLQr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8c-/Zmg6YCyJbYsr22EbE+4Eng3Q8o\"",
		"mtime": "2026-09-02T08:16:49.328Z",
		"size": 140,
		"path": "../public/assets/route-BUNIGLQr.js"
	},
	"/assets/routes-DktYT2dA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"85d9-kyXbcGzX0u7ytg93Na2QkfIUDhM\"",
		"mtime": "2026-09-02T08:16:49.329Z",
		"size": 34265,
		"path": "../public/assets/routes-DktYT2dA.js"
	},
	"/assets/scan-face-CM2bv4DP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a5-2sX7qfOwFGs4b0QZiHDo+LUoaas\"",
		"mtime": "2026-09-02T08:16:49.329Z",
		"size": 421,
		"path": "../public/assets/scan-face-CM2bv4DP.js"
	},
	"/assets/settings-2-x6U2komm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fc-airYhkVLobsDhkRjcuibMjh1Kz4\"",
		"mtime": "2026-09-02T08:16:49.329Z",
		"size": 252,
		"path": "../public/assets/settings-2-x6U2komm.js"
	},
	"/assets/settings-63gKAQz_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e7-H6UEAhV97AbbPJvTM0mgapeyVN4\"",
		"mtime": "2026-09-02T08:16:49.329Z",
		"size": 487,
		"path": "../public/assets/settings-63gKAQz_.js"
	},
	"/assets/shield-TvVcHHSx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"190-IQZ0HXDtipzveT7dmmgPX6/2kng\"",
		"mtime": "2026-09-02T08:16:49.329Z",
		"size": 400,
		"path": "../public/assets/shield-TvVcHHSx.js"
	},
	"/assets/shield-check-DbLP09Mr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"140-kO2Skvjk1wqz1iVSYj10tG7kAAg\"",
		"mtime": "2026-09-02T08:16:49.329Z",
		"size": 320,
		"path": "../public/assets/shield-check-DbLP09Mr.js"
	},
	"/assets/sheet-D5wsSFUJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8a3-i/2Pnk3n/8LpLVDC58HxInBfmiQ\"",
		"mtime": "2026-09-02T08:16:49.329Z",
		"size": 2211,
		"path": "../public/assets/sheet-D5wsSFUJ.js"
	},
	"/assets/search-CT80Vq9D.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"268e-DoA5dqlzxonQM+4hQFQHNjCHn5M\"",
		"mtime": "2026-09-02T08:16:49.329Z",
		"size": 9870,
		"path": "../public/assets/search-CT80Vq9D.js"
	},
	"/assets/square-nG_BaMNK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"93-N5UoPnJn75SEYhz/11HKB4AH68Y\"",
		"mtime": "2026-09-02T08:16:49.332Z",
		"size": 147,
		"path": "../public/assets/square-nG_BaMNK.js"
	},
	"/assets/styles-SOaQudxi.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"33bb8-8hfdq4K0UWqYsOmM751Nz8YfcW4\"",
		"mtime": "2026-09-02T08:16:49.349Z",
		"size": 211896,
		"path": "../public/assets/styles-SOaQudxi.css"
	},
	"/assets/switch-DH4CTnIo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1109-dm5xe5QZwdWdeit1kmtFTt+vAAs\"",
		"mtime": "2026-09-02T08:16:49.332Z",
		"size": 4361,
		"path": "../public/assets/switch-DH4CTnIo.js"
	},
	"/assets/terms-B7yfNoNz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"df8-/Ws8e0bOzr9EcrO2UReWI8jazI8\"",
		"mtime": "2026-09-02T08:16:49.332Z",
		"size": 3576,
		"path": "../public/assets/terms-B7yfNoNz.js"
	},
	"/assets/textarea-C4aSTZbh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"230-geM1O8jsB1VfAdxY23b5pMrLQo8\"",
		"mtime": "2026-09-02T08:16:49.332Z",
		"size": 560,
		"path": "../public/assets/textarea-C4aSTZbh.js"
	},
	"/assets/trending-up-T-j540VG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"af-VufyDUdJnT8AG3XdA1pKr1QLzBo\"",
		"mtime": "2026-09-02T08:16:49.332Z",
		"size": 175,
		"path": "../public/assets/trending-up-T-j540VG.js"
	},
	"/assets/triangle-alert-B2hpeTrU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109-hAh5bu7wpC/dyrDkPv2HRWFdK0E\"",
		"mtime": "2026-09-02T08:16:49.332Z",
		"size": 265,
		"path": "../public/assets/triangle-alert-B2hpeTrU.js"
	},
	"/assets/u._userId-IMEVkl7g.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16b1-BNqUNY5g//mI5wEUa35yBIsjtCo\"",
		"mtime": "2026-09-02T08:16:49.332Z",
		"size": 5809,
		"path": "../public/assets/u._userId-IMEVkl7g.js"
	},
	"/assets/useMatch-CG_Qo4VA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"26c-mf+6Kl2KU/dZTKCvH3wHxYMjLA8\"",
		"mtime": "2026-09-02T08:16:49.332Z",
		"size": 620,
		"path": "../public/assets/useMatch-CG_Qo4VA.js"
	},
	"/assets/useRouter-BP8vT1kh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f38-UAwyZ71XUq5pvhwLvcQ+ekWdEeM\"",
		"mtime": "2026-09-02T08:16:49.332Z",
		"size": 7992,
		"path": "../public/assets/useRouter-BP8vT1kh.js"
	},
	"/assets/useServerFn-CzzciFve.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19d-Q2chUu1zNyiLPgJ8BU4VVAVaG7A\"",
		"mtime": "2026-09-02T08:16:49.332Z",
		"size": 413,
		"path": "../public/assets/useServerFn-CzzciFve.js"
	},
	"/assets/useStore-Bwiy6pX7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"786-iVUaSoWn1x0ZE/FkYImHA2AwxQw\"",
		"mtime": "2026-09-02T08:16:49.333Z",
		"size": 1926,
		"path": "../public/assets/useStore-Bwiy6pX7.js"
	},
	"/assets/video-data-BMbIpjpC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a5d-s1LyVcmOqsS/lwdF9wA2/F9kfXw\"",
		"mtime": "2026-09-02T08:16:49.333Z",
		"size": 6749,
		"path": "../public/assets/video-data-BMbIpjpC.js"
	},
	"/assets/video._videoId-CE8Ct8rV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2666-jTsYjNg882j58JA5FhpeNkmG994\"",
		"mtime": "2026-09-02T08:16:49.333Z",
		"size": 9830,
		"path": "../public/assets/video._videoId-CE8Ct8rV.js"
	},
	"/assets/video.upload-jD3xhlOK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"264e-VRlbSB/cI3+rdANTBfjGIuClrTE\"",
		"mtime": "2026-09-02T08:16:49.333Z",
		"size": 9806,
		"path": "../public/assets/video.upload-jD3xhlOK.js"
	},
	"/assets/wallet-CmSzfeyj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"650c4-YP67XL89rJVZk8nRjNB/x17EGUE\"",
		"mtime": "2026-09-02T08:16:49.333Z",
		"size": 413892,
		"path": "../public/assets/wallet-CmSzfeyj.js"
	},
	"/assets/yw-download-DwNrhE_c.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"511-/EgO3q0AkwboSGQj5DEH2DCwOEE\"",
		"mtime": "2026-09-02T08:16:49.339Z",
		"size": 1297,
		"path": "../public/assets/yw-download-DwNrhE_c.js"
	},
	"/assets/yw-logo-BXjnypdM.png": {
		"type": "image/png",
		"etag": "\"b8bf9-XKz0DAyp9GBS6zs069mBfmp0ubE\"",
		"mtime": "2026-09-02T08:16:49.350Z",
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
