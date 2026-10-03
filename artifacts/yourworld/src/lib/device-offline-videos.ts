import type { OfflineVideo } from "@/lib/offlineVideosDB";

export const DEVICE_OFFLINE_VIDEOS_STORAGE_KEY = "device_offline_videos";

export type DeviceOfflineVideoMetadata = Omit<OfflineVideo, "videoBlob">;

/**
 * Keep a device-wide metadata index separate from auth/session storage.
 * Video bytes remain in IndexedDB or app-private native files.
 */
export function writeDeviceOfflineVideosIndex(records: readonly OfflineVideo[]) {
  if (typeof localStorage === "undefined") return;
  const metadata = records.map(({ videoBlob: _videoBlob, ...record }) => record);
  try {
    localStorage.setItem(DEVICE_OFFLINE_VIDEOS_STORAGE_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.warn("[downloads] could not update the device offline-video index", error);
  }
}

export function readDeviceOfflineVideosIndex(): DeviceOfflineVideoMetadata[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(DEVICE_OFFLINE_VIDEOS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (record): record is DeviceOfflineVideoMetadata =>
        !!record &&
        typeof record === "object" &&
        (typeof record.id === "string" || typeof record.id === "number") &&
        typeof record.title === "string" &&
        typeof record.downloadedAt === "string",
    );
  } catch {
    return [];
  }
}