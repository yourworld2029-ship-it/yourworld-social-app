import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { Ft as Hash, Tt as LoaderCircle, bt as MapPin, f as Users, jt as ImagePlus, qt as Download, wn as ArrowLeft } from "../_libs/lucide-react.mjs";
import { s as useUploads, v as publishPost } from "./router-Dtgi-Gud.mjs";
import { t as Button } from "./button-Bt-uyvRT.mjs";
import { t as Input } from "./input-BlzhIrsq.mjs";
import { t as Textarea } from "./textarea-M1Vn1VRM.mjs";
import { t as Switch } from "./switch-aNFKI7hx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/post.create-pNNyj2QH.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PostCreatePage() {
	const navigate = useNavigate();
	const { startUpload } = useUploads();
	const fileInput = (0, import_react.useRef)(null);
	const selectedFileRef = (0, import_react.useRef)(null);
	const [fileUrl, setFileUrl] = (0, import_react.useState)(null);
	const [mediaType, setMediaType] = (0, import_react.useState)("image");
	const [caption, setCaption] = (0, import_react.useState)("");
	const [tags, setTags] = (0, import_react.useState)("");
	const [location, setLocation] = (0, import_react.useState)("");
	const [allowDownload, setAllowDownload] = (0, import_react.useState)(true);
	const [closeFriends, setCloseFriends] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const hashtags = (0, import_react.useMemo)(() => tags.split(/[\s,]+/).map((t) => t.replace(/^#/, "").trim()).filter(Boolean), [tags]);
	const pick = (file) => {
		if (!file) return;
		const isVideo = file.type.startsWith("video/");
		if (!isVideo && !file.type.startsWith("image/")) {
			toast.error("Choose a photo or a video");
			return;
		}
		setMediaType(isVideo ? "video" : "image");
		selectedFileRef.current = file;
		setFileUrl(URL.createObjectURL(file));
	};
	const submit = () => {
		if (!fileUrl) return;
		setBusy(true);
		startUpload({
			kind: "post",
			label: caption.trim() || (mediaType === "video" ? "New video post" : "New photo post"),
			thumbnail: mediaType === "image" ? fileUrl : null,
			viewTo: "/"
		}, (onProgress) => publishPost({
			fileUrl,
			file: selectedFileRef.current,
			mediaType,
			caption,
			hashtags,
			location: location.trim() || null,
			allowDownload,
			audience: closeFriends ? "close_friends" : "everyone",
			onProgress
		})).then(({ error }) => {
			if (error) toast.error(error);
			else toast.success("Posted — it's live on your feed");
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
				children: "New Post"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-xl space-y-5 px-4 pt-5",
			children: [
				!fileUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => fileInput.current?.click(),
					className: "flex w-full flex-col items-center gap-3 rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/40 px-6 py-14 text-center active:scale-[0.99]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { size: 24 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold",
							children: "Select a photo or video"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-zinc-400",
							children: "It will be shared to your Home feed"
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative aspect-square w-full overflow-hidden rounded-2xl bg-black",
						children: mediaType === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
							src: fileUrl,
							controls: true,
							playsInline: true,
							className: "h-full w-full object-cover"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: fileUrl,
							alt: "Post preview",
							className: "h-full w-full object-cover"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => fileInput.current?.click(),
						className: "w-full text-right text-[11px] font-semibold text-pink-400",
						children: "Change media"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: fileInput,
					type: "file",
					accept: "image/*,video/*",
					hidden: true,
					onChange: (e) => pick(e.target.files?.[0])
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "pb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400",
					children: "Caption"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: caption,
					maxLength: 2200,
					rows: 4,
					onChange: (e) => setCaption(e.target.value),
					placeholder: "Write a caption…",
					className: "min-h-24 rounded-xl border-zinc-800 bg-zinc-900/60 leading-relaxed"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-center gap-1.5 pb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hash, { size: 12 }), " Hashtags"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: tags,
						onChange: (e) => setTags(e.target.value),
						placeholder: "travel, sunset, night",
						className: "h-11 rounded-xl border-zinc-800 bg-zinc-900/60"
					}),
					hashtags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1.5 pt-2",
						children: hashtags.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] text-pink-400",
							children: ["#", t]
						}, t))
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex items-center gap-1.5 pb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 12 }), " Location"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: location,
					onChange: (e) => setLocation(e.target.value),
					placeholder: "Add a place",
					className: "h-11 rounded-xl border-zinc-800 bg-zinc-900/60"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, {
								size: 16,
								className: "text-pink-400"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold",
								children: "Close friends only"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-zinc-400",
								children: "Limit who can see this post"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: closeFriends,
							onCheckedChange: setCloseFriends
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
								size: 16,
								className: "text-pink-400"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold",
								children: "Allow downloads"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-zinc-400",
								children: "Viewers can save this post"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: allowDownload,
							onCheckedChange: setAllowDownload
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "h-12 w-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-base font-bold",
					disabled: !fileUrl || busy,
					onClick: submit,
					children: [busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						size: 18,
						className: "mr-2 animate-spin"
					}), "Share Post"]
				})
			]
		})]
	});
}
//#endregion
export { PostCreatePage as component };
