import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Camera, Radio, Users, X } from "lucide-react";
import { LiveStreamHud } from "@/components/yw/LiveStreamHud";
import { useAuth } from "@/lib/auth-store";
import {
  endLiveStream,
  loadLiveStream,
  loadLiveStreamStatus,
  type ActiveLiveStream,
} from "@/lib/live-data";
import { discardHandedOffLiveStream, takeHandedOffLiveStream } from "@/lib/live-stream-registry";
import { historyBackOr } from "@/lib/navigation";
import { useLiveRoom } from "@/lib/use-live-room";

export const Route = createFileRoute("/live/$streamId")({
  head: () => ({
    meta: [
      { title: "Live — YourWorld" },
      {
        name: "description",
        content: "Watch or host a live broadcast on YourWorld.",
      },
    ],
  }),
  component: LiveRoomPage,
});

function LiveRoomPage() {
  const { streamId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const [room, setRoom] = useState<ActiveLiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(null);
    void loadLiveStream(streamId)
      .then((next) => {
        if (!alive) return;
        if (!next) {
          setLoadError("This live broadcast is unavailable.");
          return;
        }
        setRoom(next);
      })
      .catch((cause) => {
        console.error("[live] Could not load stream", cause);
        if (alive) {
          setLoadError(
            cause instanceof Error
              ? cause.message
              : "This live broadcast could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [streamId]);

  if (loading || authLoading) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#120d12] text-sm text-white/70">
        Connecting to live…
      </main>
    );
  }

  if (!room || !user) {
    return (
      <UnavailableLiveRoom
        message={loadError ?? "This live broadcast is unavailable."}
      />
    );
  }

  const isBroadcaster = room.broadcaster_id === user.id;
  if (room.status === "ended") {
    if (!isBroadcaster) {
      return <UnavailableLiveRoom message="This live broadcast has ended." />;
    }
    return (
      <LiveSummary
        durationSeconds={Math.max(
          0,
          Math.floor(
            (Date.parse(room.ended_at ?? room.started_at) -
              Date.parse(room.started_at)) /
              1000,
          ),
        )}
        peakViewerCount={room.peak_viewers}
      />
    );
  }

  return (
    <LiveRoomSession
      key={room.id}
      room={room}
      userId={user.id}
      userMetadata={(user.user_metadata ?? {}) as Record<string, unknown>}
      email={user.email ?? ""}
      isBroadcaster={isBroadcaster}
    />
  );
}

function LiveRoomSession({
  room,
  userId,
  userMetadata,
  email,
  isBroadcaster,
}: {
  room: ActiveLiveStream;
  userId: string;
  userMetadata: Record<string, unknown>;
  email: string;
  isBroadcaster: boolean;
}) {
  const navigate = useNavigate();
  const username =
    (typeof userMetadata.username === "string" && userMetadata.username) ||
    (typeof userMetadata.user_name === "string" && userMetadata.user_name) ||
    email.split("@")[0] ||
    "user";
  const avatarUrl =
    (typeof userMetadata.avatar_url === "string" && userMetadata.avatar_url) ||
    (typeof userMetadata.profile_pic === "string" && userMetadata.profile_pic) ||
    (typeof userMetadata.profile_image === "string" &&
      userMetadata.profile_image) ||
    (typeof userMetadata.picture === "string" && userMetadata.picture) ||
    null;
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraRequestIdRef = useRef(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [ending, setEnding] = useState(false);
  const [summary, setSummary] = useState<{
    durationSeconds: number;
    peakViewerCount: number;
  } | null>(null);
  const [endError, setEndError] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(() =>
    Math.max(
      0,
      Math.floor((Date.now() - Date.parse(room.started_at)) / 1000),
    ),
  );
  const endedRef = useRef(false);

  const liveRoom = useLiveRoom({
    streamId: room.id,
    mode: isBroadcaster ? "broadcaster" : "viewer",
    userId,
    username: isBroadcaster ? username : room.username,
    avatarUrl: isBroadcaster ? avatarUrl : room.avatarUrl,
    localStream,
  });
  const roomReady = isBroadcaster
    ? liveRoom.connected
    : liveRoom.mediaConnected;

  useEffect(() => {
    if (!isBroadcaster) return;
    const transferred = takeHandedOffLiveStream();
    if (transferred) {
      localStreamRef.current = transferred;
      setLocalStream(transferred);
    }
    return () => {
      discardHandedOffLiveStream();
    };
  }, [isBroadcaster]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDurationSeconds(
        Math.max(
          0,
          Math.floor((Date.now() - Date.parse(room.started_at)) / 1000),
        ),
      );
    }, 1000);
    return () => window.clearInterval(timer);
  }, [room.started_at]);

  useEffect(() => {
    if (summary) return;
    const pending = pendingOwnerEndTimers.get(room.id);
    if (pending) {
      window.clearTimeout(pending);
      pendingOwnerEndTimers.delete(room.id);
    }

    return () => {
      cameraRequestIdRef.current += 1;
      const timeout = window.setTimeout(() => {
        pendingOwnerEndTimers.delete(room.id);
        const stream = localStreamRef.current;
        stream?.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
        liveRoom.closeRoom();
        if (isBroadcaster && !endedRef.current) {
          void endLiveStream(room.id);
        }
      }, 350);
      pendingOwnerEndTimers.set(room.id, timeout);
    };
  }, [isBroadcaster, liveRoom.closeRoom, room.id, summary]);

  useEffect(() => {
    const onPageHide = () => {
      if (!isBroadcaster || endedRef.current) return;
      cameraRequestIdRef.current += 1;
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      endedRef.current = true;
      liveRoom.discardLocalStream();
      void endLiveStream(room.id).catch((cause) => {
        console.warn("[live] Could not close the room on page hide", cause);
      });
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [isBroadcaster, liveRoom.discardLocalStream, room.id]);

  const changeCamera = async (
    nextFacingMode: "user" | "environment" = facingMode,
  ) => {
    if (!isBroadcaster) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera and microphone are not available in this browser.");
      return;
    }
    const requestId = ++cameraRequestIdRef.current;
    setCameraBusy(true);
    setCameraError("");
    let nextStream: MediaStream | null = null;
    try {
      nextStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60, min: 30 },
          facingMode: nextFacingMode,
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 2,
        },
      });
      if (requestId !== cameraRequestIdRef.current || endedRef.current) {
        nextStream.getTracks().forEach((track) => track.stop());
        return;
      }
      const previousStream = localStreamRef.current;
      try {
        await liveRoom.replaceLocalStream(nextStream);
      } catch (cause) {
        console.error("[live] Camera track replacement needs retry", cause);
        setCameraError("The new camera is on. Some viewers may reconnect briefly.");
      }
      localStreamRef.current = nextStream;
      setLocalStream(nextStream);
      setFacingMode(nextFacingMode);
      previousStream?.getTracks().forEach((track) => track.stop());
    } catch (cause) {
      console.error("[live] Could not switch camera", cause);
      nextStream?.getTracks().forEach((track) => track.stop());
      if (requestId !== cameraRequestIdRef.current) return;
      const name = cause instanceof DOMException ? cause.name : "";
      setCameraError(
        name === "NotAllowedError"
          ? "Camera or microphone access was denied."
          : "Could not start the selected camera.",
      );
    } finally {
      if (requestId === cameraRequestIdRef.current) setCameraBusy(false);
    }
  };

  const endBroadcast = async () => {
    if (ending || endedRef.current) return;
    setEnding(true);
    setShowEndConfirmation(false);

    const stream = localStreamRef.current;
    cameraRequestIdRef.current += 1;
    stream?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    endedRef.current = true;
    discardHandedOffLiveStream();
    liveRoom.discardLocalStream();

    const durationAtEnd = Math.max(
      0,
      Math.floor((Date.now() - Date.parse(room.started_at)) / 1000),
    );
    const localPeak = Math.max(
      room.peak_viewers,
      liveRoom.peakViewerCount,
      liveRoom.viewerCount,
    );

    let result: Awaited<ReturnType<typeof endLiveStream>>;
    try {
      result = await endLiveStream(room.id);
      if (result.error) {
        const status = await loadLiveStreamStatus(room.id).catch(() => null);
        if (status === "live") result = await endLiveStream(room.id);
      }
    } catch (cause) {
      console.error("[live] Could not end the stream", cause);
      result = {
        summary: null,
        error:
          cause instanceof Error
            ? cause.message
            : "Could not save the live room status.",
      };
    }
    await liveRoom.announceStreamEnded();
    setEndError(result.error);
    setSummary({
      durationSeconds: result.summary?.durationSeconds ?? durationAtEnd,
      peakViewerCount: Math.max(
        result.summary?.peakViewers ?? 0,
        localPeak,
      ),
    });
    setEnding(false);
  };

  if (summary) {
    return (
      <LiveSummary
        durationSeconds={summary.durationSeconds}
        peakViewerCount={summary.peakViewerCount}
        error={endError}
      />
    );
  }

  return (
    <>
      <LiveStreamHud
        mode={isBroadcaster ? "broadcaster" : "viewer"}
        stream={isBroadcaster ? localStream : liveRoom.remoteStream}
        title={room.title}
        durationSeconds={durationSeconds}
        viewerCount={liveRoom.viewerCount}
        isFrontCamera={facingMode === "user"}
        comments={liveRoom.comments}
        commentText={liveRoom.commentText}
        reactions={liveRoom.reactions}
        onCommentTextChange={liveRoom.setCommentText}
        onSendComment={() => void liveRoom.sendComment()}
        onFlipCamera={() =>
          void changeCamera(facingMode === "user" ? "environment" : "user")
        }
        onEnd={() => setShowEndConfirmation(true)}
        onReact={liveRoom.sendReaction}
      />

      {!roomReady && !liveRoom.isEnded && (
        <div
          className="pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+6.5rem)] z-[75] -translate-x-1/2 rounded-full border border-white/15 bg-black/65 px-3 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur-xl"
          role="status"
        >
          {isBroadcaster
            ? "Connecting your live room…"
            : "Connecting to the live video…"}
        </div>
      )}

      {(liveRoom.error || cameraError) && (
        <div
          className="fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+9rem)] z-[80] w-[min(90vw,28rem)] -translate-x-1/2 rounded-2xl border border-rose-300/20 bg-black/80 px-4 py-3 text-center text-xs text-rose-100 shadow-xl backdrop-blur-xl"
          role="alert"
        >
          {cameraError || liveRoom.error}
        </div>
      )}

      {isBroadcaster && !localStream && !ending && (
        <button
          type="button"
          onClick={() => void changeCamera("user")}
          disabled={cameraBusy}
          className="fixed left-1/2 top-1/2 z-[80] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/70 px-5 py-3 text-sm font-semibold text-white shadow-xl backdrop-blur-xl disabled:opacity-60"
        >
          <span className="inline-flex items-center gap-2">
            <Camera className="h-4 w-4" />
            {cameraBusy ? "Starting camera…" : "Enable camera and mic"}
          </span>
        </button>
      )}

      {liveRoom.isEnded && !isBroadcaster && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-6 text-center text-white backdrop-blur-sm">
          <div className="max-w-sm rounded-3xl border border-white/10 bg-[#171118] p-7 shadow-2xl">
            <p className="text-lg font-bold">This live has ended</p>
            <button
              type="button"
              onClick={() => historyBackOr(() => void navigate({ to: "/" }))}
              className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
            >
              Go back
            </button>
          </div>
        </div>
      )}

      {showEndConfirmation && isBroadcaster && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/75 px-5 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowEndConfirmation(false);
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-end-live-title"
            aria-describedby="confirm-end-live-description"
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#191219] p-6 text-white shadow-2xl"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">
              <Radio className="h-5 w-5" />
            </div>
            <h2 id="confirm-end-live-title" className="text-lg font-bold">
              End your live?
            </h2>
            <p
              id="confirm-end-live-description"
              className="mt-2 text-sm leading-6 text-white/60"
            >
              Your camera and microphone will stop immediately. The summary will
              show duration and viewer stats only; no replay is saved.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowEndConfirmation(false)}
                className="flex-1 rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white/85 hover:bg-white/5"
              >
                Keep live
              </button>
              <button
                type="button"
                onClick={() => void endBroadcast()}
                disabled={ending}
                className="flex-1 rounded-full bg-rose-500 px-4 py-3 text-sm font-bold text-white hover:bg-rose-400 disabled:opacity-60"
              >
                {ending ? "Ending…" : "End live"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

const pendingOwnerEndTimers = new Map<string, number>();

function LiveSummary({
  durationSeconds,
  peakViewerCount,
  error,
}: {
  durationSeconds: number;
  peakViewerCount: number;
  error?: string | null;
}) {
  const navigate = useNavigate();
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;
  const duration =
    hours > 0
      ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#120d12] px-5 py-10 text-white">
      <section className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#241925] to-[#151016] p-7 text-center shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-rose-500/15 text-rose-300">
          <Radio className="h-6 w-6" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-300">
          Live ended
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Your summary</h1>
        <div className="mt-7 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45">
              Duration
            </p>
            <p className="mt-2 font-mono text-xl font-bold tabular-nums">
              {duration}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45">
              Peak viewers
            </p>
            <p className="mt-2 inline-flex items-center justify-center gap-2 text-xl font-bold tabular-nums">
              <Users className="h-4 w-4 text-white/60" />
              {new Intl.NumberFormat("en").format(peakViewerCount)}
            </p>
          </div>
        </div>
        {error && (
          <p className="mt-4 text-xs leading-5 text-amber-200/80" role="status">
            The stream ended on this device, but its room status could not be
            saved. Viewers will be disconnected when the room closes.
          </p>
        )}
        <button
          type="button"
          onClick={() => void navigate({ to: "/" })}
          className="mt-7 w-full rounded-full bg-white px-5 py-3 text-sm font-bold text-[#181018] transition hover:bg-white/90"
        >
          Done
        </button>
      </section>
    </main>
  );
}

function UnavailableLiveRoom({ message }: { message: string }) {
  const navigate = useNavigate();
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#120d12] px-6 text-center text-white">
      <div className="max-w-sm">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/5 text-white/60">
          <X className="h-5 w-5" />
        </span>
        <h1 className="text-lg font-bold">Live unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-white/60">{message}</p>
        <button
          type="button"
          onClick={() => historyBackOr(() => void navigate({ to: "/" }))}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
    </main>
  );
}