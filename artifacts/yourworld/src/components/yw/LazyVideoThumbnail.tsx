import { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

const FALLBACK_VIDEO_POSTER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="#09090b"/></svg>';

export const VIDEO_POSTER_FALLBACK =
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(FALLBACK_VIDEO_POSTER_SVG)}`;

type Props = {
  thumbnailUrl?: string | null;
  alt: string;
  className?: string;
  showPlayFallback?: boolean;
};

/** Renders only a stored image URL (or a static fallback); never decodes video or creates a canvas. */
export function LazyVideoThumbnail({
  thumbnailUrl,
  alt,
  className,
  showPlayFallback = false,
}: Props) {
  const baseSource = thumbnailUrl?.trim() || VIDEO_POSTER_FALLBACK;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const [loadedSource, setLoadedSource] = useState<string | null>(null);
  const source = failedSource === baseSource ? VIDEO_POSTER_FALLBACK : baseSource;
  const loaded = loadedSource === source;

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950",
        className,
      )}
    >
      {!loaded ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-zinc-800"
        />
      ) : null}
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
        className="absolute inset-0 h-full w-full object-cover"
      />
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