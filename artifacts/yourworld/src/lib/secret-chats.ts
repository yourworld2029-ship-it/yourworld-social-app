import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { verifyPin } from "@/lib/secret-pin";

export { hashPin, randomPinSalt, verifyPin } from "@/lib/secret-pin";

/**
 * Shared Secret Chat Lock helpers used by both Social and Orbit message lists.
 * Locked conversations disappear from the list/search until the exact PIN is
 * typed into the search bar. A successful search PIN grants one short-lived,
 * local unlock so opening that result does not ask for the same PIN twice.
 */

const unlockGrantTtlMs = 60_000;
const unlockGrants = new Map<string, number>();

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

function createVerificationFetch(apiKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // Match the main client: newer publishable keys belong in apikey, not Bearer auth.
    if (
      (apiKey.startsWith("sb_publishable_") || apiKey.startsWith("sb_secret_")) &&
      headers.get("Authorization") === `Bearer ${apiKey}`
    ) {
      headers.delete("Authorization");
    }
    headers.set("apikey", apiKey);
    return fetch(input, { ...init, headers });
  };
}

export type AccountPasswordVerification =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Verify password recovery in an isolated, non-persistent Supabase client so
 * checking a password cannot replace or broadcast the app's active session.
 */
export async function verifyAccountPassword(
  expectedUserId: string,
  password: string,
): Promise<AccountPasswordVerification> {
  if (!password) return { ok: false, error: "Enter your account password." };

  const { data: auth, error: authError } = await supabase.auth.getUser();
  const user = auth.user;
  if (authError || !user || user.id !== expectedUserId) {
    return { ok: false, error: "Could not verify this account. Sign in again and retry." };
  }
  if (!user.email) {
    return { ok: false, error: "This account does not have password sign-in enabled." };
  }

  // These normalized client values are protected in Supabase's public typings,
  // but are available on the runtime client for this isolated verifier.
  const { supabaseUrl: apiUrl, supabaseKey: apiKey } = supabase as unknown as {
    supabaseUrl: string;
    supabaseKey: string;
  };
  if (!apiUrl || !apiKey) {
    return { ok: false, error: "Account verification is unavailable. Try again." };
  }

  const verifier = createClient(apiUrl, apiKey, {
    global: { fetch: createVerificationFetch(apiKey) },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  try {
    const { data, error } = await verifier.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (error) {
      const invalidPassword =
        error.code === "invalid_credentials" ||
        error.message.toLowerCase().includes("invalid login credentials");
      return {
        ok: false,
        error: invalidPassword
          ? "Account password is incorrect."
          : "Could not verify your account password. Try again.",
      };
    }
    if (data.user?.id !== expectedUserId) {
      return { ok: false, error: "The password did not verify this signed-in account." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not verify your account password. Try again." };
  } finally {
    try {
      await verifier.auth.signOut({ scope: "local" });
    } catch {
      // The verifier is isolated and non-persistent; cleanup failure is harmless.
    }
  }
}

/** Persist only this user's lock fields for one peer, atomically. */
export async function saveSecretChatLock(
  peerId: string,
  enabled: boolean,
  salt: string | null,
  hash: string | null,
) {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (authError || !userId) throw authError ?? new Error("Not signed in");

  const { error } = await supabase.from("orbit_chat_settings").upsert(
    {
      user_id: userId,
      peer_id: peerId,
      secret_lock_enabled: enabled,
      secret_pin_salt: salt,
      secret_pin_hash: hash,
    } as never,
    { onConflict: "user_id,peer_id" },
  );
  if (error) throw error;
}

export type LockedChat = {
  ownerId: string;
  peerId: string;
  salt: string | null;
  hash: string | null;
};

async function fetchLocked(): Promise<LockedChat[]> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const me = auth.user?.id;
  if (!me) return [];
  const { data, error } = await supabase
    .from("orbit_chat_settings")
    .select("peer_id,secret_pin_salt,secret_pin_hash,secret_lock_enabled")
    .eq("user_id", me)
    .eq("secret_lock_enabled", true);
  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
    ownerId: me,
    peerId: String(r['peer_id']),
    salt: (r['secret_pin_salt'] as string | null) ?? null,
    hash: (r['secret_pin_hash'] as string | null) ?? null,
  }));
}

/**
 * @param query current text in the message search bar — an exact PIN match
 *              temporarily reveals the matching locked chat(s).
 */
export function useSecretChats(query: string) {
  const [locked, setLocked] = useState<LockedChat[]>([]);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      setReady(false);
      void fetchLocked()
        .then((rows) => {
          if (!alive) return;
          setLocked(rows);
          setReady(true);
        })
        .catch(() => {
          // Keep chat lists hidden when lock state cannot be confirmed.
          if (alive) setReady(false);
        });
    };
    refresh();
    // Keep the hidden set fresh when a lock is toggled elsewhere.
    const channel = supabase
      .channel("secret-chats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orbit_chat_settings" },
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
  }, []);

  const pin = query.trim();

  useEffect(() => {
    let alive = true;
    if (!/^\d{4,8}$/.test(pin) || locked.length === 0) {
      setRevealed((prev) => (prev.length ? [] : prev));
      return;
    }
    const verificationTimer = window.setTimeout(() => {
      void Promise.all(
        locked.map(async (row) => {
          if (!row.salt || !row.hash) return null;
          if (await verifyPin(row.salt, pin, row.hash)) {
            grantSecretChatUnlock(row.ownerId, row.peerId);
            return row.peerId;
          }
          return null;
        }),
      )
        .then((matches) => {
          if (alive) setRevealed(matches.filter((peerId): peerId is string => !!peerId));
        })
        .catch((cause) => {
          if (!alive) return;
          console.error("[secret-chats] PIN verification failed", cause);
          setRevealed([]);
        });
    }, 120);
    return () => {
      alive = false;
      window.clearTimeout(verificationTimer);
    };
  }, [pin, locked]);

  const lockedIds = useMemo(() => locked.map((l) => l.peerId), [locked]);

  /** True when this chat must stay out of the list/search results. */
  const isHidden = useCallback(
    (peerId?: string | null) =>
      !!peerId && lockedIds.includes(peerId) && !revealed.includes(peerId),
    [lockedIds, revealed],
  );

  return { lockedIds, revealed, isHidden, hasReveal: revealed.length > 0, ready };
}
