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
import { Volume2, VolumeX } from "lucide-react";
import Hls from "hls.js";
import type { LongVideo } from "@/lib/video-data";
import {
  cacheVideoPoster,
  canPrefetchVideo,
  cancelPendingVideoPrefetches,
  prefetchVideo,
} from "@/lib/video-prefetch";
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
import {
  VIDEO_POSTER_FALLBACK,
  VideoPoster,
} from "@/components/yw/VideoPoster";

const FEED_MUTE_STORAGE_KEY = "yourworld.feed-video-muted";
const NORMAL_VISIBILITY_RATIO = 0.7;
const TRAY_VISIBILITY_RATIO = 0.99;

type FeedCandidate = {
  candidateId: string;
  videoId: string;
  element: HTMLDivElement;
  video: HTMLVideoElement;
  url: string;
  access?: LongVideo["access"];
  prefetchNextVideos?: Array<Pick<LongVideo, "mediaUrl" | "access">>;
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
  stopCandidate: (candidateId: string) => void;
  toggleMute: () => void;
};

type FeedVideoAutoplayProviderProps = {
  children: ReactNode | ((controls: FeedVideoAutoplayControls) => ReactNode);
  disabled?: boolean;
};

const FeedVideoAutoplayContext = createContext<FeedVideoAutoplayControls | null>(null);

function readInitialMuteState() {
  if (typeof window === "undefined") return true;
  try {
    const stored = window.localStorage.getItem(FEED_MUTE_STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

function saveMuteState(muted: boolean) {
  try {
    window.localStorage.setItem(FEED_MUTE_STORAGE_KEY, String(muted));
  } catch {
    // Playback remains usable when storage is unavailable.
  }
}

function releaseVideo(candidate: FeedCandidate | null) {
  if (!candidate) return;
  candidate.video.pause();
  candidate.video.preload = "metadata";
  candidate.video.removeAttribute("src");
  candidate.video.load();
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
  const [muted, setMuted] = useState(readInitialMuteState);
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

  mutedRef.current = muted;
  disabledRef.current = disabled;

  const releaseActiveVideo = useCallback((candidate: FeedCandidate | null) => {
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

  const activateCandidate = useCallback(
    (candidate: FeedCandidate | null) => {
      const current = activeCandidateRef.current;
      if (current?.candidateId === candidate?.candidateId) return;

      releaseActiveVideo(current);
      activeCandidateRef.current = null;
      setActiveCandidateId(candidate?.candidateId ?? null);
      setActiveVideoId(null);

      if (
        !candidate ||
        disabledRef.current ||
          !isPageVisible() ||
        suppressedCandidateRef.current === candidate.candidateId
      ) {
        return;
      }

      activeCandidateRef.current = candidate;
      setActiveVideoId(candidate.videoId);
      candidate.video.muted = candidate.forceMuted ? true : mutedRef.current;
      candidate.video.playsInline = true;
      candidate.video.preload = "auto";
      candidate.video.loop = true;
      const playCandidate = () => {
        if (activeCandidateRef.current !== candidate) return;
        void attemptVideoPlay(candidate.video).catch((error: unknown) => {
          if (activeCandidateRef.current !== candidate) return;
          if (
            isAutoplayPolicyError(error) &&
            !candidate.forceMuted &&
            !mutedRef.current
          ) {
            candidate.video.muted = true;
            mutedRef.current = true;
            setMuted(true);
            saveMuteState(true);
            void attemptVideoPlay(candidate.video).catch(() => {
              if (activeCandidateRef.current === candidate) {
                candidate.onPlaybackFailure?.();
              }
            });
            return;
          }
          candidate.onPlaybackFailure?.();
        });
      };

      void resolveCandidateUrl(candidate).then((url) => {
        if (
          activeCandidateRef.current !== candidate ||
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

        const nextVideo = candidate.prefetchNextVideos?.[0];
        if (candidate.access === "public" && nextVideo?.access === "public") {
          void canPrefetchVideo().then(async (allowed) => {
            if (
              !allowed ||
              activeCandidateRef.current !== candidate ||
              disabledRef.current ||
              !isPageVisible()
            ) return;
            try {
              const nextUrl = await resolveLongVideoUrl(nextVideo.mediaUrl);
              if (
                activeCandidateRef.current !== candidate ||
                disabledRef.current ||
                !isPageVisible()
              ) return;
              await prefetchVideo(nextUrl || nextVideo.mediaUrl);
            } catch {
              // The current video remains playable if optional prefetch cannot resolve.
            }
          }).catch(() => {
            // Prefetch is optional and must never create an unhandled rejection.
          });
        }

        if (isHlsMediaUrl(url)) {
          if (Hls.isSupported()) {
            const hls = new Hls({ enableWorker: true });
            hlsRef.current = hls;
            hls.on(Hls.Events.MANIFEST_PARSED, playCandidate);
            hls.on(Hls.Events.ERROR, (_event, data) => {
              if (!data.fatal || activeCandidateRef.current !== candidate) return;
              if (hlsRef.current === hls) hlsRef.current = null;
              hls.destroy();
              if (supportsNativeHls(candidate.video)) {
                candidate.video.src = url;
                candidate.video.load();
                playCandidate();
              } else {
                candidate.onPlaybackFailure?.();
              }
            });
            hls.loadSource(url);
            hls.attachMedia(candidate.video);
          } else if (supportsNativeHls(candidate.video)) {
            candidate.video.src = url;
            candidate.video.load();
            playCandidate();
          } else {
            candidate.onPlaybackFailure?.();
          }
        } else {
          candidate.video.src = url;
          candidate.video.load();
          playCandidate();
        }
      }).catch(() => {
        if (activeCandidateRef.current === candidate) {
          candidate.onPlaybackFailure?.();
        }
      });
    },
    [releaseActiveVideo],
  );

  reconcileRef.current = () => {
    if (disabledRef.current || !isPageVisible()) {
      clearActiveCandidate();
      return;
    }

    const candidates = [...candidatesRef.current.values()].filter(
      (candidate) =>
        candidate.ratio >= candidate.minimumRatio &&
        candidate.candidateId !== suppressedCandidateRef.current,
    );
    const current = activeCandidateRef.current;
    const currentIsVisible = current
      ? candidatesRef.current.get(current.candidateId) === current &&
        current.ratio >= current.minimumRatio &&
        current.candidateId !== suppressedCandidateRef.current
      : false;

    if (currentIsVisible) return;

    candidates.sort((a, b) => b.ratio - a.ratio || a.order - b.order);
    activateCandidate(candidates[0] ?? null);
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
    if (activeCandidateRef.current) {
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
        threshold: [NORMAL_VISIBILITY_RATIO, TRAY_VISIBILITY_RATIO],
      },
    );
    observerRef.current = observer;
    for (const candidate of candidatesRef.current.values()) observer.observe(candidate.element);

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
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
      stopCandidate,
      toggleMute,
    }),
    [activeCandidateId, activeVideoId, muted, registerCandidate, stopCandidate, toggleMute],
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
  allowFrameFallback = false,
  showPlayFallback = false,
  previewTestId,
}: {
  video: LongVideo;
  candidateId: string;
  prefetchNextVideos?: Array<Pick<LongVideo, "mediaUrl" | "access">>;
  className?: string;
  onOpen: () => void;
  interactive?: boolean;
  allowFrameFallback?: boolean;
  showPlayFallback?: boolean;
  previewTestId?: string;
}) {
  const { activeCandidateId, muted, registerCandidate, stopCandidate } = useFeedVideoAutoplay();
  const previewRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [posterUrl, setPosterUrl] = useState(VIDEO_POSTER_FALLBACK);
  const [videoReady, setVideoReady] = useState(false);
  const canAutoplay = canAutoplayPublicVideo(video.access, video.price);
  const active = activeCandidateId === candidateId;
  const onPosterResolved = useCallback((url: string) => {
    setPosterUrl(url || VIDEO_POSTER_FALLBACK);
  }, []);
  const onPlaybackFailure = useCallback(() => {
    setVideoReady(false);
    stopCandidate(candidateId);
  }, [candidateId, stopCandidate]);

  useEffect(() => {
    const element = previewRef.current;
    const player = videoRef.current;
    if (!element || !player || !video.mediaUrl || !canAutoplay) return;

    return registerCandidate({
      candidateId,
      videoId: video.id,
      element,
      video: player,
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

  return (
    <div
      ref={previewRef}
      className={cn(
        "relative h-full w-full overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950",
        className,
      )}
      data-feed-autoplay-candidate={candidateId}
      data-testid={previewTestId ?? `feed-autoplay-preview-${video.id}`}
    >
      <VideoPoster
        thumbnailUrl={video.thumbnailUrl}
        mediaUrl={canAutoplay ? video.mediaUrl : ""}
        alt={video.title}
        loading="lazy"
        bucket="videos"
        posterOnly
        allowFrameFallback={allowFrameFallback && canAutoplay}
        showPlayFallback={showPlayFallback}
        onPosterResolved={onPosterResolved}
        className="pointer-events-none m-0 select-none p-0 [&_img]:block"
      />
      <video
        ref={videoRef}
        poster={posterUrl}
        crossOrigin="anonymous"
        playsInline
        muted={active ? muted : true}
        loop
        preload="metadata"
        aria-label={video.title}
        onLoadedData={() => {
          setVideoReady(true);
          if (!video.thumbnailUrl && videoRef.current) {
            const generated = cacheVideoPoster(videoRef.current, video.mediaUrl);
            if (generated) setPosterUrl(generated);
          }
        }}
        onEmptied={() => {
          setVideoReady(false);
        }}
        onError={() => {
          setVideoReady(false);
          stopCandidate(candidateId);
        }}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-150",
          interactive ? "" : "pointer-events-none",
          active && videoReady ? "opacity-100" : "opacity-0",
          active && videoReady
            ? "[transform:translate3d(0,0,0)] [backface-visibility:hidden] [will-change:transform]"
            : "",
        )}
      />
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