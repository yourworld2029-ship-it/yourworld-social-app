import type { QueryClient } from "@tanstack/react-query";

const POST_DELETED_EVENT = "yourworld:post-deleted";
const deletedPostIds = new Set<string>();

type PostDeletedDetail = {
  postId: string;
};

function filterInfinitePageCollection(
  data: unknown,
  collection: "posts" | "videos",
  postId: string,
) {
  if (!data || typeof data !== "object") return data;
  const current = data as { pages?: unknown };
  if (!Array.isArray(current.pages)) return data;

  let changed = false;
  const pages = current.pages.map((page) => {
    if (!page || typeof page !== "object") return page;
    const pageRecord = page as Record<string, unknown>;
    const rows = pageRecord[collection];
    if (!Array.isArray(rows)) return page;

    const remainingRows = rows.filter(
      (row) =>
        !row ||
        typeof row !== "object" ||
        (row as { id?: unknown }).id !== postId,
    );
    if (remainingRows.length === rows.length) return page;
    changed = true;
    return { ...pageRecord, [collection]: remainingRows };
  });

  return changed ? { ...current, pages } : data;
}

export function isPostDeleted(postId: string) {
  return typeof window !== "undefined" && deletedPostIds.has(postId);
}

export function announcePostDeleted(postId: string) {
  const normalizedId = postId.trim();
  if (
    !normalizedId ||
    typeof window === "undefined" ||
    deletedPostIds.has(normalizedId)
  ) {
    return;
  }

  deletedPostIds.add(normalizedId);
  window.dispatchEvent(
    new CustomEvent<PostDeletedDetail>(POST_DELETED_EVENT, {
      detail: { postId: normalizedId },
    }),
  );
}

export function announcePostDeletedFromRealtime(payload: unknown) {
  if (!payload || typeof payload !== "object") return;
  const change = payload as {
    eventType?: unknown;
    old?: { id?: unknown };
  };
  if (change.eventType !== "DELETE" || typeof change.old?.id !== "string") return;
  announcePostDeleted(change.old.id);
}

export function subscribeToPostDeleted(listener: (postId: string) => void) {
  if (typeof window === "undefined") return () => undefined;

  const onDeleted = (event: Event) => {
    const detail = (event as CustomEvent<PostDeletedDetail>).detail;
    if (detail && typeof detail.postId === "string") listener(detail.postId);
  };
  window.addEventListener(POST_DELETED_EVENT, onDeleted);
  return () => window.removeEventListener(POST_DELETED_EVENT, onDeleted);
}

export function removeDeletedPostFromQueryCaches(
  queryClient: QueryClient,
  postId: string,
) {
  queryClient.setQueriesData(
    { queryKey: ["social-posts"] },
    (data) => filterInfinitePageCollection(data, "posts", postId),
  );
  queryClient.setQueriesData(
    { queryKey: ["long-videos"] },
    (data) => filterInfinitePageCollection(data, "videos", postId),
  );
}