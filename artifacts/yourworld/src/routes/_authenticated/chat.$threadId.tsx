import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft, Phone, Video, MoreVertical, Image as ImageIcon,
  Mic, Send, Smile, Play, Pause, X,
  Pencil, Lock, EyeOff, Clock, Camera, VideoOff, BellOff, UserX, Flag, Shield,
  Trash2, CheckCheck, Check, Crop, Type, Sparkles 
} from "lucide-react";
import {
  PHOTO_FILTERS, TEXT_COLORS, STICKER_EMOJIS, cropImage, renderPhoto,
  type Overlay,
} from "@/components/yw/chat/photo-editor";
import { needsProtectionWarning, PLATFORM_PROTECTION_WARNING_TITLE, PLATFORM_PROTECTION_WARNING_BODY } from "@/lib/chat-compliance";
import { LazyImage } from "@/components/yw/LazyImage";
import { HoldToRevealButton } from "@/components/yw/HoldToRevealButton";
import { ProtectedCanvasImage, ProtectedCanvasText } from "@/components/yw/ProtectedCanvasContent";
import { ChatMessageErrorBoundary } from "@/components/yw/ChatMessageErrorBoundary";
import { compressImageFile } from "@/lib/image-compress";
import { useMyProfile } from "@/lib/profile-data";
import {
  cleanupChatRealtimeChannel,
  useThreadMessages,
  useThreadPeer,
  dmThreadId,
  reportSocialUser,
  resolveMediaUrl,
} from "@/lib/social-data";
import { supabase } from "@/integrations/supabase/client";
import { useThreadPresence } from "@/lib/presence";
import { useCall } from "@/lib/call-store";
import { useMoments } from "@/lib/moment-context";
import { formatChatRelativeTime } from "@/lib/chat-time";
import { useChatNames, saveChatDisplayName } from "@/lib/chat-names";
import { useChatSettings } from "@/lib/chat-settings";
import { hashPin, randomPinSalt } from "@/lib/secret-chats";
import { PinDialog } from "@/components/yw/PinDialog";
import { toast } from "sonner";
import { AUTO_DELETE_OPTIONS, autoDeleteLabel } from "@/lib/auto-delete";
import { historyBackOr } from "@/lib/navigation";
import { useAndroidChatSecureFlag } from "@/lib/native-privacy";
import {
  STORAGE_BUCKETS,
  uploadSourceWithProgress,
  uploadWithProgress,
} from "@/lib/storage-upload";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ChatThreadPage,
  errorComponent: ChatThreadErrorFallback,
});

type Message = {
  id: string;
  text?: string;
  image?: string;
  audio?: string;
  mediaKind?: "image" | "video" | "audio";
  sharedMedia?: SharedMediaPreview;
  sender: "me" | "them";
  system?: boolean;
  captureEventId?: string;
  time: string;
  ts: number;
  local?: boolean;
  read?: boolean;
  viewOnce?: boolean;
  opened?: boolean;
  isMomentReply?: boolean;
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

function isRenderableChatMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<Message>;
  return (
    typeof message.id === "string" &&
    message.id.trim().length > 0 &&
    (message.sender === "me" || message.sender === "them") &&
    typeof message.ts === "number" &&
    Number.isFinite(message.ts)
  );
}

type MomentReplyMoment = {
  id: string;
  kind?: "photo" | "video" | "text";
  media?: unknown;
  archived: boolean;
  expiresAt?: number;
};

type MomentReplyPreview = {
  available: boolean;
  mediaUrl: string | null;
  kind?: "photo" | "video" | "text";
};

function safeMomentMediaUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (!url) return null;
  if (
    /^https?:\/\//i.test(url) ||
    /^blob:/i.test(url) ||
    /^data:(?:image|video)\//i.test(url) ||
    url.startsWith("/storage/v1/object/")
  ) {
    return url;
  }
  return null;
}

function resolveMomentReplyPreview(
  message: Message,
  moments: readonly MomentReplyMoment[],
  now = Date.now(),
): MomentReplyPreview {
  const moment = message.momentId
    ? moments.find((candidate) => candidate.id === message.momentId)
    : undefined;
  const expiresAt = moment?.expiresAt;
  const mediaUrl =
    safeMomentMediaUrl(message.momentMediaUrl) ??
    safeMomentMediaUrl(moment?.media);
  const available = Boolean(
    moment &&
      !moment.archived &&
      typeof expiresAt === "number" &&
      Number.isFinite(expiresAt) &&
      expiresAt > now &&
      mediaUrl,
  );

  return {
    available,
    mediaUrl: available ? mediaUrl : null,
    kind: message.momentKind ?? moment?.kind,
  };
}

function MomentReplyCard({
  message,
  preview,
  onOpen,
}: {
  message: Message;
  preview: MomentReplyPreview;
  onOpen: (message: Message) => void;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const canOpen =
    preview.available &&
    Boolean(preview.mediaUrl) &&
    failedUrl !== preview.mediaUrl;

  return (
    <button
      type="button"
      disabled={!canOpen}
      onClick={(event) => {
        event.stopPropagation();
        if (canOpen) onOpen(message);
      }}
      className={`group mb-2 flex w-full items-center gap-2 rounded-xl border border-white/15 bg-black/20 p-2 text-left focus:outline-none focus:ring-2 focus:ring-white/60 ${
        canOpen
          ? "transition hover:border-white/35 hover:bg-black/30"
          : "cursor-default opacity-80"
      }`}
      aria-label={canOpen ? "Open replied Moment" : "Moment unavailable"}
    >
      <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-zinc-900 text-[9px] text-zinc-400 ring-1 ring-white/15">
        {canOpen && preview.mediaUrl ? (
          preview.kind === "video" ? (
            <video
              src={preview.mediaUrl}
              muted
              playsInline
              preload="none"
              onError={() => setFailedUrl(preview.mediaUrl)}
              className="h-full w-full object-cover"
            />
          ) : (
            <img
              src={preview.mediaUrl}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setFailedUrl(preview.mediaUrl)}
              className="h-full w-full object-cover"
            />
          )
        ) : (
          <span aria-hidden="true">Unavailable</span>
        )}
        {canOpen && (
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">
          Replying to Moment
        </span>
        <span className="mt-0.5 block truncate text-xs font-semibold text-white/90">
          {canOpen ? "Tap to view" : "Moment unavailable"}
        </span>
      </span>
      {canOpen && (
        <span className="text-lg leading-none text-white/60 transition-transform group-hover:translate-x-0.5">
          ›
        </span>
      )}
    </button>
  );
}

function ChatThreadErrorFallback({
  error,
  reset,
}: {
  error: unknown;
  reset: () => void;
}) {
  const navigate = useNavigate();
  console.error("[chat] conversation view failed", error);
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background p-6 text-foreground">
      <section
        aria-labelledby="chat-error-title"
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-xl"
        role="alert"
      >
        <h1 id="chat-error-title" className="text-lg font-semibold">
          Chat couldn’t be opened
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This conversation hit a display problem. Your messages have not been changed.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={reset}
            type="button"
          >
            Try again
          </button>
          <button
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium"
            onClick={() => {
              if (window.history.length > 1) window.history.back();
              else void navigate({ to: "/" });
            }}
            type="button"
          >
            Go back
          </button>
        </div>
      </section>
    </main>
  );
}

function sendCaptureAlertSafely(
  channel: ReturnType<typeof supabase.channel>,
  event: string,
  payload: Record<string, unknown>,
) {
  try {
    void Promise.resolve(channel.send({ type: "broadcast", event, payload })).catch((cause) => {
      console.warn("[chat-capture] broadcast failed", cause);
    });
  } catch (cause) {
    console.warn("[chat-capture] broadcast threw", cause);
  }
}

type SharedMediaPreview = {
  id: string;
  kind: "video" | "reel";
  title: string;
  thumbnailUrl: string | null;
  thumbnailBucket: "reels" | "videos" | "thumbnails";
};

function sharedMediaFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): SharedMediaPreview | undefined {
  const raw = metadata?.shared_media;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const value = raw as Record<string, unknown>;
  if (
    typeof value.id !== "string" ||
    !/^[a-zA-Z0-9-]+$/.test(value.id) ||
    (value.kind !== "video" && value.kind !== "reel")
  ) {
    return undefined;
  }

  const thumbnailUrl =
    typeof value.thumbnail_url === "string" &&
    !/^(?:javascript|data|vbscript):/i.test(value.thumbnail_url.trim())
      ? value.thumbnail_url
      : null;
  const thumbnailBucket =
    value.thumbnail_bucket === "reels" ||
    value.thumbnail_bucket === "videos" ||
    value.thumbnail_bucket === "thumbnails"
      ? value.thumbnail_bucket
      : value.kind === "reel"
        ? "reels"
        : "videos";

  return {
    id: value.id,
    kind: value.kind,
    title:
      typeof value.title === "string" && value.title.trim()
        ? value.title.trim()
        : value.kind === "reel"
          ? "YourWorld Reel"
          : "YourWorld video",
    thumbnailUrl,
    thumbnailBucket,
  };
}

function SharedMediaMessageCard({
  media,
  onOpen,
}: {
  media: SharedMediaPreview;
  onOpen: (media: SharedMediaPreview) => void;
}) {
  const [poster, setPoster] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!media.thumbnailUrl) {
      setPoster(null);
      return () => {
        alive = false;
      };
    }
    void resolveMediaUrl(media.thumbnailUrl, media.thumbnailBucket)
      .then((url) => {
        if (alive) setPoster(url || null);
      })
      .catch(() => {
        if (alive) setPoster(media.thumbnailUrl);
      });
    return () => {
      alive = false;
    };
  }, [media.thumbnailBucket, media.thumbnailUrl]);

  return (
    <button
      type="button"
      data-testid="shared-media-card"
      aria-label={`Play ${media.kind === "reel" ? "Reel" : "video"}: ${media.title}`}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(media);
      }}
      className="group mt-2.5 block w-full max-w-[280px] overflow-hidden rounded-2xl border border-white/10 bg-[#090a0e] text-left shadow-lg transition-transform active:scale-[0.99]"
    >
      <span className="relative block aspect-video w-full overflow-hidden bg-zinc-950">
        {poster ? (
          <img
            src={poster}
            alt=""
            aria-hidden="true"
            onError={() => setPoster(null)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center bg-gradient-to-br from-violet-950/70 via-zinc-950 to-fuchsia-950/40">
            <Play className="h-8 w-8 fill-white/20 text-white/75" />
          </span>
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-white/35 bg-white/15 text-white shadow-xl backdrop-blur-md transition-transform group-hover:scale-105">
            <Play className="ml-0.5 h-4 w-4 fill-current" />
          </span>
        </span>
      </span>
      <span className="block p-3">
        <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-fuchsia-200/75">
          {media.kind === "reel" ? "Reel" : "Video"} · Tap to play
        </span>
        <span className="mt-1 block truncate text-xs font-semibold text-white/95">
          {media.title}
        </span>
      </span>
    </button>
  );
}

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
        <ProtectedCanvasText text={replyPreviewLabel(reply)} maxLines={1} />
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
      aria-pressed={state}
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
  return <NativeChatThreadPage />;
}

function NativeChatThreadPage() {
  const { profile: myProfile } = useMyProfile();
  const { moments } = useMoments();
  const currentUserName = myProfile.display_name || myProfile.username || "YourWorld user";
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
    }).catch((cause) => {
      if (alive) console.warn("[chat-route] could not validate thread route", cause);
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
    markThreadRead,
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
  const [relativeNow, setRelativeNow] = useState(() => Date.now());
  const [revealedProtectedIds, setRevealedProtectedIds] = useState<string[]>([]);
  const lastIncomingScreenshotAtRef = useRef(0);
  const protectedRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captureChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const captureChannelReadyRef = useRef(false);
  const pendingCaptureAlertsRef = useRef<Array<{
    event: "send_system_alert" | "USER_SCREENSHOT_TAKEN" | "USER_SCREEN_RECORDING_ALERT";
    payload: Record<string, unknown>;
  }>>([]);

  const fmtTime = (value: unknown) => {
    const timestamp =
      typeof value === "string" || typeof value === "number"
        ? new Date(value).getTime()
        : Number.NaN;
    if (!Number.isFinite(timestamp)) return "—";
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const messages = useMemo<Message[]>(() => {
    const fromDb: Message[] = (Array.isArray(dbMessages) ? dbMessages : []).flatMap(
      (candidate) => {
        if (!candidate || typeof candidate !== "object") return [];
        const m = candidate;
        const id = typeof m?.id === "string" ? m.id.trim() : "";
        const senderId = typeof m?.sender_id === "string" ? m.sender_id : "";
        const timestamp =
          typeof m?.created_at === "string" ? Date.parse(m.created_at) : Number.NaN;
        if (
          !id ||
          !senderId ||
          !currentUserId ||
          (m?.sender_id !== currentUserId && m?.receiver_id !== currentUserId) ||
          !Number.isFinite(timestamp)
        ) {
          return [];
        }
        const text = typeof m?.content === "string" ? m.content : undefined;
        const metadata =
          m?.metadata && typeof m.metadata === "object" && !Array.isArray(m.metadata)
            ? m.metadata
            : null;
        const previewMetadata =
          metadata?.preview &&
          typeof metadata.preview === "object" &&
          !Array.isArray(metadata.preview)
            ? (metadata.preview as Record<string, unknown>)
            : null;
        const expiresAt =
          typeof m?.expires_at === "string" ? Date.parse(m.expires_at) : Number.NaN;
        return [
          {
            id,
            text,
            image: typeof m?.media_url === "string" ? m.media_url : undefined,
            audio: typeof m?.voice_note_url === "string" ? m.voice_note_url : undefined,
            mediaKind: mediaKindFromMetadata(metadata, m?.media_url, m?.voice_note_url),
            sharedMedia: sharedMediaFromMetadata(metadata),
            sender: m?.sender_id === currentUserId ? "me" : "them",
            system: m?.is_system_message === true || CALL_LOG_PATTERN.test(text ?? ""),
            captureEventId:
              typeof metadata?.capture_event_id === "string"
                ? metadata.capture_event_id
                : undefined,
            time: fmtTime(m?.created_at),
            ts: timestamp,
            read: m?.is_read === true,
            deletingAt:
              m?.auto_delete_mode === "after_view" &&
              m?.is_viewed === true &&
              Number.isFinite(expiresAt)
                ? expiresAt
                : undefined,
            viewOnce: metadata?.view_once === true,
            opened: m?.is_viewed === true,
            isMomentReply:
              metadata?.type === "moment_reply" ||
              typeof m?.moment_id === "string" ||
              typeof m?.moment_media_url === "string",
            momentId:
              typeof m?.moment_id === "string"
                ? m.moment_id
                : typeof metadata?.moment_id === "string"
                  ? metadata.moment_id
                  : undefined,
            momentMediaUrl:
              typeof m?.moment_media_url === "string"
                ? m.moment_media_url
                : typeof metadata?.moment_media_url === "string"
                  ? metadata.moment_media_url
                : typeof previewMetadata?.media_url === "string"
                  ? previewMetadata.media_url
                    : undefined,
            momentCreatedAt:
              typeof m?.moment_created_at === "string"
                ? m.moment_created_at
                : typeof metadata?.moment_created_at === "string"
                  ? metadata.moment_created_at
                  : undefined,
            replyTo: replyPreviewFromMetadata(metadata),
            momentKind:
              previewMetadata?.kind === "photo" ||
              previewMetadata?.kind === "video" ||
              previewMetadata?.kind === "text"
                ? previewMetadata.kind
                : undefined,
          },
        ];
      },
    );
    const persistedCaptureIds = new Set(
      fromDb.map((message) => message.captureEventId).filter((id): id is string => Boolean(id)),
    );
    return [
      ...fromDb,
      ...(Array.isArray(localMessages) ? localMessages : [])
        .filter(isRenderableChatMessage)
        .filter(
          (message) =>
            !message.captureEventId || !persistedCaptureIds.has(message.captureEventId),
        ),
    ]
      .filter(isRenderableChatMessage)
      .filter((m) => !hiddenIds.includes(m.id))
      .sort((a, b) => a.ts - b.ts);
  }, [dbMessages, localMessages, hiddenIds, currentUserId]);

  useEffect(() => {
    const timer = window.setInterval(() => setRelativeNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

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
    if (!message.momentId || !resolveMomentReplyPreview(message, moments).available) {
      toast.error("This Moment is no longer available.");
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
    if (unread.length) {
      void Promise.resolve()
        .then(() => markRead(unread))
        .catch((cause) => {
          console.warn("[social-chat] marking messages read failed", cause);
        });
    }
  }, [dbMessages, currentUserId, markRead]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("yw:chat-thread-opened", { detail: { threadId } }),
    );
    void Promise.resolve()
      .then(() => markThreadRead())
      .catch((cause) => {
        console.warn("[social-chat] marking thread read failed", cause);
      });
  }, [threadId, markThreadRead]);

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
  const { settings, patch, setAutoDeleteSetting } = useChatSettings(peer.peerId, conversationId);
  const [chatProtection, setChatProtection] = useState<{
    threadId: string;
    enabled: boolean;
  } | null>(null);
  const protectChatEnabled =
    chatProtection?.threadId === threadId && chatProtection.enabled;
  useAndroidChatSecureFlag(protectChatEnabled);
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

  const [securityFallbackThreadId, setSecurityFallbackThreadId] = useState<string | null>(null);
  useEffect(() => {
    setSecurityFallbackThreadId(null);
  }, [threadId]);
  const hasSecretLockMaterial =
    typeof settings.secretPinSalt === "string" &&
    settings.secretPinSalt.length > 0 &&
    typeof settings.secretPinHash === "string" &&
    settings.secretPinHash.length > 0;
  const secretLock =
    securityFallbackThreadId !== threadId &&
    settings.secretLock === true &&
    hasSecretLockMaterial;
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
        if (
          typeof pin !== "string" ||
          !pin ||
          typeof salt !== "string" ||
          !salt ||
          typeof hash !== "string" ||
          !hash ||
          (await hashPin(salt, pin)) !== hash
        ) {
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
      if (typeof hash !== "string" || !hash) {
        throw new Error("Chat security verification is unavailable");
      }
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
  const deleteIds = async (ids: string[]) => {
    const localIds = ids.filter((id) => id.startsWith("local-"));
    const persistedIds = ids.filter((id) =>
      dbMessages.some((message) => message.id === id && message.sender_id === currentUserId),
    );
    const allowedIds = [...new Set([...localIds, ...persistedIds])];
    if (allowedIds.length !== ids.length) {
      toast.message("You can only delete messages you sent.");
    }
    if (!allowedIds.length) return;

    setLocalMessages((prev) => prev.filter((m) => !allowedIds.includes(m.id)));
    setHiddenIds((prev) => [...new Set([...prev, ...allowedIds])]);
    setSelectedIds([]);
    if (!persistedIds.length) return;

    const result = await removeFromDb(persistedIds);
    if (result.error) {
      setHiddenIds((prev) => prev.filter((id) => !persistedIds.includes(id)));
      toast.error(`Message deletion failed: ${result.error}`);
    }
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
  const pendingScrollFrameRef = useRef<number | null>(null);
  const scrollToLatest = useCallback(() => {
    if (pendingScrollFrameRef.current !== null) {
      window.cancelAnimationFrame(pendingScrollFrameRef.current);
    }
    pendingScrollFrameRef.current = window.requestAnimationFrame(() => {
      pendingScrollFrameRef.current = null;
      const target = messagesEndRef.current;
      if (!target?.isConnected || typeof target.scrollIntoView !== "function") return;
      try {
        target.scrollIntoView({
          behavior: didFirstScroll.current ? "smooth" : "auto",
          block: "end",
        });
        didFirstScroll.current = true;
      } catch (cause) {
        console.warn("[chat] auto-scroll failed", cause);
      }
    });
  }, []);

  useEffect(
    () => () => {
      if (pendingScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(pendingScrollFrameRef.current);
        pendingScrollFrameRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    // Older pages prepend above — keep the reader anchored instead of jumping down.
    if (keepScrollRef.current !== null) {
      const container = scrollRef.current;
      const previousHeight = keepScrollRef.current;
      keepScrollRef.current = null;
      if (container?.isConnected) {
        container.scrollTop = container.scrollHeight - previousHeight;
      }
      return;
    }
    const newest = messages[messages.length - 1];
    const nextKey = newest ? `${newest.id}:${newest.ts}` : null;
    const isInitialLoad = lastMessageKeyRef.current === null && nextKey !== null;
    const isNewMessage = nextKey !== null && nextKey !== lastMessageKeyRef.current;
    lastMessageKeyRef.current = nextKey;
    if (isInitialLoad || isNewMessage) scrollToLatest();
  }, [messages, scrollToLatest]);

  const onScrollMessages = () => {
    const el = scrollRef.current;
    if (!el?.isConnected || el.scrollTop > 80 || loadingMore || !hasMore) return;
    keepScrollRef.current = el.scrollHeight;
    void loadOlder();
  };


  const captureChannelName = conversationId ? `social-chat-capture-${conversationId}` : null;

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
          ? `📸 ${actorName} attempted to take a screenshot`
          : `📹 ${actorName} attempted to take a screen recording`;
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
    if (!captureChannelName || !currentUserId || (!screenshotAlert && !recordingAlert)) return;
    let alive = true;
    let retry: number | null = null;
    let retryCount = 0;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const scheduleRetry = () => {
      if (!alive || retry !== null) return;
      const delay = Math.min(15_000, 1000 * 2 ** Math.min(retryCount, 4));
      retryCount += 1;
      retry = window.setTimeout(() => {
        retry = null;
        subscribe();
      }, delay);
    };
    const receive = (
      nextChannel: ReturnType<typeof supabase.channel>,
      payload: unknown,
      kind: "screenshot" | "recording",
    ) => {
      if (!alive || channel !== nextChannel) return;
      try {
        const value =
          payload && typeof payload === "object"
            ? (payload as Record<string, unknown>)
            : {};
        handleIncomingCaptureAlert(value, kind);
      } catch (cause) {
        console.warn("[chat-capture] incoming alert handler failed", cause);
      }
    };
    const subscribe = () => {
      if (!alive) return;
      try {
        const nextChannel = supabase
          .channel(captureChannelName)
          .on("broadcast", { event: "send_system_alert" }, ({ payload }) => {
            const value =
              payload && typeof payload === "object"
                ? (payload as Record<string, unknown>)
                : {};
            receive(
              nextChannel,
              value,
              value.kind === "recording" ? "recording" : "screenshot",
            );
          })
          .on("broadcast", { event: "USER_SCREENSHOT_TAKEN" }, ({ payload }) => {
            receive(nextChannel, payload, "screenshot");
          })
          .on("broadcast", { event: "USER_SCREEN_RECORDING_ALERT" }, ({ payload }) => {
            receive(nextChannel, payload, "recording");
          });
        channel = nextChannel;
        captureChannelRef.current = nextChannel;
        nextChannel.subscribe((status) => {
          if (!alive || channel !== nextChannel) return;
          try {
            if (status === "SUBSCRIBED") {
              retryCount = 0;
              captureChannelReadyRef.current = true;
              const pending = pendingCaptureAlertsRef.current.splice(0);
              pending.forEach(({ event, payload }) => {
                sendCaptureAlertSafely(nextChannel, event, payload);
              });
              return;
            }
            if (!["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) return;
            captureChannelReadyRef.current = false;
            channel = null;
            if (captureChannelRef.current === nextChannel) captureChannelRef.current = null;
            cleanupChatRealtimeChannel(nextChannel, "capture-alert reconnect");
            scheduleRetry();
          } catch (cause) {
            console.warn("[chat-capture] realtime status handler failed", cause);
            captureChannelReadyRef.current = false;
            channel = null;
            if (captureChannelRef.current === nextChannel) captureChannelRef.current = null;
            cleanupChatRealtimeChannel(nextChannel, "capture-alert status failure");
            scheduleRetry();
          }
        });
      } catch (cause) {
        console.warn("[chat-capture] realtime setup failed", cause);
        const failed = channel;
        channel = null;
        captureChannelReadyRef.current = false;
        captureChannelRef.current = null;
        if (failed) cleanupChatRealtimeChannel(failed, "capture-alert setup failure");
        scheduleRetry();
      }
    };
    subscribe();
    return () => {
      alive = false;
      if (retry !== null) window.clearTimeout(retry);
      captureChannelReadyRef.current = false;
      if (captureChannelRef.current === channel) captureChannelRef.current = null;
      pendingCaptureAlertsRef.current = [];
      if (channel) cleanupChatRealtimeChannel(channel, "capture-alert cleanup");
      channel = null;
    };
  }, [captureChannelName, currentUserId, handleIncomingCaptureAlert, recordingAlert, screenshotAlert]);

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
    try {
      // Compress on-device first so sending/uploading is near-instant.
      const compressed = await compressImageFile(file, { maxDim: 1600, quality: 0.82 });
      setCaption("");
      setSelectedFilter("normal");
      setShowFilters(false);
      setSelectedImage(compressed);
    } catch (cause) {
      console.error("[chat-media] image compression failed", cause);
      toast.error("Couldn't prepare that image. Please try another.");
    }
  };

  const startRecording = async () => {
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const activeStream = stream;
      const recorder = new MediaRecorder(activeStream);
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        mediaRecorderRef.current = null;
        activeStream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        void (async () => {
          try {
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
          } catch (cause) {
            console.error("[chat-media] voice note send failed", cause);
            toast.error("Couldn't send that voice note. Please try again.");
          }
        })();
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      stream?.getTracks().forEach((track) => track.stop());
      console.error("Microphone error", err);
      toast.error("Couldn't start voice recording. Check microphone permission and try again.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (cause) {
        console.warn("[chat-media] stopping voice recording failed", cause);
      } finally {
        setIsRecording(false);
      }
    }
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex h-[100dvh] flex-col justify-between overflow-hidden bg-black font-sans text-white">
      {secretLock && !chatUnlocked ? (
        <div className="absolute inset-0 z-[95] grid place-items-center bg-black px-6">
          <form
            className="w-full max-w-xs space-y-4 text-center"
            onSubmit={(e) => {
              e.preventDefault();
              void (async () => {
                try {
                  const salt = settings?.secretPinSalt;
                  const hash = settings?.secretPinHash;
                  const pin = unlockPin;
                  if (
                    typeof salt !== "string" ||
                    !salt ||
                    typeof hash !== "string" ||
                    !hash
                  ) {
                    setSecurityFallbackThreadId(threadId);
                    setUnlockError(null);
                    setUnlockPin("");
                    return;
                  }
                  if (typeof pin !== "string" || !pin) {
                    setUnlockError("Incorrect PIN");
                    setUnlockPin("");
                    return;
                  }

                  const candidateHash = await hashPin(salt, pin);
                  if (typeof candidateHash !== "string" || !candidateHash) {
                    setSecurityFallbackThreadId(threadId);
                    setUnlockError(null);
                    setUnlockPin("");
                    return;
                  }
                  if (candidateHash !== hash) {
                    setUnlockError("Incorrect PIN");
                    setUnlockPin("");
                    return;
                  }

                  setUnlockError(null);
                  setChatUnlocked(true);
                  setUnlockPin("");
                } catch (cause) {
                  console.error("[secret-lock] unlock verification failed", cause);
                  setSecurityFallbackThreadId(threadId);
                  setUnlockError(null);
                  setUnlockPin("");
                }
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

          </form>
        </div>
      ) : null}
      
      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageSelect} />
      <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />

      {/* TOP HEADER */}
      <div
        className="chat-header sticky top-0 z-50 flex min-w-0 shrink-0 items-center gap-2 border-b border-zinc-800/80 bg-zinc-950 px-3 pb-3 pt-[calc(env(safe-area-inset-top,24px)_+_0.75rem)]"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            onClick={() => historyBackOr(() => void navigate({ to: "/chat" }))}
            aria-label="Back to Chat"
            className="grid h-9 w-8 shrink-0 place-items-center rounded-full text-zinc-300 hover:text-white"
          >
            <ArrowLeft size={22} />
          </button>
          
          <div
            className="relative h-10 w-10 shrink-0 cursor-pointer"
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

          <div className="flex min-w-0 flex-1 flex-col">
            <span
              className="flex min-w-0 items-center gap-1 text-sm font-bold leading-tight text-white cursor-pointer"
              onPointerDown={openPeerProfile.preload}
              onClick={openPeerProfile.go}
            >
              <span className="min-w-0 truncate">{displayName}</span>
              {secretLock && <Lock size={12} className="shrink-0 text-purple-400" />}
              {muted && <BellOff size={12} className="shrink-0 text-zinc-500" />}
            </span>
            <span className="whitespace-nowrap text-[11px] font-medium">
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

        <div className="flex shrink-0 items-center gap-1 text-zinc-300">
          <button
            onClick={() =>
              void startCall({
                threadId,
                peerId: peer.peerId ?? undefined,
                peerName: displayName,
                avatarUrl: peer.avatarUrl ?? null,
                mode: "audio",
              }).catch((cause) => {
                console.error("[social-chat] voice call start failed", cause);
                toast.error("Couldn't start the call. Please try again.");
              })
            }
            aria-label="Voice call"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-white/10 hover:text-white"
          >
            <Phone size={20} />
          </button>
          <button
            onClick={() =>
              void startCall({
                threadId,
                peerId: peer.peerId ?? undefined,
                peerName: displayName,
                avatarUrl: peer.avatarUrl ?? null,
                mode: "video",
              }).catch((cause) => {
                console.error("[social-chat] video call start failed", cause);
                toast.error("Couldn't start the call. Please try again.");
              })
            }
            aria-label="Video call"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-white/10 hover:text-white"
          >
            <Video size={20} />
          </button>
          <button
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            aria-label="Chat options"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-white/10 hover:text-white"
          >
            <MoreVertical size={20} />
          </button>
        </div>

        {/* 3-DOTS OPTIONS DROPDOWN WITH ALL 9 EXACT OPTIONS */}
        {showOptionsMenu && (
          <>
            <div className="fixed inset-0 z-[75]" onClick={() => setShowOptionsMenu(false)} />
            <div className="absolute right-3 top-full z-[80] mt-2 max-h-[calc(100dvh_-_env(safe-area-inset-top,24px)_-_1rem)] w-64 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/95 p-2 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
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
              <MenuItem
                icon={<Shield size={16} className="text-zinc-400" />}
                label="Protect Chat (Block Screenshots & Recording)"
                state={protectChatEnabled}
                onClick={() => {
                  setChatProtection((current) => ({
                    threadId,
                    enabled: !(current?.threadId === threadId && current.enabled),
                  }));
                  setShowOptionsMenu(false);
                }}
              />
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
        {messages.map((m) => (
          <ChatMessageErrorBoundary key={`${threadId}:${m.id}`}>
          {m.system ? (
          <p className="mx-auto flex w-fit items-center gap-2 rounded-full bg-zinc-800/70 px-3 py-1 text-center text-[11px] text-zinc-400">
            <span>{m.text}</span>
            <time dateTime={new Date(m.ts).toISOString()} className="text-[10px] text-zinc-500">
              {formatChatRelativeTime(m.ts, relativeNow)}
            </time>
          </p>
        ) : (
          <div
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
            {(m.text || m.isMomentReply || m.momentId) && (
              <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                m.sender === "me" ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-xs" : "bg-zinc-800/90 text-zinc-100 rounded-bl-xs border border-zinc-700/50"
              }`}>
                {m.replyTo && <ReplyQuote reply={m.replyTo} className="mb-2 rounded-lg" />}
                {m.isMomentReply || m.momentId ? (
                  <MomentReplyCard
                    message={m}
                    preview={resolveMomentReplyPreview(m, moments)}
                    onOpen={openMomentReply}
                  />
                ) : null}
                {m.text ? <ProtectedCanvasText text={m.text} /> : null}
                {m.sharedMedia ? (
                  <SharedMediaMessageCard
                    media={m.sharedMedia}
                    onOpen={(shared) => {
                      if (shared.kind === "reel") {
                        void navigate({ to: "/reels", search: { reelId: shared.id } });
                      } else {
                        void navigate({
                          to: "/video/$videoId",
                          params: { videoId: shared.id },
                        });
                      }
                    }}
                  />
                ) : null}
              </div>
            )}

            {!m.text && m.replyTo && <ReplyQuote reply={m.replyTo} className="mb-1 w-[75%] rounded-lg bg-zinc-800/90" />}

            {m.image && m.viewOnce && m.sender === "them" && !m.opened && !openedOnce.includes(m.id) ? (
              <HoldToRevealButton
                disabled={openingViewOnceId === m.id}
                onReveal={() => void openViewOnce(m)}
                ariaLabel="Press and hold to view this photo once"
                className="max-w-[75%] flex items-center gap-2 rounded-2xl border border-emerald-600/60 bg-emerald-950/30 px-4 py-3 text-xs font-bold text-emerald-400"
              >
                <span className="w-5 h-5 rounded-full border border-emerald-500 flex items-center justify-center">1</span>
                {openingViewOnceId === m.id ? "Opening…" : "Hold to view once"}
              </HoldToRevealButton>
            ) : m.image &&
              !m.momentId &&
              !m.isMomentReply &&
              !(m.viewOnce && (m.opened || openedOnce.includes(m.id))) ? (
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
              <HoldToRevealButton
                disabled={openingViewOnceId === m.id}
                onReveal={() => void openViewOnce(m)}
                ariaLabel="Press and hold to listen to this voice note once"
                className="max-w-[75%] flex items-center gap-2 rounded-2xl border border-emerald-600/60 bg-emerald-950/30 px-4 py-3 text-xs font-bold text-emerald-400 disabled:opacity-60"
              >
                <span className="w-5 h-5 rounded-full border border-emerald-500 flex items-center justify-center">1</span>
                {openingViewOnceId === m.id ? "Preparing voice note…" : "Hold to listen once"}
              </HoldToRevealButton>
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
              {formatChatRelativeTime(m.ts, relativeNow)}
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
          )}
          </ChatMessageErrorBoundary>
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
        <ProtectedCanvasImage
          src={viewOnceOpen.url}
          alt="View once"
          className="max-h-full max-w-full object-contain rounded-lg"
          onLoad={() => {
            void purgeViewedMedia(viewOnceOpen.id).then((cleanup) => {
              if (cleanup.error) {
                toast.error("Media opened, but secure cleanup is retrying.");
              }
            });
          }}
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
