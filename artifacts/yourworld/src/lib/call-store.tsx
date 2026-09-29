import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Bell, Mic, MicOff, PhoneOff, Phone, Video, VideoOff, SwitchCamera, Zap, ZapOff, Volume2, X, LockKeyhole, Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { dmThreadId, ensureThreadConversation } from "@/lib/social-data";
import { isSecretChatLockedWith } from "@/lib/secret-chats";
import { isActiveChatFocusedForCall } from "@/lib/active-chat";
import { toast } from "sonner";
import {
  enableCallNotifications,
  hasSeenCallNotificationBanner,
  markCallNotificationBannerSeen,
  readCallNotificationAction,
  registerCallServiceWorker,
  getExistingCallPushSubscription,
  serializeCallPushSubscription,
  showIncomingCallNotification,
  dismissIncomingCallNotification,
  type CallNotificationAction,
} from "@/lib/call-notifications";
import {
  addAndroidCallPushActionListener,
  consumeAndroidCallPushAction,
  dismissAndroidCallNotification,
  getAndroidCallPushStatus,
  getAndroidCallPushToken,
  isAndroidCallPushAvailable,
  registerAndroidCallPush,
} from "@/lib/call-push-native";
import {
  CALL_ICE_SERVERS,
  getCallMedia,
  getCallVideo,
  isCallMediaPermissionError,
  prioritizeCallAudioSender,
  tuneCallVideoSender,
} from "@/lib/webrtc-media";
import { CallPermissionDialog } from "@/components/yw/CallPermissionDialog";
import {
  setCallAudioRouting,
  startCallAudioRouting,
  stopCallAudioRouting,
  type CallAudioRoute,
} from "@/lib/call-audio-routing";
import {
  getAdaptivePerformanceSnapshot,
  useAdaptivePerformance,
} from "@/lib/adaptive-performance";
import {
  CALL_VIDEO_EFFECTS,
  createCallVideoEffect,
  type CallVideoEffect,
  type CallVideoEffectPipeline,
} from "@/lib/call-effects";

/**
 * The deployed calls/user_blocks schema is newer than generated Supabase types.
 * Keep that compatibility boundary local rather than modifying generated code.
 */
const callDb = supabase as unknown as {
  // Generated types lag the verified live schema; keep the escape hatch here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
   from: (table: "calls" | "messages" | "user_blocks" | "call_push_subscriptions") => any;
};

async function syncAndroidCallPushToken(userId: string, token: string) {
  const { data, error } = await supabase.auth.getSession();
  if (error || data.session?.user.id !== userId) return;

  const response = await fetch("/api/calls/push/register", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) {
    console.debug("[call-notifications] Android subscription sync pending");
  }
}

export type CallMode = "audio" | "video";
type Phase = "idle" | "outgoing" | "incoming" | "connecting" | "active" | "ended";
type CallOutcome = "answered" | "missed" | "declined";

/** `calls` deliberately is not in the generated client types yet. */
type CallRow = {
  id: string;
  caller_id: string;
  receiver_id: string;
  call_type: CallMode;
  status: string;
  signal_data: unknown;
  created_at: string;
  ended_at: string | null;
};

type StoredSignal = {
  sender_id?: string;
  payload?: Record<string, unknown>;
  at?: string;
  candidates?: RTCIceCandidateInit[];
  caller_candidates?: RTCIceCandidateInit[];
  receiver_candidates?: RTCIceCandidateInit[];
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
};
type BlockRow = { blocker_id: string; blocked_id: string };

function asSessionDescription(value: unknown): RTCSessionDescriptionInit | null {
  if (!value || typeof value !== "object") return null;
  const description = value as { type?: unknown; sdp?: unknown };
  if (
    (description.type !== "offer" && description.type !== "answer" &&
      description.type !== "pranswer" && description.type !== "rollback") ||
    (description.sdp !== undefined && typeof description.sdp !== "string")
  ) return null;
  return { type: description.type, sdp: description.sdp };
}

function asIceCandidate(value: unknown): RTCIceCandidateInit | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { candidate?: unknown; sdpMid?: unknown; sdpMLineIndex?: unknown; usernameFragment?: unknown };
  if (
    typeof candidate.candidate !== "string" ||
    (candidate.sdpMid !== undefined && candidate.sdpMid !== null && typeof candidate.sdpMid !== "string") ||
    (candidate.sdpMLineIndex !== undefined && candidate.sdpMLineIndex !== null && typeof candidate.sdpMLineIndex !== "number") ||
    (candidate.usernameFragment !== undefined && typeof candidate.usernameFragment !== "string")
  ) return null;
  return candidate as RTCIceCandidateInit;
}

function optimizeCallSdp(sdp: string) {
  const maxVideoKbps = Math.max(
    300,
    Math.round(getAdaptivePerformanceSnapshot().videoBitrate / 1_000),
  );
  const startVideoKbps = Math.max(200, Math.round(maxVideoKbps * 0.65));
  const minVideoKbps = Math.max(100, Math.round(maxVideoKbps * 0.4));
  const lines = sdp.split("\r\n");
  const qualityPayloads = new Set<string>();
  const opusPayloads = new Set<string>();
  const opusFmtpPayloads = new Set<string>();
  let mediaSection: "audio" | "video" | null = null;
  for (const line of lines) {
    if (line.startsWith("m=audio ")) mediaSection = "audio";
    else if (line.startsWith("m=video ")) mediaSection = "video";
    else if (line.startsWith("m=")) mediaSection = null;
    if (mediaSection !== "audio") continue;
    const rtpmap = /^a=rtpmap:(\d+)\s+([^/]+)\//i.exec(line);
    if (rtpmap && /^opus$/i.test(rtpmap[2])) opusPayloads.add(rtpmap[1]);
    const fmtp = /^a=fmtp:(\d+)\s+/.exec(line);
    if (fmtp && opusPayloads.has(fmtp[1])) opusFmtpPayloads.add(fmtp[1]);
  }

  let inVideoSection = false;
  let hasVideoBitrate = false;
  const output: string[] = [];
  for (const line of lines) {
    if (line.startsWith("m=")) inVideoSection = line.startsWith("m=video ");
    if (line.startsWith("m=audio ") && opusPayloads.size) {
      const parts = line.trim().split(/\s+/);
      const header = parts.slice(0, 3);
      const payloads = parts.slice(3);
      const orderedPayloads = [
        ...payloads.filter((payload) => opusPayloads.has(payload)),
        ...payloads.filter((payload) => !opusPayloads.has(payload)),
      ];
      output.push([...header, ...orderedPayloads].join(" "));
      continue;
    }
    if (inVideoSection && line.startsWith("m=video ")) {
      output.push(line);
      output.push(`b=AS:${maxVideoKbps}`);
      hasVideoBitrate = true;
      continue;
    }
    if (inVideoSection && line.startsWith("a=rtpmap:")) {
      const match = /^a=rtpmap:(\d+)\s+([^/]+)\//i.exec(line);
      if (match && /^(VP8|VP9|H264)$/i.test(match[2])) {
        qualityPayloads.add(match[1]);
      }
    }
    if (inVideoSection && line.startsWith("b=")) {
      if (line.startsWith("b=AS:")) {
        if (!hasVideoBitrate) output.push(`b=AS:${maxVideoKbps}`);
        hasVideoBitrate = true;
      } else {
        output.push(line);
      }
      continue;
    }
    if (inVideoSection && line.startsWith("a=fmtp:")) {
      const match = /^a=fmtp:(\d+)\s*(.*)$/.exec(line);
      if (match && qualityPayloads.has(match[1])) {
        const params = match[2];
        if (!params.includes("x-google-max-bitrate")) {
          output.push(
            `${line};x-google-start-bitrate=${startVideoKbps};x-google-min-bitrate=${minVideoKbps};x-google-max-bitrate=${maxVideoKbps}`,
          );
          continue;
        }
      }
    }
    if (!inVideoSection && opusPayloads.has((/^a=fmtp:(\d+)\s*/.exec(line) ?? [])[1] ?? "")) {
      const match = /^a=fmtp:(\d+)\s*(.*)$/.exec(line);
      if (match) {
        const params = match[2]
          .split(";")
          .map((param) => param.trim())
          .filter((param) => param && !/^minptime=/i.test(param) && !/^useinbandfec=/i.test(param));
        output.push(`a=fmtp:${match[1]} ${[...params, "minptime=10", "useinbandfec=1"].join(";")}`);
        continue;
      }
    }
    if (
      !inVideoSection &&
      line.startsWith("a=rtpmap:") &&
      opusPayloads.has((/^a=rtpmap:(\d+)\s+/.exec(line) ?? [])[1] ?? "")
    ) {
      const payload = (/^a=rtpmap:(\d+)\s+/.exec(line) ?? [])[1];
      output.push(line);
      if (!opusFmtpPayloads.has(payload)) {
        output.push(`a=fmtp:${payload} minptime=10;useinbandfec=1`);
      }
      continue;
    }
    output.push(line);
  }
  return output.join("\r\n");
}

function optimizedSessionDescription(
  description: RTCSessionDescriptionInit,
): RTCSessionDescriptionInit {
  return description.sdp
    ? { ...description, sdp: optimizeCallSdp(description.sdp) }
    : description;
}

type CallState = {
  callId: string;
  mode: CallMode;
  peerId: string;
  peerName: string;
  avatarUrl?: string | null;
  incoming: boolean;
  /** Social chat thread the call was started from (when known). */
  threadId?: string | null;
};

type Ctx = {
  startCall: (opts: {
    threadId?: string;
    peerId?: string;
    peerName?: string;
    avatarUrl?: string | null;
    mode: CallMode;
  }) => Promise<void>;
  /** The authenticated Supabase user id. Signed-out visitors cannot call. */
  myCallId: string | null;
  isGuest: boolean;
  clearCallHistory: (peerId: string) => void;
};

type CallPermissionRetry =
  | { kind: "outgoing"; options: Parameters<Ctx["startCall"]>[0] }
  | { kind: "incoming"; callId: string };

const CallCtx = createContext<Ctx>({
  startCall: async () => {},
  myCallId: null,
  isGuest: true,
  clearCallHistory: () => {},
});
export const useCall = () => useContext(CallCtx);

/** Builds a looping set of notes as a WAV data URL for the call audio pipeline. */
type RingToneNote = {
  start: number;
  duration: number;
  frequencies: number[];
};

function buildRingToneUrl(notes: RingToneNote[], cycleSec: number): string {
  const rate = 22050;
  const total = Math.floor(rate * cycleSec);
  const bytes = 44 + total * 2;
  const buf = new ArrayBuffer(bytes);
  const view = new DataView(buf);
  const str = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  str(0, "RIFF"); view.setUint32(4, bytes - 8, true); str(8, "WAVEfmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  str(36, "data"); view.setUint32(40, total * 2, true);
  for (let i = 0; i < total; i++) {
    const t = i / rate;
    let v = 0;
    const note = notes.find((item) => t >= item.start && t < item.start + item.duration);
    if (note) {
      const noteTime = t - note.start;
      for (let index = 0; index < note.frequencies.length; index++) {
        const frequency = note.frequencies[index];
        const harmonicGain = index === 0 ? 0.78 : index === 1 ? 0.18 : 0.04;
        v += Math.sin(2 * Math.PI * frequency * noteTime) * harmonicGain;
      }
      v /= Math.max(1, note.frequencies.length);
      const fade = Math.min(1, noteTime / 0.012, (note.duration - noteTime) / 0.04);
      v *= Math.max(0, fade) * 0.72;
    }
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 32767, true);
  }
  let bin = "";
  const u8 = new Uint8Array(buf);
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return `data:audio/wav;base64,${btoa(bin)}`;
}

let incomingUrl: string | null = null;
let ringbackUrl: string | null = null;
const activeRingtones = new Set<HTMLAudioElement>();
const INCOMING_MELODY = [784, 988, 1175, 988, 880, 988, 784, 880];
const INCOMING_RESPONSE = [659, 784, 988, 784, 698, 784, 659, 587];

function buildIncomingRingtoneUrl() {
  const noteDuration = 0.23;
  const noteStep = 0.29;
  const notes: RingToneNote[] = [
    ...INCOMING_MELODY.map((frequency, index) => ({
      start: index * noteStep,
      duration: noteDuration,
      frequencies: [frequency, frequency * 2],
    })),
    ...INCOMING_RESPONSE.map((frequency, index) => ({
      start: 2.85 + index * noteStep,
      duration: noteDuration,
      frequencies: [frequency, frequency * 2],
    })),
  ];
  return buildRingToneUrl(notes, 6.4);
}

function stopAllRingtones() {
  for (const audio of activeRingtones) {
    audio.pause();
    audio.currentTime = 0;
    audio.src = "";
    activeRingtones.delete(audio);
  }
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try { navigator.vibrate(0); } catch { /* ignore */ }
  }
}

/** HTML5 <audio> alert: a melodic incoming ringtone or a standard line ringback. */
function useRingtone(kind: "incoming" | "ringback" | null) {
  useEffect(() => {
    if (!kind || typeof window === "undefined") return;
    let audio: HTMLAudioElement | null = null;
    try {
      if (kind === "incoming") {
        incomingUrl ??= buildIncomingRingtoneUrl();
      } else {
        ringbackUrl ??= buildRingToneUrl(
          [{ start: 0, duration: 2, frequencies: [440, 480] }],
          6,
        );
      }
      audio = new Audio(kind === "incoming" ? incomingUrl! : ringbackUrl!);
      activeRingtones.add(audio);
      audio.loop = true;
      audio.volume = kind === "incoming" ? 1 : 0.6;
      void audio.play().catch(() => {});
    } catch {
      /* audio blocked — UI still shows the call */
    }
    if (kind === "incoming" && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200, 100, 400]);
      } catch { /* ignore */ }
    }
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.src = "";
        activeRingtones.delete(audio);
      }
      if (navigator.vibrate) {
        try { navigator.vibrate(0); } catch { /* ignore */ }
      }
    };
  }, [kind]);
}

export function CallProvider({ children }: { children: ReactNode }) {
  const [authId, setAuthId] = useState<string | null>(null);
  const me = authId;
  const isGuest = !authId;
  const [call, setCall] = useState<CallState | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [remoteVideoReady, setRemoteVideoReady] = useState(false);
  const [callPermissionMode, setCallPermissionMode] = useState<CallMode | null>(null);
  const [retryingCallPermission, setRetryingCallPermission] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [flashOn, setFlashOn] = useState(false);
  /** WhatsApp-style: tap the PiP to swap which stream fills the screen. */
  const [swapped, setSwapped] = useState(false);
  const [peerAvatar, setPeerAvatar] = useState<string | null>(null);
  /** Auto-hiding call controls: visible on activity, hidden after 3s. */
  const [controlsVisible, setControlsVisible] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [localTileOffset, setLocalTileOffset] = useState({ x: 0, y: 0 });
  const [networkState, setNetworkState] = useState<"stable" | "reconnecting">("stable");
  const [videoEffect, setVideoEffect] = useState<CallVideoEffect>("none");
  const hideTimer = useRef<number | null>(null);
  // Cancels a call that is never answered so neither side rings forever.
  const ringTimer = useRef<number | null>(null);
  const pendingCallPermissionRetry = useRef<CallPermissionRetry | null>(null);



  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const sigRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingLocalIce = useRef<RTCIceCandidateInit[]>([]);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const fallbackSignals = useRef<Record<string, StoredSignal>>({});
  const receiveSignalRef = useRef<((payload: Record<string, unknown>) => Promise<void>) | null>(null);
  const signalQueueRef = useRef(Promise.resolve());
  const localVideo = useRef<HTMLVideoElement | null>(null);
  const localTileDrag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const suppressLocalTileClick = useRef(false);
  const remoteVideo = useRef<HTMLVideoElement | null>(null);
  const remoteAudio = useRef<HTMLAudioElement | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const routedCallId = useRef<string | null>(null);
  const cameraSourceTrack = useRef<MediaStreamTrack | null>(null);
  const videoEffectPipeline = useRef<CallVideoEffectPipeline | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const reconnectAttempt = useRef(0);
  const callRef = useRef<CallState | null>(null);
  const meRef = useRef<string | null>(null);
  const isGuestRef = useRef(true);
  /** Call ids we've already reacted to (broadcast + database ring paths). */
  const seenCalls = useRef<Set<string>>(new Set());
  const signalCallIdRef = useRef<string | null>(null);
  const signalReadyRef = useRef<Promise<void> | null>(null);
  const openSignalChannelRef = useRef<((callId: string, mode: CallMode, isCaller: boolean) => Promise<void>) | null>(null);
  /** Remember handled call ids without growing the set forever. */
  const markSeen = useCallback((id: string) => {
    const set = seenCalls.current;
    set.add(id);
    if (set.size > 200) {
      for (const k of Array.from(set).slice(0, set.size - 200)) set.delete(k);
    }
  }, []);
  /** Set when the peer connection reaches "connected" — used for call duration. */
  const connectedAt = useRef<number | null>(null);
  /** Ensures the call-log chat message is written exactly once per call. */
  const loggedCall = useRef<string | null>(null);
  /** Prevent an already-active call from recreating a log after its chat was cleared. */
  const clearedCallPeers = useRef<Set<string>>(new Set());
  const logCallOutcomeRef = useRef<((outcome: CallOutcome) => Promise<void>) | null>(null);
  const pendingNotificationAction = useRef<CallNotificationAction | null>(null);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const adaptivePerformance = useAdaptivePerformance();


  useRingtone(
    phase === "incoming" ? "incoming" : phase === "outgoing" ? "ringback" : null,
  );

  useEffect(() => {
    void registerCallServiceWorker();
  }, []);

  useEffect(() => {
    if (!me || typeof window === "undefined" || hasSeenCallNotificationBanner()) return;
    if (isAndroidCallPushAvailable()) {
      void getAndroidCallPushStatus()
        .then((status) => {
          if (
            status &&
            (status.permission !== "granted" || !status.fullScreenIntentAllowed)
          ) {
            setShowNotificationBanner(true);
          }
        })
        .catch(() => setShowNotificationBanner(true));
      return;
    }
    if ("Notification" in window && Notification.permission === "default") {
      setShowNotificationBanner(true);
    }
  }, [me]);

  const activeCallId = call?.callId;
  const activeCallMode = call?.mode;
  useEffect(() => {
    if (!activeCallId || !activeCallMode || phase === "idle") {
      routedCallId.current = null;
      return;
    }
    if (phase === "incoming" || routedCallId.current === activeCallId) return;
    routedCallId.current = activeCallId;

    const initialRoute: CallAudioRoute = activeCallMode === "audio" ? "earpiece" : "speaker";
    setSpeakerOn(initialRoute === "speaker");
    void startCallAudioRouting(initialRoute, [remoteAudio.current, remoteVideo.current]);
  }, [activeCallId, activeCallMode, phase]);
  useEffect(() => {
    const peer = pcRef.current;
    if (!peer || !activeCallId || phase === "idle") return;
    for (const sender of peer.getSenders()) {
      if (sender.track?.kind === "video") {
        void tuneCallVideoSender(sender);
      } else if (sender.track?.kind === "audio") {
        void prioritizeCallAudioSender(sender);
      }
    }
  }, [
    adaptivePerformance.networkQuality,
    adaptivePerformance.videoBitrate,
    adaptivePerformance.videoFrameRate,
    adaptivePerformance.videoScaleResolutionDownBy,
    activeCallId,
    phase,
  ]);

  useEffect(() => {
    const fromUrl = readCallNotificationAction();
    if (fromUrl) pendingNotificationAction.current = fromUrl;

    const onMessage = (event: MessageEvent<CallNotificationAction & { type?: string }>) => {
      if (event.data?.type !== "call-notification-click" || !event.data.callId) return;
      pendingNotificationAction.current = event.data;
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);
    let disposed = false;
    let removeNativeListener: (() => void) | null = null;
    const onNativeAction = (action: CallNotificationAction) => {
      if (
        !action?.callId ||
        (action.action !== "accept" && action.action !== "decline") ||
        (action.mode !== "audio" && action.mode !== "video") ||
        typeof action.peerName !== "string"
      ) {
        return;
      }
      pendingNotificationAction.current = action;
      void consumeAndroidCallPushAction();
    };
    void addAndroidCallPushActionListener(onNativeAction).then((listener) => {
      if (!listener) return;
      if (disposed) {
        void listener.remove();
      } else {
        removeNativeListener = () => void listener.remove();
      }
    });
    void consumeAndroidCallPushAction().then((action) => {
      if (action) onNativeAction(action);
    });
    return () => {
      disposed = true;
      removeNativeListener?.();
      navigator.serviceWorker?.removeEventListener("message", onMessage);
    };
  }, []);

  useEffect(() => {
    const incomingCall = call && phase === "incoming" ? call : null;
    if (!incomingCall) return;

    const syncIncomingNotification = () => {
      if (document.visibilityState === "visible") {
        void dismissIncomingCallNotification(incomingCall.callId);
      } else {
        void showIncomingCallNotification({
          callId: incomingCall.callId,
          mode: incomingCall.mode,
          peerName: incomingCall.peerName,
          avatarUrl: incomingCall.avatarUrl ?? null,
        });
      }
    };

    syncIncomingNotification();
    document.addEventListener("visibilitychange", syncIncomingNotification);
    return () => {
      document.removeEventListener("visibilitychange", syncIncomingNotification);
      void dismissIncomingCallNotification(incomingCall.callId);
      void dismissAndroidCallNotification(incomingCall.callId);
    };
  }, [call, phase]);

  /* ---------- auto-hiding controls for Social calls ---------- */
  useEffect(() => {
    if (!call || phase === "idle" || phase === "incoming") {
      setControlsVisible(true);
      return;
    }
    setControlsVisible(true);
    hideTimer.current = window.setTimeout(() => setControlsVisible(false), 3000);
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [call, phase]);

  const pokeControls = useCallback(() => {
    setControlsVisible((v) => {
      const next = !v;
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      if (next) hideTimer.current = window.setTimeout(() => setControlsVisible(false), 3000);
      return next;
    });
  }, []);

  const showCallControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    if (!call || phase === "idle" || phase === "incoming") return;
    hideTimer.current = window.setTimeout(() => setControlsVisible(false), 3000);
  }, [call, phase]);

  const toggleSpeaker = useCallback(() => {
    const next = !speakerOn;
    const route: CallAudioRoute = next ? "speaker" : "earpiece";
    setSpeakerOn(next);
    void setCallAudioRouting(route, [remoteAudio.current, remoteVideo.current]);
  }, [speakerOn]);

  /* ---------- identity ---------- */
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setAuthId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthId(session?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Keep this installation registered with its native or browser push provider.
  useEffect(() => {
    if (!me || typeof window === "undefined") return;

    if (isAndroidCallPushAvailable()) {
      const syncToken = () => {
        void getAndroidCallPushToken()
          .then((token) => {
            if (token) return syncAndroidCallPushToken(me, token);
          })
          .catch(() => {
            // Registration retries the next time the app resumes.
          });
      };
      syncToken();
      window.addEventListener("yw-app-resume", syncToken);
      return () => window.removeEventListener("yw-app-resume", syncToken);
    }

    if (!("Notification" in window) || Notification.permission !== "granted") return;
    void getExistingCallPushSubscription().then((subscription) => {
      if (!subscription) return;
      const serialized = serializeCallPushSubscription(subscription);
      void callDb.from("call_push_subscriptions").upsert(
        {
          user_id: me,
          endpoint: serialized.endpoint,
          provider: "webpush",
          subscription: serialized.subscription,
          user_agent: navigator.userAgent.slice(0, 500),
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "user_id,endpoint" },
      );
    });
  }, [me]);

  useEffect(() => {
    const onOnline = () => {
      if (pcRef.current?.connectionState === "disconnected" || pcRef.current?.connectionState === "failed") {
        pcRef.current.dispatchEvent(new Event("connectionstatechange"));
      }
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  /* ---------- teardown ---------- */
  const teardown = useCallback((options?: { keepSignal?: boolean }) => {
    pendingCallPermissionRetry.current = null;
    setCallPermissionMode(null);
    setRetryingCallPermission(false);
    stopAllRingtones();
    if (reconnectTimer.current) {
      window.clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    reconnectAttempt.current = 0;
    videoEffectPipeline.current?.stop();
    videoEffectPipeline.current = null;
    cameraSourceTrack.current = null;
    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;
    // Release the remote tracks too, otherwise the camera/mic indicator can
    // linger and the streams stay referenced by the media elements.
    remoteStream.current?.getTracks().forEach((t) => t.stop());
    remoteStream.current = null;
    for (const el of [localVideo.current, remoteVideo.current, remoteAudio.current]) {
      if (el) {
        try { el.pause(); } catch { /* ignore */ }
        el.srcObject = null;
      }
    }
    const pc = pcRef.current;
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.getSenders().forEach((s) => s.track?.stop());
      pc.getReceivers().forEach((r) => r.track?.stop());
      try { pc.close(); } catch { /* ignore */ }
    }
    pcRef.current = null;
    pendingLocalIce.current = [];
    if (!options?.keepSignal) {
      if (sigRef.current) {
        void supabase.removeChannel(sigRef.current);
        sigRef.current = null;
      }
      signalCallIdRef.current = null;
      signalReadyRef.current = null;
    }
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    if (ringTimer.current) {
      window.clearTimeout(ringTimer.current);
      ringTimer.current = null;
    }
    connectedAt.current = null;
    pendingIce.current = [];
    receiveSignalRef.current = null;
    routedCallId.current = null;
    void stopCallAudioRouting();

    setPhase("idle");
    setCall(null);
    setRemoteVideoReady(false);
    setMicOn(true);
    setCamOn(true);
    setSpeakerOn(false);
    setNetworkState("stable");
    setVideoEffect("none");
    setFacingMode("user");
    setFlashOn(false);
    setSwapped(false);
    setLocalTileOffset({ x: 0, y: 0 });
    localTileDrag.current = null;
    suppressLocalTileClick.current = false;
    setControlsVisible(true);
    setElapsedSeconds(0);
  }, []);

  const previousAuthId = useRef<string | null>(null);
  useEffect(() => {
    const wasAuthenticated = previousAuthId.current !== null;
    const authChanged = previousAuthId.current !== authId;
    previousAuthId.current = authId;
    if (!wasAuthenticated || !authChanged) return;

    const activeCall = callRef.current;
    if (activeCall) {
      void sigRef.current?.send({
        type: "broadcast",
        event: "END_CALL",
        payload: { callId: activeCall.callId, reason: "auth_lost" },
      });
      void callDb
        .from("calls")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", activeCall.callId);
      void logCallOutcomeRef.current?.(connectedAt.current ? "answered" : "missed");
    }
    teardown();
  }, [authId, teardown]);

  const signal = useCallback((payload: Record<string, unknown>) => {
    const callId = callRef.current?.callId;
    const event = typeof payload.type === "string" ? payload.type : "signal";
    const broadcastPayload = callId ? { ...payload, callId } : payload;
    void sigRef.current?.send({ type: "broadcast", event, payload: broadcastPayload });
    // Broadcast is an optimization only. `signal_data` is visible exclusively to
    // call participants through calls RLS and lets a reconnecting peer rehydrate
    // the latest SDP/terminal signal when private Realtime auth is unavailable.
    const c = callRef.current;
    const sender = meRef.current;
    if (c && sender) {
      const prior = fallbackSignals.current[c.callId];
      const candidateKey = c.incoming ? "receiver_candidates" : "caller_candidates";
      const candidate = payload.type === "ICE_CANDIDATE"
        ? payload.candidate as RTCIceCandidateInit
        : null;
      const data: StoredSignal = {
        ...(prior ?? {}),
        sender_id: sender,
        payload,
        candidates: prior?.candidates ?? [],
        [candidateKey]: candidate
          ? [...(prior?.[candidateKey] ?? []), candidate].slice(-64)
          : (prior?.[candidateKey] ?? []),
        at: new Date().toISOString(),
      };
      fallbackSignals.current[c.callId] = data;
      void callDb.from("calls").update({ signal_data: data }).eq("id", c.callId);
    }
  }, []);

  const broadcastEndCall = useCallback((callId: string) => {
    const channel = sigRef.current;
    return channel?.send({
      type: "broadcast",
      event: "END_CALL",
      payload: { callId },
    }) ?? Promise.resolve();
  }, []);

  const persistDescription = useCallback(async (
    callId: string,
    field: "offer" | "answer",
    description: RTCSessionDescriptionInit,
  ) => {
    const { data } = await callDb
      .from("calls")
      .select("signal_data")
      .eq("id", callId)
      .maybeSingle();
    const current = ((data as { signal_data?: StoredSignal } | null)?.signal_data ?? {});
    const next: StoredSignal = {
      ...current,
      [field]: description,
      at: new Date().toISOString(),
    };
    fallbackSignals.current[callId] = next;
    const { error } = await callDb
      .from("calls")
      .update({ signal_data: next })
      .eq("id", callId);
    if (error) throw error;
  }, []);

  const playRemoteMedia = useCallback(() => {
    const elements = [remoteVideo.current, remoteAudio.current];
    for (const element of elements) {
      if (!element?.srcObject) continue;
      void element.play().catch((error) => {
        // Browsers can require a second user gesture for unmuted remote audio.
        // Media readiness and the call-surface click both retry this path.
        console.debug("[call] remote media autoplay pending", error);
      });
    }
  }, []);

  const attachStreams = useCallback(() => {
    if (localVideo.current && localStream.current) {
      localVideo.current.srcObject = localStream.current;
      void localVideo.current.play().catch(() => {});
    }
    if (remoteStream.current) {
      if (callRef.current?.mode === "video" && remoteVideo.current) {
        remoteVideo.current.srcObject = remoteStream.current;
      }
      if (callRef.current?.mode !== "video" && remoteAudio.current) {
        remoteAudio.current.srcObject = remoteStream.current;
      }
      playRemoteMedia();
    }
  }, [playRemoteMedia]);

  const getMedia = useCallback(async (mode: CallMode) => {
    const stream = await getCallMedia(mode, facingMode);
    for (const track of stream.getVideoTracks()) {
      track.contentHint = "motion";
    }
    localStream.current = stream;
    cameraSourceTrack.current = stream.getVideoTracks()[0] ?? null;
    attachStreams();
    return stream;
  }, [attachStreams, facingMode]);

  const applyVideoEffect = useCallback(async (nextEffect: CallVideoEffect) => {
    const source = cameraSourceTrack.current;
    const peer = pcRef.current;
    const stream = localStream.current;
    if (!source || !stream || !peer) return;
    const current = stream.getVideoTracks()[0] ?? null;
    videoEffectPipeline.current?.stop();
    videoEffectPipeline.current = null;

    let nextTrack = source;
    if (nextEffect !== "none") {
      const pipeline = await createCallVideoEffect(source, nextEffect);
      if (!pipeline) {
        toast.error("This browser cannot apply live video effects");
        setVideoEffect("none");
        return;
      }
      videoEffectPipeline.current = pipeline;
      nextTrack = pipeline.track;
    }

    const sender = peer.getSenders().find((item) => item.track?.kind === "video");
    if (sender) {
      await sender.replaceTrack(nextTrack);
      await tuneCallVideoSender(sender);
    }
    if (current && current !== nextTrack) stream.removeTrack(current);
    if (!stream.getVideoTracks().includes(nextTrack)) stream.addTrack(nextTrack);
    setVideoEffect(nextEffect);
    attachStreams();
  }, [attachStreams]);

  const phaseRef = useRef<Phase>("idle");
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // An unanswered incoming call must stop ringing on its own too, otherwise the
  // full-screen call UI can get stuck when the caller disappears.
  useEffect(() => {
    if (phase !== "incoming") return;
    const t = window.setTimeout(() => {
      toast.message("Missed call");
      const c = callRef.current;
      if (c) {
        void callDb.from("calls")
          .update({ status: "declined", ended_at: new Date().toISOString() })
          .eq("id", c.callId)
          .eq("status", "ringing");
      }
      signal({ type: "END_CALL", reason: "timeout" });
      stopAllRingtones();
      teardown();
    }, 45_000);
    return () => window.clearTimeout(t);
  }, [phase, teardown, signal]);

  useEffect(() => { callRef.current = call; }, [call]);
  useEffect(() => { meRef.current = me; }, [me]);
  useEffect(() => { isGuestRef.current = isGuest; }, [isGuest]);

  /**
   * Writes a permanent call-log entry into the chat so both sides can see who
   * called, whether it was answered (with duration) or missed/declined. Only
   * the caller writes it, and only once per call — the other side receives it
   * through the normal chat realtime subscription.
   */
  const logCallOutcome = useCallback(
    async (outcome: CallOutcome) => {
      const c = callRef.current;
      const meId = meRef.current;
      if (!c || c.incoming || !meId || isGuestRef.current) return;
      if (clearedCallPeers.current.has(c.peerId)) return;
      if (loggedCall.current === c.callId) return;
      loggedCall.current = c.callId;
      const durMs = connectedAt.current ? Date.now() - connectedAt.current : null;
      connectedAt.current = null;
      const fmtDur = (ms: number) => {
        const s = Math.max(0, Math.floor(ms / 1000));
        return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
      };
      const label = c.mode === "video" ? "Video" : "Voice";
      const text =
        outcome === "answered" && durMs != null
          ? `${label} Call ended • ${fmtDur(durMs)}`
          : `Missed ${label} Call`;
      if (!c.threadId) return;
      try {
        if (outcome === "declined") {
          const { data: existing, error: lookupError } = await callDb
            .from("messages")
            .select("id")
            .contains("metadata", { secret_call_log_id: c.callId })
            .limit(1)
            .maybeSingle();
          if (lookupError) throw lookupError;
          if (existing) return;
        }
        await callDb.from("messages").insert({
          sender_id: meId,
          receiver_id: c.peerId,
          content: text,
          media_url: null,
          voice_note_url: null,
          metadata: {},
        });
      } catch (err) {
        console.error("[call] log insert failed", err);
      }
    },
    [],
  );
  logCallOutcomeRef.current = logCallOutcome;
  const createPeer = useCallback(
    (stream: MediaStream) => {
      // Pre-gather ICE candidates so the call connects near-instantly.
      const pc = new RTCPeerConnection({
        iceServers: CALL_ICE_SERVERS,
        iceCandidatePoolSize: 4,
      });
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      for (const sender of pc.getSenders()) {
        if (sender.track?.kind === "video") void tuneCallVideoSender(sender);
        if (sender.track?.kind === "audio") void prioritizeCallAudioSender(sender);
      }
      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        if (callRef.current) {
          signal({ type: "ICE_CANDIDATE", candidate: e.candidate.toJSON() });
        } else {
          pendingLocalIce.current.push(e.candidate.toJSON());
        }
      };
      pc.ontrack = (e) => {
        // Some browsers deliver tracks without a stream — build one ourselves so
        // both the audio and video tracks always reach the <audio>/<video> tags.
        let s = e.streams[0] ?? remoteStream.current;
        if (!s) s = new MediaStream();
        if (!e.streams[0] && !s.getTracks().includes(e.track)) s.addTrack(e.track);
        remoteStream.current = s;
        if (e.track.kind === "video") setRemoteVideoReady(false);
        // Explicitly attach the received remote stream to the main full-screen
        // <video> element immediately, then retry on the next frame in case the
        // ref wasn't bound yet (e.g. track arrives before the element mounts).
        const attachNow = () => {
          if (callRef.current?.mode === "video" && remoteVideo.current) {
            remoteVideo.current.srcObject = s;
          }
          if (callRef.current?.mode !== "video" && remoteAudio.current) {
            remoteAudio.current.srcObject = s;
          }
          playRemoteMedia();
        };
        attachNow();
        requestAnimationFrame(attachNow);
        requestAnimationFrame(() => requestAnimationFrame(attachNow));
      };

      const scheduleReconnect = () => {
        if (reconnectTimer.current || !callRef.current || phaseRef.current === "idle") return;
        const attempt = reconnectAttempt.current;
        if (attempt >= 4) {
          toast.error("Call connection could not be recovered");
          const currentCall = callRef.current;
          if (currentCall) {
            signal({ type: "END_CALL", reason: "reconnect_failed" });
            void callDb.from("calls")
              .update({ status: "ended", ended_at: new Date().toISOString() })
              .eq("id", currentCall.callId);
          }
          void logCallOutcome("missed");
          teardown();
          return;
        }
        reconnectAttempt.current += 1;
        setNetworkState("reconnecting");
        const delay = Math.min(10_000, 1_000 * 2 ** attempt);
        reconnectTimer.current = window.setTimeout(() => {
          reconnectTimer.current = null;
          void (async () => {
            try {
              if (pcRef.current !== pc || !callRef.current) return;
              pc.restartIce?.();
              const offer = await pc.createOffer({ iceRestart: true });
              const optimizedOffer = {
                ...offer,
                sdp: optimizeCallSdp(offer.sdp ?? ""),
              };
              await pc.setLocalDescription(optimizedOffer);
              const description = pc.localDescription;
              if (!description) throw new Error("ICE restart offer was not created");
              await persistDescription(callRef.current.callId, "offer", description);
              signal({ type: "CALL_OFFER", sdp: description, reconnect: true });
            } catch (error) {
              console.debug("[call] ICE restart attempt failed", error);
              scheduleReconnect();
            }
          })();
        }, delay);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          stopAllRingtones();
          reconnectAttempt.current = 0;
          setNetworkState("stable");
          connectedAt.current ??= Date.now();
          setPhase("active");
          const currentCall = callRef.current;
          if (currentCall) {
            void callDb.from("calls")
              .update({ status: "connected" })
              .eq("id", currentCall.callId);
          }
        }
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          scheduleReconnect();
        }
      };
      return pc;
    },
    [signal, teardown, logCallOutcome, playRemoteMedia, persistDescription],
  );

  const flushIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    for (const c of pendingIce.current) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch { /* ignore */ }
    }
    pendingIce.current = [];
  }, []);

  /* ---------- signalling channel for one call ---------- */
  const openSignalChannel = useCallback(
    (callId: string, mode: CallMode, isCaller: boolean) => {
      if (signalCallIdRef.current === callId && signalReadyRef.current) {
        return signalReadyRef.current;
      }
      const ready = new Promise<void>((resolve) => {
        void (async () => {
        const { data: sess } = await supabase.auth.getSession();
        await supabase.realtime.setAuth(sess.session?.access_token);
        const ch = supabase.channel(`call_${callId}`, {
          config: { broadcast: { self: false } },
        });
        sigRef.current = ch;
        const receive = async (payload: Record<string, unknown>, eventType?: string) => {
          const pc = pcRef.current;
          const type = typeof payload.type === "string" ? payload.type : eventType;
          try {
            if ((type === "CALL_ACCEPT" || type === "accept") && isCaller) {
              setPhase("connecting");
              const stream = localStream.current ?? (await getMedia(mode));
              const peer = pcRef.current ?? createPeer(stream);
              // The caller already created and persisted an offer before the
              // ringing row was inserted. Reusing it avoids a second
              // negotiation that can race the receiver's accept broadcast.
              let offerDescription = peer.localDescription;
              if (!offerDescription) {
                const offer = await peer.createOffer({
                  offerToReceiveAudio: true,
                  offerToReceiveVideo: mode === "video",
                });
                const optimizedOffer = {
                  ...offer,
                  sdp: optimizeCallSdp(offer.sdp ?? ""),
                };
                await peer.setLocalDescription(optimizedOffer);
                offerDescription = peer.localDescription;
              }
              if (!offerDescription) throw new Error("no offer was created");
              await persistDescription(callId, "offer", offerDescription);
              signal({ type: "CALL_OFFER", sdp: offerDescription });
            } else if (
              (type === "CALL_OFFER" || type === "offer") &&
              (!isCaller || payload.reconnect === true) &&
              phaseRef.current !== "incoming"
            ) {
              const remoteOffer = asSessionDescription(payload.sdp);
              if (!remoteOffer) return;
              const stream = localStream.current ?? (await getMedia(mode));
              const peer = pcRef.current ?? createPeer(stream);
              if (
                peer.remoteDescription?.sdp &&
                peer.remoteDescription.sdp === remoteOffer.sdp &&
                peer.signalingState !== "have-local-offer"
              ) return;
              await peer.setRemoteDescription(
                new RTCSessionDescription(optimizedSessionDescription(remoteOffer)),
              );
              await flushIce();
              const answer = await peer.createAnswer();
              const optimizedAnswer = {
                ...answer,
                sdp: optimizeCallSdp(answer.sdp ?? ""),
              };
              await peer.setLocalDescription(optimizedAnswer);
              const answerDescription = peer.localDescription;
              if (!answerDescription) return;
              // Persist the answer first. Broadcast is only an acceleration
              // path and must never race the database source of truth.
              void sigRef.current?.send({
                type: "broadcast",
                event: "CALL_ANSWER",
                payload: { type: "CALL_ANSWER", callId, sdp: answerDescription, reconnect: payload.reconnect === true },
              });
              await persistDescription(callId, "answer", answerDescription);
              setPhase("connecting");
            } else if (
              (type === "CALL_ANSWER" || type === "answer") &&
              pc &&
              (pc.signalingState === "have-local-offer" || !pc.remoteDescription)
            ) {
              const remoteAnswer = asSessionDescription(payload.sdp);
              if (!remoteAnswer) return;
              await pc.setRemoteDescription(
                new RTCSessionDescription(optimizedSessionDescription(remoteAnswer)),
              );
              await flushIce();
              stopAllRingtones();
              setPhase("connecting");
            } else if (type === "ICE_CANDIDATE" || type === "ice") {
              const candidate = asIceCandidate(payload.candidate);
              if (!candidate) return;
              if (pc?.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } else {
                pendingIce.current.push(candidate);
              }
            } else if (type === "END_CALL") {
              if (payload.callId && payload.callId !== callId) return;
              stopAllRingtones();
              const reason = payload.reason === "rejected" || payload.reason === "declined";
              toast.message(reason ? "Call declined" : "Call ended");
              void logCallOutcome(reason ? "declined" : connectedAt.current ? "answered" : "missed");
              teardown();
            }
          } catch (err) {
            console.error("[call] signal error", err);
          }
        };
        const enqueueReceive = (payload: Record<string, unknown>, eventType?: string) => {
          const next = signalQueueRef.current.then(() => receive(payload, eventType));
          signalQueueRef.current = next.catch(() => {});
          return next;
        };
        receiveSignalRef.current = enqueueReceive;
        const broadcastEvents = ["CALL_ACCEPT", "CALL_OFFER", "CALL_ANSWER", "ICE_CANDIDATE", "END_CALL"] as const;
        for (const event of broadcastEvents) {
          ch.on("broadcast", { event }, ({ payload }) => {
            void enqueueReceive(payload as Record<string, unknown>, event);
          });
        }
        // Keep accepting the older generic event for calls started by a tab
        // that has not refreshed yet.
        ch.on("broadcast", { event: "signal" }, ({ payload }) => {
          void enqueueReceive(payload as Record<string, unknown>);
        });

        // Never leave callers awaiting forever: resolve on any terminal
        // subscription status and after a hard timeout as well.
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          resolve();
        };
        const guard = setTimeout(done, 8000);
        ch.subscribe((status) => {
          if (
            status === "SUBSCRIBED" ||
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            clearTimeout(guard);
            done();
          }
        });
        // A newly opened/reopened channel may have missed the last private
        // broadcast. Read the participant-protected fallback once to resync.
        void callDb.from("calls").select("signal_data").eq("id", callId).maybeSingle()
          .then(({ data }: { data: { signal_data?: Partial<StoredSignal> } | null }) => {
            const stored = (data as { signal_data?: Partial<StoredSignal> } | null)?.signal_data;
            if (stored?.sender_id && stored.sender_id !== meRef.current) {
              void (async () => {
                if (stored.payload) await enqueueReceive(stored.payload);
                for (const candidate of stored.candidates ?? []) await enqueueReceive({ type: "ICE_CANDIDATE", candidate });
                const remoteCandidates = isCaller
                  ? stored.receiver_candidates
                  : stored.caller_candidates;
                for (const candidate of remoteCandidates ?? []) await enqueueReceive({ type: "ICE_CANDIDATE", candidate });
              })();
            }
          });
        })().catch((error) => {
          console.error("[call] signalling setup failed", error);
          resolve();
        });
      });
      signalCallIdRef.current = callId;
      signalReadyRef.current = ready;
      return ready;
    },

    [createPeer, flushIce, getMedia, signal, teardown, logCallOutcome, persistDescription],
  );
  openSignalChannelRef.current = openSignalChannel;

  /* ---------- durable ring listener (database, works app-wide) ---------- */
  useEffect(() => {
    if (!authId) return;
    const me2 = authId;
    let alive = true;
    const blocked = async (peerId: string) => {
      const { data } = await callDb
        .from("user_blocks")
        .select("blocker_id")
        .or(`blocker_id.eq.${me2},blocked_id.eq.${me2}`)
        .limit(20);
      return ((data as BlockRow[] | null) ?? []).some((row: BlockRow) =>
        row.blocker_id === peerId || row.blocked_id === peerId,
      );
    };
    const ring = async (raw: unknown) => {
      const row = raw as CallRow;
      if (!alive || row.receiver_id !== me2 || row.status !== "ringing" || seenCalls.current.has(row.id)) return;
      if (Date.now() - new Date(row.created_at).getTime() > 45_000) return;
      markSeen(row.id);
      if (await blocked(row.caller_id)) {
        void callDb.from("calls").update({ status: "declined", ended_at: new Date().toISOString() }).eq("id", row.id);
        return;
      }
      let secretLocked = false;
      let secretLockCheckFailed = false;
      try {
        secretLocked = await isSecretChatLockedWith(me2, row.caller_id);
      } catch (error) {
        // Fail closed: inability to confirm this lock must not expose the call.
        console.error("[call] Secret Lock state could not be checked", error);
        secretLocked = true;
        secretLockCheckFailed = true;
      }
      const activeLockedConversation =
        secretLocked &&
        !secretLockCheckFailed &&
        isActiveChatFocusedForCall(me2, row.caller_id);
      if (secretLocked && !activeLockedConversation) {
        stopAllRingtones();
        void dismissIncomingCallNotification(row.id);
        const label = row.call_type === "video" ? "Video" : "Audio";
        try {
          const { data: existing, error: lookupError } = await callDb
            .from("messages")
            .select("id")
            .contains("metadata", { secret_call_log_id: row.id })
            .limit(1)
            .maybeSingle();
          if (lookupError) throw lookupError;
          if (!existing) {
            const conversation = await ensureThreadConversation(
              dmThreadId(me2, row.caller_id),
              [me2, row.caller_id],
            );
            if (!conversation) {
              throw new Error("Could not resolve the shared conversation for the missed call.");
            }
            const { error } = await callDb.from("messages").insert({
              sender_id: me2,
              receiver_id: row.caller_id,
              conversation_id: conversation.id,
              content: `Missed ${label} Call`,
              media_url: null,
              voice_note_url: null,
              metadata: { secret_call_log_id: row.id },
            });
            if (error) throw error;
          }
        } catch (error) {
          console.error("[call] silent missed-call log failed", error);
        }
        await callDb
          .from("calls")
          .update({ status: "declined", ended_at: new Date().toISOString() })
          .eq("id", row.id)
          .eq("status", "ringing");
        return;
      }
      if (pcRef.current || phaseRef.current !== "idle") {
        void callDb.from("calls").update({ status: "declined", ended_at: new Date().toISOString() }).eq("id", row.id);
        return;
      }
      const { data: callerProfile } = await supabase
        .from("profiles")
        .select("display_name,username,avatar_url")
        .eq("id", row.caller_id)
        .maybeSingle();
      const peerName = callerProfile?.display_name || callerProfile?.username || "YourWorld caller";
      const nextCall = {
        callId: row.id,
        mode: row.call_type,
        peerId: row.caller_id,
        peerName,
        avatarUrl: callerProfile?.avatar_url ?? null,
        incoming: true,
      };
      const storedSignal = row.signal_data as Partial<StoredSignal> | null;
      if (storedSignal && typeof storedSignal === "object") {
        fallbackSignals.current[row.id] = storedSignal as StoredSignal;
      }
      setCall(nextCall);
      callRef.current = nextCall;
      setPhase("incoming");
      void openSignalChannelRef.current?.(row.id, row.call_type, false);
    };
    const update = ({ new: raw }: { new: unknown }) => {
      const row = raw as CallRow;
      if (row.receiver_id !== me2 && row.caller_id !== me2) return;
      if (row.receiver_id === me2 && row.status === "ringing") void ring(row);
      if (
        row.id === callRef.current?.callId &&
        (row.status === "ended" ||
          row.status === "cancelled" ||
          row.status === "declined" ||
          row.status === "rejected" ||
          row.status === "busy")
      ) {
        stopAllRingtones();
        toast.message(
          row.status === "declined" || row.status === "rejected"
            ? "Call declined"
            : row.status === "busy"
              ? "User is busy"
              : "Call ended",
        );
        void logCallOutcomeRef.current?.(row.status === "declined" ? "declined" : "missed");
        teardown();
      }
      const stored = row.signal_data as Partial<StoredSignal> | null;
      if (stored?.sender_id && stored.sender_id !== me2) {
        void (async () => {
          if (stored.payload) await receiveSignalRef.current?.(stored.payload);
          for (const candidate of stored.candidates ?? []) {
            await receiveSignalRef.current?.({ type: "ICE_CANDIDATE", candidate });
          }
          const remoteCandidates = row.caller_id === me2
            ? stored.receiver_candidates
            : stored.caller_candidates;
          for (const candidate of remoteCandidates ?? []) {
            await receiveSignalRef.current?.({ type: "ICE_CANDIDATE", candidate });
          }
        })();
      }
    };
    const ch = supabase
      .channel(`calls-db-${me2}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "calls", filter: `receiver_id=eq.${me2}` },
        ({ new: row }) => { void ring(row); },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "calls" },
        update,
      )
      .subscribe();
    // Rehydrate unanswered calls after reconnect/background suspension.
    void callDb.from("calls").select("*").eq("receiver_id", me2).eq("status", "ringing").then(({ data }: { data: CallRow[] | null }) => {
      for (const row of (data ?? [])) void ring(row);
    });
    const pollCalls = async () => {
      if (!alive) return;
      const { data } = await callDb
        .from("calls")
        .select("*")
        .or(`caller_id.eq.${me2},receiver_id.eq.${me2}`)
        .order("created_at", { ascending: false })
        .limit(30);
      for (const row of (data as CallRow[] | null) ?? []) {
        if (!alive) return;
        if (row.receiver_id === me2 && row.status === "ringing") void ring(row);
        if (row.id !== callRef.current?.callId) continue;

        update({ new: row });
        if (row.status === "ended" || row.status === "declined" || row.status === "cancelled" || row.status === "rejected" || row.status === "busy") {
          continue;
        }
        const record = row.signal_data as Partial<StoredSignal> | null;
        if (row.caller_id === me2 && record?.answer) {
          await receiveSignalRef.current?.({
            type: "CALL_ANSWER",
            callId: row.id,
            sdp: record.answer,
          });
        }
        if (row.receiver_id === me2 && record?.offer && phaseRef.current === "connecting") {
          await receiveSignalRef.current?.({
            type: "CALL_OFFER",
            callId: row.id,
            sdp: record.offer,
          });
        }
        const remoteCandidates = row.caller_id === me2
          ? record?.receiver_candidates
          : record?.caller_candidates;
        for (const candidate of remoteCandidates ?? []) {
          await receiveSignalRef.current?.({ type: "ICE_CANDIDATE", candidate });
        }
      }
    };
    void pollCalls();
    const pollTimer = window.setInterval(() => void pollCalls(), 1000);
    return () => {
      alive = false;
      window.clearInterval(pollTimer);
      void supabase.removeChannel(ch);
    };
  }, [authId, teardown, markSeen]);


  /* ---------- start an outgoing call ---------- */
  const startCall = useCallback<Ctx["startCall"]>(
    async ({ threadId, peerId, peerName, avatarUrl, mode }) => {
      if (!authId) {
        toast.error("Sign in to make a call");
        return;
      }
      let target = peerId ?? null;
      if (!target && threadId) {
        const { data } = await supabase
          .from("thread_participants")
          .select("user_id")
          .eq("thread_id", threadId);
        target = (data ?? []).map((r) => r.user_id).find((id) => id !== me) ?? null;
      }
      if (!target || target === authId) {
        toast.error("This person isn't reachable for calls yet");
        return;
      }
      const { data: blocks } = await callDb
        .from("user_blocks")
        .select("blocker_id,blocked_id")
        .or(`blocker_id.eq.${authId},blocked_id.eq.${authId}`);
      if (((blocks as BlockRow[] | null) ?? []).some((block: BlockRow) =>
        block.blocker_id === target || block.blocked_id === target,
      )) {
        toast.error("Calls are unavailable because one of you has blocked the other.");
        return;
      }

      try {
        setRemoteVideoReady(false);
        await getMedia(mode);
      } catch (error) {
        if (isCallMediaPermissionError(error)) {
          pendingCallPermissionRetry.current = {
            kind: "outgoing",
            options: { threadId, peerId, peerName, avatarUrl, mode },
          };
          setCallPermissionMode(mode);
          return;
        }
        toast.error(
          mode === "video"
            ? `Call could not start: ${error instanceof Error ? error.message : "camera or microphone unavailable"}`
            : `Call could not start: ${error instanceof Error ? error.message : "microphone unavailable"}`,
        );
        teardown();
        return;
      }
      let callId: string | null = null;
      try {
        const stream = localStream.current!;
        const peer = createPeer(stream);
        const offer = await peer.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: mode === "video",
        });
        const optimizedOffer = {
          ...offer,
          sdp: optimizeCallSdp(offer.sdp ?? ""),
        };
        await peer.setLocalDescription(optimizedOffer);
        const offerDescription = peer.localDescription;
        if (!offerDescription) throw new Error("no offer was created");
        const initialSignal: StoredSignal = {
          offer: offerDescription,
          caller_candidates: [...pendingLocalIce.current],
          sender_id: authId,
          at: new Date().toISOString(),
        };
        const { data: inserted, error } = await callDb
          .from("calls")
          .insert({
            caller_id: authId,
            receiver_id: target,
            call_type: mode,
            status: "ringing",
            signal_data: initialSignal,
          })
          .select("id")
          .single();
        callId = (inserted as { id?: string } | null)?.id ?? null;
        if (error || !callId) {
          throw new Error(error?.message ?? "no call id was returned");
        }
        // Realtime/database ringing remains the source of truth. This
        // authenticated edge call is only the background wake-up path.
        void supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", authId)
          .maybeSingle()
          .then(({ data: callerProfile }) => {
            void supabase
              .functions
              .invoke("send-call-push", {
              body: {
                callId,
                receiverId: target,
                mode,
                peerName: peerName ?? "YourWorld caller",
                avatarUrl: callerProfile?.avatar_url ?? null,
              },
              })
              .then(({ error: pushError }) => {
                if (pushError) {
                  console.debug("[call-notifications] background push unavailable", pushError);
                }
              });
            void supabase.auth
              .getSession()
              .then(({ data: sessionData, error: sessionError }) => {
                const accessToken = sessionData.session?.access_token;
                if (sessionError || !accessToken) return;
                return fetch("/api/calls/push", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ callId }),
                }).then((response) => {
                  if (!response.ok) {
                    console.debug("[call-notifications] Android push delivery pending");
                  }
                });
              })
              .catch(() => {
                // FCM is best-effort; realtime remains the source of truth.
              });
          });
        const nextCall = {
          callId,
          mode,
          peerId: target,
          peerName: peerName ?? "Calling…",
          avatarUrl: avatarUrl ?? null,
          incoming: false,
          threadId: threadId ?? null,
        };
        clearedCallPeers.current.delete(target);
        fallbackSignals.current[callId] = initialSignal;
        pendingLocalIce.current = [];
        setCall(nextCall);
        callRef.current = nextCall;
        setPhase("outgoing");
        await openSignalChannel(callId, mode, true);
        signal({ type: "CALL_OFFER", sdp: offerDescription });

        markSeen(callId);
        for (const candidate of initialSignal.caller_candidates ?? []) {
          signal({ type: "ICE_CANDIDATE", candidate });
        }

        // Stop ringing after 45s instead of hanging on the calling screen.
        if (ringTimer.current) window.clearTimeout(ringTimer.current);
        ringTimer.current = window.setTimeout(() => {
          ringTimer.current = null;
          if (phaseRef.current !== "outgoing") return;
          toast.message("No answer");
          signal({ type: "END_CALL", reason: "timeout" });
          stopAllRingtones();
          void callDb.from("calls").update({ status: "cancelled", ended_at: new Date().toISOString() }).eq("id", callId);
          void logCallOutcome("missed");
          teardown();
        }, 45_000);
      } catch (error) {
        if (callId) {
          void callDb
            .from("calls")
            .update({ status: "cancelled", ended_at: new Date().toISOString() })
            .eq("id", callId);
        }
        toast.error(`Call could not start: ${error instanceof Error ? error.message : "unexpected setup error"}`);
        teardown();
      }
    },
    [authId, me, getMedia, createPeer, openSignalChannel, signal, teardown, logCallOutcome, markSeen],

  );

  const clearCallHistory = useCallback((peerId: string) => {
    if (peerId) clearedCallPeers.current.add(peerId);
  }, []);

  const accept = useCallback(async () => {
    if (!call || !authId) return;
    setRemoteVideoReady(false);
    const { data: blocks } = await callDb
      .from("user_blocks")
      .select("blocker_id,blocked_id")
      .or(`blocker_id.eq.${authId},blocked_id.eq.${authId}`);
    if (((blocks as BlockRow[] | null) ?? []).some((block: BlockRow) =>
      block.blocker_id === call.peerId || block.blocked_id === call.peerId,
    )) {
      toast.error("Calls are unavailable because one of you has blocked the other.");
      signal({ type: "END_CALL", reason: "rejected" });
      void callDb.from("calls")
        .update({ status: "declined", ended_at: new Date().toISOString() })
        .eq("id", call.callId);
      teardown();
      return;
    }
    if (ringTimer.current) {
      window.clearTimeout(ringTimer.current);
      ringTimer.current = null;
    }
    try {
      await getMedia(call.mode);
      setPhase("connecting");
    } catch (error) {
      if (isCallMediaPermissionError(error)) {
        pendingCallPermissionRetry.current = { kind: "incoming", callId: call.callId };
        setCallPermissionMode(call.mode);
        return;
      }
      toast.error(
        `Call could not start: ${error instanceof Error ? error.message : "required media is unavailable"}`,
      );
      signal({ type: "END_CALL", reason: "rejected" });
      void callDb.from("calls").update({ status: "declined", ended_at: new Date().toISOString() }).eq("id", call.callId);
      teardown();
      return;
    }
    try {
      createPeer(localStream.current!);
      await openSignalChannel(call.callId, call.mode, false);
      // The offer is already stored in signal_data. Marking the row accepted
      // lets the one-second poll know the receiver is ready to answer it.
      const { error } = await supabase
        .from("calls")
        .update({ status: "accepted" } as never)
        .eq("id", call.callId);
      if (error) throw error;
      // The caller listens for this broadcast as an acceleration path. The
      // stored offer below makes accept resilient when broadcast delivery is
      // delayed or unavailable.
      void sigRef.current?.send({
        type: "broadcast",
        event: "CALL_ACCEPT",
        payload: { type: "CALL_ACCEPT", callId: call.callId },
      });
      const { data: callRow } = await callDb
        .from("calls")
        .select("signal_data")
        .eq("id", call.callId)
        .maybeSingle();
      const storedOffer = (callRow as { signal_data?: Partial<StoredSignal> } | null)?.signal_data?.offer;
      if (storedOffer) {
        await receiveSignalRef.current?.({
          type: "CALL_OFFER",
          callId: call.callId,
          sdp: storedOffer,
        });
      }
    } catch (error) {
      toast.error(`Call could not connect: ${error instanceof Error ? error.message : "unexpected setup error"}`);
      signal({ type: "END_CALL", reason: "failed" });
      void callDb
        .from("calls")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", call.callId);
      teardown();
    }
  }, [call, authId, getMedia, createPeer, openSignalChannel, signal, teardown]);

  const retryCallMediaPermission = useCallback(async () => {
    const pending = pendingCallPermissionRetry.current;
    if (!pending || retryingCallPermission) return;

    pendingCallPermissionRetry.current = null;
    setCallPermissionMode(null);
    setRetryingCallPermission(true);
    try {
      if (pending.kind === "outgoing") {
        await startCall(pending.options);
      } else if (callRef.current?.callId === pending.callId) {
        await accept();
      }
    } finally {
      setRetryingCallPermission(false);
    }
  }, [accept, retryingCallPermission, startCall]);

  const dismissCallPermissionDialog = useCallback((open: boolean) => {
    if (open || retryingCallPermission) return;
    pendingCallPermissionRetry.current = null;
    setCallPermissionMode(null);
  }, [retryingCallPermission]);


  const hangup = useCallback(async () => {
    stopAllRingtones();
    if (!call) {
      teardown();
      return;
    }

    const callId = call.callId;
    const channel = sigRef.current;
    const wasConnected = connectedAt.current !== null;
    const broadcastPromise = broadcastEndCall(callId);
    const dbPromise = callDb
      .from("calls")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", callId);

    // Clean up the local call immediately, but keep the signaling channel alive
    // until the terminal broadcast has had a chance to leave the socket.
    teardown({ keepSignal: true });
    void logCallOutcome(wasConnected ? "answered" : "missed");

    await Promise.allSettled([broadcastPromise, dbPromise]);
    if (channel && sigRef.current === channel) {
      await supabase.removeChannel(channel);
      sigRef.current = null;
    }
    signalCallIdRef.current = null;
    signalReadyRef.current = null;
  }, [call, teardown, broadcastEndCall, logCallOutcome]);


  useEffect(() => {
    if (phase !== "active") {
      setElapsedSeconds(0);
      return;
    }
    const update = () => {
      setElapsedSeconds(
        connectedAt.current
          ? Math.max(0, Math.floor((Date.now() - connectedAt.current) / 1000))
          : 0,
      );
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [phase, call?.callId]);

  useEffect(() => {
    const pending = pendingNotificationAction.current;
    if (!pending || !call || phase !== "incoming" || pending.callId !== call.callId) return;
    pendingNotificationAction.current = null;
    if (pending.action === "accept") void accept();
    else void hangup();
  }, [accept, call, hangup, phase]);


  const toggleMic = useCallback(() => {
    const tracks = localStream.current?.getAudioTracks() ?? [];
    if (!tracks.length) return;
    const next = !tracks.every((track) => track.enabled);
    tracks.forEach((track) => {
      track.enabled = next;
    });
    setMicOn(next);
  }, []);
  const toggleCam = useCallback(() => {
    const tracks = localStream.current?.getVideoTracks() ?? [];
    if (!tracks.length) return;
    const next = !tracks.every((track) => track.enabled);
    tracks.forEach((track) => {
      track.enabled = next;
    });
    setCamOn(next);
  }, []);

  const toggleFlash = useCallback(async () => {
    const track = cameraSourceTrack.current;
    if (!track || facingMode !== "environment") {
      setFlashOn(false);
      toast.message("Flashlight is available with the rear camera");
      return;
    }
    try {
      const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
      if (capabilities.torch !== true) {
        setFlashOn(false);
        toast.message("Flashlight is not supported on this device");
        return;
      }
      const next = !flashOn;
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      } as MediaTrackConstraints);
      setFlashOn(next);
    } catch {
      setFlashOn(false);
      toast.message("Flashlight is not supported on this device");
    }
  }, [facingMode, flashOn]);

  const flipCamera = useCallback(async () => {
    const next = facingMode === "user" ? "environment" : "user";
    const oldTrack = localStream.current?.getVideoTracks()[0] ?? null;
    const oldCameraTrack = cameraSourceTrack.current;
    videoEffectPipeline.current?.stop();
    videoEffectPipeline.current = null;
    // Most phones can't open both cameras at once — release the old one first.
    if (oldCameraTrack && oldCameraTrack !== oldTrack) oldCameraTrack.stop();
    if (oldTrack) {
      oldTrack.stop();
      localStream.current?.removeTrack(oldTrack);
    }
    cameraSourceTrack.current = null;
    setFlashOn(false);
    try {
      const newStream = await getCallVideo(next);
      const newVideoTrack = newStream.getVideoTracks()[0];
      newVideoTrack.contentHint = "motion";
      cameraSourceTrack.current = newVideoTrack;
      const sender = pcRef.current
        ?.getSenders()
        .find((s) => s.track?.kind === "video");
      if (sender && newVideoTrack) {
        await sender.replaceTrack(newVideoTrack);
        await tuneCallVideoSender(sender);
      }
      if (localStream.current && newVideoTrack) {
        localStream.current.addTrack(newVideoTrack);
      }
      setFacingMode(next);
      setVideoEffect("none");
      attachStreams();
    } catch {
      toast.error("Couldn't switch camera");
      // try to restore the previous camera so the call keeps video
      try {
        const back = await getCallVideo(facingMode);
        const t = back.getVideoTracks()[0];
        const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");
        if (sender && t) {
          await sender.replaceTrack(t);
          await tuneCallVideoSender(sender);
        }
        if (localStream.current && t) localStream.current.addTrack(t);
        cameraSourceTrack.current = t;
        attachStreams();
      } catch { /* ignore */ }
    }
  }, [facingMode, attachStreams]);

  // Re-bind media to the elements whenever the call UI (re)mounts, so late
  // remote tracks and the local preview always show up on both sides.
  useEffect(() => {
    if (!call || phase === "idle") return;
    attachStreams();
    const t = window.setTimeout(attachStreams, 250);
    return () => window.clearTimeout(t);
  }, [call, phase, attachStreams]);

  // Reset the swap + load the peer avatar for the premium incoming screen.
  useEffect(() => {
    setSwapped(false);
    setPeerAvatar(null);
    const peerId = call?.peerId;
    if (!peerId) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", peerId)
        .maybeSingle();
      if (!cancelled && data?.avatar_url) setPeerAvatar(data.avatar_url);
    })();
    return () => {
      cancelled = true;
    };
  }, [call?.peerId]);

  useEffect(() => () => teardown(), [teardown]);




  const value = useMemo(
    () => ({ startCall, myCallId: me, isGuest, clearCallHistory }),
    [startCall, me, isGuest, clearCallHistory],
  );

  const statusText =
    phase === "incoming"
          ? `Incoming ${call?.mode === "video" ? "video" : "audio"} call…`
      : phase === "outgoing"
        ? "Ringing…"
        : phase === "connecting"
          ? "Connecting…"
          : "Connected";
  const caller = call
    ? { name: call.peerName, avatar_url: call.avatarUrl ?? peerAvatar }
    : null;
  const callClock = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(
    elapsedSeconds % 60,
  ).padStart(2, "0")}`;
  const enableNotifications = async () => {
    markCallNotificationBannerSeen();
    setShowNotificationBanner(false);
    if (isAndroidCallPushAvailable()) {
      try {
        const result = await registerAndroidCallPush();
        if (result.permission === "granted") {
          if (result.token && me) {
            await syncAndroidCallPushToken(me, result.token);
            toast.success("Call notifications enabled");
          } else if (result.fullScreenIntentPermissionRequired) {
            toast.message("Allow full-screen call notifications, then return to YourWorld");
          }
        } else if (result.permission === "denied") {
          toast.message("Notifications remain disabled");
        }
      } catch {
        toast.error("Could not enable Android call notifications");
      }
      return;
    }

    const result = await enableCallNotifications();
    if (result.permission === "granted") {
      if (result.subscription && me) {
        const serialized = serializeCallPushSubscription(result.subscription);
        const { error } = await callDb.from("call_push_subscriptions").upsert(
          {
            user_id: me,
            endpoint: serialized.endpoint,
            provider: "webpush",
            subscription: serialized.subscription,
            user_agent: navigator.userAgent.slice(0, 500),
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "user_id,endpoint" },
        );
        if (error) console.debug("[call-notifications] subscription sync pending", error);
      }
      toast.success("Call and message notifications enabled");
    }
    else if (result.permission === "denied") toast.message("Notifications remain disabled");
  };

  const beginLocalTileDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (swapped || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    event.stopPropagation();
    localTileDrag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: localTileOffset.x,
      offsetY: localTileOffset.y,
      x: localTileOffset.x,
      y: localTileOffset.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveLocalTile = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = localTileDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) drag.moved = true;
    if (!drag.moved) return;

    const minX = -Math.max(0, window.innerWidth - 128);
    const maxY = Math.max(-96, window.innerHeight - 400);
    const x = Math.max(minX, Math.min(0, drag.offsetX + deltaX));
    const y = Math.max(-96, Math.min(maxY, drag.offsetY + deltaY));
    drag.x = x;
    drag.y = y;
    event.currentTarget.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const endLocalTileDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = localTileDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    localTileDrag.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // The browser may already have released capture after a gesture cancel.
    }
    if (drag.moved) {
      setLocalTileOffset({ x: drag.x, y: drag.y });
      suppressLocalTileClick.current = true;
      window.setTimeout(() => {
        suppressLocalTileClick.current = false;
      }, 0);
    }
  };

  const cancelLocalTileDrag = () => {
    const drag = localTileDrag.current;
    if (drag?.moved) setLocalTileOffset({ x: drag.x, y: drag.y });
    localTileDrag.current = null;
  };

  const localPreviewFullScreen = !remoteVideoReady || swapped;

  return (
    <CallCtx.Provider value={value}>
      {children}
      <CallPermissionDialog
        open={callPermissionMode !== null}
        mode={callPermissionMode}
        busy={retryingCallPermission}
        onOpenChange={dismissCallPermissionDialog}
        onRetry={() => void retryCallMediaPermission()}
      />
      {showNotificationBanner && (
        <div className="fixed inset-x-4 bottom-5 z-[200] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/95 p-4 text-white shadow-2xl backdrop-blur-2xl">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/20 text-primary">
            <Bell className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Enable Call &amp; Message Notifications</p>
            <p className="mt-1 text-xs text-white/60">Get notified when someone calls while YourWorld is closed.</p>
          </div>
          <button
            type="button"
            onClick={() => void enableNotifications()}
            className="shrink-0 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
          >
            Enable
          </button>
          <button
            type="button"
            onClick={() => {
              markCallNotificationBannerSeen();
              setShowNotificationBanner(false);
            }}
            aria-label="Dismiss notification prompt"
            className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {call && phase !== "idle" && (
        <div
          className={`${
            phase === "incoming"
              ? "pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center text-white"
              : "fixed inset-0 z-[100] overflow-hidden bg-zinc-950 text-white"
          }`}
          style={
            phase === "incoming"
              ? { top: "env(safe-area-inset-top, 0px)", margin: "12px 16px" }
              : undefined
          }
          onClick={phase === "incoming" ? undefined : () => {
            playRemoteMedia();
            pokeControls();
          }}
        >
          {phase !== "incoming" && call.mode === "audio" && (
            <div className="absolute inset-0 z-0 overflow-hidden bg-[radial-gradient(circle_at_50%_34%,rgba(99,102,241,0.35),transparent_58%),linear-gradient(160deg,#09090b,#18122e_55%,#09090b)]">
              {(call.avatarUrl ?? peerAvatar) && (
                <img
                  src={call.avatarUrl ?? peerAvatar ?? undefined}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full scale-125 object-cover opacity-35 blur-3xl"
                />
              )}
              <div className="absolute inset-0 bg-black/35 backdrop-blur-3xl" />
              <div className={`absolute left-1/2 top-[42%] z-10 flex w-[min(84vw,21rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-5 text-center transition-opacity duration-300 ${
                controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
              }`}>
                <div className="relative grid h-52 w-52 place-items-center">
                  <span className="absolute inset-0 rounded-full border border-indigo-300/25 bg-indigo-400/5 motion-safe:animate-pulse" />
                  <span className="absolute inset-4 rounded-full border border-fuchsia-300/25 bg-fuchsia-400/5 motion-safe:animate-pulse" />
                  <span className="absolute inset-8 rounded-full border border-white/20 bg-white/5 backdrop-blur-xl" />
                  {call.avatarUrl ?? peerAvatar ? (
                    <img
                      src={call.avatarUrl ?? peerAvatar ?? undefined}
                      alt={call.peerName}
                      className="relative h-36 w-36 rounded-full border border-white/35 object-cover shadow-[0_0_54px_rgba(129,140,248,0.38)]"
                    />
                  ) : (
                    <div className="relative grid h-36 w-36 place-items-center rounded-full border border-white/25 bg-white/10 text-5xl font-bold shadow-[0_0_54px_rgba(129,140,248,0.38)] backdrop-blur-xl">
                      {call.peerName?.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                <div className="max-w-full rounded-2xl border border-white/10 bg-black/35 px-5 py-3 backdrop-blur-xl">
                  <p className="break-words text-center text-xl font-semibold tracking-tight text-white">
                    {call.peerName}
                  </p>
                  <p className="mt-1 text-xs font-medium text-white/65">
                    {phase === "active" ? "Connected" : statusText}
                  </p>
                </div>
              </div>
            </div>
          )}
          {call.mode === "video" && phase !== "incoming" && (
            <>
              <video
                ref={remoteVideo}
                autoPlay
                playsInline
                preload="none"
                controls={false}
                poster=""
                muted={false}
                onLoadedMetadata={playRemoteMedia}
                onLoadedData={() => setRemoteVideoReady(true)}
                onPlaying={() => setRemoteVideoReady(true)}
                onClick={
                  swapped
                    ? (e) => { e.stopPropagation(); setSwapped(false); pokeControls(); }
                    : undefined
                }
                className={
                  swapped
                    ? "absolute right-4 top-28 z-20 h-40 w-28 cursor-pointer rounded-2xl border border-white/20 object-cover shadow-2xl transition-all duration-500 active:scale-95"
                    : "call-remote-video absolute inset-0 z-0 h-full w-full bg-black object-cover transition-opacity duration-500"
                }
                style={
                  swapped
                    ? undefined
                    : {
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: "translateZ(0)",
                        opacity: remoteVideoReady ? 1 : 0,
                        pointerEvents: remoteVideoReady ? "auto" : "none",
                      }
                }
              />
              <div
                role={remoteVideoReady ? "button" : undefined}
                tabIndex={remoteVideoReady ? 0 : undefined}
                aria-label={
                  swapped
                    ? "Tap to return to the camera preview"
                    : remoteVideoReady
                      ? "Drag to move the camera preview, or tap to swap cameras"
                      : "Live camera preview"
                }
                title={remoteVideoReady ? "Drag to move · tap to swap cameras" : undefined}
                onPointerDown={remoteVideoReady && !swapped ? beginLocalTileDrag : undefined}
                onPointerMove={remoteVideoReady && !swapped ? moveLocalTile : undefined}
                onPointerUp={remoteVideoReady && !swapped ? endLocalTileDrag : undefined}
                onPointerCancel={remoteVideoReady && !swapped ? cancelLocalTileDrag : undefined}
                onClick={(event) => {
                  if (!remoteVideoReady) return;
                  event.stopPropagation();
                  if (suppressLocalTileClick.current) return;
                  pokeControls();
                  setSwapped((current) => !current);
                }}
                onKeyDown={(event) => {
                  if (!remoteVideoReady) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    pokeControls();
                    setSwapped((current) => !current);
                  }
                }}
                className={
                  localPreviewFullScreen
                    ? `absolute inset-0 z-10 h-full w-full overflow-hidden bg-black transition-all duration-500 ${
                        swapped ? "cursor-pointer" : ""
                      }`
                    : "absolute right-4 top-28 z-20 h-40 w-28 touch-none cursor-grab overflow-hidden rounded-2xl border-2 border-white/75 bg-zinc-900 shadow-[0_14px_40px_rgba(0,0,0,0.6)] transition-all duration-500 active:cursor-grabbing"
                }
                style={
                  localPreviewFullScreen
                    ? undefined
                    : { transform: `translate3d(${localTileOffset.x}px, ${localTileOffset.y}px, 0)` }
                }
              >
                <video
                  ref={localVideo}
                  autoPlay
                  playsInline
                  muted
                  preload="none"
                  className="h-full w-full bg-black object-cover transition-transform duration-500"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: facingMode === "user" ? "scaleX(-1)" : "none",
                  }}
                />
              </div>
              <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/55 via-transparent to-black/75" />
            </>
          )}

          <audio
            ref={remoteAudio}
            autoPlay
            playsInline
            muted={false}
            onLoadedMetadata={playRemoteMedia}
            className="hidden"
          />

          {phase !== "incoming" && (
            <div className={`absolute left-1/2 top-[max(1.25rem,calc(env(safe-area-inset-top,0px)+0.5rem))] z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm font-semibold tracking-[0.12em] text-white/90 shadow-xl backdrop-blur-2xl transition-all duration-300 ${
              controlsVisible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
            }`}>
              <span>{phase === "active" ? callClock : statusText}</span>
              <span className="flex items-center gap-1 text-[10px] tracking-normal text-emerald-300" title="WebRTC media is protected by DTLS-SRTP. Application-level E2EE keying is not active in this web build.">
                <LockKeyhole className="h-3 w-3" />
                Encrypted
              </span>
              {networkState === "reconnecting" && (
                <span className="flex items-center gap-1 text-[10px] tracking-normal text-amber-300">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Reconnecting
                </span>
              )}
            </div>
          )}

          {phase === "incoming" && (
            <div
              role="status"
              aria-live="assertive"
              className="pointer-events-auto flex w-full max-w-lg items-center gap-2.5 rounded-2xl border border-white/15 bg-zinc-950/95 px-3 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.58)] backdrop-blur-2xl"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-white/20 bg-white/10">
                {caller?.avatar_url ? (
                  <img
                    src={caller.avatar_url}
                    alt=""
                    aria-hidden
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {(caller?.name || "U").trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{call.peerName}</p>
                <p className="mt-0.5 truncate text-[11px] font-medium text-white/65">
                  Incoming {call.mode === "video" ? "video" : "audio"} call
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void hangup()}
                  className="flex min-h-10 items-center justify-center gap-1 rounded-full bg-red-600 px-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-red-500 active:scale-[0.97]"
                  aria-label="Decline call"
                >
                  <PhoneOff size={14} />
                  <span>Decline</span>
                </button>
                <button
                  type="button"
                  onClick={() => void accept()}
                  className="flex min-h-10 items-center justify-center gap-1 rounded-full bg-emerald-500 px-2.5 text-[11px] font-bold text-white transition-colors hover:bg-emerald-400 active:scale-[0.97]"
                  aria-label="Accept call"
                >
                  <Phone size={14} />
                  <span>Accept</span>
                </button>
              </div>
            </div>
          )}

          <div className={`active-call-dock fixed inset-x-0 bottom-0 z-50 flex justify-center px-2 transition-all duration-300 ${
            controlsVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-5 opacity-0"
          }`}>
            {phase !== "incoming" && (
              <div
                className="flex max-w-[calc(100vw-1rem)] flex-wrap items-center justify-center gap-1 rounded-[1.75rem] border border-white/15 bg-zinc-950/75 px-2 py-2 shadow-2xl backdrop-blur-2xl"
                onClick={(e) => {
                  e.stopPropagation();
                  showCallControls();
                }}
              >
                <button
                  onClick={toggleMic}
                  className={`flex w-11 shrink-0 flex-col items-center gap-1 rounded-xl px-1 py-1 transition-all active:scale-90 ${
                    micOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-600 text-white"
                  }`}
                  aria-label="Toggle microphone"
                >
                  {micOn ? <Mic size={19} /> : <MicOff size={19} />}
                  <span className="text-[9px] font-semibold">{micOn ? "Mute" : "Unmute"}</span>
                </button>
                {call.mode === "video" && (
                  <button
                    onClick={toggleCam}
                    className={`flex w-11 shrink-0 flex-col items-center gap-1 rounded-xl px-1 py-1 transition-all active:scale-90 ${
                      camOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-600 text-white"
                    }`}
                    aria-label="Toggle camera"
                  >
                    {camOn ? <Video size={19} /> : <VideoOff size={19} />}
                    <span className="text-[9px] font-semibold">Camera</span>
                  </button>
                )}
                <button
                  onClick={toggleSpeaker}
                  className={`flex w-11 shrink-0 flex-col items-center gap-1 rounded-xl px-1 py-1 transition-all active:scale-90 ${
                    speakerOn ? "bg-emerald-500/20 text-emerald-100" : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                  aria-label={speakerOn ? "Switch to earpiece" : "Switch to speaker"}
                  title={speakerOn ? "Switch to earpiece" : "Switch to speaker"}
                >
                  {speakerOn ? <Volume2 size={19} /> : <Phone size={19} />}
                  <span className="text-[9px] font-semibold">{speakerOn ? "Speaker" : "Earpiece"}</span>
                </button>
                {call.mode === "video" && (
                  <button
                    onClick={() => void flipCamera()}
                    className="flex w-11 shrink-0 flex-col items-center gap-1 rounded-xl bg-white/10 px-1 py-1 text-white transition-all hover:bg-white/20 active:scale-90"
                    aria-label="Flip camera"
                  >
                    <SwitchCamera size={19} />
                    <span className="text-[9px] font-semibold">Flip</span>
                  </button>
                )}
                {call.mode === "video" && (
                  <button
                    onClick={() => {
                      const index = CALL_VIDEO_EFFECTS.findIndex((item) => item.value === videoEffect);
                      const next = CALL_VIDEO_EFFECTS[(index + 1) % CALL_VIDEO_EFFECTS.length].value;
                      void applyVideoEffect(next);
                    }}
                    className={`flex w-11 shrink-0 flex-col items-center gap-1 rounded-xl px-1 py-1 transition-all active:scale-90 ${
                      videoEffect !== "none" ? "bg-fuchsia-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                    aria-label={`Video effect: ${CALL_VIDEO_EFFECTS.find((item) => item.value === videoEffect)?.label ?? "None"}`}
                    title={`Video effect: ${CALL_VIDEO_EFFECTS.find((item) => item.value === videoEffect)?.label ?? "None"}`}
                  >
                    <Sparkles size={18} />
                    <span className="text-[9px] font-semibold">Effect</span>
                  </button>
                )}
                {call.mode === "video" && (
                  <button
                    onClick={() => void toggleFlash()}
                    className="flex w-11 shrink-0 flex-col items-center gap-1 rounded-xl bg-white/10 px-1 py-1 text-white transition-all hover:bg-white/20 active:scale-90"
                    aria-label="Toggle flashlight"
                  >
                    {flashOn ? <Zap size={17} className="text-yellow-400" /> : <ZapOff size={17} />}
                    <span className="text-[9px] font-semibold">Flash</span>
                  </button>
                )}
                <button
                  onClick={() => void hangup()}
                  className="flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-full bg-red-600 text-white shadow-[0_8px_24px_-6px_rgba(220,38,38,0.8)] transition-transform active:scale-90"
                  aria-label="End call"
                >
                  <PhoneOff size={20} />
                  <span className="text-[9px] font-bold">End</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </CallCtx.Provider>
  );
}
