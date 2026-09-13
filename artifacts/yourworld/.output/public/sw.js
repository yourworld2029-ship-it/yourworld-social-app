/* YourWorld call and message notification worker. Keep this file dependency-free:
 * it must be installable before the application bundle has loaded. */
const CACHE_NAME = "yourworld-shell-v1";
const VIDEO_DOWNLOAD_CACHE = "yourworld-video-downloads-v1";

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
    const cachePromise = cache.put(
      data.cacheKey,
      new Response(cacheResponse.body, {
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "video/mp4",
          "Cache-Control": "private, max-age=86400",
          "Content-Disposition": `attachment; filename="${data.fileName}"`,
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
  const title = isCall
    ? merged.title || `Incoming ${mode} call`
    : merged.title || "YourWorld";
  const body = isCall
    ? `${merged.peerName || "Someone"} is calling you on YourWorld`
    : merged.body || "You have a new notification.";

  const options = {
    body,
    icon: merged.icon || "/icon-512.png",
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
      peerName: merged.peerName || "YourWorld",
      url: merged.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
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
        });
        return existing.focus();
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});