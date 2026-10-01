import { isVideoQualityTier } from "@/lib/video-quality";

function encodePathSegment(value: string, label: string) {
  const segment = encodeURIComponent(String(value).trim()).replace(/\./g, "%2E");
  if (!segment) throw new Error(`A ${label} is required for offline storage.`);
  return segment;
}

export function nativeOfflinePathsForVideo(
  videoId: string,
  quality: string = "original",
  ownerId?: string,
) {
  const id = encodePathSegment(videoId, "video ID");
  const owner = ownerId ? `_${encodePathSegment(ownerId, "owner ID")}` : "";
  const qualityTag = quality === "original" || isVideoQualityTier(quality)
    ? quality
    : "original";
  return {
    localFilePath: `offline_${id}_${qualityTag}${owner}.mp4`,
    thumbnailPath: `offline_${id}_${qualityTag}${owner}-thumbnail`,
  };
}