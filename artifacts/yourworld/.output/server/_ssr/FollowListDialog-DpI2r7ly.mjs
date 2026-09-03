import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { X as useYw, et as useFollowList, tt as cn } from "./router-COLtD0vp.mjs";
import { t as YwAvatar } from "./Avatar-D-_Rpn4Q.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, t as Dialog } from "./dialog-DYLHMilc.mjs";
import { t as Button } from "./button-BNgS3-N-.mjs";
import { i as Trigger, n as List$1, r as Root2, t as Content } from "../_libs/radix-ui__react-tabs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/FollowListDialog-DpI2r7ly.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Tabs = Root2;
var TabsList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List$1, {
	ref,
	className: cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className),
	...props
}));
TabsList.displayName = List$1.displayName;
var TabsTrigger = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
	ref,
	className: cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow", className),
	...props
}));
TabsTrigger.displayName = Trigger.displayName;
var TabsContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content, {
	ref,
	className: cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className),
	...props
}));
TabsContent.displayName = Content.displayName;
function FollowListDialog({ open, onOpenChange, userId, tab, onTabChange }) {
	const [value, setValue] = (0, import_react.useState)(tab);
	(0, import_react.useEffect)(() => setValue(tab), [tab]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-sm p-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, {
				className: "px-5 pt-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "font-display",
					children: "Connections"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
				value,
				onValueChange: (v) => {
					setValue(v);
					onTabChange(v);
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
						className: "mx-5 grid w-[calc(100%-2.5rem)] grid-cols-2 rounded-full",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "followers",
							className: "rounded-full",
							children: "Followers"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "following",
							className: "rounded-full",
							children: "Following"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "followers",
						className: "mt-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
							userId,
							kind: "followers",
							open: open && value === "followers"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "following",
						className: "mt-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
							userId,
							kind: "following",
							open: open && value === "following"
						})
					})
				]
			})]
		})
	});
}
function List({ userId, kind, open }) {
	const { users, loading } = useFollowList(userId, kind, open);
	const { following, toggleFollow } = useYw();
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "space-y-2 px-5 py-4",
		children: [
			0,
			1,
			2
		].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { className: "h-12 animate-pulse rounded-2xl bg-secondary" }, i))
	});
	if (!users.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "px-5 py-10 text-center text-sm text-muted-foreground",
		children: kind === "followers" ? "No followers yet." : "Not following anyone yet."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "max-h-[55vh] space-y-1 overflow-y-auto px-3 py-3",
		children: users.map((u, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "animate-rise flex items-center gap-3 rounded-2xl px-2 py-2",
			style: { animationDelay: `${i * 25}ms` },
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YwAvatar, {
					user: {
						id: u.id,
						username: u.username,
						name: u.display_name,
						hue: 280
					},
					size: 40
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block truncate text-sm font-medium",
						children: u.display_name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "block truncate text-xs text-muted-foreground",
						children: ["@", u.username]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: following[u.id] ? "secondary" : "default",
					className: "h-8 shrink-0 rounded-full px-4 text-xs",
					onClick: () => toggleFollow(u.id),
					children: following[u.id] ? "Following" : "Follow"
				})
			]
		}, u.id))
	});
}
//#endregion
export { TabsTrigger as a, TabsList as i, Tabs as n, TabsContent as r, FollowListDialog as t };
