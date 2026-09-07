import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { h as useParams, m as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { D as Sun, Ft as Heart, H as Send, Ht as Eye, J as Reply, Jt as Download, S as Trash2, T as ThumbsDown, Tn as ArrowLeft, Tt as LockOpen, _t as MessageCircle, bt as Maximize2, c as Volume2, en as Clock, fn as ChevronDown, g as UserPlus, ln as ChevronUp, pn as Check, t as ZoomIn, vn as Bookmark, w as ThumbsUp, wt as Lock, z as Share2 } from "../_libs/lucide-react.mjs";
import { B as isVideoQualityTier, D as usePostComments, H as registerUniqueView, V as qualityTierFromDimensions, ct as useYw, m as useAuth, pt as cn, ut as setFollow } from "./router-P_p1Hfor.mjs";
import { t as Button } from "./button-BUhtJMuh.mjs";
import { t as Input } from "./input-CtaUN6Bi.mjs";
import { i as downloadVideoInBackground, o as sanitizeDownloadName, r as downloadVideoAtQuality, t as downloadAudioOnly } from "./yw-download-BPLGXv6_.mjs";
import { n as formatDuration, r as formatViews } from "./video-data-okvuIVP9.mjs";
import { t as VideoPoster } from "./VideoPoster-DFkO2IpH.mjs";
import { t as DownloadSheet } from "./DownloadSheet-BD0LgG3P.mjs";
import { t as VideoErrorFallback } from "./video._videoId-BQU8555B.mjs";
import { t as formatDistanceToNow } from "../_libs/date-fns.mjs";
import { n as AvatarFallback$1, r as AvatarImage$1, t as Avatar$1 } from "../_libs/radix-ui__react-avatar.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/video._videoId-CBIHc8x8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Avatar = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar$1, {
	ref,
	className: cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className),
	...props
}));
Avatar.displayName = Avatar$1.displayName;
var AvatarImage = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage$1, {
	ref,
	className: cn("aspect-square h-full w-full", className),
	...props
}));
AvatarImage.displayName = AvatarImage$1.displayName;
var AvatarFallback = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback$1, {
	ref,
	className: cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className),
	...props
}));
AvatarFallback.displayName = AvatarFallback$1.displayName;
var liveFollowsTable = (client) => client.from("follows");
function cleanVideoId(value) {
	if (typeof value !== "string") return "";
	let decoded = value;
	try {
		decoded = decodeURIComponent(value);
	} catch {}
	return decoded.trim().replace(/(?:\)|%29)+$/gi, "").replace(/[^a-zA-Z0-9-]/g, "");
}
function safeTimeAgo(value) {
	if (!value) return "";
	const date = new Date(value);
	if (!Number.isFinite(date.getTime())) return "";
	try {
		return formatDistanceToNow(date, { addSuffix: true });
	} catch {
		return "";
	}
}
function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}
function touchDistance(touches) {
	if (touches.length < 2) return 0;
	const first = touches.item(0);
	const second = touches.item(1);
	if (!first || !second) return 0;
	return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
}
function VideoWatchPage() {
	const params = useParams({ strict: false });
	const videoId = typeof params?.videoId === "string" ? params.videoId : "";
	if (!videoId) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoErrorFallback, {});
	const cleanId = cleanVideoId(videoId);
	if (!cleanId) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoErrorFallback, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoWatchContent, { videoId: cleanId });
}
function VideoWatchContent({ videoId }) {
	const navigate = useNavigate();
	const { user } = useAuth();
	const { liked, saved, toggleLike, toggleSave } = useYw();
	const queryClient = useQueryClient();
	const videoRef = (0, import_react.useRef)(null);
	const containerRef = (0, import_react.useRef)(null);
	const [commentText, setCommentText] = (0, import_react.useState)("");
	const [descriptionExpanded, setDescriptionExpanded] = (0, import_react.useState)(false);
	const [disliked, setDisliked] = (0, import_react.useState)(false);
	const [downloadOpen, setDownloadOpen] = (0, import_react.useState)(false);
	const [likeCount, setLikeCount] = (0, import_react.useState)(0);
	const [zoom, setZoom] = (0, import_react.useState)(1);
	const [displayMode, setDisplayMode] = (0, import_react.useState)("fit");
	const [brightness, setBrightness] = (0, import_react.useState)(1);
	const [isFullscreen, setIsFullscreen] = (0, import_react.useState)(false);
	const [screenLocked, setScreenLocked] = (0, import_react.useState)(false);
	const [gestureFeedback, setGestureFeedback] = (0, import_react.useState)(null);
	const touchGestureRef = (0, import_react.useRef)(null);
	const lastTapRef = (0, import_react.useRef)(null);
	const feedbackTimerRef = (0, import_react.useRef)(null);
	const playedSecondsRef = (0, import_react.useRef)(0);
	const lastVideoTimeRef = (0, import_react.useRef)(null);
	const { data: video, isLoading, isError } = useQuery({
		queryKey: ["video-detail", videoId],
		queryFn: async () => {
			try {
				const { data, error } = await supabase.from("posts").select("*").eq("id", videoId).maybeSingle();
				if (error || !data) {
					if (error) console.error("Error fetching video:", error);
					return null;
				}
				let profile = null;
				if (data.user_id) try {
					const { data: profiles } = await supabase.rpc("get_public_profiles", { ids: [data.user_id] });
					profile = (profiles ?? [])[0] ?? null;
				} catch (cause) {
					console.error("Error fetching video creator:", cause);
				}
				const metadata = data;
				const sourceQualityTier = isVideoQualityTier(metadata.source_quality_tier) ? metadata.source_quality_tier : qualityTierFromDimensions(metadata.original_width, metadata.original_height);
				return {
					...data,
					sourceQualityTier,
					user: profile
				};
			} catch (cause) {
				console.error("Error fetching video:", cause);
				return null;
			}
		},
		retry: 1
	});
	const creatorId = video?.user_id || video?.user?.id || "";
	const { data: subscribed = false } = useQuery({
		queryKey: [
			"video-subscription",
			creatorId,
			user?.id
		],
		queryFn: async () => {
			if (!creatorId || !user?.id || creatorId === user.id) return false;
			try {
				const { data, error } = await liveFollowsTable(supabase).select("id").eq("follower_id", user.id).eq("following_id", creatorId).maybeSingle();
				if (error) {
					console.error("Error fetching subscription:", error);
					return false;
				}
				return Boolean(data);
			} catch (cause) {
				console.error("Error fetching subscription:", cause);
				return false;
			}
		},
		enabled: Boolean(creatorId && user?.id && creatorId !== user.id)
	});
	const { data: subscriberCount = 0 } = useQuery({
		queryKey: ["video-subscriber-count", creatorId],
		queryFn: async () => {
			if (!creatorId) return 0;
			try {
				const { data, error } = await supabase.rpc("get_follow_counts", { ids: [creatorId] });
				if (error) {
					console.error("Error fetching subscriber count:", error);
					return 0;
				}
				return Number((data ?? [])[0]?.followers ?? 0);
			} catch (cause) {
				console.error("Error fetching subscriber count:", cause);
				return 0;
			}
		},
		enabled: Boolean(creatorId)
	});
	const realComments = usePostComments(videoId);
	const comments = realComments.comments;
	const [replyingTo, setReplyingTo] = (0, import_react.useState)(null);
	const [replyText, setReplyText] = (0, import_react.useState)("");
	const [expandedThreads, setExpandedThreads] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const repliesByParent = /* @__PURE__ */ new Map();
	comments.forEach((comment) => {
		if (!comment.parentCommentId) return;
		const replies = repliesByParent.get(comment.parentCommentId) ?? [];
		replies.push(comment);
		repliesByParent.set(comment.parentCommentId, replies);
	});
	const { data: relatedVideos = [] } = useQuery({
		queryKey: ["related-videos", videoId],
		queryFn: async () => {
			try {
				const { data, error } = await supabase.from("posts").select("*").neq("id", videoId).order("created_at", { ascending: false }).limit(12);
				if (error) {
					console.error("Error fetching related videos:", error);
					return [];
				}
				const videos = (data ?? []).filter((row) => {
					const kind = String(row.kind ?? row.media_type ?? "").toLowerCase();
					return kind === "video" || !kind && Boolean(row.duration_seconds || row.video_url);
				});
				const userIds = [...new Set(videos.map((row) => row.user_id).filter((id) => typeof id === "string"))];
				let profileById = /* @__PURE__ */ new Map();
				if (userIds.length) {
					const { data: profiles } = await supabase.rpc("get_public_profiles", { ids: userIds });
					profileById = new Map((profiles ?? []).filter((profile) => Boolean(profile.id)).map((profile) => [profile.id, profile]));
				}
				return videos.map((row) => ({
					...row,
					id: String(row.id ?? ""),
					title: typeof row.title === "string" ? row.title : null,
					caption: typeof row.caption === "string" ? row.caption : null,
					media_url: typeof row.media_url === "string" ? row.media_url : null,
					thumbnail_url: typeof row.thumbnail_url === "string" ? row.thumbnail_url : null,
					duration_seconds: typeof row.duration_seconds === "number" ? row.duration_seconds : null,
					user: typeof row.user_id === "string" && profileById.get(row.user_id) || null
				}));
			} catch (cause) {
				console.error("Error fetching related videos:", cause);
				return [];
			}
		}
	});
	const subscribeMutation = useMutation({
		mutationFn: async () => {
			if (!user?.id) throw new Error("Sign in to subscribe");
			if (!creatorId || creatorId === user.id) throw new Error("You can't subscribe to yourself");
			return setFollow(creatorId, !subscribed);
		},
		onMutate: async () => {
			await queryClient.cancelQueries({ queryKey: [
				"video-subscription",
				creatorId,
				user?.id
			] });
			await queryClient.cancelQueries({ queryKey: ["video-subscriber-count", creatorId] });
			const previousSubscribed = queryClient.getQueryData([
				"video-subscription",
				creatorId,
				user?.id
			]);
			const previousCount = queryClient.getQueryData(["video-subscriber-count", creatorId]);
			queryClient.setQueryData([
				"video-subscription",
				creatorId,
				user?.id
			], !subscribed);
			queryClient.setQueryData(["video-subscriber-count", creatorId], Math.max(0, (previousCount ?? subscriberCount) + (subscribed ? -1 : 1)));
			return {
				previousSubscribed,
				previousCount
			};
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [
				"video-subscription",
				creatorId,
				user?.id
			] });
			queryClient.invalidateQueries({ queryKey: ["video-subscriber-count", creatorId] });
			toast.success(subscribed ? "Unfollowed" : "Followed");
		},
		onError: (cause, _variables, context) => {
			queryClient.setQueryData([
				"video-subscription",
				creatorId,
				user?.id
			], context?.previousSubscribed ?? subscribed);
			queryClient.setQueryData(["video-subscriber-count", creatorId], context?.previousCount ?? subscriberCount);
			toast.error(cause instanceof Error ? cause.message : "Couldn't update subscription");
		}
	});
	const viewRecordedRef = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		viewRecordedRef.current = false;
		playedSecondsRef.current = 0;
		lastVideoTimeRef.current = null;
	}, [videoId]);
	const handleVideoTimeUpdate = (event) => {
		const currentTime = Number.isFinite(event.currentTarget.currentTime) ? event.currentTarget.currentTime : 0;
		const previousTime = lastVideoTimeRef.current;
		lastVideoTimeRef.current = currentTime;
		const delta = previousTime === null ? 0 : currentTime - previousTime;
		if (viewRecordedRef.current || !user?.id || delta <= 0 || delta > 2) return;
		playedSecondsRef.current += delta;
		if (playedSecondsRef.current < 3) return;
		viewRecordedRef.current = true;
		registerUniqueView(videoId, "video").then((counted) => {
			if (!counted) return;
			queryClient.setQueryData(["video-detail", videoId], (current) => current ? {
				...current,
				views_count: Number(current.views_count ?? current.views ?? 0) + 1
			} : current);
		}).catch((cause) => {
			viewRecordedRef.current = false;
			console.error("Unable to register video view", cause);
		});
	};
	(0, import_react.useEffect)(() => {
		const initialCount = video?.likes_count ?? video?.like_count ?? video?.likes ?? 0;
		setLikeCount(Number(initialCount));
	}, [
		video?.id,
		video?.like_count,
		video?.likes,
		video?.likes_count
	]);
	(0, import_react.useEffect)(() => () => {
		if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
	}, []);
	(0, import_react.useEffect)(() => {
		const syncFullscreenState = () => {
			const fullscreen = document.fullscreenElement === containerRef.current;
			setIsFullscreen(fullscreen);
			if (!fullscreen) setScreenLocked(false);
		};
		document.addEventListener("fullscreenchange", syncFullscreenState);
		syncFullscreenState();
		return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
	}, []);
	const submitComment = () => {
		if (!user || !commentText.trim()) return;
		const text = commentText;
		setCommentText("");
		realComments.send(text).then((ok) => {
			if (!ok) {
				setCommentText(text);
				toast.error("Failed to post comment");
			} else toast.success("Comment added");
		});
	};
	const submitReply = () => {
		if (!user || !replyingTo || !replyText.trim()) return;
		const text = replyText;
		const parentId = replyingTo;
		setReplyText("");
		realComments.sendReply(text, parentId).then((ok) => {
			if (!ok) {
				setReplyText(text);
				toast.error("Failed to post reply");
			} else {
				setReplyingTo(null);
				setExpandedThreads((current) => new Set(current).add(parentId));
			}
		});
	};
	const toggleCommentLike = (commentId) => {
		if (!user) {
			toast.error("Sign in to like comments");
			return;
		}
		realComments.toggleLike(commentId).then((ok) => {
			if (!ok) toast.error("Couldn't update comment like");
		});
	};
	const renderComment = (comment, depth = 0) => {
		const username = comment.username || "user";
		const replies = repliesByParent.get(comment.id) ?? [];
		const expanded = expandedThreads.has(comment.id);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-2",
			style: { marginLeft: Math.min(depth, 3) * 18 },
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
					className: "mt-0.5 h-7 w-7 shrink-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: comment.avatarUrl || void 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
						className: "bg-gray-700 text-xs text-white",
						children: username.charAt(0).toUpperCase() || "U"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1 text-xs",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-0.5 flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-semibold text-gray-300",
								children: ["@", username]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] text-gray-500",
								children: safeTimeAgo(comment.createdAt)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-gray-100",
							children: comment.body
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex items-center gap-3 text-[11px] text-gray-500",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => toggleCommentLike(comment.id),
									className: `inline-flex items-center gap-1 transition-colors ${comment.likedByMe ? "font-semibold text-rose-400" : "hover:text-white"}`,
									"aria-label": comment.likedByMe ? "Unlike comment" : "Like comment",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, {
										className: "h-3.5 w-3.5",
										fill: comment.likedByMe ? "currentColor" : "none"
									}), comment.likesCount > 0 ? comment.likesCount : "Like"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => {
										setReplyingTo(comment.id);
										setReplyText(`@${username} `);
										setExpandedThreads((current) => new Set(current).add(comment.id));
									},
									className: "inline-flex items-center gap-1 hover:text-white",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reply, { className: "h-3.5 w-3.5" }), " Reply"]
								}),
								replies.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setExpandedThreads((current) => {
										const next = new Set(current);
										if (next.has(comment.id)) next.delete(comment.id);
										else next.add(comment.id);
										return next;
									}),
									className: "inline-flex items-center gap-1 font-semibold text-pink-300",
									children: [
										expanded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-3.5 w-3.5" }),
										expanded ? "Hide" : "View",
										" ",
										replies.length,
										" ",
										replies.length === 1 ? "reply" : "replies"
									]
								}),
								comment.userId === user?.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => void realComments.remove(comment.id),
									className: "inline-flex items-center gap-1 hover:text-red-300",
									"aria-label": "Delete comment",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" })
								})
							]
						}),
						replyingTo === comment.id && user && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								autoFocus: true,
								value: replyText,
								onChange: (event) => setReplyText(event.target.value),
								onKeyDown: (event) => event.key === "Enter" && submitReply(),
								placeholder: "Write a reply...",
								className: "h-9 rounded-full border-white/10 bg-white/5 text-xs text-white"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								onClick: submitReply,
								className: "h-9 rounded-full bg-pink-600 px-3 text-white",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-3.5 w-3.5" })
							})]
						})
					]
				})]
			}), expanded && replies.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-3 border-l border-white/10 pl-2",
				children: replies.map((reply) => renderComment(reply, depth + 1))
			}) : null]
		}, comment.id);
	};
	const handleShare = async () => {
		try {
			if (navigator.share) await navigator.share({
				title: video?.title || "Watch Video",
				url: window.location.href
			});
			else {
				await navigator.clipboard.writeText(window.location.href);
				toast.success("Link copied to clipboard");
			}
		} catch {}
	};
	const handleLike = () => {
		if (!user) {
			toast.error("Sign in to like videos");
			return;
		}
		const wasLiked = Boolean(liked[videoId]);
		setDisliked(false);
		setLikeCount((count) => Math.max(0, count + (wasLiked ? -1 : 1)));
		toggleLike(videoId);
	};
	const handleDislike = () => {
		if (!user) {
			toast.error("Sign in to react to videos");
			return;
		}
		setDisliked((value) => !value);
		if (liked[videoId]) {
			toggleLike(videoId);
			setLikeCount((count) => Math.max(0, count - 1));
		}
	};
	const toggleFullscreen = () => {
		if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.();
		else document.exitFullscreen?.();
	};
	const toggleScreenLock = () => {
		if (!isFullscreen) return;
		setScreenLocked((locked) => !locked);
	};
	const showGestureFeedback = (kind, value, label) => {
		setGestureFeedback({
			kind,
			value,
			label
		});
		if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
		feedbackTimerRef.current = window.setTimeout(() => {
			setGestureFeedback(null);
			feedbackTimerRef.current = null;
		}, 900);
	};
	const toggleDisplayMode = () => {
		if (zoom > 1 || displayMode === "fill") {
			setZoom(1);
			setDisplayMode("fit");
		} else setDisplayMode("fill");
	};
	const handleDoubleTap = () => {
		if (!isFullscreen || screenLocked) return;
		toggleDisplayMode();
	};
	const handleTouchStart = (event) => {
		if (!isFullscreen || screenLocked) return;
		const rect = event.currentTarget.getBoundingClientRect();
		const firstTouch = event.touches.item(0);
		if (!firstTouch) return;
		if (event.touches.length >= 2) {
			event.preventDefault();
			touchGestureRef.current = {
				startX: firstTouch.clientX - rect.left,
				startY: firstTouch.clientY - rect.top,
				width: rect.width,
				moved: true,
				initialVolume: videoRef.current?.volume ?? 1,
				initialBrightness: brightness,
				initialDistance: touchDistance(event.touches),
				initialZoom: zoom
			};
			return;
		}
		touchGestureRef.current = {
			startX: firstTouch.clientX - rect.left,
			startY: firstTouch.clientY - rect.top,
			width: rect.width,
			moved: false,
			initialVolume: videoRef.current?.volume ?? 1,
			initialBrightness: brightness,
			initialDistance: null,
			initialZoom: zoom
		};
	};
	const handleTouchMove = (event) => {
		if (!isFullscreen || screenLocked) return;
		const gesture = touchGestureRef.current;
		if (!gesture) return;
		if (event.touches.length >= 2 && gesture.initialDistance) {
			event.preventDefault();
			const distance = touchDistance(event.touches);
			if (!distance) return;
			const nextZoom = clamp(gesture.initialZoom * (distance / gesture.initialDistance), 1, 4);
			gesture.moved = true;
			setZoom(nextZoom);
			setDisplayMode(nextZoom > 1.05 ? "fill" : "fit");
			showGestureFeedback("zoom", nextZoom, `${nextZoom.toFixed(1)}×`);
			return;
		}
		const firstTouch = event.touches.item(0);
		if (!firstTouch) return;
		const deltaY = firstTouch.clientY - gesture.startY;
		const deltaX = firstTouch.clientX - (gesture.startX + event.currentTarget.getBoundingClientRect().left);
		if (Math.abs(deltaY) < 12 || Math.abs(deltaY) < Math.abs(deltaX)) return;
		event.preventDefault();
		gesture.moved = true;
		if (gesture.startX < gesture.width / 2) {
			const nextBrightness = clamp(gesture.initialBrightness - deltaY / 280, .3, 1.5);
			setBrightness(nextBrightness);
			showGestureFeedback("brightness", nextBrightness, `${Math.round(nextBrightness * 100)}%`);
		} else {
			const nextVolume = clamp(gesture.initialVolume - deltaY / 280, 0, 1);
			if (videoRef.current) videoRef.current.volume = nextVolume;
			showGestureFeedback("volume", nextVolume, `${Math.round(nextVolume * 100)}%`);
		}
	};
	const handleTouchEnd = (event) => {
		if (!isFullscreen || screenLocked) return;
		const gesture = touchGestureRef.current;
		touchGestureRef.current = null;
		if (!gesture || gesture.moved) return;
		const now = Date.now();
		const previousTap = lastTapRef.current;
		if (previousTap && now - previousTap.time < 320 && Math.abs(gesture.startX - previousTap.x) < 48) {
			event.preventDefault();
			toggleDisplayMode();
			lastTapRef.current = null;
			return;
		}
		lastTapRef.current = {
			time: now,
			x: gesture.startX
		};
	};
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col items-center justify-center bg-black text-white",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mb-4 h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-gray-400",
			children: "Loading video..."
		})]
	});
	if (isError || !video) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoErrorFallback, {});
	const mediaUrl = video.media_url || video.video_url || video.url || "";
	const creatorUsername = video.user?.username || "user";
	const creatorName = video.user?.full_name || video.user?.display_name || creatorUsername || "Creator";
	const viewCount = video.views_count || video.views || 0;
	const timeAgo = safeTimeAgo(video.created_at);
	const currentAvatar = typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : void 0;
	const description = video.caption || "No description provided.";
	const sourceQualityTier = video.sourceQualityTier ?? (isVideoQualityTier(video.source_quality_tier) ? video.source_quality_tier : qualityTierFromDimensions(video.original_width, video.original_height));
	const downloadSelected = async (choice) => {
		if (!mediaUrl) throw new Error("This video has no downloadable media");
		const toastId = toast.loading("Preparing download... 0%");
		const baseName = sanitizeDownloadName(video.title || "yourworld-video", `yourworld-${videoId}`);
		try {
			if (choice === "mp3") await downloadAudioOnly(mediaUrl, baseName, (percent) => toast.loading(`Preparing MP3 audio... ${percent}%`, { id: toastId }));
			else if (choice === "original" || choice === sourceQualityTier) await downloadVideoInBackground(mediaUrl, `${baseName}.mp4`, (percent) => toast.loading(`Downloading original video... ${percent}%`, { id: toastId }));
			else await downloadVideoAtQuality(mediaUrl, baseName, choice, (percent) => toast.loading(`Creating ${choice} video... ${percent}%`, { id: toastId }));
			toast.success("Download started", { id: toastId });
		} catch (cause) {
			console.error("Video download failed:", cause);
			toast.error("Couldn't prepare this download", { id: toastId });
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-black pb-20 text-white",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: containerRef,
			className: `sticky relative top-0 z-40 flex w-full items-center justify-center overflow-hidden bg-black shadow-lg ${isFullscreen ? "h-screen max-h-none" : "aspect-video max-h-[45vh] sm:max-h-[55vh]"}`,
			onDoubleClick: handleDoubleTap,
			onTouchStart: handleTouchStart,
			onTouchMove: handleTouchMove,
			onTouchEnd: handleTouchEnd,
			style: { touchAction: "none" },
			children: [
				mediaUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
					ref: videoRef,
					src: mediaUrl,
					controls: !screenLocked,
					controlsList: "nodownload",
					disablePictureInPicture: false,
					autoPlay: true,
					playsInline: true,
					onTimeUpdate: handleVideoTimeUpdate,
					className: `h-full w-full ${displayMode === "fill" ? "object-cover" : "object-contain"}`,
					style: {
						transform: `scale(${zoom})`,
						transformOrigin: "center center",
						objectFit: displayMode === "fill" ? "cover" : "contain",
						filter: `brightness(${brightness})`,
						transition: gestureFeedback?.kind === "zoom" ? "none" : "transform 160ms ease-out"
					}
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-sm text-gray-500",
					children: "No media URL found"
				}),
				!screenLocked && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-none absolute inset-0 z-50",
					children: [
						gestureFeedback?.kind === "seek" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `pointer-events-none absolute top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 ${gestureFeedback.value > 0 ? "right-1/4" : "left-1/4"}`,
							"aria-live": "polite",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute h-20 w-20 animate-ping rounded-full border border-white/50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-16 w-16 place-items-center rounded-full bg-black/65 text-sm font-bold text-white backdrop-blur-sm",
								children: gestureFeedback.label
							})]
						}) : null,
						isFullscreen && gestureFeedback?.kind === "volume" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pointer-events-none absolute right-5 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 rounded-full bg-black/60 px-2.5 py-3 text-white backdrop-blur-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "h-4 w-4" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex h-24 w-1.5 items-end overflow-hidden rounded-full bg-white/25",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-full rounded-full bg-white transition-[height]",
										style: { height: `${gestureFeedback.value * 100}%` }
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-semibold",
									children: gestureFeedback.label
								})
							]
						}) : null,
						isFullscreen && gestureFeedback?.kind === "brightness" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pointer-events-none absolute left-5 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 rounded-full bg-black/60 px-2.5 py-3 text-white backdrop-blur-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "h-4 w-4" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex h-24 w-1.5 items-end overflow-hidden rounded-full bg-white/25",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-full rounded-full bg-yellow-300 transition-[height]",
										style: { height: `${(gestureFeedback.value - .3) / 1.2 * 100}%` }
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-semibold",
									children: gestureFeedback.label
								})
							]
						}) : null,
						isFullscreen && gestureFeedback?.kind === "zoom" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-black/65 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomIn, { className: "h-4 w-4" }), gestureFeedback.label]
						}) : null
					]
				}),
				isFullscreen && screenLocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 z-[60] flex items-center justify-center bg-black/10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: toggleScreenLock,
						className: "inline-flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-black/85",
						"aria-label": "Unlock player controls",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockOpen, { className: "h-4 w-4" }), " Unlock controls"]
					})
				}) : null,
				!screenLocked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: toggleDisplayMode,
					onTouchStart: (event) => event.stopPropagation(),
					onTouchEnd: (event) => event.stopPropagation(),
					className: "absolute right-3 top-3 z-50 rounded-full bg-black/60 px-2.5 py-1.5 text-[10px] font-semibold text-white backdrop-blur-md transition hover:bg-black/80",
					"aria-label": zoom > 1 || displayMode === "fill" ? "Fit video to screen" : "Fill video screen",
					children: zoom > 1 || displayMode === "fill" ? "Fit" : "Fill"
				}),
				isFullscreen && !screenLocked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: toggleScreenLock,
					onTouchStart: (event) => event.stopPropagation(),
					onTouchEnd: (event) => event.stopPropagation(),
					className: "absolute right-28 top-3 z-50 rounded-full bg-black/60 p-2 text-white backdrop-blur-md transition hover:bg-black/80",
					"aria-label": screenLocked ? "Unlock player controls" : "Lock player controls",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-4 w-4" })
				}),
				!screenLocked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: toggleFullscreen,
					onTouchStart: (event) => event.stopPropagation(),
					onTouchEnd: (event) => event.stopPropagation(),
					className: "absolute right-16 top-3 z-50 rounded-full bg-black/60 p-2 text-white backdrop-blur-md transition hover:bg-black/80",
					"aria-label": "Toggle fullscreen",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Maximize2, { className: "h-4 w-4" })
				}),
				!screenLocked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => window.history.length > 1 ? window.history.back() : void navigate({ to: "/" }),
					className: "absolute left-3 top-3 z-50 rounded-full bg-black/60 p-2 text-white backdrop-blur-md transition-all hover:bg-black/80",
					"aria-label": "Go back",
					onTouchStart: (event) => event.stopPropagation(),
					onTouchEnd: (event) => event.stopPropagation(),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-5 w-5" })
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-4xl flex-1 flex-col space-y-4 px-4 py-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "line-clamp-2 text-lg font-bold text-white sm:text-xl",
					children: video.title || video.caption || "Untitled Video"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-xs text-gray-400",
					children: [viewCount ? `${viewCount} views • ` : "", timeAgo]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3 border-b border-white/10 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
							className: "h-10 w-10 border border-white/10",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: video.user?.avatar_url || void 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
								className: "bg-pink-600 font-bold text-white",
								children: creatorUsername.charAt(0).toUpperCase() || "U"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold text-white",
							children: creatorName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-gray-400",
							children: [
								"@",
								creatorUsername,
								" · ",
								subscriberCount.toLocaleString(),
								" subscribers"
							]
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "shrink-0 rounded-full bg-pink-600 px-3 text-xs text-white hover:bg-pink-700 disabled:opacity-50",
						onClick: () => subscribeMutation.mutate(),
						disabled: !user || creatorId === user.id || subscribeMutation.isPending,
						size: "sm",
						children: [subscribed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mr-1.5 h-3.5 w-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { className: "mr-1.5 h-3.5 w-3.5" }), subscribed ? "Following" : "Follow"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 overflow-x-auto py-2 flex-nowrap whitespace-nowrap no-scrollbar",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition-all",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: handleLike,
									className: `flex items-center gap-1.5 text-xs font-semibold transition-all ${liked[videoId] ? "text-pink-300" : "text-white"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThumbsUp, {
										className: "h-4 w-4",
										fill: liked[videoId] ? "currentColor" : "none"
									}), formatViews(likeCount)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-4 w-[1px] bg-white/20" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: handleDislike,
									"aria-label": "Dislike video",
									className: `flex items-center text-xs transition-all ${disliked ? "text-pink-300" : "text-white"}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThumbsDown, {
										className: "h-4 w-4",
										fill: disliked ? "currentColor" : "none"
									})
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							onClick: () => void handleShare(),
							variant: "outline",
							className: "shrink-0 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "mr-1.5 h-4 w-4" }), " Share"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							onClick: () => setDownloadOpen(true),
							variant: "outline",
							className: "shrink-0 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-1.5 h-4 w-4" }), " Download"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							onClick: () => {
								if (!user) {
									toast.error("Sign in to save videos");
									return;
								}
								toggleSave(videoId);
								toast.success(saved[videoId] ? "Removed from saved" : "Saved to your library");
							},
							variant: "outline",
							className: `shrink-0 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20 ${saved[videoId] ? "text-pink-300" : ""}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, {
								className: "mr-1.5 h-4 w-4",
								fill: saved[videoId] ? "currentColor" : "none"
							}), saved[videoId] ? "Saved" : "Save"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DownloadSheet, {
					open: downloadOpen,
					onOpenChange: setDownloadOpen,
					title: video.title || video.caption || "YourWorld video",
					durationSeconds: video.duration_seconds,
					sourceQualityTier,
					onDownload: downloadSelected
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl bg-white/5 p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-400",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-3.5 w-3.5" }),
									" ",
									formatViews(Number(viewCount))
								]
							}), timeAgo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-3.5 w-3.5" }),
									" ",
									timeAgo
								]
							}) : null]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: `text-xs leading-relaxed text-gray-300 ${descriptionExpanded ? "" : "line-clamp-3"}`,
							children: description
						}),
						description.length > 180 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setDescriptionExpanded((expanded) => !expanded),
							className: "mt-2 text-xs font-semibold text-white",
							children: descriptionExpanded ? "Show less" : "Show more"
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pt-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "mb-3 text-sm font-semibold text-white",
							children: [
								"Comments (",
								comments.length,
								")"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-4 flex gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
									className: "mt-1 h-9 w-9 shrink-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: currentAvatar }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
										className: "bg-pink-600 text-xs text-white",
										children: user?.email?.charAt(0).toUpperCase() || "U"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: commentText,
									onChange: (event) => setCommentText(event.target.value),
									onKeyDown: (event) => {
										if (event.key === "Enter" && commentText.trim()) submitComment();
									},
									disabled: !user,
									placeholder: user ? "Add a comment..." : "Sign in to comment",
									className: "h-10 rounded-full border-white/10 bg-white/5 text-xs text-white placeholder:text-gray-500"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									disabled: !commentText.trim() || !user,
									onClick: submitComment,
									size: "sm",
									className: "h-10 rounded-full bg-pink-600 px-4 text-white hover:bg-pink-700",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-4 w-4" })
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [comments.filter((comment) => !comment.parentCommentId).map((comment) => renderComment(comment)), !realComments.loading && comments.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "py-4 text-center text-xs text-gray-500",
								children: "No comments yet. Be the first."
							}) : null]
						})
					]
				}),
				relatedVideos.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "border-t border-white/10 pt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-base font-bold text-white",
							children: "Related videos"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-4 w-4 text-gray-500" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: relatedVideos.map((related) => {
							const relatedTitle = related.title || related.caption || "Untitled Video";
							const relatedCreator = related.user?.full_name || related.user?.display_name || related.user?.username || "Creator";
							const relatedMedia = related.media_url || related.video_url || related.url || "";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									if (!related.id) return;
									navigate({
										to: "/video/$videoId",
										params: { videoId: String(related.id) }
									});
								},
								className: "group text-left",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative aspect-video overflow-hidden rounded-xl bg-zinc-900",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoPoster, {
											thumbnailUrl: related.thumbnail_url,
											mediaUrl: relatedMedia,
											alt: relatedTitle
										}), related.duration_seconds ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-white",
											children: formatDuration(related.duration_seconds)
										}) : null]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "mt-2 line-clamp-2 text-sm font-semibold text-white group-hover:text-pink-300",
										children: relatedTitle
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 line-clamp-1 text-xs text-gray-400",
										children: [
											relatedCreator,
											" · ",
											formatViews(Number(related.views_count || related.views || 0))
										]
									})
								]
							}, related.id);
						})
					})]
				}) : null
			]
		})]
	});
}
//#endregion
export { VideoWatchPage as component };
