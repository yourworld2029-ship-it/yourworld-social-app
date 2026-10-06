import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Camera, SwitchCamera, X, Zap } from "lucide-react";

type CameraFacing = "environment" | "user";
type FrozenPreview = { source: string; facing: CameraFacing };

type ChatCameraCaptureProps = {
  onClose: () => void;
  onPhoto: (file: File) => void;
  onVideo: (file: File) => void;
  onError: (message: string) => void;
};

async function requestCameraStream(facing: CameraFacing) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera access is not available on this device.");
  }

  const videoConstraints: Array<MediaTrackConstraints | boolean> = [
    {
      facingMode: { ideal: facing },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    { facingMode: { ideal: facing } },
    { width: { ideal: 1280 }, height: { ideal: 720 } },
    true,
  ];
  let lastError: unknown;

  for (const video of videoConstraints) {
    for (const audio of [true, false]) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
        if (stream.getVideoTracks().length > 0) {
          return { stream, hasAudio: stream.getAudioTracks().length > 0 };
        }
        stream.getTracks().forEach((track) => track.stop());
        lastError = new Error("The camera did not provide a video track.");
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Couldn't open the camera. Check camera permissions and try again.");
}

function trackSupportsTorch(track: MediaStreamTrack | undefined) {
  if (!track || typeof track.getCapabilities !== "function") return false;
  try {
    const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
      torch?: boolean;
    };
    return capabilities.torch === true;
  } catch {
    return false;
  }
}

function captureFrozenPreview(
  video: HTMLVideoElement | null,
  facing: CameraFacing,
): FrozenPreview | null {
  if (
    !video ||
    video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
    !video.videoWidth ||
    !video.videoHeight
  ) {
    return null;
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return { source: canvas.toDataURL("image/jpeg", 0.86), facing };
  } catch {
    return null;
  }
}

export function ChatCameraCapture({
  onClose,
  onPhoto,
  onVideo,
  onError,
}: ChatCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const streamRequestIdRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mountedRef = useRef(false);
  const facingRef = useRef<CameraFacing>("environment");
  const deliverVideoOnStopRef = useRef(false);
  const holdTimerRef = useRef<number | null>(null);
  const maxDurationTimerRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const onPhotoRef = useRef(onPhoto);
  const onVideoRef = useRef(onVideo);
  const onErrorRef = useRef(onError);
  const stopRecordingRef = useRef<(deliver: boolean) => void>(() => {});
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<CameraFacing>("environment");
  const [loading, setLoading] = useState(true);
  const [previewReady, setPreviewReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasAudio, setHasAudio] = useState(true);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [frozenPreview, setFrozenPreview] = useState<FrozenPreview | null>(null);
  const [frontFlashOn, setFrontFlashOn] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);

  useEffect(() => {
    onCloseRef.current = onClose;
    onPhotoRef.current = onPhoto;
    onVideoRef.current = onVideo;
    onErrorRef.current = onError;
  }, [onClose, onPhoto, onVideo, onError]);

  const releaseCameraStream = useCallback((updateState = true) => {
    const activeStream = streamRef.current;
    streamRef.current = null;
    const preview = videoRef.current;
    if (preview) {
      preview.pause();
      preview.srcObject = null;
    }
    activeStream?.getTracks().forEach((track) => track.stop());
    if (updateState) {
      setStream(null);
      setPreviewReady(false);
    }
  }, []);

  const applyStream = useCallback(async (nextFacing: CameraFacing) => {
    const requestId = ++streamRequestIdRef.current;
    const frozen = captureFrozenPreview(videoRef.current, facingRef.current);
    if (frozen) setFrozenPreview(frozen);
    setLoading(true);
    setPreviewReady(false);
    setTorchAvailable(false);
    setTorchOn(false);
    setFrontFlashOn(false);
    releaseCameraStream();
    try {
      const result = await requestCameraStream(nextFacing);
      if (!mountedRef.current || requestId !== streamRequestIdRef.current) {
        result.stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = result.stream;
      setStream(result.stream);
      facingRef.current = nextFacing;
      setFacing(nextFacing);
      setHasAudio(result.hasAudio);
      setTorchAvailable(
        nextFacing === "environment" &&
          trackSupportsTorch(result.stream.getVideoTracks()[0]),
      );
    } catch (error) {
      if (mountedRef.current && requestId === streamRequestIdRef.current) {
        onErrorRef.current(
          error instanceof Error ? error.message : "Couldn't open the camera.",
        );
        setLoading(false);
      }
    }
  }, [releaseCameraStream]);

  useEffect(() => {
    mountedRef.current = true;
    void applyStream("environment");
    return () => {
      mountedRef.current = false;
      streamRequestIdRef.current += 1;
      if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
      if (maxDurationTimerRef.current !== null) window.clearTimeout(maxDurationTimerRef.current);
      if (elapsedTimerRef.current !== null) window.clearInterval(elapsedTimerRef.current);
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        deliverVideoOnStopRef.current = false;
        try {
          recorder.stop();
        } catch {
          // The recorder may already have stopped while the camera sheet closed.
        }
      }
      releaseCameraStream(false);
    };
  }, [applyStream, releaseCameraStream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    let active = true;
    const markPreviewReady = () => {
      if (!active || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      setPreviewReady(true);
      setLoading(false);
      setFrozenPreview(null);
    };
    const failPreview = () => {
      if (!active) return;
      releaseCameraStream();
      setLoading(false);
      onErrorRef.current("The camera opened, but its preview couldn't start. Try switching cameras.");
    };
    video.addEventListener("loadeddata", markPreviewReady);
    video.addEventListener("playing", markPreviewReady);
    video.addEventListener("error", failPreview);
    video.srcObject = stream;
    void video.play().then(markPreviewReady, failPreview);
    return () => {
      active = false;
      video.removeEventListener("loadeddata", markPreviewReady);
      video.removeEventListener("playing", markPreviewReady);
      video.removeEventListener("error", failPreview);
      if (video.srcObject === stream) {
        video.pause();
        video.srcObject = null;
      }
    };
  }, [facing, releaseCameraStream, stream]);

  const stopRecording = (deliver: boolean) => {
    deliverVideoOnStopRef.current = deliver;
    if (maxDurationTimerRef.current !== null) window.clearTimeout(maxDurationTimerRef.current);
    if (elapsedTimerRef.current !== null) window.clearInterval(elapsedTimerRef.current);
    maxDurationTimerRef.current = null;
    elapsedTimerRef.current = null;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch (error) {
        onErrorRef.current(
          error instanceof Error ? error.message : "Couldn't finish that video.",
        );
      }
    }
  };
  stopRecordingRef.current = stopRecording;

  const startRecording = () => {
    const activeStream = streamRef.current;
    if (!activeStream || loading || !previewReady) return;
    if (typeof MediaRecorder === "undefined") {
      onErrorRef.current("Video recording is not supported on this device.");
      return;
    }

    const hasAudioTrack = activeStream.getAudioTracks().length > 0;
    const candidates = [
      ...(hasAudioTrack
        ? [
            "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
            "video/webm;codecs=vp9,opus",
            "video/webm;codecs=vp8,opus",
          ]
        : []),
      "video/mp4;codecs=avc1.42E01E",
      "video/mp4",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    const mimeType = candidates.find((type) => {
      try {
        return MediaRecorder.isTypeSupported?.(type) === true;
      } catch {
        return false;
      }
    }) ?? "";

    const createAndStartRecorder = (preferredMimeType: string) => {
      const recorder = preferredMimeType
        ? new MediaRecorder(activeStream, { mimeType: preferredMimeType })
        : new MediaRecorder(activeStream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      deliverVideoOnStopRef.current = false;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        recorderRef.current = null;
        if (elapsedTimerRef.current !== null) window.clearInterval(elapsedTimerRef.current);
        if (maxDurationTimerRef.current !== null) window.clearTimeout(maxDurationTimerRef.current);
        elapsedTimerRef.current = null;
        maxDurationTimerRef.current = null;
        if (mountedRef.current) setRecording(false);

        const shouldDeliver = deliverVideoOnStopRef.current;
        deliverVideoOnStopRef.current = false;
        const chunks = chunksRef.current;
        chunksRef.current = [];
        const chunkMimeType = chunks.find((chunk) => chunk.type.startsWith("video/"))?.type;
        const type = recorder.mimeType || chunkMimeType || preferredMimeType || "video/webm";
        releaseCameraStream(mountedRef.current);
        if (!shouldDeliver) return;

        const blob = new Blob(chunks, { type });
        if (!blob.size) {
          onErrorRef.current("The camera didn't capture a video. Please try again.");
          return;
        }
        const extension = type.toLowerCase().split(";")[0]?.includes("mp4") ? "mp4" : "webm";
        onVideoRef.current(
          new File([blob], `chat-video-${Date.now()}.${extension}`, { type }),
        );
        onCloseRef.current();
      };
      recorder.start(250);
      return recorder;
    };

    try {
      let recorder: MediaRecorder;
      try {
        recorder = createAndStartRecorder(mimeType);
      } catch (error) {
        if (!mimeType) throw error;
        recorder = createAndStartRecorder("");
      }
      recorderRef.current = recorder;
      setRecording(true);
      setElapsedSeconds(0);
      const startedAt = Date.now();
      elapsedTimerRef.current = window.setInterval(() => {
        setElapsedSeconds(Math.min(30, Math.floor((Date.now() - startedAt) / 1000)));
      }, 250);
      maxDurationTimerRef.current = window.setTimeout(
        () => stopRecordingRef.current(true),
        30_000,
      );
    } catch (error) {
      recorderRef.current = null;
      onErrorRef.current(
        error instanceof Error ? error.message : "Couldn't start video recording.",
      );
    }
  };

  const takePhoto = async () => {
    const video = videoRef.current;
    if (
      !previewReady ||
      !video ||
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      onErrorRef.current("The camera is still starting. Try again in a moment.");
      return;
    }

    const useScreenFlash = facing === "user" && frontFlashOn;
    if (useScreenFlash) {
      setScreenFlash(true);
      await new Promise((resolve) => window.setTimeout(resolve, 120));
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context || !canvas.width || !canvas.height) {
        throw new Error("The camera frame is not ready.");
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (captured) => (captured ? resolve(captured) : reject(new Error("Photo capture failed."))),
          "image/jpeg",
          0.94,
        );
      });
      if (useScreenFlash && mountedRef.current) setScreenFlash(false);
      releaseCameraStream();
      onPhotoRef.current(
        new File([blob], `chat-photo-${Date.now()}.jpg`, { type: "image/jpeg" }),
      );
      onCloseRef.current();
    } catch (error) {
      if (useScreenFlash && mountedRef.current) setScreenFlash(false);
      onErrorRef.current(
        error instanceof Error ? error.message : "Couldn't capture that photo.",
      );
    }
  };

  const handleShutterDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (loading || !previewReady || !streamRef.current || recording) return;
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is optional on older WebViews.
    }
    longPressTriggeredRef.current = false;
    holdTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      startRecording();
    }, 350);
  };

  const handleShutterUp = () => {
    if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
    if (longPressTriggeredRef.current) {
      if (recorderRef.current?.state === "recording") stopRecordingRef.current(true);
      return;
    }
    if (!recording) void takePhoto();
  };

  const handleShutterCancel = () => {
    if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
    if (longPressTriggeredRef.current && recorderRef.current?.state === "recording") {
      stopRecordingRef.current(true);
    }
  };

  const toggleFacing = () => {
    if (recording || loading) return;
    void applyStream(facing === "environment" ? "user" : "environment");
  };

  const toggleFlash = async () => {
    if (facing === "user") {
      setFrontFlashOn((enabled) => !enabled);
      return;
    }
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    if (!trackSupportsTorch(track)) {
      setTorchAvailable(false);
      setTorchOn(false);
      return;
    }
    const next = !torchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      if (streamRef.current?.getVideoTracks()[0] !== track) return;
      setTorchOn(next);
    } catch {
      if (streamRef.current?.getVideoTracks()[0] !== track) return;
      setTorchAvailable(false);
      setTorchOn(false);
    }
  };

  const closeCamera = () => {
    if (recorderRef.current?.state === "recording") stopRecordingRef.current(false);
    onCloseRef.current();
  };

  return (
    <div className="fixed inset-0 z-[120] flex h-[100dvh] w-full flex-col overflow-hidden bg-black text-white">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        controls={false}
        aria-label="Live camera preview"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        style={{
          opacity: previewReady ? 1 : 0,
          objectFit: "cover",
          objectPosition: "center",
          transform: facing === "user" ? "scaleX(-1)" : "none",
          transformOrigin: "center center",
        }}
      />
      {frozenPreview ? (
        <img
          src={frozenPreview.source}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
          style={{
            transform: frozenPreview.facing === "user" ? "scaleX(-1)" : "none",
            transformOrigin: "center center",
          }}
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />

      <header className="relative z-10 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,24px)_+_0.75rem)]">
        <button
          type="button"
          aria-label="Close camera"
          onClick={closeCamera}
          className="grid h-10 w-10 place-items-center rounded-full bg-black/45"
        >
          <X size={21} />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold">{facing === "user" ? "Front camera" : "Back camera"}</p>
          {recording ? (
            <p className="mt-0.5 text-xs font-mono text-red-300">
              Recording 00:{String(elapsedSeconds).padStart(2, "0")} / 00:30
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Flip camera"
            title="Flip camera"
            disabled={loading || recording}
            onClick={toggleFacing}
            className="grid h-10 w-10 place-items-center rounded-full bg-black/45 disabled:opacity-40"
          >
            <SwitchCamera size={20} />
          </button>
          <button
            type="button"
            aria-label={facing === "user" ? "Toggle screen flash" : "Toggle back camera torch"}
            title={
              facing === "user"
                ? "Front screen flash"
                : torchAvailable
                  ? "Back camera torch"
                  : "Torch unavailable"
            }
            aria-pressed={facing === "user" ? frontFlashOn : torchOn}
            disabled={loading || !previewReady || !stream || (facing === "environment" && !torchAvailable)}
            onClick={() => void toggleFlash()}
            className={`grid h-10 w-10 place-items-center rounded-full ${
              (facing === "user" ? frontFlashOn : torchOn)
                ? "bg-amber-300 text-black"
                : "bg-black/45"
            } disabled:opacity-40`}
          >
            <Zap size={19} />
          </button>
        </div>
      </header>

      <div className="relative z-10 mt-auto flex flex-col items-center gap-4 px-6 pb-[calc(env(safe-area-inset-bottom,16px)_+_1.5rem)]">
        {loading && !frozenPreview ? (
          <p className="text-xs text-white/80">Opening camera…</p>
        ) : loading ? null : hasAudio ? (
          <p className="text-xs text-white/80">Tap for photo · hold for video</p>
        ) : (
          <p className="text-xs text-white/80">Tap for photo · hold for silent video · no microphone</p>
        )}
        <button
          type="button"
          aria-label="Tap to take a photo or hold to record a video"
          disabled={loading || !previewReady || !stream}
          onPointerDown={handleShutterDown}
          onPointerUp={handleShutterUp}
          onPointerCancel={handleShutterCancel}
          onKeyDown={(event) => {
            if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
            event.preventDefault();
            void takePhoto();
          }}
          onContextMenu={(event) => event.preventDefault()}
          className={`grid h-[76px] w-[76px] touch-none place-items-center rounded-full border-[5px] border-white/90 shadow-xl disabled:opacity-50 ${
            recording ? "bg-red-600" : "bg-white/15"
          }`}
        >
          <span
            className={`grid place-items-center rounded-full ${
              recording ? "h-8 w-8 rounded-md bg-white" : "h-[54px] w-[54px] bg-white"
            }`}
          >
            {recording ? <span className="sr-only">Stop recording</span> : <Camera size={23} className="text-zinc-900" />}
          </span>
        </button>
      </div>

      {screenFlash ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 bg-white" />
      ) : null}
    </div>
  );
}
