import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SEEN_KEY = "yw_alerts_seen_at";
const liveDb = supabase as unknown as {
  from: (table: "likes" | "comments" | "posts") => ReturnType<typeof supabase.from>;
};

/** Timestamp of the last time the user opened the notifications screen. */
export function markAlertsSeen() {
  try {
    localStorage.setItem(SEEN_KEY, new Date().toISOString());
  } catch {
    /* storage unavailable */
  }
}

function seenAt() {
  if (typeof window === "undefined") return new Date(0).toISOString();
  try {
    return localStorage.getItem(SEEN_KEY) ?? new Date(0).toISOString();
  } catch {
    return new Date(0).toISOString();
  }
}

/**
 * Unread likes and comments on the signed-in user's posts since the last time
 * they opened the notifications screen.
 */
export function useAlertsCount() {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setCount(0);
      return;
    }
    const since = seenAt();

    const { data: myPosts } = await liveDb.from("posts").select("id").eq("user_id", uid);
    const ids = ((myPosts ?? []) as { id: string }[]).map((p) => p.id);

    const [likes, comments] = await Promise.all([
      ids.length
        ? liveDb
            .from("likes")
            .select("post_id", { count: "exact", head: true })
            .in("post_id", ids)
            .neq("user_id", uid)
            .gt("created_at", since)
        : Promise.resolve({ count: 0 }),
      ids.length
        ? liveDb
            .from("comments")
            .select("post_id", { count: "exact", head: true })
            .in("post_id", ids)
            .neq("user_id", uid)
            .gt("created_at", since)
        : Promise.resolve({ count: 0 }),
    ]);

    setCount((likes.count ?? 0) + (comments.count ?? 0));
  }, []);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("alerts-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  return { count, reload: load };
}
