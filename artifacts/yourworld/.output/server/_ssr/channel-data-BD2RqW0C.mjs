import { p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { bn as ChevronLeft } from "../_libs/lucide-react.mjs";
import { at as reel_3_default, it as reel_2_default, nt as post_1_default, rt as reel_1_default } from "./router-CH6ZC-D2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/channel-data-BD2RqW0C.js
var import_jsx_runtime = require_jsx_runtime();
function ChannelHeader({ title, backTo = "/channel", action }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "sticky top-0 z-40 flex items-center gap-2 border-b border-border glass px-3 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: backTo,
				"aria-label": "Go back",
				className: "grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
					className: "h-5 w-5",
					strokeWidth: 1.8
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "min-w-0 flex-1 truncate font-display text-lg font-bold",
				children: title
			}),
			action
		]
	});
}
function StatTile({ label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "surface-card rounded-3xl p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pt-1 font-display text-xl font-bold",
				children: value
			}),
			hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pt-0.5 text-[11px] text-muted-foreground",
				children: hint
			})
		]
	});
}
var channelVideos = [
	{
		id: "v1",
		title: "Night city in 4K — full walk",
		thumb: reel_1_default,
		views: 128400,
		likes: 9120,
		publishedAt: "2 days ago"
	},
	{
		id: "v2",
		title: "Studio session, one take",
		thumb: reel_3_default,
		views: 64230,
		likes: 4310,
		publishedAt: "1 week ago"
	},
	{
		id: "v3",
		title: "Coast to coast in 12 hours",
		thumb: reel_2_default,
		views: 41890,
		likes: 3020,
		publishedAt: "3 weeks ago"
	}
];
var channelReels = [
	{
		id: "r1",
		title: "Neon alley loop",
		thumb: reel_2_default,
		views: 302100,
		likes: 21400,
		publishedAt: "1 day ago"
	},
	{
		id: "r2",
		title: "Sunrise surf",
		thumb: reel_1_default,
		views: 188900,
		likes: 12800,
		publishedAt: "4 days ago"
	},
	{
		id: "r3",
		title: "Golden hour spin",
		thumb: reel_3_default,
		views: 96540,
		likes: 7010,
		publishedAt: "2 weeks ago"
	}
];
var channelPosts = [{
	id: "p1",
	title: "Behind the scenes of last night's shoot",
	thumb: post_1_default,
	views: 24100,
	likes: 1880,
	publishedAt: "5 hours ago"
}, {
	id: "p2",
	title: "Gear list everyone keeps asking for",
	thumb: reel_1_default,
	views: 18400,
	likes: 1240,
	publishedAt: "6 days ago"
}];
var channelSubscribers = [
	{
		id: "s1",
		name: "Riko Tan",
		handle: "riko.night",
		since: "Today",
		hue: 300
	},
	{
		id: "s2",
		name: "Mara Vega",
		handle: "sea.salt",
		since: "Yesterday",
		hue: 190
	},
	{
		id: "s3",
		name: "Ada Kim",
		handle: "spinsolo",
		since: "3 days ago",
		hue: 40
	},
	{
		id: "s4",
		name: "Noah Ferre",
		handle: "slowbrunch",
		since: "1 week ago",
		hue: 15
	},
	{
		id: "s5",
		name: "Kai Oduya",
		handle: "wavelen",
		since: "2 weeks ago",
		hue: 250
	},
	{
		id: "s6",
		name: "Ines Roth",
		handle: "moss.club",
		since: "1 month ago",
		hue: 150
	}
];
var channelStats = {
	subscribers: 12840,
	views30d: 486320,
	watchHours: 3120,
	posts: channelPosts.length + channelVideos.length + channelReels.length
};
/** Views for the last 14 days — used by the lightweight sparkline chart. */
var viewsSeries = [
	18,
	22,
	19,
	31,
	28,
	35,
	41,
	38,
	47,
	52,
	49,
	61,
	58,
	72
];
var MONETIZATION = {
	minSubscribers: 1e3,
	minWatchHours: 4e3
};
var formatCount = (n) => n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K` : `${n}`;
//#endregion
export { channelReels as a, channelVideos as c, channelPosts as i, formatCount as l, MONETIZATION as n, channelStats as o, StatTile as r, channelSubscribers as s, ChannelHeader as t, viewsSeries as u };
