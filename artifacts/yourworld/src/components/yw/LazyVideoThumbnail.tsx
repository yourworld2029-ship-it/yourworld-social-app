import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/social-data";
import { cloudflareStreamPosterUrl } from "@/lib/cloudflare-stream-media";
import { getVideoPoster, subscribeVideoPoster } from "@/lib/video-prefetch";

const FALLBACK_VIDEO_POSTER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><defs><linearGradient id="p"><stop stop-color="#4c1d95"/><stop offset="1" stop-color="#164e63"/></linearGradient></defs><rect width="16" height="9" fill="url(#p)"/></svg>';
export const VIDEO_POSTER_FALLBACK = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(FALLBACK_VIDEO_POSTER_SVG)}`;

type Props = {
  thumbnailUrl?: string | null;
  mediaUrl?: string | null;
  streamId?: string | null;
  alt: string;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  className?: string;
  showPlayFallback?: boolean;
  showFallbackIcon?: boolean;
  bucket?: "reels" | "videos" | "thumbnails";
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  onPosterResolved?: (url: string) => void;
};

export function VideoThumbnailFallback({ title, authorName, authorAvatarUrl }: {
  title: string; authorName?: string | null; authorAvatarUrl?: string | null;
}) {
  return <div data-testid="video-thumbnail-fallback" className="absolute inset-0 flex flex-col justify-end gap-2 bg-gradient-to-br from-violet-900 via-slate-800 to-cyan-900 p-4 text-white">
    <Play aria-hidden="true" className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 text-white/40" />
    <p className="relative line-clamp-2 text-sm font-semibold leading-tight">{title.trim() || "YourWorld video"}</p>
    <div className="relative flex items-center gap-2 text-xs text-white/80">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15">
        {authorAvatarUrl ? <img src={authorAvatarUrl} alt="" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.hidden = true; }} /> : (authorName || "YW").slice(0, 2).toUpperCase()}
      </span>
      <span className="truncate">{authorName || "YourWorld creator"}</span>
    </div>
  </div>;
}

/** Direct image loading avoids fetch/canvas CORS failures on Android WebViews. */
export function LazyVideoThumbnail({
  thumbnailUrl, mediaUrl, streamId, alt, authorName, authorAvatarUrl, className,
  showPlayFallback = false, showFallbackIcon = false, bucket,
  loading = "lazy", fetchPriority = "auto", onPosterResolved,
}: Props) {
  const [resolved, setResolved] = useState<{ key: string; urls: string[] } | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const [loaded, setLoaded] = useState<string | null>(null);
  const [cached, setCached] = useState<string | null>(null);
  const key = `${bucket}:${thumbnailUrl}:${mediaUrl}:${streamId}`;
  useEffect(() => {
    setFailed([]); setLoaded(null); setResolved(null);
    if (!thumbnailUrl?.trim()) return;
    let alive = true;
    const raw = thumbnailUrl.trim();
    // Remote images must not be fetched in JS first. A normal img can render
    // cross-origin images even when fetch/createImageBitmap is denied.
    const remote = /^(https?:|blob:|data:image\/)/i.test(raw);
    if (remote) setResolved({ key, urls: [raw] });
    const promise = remote && !raw.includes("/storage/v1/object/sign/")
      ? Promise.resolve([raw])
      : Promise.all([...new Set([bucket ?? "thumbnails", "thumbnails", "videos", "reels"])]
          .map((candidate) => resolveMediaUrl(raw, candidate).catch(() => "")));
    void promise.then((urls) => { if (alive) setResolved({ key, urls: [...new Set(urls.filter(Boolean))] }); })
      .catch(() => { if (alive) setResolved({ key, urls: remote ? [raw] : [] }); });
    return () => { alive = false; };
  }, [key, bucket, thumbnailUrl]);
  useEffect(() => {
    setCached(mediaUrl ? getVideoPoster(mediaUrl) : null);
    if (!mediaUrl) return;
    return subscribeVideoPoster(mediaUrl, setCached);
  }, [mediaUrl]);
  const primary = resolved?.key === key ? resolved.urls : [];
  const cloudflare = cloudflareStreamPosterUrl(mediaUrl, streamId);
  const source = [...primary, cloudflare, cached].find((url) => !!url && !failed.includes(url)) ?? null;
  useEffect(() => { onPosterResolved?.(source ?? VIDEO_POSTER_FALLBACK); }, [source, onPosterResolved]);
  return <div className={cn("relative h-full w-full overflow-hidden bg-violet-950", className)}>
    <VideoThumbnailFallback title={alt} authorName={authorName} authorAvatarUrl={authorAvatarUrl} />
    {source ? <img key={source} src={source} alt={alt} loading={loading} decoding="async" fetchPriority={fetchPriority}
      onLoad={() => setLoaded(source)}
      onError={() => { setFailed((previous) => [...previous, source]); setLoaded(null); }}
      className={cn("absolute inset-0 h-full w-full object-cover", loaded === source ? "opacity-100" : "opacity-0")} /> : null}
    {showPlayFallback || (showFallbackIcon && !source) ? <span className="pointer-events-none absolute inset-0 grid place-items-center"><span className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/45 text-white/90"><Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" /></span></span> : null}
  </div>;
}