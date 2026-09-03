import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { G as Search, Ht as Hash, S as TrendingUp, a as X, vn as ChevronRight } from "../_libs/lucide-react.mjs";
import { $ as cn, m as useSearch } from "./router-DS5eAPY8.mjs";
import { t as YwAvatar } from "./Avatar-CY5tJeW0.mjs";
import { t as formatCount } from "./yw-data-CyapVFm6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/search-uEtNryTB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function hueOf(id) {
	return id.split("").reduce((h, char) => (h * 31 + char.charCodeAt(0)) % 360, 0);
}
/**
* Escapes a value embedded in PostgREST's `or` filter grammar while retaining
* the outer `%` wildcards used for the ILIKE match.
*/
function escapeILikePattern(value) {
	return value.replace(/[\\%_.,():"']/g, "\\$&");
}
function toSearchUsers(profiles, followersById = /* @__PURE__ */ new Map()) {
	return profiles.map((profile) => {
		const followerCount = followersById.get(profile.id);
		return {
			id: profile.id,
			username: profile.username?.trim() ?? "",
			name: profile.full_name?.trim() || profile.display_name?.trim() || profile.username?.trim() || "",
			category: profile.category || void 0,
			hue: hueOf(profile.id),
			...followerCount === void 0 ? {} : { followerCount }
		};
	});
}
async function loadFollowerCounts(ids, client) {
	if (!ids.length) return /* @__PURE__ */ new Map();
	const { data, error } = await client.rpc("get_follow_counts", { ids });
	if (error) return /* @__PURE__ */ new Map();
	return new Map((data ?? []).map((row) => [row.user_id, Number(row.followers)]));
}
/** Searches public profiles directly, using the same RLS rules as the profile table. */
async function searchPublicProfiles(search, client = supabase) {
	const term = search.trim().replace(/^[@#]+/, "");
	if (!term) return [];
	const pattern = escapeILikePattern(term);
	const { data, error } = await client.from("profiles").select("id,username,full_name,display_name,category").or(`username.ilike.%${pattern}%,full_name.ilike.%${pattern}%`).order("updated_at", { ascending: false }).limit(50);
	if (error) throw error;
	const profiles = data ?? [];
	return toSearchUsers(profiles, await loadFollowerCounts(profiles.map((profile) => profile.id), client));
}
/** Loads the current public search data directly from Supabase. */
async function loadSearchData(client = supabase) {
	const [{ data: profiles, error: profilesError }, { data: posts, error: postsError }] = await Promise.all([client.from("profiles").select("id,username,full_name,display_name,category").order("updated_at", { ascending: false }).limit(100), client.from("posts").select("*").limit(500)]);
	if (profilesError) throw profilesError;
	if (postsError) throw postsError;
	const profileRows = profiles ?? [];
	const users = toSearchUsers(profileRows, await loadFollowerCounts(profileRows.map((profile) => profile.id), client));
	const totals = /* @__PURE__ */ new Map();
	for (const post of posts ?? []) {
		const storedTags = Array.isArray(post.hashtags) ? post.hashtags : [];
		const inlineTags = [...[
			post.caption,
			post.content,
			post.title,
			post.description
		].filter((value) => typeof value === "string").join(" ").matchAll(/#([\p{L}\p{N}_-]+)/gu)].map((match) => match[1]);
		for (const tag of [...storedTags, ...inlineTags]) {
			const normalized = String(tag).trim().replace(/^#/, "").toLowerCase();
			if (normalized) totals.set(normalized, (totals.get(normalized) ?? 0) + 1);
		}
	}
	return {
		users,
		hashtags: [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([tag, postCount], index) => ({
			tag,
			postCount,
			trending: index < 6
		}))
	};
}
function SearchPage() {
	const [query, setQuery] = (0, import_react.useState)("");
	const [tab, setTab] = (0, import_react.useState)("users");
	const inputRef = (0, import_react.useRef)(null);
	const { history, push, remove, clear } = useSearch();
	const [users, setUsers] = (0, import_react.useState)([]);
	const [hashtags, setHashtags] = (0, import_react.useState)([]);
	const [remoteUsers, setRemoteUsers] = (0, import_react.useState)([]);
	const [userSearchError, setUserSearchError] = (0, import_react.useState)(null);
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		let active = true;
		const load = async () => {
			const next = await loadSearchData();
			if (!active) return;
			setUsers(next.users);
			setHashtags(next.hashtags);
		};
		load();
		const channel = supabase.channel("search-live-data").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "profiles"
		}, () => void load()).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "posts"
		}, () => void load()).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "follows"
		}, () => void load()).subscribe();
		return () => {
			active = false;
			supabase.removeChannel(channel);
		};
	}, []);
	const q = query.trim().toLowerCase().replace(/^[#@]/, "");
	const hasQuery = q.length > 0;
	(0, import_react.useEffect)(() => {
		if (!hasQuery || tab !== "users") {
			setRemoteUsers([]);
			setUserSearchError(null);
			return;
		}
		let active = true;
		const timer = window.setTimeout(() => {
			searchPublicProfiles(query).then((results) => {
				if (active) {
					setRemoteUsers(results);
					setUserSearchError(null);
				}
			}, () => {
				if (active) setUserSearchError("Couldn't search people. Please try again.");
			});
		}, 220);
		return () => {
			active = false;
			window.clearTimeout(timer);
		};
	}, [
		hasQuery,
		query,
		tab
	]);
	const filteredUsers = (0, import_react.useMemo)(() => hasQuery ? remoteUsers : [], [hasQuery, remoteUsers]);
	const filteredHashtags = (0, import_react.useMemo)(() => hasQuery ? hashtags.filter((h) => h.tag.toLowerCase().includes(q)) : [], [
		hasQuery,
		hashtags,
		q
	]);
	const trendingHashtags = (0, import_react.useMemo)(() => hashtags.filter((h) => h.trending).slice(0, 6), [hashtags]);
	function handleUserClick(user) {
		push({
			kind: "user",
			label: user.username,
			sublabel: user.name,
			userId: user.id
		});
		navigate({
			to: "/u/$userId",
			params: { userId: user.id }
		});
	}
	function handleHashtagClick(tag) {
		push({
			kind: "hashtag",
			label: tag
		});
	}
	function clearQuery() {
		setQuery("");
		inputRef.current?.focus();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "grain relative min-h-screen pb-28",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "ambient-canvas"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "header-lux sticky top-0 z-40 px-4 pb-3 pt-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mb-3 font-ui text-[18px] font-semibold leading-none tracking-[-0.03em] text-foreground",
						children: "Search"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex items-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
								className: "pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground",
								strokeWidth: 2
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: inputRef,
								value: query,
								onChange: (e) => setQuery(e.target.value),
								placeholder: "Users, #hashtags…",
								autoComplete: "off",
								autoCorrect: "off",
								spellCheck: false,
								className: "h-10 w-full rounded-[14px] bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)] pl-9 pr-9 font-ui text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-[color-mix(in_oklab,var(--foreground)_18%,transparent)] transition-all duration-200"
							}),
							query && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: clearQuery,
								className: "absolute right-2.5 grid h-5 w-5 place-items-center rounded-full bg-muted-foreground/30 transition-all duration-150 active:scale-90",
								"aria-label": "Clear search",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
									className: "h-3 w-3 text-foreground",
									strokeWidth: 2.5
								})
							})
						]
					}),
					hasQuery && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex gap-1",
						children: ["users", "hashtags"].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setTab(t),
							className: cn("flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 font-ui text-[12px] font-medium transition-all duration-200", tab === t ? "bg-[color-mix(in_oklab,var(--foreground)_12%,transparent)] text-foreground" : "text-muted-foreground"),
							children: [
								t === "hashtags" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hash, {
									className: "h-3 w-3",
									strokeWidth: 2.2
								}),
								t === "users" ? "People" : "Hashtags",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] opacity-60",
									children: t === "users" ? filteredUsers.length : filteredHashtags.length
								})
							]
						}, t))
					})
				]
			}),
			hasQuery ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-4 pt-3",
				children: tab === "users" ? filteredUsers.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-1",
					children: filteredUsers.map((u, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "animate-rise",
						style: { animationDelay: `${i * 35}ms` },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRow, {
							user: u,
							onClick: () => handleUserClick(u)
						})
					}, u.id))
				}) : userSearchError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { label: userSearchError }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { label: `No people match "${q}"` }) : filteredHashtags.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-1",
					children: filteredHashtags.map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "animate-rise",
						style: { animationDelay: `${i * 35}ms` },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HashtagRow, {
							tag: h.tag,
							postCount: h.postCount,
							onClick: () => handleHashtagClick(h.tag)
						})
					}, h.tag))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { label: `No hashtags match "#${q}"` })
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6 px-4 pt-4",
				children: [
					history.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-ui text-[13px] font-semibold text-foreground",
							children: "Recent"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: clear,
							className: "font-ui text-[12px] text-primary transition-opacity active:opacity-60",
							children: "Clear all"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-0.5",
						children: history.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "group flex items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]",
									children: entry.kind === "user" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-ui text-[13px] font-semibold text-foreground/70",
										children: (entry.sublabel ?? entry.label).charAt(0).toUpperCase()
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hash, {
										className: "h-4 w-4 text-foreground/60",
										strokeWidth: 2
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: "min-w-0 flex-1 text-left",
									onClick: () => {
										setQuery(entry.kind === "user" ? `@${entry.label}` : `#${entry.label}`);
										setTab(entry.kind === "user" ? "users" : "hashtags");
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-ui text-[14px] font-medium text-foreground",
										children: entry.kind === "user" ? `@${entry.label}` : `#${entry.label}`
									}), entry.sublabel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-ui text-[12px] text-muted-foreground",
										children: entry.sublabel
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => remove(entry.id),
									"aria-label": "Remove from history",
									className: "grid h-7 w-7 shrink-0 place-items-center rounded-full opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-[color-mix(in_oklab,var(--foreground)_10%,transparent)] active:scale-90",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
										className: "h-3.5 w-3.5 text-muted-foreground",
										strokeWidth: 2.2
									})
								})
							]
						}, entry.id))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, {
							className: "h-4 w-4 text-primary",
							strokeWidth: 2
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-ui text-[13px] font-semibold text-foreground",
							children: "Trending"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "surface-card rounded-[20px] overflow-hidden",
						children: trendingHashtags.map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => {
								setQuery(`#${h.tag}`);
								setTab("hashtags");
								handleHashtagClick(h.tag);
							},
							className: cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)] active:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]", i < trendingHashtags.length - 1 && "border-b border-[color-mix(in_oklab,var(--foreground)_6%,transparent)]"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-ui text-[13px] font-bold text-muted-foreground/50 w-5 shrink-0 text-center",
									children: i + 1
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "font-ui text-[14px] font-semibold text-foreground",
										children: ["#", h.tag]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "font-ui text-[11px] text-muted-foreground",
										children: [formatCount(h.postCount), " posts"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
									className: "h-4 w-4 shrink-0 text-muted-foreground/40",
									strokeWidth: 1.8
								})
							]
						}, h.tag))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-ui text-[13px] font-semibold text-foreground",
							children: "Suggested"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							className: "font-ui text-[12px] text-primary transition-opacity active:opacity-60",
							children: "See all"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1",
						children: users.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuggestedCard, {
							user: u,
							onClick: () => handleUserClick(u)
						}, u.id))
					})] })
				]
			})
		]
	});
}
function UserRow({ user, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: "flex w-full items-center gap-3 rounded-[16px] px-1 py-2 text-left transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)] active:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YwAvatar, {
				user,
				size: 44
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-ui text-[14px] font-semibold text-foreground",
						children: ["@", user.username]
					}), user.verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
							viewBox: "0 0 10 10",
							className: "h-2.5 w-2.5 fill-primary-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: "M2 5l2 2 4-4",
								stroke: "currentColor",
								strokeWidth: "1.5",
								fill: "none",
								strokeLinecap: "round",
								strokeLinejoin: "round"
							})
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-ui text-[12px] text-muted-foreground",
					children: [user.name, user.category ? ` · ${user.category}` : ""]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-ui text-[12px] font-medium text-muted-foreground/70 shrink-0",
				children: user.followerCount !== void 0 && formatCount(user.followerCount)
			})
		]
	});
}
function HashtagRow({ tag, postCount, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: "flex w-full items-center gap-3 rounded-[16px] px-1 py-2 text-left transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)] active:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hash, {
				className: "h-5 w-5 text-foreground/70",
				strokeWidth: 2
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 flex-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-ui text-[14px] font-semibold text-foreground",
				children: ["#", tag]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-ui text-[12px] text-muted-foreground",
				children: [formatCount(postCount), " posts"]
			})]
		})]
	});
}
function SuggestedCard({ user, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: "surface-card flex w-[130px] shrink-0 flex-col items-center rounded-[20px] px-3 pb-3.5 pt-4 text-center transition-transform duration-200 active:scale-95",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YwAvatar, {
				user,
				size: 52
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2.5 w-full truncate font-ui text-[12px] font-semibold text-foreground",
				children: ["@", user.username]
			}),
			user.category && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "w-full truncate font-ui text-[10px] text-muted-foreground",
				children: user.category
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 font-ui text-[11px] font-medium text-muted-foreground/70",
				children: user.followerCount !== void 0 && formatCount(user.followerCount)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 w-full rounded-[10px] bg-primary py-1.5 font-ui text-[11px] font-semibold text-primary-foreground",
				children: "Follow"
			})
		]
	});
}
function EmptyState({ label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center gap-2 py-16 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
			className: "h-8 w-8 text-muted-foreground/30",
			strokeWidth: 1.5
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-ui text-[14px] text-muted-foreground",
			children: label
		})]
	});
}
//#endregion
export { SearchPage as component };
