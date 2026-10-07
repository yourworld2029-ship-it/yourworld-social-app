import { useEffect, useId, useState } from "react";
import { Eye } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  formatViews,
  timeAgo,
  type LongVideo,
} from "@/lib/video-data";
import { formatVideoDuration } from "@/lib/video-duration";
import {
  FeedVideoPreview,
  useFeedVideoAutoplay,
} from "@/components/yw/FeedVideoAutoplay";
import { useYw } from "@/lib/yw-store";
import { useAuth, useResumeAuthAction } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/social-data";
import { requestVideoResume } from "@/lib/video-resume";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Props = {
  video: LongVideo;
  prefetchNextVideos?: Array<Pick<LongVideo, "mediaUrl" | "access" | "durationSeconds">>;
  currentUserId?: string | null;
  initialResumeTime?: number | null;
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
  currentUserId = null,
  initialResumeTime,
}: Props) {
  const navigate = useNavigate();
  const previewId = `feed:${video.id}:${useId()}`;
  const { stopCandidate } = useFeedVideoAutoplay();
  const { following, toggleFollow } = useYw();
  const { user, requestAuthAction } = useAuth();
  const viewerId = currentUserId ?? user?.id ?? null;
  const isMine = viewerId === video.userId;
  const isFollowing = !!following[video.userId];

  const handleFollow = () => {
    if (!user?.id && !currentUserId) {
      requestAuthAction({ type: "follow-user", targetId: video.userId });
      return;
    }
    void toggleFollow(video.userId);
  };

  useResumeAuthAction("follow-user", video.userId, () => {
    void toggleFollow(video.userId);
  });

  const formattedDuration = formatVideoDuration(video.durationSeconds);

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
        </div>
      </div>
    </article>
    </>
  );
}
