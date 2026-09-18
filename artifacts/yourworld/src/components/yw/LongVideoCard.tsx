import { useEffect, useRef, useState } from "react";
import {
  Play, Eye, Heart, Clock, MessageCircle, Send, Bookmark,
  MoreHorizontal, Link2, Trash2, EyeOff,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  formatViews,
  resolveLongVideoUrl,
  timeAgo,
  type LongVideo,
} from "@/lib/video-data";
import { deleteMyPost } from "@/lib/profile-data";
import { CommentsSheet } from "@/components/yw/CommentsSheet";
import { ShareSheet } from "@/components/yw/ShareSheet";
import { VideoPoster } from "@/components/yw/VideoPoster";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCount } from "@/lib/yw-data";
import { useYw } from "@/lib/yw-store";
import { cn } from "@/lib/utils";

type Props = {
  video: LongVideo;
  onView: (id: string) => void | Promise<unknown>;
  onLike: (id: string) => void | Promise<unknown>;
  currentUserId?: string | null;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void | Promise<unknown>;
  onDeleted?: (id: string) => void;
};

function formatBadgeDuration(seconds: number | null) {
  if (!Number.isFinite(seconds) || seconds == null || seconds <= 0) return null;

  const totalSeconds = Math.floor(seconds);
  if (totalSeconds <= 0) return null;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

/** Feed card for long-form videos — supports 16:9 and 9:16 playback. */
export function LongVideoCard({
  video,
  onLike,
  currentUserId = null,
  isSaved = false,
  onToggleSave,
  onDeleted,
}: Props) {
  const { following, toggleFollow } = useYw();
  const [hidden, setHidden] = useState(false);
  const [commentCount, setCommentCount] = useState(video.commentCount);
  const [liking, setLiking] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(
    () =>
      typeof video.durationSeconds === "number" &&
      Number.isFinite(video.durationSeconds) &&
      video.durationSeconds > 0
        ? video.durationSeconds
        : null,
  );
  const cardRef = useRef<HTMLElement | null>(null);
  const [mediaNearViewport, setMediaNearViewport] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || typeof IntersectionObserver === "undefined") {
      setMediaNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setMediaNearViewport(true);
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const storedDuration =
      typeof video.durationSeconds === "number" &&
      Number.isFinite(video.durationSeconds) &&
      video.durationSeconds > 0
        ? video.durationSeconds
        : null;
    setDurationSeconds(storedDuration);
    if (storedDuration !== null || !video.mediaUrl || !mediaNearViewport) return;

    let active = true;
    const probe = document.createElement("video");
    probe.preload = "metadata";

    const cleanup = () => {
      active = false;
      probe.onloadedmetadata = null;
      probe.onerror = null;
      probe.removeAttribute("src");
      probe.load();
    };

    probe.onloadedmetadata = () => {
      if (active && Number.isFinite(probe.duration) && probe.duration > 0) {
        setDurationSeconds(probe.duration);
      }
      cleanup();
    };
    probe.onerror = cleanup;

    void resolveLongVideoUrl(video.mediaUrl)
      .then((url) => {
        if (!active || !url) return;
        probe.src = url;
        probe.load();
      })
      .catch(cleanup);

    return cleanup;
  }, [mediaNearViewport, video.durationSeconds, video.mediaUrl]);

  const isMine = currentUserId === video.userId;
  const isFollowing = !!following[video.userId];
  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/?post=${video.id}` : undefined;

  const handleSave = async () => {
    if (!onToggleSave) return;
    if (!currentUserId) {
      toast.error("Sign in to save videos");
      return;
    }
    try {
      const savedNow = await onToggleSave(video.id);
      toast.success(savedNow === false ? "Removed from saved" : "Video saved");
    } catch {
      toast.error("Couldn't update saved videos");
    }
  };

  const handleLike = async () => {
    if (!currentUserId) {
      toast.error("Sign in to like videos");
      return;
    }
    if (liking) return;
    setLiking(true);
    try {
      await onLike(video.id);
    } catch {
      toast.error("Couldn't update like");
    } finally {
      setLiking(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl ?? "");
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMyPost({
        id: video.id,
        user_id: video.userId,
        media_url: video.mediaUrl,
        thumbnail_url: video.thumbnailUrl,
        kind: "video",
      });
      setHidden(true);
      onDeleted?.(video.id);
      toast.success("Video deleted");
    } catch {
      toast.error("Couldn't delete this video");
    }
  };

  const upcoming =
    !!video.scheduledAt && new Date(video.scheduledAt).getTime() > Date.now();
  const formattedDuration = formatBadgeDuration(durationSeconds);

  if (hidden) return null;

  return (
    <article
      ref={cardRef}
      className="space-y-3 overflow-hidden border-y border-zinc-800/80 bg-[#141418] shadow-2xl"
    >
      <button
        type="button"
        aria-label={`Open ${video.title}`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          window.location.href = `/video/${video.id}`;
        }}
        className="group relative z-20 block w-full cursor-pointer touch-manipulation select-none border-0 bg-black p-0 text-left"
      >
        <div
          className={cn(
            "relative mx-auto w-full overflow-hidden bg-black",
            video.orientation === "portrait"
              ? "max-h-[75vh] aspect-[9/16]"
              : "aspect-[16/9]",
          )}
        >
          <VideoPoster
            thumbnailUrl={video.thumbnailUrl}
            mediaUrl={video.mediaUrl}
            alt={video.title}
            className="pointer-events-none select-none"
          />
          <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="grid h-14 w-14 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
              <Play size={22} className="ml-0.5 fill-black" />
            </span>
          </span>
          {formattedDuration && (
            <span className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold">
              {formattedDuration}
            </span>
          )}
        </div>
      </button>

      <div className="space-y-2 px-3 pb-3">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              window.location.href = `/video/${video.id}`;
            }}
            className="cursor-pointer select-none text-left text-sm font-bold leading-snug text-white"
          >
            {video.title}
          </button>
          <div className="flex shrink-0 items-center gap-1.5">
            {!isMine && (
              <button
                type="button"
                onClick={() => toggleFollow(video.userId)}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-semibold transition-all active:scale-95",
                  isFollowing ? "bg-zinc-800 text-white" : "bg-pink-500 text-white",
                )}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="More options"
                  onClick={(event) => event.stopPropagation()}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <MoreHorizontal size={18} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={copyLink}>
                  <Link2 className="mr-2 h-4 w-4" /> Copy link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSave}>
                  <Bookmark className="mr-2 h-4 w-4" />{" "}
                  {isSaved ? "Remove from saved" : "Save video"}
                </DropdownMenuItem>
                {!isMine && (
                  <DropdownMenuItem onClick={() => setHidden(true)}>
                    <EyeOff className="mr-2 h-4 w-4" /> Not interested
                  </DropdownMenuItem>
                )}
                {isMine && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete video
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
          <Link
            to="/u/$userId"
            params={{ userId: video.userId }}
            onClick={(event) => event.stopPropagation()}
            className="flex items-center gap-2 transition-opacity active:opacity-70"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#8b2fc9] text-[11px] font-bold text-white">
              {video.author.letter}
            </span>
            <span className="font-semibold text-zinc-200">@{video.author.username}</span>
          </Link>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Eye size={12} /> {formatViews(video.views)}
          </span>
          <span>·</span>
          <span>{timeAgo(video.createdAt)}</span>
        </div>

        {upcoming && (
          <p className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-[11px] font-semibold text-amber-400">
            <Clock size={12} /> Scheduled for{" "}
            {new Date(video.scheduledAt as string).toLocaleString()}
          </p>
        )}

        {video.caption && (
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-300">{video.caption}</p>
        )}

        {video.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {video.hashtags.map((t) => (
              <span key={t} className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-4">
            <button
                onClick={handleLike}
              aria-label="Like"
                disabled={liking}
                className="flex items-center gap-1 text-xs text-zinc-300 transition-transform active:scale-75 disabled:opacity-60"
            >
              <Heart
                size={20}
                className={video.likedByMe ? "fill-pink-500 text-pink-500" : "text-zinc-300"}
              />
              {video.likeCount > 0 && (
                <span className="font-semibold">{formatCount(video.likeCount)}</span>
              )}
            </button>

            <CommentsSheet
              postId={video.id}
              commentsDisabled={!!video.commentsOff}
              onCountChange={setCommentCount}
            >
              <button
                aria-label="Comments"
                className="flex items-center gap-1 text-xs text-zinc-300 transition-transform active:scale-75"
              >
                <MessageCircle size={20} />
                {commentCount > 0 && (
                  <span className="font-semibold">{formatCount(commentCount)}</span>
                )}
              </button>
            </CommentsSheet>

            <ShareSheet title={video.title} url={shareUrl} media={video.mediaUrl} mediaKind="video">
              <button aria-label="Share" className="text-zinc-300 transition-transform active:scale-75">
                <Send size={18} />
              </button>
            </ShareSheet>

          </div>

          <button
            onClick={handleSave}
            aria-label="Save"
            className="text-zinc-300 transition-transform active:scale-75"
          >
            <Bookmark size={20} className={isSaved ? "fill-white text-white" : "text-zinc-300"} />
          </button>
        </div>
      </div>
    </article>
  );
}
