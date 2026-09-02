import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { h as useParams, m as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { C as Trash2, Dt as MapPin, Ht as Heart, Ln as Archive, U as Send, Zt as Eye, a as X, c as VolumeX, et as Plus, l as Volume2, lt as Pause, rn as Download, vn as ChevronUp } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as useMoments, H as cn, k as aiFilterCss } from "./router-CH6ZC-D2.mjs";
import { t as useProfiles } from "./profiles-map-BRvR_swC.mjs";
import { t as downloadMomentMedia } from "./yw-download-DYEHRuT0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/moment._momentId-BttrSkWO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** photo / text segment length (ms) */
var PHOTO_DURATION = 5e3;
var TICK = 60;
/** long videos are split into chunks of this many seconds */
var SEGMENT_DURATION = 20;
function MomentViewRoute() {
	const { momentId } = useParams({ strict: false });
	const navigate = useNavigate();
	const { moments, registerView, addReply, deleteMoment, archiveMoment, votePoll, registerScreenshot } = useMoments();
	const selected = (0, import_react.useMemo)(() => moments.find((m) => String(m.id) === String(momentId)), [moments, momentId]);
	/** every author group, oldest moment first inside each group */
	const groups = (0, import_react.useMemo)(() => {
		const byAuthor = /* @__PURE__ */ new Map();
		for (const m of moments) {
			const key = m.author?.id ?? (m.mine ? "me" : m.id);
			const list = byAuthor.get(key);
			if (list) list.push(m);
			else byAuthor.set(key, [m]);
		}
		return [...byAuthor.values()].map((list) => [...list].sort((a, b) => a.createdAt - b.createdAt)).sort((a, b) => (b[0]?.createdAt ?? 0) - (a[0]?.createdAt ?? 0));
	}, [moments]);
	const groupIndex = (0, import_react.useMemo)(() => {
		if (!selected) return -1;
		return groups.findIndex((g) => g.some((m) => m.id === selected.id));
	}, [groups, selected]);
	/** all moments of the current author, oldest first */
	const items = (0, import_react.useMemo)(() => {
		if (groupIndex >= 0) return groups[groupIndex];
		return selected ? [selected] : [];
	}, [
		groups,
		groupIndex,
		selected
	]);
	const [index, setIndex] = (0, import_react.useState)(0);
	const [progress, setProgress] = (0, import_react.useState)(0);
	const [videoChunks, setVideoChunks] = (0, import_react.useState)(1);
	const [chunk, setChunk] = (0, import_react.useState)(0);
	const [paused, setPaused] = (0, import_react.useState)(false);
	const [muted, setMuted] = (0, import_react.useState)(false);
	const [liked, setLiked] = (0, import_react.useState)(false);
	const [reply, setReply] = (0, import_react.useState)("");
	const [replying, setReplying] = (0, import_react.useState)(false);
	const [showViewers, setShowViewers] = (0, import_react.useState)(false);
	const videoRef = (0, import_react.useRef)(null);
	const musicRef = (0, import_react.useRef)(null);
	const holdTimer = (0, import_react.useRef)(null);
	const heldRef = (0, import_react.useRef)(false);
	const touchStart = (0, import_react.useRef)(null);
	const current = items[index] ?? selected ?? null;
	(0, import_react.useEffect)(() => {
		if (!selected) return;
		const i = items.findIndex((m) => m.id === selected.id);
		setIndex(i >= 0 ? i : 0);
		setChunk(0);
		setProgress(0);
	}, [selected, items]);
	const close = (0, import_react.useCallback)(() => navigate({ to: "/" }), [navigate]);
	const openGroup = (0, import_react.useCallback)((dir) => {
		if (groupIndex < 0) {
			close();
			return;
		}
		const next = groups[groupIndex + dir];
		if (!next?.length) {
			close();
			return;
		}
		const target = dir === 1 ? next[0] : next[0];
		navigate({
			to: "/moment/$momentId",
			params: { momentId: target.id },
			replace: true
		});
	}, [
		groupIndex,
		groups,
		navigate,
		close
	]);
	const goNext = (0, import_react.useCallback)(() => {
		setProgress(0);
		if (chunk < videoChunks - 1) {
			const next = chunk + 1;
			setChunk(next);
			if (videoRef.current) videoRef.current.currentTime = next * SEGMENT_DURATION;
			return;
		}
		setChunk(0);
		if (index < items.length - 1) {
			setIndex(index + 1);
			return;
		}
		openGroup(1);
	}, [
		chunk,
		videoChunks,
		index,
		items.length,
		openGroup
	]);
	const goPrev = (0, import_react.useCallback)(() => {
		setProgress(0);
		if (chunk > 0) {
			const prev = chunk - 1;
			setChunk(prev);
			if (videoRef.current) videoRef.current.currentTime = prev * SEGMENT_DURATION;
			return;
		}
		const v = videoRef.current;
		if (v && v.currentTime > 2) {
			v.currentTime = 0;
			return;
		}
		setChunk(0);
		if (index > 0) {
			setIndex(index - 1);
			return;
		}
		openGroup(-1);
	}, [
		chunk,
		index,
		openGroup
	]);
	(0, import_react.useEffect)(() => {
		if (!current) return;
		setLiked(false);
		setProgress(0);
		setChunk(0);
		setVideoChunks(1);
		setShowViewers(false);
		registerView(current.id);
	}, [current?.id]);
	(0, import_react.useEffect)(() => {
		const next = items[index + 1];
		if (!next?.media) return;
		if (next.kind === "photo") {
			const img = new Image();
			img.src = next.media;
		} else if (next.kind === "video") {
			const v = document.createElement("video");
			v.preload = "metadata";
			v.src = next.media;
		}
	}, [index, items]);
	(0, import_react.useEffect)(() => {
		if (!current || current.kind === "video" || paused || showViewers) return;
		const span = current.trim?.end && current.trim.end > 0 ? current.trim.end * 1e3 : PHOTO_DURATION;
		const id = setInterval(() => {
			setProgress((p) => {
				const nextP = p + TICK / span * 100;
				if (nextP >= 100) {
					goNext();
					return 0;
				}
				return nextP;
			});
		}, TICK);
		return () => clearInterval(id);
	}, [
		current,
		paused,
		showViewers,
		goNext
	]);
	(0, import_react.useEffect)(() => {
		const v = videoRef.current;
		const a = musicRef.current;
		if (paused || showViewers) {
			v?.pause();
			a?.pause();
		} else {
			v?.play().catch(() => {});
			a?.play().catch(() => {});
		}
	}, [
		paused,
		showViewers,
		index,
		chunk
	]);
	(0, import_react.useEffect)(() => {
		const a = musicRef.current;
		if (!a || !current?.musicUrl) return;
		a.volume = Math.min(1, Math.max(0, current.musicVolume ?? (current.kind === "video" ? .35 : .8)));
		a.currentTime = current.musicStart ?? 0;
		if (!paused) a.play().catch(() => {});
		return () => a.pause();
	}, [current?.id, current?.musicUrl]);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			const target = e.target;
			if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
			if (e.key === "ArrowRight") goNext();
			else if (e.key === "ArrowLeft") goPrev();
			else if (e.key === "Escape") close();
			else if (e.key === " ") {
				e.preventDefault();
				setPaused((p) => !p);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		goNext,
		goPrev,
		close
	]);
	(0, import_react.useEffect)(() => {
		if (!current?.screenshotAlert || current.mine) return;
		const onKeyUp = (e) => {
			if (e.key === "PrintScreen" || (e.metaKey || e.ctrlKey) && e.shiftKey && /[34s]/i.test(e.key)) {
				registerScreenshot(current.id);
				toast.message("Screenshot detected — the author was notified");
			}
		};
		window.addEventListener("keyup", onKeyUp);
		return () => window.removeEventListener("keyup", onKeyUp);
	}, [
		current?.id,
		current?.screenshotAlert,
		current?.mine,
		registerScreenshot
	]);
	const viewerIds = (0, import_react.useMemo)(() => current?.mine ? current.viewers.map((v) => v.userId) : [], [current]);
	const viewerProfiles = useProfiles(viewerIds);
	const startHold = () => {
		heldRef.current = false;
		holdTimer.current = setTimeout(() => {
			heldRef.current = true;
			setPaused(true);
		}, 250);
	};
	const endHold = () => {
		if (holdTimer.current) clearTimeout(holdTimer.current);
		holdTimer.current = null;
		if (heldRef.current) setPaused(false);
	};
	const tap = (dir) => {
		if (heldRef.current) {
			heldRef.current = false;
			return;
		}
		if (dir === "next") goNext();
		else goPrev();
	};
	if (!current) return null;
	const filter = aiFilterCss(current.ai, current.effect);
	const segments = current.kind === "video" ? videoChunks : 1;
	const likeCount = current.viewers.filter((v) => v.liked).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[99999] flex items-center justify-center bg-black select-none",
		onTouchStart: (e) => {
			const t = e.touches[0];
			if (t) touchStart.current = {
				x: t.clientX,
				y: t.clientY
			};
		},
		onTouchEnd: (e) => {
			const start = touchStart.current;
			const t = e.changedTouches[0];
			touchStart.current = null;
			if (!start || !t) return;
			const dx = t.clientX - start.x;
			const dy = t.clientY - start.y;
			if (Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx)) {
				if (dy > 0) close();
				else if (current.mine) setShowViewers(true);
			} else if (Math.abs(dx) > 80) openGroup(dx < 0 ? 1 : -1);
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative flex h-full w-full max-w-md items-center justify-center overflow-hidden bg-black",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pointer-events-none flex h-full w-full items-center justify-center",
					children: current.kind === "video" && current.media ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						ref: videoRef,
						src: current.media,
						autoPlay: true,
						playsInline: true,
						muted,
						preload: "auto",
						style: { filter },
						className: "h-full w-full object-cover",
						onLoadedMetadata: (e) => {
							const d = e.currentTarget.duration;
							setVideoChunks(Number.isFinite(d) && d > 0 ? Math.max(1, Math.ceil(d / SEGMENT_DURATION)) : 1);
						},
						onTimeUpdate: (e) => {
							const v = e.currentTarget;
							if (!v.duration || Number.isNaN(v.duration)) return;
							const start = chunk * SEGMENT_DURATION;
							const end = Math.min(start + SEGMENT_DURATION, v.duration);
							setProgress(Math.min(100, Math.max(0, (v.currentTime - start) / (end - start) * 100)));
							if (v.currentTime >= end - .05) goNext();
						},
						onEnded: goNext
					}, current.id) : current.kind === "photo" && current.media ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: current.media,
						alt: "",
						style: { filter },
						className: "h-full w-full object-cover"
					}, current.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid h-full w-full place-items-center p-8",
						style: { background: current.textBg || "#111" },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-center text-2xl font-bold text-white",
							children: current.text
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-none absolute inset-0 z-[10001]",
					children: [
						current.drawing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: current.drawing,
							alt: "",
							className: "absolute inset-0 h-full w-full object-cover"
						}) : null,
						current.stickers?.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute -translate-x-1/2 -translate-y-1/2 whitespace-pre text-4xl drop-shadow-lg",
							style: {
								left: `${s.x * 100}%`,
								top: `${s.y * 100}%`,
								transform: `translate(-50%,-50%) scale(${s.scale}) rotate(${s.rotation ?? 0}deg)`,
								color: s.color,
								fontSize: s.type === "text" ? 22 : void 0,
								fontWeight: s.type === "text" ? 700 : void 0
							},
							children: s.content
						}, s.id)),
						current.kind !== "text" && current.text ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "absolute inset-x-6 bottom-24 text-center text-base font-semibold text-white drop-shadow-lg",
							children: current.text
						}) : null,
						current.location && current.showLocation !== false ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute inset-x-4 bottom-16 flex flex-wrap items-center justify-center gap-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-3 w-3" }),
									" ",
									current.location
								]
							})
						}) : null
					]
				}),
				current.poll ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: cn("absolute inset-x-8 top-1/2 z-[10003] -translate-y-1/2 rounded-2xl bg-black/60 p-4 backdrop-blur-md transition-opacity", paused ? "pointer-events-none opacity-0" : "opacity-100"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 text-center text-sm font-bold text-white",
						children: current.poll.question
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2",
						children: current.poll.options.map((opt, i) => {
							const votes = current.poll.votes;
							const total = votes[0] + votes[1] || 1;
							const pct = Math.round((votes[i] ?? 0) / total * 100);
							const mine = current.poll.myVote === i;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									if (current.poll.myVote === null) votePoll(current.id, i);
								},
								className: cn("relative flex-1 overflow-hidden rounded-xl border border-white/25 px-3 py-2 text-xs font-semibold text-white", mine && "border-white"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute inset-y-0 left-0 bg-white/25",
									style: { width: current.poll.myVote === null ? 0 : `${pct}%` }
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "relative",
									children: [opt, current.poll.myVote === null ? "" : ` · ${pct}%`]
								})]
							}, opt + i);
						})
					})]
				}) : null,
				current.musicUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
					ref: musicRef,
					src: current.musicUrl,
					loop: true
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-0 z-[10000] flex",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Previous",
						className: "h-full w-[30%] bg-transparent",
						onPointerDown: startHold,
						onPointerUp: endHold,
						onPointerLeave: endHold,
						onPointerCancel: endHold,
						onClick: () => tap("prev")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Next",
						className: "h-full w-[70%] bg-transparent",
						onPointerDown: startHold,
						onPointerUp: endHold,
						onPointerLeave: endHold,
						onPointerCancel: endHold,
						onClick: () => tap("next")
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("pointer-events-none absolute left-3 right-3 top-3 z-[10002] flex gap-1.5 transition-opacity duration-300", paused ? "opacity-0" : "opacity-100"),
					children: Array.from({ length: segments }).map((_, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-1 flex-1 overflow-hidden rounded-full bg-white/30",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full rounded-full bg-white",
							style: {
								width: idx < chunk ? "100%" : idx === chunk ? `${progress}%` : "0%",
								transition: idx === chunk ? "width 80ms linear" : void 0
							}
						})
					}, idx))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: cn("absolute left-3 right-3 top-7 z-[10002] flex items-center justify-between transition-opacity duration-300", paused ? "pointer-events-none opacity-0" : "opacity-100"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-auto flex cursor-pointer items-center gap-2.5",
						onClick: (e) => {
							e.stopPropagation();
							if (current.mine) navigate({ to: "/profile" });
							else if (current.author?.id) navigate({
								to: "/u/$userId",
								params: { userId: current.author.id }
							});
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-9 w-9 place-items-center overflow-hidden rounded-full border-2 border-white/50 bg-neutral-800",
							children: current.author?.avatar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: current.author.avatar,
								className: "h-full w-full object-cover",
								alt: ""
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-bold text-white/80",
								children: (current.author?.name || current.author?.username || "Y")[0]?.toUpperCase()
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm font-bold text-white drop-shadow-md",
									children: current.author?.name || current.author?.username || "You"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] font-medium text-white/70",
									children: timeAgo(current.createdAt)
								}),
								items.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white",
									children: [
										index + 1,
										"/",
										items.length
									]
								}) : null
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-auto flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": muted ? "Unmute" : "Mute",
							onClick: () => setMuted((m) => !m),
							className: "rounded-full border border-white/20 bg-black/60 p-2.5 text-white active:scale-90",
							children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "h-4 w-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": "Close",
							onClick: close,
							className: "rounded-full border border-white/20 bg-black/60 p-2.5 text-white active:scale-90",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
						})]
					})]
				}),
				paused ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-none absolute left-1/2 top-1/2 z-[10002] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "mr-1 inline h-3 w-3" }), " Paused"]
				}) : null,
				!current.mine ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: cn("absolute inset-x-3 bottom-4 z-[10002] flex items-center gap-2 transition-opacity duration-300", paused ? "pointer-events-none opacity-0" : "opacity-100"),
					children: [
						current.allowReplies === false ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-1 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-[11px] font-medium text-white/50 backdrop-blur-md",
							children: "Replies are turned off"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-1 items-center gap-2 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 backdrop-blur-md",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: reply,
								onChange: (e) => setReply(e.target.value),
								onFocus: () => setPaused(true),
								onBlur: () => setPaused(false),
								placeholder: "Send a reply",
								className: "flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Send reply",
								disabled: !reply.trim() || replying,
								onClick: async () => {
									const text = reply.trim();
									if (!text) return;
									setReplying(true);
									setReply("");
									const res = await addReply(current.id, text);
									setReplying(false);
									if (res?.error) {
										toast.error("Couldn't send reply");
										setReply(text);
									} else toast.success("Reply sent");
								},
								className: "text-white disabled:opacity-40",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-4 w-4" })
							})]
						}),
						current.allowReactions === false ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": "Like",
							onClick: () => {
								const next = !liked;
								setLiked(next);
								registerView(current.id, next);
							},
							className: "rounded-full border border-white/20 bg-black/50 p-2.5 text-white backdrop-blur-md active:scale-90",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: cn("h-5 w-5", liked && "fill-red-500 text-red-500") })
						}),
						current.allowDownload && current.media ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": "Download",
							onClick: () => void downloadMomentMedia(current.media, current.kind, current.author?.username || "yourworld", current.id),
							className: "rounded-full border border-white/20 bg-black/50 p-2.5 text-white backdrop-blur-md active:scale-90",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "h-5 w-5" })
						}) : null
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: cn("absolute inset-x-3 bottom-4 z-[10002] flex items-center justify-between transition-opacity duration-300", paused ? "pointer-events-none opacity-0" : "opacity-100"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setShowViewers(true),
						className: "flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md active:scale-95",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "h-4 w-4" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-4 w-4" }),
							" ",
							current.viewers.length,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "h-4 w-4" }),
							" ",
							likeCount
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Add another moment",
								onClick: () => navigate({ to: "/moment/create" }),
								className: "rounded-full border border-white/20 bg-pink-500/80 p-2.5 text-white backdrop-blur-md active:scale-90",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-5 w-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Archive moment",
								onClick: () => {
									archiveMoment(current.id);
									toast.success("Moment archived");
									close();
								},
								className: "rounded-full border border-white/20 bg-black/50 p-2.5 text-white backdrop-blur-md active:scale-90",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Archive, { className: "h-5 w-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Delete moment",
								onClick: () => {
									deleteMoment(current.id);
									toast.success("Moment deleted successfully");
									navigate({
										to: "/",
										replace: true
									});
								},
								className: "rounded-full border border-white/20 bg-black/50 p-2.5 text-white backdrop-blur-md active:scale-90",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-5 w-5" })
							})
						]
					})]
				}),
				showViewers && current.mine ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-0 z-[10005] flex flex-col justify-end",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Close viewers",
						className: "flex-1 bg-black/50",
						onClick: () => setShowViewers(false)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-h-[60%] overflow-y-auto rounded-t-3xl bg-neutral-900 p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-3 h-1 w-10 rounded-full bg-white/25" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mb-3 text-sm font-semibold text-white",
								children: ["Seen by ", current.viewers.length]
							}),
							current.viewers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "pb-6 text-sm text-white/60",
								children: "No views yet."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "space-y-3 pb-6",
								children: [...current.viewers].sort((a, b) => b.at - a.at).map((v) => {
									const p = viewerProfiles.get(v.userId);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center gap-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "h-9 w-9 overflow-hidden rounded-full bg-neutral-700",
												children: p?.avatarUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													src: p.avatarUrl,
													alt: "",
													className: "h-full w-full object-cover"
												}) : null
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0 flex-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "truncate text-sm font-medium text-white",
													children: p?.name ?? "User"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "truncate text-[11px] text-white/50",
													children: [
														"@",
														p?.username ?? "user",
														" · ",
														timeAgo(v.at)
													]
												})]
											}),
											v.screenshot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300",
												children: "screenshot"
											}) : null,
											v.liked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "h-4 w-4 fill-red-500 text-red-500" }) : null
										]
									}, v.userId);
								})
							}),
							current.replies.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mb-2 text-sm font-semibold text-white",
								children: ["Replies ", current.replies.length]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "space-y-2 pb-6",
								children: current.replies.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "rounded-xl bg-white/5 px-3 py-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-white",
										children: r.text
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-white/45",
										children: timeAgo(r.at)
									})]
								}, r.id))
							})] }) : null
						]
					})]
				}) : null
			]
		})
	});
}
function timeAgo(ts) {
	const diff = Math.max(0, Date.now() - ts);
	const m = Math.floor(diff / 6e4);
	if (m < 1) return "now";
	if (m < 60) return `${m}m`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h`;
	return `${Math.floor(h / 24)}d`;
}
//#endregion
export { MomentViewRoute as component };
