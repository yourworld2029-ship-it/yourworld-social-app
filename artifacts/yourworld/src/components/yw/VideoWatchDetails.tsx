import { useEffect, useState, type ReactNode } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Download,
  Heart,
  MoreVertical,
  Share2,
  UserRound,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShareSheet } from "@/components/yw/ShareSheet";
import { resolveMediaUrl } from "@/lib/social-data";
import {
  formatDuration,
  formatViews,
  timeAgo,
  type LongVideo,
} from "@/lib/video-data";
import { formatCount } from "@/lib/yw-data";
import { buildWatchShareUrl } from "@/lib/watch-links";

type Props = {
  video: LongVideo;
  recommendations: LongVideo[];
  liked: boolean;
  likeCount: number;
  following: boolean;
  isOwner: boolean;
  isSaved: boolean;
  isSwitching: boolean;
  isLiking: boolean;
  isDownloading: boolean;
  onLike: () => void;
  onFollow: () => void;
  onDownload: () => void;
  onCopyLink: () => void;
  onToggleSave: () => void;
  onOpenCreator: () => void;
  onSelectVideo: (video: LongVideo) => void;
  recommendationsFooter?: ReactNode;
};

function useResolvedMediaUrl(
  source: string | null | undefined,
  bucket: "avatars" | "videos",
) {
  const [resolved, setResolved] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setResolved(null);
    if (!source) return () => { active = false; };

    void resolveMediaUrl(source, bucket)
      .then((url) => {
        if (active) setResolved(url || source);
      })
      .catch(() => {
        if (active) setResolved(source);
      });

    return () => {
      active = false;
    };
  }, [bucket, source]);

  return resolved;
}

function CreatorAvatar({
  video,
  size = "h-11 w-11",
}: {
  video: LongVideo;
  size?: string;
}) {
  const avatarUrl = useResolvedMediaUrl(video.author.avatarUrl, "avatars");

  return (
    <Avatar className={`${size} shrink-0 ring-1 ring-white/10`}>
      <AvatarImage src={avatarUrl ?? undefined} alt="" />
      <AvatarFallback className="bg-fuchsia-700 text-sm font-bold text-white">
        {video.author.letter || video.author.name.charAt(0).toUpperCase() || <UserRound />}
      </AvatarFallback>
    </Avatar>
  );
}

function RecommendationRow({
  video,
  onSelect,
}: {
  video: LongVideo;
  onSelect: (video: LongVideo) => void;
}) {
  const thumbnailUrl = useResolvedMediaUrl(video.thumbnailUrl, "videos");
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  useEffect(() => setThumbnailFailed(false), [thumbnailUrl]);

  return (
    <button
      type="button"
      data-testid={`video-recommendation-${video.id}`}
      onClick={() => onSelect(video)}
      className="group flex w-full items-start gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-white/[0.06] active:bg-white/[0.1]"
    >
      <span className="relative block aspect-video w-[42%] max-w-[190px] shrink-0 overflow-hidden rounded-lg bg-zinc-900">
        {thumbnailUrl && !thumbnailFailed ? (
          <img
            src={thumbnailUrl}
            alt=""
            loading="lazy"
            onError={() => setThumbnailFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center bg-gradient-to-br from-zinc-800 to-zinc-950">
            <span className="h-2 w-2 rounded-full bg-white/40" aria-hidden="true" />
          </span>
        )}
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/85 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white">
          {formatDuration(video.durationSeconds ?? 0)}
        </span>
      </span>
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="line-clamp-2 block text-[13px] font-semibold leading-snug text-white">
          {video.title}
        </span>
        <span className="mt-1.5 block truncate text-[11px] text-zinc-400">
          {video.author.name}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-zinc-500">
          {formatViews(video.views)}
        </span>
      </span>
    </button>
  );
}

export function VideoWatchDetails({
  video,
  recommendations,
  liked,
  likeCount,
  following,
  isOwner,
  isSaved,
  isSwitching,
  isLiking,
  isDownloading,
  onLike,
  onFollow,
  onDownload,
  onCopyLink,
  onToggleSave,
  onOpenCreator,
  onSelectVideo,
  recommendationsFooter,
}: Props) {
  const shareUrl =
    typeof window === "undefined"
      ? undefined
      : buildWatchShareUrl(video.id, "video");

  return (
    <main className="min-h-full bg-[#0b0b0d] px-3 pb-8 pt-3 text-white sm:px-4">
      {isSwitching ? (
        <div className="mb-2 flex items-center gap-2 text-xs text-zinc-400" role="status">
          <span className="h-3 w-3 animate-spin rounded-full border border-white/20 border-t-white/80" />
          Loading selected video…
        </div>
      ) : null}

      <section aria-label="Video details" className="space-y-3">
        <h1 className="text-[17px] font-bold leading-snug tracking-[-0.01em]">
          {video.title}
        </h1>
        <p className="text-xs text-zinc-400">
          {formatViews(video.views)}
          <span className="mx-1.5 text-zinc-600" aria-hidden="true">·</span>
          {timeAgo(video.createdAt)}
        </p>

        <div className="flex items-center gap-3 border-y border-white/[0.08] py-3">
          <Link
            to="/u/$userId"
            params={{ userId: video.userId }}
            aria-label={`Open ${video.author.name}'s channel`}
            className="shrink-0"
          >
            <CreatorAvatar video={video} />
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              to="/u/$userId"
              params={{ userId: video.userId }}
              className="block truncate text-sm font-semibold text-white"
            >
              {video.author.name}
            </Link>
            <span className="block truncate text-xs text-zinc-400">
              @{video.author.username}
            </span>
          </div>
          {!isOwner ? (
            <button
              type="button"
              data-testid="button-video-follow"
              disabled={isSwitching}
              onClick={onFollow}
              className={`min-w-[92px] rounded-full px-4 py-2 text-xs font-bold transition active:scale-[0.97] disabled:opacity-50 ${
                following
                  ? "border border-white/15 bg-white/[0.08] text-white"
                  : "bg-white text-black hover:bg-white/90"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
          ) : null}
        </div>

        <div className="flex items-stretch gap-2" aria-label="Video actions">
          <button
            type="button"
            data-testid="button-video-like"
            aria-label={`${liked ? "Unlike" : "Like"} video`}
            aria-pressed={liked}
            disabled={isSwitching || isLiking}
            onClick={onLike}
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl bg-white/[0.07] py-2.5 transition hover:bg-white/[0.11] active:scale-[0.98] disabled:opacity-50"
          >
            <span className="flex items-center gap-1.5">
              <Heart className={`h-[18px] w-[18px] ${liked ? "fill-pink-500 text-pink-500" : "text-white"}`} />
              <span className="text-xs font-semibold tabular-nums">{formatCount(likeCount)}</span>
            </span>
            <span className="text-[10px] text-zinc-300">Like</span>
          </button>

          <ShareSheet
            title={video.title}
            url={shareUrl}
            media={video.mediaUrl}
            mediaKind="video"
            contentId={video.id}
            contentKind="video"
            thumbnailUrl={video.thumbnailUrl}
            thumbnailBucket="videos"
          >
            <button
              type="button"
              data-testid="button-video-share"
              disabled={isSwitching}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl bg-white/[0.07] py-2.5 transition hover:bg-white/[0.11] active:scale-[0.98] disabled:opacity-50"
            >
              <Share2 className="h-[18px] w-[18px]" aria-hidden="true" />
              <span className="text-[10px] text-zinc-300">Share</span>
            </button>
          </ShareSheet>

          <button
            type="button"
            data-testid="button-video-download"
            disabled={isSwitching || isDownloading}
            onClick={onDownload}
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl bg-white/[0.07] py-2.5 transition hover:bg-white/[0.11] active:scale-[0.98] disabled:opacity-50"
          >
            {isDownloading ? (
              <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/25 border-t-white" />
            ) : (
              <Download className="h-[18px] w-[18px]" />
            )}
            <span className="text-[10px] text-zinc-300">
              {isDownloading ? "Saving…" : "Download"}
            </span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                data-testid="button-video-options"
                aria-label="More video options"
                disabled={isSwitching}
                className="flex w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-xl bg-white/[0.07] py-2.5 transition hover:bg-white/[0.11] disabled:opacity-50"
              >
                <MoreVertical className="h-[18px] w-[18px]" />
                <span className="text-[10px] text-zinc-300">More</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={onCopyLink}>
                Copy video link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleSave}>
                {isSaved ? (
                  <BookmarkCheck className="mr-2 h-4 w-4" />
                ) : (
                  <Bookmark className="mr-2 h-4 w-4" />
                )}
                {isSaved ? "Remove from saved" : "Save to watch later"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenCreator}>
                Open creator channel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>

      <section aria-labelledby="video-recommendations-title" className="mt-5">
        <h2 id="video-recommendations-title" className="mb-2 text-sm font-bold">
          Recommended videos
        </h2>
        {recommendations.length > 0 ? (
          <div className="space-y-1">
            {recommendations.map((item) => (
              <RecommendationRow key={item.id} video={item} onSelect={onSelectVideo} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-white/[0.04] px-3 py-5 text-center text-xs text-zinc-400">
            No other videos are available right now.
          </p>
        )}
        {recommendationsFooter}
      </section>
    </main>
  );
}