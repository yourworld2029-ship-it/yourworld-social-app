import { useEffect, useRef, useState } from "react";
import { MapPin, ImagePlus, Sparkles } from "lucide-react";
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

const CATEGORIES = ["Vlog", "Podcast", "Tutorial", "Tech", "Gaming", "Music", "Travel", "Fitness", "Comedy", "Education", "News", "Food"];
const SPORTS = ["Cricket", "Football", "Basketball", "Tennis", "Athletics", "Badminton", "Hockey", "Volleyball"];

type Props = {
  open: boolean;
  post: DbPost | null;
  userId: string;
  onOpenChange: (open: boolean) => void;
  onSaved: (post: DbPost) => void;
};

export function PostEditDialog({ open, post, userId, onOpenChange, onSaved }: Props) {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [mentions, setMentions] = useState("");
  const [category, setCategory] = useState("");
  const [sportsTag, setSportsTag] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [frameTime, setFrameTime] = useState(0);
  const [saving, setSaving] = useState(false);
  const [mediaSrc, setMediaSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!post) return;
    setTitle(post.title ?? "");
    setCaption(post.caption ?? "");
    setLocation(post.location ?? "");
    setMentions((post.mentions ?? []).join(" "));
    setCategory(post.category ?? "");
    setSportsTag(post.sports_tag ?? "");
    setThumbnailFile(null);
    setFrameTime(0);
  }, [post]);

  useEffect(() => {
    let cancelled = false;
    if (!open || !post?.media_url) {
      setMediaSrc(null);
      return;
    }
    const bucket = post.kind === "reel" ? STORAGE_BUCKETS.reels : STORAGE_BUCKETS.videos;
    void resolveMediaUrl(post.media_url, bucket).then((url) => {
      if (!cancelled) setMediaSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [open, post?.kind, post?.media_url]);

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      toast.error("Choose a frame after the video preview loads.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.84));
    if (!blob) {
      toast.error("Could not capture this frame.");
      return;
    }
    setThumbnailFile(new File([blob], "cover.webp", { type: "image/webp" }));
    toast.success("Cover frame selected");
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
        category: category.trim() || null,
        sports_tag: sportsTag.trim() || null,
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
                <video ref={videoRef} src={mediaSrc ?? undefined} controls playsInline className="max-h-64 w-full object-contain" />
              ) : (
                <img src={mediaSrc ?? post.media_url} alt="" className="max-h-64 w-full object-contain" />
              )}
              <label className="absolute bottom-3 right-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-black/75 px-3 py-2 text-xs font-semibold text-white backdrop-blur">
                <ImagePlus className="h-4 w-4" />
                Replace cover
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => setThumbnailFile(event.target.files?.[0] ?? null)} />
              </label>
            </div>
            {isVideo ? (
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <span className="shrink-0 text-xs text-muted-foreground">Video frame</span>
                <input
                  type="range"
                  min={0}
                  max={videoRef.current?.duration || 1}
                  step={0.1}
                  value={frameTime}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setFrameTime(next);
                    if (videoRef.current) videoRef.current.currentTime = next;
                  }}
                  className="min-w-0 flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => void captureFrame()}>
                  Use frame
                </Button>
              </div>
            ) : null}
            <div className="space-y-3 px-4 py-4">
              <input value={title} onChange={(event) => setTitle(event.target.value.slice(0, 180))} placeholder="Add a title" className="w-full border-b border-border bg-transparent pb-2 text-sm font-semibold outline-none placeholder:text-muted-foreground" />
              <Textarea value={caption} onChange={(event) => setCaption(event.target.value.slice(0, 2200))} placeholder="Write a caption with emojis and #hashtags…" rows={5} className="resize-none text-sm" />
              <p className="text-right text-[11px] text-muted-foreground">{caption.length}/2,200</p>
              <div className="flex items-center gap-3 border-t border-border pt-3">
                <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
                <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Add location (optional)" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-muted-foreground">
                  Category
                  <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                    <option value="">None</option>
                    {CATEGORIES.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
                <label className="text-xs text-muted-foreground">
                  Sports tag
                  <select value={sportsTag} onChange={(event) => setSportsTag(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                    <option value="">None</option>
                    {SPORTS.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
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