import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isValidSecretCode, verifyPin } from "@/lib/secret-pin";
import { cacheGet, cacheSet } from "@/lib/local-cache";

export { hashPin, isValidSecretCode, randomPinSalt, verifyPin } from "@/lib/secret-pin";

/**
 * Social Chat Secret Lock helpers. Locked conversations disappear from the
 * list/search until the exact Secret Code is typed into the search bar. A successful
 * search code grants one short-lived local unlock so opening that result does
 * not ask for the same PIN twice.
 */

const unlockGrantTtlMs = 60_000;
const unlockGrants = new Map<string, number>();

function lockedPeerCacheKey(ownerId: string) {
  return `secret-chat-peer-ids:${ownerId}`;
}

function readCachedLockedPeerIds(ownerId?: string | null): string[] | null {
  if (!ownerId) return null;
  const value = cacheGet<unknown>(lockedPeerCacheKey(ownerId));
  if (!Array.isArray(value)) return null;
  return [...new Set(value.filter((peerId): peerId is string => typeof peerId === "string" && !!peerId))];
}

function unlockGrantKey(ownerId: string, peerId: string) {
  return `${ownerId}\u0000${peerId}`;
}

export function grantSecretChatUnlock(ownerId: string, peerId: string) {
  if (!ownerId || !peerId) return;
  const now = Date.now();
  for (const [key, expiresAt] of unlockGrants) {
    if (expiresAt <= now) unlockGrants.delete(key);
  }
  unlockGrants.set(unlockGrantKey(ownerId, peerId), now + unlockGrantTtlMs);
}

export function hasSecretChatUnlock(ownerId?: string | null, peerId?: string | null) {
  if (!ownerId || !peerId) return false;
  const key = unlockGrantKey(ownerId, peerId);
  const expiresAt = unlockGrants.get(key);
  return !!expiresAt && expiresAt > Date.now();
}

export function consumeSecretChatUnlock(ownerId?: string | null, peerId?: string | null) {
  if (!hasSecretChatUnlock(ownerId, peerId)) return false;
  unlockGrants.delete(unlockGrantKey(ownerId!, peerId!));
  return true;
}

export type LockedChat = {
  ownerId: string;
  peerId: string;
  salt: string | null;
  hash: string | null;
};

async function fetchLocked(expectedOwnerId?: string): Promise<LockedChat[]> {
  let me = expectedOwnerId;
  if (!me) {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    me = auth.user?.id;
  }
  if (!me) return [];
  if (expectedOwnerId && expectedOwnerId !== me) return [];

  const { data, error } = await supabase
    .from("conversation_preferences")
    .select("conversation_id,secret_pin_salt,secret_pin_hash,is_locked")
    .eq("user_id", me)
    .eq("is_locked", true);
  if (error) throw error;

  const rows = data ?? [];
  const verifiableRows = rows.filter(
    (row) =>
      typeof row.secret_pin_salt === "string" &&
      row.secret_pin_salt.length > 0 &&
      typeof row.secret_pin_hash === "string" &&
      row.secret_pin_hash.length > 0,
  );
  if (!verifiableRows.length) return [];

  const conversationIds = [...new Set(verifiableRows.map((row) => String(row.conversation_id)))];
  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select("id,participant_one_id,participant_two_id")
    .in("id", conversationIds);
  if (conversationsError) throw conversationsError;

  const peerByConversation = new Map<string, string>();
  for (const conversation of conversations ?? []) {
    const id = String(conversation.id ?? "");
    const first = String(conversation.participant_one_id ?? "");
    const second = String(conversation.participant_two_id ?? "");
    const peerId = first === me ? second : second === me ? first : "";
    if (id && peerId) peerByConversation.set(id, peerId);
  }

  return verifiableRows.flatMap((row) => {
    const peerId = peerByConversation.get(String(row.conversation_id));
    if (!peerId) return [];
    return [{
    ownerId: me,
      peerId,
      salt: row.secret_pin_salt as string,
      hash: row.secret_pin_hash as string,
    }];
  });
}

export async function isSecretChatLockedWith(ownerId: string, peerId: string) {
  if (!ownerId || !peerId) return false;
  const lockedChats = await fetchLocked(ownerId);
  return lockedChats.some((chat) => chat.ownerId === ownerId && chat.peerId === peerId);
}

/**
 * @param query current text in the message search bar — an exact Secret Code match
 *              temporarily reveals the matching locked chat(s).
 */
export function useSecretChats(
  query: string,
  queryRevision = 0,
  ownerId?: string | null,
) {
  const normalizedOwnerId = ownerId ?? null;
  const cachedPeerIds = useMemo(
    () => readCachedLockedPeerIds(normalizedOwnerId),
    [normalizedOwnerId],
  );
  const [lockSnapshot, setLockSnapshot] = useState<{
    ownerId: string | null;
    rows: LockedChat[];
    peerIds: string[];
    ready: boolean;
  }>(() => ({
    ownerId: normalizedOwnerId,
    rows: [],
    peerIds: cachedPeerIds ?? [],
    ready: cachedPeerIds !== null,
  }));
  const [verifiedQuery, setVerifiedQuery] = useState<{
    query: string;
    queryRevision: number;
    peerIds: string[];
  } | null>(null);
  const snapshot =
    lockSnapshot.ownerId === normalizedOwnerId
      ? lockSnapshot
      : {
          ownerId: normalizedOwnerId,
          rows: [],
          peerIds: cachedPeerIds ?? [],
          ready: cachedPeerIds !== null,
        };
  const locked = snapshot.rows;
  const lockedIds = snapshot.peerIds;
  const ready = snapshot.ready;

  useEffect(() => {
    let alive = true;
    if (lockSnapshot.ownerId !== normalizedOwnerId) {
      setLockSnapshot({
        ownerId: normalizedOwnerId,
        rows: [],
        peerIds: cachedPeerIds ?? [],
        ready: cachedPeerIds !== null,
      });
    }
    const refresh = () => {
      void fetchLocked(normalizedOwnerId ?? undefined)
        .then((rows) => {
          if (!alive) return;
          const peerIds = [...new Set(rows.map((row) => row.peerId))];
          if (normalizedOwnerId) cacheSet(lockedPeerCacheKey(normalizedOwnerId), peerIds);
          setLockSnapshot({
            ownerId: normalizedOwnerId,
            rows,
            peerIds,
            ready: true,
          });
        })
        .catch(() => {
          // Keep a previously confirmed, user-scoped cache visible during a
          // transient refresh failure; a cold cache still stays gated.
        });
    };
    refresh();
    // Keep the hidden set fresh when a lock is toggled elsewhere.
    const channel = supabase
      .channel("secret-chats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_preferences" },
        refresh,
      )
      .subscribe();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      alive = false;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      void supabase.removeChannel(channel);
    };
  }, [cachedPeerIds, lockSnapshot.ownerId, normalizedOwnerId]);

  useEffect(() => {
    let alive = true;
    if (!isValidSecretCode(query) || locked.length === 0) {
      setVerifiedQuery(null);
      return;
    }
    setVerifiedQuery((current) =>
      current?.query === query && current.queryRevision === queryRevision ? current : null,
    );
    const verificationTimer = window.setTimeout(() => {
      void Promise.all(
        locked.map(async (row) => {
          if (!row.salt || !row.hash) return null;
          if (await verifyPin(row.salt, query, row.hash)) {
            grantSecretChatUnlock(row.ownerId, row.peerId);
            return row.peerId;
          }
          return null;
        }),
      )
        .then((matches) => {
          if (alive) {
            setVerifiedQuery({
              query,
              queryRevision,
              peerIds: matches.filter((peerId): peerId is string => !!peerId),
            });
          }
        })
        .catch((cause) => {
          if (!alive) return;
          console.error("[secret-chats] PIN verification failed", cause);
          setVerifiedQuery({ query, queryRevision, peerIds: [] });
        });
    }, 120);
    return () => {
      alive = false;
      window.clearTimeout(verificationTimer);
    };
  }, [query, queryRevision, locked]);

  const revealed = useMemo(
    () =>
      verifiedQuery?.query === query &&
      verifiedQuery.queryRevision === queryRevision &&
      isValidSecretCode(query)
        ? verifiedQuery.peerIds
        : [],
    [verifiedQuery, query, queryRevision],
  );
  /** True when this chat must stay out of the list/search results. */
  const isHidden = useCallback(
    (peerId?: string | null) =>
      !!peerId && lockedIds.includes(peerId) && !revealed.includes(peerId),
    [lockedIds, revealed],
  );

  return {
    lockedIds,
    revealed,
    isHidden,
    hasReveal: revealed.length > 0,
    ready,
  };
}
