import { useEffect, useId, useRef, useState } from "react";
import {
  Eye, Heart, Clock, MessageCircle, Send,
  MoreHorizontal, Trash2, EyeOff, Flag, UserX, VolumeX,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  formatViews,
  timeAgo,
  type LongVideo,
} from "@/lib/video-data";
import { formatVideoDuration } from "@/lib/video-duration";
import { deleteMyPost } from "@/lib/profile-data";
import { CommentsSheet } from "@/components/yw/CommentsSheet";
import { ShareSheet } from "@/components/yw/ShareSheet";
import {
  FeedVideoMuteButton,
  FeedVideoPreview,
  useFeedVideoAutoplay,
} from "@/components/yw/FeedVideoAutoplay";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCount } from "@/lib/yw-data";
import { useYw } from "@/lib/yw-store";
import { useAuth, useResumeAuthAction } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { resolveMediaUrl, type DbPost } from "@/lib/social-data";
import { buildWatchShareUrl } from "@/lib/watch-links";
import { requestVideoResume } from "@/lib/video-resume";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  announceVideoCreatorMuted,
  announceVideoPostSuppressed,
  markPostNotInterested,
  muteVideoCreator,
  submitVideoReport,
} from "@/lib/video-context-actions";
import { setLongVideoCreatorHidden } from "@/lib/long-video-preferences";
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

type Props = {
  video: LongVideo;
  prefetchNextVideos?: Array<Pick<LongVideo, "mediaUrl" | "access" | "durationSeconds">>;
  onView: (id: string) => void | Promise<unknown>;
  onLike: (id: string) => void | Promise<unknown>;
  currentUserId?: string | null;
  initialResumeTime?: number | null;
  onDeleted?: (id: string) => void;
  onEdited?: (post: DbPost) => void;
};

function CreatorAvatar({
  avatarUrl,
  name,
  letter,
}: {
  avatarUrl?: string | null;
  name: string;
  letter: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setSrc(null);
    if (!avatarUrl) return () => { alive = false; };

    void resolveMediaUrl(avatarUrl, "avatars")
      .then((url) => {
        if (alive) setSrc(url || avatarUrl);
      })
      .catch(() => {
        if (alive) setSrc(null);
      });

    return () => {
      alive = false;
    };
  }, [avatarUrl]);

  return (
    <Avatar className="h-9 w-9 shrink-0 ring-1 ring-white/10">
      <AvatarImage src={src ?? undefined} alt="" />
      <AvatarFallback className="bg-[#8b2fc9] text-[11px] font-bold text-white">
        {letter || name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

/** Feed card for long-form videos — supports 16:9 and 9:16 playback. */
export function LongVideoCard({
  video,
  prefetchNextVideos,
  onLike,
  currentUserId = null,
  initialResumeTime,
  onDeleted,
}: Props) {
  const navigate = useNavigate();
  const previewId = `feed:${video.id}:${useId()}`;
  const { stopCandidate } = useFeedVideoAutoplay();
  const normalizedTitle =
    (typeof video.title === "string" ? video.title : "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  const normalizedCaption =
    (typeof video.caption === "string" ? video.caption : "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  const showCaption = normalizedCaption.length > 0 && normalizedCaption !== normalizedTitle;
  const { following, toggleFollow } = useYw();
  const { user, requestAuthAction } = useAuth();
  const [hidden, setHidden] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Inappropriate content");
  const [reporting, setReporting] = useState(false);
  const [contextActionBusy, setContextActionBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [commentCount, setCommentCount] = useState(video.commentCount);
  const [liking, setLiking] = useState(false);
  const likingRef = useRef(false);
  const viewerId = currentUserId ?? user?.id ?? null;
  const isMine = viewerId === video.userId;
  const isFollowing = !!following[video.userId];
  const shareUrl =
    typeof window !== "undefined" ? buildWatchShareUrl(video.id, "video") : undefined;

  const handleLike = async () => {
    if (!user?.id && !currentUserId) {
      requestAuthAction({ type: "post-like", targetId: video.id });
      return;
    }
    if (likingRef.current || liking) return;
    likingRef.current = true;
    setLiking(true);
    try {
      await onLike(video.id);
    } catch {
      toast.error("Couldn't update like");
    } finally {
      likingRef.current = false;
      setLiking(false);
    }
  };

  const handleFollow = () => {
    if (!user?.id && !currentUserId) {
      requestAuthAction({ type: "follow-user", targetId: video.userId });
      return;
    }
    void toggleFollow(video.userId);
  };

  useResumeAuthAction("post-like", video.id, () => {
    void onLike(video.id);
  });
  useResumeAuthAction("follow-user", video.userId, () => {
    void toggleFollow(video.userId);
  });

  const handleNotInterested = async () => {
    setMenuOpen(false);
    if (!viewerId || contextActionBusy) {
      if (!viewerId) toast.error("Sign in to update your feed");
      return;
    }
    setContextActionBusy(true);
    try {
      await markPostNotInterested(viewerId, video.id);
      announceVideoPostSuppressed(video.id);
      setHidden(true);
      toast.success("We'll show fewer posts like this");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update your feed");
    } finally {
      setContextActionBusy(false);
    }
  };

  const handleDontRecommendCreator = async () => {
    setMenuOpen(false);
    if (!viewerId || contextActionBusy) {
      if (!viewerId) toast.error("Sign in to update your feed");
      return;
    }
    setContextActionBusy(true);
    try {
      await setLongVideoCreatorHidden(viewerId, video.userId, true);
      setHidden(true);
      toast.success("We'll show fewer posts like this");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update your feed");
    } finally {
      setContextActionBusy(false);
    }
  };

  const handleMuteCreator = async () => {
    setMenuOpen(false);
    if (!viewerId || contextActionBusy) {
      if (!viewerId) toast.error("Sign in to mute creators");
      return;
    }
    setContextActionBusy(true);
    try {
      await muteVideoCreator(viewerId, video.userId);
      announceVideoCreatorMuted(video.userId);
      setHidden(true);
      toast.success("Creator muted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't mute this creator");
    } finally {
      setContextActionBusy(false);
    }
  };

  const handleReport = async () => {
    setMenuOpen(false);
    if (!viewerId || reporting) {
      if (!viewerId) toast.error("Sign in to report videos");
      return;
    }
    setReporting(true);
    try {
      await submitVideoReport({
        reporterId: viewerId,
        creatorId: video.userId,
        postId: video.id,
        reason: reportReason,
      });
      setReportOpen(false);
      toast.success("Report submitted. Thank you for keeping our community safe.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't submit this report");
    } finally {
      setReporting(false);
    }
  };

  const handleDelete = async () => {
    if (!isMine || deleting) return;
    setDeleting(true);
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
      setDeleteOpen(false);
      toast.success("Video deleted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't delete this video");
    } finally {
      setDeleting(false);
    }
  };

  const upcoming =
    !!video.scheduledAt && new Date(video.scheduledAt).getTime() > Date.now();
  const formattedDuration = formatVideoDuration(video.durationSeconds);

  if (hidden) return null;

  const openVideo = () => {
    if (typeof video.id !== "string" || !video.id.trim()) return;
    stopCandidate(previewId);
    if (
      typeof initialResumeTime === "number" &&
      Number.isFinite(initialResumeTime) &&
      initialResumeTime > 0
    ) {
      requestVideoResume(video.id, initialResumeTime);
    }
    void navigate({
      to: "/video/$videoId",
      params: { videoId: video.id },
    });
  };

  return (
    <>
    <article
      className="feed-post-card overflow-hidden bg-[#141418]"
    >
      <div className="relative">
      <div className="relative bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950">
        <div
          className={cn(
            "m-0 w-full overflow-hidden p-0",
            video.orientation === "portrait"
              ? "relative mx-auto aspect-[9/16] touch-pan-y bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950"
              : "aspect-[16/9] touch-pan-y feed-post-video-frame",
          )}
          style={
            video.orientation === "portrait"
              ? { width: "min(100%, 39.375vh)" }
              : undefined
          }
        >
          <FeedVideoPreview
            video={video}
            candidateId={previewId}
            prefetchNextVideos={prefetchNextVideos}
            onOpen={openVideo}
            className="m-0 select-none p-0"
          />
          {formattedDuration && (
            <span
              data-testid={`badge-video-duration-${video.id}`}
              className="pointer-events-none absolute bottom-2 left-2 right-auto rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold"
            >
              {formattedDuration}
            </span>
          )}
        </div>
      </div>
      <FeedVideoMuteButton
        candidateId={previewId}
        title={video.title}
        className="right-3 top-auto bottom-3 z-20"
      />
      </div>

      <div className="flex items-start gap-2.5 px-3 py-2.5">
        <Link
          to="/u/$userId"
          params={{ userId: video.userId }}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Open ${video.author.name}'s profile`}
          className="mt-0.5 shrink-0 transition-opacity active:opacity-70"
        >
          <CreatorAvatar
            avatarUrl={video.author.avatarUrl}
            name={video.author.name}
            letter={video.author.letter}
          />
        </Link>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              openVideo();
            }}
            className="line-clamp-2 cursor-pointer select-none text-left text-[14px] font-bold leading-snug text-white"
          >
            {video.title}
          </button>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-zinc-400">
            <Link
              to="/u/$userId"
              params={{ userId: video.userId }}
              onClick={(event) => event.stopPropagation()}
              className="font-semibold text-zinc-200 transition-opacity active:opacity-70"
            >
              {video.author.name}
            </Link>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Eye size={12} /> {formatViews(video.views)}
            </span>
            <span aria-hidden="true">·</span>
            <span>{timeAgo(video.createdAt)}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {!isMine && (
            <button
              type="button"
              onClick={handleFollow}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-semibold transition-all active:scale-95",
                isFollowing
                  ? "bg-pink-500/15 text-pink-200 ring-1 ring-inset ring-pink-400/30"
                  : "bg-pink-500 text-white",
              )}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
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
              {!isMine && (
                <DropdownMenuItem onClick={() => void handleNotInterested()}>
                  <EyeOff className="mr-2 h-4 w-4" /> Not Interested
                </DropdownMenuItem>
              )}
              {!isMine && (
                <DropdownMenuItem onClick={() => void handleDontRecommendCreator()}>
                  <UserX className="mr-2 h-4 w-4" /> Don't Recommend Creator
                </DropdownMenuItem>
              )}
              {!isMine && (
                <DropdownMenuItem onClick={() => void handleMuteCreator()}>
                  <VolumeX className="mr-2 h-4 w-4" /> Mute Creator
                </DropdownMenuItem>
              )}
              {!isMine && (
                <DropdownMenuItem
                  onClick={() => {
                    setMenuOpen(false);
                    setReportOpen(true);
                  }}
                >
                  <Flag className="mr-2 h-4 w-4" /> Report
                </DropdownMenuItem>
              )}
              {isMine && (
                <DropdownMenuItem
                  onClick={() => {
                    setMenuOpen(false);
                    setDeleteOpen(true);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete video
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-2 px-3 pb-3">
        {upcoming && (
          <p className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-[11px] font-semibold text-amber-400">
            <Clock size={12} /> Scheduled for{" "}
            {new Date(video.scheduledAt as string).toLocaleString()}
          </p>
        )}

        {showCaption && (
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

            <ShareSheet
              title={video.title}
              url={shareUrl}
              media={video.mediaUrl}
              mediaKind="video"
              contentId={video.id}
              contentKind="video"
              thumbnailUrl={video.thumbnailUrl}
              thumbnailBucket="thumbnails"
            >
              <button aria-label="Share" className="text-zinc-300 transition-transform active:scale-75">
                <Send size={18} />
              </button>
            </ShareSheet>

          </div>

        </div>
      </div>
    </article>
    <AlertDialog open={reportOpen} onOpenChange={(open) => !reporting && setReportOpen(open)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Report this video</AlertDialogTitle>
          <AlertDialogDescription>
            Choose the reason that best describes this video.
          </AlertDialogDescription>
          <select
            aria-label="Report reason"
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value)}
            className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option>Inappropriate content</option>
            <option>Spam or misleading</option>
            <option>Harassment or hate</option>
            <option>Violence or dangerous acts</option>
            <option>Other</option>
          </select>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={reporting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={reporting}
            onClick={(event) => {
              event.preventDefault();
              void handleReport();
            }}
          >
            {reporting ? "Submitting…" : "Submit report"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={deleteOpen} onOpenChange={(open) => !deleting && setDeleteOpen(open)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this video?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this video?
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
