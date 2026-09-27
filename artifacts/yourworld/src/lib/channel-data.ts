import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveMediaUrl, timeAgo } from "@/lib/social-data";
import { postKind } from "@/lib/supabase-compat";

export type ChannelItem = {
  id: string;
  title: string;
  thumb: string | null;
  mediaUrl: string;
  mediaType: string;
  kind: string;
  views: number;
  likes: number;
  publishedAt: string;
};

export type ChannelLiveData = {
  videos: ChannelItem[];
  stats: {
    subscribers: number;
    videoViews: number;
    watchHours: number;
    publishedVideos: number;
  };
  watchTimeError: string | null;
  loading: boolean;
};

export type LoadedChannelData = Omit<ChannelLiveData, "loading">;

const emptyData: ChannelLiveData = {
  videos: [],
  stats: { subscribers: 0, videoViews: 0, watchHours: 0, publishedVideos: 0 },
  watchTimeError: null,
  loading: true,
};

function postViewCount(row: Record<string, unknown>) {
  const views = Number(row.views ?? row.views_count ?? 0);
  return Number.isFinite(views) ? Math.max(0, views) : 0;
}

function isAnalyticsVideo(row: Record<string, unknown>) {
  const explicitKind = row.kind ?? row.type;
  if (typeof explicitKind === "string" && explicitKind.trim()) {
    return explicitKind.trim().toLowerCase() === "video";
  }
  return postKind(row) === "video";
}

/** Loads the signed-in creator's channel data directly from Supabase. */
export async function loadChannelData(
  uid: string,
  client: typeof supabase = supabase,
  watchPeriodDays: number | "lifetime" = 30,
): Promise<LoadedChannelData> {
  const periodStart =
    watchPeriodDays === "lifetime"
      ? new Date(0).toISOString()
      : new Date(Date.now() - watchPeriodDays * 24 * 60 * 60 * 1000).toISOString();
  const [postsResult, countsResult, watchResult] = await Promise.all([
    client
      .from("posts")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(1000),
    client.rpc("get_follow_counts", { ids: [uid] }),
    client.rpc("get_channel_watch_hours", {
      _channel_id: uid,
      _period_start: periodStart,
    }),
  ]);
  const { data: rows, error } = postsResult;
  const { data: countRows } = countsResult;
  const { data: watchHours, error: watchError } = watchResult;

  if (error) {
    return {
      videos: [],
      stats: { subscribers: 0, videoViews: 0, watchHours: 0, publishedVideos: 0 },
      watchTimeError: watchError?.message ?? null,
    };
  }

  const postRows = rows ?? [];
  const videoRows = postRows.filter((row) =>
    isAnalyticsVideo(row as unknown as Record<string, unknown>),
  );
  const subscribersCount = Number((countRows ?? [])[0]?.followers ?? 0);
  const parsedWatchHours =
    typeof watchHours === "number"
      ? watchHours
      : Number((watchHours as { watch_hours?: number } | null)?.watch_hours ?? watchHours ?? 0);
  const videoViews = videoRows.reduce(
    (sum, row) => sum + postViewCount(row as unknown as Record<string, unknown>),
    0,
  );
  const topVideoRows = [...videoRows]
    .sort(
      (a, b) =>
        postViewCount(b as unknown as Record<string, unknown>) -
        postViewCount(a as unknown as Record<string, unknown>),
    )
    .slice(0, 4);
  const videos = await Promise.all(
    topVideoRows.map(async (row): Promise<ChannelItem> => {
      const mediaPath = typeof row.media_url === "string" ? row.media_url : "";
      const thumbnailPath = typeof row.thumbnail_url === "string" ? row.thumbnail_url : null;
      const [mediaUrl, thumb] = await Promise.all([
        resolveMediaUrl(mediaPath, "videos"),
        thumbnailPath ? resolveMediaUrl(thumbnailPath, "videos") : Promise.resolve(null),
      ]);
      const record = row as unknown as Record<string, unknown>;
      return {
        id: String(row.id),
        title: String(row.title || row.caption || "Untitled"),
        thumb,
        mediaUrl,
        mediaType: String(row.media_type ?? "video"),
        kind: "video",
        views: postViewCount(record),
        likes: 0,
        publishedAt: timeAgo(String(row.created_at ?? "")),
      };
    }),
  );

  return {
    videos,
    stats: {
      subscribers: subscribersCount,
      videoViews,
      watchHours: Number.isFinite(parsedWatchHours) ? Math.max(0, parsedWatchHours) : 0,
      publishedVideos: videoRows.length,
    },
    watchTimeError: watchError?.message ?? null,
  };
}

type VideoPurchaseRow = { creator_share?: number | string | null; status?: string | null };
type VideoPurchaseResult = {
  data: VideoPurchaseRow[] | null;
  error: { message: string } | null;
};
type VideoPurchaseQuery = {
  eq: (column: string, value: string) => VideoPurchaseQuery;
  then: (resolve: (result: VideoPurchaseResult) => void) => unknown;
};

/** Reads paid purchase shares for one creator-owned video under existing RLS. */
export async function loadVideoPurchaseEarnings(
  videoId: string,
  client: typeof supabase = supabase,
) {
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw new Error(sessionError.message);
  const creatorId = sessionData.session?.user.id;
  if (!creatorId) return 0;

  const purchasesClient = client as unknown as {
    from: (table: "video_purchases") => {
      select: (columns: string) => VideoPurchaseQuery;
    };
  };
  const result = await new Promise<VideoPurchaseResult>((resolve) => {
    purchasesClient
      .from("video_purchases")
      .select("creator_share,status")
      .eq("creator_id", creatorId)
      .eq("video_id", videoId)
      .eq("status", "paid")
      .then(resolve);
  });
  if (result.error) throw new Error(result.error.message);
  return (result.data ?? []).reduce(
    (sum, row) => (row.status === "paid" ? sum + Number(row.creator_share ?? 0) : sum),
    0,
  );
}

export function useChannelData(watchPeriodDays: number | "lifetime" = 30) {
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
      .on("postgres_changes", { event: "*", schema: "public", table: "follows" }, () => void load())
      .subscribe();
    const { data: auth } = supabase.auth.onAuthStateChange(() => void load());
    const refreshInterval = window.setInterval(() => void load(), 30_000);
    const onFocus = () => {
      if (document.visibilityState === "visible") void load();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", onFocus);
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
