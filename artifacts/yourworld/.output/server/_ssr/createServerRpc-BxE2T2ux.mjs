import { t as TSS_SERVER_FUNCTION } from "./server-CN0eDbRn.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/createServerRpc-BxE2T2ux.js
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
