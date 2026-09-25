import type { ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import { PrivateChatDownloadCard } from "@/components/yw/InteractionGateSheets";

export function ChatPlatformGate({ children }: { children: ReactNode }) {
  const isNative = Capacitor.isNativePlatform();
  if (!isNative) {
    return <PrivateChatDownloadCard mode="page" />;
  }
  return <>{children}</>;
}