import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Mic,
  Radio,
  SwitchCamera,
} from "lucide-react";
import { historyBackOr } from "@/lib/navigation";
import { endLiveStream, startLiveStream } from "@/lib/live-data";
import {
  handOffLiveStream,
  takeHandedOffLiveStream,
} from "@/lib/live-stream-registry";

type CameraFacingMode = "user" | "environment";

export const Route = createFileRoute("/live/create")({
  head: () => ({
    meta: [
      { title: "Go Live — YourWorld" },
      {
        name: "description",
        content: "Set up a live broadcast on YourWorld.",
      },
    ],
  }),
  component: LiveCreatePage,
});

function LiveCreatePage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRequestId = useRef(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<CameraFacingMode>("user");
  const [title, setTitle] = useState("");
  const [cameraBusy, setCameraBusy] = useState(false);
  const [startingLive, setStartingLive] = useState(false);
  const startInFlightRef = useRef(false);
  const [cameraError, setCameraError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    void video.play().catch(() => {});

    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  useEffect(
    () => () => {
      cameraRequestId.current += 1;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    },
    [],
  );

  const startCamera = async (requestedFacingMode: CameraFacingMode = facingMode) => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera and microphone preview are not available in this browser.");
      return;
    }

    const requestId = ++cameraRequestId.current;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    setFacingMode(requestedFacingMode);
    setCameraBusy(true);
    setCameraError("");
    setActionMessage("");
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60, min: 30 },
          facingMode: requestedFacingMode,
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 2,
        },
      });
      if (requestId !== cameraRequestId.current) {
        nextStream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = nextStream;
      setStream(nextStream);
    } catch (error) {
      if (requestId !== cameraRequestId.current) return;
      const name = error instanceof DOMException ? error.name : "";
      setCameraError(
        name === "NotAllowedError"
          ? "Camera or microphone access was denied. Allow access in your browser settings and try again."
          : name === "NotFoundError"
            ? "No camera or microphone was found on this device."
            : "Could not start the camera and microphone preview. Check your devices and try again.",
      );
    } finally {
      if (requestId === cameraRequestId.current) setCameraBusy(false);
    }
  };

  const turnCameraOff = () => {
    cameraRequestId.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    setCameraBusy(false);
  };

  const handleGoLive = () => {
    if (!title.trim()) {
      setActionMessage("Add a stream title before continuing.");
      return;
    }
    if (!stream) {
      setActionMessage("Turn on your camera preview before continuing.");
      return;
    }
    void startBroadcast();
  };

  const startBroadcast = async () => {
    const activeStream = streamRef.current ?? stream;
    if (!title.trim()) {
      setActionMessage("Add a stream title before continuing.");
      return;
    }
    if (!activeStream) {
      setActionMessage("Turn on your camera preview before continuing.");
      return;
    }
    if (startInFlightRef.current) return;

    startInFlightRef.current = true;
    setStartingLive(true);
    setActionMessage("");
    let result: Awaited<ReturnType<typeof startLiveStream>>;
    try {
      result = await startLiveStream(title);
    } catch (cause) {
      console.error("[live] Could not start the live room", cause);
      setActionMessage("Could not start the live room. Check your connection and try again.");
      startInFlightRef.current = false;
      setStartingLive(false);
      return;
    }
    if (!result.streamId || result.error) {
      setActionMessage(result.error || "Could not start the live room.");
      startInFlightRef.current = false;
      setStartingLive(false);
      return;
    }

    handOffLiveStream(activeStream);
    streamRef.current = null;
    setStream(null);
    try {
      await navigate({
        to: "/live/$streamId",
        params: { streamId: result.streamId },
      });
    } catch (cause) {
      console.error("[live] Could not open the live room", cause);
      const carriedStream = takeHandedOffLiveStream();
      carriedStream?.getTracks().forEach((track) => track.stop());
      await endLiveStream(result.streamId).catch((endCause) => {
        console.error("[live] Could not close the unopenable room", endCause);
      });
      setActionMessage("The live room started, but could not be opened.");
      startInFlightRef.current = false;
      setStartingLive(false);
    }
  };

  return (
    <main className="min-h-screen bg-black px-4 pb-28 pt-5 text-white">
      <div className="mx-auto w-full max-w-lg">
        <header className="mb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => historyBackOr(() => void navigate({ to: "/" }))}
            className="rounded-full p-2 text-white/80 transition hover:bg-white/10"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-400">
              Create
            </p>
            <h1 className="text-2xl font-bold">Set up your live</h1>
          </div>
        </header>

        <section className="space-y-5 rounded-3xl border border-white/10 bg-zinc-950 p-4 shadow-2xl">
          <div className="relative mx-auto h-[68svh] min-h-[320px] max-h-[720px] w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
            {stream ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                aria-label="Private live camera and microphone preview"
                className="h-full w-full object-cover transition-transform duration-300 ease-out"
                style={{
                  transform: facingMode === "user" ? "scaleX(-1)" : "scaleX(1)",
                }}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white/70">
                  <CameraOff className="h-6 w-6" />
                </span>
                <p className="text-sm font-medium">Camera preview is off</p>
                <p className="text-xs text-white/55">
                  Enable your camera and microphone to check your setup before going live.
                </p>
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  disabled={cameraBusy}
                  className="mt-1 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/15 disabled:cursor-wait disabled:opacity-60"
                >
                  {cameraBusy ? (
                    "Starting camera…"
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      Enable camera &amp; mic
                    </>
                  )}
                </button>
              </div>
            )}
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <span className={`h-2 w-2 rounded-full ${stream ? "bg-emerald-400" : "bg-white/40"}`} />
              {stream && <Mic className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />}
              {stream ? "PRIVATE PREVIEW" : "CAMERA OFF"}
            </div>
            {stream && (
              <div className="absolute right-3 top-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void startCamera(facingMode === "user" ? "environment" : "user")
                  }
                  disabled={cameraBusy}
                  aria-label={
                    facingMode === "user"
                      ? "Switch to rear camera"
                      : "Switch to front camera"
                  }
                  title={
                    facingMode === "user"
                      ? "Switch to rear camera"
                      : "Switch to front camera"
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/60 backdrop-blur transition hover:bg-black/80 disabled:opacity-60"
                >
                  <SwitchCamera className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={turnCameraOff}
                  className="rounded-full border border-white/15 bg-black/60 px-3 py-2 text-xs font-semibold backdrop-blur transition hover:bg-black/80"
                >
                  Turn camera off
                </button>
              </div>
            )}
          </div>

          {cameraError && (
            <p role="alert" className="text-sm text-rose-300">
              {cameraError}
            </p>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-semibold">Stream title</span>
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.currentTarget.value);
                setActionMessage("");
              }}
              maxLength={100}
              placeholder="What are you going live about?"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-rose-400/70"
            />
            <span className="block text-right text-xs text-white/45">{title.length}/100</span>
          </label>

          <div className="rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] px-3.5 py-3 text-xs leading-relaxed text-cyan-100/80">
            Your live video is sent directly to viewers. YourWorld does not save a replay or store your camera and microphone stream.
          </div>

          {actionMessage && (
            <p role="status" aria-live="polite" className="text-sm text-white/75">
              {actionMessage}
            </p>
          )}

          <button
            type="button"
            onClick={handleGoLive}
            disabled={startingLive || cameraBusy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-950/30 transition hover:brightness-110 active:scale-[0.99]"
          >
            <Radio className="h-4 w-4" />
            {startingLive ? "Starting live…" : "Go Live"}
          </button>
        </section>
      </div>
    </main>
  );
}