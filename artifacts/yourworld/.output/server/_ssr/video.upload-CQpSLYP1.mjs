import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { At as LoaderCircle, Ft as Image, _ as Upload, _n as ChevronDown, an as Clock, jn as ArrowLeft, xn as Camera } from "../_libs/lucide-react.mjs";
import { s as useUploads } from "./router-BTQBfqQy.mjs";
import { t as Button } from "./button-D4H6cHFk.mjs";
import { t as Input } from "./input-uPtSRdgV.mjs";
import { t as Textarea } from "./textarea-Dapria_x.mjs";
import { t as trackEvent } from "./analytics-DKfMtyUd.mjs";
import { i as publishLongVideo, n as formatDuration, t as VIDEO_CATEGORIES } from "./video-data-M2Ijx-gZ.mjs";
import { t as Switch } from "./switch-DvbegSvq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/video.upload-CQpSLYP1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MIN_DURATION = 90;
var MAX_VIDEO_BYTES = 209715200;
function VideoUploadPage() {
	const navigate = useNavigate();
	const { startUpload } = useUploads();
	const videoRef = (0, import_react.useRef)(null);
	const selectedFileRef = (0, import_react.useRef)(null);
	const thumbnailFileRef = (0, import_react.useRef)(null);
	const videoInput = (0, import_react.useRef)(null);
	const thumbInput = (0, import_react.useRef)(null);
	const [fileUrl, setFileUrl] = (0, import_react.useState)(null);
	const [orientation, setOrientation] = (0, import_react.useState)("landscape");
	const [duration, setDuration] = (0, import_react.useState)(null);
	const [dimensions, setDimensions] = (0, import_react.useState)(null);
	const [thumb, setThumb] = (0, import_react.useState)(null);
	const [title, setTitle] = (0, import_react.useState)("");
	const [description, setDescription] = (0, import_react.useState)("");
	const [tags, setTags] = (0, import_react.useState)([]);
	const [paidPromotion, setPaidPromotion] = (0, import_react.useState)(false);
	const [scheduled, setScheduled] = (0, import_react.useState)(false);
	const [date, setDate] = (0, import_react.useState)("");
	const [time, setTime] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [access, setAccess] = (0, import_react.useState)("public");
	const [price, setPrice] = (0, import_react.useState)("");
	const [accessOpen, setAccessOpen] = (0, import_react.useState)(false);
	const accessOptions = [
		{
			value: "public",
			label: "Public (Free)",
			hint: "Anyone can watch for free"
		},
		{
			value: "vip",
			label: "VIP Members Only",
			hint: "Only VIP members can watch"
		},
		{
			value: "paid",
			label: "Paid Course / Single Video",
			hint: "Charge a one-time fee"
		}
	];
	const pickVideo = (file) => {
		if (!file) return;
		if (!file.type.startsWith("video/")) {
			toast.error("Please choose a video file");
			return;
		}
		if (file.size > MAX_VIDEO_BYTES) {
			toast.error("Videos must be under 200 MB.");
			return;
		}
		const url = URL.createObjectURL(file);
		if (fileUrl) URL.revokeObjectURL(fileUrl);
		if (thumb?.startsWith("blob:")) URL.revokeObjectURL(thumb);
		selectedFileRef.current = file;
		thumbnailFileRef.current = null;
		setFileUrl(url);
		setThumb(null);
		setDuration(null);
		setDimensions(null);
	};
	(0, import_react.useEffect)(() => {
		return () => {
			if (fileUrl?.startsWith("blob:")) URL.revokeObjectURL(fileUrl);
			if (thumb?.startsWith("blob:")) URL.revokeObjectURL(thumb);
		};
	}, [fileUrl, thumb]);
	const onMeta = (0, import_react.useCallback)(() => {
		const v = videoRef.current;
		if (!v) return;
		setOrientation(v.videoHeight > v.videoWidth ? "portrait" : "landscape");
		setDuration(Number.isFinite(v.duration) ? v.duration : null);
		setDimensions(v.videoWidth > 0 && v.videoHeight > 0 ? {
			width: v.videoWidth,
			height: v.videoHeight
		} : null);
	}, []);
	/** Grabs the current preview frame as a custom thumbnail. */
	const grabFrame = () => {
		const v = videoRef.current;
		if (!v || !v.videoWidth) return;
		const canvas = document.createElement("canvas");
		const scale = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
		canvas.width = Math.round(v.videoWidth * scale);
		canvas.height = Math.round(v.videoHeight * scale);
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
		thumbnailFileRef.current = null;
		setThumb(canvas.toDataURL("image/jpeg", .85));
		toast.success("Thumbnail captured from this frame");
	};
	const toggleTag = (t) => setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
	const scheduledAt = scheduled && date && time ? /* @__PURE__ */ new Date(`${date}T${time}`) : null;
	const tooShort = duration !== null && duration < MIN_DURATION;
	const canPublish = !!fileUrl && !tooShort && title.trim().length >= 2 && (!scheduled || !!scheduledAt) && !busy;
	const submit = () => {
		if (!fileUrl) return;
		if (selectedFileRef.current && selectedFileRef.current.size > MAX_VIDEO_BYTES) {
			toast.error("Videos must be under 200 MB.");
			return;
		}
		if (duration === null || duration < MIN_DURATION) {
			toast.error("Long videos must be at least 90 seconds.");
			return;
		}
		if (scheduled && scheduledAt && scheduledAt.getTime() <= Date.now()) {
			toast.error("Pick a future date and time to schedule");
			return;
		}
		const parsedPrice = price.trim() ? Number(price) : null;
		if (access === "paid" && (!parsedPrice || !Number.isFinite(parsedPrice) || parsedPrice <= 0)) {
			toast.error("Enter a valid price for paid videos.");
			return;
		}
		setBusy(true);
		startUpload({
			kind: "video",
			label: title.trim() || "Long video",
			thumbnail: thumb,
			viewTo: "/"
		}, (onProgress) => publishLongVideo({
			fileUrl,
			file: selectedFileRef.current,
			thumbnailUrl: thumb,
			thumbnailFile: thumbnailFileRef.current,
			title,
			description,
			tags,
			orientation,
			durationSeconds: duration,
			originalWidth: dimensions?.width ?? null,
			originalHeight: dimensions?.height ?? null,
			scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
			access,
			price: parsedPrice,
			paidPromotion,
			onProgress
		})).then(({ error }) => {
			if (error) {
				toast.error(error);
				return;
			}
			trackEvent("video_published", {
				surface: "long_video_upload",
				orientation,
				scheduled: Boolean(scheduledAt),
				has_thumbnail: Boolean(thumb),
				paid_promotion: paidPromotion
			});
			toast.success(scheduledAt ? `Scheduled for ${scheduledAt.toLocaleString()}` : "Published — it's live on your feed");
		});
		navigate({ to: "/" });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen bg-[#0d0d0f] pb-32 text-white",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "sticky top-0 z-40 flex items-center gap-3 border-b border-zinc-900 bg-[#0d0d0f]/90 px-4 py-3 backdrop-blur-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => navigate({ to: "/" }),
				"aria-label": "Back",
				className: "grid h-9 w-9 place-items-center rounded-full bg-zinc-900 active:scale-90",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 18 })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-bold",
				children: "Upload Video"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-xl space-y-5 px-4 pt-5",
			children: [
				!fileUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => videoInput.current?.click(),
					className: "flex w-full flex-col items-center gap-3 rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/40 px-6 py-14 text-center active:scale-[0.99]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { size: 24 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold",
							children: "Select a long video"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-zinc-400",
							children: "Horizontal (16:9) or vertical (9:16) · 90 seconds to several hours"
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `relative mx-auto w-full overflow-hidden rounded-2xl bg-black ${orientation === "portrait" ? "max-w-[280px] aspect-[9/16]" : "aspect-video"}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
								ref: videoRef,
								src: fileUrl,
								controls: true,
								playsInline: true,
								onLoadedMetadata: onMeta,
								className: "h-full w-full object-contain"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between text-[11px] text-zinc-400",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								orientation === "portrait" ? "Vertical 9:16" : "Horizontal 16:9",
								" ·",
								" ",
								formatDuration(duration)
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => videoInput.current?.click(),
								className: "font-semibold text-pink-400",
								children: "Change video"
							})]
						}),
						tooShort && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[11px] font-semibold text-red-400",
							children: [
								"This video is ",
								formatDuration(duration),
								" — long videos must be at least 90 seconds."
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: videoInput,
					type: "file",
					accept: "video/*",
					hidden: true,
					onChange: (e) => pickVideo(e.target.files?.[0])
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Video Title",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: title,
						maxLength: 120,
						onChange: (e) => setTitle(e.target.value),
						placeholder: "Give your video a title",
						className: "h-11 rounded-xl border-zinc-800 bg-zinc-900/60"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
					label: "Description / Captions",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						value: description,
						maxLength: 2e3,
						rows: 5,
						onChange: (e) => setDescription(e.target.value),
						placeholder: "Tell viewers about this video…",
						className: "min-h-28 rounded-xl border-zinc-800 bg-zinc-900/60 leading-relaxed"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "pt-1 text-right text-[11px] text-zinc-500",
						children: [description.length, "/2000"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
					label: "Custom Thumbnail",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `overflow-hidden rounded-xl bg-zinc-900 ${orientation === "portrait" ? "h-28 w-16" : "h-20 w-36"}`,
							children: thumb ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: thumb,
								alt: "Custom video thumbnail",
								className: "h-full w-full object-cover"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid h-full w-full place-items-center text-zinc-600",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { size: 20 })
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "secondary",
								className: "h-9 rounded-full text-xs",
								onClick: () => thumbInput.current?.click(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, {
									size: 14,
									className: "mr-1.5"
								}), " Upload image"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "secondary",
								className: "h-9 rounded-full text-xs",
								disabled: !fileUrl,
								onClick: grabFrame,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {
									size: 14,
									className: "mr-1.5"
								}), " Use current frame"]
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: thumbInput,
						type: "file",
						accept: "image/*",
						hidden: true,
						onChange: (e) => {
							const f = e.target.files?.[0];
							if (f) {
								if (thumb?.startsWith("blob:")) URL.revokeObjectURL(thumb);
								thumbnailFileRef.current = f;
								setThumb(URL.createObjectURL(f));
							}
						}
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Category / Tags",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						children: VIDEO_CATEGORIES.map((c) => {
							const active = tags.includes(c);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": active,
								onClick: () => toggleTag(c),
								className: `rounded-full px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95 ${active ? "bg-white text-black" : "bg-zinc-900 text-zinc-400"}`,
								children: c
							}, c);
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
					label: "Access Control & Pricing",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setAccessOpen((o) => !o),
							className: "flex h-11 w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 text-sm text-white active:scale-[0.99]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: accessOptions.find((o) => o.value === access)?.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
								size: 16,
								className: `text-zinc-400 transition-transform ${accessOpen ? "rotate-180" : ""}`
							})]
						}), accessOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-zinc-800 bg-[#1a1a1d] shadow-xl",
							children: accessOptions.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									setAccess(o.value);
									setAccessOpen(false);
								},
								className: `flex w-full flex-col items-start gap-0.5 px-3.5 py-2.5 text-left transition-colors ${access === o.value ? "bg-zinc-800/70" : "hover:bg-zinc-800/40"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm font-semibold text-white",
									children: o.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] text-zinc-400",
									children: o.hint
								})]
							}, o.value))
						})]
					}), access === "paid" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "pb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400",
							children: "Course Price (₹)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "number",
							inputMode: "numeric",
							min: 0,
							value: price,
							onChange: (e) => setPrice(e.target.value),
							placeholder: "Enter amount in ₹",
							className: "h-11 rounded-xl border-zinc-800 bg-zinc-900/60 placeholder:text-zinc-500"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold",
							children: "Includes Paid Promotion"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-zinc-400",
							children: "Required for IT & Brand Disclosure Compliance"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: paidPromotion,
							onCheckedChange: setPaidPromotion
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
								size: 16,
								className: "text-pink-400"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold",
								children: "Schedule Post"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-zinc-400",
								children: "Release this video at a future time"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: scheduled,
							onCheckedChange: setScheduled
						})]
					}), scheduled && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							value: date,
							onChange: (e) => setDate(e.target.value),
							className: "h-11 rounded-xl border-zinc-800 bg-zinc-900/60"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "time",
							value: time,
							onChange: (e) => setTime(e.target.value),
							className: "h-11 rounded-xl border-zinc-800 bg-zinc-900/60"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "h-12 w-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-base font-bold",
					disabled: !canPublish,
					onClick: submit,
					children: [busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						size: 18,
						className: "mr-2 animate-spin"
					}), scheduled ? "Schedule" : "Publish"]
				})
			]
		})]
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "pb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400",
		children: label
	}), children] });
}
//#endregion
export { VideoUploadPage as component };
