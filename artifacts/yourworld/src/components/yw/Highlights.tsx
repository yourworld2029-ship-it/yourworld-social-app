import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, ImagePlus, Check, ChevronRight, ChevronLeft, X, Volume2, VolumeX, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { type MyMoment } from "@/lib/moment-store";
import { useMoments } from "@/lib/moment-context";
import { compressImageFile } from "@/lib/image-compress";
import { STORAGE_BUCKETS, uploadSourceWithProgress } from "@/lib/storage-upload";
import type { DbPost } from "@/lib/social-data";

type HighlightItem = {
  /** source: "story" | "post" */
  source: string;
  refId: string;
  thumb: string;
  media?: string;
  mediaType?: string;
};

export type Highlight = {
  id: string;
  user_id: string;
  title: string;
  cover_url: string | null;
  items: HighlightItem[];
  created_at: string;
};

const MAX_COVER_EDGE = 320;

function Thumb({ src, video }: { src?: string; video?: boolean }) {
  if (!src) return <div className="h-full w-full bg-muted" />;
  if (video)
    return (
      <video
        src={src}
        muted
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
    );
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className="h-full w-full object-cover"
    />
  );
}

export function Highlights({ userId, posts }: { userId: string | null; posts: DbPost[] }) {
  const { moments, archive } = useMoments();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<0 | 1>(0);
  const [selected, setSelected] = useState<Map<string, HighlightItem>>(new Map());
  const [title, setTitle] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewer, setViewer] = useState<Highlight | null>(null);
  const coverInput = useRef<HTMLInputElement | null>(null);

  const loadHighlights = useCallback(async (ownerId: string) => {
    const { data, error } = await supabase
      .from("highlights" as never)
      .select("*")
      .eq("user_id", ownerId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[highlights] load failed", {
        ownerId,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }
    const next = (data ?? []) as unknown as Highlight[];
    setHighlights(next);
    return next;
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void loadHighlights(userId).catch((error: unknown) => {
      if (cancelled) return;
      console.error("[highlights] initial load failed", error);
    });
    return () => {
      cancelled = true;
    };
  }, [loadHighlights, userId]);

  const storyItems = useMemo<HighlightItem[]>(
    () =>
      [...moments, ...archive].filter((m: MyMoment) => m.mine).map((m: MyMoment) => ({
        source: "story",
        refId: m.id,
        thumb: m.media ?? "",
        media: m.media,
        mediaType: m.kind === "video" ? "video" : "image",
      })),
    [moments, archive],
  );

  const topReels = useMemo<HighlightItem[]>(
    () =>
      [...posts]
        .filter((p) => p.kind === "reel")
        .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
        .map((p) => ({
          source: "post",
          refId: p.id,
          thumb: p.media_url,
          media: p.media_url,
          mediaType: "video",
        })),
    [posts],
  );

  const postItems = useMemo<HighlightItem[]>(
    () =>
      posts.map((p) => ({
        source: "post",
        refId: p.id,
        thumb: p.media_url,
        media: p.media_url,
        mediaType: p.media_type,
      })),
    [posts],
  );

  const toggle = (item: HighlightItem) => {
    setSelected((prev) => {
      const next = new Map(prev);
      const key = `${item.source}:${item.refId}`;
      if (next.has(key)) next.delete(key);
      else next.set(key, item);
      return next;
    });
  };

  const reset = () => {
    setStep(0);
    setSelected(new Map());
    setTitle("");
    setCover(null);
  };

  const pickCover = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, {
        maxDim: MAX_COVER_EDGE,
        quality: 0.8,
      });
      setCover(dataUrl);
    } catch {
      toast.error("Could not load that image");
    }
  };

  const save = async () => {
    if (!userId) return;
    if (!title.trim()) {
      toast.error("Add a highlight title");
      return;
    }
    const items = [...selected.values()];
    if (!items.length) {
      toast.error("Select at least one item");
      return;
    }
    setSaving(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const sessionUserId = sessionData.session?.user.id;
      if (!sessionUserId) throw new Error("Sign in to save a highlight");
      if (sessionUserId !== userId) {
        throw new Error("You can only save highlights to your own profile");
      }

      const coverSource = cover ?? items[0]?.thumb ?? null;
      let coverUrl = coverSource;
      if (coverSource?.startsWith("data:")) {
        const path = `${sessionUserId}/highlight-${crypto.randomUUID()}.jpg`;
        const upload = await uploadSourceWithProgress(
          STORAGE_BUCKETS.uploads,
          path,
          coverSource,
          "image/jpeg",
        );
        if (upload.error || !upload.url) {
          console.error("[highlights] custom cover upload failed", {
            bucket: STORAGE_BUCKETS.uploads,
            path,
            error: upload.error,
          });
          throw new Error(upload.error ?? "Could not upload the highlight cover");
        }
        coverUrl = upload.url;
      }

      const payload = {
        user_id: sessionUserId,
        title: title.trim(),
        cover_url: coverUrl ?? null,
        items: items.map(({ source, refId, thumb, media, mediaType }) => ({
          source,
          refId,
          thumb,
          media: media ?? null,
          mediaType: mediaType ?? null,
        })),
      };
      const { data, error } = await supabase
        .from("highlights" as never)
        .insert(payload as never)
        .select("id,user_id,title,cover_url,items,created_at")
        .single();
      if (error) {
        console.error("[highlights] insert failed", {
          userId: sessionUserId,
          itemCount: items.length,
          hasCustomCover: Boolean(cover),
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }
      const saved = data as unknown as Highlight;
      setHighlights((h) => [...h, saved]);
      try {
        await loadHighlights(sessionUserId);
      } catch (refreshError) {
        console.error("[highlights] saved but refresh failed", refreshError);
      }
      toast.success("Highlight added");
      setOpen(false);
      reset();
    } catch (e) {
      console.error("[highlights] save failed", {
        userId,
        itemCount: items.length,
        hasCustomCover: Boolean(cover),
        error: e,
      });
      toast.error(e instanceof Error ? e.message : "Could not save highlight");
    } finally {
      setSaving(false);
    }
  };

  const renderGrid = (items: HighlightItem[]) => {
    if (!items.length)
      return (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Nothing here yet.
        </p>
      );
    return (
      <div className="grid grid-cols-3 gap-1.5">
        {items.map((item) => {
          const key = `${item.source}:${item.refId}`;
          const active = selected.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(item)}
              className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted transition-transform active:scale-95"
            >
              <Thumb src={item.thumb} video={item.mediaType === "video"} />
              {active ? (
                <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground shadow">
                  <Check className="h-3 w-3" />
                </span>
              ) : null}
              <span
                className={cn(
                  "absolute inset-0 transition-colors",
                  active ? "bg-primary/20 ring-2 ring-inset ring-primary" : "bg-transparent",
                )}
              />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <section className="px-4 pt-4">
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
        {/* New highlight */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-[68px] shrink-0 flex-col items-center gap-1.5 transition-transform active:scale-95"
        >
          <span className="grid h-[60px] w-[60px] place-items-center rounded-full border border-border/60 bg-muted/40 backdrop-blur-md">
            <Plus className="h-6 w-6 text-muted-foreground" strokeWidth={1.8} />
          </span>
          <span className="w-full truncate text-center text-[11px] text-muted-foreground">New</span>
        </button>

        {highlights.map((h) => (
          <button key={h.id} type="button" onClick={() => setViewer(h)} className="flex w-[68px] shrink-0 flex-col items-center gap-1.5">
            <span className="h-[60px] w-[60px] overflow-hidden rounded-full border border-border/60 bg-muted/40 p-[2px]">
              <span className="block h-full w-full overflow-hidden rounded-full">
                {h.cover_url ? (
                  h.items?.[0]?.mediaType === "video" && !h.cover_url.startsWith("data:") ? (
                    <Thumb src={h.cover_url} video />
                  ) : (
                    <Thumb src={h.cover_url} />
                  )
                ) : (
                  <span className="grid h-full w-full place-items-center bg-muted text-xs font-semibold text-muted-foreground">
                    {h.title.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </span>
            </span>
            <span className="w-full truncate text-center text-[11px] text-muted-foreground">
              {h.title}
            </span>
          </button>
        ))}
      </div>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="max-w-md border-border/60 bg-background/80 p-0 backdrop-blur-xl">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>{step === 0 ? "New highlight" : "Name your highlight"}</DialogTitle>
          </DialogHeader>

          {step === 0 ? (
            <div className="px-4 pb-4">
              <Tabs defaultValue="stories">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="stories">Stories</TabsTrigger>
                  <TabsTrigger value="top">Reels</TabsTrigger>
                  <TabsTrigger value="posts">Posts</TabsTrigger>
                </TabsList>
                <div className="mt-3 max-h-[46vh] overflow-y-auto pr-1">
                  <TabsContent value="stories" className="mt-0">
                    {renderGrid(storyItems)}
                  </TabsContent>
                  <TabsContent value="top" className="mt-0">
                    {renderGrid(topReels)}
                  </TabsContent>
                  <TabsContent value="posts" className="mt-0">
                    {renderGrid(postItems)}
                  </TabsContent>
                </div>
              </Tabs>
              <div className="flex items-center justify-between pt-4">
                <span className="text-xs text-muted-foreground">
                  {selected.size} selected
                </span>
                <Button
                  className="rounded-full"
                  disabled={!selected.size}
                  onClick={() => setStep(1)}
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 px-4 pb-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => coverInput.current?.click()}
                  className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted/40 transition-transform active:scale-95"
                >
                  {cover ? (
                    <Thumb src={cover} />
                  ) : selected.size ? (
                    <Thumb
                      src={[...selected.values()][0]?.thumb}
                      video={[...selected.values()][0]?.mediaType === "video"}
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center">
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    </span>
                  )}
                  <span className="absolute inset-0 grid place-items-center bg-black/25 opacity-0 transition-opacity hover:opacity-100">
                    <ImagePlus className="h-5 w-5 text-white" />
                  </span>
                </button>
                <div className="flex-1">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Highlight title"
                    maxLength={30}
                    className="bg-muted/40"
                  />
                  <p className="pt-1.5 text-[11px] text-muted-foreground">
                    Tap the circle to set a custom cover (optional).
                  </p>
                </div>
              </div>
              <input
                ref={coverInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void pickCover(e.target.files?.[0])}
              />
              <div className="flex items-center justify-between">
                <Button variant="ghost" className="rounded-full" onClick={() => setStep(0)}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button className="rounded-full" disabled={saving} onClick={() => void save()}>
                  {saving ? "Saving…" : "Save highlight"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {viewer ? <HighlightViewer highlight={viewer} onClose={() => setViewer(null)} /> : null}
    </section>
  );
}

function HighlightViewer({ highlight, onClose }: { highlight: Highlight; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const current = highlight.items[index];

  useEffect(() => {
    setProgress(0);
    setPaused(false);
  }, [index]);
  useEffect(() => {
    if (!current || current.mediaType === "video" || paused) return;
    const timer = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (index >= highlight.items.length - 1) onClose();
          else setIndex((i) => i + 1);
          return 0;
        }
        return p + 2;
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [current, paused, index, highlight.items.length, onClose]);
  useEffect(() => {
    if (!videoRef.current) return;
    if (paused) videoRef.current.pause();
    else void videoRef.current.play().catch(() => {});
  }, [paused, index]);
  if (!current) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <div className="relative h-full w-full max-w-md overflow-hidden">
        {highlight.items.map((_, i) => (
          <div key={i} className="absolute left-2 right-2 top-3 z-20 h-1 overflow-hidden rounded-full bg-white/30">
            <div className="h-full bg-white" style={{ width: i < index ? "100%" : i === index ? `${progress}%` : "0%" }} />
          </div>
        ))}
        {current.mediaType === "video" ? (
          <video
            ref={videoRef}
            key={current.refId}
             src={current.media ?? current.thumb}
            autoPlay
            muted={muted}
            playsInline
            className="h-full w-full object-contain"
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration) setProgress((v.currentTime / v.duration) * 100);
            }}
            onEnded={() => index >= highlight.items.length - 1 ? onClose() : setIndex((i) => i + 1)}
          />
        ) : <img src={current.media ?? current.thumb} alt="" className="h-full w-full object-contain" />}
        <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-black/75 to-transparent px-3 pb-8 pt-7">
          <span className="text-sm font-semibold text-white">{highlight.title}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPaused((p) => !p)} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur-xl" aria-label={paused ? "Play" : "Pause"}>
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
            {current.mediaType === "video" ? <button type="button" onClick={() => setMuted((m) => !m)} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur-xl" aria-label="Toggle sound">{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button> : null}
            <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur-xl" aria-label="Close"><X className="h-4 w-4" /></button>
          </div>
        </div>
        <button type="button" aria-label="Previous clip" onClick={() => setIndex((i) => Math.max(0, i - 1))} className="absolute inset-y-0 left-0 z-20 w-2/5" />
        <button type="button" aria-label="Next clip" onClick={() => index >= highlight.items.length - 1 ? onClose() : setIndex((i) => i + 1)} className="absolute inset-y-0 right-0 z-20 w-3/5" />
        {paused ? <span className="pointer-events-none absolute bottom-8 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white"><Pause className="mr-1 inline h-3 w-3" />Paused</span> : null}
      </div>
    </div>
  );
}
