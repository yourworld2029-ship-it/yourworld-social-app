import type { ReactNode } from "react";
import { PrivateChatDownloadCard } from "@/components/yw/InteractionGateSheets";
import { isNativeAndroid } from "@/lib/native-privacy";

export function ChatPlatformGate({ children }: { children: ReactNode }) {
  if (!isNativeAndroid()) {
    return <PrivateChatDownloadCard mode="page" />;
  }
  return <>{children}</>;
}