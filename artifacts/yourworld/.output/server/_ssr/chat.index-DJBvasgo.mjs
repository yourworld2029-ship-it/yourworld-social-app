import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { A as SquarePen, C as Trash2, G as Search, a as X, bn as Check, bt as MessageSquare } from "../_libs/lucide-react.mjs";
import { $ as cacheGet, E as resolveThreadPeer, et as cacheSet, y as dmThreadId } from "./router-DtlJAjv-.mjs";
import { r as useChatNames } from "./chat-names-Dnk0YJkG.mjs";
import { i as useSecretChats } from "./secret-chats-C2KcRray.mjs";
import { i as hiddenThreadIds, t as deleteDirectThreads } from "./chat-delete-BqPUWt2Q.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chat.index-DJBvasgo.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ChatListPage() {
	const [threads, setThreads] = (0, import_react.useState)(() => cacheGet("chat-threads") ?? []);
	const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
	const [newChatOpen, setNewChatOpen] = (0, import_react.useState)(false);
	const [peopleQuery, setPeopleQuery] = (0, import_react.useState)("");
	const [people, setPeople] = (0, import_react.useState)([]);
	const [peopleLoading, setPeopleLoading] = (0, import_react.useState)(false);
	const [me, setMe] = (0, import_react.useState)(null);
	const navigate = useNavigate();
	const [selecting, setSelecting] = (0, import_react.useState)(false);
	const [selected, setSelected] = (0, import_react.useState)([]);
	const [hidden, setHidden] = (0, import_react.useState)(() => hiddenThreadIds());
	const [deleting, setDeleting] = (0, import_react.useState)(false);
	const [loadError, setLoadError] = (0, import_react.useState)(null);
	const pressTimer = (0, import_react.useRef)(null);
	const longPressed = (0, import_react.useRef)(false);
	const { nameFor } = useChatNames();
	const { isHidden } = useSecretChats(searchQuery);
	const toggleSelect = (id) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
	const exitSelect = () => {
		setSelecting(false);
		setSelected([]);
	};
	(0, import_react.useEffect)(() => {
		async function loadThreads() {
			const { data: sessionData } = await supabase.auth.getSession();
			const me = sessionData.session?.user.id ?? null;
			setMe(me);
			if (!me) {
				setThreads([]);
				setLoadError("Sign in to view your chats.");
				return;
			}
			const { data, error } = await supabase.from("messages").select("id,sender_id,receiver_id,content,media_url,voice_note_url,is_read,created_at").or(`sender_id.eq.${me},receiver_id.eq.${me}`).order("created_at", { ascending: false }).limit(2e3);
			if (!error && data) {
				const map = /* @__PURE__ */ new Map();
				data.forEach((msg) => {
					const peerId = msg.sender_id === me ? msg.receiver_id : msg.sender_id;
					const id = dmThreadId(me, peerId);
					const existing = map.get(id);
					const unread = (existing?.unreadCount ?? 0) + (!msg.is_read && msg.sender_id !== me ? 1 : 0);
					if (!existing) {
						map.set(id, {
							id,
							name: "Loading…",
							peerId,
							lastMessage: msg.content || (msg.voice_note_url ? "Voice note" : msg.media_url ? "Media file" : "Message"),
							time: new Date(msg.created_at).toLocaleTimeString([], {
								hour: "2-digit",
								minute: "2-digit"
							}),
							unreadCount: unread
						});
						setLoadError(null);
					} else existing.unreadCount = unread;
				});
				const base = Array.from(map.values());
				setThreads((prev) => base.map((t) => {
					const known = prev.find((p) => p.id === t.id);
					return known ? {
						...t,
						name: known.name,
						peerId: known.peerId,
						avatarUrl: known.avatarUrl
					} : t;
				}));
				const resolved = await Promise.all(base.map(async (t) => {
					const peer = await resolveThreadPeer(t.id, me);
					return {
						...t,
						name: peer.peerName,
						peerId: peer.peerId,
						avatarUrl: peer.avatarUrl ?? void 0
					};
				}));
				setThreads(resolved);
				cacheSet("chat-threads", resolved.slice(0, 30));
			} else if (error) setLoadError(error.message);
		}
		loadThreads();
		let channel = null;
		let retry = null;
		let alive = true;
		const subscribe = () => {
			if (!alive) return;
			channel = supabase.channel(`chat-list-${Math.random().toString(36).slice(2)}`).on("postgres_changes", {
				event: "*",
				schema: "public",
				table: "messages"
			}, () => void loadThreads()).subscribe((status) => {
				if (status === "SUBSCRIBED") {
					loadThreads();
					return;
				}
				if (status !== "CHANNEL_ERROR" && status !== "TIMED_OUT" && status !== "CLOSED") return;
				const failed = channel;
				channel = null;
				if (failed && status !== "CLOSED") window.setTimeout(() => void supabase.removeChannel(failed), 0);
				if (alive && !retry) retry = window.setTimeout(() => {
					retry = null;
					subscribe();
				}, 1500);
			});
		};
		subscribe();
		const resyncOnVisible = () => {
			if (document.visibilityState === "visible") loadThreads();
		};
		const resyncOnOnline = () => void loadThreads();
		document.addEventListener("visibilitychange", resyncOnVisible);
		window.addEventListener("online", resyncOnOnline);
		return () => {
			alive = false;
			if (retry) window.clearTimeout(retry);
			document.removeEventListener("visibilitychange", resyncOnVisible);
			window.removeEventListener("online", resyncOnOnline);
			if (channel) supabase.removeChannel(channel);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!newChatOpen) return;
		let alive = true;
		setPeopleLoading(true);
		const t = setTimeout(async () => {
			const { data: sessionData } = await supabase.auth.getSession();
			const uid = sessionData.session?.user.id ?? null;
			if (alive) setMe(uid);
			const term = peopleQuery.trim();
			const { data } = await supabase.rpc("search_profiles", { search: term });
			if (!alive) return;
			setPeople((data ?? []).filter((p) => p.id !== uid));
			setPeopleLoading(false);
		}, 220);
		return () => {
			alive = false;
			clearTimeout(t);
		};
	}, [newChatOpen, peopleQuery]);
	const pinQuery = /^\d{4,8}$/.test(searchQuery.trim());
	const filteredThreads = threads.filter((t) => !hidden.includes(t.id) && !isHidden(t.peerId) && (pinQuery ? true : t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())));
	const allSelected = filteredThreads.length > 0 && selected.length === filteredThreads.length;
	const removeSelected = async () => {
		const ids = [...selected];
		if (!ids.length) return;
		setDeleting(true);
		setHidden((prev) => [...prev, ...ids]);
		setThreads((prev) => prev.filter((t) => !ids.includes(t.id)));
		await deleteDirectThreads(ids);
		setDeleting(false);
		exitSelect();
	};
	const startPress = (id) => {
		longPressed.current = false;
		pressTimer.current = window.setTimeout(() => {
			longPressed.current = true;
			setSelecting(true);
			setSelected([id]);
		}, 400);
	};
	const cancelPress = () => {
		if (pressTimer.current) window.clearTimeout(pressTimer.current);
		pressTimer.current = null;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-screen flex-col bg-black text-white p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-between mb-4",
				children: selecting ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: exitSelect,
						"aria-label": "Cancel selection",
						className: "rounded-full p-2 hover:bg-zinc-800",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-5 w-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "text-lg font-bold",
						children: [selected.length, " selected"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setSelected(allSelected ? [] : filteredThreads.map((t) => t.id)),
						className: "rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-800",
						children: allSelected ? "Clear all" : "Select all"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => void removeSelected(),
						disabled: !selected.length || deleting,
						"aria-label": "Delete selected chats",
						className: "rounded-full bg-red-600 p-2 disabled:opacity-40",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-5 w-5" })
					})]
				})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold",
					children: "Chats"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [filteredThreads.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setSelecting(true),
						className: "rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-800",
						children: "Select"
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setNewChatOpen(true),
						"aria-label": "Start a new chat",
						className: "p-2 hover:bg-zinc-800 rounded-full",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquarePen, { className: "h-6 w-6" })
					})]
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-2.5 h-4 w-4 text-gray-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "text",
					value: searchQuery,
					onChange: (e) => setSearchQuery(e.target.value),
					placeholder: "Search messages",
					className: "w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-zinc-700"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 overflow-y-auto space-y-2",
				children: [loadError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "alert",
					className: "rounded-xl border border-red-900 bg-red-950/40 p-3 text-xs text-red-300",
					children: loadError
				}) : null, filteredThreads.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center justify-center h-40 text-gray-500",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-10 w-10 mb-2 opacity-50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm",
						children: "No chats found. Click top icon to start!"
					})]
				}) : filteredThreads.map((chat) => {
					const isSel = selected.includes(chat.id);
					const body = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [
							selecting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `grid h-5 w-5 shrink-0 place-items-center rounded-full border ${isSel ? "border-pink-500 bg-pink-600" : "border-zinc-600"}`,
								children: isSel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3 w-3" }) : null
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-12 w-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-lg",
								children: nameFor(chat.peerId, chat.name).charAt(0)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "font-semibold text-sm",
								children: nameFor(chat.peerId, chat.name)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-gray-400 line-clamp-1",
								children: chat.lastMessage
							})] })
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-end gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] text-gray-500",
							children: chat.time
						}), chat.unreadCount && chat.unreadCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full",
							children: chat.unreadCount
						}) : null]
					})] });
					if (selecting) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => toggleSelect(chat.id),
						"aria-pressed": isSel,
						className: `flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors ${isSel ? "bg-zinc-800" : "hover:bg-zinc-900"}`,
						children: body
					}, chat.id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/chat/$threadId",
						params: { threadId: chat.id },
						onPointerDown: () => startPress(chat.id),
						onPointerUp: cancelPress,
						onPointerLeave: cancelPress,
						onClick: (e) => {
							if (longPressed.current) {
								e.preventDefault();
								longPressed.current = false;
							}
						},
						onContextMenu: (e) => {
							e.preventDefault();
							setSelecting(true);
							setSelected([chat.id]);
						},
						className: "flex items-center justify-between p-3 rounded-xl hover:bg-zinc-900 transition-colors",
						children: body
					}, chat.id);
				})]
			}),
			newChatOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-50 flex flex-col bg-black/95 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-4 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-semibold",
							children: "New chat"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setNewChatOpen(false),
							"aria-label": "Close",
							className: "rounded-full p-2 hover:bg-zinc-800",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-5 w-5" })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative mb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-2.5 h-4 w-4 text-gray-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							autoFocus: true,
							value: peopleQuery,
							onChange: (e) => setPeopleQuery(e.target.value),
							placeholder: "Search people by name or username",
							className: "w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-4 text-sm focus:border-zinc-700 focus:outline-none"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 space-y-1 overflow-y-auto",
						children: peopleLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "py-6 text-center text-sm text-gray-500",
							children: "Searching…"
						}) : people.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "py-6 text-center text-sm text-gray-500",
							children: "No accounts found."
						}) : people.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: async () => {
								const uid = me ?? (await supabase.auth.getSession()).data.session?.user.id ?? null;
								if (!uid) return;
								setNewChatOpen(false);
								navigate({
									to: "/chat/$threadId",
									params: { threadId: dmThreadId(uid, p.id) }
								});
							},
							className: "flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-zinc-900",
							children: [p.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: p.avatar_url,
								alt: "",
								className: "h-11 w-11 rounded-full object-cover"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-base font-bold",
								children: nameFor(p.id, p.display_name || p.username || "?").charAt(0).toUpperCase()
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-sm font-semibold",
									children: nameFor(p.id, p.display_name || p.username || `User ${p.id.slice(0, 6)}`)
								}), p.username ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "truncate text-xs text-gray-400",
									children: ["@", p.username]
								}) : null]
							})]
						}, p.id))
					})
				]
			}) : null
		]
	});
}
//#endregion
export { ChatListPage as component };
