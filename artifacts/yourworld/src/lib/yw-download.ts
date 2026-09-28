/**
 * Downloads media at original resolution with a small semi-transparent YW
 * logo and the creator's @username watermark burned in.
 */
import {
  VIDEO_QUALITY_TIERS,
  type VideoQualityTier,
} from "@/lib/video-quality";
import {
  deleteOfflineVideo,
  getAllOfflineVideos,
  getOfflineVideoById,
  saveOfflineVideo,
  type OfflineVideo,
} from "@/lib/offlineVideosDB";
import {
  createNativeTransferId,
  getNativeDownloadUri,
  getNativeTransferSnapshot,
  nativeTransfer,
  supportsNativeTransfers,
  type NativeTransferSnapshot,
} from "@/lib/native-transfer";
import {
  attachmentMediaUrl,
  fetchVideoBlob,
  sanitizeDownloadName,
} from "@/lib/video-download-transport";
import { toast } from "sonner";

export { fetchVideoBlob, sanitizeDownloadName } from "@/lib/video-download-transport";

const activeVideoDownloads = new Map<string, Promise<void>>();
const downloadTaskListeners = new Set<() => void>();
const downloadTasks = new Map<string, DownloadTask>();
let downloadTaskSnapshot: DownloadTask[] = [];

export type DownloadQuality = VideoQualityTier | "original";

const LEGACY_DOWNLOAD_DB_NAME = "yourworld-downloads-v1";
const LEGACY_DOWNLOAD_STORE_NAME = "videos";
const LEGACY_DOWNLOAD_CACHE_NAME = "yourworld-video-downloads-v1";

export type DownloadTask = {
  id: string;
  title: string;
  percent: number;
  bytesTransferred?: number;
  totalBytes?: number;
  bytesPerSecond?: number;
};

export function subscribeDownloadTasks(listener: () => void) {
  downloadTaskListeners.add(listener);
  return () => downloadTaskListeners.delete(listener);
}

export function getDownloadTasksSnapshot() {
  return downloadTaskSnapshot;
}

function publishDownloadTasks() {
  downloadTaskSnapshot = [...downloadTasks.values()];
  downloadTaskListeners.forEach((listener) => listener());
}

function updateDownloadTask(
  id: string,
  title: string,
  percent: number,
  details?: Pick<DownloadTask, "bytesTransferred" | "totalBytes" | "bytesPerSecond">,
) {
  const previous = downloadTasks.get(id);
  downloadTasks.set(id, {
    id,
    title,
    percent: Math.max(0, Math.min(100, Math.round(percent))),
    bytesTransferred: details?.bytesTransferred ?? previous?.bytesTransferred,
    totalBytes: details?.totalBytes ?? previous?.totalBytes,
    bytesPerSecond: details?.bytesPerSecond ?? previous?.bytesPerSecond,
  });
  publishDownloadTasks();
}

function removeDownloadTask(id: string) {
  downloadTasks.delete(id);
  publishDownloadTasks();
}

export type DownloadedVideoMetadata = {
  ownerId: string;
  mediaId: string;
  title: string;
  creatorName: string;
  creatorUsername: string;
  creatorId?: string | null;
  views?: number | null;
  createdAt?: string | null;
  durationSeconds?: number | null;
  thumbnailUrl?: string | null;
  posterUrl?: string | null;
  quality: DownloadQuality;
};

export type DownloadedVideo = DownloadedVideoMetadata & {
  id: string;
  sizeBytes: number;
  videoBlob?: Blob;
  /** Relative to Android's app-private Directory.Data-equivalent files directory. */
  nativePath?: string;
  downloadedAt: string;
  cacheKey?: string;
};

type LegacyCachedDownload = Partial<DownloadedVideoMetadata> & {
  id?: string;
  cacheKey?: string;
  fileName?: string;
  downloadedAt?: string;
};

export function toDownloadedVideo(record: OfflineVideo): DownloadedVideo {
  return {
    id: String(record.id),
    ownerId: record.ownerId ?? "",
    mediaId: record.mediaId ?? String(record.id),
    title: record.title,
    creatorName: record.creatorName ?? record.author,
    creatorUsername: record.creatorUsername ?? "",
    creatorId: record.creatorId,
    views: record.views,
    createdAt: record.createdAt,
    durationSeconds: record.durationSeconds,
    thumbnailUrl: record.thumbnailUrl || null,
    posterUrl: record.posterUrl ?? (record.thumbnailUrl || null),
    quality: record.quality as DownloadQuality,
    sizeBytes: record.sizeBytes,
    videoBlob: record.videoBlob,
    nativePath: record.nativePath,
    downloadedAt: record.downloadedAt,
  };
}

function readLegacyDownloadRecords() {
  if (typeof indexedDB === "undefined") return Promise.resolve([] as LegacyCachedDownload[]);

  return new Promise<LegacyCachedDownload[]>((resolve) => {
    let finished = false;
    const finish = (records: LegacyCachedDownload[] = []) => {
      if (finished) return;
      finished = true;
      resolve(records);
    };

    void (async () => {
      try {
        const databaseFactory = indexedDB as IDBFactory & {
          databases?: () => Promise<Array<{ name?: string }>>;
        };
        const databases = await databaseFactory.databases?.();
        if (
          databases &&
          !databases.some((database) => database.name === LEGACY_DOWNLOAD_DB_NAME)
        ) {
          finish();
          return;
        }
      } catch {
        // Fall through to a read-only open attempt on browsers without a usable databases() API.
      }

      const request = indexedDB.open(LEGACY_DOWNLOAD_DB_NAME);
      request.onupgradeneeded = () => {
        // Abort rather than create an empty legacy database when none exists.
        request.transaction?.abort();
      };
      request.onsuccess = () => {
        const database = request.result;
        if (finished) {
          database.close();
          return;
        }
        if (!database.objectStoreNames.contains(LEGACY_DOWNLOAD_STORE_NAME)) {
          database.close();
          finish();
          return;
        }

        try {
          const transaction = database.transaction(
            LEGACY_DOWNLOAD_STORE_NAME,
            "readonly",
          );
          const recordsRequest = transaction
            .objectStore(LEGACY_DOWNLOAD_STORE_NAME)
            .getAll();
          recordsRequest.onsuccess = () => {
            database.close();
            finish(
              Array.isArray(recordsRequest.result)
                ? (recordsRequest.result as LegacyCachedDownload[])
                : [],
            );
          };
          recordsRequest.onerror = () => {
            database.close();
            finish();
          };
          transaction.onabort = transaction.onerror = () => {
            database.close();
            finish();
          };
        } catch {
          database.close();
          finish();
        }
      };
      request.onerror = () => finish();
      request.onblocked = () => finish();
    })();
  });
}

/**
 * Copy owner-matched downloads from the former metadata database + CacheStorage
 * into the current IndexedDB store. The legacy records and cache entries are
 * deliberately retained so this compatibility path never destroys old media.
 */
export async function migrateLegacyDownloadedVideos(ownerId: string) {
  if (!ownerId || typeof caches === "undefined") return;

  try {
    const records = await readLegacyDownloadRecords();
    if (!records.length) return;

    const cacheNames = await caches.keys();
    if (!cacheNames.includes(LEGACY_DOWNLOAD_CACHE_NAME)) return;
    const legacyCache = await caches.open(LEGACY_DOWNLOAD_CACHE_NAME);

    for (const record of records) {
      if (
        record.ownerId !== ownerId ||
        typeof record.id !== "string" ||
        typeof record.mediaId !== "string" ||
        typeof record.cacheKey !== "string" ||
        typeof record.quality !== "string"
      ) {
        continue;
      }

      try {
        if (await getOfflineVideoById(record.id)) continue;

        const response = await legacyCache.match(record.cacheKey);
        if (!response) continue;
        const videoBlob = await response.blob();
        if (!videoBlob.size) continue;

        const thumbnailUrl = record.thumbnailUrl ?? record.posterUrl ?? "";
        const creatorName = record.creatorName ?? record.creatorUsername ?? "Unknown creator";
        const offlineVideo: OfflineVideo = {
          id: record.id,
          ownerId: record.ownerId,
          mediaId: record.mediaId,
          title: record.title || "Downloaded video",
          author: creatorName,
          thumbnailUrl,
          quality: record.quality as DownloadQuality,
          sizeBytes: videoBlob.size,
          videoBlob,
          downloadedAt: record.downloadedAt || new Date().toISOString(),
          creatorName,
          creatorUsername: record.creatorUsername ?? "",
          creatorId: record.creatorId,
          views: record.views,
          createdAt: record.createdAt,
          durationSeconds: record.durationSeconds,
          posterUrl: record.posterUrl ?? thumbnailUrl,
        };
        await saveOfflineVideo(offlineVideo);
      } catch (error) {
        console.warn("[downloads] Could not restore a legacy offline video", error);
      }
    }
  } catch (error) {
    console.warn("[downloads] Could not inspect legacy offline videos", error);
  }
}

async function removeLegacyDownloadCopies(record: DownloadedVideo) {
  const legacyRecords = await readLegacyDownloadRecords();
  const matches = legacyRecords.filter(
    (legacy) => legacy.ownerId === record.ownerId && legacy.id === record.id,
  );
  if (!matches.length) return;

  if (typeof caches !== "undefined") {
    const cacheNames = await caches.keys();
    if (cacheNames.includes(LEGACY_DOWNLOAD_CACHE_NAME)) {
      const legacyCache = await caches.open(LEGACY_DOWNLOAD_CACHE_NAME);
      await Promise.all(
        matches
          .map((legacy) => legacy.cacheKey)
          .filter((cacheKey): cacheKey is string => typeof cacheKey === "string")
          .map((cacheKey) => legacyCache.delete(cacheKey)),
      );
    }
  }

  if (typeof indexedDB === "undefined") return;
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(LEGACY_DOWNLOAD_DB_NAME);
    request.onupgradeneeded = () => request.transaction?.abort();
    request.onsuccess = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(LEGACY_DOWNLOAD_STORE_NAME)) {
        database.close();
        resolve();
        return;
      }

      try {
        const transaction = database.transaction(
          LEGACY_DOWNLOAD_STORE_NAME,
          "readwrite",
        );
        const cursorRequest = transaction
          .objectStore(LEGACY_DOWNLOAD_STORE_NAME)
          .openCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) return;
          const legacy = cursor.value as LegacyCachedDownload;
          if (legacy.ownerId === record.ownerId && legacy.id === record.id) {
            cursor.delete();
          }
          cursor.continue();
        };
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => {
          database.close();
          reject(
            transaction.error ??
              new Error("Could not remove the legacy offline download record"),
          );
        };
        transaction.onabort = () => {
          database.close();
          reject(
            transaction.error ??
              new Error("Legacy offline download removal was aborted"),
          );
        };
      } catch (error) {
        database.close();
        reject(error);
      }
    };
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open legacy offline video storage"));
    request.onblocked = () => reject(new Error("Legacy offline video storage is busy"));
  });
}

export async function listDownloadedVideos(ownerId: string) {
  await syncNativeDownloadedVideos();
  const records = await getAllOfflineVideos();
  return records
    .filter((record) => record.ownerId === ownerId)
    .map(toDownloadedVideo);
}

export async function getDownloadedVideo(id: string, ownerId?: string) {
  await syncNativeDownloadedVideos();
  const result = await getOfflineVideoById(id);
  if (!result || (ownerId && result.ownerId !== ownerId)) return null;
  return toDownloadedVideo(result);
}

export async function removeDownloadedVideo(record: DownloadedVideo) {
  await removeLegacyDownloadCopies(record);
  if (record.nativePath && supportsNativeTransfers()) {
    await nativeTransfer.deleteDownload({ relativePath: record.nativePath });
  }
  await deleteOfflineVideo(record.id);
}

export async function getDownloadedVideoUrl(record: DownloadedVideo) {
  const storedVideo = await getOfflineVideoById(record.id);
  if (!storedVideo) return null;
  if (storedVideo.nativePath && supportsNativeTransfers()) {
    return getNativeDownloadUri(storedVideo.nativePath);
  }
  if (!storedVideo.videoBlob) return null;
  return URL.createObjectURL(storedVideo.videoBlob);
}

function nativeMetadata(
  value: Record<string, unknown> | undefined,
): DownloadedVideoMetadata | null {
  if (
    !value ||
    typeof value.ownerId !== "string" ||
    typeof value.mediaId !== "string" ||
    typeof value.title !== "string" ||
    typeof value.creatorName !== "string" ||
    typeof value.creatorUsername !== "string" ||
    typeof value.quality !== "string"
  ) {
    return null;
  }
  return {
    ownerId: value.ownerId,
    mediaId: value.mediaId,
    title: value.title,
    creatorName: value.creatorName,
    creatorUsername: value.creatorUsername,
    creatorId: typeof value.creatorId === "string" ? value.creatorId : null,
    views: typeof value.views === "number" ? value.views : null,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : null,
    durationSeconds:
      typeof value.durationSeconds === "number" ? value.durationSeconds : null,
    thumbnailUrl:
      typeof value.thumbnailUrl === "string" ? value.thumbnailUrl : null,
    posterUrl: typeof value.posterUrl === "string" ? value.posterUrl : null,
    quality: value.quality as DownloadQuality,
  };
}

async function persistNativeDownloadedVideo(
  metadata: DownloadedVideoMetadata,
  nativePath: string,
  sizeBytes: number,
) {
  const id = `${metadata.ownerId}:${metadata.mediaId}:${metadata.quality}`;
  const existing = await getOfflineVideoById(id);
  const thumbnailUrl = metadata.thumbnailUrl ?? metadata.posterUrl ?? "";
  await saveOfflineVideo({
    ...(existing ?? {}),
    id,
    title: metadata.title,
    author: metadata.creatorName,
    thumbnailUrl,
    quality: metadata.quality,
    sizeBytes,
    videoBlob: existing?.videoBlob,
    nativePath,
    downloadedAt: existing?.downloadedAt ?? new Date().toISOString(),
    ownerId: metadata.ownerId,
    mediaId: metadata.mediaId,
    creatorName: metadata.creatorName,
    creatorUsername: metadata.creatorUsername,
    creatorId: metadata.creatorId,
    views: metadata.views,
    createdAt: metadata.createdAt,
    durationSeconds: metadata.durationSeconds,
    posterUrl: metadata.posterUrl ?? thumbnailUrl,
  });
}

async function syncNativeDownloadedVideos() {
  if (!supportsNativeTransfers()) return;
  let snapshots: NativeTransferSnapshot[];
  try {
    snapshots = await nativeTransfer.getTransfers();
  } catch (error) {
    console.warn("Could not restore completed native downloads", error);
    return;
  }
  for (const snapshot of snapshots) {
    if (
      snapshot.kind !== "download" ||
      snapshot.status !== "complete" ||
      !snapshot.relativePath
    ) {
      continue;
    }
    const metadata = nativeMetadata(snapshot.metadata);
    if (!metadata) continue;
    try {
      await persistNativeDownloadedVideo(
        metadata,
        snapshot.relativePath,
        snapshot.totalBytes || snapshot.bytesTransferred,
      );
    } catch (error) {
      console.warn("Could not restore a native Profile download", error);
    }
  }
}

export async function saveDownloadedVideo(
  metadata: DownloadedVideoMetadata,
  videoBlob: Blob,
  quality: DownloadQuality = metadata.quality,
) {
  const thumbnailUrl = metadata.thumbnailUrl ?? metadata.posterUrl ?? "";
  await saveOfflineVideo({
    id: `${metadata.ownerId}:${metadata.mediaId}:${quality}`,
    title: metadata.title,
    author: metadata.creatorName,
    thumbnailUrl,
    quality,
    sizeBytes: videoBlob.size,
    videoBlob,
    downloadedAt: new Date().toISOString(),
    ownerId: metadata.ownerId,
    mediaId: metadata.mediaId,
    creatorName: metadata.creatorName,
    creatorUsername: metadata.creatorUsername,
    creatorId: metadata.creatorId,
    views: metadata.views,
    createdAt: metadata.createdAt,
    durationSeconds: metadata.durationSeconds,
    posterUrl: metadata.posterUrl ?? thumbnailUrl,
  });
}

async function waitForNativeDownload(
  options: {
    id: string;
    src: string;
    fileName: string;
    title: string;
    metadata: DownloadedVideoMetadata;
    taskId: string;
    onProgress?: (percent: number) => void;
  },
) {
  const { id, src, fileName, title, metadata, taskId, onProgress } = options;
  let listener: Awaited<ReturnType<typeof nativeTransfer.addListener>> | null = null;
  let pollTimer: number | null = null;

  try {
    return await new Promise<NativeTransferSnapshot>((resolve, reject) => {
      let settled = false;
      const finish = (snapshot: NativeTransferSnapshot, error?: Error) => {
        if (settled) return;
        settled = true;
        if (pollTimer !== null) {
          window.clearInterval(pollTimer);
          pollTimer = null;
        }
        if (error) reject(error);
        else resolve(snapshot);
      };
      const consume = (snapshot: NativeTransferSnapshot) => {
        if (snapshot.id !== id || snapshot.kind !== "download") return;
        const percent = snapshot.status === "complete"
          ? 100
          : snapshot.totalBytes > 0
            ? Math.min(99, (snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            : 0;
        updateDownloadTask(taskId, title, percent, {
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes || undefined,
          bytesPerSecond: snapshot.bytesPerSecond,
        });
        onProgress?.(percent);
        if (snapshot.status === "complete") {
          finish(snapshot);
        } else if (snapshot.status === "error") {
          finish(
            snapshot,
            new Error(snapshot.error || "The background download failed."),
          );
        }
      };

      void (async () => {
        try {
          listener = await nativeTransfer.addListener(
            "transferProgress",
            consume,
          );
          await nativeTransfer.enqueueDownload({
            id,
            url: src,
            fileName,
            title,
            metadata: { ...metadata },
          });
          const snapshot = await getNativeTransferSnapshot(id);
          if (snapshot) consume(snapshot);
          if (settled) return;
          pollTimer = window.setInterval(() => {
            void getNativeTransferSnapshot(id)
              .then((next) => {
                if (next) consume(next);
              })
              .catch((error) => {
                console.warn("Could not refresh native download progress", error);
              });
          }, 1_000);
        } catch (error) {
          finish(
            { id, kind: "download", status: "error", bytesTransferred: 0, totalBytes: 0, bytesPerSecond: 0 },
            error instanceof Error
              ? error
              : new Error("Could not start the background download."),
          );
        }
      })();
    });
  } finally {
    if (pollTimer !== null) window.clearInterval(pollTimer);
    const activeListener =
      listener as Awaited<ReturnType<typeof nativeTransfer.addListener>> | null;
    await activeListener?.remove().catch(() => {});
  }
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.type = blob.type || "video/mp4";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function fetchVideoBlobInWorker(
  src: string,
  fileName: string,
  onProgress?: (percent: number) => void,
  onTransferProgress?: (bytesTransferred: number, totalBytes: number) => void,
) {
  if (typeof Worker === "undefined") {
    return fetchVideoBlob(src, onProgress, fileName, onTransferProgress);
  }

  let worker: Worker;
  try {
    worker = new Worker(new URL("./video-download.worker.ts", import.meta.url), {
      type: "module",
    });
  } catch {
    return fetchVideoBlob(src, onProgress, fileName, onTransferProgress);
  }

  return new Promise<Blob>((resolve, reject) => {
    let settled = false;
    const finish = (error: Error | null, blob?: Blob) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      if (error) reject(error);
      else if (blob) resolve(blob);
      else reject(new Error("The video download worker returned no file."));
    };

    worker.onmessage = (event: MessageEvent) => {
      const message = event.data as
        | { type: "progress"; percent: number }
        | { type: "bytes"; bytesTransferred: number; totalBytes: number }
        | { type: "complete"; blob: Blob }
        | { type: "error"; message: string };
      if (message.type === "progress") {
        onProgress?.(message.percent);
      } else if (message.type === "bytes") {
        onTransferProgress?.(message.bytesTransferred, message.totalBytes);
      } else if (message.type === "complete") {
        finish(null, message.blob);
      } else if (message.type === "error") {
        finish(new Error(message.message || "The video download failed."));
      }
    };
    worker.onerror = (event) => {
      finish(new Error(event.message || "The video download worker failed."));
    };

    try {
      worker.postMessage({ type: "start", src, fileName });
    } catch {
      worker.terminate();
      void fetchVideoBlob(src, onProgress, fileName, onTransferProgress)
        .then(resolve, reject);
    }
  });
}

/**
 * Streams a video without blocking the player and persists the completed bytes
 * in IndexedDB. The task map is module scoped so route/card unmounts do not
 * cancel an active download.
 */
export async function downloadVideoInBackground(
  src: string,
  fileName: string,
  onProgress?: (percent: number) => void,
  metadata?: DownloadedVideoMetadata,
) {
  const key = `${src}|${fileName}`;
  const existing = activeVideoDownloads.get(key);
  if (existing) return existing;

  const task = (async () => {
    const title = metadata?.title || fileName.replace(/\.mp4$/i, "");
    updateDownloadTask(key, title, 0);
    try {
      if (metadata && supportsNativeTransfers()) {
        const nativeId = createNativeTransferId("download");
        const snapshot = await waitForNativeDownload({
          id: nativeId,
          src,
          fileName: sanitizeDownloadName(fileName, "yourworld-media"),
          title,
          metadata,
          taskId: key,
          onProgress,
        });
        if (!snapshot.relativePath) {
          throw new Error("The background download finished without a saved file.");
        }
        await persistNativeDownloadedVideo(
          metadata,
          snapshot.relativePath,
          snapshot.totalBytes || snapshot.bytesTransferred,
        );
        updateDownloadTask(key, title, 100, {
          bytesTransferred: snapshot.totalBytes || snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes || snapshot.bytesTransferred,
          bytesPerSecond: snapshot.bytesPerSecond,
        });
        toast.success("Download complete! Ready offline in Profile > Downloads", {
          duration: 3_000,
        });
        window.setTimeout(() => removeDownloadTask(key), 400);
        return;
      }

      const startedAt = performance.now();
      let sampledAt = startedAt;
      let sampledBytes = 0;
      let bytesPerSecond = 0;
      let lastPublishedAt = 0;
      const reportBytes = (bytesTransferred: number, totalBytes: number) => {
        const now = performance.now();
        const elapsed = now - sampledAt;
        if (elapsed >= 350) {
          bytesPerSecond = Math.max(0, ((bytesTransferred - sampledBytes) * 1000) / elapsed);
          sampledAt = now;
          sampledBytes = bytesTransferred;
        }
        const percent = totalBytes > 0
          ? Math.min(99, (bytesTransferred / totalBytes) * 100)
          : downloadTasks.get(key)?.percent ?? 0;
        if (now - lastPublishedAt >= 250 || percent >= 99) {
          lastPublishedAt = now;
          updateDownloadTask(key, title, percent, {
            bytesTransferred,
            totalBytes: totalBytes || undefined,
            bytesPerSecond,
          });
        }
      };
      const blob = await fetchVideoBlobInWorker(
        src,
        fileName,
        (percent) => {
          updateDownloadTask(key, title, percent);
          onProgress?.(percent);
        },
        reportBytes,
      );
      if (metadata) await saveDownloadedVideo(metadata, blob);
      triggerBlobDownload(blob, fileName);
      updateDownloadTask(key, title, 100);
      toast.success("Download complete! Ready offline in Profile > Downloads", {
        duration: 3_000,
      });
      window.setTimeout(() => removeDownloadTask(key), 400);
    } catch (error) {
      removeDownloadTask(key);
      throw error;
    } finally {
      activeVideoDownloads.delete(key);
    }
  })();

  activeVideoDownloads.set(key, task);
  return task;
}

/**
 * Renders a Reel through a canvas so its download carries the creator
 * watermark. This stays separate from the shared original-byte video path.
 */
export async function downloadWatermarkedReelInBackground(
  src: string,
  fileNameBase: string,
  creatorUsername: string,
  onProgress?: (percent: number) => void,
  metadata?: DownloadedVideoMetadata,
) {
  const watermark = reelWatermarkText(creatorUsername);
  const key = `${src}|watermarked-reel|${fileNameBase}|${watermark}`;
  const existing = activeVideoDownloads.get(key);
  if (existing) return existing;

  const task = (async () => {
    const title = metadata?.title || fileNameBase;
    updateDownloadTask(key, title, 0);
    try {
      const blob = await renderWatermarkedVideo(src, watermark, (percent) => {
        updateDownloadTask(key, title, percent);
        onProgress?.(percent);
      });
      if (!blob.size) throw new Error("Watermarked video export produced an empty file");
      if (metadata) await saveDownloadedVideo(metadata, blob);
      const extension = extensionForMime(blob.type || "video/webm", "webm");
      triggerBlobDownload(
        blob,
        `${sanitizeDownloadName(fileNameBase, "yourworld-reel")}.${extension}`,
      );
      updateDownloadTask(key, title, 100);
      window.setTimeout(() => removeDownloadTask(key), 400);
    } catch (error) {
      removeDownloadTask(key);
      throw error;
    } finally {
      activeVideoDownloads.delete(key);
    }
  })();

  activeVideoDownloads.set(key, task);
  return task;
}

export function reelWatermarkText(creatorUsername: string) {
  return `YourWorld • @${creatorUsername.trim().replace(/^@+/, "") || "user"}`;
}

async function renderWatermarkedVideo(
  src: string,
  watermark: string,
  onProgress?: (percent: number) => void,
) {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("This browser cannot create a watermarked video download");
  }
  if (typeof HTMLCanvasElement.prototype.captureStream !== "function") {
    throw new Error("This browser cannot render a watermarked video download");
  }
  const Ctx = audioContextConstructor();
  if (!Ctx) throw new Error("This browser cannot preserve Reel audio during export");

  const video = await loadVideoForExport(src);
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error("The Reel did not load a video frame for watermarking"));
      }, 15_000);
      const cleanup = () => {
        window.clearTimeout(timeout);
        video.removeEventListener("loadeddata", onLoaded);
        video.removeEventListener("error", onError);
      };
      const onLoaded = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error("The Reel could not be decoded for watermarking"));
      };
      video.addEventListener("loadeddata", onLoaded, { once: true });
      video.addEventListener("error", onError, { once: true });
    });
  }
  const audioContext = new Ctx();
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  if (!canvas.width || !canvas.height) {
    await audioContext.close().catch(() => {});
    throw new Error("The Reel dimensions are unavailable");
  }

  const context = canvas.getContext("2d");
  if (!context) {
    await audioContext.close().catch(() => {});
    throw new Error("Canvas is unavailable for the watermarked download");
  }

  const fontSize = Math.max(14, Math.round(canvas.height * 0.016));
  const padding = Math.max(10, Math.round(fontSize * 0.8));
  const drawFrame = () => {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    context.save();
    context.globalAlpha = 0.72;
    context.font = `600 ${fontSize}px system-ui, sans-serif`;
    context.textAlign = "left";
    context.textBaseline = "bottom";
    context.fillStyle = "#ffffff";
    context.shadowColor = "rgba(0,0,0,0.75)";
    context.shadowBlur = Math.max(3, Math.round(fontSize * 0.24));
    context.shadowOffsetY = Math.max(1, Math.round(fontSize * 0.08));
    context.fillText(watermark, padding, canvas.height - padding, canvas.width - padding * 2);
    context.restore();
  };

  let stream: MediaStream | null = null;
  let animationFrame = 0;
  let audioSource: MediaElementAudioSourceNode | null = null;
  let recorder: MediaRecorder | null = null;
  let rejectRecording: ((reason?: unknown) => void) | null = null;

  try {
    drawFrame();
    // Fail before encoding rather than returning a blank or unwatermarked file
    // when a signed media URL does not permit canvas export.
    context.getImageData(0, 0, 1, 1);

    const audioDestination = audioContext.createMediaStreamDestination();
    audioSource = audioContext.createMediaElementSource(video);
    audioSource.connect(audioDestination);
    await audioContext.resume();

    stream = canvas.captureStream(30);
    for (const track of audioDestination.stream.getAudioTracks()) {
      stream.addTrack(track);
    }
    const mime = recorderMime(false);
    recorder = new MediaRecorder(
      stream,
      mime
        ? {
            mimeType: mime,
            videoBitsPerSecond: Math.min(
              18_000_000,
              Math.max(2_500_000, Math.round(canvas.width * canvas.height * 1.2)),
            ),
          }
        : undefined,
    );

    const recorded = new Promise<Blob>((resolve, reject) => {
      rejectRecording = reject;
      const chunks: BlobPart[] = [];
      recorder!.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder!.onerror = () => reject(new Error("Watermarked video export failed"));
      recorder!.onstop = () => {
        const blob = new Blob(chunks, {
          type: recorder!.mimeType || mime || "video/webm",
        });
        if (blob.size) resolve(blob);
        else reject(new Error("Watermarked video export produced an empty file"));
      };
    });

    const updateProgress = () => {
      if (video.duration > 0 && Number.isFinite(video.duration)) {
        onProgress?.(Math.min(99, Math.round((video.currentTime / video.duration) * 100)));
      }
    };
    const drawNextFrame = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) drawFrame();
      updateProgress();
      if (!video.ended && !video.paused) {
        animationFrame = window.requestAnimationFrame(drawNextFrame);
      }
    };
    const stopOnEnd = () => {
      if (recorder?.state !== "inactive") recorder?.stop();
    };
    const failOnMediaError = () => {
      rejectRecording?.(new Error("The Reel could not be rendered for download"));
      if (recorder?.state !== "inactive") recorder?.stop();
    };
    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("ended", stopOnEnd, { once: true });
    video.addEventListener("error", failOnMediaError, { once: true });

    recorder.start(250);
    try {
      await video.play();
    } catch {
      if (recorder.state !== "inactive") recorder.stop();
      await recorded.catch(() => {});
      throw new Error("This browser blocked playback needed to watermark the Reel");
    }
    drawNextFrame();
    const result = await recorded;
    onProgress?.(100);
    video.removeEventListener("timeupdate", updateProgress);
    video.removeEventListener("ended", stopOnEnd);
    video.removeEventListener("error", failOnMediaError);
    return result;
  } catch (error) {
    if (recorder && recorder.state !== "inactive") recorder.stop();
    if (error instanceof DOMException && error.name === "SecurityError") {
      throw new Error("This Reel cannot be watermarked because its video source blocks canvas export");
    }
    if (error instanceof DOMException && error.name === "NotSupportedError") {
      throw new Error("This browser does not support the video format needed for a watermarked download");
    }
    throw error;
  } finally {
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    stream?.getTracks().forEach((track) => track.stop());
    audioSource?.disconnect();
    video.pause();
    video.removeAttribute("src");
    video.load();
    await audioContext.close().catch(() => {});
  }
}

function recorderMime(audioOnly: boolean) {
  const candidates = audioOnly
    ? ["audio/mpeg", "audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
    : ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/mp4"];
  return candidates.find((mime) => MediaRecorder.isTypeSupported?.(mime)) ?? "";
}

function extensionForMime(mime: string, fallback: "mp4" | "mp3" | "webm") {
  if (mime.includes("mpeg")) return "mp3";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4")) return "mp4";
  return fallback;
}

async function loadVideoForExport(src: string) {
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.playsInline = true;
  video.preload = "auto";
  video.src = src;
  await new Promise<void>((resolve, reject) => {
    video.addEventListener("loadedmetadata", () => resolve(), { once: true });
    video.addEventListener("error", () => reject(new Error("The video could not be read")), { once: true });
    video.load();
  });
  if (!video.duration || !Number.isFinite(video.duration)) {
    throw new Error("The video duration is unavailable");
  }
  return video;
}

function audioContextConstructor() {
  const browserWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext };
  return browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
}

/**
 * Quality selection now controls the saved metadata only. The browser stores
 * the original response bytes directly instead of re-encoding video locally.
 */
export async function downloadVideoAtQuality(
  src: string,
  _fileNameBase: string,
  quality: VideoQualityTier,
  onProgress?: (percent: number) => void,
  metadata?: DownloadedVideoMetadata,
) {
  const target = VIDEO_QUALITY_TIERS.find((candidate) => candidate.id === quality);
  if (!target) throw new Error("Unsupported video quality");
  await downloadVideoInBackground(
    src,
    `${sanitizeDownloadName(_fileNameBase, "yourworld-video")}.mp4`,
    onProgress,
    metadata ? { ...metadata, quality } : undefined,
  );
}

/** Extracts an audio-only download. Browsers that support audio/mpeg produce a true MP3. */
export async function downloadAudioOnly(
  src: string,
  fileNameBase: string,
  onProgress?: (percent: number) => void,
) {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("This browser cannot export audio");
  }
  const video = await loadVideoForExport(src);
  const Ctx = audioContextConstructor();
  if (!Ctx) throw new Error("This browser cannot export audio");
  const audioContext = new Ctx();
  const destination = audioContext.createMediaStreamDestination();
  try {
    audioContext.createMediaElementSource(video).connect(destination);
  } catch {
    await audioContext.close().catch(() => {});
    throw new Error("This source cannot be exported as audio");
  }
  const mime = recorderMime(true);
  const recorder = new MediaRecorder(
    destination.stream,
    mime ? { mimeType: mime, audioBitsPerSecond: 128_000 } : undefined,
  );
  const chunks: BlobPart[] = [];
  const result = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onerror = () => reject(new Error("Audio export failed"));
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime || "audio/webm" }));
  });
  const update = () => {
    onProgress?.(Math.min(99, Math.round((video.currentTime / video.duration) * 100)));
  };
  const stop = () => {
    video.removeEventListener("timeupdate", update);
    if (recorder.state !== "inactive") recorder.stop();
  };
  video.addEventListener("timeupdate", update);
  video.addEventListener("ended", stop, { once: true });
  await audioContext.resume().catch(() => {});
  recorder.start(250);
  await video.play();
  const blob = await result.finally(() => {
    video.pause();
    void audioContext.close().catch(() => {});
  });
  onProgress?.(100);
  triggerBlobDownload(
    blob,
    `${sanitizeDownloadName(fileNameBase, "yourworld-audio")}.${extensionForMime(mime, "webm")}`,
  );
}

export async function downloadWithWatermark(
  src: string,
  username: string,
  fileName: string,
  brandingLabel?: string,
) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.drawImage(img, 0, 0);

  const unit = Math.max(canvas.width, canvas.height) * 0.032;
  const pad = unit * 0.9;
  const x = pad;
  const y = canvas.height - pad;

  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = unit * 0.5;

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  if (brandingLabel) {
    ctx.font = `600 ${unit * 0.62}px Manrope, system-ui, sans-serif`;
    ctx.fillText(brandingLabel, x, y, Math.max(1, canvas.width - pad * 2));
  } else {
    ctx.font = `700 ${unit}px Sora, system-ui, sans-serif`;
    ctx.fillText("YW", x, y);
    const markWidth = ctx.measureText("YW").width;

    ctx.globalAlpha = 0.45;
    ctx.font = `600 ${unit * 0.62}px Manrope, system-ui, sans-serif`;
    ctx.fillText(`@${username}`, x + markWidth + unit * 0.4, y);
  }
  ctx.restore();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.98),
  );
  if (!blob) throw new Error("Export failed");

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
/** Generic saver for any media (video/audio/photo) — keeps original bytes. */
export async function downloadMedia(src: string, fileName: string) {
  const response = await fetch(attachmentMediaUrl(src, fileName), { cache: "force-cache" });
  if (!response.ok) throw new Error(`Media download failed (${response.status})`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

/** Download the original Moment bytes without applying a preview watermark. */
export async function downloadOriginalMomentMedia(
  src: string,
  kind: "photo" | "video",
  id: string,
) {
  await downloadMedia(src, `yourworld-moment-${id}.${kind === "video" ? "mp4" : "jpg"}`);
}

/** Photo → watermarked jpg, anything else → raw file. */
export async function downloadMomentMedia(
  src: string,
  kind: "photo" | "video" | "text",
  username: string,
  id: string,
) {
  if (kind === "photo") {
    try {
      await downloadWithWatermark(src, username, `yw-moment-${id}.jpg`);
      return;
    } catch {
      /* fall through to raw download */
    }
  }
  await downloadMedia(src, `yw-moment-${id}.${kind === "video" ? "mp4" : "jpg"}`);
}
