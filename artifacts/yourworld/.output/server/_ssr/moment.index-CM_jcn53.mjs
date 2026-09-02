import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { Dn as Camera, Ht as Heart, In as ArrowLeft, Zt as Eye, et as Plus } from "../_libs/lucide-react.mjs";
import { B as cn, O as useMoments } from "./router-BPTrg-6h.mjs";
import { t as Button } from "./button-D89E3QyJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/moment.index-CM_jcn53.js
var import_jsx_runtime = require_jsx_runtime();
function MomentsIndex() {
	const navigate = useNavigate();
	const { moments, archive } = useMoments();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-background pb-28",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					"aria-label": "Back",
					onClick: () => navigate({ to: "/" }),
					className: "grid size-9 place-items-center rounded-full bg-muted/40",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-base font-semibold",
					children: "Your Moments"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/moment/create",
					className: "ml-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						className: "rounded-full gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " New"]
					})
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "px-4 pt-4",
			children: moments.length === 0 && archive.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-24 flex flex-col items-center text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid size-20 place-items-center rounded-full bg-muted/40",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-8 text-muted-foreground" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-5 text-lg font-semibold",
						children: "No moments yet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 max-w-xs text-sm text-muted-foreground",
						children: "Capture something and it will show up here for 12 or 24 hours."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/moment/create",
						className: "mt-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "rounded-full px-6",
							children: "Create a moment"
						})
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Live now",
				items: moments
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Archive",
				items: archive,
				muted: true
			})] })
		})]
	});
}
function Section({ title, items, muted }) {
	if (items.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mb-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mb-3 text-sm font-semibold text-muted-foreground",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-3 gap-2",
			children: items.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/moment/$momentId",
				params: { momentId: m.id },
				className: cn("relative aspect-[9/16] overflow-hidden rounded-2xl bg-muted/40", muted && "opacity-70"),
				children: [m.kind === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
					src: m.media ? `${m.media}${m.media.includes("#") ? "" : "#t=0.1"}` : void 0,
					muted: true,
					playsInline: true,
					preload: "metadata",
					className: "size-full bg-zinc-900 object-cover"
				}) : m.kind === "photo" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: m.media,
					alt: "",
					className: "size-full object-cover"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid size-full place-items-center p-2 text-center text-xs font-medium",
					style: { background: m.textBg },
					children: m.text
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/70 to-transparent p-2 text-[11px] text-white",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-3" }), m.viewers.length]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "size-3" }), m.viewers.filter((v) => v.liked).length]
					})]
				})]
			}, m.id))
		})]
	});
}
//#endregion
export { MomentsIndex as component };
