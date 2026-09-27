import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import type { LongVideo } from "@/lib/video-data";
import { resolveMediaUrl } from "@/lib/social-data";
import { cn } from "@/lib/utils";
import { VideoPoster } from "@/components/yw/VideoPoster";

function isHlsUrl(url: string) {
  return /\.m3u8(?:$|[?#])/i.test(url);
}

/**
 * Keeps a live, muted inline preview mounted in every public vertical shelf
 * card. The poster stays visible until the browser has decoded a video frame.
 */
export function FeedVideoShelfPreview({
  video,
  className,
}: {
  video: LongVideo;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [frameReady, setFrameReady] = useState(false);
  const canAutoplay = video.access === undefined || video.access === "public";
  const hlsSource = !!source && isHlsUrl(source);

  useEffect(() => {
    let alive = true;
    setSource(null);
    setFrameReady(false);
    if (!canAutoplay || !video.mediaUrl) {
      return () => {
        alive = false;
      };
    }

    void resolveMediaUrl(video.mediaUrl, "videos")
      .then((url) => {
        if (alive) setSource(url || video.mediaUrl);
      })
      .catch(() => {
        if (alive) setSource(video.mediaUrl);
      });

    return () => {
      alive = false;
    };
  }, [canAutoplay, video.mediaUrl]);

  useEffect(() => {
    const player = videoRef.current;
    if (!player || !source || !hlsSource) return;

    player.muted = true;
    player.playsInline = true;

    if (player.canPlayType("application/vnd.apple.mpegurl")) {
      player.src = source;
      void player.play().catch(() => {});
      return () => {
        player.pause();
        player.removeAttribute("src");
        player.load();
      };
    }

    if (!Hls.isSupported()) return;

    const hls = new Hls({ enableWorker: true });
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      void player.play().catch(() => {});
    });
    hls.loadSource(source);
    hls.attachMedia(player);

    return () => {
      player.pause();
      hls.destroy();
    };
  }, [hlsSource, source]);

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
        showPlayFallback={false}
        className="pointer-events-none select-none"
      />
      <video
        ref={videoRef}
        src={source && !hlsSource ? source : undefined}
        poster={video.thumbnailUrl ?? undefined}
        aria-hidden="true"
        crossOrigin="anonymous"
        autoPlay={canAutoplay}
        muted
        loop
        playsInline
        preload="metadata"
        onLoadedData={() => setFrameReady(true)}
        onError={() => setFrameReady(false)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-150",
          frameReady ? "opacity-100" : "opacity-0",
        )}
        data-testid={`feed-video-live-preview-${video.id}`}
      />
    </div>
  );
}