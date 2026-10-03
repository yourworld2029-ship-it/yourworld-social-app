import { useCallback, useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { resolveMediaUrl } from "@/lib/social-data";
import { cn } from "@/lib/utils";
import {
  cacheVideoPoster,
  getVideoPoster,
  subscribeVideoPoster,
} from "@/lib/video-prefetch";
import { VIDEO_POSTER_FALLBACK } from "@/components/yw/LazyVideoThumbnail";
import { useScreenImage } from "@/lib/screen-image";

type Props = {
  thumbnailUrl?: string | null;
  mediaUrl: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  bucket?: "reels" | "videos" | "thumbnails";
  posterOnly?: boolean;
  allowFrameFallback?: boolean;
  showPlayFallback?: boolean;
  showLoadingShimmer?: boolean;
  onPosterResolved?: (url: string) => void;
};

function firstFrameUrl(url: string) {
  return `${url.split("#", 1)[0]}#t=1`;
}

/**
  * Shows screen-sized thumbnails. Optional frame extraction is reserved for
  * authorized detail surfaces, never feed/profile list cards.
 */
export function VideoPoster({
  thumbnailUrl,
  mediaUrl,
  alt,
  className,
  loading = "lazy",
  fetchPriority = "auto",
  bucket = "thumbnails",
  posterOnly = false,
  allowFrameFallback = false,
  showPlayFallback = true,
  showLoadingShimmer = false,
  onPosterResolved,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [resolvedThumbnail, setResolvedThumbnail] = useState<string | null>(null);
  const [resolvedMedia, setResolvedMedia] = useState("");
  const [mediaReady, setMediaReady] = useState(false);
  const [thumbnailReady, setThumbnailReady] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [shouldLoadFrame, setShouldLoadFrame] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasThumbnail = Boolean(resolvedThumbnail) && !thumbnailFailed;
  const needsFrame =
    allowFrameFallback && !hasThumbnail && (!thumbnailUrl || thumbnailFailed);

  useEffect(() => {
    setResolvedThumbnail(null);
    setThumbnailReady(false);
    setThumbnailFailed(false);
    setResolvedMedia("");
    setMediaReady(false);
    setShouldLoadFrame(false);
  }, [mediaUrl, thumbnailUrl]);

  useEffect(() => {
    if (!needsFrame) {
      setShouldLoadFrame(false);
      return;
    }

    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setShouldLoadFrame(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setShouldLoadFrame(true);
        observer.disconnect();
      },
      { rootMargin: "240px", threshold: 0.01 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [needsFrame, mediaUrl, thumbnailUrl]);

  useEffect(() => {
    if (!needsFrame || !shouldLoadFrame || !mediaUrl) {
      setResolvedMedia("");
      setMediaReady(false);
      return;
    }

    let alive = true;
    setResolvedMedia(mediaUrl);
    setMediaReady(false);
    void resolveMediaUrl(mediaUrl, bucket)
      .then((url) => {
        if (!alive) return;
        if (url) {
          setResolvedMedia(url);
        } else {
          setThumbnailFailed(true);
        }
      })
      .catch(() => {
        if (alive) setResolvedMedia(mediaUrl);
      });

    return () => {
      alive = false;
    };
  }, [bucket, mediaUrl, needsFrame, shouldLoadFrame]);

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
        if (!alive) return;
        if (!url) {
          setResolvedThumbnail(null);
          setThumbnailFailed(true);
          return;
        }
        if (url !== thumbnailUrl) {
          setThumbnailReady(false);
          setThumbnailFailed(false);
        }
        setResolvedThumbnail(url);
      })
      .catch(() => {
        if (alive) {
          setResolvedThumbnail(null);
          setThumbnailFailed(true);
        }
      });
    return () => {
      alive = false;
    };
  }, [bucket, thumbnailUrl]);

  useEffect(() => {
    if (!resolvedMedia) return;
    const cachedPoster = getVideoPoster(resolvedMedia);
    if (cachedPoster && (!thumbnailUrl || thumbnailFailed)) {
      setResolvedThumbnail(cachedPoster);
      setThumbnailFailed(false);
      setThumbnailReady(true);
    }
  }, [posterOnly, resolvedMedia, thumbnailFailed, thumbnailUrl]);

  useEffect(() => {
    const showCachedPoster = (poster: string) => {
      if (thumbnailUrl && !thumbnailFailed) return;
      setResolvedThumbnail(poster);
      setThumbnailReady(true);
      setThumbnailFailed(false);
    };
    const cachedPoster = getVideoPoster(mediaUrl);
    if (cachedPoster) showCachedPoster(cachedPoster);
    return subscribeVideoPoster(mediaUrl, showCachedPoster);
  }, [mediaUrl, thumbnailFailed, thumbnailUrl]);

  const posterImage = hasThumbnail ? resolvedThumbnail! : VIDEO_POSTER_FALLBACK;
  const image = useScreenImage(posterImage, loading === "eager");
  useEffect(() => {
    if (image.error) {
      setThumbnailFailed(true);
      setThumbnailReady(false);
    }
  }, [image.error]);
  const source =
    needsFrame && shouldLoadFrame && resolvedMedia ? firstFrameUrl(resolvedMedia) : "";
  const showFallback = !thumbnailReady && !mediaReady;

  useEffect(() => {
    onPosterResolved?.(posterImage);
  }, [onPosterResolved, posterImage]);

  const captureFrame = useCallback(() => {
    const player = videoRef.current;
    if (!player) return;
    if (Number.isFinite(player.duration) && player.duration > 0.1) {
      const targetTime = Math.min(1, player.duration - 0.1);
      if (player.currentTime < targetTime - 0.05) {
        try {
          player.currentTime = targetTime;
          return;
        } catch {
          // Some remote streams only allow seeking after the first frame is ready.
        }
      }
    }

    setMediaReady(true);
    const generatedPoster = cacheVideoPoster(player, resolvedMedia);
    if (generatedPoster) {
      setResolvedThumbnail(generatedPoster);
      setThumbnailReady(true);
      setThumbnailFailed(false);
    }
  }, [resolvedMedia]);

  return (
    <div
      ref={(node) => { containerRef.current = node; image.ref.current = node; }}
      className={cn(
        "relative h-full w-full overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-[linear-gradient(110deg,#18181b_8%,#27272a_18%,#18181b_33%)] bg-[length:200%_100%] transition-opacity duration-300",
          showFallback && showLoadingShimmer
            ? "animate-thumbnail-shimmer opacity-100"
            : "opacity-0",
        )}
      />
      <img
        src={image.source || VIDEO_POSTER_FALLBACK}
        alt={alt}
        loading="lazy"
        fetchPriority={fetchPriority}
        decoding="async"
        onLoad={() => {
          if (!image.source || image.source === VIDEO_POSTER_FALLBACK) return;
          setThumbnailReady(true);
          setThumbnailFailed(false);
        }}
        onError={() => {
          if (posterImage === VIDEO_POSTER_FALLBACK) {
            return;
          }
          setThumbnailReady(false);
          setThumbnailFailed(true);
        }}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
          mediaReady ? "opacity-0" : "opacity-100",
        )}
      />
      {source ? (
        <video
          ref={videoRef}
          crossOrigin="anonymous"
          src={source}
          poster={posterImage}
          aria-label={alt}
          playsInline
          muted
          preload="metadata"
          onLoadedMetadata={(event) => {
            const player = event.currentTarget;
            if (Number.isFinite(player.duration) && player.duration > 0.1) {
              const targetTime = Math.min(1, player.duration - 0.1);
              if (player.currentTime < targetTime - 0.05) {
                try {
                  player.currentTime = targetTime;
                } catch {
                  captureFrame();
                }
              } else {
                captureFrame();
              }
            }
          }}
          onLoadedData={captureFrame}
          onSeeked={captureFrame}
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