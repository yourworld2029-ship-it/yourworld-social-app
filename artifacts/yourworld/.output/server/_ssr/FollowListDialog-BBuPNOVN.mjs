import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-DidqkCgA.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { H as cn, L as useYw, V as useFollowList, X as resolveMediaUrl } from "./router-CH6ZC-D2.mjs";
import { t as YwAvatar } from "./Avatar-CBPIIan3.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, t as Dialog } from "./dialog-Crs0Do_9.mjs";
import { t as Button } from "./button-CJwJANT3.mjs";
import { i as Trigger, n as List$1, r as Root2, t as Content } from "../_libs/radix-ui__react-tabs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/FollowListDialog-BBuPNOVN.js
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
var empty = {
	id: "",
	username: "",
	display_name: "",
	bio: "",
	category: "",
	location: "",
	website: "",
	avatar_url: null,
	cover_url: null
};
async function signedIfNeeded(url) {
	if (!url) return null;
	return resolveMediaUrl(url, "avatars");
}
/** Real signed-in profile: row from the database plus the user's own media. */
function useMyProfile() {
	const [userId, setUserId] = (0, import_react.useState)(null);
	const [profile, setProfile] = (0, import_react.useState)(empty);
	const [avatarSrc, setAvatarSrc] = (0, import_react.useState)(null);
	const [coverSrc, setCoverSrc] = (0, import_react.useState)(null);
	const [posts, setPosts] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const load = (0, import_react.useCallback)(async () => {
		const { data: sessionData } = await supabase.auth.getSession();
		const uid = sessionData.session?.user.id ?? null;
		setUserId(uid);
		if (!uid) {
			setProfile(empty);
			setPosts([]);
			setLoading(false);
			return;
		}
		const [{ data: row }, { data: myPosts }] = await Promise.all([supabase.from("profiles").select("*").eq("id", uid).maybeSingle(), supabase.from("posts").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(100)]);
		const email = sessionData.session?.user.email ?? "";
		const next = {
			id: uid,
			username: row?.username ?? email.split("@")[0] ?? `user${uid.slice(0, 4)}`,
			display_name: row?.display_name ?? row?.username ?? "YourWorld user",
			bio: row?.bio ?? "",
			category: row?.category ?? "",
			location: row?.location ?? "",
			website: row?.website ?? "",
			avatar_url: row?.avatar_url ?? null,
			cover_url: row?.cover_url ?? null
		};
		setProfile(next);
		setPosts(myPosts ?? []);
		setAvatarSrc(await signedIfNeeded(next.avatar_url));
		setCoverSrc(await signedIfNeeded(next.cover_url));
		setLoading(false);
	}, []);
	(0, import_react.useEffect)(() => {
		load();
		const { data: sub } = supabase.auth.onAuthStateChange(() => void load());
		return () => sub.subscription.unsubscribe();
	}, [load]);
	const uploadImage = (0, import_react.useCallback)(async (file, kind, uid) => {
		const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
		const path = `${uid}/${kind}-${Date.now()}.${ext}`;
		const { error } = await supabase.storage.from("avatars").upload(path, file, {
			contentType: file.type || "image/jpeg",
			upsert: true
		});
		if (error) throw new Error(error.message);
		return path;
	}, []);
	const save = (0, import_react.useCallback)(async (edit) => {
		const { data: sessionData } = await supabase.auth.getSession();
		const uid = sessionData.session?.user.id;
		if (!uid) throw new Error("Sign in to update your profile");
		let avatarPath = profile.avatar_url;
		let coverPath = profile.cover_url;
		if (edit.avatarFile) avatarPath = await uploadImage(edit.avatarFile, "avatar", uid);
		if (edit.coverFile) coverPath = await uploadImage(edit.coverFile, "cover", uid);
		const { error } = await supabase.from("profiles").upsert({
			id: uid,
			username: edit.username || null,
			display_name: edit.name || null,
			bio: edit.bio || null,
			category: edit.category || null,
			location: edit.location || null,
			website: edit.website || null,
			avatar_url: avatarPath,
			cover_url: coverPath
		}, { onConflict: "id" });
		if (error) throw new Error(error.message);
		await load();
	}, [
		profile.avatar_url,
		profile.cover_url,
		uploadImage,
		load
	]);
	return {
		userId,
		profile,
		avatarSrc,
		coverSrc,
		posts,
		grid: (0, import_react.useMemo)(() => posts.filter((p) => p.kind !== "reel"), [posts]),
		reels: (0, import_react.useMemo)(() => posts.filter((p) => p.kind === "reel"), [posts]),
		loading,
		save,
		reload: load
	};
}
/** Update a post/reel you own (caption, hashtags, location, download flag). */
async function updateMyPost(postId, patch) {
	const next = {};
	if (patch.caption !== void 0) {
		next.caption = patch.caption;
		next.hashtags = Array.from(new Set((patch.caption.match(/#[\p{L}\p{N}_]+/gu) ?? []).map((h) => h.slice(1))));
	}
	if (patch.location !== void 0) next.location = patch.location;
	if (patch.allow_download !== void 0) next.allow_download = patch.allow_download;
	if (patch.hide_like_count !== void 0) next.hide_like_count = patch.hide_like_count;
	if (patch.hide_share_count !== void 0) next.hide_share_count = patch.hide_share_count;
	if (patch.comments_off !== void 0) next.comments_off = patch.comments_off;
	if (patch.pinned !== void 0) next.pinned = patch.pinned;
	if (patch.archived !== void 0) next.archived = patch.archived;
	const { error } = await supabase.from("posts").update(next).eq("id", postId);
	if (error) throw new Error(error.message);
}
/** Permanently delete a post/reel you own, plus its stored media file. */
async function deleteMyPost(post) {
	const bucket = post.kind === "reel" ? "reels" : "reels";
	const url = post.media_url ?? "";
	if (url && !/^(blob:|data:)/.test(url)) {
		const path = /^https?:/.test(url) ? url.match(new RegExp(`/storage/v1/object/(?:sign|public)/${bucket}/([^?]+)`))?.[1] : url.replace(/^\/+/, "");
		if (path) try {
			await supabase.storage.from(bucket).remove([decodeURIComponent(path)]);
		} catch {}
	}
	const { error } = await supabase.from("posts").delete().eq("id", post.id);
	if (error) throw new Error(error.message);
}
/** Resolves a stored media reference to something an <img> can render. */
function useResolvedMedia(urls, bucket = "reels") {
	const [map, setMap] = (0, import_react.useState)({});
	const key = urls.join("|");
	(0, import_react.useEffect)(() => {
		let alive = true;
		Promise.all(urls.map(async (u) => [u, await resolveMediaUrl(u, bucket)])).then((pairs) => {
			if (alive) setMap(Object.fromEntries(pairs));
		});
		return () => {
			alive = false;
		};
	}, [key, bucket]);
	return map;
}
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
export { TabsTrigger as a, useMyProfile as c, TabsList as i, useResolvedMedia as l, Tabs as n, deleteMyPost as o, TabsContent as r, updateMyPost as s, FollowListDialog as t };
