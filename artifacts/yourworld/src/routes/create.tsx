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
import { useAuth } from "@/lib/auth-store";
import {
  announceOptimisticPost,
  removeOptimisticPost,
} from "@/lib/published-feed";
import {
  cancelNativeVideoOptimization,
  pickAndOptimizeNativeVideo,
  supportsNativeVideoOptimization,
} from "@/lib/native-video-optimization";

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
  const { startUpload } = useUploadActions();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mountedRef = useRef(true);
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
  const [preparingVideo, setPreparingVideo] = useState(false);
  const [optimizingVideo, setOptimizingVideo] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      void cancelNativeVideoOptimization();
    };
  }, []);

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
    void cancelNativeVideoOptimization();
    setFile(null);
    setDuration(null);
    setDimensions({ width: 0, height: 0 });
    setCurrentTime(0);
    setIsPlaying(false);
    setError(null);
    setPreparingVideo(false);
    setOptimizingVideo(false);
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
    setCurrentTime(0);
    setIsPlaying(false);
    setFile(nextFile);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const chooseVideo = async () => {
    if (preparingVideo || optimizingVideo) return;
    if (!supportsNativeVideoOptimization()) {
      fileInputRef.current?.click();
      return;
    }
    setError(null);
    setPreparingVideo(true);
    setOptimizationProgress(0);
    try {
      const optimizedFile = await pickAndOptimizeNativeVideo((percent) => {
        if (!mountedRef.current) return;
        setPreparingVideo(false);
        setOptimizingVideo(true);
        setOptimizationProgress(percent);
      });
      if (!mountedRef.current || !optimizedFile) return;
      handleFileChange(optimizedFile);
    } catch (error) {
      if (!mountedRef.current) return;
      const message =
        error instanceof Error ? error.message : "Video optimization failed.";
      setError(message);
      toast.error(message);
    } finally {
      if (mountedRef.current) {
        setPreparingVideo(false);
        setOptimizingVideo(false);
      }
    }
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
    const userMetadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const username =
      (typeof userMetadata.username === "string" && userMetadata.username) ||
      (typeof userMetadata.user_name === "string" && userMetadata.user_name) ||
      user?.email?.split("@")[0] ||
      "you";
    const displayName =
      (typeof userMetadata.display_name === "string" && userMetadata.display_name) ||
      (typeof userMetadata.full_name === "string" && userMetadata.full_name) ||
      username;
    const avatarUrl =
      (typeof userMetadata.avatar_url === "string" && userMetadata.avatar_url) ||
      (typeof userMetadata.profile_pic === "string" && userMetadata.profile_pic) ||
      (typeof userMetadata.profile_image === "string" && userMetadata.profile_image) ||
      (typeof userMetadata.picture === "string" && userMetadata.picture) ||
      null;
    const optimisticId = user?.id
      ? `optimistic-reel-${crypto.randomUUID()}`
      : null;
    if (optimisticId && user?.id) {
      announceOptimisticPost({
        id: optimisticId,
        kind: "reel",
        userId: user.id,
        file,
        title: title.trim(),
        caption: caption.trim(),
        hashtags: parsedHashtags,
        allowDownload,
        createdAt: new Date().toISOString(),
        durationSeconds: duration,
        originalWidth: dimensions.width || null,
        originalHeight: dimensions.height || null,
        thumbnailUrl: null,
        username,
        displayName,
        avatarUrl,
      });
    }

    // Keep the File and all publish metadata captured by this runner. The
    // global task survives route unmount while the SPA remains open.
    void startUpload(
      {
        kind: "reel",
        label: title.trim() || "New reel",
        viewTo: "/reels",
        isVideo: true,
      },
      (onProgress, signal) =>
        publishDirectReel({
          file,
          title,
          caption,
          hashtags: parsedHashtags,
          allowDownload,
          durationSeconds: duration,
          originalWidth: dimensions.width || null,
          originalHeight: dimensions.height || null,
          optimisticId: optimisticId ?? undefined,
          onProgress,
          signal,
        }),
    ).then(({ error: uploadError, cancelled }) => {
      if (cancelled) {
        removeOptimisticPost(optimisticId);
        return;
      }
      if (uploadError) {
        removeOptimisticPost(optimisticId);
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
              onClick={() => void chooseVideo()}
              disabled={preparingVideo || optimizingVideo}
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

          {(preparingVideo || optimizingVideo) && (
            <div
              className="mx-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-xl border border-pink-400/20 bg-pink-500/10 px-4 py-3 text-sm text-pink-100"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              {optimizingVideo
                ? `Optimizing video... ${optimizationProgress}%`
                : "Choose a video to optimize"}
            </div>
          )}

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
            disabled={publishing || preparingVideo || optimizingVideo || !file || duration == null || duration < MIN_REEL_SECONDS || duration > MAX_REEL_SECONDS}
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