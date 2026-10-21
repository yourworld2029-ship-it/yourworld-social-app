import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { mediaApiUrl } from "@/lib/media-api-url";
import { STORAGE_BUCKETS, uploadWithProgress } from "@/lib/storage-upload";
import { writeCompat } from "@/lib/supabase-compat";
import { announcePublishedPost } from "@/lib/published-feed";
import { sourceQualityTierFromDimensions } from "@/lib/video-quality";

const LIVE_REPLAY_RETENTION_DAYS = 10;

export type LiveReplay = {
  id: string;
  stream_id: string;
  broadcaster_id: string;
  title: string;
  media_url: string;
  stream_uid: string | null;
  storage_bucket: "videos" | "live-replays";
  source_path: string;
  poster_url: string | null;
  duration_seconds: number;
  original_width: number;
  original_height: number;
  created_at: string;
  expires_at: string;
  retention_days: number;
};

export async function saveLiveReplay(input: {
  streamId: string;
  broadcasterId: string;
  title: string;
  blob: Blob;
  durationSeconds: number;
  width: number;
  height: number;
  onProgress?: (percent: number) => void;
}) {
  const extension = input.blob.type.toLowerCase().includes("webm") ? "webm" : "mp4";
  const sourcePath = `${input.broadcasterId}/live-replays/${input.streamId}.${extension}`;
  const contentType = input.blob.type || (extension === "webm" ? "video/webm" : "video/mp4");
  let uploaded = await uploadWithProgress(
    STORAGE_BUCKETS.videos,
    sourcePath,
    input.blob,
    contentType,
    (percent) => input.onProgress?.(percent),
    "86400",
    {
      cloudflareStream: true,
      requireSignedURLs: false,
      fallbackToStorage: false,
    },
  ).catch((cause) => ({
    url: null,
    storagePath: null,
    streamUid: null,
    posterUrl: null,
    error: cause instanceof Error ? cause.message : "Cloudflare Stream upload failed.",
  }));

  let storageBucket: LiveReplay["storage_bucket"] = STORAGE_BUCKETS.videos;
  let streamUid: string | null = uploaded.streamUid ?? null;
  if (uploaded.error || !uploaded.url || !uploaded.streamUid || !uploaded.storagePath) {
    const cloudflareError = uploaded.error ?? "Cloudflare Stream returned an incomplete upload.";
    uploaded = await uploadWithProgress(
      STORAGE_BUCKETS.liveReplays,
      sourcePath,
      input.blob,
      contentType,
      (percent) => input.onProgress?.(percent),
      "86400",
    ).catch((cause) => ({
      url: null,
      storagePath: null,
      streamUid: null,
      posterUrl: null,
      error: cause instanceof Error ? cause.message : "Supabase Storage fallback failed.",
    }));
    if (uploaded.error || !uploaded.url || !uploaded.storagePath) {
      throw new Error(
        `Cloudflare replay upload failed (${cloudflareError}); secure storage fallback also failed (${uploaded.error ?? "no playable file was returned"}).`,
      );
    }
    storageBucket = STORAGE_BUCKETS.liveReplays;
    streamUid = null;
    // Cloudflare's source is only temporary when the storage fallback succeeds.
    await supabase.storage.from(STORAGE_BUCKETS.videos).remove([sourcePath]).catch(() => undefined);
  }

  const createdAt = Date.now();
  const row = {
    stream_id: input.streamId,
    broadcaster_id: input.broadcasterId,
    title: input.title.trim().slice(0, 200) || "Live replay",
    media_url: uploaded.url,
    stream_uid: streamUid,
    storage_bucket: storageBucket,
    source_path: uploaded.storagePath,
    poster_url: uploaded.posterUrl ?? null,
    duration_seconds: Math.max(1, Math.round(input.durationSeconds)),
    original_width: Math.max(2, Math.round(input.width)),
    original_height: Math.max(2, Math.round(input.height)),
    retention_days: LIVE_REPLAY_RETENTION_DAYS,
    expires_at: new Date(createdAt + LIVE_REPLAY_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  };
  const { error } = await supabase
    .from("live_replays")
    .upsert(row as never, { onConflict: "stream_id" });
  if (error) {
    throw new Error(
      error.message.includes("live_replays")
        ? "Live replay storage is not ready. Apply the live replay database migration, then retry."
        : error.message,
    );
  }
  return row;
}

export async function loadLiveReplays(broadcasterId: string) {
  const { data, error } = await supabase
    .from("live_replays")
    .select(
      "id,stream_id,broadcaster_id,title,media_url,stream_uid,storage_bucket,source_path,poster_url,duration_seconds,original_width,original_height,created_at,expires_at,retention_days",
    )
    .eq("broadcaster_id", broadcasterId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) {
    if (error.message.includes("live_replays")) {
      throw new Error("Live replay storage is not ready. Apply the live replay database migration.");
    }
    throw error;
  }
  return (data ?? []) as unknown as LiveReplay[];
}

export async function createLiveReplaySourceUrl(replay: LiveReplay) {
  const { data, error } = await supabase.storage
    .from(replay.storage_bucket)
    .createSignedUrl(replay.source_path, 60 * 10);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "The replay source is unavailable.");
  }
  return data.signedUrl;
}

export async function deleteLiveReplay(replayId: string) {
  const { data, error: sessionError } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (sessionError || !token) throw new Error(sessionError?.message ?? "Sign in to manage this replay.");
  const response = await fetch(
    mediaApiUrl(`/api/live/replays/${encodeURIComponent(replayId)}`),
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (response.status === 204) return;
  const body: unknown = await response.json().catch(() => null);
  const message =
    body && typeof body === "object" && "error" in body && typeof body.error === "string"
      ? body.error
      : "The replay could not be deleted.";
  throw new Error(message);
}

export async function reportLiveReplay(input: {
  replay: LiveReplay;
  reporterId: string;
  reason: string;
}) {
  const { error } = await supabase.from("live_replay_reports").insert({
    replay_id: input.replay.id,
    reporter_id: input.reporterId,
    reported_broadcaster_id: input.replay.broadcaster_id,
    reason: input.reason,
  } as never);
  if (error) throw error;
}

export async function makeLiveReplayPermanent(replay: LiveReplay) {
  const postId = crypto.randomUUID();
  const result = await writeCompat(
    (payload) => supabase.from("posts").insert(payload as never),
    {
      id: postId,
      user_id: replay.broadcaster_id,
      kind: "video",
      media_url: replay.media_url,
      cloudflare_stream_uid: replay.stream_uid,
      video_url: `${replay.storage_bucket}/${replay.source_path}`,
      media_type: "video",
      title: replay.title,
      caption: "",
      hashtags: [],
      thumbnail_url: replay.poster_url,
      orientation: replay.original_height >= replay.original_width ? "portrait" : "landscape",
      duration_seconds: replay.duration_seconds,
      original_width: replay.original_width,
      original_height: replay.original_height,
      source_quality_tier: sourceQualityTierFromDimensions(
        replay.original_width,
        replay.original_height,
      ),
      scheduled_at: null,
      allow_download: true,
      video_access: "public",
      price: null,
      is_paid: false,
      paid_promotion: false,
      review_status: "approved",
      review_note: null,
      series_title: null,
      episode_number: null,
      tagged_user_ids: [],
      viewer_user_ids: [],
    },
    { kind: "type", video_access: "audience" },
    ["video_url"],
  );
  if (result.error) throw new Error(result.error.message ?? "The video could not be moved to Videos.");
  const { error } = await supabase
    .from("live_replays")
    .delete()
    .eq("id", replay.id)
    .eq("broadcaster_id", replay.broadcaster_id);
  if (error) {
    await supabase.from("posts").delete().eq("id", postId).eq("user_id", replay.broadcaster_id);
    throw error;
  }
  announcePublishedPost({ id: postId, kind: "video", mediaType: "video" });
}

export async function downloadReplayBlob(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Replay download failed (${response.status}).`);
  const blob = await response.blob();
  if (!blob.size || !blob.type.toLowerCase().startsWith("video/")) {
    throw new Error("The replay download is empty or invalid.");
  }
  return blob;
}

export function isAndroidLiveReplayGallery() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}
