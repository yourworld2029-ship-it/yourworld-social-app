export type CallMediaMode = "audio" | "video";
export type CallFacingMode = "user" | "environment";

export const CALL_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun.relay.metered.ca:80" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

export const CALL_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48_000,
  sampleSize: 16,
  channelCount: 2,
};

export function callVideoConstraints(
  facingMode: CallFacingMode = "user",
): MediaTrackConstraints {
  return {
    width: { min: 1280, ideal: 1920, max: 3840 },
    height: { min: 720, ideal: 1080, max: 2160 },
    frameRate: { ideal: 60, min: 30 },
    facingMode,
  };
}

function fallbackVideoConstraints(
  facingMode: CallFacingMode,
  width: number,
  height: number,
  frameRate: number,
): MediaTrackConstraints {
  return {
    width: { ideal: width, max: width },
    height: { ideal: height, max: height },
    frameRate: { ideal: frameRate, max: frameRate },
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
  const attempts: MediaStreamConstraints[] =
    mode === "video"
      ? [
          { audio: CALL_AUDIO_CONSTRAINTS, video: callVideoConstraints(facingMode) },
          {
            audio: CALL_AUDIO_CONSTRAINTS,
            video: fallbackVideoConstraints(facingMode, 1920, 1080, 60),
          },
          {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: fallbackVideoConstraints(facingMode, 1280, 720, 30),
          },
        ]
      : [
          { audio: CALL_AUDIO_CONSTRAINTS, video: false },
          {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: false,
          },
        ];

  return getFirstAvailableMedia(attempts);
}

/**
 * Camera replacement must not request another microphone stream. Keep the
 * existing audio sender and only reopen the selected camera at the same HD
 * profile used when the call started.
 */
export function getCallVideo(
  facingMode: CallFacingMode = "user",
): Promise<MediaStream> {
  return getFirstAvailableMedia([
    { audio: false, video: callVideoConstraints(facingMode) },
    {
      audio: false,
      video: fallbackVideoConstraints(facingMode, 1920, 1080, 60),
    },
    {
      audio: false,
      video: fallbackVideoConstraints(facingMode, 1280, 720, 30),
    },
  ]);
}

type TunedEncoding = RTCRtpEncodingParameters & {
  networkPriority?: "very-low" | "low" | "medium" | "high";
};

/**
 * Keep one full-resolution video layer with a predictable 4.5 Mbps ceiling.
 * The fallback removes networkPriority for browsers that reject that optional
 * encoding field while preserving the bitrate and priority settings.
 */
export async function tuneCallVideoSender(sender: RTCRtpSender): Promise<void> {
  if (sender.track?.kind !== "video") return;
  const current = sender.getParameters();
  const encodings = current.encodings?.length ? current.encodings : [{}];
  const tuned = encodings.map(
    (encoding) =>
      ({
        ...encoding,
        maxBitrate: 4_500_000,
        maxFramerate: 60,
        priority: "high",
        networkPriority: "high",
        scaleResolutionDownBy: 1,
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
      // The browser may expose a read-only sender profile; the call remains
      // usable with its negotiated defaults.
    }
  }
}