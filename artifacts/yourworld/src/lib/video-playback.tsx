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
import { ScreenOrientation } from "@capacitor/screen-orientation";
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
export type QualityUrls = Partial<Record<Exclude<QualityId, "auto">, string>>;

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

export function VideoPlaybackProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeVideo, setActiveVideo] = useState<PersistentVideo | null>(null);
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
  const [settingsMenu, setSettingsMenu] = useState<"closed" | "root" | "speed" | "quality">("closed");
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loopVideo, setLoopVideo] = useState(false);
  const [quality, setQuality] = useState<QualityId>("auto");
  const [hlsLevels, setHlsLevels] = useState<Hls["levels"]>([]);
  const [activeHlsHeight, setActiveHlsHeight] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeSourceRef = useRef<{ id: string; url: string } | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const timeUpdateHandlerRef = useRef<((currentTime: number) => void) | null>(null);
  const touchGestureRef = useRef<TouchGesture | null>(null);
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const controlsHideTimerRef = useRef<number | null>(null);
  const lockedUnlockTimerRef = useRef<number | null>(null);
  const fullscreenScrollYRef = useRef<number | null>(null);
  const fullscreenRequestIdRef = useRef(0);

  const detailVideoId = getDetailVideoId(location.pathname);
  const downloadDetailPath = getDownloadDetailPath(location.pathname);
  const isDetailPlayer = Boolean(
    activeVideo &&
      (detailVideoId === activeVideo.id || activeVideo.detailRoute === downloadDetailPath),
  );
  const isPlayerRoute = Boolean(detailVideoId || downloadDetailPath);

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
    activeSourceRef.current = { id: activeVideo.id, url: activeVideo.url };
    video.playbackRate = playbackRate;
    if (isHlsUrl(activeVideo.url) && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setHlsLevels([...hls.levels]);
        setActiveHlsHeight(hls.levels[hls.currentLevel]?.height ?? hls.levels[hls.levels.length - 1]?.height ?? null);
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        setActiveHlsHeight(hls.levels[data.level]?.height ?? null);
      });
      hls.loadSource(activeVideo.url);
      hls.attachMedia(video);
    } else {
      video.src = activeVideo.url;
      video.load();
    }
    video.addEventListener("loadedmetadata", restorePlayback, { once: true });

    return () => {
      video.removeEventListener("loadedmetadata", restorePlayback);
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [activeVideo, playbackRate]);

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
    const video = videoRef.current;
    if (!video) return;
    if (document.pictureInPictureElement === video) {
      void document.exitPictureInPicture?.();
    } else if (typeof video.requestPictureInPicture === "function") {
      void video.requestPictureInPicture().catch(() => {});
    }
    setSettingsMenu("closed");
    markControlsActivity();
  }, [markControlsActivity]);

  const setRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
    setSettingsMenu("closed");
    markControlsActivity();
  }, [markControlsActivity]);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

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

  const handlePlayerSurfaceClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!isDetailPlayer) return;
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
      if (controlsVisible) {
        setControlsVisible(false);
      } else {
        markControlsActivity();
      }
    },
    [controlsVisible, isDetailPlayer, markControlsActivity, revealLockedUnlock, screenLocked, settingsMenu],
  );

  const handleVideoPlay = useCallback(() => {
    setIsPlaying(true);
    setControlsVisible(true);
  }, []);

  const handleVideoPause = useCallback(() => {
    setIsPlaying(false);
    setControlsVisible(true);
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
    if (isDetailPlayer) return;
    const fullscreenElement = getPlayerFullscreenElement();
    const playerIsFullscreen =
      fullscreenElement === containerRef.current || fullscreenElement === videoRef.current;
    if (!playerIsFullscreen && !isFullscreen && fullscreenScrollYRef.current === null) return;
    void teardownFullscreen(true);
  }, [isDetailPlayer, isFullscreen, teardownFullscreen]);

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
      if (!isFullscreen) return;
      if (screenLocked) {
        event.preventDefault();
        return;
      }
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
      if (!isFullscreen) return;
      if (screenLocked) {
        event.preventDefault();
        return;
      }
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
      if (!isFullscreen) return;
      if (screenLocked) {
        event.preventDefault();
        revealLockedUnlock();
        return;
      }
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
    [isFullscreen, revealLockedUnlock, screenLocked, seekBy],
  );

  const handleTimeUpdate = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    setCurrentTime(video.currentTime);
    if (Number.isFinite(video.duration)) setDuration(video.duration);
    timeUpdateHandlerRef.current?.(video.currentTime);
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
    if (activeVideo.detailRoute?.startsWith("/downloads/")) {
      void navigate({
        to: "/downloads/$downloadId",
        params: { downloadId: activeVideo.id },
      });
      return;
    }
    void navigate({ to: "/video/$videoId", params: { videoId: activeVideo.id } });
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
                ? isFullscreen
                  ? "fixed inset-0 z-50 h-screen w-screen max-w-none bg-black"
                    : "fixed inset-x-0 top-0 z-50 mx-auto w-full max-w-lg bg-black"
                : isPlayerRoute
                  ? "pointer-events-none fixed left-[-9999px] top-[-9999px] z-[-1] h-px w-px opacity-0"
                  : "fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3 z-[70] w-[min(68vw,280px)] overflow-hidden rounded-xl border border-white/15 bg-zinc-950 shadow-2xl"
          }
          onDoubleClick={isDetailPlayer ? handleDoubleTap : undefined}
          onTouchStart={isDetailPlayer ? handleTouchStart : undefined}
          onTouchMove={isDetailPlayer ? handleTouchMove : undefined}
          onTouchEnd={isDetailPlayer ? handleTouchEnd : undefined}
          style={isDetailPlayer ? { touchAction: isFullscreen ? "none" : "auto" } : undefined}
        >
          <div
            className={
              isDetailPlayer
                ? `relative w-full bg-black ${
                    isFullscreen
                      ? "h-screen w-screen"
                      : isVerticalVideo
                        ? "aspect-[9/16]"
                        : "aspect-video"
                  }`
                : `relative ${
                    isVerticalVideo ? "aspect-[9/16]" : "aspect-video"
                  } w-full bg-black`
            }
            onClick={isDetailPlayer ? handlePlayerSurfaceClick : undefined}
            style={isFullscreen ? { width: "100vw", height: "100vh" } : undefined}
          >
            <video
              ref={videoRef}
              controls={false}
              autoPlay
              loop={loopVideo}
              muted={isMuted}
              playsInline
              preload="metadata"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onVolumeChange={handleVolumeChange}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              className={`video-player-native-controls h-full w-full ${
                isFullscreen || displayMode === "fill" ? "object-cover" : "object-contain"
              }`}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
                objectFit: isFullscreen || displayMode === "fill" ? "cover" : "contain",
                filter: `brightness(${brightness})`,
                transition: gestureFeedback?.kind === "zoom" ? "none" : "transform 160ms ease-out",
              }}
            />

            {isDetailPlayer && !screenLocked ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  togglePlayPause();
                }}
                className={`absolute left-1/2 top-1/2 z-50 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/65 text-white shadow-xl backdrop-blur-md transition-opacity duration-200 hover:bg-black/80 ${
                  controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
                aria-label={isPlaying ? "Pause video" : "Play video"}
              >
                {isPlaying ? <Pause className="h-7 w-7 fill-current" /> : <Play className="ml-0.5 h-7 w-7 fill-current" />}
              </button>
            ) : null}

            {isDetailPlayer && !screenLocked ? (
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
                        className="rounded-full p-2 transition hover:bg-white/15"
                        aria-label={isMuted ? "Unmute video" : "Mute video"}
                      >
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </button>
                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="rounded-full p-2 transition hover:bg-white/15"
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

            {isDetailPlayer && !screenLocked ? (
              <button
                type="button"
                onClick={() =>
                  activeVideo.backTo
                    ? (closeVideo(), void navigate({ to: activeVideo.backTo as never }))
                    : window.history.length > 1
                      ? window.history.back()
                      : void navigate({ to: "/" })
                }
                className={`absolute left-3 ${
                  isFullscreen ? "top-[max(env(safe-area-inset-top,0px),40px)]" : "top-3"
                } z-50 rounded-full bg-black/60 p-2 text-white transition-opacity duration-200 hover:bg-black/80 ${
                  controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
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

            {isDetailPlayer && !screenLocked ? (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSettingsMenu((current) => (current === "closed" ? "root" : "closed"));
                  }}
                  className={`absolute right-3 ${
                    isFullscreen ? "top-[calc(env(safe-area-inset-top,24px)_+_0.75rem)]" : "top-3"
                  } z-[70] rounded-full bg-black/60 p-2 text-white transition-opacity duration-200 hover:bg-black/90 ${
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