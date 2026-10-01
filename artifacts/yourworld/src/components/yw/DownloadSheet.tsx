import { Circle, CircleDot, Download, Film } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  availableDownloadQualityTiers,
  downloadFileSizeBytesFromHeaders,
  type DownloadQualityUrls,
  estimateDownloadSizeMb,
  estimateDownloadSizeMbFromSourceFile,
  formatDownloadSizeMb,
  type VideoQualityTier,
} from "@/lib/video-quality";
import { resolveMediaUrl } from "@/lib/social-data";
import { cn } from "@/lib/utils";

export type DownloadChoice = VideoQualityTier | "mp3" | "original";

const QUALITY_COPY: Record<VideoQualityTier, { title: string; description: string }> = {
  "4320p": { title: "8K (4320p)", description: "Ultra-high definition video" },
  "2160p": { title: "4K (2160p)", description: "Ultra-high-definition video" },
  "1440p": { title: "2K", description: "Sharp high-definition video" },
  "1080p": { title: "1080p Full HD", description: "Balanced quality and file size" },
  "720p": { title: "720p HD", description: "Good quality for everyday viewing" },
  "480p": { title: "480p", description: "Standard-definition video" },
  "360p": { title: "360p", description: "Smaller file for slower connections" },
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  durationSeconds?: number | null;
  sourceQualityTier?: VideoQualityTier | null;
  qualityMediaUrls?: DownloadQualityUrls | null;
  sourceMediaUrl?: string | null;
  sourceFileSizeBytes?: number | null;
  mediaBucket?: "reels" | "videos";
  onDownload: (
    choice: DownloadChoice,
    onProgress?: (percent: number) => void,
  ) => void | Promise<void>;
};

function positiveByteSize(value: number | null | undefined) {
  const size = Number(value);
  return Number.isFinite(size) && size > 0 ? size : null;
}

function positiveDuration(value: number | null | undefined) {
  const duration = Number(value);
  return Number.isFinite(duration) && duration > 0 ? duration : null;
}

function contentLengthFromResponse(response: Response) {
  return downloadFileSizeBytesFromHeaders(
    response.status,
    response.headers.get("content-range"),
    response.headers.get("content-length"),
  );
}

async function readSourceFileSize(sourceMediaUrl: string, signal: AbortSignal) {
  if (!/^https?:\/\//i.test(sourceMediaUrl)) return null;
  try {
    const response = await fetch(sourceMediaUrl, {
      method: "HEAD",
      cache: "no-store",
      signal,
    });
    if (response.ok) {
      const size = contentLengthFromResponse(response);
      if (size) return size;
    }
  } catch {
    if (signal.aborted) return null;
  }

  try {
    const response = await fetch(sourceMediaUrl, {
      headers: { Range: "bytes=0-0" },
      cache: "no-store",
      signal,
    });
    const size = response.status === 206 ? contentLengthFromResponse(response) : null;
    await response.body?.cancel().catch(() => {});
    return size;
  } catch {
    return null;
  }
}

async function readVideoDuration(
  sourceMediaUrl: string,
  mediaBucket: "reels" | "videos",
  signal: AbortSignal,
) {
  if (typeof document === "undefined") return null;

  return new Promise<number | null>((resolve) => {
    const video = document.createElement("video");
    let settled = false;
    const timeout = window.setTimeout(() => finish(null), 12_000);
    const finish = (duration: number | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      signal.removeEventListener("abort", abort);
      video.removeEventListener("loadedmetadata", loaded);
      video.removeEventListener("error", failed);
      video.removeAttribute("src");
      video.load();
      resolve(positiveDuration(duration));
    };
    const loaded = () => finish(video.duration);
    const failed = () => finish(null);
    const abort = () => finish(null);

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.addEventListener("loadedmetadata", loaded, { once: true });
    video.addEventListener("error", failed, { once: true });
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) {
      finish(null);
      return;
    }

    void resolveMediaUrl(sourceMediaUrl, mediaBucket)
      .then((url) => {
        if (signal.aborted || !url) {
          finish(null);
          return;
        }
        video.src = url;
        video.load();
      })
      .catch(() => finish(null));
  });
}

export function DownloadSheet({
  open,
  onOpenChange,
  title,
  durationSeconds,
  sourceQualityTier,
  qualityMediaUrls,
  sourceMediaUrl,
  sourceFileSizeBytes,
  mediaBucket = "videos",
  onDownload,
}: Props) {
  const choices = useMemo<DownloadChoice[]>(
    () => {
      const allPossibleTiers: DownloadChoice[] = ["1440p", "1080p", "720p", "480p", "360p"];
    void availableDownloadQualityTiers;
    return [...allPossibleTiers, "original"];
    },
    [qualityMediaUrls],
  );
  const preferredChoice: DownloadChoice =
    sourceQualityTier && choices.includes(sourceQualityTier)
      ? sourceQualityTier
      : "original";
  const [selected, setSelected] = useState<DownloadChoice>(
    preferredChoice,
  );
  const [resolvedFileSizes, setResolvedFileSizes] = useState<
    Partial<Record<DownloadChoice, number>>
  >({});
  const [resolvedDurationSeconds, setResolvedDurationSeconds] = useState<number | null>(
    positiveDuration(durationSeconds),
  );

  useEffect(() => {
    if (open) {
      setSelected(preferredChoice);
    }
  }, [open, preferredChoice]);

  useEffect(() => {
    const providedSize = positiveByteSize(sourceFileSizeBytes);
    setResolvedFileSizes(
      providedSize
        ? { original: providedSize }
        : {},
    );
    setResolvedDurationSeconds(positiveDuration(durationSeconds));
    if (!open || !sourceMediaUrl) return;

    const controller = new AbortController();
    if (!positiveDuration(durationSeconds)) {
      void readVideoDuration(sourceMediaUrl, mediaBucket, controller.signal).then((duration) => {
        if (!controller.signal.aborted && duration) setResolvedDurationSeconds(duration);
      });
    }

    const sizeCandidates = choices.flatMap((choice) => {
      const url =
        choice === "original"
          ? sourceMediaUrl
          : choice !== "mp3"
            ? qualityMediaUrls?.[choice]
            : undefined;
      return url ? [{ choice, url }] : [];
    });
    void Promise.all(
      sizeCandidates.map(async ({ choice, url }) => {
        try {
          const resolvedUrl = await resolveMediaUrl(url, mediaBucket);
          if (controller.signal.aborted || !resolvedUrl) return null;
          const size = await readSourceFileSize(resolvedUrl, controller.signal);
          return size ? ([choice, size] as const) : null;
        } catch {
          return null;
        }
      }),
    ).then((entries) => {
      if (controller.signal.aborted) return;
      const resolved = Object.fromEntries(
        entries.filter((entry): entry is readonly [DownloadChoice, number] => entry !== null),
      );
      setResolvedFileSizes((current) => ({ ...current, ...resolved }));
    });

    return () => controller.abort();
  }, [
    choices,
    durationSeconds,
    mediaBucket,
    open,
    qualityMediaUrls,
    sourceFileSizeBytes,
    sourceMediaUrl,
    sourceQualityTier,
  ]);

  const sizeForChoice = (choice: DownloadChoice) => {
    const providedSourceSize = positiveByteSize(sourceFileSizeBytes);
    const exactSize =
      resolvedFileSizes[choice] ??
      (choice === "original" ? providedSourceSize : null);
    if (exactSize) {
      return formatDownloadSizeMb(exactSize / 1_000_000, true);
    }

    if (choice === "original") {
      return formatDownloadSizeMb(null);
    }
    if (choice === "mp3") {
      return formatDownloadSizeMb(estimateDownloadSizeMb(resolvedDurationSeconds, "mp3"));
    }

    const sourceSizeBytes =
      resolvedFileSizes.original ?? providedSourceSize;
    return formatDownloadSizeMb(
      estimateDownloadSizeMb(resolvedDurationSeconds, choice) ??
        estimateDownloadSizeMbFromSourceFile(sourceSizeBytes, sourceQualityTier, choice),
    );
  };

  const submit = () => {
    const choice = selected;
    onOpenChange(false);
    void Promise.resolve(onDownload(choice)).catch((error) => {
      console.error("[downloads] background download failed", error);
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="bottom"
        overlayClassName="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm"
        className="fixed inset-x-0 bottom-0 z-[130] flex max-h-[85vh] flex-col overflow-y-auto rounded-t-2xl border-t border-zinc-800 bg-[#121216] p-5 text-white"
      >
        <SheetHeader className="mx-auto max-w-lg pb-[max(env(safe-area-inset-bottom,16px),16px)] pt-1 text-left">
          <SheetTitle className="text-base text-white">Choose a quality</SheetTitle>
          <SheetDescription className="truncate text-xs text-zinc-400">
            {title}
          </SheetDescription>
        </SheetHeader>

        <div className="mx-auto max-w-lg space-y-2">
           <p className="px-1 pt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
             Video Qualities
           </p>
            {choices.map((choice) => {
             const isOriginal = choice === "original";
             const isSelected = choice === selected;
              const quality =
                choice !== "original" && choice !== "mp3" ? QUALITY_COPY[choice] : null;
              const size = sizeForChoice(choice);
             return (
               <button
                 key={choice}
                 type="button"
                 role="radio"
                 aria-checked={isSelected}
                 onClick={() => setSelected(choice)}
                 className={cn(
                   "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left shadow-sm transition-all active:scale-[0.99]",
                   isSelected
                     ? "border-pink-500/70 bg-pink-500/10"
                     : "border-zinc-800 bg-zinc-900/70 hover:border-zinc-700 hover:bg-zinc-800",
                 )}
               >
                 <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-800 text-zinc-200">
                   <Film size={18} />
                 </span>
                 <span className="min-w-0 flex-1">
                   <span className="block text-sm font-semibold">
                      {isOriginal ? "Original" : quality?.title}
                     {!isOriginal && choice === sourceQualityTier && (
                       <span className="ml-2 text-[10px] font-medium text-pink-300">SOURCE</span>
                     )}
                   </span>
                   <span className="mt-0.5 block text-[11px] text-zinc-400">
                      {isOriginal ? "Original source file" : quality?.description} · {size}
                   </span>
                 </span>
                 {isSelected ? (
                   <CircleDot size={22} className="shrink-0 text-pink-500" />
                 ) : (
                   <Circle size={22} className="shrink-0 text-zinc-600" />
                 )}
               </button>
             );
           })}

          <button
            type="button"
            onClick={() => void submit()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-bold text-black transition-transform active:scale-[0.98] disabled:opacity-50"
          >
             <Download size={17} />
              {selected === "original"
                ? "Download Video (Original Quality)"
                : selected === "mp3"
                  ? "Download MP3"
                  : `Download ${selected}`}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}