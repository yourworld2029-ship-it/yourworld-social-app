const PREFETCH_BYTES = 1024 * 1024;
const MAX_CONCURRENT_PREFETCHES = 2;
const MAX_QUEUED_PREFETCHES = 16;
const MAX_SEEN_PREFETCHES = 64;
const MAX_POSTER_CACHE_ENTRIES = 24;

type PrefetchJob = {
  key: string;
  url: string;
  controller: AbortController;
};

const active = new Map<string, Promise<void>>();
const queued: PrefetchJob[] = [];
const posters = new Map<string, string>();
const seenPrefetches = new Set<string>();
let activeCount = 0;

function mediaCacheKey(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split("#", 1)[0] ?? url;
  }
}

function pump() {
  while (activeCount < MAX_CONCURRENT_PREFETCHES && queued.length) {
    const job = queued.shift();
    if (!job) break;
    activeCount += 1;
    void fetchPrefetch(job).finally(() => {
      activeCount -= 1;
      active.delete(job.key);
      pump();
    });
  }
}

async function fetchPrefetch({ url, controller }: PrefetchJob) {
  try {
    const response = await fetch(url, {
      headers: { Range: `bytes=0-${PREFETCH_BYTES - 1}` },
      signal: controller.signal,
      cache: "default",
    });
    // A 200 means the origin ignored Range. Do not download the whole video.
    if (response.status !== 206) {
      controller.abort();
      return;
    }
    const range = response.headers.get("content-range");
    const match = range?.match(/^bytes\s+0-(\d+)\//i);
    if (!match || Number(match[1]) >= PREFETCH_BYTES) {
      controller.abort();
      return;
    }
    // Read only the bounded response. No partial response is put in
    // CacheStorage; the browser's normal HTTP cache remains in charge.
    const reader = response.body?.getReader();
    if (!reader) return;
    let total = 0;
    try {
      while (total < PREFETCH_BYTES) {
        const next = await reader.read();
        if (next.done) break;
        total += next.value.byteLength;
        if (total >= PREFETCH_BYTES) await reader.cancel();
      }
    } finally {
      reader.releaseLock();
    }
  } catch {
    // Prefetch is opportunistic; the video element remains the source of truth.
  }
}

/** Starts one bounded, deduplicated prefetch for a media URL. */
export function prefetchVideo(url: string) {
  if (typeof window === "undefined" || !url) return;
  const key = url ? mediaCacheKey(url) : "";
  if (
    !/^https?:\/\//i.test(url) ||
    /\.m3u8(?:$|[?#])/i.test(url) ||
    active.has(key) ||
    seenPrefetches.has(key) ||
    queued.length >= MAX_QUEUED_PREFETCHES
  ) {
    return;
  }
  seenPrefetches.add(key);
  while (seenPrefetches.size > MAX_SEEN_PREFETCHES) {
    const oldest = seenPrefetches.values().next().value;
    if (!oldest) break;
    seenPrefetches.delete(oldest);
  }
  const controller = new AbortController();
  const promise = Promise.resolve().then(() => {
    queued.push({ key, url, controller });
    pump();
  });
  active.set(key, promise);
}

/** Returns a small poster generated during an earlier visit, if available. */
export function getVideoPoster(url: string) {
  return posters.get(mediaCacheKey(url)) ?? null;
}

/** Safely captures a scaled first frame; cross-origin/tainted canvases simply skip caching. */
export function cacheVideoPoster(video: HTMLVideoElement, url: string): string | null {
  if (!url || !video.videoWidth || !video.videoHeight) return null;
  const key = mediaCacheKey(url);
  const existing = posters.get(key);
  if (existing) return existing;
  try {
    const scale = Math.min(1, 480 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(2, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(2, Math.round(video.videoHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const poster = canvas.toDataURL("image/jpeg", 0.62);
    posters.set(key, poster);
    while (posters.size > MAX_POSTER_CACHE_ENTRIES) {
      const oldest = posters.keys().next().value;
      if (!oldest) break;
      posters.delete(oldest);
    }
    return poster;
  } catch {
    // A tainted canvas is expected for media without CORS; playback is unaffected.
    return null;
  }
}