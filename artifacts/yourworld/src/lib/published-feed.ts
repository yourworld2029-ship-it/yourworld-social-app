export const PUBLISHED_POST_EVENT = "yw:post-published";

export type PublishedPostDetail = {
  id: string;
  kind: "post" | "reel" | "video";
  mediaType?: string;
};

export function announcePublishedPost(detail: PublishedPostDetail) {
  if (typeof window === "undefined" || !detail.id) return;
  window.dispatchEvent(new CustomEvent(PUBLISHED_POST_EVENT, { detail }));
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
  };
}

export function prependUniqueFeedItem<T extends { id: string }>(
  items: T[],
  item: T,
  pageSize: number,
): T[] {
  return [item, ...items.filter((current) => current.id !== item.id)].slice(0, pageSize);
}