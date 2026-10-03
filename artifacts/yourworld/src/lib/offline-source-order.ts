/** Authorized API responses are retained even when an active source wins. */
export function orderedOfflineSources(input: {
  authorizedUrl?: string | null;
  cloudflareUrl?: string | null;
  activeUrl?: string | null;
  storageUrl?: string | null;
}) {
  let signedCloudflare: string | null = null;
  if (input.authorizedUrl) {
    try {
      const url = new URL(input.authorizedUrl);
      if (/(^|\.)(videodelivery\.net|cloudflarestream\.com)$/i.test(url.hostname) &&
        url.pathname.endsWith("/downloads/default.mp4")) signedCloudflare = input.authorizedUrl;
    } catch { /* Invalid URLs are excluded below. */ }
  }
  return [...new Set([
    signedCloudflare || input.cloudflareUrl,
    input.activeUrl,
    input.authorizedUrl,
    input.storageUrl,
  ].filter((url): url is string => !!url && /^https?:\/\//i.test(url)))];
}