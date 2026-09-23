/**
 * IndexedDB-backed chat history cache (Telegram/WhatsApp style local-first store).
 * Threads paint from disk instantly — even offline — before the network answers.
 */
import { get, set, createStore } from "idb-keyval";

const store =
  typeof window === "undefined" ? null : createStore("yw-chat", "threads");
const memoryCache = new Map<string, unknown>();

/** How many messages we keep on device per conversation. */
export const CACHE_LIMIT = 200;
/** Page size for server fetches / infinite scroll. */
export const PAGE_SIZE = 40;

export async function loadCachedThread<T>(key: string): Promise<T[] | null> {
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
  const rows = memoryCache.get(key);
  return Array.isArray(rows) ? (rows as T[]) : null;
}

export function saveCachedThread<T>(key: string, rows: T[]) {
  if (!store) return;
  const retained = rows.slice(-CACHE_LIMIT);
  memoryCache.set(key, retained);
  try {
    void set(key, retained, store);
  } catch {
    /* best-effort */
  }
}
