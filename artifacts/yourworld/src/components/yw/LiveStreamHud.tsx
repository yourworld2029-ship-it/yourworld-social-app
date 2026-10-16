import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Flashlight,
  FlashlightOff,
  Heart,
  LoaderCircle,
  Mic,
  MicOff,
  Send,
  Share2,
  Sparkles,
  SwitchCamera,
  Users,
  X,
} from "lucide-react";
import {
  LIVE_BEAUTY_EFFECTS,
  type LiveBeautySettings,
} from "@/lib/live-video-effects";
import { ProfileAvatar } from "./ProfileAvatar";

export type LiveStreamHudMode = "broadcaster" | "viewer";

export type LiveStreamComment = {
  id: string;
  username: string;
  avatarUrl: string | null;
  message: string;
};

export type LiveStreamReaction = {
  id: string;
};

export type LiveStreamHudProps = {
  mode: LiveStreamHudMode;
  stream: MediaStream | null;
  cameraTrack: MediaStreamTrack | null;
  beautySettings: LiveBeautySettings;
  title: string;
  broadcasterName: string;
  broadcasterAvatarUrl: string | null;
  durationSeconds: number;
  viewerCount: number;
  isFrontCamera: boolean;
  cameraBusy: boolean;
  comments: LiveStreamComment[];
  commentText: string;
  sendingComment: boolean;
  reactions: LiveStreamReaction[];
  onCommentTextChange: (value: string) => void;
  onSendComment: () => void;
  onFlipCamera: () => void;
  onEnd: () => void;
  onReact: () => void;
  onBeautySettingsChange: (settings: LiveBeautySettings) => Promise<boolean>;
};

type FloatingHeart = {
  id: string;
  lane: 0 | 1 | 2;
};

function formatDuration(durationSeconds: number) {
  const safeDuration = Math.max(0, Math.floor(durationSeconds));
  const hours = Math.floor(safeDuration / 3600);
  const minutes = Math.floor((safeDuration % 3600) / 60);
  const seconds = safeDuration % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatViewerCount(viewerCount: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
    Math.max(0, viewerCount),
  );
}

export async function supportsLiveCameraTorch(track: MediaStreamTrack | null) {
  if (!track) return false;

  try {
    const capabilities = track.getCapabilities?.() as
      | (MediaTrackCapabilities & { torch?: boolean })
      | undefined;
    if (capabilities?.torch === true) return true;
  } catch {
    // Some Android WebViews expose torch support only through ImageCapture.
  }

  try {
    type PhotoCapabilities = {
      torch?: boolean;
      fillLightMode?: string[];
    };
    type ImageCaptureLike = {
      getPhotoCapabilities?: () => Promise<PhotoCapabilities>;
    };
    type ImageCaptureConstructor = new (track: MediaStreamTrack) => ImageCaptureLike;
    const ImageCaptureApi = (
      globalThis as unknown as { ImageCapture?: ImageCaptureConstructor }
    ).ImageCapture;
    if (!ImageCaptureApi) return false;
    const photoCapabilities = await new ImageCaptureApi(track).getPhotoCapabilities?.();
    return (
      photoCapabilities?.torch === true ||
      photoCapabilities?.fillLightMode?.some(
        (mode) => mode === "torch" || mode === "flash",
      ) === true
    );
  } catch {
    return false;
  }
}

export function LiveStreamHud({
  mode,
  stream,
  cameraTrack,
  beautySettings,
  title,
  broadcasterName,
  broadcasterAvatarUrl,
  durationSeconds,
  viewerCount,
  isFrontCamera,
  cameraBusy,
  comments,
  commentText,
  sendingComment,
  reactions,
  onCommentTextChange,
  onSendComment,
  onFlipCamera,
  onEnd,
  onReact,
  onBeautySettingsChange,
}: LiveStreamHudProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const commentsRef = useRef<HTMLDivElement | null>(null);
  const seenReactionIds = useRef(new Set<string>());
  const hasPrimedReactions = useRef(false);
  const heartSequence = useRef(0);
  const heartTimeouts = useRef<number[]>([]);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [microphoneMuted, setMicrophoneMuted] = useState(false);
  const microphoneMutedRef = useRef(false);
  const [flashAvailable, setFlashAvailable] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [frontScreenFlashOn, setFrontScreenFlashOn] = useState(false);
  const flashOnRef = useRef(false);
  const flashCommandRef = useRef(0);
  const [beautyPanelOpen, setBeautyPanelOpen] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const actionToastTimeout = useRef<number | null>(null);
  const latestCommentId = comments[comments.length - 1]?.id;
  const isBroadcaster = mode === "broadcaster";
  const mirrorPreview = isBroadcaster && isFrontCamera;

  const showActionToast = (message: string) => {
    if (actionToastTimeout.current !== null) {
      window.clearTimeout(actionToastTimeout.current);
    }
    setActionToast(message);
    actionToastTimeout.current = window.setTimeout(() => {
      setActionToast(null);
      actionToastTimeout.current = null;
    }, 2200);
  };

  const copyLiveLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showActionToast("Live link copied");
    } catch {
      const linkInput = document.createElement("textarea");
      linkInput.value = window.location.href;
      linkInput.style.position = "fixed";
      linkInput.style.opacity = "0";
      document.body.append(linkInput);
      linkInput.select();
      const copied = document.execCommand("copy");
      linkInput.remove();
      showActionToast(copied ? "Live link copied" : "Could not copy live link");
    }
  };

  const shareLive = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || "YourWorld live",
          text: `${broadcasterName} is live on YourWorld`,
          url: window.location.href,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyLiveLink();
  };

  const changeBeautySettings = (settings: LiveBeautySettings) => {
    void onBeautySettingsChange(settings).then((applied) => {
      if (!applied && settings.effect !== "off") {
        showActionToast("Live effects are not available on this device");
      }
    }).catch(() => {
      showActionToast("Could not apply the live effect");
    });
  };

  const toggleMicrophone = () => {
    const audioTracks =
      stream?.getAudioTracks().filter((track) => track.readyState === "live") ?? [];
    if (audioTracks.length === 0) {
      showActionToast("Microphone is unavailable");
      return;
    }
    const nextMuted = !microphoneMutedRef.current;
    microphoneMutedRef.current = nextMuted;
    audioTracks.forEach((track) => {
      track.enabled = !nextMuted;
    });
    setMicrophoneMuted(nextMuted);
  };

  const toggleFlash = async () => {
    const track = cameraTrack;
    if (!track) {
      showActionToast("Camera flash is unavailable");
      return;
    }
    if (isFrontCamera) {
      setFrontScreenFlashOn((enabled) => !enabled);
      return;
    }
    if (!flashAvailable) {
      showActionToast(
        "Flash is unavailable on this camera",
      );
      return;
    }
    const nextFlashOn = !flashOnRef.current;
    const commandId = ++flashCommandRef.current;
    flashOnRef.current = nextFlashOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: nextFlashOn } as MediaTrackConstraintSet],
      });
      if (commandId !== flashCommandRef.current || cameraTrack !== track) return;
      setFlashOn(nextFlashOn);
    } catch {
      if (commandId !== flashCommandRef.current || cameraTrack !== track) return;
      flashOnRef.current = false;
      setFlashOn(false);
      showActionToast("Could not change camera flash");
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;
    const tryPlay = () => {
      if (video.srcObject === stream && video.paused) {
        void video.play().catch(() => {});
      }
    };
    video.addEventListener("loadedmetadata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    const videoTracks = stream?.getVideoTracks() ?? [];
    videoTracks.forEach((track) => track.addEventListener("unmute", tryPlay));
    tryPlay();

    return () => {
      video.removeEventListener("loadedmetadata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
      videoTracks.forEach((track) => track.removeEventListener("unmute", tryPlay));
      if (video.srcObject === stream) {
        video.srcObject = null;
      }
    };
  }, [stream]);

  useEffect(() => {
    if (!isBroadcaster) return;
    stream?.getAudioTracks().forEach((track) => {
      track.enabled = !microphoneMutedRef.current;
    });
  }, [isBroadcaster, stream]);

  useEffect(() => {
    flashCommandRef.current += 1;
    flashOnRef.current = false;
    setFlashOn(false);
    setFrontScreenFlashOn(false);
    if (!cameraTrack || isFrontCamera) {
      setFlashAvailable(false);
      return;
    }
    let cancelled = false;
    setFlashAvailable(false);
    void supportsLiveCameraTorch(cameraTrack).then((available) => {
      if (!cancelled) setFlashAvailable(available);
    });

    return () => {
      cancelled = true;
      flashCommandRef.current += 1;
      if (flashOnRef.current) {
        void cameraTrack
          .applyConstraints({
            advanced: [{ torch: false } as MediaTrackConstraintSet],
          })
          .catch(() => undefined);
      }
      flashOnRef.current = false;
    };
  }, [cameraTrack, isFrontCamera]);

  useEffect(() => {
    const commentsElement = commentsRef.current;
    if (!commentsElement) return;

    commentsElement.scrollTo({
      top: commentsElement.scrollHeight,
      behavior: "smooth",
    });
  }, [comments.length, latestCommentId]);

  useEffect(() => {
    const reactionIds = new Set(reactions.map((reaction) => reaction.id));

    if (!hasPrimedReactions.current) {
      hasPrimedReactions.current = true;
      seenReactionIds.current = reactionIds;
      return;
    }

    const incomingReactions = reactions.filter(
      (reaction) => !seenReactionIds.current.has(reaction.id),
    );
    seenReactionIds.current = reactionIds;

    if (incomingReactions.length === 0) return;

    const nextHearts = incomingReactions.map(() => {
      const sequence = heartSequence.current++;
      return {
        id: `heart-${sequence}`,
        lane: (sequence % 3) as FloatingHeart["lane"],
      };
    });

    setFloatingHearts((currentHearts) => [...currentHearts, ...nextHearts].slice(-8));

    nextHearts.forEach((heart) => {
      let timeoutId = 0;
      timeoutId = window.setTimeout(() => {
        setFloatingHearts((currentHearts) =>
          currentHearts.filter((currentHeart) => currentHeart.id !== heart.id),
        );
        heartTimeouts.current = heartTimeouts.current.filter((id) => id !== timeoutId);
      }, 2400);
      heartTimeouts.current.push(timeoutId);
    });
  }, [reactions]);

  useEffect(
    () => () => {
      heartTimeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      if (actionToastTimeout.current !== null) {
        window.clearTimeout(actionToastTimeout.current);
      }
    },
    [],
  );

  return (
    <section
      className="fixed inset-0 z-[70] isolate h-[100dvh] w-full overflow-hidden bg-[#120d12] text-white"
      aria-label={isBroadcaster ? "Live broadcast preview" : "Live broadcast"}
    >
      <style>{`
        @keyframes yw-live-heart-rise {
          0% {
            opacity: 0;
            transform: translate3d(0, 16px, 0) scale(0.62) rotate(-7deg);
          }
          14% {
            opacity: 1;
          }
          72% {
            opacity: 0.88;
          }
          100% {
            opacity: 0;
            transform: translate3d(0, -188px, 0) scale(1.12) rotate(8deg);
          }
        }

        .yw-live-heart {
          animation: yw-live-heart-rise 2.3s cubic-bezier(0.2, 0.72, 0.28, 1) forwards;
          will-change: transform, opacity;
        }

        .yw-live-heart--left {
          left: 12%;
        }

        .yw-live-heart--center {
          left: 34%;
        }

        .yw-live-heart--right {
          left: 55%;
        }

        @media (prefers-reduced-motion: reduce) {
          .yw-live-heart {
            animation-duration: 0.01ms;
          }
        }
      `}</style>

      <video
        ref={videoRef}
        autoPlay
        muted={isBroadcaster}
        playsInline
        preload="none"
        data-testid="video-live-stream"
        aria-label={isBroadcaster ? "Your live camera preview" : "Live video"}
        className="absolute inset-0 h-full w-full bg-[#120d12] object-cover"
        style={{ transform: mirrorPreview ? "scaleX(-1)" : undefined }}
      />

      {!stream && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-[#120d12]/90 px-8 text-center"
          data-testid="status-live-stream-unavailable"
        >
          <div className="max-w-xs">
            <span className="mx-auto mb-4 block h-2.5 w-2.5 rounded-full bg-[#ff335f]" />
            <p className="text-sm font-semibold tracking-tight text-white/90">
              {isBroadcaster ? "Waiting for your camera" : "Waiting for the live video"}
            </p>
            <p className="mt-2 text-xs leading-5 text-white/55">
              {isBroadcaster
                ? "Your camera preview will appear here when the stream is ready."
                : "The broadcaster is connecting. Stay close, the live room will update shortly."}
            </p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(8,5,9,0.72),transparent_26%,transparent_52%,rgba(8,5,9,0.88))]" />

      {isBroadcaster && isFrontCamera && frontScreenFlashOn && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 bg-white"
          data-testid="overlay-live-front-screen-flash"
        />
      )}

      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 px-3 pb-4 pt-[calc(max(env(safe-area-inset-top,0px),2.25rem)+0.8rem)] sm:gap-4 sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-[#f12e50] px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-[0_5px_22px_rgba(241,46,80,0.28)] sm:gap-2 sm:px-3 sm:tracking-[0.17em]"
              data-testid="status-live"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
              Live
            </span>
            <span
              className="rounded-full border border-white/15 bg-black/45 px-2.5 py-1.5 font-mono text-[11px] font-bold tabular-nums text-white backdrop-blur-xl sm:px-3"
              data-testid="text-live-duration"
              aria-label={`Live for ${formatDuration(durationSeconds)}`}
            >
              {formatDuration(durationSeconds)}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur-xl sm:gap-1.5 sm:px-3"
              data-testid="text-live-viewer-count"
              aria-label={`${viewerCount} viewers`}
            >
              <Users className="h-3.5 w-3.5 text-white/80" aria-hidden="true" />
              {formatViewerCount(viewerCount)}
            </span>
          </div>
          <div className="mt-3 flex min-w-0 items-center gap-2.5">
            {isBroadcaster ? (
              <span className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-rose-300/30 bg-gradient-to-r from-rose-500/25 to-fuchsia-500/20 px-3 text-[11px] font-bold text-white shadow-[0_6px_24px_rgba(225,29,102,0.18)] backdrop-blur-xl">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-300 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-300" />
                </span>
                You’re live
              </span>
            ) : (
              <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/45 bg-white/10 shadow-lg ring-2 ring-[#f12e50]/70">
                <ProfileAvatar
                  user={{
                    username: broadcasterName,
                    avatar_url: broadcasterAvatarUrl,
                  }}
                />
              </span>
            )}
            <div className="min-w-0">
              <p
                className="max-w-[min(62vw,24rem)] truncate text-[12px] font-semibold text-white/85"
                data-testid="text-live-title"
              >
                {title || "YourWorld live"}
              </p>
              {!isBroadcaster && (
                <p className="mt-0.5 truncate text-[11px] font-medium text-white/65">
                  {broadcasterName} · Live now
                </p>
              )}
            </div>
          </div>
        </div>

        {isBroadcaster && (
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onFlipCamera}
              data-testid="button-live-flip-camera"
              aria-label={isFrontCamera ? "Switch to rear camera" : "Switch to front camera"}
              title={isFrontCamera ? "Switch to rear camera" : "Switch to front camera"}
              disabled={cameraBusy}
              aria-busy={cameraBusy}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white shadow-lg backdrop-blur-xl transition-transform hover:bg-black/70 active:scale-95 disabled:opacity-60"
            >
              <SwitchCamera
                className={`h-[18px] w-[18px] ${cameraBusy ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={onEnd}
              data-testid="button-live-end"
              aria-label="End live broadcast"
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[#f12e50] px-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-white shadow-lg shadow-[#f12e50]/20 transition-transform hover:bg-[#ff4363] active:scale-95 sm:gap-2 sm:px-3.5 sm:text-[11px] sm:tracking-[0.12em]"
            >
              <X className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
              End
            </button>
          </div>
        )}
      </header>

      <aside
        className="absolute right-3 top-[calc(max(env(safe-area-inset-top,0px),2.25rem)+7.1rem)] z-30 flex flex-col items-center gap-2.5 sm:right-6"
        aria-label="Live options"
      >
        {isBroadcaster && (
          <div className="relative flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setBeautyPanelOpen((open) => !open);
              }}
              aria-label="Beauty and Face Retouch"
              aria-expanded={beautyPanelOpen}
              aria-controls="live-beauty-options"
              data-testid="button-live-beauty"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white shadow-lg backdrop-blur-xl transition-transform hover:bg-black/70 active:scale-95"
            >
              <Sparkles className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
            <span className="text-[9px] font-semibold text-white/90">Beauty</span>
            {beautyPanelOpen && (
              <div
                id="live-beauty-options"
                role="group"
                aria-label="Face Retouch effects"
                className="absolute right-[3.75rem] top-0 w-44 rounded-2xl border border-white/15 bg-[#171319]/95 p-3 shadow-2xl backdrop-blur-2xl"
              >
                <div className="mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" aria-hidden="true" />
                  <p className="text-[11px] font-bold text-white">Face Retouch</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    changeBeautySettings({
                      effect: "off",
                      intensity: beautySettings.intensity,
                    })
                  }
                  aria-pressed={beautySettings.effect === "off"}
                  data-testid="button-live-beauty-off"
                  className={`mb-2 w-full rounded-lg border px-2 py-1.5 text-left text-[10px] font-semibold ${
                    beautySettings.effect === "off"
                      ? "border-fuchsia-300/50 bg-fuchsia-400/20 text-white"
                      : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                  }`}
                >
                  Off
                </button>
                <div className="grid grid-cols-2 gap-1.5">
                  {LIVE_BEAUTY_EFFECTS.map((effect) => {
                    const selected = beautySettings.effect === effect.value;
                    return (
                      <button
                        key={effect.value}
                        type="button"
                        onClick={() =>
                          changeBeautySettings({
                            ...beautySettings,
                            effect: effect.value,
                          })
                        }
                        aria-pressed={selected}
                        data-testid={`button-live-beauty-${effect.value}`}
                        className={`flex min-h-9 items-center justify-between gap-1 rounded-xl border px-2 text-[10px] font-semibold transition-colors ${
                          selected
                            ? "border-fuchsia-300/50 bg-fuchsia-400/20 text-white"
                            : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                        }`}
                      >
                        {effect.label}
                        {selected && (
                          <Check className="h-3 w-3 shrink-0 text-fuchsia-200" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <label className="mt-3 block text-[10px] font-medium text-white/75" htmlFor="live-beauty-intensity">
                  Intensity <span className="float-right tabular-nums">{beautySettings.intensity}%</span>
                </label>
                <input
                  id="live-beauty-intensity"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={beautySettings.intensity}
                  disabled={beautySettings.effect === "off"}
                  aria-label="Beauty effect intensity"
                  data-testid="input-live-beauty-intensity"
                  onChange={(event) =>
                    changeBeautySettings({
                      ...beautySettings,
                      intensity: Number(event.currentTarget.value),
                    })
                  }
                  className="mt-1.5 h-2 w-full cursor-pointer accent-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-40"
                />
              </div>
            )}
          </div>
        )}

        {isBroadcaster && (
          <>
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={toggleMicrophone}
                aria-label={microphoneMuted ? "Unmute microphone" : "Mute microphone"}
                aria-pressed={microphoneMuted}
                data-testid="button-live-microphone"
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full border shadow-lg backdrop-blur-xl transition-transform active:scale-95 ${
                  microphoneMuted
                    ? "border-red-300/40 bg-red-500/75 text-white"
                    : "border-white/20 bg-black/50 text-white hover:bg-black/70"
                }`}
              >
                {microphoneMuted ? (
                  <MicOff className="h-[18px] w-[18px]" aria-hidden="true" />
                ) : (
                  <Mic className="h-[18px] w-[18px]" aria-hidden="true" />
                )}
              </button>
              <span className="text-[9px] font-semibold text-white/90">
                {microphoneMuted ? "Mic off" : "Mic"}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => void toggleFlash()}
                aria-label={
                  isFrontCamera
                    ? frontScreenFlashOn
                      ? "Turn screen flash off"
                      : "Turn screen flash on"
                    : flashOn
                      ? "Turn flash off"
                      : "Turn flash on"
                }
                aria-pressed={isFrontCamera ? frontScreenFlashOn : flashOn}
                title={
                  isFrontCamera
                    ? "Front camera screen flash"
                    : flashAvailable
                      ? undefined
                      : "Flash is not available on this camera"
                }
                disabled={!cameraTrack || (!isFrontCamera && !flashAvailable)}
                data-testid="button-live-flash"
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full border shadow-lg backdrop-blur-xl transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 ${
                  (isFrontCamera ? frontScreenFlashOn : flashOn)
                    ? "border-amber-200/50 bg-amber-400/80 text-white"
                    : "border-white/20 bg-black/50 text-white hover:bg-black/70"
                }`}
              >
                {(isFrontCamera ? frontScreenFlashOn : flashOn) ? (
                  <Flashlight className="h-[18px] w-[18px]" aria-hidden="true" />
                ) : (
                  <FlashlightOff className="h-[18px] w-[18px]" aria-hidden="true" />
                )}
              </button>
              <span className="text-[9px] font-semibold text-white/90">
                {isFrontCamera
                  ? frontScreenFlashOn
                    ? "Screen flash on"
                    : "Screen flash"
                  : flashOn
                    ? "Flash on"
                    : "Flash"}
              </span>
            </div>
          </>
        )}

        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => void shareLive()}
            aria-label="Share live"
            data-testid="button-live-share"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white shadow-lg backdrop-blur-xl transition-transform hover:bg-black/70 active:scale-95"
          >
            <Share2 className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
          <span className="text-[9px] font-semibold text-white/90">Share</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => void copyLiveLink()}
            aria-label="Copy live link"
            data-testid="button-live-copy-link"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white shadow-lg backdrop-blur-xl transition-transform hover:bg-black/70 active:scale-95"
          >
            <Copy className="h-[17px] w-[17px]" aria-hidden="true" />
          </button>
          <span className="text-[9px] font-semibold text-white/90">Copy link</span>
        </div>
      </aside>

      <div className="pointer-events-none absolute bottom-[calc(env(safe-area-inset-bottom,0px)+5.75rem)] left-0 right-0 flex justify-end px-4 sm:px-6">
        <div className="relative h-52 w-full max-w-sm">
          {floatingHearts.map((heart) => (
            <Heart
              key={heart.id}
              className={`yw-live-heart absolute bottom-0 h-7 w-7 fill-[#ff4d73] text-[#ff4d73] drop-shadow-[0_5px_12px_rgba(255,55,100,0.46)] ${
                heart.lane === 0
                  ? "yw-live-heart--left"
                  : heart.lane === 1
                    ? "yw-live-heart--center"
                    : "yw-live-heart--right"
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      <div
        ref={commentsRef}
        className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+5.1rem)] left-0 z-10 flex max-h-[38dvh] w-[min(calc(100vw-5.5rem),29rem)] flex-col gap-2 overflow-y-auto overscroll-contain px-3 pb-2 pt-8 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden"
        aria-live="polite"
        data-testid="list-live-comments"
      >
        {comments.length === 0 ? (
          <p className="w-fit max-w-[16rem] rounded-2xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs leading-5 text-white/70 shadow-lg backdrop-blur-xl">
            Comments are open. Say hello.
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex w-fit max-w-full items-end gap-2.5 rounded-2xl border border-white/15 bg-black/50 py-2 pl-2 pr-3 shadow-lg backdrop-blur-xl"
              data-testid={`comment-live-${comment.id}`}
            >
              <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#3b2030] ring-1 ring-white/15">
                <ProfileAvatar
                  user={{ username: comment.username, avatar_url: comment.avatarUrl }}
                />
              </span>
              <p className="min-w-0 text-[12px] leading-[1.35] text-white/90">
                <span
                  className="mr-1 font-bold text-white"
                  data-testid={`text-live-comment-username-${comment.id}`}
                >
                  {comment.username}
                </span>
                <span data-testid={`text-live-comment-message-${comment.id}`}>
                  {comment.message}
                </span>
              </p>
            </div>
          ))
        )}
      </div>

      <form
        className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-2 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.8rem)] pt-3 sm:px-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (commentText.trim()) onSendComment();
        }}
      >
        <label className="sr-only" htmlFor="live-comment-input">
          Write a comment
        </label>
        <input
          id="live-comment-input"
          type="text"
          value={commentText}
          onChange={(event) => onCommentTextChange(event.currentTarget.value)}
          placeholder="Comment on this live…"
          autoComplete="off"
          maxLength={500}
          data-testid="input-live-comment"
          className="h-12 min-w-0 flex-1 rounded-full border border-white/20 bg-black/60 px-4 text-sm text-white shadow-[0_8px_30px_rgba(0,0,0,0.24)] outline-none backdrop-blur-xl transition-colors placeholder:text-white/55 focus:border-white/45 focus:bg-black/75"
        />
        <button
          type="submit"
          onClick={() => {
            if (!commentText.trim()) return;
          }}
          disabled={!commentText.trim() || sendingComment}
          data-testid="button-live-send-comment"
          aria-label="Send comment"
          aria-busy={sendingComment}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff376c] to-[#c400e8] text-white shadow-[0_6px_22px_rgba(217,0,146,0.35)] transition-transform hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sendingComment ? (
            <LoaderCircle className="h-[18px] w-[18px] animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-[18px] w-[18px]" aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          onClick={onReact}
          data-testid="button-live-react"
          aria-label="Send a heart reaction"
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#ff5578]/35 bg-[#ff5578]/15 text-[#ff7793] backdrop-blur-xl transition-transform hover:bg-[#ff5578]/25 active:scale-95"
        >
          <Heart className="h-[19px] w-[19px] fill-current" aria-hidden="true" />
        </button>
      </form>

      {actionToast && (
        <div
          className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+4.8rem)] left-1/2 z-40 -translate-x-1/2 rounded-full border border-white/15 bg-black/75 px-3.5 py-2 text-xs font-medium text-white shadow-xl backdrop-blur-xl"
          role="status"
          aria-live="polite"
        >
          {actionToast}
        </div>
      )}
    </section>
  );
}