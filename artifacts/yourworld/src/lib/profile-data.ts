import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { STORAGE_BUCKETS, uploadWithProgress, type ProgressFn } from "@/lib/storage-upload";
import { resolveMediaUrl, type DbPost } from "@/lib/social-data";
import { normalizePostRow, writeCompat } from "@/lib/supabase-compat";

export type MyProfile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  category: string;
  location: string;
  website: string;
  avatar_url: string | null;
  cover_url: string | null;
  is_verified: boolean;
  verification_requested: boolean;
};

export type MyProfileEdit = {
  name: string;
  username: string;
  category: string;
  bio: string;
  location?: string;
  website?: string;
  avatarUrl?: string;
  coverUrl?: string;
  avatarFile?: File;
  coverFile?: File;
  verificationRequested?: boolean;
  isVerified?: boolean;
};

export type SportsDocument = {
  path: string;
  name: string;
  mimeType: string;
  size: number | null;
  updatedAt: string | null;
};

type StorageDocument = {
  id: string | null;
  name: string;
  metadata?: { mimetype?: string; size?: number };
  updated_at?: string | null;
  created_at?: string | null;
};

const empty: MyProfile = {
  id: "",
  username: "",
  display_name: "",
  bio: "",
  category: "",
  location: "",
  website: "",
  avatar_url: null,
  cover_url: null,
  is_verified: false,
  verification_requested: false,
};

async function signedIfNeeded(url: string | null) {
  if (!url) return null;
  return resolveMediaUrl(url, "avatars");
}

async function requireDocumentOwner(ownerId: string) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  if (data.session?.user.id !== ownerId) {
    throw new Error("Only the document owner can access sports documents.");
  }
}

export async function listSportsDocuments(ownerId: string): Promise<SportsDocument[]> {
  await requireDocumentOwner(ownerId);
  const files = await listSportsDocumentFiles(ownerId);

  return files
    .filter((file) => Boolean(file.id && file.name))
    .map((file) => ({
      path: `${ownerId}/${file.name}`,
      name: file.name,
      mimeType: file.metadata?.mimetype ?? "application/octet-stream",
      size: typeof file.metadata?.size === "number" ? file.metadata.size : null,
      updatedAt: file.updated_at ?? file.created_at ?? null,
    }));
}

async function listSportsDocumentFiles(ownerId: string): Promise<StorageDocument[]> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.documents)
    .list(ownerId, {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });
  if (error) throw new Error(error.message);
  return (data ?? []) as StorageDocument[];
}

function safeDocumentFileName(name: string) {
  const baseName = name.split(/[\\/]/).at(-1)?.trim() || "certificate";
  return (
    baseName
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || "certificate"
  );
}

export async function uploadSportsDocument(ownerId: string, file: File): Promise<SportsDocument> {
  await requireDocumentOwner(ownerId);
  const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
  if (!allowedTypes.has(file.type)) {
    throw new Error("Upload a PDF, JPG, or PNG certificate.");
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("Certificates must be 15 MB or smaller.");
  }

  const name = safeDocumentFileName(file.name);
  const path = `${ownerId}/${Date.now()}-${name}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKETS.documents).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  return {
    path,
    name,
    mimeType: file.type,
    size: file.size,
    updatedAt: new Date().toISOString(),
  };
}

export async function createSportsDocumentSignedUrl(ownerId: string, path: string) {
  await requireDocumentOwner(ownerId);
  if (!path.startsWith(`${ownerId}/`) || path.includes("..")) {
    throw new Error("Invalid sports document path.");
  }
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.documents)
    .createSignedUrl(path, 60 * 5);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "This document is unavailable.");
  }
  return data.signedUrl;
}

export async function deleteSportsDocument(ownerId: string, path: string) {
  await requireDocumentOwner(ownerId);
  if (!path.startsWith(`${ownerId}/`) || path.includes("..")) {
    throw new Error("Invalid sports document path.");
  }
  const { error } = await supabase.storage.from(STORAGE_BUCKETS.documents).remove([path]);
  if (error) throw new Error(error.message);
}

function safeSportsIntroductionFileName(name: string) {
  const baseName = name.split(/[\\/]/).at(-1)?.trim() || "sports-introduction";
  return (
    baseName
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || "sports-introduction"
  );
}

export async function validateSportsIntroductionVideo(file: File) {
  if (!file.type.startsWith("video/")) {
    throw new Error("Upload a video for your Sports Introduction.");
  }
  if (file.size > 100 * 1024 * 1024) {
    throw new Error("Sports Introduction videos must be 100 MB or smaller.");
  }

  const previewUrl = URL.createObjectURL(file);
  try {
    const metadata = await new Promise<{ duration: number; width: number; height: number }>(
      (resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () =>
          resolve({
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
          });
        video.onerror = () => reject(new Error("This video could not be read."));
        video.src = previewUrl;
      },
    );
    if (!Number.isFinite(metadata.duration) || metadata.duration <= 0) {
      throw new Error("This video duration could not be read.");
    }
    if (metadata.duration > 90) {
      throw new Error("Sports Introduction videos must be 90 seconds or shorter.");
    }
    if (metadata.width <= 0 || metadata.height <= 0 || metadata.height <= metadata.width) {
      throw new Error("Sports Introduction videos must be vertical.");
    }
  } finally {
    URL.revokeObjectURL(previewUrl);
  }
}

export async function uploadSportsIntroduction(
  ownerId: string,
  file: File,
  onProgress?: ProgressFn,
) {
  await requireDocumentOwner(ownerId);
  await validateSportsIntroductionVideo(file);
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
  const path = `${ownerId}/sports-introduction/${Date.now()}-${safeSportsIntroductionFileName(
    file.name.replace(/\.[^.]+$/, ""),
  )}.${extension}`;
  const result = await uploadWithProgress(
    STORAGE_BUCKETS.videos,
    path,
    file,
    file.type,
    onProgress,
    "86400",
  );
  if (result.error) throw new Error(result.error);
  return path;
}

export async function deleteSportsIntroduction(ownerId: string, path: string) {
  await requireDocumentOwner(ownerId);
  if (!path.startsWith(`${ownerId}/sports-introduction/`) || path.includes("..")) {
    throw new Error("Invalid Sports Introduction path.");
  }
  const { error } = await supabase.storage.from(STORAGE_BUCKETS.videos).remove([path]);
  if (error) throw new Error(error.message);
}

/** Real signed-in profile: row from the database plus the user's own media. */
export function useMyProfile() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<MyProfile>(empty);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [coverSrc, setCoverSrc] = useState<string | null>(null);
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<DbPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user.id ?? null;
    setUserId(uid);
    if (!uid) {
      setProfile(empty);
      setPosts([]);
      setSavedPosts([]);
      setLoading(false);
      return;
    }

    const [{ data: row }, { data: myPosts }, { data: saves }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase
        .from("posts")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("post_saves").select("post_id").eq("user_id", uid),
    ]);
    const savedIds = ((saves ?? []) as { post_id: string }[]).map((s) => s.post_id);
    const savedResult = savedIds.length
      ? await supabase.from("posts").select("*").in("id", savedIds).limit(200)
      : { data: [], error: null };

    const email = sessionData.session?.user.email ?? "";
    const next: MyProfile = {
      id: uid,
      username: row?.username ?? email.split("@")[0] ?? `user${uid.slice(0, 4)}`,
      display_name: row?.display_name ?? row?.username ?? "YourWorld user",
      bio: row?.bio ?? "",
      category: row?.category ?? "",
      location: row?.location ?? "",
      website: row?.website ?? "",
      avatar_url: row?.avatar_url ?? null,
      cover_url: row?.cover_url ?? null,
      is_verified: row?.is_verified === true,
      verification_requested: row?.verification_requested === true,
    };
    setProfile(next);
    setPosts((myPosts ?? []).map(normalizePostRow) as DbPost[]);
    setSavedPosts(
      (savedResult.data ?? [])
        .map(normalizePostRow)
        .filter((post) => post.kind === "video" || post.kind === "reel") as DbPost[],
    );
    setAvatarSrc(await signedIfNeeded(next.avatar_url));
    setCoverSrc(await signedIfNeeded(next.cover_url));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => void load());
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const uploadImage = useCallback(
    async (file: File, kind: "avatar" | "cover", uid: string) => {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${uid}/${kind}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type || "image/jpeg", upsert: true });
      if (error) {
        console.error("Profile image upload failed", error);
        throw new Error(error.message);
      }
      return path;
    },
    [],
  );

  const save = useCallback(
    async (edit: MyProfileEdit) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user.id;
      if (!uid) throw new Error("Sign in to update your profile");

      let avatarPath = profile.avatar_url;
      let coverPath = profile.cover_url;
      if (edit.avatarFile) avatarPath = await uploadImage(edit.avatarFile, "avatar", uid);
      if (edit.coverFile) coverPath = await uploadImage(edit.coverFile, "cover", uid);

      const { error } = await writeCompat(
        (payload) => supabase.from("profiles").upsert(payload as never, { onConflict: "id" }),
        {
          id: uid,
          username: edit.username || null,
          display_name: edit.name || null,
          bio: edit.bio || null,
          category: edit.category || null,
          location: edit.location || null,
          website: edit.website || null,
          avatar_url: avatarPath,
          cover_url: coverPath,
          is_verified: edit.isVerified ?? profile.is_verified,
          verification_requested: edit.verificationRequested ?? profile.verification_requested,
        },
      );
      if (error) {
        console.error("Profile update failed", error);
        throw new Error(error.message);
      }
      await load();
    },
    [profile.avatar_url, profile.cover_url, profile.verification_requested, uploadImage, load],
  );

  const grid = useMemo(
    () =>
      posts.filter(
        (p) =>
          p.kind === "video" ||
          (p.kind !== "reel" && p.media_type?.startsWith("video")),
      ),
    [posts],
  );
  const reels = useMemo(() => posts.filter((p) => p.kind === "reel"), [posts]);

  return {
    userId,
    profile,
    avatarSrc,
    coverSrc,
    posts,
    savedPosts,
    grid,
    reels,
    loading,
    save,
    reload: load,
  };
}

/** Update a post/reel you own (caption, hashtags, location, download flag). */
export async function updateMyPost(
  postId: string,
  patch: {
    title?: string;
    caption?: string;
    location?: string | null;
    allow_download?: boolean;
    hide_like_count?: boolean;
    hide_share_count?: boolean;
    comments_off?: boolean;
    pinned?: boolean;
    archived?: boolean;
  },
) {
  const next: {
    title?: string;
    caption?: string;
    hashtags?: string[];
    location?: string | null;
    allow_download?: boolean;
    hide_like_count?: boolean;
    hide_share_count?: boolean;
    comments_off?: boolean;
    pinned?: boolean;
    archived?: boolean;
  } = {};

  if (patch.title !== undefined) next.title = patch.title.trim();
  if (patch.caption !== undefined) {
    next.caption = patch.caption;
    next.hashtags = Array.from(
      new Set((patch.caption.match(/#[\p{L}\p{N}_]+/gu) ?? []).map((h) => h.slice(1))),
    );
  }
  if (patch.location !== undefined) next.location = patch.location;
  if (patch.allow_download !== undefined) next.allow_download = patch.allow_download;
  if (patch.hide_like_count !== undefined) next.hide_like_count = patch.hide_like_count;
  if (patch.hide_share_count !== undefined) next.hide_share_count = patch.hide_share_count;
  if (patch.comments_off !== undefined) next.comments_off = patch.comments_off;
  if (patch.pinned !== undefined) next.pinned = patch.pinned;
  if (patch.archived !== undefined) next.archived = patch.archived;

  const { error } = await supabase.from("posts").update(next).eq("id", postId);
  if (error) {
    console.error("Post update failed", error);
    throw new Error(error.message);
  }
}


/** Permanently delete a post/reel you own, plus its stored media file. */
export async function deleteMyPost(post: { id: string; media_url: string; kind: string }) {
  const bucket =
    post.kind === "reel" ? STORAGE_BUCKETS.reels : STORAGE_BUCKETS.videos;
  const url = post.media_url ?? "";
  if (url && !/^(blob:|data:)/.test(url)) {
    const path = /^https?:/.test(url)
      ? url.match(new RegExp(`/storage/v1/object/(?:sign|public)/${bucket}/([^?]+)`))?.[1]
      : url.replace(/^\/+/, "");
    if (path) {
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([decodeURIComponent(path)]);
      if (storageError) {
        console.error(`Failed to remove media from ${bucket}`, storageError);
      }
    }
  }
  const { error } = await supabase.from("posts").delete().eq("id", post.id);
  if (error) {
    console.error("Post deletion failed", error);
    throw new Error(error.message);
  }
}

/** Resolves a stored media reference to something an <img> can render. */

export function useResolvedMedia(urls: string[], bucket = "reels") {
  const [map, setMap] = useState<Record<string, string>>({});
  const key = urls.join("|");

  useEffect(() => {
    let alive = true;
    void Promise.all(
      urls.map(async (u) => [u, await resolveMediaUrl(u, bucket)] as const),
    ).then((pairs) => {
      if (alive) setMap(Object.fromEntries(pairs));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, bucket]);

  return map;
}
