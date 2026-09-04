import { useEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Archive,
  ArrowLeft,
  Bookmark,
  Download,
  Heart,
  Link2,
  MapPin,
  MessageCircle,
  MessageCircleOff,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Send,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CommentsSheet } from "@/components/yw/CommentsSheet";
import { ShareSheet } from "@/components/yw/ShareSheet";
import { VideoPoster } from "@/components/yw/VideoPoster";
import { YwAvatar } from "@/components/yw/Avatar";
import { DownloadSheet, type DownloadChoice } from "@/components/yw/DownloadSheet";
import {
  deleteMyPost,
  updateMyPost,
} from "@/lib/profile-data";
import {
  resolveMediaUrl,
  timeAgo,
  useMediaPost,
} from "@/lib/social-data";
import { usePostSaves } from "@/lib/post-actions";
import { resolveLongVideoUrl } from "@/lib/video-data";
import { downloadAudioOnly, downloadVideoInBackground, sanitizeDownloadName } from "@/lib/yw-download";
import { formatCount } from "@/lib/yw-data";
import { isVideoQualityTier } from "@/lib/video-quality";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/video/$videoId")({
  head: () => ({
    meta: [
      { title: "YourWorld — View media" },
      {
        name: "description",
        content: "View a YourWorld post or reel with its creator, reactions and comments.",
      },
      { property: "og:title", content: "YourWorld — View media" },
      { property: "og:description", content: "A post from YourWorld." },
    ],
  }),
  component: MediaViewerPage,
});

function cleanMediaReference(value: unknown) {
  return typeof value === "string"
    ? value.trim().replace(/(?:\)|%29)+$/gi, "")
    : "";
}

function sanitizeVideoId(value: unknown) {
  if (typeof value !== "string") return "";
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // Keep the raw route value and strip unsafe characters below.
  }
  return decoded
    .trim()
    .replace(/(?:\)|%29)+$/gi, "")
    .trim()
    .replace(/[^a-zA-Z0-9-]/g, "");
}

type ViewerVideo = NonNullable<ReturnType<typeof useMediaPost>["post"]> & {
  video_url?: string | null;
  creator_name?: string | null;
  user?: { username?: string | null } | null;
  likes_count?: number | null;
};

function formatTime(value: number) {
  const totalSeconds = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function MediaViewerPage() {
  const params = Route.useParams();
  const cleanId = sanitizeVideoId(params.videoId);
  const mediaPostId = cleanId || null;
  const navigate = useNavigate();
  const {
    post: loadedPost,
    loading,
    error: postError,
    currentUserId,
    toggleLike,
    countView,
    reload,
  } = useMediaPost(mediaPostId);
  const { saved, toggleSave } = usePostSaves();
  const [src, setSrc] = useState<string | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [liking, setLiking] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const video = loadedPost as ViewerVideo | null;
  const postUserId = typeof video?.user_id === "string" ? video.user_id.trim() : "";
  const mediaUrl = cleanMediaReference(video?.media_url || video?.video_url);
  const videoUrl = src ?? "";
  const mediaType = typeof video?.media_type === "string" ? video.media_type : "";
  const videoTitle = typeof video?.title === "string" ? video.title : "";
  const postCaption = typeof video?.caption === "string" ? video.caption : "";
  const creatorUsername =
    video?.user?.username ||
    video?.creator_name ||
    video?.author?.username ||
    "user";
  const creatorName = video?.author?.name || creatorUsername;
  const likesCount = video?.likes_count || video?.likeCount || 0;
  const creator = video?.author ?? {
    id: postUserId || "unknown",
    username: creatorUsername,
    name: creatorName,
    hue: 0,
  };

  useEffect(() => {
    if (!loadedPost) return;
    let alive = true;
    const bucket = loadedPost.kind === "reel" ? "reels" : "videos";
    setSrc(null);
    setMediaLoading(true);
    setMediaError(null);
    void (loadedPost.kind === "reel"
      ? resolveMediaUrl(mediaUrl, bucket)
      : resolveLongVideoUrl(mediaUrl)
    )
      .then((url) => {
        if (!alive) return;
        if (url) {
          setSrc(url);
        } else {
          setMediaError("This media is no longer available.");
        }
      })
      .catch((cause) => {
        if (!alive) return;
        console.error("Unable to resolve media viewer source", cause);
        setMediaError("This media could not be loaded.");
      })
      .finally(() => {
        if (alive) setMediaLoading(false);
      });
    void resolveMediaUrl(loadedPost.authorAvatarUrl ?? "", "avatars")
      .then((url) => alive && setAvatarSrc(url || null))
      .catch((cause) => {
        if (!alive) return;
        console.error("Unable to resolve media viewer avatar", cause);
        setAvatarSrc(null);
      });
    setTitle(videoTitle);
    setCaption(postCaption);
    setLocation(loadedPost.location ?? "");
    return () => {
      alive = false;
    };
  }, [loadedPost, mediaUrl, postCaption, videoTitle]);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setProgress(0);
  }, [loadedPost?.id]);

  useEffect(() => {
    setCommentCount(loadedPost?.commentCount ?? 0);
  }, [loadedPost]);

  useEffect(() => {
    if (loadedPost) {
      void countView().catch((cause) => {
        console.error("Unable to count media viewer view", cause);
      });
    }
  }, [loadedPost, countView]);

  if (loading && !loadedPost) return <ViewerState label="Loading your media…" />;
  if (postError || !video) {
    return <ViewerState label="Video unavailable or deleted" error />;
  }
  if (mediaError && !src) return <ViewerState label="Video unavailable or deleted" error />;

  const post = video;
  const isMine = !!postUserId && currentUserId === postUserId;
  const isSaved = !!saved[post.id];
  const isVideo =
    post.kind === "video" ||
    post.kind === "reel" ||
    mediaType.startsWith("video");
  const ratio = mediaAspect(post);
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/video/${post.id}`
      : undefined;
  const isLongVideo = isVideo && post.kind !== "reel";

  const back = () => {
    void navigate({ to: "/profile" });
  };

  const handleLike = async () => {
    if (!currentUserId) {
      toast.error("Sign in to like this media");
      return;
    }
    if (liking) return;
    setLiking(true);
    try {
      await toggleLike();
    } catch {
      toast.error("Couldn't update like");
    } finally {
      setLiking(false);
    }
  };

  const handleSave = async () => {
    if (!currentUserId) {
      toast.error("Sign in to save this media");
      return;
    }
    try {
      const savedNow = await toggleSave(post.id);
      toast.success(savedNow ? "Saved to your collection" : "Removed from saved");
    } catch {
      toast.error("Couldn't update saved media");
    }
  };

  const updateManaged = async (
    patch: Parameters<typeof updateMyPost>[1],
    message: string,
  ) => {
    try {
      await updateMyPost(post.id, patch);
      toast.success(message);
      await reload();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Couldn't update media");
    }
  };

  const downloadSelected = async (choice: DownloadChoice) => {
    if (!src) return;
    const toastId = toast.loading("Preparing download…");
    try {
      const baseName = sanitizeDownloadName(postCaption || post.kind, `yw-${post.id}`);
      if (choice === "mp3") {
        await downloadAudioOnly(src, baseName);
      } else {
        await downloadVideoInBackground(src, `${baseName}.mp4`);
      }
      toast.success("Saved to your device", { id: toastId });
    } catch {
      toast.error("Couldn't save this media", { id: toastId });
    }
  };

  return (
    <main className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-background">
      <header className="header-lux flex shrink-0 items-center justify-between px-3 py-2.5">
        <button
          type="button"
          data-testid="button-viewer-back"
          onClick={back}
          aria-label="Back to profile"
          className="action-btn grid h-9 w-9 place-items-center rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Link
          data-testid="link-viewer-header-creator"
          to="/u/$userId"
          params={{ userId: postUserId }}
          className="flex min-w-0 flex-1 items-center gap-2.5 px-2"
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-primary/40"
            />
          ) : (
            <YwAvatar user={creator} size={32} />
          )}
          <span className="min-w-0 text-left">
            <span className="block truncate text-xs font-bold">
              @{creatorUsername}
              <span className="ml-2 font-normal text-muted-foreground">
                • {post.created_at ? timeAgo(post.created_at) : "Just now"}
              </span>
            </span>
            <span className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {post.kind === "reel" ? "Reel" : "Post"}
            </span>
          </span>
        </Link>
        {isMine ? (
          <button
            type="button"
            data-testid="button-viewer-manage"
            onClick={() => setManageOpen(true)}
            aria-label="Manage post"
            className="action-btn grid h-9 w-9 place-items-center rounded-full"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        ) : (
          <span className="h-9 w-9" aria-hidden />
        )}
      </header>

      <div className="min-h-0 w-full flex-1 overflow-y-auto overscroll-contain">
      <section className="w-full pb-8">
        <div
          className={cn(
             "sticky top-0 z-40 flex w-full items-center justify-center bg-black",
             isLongVideo ? "aspect-video" : "max-h-[75vh]",
          )}
          style={!isLongVideo ? { aspectRatio: String(ratio) } : undefined}
        >
        <div
          data-testid="media-viewer-stage"
          className="media-frame relative h-full w-full overflow-hidden bg-black"
        >
          {mediaLoading && !src ? (
            <div
              data-testid="status-viewer-media-loading"
              className="grid h-full min-h-64 place-items-center text-sm text-muted-foreground"
            >
              Loading media…
            </div>
          ) : src ? (
            isVideo ? (
               post.kind !== "reel" ? (
                 <video
                  key={post.id}
                   ref={videoRef}
                   data-testid="video-viewer-long-video"
                   src={videoUrl}
                   controls
                  autoPlay
                   playsInline
                   className="w-full h-full object-contain"
                   poster={post.thumbnail_url ?? undefined}
                   onLoadedMetadata={(event) => {
                     const videoElement = event.currentTarget;
                     setDuration(Number.isFinite(videoElement.duration) ? videoElement.duration : 0);
                     setCurrentTime(Number.isFinite(videoElement.currentTime) ? videoElement.currentTime : 0);
                   }}
                   onTimeUpdate={(event) => {
                     const videoElement = event.currentTarget;
                     const nextTime = Number.isFinite(videoElement.currentTime)
                       ? videoElement.currentTime
                       : 0;
                     setCurrentTime(nextTime);
                     if (videoElement.duration && Number.isFinite(videoElement.duration)) {
                       setDuration(videoElement.duration);
                       setProgress((nextTime / videoElement.duration) * 100);
                     }
                   }}
                   onError={() => {
                     setSrc(null);
                     setMediaError("Video unavailable");
                   }}
                />
              ) : (
                <video
                  ref={videoRef}
                  data-testid="video-viewer-reel"
                  src={src}
                  autoPlay
                  loop
                  playsInline
                  muted={muted}
                  className="h-full w-full object-contain"
                  onPlay={(event) => {
                    const video = event.currentTarget;
                    video.muted = false;
                    video.volume = 1;
                    setMuted(false);
                  }}
                  onLoadedMetadata={(event) => {
                    const video = event.currentTarget;
                    setDuration(Number.isFinite(video.duration) ? video.duration : 0);
                    setCurrentTime(Number.isFinite(video.currentTime) ? video.currentTime : 0);
                  }}
                  onTimeUpdate={(event) => {
                    const video = event.currentTarget;
                    const nextTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
                    setCurrentTime(nextTime);
                    if (video.duration && Number.isFinite(video.duration)) {
                      setDuration(video.duration);
                      setProgress((nextTime / video.duration) * 100);
                    }
                  }}
                  onError={() => {
                    setSrc(null);
                    setMediaError("Video unavailable");
                  }}
                  onClick={(event) => {
                    const video = event.currentTarget;
                    video.muted = false;
                    video.volume = 1;
                    setMuted(false);
                    if (video.paused) void video.play();
                    else video.pause();
                  }}
                />
              )
            ) : (
              <img
                data-testid="img-viewer-post"
                src={src}
                alt={postCaption || "YourWorld post"}
                className="h-full w-full object-contain"
              />
            )
          ) : mediaError ? (
            <div
              data-testid="status-viewer-media-error"
              className="grid h-full min-h-64 place-items-center px-6 text-center text-sm text-muted-foreground"
            >
              {mediaError}
            </div>
          ) : (
            <VideoPoster
              mediaUrl={mediaUrl}
              thumbnailUrl={post.thumbnail_url}
              alt={postCaption || "Loading media"}
              className="h-full w-full object-contain"
            />
          )}
          {post.kind === "reel" && isVideo && src ? (
            <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10">
              <div className="mb-1 flex justify-end">
                <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white/90">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-1 bg-pink-500 transition-all duration-100"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          ) : null}
          {post.kind === "reel" ? (
            <button
              type="button"
              data-testid="button-toggle-viewer-mute"
              onClick={() => {
                const video = videoRef.current;
                const nextMuted = video ? !video.muted : !muted;
                if (video) {
                  video.muted = nextMuted;
                  video.volume = 1;
                }
                setMuted(nextMuted);
              }}
              aria-label={muted ? "Unmute reel" : "Mute reel"}
              className="absolute bottom-3 right-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur-md"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          ) : null}
        </div>
        </div>

        <div className="mx-auto w-full max-w-lg px-4 pt-4">
          <div className="flex items-center gap-3">
            <Link
              data-testid="link-viewer-creator-avatar"
              to="/u/$userId"
              params={{ userId: postUserId }}
              className="shrink-0"
              aria-label={`Open @${creatorUsername} profile`}
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                    alt={`@${creatorUsername} avatar`}
                  className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/30"
                />
              ) : (
                <YwAvatar user={creator} size={44} />
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                data-testid="link-viewer-creator"
                to="/u/$userId"
                params={{ userId: postUserId }}
                className="block truncate text-sm font-bold"
              >
                @{creatorUsername}
              </Link>
              <p className="truncate text-xs text-muted-foreground">{creatorName}</p>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-muted-foreground">
              {formatCount(post.views ?? 0)} views
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              data-testid="button-viewer-like"
              onClick={() => void handleLike()}
              disabled={liking}
              aria-label={post.likedByMe ? "Unlike" : "Like"}
              className="action-btn flex shrink-0 items-center gap-2 rounded-full bg-secondary px-3.5 py-2 text-xs font-semibold disabled:opacity-60"
            >
              <Heart className={cn("h-[18px] w-[18px]", post.likedByMe && "fill-primary text-primary")} />
             {formatCount(likesCount)}
            </button>
            <CommentsSheet
              postId={post.id}
              commentsDisabled={!!post.comments_off}
              onCountChange={setCommentCount}
            >
              <button
                type="button"
                data-testid="button-viewer-comments"
                aria-label="Open comments"
                className="action-btn flex shrink-0 items-center gap-2 rounded-full bg-secondary px-3.5 py-2 text-xs font-semibold"
              >
                <MessageCircle className="h-[18px] w-[18px]" />
                {formatCount(commentCount)}
              </button>
            </CommentsSheet>
            <ShareSheet
              title={postCaption}
              url={shareUrl}
              media={src ?? undefined}
              mediaKind={isVideo ? "video" : "photo"}
            >
              <button
                type="button"
                data-testid="button-viewer-share"
                aria-label="Share"
                className="action-btn flex shrink-0 items-center gap-2 rounded-full bg-secondary px-3.5 py-2 text-xs font-semibold"
              >
                <Send className="h-[17px] w-[17px]" />
                Share
              </button>
            </ShareSheet>
            {isVideo && post.allow_download ? (
              <button
                type="button"
                data-testid="button-viewer-download"
                onClick={() => setDownloadOpen(true)}
                aria-label="Download"
                className="action-btn flex shrink-0 items-center gap-2 rounded-full bg-secondary px-3.5 py-2 text-xs font-semibold"
              >
                <Download className="h-[17px] w-[17px]" />
                Download
              </button>
            ) : null}
            <button
              type="button"
              data-testid="button-viewer-save"
              onClick={() => void handleSave()}
              aria-label={isSaved ? "Remove bookmark" : "Bookmark"}
              className="action-btn flex shrink-0 items-center gap-2 rounded-full bg-secondary px-3.5 py-2 text-xs font-semibold"
            >
              <Bookmark className={cn("h-[18px] w-[18px]", isSaved && "fill-primary text-primary")} />
              {isSaved ? "Saved" : "Save"}
            </button>
          </div>

           {videoTitle ? (
             <h1 data-testid="text-viewer-title" className="mt-4 text-lg font-bold leading-tight">
               {videoTitle}
             </h1>
           ) : null}
           {postCaption ? (
             <p data-testid="text-viewer-caption" className="mt-2 whitespace-pre-line text-sm leading-relaxed">
               {postCaption}
             </p>
           ) : null}
          {post.location ? (
            <p data-testid="text-viewer-location" className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {post.location}
            </p>
          ) : null}
          {post.hashtags.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.hashtags.map((tag) => (
                <span key={tag} className="chip rounded-full px-2.5 py-1 text-[11px]">
                  #{tag.replace(/^#/, "")}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>
      </div>

      <Sheet open={manageOpen} onOpenChange={setManageOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl border-border px-0 pb-6 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/40" />
          <div className="max-h-[70vh] overflow-y-auto">
            <OptionRow
              icon={<Heart className="h-5 w-5" />}
              label="Hide like count to others"
              toggle={!!post.hide_like_count}
              onToggle={(value) => void updateManaged({ hide_like_count: value }, value ? "Like count hidden" : "Like count visible")}
            />
            <OptionRow
              icon={<Send className="h-5 w-5" />}
              label="Hide share count"
              toggle={!!post.hide_share_count}
              onToggle={(value) => void updateManaged({ hide_share_count: value }, value ? "Share count hidden" : "Share count visible")}
            />
            <OptionRow
              icon={<MessageCircleOff className="h-5 w-5" />}
              label="Turn off commenting"
              toggle={!!post.comments_off}
              onToggle={(value) => void updateManaged({ comments_off: value }, value ? "Commenting turned off" : "Commenting turned on")}
            />
            <OptionRow
              icon={post.pinned ? <PinOff className="h-5 w-5" /> : <Pin className="h-5 w-5" />}
              label={post.pinned ? "Unpin from your grid" : "Pin to your main grid"}
              onClick={() => void updateManaged({ pinned: !post.pinned }, post.pinned ? "Unpinned" : "Pinned to your grid")}
            />
            <OptionRow icon={<Pencil className="h-5 w-5" />} label="Edit caption and location" onClick={() => { setManageOpen(false); setEditing(true); }} />
            <OptionRow
              icon={<Link2 className="h-5 w-5" />}
              label="Copy link"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareUrl ?? `${window.location.origin}/video/${post.id}`);
                  toast.success("Link copied to clipboard");
                } catch {
                  toast.error("Couldn't copy link");
                }
              }}
            />
            <OptionRow icon={<Archive className="h-5 w-5" />} label={post.archived ? "Unarchive" : "Archive"} onClick={() => void updateManaged({ archived: !post.archived }, post.archived ? "Unarchived" : "Archived")} />
            <OptionRow icon={<Trash2 className="h-5 w-5" />} label="Delete" destructive onClick={() => setConfirmDelete(true)} />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
          <DialogHeader className="flex-row items-center justify-between border-b border-border px-4 py-3">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            <DialogTitle className="text-sm">Edit {post.kind === "reel" ? "reel" : "post"}</DialogTitle>
            <Button
              size="sm"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                 await updateManaged({ title, caption, location: location.trim() || null }, "Updated");
                setBusy(false);
                setEditing(false);
              }}
            >
              {busy ? "Saving…" : "Done"}
            </Button>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <input
              data-testid="input-viewer-edit-title"
              value={title}
              onChange={(event) => setTitle(event.target.value.slice(0, 180))}
              placeholder="Add a title"
              className="w-full border-b border-border bg-transparent pb-2 text-sm font-semibold outline-none placeholder:text-muted-foreground"
            />
            <Textarea value={caption} onChange={(event) => setCaption(event.target.value.slice(0, 2200))} rows={5} placeholder="Write a caption…" />
            <div className="flex items-center gap-2 border-t border-border pt-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Add location" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {post.kind === "reel" ? "reel" : "post"}?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the media and cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await deleteMyPost(post);
                  toast.success("Deleted");
                  back();
                } catch (cause) {
                  toast.error(cause instanceof Error ? cause.message : "Couldn't delete");
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DownloadSheet
        open={downloadOpen}
        onOpenChange={setDownloadOpen}
        title={postCaption || `${post.kind} from @${creatorUsername}`}
        durationSeconds={post.duration_seconds}
        sourceQualityTier={isVideoQualityTier(post.source_quality_tier) ? post.source_quality_tier : null}
        onDownload={downloadSelected}
      />
    </main>
  );
}

function ViewerState({ label, error = false }: { label: string; error?: boolean }) {
  const navigate = useNavigate();
  return (
    <main className="min-h-[100dvh] bg-background">
      <header className="header-lux flex items-center px-3 py-2.5">
        <button type="button" data-testid="button-viewer-state-back" onClick={() => void navigate({ to: "/profile" })} aria-label="Back to profile" className="action-btn grid h-9 w-9 place-items-center rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </button>
      </header>
       <div data-testid={error ? "status-viewer-error" : "status-viewer-loading"} className="grid place-items-center gap-4 px-6 py-28 text-center text-sm text-muted-foreground">
         <p>{label}</p>
         {error ? (
           <button
             type="button"
             data-testid="button-viewer-state-back"
             onClick={() => void navigate({ to: "/profile" })}
             className="action-btn rounded-full px-4 py-2 font-semibold text-foreground"
           >
             {"< Go Back"}
           </button>
         ) : null}
      </div>
    </main>
  );
}

function mediaAspect(post: { original_width?: number | null; original_height?: number | null; kind: string }) {
  if (post.original_width && post.original_height) {
    return Math.min(1.65, Math.max(0.62, post.original_width / post.original_height));
  }
  return post.kind === "reel" ? 0.8 : 1;
}

function OptionRow({
  icon,
  label,
  toggle,
  onToggle,
  onClick,
  destructive,
}: {
  icon: ReactNode;
  label: string;
  toggle?: boolean;
  onToggle?: (value: boolean) => void;
  onClick?: () => void;
  destructive?: boolean;
}) {
  const content = (
    <div className="flex w-full items-center gap-3 px-5 py-3.5 text-left">
      <span className={destructive ? "text-destructive" : "text-foreground"}>{icon}</span>
      <span className={cn("min-w-0 flex-1 text-sm font-medium", destructive && "text-destructive")}>{label}</span>
      {onToggle ? <Switch checked={!!toggle} onCheckedChange={onToggle} onClick={(event) => event.stopPropagation()} /> : null}
    </div>
  );
  if (onToggle) return <div className="w-full">{content}</div>;
  return <button type="button" data-testid={`button-manage-${label.toLowerCase().replaceAll(" ", "-")}`} onClick={onClick} className="w-full transition-colors active:bg-secondary">{content}</button>;
}