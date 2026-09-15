import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { Ht as Grid3x3, V as Share2, bt as MessageCircle, g as UserPlus, gn as ChevronLeft, tt as Play } from "../_libs/lucide-react.mjs";
import { D as useFollowCounts, E as isRealUserId, F as resolveMediaUrl, T as useYw, gt as cn, i as Route$5, k as dmThreadId } from "./router-DAt39S6o.mjs";
import { m as useResolvedMedia } from "./profile-data-CtDX4eIE.mjs";
import { t as VideoPoster } from "./VideoPoster-DIrLKNjB.mjs";
import { r as useChatNames } from "./chat-names-Dnk0YJkG.mjs";
import { n as fetchOrbitProfileRow, o as rowToOrbitProfile } from "./orbit-live-BqfCVEZi.mjs";
import { t as formatCount } from "./yw-data-CyapVFm6.mjs";
import { a as TabsTrigger, i as TabsList, n as Tabs, r as TabsContent, t as FollowListDialog } from "./FollowListDialog-whso36IL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/u._userId-CU8EHhS5.js
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
	const [loadError, setLoadError] = (0, import_react.useState)(null);
	const [me, setMe] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [listOpen, setListOpen] = (0, import_react.useState)(false);
	const [listTab, setListTab] = (0, import_react.useState)("followers");
	const counts = useFollowCounts(isRealUserId(userId) ? userId : null);
	const { following, toggleFollow } = useYw();
	const loadRequestRef = (0, import_react.useRef)(0);
	const load = (0, import_react.useCallback)(async () => {
		const requestId = ++loadRequestRef.current;
		setLoading(true);
		setLoadError(null);
		setMe(null);
		setProfile(null);
		setPosts([]);
		setAvatarSrc(null);
		try {
			const { data: s, error: sessionError } = await supabase.auth.getSession();
			if (sessionError) throw sessionError;
			const uid = s.session?.user.id ?? null;
			const [profileResult, postsResult, orbitRow] = await Promise.all([
				supabase.rpc("get_public_profiles", { ids: [userId] }),
				supabase.from("posts").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
				fetchOrbitProfileRow(userId)
			]);
			if (profileResult.error) throw profileResult.error;
			if (postsResult.error) throw postsResult.error;
			const row = (profileResult.data ?? [])[0];
			const orbitProfile = orbitRow ? rowToOrbitProfile(orbitRow) : null;
			const next = {
				id: userId,
				username: row?.username ?? orbitProfile?.handle ?? `user${userId.slice(0, 4)}`,
				display_name: row?.display_name ?? row?.username ?? orbitProfile?.name ?? "YourWorld user",
				bio: row?.bio ?? orbitProfile?.about ?? "",
				avatar_url: row?.avatar_url ?? orbitProfile?.photo ?? null
			};
			const nextAvatar = next.avatar_url ? await resolveMediaUrl(next.avatar_url, "avatars") : null;
			if (requestId !== loadRequestRef.current) return;
			setMe(uid);
			setProfile(next);
			setPosts(postsResult.data ?? []);
			setAvatarSrc(nextAvatar);
		} catch (error) {
			if (requestId !== loadRequestRef.current) return;
			console.error("[PublicProfilePage] unable to load profile", error);
			setLoadError("This profile could not be loaded.");
		} finally {
			if (requestId === loadRequestRef.current) setLoading(false);
		}
	}, [userId]);
	(0, import_react.useEffect)(() => {
		load();
	}, [load]);
	const media = useResolvedMedia(posts.map((p) => p.media_url));
	const src = (u) => media[u] ?? u;
	const grid = posts.filter((p) => p.kind !== "reel");
	const reels = posts.filter((p) => p.kind === "reel");
	const gridEmpty = loading ? "Loading…" : loadError ?? "No posts yet";
	const reelsEmpty = loading ? "Loading…" : loadError ?? "No reels yet";
	const onFollow = async () => {
		if (busy) return;
		setBusy(true);
		try {
			const wasFollowing = Boolean(following[userId]);
			if (!await toggleFollow(userId)) return;
			counts.reload();
			toast.success(wasFollowing ? "Unfollowed" : `Following @${profile?.username}`);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Couldn't update follow");
		} finally {
			setBusy(false);
		}
	};
	const onShare = async () => {
		const url = `${window.location.origin}/u/${userId}`;
		try {
			if (navigator.share) await navigator.share({
				title: profile?.username ?? "YourWorld profile",
				url
			});
			else {
				await navigator.clipboard.writeText(url);
				toast.success("Profile link copied");
			}
		} catch {}
	};
	const openViewer = (post) => {
		const id = typeof post.id === "string" ? post.id.trim() : "";
		if (!id) {
			toast.error("This media is unavailable.");
			return;
		}
		navigate({
			to: "/reels",
			search: {
				reelId: void 0,
				userId,
				initialVideoId: id,
				returnTo: "public"
			}
		});
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
							className: "grid flex-1 grid-cols-3 text-center leading-none",
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
										children: counts.followers === null ? "—" : formatCount(counts.followers)
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
										children: counts.following === null ? "—" : formatCount(counts.following)
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
						className: "grid grid-cols-3 gap-2 pt-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: onFollow,
								disabled: busy || counts.unavailable,
								className: cn("flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-60", following[userId] ? "bg-zinc-800 text-white" : "bg-pink-500 text-white"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { size: 14 }), counts.unavailable ? "Follow unavailable" : following[userId] ? "Following" : "Follow"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									if (!me) return;
									navigate({
										to: "/chat/$threadId",
										params: { threadId: dmThreadId(me, userId) }
									});
								},
								className: "flex items-center justify-center rounded-xl bg-zinc-800 py-2 text-center text-xs font-bold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 14 }), "Message"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => void onShare(),
								className: "flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-transparent py-2 text-xs font-bold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { size: 14 }), "Share"]
							})
						]
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
							empty: gridEmpty,
							onOpen: openViewer
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "reels",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaGrid, {
							items: reels,
							src,
							empty: reelsEmpty,
							onOpen: openViewer
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
function MediaGrid({ items, src, empty, onOpen }) {
	if (!items.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "px-4 py-12 text-center text-xs text-zinc-500",
		children: empty
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-3 gap-[2px] px-[2px]",
		children: items.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative aspect-square overflow-hidden bg-zinc-900",
			children: [p.media_type === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoPoster, {
				mediaUrl: src(p.media_url),
				thumbnailUrl: p.thumbnail_url,
				alt: p.caption ?? "Video",
				className: "h-full w-full"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: src(p.media_url),
				alt: p.caption ?? "Post",
				loading: "lazy",
				className: "h-full w-full object-cover"
			}), onOpen && (p.kind === "reel" || p.kind === "video" || p.media_type.startsWith("video")) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": `Open ${p.kind === "reel" ? "reel" : "video"}`,
				onClick: () => onOpen(p),
				className: "absolute inset-0 z-10"
			}) : null]
		}, p.id))
	});
}
//#endregion
export { PublicProfilePage as component };
