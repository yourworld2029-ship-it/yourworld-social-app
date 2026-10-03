/** Tiny localStorage cache so chat/media UI can paint instantly before the network answers. */

import { getThreadCachePolicy } from "@/lib/chat-cache-security";

const PREFIX = "yw:cache:";

function threadIdFromCacheKey(key: string) {
  return key.startsWith("thread:") ? key.slice("thread:".length) : null;
}

export function cacheGet<T>(key: string, maxAgeMs = 1000 * 60 * 60 * 24): T | null {
  if (typeof window === "undefined") return null;
  const threadId = threadIdFromCacheKey(key);
  if (threadId) {
    const policy = getThreadCachePolicy(threadId);
    if (policy.phase !== "plain") return null;
  }
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { t: number; v: T };
    if (!parsed || Date.now() - parsed.t > maxAgeMs) return null;
    return parsed.v;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  const threadId = threadIdFromCacheKey(key);
  if (threadId) {
    // Protected thread messages use encrypted IndexedDB; unresolved settings
    // deliberately do not fall back to a plaintext localStorage write.
    if (getThreadCachePolicy(threadId).phase !== "plain") return;
  }
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify({ t: Date.now(), v: value }));
  } catch {
    /* quota full — cache is best-effort */
  }
}
