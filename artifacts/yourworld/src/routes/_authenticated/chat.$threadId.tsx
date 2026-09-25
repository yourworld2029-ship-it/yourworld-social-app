import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft, Phone, Video, MoreVertical, Image as ImageIcon,
  Mic, Send, Smile, Play, Pause, X,
  Pencil, Lock, EyeOff, Clock, Camera, VideoOff, BellOff, UserX, Flag,
  Trash2, CheckCheck, Check, Crop, Type, Sparkles 
} from "lucide-react";
import {
  PHOTO_FILTERS, TEXT_COLORS, STICKER_EMOJIS, cropImage, renderPhoto,
  type Overlay,
} from "@/components/yw/chat/photo-editor";
import { needsProtectionWarning, PLATFORM_PROTECTION_WARNING_TITLE, PLATFORM_PROTECTION_WARNING_BODY } from "@/lib/chat-compliance";
import { UserWatermark } from "@/components/yw/UserWatermark";
import { LazyImage } from "@/components/yw/LazyImage";
import { compressImageFile } from "@/lib/image-compress";
import { useCaptureDetect } from "@/lib/capture-detect";
import { useMyProfile } from "@/lib/profile-data";
import { useThreadMessages, useThreadPeer, dmThreadId, reportSocialUser } from "@/lib/social-data";
import { supabase } from "@/integrations/supabase/client";
import { useThreadPresence } from "@/lib/presence";
import { useCall } from "@/lib/call-store";
import { useMoments } from "@/lib/moment-context";
import { useChatNames, saveChatDisplayName } from "@/lib/chat-names";
import { useChatSettings } from "@/lib/chat-settings";
import { hashPin, randomPinSalt } from "@/lib/secret-chats";
import { PinDialog } from "@/components/yw/PinDialog";
import { toast } from "sonner";
import { AUTO_DELETE_OPTIONS, autoDeleteLabel } from "@/lib/auto-delete";
import { historyBackOr } from "@/lib/navigation";
import { useAndroidSecureFlag } from "@/lib/native-privacy";
import {
  STORAGE_BUCKETS,
  uploadSourceWithProgress,
  uploadWithProgress,
} from "@/lib/storage-upload";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ChatThreadPage,
});

type Message = {
  id: string;
  text?: string;
  image?: string;
  audio?: string;
  mediaKind?: "image" | "video" | "audio";
  sender: "me" | "them";
  system?: boolean;
  captureEventId?: string;
  time: string;
  ts: number;
  local?: boolean;
  read?: boolean;
  viewOnce?: boolean;
  opened?: boolean;
  momentId?: string;
  momentMediaUrl?: string;
  momentCreatedAt?: string;
  momentKind?: "photo" | "video" | "text";
  deletingAt?: number;
  replyTo?: ReplyPreview;
};

type ReplyPreview = {
  id: string;
  author?: string;
  text?: string;
  mediaKind?: "image" | "video" | "audio";
};

const CALL_LOG_PATTERN = /^(Missed (Audio|Video) Call|(Audio|Video) Call ended • \d{2}:\d{2})$/;

function mediaKindFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
  mediaUrl?: string | null,
  audioUrl?: string | null,
): Message["mediaKind"] {
  if (audioUrl) return "audio";
  const declared = [metadata?.media_type, metadata?.mime_type, metadata?.content_type]
    .find((value): value is string => typeof value === "string")
    ?.toLowerCase();
  if (declared?.startsWith("video")) return "video";
  if (declared?.startsWith("audio")) return "audio";
  if (declared?.startsWith("image")) return "image";
  if (mediaUrl && /\.(mp4|m4v|mov|webm)(?:[?#]|$)/i.test(mediaUrl)) return "video";
  return mediaUrl ? "image" : undefined;
}

function replyPreviewFromMetadata(metadata: Record<string, unknown> | null | undefined): ReplyPreview | undefined {
  const raw = metadata?.reply_to;
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Record<string, unknown>;
  if (typeof value.id !== "string" || !value.id) return undefined;
  const mediaKind =
    value.mediaKind === "image" || value.mediaKind === "video" || value.mediaKind === "audio"
      ? value.mediaKind
      : undefined;
  return {
    id: value.id,
    author: typeof value.author === "string" ? value.author : undefined,
    text: typeof value.text === "string" ? value.text : undefined,
    mediaKind,
  };
}

function replyPreviewLabel(reply: ReplyPreview) {
  if (reply.text?.trim()) return reply.text;
  if (reply.mediaKind === "video") return "Video";
  if (reply.mediaKind === "audio") return "Voice note";
  if (reply.mediaKind === "image") return "Image";
  return "Message";
}

function ReplyQuote({
  reply,
  className = "",
}: {
  reply: ReplyPreview;
  className?: string;
}) {
  return (
    <div className={`border-l-2 border-white/50 bg-black/15 px-2.5 py-1.5 text-left ${className}`}>
      <span className="block truncate text-[10px] font-bold text-white/65">
        {reply.author || "Reply"}
      </span>
      <span className="mt-0.5 block truncate text-xs text-white/90">
        {replyPreviewLabel(reply)}
      </span>
    </div>
  );
}

function MenuItem({
  icon, label, onClick, state, danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  state?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-3 ${
        danger ? "text-red-400 hover:bg-red-950/40" : "text-zinc-200 hover:bg-zinc-800/80"
      }`}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {state !== undefined && (
        <span className={`h-4 w-7 rounded-full transition-colors ${state ? "bg-purple-600" : "bg-zinc-700"} relative`}>
          <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${state ? "left-3.5" : "left-0.5"}`} />
        </span>
      )}
    </button>
  );
}

function ChatThreadPage() {
  const { profile: myProfile } = useMyProfile();
  const { moments } = useMoments();
  const currentUserName = myProfile.display_name || myProfile.username || "YourWorld user";
  const currentUsername = myProfile.username || "user";
  const navigate = useNavigate();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [protectionWarning, setProtectionWarning] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isHD, setIsHD] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("normal");
  const [showFilters, setShowFilters] = useState(false);

  const filters = PHOTO_FILTERS;

  // Editor tools
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [activeTool, setActiveTool] = useState<null | "crop" | "emoji" | "text">(null);
  const [textColor, setTextColor] = useState(TEXT_COLORS[0]);
  const [textDraft, setTextDraft] = useState("");
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const cropStart = useRef<{ x: number; y: number } | null>(null);
  const dragId = useRef<string | null>(null);
  const imageBoxRef = useRef<HTMLDivElement>(null);
  const [openedOnce, setOpenedOnce] = useState<string[]>([]);
  const [viewOnceOpen, setViewOnceOpen] = useState<{
    id: string;
    url: string;
    kind: "image" | "audio";
    revokeUrl: boolean;
  } | null>(null);
  const [openingViewOnceId, setOpeningViewOnceId] = useState<string | null>(null);

  const handleClosePreview = () => {
    if (selectedImage?.startsWith("blob:")) { URL.revokeObjectURL(selectedImage); }
    setSelectedImage(null);
    setCaption("");
    setSelectedFilter("normal");
    setShowFilters(false);
    setOverlays([]);
    setActiveTool(null);
    setCropRect(null);
    setTextDraft("");
  };
  const { threadId } = Route.useParams();

  // Legacy links used the peer's user id as the thread id, which split the
  // conversation in two. Send those straight to the shared canonical thread.
  useEffect(() => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(threadId)) return;
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id;
      if (!alive || !uid || uid === threadId) return;
      void navigate({
        to: "/chat/$threadId",
        params: { threadId: dmThreadId(uid, threadId) },
        replace: true,
      });
    });
    return () => {
      alive = false;
    };
  }, [threadId, navigate]);

  const { startCall, clearCallHistory } = useCall();
  const {
    messages: dbMessages,
    currentUserId,
    send: sendToDb,
    conversationId,
    remove: removeFromDb,
    clearForEveryone,
    markRead,
    consumeViewOnce,
    purgeViewedMedia,
    loading: messagesLoading,
    loadingMore,
    hasMore,
    loadOlder,
  } = useThreadMessages(threadId, { staleTime: Infinity });
  const openViewOnce = useCallback(async (message: Message) => {
    if (
      !message.viewOnce ||
      message.sender !== "them" ||
      message.opened ||
      openedOnce.includes(message.id) ||
      openingViewOnceId !== null ||
      viewOnceOpen !== null
    ) {
      return;
    }
    const kind = message.audio ? "audio" : message.image ? "image" : null;
    const source = message.audio ?? message.image;
    if (!kind || !source) {
      toast.error("This view-once media is unavailable.");
      return;
    }

    setOpeningViewOnceId(message.id);
    try {
      const consumed = await consumeViewOnce(message.id);
      if (consumed.error) {
        toast.error(consumed.error);
        return;
      }
      setOpenedOnce((current) =>
        current.includes(message.id) ? current : [...current, message.id],
      );

      if (kind === "audio") {
        try {
          const response = await fetch(source);
          if (!response.ok) throw new Error("Voice note download failed.");
          const localUrl = URL.createObjectURL(await response.blob());
          setViewOnceOpen({ id: message.id, url: localUrl, kind, revokeUrl: true });
          const cleanup = await purgeViewedMedia(message.id);
          if (cleanup.error) {
            toast.error("The voice note opened, but secure media cleanup is retrying.");
          }
        } catch {
          setViewOnceOpen({ id: message.id, url: source, kind, revokeUrl: false });
          toast.error("The voice note could not be prepared locally; it will expire shortly.");
        }
      } else {
        setViewOnceOpen({ id: message.id, url: source, kind, revokeUrl: false });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to open this view-once media.",
      );
    } finally {
      setOpeningViewOnceId(null);
    }
  }, [consumeViewOnce, openedOnce, openingViewOnceId, purgeViewedMedia, viewOnceOpen]);

  useEffect(() => {
    if (!viewOnceOpen?.revokeUrl) return;
    return () => URL.revokeObjectURL(viewOnceOpen.url);
  }, [viewOnceOpen]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const keepScrollRef = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<ReplyPreview | null>(null);
  const [swipeState, setSwipeState] = useState<{ id: string; offset: number } | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [countdownNow, setCountdownNow] = useState(() => Date.now());
  const [revealedProtectedIds, setRevealedProtectedIds] = useState<string[]>([]);
  const captureAlertSequenceRef = useRef(0);
  const lastScreenshotAlertAtRef = useRef(0);
  const lastIncomingScreenshotAtRef = useRef(0);
  const protectedRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captureChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const captureChannelReadyRef = useRef(false);
  const pendingCaptureAlertsRef = useRef<Array<{
    event: "send_system_alert" | "USER_SCREENSHOT_TAKEN" | "USER_SCREEN_RECORDING_ALERT";
    payload: Record<string, unknown>;
  }>>([]);

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const messages = useMemo<Message[]>(() => {
    const fromDb: Message[] = dbMessages.map((m) => ({
      id: m.id,
      text: m.content || undefined,
      image: m.media_url ?? undefined,
      audio: m.voice_note_url ?? undefined,
      mediaKind: mediaKindFromMetadata(m.metadata, m.media_url, m.voice_note_url),
      sender: m.sender_id === currentUserId ? "me" : "them",
       system: m.is_system_message || CALL_LOG_PATTERN.test(m.content),
       captureEventId:
         typeof m.metadata?.capture_event_id === "string"
           ? m.metadata.capture_event_id
           : undefined,
      time: fmtTime(m.created_at),
      ts: new Date(m.created_at).getTime(),
      read: m.is_read,
       deletingAt:
         m.auto_delete_mode === "after_view" && m.is_viewed && m.expires_at
           ? Date.parse(m.expires_at)
           : undefined,
       viewOnce: m.metadata?.view_once === true,
      opened: m.is_viewed,
      momentId: m.moment_id ?? undefined,
      momentMediaUrl: m.moment_media_url ?? undefined,
      momentCreatedAt: m.moment_created_at ?? undefined,
       replyTo: replyPreviewFromMetadata(m.metadata),
      momentKind:
        m.metadata &&
        typeof m.metadata.preview === "object" &&
        m.metadata.preview !== null &&
        "kind" in m.metadata.preview &&
        (m.metadata.preview.kind === "photo" ||
          m.metadata.preview.kind === "video" ||
          m.metadata.preview.kind === "text")
          ? m.metadata.preview.kind
          : undefined,
    }));
    const persistedCaptureIds = new Set(
      fromDb.map((message) => message.captureEventId).filter((id): id is string => Boolean(id)),
    );
    return [...fromDb, ...localMessages.filter(
      (message) => !message.captureEventId || !persistedCaptureIds.has(message.captureEventId),
    )]
      .filter((m) => !hiddenIds.includes(m.id))
      .sort((a, b) => a.ts - b.ts);
  }, [dbMessages, localMessages, hiddenIds, currentUserId]);

  useEffect(() => {
    if (!dbMessages.some((m) =>
      m.auto_delete_mode === "after_view" &&
      m.is_viewed &&
      Boolean(m.expires_at),
    )) {
      return;
    }
    const timer = window.setInterval(() => setCountdownNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [dbMessages]);

  const openMomentReply = (message: Message) => {
    if (!message.momentId) return;
    const moment = moments.find((candidate) => candidate.id === message.momentId);
    if (!moment || moment.archived || (moment.expiresAt != null && moment.expiresAt <= Date.now())) {
      toast.error("This moment is no longer available (expired)");
      return;
    }
    void navigate({
      to: "/moment/$momentId",
      params: { momentId: message.momentId },
    });
  };

  // Read receipts: any visible incoming message is marked read.
  useEffect(() => {
    if (!currentUserId) return;
    const unread = dbMessages
      .filter(
        (m) =>
          m.sender_id !== currentUserId &&
          ((!m.is_read &&
            (m.auto_delete_mode !== "after_view" ||
              m.metadata?.view_once !== true ||
              m.is_viewed)) ||
            (m.auto_delete_mode === "after_view" &&
              m.metadata?.view_once !== true &&
              !m.is_viewed)),
      )
      .map((m) => m.id);
    if (unread.length) void markRead(unread);
  }, [dbMessages, currentUserId, markRead]);

  const [showEmojis, setShowEmojis] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionSheetId, setActionSheetId] = useState<string | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    offset: number;
    active: boolean;
  } | null>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Peer identity resolved from the thread (never hardcoded)
  const peer = useThreadPeer(threadId, currentUserId);
  // Live presence: online dot + "typing..." indicator.
  const { peerOnline, peerTyping, setTyping } = useThreadPresence(threadId, currentUserId);

  // Chat options persisted per conversation in the backend.
  const { settings, ready: settingsReady, patch, setAutoDeleteSetting } = useChatSettings(peer.peerId, conversationId);
  const { nameFor } = useChatNames();
  const displayName = nameFor(peer.peerId, settings.displayName ?? peer.peerName ?? "");
  const openPeerProfile = {
    preload: () => {
      if (!peer.peerId) return;
      void router.preloadRoute({ to: "/u/$userId", params: { userId: peer.peerId } }).catch(() => {});
    },
    go: () => {
      if (!peer.peerId) return;
      void navigate({ to: "/u/$userId", params: { userId: peer.peerId } });
    },
  };
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const setDisplayName = (n: string) => {
    patch({ displayName: n });
    void saveChatDisplayName(peer.peerId ?? "", n);
  };

  const secretLock = settings.secretLock;
  const [chatUnlocked, setChatUnlocked] = useState(false);
  const protectedMessagesEnabled = secretLock && chatUnlocked;
  const [unlockPin, setUnlockPin] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [pinMode, setPinMode] = useState<"set" | "remove" | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [autoDeleteOpen, setAutoDeleteOpen] = useState(false);

  const toggleSecretLock = () => {
    if (!peer.peerId) {
      pushSystem("Chat is still loading");
      return;
    }
    setPinError(null);
    setPinMode(secretLock ? "remove" : "set");
  };

  const submitPin = async (pin: string) => {
    const peerId = peer.peerId;
    if (!peerId) return;
    try {
      if (pinMode === "remove") {
        const salt = settings.secretPinSalt;
        const hash = settings.secretPinHash;
        if (!pin || !salt || !hash || (await hashPin(salt, pin)) !== hash) {
          setPinError("Incorrect PIN");
          return;
        }
        const result = await patch({ secretLock: false, secretPinSalt: null, secretPinHash: null });
        if (result.error) throw new Error(result.error);
        setChatUnlocked(true);
        setPinMode(null);
        pushSystem("Secret lock disabled");
        return;
      }
      if (!/^\d{4}$/.test(pin)) {
        setPinError("Use exactly 4 digits");
        return;
      }
      const salt = randomPinSalt();
      const hash = await hashPin(salt, pin);
      const result = await patch({ secretLock: true, secretPinSalt: salt, secretPinHash: hash });
      if (result.error) throw new Error(result.error);
      setChatUnlocked(true);
      setPinMode(null);
      pushSystem("Secret lock enabled");
    } catch (err) {
      console.error("[secret-lock] save failed", err);
      setPinError("Couldn't save. Check your connection and try again.");
    }
  };

  const screenshotAlert = settings.screenshotAlert;
  const recordingAlert = settings.recordingAlert;
  const muted = settings.muted;
  const blocked = settings.blocked;
  const [reported, setReported] = useState(false);

  const pushSystem = useCallback(async (text: string) => {
    if (currentUserId) {
       const sent = await sendToDb({ content: text, isSystemMessage: true });
      if (sent.error) toast.error(sent.error);
      return;
    }
    toast.error("Sign in to send messages.");
  }, [currentUserId, sendToDb]);

  const appendSecurityNotice = useCallback((text: string, eventId: string) => {
    const now = Date.now();
    setLocalMessages((previous) => [
      ...previous,
      {
        id: `local-capture-${eventId}`,
        text,
        sender: "me",
        system: true,
        captureEventId: eventId,
        time: fmtTime(new Date(now).toISOString()),
        ts: now,
      },
    ]);
  }, []);

  const updateSetting = async (
    next: Parameters<typeof patch>[0],
    successMessage: string,
  ) => {
    const result = await patch(next);
    if (result.error) {
      toast.error(result.error);
      return false;
    }
    toast.success(successMessage);
    return true;
  };

  const startLongPress = (id: string) => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
    longPressRef.current = setTimeout(() => setActionSheetId(id), 450);
  };
  const cancelLongPress = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
    longPressRef.current = null;
  };
  const startProtectedReveal = (id: string) => {
    if (protectedRevealTimerRef.current) clearTimeout(protectedRevealTimerRef.current);
    protectedRevealTimerRef.current = setTimeout(() => {
      setRevealedProtectedIds((previous) =>
        previous.includes(id) ? previous : [...previous, id],
      );
    }, 250);
  };
  const endProtectedReveal = (id: string) => {
    if (protectedRevealTimerRef.current) clearTimeout(protectedRevealTimerRef.current);
    protectedRevealTimerRef.current = null;
    setRevealedProtectedIds((previous) => previous.filter((value) => value !== id));
  };
  const createReplyPreview = (messageToReply: Message): ReplyPreview => ({
    id: messageToReply.id,
    author: messageToReply.sender === "me" ? currentUserName : displayName,
    text: messageToReply.text?.trim() || undefined,
    mediaKind: messageToReply.mediaKind,
  });
  const startMessageGesture = (messageToReply: Message, event: React.PointerEvent<HTMLDivElement>) => {
    if (selectMode) return;
    if (protectedMessagesEnabled) {
      startProtectedReveal(messageToReply.id);
      event.currentTarget.setPointerCapture?.(event.pointerId);
      return;
    }
    startLongPress(messageToReply.id);
    swipeRef.current = {
      id: messageToReply.id,
      startX: event.clientX,
      startY: event.clientY,
      offset: 0,
      active: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const moveMessageGesture = (event: React.PointerEvent<HTMLDivElement>) => {
    if (protectedMessagesEnabled) return;
    const gesture = swipeRef.current;
    if (!gesture) return;
    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    if (!gesture.active && Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 8) {
      cancelLongPress();
      if (Math.abs(deltaX) > Math.abs(deltaY)) gesture.active = true;
    }
    if (!gesture.active) return;
    gesture.offset = Math.max(-92, Math.min(92, deltaX));
    setSwipeState({ id: gesture.id, offset: gesture.offset });
  };
  const endMessageGesture = (messageToReply: Message) => {
    if (protectedMessagesEnabled) {
      endProtectedReveal(messageToReply.id);
      return;
    }
    const gesture = swipeRef.current;
    cancelLongPress();
    if (gesture?.id === messageToReply.id && gesture.active && Math.abs(gesture.offset) >= 64) {
      setReplyTo(createReplyPreview(messageToReply));
      requestAnimationFrame(() => messageInputRef.current?.focus());
    }
    swipeRef.current = null;
    setSwipeState(null);
  };
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const deleteIds = (ids: string[]) => {
    setLocalMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
    setHiddenIds((prev) => [...prev, ...ids]);
    void removeFromDb(ids.filter((id) => !id.startsWith("local-")));
    setSelectedIds([]);
  };
  const confirmClearForEveryone = async () => {
    const result = await clearForEveryone();
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setLocalMessages([]);
    setHiddenIds([]);
    if (peer.peerId) clearCallHistory(peer.peerId);
    exitSelectMode();
    setClearConfirmOpen(false);
    toast.success("Chat cleared for everyone.");
  };
  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds([]);
  };

  useEffect(
    () => () => {
      cancelLongPress();
      if (protectedRevealTimerRef.current) clearTimeout(protectedRevealTimerRef.current);
    },
    [],
  );

  const EMOJIS = ["👍", "❤️", "😂", "🔥", "😍", "🥰", "😘", "💋", "💕", "💖", "💗", "💓", "💞", "💝", "💘", "🥺", "👏", "🎉", "😢"];

  const didFirstScroll = useRef(false);
  const lastMessageKeyRef = useRef<string | null>(null);
  const scrollToLatest = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: didFirstScroll.current ? "smooth" : "auto",
        block: "end",
      });
      didFirstScroll.current = true;
    });
  };

  useEffect(() => {
    // Older pages prepend above — keep the reader anchored instead of jumping down.
    if (keepScrollRef.current !== null && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight - keepScrollRef.current;
      keepScrollRef.current = null;
      return;
    }
    const newest = messages[messages.length - 1];
    const nextKey = newest ? `${newest.id}:${newest.ts}` : null;
    const isInitialLoad = lastMessageKeyRef.current === null && nextKey !== null;
    const isNewMessage = nextKey !== null && nextKey !== lastMessageKeyRef.current;
    lastMessageKeyRef.current = nextKey;
    if (isInitialLoad || isNewMessage) scrollToLatest();
  }, [messages]);

  const onScrollMessages = () => {
    const el = scrollRef.current;
    if (!el || el.scrollTop > 80 || loadingMore || !hasMore) return;
    keepScrollRef.current = el.scrollHeight;
    void loadOlder();
  };


  const captureChannelName = conversationId ? `social-chat-capture-${conversationId}` : null;
  const captureAlertsEnabled = screenshotAlert || recordingAlert;
  useAndroidSecureFlag(captureAlertsEnabled);

  const handleIncomingCaptureAlert = useCallback(
    (payload: Record<string, unknown>, kind: "screenshot" | "recording") => {
      const senderId = String(payload.senderId ?? "");
      if (!conversationId || payload.chatId !== conversationId || senderId === currentUserId) return;
      if (muted || (kind === "recording" ? !recordingAlert : !screenshotAlert)) return;
      if (kind === "screenshot") {
        const now = Date.now();
        if (now - lastIncomingScreenshotAtRef.current < 3_000) return;
        lastIncomingScreenshotAtRef.current = now;
      }
      const actorName = String(payload.actorName ?? "Someone");
      const text =
        kind === "screenshot"
          ? `📸 ${actorName} took a screenshot`
          : `📹 ${actorName} started screen recording`;
      appendSecurityNotice(text, String(payload.eventId ?? `${kind}-${Date.now()}`));
    },
    [
      appendSecurityNotice,
      conversationId,
      currentUserId,
      muted,
      recordingAlert,
      screenshotAlert,
    ],
  );

  useEffect(() => {
    captureChannelReadyRef.current = false;
    captureChannelRef.current = null;
    pendingCaptureAlertsRef.current = [];
    if (!captureChannelName || !currentUserId) return;
    const channel = supabase
      .channel(captureChannelName)
       .on("broadcast", { event: "send_system_alert" }, ({ payload }) => {
         const value = payload as Record<string, unknown>;
         handleIncomingCaptureAlert(value, value.kind === "recording" ? "recording" : "screenshot");
       })
       .on("broadcast", { event: "USER_SCREENSHOT_TAKEN" }, ({ payload }) => {
        handleIncomingCaptureAlert(payload as Record<string, unknown>, "screenshot");
      })
      .on("broadcast", { event: "USER_SCREEN_RECORDING_ALERT" }, ({ payload }) => {
        handleIncomingCaptureAlert(payload as Record<string, unknown>, "recording");
      });
    captureChannelRef.current = channel;
    channel.subscribe((status) => {
      if (status !== "SUBSCRIBED") return;
      captureChannelReadyRef.current = true;
      const pending = pendingCaptureAlertsRef.current.splice(0);
      pending.forEach(({ event, payload }) => {
        void channel.send({ type: "broadcast", event, payload });
      });
    });
    return () => {
      captureChannelReadyRef.current = false;
      if (captureChannelRef.current === channel) captureChannelRef.current = null;
      pendingCaptureAlertsRef.current = [];
      void channel.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [captureChannelName, currentUserId, handleIncomingCaptureAlert]);

  const dispatchChatSecurityAlert = useCallback(
    (kind: "screenshot" | "recording") => {
      if (
        !captureChannelName ||
        !currentUserId ||
        (kind === "screenshot" && !screenshotAlert) ||
        (kind === "recording" && !recordingAlert)
      ) return;
      if (kind === "screenshot") {
        const now = Date.now();
        if (now - lastScreenshotAlertAtRef.current < 3_000) return;
        lastScreenshotAlertAtRef.current = now;
      }
      const eventId = `${currentUserId}-${Date.now()}-${captureAlertSequenceRef.current++}`;
      const text =
        kind === "screenshot"
          ? `📸 ${currentUsername} took a screenshot`
          : `📹 ${currentUsername} started screen recording`;
      appendSecurityNotice(text, eventId);
      void sendToDb({
        content: text,
        isSystemMessage: true,
        metadata: { capture_event_id: eventId, capture_kind: kind },
      }).then((result) => {
        if (result.error) {
          setLocalMessages((previous) =>
            previous.filter((message) => message.captureEventId !== eventId),
          );
        }
      });

      const event = kind === "screenshot"
        ? "send_system_alert"
        : "USER_SCREEN_RECORDING_ALERT";
      const payload = {
        chatId: conversationId,
        senderId: currentUserId,
        actorName: currentUsername,
        eventId,
        kind,
      };
      if (captureChannelReadyRef.current && captureChannelRef.current) {
        void captureChannelRef.current.send({ type: "broadcast", event, payload });
      } else {
        pendingCaptureAlertsRef.current.push({ event, payload });
      }
    },
    [
      captureChannelName,
      conversationId,
      currentUserId,
      currentUsername,
      appendSecurityNotice,
      recordingAlert,
      screenshotAlert,
      sendToDb,
    ],
  );

  useCaptureDetect(captureAlertsEnabled, dispatchChatSecurityAlert, {
    screenshotEnabled: screenshotAlert,
    protectedElementId: "chat-messages-container",
  });

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isRecording) {
      timer = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);


  const doSend = (currentMsg: string) => {
    setTyping(false);
    if (currentUserId) {
        void sendToDb({
          content: currentMsg,
          metadata: replyTo ? { reply_to: replyTo } : undefined,
        }).then((sent) => {
        if (sent.error) toast.error(sent.error);
      });
    } else {
      toast.error("Sign in to send messages.");
    }
    setMessage("");
    setReplyTo(null);
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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    // Compress on-device first so sending/uploading is near-instant.
    const compressed = await compressImageFile(file, { maxDim: 1600, quality: 0.82 });
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
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        void (async () => {
          if (!currentUserId) return;
          const path = `${currentUserId}/${threadId}/voice-${Date.now()}.webm`;
          const uploaded = await uploadWithProgress(
            STORAGE_BUCKETS.voiceNotes,
            path,
            blob,
            "audio/webm",
          );
          if (uploaded.error || !uploaded.url) {
            toast.error(uploaded.error ?? "Voice note upload failed");
            return;
          }
          const sent = await sendToDb({
            voice_note_url: uploaded.url,
            viewOnce: settings.viewOnce,
            expiringMedia: settings.viewOnce,
            metadata: {
              ...(replyTo ? { reply_to: replyTo } : {}),
              media_bucket: STORAGE_BUCKETS.voiceNotes,
              media_path: path,
            },
          });
          if (sent.error) toast.error(sent.error);
          else setReplyTo(null);
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

  return (
    <>
    <div className="fixed inset-0 z-50 flex h-[100dvh] flex-col justify-between overflow-hidden bg-black font-sans text-white">
      {!settingsReady || (secretLock && !chatUnlocked && settings.secretPinHash) ? (
        <div className="absolute inset-0 z-[95] grid place-items-center bg-black px-6">
          {settingsReady ? <form
            className="w-full max-w-xs space-y-4 text-center"
            onSubmit={(e) => {
              e.preventDefault();
              void (async () => {
                const salt = settings.secretPinSalt;
                const hash = settings.secretPinHash;
                if (!salt || !hash || (await hashPin(salt, unlockPin)) !== hash) {
                  setUnlockError("Incorrect PIN");
                  setUnlockPin("");
                  return;
                }
                setUnlockError(null);
                setChatUnlocked(true);
                setUnlockPin("");
              })();
            }}
          >
            <Lock size={28} className="mx-auto text-purple-400" />
            <div>
              <h1 className="text-lg font-bold">Secret chat locked</h1>
              <p className="mt-1 text-xs text-zinc-400">Enter your PIN to open this conversation.</p>
            </div>
            <input
              value={unlockPin}
               onChange={(e) => { setUnlockPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setUnlockError(null); }}
              inputMode="numeric"
              type="password"
              autoFocus
              aria-label="Secret chat PIN"
              className="h-12 w-full rounded-xl bg-zinc-900 px-4 text-center text-lg outline-none"
            />
            {unlockError && <p className="text-xs font-medium text-red-400">{unlockError}</p>}
            <button type="submit" className="h-11 w-full rounded-xl bg-purple-600 text-sm font-bold">Unlock</button>

          </form> : <div className="text-sm text-zinc-400">Loading chat security…</div>}
        </div>
      ) : null}
      
      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageSelect} />
      <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />

      {/* TOP HEADER */}
      <div
        className="sticky top-0 z-50 flex shrink-0 items-center justify-between border-b border-zinc-800/80 bg-zinc-950 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => historyBackOr(() => void navigate({ to: "/chat" }))}
            aria-label="Back to Chat"
            className="p-1 text-zinc-300 hover:text-white"
          >
            <ArrowLeft size={22} />
          </button>
          
          <div
            className="relative cursor-pointer"
            onPointerDown={openPeerProfile.preload}
            onClick={openPeerProfile.go}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md">
              {(displayName || "U").charAt(0).toUpperCase()}
            </div>
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-black rounded-full ${
                peerOnline ? "bg-emerald-500" : "bg-zinc-600"
              }`}
            />
          </div>

          <div className="flex flex-col">
            <span
              className="font-bold text-sm leading-tight text-white flex items-center gap-1 cursor-pointer"
              onPointerDown={openPeerProfile.preload}
              onClick={openPeerProfile.go}
            >
              {displayName}
              {secretLock && <Lock size={12} className="text-purple-400" />}
              {muted && <BellOff size={12} className="text-zinc-500" />}
            </span>
            <span className="text-[11px] font-medium">
              {blocked ? (
                <span className="text-red-400">Blocked</span>
              ) : peerTyping ? (
                <span className="text-purple-400">typing...</span>
              ) : peerOnline ? (
                <span className="text-emerald-400">Online</span>
              ) : (
                <span className="text-zinc-500">Offline</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-zinc-300">
          <button
            onClick={() =>
              void startCall({
                threadId,
                peerId: peer.peerId ?? undefined,
                peerName: displayName,
                mode: "audio",
              })
            }
            aria-label="Voice call"
            className="hover:text-white"
          >
            <Phone size={20} />
          </button>
          <button
            onClick={() =>
              void startCall({
                threadId,
                peerId: peer.peerId ?? undefined,
                peerName: displayName,
                mode: "video",
              })
            }
            aria-label="Video call"
            className="hover:text-white"
          >
            <Video size={20} />
          </button>
          <button onClick={() => setShowOptionsMenu(!showOptionsMenu)} className="hover:text-white"><MoreVertical size={20} /></button>
        </div>

        {/* 3-DOTS OPTIONS DROPDOWN WITH ALL 9 EXACT OPTIONS */}
        {showOptionsMenu && (
          <>
            <div className="fixed inset-0 z-[75]" onClick={() => setShowOptionsMenu(false)} />
            <div className="absolute right-4 top-14 w-64 bg-zinc-900/95 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-[80] backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
              <MenuItem icon={<Pencil size={16} className="text-zinc-400" />} label="Change Display Name" onClick={() => {
                setNameDraft(displayName);
                setNameDialogOpen(true);
                setShowOptionsMenu(false);
              }} />
              <MenuItem icon={<Lock size={16} className="text-zinc-400" />} label="Secret Lock Chat" state={secretLock} onClick={() => {
                void toggleSecretLock();
                setShowOptionsMenu(false);
              }} />
              <MenuItem icon={<EyeOff size={16} className="text-zinc-400" />} label="View Once Media" state={settings.viewOnce} onClick={() => {
                void updateSetting({ viewOnce: !settings.viewOnce }, `View once media ${!settings.viewOnce ? "on" : "off"}`);
                setShowOptionsMenu(false);
              }} />
              <MenuItem icon={<Clock size={16} className="text-zinc-400" />} label={settings.autoDeleteSetting === "off" ? "Auto Delete Messages" : `Auto Delete: ${autoDeleteLabel(settings.autoDeleteSetting)}`} state={settings.autoDeleteSetting !== "off"} onClick={() => {
                setAutoDeleteOpen(true);
                setShowOptionsMenu(false);
              }} />
              <MenuItem icon={<Camera size={16} className="text-zinc-400" />} label="Screenshot Alert" state={screenshotAlert} onClick={() => {
                void updateSetting({ screenshotAlert: !screenshotAlert }, `Screenshot alerts ${!screenshotAlert ? "on" : "off"}`);
                setShowOptionsMenu(false);
              }} />
              <MenuItem icon={<VideoOff size={16} className="text-zinc-400" />} label="Screen Recording Alert" state={recordingAlert} onClick={() => {
                void updateSetting({ recordingAlert: !recordingAlert }, `Recording alerts ${!recordingAlert ? "on" : "off"}`);
                setShowOptionsMenu(false);
              }} />
              <MenuItem icon={<BellOff size={16} className="text-zinc-400" />} label="Mute Notifications" state={muted} onClick={() => {
                void updateSetting({ muted: !muted }, `Notifications ${!muted ? "muted" : "unmuted"}`);
                setShowOptionsMenu(false);
              }} />
              <MenuItem icon={<Trash2 size={16} className="text-zinc-400" />} label="Clear Chat" onClick={() => {
                setClearConfirmOpen(true);
                setShowOptionsMenu(false);
              }} />
              <MenuItem danger icon={<UserX size={16} className="text-red-400" />} label={blocked ? "Unblock User" : "Block User"} state={blocked} onClick={() => {
                void (async () => {
                  if (!currentUserId || !peer.peerId) return;
                  const nextBlocked = !blocked;
                  const saved = await updateSetting(
                    { blocked: nextBlocked },
                    nextBlocked ? "User blocked" : "User unblocked",
                  );
                  if (saved && !nextBlocked) await pushSystem(`${displayName} unblocked`);
                })();
                setShowOptionsMenu(false);
              }} />
              <MenuItem danger icon={<Flag size={16} className="text-red-400" />} label={reported ? "Reported" : "Report User"} state={reported} onClick={() => {
                if (!reported) void (async () => {
                  if (!currentUserId || !peer.peerId) return;
                  const error = await reportSocialUser(currentUserId, peer.peerId, threadId);
                  if (error) {
                    toast.error(error);
                    return;
                  }
                  setReported(true);
                  toast.success("Report submitted. Our team will review it.");
                })();
                setShowOptionsMenu(false);
              }} />
            </div>
          </>
        )}
      </div>

      {autoDeleteOpen && (
        <div className="fixed inset-0 z-[130] grid place-items-center bg-black/70 px-6" onClick={() => setAutoDeleteOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs space-y-1 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl">
            <h2 className="px-2 pb-2 text-sm font-bold text-white">Auto-delete messages</h2>
            {AUTO_DELETE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                   void setAutoDeleteSetting(option.value).then((result) => {
                     if (result.error) toast.error(result.error);
                     else toast.success(`Auto-delete ${option.label.toLowerCase()}`);
                   });
                  setAutoDeleteOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-zinc-800 ${
                  settings.autoDeleteSetting === option.value ? "font-bold text-purple-300" : "text-zinc-200"
                }`}
              >
                {option.label}
                {settings.autoDeleteSetting === option.value && <CheckCheck size={16} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {protectionWarning !== null && (
        <div className="fixed inset-0 z-[140] grid place-items-center bg-black/70 px-6" onClick={() => setProtectionWarning(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-center">
            <h3 className="text-sm font-bold text-white">{PLATFORM_PROTECTION_WARNING_TITLE}</h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">{PLATFORM_PROTECTION_WARNING_BODY}</p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={() => { setProtectionWarning(null); void navigate({ to: "/wallet" }); }}
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"
              >
                Create Official Sponsorship Deal
              </button>
              <button
                onClick={() => { const text = protectionWarning; setProtectionWarning(null); doSend(text); }}
                className="w-full rounded-xl border border-zinc-700 px-4 py-2.5 text-xs font-semibold text-zinc-300"
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MESSAGES AREA */}
      {selectMode && (
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0">
          <button onClick={exitSelectMode} className="text-xs font-semibold text-zinc-300">Cancel</button>
          <span className="text-xs font-bold text-white">{selectedIds.length} selected</span>
          <button
            onClick={() => { deleteIds(selectedIds); setSelectMode(false); }}
            disabled={selectedIds.length === 0}
            className={`text-xs font-bold flex items-center gap-1 ${selectedIds.length ? "text-red-400" : "text-zinc-600"}`}
          >
            <Trash2 size={15} /> Delete
          </button>
        </div>
      )}

      <div
        id="chat-messages-container"
        ref={scrollRef}
        onScroll={onScrollMessages}
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] p-4 bg-zinc-950/50"
        onClick={() => setShowOptionsMenu(false)}
      >
        <div
          className="relative min-h-full space-y-3.5"
        >
         <UserWatermark username={currentUsername} className="fixed text-white" />
        {messagesLoading && messages.length > 0 ? (
          <p className="flex items-center justify-center gap-2 py-1 text-[11px] text-zinc-500" aria-live="polite">
            <span className="h-3 w-3 animate-spin rounded-full border border-zinc-600 border-t-zinc-300" />
            Syncing messages…
          </p>
        ) : null}
        {loadingMore ? (
          <p className="py-1 text-center text-[11px] text-zinc-500">Loading older messages…</p>
        ) : null}
        {messagesLoading && messages.length === 0 && (
          <div className="space-y-3.5" aria-hidden>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
                <div
                  className="h-10 animate-pulse rounded-2xl bg-gradient-to-r from-zinc-800/70 via-zinc-700/60 to-zinc-800/70 bg-[length:200%_100%]"
                  style={{ width: `${45 + ((i * 37) % 30)}%` }}
                />
              </div>
            ))}
          </div>
        )}
        {messages.map((m) => m.system ? (
          <p key={m.id} className="mx-auto flex w-fit items-center gap-2 rounded-full bg-zinc-800/70 px-3 py-1 text-center text-[11px] text-zinc-400">
            <span>{m.text}</span>
            <time dateTime={new Date(m.ts).toISOString()} className="text-[10px] text-zinc-500">
              {m.time}
            </time>
          </p>
        ) : (
          <div
            key={m.id}
            onPointerDown={(event) => startMessageGesture(m, event)}
            onPointerMove={moveMessageGesture}
            onPointerUp={() => endMessageGesture(m)}
            onPointerCancel={() => endMessageGesture(m)}
            onContextMenu={(e) => { e.preventDefault(); if (!selectMode) setActionSheetId(m.id); }}
            onClick={() => selectMode && toggleSelect(m.id)}
            className={`flex flex-col ${m.sender === "me" ? "items-end" : "items-start"} ${
              selectMode && selectedIds.includes(m.id) ? "rounded-2xl bg-purple-500/10 ring-1 ring-purple-500/40" : ""
            } ${selectMode ? "cursor-pointer select-none px-1 py-1" : "touch-pan-y"}`}
            style={{
              transform: swipeState?.id === m.id ? `translateX(${swipeState.offset}px)` : undefined,
              transition: swipeState?.id === m.id ? "none" : "transform 120ms ease-out",
               filter:
                 protectedMessagesEnabled && !revealedProtectedIds.includes(m.id)
                   ? "blur(14px)"
                   : undefined,
            }}
          >
            {selectMode && (
              <span className={`mb-1 flex h-4 w-4 items-center justify-center rounded-full border ${
                selectedIds.includes(m.id) ? "border-purple-500 bg-purple-600 text-white" : "border-zinc-600"
              }`}>
                {selectedIds.includes(m.id) && <Check size={11} />}
              </span>
            )}
            {m.text && (
              <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                m.sender === "me" ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-xs" : "bg-zinc-800/90 text-zinc-100 rounded-bl-xs border border-zinc-700/50"
              }`}>
                {m.replyTo && <ReplyQuote reply={m.replyTo} className="mb-2 rounded-lg" />}
                {m.momentId ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openMomentReply(m);
                    }}
                    className="group mb-2 flex w-full items-center gap-2 rounded-xl border border-white/15 bg-black/20 p-2 text-left transition hover:border-white/35 hover:bg-black/30 focus:outline-none focus:ring-2 focus:ring-white/60"
                    aria-label="Open replied Moment"
                  >
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/15">
                      {m.momentMediaUrl ? (
                        m.momentKind === "video" ? (
                          <video
                            src={m.momentMediaUrl}
                            muted
                            playsInline
                            preload="metadata"
                            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                          />
                        ) : (
                          <img
                            src={m.momentMediaUrl}
                            alt=""
                            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                          />
                        )
                      ) : (
                        <span className="grid h-full w-full place-items-center text-[10px] text-zinc-500">Text</span>
                      )}
                      <span className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">
                        Replying to Moment
                      </span>
                      <span className="mt-0.5 block truncate text-xs font-semibold text-white/90">
                        Tap to view
                      </span>
                    </span>
                    <span className="text-lg leading-none text-white/60 transition-transform group-hover:translate-x-0.5">›</span>
                  </button>
                ) : null}
                {m.text}
              </div>
            )}

            {!m.text && m.replyTo && <ReplyQuote reply={m.replyTo} className="mb-1 w-[75%] rounded-lg bg-zinc-800/90" />}

            {m.image && m.viewOnce && m.sender === "them" && !m.opened && !openedOnce.includes(m.id) ? (
              <button
                type="button"
                disabled={openingViewOnceId === m.id}
                onClick={() => void openViewOnce(m)}
                className="max-w-[75%] flex items-center gap-2 rounded-2xl border border-emerald-600/60 bg-emerald-950/30 px-4 py-3 text-xs font-bold text-emerald-400"
              >
                <span className="w-5 h-5 rounded-full border border-emerald-500 flex items-center justify-center">1</span>
                {openingViewOnceId === m.id ? "Opening…" : "Tap to view once"}
              </button>
            ) : m.image && !m.momentId && !(m.viewOnce && (m.opened || openedOnce.includes(m.id))) ? (
              <div className="max-w-[75%] rounded-2xl overflow-hidden border border-zinc-800 shadow-lg">
                <LazyImage
                  src={m.image}
                  alt="Attachment"
                  wrapperClassName="w-full"
                  className="w-full h-auto object-cover max-h-60"
                />
              </div>
            ) : null}

            {m.audio && m.viewOnce && m.sender === "them" && !m.opened && !openedOnce.includes(m.id) && (
              <button
                type="button"
                disabled={openingViewOnceId === m.id}
                onClick={() => void openViewOnce(m)}
                className="max-w-[75%] flex items-center gap-2 rounded-2xl border border-emerald-600/60 bg-emerald-950/30 px-4 py-3 text-xs font-bold text-emerald-400 disabled:opacity-60"
              >
                <span className="w-5 h-5 rounded-full border border-emerald-500 flex items-center justify-center">1</span>
                {openingViewOnceId === m.id ? "Preparing voice note…" : "Tap to listen once"}
              </button>
            )}

            {m.viewOnce && (m.opened || openedOnce.includes(m.id)) && (
              <div className="max-w-[75%] flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-800/70 px-4 py-3 text-xs font-semibold text-zinc-400">
                <EyeOff size={15} /> {m.sender === "me" ? "Opened by recipient" : "Opened"}
              </div>
            )}

            {m.audio && !(m.viewOnce && (m.sender === "them" || m.opened || openedOnce.includes(m.id))) && (
              <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl min-w-[200px] ${
                m.sender === "me" ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : "bg-zinc-800 text-white border border-zinc-700"
              }`}>
                <button
                  onClick={() => {
                    const aud = new Audio(m.audio);
                    if (playingAudioId === m.id) {
                      setPlayingAudioId(null);
                    } else {
                      setPlayingAudioId(m.id);
                      aud.play();
                      aud.onended = () => setPlayingAudioId(null);
                    }
                  }}
                  className="p-2 bg-white/20 rounded-full"
                >
                  {playingAudioId === m.id ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="w-full h-1 bg-white/40 rounded-full overflow-hidden">
                    <div className={`h-full bg-white ${playingAudioId === m.id ? 'w-2/3 animate-pulse' : 'w-0'}`} />
                  </div>
                  <span className="text-[10px] opacity-80">Voice Note</span>
                </div>
              </div>
            )}

            {m.deletingAt && m.deletingAt > countdownNow && (
              <span className="mt-1 px-1 text-[10px] text-zinc-500">
                Deleting in {Math.max(1, Math.ceil((m.deletingAt - countdownNow) / 1000))}s
              </span>
            )}

            <span className="text-[10px] text-zinc-500 mt-1 px-1 flex items-center gap-1">
              {m.time}
              {m.sender === "me" && (
                m.local ? (
                  <Check size={12} className="text-zinc-500" />
                ) : m.read ? (
                   <CheckCheck size={12} className="text-emerald-500" />
                ) : (
                  <CheckCheck size={12} className="text-zinc-500" />
                )
              )}
            </span>
          </div>
        ))}
         {peerTyping ? (
           <div className="flex items-end gap-2" aria-live="polite" aria-label="The other person is typing">
             <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-zinc-700/60 bg-zinc-800/90 px-4 py-3">
               {[0, 1, 2].map((delay) => (
                 <span
                   key={delay}
                   className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400"
                   style={{ animationDelay: `${delay * 140}ms` }}
                 />
               ))}
             </div>
           </div>
         ) : null}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* LONG-PRESS ACTION SHEET */}
      {actionSheetId !== null && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/60 backdrop-blur-sm" onClick={() => setActionSheetId(null)}>
          <div className="w-full rounded-t-3xl border-t border-zinc-800 bg-zinc-900 p-3 pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700" />
            {messages.find((message) => message.id === actionSheetId)?.sender === "me" && (
              <button
                onClick={() => { deleteIds([actionSheetId]); setActionSheetId(null); }}
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-950/40"
              >
                <Trash2 size={18} /> Unsend
              </button>
            )}
            <button
              onClick={() => { setSelectMode(true); setSelectedIds([actionSheetId]); setActionSheetId(null); }}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
            >
              <CheckCheck size={18} /> Select Multiple
            </button>
          </div>
        </div>
      )}

      {/* EMOJI PICKER */}
      {showEmojis && (
        <div className="flex gap-2 p-3 bg-zinc-900 border-t border-zinc-800 overflow-x-auto">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => setMessage((prev) => prev + e)} className="text-2xl p-2 hover:bg-zinc-800 rounded-xl">
              {e}
            </button>
          ))}
        </div>
      )}

      {/* INPUT BAR */}
      <div className="sticky bottom-0 z-40 flex shrink-0 flex-col gap-2 border-t border-zinc-800/80 bg-zinc-950 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3">
        {replyTo && (
          <div className="flex w-full items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-purple-300">Replying to</span>
              <ReplyQuote reply={replyTo} className="mt-1 rounded-md bg-black/20" />
            </div>
            <button
              type="button"
              aria-label="Cancel reply"
              onClick={() => setReplyTo(null)}
              className="shrink-0 rounded-full p-1 text-zinc-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="flex w-full items-center gap-2">
        {blocked ? (
          <p className="flex-1 text-center text-xs font-semibold text-zinc-500 py-2">
            You blocked {displayName}. Unblock from the menu to message.
          </p>
        ) : isRecording ? (
          <div className="flex-1 flex items-center justify-between bg-red-950/40 border border-red-500/50 rounded-full px-4 py-2 text-red-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              <span className="text-xs font-mono font-bold">Recording {recordingTime}s</span>
            </div>
            <button onClick={stopRecording} className="p-1.5 bg-red-600 text-white rounded-full text-xs font-bold">
              Send
            </button>
          </div>
        ) : (
          <>
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-zinc-400 hover:text-white"><ImageIcon size={22} /></button>
            <button onClick={startRecording} className="p-2 text-zinc-400 hover:text-white"><Mic size={22} /></button>
            
            <div className="flex-1 relative flex items-center">
              <button type="button" aria-label="Open camera" className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white mr-2 shrink-0" onClick={() => cameraInputRef.current?.click()}>
  <Camera size={18} />
</button>
              <input
                 ref={messageInputRef}
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setTyping(e.target.value.trim().length > 0);
                }}
                onFocus={scrollToLatest}
                onBlur={() => setTyping(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setTyping(false);
                    handleSend();
                  }
                }}
                placeholder="Message..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2.5 pl-4 pr-10 text-sm text-white focus:outline-none"
              />
             <button onClick={() => setShowEmojis(!showEmojis)} className="absolute right-3 text-zinc-400 hover:text-white">
                <Smile size={18} />
              </button>
            </div>

            <button
              onClick={handleSend}
              className={`p-2.5 rounded-full flex items-center justify-center ${
                message.trim() ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white" : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              }`}
            >
              <Send size={18} />
            </button>
          </>
        )}
        </div>
      </div>


    </div>
    {/* WhatsApp / Instagram Style Full Screen Editor */}
{viewOnceOpen && (
  <div className="fixed inset-0 z-[95] bg-black flex flex-col">
    <div className="flex items-center justify-between p-4 text-white">
      <span className="text-xs font-bold text-emerald-400 flex items-center gap-2"><EyeOff size={14} /> View once</span>
      <button
        type="button"
        onClick={() => {
          setViewOnceOpen(null);
        }}
        className="p-2 bg-zinc-800/80 rounded-full"
      >
        <X size={20} />
      </button>
    </div>
    <div className="flex-1 flex items-center justify-center p-4">
      {viewOnceOpen.kind === "audio" ? (
        <audio
          src={viewOnceOpen.url}
          controls
          autoPlay
          aria-label="View-once voice note"
          className="w-full max-w-md"
          onEnded={() => setViewOnceOpen(null)}
        />
      ) : (
        <LazyImage
          src={viewOnceOpen.url}
          alt="View once"
          loading="eager"
          onLoad={() => {
            void purgeViewedMedia(viewOnceOpen.id).then((cleanup) => {
              if (cleanup.error) {
                toast.error("Media opened, but secure cleanup is retrying.");
              }
            });
          }}
          wrapperClassName="max-h-full max-w-full"
          className="max-h-full max-w-full object-contain rounded-lg"
        />
      )}
    </div>
  </div>
)}
{selectedImage && (
  <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between p-4">
    {/* Top Controls */}
    <div className="flex items-center justify-between text-white pt-2 px-2 z-10">
      <button type="button" onClick={handleClosePreview} className="p-2 bg-zinc-800/80 rounded-full hover:bg-zinc-700">
        <X size={20} />
      </button>
      <div className="flex items-center gap-3">
        <button 
          type="button"
          onClick={() => setIsHD(!isHD)} 
          className={`px-2 py-0.5 text-xs font-bold border rounded transition-all ${isHD ? 'border-emerald-500 text-emerald-400 bg-emerald-950/40' : 'border-zinc-600 text-zinc-400'}`}
        >
          HD
        </button>
        <button 
          type="button"
          onClick={() => setShowFilters(!showFilters)} 
          className={`p-2 rounded-full transition-all ${showFilters ? 'bg-emerald-500 text-black' : 'bg-zinc-800/80 text-zinc-200'}`}
        >
          <Sparkles size={18} />
        </button>
        <button
          type="button"
          onClick={() => { setActiveTool((t) => (t === "crop" ? null : "crop")); setCropRect(null); }}
          className={`p-2 rounded-full transition-all ${activeTool === "crop" ? "bg-emerald-500 text-black" : "bg-zinc-800/80 text-zinc-300"}`}
        >
          <Crop size={18} />
        </button>
        <button
          type="button"
          onClick={() => setActiveTool((t) => (t === "emoji" ? null : "emoji"))}
          className={`p-2 rounded-full transition-all ${activeTool === "emoji" ? "bg-emerald-500 text-black" : "bg-zinc-800/80 text-zinc-300"}`}
        >
          <Smile size={18} />
        </button>
        <button
          type="button"
          onClick={() => setActiveTool((t) => (t === "text" ? null : "text"))}
          className={`p-2 rounded-full transition-all ${activeTool === "text" ? "bg-emerald-500 text-black" : "bg-zinc-800/80 text-zinc-300"}`}
        >
          <Type size={18} />
        </button>
      </div>
    </div>

    {/* Center Image */}
    <div
      ref={imageBoxRef}
      className="flex-1 flex items-center justify-center my-2 overflow-hidden relative touch-none"
      onPointerDown={(e) => {
        if (activeTool !== "crop") return;
        const r = imageBoxRef.current!.getBoundingClientRect();
        cropStart.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
        setCropRect({ x: cropStart.current.x, y: cropStart.current.y, w: 0, h: 0 });
      }}
      onPointerMove={(e) => {
        const r = imageBoxRef.current!.getBoundingClientRect();
        const nx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        const ny = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        if (activeTool === "crop" && cropStart.current) {
          const s = cropStart.current;
          setCropRect({ x: Math.min(s.x, nx), y: Math.min(s.y, ny), w: Math.abs(nx - s.x), h: Math.abs(ny - s.y) });
          return;
        }
        if (dragId.current) {
          const id = dragId.current;
          setOverlays((prev) => prev.map((o) => (o.id === id ? { ...o, x: nx, y: ny } : o)));
        }
      }}
      onPointerUp={() => { cropStart.current = null; dragId.current = null; }}
      onPointerLeave={() => { cropStart.current = null; dragId.current = null; }}
    >
      <img 
        src={selectedImage} 
        alt="Preview" 
        draggable={false}
        className={`max-h-full max-w-full object-contain rounded-lg transition-all duration-300 ${filters.find(f => f.id === selectedFilter)?.class || ''}`} 
      />

      {/* Draggable text / emoji overlays */}
      {overlays.map((o) => (
        <button
          key={o.id}
          type="button"
          onPointerDown={(e) => { e.stopPropagation(); dragId.current = o.id; }}
          onDoubleClick={() => setOverlays((prev) => prev.filter((x) => x.id !== o.id))}
          style={{
            left: `${o.x * 100}%`,
            top: `${o.y * 100}%`,
            color: o.color,
            fontSize: `${o.size * 4}px`,
            textShadow: o.kind === "text" ? "0 1px 4px rgba(0,0,0,0.7)" : undefined,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 font-bold leading-none cursor-move select-none touch-none"
        >
          {o.value}
        </button>
      ))}

      {/* Crop selection */}
      {activeTool === "crop" && cropRect && cropRect.w > 0.02 && cropRect.h > 0.02 && (
        <div
          className="absolute border-2 border-emerald-400 bg-emerald-400/10 pointer-events-none"
          style={{
            left: `${cropRect.x * 100}%`,
            top: `${cropRect.y * 100}%`,
            width: `${cropRect.w * 100}%`,
            height: `${cropRect.h * 100}%`,
          }}
        />
      )}
    </div>

    {/* Crop actions */}
    {activeTool === "crop" && (
      <div className="flex items-center justify-center gap-3 py-2">
        <span className="text-[11px] text-zinc-400">Drag on the photo to select an area</span>
        <button
          type="button"
          disabled={!cropRect || cropRect.w < 0.02 || cropRect.h < 0.02}
          onClick={async () => {
            if (!selectedImage || !cropRect) return;
            const next = await cropImage(selectedImage, cropRect);
            setSelectedImage(next);
            setCropRect(null);
            setActiveTool(null);
          }}
          className="px-4 py-1.5 rounded-full bg-emerald-500 text-black text-xs font-bold disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          Apply crop
        </button>
      </div>
    )}

    {/* Emoji sticker picker */}
    {activeTool === "emoji" && (
      <div className="flex gap-2 overflow-x-auto py-2 px-1 no-scrollbar">
        {STICKER_EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() =>
              setOverlays((prev) => [
                ...prev,
                { id: `o-${Date.now()}-${Math.random()}`, kind: "emoji", value: e, x: 0.5, y: 0.5, color: "#fff", size: 10 },
              ])
            }
            className="text-2xl p-2 bg-zinc-800 rounded-xl shrink-0"
          >
            {e}
          </button>
        ))}
      </div>
    )}

    {/* Text tool */}
    {activeTool === "text" && (
      <div className="flex flex-col gap-2 py-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={textDraft}
            onChange={(ev) => setTextDraft(ev.target.value)}
            placeholder="Type text..."
            style={{ color: textColor }}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-2 text-sm font-bold focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (!textDraft.trim()) return;
              setOverlays((prev) => [
                ...prev,
                { id: `o-${Date.now()}-${Math.random()}`, kind: "text", value: textDraft.trim(), x: 0.5, y: 0.4, color: textColor, size: 8 },
              ]);
              setTextDraft("");
            }}
            className="px-4 py-2 rounded-full bg-emerald-500 text-black text-xs font-bold"
          >
            Add
          </button>
        </div>
        <div className="flex gap-2 px-1">
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setTextColor(c)}
              style={{ background: c }}
              className={`w-6 h-6 rounded-full border-2 ${textColor === c ? "border-emerald-400 scale-110" : "border-zinc-700"}`}
            />
          ))}
        </div>
        <span className="text-[11px] text-zinc-500 px-1">Drag overlays to move, double-tap to remove.</span>
      </div>
    )}

    {/* Filters Carousel */}
    {showFilters && (
      <div className="flex gap-2 overflow-x-auto py-2 px-1 my-1 no-scrollbar justify-start sm:justify-center">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSelectedFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedFilter === f.id 
                ? 'bg-emerald-500 text-black font-bold scale-105' 
                : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>
    )}

    {/* Bottom Bar */}
    <div className="flex flex-col gap-3 pb-2 z-10">
      <div className="flex items-center bg-zinc-900 border border-zinc-700/80 rounded-full px-4 py-2 gap-2">
        <ImageIcon size={18} className="text-zinc-400" />
        <input
          type="text"
          placeholder="Add a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="bg-transparent text-white text-sm flex-1 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-end px-2">
        <button
          type="button"
          onClick={async () => {
            if (!selectedImage) return;
            const filterCss = filters.find((f) => f.id === selectedFilter)?.css ?? "none";
            const finalImage = await renderPhoto(selectedImage, filterCss, overlays);
            if (currentUserId) {
              const extension = finalImage.startsWith("data:image/png") ? "png" : "jpg";
              const path = `${currentUserId}/${threadId}/image-${Date.now()}.${extension}`;
              const uploaded = await uploadSourceWithProgress(
                STORAGE_BUCKETS.messages,
                path,
                finalImage,
                extension === "png" ? "image/png" : "image/jpeg",
              );
              if (uploaded.error || !uploaded.url) {
                toast.error(uploaded.error ?? "Image upload failed");
                return;
              }
              const sent = await sendToDb({
                media_url: uploaded.url,
                content: caption,
                metadata: {
                  ...(replyTo ? { reply_to: replyTo } : {}),
                  media_bucket: STORAGE_BUCKETS.messages,
                  media_path: path,
                },
                 viewOnce: settings.viewOnce,
                 expiringMedia: settings.viewOnce,
              });
              if (sent.error) {
                toast.error(sent.error);
                return;
              }
              setReplyTo(null);
            } else {
              toast.error("Sign in to send messages.");
            }
            handleClosePreview();
          }}
          className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
        >
          <Send size={20} className="ml-0.5" />
        </button>
      </div>
    </div>
  </div>
)}
{nameDialogOpen && (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-6" onClick={() => setNameDialogOpen(false)}>
    <div className="w-full max-w-xs rounded-2xl border border-zinc-800 bg-zinc-900 p-4" onClick={(e) => e.stopPropagation()}>
      <p className="mb-3 text-sm font-semibold text-white">Change Display Name</p>
      <input
        autoFocus
        value={nameDraft}
        onChange={(e) => setNameDraft(e.target.value)}
        placeholder="Display name"
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none"
      />
      <div className="mt-4 flex justify-end gap-2">
        <button className="rounded-xl px-3 py-2 text-sm text-zinc-400" onClick={() => setNameDialogOpen(false)}>Cancel</button>
        <button
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => {
            const next = nameDraft.trim();
            if (next) { setDisplayName(next); pushSystem(`Display name changed to ${next}`); }
            setNameDialogOpen(false);
          }}
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}
{clearConfirmOpen && (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-6" onClick={() => setClearConfirmOpen(false)}>
    <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <p className="text-base font-semibold text-white">Clear Chat for Everyone?</p>
      <p className="mt-2 text-sm leading-6 text-zinc-400">This will permanently delete all messages in this conversation for both participants.</p>
      <div className="mt-5 flex justify-end gap-2">
        <button className="rounded-xl px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800" onClick={() => setClearConfirmOpen(false)}>Cancel</button>
        <button className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400" onClick={() => void confirmClearForEveryone()}>Clear for Everyone</button>
      </div>
    </div>
  </div>
)}
    <PinDialog
      open={pinMode !== null}
      title={pinMode === "remove" ? "Remove Secret Lock" : "Create chat PIN"}
      description={
        pinMode === "remove"
          ? "Enter the PIN for this chat to remove the lock."
          : "Choose a 4-8 digit PIN. You'll need it to open this chat."
      }
      confirmLabel={pinMode === "remove" ? "Remove" : "Lock chat"}
      error={pinError}
      onCancel={() => { setPinMode(null); setPinError(null); }}
      onSubmit={(pin) => void submitPin(pin)}
    />
    </>

  );
}
