import type { ReactNode } from "react";
import { Volume2, VolumeX } from "lucide-react";
import type { LongVideo } from "@/lib/video-data";

type FeedVideoTrayProps = {
  videos: LongVideo[];
  instanceKey: string;
  activeVideoId: string | null;
  muted: boolean;
  renderPreview: (video: LongVideo, candidateId: string) => ReactNode;
  onToggleMute: () => void;
  onOpenVideo: (video: LongVideo, candidateId: string) => void;
};

/**
 * A compact, snap-scrolling rail for quickly browsing portrait videos in the
 * home feed. Playback stays with the parent; this component only owns the
 * browse and mute controls.
 */
export function FeedVideoTray({
  videos,
  instanceKey,
  activeVideoId,
  muted,
  renderPreview,
  onToggleMute,
  onOpenVideo,
}: FeedVideoTrayProps) {
  if (videos.length < 2) return null;

  return (
    <section
      aria-label="Video tray"
      className="border-y border-white/[0.07] bg-[#050507] py-3.5"
      data-testid="feed-video-tray"
    >
      <div className="mb-2.5 flex items-end justify-between gap-3 px-4">
        <div className="min-w-0">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fuchsia-300/80"
            data-testid="text-feed-video-tray-label"
          >
            Quick picks
          </p>
          <h2
            className="mt-0.5 truncate text-sm font-semibold tracking-[-0.01em] text-zinc-100"
            data-testid="text-feed-video-tray-title"
          >
            Keep watching
          </h2>
        </div>
        <span
          className="shrink-0 pb-0.5 text-[11px] font-medium text-zinc-500"
          data-testid="text-feed-video-count"
        >
          {videos.length} videos
        </span>
      </div>

      <div
        aria-label="Swipe through videos"
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        data-testid="feed-video-scroll"
      >
        {videos.map((video) => {
          const candidateId = `${instanceKey}:${video.id}`;
          const isActive = candidateId === activeVideoId;
          const title = video.title || "Untitled video";

          return (
            <article
              key={video.id}
              className={`relative w-[min(68vw,15.5rem)] shrink-0 snap-start overflow-hidden rounded-[1.35rem] bg-[#111116] transition-transform duration-200 ${
                isActive
                  ? "ring-2 ring-fuchsia-400/80 ring-offset-2 ring-offset-[#050507]"
                  : "ring-1 ring-white/[0.08]"
              }`}
              data-testid={`feed-video-card-${video.id}`}
            >
              <button
                type="button"
                aria-current={isActive ? "true" : undefined}
                aria-label={`Open ${title}`}
                className="group relative block aspect-[9/16] w-full overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fuchsia-300"
                data-testid={`button-open-video-${video.id}`}
                onClick={() => onOpenVideo(video, candidateId)}
              >
                <div
                  className="absolute inset-0 bg-[#15151c]"
                  data-testid={`feed-video-preview-${video.id}`}
                >
                  {renderPreview(video, candidateId)}
                </div>

                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/90 via-black/35 to-transparent"
                />
                <span
                  className="pointer-events-none absolute inset-x-3 bottom-3.5"
                  data-testid={`feed-video-caption-${video.id}`}
                >
                  <span
                    className="block line-clamp-2 text-sm font-semibold leading-snug text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]"
                    data-testid={`text-feed-video-title-${video.id}`}
                  >
                    {title}
                  </span>
                  <span
                    className="mt-1 block truncate text-[11px] font-medium text-zinc-300"
                    data-testid={`text-feed-video-author-${video.id}`}
                  >
                    {video.author.name}
                  </span>
                </span>

                {isActive && (
                  <span
                    className="pointer-events-none absolute left-3 top-3 rounded-full bg-fuchsia-400/90 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#160c1c]"
                    data-testid={`status-active-video-${video.id}`}
                  >
                    Playing
                  </span>
                )}
              </button>

              {isActive && (
                <button
                  type="button"
                  aria-label={muted ? `Unmute ${title}` : `Mute ${title}`}
                  className="absolute bottom-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/65 text-white backdrop-blur-md transition-colors hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300 active:scale-95"
                  data-testid={`button-toggle-mute-${video.id}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleMute();
                  }}
                >
                  {muted ? (
                    <VolumeX aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
                  ) : (
                    <Volume2 aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
                  )}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}