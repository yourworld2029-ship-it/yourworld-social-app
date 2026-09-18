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
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  Heart,
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
import { SportsIdentityMark } from "@/components/yw/SportsIdentityBadge";
import { useAuth } from "@/lib/auth-store";
import { useYw } from "@/lib/yw-store";
import { formatDuration, formatViews } from "@/lib/video-data";
import { resolveLongVideoUrl } from "@/lib/video-data";
import { usePostComments } from "@/lib/social-data";
import { registerUniqueView } from "@/lib/unique-views";
import { supabase } from "@/integrations/supabase/client";
import { DownloadSheet, type DownloadChoice } from "@/components/yw/DownloadSheet";
import {
  downloadAudioOnly,
  downloadVideoAtQuality,
  downloadVideoInBackground,
  sanitizeDownloadName,
} from "@/lib/yw-download";
import { qualityTierFromMetadata, type VideoQualityTier } from "@/lib/video-quality";
import { useVideoPlayback, VideoPlaybackSlot } from "@/lib/video-playback";

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
  source_quality_tier?: string | null;
  original_width?: number | null;
  original_height?: number | null;
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
  const { user } = useAuth();
  const { liked, saved, following, toggleLike, toggleSave, toggleFollow } = useYw();
  const { activateVideo, setTimeUpdateHandler } = useVideoPlayback();
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
        };
        const sourceQualityTier = qualityTierFromMetadata(
          metadata.source_quality_tier,
          metadata.original_width,
          metadata.original_height,
        );

        return { ...(data as unknown as Video), sourceQualityTier, user: profile };
      } catch (cause) {
        console.error("Error fetching video:", cause);
        return null;
      }
    },
    retry: 1,
  });

  const creatorId = video?.user_id || video?.user?.id || "";
  const subscribed = Boolean(creatorId && following[creatorId]);

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
      toast.error("Sign in to follow");
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
  }, [videoId]);

  const handleVideoTimeUpdate = useCallback(
    (rawCurrentTime: number) => {
      const currentTime = Number.isFinite(rawCurrentTime) ? rawCurrentTime : 0;
      const previousTime = lastVideoTimeRef.current;
      lastVideoTimeRef.current = currentTime;
      const delta = previousTime === null ? 0 : currentTime - previousTime;
      if (
        viewRecordedRef.current ||
        !user?.id ||
        delta <= 0 ||
        delta > 2
      ) return;
      playedSecondsRef.current += delta;
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
    [queryClient, user?.id, videoId],
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
    if (!video || !playableMediaUrl) return;
    activateVideo({
      id: video.id,
      url: playableMediaUrl,
      title: video.title || video.caption || "Untitled Video",
      thumbnailUrl: video.thumbnail_url,
    });
  }, [activateVideo, playableMediaUrl, video]);

  useEffect(() => {
    setTimeUpdateHandler(handleVideoTimeUpdate);
    return () => setTimeUpdateHandler(null);
  }, [handleVideoTimeUpdate, setTimeUpdateHandler]);

  const submitComment = () => {
    if (!user || !commentText.trim()) return;
    const text = commentText;
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
    if (!user || !replyingTo || !replyText.trim()) return;
    const text = replyText;
    const parentId = replyingTo;
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
      toast.error("Sign in to like comments");
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
                <span>@{username}</span>
                <SportsIdentityMark userId={comment.userId} />
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
            {replyingTo === comment.id && user && (
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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: video?.title || "Watch Video",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
      }
    } catch {
      // Share cancellation and clipboard failures should not crash the route.
    }
  };

  const handleLike = () => {
    if (!user) {
      toast.error("Sign in to like videos");
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

  const downloadSelected = async (choice: DownloadChoice) => {
     if (!playableMediaUrl) throw new Error("This video has no downloadable media");
    const toastId = toast.loading("Preparing download... 0%");
    const baseName = sanitizeDownloadName(video.title || "yourworld-video", `yourworld-${videoId}`);
    try {
      if (choice === "mp3") {
         await downloadAudioOnly(playableMediaUrl, baseName, (percent) =>
          toast.loading(`Preparing MP3 audio... ${percent}%`, { id: toastId }),
        );
      } else if (choice === "original" || choice === sourceQualityTier) {
         await downloadVideoInBackground(playableMediaUrl, `${baseName}.mp4`, (percent) =>
          toast.loading(`Downloading original video... ${percent}%`, { id: toastId }),
        );
      } else {
         await downloadVideoAtQuality(playableMediaUrl, baseName, choice, (percent) =>
          toast.loading(`Creating ${choice} video... ${percent}%`, { id: toastId }),
        );
      }
      toast.success("Download started", { id: toastId });
    } catch (cause) {
      console.error("Video download failed:", cause);
      toast.error("Couldn't prepare this download", { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <VideoPlaybackSlot />

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
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
                 <SportsIdentityMark userId={creatorId} />
               </p>
              <p className="truncate text-xs text-gray-400">
                 @{creatorUsername} · {subscriberCount.toLocaleString()} followers
              </p>
            </div>
          </div>

          <Button
            className="shrink-0 rounded-full bg-pink-600 px-3 text-xs text-white hover:bg-pink-700 disabled:opacity-50"
            onClick={(event) => {
              event.stopPropagation();
              void handleSubscribe();
            }}
            disabled={!user || creatorId === user.id}
            size="sm"
          >
            {subscribed ? (
              <Check className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            )}
            {subscribed ? "Following" : "Follow"}
          </Button>
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
            <button
              type="button"
              onClick={() => void handleShare()}
              aria-label="Share video"
              className="inline-flex h-9 w-full min-w-0 items-center justify-center gap-0.5 rounded-full border border-white/10 bg-white/10 px-1 text-[9px] font-semibold tracking-tight text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20 sm:text-[10px]"
            >
              <Share2 className="h-3.5 w-3.5 shrink-0" />
              <span>Share</span>
            </button>
            <button
              type="button"
              onClick={() => setDownloadOpen(true)}
              aria-label="Download video"
              className="inline-flex h-9 w-full min-w-0 items-center justify-center gap-0.5 rounded-full border border-white/10 bg-white/10 px-1 text-[9px] font-semibold tracking-tight text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20 sm:text-[10px]"
            >
              <Download className="h-3.5 w-3.5 shrink-0" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  toast.error("Sign in to save videos");
                  return;
                }
                toggleSave(videoId);
                toast.success(saved[videoId] ? "Removed from saved" : "Saved to your library");
              }}
              aria-label={saved[videoId] ? "Unsave video" : "Save video"}
              aria-pressed={Boolean(saved[videoId])}
              className={`inline-flex h-9 w-full min-w-0 items-center justify-center gap-0.5 rounded-full border border-white/10 bg-white/10 px-1 text-[9px] font-semibold tracking-tight shadow-sm backdrop-blur-md transition-all hover:bg-white/20 sm:text-[10px] ${
                saved[videoId] ? "text-pink-300" : "text-white"
              }`}
            >
              <Bookmark className="h-3.5 w-3.5 shrink-0" fill={saved[videoId] ? "currentColor" : "none"} />
              <span>Save</span>
            </button>
          </div>

         <DownloadSheet
           open={downloadOpen}
           onOpenChange={setDownloadOpen}
           title={video.title || video.caption || "YourWorld video"}
           durationSeconds={video.duration_seconds}
           sourceQualityTier={sourceQualityTier}
            sourceMediaUrl={playableMediaUrl}
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
                     @{previewComment.username || "user"}
                     <SportsIdentityMark userId={previewComment.userId} />
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
                    disabled={!user}
                    placeholder={user ? "Add a comment..." : "Sign in to comment"}
                    className="h-10 rounded-full border-white/10 bg-white/5 text-xs text-white placeholder:text-gray-500"
                  />
                  <Button
                    type="button"
                    disabled={!commentText.trim() || !user}
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
                         <SportsIdentityMark userId={related.user_id ?? null} />
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