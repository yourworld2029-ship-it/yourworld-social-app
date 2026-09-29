import {
  Capacitor,
  registerPlugin,
  type PluginListenerHandle,
} from "@capacitor/core";
import { useEffect, useLayoutEffect, useState } from "react";

interface PrivacyBridgePlugin {
  setScreenSecurity(options: { enabled: boolean }): Promise<void>;
  setCaptureMonitoring(options: { enabled: boolean }): Promise<void>;
  requestStartupRuntimePermissions(): Promise<void>;
  addListener(
    eventName: "capture",
    listenerFunc: (event: { kind?: unknown }) => void,
  ): Promise<PluginListenerHandle>;
  requestCallMediaPermissions(options: {
    mode: "audio" | "video";
  }): Promise<{ granted: boolean }>;
}

const privacyBridge = registerPlugin<PrivacyBridgePlugin>("PrivacyBridge");
const STARTUP_PERMISSION_REQUESTED_KEY =
  "yourworld:startup-runtime-permissions-requested:v1";
let startupPermissionRequestAttempted = false;
let startupPermissionRequest: Promise<void> | null = null;

export function isNativeAndroid() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export function requestStartupRuntimePermissionsOnce(): Promise<void> {
  if (typeof window === "undefined" || !isNativeAndroid()) {
    return Promise.resolve();
  }
  if (startupPermissionRequestAttempted) {
    return startupPermissionRequest ?? Promise.resolve();
  }
  try {
    if (window.localStorage.getItem(STARTUP_PERMISSION_REQUESTED_KEY) === "done") {
      startupPermissionRequestAttempted = true;
      return Promise.resolve();
    }
  } catch {
    // Storage is only used to avoid repeating denied prompts on later launches.
  }

  startupPermissionRequestAttempted = true;
  startupPermissionRequest = (async () => {
    try {
      await privacyBridge.requestStartupRuntimePermissions();
      try {
        window.localStorage.setItem(STARTUP_PERMISSION_REQUESTED_KEY, "done");
      } catch {
        // The module-level guard still keeps this to one request per app session.
      }
    } catch (error: unknown) {
      console.warn("[privacy-bridge] Startup permission request failed", error);
    }
  })().finally(() => {
    startupPermissionRequest = null;
  });
  return startupPermissionRequest;
}

export async function requestCallMediaPermissions(
  mode: "audio" | "video",
): Promise<boolean> {
  if (!isNativeAndroid()) return true;
  const result = await privacyBridge.requestCallMediaPermissions({ mode });
  return result.granted === true;
}

export function setScreenSecurity(enabled: boolean): Promise<void> {
  if (!isNativeAndroid()) return Promise.resolve();
  return privacyBridge.setScreenSecurity({ enabled });
}

let screenSecurityQueue: Promise<void> = Promise.resolve();

function queueScreenSecurityUpdate(enabled: boolean) {
  const update = screenSecurityQueue
    .catch(() => {})
    .then(() => setScreenSecurity(enabled));
  screenSecurityQueue = update.catch(() => {});
  return update;
}

export function listenForAndroidCaptureEvents(
  onCapture: (kind: "screenshot" | "recording") => void,
) {
  if (!isNativeAndroid()) return () => {};

  let disposed = false;
  let listener: PluginListenerHandle | null = null;

  void (async () => {
    try {
      const registeredListener = await privacyBridge.addListener(
        "capture",
        ({ kind }) => {
          if (!disposed && (kind === "screenshot" || kind === "recording")) {
            onCapture(kind);
          }
        },
      );
      if (disposed) {
        await registeredListener.remove();
        return;
      }
      listener = registeredListener;
      await privacyBridge.setCaptureMonitoring({ enabled: true });
    } catch (error: unknown) {
      const registeredListener = listener;
      listener = null;
      if (registeredListener) void registeredListener.remove();
      void privacyBridge.setCaptureMonitoring({ enabled: false }).catch(() => {});
      console.error("[privacy-bridge] Could not monitor Android screen recording", error);
    }
  })();

  return () => {
    disposed = true;
    const registeredListener = listener;
    listener = null;
    if (registeredListener) void registeredListener.remove();
    void privacyBridge.setCaptureMonitoring({ enabled: false }).catch((error: unknown) => {
      console.error("[privacy-bridge] Could not stop Android capture monitoring", error);
    });
  };
}

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function useAndroidChatSecureFlag(
  enabled: boolean,
  decisionReady: boolean,
  scopeKey: string,
) {
  const [appliedState, setAppliedState] = useState<{
    scopeKey: string;
    enabled: boolean;
    ready: boolean;
  } | null>(null);

  useIsomorphicLayoutEffect(() => {
    let active = true;
    setAppliedState(null);

    if (!isNativeAndroid()) {
      setAppliedState({ scopeKey, enabled, ready: true });
      return () => {
        active = false;
      };
    }

    if (!decisionReady) {
      return () => {
        active = false;
        void queueScreenSecurityUpdate(false).catch((error: unknown) => {
          console.error("[privacy-bridge] Could not clear Android chat capture protection", error);
        });
      };
    }

    const syncProtection = () => {
      setAppliedState(null);
      void queueScreenSecurityUpdate(enabled).then(
        () => {
          if (active) setAppliedState({ scopeKey, enabled, ready: true });
        },
        (error: unknown) => {
          console.error("[privacy-bridge] Could not update Android chat capture protection", error);
        },
      );
    };
    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") syncProtection();
    };

    syncProtection();
    window.addEventListener("focus", syncProtection);
    window.addEventListener("yw-app-resume", syncProtection);
    document.addEventListener("visibilitychange", syncWhenVisible);

    return () => {
      active = false;
      window.removeEventListener("focus", syncProtection);
      window.removeEventListener("yw-app-resume", syncProtection);
      document.removeEventListener("visibilitychange", syncWhenVisible);
      void queueScreenSecurityUpdate(false).catch((error: unknown) => {
        console.error("[privacy-bridge] Could not clear Android chat capture protection", error);
      });
    };
  }, [decisionReady, enabled, scopeKey]);

  return (
    appliedState?.scopeKey === scopeKey &&
    appliedState.enabled === enabled &&
    appliedState.ready
  );
}