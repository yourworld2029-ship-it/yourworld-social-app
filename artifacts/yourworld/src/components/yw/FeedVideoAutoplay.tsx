import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Volume2, VolumeX } from "lucide-react";
import Hls from "hls.js";
import {
  bindHlsNetworkAwareLevelCap,
  createVideoHlsConfig,
} from "@/lib/video-hls-config";
import type { LongVideo } from "@/lib/video-data";
import {
  cacheVideoPoster,
  cacheResolvedVideoCover,
  cancelPendingVideoPrefetches,
} from "@/lib/video-prefetch";
import { cloudflareStreamPosterUrl } from "@/lib/cloudflare-stream-media";
import {
  attemptVideoPlay,
  canAutoplayPublicVideo,
  isAutoplayPolicyError,
  isHlsMediaUrl,
  isPlayableMediaUrl,
  supportsNativeHls,
} from "@/lib/video-playback-engine";
import { resolveLongVideoUrl } from "@/lib/video-data";
import { cn } from "@/lib/utils";
import { releaseListVideo } from "@/lib/media-release";
import { preloadNextVideo } from "@/lib/next-video-preload";
import { centeredCandidate } from "@/lib/feed-center-selection";
import {
  LazyVideoThumbnail,
  VIDEO_POSTER_FALLBACK,
} from "@/components/yw/LazyVideoThumbnail";

const FEED_MUTE_STORAGE_KEY = "yourworld.feed-video-muted";
const NORMAL_VISIBILITY_RATIO = 0.5;
const TRAY_VISIBILITY_RATIO = 0.99;

type FeedCandidate = {
  candidateId: string;
  videoId: string;
  element: HTMLDivElement;
  video: HTMLVideoElement | null;
  url: string;
  access?: LongVideo["access"];
  prefetchNextVideos?: Array<Pick<LongVideo, "mediaUrl" | "access" | "durationSeconds">>;
  minimumRatio: number;
  forceMuted?: boolean;
  order: number;
  ratio: number;
  resolvedUrl?: string;
  resolvePromise?: Promise<string>;
  onPlaybackFailure?: () => void;
};

type FeedCandidateRegistration = Omit<FeedCandidate, "order" | "ratio">;

export type FeedVideoAutoplayControls = {
  activeCandidateId: string | null;
  activeVideoId: string | null;
  muted: boolean;
  registerCandidate: (candidate: FeedCandidateRegistration) => () => void;
  attachVideo: (candidateId: string, player: HTMLVideoElement | null) => void;
  stopCandidate: (candidateId: string) => void;
  toggleMute: () => void;
};

type FeedVideoAutoplayProviderProps = {
  children: ReactNode | ((controls: FeedVideoAutoplayControls) => ReactNode);
  disabled?: boolean;
};

const FeedVideoAutoplayContext = createContext<FeedVideoAutoplayControls | null>(null);

function saveMuteState(muted: boolean) {
  try {
    window.localStorage.setItem(FEED_MUTE_STORAGE_KEY, String(muted));
  } catch {
    // Playback remains usable when storage is unavailable.
  }
}

function releaseVideo(candidate: FeedCandidate | null) {
  releaseListVideo(candidate?.video ?? null);
}

function isPageVisible() {
  return typeof document === "undefined" || document.visibilityState !== "hidden";
}

function resolveCandidateUrl(candidate: FeedCandidate) {
  if (candidate.resolvedUrl) return Promise.resolve(candidate.resolvedUrl);
  if (!candidate.resolvePromise) {
    candidate.resolvePromise = resolveLongVideoUrl(candidate.url)
      .then((url) => {
        candidate.resolvedUrl = url || "";
        return candidate.resolvedUrl;
      })
      .catch(() => {
        candidate.resolvedUrl = "";
        return "";
      });
  }
  return candidate.resolvePromise;
}

export function FeedVideoAutoplayProvider({
  children,
  disabled = false,
}: FeedVideoAutoplayProviderProps) {
  const [muted, setMuted] = useState(true);
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const mutedRef = useRef(muted);
  const disabledRef = useRef(disabled);
  const activeCandidateRef = useRef<FeedCandidate | null>(null);
  const candidatesRef = useRef(new Map<string, FeedCandidate>());
  const candidateByElementRef = useRef(new WeakMap<Element, FeedCandidate>());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const fallbackVisibilityCheckRef = useRef<() => void>(() => {});
  const nextOrderRef = useRef(0);
  const suppressedCandidateRef = useRef<string | null>(null);
  const reconcileRef = useRef<() => void>(() => {});
  const preloadRef = useRef<{ key: string; dispose: () => void } | null>(null);

  mutedRef.current = muted;
  disabledRef.current = disabled;

  const releaseActiveVideo = useCallback((candidate: FeedCandidate | null) => {
    preloadRef.current?.dispose();
    preloadRef.current = null;
    cancelPendingVideoPrefetches();
    hlsRef.current?.destroy();
    hlsRef.current = null;
    releaseVideo(candidate);
  }, []);

  const clearActiveCandidate = useCallback(() => {
    releaseActiveVideo(activeCandidateRef.current);
    activeCandidateRef.current = null;
    setActiveCandidateId(null);
    setActiveVideoId(null);
  }, [releaseActiveVideo]);

  const startCandidate = useCallback(
    (candidate: FeedCandidate) => {
      const player = candidate.video;
      if (!player || activeCandidateRef.current !== candidate ||
          disabledRef.current || !isPageVisible()) return;
      player.muted = candidate.forceMuted ? true : mutedRef.current;
      player.playsInline = true;
      player.preload = "metadata";
      player.loop = true;
      const playCandidate = () => {
        if (activeCandidateRef.current !== candidate || candidate.video !== player) return;
        void attemptVideoPlay(player).catch((error: unknown) => {
          if (activeCandidateRef.current !== candidate || candidate.video !== player) return;
          if (
            isAutoplayPolicyError(error) &&
            !candidate.forceMuted &&
            !mutedRef.current
          ) {
            player.muted = true;
            mutedRef.current = true;
            setMuted(true);
            saveMuteState(true);
            void attemptVideoPlay(player).catch(() => {
              if (activeCandidateRef.current === candidate) {
                candidate.onPlaybackFailure?.();
              }
            });
            return;
          }
          candidate.onPlaybackFailure?.();
        });
      };

      const attachSource = (url: string) => {
        if (
          activeCandidateRef.current !== candidate ||
          candidate.video !== player ||
          disabledRef.current ||
          !isPageVisible()
        ) {
          return;
        }
        if (!url) {
          candidate.onPlaybackFailure?.();
          return;
        }
        if (!isPlayableMediaUrl(url)) {
          candidate.onPlaybackFailure?.();
          return;
        }

        if (isHlsMediaUrl(url)) {
          if (Hls.isSupported()) {
            const hls = new Hls(createVideoHlsConfig());
            hlsRef.current = hls;
            bindHlsNetworkAwareLevelCap(hls);
            hls.on(Hls.Events.MANIFEST_PARSED, playCandidate);
            hls.on(Hls.Events.ERROR, (_event, data) => {
              if (!data.fatal || activeCandidateRef.current !== candidate || candidate.video !== player) return;
              if (hlsRef.current === hls) hlsRef.current = null;
              hls.destroy();
              if (supportsNativeHls(player)) {
                player.src = url;
                player.load();
                playCandidate();
              } else {
                candidate.onPlaybackFailure?.();
              }
            });
            hls.loadSource(url);
            hls.attachMedia(player);
          } else if (supportsNativeHls(player)) {
            player.src = url;
            player.load();
            playCandidate();
          } else {
            candidate.onPlaybackFailure?.();
          }
        } else {
          player.src = url;
          player.load();
          playCandidate();
        }
      };
      // Already-resolved HTTP/blob sources start in this same callback: no timer,
      // debounce or asynchronous storage lookup is inserted before play().
      if (candidate.resolvedUrl || (/^(https?:|blob:)/i.test(candidate.url) &&
          !candidate.url.includes("/storage/v1/object/sign/"))) {
        attachSource(candidate.resolvedUrl || candidate.url);
        return;
      }
      void resolveCandidateUrl(candidate).then(attachSource).catch(() => {
        if (activeCandidateRef.current === candidate) {
          candidate.onPlaybackFailure?.();
        }
      });
    },
    [],
  );

  const activateCandidate = useCallback((candidate: FeedCandidate | null) => {
    if (activeCandidateRef.current?.candidateId === candidate?.candidateId) return;
    releaseActiveVideo(activeCandidateRef.current);
    activeCandidateRef.current = null;
    const allowed = candidate && !disabledRef.current && isPageVisible() &&
      suppressedCandidateRef.current !== candidate.candidateId;
    setActiveCandidateId(allowed ? candidate.candidateId : null);
    setActiveVideoId(allowed ? candidate.videoId : null);
    if (!allowed) return;
    mutedRef.current = true;
    setMuted(true);
    activeCandidateRef.current = candidate;
    startCandidate(candidate);
  }, [releaseActiveVideo, startCandidate]);

  const attachVideo = useCallback((candidateId: string, player: HTMLVideoElement | null) => {
    const candidate = candidatesRef.current.get(candidateId);
    if (!candidate || candidate.video === player) return;
    releaseListVideo(candidate.video);
    candidate.video = player;
    if (player && activeCandidateRef.current === candidate) startCandidate(candidate);
  }, [startCandidate]);

  reconcileRef.current = () => {
    if (disabledRef.current || !isPageVisible()) {
      clearActiveCandidate();
      return;
    }

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    for (const candidate of candidatesRef.current.values()) {
      const rect = candidate.element.getBoundingClientRect();
      const area = rect.width * rect.height;
      candidate.ratio = area > 0 ? Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)) *
        Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0)) / area : 0;
      if (candidate.ratio < candidate.minimumRatio && suppressedCandidateRef.current === candidate.candidateId) {
        suppressedCandidateRef.current = null;
      }
    }
    const candidates = [...candidatesRef.current.values()].filter(
      (candidate) =>
        candidate.ratio >= candidate.minimumRatio &&
        candidate.candidateId !== suppressedCandidateRef.current,
    );
    const selected = centeredCandidate(candidates, viewportHeight);
    activateCandidate(selected);
    if (!selected) return;
    const registeredNext = [...candidatesRef.current.values()]
      .filter((candidate) => candidate.order > selected.order && candidate.access === "public")
      .sort((a, b) => a.order - b.order)[0];
    const hintedNext = selected.prefetchNextVideos?.find((video) => video.access === "public");
    const nextUrl = hintedNext?.mediaUrl ?? registeredNext?.url;
    if (!nextUrl || nextUrl === selected.url) {
      preloadRef.current?.dispose(); preloadRef.current = null; return;
    }
    if (preloadRef.current?.key === nextUrl) return;
    preloadRef.current?.dispose();
    const request = { key: nextUrl, dispose: () => {} };
    preloadRef.current = request;
    void resolveLongVideoUrl(nextUrl).then((url) => {
      if (preloadRef.current !== request || disabledRef.current || !isPageVisible() || !url) return;
      request.dispose = preloadNextVideo(url, nextUrl);
    }).catch(() => {
      if (preloadRef.current === request) preloadRef.current = null;
    });
  };

  const registerCandidate = useCallback((registration: FeedCandidateRegistration) => {
    const candidate: FeedCandidate = {
      ...registration,
      order: nextOrderRef.current++,
      ratio: 0,
    };
    candidatesRef.current.set(candidate.candidateId, candidate);
    candidateByElementRef.current.set(candidate.element, candidate);
    observerRef.current?.observe(candidate.element);
    fallbackVisibilityCheckRef.current();
    reconcileRef.current();

    return () => {
      observerRef.current?.unobserve(candidate.element);
      candidateByElementRef.current.delete(candidate.element);
      if (candidatesRef.current.get(candidate.candidateId) === candidate) {
        candidatesRef.current.delete(candidate.candidateId);
      }
      if (activeCandidateRef.current === candidate) clearActiveCandidate();
      if (suppressedCandidateRef.current === candidate.candidateId) {
        suppressedCandidateRef.current = null;
      }
      reconcileRef.current();
    };
  }, [clearActiveCandidate]);

  const stopCandidate = useCallback(
    (candidateId: string) => {
      suppressedCandidateRef.current = candidateId;
      if (activeCandidateRef.current?.candidateId === candidateId) {
        clearActiveCandidate();
      }
    },
    [clearActiveCandidate],
  );

  const toggleMute = useCallback(() => {
    const nextMuted = !mutedRef.current;
    mutedRef.current = nextMuted;
    setMuted(nextMuted);
    saveMuteState(nextMuted);
    if (activeCandidateRef.current?.video) {
      activeCandidateRef.current.video.muted = activeCandidateRef.current.forceMuted
        ? true
        : nextMuted;
    }
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (!isPageVisible()) clearActiveCandidate();
      else reconcileRef.current();
    };

    if (typeof IntersectionObserver === "undefined") {
      const checkVisibility = () => {
        if (typeof window === "undefined") return;
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        for (const candidate of candidatesRef.current.values()) {
          const rect = candidate.element.getBoundingClientRect();
          const visibleWidth = Math.max(
            0,
            Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0),
          );
          const visibleHeight = Math.max(
            0,
            Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0),
          );
          const area = rect.width * rect.height;
          candidate.ratio = area > 0 ? (visibleWidth * visibleHeight) / area : 0;
          if (
            candidate.ratio < candidate.minimumRatio &&
            suppressedCandidateRef.current === candidate.candidateId
          ) {
            suppressedCandidateRef.current = null;
          }
        }
        reconcileRef.current();
      };

      fallbackVisibilityCheckRef.current = checkVisibility;
      window.addEventListener("scroll", checkVisibility, true);
      window.addEventListener("resize", checkVisibility);
      document.addEventListener("visibilitychange", onVisibilityChange);
      checkVisibility();

      return () => {
        window.removeEventListener("scroll", checkVisibility, true);
        window.removeEventListener("resize", checkVisibility);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        fallbackVisibilityCheckRef.current = () => {};
        releaseActiveVideo(activeCandidateRef.current);
        activeCandidateRef.current = null;
      };
    }

    fallbackVisibilityCheckRef.current = () => {};
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const candidate = candidateByElementRef.current.get(entry.target);
          if (!candidate) continue;
          candidate.ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
          if (
            candidate.ratio < candidate.minimumRatio &&
            suppressedCandidateRef.current === candidate.candidateId
          ) {
            suppressedCandidateRef.current = null;
          }
        }
        reconcileRef.current();
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: [0, 0.25, NORMAL_VISIBILITY_RATIO, 0.7, TRAY_VISIBILITY_RATIO, 1],
      },
    );
    observerRef.current = observer;
    for (const candidate of candidatesRef.current.values()) observer.observe(candidate.element);

    document.addEventListener("visibilitychange", onVisibilityChange);
    const onScroll = () => reconcileRef.current();
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll);
    reconcileRef.current();

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      observer.disconnect();
      observerRef.current = null;
      releaseActiveVideo(activeCandidateRef.current);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      activeCandidateRef.current = null;
    };
  }, [clearActiveCandidate, releaseActiveVideo]);

  useEffect(() => {
    if (disabled) {
      suppressedCandidateRef.current = null;
      clearActiveCandidate();
    } else {
      reconcileRef.current();
    }
  }, [clearActiveCandidate, disabled]);

  const controls = useMemo<FeedVideoAutoplayControls>(
    () => ({
      activeCandidateId,
      activeVideoId,
      muted,
      registerCandidate,
      attachVideo,
      stopCandidate,
      toggleMute,
    }),
    [activeCandidateId, activeVideoId, muted, registerCandidate, attachVideo, stopCandidate, toggleMute],
  );

  return (
    <FeedVideoAutoplayContext.Provider value={controls}>
      {typeof children === "function" ? children(controls) : children}
    </FeedVideoAutoplayContext.Provider>
  );
}

export function useFeedVideoAutoplay() {
  const context = useContext(FeedVideoAutoplayContext);
  if (!context) {
    throw new Error("useFeedVideoAutoplay must be used inside FeedVideoAutoplayProvider");
  }
  return context;
}

export function FeedVideoPreview({
  video,
  candidateId,
  prefetchNextVideos,
  className,
  onOpen,
  interactive = true,
  showPlayFallback = false,
  showFallbackIcon = true,
  showThumbnailStatus = true,
  preferCaptureWhenMissing = false,
  thumbnailCaptureTimeSeconds = 0.1,
  previewTestId,
}: {
  video: LongVideo;
  candidateId: string;
  prefetchNextVideos?: Array<Pick<LongVideo, "mediaUrl" | "access" | "durationSeconds">>;
  className?: string;
  onOpen: () => void;
  interactive?: boolean;
  showPlayFallback?: boolean;
  showFallbackIcon?: boolean;
  showThumbnailStatus?: boolean;
  preferCaptureWhenMissing?: boolean;
  thumbnailCaptureTimeSeconds?: number;
  previewTestId?: string;
}) {
  const { activeCandidateId, muted, registerCandidate, attachVideo, stopCandidate } = useFeedVideoAutoplay();
  const previewRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const canAutoplay = canAutoplayPublicVideo(video.access, video.price);
  const active = activeCandidateId === candidateId;
  const rememberCover = useCallback(
    (url: string) => cacheResolvedVideoCover(video.id, url),
    [video.id],
  );
  const onPlaybackFailure = useCallback(() => {
    setVideoReady(false);
    stopCandidate(candidateId);
  }, [candidateId, stopCandidate]);
  const setVideoRef = useCallback((player: HTMLVideoElement | null) => {
    if (!player) releaseListVideo(videoRef.current);
    else setVideoReady(false);
    videoRef.current = player;
    attachVideo(candidateId, player);
  }, [attachVideo, candidateId]);

  useLayoutEffect(() => {
    const element = previewRef.current;
    if (!element || !video.mediaUrl || !canAutoplay) return;

    return registerCandidate({
      candidateId,
      videoId: video.id,
      element,
      video: videoRef.current,
      url: video.mediaUrl,
      access: video.access,
      prefetchNextVideos,
      minimumRatio: NORMAL_VISIBILITY_RATIO,
      onPlaybackFailure,
    });
  }, [
    candidateId,
    canAutoplay,
    onPlaybackFailure,
    prefetchNextVideos,
    registerCandidate,
    video.access,
    video.id,
    video.mediaUrl,
  ]);

  const cloudflarePoster =
    video.access === "public"
      ? cloudflareStreamPosterUrl(video.mediaUrl, video.cloudflareStreamId)
      : null;
  const posterUrl = video.thumbnailUrl?.trim() || cloudflarePoster;

  return (
    <div
      ref={previewRef}
      className={cn(
        "relative h-full w-full overflow-hidden",
        className,
      )}
      data-feed-autoplay-candidate={candidateId}
      data-testid={previewTestId ?? `feed-autoplay-preview-${video.id}`}
    >
      <LazyVideoThumbnail
        thumbnailUrl={video.thumbnailUrl}
        mediaUrl={canAutoplay ? video.mediaUrl : undefined}
        streamId={video.access === "public" ? video.cloudflareStreamId : undefined}
        alt={video.title}
        authorName={video.author.name}
        authorAvatarUrl={video.author.avatarUrl}
        showPlayFallback={showPlayFallback}
        showFallbackIcon={showFallbackIcon}
        showFrameStatus={showThumbnailStatus}
        preferGeneratedFallback={preferCaptureWhenMissing}
        frameCaptureTimeSeconds={thumbnailCaptureTimeSeconds}
        bucket="thumbnails"
        className="pointer-events-none m-0 select-none p-0 [&_img]:block"
        allowFrameCapture={!active}
        onPosterResolved={rememberCover}
      />
      {active && canAutoplay ? <video
        ref={setVideoRef}
        poster={posterUrl ?? VIDEO_POSTER_FALLBACK}
        crossOrigin="anonymous"
        playsInline
        muted={active ? muted : true}
        loop
        preload="metadata"
        aria-label={video.title}
        onLoadedData={() => {
          setVideoReady(true);
        }}
        onTimeUpdate={(event) => {
          const player = event.currentTarget;
          const captureAt = Number.isFinite(player.duration)
            ? Math.min(2.5, Math.max(0, player.duration - 0.1))
            : 2.5;
          if (player.currentTime >= captureAt) cacheVideoPoster(player, video.mediaUrl);
        }}
        onEmptied={() => {
          setVideoReady(false);
        }}
        onError={() => {
          setVideoReady(false);
          stopCandidate(candidateId);
        }}
        className={cn(
          "absolute inset-0 h-full w-full object-cover",
          interactive ? "" : "pointer-events-none",
          active && videoReady ? "opacity-100" : "opacity-0",
          active && videoReady
            ? "[transform:translate3d(0,0,0)] [backface-visibility:hidden] [will-change:transform]"
            : "",
        )}
      /> : null}
      {interactive ? (
        <button
          type="button"
          aria-label={`Watch ${video.title}`}
          data-testid={`button-feed-video-watch-${video.id}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onOpen();
          }}
          className="absolute inset-0 z-10 grid h-full w-full place-items-center bg-transparent text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fuchsia-300"
        />
      ) : null}
    </div>
  );
}

export function FeedVideoMuteButton({
  candidateId,
  title,
  className,
}: {
  candidateId: string;
  title: string;
  className?: string;
}) {
  const { activeCandidateId, muted, toggleMute } = useFeedVideoAutoplay();
  if (activeCandidateId !== candidateId) return null;

  return (
    <button
      type="button"
      aria-label={muted ? `Unmute ${title || "video"}` : `Mute ${title || "video"}`}
      className={cn(
        "absolute right-3 top-auto bottom-3 z-30 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/70 text-white backdrop-blur-md transition-colors hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300 active:scale-95",
        className,
      )}
      data-testid={`button-feed-mute-${candidateId}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleMute();
      }}
    >
      {muted ? (
        <VolumeX aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
      ) : (
        <Volume2 aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
      )}
    </button>
  );
}