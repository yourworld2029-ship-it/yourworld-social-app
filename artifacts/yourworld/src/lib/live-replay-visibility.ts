import { supabase } from "@/integrations/supabase/client";
import { excludeIdsFromLiveReplayPosts } from "@/lib/live-replay-visibility.utils";

export async function getLiveReplayPostIds(postIds: readonly string[]) {
  const ids = [...new Set(postIds.filter(Boolean))];
  if (ids.length === 0) return new Set<string>();

  const { data, error } = await supabase
    .from("live_replays")
    .select("post_id")
    .in("post_id", ids);
  if (error) throw error;

  return new Set(
    (data ?? [])
      .map((row) => row.post_id)
      .filter((postId): postId is string => typeof postId === "string" && postId.length > 0),
  );
}

export async function excludeLiveReplayPosts<T extends { id: string }>(posts: T[]) {
  if (posts.length === 0) return posts;
  const livePostIds = await getLiveReplayPostIds(posts.map((post) => post.id));
  return excludeIdsFromLiveReplayPosts(posts, livePostIds);
}
