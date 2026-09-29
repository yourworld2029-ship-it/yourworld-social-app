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
import { resolveMediaUrl } from "@/lib/social-data";
import { cacheVideoPoster, prefetchVideo } from "@/lib/video-prefetch";
import { cn } from "@/lib/utils";
import {
  VIDEO_POSTER_FALLBACK,
  VideoPoster,
} from "@/components/yw/VideoPoster";

const FEED_MUTE_STORAGE_KEY = "yourworld.feed-video-muted";
const NORMAL_VISIBILITY_RATIO = 0.7;
const WARM_VISIBILITY_RATIO = 0.25;
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

function isHlsUrl(url: string) {
  return /\.m3u8(?:$|[?#])/i.test(url);
}

function resolveCandidateUrl(candidate: FeedCandidate) {
  if (candidate.resolvedUrl) return Promise.resolve(candidate.resolvedUrl);
  if (!candidate.resolvePromise) {
    candidate.resolvePromise = resolveMediaUrl(candidate.url, "videos")
      .then((url) => {
        candidate.resolvedUrl = url || candidate.url;
        return candidate.resolvedUrl;
      })
      .catch(() => {
        candidate.resolvedUrl = candidate.url;
        return candidate.url;
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
  const nextOrderRef = useRef(0);
  const suppressedCandidateRef = useRef<string | null>(null);
  const reconcileRef = useRef<() => void>(() => {});

  mutedRef.current = muted;
  disabledRef.current = disabled;

  const releaseActiveVideo = useCallback((candidate: FeedCandidate | null) => {
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
        document.visibilityState === "hidden" ||
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
        void candidate.video.play().catch(() => {
          if (
            activeCandidateRef.current !== candidate ||
            candidate.forceMuted ||
            mutedRef.current
          ) return;
          candidate.video.muted = true;
          mutedRef.current = true;
          setMuted(true);
          saveMuteState(true);
          void candidate.video.play().catch(() => {});
        });
      };

      void resolveCandidateUrl(candidate).then((url) => {
        if (
          activeCandidateRef.current !== candidate ||
          disabledRef.current ||
          document.visibilityState === "hidden"
        ) {
          return;
        }

        if (candidate.access === "public") {
          for (const nextVideo of candidate.prefetchNextVideos?.slice(0, 2) ?? []) {
            if (nextVideo.access !== "public") continue;
            void resolveMediaUrl(nextVideo.mediaUrl)
              .then((nextUrl) => {
                if (
                  nextUrl &&
                  activeCandidateRef.current === candidate &&
                  !disabledRef.current
                ) {
                  prefetchVideo(nextUrl);
                }
              })
              .catch(() => {});
          }
        }

        if (isHlsUrl(url) && Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true });
          hlsRef.current = hls;
          hls.on(Hls.Events.MANIFEST_PARSED, playCandidate);
          hls.loadSource(url);
          hls.attachMedia(candidate.video);
        } else {
          candidate.video.src = url;
          candidate.video.load();
          playCandidate();
        }
      });
    },
    [releaseActiveVideo],
  );

  reconcileRef.current = () => {
    if (disabledRef.current || document.visibilityState === "hidden") {
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
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const candidate = candidateByElementRef.current.get(entry.target);
          if (!candidate) continue;
          candidate.ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
          if (candidate.ratio >= WARM_VISIBILITY_RATIO) {
            void resolveCandidateUrl(candidate);
          }
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
        threshold: [WARM_VISIBILITY_RATIO, NORMAL_VISIBILITY_RATIO, TRAY_VISIBILITY_RATIO],
      },
    );
    observerRef.current = observer;
    for (const candidate of candidatesRef.current.values()) observer.observe(candidate.element);

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") clearActiveCandidate();
      else reconcileRef.current();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer.disconnect();
      observerRef.current = null;
      releaseActiveVideo(activeCandidateRef.current);
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
}: {
  video: LongVideo;
  candidateId: string;
  prefetchNextVideos?: Array<Pick<LongVideo, "mediaUrl" | "access">>;
  className?: string;
  onOpen: () => void;
}) {
  const { activeCandidateId, muted, registerCandidate } = useFeedVideoAutoplay();
  const previewRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [posterUrl, setPosterUrl] = useState(VIDEO_POSTER_FALLBACK);
  const [videoReady, setVideoReady] = useState(false);
  const active = activeCandidateId === candidateId;
  const onPosterResolved = useCallback((url: string) => {
    setPosterUrl(url || VIDEO_POSTER_FALLBACK);
  }, []);

  useEffect(() => {
    const element = previewRef.current;
    const player = videoRef.current;
    if (!element || !player || !video.mediaUrl) return;

    return registerCandidate({
      candidateId,
      videoId: video.id,
      element,
      video: player,
      url: video.mediaUrl,
      access: video.access,
      prefetchNextVideos,
      minimumRatio: NORMAL_VISIBILITY_RATIO,
    });
  }, [
    candidateId,
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
      data-testid={`feed-autoplay-preview-${video.id}`}
    >
      <VideoPoster
        thumbnailUrl={video.thumbnailUrl}
        mediaUrl={video.mediaUrl}
        alt={video.title}
        loading="lazy"
        bucket="videos"
        posterOnly
        showPlayFallback={false}
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
        }}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-150",
          active && videoReady ? "opacity-100" : "opacity-0",
          active && videoReady
            ? "[transform:translate3d(0,0,0)] [backface-visibility:hidden] [will-change:transform]"
            : "",
        )}
      />
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
      >
      </button>
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