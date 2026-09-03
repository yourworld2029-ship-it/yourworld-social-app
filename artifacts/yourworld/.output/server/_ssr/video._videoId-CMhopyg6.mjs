import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { Bt as Heart, Dn as Bookmark, Pn as ArrowLeft, U as Send, cn as Clock, tn as Download, xt as MessageCircle } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { D as timeAgo, O as usePostComments, i as Route$4, ot as cn, tt as useYw } from "./router-BP4WBONR.mjs";
import { i as sanitizeDownloadName, n as downloadVideoInBackground } from "./yw-download-PkFgTpC4.mjs";
import { a as resolveLongVideoUrl, n as formatDuration, o as useLongVideos, r as formatViews } from "./video-data-C2RufTYy.mjs";
import { t as VideoPoster } from "./VideoPoster-ij_KKcCT.mjs";
import { t as formatCount } from "./yw-data-CyapVFm6.mjs";
import { n as ShareSheet, t as CommentsSheet } from "./ShareSheet-KYZlGGJb.mjs";
import { r as usePostSaves, t as TrackedVideoPlayer } from "./TrackedVideoPlayer-C3dB5Ups.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/video._videoId-CMhopyg6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function WatchPage() {
	const { videoId } = Route$4.useParams();
	const navigate = useNavigate();
	const { videos, loading, currentUserId, countView, toggleLike } = useLongVideos();
	const { saved, toggleSave } = usePostSaves();
	const { comments: allComments } = usePostComments(videoId);
	const pinnedComments = allComments.filter((c) => c.pinned).slice(0, 4);
	const { following, toggleFollow } = useYw();
	const video = videos.find((v) => v.id === videoId) ?? null;
	const recommended = videos.filter((v) => v.id !== videoId);
	const [src, setSrc] = (0, import_react.useState)(null);
	const [commentCount, setCommentCount] = (0, import_react.useState)(video?.commentCount ?? 0);
	const [liking, setLiking] = (0, import_react.useState)(false);
	const counted = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		if (!video) return;
		let alive = true;
		resolveLongVideoUrl(video.mediaUrl).then((u) => alive && setSrc(u));
		return () => {
			alive = false;
		};
	}, [video]);
	(0, import_react.useEffect)(() => {
		if (video && !counted.current) {
			counted.current = true;
			countView(video.id);
		}
	}, [video, countView]);
	(0, import_react.useEffect)(() => {
		if (video) setCommentCount(video.commentCount);
	}, [video]);
	if (loading && !video) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-black text-white",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackBar, { onBack: () => navigate({ to: "/" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "py-20 text-center text-sm text-neutral-500",
			children: "Loading video…"
		})]
	});
	if (!video) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-black text-white",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackBar, { onBack: () => navigate({ to: "/" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "py-20 text-center text-sm text-neutral-500",
			children: [
				"Video not found.",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "text-pink-400 underline",
					children: "Back to feed"
				})
			]
		})]
	});
	const isMine = currentUserId === video.userId;
	const isFollowing = !!following[video.userId];
	const isSaved = !!saved[video.id];
	const portrait = video.orientation === "portrait";
	const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/video/${video.id}` : void 0;
	const handleLike = async () => {
		if (!currentUserId) {
			toast.error("Sign in to like videos");
			return;
		}
		if (liking) return;
		setLiking(true);
		try {
			await toggleLike(video.id);
		} catch {
			toast.error("Couldn't update like");
		} finally {
			setLiking(false);
		}
	};
	const handleSave = async () => {
		if (!currentUserId) {
			toast.error("Sign in to save videos");
			return;
		}
		try {
			const savedNow = await toggleSave(video.id);
			toast.success(savedNow === false ? "Removed from saved" : "Video saved");
		} catch {
			toast.error("Couldn't update saved videos");
		}
	};
	const handleDownload = async () => {
		const toastId = toast.loading("Downloading video... 0%");
		try {
			const url = src ?? await resolveLongVideoUrl(video.mediaUrl);
			await downloadVideoInBackground(url, `${sanitizeDownloadName(video.title, `yw-${video.id}`)}.mp4`, (percent) => toast.loading(`Downloading video... ${percent}%`, { id: toastId }));
			toast.success("Saved to your device", { id: toastId });
		} catch {
			toast.error("Couldn't save this video", { id: toastId });
		}
	};
	const upcoming = !!video.scheduledAt && new Date(video.scheduledAt).getTime() > Date.now();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-black text-white",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-lg",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-0 z-50 w-full bg-black shadow-lg",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackBar, {
					onBack: () => navigate({ to: "/" }),
					transparent: true
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "w-full bg-black",
					children: src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrackedVideoPlayer, {
						src,
						title: video.title,
						poster: video.thumbnailUrl,
						portrait,
						watchVideoId: video.id,
						watchTimeEnabled: !!currentUserId
					}, video.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("mx-auto w-full bg-black", portrait ? "max-h-[75vh] aspect-[9/16]" : "aspect-[16/9]"),
						children: video.thumbnailUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: video.thumbnailUrl,
							alt: video.title,
							className: "h-full w-full object-contain"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-full animate-pulse bg-zinc-900" })
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "overflow-y-auto px-3 pb-24 pt-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-base font-bold leading-snug text-white",
						children: video.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-[12px] text-zinc-400",
						children: [
							"@",
							video.author.username,
							" • ",
							formatViews(video.views),
							" • ",
							timeAgo(video.createdAt),
							video.durationSeconds ? ` • ${formatDuration(video.durationSeconds)}` : ""
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex items-center gap-2.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/u/$userId",
								params: { userId: video.userId },
								className: "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#8b2fc9] text-sm font-bold text-white",
								children: video.author.letter
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/u/$userId",
								params: { userId: video.userId },
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "truncate text-sm font-semibold text-white",
									children: ["@", video.author.username]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-[11px] text-zinc-400",
									children: video.author.name
								})]
							}),
							!isMine && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => toggleFollow(video.userId),
								className: cn("rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all active:scale-95", isFollowing ? "bg-zinc-800 text-white" : "bg-white text-black"),
								children: isFollowing ? "Following" : "Follow"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: handleLike,
								disabled: liking,
								"aria-label": "Like",
								className: "flex shrink-0 items-center gap-1.5 rounded-full bg-[#272727] px-3.5 py-2 text-xs font-medium text-white transition-transform active:scale-95 disabled:opacity-60",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, {
									size: 18,
									className: video.likedByMe ? "fill-pink-500 text-pink-500" : "text-white"
								}), video.likeCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatCount(video.likeCount) })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommentsSheet, {
								postId: video.id,
								onCountChange: setCommentCount,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									"aria-label": "Comments",
									className: "flex shrink-0 items-center gap-1.5 rounded-full bg-[#272727] px-3.5 py-2 text-xs font-medium text-white transition-transform active:scale-95",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 18 }), commentCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatCount(commentCount) })]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShareSheet, {
								title: video.title,
								url: shareUrl,
								media: src ?? void 0,
								mediaKind: "video",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									"aria-label": "Share",
									className: "flex shrink-0 items-center gap-1.5 rounded-full bg-[#272727] px-3.5 py-2 text-xs font-medium text-white transition-transform active:scale-95",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { size: 17 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Share" })]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: handleDownload,
								"aria-label": "Download",
								className: "flex shrink-0 items-center gap-1.5 rounded-full bg-[#272727] px-3.5 py-2 text-xs font-medium text-white transition-transform active:scale-95",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 17 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Save" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: handleSave,
								"aria-label": "Save",
								className: "flex shrink-0 items-center gap-1.5 rounded-full bg-[#272727] px-3.5 py-2 text-xs font-medium text-white transition-transform active:scale-95",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, {
									size: 18,
									className: isSaved ? "fill-white text-white" : "text-white"
								}), isSaved && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Saved" })]
							})
						]
					}),
					upcoming && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-[11px] font-semibold text-amber-400",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { size: 12 }),
							" Scheduled for ",
							new Date(video.scheduledAt).toLocaleString()
						]
					}),
					video.caption && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 whitespace-pre-line text-xs leading-relaxed text-zinc-300",
						children: video.caption
					}),
					video.hashtags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-1.5",
						children: video.hashtags.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400",
							children: t
						}, t))
					}),
					pinnedComments.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 space-y-2 rounded-xl bg-[#181818] p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] font-semibold uppercase tracking-wide text-pink-400",
							children: "Pinned comments"
						}), pinnedComments.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/u/$userId",
								params: { userId: c.userId },
								className: "font-semibold text-white",
								children: ["@", c.username]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-1.5 text-zinc-300",
								children: c.body
							})]
						}, c.id))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommentsSheet, {
							postId: video.id,
							onCountChange: setCommentCount,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "flex w-full items-center gap-3 rounded-xl bg-[#272727] px-3 py-3 text-left transition-colors active:bg-zinc-800",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {
										size: 18,
										className: "text-zinc-300"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-sm font-semibold text-white",
											children: [
												commentCount,
												" ",
												commentCount === 1 ? "Comment" : "Comments"
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] text-zinc-400",
											children: "Tap to view & add a comment"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] font-medium text-pink-400",
										children: "Open"
									})
								]
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 px-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mb-3 text-sm font-semibold text-zinc-300",
							children: "Recommended"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [recommended.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecommendedRow, { video: r }, r.id)), recommended.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "py-6 text-center text-xs text-neutral-600",
								children: "No more videos yet."
							})]
						})]
					})
				]
			})]
		})
	});
}
function RecommendedRow({ video }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/video/$videoId",
		params: { videoId: video.id },
		className: "block overflow-hidden rounded-xl bg-zinc-900/60 transition-colors active:bg-zinc-800",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative aspect-video w-full overflow-hidden bg-zinc-900",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoPoster, {
				thumbnailUrl: video.thumbnailUrl,
				mediaUrl: video.mediaUrl,
				alt: video.title
			}), video.durationSeconds ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-white",
				children: formatDuration(video.durationSeconds)
			}) : null]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "px-3 py-2.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "line-clamp-2 text-sm font-semibold leading-snug text-white",
					children: video.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-[11px] text-zinc-400",
					children: ["@", video.author.username]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-[11px] text-zinc-500",
					children: [
						formatViews(video.views),
						" · ",
						timeAgo(video.createdAt)
					]
				})
			]
		})]
	});
}
function BackBar({ onBack, transparent }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("flex items-center px-2 py-2", transparent ? "absolute left-0 right-0 top-0 z-[60]" : "border-b border-zinc-900 bg-black"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			onClick: onBack,
			"aria-label": "Back",
			className: cn("grid h-9 w-9 place-items-center rounded-full transition-colors", transparent ? "bg-black/50 text-white backdrop-blur hover:bg-black/70" : "text-white hover:bg-zinc-900"),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 20 })
		})
	});
}
//#endregion
export { WatchPage as component };
