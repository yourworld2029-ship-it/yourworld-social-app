import { useEffect, useState } from "react";
import { resolveMediaUrl } from "@/lib/social-data";
import { cn } from "@/lib/utils";

type Props = {
  thumbnailUrl?: string | null;
  mediaUrl: string;
  alt: string;
  className?: string;
};

/**
 * Shows the stored thumbnail without mounting the source video. Video
 * publishers generate a durable first-frame JPEG when a custom thumbnail is
 * not supplied, so grid cards never need to buffer the source media.
 */
export function VideoPoster({ thumbnailUrl, alt, className }: Props) {
  const [resolvedThumbnail, setResolvedThumbnail] = useState<string | null>(thumbnailUrl ?? null);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">(
    thumbnailUrl ? "loading" : "loaded",
  );

  useEffect(() => {
    setThumbnailFailed(false);
    setResolvedThumbnail(thumbnailUrl ?? null);
    setLoadState(thumbnailUrl ? "loading" : "loaded");
  }, [thumbnailUrl]);

  useEffect(() => {
    if (!thumbnailUrl) return;
    let alive = true;
    void resolveMediaUrl(thumbnailUrl, "videos").then((url) => {
      if (!alive) return;
      setResolvedThumbnail(url || thumbnailUrl);
    }).catch(() => {
      if (!alive) return;
      setResolvedThumbnail(thumbnailUrl);
    });
    return () => {
      alive = false;
    };
  }, [thumbnailUrl]);

  const showThumbnail = resolvedThumbnail && !thumbnailFailed;

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
