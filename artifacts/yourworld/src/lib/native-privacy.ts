import { Capacitor, registerPlugin } from "@capacitor/core";
import { useEffect } from "react";

interface PrivacyBridgePlugin {
  setSecureFlag(options: { enabled: boolean }): Promise<void>;
}

const privacyBridge = registerPlugin<PrivacyBridgePlugin>("PrivacyBridge");

export function isNativeAndroid() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

function updateAndroidSecureFlag(enabled: boolean) {
  if (!isNativeAndroid()) return;

  void privacyBridge.setSecureFlag({ enabled }).catch((error: unknown) => {
    console.error("[privacy-bridge] Could not update Android screenshot protection", error);
  });
}

export function useAndroidSecureFlag(enabled: boolean) {
  useEffect(() => {
    const reapplyProtection = () => updateAndroidSecureFlag(enabled);
    const reapplyWhenVisible = () => {
      if (document.visibilityState === "visible") reapplyProtection();
    };

    reapplyProtection();
    window.addEventListener("focus", reapplyProtection);
    window.addEventListener("yw-app-resume", reapplyProtection);
    document.addEventListener("visibilitychange", reapplyWhenVisible);

    return () => {
      window.removeEventListener("focus", reapplyProtection);
      window.removeEventListener("yw-app-resume", reapplyProtection);
      document.removeEventListener("visibilitychange", reapplyWhenVisible);
      updateAndroidSecureFlag(false);
    };
  }, [enabled]);
}