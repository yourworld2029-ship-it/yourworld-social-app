import { t as __commonJSMin } from "../_runtime.mjs";
//#region ../../node_modules/.pnpm/requires-port@1.0.0/node_modules/requires-port/index.js
var require_requires_port = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Check if we're required to add a port number.
	*
	* @see https://url.spec.whatwg.org/#default-port
	* @param {Number|String} port Port number we need to check
	* @param {String} protocol Protocol we need to check against.
	* @returns {Boolean} Is it a default port for the given protocol
	* @api private
	*/
	module.exports = function required(port, protocol) {
		protocol = protocol.split(":")[0];
		port = +port;
		if (!port) return false;
		switch (protocol) {
			case "http":
			case "ws": return port !== 80;
			case "https":
			case "wss": return port !== 443;
			case "ftp": return port !== 21;
			case "gopher": return port !== 70;
			case "file": return false;
		}
		return port !== 0;
	};
}));
//#endregion
export { require_requires_port as t };
