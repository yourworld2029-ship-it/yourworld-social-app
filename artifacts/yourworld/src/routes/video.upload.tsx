import React, { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Upload, Image as ImageIcon, Clock, Loader2, Camera, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { computeVideoPurchaseSplit, inr, inrWhole } from "@/lib/payout-math";
import {
  VIDEO_CATEGORIES,
  formatDuration,
  publishLongVideo,
} from "@/lib/video-data";
import { useUploads } from "@/lib/upload-progress";
import { trackEvent } from "@/lib/analytics";
import { historyBackOr } from "@/lib/navigation";
import { cacheVideoPoster } from "@/lib/video-prefetch";

type AccessOption = "public" | "vip" | "paid";
const MIN_PAID_VIDEO_PRICE = 10;
const MAX_PAID_VIDEO_PRICE = 9999;

export const Route = createFileRoute("/video/upload")({
  head: () => ({
    meta: [
      { title: "Upload a Long Video — YourWorld" },
      {
        name: "description",
        content:
          "Upload long-form horizontal or vertical videos to YourWorld with a title, description, custom thumbnail, categories and scheduled release.",
      },
      { property: "og:title", content: "Upload a Long Video — YourWorld" },
      {
        property: "og:description",
        content: "Publish or schedule long-form videos with thumbnails and categories.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VideoUploadPage,
});
const MIN_DURATION = 90;
const MAX_VIDEO_BYTES = 209_715_200;

function VideoUploadPage() {

  const navigate = useNavigate();
  const { startUpload } = useUploads();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const selectedFileRef = useRef<File | null>(null);
  const thumbnailFileRef = useRef<File | null>(null);
  const videoInput = useRef<HTMLInputElement | null>(null);
  const thumbInput = useRef<HTMLInputElement | null>(null);

  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [previewFrame, setPreviewFrame] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [duration, setDuration] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [seriesEnabled, setSeriesEnabled] = useState(false);
  const [seriesTitle, setSeriesTitle] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState("");

  const [paidPromotion, setPaidPromotion] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [busy, setBusy] = useState(false);

  const [access, setAccess] = useState<AccessOption>("public");
  const [price, setPrice] = useState("");
  const [accessOpen, setAccessOpen] = useState(false);

  const accessOptions: { value: AccessOption; label: string; hint: string }[] = [
    { value: "public", label: "Public (Free)", hint: "Anyone can watch for free" },
    { value: "paid", label: "Paid (Pay-per-view)", hint: "Charge a one-time fee" },
    { value: "vip", label: "Subscribers Only", hint: "Only subscribers can watch" },
  ];

  const pickVideo = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please choose a video file");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error("Videos must be under 200 MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    if (thumb?.startsWith("blob:")) URL.revokeObjectURL(thumb);
    selectedFileRef.current = file;
    thumbnailFileRef.current = null;
    setFileUrl(url);
    setPreviewFrame(null);
    setThumb(null);
    setDuration(null);
    setDimensions(null);
  };

  useEffect(() => {
    return () => {
      if (fileUrl?.startsWith("blob:")) URL.revokeObjectURL(fileUrl);
      if (thumb?.startsWith("blob:")) URL.revokeObjectURL(thumb);
    };
  }, [fileUrl, thumb]);

  const onMeta = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setOrientation(v.videoHeight > v.videoWidth ? "portrait" : "landscape");
    setDuration(Number.isFinite(v.duration) ? v.duration : null);
    setDimensions(
      v.videoWidth > 0 && v.videoHeight > 0
        ? { width: v.videoWidth, height: v.videoHeight }
        : null,
    );
  }, []);

  /** Grabs the current preview frame as a custom thumbnail. */
  const grabFrame = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
    canvas.width = Math.round(v.videoWidth * scale);
    canvas.height = Math.round(v.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    thumbnailFileRef.current = null;
    setThumb(canvas.toDataURL("image/jpeg", 0.85));
    toast.success("Thumbnail captured from this frame");
  };

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const scheduledAt = scheduled && date && time ? new Date(`${date}T${time}`) : null;
  const tooShort = duration !== null && duration < MIN_DURATION;
  const canPublish =
    !!fileUrl &&
    !tooShort &&
    title.trim().length >= 2 &&
    (!seriesEnabled || (seriesTitle.trim().length >= 2 && episodeNumber.trim().length > 0)) &&
    (!scheduled || !!scheduledAt) &&
    !busy;

  const submit = () => {
    if (!fileUrl) return;
    if (selectedFileRef.current && selectedFileRef.current.size > MAX_VIDEO_BYTES) {
      toast.error("Videos must be under 200 MB.");
      return;
    }
    if (duration === null || duration < MIN_DURATION) {
      toast.error("Long videos must be at least 90 seconds.");
      return;
    }
    if (scheduled && scheduledAt && scheduledAt.getTime() <= Date.now()) {
      toast.error("Pick a future date and time to schedule");
      return;
    }
    if (seriesEnabled && (!seriesTitle.trim() || !episodeNumber.trim())) {
      toast.error("Add the series title and episode or part number.");
      return;
    }
    const parsedInputPrice = price.trim() ? Number(price) : 0;
    if (
      access === "paid" &&
      (!Number.isFinite(parsedInputPrice) ||
        parsedInputPrice < MIN_PAID_VIDEO_PRICE ||
        parsedInputPrice > MAX_PAID_VIDEO_PRICE)
    ) {
      toast.error(`Enter a price between ₹${MIN_PAID_VIDEO_PRICE} and ₹${MAX_PAID_VIDEO_PRICE}.`);
      return;
    }
    const parsedPrice = access === "paid" ? parsedInputPrice : 0;

    setBusy(true);

    // Upload keeps running in the background while the user browses the app.
    void startUpload(
      { kind: "video", label: title.trim() || "Long video", thumbnail: thumb, viewTo: "/" },
      (onProgress) =>
        publishLongVideo({
          fileUrl,
            file: selectedFileRef.current,
          thumbnailUrl: thumb,
            thumbnailFile: thumbnailFileRef.current,
          title,
          description,
          tags,
          orientation,
          seriesTitle: seriesEnabled ? seriesTitle.trim() : null,
          episodeNumber: seriesEnabled ? episodeNumber.trim() : null,
          durationSeconds: duration,
            originalWidth: dimensions?.width ?? null,
            originalHeight: dimensions?.height ?? null,
          scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
            access,
            price: parsedPrice,
            isPaid: access === "paid",
          paidPromotion,
          onProgress,
        }),
    ).then(({ error }) => {
      if (error) {
        toast.error(error);
        return;
      }
      trackEvent("video_published", {
        surface: "long_video_upload",
        orientation,
        scheduled: Boolean(scheduledAt),
        has_thumbnail: Boolean(thumb),
        paid_promotion: paidPromotion,
      });
      toast.success(
        scheduledAt
          ? `Scheduled for ${scheduledAt.toLocaleString()}`
          : "Published — it's live on your feed",
      );
    });

    navigate({ to: "/" });
  };

  return (
    <main className="min-h-screen bg-[#0d0d0f] pb-32 text-white">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-zinc-900 bg-[#0d0d0f]/90 px-4 py-3 backdrop-blur-md">
        <button
          onClick={() => historyBackOr(() => void navigate({ to: "/" }))}
          aria-label="Back"
          className="grid h-9 w-9 place-items-center rounded-full bg-zinc-900 active:scale-90"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold">Upload Video</h1>
      </header>

      <div className="mx-auto max-w-xl space-y-5 px-4 pt-5">
        {/* PLAYER / PICKER */}
        {!fileUrl ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold">Choose a long-video format</p>
              <p className="mt-1 text-xs text-zinc-400">
                Both formats support videos from 90 seconds to several hours.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([
                {
                  value: "landscape" as const,
                  label: "Horizontal",
                  ratio: "16:9",
                  description: "Wide-screen video",
                },
                {
                  value: "portrait" as const,
                  label: "Vertical",
                  ratio: "9:16",
                  description: "Tall-screen video",
                },
              ]).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={orientation === option.value}
                  onClick={() => {
                    setOrientation(option.value);
                    videoInput.current?.click();
                  }}
                  className={`flex min-h-36 flex-col items-center justify-center gap-2 rounded-2xl border bg-zinc-900/50 px-3 py-4 text-center transition-colors active:scale-[0.98] ${
                    orientation === option.value
                      ? "border-pink-500/80 bg-pink-500/10"
                      : "border-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`grid place-items-center rounded-lg border border-pink-400/60 bg-zinc-950 text-pink-300 ${
                      option.value === "portrait" ? "h-12 w-7" : "h-7 w-12"
                    }`}
                  >
                    <Upload size={14} />
                  </span>
                  <span className="text-sm font-semibold">{option.label}</span>
                  <span className="text-xs text-pink-300">{option.ratio}</span>
                  <span className="text-[11px] text-zinc-400">{option.description}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div
              className={`relative mx-auto w-full overflow-hidden rounded-2xl bg-black ${
                orientation === "portrait" ? "max-w-[280px] aspect-[9/16]" : "aspect-video"
              }`}
            >
              <video
                ref={videoRef}
                src={fileUrl}
                poster={thumb ?? previewFrame ?? undefined}
                controls
                playsInline
                preload="metadata"
                onLoadedMetadata={onMeta}
                onLoadedData={() => {
                  const video = videoRef.current;
                  if (!video || !fileUrl) return;
                  const poster = cacheVideoPoster(video, fileUrl);
                  if (poster) setPreviewFrame(poster);
                }}
                className="video-upload-preview h-full w-full object-contain"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>
                {orientation === "portrait" ? "Vertical 9:16" : "Horizontal 16:9"} ·{" "}
                {formatDuration(duration)}
              </span>
              <button
                onClick={() => videoInput.current?.click()}
                className="font-semibold text-pink-400"
              >
                Change video
              </button>
            </div>
            {tooShort && (
              <p className="text-[11px] font-semibold text-red-400">
                This video is {formatDuration(duration)} — long videos must be at least 90 seconds.
              </p>
            )}

          </div>
        )}
        <input
          ref={videoInput}
          type="file"
          accept="video/*"
          hidden
          onChange={(e) => {
            pickVideo(e.target.files?.[0]);
            e.currentTarget.value = "";
          }}
        />

        {/* TITLE */}
        <Field label="Video Title">
          <Input
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your video a title"
            className="h-11 rounded-xl border-zinc-800 bg-zinc-900/60"
          />
        </Field>

        {/* DESCRIPTION */}
        <Field label="Description / Captions">
          <Textarea
            value={description}
            maxLength={2000}
            rows={5}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell viewers about this video…"
            className="min-h-28 rounded-xl border-zinc-800 bg-zinc-900/60 leading-relaxed"
          />
          <p className="pt-1 text-right text-[11px] text-zinc-500">{description.length}/2000</p>
        </Field>

        {/* THUMBNAIL */}
        <Field label="Custom Thumbnail">
          <div className="flex items-center gap-3">
            <div
              className={`overflow-hidden rounded-xl bg-zinc-900 ${
                orientation === "portrait" ? "h-28 w-16" : "h-20 w-36"
              }`}
            >
              {thumb ? (
                <img src={thumb} alt="Custom video thumbnail" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-zinc-600">
                  <ImageIcon size={20} />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                className="h-9 rounded-full text-xs"
                onClick={() => thumbInput.current?.click()}
              >
                <ImageIcon size={14} className="mr-1.5" /> Upload image
              </Button>
              <Button
                variant="secondary"
                className="h-9 rounded-full text-xs"
                disabled={!fileUrl}
                onClick={grabFrame}
              >
                <Camera size={14} className="mr-1.5" /> Use current frame
              </Button>
            </div>
          </div>
          <input
            ref={thumbInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
               if (f) {
                 if (thumb?.startsWith("blob:")) URL.revokeObjectURL(thumb);
                thumbnailFileRef.current = f;
                 setThumb(URL.createObjectURL(f));
               }
            }}
          />
        </Field>

        {/* CATEGORIES */}
        <Field label="Category / Tags">
          <div className="flex flex-wrap gap-2">
            {VIDEO_CATEGORIES.map((c) => {
              const active = tags.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleTag(c)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                    active ? "bg-white text-black" : "bg-zinc-900 text-zinc-400"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Field>

        {/* SERIES METADATA */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Part of a series?</p>
              <p className="text-[11px] text-zinc-400">
                Group related long videos and show the next parts in the player.
              </p>
            </div>
            <Switch checked={seriesEnabled} onCheckedChange={setSeriesEnabled} />
          </div>
          {seriesEnabled && (
            <div className="mt-4 grid gap-3">
              <Field label="Series title">
                <Input
                  value={seriesTitle}
                  maxLength={120}
                  onChange={(event) => setSeriesTitle(event.target.value)}
                  placeholder="e.g. The Mountain Journal"
                  className="h-11 rounded-xl border-zinc-800 bg-zinc-900/60"
                />
              </Field>
              <Field label="Episode or part number">
                <Input
                  value={episodeNumber}
                  maxLength={40}
                  onChange={(event) => setEpisodeNumber(event.target.value)}
                  placeholder="e.g. Episode 1 or Part 2"
                  className="h-11 rounded-xl border-zinc-800 bg-zinc-900/60"
                />
              </Field>
            </div>
          )}
        </div>

        {/* ACCESS CONTROL & PRICING */}
        <Field label="Access Control & Pricing">
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccessOpen((o) => !o)}
              className="flex h-11 w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 text-sm text-white active:scale-[0.99]"
            >
              <span className="font-medium">
                {accessOptions.find((o) => o.value === access)?.label}
              </span>
              <ChevronDown
                size={16}
                className={`text-zinc-400 transition-transform ${accessOpen ? "rotate-180" : ""}`}
              />
            </button>
            {accessOpen && (
              <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-zinc-800 bg-[#1a1a1d] shadow-xl">
                {accessOptions.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      setAccess(o.value);
                      if (o.value === "public") {
                        setPrice("0");
                      } else if (o.value === "paid" && price === "0") {
                        setPrice("");
                      }
                      setAccessOpen(false);
                    }}
                    className={`flex w-full flex-col items-start gap-0.5 px-3.5 py-2.5 text-left transition-colors ${
                      access === o.value ? "bg-zinc-800/70" : "hover:bg-zinc-800/40"
                    }`}
                  >
                    <span className="text-sm font-semibold text-white">{o.label}</span>
                    <span className="text-[11px] text-zinc-400">{o.hint}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {access === "paid" && (
            <div className="mt-3">
              <label className="pb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Enter Price (₹)
              </label>
              <Input
                type="number"
                inputMode="numeric"
                min={MIN_PAID_VIDEO_PRICE}
                max={MAX_PAID_VIDEO_PRICE}
                step={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 49, 99, 199"
                className="h-11 rounded-xl border-zinc-800 bg-zinc-900/60 placeholder:text-zinc-500"
              />
              <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
                Viewers must pay this amount via UPI to unlock and watch your video.
              </p>
              {Number(price) > 0 && Number.isFinite(Number(price)) ? (
                <div className="mt-3 text-[11px] leading-relaxed text-zinc-300">
                  {(() => {
                    const split = computeVideoPurchaseSplit(Number(price));
                    return (
                      <p>
                        Total Price:{" "}
                        <span className="font-semibold text-zinc-200">{inr(split.totalAmount)}</span>{" "}
                        | Platform Fee:{" "}
                        <span className="font-semibold text-zinc-200">
                          {inr(split.platformFee)}
                        </span>{" "}
                        (15%) | Estimated Creator Net:{" "}
                        <span className="font-semibold text-emerald-300">
                          {inrWhole(split.estimatedCreatorNet)}
                        </span>{" "}
                        (after standard gateway &amp; tax processing)
                      </p>
                    );
                  })()}
                </div>
              ) : null}
            </div>
          )}
        </Field>

        {/* PAID PROMOTION DISCLOSURE */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Includes Paid Promotion</p>
              <p className="text-[11px] text-zinc-400">Required for IT &amp; Brand Disclosure Compliance</p>
            </div>
            <Switch checked={paidPromotion} onCheckedChange={setPaidPromotion} />
          </div>
        </div>

        {/* SCHEDULE */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-pink-400" />
              <div>
                <p className="text-sm font-semibold">Schedule Post</p>
                <p className="text-[11px] text-zinc-400">Release this video at a future time</p>
              </div>
            </div>
            <Switch checked={scheduled} onCheckedChange={setScheduled} />
          </div>
          {scheduled && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 rounded-xl border-zinc-800 bg-zinc-900/60"
              />
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-11 rounded-xl border-zinc-800 bg-zinc-900/60"
              />
            </div>
          )}
        </div>

        <Button
          className="h-12 w-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-base font-bold"
          disabled={!canPublish}
          onClick={submit}
        >
          {busy && <Loader2 size={18} className="mr-2 animate-spin" />}
          {scheduled ? "Schedule" : "Publish"}
        </Button>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="pb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      {children}
    </div>
  );
}
