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
  Search,
  Upload,
  UserRound,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { publishDirectReel } from "@/lib/social-data";
import { getReelVideoSizeError } from "@/lib/video-upload-limits";
import { useUploadActions } from "@/lib/upload-progress";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-store";
import { searchPublicProfiles, type PublicSearchProfile } from "@/lib/search-data";
import {
  announceOptimisticPost,
  removeOptimisticPost,
} from "@/lib/published-feed";
import { generateVideoThumbnail } from "@/lib/video-frames";
import {
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
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewThumbnail, setPreviewThumbnail] = useState<Blob | null>(null);
  const [previewThumbnailUrl, setPreviewThumbnailUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [caption, setCaption] = useState("");
  const [allowDownload, setAllowDownload] = useState(true);
  const [collaboratorQuery, setCollaboratorQuery] = useState("");
  const [collaboratorResults, setCollaboratorResults] = useState<PublicSearchProfile[]>([]);
  const [selectedCollaborator, setSelectedCollaborator] = useState<PublicSearchProfile | null>(null);
  const [collaboratorLoading, setCollaboratorLoading] = useState(false);
  const [collaboratorError, setCollaboratorError] = useState<string | null>(null);
  const [paidPartnership, setPaidPartnership] = useState(false);
  const [progress, setProgress] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setPreviewThumbnail(null);
      setPreviewThumbnailUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    let cancelled = false;
    let thumbnailUrl: string | null = null;
    setPreviewUrl(url);
    setPreviewThumbnail(null);
    setPreviewThumbnailUrl(null);
    void generateVideoThumbnail(file, 1)
      .then((thumbnail) => {
        if (!thumbnail || cancelled) return;
        thumbnailUrl = URL.createObjectURL(thumbnail);
        setPreviewThumbnail(thumbnail);
        setPreviewThumbnailUrl(thumbnailUrl);
      })
      .catch(() => {
        // The inline video preview remains available if thumbnail capture fails.
      });
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
      if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    };
  }, [file]);

  useEffect(() => {
    const term = collaboratorQuery.trim();
    if (selectedCollaborator || term.replace(/^@/, "").trim().length < 2) {
      setCollaboratorResults([]);
      setCollaboratorError(null);
      setCollaboratorLoading(false);
      return;
    }

    let active = true;
    setCollaboratorLoading(true);
    setCollaboratorError(null);
    const timeout = window.setTimeout(() => {
      void searchPublicProfiles(term)
        .then((profiles) => {
          if (!active) return;
          setCollaboratorResults(
            profiles
              .filter((profile) => profile.id !== user?.id && profile.username)
              .slice(0, 6),
          );
        })
        .catch((cause) => {
          if (!active) return;
          setCollaboratorResults([]);
          setCollaboratorError(
            cause instanceof Error ? cause.message : "Couldn't search accounts.",
          );
        })
        .finally(() => {
          if (active) setCollaboratorLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [collaboratorQuery, selectedCollaborator, user?.id]);

  const resetVideo = () => {
    setFile(null);
    setDuration(null);
    setDimensions({ width: 0, height: 0 });
    setCurrentTime(0);
    setIsPlaying(false);
    setError(null);
    setPreviewThumbnail(null);
    setPreviewThumbnailUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (nextFile: File | undefined) => {
    if (!nextFile) return;
    if (!nextFile.type.startsWith("video/")) {
      setError("Choose a video file.");
      return;
    }
    const sizeError = getReelVideoSizeError(nextFile.size);
    if (sizeError) {
      setFile(null);
      setDuration(null);
      setError(sizeError);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
    if (publishing) return;
    setError(null);
    if (supportsNativeVideoOptimization()) {
      try {
        const nativeFile = await pickAndOptimizeNativeVideo(() => undefined);
        if (nativeFile) handleFileChange(nativeFile);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Could not prepare this video.");
      }
      return;
    }
    fileInputRef.current?.click();
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

  const playPreview = async () => {
    const video = videoRef.current;
    if (!video || !video.paused) return;
    try {
      await video.play();
    } catch {
      setIsPlaying(false);
    }
  };

  const pausePreview = () => {
    videoRef.current?.pause();
  };

  const seekPreview = (time: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    const nextTime = Math.max(0, Math.min(time, video.duration));
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    setCurrentTime(event.currentTarget.currentTime);
  };

  const publish = () => {
    if (!file || duration == null) {
      setError("Choose a video and wait for its duration to load.");
      return;
    }
    const sizeError = getReelVideoSizeError(file.size);
    if (sizeError) {
      setError(sizeError);
      return;
    }
    if (duration < MIN_REEL_SECONDS || duration > MAX_REEL_SECONDS) {
      setError(`Reels must be between ${MIN_REEL_SECONDS} and ${MAX_REEL_SECONDS} seconds.`);
      return;
    }
    setPublishing(true);
    setProgress(0);
    setError(null);
    const normalizedCaption = caption.trim();
    const reelTitle =
      normalizedCaption.split(/\r?\n/, 1)[0]?.slice(0, 120) || "New reel";
    const parsedHashtags = [
      ...new Set(
        normalizedCaption
          .split(/\s+/)
          .filter((tag) => tag.startsWith("#"))
          .map((tag) => tag.slice(1).replace(/[^\p{L}\p{N}_].*$/u, ""))
          .filter(Boolean),
      ),
    ];
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
        title: reelTitle,
        caption: normalizedCaption,
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
    let uploadStarted = false;
    const uploadPromise = startUpload(
      {
        kind: "reel",
        label: reelTitle,
        viewTo: "/reels",
        isVideo: true,
      },
      (onProgress, signal) =>
        publishDirectReel({
          file,
          title: reelTitle,
          caption: normalizedCaption,
          hashtags: parsedHashtags,
          allowDownload,
           collaboratorUserId: selectedCollaborator?.id ?? null,
           paidPromotion: paidPartnership,
          durationSeconds: duration,
          originalWidth: dimensions.width || null,
          originalHeight: dimensions.height || null,
          thumbnail: previewThumbnail,
          optimisticId: optimisticId ?? undefined,
          onProgress,
          signal,
        }),
      () => {
        uploadStarted = true;
      },
    );
    if (!uploadStarted) {
      removeOptimisticPost(optimisticId);
      return;
    }
    void uploadPromise.then(({ error: uploadError, cancelled, collaborationError }) => {
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
      if (collaborationError) {
        toast.error("Reel published, but the collaboration invite could not be sent.");
      }
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
              {previewThumbnailUrl ? (
                <img
                  src={previewThumbnailUrl}
                  alt=""
                  className={`pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover transition-opacity ${
                    isPlaying ? "opacity-0" : "opacity-100"
                  }`}
                />
              ) : null}
              <video
                ref={videoRef}
                src={previewUrl}
                className="absolute inset-0 h-full w-full object-cover"
                controlsList="nodownload noplaybackrate nofullscreen"
                disablePictureInPicture
                disableRemotePlayback
                playsInline
                preload="metadata"
                onLoadedMetadata={handleMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
              <button
                type="button"
                onClick={resetVideo}
                className="absolute right-3 top-3 z-[2] rounded-full border border-white/15 bg-black/60 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md transition hover:bg-black/80"
              >
                Replace
              </button>
              <input
                type="range"
                aria-label="Seek Reel preview"
                min={0}
                max={duration ?? 0}
                step={0.1}
                value={Math.min(currentTime, duration ?? 0)}
                onChange={(event) => seekPreview(Number(event.currentTarget.value))}
                onPointerUp={() => {
                  if (videoRef.current?.paused) void playPreview();
                }}
                disabled={duration === null || duration <= 0}
                className="absolute inset-x-4 bottom-1 z-[3] h-8 w-[calc(100%-2rem)] cursor-pointer accent-white disabled:cursor-not-allowed"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void chooseVideo()}
              disabled={publishing}
              className="mx-auto flex aspect-[9/16] w-full max-w-sm flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/20 bg-zinc-900 text-center transition hover:border-pink-400/70 hover:bg-zinc-800"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-pink-500/15 text-pink-300">
                <Video className="h-7 w-7" />
              </span>
              <span className="text-sm font-semibold">Choose a video</span>
              <span className="text-xs text-zinc-400">5–90 seconds</span>
            </button>
          )}

          {previewUrl && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => void playPreview()}
                disabled={isPlaying || duration === null}
                className="inline-flex min-w-28 items-center justify-center gap-2 rounded-full border border-white/15 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Play Reel preview"
              >
                <Play className="h-4 w-4 fill-current" />
                Play
              </button>
              <button
                type="button"
                onClick={pausePreview}
                disabled={!isPlaying}
                className="inline-flex min-w-28 items-center justify-center gap-2 rounded-full border border-white/15 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Pause Reel preview"
              >
                <Pause className="h-4 w-4 fill-current" />
                Pause
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(event) => {
              handleFileChange(event.target.files?.[0]);
            }}
          />

          {duration != null && (
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              {duration.toFixed(1)} seconds
            </div>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-semibold">Caption</span>
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Write a caption and add hashtags..."
              rows={4}
              maxLength={2200}
              className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3.5 text-sm text-white caret-white selection:bg-fuchsia-500/40 selection:text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              style={{ WebkitTextFillColor: "#fff" }}
            />
          </label>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start gap-3">
              <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-pink-300" />
              <div>
                <p className="text-sm font-semibold">Invite Collaborator (Max 1)</p>
                <p className="mt-1 text-xs text-white/60">
                  Search by username and add one account to this Reel.
                </p>
              </div>
            </div>
            {selectedCollaborator ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-violet-400/30 bg-violet-500/10 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  {selectedCollaborator.avatar_url ? (
                    <img
                      src={selectedCollaborator.avatar_url}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold text-white">
                      {(selectedCollaborator.name || selectedCollaborator.username)
                        .slice(0, 1)
                        .toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-white">
                      {selectedCollaborator.name || `@${selectedCollaborator.username}`}
                    </span>
                    <span className="block truncate text-xs text-white/60">
                      @{selectedCollaborator.username}
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCollaborator(null);
                    setCollaboratorQuery("");
                  }}
                  aria-label="Remove collaborator"
                  className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3">
                  <Search className="h-4 w-4 shrink-0 text-white/45" />
                  <input
                    value={collaboratorQuery}
                    onChange={(event) => setCollaboratorQuery(event.target.value)}
                    placeholder="Search username"
                    autoComplete="off"
                    className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                    aria-label="Search collaborator by username"
                  />
                </div>
                {collaboratorLoading ? (
                  <p className="px-1 text-xs text-white/55">Searching accounts…</p>
                ) : null}
                {collaboratorError ? (
                  <p role="alert" className="px-1 text-xs text-red-300">{collaboratorError}</p>
                ) : null}
                {!collaboratorLoading &&
                !collaboratorError &&
                collaboratorQuery.trim().replace(/^@/, "").length >= 2 &&
                collaboratorResults.length === 0 ? (
                  <p className="px-1 text-xs text-white/55">No matching accounts found.</p>
                ) : null}
                {collaboratorResults.length > 0 ? (
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-zinc-950">
                    {collaboratorResults.map((profile) => (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => {
                          setSelectedCollaborator(profile);
                          setCollaboratorQuery("");
                          setCollaboratorResults([]);
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.07]"
                      >
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold text-white">
                            {(profile.name || profile.username).slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-white">
                            {profile.name || `@${profile.username}`}
                          </span>
                          <span className="block truncate text-xs text-white/60">
                            @{profile.username}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex min-w-0 items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pink-300" />
              <div>
                <p className="text-sm font-semibold">Paid Partnership Label</p>
                <p className="mt-1 text-xs text-white/60">
                  Mark this Reel as paid or sponsored content.
                </p>
              </div>
            </div>
            <Switch
              checked={paidPartnership}
              onCheckedChange={setPaidPartnership}
              aria-label="Paid Partnership Label"
            />
          </div>

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