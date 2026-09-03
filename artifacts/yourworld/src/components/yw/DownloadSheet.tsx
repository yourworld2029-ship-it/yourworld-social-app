import { AudioLines, Check, Download, Film, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
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
  qualityTierLabel,
  type VideoQualityTier,
} from "@/lib/video-quality";
import { cn } from "@/lib/utils";

export type DownloadChoice = VideoQualityTier | "mp3" | "original";

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
    () => [
      ...availableVideoQualityTiers(sourceQualityTier).map((choice) => choice.id),
      ...(sourceQualityTier ? [] : ["original" as const]),
      "mp3",
    ],
    [sourceQualityTier],
  );
  const [selected, setSelected] = useState<DownloadChoice>(
    sourceQualityTier ?? "original",
  );
  const [busy, setBusy] = useState(false);

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
          <SheetTitle className="text-base text-white">Download</SheetTitle>
          <SheetDescription className="truncate text-xs text-zinc-400">
            {title} · choose a quality for this download
          </SheetDescription>
        </SheetHeader>

        <div className="mx-auto max-w-lg space-y-2">
          {choices.length === 1 && (
            <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-300">
              This upload predates quality metadata, so only audio export is available.
            </p>
          )}
          {choices.map((choice) => {
            const isAudio = choice === "mp3";
            const isOriginal = choice === "original";
            const isSelected = choice === selected;
            const size = formatDownloadSizeMb(
              estimateDownloadSizeMb(durationSeconds, choice),
            );
            return (
              <button
                key={choice}
                type="button"
                disabled={busy}
                onClick={() => setSelected(choice)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors active:scale-[0.99]",
                  isSelected
                    ? "border-pink-500/70 bg-pink-500/10"
                    : "border-zinc-800 bg-zinc-900/70 hover:bg-zinc-800",
                  busy && "opacity-60",
                )}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-800 text-zinc-200">
                  {isAudio ? <AudioLines size={18} /> : <Film size={18} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {isAudio ? "MP3 audio" : isOriginal ? "Original quality" : qualityTierLabel(choice)}
                    {!isAudio && choice === sourceQualityTier && (
                      <span className="ml-2 text-[10px] font-medium text-pink-300">SOURCE</span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-zinc-400">
                    {isAudio ? "Audio only" : isOriginal ? "Original source file" : "Video download"} · {size}
                  </span>
                </span>
                <span
                  className={cn(
                    "grid h-5 w-5 place-items-center rounded-full border",
                    isSelected
                      ? "border-pink-500 bg-pink-500 text-white"
                      : "border-zinc-600 text-transparent",
                  )}
                >
                  <Check size={13} />
                </span>
              </button>
            );
          })}

          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-bold text-black transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}
            {busy ? "Preparing download…" : "Download selected"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}