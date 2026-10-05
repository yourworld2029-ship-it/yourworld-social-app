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
  downloadFileSizeBytesFromHeaders,
  type DownloadQualityUrls,
  capQualityTierToSource,
  effectiveDownloadSourceQuality,
  estimateDownloadSizeMb,
  estimateDownloadSizeMbFromSourceFile,
  estimateDownloadSizeMbForPicker,
  estimateDownloadSizeMbFromSourceFileForPicker,
  formatDownloadSizeMb,
  hasExactVideoDownload,
  isVideoDownloadTierWithinSource,
  needsOnDemandVideoTranscode,
  resolveVideoDownloadSelection,
  type VideoQualityTier,
  VIDEO_DOWNLOAD_PICKER_TIERS,
} from "@/lib/video-quality";
import { resolveMediaUrl } from "@/lib/social-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  startNativeOfflineDownloadNotice,
  stopNativeOfflineDownloadNotice,
} from "@/lib/native-offline-downloads";

export type DownloadChoice = VideoQualityTier | "mp3" | "original";

const QUALITY_COPY: Partial<
  Record<VideoQualityTier, { title: string; description: string }>
> = {
  "1080p": { title: "Full HD (1080p)", description: "Highest detail for larger screens" },
  "720p": { title: "High (720p)", description: "Clear HD picture" },
  "480p": { title: "Medium (480p)", description: "Balanced picture and file size" },
  "360p": { title: "Low (360p)", description: "Smaller file for slower connections" },
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  durationSeconds?: number | null;
  sourceQualityTier?: VideoQualityTier | null;
  cloudflareStreamId?: string | null;
  qualityMediaUrls?: DownloadQualityUrls | null;
  sourceMediaUrl?: string | null;
  sourceFileSizeBytes?: number | null;
  mediaBucket?: "reels" | "videos";
  enforceSourceQualityLimit?: boolean;
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

function isDownloadChoiceAvailable(
  choice: DownloadChoice,
  sourceMediaUrl?: string | null,
  qualityMediaUrls?: DownloadQualityUrls | null,
  sourceQualityTier?: VideoQualityTier | null,
  cloudflareStreamId?: string | null,
  enforceSourceQualityLimit = true,
) {
  if (choice === "mp3") return false;
  if (choice === "original") return Boolean(sourceMediaUrl?.trim());
  return (
    hasExactVideoDownload(
      choice,
      sourceMediaUrl,
      qualityMediaUrls,
      sourceQualityTier,
      cloudflareStreamId,
    ) &&
    (!enforceSourceQualityLimit ||
      isVideoDownloadTierWithinSource(
        choice,
        sourceQualityTier,
        cloudflareStreamId,
      ))
  );
}

function onDemandConversionTier(
  choice: DownloadChoice,
  selection: ReturnType<typeof resolveVideoDownloadSelection>,
  sourceQualityTier?: VideoQualityTier | null,
  cloudflareStreamId?: string | null,
) {
  if (
    choice === "original" ||
    choice === "mp3" ||
    !selection ||
    !needsOnDemandVideoTranscode(
      choice,
      selection,
      sourceQualityTier,
      cloudflareStreamId,
    )
  ) {
    return null;
  }

  const effectiveSourceTier = effectiveDownloadSourceQuality(
    sourceQualityTier,
    cloudflareStreamId,
  );
  if (effectiveSourceTier === "original") return null;
  return capQualityTierToSource(
    choice,
    effectiveSourceTier,
  );
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
  if (/\.m3u8(?:$|[?#])/i.test(sourceMediaUrl)) return null;
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
  cloudflareStreamId,
  qualityMediaUrls,
  sourceMediaUrl,
  sourceFileSizeBytes,
  mediaBucket = "videos",
  enforceSourceQualityLimit = true,
  onDownload,
}: Props) {
  const choices = useMemo<DownloadChoice[]>(
    () => [
      ...VIDEO_DOWNLOAD_PICKER_TIERS.filter(
        (tier) =>
          !enforceSourceQualityLimit ||
          isVideoDownloadTierWithinSource(
            tier,
            sourceQualityTier,
            cloudflareStreamId,
          ),
      ),
      "original",
    ],
    [cloudflareStreamId, enforceSourceQualityLimit, sourceQualityTier],
  );
  const preferredChoice: DownloadChoice = enforceSourceQualityLimit
    ? VIDEO_DOWNLOAD_PICKER_TIERS.find((tier) =>
        isVideoDownloadTierWithinSource(tier, sourceQualityTier, cloudflareStreamId),
      ) ?? "original"
    : VIDEO_DOWNLOAD_PICKER_TIERS.find((tier) => tier === sourceQualityTier) ?? "original";
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
      if (choice === "mp3") return [];
      if (
        !isDownloadChoiceAvailable(
          choice,
          sourceMediaUrl,
          qualityMediaUrls,
          sourceQualityTier,
          cloudflareStreamId,
          enforceSourceQualityLimit,
        )
      ) {
        return [];
      }
      const selection =
        choice === "original"
          ? null
          : resolveVideoDownloadSelection(
              choice,
              sourceMediaUrl,
              qualityMediaUrls,
              sourceQualityTier,
              cloudflareStreamId,
            );
      if (choice !== "original" && !selection) return [];
      if (
        choice !== "original" &&
        selection &&
        needsOnDemandVideoTranscode(
          choice,
          selection,
          sourceQualityTier,
          cloudflareStreamId,
        )
      ) {
        return [];
      }
      const url = choice === "original" ? sourceMediaUrl : selection?.url;
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
      const resolved: Partial<Record<DownloadChoice, number>> = {};
      for (const entry of entries) {
        if (entry) resolved[entry[0]] = entry[1];
      }
      setResolvedFileSizes((current) => ({ ...current, ...resolved }));
    });

    return () => controller.abort();
  }, [
    choices,
    durationSeconds,
    mediaBucket,
    open,
    qualityMediaUrls,
    cloudflareStreamId,
    enforceSourceQualityLimit,
    sourceFileSizeBytes,
    sourceMediaUrl,
    sourceQualityTier,
  ]);

  const sizeForChoice = (choice: DownloadChoice) => {
    if (
      !isDownloadChoiceAvailable(
        choice,
        sourceMediaUrl,
        qualityMediaUrls,
        sourceQualityTier,
        cloudflareStreamId,
        enforceSourceQualityLimit,
      )
    ) {
      return "Unavailable for this source";
    }
    const providedSourceSize = positiveByteSize(sourceFileSizeBytes);
    const selection =
      choice !== "original" && choice !== "mp3"
        ? resolveVideoDownloadSelection(
            choice,
            sourceMediaUrl,
            qualityMediaUrls,
            sourceQualityTier,
            cloudflareStreamId,
          )
        : null;
    const conversionTier = onDemandConversionTier(
      choice,
      selection,
      sourceQualityTier,
      cloudflareStreamId,
    );
    const requestsServerQuality =
      choice !== "original" &&
      choice !== "mp3" &&
      needsOnDemandVideoTranscode(
        choice,
        selection,
        sourceQualityTier,
        cloudflareStreamId,
      );
    if (requestsServerQuality) {
      if (!conversionTier) return formatDownloadSizeMb(null);
      const sourceBytes =
        resolvedFileSizes.original ?? providedSourceSize;
      const effectiveSourceTier = effectiveDownloadSourceQuality(
        sourceQualityTier,
        cloudflareStreamId,
      );
      const estimate =
        (enforceSourceQualityLimit
          ? estimateDownloadSizeMbForPicker(resolvedDurationSeconds, conversionTier)
          : estimateDownloadSizeMb(resolvedDurationSeconds, conversionTier)) ??
        (enforceSourceQualityLimit
          ? estimateDownloadSizeMbFromSourceFileForPicker(
              sourceBytes,
              effectiveSourceTier === "original" ? null : effectiveSourceTier,
              conversionTier,
            )
          : estimateDownloadSizeMbFromSourceFile(
              sourceBytes,
              effectiveSourceTier === "original" ? null : effectiveSourceTier,
              conversionTier,
            ));
      return formatDownloadSizeMb(estimate);
    }

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
    return formatDownloadSizeMb(null);
  };

  const submit = () => {
    const choice = selected;
    if (!isDownloadChoiceAvailable(
      choice,
      sourceMediaUrl,
      qualityMediaUrls,
      sourceQualityTier,
      cloudflareStreamId,
      enforceSourceQualityLimit,
    )) return;
    onOpenChange(false);
    void (async () => {
      let transferId: string | null;
      try {
        transferId = await startNativeOfflineDownloadNotice(title);
      } catch (error) {
        console.error("[downloads] could not start the Android foreground service", error);
        toast.error(
          error instanceof Error ? error.message : "Couldn't start the Android download.",
        );
        return;
      }
      try {
        await onDownload(choice);
      } finally {
        await stopNativeOfflineDownloadNotice(transferId);
      }
    })().catch((error) => {
      console.error("[downloads] background download failed", error);
    });
  };
  const selectedSelection =
    selected !== "original" && selected !== "mp3"
      ? resolveVideoDownloadSelection(
          selected,
          sourceMediaUrl,
          qualityMediaUrls,
          sourceQualityTier,
          cloudflareStreamId,
        )
      : null;
  const selectedActualQualityLabel =
    effectiveDownloadSourceQuality(sourceQualityTier, cloudflareStreamId) === "original"
      ? "quality unknown"
      : effectiveDownloadSourceQuality(sourceQualityTier, cloudflareStreamId);
  const selectedConversionTier = onDemandConversionTier(
    selected,
    selectedSelection,
    sourceQualityTier,
    cloudflareStreamId,
  );
  const selectedRequiresServerQuality =
    selected !== "original" &&
    selected !== "mp3" &&
    Boolean(
      selectedSelection &&
        needsOnDemandVideoTranscode(
          selected,
          selectedSelection,
          sourceQualityTier,
          cloudflareStreamId,
        ),
    );

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
            const isAvailable = isDownloadChoiceAvailable(
              choice,
              sourceMediaUrl,
              qualityMediaUrls,
              sourceQualityTier,
              cloudflareStreamId,
              enforceSourceQualityLimit,
            );
            const quality =
              choice !== "original" && choice !== "mp3" ? QUALITY_COPY[choice] : null;
            const selection =
              choice !== "original" && choice !== "mp3"
                ? resolveVideoDownloadSelection(
                    choice,
                    sourceMediaUrl,
                    qualityMediaUrls,
                    sourceQualityTier,
                    cloudflareStreamId,
                  )
                : null;
            const conversionTier = onDemandConversionTier(
              choice,
              selection,
              sourceQualityTier,
              cloudflareStreamId,
            );
            const requestsServerQuality =
              choice !== "original" &&
              choice !== "mp3" &&
              needsOnDemandVideoTranscode(
                choice,
                selection,
                sourceQualityTier,
                cloudflareStreamId,
              );
            const directSourceFallback = Boolean(
              selection?.isSourceFallback && !requestsServerQuality,
            );
            const actualQualityLabel =
              effectiveDownloadSourceQuality(sourceQualityTier, cloudflareStreamId) ===
              "original"
                ? "Original (quality unknown)"
                : effectiveDownloadSourceQuality(sourceQualityTier, cloudflareStreamId);
            const size = sizeForChoice(choice);
            return (
              <button
                key={choice}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-disabled={!isAvailable}
                disabled={!isAvailable}
                onClick={() => isAvailable && setSelected(choice)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left shadow-sm transition-all active:scale-[0.99]",
                  isSelected
                    ? "border-pink-500/70 bg-pink-500/10"
                    : "border-zinc-800 bg-zinc-900/70 hover:border-zinc-700 hover:bg-zinc-800",
                  !isAvailable && "cursor-not-allowed opacity-45",
                )}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-800 text-zinc-200">
                  <Film size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {isOriginal ? "Original" : quality?.title}
                    {!isOriginal && selection && !directSourceFallback &&
                      !selection.usesVariant && choice === sourceQualityTier && (
                      <span className="ml-2 text-[10px] font-medium text-pink-300">SOURCE</span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-zinc-400">
                    {isOriginal
                      ? "Original source file"
                      : isAvailable
                        ? directSourceFallback
                          ? `Direct source file · ${actualQualityLabel}`
                          : conversionTier
                            ? `Converted to ${conversionTier} when downloaded`
                            : requestsServerQuality
                              ? "Will be converted if the source allows · size unavailable"
                          : quality?.description
                        : `Exact ${choice} rendition is unavailable`}{" "}
                    · {size}
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
            disabled={!isDownloadChoiceAvailable(
              selected,
              sourceMediaUrl,
              qualityMediaUrls,
              sourceQualityTier,
              cloudflareStreamId,
              enforceSourceQualityLimit,
            )}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-bold text-black transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={17} />
            {selected === "original"
              ? "Download Video (Original Quality)"
              : selected === "mp3"
                ? "Download Video"
                  : selectedConversionTier
                    ? `Download ${QUALITY_COPY[selected]?.title ?? selected}`
                    : selectedSelection?.isSourceFallback &&
                        !selectedRequiresServerQuality
                    ? `Download direct source (${selectedActualQualityLabel})`
                    : `Download ${QUALITY_COPY[selected]?.title ?? selected}`}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}