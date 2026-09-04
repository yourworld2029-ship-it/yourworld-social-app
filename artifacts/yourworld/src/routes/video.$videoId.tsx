import { useRef, useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, AlertCircle, Send, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-store";
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
  views_count?: number | null;
  views?: number | null;
  user?: VideoUser | null;
};

type VideoComment = {
  id: string;
  content?: string | null;
  created_at?: string | null;
  user?: VideoUser | null;
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

export default function VideoWatchPage() {
  const params = useParams({ strict: false }) as { videoId?: string };
  const cleanId = cleanVideoId(params?.videoId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [commentText, setCommentText] = useState("");

  const {
    data: video,
    isLoading,
    isError,
  } = useQuery<Video | null>({
    queryKey: ["video-detail", cleanId],
    queryFn: async () => {
      if (!cleanId) return null;
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("id", cleanId)
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
    enabled: Boolean(cleanId),
    retry: 1,
  });

  const { data: comments = [] } = useQuery<VideoComment[]>({
    queryKey: ["video-comments", cleanId],
    queryFn: async () => {
      if (!cleanId) return [];
      try {
        const { data, error } = await supabase
          .from("comments")
          .select("*")
          .eq("post_id", cleanId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching video comments:", error);
          return [];
        }
        return (data ?? []) as unknown as VideoComment[];
      } catch (cause) {
        console.error("Error fetching video comments:", cause);
        return [];
      }
    },
    enabled: Boolean(cleanId),
  });

  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error("Must be logged in");
      const content = text.trim();
      if (!content || !cleanId) throw new Error("Comment cannot be empty");

      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: cleanId,
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
      void queryClient.invalidateQueries({ queryKey: ["video-comments", cleanId] });
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

  return (
    <div className="min-h-screen bg-black pb-20 text-white">
      <div className="sticky top-0 z-50 flex aspect-video max-h-[45vh] w-full items-center justify-center overflow-hidden bg-black shadow-lg sm:max-h-[55vh]">
        {mediaUrl ? (
          <video
            ref={videoRef}
            src={mediaUrl}
            controls
            autoPlay
            playsInline
            className="h-full w-full object-contain"
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

        <div className="flex items-center justify-between border-y border-white/10 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-white/10">
              <AvatarImage src={video.user?.avatar_url || undefined} />
              <AvatarFallback className="bg-pink-600 font-bold text-white">
                {creatorUsername.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-white">{creatorName}</p>
              <p className="text-xs text-gray-400">@{creatorUsername}</p>
            </div>
          </div>

          <Button
            className="rounded-full border-white/20 bg-white/5 px-3 text-xs text-white hover:bg-white/10"
            onClick={() => void handleShare()}
            size="sm"
            variant="outline"
          >
            <Share2 className="mr-1.5 h-3.5 w-3.5" /> Share
          </Button>
        </div>

        {video.caption && video.caption !== video.title ? (
          <div className="rounded-xl bg-white/5 p-3 text-xs leading-relaxed text-gray-300">
            {video.caption}
          </div>
        ) : null}

        <div className="pt-2">
          <h3 className="mb-3 text-sm font-semibold text-white">
            Comments ({comments.length})
          </h3>

          <div className="mb-4 flex gap-2">
            <Input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && commentText.trim()) {
                  addCommentMutation.mutate(commentText);
                }
              }}
              placeholder="Add a comment..."
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
                    <span className="mr-2 font-semibold text-gray-300">
                      @{username}
                    </span>
                    <span className="text-gray-100">{comment.content || ""}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}