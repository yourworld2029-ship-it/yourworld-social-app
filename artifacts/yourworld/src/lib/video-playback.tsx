import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Lock,
  Sun,
  Unlock,
  Volume2,
  X,
  ZoomIn,
} from "lucide-react";

type GestureFeedback = {
  kind: "seek" | "volume" | "brightness" | "zoom";
  value: number;
  label: string;
};

type TouchGesture = {
  startX: number;
  startY: number;
  width: number;
  moved: boolean;
  initialVolume: number;
  initialBrightness: number;
  initialDistance: number | null;
  initialZoom: number;
};

type TouchPointList = {
  length: number;
  item: (index: number) => { clientX: number; clientY: number } | null;
};

export type PersistentVideo = {
  id: string;
  url: string;
  title: string;
  thumbnailUrl?: string | null;
};

type VideoPlaybackContextValue = {
  activeVideo: PersistentVideo | null;
  isDetailPlayer: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  activateVideo: (video: PersistentVideo) => void;
  setTimeUpdateHandler: (handler: ((currentTime: number) => void) | null) => void;
  closeVideo: () => void;
};

const VideoPlaybackContext = createContext<VideoPlaybackContextValue | null>(null);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function touchDistance(touches: TouchPointList) {
  if (touches.length < 2) return 0;
  const first = touches.item(0);
  const second = touches.item(1);
  if (!first || !second) return 0;
  return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
}

function getDetailVideoId(pathname: string) {
  const match = pathname.match(/^\/video\/([^/]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1] ?? "");
  } catch {
    return match[1] ?? "";
  }
}

export function VideoPlaybackProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeVideo, setActiveVideo] = useState<PersistentVideo | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [screenLocked, setScreenLocked] = useState(false);
  const [gestureFeedback, setGestureFeedback] = useState<GestureFeedback | null>(null);
  const [zoom, setZoom] = useState(1);
  const [displayMode, setDisplayMode] = useState<"fit" | "fill">("fit");
  const [brightness, setBrightness] = useState(1);
  const [pictureInPicture, setPictureInPicture] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeSourceRef = useRef<{ id: string; url: string } | null>(null);
  const timeUpdateHandlerRef = useRef<((currentTime: number) => void) | null>(null);
  const touchGestureRef = useRef<TouchGesture | null>(null);
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  const detailVideoId = getDetailVideoId(location.pathname);
  const isDetailPlayer = Boolean(activeVideo && detailVideoId === activeVideo.id);
  const isVideoDetailRoute = Boolean(detailVideoId);

  const activateVideo = useCallback((video: PersistentVideo) => {
    setActiveVideo((current) => {
      if (
        current?.id === video.id &&
        current.url === video.url &&
        current.title === video.title &&
        current.thumbnailUrl === video.thumbnailUrl
      ) {
        return current;
      }
      return video;
    });
  }, []);

  const setTimeUpdateHandler = useCallback(
    (handler: ((currentTime: number) => void) | null) => {
      timeUpdateHandlerRef.current = handler;
    },
    [],
  );

  const closeVideo = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
    activeSourceRef.current = null;
    setActiveVideo(null);
    setPictureInPicture(false);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeVideo) return;

    const source = activeSourceRef.current;
    if (source?.id === activeVideo.id && source.url === activeVideo.url) return;

    const isSameVideo = source?.id === activeVideo.id;
    const previousTime = isSameVideo && Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const shouldPlay = !isSameVideo || !video.paused;
    const restorePlayback = () => {
      if (previousTime > 0 && Number.isFinite(video.duration)) {
        video.currentTime = Math.min(previousTime, video.duration);
      } else if (!isSameVideo) {
        video.currentTime = 0;
      }
      if (shouldPlay) void video.play().catch(() => {});
    };

    video.pause();
    activeSourceRef.current = { id: activeVideo.id, url: activeVideo.url };
    video.src = activeVideo.url;
    video.load();
    video.addEventListener("loadedmetadata", restorePlayback, { once: true });

    return () => {
      video.removeEventListener("loadedmetadata", restorePlayback);
    };
  }, [activeVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncPictureInPicture = () => {
      setPictureInPicture(document.pictureInPictureElement === video);
    };
    video.addEventListener("enterpictureinpicture", syncPictureInPicture);
    video.addEventListener("leavepictureinpicture", syncPictureInPicture);
    syncPictureInPicture();
    return () => {
      video.removeEventListener("enterpictureinpicture", syncPictureInPicture);
      video.removeEventListener("leavepictureinpicture", syncPictureInPicture);
    };
  }, [activeVideo]);

  useEffect(() => {
    const attemptNativePictureInPicture = () => {
      const video = videoRef.current;
      if (
        document.visibilityState !== "hidden" ||
        !video ||
        video.paused ||
        document.pictureInPictureElement ||
        typeof video.requestPictureInPicture !== "function"
      ) {
        return;
      }
      void video.requestPictureInPicture().catch(() => {
        // Native PiP is optional. The persistent in-app mini-player remains available.
      });
    };

    document.addEventListener("visibilitychange", attemptNativePictureInPicture);
    return () => document.removeEventListener("visibilitychange", attemptNativePictureInPicture);
  }, []);

  useEffect(() => {
    if (isDetailPlayer || !isFullscreen) return;
    void document.exitFullscreen?.().catch(() => {});
  }, [isDetailPlayer, isFullscreen]);

  useEffect(
    () => () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const syncFullscreenState = () => {
      const fullscreenElement = document.fullscreenElement;
      const fullscreenTarget =
        fullscreenElement === containerRef.current || fullscreenElement === videoRef.current;
      const horizontalFullscreen = fullscreenTarget && window.innerWidth > window.innerHeight;
      setIsFullscreen(horizontalFullscreen);
      if (!horizontalFullscreen) {
        setScreenLocked(false);
        setZoom(1);
        setDisplayMode("fit");
        setBrightness(1);
        setGestureFeedback(null);
      }
    };
    document.addEventListener("fullscreenchange", syncFullscreenState);
    window.addEventListener("resize", syncFullscreenState);
    syncFullscreenState();
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
      window.removeEventListener("resize", syncFullscreenState);
    };
  }, []);

  const showGestureFeedback = useCallback(
    (kind: GestureFeedback["kind"], value: number, label: string) => {
      setGestureFeedback({ kind, value, label });
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
      feedbackTimerRef.current = window.setTimeout(() => {
        setGestureFeedback(null);
        feedbackTimerRef.current = null;
      }, 1000);
    },
    [],
  );

  const toggleScreenLock = useCallback(() => {
    if (!isFullscreen) return;
    setScreenLocked((locked) => !locked);
  }, [isFullscreen]);

  const seekBy = useCallback(
    (seconds: number) => {
      if (!isFullscreen || screenLocked) return;
      const video = videoRef.current;
      if (!video) return;
      const duration = Number.isFinite(video.duration) ? video.duration : Infinity;
      video.currentTime = clamp(video.currentTime + seconds, 0, duration);
      showGestureFeedback("seek", seconds, `${seconds > 0 ? "+" : ""}${seconds}s`);
    },
    [isFullscreen, screenLocked, showGestureFeedback],
  );

  const handleDoubleTap = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!isFullscreen || screenLocked) return;
      const rect = event.currentTarget.getBoundingClientRect();
      seekBy(event.clientX - rect.left >= rect.width / 2 ? 15 : -15);
    },
    [isFullscreen, screenLocked, seekBy],
  );

  const handleTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (!isFullscreen || screenLocked) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const firstTouch = event.touches.item(0);
      if (!firstTouch) return;
      if (event.touches.length >= 2) {
        event.preventDefault();
        touchGestureRef.current = {
          startX: firstTouch.clientX - rect.left,
          startY: firstTouch.clientY - rect.top,
          width: rect.width,
          moved: true,
          initialVolume: videoRef.current?.volume ?? 1,
          initialBrightness: brightness,
          initialDistance: touchDistance(event.touches),
          initialZoom: zoom,
        };
        return;
      }
      touchGestureRef.current = {
        startX: firstTouch.clientX - rect.left,
        startY: firstTouch.clientY - rect.top,
        width: rect.width,
        moved: false,
        initialVolume: videoRef.current?.volume ?? 1,
        initialBrightness: brightness,
        initialDistance: null,
        initialZoom: zoom,
      };
    },
    [brightness, isFullscreen, screenLocked, zoom],
  );

  const handleTouchMove = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (!isFullscreen || screenLocked) return;
      const gesture = touchGestureRef.current;
      if (!gesture) return;
      if (event.touches.length >= 2 && gesture.initialDistance) {
        event.preventDefault();
        const distance = touchDistance(event.touches);
        if (!distance) return;
        const nextZoom = clamp(
          gesture.initialZoom * (distance / gesture.initialDistance),
          1,
          4,
        );
        gesture.moved = true;
        setZoom(nextZoom);
        setDisplayMode(nextZoom > 1.05 ? "fill" : "fit");
        showGestureFeedback("zoom", nextZoom, `${nextZoom.toFixed(1)}×`);
        return;
      }

      const firstTouch = event.touches.item(0);
      if (!firstTouch) return;
      const deltaY = firstTouch.clientY - gesture.startY;
      const deltaX =
        firstTouch.clientX -
        (gesture.startX + event.currentTarget.getBoundingClientRect().left);
      if (Math.abs(deltaY) < 12 || Math.abs(deltaY) < Math.abs(deltaX)) return;
      event.preventDefault();
      gesture.moved = true;

      if (gesture.startX < gesture.width * 0.4) {
        const nextBrightness = clamp(
          gesture.initialBrightness - deltaY / 280,
          0.1,
          1,
        );
        setBrightness(nextBrightness);
        showGestureFeedback("brightness", nextBrightness, `${Math.round(nextBrightness * 100)}%`);
      } else {
        const nextVolume = clamp(gesture.initialVolume - deltaY / 280, 0, 1);
        if (videoRef.current) videoRef.current.volume = nextVolume;
        showGestureFeedback("volume", nextVolume, `${Math.round(nextVolume * 100)}%`);
      }
    },
    [isFullscreen, screenLocked, showGestureFeedback],
  );

  const handleTouchEnd = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (!isFullscreen || screenLocked) return;
      const gesture = touchGestureRef.current;
      touchGestureRef.current = null;
      if (!gesture || gesture.moved) return;
      const now = Date.now();
      const previousTap = lastTapRef.current;
      if (
        previousTap &&
        now - previousTap.time < 320 &&
        Math.abs(gesture.startX - previousTap.x) < 48
      ) {
        event.preventDefault();
        seekBy(gesture.startX >= gesture.width / 2 ? 15 : -15);
        lastTapRef.current = null;
        return;
      }
      lastTapRef.current = { time: now, x: gesture.startX };
    },
    [isFullscreen, screenLocked, seekBy],
  );

  const handleTimeUpdate = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    timeUpdateHandlerRef.current?.(event.currentTarget.currentTime);
  }, []);

  const openDetail = useCallback(() => {
    if (!activeVideo) return;
    void navigate({
      to: "/video/$videoId",
      params: { videoId: activeVideo.id },
    });
  }, [activeVideo, navigate]);

  const contextValue = useMemo<VideoPlaybackContextValue>(
    () => ({
      activeVideo,
      isDetailPlayer,
      videoRef,
      activateVideo,
      setTimeUpdateHandler,
      closeVideo,
    }),
    [activeVideo, activateVideo, closeVideo, isDetailPlayer, setTimeUpdateHandler],
  );

  return (
    <VideoPlaybackContext.Provider value={contextValue}>
      <div className="relative min-h-screen">{children}</div>
      {activeVideo ? (
        <div
          ref={containerRef}
          className={
            pictureInPicture
              ? "pointer-events-none fixed left-[-9999px] top-[-9999px] z-[-1] h-px w-px opacity-0"
              : isDetailPlayer
                ? "absolute inset-x-0 top-0 z-50 mx-auto w-full max-w-lg bg-black"
                : isVideoDetailRoute
                  ? "pointer-events-none fixed left-[-9999px] top-[-9999px] z-[-1] h-px w-px opacity-0"
                  : "fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3 z-[70] w-[min(68vw,280px)] overflow-hidden rounded-xl border border-white/15 bg-zinc-950 shadow-2xl"
          }
          onDoubleClick={isDetailPlayer ? handleDoubleTap : undefined}
          onTouchStart={isDetailPlayer ? handleTouchStart : undefined}
          onTouchMove={isDetailPlayer ? handleTouchMove : undefined}
          onTouchEnd={isDetailPlayer ? handleTouchEnd : undefined}
          style={isDetailPlayer ? { touchAction: isFullscreen ? "none" : "auto" } : undefined}
        >
          <div className={isDetailPlayer ? `relative w-full bg-black ${isFullscreen ? "h-screen w-screen" : "aspect-video"}` : "relative aspect-video w-full bg-black"}>
            <video
              ref={videoRef}
              controls={isDetailPlayer ? !isFullscreen || !screenLocked : false}
              controlsList="nodownload"
              autoPlay
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onClick={isDetailPlayer ? undefined : openDetail}
              className={`h-full w-full ${displayMode === "fill" ? "object-cover" : "object-contain"}`}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
                objectFit: displayMode === "fill" ? "cover" : "contain",
                filter: `brightness(${brightness})`,
                transition: gestureFeedback?.kind === "zoom" ? "none" : "transform 160ms ease-out",
              }}
            />

            {isDetailPlayer && isFullscreen && !screenLocked ? (
              <div className="pointer-events-none absolute inset-0 z-50">
                {gestureFeedback?.kind === "seek" ? (
                  <div
                    className={`pointer-events-none absolute top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 ${
                      gestureFeedback.value > 0 ? "right-1/4" : "left-1/4"
                    }`}
                    aria-live="polite"
                  >
                    <span className="absolute h-20 w-20 animate-ping rounded-full border border-white/50" />
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-black/65 text-sm font-bold text-white backdrop-blur-sm">
                      {gestureFeedback.label}
                    </span>
                  </div>
                ) : null}

                {gestureFeedback?.kind === "volume" ? (
                  <div className="pointer-events-none absolute right-5 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 rounded-full bg-black/60 px-2.5 py-3 text-white backdrop-blur-sm">
                    <Volume2 className="h-4 w-4" />
                    <div className="flex h-24 w-1.5 items-end overflow-hidden rounded-full bg-white/25">
                      <div
                        className="w-full rounded-full bg-white transition-[height]"
                        style={{ height: `${gestureFeedback.value * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold">{gestureFeedback.label}</span>
                  </div>
                ) : null}

                {gestureFeedback?.kind === "brightness" ? (
                  <div className="pointer-events-none absolute left-5 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 rounded-full bg-black/60 px-2.5 py-3 text-white backdrop-blur-sm">
                    <Sun className="h-4 w-4" />
                    <div className="flex h-24 w-1.5 items-end overflow-hidden rounded-full bg-white/25">
                      <div
                        className="w-full rounded-full bg-yellow-300 transition-[height]"
                        style={{ height: `${gestureFeedback.value * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold">{gestureFeedback.label}</span>
                  </div>
                ) : null}

                {gestureFeedback?.kind === "zoom" ? (
                  <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-black/65 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                    <ZoomIn className="h-4 w-4" />
                    {gestureFeedback.label}
                  </div>
                ) : null}
              </div>
            ) : null}

            {isDetailPlayer && isFullscreen && screenLocked ? (
              <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/10">
                <button
                  type="button"
                  onClick={toggleScreenLock}
                  className="inline-flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-black/85"
                  aria-label="Unlock player controls"
                >
                  <Unlock className="h-4 w-4" /> Unlock controls
                </button>
              </div>
            ) : null}

            {isDetailPlayer && !screenLocked ? (
              <button
                type="button"
                onClick={() =>
                  window.history.length > 1
                    ? window.history.back()
                    : void navigate({ to: "/" })
                }
                className="absolute left-3 top-3 z-50 rounded-full bg-black/60 p-2 text-white backdrop-blur-md transition-all hover:bg-black/80"
                aria-label="Go back"
                onTouchStart={(event) => event.stopPropagation()}
                onTouchEnd={(event) => event.stopPropagation()}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : null}

            {isDetailPlayer && isFullscreen && !screenLocked ? (
              <button
                type="button"
                onClick={toggleScreenLock}
                className="absolute right-3 top-3 z-50 rounded-full bg-black/60 p-2 text-white backdrop-blur-md transition-all hover:bg-black/80"
                aria-label="Lock player controls"
                onTouchStart={(event) => event.stopPropagation()}
                onTouchEnd={(event) => event.stopPropagation()}
                onDoubleClick={(event) => event.stopPropagation()}
              >
                <Lock className="h-5 w-5" />
              </button>
            ) : null}

            {!isDetailPlayer && !isVideoDetailRoute && !pictureInPicture ? (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    closeVideo();
                  }}
                  className="absolute right-1.5 top-1.5 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/75 text-white backdrop-blur-sm transition hover:bg-black"
                  aria-label="Close mini-player"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={openDetail}
                  className="absolute inset-0 z-[1] cursor-pointer"
                  aria-label={`Open ${activeVideo.title}`}
                />
              </>
            ) : null}
          </div>
          {!isDetailPlayer && !isVideoDetailRoute && !pictureInPicture ? (
            <button
              type="button"
              onClick={openDetail}
              className="block w-full truncate bg-zinc-950 px-2.5 py-2 text-left text-[11px] font-semibold text-white"
            >
              {activeVideo.title || "Now playing"}
            </button>
          ) : null}
        </div>
      ) : null}
    </VideoPlaybackContext.Provider>
  );
}

export function useVideoPlayback() {
  const context = useContext(VideoPlaybackContext);
  if (!context) {
    throw new Error("useVideoPlayback must be used inside VideoPlaybackProvider");
  }
  return context;
}

export function VideoPlaybackSlot() {
  const { activeVideo, isDetailPlayer } = useVideoPlayback();
  if (!activeVideo || !isDetailPlayer) {
    return <div className="aspect-video w-full bg-black" aria-hidden="true" />;
  }
  return <div className="aspect-video w-full bg-black" aria-hidden="true" />;
}