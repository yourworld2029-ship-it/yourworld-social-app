export function nativeOfflinePathsForVideo(videoId: string) {
  const id = encodeURIComponent(String(videoId).trim()).replace(/\./g, "%2E");
  if (!id) throw new Error("A video ID is required for offline storage.");

  return {
    localFilePath: `offline_${id}.mp4`,
    thumbnailPath: `offline_${id}-thumbnail`,
  };
}