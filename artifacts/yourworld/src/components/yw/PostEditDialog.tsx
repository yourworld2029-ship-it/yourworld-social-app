import { useEffect, useRef, useState } from "react";
import { MapPin, ImagePlus, Pause, Play, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  updateMyPost,
  uploadPostThumbnail,
} from "@/lib/profile-data";
import { resolveMediaUrl, type DbPost } from "@/lib/social-data";
import { STORAGE_BUCKETS } from "@/lib/storage-upload";

type Props = {
  open: boolean;
  post: DbPost | null;
  userId: string;
  onOpenChange: (open: boolean) => void;
  onSaved: (post: DbPost) => void;
};

function formatVideoTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function PostEditDialog({ open, post, userId, onOpenChange, onSaved }: Props) {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [mentions, setMentions] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [saving, setSaving] = useState(false);
  const [mediaSrc, setMediaSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const mediaReference = post?.video_url ?? post?.media_url ?? null;

  useEffect(() => {
    if (!post) return;
    setTitle(post.title ?? "");
    setCaption(post.caption ?? "");
    setLocation(post.location ?? "");
    setMentions((post.mentions ?? []).join(" "));
    setThumbnailFile(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, [post]);

  useEffect(() => {
    let cancelled = false;
    if (!open || !post || !mediaReference) {
      setMediaSrc(null);
      return;
    }
    const bucket = post.kind === "reel" ? STORAGE_BUCKETS.reels : STORAGE_BUCKETS.videos;
    void resolveMediaUrl(mediaReference, bucket).then((url) => {
      if (!cancelled) setMediaSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [open, post?.kind, mediaReference]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => setIsPlaying(false));
    } else {
      video.pause();
    }
  };

  const save = async () => {
    if (!post || saving) return;
    setSaving(true);
    try {
      let thumbnailUrl = post.thumbnail_url ?? null;
      if (thumbnailFile) {
        const uploaded = await uploadPostThumbnail(userId, thumbnailFile);
        thumbnailUrl = uploaded.path;
      }
      const parsedMentions = Array.from(
        new Set(
          mentions
            .split(/[\s,]+/)
            .map((value) => value.trim().replace(/^@/, ""))
            .filter(Boolean)
            .slice(0, 50),
        ),
      );
      const patch = {
        title,
        caption,
        location: location.trim() || null,
        mentions: parsedMentions,
        thumbnail_url: thumbnailUrl,
      } as const;
      await updateMyPost(post.id, patch);
      onSaved({ ...post, ...patch, thumbnail_url: thumbnailUrl });
      toast.success("Updated");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update this post");
    } finally {
      setSaving(false);
    }
  };

  const isVideo = Boolean(post?.media_type?.startsWith("video") || post?.kind === "video" || post?.kind === "reel");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <DialogHeader className="grid grid-cols-[auto_1fr_auto] items-center border-b border-border px-4 py-3 text-center">
          <Button variant="ghost" size="sm" className="h-8 px-2" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <DialogTitle className="text-sm font-semibold">
            Edit {post?.kind === "reel" ? "reel" : "post"}
          </DialogTitle>
          <Button size="sm" className="h-8 rounded-full px-4" disabled={saving || !post} onClick={() => void save()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogHeader>
        {post ? (
          <div className="max-h-[78vh] overflow-y-auto">
            <div className="relative bg-secondary">
              {isVideo ? (
                <video
                  ref={videoRef}
                  src={mediaSrc ?? mediaReference ?? undefined}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  controls={false}
                  onLoadedMetadata={(event) => {
                    setCurrentTime(event.currentTarget.currentTime);
                    const nextDuration = event.currentTarget.duration;
                    if (Number.isFinite(nextDuration) && nextDuration > 0) {
                      setDuration(nextDuration);
                    }
                  }}
                  onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onClick={togglePlayback}
                  className="max-h-64 w-full cursor-pointer object-contain"
                />
              ) : (
                <img src={mediaSrc ?? post.media_url} alt="" className="max-h-64 w-full object-contain" />
              )}
              {isVideo ? (
                <>
                  <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium tabular-nums text-white/90 backdrop-blur-sm">
                    {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
                  </span>
                  <span className="pointer-events-none absolute inset-0 grid place-items-center">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-black/35 text-white/85 backdrop-blur-sm">
                      {isPlaying ? (
                        <Pause className="h-4 w-4 fill-current" aria-hidden="true" />
                      ) : (
                        <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden="true" />
                      )}
                    </span>
                  </span>
                </>
              ) : null}
              <label className="absolute bottom-3 right-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-black/75 px-3 py-2 text-xs font-semibold text-white backdrop-blur">
                <ImagePlus className="h-4 w-4" />
                Replace cover
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => setThumbnailFile(event.target.files?.[0] ?? null)} />
              </label>
            </div>
            <div className="space-y-3 px-4 py-4">
              <input value={title} onChange={(event) => setTitle(event.target.value.slice(0, 180))} placeholder="Add a title" className="w-full border-b border-border bg-transparent pb-2 text-sm font-semibold outline-none placeholder:text-muted-foreground" />
              <Textarea value={caption} onChange={(event) => setCaption(event.target.value.slice(0, 2200))} placeholder="Write a caption with emojis and #hashtags…" rows={5} className="resize-none text-sm" />
              <p className="text-right text-[11px] text-muted-foreground">{caption.length}/2,200</p>
              <div className="flex items-center gap-3 border-t border-border pt-3">
                <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
                <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Add location (optional)" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              </div>
              <label className="block text-xs text-muted-foreground">
                Tag people
                <input value={mentions} onChange={(event) => setMentions(event.target.value)} placeholder="@username @friend" className="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
              </label>
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Hashtags are saved automatically from your caption.
              </p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}