import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { historyBackOr } from "@/lib/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Loader2,
  Pause,
  Play,
  Upload,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { publishDirectReel } from "@/lib/social-data";
import { useUploadActions } from "@/lib/upload-progress";
import { Switch } from "@/components/ui/switch";

const MIN_REEL_SECONDS = 5;
const MAX_REEL_SECONDS = 90;
const MAX_REEL_BYTES = 104_857_600;

export const Route = createFileRoute("/create")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "live" ? ("live" as const) : ("reel" as const),
  }),
  head: () => ({
    meta: [
      { title: "Upload a Reel — YourWorld" },
      {
        name: "description",
        content: "Upload and publish a Reel directly from your device.",
      },
    ],
  }),
  component: DirectReelUploadPage,
});

function DirectReelUploadPage() {
  const navigate = useNavigate();
  const { startUpload } = useUploadActions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [allowDownload, setAllowDownload] = useState(true);
  const [progress, setProgress] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const resetVideo = () => {
    setFile(null);
    setDuration(null);
    setDimensions({ width: 0, height: 0 });
    setCurrentTime(0);
    setIsPlaying(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (nextFile: File | undefined) => {
    if (!nextFile) return;
    if (!nextFile.type.startsWith("video/")) {
      setError("Choose a video file.");
      return;
    }
    if (nextFile.size > MAX_REEL_BYTES) {
      toast.error("Reels must be under 100 MB.");
      return;
    }
    setError(null);
    setDuration(null);
    setDimensions({ width: 0, height: 0 });
    setCurrentTime(0);
    setIsPlaying(false);
    setFile(nextFile);
  };

  const handleMetadata = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const nextDuration = Number.isFinite(video.duration) ? video.duration : null;
    setDuration(nextDuration);
    setDimensions({ width: video.videoWidth, height: video.videoHeight });
    if (nextDuration == null) {
      setError("Could not read the video duration.");
    } else if (nextDuration < MIN_REEL_SECONDS || nextDuration > MAX_REEL_SECONDS) {
      setError(`Reels must be between ${MIN_REEL_SECONDS} and ${MAX_REEL_SECONDS} seconds.`);
    } else {
      setError(null);
    }
  };

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      await video.play();
    } else {
      video.pause();
    }
  };

  const handleTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    setCurrentTime(event.currentTarget.currentTime);
  };

  const publish = () => {
    if (!file || duration == null) {
      setError("Choose a video and wait for its duration to load.");
      return;
    }
    if (file.size > MAX_REEL_BYTES) {
      toast.error("Reels must be under 100 MB.");
      return;
    }
    if (duration < MIN_REEL_SECONDS || duration > MAX_REEL_SECONDS) {
      setError(`Reels must be between ${MIN_REEL_SECONDS} and ${MAX_REEL_SECONDS} seconds.`);
      return;
    }
    if (!title.trim()) {
      setError("Add a title before publishing.");
      return;
    }

    setPublishing(true);
    setProgress(0);
    setError(null);
    const parsedHashtags = hashtags
      .split(/[\s,]+/)
      .map((tag) => tag.replace(/^#/, "").trim())
      .filter(Boolean);

    // Keep the File and all publish metadata captured by this runner. The
    // global task survives route unmount while the SPA remains open.
    void startUpload(
      { kind: "reel", label: title.trim() || "New reel", viewTo: "/reels" },
      (onProgress) =>
        publishDirectReel({
          file,
          title,
          caption,
          hashtags: parsedHashtags,
          allowDownload,
          durationSeconds: duration,
          originalWidth: dimensions.width || null,
          originalHeight: dimensions.height || null,
          onProgress,
        }),
    ).then(({ error: uploadError }) => {
      if (uploadError) {
        toast.error(uploadError);
        return;
      }
      toast.success("Reel published");
    });

    navigate({
      to: "/reels",
      search: {
        reelId: undefined,
        userId: undefined,
        initialVideoId: undefined,
        returnTo: undefined,
      },
    });
  };

  return (
    <main className="min-h-screen bg-black px-4 pb-24 pt-5 text-white">
      <div className="mx-auto w-full max-w-lg">
        <header className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => historyBackOr(() => void navigate({ to: "/" }))}
            className="rounded-full p-2 text-white/80 transition hover:bg-white/10"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-400">
              Create
            </p>
            <h1 className="text-2xl font-bold">Upload a Reel</h1>
          </div>
        </header>

        <section className="space-y-5 rounded-3xl border border-white/10 bg-zinc-950 p-4 shadow-2xl">
          {previewUrl ? (
            <div className="group relative mx-auto aspect-[9/16] w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl ring-1 ring-white/5">
              <video
                ref={videoRef}
                src={previewUrl}
                className="h-full w-full object-cover"
                controlsList="nodownload noplaybackrate nofullscreen"
                disablePictureInPicture
                disableRemotePlayback
                playsInline
                preload="none"
                onLoadedMetadata={handleMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
              <button
                type="button"
                onClick={togglePlayback}
                className="absolute inset-0 flex items-center justify-center text-white transition-opacity duration-300"
                aria-label={isPlaying ? "Pause preview" : "Play preview"}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-black/55 active:scale-95">
                  {isPlaying ? (
                    <Pause className="h-5 w-5 fill-current" />
                  ) : (
                    <Play className="ml-0.5 h-5 w-5 fill-current" />
                  )}
                </span>
              </button>
              <button
                type="button"
                onClick={resetVideo}
                className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/60 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md transition hover:bg-black/80"
              >
                Replace
              </button>
              <div className="pointer-events-none absolute inset-x-4 bottom-4 h-1 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.7)] transition-[width] duration-150"
                  style={{
                    width: duration && duration > 0
                      ? `${Math.min(100, (currentTime / duration) * 100)}%`
                      : "0%",
                  }}
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mx-auto flex aspect-[9/16] w-full max-w-sm flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/20 bg-zinc-900 text-center transition hover:border-pink-400/70 hover:bg-zinc-800"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-pink-500/15 text-pink-300">
                <Video className="h-7 w-7" />
              </span>
              <span className="text-sm font-semibold">Choose a video</span>
              <span className="text-xs text-zinc-400">5–90 seconds</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(event) => handleFileChange(event.target.files?.[0])}
          />

          {duration != null && (
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              {duration.toFixed(1)} seconds
              {dimensions.width > 0 && ` · ${dimensions.width}×${dimensions.height}`}
            </div>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-semibold">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Give your Reel a title"
              maxLength={120}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold">Caption</span>
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Tell people about this Reel"
              rows={4}
              maxLength={2200}
              className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold">Hashtags</span>
            <input
              value={hashtags}
              onChange={(event) => setHashtags(event.target.value)}
              placeholder="#travel #music"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </label>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex min-w-0 items-start gap-3">
              <Download className="mt-0.5 h-4 w-4 shrink-0 text-pink-300" />
              <div>
                <p className="text-sm font-semibold">Allow downloads for this Reel</p>
                <p className="mt-1 text-xs text-white/60">
                  Viewers can download it from the More menu
                </p>
              </div>
            </div>
            <Switch
              checked={allowDownload}
              onCheckedChange={setAllowDownload}
              aria-label="Allow downloads for this Reel"
            />
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            type="button"
            onClick={publish}
            disabled={publishing || !file || duration == null || duration < MIN_REEL_SECONDS || duration > MAX_REEL_SECONDS}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {publishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing {progress}%
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Publish Reel
              </>
            )}
          </button>
        </section>
      </div>
    </main>
  );
}