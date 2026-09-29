import { Capacitor, registerPlugin } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import type { CallNotificationAction } from "@/lib/call-notifications";

type PermissionState = "granted" | "denied" | "prompt";

type NativeCallPushResult = {
  permission: PermissionState;
  token: string | null;
  fullScreenIntentPermissionRequired?: boolean;
};

type NativeCallPushStatus = {
  permission: PermissionState;
  fullScreenIntentAllowed: boolean;
};

type NativeCallPushPlugin = {
  getStatus(): Promise<NativeCallPushStatus>;
  register(): Promise<NativeCallPushResult>;
  getToken(): Promise<{ token: string | null }>;
  consumePendingAction(): Promise<{ action: CallNotificationAction | null }>;
  dismiss(options: { callId: string }): Promise<void>;
  addListener(
    eventName: "callAction",
    listenerFunc: (action: CallNotificationAction) => void,
  ): Promise<PluginListenerHandle>;
};

const NativeCallPush = registerPlugin<NativeCallPushPlugin>("CallPush");

export function isAndroidCallPushAvailable() {
  return Capacitor.getPlatform() === "android";
}

export async function getAndroidCallPushStatus() {
  if (!isAndroidCallPushAvailable()) return null;
  return NativeCallPush.getStatus();
}

export async function registerAndroidCallPush() {
  if (!isAndroidCallPushAvailable()) {
    return { permission: "denied", token: null } as const;
  }
  return NativeCallPush.register();
}

export async function getAndroidCallPushToken() {
  if (!isAndroidCallPushAvailable()) return null;
  const result = await NativeCallPush.getToken();
  return result.token;
}

export async function consumeAndroidCallPushAction() {
  if (!isAndroidCallPushAvailable()) return null;
  const result = await NativeCallPush.consumePendingAction();
  return result.action;
}

export async function addAndroidCallPushActionListener(
  listener: (action: CallNotificationAction) => void,
) {
  if (!isAndroidCallPushAvailable()) return null;
  return NativeCallPush.addListener("callAction", listener);
}

export async function dismissAndroidCallNotification(callId: string) {
  if (!isAndroidCallPushAvailable()) return;
  await NativeCallPush.dismiss({ callId });
}