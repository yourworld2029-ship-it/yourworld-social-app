import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Loader2, Upload, Video } from "lucide-react";
import { toast } from "sonner";
import { publishDirectReel } from "@/lib/social-data";

const MIN_REEL_SECONDS = 5;
const MAX_REEL_SECONDS = 90;

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
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
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (nextFile: File | undefined) => {
    if (!nextFile) return;
    if (!nextFile.type.startsWith("video/")) {
      setError("Choose a video file.");
      return;
    }
    setError(null);
    setDuration(null);
    setDimensions({ width: 0, height: 0 });
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

  const publish = async () => {
    if (!file || duration == null) {
      setError("Choose a video and wait for its duration to load.");
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

    const result = await publishDirectReel({
      file,
      title,
      caption,
      hashtags: parsedHashtags,
      durationSeconds: duration,
      originalWidth: dimensions.width || null,
      originalHeight: dimensions.height || null,
      onProgress: setProgress,
    });

    setPublishing(false);
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success("Reel published");
    navigate({ to: "/reels", search: { reelId: undefined } });
  };

  return (
    <main className="min-h-screen bg-black px-4 pb-24 pt-5 text-white">
      <div className="mx-auto w-full max-w-lg">
        <header className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
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
            <div className="relative mx-auto aspect-[9/16] w-full max-w-sm overflow-hidden rounded-2xl bg-zinc-900">
              <video
                src={previewUrl}
                className="h-full w-full object-cover"
                controls
                playsInline
                preload="metadata"
                onLoadedMetadata={handleMetadata}
              />
              <button
                type="button"
                onClick={resetVideo}
                className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur"
              >
                Replace
              </button>
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
            <div className="flex items-center gap-2 text-xs text-zinc-400">
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
              className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-pink-500"
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
              className="w-full resize-none rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-pink-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold">Hashtags</span>
            <input
              value={hashtags}
              onChange={(event) => setHashtags(event.target.value)}
              placeholder="#travel #music"
              className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-pink-500"
            />
          </label>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            type="button"
            onClick={publish}
            disabled={publishing || !file || duration == null || duration < MIN_REEL_SECONDS || duration > MAX_REEL_SECONDS}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-3.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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