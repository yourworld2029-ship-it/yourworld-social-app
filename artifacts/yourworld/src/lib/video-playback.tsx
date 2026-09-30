import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SyntheticEvent as ReactSyntheticEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { StatusBar } from "@capacitor/status-bar";
import type { VideoQualityTier } from "@/lib/video-quality";
import { getAdjacentVideo } from "@/lib/video-queue";
import { resolveMediaUrl } from "@/lib/social-data";
import { VideoPlayerErrorBoundary } from "@/components/yw/VideoPlayerErrorBoundary";
import {
  ArrowLeft,
  Check,
  Lock,
  Maximize,
  Minimize,
  MoreVertical,
  Pause,
  PictureInPicture,
  Play,
  Repeat,
  RotateCcw,
  RotateCw,
  Settings2,
  Sun,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
} from "lucide-react";
import Hls from "hls.js";

const QUALITY_OPTIONS = [
  { id: "auto", label: "Auto", description: "Recommended", shortSide: null },
  { id: "1080p", label: "1080p", description: "HD", shortSide: 1080 },
  { id: "720p", label: "720p", description: "", shortSide: 720 },
  { id: "480p", label: "480p", description: "", shortSide: 480 },
  { id: "360p", label: "360p", description: "Data Saver", shortSide: 360 },
] as const;

export type QualityId = (typeof QUALITY_OPTIONS)[number]["id"];
export type QualityUrls = Partial<Record<VideoQualityTier, string>>;

function isHlsUrl(url: string) {
  return /\.m3u8(?:$|[?#])/i.test(url);
}

function qualityLabel(quality: QualityId, activeHeight?: number | null) {
  if (quality === "auto") {
    return activeHeight ? `Auto ${activeHeight}p` : "Auto";
  }
  return quality;
}

function levelForQuality(levels: Hls["levels"], quality: Exclude<QualityId, "auto">) {
  const target = QUALITY_OPTIONS.find((option) => option.id === quality)?.shortSide;
  if (!target || levels.length === 0) return -1;
  const candidates = levels
    .map((level, index) => ({ index, height: Number(level.height) }))
    .filter((level) => Number.isFinite(level.height) && level.height > 0);
  if (candidates.length === 0) return -1;
  return (
    candidates
      .filter((level) => level.height <= target)
      .sort((a, b) => b.height - a.height)[0]?.index ??
    candidates.sort((a, b) => a.height - b.height)[0]?.index ??
    -1
  );
}

type GestureFeedback = {
  id: number;
  kind: "seek" | "volume" | "brightness" | "zoom" | "playback";
  value: number;
  label: string;
};

type TapSide = "left" | "right";

type TouchGesture = {
  startX: number;
  originX: number;
  originY: number;
  startedAt: number;
  width: number;
  moved: boolean;
  swipeAxis: "x" | "y" | null;
  initialVolume: number;
  initialBrightness: number;
  initialDistance: number | null;
  initialZoom: number;
};

type SwipeNavigation = {
  targetVideoId: string;
  axis: "x" | "y";
  exitOffset: number;
};

type FloatingPosition = {
  left: number;
  top: number;
};

type FloatingDrag = FloatingPosition & {
  pointerId: number;
  startX: number;
  startY: number;
  startLeft: number;
  startTop: number;
  width: number;
  height: number;
  moved: boolean;
};

type TouchPointList = {
  length: number;
  item: (index: number) => { clientX: number; clientY: number } | null;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: "portrait" | "landscape") => Promise<void>;
  unlock?: () => void;
};

export type PersistentVideo = {
  id: string;
  url: string;
  title: string;
  thumbnailUrl?: string | null;
  detailRoute?: string;
  backTo?: string;
  qualityUrls?: QualityUrls;
  initialTime?: number;
};

type VideoPlaybackContextValue = {
  activeVideo: PersistentVideo | null;
  isDetailPlayer: boolean;
  isVerticalVideo: boolean;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  activateVideo: (video: PersistentVideo) => void;
  setTimeUpdateHandler: (
    handler: ((currentTime: number, duration: number, wasSeeking: boolean) => void) | null,
  ) => void;
  setEndedHandler: (handler: (() => void) | null) => void;
  closeVideo: () => void;
};

const VideoPlaybackContext = createContext<VideoPlaybackContextValue | null>(null);

const PLAYER_SWIPE_TRANSITION_MS = 130;
const PLAYER_SWIPE_TRANSITION =
  `transform ${PLAYER_SWIPE_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function writePlayerTransform(
  element: HTMLElement | null,
  x: number,
  y: number,
  transition: string,
) {
  if (!element) return;
  element.style.willChange = "transform";
  element.style.transition = transition;
  element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainder = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
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

function getDownloadDetailPath(pathname: string) {
  return pathname.startsWith("/downloads/") ? pathname : null;
}

function getPlayerFullscreenElement() {
  const fullscreenDocument = document as FullscreenDocument;
  return document.fullscreenElement ?? fullscreenDocument.webkitFullscreenElement ?? null;
}

function requestPlayerFullscreen(element: HTMLElement) {
  const fullscreenElement = element as FullscreenElement;
  if (typeof fullscreenElement.requestFullscreen === "function") {
    return Promise.resolve(fullscreenElement.requestFullscreen()).then(
      () => true,
      () => false,
    );
  }
  if (typeof fullscreenElement.webkitRequestFullscreen === "function") {
    return Promise.resolve(fullscreenElement.webkitRequestFullscreen()).then(
      () => true,
      () => false,
    );
  }
  return Promise.resolve(false);
}

function exitPlayerFullscreen() {
  const fullscreenDocument = document as FullscreenDocument;
  const exitResult =
    typeof document.exitFullscreen === "function"
      ? document.exitFullscreen()
      : fullscreenDocument.webkitExitFullscreen?.();
  return Promise.resolve(exitResult).catch(() => {});
}

let orientationChangeQueue: Promise<void> = Promise.resolve();

function enqueueOrientationChange(change: () => Promise<void>) {
  const nextChange = orientationChangeQueue.then(change, change);
  orientationChangeQueue = nextChange.catch(() => {});
  return nextChange;
}

function lockPlayerOrientation(requestedOrientation: "portrait" | "landscape") {
  return enqueueOrientationChange(async () => {
    try {
      await ScreenOrientation.lock({ orientation: requestedOrientation });
    } catch {
      const screenOrientation = window.screen?.orientation as LockableScreenOrientation | undefined;
      if (typeof screenOrientation?.lock !== "function") return;
      try {
        await screenOrientation.lock(requestedOrientation);
      } catch {
        // Orientation locks are unavailable in some browsers and display modes.
      }
    }
  });
}

type ImmersiveNavigationBarPlugin = {
  hide: () => Promise<void>;
  show: () => Promise<void>;
};

const ImmersiveNavigationBar =
  registerPlugin<ImmersiveNavigationBarPlugin>("ImmersiveNavigationBar");
let androidPlayerSystemBarsQueue: Promise<void> = Promise.resolve();

function setAndroidPlayerSystemBars(immersive: boolean) {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    return Promise.resolve();
  }

  const updates: Array<{ bar: string; apply: () => Promise<void> }> = immersive
    ? [
        { bar: "status", apply: () => StatusBar.hide() },
        { bar: "navigation", apply: () => ImmersiveNavigationBar.hide() },
      ]
    : [
        { bar: "navigation", apply: () => ImmersiveNavigationBar.show() },
        { bar: "status", apply: () => StatusBar.show() },
      ];

  androidPlayerSystemBarsQueue = androidPlayerSystemBarsQueue
    .catch(() => {})
    .then(async () => {
      for (const update of updates) {
        try {
          await update.apply();
        } catch (error) {
          console.warn(
            `[video-playback] Could not update Android ${update.bar} bar visibility`,
            error,
          );
        }
      }
    });
  return androidPlayerSystemBarsQueue;
}

export function VideoPlaybackProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeVideo, setActiveVideo] = useState<PersistentVideo | null>(null);
  const [mediaError, setMediaError] = useState<{ id: string; url: string } | null>(null);
  const [playbackRetryKey, setPlaybackRetryKey] = useState(0);
  const [resolvedPoster, setResolvedPoster] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVerticalVideo, setIsVerticalVideo] = useState(false);
  const [screenLocked, setScreenLocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [controlsActivity, setControlsActivity] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [gestureFeedback, setGestureFeedback] = useState<GestureFeedback | null>(null);
  const [lockedUnlockVisible, setLockedUnlockVisible] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [displayMode, setDisplayMode] = useState<"fit" | "fill">("fit");
  const [brightness, setBrightness] = useState(1);
  const [pictureInPicture, setPictureInPicture] = useState(false);
  const [floatingPosition, setFloatingPosition] = useState<FloatingPosition | null>(null);
  const [floatingDragging, setFloatingDragging] = useState(false);
  const isAndroidApp =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const [settingsMenu, setSettingsMenu] = useState<"closed" | "root" | "speed" | "quality">("closed");
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loopVideo, setLoopVideo] = useState(false);
  const [quality, setQuality] = useState<QualityId>("auto");
  const [hlsLevels, setHlsLevels] = useState<Hls["levels"]>([]);
  const [activeHlsHeight, setActiveHlsHeight] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeSourceRef = useRef<{ id: string; url: string } | null>(null);
  const playbackAttemptRef = useRef(0);
  const hlsRef = useRef<Hls | null>(null);
  const activeVideoId = activeVideo?.id;
  const activeVideoUrl = activeVideo?.url;
  const activeVideoInitialTime = activeVideo?.initialTime;

  const reportMediaError = useCallback(
    (source: { id: string; url: string }, attempt: number) => {
      const activeSource = activeSourceRef.current;
      if (
        playbackAttemptRef.current !== attempt ||
        activeSource?.id !== source.id ||
        activeSource.url !== source.url
      ) {
        return;
      }
      setIsPlaying(false);
      setMediaError({ id: source.id, url: source.url });
      videoRef.current?.pause();
    },
    [],
  );

  const handleNativeMediaError = useCallback(
    (event: ReactSyntheticEvent<HTMLVideoElement>) => {
      const source = activeSourceRef.current;
      if (!source) return;
      const currentSource = event.currentTarget.currentSrc;
      if (currentSource && currentSource !== source.url) return;
      reportMediaError(source, playbackAttemptRef.current);
    },
    [reportMediaError],
  );

  useEffect(() => {
    let alive = true;
    const thumbnailUrl = activeVideo?.thumbnailUrl;
    setResolvedPoster(null);
    if (!thumbnailUrl) return;

    void resolveMediaUrl(thumbnailUrl, "videos")
      .then((url) => {
        if (alive) setResolvedPoster(url || thumbnailUrl);
      })
      .catch(() => {
        if (alive) setResolvedPoster(thumbnailUrl);
      });

    return () => {
      alive = false;
    };
  }, [activeVideo?.id, activeVideo?.thumbnailUrl]);
  const timeUpdateHandlerRef = useRef<
    ((currentTime: number, duration: number, wasSeeking: boolean) => void) | null
  >(null);
  const endedHandlerRef = useRef<(() => void) | null>(null);
  const seekActivityRef = useRef(false);
  const touchGestureRef = useRef<TouchGesture | null>(null);
  const lastTapRef = useRef<{ time: number; side: TapSide } | null>(null);
  const playerTapTimerRef = useRef<number | null>(null);
  const suppressSyntheticClickUntilRef = useRef(0);
  const feedbackTimerRef = useRef<number | null>(null);
  const gestureFeedbackIdRef = useRef(0);
  const controlsHideTimerRef = useRef<number | null>(null);
  const lockedUnlockTimerRef = useRef<number | null>(null);
  const fullscreenScrollYRef = useRef<number | null>(null);
  const fullscreenRequestIdRef = useRef(0);
  const nativeImmersiveModeRef = useRef(false);
  const floatingPositionRef = useRef<FloatingPosition | null>(null);
  const floatingDragRef = useRef<FloatingDrag | null>(null);
  const suppressFloatingClickRef = useRef(false);
  const swipeNavigationRef = useRef<SwipeNavigation | null>(null);
  const swipeNavigateTimerRef = useRef<number | null>(null);
  const swipeTransformCleanupTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (playerTapTimerRef.current !== null) {
      window.clearTimeout(playerTapTimerRef.current);
      playerTapTimerRef.current = null;
    }
    lastTapRef.current = null;
    suppressSyntheticClickUntilRef.current = 0;
    return () => {
      if (playerTapTimerRef.current !== null) {
        window.clearTimeout(playerTapTimerRef.current);
        playerTapTimerRef.current = null;
      }
    };
  }, [activeVideo?.id]);

  useEffect(() => {
    const swipe = swipeNavigationRef.current;
    if (!swipe) return;

    if (swipeNavigateTimerRef.current !== null) {
      window.clearTimeout(swipeNavigateTimerRef.current);
      swipeNavigateTimerRef.current = null;
    }

    if (!activeVideo) {
      swipeNavigationRef.current = null;
      return;
    }
    if (activeVideo.id !== swipe.targetVideoId) {
      swipeNavigationRef.current = null;
      const container = containerRef.current;
      writePlayerTransform(container, 0, 0, PLAYER_SWIPE_TRANSITION);
      return;
    }

    swipeNavigationRef.current = null;
    const container = containerRef.current;
    if (!container) return;

    const enterOffset = -swipe.exitOffset;
    writePlayerTransform(
      container,
      swipe.axis === "x" ? enterOffset : 0,
      swipe.axis === "y" ? enterOffset : 0,
      "none",
    );
    requestAnimationFrame(() => {
      if (containerRef.current !== container) return;
      writePlayerTransform(container, 0, 0, PLAYER_SWIPE_TRANSITION);
      if (swipeTransformCleanupTimerRef.current !== null) {
        window.clearTimeout(swipeTransformCleanupTimerRef.current);
      }
      swipeTransformCleanupTimerRef.current = window.setTimeout(() => {
        swipeTransformCleanupTimerRef.current = null;
        if (containerRef.current !== container) return;
        container.style.willChange = "";
        container.style.transition = "";
        container.style.transform = "";
      }, PLAYER_SWIPE_TRANSITION_MS + 30);
    });
  }, [activeVideo]);

  useEffect(
    () => () => {
      if (swipeNavigateTimerRef.current !== null) {
        window.clearTimeout(swipeNavigateTimerRef.current);
      }
      if (swipeTransformCleanupTimerRef.current !== null) {
        window.clearTimeout(swipeTransformCleanupTimerRef.current);
      }
    },
    [],
  );

  const detailVideoId = getDetailVideoId(location.pathname);
  const downloadDetailPath = getDownloadDetailPath(location.pathname);
  const isDetailPlayer = Boolean(
    activeVideo &&
      (detailVideoId === activeVideo.id || activeVideo.detailRoute === downloadDetailPath),
  );
  const isPlayerRoute = Boolean(detailVideoId || downloadDetailPath);
  const showDetailChrome = isDetailPlayer && !pictureInPicture;
  const needsAndroidPortraitSafeArea =
    isAndroidApp && showDetailChrome && (!isFullscreen || isVerticalVideo);

  const activateVideo = useCallback((video: PersistentVideo) => {
    const source = activeSourceRef.current;
    const player = videoRef.current;
    if (
      source?.id === video.id &&
      source.url === video.url &&
      typeof video.initialTime === "number" &&
      Number.isFinite(video.initialTime) &&
      player
    ) {
      const requestedTime = Math.max(0, video.initialTime);
      const safeTime = Number.isFinite(player.duration) && player.duration > 0
        ? Math.min(requestedTime, Math.max(0, player.duration - 0.1))
        : requestedTime;
      player.currentTime = safeTime;
      setCurrentTime(safeTime);
    }

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
    (handler: ((currentTime: number, duration: number, wasSeeking: boolean) => void) | null) => {
      timeUpdateHandlerRef.current = handler;
    },
    [],
  );

  const setEndedHandler = useCallback((handler: (() => void) | null) => {
    endedHandlerRef.current = handler;
  }, []);

  const closeVideo = useCallback(() => {
    playbackAttemptRef.current += 1;
    setMediaError(null);
    const video = videoRef.current;
    hlsRef.current?.destroy();
    hlsRef.current = null;
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
    activeSourceRef.current = null;
    setActiveVideo(null);
    setIsVerticalVideo(false);
    setPictureInPicture(false);
    setFloatingPosition(null);
    setFloatingDragging(false);
    floatingDragRef.current = null;
    setSettingsMenu("closed");
    setIsPlaying(false);
    setControlsVisible(true);
    setCurrentTime(0);
    setDuration(0);
    setIsMuted(false);
    setQuality("auto");
    setLoopVideo(false);
    setHlsLevels([]);
    setActiveHlsHeight(null);
  }, []);

  const retryPlayback = useCallback(() => {
    if (!activeVideo) return;
    playbackAttemptRef.current += 1;
    setMediaError(null);
    hlsRef.current?.destroy();
    hlsRef.current = null;
    activeSourceRef.current = null;
    setPlaybackRetryKey((key) => key + 1);
  }, [activeVideo]);

  const goBackFromPlayerError = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    void navigate({ to: "/" });
  }, [navigate]);

  const previousPathnameRef = useRef(location.pathname);
  useEffect(() => {
    const previousPathname = previousPathnameRef.current;
    previousPathnameRef.current = location.pathname;
    if (previousPathname !== location.pathname && activeVideo && !isPlayerRoute) {
      closeVideo();
    }
  }, [activeVideo, closeVideo, isPlayerRoute, location.pathname]);

  const markControlsActivity = useCallback(() => {
    setControlsVisible(true);
    setControlsActivity((activity) => activity + 1);
  }, []);

  const restoreFullscreenScroll = useCallback(() => {
    const scrollY = fullscreenScrollYRef.current;
    if (scrollY === null) return;
    fullscreenScrollYRef.current = null;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.scrollTo(0, scrollY));
    });
  }, []);

  const clearLockedUnlockTimer = useCallback(() => {
    if (lockedUnlockTimerRef.current !== null) {
      window.clearTimeout(lockedUnlockTimerRef.current);
      lockedUnlockTimerRef.current = null;
    }
  }, []);

  const finishFullscreenExit = useCallback(async () => {
    fullscreenRequestIdRef.current += 1;
    await lockPlayerOrientation("portrait");
    setIsFullscreen(false);
    setScreenLocked(false);
    setLockedUnlockVisible(false);
    clearLockedUnlockTimer();
    setZoom(1);
    setDisplayMode("fit");
    setBrightness(1);
    setGestureFeedback(null);
    setSettingsMenu("closed");
    restoreFullscreenScroll();
  }, [clearLockedUnlockTimer, restoreFullscreenScroll]);

  const teardownFullscreen = useCallback(
    async (exitCurrentFullscreen: boolean) => {
      const fullscreenElement = getPlayerFullscreenElement();
      const isPlayerFullscreen =
        fullscreenElement === containerRef.current || fullscreenElement === videoRef.current;
      if (exitCurrentFullscreen && isPlayerFullscreen) {
        await exitPlayerFullscreen();
      }
      await finishFullscreenExit();
    },
    [finishFullscreenExit],
  );

  const revealLockedUnlock = useCallback(() => {
    setLockedUnlockVisible(true);
    clearLockedUnlockTimer();
    lockedUnlockTimerRef.current = window.setTimeout(() => {
      setLockedUnlockVisible(false);
      lockedUnlockTimerRef.current = null;
    }, 3000);
  }, [clearLockedUnlockTimer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeVideoId || !activeVideoUrl) return;

    const source = activeSourceRef.current;
    if (source?.id === activeVideoId && source.url === activeVideoUrl) return;

    const attempt = ++playbackAttemptRef.current;
    setMediaError(null);
    const isSameVideo = source?.id === activeVideoId;
    const previousTime = isSameVideo && Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const requestedStartTime = isSameVideo ? previousTime : activeVideoInitialTime ?? 0;
    const shouldPlay = !isSameVideo || !video.paused;
    const restorePlayback = () => {
      try {
        if (requestedStartTime > 0 && Number.isFinite(requestedStartTime)) {
          const safeTime = Number.isFinite(video.duration) && video.duration > 0
            ? Math.min(requestedStartTime, Math.max(0, video.duration - 0.1))
            : requestedStartTime;
          video.currentTime = safeTime;
          setCurrentTime(safeTime);
        } else if (!isSameVideo) {
          video.currentTime = 0;
        }
      } catch (cause) {
        console.error("[video-playback] unable to restore video time", cause);
        reportMediaError({ id: activeVideoId, url: activeVideoUrl }, attempt);
      }
      if (shouldPlay) void video.play().catch(() => {});
    };

    video.pause();
    hlsRef.current?.destroy();
    hlsRef.current = null;
    setCurrentTime(isSameVideo ? previousTime : 0);
    setDuration(0);
    setIsVerticalVideo(false);
    setControlsVisible(true);
    setQuality("auto");
    setLoopVideo(false);
    setHlsLevels([]);
    setActiveHlsHeight(null);
    activeSourceRef.current = { id: activeVideoId, url: activeVideoUrl };
    try {
      if (isHlsUrl(activeVideoUrl) && Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true });
        hlsRef.current = hls;
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setHlsLevels([...hls.levels]);
          setActiveHlsHeight(
            hls.levels[hls.currentLevel]?.height ??
              hls.levels[hls.levels.length - 1]?.height ??
              null,
          );
        });
        hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
          setActiveHlsHeight(hls.levels[data.level]?.height ?? null);
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          if (hlsRef.current === hls) hlsRef.current = null;
          hls.destroy();
          reportMediaError({ id: activeVideoId, url: activeVideoUrl }, attempt);
        });
        hls.loadSource(activeVideoUrl);
        hls.attachMedia(video);
      } else {
        video.src = activeVideoUrl;
        video.load();
      }
    } catch (cause) {
      console.error("[video-playback] unable to mount media source", cause);
      reportMediaError({ id: activeVideoId, url: activeVideoUrl }, attempt);
    }
    video.addEventListener("loadedmetadata", restorePlayback, { once: true });

    return () => {
      video.removeEventListener("loadedmetadata", restorePlayback);
    };
  }, [
    activeVideoId,
    activeVideoInitialTime,
    activeVideoUrl,
    playbackRetryKey,
    reportMediaError,
  ]);

  useEffect(
    () => () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
      playbackAttemptRef.current += 1;
    },
    [],
  );

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.loop = loopVideo;
    }
  }, [loopVideo]);

  const selectQuality = useCallback((nextQuality: QualityId) => {
    const video = videoRef.current;
    if (!video || !activeVideo) return;
    const hls = hlsRef.current;
    if (hls && hlsLevels.length > 0) {
      if (nextQuality === "auto") {
        hls.currentLevel = -1;
      } else {
        const nextLevel = levelForQuality(hlsLevels, nextQuality);
        if (nextLevel < 0) return;
        hls.currentLevel = nextLevel;
      }
      setQuality(nextQuality);
      setSettingsMenu("closed");
      markControlsActivity();
      return;
    }

    const nextUrl = nextQuality === "auto" ? activeVideo.url : activeVideo.qualityUrls?.[nextQuality];
    if (!nextUrl || nextUrl === activeSourceRef.current?.url) {
      if (nextQuality === "auto" || nextUrl === activeVideo.url) setQuality(nextQuality);
      setSettingsMenu("closed");
      markControlsActivity();
      return;
    }

    const previousTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const shouldPlay = !video.paused;
    const onMetadata = () => {
      if (Number.isFinite(video.duration)) video.currentTime = Math.min(previousTime, video.duration);
      if (shouldPlay) void video.play().catch(() => {});
    };
    video.pause();
    activeSourceRef.current = { id: activeVideo.id, url: nextUrl };
    video.src = nextUrl;
    video.load();
    video.addEventListener("loadedmetadata", onMetadata, { once: true });
    setQuality(nextQuality);
    setSettingsMenu("closed");
    markControlsActivity();
  }, [activeVideo, hlsLevels, markControlsActivity]);

  const togglePictureInPicture = useCallback(() => {
    if (!videoRef.current) return;
    setPictureInPicture(true);
    setFloatingPosition(null);
    if (isFullscreen) void teardownFullscreen(true);
    setSettingsMenu("closed");
    markControlsActivity();
  }, [isFullscreen, markControlsActivity, teardownFullscreen]);

  const startFloatingDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pictureInPicture || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (event.target instanceof Element && event.target.closest("button")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.preventDefault();
    event.stopPropagation();
    floatingDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: rect.left,
      startTop: rect.top,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      moved: false,
    };
    setFloatingPosition({ left: rect.left, top: rect.top });
    setFloatingDragging(true);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is unavailable in a few embedded browser surfaces.
    }
  }, [pictureInPicture]);

  const moveFloatingPlayer = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = floatingDragRef.current;
    if (!pictureInPicture || !drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < 4) return;
    drag.moved = true;
    event.preventDefault();
    const edge = 10;
    const maxLeft = Math.max(edge, window.innerWidth - drag.width - edge);
    const maxTop = Math.max(edge, window.innerHeight - drag.height - edge);
    const position = {
      left: clamp(drag.startLeft + deltaX, edge, maxLeft),
      top: clamp(drag.startTop + deltaY, edge, maxTop),
    };
    drag.left = position.left;
    drag.top = position.top;
    setFloatingPosition(position);
  }, [pictureInPicture]);

  const finishFloatingDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = floatingDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    floatingDragRef.current = null;
    if (drag.moved) {
      const edge = 10;
      const maxLeft = Math.max(edge, window.innerWidth - drag.width - edge);
      const maxTop = Math.max(edge, window.innerHeight - drag.height - edge);
      const left = drag.left + drag.width / 2 < window.innerWidth / 2 ? edge : maxLeft;
      setFloatingPosition({
        left,
        top: clamp(drag.top, edge, maxTop),
      });
      suppressFloatingClickRef.current = true;
      window.setTimeout(() => {
        suppressFloatingClickRef.current = false;
      }, 0);
    }
    setFloatingDragging(false);
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // The pointer may already have been released by the browser.
    }
  }, []);

  const setRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
    setSettingsMenu("closed");
    markControlsActivity();
  }, [markControlsActivity]);

  const showGestureFeedback = useCallback(
    (kind: GestureFeedback["kind"], value: number, label: string) => {
      setGestureFeedback({
        id: ++gestureFeedbackIdRef.current,
        kind,
        value,
        label,
      });
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

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isDetailPlayer && !screenLocked) {
      showGestureFeedback("playback", 0, video.paused ? "play" : "pause");
    }
    if (video.paused) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isDetailPlayer, screenLocked, showGestureFeedback]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    markControlsActivity();
  }, [markControlsActivity]);

  const handleSeek = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    const nextTime = Number(event.currentTarget.value);
    if (!video || !Number.isFinite(nextTime)) return;
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
    markControlsActivity();
  }, [markControlsActivity]);

  const toggleFullscreen = useCallback(() => {
    const fullscreenElement = getPlayerFullscreenElement();
    if (fullscreenElement) {
      void exitPlayerFullscreen().then(() => teardownFullscreen(false));
    } else {
      const container = containerRef.current;
      const video = videoRef.current;
      const primaryTarget = container ?? video;
      if (!primaryTarget) return;
      const requestId = fullscreenRequestIdRef.current + 1;
      fullscreenRequestIdRef.current = requestId;
      fullscreenScrollYRef.current = window.scrollY;
      const fallbackTarget = container && video ? video : null;
      void requestPlayerFullscreen(primaryTarget)
        .then((enteredFullscreen) =>
          enteredFullscreen || !fallbackTarget
            ? enteredFullscreen
            : requestPlayerFullscreen(fallbackTarget),
        )
        .then(async (enteredFullscreen) => {
          if (requestId !== fullscreenRequestIdRef.current) {
            const fullscreenElement = getPlayerFullscreenElement();
            if (fullscreenElement === primaryTarget || fullscreenElement === fallbackTarget) {
              void exitPlayerFullscreen();
            }
            return;
          }
          if (!enteredFullscreen) {
            fullscreenScrollYRef.current = null;
            return;
          }
          const fullscreenElement = getPlayerFullscreenElement();
          if (fullscreenElement !== primaryTarget && fullscreenElement !== fallbackTarget) {
            fullscreenScrollYRef.current = null;
            return;
          }
          setIsFullscreen(true);
          await lockPlayerOrientation(
            video && video.videoHeight > video.videoWidth ? "portrait" : "landscape",
          );
        })
        .catch(() => {
          if (requestId === fullscreenRequestIdRef.current) {
            fullscreenScrollYRef.current = null;
          }
        });
    }
    markControlsActivity();
  }, [markControlsActivity, teardownFullscreen]);

  const clearControlsHideTimer = useCallback(() => {
    if (controlsHideTimerRef.current !== null) {
      window.clearTimeout(controlsHideTimerRef.current);
      controlsHideTimerRef.current = null;
    }
  }, []);

  const handleVideoPlay = useCallback(() => {
    setIsPlaying(true);
    setControlsVisible(true);
  }, []);

  const handleVideoPause = useCallback(() => {
    setIsPlaying(false);
    setControlsVisible(true);
  }, []);

  const handleVideoEnded = useCallback(() => {
    endedHandlerRef.current?.();
  }, []);

  useEffect(() => {
    clearControlsHideTimer();
    if (!isDetailPlayer || !isPlaying || !controlsVisible || settingsMenu !== "closed" || screenLocked) {
      return;
    }
    controlsHideTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
      controlsHideTimerRef.current = null;
    }, 3000);
    return clearControlsHideTimer;
  }, [
    clearControlsHideTimer,
    controlsVisible,
    controlsActivity,
    isDetailPlayer,
    isPlaying,
    screenLocked,
    settingsMenu,
  ]);

  const qualityOptions = QUALITY_OPTIONS.map((option) => ({
    ...option,
    available:
      option.id === "auto" ||
      (hlsLevels.length > 0 && levelForQuality(hlsLevels, option.id as Exclude<QualityId, "auto">) >= 0) ||
      Boolean(activeVideo?.qualityUrls?.[option.id as Exclude<QualityId, "auto">]),
  }));

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
    if (isDetailPlayer) return;
    const fullscreenElement = getPlayerFullscreenElement();
    const playerIsFullscreen =
      fullscreenElement === containerRef.current || fullscreenElement === videoRef.current;
    if (!playerIsFullscreen && !isFullscreen && fullscreenScrollYRef.current === null) return;
    void teardownFullscreen(true);
  }, [isDetailPlayer, isFullscreen, teardownFullscreen]);

  useEffect(() => {
    floatingPositionRef.current = floatingPosition;
  }, [floatingPosition]);

  useEffect(() => {
    if (!pictureInPicture) return;
    const keepFloatingPlayerInBounds = () => {
      const current = floatingPositionRef.current;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!current || !rect) return;
      const edge = 10;
      setFloatingPosition({
        left: clamp(current.left, edge, Math.max(edge, window.innerWidth - rect.width - edge)),
        top: clamp(current.top, edge, Math.max(edge, window.innerHeight - rect.height - edge)),
      });
    };
    window.addEventListener("resize", keepFloatingPlayerInBounds);
    return () => window.removeEventListener("resize", keepFloatingPlayerInBounds);
  }, [pictureInPicture]);

  useEffect(
    () => () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
      clearLockedUnlockTimer();
      fullscreenRequestIdRef.current += 1;
      const fullscreenElement = getPlayerFullscreenElement();
      const playerIsFullscreen =
        fullscreenElement === containerRef.current ||
        fullscreenElement === videoRef.current ||
        fullscreenScrollYRef.current !== null;
      if (playerIsFullscreen) void exitPlayerFullscreen();
      void lockPlayerOrientation("portrait").finally(restoreFullscreenScroll);
      void setAndroidPlayerSystemBars(false);
    },
    [clearLockedUnlockTimer, restoreFullscreenScroll],
  );

  useEffect(() => {
    const syncFullscreenState = () => {
      const fullscreenElement = getPlayerFullscreenElement();
      const fullscreenTarget =
        fullscreenElement === containerRef.current || fullscreenElement === videoRef.current;
      if (fullscreenTarget) {
        setIsFullscreen(true);
        return;
      }
      if (isFullscreen || fullscreenScrollYRef.current !== null) {
        void finishFullscreenExit();
      } else {
        setIsFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", syncFullscreenState);
    document.addEventListener("webkitfullscreenchange", syncFullscreenState);
    window.addEventListener("resize", syncFullscreenState);
    syncFullscreenState();
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
      document.removeEventListener("webkitfullscreenchange", syncFullscreenState);
      window.removeEventListener("resize", syncFullscreenState);
    };
  }, [finishFullscreenExit, isFullscreen]);

  useEffect(() => {
    const shouldHideSystemBars =
      isAndroidApp && isFullscreen && !isVerticalVideo;
    if (nativeImmersiveModeRef.current === shouldHideSystemBars) return;
    nativeImmersiveModeRef.current = shouldHideSystemBars;
    void setAndroidPlayerSystemBars(shouldHideSystemBars);
  }, [isAndroidApp, isFullscreen, isVerticalVideo]);

  useEffect(() => {
    if (!isAndroidApp) return;
    const restoreFullscreenSystemBars = () => {
      const fullscreenElement = getPlayerFullscreenElement();
      const playerIsFullscreen =
        fullscreenElement === containerRef.current ||
        fullscreenElement === videoRef.current;
      const shouldHideSystemBars = playerIsFullscreen && !isVerticalVideo;
      nativeImmersiveModeRef.current = shouldHideSystemBars;
      void setAndroidPlayerSystemBars(shouldHideSystemBars);
    };
    window.addEventListener("yw-app-resume", restoreFullscreenSystemBars);
    return () => {
      window.removeEventListener("yw-app-resume", restoreFullscreenSystemBars);
    };
  }, [isAndroidApp, isVerticalVideo]);
  const toggleScreenLock = useCallback(() => {
    if (!isFullscreen) return;
    if (screenLocked) {
      clearLockedUnlockTimer();
      setLockedUnlockVisible(false);
      setScreenLocked(false);
      markControlsActivity();
      return;
    }
    clearLockedUnlockTimer();
    setLockedUnlockVisible(false);
    setControlsVisible(false);
    setSettingsMenu("closed");
    setScreenLocked(true);
  }, [clearLockedUnlockTimer, isFullscreen, markControlsActivity, screenLocked]);

  const seekBy = useCallback(
    (seconds: number) => {
      if (!isDetailPlayer || (isFullscreen && screenLocked)) return;
      const video = videoRef.current;
      if (!video) return;
      const currentTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
      const duration = Number.isFinite(video.duration) ? video.duration : Infinity;
      const nextTime = clamp(currentTime + seconds, 0, duration);
      video.currentTime = nextTime;
      setCurrentTime(nextTime);
      showGestureFeedback("seek", seconds, `${seconds > 0 ? "+" : ""}${seconds}s`);
      markControlsActivity();
    },
    [isDetailPlayer, isFullscreen, markControlsActivity, screenLocked, showGestureFeedback],
  );

  const settlePlayerSwipe = useCallback(() => {
    const container = containerRef.current;
    if (!container || container.style.willChange !== "transform") return;
    writePlayerTransform(container, 0, 0, PLAYER_SWIPE_TRANSITION);
    if (swipeTransformCleanupTimerRef.current !== null) {
      window.clearTimeout(swipeTransformCleanupTimerRef.current);
    }
    swipeTransformCleanupTimerRef.current = window.setTimeout(() => {
      swipeTransformCleanupTimerRef.current = null;
      if (containerRef.current !== container) return;
      container.style.willChange = "";
      container.style.transition = "";
      container.style.transform = "";
    }, PLAYER_SWIPE_TRANSITION_MS + 30);
  }, []);

  const registerPlayerTap = useCallback(
    (side: TapSide) => {
      const now = Date.now();
      const previousTap = lastTapRef.current;
      if (previousTap && now - previousTap.time < 320 && previousTap.side === side) {
        if (playerTapTimerRef.current !== null) {
          window.clearTimeout(playerTapTimerRef.current);
          playerTapTimerRef.current = null;
        }
        lastTapRef.current = null;
        seekBy(side === "right" ? 20 : -20);
        return true;
      }

      if (playerTapTimerRef.current !== null) {
        window.clearTimeout(playerTapTimerRef.current);
        playerTapTimerRef.current = null;
        lastTapRef.current = null;
        togglePlayPause();
      }

      lastTapRef.current = { time: now, side };
      playerTapTimerRef.current = window.setTimeout(() => {
        playerTapTimerRef.current = null;
        lastTapRef.current = null;
        togglePlayPause();
      }, 320);
      return false;
    },
    [seekBy, togglePlayPause],
  );

  const handlePlayerSurfaceClick = useCallback(
    (event: ReactMouseEvent<HTMLVideoElement>) => {
      if (!isDetailPlayer) return;
      if (Date.now() < suppressSyntheticClickUntilRef.current) return;
      if (screenLocked) {
        revealLockedUnlock();
        return;
      }
      const target = event.target;
      if (target instanceof Element && target.closest("button, input, [role='menu']")) return;
      if (settingsMenu !== "closed") {
        setSettingsMenu("closed");
        markControlsActivity();
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const side: TapSide = event.clientX - rect.left >= rect.width / 2 ? "right" : "left";
      registerPlayerTap(side);
    },
    [
      isDetailPlayer,
      markControlsActivity,
      registerPlayerTap,
      revealLockedUnlock,
      screenLocked,
      settingsMenu,
    ],
  );

  const handleTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLVideoElement>) => {
      if (!isDetailPlayer) return;
      if (swipeNavigationRef.current) {
        event.preventDefault();
        return;
      }
      const target = event.target;
      if (target instanceof Element && target.closest("button, input, [role='menu']")) {
        touchGestureRef.current = null;
        return;
      }
      if (isFullscreen && screenLocked) {
        event.preventDefault();
        return;
      }
      if (swipeTransformCleanupTimerRef.current !== null) {
        window.clearTimeout(swipeTransformCleanupTimerRef.current);
        swipeTransformCleanupTimerRef.current = null;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const firstTouch = event.touches.item(0);
      if (!firstTouch) return;
      const startedAt = performance.now();
      const startX = firstTouch.clientX - rect.left;
      if (event.touches.length >= 2) {
        if (!isFullscreen) {
          if (touchGestureRef.current) touchGestureRef.current.moved = true;
          return;
        }
        event.preventDefault();
        touchGestureRef.current = {
          startX,
          originX: firstTouch.clientX,
          originY: firstTouch.clientY,
          startedAt,
          width: rect.width,
          moved: true,
          swipeAxis: null,
          initialVolume: videoRef.current?.volume ?? 1,
          initialBrightness: brightness,
          initialDistance: touchDistance(event.touches),
          initialZoom: zoom,
        };
        return;
      }
      touchGestureRef.current = {
        startX,
        originX: firstTouch.clientX,
        originY: firstTouch.clientY,
        startedAt,
        width: rect.width,
        moved: false,
        swipeAxis: null,
        initialVolume: videoRef.current?.volume ?? 1,
        initialBrightness: brightness,
        initialDistance: null,
        initialZoom: zoom,
      };
    },
    [brightness, isDetailPlayer, isFullscreen, screenLocked, zoom],
  );

  const handleTouchMove = useCallback(
    (event: ReactTouchEvent<HTMLVideoElement>) => {
      if (!isDetailPlayer) return;
      if (isFullscreen && screenLocked) {
        event.preventDefault();
        return;
      }
      const gesture = touchGestureRef.current;
      if (!gesture) return;
      if (!isFullscreen) {
        const firstTouch = event.touches.item(0);
        if (!firstTouch) {
          gesture.moved = true;
          return;
        }
        const deltaX = firstTouch.clientX - gesture.originX;
        const deltaY = firstTouch.clientY - gesture.originY;
        if (Math.hypot(deltaX, deltaY) >= 8) gesture.moved = true;
        return;
      }
      if (event.touches.length >= 2 && gesture.initialDistance) {
        event.preventDefault();
        gesture.swipeAxis = null;
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
      const deltaX = firstTouch.clientX - gesture.originX;
      const deltaY = firstTouch.clientY - gesture.originY;
      const swipeAxis = isVerticalVideo ? "x" : "y";
      const primaryDelta = swipeAxis === "x" ? deltaX : deltaY;
      const crossDelta = swipeAxis === "x" ? deltaY : deltaX;

      if (
        !gesture.swipeAxis &&
        Math.abs(primaryDelta) >= 7 &&
        Math.abs(primaryDelta) >= Math.abs(crossDelta) * 1.1
      ) {
        gesture.swipeAxis = swipeAxis;
      }

      if (gesture.swipeAxis === swipeAxis) {
        gesture.moved = true;
        if (event.cancelable) event.preventDefault();
        const container = containerRef.current;
        const rect = container?.getBoundingClientRect();
        const maxOffset =
          Math.max(1, swipeAxis === "x" ? rect?.width ?? 0 : rect?.height ?? 0) * 0.85;
        const offset = clamp(primaryDelta, -maxOffset, maxOffset);
        writePlayerTransform(
          container,
          swipeAxis === "x" ? offset : 0,
          swipeAxis === "y" ? offset : 0,
          "none",
        );
        return;
      }

      if (Math.hypot(deltaX, deltaY) >= 8) gesture.moved = true;
      if (
        !isVerticalVideo ||
        Math.abs(deltaY) < 12 ||
        Math.abs(deltaY) < Math.abs(deltaX)
      ) {
        return;
      }
      if (event.cancelable) event.preventDefault();

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
    [isDetailPlayer, isFullscreen, isVerticalVideo, screenLocked, showGestureFeedback],
  );

  const handleTouchEnd = useCallback(
    (event: ReactTouchEvent<HTMLVideoElement>) => {
      if (!isDetailPlayer) return;
      const target = event.target;
      if (target instanceof Element && target.closest("button, input, [role='menu']")) {
        touchGestureRef.current = null;
        return;
      }
      suppressSyntheticClickUntilRef.current = Date.now() + 500;
      if (isFullscreen && screenLocked) {
        event.preventDefault();
        revealLockedUnlock();
        touchGestureRef.current = null;
        return;
      }
      const gesture = touchGestureRef.current;
      touchGestureRef.current = null;
      if (!gesture) return;
      if (gesture.swipeAxis) {
        const finalTouch = event.changedTouches.item(0);
        const deltaX = finalTouch ? finalTouch.clientX - gesture.originX : 0;
        const deltaY = finalTouch ? finalTouch.clientY - gesture.originY : 0;
        const primaryDelta = gesture.swipeAxis === "x" ? deltaX : deltaY;
        const distance = Math.abs(primaryDelta);
        const elapsed = Math.max(1, performance.now() - gesture.startedAt);
        const container = containerRef.current;
        const rect = container?.getBoundingClientRect();
        const axisLength = Math.max(
          1,
          gesture.swipeAxis === "x" ? rect?.width ?? 0 : rect?.height ?? 0,
        );
        const commitDistance = clamp(axisLength * 0.14, 42, 76);
        const isFastSwipe = distance >= 18 && distance / elapsed >= 0.55;
        const direction: 1 | -1 = primaryDelta < 0 ? 1 : -1;
        const adjacent = activeVideo
          ? getAdjacentVideo(activeVideo.id, isVerticalVideo, direction)
          : null;

        if (adjacent && (distance >= commitDistance || isFastSwipe)) {
          const exitOffset = primaryDelta < 0 ? -axisLength : axisLength;
          swipeNavigationRef.current = {
            targetVideoId: adjacent.id,
            axis: gesture.swipeAxis,
            exitOffset,
          };
          writePlayerTransform(
            container,
            gesture.swipeAxis === "x" ? exitOffset : 0,
            gesture.swipeAxis === "y" ? exitOffset : 0,
            PLAYER_SWIPE_TRANSITION,
          );
          if (swipeNavigateTimerRef.current !== null) {
            window.clearTimeout(swipeNavigateTimerRef.current);
          }
          swipeNavigateTimerRef.current = window.setTimeout(() => {
            swipeNavigateTimerRef.current = null;
            void navigate({
              to: "/video/$videoId",
              params: { videoId: adjacent.id },
            });
          }, PLAYER_SWIPE_TRANSITION_MS);
        } else {
          settlePlayerSwipe();
        }
        event.preventDefault();
        return;
      }
      if (gesture.moved) return;
      const side: TapSide = gesture.startX >= gesture.width / 2 ? "right" : "left";
      if (registerPlayerTap(side)) event.preventDefault();
    },
    [
      activeVideo,
      isDetailPlayer,
      isFullscreen,
      isVerticalVideo,
      navigate,
      registerPlayerTap,
      revealLockedUnlock,
      screenLocked,
      settlePlayerSwipe,
    ],
  );

  const handleTouchCancel = useCallback(() => {
    const wasSwiping = Boolean(touchGestureRef.current?.swipeAxis);
    touchGestureRef.current = null;
    if (wasSwiping) settlePlayerSwipe();
  }, [settlePlayerSwipe]);

  const handleTimeUpdate = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const wasSeeking = video.seeking || seekActivityRef.current;
    seekActivityRef.current = false;
    setCurrentTime(video.currentTime);
    if (Number.isFinite(video.duration)) setDuration(video.duration);
    timeUpdateHandlerRef.current?.(
      video.currentTime,
      Number.isFinite(video.duration) ? video.duration : 0,
      wasSeeking,
    );
  }, []);

  const handleVideoSeeking = useCallback(() => {
    seekActivityRef.current = true;
  }, []);

  const handleVideoSeeked = useCallback(() => {
    seekActivityRef.current = true;
  }, []);

  const handleLoadedMetadata = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const isVertical = video.videoHeight > video.videoWidth;
    setIsVerticalVideo(isVertical);
    if (Number.isFinite(video.duration)) setDuration(video.duration);
    setCurrentTime(Number.isFinite(video.currentTime) ? video.currentTime : 0);
    setIsMuted(video.muted);
    const fullscreenElement = getPlayerFullscreenElement();
    if (fullscreenElement === containerRef.current || fullscreenElement === videoRef.current) {
      void lockPlayerOrientation(isVertical ? "portrait" : "landscape");
    }
  }, []);

  const handleVolumeChange = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    setIsMuted(video.muted || video.volume === 0);
  }, []);

  const openDetail = useCallback(() => {
    if (!activeVideo) return;
    setPictureInPicture(false);
    setFloatingPosition(null);
    setFloatingDragging(false);
    floatingDragRef.current = null;
    if (activeVideo.detailRoute?.startsWith("/downloads/")) {
      void navigate({
        to: "/downloads/$downloadId",
        params: { downloadId: activeVideo.id },
      });
      return;
    }
    void navigate({ to: "/video/$videoId", params: { videoId: activeVideo.id } });
  }, [activeVideo, navigate]);

  const openFromFloatingPlayer = useCallback(() => {
    if (suppressFloatingClickRef.current) {
      suppressFloatingClickRef.current = false;
      return;
    }
    openDetail();
  }, [openDetail]);

  const contextValue = useMemo<VideoPlaybackContextValue>(
    () => ({
      activeVideo,
      isDetailPlayer,
      isVerticalVideo,
      currentTime,
      duration,
      isPlaying,
      videoRef,
      activateVideo,
      setTimeUpdateHandler,
      setEndedHandler,
      closeVideo,
    }),
    [
      activeVideo,
      activateVideo,
      closeVideo,
      currentTime,
      duration,
      isDetailPlayer,
      isVerticalVideo,
      isPlaying,
      setEndedHandler,
      setTimeUpdateHandler,
    ],
  );

  return (
    <VideoPlaybackContext.Provider value={contextValue}>
      <div
        className={
          isPlayerRoute
            ? `relative flex h-[100dvh] flex-col ${isFullscreen ? "overflow-visible" : "overflow-hidden"}`
            : "relative min-h-screen"
        }
      >
        <div
          className={
            isPlayerRoute
              ? "yw-video-detail-scroll order-2 min-h-0 flex-1 overflow-y-auto overscroll-contain"
              : "relative min-h-screen"
          }
        >
          {children}
        </div>
        {activeVideo ? (
          <div
          ref={containerRef}
          className={
            pictureInPicture
              ? `fixed z-[100] ${
                  isVerticalVideo ? "w-[min(54vw,15rem)]" : "w-[min(76vw,20rem)]"
                } max-h-[calc(100dvh-1.5rem)] overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl ${
                  floatingPosition ? "" : "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3"
                } ${
                  floatingDragging
                    ? "cursor-grabbing transition-none"
                    : "cursor-grab transition-[left,top] duration-200 ease-out"
                }`
              : isDetailPlayer
                ? isFullscreen
                  ? `fixed inset-0 z-50 h-screen w-screen max-w-none bg-black ${
                      needsAndroidPortraitSafeArea ? "yw-android-video-safe-area" : ""
                    }`
                  : `sticky top-0 z-50 order-1 mx-auto block aspect-video w-full max-w-lg shrink-0 bg-black ${
                      needsAndroidPortraitSafeArea ? "yw-android-video-safe-area" : ""
                    }`
                : isPlayerRoute
                  ? "pointer-events-none fixed left-[-9999px] top-[-9999px] z-[-1] h-px w-px opacity-0"
                  : "fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3 z-[70] w-[min(68vw,280px)] overflow-hidden rounded-xl border border-white/15 bg-zinc-950 shadow-2xl"
          }
          onPointerDown={pictureInPicture ? startFloatingDrag : undefined}
          onPointerMove={pictureInPicture ? moveFloatingPlayer : undefined}
          onPointerUp={pictureInPicture ? finishFloatingDrag : undefined}
          onPointerCancel={pictureInPicture ? finishFloatingDrag : undefined}
          style={
            pictureInPicture
              ? {
                  touchAction: "none",
                  ...(floatingPosition
                    ? {
                        left: floatingPosition.left,
                        top: floatingPosition.top,
                        right: "auto",
                        bottom: "auto",
                      }
                    : {}),
                }
              : showDetailChrome
                ? { touchAction: isFullscreen ? "none" : "auto" }
                : undefined
          }
        >
          <VideoPlayerErrorBoundary
            key={`${activeVideo.id}:${activeVideo.url}`}
            onRetry={retryPlayback}
            onBack={showDetailChrome ? goBackFromPlayerError : undefined}
          >
          <div
            className={
              showDetailChrome
                ? `relative w-full bg-black ${
                    isFullscreen
                      ? `h-screen w-screen ${
                          needsAndroidPortraitSafeArea
                            ? "yw-android-video-safe-area-fullscreen"
                            : ""
                        }`
                    : "h-full"
                  }`
                : `relative ${
                    isVerticalVideo ? "aspect-[9/16]" : "aspect-video"
                  } w-full bg-black`
            }
            onClick={
              pictureInPicture
                ? openFromFloatingPlayer
                : undefined
            }
            style={showDetailChrome && isFullscreen ? { width: "100vw", height: "100vh" } : undefined}
          >
            <video
              ref={videoRef}
              poster={resolvedPoster ?? activeVideo.thumbnailUrl ?? undefined}
              controls={false}
              autoPlay
              loop={loopVideo}
              muted={isMuted}
              playsInline
              preload="none"
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleNativeMediaError}
              onTimeUpdate={handleTimeUpdate}
              onSeeking={handleVideoSeeking}
              onSeeked={handleVideoSeeked}
              onEnded={handleVideoEnded}
              onVolumeChange={handleVolumeChange}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onClick={showDetailChrome ? handlePlayerSurfaceClick : undefined}
              onTouchStart={showDetailChrome ? handleTouchStart : undefined}
              onTouchMove={showDetailChrome ? handleTouchMove : undefined}
              onTouchEnd={showDetailChrome ? handleTouchEnd : undefined}
      onTouchCancel={showDetailChrome ? handleTouchCancel : undefined}
              className={`video-player-native-controls h-full w-full ${
                (showDetailChrome && isFullscreen) || displayMode === "fill"
                  ? "object-cover"
                  : "object-contain"
              }`}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
                objectFit:
                  (showDetailChrome && isFullscreen) || displayMode === "fill"
                    ? "cover"
                    : "contain",
                filter: `brightness(${brightness})`,
                transition: gestureFeedback?.kind === "zoom" ? "none" : "transform 160ms ease-out",
                touchAction: showDetailChrome ? (isFullscreen ? "none" : "auto") : undefined,
              }}
            />

            {mediaError?.id === activeVideo.id && mediaError.url === activeVideo.url ? (
              <div
                className="absolute inset-0 z-[85] grid place-items-center bg-black/95 px-5 text-center text-white"
                role="alert"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex max-w-xs flex-col items-center gap-3">
                  <p className="text-sm font-semibold">This video could not be played.</p>
                  <p className="text-xs text-white/65">
                    Check your connection, then try again.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={retryPlayback}
                      className="rounded-full bg-pink-600 px-4 py-2 text-xs font-semibold text-white hover:bg-pink-700"
                    >
                      Retry video
                    </button>
                    {showDetailChrome ? (
                      <button
                        type="button"
                        onClick={goBackFromPlayerError}
                        className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                      >
                        Back
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {pictureInPicture ? (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    togglePlayPause();
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  className="absolute left-1/2 top-1/2 z-[80] grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/65 text-white shadow-xl backdrop-blur-md transition hover:bg-black/85"
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6 fill-current" />
                  ) : (
                    <Play className="ml-0.5 h-6 w-6 fill-current" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    closeVideo();
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  className="absolute right-2 top-2 z-[80] grid h-8 w-8 place-items-center rounded-full bg-black/75 text-white shadow-lg backdrop-blur-sm transition hover:bg-black"
                  aria-label="Close picture-in-picture"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[70] bg-gradient-to-t from-black/85 to-transparent px-2.5 pb-2 pt-8 text-[11px] font-semibold text-white">
                  <span className="block truncate">{activeVideo.title || "Now playing"}</span>
                </div>
              </>
            ) : null}

            {showDetailChrome && !screenLocked ? (
              <div
                className={`pointer-events-none absolute inset-x-0 bottom-0 z-40 transition-opacity duration-200 ${
                  controlsVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                <div
                  className={`bg-gradient-to-t from-black/90 via-black/45 to-transparent px-3 pb-2 pt-12 ${
                    controlsVisible ? "pointer-events-auto" : "pointer-events-none"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-white">
                    <span className="text-xs font-medium tabular-nums">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="relative top-1 rounded-full p-2 transition hover:bg-white/15"
                        aria-label={isMuted ? "Unmute video" : "Mute video"}
                      >
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </button>
                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="relative top-1 rounded-full p-2 transition hover:bg-white/15"
                        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                      >
                        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(duration, 1)}
                    step={0.1}
                    value={Math.min(currentTime, duration || 0)}
                    onChange={handleSeek}
                    aria-label="Seek video"
                    className="mt-2 h-1 w-full cursor-pointer accent-white"
                  />
                </div>
              </div>
            ) : null}

            {showDetailChrome && !screenLocked && gestureFeedback?.kind === "playback" ? (
              <div className="pointer-events-none absolute inset-0 z-50 grid place-items-center">
                <span
                  key={gestureFeedback.id}
                  aria-hidden="true"
                  className="yw-video-playback-feedback grid h-14 w-14 place-items-center rounded-full border border-white/15 bg-black/45 text-white/90 shadow-lg backdrop-blur-sm"
                >
                  {gestureFeedback.label === "play" ? (
                    <Play className="ml-0.5 h-6 w-6 fill-current" />
                  ) : (
                    <Pause className="h-6 w-6 fill-current" />
                  )}
                </span>
              </div>
            ) : null}

            {showDetailChrome && !screenLocked && gestureFeedback?.kind === "seek" ? (
              <div className="pointer-events-none absolute inset-0 z-50">
                <div
                  key={gestureFeedback.id}
                  className={`absolute inset-y-0 flex w-1/2 items-center justify-center ${
                    gestureFeedback.value > 0 ? "right-0" : "left-0"
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  <span className="relative grid h-24 w-24 place-items-center">
                    <span
                      aria-hidden="true"
                      className="yw-video-seek-ripple absolute inset-0 rounded-full border border-white/45"
                    />
                    <span
                      aria-hidden="true"
                      className="yw-video-seek-ripple absolute inset-2 rounded-full border border-white/30"
                      style={{ animationDelay: "100ms" }}
                    />
                    <span className="relative flex flex-col items-center gap-1 rounded-full border border-white/10 bg-black/60 px-4 py-3 text-white shadow-xl backdrop-blur-md">
                      {gestureFeedback.value > 0 ? (
                        <RotateCw
                          aria-hidden="true"
                          className="yw-video-seek-arrow h-6 w-6"
                        />
                      ) : (
                        <RotateCcw
                          aria-hidden="true"
                          className="yw-video-seek-arrow h-6 w-6"
                        />
                      )}
                      <span className="text-sm font-bold tabular-nums">
                        {gestureFeedback.label}
                      </span>
                    </span>
                  </span>
                </div>
              </div>
            ) : null}

            {showDetailChrome && isFullscreen && !screenLocked ? (
              <div className="pointer-events-none absolute inset-0 z-50">
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

            {showDetailChrome && isFullscreen && screenLocked ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleScreenLock();
                }}
                className={`absolute right-3 top-[max(env(safe-area-inset-top,0px),40px)] z-[60] rounded-full bg-black/45 p-1.5 text-white/80 shadow-lg backdrop-blur-sm transition-opacity duration-300 hover:bg-black/70 hover:text-white ${
                  lockedUnlockVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
                }`}
                aria-label="Unlock player controls"
                onTouchStart={(event) => event.stopPropagation()}
                onTouchEnd={(event) => event.stopPropagation()}
              >
                <Lock className="h-4 w-4" />
              </button>
            ) : null}

            {showDetailChrome && !screenLocked ? (
              <button
                type="button"
                onClick={() =>
                  activeVideo.backTo
                    ? (closeVideo(), void navigate({ to: activeVideo.backTo as never }))
                    : window.history.length > 1
                      ? window.history.back()
                      : void navigate({ to: "/" })
                }
                className={`absolute left-3 top-2 z-50 rounded-full bg-black/60 p-2 text-white transition-opacity duration-200 hover:bg-black/80 ${
                  controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
                aria-label="Go back"
                onTouchStart={(event) => event.stopPropagation()}
                onTouchEnd={(event) => event.stopPropagation()}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : null}

            {showDetailChrome && isFullscreen && !screenLocked ? (
              <button
                type="button"
                onClick={toggleScreenLock}
                className={`absolute right-14 top-[max(env(safe-area-inset-top,0px),40px)] z-50 rounded-full bg-black/60 p-2 text-white transition-opacity duration-200 hover:bg-black/80 ${
                  controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
                aria-label="Lock player controls"
                onTouchStart={(event) => event.stopPropagation()}
                onTouchEnd={(event) => event.stopPropagation()}
                onDoubleClick={(event) => event.stopPropagation()}
              >
                <Lock className="h-5 w-5" />
              </button>
            ) : null}

            {!isDetailPlayer && !isPlayerRoute && !pictureInPicture ? (
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

            {showDetailChrome && !screenLocked ? (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSettingsMenu((current) => (current === "closed" ? "root" : "closed"));
                  }}
                  className={`absolute right-3 top-2 z-[70] rounded-full bg-black/60 p-2 text-white transition-opacity duration-200 hover:bg-black/90 ${
                    controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                  aria-label="Player settings"
                  aria-expanded={settingsMenu !== "closed"}
                  onTouchStart={(event) => event.stopPropagation()}
                  onTouchEnd={(event) => event.stopPropagation()}
                >
                  <MoreVertical className="h-5 w-5" />
                </button>

                {settingsMenu !== "closed" ? (
                  <div
                    role="menu"
                    className="absolute bottom-20 right-3 z-[70] w-52 overflow-hidden rounded-xl border border-white/15 bg-black/85 p-1.5 text-white shadow-2xl backdrop-blur-xl"
                    onClick={(event) => event.stopPropagation()}
                    onTouchStart={(event) => event.stopPropagation()}
                    onTouchEnd={(event) => event.stopPropagation()}
                  >
                    {settingsMenu === "root" ? (
                      <>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => setSettingsMenu("quality")}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-white/10"
                        >
                          <span className="flex items-center gap-2">
                            <Settings2 className="h-4 w-4 text-white/70" />
                            Quality
                          </span>
                          <span className="max-w-[84px] truncate text-[11px] text-white/60">
                            {qualityLabel(quality, quality === "auto" ? activeHlsHeight : null)}
                          </span>
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => setSettingsMenu("speed")}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-white/10"
                        >
                          <span>Playback speed</span>
                          <span className="text-[11px] text-white/60">
                            {playbackRate === 1 ? "Normal" : `${playbackRate}×`}
                          </span>
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={togglePictureInPicture}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-white/10"
                        >
                          <PictureInPicture className="h-4 w-4 text-white/70" />
                          Picture-in-picture
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setLoopVideo((current) => !current);
                            setSettingsMenu("closed");
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-white/10"
                        >
                          <span className="flex items-center gap-2">
                            <Repeat className="h-4 w-4 text-white/70" />
                            Loop video
                          </span>
                          <span className="text-[11px] text-white/60">{loopVideo ? "On" : "Off"}</span>
                        </button>
                      </>
                    ) : settingsMenu === "speed" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setSettingsMenu("root")}
                          className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-semibold text-white/60 transition hover:bg-white/10"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Playback speed
                        </button>
                        {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            role="menuitem"
                            onClick={() => setRate(rate)}
                            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-white/10"
                          >
                            {rate === 1 ? "Normal" : `${rate}×`}
                            {playbackRate === rate ? <Check className="h-4 w-4" /> : null}
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setSettingsMenu("root")}
                          className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-semibold text-white/60 transition hover:bg-white/10"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Quality
                        </button>
                        {qualityOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            role="menuitem"
                            disabled={!option.available}
                            onClick={() => selectQuality(option.id)}
                            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            <span>
                              {option.label}
                              {option.description ? (
                                <span className="ml-1 text-[11px] text-white/50">({option.description})</span>
                              ) : null}
                            </span>
                            {quality === option.id ? <Check className="h-4 w-4" /> : null}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
          {!isDetailPlayer && !isPlayerRoute && !pictureInPicture ? (
            <button
              type="button"
              onClick={openDetail}
              className="block w-full truncate bg-zinc-950 px-2.5 py-2 text-left text-[11px] font-semibold text-white"
            >
              {activeVideo.title || "Now playing"}
            </button>
          ) : null}
          </VideoPlayerErrorBoundary>
          </div>
        ) : null}
      </div>
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

export function VideoPlaybackSlot({
  className = "",
}: {
  className?: string;
} = {}) {
  const { isDetailPlayer } = useVideoPlayback();
  if (isDetailPlayer) return null;
  return (
    <div
      className={`mx-auto block aspect-video w-full max-w-lg bg-black ${className}`}
      aria-hidden="true"
    />
  );
}