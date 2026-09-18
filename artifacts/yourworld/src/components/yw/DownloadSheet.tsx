import { AudioLines, Circle, CircleDot, Download, Film, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  availableVideoQualityTiers,
  estimateDownloadSizeMb,
  formatDownloadSizeMb,
  type VideoQualityTier,
} from "@/lib/video-quality";
import { cn } from "@/lib/utils";

export type DownloadChoice = VideoQualityTier | "mp3" | "original";

const QUALITY_COPY: Record<VideoQualityTier, { title: string; description: string }> = {
  "4320p": { title: "8K (4320p)", description: "Ultra-high definition video" },
  "2160p": { title: "4K (2160p)", description: "Ultra-high-definition video" },
  "1440p": { title: "2K (1440p)", description: "Sharp high-definition video" },
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
  sourceMediaUrl?: string | null;
  sourceFileSizeBytes?: number | null;
  onDownload: (choice: DownloadChoice) => void | Promise<void>;
};

function positiveByteSize(value: number | null | undefined) {
  const size = Number(value);
  return Number.isFinite(size) && size > 0 ? size : null;
}

function contentLengthFromResponse(response: Response) {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 0) return contentLength;
  const contentRange = response.headers.get("content-range") ?? "";
  const total = Number(contentRange.match(/\/(\d+)$/)?.[1]);
  return Number.isFinite(total) && total > 0 ? total : null;
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
    return response.ok ? contentLengthFromResponse(response) : null;
  } catch {
    return null;
  }
}

export function DownloadSheet({
  open,
  onOpenChange,
  title,
  durationSeconds,
  sourceQualityTier,
  sourceMediaUrl,
  sourceFileSizeBytes,
  onDownload,
}: Props) {
  const choices = useMemo<DownloadChoice[]>(
    () => {
      const qualityTiers = sourceQualityTier
        ? availableVideoQualityTiers(sourceQualityTier)
        : [];
      return [...qualityTiers.map((choice) => choice.id), "original", "mp3"];
    },
    [sourceQualityTier],
  );
  const [selected, setSelected] = useState<DownloadChoice>(
    sourceQualityTier ?? "original",
  );
  const [busy, setBusy] = useState(false);
  const [resolvedSourceFileSizeBytes, setResolvedSourceFileSizeBytes] = useState<number | null>(
    positiveByteSize(sourceFileSizeBytes),
  );

  useEffect(() => {
    if (open) setSelected(sourceQualityTier ?? "original");
  }, [open, sourceQualityTier]);

  useEffect(() => {
    const providedSize = positiveByteSize(sourceFileSizeBytes);
    setResolvedSourceFileSizeBytes(providedSize);
    if (!open || providedSize || !sourceMediaUrl) return;

    const controller = new AbortController();
    void readSourceFileSize(sourceMediaUrl, controller.signal).then((size) => {
      if (!controller.signal.aborted) setResolvedSourceFileSizeBytes(size);
    });
    return () => controller.abort();
  }, [open, sourceFileSizeBytes, sourceMediaUrl]);

  const sizeForChoice = (choice: DownloadChoice) => {
    const isSourceFile = choice === "original" || choice === sourceQualityTier;
    if (isSourceFile && resolvedSourceFileSizeBytes) {
      return formatDownloadSizeMb(resolvedSourceFileSizeBytes / 1_000_000, true);
    }

    if (choice === "mp3") {
      return formatDownloadSizeMb(estimateDownloadSizeMb(durationSeconds, "mp3"));
    }

    const estimateTier = isSourceFile ? sourceQualityTier : choice;
    return formatDownloadSizeMb(
      estimateTier ? estimateDownloadSizeMb(durationSeconds, estimateTier) : null,
    );
  };

  const submit = async () => {
    setBusy(true);
    try {
      await onDownload(selected);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-zinc-800 bg-[#15151a] px-4 pb-8 text-white"
      >
        <SheetHeader className="mx-auto max-w-lg pb-4 pt-1 text-left">
           <SheetTitle className="text-base text-white">Download Video / Audio</SheetTitle>
          <SheetDescription className="truncate text-xs text-zinc-400">
             {title}
          </SheetDescription>
        </SheetHeader>

        <div className="mx-auto max-w-lg space-y-2">
           <p className="px-1 pt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
             Video Qualities
           </p>
           {choices.filter((choice) => choice !== "mp3").map((choice) => {
             const isOriginal = choice === "original";
             const isSelected = choice === selected;
              const quality = choice !== "original" ? QUALITY_COPY[choice] : null;
              const size = sizeForChoice(choice);
             return (
               <button
                 key={choice}
                 type="button"
                 role="radio"
                 aria-checked={isSelected}
                 disabled={busy}
                 onClick={() => setSelected(choice)}
                 className={cn(
                   "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left shadow-sm transition-all active:scale-[0.99]",
                   isSelected
                     ? "border-pink-500/70 bg-pink-500/10"
                     : "border-zinc-800 bg-zinc-900/70 hover:border-zinc-700 hover:bg-zinc-800",
                   busy && "opacity-60",
                 )}
               >
                 <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-800 text-zinc-200">
                   <Film size={18} />
                 </span>
                 <span className="min-w-0 flex-1">
                   <span className="block text-sm font-semibold">
                     {isOriginal ? "Original Video File (Source Quality)" : quality?.title}
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

           <p className="px-1 pt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
             Audio Only
           </p>
           <button
             type="button"
             role="radio"
             aria-checked={selected === "mp3"}
             disabled={busy}
             onClick={() => setSelected("mp3")}
             className={cn(
               "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left shadow-sm transition-all active:scale-[0.99]",
               selected === "mp3"
                 ? "border-pink-500/70 bg-pink-500/10"
                 : "border-zinc-800 bg-zinc-900/70 hover:border-zinc-700 hover:bg-zinc-800",
               busy && "opacity-60",
             )}
           >
             <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-800 text-zinc-200">
               <AudioLines size={18} />
             </span>
             <span className="min-w-0 flex-1">
               <span className="block text-sm font-semibold">MP3 Audio</span>
               <span className="mt-0.5 block text-[11px] text-zinc-400">
                  Extracted / direct audio stream · {sizeForChoice("mp3")}
               </span>
             </span>
             {selected === "mp3" ? (
               <CircleDot size={22} className="shrink-0 text-pink-500" />
             ) : (
               <Circle size={22} className="shrink-0 text-zinc-600" />
             )}
           </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-bold text-black transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}
             {busy ? "Preparing download…" : "Download Selected"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}