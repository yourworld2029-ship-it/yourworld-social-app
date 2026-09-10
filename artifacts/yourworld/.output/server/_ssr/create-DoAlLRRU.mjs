import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { $ as Play, Tt as LoaderCircle, _ as Upload, l as Video, on as CircleCheck, ot as Pause, wn as ArrowLeft } from "../_libs/lucide-react.mjs";
import { y as publishDirectReel } from "./router-B_3KaE6n.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/create-DoAlLRRU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MIN_REEL_SECONDS = 5;
var MAX_REEL_SECONDS = 90;
var MAX_REEL_BYTES = 104857600;
function DirectReelUploadPage() {
	const navigate = useNavigate();
	const fileInputRef = (0, import_react.useRef)(null);
	const videoRef = (0, import_react.useRef)(null);
	const [file, setFile] = (0, import_react.useState)(null);
	const [previewUrl, setPreviewUrl] = (0, import_react.useState)(null);
	const [duration, setDuration] = (0, import_react.useState)(null);
	const [currentTime, setCurrentTime] = (0, import_react.useState)(0);
	const [isPlaying, setIsPlaying] = (0, import_react.useState)(false);
	const [dimensions, setDimensions] = (0, import_react.useState)({
		width: 0,
		height: 0
	});
	const [title, setTitle] = (0, import_react.useState)("");
	const [caption, setCaption] = (0, import_react.useState)("");
	const [hashtags, setHashtags] = (0, import_react.useState)("");
	const [progress, setProgress] = (0, import_react.useState)(0);
	const [publishing, setPublishing] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!file) {
			setPreviewUrl(null);
			return;
		}
		const url = URL.createObjectURL(file);
		setPreviewUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);
	const resetVideo = () => {
		setFile(null);
		setDuration(null);
		setDimensions({
			width: 0,
			height: 0
		});
		setCurrentTime(0);
		setIsPlaying(false);
		setError(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};
	const handleFileChange = (nextFile) => {
		if (!nextFile) return;
		if (!nextFile.type.startsWith("video/")) {
			setError("Choose a video file.");
			return;
		}
		if (nextFile.size > MAX_REEL_BYTES) {
			toast.error("Reels must be under 100 MB.");
			return;
		}
		setError(null);
		setDuration(null);
		setDimensions({
			width: 0,
			height: 0
		});
		setCurrentTime(0);
		setIsPlaying(false);
		setFile(nextFile);
	};
	const handleMetadata = (event) => {
		const video = event.currentTarget;
		const nextDuration = Number.isFinite(video.duration) ? video.duration : null;
		setDuration(nextDuration);
		setDimensions({
			width: video.videoWidth,
			height: video.videoHeight
		});
		if (nextDuration == null) setError("Could not read the video duration.");
		else if (nextDuration < MIN_REEL_SECONDS || nextDuration > MAX_REEL_SECONDS) setError(`Reels must be between ${MIN_REEL_SECONDS} and ${MAX_REEL_SECONDS} seconds.`);
		else setError(null);
	};
	const togglePlayback = async () => {
		const video = videoRef.current;
		if (!video) return;
		if (video.paused) await video.play();
		else video.pause();
	};
	const handleTimeUpdate = (event) => {
		setCurrentTime(event.currentTarget.currentTime);
	};
	const publish = async () => {
		if (!file || duration == null) {
			setError("Choose a video and wait for its duration to load.");
			return;
		}
		if (file.size > MAX_REEL_BYTES) {
			toast.error("Reels must be under 100 MB.");
			return;
		}
		if (duration < MIN_REEL_SECONDS || duration > MAX_REEL_SECONDS) {
			setError(`Reels must be between ${MIN_REEL_SECONDS} and ${MAX_REEL_SECONDS} seconds.`);
			return;
		}
		if (!title.trim()) {
			setError("Add a title before publishing.");
			return;
		}
		setPublishing(true);
		setProgress(0);
		setError(null);
		const parsedHashtags = hashtags.split(/[\s,]+/).map((tag) => tag.replace(/^#/, "").trim()).filter(Boolean);
		const result = await publishDirectReel({
			file,
			title,
			caption,
			hashtags: parsedHashtags,
			durationSeconds: duration,
			originalWidth: dimensions.width || null,
			originalHeight: dimensions.height || null,
			onProgress: setProgress
		});
		setPublishing(false);
		if (result.error) {
			setError(result.error);
			toast.error(result.error);
			return;
		}
		toast.success("Reel published");
		navigate({
			to: "/reels",
			search: { reelId: void 0 }
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-screen bg-black px-4 pb-24 pt-5 text-white",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto w-full max-w-lg",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-6 flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => navigate({ to: "/" }),
					className: "rounded-full p-2 text-white/80 transition hover:bg-white/10",
					"aria-label": "Go back",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-5 w-5" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold uppercase tracking-[0.18em] text-pink-400",
					children: "Create"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold",
					children: "Upload a Reel"
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-5 rounded-3xl border border-white/10 bg-zinc-950 p-4 shadow-2xl",
				children: [
					previewUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "group relative mx-auto aspect-[9/16] w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl ring-1 ring-white/5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
								ref: videoRef,
								src: previewUrl,
								className: "h-full w-full object-cover",
								controlsList: "nodownload noplaybackrate nofullscreen",
								disablePictureInPicture: true,
								disableRemotePlayback: true,
								playsInline: true,
								preload: "metadata",
								onLoadedMetadata: handleMetadata,
								onTimeUpdate: handleTimeUpdate,
								onPlay: () => setIsPlaying(true),
								onPause: () => setIsPlaying(false),
								onEnded: () => setIsPlaying(false)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: togglePlayback,
								className: "absolute inset-0 flex items-center justify-center text-white transition-opacity duration-300",
								"aria-label": isPlaying ? "Pause preview" : "Play preview",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-black/55 active:scale-95",
									children: isPlaying ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "h-5 w-5 fill-current" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "ml-0.5 h-5 w-5 fill-current" })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: resetVideo,
								className: "absolute right-3 top-3 rounded-full border border-white/15 bg-black/60 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md transition hover:bg-black/80",
								children: "Replace"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "pointer-events-none absolute inset-x-4 bottom-4 h-1 overflow-hidden rounded-full bg-white/20",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.7)] transition-[width] duration-150",
									style: { width: duration && duration > 0 ? `${Math.min(100, currentTime / duration * 100)}%` : "0%" }
								})
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => fileInputRef.current?.click(),
						className: "mx-auto flex aspect-[9/16] w-full max-w-sm flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/20 bg-zinc-900 text-center transition hover:border-pink-400/70 hover:bg-zinc-800",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-14 w-14 place-items-center rounded-full bg-pink-500/15 text-pink-300",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, { className: "h-7 w-7" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-semibold",
								children: "Choose a video"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-zinc-400",
								children: "5–90 seconds"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: fileInputRef,
						type: "file",
						accept: "video/*",
						className: "hidden",
						onChange: (event) => handleFileChange(event.target.files?.[0])
					}),
					duration != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4 text-emerald-400" }),
							duration.toFixed(1),
							" seconds",
							dimensions.width > 0 && ` · ${dimensions.width}×${dimensions.height}`
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-semibold",
							children: "Title"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: title,
							onChange: (event) => setTitle(event.target.value),
							placeholder: "Give your Reel a title",
							maxLength: 120,
							className: "w-full rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-semibold",
							children: "Caption"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: caption,
							onChange: (event) => setCaption(event.target.value),
							placeholder: "Tell people about this Reel",
							rows: 4,
							maxLength: 2200,
							className: "w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-semibold",
							children: "Hashtags"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: hashtags,
							onChange: (event) => setHashtags(event.target.value),
							placeholder: "#travel #music",
							className: "w-full rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
						})]
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-red-300",
						children: error
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: publish,
						disabled: publishing || !file || duration == null || duration < MIN_REEL_SECONDS || duration > MAX_REEL_SECONDS,
						className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
						children: publishing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
							"Publishing ",
							progress,
							"%"
						] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-4 w-4" }), "Publish Reel"] })
					})
				]
			})]
		})
	});
}
//#endregion
export { DirectReelUploadPage as component };
