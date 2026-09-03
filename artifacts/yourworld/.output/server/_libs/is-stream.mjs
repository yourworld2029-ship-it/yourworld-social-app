import { t as __commonJSMin } from "../_runtime.mjs";
//#region ../../node_modules/.pnpm/is-stream@2.0.1/node_modules/is-stream/index.js
var require_is_stream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isStream = (stream) => stream !== null && typeof stream === "object" && typeof stream.pipe === "function";
	isStream.writable = (stream) => isStream(stream) && stream.writable !== false && typeof stream._write === "function" && typeof stream._writableState === "object";
	isStream.readable = (stream) => isStream(stream) && stream.readable !== false && typeof stream._read === "function" && typeof stream._readableState === "object";
	isStream.duplex = (stream) => isStream.writable(stream) && isStream.readable(stream);
	isStream.transform = (stream) => isStream.duplex(stream) && typeof stream._transform === "function";
	module.exports = isStream;
}));
//#endregion
export { require_is_stream as t };
