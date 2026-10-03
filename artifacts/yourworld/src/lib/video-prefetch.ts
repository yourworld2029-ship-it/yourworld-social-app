import { getHlsNetworkHeightCap } from "@/lib/video-hls-config";

// Prefetch is limited to the next video's initial window and a strict byte cap.
const PREFETCH_TARGET_SECONDS = 3;
const MAX_PREFETCH_BYTES = 2 * 1024 * 1024;
const MAX_CONCURRENT_PREFETCHES = 1;
const MAX_QUEUED_PREFETCHES = 1;
const MAX_SEEN_PREFETCHES = 64;
const MAX_POSTER_CACHE_ENTRIES = 24;
const VIDEO_PREFIX_CACHE = "yourworld-video-prefixes-v1";
const HLS_SEGMENT_CACHE = "yourworld-video-hls-prefixes-v1";
const PREFIX_TTL_MS = 10 * 60 * 1000;
const MAX_PREFIX_ENTRIES = 4;
const MAX_HLS_SEGMENT_ENTRIES = 8;
const MAX_HLS_SEGMENT_BYTES = 2 * 1024 * 1024;
const VIDEO_POSTER_READY_EVENT = "yourworld:video-poster-ready";

type PrefetchJob = {
  key: string;
  url: string;
  controller: AbortController;
  durationSeconds?: number | null;
};

const active = new Map<string, PrefetchJob>();
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
    if (job.controller.signal.aborted) {
      if (active.get(job.key) === job) active.delete(job.key);
      seenPrefetches.delete(job.key);
      continue;
    }
    activeCount += 1;
    void fetchPrefetch(job).finally(() => {
      activeCount -= 1;
      if (active.get(job.key) === job) active.delete(job.key);
      pump();
    });
  }
}

export async function canPrefetchVideo() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;

  const browserNavigator = navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean };
    getBattery?: () => Promise<{ charging: boolean; level: number }>;
  };
  const connection = browserNavigator.connection;
  if (
    connection?.saveData ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g" ||
    connection?.effectiveType === "3g"
  ) {
    return false;
  }

  // The feed already limits this work to fast networks and non-constrained
  // devices. Do not disable the requested prefetch on browsers without Battery API.
  if (typeof browserNavigator.getBattery !== "function") return true;
  try {
    const battery = await browserNavigator.getBattery();
    return battery.charging || (Number.isFinite(battery.level) && battery.level >= 0.2);
  } catch {
    return true;
  }
}

type HlsVariant = { url: string; height: number; bandwidth: number };

function cloudflareStreamUrl(url: string) {
  try {
    const host = new URL(url).hostname;
    return host === "videodelivery.net" || host.endsWith(".cloudflarestream.com");
  } catch {
    return false;
  }
}

function findHlsVariant(manifest: string, baseUrl: string, heightCap: number) {
  const lines = manifest.split(/\r?\n/).map((line) => line.trim());
  const variants: HlsVariant[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line?.startsWith("#EXT-X-STREAM-INF:")) continue;
    const uri = lines.slice(index + 1).find((candidate) => candidate && !candidate.startsWith("#"));
    if (!uri) continue;
    const resolution = line.match(/(?:^|,)RESOLUTION=\d+x(\d+)(?:,|$)/i);
    const bandwidth = line.match(/(?:^|,)BANDWIDTH=(\d+)(?:,|$)/i);
    try {
      variants.push({
        url: new URL(uri, baseUrl).toString(),
        height: Number(resolution?.[1] ?? 0),
        bandwidth: Number(bandwidth?.[1] ?? 0),
      });
    } catch {
      // Ignore invalid playlist URIs.
    }
  }
  if (!variants.length) return null;
  const withinCap = variants.filter((variant) => variant.height > 0 && variant.height <= heightCap);
  const candidates = withinCap.length
    ? withinCap
    : variants.filter((variant) => variant.height > 0);
  const sorted = [...(candidates.length ? candidates : variants)].sort((left, right) => {
    if (left.height && right.height && left.height !== right.height) {
      return right.height - left.height;
    }
    return right.bandwidth - left.bandwidth;
  });
  return sorted[0] ?? null;
}

async function readBoundedBlob(response: Response, maxBytes: number) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    await response.body?.cancel().catch(() => {});
    return null;
  }
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (total <= maxBytes) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Blob(
    [merged.buffer as ArrayBuffer],
    { type: response.headers.get("content-type") || "video/mp2t" },
  );
}

async function cacheHlsSegment(url: string, response: Response, blob: Blob) {
  if (typeof caches === "undefined" || response.type === "opaque") return;
  const cache = await caches.open(HLS_SEGMENT_CACHE);
  const now = Date.now();
  const existing = await cache.keys();
  await Promise.all(
    existing.map(async (entry) => {
      const cached = await cache.match(entry);
      const expiry = Number(cached?.headers.get("X-YW-Hls-Prefetch-Expires") || 0);
      if (!cached || !Number.isSafeInteger(expiry) || expiry <= now) {
        await cache.delete(entry);
      }
    }),
  );
  const entries = await cache.keys();
  if (entries.length >= MAX_HLS_SEGMENT_ENTRIES && !(await cache.match(url))) {
    const oldest = await Promise.all(
      entries.map(async (entry) => {
        const cached = await cache.match(entry);
        return {
          entry,
          created: Number(cached?.headers.get("X-YW-Hls-Prefetch-Created") || 0),
        };
      }),
    );
    oldest.sort((left, right) => left.created - right.created);
    if (oldest[0]) await cache.delete(oldest[0].entry);
  }
  const headers = new Headers(response.headers);
  headers.delete("Content-Encoding");
  headers.delete("Content-Range");
  headers.delete("Accept-Ranges");
  headers.set("X-YW-Hls-Prefetch-Created", String(now));
  headers.set("X-YW-Hls-Prefetch-Expires", String(now + PREFIX_TTL_MS));
  headers.set("Content-Length", String(blob.size));
  headers.set("Cache-Control", "public, max-age=600");
  await cache.put(url, new Response(blob, { status: 200, headers }));
}

async function prefetchHlsStart(url: string, controller: AbortController) {
  if (
    !cloudflareStreamUrl(url) ||
    typeof caches === "undefined" ||
    !navigator.serviceWorker?.controller
  ) return;
  const manifestResponse = await fetch(url, {
    signal: controller.signal,
    cache: "no-store",
  });
  if (!manifestResponse.ok) return;
  const manifest = await manifestResponse.text();
  if (manifest.length > 512 * 1024 || controller.signal.aborted) return;

  let playlistUrl = url;
  let playlistText = manifest;
  const variant = findHlsVariant(manifest, url, getHlsNetworkHeightCap());
  if (variant) {
    playlistUrl = variant.url;
    const variantResponse = await fetch(playlistUrl, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!variantResponse.ok) return;
    playlistText = await variantResponse.text();
    if (playlistText.length > 512 * 1024 || controller.signal.aborted) return;
  }

  const lines = playlistText.split(/\r?\n/).map((line) => line.trim());
  const segments: Array<{ url: string; duration: number }> = [];
  let pendingDuration: number | null = null;
  for (const line of lines) {
    if (line.startsWith("#EXTINF:")) {
      const duration = Number(line.slice("#EXTINF:".length).split(",", 1)[0]);
      pendingDuration = Number.isFinite(duration) && duration > 0 ? duration : null;
      continue;
    }
    if (!line || line.startsWith("#") || pendingDuration === null) continue;
    try {
      segments.push({ url: new URL(line, playlistUrl).toString(), duration: pendingDuration });
    } catch {
      // Ignore invalid segment URLs.
    }
    pendingDuration = null;
  }

  const mapUri = playlistText.match(/#EXT-X-MAP:[^\r\n]*URI="([^"]+)"/i)?.[1];
  const initSegment = mapUri
    ? [{ url: new URL(mapUri, playlistUrl).toString(), duration: 0 }]
    : [];
  const selected: typeof segments = [];
  let selectedDuration = 0;
  for (const segment of segments) {
    if (selected.length > 0 && selectedDuration >= PREFETCH_TARGET_SECONDS) break;
    selected.push(segment);
    selectedDuration += segment.duration;
    if (selected.length >= 2) break;
  }

  let totalBytes = 0;
  for (const segment of [...initSegment, ...selected]) {
    if (controller.signal.aborted || totalBytes >= MAX_HLS_SEGMENT_BYTES) return;
    const response = await fetch(segment.url, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok || response.type === "opaque") continue;
    const remaining = MAX_HLS_SEGMENT_BYTES - totalBytes;
    const blob = await readBoundedBlob(response, remaining);
    if (!blob || blob.size < 1) continue;
    await cacheHlsSegment(segment.url, response, blob);
    totalBytes += blob.size;
    // HLS segments cannot be time-sliced safely; at most two segments and 2 MiB
    // are cached to cover the next video's initial playback window.
  }
}

async function fetchPrefetch({ url, controller, durationSeconds }: PrefetchJob) {
  try {
    if (controller.signal.aborted || !(await canPrefetchVideo())) return;
    if (/\.m3u8(?:$|[?#])/i.test(url)) {
      await prefetchHlsStart(url, controller);
      return;
    }
    let requestedBytes = MAX_PREFETCH_BYTES;
    const duration = Number(durationSeconds);
    if (Number.isFinite(duration) && duration > PREFETCH_TARGET_SECONDS) {
      const probe = await fetch(url, {
        headers: { Range: "bytes=0-0" },
        signal: controller.signal,
        cache: "default",
      });
      const probeRange = probe.headers.get("content-range");
      const probeMatch = probeRange?.match(/^bytes\s+0-0\/(\d+)$/i);
      const totalBytes = Number(probeMatch?.[1]);
      await probe.body?.cancel().catch(() => {});
      if (probe.status !== 206 || !probeMatch || !Number.isSafeInteger(totalBytes)) return;
      requestedBytes = Math.min(
        MAX_PREFETCH_BYTES,
        Math.max(1, Math.ceil((totalBytes * PREFETCH_TARGET_SECONDS) / duration)),
      );
    }
    const response = await fetch(url, {
      headers: { Range: `bytes=0-${requestedBytes - 1}` },
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
      rangeEnd >= requestedBytes ||
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
      while (total < requestedBytes) {
        const next = await reader.read();
        if (next.done) break;
        const remaining = requestedBytes - total;
        const value = next.value.byteLength > remaining
          ? next.value.subarray(0, remaining)
          : next.value;
        chunks.push(
          value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength),
        );
        total += value.byteLength;
        if (total >= requestedBytes) await reader.cancel();
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
export async function prefetchVideo(url: string, durationSeconds?: number | null) {
  if (typeof window === "undefined" || !url) return;
  const key = url ? mediaCacheKey(url) : "";
  if (
    !/^https?:\/\//i.test(url) ||
    active.has(key) ||
    seenPrefetches.has(key) ||
    active.size >= MAX_CONCURRENT_PREFETCHES + MAX_QUEUED_PREFETCHES
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
  const job = { key, url, controller, durationSeconds };
  active.set(key, job);
  if (!(await canPrefetchVideo()) || controller.signal.aborted || active.get(key) !== job) {
    if (active.get(key) === job) active.delete(key);
    seenPrefetches.delete(key);
    return;
  }
  if (queued.length >= MAX_QUEUED_PREFETCHES) {
    active.delete(key);
    seenPrefetches.delete(key);
    return;
  }
  queued.push(job);
  pump();
}

export function cancelPendingVideoPrefetches() {
  for (const job of queued.splice(0)) {
    job.controller.abort();
    if (active.get(job.key) === job) active.delete(job.key);
    seenPrefetches.delete(job.key);
  }
  for (const [key, job] of active) {
    job.controller.abort();
    active.delete(key);
    seenPrefetches.delete(key);
  }
}

/** Returns a small poster generated during an earlier visit, if available. */
export function getVideoPoster(url: string) {
  return posters.get(mediaCacheKey(url)) ?? null;
}

export function subscribeVideoPoster(url: string, onPoster: (poster: string) => void) {
  if (typeof window === "undefined") return () => {};
  const key = mediaCacheKey(url);
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<{ key?: string; poster?: string }>).detail;
    if (detail?.key === key && typeof detail.poster === "string") {
      onPoster(detail.poster);
    }
  };
  window.addEventListener(VIDEO_POSTER_READY_EVENT, listener);
  return () => window.removeEventListener(VIDEO_POSTER_READY_EVENT, listener);
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
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(VIDEO_POSTER_READY_EVENT, { detail: { key, poster } }),
      );
    }
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