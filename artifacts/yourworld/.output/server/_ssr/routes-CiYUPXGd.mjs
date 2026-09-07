import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $ as Play, Dt as Link2, Ft as Heart, Gt as Ellipsis, H as Send, Ht as Eye, Kt as EllipsisVertical, Q as Plus, S as Trash2, Ut as EyeOff, W as Search, _t as MessageCircle, en as Clock, pn as Check, rn as Circle, un as ChevronRight, vn as Bookmark } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { $ as isAuthSessionMissing, E as timeAgo, dt as cn, g as useMoments, m as useAuth, ot as useYw } from "./router-B1m7u2Jk.mjs";
import { n as useAlertsCount } from "./alerts-count-DzTrAmD5.mjs";
import { a as Label2, c as Root2, d as SubTrigger2, f as Trigger, i as ItemIndicator2, l as Separator2, n as Content2, o as Portal2, r as Item2, s as RadioItem2, t as CheckboxItem2, u as SubContent2 } from "../_libs/@radix-ui/react-dropdown-menu+[...].mjs";
import { n as formatDuration, o as useLongVideos, r as formatViews } from "./video-data-KoEbRc93.mjs";
import { t as VideoPoster } from "./VideoPoster-BdTWt-YD.mjs";
import { t as formatCount } from "./yw-data-CyapVFm6.mjs";
import { n as ShareSheet, t as CommentsSheet } from "./ShareSheet-Bg8oYPNh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CiYUPXGd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Permanently delete my own post. */
async function deletePost(postId) {
	const { error } = await supabase.from("posts").delete().eq("id", postId);
	if (error) throw error;
}
/** Saved-post bookmarks for the signed-in user, synced with the database. */
function usePostSaves() {
	const [saved, setSaved] = (0, import_react.useState)({});
	const meRef = (0, import_react.useRef)(null);
	const load = (0, import_react.useCallback)(async () => {
		const { data: auth, error: authError } = await supabase.auth.getUser();
		if (authError) {
			if (isAuthSessionMissing(authError)) {
				meRef.current = null;
				setSaved({});
				return;
			}
			console.error("Unable to load saved posts", authError);
			meRef.current = null;
			setSaved({});
			return;
		}
		const me = auth.user?.id ?? null;
		meRef.current = me;
		if (!me) {
			setSaved({});
			return;
		}
		const { data, error } = await supabase.from("post_saves").select("post_id").eq("user_id", me);
		if (error) {
			console.error("Unable to load saved posts", error);
			setSaved({});
			return;
		}
		const next = {};
		for (const row of data ?? []) next[row.post_id] = true;
		setSaved(next);
	}, []);
	(0, import_react.useEffect)(() => {
		load();
		const { data: sub } = supabase.auth.onAuthStateChange(() => void load());
		const channel = supabase.channel(`post-saves:${crypto.randomUUID()}`).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "post_saves"
		}, () => void load()).subscribe();
		return () => {
			sub.subscription.unsubscribe();
			supabase.removeChannel(channel);
		};
	}, [load]);
	return {
		saved,
		toggleSave: (0, import_react.useCallback)(async (postId) => {
			const me = meRef.current;
			if (!me) return false;
			let next = false;
			setSaved((prev) => {
				next = !prev[postId];
				return {
					...prev,
					[postId]: next
				};
			});
			const { error } = next ? await supabase.from("post_saves").upsert({
				post_id: postId,
				user_id: me
			}, {
				onConflict: "post_id,user_id",
				ignoreDuplicates: true
			}) : await supabase.from("post_saves").delete().eq("post_id", postId).eq("user_id", me);
			if (error) {
				console.error("Unable to update saved post", error);
				setSaved((prev) => ({
					...prev,
					[postId]: !next
				}));
				throw error;
			}
			return next;
		}, []),
		reload: load
	};
}
var DropdownMenu = Root2;
var DropdownMenuTrigger = Trigger;
var DropdownMenuSubTrigger = import_react.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SubTrigger2, {
	ref,
	className: cn("flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", inset && "pl-8", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-auto" })]
}));
DropdownMenuSubTrigger.displayName = SubTrigger2.displayName;
var DropdownMenuSubContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubContent2, {
	ref,
	className: cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}));
DropdownMenuSubContent.displayName = SubContent2.displayName;
var DropdownMenuContent = import_react.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	sideOffset,
	className: cn("z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}) }));
DropdownMenuContent.displayName = Content2.displayName;
var DropdownMenuItem = import_react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0", inset && "pl-8", className),
	...props
}));
DropdownMenuItem.displayName = Item2.displayName;
var DropdownMenuCheckboxItem = import_react.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CheckboxItem2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	checked,
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemIndicator2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) })
	}), children]
}));
DropdownMenuCheckboxItem.displayName = CheckboxItem2.displayName;
var DropdownMenuRadioItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RadioItem2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemIndicator2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "h-2 w-2 fill-current" }) })
	}), children]
}));
DropdownMenuRadioItem.displayName = RadioItem2.displayName;
var DropdownMenuLabel = import_react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label2, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
	...props
}));
DropdownMenuLabel.displayName = Label2.displayName;
var DropdownMenuSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator2, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
DropdownMenuSeparator.displayName = Separator2.displayName;
var DropdownMenuShortcut = ({ className, ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("ml-auto text-xs tracking-widest opacity-60", className),
		...props
	});
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";
/** Feed card for long-form videos — supports 16:9 and 9:16 playback. */
function LongVideoCard({ video, onLike, currentUserId = null, isSaved = false, onToggleSave, onDeleted }) {
	const { following, toggleFollow } = useYw();
	const [hidden, setHidden] = (0, import_react.useState)(false);
	const [commentCount, setCommentCount] = (0, import_react.useState)(video.commentCount);
	const [liking, setLiking] = (0, import_react.useState)(false);
	const cardRef = (0, import_react.useRef)(null);
	const isMine = currentUserId === video.userId;
	const isFollowing = !!following[video.userId];
	const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/?post=${video.id}` : void 0;
	const handleSave = async () => {
		if (!onToggleSave) return;
		if (!currentUserId) {
			toast.error("Sign in to save videos");
			return;
		}
		try {
			const savedNow = await onToggleSave(video.id);
			toast.success(savedNow === false ? "Removed from saved" : "Video saved");
		} catch {
			toast.error("Couldn't update saved videos");
		}
	};
	const handleLike = async () => {
		if (!currentUserId) {
			toast.error("Sign in to like videos");
			return;
		}
		if (liking) return;
		setLiking(true);
		try {
			await onLike(video.id);
		} catch {
			toast.error("Couldn't update like");
		} finally {
			setLiking(false);
		}
	};
	const copyLink = async () => {
		try {
			await navigator.clipboard.writeText(shareUrl ?? "");
			toast.success("Link copied");
		} catch {
			toast.error("Could not copy link");
		}
	};
	const handleDelete = async () => {
		try {
			await deletePost(video.id);
			setHidden(true);
			onDeleted?.(video.id);
			toast.success("Video deleted");
		} catch {
			toast.error("Couldn't delete this video");
		}
	};
	const openWatchPage = (event) => {
		event.stopPropagation();
		window.location.href = `/video/${video.id}`;
	};
	const upcoming = !!video.scheduledAt && new Date(video.scheduledAt).getTime() > Date.now();
	if (hidden) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		ref: cardRef,
		className: "space-y-3 overflow-hidden border-y border-zinc-800/80 bg-[#141418] shadow-2xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			role: "link",
			tabIndex: 0,
			"aria-label": `Open ${video.title}`,
			onClick: openWatchPage,
			onTouchEnd: openWatchPage,
			onKeyDown: (event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					window.location.href = `/video/${video.id}`;
				}
			},
			className: "block w-full cursor-pointer touch-manipulation select-none",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("relative mx-auto w-full overflow-hidden bg-black", video.orientation === "portrait" ? "max-h-[75vh] aspect-[9/16]" : "aspect-[16/9]"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoPoster, {
						thumbnailUrl: video.thumbnailUrl,
						mediaUrl: video.mediaUrl,
						alt: video.title,
						className: "pointer-events-none select-none"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "pointer-events-none absolute inset-0 grid place-items-center bg-black/25",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-14 w-14 items-center justify-center rounded-full bg-white/90 text-black",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
								size: 22,
								className: "ml-0.5 fill-black"
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "pointer-events-none absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold",
						children: formatDuration(video.durationSeconds)
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-2 px-3 pb-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						onClick: openWatchPage,
						onTouchEnd: openWatchPage,
						className: "cursor-pointer select-none text-sm font-bold leading-snug text-white",
						children: video.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex shrink-0 items-center gap-1.5",
						children: [!isMine && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => toggleFollow(video.userId),
							className: cn("rounded-full px-3 py-1 text-[11px] font-semibold transition-all active:scale-95", isFollowing ? "bg-zinc-800 text-white" : "bg-pink-500 text-white"),
							children: isFollowing ? "Following" : "Follow"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								"aria-label": "More options",
								onClick: (event) => event.stopPropagation(),
								className: "p-1 text-zinc-400 hover:text-white",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { size: 18 })
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
							align: "end",
							className: "w-52",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
									onClick: copyLink,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "mr-2 h-4 w-4" }), " Copy link"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
									onClick: handleSave,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { className: "mr-2 h-4 w-4" }),
										" ",
										isSaved ? "Remove from saved" : "Save video"
									]
								}),
								!isMine && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
									onClick: () => setHidden(true),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "mr-2 h-4 w-4" }), " Not interested"]
								}),
								isMine && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
									onClick: handleDelete,
									className: "text-destructive focus:text-destructive",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "mr-2 h-4 w-4" }), " Delete video"]
								})
							]
						})] })]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 text-[11px] text-zinc-400",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/u/$userId",
							params: { userId: video.userId },
							onClick: (event) => event.stopPropagation(),
							className: "flex items-center gap-2 transition-opacity active:opacity-70",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-6 w-6 place-items-center rounded-full bg-[#8b2fc9] text-[11px] font-bold text-white",
								children: video.author.letter
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-semibold text-zinc-200",
								children: ["@", video.author.username]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 12 }),
								" ",
								formatViews(video.views)
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: timeAgo(video.createdAt) })
					]
				}),
				upcoming && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-[11px] font-semibold text-amber-400",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { size: 12 }),
						" Scheduled for",
						" ",
						new Date(video.scheduledAt).toLocaleString()
					]
				}),
				video.caption && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "line-clamp-2 text-xs leading-relaxed text-zinc-300",
					children: video.caption
				}),
				video.hashtags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1.5",
					children: video.hashtags.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400",
						children: t
					}, t))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between pt-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: handleLike,
								"aria-label": "Like",
								disabled: liking,
								className: "flex items-center gap-1 text-xs text-zinc-300 transition-transform active:scale-75 disabled:opacity-60",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, {
									size: 20,
									className: video.likedByMe ? "fill-pink-500 text-pink-500" : "text-zinc-300"
								}), video.likeCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold",
									children: formatCount(video.likeCount)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommentsSheet, {
								postId: video.id,
								commentsDisabled: !!video.commentsOff,
								onCountChange: setCommentCount,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									"aria-label": "Comments",
									className: "flex items-center gap-1 text-xs text-zinc-300 transition-transform active:scale-75",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 20 }), commentCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold",
										children: formatCount(commentCount)
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShareSheet, {
								title: video.title,
								url: shareUrl,
								media: video.mediaUrl,
								mediaKind: "video",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									"aria-label": "Share",
									className: "text-zinc-300 transition-transform active:scale-75",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { size: 18 })
								})
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleSave,
						"aria-label": "Save",
						className: "text-zinc-300 transition-transform active:scale-75",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, {
							size: 20,
							className: isSaved ? "fill-white text-white" : "text-zinc-300"
						})
					})]
				})
			]
		})]
	});
}
var yw_logo_default = "/assets/yw-logo-BXjnypdM.png";
function MomentAvatar({ username, src, alt }) {
	const [imageFailed, setImageFailed] = import_react.useState(false);
	const initial = (username.trim().charAt(0) || "U").toUpperCase();
	import_react.useEffect(() => {
		setImageFailed(false);
	}, [src]);
	if (!src || imageFailed) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		role: "img",
		"aria-label": `${alt} avatar`,
		className: "grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-xl font-extrabold leading-none text-white",
		children: initial
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src,
		alt,
		onError: () => setImageFailed(true),
		className: "h-full w-full rounded-full object-cover",
		loading: "lazy"
	});
}
function HomePage() {
	const navigate = useNavigate();
	const [hydrated, setHydrated] = import_react.useState(false);
	const { videos, loading, currentUserId, countView, toggleLike, reload } = useLongVideos();
	const { saved, toggleSave } = usePostSaves();
	const { moments } = useMoments();
	const { user } = useAuth();
	const { count: alertCount } = useAlertsCount();
	import_react.useEffect(() => setHydrated(true), []);
	const openWatchPage = (event, videoId) => {
		event.stopPropagation();
		window.location.href = `/video/${videoId}`;
	};
	import_react.useEffect(() => {
		videos.map((v) => ({
			id: v.id,
			title: v.title,
			mediaUrl: v.mediaUrl,
			thumbnailUrl: v.thumbnailUrl,
			portrait: v.orientation === "portrait"
		}));
	}, [videos]);
	const myLatest = import_react.useMemo(() => moments.find((m) => m.mine), [moments]);
	const userMetadata = user?.user_metadata ?? {};
	const myUsername = myLatest?.author?.username || (typeof userMetadata.username === "string" ? userMetadata.username : null) || (typeof userMetadata.user_name === "string" ? userMetadata.user_name : null) || (typeof user?.email === "string" ? user.email.split("@")[0] : null) || "user";
	const myAvatarUrl = myLatest?.author?.avatar || (typeof userMetadata.avatar_url === "string" ? userMetadata.avatar_url : null) || (typeof userMetadata.picture === "string" ? userMetadata.picture : null);
	const stories = import_react.useMemo(() => {
		const seen = /* @__PURE__ */ new Set();
		const list = [];
		for (const m of moments) {
			if (m.mine) continue;
			const uid = m.author?.id;
			if (!uid) continue;
			if (!seen.has(uid)) {
				seen.add(uid);
				list.push({
					userId: uid,
					username: m.author?.username ?? "user",
					displayName: m.author?.name || m.author?.username || "user",
					avatarUrl: m.author?.avatar ?? void 0,
					hasUnseen: true,
					momentId: m.id
				});
			}
		}
		return list;
	}, [moments]);
	const feedGroups = import_react.useMemo(() => {
		const groups = [];
		for (const video of videos) {
			const title = video.title.toLowerCase();
			const hasPortraitDimensions = typeof video.originalWidth === "number" && typeof video.originalHeight === "number" && video.originalHeight > video.originalWidth;
			const isVertical = video.aspectRatio === "9:16" || video.videoType === "vertical" || Boolean(video.isReel) || video.postType === "vertical" || hasPortraitDimensions || video.orientation === "portrait" || title.includes("#shorts") || title.includes("#reel");
			const previous = groups[groups.length - 1];
			if (isVertical && previous?.kind === "vertical" && previous.verticalPostsGroup.length < 2) previous.verticalPostsGroup.push(video);
			else if (isVertical) groups.push({
				kind: "vertical",
				verticalPostsGroup: [video]
			});
			else groups.push({
				kind: "standard",
				video
			});
		}
		return groups;
	}, [videos]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-black text-white pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-50 flex items-center justify-between border-b border-neutral-900 bg-black px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: yw_logo_default,
						alt: "YourWorld",
						className: "h-8 w-auto object-contain"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-bold text-xl tracking-tight bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent",
						children: "YourWorld"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/search",
						className: "p-2 rounded-full hover:bg-neutral-900 text-neutral-200 transition-colors",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "w-5 h-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/notifications",
						className: "relative p-2 rounded-full hover:bg-neutral-900 text-neutral-200 transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "w-5 h-5" }), alertCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute top-1 right-1 w-4 h-4 bg-pink-600 text-[10px] font-bold rounded-full flex items-center justify-center text-white",
							children: alertCount > 9 ? "9+" : alertCount
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 px-4 py-3 overflow-x-auto no-scrollbar border-b border-neutral-900/60 bg-black",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center gap-1 shrink-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							if (myLatest) navigate({
								to: "/moment/$momentId",
								params: { momentId: myLatest.id }
							});
							else navigate({ to: "/moment/create" });
						},
						className: "relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-full h-full rounded-full bg-neutral-900 border-2 border-black overflow-hidden flex items-center justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MomentAvatar, {
								username: myUsername,
								src: myAvatarUrl,
								alt: "Your avatar"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							role: "button",
							"aria-label": "Add another moment",
							onClick: (e) => {
								e.stopPropagation();
								navigate({ to: "/moment/create" });
							},
							className: "absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-pink-500 border-2 border-black",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
								className: "h-3 w-3 text-white",
								strokeWidth: 3
							})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-neutral-300 font-medium truncate max-w-[68px]",
						children: "Your moment"
					})]
				}), stories.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center gap-1 shrink-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							if (s.momentId) navigate({
								to: "/moment/$momentId",
								params: { momentId: s.momentId }
							});
						},
						className: "w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 via-purple-500 to-yellow-500 flex items-center justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-full h-full rounded-full bg-neutral-900 border-2 border-black overflow-hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MomentAvatar, {
								username: s.username,
								src: s.avatarUrl,
								alt: s.displayName
							})
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-neutral-400 truncate max-w-[68px]",
						children: s.displayName
					})]
				}, s.userId))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "max-w-lg mx-auto px-2 sm:px-4 py-4 space-y-4",
				children: !hydrated || loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-center py-12 text-neutral-500 text-sm",
					children: "Loading feed..."
				}) : videos.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-center py-12 text-neutral-500 text-sm",
					children: "No videos yet. Be the first to share!"
				}) : feedGroups.map((group) => group.kind === "vertical" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-2.5 px-3 py-2 w-full",
					children: group.verticalPostsGroup.map((video) => {
						const post = video;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							"aria-label": `Open ${post.title || "Shorts"}`,
							onClick: (event) => openWatchPage(event, post.id),
							onTouchEnd: (event) => openWatchPage(event, post.id),
							className: "relative aspect-[9/16] cursor-pointer touch-manipulation select-none overflow-hidden rounded-2xl bg-zinc-900",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoPoster, {
									mediaUrl: post.media_url || post.mediaUrl,
									thumbnailUrl: post.thumbnail_url || post.poster_url || post.thumbnailUrl || void 0,
									alt: post.title || "Shorts",
									className: "pointer-events-none select-none"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "pointer-events-none absolute top-2 right-2 p-1 rounded-full bg-black/40 backdrop-blur-sm text-white/90",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EllipsisVertical, { className: "w-3.5 h-3.5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2.5 flex flex-col justify-end",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-semibold text-white line-clamp-2 leading-tight",
										children: post.title || "Shorts"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[10px] text-zinc-300 mt-1",
										children: [post.views_count || post.views || 0, " views"]
									})]
								})
							]
						}, post.id);
					})
				}, group.verticalPostsGroup[0]?.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LongVideoCard, {
					video: group.video,
					currentUserId,
					onView: countView,
					onLike: toggleLike,
					isSaved: !!saved[group.video.id],
					onToggleSave: toggleSave,
					onDeleted: () => reload()
				}, group.video.id))
			})
		]
	});
}
//#endregion
export { HomePage as component };
