import Hls, {
  LoaderContextType,
  type LoaderCallbacks,
  type LoaderConfiguration,
  type LoaderContext,
  type LoaderStats,
} from "hls.js";

export const VIDEO_HLS_SEGMENT_CACHE = "yourworld-video-hls-prefixes-v1";
const HLS_CACHE_EXPIRES_HEADER = "X-YW-Hls-Prefetch-Expires";
const HLS_CACHE_LOAD_MS_HEADER = "X-YW-Hls-Prefetch-Load-Ms";

function isCloudflareStreamUrl(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return hostname === "videodelivery.net" || hostname.endsWith(".cloudflarestream.com");
  } catch {
    return false;
  }
}

function createCacheLoadStats(bytes: number, durationMs: number): LoaderStats {
  const end = performance.now();
  const start = end - Math.max(50, durationMs);
  return {
    aborted: false,
    loaded: bytes,
    total: bytes,
    retry: 0,
    chunkCount: 1,
    bwEstimate: Math.round((bytes * 8 * 1000) / Math.max(50, durationMs)),
    loading: { start, first: start, end },
    parsing: { start: end, end },
    buffering: { start: end, first: end, end },
  };
}

const DefaultHlsLoader = Hls.DefaultConfig.loader;

/** Serves prefetched public Cloudflare HLS segments from CacheStorage first. */
export class HlsPrefetchCacheLoader extends DefaultHlsLoader {
  private cacheReadController: AbortController | null = null;

  override load(
    context: LoaderContext,
    config: LoaderConfiguration,
    callbacks: LoaderCallbacks<LoaderContext>,
  ) {
    if (
      context.type !== LoaderContextType.MEDIA_FRAGMENT ||
      context.rangeStart != null ||
      context.rangeEnd != null ||
      !isCloudflareStreamUrl(context.url) ||
      typeof caches === "undefined"
    ) {
      super.load(context, config, callbacks);
      return;
    }

    this.cacheReadController?.abort();
    const controller = new AbortController();
    this.cacheReadController = controller;
    void this.loadFromPrefetchCache(context.url, controller.signal)
      .then((cached) => {
        if (controller.signal.aborted) return;
        if (this.cacheReadController === controller) this.cacheReadController = null;
        if (!cached) {
          super.load(context, config, callbacks);
          return;
        }
        callbacks.onSuccess(
          { url: context.url, data: cached.data, code: 200 },
          createCacheLoadStats(cached.data.byteLength, cached.durationMs),
          context,
          null,
        );
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        if (this.cacheReadController === controller) this.cacheReadController = null;
        super.load(context, config, callbacks);
      });
  }

  override abort() {
    this.cacheReadController?.abort();
    this.cacheReadController = null;
    super.abort();
  }

  override destroy() {
    this.cacheReadController?.abort();
    this.cacheReadController = null;
    super.destroy();
  }

  private async loadFromPrefetchCache(url: string, signal: AbortSignal) {
    const cache = await caches.open(VIDEO_HLS_SEGMENT_CACHE);
    if (signal.aborted) return null;
    const response = await cache.match(url);
    if (!response) return null;

    const expiresAt = Number(response.headers.get(HLS_CACHE_EXPIRES_HEADER) ?? 0);
    if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) {
      await cache.delete(url);
      return null;
    }

    const data = await response.arrayBuffer();
    if (signal.aborted || data.byteLength === 0) return null;
    const durationMs = Number(response.headers.get(HLS_CACHE_LOAD_MS_HEADER) ?? 500);
    return {
      data,
      durationMs: Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 500,
    };
  }
}
