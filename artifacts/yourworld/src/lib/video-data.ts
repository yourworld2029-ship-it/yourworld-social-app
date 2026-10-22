import { useCallback, useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  announcePostDeletedFromRealtime,
  isPostDeleted,
  removeDeletedPostFromQueryCaches,
  subscribeToPostDeleted,
} from "@/lib/post-deletion";
import {
  announcePublishedPost,
  PUBLISHED_POST_EVENT,
  prependUniqueFeedItem,
  readPublishedPostEvent,
} from "@/lib/published-feed";
import {
  getLocalMedia,
  rememberLocalMedia,
  resolveMediaUrl,
  timeAgo,
  type DbProfile,
} from "@/lib/social-data";
import {
  IMMUTABLE_MEDIA_CACHE_CONTROL,
  STORAGE_BUCKETS,
  uploadWithProgress,
  type ProgressFn,
} from "@/lib/storage-upload";
import { retryLongVideoUploadWithCompression } from "@/lib/long-video-storage-retry";
import { readableUploadError } from "@/lib/storage-upload-request";
import {
  MAX_LONG_VIDEO_INPUT_BYTES,
  MAX_LONG_VIDEO_STORAGE_BYTES,
  compressLongVideoByTier,
  optimizeVideoBlob,
} from "@/lib/video-compression";
import { generateVideoThumbnail, sampleVideoFrames } from "@/lib/video-frames";
import {
  uploadVideoThumbnail,
} from "@/lib/video-thumbnails";
import { scanVideoContent, type ModerationVerdict } from "@/lib/moderation.functions";
import { missingColumn, normalizePostRow, postKind, writeCompat } from "@/lib/supabase-compat";
import { isPublishedLongVideoRow } from "@/lib/long-video-utils";
import { registerUniqueView } from "@/lib/unique-views";
import {
  qualityTierFromDimensions,
  qualityTierFromSourceMetadata,
  sourceQualityTierFromDimensions,
  type VideoQualityTier,
} from "@/lib/video-quality";
import { readVideoDurationSeconds } from "@/lib/video-duration";
import { cloudflareStreamPosterUrl } from "@/lib/cloudflare-stream-media";
import { excludeLiveReplayPosts } from "@/lib/live-replay-visibility";
import {
  VIDEO_FEED_SUPPRESSION_EVENT,
  type VideoFeedSuppressionDetail,
} from "@/lib/video-context-actions";
import {
  LONG_VIDEO_CREATOR_VISIBILITY_EVENT,
  type LongVideoCreatorVisibilityDetail,
} from "@/lib/long-video-preferences";

const liveLikesTable = () => supabase.from("likes");


export const VIDEO_CATEGORIES = [
  "Vlog",
  "Podcast",
  "Tutorial",
  "Tech",
  "Gaming",
  "Music",
  "Travel",
  "Fitness",
  "Comedy",
  "Education",
  "News",
  "Food",
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

export type LongVideo = {
  id: string;
  userId: string;
  title: string;
  caption: string;
  mediaUrl: string;
  thumbnailUrl: string | null;
  cloudflareStreamId?: string | null;
  orientation: "landscape" | "portrait";
  aspectRatio?: string | null;
  videoType?: string | null;
  isReel?: boolean | null;
  postType?: string | null;
  durationSeconds: number | null;
  originalWidth?: number | null;
  originalHeight?: number | null;
  sourceQualityTier?: VideoQualityTier | null;
  views: number;
  hashtags: string[];
  createdAt: string;
  scheduledAt: string | null;
  author: {
    name: string;
    username: string;
    letter: string;
    avatarUrl?: string | null;
  };
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  commentsOff?: boolean;
  access?: "public" | "vip" | "paid";
  price?: number | null;
  seriesTitle?: string | null;
  episodeNumber?: string | null;
};

export const formatDuration = (s: number | null | undefined) => {
  if (s == null || !Number.isFinite(s) || s < 0) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
};

export const formatViews = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K views`
      : `${n} ${n === 1 ? "view" : "views"}`;

export { timeAgo };

/** Start a server-timed session after the player begins authenticated playback. */
export async function startVideoWatchSession(
  postId: string,
  client: typeof supabase = supabase,
): Promise<{ sessionId: string | null; error: string | null }> {
  if (!postId) return { sessionId: null, error: null };
  const { data, error } = await client.rpc("start_video_watch_session", {
    _post_id: postId,
  });
  return { sessionId: data ?? null, error: error?.message ?? null };
}

/** Ask the server to credit only elapsed time observed for this session. */
export async function recordVideoWatchHeartbeat(
  sessionId: string,
  client: typeof supabase = supabase,
): Promise<{ creditedSeconds: number; error: string | null }> {
  if (!sessionId) return { creditedSeconds: 0, error: null };
  const { data, error } = await client.rpc("record_video_watch_heartbeat", {
    _session_id: sessionId,
  });
  return {
    creditedSeconds: typeof data === "number" ? data : 0,
    error: error?.message ?? null,
  };
}

/**
 * Buffers small playback deltas and periodically persists them as one event.
 * A failed write is put back into the buffer so a transient network error does
 * not silently discard watch time.
 */
export function useVideoWatchTime(videoId: string, enabled: boolean) {
  const pendingRef = useRef(0);
  const flushingRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const startingRef = useRef<Promise<string | null> | null>(null);
  const lastActivityAtRef = useRef(0);

  const ensureSession = useCallback(async () => {
    if (!enabled || !videoId) return null;
    if (sessionIdRef.current) return sessionIdRef.current;
    if (startingRef.current) return startingRef.current;

    startingRef.current = startVideoWatchSession(videoId).then((result) => {
      startingRef.current = null;
      sessionIdRef.current = result.error ? null : result.sessionId;
      return sessionIdRef.current;
    });
    return startingRef.current;
  }, [enabled, videoId]);

  const flush = useCallback(async () => {
    if (flushingRef.current || !enabled || !videoId || pendingRef.current < 1) return;
    flushingRef.current = true;
    const sessionId = await ensureSession();
    if (!sessionId) {
      flushingRef.current = false;
      return;
    }

    const playedSeconds = pendingRef.current;
    pendingRef.current = 0;
    const result = await recordVideoWatchHeartbeat(sessionId);
    flushingRef.current = false;
    if (result.error) {
      pendingRef.current += playedSeconds;
      sessionIdRef.current = null;
    }

    if (pendingRef.current >= 10) void flush();
  }, [enabled, ensureSession, videoId]);

  const report = useCallback(
    (seconds: number) => {
      if (!enabled || !Number.isFinite(seconds) || seconds <= 0) return;
      const now = Date.now();
      if (lastActivityAtRef.current && now - lastActivityAtRef.current > 3_000) {
        sessionIdRef.current = null;
        startingRef.current = null;
        pendingRef.current = 0;
      }
      lastActivityAtRef.current = now;
      pendingRef.current += Math.min(seconds, 10);
      if (!sessionIdRef.current) void ensureSession();
      if (pendingRef.current >= 10) void flush();
    },
    [enabled, ensureSession, flush],
  );

  useEffect(() => {
    const flushOnLeave = () => void flush();
    window.addEventListener("pagehide", flushOnLeave);
    document.addEventListener("visibilitychange", flushOnLeave);
    return () => {
      window.removeEventListener("pagehide", flushOnLeave);
      document.removeEventListener("visibilitychange", flushOnLeave);
      void flush();
    };
  }, [flush]);

  return report;
}

/**
 * Long videos are stored with durable signed URLs. Keep those URLs intact:
 * attempting to re-sign them as an anonymous viewer is masked by Supabase as
 * "not found", and a generated public URL cannot read the private bucket.
 */
export async function resolveLongVideoUrl(url: string): Promise<string> {
  if (!url) return url;
  const local = getLocalMedia(url);
  if (local) return local;
  if (/^(blob:|data:)/.test(url)) return url;
  return resolveMediaUrl(url, STORAGE_BUCKETS.videos);
}

async function uploadToStorage(
  source: Blob | string,
  uid: string,
  ext: string,
  fallbackType: string,
  onProgress?: ProgressFn,
  requireSignedURLs = false,
  signal?: AbortSignal,
): Promise<{
  url: string | null;
  storagePath: string | null;
  posterUrl: string | null;
  width: number | null;
  height: number | null;
  streamUid: string | null;
  durationSeconds: number | null;
  error: string | null;
}> {
  let width: number | null = null;
  let height: number | null = null;
  try {
    const blob = typeof source === "string"
      ? await (await fetch(source, { signal })).blob()
      : source;
    if (signal?.aborted) throw new Error("Upload cancelled");
    const uploadBlob = blob.type.startsWith("video/")
      ? await optimizeVideoBlob(blob, (percent, detail) =>
          onProgress?.(Math.round(percent * 0.1), detail),
          (dimensions) => {
            width = dimensions.width;
            height = dimensions.height;
          },
        )
      : blob;
    const outputExt = uploadBlob.type.includes("webm") ? "webm" : ext;
    const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${outputExt}`;
    const {
      url,
      storagePath,
      posterUrl,
      streamUid,
      durationSeconds,
      error,
    } = await uploadWithProgress(
      STORAGE_BUCKETS.videos,
      path,
      uploadBlob,
      uploadBlob.type || fallbackType,
      (percent) => onProgress?.(
        blob.type.startsWith("video/") ? 10 + Math.round(percent * 0.87) : percent,
      ),
      IMMUTABLE_MEDIA_CACHE_CONTROL,
      {
        cloudflareStream: true,
        requireSignedURLs,
        reportByteProgress: true,
        fallbackToStorage: !requireSignedURLs,
        signal,
      },
    );
    return {
      url,
      storagePath,
      posterUrl: posterUrl ?? null,
      width,
      height,
      streamUid: streamUid ?? null,
      durationSeconds: durationSeconds ?? null,
      error:
        error ??
        (!url || !storagePath
          ? "The video upload did not return a playable media URL."
          : null),
    };
  } catch (error) {
    console.error("Video storage upload failed", error);
    return {
      url: null,
      storagePath: null,
      posterUrl: null,
      width,
      height,
      streamUid: null,
      durationSeconds: null,
      error: readableUploadError(error),
    };
  }
}

async function uploadLongVideoWithStorageRetry(
  source: Blob,
  uid: string,
  ext: string,
  fallbackType: string,
  onProgress: ProgressFn | undefined,
  requireSignedURLs: boolean,
  signal?: AbortSignal,
) {
  const upload = (file: Blob) =>
    uploadToStorage(
      file,
      uid,
      ext,
      fallbackType,
      onProgress,
      requireSignedURLs,
      signal,
    );
  const initialResult = await upload(source);
  const retry = await retryLongVideoUploadWithCompression({
    source,
    initialResult,
    maxBytes: MAX_LONG_VIDEO_STORAGE_BYTES,
    onProgress,
    signal,
    compress: (file) =>
      compressLongVideoByTier(file, {
        force: true,
        signal,
        onProgress: (percent) =>
          onProgress?.(
            Math.min(15, Math.round(percent * 0.15)),
            `Optimizing video for storage retry · ${percent}%`,
            null,
          ),
      }),
    upload,
  });
  return {
    ...retry.result,
    width: retry.result.width ?? retry.compressionResult?.width ?? null,
    height: retry.result.height ?? retry.compressionResult?.height ?? null,
  };
}

/** Uploads a long-form video (and optional custom thumbnail) and stores the post. */
const BRAND_PROMO_HINTS = [
  "sponsored by",
  "paid partnership",
  "brand deal",
  "promo code",
  "affiliate link",
  "use my code",
];

async function verifyUploadedVideoUrl(
  url: string,
  signal?: AbortSignal,
): Promise<string | null> {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return "The uploaded video did not return a valid watch URL.";
    }
  } catch {
    return "The uploaded video did not return a valid watch URL.";
  }

  let lastStatus: number | null = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (signal?.aborted) return "Upload cancelled";
    try {
      const response = await fetch(url, {
        method: "HEAD",
        cache: "no-store",
        signal,
      });
      if (response.ok) return null;
      lastStatus = response.status;
    } catch (error) {
      if (signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
        return "Upload cancelled";
      }
    }

    if (attempt < 3) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 1000));
    }
  }

  console.warn("Uploaded video URL was not available after propagation checks", {
    status: lastStatus,
  });
  return "The video uploaded, but its watch link is not ready yet. Please retry in a moment.";
}

export async function publishLongVideo(opts: {
  fileUrl: string;
  file?: Blob | null;
  thumbnailUrl?: string | null;
  thumbnailFile?: Blob | null;
  title: string;
  description?: string;
  tags?: string[];
  orientation: "landscape" | "portrait";
  seriesTitle?: string | null;
  episodeNumber?: string | null;
  durationSeconds?: number | null;
  originalWidth?: number | null;
  originalHeight?: number | null;
  scheduledAt?: string | null;
  access?: "public" | "vip" | "paid";
  price?: number | null;
  isPaid?: boolean;
  paidPromotion?: boolean;
  officialSponsorshipId?: string | null;
  generatedThumbnailPromise?: Promise<Blob | null>;
  sourceSizeBytes?: number | null;
  onProgress?: ProgressFn;
  signal?: AbortSignal;
}): Promise<{ error: string | null }> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("Could not authorize video publishing", sessionError);
    return { error: sessionError.message };
  }
  const uid = sessionData.session?.user.id;
  if (!uid) return { error: "You need to sign in to publish a video." };
  if (opts.signal?.aborted) return { error: "Upload cancelled" };
  if (
    (opts.sourceSizeBytes ?? 0) > MAX_LONG_VIDEO_INPUT_BYTES ||
    (opts.file?.size ?? 0) > MAX_LONG_VIDEO_INPUT_BYTES
  ) {
    return { error: "Videos must be 2 GB or smaller." };
  }

  if (opts.seriesTitle?.trim() || opts.episodeNumber?.trim()) {
    const { error } = await supabase
      .from("posts")
      .select("series_title,episode_number")
      .limit(0);
    if (error) {
      console.error("Video series metadata schema is unavailable", error);
      return {
        error: "Series details cannot be saved yet. Please try again after the video update is available.",
      };
    }
  }

  let thumb = opts.thumbnailUrl ?? null;
  const customThumbnail = Boolean(thumb && /^(blob:|data:)/.test(thumb));
  const thumbnailTaskResult = (error: unknown) => ({
    url: null,
    storagePath: null,
    error: error instanceof Error ? error.message : "Could not prepare the video thumbnail.",
  });
  let sourceBlob = opts.file ?? null;
  if (!sourceBlob && /^(blob:|data:)/.test(opts.fileUrl)) {
    try {
      const response = await fetch(opts.fileUrl, { signal: opts.signal });
      if (response.ok) sourceBlob = await response.blob();
    } catch (error) {
      console.warn("Could not read the local video for its thumbnail", error);
    }
  }
  if (sourceBlob && sourceBlob.size > MAX_LONG_VIDEO_INPUT_BYTES) {
    return { error: "Videos must be 2 GB or smaller." };
  }
  let mediaUrl = opts.fileUrl;
  let uploadedSourcePath: string | null = null;
  let uploadedWidth = opts.originalWidth ?? null;
  let uploadedHeight = opts.originalHeight ?? null;
  let uploadedStreamUid: string | null = null;
  let uploadedDurationSeconds: number | null = null;
  let mediaUploadPromise: ReturnType<typeof uploadToStorage> | null = null;
  if (/^(blob:|data:)/.test(mediaUrl)) {
    // Start the raw/resumable video transfer before thumbnail work. On-device
    // frame extraction must not hold the first TUS chunk behind it.
    opts.onProgress?.(0, "Starting video upload", null);
    mediaUploadPromise = sourceBlob
      ? uploadLongVideoWithStorageRetry(
          sourceBlob,
          uid,
          "mp4",
          "video/mp4",
          (percent, detail, byteProgress) =>
            opts.onProgress?.(
              Math.min(97, Math.round(percent * 0.97)),
              detail,
              byteProgress,
            ),
          (opts.access ?? "public") !== "public",
          opts.signal,
        )
      : uploadToStorage(
      mediaUrl,
      uid,
      "mp4",
      "video/mp4",
      (percent, detail, byteProgress) =>
        opts.onProgress?.(
          Math.min(97, Math.round(percent * 0.97)),
          detail,
          byteProgress,
        ),
      (opts.access ?? "public") !== "public",
      opts.signal,
    );
  }

  let generatedThumbnail: Blob | null = null;
  if (!thumb) {
    try {
      generatedThumbnail = opts.generatedThumbnailPromise
        ? await opts.generatedThumbnailPromise
        : null;
      if (!generatedThumbnail && sourceBlob) {
        generatedThumbnail = await generateVideoThumbnail(sourceBlob, 1);
      }
    } catch (error) {
      console.warn("Could not generate the long-video thumbnail", error);
    }
    if (!generatedThumbnail) {
      console.warn("Could not capture a local thumbnail; checking for a Stream poster.");
    }
  }

  const uploadedMedia = mediaUploadPromise ? await mediaUploadPromise : null;
  if (opts.signal?.aborted) return { error: "Upload cancelled" };
  if (uploadedMedia) {
    if (uploadedMedia.error || !uploadedMedia.url || !uploadedMedia.storagePath) {
      return {
        error:
          uploadedMedia.error ??
          "The video upload did not return a playable media URL.",
      };
    }
    mediaUrl = uploadedMedia.url;
    uploadedSourcePath = uploadedMedia.storagePath;
    uploadedWidth = uploadedMedia.width ?? uploadedWidth;
    uploadedHeight = uploadedMedia.height ?? uploadedHeight;
    uploadedStreamUid = uploadedMedia.streamUid;
    uploadedDurationSeconds = uploadedMedia.durationSeconds;
    if (!thumb && uploadedMedia.posterUrl) thumb = uploadedMedia.posterUrl;

    opts.onProgress?.(98, "Checking video playback availability");
    const playbackUrlError = await verifyUploadedVideoUrl(mediaUrl, opts.signal);
    if (playbackUrlError) return { error: playbackUrlError };
  }

  if (!thumb && !generatedThumbnail) {
    if (uploadedSourcePath) {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKETS.videos)
        .remove([uploadedSourcePath]);
      if (error) console.warn("Could not remove a video whose thumbnail could not be prepared", error);
    }
    return { error: "Could not capture a thumbnail frame from this video. Please try again." };
  }

  const thumbnailSource = customThumbnail
    ? opts.thumbnailFile ?? thumb
    : !thumb
      ? generatedThumbnail
      : null;
  let thumbnailUploadPromise:
    | ReturnType<typeof uploadVideoThumbnail>
    | null = null;
  if (thumbnailSource) {
    thumbnailUploadPromise = uploadVideoThumbnail(
      thumbnailSource,
      uid,
      undefined,
      STORAGE_BUCKETS.thumbnails,
      opts.signal,
    ).catch(thumbnailTaskResult);
  }

  if (thumbnailUploadPromise) {
    const thumbnail = await thumbnailUploadPromise;
    if (thumbnail.error || !thumbnail.url) {
      return { error: thumbnail.error ?? "Thumbnail upload failed. Please try again." };
    }
    thumb = thumbnail.url;
  }
  if (!thumb) {
    return { error: "A video thumbnail is required before publishing this video." };
  }
  if (opts.signal?.aborted) return { error: "Upload cancelled" };

  // Automated content scan (safety + brand/sponsorship detection) before publishing.
  let scan: ModerationVerdict | null = null;
  try {
    const frames = await sampleVideoFrames(mediaUrl, 3);
    scan = await scanVideoContent({
      data: {
        title: opts.title ?? "",
        description: opts.description ?? "",
        tags: opts.tags ?? [],
        paidPromotion: !!opts.paidPromotion,
        frames,
      },
    });
  } catch {
    scan = null;
  }

  if (scan?.decision === "block") {
    return {
      error:
        scan.reason ||
        "This video can't be published because it appears to violate our content safety guidelines.",
    };
  }

  // Routine compliance routing: third-party promotions declared without an
  // official in-app sponsorship go through review before they go live.
  const needsReview =
    (!!opts.paidPromotion && !opts.officialSponsorshipId) ||
    BRAND_PROMO_HINTS.some((k) =>
      `${opts.title} ${opts.description ?? ""}`.toLowerCase().includes(k),
    ) ||
    scan?.decision === "review" ||
    !!scan?.sponsorship ||
    (scan?.brands?.length ?? 0) > 0;

  if (opts.signal?.aborted) return { error: "Upload cancelled" };
  const postId = crypto.randomUUID();
  let insertError: { message: string } | null = null;
  try {
    const result = await writeCompat(
      (payload) => supabase.from("posts").insert(payload as never),
      {
        id: postId,
        user_id: uid,
        kind: "video",
        media_url: mediaUrl,
        cloudflare_stream_uid: uploadedStreamUid,
        video_url: uploadedSourcePath
          ? `${STORAGE_BUCKETS.videos}/${uploadedSourcePath}`
          : null,
        media_type: "video",
        title: opts.title.trim(),
        caption: opts.description ?? "",
        hashtags: opts.tags ?? [],
        thumbnail_url: thumb,
        orientation: opts.orientation,
        duration_seconds: uploadedDurationSeconds
          ? Math.round(uploadedDurationSeconds)
          : opts.durationSeconds
            ? Math.round(opts.durationSeconds)
            : null,
        original_width: uploadedWidth,
        original_height: uploadedHeight,
        source_quality_tier: sourceQualityTierFromDimensions(uploadedWidth, uploadedHeight),
        scheduled_at: opts.scheduledAt ?? null,
        video_access: opts.access ?? "public",
        price: opts.price ?? null,
        is_paid: opts.isPaid ?? opts.access === "paid",
        paid_promotion: !!opts.paidPromotion,
        review_status: needsReview ? "pending_review" : "approved",
        review_note: needsReview
          ? "Video under routine compliance check before publishing."
          : null,
        series_title: opts.seriesTitle?.trim() || null,
        episode_number: opts.episodeNumber?.trim() || null,
        allow_download: true,
        tagged_user_ids: [],
        viewer_user_ids: [],
      },
      { kind: "type", video_access: "audience" },
      uploadedSourcePath ? ["video_url"] : [],
    );
    if (uploadedSourcePath && missingColumn(result.error) === "video_url") {
      insertError = {
        message: "The video source could not be saved for downloads. Please try again after the video schema update is available.",
      };
    } else if (
      !result.error &&
      opts.access &&
      opts.access !== "public" &&
      (result.removedColumns as string[] | undefined)?.some((column) =>
        column === "video_access" || column === "price" || column === "audience",
      )
    ) {
      insertError = {
        message: "This project could not persist video access controls. Choose Public or try again after the schema is available.",
      };
    } else {
      insertError = result.error
      ? { message: result.error.message ?? "Could not save the video." }
      : null;
    }
  } catch (error) {
    console.error("Long-video database insert threw unexpectedly", error);
    insertError = {
      message: error instanceof Error ? error.message : "Could not save the video.",
    };
  }

  if (insertError) console.error("Long-video database insert failed", insertError);
  else {
    rememberLocalMedia(mediaUrl, opts.fileUrl);
    if (!opts.scheduledAt && !needsReview) {
      announcePublishedPost({ id: postId, kind: "video", mediaType: "video" });
    }
    opts.onProgress?.(100);
  }
  return { error: insertError?.message ?? null };
}

/** Live list of published long videos (scheduled ones appear at their release time). */
export const VIDEO_PAGE_SIZE = 12;

type LongVideoPage = {
  videos: LongVideo[];
  currentUserId: string | null;
  hasMore: boolean;
  nextOffset: number | null;
};

function applyVideoPage<T extends { limit: (count: number) => T }>(
  query: T,
  offset: number,
  pageSize: number,
): T {
  const rangeQuery = query as T & {
    range?: (from: number, to: number) => T;
  };
  return typeof rangeQuery.range === "function"
    ? rangeQuery.range(offset, offset + pageSize - 1)
    : query.limit(pageSize);
}

async function loadLongVideoPage(
  offset = 0,
  pageSize = VIDEO_PAGE_SIZE,
  onlyIds?: string[],
  options: { includeLiveReplays?: boolean } = {},
): Promise<LongVideoPage> {
  const { data: sessionData } = await supabase.auth.getSession();
  const uid = sessionData.session?.user.id ?? null;
  let nextOffset = offset;
  let hasMore = false;
  const videos: LongVideo[] = [];

  // A page can contain scheduled, archived, or unapproved rows. Keep scanning
  // the ordered source until the visible page is full so those rows don't hide
  // later published long videos.
  while (videos.length < pageSize) {
    const currentPageQuery = supabase.from("posts").select("*");
    const sourceQuery = onlyIds
      ? currentPageQuery.in("id", onlyIds)
      : currentPageQuery.eq("kind", "video").order("created_at", { ascending: false });
    let { data: posts, error } = await applyVideoPage(sourceQuery, nextOffset, pageSize);
    let scannedRowCount = posts?.length ?? 0;

    if (missingColumn(error) === "kind") {
      const legacyQuery = supabase.from("posts").select("*");
      const legacySourceQuery = onlyIds
        ? legacyQuery.in("id", onlyIds)
        : legacyQuery.order("created_at", { ascending: false });
      const legacy = await applyVideoPage(legacySourceQuery, nextOffset, pageSize);
      const legacyRows = legacy.data ?? [];
      scannedRowCount = legacyRows.length;
      posts = legacyRows.filter((row) => postKind(row) === "video");
      error = legacy.error;
    }

    if (error) {
      console.error("Unable to load videos", error);
      return { videos: [], currentUserId: uid, hasMore: false, nextOffset: null };
    }

    const pagePosts = (posts ?? []).map(normalizePostRow);
    hasMore = scannedRowCount >= pageSize;
    const published = pagePosts
      .filter((post) => !isPostDeleted(post.id))
      .filter((post) => !onlyIds || postKind(post) === "video")
      .filter((post) =>
        isPublishedLongVideoRow(post as unknown as Record<string, unknown>),
      );
    const visible = options.includeLiveReplays
      ? published
      : await excludeLiveReplayPosts(published);

    if (visible.length) {
      const ids = visible.map((post) => post.id);
      const authorIds = [...new Set(visible.map((post) => post.user_id))];
      const [{ data: profiles }, { data: likes }, { data: comments }] = await Promise.all([
        supabase.rpc("get_public_profiles", { ids: authorIds }),
        liveLikesTable().select("post_id,user_id").in("post_id", ids),
        supabase.from("comments").select("post_id").in("post_id", ids),
      ]);
      const byId = new Map(((profiles ?? []) as DbProfile[]).map((profile) => [profile.id, profile]));

      videos.push(...visible.map((post) => {
        const metadata = post as typeof post & {
          aspect_ratio?: string | null;
          video_type?: string | null;
          is_reel?: boolean | null;
          original_width?: number | null;
          original_height?: number | null;
          source_quality_tier?: string | null;
          type?: string | null;
          video_access?: string | null;
          is_paid?: boolean | null;
          price?: number | null;
          series_title?: string | null;
          episode_number?: string | null;
        };
        const rawAccess = String(metadata.video_access ?? "").toLowerCase();
        const hasPaidPrice =
          typeof metadata.price === "number" && Number.isFinite(metadata.price) && metadata.price > 0;
        const access =
          rawAccess === "vip"
            ? "vip"
            : rawAccess === "paid" || metadata.is_paid === true || hasPaidPrice
              ? "paid"
              : rawAccess === "" || rawAccess === "public"
                ? "public"
                : "paid";
        const cloudflarePoster =
          access === "public"
            ? cloudflareStreamPosterUrl(
                post.media_url,
                post.cloudflare_stream_id ?? post.cloudflare_stream_uid,
              )
            : null;
        const savedThumbnail =
          typeof post.thumbnail_url === "string" ? post.thumbnail_url.trim() : "";
        const profile = byId.get(post.user_id);
        const username = profile?.username ?? `user${post.user_id.slice(0, 4)}`;
        const name = profile?.display_name ?? username;
        return {
          id: post.id,
          userId: post.user_id,
          title: post.title || post.caption || "Untitled video",
          caption: post.caption ?? "",
          mediaUrl: post.media_url,
          cloudflareStreamId: post.cloudflare_stream_id ?? post.cloudflare_stream_uid ?? null,
          thumbnailUrl: savedThumbnail || cloudflarePoster,
          orientation: post.orientation === "portrait" ? "portrait" : "landscape",
          aspectRatio: metadata.aspect_ratio ?? null,
          videoType: metadata.video_type ?? null,
          isReel: metadata.is_reel ?? null,
          postType: metadata.type ?? post.kind ?? null,
          durationSeconds: readVideoDurationSeconds(
            post as unknown as Record<string, unknown>,
          ),
          originalWidth: typeof metadata.original_width === "number" ? metadata.original_width : null,
          originalHeight: typeof metadata.original_height === "number" ? metadata.original_height : null,
          sourceQualityTier: qualityTierFromSourceMetadata(metadata.source_quality_tier)
            ?? qualityTierFromDimensions(metadata.original_width, metadata.original_height),
          views: Number(post.views ?? (post as typeof post & { views_count?: number | null }).views_count ?? 0),
          hashtags: post.hashtags ?? [],
          createdAt: post.created_at,
          scheduledAt: post.scheduled_at,
          author: {
            name,
            username,
            letter: (name || "Y").charAt(0).toUpperCase(),
            avatarUrl:
              profile?.avatar_url ??
              profile?.profile_pic ??
              profile?.profile_image ??
              null,
          },
          likeCount: (likes ?? []).filter((like) => like.post_id === post.id).length,
          commentCount: (comments ?? []).filter((comment) => comment.post_id === post.id).length,
          likedByMe: !!uid && (likes ?? []).some((like) => like.post_id === post.id && like.user_id === uid),
          commentsOff: !!(post as typeof post & { comments_off?: boolean }).comments_off,
          access,
          price: (post as typeof post & { price?: number | null }).price ?? null,
          seriesTitle: metadata.series_title ?? null,
          episodeNumber: metadata.episode_number ?? null,
        } satisfies LongVideo;
      }));
    }

    nextOffset += scannedRowCount;
    if (!hasMore || scannedRowCount === 0) break;
  }

  return {
    videos: videos.slice(0, pageSize).filter((video) => !isPostDeleted(video.id)),
    currentUserId: uid,
    hasMore,
    nextOffset: hasMore ? nextOffset : null,
  };
}

export async function loadLongVideosByIds(
  ids: readonly string[],
  options: { includeLiveReplays?: boolean; bypassFeedSuppression?: boolean } = {},
): Promise<LongVideo[]> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return [];
  const page = await loadLongVideoPage(0, uniqueIds.length, uniqueIds, {
    includeLiveReplays: options.includeLiveReplays ?? true,
  });
  const visibleVideos = options.bypassFeedSuppression
    ? page.videos
    : await filterSuppressedLongVideos(page.videos, page.currentUserId);
  const priority = new Map(uniqueIds.map((id, index) => [id, index]));
  return visibleVideos.sort(
    (left, right) => (priority.get(left.id) ?? Infinity) - (priority.get(right.id) ?? Infinity),
  );
}

export async function loadSavedLongVideos(userId: string): Promise<LongVideo[]> {
  const { data, error } = await supabase
    .from("post_saves")
    .select("post_id,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return loadLongVideosByIds((data ?? []).map((row) => row.post_id));
}

async function filterSuppressedLongVideos(
  videos: LongVideo[],
  userId: string | null,
): Promise<LongVideo[]> {
  if (!userId || videos.length === 0) return videos;
  const postIds = videos.map((video) => video.id);
  const [preferencesResult, mutedCreatorsResult, hiddenCreatorsResult] = await Promise.all([
    supabase
      .from("user_post_preferences")
      .select("post_id")
      .eq("user_id", userId)
      .in("post_id", postIds),
    supabase.from("user_muted_creators").select("creator_id").eq("user_id", userId),
    supabase.from("user_hidden_creators").select("creator_id").eq("user_id", userId),
  ]);
  if (preferencesResult.error) throw preferencesResult.error;
  if (mutedCreatorsResult.error) throw mutedCreatorsResult.error;
  if (hiddenCreatorsResult.error) throw hiddenCreatorsResult.error;
  const hiddenPostIds = new Set((preferencesResult.data ?? []).map((row) => row.post_id));
  const suppressedCreatorIds = new Set([
    ...(mutedCreatorsResult.data ?? []).map((row) => row.creator_id),
    ...(hiddenCreatorsResult.data ?? []).map((row) => row.creator_id),
  ]);
  return videos.filter(
    (video) => !hiddenPostIds.has(video.id) && !suppressedCreatorIds.has(video.userId),
  );
}

export function useLongVideos() {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["long-videos"] as const, []);
  const feedQuery = useInfiniteQuery({
    queryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const page = await loadLongVideoPage(pageParam, VIDEO_PAGE_SIZE);
      const visibleVideos = await filterSuppressedLongVideos(page.videos, page.currentUserId);
      return {
        ...page,
        videos: visibleVideos.filter((video) => !isPostDeleted(video.id)),
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
  });
  const videos = useMemo(
    () => feedQuery.data?.pages.flatMap((page) => page.videos) ?? [],
    [feedQuery.data],
  );
  const me = feedQuery.data?.pages[0]?.currentUserId ?? null;
  const updateVideos = useCallback(
    (update: (video: LongVideo) => LongVideo) => {
      queryClient.setQueryData<InfiniteData<LongVideoPage, number>>(queryKey, (current) =>
        current
          ? {
              ...current,
              pages: current.pages.map((page) => ({
                ...page,
                videos: page.videos.map(update),
              })),
            }
          : current,
      );
    },
    [queryClient, queryKey],
  );

  useEffect(() => {
    const unsubscribeFromDeletes = subscribeToPostDeleted((postId) => {
      removeDeletedPostFromQueryCaches(queryClient, postId);
    });
    let timer: number | undefined;
    const queue = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey });
      }, 500);
    };
    const onPostsChange = (payload: unknown) => {
      announcePostDeletedFromRealtime(payload);
      queue();
    };
    const onPublishedPost = (event: Event) => {
      const detail = readPublishedPostEvent(event);
      if (!detail || detail.kind !== "video") return;
      void loadLongVideosByIds([detail.id])
        .then(([publishedVideo]) => {
          if (!publishedVideo) {
            void queryClient.invalidateQueries({ queryKey });
            return;
          }
          let updated = false;
          queryClient.setQueryData<InfiniteData<LongVideoPage, number>>(queryKey, (current) => {
            if (!current?.pages.length) return current;
            updated = true;
            return {
              ...current,
              pages: current.pages.map((page, index) => ({
                ...page,
                videos:
                  index === 0
                    ? prependUniqueFeedItem(page.videos, publishedVideo, VIDEO_PAGE_SIZE)
                    : page.videos.filter((video) => video.id !== publishedVideo.id),
              })),
            };
          });
          if (!updated) void queryClient.invalidateQueries({ queryKey });
        })
        .catch((error) => {
          console.warn("Could not add the published video to the feed", error);
          void queryClient.invalidateQueries({ queryKey });
        });
    };
    const onVideoFeedSuppression = (event: Event) => {
      const detail = (event as CustomEvent<VideoFeedSuppressionDetail>).detail;
      if (detail?.restoredPostId) {
        void queryClient.invalidateQueries({ queryKey });
        return;
      }
      if (!detail?.postId && !detail?.creatorId) return;
      queryClient.setQueryData<InfiniteData<LongVideoPage, number>>(queryKey, (current) =>
        current
          ? {
              ...current,
              pages: current.pages.map((page) => ({
                ...page,
                videos: page.videos.filter(
                  (video) =>
                    !(detail.postId && video.id === detail.postId) &&
                    !(detail.creatorId && video.userId === detail.creatorId),
                ),
              })),
            }
          : current,
      );
    };
    const onLongVideoCreatorVisibilityChange = (event: Event) => {
      const detail = (event as CustomEvent<LongVideoCreatorVisibilityDetail>).detail;
      if (!detail?.creatorId) return;
      if (!detail.hidden) {
        void queryClient.invalidateQueries({ queryKey });
        return;
      }
      queryClient.setQueryData<InfiniteData<LongVideoPage, number>>(queryKey, (current) =>
        current
          ? {
              ...current,
              pages: current.pages.map((page) => ({
                ...page,
                videos: page.videos.filter(
                  (video) => video.userId !== detail.creatorId,
                ),
              })),
            }
          : current,
      );
    };
    window.addEventListener(PUBLISHED_POST_EVENT, onPublishedPost);
    window.addEventListener(VIDEO_FEED_SUPPRESSION_EVENT, onVideoFeedSuppression);
    window.addEventListener(
      LONG_VIDEO_CREATOR_VISIBILITY_EVENT,
      onLongVideoCreatorVisibilityChange,
    );
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const boot = window.setTimeout(() => {
      channel = supabase
        .channel("long-videos")
        .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, onPostsChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, queue)
       .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, queue)
        .subscribe();
    }, 300);
    return () => {
      window.clearTimeout(boot);
      window.clearTimeout(timer);
      unsubscribeFromDeletes();
      window.removeEventListener(PUBLISHED_POST_EVENT, onPublishedPost);
      window.removeEventListener(VIDEO_FEED_SUPPRESSION_EVENT, onVideoFeedSuppression);
      window.removeEventListener(
        LONG_VIDEO_CREATOR_VISIBILITY_EVENT,
        onLongVideoCreatorVisibilityChange,
      );
      if (channel) void supabase.removeChannel(channel);
    };
  }, [queryClient, queryKey]);

  // Avoid duplicate requests in this tab; the database RPC is still the
  // authoritative cross-tab/device uniqueness guard.
  const viewedRef = useRef(new Set<string>());

  const countView = useCallback(async (id: string) => {
    if (viewedRef.current.has(id)) return false; // one view per user, not per watch
    const counted = await registerUniqueView(id, "video");
    if (!counted) return false;
    viewedRef.current.add(id);
    updateVideos((video) => (video.id === id ? { ...video, views: video.views + 1 } : video));
    return true;
  }, [updateVideos]);

  const toggleLike = useCallback(
    async (id: string) => {
      if (!me) throw new Error("Sign in required");
      const current = videos.find((video) => video.id === id);
      if (!current) return;
      const wasLiked = current.likedByMe;
      updateVideos((video) =>
        video.id === id
          ? {
              ...video,
              likedByMe: !video.likedByMe,
              likeCount: Math.max(0, video.likeCount + (video.likedByMe ? -1 : 1)),
            }
          : video,
      );
      try {
        const { error } = wasLiked
          ? await liveLikesTable().delete().eq("post_id", id).eq("user_id", me)
          : await liveLikesTable().upsert(
              { post_id: id, user_id: me },
              { onConflict: "post_id,user_id", ignoreDuplicates: true },
            );
        if (error) throw error;
      } catch (error) {
        updateVideos((video) =>
          video.id === id
            ? (() => {
                const currentlyLiked = video.likedByMe;
                return {
                  ...video,
                  likedByMe: wasLiked,
                  likeCount: Math.max(
                    0,
                    video.likeCount +
                      (currentlyLiked === wasLiked ? 0 : wasLiked ? 1 : -1),
                  ),
                };
              })()
            : video,
        );
        throw error;
      }
    },
    [me, updateVideos, videos],
  );
  const reload = useCallback(() => feedQuery.refetch(), [feedQuery.refetch]);
  const loadMore = useCallback(() => feedQuery.fetchNextPage(), [feedQuery.fetchNextPage]);

  return {
    videos,
    loading: feedQuery.isLoading,
    currentUserId: me,
    countView,
    toggleLike,
    reload,
    loadMore,
    hasNextPage: feedQuery.hasNextPage,
    isFetchingNextPage: feedQuery.isFetchingNextPage,
  };
}
