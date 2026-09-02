import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveMediaUrl, timeAgo } from "@/lib/social-data";

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
  loading: boolean;
};

const emptyData: ChannelLiveData = {
  videos: [],
  reels: [],
  posts: [],
  subscribers: [],
  stats: { subscribers: 0, views30d: 0, watchHours: 0, posts: 0 },
  loading: true,
};

function hueOf(id: string) {
  let hue = 0;
  for (let i = 0; i < id.length; i += 1) hue = (hue * 31 + id.charCodeAt(i)) % 360;
  return hue;
}

export function useChannelData() {
  const [data, setData] = useState<ChannelLiveData>(emptyData);

  const load = useCallback(async () => {
    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user.id;
    if (!uid) {
      setData({ ...emptyData, loading: false });
      return;
    }

    const [{ data: rows, error }, { data: followRows }, { data: countRows }] = await Promise.all([
      supabase
        .from("posts")
        .select("id,kind,title,caption,media_url,thumbnail_url,views,created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.rpc("list_follows", { _user_id: uid, _kind: "followers", _limit: 500 }),
      supabase.rpc("get_follow_counts", { ids: [uid] }),
    ]);

    if (error) {
      setData({ ...emptyData, loading: false });
      return;
    }

    const postRows = rows ?? [];
    const postIds = postRows.map((row) => row.id);
    const { data: likes } = postIds.length
      ? await supabase.from("post_likes").select("post_id").in("post_id", postIds)
      : { data: [] };
    const likesByPost = new Map<string, number>();
    for (const like of likes ?? []) {
      likesByPost.set(like.post_id, (likesByPost.get(like.post_id) ?? 0) + 1);
    }

    const items = await Promise.all(
      postRows.map(async (row): Promise<ChannelItem> => ({
        id: row.id,
        title: row.title || row.caption || "Untitled",
        thumb: await resolveMediaUrl(row.thumbnail_url || row.media_url, "reels"),
        views: Number(row.views ?? 0),
        likes: likesByPost.get(row.id) ?? 0,
        publishedAt: timeAgo(row.created_at),
      })),
    );

    const followerIds = (followRows ?? []).map((row) => row.id as string).filter(Boolean);
    const { data: profiles } = followerIds.length
      ? await supabase.rpc("get_public_profiles", { ids: followerIds })
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

    const videos = items.filter((_, index) => postRows[index]?.kind === "video");
    const reels = items.filter((_, index) => postRows[index]?.kind === "reel");
    const posts = items.filter((_, index) => postRows[index]?.kind === "post");
    const subscribersCount = Number((countRows ?? [])[0]?.followers ?? subscribers.length);
    setData({
      videos,
      reels,
      posts,
      subscribers,
      stats: {
        subscribers: subscribersCount,
        views30d: postRows.reduce((sum, row) => sum + Number(row.views ?? 0), 0),
        watchHours: 0,
        posts: postRows.length,
      },
      loading: false,
    });
  }, []);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("channel-live-data")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "post_likes" }, () => void load())
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
