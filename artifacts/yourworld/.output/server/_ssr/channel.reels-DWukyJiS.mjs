import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as useChannelData } from "./channel-data-E7DOouGO.mjs";
import { t as ChannelContentList } from "./ChannelContentList-C6OtO07k.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/channel.reels-DWukyJiS.js
var import_jsx_runtime = require_jsx_runtime();
function ChannelReels() {
	const { reels } = useChannelData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChannelContentList, {
		title: "Reels",
		items: reels,
		emptyLabel: "No reels published yet."
	});
}
//#endregion
export { ChannelReels as component };
