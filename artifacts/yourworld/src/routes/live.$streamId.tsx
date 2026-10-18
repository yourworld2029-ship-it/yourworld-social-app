import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Capacitor } from "@capacitor/core";
import { ArrowLeft, Camera, Radio, Users, X } from "lucide-react";
import { LiveStreamHud } from "@/components/yw/LiveStreamHud";
import { useAuth, useResumeAuthAction } from "@/lib/auth-store";
import {
  endLiveStream,
  loadLiveStreamForViewer,
  loadLiveStreamStatus,
  type ActiveLiveStream,
} from "@/lib/live-data";
import {
  createLiveVideoEffect,
  type LiveBeautySettings,
  type LiveVideoEffectPipeline,
} from "@/lib/live-video-effects";
import { discardHandedOffLiveStream, takeHandedOffLiveStream } from "@/lib/live-stream-registry";
import { historyBackOr } from "@/lib/navigation";
import { setLiveScreenOrientationActive } from "@/lib/video-playback";
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
  const [guestViewerId] = useState(
    () =>
      `guest-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`,
  );
  const [room, setRoom] = useState<ActiveLiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    let alive = true;
    setLoading(true);
    setLoadError(null);
    void loadLiveStreamForViewer(streamId, !user)
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
  }, [authLoading, streamId, user]);

  if (loading || authLoading) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#120d12] text-sm text-white/70">
        Connecting to live…
      </main>
    );
  }

  if (!room) {
    return (
      <UnavailableLiveRoom
        message={loadError ?? "This live broadcast is unavailable."}
      />
    );
  }

  const isBroadcaster = Boolean(user && room.broadcaster_id === user.id);
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
      userId={user?.id ?? guestViewerId}
      userMetadata={(user?.user_metadata ?? {}) as Record<string, unknown>}
      email={user?.email ?? ""}
      isBroadcaster={isBroadcaster}
      isGuestViewer={!user}
    />
  );
}

function LiveRoomSession({
  room,
  userId,
  userMetadata,
  email,
  isBroadcaster,
  isGuestViewer,
}: {
  room: ActiveLiveStream;
  userId: string;
  userMetadata: Record<string, unknown>;
  email: string;
  isBroadcaster: boolean;
  isGuestViewer: boolean;
}) {
  const navigate = useNavigate();
  const { user, requestAuthAction } = useAuth();
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
  const [outgoingStream, setOutgoingStream] = useState<MediaStream | null>(null);
  const [beautySettings, setBeautySettings] = useState<LiveBeautySettings>({
    effect: "off",
    intensity: 60,
  });
  const beautySettingsRef = useRef(beautySettings);
  const videoEffectPipelineRef = useRef<LiveVideoEffectPipeline | null>(null);
  const pendingVideoEffectRef = useRef<{
    sourceTrackId: string;
    requestId: number;
    promise: Promise<boolean>;
  } | null>(null);
  const videoEffectRequestIdRef = useRef(0);
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
  const [resumedLiveComment, setResumedLiveComment] = useState<string | null>(
    null,
  );
  const [durationSeconds, setDurationSeconds] = useState(() =>
    Math.max(
      0,
      Math.floor((Date.now() - Date.parse(room.started_at)) / 1000),
    ),
  );
  const endedRef = useRef(false);

  useEffect(() => {
    if (
      summary ||
      !Capacitor.isNativePlatform() ||
      Capacitor.getPlatform() !== "android"
    ) {
      return;
    }

    void setLiveScreenOrientationActive(true);

    return () => {
      void setLiveScreenOrientationActive(false);
    };
  }, [summary]);

  const releaseLiveVideoEffect = useCallback(() => {
    videoEffectRequestIdRef.current += 1;
    pendingVideoEffectRef.current = null;
    videoEffectPipelineRef.current?.stop();
    videoEffectPipelineRef.current = null;
  }, []);

  const applyLiveBeautySettings = useCallback(
    async (
      sourceStream: MediaStream | null,
      nextSettings: LiveBeautySettings,
    ): Promise<boolean> => {
      beautySettingsRef.current = nextSettings;
      setBeautySettings(nextSettings);

      const sourceTrack = sourceStream?.getVideoTracks()[0] ?? null;
      if (
        !sourceTrack ||
        nextSettings.effect === "off" ||
        nextSettings.intensity <= 0
      ) {
        releaseLiveVideoEffect();
        setOutgoingStream(null);
        return true;
      }

      const activePipeline = videoEffectPipelineRef.current;
      if (activePipeline?.sourceTrackId === sourceTrack.id) {
        activePipeline.setSettings(nextSettings);
        return true;
      }

      const pending = pendingVideoEffectRef.current;
      if (pending?.sourceTrackId === sourceTrack.id) {
        return pending.promise.then((applied) => {
          if (
            !applied &&
            beautySettingsRef.current === nextSettings &&
            nextSettings.effect !== "off"
          ) {
            const offSettings = {
              effect: "off" as const,
              intensity: nextSettings.intensity,
            };
            beautySettingsRef.current = offSettings;
            setBeautySettings(offSettings);
            setOutgoingStream(null);
          }
          return applied;
        });
      }

      releaseLiveVideoEffect();
      const requestId = videoEffectRequestIdRef.current;
      setOutgoingStream(null);
      const pendingRecord: {
        sourceTrackId: string;
        requestId: number;
        promise: Promise<boolean>;
      } = {
        sourceTrackId: sourceTrack.id,
        requestId,
        promise: Promise.resolve(false),
      };

      pendingRecord.promise = createLiveVideoEffect(sourceTrack, nextSettings)
        .then((pipeline) => {
          const stillCurrent =
            pendingVideoEffectRef.current === pendingRecord &&
            videoEffectRequestIdRef.current === requestId &&
            beautySettingsRef.current.effect !== "off" &&
            localStreamRef.current?.getVideoTracks()[0]?.id === sourceTrack.id;
          if (!pipeline) return false;
          if (!stillCurrent) {
            pipeline.stop();
            return false;
          }

          pipeline.setSettings(beautySettingsRef.current);
          videoEffectPipelineRef.current = pipeline;
          setOutgoingStream(
            new MediaStream([
              ...(sourceStream?.getAudioTracks() ?? []),
              pipeline.track,
            ]),
          );
          return true;
        })
        .catch((cause) => {
          console.warn("[live] Could not apply the live video effect", cause);
          return false;
        })
        .then((applied) => {
          if (
            !applied &&
            beautySettingsRef.current === nextSettings &&
            nextSettings.effect !== "off"
          ) {
            const offSettings = {
              effect: "off" as const,
              intensity: nextSettings.intensity,
            };
            beautySettingsRef.current = offSettings;
            setBeautySettings(offSettings);
            setOutgoingStream(null);
          }
          return applied;
        })
        .finally(() => {
          if (pendingVideoEffectRef.current === pendingRecord) {
            pendingVideoEffectRef.current = null;
          }
        });
      pendingVideoEffectRef.current = pendingRecord;
      return pendingRecord.promise;
    },
    [releaseLiveVideoEffect],
  );

  const liveRoom = useLiveRoom({
    streamId: room.id,
    mode: isBroadcaster ? "broadcaster" : "viewer",
    userId,
    isGuestViewer,
    username: isGuestViewer ? "Guest" : username,
    avatarUrl: isGuestViewer ? null : avatarUrl,
    localStream: isBroadcaster ? outgoingStream ?? localStream : null,
  });

  useEffect(
    () => () => {
      releaseLiveVideoEffect();
    },
    [releaseLiveVideoEffect],
  );

  useResumeAuthAction("live-comment", room.id, (action) => {
    const text = action.payload?.text ?? "";
    if (!text.trim()) return;
    liveRoom.setCommentText(text);
    setResumedLiveComment(text);
  });

  useEffect(() => {
    if (
      !resumedLiveComment ||
      liveRoom.commentText !== resumedLiveComment
    ) {
      return;
    }
    setResumedLiveComment(null);
    void liveRoom.sendComment();
  }, [
    liveRoom.commentText,
    liveRoom.sendComment,
    resumedLiveComment,
  ]);

  const sendLiveComment = () => {
    const text = liveRoom.commentText;
    if (!user) {
      if (text.trim()) {
        requestAuthAction({
          type: "live-comment",
          targetId: room.id,
          payload: { text },
        });
      }
      return;
    }
    void liveRoom.sendComment();
  };
  const roomReady = isBroadcaster
    ? liveRoom.connected
    : liveRoom.mediaConnected;

  useEffect(() => {
    if (!isBroadcaster) return;
    const transferred = takeHandedOffLiveStream();
    if (transferred) {
      localStreamRef.current = transferred;
      setLocalStream(transferred);
      const actualFacingMode = transferred
        .getVideoTracks()[0]
        ?.getSettings().facingMode;
      if (actualFacingMode === "user" || actualFacingMode === "environment") {
        setFacingMode(actualFacingMode);
      }
    }
    return () => {
      discardHandedOffLiveStream();
    };
  }, [isBroadcaster]);

  useEffect(() => {
    if (
      isBroadcaster &&
      localStream &&
      beautySettingsRef.current.effect !== "off" &&
      beautySettingsRef.current.intensity > 0
    ) {
      void applyLiveBeautySettings(localStream, beautySettingsRef.current);
    }
  }, [applyLiveBeautySettings, isBroadcaster, localStream]);

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
      releaseLiveVideoEffect();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setOutgoingStream(null);
      endedRef.current = true;
      liveRoom.discardLocalStream();
      void endLiveStream(room.id).catch((cause) => {
        console.warn("[live] Could not close the room on page hide", cause);
      });
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [isBroadcaster, liveRoom.discardLocalStream, releaseLiveVideoEffect, room.id]);

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
    releaseLiveVideoEffect();
    setOutgoingStream(null);
    let nextStream: MediaStream | null = null;
    const previousStream = localStreamRef.current ?? localStream;
    const audioTracks = previousStream?.getAudioTracks().filter(
      (track) => track.readyState === "live",
    ) ?? [];
    const previousVideoTracks = previousStream?.getVideoTracks() ?? [];
    previousVideoTracks.forEach((track) => track.stop());
    if (previousVideoTracks.length > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, 200));
    }

    const acquireVideo = async (mode: "user" | "environment") => {
      let cameraStream: MediaStream;
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
            facingMode: { exact: mode },
          },
          audio: false,
        });
      } catch {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: mode } },
          audio: false,
        });
      }
      const videoTrack = cameraStream.getVideoTracks()[0];
      if (!videoTrack) {
        cameraStream.getTracks().forEach((track) => track.stop());
        throw new Error("The selected camera did not provide a video track.");
      }
      const actualFacingMode = videoTrack.getSettings().facingMode;
      if (actualFacingMode && actualFacingMode !== mode) {
        cameraStream.getTracks().forEach((track) => track.stop());
        throw new Error(`The device did not open its ${mode} camera.`);
      }
      return new MediaStream([...audioTracks, videoTrack]);
    };

    try {
      nextStream = await acquireVideo(nextFacingMode);
      if (requestId !== cameraRequestIdRef.current || endedRef.current) {
        nextStream.getVideoTracks().forEach((track) => track.stop());
        return;
      }
      try {
        await liveRoom.replaceLocalStream(nextStream);
      } catch (cause) {
        console.error("[live] Camera track replacement needs retry", cause);
        setCameraError("The camera changed, but some viewers may reconnect briefly.");
      }
      localStreamRef.current = nextStream;
      setLocalStream(nextStream);
      setFacingMode(nextFacingMode);
      void applyLiveBeautySettings(nextStream, beautySettingsRef.current);
    } catch (cause) {
      console.error("[live] Could not switch camera", cause);
      nextStream?.getVideoTracks().forEach((track) => track.stop());
      if (requestId !== cameraRequestIdRef.current) return;
      try {
        const restoredStream = await acquireVideo(facingMode);
        if (requestId !== cameraRequestIdRef.current || endedRef.current) {
          restoredStream.getVideoTracks().forEach((track) => track.stop());
          return;
        }
        await liveRoom.replaceLocalStream(restoredStream);
        localStreamRef.current = restoredStream;
        setLocalStream(restoredStream);
        void applyLiveBeautySettings(restoredStream, beautySettingsRef.current);
        setCameraError("Could not switch cameras. Your previous camera is back on.");
      } catch (restoreCause) {
        console.error("[live] Could not restore the previous camera", restoreCause);
        setCameraError("Could not start the selected camera. Tap the camera button to retry.");
      }
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
    releaseLiveVideoEffect();
    stream?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setOutgoingStream(null);
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
        stream={
          isBroadcaster
            ? outgoingStream ?? localStream
            : liveRoom.remoteStream
        }
        cameraTrack={
          isBroadcaster ? localStream?.getVideoTracks()[0] ?? null : null
        }
        beautySettings={beautySettings}
        title={room.title}
        broadcasterName={room.displayName || room.username}
        broadcasterAvatarUrl={room.avatarUrl}
        durationSeconds={durationSeconds}
        viewerCount={liveRoom.viewerCount}
        viewers={liveRoom.viewers}
        latestJoinedViewer={liveRoom.latestJoinedViewer}
        isFrontCamera={facingMode === "user"}
        cameraBusy={cameraBusy}
        comments={liveRoom.comments}
        commentText={liveRoom.commentText}
        sendingComment={liveRoom.sendingComment}
        reactions={liveRoom.reactions}
        onCommentTextChange={liveRoom.setCommentText}
        onSendComment={sendLiveComment}
        onFlipCamera={() =>
          void changeCamera(facingMode === "user" ? "environment" : "user")
        }
        onEnd={() => setShowEndConfirmation(true)}
        onLeave={() => {
          liveRoom.closeRoom();
          historyBackOr(() => void navigate({ to: "/" }));
        }}
        onReact={liveRoom.sendReaction}
        onBeautySettingsChange={(settings) =>
          applyLiveBeautySettings(localStreamRef.current, settings)
        }
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
  const [retentionChoice, setRetentionChoice] = useState<
    "delete_now" | "keep_10_days" | "save_gallery"
  >("delete_now");
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;
  const duration =
    hours > 0
      ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#120d12] px-5 py-10 text-white">
      <section className="max-h-[90dvh] w-full max-w-sm overflow-y-auto overscroll-contain rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#241925] to-[#151016] p-7 text-center shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-rose-500/15 text-rose-300">
          <Radio className="h-6 w-6" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-300">
          Live ended
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Your summary</h1>
        <div className="mt-7 grid grid-cols-3 gap-3">
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
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45">
              Your earnings
            </p>
            <p className="mt-2 text-xl font-bold tabular-nums">₹0.00</p>
            <p className="mt-0.5 text-[9px] font-medium text-rose-200/70">
              50% net share
            </p>
          </div>
        </div>
        {error && (
          <p className="mt-4 text-xs leading-5 text-amber-200/80" role="status">
            The stream ended on this device, but its room status could not be
            saved. Viewers will be disconnected when the room closes.
          </p>
        )}
        <fieldset className="mt-6 space-y-2 text-left">
          <legend className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
            Video retention
          </legend>
          {[
            {
              value: "delete_now",
              title: "Delete video now",
              description: "Default · Purge any saved replay immediately",
            },
            {
              value: "keep_10_days",
              title: "Keep replay for 10 days",
              description: "On your profile for 10 days · counts toward watch time",
            },
            {
              value: "save_gallery",
              title: "Save to gallery",
              description: "Save to your phone · clear the cloud copy",
            },
          ].map((option) => {
            const selected = retentionChoice === option.value;
            return (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors ${
                  selected
                    ? "border-fuchsia-400/55 bg-fuchsia-500/10"
                    : "border-white/10 bg-black/20"
                }`}
              >
                <input
                  type="radio"
                  name="live-video-retention"
                  value={option.value}
                  checked={selected}
                  onChange={() =>
                    setRetentionChoice(
                      option.value as
                        | "delete_now"
                        | "keep_10_days"
                        | "save_gallery",
                    )
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#f12e50]"
                />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-white">
                    {option.title}
                  </span>
                  <span className="mt-1 block text-[10px] leading-4 text-white/55">
                    {option.description}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>
        <p className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left text-[10px] leading-4 text-white/50">
          Live video is not currently recorded. These choices are UI-only and
          won’t change video storage.
        </p>
        <button
          type="button"
          onClick={() => void navigate({ to: "/" })}
          className="mt-5 w-full rounded-full bg-white px-5 py-3 text-sm font-bold text-[#181018] transition hover:bg-white/90"
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