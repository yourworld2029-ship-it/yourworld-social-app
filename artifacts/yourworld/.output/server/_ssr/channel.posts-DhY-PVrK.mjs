import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as useChannelData } from "./channel-data-QId9yJJk.mjs";
import { t as ChannelContentList } from "./ChannelContentList-CfHzWVpK.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/channel.posts-DhY-PVrK.js
var import_jsx_runtime = require_jsx_runtime();
function ChannelPosts() {
	const { posts } = useChannelData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChannelContentList, {
		title: "Posts",
		items: posts,
		emptyLabel: "No posts published yet."
	});
}
//#endregion
export { ChannelPosts as component };
