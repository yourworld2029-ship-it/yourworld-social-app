import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";
import type { OfflineVideo } from "@/lib/offlineVideosDB";

const REGISTRY_KEY = "yourworld.offline-videos.registry.v1";
const REGISTRY_VERSION = 1;
const ROOT_DIRECTORY = "offline-videos";
const REGISTRY_FILE_NAME = "registry.json";
const REGISTRY_FILE_PATH = `${ROOT_DIRECTORY}/${REGISTRY_FILE_NAME}`;
const WRITE_CHUNK_BYTES = 1024 * 1024;
const MAX_THUMBNAIL_BYTES = 4 * 1024 * 1024;

export type NativeOfflineVideo = OfflineVideo & {
  id: string;
  localFilePath: string;
  localFileUri?: string;
  thumbnailPath: string | null;
};

type RegistryEnvelope = {
  version: number;
  entries: NativeOfflineVideo[];
};

let registryQueue: Promise<void> = Promise.resolve();
let fileSequence = 0;

export function isAndroidNativeDownloads() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

async function mkdirIgnoringExisting(path: string) {
  try {
    await Filesystem.mkdir({
      path,
      directory: Directory.Data,
      recursive: true,
    });
  } catch (error) {
    const details =
      error && typeof error === "object"
        ? [
            "message" in error ? String(error.message) : "",
            "code" in error ? String(error.code) : "",
          ].join(" ")
        : String(error);
    if (!/already exists|EEXIST|DIRECTORY_EXISTS|OS-PLUG-FILE-0010/i.test(details)) {
      throw error;
    }
  }
}

async function ensureOfflineDirectory() {
  await mkdirIgnoringExisting(ROOT_DIRECTORY);
}

function isNativeRecord(value: unknown): value is NativeOfflineVideo {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<NativeOfflineVideo>;
  return (
    typeof record.id === "string" &&
    typeof record.ownerId === "string" &&
    typeof record.title === "string" &&
    typeof record.localFilePath === "string" &&
    (record.localFileUri === undefined || typeof record.localFileUri === "string") &&
    (record.thumbnailPath === null || typeof record.thumbnailPath === "string") &&
    typeof record.downloadedAt === "string" &&
    Number.isFinite(record.sizeBytes)
  );
}

function parseRegistry(value: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("The saved offline-download registry is unreadable.");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("version" in parsed) ||
    !("entries" in parsed)
  ) {
    throw new Error("The saved offline-download registry has an unsupported format.");
  }

  const envelope = parsed as RegistryEnvelope;
  if (
    envelope.version !== REGISTRY_VERSION ||
    !Array.isArray(envelope.entries) ||
    !envelope.entries.every(isNativeRecord)
  ) {
    throw new Error("The saved offline-download registry has an unsupported format.");
  }
  return envelope.entries;
}

async function readDirectoryRegistry() {
  await ensureOfflineDirectory();
  const { files } = await Filesystem.readdir({
    path: ROOT_DIRECTORY,
    directory: Directory.Data,
  });
  if (!files.some((file) => file.name === REGISTRY_FILE_NAME && file.type === "file")) {
    return null;
  }

  const { data } = await Filesystem.readFile({
    path: REGISTRY_FILE_PATH,
    directory: Directory.Data,
    encoding: Encoding.UTF8,
  });
  if (typeof data !== "string") {
    throw new Error("The saved offline-download registry is not text.");
  }
  return parseRegistry(data);
}

async function readLegacyPreferencesRegistry() {
  const { value } = await Preferences.get({ key: REGISTRY_KEY });
  return value ? parseRegistry(value) : null;
}

async function writeRegistry(entries: NativeOfflineVideo[]) {
  const value = JSON.stringify({ version: REGISTRY_VERSION, entries });
  await ensureOfflineDirectory();
  await Filesystem.writeFile({
    path: REGISTRY_FILE_PATH,
    data: value,
    directory: Directory.Data,
    encoding: Encoding.UTF8,
    recursive: true,
  });

  // Retain a mirror for older app builds; the permanent Directory.Data file is authoritative.
  await Preferences.set({ key: REGISTRY_KEY, value }).catch((error) => {
    console.warn("[downloads] could not update the legacy native registry mirror", error);
  });
}

async function readRegistry() {
  let directoryError: unknown;
  try {
    const entries = await readDirectoryRegistry();
    if (entries) return entries;
  } catch (error) {
    directoryError = error;
  }

  let legacyEntries: NativeOfflineVideo[] | null;
  try {
    legacyEntries = await readLegacyPreferencesRegistry();
  } catch (error) {
    if (directoryError) throw directoryError;
    throw error;
  }
  if (legacyEntries) {
    try {
      await writeRegistry(legacyEntries);
    } catch (error) {
      console.warn("[downloads] could not migrate the legacy native registry to app data", error);
    }
    return legacyEntries;
  }
  if (directoryError) throw directoryError;
  return [];
}

function updateRegistry<T>(
  update: (current: NativeOfflineVideo[]) => { entries: NativeOfflineVideo[]; result: T },
) {
  const operation = registryQueue.then(async () => {
    const current = await readRegistry();
    const { entries, result } = update(current);
    await writeRegistry(entries);
    return result;
  });
  registryQueue = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
}

async function shortHash(value: string) {
  const bytes = new TextEncoder().encode(value);
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  }

  let hash = 2166136261;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function safeExtension(mimeType: string, fallback: string) {
  const subtype = mimeType.split("/")[1]?.split(";")[0]?.toLowerCase() ?? "";
  const extension = subtype
    .replace(/^x-/, "")
    .replace(/\+xml$/, "")
    .replace(/[^a-z0-9]/g, "");
  if (!extension) return fallback;
  if (extension === "quicktime" || extension === "x-m4v") return "mp4";
  if (extension === "jpeg") return "jpg";
  return extension;
}

function videoExtensionFromUrl(sourceUrl: string) {
  const pathname = new URL(sourceUrl).pathname;
  const extension = pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  return extension && ["mp4", "m4v", "mov", "webm", "3gp", "mkv"].includes(extension)
    ? extension
    : "mp4";
}

function assertDirectVideoUrl(sourceUrl: string) {
  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    throw new Error("This video has an invalid download URL.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("This video must have a valid HTTP download URL.");
  }
  if (/\.m3u8$/i.test(url.pathname)) {
    throw new Error("This Android download uses an HLS playlist, which is not supported for offline saving yet.");
  }
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  const step = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += step) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + step));
  }
  return btoa(binary);
}

async function ensureParentDirectory(path: string) {
  await ensureOfflineDirectory();
  const separator = path.lastIndexOf("/");
  if (separator <= 0) return;
  await mkdirIgnoringExisting(path.slice(0, separator));
}

async function writeBlob(path: string, blob: Blob) {
  if (!blob.size) throw new Error("Cannot save an empty offline video file.");
  await ensureParentDirectory(path);

  for (let offset = 0; offset < blob.size; offset += WRITE_CHUNK_BYTES) {
    const bytes = new Uint8Array(
      await blob.slice(offset, offset + WRITE_CHUNK_BYTES).arrayBuffer(),
    );
    const data = toBase64(bytes);
    if (offset === 0) {
      await Filesystem.writeFile({
        path,
        data,
        directory: Directory.Data,
        recursive: true,
      });
    } else {
      await Filesystem.appendFile({
        path,
        data,
        directory: Directory.Data,
      });
    }
  }

  const savedFile = await Filesystem.stat({ path, directory: Directory.Data });
  if (savedFile.size !== blob.size) {
    throw new Error("The saved offline video did not pass its size check.");
  }
}

async function removeFile(path?: string | null) {
  if (!path) return;
  try {
    await Filesystem.deleteFile({ path, directory: Directory.Data });
  } catch {
    // A missing file must not make an explicit library removal fail.
  }
}

async function createUniquePaths(record: OfflineVideo, sourceUrl?: string) {
  const ownerHash = await shortHash(record.ownerId ?? "unknown-owner");
  const id = String(record.id);
  const idDirectory = encodeURIComponent(id).replace(/\./g, "%2E");
  const suffix =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${fileSequence++}`;
  const directory = `${ROOT_DIRECTORY}/${ownerHash}/${idDirectory}`;
  const videoExtension = sourceUrl
    ? videoExtensionFromUrl(sourceUrl)
    : safeExtension(record.videoBlob?.type ?? "", "mp4");
  return {
    localFilePath: `${directory}/${suffix}.${videoExtension}`,
    thumbnailPath: `${directory}/${suffix}-thumbnail`,
  };
}

async function saveThumbnail(record: OfflineVideo, path: string) {
  const source = record.thumbnailUrl || record.posterUrl;
  if (!source || !/^https?:\/\//i.test(source)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  let thumbnailPath: string | null = null;
  try {
    const response = await fetch(source, {
      cache: "force-cache",
      credentials: "omit",
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const declaredSize = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredSize) && declaredSize > MAX_THUMBNAIL_BYTES) return null;
    const blob = await response.blob();
    if (!blob.size || blob.size > MAX_THUMBNAIL_BYTES) return null;

    thumbnailPath = `${path}.${safeExtension(blob.type, "jpg")}`;
    await writeBlob(thumbnailPath, blob);
    return thumbnailPath;
  } catch {
    // The video remains a valid offline download when its thumbnail is unavailable.
    await removeFile(thumbnailPath);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function commitNativeOfflineVideo(
  record: OfflineVideo,
  localFilePath: string,
  thumbnailPath: string,
  localFileUri?: string,
) {
  const { videoBlob: _videoBlob, ...metadata } = record;
  void _videoBlob;
  const nativeRecord: NativeOfflineVideo = {
    ...metadata,
    id: String(record.id),
    localFilePath,
    localFileUri,
    thumbnailPath: null,
  };

  const previous = await updateRegistry((current) => ({
    entries: [...current.filter((entry) => entry.id !== nativeRecord.id), nativeRecord],
    result: current.find((entry) => entry.id === nativeRecord.id) ?? null,
  }));

  if (previous?.localFilePath !== nativeRecord.localFilePath) {
    void removeFile(previous?.localFilePath);
  }
  if (previous?.thumbnailPath) void removeFile(previous.thumbnailPath);

  // The video and its index are durable now. Thumbnail fetching must not delay
  // the Downloads tab from showing the completed video.
  void saveThumbnail(record, thumbnailPath)
    .then(async (savedThumbnailPath) => {
      if (!savedThumbnailPath) return;
      const indexed = await updateRegistry((current) => {
        const exists = current.some(
          (entry) =>
            entry.id === nativeRecord.id &&
            entry.localFilePath === nativeRecord.localFilePath,
        );
        return {
          entries: exists
            ? current.map((entry) =>
                entry.id === nativeRecord.id &&
                entry.localFilePath === nativeRecord.localFilePath
                  ? { ...entry, thumbnailPath: savedThumbnailPath }
                  : entry,
              )
            : current,
          result: exists,
        };
      });
      if (!indexed) await removeFile(savedThumbnailPath);
    })
    .catch((error) => {
      console.warn("[downloads] could not update the saved thumbnail index", error);
    });

  return nativeRecord;
}

export async function listNativeOfflineVideos(ownerId: string) {
  return (await readRegistry())
    .filter((record) => record.ownerId === ownerId)
    .sort((a, b) => b.downloadedAt.localeCompare(a.downloadedAt));
}

export async function getNativeOfflineVideo(id: string, ownerId?: string) {
  const record = (await readRegistry()).find((candidate) => candidate.id === id);
  if (!record || (ownerId && record.ownerId !== ownerId)) return null;
  return record;
}

export async function saveNativeOfflineVideo(
  record: OfflineVideo,
  videoBlob: Blob = record.videoBlob ?? new Blob(),
) {
  if (!record.ownerId) throw new Error("An owner is required to save an offline video.");
  if (!videoBlob.size) throw new Error("The offline video file is empty.");

  const normalizedRecord = { ...record, id: String(record.id), videoBlob };
  const paths = await createUniquePaths(normalizedRecord);
  try {
    await writeBlob(paths.localFilePath, videoBlob);
    return await commitNativeOfflineVideo(
      normalizedRecord,
      paths.localFilePath,
      paths.thumbnailPath,
    );
  } catch (error) {
    await removeFile(paths.localFilePath);
    throw error;
  }
}

export async function downloadNativeOfflineVideoFromUrl(
  record: OfflineVideo,
  sourceUrl: string,
  onProgress?: (bytesTransferred: number, totalBytes: number) => void,
) {
  if (!isAndroidNativeDownloads()) {
    throw new Error("Native streaming downloads are only available on Android.");
  }
  if (!record.ownerId) throw new Error("An owner is required to save an offline video.");
  assertDirectVideoUrl(sourceUrl);

  const normalizedRecord = { ...record, id: String(record.id) };
  const paths = await createUniquePaths(normalizedRecord, sourceUrl);
  const listener = await Filesystem.addListener("progress", (progress) => {
    if (progress.url === sourceUrl) {
      onProgress?.(progress.bytes, progress.contentLength);
    }
  });

  try {
    await ensureParentDirectory(paths.localFilePath);
    await Filesystem.downloadFile({
      url: sourceUrl,
      path: paths.localFilePath,
      directory: Directory.Data,
      progress: true,
      recursive: true,
    });

    const savedFile = await Filesystem.stat({
      path: paths.localFilePath,
      directory: Directory.Data,
    });
    if (!Number.isFinite(savedFile.size) || savedFile.size <= 0) {
      throw new Error("The downloaded offline video is empty.");
    }
    const { uri } = await Filesystem.getUri({
      path: paths.localFilePath,
      directory: Directory.Data,
    });

    const savedRecord: OfflineVideo = {
      ...normalizedRecord,
      sizeBytes: savedFile.size,
      downloadedAt: normalizedRecord.downloadedAt || new Date().toISOString(),
    };
    return await commitNativeOfflineVideo(
      savedRecord,
      paths.localFilePath,
      paths.thumbnailPath,
      uri,
    );
  } catch (error) {
    await removeFile(paths.localFilePath);
    throw error;
  } finally {
    await listener.remove().catch(() => undefined);
  }
}

export async function removeNativeOfflineVideo(id: string, ownerId?: string) {
  const removed = await updateRegistry((current) => {
    const record = current.find(
      (candidate) => candidate.id === id && (!ownerId || candidate.ownerId === ownerId),
    );
    return {
      entries: record ? current.filter((candidate) => candidate !== record) : current,
      result: record,
    };
  });

  if (!removed) return;
  await Promise.all([
    removeFile(removed.localFilePath),
    removeFile(removed.thumbnailPath),
  ]);
}

export async function getNativeFileUrl(path: string, storedUri?: string) {
  const uri =
    storedUri ??
    (await Filesystem.getUri({ path, directory: Directory.Data })).uri;
  return Capacitor.convertFileSrc(uri);
}