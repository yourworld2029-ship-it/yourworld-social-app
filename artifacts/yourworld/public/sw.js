/* YourWorld call and message notification worker. Keep this file dependency-free:
 * it must be installable before the application bundle has loaded. */
const CACHE_NAME = "yourworld-shell-v1";
const VIDEO_DOWNLOAD_CACHE = "yourworld-video-downloads-v1";
const VIDEO_PREFIX_CACHE = "yourworld-video-prefixes-v1";
const PREFIX_TTL_MS = 10 * 60 * 1000;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

async function runVideoDownload(data, clientId) {
  const notify = (message) => {
    if (clientId) {
      self.clients.get(clientId).then((client) => client?.postMessage(message)).catch(() => {});
    }
  };
  try {
    notify({ type: "yw-video-download-started", id: data.id });
    const response = await fetch(data.url, { cache: "force-cache" });
    if (!response.ok) throw new Error(`Video download failed (${response.status})`);
    const total = Number(response.headers.get("content-length")) || 0;
    if (!response.body) throw new Error("Video stream is unavailable");
    const cache = await caches.open(VIDEO_DOWNLOAD_CACHE);
    const cacheResponse = response.clone();
    const fileName = String(data.fileName || "yourworld-video.mp4").replace(/[\r\n"]/g, "_");
    const cachePromise = cache.put(
      data.cacheKey,
      new Response(cacheResponse.body, {
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "video/mp4",
          "Cache-Control": "private, max-age=86400, no-transform",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      }),
    );
    const reader = response.body.getReader();
    let loaded = 0;
    notify({ type: "yw-video-download-progress", id: data.id, percent: 0 });
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      loaded += value.byteLength;
      if (total > 0) {
        notify({
          type: "yw-video-download-progress",
          id: data.id,
          percent: Math.min(99, Math.round((loaded / total) * 100)),
        });
      }
    }
    await cachePromise;
    notify({ type: "yw-video-download-ready", id: data.id });
  } catch (error) {
    notify({
      type: "yw-video-download-error",
      id: data.id,
      error: error instanceof Error ? error.message : "Video download failed",
    });
  }
}

async function videoPrefixKey(url) {
  const parsed = new URL(url);
  parsed.hash = "";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(parsed.toString()),
  );
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `${self.location.origin}/__yourworld-video-prefix/${hash}`;
}

async function serveVideoPrefix(request) {
  try {
    const rangeHeader = request.headers.get("range") || "";
    const match = rangeHeader.match(/^bytes=(\d+)-(\d*)$/i);
    if (!match) return fetch(request);

    const start = Number(match[1]);
    const requestedEnd = match[2] ? Number(match[2]) : Number.MAX_SAFE_INTEGER;
    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(requestedEnd) ||
      requestedEnd < start
    ) {
      return fetch(request);
    }

    const cache = await caches.open(VIDEO_PREFIX_CACHE);
    const key = await videoPrefixKey(request.url);
    const cached = await cache.match(key);
    const expires = Number(cached?.headers.get("X-YW-Prefix-Expires") || 0);
    if (!cached || !Number.isSafeInteger(expires) || expires <= Date.now()) {
      if (cached) await cache.delete(key);
      return fetch(request);
    }

    const prefix = await cached.blob();
    if (start >= prefix.size) return fetch(request);
    const end = Math.min(requestedEnd, prefix.size - 1);
    const total = Number(cached.headers.get("X-YW-Prefix-Total") || 0);
    if (!Number.isSafeInteger(total) || total <= end) return fetch(request);

    return new Response(
      prefix.slice(start, end + 1, cached.headers.get("Content-Type") || "video/mp4"),
      {
        status: 206,
        headers: {
          "Accept-Ranges": "bytes",
          "Cache-Control": "no-store, no-transform",
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Content-Type": cached.headers.get("Content-Type") || "video/mp4",
        },
      },
    );
  } catch {
    // Cache failures must never interrupt the direct Storage/CDN playback path.
    return fetch(request);
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  // Downloads use destination "", and all non-video requests remain untouched.
  if (request.method !== "GET" || request.destination !== "video" || !request.headers.has("range")) {
    return;
  }
  event.respondWith(serveVideoPrefix(request));
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (data?.type !== "yw-start-video-download" || !data.id || !data.url || !data.cacheKey) return;
  event.waitUntil(runVideoDownload(data, event.source && "id" in event.source ? event.source.id : null));
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "You have a new YourWorld notification." };
  }

  // FCM web and APNs-compatible gateways can wrap the same contract in
  // `data`/`notification`; Web Push sends it directly.
  const data = payload.data || {};
  const notification = payload.notification || {};
  const merged = { ...notification, ...data, ...payload };
  const isCall = merged.type === "call" || merged.callId;
  const mode = merged.mode === "video" ? "video" : "audio";
  const peerName = merged.peerName || "YourWorld";
  const title = isCall
    ? merged.title || peerName
    : merged.title || "YourWorld";
  const body = isCall
    ? `Incoming ${mode} call`
    : merged.body || "You have a new notification.";

  const options = {
    body,
    icon: merged.avatarUrl || merged.icon || "/icon-512.png",
    image: isCall ? merged.avatarUrl || undefined : undefined,
    badge: merged.badge || "/favicon.png",
    tag: isCall ? `yw-call-${merged.callId}` : "yourworld-message",
    renotify: true,
    requireInteraction: isCall,
    silent: false,
    vibrate: isCall ? [200, 100, 200, 100, 400] : [100, 50, 100],
    // The Web Notifications API does not standardize a sound property, but
    // hosts that support it can honor this explicit default sound request.
    sound: "default",
    actions: isCall
      ? [
          { action: "accept", title: "Accept" },
          { action: "decline", title: "Decline" },
        ]
      : [{ action: "open", title: "Open" }],
    data: {
      type: isCall ? "call" : "message",
      callId: merged.callId || null,
      mode,
      peerName,
      avatarUrl: merged.avatarUrl || null,
      url: merged.url || "/",
    },
  };

  event.waitUntil(
    (async () => {
      // Realtime/database delivery owns the in-app alert. Avoid creating a
      // duplicate OS notification while a visible YourWorld tab can render it.
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      if (isCall && clients.some((client) => client.visibilityState === "visible")) {
        return;
      }
      await self.registration.showNotification(title, options);
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const data = notification.data || {};
  notification.close();

  const action = event.action || (data.type === "call" ? "accept" : "open");
  const params = new URLSearchParams();
  if (data.callId) {
    params.set("callId", data.callId);
    params.set("callAction", action === "decline" ? "decline" : "accept");
    if (data.mode) params.set("callMode", data.mode);
    if (data.peerName) params.set("peerName", data.peerName);
    if (data.avatarUrl) params.set("avatarUrl", data.avatarUrl);
  }
  const targetUrl = data.callId
    ? `${self.location.origin}/?${params.toString()}`
    : data.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => "focus" in client);
      if (existing) {
        existing.postMessage({
          type: "call-notification-click",
          action: action === "decline" ? "decline" : "accept",
          callId: data.callId || null,
          mode: data.mode || "audio",
          peerName: data.peerName || "YourWorld",
          avatarUrl: data.avatarUrl || null,
        });
        return existing.focus();
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});