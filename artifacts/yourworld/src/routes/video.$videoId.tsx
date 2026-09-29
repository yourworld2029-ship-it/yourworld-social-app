import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  Heart,
  LockKeyhole,
  MessageCircle,
  Reply,
  Send,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoPoster } from "@/components/yw/VideoPoster";
import { useAuth, useResumeAuthAction } from "@/lib/auth-store";
import { useYw } from "@/lib/yw-store";
import { formatDuration, formatViews } from "@/lib/video-data";
import { resolveLongVideoUrl } from "@/lib/video-data";
import { resolveMediaUrl, usePostComments } from "@/lib/social-data";
import { registerUniqueView } from "@/lib/unique-views";
import { supabase } from "@/integrations/supabase/client";
import {
  isNextSeriesEpisode,
  isPublishedLongVideoRow,
  sortSeriesEpisodes,
} from "@/lib/long-video-utils";
import { DownloadSheet, type DownloadChoice } from "@/components/yw/DownloadSheet";
import { ShareSheet } from "@/components/yw/ShareSheet";
import {
  downloadAudioOnly,
  downloadWatermarkedVideoInBackground,
  sanitizeDownloadName,
} from "@/lib/yw-download";
import { qualityTierFromMetadata, type VideoQualityTier } from "@/lib/video-quality";
import {
  useVideoPlayback,
  VideoPlaybackSlot,
  type QualityUrls,
} from "@/lib/video-playback";
import { buildWatchShareUrl } from "@/lib/watch-links";
import {
  consumeVideoResumeRequest,
  getVideoResumeEntry,
  removeVideoResumeEntry,
  saveVideoResumeEntry,
} from "@/lib/video-resume";

type VideoUser = {
  id?: string;
  username?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

type Video = {
  id: string;
  user_id?: string | null;
  media_url?: string | null;
  video_url?: string | null;
  url?: string | null;
  title?: string | null;
  caption?: string | null;
  created_at?: string | null;
  duration_seconds?: number | null;
  kind?: string | null;
  media_type?: string | null;
  thumbnail_url?: string | null;
  views_count?: number | null;
  views?: number | null;
  likes_count?: number | null;
  like_count?: number | null;
  likes?: number | null;
  price?: number | null;
  video_access?: string | null;
  is_paid?: boolean | null;
  source_quality_tier?: string | null;
  original_width?: number | null;
  original_height?: number | null;
  series_title?: string | null;
  episode_number?: string | null;
  status?: string | null;
  review_status?: string | null;
  scheduled_at?: string | null;
  archived?: boolean | null;
  quality_urls?: QualityUrls | null;
  qualityUrls?: QualityUrls | null;
  user?: VideoUser | null;
  sourceQualityTier?: VideoQualityTier | null;
};

type RecommendedVideo = Video & {
  thumbnail_url?: string | null;
  duration_seconds?: number | null;
};

type RelatedVideoPage = {
  videos: RecommendedVideo[];
  nextOffset: number | null;
};

const RELATED_VIDEO_PAGE_SIZE = 12;

export const Route = createFileRoute("/video/$videoId")({
  validateSearch: (search: Record<string, unknown>): { focusComments?: boolean } => ({
    focusComments: search.focusComments === true || search.focusComments === "true",
  }),
  component: VideoWatchPage,
  errorComponent: () => <VideoErrorFallback />,
  notFoundComponent: () => <VideoErrorFallback />,
});

function VideoErrorFallback() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black p-6 text-center text-white">
      <AlertCircle className="h-12 w-12 text-pink-500" />
      <h2 className="text-xl font-bold">Video not available</h2>
      <p className="max-w-xs text-sm text-gray-400">
        This video could not be loaded or was removed.
      </p>
      <Button
        onClick={() =>
          window.history.length > 1
            ? window.history.back()
            : void navigate({ to: "/" })
        }
        className="mt-2 rounded-full bg-pink-600 px-6 py-2 text-white hover:bg-pink-700"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
      </Button>
    </div>
  );
}

function formatUnlockPrice(value: number) {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value)
    ? value.toLocaleString("en-IN")
    : value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function LockedVideoPlayer({
  video,
  mediaUrl,
  price,
  access,
  checkingAccess,
  onUnlock,
}: {
  video: Video;
  mediaUrl: string;
  price: number;
  access: "paid" | "vip";
  checkingAccess: boolean;
  onUnlock: () => void;
}) {
  const isPaid = access === "paid";
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-950">
      <VideoPoster
        thumbnailUrl={video.thumbnail_url}
        mediaUrl={mediaUrl}
        alt={video.title || video.caption || "Locked video"}
        loading="eager"
        bucket="videos"
        className="absolute inset-0 opacity-45"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 px-6 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm">
          <LockKeyhole className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-white">
            {checkingAccess
              ? "Checking access…"
              : isPaid
                ? "This video is locked"
                : "Subscribers-only video"}
          </p>
          <p className="mt-1 text-xs text-white/70">
            {checkingAccess
              ? "Please wait a moment."
              : isPaid
                ? "Unlock it to watch the full video."
                : "Follow this creator to watch this video."}
          </p>
        </div>
        {!checkingAccess && isPaid ? (
          <Button
            type="button"
            onClick={onUnlock}
            className="rounded-full bg-pink-600 px-5 text-sm font-semibold text-white hover:bg-pink-700"
          >
            Unlock &amp; Watch (₹{formatUnlockPrice(price)})
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function cleanVideoId(value: unknown) {
  if (typeof value !== "string") return "";
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // Strip invalid encoding below instead of allowing the route to throw.
  }
  return decoded
    .trim()
    .replace(/(?:\)|%29)+$/gi, "")
    .replace(/[^a-zA-Z0-9-]/g, "");
}

function safeTimeAgo(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "";
  }
}

function VideoWatchPage() {
  const params = useParams({ strict: false });
  const videoId = typeof params?.videoId === "string" ? params.videoId : "";
  if (!videoId) {
    return <VideoErrorFallback />;
  }

  const cleanId = cleanVideoId(videoId);
  if (!cleanId) {
    return <VideoErrorFallback />;
  }

  return <VideoWatchContent videoId={cleanId} />;
}

function VideoWatchContent({ videoId }: { videoId: string }) {
  const navigate = useNavigate();
  const { focusComments } = Route.useSearch();
  const { user, requestAuthAction } = useAuth();
  const { liked, following, toggleLike, toggleFollow } = useYw();
  const {
    activeVideo,
    activateVideo,
    closeVideo,
    setTimeUpdateHandler,
    setEndedHandler,
    currentTime: playerCurrentTime,
    duration: playerDuration,
    isPlaying,
    videoRef,
  } = useVideoPlayback();
  const queryClient = useQueryClient();
  const commentsRef = useRef<HTMLDivElement>(null);
  const [commentText, setCommentText] = useState("");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [, setLikeCount] = useState(0);
  const [resolvedMediaUrl, setResolvedMediaUrl] = useState<string>("");
  const playedSecondsRef = useRef(0);
  const lastVideoTimeRef = useRef<number | null>(null);
  const lastResumeSavedAtRef = useRef(0);
  const resumeRemovedRef = useRef(false);

  const {
    data: video,
    isLoading,
    isError,
  } = useQuery<Video | null>({
    queryKey: ["video-detail", videoId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("id", videoId)
          .maybeSingle();

        if (error || !data) {
          if (error) console.error("Error fetching video:", error);
          return null;
        }
        if (!isPublishedLongVideoRow(data as unknown as Record<string, unknown>)) {
          return null;
        }

        let profile: VideoUser | null = null;
        if (data.user_id) {
          try {
            const { data: profiles } = await supabase.rpc("get_public_profiles", {
              ids: [data.user_id],
            });
            profile = ((profiles ?? []) as VideoUser[])[0] ?? null;
          } catch (cause) {
            console.error("Error fetching video creator:", cause);
          }
        }

        const metadata = data as unknown as {
          source_quality_tier?: string | null;
          original_width?: number | null;
          original_height?: number | null;
          quality_urls?: QualityUrls | null;
          qualityUrls?: QualityUrls | null;
        };
        const sourceQualityTier = qualityTierFromMetadata(
          metadata.source_quality_tier,
          metadata.original_width,
          metadata.original_height,
        );

        return {
          ...(data as unknown as Video),
          sourceQualityTier,
          qualityUrls: metadata.qualityUrls ?? metadata.quality_urls ?? null,
          user: profile,
        };
      } catch (cause) {
        console.error("Error fetching video:", cause);
        return null;
      }
    },
    retry: 1,
  });

  const creatorId = video?.user_id || video?.user?.id || "";
  const subscribed = Boolean(creatorId && following[creatorId]);
  const access = video?.video_access === "paid" || video?.is_paid
    ? "paid"
    : video?.video_access === "vip"
      ? "vip"
      : "public";
  const isCreator = Boolean(user?.id && creatorId && user.id === creatorId);

  const paidGrantQuery = useQuery<boolean>({
    queryKey: ["video-access-grant", videoId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from("video_access_grants")
        .select("post_id")
        .eq("post_id", videoId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) {
        console.error("Error checking video access:", error);
        return false;
      }
      return Boolean(data);
    },
    enabled: Boolean(video && access === "paid" && user?.id && !isCreator),
  });
  const checkingAccess = Boolean(
    video &&
      access === "paid" &&
      user?.id &&
      !isCreator &&
      paidGrantQuery.isPending,
  );
  const hasPaidAccess = isCreator || Boolean(paidGrantQuery.data);
  const isLocked =
    !checkingAccess &&
    !isCreator &&
    ((access === "paid" && !hasPaidAccess) || (access === "vip" && !subscribed));

  const { data: subscriberCount = 0 } = useQuery<number>({
    queryKey: ["video-subscriber-count", creatorId],
    queryFn: async () => {
      if (!creatorId) return 0;
      try {
        const { data, error } = await supabase.rpc("get_follow_counts", {
          ids: [creatorId],
        });
        if (error) {
          console.error("Error fetching subscriber count:", error);
          return 0;
        }
        return Number((data ?? [])[0]?.followers ?? 0);
      } catch (cause) {
        console.error("Error fetching subscriber count:", cause);
        return 0;
      }
    },
    enabled: Boolean(creatorId),
  });

  const realComments = usePostComments(videoId);
  const comments = realComments.comments;
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => {
    if (!focusComments || !video || realComments.loading) return;
    setCommentsOpen(true);
    requestAnimationFrame(() => {
      commentsRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
      commentsRef.current?.focus({ preventScroll: true });
    });
  }, [focusComments, realComments.loading, video]);

  const repliesByParent = new Map<string, typeof comments>();
  comments.forEach((comment) => {
    if (!comment.parentCommentId) return;
    const replies = repliesByParent.get(comment.parentCommentId) ?? [];
    replies.push(comment);
    repliesByParent.set(comment.parentCommentId, replies);
  });
  const previewComment = comments.find((comment) => !comment.parentCommentId) ?? comments[0];

  const {
    data: relatedPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<RelatedVideoPage>({
    queryKey: ["related-videos", videoId],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = Number(pageParam);
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .neq("id", videoId)
          .order("created_at", { ascending: false })
          .range(offset, offset + RELATED_VIDEO_PAGE_SIZE - 1);
        if (error) {
          console.error("Error fetching related videos:", error);
          return { videos: [], nextOffset: null };
        }

        const rows = (data ?? []) as unknown as Record<string, unknown>[];
        const videos = rows.filter((row) => {
          const kind = String(row.kind ?? row.media_type ?? "").toLowerCase();
          return kind === "video" || (!kind && Boolean(row.duration_seconds || row.video_url));
        });
        const userIds = [...new Set(videos.map((row) => row.user_id).filter((id): id is string => typeof id === "string"))];
        let profileById = new Map<string, VideoUser>();
        if (userIds.length) {
          const { data: profiles } = await supabase.rpc("get_public_profiles", {
            ids: userIds,
          });
          profileById = new Map(
            ((profiles ?? []) as VideoUser[])
              .filter((profile): profile is VideoUser & { id: string } => Boolean(profile.id))
              .map((profile) => [profile.id, profile]),
          );
        }

        return {
          videos: videos.map((row) => ({
            ...(row as unknown as RecommendedVideo),
            id: String(row.id ?? ""),
            title: typeof row.title === "string" ? row.title : null,
            caption: typeof row.caption === "string" ? row.caption : null,
            media_url: typeof row.media_url === "string" ? row.media_url : null,
            thumbnail_url: typeof row.thumbnail_url === "string" ? row.thumbnail_url : null,
            duration_seconds: typeof row.duration_seconds === "number" ? row.duration_seconds : null,
            user:
              (typeof row.user_id === "string" && profileById.get(row.user_id)) ||
              null,
          })),
          nextOffset: rows.length === RELATED_VIDEO_PAGE_SIZE
            ? offset + RELATED_VIDEO_PAGE_SIZE
            : null,
        };
      } catch (cause) {
        console.error("Error fetching related videos:", cause);
        return { videos: [], nextOffset: null };
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
  });
  const relatedVideos = relatedPages?.pages.flatMap((page) => page.videos) ?? [];
  const relatedSentinelRef = useRef<HTMLDivElement>(null);
  const seriesTitle = video?.series_title?.trim() ?? "";
  const { data: seriesCandidates = [] } = useQuery<RecommendedVideo[]>({
    queryKey: ["video-series", seriesTitle],
    enabled: Boolean(seriesTitle),
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("kind", "video")
        .eq("series_title", seriesTitle)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) {
        console.warn("Unable to load this video's series", error);
        return [];
      }

      return ((data ?? []) as unknown as RecommendedVideo[]).filter((candidate) =>
        candidate.id !== videoId &&
        candidate.series_title?.trim() === seriesTitle &&
        isPublishedLongVideoRow(candidate as unknown as Record<string, unknown>),
      );
    },
  });
  const nextSeriesEpisodes = sortSeriesEpisodes(seriesCandidates).filter((episode) =>
    isNextSeriesEpisode(video?.episode_number, episode.episode_number),
  );
  const nextEpisode = nextSeriesEpisodes[0];
  const nextEpisodeId = nextEpisode?.id;
  const [nextEpisodeCancelled, setNextEpisodeCancelled] = useState(false);
  const nextEpisodeCancelledRef = useRef(false);

  useEffect(() => {
    nextEpisodeCancelledRef.current = false;
    setNextEpisodeCancelled(false);
  }, [videoId]);

  const playNextEpisode = useCallback(() => {
    if (!nextEpisodeId) return;
    void navigate({
      to: "/video/$videoId",
      params: { videoId: nextEpisodeId },
    });
  }, [navigate, nextEpisodeId]);

  const handleEpisodeEnded = useCallback(() => {
    if (!nextEpisodeCancelledRef.current) playNextEpisode();
  }, [playNextEpisode]);

  useEffect(() => {
    setEndedHandler(nextEpisodeId ? handleEpisodeEnded : null);
    return () => setEndedHandler(null);
  }, [handleEpisodeEnded, nextEpisodeId, setEndedHandler]);

  const countdownSeconds = playerDuration > 0
    ? Math.max(0, Math.ceil(playerDuration - playerCurrentTime))
    : 0;
  const showNextEpisodeCountdown = Boolean(
    nextEpisode &&
    !nextEpisodeCancelled &&
    isPlaying &&
    countdownSeconds > 0 &&
    countdownSeconds <= 5,
  );

  useResumeAuthAction("video-like", videoId, () => {
    setDisliked(false);
    setLikeCount((count) =>
      Math.max(0, count + (liked[videoId] ? -1 : 1)),
    );
    void toggleLike(videoId);
  });
  useResumeAuthAction("follow-user", creatorId, () => {
    void toggleFollow(creatorId);
  });
  useResumeAuthAction("video-comment", videoId, async (action) => {
    const text = action.payload?.text ?? "";
    if (!text.trim()) return;
    setCommentsOpen(true);
    const ok = await realComments.send(text);
    if (!ok) {
      setCommentText(text);
      toast.error("Comment could not be posted");
    }
  });
  useResumeAuthAction("video-reply", videoId, async (action) => {
    const text = action.payload?.text ?? "";
    const parentId = action.payload?.parentId;
    if (!text.trim() || !parentId) return;
    setCommentsOpen(true);
    const ok = await realComments.sendReply(text, parentId);
    if (!ok) {
      setReplyingTo(parentId);
      setReplyText(text);
      toast.error("Reply could not be posted");
    } else {
      setReplyingTo(null);
      setExpandedThreads((current) => new Set(current).add(parentId));
    }
  });
  useResumeAuthAction("comment-like", videoId, async (action) => {
    const commentId = action.payload?.parentId;
    if (!commentId) return;
    const ok = await realComments.toggleLike(commentId);
    if (!ok) toast.error("Couldn't update comment like");
  });

  useEffect(() => {
    const sentinel = relatedSentinelRef.current;
    if (!sentinel || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleSubscribe = async () => {
    if (!user?.id) {
      requestAuthAction({ type: "follow-user", targetId: creatorId });
      return;
    }
    if (!creatorId || creatorId === user.id) {
      toast.error("You can't follow yourself");
      return;
    }
    const wasSubscribed = subscribed;
    const changed = await toggleFollow(creatorId);
    if (!changed) return;
    void queryClient.invalidateQueries({ queryKey: ["video-subscriber-count", creatorId] });
    toast.success(wasSubscribed ? "Unfollowed" : "Followed");
  };

  const viewRecordedRef = useRef(false);
  useEffect(() => {
    viewRecordedRef.current = false;
    playedSecondsRef.current = 0;
    lastVideoTimeRef.current = null;
    lastResumeSavedAtRef.current = 0;
    resumeRemovedRef.current = false;
  }, [videoId]);

  const persistResumeAt = useCallback(
    (rawCurrentTime: number, rawDuration: number, force = false) => {
      const currentTime = Number.isFinite(rawCurrentTime) ? Math.max(0, rawCurrentTime) : 0;
      const duration = Number.isFinite(rawDuration) ? Math.max(0, rawDuration) : 0;
      const isComplete =
        duration > 0 &&
        (currentTime / duration >= 0.95 ||
          (duration > 30 && duration - currentTime <= 15));

      if (isComplete) {
        if (!resumeRemovedRef.current) {
          removeVideoResumeEntry(videoId);
          resumeRemovedRef.current = true;
        }
        return;
      }
      if (currentTime <= 0) return;

      const now = Date.now();
      if (!force && now - lastResumeSavedAtRef.current < 1000) return;
      const parsedEpisodeNumber = Number(video?.episode_number);
      saveVideoResumeEntry({
        id: videoId,
        title: video?.title || video?.caption || "Untitled video",
        thumbnailUrl: video?.thumbnail_url || "",
        currentTime,
        duration,
        progress: duration > 0 ? currentTime / duration : 0,
        seriesTitle: video?.series_title?.trim() || null,
        episodeNumber: Number.isFinite(parsedEpisodeNumber) ? parsedEpisodeNumber : null,
        watchedSeconds: playedSecondsRef.current,
        updatedAt: now,
      });
      lastResumeSavedAtRef.current = now;
      resumeRemovedRef.current = false;
    },
    [video, videoId],
  );

  const handleVideoTimeUpdate = useCallback(
    (rawCurrentTime: number, rawDuration: number, wasSeeking: boolean) => {
      const currentTime = Number.isFinite(rawCurrentTime) ? rawCurrentTime : 0;
      const previousTime = lastVideoTimeRef.current;
      lastVideoTimeRef.current = currentTime;
      const delta = previousTime === null ? 0 : currentTime - previousTime;

      if (!wasSeeking && delta > 0 && delta <= 2) playedSecondsRef.current += delta;
      persistResumeAt(currentTime, rawDuration);

      if (
        wasSeeking ||
        viewRecordedRef.current ||
        !user?.id ||
        delta <= 0 ||
        delta > 2
      ) return;
      if (playedSecondsRef.current < 3) return;
      viewRecordedRef.current = true;
      void registerUniqueView(videoId, "video")
        .then((counted) => {
          if (!counted) return;
          queryClient.setQueryData<Video | null>(["video-detail", videoId], (current) =>
            current
              ? {
                  ...current,
                  views_count: Number(current.views_count ?? current.views ?? 0) + 1,
                }
              : current,
          );
        })
        .catch((cause) => {
          viewRecordedRef.current = false;
          console.error("Unable to register video view", cause);
        });
    },
    [persistResumeAt, queryClient, user?.id, videoId],
  );

  useEffect(() => {
    const initialCount = video?.likes_count ?? video?.like_count ?? video?.likes ?? 0;
    setLikeCount(Number(initialCount));
  }, [video?.id, video?.like_count, video?.likes, video?.likes_count]);

  const mediaUrl = video?.media_url || video?.video_url || video?.url || "";
  useEffect(() => {
    let cancelled = false;
    setResolvedMediaUrl("");
    if (!mediaUrl) return;
    void resolveLongVideoUrl(mediaUrl).then((resolved) => {
      if (!cancelled) setResolvedMediaUrl(resolved || mediaUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [mediaUrl]);

  const playableMediaUrl = resolvedMediaUrl || mediaUrl;

  useEffect(() => {
    if (!video || !playableMediaUrl || checkingAccess || isLocked) {
      if (checkingAccess || isLocked) closeVideo();
      return;
    }
    const requestedResumeTime = consumeVideoResumeRequest(video.id);
    const savedTime = requestedResumeTime ?? (
      activeVideo?.id === video.id
        ? undefined
        : getVideoResumeEntry(video.id)?.currentTime
    );
    activateVideo({
      id: video.id,
      url: playableMediaUrl,
      title: video.title || video.caption || "Untitled Video",
      thumbnailUrl: video.thumbnail_url,
      qualityUrls: video.qualityUrls ?? video.quality_urls ?? undefined,
      initialTime: savedTime,
    });
  }, [activeVideo?.id, activateVideo, checkingAccess, closeVideo, isLocked, playableMediaUrl, video]);

  useEffect(() => {
    const player = videoRef.current;
    setTimeUpdateHandler(handleVideoTimeUpdate);
    const flushResume = () => {
      if (player) persistResumeAt(player.currentTime, player.duration, true);
    };
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") flushResume();
    };
    player?.addEventListener("pause", flushResume);
    document.addEventListener("visibilitychange", flushWhenHidden);
    window.addEventListener("pagehide", flushResume);
    return () => {
      player?.removeEventListener("pause", flushResume);
      document.removeEventListener("visibilitychange", flushWhenHidden);
      window.removeEventListener("pagehide", flushResume);
      flushResume();
      setTimeUpdateHandler(null);
    };
  }, [handleVideoTimeUpdate, persistResumeAt, setTimeUpdateHandler, videoRef]);

  const submitComment = () => {
    if (!commentText.trim()) return;
    const text = commentText;
    if (!user) {
      requestAuthAction({
        type: "video-comment",
        targetId: videoId,
        payload: { text },
      });
      return;
    }
    setCommentText("");
    void realComments.send(text).then((ok) => {
      if (!ok) {
        setCommentText(text);
        toast.error("Failed to post comment");
      } else {
        toast.success("Comment added");
      }
    });
  };

  const submitReply = () => {
    if (!replyingTo || !replyText.trim()) return;
    const text = replyText;
    const parentId = replyingTo;
    if (!user) {
      requestAuthAction({
        type: "video-reply",
        targetId: videoId,
        payload: { text, parentId },
      });
      return;
    }
    setReplyText("");
    void realComments.sendReply(text, parentId).then((ok) => {
      if (!ok) {
        setReplyText(text);
        toast.error("Failed to post reply");
      } else {
        setReplyingTo(null);
        setExpandedThreads((current) => new Set(current).add(parentId));
      }
    });
  };

  const toggleCommentLike = (commentId: string) => {
    if (!user) {
      requestAuthAction({
        type: "comment-like",
        targetId: videoId,
        payload: { parentId: commentId },
      });
      return;
    }
    void realComments.toggleLike(commentId).then((ok) => {
      if (!ok) toast.error("Couldn't update comment like");
    });
  };

  const renderComment = (comment: (typeof comments)[number], depth = 0): ReactNode => {
    const username = comment.username || "user";
    const replies = repliesByParent.get(comment.id) ?? [];
    const expanded = expandedThreads.has(comment.id);
    return (
      <div key={comment.id} className="space-y-2" style={{ marginLeft: Math.min(depth, 3) * 18 }}>
        <div className="flex items-start gap-3">
          <Avatar className="mt-0.5 h-7 w-7 shrink-0">
            <AvatarImage src={comment.avatarUrl || undefined} />
            <AvatarFallback className="bg-gray-700 text-xs text-white">
              {username.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 text-xs">
            <div className="mb-0.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 font-semibold text-gray-300">
                <span>{comment.displayName || username}</span>
              </span>
              <span className="text-[10px] text-gray-500">{safeTimeAgo(comment.createdAt)}</span>
            </div>
            <p className="text-gray-100">{comment.body}</p>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-500">
              <button
                type="button"
                onClick={() => toggleCommentLike(comment.id)}
                className={`inline-flex items-center gap-1 transition-colors ${comment.likedByMe ? "font-semibold text-rose-400" : "hover:text-white"}`}
                aria-label={comment.likedByMe ? "Unlike comment" : "Like comment"}
              >
                <Heart className="h-3.5 w-3.5" fill={comment.likedByMe ? "currentColor" : "none"} />
                {comment.likesCount > 0 ? comment.likesCount : "Like"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(comment.id);
                  setReplyText(`@${username} `);
                  setExpandedThreads((current) => new Set(current).add(comment.id));
                }}
                className="inline-flex items-center gap-1 hover:text-white"
              >
                <Reply className="h-3.5 w-3.5" /> Reply
              </button>
              {replies.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedThreads((current) => {
                      const next = new Set(current);
                      if (next.has(comment.id)) next.delete(comment.id);
                      else next.add(comment.id);
                      return next;
                    })
                  }
                  className="inline-flex items-center gap-1 font-semibold text-pink-300"
                >
                  {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {expanded ? "Hide" : "View"} {replies.length} {replies.length === 1 ? "reply" : "replies"}
                </button>
              )}
              {comment.userId === user?.id && (
                <button
                  type="button"
                  onClick={() => void realComments.remove(comment.id)}
                  className="inline-flex items-center gap-1 hover:text-red-300"
                  aria-label="Delete comment"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {replyingTo === comment.id && (
              <div className="mt-2 flex gap-2">
                <Input
                  autoFocus
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && submitReply()}
                  placeholder="Write a reply..."
                  className="h-9 rounded-full border-white/10 bg-white/5 text-xs text-white"
                />
                <Button type="button" size="sm" onClick={submitReply} className="h-9 rounded-full bg-pink-600 px-3 text-white">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
        {expanded && replies.length > 0 ? (
          <div className="space-y-3 border-l border-white/10 pl-2">{replies.map((reply) => renderComment(reply, depth + 1))}</div>
        ) : null}
      </div>
    );
  };

  const handleLike = () => {
    if (!user) {
      requestAuthAction({ type: "video-like", targetId: videoId });
      return;
    }
    const wasLiked = Boolean(liked[videoId]);
    setDisliked(false);
    setLikeCount((count) => Math.max(0, count + (wasLiked ? -1 : 1)));
    toggleLike(videoId);
  };

  const handleDislike = () => {
    if (!user) {
      toast.error("Sign in to react to videos");
      return;
    }
    setDisliked((value) => !value);
    if (liked[videoId]) {
      toggleLike(videoId);
      setLikeCount((count) => Math.max(0, count - 1));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
        <p className="text-sm text-gray-400">Loading video...</p>
      </div>
    );
  }

  if (isError || !video) {
    return <VideoErrorFallback />;
  }

  const creatorUsername = video.user?.username || "user";
  const creatorName =
    video.user?.full_name ||
    video.user?.display_name ||
    creatorUsername ||
    "Creator";
  const viewCount = video.views_count || video.views || 0;
  const timeAgo = safeTimeAgo(video.created_at);
  const currentAvatar =
    typeof user?.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : undefined;
  const description = video.caption || "No description provided.";
  const sourceQualityTier =
    qualityTierFromMetadata(
      video.source_quality_tier,
      video.original_width,
      video.original_height,
    ) ?? video.sourceQualityTier;

  const downloadSelected = async (
    choice: DownloadChoice,
    reportProgress?: (percent: number) => void,
  ) => {
     if (!playableMediaUrl) throw new Error("This video has no downloadable media");
     const qualityMediaUrls = video.qualityUrls ?? video.quality_urls ?? undefined;
     const selectedQualityUrl =
       choice !== "original" && choice !== "mp3"
         ? qualityMediaUrls?.[choice]
         : undefined;
     const downloadMediaUrl = selectedQualityUrl
       ? await resolveMediaUrl(selectedQualityUrl, "videos")
       : playableMediaUrl;
      const toastId = choice === "mp3" ? toast.loading("Preparing MP3 audio… 0%") : undefined;
    const baseName = sanitizeDownloadName(video.title || "yourworld-video", `yourworld-${videoId}`);
       const downloadMetadata = {
         ownerId: user?.id || "anonymous",
         mediaId: video.id,
         title: video.title || video.caption || "Untitled Video",
         creatorName,
         creatorUsername,
         creatorId: creatorId || null,
         views: Number(viewCount),
         createdAt: video.created_at || null,
         durationSeconds: video.duration_seconds || null,
          thumbnailUrl: video.thumbnail_url
            ? await resolveMediaUrl(video.thumbnail_url, "videos")
            : null,
         quality:
           choice === "original" || choice === "mp3"
             ? "original" as const
             : choice as VideoQualityTier,
       };
    try {
      if (choice === "mp3") {
         await downloadAudioOnly(playableMediaUrl, baseName, (percent) => {
           reportProgress?.(percent);
           toast.loading(`Preparing MP3 audio... ${percent}%`, { id: toastId });
         },
        );
         toast.success("Saved to your device", { id: toastId });
      } else {
           await downloadWatermarkedVideoInBackground(
            downloadMediaUrl,
             baseName,
             creatorUsername,
            (percent) => reportProgress?.(percent),
            { ...downloadMetadata, quality: choice as VideoQualityTier },
         );
         toast.success("Saved video with YourWorld watermark");
       }
    } catch (cause) {
      console.error("Video download failed:", cause);
      toast.error(
        cause instanceof Error ? cause.message : "Couldn't prepare this download",
        toastId ? { id: toastId } : undefined,
      );
      throw cause;
    }
  };

  const handleUnlock = () => {
    if (!user) {
      toast.error("Sign in to unlock this video.");
      return;
    }
    toast.info("Complete the UPI payment to unlock this video.");
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {isLocked || checkingAccess ? (
        <LockedVideoPlayer
          video={video}
          mediaUrl={mediaUrl}
          price={Number(video.price ?? 0)}
          access={access === "vip" ? "vip" : "paid"}
          checkingAccess={checkingAccess}
          onUnlock={handleUnlock}
        />
      ) : (
        <VideoPlaybackSlot
          isVertical={
            typeof video.original_width === "number" &&
            typeof video.original_height === "number"
              ? video.original_height > video.original_width
              : undefined
          }
          className="mb-8"
        />
      )}

      {showNextEpisodeCountdown ? (
        <section
          className="fixed inset-x-4 bottom-28 z-[100] mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#101116]/95 p-4 text-white shadow-2xl backdrop-blur-xl"
          aria-live="polite"
          data-testid="panel-next-episode-countdown"
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-200">
              Next episode in {countdownSeconds}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-white">
              {nextEpisode?.title || nextEpisode?.caption || "Next episode"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={playNextEpisode}
              className="rounded-full bg-fuchsia-300 px-4 py-2 text-xs font-bold text-black hover:bg-fuchsia-200"
              data-testid="button-play-next-episode"
            >
              Play Now
            </button>
            <button
              type="button"
              onClick={() => {
                nextEpisodeCancelledRef.current = true;
                setNextEpisodeCancelled(true);
              }}
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10"
              data-testid="button-cancel-next-episode"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
        {seriesTitle && (
          <section
            aria-label={`Next episodes in ${seriesTitle}`}
            className="border-b border-white/10 pb-4"
          >
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-base font-bold text-white">Next Episodes / Parts</h2>
              <p className="truncate text-xs text-gray-400">{seriesTitle}</p>
            </div>
            {nextSeriesEpisodes.length ? (
              <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                {nextSeriesEpisodes.map((episode) => {
                  const episodeTitle = episode.title || episode.caption || "Untitled Video";
                  const episodeMedia =
                    episode.media_url || episode.video_url || episode.url || "";
                  const portrait =
                    typeof episode.original_height === "number" &&
                    typeof episode.original_width === "number" &&
                    episode.original_height > episode.original_width;
                  return (
                    <button
                      key={episode.id}
                      type="button"
                      onClick={() =>
                        void navigate({
                          to: "/video/$videoId",
                          params: { videoId: episode.id },
                        })
                      }
                      className="group w-44 shrink-0 text-left sm:w-52"
                    >
                      <div
                        className={`relative mb-2 overflow-hidden rounded-xl bg-zinc-900 ${
                          portrait ? "aspect-[9/16] w-24" : "aspect-video w-full"
                        }`}
                      >
                        <VideoPoster
                          thumbnailUrl={episode.thumbnail_url}
                          mediaUrl={episodeMedia}
                          alt={episodeTitle}
                        />
                      </div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-pink-300">
                        {episode.episode_number || "Next part"}
                      </p>
                      <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-white group-hover:text-pink-300">
                        {episodeTitle}
                      </h3>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No later parts yet.</p>
            )}
          </section>
        )}

        <div className="space-y-1">
          <h1 className="line-clamp-2 text-lg font-bold leading-tight text-white sm:text-xl">
            {video.title || video.caption || "Untitled Video"}
          </h1>
          <p className="text-xs text-gray-400">
            {viewCount ? `${viewCount} views • ` : ""}
            {timeAgo}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div
            className="flex min-w-0 cursor-pointer items-center gap-3 transition-opacity hover:opacity-80"
            onClick={() => {
              if (creatorId) {
                void navigate({ to: "/u/$userId", params: { userId: creatorId } });
              }
            }}
            role="link"
            tabIndex={creatorId ? 0 : -1}
            onKeyDown={(event) => {
              if (creatorId && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                void navigate({ to: "/u/$userId", params: { userId: creatorId } });
              }
            }}
          >
            <Avatar className="h-10 w-10 border border-white/10">
              <AvatarImage src={video.user?.avatar_url || undefined} />
              <AvatarFallback className="bg-pink-600 font-bold text-white">
                {creatorUsername.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
               <p className="flex items-center gap-1 truncate text-sm font-semibold text-white">
                 <span className="truncate">{creatorName}</span>
               </p>
              <p className="truncate text-xs text-gray-400">
                  {subscriberCount.toLocaleString()} followers
              </p>
            </div>
          </div>

           {!isCreator && (
             <Button
               className="shrink-0 rounded-full bg-pink-600 px-3 text-xs text-white hover:bg-pink-700"
               onClick={(event) => {
                 event.stopPropagation();
                 void handleSubscribe();
               }}
               size="sm"
             >
               {subscribed ? (
                 <Check className="mr-1.5 h-3.5 w-3.5" />
               ) : (
                 <UserPlus className="mr-1.5 h-3.5 w-3.5" />
               )}
               {subscribed ? "Following" : "Follow"}
             </Button>
           )}
        </div>

          <div className="grid w-full grid-cols-5 gap-1 border-b border-white/10 pb-3">
            <button
              type="button"
              onClick={handleLike}
              aria-label="Like video"
              aria-pressed={Boolean(liked[videoId])}
              className={`inline-flex h-9 w-full min-w-0 items-center justify-center gap-0.5 rounded-full border border-white/10 bg-white/10 px-1 text-[9px] font-semibold tracking-tight shadow-sm backdrop-blur-md transition-all hover:bg-white/20 sm:text-[10px] ${
                liked[videoId] ? "text-pink-300" : "text-white"
              }`}
            >
              <ThumbsUp className="h-3.5 w-3.5 shrink-0" fill={liked[videoId] ? "currentColor" : "none"} />
              <span>Like</span>
            </button>
            <button
              type="button"
              onClick={handleDislike}
              aria-label="Dislike video"
              aria-pressed={disliked}
              className={`inline-flex h-9 w-full min-w-0 items-center justify-center gap-0.5 rounded-full border border-white/10 bg-white/10 px-1 text-[9px] font-semibold tracking-tight shadow-sm backdrop-blur-md transition-all hover:bg-white/20 sm:text-[10px] ${
                disliked ? "text-pink-300" : "text-white"
              }`}
            >
              <ThumbsDown className="h-3.5 w-3.5 shrink-0" fill={disliked ? "currentColor" : "none"} />
              <span>Dislike</span>
            </button>
            <ShareSheet
              title={video.title || video.caption || "YourWorld video"}
              url={buildWatchShareUrl(videoId, "video")}
              media={video.media_url ?? video.video_url ?? video.url ?? undefined}
              mediaKind="video"
              contentId={videoId}
              contentKind="video"
              thumbnailUrl={video.thumbnail_url ?? null}
              thumbnailBucket="videos"
            >
              <button
                type="button"
                aria-label="Share video"
                className="inline-flex h-9 w-full min-w-0 items-center justify-center gap-0.5 rounded-full border border-white/10 bg-white/10 px-1 text-[9px] font-semibold tracking-tight text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20 sm:text-[10px]"
              >
                <Share2 className="h-3.5 w-3.5 shrink-0" />
                <span>Share</span>
              </button>
            </ShareSheet>
            <button
              type="button"
              onClick={() => setDownloadOpen(true)}
              aria-label="Download video"
              className="inline-flex h-9 w-full min-w-0 items-center justify-center gap-0.5 rounded-full border border-white/10 bg-white/10 px-1 text-[9px] font-semibold tracking-tight text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20 sm:text-[10px]"
            >
              <Download className="h-3.5 w-3.5 shrink-0" />
              <span>Download</span>
            </button>
          </div>

         <DownloadSheet
           open={downloadOpen}
           onOpenChange={setDownloadOpen}
           title={video.title || video.caption || "YourWorld video"}
           durationSeconds={video.duration_seconds}
           sourceQualityTier={sourceQualityTier}
           qualityMediaUrls={video.qualityUrls ?? video.quality_urls ?? undefined}
            sourceMediaUrl={playableMediaUrl}
           mediaBucket="videos"
           onDownload={downloadSelected}
         />

        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">Description</p>
          <p className={`text-xs leading-relaxed text-gray-300 ${descriptionExpanded ? "" : "line-clamp-3"}`}>
            {description}
          </p>
          {description.length > 180 ? (
            <button
              type="button"
              onClick={() => setDescriptionExpanded((expanded) => !expanded)}
              className="mt-2 text-xs font-semibold text-white"
            >
              {descriptionExpanded ? "Show less" : "Show more"}
            </button>
          ) : null}
        </div>

        <div ref={commentsRef} id="comments" tabIndex={-1}>
          <button
            type="button"
            onClick={() => setCommentsOpen(true)}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-left transition-colors hover:bg-white/[0.07]"
            aria-label="Open comments"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-pink-300" />
                <span className="text-sm font-semibold text-white">Comments</span>
                <span className="text-xs text-gray-400">({comments.length})</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </div>
            {previewComment ? (
              <div className="mt-3 flex items-start gap-2.5">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={previewComment.avatarUrl || undefined} />
                  <AvatarFallback className="bg-gray-700 text-[10px] text-white">
                    {(previewComment.username || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="line-clamp-2 min-w-0 text-xs leading-relaxed text-gray-300">
                  <span className="mr-1 font-semibold text-gray-200">
                      {previewComment.displayName || previewComment.username || "user"}
                  </span>
                  {previewComment.body}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-500">
                {realComments.loading ? "Loading comments…" : "No comments yet. Be the first."}
              </p>
            )}
          </button>

          <Drawer open={commentsOpen} onOpenChange={setCommentsOpen}>
            <DrawerContent className="h-[88vh] max-h-[760px] border-white/10 bg-zinc-950 p-0 text-white">
              <DrawerHeader className="border-b border-white/10 px-4 pb-3 pt-5 text-left">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <DrawerTitle className="text-base text-white">
                      Comments <span className="text-sm font-normal text-gray-400">({comments.length})</span>
                    </DrawerTitle>
                    <p className="mt-1 text-xs text-gray-500">Join the conversation</p>
                  </div>
                  <DrawerClose
                    asChild
                  >
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-gray-300 transition-colors hover:bg-white/15 hover:text-white"
                      aria-label="Close comments"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </DrawerClose>
                </div>
              </DrawerHeader>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                {realComments.loading ? (
                  <p className="py-8 text-center text-xs text-gray-500">Loading comments…</p>
                ) : comments.length ? (
                  <div className="space-y-4">
                    {comments
                      .filter((comment) => !comment.parentCommentId)
                      .map((comment) => renderComment(comment))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-xs text-gray-500">No comments yet. Be the first.</p>
                )}
              </div>

              <div className="border-t border-white/10 bg-zinc-950/95 px-4 py-3 backdrop-blur-xl">
                <div className="flex gap-2">
                  <Avatar className="mt-1 h-9 w-9 shrink-0">
                    <AvatarImage src={currentAvatar} />
                    <AvatarFallback className="bg-pink-600 text-xs text-white">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Input
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && commentText.trim()) submitComment();
                    }}
                    placeholder={user ? "Add a comment..." : "Join to comment"}
                    className="h-10 rounded-full border-white/10 bg-white/5 text-xs text-white placeholder:text-gray-500"
                  />
                  <Button
                    type="button"
                    disabled={!commentText.trim()}
                    onClick={submitComment}
                    size="sm"
                    className="h-10 rounded-full bg-pink-600 px-4 text-white hover:bg-pink-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {relatedVideos.length ? (
          <section className="border-t border-white/10 pt-5">
            <h2 className="mb-3 text-base font-bold text-white">Next videos</h2>
            <div className="space-y-4">
              {relatedVideos.map((related) => {
                const relatedTitle = related.title || related.caption || "Untitled Video";
                const relatedCreator =
                  related.user?.full_name ||
                  related.user?.display_name ||
                  related.user?.username ||
                  "Creator";
                const relatedMedia = related.media_url || related.video_url || related.url || "";
                return (
                  <button
                    key={related.id}
                    type="button"
                    onClick={() => {
                      if (!related.id) return;
                      void navigate({
                        to: "/video/$videoId",
                        params: { videoId: String(related.id) },
                      });
                    }}
                    className="group flex w-full gap-3 text-left"
                  >
                    <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-xl bg-zinc-900 sm:w-56">
                      <VideoPoster
                        thumbnailUrl={related.thumbnail_url}
                        mediaUrl={relatedMedia}
                        alt={relatedTitle}
                      />
                      {related.duration_seconds ? (
                        <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {formatDuration(related.duration_seconds)}
                        </span>
                      ) : null}
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <h3 className="line-clamp-2 text-sm font-semibold text-white group-hover:text-pink-300">
                        {relatedTitle}
                      </h3>
                       <p className="mt-1 flex items-center gap-1 line-clamp-2 text-xs text-gray-400">
                         <span className="truncate">{relatedCreator}</span>
                         <span>· {formatViews(Number(related.views_count || related.views || 0))}</span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div ref={relatedSentinelRef} className="flex min-h-12 items-center justify-center pt-4" aria-live="polite">
              {isFetchingNextPage ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" aria-label="Loading more videos" />
              ) : hasNextPage ? null : (
                <span className="text-xs text-gray-500">You’ve reached the end.</span>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}