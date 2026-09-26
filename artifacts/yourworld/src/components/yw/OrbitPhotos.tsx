import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  isLocalObjectUrl,
  isOrbitVideoDurationValid,
  saveOrbitPhotosRemote,
  uploadOrbitMedia,
} from "@/lib/orbit-live";
import {
  Plus,
  X,
  Lock,
  Camera,
  Sparkles,
  Wand2,
  Video,
  Star,
  Globe2,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import {
  ORBIT_PHOTO_MAX,
  type OrbitPhoto,
  type OrbitPhotoPrivacy,
  type OrbitPhotoStyle,
} from "@/lib/orbit-store";

const STYLES: { id: OrbitPhotoStyle; label: string }[] = [
  { id: "real", label: "Real Photo" },
  { id: "avatar", label: "Avatar / AI Photo" },
  { id: "stylized", label: "Stylized Photo" },
];

const PRIVACY: {
  id: OrbitPhotoPrivacy;
  label: string;
  hint: string;
  recommended?: boolean;
}[] = [
  {
    id: "matched",
    label: "Only Matched Users",
    hint: "Visible after match.",
    recommended: true,
  },
  {
    id: "permission",
    label: "Only with My Permission",
    hint: "You approve every request.",
  },
  { id: "everyone", label: "Everyone", hint: "Visible to everyone." },
];

const STYLE_ICON = { real: Camera, avatar: Wand2, stylized: Sparkles } as const;
const PRIVACY_ICON: Record<OrbitPhotoPrivacy, LucideIcon> = {
  matched: Star,
  permission: Lock,
  everyone: Globe2,
};

export function OrbitPhotos({
  photos,
  privacy,
  onChange,
  onPrivacyChange,
}: {
  photos: OrbitPhoto[];
  privacy: OrbitPhotoPrivacy;
  onChange: (photos: OrbitPhoto[]) => void;
  onPrivacyChange: (p: OrbitPhotoPrivacy) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const videoInput = useRef<HTMLInputElement>(null);
  const full = photos.length >= ORBIT_PHOTO_MAX;
  const visible = photos.filter((p) => !isLocalObjectUrl(p.url));

  const add = async (files: FileList | null, kind: "photo" | "video" = "photo") => {
    if (!files?.length) return;
    const room = ORBIT_PHOTO_MAX - photos.length;
    const picked = Array.from(files).slice(0, room);
    if (!picked.length) return;
    if (kind === "video" && !(await isOrbitVideoDurationValid(picked[0]))) {
      toast.error("Video duration must be 1 to 15 seconds.");
      return;
    }
    setBusy(true);
    const toastId = toast.loading(kind === "video" ? "Uploading video…" : "Uploading…");
    let workingPhotos = [...photos];
    let saved = 0;
    let usedFallback = false;
    try {
      for (const f of picked) {
        const url = await uploadOrbitMedia(f);
        if (!url) continue;
        usedFallback ||= url.startsWith("data:");
        const media: OrbitPhoto = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          url,
          style: "real" as OrbitPhotoStyle,
          kind,
        };
        workingPhotos = [...workingPhotos, media];
        saved += 1;
        // Make the preview visible and save only the media array immediately.
        onChange(workingPhotos);
        void saveOrbitPhotosRemote(workingPhotos);
      }
    } catch (error) {
      console.error("[orbit] media picker failed", { kind, fileCount: picked.length, error });
    } finally {
      setBusy(false);
    }
    if (!saved) {
      toast.error("We couldn’t save this media. Please try again.", {
        id: toastId,
        description: "Storage was unavailable and a temporary preview could not be created.",
      });
      return;
    }
    if (usedFallback) {
      toast.warning(kind === "video" ? "Video added with a temporary fallback." : "Photo added with a temporary fallback.", {
        id: toastId,
        description: "Storage was unavailable, so this preview is kept directly in your profile.",
      });
      return;
    }
    toast.success(kind === "video" ? "Video added" : "Uploaded", { id: toastId });
  };

  const remove = (id: string) => onChange(photos.filter((p) => p.id !== id));
  const setStyle = (id: string, style: OrbitPhotoStyle) =>
    onChange(photos.map((p) => (p.id === id ? { ...p, style } : p)));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2.5">
        {visible.map((p, i) => {
          const Icon = STYLE_ICON[p.style];
          const isVideo = p.kind === "video";
          return (
            <div
              key={p.id}
              className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-secondary"
            >
              {isVideo ? (
                <video
                  src={p.url}
                  muted
                  playsInline
                  preload="metadata"
                  loop
                  controls={false}
                  className="h-full w-full object-cover"
                />
              ) : (
                <img src={p.url} alt="" className="h-full w-full object-cover" />
              )}
              {i === 0 && !isVideo && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-background/75 px-2 py-0.5 text-[10px] font-medium backdrop-blur">
                  Main
                </span>
              )}
              {isVideo && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-background/75 px-2 py-0.5 text-[10px] font-medium backdrop-blur">
                  Video
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(p.id)}
                aria-label={isVideo ? "Remove video" : "Remove photo"}
                className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-background/75 backdrop-blur transition-transform active:scale-90"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.9} />
              </button>
              {!isVideo && (
                <div className="absolute inset-x-1.5 bottom-1.5 flex items-center gap-1 rounded-full bg-background/70 px-1.5 py-1 backdrop-blur">
                  <Icon className="h-3 w-3 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                  {STYLES.map((s) => {
                    const StyleIcon = STYLE_ICON[s.id];
                    return (
                    <button
                      key={s.id}
                      type="button"
                      aria-label={s.label}
                      aria-pressed={p.style === s.id}
                      onClick={() => setStyle(p.id, s.id)}
                      className={`grid h-5 flex-1 place-items-center rounded-full text-[11px] transition-all active:scale-90 ${
                        p.style === s.id ? "bg-foreground/90" : "opacity-45"
                      }`}
                    >
                      <StyleIcon className="h-3 w-3" strokeWidth={1.8} />
                    </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {busy && (
          <div
            role="status"
            aria-label="Uploading media"
            className="relative grid aspect-[3/4] place-items-center overflow-hidden rounded-2xl border border-primary/30 bg-secondary/70"
          >
            <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Uploading…
              <div className="absolute inset-x-3 bottom-3 h-1 overflow-hidden rounded-full bg-background/70">
                <div className="h-full w-2/5 animate-pulse rounded-full bg-primary" />
              </div>
            </div>
          </div>
        )}

        {!full && (
          <button
            type="button"
            onClick={() => !busy && input.current?.click()}
            disabled={busy}
            className="grid aspect-[3/4] place-items-center rounded-2xl border border-dashed border-border bg-secondary/40 text-muted-foreground transition-transform active:scale-95"
          >
            <span className="flex flex-col items-center gap-1">
              <Plus className="h-5 w-5" strokeWidth={1.8} />
              <span className="text-[11px]">{busy ? "Uploading…" : "Add photo"}</span>
            </span>
          </button>
        )}

        {!full && (
          <button
            type="button"
            onClick={() => !busy && videoInput.current?.click()}
            disabled={busy}
            className="grid aspect-[3/4] place-items-center rounded-2xl border border-dashed border-border bg-secondary/40 text-muted-foreground transition-transform active:scale-95"
          >
            <span className="flex flex-col items-center gap-1">
              <Video className="h-5 w-5" strokeWidth={1.8} />
              <span className="text-[11px]">Add video</span>
            </span>
          </button>
        )}
      </div>

      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void add(e.target.files, "photo");
          e.target.value = "";
        }}
      />
      <input
        ref={videoInput}
        type="file"
        accept="video/*"
        hidden
        onChange={(e) => {
          void add(e.target.files, "video");
          e.target.value = "";
        }}
      />

      <p className="text-[11px] text-muted-foreground">
        At least 1 photo is required · {visible.length}/{ORBIT_PHOTO_MAX} added. You can also add a
        short intro video. Tap the icons on a photo to set its style.
      </p>


      <div className="rounded-2xl bg-secondary/50 p-3.5">
        <p className="flex items-center gap-1.5 text-xs font-semibold">
          <Lock className="h-3.5 w-3.5" strokeWidth={1.9} />
          Original Photo Privacy
        </p>
        <p className="pt-1 text-[11px] text-muted-foreground">
          Choose who can view your original photo.
        </p>
        <div className="space-y-1.5 pt-3">
          {PRIVACY.map((o) => {
            const active = privacy === o.id;
            const PrivacyIcon = PRIVACY_ICON[o.id];
            return (
              <button
                key={o.id}
                type="button"
                aria-pressed={active}
                onClick={() => onPrivacyChange(o.id)}
                className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all active:scale-[0.99] ${
                  active ? "bg-foreground text-background" : "bg-background/60"
                }`}
              >
                <span
                  className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                    active ? "border-background" : "border-border"
                  }`}
                >
                  {active && <span className="h-2 w-2 rounded-full bg-background" />}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                    <PrivacyIcon className="h-3.5 w-3.5" strokeWidth={1.8} />
                    {o.label}
                    {o.recommended && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                          active ? "bg-background/20" : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        Recommended
                      </span>
                    )}
                  </span>
                  <span
                    className={`block pt-0.5 text-[11px] ${active ? "opacity-70" : "text-muted-foreground"}`}
                  >
                    {o.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}