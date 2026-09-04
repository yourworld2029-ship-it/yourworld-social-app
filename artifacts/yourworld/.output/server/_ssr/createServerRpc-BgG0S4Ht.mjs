import { t as TSS_SERVER_FUNCTION } from "./server-B2i4qk2H.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/createServerRpc-BgG0S4Ht.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
//#endregion
export { createServerRpc as t };
