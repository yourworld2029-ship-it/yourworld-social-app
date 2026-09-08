import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Bell, Mic, MicOff, PhoneOff, Phone, Video, VideoOff, SwitchCamera, Zap, ZapOff, Volume2, VolumeX, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  enableCallNotifications,
  hasSeenCallNotificationBanner,
  markCallNotificationBannerSeen,
  readCallNotificationAction,
  registerCallServiceWorker,
  showIncomingCallNotification,
  type CallNotificationAction,
} from "@/lib/call-notifications";
import {
  CALL_ICE_SERVERS,
  getCallMedia,
  getCallVideo,
  tuneCallVideoSender,
} from "@/lib/webrtc-media";

/**
 * The deployed calls/user_blocks schema is newer than generated Supabase types.
 * Keep that compatibility boundary local rather than modifying generated code.
 */
const callDb = supabase as unknown as {
  // Generated types lag the verified live schema; keep the escape hatch here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: "calls" | "user_blocks") => any;
};

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

function optimizeVideoSdp(sdp: string) {
  const lines = sdp.split("\r\n");
  const qualityPayloads = new Set<string>();
  let inVideoSection = false;
  let hasVideoBitrate = false;
  const output: string[] = [];
  for (const line of lines) {
    if (line.startsWith("m=")) inVideoSection = line.startsWith("m=video ");
    if (inVideoSection && line.startsWith("m=video ")) {
      output.push(line);
      output.push("b=AS:3500");
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
        if (!hasVideoBitrate) output.push("b=AS:3500");
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
            `${line};x-google-start-bitrate=2500;x-google-min-bitrate=1000;x-google-max-bitrate=3500`,
          );
          continue;
        }
      }
    }
    output.push(line);
  }
  return output.join("\r\n");
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
    mode: CallMode;
  }) => Promise<void>;
  /** The authenticated Supabase user id. Signed-out visitors cannot call. */
  myCallId: string | null;
  isGuest: boolean;
};

const CallCtx = createContext<Ctx>({ startCall: async () => {}, myCallId: null, isGuest: true });
export const useCall = () => useContext(CallCtx);

/** Builds a looping ring tone as a WAV data URL playable by an HTML5 <audio> element. */
function buildRingToneUrl(freqs: number[], onSec: number, cycleSec: number): string {
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
    if (t < onSec) {
      for (const f of freqs) v += Math.sin(2 * Math.PI * f * t);
      v /= freqs.length;
      // short fades to avoid clicks
      const fade = Math.min(1, t / 0.02, (onSec - t) / 0.02);
      v *= Math.max(0, fade) * 0.35;
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

/** HTML5 <audio> ringtone: incoming ring, or ringback while our outgoing call connects. */
function useRingtone(kind: "incoming" | "ringback" | null) {
  useEffect(() => {
    if (!kind || typeof window === "undefined") return;
    let audio: HTMLAudioElement | null = null;
    try {
      if (kind === "incoming") {
        incomingUrl ??= buildRingToneUrl([440, 480], 1.2, 3);
      } else {
        ringbackUrl ??= buildRingToneUrl([440, 480], 1, 4);
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
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [flashOn, setFlashOn] = useState(false);
  /** WhatsApp-style: tap the PiP to swap which stream fills the screen. */
  const [swapped, setSwapped] = useState(false);
  const [peerAvatar, setPeerAvatar] = useState<string | null>(null);
  /** Auto-hiding call controls: visible on activity, hidden after 3s. */
  const [controlsVisible, setControlsVisible] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const hideTimer = useRef<number | null>(null);
  // Cancels a call that is never answered so neither side rings forever.
  const ringTimer = useRef<number | null>(null);



  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const sigRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingLocalIce = useRef<RTCIceCandidateInit[]>([]);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const fallbackSignals = useRef<Record<string, StoredSignal>>({});
  const receiveSignalRef = useRef<((payload: Record<string, unknown>) => Promise<void>) | null>(null);
  const localVideo = useRef<HTMLVideoElement | null>(null);
  const remoteVideo = useRef<HTMLVideoElement | null>(null);
  const remoteAudio = useRef<HTMLAudioElement | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const remoteAudioMuted = useRef(false);
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
  const logCallOutcomeRef = useRef<((outcome: CallOutcome) => Promise<void>) | null>(null);
  const pendingNotificationAction = useRef<CallNotificationAction | null>(null);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);


  useRingtone(
    phase === "incoming" ? "incoming" : phase === "outgoing" ? "ringback" : null,
  );

  useEffect(() => {
    void registerCallServiceWorker();
  }, []);

  useEffect(() => {
    if (!me || typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default" && !hasSeenCallNotificationBanner()) {
      setShowNotificationBanner(true);
    }
  }, [me]);

  useEffect(() => {
    const fromUrl = readCallNotificationAction();
    if (fromUrl) pendingNotificationAction.current = fromUrl;

    const onMessage = (event: MessageEvent<CallNotificationAction & { type?: string }>) => {
      if (event.data?.type !== "call-notification-click" || !event.data.callId) return;
      pendingNotificationAction.current = event.data;
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);
    return () => navigator.serviceWorker?.removeEventListener("message", onMessage);
  }, []);

  /* ---------- auto-hiding controls (Social + Orbit video calls) ---------- */
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

  const toggleSpeaker = useCallback(() => {
    setSpeakerOn((on) => {
      const next = !on;
      remoteAudioMuted.current = !next;
      if (remoteAudio.current) remoteAudio.current.muted = !next;
      if (remoteVideo.current) remoteVideo.current.muted = !next;
      return next;
    });
  }, []);

  /* ---------- identity ---------- */
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setAuthId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthId(session?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  /* ---------- teardown ---------- */
  const teardown = useCallback((options?: { keepSignal?: boolean }) => {
    stopAllRingtones();
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

    setPhase("idle");
    setCall(null);
    setMicOn(true);
    setCamOn(true);
    setSpeakerOn(true);
    remoteAudioMuted.current = false;
    setFacingMode("user");
    setFlashOn(false);
    setSwapped(false);
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

  const attachStreams = useCallback(() => {
    if (localVideo.current && localStream.current) {
      localVideo.current.srcObject = localStream.current;
      void localVideo.current.play().catch(() => {});
    }
    if (remoteStream.current) {
      if (callRef.current?.mode === "video" && remoteVideo.current) {
        remoteVideo.current.srcObject = remoteStream.current;
        remoteVideo.current.muted = false;
        void remoteVideo.current.play().catch((e) => console.log("Autoplay error:", e));
      }
      if (callRef.current?.mode !== "video" && remoteAudio.current) {
        remoteAudio.current.srcObject = remoteStream.current;
        remoteAudio.current.muted = false;
        void remoteAudio.current.play().catch((e) => console.log("Autoplay error:", e));
      }
    }
  }, []);

  const getMedia = useCallback(async (mode: CallMode) => {
    const stream = await getCallMedia(mode, facingMode);
    for (const track of stream.getVideoTracks()) {
      track.contentHint = "detail";
    }
    localStream.current = stream;
    attachStreams();
    return stream;
  }, [attachStreams, facingMode]);

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
      try {
        if (c.threadId) {
          await supabase.from("messages" as never).insert({
            sender_id: meId,
            receiver_id: c.peerId,
            content: text,
            media_url: null,
            voice_note_url: null,
            metadata: {},
          } as never);
        } else {
          await supabase.from("orbit_messages").insert({
            sender_id: meId,
            recipient_id: c.peerId,
            kind: "system",
            text,
          });
        }
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
        void tuneCallVideoSender(sender);
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
        // Explicitly attach the received remote stream to the main full-screen
        // <video> element immediately, then retry on the next frame in case the
        // ref wasn't bound yet (e.g. track arrives before the element mounts).
        const attachNow = () => {
          if (callRef.current?.mode === "video" && remoteVideo.current) {
            remoteVideo.current.srcObject = s;
            remoteVideo.current.muted = false;
            void remoteVideo.current.play().catch((e) => console.log("Autoplay error:", e));
          }
          if (callRef.current?.mode !== "video" && remoteAudio.current) {
            remoteAudio.current.srcObject = s;
            remoteAudio.current.muted = false;
            void remoteAudio.current.play().catch((e) => console.log("Autoplay error:", e));
          }
        };
        attachNow();
        requestAnimationFrame(attachNow);
        requestAnimationFrame(() => requestAnimationFrame(attachNow));
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          stopAllRingtones();
          connectedAt.current ??= Date.now();
          setPhase("active");
          const currentCall = callRef.current;
          if (currentCall) {
            void callDb.from("calls")
              .update({ status: "connected" })
              .eq("id", currentCall.callId);
          }
        }
        if (pc.connectionState === "failed") {
          toast.error("Call connection failed");
          const c = callRef.current;
          if (c) {
            signal({ type: "END_CALL", reason: "failed" });
            void callDb.from("calls")
              .update({ status: "ended", ended_at: new Date().toISOString() })
              .eq("id", c.callId);
          }
          void logCallOutcome("missed");
          teardown();
        }
      };
      return pc;
    },
    [signal, teardown, logCallOutcome],
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
              const offer = await peer.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: mode === "video",
              });
              const optimizedOffer = {
                ...offer,
                sdp: optimizeVideoSdp(offer.sdp ?? ""),
              };
              await peer.setLocalDescription(optimizedOffer);
              signal({ type: "CALL_OFFER", sdp: peer.localDescription });
            } else if (
              (type === "CALL_OFFER" || type === "offer") &&
              !isCaller &&
              phaseRef.current !== "incoming" &&
              !pc?.remoteDescription
            ) {
              const remoteOffer = asSessionDescription(payload.sdp);
              if (!remoteOffer) return;
              const stream = localStream.current ?? (await getMedia(mode));
              const peer = pcRef.current ?? createPeer(stream);
              await peer.setRemoteDescription(new RTCSessionDescription(remoteOffer));
              await flushIce();
              const answer = await peer.createAnswer();
              const optimizedAnswer = {
                ...answer,
                sdp: optimizeVideoSdp(answer.sdp ?? ""),
              };
              await peer.setLocalDescription(optimizedAnswer);
              const answerDescription = peer.localDescription;
              if (!answerDescription) return;
              // Persist the answer first. Broadcast is only an acceleration
              // path and must never race the database source of truth.
              void sigRef.current?.send({
                type: "broadcast",
                event: "CALL_ANSWER",
                payload: { type: "CALL_ANSWER", callId, sdp: answerDescription },
              });
              await persistDescription(callId, "answer", answerDescription);
              const { error: statusError } = await callDb
                .from("calls")
                .update({ status: "connected" })
                .eq("id", callId);
              if (statusError) console.error("[call] connected status update failed", statusError);
              setPhase("connecting");
            } else if ((type === "CALL_ANSWER" || type === "answer") && pc && !pc.remoteDescription) {
              const remoteAnswer = asSessionDescription(payload.sdp);
              if (!remoteAnswer) return;
              await pc.setRemoteDescription(new RTCSessionDescription(remoteAnswer));
              await flushIce();
              stopAllRingtones();
              connectedAt.current ??= Date.now();
              setPhase("active");
              const currentCall = callRef.current;
              if (currentCall) {
                void callDb.from("calls")
                  .update({ status: "connected" })
                  .eq("id", currentCall.callId);
              }
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
        receiveSignalRef.current = receive;
        const broadcastEvents = ["CALL_ACCEPT", "CALL_OFFER", "CALL_ANSWER", "ICE_CANDIDATE", "END_CALL"] as const;
        for (const event of broadcastEvents) {
          ch.on("broadcast", { event }, ({ payload }) => {
            void receive(payload as Record<string, unknown>, event);
          });
        }
        // Keep accepting the older generic event for calls started by a tab
        // that has not refreshed yet.
        ch.on("broadcast", { event: "signal" }, ({ payload }) => {
          void receive(payload as Record<string, unknown>);
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
            if (stored?.sender_id && stored.sender_id !== meRef.current && stored.payload) {
              void (async () => {
                await receive(stored.payload!);
                for (const candidate of stored.candidates ?? []) await receive({ type: "ICE_CANDIDATE", candidate });
                const remoteCandidates = isCaller
                  ? stored.receiver_candidates
                  : stored.caller_candidates;
                for (const candidate of remoteCandidates ?? []) await receive({ type: "ICE_CANDIDATE", candidate });
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
      if (await blocked(row.caller_id)) {
        void callDb.from("calls").update({ status: "declined", ended_at: new Date().toISOString() }).eq("id", row.id);
        return;
      }
      markSeen(row.id);
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
      setCall(nextCall);
      callRef.current = nextCall;
      setPhase("incoming");
      void openSignalChannelRef.current?.(row.id, row.call_type, false);
      toast.message(`Incoming ${row.call_type === "video" ? "video" : "audio"} call`);
      if (document.visibilityState !== "visible") {
        void showIncomingCallNotification({
          callId: row.id,
          mode: row.call_type,
          peerName,
        });
      }
    };
    const update = ({ new: raw }: { new: unknown }) => {
      const row = raw as CallRow;
      if (row.receiver_id !== me2 && row.caller_id !== me2) return;
      if (row.receiver_id === me2 && row.status === "ringing") void ring(row);
      if (row.id === callRef.current?.callId && row.status === "connected") {
        stopAllRingtones();
        connectedAt.current ??= Date.now();
        setPhase("active");
      }
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
      if (stored?.sender_id && stored.sender_id !== me2 && stored.payload) {
        void (async () => {
          await receiveSignalRef.current?.(stored.payload!);
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
    async ({ threadId, peerId, peerName, mode }) => {
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
        await getMedia(mode);
      } catch {
        toast.error("Camera / microphone permission denied");
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
          sdp: optimizeVideoSdp(offer.sdp ?? ""),
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
        const nextCall = { callId, mode, peerId: target, peerName: peerName ?? "Calling…", incoming: false, threadId: threadId ?? null };
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

  const accept = useCallback(async () => {
    if (!call || !authId) return;
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
    setPhase("connecting");
    try {
      await getMedia(call.mode);
    } catch {
      toast.error("Camera / microphone permission denied");
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
      // The caller listens for this broadcast to generate the offer.
      void sigRef.current?.send({
        type: "broadcast",
        event: "CALL_ACCEPT",
        payload: { type: "CALL_ACCEPT", callId: call.callId },
      });
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


  const toggleMic = () => {
    const track = localStream.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    }
  };
  const toggleCam = () => {
    const track = localStream.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    }
  };

  const toggleFlash = useCallback(async () => {
    const track = localStream.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({
        advanced: [{ torch: !flashOn } as MediaTrackConstraintSet],
      } as MediaTrackConstraints);
      setFlashOn(!flashOn);
    } catch {
      toast.error("Flashlight not supported on this device");
    }
  }, [flashOn]);

  const flipCamera = useCallback(async () => {
    const next = facingMode === "user" ? "environment" : "user";
    const oldTrack = localStream.current?.getVideoTracks()[0] ?? null;
    // Most phones can't open both cameras at once — release the old one first.
    if (oldTrack) {
      oldTrack.stop();
      localStream.current?.removeTrack(oldTrack);
    }
    setFlashOn(false);
    try {
      const newStream = await getCallVideo(next);
      const newVideoTrack = newStream.getVideoTracks()[0];
      newVideoTrack.contentHint = "detail";
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
    () => ({ startCall, myCallId: me, isGuest }),
    [startCall, me, isGuest],
  );

  const statusText =
    phase === "incoming"
          ? `Incoming ${call?.mode === "video" ? "video" : "audio"} call…`
      : phase === "outgoing"
        ? "Ringing…"
        : phase === "connecting"
          ? "Connecting…"
          : "Connected";
  const callerAvatar = call?.avatarUrl ?? peerAvatar;
  const callClock = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(
    elapsedSeconds % 60,
  ).padStart(2, "0")}`;
  const enableNotifications = async () => {
    markCallNotificationBannerSeen();
    setShowNotificationBanner(false);
    const result = await enableCallNotifications();
    if (result.permission === "granted") toast.success("Call and message notifications enabled");
    else if (result.permission === "denied") toast.message("Notifications remain disabled");
  };

  return (
    <CallCtx.Provider value={value}>
      {children}
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
          className={`fixed inset-0 z-[100] flex flex-col justify-between overflow-hidden p-6 text-white ${
            phase === "incoming"
              ? "bg-black/90 backdrop-blur-3xl"
              : "bg-zinc-950"
          }`}
          onClick={phase === "incoming" ? undefined : pokeControls}
        >
          {phase !== "incoming" && call.mode === "audio" && (
            <div className="absolute inset-0 z-0 overflow-hidden bg-[radial-gradient(circle_at_50%_34%,rgba(99,102,241,0.35),transparent_58%),linear-gradient(160deg,#09090b,#18122e_55%,#09090b)]">
              {peerAvatar && (
                <img
                  src={peerAvatar}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full scale-125 object-cover opacity-35 blur-3xl"
                />
              )}
              <div className="absolute inset-0 bg-black/35 backdrop-blur-3xl" />
              <div className="absolute left-1/2 top-[40%] flex h-64 w-64 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400/10" />
                <span
                  className="absolute inset-5 animate-ping rounded-full bg-fuchsia-400/10"
                  style={{ animationDelay: "0.7s" }}
                />
                <span className="absolute inset-10 rounded-full border border-white/20 bg-white/5 backdrop-blur-xl" />
                {peerAvatar ? (
                  <img
                    src={peerAvatar}
                    alt={call.peerName}
                    className="relative h-32 w-32 rounded-full object-cover shadow-[0_0_70px_rgba(129,140,248,0.5)]"
                  />
                ) : (
                  <div className="relative grid h-32 w-32 place-items-center rounded-full bg-white/10 text-5xl font-bold shadow-[0_0_70px_rgba(129,140,248,0.5)] backdrop-blur-xl">
                    {call.peerName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
            </div>
          )}
          {call.mode === "video" && (
            <>
              <video
                ref={remoteVideo}
                autoPlay
                playsInline
                onClick={
                  swapped
                    ? (e) => { e.stopPropagation(); setSwapped(false); }
                    : undefined
                }
                className={
                  swapped
                    ? "absolute right-4 top-28 z-20 h-40 w-28 cursor-pointer rounded-2xl border border-white/20 object-cover shadow-2xl transition-all active:scale-95"
                    : "absolute inset-0 z-0 h-full w-full object-cover"
                }
                 style={{ transform: "translateZ(0)" }}
              />
              <video
                ref={localVideo}
                autoPlay
                playsInline
                muted
                onClick={
                  swapped
                    ? undefined
                    : (e) => { e.stopPropagation(); setSwapped(true); }
                }
                className={
                  swapped
                    ? "absolute inset-0 z-0 h-full w-full object-cover"
                    : "absolute right-4 top-28 z-20 h-40 w-28 cursor-pointer rounded-2xl border border-white/20 object-cover shadow-2xl transition-all active:scale-95"
                }
                 style={{ transform: "translateZ(0)" }}
              />
              {phase !== "incoming" && (
                <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/55 via-transparent to-black/75" />
              )}
              {phase !== "incoming" && (
                <div
                  className={`absolute right-3 top-3 z-[9999] flex items-center gap-2 rounded-full border border-white/15 bg-black/40 p-1.5 shadow-lg backdrop-blur-xl transition-all duration-300 ${
                    controlsVisible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => void toggleFlash()}
                    className="grid h-9 w-9 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/10 active:scale-90"
                    aria-label="Toggle flashlight"
                  >
                    {flashOn ? <Zap size={17} className="text-yellow-400" /> : <ZapOff size={17} />}
                  </button>
                </div>
              )}
            </>
          )}

          <audio ref={remoteAudio} autoPlay className="hidden" />

          {phase !== "incoming" && (
            <div className="absolute left-1/2 top-[max(1.25rem,env(safe-area-inset-top,0px))] z-30 -translate-x-1/2 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm font-semibold tracking-[0.18em] text-white/90 shadow-xl backdrop-blur-2xl">
              {phase === "active" ? callClock : statusText}
            </div>
          )}

          {phase === "incoming" ? (
            <>
              {/* Ultra-luxury cyber-glass caller backdrop */}
              <div className="absolute inset-0 z-0 overflow-hidden bg-[radial-gradient(circle_at_50%_38%,rgba(168,85,247,0.34),transparent_36%),radial-gradient(circle_at_50%_72%,rgba(6,182,212,0.12),transparent_48%)]">
                {callerAvatar ? (
                  <img
                    src={callerAvatar}
                    alt=""
                    aria-hidden
                    className="h-full w-full scale-125 object-cover opacity-20 blur-3xl"
                  />
                ) : null}
                <div className="absolute inset-0 bg-black/45 backdrop-blur-3xl" />
              </div>

              <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-24 pt-12">
                <div className="relative flex h-52 w-52 items-center justify-center">
                  <span className="absolute h-36 w-36 scale-125 animate-pulse rounded-full border border-fuchsia-400/50 bg-fuchsia-500/10 opacity-40 shadow-[0_0_55px_rgba(217,70,239,0.5)]" />
                  <span
                    className="absolute h-36 w-36 scale-[1.45] animate-pulse rounded-full border border-cyan-300/40 bg-cyan-400/5 opacity-40 shadow-[0_0_70px_rgba(34,211,238,0.35)]"
                    style={{ animationDelay: "0.7s" }}
                  />
                  <span className="absolute h-44 w-44 rounded-full border border-white/15 bg-white/5 shadow-[0_0_70px_rgba(168,85,247,0.28)] backdrop-blur-xl" />
                  <div className="relative grid h-36 w-36 place-items-center overflow-hidden rounded-full border-2 border-white/40 shadow-[0_0_50px_rgba(168,85,247,0.4)]">
                    {callerAvatar ? (
                      <img
                        src={callerAvatar}
                        alt={call.peerName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-fuchsia-600 via-purple-600 to-cyan-500 text-5xl font-black text-white shadow-[0_0_50px_rgba(217,70,239,0.5)]">
                        {call.peerName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-col items-center gap-3 text-center">
                  <h2 className="mt-6 text-3xl font-extrabold tracking-wider text-white drop-shadow-md">
                    {call.peerName}
                  </h2>
                  <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 shadow-[0_0_24px_rgba(168,85,247,0.25)] backdrop-blur-2xl">
                    {call.mode === "video" ? (
                      <Video className="h-4 w-4 text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.9)]" />
                    ) : (
                      <Phone className="h-4 w-4 text-violet-300 drop-shadow-[0_0_8px_rgba(196,181,253,0.8)]" />
                    )}
                    <span>{call.mode === "video" ? "Incoming Video Call..." : "Incoming Audio Call..."}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div
              className={`relative z-10 mt-12 flex flex-col gap-1 px-2 transition-opacity duration-300 ${
                controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <h2 className="text-lg font-bold drop-shadow-lg">{call.peerName}</h2>
              <span className="text-xs font-bold text-emerald-400 drop-shadow-lg">
                {phase === "active" ? "HD connection" : statusText}
              </span>
            </div>
          )}

          <div className="relative z-10 mb-[max(1.5rem,env(safe-area-inset-bottom,0px))] flex items-center justify-center gap-6">
            {phase === "incoming" ? (
              <div className="flex w-full items-center justify-center gap-16 px-4">
                <button
                  onClick={() => void hangup()}
                  className="flex flex-col items-center gap-2.5 text-white/80 transition-transform active:scale-90"
                  aria-label="Decline call"
                >
                  <span className="grid h-16 w-16 place-items-center rounded-full border border-red-500/50 bg-red-500/20 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-colors hover:bg-red-600">
                    <PhoneOff size={26} />
                  </span>
                  <span className="text-xs font-medium">Decline</span>
                </button>
                <button
                  onClick={() => void accept()}
                  className="flex flex-col items-center gap-2.5 text-white transition-transform active:scale-90"
                  aria-label="Accept call"
                >
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_0_35px_rgba(16,185,129,0.6)] transition-colors hover:bg-emerald-600">
                    <Phone size={26} />
                  </span>
                  <span className="text-xs font-medium">Accept</span>
                </button>
              </div>
            ) : (
                <div
                 className={`flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2.5 shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
                  controlsVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={toggleMic}
                  className={`grid h-11 w-11 place-items-center rounded-full transition-all active:scale-90 ${
                    micOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-600 text-white"
                  }`}
                  aria-label="Toggle microphone"
                >
                  {micOn ? <Mic size={19} /> : <MicOff size={19} />}
                </button>
                {call.mode === "video" && (
                  <button
                    onClick={toggleCam}
                    className={`grid h-11 w-11 place-items-center rounded-full transition-all active:scale-90 ${
                      camOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-600 text-white"
                    }`}
                    aria-label="Toggle camera"
                  >
                    {camOn ? <Video size={19} /> : <VideoOff size={19} />}
                  </button>
                )}
                <button
                  onClick={toggleSpeaker}
                  className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-90"
                  aria-label="Toggle speaker"
                >
                  {speakerOn ? <Volume2 size={19} /> : <VolumeX size={19} />}
                </button>
                {call.mode === "video" && (
                  <button
                    onClick={() => void flipCamera()}
                    className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-90"
                    aria-label="Flip camera"
                  >
                    <SwitchCamera size={19} />
                  </button>
                )}
                <button
                  onClick={() => void hangup()}
                  className="grid h-12 w-12 place-items-center rounded-full bg-red-600 text-white shadow-[0_8px_24px_-6px_rgba(220,38,38,0.8)] transition-transform active:scale-90"
                  aria-label="End call"
                >
                  <PhoneOff size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </CallCtx.Provider>
  );
}
