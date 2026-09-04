import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Bookmark,
  Check,
  Clock,
  Download,
  Eye,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  ThumbsDown,
  ThumbsUp,
  UserPlus,
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
import { supabase } from "@/integrations/supabase/client";

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
  user?: VideoUser | null;
};

type VideoComment = {
  id: string;
  content?: string | null;
  created_at?: string | null;
  user_id?: string | null;
  user?: VideoUser | null;
};

type RecommendedVideo = Video & {
  thumbnail_url?: string | null;
  duration_seconds?: number | null;
};

const liveCommentsTable = (client: typeof supabase) =>
  (client as unknown as {
    from: (name: "comments") => ReturnType<typeof supabase.from>;
  }).from("comments");

const liveFollowsTable = (client: typeof supabase) =>
  (client as unknown as {
    from: (name: "follows") => ReturnType<typeof supabase.from>;
  }).from("follows");

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
  const { liked, saved, toggleLike, toggleSave } = useYw();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [commentText, setCommentText] = useState("");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

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

        return { ...(data as unknown as Video), user: profile };
      } catch (cause) {
        console.error("Error fetching video:", cause);
        return null;
      }
    },
    retry: 1,
  });

  const creatorId = video?.user_id || video?.user?.id || "";
  const { data: subscribed = false } = useQuery<boolean>({
    queryKey: ["video-subscription", creatorId, user?.id],
    queryFn: async () => {
      if (!creatorId || !user?.id || creatorId === user.id) return false;
      try {
        const { data, error } = await liveFollowsTable(supabase)
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", creatorId)
          .maybeSingle();
        if (error) {
          console.error("Error fetching subscription:", error);
          return false;
        }
        return Boolean(data);
      } catch (cause) {
        console.error("Error fetching subscription:", cause);
        return false;
      }
    },
    enabled: Boolean(creatorId && user?.id && creatorId !== user.id),
  });

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

  const { data: comments = [] } = useQuery<VideoComment[]>({
    queryKey: ["video-comments", videoId],
    queryFn: async () => {
      try {
        const { data, error } = await liveCommentsTable(supabase)
          .select("*")
          .eq("post_id", videoId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching video comments:", error);
          return [];
        }
        const rows = (data ?? []) as unknown as VideoComment[];
        const userIds = [...new Set(rows.map((comment) => comment.user_id).filter(Boolean))] as string[];
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
        return rows.map((comment) => ({
          ...comment,
          user: comment.user ?? (comment.user_id ? profileById.get(comment.user_id) ?? null : null),
        }));
      } catch (cause) {
        console.error("Error fetching video comments:", cause);
        return [];
      }
    },
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

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Sign in to subscribe");
      if (!creatorId || creatorId === user.id) throw new Error("You can't subscribe to yourself");
      if (subscribed) {
        const { error } = await liveFollowsTable(supabase)
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", creatorId);
        if (error) throw error;
      } else {
        const { error } = await liveFollowsTable(supabase)
          .insert({ follower_id: user.id, following_id: creatorId });
        if (error && error.code !== "23505") throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["video-subscription", creatorId, user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["video-subscriber-count", creatorId] });
      toast.success(subscribed ? "Unsubscribed" : "Subscribed");
    },
    onError: (cause) => {
      toast.error(cause instanceof Error ? cause.message : "Couldn't update subscription");
    },
  });

  useEffect(() => {
    const initialCount = video?.likes_count ?? video?.like_count ?? video?.likes ?? 0;
    setLikeCount(Number(initialCount));
  }, [video?.id, video?.like_count, video?.likes, video?.likes_count]);

  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error("Must be logged in");
      const content = text.trim();
      if (!content) throw new Error("Comment cannot be empty");

      const { data, error } = await liveCommentsTable(supabase)
        .insert({
          post_id: videoId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setCommentText("");
      void queryClient.invalidateQueries({ queryKey: ["video-comments", videoId] });
      toast.success("Comment added");
    },
    onError: () => {
      toast.error("Failed to post comment");
    },
  });

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

  const handleDownload = () => {
    const mediaUrl = video?.media_url || video?.video_url || video?.url || "";
    if (!mediaUrl) {
      toast.error("This video has no downloadable media");
      return;
    }
    try {
      const link = document.createElement("a");
      link.href = mediaUrl;
      link.download = `${(video?.title || "yourworld-video").replace(/[^a-z0-9-_]+/gi, "-")}.mp4`;
      link.target = "_blank";
      link.rel = "noopener";
      link.click();
      toast.success("Download started");
    } catch {
      toast.error("Couldn't download this video");
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

  const mediaUrl = video.media_url || video.video_url || video.url || "";
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

  return (
    <div className="min-h-screen bg-black pb-20 text-white">
      <div className="sticky top-0 z-40 flex aspect-video max-h-[45vh] w-full items-center justify-center overflow-hidden bg-black shadow-lg sm:max-h-[55vh]">
        {mediaUrl ? (
          <video
            ref={videoRef}
            src={mediaUrl}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-sm text-gray-500">No media URL found</div>
        )}

        <button
          type="button"
          onClick={() =>
            window.history.length > 1
              ? window.history.back()
              : void navigate({ to: "/" })
          }
          className="absolute left-3 top-3 z-50 rounded-full bg-black/60 p-2 text-white backdrop-blur-md transition-all hover:bg-black/80"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
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
          <div className="flex items-center gap-3">
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
            onClick={() => subscribeMutation.mutate()}
            disabled={!user || creatorId === user.id || subscribeMutation.isPending}
            size="sm"
          >
            {subscribed ? (
              <Check className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            )}
            {subscribed ? "Subscribed" : "Subscribe"}
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <div className="flex shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/10">
            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition ${
                liked[videoId] ? "text-pink-300" : "text-white"
              }`}
            >
              <ThumbsUp className="h-4 w-4" fill={liked[videoId] ? "currentColor" : "none"} />
              {formatViews(likeCount)}
            </button>
            <button
              type="button"
              onClick={handleDislike}
              aria-label="Dislike video"
              className={`border-l border-white/10 px-3 py-2 ${
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
            className="shrink-0 rounded-full border-white/10 bg-white/10 px-4 text-xs text-white hover:bg-white/15"
          >
            <Share2 className="mr-1.5 h-4 w-4" /> Share
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
            className={`shrink-0 rounded-full border-white/10 bg-white/10 px-4 text-xs text-white hover:bg-white/15 ${
              saved[videoId] ? "text-pink-300" : ""
            }`}
          >
            <Bookmark className="mr-1.5 h-4 w-4" fill={saved[videoId] ? "currentColor" : "none"} />
            {saved[videoId] ? "Saved" : "Save"}
          </Button>
          <Button
            type="button"
            onClick={handleDownload}
            variant="outline"
            className="shrink-0 rounded-full border-white/10 bg-white/10 px-4 text-xs text-white hover:bg-white/15"
          >
            <Download className="mr-1.5 h-4 w-4" /> Download
          </Button>
          <Button
            type="button"
            onClick={() => toast.message("More video options are coming soon")}
            variant="outline"
            className="shrink-0 rounded-full border-white/10 bg-white/10 px-3 text-white hover:bg-white/15"
            aria-label="More options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

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
                if (event.key === "Enter" && commentText.trim()) {
                  addCommentMutation.mutate(commentText);
                }
              }}
              disabled={!user}
              placeholder={user ? "Add a comment..." : "Sign in to comment"}
              className="h-10 rounded-full border-white/10 bg-white/5 text-xs text-white placeholder:text-gray-500"
            />
            <Button
              type="button"
              disabled={!commentText.trim() || addCommentMutation.isPending}
              onClick={() => addCommentMutation.mutate(commentText)}
              size="sm"
              className="h-10 rounded-full bg-pink-600 px-4 text-white hover:bg-pink-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {comments.map((comment) => {
              const username = comment.user?.username || "user";
              return (
                <div key={comment.id} className="flex items-start gap-3">
                  <Avatar className="mt-0.5 h-7 w-7">
                    <AvatarImage src={comment.user?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gray-700 text-xs text-white">
                      {username.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-xs">
                    <div className="mb-0.5 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-300">@{username}</span>
                      {comment.created_at ? (
                        <span className="text-[10px] text-gray-500">
                          {safeTimeAgo(comment.created_at)}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-gray-100">{comment.content || ""}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {relatedVideos.length ? (
          <section className="border-t border-white/10 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Related videos</h2>
              <MessageCircle className="h-4 w-4 text-gray-500" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
                    className="group text-left"
                  >
                    <div className="relative aspect-video overflow-hidden rounded-xl bg-zinc-900">
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
                    <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-white group-hover:text-pink-300">
                      {relatedTitle}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-xs text-gray-400">
                      {relatedCreator} · {formatViews(Number(related.views_count || related.views || 0))}
                    </p>
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