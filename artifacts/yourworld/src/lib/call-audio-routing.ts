import { Capacitor, registerPlugin } from "@capacitor/core";

export type CallAudioRoute = "earpiece" | "speaker";

interface NativeCallAudioRouting {
  start(options: { route: CallAudioRoute }): Promise<void>;
  setRoute(options: { route: CallAudioRoute }): Promise<void>;
  stop(): Promise<void>;
}

type SinkableMediaElement = HTMLMediaElement & {
  sinkId?: string;
  setSinkId?: (sinkId: string) => Promise<void>;
};

type CallAudioRoutingGlobal = typeof globalThis & {
  __yourWorldCallAudioRoutingPlugin?: NativeCallAudioRouting;
};

function getNativeCallAudioRouting() {
  const runtime = globalThis as CallAudioRoutingGlobal;
  runtime.__yourWorldCallAudioRoutingPlugin ??=
    registerPlugin<NativeCallAudioRouting>("CallAudioRouting");
  return runtime.__yourWorldCallAudioRoutingPlugin;
}

const previousSinkIds = new Map<HTMLMediaElement, string>();
let androidPluginUnavailable = false;

async function setBrowserRoute(
  route: CallAudioRoute,
  elements: Array<HTMLMediaElement | null>,
): Promise<void> {
  try {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    const routable = elements.filter(
      (element): element is SinkableMediaElement =>
        Boolean(element && typeof (element as SinkableMediaElement).setSinkId === "function"),
    );
    if (!routable.length) return;

    const devices = await navigator.mediaDevices.enumerateDevices();
    const routeLabels = route === "earpiece"
      ? /earpiece|receiver|handset/i
      : /speaker|loudspeaker/i;
    const output = devices.find(
      (device) =>
        device.kind === "audiooutput" &&
        device.deviceId &&
        routeLabels.test(device.label),
    );
    // Keeping the media elements on the browser's default sink is the safe
    // fallback. WebRTC audio continues through their normal playback path.
    if (!output) return;

    for (const element of routable) {
      if (!previousSinkIds.has(element)) {
        previousSinkIds.set(element, element.sinkId ?? "");
      }
      await element.setSinkId?.(output.deviceId).catch(() => undefined);
    }
  } catch {
    // Output selection is optional; never interrupt a call if it is unavailable.
  }
}

function isAndroidRuntime() {
  try {
    return Capacitor.getPlatform() === "android";
  } catch {
    return false;
  }
}

export async function startCallAudioRouting(
  route: CallAudioRoute,
  elements: Array<HTMLMediaElement | null>,
): Promise<void> {
  if (isAndroidRuntime() && !androidPluginUnavailable) {
    try {
      await getNativeCallAudioRouting().start({ route });
      return;
    } catch {
      androidPluginUnavailable = true;
    }
  }
  await setBrowserRoute(route, elements);
}

export async function setCallAudioRouting(
  route: CallAudioRoute,
  elements: Array<HTMLMediaElement | null>,
): Promise<void> {
  if (isAndroidRuntime() && !androidPluginUnavailable) {
    try {
      await getNativeCallAudioRouting().setRoute({ route });
      return;
    } catch {
      androidPluginUnavailable = true;
    }
  }
  await setBrowserRoute(route, elements);
}

async function restoreBrowserRoute() {
  const restore = Array.from(previousSinkIds.entries());
  previousSinkIds.clear();
  await Promise.all(
    restore.map(async ([element, sinkId]) => {
      const routable = element as SinkableMediaElement;
      if (typeof routable.setSinkId === "function") {
        try {
          await routable.setSinkId(sinkId);
        } catch {
          // The media element remains on the platform's default output.
        }
      }
    }),
  );
}

export async function stopCallAudioRouting(): Promise<void> {
  if (isAndroidRuntime()) {
    try {
      await getNativeCallAudioRouting().stop();
    } catch {
      androidPluginUnavailable = true;
    }
  }
  await restoreBrowserRoute();
}