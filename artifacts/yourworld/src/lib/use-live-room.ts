import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type {
  LiveCommentRow,
  LiveProfile,
} from "@/lib/live-data";
import {
  createLiveComment,
  getPublicLiveProfiles,
  loadLiveComments,
  loadLiveStreamStatus,
  recordLiveStreamPeak,
} from "@/lib/live-data";
import type {
  LiveStreamComment,
  LiveStreamReaction,
} from "@/components/yw/LiveStreamHud";

type RoomMode = "broadcaster" | "viewer";

type PresenceMeta = {
  user_id: string;
  peer_id: string;
  role: RoomMode;
  username: string;
  avatar_url: string | null;
};

type SignalMessage = {
  kind: "join" | "offer" | "answer" | "ice" | "ended";
  from: string;
  to: string;
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

function createPeerId() {
  return globalThis.crypto?.randomUUID?.() ??
    `live-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function asSignalMessage(value: unknown): SignalMessage | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<SignalMessage>;
  if (
    typeof candidate.kind !== "string" ||
    typeof candidate.from !== "string" ||
    typeof candidate.to !== "string"
  ) {
    return null;
  }
  if (
    !["join", "offer", "answer", "ice", "ended"].includes(candidate.kind)
  ) {
    return null;
  }
  return candidate as SignalMessage;
}

function asCommentRow(value: unknown): LiveCommentRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<LiveCommentRow>;
  if (
    typeof row.id !== "string" ||
    typeof row.stream_id !== "string" ||
    typeof row.user_id !== "string" ||
    typeof row.message !== "string" ||
    typeof row.created_at !== "string"
  ) {
    return null;
  }
  return row as LiveCommentRow;
}

export function useLiveRoom({
  streamId,
  mode,
  userId,
  isGuestViewer = false,
  username,
  avatarUrl,
  localStream,
}: {
  streamId: string;
  mode: RoomMode;
  userId: string;
  isGuestViewer?: boolean;
  username: string;
  avatarUrl: string | null;
  localStream: MediaStream | null;
}) {
  const peerIdRef = useRef(createPeerId());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const peerConnectionsRef = useRef(new Map<string, RTCPeerConnection>());
  const pendingIceRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localStreamRef = useRef(localStream);
  const viewerSessionIdRef = useRef<string | null>(null);
  const viewerHeartbeatTimerRef = useRef<number | null>(null);
  const watchSessionStartPendingRef = useRef(false);
  const peakViewerCountRef = useRef(0);
  const isEndedRef = useRef(false);
  const seenCommentsRef = useRef(new Set<string>());
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [peakViewerCount, setPeakViewerCount] = useState(0);
  const [comments, setComments] = useState<LiveCommentRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, LiveProfile>>(
    () => new Map([[userId, {
      id: userId,
      username,
      display_name: username,
      avatar_url: avatarUrl,
    }]]),
  );
  const profilesRef = useRef(profiles);
  const [reactions, setReactions] = useState<LiveStreamReaction[]>([]);
  const [commentText, setCommentText] = useState("");
  const [connected, setConnected] = useState(false);
  const [mediaConnected, setMediaConnected] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    profilesRef.current = profiles;
  }, [profiles]);

  useEffect(() => {
    isEndedRef.current = isEnded;
  }, [isEnded]);

  const replaceLocalStream = useCallback(async (nextStream: MediaStream | null) => {
    localStreamRef.current = nextStream;
    if (mode !== "broadcaster" || !nextStream) return;

    for (const peer of peerConnectionsRef.current.values()) {
      for (const track of nextStream.getTracks()) {
        const transceiver = peer
          .getTransceivers()
          .find((item) => item.receiver.track.kind === track.kind);
        const sender =
          transceiver?.sender ??
          peer.getSenders().find((item) => item.track?.kind === track.kind);
        if (sender) {
          await sender.replaceTrack(track);
        } else {
          peer.addTrack(track, nextStream);
        }
      }
    }
  }, [mode]);

  useEffect(() => {
    void replaceLocalStream(localStream).catch((cause) => {
      console.error("[live] Could not replace camera track", cause);
      setError("The camera changed, but the stream could not update.");
    });
  }, [localStream, replaceLocalStream]);

  const closePeers = useCallback(() => {
    for (const peer of peerConnectionsRef.current.values()) {
      peer.onicecandidate = null;
      peer.ontrack = null;
      peer.onconnectionstatechange = null;
      peer.close();
    }
    peerConnectionsRef.current.clear();
    pendingIceRef.current.clear();
    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current = null;
    setRemoteStream(null);
  }, []);

  const discardLocalStream = useCallback(() => {
    localStreamRef.current = null;
    closePeers();
  }, [closePeers]);

  const stopViewerWatch = useCallback(() => {
    const sessionId = viewerSessionIdRef.current;
    if (sessionId) {
      void supabase.rpc("record_live_view_heartbeat", {
        _session_id: sessionId,
      }).then(({ error: heartbeatError }) => {
        if (heartbeatError) {
          console.warn("[live] Final watch-time heartbeat failed", heartbeatError);
        }
      });
    }
    if (viewerHeartbeatTimerRef.current !== null) {
      window.clearInterval(viewerHeartbeatTimerRef.current);
      viewerHeartbeatTimerRef.current = null;
    }
    viewerSessionIdRef.current = null;
    watchSessionStartPendingRef.current = false;
  }, []);

  const closeRoom = useCallback(() => {
    closePeers();
    const channel = channelRef.current;
    channelRef.current = null;
    if (channel) void supabase.removeChannel(channel);
    stopViewerWatch();
    setConnected(false);
  }, [closePeers, stopViewerWatch]);

  const addCommentRows = useCallback(async (rows: LiveCommentRow[]) => {
    if (rows.length === 0) return;
    const additions = rows.filter((row) => {
      if (seenCommentsRef.current.has(row.id)) return false;
      seenCommentsRef.current.add(row.id);
      return true;
    });
    if (additions.length === 0) return;

    setComments((current) =>
      [...current, ...additions]
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .slice(-60),
    );

    const profileIds = additions
      .map((row) => row.user_id)
      .filter((id) => !profilesRef.current.has(id));
    if (profileIds.length > 0) {
      try {
        const fetched = await getPublicLiveProfiles(profileIds);
        const next = new Map(profilesRef.current);
        fetched.forEach((profile, id) => next.set(id, profile));
        profilesRef.current = next;
        setProfiles(next);
      } catch (cause) {
        console.warn("[live] Could not load comment profiles", cause);
      }
    }
  }, []);

  useEffect(() => {
    if (!streamId || !userId) return;
    let alive = true;
    let statusTimer = 0;
    const peerId = peerIdRef.current;
    const peerConnections = peerConnectionsRef.current;
    const pendingIce = pendingIceRef.current;
    const ICE_SERVERS: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];

    const send = (message: SignalMessage) => {
      const channel = channelRef.current;
      if (!channel) return;
      void channel.send({
        type: "broadcast",
        event: message.kind === "ended" ? "stream-ended" : "signal",
        payload: message,
      }).then((status) => {
        if (status !== "ok" && alive) {
          setError("Live room signaling is reconnecting.");
        }
      });
    };

    const closeOnePeer = (target: string) => {
      const peer = peerConnections.get(target);
      if (!peer) return;
      peer.onicecandidate = null;
      peer.ontrack = null;
      peer.onconnectionstatechange = null;
      peer.close();
      peerConnections.delete(target);
      pendingIce.delete(target);
      if (mode === "viewer") {
        remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
        remoteStreamRef.current = null;
        if (alive) setRemoteStream(null);
      }
    };

    const startWatchHeartbeat = () => {
      if (viewerHeartbeatTimerRef.current !== null) return;
      viewerHeartbeatTimerRef.current = window.setInterval(() => {
        const sessionId = viewerSessionIdRef.current;
        if (!sessionId) return;
        void supabase.rpc("record_live_view_heartbeat", {
          _session_id: sessionId,
        }).then(({ error: heartbeatError }) => {
          if (heartbeatError) {
            console.warn("[live] Watch-time heartbeat failed", heartbeatError);
          }
        });
      }, 15_000);
    };

    const startWatchSession = async () => {
      if (mode !== "viewer" || isGuestViewer) return;
      if (viewerSessionIdRef.current) {
        startWatchHeartbeat();
        return;
      }
      if (watchSessionStartPendingRef.current) return;
      watchSessionStartPendingRef.current = true;
      const { data, error: sessionError } = await supabase.rpc(
        "start_live_view_session",
        { _stream_id: streamId },
      );
      watchSessionStartPendingRef.current = false;
      if (sessionError) {
        console.error("[live] Could not start viewer watch session", sessionError);
        return;
      }
      if (!alive || typeof data !== "string") return;
      viewerSessionIdRef.current = data;
      startWatchHeartbeat();
    };

    const createPeer = (target: string) => {
      const existing = peerConnections.get(target);
      if (existing && existing.connectionState !== "closed") return existing;

      const peer = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
        iceCandidatePoolSize: 2,
      });
      peerConnections.set(target, peer);

      if (mode === "broadcaster") {
        const stream = localStreamRef.current;
        for (const kind of ["video", "audio"] as const) {
          const track = stream?.getTracks().find((item) => item.kind === kind);
          if (track && stream) {
            peer.addTrack(track, stream);
          } else {
            peer.addTransceiver(kind, { direction: "sendonly" });
          }
        }
      } else {
        peer.addTransceiver("video", { direction: "recvonly" });
        peer.addTransceiver("audio", { direction: "recvonly" });
      }

      peer.onicecandidate = (event) => {
        if (!event.candidate) return;
        send({
          kind: "ice",
          from: peerId,
          to: target,
          candidate: event.candidate.toJSON(),
        });
      };

      peer.ontrack = (event) => {
        let nextStream = event.streams[0] ?? remoteStreamRef.current;
        if (!nextStream) nextStream = new MediaStream();
        if (
          !event.streams[0] &&
          !nextStream.getTracks().some((track) => track.id === event.track.id)
        ) {
          nextStream.addTrack(event.track);
        }
        remoteStreamRef.current = nextStream;
        if (alive) setRemoteStream(nextStream);
      };

      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "connected") {
          if (alive) setError(null);
        if (alive) setMediaConnected(true);
          if (mode === "viewer") void startWatchSession();
        } else if (
          peer.connectionState === "disconnected" ||
          peer.connectionState === "failed" ||
          peer.connectionState === "closed"
        ) {
          if (mode === "viewer" && alive) setMediaConnected(false);
          if (mode === "viewer" && viewerHeartbeatTimerRef.current !== null) {
            window.clearInterval(viewerHeartbeatTimerRef.current);
            viewerHeartbeatTimerRef.current = null;
          }
          closeOnePeer(target);
          if (mode === "viewer" && alive && !isEndedRef.current) {
            window.setTimeout(() => {
              if (alive && !isEndedRef.current) {
                const channel = channelRef.current;
                const broadcaster = channel
                  ? Object.values(channel.presenceState<PresenceMeta>())
                      .flatMap((metas) => metas)
                      .find((meta) => meta.role === "broadcaster")
                  : null;
                if (broadcaster) {
                  send({
                    kind: "join",
                    from: peerId,
                    to: broadcaster.peer_id,
                  });
                }
              }
            }, 1200);
          }
        }
      };

      return peer;
    };

    const flushIce = async (target: string, peer: RTCPeerConnection) => {
      const queued = pendingIce.get(target) ?? [];
      pendingIce.delete(target);
      for (const candidate of queued) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (cause) {
          console.warn("[live] Could not apply queued ICE candidate", cause);
        }
      }
    };

    const offerInFlight = new Set<string>();
    const offerViewer = async (target: string) => {
      if (offerInFlight.has(target)) return;
      offerInFlight.add(target);
      try {
        let peer = peerConnections.get(target);
        if (peer?.connectionState === "failed" || peer?.connectionState === "closed") {
          closeOnePeer(target);
          peer = undefined;
        }
        peer ??= createPeer(target);
        if (peer.signalingState !== "stable") return;
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        const description = peer.localDescription;
        if (!description) throw new Error("Live video offer was not created.");
        send({
          kind: "offer",
          from: peerId,
          to: target,
          description,
        });
      } catch (cause) {
        console.error("[live] Could not create viewer connection", cause);
        if (alive) setError("Could not connect a viewer to the live video.");
        closeOnePeer(target);
      } finally {
        offerInFlight.delete(target);
      }
    };

    const addIce = async (message: SignalMessage) => {
      if (!message.candidate) return;
      const peer = peerConnections.get(message.from);
      if (!peer?.remoteDescription) {
        const queued = pendingIce.get(message.from) ?? [];
        queued.push(message.candidate);
        pendingIce.set(message.from, queued);
        return;
      }
      try {
        await peer.addIceCandidate(new RTCIceCandidate(message.candidate));
      } catch (cause) {
        console.warn("[live] Could not apply ICE candidate", cause);
      }
    };

    const receiveSignal = async (value: unknown) => {
      const message = asSignalMessage(value);
      if (
        !message ||
        message.to !== peerId ||
        message.from === peerId
      ) {
        return;
      }

      if (message.kind === "ended") {
        if (alive) setIsEnded(true);
        closeRoom();
        return;
      }

      if (message.kind === "ice") {
        await addIce(message);
        return;
      }

      if (mode === "broadcaster" && message.kind === "join") {
        await offerViewer(message.from);
        return;
      }

      if (mode === "broadcaster" && message.kind === "answer") {
        const peer = peerConnections.get(message.from);
        if (!peer || !message.description) return;
        if (peer.signalingState === "have-local-offer") {
          await peer.setRemoteDescription(
            new RTCSessionDescription(message.description),
          );
          await flushIce(message.from, peer);
        }
        return;
      }

      if (mode === "viewer" && message.kind === "offer") {
        if (!message.description) return;
        let peer = peerConnections.get(message.from);
        if (
          peer &&
          peer.remoteDescription?.sdp === message.description.sdp &&
          peer.localDescription
        ) {
          send({
            kind: "answer",
            from: peerId,
            to: message.from,
            description: peer.localDescription,
          });
          return;
        }
        if (peer && peer.signalingState !== "stable") {
          closeOnePeer(message.from);
          peer = undefined;
        }
        peer ??= createPeer(message.from);
        await peer.setRemoteDescription(
          new RTCSessionDescription(message.description),
        );
        await flushIce(message.from, peer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        const description = peer.localDescription;
        if (!description) throw new Error("Live video answer was not created.");
        send({
          kind: "answer",
          from: peerId,
          to: message.from,
          description,
        });
      }
    };

    const syncPresence = () => {
      const channel = channelRef.current;
      if (!channel || !alive) return;
      const entries = Object.values(
        channel.presenceState<PresenceMeta>(),
      ).flatMap((metas) => metas);
      const viewers = new Map(
        entries
          .filter((meta) => meta.role === "viewer")
          .map((meta) => [meta.peer_id, meta]),
      );
      const nextCount = viewers.size;
      setViewerCount(nextCount);

      if (mode === "broadcaster") {
        if (nextCount > peakViewerCountRef.current) {
          peakViewerCountRef.current = nextCount;
          setPeakViewerCount(nextCount);
          void recordLiveStreamPeak(streamId, nextCount).catch((cause) => {
            console.error("[live] Could not record peak viewers", cause);
            if (alive) setError("Viewer stats could not be saved.");
          });
        }
        viewers.forEach((meta) => void offerViewer(meta.peer_id));
      } else {
        const broadcaster = entries.find((meta) => meta.role === "broadcaster");
        if (broadcaster) {
          send({
            kind: "join",
            from: peerId,
            to: broadcaster.peer_id,
          });
        }
      }
    };

    const loadComments = async () => {
      try {
        const rows = await loadLiveComments(streamId);
        if (alive) await addCommentRows(rows);
      } catch (cause) {
        console.error("[live] Could not load room comments", cause);
        if (alive) setError("Live comments could not be loaded.");
      }
    };

    const onComment = (payload: { payload?: unknown }) => {
      const row = asCommentRow(payload.payload);
      if (row?.stream_id === streamId) void addCommentRows([row]);
    };

    const channel = supabase.channel(`live:${streamId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: peerId },
      },
    });
    channelRef.current = channel;
    channel
      .on("broadcast", { event: "signal" }, ({ payload }) => {
        void receiveSignal(payload).catch((cause) => {
          console.error("[live] Signaling message failed", cause);
          if (alive) setError("Could not complete the live connection.");
        });
      })
      .on("broadcast", { event: "stream-ended" }, ({ payload }) => {
        const endedMessage = asSignalMessage(payload);
        if (
          !endedMessage ||
          endedMessage.kind !== "ended" ||
          mode !== "viewer"
        ) {
          return;
        }
        void loadLiveStreamStatus(streamId, isGuestViewer).then((status) => {
          if (alive && status !== "live") {
            setIsEnded(true);
            closeRoom();
          }
        });
      })
      .on("broadcast", { event: "comment" }, onComment)
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        const id =
          payload && typeof payload.id === "string" ? payload.id : null;
        if (!id || !alive) return;
        setReactions((current) => [...current, { id }].slice(-20));
      })
      .on("presence", { event: "sync" }, syncPresence)
      .on("presence", { event: "join" }, syncPresence)
      .on("presence", { event: "leave" }, syncPresence)
      .subscribe(async (status) => {
        if (!alive) return;
        if (status === "SUBSCRIBED") {
          setConnected(true);
          setError(null);
          await channel.track({
            user_id: userId,
            peer_id: peerId,
            role: mode,
            username,
            avatar_url: avatarUrl,
          } satisfies PresenceMeta);
          if (!isGuestViewer) void loadComments();
          syncPresence();
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setConnected(false);
          if (status !== "CLOSED") {
            setError("Reconnecting to the live room…");
          }
        }
      });

    statusTimer = window.setInterval(() => {
      void loadLiveStreamStatus(streamId, isGuestViewer)
        .then((status) => {
          if (alive && status !== "live") {
            setIsEnded(true);
            closeRoom();
          }
        })
        .catch((cause) => {
          console.warn("[live] Could not refresh stream status", cause);
        });
    }, 12_000);

    return () => {
      alive = false;
      window.clearInterval(statusTimer);
      stopViewerWatch();
      closePeers();
      setMediaConnected(false);
      const currentChannel = channelRef.current;
      if (currentChannel === channel) channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [
    addCommentRows,
    avatarUrl,
    closePeers,
    closeRoom,
    discardLocalStream,
    isGuestViewer,
    mode,
    streamId,
    stopViewerWatch,
    userId,
    username,
  ]);

  const sendComment = useCallback(async () => {
    const message = commentText.trim();
    if (!message || !userId || isEnded || isGuestViewer) return;
    const optimisticId = `pending-${createPeerId()}`;
    const optimisticComment: LiveCommentRow = {
      id: optimisticId,
      stream_id: streamId,
      user_id: userId,
      message,
      created_at: new Date().toISOString(),
    };
    setComments((current) =>
      [...current, optimisticComment]
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .slice(-60),
    );
    setCommentText("");
    try {
      const row = await createLiveComment(streamId, userId, message);
      setComments((current) =>
        current.filter((comment) => comment.id !== optimisticId),
      );
      await addCommentRows([row]);
      const channel = channelRef.current;
      if (channel) {
        void channel.send({
          type: "broadcast",
          event: "comment",
          payload: row,
        });
      }
    } catch (cause) {
      console.error("[live] Could not send comment", cause);
      setComments((current) =>
        current.filter((comment) => comment.id !== optimisticId),
      );
      setCommentText((current) => current || message);
      setError(
        cause instanceof Error
          ? cause.message
          : "Your comment could not be sent.",
      );
    }
  }, [addCommentRows, commentText, isEnded, isGuestViewer, streamId, userId]);

  const sendReaction = useCallback(() => {
    if (isEnded) return;
    const id = createPeerId();
    setReactions((current) => [...current, { id }].slice(-20));
    const channel = channelRef.current;
    if (channel) {
      void channel.send({
        type: "broadcast",
        event: "reaction",
        payload: { id },
      });
    }
  }, [isEnded]);

  const announceStreamEnded = useCallback(async () => {
    const channel = channelRef.current;
    if (channel) {
      try {
        await channel.send({
          type: "broadcast",
          event: "stream-ended",
          payload: {
            kind: "ended",
            from: peerIdRef.current,
            to: "all",
          },
        });
      } catch (cause) {
        console.warn("[live] Could not announce room end", cause);
      }
    }
    setIsEnded(true);
    closeRoom();
  }, [closeRoom]);

  const hudComments = useMemo<LiveStreamComment[]>(
    () =>
      comments.map((comment) => {
        const profile = profiles.get(comment.user_id);
        return {
          id: comment.id,
          username: profile?.username || "user",
          avatarUrl: profile?.avatar_url ?? null,
          message: comment.message,
        };
      }),
    [comments, profiles],
  );

  return {
    connected,
    mediaConnected,
    viewerCount,
    peakViewerCount,
    remoteStream,
    replaceLocalStream,
    comments: hudComments,
    commentText,
    setCommentText,
    sendComment,
    reactions,
    sendReaction,
    isEnded,
    error,
    closeRoom,
    discardLocalStream,
    announceStreamEnded,
  };
}