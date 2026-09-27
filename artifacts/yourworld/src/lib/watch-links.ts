export type WatchContentKind = "video" | "reel";

export const APK_DOWNLOAD_PATH = "/yourworld-v3.apk";

export function buildWatchShareUrl(id: string, kind: WatchContentKind) {
  const path = `/watch/${encodeURIComponent(id)}?type=${kind}`;
  return typeof window === "undefined" ? path : `${window.location.origin}${path}`;
}

export function parseWatchShareUrl(value: string) {
  try {
    const url = new URL(value);
    const match = /^\/watch\/([^/]+)\/?$/.exec(url.pathname);
    if (!match) return null;

    const id = decodeURIComponent(match[1]).trim();
    if (!id || !/^[a-zA-Z0-9-]+$/.test(id)) return null;

    const type = url.searchParams.get("type");
    return {
      id,
      kind: type === "reel" ? "reel" as const : "video" as const,
    };
  } catch {
    return null;
  }
}