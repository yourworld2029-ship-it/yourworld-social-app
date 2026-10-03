import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/social-data";
import { cloudflareStreamPosterUrl } from "@/lib/cloudflare-stream-media";
import { getVideoPoster, subscribeVideoPoster } from "@/lib/video-prefetch";
import { requestVideoFirstFrame } from "@/lib/video-first-frame";

// No fabricated image is ever supplied as a video's poster.
export const VIDEO_POSTER_FALLBACK = undefined;

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
  allowFrameCapture?: boolean;
};

/** Direct image loading avoids fetch/canvas CORS failures on Android WebViews. */
export function LazyVideoThumbnail({
  thumbnailUrl, mediaUrl, streamId, alt, className,
  showPlayFallback = false, showFallbackIcon = false, bucket,
  loading = "lazy", fetchPriority = "auto", onPosterResolved, allowFrameCapture = true,
}: Props) {
  const [resolved, setResolved] = useState<{ key: string; urls: string[] } | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const [loaded, setLoaded] = useState<string | null>(null);
  const [cached, setCached] = useState<string | null>(null);
  const [inView, setInView] = useState(loading === "eager");
  const [frameFailed, setFrameFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const key = `${bucket}:${thumbnailUrl}:${mediaUrl}:${streamId}`;
  useEffect(() => {
    setFailed([]); setLoaded(null); setResolved(null); setFrameFailed(false);
    if (!thumbnailUrl?.trim()) return;
    let alive = true;
    const raw = thumbnailUrl.trim();
    if (raw.startsWith("data:image/svg+xml")) return;
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
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") { setInView(true); return; }
    let intersecting = false;
    const update = () => setInView(intersecting && document.visibilityState !== "hidden");
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; update(); },
      { rootMargin: "150px", threshold: 0 });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);
  const primary = resolved?.key === key ? resolved.urls : [];
  const cloudflare = cloudflareStreamPosterUrl(mediaUrl, streamId);
  const source = [...primary, cloudflare, cached].find((url) => !!url && !failed.includes(url)) ?? null;
  useEffect(() => {
    if (source || !mediaUrl || !inView || !allowFrameCapture || frameFailed) return;
    const controller = new AbortController();
    requestVideoFirstFrame(mediaUrl, controller.signal, (frame) => {
      if (frame) setCached(frame); else setFrameFailed(true);
    });
    return () => controller.abort();
  }, [source, mediaUrl, inView, allowFrameCapture, frameFailed]);
  useEffect(() => { if (source) onPosterResolved?.(source); }, [source, onPosterResolved]);
  return <div ref={containerRef} className={cn("relative h-full w-full overflow-hidden bg-transparent", className)}>
    {!source && <span data-testid={frameFailed ? "video-frame-error" : "video-frame-loading"} role="status"
      className="absolute inset-0 grid place-items-center px-3 text-center text-xs text-white/70">
      {frameFailed || !mediaUrl ? "Video preview unavailable" : "Loading video frame…"}
    </span>}
    {source ? <img key={source} src={source} alt={alt} loading={loading} decoding="async" fetchPriority={fetchPriority}
      onLoad={() => setLoaded(source)}
      onError={() => { setFailed((previous) => [...previous, source]); setLoaded(null); }}
      className={cn("absolute inset-0 h-full w-full object-cover", loaded === source ? "opacity-100" : "opacity-0")} /> : null}
    {showPlayFallback || (showFallbackIcon && !source) ? <span className="pointer-events-none absolute inset-0 grid place-items-center"><span className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/45 text-white/90"><Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" /></span></span> : null}
  </div>;
}