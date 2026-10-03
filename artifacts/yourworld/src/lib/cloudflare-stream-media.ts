const CLOUDFLARE_STREAM_HOSTS = ["videodelivery.net", "cloudflarestream.com"];

export function cloudflareStreamUidFromUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      !CLOUDFLARE_STREAM_HOSTS.includes(url.hostname) &&
      !url.hostname.endsWith(".cloudflarestream.com")
    ) {
      return null;
    }
    const segments = url.pathname.split("/").filter(Boolean);
    const manifestIndex = segments.indexOf("manifest");
    const uid = manifestIndex > 0 ? segments[manifestIndex - 1] : null;
    if (
      segments[manifestIndex + 1] !== "video.m3u8" ||
      !uid ||
      !/^[a-zA-Z0-9_-]{8,128}$/.test(uid)
    ) {
      return null;
    }
    return uid;
  } catch {
    return null;
  }
}

export function cloudflareStreamPosterUrl(value: string | null | undefined, streamId?: string | null) {
  const uid = validStreamId(streamId) ?? cloudflareStreamUidFromUrl(value);
  return uid
    ? `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg?time=1s&height=720`
    : null;
}

function validStreamId(value?: string | null) {
  return value && /^[a-zA-Z0-9_-]{8,128}$/.test(value) ? value : null;
}

export function cloudflareStreamDownloadUrl(value?: string | null, streamId?: string | null) {
  const uid = validStreamId(streamId) ?? cloudflareStreamUidFromUrl(value);
  return uid ? `https://videodelivery.net/${uid}/downloads/default.mp4` : null;
}