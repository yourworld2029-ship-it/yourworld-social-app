import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/social-data";

const FALLBACK_VIDEO_POSTER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><defs><linearGradient id="poster" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#27272a"/><stop offset="1" stop-color="#09090b"/></linearGradient></defs><rect width="16" height="9" fill="url(#poster)"/></svg>';

export const VIDEO_POSTER_FALLBACK =
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(FALLBACK_VIDEO_POSTER_SVG)}`;

type Props = {
  thumbnailUrl?: string | null;
  alt: string;
  className?: string;
  showPlayFallback?: boolean;
  showFallbackIcon?: boolean;
  bucket?: "reels" | "videos" | "thumbnails";
};

/** Renders only a stored image URL (or a static fallback); never decodes video or creates a canvas. */
export function LazyVideoThumbnail({
  thumbnailUrl,
  alt,
  className,
  showPlayFallback = false,
  showFallbackIcon = false,
  bucket,
}: Props) {
  const rawSource = thumbnailUrl?.trim() || null;
  const resolutionKey = `${bucket ?? "raw"}:${rawSource ?? ""}`;
  const [resolvedImage, setResolvedImage] = useState<{
    key: string;
    url: string;
  } | null>(null);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const [loadedSource, setLoadedSource] = useState<string | null>(null);
  useEffect(() => {
    if (!rawSource || !bucket) return;
    let alive = true;
    void resolveMediaUrl(rawSource, bucket)
      .then((url) => {
        if (alive) setResolvedImage({ key: resolutionKey, url: url || rawSource });
      })
      .catch(() => {
        if (alive) setResolvedImage({ key: resolutionKey, url: rawSource });
      });
    return () => {
      alive = false;
    };
  }, [bucket, rawSource, resolutionKey]);

  const resolvedSource = bucket
    ? resolvedImage?.key === resolutionKey
      ? resolvedImage.url
      : null
    : rawSource;
  const baseSource = resolvedSource || VIDEO_POSTER_FALLBACK;
  const source = failedSource === baseSource ? VIDEO_POSTER_FALLBACK : baseSource;
  const isFallback = source === VIDEO_POSTER_FALLBACK;
  const loaded = loadedSource === source;

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950",
        className,
      )}
    >
      <img
        src={source}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoadedSource(source)}
        onError={() => {
          if (source !== VIDEO_POSTER_FALLBACK) {
            setFailedSource(baseSource);
          } else {
            setLoadedSource(source);
          }
        }}
        className={cn(
          "absolute inset-0 h-full w-full object-cover",
          !loaded && !isFallback ? "opacity-0" : "opacity-100",
        )}
      />
      {!loaded || isFallback ? (
        <span className="absolute inset-0 grid place-items-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950">
          {showFallbackIcon && !showPlayFallback ? (
            <span className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/45 text-white/90 shadow-lg">
              <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" />
            </span>
          ) : null}
        </span>
      ) : null}
      {showPlayFallback ? (
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/45 text-white/90 shadow-lg">
            <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" />
          </span>
        </span>
      ) : null}
    </div>
  );
}