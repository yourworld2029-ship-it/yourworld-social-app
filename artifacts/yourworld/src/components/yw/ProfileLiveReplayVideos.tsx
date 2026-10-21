import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, Flag, MoreVertical, Play, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-store";
import { loadLongVideosByIds, formatViews, timeAgo, type LongVideo } from "@/lib/video-data";
import { sharePublicContent } from "@/lib/share-public";
import {
  loadLiveReplays,
  ensureLiveReplayPoster,
  makeLiveReplayPermanent,
  reportLiveReplay,
  type LiveReplay,
} from "@/lib/live-replay.data";

const REPORT_REASONS = [
  "Inappropriate content / Nudity",
  "Spam or Scam",
  "Hate speech or Harassment",
  "Intellectual Property / Copyright",
] as const;

type ReplayVideo = {
  replay: LiveReplay;
  video: LongVideo;
};

export function ProfileLiveReplayVideos({
  broadcasterId,
  isOwner,
  initialReplayId,
  onPromoted,
}: {
  broadcasterId: string;
  isOwner: boolean;
  initialReplayId?: string;
  onPromoted?: () => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ReplayVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<ReplayVideo | null>(null);
  const [reportReason, setReportReason] = useState<string>(REPORT_REASONS[0]);
  const [reportBusy, setReportBusy] = useState(false);
  const initialReplayHandledRef = useRef(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(null);
    void (async () => {
      let replays = await loadLiveReplays(broadcasterId);
      if (isOwner) {
        let upgradedLegacyReplays = false;
        for (const replay of replays) {
          if (replay.post_id) continue;
          try {
            await makeLiveReplayPermanent(replay);
            upgradedLegacyReplays = true;
          } catch (cause) {
            console.warn("[live-replay] Could not link an older replay to Videos", cause);
          }
        }
        if (upgradedLegacyReplays) {
          replays = await loadLiveReplays(broadcasterId);
          onPromoted?.();
        }
      }

      if (isOwner) {
        replays = await Promise.all(
          replays.map((replay) =>
            ensureLiveReplayPoster(replay).catch((cause) => {
              console.warn("[live-replay] Could not create a thumbnail for an older replay", cause);
              return replay;
            }),
          ),
        );
      }

      const videos = await loadLongVideosByIds(
        replays.map((replay) => replay.post_id ?? replay.stream_id),
        { includeLiveReplays: true, bypassFeedSuppression: true },
      );
      if (!alive) return;
      const videosById = new Map(videos.map((video) => [video.id, video]));
      setItems(
        replays.flatMap((replay) => {
          const video = videosById.get(replay.post_id ?? replay.stream_id);
          if (!video) return [];
          return [{
            replay,
            video: {
              ...video,
              thumbnailUrl: video.thumbnailUrl ?? replay.poster_url,
            },
          }];
        }),
      );
    })()
      .catch((cause: unknown) => {
        if (!alive) return;
        setLoadError(
          cause instanceof Error ? cause.message : "Live videos could not be loaded.",
        );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [broadcasterId, isOwner, onPromoted]);

  useEffect(() => {
    if (!initialReplayId || loading || initialReplayHandledRef.current) return;
    const item = items.find(
      (entry) =>
        entry.replay.id === initialReplayId || entry.video.id === initialReplayId,
    );
    if (!item) return;
    initialReplayHandledRef.current = true;
    void navigate({
      to: "/video/$videoId",
      params: { videoId: item.video.id },
    });
  }, [initialReplayId, items, loading, navigate]);

  const openVideo = (video: LongVideo) => {
    void navigate({
      to: "/video/$videoId",
      params: { videoId: video.id },
    });
  };

  const shareVideo = async (video: LongVideo) => {
    try {
      const result = await sharePublicContent({
        title: video.title,
        text: `Watch ${video.title} on YourWorld`,
        url: `/video/${encodeURIComponent(video.id)}`,
        dialogTitle: "Share video",
      });
      if (result === "copied") toast.success("Video link copied");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not share this video.");
    }
  };

  const submitReport = async () => {
    if (!reportTarget || !user?.id || reportBusy) return;
    setReportBusy(true);
    try {
      await reportLiveReplay({
        replay: reportTarget.replay,
        reporterId: user.id,
        reason: reportReason,
      });
      setReportTarget(null);
      toast.success("Report submitted. Thank you for making our community safe.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "The report could not be submitted.");
    } finally {
      setReportBusy(false);
    }
  };

  if (loading) {
    return (
      <ul className="space-y-2 px-3 py-4 sm:px-4" role="status" aria-busy="true" aria-label="Loading live videos">
        {[0, 1, 2].map((index) => (
          <li key={index} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-2">
            <span className="aspect-video w-[40%] max-w-44 shrink-0 animate-pulse rounded-lg bg-white/[0.08]" />
            <span className="min-w-0 flex-1 space-y-2">
              <span className="block h-3.5 w-4/5 animate-pulse rounded bg-white/[0.08]" />
              <span className="block h-3 w-3/5 animate-pulse rounded bg-white/[0.06]" />
              <span className="block h-3 w-2/5 animate-pulse rounded bg-white/[0.06]" />
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (loadError) {
    return <p className="px-4 py-14 text-center text-sm text-rose-300" role="alert">{loadError}</p>;
  }

  if (items.length === 0) {
    return <p className="px-4 py-14 text-center text-sm text-muted-foreground">No live replays available</p>;
  }

  return (
    <>
      <ul data-testid="list-profile-live-videos" className="space-y-2 px-3 py-4 sm:px-4">
        {items.map(({ replay, video }) => {
          const title = video.title.trim() || replay.title || "Live replay";
          const creator = video.author.name.trim() || `@${video.author.username}`;
          return (
            <li
              key={replay.id}
              data-testid={`card-profile-live-video-${video.id}`}
              className="flex min-w-0 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.035] p-2 transition-colors hover:border-white/[0.13] hover:bg-white/[0.055]"
            >
              <button
                type="button"
                aria-label={`Play ${title}`}
                onClick={() => openVideo(video)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="relative aspect-video w-[40%] max-w-44 min-w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
                  <span className="absolute inset-0 grid place-items-center bg-gradient-to-br from-violet-950 via-zinc-900 to-zinc-950">
                    <Play className="h-6 w-6 fill-white text-white" aria-hidden="true" />
                  </span>
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                  <span className="absolute left-1.5 top-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                    Replay
                  </span>
                </span>
                <span className="min-w-0 flex-1 self-stretch py-0.5">
                  <span className="line-clamp-2 font-display text-[13px] font-semibold leading-[1.25] text-white sm:text-sm">
                    {title}
                  </span>
                  <span className="mt-1.5 block truncate text-[11px] text-zinc-400">
                    {creator}{video.author.username ? ` · @${video.author.username}` : ""}
                  </span>
                  <span className="mt-1 block truncate text-[10px] text-zinc-500">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" aria-hidden="true" />
                      {formatViews(video.views)}
                    </span>
                    <span aria-hidden="true"> • </span>
                    {timeAgo(video.createdAt)}
                  </span>
                </span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`More actions for ${title}`}
                    className="grid h-9 w-8 shrink-0 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  >
                    <MoreVertical className="h-[18px] w-[18px]" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 border-white/10 bg-zinc-950 text-white">
                  <DropdownMenuItem onSelect={() => void shareVideo(video)} className="gap-2 focus:bg-white/10 focus:text-white">
                    <Share2 className="h-4 w-4" aria-hidden="true" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => openVideo(video)} className="gap-2 focus:bg-white/10 focus:text-white">
                    <Play className="h-4 w-4" aria-hidden="true" />
                    Open video
                  </DropdownMenuItem>
                  {!isOwner ? (
                    <DropdownMenuItem
                      onSelect={() => {
                        setReportReason(REPORT_REASONS[0]);
                        setReportTarget({ replay, video });
                      }}
                      className="gap-2 focus:bg-white/10 focus:text-white"
                    >
                      <Flag className="h-4 w-4" aria-hidden="true" />
                      Report
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={Boolean(reportTarget)}
        onOpenChange={(open) => !reportBusy && !open && setReportTarget(null)}
      >
        <DialogContent className="border-white/10 bg-[#131116] text-white">
          <DialogTitle>Report this video</DialogTitle>
          <DialogDescription className="text-white/60">Choose the reason that best describes this video.</DialogDescription>
          <div role="radiogroup" aria-label="Report reason" className="grid gap-2">
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm ${
                  reportReason === reason
                    ? "border-fuchsia-400 bg-fuchsia-500/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <input
                  type="radio"
                  name="live-video-report-reason"
                  value={reason}
                  checked={reportReason === reason}
                  onChange={() => setReportReason(reason)}
                  className="accent-fuchsia-400"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void submitReport()}
            disabled={reportBusy || !user?.id}
            className="min-h-11 rounded-full bg-fuchsia-500 px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {reportBusy ? "Submitting…" : "Submit report"}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
