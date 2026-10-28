import {
  getAdaptivePerformanceSnapshot,
  type NetworkQuality,
} from "@/lib/adaptive-performance";

export type CallMediaMode = "audio" | "video";
export type CallFacingMode = "user" | "environment";

const PERMISSION_DENIED_ERROR_NAMES = new Set([
  "NotAllowedError",
  "PermissionDeniedError",
  "SecurityError",
]);

export class CallMediaPermissionError extends Error {
  constructor() {
    super("Microphone or camera permission was denied.");
    this.name = "CallMediaPermissionError";
  }
}

export function isCallMediaPermissionError(error: unknown): boolean {
  if (error instanceof CallMediaPermissionError) return true;
  if (!error || typeof error !== "object" || !("name" in error)) return false;
  return PERMISSION_DENIED_ERROR_NAMES.has(String(error.name));
}

const configuredIceServers = (() => {
  try {
    const value = import.meta.env.VITE_CALL_ICE_SERVERS_JSON as string | undefined;
    const parsed = value ? JSON.parse(value) : null;
    return Array.isArray(parsed) ? (parsed as RTCIceServer[]) : null;
  } catch {
    return null;
  }
})();

/**
 * Production TURN credentials must be short-lived and injected by the
 * deployment. The old public/demo relay credentials were intentionally
 * removed; STUN remains a safe development fallback.
 */
export const CALL_ICE_SERVERS: RTCIceServer[] = configuredIceServers ?? [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export const CALL_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48_000,
  sampleSize: 16,
  channelCount: 1,
};

function callVideoProfile(quality: NetworkQuality = getAdaptivePerformanceSnapshot().networkQuality) {
  if (quality === "weak" || quality === "offline") {
    return { width: 640, height: 480, frameRate: 15 };
  }
  if (quality === "normal") {
    return { width: 960, height: 540, frameRate: 24 };
  }
  return { width: 1280, height: 720, frameRate: 30 };
}

function callVideoCaptureProfiles(facingMode: CallFacingMode): MediaTrackConstraints[] {
  return [
    {
      facingMode: { ideal: facingMode },
      width: { ideal: 2560, min: 1920 },
      height: { ideal: 1440, min: 1080 },
      frameRate: { ideal: 30, min: 24 },
    },
    {
      facingMode: { ideal: facingMode },
      width: { ideal: 1280, min: 640 },
      height: { ideal: 720, min: 480 },
      frameRate: { ideal: 30, min: 24 },
    },
    {
      facingMode: { ideal: facingMode },
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 24 },
    },
  ];
}

export function callVideoConstraints(
  facingMode: CallFacingMode = "user",
): MediaTrackConstraints {
  const profile = callVideoProfile();
  return {
    width: { ideal: profile.width, max: profile.width },
    height: { ideal: profile.height, max: profile.height },
    frameRate: { ideal: profile.frameRate, max: profile.frameRate },
    facingMode,
  };
}

async function getFirstAvailableMedia(
  attempts: MediaStreamConstraints[],
): Promise<MediaStream> {
  let lastError: unknown = null;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      if (isCallMediaPermissionError(error)) {
        throw new CallMediaPermissionError();
      }
      lastError = error;
    }
  }
  throw lastError ?? new Error("Unable to access camera and microphone");
}

/**
 * Try the requested HD profile first, then relax only unsupported hardware
 * constraints so calls still work on older phones and browsers.
 */
export async function getCallMedia(
  mode: CallMediaMode,
  facingMode: CallFacingMode = "user",
): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("This device does not support call media.");
  }

  try {
    // Let the WebView own the runtime permission request. On Android this is
    // forwarded through Capacitor's BridgeWebChromeClient to the system prompt.
    const stream = await getFirstAvailableMedia(
      mode === "video"
        ? callVideoCaptureProfiles(facingMode).map((video) => ({
            audio: true,
            video,
          }))
        : [{ audio: true, video: false }],
    );

    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      await audioTrack.applyConstraints(CALL_AUDIO_CONSTRAINTS).catch(() => undefined);
    }

    return stream;
  } catch (error) {
    if (isCallMediaPermissionError(error)) {
      throw new CallMediaPermissionError();
    }
    throw error;
  }
}

/**
 * Camera replacement must not request another microphone stream. Use the same
 * 2K, HD, and SD capture profiles as initial setup.
 */
export function getCallVideo(
  facingMode: CallFacingMode = "user",
): Promise<MediaStream> {
  return getFirstAvailableMedia(
    callVideoCaptureProfiles(facingMode).map((video) => ({
      audio: false,
      video,
    })),
  );
}

type TunedEncoding = RTCRtpEncodingParameters & {
  networkPriority?: "very-low" | "low" | "medium" | "high";
};

export type CallRtpStatsSample = {
  id?: string;
  type?: string;
  kind?: string;
  mediaType?: string;
  timestamp?: number;
  fractionLost?: number;
  packetsReceived?: number;
  packetsLost?: number;
};

export type CallPacketLoss = {
  audio: number | null;
  video: number | null;
};

export type CallNetworkTier = "healthy" | "degraded" | "critical" | "unknown";

export function collectCallPacketLoss(
  reports: readonly CallRtpStatsSample[],
  previousCounters: Map<string, { received: number; lost: number; timestamp?: number }>,
): CallPacketLoss {
  const loss: CallPacketLoss = { audio: null, video: null };
  for (const report of reports) {
    const kind = report.kind ?? report.mediaType;
    if (kind !== "audio" && kind !== "video") continue;

    let fraction: number | null = null;
    if (
      report.type === "remote-inbound-rtp" &&
      typeof report.fractionLost === "number" &&
      Number.isFinite(report.fractionLost)
    ) {
      const previous = report.id ? previousCounters.get(report.id) : undefined;
      if (
        typeof report.timestamp === "number" &&
        previous?.timestamp === report.timestamp
      ) continue;
      if (report.id) {
        previousCounters.set(report.id, {
          received: 0,
          lost: 0,
          timestamp: report.timestamp,
        });
      }
      fraction = report.fractionLost;
    } else if (
      report.type === "inbound-rtp" &&
      report.id &&
      typeof report.packetsReceived === "number" &&
      typeof report.packetsLost === "number"
    ) {
      const received = Math.max(0, report.packetsReceived);
      const lost = Math.max(0, report.packetsLost);
      const previous = previousCounters.get(report.id);
      previousCounters.set(report.id, { received, lost });
      if (previous) {
        const receivedDelta = Math.max(0, received - previous.received);
        const lostDelta = Math.max(0, lost - previous.lost);
        const total = receivedDelta + lostDelta;
        if (total > 0) fraction = lostDelta / total;
      }
    }

    if (fraction === null) continue;
    const safeFraction = Math.max(0, Math.min(1, fraction));
    loss[kind] = Math.max(loss[kind] ?? 0, safeFraction);
  }
  return loss;
}

export function classifyCallNetwork(
  audioLoss: number | null,
  videoLoss: number | null,
): CallNetworkTier {
  const samples = [audioLoss, videoLoss].filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  if (!samples.length) return "unknown";
  const worstLoss = Math.max(...samples);
  if (worstLoss >= 0.25) return "critical";
  if (worstLoss >= 0.08) return "degraded";
  if (worstLoss <= 0.02) return "healthy";
  return "unknown";
}

export function callVideoScaleTo240p(track?: MediaStreamTrack | null): number {
  const settings = track?.getSettings?.();
  const width = settings?.width ?? 0;
  const height = settings?.height ?? 0;
  if (width <= 0 || height <= 0) return 3;
  const portrait = height > width;
  const targetWidth = portrait ? 240 : 426;
  const targetHeight = portrait ? 426 : 240;
  return Math.max(1, width / targetWidth, height / targetHeight);
}

/**
 * Preserve the normal capture profile, lowering only the transmitted layer
 * to 240p/15fps when sustained RTP loss is detected.
 * The fallback removes networkPriority for browsers that reject that optional
 * encoding field while preserving the bitrate and priority settings.
 */
export async function tuneCallVideoSender(
  sender: RTCRtpSender,
  lowBandwidth = false,
): Promise<void> {
  if (sender.track?.kind !== "video") return;
  const performance = getAdaptivePerformanceSnapshot();
  const current = sender.getParameters();
  const encodings = current.encodings?.length ? current.encodings : [{}];
  const scaleResolutionDownBy = lowBandwidth
    ? callVideoScaleTo240p(sender.track)
    : performance.videoScaleResolutionDownBy;
  const tuned = encodings.map(
    (encoding) =>
      ({
        ...encoding,
        maxBitrate: lowBandwidth ? 150_000 : performance.videoBitrate,
        maxFramerate: lowBandwidth ? 15 : performance.videoFrameRate,
        priority: lowBandwidth ? "low" : "high",
        networkPriority: lowBandwidth ? "low" : "high",
        scaleResolutionDownBy,
      }) as TunedEncoding,
  );

  try {
    current.encodings = tuned;
    current.degradationPreference = !lowBandwidth && performance.networkQuality === "fast"
      ? "maintain-framerate"
      : "balanced";
    await sender.setParameters(current);
  } catch {
    const fallback = sender.getParameters();
    fallback.encodings = tuned.map(({ networkPriority: _networkPriority, ...encoding }) => encoding);
    fallback.degradationPreference = !lowBandwidth && performance.networkQuality === "fast"
      ? "maintain-framerate"
      : "balanced";
    try {
      await sender.setParameters(fallback);
    } catch {
      // The browser may expose a read-only sender profile; the call remains
      // usable with its negotiated defaults.
    }
  }
}

export async function prioritizeCallAudioSender(
  sender: RTCRtpSender,
  lowBandwidth = false,
): Promise<void> {
  if (sender.track?.kind !== "audio") return;
  const current = sender.getParameters();
  const encodings = current.encodings?.length ? current.encodings : [{}];
  const tuned = encodings.map((encoding) => {
    const { maxBitrate: _previousMaxBitrate, ...rest } = encoding;
    return {
      ...rest,
      ...(lowBandwidth ? { maxBitrate: 10_000 } : {}),
      priority: "high",
      networkPriority: "high",
    } as TunedEncoding;
  });
  try {
    current.encodings = tuned;
    await sender.setParameters(current);
  } catch {
    const fallback = sender.getParameters();
    fallback.encodings = tuned.map(({ networkPriority: _networkPriority, ...encoding }) => encoding);
    try {
      await sender.setParameters(fallback);
    } catch {
      // Negotiated defaults remain usable when sender parameters are read-only.
    }
  }
}

export async function setCallVideoTransmissionPaused(
  sender: RTCRtpSender,
  paused: boolean,
): Promise<void> {
  if (sender.track?.kind !== "video") return;
  try {
    const parameters = sender.getParameters();
    const encodings = parameters.encodings?.length ? parameters.encodings : [{}];
    parameters.encodings = encodings.map((encoding) => ({
      ...encoding,
      active: !paused,
    }));
    await sender.setParameters(parameters);
  } catch {
    // Older engines may not expose encoding.active; keep audio untouched.
  }
}