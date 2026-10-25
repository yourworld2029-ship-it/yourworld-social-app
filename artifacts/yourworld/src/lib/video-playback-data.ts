import { supabase } from "@/integrations/supabase/client";
import { loadLongVideosByIds, resolveLongVideoUrl, type LongVideo } from "@/lib/video-data";
import { isPlayableMediaUrl } from "@/lib/video-playback-engine";
import { hasRestrictedLongVideoAudience } from "@/lib/long-video-utils";
import {
  resolveAuthorizedPlaybackUrl,
  resolveAuthorizedStoragePlaybackUrl,
} from "@/lib/video-media-api";
import { VIDEO_QUALITY_TIERS, type DownloadQualityUrls } from "@/lib/video-quality";

export type VideoRouteData = {
  video: LongVideo;
  url: string | null;
  locked: boolean;
  qualityMediaUrls: DownloadQualityUrls | null;
  fallbackUrls?: string[];
};

export const LONG_VIDEO_PLAYBACK_PREFETCH_STALE_MS = 5_000;

export function longVideoPlaybackQueryOptions(
  videoId: string,
  userId: string | null,
  staleTime = 0,
) {
  return {
    queryKey: ["long-video-playback", videoId, userId] as const,
    queryFn: () => loadVideoForPlayback(videoId),
    staleTime,
  };
}

function readQualityMediaUrls(row: Record<string, unknown>): DownloadQualityUrls | null {
  const raw = row.qualityUrls ?? row.quality_urls;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const source = raw as Record<string, unknown>;
  const qualityMediaUrls: DownloadQualityUrls = {};
  for (const { id } of VIDEO_QUALITY_TIERS) {
    const url = source[id];
    if (typeof url === "string" && url.trim()) qualityMediaUrls[id] = url.trim();
  }
  return Object.keys(qualityMediaUrls).length ? qualityMediaUrls : null;
}

function isCloudflareStreamManifest(value: string) {
  try {
    const url = new URL(value);
    return (
      (url.hostname === "videodelivery.net" ||
        url.hostname.endsWith(".cloudflarestream.com")) &&
      url.pathname.includes("/manifest/video.m3u8")
    );
  } catch {
    return false;
  }
}

export async function loadVideoForPlayback(videoId: string): Promise<VideoRouteData> {
  const video = (
    await loadLongVideosByIds([videoId], {
      includeLiveReplays: true,
      bypassFeedSuppression: true,
    })
  )[0];
  if (!video) throw new Error("Video is no longer available.");

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", video.id)
    .maybeSingle();
  if (postError) throw postError;
  if (!post) throw new Error("Video is no longer available.");
  const row = post as unknown as Record<string, unknown>;

  if (row.archived === true || row.is_hidden === true) {
    throw new Error("Video is no longer available.");
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const user = sessionData.session?.user;
  const accessToken = sessionData.session?.access_token;
  const isOwner = user?.id === video.userId;
  const isRestricted = hasRestrictedLongVideoAudience(row);
  const requiresGrant =
    video.access !== "public" ||
    Number(video.price ?? 0) > 0 ||
    isRestricted;

  if (requiresGrant && !isOwner) {
    if (!user || isRestricted) {
      return { video, url: null, locked: true, qualityMediaUrls: null };
    }
    const { data: grant, error: grantError } = await supabase
      .from("video_access_grants")
      .select("expires_at")
      .eq("post_id", video.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (grantError) throw grantError;

    const grantIsActive =
      !!grant &&
      (grant.expires_at === null ||
        (Number.isFinite(Date.parse(grant.expires_at)) &&
          Date.parse(grant.expires_at) > Date.now()));
    if (!grantIsActive) {
      return { video, url: null, locked: true, qualityMediaUrls: null };
    }
  }

  let url: string | null;
  let fallbackUrls: string[] = [];
  if (isCloudflareStreamManifest(video.mediaUrl)) {
    if (!accessToken) {
      url = video.mediaUrl;
    } else {
      const hasRetainedSource =
        typeof row.video_url === "string" && row.video_url.trim().length > 0;
      const [playbackResult, storageResult] = await Promise.allSettled([
        resolveAuthorizedPlaybackUrl(video.id),
        hasRetainedSource
          ? resolveAuthorizedStoragePlaybackUrl(video.id).catch((error: unknown) => {
              console.warn("[video-playback] retained MP4 fallback could not be resolved", {
                videoId: video.id,
                error: error instanceof Error ? error.message : "unknown error",
              });
              return null;
            })
          : Promise.resolve(null),
      ]);
      const playbackUrl =
        playbackResult.status === "fulfilled" ? playbackResult.value : null;
      const storageFallback =
        storageResult.status === "fulfilled" ? storageResult.value : null;
      if (playbackUrl) {
        url = playbackUrl;
        if (storageFallback) fallbackUrls = [storageFallback];
      } else if (storageFallback) {
        url = storageFallback;
      } else if (playbackResult.status === "rejected") {
        throw playbackResult.reason;
      } else if (storageResult.status === "rejected") {
        throw storageResult.reason;
      } else {
        throw new Error("The video playback source is unavailable.");
      }
    }
  } else if (
    typeof row.video_url === "string" &&
    row.video_url.startsWith("live-replays/")
  ) {
    const storedMediaUrl = video.mediaUrl
      ? await resolveLongVideoUrl(video.mediaUrl).catch(() => null)
      : null;
    try {
      url = await resolveAuthorizedStoragePlaybackUrl(video.id);
      if (storedMediaUrl && storedMediaUrl !== url) fallbackUrls = [storedMediaUrl];
    } catch (cause) {
      if (storedMediaUrl) {
        console.warn("[video-playback] using the replay's stored signed source URL", {
          videoId: video.id,
        });
        url = storedMediaUrl;
      } else {
        throw cause;
      }
    }
  } else {
    url = await resolveLongVideoUrl(video.mediaUrl);
  }
  if (!url || !isPlayableMediaUrl(url)) {
    throw new Error("The video source is not available.");
  }
  return {
    video,
    url,
    locked: false,
    qualityMediaUrls: readQualityMediaUrls(row),
    fallbackUrls,
  };
}
