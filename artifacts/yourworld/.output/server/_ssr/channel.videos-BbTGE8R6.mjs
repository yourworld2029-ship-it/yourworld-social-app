import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as useChannelData } from "./channel-data-CvBroJRi.mjs";
import { t as ChannelContentList } from "./ChannelContentList-Cnb3aniP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/channel.videos-BbTGE8R6.js
var import_jsx_runtime = require_jsx_runtime();
function ChannelVideos() {
	const { videos } = useChannelData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChannelContentList, {
		title: "Videos",
		items: videos,
		emptyLabel: "No videos published yet."
	});
}
//#endregion
export { ChannelVideos as component };
