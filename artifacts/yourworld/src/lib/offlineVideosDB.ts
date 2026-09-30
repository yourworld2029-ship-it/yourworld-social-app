export const OFFLINE_VIDEOS_DB_NAME = "YourWorldOfflineStore";
export const OFFLINE_VIDEOS_STORE_NAME = "videos";

export type OfflineVideo = {
  id: string | number;
  title: string;
  author: string;
  thumbnailUrl: string;
  quality: string;
  sizeBytes: number;
  /** Offline video bytes are stored as a persistent IndexedDB Blob. */
  videoBlob?: Blob;
  downloadedAt: string;
  ownerId?: string;
  mediaId?: string;
  creatorName?: string;
  creatorUsername?: string;
  creatorId?: string | null;
  views?: number | null;
  createdAt?: string | null;
  durationSeconds?: number | null;
  posterUrl?: string | null;
  /** App-private Capacitor paths used by the Android offline library. */
  localFilePath?: string;
  fileUri?: string;
  /** Legacy alias retained for download records created before fileUri. */
  localFileUri?: string;
  thumbnailPath?: string | null;
};

let databasePromise: Promise<IDBDatabase> | null = null;
let persistenceRequest: Promise<void> | null = null;

function requestPersistentStorage() {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) {
    return Promise.resolve();
  }
  persistenceRequest ??= navigator.storage.persist().then(() => undefined).catch(() => {
    // Persistence is best effort; the app still uses its durable IndexedDB store.
  });
  return persistenceRequest;
}

function openDatabase() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("Offline video storage is unavailable in this browser"));
  }
  if (databasePromise) return databasePromise;

  databasePromise = requestPersistentStorage()
    .then(
      () =>
        new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open(OFFLINE_VIDEOS_DB_NAME, 1);
          request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(OFFLINE_VIDEOS_STORE_NAME)) {
              request.result.createObjectStore(OFFLINE_VIDEOS_STORE_NAME, { keyPath: "id" });
            }
          };
          request.onsuccess = () => resolve(request.result);
          request.onerror = () =>
            reject(request.error ?? new Error("Could not open offline video storage"));
          request.onblocked = () => reject(new Error("Offline video storage is busy"));
        }),
    )
    .catch((error) => {
    databasePromise = null;
    throw error;
  });

  return databasePromise;
}

function completeTransaction(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Offline video storage transaction failed"));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Offline video storage transaction was aborted"));
  });
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Offline video storage request failed"));
  });
}

export async function saveOfflineVideo(videoData: OfflineVideo) {
  const database = await openDatabase();
  const transaction = database.transaction(OFFLINE_VIDEOS_STORE_NAME, "readwrite");
  transaction.objectStore(OFFLINE_VIDEOS_STORE_NAME).put(videoData);
  await completeTransaction(transaction);
}

export async function getAllOfflineVideos() {
  const database = await openDatabase();
  const transaction = database.transaction(OFFLINE_VIDEOS_STORE_NAME, "readonly");
  const recordsPromise = requestResult<OfflineVideo[]>(
    transaction.objectStore(OFFLINE_VIDEOS_STORE_NAME).getAll(),
  );
  const [, records] = await Promise.all([completeTransaction(transaction), recordsPromise]);
  return records.sort((a, b) => b.downloadedAt.localeCompare(a.downloadedAt));
}

export async function getOfflineVideoById(id: string | number) {
  const database = await openDatabase();
  const transaction = database.transaction(OFFLINE_VIDEOS_STORE_NAME, "readonly");
  const recordPromise = requestResult<OfflineVideo | undefined>(
    transaction.objectStore(OFFLINE_VIDEOS_STORE_NAME).get(id),
  );
  const [, record] = await Promise.all([completeTransaction(transaction), recordPromise]);
  return record ?? null;
}

export async function deleteOfflineVideo(id: string | number) {
  const database = await openDatabase();
  const transaction = database.transaction(OFFLINE_VIDEOS_STORE_NAME, "readwrite");
  transaction.objectStore(OFFLINE_VIDEOS_STORE_NAME).delete(id);
  await completeTransaction(transaction);
}