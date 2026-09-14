import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
  type ReactNode,
} from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Eye,
  Heart,
  Lock,
  Reply,
  Send,
  Share2,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Unlock,
  UserPlus,
  Volume2,
  ZoomIn,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoPoster } from "@/components/yw/VideoPoster";
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
import { isVideoQualityTier, qualityTierFromDimensions, type VideoQualityTier } from "@/lib/video-quality";

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

export const Route = createFileRoute("/video/$videoId")({
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
  const { user } = useAuth();
  const { liked, saved, following, toggleLike, toggleSave, toggleFollow } = useYw();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [commentText, setCommentText] = useState("");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [displayMode, setDisplayMode] = useState<"fit" | "fill">("fit");
  const [brightness, setBrightness] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [screenLocked, setScreenLocked] = useState(false);
  const [gestureFeedback, setGestureFeedback] = useState<GestureFeedback | null>(null);
  const [resolvedMediaUrl, setResolvedMediaUrl] = useState<string>("");
  const touchGestureRef = useRef<TouchGesture | null>(null);
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
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
        const sourceQualityTier = isVideoQualityTier(metadata.source_quality_tier)
          ? metadata.source_quality_tier
          : qualityTierFromDimensions(metadata.original_width, metadata.original_height);

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

  const repliesByParent = new Map<string, typeof comments>();
  comments.forEach((comment) => {
    if (!comment.parentCommentId) return;
    const replies = repliesByParent.get(comment.parentCommentId) ?? [];
    replies.push(comment);
    repliesByParent.set(comment.parentCommentId, replies);
  });

  const { data: relatedVideos = [] } = useQuery<RecommendedVideo[]>({
    queryKey: ["related-videos", videoId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .neq("id", videoId)
          .order("created_at", { ascending: false })
          .limit(12);
        if (error) {
          console.error("Error fetching related videos:", error);
          return [];
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

        return videos.map((row) => ({
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
        }));
      } catch (cause) {
        console.error("Error fetching related videos:", cause);
        return [];
      }
    },
  });

  const handleSubscribe = async () => {
    if (!user?.id) {
      toast.error("Sign in to subscribe");
      return;
    }
    if (!creatorId || creatorId === user.id) {
      toast.error("You can't subscribe to yourself");
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

  const handleVideoTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const currentTime = Number.isFinite(event.currentTarget.currentTime)
      ? event.currentTarget.currentTime
      : 0;
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
  };

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
              <span className="font-semibold text-gray-300">@{username}</span>
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

  const toggleScreenLock = () => {
    if (!isFullscreen) return;
    setScreenLocked((locked) => !locked);
  };

  const showGestureFeedback = (
    kind: GestureFeedback["kind"],
    value: number,
    label: string,
  ) => {
    setGestureFeedback({ kind, value, label });
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      setGestureFeedback(null);
      feedbackTimerRef.current = null;
    }, 1000);
  };

  const seekBy = (seconds: number) => {
    if (!isFullscreen || screenLocked) return;
    const videoElement = videoRef.current;
    if (!videoElement) return;
    const duration = Number.isFinite(videoElement.duration) ? videoElement.duration : Infinity;
    videoElement.currentTime = clamp(videoElement.currentTime + seconds, 0, duration);
    showGestureFeedback("seek", seconds, `${seconds > 0 ? "+" : ""}${seconds}s`);
  };

  const handleDoubleTap = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!isFullscreen || screenLocked) return;
    const rect = event.currentTarget.getBoundingClientRect();
    seekBy(event.clientX - rect.left >= rect.width / 2 ? 15 : -15);
  };

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
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
  };

  const handleTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
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
    const deltaX = firstTouch.clientX - (gesture.startX + event.currentTarget.getBoundingClientRect().left);
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
  };

  const handleTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (!isFullscreen || screenLocked) return;
    const gesture = touchGestureRef.current;
    touchGestureRef.current = null;
    if (!gesture || gesture.moved) return;
    const now = Date.now();
    const previousTap = lastTapRef.current;
    if (previousTap && now - previousTap.time < 320 && Math.abs(gesture.startX - previousTap.x) < 48) {
      event.preventDefault();
      seekBy(gesture.startX >= gesture.width / 2 ? 15 : -15);
      lastTapRef.current = null;
      return;
    }
    lastTapRef.current = { time: now, x: gesture.startX };
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

  const playableMediaUrl = resolvedMediaUrl || mediaUrl;
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
  const sourceQualityTier = video.sourceQualityTier ??
    (isVideoQualityTier(video.source_quality_tier)
      ? video.source_quality_tier
      : qualityTierFromDimensions(video.original_width, video.original_height));

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
      <div
        ref={containerRef}
        className="w-full aspect-video sticky top-0 z-30 bg-black"
        onDoubleClick={handleDoubleTap}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "none" }}
      >
         {playableMediaUrl ? (
         <video
            ref={videoRef}
             src={playableMediaUrl}
             controls={!isFullscreen || !screenLocked}
            controlsList="nodownload"
            disablePictureInPicture={false}
            autoPlay
            playsInline
             onTimeUpdate={handleVideoTimeUpdate}
             className={`h-full w-full ${displayMode === "fill" ? "object-cover" : "object-contain"}`}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              objectFit: displayMode === "fill" ? "cover" : "contain",
              filter: `brightness(${brightness})`,
              transition: gestureFeedback?.kind === "zoom" ? "none" : "transform 160ms ease-out",
            }}
          />
        ) : (
          <div className="text-sm text-gray-500">No media URL found</div>
        )}

         {isFullscreen && !screenLocked && (
         <div className="pointer-events-none absolute inset-0 z-50">
           {isFullscreen && gestureFeedback?.kind === "seek" ? (
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

           {isFullscreen && gestureFeedback?.kind === "volume" ? (
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

           {isFullscreen && gestureFeedback?.kind === "brightness" ? (
            <div className="pointer-events-none absolute left-5 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 rounded-full bg-black/60 px-2.5 py-3 text-white backdrop-blur-sm">
              <Sun className="h-4 w-4" />
              <div className="flex h-24 w-1.5 items-end overflow-hidden rounded-full bg-white/25">
                <div
                  className="w-full rounded-full bg-yellow-300 transition-[height]"
                  style={{
                    height: `${gestureFeedback.value * 100}%`,
                  }}
                />
              </div>
              <span className="text-[10px] font-semibold">{gestureFeedback.label}</span>
            </div>
          ) : null}

           {isFullscreen && gestureFeedback?.kind === "zoom" ? (
            <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-black/65 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
              <ZoomIn className="h-4 w-4" />
              {gestureFeedback.label}
            </div>
           ) : null}
        </div>
         )}

        {isFullscreen && screenLocked ? (
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

         {!screenLocked && <button
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
         </button>}

         {isFullscreen && !screenLocked ? (
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
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col space-y-4 px-4 py-4">
        <div>
          <h1 className="line-clamp-2 text-lg font-bold text-white sm:text-xl">
            {video.title || video.caption || "Untitled Video"}
          </h1>
          <p className="mt-1 text-xs text-gray-400">
            {viewCount ? `${viewCount} views • ` : ""}
            {timeAgo}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-white/10 py-3">
          <div
            className="flex cursor-pointer items-center gap-3 transition-opacity hover:opacity-80"
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
            <div>
              <p className="text-sm font-semibold text-white">{creatorName}</p>
              <p className="text-xs text-gray-400">
                @{creatorUsername} · {subscriberCount.toLocaleString()} subscribers
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

        <div className="flex w-full items-center justify-between px-1 py-2">
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/10 px-1.5 py-1.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-md transition-all">
            <button
              type="button"
              onClick={handleLike}
               className={`flex items-center gap-1 text-[11px] font-semibold transition-all ${
                liked[videoId] ? "text-pink-300" : "text-white"
              }`}
            >
              <ThumbsUp className="h-4 w-4" fill={liked[videoId] ? "currentColor" : "none"} />
              {formatViews(likeCount)}
            </button>
            <span className="h-4 w-[1px] bg-white/20" />
            <button
              type="button"
              onClick={handleDislike}
              aria-label="Dislike video"
               className={`flex items-center text-[11px] transition-all ${
                disliked ? "text-pink-300" : "text-white"
              }`}
            >
              <ThumbsDown className="h-4 w-4" fill={disliked ? "currentColor" : "none"} />
            </button>
          </div>
          <Button
            type="button"
            onClick={() => void handleShare()}
            variant="outline"
             className="shrink-0 rounded-full border border-white/10 bg-white/10 px-1.5 py-1.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20"
          >
            <Share2 className="mr-1 h-4 w-4" /> Share
          </Button>
           <Button
             type="button"
             onClick={() => setDownloadOpen(true)}
             variant="outline"
             className="shrink-0 rounded-full border border-white/10 bg-white/10 px-1.5 py-1.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20"
           >
             <Download className="mr-1 h-4 w-4" /> Download
           </Button>
          <Button
            type="button"
            onClick={() => {
              if (!user) {
                toast.error("Sign in to save videos");
                return;
              }
              toggleSave(videoId);
              toast.success(saved[videoId] ? "Removed from saved" : "Saved to your library");
            }}
            variant="outline"
             className={`shrink-0 rounded-full border border-white/10 bg-white/10 px-1.5 py-1.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20 ${
              saved[videoId] ? "text-pink-300" : ""
            }`}
          >
            <Bookmark className="mr-1 h-4 w-4" fill={saved[videoId] ? "currentColor" : "none"} />
            {saved[videoId] ? "Saved" : "Save"}
          </Button>
        </div>

         <DownloadSheet
           open={downloadOpen}
           onOpenChange={setDownloadOpen}
           title={video.title || video.caption || "YourWorld video"}
           durationSeconds={video.duration_seconds}
           sourceQualityTier={sourceQualityTier}
           onDownload={downloadSelected}
         />

        <div className="rounded-xl bg-white/5 p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {formatViews(Number(viewCount))}
            </span>
            {timeAgo ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {timeAgo}
              </span>
            ) : null}
          </div>
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

        <div className="pt-2">
          <h3 className="mb-3 text-sm font-semibold text-white">
            Comments ({comments.length})
          </h3>

          <div className="mb-4 flex gap-2">
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

          <div className="space-y-3">
            {comments.filter((comment) => !comment.parentCommentId).map((comment) => renderComment(comment))}
            {!realComments.loading && comments.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-500">No comments yet. Be the first.</p>
            ) : null}
          </div>
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
                      <p className="mt-1 line-clamp-2 text-xs text-gray-400">
                        {relatedCreator} · {formatViews(Number(related.views_count || related.views || 0))}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}