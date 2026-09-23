import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cacheGet, cacheSet } from "@/lib/local-cache";
import {
  loadCachedThread,
  loadCachedThreadSync,
  PAGE_SIZE,
  saveCachedThread,
} from "@/lib/chat-db";
import {
  IMMUTABLE_MEDIA_CACHE_CONTROL,
  STORAGE_BUCKETS,
  uploadWithProgress,
  type ProgressFn,
} from "@/lib/storage-upload";
import { optimizeVideoBlob } from "@/lib/video-compression";
import { generateAndUploadVideoThumbnail, uploadVideoThumbnail } from "@/lib/video-thumbnails";
import { flagChatMessage } from "@/lib/chat-compliance";
import type { User } from "@/lib/yw-data";
import { missingColumn, normalizePostRow, postKind, writeCompat } from "@/lib/supabase-compat";
import { registerUniqueView } from "@/lib/unique-views";
import {
  MAX_REEL_DURATION_MESSAGE,
  MAX_REEL_DURATION_SECONDS,
  MIN_REEL_DURATION_MESSAGE,
  MIN_REEL_DURATION_SECONDS,
} from "@/lib/reel-editor";
import { qualityTierFromDimensions } from "@/lib/video-quality";
import {
  AFTER_VIEW_DELAY_MS,
  afterViewExpiresAt,
  expiresAtForAutoDelete,
  normalizeAutoDeleteSetting,
  type AutoDeleteSetting,
} from "@/lib/auto-delete";

const liveSocialTable = (
  client: typeof supabase,
  table: "likes" | "comments",
) =>
  (client as unknown as {
    from: (name: "likes" | "comments") => ReturnType<typeof supabase.from>;
  }).from(table);

const liveCommentLikesTable = (client: typeof supabase) =>
  (client as unknown as {
    from: (name: "comment_likes") => ReturnType<typeof supabase.from>;
  }).from("comment_likes");

export type DbProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  profile_pic?: string | null;
  profile_image?: string | null;
};

export type DbPost = {
  id: string;
  user_id: string;
  kind: string;
  title?: string | null;
  media_url: string;
  video_url?: string | null;
  media_type: string;
  thumbnail_url?: string | null;
  cover_image?: string | null;
  duration_seconds?: number | null;
  original_width?: number | null;
  original_height?: number | null;
  source_quality_tier?: string | null;
  caption: string;
  hashtags: string[];
  location: string | null;
  audio: string | null;
  allow_download: boolean;
  created_at: string;
  views?: number | null;
  views_count?: number | null;
  hide_like_count?: boolean | null;
  hide_share_count?: boolean | null;
  comments_off?: boolean | null;
  pinned?: boolean | null;
  archived?: boolean | null;
  mentions?: string[] | null;
  category?: string | null;
  sports_tag?: string | null;
};

export type SocialPost = DbPost & {
  author: User;
  authorAvatarUrl?: string | null;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

const hueFromId = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
};

export const toUser = (p: DbProfile | undefined, id: string): User => ({
  id,
  username: p?.username ?? `user${id.slice(0, 4)}`,
  name: p?.display_name ?? p?.username ?? "YourWorld user",
  hue: hueFromId(id),
});

export function timeAgo(iso: string) {
  const timestamp = new Date(iso).getTime();
  if (!Number.isFinite(timestamp)) return "Just now";
  const s = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export const SOCIAL_PAGE_SIZE = 12;

type SocialPage = {
  posts: SocialPost[];
  currentUserId: string | null;
  hasMore: boolean;
};

function applyPage<T extends { limit: (count: number) => T }>(
  query: T,
  page: number,
  pageSize: number,
): T {
  const rangeQuery = query as T & {
    range?: (from: number, to: number) => T;
  };
  return typeof rangeQuery.range === "function"
    ? rangeQuery.range(page * pageSize, page * pageSize + pageSize - 1)
    : query.limit(pageSize);
}

/* -------------------------------------------------------------------------
 * Media URL resolution for reels/posts
 * ---------------------------------------------------------------------- */

/** Local blob URLs kept for media the current session just uploaded. */
const localMedia = new Map<string, string>();

/** Remember a local blob/object URL as a fallback for a remote media URL. */
export function rememberLocalMedia(remoteUrl: string, localUrl: string) {
  if (remoteUrl && /^(blob:|data:)/.test(localUrl)) localMedia.set(remoteUrl, localUrl);
}

export function getLocalMedia(remoteUrl: string) {
  return localMedia.get(remoteUrl) ?? null;
}

const signedCache = new Map<string, { url: string; expiresAt: number }>();

function storagePathFrom(url: string, bucket: string): string | null {
  if (!/^https?:/.test(url)) return url.replace(/^\/+/, "");
  const m = url.match(new RegExp(`/storage/v1/object/(?:sign|public)/${bucket}/([^?]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Turns a stored media reference into a URL the <video>/<img> tag can load.
 * Handles bare storage paths and expired signed URLs by re-signing, and falls
 * back to the bucket's public URL.
 */
export async function resolveMediaUrl(url: string, bucket = "reels"): Promise<string> {
  if (!url) return url;
  if (/^(blob:|data:)/.test(url)) return url;
  const cached = signedCache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.url;
  if (cached) signedCache.delete(url);

  const path = storagePathFrom(url, bucket);
  if (!path) return url;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24);
  if (error || !data?.signedUrl) return url;
  const next = data.signedUrl;
  // Keep a safety margin below the one-day signed URL lifetime so a long-lived
  // SPA never deliberately reuses a URL at the edge of expiry.
  signedCache.set(url, { url: next, expiresAt: Date.now() + 22 * 60 * 60 * 1000 });
  return next;
}

/** Live list of posts of a given kind, with author, like and comment counts. */
export async function loadSocialPosts(
  kind: "post" | "reel" | "video" | "creator-media",
  client: typeof supabase = supabase,
  userId?: string,
  page = 0,
  pageSize = SOCIAL_PAGE_SIZE,
): Promise<SocialPage> {
  const { data: sessionData } = await client.auth.getSession();
  const uid = sessionData.session?.user.id ?? null;
  let query = client.from("posts").select("*");
  if (kind === "creator-media") query = query.in("kind", ["reel", "video"]);
  else query = query.eq("kind", kind);
  if (userId) query = query.eq("user_id", userId);
  let { data: posts, error } = await applyPage(
    query.order("created_at", { ascending: false }),
    page,
    pageSize,
  );

  if (missingColumn(error) === "kind") {
    const legacyKind = kind === "post" ? "story" : kind;
    let legacyQuery = client
      .from("posts")
      .select("*")
      .eq("type" as "kind", legacyKind);
    if (userId) legacyQuery = legacyQuery.eq("user_id", userId);
    const legacy = await applyPage(
      legacyQuery.order("created_at", { ascending: false }),
      page,
      pageSize,
    );
    posts = legacy.data;
    error = legacy.error;
    if (missingColumn(error) === "type" || kind === "creator-media") {
      let unfilteredQuery = client.from("posts").select("*");
      if (userId) unfilteredQuery = unfilteredQuery.eq("user_id", userId);
      const unfiltered = await applyPage(
        unfilteredQuery.order("created_at", { ascending: false }),
        page,
        pageSize,
      );
      posts = (unfiltered.data ?? []).filter((row) =>
        kind === "creator-media"
          ? postKind(row) === "reel" || postKind(row) === "video"
          : postKind(row) === kind,
      );
      error = unfiltered.error;
    }
  }

  if (error || !posts?.length) {
    if (error) console.error(`Unable to load ${kind} feed`, error);
    return { posts: [], currentUserId: uid, hasMore: false };
  }

  const ids = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.user_id))];

  const [profilesResult, likesResult, commentsResult] = await Promise.all([
    client.rpc("get_public_profiles", { ids: authorIds }),
    liveSocialTable(client, "likes").select("post_id,user_id").in("post_id", ids),
    liveSocialTable(client, "comments").select("post_id").in("post_id", ids),
  ]);
  const { data: profiles } = profilesResult;
  const { data: likes, error: likesError } = likesResult;
  const { data: comments } = commentsResult;
  if (likesError) console.error(`Unable to load ${kind} likes`, likesError);

  const profileById = new Map(
    ((profiles ?? []) as DbProfile[]).map((p) => [p.id, p]),
  );

  const likeRows = (likes ?? []) as Array<{ post_id: string; user_id: string }>;
  const commentRows = (comments ?? []) as Array<{ post_id: string }>;
  const next: SocialPost[] = posts.map((p) => ({
    ...(normalizePostRow(p) as DbPost),
    views: Number(
      p.views ??
        (p as typeof p & { views_count?: number | null }).views_count ??
        0,
    ),
    author: toUser(profileById.get(p.user_id), p.user_id),
    authorAvatarUrl: profileById.get(p.user_id)?.avatar_url ?? null,
    likeCount: likeRows.filter((like) => like.post_id === p.id).length,
    commentCount: commentRows.filter((comment) => comment.post_id === p.id).length,
    likedByMe: !!uid && likeRows.some((like) => like.post_id === p.id && like.user_id === uid),
  }));

  return {
    posts: next,
    currentUserId: uid,
    hasMore: posts.length >= pageSize,
  };
}

/** Loads one post/reel for the dedicated media viewer without inventing a
 * second data model. The profile grid and the public viewer now share the
 * same live likes/comments rows. */
export function useMediaPost(postId: string | null) {
  const cleanPostId = (() => {
    if (typeof postId !== "string") return "";
    try {
      return decodeURIComponent(postId).replace(/[^a-zA-Z0-9-]/g, "");
    } catch {
      return postId.replace(/[^a-zA-Z0-9-]/g, "");
    }
  })();
  const [post, setPost] = useState<SocialPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const pendingLike = useRef(false);
  const viewedRef = useRef(false);

  const load = useCallback(async () => {
    if (!cleanPostId) {
      setPost(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user.id ?? null;
      setMe(uid);

      const { data: row, error: rowError } = await supabase
        .from("posts")
        .select("*")
        .eq("id", cleanPostId)
        .maybeSingle();
      if (rowError || !row) {
        setPost(null);
        setError(rowError?.message ?? "This post is no longer available.");
        return;
      }

      const normalized = normalizePostRow(row) as DbPost;
      const [{ data: profiles }, { data: likes }, { data: comments }] = await Promise.all([
        supabase.rpc("get_public_profiles", { ids: [normalized.user_id] }),
        liveSocialTable(supabase, "likes").select("post_id,user_id").eq("post_id", cleanPostId),
        liveSocialTable(supabase, "comments").select("post_id").eq("post_id", cleanPostId),
      ]);
      const profile = ((profiles ?? []) as DbProfile[])[0];
      const likeRows = (likes ?? []) as Array<{ post_id: string; user_id: string }>;
      const next: SocialPost = {
        ...normalized,
        views: Number(normalized.views ?? normalized.views_count ?? 0),
        author: toUser(profile, normalized.user_id),
        authorAvatarUrl: profile?.avatar_url ?? null,
        likeCount: likeRows.length,
        commentCount: ((comments ?? []) as Array<{ post_id: string }>).length,
        likedByMe: !!uid && likeRows.some((like) => like.user_id === uid),
      };
      setPost(next);
      setError(null);
    } catch (cause) {
      console.error("Unable to load media viewer post", cause);
      setPost(null);
      setError(cause instanceof Error ? cause.message : "This media could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [cleanPostId]);

  useEffect(() => {
    viewedRef.current = false;
    void load();
  }, [load]);

  const toggleLike = useCallback(async () => {
    if (!post || !me) throw new Error("Sign in required");
    if (pendingLike.current) return;
    pendingLike.current = true;
    const wasLiked = post.likedByMe;
    setPost((current) =>
      current
        ? {
            ...current,
            likedByMe: !wasLiked,
            likeCount: Math.max(0, current.likeCount + (wasLiked ? -1 : 1)),
          }
        : current,
    );
    try {
      const result = wasLiked
        ? await liveSocialTable(supabase, "likes").delete().eq("post_id", post.id).eq("user_id", me)
        : await liveSocialTable(supabase, "likes").upsert(
            { post_id: post.id, user_id: me },
            { onConflict: "post_id,user_id", ignoreDuplicates: true },
          );
      if (result.error) throw result.error;
    } catch (cause) {
      setPost((current) =>
        current
          ? {
              ...current,
              likedByMe: wasLiked,
              likeCount: Math.max(0, current.likeCount + (wasLiked ? 1 : -1)),
            }
          : current,
      );
      throw cause;
    } finally {
      pendingLike.current = false;
    }
  }, [me, post]);

  const countView = useCallback(async () => {
    if (!post || viewedRef.current) return;
    const contentType = post.kind === "reel" ? "reel" : post.kind === "video" ? "video" : "post";
    const counted = await registerUniqueView(post.id, contentType);
    if (!counted) return;
    viewedRef.current = true;
    setPost((current) => (current ? { ...current, views: (current.views ?? 0) + 1 } : current));
  }, [post]);

  return { post, loading, error, currentUserId: me, toggleLike, countView, reload: load };
}

export function useSocialPosts(
  kind: "post" | "reel" | "video" | "creator-media",
  userId?: string,
) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => ["social-posts", kind, userId ?? null] as const,
    [kind, userId],
  );
  const muteUntil = useRef(0);
  const pendingLikes = useRef(new Set<string>());
  const viewedRef = useRef(new Set<string>());
  const removedRef = useRef(new Set<string>());
  const feedQuery = useInfiniteQuery({
    queryKey,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      loadSocialPosts(kind, supabase, userId, pageParam, SOCIAL_PAGE_SIZE),
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? lastPageParam + 1 : undefined,
  });
  const rows = useMemo(
    () =>
      (feedQuery.data?.pages ?? [])
        .flatMap((page) => page.posts)
        .filter((post) => !removedRef.current.has(post.id)),
    [feedQuery.data],
  );
  const me = feedQuery.data?.pages[0]?.currentUserId ?? null;
  const loading = feedQuery.isLoading;

  const updateRows = useCallback(
    (update: (post: SocialPost) => SocialPost | null) => {
      queryClient.setQueryData<InfiniteData<SocialPage, number>>(queryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            posts: page.posts.flatMap((post) => {
              const next = update(post);
              return next ? [next] : [];
            }),
          })),
        };
      });
    },
    [queryClient, queryKey],
  );

  useEffect(() => {
    removedRef.current.clear();
    // Coalesce realtime bursts so a flood of likes never triggers a refetch storm.
    let timer: number | undefined;
    const queue = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (Date.now() >= muteUntil.current) {
          void queryClient.invalidateQueries({ queryKey });
        }
      }, 500);
    };
    let channel: ReturnType<typeof supabase.channel> | null = null;
    // Subscribe after first paint so the socket handshake doesn't delay render.
    const boot = window.setTimeout(() => {
      channel = supabase
        .channel(`social-${kind}-${userId ?? "all"}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, queue)
        .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, queue)
        .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, queue)
        .subscribe();
    }, 300);
    return () => {
      window.clearTimeout(boot);
      window.clearTimeout(timer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [kind, queryClient, queryKey, userId]);

  const toggleLike = useCallback(
    async (postId: string) => {
      if (!me) throw new Error("Sign in required");
      if (pendingLikes.current.has(postId)) return;
      pendingLikes.current.add(postId);
      muteUntil.current = Date.now() + 1500;
      const current = rows.find((row) => row.id === postId);
      if (!current) return;
      const wasLiked = current.likedByMe;
      updateRows((row) =>
        row.id === postId
          ? {
              ...row,
              likedByMe: !row.likedByMe,
              likeCount: Math.max(0, row.likeCount + (row.likedByMe ? -1 : 1)),
            }
          : row,
      );
      try {
        if (wasLiked) {
          const { error } = await liveSocialTable(supabase, "likes").delete().eq("post_id", postId).eq("user_id", me);
          if (error) {
            throw error;
          }
        } else {
          const { error } = await liveSocialTable(supabase, "likes").upsert(
            { post_id: postId, user_id: me },
            { onConflict: "post_id,user_id", ignoreDuplicates: true },
          );
          if (error) {
            throw error;
          }
        }
      } catch (error) {
        // Realtime reloads are muted briefly after a tap. Roll back directly
        // so an RLS/network failure can never leave a false optimistic like.
        updateRows((row) => {
          if (row.id !== postId) return row;
          const optimisticLiked = row.likedByMe;
          return {
            ...row,
            likedByMe: wasLiked,
            likeCount: Math.max(
              0,
              row.likeCount + (optimisticLiked === wasLiked ? 0 : wasLiked ? 1 : -1),
            ),
          };
        });
        throw error;
      } finally {
        pendingLikes.current.delete(postId);
      }
    },
    [me, rows, updateRows],
  );

  const countView = useCallback(
    async (postId: string) => {
      if (viewedRef.current.has(postId)) return false;
      const current = rows.find((row) => row.id === postId);
      const contentType =
        current?.kind === "reel" ? "reel" : current?.kind === "post" ? "post" : "video";
      const counted = await registerUniqueView(postId, contentType);
      if (!counted) return false;
      viewedRef.current.add(postId);
      updateRows((row) =>
        row.id === postId ? { ...row, views: (row.views ?? 0) + 1 } : row,
      );
      return true;
    },
    [rows, updateRows],
  );

  /** Optimistically bump a post's comment count (call when a comment is posted). */
  const bumpComment = useCallback((postId: string, delta = 1) => {
    muteUntil.current = Date.now() + 1500;
    updateRows((row) =>
      row.id === postId
        ? { ...row, commentCount: Math.max(0, row.commentCount + delta) }
        : row,
    );
  }, [updateRows]);

  const removePost = useCallback((postId: string) => {
    removedRef.current.add(postId);
    updateRows((row) => (row.id === postId ? null : row));
  }, [updateRows]);

  return {
    posts: rows,
    loading,
    currentUserId: me,
    toggleLike,
    countView,
    bumpComment,
    removePost,
    reload: () => feedQuery.refetch(),
    loadMore: () => feedQuery.fetchNextPage(),
    hasNextPage: feedQuery.hasNextPage,
    isFetchingNextPage: feedQuery.isFetchingNextPage,
  };
}

export type DbMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  media_url: string | null;
  voice_note_url: string | null;
  metadata?: Record<string, unknown> | null;
  auto_delete_setting: AutoDeleteSetting;
  auto_delete_mode: AutoDeleteSetting;
  expires_at: string | null;
  is_deleted: boolean;
  is_viewed: boolean;
  viewed_at: string | null;
  is_system_message: boolean;
  conversation_id: string | null;
  moment_id?: string | null;
  moment_media_url?: string | null;
  moment_created_at?: string | null;
  /** UI compatibility field derived from the messages URL columns. */
  media_type: string;
  is_read: boolean;
  created_at: string;
};

type PublicMessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  media_url: string | null;
  voice_note_url: string | null;
  metadata?: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
  auto_delete_setting?: AutoDeleteSetting | null;
  auto_delete_mode?: AutoDeleteSetting | null;
  expires_at?: string | null;
  is_deleted?: boolean | null;
  is_viewed?: boolean;
  viewed_at?: string | null;
  is_system_message?: boolean | null;
  conversation_id?: string | null;
  moment_id?: string | null;
  moment_media_url?: string | null;
  moment_created_at?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function isScreenshotAlertMessage(
  row: Pick<PublicMessageRow, "content" | "metadata" | "is_system_message">,
) {
  const metadata = asRecord(row.metadata);
  return (
    row.is_system_message === true &&
    (metadata?.capture_kind === "screenshot" ||
      /^📸 .*took a screenshot$/.test(row.content?.trim() ?? ""))
  );
}

function momentContextFromRow(row: PublicMessageRow) {
  const metadata = asRecord(row.metadata);
  const preview = asRecord(metadata?.preview);
  const momentId =
    typeof row.moment_id === "string"
      ? row.moment_id
      : typeof metadata?.moment_id === "string"
        ? metadata.moment_id
        : null;
  if (!momentId) {
    return {
      moment_id: null,
      moment_media_url: null,
      moment_created_at: null,
    };
  }
  return {
    moment_id: momentId,
    moment_media_url:
      typeof row.moment_media_url === "string"
        ? row.moment_media_url
        : typeof metadata?.moment_media_url === "string"
          ? metadata.moment_media_url
          : typeof preview?.media_url === "string"
            ? preview.media_url
            : null,
    moment_created_at:
      typeof row.moment_created_at === "string"
        ? row.moment_created_at
        : typeof metadata?.moment_created_at === "string"
          ? metadata.moment_created_at
          : typeof preview?.created_at === "string"
            ? preview.created_at
            : null,
  };
}

const toDbMessage = (row: PublicMessageRow): DbMessage => ({
  id: typeof row.id === "string" ? row.id : "",
  sender_id: typeof row.sender_id === "string" ? row.sender_id : "",
  receiver_id: typeof row.receiver_id === "string" ? row.receiver_id : "",
  content: typeof row.content === "string" ? row.content : "",
  media_url: typeof row.media_url === "string" ? row.media_url : null,
  voice_note_url: typeof row.voice_note_url === "string" ? row.voice_note_url : null,
  metadata: asRecord(row.metadata),
  is_read: row.is_read === true,
  created_at: typeof row.created_at === "string" ? row.created_at : new Date(0).toISOString(),
  ...momentContextFromRow(row),
  auto_delete_setting: row.auto_delete_setting ?? "off",
  auto_delete_mode: row.auto_delete_mode ?? row.auto_delete_setting ?? "off",
  expires_at: row.expires_at ?? null,
  is_deleted: row.is_deleted === true,
  is_viewed: row.is_viewed === true,
  viewed_at: row.viewed_at ?? null,
  is_system_message: row.is_system_message === true,
  conversation_id: row.conversation_id ?? null,
  media_type: row.voice_note_url ? "audio" : row.media_url ? "image" : "text",
});

const isRenderablePublicMessage = (
  row: Pick<
    PublicMessageRow,
    | "sender_id"
    | "receiver_id"
     | "auto_delete_setting"
     | "auto_delete_mode"
    | "expires_at"
     | "is_deleted"
    | "is_viewed"
     | "media_url"
     | "voice_note_url"
     | "metadata"
     | "content"
     | "is_system_message"
  >,
  _viewerId: string | null,
  now = Date.now(),
) =>
  (!row.expires_at || new Date(row.expires_at).getTime() > now) &&
  row.is_deleted !== true &&
  !isScreenshotAlertMessage(row);

function isMissingAutoDeleteColumn(error: unknown): boolean {
  const text =
    typeof error === "string"
      ? error
      : error && typeof error === "object"
        ? String((error as { message?: unknown }).message ?? "")
        : "";
  return /schema cache|does not exist/i.test(text) &&
    /\b(auto_delete_mode|expires_at|is_deleted)\b/i.test(text);
}

type MutationResult = Promise<{ error: { message: string } | null }>;
// Migration 0015 is intentionally newer than generated Supabase types. Keep
// that boundary narrow rather than changing generated files.
const migrationTables = supabase as unknown as {
  from: (table: string) => {
    insert: (values: object) => MutationResult;
    upsert: (values: object, options: { onConflict: string }) => MutationResult;
    delete: () => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => MutationResult;
      };
    };
  };
};

export async function setUserBlock(blockerId: string, blockedId: string, blocked: boolean) {
  const result = blocked
    ? await migrationTables.from("user_blocks").insert({ blocker_id: blockerId, blocked_id: blockedId })
    : await migrationTables.from("user_blocks").delete().eq("blocker_id", blockerId).eq("blocked_id", blockedId);
  return result.error?.message ?? null;
}

export async function reportSocialUser(reporterId: string, reportedUserId: string, threadId: string) {
  const result = await migrationTables.from("user_reports").upsert({
    reporter_id: reporterId,
    reported_user_id: reportedUserId,
    surface: "social",
    thread_id: threadId,
    reason: "User report",
  }, { onConflict: "reporter_id,reported_user_id,surface" });
  return result.error?.message ?? null;
}

/** Uploads a rendered reel and inserts it into the posts table (kind = "reel"). */
export async function publishReel(opts: {
  fileUrl: string;
  file?: Blob | null;
  thumbnail?: Blob | string | null;
  caption?: string;
  hashtags?: string[];
  audio?: string | null;
  allowDownload?: boolean;
  location?: string | null;
  link?: string | null;
  audience?: "everyone" | "close_friends";
  taggedUserIds?: string[];
  viewerUserIds?: string[];
  durationSeconds?: number;
  originalWidth?: number | null;
  originalHeight?: number | null;
  onProgress?: ProgressFn;
}): Promise<{ error: string | null }> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("Could not authorize reel publishing", sessionError);
    return { error: sessionError.message };
  }
  const uid = sessionData.session?.user.id;
  if (!uid) return { error: "You need to sign in to post a reel." };
  if (opts.durationSeconds != null && opts.durationSeconds < MIN_REEL_DURATION_SECONDS) {
    return { error: MIN_REEL_DURATION_MESSAGE };
  }
  if (opts.durationSeconds != null && opts.durationSeconds > MAX_REEL_DURATION_SECONDS) {
    return { error: MAX_REEL_DURATION_MESSAGE };
  }

  let mediaUrl = opts.fileUrl;
  let sourceBlob: Blob | null = opts.file ?? null;

  // Blob/object URLs must be uploaded to storage first.
  if (/^(blob:|data:)/.test(opts.fileUrl)) {
    try {
      const blob = opts.file ?? await (await fetch(opts.fileUrl)).blob();
      sourceBlob = blob;
      const uploadBlob = await optimizeVideoBlob(
        blob,
        (percent, detail) => opts.onProgress?.(Math.round(percent * 0.45), detail),
      );
      const ext = uploadBlob.type.includes("webm") ? "webm" : "mp4";
      const path = `${uid}/${Date.now()}.${ext}`;
      const { url, error: upErr } = await uploadWithProgress(
        STORAGE_BUCKETS.reels,
        path,
        uploadBlob,
        uploadBlob.type || "video/mp4",
        (percent) => opts.onProgress?.(
          45 + Math.round(percent * 0.55),
        ),
        IMMUTABLE_MEDIA_CACHE_CONTROL,
      );
      if (upErr || !url) {
        console.error("Reel storage upload failed", upErr);
        return { error: upErr ?? "Upload failed" };
      }
      mediaUrl = url;
    } catch (e) {
      console.error("Reel upload preparation failed", e);
      return { error: e instanceof Error ? e.message : "Upload failed" };
    }
  } else {
    opts.onProgress?.(100);
  }

  let thumbnailUrl: string | null = null;
  if (opts.thumbnail || sourceBlob) {
    const thumbnail = opts.thumbnail
      ? await uploadVideoThumbnail(opts.thumbnail, uid)
      : await generateAndUploadVideoThumbnail(sourceBlob as Blob, uid);
    if (thumbnail.error) console.warn("Rendered reel thumbnail upload failed", thumbnail.error);
    thumbnailUrl = thumbnail.url;
  }

  const { error } = await writeCompat((payload) => supabase.from("posts").insert(payload as never), {
    user_id: uid,
    kind: "reel",
    media_url: mediaUrl,
    media_type: "video",
    thumbnail_url: thumbnailUrl,
    caption: opts.caption ?? "",
    hashtags: opts.hashtags ?? [],
    audio: opts.audio ?? null,
    allow_download: opts.allowDownload ?? true,
    location: opts.location ?? null,
    link: opts.link ?? null,
    audience: opts.audience ?? "everyone",
    tagged_user_ids: opts.taggedUserIds ?? [],
    viewer_user_ids: opts.viewerUserIds ?? [],
    duration_seconds: opts.durationSeconds ? Math.round(opts.durationSeconds) : null,
    original_width: opts.originalWidth ?? null,
    original_height: opts.originalHeight ?? null,
    source_quality_tier: qualityTierFromDimensions(opts.originalWidth, opts.originalHeight),
  }, { kind: "type" });
  if (error) console.error("Reel database insert failed", error);
  else rememberLocalMedia(mediaUrl, opts.fileUrl);
  return { error: error?.message ?? null };
}

/** Uploads the original reel file without client-side re-encoding or rendering. */
export async function publishDirectReel(opts: {
  file: File;
  title: string;
  caption?: string;
  hashtags?: string[];
  durationSeconds: number;
  originalWidth?: number | null;
  originalHeight?: number | null;
  thumbnail?: Blob | null;
  onProgress?: ProgressFn;
}): Promise<{ error: string | null }> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("Could not authorize direct reel publishing", sessionError);
    return { error: sessionError.message };
  }

  const uid = sessionData.session?.user.id;
  if (!uid) return { error: "You need to sign in to post a reel." };
  if (opts.durationSeconds < MIN_REEL_DURATION_SECONDS) {
    return { error: MIN_REEL_DURATION_MESSAGE };
  }
  if (opts.durationSeconds > MAX_REEL_DURATION_SECONDS) {
    return { error: MAX_REEL_DURATION_MESSAGE };
  }

  const extension = opts.file.name.split(".").pop()?.toLowerCase() || "mp4";
  const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const { url: mediaUrl, error: uploadError } = await uploadWithProgress(
    STORAGE_BUCKETS.reels,
    path,
    opts.file,
    opts.file.type || "video/mp4",
    (percent, detail) => opts.onProgress?.(Math.min(88, Math.round(percent * 0.88)), detail),
    IMMUTABLE_MEDIA_CACHE_CONTROL,
  );
  if (uploadError || !mediaUrl) {
    console.error("Direct reel storage upload failed", uploadError);
    return { error: uploadError ?? "Upload failed" };
  }

  let thumbnailUrl: string | null = null;
  try {
    const thumbnailUpload = opts.thumbnail
      ? await uploadVideoThumbnail(opts.thumbnail, uid, (percent, detail) =>
          opts.onProgress?.(88 + Math.round(percent * 0.1), detail),
        )
      : await generateAndUploadVideoThumbnail(opts.file, uid, (percent, detail) =>
          opts.onProgress?.(88 + Math.round(percent * 0.1), detail),
        );
    if (thumbnailUpload.error || !thumbnailUpload.url) {
      console.warn("Direct reel thumbnail upload failed", thumbnailUpload.error);
    } else {
      thumbnailUrl = thumbnailUpload.url;
    }
  } catch (error) {
    console.warn("Automatic reel thumbnail generation failed", error);
  }

  const { error } = await writeCompat(
    (payload) => supabase.from("posts").insert(payload as never),
    {
      user_id: uid,
      kind: "reel",
      is_reel: true,
      media_url: mediaUrl,
      media_type: "video",
      thumbnail_url: thumbnailUrl,
      title: opts.title.trim(),
      caption: opts.caption?.trim() ?? "",
      hashtags: opts.hashtags ?? [],
      audio: null,
      allow_download: true,
      audience: "everyone",
      tagged_user_ids: [],
      viewer_user_ids: [],
      duration_seconds: Math.round(opts.durationSeconds),
      original_width: opts.originalWidth ?? null,
      original_height: opts.originalHeight ?? null,
      source_quality_tier: qualityTierFromDimensions(
        opts.originalWidth,
        opts.originalHeight,
      ),
    },
    { kind: "type" },
  );
  opts.onProgress?.(100);
  if (error) console.error("Direct reel database insert failed", error);
  return { error: error?.message ?? null };
}

/** Uploads a photo/video and inserts it into the posts table (kind = "post"). */
export async function publishPost(opts: {
  fileUrl: string;
  file?: Blob | null;
  mediaType: "image" | "video";
  caption?: string;
  hashtags?: string[];
  location?: string | null;
  allowDownload?: boolean;
  audience?: "everyone" | "close_friends";
  onProgress?: ProgressFn;
}): Promise<{ error: string | null }> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("Could not authorize post publishing", sessionError);
    return { error: sessionError.message };
  }
  const uid = sessionData.session?.user.id;
  if (!uid) return { error: "You need to sign in to create a post." };

  let mediaUrl = opts.fileUrl;
  let sourceBlob: Blob | null = opts.file ?? null;

  if (/^(blob:|data:)/.test(opts.fileUrl)) {
    try {
      const blob = opts.file ?? await (await fetch(opts.fileUrl)).blob();
      sourceBlob = blob;
      const type = blob.type || (opts.mediaType === "video" ? "video/mp4" : "image/jpeg");
      const uploadBlob = opts.mediaType === "video"
        ? await optimizeVideoBlob(
            blob,
            (percent, detail) => opts.onProgress?.(Math.round(percent * 0.45), detail),
          )
        : blob;
      const uploadType = uploadBlob.type || type;
      const ext = uploadType.split("/")[1]?.split(";")[0] || (opts.mediaType === "video" ? "mp4" : "jpg");
      const path = `${uid}/post-${Date.now()}.${ext}`;
      const { url, error: upErr } = await uploadWithProgress(
        STORAGE_BUCKETS.videos,
        path,
        uploadBlob,
        uploadType,
        (percent) => opts.onProgress?.(
          opts.mediaType === "video" ? 45 + Math.round(percent * 0.55) : percent,
        ),
        opts.mediaType === "video" ? IMMUTABLE_MEDIA_CACHE_CONTROL : undefined,
      );
      if (upErr || !url) {
        console.error("Post storage upload failed", upErr);
        return { error: upErr ?? "Upload failed" };
      }
      mediaUrl = url;
    } catch (e) {
      console.error("Post upload preparation failed", e);
      return { error: e instanceof Error ? e.message : "Upload failed" };
    }
  } else {
    opts.onProgress?.(100);
  }

  let thumbnailUrl: string | null = null;
  if (opts.mediaType === "video" && sourceBlob) {
    const thumbnail = await generateAndUploadVideoThumbnail(sourceBlob, uid);
    if (thumbnail.error) console.warn("Post thumbnail upload failed", thumbnail.error);
    thumbnailUrl = thumbnail.url;
  }

  const { error } = await writeCompat((payload) => supabase.from("posts").insert(payload as never), {
    user_id: uid,
    kind: "post",
    media_url: mediaUrl,
    media_type: opts.mediaType,
    thumbnail_url: thumbnailUrl,
    caption: opts.caption ?? "",
    hashtags: opts.hashtags ?? [],
    location: opts.location ?? null,
    allow_download: opts.allowDownload ?? true,
    audience: opts.audience ?? "everyone",
    tagged_user_ids: [],
    viewer_user_ids: [],
  }, { kind: "type" });
  if (error) console.error("Post database insert failed", error);
  else rememberLocalMedia(mediaUrl, opts.fileUrl);
  return { error: error?.message ?? null };
}

type ConversationRow = {
  id: string;
  auto_delete_setting?: string | null;
};

export async function ensureThreadConversation(
  threadId: string,
  pair: [string, string],
): Promise<ConversationRow | null> {
  const [participantOneId, participantTwoId] = [...pair].sort();
  const existing = await supabase
    .from("conversations" as never)
    .select("id,auto_delete_setting" as never)
    .eq("thread_id" as never, threadId)
    .maybeSingle();
  if (!existing.error && existing.data) {
    return existing.data as unknown as ConversationRow;
  }
  if (existing.error && !/thread_id|schema cache|does not exist/i.test(existing.error.message)) {
    console.error("[social-chat] conversation lookup failed", existing.error);
    return null;
  }

  const created = await supabase
    .from("conversations" as never)
    .upsert({
      thread_id: threadId,
      participant_one_id: participantOneId,
      participant_two_id: participantTwoId,
      auto_delete_setting: "off",
    } as never, { onConflict: "thread_id" })
    .select("id,auto_delete_setting" as never)
    .maybeSingle();
  if (created.error || !created.data) {
    console.error("[social-chat] conversation create failed", created.error);
    return null;
  }
  return created.data as unknown as ConversationRow;
}

/** Live unread incoming-message count for the authenticated user. */
export function useUnreadMessageCount() {
  const [count, setCount] = useState(0);
  const meRef = useRef<string | null>(null);

  const reload = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user.id ?? null;
    meRef.current = uid;
    if (!uid) {
      setCount(0);
      return;
    }

    const { data, error } = await supabase
      .from("messages" as never)
      .select("id" as never)
      .eq("receiver_id" as never, uid)
      .eq("is_read" as never, false);
    if (!error) setCount(Array.isArray(data) ? data.length : 0);
  }, []);

  useEffect(() => {
    void reload();
    const channel = supabase
      .channel(`chat-unread-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
        const row = (payload.new ?? payload.old) as { receiver_id?: string } | null;
        if (row?.receiver_id === meRef.current) void reload();
      })
      .subscribe();
    const onLocalRead = () => void reload();
    const onVisible = () => {
      if (document.visibilityState === "visible") void reload();
    };
    const onAuthChange = () => void reload();
    window.addEventListener("yw:chat-unread-changed", onLocalRead);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);
    const { data: auth } = supabase.auth.onAuthStateChange(onAuthChange);
    return () => {
      window.removeEventListener("yw:chat-unread-changed", onLocalRead);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
      auth.subscription.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [reload]);

  return count;
}

/** Live public.messages records for the canonical two-person route id. */
export function useThreadMessages(threadId: string, _opts: { staleTime?: number } = {}) {
  const pair = useMemo(() => dmThreadPair(threadId), [threadId]);
  const [messages, setMessages] = useState<DbMessage[]>(
    () =>
      (
        loadCachedThreadSync<DbMessage>(`social:${threadId}`) ??
        cacheGet<DbMessage[]>(`thread:${threadId}`) ??
        []
      ).filter((row) => !isScreenshotAlertMessage(row)),
  );
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(pair ? null : "Invalid chat address.");
  const messagesRef = useRef<DbMessage[]>([]);
  const meRef = useRef<string | null>(null);
  const clearChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const deletionChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const clearGenerationRef = useRef(0);
  const afterViewTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  useEffect(() => {
    messagesRef.current = messages;
    const retained = messages.filter((m) => !m.id.startsWith("tmp-")).slice(-40);
    cacheSet(`thread:${threadId}`, retained);
    saveCachedThread(`social:${threadId}`, retained);
  }, [messages, threadId]);

  useEffect(() => {
    let cancelled = false;
    void loadCachedThread<DbMessage>(`social:${threadId}`).then((rows) => {
      if (cancelled || !rows?.length) return;
      setMessages((current) => (current.length ? current : rows.filter((row) => isRenderablePublicMessage(row, meRef.current))));
    });
    return () => {
      cancelled = true;
    };
  }, [threadId]);

  const belongs = useCallback((row: PublicMessageRow) => !!pair &&
    ((row.sender_id === pair[0] && row.receiver_id === pair[1]) || (row.sender_id === pair[1] && row.receiver_id === pair[0])), [pair]);
  const merge = useCallback((rows: PublicMessageRow[]) => setMessages((prev) => {
    const next = new Map(prev.map((m) => [m.id, m]));
    rows
      .filter(belongs)
      .filter((row) => isRenderablePublicMessage(row, meRef.current))
      .map(toDbMessage)
      .forEach((m) => next.set(m.id, m));
    return [...next.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
  }), [belongs]);
  const queryRows = useCallback(async (before?: string) => {
    if (!pair) return [] as PublicMessageRow[];
    try {
      const now = new Date().toISOString();
      const fetchRows = async (withExpiryFilter: boolean, withDeletedFilter: boolean) => {
        let query = supabase.from("messages" as never).select("*" as never)
          .or(`and(sender_id.eq.${pair[0]},receiver_id.eq.${pair[1]}),and(sender_id.eq.${pair[1]},receiver_id.eq.${pair[0]})`);
        if (withExpiryFilter) query = query.or(`expires_at.is.null,expires_at.gt.${now}`);
        if (withDeletedFilter) query = query.eq("is_deleted", false);
        query = query.order("created_at", { ascending: false }).limit(PAGE_SIZE);
        if (before) query = query.lt("created_at", before);
        return await query;
      };

      let result = await fetchRows(true, true);
      if (result.error && isMissingAutoDeleteColumn(result.error)) {
        // Older schemas can still serve messages safely; renderability checks
        // below continue to protect the client when these fields are absent.
        result = await fetchRows(false, false);
      }
      if (result.error) {
        console.error("[social-chat] message fetch failed", result.error);
        throw new Error(result.error.message);
      }
      return (result.data ?? []) as unknown as PublicMessageRow[];
    } catch (cause) {
      console.error("[social-chat] message fetch threw", cause);
      throw cause;
    }
  }, [pair]);
  const load = useCallback(async () => {
    if (!pair) { setLoading(false); return; }
    const generation = clearGenerationRef.current;
    try {
      const rows = await queryRows();
      if (rows === null) return;
      if (generation !== clearGenerationRef.current) return;
      merge(rows);
      setHasMore(rows.length >= PAGE_SIZE);
      setError(null);
    } catch (cause) {
      console.error("[social-chat] message load failed", cause);
      setError(cause instanceof Error ? cause.message : "Couldn't load messages.");
    }
    finally { setLoading(false); }
  }, [pair, queryRows, merge]);
  const loadOlder = useCallback(async () => {
    const oldest = messagesRef.current.filter((m) => !m.id.startsWith("tmp-")).sort((a, b) => a.created_at.localeCompare(b.created_at))[0]?.created_at;
    if (!oldest || loadingMore || !hasMore) return;
    const generation = clearGenerationRef.current;
    setLoadingMore(true);
    try {
      const rows = await queryRows(oldest);
      if (rows === null) return;
      if (generation !== clearGenerationRef.current) return;
      merge(rows);
      setHasMore(rows.length >= PAGE_SIZE);
      setError(null);
    } catch (cause) {
      console.error("[social-chat] older message load failed", cause);
      setError(cause instanceof Error ? cause.message : "Couldn't load older messages.");
    }
    finally { setLoadingMore(false); }
  }, [queryRows, merge, loadingMore, hasMore]);
  useEffect(() => {
    let alive = true;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const bootstrap = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        const id = data.session?.user.id ?? null;
        meRef.current = id;
        setMe(id);
        if (id && pair) {
          const conversation = await ensureThreadConversation(threadId, pair);
          if (!alive) return;
          setConversationId(conversation?.id ?? null);
        } else {
          setConversationId(null);
        }
        void load();
      } catch (cause) {
        console.error("[social-chat] session/bootstrap failed", cause);
        if (alive) setLoading(false);
      }
    };
    void bootstrap();
    const subscribe = () => {
      if (!alive) return;
      channel = supabase
        .channel(`messages-${threadId}-${Math.random().toString(36).slice(2)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
          const row = (payload.new ?? payload.old) as PublicMessageRow;
           if (!row?.id) return;
           if (payload.eventType === "DELETE") {
             setMessages((prev) => prev.filter((m) => m.id !== row.id));
             return;
           }
           if (!belongs(row)) return;
            if (!isRenderablePublicMessage(row, meRef.current)) setMessages((prev) => prev.filter((m) => m.id !== row.id));
          else merge([row]);
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            return;
          }
          if (!["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status) || !alive || retry) return;
          retry = setTimeout(() => {
            retry = null;
            if (channel) {
              void channel.unsubscribe();
              void supabase.removeChannel(channel);
            }
            channel = null;
            subscribe();
          }, 1500);
        });
    };
    subscribe();
    const resyncOnVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    const resyncOnOnline = () => void load();
    document.addEventListener("visibilitychange", resyncOnVisible);
    window.addEventListener("online", resyncOnOnline);
    return () => {
      alive = false;
      if (retry) clearTimeout(retry);
      document.removeEventListener("visibilitychange", resyncOnVisible);
      window.removeEventListener("online", resyncOnOnline);
      if (channel) {
        void channel.unsubscribe();
        void supabase.removeChannel(channel);
      }
    };
  }, [threadId, pair, load, belongs, merge]);
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`social-chat-clear-${conversationId}`)
      .on("broadcast", { event: "chat_cleared" }, ({ payload }) => {
        if (payload?.conversationId !== conversationId) return;
        clearGenerationRef.current += 1;
        afterViewTimersRef.current.forEach((timer) => clearTimeout(timer));
        afterViewTimersRef.current.clear();
        messagesRef.current = [];
        setMessages([]);
        setHasMore(false);
        cacheSet(`thread:${threadId}`, []);
      })
      .subscribe();
    clearChannelRef.current = channel;
    return () => {
      if (clearChannelRef.current === channel) clearChannelRef.current = null;
      void channel.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [conversationId, threadId]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`social-chat-events-${conversationId}`)
      .on("broadcast", { event: "MESSAGE_DELETED" }, ({ payload }) => {
        if (payload?.conversationId !== conversationId || typeof payload?.messageId !== "string") return;
        setMessages((prev) => prev.filter((message) => message.id !== payload.messageId));
        cacheSet(
          `thread:${threadId}`,
          messagesRef.current.filter((message) => message.id !== payload.messageId),
        );
        saveCachedThread(
          `social:${threadId}`,
          messagesRef.current.filter((message) => message.id !== payload.messageId),
        );
      })
      .subscribe();
    deletionChannelRef.current = channel;
    return () => {
      if (deletionChannelRef.current === channel) deletionChannelRef.current = null;
      void channel.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [conversationId, threadId]);
  useEffect(() => {
    const sweep = () => {
      setMessages((prev) => prev.filter((message) => isRenderablePublicMessage(message, meRef.current)));
      void supabase.rpc("delete_expired_chat_messages" as never);
    };
    sweep();
    const timer = window.setInterval(sweep, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const deleteAfterView = useCallback(async (id: string) => {
    if (!me) return false;
    const { data, error: deleteError } = await supabase.rpc(
      "delete_social_message_after_view" as never,
      { _message_id: id } as never,
    );
    if (deleteError) {
      setError(deleteError.message);
      return false;
    }
    if (data !== true) return false;
    const now = Date.now();
    setMessages((prev) => prev.filter((message) =>
      message.id !== id &&
      (!message.expires_at || Date.parse(message.expires_at) > now),
    ));
    return true;
  }, [me]);

  useEffect(() => {
    if (!me) return;
    messages.forEach((message) => {
      if (
        message.receiver_id !== me ||
        message.auto_delete_mode !== "after_view" ||
        !message.is_viewed ||
        message.is_deleted ||
        afterViewTimersRef.current.has(message.id)
      ) {
        return;
      }
      const viewedAt = message.viewed_at ? Date.parse(message.viewed_at) : Date.now();
      const expiresAt = message.expires_at
        ? Date.parse(message.expires_at)
        : viewedAt + AFTER_VIEW_DELAY_MS;
      const delay = Math.max(0, expiresAt - Date.now());
      const timer = setTimeout(() => {
        afterViewTimersRef.current.delete(message.id);
        void deleteAfterView(message.id).then((deleted) => {
          if (deleted) {
            void deletionChannelRef.current?.send({
              type: "broadcast",
              event: "MESSAGE_DELETED",
              payload: { conversationId, messageId: message.id },
            });
          }
        });
      }, delay);
      afterViewTimersRef.current.set(message.id, timer);
    });
  }, [messages, me, conversationId, deleteAfterView]);

  useEffect(() => () => {
    afterViewTimersRef.current.forEach((timer) => clearTimeout(timer));
    afterViewTimersRef.current.clear();
  }, []);

  const send = useCallback(async (payload: {
    content?: string;
    media_url?: string | null;
    voice_note_url?: string | null;
    metadata?: Record<string, unknown> | null;
    expiringMedia?: boolean;
    viewOnce?: boolean;
    autoDeleteSetting?: AutoDeleteSetting;
    autoDeleteMode?: AutoDeleteSetting;
    isSystemMessage?: boolean;
  }) => {
    if (!me || !pair || !pair.includes(me)) return { error: "You are not authorized for this chat." };
    if (!conversationId) return { error: "Chat is still syncing. Try again in a moment." };
    const receiverId = pair.find((id) => id !== me)!;
    const { data: blockRow, error: blockError } = await supabase
      .from("user_blocks" as never)
      .select("blocker_id" as never)
      .or(`and(blocker_id.eq.${me},blocked_id.eq.${receiverId}),and(blocker_id.eq.${receiverId},blocked_id.eq.${me})` as never)
      .limit(1)
      .maybeSingle();
    if (blockError) return { error: blockError.message };
    if (blockRow) return { error: "This conversation is blocked." };
    const conversationResult = await supabase
      .from("conversations" as never)
      .select("auto_delete_setting" as never)
      .eq("id" as never, conversationId)
      .maybeSingle();
    if (conversationResult.error || !conversationResult.data) {
      return { error: conversationResult.error?.message ?? "Could not read chat settings." };
    }
    const conversation = conversationResult.data as unknown as ConversationRow;
    const expiringMedia = Boolean(
      payload.expiringMedia ||
        payload.viewOnce ||
        payload.media_url ||
        payload.voice_note_url,
    );
    const requestedMode =
      payload.autoDeleteMode ??
      payload.autoDeleteSetting ??
      normalizeAutoDeleteSetting(conversation.auto_delete_setting);
    const autoDeleteMode = payload.isSystemMessage
      ? "off"
      : requestedMode === "after_view" && !expiringMedia
        ? "off"
        : payload.viewOnce || payload.expiringMedia
          ? "after_view"
          : requestedMode;
    const metadata = {
      ...(payload.metadata ?? {}),
      ...(expiringMedia ? { expiring_media: true } : {}),
      ...(payload.viewOnce ? { view_once: true } : {}),
    };
    const expiresAt = expiresAtForAutoDelete(autoDeleteMode);
    const tempId = `tmp-${Date.now()}`;
    const optimistic = toDbMessage({
      id: tempId,
      sender_id: me,
      receiver_id: receiverId,
      content: payload.content ?? "",
      media_url: payload.media_url ?? null,
      voice_note_url: payload.voice_note_url ?? null,
      metadata,
      is_read: false,
      created_at: new Date().toISOString(),
      auto_delete_setting: autoDeleteMode,
      auto_delete_mode: autoDeleteMode,
      expires_at: expiresAt,
      is_deleted: false,
      is_viewed: false,
      viewed_at: null,
      is_system_message: payload.isSystemMessage === true,
      conversation_id: conversationId,
    });
    setMessages((prev) => [...prev, optimistic]);
    const { data, error: insertError } = await supabase.from("messages" as never).insert({
      sender_id: me,
      receiver_id: receiverId,
      content: optimistic.content,
      media_url: optimistic.media_url,
      voice_note_url: optimistic.voice_note_url,
       metadata,
      conversation_id: conversationId,
      is_system_message: payload.isSystemMessage === true,
      auto_delete_setting: autoDeleteMode,
      auto_delete_mode: autoDeleteMode,
      expires_at: expiresAt,
      is_deleted: false,
    } as never).select("*").maybeSingle();
    if (insertError) { setMessages((prev) => prev.filter((m) => m.id !== tempId)); setError(insertError.message); return { error: insertError.message }; }
    if (data) merge([data as unknown as PublicMessageRow]);
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
    flagChatMessage({ surface: "social", text: payload.content, threadId, messageId: (data as PublicMessageRow | null)?.id ?? null });
    return { error: null };
  }, [me, pair, threadId, conversationId, merge]);
  const remove = useCallback(async (ids: string[]) => {
    if (!me || !ids.length) return;
    const { error: deleteError } = await supabase.from("messages" as never).delete().in("id", ids).eq("sender_id", me);
    if (deleteError) { setError(deleteError.message); return; }
    setMessages((prev) => prev.filter((m) => !ids.includes(m.id) || m.sender_id !== me));
  }, [me]);
  const clearForEveryone = useCallback(async () => {
    if (!me || !conversationId) {
      return { error: "Chat is still syncing. Try again in a moment." };
    }
    const { error: clearError } = await supabase.rpc(
      "clear_social_conversation" as never,
      { _conversation_id: conversationId } as never,
    );
    if (clearError) {
      setError(clearError.message);
      return { error: clearError.message };
    }
    clearGenerationRef.current += 1;
    afterViewTimersRef.current.forEach((timer) => clearTimeout(timer));
    afterViewTimersRef.current.clear();
    messagesRef.current = [];
    setMessages([]);
    setHasMore(false);
    cacheSet(`thread:${threadId}`, []);
    const channel = clearChannelRef.current;
    if (channel) {
      await channel.send({
        type: "broadcast",
        event: "chat_cleared",
        payload: { conversationId },
      });
    }
    return { error: null };
  }, [conversationId, me, threadId]);
  const markRead = useCallback(async (ids: string[]) => {
    if (!me || !ids.length) return;
    const { error: updateError } = await supabase.from("messages" as never).update({ is_read: true } as never).in("id", ids).eq("receiver_id", me);
    if (updateError) { setError(updateError.message); return; }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("yw:chat-unread-changed"));
    }
    const viewedAt = new Date().toISOString();
    const { error: viewedError } = await supabase
      .from("messages" as never)
      .update({
        is_viewed: true,
        viewed_at: viewedAt,
        expires_at: afterViewExpiresAt(Date.parse(viewedAt)),
      } as never)
      .in("id", ids)
      .eq("receiver_id", me)
      .eq("auto_delete_mode", "after_view")
      .eq("is_deleted", false);
    if (viewedError) { setError(viewedError.message); return; }
    setMessages((prev) => prev
      .map((m) => ids.includes(m.id) && m.receiver_id === me
        ? {
            ...m,
            is_read: true,
            is_viewed: m.auto_delete_mode === "after_view" ? true : m.is_viewed,
            viewed_at: m.auto_delete_mode === "after_view" ? viewedAt : m.viewed_at,
            expires_at: m.auto_delete_mode === "after_view"
              ? afterViewExpiresAt(Date.parse(viewedAt))
              : m.expires_at,
          }
        : m)
      );
  }, [me]);
  return useMemo(() => ({ messages, loading, loadingMore, hasMore, loadOlder, currentUserId: me, conversationId, send, remove, clearForEveryone, markRead, error, reload: load }), [messages, loading, loadingMore, hasMore, loadOlder, me, conversationId, send, remove, clearForEveryone, markRead, error, load]);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Deterministic thread id for a 1:1 chat — identical for both users. */
export function dmThreadId(a: string, b: string) {
  return `dm_${[a, b].sort().join("_")}`;
}

/** Reads the two user ids out of a canonical thread id. */
export function dmThreadPair(threadId: string): [string, string] | null {
  const m = /^dm_([0-9a-f-]{36})_([0-9a-f-]{36})$/i.exec(threadId);
  return m ? [m[1]!, m[2]!] : null;
}

/** Resolves the other participant of a DM thread (id + display name). */
export async function resolveThreadPeer(
  threadId: string,
  me: string | null,
): Promise<{ peerId: string | null; peerName: string; avatarUrl: string | null }> {
  let peerId: string | null = null;

  // Canonical thread ids carry both user ids — no extra round trip needed.
  const pair = dmThreadPair(threadId);
  if (pair) peerId = pair.find((id) => id !== me) ?? pair[0];

  // A thread id can also simply be the peer's user id (legacy deep link).
  if (!peerId && UUID_RE.test(threadId) && threadId !== me) peerId = threadId;

  if (!peerId) return { peerId: null, peerName: "Unknown user", avatarUrl: null };

  const { data: profileRows } = await supabase.rpc("get_public_profiles", {
    ids: [peerId],
  });
  const profile = ((profileRows ?? []) as DbProfile[])[0] ?? null;
  const rawAvatarUrl =
    profile?.avatar_url ||
    profile?.profile_pic ||
    profile?.profile_image ||
    null;

  return {
    peerId,
    peerName:
      profile?.display_name || profile?.username || `User ${peerId.slice(0, 6)}`,
    avatarUrl: rawAvatarUrl ? await resolveMediaUrl(rawAvatarUrl, "avatars") : null,
  };
}

export function useThreadPeer(threadId: string, me: string | null) {
  const [peer, setPeer] = useState<{
    peerId: string | null;
    peerName: string;
    avatarUrl: string | null;
  }>({ peerId: null, peerName: "", avatarUrl: null });

  useEffect(() => {
    let alive = true;
    void resolveThreadPeer(threadId, me).then((p) => {
      if (alive) setPeer(p);
    });
    return () => {
      alive = false;
    };
  }, [threadId, me]);

  return peer;
}

export type PostComment = {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  body: string;
  createdAt: string;
  pinned: boolean;
  pinnedAt: string | null;
  parentCommentId: string | null;
  likesCount: number;
  likedByMe: boolean;
};

export const MAX_PINNED_COMMENTS = 4;

export async function createPostComment(
  postId: string,
  userId: string,
  body: string,
  client: typeof supabase = supabase,
  parentCommentId: string | null = null,
) {
  const text = body.trim();
  if (!text) return { data: null, error: null };
  const basePayload = { post_id: postId, user_id: userId, content: text };
  let result = await liveSocialTable(client, "comments")
    .insert(
      (parentCommentId ? { ...basePayload, parent_comment_id: parentCommentId } : basePayload) as never,
    )
    .select("id,created_at")
    .maybeSingle();
  if (result.error && parentCommentId && missingColumn(result.error)) {
    result = await liveSocialTable(client, "comments")
      .insert(basePayload)
      .select("id,created_at")
      .maybeSingle();
  }
  return {
    data: result.data as { id: string; created_at: string } | null,
    error: result.error as { message: string } | null,
  };
}

export async function deletePostComment(
  id: string,
  client: typeof supabase = supabase,
) {
  const result = await liveSocialTable(client, "comments").delete().eq("id", id);
  return { error: result.error as { message: string } | null };
}


/** Real comments for a post or reel: live fetch, optimistic post, realtime sync. */
export function usePostComments(postId: string | null) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [postOwnerId, setPostOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!postId) {
      setComments([]);
      setLoading(false);
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user.id ?? null;
    setMe(uid);

    const { data: postRow } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .maybeSingle();
    setPostOwnerId(postRow?.user_id ?? null);

    let { data: rows, error: commentsError } = await liveSocialTable(supabase, "comments")
      .select("id,post_id,user_id,content,created_at,parent_comment_id,likes_count")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (missingColumn(commentsError)) {
      const fallback = await liveSocialTable(supabase, "comments")
        .select("id,post_id,user_id,content,created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      rows = fallback.data as typeof rows;
      commentsError = fallback.error;
    }
    if (commentsError) {
      console.error("[usePostComments] unable to load comments", commentsError);
      setComments([]);
      setLoading(false);
      return;
    }

    const commentRows = (rows ?? []) as Array<{
      id: string;
      user_id: string;
      content: string;
      created_at: string;
      parent_comment_id?: string | null;
      likes_count?: number | null;
    }>;
    if (!commentRows.length) {
      setComments([]);
      setLoading(false);
      return;
    }

    const authorIds = [...new Set(commentRows.map((row) => row.user_id))];
    const [{ data: profiles }, likesResult] = await Promise.all([
      supabase.rpc("get_public_profiles", { ids: authorIds }),
      liveCommentLikesTable(supabase)
        .select("comment_id,user_id")
        .in("comment_id", commentRows.map((row) => row.id)),
    ]);
    const likeRows = (likesResult.data ?? []) as Array<{ comment_id: string; user_id: string }>;
    if (likesResult.error) {
      console.error("[usePostComments] unable to load comment likes", likesResult.error);
    }
    const profileById = new Map(
      ((profiles ?? []) as DbProfile[]).map((p) => [p.id, p]),
    );

    const mapped: PostComment[] = commentRows.map((r) => {
      const p = profileById.get(r.user_id);
      return {
        id: r.id,
        userId: r.user_id,
        username: p?.username ?? `user${r.user_id.slice(0, 4)}`,
        displayName: p?.display_name ?? p?.username ?? "YourWorld user",
        avatarUrl: p?.avatar_url ?? null,
         body: r.content,
        createdAt: r.created_at,
        pinned: false,
        pinnedAt: null,
        parentCommentId: r.parent_comment_id ?? null,
        likesCount:
          likeRows.filter((like) => like.comment_id === r.id).length ||
          Number(r.likes_count ?? 0),
        likedByMe: !!uid && likeRows.some((like) => like.comment_id === r.id && like.user_id === uid),
      };
    });

    // Pinned comments always float to the top, oldest pin first.
    mapped.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (a.pinned && b.pinned) return (a.pinnedAt ?? "").localeCompare(b.pinnedAt ?? "");
      return a.createdAt.localeCompare(b.createdAt);
    });

    setComments(mapped);
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    void load();
    if (!postId) return;
    // Unique channel name per hook instance: reusing the same topic across two
    // mounted cards makes supabase-js hand back an already-subscribed channel,
    // which throws "cannot add postgres_changes callbacks after subscribe()".
    const topic = `post-comments-${postId}-${Math.random().toString(36).slice(2)}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(topic)
        .on(
          "postgres_changes",
           { event: "*", schema: "public", table: "comments", filter: `post_id=eq.${postId}` },
          () => void load(),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "comment_likes" },
          () => void load(),
        )
        .subscribe();
    } catch (err) {
      console.error("[usePostComments] realtime unavailable", err);
    }
    return () => {
      const ch = channel;
      channel = null;
      if (ch) setTimeout(() => void supabase.removeChannel(ch), 0);
    };
  }, [postId, load]);


  const sendReply = useCallback(
    async (body: string, parentCommentId: string | null = null) => {
      if (!postId || !me || !body.trim()) return false;
      const text = body.trim();
      const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setComments((prev) => [
        ...prev,
        {
          id: tempId,
          userId: me,
          username: "you",
          displayName: "You",
          avatarUrl: null,
          body: text,
          createdAt: new Date().toISOString(),
          pinned: false,
          pinnedAt: null,
          parentCommentId,
          likesCount: 0,
          likedByMe: false,
        },
      ]);
      const { error } = await createPostComment(postId, me, text, supabase, parentCommentId);
      if (error) {
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        return false;
      }
      void load();
      return true;
    },
    [postId, me, load],
  );

  const send = useCallback(
    async (body: string) => sendReply(body),
    [sendReply],
  );

  const toggleLike = useCallback(
    async (id: string) => {
      if (!me) return false;
      const target = comments.find((comment) => comment.id === id);
      if (!target || id.startsWith("tmp-")) return false;
      const wasLiked = target.likedByMe;
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === id
            ? {
                ...comment,
                likedByMe: !wasLiked,
                likesCount: Math.max(0, comment.likesCount + (wasLiked ? -1 : 1)),
              }
            : comment,
        ),
      );
      const result = wasLiked
        ? await liveCommentLikesTable(supabase).delete().eq("comment_id", id).eq("user_id", me)
        : await liveCommentLikesTable(supabase).upsert(
            { comment_id: id, user_id: me },
            { onConflict: "comment_id,user_id", ignoreDuplicates: true },
          );
      if (result.error) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === id
              ? {
                  ...comment,
                  likedByMe: wasLiked,
                  likesCount: Math.max(0, comment.likesCount + (wasLiked ? 1 : -1)),
                }
              : comment,
          ),
        );
        return false;
      }
      return true;
    },
    [comments, me],
  );

  const isPostOwner = !!me && !!postOwnerId && me === postOwnerId;
  const pinnedCount = comments.filter((c) => c.pinned).length;

  /** Delete my own comment, or — as the post owner — any comment on my post. */
  const remove = useCallback(
    async (id: string) => {
      const snapshot = comments;
      setComments((prev) => prev.filter((c) => c.id !== id));
      const { error } = await deletePostComment(id);
      if (error) setComments(snapshot);
      return !error;
    },
    [comments],
  );

  /** Pinning is unavailable because the live comments table has no pin columns. */
  const togglePin = useCallback(
    async (id: string) => {
      const target = comments.find((c) => c.id === id);
      if (!target || !isPostOwner) return false;
      return false;
    },
    [comments, isPostOwner],
  );

  return {
    comments,
    loading,
    send,
    sendReply,
    toggleLike,
    remove,
    togglePin,
    me,
    postOwnerId,
    isPostOwner,
    pinnedCount,
  };
}

