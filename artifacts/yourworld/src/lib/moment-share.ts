export type SharedMomentKind = "reel" | "video";
export type SharedMomentBucket = "reels" | "videos";

export type SharedMomentContent = {
  kind: SharedMomentKind;
  id: string;
  title: string;
  creatorName: string;
  creatorUsername: string;
};

export type PendingMomentShare = SharedMomentContent & {
  mediaUrl: string;
  mediaBucket: SharedMomentBucket;
  thumbnailUrl?: string | null;
};

export const PENDING_MOMENT_SHARE_KEY = "yw_pending_moment_share";

export function parseSharedMomentContent(value: unknown): SharedMomentContent | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as Record<string, unknown>;
  if (
    (row.kind !== "reel" && row.kind !== "video") ||
    typeof row.id !== "string" ||
    !row.id.trim()
  ) {
    return undefined;
  }
  return {
    kind: row.kind,
    id: row.id,
    title: typeof row.title === "string" ? row.title : "",
    creatorName: typeof row.creatorName === "string" ? row.creatorName : "Creator",
    creatorUsername: typeof row.creatorUsername === "string" ? row.creatorUsername : "",
  };
}

export function writePendingMomentShare(share: PendingMomentShare) {
  if (typeof window === "undefined") throw new Error("Moment sharing is unavailable.");
  window.sessionStorage.setItem(PENDING_MOMENT_SHARE_KEY, JSON.stringify(share));
}

export function readPendingMomentShare(): PendingMomentShare | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(PENDING_MOMENT_SHARE_KEY);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const sharedContent = parseSharedMomentContent(parsed);
    if (
      !sharedContent ||
      typeof parsed.mediaUrl !== "string" ||
      !parsed.mediaUrl.trim() ||
      (parsed.mediaBucket !== "reels" && parsed.mediaBucket !== "videos")
    ) {
      return null;
    }
    return {
      ...sharedContent,
      mediaUrl: parsed.mediaUrl,
      mediaBucket: parsed.mediaBucket,
      thumbnailUrl: typeof parsed.thumbnailUrl === "string" ? parsed.thumbnailUrl : null,
    };
  } catch {
    return null;
  }
}

export function clearPendingMomentShare() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(PENDING_MOMENT_SHARE_KEY);
  }
}
