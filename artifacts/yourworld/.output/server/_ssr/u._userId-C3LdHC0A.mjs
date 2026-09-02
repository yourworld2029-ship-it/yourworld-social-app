import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-DidqkCgA.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { Gt as Grid3x3, bn as ChevronLeft, tt as Play } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { B as cn, I as isRealUserId, J as resolveMediaUrl, L as setFollow, R as useFollowCounts, U as dmThreadId, _ as Route$5, c as useChatNames, f as useResolvedMedia } from "./router-UxuX_yNN.mjs";
import { t as formatCount } from "./yw-data-CyapVFm6.mjs";
import { a as TabsTrigger, i as TabsList, n as Tabs, r as TabsContent, t as FollowListDialog } from "./FollowListDialog-SIM_kLK-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/u._userId-C3LdHC0A.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PublicProfilePage() {
	const { userId } = Route$5.useParams();
	const navigate = useNavigate();
	const { nameFor } = useChatNames();
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [avatarSrc, setAvatarSrc] = (0, import_react.useState)(null);
	const [posts, setPosts] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [me, setMe] = (0, import_react.useState)(null);
	const [isFollowing, setIsFollowing] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [listOpen, setListOpen] = (0, import_react.useState)(false);
	const [listTab, setListTab] = (0, import_react.useState)("followers");
	const counts = useFollowCounts(isRealUserId(userId) ? userId : null);
	const load = (0, import_react.useCallback)(async () => {
		setLoading(true);
		const { data: s } = await supabase.auth.getSession();
		const uid = s.session?.user.id ?? null;
		setMe(uid);
		const [{ data: rows }, { data: myPosts }, { data: rel }] = await Promise.all([
			supabase.rpc("get_public_profiles", { ids: [userId] }),
			supabase.from("posts").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
			uid ? supabase.from("follows").select("following_id").eq("follower_id", uid).eq("following_id", userId).maybeSingle() : Promise.resolve({ data: null })
		]);
		const row = (rows ?? [])[0];
		const next = {
			id: userId,
			username: row?.username ?? `user${userId.slice(0, 4)}`,
			display_name: row?.display_name ?? row?.username ?? "YourWorld user",
			bio: row?.bio ?? "",
			avatar_url: row?.avatar_url ?? null
		};
		setProfile(next);
		setPosts(myPosts ?? []);
		setIsFollowing(!!rel);
		setAvatarSrc(next.avatar_url ? await resolveMediaUrl(next.avatar_url, "avatars") : null);
		setLoading(false);
	}, [userId]);
	(0, import_react.useEffect)(() => {
		load();
	}, [load]);
	const media = useResolvedMedia(posts.map((p) => p.media_url));
	const src = (u) => media[u] ?? u;
	const grid = posts.filter((p) => p.kind !== "reel");
	const reels = posts.filter((p) => p.kind === "reel");
	const onFollow = async () => {
		if (busy) return;
		setBusy(true);
		const next = !isFollowing;
		setIsFollowing(next);
		try {
			await setFollow(userId, next);
			counts.reload();
			toast.success(next ? `Following @${profile?.username}` : "Unfollowed");
		} catch (e) {
			setIsFollowing(!next);
			toast.error(e instanceof Error ? e.message : "Couldn't update follow");
		} finally {
			setBusy(false);
		}
	};
	if (me && me === userId) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-screen place-items-center bg-[#0d0d0f] px-6 text-center text-white",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-zinc-400",
			children: "This is you."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/profile",
			className: "mt-4 inline-block rounded-full bg-white px-4 py-2 text-xs font-semibold text-black",
			children: "Open your profile"
		})] })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen bg-[#0d0d0f] pb-28 text-white",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-40 flex items-center gap-3 border-b border-zinc-900/60 bg-[#0d0d0f]/90 px-3 py-3 backdrop-blur-md",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => navigate({ to: "/" }),
					"aria-label": "Back",
					className: "grid h-9 w-9 place-items-center rounded-full text-zinc-300 active:scale-90",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 22 })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "truncate text-base font-bold",
					children: ["@", profile?.username ?? "user"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "px-4 pt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-5",
						children: [avatarSrc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: avatarSrc,
							alt: profile?.display_name ?? "Profile photo",
							className: "h-20 w-20 rounded-full border border-pink-500/70 object-cover"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-20 w-20 place-items-center rounded-full border border-pink-500/70 bg-gradient-to-br from-pink-500 to-purple-600 text-2xl font-bold",
							children: (profile?.display_name || profile?.username || "Y").charAt(0).toUpperCase()
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid flex-1 grid-cols-3 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-base font-bold",
									children: formatCount(posts.length)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-zinc-400",
									children: "Posts"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => {
										setListTab("followers");
										setListOpen(true);
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-base font-bold",
										children: formatCount(counts.followers)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-zinc-400",
										children: "Followers"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => {
										setListTab("following");
										setListOpen(true);
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-base font-bold",
										children: formatCount(counts.following)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-zinc-400",
										children: "Following"
									})]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold",
							children: nameFor(userId, profile?.display_name ?? "")
						}), profile?.bio && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "whitespace-pre-line pt-1 text-xs leading-relaxed text-zinc-300",
							children: profile.bio
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2 pt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: onFollow,
							disabled: busy,
							className: cn("flex-1 rounded-xl py-2 text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-60", isFollowing ? "bg-zinc-800 text-white" : "bg-pink-500 text-white"),
							children: isFollowing ? "Following" : "Follow"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								if (!me) return;
								navigate({
									to: "/chat/$threadId",
									params: { threadId: dmThreadId(me, userId) }
								});
							},
							className: "flex-1 rounded-xl bg-zinc-800 py-2 text-center text-xs font-bold",
							children: "Message"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
				defaultValue: "grid",
				className: "pt-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
						className: "grid w-full grid-cols-2 bg-transparent",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "grid",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Grid3x3, { size: 18 })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "reels",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { size: 18 })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "grid",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaGrid, {
							items: grid,
							src,
							empty: loading ? "Loading…" : "No posts yet"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "reels",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaGrid, {
							items: reels,
							src,
							empty: loading ? "Loading…" : "No reels yet"
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FollowListDialog, {
				userId,
				open: listOpen,
				onOpenChange: setListOpen,
				tab: listTab,
				onTabChange: setListTab
			})
		]
	});
}
function MediaGrid({ items, src, empty }) {
	if (!items.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "px-4 py-12 text-center text-xs text-zinc-500",
		children: empty
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-3 gap-[2px] px-[2px]",
		children: items.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative aspect-square overflow-hidden bg-zinc-900",
			children: p.media_type === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
				src: src(p.media_url),
				muted: true,
				playsInline: true,
				className: "h-full w-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: src(p.media_url),
				alt: p.caption ?? "Post",
				loading: "lazy",
				className: "h-full w-full object-cover"
			})
		}, p.id))
	});
}
//#endregion
export { PublicProfilePage as component };
