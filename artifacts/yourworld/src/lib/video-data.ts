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
import { optimizeVideoBlob } from "@/lib/video-compression";
import { sampleVideoFrames } from "@/lib/video-frames";
import {
  generateAndUploadVideoThumbnail,
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
  author: { name: string; username: string; letter: string };
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
): Promise<string | null> {
  try {
    const blob = typeof source === "string"
      ? await (await fetch(source)).blob()
      : source;
    const uploadBlob = blob.type.startsWith("video/")
      ? await optimizeVideoBlob(blob, (percent, detail) =>
          onProgress?.(Math.round(percent * 0.45), detail),
        )
      : blob;
    const outputExt = uploadBlob.type.includes("webm") ? "webm" : ext;
    const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${outputExt}`;
    const { url } = await uploadWithProgress(
      STORAGE_BUCKETS.videos,
      path,
      uploadBlob,
      uploadBlob.type || fallbackType,
      (percent) => onProgress?.(
        blob.type.startsWith("video/") ? 45 + Math.round(percent * 0.55) : percent,
      ),
      IMMUTABLE_MEDIA_CACHE_CONTROL,
    );
    return url;
  } catch (error) {
    console.error("Video storage upload failed", error);
    return null;
  }
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
  onProgress?: ProgressFn;
}): Promise<{ error: string | null }> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("Could not authorize video publishing", sessionError);
    return { error: sessionError.message };
  }
  const uid = sessionData.session?.user.id;
  if (!uid) return { error: "You need to sign in to publish a video." };

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

  let mediaUrl = opts.fileUrl;
  if (/^(blob:|data:)/.test(mediaUrl)) {
    // Reserve the last few percent for the thumbnail + database write.
    const up = await uploadToStorage(opts.file ?? mediaUrl, uid, "mp4", "video/mp4", (p) =>
      opts.onProgress?.(Math.min(97, Math.round(p * 0.97))),
    );
    if (!up) return { error: "Video upload failed. Please try again." };
    mediaUrl = up;
  }

  let thumb = opts.thumbnailUrl ?? null;
  if (thumb && /^(blob:|data:)/.test(thumb)) {
    const thumbnailUpload = await uploadVideoThumbnail(
      opts.thumbnailFile ?? thumb,
      uid,
      undefined,
      STORAGE_BUCKETS.thumbnails,
    );
    thumb = thumbnailUpload.url;
    if (thumbnailUpload.error || !thumb) {
      return { error: thumbnailUpload.error ?? "Thumbnail upload failed. Please try again." };
    }
  }
  if (!thumb) {
    try {
      const sourceBlob = opts.file ?? (
        /^(blob:|data:)/.test(opts.fileUrl)
          ? await (await fetch(opts.fileUrl)).blob()
          : null
      );
      if (sourceBlob) {
        const generated = await generateAndUploadVideoThumbnail(
          sourceBlob,
          uid,
          undefined,
          STORAGE_BUCKETS.thumbnails,
        );
        if (generated.error) {
          console.warn("Generated long-video thumbnail upload failed", generated.error);
        } else {
          thumb = generated.url;
        }
      }
    } catch (error) {
      console.warn("Automatic long-video thumbnail generation failed", error);
    }
  }

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

  let insertError: { message: string } | null = null;
  try {
    const result = await writeCompat(
      (payload) => supabase.from("posts").insert(payload as never),
      {
        user_id: uid,
        kind: "video",
        media_url: mediaUrl,
        media_type: "video",
        title: opts.title.trim(),
        caption: opts.description ?? "",
        hashtags: opts.tags ?? [],
        thumbnail_url: thumb,
        orientation: opts.orientation,
        duration_seconds: opts.durationSeconds ? Math.round(opts.durationSeconds) : null,
        original_width: opts.originalWidth ?? null,
        original_height: opts.originalHeight ?? null,
        source_quality_tier: sourceQualityTierFromDimensions(opts.originalWidth, opts.originalHeight),
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
    );
    if (
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

  opts.onProgress?.(100);
  if (insertError) console.error("Long-video database insert failed", insertError);
  else rememberLocalMedia(mediaUrl, opts.fileUrl);
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
    const visible = pagePosts
      .filter((post) => !isPostDeleted(post.id))
      .filter((post) => !onlyIds || postKind(post) === "video")
      .filter((post) =>
        isPublishedLongVideoRow(post as unknown as Record<string, unknown>),
      );

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
          series_title?: string | null;
          episode_number?: string | null;
        };
        const profile = byId.get(post.user_id);
        const username = profile?.username ?? `user${post.user_id.slice(0, 4)}`;
        const name = profile?.display_name ?? username;
        return {
          id: post.id,
          userId: post.user_id,
          title: post.title || post.caption || "Untitled video",
          caption: post.caption ?? "",
          mediaUrl: post.media_url,
          thumbnailUrl: post.thumbnail_url,
          orientation: post.orientation === "portrait" ? "portrait" : "landscape",
          aspectRatio: metadata.aspect_ratio ?? null,
          videoType: metadata.video_type ?? null,
          isReel: metadata.is_reel ?? null,
          postType: metadata.type ?? post.kind ?? null,
          durationSeconds: post.duration_seconds,
          originalWidth: typeof metadata.original_width === "number" ? metadata.original_width : null,
          originalHeight: typeof metadata.original_height === "number" ? metadata.original_height : null,
          sourceQualityTier: qualityTierFromSourceMetadata(metadata.source_quality_tier)
            ?? qualityTierFromDimensions(metadata.original_width, metadata.original_height),
          views: Number(post.views ?? (post as typeof post & { views_count?: number | null }).views_count ?? 0),
          hashtags: post.hashtags ?? [],
          createdAt: post.created_at,
          scheduledAt: post.scheduled_at,
          author: { name, username, letter: (name || "Y").charAt(0).toUpperCase() },
          likeCount: (likes ?? []).filter((like) => like.post_id === post.id).length,
          commentCount: (comments ?? []).filter((comment) => comment.post_id === post.id).length,
          likedByMe: !!uid && (likes ?? []).some((like) => like.post_id === post.id && like.user_id === uid),
          commentsOff: !!(post as typeof post & { comments_off?: boolean }).comments_off,
          access: ((post as typeof post & { video_access?: string }).video_access ?? "public") as
            | "public"
            | "vip"
            | "paid",
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

export async function loadLongVideosByIds(ids: readonly string[]): Promise<LongVideo[]> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return [];
  const page = await loadLongVideoPage(0, uniqueIds.length, uniqueIds);
  const priority = new Map(uniqueIds.map((id, index) => [id, index]));
  return page.videos.sort(
    (left, right) => (priority.get(left.id) ?? Infinity) - (priority.get(right.id) ?? Infinity),
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
      return {
        ...page,
        videos: page.videos.filter((video) => !isPostDeleted(video.id)),
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

  return {
    videos,
    loading: feedQuery.isLoading,
    currentUserId: me,
    countView,
    toggleLike,
    reload: () => feedQuery.refetch(),
    loadMore: () => feedQuery.fetchNextPage(),
    hasNextPage: feedQuery.hasNextPage,
    isFetchingNextPage: feedQuery.isFetchingNextPage,
  };
}
