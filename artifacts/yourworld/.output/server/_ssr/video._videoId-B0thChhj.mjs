import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { Bt as Heart, C as Trash2, Dn as Bookmark, Fn as ArrowLeft, In as Archive, Qt as Ellipsis, St as MessageCircleOff, Tt as MapPin, U as Send, c as VolumeX, it as PinOff, jt as Link2, l as Volume2, rt as Pin, st as Pencil, tn as Download, xt as MessageCircle } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { L as isVideoQualityTier, O as useMediaPost, i as Route$4, k as usePostComments, mt as cn, w as resolveMediaUrl } from "./router-CBRKXEw0.mjs";
import { n as updateMyPost, t as deleteMyPost } from "./profile-data-DHVSCDbo.mjs";
import { t as YwAvatar } from "./Avatar-BuPM-nyN.mjs";
import { n as SheetContent, t as Sheet } from "./sheet-XjJOpSO0.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, t as Dialog } from "./dialog-Dm0zntCk.mjs";
import { t as Button } from "./button-DsBrO0ay.mjs";
import { t as Textarea } from "./textarea-DaCU_UO5.mjs";
import { i as downloadVideoInBackground, o as sanitizeDownloadName, t as downloadAudioOnly } from "./yw-download-CqpPKh1N.mjs";
import { t as Switch } from "./switch-CwI7-vng.mjs";
import { a as resolveLongVideoUrl } from "./video-data-Rmp-F1R4.mjs";
import { t as VideoPoster } from "./VideoPoster-BvWxfBBL.mjs";
import { t as formatCount } from "./yw-data-CyapVFm6.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-C_BZleDG.mjs";
import { n as DownloadSheet, r as ShareSheet, t as CommentsSheet } from "./DownloadSheet-BSNkimMs.mjs";
import { r as usePostSaves, t as TrackedVideoPlayer } from "./TrackedVideoPlayer-Df2l1RfX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/video._videoId-B0thChhj.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function MediaViewerPage() {
	const params = Route$4.useParams();
	const mediaPostId = (typeof params.videoId === "string" ? params.videoId.trim() : "") || null;
	const navigate = useNavigate();
	const { post, loading, error, currentUserId, toggleLike, countView, reload } = useMediaPost(mediaPostId);
	const { saved, toggleSave } = usePostSaves();
	const { comments } = usePostComments(mediaPostId);
	const [src, setSrc] = (0, import_react.useState)(null);
	const [avatarSrc, setAvatarSrc] = (0, import_react.useState)(null);
	const [muted, setMuted] = (0, import_react.useState)(true);
	const [liking, setLiking] = (0, import_react.useState)(false);
	const [downloadOpen, setDownloadOpen] = (0, import_react.useState)(false);
	const [manageOpen, setManageOpen] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [title, setTitle] = (0, import_react.useState)("");
	const [caption, setCaption] = (0, import_react.useState)("");
	const [location, setLocation] = (0, import_react.useState)("");
	const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [commentCount, setCommentCount] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (!post) return;
		let alive = true;
		const bucket = post.kind === "reel" ? "reels" : "videos";
		(post.kind === "reel" ? resolveMediaUrl(post.media_url, bucket) : resolveLongVideoUrl(post.media_url)).then((url) => alive && setSrc(url));
		resolveMediaUrl(post.authorAvatarUrl ?? "", "avatars").then((url) => alive && setAvatarSrc(url || null));
		setTitle(post.title ?? "");
		setCaption(post.caption ?? "");
		setLocation(post.location ?? "");
		return () => {
			alive = false;
		};
	}, [post]);
	(0, import_react.useEffect)(() => {
		setCommentCount(comments.length);
	}, [comments.length]);
	(0, import_react.useEffect)(() => {
		if (post) countView();
	}, [post, countView]);
	if (loading && !post) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ViewerState, { label: "Loading your media…" });
	if (!post) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ViewerState, {
		label: error ?? "This media is no longer available.",
		error: true
	});
	const isMine = currentUserId === post.user_id;
	const isSaved = !!saved[post.id];
	const isVideo = post.kind === "video" || post.kind === "reel" || post.media_type.startsWith("video");
	const ratio = mediaAspect(post);
	const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/video/${post.id}` : void 0;
	const back = () => {
		navigate({ to: "/profile" });
	};
	const handleLike = async () => {
		if (!currentUserId) {
			toast.error("Sign in to like this media");
			return;
		}
		if (liking) return;
		setLiking(true);
		try {
			await toggleLike();
		} catch {
			toast.error("Couldn't update like");
		} finally {
			setLiking(false);
		}
	};
	const handleSave = async () => {
		if (!currentUserId) {
			toast.error("Sign in to save this media");
			return;
		}
		try {
			const savedNow = await toggleSave(post.id);
			toast.success(savedNow ? "Saved to your collection" : "Removed from saved");
		} catch {
			toast.error("Couldn't update saved media");
		}
	};
	const updateManaged = async (patch, message) => {
		try {
			await updateMyPost(post.id, patch);
			toast.success(message);
			await reload();
		} catch (cause) {
			toast.error(cause instanceof Error ? cause.message : "Couldn't update media");
		}
	};
	const downloadSelected = async (choice) => {
		if (!src) return;
		const toastId = toast.loading("Preparing download…");
		try {
			const baseName = sanitizeDownloadName(post.caption || post.kind, `yw-${post.id}`);
			if (choice === "mp3") await downloadAudioOnly(src, baseName);
			else await downloadVideoInBackground(src, `${baseName}.mp4`);
			toast.success("Saved to your device", { id: toastId });
		} catch {
			toast.error("Couldn't save this media", { id: toastId });
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-[100dvh] bg-background pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "header-lux sticky top-0 z-50 flex items-center justify-between px-3 py-2.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"data-testid": "button-viewer-back",
						onClick: back,
						"aria-label": "Back to profile",
						className: "action-btn grid h-9 w-9 place-items-center rounded-full",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-5 w-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						"data-testid": "link-viewer-header-creator",
						to: "/u/$userId",
						params: { userId: post.user_id },
						className: "flex min-w-0 flex-1 items-center gap-2.5 px-2",
						children: [avatarSrc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: avatarSrc,
							alt: "",
							className: "h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-primary/40"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(YwAvatar, {
							user: post.author,
							size: 32
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 text-left",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "block truncate text-xs font-bold",
								children: ["@", post.author.username]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-[10px] uppercase tracking-[0.16em] text-muted-foreground",
								children: post.kind === "reel" ? "Reel" : "Post"
							})]
						})]
					}),
					isMine ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"data-testid": "button-viewer-manage",
						onClick: () => setManageOpen(true),
						"aria-label": "Manage post",
						className: "action-btn grid h-9 w-9 place-items-center rounded-full",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: "h-5 w-5" })
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "h-9 w-9",
						"aria-hidden": true
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mx-auto max-w-lg",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					"data-testid": "media-viewer-stage",
					className: "media-frame relative mx-3 mt-3 overflow-hidden rounded-[1.35rem] bg-black",
					style: { aspectRatio: ratio },
					children: [src ? isVideo ? post.kind !== "reel" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrackedVideoPlayer, {
						src,
						title: post.caption || "YourWorld video",
						poster: post.thumbnail_url,
						portrait: ratio < 1,
						autoPlay: true,
						watchVideoId: post.id,
						watchTimeEnabled: !!currentUserId
					}, post.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						"data-testid": "video-viewer-reel",
						src,
						autoPlay: true,
						loop: true,
						playsInline: true,
						muted,
						className: "h-full w-full object-contain",
						onClick: (event) => {
							const video = event.currentTarget;
							if (video.paused) video.play();
							else video.pause();
						}
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						"data-testid": "img-viewer-post",
						src,
						alt: post.caption || "YourWorld post",
						className: "h-full w-full object-contain"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoPoster, {
						mediaUrl: post.media_url,
						thumbnailUrl: post.thumbnail_url,
						alt: post.caption || "Loading media",
						className: "h-full w-full object-contain"
					}), post.kind === "reel" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"data-testid": "button-toggle-viewer-mute",
						onClick: () => setMuted((value) => !value),
						"aria-label": muted ? "Unmute reel" : "Mute reel",
						className: "absolute bottom-3 right-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur-md",
						children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "h-4 w-4" })
					}) : null]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "px-4 pt-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									"data-testid": "link-viewer-creator-avatar",
									to: "/u/$userId",
									params: { userId: post.user_id },
									className: "shrink-0",
									"aria-label": `Open @${post.author.username} profile`,
									children: avatarSrc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: avatarSrc,
										alt: `@${post.author.username} avatar`,
										className: "h-11 w-11 rounded-full object-cover ring-2 ring-primary/30"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(YwAvatar, {
										user: post.author,
										size: 44
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										"data-testid": "link-viewer-creator",
										to: "/u/$userId",
										params: { userId: post.user_id },
										className: "block truncate text-sm font-bold",
										children: ["@", post.author.username]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-xs text-muted-foreground",
										children: post.author.name
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-muted-foreground",
									children: [formatCount(post.views ?? 0), " views"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									"data-testid": "button-viewer-like",
									onClick: () => void handleLike(),
									disabled: liking,
									"aria-label": post.likedByMe ? "Unlike" : "Like",
									className: "action-btn flex shrink-0 items-center gap-2 rounded-full bg-secondary px-3.5 py-2 text-xs font-semibold disabled:opacity-60",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: cn("h-[18px] w-[18px]", post.likedByMe && "fill-primary text-primary") }), formatCount(post.likeCount)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommentsSheet, {
									postId: post.id,
									commentsDisabled: !!post.comments_off,
									onCountChange: setCommentCount,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										"data-testid": "button-viewer-comments",
										"aria-label": "Open comments",
										className: "action-btn flex shrink-0 items-center gap-2 rounded-full bg-secondary px-3.5 py-2 text-xs font-semibold",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-[18px] w-[18px]" }), formatCount(commentCount)]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShareSheet, {
									title: post.caption,
									url: shareUrl,
									media: src ?? void 0,
									mediaKind: isVideo ? "video" : "photo",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										"data-testid": "button-viewer-share",
										"aria-label": "Share",
										className: "action-btn flex shrink-0 items-center gap-2 rounded-full bg-secondary px-3.5 py-2 text-xs font-semibold",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-[17px] w-[17px]" }), "Share"]
									})
								}),
								isVideo && post.allow_download ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									"data-testid": "button-viewer-download",
									onClick: () => setDownloadOpen(true),
									"aria-label": "Download",
									className: "action-btn flex shrink-0 items-center gap-2 rounded-full bg-secondary px-3.5 py-2 text-xs font-semibold",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "h-[17px] w-[17px]" }), "Download"]
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									"data-testid": "button-viewer-save",
									onClick: () => void handleSave(),
									"aria-label": isSaved ? "Remove bookmark" : "Bookmark",
									className: "action-btn flex shrink-0 items-center gap-2 rounded-full bg-secondary px-3.5 py-2 text-xs font-semibold",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { className: cn("h-[18px] w-[18px]", isSaved && "fill-primary text-primary") }), isSaved ? "Saved" : "Save"]
								})
							]
						}),
						post.caption ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							"data-testid": "text-viewer-caption",
							className: "mt-4 whitespace-pre-line text-sm leading-relaxed",
							children: post.caption
						}) : null,
						post.location ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							"data-testid": "text-viewer-location",
							className: "mt-2 flex items-center gap-1.5 text-xs text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-3.5 w-3.5" }), post.location]
						}) : null,
						post.hashtags.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 flex flex-wrap gap-1.5",
							children: post.hashtags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "chip rounded-full px-2.5 py-1 text-[11px]",
								children: ["#", tag.replace(/^#/, "")]
							}, tag))
						}) : null
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: manageOpen,
				onOpenChange: setManageOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
					side: "bottom",
					className: "rounded-t-3xl border-border px-0 pb-6 pt-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-h-[70vh] overflow-y-auto",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "h-5 w-5" }),
								label: "Hide like count to others",
								toggle: !!post.hide_like_count,
								onToggle: (value) => void updateManaged({ hide_like_count: value }, value ? "Like count hidden" : "Like count visible")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-5 w-5" }),
								label: "Hide share count",
								toggle: !!post.hide_share_count,
								onToggle: (value) => void updateManaged({ hide_share_count: value }, value ? "Share count hidden" : "Share count visible")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircleOff, { className: "h-5 w-5" }),
								label: "Turn off commenting",
								toggle: !!post.comments_off,
								onToggle: (value) => void updateManaged({ comments_off: value }, value ? "Commenting turned off" : "Commenting turned on")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: post.pinned ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PinOff, { className: "h-5 w-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: "h-5 w-5" }),
								label: post.pinned ? "Unpin from your grid" : "Pin to your main grid",
								onClick: () => void updateManaged({ pinned: !post.pinned }, post.pinned ? "Unpinned" : "Pinned to your grid")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-5 w-5" }),
								label: "Edit caption and location",
								onClick: () => {
									setManageOpen(false);
									setEditing(true);
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "h-5 w-5" }),
								label: "Copy link",
								onClick: async () => {
									try {
										await navigator.clipboard.writeText(shareUrl ?? `${window.location.origin}/video/${post.id}`);
										toast.success("Link copied to clipboard");
									} catch {
										toast.error("Couldn't copy link");
									}
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Archive, { className: "h-5 w-5" }),
								label: post.archived ? "Unarchive" : "Archive",
								onClick: () => void updateManaged({ archived: !post.archived }, post.archived ? "Unarchived" : "Archived")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-5 w-5" }),
								label: "Delete",
								destructive: true,
								onClick: () => setConfirmDelete(true)
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: editing,
				onOpenChange: setEditing,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-md gap-0 overflow-hidden p-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, {
						className: "flex-row items-center justify-between border-b border-border px-4 py-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "sm",
								onClick: () => setEditing(false),
								children: "Cancel"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
								className: "text-sm",
								children: ["Edit ", post.kind === "reel" ? "reel" : "post"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								disabled: busy,
								onClick: async () => {
									setBusy(true);
									await updateManaged({
										title,
										caption,
										location: location.trim() || null
									}, "Updated");
									setBusy(false);
									setEditing(false);
								},
								children: busy ? "Saving…" : "Done"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4 p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								"data-testid": "input-viewer-edit-title",
								value: title,
								onChange: (event) => setTitle(event.target.value.slice(0, 180)),
								placeholder: "Add a title",
								className: "w-full border-b border-border bg-transparent pb-2 text-sm font-semibold outline-none placeholder:text-muted-foreground"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								value: caption,
								onChange: (event) => setCaption(event.target.value.slice(0, 2200)),
								rows: 5,
								placeholder: "Write a caption…"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 border-t border-border pt-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: location,
									onChange: (event) => setLocation(event.target.value),
									placeholder: "Add location",
									className: "w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
								})]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: confirmDelete,
				onOpenChange: setConfirmDelete,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogTitle, { children: [
					"Delete this ",
					post.kind === "reel" ? "reel" : "post",
					"?"
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "This permanently removes the media and cannot be undone." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Cancel" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					onClick: async () => {
						try {
							await deleteMyPost(post);
							toast.success("Deleted");
							back();
						} catch (cause) {
							toast.error(cause instanceof Error ? cause.message : "Couldn't delete");
						}
					},
					children: "Delete"
				})] })] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DownloadSheet, {
				open: downloadOpen,
				onOpenChange: setDownloadOpen,
				title: post.caption || `${post.kind} from @${post.author.username}`,
				durationSeconds: post.duration_seconds,
				sourceQualityTier: isVideoQualityTier(post.source_quality_tier) ? post.source_quality_tier : null,
				onDownload: downloadSelected
			})
		]
	});
}
function ViewerState({ label, error = false }) {
	const navigate = useNavigate();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-[100dvh] bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "header-lux flex items-center px-3 py-2.5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"data-testid": "button-viewer-state-back",
				onClick: () => void navigate({ to: "/profile" }),
				"aria-label": "Back to profile",
				className: "action-btn grid h-9 w-9 place-items-center rounded-full",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-5 w-5" })
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			"data-testid": error ? "status-viewer-error" : "status-viewer-loading",
			className: "grid place-items-center px-6 py-28 text-center text-sm text-muted-foreground",
			children: label
		})]
	});
}
function mediaAspect(post) {
	if (post.original_width && post.original_height) return Math.min(1.65, Math.max(.62, post.original_width / post.original_height));
	return post.kind === "reel" ? .8 : 1;
}
function OptionRow({ icon, label, toggle, onToggle, onClick, destructive }) {
	const content = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex w-full items-center gap-3 px-5 py-3.5 text-left",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: destructive ? "text-destructive" : "text-foreground",
				children: icon
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("min-w-0 flex-1 text-sm font-medium", destructive && "text-destructive"),
				children: label
			}),
			onToggle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
				checked: !!toggle,
				onCheckedChange: onToggle,
				onClick: (event) => event.stopPropagation()
			}) : null
		]
	});
	if (onToggle) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "w-full",
		children: content
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"data-testid": `button-manage-${label.toLowerCase().replaceAll(" ", "-")}`,
		onClick,
		className: "w-full transition-colors active:bg-secondary",
		children: content
	});
}
//#endregion
export { MediaViewerPage as component };
