import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { vn as ChevronLeft } from "../_libs/lucide-react.mjs";
import { D as timeAgo, K as missingColumn, ht as postKind, q as normalizePostRow, w as resolveMediaUrl } from "./router-DICQhfH7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/channel-data-BhUDo0kG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
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
var emptyData = {
	videos: [],
	reels: [],
	posts: [],
	subscribers: [],
	stats: {
		subscribers: 0,
		views30d: 0,
		watchHours: 0,
		posts: 0
	},
	watchTimeError: null,
	loading: true
};
function hueOf(id) {
	let hue = 0;
	for (let i = 0; i < id.length; i += 1) hue = (hue * 31 + id.charCodeAt(i)) % 360;
	return hue;
}
/** Loads the signed-in creator's channel data directly from Supabase. */
async function loadChannelData(uid, client = supabase, watchPeriodDays = 30) {
	const periodStart = (/* @__PURE__ */ new Date(Date.now() - watchPeriodDays * 24 * 60 * 60 * 1e3)).toISOString();
	const [postsResult, followsResult, countsResult, watchResult] = await Promise.all([
		client.from("posts").select("id,kind,title,caption,media_url,thumbnail_url,views,created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(200),
		client.rpc("list_follows", {
			_user_id: uid,
			_kind: "followers",
			_limit: 500
		}),
		client.rpc("get_follow_counts", { ids: [uid] }),
		client.rpc("get_channel_watch_hours", {
			_channel_id: uid,
			_period_start: periodStart
		})
	]);
	let { data: rows, error } = postsResult;
	const { data: followRows } = followsResult;
	const { data: countRows } = countsResult;
	const { data: watchHours, error: watchError } = watchResult;
	if (missingColumn(error) === "kind") {
		const fallback = await client.from("posts").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(200);
		rows = fallback.data?.map(normalizePostRow) ?? null;
		error = fallback.error;
	}
	if (error) return {
		videos: [],
		reels: [],
		posts: [],
		subscribers: [],
		stats: {
			subscribers: 0,
			views30d: 0,
			watchHours: 0,
			posts: 0
		},
		watchTimeError: null
	};
	const postRows = rows ?? [];
	const postIds = postRows.map((row) => row.id);
	const { data: likes } = postIds.length ? await client.from("post_likes").select("post_id").in("post_id", postIds) : { data: [] };
	const likesByPost = /* @__PURE__ */ new Map();
	for (const like of likes ?? []) likesByPost.set(like.post_id, (likesByPost.get(like.post_id) ?? 0) + 1);
	const items = await Promise.all(postRows.map(async (row) => ({
		id: row.id,
		title: row.title || row.caption || "Untitled",
		thumb: await resolveMediaUrl(row.thumbnail_url || row.media_url, postKind(row) === "reel" ? "reels" : "videos"),
		views: Number(row.views ?? 0),
		likes: likesByPost.get(row.id) ?? 0,
		publishedAt: timeAgo(row.created_at)
	})));
	const followerIds = (followRows ?? []).map((row) => row.id).filter(Boolean);
	const { data: profiles } = followerIds.length ? await client.rpc("get_public_profiles", { ids: followerIds }) : { data: [] };
	const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
	const subscribers = followerIds.flatMap((id) => {
		const profile = profileById.get(id);
		if (!profile) return [];
		return [{
			id,
			name: profile.display_name || profile.username || "YourWorld user",
			handle: profile.username || "user",
			since: "Subscriber",
			hue: hueOf(id)
		}];
	});
	const videos = items.filter((_, index) => postRows[index]?.kind === "video");
	const reels = items.filter((_, index) => postRows[index]?.kind === "reel");
	const posts = items.filter((_, index) => postRows[index]?.kind === "post");
	const subscribersCount = Number((countRows ?? [])[0]?.followers ?? subscribers.length);
	const parsedWatchHours = typeof watchHours === "number" ? watchHours : Number(watchHours?.watch_hours ?? 0);
	return {
		videos,
		reels,
		posts,
		subscribers,
		stats: {
			subscribers: subscribersCount,
			views30d: postRows.reduce((sum, row) => sum + Number(row.views ?? 0), 0),
			watchHours: Number.isFinite(parsedWatchHours) ? Math.max(0, parsedWatchHours) : 0,
			posts: postRows.length
		},
		watchTimeError: watchError?.message ?? null
	};
}
function useChannelData(watchPeriodDays = 30) {
	const [data, setData] = (0, import_react.useState)(emptyData);
	const requestIdRef = (0, import_react.useRef)(0);
	const load = (0, import_react.useCallback)(async () => {
		const requestId = ++requestIdRef.current;
		setData((current) => ({
			...current,
			loading: true,
			watchTimeError: null
		}));
		const { data: session } = await supabase.auth.getSession();
		const uid = session.session?.user.id;
		if (requestId !== requestIdRef.current) return;
		if (!uid) {
			setData({
				...emptyData,
				loading: false
			});
			return;
		}
		const next = await loadChannelData(uid, supabase, watchPeriodDays);
		if (requestId !== requestIdRef.current) return;
		setData({
			...next,
			loading: false
		});
	}, [watchPeriodDays]);
	(0, import_react.useEffect)(() => {
		load();
		const channel = supabase.channel("channel-live-data").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "posts"
		}, () => void load()).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "post_likes"
		}, () => void load()).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "follows"
		}, () => void load()).subscribe();
		const { data: auth } = supabase.auth.onAuthStateChange(() => void load());
		return () => {
			supabase.removeChannel(channel);
			auth.subscription.unsubscribe();
		};
	}, [load]);
	return data;
}
var MONETIZATION = {
	minSubscribers: 1e3,
	minWatchHours: 4e3
};
var formatCount = (n) => n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K` : `${n}`;
//#endregion
export { useChannelData as a, formatCount as i, MONETIZATION as n, StatTile as r, ChannelHeader as t };
