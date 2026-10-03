import { supabase } from "@/integrations/supabase/client";

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
  path: "/api/media/playback-url" | "/api/media/offline-source",
  body: Record<string, unknown>,
) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error("Sign in to access this video.");

  const response = await fetch(path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      errorFromPayload(payload, "Secure video media is temporarily unavailable."),
    );
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    !("url" in payload) ||
    typeof payload.url !== "string"
  ) {
    throw new Error("The video source is unavailable.");
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

export async function resolveAuthorizedOfflineSource(
  postId: string,
  quality: AuthorizedOfflineQuality = "original",
) {
  const payload = await postAuthorizedMediaRequest("/api/media/offline-source", {
    postId,
    quality,
  });
  const actualQuality =
    payload.actualQuality === "360p" ||
    payload.actualQuality === "480p" ||
    payload.actualQuality === "720p" ||
    payload.actualQuality === "1080p" ||
    payload.actualQuality === "1440p" ||
    payload.actualQuality === "2160p"
      ? payload.actualQuality
      : "original";
  return { url: payload.url, actualQuality };
}