import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Download,
  Flag,
  Maximize2,
  MoreVertical,
  Share2,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
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
import { bindHlsNetworkAwareLevelCap, createVideoHlsConfig } from "@/lib/video-hls-config";
import { sharePublicContent } from "@/lib/share-public";
import { saveVideoToAndroidGallery } from "@/lib/reel-gallery";
import { clearLiveReplayRecording, loadLiveReplayRecording } from "@/lib/live-replay-recording";
import {
  createLiveReplaySourceUrl,
  deleteLiveReplay,
  downloadReplayBlob,
  isAndroidLiveReplayGallery,
  loadLiveReplays,
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

export function LiveReplaysTab({
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
  const [replays, setReplays] = useState<LiveReplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedReplay, setSelectedReplay] = useState<LiveReplay | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LiveReplay | null>(null);
  const [reportTarget, setReportTarget] = useState<LiveReplay | null>(null);
  const [reportReason, setReportReason] = useState<string>(REPORT_REASONS[0]);
  const [reportBusy, setReportBusy] = useState(false);
  const [busyReplayId, setBusyReplayId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(null);
    void loadLiveReplays(broadcasterId)
      .then((items) => {
        if (!alive) return;
        setReplays(items);
        if (initialReplayId) {
          setSelectedReplay(items.find((item) => item.id === initialReplayId) ?? null);
        }
      })
      .catch((cause: unknown) => {
        if (!alive) return;
        setLoadError(cause instanceof Error ? cause.message : "Live replays could not be loaded.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [broadcasterId, initialReplayId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const shareReplay = async (replay: LiveReplay) => {
    try {
      const result = await sharePublicContent({
        title: replay.title,
        text: `Watch ${replay.title} on YourWorld`,
        url: `/u/${encodeURIComponent(broadcasterId)}?tab=live&replay=${encodeURIComponent(replay.id)}`,
        dialogTitle: "Share live replay",
      });
      if (result === "copied") toast.success("Replay link copied");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not share this replay.");
    }
  };

  const saveToGallery = async (replay: LiveReplay) => {
    setBusyReplayId(replay.id);
    try {
      const localBlob = await loadLiveReplayRecording(replay.stream_id).catch(() => null);
      const blob =
        localBlob ??
        (await downloadReplayBlob(await createLiveReplaySourceUrl(replay)));
      const mimeType = blob.type.toLowerCase().split(";")[0];
      if (mimeType !== "video/mp4" && mimeType !== "video/webm") {
        throw new Error("This replay format cannot be saved to the phone gallery.");
      }
      if (isAndroidLiveReplayGallery()) {
        await saveVideoToAndroidGallery(
          blob,
          `${replay.title || "YourWorld live replay"}.${mimeType === "video/webm" ? "webm" : "mp4"}`,
          mimeType,
        );
      } else {
        const fileUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = `${replay.title || "YourWorld live replay"}.${mimeType === "video/webm" ? "webm" : "mp4"}`;
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
      }
      await deleteLiveReplay(replay.id);
      await clearLiveReplayRecording(replay.stream_id).catch(() => undefined);
      setReplays((items) => items.filter((item) => item.id !== replay.id));
      toast.success("Saved to gallery. Cloud replay removed.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "The replay was not saved or deleted.");
    } finally {
      setBusyReplayId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const replay = deleteTarget;
    setBusyReplayId(replay.id);
    try {
      await deleteLiveReplay(replay.id);
      await clearLiveReplayRecording(replay.stream_id).catch(() => undefined);
      setReplays((items) => items.filter((item) => item.id !== replay.id));
      setDeleteTarget(null);
      toast.success("Replay permanently deleted");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "The replay could not be deleted.");
    } finally {
      setBusyReplayId(null);
    }
  };

  const promoteReplay = async (replay: LiveReplay) => {
    setBusyReplayId(replay.id);
    try {
      await makeLiveReplayPermanent(replay);
      setReplays((items) => items.filter((item) => item.id !== replay.id));
      onPromoted?.();
      toast.success("Video moved to your Videos tab");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "The video could not be made permanent.");
    } finally {
      setBusyReplayId(null);
    }
  };

  const submitReport = async () => {
    if (!reportTarget || reportBusy) return;
    setReportBusy(true);
    try {
      const { data, error } = await (await import("@/integrations/supabase/client"))
        .supabase.auth.getUser();
      if (error || !data.user?.id) throw new Error("Sign in to report this replay.");
      await reportLiveReplay({
        replay: reportTarget,
        reporterId: data.user.id,
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
    return <p className="px-4 py-14 text-center text-sm text-muted-foreground">Loading live replays…</p>;
  }
  if (loadError) {
    return <p className="px-4 py-14 text-center text-sm text-rose-300" role="alert">{loadError}</p>;
  }
  if (replays.length === 0) {
    return <p className="px-4 py-14 text-center text-sm text-muted-foreground">No live replays available</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3 sm:gap-3 sm:p-3" data-testid="grid-live-replays">
        {replays.map((replay) => {
          const remainingMs = Math.max(0, Date.parse(replay.expires_at) - now);
          const remainingDays = Math.ceil(remainingMs / 86_400_000);
          const remainingHours = Math.ceil(remainingMs / 3_600_000);
          const expiry =
            remainingDays > 1
              ? `Expires in ${remainingDays}d`
              : `Expires in ${remainingHours}h`;
          const busy = busyReplayId === replay.id;
          return (
            <article key={replay.id} className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#141216]">
              <button
                type="button"
                onClick={() => setSelectedReplay(replay)}
                className="block w-full text-left"
                aria-label={`Play live replay ${replay.title}`}
                data-testid={`button-play-live-replay-${replay.id}`}
              >
                <div className="relative aspect-[9/16] overflow-hidden bg-black">
                  {replay.poster_url ? (
                    <img
                      src={replay.poster_url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-zinc-900" />
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    REPLAY
                  </span>
                  <span className="absolute bottom-2 left-2 rounded-full bg-black/75 px-2 py-1 text-[10px] font-medium text-white/90">
                    {expiry}
                  </span>
                </div>
                <div className="min-w-0 px-2.5 py-2.5">
                  <p className="truncate text-sm font-semibold text-white">{replay.title}</p>
                  <p className="mt-1 text-[11px] text-white/50">
                    {new Date(replay.created_at).toLocaleDateString()}
                  </p>
                </div>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={`More actions for ${replay.title}`}
                    className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/65 text-white shadow-lg backdrop-blur hover:bg-black/85 disabled:opacity-50"
                    data-testid={`button-live-replay-actions-${replay.id}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[120] w-52 border-white/10 bg-[#17151b] text-white">
                  {isOwner ? (
                    <>
                      <DropdownMenuItem onSelect={() => void saveToGallery(replay)} disabled={busy}>
                        <Download className="mr-2 h-4 w-4" />
                        Save to gallery
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setDeleteTarget(replay)} disabled={busy} className="text-rose-300 focus:text-rose-200">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete video
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void promoteReplay(replay)} disabled={busy}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Make permanent video
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem onSelect={() => void shareReplay(replay)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setReportReason(REPORT_REASONS[0]);
                          setReportTarget(replay);
                        }}
                      >
                        <Flag className="mr-2 h-4 w-4" />
                        Report
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              {busy ? (
                <div className="absolute inset-0 grid place-items-center bg-black/65 text-xs font-medium text-white">
                  Working…
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <Dialog open={Boolean(selectedReplay)} onOpenChange={(open) => !open && setSelectedReplay(null)}>
        <DialogContent className="max-h-[96dvh] w-[calc(100vw-1rem)] max-w-5xl overflow-hidden border-white/10 bg-black p-2 text-white sm:p-3">
          {selectedReplay ? (
            <ReplayPlayer
              replay={selectedReplay}
              onClose={() => setSelectedReplay(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !busyReplayId && !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this replay?</AlertDialogTitle>
            <AlertDialogDescription>
              The video will be permanently removed from cloud storage and your Live tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(busyReplayId)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={Boolean(busyReplayId)}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
              className="bg-rose-600 text-white hover:bg-rose-500"
            >
              {busyReplayId ? "Deleting…" : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={Boolean(reportTarget)} onOpenChange={(open) => !reportBusy && !open && setReportTarget(null)}>
        <DialogContent className="border-white/10 bg-[#131116] text-white">
          <DialogTitle>Report this replay</DialogTitle>
          <DialogDescription className="text-white/60">Choose the reason that best describes this video.</DialogDescription>
          <div role="radiogroup" aria-label="Report reason" className="grid gap-2">
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm ${
                  reportReason === reason ? "border-fuchsia-400 bg-fuchsia-500/10" : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <input
                  type="radio"
                  name="live-replay-report-reason"
                  value={reason}
                  checked={reportReason === reason}
                  onChange={() => setReportReason(reason)}
                  className="accent-fuchsia-400"
                />
                {reason}
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReportTarget(null)}
              disabled={reportBusy}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void submitReport()}
              disabled={reportBusy}
              className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {reportBusy ? "Submitting…" : "Submit report"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReplayPlayer({
  replay,
  onClose,
}: {
  replay: LiveReplay;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [aspectRatio, setAspectRatio] = useState(
    replay.original_width > 0 && replay.original_height > 0
      ? `${replay.original_width} / ${replay.original_height}`
      : "9 / 16",
  );
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls: Hls | null = null;
    if (/\.m3u8(?:[?#]|$)/i.test(replay.media_url)) {
      if (Hls.isSupported()) {
        hls = new Hls(createVideoHlsConfig());
        bindHlsNetworkAwareLevelCap(hls);
        hls.loadSource(replay.media_url);
        hls.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = replay.media_url;
      }
    } else {
      video.src = replay.media_url;
    }
    return () => {
      hls?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [replay.media_url]);

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const enterFullscreen = async () => {
    const element = videoRef.current;
    if (!element) return;
    try {
      await element.requestFullscreen?.();
      try {
        const orientation = screen.orientation as unknown as {
          lock?: (value: "landscape") => Promise<void>;
        };
        await orientation?.lock?.("landscape");
      } catch {
        // Orientation locking is optional on browsers that do not grant it.
      }
    } catch {
      toast.error("Full-screen playback is not available on this device.");
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await enterFullscreen();
      return;
    }
    try {
      await document.exitFullscreen();
    } catch {
      // Keep the player available if the browser blocks the exit request.
    }
    const orientation = screen.orientation as unknown as { unlock?: () => void };
    orientation?.unlock?.();
  };

  const closePlayer = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // Closing the dialog should still work when fullscreen exit is blocked.
    }
    const orientation = screen.orientation as unknown as { unlock?: () => void };
    orientation?.unlock?.();
    onClose();
  };

  return (
    <div className="relative flex max-h-[94dvh] w-full flex-col items-center justify-center bg-black">
      <DialogTitle className="sr-only">{replay.title}</DialogTitle>
      <DialogDescription className="sr-only">Live replay video player.</DialogDescription>
      <div className="relative flex max-h-[90dvh] w-full items-center justify-center overflow-hidden bg-black">
        <video
          ref={videoRef}
          controls
          autoPlay
          playsInline
          preload="metadata"
          poster={replay.poster_url ?? undefined}
          className="h-auto max-h-[90dvh] w-full object-contain"
          style={{ aspectRatio, maxWidth: "100%" }}
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            if (video.videoWidth && video.videoHeight) {
              setAspectRatio(`${video.videoWidth} / ${video.videoHeight}`);
            }
          }}
          aria-label={`Watch ${replay.title}`}
          data-testid="video-live-replay-player"
        />
      </div>
      <div className="flex w-full items-center justify-between gap-3 px-2 py-2">
        <p className="min-w-0 truncate text-sm font-semibold">{replay.title}</p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label={fullscreen ? "Exit full screen" : "Play in full screen"}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => void closePlayer()}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close replay"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
