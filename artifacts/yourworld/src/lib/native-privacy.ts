import { Capacitor, registerPlugin } from "@capacitor/core";
import { useEffect } from "react";

interface PrivacyBridgePlugin {
  setSecureFlag(options: { enabled: boolean }): Promise<void>;
}

const privacyBridge = registerPlugin<PrivacyBridgePlugin>("PrivacyBridge");

function updateAndroidSecureFlag(enabled: boolean) {
  if (Capacitor.getPlatform() !== "android") return;

  void privacyBridge.setSecureFlag({ enabled }).catch((error: unknown) => {
    console.error("[privacy-bridge] Could not update Android screenshot protection", error);
  });
}

export function useAndroidSecureFlag(enabled: boolean) {
  useEffect(() => {
    updateAndroidSecureFlag(enabled);
    return () => updateAndroidSecureFlag(false);
  }, [enabled]);
}