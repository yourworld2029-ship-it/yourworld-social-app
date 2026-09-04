import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cacheGet, cacheSet } from "@/lib/local-cache";
import { PAGE_SIZE } from "@/lib/chat-db";
import { STORAGE_BUCKETS, uploadWithProgress, type ProgressFn } from "@/lib/storage-upload";
import { optimizeVideoBlob } from "@/lib/video-compression";
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

const liveSocialTable = (
  client: typeof supabase,
  table: "likes" | "comments",
) =>
  (client as unknown as {
    from: (name: "likes" | "comments") => ReturnType<typeof supabase.from>;
  }).from(table);

export type DbProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export type DbPost = {
  id: string;
  user_id: string;
  kind: string;
  title?: string | null;
  media_url: string;
  media_type: string;
  thumbnail_url?: string | null;
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
  hide_like_count?: boolean | null;
  hide_share_count?: boolean | null;
  comments_off?: boolean | null;
  pinned?: boolean | null;
  archived?: boolean | null;
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

const signedCache = new Map<string, string>();

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
  if (cached) return cached;

  const path = storagePathFrom(url, bucket);
  if (!path) return url;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24);
  if (error || !data?.signedUrl) return url;
  const next = data.signedUrl;
  signedCache.set(url, next);
  return next;
}

/** Live list of posts of a given kind, with author, like and comment counts. */
export async function loadSocialPosts(
  kind: "post" | "reel",
  client: typeof supabase = supabase,
): Promise<{ posts: SocialPost[]; currentUserId: string | null }> {
  const { data: sessionData } = await client.auth.getSession();
  const uid = sessionData.session?.user.id ?? null;
  let { data: posts, error } = await client
    .from("posts")
    .select("*")
    .eq("kind", kind)
    .order("created_at", { ascending: false })
    .limit(50);

  if (missingColumn(error) === "kind") {
    const legacyKind = kind === "post" ? "story" : kind;
    const legacy = await client
      .from("posts")
      .select("*")
      .eq("type" as "kind", legacyKind)
      .order("created_at", { ascending: false })
      .limit(50);
    posts = legacy.data;
    error = legacy.error;
    if (missingColumn(error) === "type") {
      const unfiltered = await client
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      posts = (unfiltered.data ?? []).filter((row) => postKind(row) === kind);
      error = unfiltered.error;
    }
  }

  if (error || !posts?.length) {
    if (error) console.error(`Unable to load ${kind} feed`, error);
    return { posts: [], currentUserId: uid };
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
    author: toUser(profileById.get(p.user_id), p.user_id),
    authorAvatarUrl: profileById.get(p.user_id)?.avatar_url ?? null,
    likeCount: likeRows.filter((like) => like.post_id === p.id).length,
    commentCount: commentRows.filter((comment) => comment.post_id === p.id).length,
    likedByMe: !!uid && likeRows.some((like) => like.post_id === p.id && like.user_id === uid),
  }));

  return { posts: next, currentUserId: uid };
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

export function useSocialPosts(kind: "post" | "reel") {
  // Keep the server and first client render identical, then hydrate the local
  // cache after mount. Reading localStorage during render breaks mobile SSR.
  const [rows, setRows] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<string | null>(null);
  // While the user is interacting we keep the optimistic state and skip
  // realtime refetches so the UI never flickers back to the old value.
  const muteUntil = useRef(0);
  const pendingLikes = useRef(new Set<string>());
  const viewedRef = useRef(new Set<string>());

  const load = useCallback(async () => {
    if (Date.now() < muteUntil.current) return;
    const next = await loadSocialPosts(kind);
    setMe(next.currentUserId);
    setRows(next.posts);
    setLoading(false);
  }, [kind]);

  useEffect(() => {
    void load();
    // Coalesce realtime bursts so a flood of likes never triggers a refetch storm.
    let timer: number | undefined;
    const queue = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void load(), 500);
    };
    let channel: ReturnType<typeof supabase.channel> | null = null;
    // Subscribe after first paint so the socket handshake doesn't delay render.
    const boot = window.setTimeout(() => {
      channel = supabase
        .channel(`social-${kind}`)
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
  }, [kind, load]);

  const toggleLike = useCallback(
    async (postId: string) => {
      if (!me) throw new Error("Sign in required");
      if (pendingLikes.current.has(postId)) return;
      pendingLikes.current.add(postId);
      muteUntil.current = Date.now() + 1500;
      let wasLiked = false;
      // optimistic, instant
      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== postId) return r;
          wasLiked = !!r.likedByMe;
           return {
             ...r,
             likedByMe: !r.likedByMe,
             likeCount: Math.max(0, r.likeCount + (r.likedByMe ? -1 : 1)),
           };
        }),
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
        setRows((prev) =>
          prev.map((row) => {
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
          }),
        );
        throw error;
      } finally {
        pendingLikes.current.delete(postId);
      }
    },
    [me],
  );

  const countView = useCallback(
    async (postId: string) => {
      if (viewedRef.current.has(postId)) return false;
      const counted = await registerUniqueView(postId, kind);
      if (!counted) return false;
      viewedRef.current.add(postId);
      setRows((prev) =>
        prev.map((row) =>
          row.id === postId ? { ...row, views: (row.views ?? 0) + 1 } : row,
        ),
      );
      return true;
    },
    [kind],
  );

  /** Optimistically bump a post's comment count (call when a comment is posted). */
  const bumpComment = useCallback((postId: string, delta = 1) => {
    muteUntil.current = Date.now() + 1500;
    setRows((prev) =>
      prev.map((r) =>
        r.id === postId
          ? { ...r, commentCount: Math.max(0, r.commentCount + delta) }
          : r,
      ),
    );
  }, []);

  return {
    posts: rows,
    loading,
    currentUserId: me,
    toggleLike,
    countView,
    bumpComment,
    reload: load,
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
};

const toDbMessage = (row: PublicMessageRow): DbMessage => ({
  ...row,
  media_type: row.voice_note_url ? "audio" : row.media_url ? "image" : "text",
});

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

  // Blob/object URLs must be uploaded to storage first.
  if (/^(blob:|data:)/.test(opts.fileUrl)) {
    try {
      const blob = opts.file ?? await (await fetch(opts.fileUrl)).blob();
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

  const { error } = await writeCompat((payload) => supabase.from("posts").insert(payload as never), {
    user_id: uid,
    kind: "reel",
    media_url: mediaUrl,
    media_type: "video",
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

  if (/^(blob:|data:)/.test(opts.fileUrl)) {
    try {
      const blob = opts.file ?? await (await fetch(opts.fileUrl)).blob();
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

  const { error } = await writeCompat((payload) => supabase.from("posts").insert(payload as never), {
    user_id: uid,
    kind: "post",
    media_url: mediaUrl,
    media_type: opts.mediaType,
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

/** Live public.messages records for the canonical two-person route id. */
export function useThreadMessages(threadId: string, _opts: { staleTime?: number } = {}) {
  const pair = dmThreadPair(threadId);
  const [messages, setMessages] = useState<DbMessage[]>(() => cacheGet<DbMessage[]>(`thread:${threadId}`) ?? []);
  const [me, setMe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(pair ? null : "Invalid chat address.");
  const messagesRef = useRef<DbMessage[]>([]);
  useEffect(() => { messagesRef.current = messages; cacheSet(`thread:${threadId}`, messages.filter((m) => !m.id.startsWith("tmp-")).slice(-40)); }, [messages, threadId]);

  const belongs = useCallback((row: PublicMessageRow) => !!pair &&
    ((row.sender_id === pair[0] && row.receiver_id === pair[1]) || (row.sender_id === pair[1] && row.receiver_id === pair[0])), [pair]);
  const merge = useCallback((rows: PublicMessageRow[]) => setMessages((prev) => {
    const next = new Map(prev.filter((m) => m.id.startsWith("tmp-")).map((m) => [m.id, m]));
    rows.filter(belongs).map(toDbMessage).forEach((m) => next.set(m.id, m));
    return [...next.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
  }), [belongs]);
  const queryRows = useCallback(async (before?: string) => {
    if (!pair) return [] as PublicMessageRow[];
    let query = supabase.from("messages" as never).select("id,sender_id,receiver_id,content,media_url,voice_note_url,metadata,is_read,created_at" as never)
      .or(`and(sender_id.eq.${pair[0]},receiver_id.eq.${pair[1]}),and(sender_id.eq.${pair[1]},receiver_id.eq.${pair[0]})`)
      .order("created_at", { ascending: false }).limit(PAGE_SIZE);
    if (before) query = query.lt("created_at", before);
    const { data, error: queryError } = await query;
    if (queryError) throw queryError;
    return (data ?? []) as unknown as PublicMessageRow[];
  }, [pair]);
  const load = useCallback(async () => {
    if (!pair) { setLoading(false); return; }
    try { const rows = await queryRows(); merge(rows); setHasMore(rows.length >= PAGE_SIZE); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load messages."); }
    finally { setLoading(false); }
  }, [pair, queryRows, merge]);
  const loadOlder = useCallback(async () => {
    const oldest = messagesRef.current.filter((m) => !m.id.startsWith("tmp-")).sort((a, b) => a.created_at.localeCompare(b.created_at))[0]?.created_at;
    if (!oldest || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try { const rows = await queryRows(oldest); merge(rows); setHasMore(rows.length >= PAGE_SIZE); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load older messages."); }
    finally { setLoadingMore(false); }
  }, [queryRows, merge, loadingMore, hasMore]);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setMe(data.session?.user.id ?? null));
    void load();
    let alive = true;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const subscribe = () => {
      if (!alive) return;
      channel = supabase
        .channel(`messages-${threadId}-${Math.random().toString(36).slice(2)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
          const row = (payload.new ?? payload.old) as PublicMessageRow;
          if (!row?.id || !belongs(row)) return;
          if (payload.eventType === "DELETE") setMessages((prev) => prev.filter((m) => m.id !== row.id));
          else merge([row]);
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            void load();
            return;
          }
          if (!["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status) || !alive || retry) return;
          retry = setTimeout(() => {
            retry = null;
            if (channel) void supabase.removeChannel(channel);
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
      if (channel) void supabase.removeChannel(channel);
    };
  }, [threadId, load, belongs, merge]);
  const send = useCallback(async (payload: { content?: string; media_url?: string | null; voice_note_url?: string | null }) => {
    if (!me || !pair || !pair.includes(me)) return { error: "You are not authorized for this chat." };
    const receiverId = pair.find((id) => id !== me)!;
    const tempId = `tmp-${Date.now()}`;
    const optimistic = toDbMessage({ id: tempId, sender_id: me, receiver_id: receiverId, content: payload.content ?? "", media_url: payload.media_url ?? null, voice_note_url: payload.voice_note_url ?? null, metadata: {}, is_read: false, created_at: new Date().toISOString() });
    setMessages((prev) => [...prev, optimistic]);
    const { data, error: insertError } = await supabase.from("messages" as never).insert({ sender_id: me, receiver_id: receiverId, content: optimistic.content, media_url: optimistic.media_url, voice_note_url: optimistic.voice_note_url, metadata: {} } as never).select("*").maybeSingle();
    if (insertError) { setMessages((prev) => prev.filter((m) => m.id !== tempId)); setError(insertError.message); return { error: insertError.message }; }
    if (data) merge([data as unknown as PublicMessageRow]);
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
    flagChatMessage({ surface: "social", text: payload.content, threadId, messageId: (data as PublicMessageRow | null)?.id ?? null });
    return { error: null };
  }, [me, pair, threadId, merge]);
  const remove = useCallback(async (ids: string[]) => {
    if (!me || !ids.length) return;
    const { error: deleteError } = await supabase.from("messages" as never).delete().in("id", ids).eq("sender_id", me);
    if (deleteError) { setError(deleteError.message); return; }
    setMessages((prev) => prev.filter((m) => !ids.includes(m.id) || m.sender_id !== me));
  }, [me]);
  const markRead = useCallback(async (ids: string[]) => {
    if (!me || !ids.length) return;
    const { error: updateError } = await supabase.from("messages" as never).update({ is_read: true } as never).in("id", ids).eq("receiver_id", me);
    if (updateError) { setError(updateError.message); return; }
    setMessages((prev) => prev.map((m) => ids.includes(m.id) && m.receiver_id === me ? { ...m, is_read: true } : m));
  }, [me]);
  return useMemo(() => ({ messages, loading, loadingMore, hasMore, loadOlder, currentUserId: me, send, remove, markRead, error, reload: load }), [messages, loading, loadingMore, hasMore, loadOlder, me, send, remove, markRead, error, load]);
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

  return {
    peerId,
    peerName:
      profile?.display_name || profile?.username || `User ${peerId.slice(0, 6)}`,
    avatarUrl: profile?.avatar_url ?? null,
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
};

export const MAX_PINNED_COMMENTS = 4;

export async function createPostComment(
  postId: string,
  userId: string,
  body: string,
  client: typeof supabase = supabase,
) {
  const text = body.trim();
  if (!text) return { data: null, error: null };
  const result = await liveSocialTable(client, "comments")
    .insert({ post_id: postId, user_id: userId, content: text })
    .select("id,created_at")
    .maybeSingle();
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

    const { data: rows } = await liveSocialTable(supabase, "comments")
      .select("id,post_id,user_id,content,created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    const commentRows = (rows ?? []) as Array<{
      id: string;
      user_id: string;
      content: string;
      created_at: string;
    }>;
    if (!commentRows.length) {
      setComments([]);
      setLoading(false);
      return;
    }

    const authorIds = [...new Set(commentRows.map((row) => row.user_id))];
    const { data: profiles } = await supabase.rpc("get_public_profiles", {
      ids: authorIds,
    });
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


  const send = useCallback(
    async (body: string) => {
      if (!postId || !me || !body.trim()) return false;
      const text = body.trim();
      const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      // Optimistic: show the comment instantly.
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
        },
      ]);
      const { error } = await createPostComment(postId, me, text);
      if (error) {
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        return false;
      } else {
        // Replace the optimistic row with the real one (keeps order).
        void load();
      }
      return true;
    },
    [postId, me, load],
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

  return { comments, loading, send, remove, togglePin, me, postOwnerId, isPostOwner, pinnedCount };
}

