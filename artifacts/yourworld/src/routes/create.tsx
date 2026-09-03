import React, { useState, useRef, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft, Play, Pause, Scissors, Gauge,
  Sparkles, Trash2, Copy,
  Music, Type, Smile, Sliders, Undo2, Redo2, Crop, SplitSquareHorizontal,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { CameraCapture } from "@/components/yw/CameraCapture";
import { LightTimeline } from "@/components/yw/editor/LightTimeline";
import { GpuVideoPreview } from "@/components/yw/editor/GpuVideoPreview";
import { NO_COPYRIGHT_MUSIC } from "@/components/yw/MusicVault";
import { publishReel } from "@/lib/social-data";
import { useUploads } from "@/lib/upload-progress";
import { canMuxReel, renderReel } from "@/lib/reel-mux";
import { ReelPublishSheet, type ReelPublishMeta } from "@/components/yw/ReelPublishSheet";
import { MAX_REEL_CLIPS, MAX_REEL_CLIPS_MESSAGE } from "@/lib/reel-editor";

import type { AudioTrackState } from "@/components/yw/editor/AudioTrackLane";

export const Route = createFileRoute("/create")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "live" ? ("live" as const) : ("reel" as const),
  }),
  head: () => ({
    meta: [
      { title: "Camera & Pro Edits Studio — YourWorld" },
      {
        name: "description",
        content:
          "Shoot in 4K/60fps with flip camera, pinch zoom and one-tap record, then jump straight into the YourWorld Pro Edits Studio.",
      },
      { property: "og:title", content: "Camera & Pro Edits Studio — YourWorld" },
      {
        property: "og:description",
        content: "Capture posts, reels and live moments in ultra HD, then edit them instantly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CreateStudioPage,
});

interface ClipItem {
  id: string;
  url: string;
  speed: number;
  speedRamp?: "constant" | "up" | "down";
  rotation: number;
  filter: "none" | "vivid" | "noir" | "cyber" | "warm";
  textOverlay: string;
  volume: number;
  trimStart?: number;
  trimEnd?: number;
  duration?: number;
  crop?: number;
  cropX?: number;
  cropY?: number;
  textX?: number;
  textY?: number;
  textSize?: number;
  cropBox?: { x: number; y: number; w: number; h: number };
  contrast?: number;
  saturation?: number;
  warmth?: number;
  grain?: number;
}

type ToolId =
  | "TRIM" | "MUSIC" | "FILTER" | "EFFECT" | "TEXT" | "STICKER" | "SPEED" | "CROP";

const TOOL_MENU: { id: ToolId; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "TRIM", label: "Trim", Icon: Scissors },
  { id: "MUSIC", label: "Music", Icon: Music },
  { id: "FILTER", label: "Filter", Icon: Sliders },
  { id: "EFFECT", label: "Effect", Icon: Sparkles },
  { id: "TEXT", label: "Text", Icon: Type },
  { id: "STICKER", label: "Sticker", Icon: Smile },
  { id: "SPEED", label: "Speed", Icon: Gauge },
  { id: "CROP", label: "Crop", Icon: Crop },
];

const fmtSec = (s: number) => {
  const v = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;
};


function CreateStudioPage() {
  const navigate = useNavigate();
  const { mode } = Route.useSearch();
  const { startUpload } = useUploads();
  const [clips, setClips] = useState<ClipItem[]>([]);
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activeToolPanel, setActiveToolPanel] = useState<
    "NONE" | ToolId | "VOLUME"
  >("NONE");
  const [currentTime, setCurrentTime] = useState(0);
  const [playFraction, setPlayFraction] = useState(0);
  const [customTextInput, setCustomTextInput] = useState("");
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportRes, setExportRes] = useState<"4K" | "HD">("4K");
  const [exportStage, setExportStage] = useState<"choose" | "saving" | "done">("choose");
  const [exportProgress, setExportProgress] = useState(0);
  const [posting, setPosting] = useState(false);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const backgroundExportUrls = useRef(new Set<string>());
  const [gpuPreviewEnabled, setGpuPreviewEnabled] = useState(false);
  const handleGpuCapability = React.useCallback((enabled: boolean) => {
    setGpuPreviewEnabled(enabled);
  }, []);

  useEffect(() => {
    const retainedUrls = backgroundExportUrls.current;
    return () => {
      if (exportedUrl && !retainedUrls.has(exportedUrl)) {
        URL.revokeObjectURL(exportedUrl);
      }
    };
  }, [exportedUrl]);

  const startExport = async () => {
    const clip = clips[activeClipIndex] ?? clips[0];
    if (!clip?.url) return;
    setExportStage("saving");
    setExportProgress(0);
    const rendered = await renderReel({
      videoUrl: clip.url,
      trimStart: clip.trimStart ?? 0,
      trimEnd: clip.trimEnd ?? clip.duration,
      music: audioTrack ?? undefined,
      resolution: exportRes,
      fps: 60,
      speed: clip.speed,
      speedRamp: clip.speedRamp,
      filter: clip.filter,
      contrast: clip.contrast ?? 1,
      saturation: clip.saturation ?? 1,
      warmth: clip.warmth ?? 0,
      grain: clip.grain ?? 0,
      onProgress: setExportProgress,
    });
    if (!rendered) {
      setExportStage("choose");
      toast.error("This browser could not render the reel. Try Chrome or Safari.");
      return;
    }
    setExportedUrl(rendered);
    setExportProgress(100);
    setExportStage("done");
  };

  const saveToGallery = () => {
    const url = exportedUrl || clips[activeClipIndex]?.url || clips[0]?.url;
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `yourworld-${exportRes}-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success(`Saved ${exportRes} video to your gallery`);
    setShowExport(false);
  };

  const [showPublish, setShowPublish] = useState(false);

  const postReel = async (meta: ReelPublishMeta) => {
    const clip = clips[activeClipIndex] ?? clips[0];
    const url = clip?.url;
    if (!url) {
      toast.error("Nothing to post yet");
      return;
    }
    // Reels on YourWorld are 5–80 seconds long.
    if (totalDuration < 5) {
      toast.error("Reel is too short — it must be at least 5 seconds.");
      return;
    }
    if (totalDuration > 80) {
      toast.error("Reel is too long — trim it to 80 seconds or less.");
      return;
    }
    setPosting(true);
    const caption = meta.caption || clip?.textOverlay || "";

    // Bake the selected music into the video so the reel plays with sound.
    let uploadUrl = exportedUrl || url;
    if (!exportedUrl && audioTrack && canMuxReel()) {
      const t = toast.loading("Adding music to your reel…");
      const trimEnd = clip?.trimEnd ?? clip?.duration;
      const baked = await renderReel({
        videoUrl: url,
        trimStart: clip?.trimStart ?? 0,
        trimEnd: trimEnd && trimEnd > 0 ? trimEnd : undefined,
        music: {
          url: audioTrack.url,
          start: audioTrack.start,
          clipStart: audioTrack.clipStart,
          clipEnd: audioTrack.clipEnd,
        },
        resolution: "HD",
        fps: 60,
        speed: clip?.speed,
        speedRamp: clip?.speedRamp,
        filter: clip?.filter,
        contrast: clip?.contrast ?? 1,
        saturation: clip?.saturation ?? 1,
        warmth: clip?.warmth ?? 0,
        grain: clip?.grain ?? 0,
      });
      toast.dismiss(t);
      if (!baked) {
        setPosting(false);
        toast.error("Music could not be added. Reel was not posted—please try again.");
        return;
      }
      uploadUrl = baked;
    } else if (audioTrack) {
      setPosting(false);
      toast.error("This browser cannot export reel audio. Try Chrome or Safari.");
      return;
    }

    // Upload continues in the background with a live percentage bar.
    if (exportedUrl) backgroundExportUrls.current.add(exportedUrl);
    void startUpload(
      { kind: "reel", label: caption || "New reel", thumbnail: null, viewTo: "/reels" },
      (onProgress) =>
        publishReel({
          fileUrl: uploadUrl,
          caption,
          hashtags: meta.hashtags,
          location: meta.location,
          link: meta.link,
          audience: meta.audience,
          taggedUserIds: meta.taggedUserIds,
          viewerUserIds: meta.viewerUserIds,
          audio: audioTrack?.title ?? null,
          onProgress,
        }),
    ).then(({ error }) => {
      if (error) toast.error(error);
      else {
        if (exportedUrl) {
          backgroundExportUrls.current.delete(exportedUrl);
          URL.revokeObjectURL(exportedUrl);
        }
        toast.success("Reel posted");
      }
    });

    setPosting(false);
    setShowPublish(false);
    setShowExport(false);
    navigate({ to: "/reels" });
  };

  const [audioTrack, setAudioTrack] = useState<AudioTrackState | null>(null);

  // ---- Real undo / redo history (clips + audio track) ----
  type EditSnapshot = { clips: ClipItem[]; audioTrack: AudioTrackState | null };
  const pastRef = useRef<EditSnapshot[]>([]);
  const futureRef = useRef<EditSnapshot[]>([]);
  const lastSnapRef = useRef<EditSnapshot>({ clips: [], audioTrack: null });
  const skipHistoryRef = useRef(false);
  const [historyVersion, setHistoryVersion] = useState(0);

  useEffect(() => {
    const snap: EditSnapshot = { clips, audioTrack };
    if (
      lastSnapRef.current.clips === clips &&
      lastSnapRef.current.audioTrack === audioTrack
    )
      return;
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      lastSnapRef.current = snap;
      setHistoryVersion((v) => v + 1);
      return;
    }
    pastRef.current = [...pastRef.current.slice(-49), lastSnapRef.current];
    futureRef.current = [];
    lastSnapRef.current = snap;
    setHistoryVersion((v) => v + 1);
  }, [clips, audioTrack]);

  const applySnapshot = (snap: EditSnapshot) => {
    skipHistoryRef.current = true;
    setClips(snap.clips);
    setAudioTrack(snap.audioTrack);
    setActiveClipIndex((i) => Math.min(i, Math.max(0, snap.clips.length - 1)));
  };

  const handleUndo = () => {
    const prev = pastRef.current.pop();
    if (!prev) {
      toast("Nothing to undo");
      setHistoryVersion((v) => v + 1);
      return;
    }
    futureRef.current = [...futureRef.current, lastSnapRef.current];
    applySnapshot(prev);
    toast("Undone");
  };

  const handleRedo = () => {
    const next = futureRef.current.pop();
    if (!next) {
      toast("Nothing to redo");
      setHistoryVersion((v) => v + 1);
      return;
    }
    pastRef.current = [...pastRef.current, lastSnapRef.current];
    applySnapshot(next);
    toast("Redone");
  };

  const canUndo = pastRef.current.length > 0 && historyVersion >= 0;
  const canRedo = futureRef.current.length > 0;



  // Load a music file from the device gallery / storage
  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = URL.createObjectURL(file);
    const probe = document.createElement("audio");
    probe.preload = "metadata";
    probe.src = url;
    probe.addEventListener("loadedmetadata", () => {
      const dur = isFinite(probe.duration) && probe.duration > 0 ? probe.duration : 30;
      setAudioTrack({
        id: `up_${Date.now()}`,
        title: file.name.replace(/\.[^.]+$/, ""),
        url,
        start: 0,
        clipStart: 0,
        clipEnd: dur,
        duration: dur,
      });
      setShowMusicPicker(false);
      toast.success("Music added from your device");
    });
    probe.addEventListener("error", () => toast.error("Could not read that audio file"));
  };

  const totalDuration = clips.reduce((acc, c) => {
    const d = c.duration || 0;
    const start = c.trimStart ?? 0;
    const end = c.trimEnd ?? d;
    return acc + Math.max(0, end - start);
  }, 0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoSlotsRef = useRef<[HTMLVideoElement | null, HTMLVideoElement | null]>([null, null]);
  const slotClipIndexRef = useRef<[number | null, number | null]>([null, null]);
  const activeVideoSlotRef = useRef(0);
  const [activeVideoSlot, setActiveVideoSlot] = useState(0);
  const audioElRef = useRef<HTMLAudioElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scrubbingRef = useRef(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrubTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const seekRafRef = useRef<number | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const globalTimeRef = useRef(0);
  const [textSelected, setTextSelected] = useState(false);
  const viewportPointersRef = useRef(new Map<number, { x: number; y: number }>());
  const viewportGestureRef = useRef<{
    distance: number;
    midpoint: { x: number; y: number };
    crop: number;
    cropX: number;
    cropY: number;
  } | null>(null);
  const textGestureRef = useRef<{
    pointers: Map<number, { x: number; y: number }>;
    start: { x: number; y: number };
    textX: number;
    textY: number;
    textSize: number;
    distance: number;
    midpoint: { x: number; y: number };
    mode: "move" | "resize";
    element: HTMLElement;
  } | null>(null);

  useEffect(() => {
    const viewportPointers = viewportPointersRef.current;
    return () => {
      if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);
      if (seekRafRef.current) cancelAnimationFrame(seekRafRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (scrubTimerRef.current) clearTimeout(scrubTimerRef.current);
      viewportPointers.clear();
      textGestureRef.current = null;
    };
  }, []);

  // Coalesce high-frequency pointer updates into one state write per frame
  const scheduleFrame = (fn: () => void) => {
    if (dragRafRef.current) return;
    dragRafRef.current = requestAnimationFrame(() => {
      dragRafRef.current = null;
      fn();
    });
  };

  // Push files into the Pro Edits Studio editor
  const addFiles = (files: File[]) => {
    if (clips.length + files.length > MAX_REEL_CLIPS) {
      toast.error(MAX_REEL_CLIPS_MESSAGE);
      return;
    }
    const newClips: ClipItem[] = files.map((f, i) => ({
      id: `c_${Date.now()}_${i}`,
      url: URL.createObjectURL(f),
      speed: 1,
      speedRamp: "constant",
      rotation: 0,
      filter: "none",
      textOverlay: "",
      volume: 1,
      trimStart: 0,
      crop: 1,
      cropX: 0,
      cropY: 0,
      textX: 50,
      textY: 50,
      textSize: 1,
      contrast: 1,
      saturation: 1,
      warmth: 0,
      grain: 0,
    }));
    setExportedUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setClips((prev) => [...prev, ...newClips]);
    setActiveClipIndex(clips.length);
  };

  // Smooth Multi-Select Import (Up to 5 clips)
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    addFiles(Array.from(files));
    e.target.value = "";
  };

  const currentClip = clips[activeClipIndex];

  // Real-time Property Updation (selected clip only)
  const updateCurrentClip = <K extends keyof ClipItem>(key: K, val: ClipItem[K]) => {
    setExportedUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setClips((prev) =>
      prev.map((c, i) => (i === activeClipIndex ? { ...c, [key]: val } : c)),
    );
  };

  const clamp = (n: number, a = 0, b = 100) => Math.min(b, Math.max(a, n));
  const clampCropOffset = (value: number, scale: number) => {
    const maxOffset = Math.max(0, (scale - 1) * 50);
    return Math.min(maxOffset, Math.max(-maxOffset, value));
  };

  const stagePct = (e: { clientX: number; clientY: number }) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return { x: 50, y: 50 };
    return {
      x: clamp(((e.clientX - r.left) / r.width) * 100),
      y: clamp(((e.clientY - r.top) / r.height) * 100),
    };
  };

  // GPU-friendly viewport gestures. Two fingers control zoom and pan together;
  // one finger can pan an already-zoomed frame without fighting page scroll.
  const startViewportGesture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    const point = { x: e.clientX, y: e.clientY };
    viewportPointersRef.current.set(e.pointerId, point);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const points = [...viewportPointersRef.current.values()];
    if (points.length === 1) {
      viewportGestureRef.current = {
        distance: 0,
        midpoint: point,
        crop: currentClip?.crop ?? 1,
        cropX: currentClip?.cropX ?? 0,
        cropY: currentClip?.cropY ?? 0,
      };
    } else if (points.length === 2) {
      const [first, second] = points;
      viewportGestureRef.current = {
        distance: Math.hypot(second.x - first.x, second.y - first.y),
        midpoint: {
          x: (first.x + second.x) / 2,
          y: (first.y + second.y) / 2,
        },
        crop: currentClip?.crop ?? 1,
        cropX: currentClip?.cropX ?? 0,
        cropY: currentClip?.cropY ?? 0,
      };
    }
  };

  const moveViewportGesture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!viewportPointersRef.current.has(e.pointerId)) return;
    viewportPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const gesture = viewportGestureRef.current;
    if (!gesture || !currentClip) return;
    const points = [...viewportPointersRef.current.values()];
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const update = (crop: number, cropX: number, cropY: number) => {
      const next = {
        crop,
        cropX: clampCropOffset(cropX, crop),
        cropY: clampCropOffset(cropY, crop),
      };
      setClips((prev) =>
        prev.map((clip, index) => (index === activeClipIndex ? { ...clip, ...next } : clip)),
      );
    };
    if (points.length >= 2) {
      const [first, second] = points;
      const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
      const midpoint = {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
      };
      const dx = ((midpoint.x - gesture.midpoint.x) / rect.width) * 100;
      const dy = ((midpoint.y - gesture.midpoint.y) / rect.height) * 100;
      update(
        clamp(gesture.crop * (distance / Math.max(1, gesture.distance)), 1, 4),
        gesture.cropX + dx,
        gesture.cropY + dy,
      );
    } else if (points.length === 1) {
      const point = points[0];
      const dx = ((point.x - gesture.midpoint.x) / rect.width) * 100;
      const dy = ((point.y - gesture.midpoint.y) / rect.height) * 100;
      update(gesture.crop, gesture.cropX + dx, gesture.cropY + dy);
    }
  };

  const endViewportGesture = (e: React.PointerEvent<HTMLDivElement>) => {
    viewportPointersRef.current.delete(e.pointerId);
    if (viewportPointersRef.current.size === 0) viewportGestureRef.current = null;
  };

  const updateTextFromGesture = (gesture: NonNullable<typeof textGestureRef.current>) => {
    const rect = stageRef.current?.getBoundingClientRect();
    const points = [...gesture.pointers.values()];
    if (!rect || !points.length) return;
    let nextX = gesture.textX;
    let nextY = gesture.textY;
    let nextSize = gesture.textSize;
    if (gesture.mode === "resize" && points.length === 1) {
      const center = {
        x: rect.left + (gesture.textX / 100) * rect.width,
        y: rect.top + (gesture.textY / 100) * rect.height,
      };
      const distance = Math.max(12, Math.hypot(points[0].x - center.x, points[0].y - center.y));
      nextSize = clamp(gesture.textSize * (distance / Math.max(12, gesture.distance)), 0.65, 3);
    } else if (points.length >= 2) {
      const [first, second] = points;
      const distance = Math.max(12, Math.hypot(second.x - first.x, second.y - first.y));
      const midpoint = {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
      };
      nextSize = clamp(gesture.textSize * (distance / Math.max(12, gesture.distance)), 0.65, 3);
      nextX = clamp(gesture.textX + ((midpoint.x - gesture.midpoint.x) / rect.width) * 100);
      nextY = clamp(gesture.textY + ((midpoint.y - gesture.midpoint.y) / rect.height) * 100);
    } else {
      const point = points[0];
      nextX = clamp(gesture.textX + ((point.x - gesture.start.x) / rect.width) * 100);
      nextY = clamp(gesture.textY + ((point.y - gesture.start.y) / rect.height) * 100);
    }
    gesture.element.style.left = `${nextX}%`;
    gesture.element.style.top = `${nextY}%`;
    gesture.element.style.fontSize = `${1.1 * nextSize}rem`;
    scheduleFrame(() =>
      setClips((prev) =>
        prev.map((clip, index) =>
          index === activeClipIndex
            ? { ...clip, textX: nextX, textY: nextY, textSize: nextSize }
            : clip,
        ),
      ),
    );
  };

  const handleTextPointerMove = (e: PointerEvent) => {
    const gesture = textGestureRef.current;
    if (!gesture || !gesture.pointers.has(e.pointerId)) return;
    gesture.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    updateTextFromGesture(gesture);
  };

  const handleTextPointerEnd = (e: PointerEvent) => {
    const gesture = textGestureRef.current;
    if (!gesture) return;
    gesture.pointers.delete(e.pointerId);
    if (gesture.pointers.size === 0) {
      window.removeEventListener("pointermove", handleTextPointerMove);
      window.removeEventListener("pointerup", handleTextPointerEnd);
      window.removeEventListener("pointercancel", handleTextPointerEnd);
      textGestureRef.current = null;
    }
  };

  // Text supports one-finger dragging, two-finger pinch scaling, and handle
  // resizing. All high-frequency writes are coalesced onto the next frame.
  const startTextGesture = (
    e: React.PointerEvent<HTMLElement>,
    mode: "move" | "resize" = "move",
    target?: HTMLElement,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const el = target ?? (e.currentTarget as HTMLElement);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setTextSelected(true);
    const point = { x: e.clientX, y: e.clientY };
    const currentX = currentClip?.textX ?? 50;
    const currentY = currentClip?.textY ?? 50;
    const currentSize = currentClip?.textSize ?? 1;
    const rect = stageRef.current?.getBoundingClientRect();
    const center = rect
      ? { x: rect.left + (currentX / 100) * rect.width, y: rect.top + (currentY / 100) * rect.height }
      : point;
    const existing = textGestureRef.current;
    if (existing) {
      const first = [...existing.pointers.values()][0];
      existing.pointers.set(e.pointerId, point);
      if (existing.pointers.size === 2 && first) {
        existing.distance = Math.max(12, Math.hypot(point.x - first.x, point.y - first.y));
        existing.midpoint = {
          x: (point.x + first.x) / 2,
          y: (point.y + first.y) / 2,
        };
        existing.textX = currentClip?.textX ?? existing.textX;
        existing.textY = currentClip?.textY ?? existing.textY;
        existing.textSize = currentClip?.textSize ?? existing.textSize;
      }
      return;
    }
    textGestureRef.current = {
      pointers: new Map([[e.pointerId, point]]),
      start: point,
      textX: currentX,
      textY: currentY,
      textSize: currentSize,
      distance: Math.max(12, Math.hypot(point.x - center.x, point.y - center.y)),
      midpoint: point,
      mode,
      element: el,
    };
    window.addEventListener("pointermove", handleTextPointerMove, { passive: true });
    window.addEventListener("pointerup", handleTextPointerEnd);
    window.addEventListener("pointercancel", handleTextPointerEnd);
  };

  // Freeform crop bounding box drag (move + corner resize)
  const startCropDrag = (e: React.PointerEvent, mode: "move" | "nw" | "ne" | "sw" | "se") => {
    e.preventDefault();
    e.stopPropagation();
    const box = currentClip?.cropBox ?? { x: 10, y: 10, w: 80, h: 80 };
    const origin = stagePct(e);
    const move = (ev: PointerEvent) => {
      const p = stagePct(ev);
      const dx = p.x - origin.x;
      const dy = p.y - origin.y;
      const next = { ...box };
      if (mode === "move") {
        next.x = clamp(box.x + dx, 0, 100 - box.w);
        next.y = clamp(box.y + dy, 0, 100 - box.h);
      } else {
        const right = box.x + box.w;
        const bottom = box.y + box.h;
        if (mode === "nw" || mode === "sw") {
          next.x = clamp(box.x + dx, 0, right - 10);
          next.w = right - next.x;
        } else {
          next.w = clamp(box.w + dx, 10, 100 - box.x);
        }
        if (mode === "nw" || mode === "ne") {
          next.y = clamp(box.y + dy, 0, bottom - 10);
          next.h = bottom - next.y;
        } else {
          next.h = clamp(box.h + dy, 10, 100 - box.y);
        }
      }
      scheduleFrame(() =>
        setClips((prev) =>
          prev.map((c, i) => (i === activeClipIndex ? { ...c, cropBox: next } : c)),
        ),
      );
    };
    const end = () => {
      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", end);
  };

  // Aspect-ratio presets: fit the largest box of `ratio` (w/h) inside the
  // visible video area, expressed in stage percentages.
  const applyAspect = (ratio: number | null) => {
    if (ratio === null) {
      setClips((prev) =>
        prev.map((c, i) => (i === activeClipIndex ? { ...c, cropBox: undefined } : c)),
      );
      return;
    }
    const stage = stageRef.current?.getBoundingClientRect();
    const vid = videoRef.current?.getBoundingClientRect();
    if (!stage || !vid || !stage.width || !stage.height) return;
    // video box in stage %
    const vx = ((vid.left - stage.left) / stage.width) * 100;
    const vy = ((vid.top - stage.top) / stage.height) * 100;
    const vw = (vid.width / stage.width) * 100;
    const vh = (vid.height / stage.height) * 100;
    // px-space fit, then convert back to %
    let boxWpx = vid.width;
    let boxHpx = boxWpx / ratio;
    if (boxHpx > vid.height) {
      boxHpx = vid.height;
      boxWpx = boxHpx * ratio;
    }
    const w = (boxWpx / vid.width) * vw;
    const h = (boxHpx / vid.height) * vh;
    const next = { x: vx + (vw - w) / 2, y: vy + (vh - h) / 2, w, h };
    setClips((prev) =>
      prev.map((c, i) => (i === activeClipIndex ? { ...c, cropBox: next } : c)),
    );
  };


  // ---- 60fps playhead: read the video on every frame, commit state only when
  // it visibly changes so the timeline glides instead of stepping. ----
  const lastSyncRef = useRef({ frac: -1, time: -1 });
  const syncTime = React.useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const c = clips[activeClipIndex];
    const dur = c?.duration || v.duration || 0;
    const start = c?.trimStart ?? 0;
    const end = c?.trimEnd ?? dur;
    const span = Math.max(0.01, end - start);
    const frac = Math.min(1, Math.max(0, (v.currentTime - start) / span));
    let before = 0;
    for (let i = 0; i < activeClipIndex; i++) {
      const p = clips[i];
      const pd = p?.duration || 0;
      before += Math.max(0, (p?.trimEnd ?? pd) - (p?.trimStart ?? 0));
    }
    const global = before + frac * span;
    globalTimeRef.current = global;
    const last = lastSyncRef.current;
    if (Math.abs(last.frac - frac) > 0.0015) {
      last.frac = frac;
      setPlayFraction(frac);
    }
    if (Math.abs(last.time - global) > 0.08) {
      last.time = global;
      setCurrentTime(global);
    }
  }, [clips, activeClipIndex]);

  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    const loop = () => {
      syncTime();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, syncTime]);


  // Real-time Video Speed Sync
  useEffect(() => {
    if (videoRef.current && currentClip) {
      videoRef.current.playbackRate = currentClip.speed;
      videoRef.current.volume = currentClip.volume;
    }
    if (audioElRef.current && currentClip) {
      audioElRef.current.playbackRate = currentClip.speed;
      const audio = audioElRef.current as HTMLAudioElement & {
        preservesPitch?: boolean;
        webkitPreservesPitch?: boolean;
      };
      if ("preservesPitch" in audio) audio.preservesPitch = true;
      if ("webkitPreservesPitch" in audio) audio.webkitPreservesPitch = true;
    }
  }, [currentClip, activeClipIndex]);

  // Keep two video elements warm: one is visible while the other preloads the
  // next source. Switching only after canplay avoids src/load black frames.
  useEffect(() => {
    const activeSlot = activeVideoSlotRef.current;
    const nextSlot = activeSlot === 0 ? 1 : 0;
    const activeVideo = videoSlotsRef.current[activeSlot];
    const preloadVideo = videoSlotsRef.current[nextSlot];
    const activeClip = clips[activeClipIndex];
    if (!activeVideo || !activeClip?.url) return;

    videoRef.current = activeVideo;
    activeVideo.muted = isMuted;
    activeVideo.preload = "auto";
    const start = activeClip.trimStart ?? 0;
    const end = activeClip.trimEnd;
    const ready = () => {
      if (scrubbingRef.current) return;
      if (
        activeVideo.currentTime < start - 0.05 ||
        (end != null && activeVideo.currentTime > end + 0.05)
      ) {
        try { activeVideo.currentTime = start; } catch { /* ignore */ }
      }
      if (isPlaying) void activeVideo.play().catch(() => {});
    };

    const activeNeedsSource =
      slotClipIndexRef.current[activeSlot] !== activeClipIndex ||
      activeVideo.src !== activeClip.url;
    if (activeNeedsSource) {
      activeVideo.pause();
      activeVideo.src = activeClip.url;
      slotClipIndexRef.current[activeSlot] = activeClipIndex;
      activeVideo.load();
      activeVideo.addEventListener("canplay", ready, { once: true });
    } else if (activeVideo.readyState >= 2) {
      ready();
    } else {
      activeVideo.addEventListener("canplay", ready, { once: true });
    }

    const nextIndex = clips.length ? (activeClipIndex + 1) % clips.length : null;
    const nextClip = nextIndex == null ? null : clips[nextIndex];
    if (preloadVideo && nextClip?.url) {
      preloadVideo.pause();
      preloadVideo.muted = true;
      preloadVideo.preload = "auto";
      preloadVideo.playbackRate = nextClip.speed;
      preloadVideo.volume = nextClip.volume;
      const preloadNeedsSource =
        slotClipIndexRef.current[nextSlot] !== nextIndex ||
        preloadVideo.src !== nextClip.url;
      if (preloadNeedsSource) {
        preloadVideo.src = nextClip.url;
        slotClipIndexRef.current[nextSlot] = nextIndex;
        preloadVideo.load();
      }
    }
    return () => activeVideo.removeEventListener("canplay", ready);
  }, [clips, activeClipIndex, currentClip, isPlaying, isMuted, activeVideoSlot]);

  // Advance at the trim boundary. The next video has already been loaded into
  // the other slot, so it can start before the visible slot is swapped.
  const advancingRef = useRef(0);
  const advanceClip = React.useCallback(() => {
    if (!clips.length) return;
    const now = Date.now();
    if (now - advancingRef.current < 400) return;
    advancingRef.current = now;
    const next = (activeClipIndex + 1) % clips.length;
    const nextClip = clips[next];
    const currentVideo = videoRef.current;
    if (!nextClip || !currentVideo) return;
    const start = nextClip.trimStart ?? 0;

    if (nextClip.url === currentClip?.url) {
      currentVideo.playbackRate = nextClip.speed;
      currentVideo.volume = nextClip.volume;
      try { currentVideo.currentTime = start; } catch { /* ignore */ }
      if (isPlaying) void currentVideo.play().catch(() => {});
      setActiveClipIndex(next);
      return;
    }

    const oldSlot = activeVideoSlotRef.current;
    const nextSlot = oldSlot === 0 ? 1 : 0;
    const nextVideo = videoSlotsRef.current[nextSlot];
    if (!nextVideo) return;

    let switched = false;
    const switchWhenReady = () => {
      if (switched || nextVideo.readyState < 2) return;
      switched = true;
      nextVideo.removeEventListener("canplay", switchWhenReady);
      try { nextVideo.currentTime = start; } catch { /* ignore */ }
      nextVideo.muted = isMuted;
      nextVideo.playbackRate = nextClip.speed;
      nextVideo.volume = nextClip.volume;
      const playNext = nextVideo.play();
      const activate = () => {
        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
        currentVideo.pause();
        videoRef.current = nextVideo;
        activeVideoSlotRef.current = nextSlot;
        setActiveVideoSlot(nextSlot);
        setActiveClipIndex(next);
        setIsPlaying(true);
      };
      void playNext.then(activate).catch(() => activate());
    };

    nextVideo.addEventListener("canplay", switchWhenReady);
    if (nextVideo.readyState >= 2) switchWhenReady();
    else nextVideo.load();
    transitionTimerRef.current = setTimeout(() => {
      if (!switched) switchWhenReady();
    }, 1200);
  }, [clips, activeClipIndex, currentClip?.url, isMuted, isPlaying]);


  // Sync canvas playback to the selected clip's trim range
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !currentClip) return;
    const start = currentClip.trimStart ?? 0;
    const end = currentClip.trimEnd;
    const seek = () => {
      if (scrubbingRef.current) return;
      if (Math.abs(v.currentTime - start) > 0.05) v.currentTime = start;
    };
    if (v.readyState >= 1) seek();
    else v.addEventListener("loadedmetadata", seek, { once: true });
    const onTime = () => {
      if (scrubbingRef.current) return;
      if (end && v.currentTime >= end) advanceClip();
      else if (v.currentTime < start - 0.1) v.currentTime = start;
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", advanceClip);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", advanceClip);
      v.removeEventListener("loadedmetadata", seek);
    };
  }, [activeClipIndex, currentClip, advanceClip]);

  // Split the SELECTED clip at the playhead into two trimmed clips
  // Keep the library music block playing in sync with the video playhead
  useEffect(() => {
    const v = videoRef.current;
    const a = audioElRef.current;
    if (!v || !a || !audioTrack) return;
    const sync = () => {
      const global = globalTimeRef.current;
      const span = Math.max(0.1, audioTrack.clipEnd - audioTrack.clipStart);
      const rel = global - audioTrack.start;
        const t = audioTrack.clipStart + rel * (currentClip?.speed ?? 1);
      if (rel >= 0 && rel <= span && !v.paused) {
        if (Math.abs(a.currentTime - t) > 0.25) a.currentTime = t;
        if (a.paused) void a.play().catch(() => {});
      } else if (!a.paused) {
        a.pause();
      }
    };
    const onPause = () => a.pause();
    v.addEventListener("timeupdate", sync);
    v.addEventListener("seeking", sync);
    v.addEventListener("play", sync);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("timeupdate", sync);
      v.removeEventListener("seeking", sync);
      v.removeEventListener("play", sync);
      v.removeEventListener("pause", onPause);
      a.pause();
    };
  }, [audioTrack, activeClipIndex, currentClip?.speed]);

  const handleSplit = () => {
    const v = videoRef.current;
    if (!currentClip || clips.length >= MAX_REEL_CLIPS) {
      toast.error(MAX_REEL_CLIPS_MESSAGE);
      return;
    }
    const dur = currentClip.duration || v?.duration || 0;
    const start = currentClip.trimStart ?? 0;
    const end = currentClip.trimEnd ?? dur;
    const at = v ? v.currentTime : (start + end) / 2;
    if (!(at > start + 0.15 && at < end - 0.15)) {
      toast.error("Move the playhead inside the clip to split");
      return;
    }
    setClips((prev) => {
      const next = [...prev];
      next[activeClipIndex] = { ...currentClip, trimEnd: at };
      next.splice(activeClipIndex + 1, 0, {
        ...currentClip,
        id: `c_${Date.now()}`,
        trimStart: at,
        trimEnd: end,
      });
      return next;
    });
    toast.success("Clip split");
  };

  // Real-time Duplicate
  const handleDuplicate = () => {
    if (!currentClip || clips.length >= MAX_REEL_CLIPS) {
      toast.error(MAX_REEL_CLIPS_MESSAGE);
      return;
    }
    const copy = { ...currentClip, id: `c_${Date.now()}` };
    const updated = [...clips];
    updated.splice(activeClipIndex + 1, 0, copy);
    setClips(updated);
    setActiveClipIndex(activeClipIndex + 1);
  };

  // Real-time Delete
  const handleDelete = () => {
    if (clips.length === 0) return;
    const updated = clips.filter((_, i) => i !== activeClipIndex);
    setClips(updated);
    setActiveClipIndex(Math.max(0, activeClipIndex - 1));
  };

  const selectClip = (index: number) => {
    const clip = clips[index];
    if (!clip) return;
    setTextSelected(false);
    const currentSlot = activeVideoSlotRef.current;
    const matchingSlot = slotClipIndexRef.current.findIndex((value) => value === index);
    if (matchingSlot >= 0 && matchingSlot !== currentSlot) {
      const nextVideo = videoSlotsRef.current[matchingSlot];
      const oldVideo = videoSlotsRef.current[currentSlot];
      if (nextVideo) {
        nextVideo.pause();
        nextVideo.muted = isMuted;
        try { nextVideo.currentTime = clip.trimStart ?? 0; } catch { /* ignore */ }
        oldVideo?.pause();
        videoRef.current = nextVideo;
        activeVideoSlotRef.current = matchingSlot;
        setActiveVideoSlot(matchingSlot);
      }
    }
    setActiveClipIndex(index);
    setIsPlaying(false);
    const nextVideo = videoSlotsRef.current[matchingSlot >= 0 ? matchingSlot : currentSlot];
    nextVideo?.pause();
  };

  // Real-time Play/Pause Toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setTextSelected(false);
    } else {
      void videoRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  // Horizontal tool menu actions
  const handleToolMenu = (id: ToolId) => {
    if (id === "MUSIC") return setShowMusicPicker(true);
    if (id === "EFFECT")
      return updateCurrentClip("filter", currentClip?.filter === "vivid" ? "none" : "vivid");
    setActiveToolPanel(activeToolPanel === id ? "NONE" : id);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-background text-foreground font-sans flex flex-col overflow-hidden select-none">
      
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleMediaSelect} 
        multiple 
        accept="video/*,image/*" 
        className="hidden" 
      />

      <input 
        type="file" 
        ref={audioInputRef} 
        accept="audio/*" 
        onChange={handleAudioSelect}
        className="hidden" 
      />

      {clips.length === 0 ? (
        /* MINIMALIST LIVE CAMERA */
        <CameraCapture
          allowedModes={mode === "live" ? ["LIVE"] : ["REEL"]}
          onClose={() => navigate({ to: "/" })}
          onCapture={(files) => addFiles(files)}
          onPick={() => fileInputRef.current?.click()}
          onDrafts={() => toast("No drafts yet — capture something first")}
        />
      ) : (
        /* LIGHT PRO EDITOR */
        <div className="flex-1 min-h-0 flex flex-col bg-background text-foreground relative">

          {/* HEADER BAR */}
          <div className="flex-shrink-0 flex justify-between items-center px-4 py-2 bg-card z-30 border-b border-border">
            <button onClick={() => setClips([])} className="p-2 bg-muted rounded-full text-foreground">
              <ArrowLeft size={18} />
            </button>
            <span className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">Edit</span>
            <button
              onClick={() => {
                setExportStage("choose");
                setExportProgress(0);
                setShowExport(true);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white font-black px-3.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wide shadow-sm active:scale-95 transition"
            >
              SAVE
            </button>
          </div>

          {/* EXPORT MODAL */}
          {showExport && (
            <div className="absolute inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center">
              <div className="w-full sm:max-w-sm bg-card text-foreground rounded-t-2xl sm:rounded-2xl p-5 shadow-xl">
                {exportStage === "choose" && (
                  <>
                    <h2 className="text-sm font-black uppercase tracking-wide mb-1">Export video</h2>
                    <p className="text-[11px] text-muted-foreground mb-4">Choose output resolution</p>
                    <div className="grid grid-cols-2 gap-2 mb-5">
                      {(["4K", "HD"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setExportRes(r)}
                          className={`py-2.5 rounded-lg text-xs font-bold border transition ${
                            exportRes === r
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-muted text-foreground border-border"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowExport(false)}
                        className="flex-1 py-2.5 rounded-lg bg-muted text-foreground text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={startExport}
                        className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white text-xs font-black uppercase"
                      >
                        Export {exportRes}
                      </button>
                    </div>
                  </>
                )}

                {exportStage === "saving" && (
                  <>
                    <h2 className="text-sm font-black uppercase tracking-wide mb-1">Saving {exportRes}</h2>
                    <p className="text-[11px] text-muted-foreground mb-4">Rendering to your device gallery…</p>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-orange-500 transition-all duration-150"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                    <div className="mt-2 text-right text-[11px] font-mono text-muted-foreground">
                      {Math.round(exportProgress)}%
                    </div>
                  </>
                )}

                {exportStage === "done" && (
                  <>
                    <h2 className="text-sm font-black uppercase tracking-wide mb-1">Export complete</h2>
                    <p className="text-[11px] text-muted-foreground mb-4">{exportRes} video is ready.</p>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          if (totalDuration < 5) { toast.error("Reel is too short — it must be at least 5 seconds."); return; }
                          if (totalDuration > 80) { toast.error("Reel is too long — trim it to 80 seconds or less."); return; }
                          setShowPublish(true);
                        }}
                        disabled={posting}
                        className="w-full py-3 rounded-lg bg-orange-500 text-white text-xs font-black uppercase tracking-wide disabled:opacity-60"
                      >
                        Next: caption & audience
                      </button>
                      <button
                        onClick={saveToGallery}
                        className="w-full py-3 rounded-lg bg-muted text-foreground text-xs font-black uppercase tracking-wide"
                      >
                        Save to Gallery
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <ReelPublishSheet
            open={showPublish}
            previewUrl={clips[activeClipIndex]?.url ?? clips[0]?.url}
            posting={posting}
            onClose={() => setShowPublish(false)}
            onShare={(meta) => void postReel(meta)}
          />



          {/* FULL-WIDTH VIDEO CANVAS */}
          <div className="flex-1 min-h-0 w-full flex items-center justify-center relative bg-black overflow-hidden">
              <div
                ref={stageRef}
                onPointerDown={startViewportGesture}
                onPointerMove={moveViewportGesture}
                onPointerUp={endViewportGesture}
                onPointerCancel={endViewportGesture}
                className="relative h-full max-h-full w-auto max-w-full aspect-[9/16] flex items-center justify-center touch-none bg-black overflow-hidden"
                style={{ contain: "layout paint size" }}
              >
              {([0, 1] as const).map((slot) => (
                <video
                  key={slot}
                  ref={(node) => {
                    videoSlotsRef.current[slot] = node;
                    if (slot === activeVideoSlot) videoRef.current = node;
                  }}
                  autoPlay={slot === activeVideoSlot}
                  playsInline
                  preload="auto"
                  muted={slot === activeVideoSlot ? isMuted : true}
                  onTimeUpdate={slot === activeVideoSlot ? syncTime : undefined}
                  onSeeked={slot === activeVideoSlot ? syncTime : undefined}
                  onEnded={slot === activeVideoSlot ? advanceClip : undefined}
                  onLoadedMetadata={slot === activeVideoSlot ? (e) => {
                    const d = e.currentTarget.duration;
                    if (isFinite(d) && d > 0 && !currentClip?.duration) updateCurrentClip("duration", d);
                  } : undefined}
                  aria-hidden={slot !== activeVideoSlot}
                  tabIndex={-1}
                  className={`absolute inset-0 h-full w-full object-contain will-change-transform transition-opacity duration-75 ${
                    slot === activeVideoSlot && !gpuPreviewEnabled ? "opacity-100" : "opacity-0"
                  }`}
                  style={{
                    transform: `translate3d(${currentClip?.cropX ?? 0}%,${currentClip?.cropY ?? 0}%,0) rotate(${currentClip?.rotation || 0}deg) scale(${currentClip?.crop ?? 1})`,
                    backfaceVisibility: "hidden",
                    clipPath: currentClip?.cropBox
                      ? `inset(${currentClip.cropBox.y}% ${100 - (currentClip.cropBox.x + currentClip.cropBox.w)}% ${100 - (currentClip.cropBox.y + currentClip.cropBox.h)}% ${currentClip.cropBox.x}%)`
                      : undefined,
                    filter:
                      currentClip?.filter === "vivid" ? "saturate(1.35) contrast(1.08)" :
                      currentClip?.filter === "noir" ? "grayscale(1) contrast(1.16)" :
                      currentClip?.filter === "cyber" ? "saturate(1.35) hue-rotate(65deg) contrast(1.12)" :
                      currentClip?.filter === "warm" ? "sepia(0.22) saturate(1.15) brightness(1.03)" : "none",
                  }}
                />
              ))}
              <GpuVideoPreview
                videoRef={videoRef}
                filter={currentClip?.filter ?? "none"}
                contrast={currentClip?.contrast ?? 1}
                saturation={currentClip?.saturation ?? 1}
                warmth={currentClip?.warmth ?? 0}
                grain={currentClip?.grain ?? 0}
                onCapability={handleGpuCapability}
                 className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-200 ${
                  gpuPreviewEnabled ? "opacity-100" : "opacity-0"
                }`}
                style={{
                    transform: `translate3d(${currentClip?.cropX ?? 0}%,${currentClip?.cropY ?? 0}%,0) rotate(${currentClip?.rotation || 0}deg) scale(${currentClip?.crop ?? 1})`,
                  clipPath: currentClip?.cropBox
                    ? `inset(${currentClip.cropBox.y}% ${100 - (currentClip.cropBox.x + currentClip.cropBox.w)}% ${100 - (currentClip.cropBox.y + currentClip.cropBox.h)}% ${currentClip.cropBox.x}%)`
                    : undefined,
                }}
              />

              {/* Freeform Crop Bounding Box */}
              {activeToolPanel === "CROP" && currentClip && (
                <div
                  onPointerDown={(e) => startCropDrag(e, "move")}
                  className="absolute border-2 border-orange-500 bg-orange-500/10 cursor-move touch-none"
                  style={{
                    left: `${currentClip.cropBox?.x ?? 10}%`,
                    top: `${currentClip.cropBox?.y ?? 10}%`,
                    width: `${currentClip.cropBox?.w ?? 80}%`,
                    height: `${currentClip.cropBox?.h ?? 80}%`,
                  }}
                >
                  {(["nw", "ne", "sw", "se"] as const).map((h) => (
                    <div
                      key={h}
                      onPointerDown={(e) => startCropDrag(e, h)}
                      className="absolute w-5 h-5 bg-orange-500 rounded-full border-2 border-white shadow touch-none"
                      style={{
                        left: h.includes("w") ? -10 : undefined,
                        right: h.includes("e") ? -10 : undefined,
                        top: h.startsWith("n") ? -10 : undefined,
                        bottom: h.startsWith("s") ? -10 : undefined,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Draggable Text Overlay */}
              {currentClip?.textOverlay && (
                <div
                  onPointerDown={(e) => startTextGesture(e)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTextSelected(true);
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 bg-white/85 text-foreground font-black px-4 py-2 rounded-xl border shadow-lg backdrop-blur-sm cursor-move touch-none select-none ${
                    textSelected && !isPlaying ? "border-orange-400" : "border-transparent"
                  }`}
                  style={{
                    left: `${currentClip.textX ?? 50}%`,
                    top: `${currentClip.textY ?? 50}%`,
                    fontSize: `${1.1 * (currentClip.textSize ?? 1)}rem`,
                  }}
                >
                  {currentClip.textOverlay}
                  {textSelected && !isPlaying && (
                    <>
                      <span
                        aria-hidden="true"
                        onPointerDown={(e) => startTextGesture(
                          e,
                          "resize",
                          e.currentTarget.parentElement as HTMLElement,
                        )}
                        className="absolute -left-2 -top-2 h-3.5 w-3.5 rounded-full border-2 border-white bg-orange-500 shadow"
                      />
                      <span
                        aria-hidden="true"
                        onPointerDown={(e) => startTextGesture(
                          e,
                          "resize",
                          e.currentTarget.parentElement as HTMLElement,
                        )}
                        className="absolute -right-2 -top-2 h-3.5 w-3.5 rounded-full border-2 border-white bg-orange-500 shadow"
                      />
                      <span
                        aria-hidden="true"
                        onPointerDown={(e) => startTextGesture(
                          e,
                          "resize",
                          e.currentTarget.parentElement as HTMLElement,
                        )}
                        className="absolute -bottom-2 -left-2 h-3.5 w-3.5 rounded-full border-2 border-white bg-orange-500 shadow"
                      />
                      <span
                        aria-hidden="true"
                        onPointerDown={(e) => startTextGesture(
                          e,
                          "resize",
                          e.currentTarget.parentElement as HTMLElement,
                        )}
                        className="absolute -bottom-2 -right-2 h-3.5 w-3.5 rounded-full border-2 border-white bg-orange-500 shadow"
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* PLAY CONTROLS DIRECTLY BELOW CANVAS */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-card/95 backdrop-blur-xl border-t border-border">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-gradient-to-b from-orange-400 to-orange-600 text-white flex items-center justify-center shadow-[0_6px_16px_-6px_rgba(249,115,22,0.9)] transition-transform duration-150 ease-out active:scale-90"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <span className="text-[11px] font-bold tabular-nums text-muted-foreground">
                Clip {activeClipIndex + 1}/{clips.length} · {currentClip?.speed}x
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              {[
                { key: "undo", Icon: Undo2, label: "Undo", onClick: handleUndo, disabled: !canUndo },
                { key: "redo", Icon: Redo2, label: "Redo", onClick: handleRedo, disabled: !canRedo },
                { key: "split", Icon: SplitSquareHorizontal, label: "Split clip at playhead", onClick: handleSplit },
                { key: "dup", Icon: Copy, label: "Duplicate clip", onClick: handleDuplicate },
                { key: "del", Icon: Trash2, label: "Delete clip", onClick: handleDelete, danger: true },
              ].map((b) => (
                <button
                  key={b.key}
                  onClick={b.onClick}
                  disabled={b.disabled}
                  aria-label={b.label}
                  className={`grid h-8 w-8 place-items-center rounded-full bg-muted/60 transition-transform duration-150 ease-out active:scale-90 ${
                    b.disabled ? "opacity-35" : b.danger ? "text-destructive" : "text-foreground"
                  }`}
                >
                  <b.Icon size={15} />
                </button>
              ))}
            </div>
          </div>

          {/* HORIZONTAL SCROLLABLE TOOL MENU */}
          <div
            className="flex-shrink-0 bg-card/95 backdrop-blur-xl border-t border-border px-2 py-1.5 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none overscroll-x-contain"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {TOOL_MENU.map((t) => {
              const active = activeToolPanel === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleToolMenu(t.id)}
                  style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
                  className={`flex flex-col items-center justify-center gap-0.5 min-w-[44px] py-1.5 px-1 rounded-2xl text-[8px] font-extrabold uppercase tracking-tight flex-shrink-0 border duration-200 [transition-property:transform,background-color,color,box-shadow] active:scale-90 ${
                    active
                      ? "bg-gradient-to-b from-orange-400 to-orange-600 text-white border-orange-500 shadow-[0_6px_14px_-8px_rgba(249,115,22,0.95)] scale-[1.04]"
                      : "bg-muted/70 text-foreground border-transparent"
                  }`}
                >
                  <t.Icon size={15} />
                  {t.label}
                </button>
              );
            })}
          </div>


          {/* TOOL PANEL */}
          {activeToolPanel !== "NONE" && (
            <div
              key={activeToolPanel}
              className="flex-shrink-0 bg-card/95 backdrop-blur-xl border-t border-border p-3 flex flex-col gap-2"
              style={{ animation: "yw-rise 220ms cubic-bezier(0.22,1,0.36,1) both" }}
            >


              {activeToolPanel === "TRIM" && currentClip && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    Trim clip {activeClipIndex + 1}
                  </span>
                  {(["trimStart", "trimEnd"] as const).map((k) => {
                    const dur = currentClip.duration || 0;
                    const val = k === "trimStart" ? currentClip.trimStart ?? 0 : currentClip.trimEnd ?? dur;
                    return (
                      <label key={k} className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
                        <span className="w-10">{k === "trimStart" ? "Start" : "End"}</span>
                        <input
                          type="range"
                          min={0}
                          max={dur || 1}
                          step={0.05}
                          value={val}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            const s = currentClip.trimStart ?? 0;
                            const en = currentClip.trimEnd ?? dur;
                            if (k === "trimStart") updateCurrentClip("trimStart", Math.min(n, en - 0.2));
                            else updateCurrentClip("trimEnd", Math.max(n, s + 0.2));
                          }}
                          className="flex-1 accent-orange-500"
                        />
                        <span className="w-10 text-right font-mono">{val.toFixed(1)}s</span>
                      </label>
                    );
                  })}
                  <button onClick={handleSplit} className="self-start text-[10px] font-black uppercase text-orange-600">Split at playhead</button>
                </div>
              )}

              {activeToolPanel === "CROP" && currentClip && (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {([
                      { label: "Free", r: null },
                      { label: "9:16", r: 9 / 16 },
                      { label: "4:5", r: 4 / 5 },
                      { label: "1:1", r: 1 },
                      { label: "4:3", r: 4 / 3 },
                      { label: "16:9", r: 16 / 9 },
                    ] as const).map((a) => (
                      <button
                        key={a.label}
                        onClick={() => applyAspect(a.r)}
                        className="px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase border border-border bg-muted text-foreground flex-shrink-0 active:scale-95 transition"
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] font-semibold text-muted-foreground">
                    Drag the box on the video to crop freely.
                  </p>
                  <label className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
                    <Crop size={14} className="text-orange-500" />
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={currentClip.crop ?? 1}
                      onChange={(e) => updateCurrentClip("crop", Number(e.target.value))}
                      className="flex-1 accent-orange-500"
                    />
                    <span className="w-12 text-right font-mono">{(currentClip.crop ?? 1).toFixed(2)}x</span>
                  </label>
                </div>
              )}


              {activeToolPanel === "FILTER" && (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {(["none", "vivid", "noir", "cyber", "warm"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => updateCurrentClip("filter", f)}
                        className={`px-4 py-2 rounded-xl font-bold text-xs uppercase border transition flex-shrink-0 ${
                          currentClip?.filter === f
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-muted text-foreground border-border"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {([
                      ["contrast", "Contrast", 0.6, 1.6, 0.01, currentClip?.contrast ?? 1],
                      ["saturation", "Saturation", 0, 2, 0.01, currentClip?.saturation ?? 1],
                      ["warmth", "Warmth", -1, 1, 0.01, currentClip?.warmth ?? 0],
                      ["grain", "Film grain", 0, 0.18, 0.01, currentClip?.grain ?? 0],
                    ] as const).map(([key, label, min, max, step, value]) => (
                      <label key={key} className="flex min-w-0 items-center gap-2 text-[10px] font-bold text-muted-foreground">
                        <span className="w-14 truncate">{label}</span>
                        <input
                          type="range"
                          min={min}
                          max={max}
                          step={step}
                          value={value}
                          onChange={(e) => updateCurrentClip(key, Number(e.target.value))}
                          className="min-w-0 flex-1 accent-orange-500"
                        />
                        <span className="w-8 text-right font-mono text-foreground">{Number(value).toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeToolPanel === "SPEED" && (
                <div className="flex flex-col gap-3 py-1">
                  <div className="flex items-center gap-3">
                    <Gauge size={15} className="text-orange-500" />
                    <input
                      type="range"
                      min={0.1}
                      max={10}
                      step={0.05}
                      value={currentClip?.speed ?? 1}
                      onChange={(e) => updateCurrentClip("speed", Number(e.target.value))}
                      className="flex-1 accent-orange-500"
                    />
                    <span className="w-12 text-right text-xs font-black tabular-nums">{(currentClip?.speed ?? 1).toFixed(2)}x</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                    {[0.1, 0.25, 0.5, 1, 2, 4, 8, 10].map((s) => (
                      <button
                        key={s}
                        onClick={() => updateCurrentClip("speed", s)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition flex-shrink-0 ${
                          currentClip?.speed === s
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-muted text-foreground border-border"
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Ramp</span>
                    {(["constant", "up", "down"] as const).map((ramp) => (
                      <button
                        key={ramp}
                        onClick={() => updateCurrentClip("speedRamp", ramp)}
                        className={`rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase ${
                          (currentClip?.speedRamp ?? "constant") === ramp
                            ? "border-orange-500 bg-orange-500 text-white"
                            : "border-border bg-muted text-foreground"
                        }`}
                      >
                        {ramp === "constant" ? "Flat" : ramp}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeToolPanel === "STICKER" && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {["Flame", "Spark", "Cool", "Mint", "Audio", "Place", "Care", "Energy"].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateCurrentClip("textOverlay", s)}
                      className="w-11 h-11 flex-shrink-0 rounded-2xl bg-muted text-[10px] font-semibold flex items-center justify-center"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {activeToolPanel === "TEXT" && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTextInput}
                    onChange={(e) => setCustomTextInput(e.target.value)}
                    placeholder="Type text overlay..."
                    className="flex-1 bg-muted border border-border rounded-xl px-4 py-2 text-xs font-bold text-foreground focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      updateCurrentClip("textOverlay", customTextInput);
                      setTextSelected(true);
                      setActiveToolPanel("NONE");
                    }}
                    className="bg-orange-500 text-white px-4 py-2 rounded-xl font-bold text-xs"
                  >
                    Apply
                  </button>
                </div>
              )}

            </div>
          )}

          {/* SINGLE SCROLLABLE CLIP TIMELINE */}
          <div className="flex-shrink-0 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
            <LightTimeline
              clips={clips}
              activeIndex={activeClipIndex}
              currentTime={currentTime}
              totalDuration={totalDuration}
              playFraction={playFraction}
              isPlaying={isPlaying}
              audioLabel={audioTrack?.title}
              audioTrack={audioTrack}
              onAudioChange={(next) => setAudioTrack(next)}
              onAudioRemove={() => setAudioTrack(null)}
              onAddAudio={() => setShowMusicPicker(true)}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
              onSelect={(i) => {
                scrubbingRef.current = false;
                if (scrubTimerRef.current) clearTimeout(scrubTimerRef.current);
                selectClip(i);
              }}
              onTrim={(i, start, end) => {
                const source = clips[i];
                const duration = source?.duration ?? 0;
                const snap = (value: number) => {
                  const points = [0, duration, source?.trimStart ?? 0, source?.trimEnd ?? duration];
                  const nearest = points.reduce((best, point) =>
                    Math.abs(point - value) < Math.abs(best - value) ? point : best,
                  points[0] ?? value);
                  return Math.abs(nearest - value) < 0.12 ? nearest : value;
                };
                const nextStart = snap(start);
                const nextEnd = snap(end);
                if (Math.abs(nextStart - start) > 0.001 || Math.abs(nextEnd - end) > 0.001) {
                  try { navigator.vibrate?.(6); } catch { /* ignore */ }
                }
                setClips((prev) =>
                  prev.map((c, idx) => (idx === i ? { ...c, trimStart: nextStart, trimEnd: nextEnd } : c)),
                );
              }}
              onAdd={() => fileInputRef.current?.click()}
              onReorder={(from, to) => {
                setClips((prev) => {
                  const next = [...prev];
                  const [moved] = next.splice(from, 1);
                  next.splice(to, 0, moved);
                  return next;
                });
                setActiveClipIndex(to);
                toast.success("Clip moved");
              }}
              onScrub={(i, frac) => {
                const v = videoRef.current;
                scrubbingRef.current = true;
                if (scrubTimerRef.current) clearTimeout(scrubTimerRef.current);
                scrubTimerRef.current = setTimeout(() => {
                  scrubbingRef.current = false;
                }, 220);
                if (i !== activeClipIndex) setActiveClipIndex(i);
                const clip = clips[i];
                if (!v || !clip) return;
                const dur = clip.duration || v.duration || 0;
                if (!dur || !isFinite(dur)) return;
                const start = clip.trimStart ?? 0;
                const end = clip.trimEnd ?? dur;
                if (!v.paused) {
                  v.pause();
                  setIsPlaying(false);
                }
                 const rawTarget = Math.min(end, Math.max(start, start + frac * (end - start)));
                 const snapPoints = [start, end];
                 const nearest = snapPoints.reduce((best, point) =>
                   Math.abs(point - rawTarget) < Math.abs(best - rawTarget) ? point : best,
                 rawTarget);
                 const target = Math.abs(nearest - rawTarget) < 0.12 ? nearest : rawTarget;
                 if (target !== rawTarget) {
                   try { navigator.vibrate?.(6); } catch { /* ignore */ }
                 }
                pendingSeekRef.current = target;
                if (seekRafRef.current) return;
                seekRafRef.current = requestAnimationFrame(() => {
                  seekRafRef.current = null;
                  const t = pendingSeekRef.current;
                  if (t == null || !videoRef.current) return;
                  const vid = videoRef.current;
                  if (Math.abs(vid.currentTime - t) < 0.02) return;
                  if (typeof vid.fastSeek === "function") vid.fastSeek(t);
                  else vid.currentTime = t;
                });
              }}
            />
          </div>

          {/* HIDDEN AUDIO ENGINE */}
          <audio ref={audioElRef} src={audioTrack?.url} preload="auto" className="hidden" />

          {/* MUSIC LIBRARY PICKER */}
          {showMusicPicker && (
            <div className="absolute inset-0 z-[60] bg-foreground/30 flex items-end" onClick={() => setShowMusicPicker(false)}>
              <div className="w-full bg-card border-t border-border rounded-t-3xl p-4 max-h-[70%] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground mb-3">Music Library</p>

                {/* CapCut-style music trim: choose which part of the song plays */}
                {audioTrack && (
                  <div className="mb-3 p-3 rounded-2xl bg-muted/70 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black truncate text-foreground">{audioTrack.title}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {fmtSec(audioTrack.clipStart)} → {fmtSec(audioTrack.clipEnd)}
                      </span>
                    </div>

                    <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                      Start in song
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0.2, audioTrack.duration - 0.2)}
                      step={0.1}
                      value={audioTrack.clipStart}
                      onChange={(e) => {
                        const s = Number(e.target.value);
                        setAudioTrack((t) =>
                          t ? { ...t, clipStart: s, clipEnd: Math.max(s + 0.5, t.clipEnd) } : t,
                        );
                      }}
                      className="w-full accent-orange-500 mb-2"
                    />

                    <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                      End in song
                    </label>
                    <input
                      type="range"
                      min={0.2}
                      max={audioTrack.duration}
                      step={0.1}
                      value={audioTrack.clipEnd}
                      onChange={(e) => {
                        const en = Number(e.target.value);
                        setAudioTrack((t) =>
                          t ? { ...t, clipEnd: en, clipStart: Math.min(t.clipStart, en - 0.5) } : t,
                        );
                      }}
                      className="w-full accent-orange-500 mb-2"
                    />

                    <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                      Place at {fmtSec(audioTrack.start)} on video
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0.5, totalDuration)}
                      step={0.1}
                      value={Math.min(audioTrack.start, Math.max(0.5, totalDuration))}
                      onChange={(e) =>
                        setAudioTrack((t) => (t ? { ...t, start: Number(e.target.value) } : t))
                      }
                      className="w-full accent-orange-500"
                    />

                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          const a = audioElRef.current;
                          if (!a || !audioTrack) return;
                          try { a.currentTime = audioTrack.clipStart; } catch { /* ignore */ }
                          void a.play().catch(() => {});
                          window.setTimeout(() => a.pause(), 4000);
                        }}
                        className="flex-1 py-2 rounded-xl bg-orange-500 text-white text-[11px] font-black uppercase"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => setShowMusicPicker(false)}
                        className="flex-1 py-2 rounded-xl bg-card border border-border text-[11px] font-black uppercase text-foreground"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => audioInputRef.current?.click()}
                  className="w-full mb-3 flex items-center gap-3 p-3 rounded-2xl border border-dashed border-orange-500/50 bg-orange-500/10 text-left active:scale-[0.99] transition"
                >
                  <span className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center"><Upload size={16} /></span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-black text-foreground">Upload from device</span>
                    <span className="block text-[10px] text-muted-foreground">Pick any song from your gallery or storage</span>
                  </span>
                </button>
                <div className="flex flex-col gap-2">
                  {NO_COPYRIGHT_MUSIC.map((m) => {
                    const [mm, ss] = m.duration.split(":").map(Number);
                    const secs = (mm || 0) * 60 + (ss || 0);
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setAudioTrack({ id: m.id, title: m.title, url: m.url, start: 0, clipStart: 0, clipEnd: secs, duration: secs });
                          setShowMusicPicker(false);
                          toast.success(`${m.title} added to audio track`);
                        }}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-muted text-left active:scale-[0.99] transition"
                      >
                        <span className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-600 flex items-center justify-center"><Music size={16} /></span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-xs font-bold truncate text-foreground">{m.title}</span>
                          <span className="block text-[10px] text-muted-foreground truncate">{m.artist} · {m.category}</span>
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">{m.duration}</span>
                      </button>
                    );
                  })}
                  {audioTrack && (
                    <button
                      onClick={() => { setAudioTrack(null); setShowMusicPicker(false); }}
                      className="p-3 rounded-2xl bg-destructive/10 text-destructive text-xs font-bold"
                    >
                      Remove audio track
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
