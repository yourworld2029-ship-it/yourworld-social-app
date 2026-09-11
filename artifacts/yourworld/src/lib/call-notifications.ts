const SERVICE_WORKER_URL = "/sw.js";
const BANNER_SHOWN_KEY = "yw-call-notification-banner-shown";

export type CallNotificationDetails = {
  callId: string;
  mode: "audio" | "video";
  peerName: string;
};

export type CallNotificationAction = CallNotificationDetails & {
  action: "accept" | "decline";
};

let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

function toUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

export function hasSeenCallNotificationBanner() {
  try {
    return window.localStorage.getItem(BANNER_SHOWN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markCallNotificationBannerSeen() {
  try {
    window.localStorage.setItem(BANNER_SHOWN_KEY, "1");
  } catch {
    /* Private browsing may deny local storage; the in-memory UI state still applies. */
  }
}

export function registerCallServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }
  registrationPromise ??= navigator.serviceWorker
    .register(SERVICE_WORKER_URL, { scope: "/" })
    .catch((error) => {
      console.error("[call-notifications] service worker registration failed", error);
      return null;
    });
  return registrationPromise;
}

/**
 * Creates a Web Push subscription when the deployment supplies a public VAPID
 * key. The worker still handles provider-delivered pushes without this optional
 * client-side subscription path, and the key is never treated as a secret.
 */
export async function enableCallNotifications() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { permission: "unsupported" as const, subscription: null };
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { permission, subscription: null };
  }
  const registration = await registerCallServiceWorker();
  if (!registration || !("pushManager" in registration)) {
    return { permission, subscription: null };
  }

  const publicKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY as string | undefined;
  if (!publicKey) {
    return { permission, subscription: null };
  }

  try {
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toUint8Array(publicKey),
      }));
    return { permission, subscription };
  } catch (error) {
    console.error("[call-notifications] push subscription failed", error);
    return { permission, subscription: null };
  }
}

export async function getExistingCallPushSubscription() {
  const registration = await registerCallServiceWorker();
  if (!registration || !("pushManager" in registration)) return null;
  try {
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export function serializeCallPushSubscription(subscription: PushSubscription) {
  const json = subscription.toJSON();
  return {
    endpoint: subscription.endpoint,
    subscription: {
      endpoint: subscription.endpoint,
      expirationTime: json.expirationTime ?? null,
      keys: json.keys ?? {},
    },
  };
}

export async function showIncomingCallNotification(details: CallNotificationDetails) {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;
  const registration = await registerCallServiceWorker();
  if (!registration) return false;
  try {
    await registration.showNotification(
      `Incoming ${details.mode === "video" ? "video" : "audio"} call`,
      {
        body: `${details.peerName} is calling you on YourWorld`,
        icon: "/icon-512.png",
        badge: "/favicon.png",
        tag: `yw-call-${details.callId}`,
        renotify: true,
        requireInteraction: true,
        silent: false,
        vibrate: [200, 100, 200, 100, 400],
        // Chromium ignores this non-standard field, while compatible desktop
        // notification hosts can use it to select their default alert sound.
        sound: "default",
        actions: [
          { action: "accept", title: "Accept" },
          { action: "decline", title: "Decline" },
        ],
        data: details,
      } as NotificationOptions & { sound?: string },
    );
    return true;
  } catch (error) {
    console.error("[call-notifications] notification failed", error);
    return false;
  }
}

export function readCallNotificationAction(): CallNotificationAction | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const callId = params.get("callId");
  const action = params.get("callAction");
  const mode = params.get("callMode");
  const peerName = params.get("peerName");
  if (!callId || (action !== "accept" && action !== "decline")) return null;
  if (mode !== "audio" && mode !== "video") return null;
  if (!peerName) return null;
  window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash}`);
  return { callId, action, mode, peerName };
}