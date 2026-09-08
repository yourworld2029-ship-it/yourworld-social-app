import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FollowCounts = {
  followers: number | null;
  following: number | null;
  unavailable: boolean;
  error: string | null;
};

export type FollowUser = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isRealUserId = (id: string) => UUID.test(id);

const EMPTY_COUNTS: FollowCounts = {
  followers: null,
  following: null,
  unavailable: false,
  error: null,
};

/** Ids the signed-in user currently follows. */
export async function fetchMyFollowing(): Promise<string[]> {
  const { data: session } = await supabase.auth.getSession();
  const uid = session.session?.user.id;
  if (!uid) return [];
  const { data, error } = await (supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => PromiseLike<{
          data: Array<{ following_id: string }> | null;
          error: { message: string } | null;
        }>;
      };
    };
  }).from("follows").select("following_id").eq("follower_id", uid);
  if (error) throw error;
  return (data ?? []).map((row) => row.following_id);
}

/** Read whether the current user (or an explicitly supplied user) follows a target. */
export async function fetchIsFollowing(targetId: string, followerId?: string | null): Promise<boolean> {
  const { data: s } = await supabase.auth.getSession();
  const uid = followerId ?? s.session?.user.id;
  if (!uid || !isRealUserId(targetId) || uid === targetId) return false;

  const { data, error } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", uid)
    .eq("following_id", targetId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

/** Follow / unfollow a real user with an idempotent row mutation. */
export async function setFollow(targetId: string, on: boolean) {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) throw new Error("Sign in to follow people");
  if (uid === targetId) throw new Error("You can't follow yourself");
  if (!isRealUserId(targetId)) throw new Error("Invalid user");

  const { data: existing, error: lookupError } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", uid)
    .eq("following_id", targetId)
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (on && !existing) {
    const { error } = await supabase.from("follows").insert({
      follower_id: uid,
      following_id: targetId,
    });
    if (error && error.code !== "23505") throw error;
  } else if (!on && existing) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", uid)
      .eq("following_id", targetId);
    if (error) throw error;
  }

  // Counts are derived from the source-of-truth rows. A count refresh failure
  // must not report a successful follow mutation as failed.
  let followers = 0;
  let following_count = 0;
  try {
    const { data: rows, error } = await (supabase as unknown as {
      rpc: (name: string, args: { ids: string[] }) => PromiseLike<{
        data: Array<{ id: string; followers: number; following: number }> | null;
        error: { message: string } | null;
      }>;
    }).rpc("get_follow_counts", { ids: [targetId, uid] });
    if (!error) {
      followers = Number(rows?.find((row) => row.id === targetId)?.followers ?? 0);
      following_count = Number(rows?.find((row) => row.id === uid)?.following ?? 0);
    }
  } catch {
    // The row mutation already succeeded; realtime/count hooks will retry.
  }

  return { following: on, followers, following_count };
}

/** Live follower / following counts for a user, kept fresh via realtime. */
export function useFollowCounts(userId: string | null) {
  const [data, setData] = useState<FollowCounts>(EMPTY_COUNTS);

  const reload = useCallback(async () => {
    if (!userId || !isRealUserId(userId)) {
      setData({ ...EMPTY_COUNTS, unavailable: Boolean(userId), error: userId ? "Invalid user id" : null });
      return;
    }
    setData({
      followers: null,
      following: null,
      unavailable: false,
      error: null,
    });
    const { data: rows, error } = await (supabase as unknown as {
      rpc: (name: string, args: { ids: string[] }) => PromiseLike<{
        data: Array<{ id: string; followers: number; following: number }> | null;
        error: { message: string } | null;
      }>;
    }).rpc("get_follow_counts", { ids: [userId] });
    if (error) {
      setData({ followers: null, following: null, unavailable: false, error: error.message });
      return;
    }
    const row = rows?.[0];
    setData({
      followers: Number(row?.followers ?? 0),
      following: Number(row?.following ?? 0),
      unavailable: false,
      error: null,
    });
  }, [userId]);

  useEffect(() => {
    void reload();
    const channel = supabase
      .channel(`follow-counts-${userId ?? "none"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "follows" }, () => void reload())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, reload]);

  return { ...data, reload };
}

/** People who follow `userId`, or people `userId` follows. */
export function useFollowList(userId: string | null, kind: "followers" | "following", open: boolean) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId || !isRealUserId(userId)) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      const { data: rows, error: rowsError } = await (supabase as unknown as {
        rpc: (name: string, args: { _user_id: string; _kind: string; _limit: number }) => PromiseLike<{
          data: Array<{ id: string }> | null;
          error: { message: string } | null;
        }>;
      }).rpc("list_follows", { _user_id: userId, _kind: kind, _limit: 500 });
      if (rowsError) throw rowsError;
      const ids = (rows ?? []).map((row) => row.id);
      if (!ids.length) {
        if (!cancelled) {
          setUsers([]);
          setLoading(false);
        }
        return;
      }
      const { data: profiles, error: profileError } = await supabase.rpc("get_public_profiles", { ids });
      if (profileError) throw profileError;
      const next = ((profiles ?? []) as Array<{
        id: string;
        username?: string | null;
        display_name?: string | null;
        avatar_url?: string | null;
      }>).map((profile) => ({
        id: profile.id,
        username: profile.username ?? "user",
        display_name: profile.display_name ?? profile.username ?? "YourWorld user",
        avatar_url: profile.avatar_url ?? null,
      }));
      if (!cancelled) {
        setUsers(next);
        setLoading(false);
      }
    })().catch((cause: unknown) => {
      if (!cancelled) {
        setUsers([]);
        setLoading(false);
        setError(cause instanceof Error ? cause.message : "Couldn't load follows");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId, kind, open]);

  return { users, loading, error };
}
