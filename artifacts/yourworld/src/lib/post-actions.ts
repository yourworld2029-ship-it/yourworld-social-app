import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isAuthSessionMissing } from "@/lib/auth-errors";
import { toast } from "sonner";

/**
 * Real post interactions: saves (bookmarks), view counting and deletion.
 * Likes / comments live in social-data.ts.
 */

const viewed = new Set<string>();

/** Count a view once per session per post. */
export async function registerPostView(postId: string) {
  if (viewed.has(postId)) return;
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError) {
    if (isAuthSessionMissing(authError)) return;
    console.error("Unable to authorize post view", authError);
    throw authError;
  }
  const uid = data.user?.id;
  if (!uid) return; // views are only logged for signed-in users
  const { error } = await supabase
    .from("post_views")
    .insert({ post_id: postId, viewer_id: uid });
  if (error) {
    console.error("Unable to register post view", error);
    throw error;
  }
  viewed.add(postId);
}

/** Permanently delete my own post. */
export async function deletePost(postId: string) {
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw error;
}

/** Saved-post bookmarks for the signed-in user, synced with the database. */
export function usePostSaves() {
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const meRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) {
      if (isAuthSessionMissing(authError)) {
        meRef.current = null;
        setSaved({});
        return;
      }
      console.error("Unable to load saved posts", authError);
      toast.error("Couldn't load saved posts.");
      return;
    }
    const me = auth.user?.id ?? null;
    meRef.current = me;
    if (!me) {
      setSaved({});
      return;
    }
    const { data, error } = await supabase
      .from("post_saves")
      .select("post_id")
      .eq("user_id", me);
    if (error) {
      console.error("Unable to load saved posts", error);
      toast.error("Couldn't load saved posts.");
      return;
    }
    const next: Record<string, boolean> = {};
    for (const row of data ?? []) next[row.post_id] = true;
    setSaved(next);
  }, []);

  useEffect(() => {
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => void load());
    const channel = supabase
      .channel(`post-saves:${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_saves" }, () => void load())
      .subscribe();
    return () => {
      sub.subscription.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const toggleSave = useCallback(async (postId: string) => {
    const me = meRef.current;
    if (!me) return false;
    let next = false;
    setSaved((prev) => {
      next = !prev[postId];
      return { ...prev, [postId]: next };
    });
    const { error } = next
      ? await supabase.from("post_saves").upsert(
          { post_id: postId, user_id: me },
          { onConflict: "post_id,user_id", ignoreDuplicates: true },
        )
      : await supabase.from("post_saves").delete().eq("post_id", postId).eq("user_id", me);
    if (error) {
      console.error("Unable to update saved post", error);
      setSaved((prev) => ({ ...prev, [postId]: !next }));
      throw error;
    }
    return next;
  }, []);

  return { saved, toggleSave, reload: load };
}
