import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-D6FET1DN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as useRouter, m as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $t as EllipsisVertical, C as Trash2, Fn as ArrowLeft, It as Image$1, Kt as Flag, N as Smile, Ot as Lock, Tn as Camera, U as Send, Xt as EyeOff, a as X, at as Phone, b as Type, bn as Check, cn as Clock, ct as Pause, d as VideoOff, h as UserX, j as Sparkles, kn as BellOff, rn as Crop, st as Pencil, tt as Play, u as Video, vt as Mic, xn as CheckCheck } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as reportSocialUser, E as setUserBlock, J as needsProtectionWarning, M as useThreadPeer, _t as STORAGE_BUCKETS, j as useThreadMessages, l as useCall, mt as cn, r as Route$1, v as dmThreadId, vt as uploadSourceWithProgress, yt as uploadWithProgress } from "./router-DICQhfH7.mjs";
import { r as useMyProfile } from "./profile-data-c5wOg2Ub.mjs";
import { t as UserWatermark } from "./UserWatermark-Cj3id9i0.mjs";
import { t as compressImageFile } from "./image-compress-CFm7ihuA.mjs";
import { n as useCaptureDetect, t as PinDialog } from "./PinDialog-CnToBp8K.mjs";
import { r as useChatNames, t as saveChatDisplayName } from "./chat-names-Dnk0YJkG.mjs";
import { n as randomPinSalt, r as saveSecretChatLock, t as hashPin } from "./secret-chats-C2KcRray.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chat._threadId-DLGATsWO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PHOTO_FILTERS = [
	{
		id: "normal",
		name: "Original",
		class: "",
		css: "none"
	},
	{
		id: "soft-glow",
		name: "Soft Glow",
		class: "brightness-110 contrast-95 saturate-110 sepia-[0.15]",
		css: "brightness(1.1) contrast(0.95) saturate(1.1) sepia(0.15)"
	},
	{
		id: "vivid",
		name: "Vivid Pop",
		class: "saturate-150 contrast-105",
		css: "saturate(1.5) contrast(1.05)"
	},
	{
		id: "warm",
		name: "Warm Sun",
		class: "sepia-[0.25] saturate-125 brightness-105",
		css: "sepia(0.25) saturate(1.25) brightness(1.05)"
	},
	{
		id: "cool",
		name: "Cool Aesthetic",
		class: "hue-rotate-15 saturate-110",
		css: "hue-rotate(15deg) saturate(1.1)"
	},
	{
		id: "vintage",
		name: "Retro Vintage",
		class: "sepia-[0.4] contrast-110 brightness-95",
		css: "sepia(0.4) contrast(1.1) brightness(0.95)"
	},
	{
		id: "mono",
		name: "Noir B&W",
		class: "grayscale contrast-125",
		css: "grayscale(1) contrast(1.25)"
	}
];
var TEXT_COLORS = [
	"#ffffff",
	"#000000",
	"#f43f5e",
	"#f59e0b",
	"#22c55e",
	"#38bdf8",
	"#a855f7"
];
var STICKER_EMOJIS = [
	"Smile",
	"Love",
	"Party",
	"Cool",
	"Joy",
	"Tears",
	"Flame",
	"Heart",
	"Spark",
	"Celebrate",
	"Like",
	"Support",
	"Perfect",
	"Rainbow",
	"Star",
	"Pizza",
	"Coffee",
	"Pup",
	"Bloom",
	"Launch"
];
var loadImage = (src) => new Promise((resolve, reject) => {
	const img = new Image();
	img.crossOrigin = "anonymous";
	img.onload = () => resolve(img);
	img.onerror = reject;
	img.src = src;
});
/** Crops a data URL to the normalized rect (0..1 values). */
async function cropImage(src, rect) {
	const img = await loadImage(src);
	const sx = Math.max(0, Math.round(rect.x * img.naturalWidth));
	const sy = Math.max(0, Math.round(rect.y * img.naturalHeight));
	const sw = Math.max(1, Math.round(rect.w * img.naturalWidth));
	const sh = Math.max(1, Math.round(rect.h * img.naturalHeight));
	const canvas = document.createElement("canvas");
	canvas.width = sw;
	canvas.height = sh;
	const ctx = canvas.getContext("2d");
	if (!ctx) return src;
	ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
	return canvas.toDataURL("image/png");
}
/** Flattens the filter + overlays into a single PNG data URL. */
async function renderPhoto(src, filterCss, overlays) {
	try {
		const img = await loadImage(src);
		const canvas = document.createElement("canvas");
		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight;
		const ctx = canvas.getContext("2d");
		if (!ctx) return src;
		ctx.filter = filterCss || "none";
		ctx.drawImage(img, 0, 0);
		ctx.filter = "none";
		const unit = canvas.height / 100;
		for (const o of overlays) {
			const px = o.x * canvas.width;
			const py = o.y * canvas.height;
			ctx.font = `bold ${Math.round(o.size * unit)}px system-ui, sans-serif`;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			if (o.kind === "text") {
				ctx.lineWidth = Math.max(2, o.size * unit * .08);
				ctx.strokeStyle = "rgba(0,0,0,0.55)";
				ctx.strokeText(o.value, px, py);
				ctx.fillStyle = o.color;
			} else ctx.fillStyle = "#ffffff";
			ctx.fillText(o.value, px, py);
		}
		return canvas.toDataURL("image/png");
	} catch {
		return src;
	}
}
/** Image with native lazy-loading + a skeleton placeholder to avoid layout shift. */
var LazyImage = (0, import_react.memo)(function LazyImage({ className, wrapperClassName, onLoad, ...props }) {
	const [loaded, setLoaded] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn("relative block overflow-hidden", wrapperClassName),
		children: [!loaded && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			"aria-hidden": true,
			className: "absolute inset-0 animate-pulse bg-muted/40"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			...props,
			loading: props.loading ?? "lazy",
			decoding: props.decoding ?? "async",
			onLoad: (e) => {
				setLoaded(true);
				onLoad?.(e);
			},
			className: cn("transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0", className)
		})]
	});
});
/**
* Live presence for a chat thread: who else is in the room and whether the
* peer is currently typing. Uses a Supabase Realtime presence channel.
*/
function useThreadPresence(threadId, me) {
	const [peerOnline, setPeerOnline] = (0, import_react.useState)(false);
	const [peerTyping, setPeerTyping] = (0, import_react.useState)(false);
	const channelRef = (0, import_react.useRef)(null);
	const typingUntil = (0, import_react.useRef)(0);
	const tick = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!me || !threadId) return;
		const channel = supabase.channel(`presence-thread-${threadId}`, { config: { presence: { key: me } } });
		channelRef.current = channel;
		const sync = () => {
			const state = channel.presenceState();
			const others = Object.entries(state).filter(([key]) => key !== me).flatMap(([, metas]) => metas);
			setPeerOnline(others.length > 0);
			setPeerTyping(others.some((m) => (m.typing_until ?? 0) > Date.now()));
		};
		channel.on("presence", { event: "sync" }, sync).on("presence", { event: "join" }, sync).on("presence", { event: "leave" }, sync).subscribe((status) => {
			if (status === "SUBSCRIBED") channel.track({
				user_id: me,
				typing_until: 0,
				online_at: (/* @__PURE__ */ new Date()).toISOString()
			});
		});
		tick.current = setInterval(sync, 1e3);
		return () => {
			if (tick.current) clearInterval(tick.current);
			channelRef.current = null;
			supabase.removeChannel(channel);
		};
	}, [threadId, me]);
	/** Call on every keystroke — throttled to one track() per second. */
	const setTyping = (0, import_react.useCallback)((typing) => {
		const channel = channelRef.current;
		if (!channel || !me) return;
		const now = Date.now();
		if (typing && now < typingUntil.current - 2e3) return;
		typingUntil.current = typing ? now + 3e3 : 0;
		channel.track({
			user_id: me,
			typing_until: typingUntil.current,
			online_at: (/* @__PURE__ */ new Date()).toISOString()
		});
	}, [me]);
	return (0, import_react.useMemo)(() => ({
		peerOnline,
		peerTyping,
		setTyping
	}), [
		peerOnline,
		peerTyping,
		setTyping
	]);
}
var DEFAULTS = {
	displayName: null,
	secretLock: false,
	secretPinSalt: null,
	secretPinHash: null,
	viewOnce: false,
	autoDelete: 0,
	screenshotAlert: true,
	recordingAlert: true,
	muted: false,
	blocked: false
};
function useChatSettings(peerId) {
	const [settings, setSettings] = (0, import_react.useState)(DEFAULTS);
	const [ready, setReady] = (0, import_react.useState)(false);
	const meRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		let alive = true;
		setReady(false);
		if (!peerId) return;
		(async () => {
			const { data: auth } = await supabase.auth.getUser();
			const me = auth.user?.id ?? null;
			meRef.current = me;
			if (!me || !alive) return;
			const { data } = await supabase.from("orbit_chat_settings").select("display_name,secret_lock_enabled,secret_pin_salt,secret_pin_hash,view_once_mode,auto_delete_seconds,screenshot_alert,recording_alert,muted,blocked").eq("user_id", me).eq("peer_id", peerId).maybeSingle();
			if (!alive) return;
			const row = data;
			if (row) setSettings({
				displayName: row.display_name,
				secretLock: row.secret_lock_enabled,
				secretPinSalt: row.secret_pin_salt,
				secretPinHash: row.secret_pin_hash,
				viewOnce: row.view_once_mode,
				autoDelete: row.auto_delete_seconds ?? 0,
				screenshotAlert: row.screenshot_alert,
				recordingAlert: row.recording_alert,
				muted: row.muted,
				blocked: !!row.blocked
			});
			setReady(true);
		})();
		return () => {
			alive = false;
		};
	}, [peerId]);
	return {
		settings,
		ready,
		patch: (0, import_react.useCallback)((next) => {
			setSettings((prev) => {
				const merged = {
					...prev,
					...next
				};
				const me = meRef.current;
				if (me && peerId) supabase.from("orbit_chat_settings").upsert({
					user_id: me,
					peer_id: peerId,
					display_name: merged.displayName,
					secret_lock_enabled: merged.secretLock,
					secret_pin_salt: merged.secretPinSalt,
					secret_pin_hash: merged.secretPinHash,
					view_once_mode: merged.viewOnce,
					auto_delete_seconds: merged.autoDelete,
					screenshot_alert: merged.screenshotAlert,
					recording_alert: merged.recordingAlert,
					muted: merged.muted,
					blocked: merged.blocked
				}, { onConflict: "user_id,peer_id" });
				return merged;
			});
		}, [peerId])
	};
}
var CALL_LOG_PATTERN = /^(Missed (Audio|Video) Call|(Audio|Video) Call ended • \d{2}:\d{2})$/;
function MenuItem({ icon, label, onClick, state, danger }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: `w-full text-left px-3 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-3 ${danger ? "text-red-400 hover:bg-red-950/40" : "text-zinc-200 hover:bg-zinc-800/80"}`,
		children: [
			icon,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex-1",
				children: label
			}),
			state !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: `h-4 w-7 rounded-full transition-colors ${state ? "bg-purple-600" : "bg-zinc-700"} relative`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${state ? "left-3.5" : "left-0.5"}` })
			})
		]
	});
}
function ChatThreadPage() {
	const { profile: myProfile } = useMyProfile();
	const currentUserName = myProfile.display_name || myProfile.username || "YourWorld user";
	const currentUsername = myProfile.username || "user";
	const navigate = useNavigate();
	const router = useRouter();
	const [selectedImage, setSelectedImage] = (0, import_react.useState)(null);
	const [protectionWarning, setProtectionWarning] = (0, import_react.useState)(null);
	const [caption, setCaption] = (0, import_react.useState)("");
	const [isHD, setIsHD] = (0, import_react.useState)(true);
	const [selectedFilter, setSelectedFilter] = (0, import_react.useState)("normal");
	const [showFilters, setShowFilters] = (0, import_react.useState)(false);
	const filters = PHOTO_FILTERS;
	const [overlays, setOverlays] = (0, import_react.useState)([]);
	const [activeTool, setActiveTool] = (0, import_react.useState)(null);
	const [textColor, setTextColor] = (0, import_react.useState)(TEXT_COLORS[0]);
	const [textDraft, setTextDraft] = (0, import_react.useState)("");
	const [cropRect, setCropRect] = (0, import_react.useState)(null);
	const cropStart = (0, import_react.useRef)(null);
	const dragId = (0, import_react.useRef)(null);
	const imageBoxRef = (0, import_react.useRef)(null);
	const [openedOnce, setOpenedOnce] = (0, import_react.useState)([]);
	const [viewOnceOpen, setViewOnceOpen] = (0, import_react.useState)(null);
	const handleClosePreview = () => {
		if (selectedImage?.startsWith("blob:")) URL.revokeObjectURL(selectedImage);
		setSelectedImage(null);
		setCaption("");
		setSelectedFilter("normal");
		setShowFilters(false);
		setOverlays([]);
		setActiveTool(null);
		setCropRect(null);
		setTextDraft("");
	};
	const { threadId } = Route$1.useParams();
	(0, import_react.useEffect)(() => {
		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(threadId)) return;
		let alive = true;
		supabase.auth.getSession().then(({ data }) => {
			const uid = data.session?.user.id;
			if (!alive || !uid || uid === threadId) return;
			navigate({
				to: "/chat/$threadId",
				params: { threadId: dmThreadId(uid, threadId) },
				replace: true
			});
		});
		return () => {
			alive = false;
		};
	}, [threadId, navigate]);
	const { startCall } = useCall();
	const { messages: dbMessages, currentUserId, send: sendToDb, remove: removeFromDb, markRead, error: messagesError, loading: messagesLoading, loadingMore, hasMore, loadOlder } = useThreadMessages(threadId, { staleTime: Infinity });
	const messagesEndRef = (0, import_react.useRef)(null);
	const scrollRef = (0, import_react.useRef)(null);
	const keepScrollRef = (0, import_react.useRef)(null);
	const fileInputRef = (0, import_react.useRef)(null);
	const cameraInputRef = (0, import_react.useRef)(null);
	const mediaRecorderRef = (0, import_react.useRef)(null);
	const [message, setMessage] = (0, import_react.useState)("");
	const [localMessages, setLocalMessages] = (0, import_react.useState)([]);
	const [hiddenIds, setHiddenIds] = (0, import_react.useState)([]);
	const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit"
	});
	const messages = (0, import_react.useMemo)(() => {
		return [...dbMessages.map((m) => ({
			id: m.id,
			text: m.content || void 0,
			image: m.media_url ?? void 0,
			audio: m.voice_note_url ?? void 0,
			sender: m.sender_id === currentUserId ? "me" : "them",
			system: CALL_LOG_PATTERN.test(m.content),
			time: fmtTime(m.created_at),
			ts: new Date(m.created_at).getTime(),
			read: m.is_read,
			viewOnce: false,
			opened: false
		})), ...localMessages].filter((m) => !hiddenIds.includes(m.id)).sort((a, b) => a.ts - b.ts);
	}, [
		dbMessages,
		localMessages,
		hiddenIds,
		currentUserId
	]);
	(0, import_react.useEffect)(() => {
		if (!currentUserId) return;
		const unread = dbMessages.filter((m) => m.sender_id !== currentUserId && !m.is_read).map((m) => m.id);
		if (unread.length) markRead(unread);
	}, [
		dbMessages,
		currentUserId,
		markRead
	]);
	const [showEmojis, setShowEmojis] = (0, import_react.useState)(false);
	const [showOptionsMenu, setShowOptionsMenu] = (0, import_react.useState)(false);
	const [isRecording, setIsRecording] = (0, import_react.useState)(false);
	const [recordingTime, setRecordingTime] = (0, import_react.useState)(0);
	const [playingAudioId, setPlayingAudioId] = (0, import_react.useState)(null);
	const [selectMode, setSelectMode] = (0, import_react.useState)(false);
	const [selectedIds, setSelectedIds] = (0, import_react.useState)([]);
	const [actionSheetId, setActionSheetId] = (0, import_react.useState)(null);
	const longPressRef = (0, import_react.useRef)(null);
	const peer = useThreadPeer(threadId, currentUserId);
	const { peerOnline, peerTyping, setTyping } = useThreadPresence(threadId, currentUserId);
	const { settings, patch } = useChatSettings(peer.peerId);
	const { nameFor } = useChatNames();
	const displayName = nameFor(peer.peerId, settings.displayName ?? peer.peerName ?? "");
	const openPeerProfile = {
		preload: () => {
			if (!peer.peerId) return;
			router.preloadRoute({
				to: "/u/$userId",
				params: { userId: peer.peerId }
			}).catch(() => {});
		},
		go: () => {
			if (!peer.peerId) return;
			navigate({
				to: "/u/$userId",
				params: { userId: peer.peerId }
			});
		}
	};
	const [nameDialogOpen, setNameDialogOpen] = (0, import_react.useState)(false);
	const [nameDraft, setNameDraft] = (0, import_react.useState)("");
	const setDisplayName = (n) => {
		patch({ displayName: n });
		saveChatDisplayName(peer.peerId ?? "", n);
	};
	const secretLock = settings.secretLock;
	const [chatUnlocked, setChatUnlocked] = (0, import_react.useState)(false);
	const [unlockPin, setUnlockPin] = (0, import_react.useState)("");
	const [unlockError, setUnlockError] = (0, import_react.useState)(null);
	const [pinMode, setPinMode] = (0, import_react.useState)(null);
	const [pinError, setPinError] = (0, import_react.useState)(null);
	const toggleSecretLock = () => {
		if (!peer.peerId) {
			pushSystem("Chat is still loading");
			return;
		}
		setPinError(null);
		setPinMode(secretLock ? "remove" : "set");
	};
	const submitPin = async (pin) => {
		const peerId = peer.peerId;
		if (!peerId) return;
		try {
			if (pinMode === "remove") {
				const salt = settings.secretPinSalt;
				const hash = settings.secretPinHash;
				if (!pin || !salt || !hash || await hashPin(salt, pin) !== hash) {
					setPinError("Incorrect PIN");
					return;
				}
				await saveSecretChatLock(peerId, false, null, null);
				patch({
					secretLock: false,
					secretPinSalt: null,
					secretPinHash: null
				});
				setChatUnlocked(true);
				setPinMode(null);
				pushSystem("Secret lock disabled");
				return;
			}
			if (!/^\d{4,8}$/.test(pin)) {
				setPinError("Use a 4-8 digit PIN");
				return;
			}
			const salt = randomPinSalt();
			const hash = await hashPin(salt, pin);
			await saveSecretChatLock(peerId, true, salt, hash);
			patch({
				secretLock: true,
				secretPinSalt: salt,
				secretPinHash: hash
			});
			setChatUnlocked(true);
			setPinMode(null);
			pushSystem("Secret lock enabled");
		} catch (err) {
			console.error("[secret-lock] save failed", err);
			setPinError("Couldn't save. Check your connection and try again.");
		}
	};
	const autoDelete = settings.autoDelete;
	const screenshotAlert = settings.screenshotAlert;
	const recordingAlert = settings.recordingAlert;
	const muted = settings.muted;
	const blocked = settings.blocked;
	const [reported, setReported] = (0, import_react.useState)(false);
	const pushSystem = async (text) => {
		if (currentUserId) {
			const sent = await sendToDb({ content: text });
			if (sent.error) toast.error(sent.error);
			return;
		}
		toast.error("Sign in to send messages.");
	};
	const startLongPress = (id) => {
		if (longPressRef.current) clearTimeout(longPressRef.current);
		longPressRef.current = setTimeout(() => setActionSheetId(id), 450);
	};
	const cancelLongPress = () => {
		if (longPressRef.current) clearTimeout(longPressRef.current);
		longPressRef.current = null;
	};
	const toggleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
	const deleteIds = (ids) => {
		setLocalMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
		setHiddenIds((prev) => [...prev, ...ids]);
		removeFromDb(ids.filter((id) => !id.startsWith("local-")));
		setSelectedIds([]);
	};
	const exitSelectMode = () => {
		setSelectMode(false);
		setSelectedIds([]);
	};
	(0, import_react.useEffect)(() => () => cancelLongPress(), []);
	const EMOJIS = [
		"Like",
		"Heart",
		"Laugh",
		"Flame",
		"Celebrate",
		"Love",
		"Applause",
		"Support",
		"Launch",
		"Perfect"
	];
	const didFirstScroll = (0, import_react.useRef)(false);
	const scrollToLatest = () => {
		requestAnimationFrame(() => {
			messagesEndRef.current?.scrollIntoView({
				behavior: didFirstScroll.current ? "smooth" : "auto",
				block: "end"
			});
			didFirstScroll.current = true;
		});
	};
	(0, import_react.useEffect)(() => {
		if (keepScrollRef.current !== null && scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight - keepScrollRef.current;
			keepScrollRef.current = null;
			return;
		}
		scrollToLatest();
	}, [messages, isRecording]);
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
	const onScrollMessages = () => {
		const el = scrollRef.current;
		if (!el || el.scrollTop > 80 || loadingMore || !hasMore) return;
		keepScrollRef.current = el.scrollHeight;
		loadOlder();
	};
	useCaptureDetect(true, (kind) => {
		if (kind === "recording" ? !recordingAlert : !screenshotAlert) return;
		pushSystem(`${currentUserName} took a ${kind === "recording" ? "recording" : "screenshot"}`);
	});
	(0, import_react.useEffect)(() => {
		if (!autoDelete) return;
		const t = setInterval(() => {
			const cutoff = Date.now() - autoDelete * 1e3;
			setLocalMessages((prev) => prev.filter((m) => m.ts >= cutoff));
		}, 1e3);
		return () => clearInterval(t);
	}, [autoDelete]);
	(0, import_react.useEffect)(() => {
		let timer;
		if (isRecording) timer = setInterval(() => setRecordingTime((prev) => prev + 1), 1e3);
		else setRecordingTime(0);
		return () => {
			if (timer) clearInterval(timer);
		};
	}, [isRecording]);
	const doSend = (currentMsg) => {
		if (currentUserId) sendToDb({ content: currentMsg }).then((sent) => {
			if (sent.error) toast.error(sent.error);
		});
		else toast.error("Sign in to send messages.");
		setMessage("");
		setShowEmojis(false);
	};
	const handleSend = () => {
		if (!message.trim() || blocked) return;
		if (needsProtectionWarning(message)) {
			setProtectionWarning(message);
			return;
		}
		doSend(message);
	};
	const handleImageSelect = async (e) => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;
		const compressed = await compressImageFile(file, {
			maxDim: 1600,
			quality: .82
		});
		setCaption("");
		setSelectedFilter("normal");
		setShowFilters(false);
		setSelectedImage(compressed);
	};
	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const recorder = new MediaRecorder(stream);
			mediaRecorderRef.current = recorder;
			const chunks = [];
			recorder.ondataavailable = (e) => chunks.push(e.data);
			recorder.onstop = () => {
				const blob = new Blob(chunks, { type: "audio/webm" });
				(async () => {
					if (!currentUserId) return;
					const path = `${currentUserId}/${threadId}/voice-${Date.now()}.webm`;
					const uploaded = await uploadWithProgress(STORAGE_BUCKETS.voiceNotes, path, blob, "audio/webm");
					if (uploaded.error || !uploaded.url) {
						toast.error(uploaded.error ?? "Voice note upload failed");
						return;
					}
					const sent = await sendToDb({ voice_note_url: uploaded.url });
					if (sent.error) toast.error(sent.error);
				})();
				stream.getTracks().forEach((t) => t.stop());
			};
			recorder.start();
			setIsRecording(true);
		} catch (err) {
			console.error("Microphone error", err);
		}
	};
	const stopRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop();
			setIsRecording(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "fixed inset-0 z-50 flex h-[100dvh] flex-col justify-between overflow-hidden bg-black font-sans text-white",
			children: [
				secretLock && !chatUnlocked && settings.secretPinHash ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 z-[95] grid place-items-center bg-black px-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "w-full max-w-xs space-y-4 text-center",
						onSubmit: (e) => {
							e.preventDefault();
							(async () => {
								const salt = settings.secretPinSalt;
								const hash = settings.secretPinHash;
								if (!salt || !hash || await hashPin(salt, unlockPin) !== hash) {
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
								size: 28,
								className: "mx-auto text-purple-400"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-lg font-bold",
								children: "Secret chat locked"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-zinc-400",
								children: "Enter your PIN to open this conversation."
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: unlockPin,
								onChange: (e) => {
									setUnlockPin(e.target.value.replace(/\D/g, "").slice(0, 8));
									setUnlockError(null);
								},
								inputMode: "numeric",
								type: "password",
								autoFocus: true,
								"aria-label": "Secret chat PIN",
								className: "h-12 w-full rounded-xl bg-zinc-900 px-4 text-center text-lg outline-none"
							}),
							unlockError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium text-red-400",
								children: unlockError
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								className: "h-11 w-full rounded-xl bg-purple-600 text-sm font-bold",
								children: "Unlock"
							})
						]
					})
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "file",
					ref: fileInputRef,
					accept: "image/*",
					className: "hidden",
					onChange: handleImageSelect
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "file",
					ref: cameraInputRef,
					accept: "image/*",
					capture: "environment",
					className: "hidden",
					onChange: handleImageSelect
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sticky top-0 z-50 flex shrink-0 items-center justify-between border-b border-zinc-800/80 bg-zinc-950 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => navigate({ to: ".." }),
									className: "p-1 text-zinc-300 hover:text-white",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 22 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative cursor-pointer",
									onPointerDown: openPeerProfile.preload,
									onClick: openPeerProfile.go,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md",
										children: (displayName || "U").charAt(0).toUpperCase()
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `absolute bottom-0 right-0 w-3 h-3 border-2 border-black rounded-full ${peerOnline ? "bg-emerald-500" : "bg-zinc-600"}` })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-bold text-sm leading-tight text-white flex items-center gap-1 cursor-pointer",
										onPointerDown: openPeerProfile.preload,
										onClick: openPeerProfile.go,
										children: [
											displayName,
											secretLock && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
												size: 12,
												className: "text-purple-400"
											}),
											muted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellOff, {
												size: 12,
												className: "text-zinc-500"
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] font-medium",
										children: blocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-red-400",
											children: "Blocked"
										}) : peerTyping ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-purple-400",
											children: "typing..."
										}) : peerOnline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-emerald-400",
											children: "Online"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-zinc-500",
											children: "Offline"
										})
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4 text-zinc-300",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => void startCall({
										threadId,
										peerId: peer.peerId ?? void 0,
										peerName: displayName,
										mode: "audio"
									}),
									"aria-label": "Voice call",
									className: "hover:text-white",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { size: 20 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => void startCall({
										threadId,
										peerId: peer.peerId ?? void 0,
										peerName: displayName,
										mode: "video"
									}),
									"aria-label": "Video call",
									className: "hover:text-white",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, { size: 20 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setShowOptionsMenu(!showOptionsMenu),
									className: "hover:text-white",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EllipsisVertical, { size: 20 })
								})
							]
						}),
						showOptionsMenu && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "fixed inset-0 z-[75]",
							onClick: () => setShowOptionsMenu(false)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "absolute right-4 top-14 w-64 bg-zinc-900/95 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-[80] backdrop-blur-md animate-in fade-in zoom-in-95 duration-150",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, {
										size: 16,
										className: "text-zinc-400"
									}),
									label: "Change Display Name",
									onClick: () => {
										setNameDraft(displayName);
										setNameDialogOpen(true);
										setShowOptionsMenu(false);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
										size: 16,
										className: "text-zinc-400"
									}),
									label: "Secret Lock Chat",
									state: secretLock,
									onClick: () => {
										toggleSecretLock();
										setShowOptionsMenu(false);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
										size: 16,
										className: "text-zinc-400"
									}),
									label: autoDelete ? `Auto Delete: ${autoDelete}s` : "Auto Delete Messages",
									state: autoDelete > 0,
									onClick: () => {
										const next = autoDelete === 0 ? 60 : autoDelete === 60 ? 300 : autoDelete === 300 ? 3600 : 0;
										patch({ autoDelete: next });
										pushSystem(next ? `Messages will auto delete after ${next}s` : "Auto delete turned off");
										setShowOptionsMenu(false);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {
										size: 16,
										className: "text-zinc-400"
									}),
									label: "Screenshot Alert",
									state: screenshotAlert,
									onClick: () => {
										patch({ screenshotAlert: !screenshotAlert });
										pushSystem(`Screenshot alerts ${!screenshotAlert ? "on" : "off"}`);
										setShowOptionsMenu(false);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoOff, {
										size: 16,
										className: "text-zinc-400"
									}),
									label: "Screen Recording Alert",
									state: recordingAlert,
									onClick: () => {
										patch({ recordingAlert: !recordingAlert });
										pushSystem(`Recording alerts ${!recordingAlert ? "on" : "off"}`);
										setShowOptionsMenu(false);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellOff, {
										size: 16,
										className: "text-zinc-400"
									}),
									label: "Mute Notifications",
									state: muted,
									onClick: () => {
										patch({ muted: !muted });
										pushSystem(`Notifications ${!muted ? "muted" : "unmuted"}`);
										setShowOptionsMenu(false);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
										size: 16,
										className: "text-zinc-400"
									}),
									label: "Clear Chat",
									onClick: () => {
										deleteIds(messages.map((m) => m.id));
										exitSelectMode();
										setShowOptionsMenu(false);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									danger: true,
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserX, {
										size: 16,
										className: "text-red-400"
									}),
									label: blocked ? "Unblock User" : "Block User",
									state: blocked,
									onClick: () => {
										(async () => {
											if (!currentUserId || !peer.peerId) return;
											const error = await setUserBlock(currentUserId, peer.peerId, !blocked);
											if (error) {
												toast.error(error);
												return;
											}
											patch({ blocked: !blocked });
											await pushSystem(`${displayName} ${!blocked ? "blocked" : "unblocked"}`);
										})();
										setShowOptionsMenu(false);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									danger: true,
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, {
										size: 16,
										className: "text-red-400"
									}),
									label: reported ? "Reported" : "Report User",
									state: reported,
									onClick: () => {
										if (!reported) (async () => {
											if (!currentUserId || !peer.peerId) return;
											const error = await reportSocialUser(currentUserId, peer.peerId, threadId);
											if (error) {
												toast.error(error);
												return;
											}
											setReported(true);
											await pushSystem(`${displayName} reported. Our team will review.`);
										})();
										setShowOptionsMenu(false);
									}
								})
							]
						})] })
					]
				}),
				protectionWarning !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "fixed inset-0 z-[140] grid place-items-center bg-black/70 px-6",
					onClick: () => setProtectionWarning(null),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						onClick: (e) => e.stopPropagation(),
						className: "w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-bold text-white",
								children: "Platform Protection Warning"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs leading-relaxed text-zinc-400",
								children: "For escrow protection, secure payouts, and valid tax invoices, please use official In-App Sponsorship deals. Direct off-platform payments are not protected."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 flex flex-col gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => {
										setProtectionWarning(null);
										navigate({ to: "/wallet" });
									},
									className: "w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground",
									children: "Create Official Sponsorship Deal"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => {
										const text = protectionWarning;
										setProtectionWarning(null);
										doSend(text);
									},
									className: "w-full rounded-xl border border-zinc-700 px-4 py-2.5 text-xs font-semibold text-zinc-300",
									children: "Proceed Anyway"
								})]
							})
						]
					})
				}),
				selectMode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: exitSelectMode,
							className: "text-xs font-semibold text-zinc-300",
							children: "Cancel"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs font-bold text-white",
							children: [selectedIds.length, " selected"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => {
								deleteIds(selectedIds);
								setSelectMode(false);
							},
							disabled: selectedIds.length === 0,
							className: `text-xs font-bold flex items-center gap-1 ${selectedIds.length ? "text-red-400" : "text-zinc-600"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 15 }), " Delete"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					ref: scrollRef,
					onScroll: onScrollMessages,
					className: "relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] p-4 space-y-3.5 bg-zinc-950/50",
					onClick: () => setShowOptionsMenu(false),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserWatermark, {
							username: currentUsername,
							className: "fixed text-white"
						}),
						messagesError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							role: "alert",
							className: "rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-center text-xs text-red-300",
							children: messagesError
						}) : null,
						loadingMore ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "py-1 text-center text-[11px] text-zinc-500",
							children: "Loading older messages…"
						}) : null,
						messagesLoading && messages.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-3.5",
							"aria-hidden": true,
							children: [
								0,
								1,
								2,
								3,
								4,
								5
							].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `flex ${i % 2 ? "justify-end" : "justify-start"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-10 animate-pulse rounded-2xl bg-gradient-to-r from-zinc-800/70 via-zinc-700/60 to-zinc-800/70 bg-[length:200%_100%]",
									style: { width: `${45 + i * 37 % 30}%` }
								})
							}, i))
						}),
						messages.map((m) => m.system ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mx-auto flex w-fit items-center gap-2 rounded-full bg-zinc-800/70 px-3 py-1 text-center text-[11px] text-zinc-400",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: m.text }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
								dateTime: new Date(m.ts).toISOString(),
								className: "text-[10px] text-zinc-500",
								children: m.time
							})]
						}, m.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							onPointerDown: () => !selectMode && startLongPress(m.id),
							onPointerUp: cancelLongPress,
							onPointerLeave: cancelLongPress,
							onContextMenu: (e) => {
								e.preventDefault();
								if (!selectMode) setActionSheetId(m.id);
							},
							onClick: () => selectMode && toggleSelect(m.id),
							className: `flex flex-col ${m.sender === "me" ? "items-end" : "items-start"} ${selectMode && selectedIds.includes(m.id) ? "rounded-2xl bg-purple-500/10 ring-1 ring-purple-500/40" : ""} ${selectMode ? "cursor-pointer select-none px-1 py-1" : ""}`,
							children: [
								selectMode && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `mb-1 flex h-4 w-4 items-center justify-center rounded-full border ${selectedIds.includes(m.id) ? "border-purple-500 bg-purple-600 text-white" : "border-zinc-600"}`,
									children: selectedIds.includes(m.id) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 11 })
								}),
								m.text && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.sender === "me" ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-xs" : "bg-zinc-800/90 text-zinc-100 rounded-bl-xs border border-zinc-700/50"}`,
									children: m.text
								}),
								m.image && m.viewOnce && m.sender === "them" && !m.opened && !openedOnce.includes(m.id) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => {
										setViewOnceOpen({
											id: m.id,
											url: m.image
										});
									},
									className: "max-w-[75%] flex items-center gap-2 rounded-2xl border border-emerald-600/60 bg-emerald-950/30 px-4 py-3 text-xs font-bold text-emerald-400",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "w-5 h-5 rounded-full border border-emerald-500 flex items-center justify-center",
										children: "1"
									}), "Tap to view once"]
								}) : m.image && !(m.viewOnce && (m.opened || openedOnce.includes(m.id))) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "max-w-[75%] rounded-2xl overflow-hidden border border-zinc-800 shadow-lg",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyImage, {
										src: m.image,
										alt: "Attachment",
										wrapperClassName: "w-full",
										className: "w-full h-auto object-cover max-h-60"
									})
								}) : null,
								m.viewOnce && m.sender === "them" && (m.opened || openedOnce.includes(m.id)) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "max-w-[75%] flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-800/70 px-4 py-3 text-xs font-semibold text-zinc-400",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { size: 15 }), " Opened"]
								}),
								m.audio && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `flex items-center gap-3 px-4 py-3 rounded-2xl min-w-[200px] ${m.sender === "me" ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : "bg-zinc-800 text-white border border-zinc-700"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => {
											const aud = new Audio(m.audio);
											if (playingAudioId === m.id) setPlayingAudioId(null);
											else {
												setPlayingAudioId(m.id);
												aud.play();
												aud.onended = () => setPlayingAudioId(null);
											}
										},
										className: "p-2 bg-white/20 rounded-full",
										children: playingAudioId === m.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { size: 16 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { size: 16 })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1 flex flex-col gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-full h-1 bg-white/40 rounded-full overflow-hidden",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `h-full bg-white ${playingAudioId === m.id ? "w-2/3 animate-pulse" : "w-0"}` })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] opacity-80",
											children: "Voice Note"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-[10px] text-zinc-500 mt-1 px-1 flex items-center gap-1",
									children: [m.time, m.sender === "me" && (m.local ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
										size: 12,
										className: "text-zinc-500"
									}) : m.read ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCheck, {
										size: 12,
										className: "text-sky-400"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCheck, {
										size: 12,
										className: "text-zinc-500"
									}))]
								})
							]
						}, m.id)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: messagesEndRef })
					]
				}),
				actionSheetId !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "fixed inset-0 z-[60] flex items-end bg-black/60 backdrop-blur-sm",
					onClick: () => setActionSheetId(null),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "w-full rounded-t-3xl border-t border-zinc-800 bg-zinc-900 p-3 pb-6",
						onClick: (e) => e.stopPropagation(),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => {
									deleteIds([actionSheetId]);
									setActionSheetId(null);
								},
								className: "w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-950/40",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 18 }), " Delete Message"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => {
									setSelectMode(true);
									setSelectedIds([actionSheetId]);
									setActionSheetId(null);
								},
								className: "w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCheck, { size: 18 }), " Select Multiple"]
							})
						]
					})
				}),
				showEmojis && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-2 p-3 bg-zinc-900 border-t border-zinc-800 overflow-x-auto",
					children: EMOJIS.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setMessage((prev) => prev + e),
						className: "text-2xl p-2 hover:bg-zinc-800 rounded-xl",
						children: e
					}, e))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "sticky bottom-0 z-40 flex shrink-0 items-center gap-2 border-t border-zinc-800/80 bg-zinc-950 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3",
					children: blocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex-1 text-center text-xs font-semibold text-zinc-500 py-2",
						children: [
							"You blocked ",
							displayName,
							". Unblock from the menu to message."
						]
					}) : isRecording ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 flex items-center justify-between bg-red-950/40 border border-red-500/50 rounded-full px-4 py-2 text-red-400",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs font-mono font-bold",
								children: [
									"Recording ",
									recordingTime,
									"s"
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: stopRecording,
							className: "p-1.5 bg-red-600 text-white rounded-full text-xs font-bold",
							children: "Send"
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => fileInputRef.current?.click(),
							className: "p-2 text-zinc-400 hover:text-white",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image$1, { size: 22 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: startRecording,
							className: "p-2 text-zinc-400 hover:text-white",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { size: 22 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 relative flex items-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": "Open camera",
									className: "w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white mr-2 shrink-0",
									onClick: () => cameraInputRef.current?.click(),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 18 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									value: message,
									onChange: (e) => {
										setMessage(e.target.value);
										setTyping(e.target.value.trim().length > 0);
									},
									onFocus: scrollToLatest,
									onBlur: () => setTyping(false),
									onKeyDown: (e) => {
										if (e.key === "Enter") {
											setTyping(false);
											handleSend();
										}
									},
									placeholder: "Message...",
									className: "w-full bg-zinc-900 border border-zinc-800 rounded-full py-2.5 pl-4 pr-10 text-sm text-white focus:outline-none"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setShowEmojis(!showEmojis),
									className: "absolute right-3 text-zinc-400 hover:text-white",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smile, { size: 18 })
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: handleSend,
							className: `p-2.5 rounded-full flex items-center justify-center ${message.trim() ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white" : "bg-zinc-800 text-zinc-500 cursor-not-allowed"}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { size: 18 })
						})
					] })
				})
			]
		}),
		viewOnceOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "fixed inset-0 z-[95] bg-black flex flex-col",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between p-4 text-white",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-xs font-bold text-emerald-400 flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { size: 14 }), " View once"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => {
						setViewOnceOpen(null);
					},
					className: "p-2 bg-zinc-800/80 rounded-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 20 })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex-1 flex items-center justify-center p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyImage, {
					src: viewOnceOpen.url,
					alt: "View once",
					loading: "eager",
					onLoad: () => {
						const openedId = viewOnceOpen.id;
						setOpenedOnce((prev) => prev.includes(openedId) ? prev : [...prev, openedId]);
						setOpenedOnce((prev) => prev.includes(openedId) ? prev : [...prev, openedId]);
					},
					wrapperClassName: "max-h-full max-w-full",
					className: "max-h-full max-w-full object-contain rounded-lg"
				})
			})]
		}),
		selectedImage && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "fixed inset-0 bg-black z-50 flex flex-col justify-between p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between text-white pt-2 px-2 z-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: handleClosePreview,
						className: "p-2 bg-zinc-800/80 rounded-full hover:bg-zinc-700",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 20 })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setIsHD(!isHD),
								className: `px-2 py-0.5 text-xs font-bold border rounded transition-all ${isHD ? "border-emerald-500 text-emerald-400 bg-emerald-950/40" : "border-zinc-600 text-zinc-400"}`,
								children: "HD"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setShowFilters(!showFilters),
								className: `p-2 rounded-full transition-all ${showFilters ? "bg-emerald-500 text-black" : "bg-zinc-800/80 text-zinc-200"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 18 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setActiveTool((t) => t === "crop" ? null : "crop");
									setCropRect(null);
								},
								className: `p-2 rounded-full transition-all ${activeTool === "crop" ? "bg-emerald-500 text-black" : "bg-zinc-800/80 text-zinc-300"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crop, { size: 18 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setActiveTool((t) => t === "emoji" ? null : "emoji"),
								className: `p-2 rounded-full transition-all ${activeTool === "emoji" ? "bg-emerald-500 text-black" : "bg-zinc-800/80 text-zinc-300"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smile, { size: 18 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setActiveTool((t) => t === "text" ? null : "text"),
								className: `p-2 rounded-full transition-all ${activeTool === "text" ? "bg-emerald-500 text-black" : "bg-zinc-800/80 text-zinc-300"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Type, { size: 18 })
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					ref: imageBoxRef,
					className: "flex-1 flex items-center justify-center my-2 overflow-hidden relative touch-none",
					onPointerDown: (e) => {
						if (activeTool !== "crop") return;
						const r = imageBoxRef.current.getBoundingClientRect();
						cropStart.current = {
							x: (e.clientX - r.left) / r.width,
							y: (e.clientY - r.top) / r.height
						};
						setCropRect({
							x: cropStart.current.x,
							y: cropStart.current.y,
							w: 0,
							h: 0
						});
					},
					onPointerMove: (e) => {
						const r = imageBoxRef.current.getBoundingClientRect();
						const nx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
						const ny = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
						if (activeTool === "crop" && cropStart.current) {
							const s = cropStart.current;
							setCropRect({
								x: Math.min(s.x, nx),
								y: Math.min(s.y, ny),
								w: Math.abs(nx - s.x),
								h: Math.abs(ny - s.y)
							});
							return;
						}
						if (dragId.current) {
							const id = dragId.current;
							setOverlays((prev) => prev.map((o) => o.id === id ? {
								...o,
								x: nx,
								y: ny
							} : o));
						}
					},
					onPointerUp: () => {
						cropStart.current = null;
						dragId.current = null;
					},
					onPointerLeave: () => {
						cropStart.current = null;
						dragId.current = null;
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: selectedImage,
							alt: "Preview",
							draggable: false,
							className: `max-h-full max-w-full object-contain rounded-lg transition-all duration-300 ${filters.find((f) => f.id === selectedFilter)?.class || ""}`
						}),
						overlays.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onPointerDown: (e) => {
								e.stopPropagation();
								dragId.current = o.id;
							},
							onDoubleClick: () => setOverlays((prev) => prev.filter((x) => x.id !== o.id)),
							style: {
								left: `${o.x * 100}%`,
								top: `${o.y * 100}%`,
								color: o.color,
								fontSize: `${o.size * 4}px`,
								textShadow: o.kind === "text" ? "0 1px 4px rgba(0,0,0,0.7)" : void 0
							},
							className: "absolute -translate-x-1/2 -translate-y-1/2 font-bold leading-none cursor-move select-none touch-none",
							children: o.value
						}, o.id)),
						activeTool === "crop" && cropRect && cropRect.w > .02 && cropRect.h > .02 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute border-2 border-emerald-400 bg-emerald-400/10 pointer-events-none",
							style: {
								left: `${cropRect.x * 100}%`,
								top: `${cropRect.y * 100}%`,
								width: `${cropRect.w * 100}%`,
								height: `${cropRect.h * 100}%`
							}
						})
					]
				}),
				activeTool === "crop" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-center gap-3 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[11px] text-zinc-400",
						children: "Drag on the photo to select an area"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: !cropRect || cropRect.w < .02 || cropRect.h < .02,
						onClick: async () => {
							if (!selectedImage || !cropRect) return;
							const next = await cropImage(selectedImage, cropRect);
							setSelectedImage(next);
							setCropRect(null);
							setActiveTool(null);
						},
						className: "px-4 py-1.5 rounded-full bg-emerald-500 text-black text-xs font-bold disabled:bg-zinc-800 disabled:text-zinc-500",
						children: "Apply crop"
					})]
				}),
				activeTool === "emoji" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-2 overflow-x-auto py-2 px-1 no-scrollbar",
					children: STICKER_EMOJIS.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setOverlays((prev) => [...prev, {
							id: `o-${Date.now()}-${Math.random()}`,
							kind: "emoji",
							value: e,
							x: .5,
							y: .5,
							color: "#fff",
							size: 10
						}]),
						className: "text-2xl p-2 bg-zinc-800 rounded-xl shrink-0",
						children: e
					}, e))
				}),
				activeTool === "text" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2 py-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								value: textDraft,
								onChange: (ev) => setTextDraft(ev.target.value),
								placeholder: "Type text...",
								style: { color: textColor },
								className: "flex-1 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-2 text-sm font-bold focus:outline-none"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									if (!textDraft.trim()) return;
									setOverlays((prev) => [...prev, {
										id: `o-${Date.now()}-${Math.random()}`,
										kind: "text",
										value: textDraft.trim(),
										x: .5,
										y: .4,
										color: textColor,
										size: 8
									}]);
									setTextDraft("");
								},
								className: "px-4 py-2 rounded-full bg-emerald-500 text-black text-xs font-bold",
								children: "Add"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-2 px-1",
							children: TEXT_COLORS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setTextColor(c),
								style: { background: c },
								className: `w-6 h-6 rounded-full border-2 ${textColor === c ? "border-emerald-400 scale-110" : "border-zinc-700"}`
							}, c))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] text-zinc-500 px-1",
							children: "Drag overlays to move, double-tap to remove."
						})
					]
				}),
				showFilters && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-2 overflow-x-auto py-2 px-1 my-1 no-scrollbar justify-start sm:justify-center",
					children: filters.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setSelectedFilter(f.id),
						className: `px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedFilter === f.id ? "bg-emerald-500 text-black font-bold scale-105" : "bg-zinc-800 text-zinc-300 border border-zinc-700"}`,
						children: f.name
					}, f.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 pb-2 z-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center bg-zinc-900 border border-zinc-700/80 rounded-full px-4 py-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image$1, {
							size: 18,
							className: "text-zinc-400"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							placeholder: "Add a caption...",
							value: caption,
							onChange: (e) => setCaption(e.target.value),
							className: "bg-transparent text-white text-sm flex-1 focus:outline-none"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center justify-end px-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: async () => {
								if (!selectedImage) return;
								const filterCss = filters.find((f) => f.id === selectedFilter)?.css ?? "none";
								const finalImage = await renderPhoto(selectedImage, filterCss, overlays);
								if (currentUserId) {
									const extension = finalImage.startsWith("data:image/png") ? "png" : "jpg";
									const uploaded = await uploadSourceWithProgress(STORAGE_BUCKETS.messages, `${currentUserId}/${threadId}/image-${Date.now()}.${extension}`, finalImage, extension === "png" ? "image/png" : "image/jpeg");
									if (uploaded.error || !uploaded.url) {
										toast.error(uploaded.error ?? "Image upload failed");
										return;
									}
									const sent = await sendToDb({
										media_url: uploaded.url,
										content: caption
									});
									if (sent.error) {
										toast.error(sent.error);
										return;
									}
								} else toast.error("Sign in to send messages.");
								handleClosePreview();
							},
							className: "w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
								size: 20,
								className: "ml-0.5"
							})
						})
					})]
				})
			]
		}),
		nameDialogOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-6",
			onClick: () => setNameDialogOpen(false),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-xs rounded-2xl border border-zinc-800 bg-zinc-900 p-4",
				onClick: (e) => e.stopPropagation(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 text-sm font-semibold text-white",
						children: "Change Display Name"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						autoFocus: true,
						value: nameDraft,
						onChange: (e) => setNameDraft(e.target.value),
						placeholder: "Display name",
						className: "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex justify-end gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "rounded-xl px-3 py-2 text-sm text-zinc-400",
							onClick: () => setNameDialogOpen(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white",
							onClick: () => {
								const next = nameDraft.trim();
								if (next) {
									setDisplayName(next);
									pushSystem(`Display name changed to ${next}`);
								}
								setNameDialogOpen(false);
							},
							children: "Save"
						})]
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PinDialog, {
			open: pinMode !== null,
			title: pinMode === "remove" ? "Remove Secret Lock" : "Create chat PIN",
			description: pinMode === "remove" ? "Enter the PIN for this chat to remove the lock." : "Choose a 4-8 digit PIN. You'll need it to open this chat.",
			confirmLabel: pinMode === "remove" ? "Remove" : "Lock chat",
			error: pinError,
			onCancel: () => {
				setPinMode(null);
				setPinError(null);
			},
			onSubmit: (pin) => void submitPin(pin)
		})
	] });
}
//#endregion
export { ChatThreadPage as component };
