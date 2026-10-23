import type {
  UploadByteProgress,
  UploadRequestProgress,
} from "./storage-upload-request";

export const RESUMABLE_UPLOAD_CHUNK_SIZE = 3 * 1024 * 1024;
export const RESUMABLE_UPLOAD_THRESHOLD = 6 * 1024 * 1024;
export const CLOUDFLARE_TUS_MIN_CHUNK_SIZE = 5 * 1024 * 1024;
export const CLOUDFLARE_TUS_MAX_CHUNK_SIZE = 200 * 1024 * 1024;
export const CLOUDFLARE_TUS_CHUNK_SIZE = CLOUDFLARE_TUS_MIN_CHUNK_SIZE;
export const WEAK_NETWORK_TUS_CHUNK_SIZE = 1 * 1024 * 1024;
const CLOUDFLARE_TUS_CHUNK_MULTIPLE = 256 * 1024;
export const TUS_RETRY_DELAYS = [0, 1000, 3000, 5000, 10000];

export function getCloudflareTusChunkSize(preferredChunkSize?: number) {
  const requested = Number.isFinite(preferredChunkSize)
    ? (preferredChunkSize as number)
    : CLOUDFLARE_TUS_CHUNK_SIZE;
  const rounded =
    Math.round(requested / CLOUDFLARE_TUS_CHUNK_MULTIPLE) *
    CLOUDFLARE_TUS_CHUNK_MULTIPLE;
  return Math.max(
    CLOUDFLARE_TUS_MIN_CHUNK_SIZE,
    Math.min(CLOUDFLARE_TUS_MAX_CHUNK_SIZE, rounded),
  );
}

export function shouldUseMicroTusChunks(network: {
  networkQuality?: string | null;
  effectiveType?: string | null;
  downlinkMbps?: number | null;
  rttMs?: number | null;
  saveData?: boolean;
}) {
  const effectiveType = network.effectiveType?.toLowerCase();
  const downlink = Number(network.downlinkMbps);
  const rtt = Number(network.rttMs);
  return (
    network.networkQuality === "weak" ||
    network.networkQuality === "offline" ||
    network.saveData === true ||
    effectiveType === "slow-2g" ||
    effectiveType === "2g" ||
    effectiveType === "3g" ||
    (Number.isFinite(downlink) && downlink > 0 && downlink <= 1.5) ||
    (Number.isFinite(rtt) && rtt >= 450)
  );
}

export function getTusChunkSize(network: Parameters<typeof shouldUseMicroTusChunks>[0]) {
  return shouldUseMicroTusChunks(network)
    ? WEAK_NETWORK_TUS_CHUNK_SIZE
    : RESUMABLE_UPLOAD_CHUNK_SIZE;
}

export function createTusFileFingerprint(
  namespace: string,
  file: Blob,
  fallbackName: string,
) {
  const fileMetadata = file as Blob & {
    name?: unknown;
    lastModified?: unknown;
  };
  const fileName =
    typeof fileMetadata.name === "string" && fileMetadata.name.length > 0
      ? fileMetadata.name
      : fallbackName;
  const lastModified =
    typeof fileMetadata.lastModified === "number" &&
    Number.isFinite(fileMetadata.lastModified)
      ? fileMetadata.lastModified
      : 0;

  return `${namespace}:${encodeURIComponent(fileName)}:${file.size}:${lastModified}`;
}

export function getTusRetryDelayMs(attempt: number) {
  const safeAttempt = Math.max(0, Math.floor(Number.isFinite(attempt) ? attempt : 0));
  return Math.min(60_000, 1_000 * 2 ** Math.min(safeAttempt, 6));
}

export function isRetryableTusError(error: unknown, isOnline: boolean) {
  if (!error || typeof error !== "object") return !isOnline;
  const details = error as {
    causingNetworkError?: unknown;
    originalResponse?: { getStatus?: () => number };
  };
  if (details.causingNetworkError != null) return true;

  let status: number | undefined;
  try {
    status = details.originalResponse?.getStatus?.();
  } catch {
    status = undefined;
  }
  if (typeof status === "number" && Number.isFinite(status)) {
    return (
      status === 0 ||
      status === 408 ||
      status === 409 ||
      status === 423 ||
      status === 425 ||
      status === 429 ||
      status >= 500
    );
  }
  return !isOnline;
}

export function canFallbackAfterCloudflareTusFailure(
  error: unknown,
  isOnline = true,
) {
  if (!error || typeof error !== "object") return false;
  const details = error as {
    originalResponse?: { getStatus?: () => number };
  };
  let status: number | undefined;
  try {
    status = details.originalResponse?.getStatus?.();
  } catch {
    status = undefined;
  }
  if (status === 424) return true;
  if (status === 401 || status === 403) return false;
  return isRetryableTusError(error, isOnline);
}

export function shouldUseStoragePlaybackFallback(options: {
  bucket: string;
  fallbackToStorage?: boolean;
  requireSignedURLs?: boolean;
}) {
  return (
    options.fallbackToStorage === true &&
    (options.bucket === "videos" || options.bucket === "reels") &&
    options.requireSignedURLs !== true
  );
}

export type TusProgressReporter = UploadRequestProgress & {
  flush: () => void;
  cancel: () => void;
};

export function createTusProgressReporter(
  onProgress: UploadRequestProgress | undefined,
  intervalMs = 200,
): TusProgressReporter {
  let lastEmittedAt = Number.NEGATIVE_INFINITY;
  let pending: {
    percent: number;
    detail?: string;
    byteProgress?: UploadByteProgress | null;
  } | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let cancelled = false;

  const emit = () => {
    if (!pending || cancelled) return;
    const next = pending;
    pending = null;
    lastEmittedAt = Date.now();
    onProgress?.(next.percent, next.detail, next.byteProgress);
  };
  const report = ((
    percent: number,
    detail?: string,
    byteProgress?: UploadByteProgress | null,
  ) => {
    if (cancelled) return;
    pending = { percent, detail, byteProgress };
    const elapsed = Date.now() - lastEmittedAt;
    if (elapsed >= intervalMs || percent >= 100) {
      if (timer) clearTimeout(timer);
      timer = null;
      emit();
      return;
    }
    if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        emit();
      }, Math.max(0, intervalMs - elapsed));
    }
  }) as TusProgressReporter;

  report.flush = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    emit();
  };
  report.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    pending = null;
    cancelled = true;
  };
  return report;
}

export function shouldUseResumableStorageUpload(fileSize: number, useMicroChunks = false) {
  const threshold = useMicroChunks
    ? WEAK_NETWORK_TUS_CHUNK_SIZE
    : RESUMABLE_UPLOAD_THRESHOLD;
  return Number.isSafeInteger(fileSize) && fileSize > threshold;
}

export function getStorageResumableUploadEndpoint(projectUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(projectUrl.trim());
  } catch {
    throw new Error("The configured Supabase project URL is invalid.");
  }

  const suffix = ".supabase.co";
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(suffix)) {
    throw new Error("Resumable uploads require the configured HTTPS Supabase project URL.");
  }

  const projectRef = parsed.hostname.slice(0, -suffix.length);
  if (!projectRef) {
    throw new Error("The configured Supabase project URL is missing its project reference.");
  }

  return `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`;
}