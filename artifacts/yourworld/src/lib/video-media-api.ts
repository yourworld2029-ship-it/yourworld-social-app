import { supabase } from "@/integrations/supabase/client";
import { mediaApiUrl } from "@/lib/media-api-url";
import { cloudflareStreamDownloadUrl } from "@/lib/cloudflare-stream-media";
import { resolveMediaUrl } from "@/lib/social-data";
import { orderedOfflineSources } from "@/lib/offline-source-order";
import type { VideoQualityTier } from "@/lib/video-quality";

class MediaRequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export type AuthorizedOfflineQuality =
  | "original"
  | "360p"
  | "480p"
  | "720p"
  | "1080p"
  | "1440p"
  | "2160p";

function errorFromPayload(payload: unknown, fallback: string) {
  return payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
    ? payload.error
    : fallback;
}

async function postAuthorizedMediaRequest(
  path:
    | "/api/media/playback-url"
    | "/api/media/playback-source"
    | "/api/media/offline-source",
  body: Record<string, unknown>,
  timeoutMs = 20_000,
) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new MediaRequestError(error.message, 401);
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new MediaRequestError("Sign in to access this video.", 401);

  const response = await fetch(mediaApiUrl(path), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new MediaRequestError(
      errorFromPayload(payload, "Secure video media is temporarily unavailable."),
      response.status,
    );
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    !("url" in payload) ||
    typeof payload.url !== "string"
  ) {
    throw new MediaRequestError("The download service returned an incomplete response.", 502);
  }
  return payload as Record<string, unknown> & { url: string };
}

export async function resolveAuthorizedPlaybackUrl(
  postId: string,
  publicFallback?: string,
) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session?.access_token) {
    if (publicFallback) return publicFallback;
    throw new Error("Sign in to access this video.");
  }
  const payload = await postAuthorizedMediaRequest("/api/media/playback-url", { postId });
  return payload.url;
}

export async function resolveAuthorizedStoragePlaybackUrl(postId: string) {
  const payload = await postAuthorizedMediaRequest("/api/media/playback-source", { postId });
  return payload.url;
}

export async function resolveAuthorizedOfflineSource(
  postId: string,
  quality: AuthorizedOfflineQuality = "original",
  activeSource?: {
    url: string;
    qualityUrl?: string | null;
    streamId?: string | null;
    bucket?: "videos" | "reels";
    sourceUrl?: string | null;
    sourceQualityTier?: VideoQualityTier | null;
  },
) {
  const resolveReference = async (reference?: string | null) => {
    if (!reference) return null;
    if (/^https?:\/\//i.test(reference)) return reference;
    return resolveMediaUrl(reference, activeSource?.bucket ?? "videos").catch(() => null);
  };
  const sources = async (authorizedUrl?: string) => orderedOfflineSources({
    authorizedUrl,
    cloudflareUrl: cloudflareStreamDownloadUrl(activeSource?.url, activeSource?.streamId),
    activeUrl: await resolveReference(activeSource?.url),
    storageUrl: await resolveReference(activeSource?.sourceUrl),
  });
  let payload: Record<string, unknown> & { url: string };
  try {
    payload = await postAuthorizedMediaRequest(
      "/api/media/offline-source",
      { postId, quality },
      quality === "original" ? 20_000 : 11 * 60 * 1000,
    );
  } catch (error) {
    if (quality !== "original") {
      if (error instanceof MediaRequestError && [401, 402, 403].includes(error.status)) throw error;
      throw new Error(
        `The exact ${quality} rendition could not be prepared. It was not replaced with another quality.`,
      );
    }
    // A service/version/transport failure must not discard an already-authorized
    // playing source. Explicit access/creator denials remain authoritative.
    if (error instanceof MediaRequestError && [401, 402, 403].includes(error.status)) throw error;
    if (!activeSource?.url) throw error;
    const urls = await sources();
    if (!urls.length) throw error;
    return {
      url: urls[0],
      actualQuality: activeSource.sourceQualityTier ?? "original",
      fallbackUrls: urls.slice(1),
    };
  }
  const actualQuality =
    payload.actualQuality === "360p" ||
    payload.actualQuality === "480p" ||
    payload.actualQuality === "720p" ||
    payload.actualQuality === "1080p" ||
    payload.actualQuality === "1440p" ||
    payload.actualQuality === "2160p"
      ? payload.actualQuality
      : "original";
  if (quality !== "original") {
    if (activeSource?.qualityUrl) {
      const variantUrl = await resolveReference(activeSource.qualityUrl);
      if (!variantUrl) {
        throw new Error(`The exact ${quality} rendition is unavailable.`);
      }
      if (/\.m3u8(?:$|[?#])/i.test(variantUrl)) {
        throw new Error(`The exact ${quality} rendition is not a downloadable video file.`);
      }
      return { url: variantUrl, actualQuality: quality, fallbackUrls: [] as string[] };
    }
    if (actualQuality !== quality) {
      return {
        url: payload.url,
        actualQuality:
          actualQuality === "original"
            ? activeSource?.sourceQualityTier ?? "original"
            : actualQuality,
        fallbackUrls: [] as string[],
      };
    }
    return { url: payload.url, actualQuality, fallbackUrls: [] as string[] };
  }
  const urls = await sources(payload.url);
  const responseQuality = urls[0] === payload.url ? actualQuality : "original";
  const resolvedQuality =
    responseQuality === "original"
      ? activeSource?.sourceQualityTier ?? "original"
      : responseQuality;
  return {
    url: urls[0] ?? payload.url,
    actualQuality: resolvedQuality,
    fallbackUrls: urls.slice(1),
  };
}