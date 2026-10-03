/**
 * IndexedDB-backed chat history cache (Telegram/WhatsApp style local-first store).
 * Threads paint from disk instantly — even offline — before the network answers.
 */
import { get, set, createStore } from "idb-keyval";
import {
  getThreadCachePolicy,
  loadProtectedThreadCache,
  saveProtectedThreadCache,
} from "@/lib/chat-cache-security";

const store =
  typeof window === "undefined" ? null : createStore("yw-chat", "threads");
const memoryCache = new Map<string, unknown>();

function threadIdFromKey(key: string) {
  return key.startsWith("social:") ? key.slice("social:".length) : null;
}

/** How many messages we keep on device per conversation. */
export const CACHE_LIMIT = 200;
/** Page size for server fetches / infinite scroll. */
export const PAGE_SIZE = 40;

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

export function saveCachedThread<T>(key: string, rows: T[]) {
  const retained = rows.slice(-CACHE_LIMIT);
  memoryCache.set(key, retained);
  const threadId = threadIdFromKey(key);
  const policy = threadId ? getThreadCachePolicy(threadId) : null;
  if (policy?.phase === "protected") {
    if (policy.ownerId) {
      void saveProtectedThreadCache(threadId!, policy.ownerId, retained);
    }
    return;
  }
  if (policy && policy.phase !== "plain") return;
  if (!store) return;
  try {
    void set(key, retained, store);
  } catch {
    /* best-effort */
  }
}
