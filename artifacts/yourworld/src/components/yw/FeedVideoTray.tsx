import type { ReactNode } from "react";
import { MoreVertical } from "lucide-react";
import type { LongVideo } from "@/lib/video-data";

type FeedVideoTrayProps = {
  videos: LongVideo[];
  renderPreview: (video: LongVideo) => ReactNode;
  onOpenVideo: (video: LongVideo) => void;
};

/**
 * A compact, snap-scrolling rail for quickly browsing portrait videos in the
 * home feed. Each card keeps its own muted inline preview; taps open the
 * existing video player route.
 */
export function FeedVideoTray({
  videos,
  renderPreview,
  onOpenVideo,
}: FeedVideoTrayProps) {
  if (videos.length === 0) return null;

  return (
    <section
      aria-label="Vertical video carousel"
      className="feed-video-tray bg-[#050507] py-0"
      data-testid="feed-video-tray"
    >
      <div
        aria-label="Swipe through videos"
        className="feed-video-scroll flex flex-row flex-nowrap snap-x snap-mandatory gap-0 overflow-x-auto overscroll-x-contain scroll-smooth px-3 touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        data-testid="feed-video-scroll"
      >
        {videos.map((video) => {
          const title = video.title || "Untitled video";

          return (
            <article
              key={video.id}
              className="feed-video-card relative shrink-0 snap-start overflow-hidden bg-[#111116] ring-1 ring-white/[0.08]"
              data-testid={`feed-video-card-${video.id}`}
            >
              <button
                type="button"
                aria-label={`Open ${title}`}
                className="group relative block aspect-[9/16] w-full overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fuchsia-300"
                data-testid={`button-open-video-${video.id}`}
                onClick={() => onOpenVideo(video)}
              >
                {renderPreview(video)}

                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/45 p-1 text-white/90 backdrop-blur-sm"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </span>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}