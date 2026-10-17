import type { LiveProfile } from "@/lib/live-data";

export type LivePresenceMeta = {
  user_id: string;
  peer_id: string;
  role: "broadcaster" | "viewer";
  username: string;
  avatar_url: string | null;
};

export type LiveViewerIdentity = {
  peerId: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
};

export function resolveLiveViewerIdentities(
  entries: LivePresenceMeta[],
  profiles: ReadonlyMap<string, LiveProfile>,
): LiveViewerIdentity[] {
  const uniqueViewers = new Map<string, LivePresenceMeta>();
  for (const entry of entries) {
    if (entry.role !== "viewer") continue;
    uniqueViewers.set(entry.user_id || entry.peer_id, entry);
  }

  return [...uniqueViewers.values()].map((entry) => {
    const profile = profiles.get(entry.user_id);
    return {
      peerId: entry.peer_id,
      userId: entry.user_id,
      username: profile?.username || entry.username || "YourWorld user",
      avatarUrl: profile?.avatar_url ?? entry.avatar_url ?? null,
    };
  });
}
