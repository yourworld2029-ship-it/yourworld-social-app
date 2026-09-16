import { useEffect, useState } from "react";
import { resolveLongVideoUrl } from "@/lib/video-data";
import { resolveMediaUrl } from "@/lib/social-data";
import { cn } from "@/lib/utils";

type Props = {
  thumbnailUrl?: string | null;
  mediaUrl: string;
  alt: string;
  className?: string;
};

/**
 * Shows the custom thumbnail when present, otherwise falls back to the
 * first frame of the video itself (`#t=1.0`) so cards never render blank.
 */
export function VideoPoster({ thumbnailUrl, mediaUrl, alt, className }: Props) {
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [resolvedThumbnail, setResolvedThumbnail] = useState<string | null>(null);
  const [thumbnailResolved, setThumbnailResolved] = useState(false);
  const [frameFailed, setFrameFailed] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    setThumbnailFailed(false);
    setFrameFailed(false);
    setFrameUrl(null);
    setResolvedThumbnail(null);
    setThumbnailResolved(false);
    setLoadState("loading");
  }, [thumbnailUrl, mediaUrl]);

  useEffect(() => {
    if (!thumbnailUrl) return;
    let alive = true;
    void resolveMediaUrl(thumbnailUrl, "videos").then((url) => {
      if (!alive) return;
      setResolvedThumbnail(url || thumbnailUrl);
      setThumbnailResolved(true);
    }).catch(() => {
      if (!alive) return;
      setResolvedThumbnail(thumbnailUrl);
      setThumbnailResolved(true);
    });
    return () => {
      alive = false;
    };
  }, [thumbnailUrl]);

  useEffect(() => {
    if ((thumbnailUrl && !thumbnailFailed) || !mediaUrl) return;
    let alive = true;
    void resolveLongVideoUrl(mediaUrl).then((url) => {
      if (alive && url) setFrameUrl(`${url}${url.includes("#") ? "" : "#t=1.0"}`);
    });
    return () => {
      alive = false;
    };
  }, [thumbnailFailed, thumbnailUrl, mediaUrl]);

  const showThumbnail = thumbnailResolved && resolvedThumbnail && !thumbnailFailed;
  const showFrame = frameUrl && !frameFailed && !showThumbnail;

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-zinc-900", className)}>
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-[linear-gradient(110deg,#18181b_8%,#27272a_18%,#18181b_33%)] bg-[length:200%_100%] transition-opacity duration-300",
          loadState === "loading" ? "animate-thumbnail-shimmer opacity-100" : "opacity-0",
        )}
      />
      {showThumbnail ? (
        <img
          src={resolvedThumbnail || thumbnailUrl || undefined}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoadState("loaded")}
          onError={() => {
            setThumbnailFailed(true);
            setLoadState("loading");
          }}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            loadState === "loaded" ? "opacity-100" : "opacity-0",
          )}
        />
      ) : showFrame ? (
        <video
          src={frameUrl}
          muted
          playsInline
          preload="metadata"
          tabIndex={-1}
          aria-label={alt}
          onLoadedData={() => setLoadState("loaded")}
          onError={() => {
            setFrameFailed(true);
            setLoadState("error");
          }}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            loadState === "loaded" ? "opacity-100" : "opacity-0",
          )}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950" />
      )}
    </div>
  );
}
