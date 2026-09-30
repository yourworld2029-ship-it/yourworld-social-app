/* YourWorld call and message notification worker. Keep this file dependency-free:
 * it must be installable before the application bundle has loaded. */
const VIDEO_PREFIX_CACHE = "yourworld-video-prefixes-v1";
const PREFIX_TTL_MS = 10 * 60 * 1000;
const VIDEO_RANGE_CACHE = "yourworld-video-ranges-v1";
const MAX_CACHED_RANGE_BYTES = 2 * 1024 * 1024;
const MAX_CACHED_RANGE_ENTRIES = 128;
const inFlightRanges = new Map();

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

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

async function videoRangeKey(request) {
  const value = `${request.url}\n${request.headers.get("range") || ""}`;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `${self.location.origin}/__yourworld-video-range/${hash}`;
}

function isPublicSupabaseVideo(url) {
  try {
    return new URL(url).pathname.includes("/storage/v1/object/public/");
  } catch {
    return false;
  }
}

async function fetchAndCachePublicRange(request) {
  if (!isPublicSupabaseVideo(request.url) || typeof crypto === "undefined" || !crypto.subtle) {
    return fetch(request);
  }

  let key;
  let cache;
  try {
    key = await videoRangeKey(request);
    cache = await caches.open(VIDEO_RANGE_CACHE);
    const cached = await cache.match(key);
    if (cached) return cached;
  } catch {
    return fetch(request);
  }

  const existing = inFlightRanges.get(key);
  if (existing) return (await existing).clone();

  const pending = (async () => {
    const response = await fetch(request);
    if (response.status !== 206 || /no-store/i.test(response.headers.get("cache-control") || "")) {
      return response;
    }

    const requested = (request.headers.get("range") || "").match(/^bytes=(\d+)-(\d*)$/i);
    const actual = response.headers.get("content-range")?.match(/^bytes\s+(\d+)-(\d+)\/(\d+)$/i);
    const contentLength = Number(response.headers.get("content-length"));
    if (!requested || !actual || !Number.isSafeInteger(contentLength)) return response;

    const requestedStart = Number(requested[1]);
    const requestedEnd = requested[2] ? Number(requested[2]) : Number.MAX_SAFE_INTEGER;
    const actualStart = Number(actual[1]);
    const actualEnd = Number(actual[2]);
    const total = Number(actual[3]);
    if (
      actualStart !== requestedStart ||
      !Number.isSafeInteger(requestedStart) ||
      !Number.isSafeInteger(requestedEnd) ||
      !Number.isSafeInteger(actualStart) ||
      !Number.isSafeInteger(actualEnd) ||
      !Number.isSafeInteger(total) ||
      actualEnd < actualStart ||
      actualEnd > requestedEnd ||
      total <= actualEnd ||
      contentLength !== actualEnd - actualStart + 1 ||
      contentLength > MAX_CACHED_RANGE_BYTES
    ) {
      return response;
    }

    try {
      await cache.put(key, response.clone());
      const keys = await cache.keys();
      const overflow = Math.max(0, keys.length - MAX_CACHED_RANGE_ENTRIES);
      for (const oldest of keys.slice(0, overflow)) {
        await cache.delete(oldest);
      }
    } catch {
      // Cache quota errors must not affect the active playback response.
    }
    return response;
  })();

  inFlightRanges.set(key, pending);
  try {
    return (await pending).clone();
  } finally {
    if (inFlightRanges.get(key) === pending) inFlightRanges.delete(key);
  }
}

async function serveVideoPrefix(request) {
  try {
    const rangeHeader = request.headers.get("range") || "";
    const match = rangeHeader.match(/^bytes=(\d+)-(\d*)$/i);
    if (!match) return fetchAndCachePublicRange(request);

    const start = Number(match[1]);
    const requestedEnd = match[2] ? Number(match[2]) : Number.MAX_SAFE_INTEGER;
    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(requestedEnd) ||
      requestedEnd < start
    ) {
      return fetchAndCachePublicRange(request);
    }

    const cache = await caches.open(VIDEO_PREFIX_CACHE);
    const key = await videoPrefixKey(request.url);
    const cached = await cache.match(key);
    const expires = Number(cached?.headers.get("X-YW-Prefix-Expires") || 0);
    if (!cached || !Number.isSafeInteger(expires) || expires <= Date.now()) {
      if (cached) await cache.delete(key);
      return fetchAndCachePublicRange(request);
    }

    const prefix = await cached.blob();
    if (start >= prefix.size) return fetchAndCachePublicRange(request);
    const end = Math.min(requestedEnd, prefix.size - 1);
    const total = Number(cached.headers.get("X-YW-Prefix-Total") || 0);
    if (!Number.isSafeInteger(total) || total <= end) return fetchAndCachePublicRange(request);

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
    return fetchAndCachePublicRange(request);
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
  // Message-push producers must pass the recipient-specific lock state. Keep
  // ordinary notifications unchanged, but never show a locked-chat push.
  if (!isCall && merged.secretLocked === true) return;
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