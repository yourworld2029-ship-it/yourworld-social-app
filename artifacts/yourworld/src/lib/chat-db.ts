/**
 * IndexedDB-backed chat history cache (Telegram/WhatsApp style local-first store).
 * Threads paint from disk instantly — even offline — before the network answers.
 */
import { get, set, del, createStore } from "idb-keyval";
import {
  getThreadCachePolicy,
  loadProtectedThreadCache,
  saveProtectedThreadCache,
} from "@/lib/chat-cache-security";

const store =
  typeof window === "undefined" ? null : createStore("yw-chat", "threads");
const memoryCache = new Map<string, unknown>();
const threadCacheWriteQueues = new Map<string, Promise<void>>();
const threadCacheWriteGenerations = new Map<string, number>();

function threadIdFromKey(key: string) {
  return key.startsWith("social:") ? key.slice("social:".length) : null;
}

/** How many messages we keep on device per conversation. */
export const CACHE_LIMIT = 200;
/** Page size for server fetches / infinite scroll. */
export const PAGE_SIZE = 30;

export async function loadCachedThread<T>(key: string): Promise<T[] | null> {
  const threadId = threadIdFromKey(key);
  const policy = threadId ? getThreadCachePolicy(threadId) : null;
  if (policy && policy.phase !== "plain" && policy.phase !== "protected") return null;
  if (policy?.phase === "protected") {
    if (!policy.ownerId) return null;
    const memory = memoryCache.get(key);
    if (Array.isArray(memory)) return memory as T[];
    const rows = await loadProtectedThreadCache<T>(threadId!, policy.ownerId);
    if (rows) memoryCache.set(key, rows);
    return rows;
  }
  if (!store) return null;
  const memory = memoryCache.get(key);
  if (Array.isArray(memory)) return memory as T[];
  try {
    const rows = ((await get(key, store)) as T[] | undefined) ?? null;
    if (rows) memoryCache.set(key, rows);
    return rows;
  } catch {
    return null;
  }
}

export function loadCachedThreadSync<T>(key: string): T[] | null {
  const threadId = threadIdFromKey(key);
  const policy = threadId ? getThreadCachePolicy(threadId) : null;
  if (policy && policy.phase !== "plain" && policy.phase !== "protected") return null;
  const rows = memoryCache.get(key);
  return Array.isArray(rows) ? (rows as T[]) : null;
}

function enqueueThreadCacheWrite(key: string, operation: () => Promise<void>) {
  const previous = threadCacheWriteQueues.get(key) ?? Promise.resolve();
  const pending = previous.catch(() => undefined).then(operation);
  threadCacheWriteQueues.set(key, pending);
  const cleanup = () => {
    if (threadCacheWriteQueues.get(key) === pending) {
      threadCacheWriteQueues.delete(key);
    }
  };
  void pending.then(cleanup, cleanup);
  return pending;
}

export function saveCachedThread<T>(key: string, rows: T[]) {
  const retained = rows.slice(-CACHE_LIMIT);
  memoryCache.set(key, retained);
  const generation = threadCacheWriteGenerations.get(key) ?? 0;
  void enqueueThreadCacheWrite(key, async () => {
    if (
      generation !== (threadCacheWriteGenerations.get(key) ?? 0) ||
      memoryCache.get(key) !== retained
    ) {
      return;
    }
    const threadId = threadIdFromKey(key);
    const policy = threadId ? getThreadCachePolicy(threadId) : null;
    if (policy?.phase === "protected") {
      if (policy.ownerId) {
        await saveProtectedThreadCache(threadId!, policy.ownerId, retained);
      }
      return;
    }
    if (policy && policy.phase !== "plain") return;
    if (!store) return;
    await set(key, retained, store);
  }).catch((cause) => {
    console.warn("[chat-cache] thread cache write failed", cause);
  });
}

/** Invalidates pending writes and clears every local copy of a thread. */
export function clearCachedThread(key: string, ownerId?: string | null) {
  const generation = (threadCacheWriteGenerations.get(key) ?? 0) + 1;
  threadCacheWriteGenerations.set(key, generation);
  const emptyRows: unknown[] = [];
  memoryCache.set(key, emptyRows);

  return enqueueThreadCacheWrite(key, async () => {
    const latestRows = memoryCache.get(key);
    if (
      generation !== (threadCacheWriteGenerations.get(key) ?? 0) ||
      !Array.isArray(latestRows) ||
      (latestRows !== emptyRows && latestRows.length > 0)
    ) {
      return;
    }
    const threadId = threadIdFromKey(key);
    const policy = threadId ? getThreadCachePolicy(threadId) : null;
    if (!store) return;

    // Remove the unencrypted copy first, including while protection settings
    // are being resolved, so it cannot be restored on the next thread mount.
    await del(key, store);
    if (policy?.phase === "protected" || (policy && policy.phase !== "plain")) {
      const protectedOwnerId = policy.ownerId ?? ownerId;
      if (!threadId || !protectedOwnerId) {
        throw new Error("The chat cache owner is not available yet.");
      }
      const saved = await saveProtectedThreadCache(threadId, protectedOwnerId, emptyRows);
      if (!saved) throw new Error("The protected chat cache could not be cleared.");
      return;
    }
    await set(key, emptyRows, store);
  });
}
