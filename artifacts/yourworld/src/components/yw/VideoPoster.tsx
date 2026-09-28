import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { resolveMediaUrl } from "@/lib/social-data";
import { cn } from "@/lib/utils";
import { cacheVideoPoster, getVideoPoster } from "@/lib/video-prefetch";

type Props = {
  thumbnailUrl?: string | null;
  mediaUrl: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  bucket?: "reels" | "videos";
  posterOnly?: boolean;
  showPlayFallback?: boolean;
};

function firstFrameUrl(url: string) {
  return url.includes("#") ? url : `${url}#t=0.001`;
}

/**
 * Shows stored thumbnails as static images. A first-frame fallback is kept for
 * legacy media without a thumbnail, but never preloads video bytes in the card.
 */
export function VideoPoster({
  thumbnailUrl,
  mediaUrl,
  alt,
  className,
  loading = "lazy",
  bucket = "videos",
  posterOnly = false,
  showPlayFallback = true,
}: Props) {
  const [resolvedThumbnail, setResolvedThumbnail] = useState<string | null>(thumbnailUrl ?? null);
  const [resolvedMedia, setResolvedMedia] = useState(mediaUrl);
  const [mediaReady, setMediaReady] = useState(false);
  const [thumbnailReady, setThumbnailReady] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setResolvedThumbnail(thumbnailUrl ?? null);
    setThumbnailReady(false);
    setThumbnailFailed(false);
  }, [thumbnailUrl]);

  useEffect(() => {
    if (posterOnly) {
      setResolvedMedia("");
      setMediaReady(false);
      return;
    }

    let alive = true;
    setResolvedMedia(mediaUrl);
    setMediaReady(false);
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
  }, [bucket, mediaUrl, posterOnly]);

  useEffect(() => {
    if (!thumbnailUrl) {
      setResolvedThumbnail(null);
      setThumbnailReady(false);
      setThumbnailFailed(false);
      return;
    }
    let alive = true;
    void resolveMediaUrl(thumbnailUrl, bucket)
      .then((url) => {
        if (!alive || !url) return;
        if (url !== thumbnailUrl) {
          setThumbnailReady(false);
          setThumbnailFailed(false);
        }
        setResolvedThumbnail(url);
      })
      .catch(() => {
        if (alive) setResolvedThumbnail(thumbnailUrl);
      });
    return () => {
      alive = false;
    };
  }, [bucket, thumbnailUrl]);

  useEffect(() => {
    if (!resolvedMedia || posterOnly) return;
    const cachedPoster = getVideoPoster(resolvedMedia);
    if (cachedPoster && (!thumbnailUrl || thumbnailFailed)) {
      setResolvedThumbnail(cachedPoster);
      setThumbnailFailed(false);
      setThumbnailReady(true);
    }
  }, [posterOnly, resolvedMedia, thumbnailFailed, thumbnailUrl]);

  const source =
    !posterOnly && !thumbnailUrl && resolvedMedia
      ? firstFrameUrl(resolvedMedia)
      : "";
  const hasThumbnail = Boolean(resolvedThumbnail) && !thumbnailFailed;
  const showFallback = !thumbnailReady && !mediaReady;

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-[linear-gradient(110deg,#18181b_8%,#27272a_18%,#18181b_33%)] bg-[length:200%_100%] transition-opacity duration-300",
          showFallback ? "animate-thumbnail-shimmer opacity-100" : "opacity-0",
        )}
      />
      {hasThumbnail ? (
        <img
          src={resolvedThumbnail ?? undefined}
          alt={alt}
          loading={loading}
          decoding="async"
          onLoad={() => {
            setThumbnailReady(true);
            setThumbnailFailed(false);
          }}
          onError={() => {
            setThumbnailReady(false);
            setThumbnailFailed(true);
          }}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            mediaReady ? "opacity-0" : "opacity-100",
          )}
        />
      ) : null}
      {source ? (
        <video
          ref={videoRef}
          {...({ loading } as const)}
          crossOrigin="anonymous"
          src={source}
          poster={hasThumbnail ? resolvedThumbnail ?? undefined : undefined}
          aria-label={alt}
          playsInline
          muted
          preload="none"
          onLoadedData={() => {
            setMediaReady(true);
            if (!hasThumbnail && videoRef.current) {
              const generatedPoster = cacheVideoPoster(videoRef.current, resolvedMedia);
              if (generatedPoster) {
                setResolvedThumbnail(generatedPoster);
                setThumbnailReady(true);
                setThumbnailFailed(false);
              }
            }
          }}
          onError={() => setMediaReady(false)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            mediaReady ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}
      {showFallback ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950">
          {showPlayFallback ? (
            <span className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/45 text-white/90 shadow-lg">
              <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" />
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}