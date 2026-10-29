export type NotificationDestination =
  | { kind: "chat"; threadId: string }
  | { kind: "video"; videoId: string; focusComments: boolean; commentId?: string }
  | {
      kind: "reels";
      initialVideoId: string;
      focusComments: boolean;
      commentId?: string;
    }
  | { kind: "profile"; userId: string }
  | { kind: "moment"; momentId: string }
  | { kind: "notifications" };

/** Server state is ready on the first notification render; local writes take precedence. */
export function resolveNotificationCommentLikeState(
  serverLiked: boolean | undefined,
  optimisticOverride: boolean | undefined,
) {
  return optimisticOverride ?? serverLiked ?? false;
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const UUID_PATTERN = new RegExp(`^${UUID}$`, "i");
const DM_THREAD_PATTERN = new RegExp(`^dm_${UUID}_${UUID}$`, "i");
const SAFE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

function safeId(value: string | null) {
  if (!value) return null;
  try {
    const decoded = decodeURIComponent(value);
    return SAFE_ID_PATTERN.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

/** Only resolve local YourWorld routes carried by a notification payload. */
export function resolveNotificationDestination(
  rawUrl: string | null | undefined,
): NotificationDestination | null {
  if (!rawUrl || !rawUrl.startsWith("/") || rawUrl.startsWith("//")) return null;

  let url: URL;
  try {
    url = new URL(rawUrl, "https://yourworld.invalid");
  } catch {
    return null;
  }
  if (url.origin !== "https://yourworld.invalid") return null;

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 1 && segments[0] === "notifications") {
    return { kind: "notifications" };
  }

  if (segments.length === 2 && segments[0] === "chat") {
    const threadId = safeId(segments[1] ?? "");
    if (threadId && (UUID_PATTERN.test(threadId) || DM_THREAD_PATTERN.test(threadId))) {
      return { kind: "chat", threadId };
    }
    return null;
  }

  if (segments.length === 1 && segments[0] === "reels") {
    const initialVideoId = safeId(
      url.searchParams.get("initialVideoId") ?? url.searchParams.get("reelId"),
    );
    if (!initialVideoId) return null;
    const commentId = safeId(url.searchParams.get("commentId"));
    return {
      kind: "reels",
      initialVideoId,
      focusComments: url.searchParams.get("focusComments") === "true",
      ...(commentId ? { commentId } : {}),
    };
  }

  if (segments.length === 2 && (segments[0] === "video" || segments[0] === "post")) {
    const videoId = safeId(segments[1] ?? "");
    if (!videoId) return null;
    const commentId = safeId(url.searchParams.get("commentId"));
    return {
      kind: "video",
      videoId,
      focusComments: url.searchParams.get("focusComments") === "true",
      ...(commentId ? { commentId } : {}),
    };
  }

  if (segments.length === 2 && segments[0] === "u") {
    const userId = safeId(segments[1] ?? "");
    return userId ? { kind: "profile", userId } : null;
  }

  if (segments.length === 2 && segments[0] === "moment") {
    const momentId = safeId(segments[1] ?? "");
    return momentId ? { kind: "moment", momentId } : null;
  }

  return null;
}
