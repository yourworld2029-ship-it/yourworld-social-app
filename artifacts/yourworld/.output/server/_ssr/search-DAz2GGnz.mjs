import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { E as Tag, Ft as Hash, G as Search, Vt as Eye, et as Play, f as Users, fn as Check, g as UserPlus, i as X, l as Video, ln as ChevronRight, x as TrendingUp, zt as Film } from "../_libs/lucide-react.mjs";
import { ct as useYw, mt as cn, p as useSearch, x as resolveMediaUrl } from "./router-CdQ9trai.mjs";
import { n as formatDuration, r as formatViews } from "./video-data-C7W0ELL4.mjs";
import { t as VideoPoster } from "./VideoPoster-BOP-XmUu.mjs";
import { t as ProfileAvatar } from "./ProfileAvatar-D70Oc6MY.mjs";
import { t as formatCount } from "./yw-data-CyapVFm6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/search-DAz2GGnz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function hueOf(id) {
	return id.split("").reduce((h, char) => (h * 31 + char.charCodeAt(0)) % 360, 0);
}
/**
* Escapes a value embedded in PostgREST's `or` filter grammar while retaining
* the outer `%` wildcards used for the ILIKE match.
*/
function escapeILikePattern(value) {
	return value.replace(/[\\%_.,():"']/g, "\\$&");
}
function toSearchUsers(profiles, followersById = /* @__PURE__ */ new Map()) {
	return profiles.map((profile) => {
		const followerCount = followersById.get(profile.id);
		return {
			id: profile.id,
			username: profile.username?.trim() ?? "",
			name: profile.full_name?.trim() || profile.display_name?.trim() || profile.username?.trim() || "",
			category: profile.category || void 0,
			verified: Boolean(profile.is_verified),
			hue: hueOf(profile.id),
			avatar_url: profile.avatar_url ?? null,
			...followerCount === void 0 ? {} : { followerCount }
		};
	});
}
async function resolveSearchAvatars(users) {
	return Promise.all(users.map(async (user) => {
		if (!user.avatar_url) return user;
		return {
			...user,
			avatar_url: await resolveMediaUrl(user.avatar_url, "avatars")
		};
	}));
}
function orbitPhotoUrl(photos) {
	if (!Array.isArray(photos)) return "";
	const photo = photos.find((item) => typeof item === "object" && item !== null && "url" in item);
	return typeof photo?.url === "string" && !/^(blob|data):/.test(photo.url) ? photo.url : "";
}
function toOrbitSearchUsers(rows) {
	return rows.map((row) => {
		const name = row.name?.trim() || "Orbit user";
		return {
			id: row.user_id,
			username: name.toLowerCase().replace(/\s+/g, "."),
			name,
			category: "Orbit",
			hue: hueOf(row.user_id),
			bio: row.about?.trim() || void 0,
			location: [
				row.city,
				row.state,
				row.country
			].filter(Boolean).join(", "),
			avatar_url: orbitPhotoUrl(row.photos)
		};
	});
}
async function searchOrbitProfiles(term, client) {
	const pattern = escapeILikePattern(term);
	const { data, error } = await client.from("orbit_profiles").select("user_id,name,city,state,country,about,hobbies,looking_for,gender,photos").or([
		`name.ilike.%${pattern}%`,
		`city.ilike.%${pattern}%`,
		`state.ilike.%${pattern}%`,
		`country.ilike.%${pattern}%`,
		`about.ilike.%${pattern}%`,
		`looking_for.ilike.%${pattern}%`,
		`gender.ilike.%${pattern}%`,
		`mood.ilike.%${pattern}%`
	].join(",")).eq("orbit_enabled", true).eq("visible", true).limit(50);
	if (error) {
		console.warn("[search] Orbit profile search unavailable", error.message);
		return [];
	}
	return toOrbitSearchUsers(data ?? []);
}
async function loadFollowerCounts(ids, client) {
	if (!ids.length) return /* @__PURE__ */ new Map();
	const { data, error } = await client.rpc("get_follow_counts", { ids });
	if (error) return /* @__PURE__ */ new Map();
	return new Map((data ?? []).map((row) => [row.user_id, Number(row.followers)]));
}
/** Searches public profiles directly, using the same RLS rules as the profile table. */
async function searchPublicProfiles(search, client = supabase) {
	const searchTerm = search.trim().replace(/^[@#]+/, "");
	if (!searchTerm) return [];
	const pattern = escapeILikePattern(searchTerm);
	const [{ data, error }, orbitUsers] = await Promise.all([client.from("profiles").select("*").or([
		`username.ilike.%${pattern}%`,
		`display_name.ilike.%${pattern}%`,
		`full_name.ilike.%${pattern}%`
	].join(",")).order("updated_at", { ascending: false }).limit(50), searchOrbitProfiles(searchTerm, client)]);
	if (error) throw error;
	const profiles = data ?? [];
	const standardUsers = await resolveSearchAvatars(toSearchUsers(profiles, await loadFollowerCounts(profiles.map((profile) => profile.id), client)));
	const merged = new Map(standardUsers.map((user) => [user.id, user]));
	for (const orbitUser of orbitUsers) {
		const existing = merged.get(orbitUser.id);
		merged.set(orbitUser.id, existing ? {
			...orbitUser,
			...existing
		} : orbitUser);
	}
	return resolveSearchAvatars([...merged.values()].slice(0, 50));
}
function textValue(value) {
	return typeof value === "string" ? value.trim() : "";
}
function tagsValue(value) {
	return Array.isArray(value) ? value.map((tag) => String(tag).trim().replace(/^#/, "").toLowerCase()).filter(Boolean) : [];
}
function toSearchVideos(rows, profiles) {
	const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
	return rows.flatMap((row) => {
		const id = textValue(row.id);
		const userId = textValue(row.user_id);
		const mediaUrl = textValue(row.media_url);
		if (!id || !userId || !mediaUrl) return [];
		const kind = textValue(row.kind || row.type).toLowerCase();
		const isReel = kind === "reel" || row.is_reel === true;
		if (!(isReel || kind === "video" || kind === "long_video")) return [];
		const profile = profileById.get(userId);
		const username = profile?.username?.trim() || `user${userId.slice(0, 4)}`;
		const name = profile?.display_name?.trim() || profile?.full_name?.trim() || username;
		const caption = textValue(row.caption);
		return [{
			id,
			userId,
			kind: isReel ? "reel" : "video",
			title: textValue(row.title) || caption || "Untitled video",
			description: textValue(row.description) || textValue(row.content) || caption,
			caption,
			mediaUrl,
			thumbnailUrl: textValue(row.thumbnail_url) || null,
			views: Number(row.views ?? row.views_count ?? 0) || 0,
			durationSeconds: typeof row.duration_seconds === "number" ? row.duration_seconds : Number.isFinite(Number(row.duration_seconds)) ? Number(row.duration_seconds) : null,
			hashtags: tagsValue(row.hashtags),
			createdAt: textValue(row.created_at),
			author: {
				name,
				username
			}
		}];
	});
}
/** Loads the current public search data directly from Supabase. */
async function loadSearchData(client = supabase) {
	const [{ data: profiles, error: profilesError }, { data: posts, error: postsError }] = await Promise.all([client.from("profiles").select("id,username,full_name,display_name,avatar_url,is_verified,category").order("updated_at", { ascending: false }).limit(100), client.from("posts").select("*").limit(500)]);
	if (profilesError) throw profilesError;
	if (postsError) throw postsError;
	const profileRows = profiles ?? [];
	const users = await resolveSearchAvatars(toSearchUsers(profileRows, await loadFollowerCounts(profileRows.map((profile) => profile.id), client)));
	const totals = /* @__PURE__ */ new Map();
	for (const post of posts ?? []) {
		const storedTags = Array.isArray(post.hashtags) ? post.hashtags : [];
		const inlineTags = [...[
			post.caption,
			post.content,
			post.title,
			post.description
		].filter((value) => typeof value === "string").join(" ").matchAll(/#([\p{L}\p{N}_-]+)/gu)].map((match) => match[1]);
		for (const tag of [...storedTags, ...inlineTags]) {
			const normalized = String(tag).trim().replace(/^#/, "").toLowerCase();
			if (normalized) totals.set(normalized, (totals.get(normalized) ?? 0) + 1);
		}
	}
	const hashtags = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([tag, postCount], index) => ({
		tag,
		postCount,
		trending: index < 6
	}));
	const allVideos = toSearchVideos(posts ?? [], profileRows);
	return {
		users,
		reels: allVideos.filter((video) => video.kind === "reel"),
		videos: allVideos.filter((video) => video.kind === "video"),
		hashtags
	};
}
var tabs = [
	{
		id: "top",
		label: "Top"
	},
	{
		id: "accounts",
		label: "Accounts"
	},
	{
		id: "reels",
		label: "Reels"
	},
	{
		id: "videos",
		label: "Videos"
	},
	{
		id: "tags",
		label: "Tags"
	}
];
function SearchPage() {
	const [query, setQuery] = (0, import_react.useState)("");
	const [tab, setTab] = (0, import_react.useState)("top");
	const inputRef = (0, import_react.useRef)(null);
	const { history, push, remove, clear } = useSearch();
	const { following, toggleFollow } = useYw();
	const [users, setUsers] = (0, import_react.useState)([]);
	const [reels, setReels] = (0, import_react.useState)([]);
	const [videos, setVideos] = (0, import_react.useState)([]);
	const [hashtags, setHashtags] = (0, import_react.useState)([]);
	const [remoteUsers, setRemoteUsers] = (0, import_react.useState)([]);
	const [userSearchError, setUserSearchError] = (0, import_react.useState)(null);
	const [loadError, setLoadError] = (0, import_react.useState)(null);
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		let active = true;
		const load = async () => {
			try {
				const next = await loadSearchData();
				if (!active) return;
				setUsers(next.users);
				setReels(next.reels);
				setVideos(next.videos);
				setHashtags(next.hashtags);
				setLoadError(null);
			} catch (error) {
				if (active) setLoadError(error instanceof Error ? error.message : "Couldn't load search.");
			}
		};
		load();
		const channel = supabase.channel("search-live-data").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "profiles"
		}, () => void load()).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "posts"
		}, () => void load()).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "follows"
		}, () => void load()).subscribe();
		return () => {
			active = false;
			supabase.removeChannel(channel);
		};
	}, []);
	const q = query.trim().toLowerCase().replace(/^[#@]/, "");
	const hasQuery = q.length > 0;
	(0, import_react.useEffect)(() => {
		if (!hasQuery || tab !== "accounts" && tab !== "top") {
			setRemoteUsers([]);
			setUserSearchError(null);
			return;
		}
		let active = true;
		const timer = window.setTimeout(() => {
			searchPublicProfiles(query).then((results) => {
				if (active) {
					setRemoteUsers(results);
					setUserSearchError(null);
				}
			}, () => {
				if (active) setUserSearchError("Couldn't search accounts. Please try again.");
			});
		}, 220);
		return () => {
			active = false;
			window.clearTimeout(timer);
		};
	}, [
		hasQuery,
		query,
		tab
	]);
	const matchingReels = (0, import_react.useMemo)(() => hasQuery ? reels.filter((reel) => matchesVideo(reel, q)) : [], [
		hasQuery,
		reels,
		q
	]);
	const matchingVideos = (0, import_react.useMemo)(() => hasQuery ? videos.filter((video) => matchesVideo(video, q)) : [], [
		hasQuery,
		videos,
		q
	]);
	const matchingHashtags = (0, import_react.useMemo)(() => hasQuery ? hashtags.filter((tag) => tag.tag.toLowerCase().includes(q)) : [], [
		hasQuery,
		hashtags,
		q
	]);
	const topUsers = remoteUsers.slice(0, 4);
	function rememberQuery() {
		const label = query.trim();
		if (label) push({
			kind: "query",
			label
		});
	}
	function handleUserClick(user) {
		push({
			kind: "user",
			label: user.username,
			sublabel: user.name,
			userId: user.id
		});
		navigate({
			to: "/u/$userId",
			params: { userId: user.id }
		});
	}
	function handleHashtagClick(tag) {
		push({
			kind: "hashtag",
			label: tag
		});
		setQuery(`#${tag}`);
		setTab("tags");
	}
	function handleReelClick(reel) {
		rememberQuery();
		navigate({
			to: "/reels",
			search: {
				reelId: reel.id,
				userId: void 0,
				initialVideoId: void 0,
				returnTo: void 0
			}
		});
	}
	function handleVideoClick(video) {
		rememberQuery();
		navigate({
			to: "/video/$videoId",
			params: { videoId: video.id }
		});
	}
	function clearQuery() {
		setQuery("");
		setTab("top");
		inputRef.current?.focus();
	}
	const counts = {
		top: topUsers.length + matchingReels.length + matchingVideos.length + matchingHashtags.length,
		accounts: remoteUsers.length,
		reels: matchingReels.length,
		videos: matchingVideos.length,
		tags: matchingHashtags.length
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "grain relative min-h-screen pb-28",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "ambient-canvas"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "header-lux sticky top-0 z-40 px-4 pb-3 pt-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mb-3 font-ui text-[18px] font-semibold leading-none tracking-[-0.03em] text-foreground",
						children: "Search"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex items-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
								className: "pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground",
								strokeWidth: 2
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: inputRef,
								value: query,
								onChange: (event) => setQuery(event.target.value),
								placeholder: "Search accounts, reels, videos, tags…",
								autoComplete: "off",
								autoCorrect: "off",
								spellCheck: false,
								className: "h-10 w-full rounded-[14px] bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)] pl-9 pr-9 font-ui text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-[color-mix(in_oklab,var(--foreground)_18%,transparent)] transition-all duration-200"
							}),
							query && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: clearQuery,
								className: "absolute right-2.5 grid h-5 w-5 place-items-center rounded-full bg-muted-foreground/30 transition-all duration-150 active:scale-90",
								"aria-label": "Clear search",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
									className: "h-3 w-3 text-foreground",
									strokeWidth: 2.5
								})
							})
						]
					}),
					hasQuery && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex gap-1 overflow-x-auto no-scrollbar",
						children: tabs.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setTab(item.id),
							className: cn("flex shrink-0 items-center gap-1.5 rounded-[10px] px-3 py-1.5 font-ui text-[12px] font-medium transition-all duration-200", tab === item.id ? "bg-[color-mix(in_oklab,var(--foreground)_12%,transparent)] text-foreground" : "text-muted-foreground"),
							children: [
								item.id === "tags" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hash, {
									className: "h-3 w-3",
									strokeWidth: 2.2
								}),
								item.label,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] opacity-60",
									children: counts[item.id]
								})
							]
						}, item.id))
					})
				]
			}),
			hasQuery ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6 px-4 pb-6 pt-4",
				children: [tab === "top" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopResults, {
					users: topUsers,
					reels: matchingReels.slice(0, 4),
					videos: matchingVideos.slice(0, 3),
					hashtags: matchingHashtags.slice(0, 5),
					userError: userSearchError,
					onUserClick: handleUserClick,
					onReelClick: handleReelClick,
					onVideoClick: handleVideoClick,
					onHashtagClick: handleHashtagClick
				}) : tab === "accounts" ? remoteUsers.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-1",
					children: remoteUsers.map((user, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "animate-rise",
						style: { animationDelay: `${index * 35}ms` },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRow, {
							user,
							onClick: () => handleUserClick(user)
						})
					}, user.id))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { label: userSearchError ?? `No accounts match "${q}"` }) : tab === "reels" ? matchingReels.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReelGrid, {
					reels: matchingReels,
					onOpen: handleReelClick
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { label: `No reels match "${q}"` }) : tab === "videos" ? matchingVideos.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoList, {
					videos: matchingVideos,
					onOpen: handleVideoClick
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { label: `No videos match "${q}"` }) : matchingHashtags.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-1",
					children: matchingHashtags.map((tag, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "animate-rise",
						style: { animationDelay: `${index * 35}ms` },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HashtagRow, {
							tag: tag.tag,
							postCount: tag.postCount,
							onClick: () => handleHashtagClick(tag.tag)
						})
					}, tag.tag))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { label: `No tags match "#${q}"` }), loadError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center text-xs text-muted-foreground",
					children: loadError
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6 px-4 pb-6 pt-4",
				children: [
					history.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-ui text-[13px] font-semibold text-foreground",
							children: "Recent Searches"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: clear,
							className: "font-ui text-[12px] text-primary transition-opacity active:opacity-60",
							children: "Clear all"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-0.5",
						children: history.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "group flex items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]",
									children: entry.kind === "user" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-ui text-[13px] font-semibold text-foreground/70",
										children: (entry.sublabel ?? entry.label).charAt(0).toUpperCase()
									}) : entry.kind === "hashtag" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hash, {
										className: "h-4 w-4 text-foreground/60",
										strokeWidth: 2
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
										className: "h-4 w-4 text-foreground/60",
										strokeWidth: 2
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: "min-w-0 flex-1 text-left",
									onClick: () => {
										setQuery(entry.kind === "user" ? `@${entry.label}` : entry.kind === "hashtag" ? `#${entry.label}` : entry.label);
										setTab(entry.kind === "user" ? "accounts" : entry.kind === "hashtag" ? "tags" : "top");
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-ui text-[14px] font-medium text-foreground",
										children: entry.kind === "user" ? `@${entry.label}` : entry.kind === "hashtag" ? `#${entry.label}` : entry.label
									}), entry.sublabel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-ui text-[12px] text-muted-foreground",
										children: entry.sublabel
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => remove(entry.id),
									"aria-label": "Remove from history",
									className: "grid h-7 w-7 shrink-0 place-items-center rounded-full opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-[color-mix(in_oklab,var(--foreground)_10%,transparent)] active:scale-90",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
										className: "h-3.5 w-3.5 text-muted-foreground",
										strokeWidth: 2.2
									})
								})
							]
						}, entry.id))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, {
							className: "h-4 w-4 text-primary",
							strokeWidth: 2
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-ui text-[13px] font-semibold text-foreground",
							children: "Trending"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "surface-card overflow-hidden rounded-[20px]",
						children: hashtags.filter((tag) => tag.trending).slice(0, 6).map((tag, index, list) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => handleHashtagClick(tag.tag),
							className: cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)] active:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]", index < list.length - 1 && "border-b border-[color-mix(in_oklab,var(--foreground)_6%,transparent)]"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-5 shrink-0 text-center font-ui text-[13px] font-bold text-muted-foreground/50",
									children: index + 1
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "font-ui text-[14px] font-semibold text-foreground",
										children: ["#", tag.tag]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "font-ui text-[11px] text-muted-foreground",
										children: [formatCount(tag.postCount), " posts"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
									className: "h-4 w-4 shrink-0 text-muted-foreground/40",
									strokeWidth: 1.8
								})
							]
						}, tag.tag))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-ui text-[13px] font-semibold text-foreground",
							children: "Suggested Creators"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							className: "font-ui text-[12px] text-primary transition-opacity active:opacity-60",
							children: "See all"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1",
						children: users.map((user) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuggestedCard, {
							user,
							isFollowing: !!following[user.id],
							onClick: () => handleUserClick(user),
							onFollow: () => toggleFollow(user.id)
						}, user.id))
					})] })
				]
			})
		]
	});
}
function matchesVideo(video, query) {
	return [
		video.title,
		video.description,
		video.caption,
		...video.hashtags
	].some((value) => value.toLowerCase().includes(query));
}
function TopResults({ users, reels, videos, hashtags, userError, onUserClick, onReelClick, onVideoClick, onHashtagClick }) {
	if (!users.length && !reels.length && !videos.length && !hashtags.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { label: userError ?? "No results found" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		users.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultSection, {
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-4 w-4" }),
			title: "Accounts",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-1",
				children: users.map((user) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRow, {
					user,
					onClick: () => onUserClick(user)
				}) }, user.id))
			})
		}),
		reels.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultSection, {
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Film, { className: "h-4 w-4" }),
			title: "Reels",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReelGrid, {
				reels,
				onOpen: onReelClick
			})
		}),
		videos.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultSection, {
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, { className: "h-4 w-4" }),
			title: "Videos",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoList, {
				videos,
				onOpen: onVideoClick
			})
		}),
		hashtags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultSection, {
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: "h-4 w-4" }),
			title: "Tags",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-1",
				children: hashtags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HashtagRow, {
					tag: tag.tag,
					postCount: tag.postCount,
					onClick: () => onHashtagClick(tag.tag)
				}) }, tag.tag))
			})
		})
	] });
}
function ResultSection({ icon, title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-3 flex items-center gap-2 font-ui text-[13px] font-semibold text-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-primary",
			children: icon
		}), title]
	}), children] });
}
function UserRow({ user, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: "flex w-full items-center gap-3 rounded-[16px] px-1 py-2 text-left transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)] active:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileAvatar, { user: {
					full_name: user.name,
					username: user.username,
					avatar_url: user.avatar_url
				} })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-ui text-[14px] font-semibold text-foreground",
						children: ["@", user.username]
					}), user.verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
							className: "h-2.5 w-2.5 text-primary-foreground",
							strokeWidth: 3
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-ui text-[12px] text-muted-foreground",
					children: [user.name, user.category ? ` · ${user.category}` : ""]
				})]
			}),
			user.followerCount !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "shrink-0 font-ui text-[12px] font-medium text-muted-foreground/70",
				children: formatCount(user.followerCount)
			})
		]
	});
}
function ReelGrid({ reels, onOpen }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-2 gap-2",
		children: reels.map((reel) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => onOpen(reel),
			className: "group min-w-0 text-left",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative aspect-[9/12] overflow-hidden rounded-[16px] bg-zinc-900",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoPoster, {
						thumbnailUrl: reel.thumbnailUrl,
						mediaUrl: reel.mediaUrl,
						alt: reel.title,
						className: "h-full w-full transition-transform duration-300 group-hover:scale-105"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "h-3.5 w-3.5 fill-current" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "absolute bottom-2 left-2 flex items-center gap-1 font-ui text-[10px] font-medium text-white",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-3 w-3" }), formatViews(reel.views)]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 line-clamp-2 font-ui text-[12px] font-semibold text-foreground",
				children: reel.title
			})]
		}, reel.id))
	});
}
function VideoList({ videos, onOpen }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-2",
		children: videos.map((video) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => onOpen(video),
			className: "flex w-full items-center gap-3 rounded-[16px] p-1 text-left transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)] active:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative h-20 w-32 shrink-0 overflow-hidden rounded-[12px] bg-zinc-900",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoPoster, {
					thumbnailUrl: video.thumbnailUrl,
					mediaUrl: video.mediaUrl,
					alt: video.title,
					className: "h-full w-full"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 font-ui text-[10px] font-medium text-white",
					children: formatDuration(video.durationSeconds)
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "line-clamp-2 font-ui text-[13px] font-semibold text-foreground",
					children: video.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 truncate font-ui text-[11px] text-muted-foreground",
					children: [
						video.author.name,
						" · ",
						formatViews(video.views)
					]
				})]
			})]
		}, video.id))
	});
}
function HashtagRow({ tag, postCount, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: "flex w-full items-center gap-3 rounded-[16px] px-1 py-2 text-left transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)] active:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hash, {
				className: "h-5 w-5 text-foreground/70",
				strokeWidth: 2
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 flex-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-ui text-[14px] font-semibold text-foreground",
				children: ["#", tag]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-ui text-[12px] text-muted-foreground",
				children: [formatCount(postCount), " posts"]
			})]
		})]
	});
}
function SuggestedCard({ user, isFollowing, onClick, onFollow }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "surface-card flex w-[142px] shrink-0 flex-col items-center rounded-[20px] px-3 pb-3.5 pt-4 text-center transition-transform duration-200",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick,
			className: "flex w-full flex-col items-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-[52px] w-[52px] overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileAvatar, { user: {
						full_name: user.name,
						username: user.username,
						avatar_url: user.avatar_url
					} })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2.5 w-full truncate font-ui text-[12px] font-semibold text-foreground",
					children: ["@", user.username]
				}),
				user.category && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "w-full truncate font-ui text-[10px] text-muted-foreground",
					children: user.category
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 font-ui text-[11px] font-medium text-muted-foreground/70",
					children: user.followerCount !== void 0 && formatCount(user.followerCount)
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: onFollow,
			className: cn("mt-3 flex w-full items-center justify-center gap-1 rounded-[10px] py-1.5 font-ui text-[11px] font-semibold transition-colors", isFollowing ? "bg-[color-mix(in_oklab,var(--foreground)_12%,transparent)] text-foreground" : "bg-primary text-primary-foreground"),
			children: [isFollowing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
				className: "h-3 w-3",
				strokeWidth: 3
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { className: "h-3 w-3" }), isFollowing ? "Following" : "Follow"]
		})]
	});
}
function EmptyState({ label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center gap-2 py-16 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
			className: "h-8 w-8 text-muted-foreground/30",
			strokeWidth: 1.5
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-ui text-[14px] text-muted-foreground",
			children: label
		})]
	});
}
//#endregion
export { SearchPage as component };
