import {
  Capacitor,
  registerPlugin,
  type PluginListenerHandle,
} from "@capacitor/core";
import { useEffect } from "react";

interface PrivacyBridgePlugin {
  setSecureFlag(options: { enabled: boolean }): Promise<void>;
  setCaptureMonitoring(options: { enabled: boolean }): Promise<void>;
  addListener(
    eventName: "capture",
    listenerFunc: (event: { kind?: unknown }) => void,
  ): Promise<PluginListenerHandle>;
  requestCallMediaPermissions(options: {
    mode: "audio" | "video";
  }): Promise<{ granted: boolean }>;
}

const privacyBridge = registerPlugin<PrivacyBridgePlugin>("PrivacyBridge");

export function isNativeAndroid() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export async function requestCallMediaPermissions(
  mode: "audio" | "video",
): Promise<boolean> {
  if (!isNativeAndroid()) return true;
  const result = await privacyBridge.requestCallMediaPermissions({ mode });
  return result.granted === true;
}

function updateAndroidChatSecureFlag(enabled: boolean) {
  if (!isNativeAndroid()) return;

  void privacyBridge.setSecureFlag({ enabled }).catch((error: unknown) => {
    console.error("[privacy-bridge] Could not update Android chat capture protection", error);
  });
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

export function useAndroidChatSecureFlag(enabled: boolean) {
  useEffect(() => {
    const syncProtection = () => updateAndroidChatSecureFlag(enabled);
    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") syncProtection();
    };

    syncProtection();
    window.addEventListener("focus", syncProtection);
    window.addEventListener("yw-app-resume", syncProtection);
    document.addEventListener("visibilitychange", syncWhenVisible);

    return () => {
      window.removeEventListener("focus", syncProtection);
      window.removeEventListener("yw-app-resume", syncProtection);
      document.removeEventListener("visibilitychange", syncWhenVisible);
      updateAndroidChatSecureFlag(false);
    };
  }, [enabled]);
}