import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  MoreVertical,
  Play,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCount } from "@/lib/yw-data";
import {
  getDownloadedVideoUrl,
  type DownloadedVideo,
} from "@/lib/yw-download";

type DownloadedVideoListProps = {
  videos: DownloadedVideo[];
  loading?: boolean;
  onOpen: (video: DownloadedVideo) => void;
  onDelete: (video: DownloadedVideo) => Promise<void> | void;
  onOpenAthlete?: (video: DownloadedVideo) => void;
};

export function DownloadedVideoList({
  videos,
  loading = false,
  onOpen,
  onDelete,
  onOpenAthlete,
}: DownloadedVideoListProps) {
  if (loading) {
    return (
      <div className="space-y-3 px-3 py-4 sm:px-4" aria-live="polite">
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-2.5">
            <div className="aspect-video w-[42%] shrink-0 animate-pulse rounded-xl bg-white/[0.08]" />
            <div className="min-w-0 flex-1 space-y-2 py-1">
              <div className="h-3.5 w-4/5 animate-pulse rounded bg-white/[0.08]" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-3 w-2/5 animate-pulse rounded bg-white/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!videos.length) {
    return <DownloadsEmptyState />;
  }

  return (
    <ul data-testid="list-profile-downloads" className="space-y-2.5 px-3 py-4 sm:px-4">
      {videos.map((video) => (
        <DownloadedVideoCard
          key={video.id}
          video={video}
          onOpen={() => onOpen(video)}
          onDelete={() => onDelete(video)}
          onOpenAthlete={onOpenAthlete ? () => onOpenAthlete(video) : undefined}
        />
      ))}
    </ul>
  );
}

function DownloadedVideoCard({
  video,
  onOpen,
  onDelete,
  onOpenAthlete,
}: {
  video: DownloadedVideo;
  onOpen: () => void;
  onDelete: () => Promise<void> | void;
  onOpenAthlete?: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const title = video.title.trim() || "Untitled video";
  const creator = video.creatorName.trim() || video.creatorUsername.trim() || "YourWorld athlete";
  const quality = qualityLabel(video.quality);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <li
      data-testid={`card-profile-download-${video.mediaId}`}
      className="group flex min-w-0 items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-2 transition-colors hover:border-white/[0.13] hover:bg-white/[0.055]"
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        aria-label={`Play ${title}`}
      >
        <DownloadedVideoThumbnail video={video} />

        <span className="min-w-0 flex-1 self-stretch py-0.5">
          <span className="line-clamp-2 font-display text-[13px] font-semibold leading-[1.25] text-white sm:text-[14px]">
            {title}
          </span>
          <span className="mt-1.5 block truncate text-[11px] text-zinc-400">
            {creator}
          </span>
          <span className="mt-1 block truncate text-[10px] text-zinc-500">
            {video.views ? `${formatCount(video.views)} views` : "YourWorld video"}
            {video.createdAt ? ` • ${formatDate(video.createdAt)}` : ""}
          </span>
          <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-medium text-sky-200/90">
            <CheckCircle2 className="h-3.5 w-3.5 text-sky-300" strokeWidth={2.2} />
            Downloaded
            <span className="rounded-full border border-sky-200/15 bg-sky-300/10 px-1.5 py-0.5 text-[9px] text-sky-100/80">
              {quality}
            </span>
             <span className="text-zinc-500">{formatFileSize(video.sizeBytes)}</span>
          </span>
        </span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`More actions for ${title}`}
            className="grid h-9 w-8 shrink-0 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <MoreVertical className="h-[18px] w-[18px]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 border-white/10 bg-zinc-950 text-white">
          <DropdownMenuItem
            disabled={deleting}
            onClick={() => void handleDelete()}
            className="gap-2 text-red-200 focus:bg-red-400/10 focus:text-red-100"
          >
            <Trash2 className="h-4 w-4" />
            Delete from downloads
          </DropdownMenuItem>
          {onOpenAthlete ? (
            <DropdownMenuItem onClick={onOpenAthlete} className="gap-2 focus:bg-white/10 focus:text-white">
              <UserRound className="h-4 w-4" />
              View athlete profile
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

function DownloadedVideoThumbnail({ video }: { video: DownloadedVideo }) {
  const initialSource = video.thumbnailUrl || video.posterUrl || null;
  const [imageSource, setImageSource] = useState<string | null>(initialSource);
  const [showFallback, setShowFallback] = useState(false);
  const snapshotStarted = useRef(false);

  const captureSnapshot = () => {
    if (snapshotStarted.current) return;
    snapshotStarted.current = true;
    void captureCachedVideoFrame(video).then((snapshot) => {
      if (snapshot) {
        setImageSource(snapshot);
      } else {
        setShowFallback(true);
      }
    });
  };

  useEffect(() => {
    if (!initialSource) captureSnapshot();
  }, [initialSource]);

  const handleImageError = () => {
    if (imageSource?.startsWith("data:")) {
      setShowFallback(true);
      return;
    }
    setImageSource(null);
    captureSnapshot();
  };

  return (
    <span className="relative block aspect-video w-[42%] max-w-[190px] shrink-0 overflow-hidden rounded-xl bg-[radial-gradient(circle_at_30%_20%,rgba(217,70,239,0.22),transparent_55%),#10111a]">
      {imageSource && !showFallback ? (
        <img
          src={imageSource}
          alt=""
          loading="lazy"
          onError={handleImageError}
          className="w-full h-full object-cover rounded-md"
        />
      ) : (
        <span className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.18),transparent_52%),linear-gradient(135deg,#10111a,#1d1630)]">
          <Play className="h-6 w-6 fill-white/50 text-white/60" />
        </span>
      )}
      {video.durationSeconds != null ? (
        <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white backdrop-blur-sm">
          {formatVideoDuration(video.durationSeconds)}
        </span>
      ) : null}
    </span>
  );
}

async function captureCachedVideoFrame(record: DownloadedVideo) {
  if (typeof document === "undefined") return null;
  const objectUrl = await getDownloadedVideoUrl(record);
  if (!objectUrl) return null;

  const source = document.createElement("video");
  source.muted = true;
  source.playsInline = true;
  source.preload = "metadata";
  source.src = objectUrl;

  try {
    await waitForVideoEvent(source, "loadedmetadata");
    if (source.duration > 0 && Number.isFinite(source.duration)) {
      source.currentTime = Math.min(Math.max(source.duration * 0.08, 0.1), 1.5);
      await waitForVideoEvent(source, "seeked");
    } else {
      await waitForVideoEvent(source, "loadeddata");
    }

    const width = source.videoWidth || 640;
    const height = source.videoHeight || 360;
    const scale = Math.min(1, 640 / width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.84);
  } catch {
    return null;
  } finally {
    source.removeAttribute("src");
    source.load();
    URL.revokeObjectURL(objectUrl);
  }
}

function waitForVideoEvent(video: HTMLVideoElement, eventName: "loadedmetadata" | "loadeddata" | "seeked") {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${eventName}`));
    }, 7000);
    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener(eventName, onEvent);
      video.removeEventListener("error", onError);
    };
    const onEvent = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Cached video could not load"));
    };
    video.addEventListener(eventName, onEvent, { once: true });
    video.addEventListener("error", onError, { once: true });
  });
}

export function DownloadsEmptyState() {
  return (
    <div
      data-testid="status-profile-downloads-empty"
      className="flex flex-col items-center px-7 py-20 text-center sm:py-24"
    >
      <span className="grid h-16 w-16 place-items-center rounded-2xl border border-sky-200/15 bg-sky-300/[0.08] text-sky-200 shadow-[0_12px_40px_-20px_rgba(56,189,248,0.65)]">
        <Download className="h-7 w-7" strokeWidth={1.6} />
      </span>
      <h2 className="mt-5 font-display text-[17px] font-semibold text-white">No downloaded videos</h2>
      <p className="mt-2 max-w-xs text-[12px] leading-relaxed text-zinc-500">
        Videos you download in 720p or 1080p will appear here for smooth offline viewing.
      </p>
    </div>
  );
}

function formatVideoDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remaining = total % 60;
  if (hours) return `${hours}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function qualityLabel(value: string) {
  if (value === "original") return "Original";
  if (value === "720p") return "720p HD";
  return value;
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Size unavailable";
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1_000))} KB`;
}