import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Download,
  Music2,
  Volume2,
  Lock,
  MoreVertical,
  EyeOff,
  UserX,
  Flag,
  VolumeX,
  Star,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { YwAvatar } from "@/components/yw/Avatar";
import { ShareSheet } from "@/components/yw/ShareSheet";
import { CommentsSheet } from "@/components/yw/CommentsSheet";
import { formatCount, type Reel, type User } from "@/lib/yw-data";
import { getLocalMedia, resolveMediaUrl, timeAgo, useSocialPosts } from "@/lib/social-data";
import { useDoubleTapLike, useYw } from "@/lib/yw-store";
import {
  downloadVideoInBackground,
  downloadVideoAtQuality,
  downloadAudioOnly,
  downloadWithWatermark,
  sanitizeDownloadName,
} from "@/lib/yw-download";
import { cn } from "@/lib/utils";
import { SportsIdentityMark } from "@/components/yw/SportsIdentityBadge";
import { toast } from "sonner";
import { DownloadSheet, type DownloadChoice } from "@/components/yw/DownloadSheet";
import { isVideoQualityTier, qualityTierFromDimensions } from "@/lib/video-quality";
import { trackEvent } from "@/lib/analytics";
import { deleteMyPost } from "@/lib/profile-data";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ReelsSearch = {
  reelId?: string;
  userId?: string;
  initialVideoId?: string;
  focusComments?: boolean;
  returnTo?: "profile" | "public";
};

export const Route = createFileRoute("/reels")({
  validateSearch: (search: Record<string, unknown>): ReelsSearch => {
    const reelId = typeof search.reelId === "string" ? search.reelId.trim() : "";
    const userId = typeof search.userId === "string" ? search.userId.trim() : "";
    const initialVideoId =
      typeof search.initialVideoId === "string" ? search.initialVideoId.trim() : "";
    const focusComments = search.focusComments === true || search.focusComments === "true";
    const returnTo = search.returnTo === "profile" || search.returnTo === "public"
      ? search.returnTo
      : undefined;
    return {
      reelId: reelId || undefined,
      userId: userId || undefined,
      initialVideoId: initialVideoId || undefined,
      focusComments,
      returnTo,
    };
  },
  head: () => ({
    meta: [
      { title: "Reels — YourWorld" },
      {
        name: "description",
        content:
          "Full-screen vertical reels you swipe through: like, comment, share, save and download when the creator allows it.",
      },
      { property: "og:title", content: "Reels — YourWorld" },
      {
        property: "og:description",
        content: "Swipe through full-screen vertical reels on YourWorld.",
      },
    ],
  }),
  component: ReelsPage,
});

function ReelsPage() {
  return (
    <main
      id="yw-reels-scroller"
      className="no-scrollbar h-[calc(100dvh-4.75rem)] snap-y snap-mandatory overflow-y-scroll overscroll-y-contain bg-background [-webkit-overflow-scrolling:touch] [scroll-snap-stop:always] [scroll-behavior:smooth]"
      aria-label="Reels"
    >
      <ReelsList />
    </main>
  );
}

function ReelsList() {
  const { reelId, userId, initialVideoId, focusComments, returnTo } = Route.useSearch();
  const navigate = useNavigate();
  const scoped = Boolean(userId);
  const initialId = initialVideoId || reelId;
  const [active, setActive] = useState(0);
  const nodes = useRef<(HTMLElement | null)[]>([]);
  const {
    posts: dbReels,
    toggleLike: toggleDbLike,
    countView,
    currentUserId,
    removePost,
    loading,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
  } = useSocialPosts(scoped ? "creator-media" : "reel", userId);
  const viewedRef = useRef(new Set<string>());
  const recordView = useCallback(async (id: string) => {
    if (viewedRef.current.has(id) || !currentUserId) return false;
    const counted = await countView(id);
    if (counted) viewedRef.current.add(id);
    return counted;
  }, [countView, currentUserId]);

  const handleBack = useCallback(() => {
    if (!scoped) return;
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    if (returnTo === "profile") {
      void navigate({ to: "/profile" });
    } else if (userId) {
      void navigate({ to: "/u/$userId", params: { userId } });
    } else {
      void navigate({ to: "/" });
    }
  }, [navigate, returnTo, scoped, userId]);

  const live = dbReels.map((p) => ({
    reel: {
      id: p.id,
      userId: p.user_id,
      poster: p.media_url,
      caption: p.caption,
      hashtags: p.hashtags ?? [],
      audio: p.audio ?? "original audio",
      likes: p.likeCount,
       views: Number(p.views ?? p.views_count ?? 0),
      commentCount: p.commentCount,
      shares: 0,
      allowDownload: p.allow_download,
      originalWidth: (p as typeof p & { original_width?: number | null }).original_width,
      originalHeight: (p as typeof p & { original_height?: number | null }).original_height,
      sourceQualityTier: (() => {
        const row = p as typeof p & {
          original_width?: number | null;
          original_height?: number | null;
          source_quality_tier?: string | null;
        };
        return isVideoQualityTier(row.source_quality_tier)
          ? row.source_quality_tier
          : qualityTierFromDimensions(row.original_width, row.original_height);
      })(),
      durationSeconds: p.duration_seconds,
      createdAt: p.created_at,
    } satisfies Reel,
    author: p.author,
    likedByMe: p.likedByMe,
    mediaUrl: p.media_url,
    mediaType: p.media_type,
    mediaBucket: (p.kind === "reel" ? "reels" : "videos") as "reels" | "videos",
      thumbnailUrl: p.thumbnail_url ?? null,
  }));

  const items = live;

  useEffect(() => {
    if (!initialId || loading) return;
    const targetIndex = dbReels.findIndex((reel) => reel.id === initialId);
    if (targetIndex < 0) return;
    setActive(targetIndex);
    requestAnimationFrame(() => {
      nodes.current[targetIndex]?.scrollIntoView({ block: "start", behavior: "auto" });
    });
  }, [dbReels, initialId, loading]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        let best: { i: number; ratio: number } | null = null;
        for (const e of entries) {
          const i = Number((e.target as HTMLElement).dataset.index);
          if (!best || e.intersectionRatio > best.ratio) best = { i, ratio: e.intersectionRatio };
        }
        if (best && best.ratio > 0.5) setActive(best.i);
      },
      { threshold: [0, 0.5, 0.75, 1] },
    );
    nodes.current.forEach((n) => n && io.observe(n));
    return () => io.disconnect();
  }, [items.length]);

  useEffect(() => {
    const scroller = document.getElementById("yw-reels-scroller");
    if (!scroller || !hasNextPage || isFetchingNextPage) return;
    const onScroll = () => {
      if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - scroller.clientHeight * 2) {
        void loadMore();
      }
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [hasNextPage, isFetchingNextPage, loadMore]);

  if (loading) {
    return (
      <div className="grid h-full min-h-[calc(100dvh-4.75rem)] place-items-center px-6 text-center text-sm text-muted-foreground">
        Loading reels…
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="grid h-full min-h-[calc(100dvh-4.75rem)] place-items-center px-6 text-center text-sm text-muted-foreground">
        No reels yet.
      </div>
    );
  }

  if (initialId && !items.some(({ reel }) => reel.id === initialId)) {
    return (
      <div className="grid h-full min-h-[calc(100dvh-4.75rem)] place-items-center px-6 text-center text-sm text-muted-foreground">
        This reel is no longer available.
      </div>
    );
  }

  return (
    <>
      {items.map(({ reel, author, likedByMe, mediaUrl, mediaType, mediaBucket, thumbnailUrl }, i) => (
        <section
          key={reel.id}
          data-index={i}
          ref={(el) => {
            nodes.current[i] = el;
          }}
          className="relative h-[calc(100dvh-4.75rem)] w-full snap-start snap-always overflow-hidden [contain:layout_paint_size] [content-visibility:auto]"
        >
          {/* window: only current, 1 previous and 1 next are mounted */}
          {Math.abs(i - active) <= 1 ? (
            <ReelItem
              reel={reel}
              active={i === active}
              author={author}
              likedByMe={likedByMe}
              mediaUrl={mediaUrl}
              mediaType={mediaType}
              mediaBucket={mediaBucket}
              thumbnailUrl={thumbnailUrl}
              scoped={scoped}
              onBack={handleBack}
              commentsDisabled={!!dbReels[i]?.comments_off}
              initialCommentsOpen={focusComments && reel.id === initialId && i === active}
              onDbLike={() => toggleDbLike(reel.id)}
              onView={() => recordView(reel.id)}
               canDelete={currentUserId === reel.userId}
               onDeleted={() => removePost(reel.id)}
            />
          ) : null}
        </section>
      ))}
    </>
  );
}

const REEL_DURATION = 15;

function formatTime(value: number) {
  const totalSeconds = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Renders reel media with graceful recovery: if the stored URL fails to load
 * (expired signed URL, missing public URL) we retry with a freshly resolved
 * Supabase URL, then with a local blob URL from this session, then fall back
 * to an image.
 */
function ReelMedia({
  url,
  type,
  alt,
  posterUrl,
  active,
  mediaRef,
  paused = false,
  onLoadedMetadata,
  onTimeUpdate,
  onEnded,
  onSoundBlocked,
  onSoundReady,
  bucket = "reels",
}: {
  url: string;
  type: string;
  alt: string;
  posterUrl?: string | null;
  active: boolean;
  mediaRef: React.MutableRefObject<HTMLElement | null>;
  paused?: boolean;
  onLoadedMetadata?: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
  onTimeUpdate?: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
  onEnded?: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
  onSoundBlocked?: () => void;
  onSoundReady?: () => void;
  bucket?: "reels" | "videos";
}) {
  const [src, setSrc] = useState(url);
  const [asImage, setAsImage] = useState(!type.startsWith("video"));
  const [posterSrc, setPosterSrc] = useState<string | null>(null);
  const tried = useRef<Set<string>>(new Set());
  const retryGeneration = useRef(0);

  useEffect(() => {
    retryGeneration.current += 1;
    tried.current = new Set();
    setSrc(url);
    setAsImage(!type.startsWith("video"));
  }, [url, type]);

  useEffect(() => {
    if (!posterUrl) {
      setPosterSrc(null);
      return;
    }
    let alive = true;
    void resolveMediaUrl(posterUrl, "videos").then((resolved) => {
      if (alive) setPosterSrc(resolved || posterUrl);
    });
    return () => {
      alive = false;
    };
  }, [posterUrl]);

  const handleError = useCallback(() => {
    tried.current.add(src);
    const generation = retryGeneration.current;
    void (async () => {
      const local = getLocalMedia(url);
      if (local && !tried.current.has(local)) {
        if (generation !== retryGeneration.current) return;
        setSrc(local);
        return;
      }
      try {
        const resolved = await resolveMediaUrl(url, bucket);
        if (generation !== retryGeneration.current) return;
        if (resolved && !tried.current.has(resolved)) {
          setSrc(resolved);
          return;
        }
      } catch (error) {
        if (generation === retryGeneration.current) {
          console.error("[ReelsMedia] unable to resolve fallback media", error);
        }
      }
      if (generation === retryGeneration.current) {
        setAsImage(true);
      }
    })();
  }, [bucket, src, url]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const forceSound = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || asImage) return;
    forceSound();
    v.volume = 1;
  }, [asImage, forceSound, src]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || asImage) return;
    if (active && !paused) {
      forceSound();
      void v.play()
        .then(() => onSoundReady?.())
        .catch(() => onSoundBlocked?.());
    } else {
      v.pause();
    }
  }, [active, asImage, forceSound, onSoundBlocked, onSoundReady, paused, src]);

  const className = cn(
    "h-full w-full object-cover will-change-transform [backface-visibility:hidden]",
    active && asImage && "animate-kenburns",
    paused && "[animation-play-state:paused]",
  );

  if (!active && !asImage) {
    if (posterSrc) {
      return (
        <img
          ref={(el) => {
            mediaRef.current = el;
          }}
          src={posterSrc}
          alt={alt}
          decoding="async"
          loading="lazy"
          className={className}
        />
      );
    }
    return (
      <div
        ref={(el) => {
          mediaRef.current = el;
        }}
        aria-label={alt}
        className="h-full w-full bg-zinc-950"
      />
    );
  }

  if (asImage) {
    return (
      <img
        ref={(el) => {
          mediaRef.current = el;
        }}
        src={src}
        alt={alt}
        decoding="async"
        loading={active ? "eager" : "lazy"}
        onError={handleError}
        className={className}
      />
    );
  }

  return (
    <video
      ref={(el) => {
        videoRef.current = el;
        mediaRef.current = el;
      }}
      src={src}
      poster={posterSrc ?? undefined}
      playsInline
      preload={active ? "metadata" : "none"}
      onError={handleError}
      onPlay={() => {
        forceSound();
        onSoundReady?.();
      }}
      onLoadedMetadata={onLoadedMetadata}
      onTimeUpdate={onTimeUpdate}
      onEnded={onEnded}
      className={className}
    />
  );
}

function ReelItem({
  reel,
  active,
  author,
  likedByMe,
  mediaUrl,
  mediaType,
  mediaBucket,
  thumbnailUrl,
  scoped = false,
  onBack,
  commentsDisabled = false,
  initialCommentsOpen = false,
  onDbLike,
  onView,
  canDelete = false,
  onDeleted,
}: {
  reel: Reel;
  active: boolean;
  author?: User;
  likedByMe?: boolean;
  mediaUrl?: string;
  mediaType?: string;
  mediaBucket?: "reels" | "videos";
  thumbnailUrl?: string | null;
  scoped?: boolean;
  onBack?: () => void;
  commentsDisabled?: boolean;
  initialCommentsOpen?: boolean;
  onDbLike?: () => void | Promise<unknown>;
  onView?: () => void | Promise<unknown>;
  canDelete?: boolean;
  onDeleted?: () => void;
}) {
  const user = author;
  const { saved, following, toggleSave, toggleFollow } = useYw();
  const { burst, onDoubleTap } = useDoubleTapLike(reel.id);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const lastTap = useRef(0);
  const isLiked = !!likedByMe;
  const isSaved = !!saved[reel.id];
  const [liking, setLiking] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ---- playback timeline -------------------------------------------------
  const [progress, setProgress] = useState(0); // 0..100
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  // Single tap toggles pause/play; press-and-hold keeps it paused.
  const [held, setHeld] = useState(false);
  const [tappedPause, setTappedPause] = useState(false);
  const paused = held || tappedPause;
  const barRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLElement | null>(null);
  const seekRaf = useRef<number | null>(null);
  const pendingSeek = useRef<number | null>(null);
  const playedSeconds = useRef(0);
  const lastPlaybackTime = useRef<number | null>(null);
  const viewRecorded = useRef(false);

  useEffect(() => {
    playedSeconds.current = 0;
    lastPlaybackTime.current = null;
    viewRecorded.current = false;
  }, [reel.id]);

  useEffect(() => () => {
    if (seekRaf.current !== null) cancelAnimationFrame(seekRaf.current);
  }, []);

  const handleLoadedMetadata = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    setCurrentTime(Number.isFinite(video.currentTime) ? video.currentTime : 0);
    setDuration(Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0);
  }, []);

  const handleTimeUpdate = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const nextTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    setCurrentTime(nextTime);
    if (video.duration && Number.isFinite(video.duration)) {
      setDuration(video.duration);
      setProgress(Math.min(100, Math.max(0, (nextTime / video.duration) * 100)));
    }
    const previous = lastPlaybackTime.current;
    lastPlaybackTime.current = nextTime;
    const delta = previous === null ? 0 : nextTime - previous;
    if (active && !viewRecorded.current && delta > 0 && delta <= 2) {
      playedSeconds.current += delta;
      if (playedSeconds.current >= 3 && onView) {
        viewRecorded.current = true;
        void Promise.resolve(onView()).then((result) => {
          if (result === false) viewRecorded.current = false;
        }).catch(() => {
          viewRecorded.current = false;
        });
      }
    }
  }, [active, onView]);

  const handleEnded = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    setCurrentTime(0);
    setProgress(0);
    if (!active) return;
    video.currentTime = 0;
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
    void video.play()
      .then(() => setSoundBlocked(false))
      .catch(() => setSoundBlocked(true));
  }, [active]);

  const seekFromEvent = useCallback((clientX: number) => {
    const el = barRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nextProgress = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    setProgress(nextProgress * 100);
    pendingSeek.current = nextProgress;
    if (seekRaf.current !== null) return;
    seekRaf.current = requestAnimationFrame(() => {
      seekRaf.current = null;
      const video = mediaRef.current instanceof HTMLVideoElement ? mediaRef.current : null;
      const target = pendingSeek.current;
      pendingSeek.current = null;
      if (video && target !== null && Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = target * video.duration;
      }
    });
  }, [mediaRef]);

  const onBarPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setScrubbing(true);
    seekFromEvent(e.clientX);
  };
  const onBarPointerMove = (e: React.PointerEvent) => {
    if (!scrubbing) return;
    e.stopPropagation();
    seekFromEvent(e.clientX);
  };
  const endScrub = () => setScrubbing(false);

  // ---- pinch to zoom -----------------------------------------------------
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef({ dist: 0, scale: 1 });
  const transform = useRef({ scale: 1, x: 0, y: 0 });

  const applyTransform = () => {
    const el = mediaRef.current;
    if (!el) return;
    const { scale, x, y } = transform.current;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  };

  // ---- press & hold to pause --------------------------------------------
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdStart = useRef({ x: 0, y: 0 });
  const heldRef = useRef(false);

  const cancelHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (heldRef.current) {
      heldRef.current = false;
      setHeld(false);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      holdStart.current = { x: e.clientX, y: e.clientY };
      if (holdTimer.current) clearTimeout(holdTimer.current);
      holdTimer.current = setTimeout(() => {
        heldRef.current = true;
        setHeld(true);
      }, 200);
    }
    if (pointers.current.size === 2) {
      cancelHold();
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        scale: transform.current.scale,
      };
      const el = mediaRef.current;
      if (el) el.style.transition = "none";
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1 && !heldRef.current) {
      // Finger drifted → it's a scroll, not a hold.
      const dx = e.clientX - holdStart.current.x;
      const dy = e.clientY - holdStart.current.y;
      if (Math.hypot(dx, dy) > 12) cancelHold();
    }
    if (pointers.current.size !== 2) return;
    e.preventDefault();
    const [a, b] = [...pointers.current.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    const scale = Math.min(4, Math.max(1, (dist / pinchStart.current.dist) * pinchStart.current.scale));
    transform.current.scale = scale;
    applyTransform();
  };

  const releasePointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    cancelHold();
    if (pointers.current.size < 2 && transform.current.scale !== 1) {
      transform.current = { scale: 1, x: 0, y: 0 };
      const el = mediaRef.current;
      if (el) el.style.transition = "transform 260ms cubic-bezier(.22,1,.36,1)";
      applyTransform();
    }
  };

  useEffect(() => () => cancelHold(), []);

  const handleTap = () => {
    if (soundBlocked) {
      enableAudio();
      return;
    }
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onDoubleTap();
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
    // single tap toggles pause/play
    setTappedPause((v) => !v);
  };

  const enableAudio = useCallback(() => {
    const video = mediaRef.current instanceof HTMLVideoElement ? mediaRef.current : null;
    if (!video) return;
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
    setMuted(false);
    setSoundBlocked(false);
    if (active && !paused) {
      void video.play()
        .then(() => trackEvent("reel_sound_enabled", { surface: "reels_feed" }))
        .catch(() => setSoundBlocked(true));
    } else {
      trackEvent("reel_sound_enabled", { surface: "reels_feed" });
    }
  }, [active, mediaRef, paused]);

  const toggleAudio = () => {
    const video = mediaRef.current instanceof HTMLVideoElement ? mediaRef.current : null;
    if (!muted) {
      if (video) video.muted = true;
      setMuted(true);
      return;
    }
    enableAudio();
  };

  const handleSoundBlocked = useCallback(() => {
    setSoundBlocked(true);
  }, []);

  const handleSoundReady = useCallback(() => {
    setSoundBlocked(false);
  }, []);

  const handleTapForSound = (event: React.MouseEvent) => {
    event.stopPropagation();
    enableAudio();
  };

  const handleDownload = async (choice?: DownloadChoice) => {
    if (!user) return;
    const isVideo = mediaType?.startsWith("video") && Boolean(mediaUrl);
    if (isVideo && !choice) {
      setDownloadOpen(true);
      return;
    }
    const source = mediaUrl ?? reel.poster;
    const toastId = toast.loading(
      isVideo && choice === "mp3" ? "Preparing MP3 audio… 0%" :
      isVideo ? `Downloading ${choice} video… 0%` :
      "Preparing image download…",
    );
    try {
      if (isVideo) {
        const playableUrl = getLocalMedia(source) ?? await resolveMediaUrl(source);
        const baseName = sanitizeDownloadName(reel.caption, `yw-reel-${reel.id}`);
        if (choice === "mp3") {
          await downloadAudioOnly(playableUrl, baseName, (percent) =>
            toast.loading(`Preparing MP3 audio... ${percent}%`, { id: toastId }),
          );
        } else if (choice === "original" || choice === reel.sourceQualityTier) {
          await downloadVideoInBackground(
            playableUrl,
            `${baseName}.mp4`,
            (percent) => toast.loading(`Downloading ${choice} video... ${percent}%`, { id: toastId }),
          );
        } else if (choice) {
          await downloadVideoAtQuality(playableUrl, baseName, choice, (percent) =>
            toast.loading(`Creating ${choice} video... ${percent}%`, { id: toastId }),
          );
        }
        trackEvent("reel_downloaded", {
          surface: "reels_feed",
          media_type: "video",
          download_type: choice === "mp3" ? "audio" : choice || "original",
        });
        toast.success("Saved to your device", { id: toastId });
      } else {
        await downloadWithWatermark(reel.poster, user.username, `yw-reel-${reel.id}.jpg`);
        trackEvent("reel_downloaded", {
          surface: "reels_feed",
          media_type: "image",
          download_type: "watermarked_image",
        });
        toast.success("Downloaded in original quality with YW watermark", { id: toastId });
      }
    } catch {
      toast.error("Download failed", { id: toastId });
    }
  };

  const handleLike = async () => {
    if (!onDbLike || liking) return;
    setLiking(true);
    try {
      await onDbLike();
      trackEvent("reel_like_toggled", {
        surface: "reels_feed",
        liked: !isLiked,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update like");
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteMyPost({
        id: reel.id,
        user_id: reel.userId,
        media_url: mediaUrl ?? reel.poster,
        thumbnail_url: thumbnailUrl,
        kind: mediaBucket === "reels" ? "reel" : "video",
      });
      setDeleteOpen(false);
      onDeleted?.();
      toast.success("Deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't delete this media");
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = () => {
    toggleSave(reel.id);
    trackEvent("reel_save_toggled", {
      surface: "reels_feed",
      saved: !isSaved,
    });
  };

  if (!user) return null;

  return (
    <>
      <div
        className="absolute inset-0 touch-pan-y select-none overflow-hidden"
        onClick={handleTap}
        onDoubleClick={onDoubleTap}
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={releasePointer}
        onPointerCancel={releasePointer}
        onPointerLeave={releasePointer}
      >
        <ReelMedia
          url={mediaUrl ?? reel.poster}
          type={mediaType ?? "image"}
          alt={reel.caption}
          posterUrl={thumbnailUrl}
          bucket={mediaBucket}
          active={active}
          mediaRef={mediaRef}
          paused={paused}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onSoundBlocked={handleSoundBlocked}
          onSoundReady={handleSoundReady}
        />
        {soundBlocked && active ? (
          <button
            type="button"
            onClick={handleTapForSound}
            className="pointer-events-auto absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/75 px-4 py-2.5 text-xs font-semibold text-white shadow-xl backdrop-blur-md"
          >
            Tap anywhere for sound
          </button>
        ) : null}
        <div className="pointer-events-none absolute inset-0 veil" />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 transition-opacity duration-200",
            paused ? "bg-black/20 opacity-100" : "opacity-0",
          )}
        />
        {tappedPause && !held && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <svg viewBox="0 0 24 24" className="h-16 w-16 text-white/90 drop-shadow-lg" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
      </div>


      {burst && (
        <Heart className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 animate-burst fill-primary text-primary" />
      )}

      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4">
        <div className="flex min-w-0 items-center gap-2">
          {scoped && onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/70 text-white shadow-lg"
              aria-label="Back to creator profile"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : null}
          <h1 className="truncate font-display text-lg font-bold drop-shadow">
            {scoped ? "Creator videos" : "Reels"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
             onClick={toggleAudio}
            className="grid h-8 w-8 place-items-center rounded-full bg-background/40 backdrop-blur"
            aria-label={muted ? "Turn sound on" : "Mute reel"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <span className="rounded-full bg-background/40 px-3 py-1 text-xs backdrop-blur">
            Following
          </span>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-16 space-y-2 px-4">
        <div className="flex items-center gap-2.5">
          <Link
            to="/u/$userId"
            params={{ userId: reel.userId }}
            className="flex min-w-0 items-center gap-2.5 transition-opacity active:opacity-70"
          >
            <YwAvatar user={user} size={36} className="ring-2 ring-foreground/30" />
               <span className="flex min-w-0 items-center gap-1 truncate text-sm font-semibold drop-shadow">
               @{user.username}
                <SportsIdentityMark userId={reel.userId} />
               <span className="ml-2 text-xs font-normal text-gray-300">
                 • {reel.createdAt ? timeAgo(reel.createdAt) : "Just now"}
               </span>
             </span>
          </Link>
          <button
            onClick={() => toggleFollow(user.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              following[user.id]
                ? "border-border bg-background/40 text-muted-foreground"
                : "border-foreground/50",
            )}
          >
            {following[user.id] ? "Following" : "Follow"}
          </button>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="block text-left text-sm drop-shadow"
        >
          <span className={cn(!expanded && "line-clamp-1")}>{reel.caption}</span>
          <span className="text-accent"> {reel.hashtags.map((h) => `#${h}`).join(" ")}</span>
        </button>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Music2 className="h-3.5 w-3.5" /> <span className="truncate">{reel.audio}</span>
        </p>
      </div>

      <div className="absolute bottom-14 right-2 flex flex-col items-center gap-2.5">
        <Action
          onClick={() => void handleLike()}
          label={formatCount(reel.likes)}
          active={isLiked}
        >
          <Heart
            strokeWidth={1.8}
            className={cn("h-[18px] w-[18px]", isLiked && "fill-primary text-primary")}
          />
        </Action>

        <CommentsSheet
          postId={reel.id}
          commentsDisabled={commentsDisabled}
          initialOpen={initialCommentsOpen}
        >
          <Action label={formatCount(reel.commentCount)}>
            <MessageCircle strokeWidth={1.8} className="h-[18px] w-[18px]" />
          </Action>
        </CommentsSheet>

        <Action onClick={handleSave} label="Save" active={isSaved}>
          <Bookmark
            strokeWidth={1.8}
            className={cn("h-[18px] w-[18px]", isSaved && "fill-foreground")}
          />
        </Action>

        {reel.allowDownload ? (
          <Action onClick={handleDownload} label="Download">
            <Download strokeWidth={1.8} className="h-[18px] w-[18px]" />
          </Action>
        ) : (
          <Action
            onClick={() => toast("The creator turned downloads off for this reel")}
            label="Off"
          >
            <Lock strokeWidth={1.8} className="h-[17px] w-[17px] text-muted-foreground" />
          </Action>
        )}

        <ShareSheet
          title={reel.caption}
          media={mediaUrl ?? reel.poster}
          mediaKind={mediaType === "video" ? "video" : "photo"}
        >
          <Action label={formatCount(reel.shares)}>
            <Send strokeWidth={1.8} className="h-[18px] w-[18px]" />
          </Action>
        </ShareSheet>

        <div className="relative">
          <Action onClick={() => setMenuOpen((v) => !v)} label="More">
            <MoreVertical strokeWidth={1.8} className="h-[18px] w-[18px]" />
          </Action>
        </div>
      </div>


      {menuOpen && (
        <>
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 z-40 cursor-default bg-background/30 backdrop-blur-[2px]"
          />
          <div
            role="menu"
            className="absolute bottom-16 right-3 z-50 w-56 overflow-hidden rounded-2xl border border-border/60 bg-background/85 shadow-2xl backdrop-blur-xl animate-rise"
          >
            {[
              { icon: EyeOff, label: "Not Interested" },
              { icon: UserX, label: "Don't Recommend Creator" },
              { icon: Flag, label: "Report" },
              { icon: VolumeX, label: "Mute Creator" },
              { icon: Star, label: "Add to Favorites" },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  toast(label);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-medium transition-colors hover:bg-foreground/10"
              >
                <Icon strokeWidth={1.6} className="h-[17px] w-[17px] text-muted-foreground" />
                {label}
              </button>
            ))}
            {canDelete ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setDeleteOpen(true);
                }}
                className="flex w-full items-center gap-3 border-t border-border/50 px-4 py-3 text-left text-[13px] font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 strokeWidth={1.6} className="h-[17px] w-[17px]" />
                Delete
              </button>
            ) : null}
          </div>
        </>
      )}

      {/* timeline / scrubber */}
      <div
        ref={barRef}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={100}
             aria-valuenow={Math.round(progress)}
        tabIndex={0}
        onPointerDown={onBarPointerDown}
        onPointerMove={onBarPointerMove}
        onPointerUp={endScrub}
        onPointerCancel={endScrub}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 flex touch-none cursor-pointer items-end px-3 pb-3 pt-6"
      >
        <div className="relative w-full">
          <span className="pointer-events-none absolute bottom-2 right-0 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white/90">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <div
            className={cn(
              "w-full overflow-hidden rounded-full bg-foreground/20 transition-all duration-200",
              scrubbing ? "h-1.5" : "h-[3px]",
            )}
          >
            <div
               className={cn(
                  "h-full rounded-full bg-pink-500 transition-[width] duration-100 ease-linear",
                 scrubbing && "transition-none",
               )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span
            className={cn(
              "pointer-events-none absolute top-1/2 -ml-[7px] h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-foreground shadow-lg transition-transform duration-200",
              scrubbing ? "scale-100" : "scale-0",
            )}
             style={{ left: `${progress}%` }}
          />
        </div>
      </div>
      <DownloadSheet
        open={downloadOpen}
        onOpenChange={setDownloadOpen}
        title={reel.caption || "YourWorld reel"}
        durationSeconds={reel.durationSeconds ?? REEL_DURATION}
        sourceQualityTier={reel.sourceQualityTier ?? null}
        sourceMediaUrl={mediaUrl}
        onDownload={handleDownload}
      />
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!deleting) setDeleteOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {mediaBucket === "reels" ? "reel" : "video"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the media and its stored files. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Action({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-11 flex-col items-center gap-1 text-foreground transition-transform duration-150 active:scale-90",
        active && "animate-pop",
      )}
    >
      <span
        className={cn(
          "grid h-9 w-9 place-items-center rounded-full border border-foreground/15 bg-background/25 shadow-[0_6px_20px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors group-hover:bg-background/40",
          active && "border-primary/40 bg-primary/15",
        )}
      >
        {children}
      </span>
      <span className="w-full truncate text-[8px] font-semibold tracking-wide text-foreground/85 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
        {label}
      </span>
    </button>

  );
}
