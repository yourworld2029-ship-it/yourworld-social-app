import { t as TSS_SERVER_FUNCTION } from "./server-Cwru0WHj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/createServerRpc-Ca1Xn4FB.js
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
