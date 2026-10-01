import type { LongVideo } from "@/lib/video-data";
import { cn } from "@/lib/utils";
import { VideoPoster } from "@/components/yw/VideoPoster";

/**
 * Keeps tray cards lightweight: their poster is shown until the viewer opens
 * the video route, where the actual player can load on demand.
 */
export function FeedVideoShelfPreview({
  video,
  className,
}: {
  video: LongVideo;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950",
        className,
      )}
      data-testid={`feed-video-preview-${video.id}`}
    >
      <VideoPoster
        thumbnailUrl={video.thumbnailUrl}
        mediaUrl={video.mediaUrl}
        alt={video.title}
        loading="lazy"
        bucket="videos"
        posterOnly
        allowFrameFallback
        showPlayFallback
        className="pointer-events-none select-none"
      />
    </div>
  );
}