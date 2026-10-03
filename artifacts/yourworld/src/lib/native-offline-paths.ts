import { isVideoQualityTier } from "@/lib/video-quality";

const OFFLINE_VIDEO_DIRECTORY = "device_offline_videos";

function encodePathSegment(value: string, label: string) {
  const segment = encodeURIComponent(String(value).trim()).replace(/\./g, "%2E");
  if (!segment) throw new Error(`A ${label} is required for offline storage.`);
  return segment;
}

export function nativeOfflinePathsForVideo(
  videoId: string,
  quality: string = "original",
  ownerId?: string,
  mimeType: string = "video/mp4",
) {
  const id = encodePathSegment(videoId, "video ID");
  const owner = ownerId ? `_${encodePathSegment(ownerId, "owner ID")}` : "";
  const qualityTag = quality === "original" || isVideoQualityTier(quality)
    ? quality
    : "original";
  const subtype = mimeType.split("/")[1]?.split(";")[0]?.toLowerCase() ?? "";
  const extension = subtype === "webm" ? "webm" : "mp4";
  return {
    localFilePath: `${OFFLINE_VIDEO_DIRECTORY}/offline_${id}_${qualityTag}${owner}.${extension}`,
    thumbnailPath: `${OFFLINE_VIDEO_DIRECTORY}/offline_${id}_${qualityTag}${owner}-thumbnail`,
  };
}