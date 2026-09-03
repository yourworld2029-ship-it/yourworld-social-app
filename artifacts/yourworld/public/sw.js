/* YourWorld call and message notification worker. Keep this file dependency-free:
 * it must be installable before the application bundle has loaded. */
const CACHE_NAME = "yourworld-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "You have a new YourWorld notification." };
  }

  const data = payload.data || payload;
  const isCall = data.type === "call" || data.callId;
  const mode = data.mode === "video" ? "video" : "audio";
  const title = isCall
    ? `Incoming ${mode} call`
    : payload.title || "YourWorld";
  const body = isCall
    ? `${data.peerName || "Someone"} is calling you on YourWorld`
    : payload.body || "You have a new notification.";

  const options = {
    body,
    icon: payload.icon || "/icon-512.png",
    badge: payload.badge || "/favicon.png",
    tag: isCall ? `yw-call-${data.callId}` : "yourworld-message",
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
      callId: data.callId || null,
      mode,
      peerName: data.peerName || "YourWorld",
      url: data.url || "/",
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