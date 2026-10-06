import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { toast } from "sonner";

export type MediaConcurrencySnapshot = Readonly<{
  isMediaUploadInProgress: boolean;
  isMediaDownloadInProgress: boolean;
}>;

export type MediaDownloadLease = Readonly<{ token: symbol }>;

type Store = {
  getSnapshot: () => MediaConcurrencySnapshot;
  subscribe: (listener: () => void) => () => void;
};

let snapshot: MediaConcurrencySnapshot = Object.freeze({
  isMediaUploadInProgress: false,
  isMediaDownloadInProgress: false,
});
let activeUploadOwner: string | null = null;
let activeDownloadLease: MediaDownloadLease | null = null;
const listeners = new Set<() => void>();

function publish(next: MediaConcurrencySnapshot) {
  snapshot = Object.freeze(next);
  listeners.forEach((listener) => listener());
}

const store: Store = {
  getSnapshot: () => snapshot,
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

const MediaConcurrencyContext = createContext<Store>(store);

export function MediaConcurrencyProvider({ children }: { children: ReactNode }) {
  return (
    <MediaConcurrencyContext.Provider value={store}>
      {children}
    </MediaConcurrencyContext.Provider>
  );
}

export function useMediaConcurrency() {
  const mediaStore = useContext(MediaConcurrencyContext);
  return useSyncExternalStore(
    mediaStore.subscribe,
    mediaStore.getSnapshot,
    mediaStore.getSnapshot,
  );
}

export function getMediaConcurrencySnapshot() {
  return snapshot;
}

export function acquireMediaUploadLock(owner: string) {
  if (activeUploadOwner !== null) {
    toast("An upload is already in progress. Please wait until it completes.");
    return false;
  }
  activeUploadOwner = owner;
  publish({ ...snapshot, isMediaUploadInProgress: true });
  return true;
}

export function releaseMediaUploadLock(owner: string) {
  if (activeUploadOwner !== owner) return;
  activeUploadOwner = null;
  publish({ ...snapshot, isMediaUploadInProgress: false });
}

export function acquireMediaDownloadLock(): MediaDownloadLease | null {
  if (activeDownloadLease !== null) {
    showMediaDownloadBusyToast();
    return null;
  }
  const lease = Object.freeze({ token: Symbol("media-download") });
  activeDownloadLease = lease;
  publish({ ...snapshot, isMediaDownloadInProgress: true });
  return lease;
}

export function releaseMediaDownloadLock(lease: MediaDownloadLease) {
  if (activeDownloadLease?.token !== lease.token) return;
  activeDownloadLease = null;
  publish({ ...snapshot, isMediaDownloadInProgress: false });
}

export function ownsMediaDownloadLock(lease: MediaDownloadLease | null | undefined) {
  return Boolean(lease && activeDownloadLease?.token === lease.token);
}

export function isMediaDownloadLocked() {
  return activeDownloadLease !== null;
}

export function showMediaDownloadBusyToast() {
  toast("A download is already in progress. Please wait.");
}

/**
 * Runs a download under the app-wide lock. A caller that already acquired the
 * lock (such as the shared download sheet) can pass its lease through nested
 * download helpers without releasing it early.
 */
export async function withMediaDownloadLock<T>(
  run: (lease: MediaDownloadLease) => T | Promise<T>,
  existingLease?: MediaDownloadLease,
): Promise<T | null> {
  if (existingLease && ownsMediaDownloadLock(existingLease)) {
    return await run(existingLease);
  }

  const lease = acquireMediaDownloadLock();
  if (!lease) return null;
  try {
    return await run(lease);
  } finally {
    releaseMediaDownloadLock(lease);
  }
}
