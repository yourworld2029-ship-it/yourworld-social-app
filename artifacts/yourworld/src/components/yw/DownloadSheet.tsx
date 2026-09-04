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
  VIDEO_QUALITY_TIERS,
  type VideoQualityTier,
} from "@/lib/video-quality";
import { cn } from "@/lib/utils";

export type DownloadChoice = VideoQualityTier | "mp3" | "original";

const QUALITY_COPY: Record<
  Exclude<VideoQualityTier, "4320p">,
  { title: string; description: string }
> = {
  "2160p": { title: "4K Ultra HD (2160p)", description: "High bitrate" },
  "1440p": { title: "2K QHD (1440p)", description: "Sharp high-definition video" },
  "1080p": { title: "Full HD (1080p)", description: "Balanced quality and file size" },
  "720p": { title: "HD (720p)", description: "Good quality for everyday viewing" },
  "480p": { title: "Standard (480p / 360p)", description: "Smaller file for slower connections" },
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  durationSeconds?: number | null;
  sourceQualityTier?: VideoQualityTier | null;
  onDownload: (choice: DownloadChoice) => void | Promise<void>;
};

export function DownloadSheet({
  open,
  onOpenChange,
  title,
  durationSeconds,
  sourceQualityTier,
  onDownload,
}: Props) {
  const choices = useMemo<DownloadChoice[]>(
    () => {
      const qualityTiers = (sourceQualityTier
        ? availableVideoQualityTiers(sourceQualityTier)
        : VIDEO_QUALITY_TIERS.slice(0, 5)
      ).filter((choice) => choice.id !== "4320p");
      return [...qualityTiers.map((choice) => choice.id), "original", "mp3"];
    },
    [sourceQualityTier],
  );
  const [selected, setSelected] = useState<DownloadChoice>(
    sourceQualityTier ?? "original",
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setSelected(sourceQualityTier ?? "original");
  }, [open, sourceQualityTier]);

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
             const quality = choice !== "original" && choice !== "4320p"
               ? QUALITY_COPY[choice]
               : null;
             const size = formatDownloadSizeMb(estimateDownloadSizeMb(durationSeconds, choice));
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
                 Extracted / direct audio stream · {formatDownloadSizeMb(estimateDownloadSizeMb(durationSeconds, "mp3"))}
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