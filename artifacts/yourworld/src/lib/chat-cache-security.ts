import { useCallback, useSyncExternalStore } from "react";
import { createStore, del, get, set } from "idb-keyval";

export type ThreadCachePolicy = {
  phase: "pending" | "transition" | "plain" | "protected";
  ownerId: string | null;
};

export type ProtectedChatEnvelope = {
  version: 1;
  iv: ArrayBuffer;
  ciphertext: ArrayBuffer;
};

const DEFAULT_POLICY: ThreadCachePolicy = Object.freeze({
  phase: "pending",
  ownerId: null,
});
const CACHE_PREFIX = "yw:cache:";
const CHAT_STORE =
  typeof window === "undefined" ? null : createStore("yw-chat", "threads");
const policies = new Map<string, ThreadCachePolicy>();
const listeners = new Map<string, Set<() => void>>();
const keyPromises = new Map<string, Promise<CryptoKey>>();
const migrationPromises = new Map<string, { target: "plain" | "protected"; promise: Promise<void> }>();
const migrationVersions = new Map<string, number>();

function publishPolicy(threadId: string, policy: ThreadCachePolicy) {
  policies.set(threadId, policy);
  listeners.get(threadId)?.forEach((listener) => listener());
}

export function getThreadCachePolicy(threadId: string): ThreadCachePolicy {
  return policies.get(threadId) ?? DEFAULT_POLICY;
}

export function subscribeThreadCachePolicy(threadId: string, listener: () => void) {
  let threadListeners = listeners.get(threadId);
  if (!threadListeners) {
    threadListeners = new Set();
    listeners.set(threadId, threadListeners);
  }
  threadListeners.add(listener);
  return () => {
    threadListeners?.delete(listener);
    if (!threadListeners?.size) listeners.delete(threadId);
  };
}

export function useThreadCachePolicy(threadId: string) {
  const subscribe = useCallback(
    (listener: () => void) => subscribeThreadCachePolicy(threadId, listener),
    [threadId],
  );
  const getSnapshot = useCallback(() => getThreadCachePolicy(threadId), [threadId]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function subtleCrypto() {
  return typeof globalThis.crypto !== "undefined" && globalThis.crypto.subtle
    ? globalThis.crypto
    : null;
}

function isCryptoKey(value: unknown): value is CryptoKey {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CryptoKey>;
  return (
    candidate.type === "secret" &&
    candidate.algorithm?.name === "AES-GCM" &&
    Array.isArray(candidate.usages) &&
    candidate.usages.includes("encrypt") &&
    candidate.usages.includes("decrypt")
  );
}

async function getOrCreateKey(ownerId: string): Promise<CryptoKey> {
  if (!CHAT_STORE) throw new Error("Protected chat storage is unavailable.");
  const api = subtleCrypto();
  if (!api) throw new Error("Web Crypto is unavailable in this browser.");

  const pending = keyPromises.get(ownerId);
  if (pending) return pending;

  const promise = (async () => {
    const keyId = `protected-chat-key:${ownerId}`;
    const existing: unknown = await get(keyId, CHAT_STORE);
    if (isCryptoKey(existing)) return existing;

    const key = await api.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
    await set(keyId, key, CHAT_STORE);
    const stored: unknown = await get(keyId, CHAT_STORE);
    if (!isCryptoKey(stored)) {
      throw new Error("Could not persist the protected chat encryption key.");
    }
    return stored;
  })();
  keyPromises.set(ownerId, promise);
  try {
    return await promise;
  } catch (error) {
    keyPromises.delete(ownerId);
    throw error;
  }
}

export async function encryptProtectedChatPayload(
  payload: unknown,
  key: CryptoKey,
  additionalData: string,
): Promise<ProtectedChatEnvelope> {
  const api = subtleCrypto();
  if (!api) throw new Error("Web Crypto is unavailable in this browser.");
  const iv = api.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await api.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: new TextEncoder().encode(additionalData),
      tagLength: 128,
    },
    key,
    plaintext,
  );
  return { version: 1, iv: iv.buffer, ciphertext };
}

export async function decryptProtectedChatPayload<T>(
  envelope: ProtectedChatEnvelope,
  key: CryptoKey,
  additionalData: string,
): Promise<T> {
  if (envelope.version !== 1) throw new Error("Unsupported protected chat cache version.");
  const api = subtleCrypto();
  if (!api) throw new Error("Web Crypto is unavailable in this browser.");
  const plaintext = await api.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(envelope.iv),
      additionalData: new TextEncoder().encode(additionalData),
      tagLength: 128,
    },
    key,
    envelope.ciphertext,
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}

function protectedStorageKey(ownerId: string, threadId: string) {
  return `protected-chat-thread:${ownerId}:${threadId}`;
}

function additionalData(ownerId: string, threadId: string) {
  return `yourworld-chat-cache:v1:${ownerId}:${threadId}`;
}

function localThreadKey(threadId: string) {
  return `${CACHE_PREFIX}thread:${threadId}`;
}

function readLegacyLocalThread(threadId: string): unknown[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(localThreadKey(threadId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v?: unknown };
    return Array.isArray(parsed?.v) ? parsed.v : null;
  } catch {
    return null;
  }
}

function removeLegacyLocalThread(threadId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(localThreadKey(threadId));
  } catch {
    // The encrypted IndexedDB cache remains authoritative.
  }
}

async function readLegacyThread(threadId: string): Promise<unknown[] | null> {
  const localRows = readLegacyLocalThread(threadId);
  if (localRows) return localRows;
  if (!CHAT_STORE) return null;
  try {
    const rows: unknown = await get(`social:${threadId}`, CHAT_STORE);
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  }
}

async function clearLegacyThread(threadId: string) {
  removeLegacyLocalThread(threadId);
  if (CHAT_STORE) {
    try {
      await del(`social:${threadId}`, CHAT_STORE);
    } catch (error) {
      console.warn("[chat-cache] could not remove the plaintext thread cache", error);
    }
  }
}

export async function loadProtectedThreadCache<T>(
  threadId: string,
  ownerId: string,
): Promise<T[] | null> {
  if (!CHAT_STORE) return null;
  const api = subtleCrypto();
  if (!api) return null;
  try {
    const envelope: unknown = await get(protectedStorageKey(ownerId, threadId), CHAT_STORE);
    if (
      !envelope ||
      typeof envelope !== "object" ||
      (envelope as ProtectedChatEnvelope).version !== 1
    ) {
      return null;
    }
    const key = await getOrCreateKey(ownerId);
    const rows = await decryptProtectedChatPayload<T[]>(
      envelope as ProtectedChatEnvelope,
      key,
      additionalData(ownerId, threadId),
    );
    return Array.isArray(rows) ? rows : null;
  } catch (error) {
    console.warn("[chat-cache] could not decrypt the protected thread cache", error);
    return null;
  }
}

export async function saveProtectedThreadCache(
  threadId: string,
  ownerId: string,
  rows: unknown[],
) {
  if (!CHAT_STORE) return false;
  try {
    const key = await getOrCreateKey(ownerId);
    const envelope = await encryptProtectedChatPayload(
      rows,
      key,
      additionalData(ownerId, threadId),
    );
    await set(protectedStorageKey(ownerId, threadId), envelope, CHAT_STORE);
    return true;
  } catch (error) {
    console.warn("[chat-cache] protected message cache was not persisted", error);
    return false;
  }
}

async function migrateThreadCache(threadId: string, ownerId: string, enabled: boolean) {
  if (!CHAT_STORE) {
    if (enabled) removeLegacyLocalThread(threadId);
    return;
  }

  if (enabled) {
    try {
      const existing = await get(protectedStorageKey(ownerId, threadId), CHAT_STORE);
      if (!existing) {
        const rows = await readLegacyThread(threadId);
        if (rows) await saveProtectedThreadCache(threadId, ownerId, rows);
      }
    } catch (error) {
      console.warn("[chat-cache] legacy thread migration failed", error);
    } finally {
      // Never leave an old unencrypted copy behind when protection is enabled.
      await clearLegacyThread(threadId);
    }
    return;
  }

  try {
    const rows = await loadProtectedThreadCache<unknown>(threadId, ownerId);
    if (rows) {
      await set(`social:${threadId}`, rows, CHAT_STORE);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            localThreadKey(threadId),
            JSON.stringify({ t: Date.now(), v: rows }),
          );
        } catch {
          // IndexedDB retains the cache if localStorage is unavailable.
        }
      }
    }
    await del(protectedStorageKey(ownerId, threadId), CHAT_STORE);
  } catch (error) {
    console.warn("[chat-cache] protected thread migration could not be reversed", error);
  }
}

export function setThreadCacheProtection(
  threadId: string,
  ownerId: string,
  enabled: boolean,
): Promise<void> {
  if (!threadId || !ownerId) return Promise.resolve();
  const target = enabled ? "protected" : "plain";
  const existing = getThreadCachePolicy(threadId);
  const currentMigration = migrationPromises.get(threadId);
  if (existing.ownerId === ownerId && existing.phase === target) return Promise.resolve();
  if (currentMigration?.target === target) return currentMigration.promise;

  const version = (migrationVersions.get(threadId) ?? 0) + 1;
  migrationVersions.set(threadId, version);
  publishPolicy(threadId, { phase: "transition", ownerId });

  const previous = currentMigration?.promise ?? Promise.resolve();
  const promise = previous
    .catch(() => undefined)
    .then(() => migrateThreadCache(threadId, ownerId, enabled))
    .finally(() => {
      if (migrationVersions.get(threadId) === version) {
        publishPolicy(threadId, { phase: target, ownerId });
      }
    });
  migrationPromises.set(threadId, { target, promise });
  return promise;
}