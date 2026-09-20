import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { resolveMediaUrl } from "@/lib/social-data";
import { cn } from "@/lib/utils";

type Props = {
  thumbnailUrl?: string | null;
  mediaUrl: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  bucket?: "reels" | "videos";
};

function firstFrameUrl(url: string) {
  return url.includes("#") ? url : `${url}#t=0.001`;
}

/**
 * Uses the stored thumbnail as a real video poster. When no thumbnail exists,
 * the browser loads only metadata and the first frame instead of downloading
 * the full source video just to paint a card.
 */
export function VideoPoster({
  thumbnailUrl,
  mediaUrl,
  alt,
  className,
  loading = "lazy",
  bucket = "videos",
}: Props) {
  const [resolvedThumbnail, setResolvedThumbnail] = useState<string | null>(thumbnailUrl ?? null);
  const [resolvedMedia, setResolvedMedia] = useState(mediaUrl);
  const [mediaReady, setMediaReady] = useState(false);
  const [mediaFailed, setMediaFailed] = useState(false);

  useEffect(() => {
    setResolvedThumbnail(thumbnailUrl ?? null);
  }, [thumbnailUrl]);

  useEffect(() => {
    let alive = true;
    setResolvedMedia(mediaUrl);
    setMediaReady(false);
    setMediaFailed(false);
    if (!mediaUrl) {
      return () => {
        alive = false;
      };
    }

    void resolveMediaUrl(mediaUrl, bucket)
      .then((url) => {
        if (alive && url) setResolvedMedia(url);
      })
      .catch(() => {
        // Keep the original reference as a last attempt.
      });

    return () => {
      alive = false;
    };
  }, [bucket, mediaUrl]);

  useEffect(() => {
    if (!thumbnailUrl) {
      setResolvedThumbnail(null);
      return;
    }
    let alive = true;
    void resolveMediaUrl(thumbnailUrl, bucket)
      .then((url) => {
        if (alive) setResolvedThumbnail(url || thumbnailUrl);
      })
      .catch(() => {
        if (alive) setResolvedThumbnail(thumbnailUrl);
      });
    return () => {
      alive = false;
    };
  }, [bucket, thumbnailUrl]);

  const source = resolvedMedia ? firstFrameUrl(resolvedMedia) : "";
  const showFallback = !resolvedThumbnail && (!source || mediaFailed || !mediaReady);

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-zinc-900", className)}>
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-[linear-gradient(110deg,#18181b_8%,#27272a_18%,#18181b_33%)] bg-[length:200%_100%] transition-opacity duration-300",
          showFallback ? "animate-thumbnail-shimmer opacity-100" : "opacity-0",
        )}
      />
      {source ? (
        <video
          {...({ loading } as const)}
          src={source}
          poster={resolvedThumbnail ?? undefined}
          aria-label={alt}
          playsInline
          muted
          preload="metadata"
          onLoadedData={() => setMediaReady(true)}
          onError={() => setMediaFailed(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            showFallback ? "opacity-0" : "opacity-100",
          )}
        />
      ) : null}
      {showFallback ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950">
          <span className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/45 text-white/90 shadow-lg">
            <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" />
          </span>
        </div>
      ) : null}
    </div>
  );
}