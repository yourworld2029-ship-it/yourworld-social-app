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
 * first frame of the video itself (`#t=0.5`) so cards never render blank.
 */
export function VideoPoster({ thumbnailUrl, mediaUrl, alt, className }: Props) {
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [resolvedThumbnail, setResolvedThumbnail] = useState<string | null>(null);
  const [frameFailed, setFrameFailed] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  useEffect(() => {
    setThumbnailFailed(false);
    setFrameFailed(false);
    setFrameUrl(null);
    setResolvedThumbnail(null);
  }, [thumbnailUrl, mediaUrl]);

  useEffect(() => {
    if (!thumbnailUrl) return;
    let alive = true;
    void resolveMediaUrl(thumbnailUrl, "videos").then((url) => {
      if (alive) setResolvedThumbnail(url || thumbnailUrl);
    });
    return () => {
      alive = false;
    };
  }, [thumbnailUrl]);

  useEffect(() => {
    if ((thumbnailUrl && !thumbnailFailed) || !mediaUrl) return;
    let alive = true;
    void resolveLongVideoUrl(mediaUrl).then((url) => {
      if (alive && url) setFrameUrl(`${url}${url.includes("#") ? "" : "#t=0.5"}`);
    });
    return () => {
      alive = false;
    };
  }, [thumbnailFailed, thumbnailUrl, mediaUrl]);

  if ((resolvedThumbnail || thumbnailUrl) && !thumbnailFailed) {
    return (
      <img
        src={resolvedThumbnail || thumbnailUrl || undefined}
        alt={alt}
        loading="lazy"
        onError={() => setThumbnailFailed(true)}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  if (frameUrl && !frameFailed) {
    return (
      <video
        src={frameUrl}
        muted
        playsInline
        preload="metadata"
        aria-label={alt}
        onError={() => setFrameFailed(true)}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  return <div className={cn("h-full w-full bg-gradient-to-br from-zinc-800 to-zinc-900", className)} />;
}
