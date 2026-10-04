export const PUBLISHED_POST_EVENT = "yw:post-published";
export const OPTIMISTIC_POST_EVENT = "yw:post-optimistic";

export type PublishedPostDetail = {
  id: string;
  kind: "post" | "reel" | "video";
  mediaType?: string;
  optimisticId?: string;
};

export type OptimisticPostDetail = {
  id: string;
  kind: "reel" | "video";
  userId: string;
  mediaUrl: string;
  title: string;
  caption: string;
  hashtags: string[];
  allowDownload: boolean;
  createdAt: string;
  durationSeconds: number;
  originalWidth: number | null;
  originalHeight: number | null;
  thumbnailUrl: string | null;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

type OptimisticPostEvent =
  | { action: "upsert"; post: OptimisticPostDetail }
  | { action: "remove"; id: string };

const optimisticPosts = new Map<string, OptimisticPostDetail>();

export function announcePublishedPost(detail: PublishedPostDetail) {
  if (typeof window === "undefined" || !detail.id) return;
  window.dispatchEvent(new CustomEvent(PUBLISHED_POST_EVENT, { detail }));
}

export function announceOptimisticPost(input: Omit<OptimisticPostDetail, "mediaUrl"> & {
  file: Blob;
}) {
  if (typeof window === "undefined") return null;
  const post: OptimisticPostDetail = {
    ...input,
    mediaUrl: URL.createObjectURL(input.file),
  };
  optimisticPosts.set(post.id, post);
  window.dispatchEvent(
    new CustomEvent<OptimisticPostEvent>(OPTIMISTIC_POST_EVENT, {
      detail: { action: "upsert", post },
    }),
  );
  return post.id;
}

export function removeOptimisticPost(id: string | null | undefined) {
  if (!id) return;
  const post = optimisticPosts.get(id);
  if (!post) return;
  optimisticPosts.delete(id);
  URL.revokeObjectURL(post.mediaUrl);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<OptimisticPostEvent>(OPTIMISTIC_POST_EVENT, {
        detail: { action: "remove", id },
      }),
    );
  }
}

export function getOptimisticPosts() {
  return [...optimisticPosts.values()];
}

export function readOptimisticPostEvent(event: Event): OptimisticPostEvent | null {
  const detail = (event as CustomEvent<unknown>).detail;
  if (!detail || typeof detail !== "object") return null;
  const value = detail as Record<string, unknown>;
  if (value.action === "remove" && typeof value.id === "string") {
    return { action: "remove", id: value.id };
  }
  if (value.action !== "upsert" || !value.post || typeof value.post !== "object") {
    return null;
  }
  const post = value.post as Record<string, unknown>;
  if (
    typeof post.id !== "string" ||
    (post.kind !== "reel" && post.kind !== "video") ||
    typeof post.userId !== "string" ||
    typeof post.mediaUrl !== "string"
  ) {
    return null;
  }
  return { action: "upsert", post: post as unknown as OptimisticPostDetail };
}

export function readPublishedPostEvent(event: Event): PublishedPostDetail | null {
  const detail = (event as CustomEvent<unknown>).detail;
  if (!detail || typeof detail !== "object") return null;
  const value = detail as Record<string, unknown>;
  if (
    typeof value.id !== "string" ||
    !value.id ||
    (value.kind !== "post" && value.kind !== "reel" && value.kind !== "video")
  ) {
    return null;
  }
  return {
    id: value.id,
    kind: value.kind,
    ...(typeof value.mediaType === "string" ? { mediaType: value.mediaType } : {}),
    ...(typeof value.optimisticId === "string" ? { optimisticId: value.optimisticId } : {}),
  };
}

export function prependUniqueFeedItem<T extends { id: string }>(
  items: T[],
  item: T,
  pageSize: number,
): T[] {
  return [item, ...items.filter((current) => current.id !== item.id)].slice(0, pageSize);
}