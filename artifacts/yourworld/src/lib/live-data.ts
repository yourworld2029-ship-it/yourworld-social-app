import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type LiveStreamRecord = {
  id: string;
  broadcaster_id: string;
  title: string;
  status: "live" | "ended";
  started_at: string;
  ended_at: string | null;
  peak_viewers: number;
};

type LiveStreamDatabaseRow = Omit<LiveStreamRecord, "peak_viewers"> & {
  peak_viewer_count: number;
};

export type LiveProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export type ActiveLiveStream = LiveStreamRecord & {
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type LiveCommentRow = {
  id: string;
  stream_id: string;
  user_id: string;
  message: string;
  created_at: string;
};

const LIVE_STREAM_COLUMNS =
  "id,broadcaster_id,title,status,started_at,ended_at,peak_viewer_count";

function normalizeLiveStream(row: LiveStreamDatabaseRow): LiveStreamRecord {
  const { peak_viewer_count, ...stream } = row;
  return { ...stream, peak_viewers: Number(peak_viewer_count ?? 0) };
}

export async function getPublicLiveProfiles(userIds: string[]) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map<string, LiveProfile>();

  const { data, error } = await supabase.rpc("get_public_profiles", {
    ids: uniqueIds,
  });
  if (error) throw error;

  return new Map(
    ((data ?? []) as LiveProfile[]).map((profile) => [profile.id, profile]),
  );
}

export async function loadLiveStream(streamId: string) {
  const { data, error } = await supabase
    .from("live_streams")
    .select(LIVE_STREAM_COLUMNS)
    .eq("id", streamId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = normalizeLiveStream(data as unknown as LiveStreamDatabaseRow);
  const profiles = await getPublicLiveProfiles([row.broadcaster_id]);
  const profile = profiles.get(row.broadcaster_id);

  return {
    ...row,
    username: profile?.username || "user",
    displayName: profile?.display_name || profile?.username || "YourWorld user",
    avatarUrl: profile?.avatar_url ?? null,
  } satisfies ActiveLiveStream;
}

export async function loadActiveLiveStreams(): Promise<ActiveLiveStream[]> {
  const { data, error } = await supabase
    .from("live_streams")
    .select(LIVE_STREAM_COLUMNS)
    .eq("status", "live")
    .order("started_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const streams = ((data ?? []) as unknown as LiveStreamDatabaseRow[]).map(
    normalizeLiveStream,
  );
  const profiles = await getPublicLiveProfiles(
    streams.map((stream) => stream.broadcaster_id),
  );

  return streams.map((stream) => {
    const profile = profiles.get(stream.broadcaster_id);
    return {
      ...stream,
      username: profile?.username || "user",
      displayName:
        profile?.display_name || profile?.username || "YourWorld user",
      avatarUrl: profile?.avatar_url ?? null,
    };
  });
}

function announceLiveIndexChanged() {
  const channel = supabase.channel("live-stream-index", {
    config: { broadcast: { self: false } },
  });
  let timeoutId = 0;
  timeoutId = window.setTimeout(() => {
    void supabase.removeChannel(channel);
  }, 5000);

  channel
    .on("broadcast", { event: "refresh" }, () => {})
    .subscribe((status) => {
      if (status !== "SUBSCRIBED") return;
      void channel
        .send({
          type: "broadcast",
          event: "refresh",
          payload: { sent_at: new Date().toISOString() },
        })
        .catch((cause) => {
          console.warn("[live] Could not notify live-room index", cause);
        })
        .finally(() => {
          window.clearTimeout(timeoutId);
          timeoutId = window.setTimeout(() => {
            void supabase.removeChannel(channel);
          }, 250);
        });
    });
}

export function useActiveLiveStreams() {
  const [streams, setStreams] = useState<ActiveLiveStream[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const next = await loadActiveLiveStreams();
      setStreams(next);
      setError(null);
    } catch (cause) {
      console.error("[live] Could not load active rooms", cause);
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load live broadcasts.",
      );
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const next = await loadActiveLiveStreams();
        if (!alive) return;
        setStreams(next);
        setError(null);
      } catch (cause) {
        if (!alive) return;
        console.error("[live] Could not load active rooms", cause);
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load live broadcasts.",
        );
      }
    };
    void refresh();

    const channel = supabase
      .channel("live-stream-index", { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "refresh" }, () => void refresh())
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void refresh();
      });
    const interval = window.setInterval(() => void refresh(), 20_000);
    const onFocus = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      alive = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      void supabase.removeChannel(channel);
    };
  }, []);

  return { streams, error, reload };
}

export async function startLiveStream(title: string) {
  const { data, error } = await supabase.rpc("start_live_stream", {
    _title: title.trim().slice(0, 100),
  });
  if (error) return { streamId: null, error: error.message };
  const streamId = typeof data === "string" ? data : null;
  if (streamId) announceLiveIndexChanged();
  return { streamId, error: null };
}

export async function endLiveStream(streamId: string) {
  const { data, error } = await supabase.rpc("end_live_stream", {
    _stream_id: streamId,
  });
  if (error) return { summary: null, error: error.message };
  announceLiveIndexChanged();

  const value = data as
    | { duration_seconds?: number; peak_viewers?: number }
    | null;
  return {
    summary: {
      durationSeconds: Math.max(0, Number(value?.duration_seconds ?? 0)),
      peakViewers: Math.max(0, Number(value?.peak_viewers ?? 0)),
    },
    error: null,
  };
}

export async function loadLiveStreamStatus(streamId: string) {
  const { data, error } = await supabase
    .from("live_streams")
    .select("status")
    .eq("id", streamId)
    .maybeSingle();
  if (error) throw error;
  return (data?.status as "live" | "ended" | undefined) ?? null;
}

export async function recordLiveStreamPeak(
  streamId: string,
  peakViewers: number,
) {
  const { error } = await supabase.rpc("record_live_stream_peak", {
    _stream_id: streamId,
    _peak_viewers: Math.max(0, Math.floor(peakViewers)),
  });
  if (error) throw error;
}

export async function createLiveComment(
  streamId: string,
  userId: string,
  message: string,
) {
  const { data, error } = await supabase
    .from("live_comments")
    .insert({
      stream_id: streamId,
      user_id: userId,
      message: message.trim().slice(0, 500),
    })
    .select("id,stream_id,user_id,message,created_at")
    .single();

  if (error) throw error;
  return data as unknown as LiveCommentRow;
}

export async function loadLiveComments(streamId: string) {
  const { data, error } = await supabase
    .from("live_comments")
    .select("id,stream_id,user_id,message,created_at")
    .eq("stream_id", streamId)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) throw error;
  return ((data ?? []) as unknown as LiveCommentRow[]).reverse();
}