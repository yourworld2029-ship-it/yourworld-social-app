import { Play, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ContinueWatchingItem = {
  id: string;
  title: string;
  thumbnailUrl: string;
  progress?: number | null;
  currentTime?: number | null;
  duration?: number | null;
  seriesTitle?: string | null;
  episodeNumber?: number | null;
};

export type ContinueWatchingRowProps = {
  entries: ContinueWatchingItem[];
  onResume: (entry: ContinueWatchingItem) => void;
  onDismiss: (entry: ContinueWatchingItem) => void;
  className?: string;
  heading?: string;
};

function progressPercent(entry: ContinueWatchingItem) {
  const duration = Number(entry.duration);
  const currentTime = Number(entry.currentTime);
  const storedProgress = Number(entry.progress);

  if (Number.isFinite(duration) && duration > 0 && Number.isFinite(currentTime) && currentTime >= 0) {
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }

  if (!Number.isFinite(storedProgress) || storedProgress <= 0) return 0;
  // Local stores sometimes persist progress as a percentage rather than a ratio.
  return Math.min(100, Math.max(0, storedProgress <= 1 ? storedProgress * 100 : storedProgress));
}

function remainingLabel(entry: ContinueWatchingItem) {
  const duration = Number(entry.duration);
  const currentTime = Number(entry.currentTime);
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(currentTime)) return null;

  const remainingMinutes = Math.max(1, Math.ceil((duration - currentTime) / 60));
  return `${remainingMinutes} min left`;
}

/**
 * A local-only resume rail. It deliberately accepts entries and callbacks
 * rather than reaching into a store, so the host can back it with localStorage.
 */
export function ContinueWatchingRow({
  entries,
  onResume,
  onDismiss,
  className,
  heading = "Continue watching",
}: ContinueWatchingRowProps) {
  if (entries.length === 0) return null;

  return (
    <section className={cn("w-full", className)} aria-labelledby="continue-watching-heading">
      <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
        <h2
          id="continue-watching-heading"
          className="text-base font-bold tracking-[-0.015em] text-zinc-100"
          data-testid="heading-continue-watching"
        >
          {heading}
        </h2>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
          Pick up where you left off
        </span>
      </div>

      <div
        className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        data-testid="row-continue-watching"
      >
        {entries.map((entry) => {
          const percent = progressPercent(entry);
          const remaining = remainingLabel(entry);
          const episodeLabel =
            entry.episodeNumber != null ? `Episode ${entry.episodeNumber}` : null;

          return (
            <article
              key={entry.id}
              className="group relative w-[min(78vw,18rem)] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/[0.09] bg-[#101116] shadow-[0_10px_32px_rgba(0,0,0,0.24)]"
              data-testid={`card-continue-watching-${entry.id}`}
            >
              <button
                type="button"
                aria-label={`Resume ${entry.title}`}
                onClick={() => onResume(entry)}
                className="relative block aspect-[16/9] w-full overflow-hidden bg-[#191a21] text-left"
                data-testid={`button-resume-${entry.id}`}
              >
                {entry.thumbnailUrl ? (
                  <img
                    src={entry.thumbnailUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    data-testid={`img-continue-thumbnail-${entry.id}`}
                  />
                ) : (
                  <span
                    className="absolute inset-0 bg-gradient-to-br from-fuchsia-950 via-[#191a21] to-black"
                    aria-hidden="true"
                  />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-[#07080b]/85 via-transparent to-[#07080b]/10" />
                <span className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-[#111217] shadow-lg transition-transform group-active:scale-90">
                  <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden="true" />
                </span>
                {remaining ? (
                  <span className="absolute bottom-2 right-2 rounded-md bg-[#08090c]/80 px-1.5 py-1 text-[10px] font-semibold text-zinc-200 backdrop-blur-sm">
                    {remaining}
                  </span>
                ) : null}
                <span className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                  <span
                    className="block h-full bg-fuchsia-300 transition-[width] duration-300"
                    style={{ width: `${percent}%` }}
                    data-testid={`progress-continue-${entry.id}`}
                  />
                </span>
              </button>

              <button
                type="button"
                aria-label={`Dismiss ${entry.title}`}
                onClick={() => onDismiss(entry)}
                className="absolute right-2 top-2 rounded-full bg-[#08090c]/70 p-1.5 text-zinc-300 opacity-100 backdrop-blur-sm transition-colors hover:bg-[#08090c] hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
                data-testid={`button-dismiss-${entry.id}`}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              <div className="space-y-1.5 px-3 py-3">
                <p className="truncate text-sm font-semibold text-zinc-100" data-testid={`text-resume-title-${entry.id}`}>
                  {entry.title}
                </p>
                {entry.seriesTitle || episodeLabel ? (
                  <p className="truncate text-[11px] text-zinc-500" data-testid={`text-resume-meta-${entry.id}`}>
                    {[entry.seriesTitle, episodeLabel].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
