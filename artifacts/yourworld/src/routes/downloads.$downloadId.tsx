import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Download } from "lucide-react";
import { VideoPlaybackSlot, useVideoPlayback } from "@/lib/video-playback";
import { useAuth } from "@/lib/auth-store";
import {
  getDownloadedVideo,
  getDownloadedVideoUrl,
  type DownloadedVideo,
} from "@/lib/yw-download";
import { formatCount } from "@/lib/yw-data";

export const Route = createFileRoute("/downloads/$downloadId")({
  component: DownloadedVideoPage,
});

function DownloadedVideoPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const { user } = useAuth();
  const { activeVideo, activateVideo } = useVideoPlayback();
  const [record, setRecord] = useState<DownloadedVideo | null>(null);
  const [loading, setLoading] = useState(true);

  const rawId = typeof params?.downloadId === "string" ? params.downloadId : "";
  let downloadId = rawId;
  try {
    downloadId = decodeURIComponent(rawId);
  } catch {
    // Keep the raw route parameter so the missing-download state can recover.
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getDownloadedVideo(downloadId, user?.id)
      .then(async (nextRecord) => {
        if (cancelled) return;
        if (!nextRecord) {
          setRecord(null);
          return;
        }
        setRecord(nextRecord);
        if (activeVideo?.id === nextRecord.id) return;
        const url = await getDownloadedVideoUrl(nextRecord);
        if (cancelled) return;
        if (!url) {
          setRecord(null);
          return;
        }
        activateVideo({
          id: nextRecord.id,
          url,
          title: nextRecord.title || "Downloaded video",
          thumbnailUrl: nextRecord.thumbnailUrl,
          detailRoute: `/downloads/${encodeURIComponent(nextRecord.id)}`,
          backTo: "/profile?tab=downloads",
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activateVideo, activeVideo?.id, downloadId, user?.id]);

  useEffect(() => {
    if (!loading && !record) {
      void navigate({ to: "/profile", search: { tab: "downloads" }, replace: true });
    }
  }, [loading, navigate, record]);

  if (loading || !record) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="aspect-video w-full animate-pulse bg-zinc-950" />
        <div className="mx-auto max-w-3xl space-y-3 px-4 py-5">
          <div className="h-5 w-4/5 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-2/5 animate-pulse rounded bg-white/[0.06]" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black pb-24 text-white">
      <VideoPlaybackSlot />
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-sky-200/15 bg-sky-300/10 text-sky-200">
            <Download className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="line-clamp-2 text-lg font-bold leading-tight">{record.title || "Downloaded video"}</h1>
            <p className="mt-1 text-xs text-zinc-400">
              {record.creatorName || record.creatorUsername || "YourWorld athlete"}
              {record.views ? ` • ${formatCount(record.views)} views` : ""}
            </p>
            <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Available offline
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}

export function DownloadedVideoMissing() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-black px-6 text-center text-white">
      <AlertCircle className="h-10 w-10 text-sky-300" />
      <p className="text-sm text-zinc-400">This download is no longer available on this device.</p>
    </div>
  );
}