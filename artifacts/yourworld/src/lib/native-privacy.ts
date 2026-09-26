import { Capacitor, registerPlugin } from "@capacitor/core";
import { useEffect } from "react";

interface PrivacyBridgePlugin {
  setSecureFlag(options: { enabled: boolean }): Promise<void>;
}

const privacyBridge = registerPlugin<PrivacyBridgePlugin>("PrivacyBridge");

export function isNativeAndroid() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

function updateAndroidChatSecureFlag(enabled: boolean) {
  if (!isNativeAndroid()) return;

  void privacyBridge.setSecureFlag({ enabled }).catch((error: unknown) => {
    console.error("[privacy-bridge] Could not update Android chat capture protection", error);
  });
}

export function useAndroidChatSecureFlag() {
  useEffect(() => {
    const enableChatProtection = () => updateAndroidChatSecureFlag(true);
    const enableWhenVisible = () => {
      if (document.visibilityState === "visible") enableChatProtection();
    };

    enableChatProtection();
    window.addEventListener("focus", enableChatProtection);
    window.addEventListener("yw-app-resume", enableChatProtection);
    document.addEventListener("visibilitychange", enableWhenVisible);

    return () => {
      window.removeEventListener("focus", enableChatProtection);
      window.removeEventListener("yw-app-resume", enableChatProtection);
      document.removeEventListener("visibilitychange", enableWhenVisible);
      updateAndroidChatSecureFlag(false);
    };
  }, []);
}