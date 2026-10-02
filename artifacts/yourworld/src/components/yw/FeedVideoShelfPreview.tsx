import type { LongVideo } from "@/lib/video-data";
import { FeedVideoPreview } from "@/components/yw/FeedVideoAutoplay";

const ignoreOpen = () => {};

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
    <FeedVideoPreview
      video={video}
      candidateId={`shelf:${video.id}`}
      onOpen={ignoreOpen}
      interactive={false}
      allowFrameFallback
      showPlayFallback
      previewTestId={`feed-video-preview-${video.id}`}
      className={className}
    />
  );
}