import { Capacitor, registerPlugin } from "@capacitor/core";

export type CallAudioRoute = "earpiece" | "speaker";

interface NativeCallAudioRouting {
  start(options: { route: CallAudioRoute }): Promise<void>;
  setRoute(options: { route: CallAudioRoute }): Promise<void>;
  stop(): Promise<void>;
}

const nativeCallAudioRouting =
  registerPlugin<NativeCallAudioRouting>("CallAudioRouting");

type SinkableMediaElement = HTMLMediaElement & {
  sinkId?: string;
  setSinkId?: (sinkId: string) => Promise<void>;
};

const previousSinkIds = new Map<HTMLMediaElement, string>();

async function setBrowserRoute(
  route: CallAudioRoute,
  elements: Array<HTMLMediaElement | null>,
): Promise<void> {
  const routable = elements.filter(
    (element): element is SinkableMediaElement =>
      Boolean(element && typeof (element as SinkableMediaElement).setSinkId === "function"),
  );
  if (!routable.length || !navigator.mediaDevices?.enumerateDevices) {
    throw new Error("This browser does not allow selecting an audio output.");
  }

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
  if (!output) {
    throw new Error(`This browser does not expose a ${route} audio output.`);
  }

  for (const element of routable) {
    if (!previousSinkIds.has(element)) {
      previousSinkIds.set(element, element.sinkId ?? "");
    }
    await element.setSinkId?.(output.deviceId);
  }
}

export async function startCallAudioRouting(
  route: CallAudioRoute,
  elements: Array<HTMLMediaElement | null>,
): Promise<void> {
  if (Capacitor.getPlatform() === "android") {
    await nativeCallAudioRouting.start({ route });
    return;
  }
  await setBrowserRoute(route, elements);
}

export async function setCallAudioRouting(
  route: CallAudioRoute,
  elements: Array<HTMLMediaElement | null>,
): Promise<void> {
  if (Capacitor.getPlatform() === "android") {
    await nativeCallAudioRouting.setRoute({ route });
    return;
  }
  await setBrowserRoute(route, elements);
}

export async function stopCallAudioRouting(): Promise<void> {
  if (Capacitor.getPlatform() === "android") {
    await nativeCallAudioRouting.stop();
    return;
  }

  const restore = Array.from(previousSinkIds.entries());
  previousSinkIds.clear();
  await Promise.all(
    restore.map(async ([element, sinkId]) => {
      const routable = element as SinkableMediaElement;
      if (typeof routable.setSinkId === "function") {
        await routable.setSinkId(sinkId).catch(() => undefined);
      }
    }),
  );
}