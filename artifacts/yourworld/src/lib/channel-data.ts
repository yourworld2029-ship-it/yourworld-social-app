import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveMediaUrl, timeAgo } from "@/lib/social-data";
import { missingColumn, normalizePostRow, postKind } from "@/lib/supabase-compat";

export type ChannelItem = {
  id: string;
  title: string;
  thumb: string;
  views: number;
  likes: number;
  publishedAt: string;
};

export type Subscriber = { id: string; name: string; handle: string; since: string; hue: number };

export type ChannelLiveData = {
  videos: ChannelItem[];
  reels: ChannelItem[];
  posts: ChannelItem[];
  subscribers: Subscriber[];
  stats: { subscribers: number; views30d: number; watchHours: number; posts: number };
  watchTimeError: string | null;
  loading: boolean;
};

export type LoadedChannelData = Omit<ChannelLiveData, "loading">;

const emptyData: ChannelLiveData = {
  videos: [],
  reels: [],
  posts: [],
  subscribers: [],
  stats: { subscribers: 0, views30d: 0, watchHours: 0, posts: 0 },
  watchTimeError: null,
  loading: true,
};

function hueOf(id: string) {
  let hue = 0;
  for (let i = 0; i < id.length; i += 1) hue = (hue * 31 + id.charCodeAt(i)) % 360;
  return hue;
}

/** Loads the signed-in creator's channel data directly from Supabase. */
export async function loadChannelData(
  uid: string,
  client: typeof supabase = supabase,
  watchPeriodDays = 30,
): Promise<LoadedChannelData> {
  const periodStart = new Date(Date.now() - watchPeriodDays * 24 * 60 * 60 * 1000).toISOString();
  const [postsResult, followsResult, countsResult, watchResult] = await Promise.all([
    client
      .from("posts")
      // The live project has older and newer post shapes in use. Selecting the
      // row rather than a guessed column list lets normalization handle both.
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(200),
    client.rpc("list_follows", { _user_id: uid, _kind: "followers", _limit: 500 }),
    client.rpc("get_follow_counts", { ids: [uid] }),
    client.rpc("get_channel_watch_hours", {
      _channel_id: uid,
      _period_start: periodStart,
    }),
  ]);
  let { data: rows, error } = postsResult;
  const { data: followRows } = followsResult;
  const { data: countRows } = countsResult;
  const { data: watchHours, error: watchError } = watchResult;

  if (missingColumn(error) === "kind") {
    const fallback = await client
      .from("posts")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(200);
    rows = fallback.data?.map(normalizePostRow) ?? null;
    error = fallback.error;
  }

  if (error) {
    return {
      videos: [],
      reels: [],
      posts: [],
      subscribers: [],
      stats: { subscribers: 0, views30d: 0, watchHours: 0, posts: 0 },
      watchTimeError: null,
    };
  }

  const postRows = rows ?? [];
  const postIds = postRows.map((row) => row.id);
  let { data: likes, error: likesError } = postIds.length
    ? await client.from("likes" as "post_likes").select("post_id").in("post_id", postIds)
    : { data: [], error: null };
  // Keep fixtures and older deployments readable while using the live likes
  // table first. A missing legacy table is intentionally ignored.
  if (postIds.length && (!likes?.length || likesError)) {
    const legacyLikes = await client
      .from("post_likes")
      .select("post_id")
      .in("post_id", postIds);
    if (!legacyLikes.error && legacyLikes.data?.length) {
      likes = legacyLikes.data;
      likesError = null;
    }
  }
  const likesByPost = new Map<string, number>();
  for (const like of likes ?? []) {
    likesByPost.set(like.post_id, (likesByPost.get(like.post_id) ?? 0) + 1);
  }

  const items = await Promise.all(
    postRows.map(async (row): Promise<ChannelItem> => ({
      id: row.id,
      title: row.title || row.caption || "Untitled",
      thumb: await resolveMediaUrl(
        row.thumbnail_url || row.media_url,
        postKind(row) === "reel" ? "reels" : "videos",
      ),
      views: Number(
        row.views ??
          (row as typeof row & { views_count?: number | null }).views_count ??
          0,
      ),
      likes: likesByPost.get(row.id) ?? 0,
      publishedAt: timeAgo(row.created_at),
    })),
  );

  const followerIds = (followRows ?? []).map((row) => row.id as string).filter(Boolean);
  const { data: profiles } = followerIds.length
    ? await client.rpc("get_public_profiles", { ids: followerIds })
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const subscribers = followerIds.flatMap((id): Subscriber[] => {
    const profile = profileById.get(id);
    if (!profile) return [];
    return [{
      id,
      name: profile.display_name || profile.username || "YourWorld user",
      handle: profile.username || "user",
      since: "Subscriber",
      hue: hueOf(id),
    }];
  });

   const videos = items.filter((_, index) => postKind(postRows[index]) === "video");
   const reels = items.filter((_, index) => postKind(postRows[index]) === "reel");
   const posts = items.filter((_, index) => postKind(postRows[index]) === "post");
  const subscribersCount = Number((countRows ?? [])[0]?.followers ?? subscribers.length);
  const parsedWatchHours =
    typeof watchHours === "number"
      ? watchHours
      : Number((watchHours as { watch_hours?: number } | null)?.watch_hours ?? 0);

  return {
    videos,
    reels,
    posts,
    subscribers,
    stats: {
      subscribers: subscribersCount,
      views30d: postRows.reduce(
        (sum, row) =>
          sum +
          Number(
            row.views ??
              (row as typeof row & { views_count?: number | null }).views_count ??
              0,
          ),
        0,
      ),
      watchHours: Number.isFinite(parsedWatchHours) ? Math.max(0, parsedWatchHours) : 0,
      posts: postRows.length,
    },
    watchTimeError: watchError?.message ?? null,
  };
}

export function useChannelData(watchPeriodDays = 30) {
  const [data, setData] = useState<ChannelLiveData>(emptyData);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setData((current) => ({ ...current, loading: true, watchTimeError: null }));
    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user.id;
    if (requestId !== requestIdRef.current) return;
    if (!uid) {
      setData({ ...emptyData, loading: false });
      return;
    }

    const next = await loadChannelData(uid, supabase, watchPeriodDays);
    if (requestId !== requestIdRef.current) return;
    setData({ ...next, loading: false });
  }, [watchPeriodDays]);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("channel-live-data")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => void load())
       .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "follows" }, () => void load())
      .subscribe();
    const { data: auth } = supabase.auth.onAuthStateChange(() => void load());
    return () => {
      void supabase.removeChannel(channel);
      auth.subscription.unsubscribe();
    };
  }, [load]);

  return data;
}

export const MONETIZATION = { minSubscribers: 1000, minWatchHours: 4000 };

export const formatCount = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`
      : `${n}`;
