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
export const FOLLOW_UNAVAILABLE_MESSAGE = "Following is not available yet.";

/** Ids the signed-in user currently follows. */
export async function fetchMyFollowing(): Promise<string[]> {
  throw new Error(FOLLOW_UNAVAILABLE_MESSAGE);
}

/** Follow / unfollow a real user. Throws when signed out or on a DB error. */
export async function setFollow(targetId: string, on: boolean) {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) throw new Error("Sign in to follow people");
  if (uid === targetId) throw new Error("You can't follow yourself");
  void on;
  throw new Error(FOLLOW_UNAVAILABLE_MESSAGE);
}

/** Live follower / following counts for a user, kept fresh via realtime. */
export function useFollowCounts(userId: string | null) {
  const unavailable: FollowCounts = {
    followers: null,
    following: null,
    unavailable: true,
    error: userId ? FOLLOW_UNAVAILABLE_MESSAGE : null,
  };
  const [data, setData] = useState<FollowCounts>(unavailable);

  const reload = useCallback(async () => {
    setData({
      followers: null,
      following: null,
      unavailable: true,
      error: userId ? FOLLOW_UNAVAILABLE_MESSAGE : null,
    });
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [userId, reload]);

  return { ...data, reload };
}

/** People who follow `userId`, or people `userId` follows. */
export function useFollowList(userId: string | null, kind: "followers" | "following", open: boolean) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void userId;
    void kind;
    setUsers([]);
    setLoading(false);
    setError(FOLLOW_UNAVAILABLE_MESSAGE);
  }, [userId, kind, open]);

  return { users, loading, error };
}
