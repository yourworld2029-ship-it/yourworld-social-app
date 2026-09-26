const PREFETCH_BYTES = 1024 * 1024;
const MAX_CONCURRENT_PREFETCHES = 2;
const MAX_QUEUED_PREFETCHES = 16;
const MAX_SEEN_PREFETCHES = 64;
const MAX_POSTER_CACHE_ENTRIES = 24;
const VIDEO_PREFIX_CACHE = "yourworld-video-prefixes-v1";
const PREFIX_TTL_MS = 10 * 60 * 1000;
const MAX_PREFIX_ENTRIES = 4;

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

function urlWithoutFragment(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url.split("#", 1)[0] ?? url;
  }
}

async function prefixCacheKey(url: string) {
  if (!globalThis.crypto?.subtle) return null;
  const bytes = new TextEncoder().encode(urlWithoutFragment(url));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return new URL(`/__yourworld-video-prefix/${hash}`, window.location.origin).toString();
}

async function cachePrefix(
  url: string,
  body: Blob,
  contentType: string,
  total: number,
) {
  if (typeof caches === "undefined") return;
  const key = await prefixCacheKey(url);
  if (!key) return;
  const cache = await caches.open(VIDEO_PREFIX_CACHE);
  const now = Date.now();
  const entries = await cache.keys();
  await Promise.all(
    entries.map(async (entry) => {
      const response = await cache.match(entry);
      const expires = Number(response?.headers.get("X-YW-Prefix-Expires") ?? 0);
      if (!response || !Number.isFinite(expires) || expires <= now) {
        await cache.delete(entry);
      }
    }),
  );
  const freshEntries = await cache.keys();
  if (freshEntries.length >= MAX_PREFIX_ENTRIES && !(await cache.match(key))) {
    const oldest = await Promise.all(
      freshEntries.map(async (entry) => {
        const response = await cache.match(entry);
        return {
          entry,
          created: Number(response?.headers.get("X-YW-Prefix-Created") ?? 0),
        };
      }),
    );
    oldest.sort((a, b) => a.created - b.created);
    await cache.delete(oldest[0]?.entry ?? freshEntries[0]);
  }
  await cache.put(
    key,
    new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType || "video/mp4",
        "Cache-Control": "private, no-transform",
        "X-YW-Prefix-Created": String(now),
        "X-YW-Prefix-Expires": String(now + PREFIX_TTL_MS),
        "X-YW-Prefix-Total": String(total),
      },
    }),
  );
  const allEntries = await cache.keys();
  if (allEntries.length > MAX_PREFIX_ENTRIES) {
    const oldest = await Promise.all(
      allEntries.map(async (entry) => {
        const response = await cache.match(entry);
        return {
          entry,
          created: Number(response?.headers.get("X-YW-Prefix-Created") ?? 0),
        };
      }),
    );
    oldest.sort((a, b) => a.created - b.created);
    for (const entry of oldest.slice(0, allEntries.length - MAX_PREFIX_ENTRIES)) {
      await cache.delete(entry.entry);
    }
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
    const match = range?.match(/^bytes\s+0-(\d+)\/(\d+)$/i);
    const rangeEnd = Number(match?.[1]);
    const rangeTotal = Number(match?.[2]);
    if (
      response.status !== 206 ||
      !match ||
      !Number.isSafeInteger(rangeEnd) ||
      !Number.isSafeInteger(rangeTotal) ||
      rangeEnd < 0 ||
      rangeEnd >= PREFETCH_BYTES ||
      rangeTotal <= rangeEnd
    ) {
      controller.abort();
      return;
    }
    const expectedBytes = rangeEnd + 1;
    const declaredLength = response.headers.get("content-length");
    if (
      declaredLength !== null &&
      (!Number.isSafeInteger(Number(declaredLength)) ||
        Number(declaredLength) !== expectedBytes)
    ) {
      controller.abort();
      return;
    }
    // Read only the bounded response. Store a synthetic 200, never the 206
    // itself, so the worker can safely reconstruct later range responses.
    const reader = response.body?.getReader();
    if (!reader) return;
    const chunks: ArrayBuffer[] = [];
    let total = 0;
    try {
      while (total < PREFETCH_BYTES) {
        const next = await reader.read();
        if (next.done) break;
        const remaining = PREFETCH_BYTES - total;
        const value = next.value.byteLength > remaining
          ? next.value.subarray(0, remaining)
          : next.value;
        chunks.push(
          value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength),
        );
        total += value.byteLength;
        if (total >= PREFETCH_BYTES) await reader.cancel();
      }
    } finally {
      reader.releaseLock();
    }
    if (total !== expectedBytes) {
      return;
    }
    if (total > 0) {
      await cachePrefix(
        url,
        new Blob(chunks, { type: response.headers.get("content-type") || "video/mp4" }),
        response.headers.get("content-type") || "video/mp4",
        rangeTotal,
      );
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