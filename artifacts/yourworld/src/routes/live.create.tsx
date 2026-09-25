import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Camera, CameraOff, Radio } from "lucide-react";
import { historyBackOr } from "@/lib/navigation";

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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [title, setTitle] = useState("");
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    void video.play().catch(() => {});

    return () => {
      video.srcObject = null;
      stream.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);

  const startCamera = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera preview is not available in this browser.");
      return;
    }

    setCameraBusy(true);
    setCameraError("");
    setActionMessage("");
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "user" } },
        audio: false,
      });
      setStream(nextStream);
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      setCameraError(
        name === "NotAllowedError"
          ? "Camera access was denied. Allow camera access in your browser settings and try again."
          : name === "NotFoundError"
            ? "No camera was found on this device."
            : "Could not start the camera preview. Check your camera and try again.",
      );
    } finally {
      setCameraBusy(false);
    }
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
    setActionMessage(
      "Live broadcasting is not connected yet. Your camera preview is private; no broadcast has started.",
    );
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
          <div className="relative mx-auto aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
            {stream ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                aria-label="Private live camera preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white/70">
                  <CameraOff className="h-6 w-6" />
                </span>
                <p className="text-sm font-medium">Camera preview is off</p>
                <p className="text-xs text-white/55">
                  Turn on your camera to check your shot before going live.
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
                      Enable camera
                    </>
                  )}
                </button>
              </div>
            )}
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <span className={`h-2 w-2 rounded-full ${stream ? "bg-emerald-400" : "bg-white/40"}`} />
              {stream ? "PRIVATE PREVIEW" : "CAMERA OFF"}
            </div>
            {stream && (
              <button
                type="button"
                onClick={() => setStream(null)}
                className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-semibold backdrop-blur transition hover:bg-black/80"
              >
                Turn camera off
              </button>
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

          <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.06] px-3.5 py-3 text-xs leading-relaxed text-amber-100/80">
            This screen provides a private camera preview. A live-streaming service is not connected yet.
          </div>

          {actionMessage && (
            <p role="status" aria-live="polite" className="text-sm text-white/75">
              {actionMessage}
            </p>
          )}

          <button
            type="button"
            onClick={handleGoLive}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-950/30 transition hover:brightness-110 active:scale-[0.99]"
          >
            <Radio className="h-4 w-4" />
            Go Live
          </button>
        </section>
      </div>
    </main>
  );
}