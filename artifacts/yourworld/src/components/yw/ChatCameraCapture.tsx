import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Camera, LoaderCircle, SwitchCamera, X, Zap } from "lucide-react";

type CameraFacing = "environment" | "user";

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

  const video: MediaTrackConstraints = {
    facingMode: { ideal: facing },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
    return { stream, hasAudio: stream.getAudioTracks().length > 0 };
  } catch {
    const stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
    return { stream, hasAudio: false };
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
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mountedRef = useRef(false);
  const deliverVideoOnStopRef = useRef(false);
  const holdTimerRef = useRef<number | null>(null);
  const maxDurationTimerRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const screenFlashTimerRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  const onPhotoRef = useRef(onPhoto);
  const onVideoRef = useRef(onVideo);
  const onErrorRef = useRef(onError);
  const stopRecordingRef = useRef<(deliver: boolean) => void>(() => {});
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<CameraFacing>("environment");
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasAudio, setHasAudio] = useState(true);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [frontFlashOn, setFrontFlashOn] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);

  useEffect(() => {
    onCloseRef.current = onClose;
    onPhotoRef.current = onPhoto;
    onVideoRef.current = onVideo;
    onErrorRef.current = onError;
  }, [onClose, onPhoto, onVideo, onError]);

  const applyStream = useCallback(async (nextFacing: CameraFacing) => {
    setLoading(true);
    try {
      const result = await requestCameraStream(nextFacing);
      if (!mountedRef.current) {
        result.stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = result.stream;
      setStream(result.stream);
      setFacing(nextFacing);
      setHasAudio(result.hasAudio);
      setTorchOn(false);
      setFrontFlashOn(false);
    } catch (error) {
      if (mountedRef.current) {
        onErrorRef.current(
          error instanceof Error ? error.message : "Couldn't open the camera.",
        );
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void applyStream("environment");
    return () => {
      mountedRef.current = false;
      if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
      if (maxDurationTimerRef.current !== null) window.clearTimeout(maxDurationTimerRef.current);
      if (elapsedTimerRef.current !== null) window.clearInterval(elapsedTimerRef.current);
      if (screenFlashTimerRef.current !== null) window.clearTimeout(screenFlashTimerRef.current);
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        deliverVideoOnStopRef.current = false;
        try {
          recorder.stop();
        } catch {
          // The recorder may already have stopped while the camera sheet closed.
        }
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [applyStream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => {});
    const track = stream.getVideoTracks()[0];
    const capabilities = track?.getCapabilities?.() as
      | (MediaTrackCapabilities & { torch?: boolean })
      | undefined;
    setTorchAvailable(facing === "environment" && capabilities?.torch === true);
  }, [facing, stream]);

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
    if (!activeStream || loading) return;
    if (typeof MediaRecorder === "undefined") {
      onErrorRef.current("Video recording is not supported on this device.");
      return;
    }

    const candidates = [
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    const mimeType = candidates.find((type) => MediaRecorder.isTypeSupported?.(type)) ?? "";
    try {
      const recorder = mimeType
        ? new MediaRecorder(activeStream, { mimeType })
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
        if (!deliverVideoOnStopRef.current) {
          chunksRef.current = [];
          return;
        }

        const type = recorder.mimeType || chunksRef.current[0]?.type || "video/webm";
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        if (!blob.size) {
          onErrorRef.current("The camera didn't capture a video. Please try again.");
          return;
        }
        const extension = type.toLowerCase().includes("mp4") ? "mp4" : "webm";
        onVideoRef.current(
          new File([blob], `chat-video-${Date.now()}.${extension}`, { type }),
        );
        onCloseRef.current();
      };
      recorder.start(250);
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
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
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
    if (loading || !streamRef.current || recording) return;
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
    if (!torchAvailable) return;
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setTorchOn(next);
    } catch {
      onErrorRef.current("The back camera torch couldn't be changed.");
    }
  };

  const closeCamera = () => {
    if (recorderRef.current?.state === "recording") stopRecordingRef.current(false);
    onCloseRef.current();
  };

  return (
    <div className="fixed inset-0 z-[120] flex h-[100dvh] w-screen flex-col overflow-hidden bg-black text-white">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        aria-label="Live camera preview"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: facing === "user" ? "scaleX(-1)" : undefined }}
      />
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
            aria-label="Switch camera"
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
            disabled={loading || (facing === "environment" && !torchAvailable)}
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
        {loading ? (
          <LoaderCircle className="h-7 w-7 animate-spin text-white/80" />
        ) : hasAudio ? (
          <p className="text-xs text-white/80">Tap for photo · hold for video</p>
        ) : (
          <p className="text-xs text-white/80">Tap for photo · hold for silent video · no microphone</p>
        )}
        <button
          type="button"
          aria-label="Tap to take a photo or hold to record a video"
          disabled={loading || !stream}
          onPointerDown={handleShutterDown}
          onPointerUp={handleShutterUp}
          onPointerCancel={handleShutterCancel}
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
