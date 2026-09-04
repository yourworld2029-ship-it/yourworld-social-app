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

/** Follow / unfollow a real user. Throws when signed out or on a DB error. */
export async function setFollow(targetId: string, on: boolean) {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) throw new Error("Sign in to follow people");
  if (uid === targetId) throw new Error("You can't follow yourself");
  const { data, error } = await (supabase as unknown as {
    rpc: (
      name: string,
      args: { _following_id: string; _on: boolean },
    ) => PromiseLike<{
      data: Array<{ following: boolean; followers: number; following_count: number }> | null;
      error: { message: string } | null;
    }>;
  }).rpc("set_follow", { _following_id: targetId, _on: on });
  if (error) throw error;
  return data?.[0] ?? { following: on, followers: 0, following_count: 0 };
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
