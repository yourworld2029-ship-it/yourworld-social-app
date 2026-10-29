import type { NotificationItem, NotificationKind } from "@/lib/notifications-store";

export type NotificationFilter =
  | "all"
  | "likes"
  | "following"
  | "followers"
  | "comments"
  | "mentions"
  | "monetization"
  | "verified";

type FilterableNotification = Pick<NotificationItem, "kind" | "actorId">;

const FILTER_KINDS: Record<Exclude<NotificationFilter, "all" | "following">, NotificationKind[]> = {
  likes: ["like"],
  followers: ["follower"],
  comments: ["comment"],
  // Collaboration invitations are tag-like actions and have no separate chip.
  mentions: ["mention", "collaboration"],
  // Channel updates share the Monetization notification preference and filter.
  monetization: ["monetization", "channel"],
  verified: ["verification"],
};

export function matchesNotificationFilter(
  item: FilterableNotification,
  filter: NotificationFilter,
  following: Record<string, boolean>,
) {
  if (filter === "all") return true;
  if (filter === "following") {
    return Boolean(item.actorId && following[item.actorId]);
  }
  return FILTER_KINDS[filter].includes(item.kind);
}
