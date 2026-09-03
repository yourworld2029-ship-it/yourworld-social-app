import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $t as EllipsisVertical, At as LoaderCircle, C as Trash2, D as Star, G as Search, It as Image, Kt as Flag, Lt as ImagePlus, O as Square, Ot as Lock, Tn as Camera, Tt as MapPin, U as Send, Xt as EyeOff, a as X, at as Phone, bn as Check, cn as Clock, d as VideoOff, dt as Navigation, et as Plus, f as UtensilsCrossed, h as UserX, kn as BellOff, nt as Pizza, sn as Coffee, st as Pencil, u as Video, un as Clapperboard, vn as ChevronLeft, vt as Mic, xn as CheckCheck, zt as Hotel } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { I as loadCachedThread, L as saveCachedThread, l as useCall, n as Route } from "./router-fRQ5zgJf.mjs";
import { r as useMyProfile } from "./profile-data-KSeCgyKd.mjs";
import { n as SheetContent, t as Sheet } from "./sheet-1GT45NG1.mjs";
import { t as UserWatermark } from "./UserWatermark-Cj3id9i0.mjs";
import { n as useCaptureDetect, t as PinDialog } from "./PinDialog-CnToBp8K.mjs";
import { n as setChatNameLocal, r as useChatNames, t as saveChatDisplayName } from "./chat-names-Dnk0YJkG.mjs";
import { r as saveSecretChatLock } from "./secret-chats-C2KcRray.mjs";
import { r as createServerFn } from "./server-BZbPWVG0.mjs";
import { i as stringType, r as objectType } from "../_libs/zod.mjs";
import { a as approxDistance, d as useOrbit, f as useOrbitProfile, s as countRequestMessages, u as uploadOrbitMedia } from "./orbit-store-CboCDVmk.mjs";
import { t as useServerFn } from "./useServerFn-Dd5awcbP.mjs";
import { t as createSsrRpc } from "./createSsrRpc-BFPz1_2R.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/orbit.chat._userId-DjgKXqON.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
function removeOrbitMediaByUrl(url) {
	try {
		const path = new URL(url).pathname.split("/storage/v1/object/sign/orbit-media/")[1];
		if (path) supabase.storage.from("orbit-media").remove([decodeURIComponent(path)]);
	} catch {}
}
var isUnexpiredOrbitRow = (r, now = Date.now()) => !r.expires_at || new Date(r.expires_at).getTime() > now;
var isRenderableOrbitMessage = (m, now = Date.now()) => !m.expiresAt || m.expiresAt > now;
var toMsg = (r, me) => ({
	id: r.id,
	me: r.sender_id === me,
	kind: r.kind ?? "text",
	text: r.text ?? void 0,
	url: r.url ?? void 0,
	viewOnce: r.view_once,
	expiresAt: r.expires_at ? new Date(r.expires_at).getTime() : void 0,
	at: new Date(r.created_at).getTime()
});
/** Real Orbit one-to-one chat: stored in the database and live for both users. */
function useOrbitChat(peerId, enabled, clearedBefore) {
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [meId, setMeId] = (0, import_react.useState)(null);
	const [hasMore, setHasMore] = (0, import_react.useState)(true);
	const [loadingMore, setLoadingMore] = (0, import_react.useState)(false);
	const meRef = (0, import_react.useRef)(null);
	const messagesRef = (0, import_react.useRef)([]);
	const merge = (0, import_react.useCallback)((next) => {
		setMessages((prev) => {
			const map = new Map(prev.map((m) => [m.id, m]));
			for (const m of next) if (isRenderableOrbitMessage(m)) map.set(m.id, m);
			for (const [id, m] of map) if (!isRenderableOrbitMessage(m)) map.delete(id);
			return [...map.values()].sort((a, b) => a.at - b.at);
		});
	}, []);
	(0, import_react.useEffect)(() => {
		messagesRef.current = messages;
		if (enabled && isUuid(peerId)) saveCachedThread(`orbit:${peerId}`, messages.filter((m) => !m.id.startsWith("temp-") && isRenderableOrbitMessage(m)));
	}, [
		messages,
		peerId,
		enabled
	]);
	(0, import_react.useEffect)(() => {
		if (!enabled || !isUuid(peerId)) {
			setMessages([]);
			return;
		}
		let cancelled = false;
		loadCachedThread(`orbit:${peerId}`).then((rows) => {
			if (cancelled || !rows?.length) return;
			merge(rows.filter((row) => isRenderableOrbitMessage(row)));
		});
		const load = async () => {
			const { data: auth } = await supabase.auth.getUser();
			const me = auth.user?.id;
			if (!me || cancelled) return;
			meRef.current = me;
			setMeId(me);
			let query = supabase.from("orbit_messages").select("id,sender_id,recipient_id,kind,text,url,view_once,expires_at,created_at").or(`and(sender_id.eq.${me},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${me})`);
			if (clearedBefore) query = query.gt("created_at", clearedBefore);
			const { data } = await query.order("created_at", { ascending: false }).limit(40);
			if (cancelled) return;
			const rows = (data ?? []).filter((row) => isUnexpiredOrbitRow(row));
			setHasMore(rows.length >= 40);
			merge(rows.map((r) => toMsg(r, me)));
		};
		load();
		let channel = null;
		let retryTimer = null;
		let retries = 0;
		const reconnect = () => {
			if (cancelled || retryTimer !== null || retries >= 5) return;
			retryTimer = window.setTimeout(() => {
				retryTimer = null;
				retries += 1;
				if (channel) supabase.removeChannel(channel);
				subscribe();
			}, Math.min(1e3 * 2 ** retries, 16e3));
		};
		const subscribe = () => {
			if (cancelled) return;
			channel = supabase.channel(`orbit-chat-${peerId}-${Date.now()}`).on("postgres_changes", {
				event: "*",
				schema: "public",
				table: "orbit_messages"
			}, (payload) => {
				const me = meRef.current;
				if (!me) return;
				const row = payload.new ?? payload.old;
				if (!row) return;
				if (!(row.sender_id === me && row.recipient_id === peerId || row.sender_id === peerId && row.recipient_id === me) || !isUnexpiredOrbitRow(row) || clearedBefore && new Date(row.created_at).getTime() <= new Date(clearedBefore).getTime()) return;
				if (payload.eventType === "DELETE") {
					setMessages((prev) => prev.filter((m) => m.id !== row.id));
					return;
				}
				merge([toMsg(row, me)]);
			}).subscribe((status) => {
				if (status === "SUBSCRIBED") {
					retries = 0;
					load();
				} else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") reconnect();
			});
		};
		const resync = () => {
			if (!cancelled && document.visibilityState === "visible" && navigator.onLine) load();
		};
		subscribe();
		window.addEventListener("online", resync);
		document.addEventListener("visibilitychange", resync);
		return () => {
			cancelled = true;
			if (retryTimer !== null) window.clearTimeout(retryTimer);
			window.removeEventListener("online", resync);
			document.removeEventListener("visibilitychange", resync);
			if (channel) supabase.removeChannel(channel);
		};
	}, [
		peerId,
		enabled,
		merge,
		clearedBefore
	]);
	const insert = (0, import_react.useCallback)(async (msg) => {
		const me = meRef.current;
		if (!me || !isUuid(peerId)) return null;
		const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
		merge([{
			id: tempId,
			me: true,
			kind: msg.kind,
			text: msg.text,
			url: msg.url,
			viewOnce: msg.viewOnce,
			at: Date.now()
		}]);
		const { data, error } = await supabase.from("orbit_messages").insert({
			sender_id: me,
			recipient_id: peerId,
			kind: msg.kind,
			text: msg.text ?? null,
			url: msg.url ?? null,
			view_once: !!msg.viewOnce,
			expires_at: msg.expiresIn ? new Date(Date.now() + msg.expiresIn * 1e3).toISOString() : null
		}).select("id,sender_id,recipient_id,kind,text,url,view_once,expires_at,created_at").maybeSingle();
		setMessages((prev) => prev.filter((m) => m.id !== tempId));
		if (error || !data) return null;
		merge([toMsg(data, me)]);
		return data.id;
	}, [peerId, merge]);
	const sendText = (0, import_react.useCallback)((text, expiresIn = 0) => insert({
		kind: "text",
		text,
		expiresIn
	}), [insert]);
	const sendMedia = (0, import_react.useCallback)(async (file, kind, viewOnce = false, expiresIn = 0) => {
		const url = await uploadOrbitMedia(file);
		if (!url) return null;
		const id = await insert({
			kind,
			url,
			viewOnce,
			expiresIn
		});
		if (!id) removeOrbitMediaByUrl(url);
		return id;
	}, [insert]);
	/** Atomically burns received view-once media. The database enforces recipient ownership. */
	const consumeViewOnce = (0, import_react.useCallback)(async (id) => {
		if (!isUuid(id)) return false;
		const message = messagesRef.current.find((m) => m.id === id);
		if (!message || message.me || !message.viewOnce) return false;
		const { data, error } = await supabase.rpc("consume_orbit_view_once", { _msg_id: id });
		if (error) return false;
		const retained = messagesRef.current.filter((m) => m.id !== id && !m.id.startsWith("temp-") && isRenderableOrbitMessage(m));
		messagesRef.current = retained;
		saveCachedThread(`orbit:${peerId}`, retained);
		setMessages((prev) => prev.filter((m) => m.id !== id));
		const url = typeof data === "string" ? data : message.url;
		if (url) removeOrbitMediaByUrl(url);
		return true;
	}, [peerId]);
	const remove = (0, import_react.useCallback)(async (ids) => {
		if (!ids.length) return;
		setMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
		await supabase.from("orbit_messages").delete().in("id", ids.filter(isUuid));
	}, []);
	const clear = (0, import_react.useCallback)(async () => {
		const ids = messages.map((m) => m.id);
		await remove(ids);
	}, [messages, remove]);
	/** Infinite scroll: fetch the previous page of older Orbit messages. */
	const loadOlder = (0, import_react.useCallback)(async () => {
		const me = meRef.current;
		const oldest = messagesRef.current.find((m) => !m.id.startsWith("temp-"))?.at;
		if (!me || !oldest || loadingMore || !hasMore || !isUuid(peerId)) return;
		setLoadingMore(true);
		let query = supabase.from("orbit_messages").select("id,sender_id,recipient_id,kind,text,url,view_once,expires_at,created_at").or(`and(sender_id.eq.${me},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${me})`).lt("created_at", new Date(oldest).toISOString());
		if (clearedBefore) query = query.gt("created_at", clearedBefore);
		const { data } = await query.order("created_at", { ascending: false }).limit(40);
		const rows = (data ?? []).filter((row) => isUnexpiredOrbitRow(row));
		setHasMore(rows.length >= 40);
		if (rows.length) merge(rows.map((r) => toMsg(r, me)));
		setLoadingMore(false);
	}, [
		peerId,
		clearedBefore,
		loadingMore,
		hasMore,
		merge
	]);
	(0, import_react.useEffect)(() => {
		if (!enabled) return;
		const sweep = () => {
			setMessages((prev) => prev.filter((message) => isRenderableOrbitMessage(message)));
			supabase.rpc("delete_expired_orbit_messages");
		};
		sweep();
		const timer = window.setInterval(sweep, 3e4);
		return () => window.clearInterval(timer);
	}, [enabled]);
	return {
		messages,
		meId,
		sendText,
		sendMedia,
		insert,
		consumeViewOnce,
		remove,
		clear,
		loadOlder,
		loadingMore,
		hasMore
	};
}
var OrbitChatGate = ({ profileId, name, request, onAccept, onDecline }) => {
	const { texts, photos } = countRequestMessages(request);
	const messages = request?.messages ?? [];
	if (!request || request.status !== "pending" || request.direction !== "incoming") return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden rounded-2xl border border-zinc-800 bg-black/40 p-4 text-white",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between pb-4 border-b border-zinc-800",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-bold",
					children: name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-zinc-400",
					children: "Orbit Chat Request"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/orbit/$profileId",
					params: { profileId },
					className: "rounded-full border border-zinc-700 px-3 py-1.5 text-xs",
					children: "View Profile"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex-1 overflow-y-auto my-4 space-y-3 pr-1",
				children: messages.map((msg, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "p-3 bg-zinc-900 rounded-xl text-sm border border-zinc-800 flex items-center gap-2",
					children: msg.kind === "text" ? msg.text : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { size: 16 }), " Photo"] })
				}, i))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "pb-3 text-[11px] text-zinc-500 text-center",
				children: [
					texts,
					"/",
					3,
					" texts • ",
					photos,
					"/",
					2,
					" photos before accepting"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-3 pt-2 border-t border-zinc-800",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: onDecline,
					className: "flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-800 rounded-xl text-sm font-medium hover:bg-zinc-700",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 }), " Decline"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: onAccept,
					className: "flex-1 flex items-center justify-center gap-2 py-3 bg-white text-black rounded-xl text-sm font-medium hover:bg-zinc-200",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 16 }), " Accept"]
				})]
			})
		]
	});
};
var inviteOptions = [
	{
		id: "cafe",
		label: "Café",
		icon: Coffee,
		query: "cafes"
	},
	{
		id: "movie",
		label: "Movie",
		icon: Clapperboard,
		query: "movie theatres"
	},
	{
		id: "restaurant",
		label: "Restaurant",
		icon: UtensilsCrossed,
		query: "restaurants"
	},
	{
		id: "meet",
		label: "Meet",
		icon: MapPin,
		query: "parks and public meeting spots"
	},
	{
		id: "food",
		label: "Food",
		icon: Pizza,
		query: "food delivery and takeaway"
	},
	{
		id: "location",
		label: "Location",
		icon: Navigation,
		query: "landmarks"
	},
	{
		id: "hotel",
		label: "Hotel",
		icon: Hotel,
		query: "hotels"
	}
];
var inviteById = (id) => inviteOptions.find((o) => o.id === id) ?? inviteOptions[0];
var buildInvite = (kind, place) => ({
	kind,
	title: `${inviteById(kind).label} invite`,
	place: place.name,
	address: place.address,
	rating: place.rating,
	open: place.open,
	mapsUrl: place.mapsUrl
});
function InvitesDrawer({ open, onOpenChange, onPick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
			side: "bottom",
			className: "rounded-t-3xl border-border/60 p-0 [&>button]:hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 pb-8 pt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-base font-bold",
						children: "Send an invite"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "pt-1 text-xs text-muted-foreground",
						children: "Pick a type, then choose a place from search."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-4 gap-2 pt-4",
						children: inviteOptions.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								onPick(o.id);
								onOpenChange(false);
							},
							className: "flex flex-col items-center gap-1 rounded-2xl chip py-3 text-muted-foreground transition-transform active:scale-95",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(o.icon, {
								className: "h-[18px] w-[18px]",
								strokeWidth: 1.7
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] font-medium",
								children: o.label
							})]
						}, o.id))
					})
				]
			})
		})
	});
}
var schema = objectType({
	query: stringType().trim().min(1).max(120),
	region: stringType().trim().max(120).optional()
});
/** Free, keyless real place search (OpenStreetMap) used when Google Maps isn't connected. */
var searchPlaces = createServerFn({ method: "POST" }).validator((data) => schema.parse(data)).handler(createSsrRpc("86a553360b1d2d5d6c994785348fb63757e6915e3db78e09d21670073a7e667b"));
function PlacePickerSheet({ open, kind, region, onOpenChange, onSelect }) {
	const run = useServerFn(searchPlaces);
	const [query, setQuery] = (0, import_react.useState)("");
	const [places, setPlaces] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [note, setNote] = (0, import_react.useState)(null);
	const search = (0, import_react.useCallback)(async (q) => {
		if (!q.trim()) return;
		setLoading(true);
		setNote(null);
		try {
			const res = await run({ data: {
				query: q,
				region
			} });
			setPlaces(res.places);
			if (res.places.length === 0) setNote("No places matched — try adding a city, e.g. “cafes in Mumbai”.");
		} catch {
			setPlaces([]);
			setNote("Couldn't load places right now. Try another search.");
		} finally {
			setLoading(false);
		}
	}, [region, run]);
	(0, import_react.useEffect)(() => {
		if (!open || !kind) return;
		const seed = inviteById(kind).query;
		setQuery(seed);
		setPlaces([]);
		search(seed);
	}, [
		open,
		kind,
		search
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
			side: "bottom",
			className: "max-h-[88dvh] overflow-y-auto rounded-t-3xl border-border/60 p-0 [&>button]:hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 pb-8 pt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-11 w-11 place-items-center rounded-2xl bg-secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
								className: "h-5 w-5",
								strokeWidth: 1.7
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => onOpenChange(false),
							"aria-label": "Close",
							className: "grid h-8 w-8 place-items-center rounded-full bg-secondary/70 transition-transform active:scale-90",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
								className: "h-4 w-4",
								strokeWidth: 1.8
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "pt-4 font-display text-lg font-bold",
						children: kind ? `Find a place · ${inviteById(kind).label}` : "Find a place"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "pt-1.5 text-sm leading-relaxed text-muted-foreground",
						children: [
							"Search public places ",
							region ? `around ${region}` : "nearby",
							" and send it as an invite."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: (e) => {
							e.preventDefault();
							search(query);
						},
						className: "mt-4 flex items-center gap-2 rounded-full bg-secondary px-4 py-2.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
								className: "h-4 w-4 shrink-0 text-muted-foreground",
								strokeWidth: 1.8
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: query,
								onChange: (e) => setQuery(e.target.value),
								placeholder: "Search cafés, cinemas, parks…",
								"aria-label": "Search places",
								className: "min-w-0 flex-1 bg-transparent text-sm outline-none"
							}),
							loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin text-muted-foreground" })
						]
					}),
					note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "pt-3 text-xs text-muted-foreground",
						children: note
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-2",
						children: places.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-2xl border border-border/60 bg-secondary/40 p-3.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold",
									children: p.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "pt-0.5 text-xs text-muted-foreground",
									children: p.address
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "flex items-center gap-2 pt-1 text-[11px] text-muted-foreground/85",
									children: [typeof p.rating === "number" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
												className: "h-3 w-3",
												strokeWidth: 1.8
											}),
											" ",
											p.rating.toFixed(1)
										]
									}), typeof p.open === "boolean" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p.open ? "Open now" : "Closed now" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										onSelect(p);
										onOpenChange(false);
									},
									className: "mt-3 h-10 w-full rounded-full brand-gradient text-xs font-semibold text-primary-foreground transition-transform active:scale-[0.99]",
									children: "Send invite"
								})
							]
						}, p.id))
					})
				]
			})
		})
	});
}
var migrationSupabase = supabase;
/** Invites travel as a tagged text message so both sides see the same card. */
var INVITE_PREFIX = "orbit-invite:";
function randomPinSalt() {
	const bytes = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(16));
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function hashPin(salt, pin) {
	const bytes = new TextEncoder().encode(`${salt}:${pin}`);
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function toUiMsg(m) {
	if (m.kind === "text" && m.text?.startsWith(INVITE_PREFIX)) try {
		return {
			id: m.id,
			me: m.me,
			at: m.at,
			invite: JSON.parse(m.text.slice(13))
		};
	} catch {}
	return {
		id: m.id,
		me: m.me,
		at: m.at,
		system: m.kind === "system",
		text: m.kind === "audio" ? void 0 : m.text,
		url: m.kind === "photo" || m.kind === "video" ? m.url : void 0,
		video: m.kind === "video",
		audio: m.kind === "audio" ? m.url : void 0,
		viewOnce: m.viewOnce
	};
}
function MenuItem({ icon, label, onClick, state, danger }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-colors ${danger ? "text-destructive hover:bg-destructive/10" : "text-foreground hover:bg-secondary"}`,
		children: [
			icon,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex-1",
				children: label
			}),
			state !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: `relative h-4 w-7 rounded-full transition-colors ${state ? "bg-primary" : "bg-muted"}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `absolute top-0.5 h-3 w-3 rounded-full bg-background transition-all ${state ? "left-3.5" : "left-0.5"}` })
			})
		]
	});
}
var AUTO_DELETE_OPTIONS = [
	{
		value: 0,
		label: "Off"
	},
	{
		value: 3600,
		label: "1 hour"
	},
	{
		value: 86400,
		label: "24 hours"
	},
	{
		value: 604800,
		label: "7 days"
	}
];
function autoDeleteLabel(seconds) {
	return AUTO_DELETE_OPTIONS.find((o) => o.value === seconds)?.label ?? `${Math.round(seconds / 60)}m`;
}
function OrbitChatPage() {
	const { profile: myProfile } = useMyProfile();
	const currentUserName = myProfile.display_name || myProfile.username || "YourWorld user";
	const currentUsername = myProfile.username || "user";
	const { userId } = Route.useParams();
	const navigate = useNavigate();
	const orbit = useOrbit();
	const { profile: p } = useOrbitProfile(userId);
	const { nameFor } = useChatNames();
	const [text, setText] = (0, import_react.useState)("");
	const seq = (0, import_react.useRef)(0);
	const fileRef = (0, import_react.useRef)(null);
	const cameraRef = (0, import_react.useRef)(null);
	const inputRef = (0, import_react.useRef)(null);
	const call = useCall();
	const [invitesOpen, setInvitesOpen] = (0, import_react.useState)(false);
	const [inviteKind, setInviteKind] = (0, import_react.useState)(null);
	const [recording, setRecording] = (0, import_react.useState)(false);
	const recorderRef = (0, import_react.useRef)(null);
	const [menuOpen, setMenuOpen] = (0, import_react.useState)(false);
	const [selectMode, setSelectMode] = (0, import_react.useState)(false);
	const [lightbox, setLightbox] = (0, import_react.useState)(null);
	const [selectedIds, setSelectedIds] = (0, import_react.useState)([]);
	const [actionSheetId, setActionSheetId] = (0, import_react.useState)(null);
	const [actionRect, setActionRect] = (0, import_react.useState)(null);
	const longPressRef = (0, import_react.useRef)(null);
	const [displayName, setDisplayName] = (0, import_react.useState)(null);
	const [secretLock, setSecretLock] = (0, import_react.useState)(false);
	const [viewOnceMode, setViewOnceMode] = (0, import_react.useState)(false);
	const [autoDelete, setAutoDelete] = (0, import_react.useState)(0);
	const [screenshotAlert, setScreenshotAlert] = (0, import_react.useState)(true);
	const [recordingAlert, setRecordingAlert] = (0, import_react.useState)(true);
	const [muted, setMuted] = (0, import_react.useState)(false);
	const [reported, setReported] = (0, import_react.useState)(false);
	const [settingsReady, setSettingsReady] = (0, import_react.useState)(false);
	const [clearedBefore, setClearedBefore] = (0, import_react.useState)(null);
	const [secretPinSalt, setSecretPinSalt] = (0, import_react.useState)(null);
	const [secretPinHash, setSecretPinHash] = (0, import_react.useState)(null);
	const [chatUnlocked, setChatUnlocked] = (0, import_react.useState)(true);
	const [unlockPin, setUnlockPin] = (0, import_react.useState)("");
	const [unlockError, setUnlockError] = (0, import_react.useState)(null);
	const [pinMode, setPinMode] = (0, import_react.useState)(null);
	const [pinError, setPinError] = (0, import_react.useState)(null);
	const [nameDialogOpen, setNameDialogOpen] = (0, import_react.useState)(false);
	const [nameDraft, setNameDraft] = (0, import_react.useState)("");
	const [autoDeleteOpen, setAutoDeleteOpen] = (0, import_react.useState)(false);
	const prefsKey = `yw.orbit.chatprefs.${userId}`;
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const loadSettings = async () => {
			try {
				const { data: authData } = await supabase.auth.getUser();
				const me = authData.user?.id ?? null;
				const { data } = me ? await supabase.from("orbit_chat_settings").select("display_name,secret_lock_enabled,secret_pin_salt,secret_pin_hash,view_once_mode,auto_delete_seconds,screenshot_alert,recording_alert,muted,cleared_before").eq("user_id", me).eq("peer_id", userId).maybeSingle() : { data: null };
				if (me) {
					const { data: block } = await migrationSupabase.from("user_blocks").select("blocked_id").eq("blocker_id", me).eq("blocked_id", userId).maybeSingle();
					if (!!block !== orbit.privacy.blocked.includes(userId)) orbit.toggleBlocked(userId);
				}
				const raw = window.localStorage.getItem(prefsKey);
				const local = raw ? JSON.parse(raw) : {};
				const row = data;
				const v = row ?? local;
				setDisplayName(v["displayName"] ?? null);
				if (row) {
					setDisplayName(row["display_name"] ?? null);
					setChatNameLocal(userId, row["display_name"] ?? null);
				}
				const locked = row ? !!row["secret_lock_enabled"] : !!v["secretLock"];
				setSecretLock(locked);
				setSecretPinSalt(row?.["secret_pin_salt"] ?? null);
				setSecretPinHash(row?.["secret_pin_hash"] ?? null);
				setChatUnlocked(!locked);
				setViewOnceMode(row ? !!row["view_once_mode"] : !!v["viewOnceMode"]);
				setAutoDelete(Number(row?.["auto_delete_seconds"] ?? v["autoDelete"]) || 0);
				setScreenshotAlert(row ? row["screenshot_alert"] !== false : v["screenshotAlert"] !== false);
				setRecordingAlert(row ? row["recording_alert"] !== false : v["recordingAlert"] !== false);
				setMuted(!!v["muted"]);
				if (row) setMuted(!!row["muted"]);
				setClearedBefore(row?.["cleared_before"] ?? null);
				const { data: report } = me ? await migrationSupabase.from("user_reports").select("id").eq("reporter_id", me).eq("reported_user_id", userId).eq("surface", "orbit").maybeSingle() : { data: null };
				if (cancelled) return;
				setReported(!!report);
				setSettingsReady(true);
			} catch {
				if (!cancelled) setSettingsReady(true);
			}
		};
		loadSettings();
		return () => {
			cancelled = true;
		};
	}, [
		prefsKey,
		userId,
		orbit
	]);
	(0, import_react.useEffect)(() => {
		if (!settingsReady) return;
		try {
			window.localStorage.setItem(prefsKey, JSON.stringify({
				displayName,
				secretLock,
				viewOnceMode,
				autoDelete,
				screenshotAlert,
				recordingAlert,
				muted,
				reported
			}));
			const t = setTimeout(() => {
				supabase.auth.getUser().then(({ data }) => {
					const me = data.user?.id;
					if (!me) return;
					supabase.from("orbit_chat_settings").upsert({
						user_id: me,
						peer_id: userId,
						display_name: displayName,
						view_once_mode: viewOnceMode,
						auto_delete_seconds: autoDelete,
						screenshot_alert: screenshotAlert,
						recording_alert: recordingAlert,
						muted,
						cleared_before: clearedBefore
					}, { onConflict: "user_id,peer_id" });
				});
			}, 0);
			return () => clearTimeout(t);
		} catch {}
	}, [
		prefsKey,
		displayName,
		secretLock,
		viewOnceMode,
		autoDelete,
		screenshotAlert,
		recordingAlert,
		muted,
		reported,
		settingsReady,
		secretPinSalt,
		secretPinHash,
		clearedBefore,
		userId
	]);
	const request = orbit.requests[userId];
	const accepted = request?.status === "accepted" || !request && !!orbit.connected[userId];
	const incomingPending = request?.direction === "incoming" && request.status === "pending";
	const outgoingPending = request?.direction === "outgoing" && request.status === "pending";
	const declined = request?.status === "declined";
	const preMessages = request?.messages ?? [];
	const { texts: sentTexts, photos: sentPhotos } = countRequestMessages(request);
	const textsLeft = 3 - sentTexts;
	const photosLeft = 2 - sentPhotos;
	const chat = useOrbitChat(userId, accepted, clearedBefore);
	const msgScrollRef = (0, import_react.useRef)(null);
	const [notes, setNotes] = (0, import_react.useState)([]);
	const msgs = (0, import_react.useMemo)(() => [...chat.messages.map(toUiMsg), ...notes].sort((a, b) => (a.at ?? 0) - (b.at ?? 0)), [chat.messages, notes]);
	(0, import_react.useEffect)(() => {
		if (!accepted) setNotes([]);
	}, [accepted, userId]);
	const scrollToLatest = () => {
		requestAnimationFrame(() => {
			const el = msgScrollRef.current;
			if (el) el.scrollTo({
				top: el.scrollHeight,
				behavior: "smooth"
			});
		});
	};
	(0, import_react.useEffect)(() => {
		const viewport = window.visualViewport;
		if (!viewport) return;
		const onViewportChange = () => scrollToLatest();
		viewport.addEventListener("resize", onViewportChange);
		viewport.addEventListener("scroll", onViewportChange);
		return () => {
			viewport.removeEventListener("resize", onViewportChange);
			viewport.removeEventListener("scroll", onViewportChange);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const t = setTimeout(() => {
			const el = inputRef.current;
			if (el && !el.disabled) el.focus();
		}, 250);
		return () => clearTimeout(t);
	}, [userId]);
	const pushSystem = (text) => {
		seq.current += 1;
		setNotes((n) => [...n, {
			id: `note-${seq.current}`,
			me: false,
			system: true,
			text,
			at: Date.now()
		}]);
	};
	useCaptureDetect(accepted && orbit.privacy.screenshotAlerts && (screenshotAlert || recordingAlert), (kind) => {
		if (kind === "recording" ? !recordingAlert : !screenshotAlert) return;
		chat.insert({
			kind: "system",
			text: `${currentUserName} took a ${kind === "recording" ? "recording" : "screenshot"}`,
			expiresIn: autoDelete
		}).then((id) => {
			if (!id) toast.error("Security alert could not be delivered.");
		});
	});
	const startRecording = async () => {
		if (!accepted) {
			toast.warning("Voice notes unlock once your Orbit request is accepted.");
			return;
		}
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const rec = new MediaRecorder(stream);
			const chunks = [];
			rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
			rec.onstop = () => {
				stream.getTracks().forEach((t) => t.stop());
				const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
				chat.sendMedia(new File([blob], `voice-${Date.now()}.webm`, { type: blob.type || "audio/webm" }), "audio", false, autoDelete).then((id) => {
					if (!id) toast.error("Voice note could not be sent. Please try again.");
				});
			};
			rec.start();
			recorderRef.current = rec;
			setRecording(true);
		} catch {
			toast.error("Microphone permission is needed for voice notes.");
		}
	};
	const stopRecording = () => {
		recorderRef.current?.stop();
		recorderRef.current = null;
		setRecording(false);
	};
	(0, import_react.useEffect)(() => () => recorderRef.current?.stop(), []);
	const startCall = (mode) => {
		if (!accepted) {
			toast.warning("Calls unlock once your Orbit request is accepted.");
			return;
		}
		if (!orbit.privacy.callsEnabled) {
			toast.warning("Calls are turned off in your Orbit privacy settings.");
			return;
		}
		if (orbit.privacy.whoCanCall === "nobody") {
			toast.warning("Your Orbit call privacy is set to nobody.");
			return;
		}
		if (orbit.privacy.whoCanCall === "connections" && !orbit.connected[userId]) {
			toast.warning("Calls are available to Orbit connections only.");
			return;
		}
		if (orbit.privacy.blocked.includes(userId)) {
			toast.error("Unblock this person to call them.");
			return;
		}
		call.startCall({
			peerId: userId,
			peerName: displayName ?? p?.name ?? "Orbit",
			mode: mode === "video" ? "video" : "audio"
		});
	};
	const localIds = (0, import_react.useMemo)(() => new Set(msgs.map((m) => m.id)), [msgs]);
	if (!p) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-screen place-items-center px-6 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground",
			children: "This Orbit chat is not available."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/orbit/messages",
			className: "mt-4 inline-block rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background",
			children: "Back to Orbit Messages"
		})] })
	});
	const send = () => {
		const t = text.trim();
		if (!t) return;
		if (declined || incomingPending) return;
		if (!accepted) {
			if (!orbit.sendRequestMessage(userId, {
				kind: "text",
				text: t
			})) {
				toast.error(`You can send 3 texts until ${p.name} accepts`);
				return;
			}
			setText("");
			if (!outgoingPending) toast.success(`Request sent to ${p.name}`);
			return;
		}
		chat.sendText(t, autoDelete).then((id) => {
			if (!id) toast.error("Message could not be sent. Please try again.");
		});
		setText("");
	};
	const sendPhoto = async (file) => {
		if (accepted) {
			if (!await chat.sendMedia(file, "photo", viewOnceMode, autoDelete)) toast.error("Photo could not be sent. Please try again.");
			return;
		}
		if (!orbit.sendRequestMessage(userId, {
			kind: "photo",
			url: URL.createObjectURL(file)
		})) toast.error(`You can send 2 photos until ${p.name} accepts`);
	};
	const isDeletable = (id) => localIds.has(id) && msgs.find((m) => m.id === id)?.me === true;
	const startLongPress = (id, rect, me) => {
		if (longPressRef.current) clearTimeout(longPressRef.current);
		longPressRef.current = setTimeout(() => {
			setActionSheetId(id);
			setActionRect({
				rect,
				me
			});
		}, 450);
	};
	const cancelLongPress = () => {
		if (longPressRef.current) clearTimeout(longPressRef.current);
		longPressRef.current = null;
	};
	const toggleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
	const deleteIds = (ids) => {
		setNotes((m) => m.filter((x) => !ids.includes(x.id)));
		chat.remove(ids);
		setSelectedIds([]);
	};
	const exitSelectMode = () => {
		setSelectMode(false);
		setSelectedIds([]);
	};
	const clearChat = () => {
		setNotes([]);
		setClearedBefore((/* @__PURE__ */ new Date()).toISOString());
		exitSelectMode();
		setMenuOpen(false);
		toast.success("Chat cleared");
	};
	const toggleSecretLock = () => {
		setPinError(null);
		setPinMode(secretLock ? "remove" : "set");
	};
	const submitPin = async (pin) => {
		try {
			if (pinMode === "remove") {
				if (!pin || !secretPinSalt || !secretPinHash || await hashPin(secretPinSalt, pin) !== secretPinHash) {
					setPinError("Incorrect PIN");
					return;
				}
				await saveSecretChatLock(userId, false, null, null);
				setSecretLock(false);
				setSecretPinSalt(null);
				setSecretPinHash(null);
				setChatUnlocked(true);
				setPinMode(null);
				toast.success("Secret Lock removed");
				return;
			}
			if (!/^\d{4,8}$/.test(pin)) {
				setPinError("Use a 4–8 digit PIN");
				return;
			}
			const salt = randomPinSalt();
			const hash = await hashPin(salt, pin);
			await saveSecretChatLock(userId, true, salt, hash);
			setSecretPinSalt(salt);
			setSecretPinHash(hash);
			setSecretLock(true);
			setChatUnlocked(true);
			setPinMode(null);
			toast.success("Secret Lock enabled");
		} catch (err) {
			console.error("[secret-lock] save failed", err);
			setPinError("Couldn't save. Check your connection and try again.");
		}
	};
	const reportUser = async () => {
		if (reported) {
			toast.info("This report is already under review");
			return;
		}
		const reason = window.prompt("Tell us what happened:");
		if (!reason?.trim() || reason.trim().length < 3) return;
		const { data: auth } = await supabase.auth.getUser();
		const reporterId = auth.user?.id;
		if (!reporterId) return;
		const { error } = await migrationSupabase.from("user_reports").upsert({
			reporter_id: reporterId,
			reported_user_id: userId,
			surface: "orbit",
			reason: reason.trim().slice(0, 500)
		}, { onConflict: "reporter_id,reported_user_id,surface" });
		if (error) {
			toast.error("Report could not be sent");
			return;
		}
		setReported(true);
		toast.success("Report sent for review");
	};
	const blocked = orbit.privacy.blocked.includes(userId);
	const name = nameFor(userId, displayName ?? p.name);
	const inputDisabled = incomingPending || declined || blocked || !accepted && textsLeft <= 0 || selectMode;
	const photoDisabled = incomingPending || declined || blocked || !accepted && photosLeft <= 0;
	const allMsgs = accepted ? [...preMessages.map((m) => ({
		id: m.id,
		me: m.me,
		text: m.text,
		url: m.url
	})), ...msgs] : preMessages.map((m) => ({
		id: m.id,
		me: m.me,
		text: m.text,
		url: m.url
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex h-[100dvh] flex-col overflow-hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-50 flex shrink-0 items-center gap-2 border-b border-border bg-background px-3 pb-2.5 pt-[calc(env(safe-area-inset-top,0px)+0.625rem)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => navigate({ to: "/orbit/messages" }),
						"aria-label": "Back to Orbit Messages",
						className: "grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
							className: "h-5 w-5",
							strokeWidth: 1.8
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/orbit/$profileId",
						params: { profileId: p.id },
						className: "flex min-w-0 flex-1 items-center gap-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: p.photo,
							alt: p.name,
							className: "h-9 w-9 rounded-full object-cover"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1 truncate text-sm font-semibold",
								children: [
									name,
									secretLock && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
										className: "h-3 w-3 text-primary",
										strokeWidth: 2
									}),
									muted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellOff, {
										className: "h-3 w-3 text-muted-foreground",
										strokeWidth: 2
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-[11px] text-muted-foreground",
								children: blocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-destructive",
									children: "Blocked"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									p.city,
									" · ",
									approxDistance(p.distanceKm)
								] })
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex shrink-0 items-center gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => startCall("voice"),
								"aria-label": "Voice call",
								className: "grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90 disabled:opacity-40",
								disabled: !accepted,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, {
									className: "h-[18px] w-[18px]",
									strokeWidth: 1.8
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => startCall("video"),
								"aria-label": "Video call",
								className: "grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90 disabled:opacity-40",
								disabled: !accepted,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, {
									className: "h-[18px] w-[18px]",
									strokeWidth: 1.8
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setMenuOpen((v) => !v),
								"aria-label": "Chat options",
								className: "grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EllipsisVertical, {
									className: "h-[18px] w-[18px]",
									strokeWidth: 1.8
								})
							})
						]
					}),
					menuOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "fixed inset-0 z-[101]",
						onClick: () => setMenuOpen(false)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "fixed right-2 top-14 z-[102] max-h-[calc(100dvh-4rem)] w-64 overflow-y-auto rounded-2xl border border-border bg-popover/95 p-2 shadow-2xl backdrop-blur-md",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, {
									className: "h-4 w-4 text-muted-foreground",
									strokeWidth: 1.8
								}),
								label: "Change Display Name",
								onClick: () => {
									setNameDraft(displayName ?? name);
									setNameDialogOpen(true);
									setMenuOpen(false);
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
									className: "h-4 w-4 text-muted-foreground",
									strokeWidth: 1.8
								}),
								label: "Secret Lock Chat",
								state: secretLock,
								onClick: () => {
									toggleSecretLock();
									setMenuOpen(false);
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, {
									className: "h-4 w-4 text-muted-foreground",
									strokeWidth: 1.8
								}),
								label: "View Once Mode",
								state: viewOnceMode,
								onClick: () => {
									setViewOnceMode((v) => {
										pushSystem(`View once mode ${!v ? "on" : "off"}`);
										return !v;
									});
									setMenuOpen(false);
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
									className: "h-4 w-4 text-muted-foreground",
									strokeWidth: 1.8
								}),
								label: autoDelete ? `Auto Delete: ${autoDeleteLabel(autoDelete)}` : "Auto Delete Messages",
								state: autoDelete > 0,
								onClick: () => {
									setAutoDeleteOpen(true);
									setMenuOpen(false);
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {
									className: "h-4 w-4 text-muted-foreground",
									strokeWidth: 1.8
								}),
								label: "Screenshot Alert",
								state: screenshotAlert,
								onClick: () => {
									setScreenshotAlert((v) => {
										pushSystem(`Screenshot alerts ${!v ? "on" : "off"}`);
										return !v;
									});
									setMenuOpen(false);
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoOff, {
									className: "h-4 w-4 text-muted-foreground",
									strokeWidth: 1.8
								}),
								label: "Screen Recording Alert",
								state: recordingAlert,
								onClick: () => {
									setRecordingAlert((v) => {
										pushSystem(`Recording alerts ${!v ? "on" : "off"}`);
										return !v;
									});
									setMenuOpen(false);
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellOff, {
									className: "h-4 w-4 text-muted-foreground",
									strokeWidth: 1.8
								}),
								label: "Mute Notifications",
								state: muted,
								onClick: () => {
									setMuted((v) => {
										pushSystem(`Notifications ${!v ? "muted" : "unmuted"}`);
										return !v;
									});
									setMenuOpen(false);
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
									className: "h-4 w-4 text-muted-foreground",
									strokeWidth: 1.8
								}),
								label: "Clear Chat",
								onClick: clearChat
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCheck, {
									className: "h-4 w-4 text-muted-foreground",
									strokeWidth: 1.8
								}),
								label: "Select Multiple",
								onClick: () => {
									exitSelectMode();
									setSelectMode(true);
									setMenuOpen(false);
									toast.info("Tap messages to select multiple for deletion");
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
								danger: true,
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserX, {
									className: "h-4 w-4 text-destructive",
									strokeWidth: 1.8
								}),
								label: blocked ? "Unblock User" : "Block User",
								state: blocked,
								onClick: () => {
									(async () => {
										const { data: auth } = await supabase.auth.getUser();
										const me = auth.user?.id;
										if (!me) {
											toast.error("Please sign in to update blocks.");
											return;
										}
										const { error } = blocked ? await migrationSupabase.from("user_blocks").delete().eq("blocker_id", me).eq("blocked_id", userId) : await migrationSupabase.from("user_blocks").insert({
											blocker_id: me,
											blocked_id: userId
										});
										if (error) {
											toast.error(`User could not be ${blocked ? "unblocked" : "blocked"}.`);
											return;
										}
										orbit.toggleBlocked(userId);
										pushSystem(`${name} ${!blocked ? "blocked" : "unblocked"}`);
									})();
									setMenuOpen(false);
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
								danger: true,
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, {
									className: "h-4 w-4 text-destructive",
									strokeWidth: 1.8
								}),
								label: reported ? "Reported" : "Report User",
								state: reported,
								onClick: () => {
									reportUser();
									setMenuOpen(false);
								}
							})
						]
					})] })
				]
			}),
			nameDialogOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-[130] grid place-items-center bg-black/60 px-6",
				onClick: () => setNameDialogOpen(false),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onClick: (e) => e.stopPropagation(),
					onSubmit: (e) => {
						e.preventDefault();
						const next = nameDraft.trim();
						setDisplayName(next || null);
						setChatNameLocal(userId, next || null);
						saveChatDisplayName(userId, next || null).then((ok) => {
							if (!ok) toast.error("Display name could not be saved.");
						});
						pushSystem(next ? `Display name changed to ${next}` : "Display name reset");
						setNameDialogOpen(false);
					},
					className: "w-full max-w-xs space-y-4 rounded-2xl border border-border bg-popover p-5 shadow-2xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-bold",
							children: "Change display name"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: nameDraft,
							onChange: (e) => setNameDraft(e.target.value.slice(0, 40)),
							autoFocus: true,
							"aria-label": "Display name",
							className: "h-11 w-full rounded-xl bg-secondary px-4 text-sm outline-none"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setNameDialogOpen(false),
								className: "h-10 flex-1 rounded-xl bg-secondary text-xs font-semibold",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								className: "h-10 flex-1 rounded-xl bg-primary text-xs font-bold text-primary-foreground",
								children: "Save"
							})]
						})
					]
				})
			}),
			autoDeleteOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-[130] grid place-items-center bg-black/60 px-6",
				onClick: () => setAutoDeleteOpen(false),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					onClick: (e) => e.stopPropagation(),
					className: "w-full max-w-xs space-y-1 rounded-2xl border border-border bg-popover p-4 shadow-2xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "px-2 pb-2 text-sm font-bold",
						children: "Auto delete messages"
					}), AUTO_DELETE_OPTIONS.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							setAutoDelete(opt.value);
							pushSystem(opt.value ? `Messages auto delete after ${opt.label}` : "Auto delete turned off");
							setAutoDeleteOpen(false);
						},
						className: `flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary ${autoDelete === opt.value ? "font-bold text-primary" : "text-foreground"}`,
						children: [opt.label, autoDelete === opt.value && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCheck, {
							className: "h-4 w-4",
							strokeWidth: 2
						})]
					}, opt.value))]
				})
			}),
			secretLock && !chatUnlocked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 z-[120] grid place-items-center bg-background px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "w-full max-w-xs space-y-4 text-center",
					onSubmit: (event) => {
						event.preventDefault();
						(async () => {
							if (!secretPinSalt || !secretPinHash || await hashPin(secretPinSalt, unlockPin) !== secretPinHash) {
								setUnlockError("Incorrect PIN");
								setUnlockPin("");
								return;
							}
							setUnlockError(null);
							setChatUnlocked(true);
							setUnlockPin("");
						})();
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
							className: "mx-auto h-8 w-8 text-primary",
							strokeWidth: 1.7
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-lg font-bold",
							children: "Secret chat locked"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: "Enter your PIN to open this conversation."
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: unlockPin,
							onChange: (event) => {
								setUnlockPin(event.target.value.replace(/\D/g, "").slice(0, 8));
								setUnlockError(null);
							},
							inputMode: "numeric",
							type: "password",
							autoFocus: true,
							"aria-label": "Secret chat PIN",
							className: "h-12 w-full rounded-xl bg-secondary px-4 text-center text-lg outline-none"
						}),
						unlockError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium text-destructive",
							children: unlockError
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							className: "h-11 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground",
							children: "Unlock"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PinDialog, {
				open: pinMode !== null,
				title: pinMode === "remove" ? "Remove Secret Lock" : "Create chat PIN",
				description: pinMode === "remove" ? "Enter the PIN for this chat to remove the lock." : "Choose a 4–8 digit PIN. You'll need it to open this chat.",
				confirmLabel: pinMode === "remove" ? "Remove" : "Lock chat",
				error: pinError,
				onCancel: () => {
					setPinMode(null);
					setPinError(null);
				},
				onSubmit: (pin) => void submitPin(pin)
			}),
			selectMode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex shrink-0 items-center justify-between border-b border-border bg-secondary/60 px-4 py-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: exitSelectMode,
						className: "text-xs font-semibold text-muted-foreground",
						children: "Cancel"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-xs font-bold text-foreground",
						children: [selectedIds.length, " selected"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							deleteIds(selectedIds);
							setSelectMode(false);
						},
						disabled: selectedIds.length === 0,
						className: `flex items-center gap-1 text-xs font-bold transition-colors ${selectedIds.length ? "text-destructive" : "text-muted-foreground/50"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
							className: "h-3.5 w-3.5",
							strokeWidth: 1.8
						}), " Delete"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				ref: msgScrollRef,
				onScroll: () => {
					const el = msgScrollRef.current;
					if (!el || el.scrollTop > 80 || chat.loadingMore || !chat.hasMore) return;
					const prevHeight = el.scrollHeight;
					chat.loadOlder().then(() => {
						requestAnimationFrame(() => {
							if (msgScrollRef.current) msgScrollRef.current.scrollTop = msgScrollRef.current.scrollHeight - prevHeight;
						});
					});
				},
				className: "relative min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserWatermark, {
						username: currentUsername,
						className: "fixed"
					}),
					chat.loadingMore ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "py-1 text-center text-[11px] text-muted-foreground",
						children: "Loading older messages…"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitChatGate, {
						profileId: p.id,
						name: p.name,
						request,
						onAccept: () => {
							orbit.acceptRequest(userId);
							toast.success(`You're now connected with ${p.name}`);
						},
						onDecline: () => {
							orbit.declineRequest(userId);
							toast.success("Request declined");
						}
					}),
					allMsgs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "pt-10 text-center text-xs text-muted-foreground",
						children: accepted ? `Say hello to ${p.name} — messages here stay inside Orbit.` : `Send up to 3 texts and 2 photos to request a chat with ${p.name}.`
					}) : allMsgs.map((m) => {
						if (m.system) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mx-auto flex w-fit items-center gap-2 rounded-full bg-secondary/70 px-3 py-1 text-center text-[11px] text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: m.text }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
								dateTime: m.at ? new Date(m.at).toISOString() : void 0,
								className: "text-[10px] opacity-70",
								children: m.at ? new Date(m.at).toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit"
								}) : ""
							})]
						}, m.id);
						const deletable = isDeletable(m.id);
						const selected = selectedIds.includes(m.id);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							...deletable ? {
								onPointerDown: (e) => {
									if (!selectMode) startLongPress(m.id, e.currentTarget.getBoundingClientRect(), m.me);
								},
								onPointerUp: cancelLongPress,
								onPointerLeave: cancelLongPress,
								onContextMenu: (e) => {
									e.preventDefault();
									if (!selectMode) {
										setActionSheetId(m.id);
										setActionRect({
											rect: e.currentTarget.getBoundingClientRect(),
											me: m.me
										});
									}
								},
								onClick: () => selectMode && toggleSelect(m.id)
							} : {},
							className: `flex flex-col ${m.me ? "items-end" : "items-start"} ${selectMode && selected ? "rounded-2xl bg-primary/10 ring-1 ring-primary/40" : ""} ${selectMode && deletable ? "cursor-pointer select-none px-1 py-1" : ""}`,
							children: [selectMode && deletable && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `mb-1 flex h-4 w-4 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`,
								children: selected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
									className: "h-2.5 w-2.5",
									strokeWidth: 3
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `max-w-[75%] overflow-hidden rounded-2xl text-sm ${m.url || m.invite ? "" : "px-3.5 py-2"} ${m.me ? "bg-primary text-primary-foreground" : "chip text-foreground"}`,
								children: m.invite ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InviteBubble, { invite: m.invite }) : m.audio ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
									src: m.audio,
									controls: true,
									className: "h-9 w-56 max-w-full"
								}) : m.url ? m.viewOnce ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitViewOnce, {
									src: m.url,
									seconds: 5,
									sentByMe: m.me,
									onConsumed: () => chat.consumeViewOnce(m.id)
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										if (!selectMode) setLightbox({
											url: m.url,
											video: !!m.video
										});
									},
									className: "relative block h-40 w-full",
									"aria-label": m.video ? "Open video" : "Open photo",
									children: m.video ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
										src: m.url,
										className: "h-40 w-full object-cover",
										muted: true,
										playsInline: true,
										preload: "metadata"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "absolute inset-0 grid place-items-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "grid h-10 w-10 place-items-center rounded-full bg-background/70 backdrop-blur",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, {
												className: "h-4 w-4",
												strokeWidth: 1.8
											})
										})
									})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: m.url,
										alt: "Shared photo",
										className: "h-40 w-full object-cover"
									})
								}) : m.text
							})]
						}, m.id);
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
				onSubmit: (e) => {
					e.preventDefault();
					send();
				},
				className: "sticky bottom-0 z-40 shrink-0 border-t border-border bg-background px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: fileRef,
							type: "file",
							accept: "image/*",
							className: "hidden",
							onChange: (e) => {
								const f = e.target.files?.[0];
								if (f) sendPhoto(f);
								e.target.value = "";
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: cameraRef,
							type: "file",
							accept: "image/*",
							capture: "environment",
							className: "hidden",
							onChange: (e) => {
								const f = e.target.files?.[0];
								if (f) sendPhoto(f);
								e.target.value = "";
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => fileRef.current?.click(),
							disabled: photoDisabled,
							"aria-label": "Send photo",
							className: "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary transition-transform active:scale-90 disabled:opacity-50",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, {
								className: "h-4 w-4",
								strokeWidth: 1.8
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								if (!accepted) {
									toast.warning("Invites unlock once your Orbit request is accepted.");
									return;
								}
								setInvitesOpen(true);
							},
							disabled: incomingPending || declined,
							"aria-label": "Open invites",
							className: "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary transition-transform active:scale-90 disabled:opacity-50",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
								className: "h-4 w-4",
								strokeWidth: 1.8
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => recording ? stopRecording() : void startRecording(),
							disabled: incomingPending || declined,
							"aria-label": recording ? "Stop voice note" : "Record voice note",
							className: `grid h-10 w-10 shrink-0 place-items-center rounded-full transition-transform active:scale-90 disabled:opacity-50 ${recording ? "bg-destructive text-destructive-foreground" : "bg-secondary"}`,
							children: recording ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, {
								className: "h-3.5 w-3.5",
								strokeWidth: 2.2
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, {
								className: "h-4 w-4",
								strokeWidth: 1.8
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => cameraRef.current?.click(),
							disabled: photoDisabled,
							"aria-label": "Open camera",
							className: "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary transition-transform active:scale-90 disabled:opacity-50",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {
								className: "h-4 w-4",
								strokeWidth: 1.8
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: inputRef,
							value: text,
							onChange: (e) => setText(e.target.value),
							onFocus: scrollToLatest,
							disabled: inputDisabled,
							placeholder: incomingPending || declined ? "Waiting for the request to be accepted" : !accepted && textsLeft <= 0 ? "Text limit reached until accepted" : accepted ? `Message ${p.name}` : `${textsLeft} of 3 texts left`,
							"aria-label": `Message ${p.name}`,
							className: "min-w-0 flex-1 rounded-full bg-secondary px-4 py-2.5 text-sm outline-none disabled:opacity-50"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: inputDisabled,
							"aria-label": "Send message",
							className: "grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-90 disabled:opacity-50",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
								className: "h-4 w-4",
								strokeWidth: 1.8
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvitesDrawer, {
				open: invitesOpen,
				onOpenChange: setInvitesOpen,
				onPick: (kind) => setInviteKind(kind)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlacePickerSheet, {
				open: inviteKind !== null,
				kind: inviteKind,
				region: p.city,
				onOpenChange: (o) => !o && setInviteKind(null),
				onSelect: (place) => {
					if (!inviteKind) return;
					chat.sendText(`${INVITE_PREFIX}${JSON.stringify(buildInvite(inviteKind, place))}`, autoDelete).then((id) => {
						if (!id) toast.error("Invite could not be sent. Please try again.");
						else toast.success(`Invite sent to ${p.name}`, { description: place.name });
					});
					setInviteKind(null);
				}
			}),
			actionSheetId !== null && actionRect && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionPopover, {
				rect: actionRect.rect,
				me: actionRect.me,
				onDelete: () => {
					deleteIds([actionSheetId]);
					setActionSheetId(null);
				},
				onSelect: () => {
					setSelectMode(true);
					setSelectedIds([actionSheetId]);
					setActionSheetId(null);
				},
				onClose: () => setActionSheetId(null)
			}),
			lightbox && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-[80] flex flex-col bg-black/95",
				onClick: () => setLightbox(null),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-end p-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setLightbox(null),
						"aria-label": "Close",
						className: "grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
							className: "h-5 w-5",
							strokeWidth: 1.8
						})
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-1 items-center justify-center p-2",
					onClick: (e) => e.stopPropagation(),
					children: lightbox.video ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						src: lightbox.url,
						controls: true,
						autoPlay: true,
						playsInline: true,
						className: "max-h-full max-w-full object-contain"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: lightbox.url,
						alt: "Shared media",
						className: "max-h-full max-w-full object-contain"
					})
				})]
			})
		]
	});
}
function ActionPopover({ rect, me, onDelete, onSelect, onClose }) {
	const vw = typeof window !== "undefined" ? window.innerWidth : 360;
	const vh = typeof window !== "undefined" ? window.innerHeight : 640;
	const menuW = 188;
	const showAbove = rect.top > 200;
	const left = Math.min(Math.max(me ? rect.right - menuW : rect.left, 8), vw - menuW - 8);
	const vert = showAbove ? { bottom: vh - rect.top + 8 } : { top: rect.bottom + 8 };
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[90] bg-black/40 backdrop-blur-[2px]",
		onClick: onClose
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed z-[100] overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-2xl",
		style: {
			left,
			width: menuW,
			...vert
		},
		onClick: (e) => e.stopPropagation(),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: onDelete,
				className: "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
					className: "h-4 w-4",
					strokeWidth: 1.8
				}), " Delete Message"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: onSelect,
				className: "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-foreground transition-colors hover:bg-secondary",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCheck, {
					className: "h-4 w-4",
					strokeWidth: 1.8
				}), " Select Multiple"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: onClose,
				className: "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
					className: "h-4 w-4",
					strokeWidth: 1.8
				}), " Cancel"]
			})
		]
	})] });
}
function InviteBubble({ invite }) {
	const Icon = inviteById(invite.kind).icon;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-64 max-w-full space-y-1 p-3.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] opacity-80",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
						className: "h-3.5 w-3.5",
						strokeWidth: 1.9
					}),
					" ",
					invite.title
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pt-1 text-sm font-semibold",
				children: invite.place
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-start gap-1.5 text-xs opacity-85",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
					className: "mt-0.5 h-3 w-3 shrink-0",
					strokeWidth: 1.8
				}), invite.address]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-center gap-2 text-[11px] opacity-80",
				children: [typeof invite.rating === "number" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
							className: "h-3 w-3",
							strokeWidth: 1.8
						}),
						" ",
						invite.rating.toFixed(1)
					]
				}), typeof invite.open === "boolean" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: invite.open ? "Open now" : "Closed now" })]
			}),
			invite.mapsUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: invite.mapsUrl,
				target: "_blank",
				rel: "noopener noreferrer",
				className: "mt-2 block rounded-full bg-background/20 py-2 text-center text-[11px] font-semibold underline-offset-2",
				children: "Open in Maps"
			})
		]
	});
}
function OrbitViewOnce({ src, seconds, sentByMe, onConsumed }) {
	const [state, setState] = (0, import_react.useState)("sealed");
	if (state === "gone") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "px-3.5 py-2 text-xs italic opacity-80",
		children: "Photo expired"
	});
	if (state === "sealed") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => {
			if (sentByMe) {
				toast.info("View-once photo sent");
				return;
			}
			setState("open");
			window.setTimeout(() => {
				onConsumed().then((consumed) => {
					if (consumed) setState("gone");
					else {
						setState("sealed");
						toast.error("This photo could not be consumed. Please try again.");
					}
				});
			}, seconds * 1e3);
		},
		className: "flex h-40 w-full flex-col items-center justify-center gap-2 bg-foreground/10 text-xs font-semibold",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, {
				className: "h-5 w-5",
				strokeWidth: 1.7
			}),
			"Tap to view once · ",
			seconds,
			"s"
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src,
		alt: "View once photo",
		className: "h-40 w-full object-cover"
	});
}
//#endregion
export { OrbitChatPage as component };
