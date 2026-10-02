import { useEffect, useState, type ReactNode } from "react";
import {
  Download,
  MessageCircle,
  Share2,
  ThumbsDown,
  ThumbsUp,
  UserRound,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VideoPoster } from "@/components/yw/VideoPoster";
import { DownloadSheet, type DownloadChoice } from "@/components/yw/DownloadSheet";
import { ShareSheet } from "@/components/yw/ShareSheet";
import { CommentsSheet } from "@/components/yw/CommentsSheet";
import { resolveMediaUrl } from "@/lib/social-data";
import { canAutoplayPublicVideo } from "@/lib/video-playback-engine";
import type { DownloadQualityUrls, VideoQualityTier } from "@/lib/video-quality";
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
  disliked: boolean;
  following: boolean;
  isOwner: boolean;
  isSwitching: boolean;
  isLiking: boolean;
  isDownloading: boolean;
  sourceMediaUrl: string | null;
  sourceQualityTier?: VideoQualityTier | null;
  qualityMediaUrls?: DownloadQualityUrls | null;
  onLike: () => void;
  onDislike: () => void;
  onFollow: () => void;
  onDownload: (choice: DownloadChoice) => void | Promise<void>;
  onSelectVideo: (video: LongVideo) => void;
  recommendationsFooter?: ReactNode;
};

function useResolvedMediaUrl(
  source: string | null | undefined,
  bucket: "avatars" | "videos",
) {
  const directUrl = source && /^https?:\/\//i.test(source) ? source : null;
  const [resolved, setResolved] = useState<string | null>(directUrl);

  useEffect(() => {
    let active = true;
    setResolved(directUrl);
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
  }, [bucket, directUrl, source]);

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
  priority,
}: {
  video: LongVideo;
  onSelect: (video: LongVideo) => void;
  priority: boolean;
}) {
  return (
    <button
      type="button"
      data-testid={`video-recommendation-${video.id}`}
      onClick={() => onSelect(video)}
      className="group flex w-full items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-2.5 text-left transition-colors hover:border-white/[0.12] hover:bg-white/[0.06] active:bg-white/[0.1]"
    >
      <span className="relative block aspect-video w-[58%] max-w-[280px] shrink-0 overflow-hidden rounded-xl bg-zinc-900">
        <VideoPoster
          thumbnailUrl={video.thumbnailUrl}
          mediaUrl={video.mediaUrl}
          alt=""
          loading="eager"
          fetchPriority={priority ? "high" : "auto"}
          bucket="videos"
          posterOnly
          allowFrameFallback={canAutoplayPublicVideo(video.access, video.price)}
          showPlayFallback={false}
          showLoadingShimmer={false}
          className="absolute inset-0"
        />
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/85 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white">
          {formatDuration(video.durationSeconds ?? 0)}
        </span>
      </span>
      <span className="min-w-0 flex-1 pt-1">
        <span className="line-clamp-2 block text-[14px] font-semibold leading-snug text-white">
          {video.title}
        </span>
        <span className="mt-2 block truncate text-[12px] text-zinc-400">
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
  disliked,
  following,
  isOwner,
  isSwitching,
  isLiking,
  isDownloading,
  sourceMediaUrl,
  sourceQualityTier,
  qualityMediaUrls,
  onLike,
  onDislike,
  onFollow,
  onDownload,
  onSelectVideo,
  recommendationsFooter,
}: Props) {
  const [commentCount, setCommentCount] = useState(video.commentCount);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const shareUrl =
    typeof window === "undefined"
      ? undefined
      : buildWatchShareUrl(video.id, "video");
  const caption = video.caption.trim();

  useEffect(() => {
    setCommentCount(video.commentCount);
  }, [video.id, video.commentCount]);

  return (
    <main className="min-h-full bg-[#0b0b0d] px-3 pb-8 pt-0 text-white sm:px-4">
      {isSwitching ? (
        <div className="mb-2 flex items-center gap-2 text-xs text-zinc-400" role="status">
          <span className="h-3 w-3 animate-spin rounded-full border border-white/20 border-t-white/80" />
          Loading selected video…
        </div>
      ) : null}

      <section aria-label="Video details" className="space-y-2">
        <h1 className="text-[17px] font-bold leading-snug tracking-[-0.01em]">
          {video.title}
        </h1>
        <p className="text-xs text-zinc-400">
          {formatViews(video.views)}
          <span className="mx-1.5 text-zinc-600" aria-hidden="true">·</span>
          {timeAgo(video.createdAt)}
        </p>
        {caption && caption.toLowerCase() !== video.title.trim().toLowerCase() ? (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-300">
            {caption}
          </p>
        ) : null}

        <div className="flex items-center gap-3 border-y border-white/[0.08] py-2">
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

        <div
          data-testid="video-action-row"
          aria-label="Video actions"
          className="grid w-full grid-cols-4 gap-1 border-b border-white/10 pb-2"
        >
          <button
            type="button"
            data-testid="button-like-video"
            aria-label="Like video"
            aria-pressed={liked}
            disabled={isSwitching || isLiking}
            onClick={onLike}
            className={`inline-flex h-9 w-full min-w-0 items-center justify-center gap-0.5 rounded-full border border-white/10 bg-white/10 px-1 text-[9px] font-semibold tracking-tight shadow-sm backdrop-blur-md transition-all hover:bg-white/20 disabled:opacity-50 sm:text-[10px] ${
              liked ? "text-pink-300" : "text-white"
            }`}
          >
            <ThumbsUp className="h-3.5 w-3.5 shrink-0" fill={liked ? "currentColor" : "none"} />
            <span>Like</span>
          </button>

          <button
            type="button"
            data-testid="button-dislike-video"
            aria-label="Dislike video"
            aria-pressed={disliked}
            disabled={isSwitching || isLiking}
            onClick={onDislike}
            className={`inline-flex h-9 w-full min-w-0 items-center justify-center gap-0.5 rounded-full border border-white/10 bg-white/10 px-1 text-[9px] font-semibold tracking-tight shadow-sm backdrop-blur-md transition-all hover:bg-white/20 disabled:opacity-50 sm:text-[10px] ${
              disliked ? "text-pink-300" : "text-white"
            }`}
          >
            <ThumbsDown className="h-3.5 w-3.5 shrink-0" fill={disliked ? "currentColor" : "none"} />
            <span>Dislike</span>
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
              data-testid="button-share-video"
              aria-label="Share video"
              disabled={isSwitching}
              className="inline-flex h-9 w-full min-w-0 items-center justify-center gap-0.5 rounded-full border border-white/10 bg-white/10 px-1 text-[9px] font-semibold tracking-tight text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20 disabled:opacity-50 sm:text-[10px]"
            >
              <Share2 className="h-3.5 w-3.5 shrink-0" />
              <span>Share</span>
            </button>
          </ShareSheet>

          <button
            type="button"
            data-testid="button-download-video"
            aria-label="Download video"
            disabled={isSwitching || isDownloading || !sourceMediaUrl}
            onClick={() => setDownloadOpen(true)}
            className="inline-flex h-9 w-full min-w-0 items-center justify-center gap-0.5 rounded-full border border-white/10 bg-white/10 px-1 text-[9px] font-semibold tracking-tight text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20 disabled:opacity-50 sm:text-[10px]"
          >
            {isDownloading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
            ) : (
              <Download className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{isDownloading ? "Saving…" : "Download"}</span>
          </button>
        </div>

        <DownloadSheet
          open={downloadOpen}
          onOpenChange={setDownloadOpen}
          title={video.title || "YourWorld video"}
          durationSeconds={video.durationSeconds}
          sourceQualityTier={sourceQualityTier ?? undefined}
          qualityMediaUrls={qualityMediaUrls ?? undefined}
          sourceMediaUrl={sourceMediaUrl ?? undefined}
          mediaBucket="videos"
          onDownload={onDownload}
        />
      </section>

      <section aria-label="Comments" className="mt-2 border-b border-white/[0.08] pb-2">
        <CommentsSheet
          postId={video.id}
          commentsDisabled={Boolean(video.commentsOff)}
          onCountChange={setCommentCount}
        >
          <button
            type="button"
            data-testid="button-video-comments"
            disabled={isSwitching}
            className="flex w-full items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-2 text-left transition hover:bg-white/[0.09] disabled:opacity-50"
          >
            <MessageCircle className="h-5 w-5 shrink-0 text-zinc-300" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-white">
                {formatCount(commentCount)} {commentCount === 1 ? "comment" : "comments"}
              </span>
              <span className="mt-0.5 block truncate text-xs text-zinc-400">
                {video.commentsOff ? "Comments are turned off" : "Read and add a comment"}
              </span>
            </span>
          </button>
        </CommentsSheet>
      </section>

      <section aria-labelledby="video-recommendations-title" className="mt-3">
        <h2 id="video-recommendations-title" className="mb-2 text-sm font-bold">
          Recommended videos
        </h2>
        {recommendations.length > 0 ? (
          <div className="space-y-2.5">
            {recommendations.map((item, index) => (
              <RecommendationRow
                key={item.id}
                video={item}
                onSelect={onSelectVideo}
                priority={index < 3}
              />
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