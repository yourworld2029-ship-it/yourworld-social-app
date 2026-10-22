import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  memo,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SyntheticEvent as ReactSyntheticEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { getAppScrollContainer } from "@/lib/app-scroll-container";
import type { VideoQualityTier } from "@/lib/video-quality";
import {
  getFullscreenGestureZone,
  isVerticalAdjustmentGesture,
} from "@/lib/video-player-gestures";
import { getAdjacentVideo } from "@/lib/video-queue";
import { resolveMediaUrl } from "@/lib/social-data";
import { VideoPlayerErrorBoundary } from "@/components/yw/VideoPlayerErrorBoundary";
import { VIDEO_POSTER_FALLBACK } from "@/components/yw/LazyVideoThumbnail";
import {
  cacheVideoPoster,
  getResolvedVideoCover,
} from "@/lib/video-prefetch";
import {
  createVideoPlaybackProgressStore,
  type VideoPlaybackProgressStore,
} from "@/lib/video-playback-progress";
import {
  attemptVideoPlay,
  detectNativeVideoSupport,
  firstPlayablePlaybackFallback,
  isAutoplayPolicyError,
  isHlsMediaUrl,
  mediaErrorName,
  safeMediaUrlForLog,
  supportsNativeHls,
} from "@/lib/video-playback-engine";
import {
  ArrowLeft,
  Check,
  ChevronsLeft,
  ChevronsRight,
  Lock,
  Maximize,
  Minimize,
  MoreVertical,
  Pause,
  PictureInPicture,
  Play,
  Repeat,
  Settings2,
  Sun,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
} from "lucide-react";
import Hls from "hls.js";
import {
  bindHlsNetworkAwareLevelCap,
  createVideoHlsConfig,
  selectHlsLevelAtOrBelow,
} from "@/lib/video-hls-config";
import { toast } from "sonner";

const QUALITY_OPTIONS = [
  { id: "auto", label: "Auto", description: "Recommended", shortSide: null },
  { id: "1080p", label: "1080p", description: "HD", shortSide: 1080 },
  { id: "720p", label: "720p", description: "", shortSide: 720 },
  { id: "480p", label: "480p", description: "", shortSide: 480 },
  { id: "360p", label: "360p", description: "Data Saver", shortSide: 360 },
] as const;

export type QualityId = (typeof QUALITY_OPTIONS)[number]["id"];
export type QualityUrls = Partial<Record<VideoQualityTier, string>>;

function qualityLabel(quality: QualityId, activeHeight?: number | null) {
  if (quality === "auto") {
    return activeHeight ? `Auto ${activeHeight}p` : "Auto";
  }
  return quality;
}

function levelForQuality(levels: Hls["levels"], quality: Exclude<QualityId, "auto">) {
  const target = QUALITY_OPTIONS.find((option) => option.id === quality)?.shortSide;
  if (!target || levels.length === 0) return -1;
  return selectHlsLevelAtOrBelow(levels, target);
}

type GestureFeedback = {
  id: number;
  kind: "seek" | "volume" | "brightness" | "zoom";
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
  zone: "brightness" | "volume" | "navigation" | "multi";
  swipeAxis: "x" | "y" | null;
  adjustmentKind: "volume" | "brightness" | null;
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

type SystemVideoPipPlugin = {
  setPlaybackState(options: {
    active: boolean;
    playing: boolean;
    aspectRatioWidth: number;
    aspectRatioHeight: number;
  }): Promise<void>;
  setFullscreenImmersive(options: { enabled: boolean }): Promise<void>;
  setWatchTopEdgeToEdge(options: { enabled: boolean }): Promise<void>;
  getMediaVolume(): Promise<{ value: number }>;
  setMediaVolume(options: { value: number }): Promise<void>;
};

type VideoBrightnessPlugin = {
  getBrightness(): Promise<{ value: number }>;
  setBrightness(options: { value: number }): Promise<void>;
  restoreBrightness(): Promise<void>;
};

type LiveScreenOrientationPlugin = {
  setLiveMode(options: { active: boolean }): Promise<void>;
};

const globalSystemVideoPip = globalThis as typeof globalThis & {
  __yourWorldSystemVideoPip?: SystemVideoPipPlugin;
};
const systemVideoPip =
  globalSystemVideoPip.__yourWorldSystemVideoPip ??
  (globalSystemVideoPip.__yourWorldSystemVideoPip =
    registerPlugin<SystemVideoPipPlugin>("SystemVideoPip"));
const globalVideoBrightness = globalThis as typeof globalThis & {
  __yourWorldVideoBrightness?: VideoBrightnessPlugin;
};
const videoBrightness =
  globalVideoBrightness.__yourWorldVideoBrightness ??
  (globalVideoBrightness.__yourWorldVideoBrightness =
    registerPlugin<VideoBrightnessPlugin>("VideoBrightness"));
const globalLiveScreenOrientation = globalThis as typeof globalThis & {
  __yourWorldLiveScreenOrientation?: LiveScreenOrientationPlugin;
};
const liveScreenOrientationPlugin =
  globalLiveScreenOrientation.__yourWorldLiveScreenOrientation ??
  (globalLiveScreenOrientation.__yourWorldLiveScreenOrientation =
    registerPlugin<LiveScreenOrientationPlugin>("LiveScreenOrientation"));

type FloatingPosition = {
  left: number;
  top: number;
};

type PlayerMenuPlacement = {
  left: number;
  top: number;
  maxHeight: number;
};

type FloatingDrag = FloatingPosition & {
  mode: "move" | "resize";
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
  resolvePlaybackQuality?: (
    quality: Exclude<QualityId, "auto">,
  ) => Promise<string>;
  fallbackUrls?: string[];
  initialTime?: number;
};

export type LongVideoPlayerMenuActions = {
  onNotInterested: () => void;
  onDontRecommendCreator: () => void;
  onReport: () => void;
  onDelete?: () => void;
};

type VideoPlaybackContextValue = {
  activeVideo: PersistentVideo | null;
  isDetailPlayer: boolean;
  isVerticalVideo: boolean;
  isPlaying: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  activateVideo: (video: PersistentVideo) => void;
  setLongVideoPlayerMenuActions: (
    actions: LongVideoPlayerMenuActions | null,
  ) => void;
  setTimeUpdateHandler: (
    handler: ((currentTime: number, duration: number, wasSeeking: boolean) => void) | null,
  ) => void;
  setEndedHandler: (handler: (() => void) | null) => void;
  closeVideo: () => void;
};

const VideoPlaybackContext = createContext<VideoPlaybackContextValue | null>(null);
const VideoPlaybackProgressContext =
  createContext<VideoPlaybackProgressStore | null>(null);

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
let liveScreenOwnsOrientation = false;

function enqueueOrientationChange(change: () => Promise<void>) {
  const nextChange = orientationChangeQueue.then(change, change);
  orientationChangeQueue = nextChange.catch(() => {});
  return nextChange;
}

async function applyLiveOrientation(active: boolean) {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
    try {
      await liveScreenOrientationPlugin.setLiveMode({ active });
      return;
    } catch (cause) {
      console.warn("[live] Native sensor rotation is unavailable", cause);
    }
  }

  if (active) {
    await ScreenOrientation.unlock();
  } else {
    await ScreenOrientation.lock({ orientation: "portrait" });
  }
}

export function setLiveScreenOrientationActive(active: boolean) {
  liveScreenOwnsOrientation = active;
  return enqueueOrientationChange(async () => {
    try {
      await applyLiveOrientation(liveScreenOwnsOrientation);
    } catch (cause) {
      console.warn("[live] Could not update device rotation", cause);
    }
  });
}

function lockPlayerOrientation(requestedOrientation: "portrait" | "landscape") {
  return enqueueOrientationChange(async () => {
    if (liveScreenOwnsOrientation) {
      try {
        await applyLiveOrientation(true);
      } catch (cause) {
        console.warn("[live] Could not keep device rotation enabled", cause);
      }
      return;
    }
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

export function VideoPlaybackProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const progressStoreRef = useRef<VideoPlaybackProgressStore | null>(null);
  if (!progressStoreRef.current) {
    progressStoreRef.current = createVideoPlaybackProgressStore();
  }
  const progressStore = progressStoreRef.current;
  const setCurrentTime = useCallback(
    (currentTime: number) => progressStore.setCurrentTime(currentTime),
    [progressStore],
  );
  const setDuration = useCallback(
    (duration: number) => progressStore.setDuration(duration),
    [progressStore],
  );
  const [activeVideo, setActiveVideo] = useState<PersistentVideo | null>(null);
  const [playbackSourceOverride, setPlaybackSourceOverride] = useState<{
    id: string;
    primaryUrl: string;
    url: string;
  } | null>(null);
  const [mediaError, setMediaError] = useState<{ id: string; url: string } | null>(null);
  const [playbackRetryKey, setPlaybackRetryKey] = useState(0);
  const [resolvedPoster, setResolvedPoster] = useState<{ key: string; url: string } | null>(null);
  const [hasVideoFrame, setHasVideoFrame] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVerticalVideo, setIsVerticalVideo] = useState(false);
  const [screenLocked, setScreenLocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [controlsActivity, setControlsActivity] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [gestureFeedback, setGestureFeedback] = useState<GestureFeedback | null>(null);
  const [gestureBrightness, setGestureBrightness] = useState(0.5);
  const [lockedUnlockVisible, setLockedUnlockVisible] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [displayMode, setDisplayMode] = useState<"fit" | "fill">("fit");
  const [mediaVolume, setMediaVolume] = useState(1);
  const [pictureInPicture, setPictureInPicture] = useState(false);
  const [systemPictureInPicture, setSystemPictureInPicture] = useState(false);
  const [floatingPosition, setFloatingPosition] = useState<FloatingPosition | null>(null);
  const [floatingWidth, setFloatingWidth] = useState<number | null>(null);
  const [floatingDragging, setFloatingDragging] = useState(false);
  const isAndroidApp =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const [settingsMenu, setSettingsMenu] = useState<"closed" | "root" | "speed" | "quality">("closed");
  const [settingsMenuPlacement, setSettingsMenuPlacement] =
    useState<PlayerMenuPlacement | null>(null);
  const [longVideoPlayerMenuActions, setLongVideoPlayerMenuActionsState] =
    useState<LongVideoPlayerMenuActions | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loopVideo, setLoopVideo] = useState(false);
  const [quality, setQuality] = useState<QualityId>("auto");
  const [pendingQualitySwitch, setPendingQualitySwitch] =
    useState<QualityId | null>(null);
  const [hlsLevels, setHlsLevels] = useState<Hls["levels"]>([]);
  const [activeHlsHeight, setActiveHlsHeight] = useState<number | null>(null);

  const setNativeFullscreenImmersive = useCallback(
    async (enabled: boolean) => {
      if (!isAndroidApp) return;
      try {
        await systemVideoPip.setFullscreenImmersive({ enabled });
      } catch (error) {
        console.warn("Could not update Android fullscreen system bars.", error);
      }
    },
    [isAndroidApp],
  );

  const syncNativePipState = useCallback(
    (active: boolean, playing: boolean) => {
      if (!isAndroidApp) return;
      void systemVideoPip
        .setPlaybackState({
          active,
          playing,
          aspectRatioWidth: isVerticalVideo ? 9 : 16,
          aspectRatioHeight: isVerticalVideo ? 16 : 9,
        })
        .catch((error: unknown) => {
          console.warn("Could not update Android picture-in-picture state.", error);
        });
    },
    [isAndroidApp, isVerticalVideo],
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const settingsMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);
  const activeVideoRef = useRef<PersistentVideo | null>(null);
  const fallbackAttemptRef = useRef<string | null>(null);
  const activeSourceRef = useRef<{ id: string; url: string } | null>(null);
  const playbackAttemptRef = useRef(0);
  const qualitySwitchRequestRef = useRef(0);
  const pendingPlaybackReadyRef = useRef<{
    video: HTMLVideoElement;
    attempt: number;
    listener: () => void;
  } | null>(null);
  const forcePlaybackReloadRef = useRef(false);
  const automaticPlaybackRetryRef = useRef<{
    sourceKey: string;
    retries: number;
    timer: number | null;
  }>({ sourceKey: "", retries: 0, timer: null });
  const hlsRef = useRef<Hls | null>(null);
  activeVideoRef.current = activeVideo;
  const activeVideoId = activeVideo?.id;
  const activeVideoUrl =
    playbackSourceOverride !== null &&
    playbackSourceOverride.id === activeVideo?.id &&
    playbackSourceOverride.primaryUrl === activeVideo?.url
      ? playbackSourceOverride.url
      : activeVideo?.url;
  const activeVideoInitialTime = activeVideo?.initialTime;
  const activePosterKey = activeVideo
    ? `${activeVideo.id}\u0000${activeVideo.thumbnailUrl ?? ""}`
    : "";

  const clearPendingPlaybackReady = useCallback(() => {
    const pending = pendingPlaybackReadyRef.current;
    if (!pending) return;
    pending.video.removeEventListener("loadeddata", pending.listener);
    pending.video.removeEventListener("canplay", pending.listener);
    pendingPlaybackReadyRef.current = null;
  }, []);

  const scheduleAutomaticPlaybackRetry = useCallback(
    (source: { id: string; url: string }, attempt: number) => {
      const sourceKey = `${source.id}\u0000${source.url}`;
      let retry = automaticPlaybackRetryRef.current;
      if (retry.sourceKey !== sourceKey) {
        if (retry.timer !== null) window.clearTimeout(retry.timer);
        retry = { sourceKey, retries: 0, timer: null };
        automaticPlaybackRetryRef.current = retry;
      }
      if (retry.timer !== null) return true;
      if (retry.retries >= 3) return false;

      retry.retries += 1;
      clearPendingPlaybackReady();
      setMediaError(null);
      setIsBuffering(true);
      setIsPlaying(false);
      retry.timer = window.setTimeout(() => {
        if (automaticPlaybackRetryRef.current !== retry) return;
        retry.timer = null;
        const activeSource = activeSourceRef.current;
        if (
          playbackAttemptRef.current !== attempt ||
          activeSource?.id !== source.id ||
          activeSource.url !== source.url
        ) {
          return;
        }
        forcePlaybackReloadRef.current = true;
        setPlaybackRetryKey((key) => key + 1);
      }, 1000);
      return true;
    },
    [clearPendingPlaybackReady],
  );

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
      clearPendingPlaybackReady();
      setIsPlaying(false);
      setIsBuffering(false);
      setMediaError({ id: source.id, url: source.url });
      videoRef.current?.pause();
    },
    [clearPendingPlaybackReady],
  );

  const attemptStorageFallback = useCallback(
    (source: { id: string; url: string }) => {
      const video = activeVideoRef.current;
      const fallbackUrl = firstPlayablePlaybackFallback(
        source.url,
        video?.fallbackUrls,
      );
      if (
        !video ||
        video.id !== source.id ||
        video.url !== source.url ||
        !fallbackUrl
      ) {
        return false;
      }

      const attemptKey = `${source.id}\u0000${source.url}`;
      if (fallbackAttemptRef.current === attemptKey) return true;
      fallbackAttemptRef.current = attemptKey;

      // Point the native player directly at Supabase Storage. The <video>
      // element handles progressive Range requests; don't prefetch bytes here
      // because an app-side timeout can reject a playable source prematurely.
      console.warn("[video-playback] switching to direct MP4 fallback", {
        videoId: source.id,
        source: safeMediaUrlForLog(source.url),
        fallback: safeMediaUrlForLog(fallbackUrl),
      });
      setMediaError(null);
      setIsBuffering(true);
      setPlaybackSourceOverride({
        id: source.id,
        primaryUrl: video.url,
        url: fallbackUrl,
      });
      return true;
    },
    [],
  );

  const handleNativeMediaError = useCallback(
    (event: ReactSyntheticEvent<HTMLVideoElement>) => {
      const source = activeSourceRef.current;
      if (!source) return;
      const currentSource = event.currentTarget.currentSrc;
      if (currentSource && currentSource !== source.url) return;
      const mediaError = event.currentTarget.error;
      console.warn("[video-playback] native media source failed", {
        videoId: source.id,
        source: safeMediaUrlForLog(source.url),
        code: mediaError?.code ?? null,
        message: mediaError?.message ?? "",
        networkState: event.currentTarget.networkState,
        readyState: event.currentTarget.readyState,
      });
      const attempt = playbackAttemptRef.current;
      if (scheduleAutomaticPlaybackRetry(source, attempt)) return;
      if (attemptStorageFallback(source)) return;
      reportMediaError(source, attempt);
    },
    [attemptStorageFallback, reportMediaError, scheduleAutomaticPlaybackRetry],
  );

  const requestPlayback = useCallback(
    (source: { id: string; url: string }, attempt: number, retryMuted: boolean) => {
      const video = videoRef.current;
      if (!video) return;

      const performPlayback = () => {
        if (
          playbackAttemptRef.current !== attempt ||
          activeSourceRef.current?.id !== source.id ||
          activeSourceRef.current.url !== source.url
        ) {
          return;
        }

        if (!video.paused && !video.ended) return;

      const handleRejectedPlay = (error: unknown, mayRetryMuted: boolean) => {
        if (
          playbackAttemptRef.current !== attempt ||
          activeSourceRef.current?.id !== source.id ||
          activeSourceRef.current.url !== source.url
        ) {
          return;
        }

        if (isAutoplayPolicyError(error)) {
          if (retryMuted && mayRetryMuted && !video.muted) {
            video.muted = true;
            setIsMuted(true);
            void attemptVideoPlay(video).catch((retryError: unknown) => {
              handleRejectedPlay(retryError, false);
            });
            return;
          }
          setIsBuffering(false);
          setControlsVisible(true);
          return;
        }

        if (mediaErrorName(error) === "AbortError") {
          setIsBuffering(false);
          return;
        }

        if (scheduleAutomaticPlaybackRetry(source, attempt)) return;
        if (attemptStorageFallback(source)) return;
        reportMediaError(source, attempt);
      };

      void attemptVideoPlay(video).catch((error: unknown) => {
        handleRejectedPlay(error, true);
      });
      };

      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        const pending = pendingPlaybackReadyRef.current;
        if (pending?.video === video && pending.attempt === attempt) return;
        clearPendingPlaybackReady();
        const listener = () => {
          if (pendingPlaybackReadyRef.current?.listener === listener) {
            clearPendingPlaybackReady();
          }
          performPlayback();
        };
        pendingPlaybackReadyRef.current = { video, attempt, listener };
        video.addEventListener("loadeddata", listener);
        video.addEventListener("canplay", listener);
        return;
      }

      performPlayback();
    },
    [
      attemptStorageFallback,
      clearPendingPlaybackReady,
      reportMediaError,
      scheduleAutomaticPlaybackRetry,
    ],
  );

  useEffect(() => {
    let alive = true;
    const thumbnailUrl = activeVideo?.thumbnailUrl;
    const posterKey = activePosterKey;
    setResolvedPoster(null);
    if (!thumbnailUrl) return;

    void resolveMediaUrl(thumbnailUrl, "thumbnails")
      .then((url) => {
        if (alive) setResolvedPoster({ key: posterKey, url: url || thumbnailUrl });
      })
      .catch(() => {
        if (alive) setResolvedPoster({ key: posterKey, url: thumbnailUrl });
      });

    return () => {
      alive = false;
    };
  }, [activePosterKey, activeVideo?.thumbnailUrl]);
  const timeUpdateHandlerRef = useRef<
    ((currentTime: number, duration: number, wasSeeking: boolean) => void) | null
  >(null);
  const endedHandlerRef = useRef<(() => void) | null>(null);
  const seekActivityRef = useRef(false);
  const touchGestureRef = useRef<TouchGesture | null>(null);
  const gestureBrightnessRef = useRef(0.5);
  const pendingNativeBrightnessRef = useRef<number | null>(null);
  const brightnessUpdateFrameRef = useRef<number | null>(null);
  const lastTapRef = useRef<{ time: number; side: TapSide } | null>(null);
  const suppressSyntheticClickUntilRef = useRef(0);
  const feedbackTimerRef = useRef<number | null>(null);
  const gestureFeedbackIdRef = useRef(0);
  const controlsHideTimerRef = useRef<number | null>(null);
  const lockedUnlockTimerRef = useRef<number | null>(null);
  const fullscreenScrollYRef = useRef<number | null>(null);
  const fullscreenRequestIdRef = useRef(0);
  const floatingPositionRef = useRef<FloatingPosition | null>(null);
  const floatingDragRef = useRef<FloatingDrag | null>(null);
  const suppressFloatingClickRef = useRef(false);
  const swipeNavigationRef = useRef<SwipeNavigation | null>(null);
  const swipeNavigateTimerRef = useRef<number | null>(null);
  const swipeTransformCleanupTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAndroidApp || !isFullscreen) return;
    let active = true;
    void videoBrightness
      .getBrightness()
      .then(({ value }) => {
        if (!active || !Number.isFinite(value)) return;
        const brightness = clamp(value, 0.02, 1);
        gestureBrightnessRef.current = brightness;
        setGestureBrightness(brightness);
      })
      .catch((error: unknown) => {
        console.warn("Could not read Android screen brightness.", error);
      });

    return () => {
      active = false;
      if (brightnessUpdateFrameRef.current !== null) {
        window.cancelAnimationFrame(brightnessUpdateFrameRef.current);
        brightnessUpdateFrameRef.current = null;
      }
      pendingNativeBrightnessRef.current = null;
      void videoBrightness.restoreBrightness().catch((error: unknown) => {
        console.warn("Could not restore Android screen brightness.", error);
      });
    };
  }, [isAndroidApp, isFullscreen]);

  useEffect(() => {
    lastTapRef.current = null;
    suppressSyntheticClickUntilRef.current = 0;
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
  const isLongVideoWatchRoute = detailVideoId !== null;
  useEffect(() => {
    if (!isAndroidApp || !isLongVideoWatchRoute) return;

    void systemVideoPip
      .setWatchTopEdgeToEdge({ enabled: false })
      .catch((error: unknown) => {
        console.warn("Could not apply Android watch-player system-bar insets.", error);
      });

    return () => {
      void systemVideoPip
        .setWatchTopEdgeToEdge({ enabled: false })
        .catch((error: unknown) => {
          console.warn("Could not restore Android system-bar insets.", error);
        });
    };
  }, [isAndroidApp, isLongVideoWatchRoute]);
  const downloadDetailPath = getDownloadDetailPath(location.pathname);
  const isDetailPlayer = Boolean(
    activeVideo &&
      (detailVideoId !== null || activeVideo.detailRoute === downloadDetailPath),
  );
  const isPlayerRoute = Boolean(detailVideoId || downloadDetailPath);
  const showDetailChrome = isDetailPlayer && !pictureInPicture;
  const needsAndroidPortraitSafeArea =
    isAndroidApp && showDetailChrome && !isFullscreen;
  const activeResolvedPoster =
    resolvedPoster?.key === activePosterKey ? resolvedPoster.url : null;
  const placeholderPosterUrl =
    activeResolvedPoster ??
    (activeVideo?.id ? getResolvedVideoCover(activeVideo.id) : null) ??
    (activeVideo?.thumbnailUrl &&
    /^(https?:|data:|blob:)/i.test(activeVideo.thumbnailUrl)
      ? activeVideo.thumbnailUrl
      : null);

  useEffect(() => {
    if (!isLongVideoWatchRoute || settingsMenu === "closed") {
      setSettingsMenuPlacement(null);
      return;
    }

    const placeSettingsMenu = () => {
      const trigger = settingsMenuButtonRef.current;
      const menu = settingsMenuRef.current;
      if (!trigger || !menu) return;

      const triggerRect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const edge = 12;
      const gap = 8;
      const menuWidth = menu.offsetWidth || 208;
      const naturalHeight = menu.scrollHeight;
      const maxViewportHeight = Math.max(120, viewportHeight - edge * 2);
      const desiredHeight = Math.min(naturalHeight, maxViewportHeight);
      const roomBelow = viewportHeight - edge - triggerRect.bottom - gap;
      const roomAbove = triggerRect.top - edge - gap;

      let top: number;
      let maxHeight: number;
      if (desiredHeight <= roomBelow) {
        top = triggerRect.bottom + gap;
        maxHeight = desiredHeight;
      } else if (desiredHeight <= roomAbove) {
        top = triggerRect.top - gap - desiredHeight;
        maxHeight = desiredHeight;
      } else if (roomBelow >= roomAbove) {
        top = triggerRect.bottom + gap;
        maxHeight = Math.max(120, roomBelow);
      } else {
        top = edge;
        maxHeight = maxViewportHeight;
      }

      top = clamp(
        top,
        edge,
        Math.max(edge, viewportHeight - edge - Math.min(desiredHeight, maxHeight)),
      );
      const left = clamp(
        triggerRect.right - menuWidth,
        edge,
        Math.max(edge, viewportWidth - menuWidth - edge),
      );

      setSettingsMenuPlacement((current) => {
        if (
          current &&
          Math.abs(current.left - left) < 1 &&
          Math.abs(current.top - top) < 1 &&
          Math.abs(current.maxHeight - maxHeight) < 1
        ) {
          return current;
        }
        return { left, top, maxHeight };
      });
    };

    const frame = window.requestAnimationFrame(placeSettingsMenu);
    window.addEventListener("resize", placeSettingsMenu, { passive: true });
    window.addEventListener("orientationchange", placeSettingsMenu, { passive: true });
    window.addEventListener("scroll", placeSettingsMenu, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", placeSettingsMenu);
      window.removeEventListener("orientationchange", placeSettingsMenu);
      window.removeEventListener("scroll", placeSettingsMenu, true);
    };
  }, [isLongVideoWatchRoute, longVideoPlayerMenuActions, settingsMenu]);

  const activateVideo = useCallback((video: PersistentVideo) => {
    const source = activeSourceRef.current;
    const previousVideo = activeVideoRef.current;
    const player = videoRef.current;
    if (previousVideo?.id !== video.id || previousVideo.url !== video.url) {
      fallbackAttemptRef.current = null;
      setPlaybackSourceOverride(null);
    }
    if (source?.id !== video.id || source.url !== video.url) {
      setHasVideoFrame(false);
    }
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

    if (!video.url) {
      playbackAttemptRef.current += 1;
      hlsRef.current?.destroy();
      hlsRef.current = null;
      if (player) {
        player.pause();
        player.removeAttribute("src");
        player.load();
      }
      activeSourceRef.current = null;
      setMediaError(null);
      setIsPlaying(false);
      setIsBuffering(true);
      setCurrentTime(0);
      setDuration(0);
    }

    setActiveVideo((current) => {
      if (
        current?.id === video.id &&
        current.url === video.url &&
        current.title === video.title &&
        current.thumbnailUrl === video.thumbnailUrl &&
        current.resolvePlaybackQuality === video.resolvePlaybackQuality &&
        (current.fallbackUrls ?? []).length === (video.fallbackUrls ?? []).length &&
        (current.fallbackUrls ?? []).every(
          (url, index) => url === video.fallbackUrls?.[index],
        )
      ) {
        return current;
      }
      return video;
    });
  }, [setCurrentTime, setDuration]);

  const setTimeUpdateHandler = useCallback(
    (handler: ((currentTime: number, duration: number, wasSeeking: boolean) => void) | null) => {
      timeUpdateHandlerRef.current = handler;
    },
    [],
  );

  const setEndedHandler = useCallback((handler: (() => void) | null) => {
    endedHandlerRef.current = handler;
  }, []);

  const setLongVideoPlayerMenuActions = useCallback(
    (actions: LongVideoPlayerMenuActions | null) => {
      setLongVideoPlayerMenuActionsState(actions);
    },
    [],
  );

  const closeVideo = useCallback(() => {
    syncNativePipState(false, false);
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
      fallbackAttemptRef.current = null;
      setPlaybackSourceOverride(null);
    setActiveVideo(null);
    setHasVideoFrame(false);
    setIsVerticalVideo(false);
    setPictureInPicture(false);
    setFloatingPosition(null);
    setFloatingWidth(null);
    setFloatingDragging(false);
    floatingDragRef.current = null;
    setSettingsMenu("closed");
    setLongVideoPlayerMenuActionsState(null);
    setIsPlaying(false);
    setControlsVisible(true);
    setCurrentTime(0);
    setDuration(0);
    setIsMuted(false);
    setQuality("auto");
    setLoopVideo(false);
    setHlsLevels([]);
    setActiveHlsHeight(null);
  }, [setCurrentTime, setDuration, syncNativePipState]);

  const retryPlayback = useCallback(() => {
    if (!activeVideo) return;
    clearPendingPlaybackReady();
    const currentRetry = automaticPlaybackRetryRef.current;
    if (currentRetry.timer !== null) window.clearTimeout(currentRetry.timer);
    automaticPlaybackRetryRef.current = {
      sourceKey: `${activeVideo.id}\u0000${activeVideoUrl ?? activeVideo.url}`,
      retries: 0,
      timer: null,
    };
    forcePlaybackReloadRef.current = false;
    playbackAttemptRef.current += 1;
    setMediaError(null);
    hlsRef.current?.destroy();
    hlsRef.current = null;
    activeSourceRef.current = null;
    fallbackAttemptRef.current = null;
    setPlaybackSourceOverride(null);
    setPlaybackRetryKey((key) => key + 1);
  }, [activeVideo, activeVideoUrl, clearPendingPlaybackReady]);

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
    if (
      previousPathname !== location.pathname &&
      activeVideo &&
      !isPlayerRoute &&
      !pictureInPicture
    ) {
      closeVideo();
    }
  }, [activeVideo, closeVideo, isPlayerRoute, location.pathname, pictureInPicture]);

  const markControlsActivity = useCallback(() => {
    setControlsVisible(true);
    setControlsActivity((activity) => activity + 1);
  }, []);

  const restoreFullscreenScroll = useCallback(() => {
    const scrollY = fullscreenScrollYRef.current;
    if (scrollY === null) return;
    fullscreenScrollYRef.current = null;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const scrollContainer = getAppScrollContainer();
        if (scrollContainer) scrollContainer.scrollTo(0, scrollY);
        else window.scrollTo(0, scrollY);
      });
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
    await setNativeFullscreenImmersive(false);
    await lockPlayerOrientation("portrait");
    setIsFullscreen(false);
    setScreenLocked(false);
    setLockedUnlockVisible(false);
    clearLockedUnlockTimer();
    setZoom(1);
    setDisplayMode("fit");
    setGestureFeedback(null);
    setSettingsMenu("closed");
    restoreFullscreenScroll();
  }, [
    clearLockedUnlockTimer,
    restoreFullscreenScroll,
    setNativeFullscreenImmersive,
  ]);

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
    if (!video || !activeVideoId || !activeVideoUrl) {
      clearPendingPlaybackReady();
      const retryState = automaticPlaybackRetryRef.current;
      if (retryState.timer !== null) window.clearTimeout(retryState.timer);
      automaticPlaybackRetryRef.current = { sourceKey: "", retries: 0, timer: null };
      return;
    }

    const source = activeSourceRef.current;
    const sameSource = source?.id === activeVideoId && source.url === activeVideoUrl;
    if (sameSource && !forcePlaybackReloadRef.current) return;
    forcePlaybackReloadRef.current = false;

    clearPendingPlaybackReady();
    const sourceKey = `${activeVideoId}\u0000${activeVideoUrl}`;
    const retryState = automaticPlaybackRetryRef.current;
    if (retryState.sourceKey !== sourceKey) {
      if (retryState.timer !== null) window.clearTimeout(retryState.timer);
      automaticPlaybackRetryRef.current = {
        sourceKey,
        retries: 0,
        timer: null,
      };
    }

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
      if (shouldPlay) {
        requestPlayback({ id: activeVideoId, url: activeVideoUrl }, attempt, true);
      }
    };

    video.pause();
    hlsRef.current?.destroy();
    hlsRef.current = null;
    setCurrentTime(isSameVideo ? previousTime : 0);
    setDuration(0);
    setIsVerticalVideo(false);
    setIsBuffering(true);
    setControlsVisible(true);
    setQuality("auto");
    qualitySwitchRequestRef.current += 1;
    setPendingQualitySwitch(null);
    setLoopVideo(false);
    setHlsLevels([]);
    setActiveHlsHeight(null);
    activeSourceRef.current = { id: activeVideoId, url: activeVideoUrl };
    video.addEventListener("loadedmetadata", restorePlayback, { once: true });
    try {
      // Capability probing is advisory: keep the browser-native source path as
      // the fallback because canPlayType may under-report installed decoders.
      video.dataset.ywNativeVideoSupport = detectNativeVideoSupport(video, activeVideoUrl);
      if (isHlsMediaUrl(activeVideoUrl)) {
        if (Hls.isSupported()) {
          const hls = new Hls(createVideoHlsConfig());
          hlsRef.current = hls;
          bindHlsNetworkAwareLevelCap(hls);
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
            console.warn("[video-playback] fatal HLS playback error", {
              videoId: activeVideoId,
              source: safeMediaUrlForLog(activeVideoUrl),
              type: data.type,
              details: data.details,
              responseCode: data.response?.code ?? null,
              fatal: data.fatal,
            });
            const source = { id: activeVideoId, url: activeVideoUrl };
            const shouldRetry = scheduleAutomaticPlaybackRetry(source, attempt);
            if (hlsRef.current === hls) hlsRef.current = null;
            hls.destroy();
            if (shouldRetry) return;
            const usingStorageFallback = attemptStorageFallback(
              source,
            );
            if (usingStorageFallback) return;
            if (supportsNativeHls(video)) {
              activeSourceRef.current = null;
              video.removeAttribute("src");
              video.load();
              video.src = activeVideoUrl;
              video.load();
              activeSourceRef.current = { id: activeVideoId, url: activeVideoUrl };
            } else {
              reportMediaError({ id: activeVideoId, url: activeVideoUrl }, attempt);
            }
          });
          hls.loadSource(activeVideoUrl);
          hls.attachMedia(video);
        } else if (supportsNativeHls(video)) {
          video.src = activeVideoUrl;
          video.load();
        } else {
          if (
            !attemptStorageFallback(
              { id: activeVideoId, url: activeVideoUrl },
            )
          ) {
            reportMediaError({ id: activeVideoId, url: activeVideoUrl }, attempt);
          }
        }
      } else {
        video.src = activeVideoUrl;
        video.load();
      }
    } catch (cause) {
      console.error("[video-playback] unable to mount media source", cause);
      reportMediaError({ id: activeVideoId, url: activeVideoUrl }, attempt);
    }
    return () => {
      video.removeEventListener("loadedmetadata", restorePlayback);
      clearPendingPlaybackReady();
    };
  }, [
    activeVideoId,
    activeVideoInitialTime,
    activeVideoUrl,
    attemptStorageFallback,
    clearPendingPlaybackReady,
    playbackRetryKey,
    reportMediaError,
    requestPlayback,
    scheduleAutomaticPlaybackRetry,
    setCurrentTime,
    setDuration,
  ]);

  useEffect(
    () => () => {
      clearPendingPlaybackReady();
      const retryState = automaticPlaybackRetryRef.current;
      if (retryState.timer !== null) window.clearTimeout(retryState.timer);
    },
    [clearPendingPlaybackReady],
  );

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

  const selectQuality = useCallback(async (nextQuality: QualityId) => {
    const requestId = ++qualitySwitchRequestRef.current;
    setPendingQualitySwitch(null);
    const video = videoRef.current;
    if (!video || !activeVideo) return;
    const hls = hlsRef.current;
    if (hls) {
      if (nextQuality === "auto") {
        hls.currentLevel = -1;
      } else {
        // hls.levels is the source of truth at tap time; React's snapshot can
        // lag behind manifest updates or a portrait/landscape video switch.
        const nextLevel = levelForQuality(hls.levels, nextQuality);
        if (nextLevel < 0) {
          toast.error(`${nextQuality} quality is not available for this video.`);
          return;
        }
        // currentLevel forces HLS.js to flush the old rendition and request
        // the chosen level now; nextLevel would wait for the current buffer.
        hls.currentLevel = nextLevel;
      }
      setQuality(nextQuality);
      setSettingsMenu("closed");
      markControlsActivity();
      return;
    }

    let nextUrl =
      nextQuality === "auto"
        ? activeVideoUrl
        : activeVideo.qualityUrls?.[nextQuality];
    if (
      !nextUrl &&
      nextQuality !== "auto" &&
      activeVideo.resolvePlaybackQuality
    ) {
      setPendingQualitySwitch(nextQuality);
      try {
        nextUrl = await activeVideo.resolvePlaybackQuality(nextQuality);
      } catch (error) {
        if (
          requestId === qualitySwitchRequestRef.current &&
          activeVideoRef.current?.id === activeVideo.id
        ) {
          toast.error(
            error instanceof Error
              ? error.message
              : `Could not prepare ${nextQuality} playback.`,
          );
        }
        return;
      } finally {
        if (requestId === qualitySwitchRequestRef.current) {
          setPendingQualitySwitch(null);
        }
      }
      if (
        requestId !== qualitySwitchRequestRef.current ||
        activeVideoRef.current?.id !== activeVideo.id
      ) {
        return;
      }
    }
    if (!nextUrl) {
      toast.error(
        nextQuality === "auto"
          ? "Automatic quality is not available for this video."
          : `${nextQuality} quality is not available for this video.`,
      );
      return;
    }
    if (nextUrl === activeSourceRef.current?.url) {
      setQuality(nextQuality);
      setSettingsMenu("closed");
      markControlsActivity();
      return;
    }

    const previousTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const shouldPlay = !video.paused;
    const onMetadata = () => {
      if (Number.isFinite(video.duration)) video.currentTime = Math.min(previousTime, video.duration);
      if (shouldPlay && activeSourceRef.current) {
        requestPlayback(activeSourceRef.current, playbackAttemptRef.current, true);
      }
    };
    video.pause();
    video.addEventListener("loadedmetadata", onMetadata, { once: true });
    activeSourceRef.current = { id: activeVideo.id, url: nextUrl };
    video.src = nextUrl;
    video.load();
    setQuality(nextQuality);
    setSettingsMenu("closed");
    markControlsActivity();
  }, [activeVideo, activeVideoUrl, hlsLevels, markControlsActivity, requestPlayback]);

  const togglePictureInPicture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setSettingsMenu("closed");
    markControlsActivity();

    const pipDocument = document as Document & {
      pictureInPictureElement?: Element | null;
      exitPictureInPicture?: () => Promise<void>;
    };
    if (
      pipDocument.pictureInPictureElement === video &&
      typeof pipDocument.exitPictureInPicture === "function"
    ) {
      void pipDocument.exitPictureInPicture().catch((error: unknown) => {
        console.warn("Could not exit picture-in-picture playback.", error);
      });
      return;
    }

    const enterAppPictureInPicture = () => {
      if (videoRef.current !== video) return;
      setPictureInPicture(true);
      setFloatingPosition(null);
      setFloatingWidth(null);
      syncNativePipState(true, !video.paused);
      if (isFullscreen) void teardownFullscreen(true);
    };

    if (typeof video.requestPictureInPicture === "function") {
      try {
        void video.requestPictureInPicture().catch((error: unknown) => {
          console.warn("Native picture-in-picture is unavailable; using the in-app player.", error);
          enterAppPictureInPicture();
        });
        return;
      } catch (error) {
        console.warn("Native picture-in-picture could not be started.", error);
      }
    }

    enterAppPictureInPicture();
  }, [isFullscreen, markControlsActivity, syncNativePipState, teardownFullscreen]);

  const startFloatingDrag = useCallback((
    event: ReactPointerEvent<HTMLElement>,
    mode: FloatingDrag["mode"] = "move",
  ) => {
    if (!pictureInPicture || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (
      mode === "move" &&
      event.target instanceof Element &&
      event.target.closest("button")
    ) return;
    const player = containerRef.current;
    if (!player) return;
    const rect = player.getBoundingClientRect();
    event.preventDefault();
    event.stopPropagation();
    floatingDragRef.current = {
      mode,
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
      player.setPointerCapture(event.pointerId);
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
    if (drag.mode === "resize") {
      const maxWidth = Math.max(
        120,
        Math.min(
          window.innerWidth - edge * 2,
          (window.innerHeight - edge * 2) * (drag.width / drag.height),
        ),
      );
      const nextWidth = clamp(
        drag.width + (deltaX + deltaY) / 2,
        Math.min(160, maxWidth),
        maxWidth,
      );
      const nextHeight = drag.height * (nextWidth / drag.width);
      const position = {
        left: clamp(
          drag.startLeft,
          edge,
          Math.max(edge, window.innerWidth - nextWidth - edge),
        ),
        top: clamp(
          drag.startTop,
          edge,
          Math.max(edge, window.innerHeight - nextHeight - edge),
        ),
      };
      drag.left = position.left;
      drag.top = position.top;
      setFloatingWidth(nextWidth);
      setFloatingPosition(position);
      return;
    }
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
      if (drag.mode === "move") {
        const maxLeft = Math.max(edge, window.innerWidth - drag.width - edge);
        const maxTop = Math.max(edge, window.innerHeight - drag.height - edge);
        setFloatingPosition({
          left: clamp(drag.left, edge, maxLeft),
          top: clamp(drag.top, edge, maxTop),
        });
      }
      suppressFloatingClickRef.current = true;
      window.setTimeout(() => {
        suppressFloatingClickRef.current = false;
      }, 0);
    }
    setFloatingDragging(false);
    try {
      const player = containerRef.current;
      if (player?.hasPointerCapture(event.pointerId)) {
        player.releasePointerCapture(event.pointerId);
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

  const applyGestureVolume = useCallback(
    (nextVolume: number) => {
      const value = clamp(nextVolume, 0, 1);
      setMediaVolume(value);
      if (isAndroidApp) {
        void systemVideoPip.setMediaVolume({ value }).catch((error: unknown) => {
          console.warn("Could not update Android media volume.", error);
        });
      } else if (videoRef.current) {
        videoRef.current.volume = value;
      }
    },
    [isAndroidApp],
  );

  const applyGestureBrightness = useCallback(
    (nextBrightness: number) => {
      const value = clamp(nextBrightness, 0.02, 1);
      gestureBrightnessRef.current = value;
      setGestureBrightness(value);
      if (!isAndroidApp) return;

      pendingNativeBrightnessRef.current = value;
      if (brightnessUpdateFrameRef.current !== null) return;
      brightnessUpdateFrameRef.current = window.requestAnimationFrame(() => {
        brightnessUpdateFrameRef.current = null;
        const pending = pendingNativeBrightnessRef.current;
        pendingNativeBrightnessRef.current = null;
        if (pending === null) return;
        void videoBrightness.setBrightness({ value: pending }).catch((error: unknown) => {
          console.warn("Could not update Android screen brightness.", error);
        });
      });
    },
    [isAndroidApp],
  );

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      const source = activeSourceRef.current;
      if (source) {
        requestPlayback(source, playbackAttemptRef.current, false);
      } else {
        void attemptVideoPlay(video).catch(() => {
          setIsBuffering(false);
          setControlsVisible(true);
        });
      }
    } else {
      video.pause();
    }
  }, [requestPlayback]);

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
  }, [markControlsActivity, setCurrentTime]);

  const toggleFullscreen = useCallback(() => {
    const fullscreenElement = getPlayerFullscreenElement();
    if (fullscreenElement) {
      void exitPlayerFullscreen().then(() => {
        if (!getPlayerFullscreenElement()) void teardownFullscreen(false);
      });
    } else {
      const container = containerRef.current;
      const video = videoRef.current;
      const primaryTarget = container ?? video;
      if (!primaryTarget) return;
      const requestId = fullscreenRequestIdRef.current + 1;
      fullscreenRequestIdRef.current = requestId;
      fullscreenScrollYRef.current =
        getAppScrollContainer()?.scrollTop ?? window.scrollY;
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
          if (isAndroidApp) {
            await setNativeFullscreenImmersive(true);
            try {
              const level = await systemVideoPip.getMediaVolume();
              if (
                requestId === fullscreenRequestIdRef.current &&
                getPlayerFullscreenElement()
              ) {
                setMediaVolume(clamp(level.value, 0, 1));
              }
            } catch (error) {
              console.warn("Could not read Android media volume.", error);
            }
          }
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
  }, [
    isAndroidApp,
    markControlsActivity,
    setNativeFullscreenImmersive,
    teardownFullscreen,
  ]);

  const clearControlsHideTimer = useCallback(() => {
    if (controlsHideTimerRef.current !== null) {
      window.clearTimeout(controlsHideTimerRef.current);
      controlsHideTimerRef.current = null;
    }
  }, []);

  const handleVideoPlay = useCallback(() => {
    setIsPlaying(true);
    setIsBuffering(false);
    setControlsVisible(true);
  }, []);

  const handleVideoPause = useCallback(() => {
    setIsPlaying(false);
    setIsBuffering(false);
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

  const qualityOptions = QUALITY_OPTIONS;

  useEffect(() => {
    if (quality === "auto" || hlsLevels.length === 0) return;
    const hls = hlsRef.current;
    if (!hls) return;
    const nextLevel = levelForQuality(hlsLevels, quality);
    if (nextLevel >= 0 && hls.currentLevel !== nextLevel) {
      hls.currentLevel = nextLevel;
    }
  }, [hlsLevels, quality]);

  useEffect(() => {
    syncNativePipState(
      pictureInPicture && Boolean(activeVideo),
      pictureInPicture && Boolean(activeVideo) && isPlaying,
    );
  }, [activeVideo, isPlaying, pictureInPicture, syncNativePipState]);

  useEffect(() => {
    const handleSystemPipChange = (event: Event) => {
      const detail = (event as CustomEvent<{ active?: boolean }>).detail;
      setSystemPictureInPicture(detail?.active === true);
    };
    window.addEventListener("yw-system-pip-change", handleSystemPipChange);
    return () => window.removeEventListener("yw-system-pip-change", handleSystemPipChange);
  }, []);

  useEffect(() => {
    const attemptNativePictureInPicture = () => {
      const video = videoRef.current;
      if (
        isAndroidApp ||
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
  }, [isAndroidApp]);

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
      const maxWidth = Math.max(
        100,
        Math.min(
          window.innerWidth - edge * 2,
          (window.innerHeight - edge * 2) * (rect.width / rect.height),
        ),
      );
      setFloatingWidth((width) => (width === null ? null : Math.min(width, maxWidth)));
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
      if (playerIsFullscreen) {
        void setNativeFullscreenImmersive(false);
      }
      if (playerIsFullscreen) void exitPlayerFullscreen();
      void lockPlayerOrientation("portrait").finally(restoreFullscreenScroll);
    },
    [
      clearLockedUnlockTimer,
      isAndroidApp,
      restoreFullscreenScroll,
      setNativeFullscreenImmersive,
    ],
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
      showGestureFeedback("seek", seconds, "10s");
    },
    [isDetailPlayer, isFullscreen, screenLocked, setCurrentTime, showGestureFeedback],
  );

  const togglePlayerControls = useCallback(() => {
    clearControlsHideTimer();
    if (controlsVisible) {
      setControlsVisible(false);
      return;
    }
    markControlsActivity();
  }, [clearControlsHideTimer, controlsVisible, markControlsActivity]);

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
        lastTapRef.current = null;
        seekBy(side === "right" ? 10 : -10);
        return;
      }

      lastTapRef.current = { time: now, side };
      togglePlayerControls();
    },
    [seekBy, togglePlayerControls],
  );

  const handlePlayerSurfaceClick = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      if (!isDetailPlayer) return;
      if (Date.now() < suppressSyntheticClickUntilRef.current) return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(
          "button:not([data-player-surface]), input, [role='menu'], [role='alert']",
        )
      ) return;
      if (screenLocked) {
        revealLockedUnlock();
        return;
      }
      if (settingsMenu !== "closed") {
        setSettingsMenu("closed");
        markControlsActivity();
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const normalizedX = clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
      const side: TapSide | null =
        normalizedX <= 0.4 ? "left" : normalizedX >= 0.6 ? "right" : null;
      if (!side) {
        lastTapRef.current = null;
        togglePlayerControls();
        return;
      }
      registerPlayerTap(side);
    },
    [
      isDetailPlayer,
      markControlsActivity,
      registerPlayerTap,
      revealLockedUnlock,
      screenLocked,
      settingsMenu,
      togglePlayerControls,
    ],
  );

  const handleTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (!isDetailPlayer) return;
      if (swipeNavigationRef.current) {
        event.preventDefault();
        return;
      }
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(
          "button:not([data-player-surface]), input, [role='menu'], [role='alert']",
        )
      ) {
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
          zone: "multi",
          swipeAxis: null,
          adjustmentKind: null,
          initialVolume: isAndroidApp ? mediaVolume : videoRef.current?.volume ?? 1,
          initialBrightness: gestureBrightnessRef.current,
          initialDistance: touchDistance(event.touches),
          initialZoom: zoom,
        };
        return;
      }
      const zone = isFullscreen
        ? getFullscreenGestureZone(startX, rect.width)
        : "navigation";
      touchGestureRef.current = {
        startX,
        originX: firstTouch.clientX,
        originY: firstTouch.clientY,
        startedAt,
        width: rect.width,
        moved: false,
        zone,
        swipeAxis: null,
        adjustmentKind: null,
        initialVolume: isAndroidApp ? mediaVolume : videoRef.current?.volume ?? 1,
        initialBrightness: gestureBrightnessRef.current,
        initialDistance: null,
        initialZoom: zoom,
      };
      if (isFullscreen && zone !== "navigation") {
        event.stopPropagation();
      }
    },
    [isAndroidApp, isDetailPlayer, isFullscreen, mediaVolume, screenLocked, zoom],
  );

  const handleTouchMove = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
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
        event.stopPropagation();
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
      if (gesture.zone !== "navigation") {
        event.stopPropagation();
        if (event.cancelable) event.preventDefault();
        if (gesture.zone === "multi") {
          gesture.moved = true;
          return;
        }
        if (!isVerticalAdjustmentGesture(deltaX, deltaY)) {
          if (Math.hypot(deltaX, deltaY) >= 8) gesture.moved = true;
          return;
        }

        gesture.moved = true;
        if (gesture.zone === "brightness") {
          const nextBrightness = clamp(gesture.initialBrightness - deltaY / 280, 0.02, 1);
          gesture.adjustmentKind = "brightness";
          applyGestureBrightness(nextBrightness);
          showGestureFeedback(
            "brightness",
            nextBrightness,
            `${Math.round(nextBrightness * 100)}%`,
          );
        } else {
          const nextVolume = clamp(gesture.initialVolume - deltaY / 280, 0, 1);
          gesture.adjustmentKind = "volume";
          applyGestureVolume(nextVolume);
          showGestureFeedback("volume", nextVolume, `${Math.round(nextVolume * 100)}%`);
        }
        return;
      }

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
    },
    [
      applyGestureBrightness,
      applyGestureVolume,
      isDetailPlayer,
      isFullscreen,
      isVerticalVideo,
      screenLocked,
      showGestureFeedback,
    ],
  );

  const handleTouchEnd = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (!isDetailPlayer) return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(
          "button:not([data-player-surface]), input, [role='menu'], [role='alert']",
        )
      ) {
        touchGestureRef.current = null;
        return;
      }
      if (isFullscreen && screenLocked) {
        event.preventDefault();
        revealLockedUnlock();
        touchGestureRef.current = null;
        return;
      }
      const gesture = touchGestureRef.current;
      touchGestureRef.current = null;
      if (!gesture) return;
      if (gesture.zone !== "navigation") {
        event.stopPropagation();
        if (gesture.moved) {
          if (event.cancelable) event.preventDefault();
          suppressSyntheticClickUntilRef.current = Date.now() + 500;
        }
        return;
      }
      if (gesture.swipeAxis) {
        suppressSyntheticClickUntilRef.current = Date.now() + 500;
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
      if (gesture.moved) {
        suppressSyntheticClickUntilRef.current = Date.now() + 500;
      }
    },
    [
      activeVideo,
      isDetailPlayer,
      isFullscreen,
      isVerticalVideo,
      navigate,
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
    progressStore.setProgress(
      video.currentTime,
      Number.isFinite(video.duration)
        ? video.duration
        : progressStore.getSnapshot().duration,
    );
    timeUpdateHandlerRef.current?.(
      video.currentTime,
      Number.isFinite(video.duration) ? video.duration : 0,
      wasSeeking,
    );
  }, [progressStore]);

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
    progressStore.setProgress(
      Number.isFinite(video.currentTime) ? video.currentTime : 0,
      Number.isFinite(video.duration)
        ? video.duration
        : progressStore.getSnapshot().duration,
    );
    setIsMuted(video.muted);
    const fullscreenElement = getPlayerFullscreenElement();
    if (fullscreenElement === containerRef.current || fullscreenElement === videoRef.current) {
      void lockPlayerOrientation(isVertical ? "portrait" : "landscape");
    }
  }, [progressStore]);

  const handleVolumeChange = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    setIsMuted(video.muted || video.volume === 0);
    setMediaVolume(video.volume);
  }, []);

  const openDetail = useCallback(() => {
    if (!activeVideo) return;
    syncNativePipState(false, false);
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
  }, [activeVideo, navigate, syncNativePipState]);

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
      isPlaying,
      videoRef,
      activateVideo,
      setLongVideoPlayerMenuActions,
      setTimeUpdateHandler,
      setEndedHandler,
      closeVideo,
    }),
    [
      activeVideo,
      activateVideo,
      closeVideo,
      isDetailPlayer,
      isVerticalVideo,
      isPlaying,
      setLongVideoPlayerMenuActions,
      setEndedHandler,
      setTimeUpdateHandler,
    ],
  );

  return (
    <VideoPlaybackContext.Provider value={contextValue}>
      <VideoPlaybackProgressContext.Provider value={progressStore}>
        <div
          className={
            systemPictureInPicture
              ? "yw-video-player-route relative h-full min-h-full w-full overflow-hidden bg-black"
              : isPlayerRoute
                ? `yw-video-player-route relative flex h-[100dvh] flex-col ${isFullscreen ? "overflow-visible" : "overflow-hidden"}`
                : "relative min-h-screen"
          }
        >
        <div
          className={
            systemPictureInPicture
              ? "hidden"
              : isPlayerRoute
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
            systemPictureInPicture
              ? "fixed inset-0 z-[100] h-full w-full overflow-hidden bg-black"
              : pictureInPicture
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
                    ? `fixed inset-0 z-50 max-w-none bg-black ${
                        needsAndroidPortraitSafeArea ? "yw-android-video-safe-area" : ""
                      }`
                    : `yw-detail-video-player sticky top-0 z-50 order-1 mx-auto block ${
                        isLongVideoWatchRoute
                          ? "aspect-video max-w-none"
                          : `${
                              isVerticalVideo
                                ? "aspect-video"
                                : "yw-horizontal-video-detail-player"
                            } max-w-lg`
                      } w-full shrink-0 overflow-hidden bg-black ${
                        needsAndroidPortraitSafeArea && !isLongVideoWatchRoute
                          ? "yw-android-video-safe-area"
                          : ""
                      }`
                  : isPlayerRoute
                    ? "pointer-events-none fixed left-[-9999px] top-[-9999px] z-[-1] h-px w-px opacity-0"
                    : "fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3 z-[70] w-[min(68vw,280px)] overflow-hidden rounded-xl border border-white/15 bg-zinc-950 shadow-2xl"
          }
          onPointerDown={
            pictureInPicture && !systemPictureInPicture
              ? (event) => startFloatingDrag(event)
              : undefined
          }
          onPointerMove={
            pictureInPicture && !systemPictureInPicture ? moveFloatingPlayer : undefined
          }
          onPointerUp={
            pictureInPicture && !systemPictureInPicture ? finishFloatingDrag : undefined
          }
          onPointerCancel={
            pictureInPicture && !systemPictureInPicture ? finishFloatingDrag : undefined
          }
          style={
            systemPictureInPicture
              ? { touchAction: "none", width: "100%", height: "100%" }
              : pictureInPicture
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
                  ...(floatingWidth !== null ? { width: floatingWidth } : {}),
                }
              : showDetailChrome
                ? {
                    touchAction: isFullscreen ? "none" : "manipulation",
                    ...(isLongVideoWatchRoute && !isFullscreen
                      ? { aspectRatio: "16 / 9", width: "100%" }
                      : {}),
                  }
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
              systemPictureInPicture
                ? "relative h-full w-full bg-black"
                : showDetailChrome
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
                : showDetailChrome
                  ? handlePlayerSurfaceClick
                  : undefined
            }
            onTouchStart={
              showDetailChrome && !pictureInPicture ? handleTouchStart : undefined
            }
            onTouchMove={
              showDetailChrome && !pictureInPicture ? handleTouchMove : undefined
            }
            onTouchEnd={
              showDetailChrome && !pictureInPicture ? handleTouchEnd : undefined
            }
            onTouchCancel={
              showDetailChrome && !pictureInPicture ? handleTouchCancel : undefined
            }
            style={{
              ...(showDetailChrome && isFullscreen
                ? { width: "100vw", height: "100dvh" }
                : {}),
              ...(showDetailChrome
                ? { touchAction: isFullscreen ? "none" : "manipulation" }
                : {}),
            }}
          >
            <video
              ref={videoRef}
              poster={activeResolvedPoster ?? activeVideo.thumbnailUrl ?? VIDEO_POSTER_FALLBACK}
              controls={false}
              loop={loopVideo}
              muted={isMuted}
              playsInline
              preload="auto"
              onLoadedMetadata={handleLoadedMetadata}
              onLoadedData={(event) => {
                const source = activeSourceRef.current;
                if (source) {
                  const retryState = automaticPlaybackRetryRef.current;
                  if (retryState.sourceKey === `${source.id}\u0000${source.url}`) {
                    if (retryState.timer !== null) {
                      window.clearTimeout(retryState.timer);
                      retryState.timer = null;
                    }
                    retryState.retries = 0;
                  }
                }
                setHasVideoFrame(true);
                if (activeVideoUrl) {
                  cacheVideoPoster(event.currentTarget, activeVideoUrl);
                }
              }}
              onEmptied={() => setHasVideoFrame(false)}
              onError={handleNativeMediaError}
              onTimeUpdate={handleTimeUpdate}
              onSeeking={handleVideoSeeking}
              onSeeked={handleVideoSeeked}
              onEnded={handleVideoEnded}
              onVolumeChange={handleVolumeChange}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onLoadStart={() => {
                setHasVideoFrame(false);
                setIsBuffering(true);
              }}
              onWaiting={() => setIsBuffering(true)}
              onStalled={() => setIsBuffering(true)}
              onCanPlay={() => setIsBuffering(false)}
              className={`video-player-native-controls h-full w-full ${
                (showDetailChrome &&
                  (isFullscreen || isLongVideoWatchRoute)) ||
                displayMode === "fill"
                  ? "object-cover"
                  : "object-contain"
              }`}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
                objectFit:
                  (showDetailChrome &&
                    (isFullscreen || isLongVideoWatchRoute)) ||
                  displayMode === "fill"
                    ? "cover"
                    : "contain",
                transition: gestureFeedback?.kind === "zoom" ? "none" : "transform 160ms ease-out",
                touchAction: showDetailChrome
                  ? isFullscreen
                    ? "none"
                    : "manipulation"
                  : undefined,
              }}
            />

            {showDetailChrome &&
            isFullscreen &&
            !isAndroidApp &&
            Math.abs(gestureBrightness - 0.5) > 0.005 ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-[25]"
                style={{
                  backgroundColor:
                    gestureBrightness < 0.5
                      ? `rgba(0,0,0,${(0.5 - gestureBrightness) * 1.2})`
                      : `rgba(255,255,255,${(gestureBrightness - 0.5) * 0.9})`,
                }}
              />
            ) : null}

            {showDetailChrome && (!activeVideo.url || !hasVideoFrame) ? (
              <div
                role="status"
                aria-label="Loading video preview"
                data-testid="status-video-player-poster"
                className="pointer-events-none absolute inset-0 z-[20] grid place-items-center overflow-hidden bg-zinc-950"
              >
                {placeholderPosterUrl ? (
                  <img
                    src={placeholderPosterUrl}
                    alt=""
                    loading="eager"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-800 via-zinc-950 to-zinc-900"
                  />
                )}
                <span className="relative rounded-full bg-black/55 px-3 py-1.5 text-xs text-white/80">
                  Preparing video…
                </span>
              </div>
            ) : null}

            {showDetailChrome ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-0 right-0 top-0 z-[29] h-[45px]"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(0, 0, 0, 0.65), transparent)",
                }}
              />
            ) : null}

            {showDetailChrome && !pictureInPicture ? (
              <button
                type="button"
                data-player-surface
                data-testid="video-playback-surface"
                aria-label={controlsVisible ? "Hide player controls" : "Show player controls"}
                onClick={(event) => {
                  event.stopPropagation();
                  handlePlayerSurfaceClick(event);
                }}
                className="pointer-events-auto absolute inset-0 z-[30] block w-full cursor-pointer bg-transparent p-0 focus-visible:outline-none"
              />
            ) : null}

            {showDetailChrome &&
            isBuffering &&
            !(mediaError?.id === activeVideo.id && mediaError.url === activeVideoUrl) ? (
              <div
                className="pointer-events-none absolute inset-0 z-[35] grid place-items-center"
                role="status"
                aria-label="Buffering video"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-white/90"
                />
              </div>
            ) : null}

            {mediaError?.id === activeVideo.id && mediaError.url === activeVideoUrl ? (
              <div
                className="absolute inset-0 z-[85] grid place-items-center bg-black/95 px-5 text-center text-white"
                role="alert"
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

            {showDetailChrome && controlsVisible && !screenLocked ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  togglePlayPause();
                  markControlsActivity();
                }}
                onPointerDown={(event) => event.stopPropagation()}
                className="absolute left-1/2 top-1/2 z-[60] grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/55 text-white shadow-xl backdrop-blur-sm transition hover:scale-105 hover:bg-black/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                aria-label={isPlaying ? "Pause video" : "Play video"}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 fill-current" />
                ) : (
                  <Play className="ml-0.5 h-6 w-6 fill-current" />
                )}
              </button>
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
                {!systemPictureInPicture ? (
                  <button
                    type="button"
                    onPointerDown={(event) => startFloatingDrag(event, "resize")}
                    onClick={(event) => event.stopPropagation()}
                    className="absolute bottom-1 right-1 z-[90] grid h-8 w-8 touch-none place-items-center rounded-full bg-black/55 text-white/90 shadow-md backdrop-blur-sm"
                    aria-label="Resize picture-in-picture player"
                    title="Drag to resize"
                  >
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 border-b-2 border-r-2 border-white/85"
                    />
                  </button>
                ) : null}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[70] px-2.5 pb-2 pt-2 text-[11px] font-semibold text-white drop-shadow-lg">
                  <span className="block truncate">{activeVideo.title || "Now playing"}</span>
                </div>
              </>
            ) : null}

            <PlaybackTimeline
              showDetailChrome={showDetailChrome}
              screenLocked={screenLocked}
              controlsVisible={controlsVisible}
              isMuted={isMuted}
              isFullscreen={isFullscreen}
              onToggleMute={toggleMute}
              onToggleFullscreen={toggleFullscreen}
              onSeek={handleSeek}
            />

            {showDetailChrome && !screenLocked && gestureFeedback?.kind === "seek" ? (
              <div className="pointer-events-none absolute inset-0 z-50">
                <div
                  key={gestureFeedback.id}
                  className={`absolute inset-y-0 flex w-2/5 items-center justify-center ${
                    gestureFeedback.value > 0 ? "right-0" : "left-0"
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  <span className="relative grid h-20 w-20 place-items-center">
                    <span
                      aria-hidden="true"
                      className="yw-video-seek-ripple absolute inset-0 rounded-full border border-white/30"
                    />
                    <span
                      aria-hidden="true"
                      className="yw-video-seek-ripple absolute inset-2 rounded-full border border-white/20"
                      style={{ animationDelay: "80ms" }}
                    />
                    {gestureFeedback.value > 0 ? (
                      <ChevronsRight
                        aria-hidden="true"
                        className="yw-video-seek-arrow relative h-7 w-7 text-white/90 drop-shadow"
                      />
                    ) : (
                      <ChevronsLeft
                        aria-hidden="true"
                        className="yw-video-seek-arrow relative h-7 w-7 text-white/90 drop-shadow"
                      />
                    )}
                    <span className="sr-only">
                      Skipped {Math.abs(gestureFeedback.value)} seconds{" "}
                      {gestureFeedback.value > 0 ? "forward" : "backward"}
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
                  <div
                    aria-label={`Brightness ${gestureFeedback.label}`}
                    className="pointer-events-none absolute left-5 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 rounded-full bg-black/60 px-2.5 py-3 text-white backdrop-blur-sm"
                    role="status"
                    aria-live="polite"
                  >
                    <Sun className="h-4 w-4" />
                    <div className="flex h-24 w-1.5 items-end overflow-hidden rounded-full bg-white/25">
                      <div
                        className="w-full rounded-full bg-white transition-[height]"
                        style={{ height: `${gestureFeedback.value * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold">
                      {gestureFeedback.label}
                    </span>
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
              >
                <Lock className="h-4 w-4" />
              </button>
            ) : null}

            {showDetailChrome && !screenLocked ? (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (isFullscreen) {
                    toggleFullscreen();
                    return;
                  }
                  if (activeVideo.backTo) {
                    closeVideo();
                    void navigate({ to: activeVideo.backTo as never });
                  } else if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    void navigate({ to: "/" });
                  }
                }}
                onPointerDown={(event) => event.stopPropagation()}
                className={`absolute left-3 top-[max(env(safe-area-inset-top,0px),0.5rem)] z-[110] rounded-full bg-black/60 p-2 text-white transition-opacity duration-200 hover:bg-black/80 ${
                  controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
                aria-label={isFullscreen ? "Exit fullscreen" : "Go back"}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : null}

            {showDetailChrome && isFullscreen && !screenLocked ? (
              <button
                type="button"
                onClick={toggleScreenLock}
                className={`absolute right-14 top-[max(env(safe-area-inset-top,0px),40px)] z-[110] rounded-full bg-black/60 p-2 text-white transition-opacity duration-200 hover:bg-black/80 ${
                  controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
                aria-label="Lock player controls"
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
                  ref={settingsMenuButtonRef}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setSettingsMenu((current) => (current === "closed" ? "root" : "closed"));
                    markControlsActivity();
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  className={`absolute right-3 top-[max(env(safe-area-inset-top,0px),0.5rem)] z-[110] rounded-full bg-black/60 p-2 text-white transition-opacity duration-200 hover:bg-black/90 ${
                    controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                  aria-label="Player settings"
                  aria-expanded={settingsMenu !== "closed"}
                  data-testid="video-player-settings"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>

                {settingsMenu !== "closed" ? (
                  isLongVideoWatchRoute ? (
                    <button
                      type="button"
                      className="fixed inset-0 z-[115] cursor-default bg-transparent"
                      aria-label="Close player settings"
                      data-testid="video-player-settings-backdrop"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setSettingsMenu("closed");
                        markControlsActivity();
                      }}
                    />
                  ) : null
                ) : null}

                {settingsMenu !== "closed" ? (
                  <div
                    role="menu"
                    ref={settingsMenuRef}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                    className={`${
                      isLongVideoWatchRoute
                        ? "fixed z-[120] w-52 max-h-[80dvh] overflow-y-auto overscroll-contain"
                        : `absolute right-3 z-[120] max-h-[70vh] overflow-y-auto overscroll-contain ${
                            isFullscreen ? "top-14" : "bottom-20"
                          }`
                    } rounded-xl border border-white/15 bg-black/90 p-1.5 text-white shadow-2xl backdrop-blur-xl`}
                    style={
                      isLongVideoWatchRoute
                        ? {
                            left: settingsMenuPlacement?.left ?? 12,
                            top: settingsMenuPlacement?.top ?? 12,
                            maxHeight: settingsMenuPlacement?.maxHeight ?? "calc(100dvh - 24px)",
                            visibility: settingsMenuPlacement ? "visible" : "hidden",
                          }
                        : undefined
                    }
                    data-testid="video-player-settings-menu"
                  >
                    {settingsMenu === "root" ? (
                      <>
                        <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">
                          Video Tools
                        </p>
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
                          aria-pressed={loopVideo}
                          onClick={() => {
                            const nextLoopState = !loopVideo;
                            if (videoRef.current) videoRef.current.loop = nextLoopState;
                            setLoopVideo(nextLoopState);
                            setSettingsMenu("closed");
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-white/10"
                        >
                          <span className="flex items-center gap-2">
                            <Repeat className="h-4 w-4 text-white/70" />
                            Loop video
                          </span>
                          <span
                            aria-hidden="true"
                            className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${
                              loopVideo ? "bg-violet-500" : "bg-white/25"
                            }`}
                          >
                            <span
                              className={`absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
                                loopVideo ? "translate-x-3" : ""
                              }`}
                            />
                          </span>
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
                        {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
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
                            disabled={pendingQualitySwitch !== null}
                            onClick={() => selectQuality(option.id)}
                            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70 disabled:cursor-wait disabled:opacity-60"
                          >
                            <span>
                              {option.label}
                              {pendingQualitySwitch === option.id ? (
                                <span className="ml-1 text-[11px] text-white/50">Preparing…</span>
                              ) : null}
                              {option.description ? (
                                <span className="ml-1 text-[11px] text-white/50">({option.description})</span>
                              ) : null}
                            </span>
                            {pendingQualitySwitch === option.id ? (
                              <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white/30 border-t-white" />
                            ) : quality === option.id ? (
                              <Check className="h-4 w-4" />
                            ) : null}
                          </button>
                        ))}
                      </>
                    )}
                    {settingsMenu === "root" && longVideoPlayerMenuActions ? (
                      <>
                        <div
                          aria-hidden="true"
                          role="separator"
                          className="my-1.5 border-t border-white/15"
                        />
                        <p className="px-2.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">
                          Feedback &amp; Safety
                        </p>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setSettingsMenu("closed");
                            longVideoPlayerMenuActions.onNotInterested();
                          }}
                          className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-white/10"
                        >
                          Not Interested
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setSettingsMenu("closed");
                            longVideoPlayerMenuActions.onDontRecommendCreator();
                          }}
                          className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-white/10"
                        >
                          Don&apos;t Recommend Creator
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setSettingsMenu("closed");
                            longVideoPlayerMenuActions.onReport();
                          }}
                          className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-white/10"
                        >
                          Report
                        </button>
                        {longVideoPlayerMenuActions.onDelete ? (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setSettingsMenu("closed");
                              longVideoPlayerMenuActions.onDelete?.();
                            }}
                            className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-red-300 transition hover:bg-white/10"
                          >
                            Delete Video
                          </button>
                        ) : null}
                      </>
                    ) : null}
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
      </VideoPlaybackProgressContext.Provider>
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

export function useVideoPlaybackProgress() {
  const store = useContext(VideoPlaybackProgressContext);
  if (!store) {
    throw new Error("useVideoPlaybackProgress must be used inside VideoPlaybackProvider");
  }
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

type PlaybackTimelineProps = {
  showDetailChrome: boolean;
  screenLocked: boolean;
  controlsVisible: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onSeek: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const PlaybackTimeline = memo(function PlaybackTimeline({
  showDetailChrome,
  screenLocked,
  controlsVisible,
  isMuted,
  isFullscreen,
  onToggleMute,
  onToggleFullscreen,
  onSeek,
}: PlaybackTimelineProps) {
  const { currentTime, duration } = useVideoPlaybackProgress();
  if (!showDetailChrome || screenLocked) return null;

  return (
    <div
      data-testid="video-player-timeline"
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-40 transition-opacity duration-200 ${
        controlsVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`px-3 pb-2 pt-12 ${
          controlsVisible ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between gap-2.5 text-white">
          <span className="text-xs font-medium tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={onToggleMute}
              className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-white/15"
              aria-label={isMuted ? "Unmute video" : "Mute video"}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-white/15"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(duration, 1)}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          onChange={onSeek}
          aria-label="Seek video"
          data-testid="input-video-seek"
          className="mt-1.5 h-1 w-full cursor-pointer accent-white"
        />
      </div>
    </div>
  );
});

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