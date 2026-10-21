import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { mediaApiUrl } from "@/lib/media-api-url";
import { STORAGE_BUCKETS, uploadWithProgress } from "@/lib/storage-upload";
import { writeCompat } from "@/lib/supabase-compat";
import { sourceQualityTierFromDimensions } from "@/lib/video-quality";
import { createLiveReplayPoster } from "@/lib/live-replay-thumbnail";

export type LiveReplay = {
  id: string;
  stream_id: string;
  post_id: string | null;
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
  expires_at: string | null;
  retention_days: number | null;
};

async function createStandardLiveVideoPost(replay: LiveReplay) {
  const postId = replay.post_id ?? replay.stream_id;
  const videoSourcePath = `${replay.storage_bucket}/${replay.source_path}`;
  const postPayload = {
    kind: "video",
    media_url: replay.media_url,
    cloudflare_stream_uid: replay.stream_uid,
    video_url: videoSourcePath,
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
  };
  const aliases = { kind: "type", video_access: "audience" };
  const result = await writeCompat(
    (payload) => supabase.from("posts").insert(payload as never),
    {
      id: postId,
      user_id: replay.broadcaster_id,
      ...postPayload,
    },
    aliases,
    ["video_url"],
  );

  if (result.error) {
    if (result.error.code === "23505") {
      const { data: existing, error: existingError } = await supabase
        .from("posts")
        .select("id,user_id,video_url")
        .eq("id", postId)
        .maybeSingle();
      if (!existingError && existing && existing.user_id === replay.broadcaster_id) {
        const repaired = await writeCompat(
          (payload) =>
            supabase
              .from("posts")
              .update(payload as never)
              .eq("id", postId)
              .eq("user_id", replay.broadcaster_id),
          postPayload,
          aliases,
          ["video_url"],
        );
        if (!repaired.error) return postId;
        throw repaired.error;
      }
    }
    const errorMessage = result.error.message ?? "";
    throw new Error(
      errorMessage.includes("video_url")
        ? "Your video source path could not be saved, so the replay was not published."
        : errorMessage || "The live replay could not be published as a video.",
    );
  }

  return postId;
}

async function linkReplayToStandardVideo(replay: LiveReplay) {
  const postId = replay.post_id ?? replay.stream_id;
  await createStandardLiveVideoPost(replay);
  const { data, error } = await supabase
    .from("live_replays")
    .update({ post_id: postId, expires_at: null, retention_days: null } as never)
    .eq("id", replay.id)
    .eq("broadcaster_id", replay.broadcaster_id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("The replay was uploaded but could not be linked to your profile.");
  return postId;
}

async function persistReplayPoster(replay: LiveReplay, posterBlob: Blob): Promise<LiveReplay> {
  const posterPath = `${replay.broadcaster_id}/live-replays/${replay.stream_id}-poster.jpg`;
  const upload = await uploadWithProgress(
    replay.storage_bucket,
    posterPath,
    posterBlob,
    "image/jpeg",
    undefined,
    "31536000",
  ).catch((cause) => ({
    url: null,
    storagePath: null,
    error: cause instanceof Error ? cause.message : "Poster upload failed.",
  }));
  if (upload.error || !upload.url) {
    console.warn("[live-replay] Could not save the captured thumbnail", upload.error);
    return replay;
  }

  const { error } = await supabase
    .from("live_replays")
    .update({ poster_url: upload.url } as never)
    .eq("id", replay.id)
    .eq("broadcaster_id", replay.broadcaster_id);
  if (error) {
    console.warn("[live-replay] Could not link the captured thumbnail", error);
    return replay;
  }
  if (replay.post_id) {
    const { error: postError } = await supabase
      .from("posts")
      .update({ thumbnail_url: upload.url } as never)
      .eq("id", replay.post_id)
      .eq("user_id", replay.broadcaster_id);
    if (postError) console.warn("[live-replay] Could not update the video thumbnail", postError);
  }
  return { ...replay, poster_url: upload.url };
}

export async function ensureLiveReplayPoster(replay: LiveReplay) {
  if (replay.poster_url || !replay.source_path || !replay.storage_bucket) return replay;
  const { data, error } = await supabase.storage
    .from(replay.storage_bucket)
    .createSignedUrl(replay.source_path, 60 * 10);
  if (error || !data?.signedUrl) return replay;
  const posterBlob = await createLiveReplayPoster(data.signedUrl);
  if (!posterBlob) return replay;
  return persistReplayPoster(replay, posterBlob);
}

export async function saveLiveReplay(input: {
  streamId: string;
  broadcasterId: string;
  title: string;
  blob: Blob;
  posterBlob?: Blob | null;
  durationSeconds: number;
  width: number;
  height: number;
  onProgress?: (percent: number) => void;
}) {
  const { data: existingRow, error: existingError } = await supabase
    .from("live_replays")
    .select("*")
    .eq("stream_id", input.streamId)
    .eq("broadcaster_id", input.broadcasterId)
    .maybeSingle();
  if (existingError) throw existingError;
  let replay = existingRow as unknown as LiveReplay | null;
  let posterBlob = input.posterBlob ?? null;
  if (!posterBlob && (!replay?.poster_url || !replay)) {
    posterBlob = await createLiveReplayPoster(input.blob);
  }

  if (replay && (!replay.source_path || !replay.storage_bucket)) {
    throw new Error("The saved replay is missing its storage path. The original recording is still available to retry.");
  }
  if (replay && !replay.media_url) {
    const { data: signed, error: signError } = await supabase.storage
      .from(replay.storage_bucket)
      .createSignedUrl(replay.source_path, 60 * 60 * 24 * 365);
    if (signError || !signed?.signedUrl) {
      throw new Error("The saved replay source could not be restored. Please retry the upload.");
    }
    const { data: repaired, error: repairError } = await supabase
      .from("live_replays")
      .update({ media_url: signed.signedUrl } as never)
      .eq("id", replay.id)
      .eq("broadcaster_id", replay.broadcaster_id)
      .select("*")
      .maybeSingle();
    if (repairError || !repaired) {
      throw repairError ?? new Error("The replay source URL could not be saved.");
    }
    replay = repaired as unknown as LiveReplay;
  }

  if (!replay) {
    const extension = input.blob.type.toLowerCase().includes("webm") ? "webm" : "mp4";
    const sourcePath = `${input.broadcasterId}/live-replays/${input.streamId}.${extension}`;
    const contentType =
      input.blob.type || (extension === "webm" ? "video/webm" : "video/mp4");
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
      await supabase.storage.from(STORAGE_BUCKETS.videos).remove([sourcePath]).catch(() => undefined);
    }

    const row = {
      stream_id: input.streamId,
      post_id: null,
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
      retention_days: null,
      expires_at: null,
    };
    const { data: savedRow, error: saveError } = await supabase
      .from("live_replays")
      .upsert(row as never, { onConflict: "stream_id" })
      .select("*")
      .maybeSingle();
    if (saveError) {
      throw new Error(
        saveError.message.includes("live_replays")
          ? "Live replay storage is not ready. Apply the live replay database migration, then retry."
          : saveError.message,
      );
    }
    if (!savedRow) throw new Error("The replay upload finished, but its record could not be saved.");
    replay = savedRow as unknown as LiveReplay;
  }

  if (posterBlob && !replay.poster_url) replay = await persistReplayPoster(replay, posterBlob);
  const postId = await linkReplayToStandardVideo(replay);
  return { ...replay, post_id: postId, expires_at: null, retention_days: null };
}

export async function loadLiveReplays(broadcasterId: string) {
  const { data, error } = await supabase
    .from("live_replays")
    .select("*")
    .eq("broadcaster_id", broadcasterId)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
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
  await linkReplayToStandardVideo(replay);
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
