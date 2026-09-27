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

  const profile = callVideoProfile();
  try {
    // Let the WebView own the runtime permission request. On Android this is
    // forwarded through Capacitor's BridgeWebChromeClient to the system prompt.
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: mode === "video",
    });

    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      await audioTrack.applyConstraints(CALL_AUDIO_CONSTRAINTS).catch(() => undefined);
    }

    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack && mode === "video") {
      await videoTrack.applyConstraints({
        ...callVideoConstraints(facingMode),
        width: { ideal: profile.width },
        height: { ideal: profile.height },
        frameRate: { ideal: profile.frameRate },
      }).catch(() => undefined);
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
 * Camera replacement must not request another microphone stream. Keep the
 * existing audio sender and only reopen the selected camera at the same HD
 * profile used when the call started.
 */
export function getCallVideo(
  facingMode: CallFacingMode = "user",
): Promise<MediaStream> {
  const profile = callVideoProfile();
  return getFirstAvailableMedia([
    { audio: false, video: callVideoConstraints(facingMode) },
    {
      audio: false,
      video: {
        facingMode,
        width: { ideal: profile.width },
        height: { ideal: profile.height },
        frameRate: { ideal: profile.frameRate },
      },
    },
    {
      audio: false,
      video: { facingMode },
    },
  ]);
}

type TunedEncoding = RTCRtpEncodingParameters & {
  networkPriority?: "very-low" | "low" | "medium" | "high";
};

/**
 * Keep one full-resolution video layer with a predictable 1.5 Mbps ceiling.
 * The fallback removes networkPriority for browsers that reject that optional
 * encoding field while preserving the bitrate and priority settings.
 */
export async function tuneCallVideoSender(sender: RTCRtpSender): Promise<void> {
  if (sender.track?.kind !== "video") return;
  const performance = getAdaptivePerformanceSnapshot();
  const current = sender.getParameters();
  const encodings = current.encodings?.length ? current.encodings : [{}];
  const tuned = encodings.map(
    (encoding) =>
      ({
        ...encoding,
        maxBitrate: performance.videoBitrate,
        maxFramerate: performance.videoFrameRate,
        priority: "high",
        networkPriority: "high",
        scaleResolutionDownBy: performance.videoScaleResolutionDownBy,
      }) as TunedEncoding,
  );

  try {
    current.encodings = tuned;
    current.degradationPreference = performance.networkQuality === "fast"
      ? "maintain-framerate"
      : "balanced";
    await sender.setParameters(current);
  } catch {
    const fallback = sender.getParameters();
    fallback.encodings = tuned.map(({ networkPriority: _networkPriority, ...encoding }) => encoding);
    fallback.degradationPreference = performance.networkQuality === "fast"
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

export async function prioritizeCallAudioSender(sender: RTCRtpSender): Promise<void> {
  if (sender.track?.kind !== "audio") return;
  const current = sender.getParameters();
  const encodings = current.encodings?.length ? current.encodings : [{}];
  const tuned = encodings.map(
    (encoding) =>
      ({
        ...encoding,
        priority: "high",
        networkPriority: "high",
      }) as TunedEncoding,
  );
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