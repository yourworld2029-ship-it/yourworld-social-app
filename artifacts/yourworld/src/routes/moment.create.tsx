import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { registerBlob, unregisterBlob } from "@/lib/blob-registry";
import { NO_COPYRIGHT_MUSIC } from "@/components/yw/MusicVault";
import {
  X,
  RefreshCw,
  Zap,
  ZapOff,
  Music,
  Image as ImageIcon,
  Moon,
  Grid3X3,
  Timer,
  Download,
  Star,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Camera,
  Check,
  Lock,
  Users,
  Globe2,
  MessageCircle,
  Heart,
  Archive,
  MapPin,
  Share2,
  RotateCcw,
  Type,
  Pencil,
  Smile,
  Scissors,
  Link2,
  Sparkles,
  Crop,
  Undo2,
  Redo2,
  Sun,
  Contrast,
  Palette,
  Volume2,
  VolumeX,
  Play,
  Pause,
} from "lucide-react";
import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import { useMoments } from "@/lib/moment-context";
import { useUploads } from "@/lib/upload-progress";
import { splitMomentIntoParts } from "@/lib/moment-parts";
import { adaptiveCameraCaptureAttempts } from "@/lib/adaptive-performance";
import { useAuth } from "@/lib/auth-store";
import { ProfileAvatar } from "@/components/yw/ProfileAvatar";

export const Route = createFileRoute("/moment/create")({
  component: MomentCreatePage,
});

type CameraFacing = "user" | "environment";

type TextLayer = {
  id: number;
  text: string;
  x: number; // %
  y: number; // %
  size: number;
  rotation: number;
  color: string;
};

type MediaTransform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

const clamp01 = (v: number) =>
  Math.min(1, Math.max(0, v));

/** Moments are published in chunks of at most this many seconds. */

const fmtTime = (s: number) => {
  const total = Math.max(0, Math.floor(s || 0));
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
};

/** Reads the duration of a video url (0 when unknown). */
const readVideoDuration = (
  url: string
) =>
  new Promise<number>(
    (resolve) => {
      const probe =
        document.createElement(
          "video"
        );
      probe.preload = "metadata";
      probe.muted = true;
      const done = (v: number) =>
        resolve(
          Number.isFinite(v) &&
          v > 0
            ? v
            : 0
        );
      probe.onloadedmetadata = () =>
        done(probe.duration);
      probe.onerror = () => done(0);
      probe.src = url;
    }
  );

type CaptureMode = "photo" | "video";
type Audience =
  | "everyone"
  | "followers"
  | "close_friends"
  | "only_me";

type FilterName =
  | "normal"
  | "vivid"
  | "warm"
  | "cool"
  | "mono"
  | "dramatic"
  | "fade"
  | "dream";

type CropRatio =
  | "original"
  | "9:16"
  | "4:5"
  | "1:1";

const FILTERS: Record<
  FilterName,
  {
    name: string;
    css: string;
  }
> = {
  normal: {
    name: "Normal",
    css: "",
  },
  vivid: {
    name: "Vivid",
    css: "saturate(1.45) contrast(1.08)",
  },
  warm: {
    name: "Warm",
    css: "sepia(.16) saturate(1.25) hue-rotate(-8deg)",
  },
  cool: {
    name: "Cool",
    css: "saturate(.95) hue-rotate(12deg) contrast(1.05)",
  },
  mono: {
    name: "Mono",
    css: "grayscale(1) contrast(1.1)",
  },
  dramatic: {
    name: "Drama",
    css: "contrast(1.35) saturate(1.15)",
  },
  fade: {
    name: "Fade",
    css: "contrast(.9) saturate(.8) brightness(1.08)",
  },
  dream: {
    name: "Dream",
    css: "brightness(1.08) saturate(1.15) contrast(.92)",
  },
};

function MomentCreatePage() {
  const navigate = useNavigate();
  const { addMoment } = useMoments();
  const { startUpload } = useUploads();
  const { user } = useAuth();

  // =====================================================
  // CAMERA REFS
  // =====================================================

  const videoRef =
    useRef<HTMLVideoElement>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const captureCanvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    );

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const recordedChunksRef =
    useRef<Blob[]>([]);

  const imageInputRef =
    useRef<HTMLInputElement>(null);

  const audioInputRef =
    useRef<HTMLInputElement>(null);

  const drawingCanvasRef =
    useRef<HTMLCanvasElement>(null);

  const pinchStartDistance =
    useRef<number | null>(null);

  // =====================================================
  // CAMERA STATE
  // =====================================================

  const [facingMode, setFacingMode] =
    useState<CameraFacing>("user");

  const [captureMode, setCaptureMode] =
    useState<CaptureMode>("photo");

  const [cameraReady, setCameraReady] =
    useState(false);

  const [cameraError, setCameraError] =
    useState("");

  const [isRecording, setIsRecording] =
    useState(false);

  const [recordingSeconds, setRecordingSeconds] =
    useState(0);

  const [isFlashOn, setIsFlashOn] =
    useState(false);

  const [isGridOn, setIsGridOn] =
    useState(false);

  const [isNightMode, setIsNightMode] =
    useState(false);

  const [zoom, setZoom] =
    useState(1);

  const [maxZoom, setMaxZoom] =
    useState(1);

  const [timerSeconds, setTimerSeconds] =
    useState<number | null>(null);

  const [timerRunning, setTimerRunning] =
    useState(false);

  const [qualityLabel, setQualityLabel] =
    useState("AUTO");

  const [, setCameraResolution] =
    useState("");

  // =====================================================
  // MEDIA
  // =====================================================

  const [step, setStep] =
    useState<0 | 1 | 2>(0);

  const [mediaUrl, setMediaUrl] =
    useState<string | null>(null);

  const [, setMediaBlob] =
    useState<Blob | null>(null);

  const [isVideo, setIsVideo] =
    useState(false);

  // =====================================================
  // EDITOR
  // =====================================================

  const [selectedFilter, setSelectedFilter] =
    useState<FilterName>("normal");

  const [brightness, setBrightness] =
    useState(100);

  const [contrast, setContrast] =
    useState(100);

  const [saturation, setSaturation] =
    useState(100);

  const [cropRatio, setCropRatio] =
    useState<CropRatio>("original");

  const [videoSpeed, setVideoSpeed] =
    useState(1);

  const [videoMuted, setVideoMuted] =
    useState(false);

  const [selectedAudio, setSelectedAudio] =
    useState<string | null>(null);

  const [musicTitle, setMusicTitle] =
    useState<string | null>(null);

  const [musicArtist, setMusicArtist] =
    useState<string | null>(null);

  const [audioUrl, setAudioUrl] =
    useState<string | null>(null);

  const [audioDuration, setAudioDuration] =
    useState(0);

  const [audioStart, setAudioStart] =
    useState(0);

  const [audioEnd, setAudioEnd] =
    useState(0);

  const [audioVolume, setAudioVolume] =
    useState(0.8);

  const [audioPlaying, setAudioPlaying] =
    useState(false);

  const [audioSegmentLength] =
    useState<15 | 30>(30);

  const [showMusicLibrary, setShowMusicLibrary] =
    useState(false);
  const [showMusicPanel, setShowMusicPanel] =
    useState(false);
  const [panel, setPanel] =
    useState<null | "sticker" | "filter">(null);
  const [showFinalPreview, setShowFinalPreview] =
    useState(false);
  const [renderedPreviewUrl, setRenderedPreviewUrl] =
    useState<string | null>(null);
  const [renderedMediaUrl, setRenderedMediaUrl] =
    useState<string | null>(null);
  const [isRenderingPreview, setIsRenderingPreview] =
    useState(false);
  const [photoSeconds, setPhotoSeconds] =
    useState(15);



  const previewAudioRef =
    useRef<HTMLAudioElement | null>(null);

  const [caption, setCaption] =
    useState("");

  // =====================================================
  // TEXT
  // =====================================================

  const [overlayText, setOverlayText] =
    useState("");

  const [showTextInput, setShowTextInput] =
    useState(false);

  const [textColor, setTextColor] =
    useState("#ffffff");

  const [textSize, setTextSize] =
    useState(28);

  const [textX, setTextX] =
    useState(50);

  const [textY, setTextY] =
    useState(45);

  const [textLayers, setTextLayers] =
    useState<TextLayer[]>([]);

  const [activeTextId, setActiveTextId] =
    useState<number | null>(null);

  const frameRef =
    useRef<HTMLDivElement>(null);

  const mediaTransformRef =
    useRef<MediaTransform>({
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
    });

  const mediaPointersRef =
    useRef<Map<number, { x: number; y: number }>>(
      new Map(),
    );

  const mediaGestureRef =
    useRef<{
      startTransform: MediaTransform;
      startCenter: { x: number; y: number };
      startDistance: number;
      startAngle: number;
    } | null>(null);

  const guideTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const hapticGuideRef =
    useRef({ vertical: false, horizontal: false });

  const [mediaTransform, setMediaTransform] =
    useState<MediaTransform>({
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
    });

  const [snapGuides, setSnapGuides] =
    useState({ vertical: false, horizontal: false });

  const [isMediaTransforming, setIsMediaTransforming] =
    useState(false);

  const [editorTimeLabel, setEditorTimeLabel] =
    useState("Now");

  const updateActiveText = (
    patch: Partial<TextLayer>
  ) =>
    setTextLayers((items) =>
      items.map((item) =>
        item.id === activeTextId
          ? { ...item, ...patch }
          : item
      )
    );

  // =====================================================
  // STICKERS
  // =====================================================

  const [stickers, setStickers] =
    useState<
      {
        id: number;
        emoji: string;
        x: number;
        y: number;
        size: number;
      }[]
    >([]);

  // =====================================================
  // DRAWING
  // =====================================================

  const [drawMode, setDrawMode] =
    useState(false);

  const [drawColor, setDrawColor] =
    useState("#ffffff");

  const [drawSize, setDrawSize] =
    useState(6);

  const drawingHistory =
    useRef<ImageData[]>([]);

  const drawingHistoryIndex =
    useRef(-1);

  const isDrawing =
    useRef(false);

  const userMetadata =
    (user?.user_metadata ?? {}) as Record<string, unknown>;

  const editorName =
    (typeof userMetadata.full_name === "string"
      ? userMetadata.full_name
      : typeof userMetadata.name === "string"
        ? userMetadata.name
        : typeof userMetadata.username === "string"
          ? userMetadata.username
          : null) || "Sandeep Poonia";

  const editorUsername =
    (typeof userMetadata.username === "string"
      ? userMetadata.username
      : typeof user?.email === "string"
        ? user.email.split("@")[0]
        : null) || "yourworld";

  const editorAvatarUrl =
    typeof userMetadata.avatar_url === "string"
      ? userMetadata.avatar_url
      : typeof userMetadata.profile_pic === "string"
        ? userMetadata.profile_pic
        : typeof userMetadata.profile_image === "string"
          ? userMetadata.profile_image
          : null;

  useEffect(() => {
    if (step !== 1) return;
    setEditorTimeLabel(
      new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date()),
    );
  }, [step]);

  const updateMediaTransform = (
    next: MediaTransform,
    options?: { snap?: boolean },
  ) => {
    const snap = options?.snap !== false;
    const scale = Math.min(5, Math.max(0.3, next.scale));
    const snapDistance = 16;
    const snappedX =
      snap && Math.abs(next.x) <= snapDistance ? 0 : next.x;
    const snappedY =
      snap && Math.abs(next.y) <= snapDistance ? 0 : next.y;
    const nextTransform = {
      x: snappedX,
      y: snappedY,
      scale,
      rotation: next.rotation,
    };

    mediaTransformRef.current = nextTransform;
    setMediaTransform(nextTransform);

    const vertical = snap && Math.abs(next.x) <= snapDistance;
    const horizontal = snap && Math.abs(next.y) <= snapDistance;
    setSnapGuides({ vertical, horizontal });

    if (vertical && !hapticGuideRef.current.vertical) {
      navigator.vibrate?.(8);
    }
    if (horizontal && !hapticGuideRef.current.horizontal) {
      navigator.vibrate?.(8);
    }
    hapticGuideRef.current = { vertical, horizontal };
  };

  const getPointerCenter = (
    points: { x: number; y: number }[],
  ) => {
    const total = points.reduce(
      (result, point) => ({
        x: result.x + point.x,
        y: result.y + point.y,
      }),
      { x: 0, y: 0 },
    );
    return {
      x: total.x / Math.max(1, points.length),
      y: total.y / Math.max(1, points.length),
    };
  };

  const getPointerDistance = (
    points: { x: number; y: number }[],
  ) => {
    const [a, b] = points;
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  const getPointerAngle = (
    points: { x: number; y: number }[],
  ) => {
    const [a, b] = points;
    return a && b ? Math.atan2(b.y - a.y, b.x - a.x) : 0;
  };

  const handleMediaPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (drawMode) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    mediaPointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    const points = [...mediaPointersRef.current.values()];
    const center = getPointerCenter(points);
    mediaGestureRef.current = {
      startTransform: mediaTransformRef.current,
      startCenter: center,
      startDistance: Math.max(1, getPointerDistance(points)),
      startAngle: getPointerAngle(points),
    };
    setIsMediaTransforming(true);
  };

  const handleMediaPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!mediaPointersRef.current.has(event.pointerId)) return;
    const gesture = mediaGestureRef.current;
    if (!gesture) return;

    event.preventDefault();
    mediaPointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    const points = [...mediaPointersRef.current.values()];
    const center = getPointerCenter(points);
    const dx = center.x - gesture.startCenter.x;
    const dy = center.y - gesture.startCenter.y;
    const next: MediaTransform = {
      ...gesture.startTransform,
      x: gesture.startTransform.x + dx,
      y: gesture.startTransform.y + dy,
    };

    if (points.length >= 2) {
      next.scale =
        gesture.startTransform.scale *
        (getPointerDistance(points) / gesture.startDistance);
      next.rotation =
        gesture.startTransform.rotation +
        ((getPointerAngle(points) - gesture.startAngle) * 180) /
          Math.PI;
    }

    updateMediaTransform(next);
  };

  const handleMediaPointerUp = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    mediaPointersRef.current.delete(event.pointerId);

    const remaining = [...mediaPointersRef.current.values()];
    if (remaining.length) {
      mediaGestureRef.current = {
        startTransform: mediaTransformRef.current,
        startCenter: getPointerCenter(remaining),
        startDistance: 1,
        startAngle: 0,
      };
      return;
    }

    mediaGestureRef.current = null;
    setIsMediaTransforming(false);
    if (guideTimerRef.current) clearTimeout(guideTimerRef.current);
    guideTimerRef.current = setTimeout(() => {
      setSnapGuides({ vertical: false, horizontal: false });
    }, 700);
  };

  const resetMediaTransform = () => {
    updateMediaTransform(
      { x: 0, y: 0, scale: 1, rotation: 0 },
      { snap: false },
    );
    setSnapGuides({ vertical: false, horizontal: false });
  };

  // =====================================================
  // SHARE
  // =====================================================

  const [audience, setAudience] =
    useState<Audience>("everyone");

  const [duration, setDuration] =
    useState<12 | 24 | 48>(24);

  const [allowPoll, setAllowPoll] =
    useState(false);

  const [screenshotAlert, setScreenshotAlert] =
    useState(true);

  const [allowDownloads, setAllowDownloads] =
    useState(true);

  const [saveToArchive, setSaveToArchive] =
    useState(true);

  const [allowReplies, setAllowReplies] =
    useState(true);

  const [allowReactions, setAllowReactions] =
    useState(true);

  const [showLocation, setShowLocation] =
    useState(false);

  const [allowSharing, setAllowSharing] =
    useState(true);

  // =====================================================
  // CAMERA CAPABILITIES
  // =====================================================

  const getVideoTrack = () => {
    return (
      streamRef.current
        ?.getVideoTracks()[0] || null
    );
  };

  const getCapabilities = useCallback(() => {
    const track = getVideoTrack();

    if (!track) return null;

    try {
      if (
        typeof track.getCapabilities !==
        "function"
      ) {
        return null;
      }

      return track.getCapabilities() as MediaTrackCapabilities & {
        zoom?: {
          min?: number;
          max?: number;
          step?: number;
        };
      };
    } catch {
      return null;
    }
  }, []);

  // =====================================================
  // START CAMERA
  // =====================================================

  const startCamera = useCallback(async () => {
    setCameraReady(false);
    setCameraError("");

    try {
      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Camera is not supported by this browser."
        );
      }

      const requests = adaptiveCameraCaptureAttempts(facingMode);

      let stream: MediaStream | null =
        null;

      for (const constraints of requests) {
        try {
          stream =
            await navigator.mediaDevices.getUserMedia(
              constraints
            );

          if (stream) break;
        } catch {
          continue;
        }
      }

      if (!stream) {
        throw new Error(
          "Camera permission denied or camera unavailable."
        );
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject =
          stream;

        await videoRef.current
          .play()
          .catch(() => {});
      }

      const track =
        stream.getVideoTracks()[0];

      const settings =
        track.getSettings();

      const width =
        settings.width || 0;

      const height =
        settings.height || 0;

      if (width && height) {
        setCameraResolution(
          `${width} × ${height}`
        );

        if (
          width >= 3840 ||
          height >= 2160
        ) {
          setQualityLabel("4K");
        } else if (
          width >= 1920 ||
          height >= 1080
        ) {
          setQualityLabel("1080P");
        } else if (
          width >= 1280 ||
          height >= 720
        ) {
          setQualityLabel("HD");
        } else {
          setQualityLabel("AUTO");
        }
      }

      const capabilities =
        getCapabilities();

      const zoomCapability =
        capabilities?.zoom;

      if (
        zoomCapability &&
        typeof zoomCapability ===
          "object"
      ) {
        const z =
          zoomCapability as {
            min?: number;
            max?: number;
          };

        setMaxZoom(z.max || 1);
        setZoom(z.min || 1);
      } else {
        setMaxZoom(1);
        setZoom(1);
      }

      setCameraReady(true);
    } catch (error) {
      console.error(error);

      setCameraError(
        error instanceof Error
          ? error.message
          : "Unable to start camera."
      );
    }
  }, [facingMode, getCapabilities]);

  useEffect(() => {
    if (step !== 0) return;

    startCamera();

    return () => {
      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    };
  }, [facingMode, startCamera, step]);

  // =====================================================
  // ZOOM
  // =====================================================

  const applyZoom = async (
    value: number
  ) => {
    const track = getVideoTrack();

    if (!track) return;

    const capabilities =
      getCapabilities();

    if (!capabilities?.zoom) return;

    try {
      const z =
        capabilities.zoom as {
          min?: number;
          max?: number;
        };

      const min = z.min || 1;
      const max = z.max || 1;

      const next = Math.max(
        min,
        Math.min(max, value)
      );

      await track.applyConstraints({
        advanced: [
          {
            zoom: next,
          } as MediaTrackConstraintSet,
        ],
      });

      setZoom(next);
    } catch {
      // Device does not support zoom.
    }
  };

  const getTouchDistance = (
    touches: React.TouchList
  ) => {
    if (touches.length < 2) return null;

    const a = touches[0];
    const b = touches[1];

    const dx =
      a.clientX - b.clientX;

    const dy =
      a.clientY - b.clientY;

    return Math.sqrt(
      dx * dx + dy * dy
    );
  };

  const handlePinchStart = (
    event: React.TouchEvent
  ) => {
    const distance =
      getTouchDistance(
        event.touches
      );

    if (distance) {
      pinchStartDistance.current =
        distance;
    }
  };

  const handlePinchMove = (
    event: React.TouchEvent
  ) => {
    const current =
      getTouchDistance(
        event.touches
      );

    if (
      !current ||
      !pinchStartDistance.current
    ) {
      return;
    }

    const difference =
      current -
      pinchStartDistance.current;

    applyZoom(
      zoom + difference / 180
    );

    pinchStartDistance.current =
      current;
  };

  const handlePinchEnd = () => {
    pinchStartDistance.current =
      null;
  };

  // =====================================================
  // FLASH
  // =====================================================

  const toggleFlash = async () => {
    const track = getVideoTrack();

    if (!track) return;

    const capabilities =
      getCapabilities();

    if (
      !capabilities ||
      !("torch" in capabilities)
    ) {
      return;
    }

    try {
      await track.applyConstraints({
        advanced: [
          {
            torch: !isFlashOn,
          } as MediaTrackConstraintSet,
        ],
      });

      setIsFlashOn(
        (value) => !value
      );
    } catch {
      console.log(
        "Torch unavailable"
      );
    }
  };

  // =====================================================
  // PHOTO
  // =====================================================

  const performPhotoCapture = () => {
    const video =
      videoRef.current;

    if (!video) return;

    const width =
      video.videoWidth || 1280;

    const height =
      video.videoHeight || 720;

    // Reused offscreen canvas + desynchronized 2D context:
    // no per-shot allocation, GPU-friendly, zero shutter lag.
    const canvas =
      captureCanvasRef.current ||
      document.createElement(
        "canvas"
      );

    captureCanvasRef.current =
      canvas;

    if (canvas.width !== width)
      canvas.width = width;

    if (canvas.height !== height)
      canvas.height = height;

    const ctx =
      canvas.getContext("2d", {
        alpha: false,
        desynchronized: true,
        willReadFrequently: false,
      }) as CanvasRenderingContext2D | null;

    if (!ctx) return;

    ctx.setTransform(
      1,
      0,
      0,
      1,
      0,
      0
    );

    if (facingMode === "user") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(
      video,
      0,
      0,
      width,
      height
    );

    canvas.toBlob(
      (blob: Blob | null) => {
        if (!blob) return;

        const url =
          URL.createObjectURL(blob);

        registerBlob(url, blob);
        setMediaBlob(blob);
        setMediaUrl(url);
        setIsVideo(false);
        resetEditor();
        setStep(1);
      },
      "image/jpeg",
      0.92
    );
  };

  const capturePhoto = () => {
    if (timerRunning) return;

    if (!timerSeconds) {
      performPhotoCapture();
      return;
    }

    setTimerRunning(true);

    window.setTimeout(() => {
      performPhotoCapture();
      setTimerRunning(false);
    }, timerSeconds * 1000);
  };

  // =====================================================
  // VIDEO RECORDING
  // =====================================================

  const getMimeType = () => {
    // Hardware-encoded codecs first (H.264 / VP8) so recording never
    // hits the slow software VP9 path and drops frames.
    const types = [
      "video/mp4;codecs=h264,aac",
      "video/webm;codecs=h264,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];

    return (
      types.find((type) =>
        MediaRecorder.isTypeSupported(
          type
        )
      ) || ""
    );
  };

  const startRecording = () => {
    const stream =
      streamRef.current;

    if (
      !stream ||
      isRecording
    ) {
      return;
    }

    try {
      recordedChunksRef.current =
        [];

      const mimeType =
        getMimeType();

      const recorder = mimeType
        ? new MediaRecorder(stream, {
            mimeType,
            // 720p60 sweet spot: crisp, but light enough for
            // real-time hardware encoding with zero dropped frames.
            videoBitsPerSecond:
              6_000_000,
            audioBitsPerSecond:
              128_000,
          })
        : new MediaRecorder(
            stream
          );

      recorder.ondataavailable = (
        event
      ) => {
        if (
          event.data.size > 0
        ) {
          recordedChunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onstop = () => {
        const blob =
          new Blob(
            recordedChunksRef.current,
            {
              type:
                mimeType ||
                "video/webm",
            }
          );

        const url =
          URL.createObjectURL(
            blob
          );

        registerBlob(url, blob);
        setMediaBlob(blob);
        setMediaUrl(url);
        setIsVideo(true);
        resetEditor();
        setStep(1);
        setRecordingSeconds(0);
      };

      mediaRecorderRef.current =
        recorder;

      // Fewer, larger chunks = fewer main-thread interruptions.
      recorder.start(1000);

      setIsRecording(true);
      setRecordingSeconds(0);
    } catch (error) {
      console.error(
        "Recording failed",
        error
      );
    }
  };

  const stopRecording = () => {
    const recorder =
      mediaRecorderRef.current;

    if (!recorder) return;

    if (
      recorder.state !==
      "inactive"
    ) {
      recorder.stop();
    }

    setIsRecording(false);
  };

  useEffect(() => {
    if (!isRecording) return;

    const interval =
      window.setInterval(() => {
        setRecordingSeconds(
          (seconds) =>
            seconds + 1
        );
      }, 1000);

    return () =>
      window.clearInterval(
        interval
      );
  }, [isRecording]);

  const handleShutter = () => {
    if (
      captureMode === "photo"
    ) {
      capturePhoto();
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };

  // =====================================================
  // GALLERY
  // =====================================================

  const handleMediaUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith(
        "image/"
      ) &&
      !file.type.startsWith(
        "video/"
      )
    ) {
      return;
    }

    const url =
      URL.createObjectURL(file);

    registerBlob(url, file);
    setMediaBlob(file);
    setMediaUrl(url);
    setIsVideo(
      file.type.startsWith(
        "video/"
      )
    );

    resetEditor();
    setStep(1);

    event.target.value = "";
  };

  // =====================================================
  // AUDIO
  // =====================================================

  const handleAudioUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    const url =
      URL.createObjectURL(file);
    registerBlob(url, file);

    if (audioUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(audioUrl);
      unregisterBlob(audioUrl);
    }

    const title = file.name.replace(/\.[^.]+$/, "");
    setAudioUrl(url);
    setSelectedAudio(title);
    setMusicTitle(title);
    setMusicArtist(null);
    setAudioDuration(0);
    setAudioStart(0);
    setAudioEnd(0);
    setShowMusicPanel(true);

    // probe real duration so the trimmer can show the full track
    const probe = new Audio();
    probe.preload = "metadata";
    probe.src = url;
    probe.onloadedmetadata = () => {
      const dur =
        Number.isFinite(
          probe.duration
        ) && probe.duration > 0
          ? probe.duration
          : 0;
      setAudioDuration(dur);
      setAudioStart(0);
      setAudioEnd(
        Math.min(dur, audioSegmentLength) || dur
      );
    };

    event.target.value = "";
  };

  const previewAudioAt = (time: number, play = true) => {
    const el = previewAudioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, time);
    el.volume = audioVolume;
    if (play) {
      void el.play().then(() => setAudioPlaying(true)).catch(() => {});
    }
  };

  const moveAudioWindow = (nextStart: number, length = audioSegmentLength) => {
    if (!audioDuration) return;
    const segmentLength = Math.min(length, audioDuration);
    const maxStart = Math.max(0, audioDuration - segmentLength);
    const start = Math.min(maxStart, Math.max(0, nextStart));
    setAudioStart(start);
    setAudioEnd(start + segmentLength);
    previewAudioAt(start);
  };

  const removeAudio = () => {
    if (audioUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(audioUrl);
      unregisterBlob(audioUrl);
    }
    setAudioUrl(null);
    setSelectedAudio(null);
    setMusicTitle(null);
    setMusicArtist(null);
    setAudioDuration(0);
    setAudioStart(0);
    setAudioEnd(0);
    setAudioPlaying(false);
    setShowMusicPanel(false);
  };

  const toggleAudioPreview = () => {
    const el = previewAudioRef.current;
    if (!el) return;
    if (el.paused) {
      el.currentTime = audioStart;
      el.volume = audioVolume;
      void el.play().catch(() => {});
      setAudioPlaying(true);
    } else {
      el.pause();
      setAudioPlaying(false);
    }
  };

  // =====================================================
  // EDITOR RESET
  // =====================================================

  const resetEditor = () => {
    setSelectedFilter("normal");
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setCropRatio("original");
    resetMediaTransform();
    setVideoSpeed(1);
    setVideoMuted(false);
    setOverlayText("");
    setCaption("");
    setStickers([]);
    setDrawMode(false);
    setTextLayers([]);
    setActiveTextId(null);

    clearDrawing();
  };

  // =====================================================
  // FILTER STYLE
  // =====================================================

  const getMediaStyle =
    (): React.CSSProperties => {
      const filter =
        FILTERS[selectedFilter]
          .css;

      return {
        filter: `${filter} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
        willChange: "filter",
        backfaceVisibility: "hidden",
        transition: "filter .15s linear",
      };
    };

  const getMediaTransformStyle =
    (): React.CSSProperties => ({
      transform: `translate3d(${mediaTransform.x}px, ${mediaTransform.y}px, 0) scale(${mediaTransform.scale}) rotate(${mediaTransform.rotation}deg)`,
      transformOrigin: "center center",
      willChange: "transform",
      transition: isMediaTransforming
        ? "none"
        : "transform 180ms cubic-bezier(.22,1,.36,1)",
    });

  const getMediaRenderTransform =
    (): React.CSSProperties => ({
      ...getMediaStyle(),
      ...getMediaTransformStyle(),
    });

  // =====================================================
  // FREEFORM TRANSFORM
  // =====================================================

  const getTransformLabel = () => {
    const scale = mediaTransform.scale.toFixed(1);
    const rotationValue = Math.round(
      ((mediaTransform.rotation % 360) + 360) % 360,
    );
    return `${scale}× · ${rotationValue}°`;
  };

  // =====================================================
  // TEXT
  // =====================================================

  const addText = () => {
    setShowTextInput(true);

    const layer: TextLayer = {
      id: Date.now(),
      text: "YourWorld",
      x: 50,
      y: 45,
      size: 28,
      rotation: 0,
      color: textColor,
    };

    setTextLayers((items) => [
      ...items,
      layer,
    ]);

    setActiveTextId(layer.id);
    setOverlayText(layer.text);
  };

  // =====================================================
  // STICKERS
  // =====================================================

  const addSticker = (
    emoji: string
  ) => {
    setStickers((items) => [
      ...items,
      {
        id: Date.now(),
        emoji,
        x: 50,
        y: 55,
        size: 55,
      },
    ]);
  };

  const removeSticker = (
    id: number
  ) => {
    setStickers((items) =>
      items.filter(
        (item) =>
          item.id !== id
      )
    );
  };

  // =====================================================
  // DRAWING
  // =====================================================

  const setupDrawingCanvas = useCallback(() => {
    const canvas =
      drawingCanvasRef.current;

    if (!canvas) return;

    const parent =
      canvas.parentElement;

    if (!parent) return;

    canvas.width =
      parent.clientWidth;

    canvas.height =
      parent.clientHeight;

    clearDrawing();
  }, []);

  const saveDrawingState = () => {
    const canvas =
      drawingCanvasRef.current;

    if (!canvas) return;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) return;

    const data =
      ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

    drawingHistory.current =
      drawingHistory.current.slice(
        0,
        drawingHistoryIndex.current +
          1
      );

    drawingHistory.current.push(
      data
    );

    drawingHistoryIndex.current =
      drawingHistory.current.length -
      1;
  };

  const clearDrawing = () => {
    const canvas =
      drawingCanvasRef.current;

    if (!canvas) return;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) return;

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    drawingHistory.current = [];
    drawingHistoryIndex.current =
      -1;
  };

  const getPointerPosition = (
    event:
      | React.MouseEvent
      | React.TouchEvent
  ) => {
    const canvas =
      drawingCanvasRef.current;

    if (!canvas) {
      return {
        x: 0,
        y: 0,
      };
    }

    const rect =
      canvas.getBoundingClientRect();

    const clientX =
      "touches" in event
        ? event.touches[0]?.clientX
        : event.clientX;

    const clientY =
      "touches" in event
        ? event.touches[0]?.clientY
        : event.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (
    event:
      | React.MouseEvent
      | React.TouchEvent
  ) => {
    if (!drawMode) return;

    event.preventDefault();

    const canvas =
      drawingCanvasRef.current;

    if (!canvas) return;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) return;

    const position =
      getPointerPosition(event);

    ctx.beginPath();

    ctx.moveTo(
      position.x,
      position.y
    );

    ctx.lineWidth = drawSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle =
      drawColor;

    isDrawing.current = true;
  };

  const draw = (
    event:
      | React.MouseEvent
      | React.TouchEvent
  ) => {
    if (
      !drawMode ||
      !isDrawing.current
    ) {
      return;
    }

    event.preventDefault();

    const canvas =
      drawingCanvasRef.current;

    if (!canvas) return;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) return;

    const position =
      getPointerPosition(event);

    ctx.lineTo(
      position.x,
      position.y
    );

    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing.current)
      return;

    isDrawing.current = false;

    saveDrawingState();
  };

  const undoDrawing = () => {
    const canvas =
      drawingCanvasRef.current;

    if (!canvas) return;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) return;

    if (
      drawingHistoryIndex.current <=
      0
    ) {
      clearDrawing();
      return;
    }

    drawingHistoryIndex.current--;

    const data =
      drawingHistory.current[
        drawingHistoryIndex.current
      ];

    ctx.putImageData(
      data,
      0,
      0
    );
  };

  const redoDrawing = () => {
    const canvas =
      drawingCanvasRef.current;

    if (!canvas) return;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) return;

    if (
      drawingHistoryIndex.current >=
      drawingHistory.current.length -
        1
    ) {
      return;
    }

    drawingHistoryIndex.current++;

    const data =
      drawingHistory.current[
        drawingHistoryIndex.current
      ];

    ctx.putImageData(
      data,
      0,
      0
    );
  };

  useEffect(() => {
    if (step !== 1) return;

    const timer =
      window.setTimeout(() => {
        setupDrawingCanvas();
      }, 100);

    return () =>
      window.clearTimeout(
        timer
      );
  }, [setupDrawingCanvas, step]);

  // =====================================================
  // VIDEO EFFECTS
  // =====================================================

  useEffect(() => {
    const video =
      document.querySelector(
        "video[data-editor-video]"
      ) as HTMLVideoElement | null;

    if (!video || !isVideo) return;

    video.playbackRate =
      videoSpeed;

    video.muted =
      videoMuted;
  }, [
    videoSpeed,
    videoMuted,
    isVideo,
    mediaUrl,
  ]);

  const drawEditorFrame = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    pixelRatio: number,
    source: CanvasImageSource,
    sourceWidth: number,
    sourceHeight: number,
  ) => {
    const fit = Math.min(width / sourceWidth, height / sourceHeight);
    const mediaWidth = sourceWidth * fit;
    const mediaHeight = sourceHeight * fit;
    const transform = mediaTransformRef.current;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width * pixelRatio, height * pixelRatio);
    ctx.scale(pixelRatio, pixelRatio);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(
      width / 2 + transform.x,
      height / 2 + transform.y,
    );
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.scale(transform.scale, transform.scale);
    ctx.filter = `${FILTERS[selectedFilter].css} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(
      source,
      -mediaWidth / 2,
      -mediaHeight / 2,
      mediaWidth,
      mediaHeight,
    );
    ctx.restore();
    ctx.filter = "none";

    const drawing = drawingCanvasRef.current;
    if (drawing) {
      ctx.drawImage(drawing, 0, 0, width, height);
    }

    textLayers.forEach((layer) => {
      ctx.save();
      ctx.translate(
        (layer.x / 100) * width,
        (layer.y / 100) * height,
      );
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.font = `900 ${layer.size}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,.72)";
      ctx.shadowBlur = 8;
      ctx.fillStyle = layer.color;
      ctx.fillText(layer.text || " ", 0, 0);
      ctx.restore();
    });

    stickers.forEach((sticker) => {
      ctx.save();
      ctx.translate(
        (sticker.x / 100) * width,
        (sticker.y / 100) * height,
      );
      ctx.font = `${sticker.size}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sticker.emoji, 0, 0);
      ctx.restore();
    });

    if (caption) {
      ctx.font = "600 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const captionY = height - 30;
      ctx.fillStyle = "rgba(0,0,0,.62)";
      ctx.fillRect(16, captionY - 18, width - 32, 36);
      ctx.fillStyle = "#fff";
      ctx.fillText(caption, width / 2, captionY);
    }
  };

  const renderEditorToCanvas = async () => {
    if (!mediaUrl || !frameRef.current) return null;

    const frame = frameRef.current.getBoundingClientRect();
    const width = Math.max(1, frame.width);
    const height = Math.max(1, frame.height);
    const pixelRatio = Math.min(3, window.devicePixelRatio || 2);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    let source: CanvasImageSource;
    let sourceWidth = 0;
    let sourceHeight = 0;

    if (isVideo) {
      const video = document.querySelector(
        "video[data-editor-video]",
      ) as HTMLVideoElement | null;
      if (!video || !video.videoWidth || !video.videoHeight) return null;
      source = video;
      sourceWidth = video.videoWidth;
      sourceHeight = video.videoHeight;
    } else {
      const image = new Image();
      image.src = mediaUrl;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Could not render media"));
      });
      source = image;
      sourceWidth = image.naturalWidth;
      sourceHeight = image.naturalHeight;
    }

    drawEditorFrame(
      ctx,
      width,
      height,
      pixelRatio,
      source,
      sourceWidth,
      sourceHeight,
    );

    return canvas;
  };

  const renderEditorVideo = async () => {
    if (!mediaUrl || !frameRef.current || !HTMLCanvasElement.prototype.captureStream) {
      return null;
    }

    const frame = frameRef.current.getBoundingClientRect();
    const width = Math.max(1, frame.width);
    const height = Math.max(1, frame.height);
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const source = document.createElement("video");
    source.src = mediaUrl;
    source.preload = "auto";
    source.playsInline = true;
    source.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      source.onloadedmetadata = () => resolve();
      source.onerror = () => reject(new Error("Could not load video render source"));
    });

    const canvasStream = canvas.captureStream(30);
    let audioContext: AudioContext | null = null;
    try {
      audioContext = new AudioContext();
      const audioSource = audioContext.createMediaElementSource(source);
      const audioDestination = audioContext.createMediaStreamDestination();
      audioSource.connect(audioDestination);
      audioDestination.stream
        .getAudioTracks()
        .forEach((track) => canvasStream.addTrack(track));
    } catch {
      audioContext = null;
    }

    const mimeType = [
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ].find((type) => MediaRecorder.isTypeSupported(type));
    if (!mimeType) {
      audioContext?.close();
      return null;
    }

    const recorder = new MediaRecorder(canvasStream, { mimeType });
    const chunks: Blob[] = [];
    const finished = new Promise<Blob>((resolve) => {
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: mimeType }));
      };
    });

    const stop = () => {
      if (recorder.state !== "inactive") recorder.stop();
      source.pause();
      audioContext?.close();
    };

    await source.play();
    recorder.start();

    const drawFrame = () => {
      drawEditorFrame(
        ctx,
        width,
        height,
        pixelRatio,
        source,
        source.videoWidth,
        source.videoHeight,
      );
      if (
        source.ended ||
        (Number.isFinite(source.duration) &&
          source.currentTime >= source.duration - 0.05)
      ) {
        stop();
      } else {
        requestAnimationFrame(drawFrame);
      }
    };

    drawFrame();
    const blob = await finished;
    const url = URL.createObjectURL(blob);
    registerBlob(url, blob);
    return url;
  };

  const openFinalPreview = async () => {
    setIsRenderingPreview(true);
    try {
      const canvas = await renderEditorToCanvas();
      setRenderedPreviewUrl(canvas?.toDataURL("image/jpeg", 0.96) ?? null);
      if (renderedMediaUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(renderedMediaUrl);
      }
      if (isVideo) {
        setRenderedMediaUrl(await renderEditorVideo());
      } else if (canvas) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.96),
        );
        if (blob) {
          const url = URL.createObjectURL(blob);
          registerBlob(url, blob);
          setRenderedMediaUrl(url);
        } else {
          setRenderedMediaUrl(null);
        }
      }
    } catch (error) {
      console.error("Could not render Moment preview", error);
      setRenderedPreviewUrl(null);
      setRenderedMediaUrl(null);
    } finally {
      setIsRenderingPreview(false);
      setShowFinalPreview(true);
    }
  };

  // =====================================================
  // DOWNLOAD PHOTO
  // =====================================================

  const downloadPhotoWithEdits =
    async () => {
      if (!mediaUrl || isVideo) return;
      const canvas = await renderEditorToCanvas();
      if (!canvas) return;

      const link =
        document.createElement(
          "a"
        );

      link.href = canvas.toDataURL("image/jpeg", 0.98);

      link.download = `yourworld-moment-${Date.now()}.jpg`;

      link.click();
    };

  // =====================================================
  // DOWNLOAD
  // =====================================================

  const handleDownload =
    async () => {
      if (!mediaUrl) return;

      if (!isVideo) {
        await downloadPhotoWithEdits();
        return;
      }

      const link =
        document.createElement(
          "a"
        );

      link.href = mediaUrl;

      link.download = `yourworld-moment-${Date.now()}.webm`;

      link.click();
    };

  // =====================================================
  // RETAKE
  // =====================================================

  const retake = () => {
    if (mediaUrl) {
      URL.revokeObjectURL(
        mediaUrl
      );
    }

    if (audioUrl) {
      URL.revokeObjectURL(
        audioUrl
      );
    }

    setMediaUrl(null);
    setMediaBlob(null);
    setIsVideo(false);
    setSelectedAudio(null);
    setAudioUrl(null);
    setMusicTitle(null);
    setMusicArtist(null);

    resetEditor();

    setStep(0);
  };

  // =====================================================
  // PUBLISH
  // =====================================================

  const handlePublish = async () => {
    if (!mediaUrl) return;
    const publishMediaUrl =
      renderedMediaUrl
        ? renderedMediaUrl
        : mediaUrl;

    const createdAt =
      new Date();

    const expiresAt =
      new Date(
        createdAt.getTime() +
          duration *
            60 *
            60 *
            1000
      );

    const newId = (suffix: number) =>
      typeof crypto !==
        "undefined" &&
      "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${suffix}`;

    // Keep one uploaded source and expose contiguous 30-second trim windows.
    // The viewer seeks these windows directly, so the source is not re-encoded.
    const parts = isVideo
      ? splitMomentIntoParts(
          await readVideoDuration(
            mediaUrl
          )
        )
      : [{ start: 0, end: 0 }];

    const base = {
      mediaUrl: publishMediaUrl,

      mediaType: isVideo
        ? "video"
        : "image",

      caption:
        caption ||
        textLayers[0]?.text ||
        overlayText,

      audio:
        selectedAudio,

        musicTitle,

        musicArtist,

      privacy:
        audience,

      durationHours: duration,

      createdAt:
        createdAt.toISOString(),

      expiresAt:
        expiresAt.toISOString(),

      filter:
        selectedFilter,

      brightness,

      contrast,

      saturation,

      cropRatio,

      rotation: mediaTransform.rotation,

      videoSpeed,

      allowPoll,

      screenshotAlert,

      allowDownloads,

      saveToArchive,

      allowReplies,

      allowReactions,

      showLocation,

      allowSharing,
    };

    const newMoments = parts.map(
      (part, index) => ({
        ...base,
        id: newId(index),
        trim: isVideo
          ? {
              start: part.start,
              end: part.end,
            }
          : undefined,
        partIndex: index + 1,
        partCount: parts.length,
        caption: base.caption,
      })
    );

    const existing =
      JSON.parse(
        localStorage.getItem(
          "yw_moments"
        ) || "[]"
      );

    localStorage.setItem(
      "yw_moments",
      JSON.stringify([
        ...newMoments,
        ...existing,
      ])
    );

    // Publish each part into the live moments feed, oldest part first.
    for (const part of newMoments) {
      await startUpload(
        {
          kind: "moment",
          label: part.caption ?? "New moment",
          thumbnail: null,
          viewTo: "/moment",
        },
        (onProgress) =>
          addMoment({
        kind: isVideo
          ? "video"
          : "photo",
        media: publishMediaUrl,
        mediaType: part.mediaType,
        text: part.caption ?? "",
        textBg: "",
        music:
          selectedAudio ?? undefined,
         musicTitle:
           musicTitle ?? undefined,
         musicArtist:
           musicArtist ?? undefined,
        musicUrl:
          audioUrl ?? undefined,
        musicStart: audioUrl
          ? audioStart
          : undefined,
         audioStartTime: audioUrl
           ? audioStart
           : undefined,
        musicEnd: audioUrl
          ? audioEnd
          : undefined,
        musicVolume: audioUrl
          ? audioVolume
          : undefined,
        stickers: [],
        trim:
          part.trim ??
          (!isVideo && audioUrl
            ? { start: 0, end: photoSeconds }
            : undefined),

        mentions: [],
        allowReactions,
        allowReplies,
        allowSharing,
        showLocation,
        saveToArchive,
        privacy:
          audience ===
          "close_friends"
            ? "close"
            : audience === "only_me"
              ? "onlyme"
              : audience,
        duration,
        effect: "none",
        ai: {},
        allowDownload:
          allowDownloads,
        screenshotAlert,
            poll: null,
            onUploadProgress: onProgress,
          }),
      );
    }

    navigate({
      to: "/moment",
    });
  };

  // =====================================================
  const [showExtraTools, setShowExtraTools] =
    useState(false);
  const [snapDuration, setSnapDuration] =
    useState<3 | 5 | 10 | null>(null);

  // =====================================================
  // CAMERA SCREEN
  // =====================================================

  if (step === 0) {
    return (
      <div
        className="relative w-full h-screen bg-black text-white overflow-hidden select-none"
        onTouchStart={
          handlePinchStart
        }
        onTouchMove={
          handlePinchMove
        }
        onTouchEnd={
          handlePinchEnd
        }
      >
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={
            handleMediaUpload
          }
        />

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`gpu-layer absolute inset-0 w-full h-full object-cover ${
            facingMode === "user"
              ? "scale-x-[-1]"
              : ""
          }`}
          style={{
            filter: isNightMode
              ? "brightness(1.2) contrast(1.1)"
              : undefined,
          }}
        />

        {/* GRID */}

        {isGridOn && (
          <div className="absolute inset-0 z-10 grid grid-cols-3 grid-rows-3 pointer-events-none">
            {Array.from({
              length: 9,
            }).map((_, i) => (
              <div
                key={i}
                className="border border-white/25"
              />
            ))}
          </div>
        )}

        {/* ERROR */}

        {cameraError && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/70">
            <div className="bg-zinc-900 rounded-3xl p-7 text-center max-w-sm">
              <Camera
                size={45}
                className="mx-auto mb-4"
              />

              <h2 className="text-xl font-bold mb-2">
                Camera unavailable
              </h2>

              <p className="text-sm text-zinc-400 mb-5">
                {cameraError}
              </p>

              <button
                onClick={startCamera}
                className="bg-white text-black rounded-full px-7 py-3 font-bold"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* RECORDING */}

        {isRecording && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-40 bg-black/65 backdrop-blur-xl rounded-full px-5 py-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />

            <span className="font-semibold">
              {Math.floor(
                recordingSeconds / 60
              )
                .toString()
                .padStart(2, "0")}
              :
              {(recordingSeconds % 60)
                .toString()
                .padStart(2, "0")}
            </span>
          </div>
        )}

        {/* TIMER */}

        {timerRunning && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="text-7xl font-black">
              <Camera className="h-16 w-16" strokeWidth={1.4} />
            </div>
          </div>
        )}

        {/* TOP */}

        <div className="absolute top-0 left-0 right-0 z-30 p-4 pt-5 flex justify-between items-center">
          <button
            onClick={() =>
              navigate({
                to: "..",
              })
            }
            className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center"
          >
            <X size={25} />
          </button>

          <div className="flex items-center gap-2">
            <div className="bg-black/45 backdrop-blur-xl rounded-full px-3 py-1.5 text-xs font-bold">
              {qualityLabel}
            </div>

            {cameraReady && (
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full" />
            )}
          </div>
        </div>

        {/* RIGHT TOOLS */}

        <div className="gpu-layer absolute right-3 top-20 z-30 flex flex-col items-end gap-3">
          {(
            [
              {
                key: "flash",
                label: "Flash",
                icon: isFlashOn ? (
                  <Zap size={19} className="text-yellow-300" />
                ) : (
                  <ZapOff size={19} />
                ),
                active: isFlashOn,
                onClick: toggleFlash,
              },
              {
                key: "timer",
                label: timerSeconds
                  ? `Timer ${timerSeconds}s`
                  : "Timer",
                icon: <Timer size={19} />,
                active: !!timerSeconds,
                onClick: () =>
                  setTimerSeconds(
                    (value) =>
                      value === null
                        ? 3
                        : value === 3
                        ? 10
                        : null
                  ),
              },
              {
                key: "grid",
                label: "Grid",
                icon: <Grid3X3 size={19} />,
                active: isGridOn,
                onClick: () =>
                  setIsGridOn((value) => !value),
              },
              {
                key: "flip",
                label: "Flip",
                icon: <RefreshCw size={19} />,
                active: false,
                onClick: () =>
                  setFacingMode(
                    (value) =>
                      value === "user"
                        ? "environment"
                        : "user"
                  ),
              },
            ] as const
          ).map((tool) => (
            <button
              key={tool.key}
              onClick={tool.onClick}
              className="flex items-center gap-2"
            >
              <span className="text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {tool.label}
              </span>
              <span
                className={`w-10 h-10 rounded-full backdrop-blur-xl flex items-center justify-center ${
                  tool.active
                    ? "bg-white text-black"
                    : "bg-black/45 text-white"
                }`}
              >
                {tool.icon}
              </span>
            </button>
          ))}

          <button
            onClick={() =>
              setShowExtraTools((value) => !value)
            }
            aria-label="More tools"
            className="flex items-center gap-2"
          >
            <span className="text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              {showExtraTools ? "Less" : "More"}
            </span>
            <span className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-xl flex items-center justify-center">
              {showExtraTools ? (
                <ChevronUp size={19} />
              ) : (
                <ChevronDown size={19} />
              )}
            </span>
          </button>

          {showExtraTools && (
            <>
              <button
                onClick={() =>
                  applyZoom(
                    zoom >= maxZoom
                      ? 1
                      : zoom + 0.5
                  )
                }
                className="flex items-center gap-2"
              >
                <span className="text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  Zoom
                </span>
                <span className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-xl flex items-center justify-center text-[11px] font-bold">
                  {zoom.toFixed(1)}x
                </span>
              </button>

              <button
                onClick={() =>
                  setIsNightMode((value) => !value)
                }
                className="flex items-center gap-2"
              >
                <span className="text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  Night
                </span>
                <span
                  className={`w-10 h-10 rounded-full backdrop-blur-xl flex items-center justify-center ${
                    isNightMode
                      ? "bg-white text-black"
                      : "bg-black/45 text-white"
                  }`}
                >
                  <Moon size={19} />
                </span>
              </button>
            </>
          )}
        </div>

        {/* BOTTOM CAMERA */}

        <div className="absolute bottom-0 left-0 right-0 z-30 pb-8 pt-24 bg-gradient-to-t from-black/90 to-transparent">
          <div className="flex justify-center mb-5">
            <div className="flex gap-4 bg-black/45 backdrop-blur-xl px-4 py-1 rounded-full text-[11px]">
              <button
                onClick={() =>
                  setCaptureMode(
                    "photo"
                  )
                }
                className={
                  captureMode ===
                  "photo"
                    ? "font-bold"
                    : "text-white/45"
                }
              >
                PHOTO
              </button>

              <button
                onClick={() =>
                  setCaptureMode(
                    "video"
                  )
                }
                className={
                  captureMode ===
                  "video"
                    ? "font-bold"
                    : "text-white/45"
                }
              >
                VIDEO
              </button>
            </div>
          </div>

          <div className="flex items-center justify-around px-7">
            <button
              onClick={() =>
                imageInputRef.current?.click()
              }
              className="flex flex-col items-center gap-1.5"
            >
              <span className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-xl border border-white/25 flex items-center justify-center">
                <ImageIcon size={23} />
              </span>
              <span className="text-[10px] font-semibold text-white/90">
                Memories
              </span>
            </button>

            <button
              onClick={handleShutter}
              className={`w-24 h-24 rounded-full border-[5px] ${
                isRecording
                  ? "border-red-500"
                  : "border-white"
              } p-1`}
            >
              <div
                className={`w-full h-full ${
                  isRecording
                    ? "bg-red-500 rounded-2xl scale-75"
                    : "bg-white rounded-full"
                }`}
              />
            </button>

            <button
              onClick={() =>
                setShowExtraTools((value) => !value)
              }
              className="flex flex-col items-center gap-1.5"
            >
              <span className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-xl border border-white/25 flex items-center justify-center">
                <Star size={23} />
              </span>
              <span className="text-[10px] font-semibold text-white/90">
                Lenses
              </span>
            </button>
          </div>

          <p className="text-center text-xs text-white/50 mt-4">
            {captureMode ===
            "photo"
              ? "Tap to capture"
              : "Tap to start / stop"}
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // EDITOR SCREEN
  // =====================================================

  if (step === 1) {
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden bg-black text-white select-none">
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={
            handleAudioUpload
          }
        />

        {/* MEDIA */}

        <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-3 pb-36 pt-20">
          <div
            ref={frameRef}
            className="relative h-full w-full max-h-full max-w-full"
          >
            <div
              className="absolute inset-0 z-10 flex touch-none items-center justify-center"
              onPointerDown={handleMediaPointerDown}
              onPointerMove={handleMediaPointerMove}
              onPointerUp={handleMediaPointerUp}
              onPointerCancel={handleMediaPointerUp}
              aria-label="Move, scale, and rotate your media"
            >
              {mediaUrl &&
                (isVideo ? (
                  <video
                    data-editor-video
                    src={mediaUrl}
                    autoPlay
                    loop
                    playsInline
                    muted={videoMuted}
                    className="h-full w-full object-contain"
                    style={getMediaRenderTransform()}
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Moment"
                    className="h-full w-full object-contain"
                    style={getMediaRenderTransform()}
                  />
                ))}
            </div>

            {isMediaTransforming && (
              <div className="pointer-events-none absolute left-1/2 top-20 z-40 -translate-x-1/2 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 font-mono text-[10px] font-bold text-white/75 backdrop-blur-xl">
                {getTransformLabel()}
              </div>
            )}

            {snapGuides.vertical && (
              <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 z-35 border-l border-dashed border-yellow-300/80" />
            )}
            {snapGuides.horizontal && (
              <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-35 border-t border-dashed border-yellow-300/80" />
            )}

            {/* DRAWING */}

            <canvas
              ref={drawingCanvasRef}
              className={`absolute inset-0 w-full h-full z-20 ${
                drawMode
                  ? "pointer-events-auto"
                  : "pointer-events-none"
              }`}
              onMouseDown={
                startDrawing
              }
              onMouseMove={draw}
              onMouseUp={
                stopDrawing
              }
              onMouseLeave={
                stopDrawing
              }
              onTouchStart={
                startDrawing
              }
              onTouchMove={draw}
              onTouchEnd={
                stopDrawing
              }
            />

            {/* TEXT LAYERS */}

            {textLayers.map(
              (layer) => (
                <TextLayerView
                  key={layer.id}
                  layer={layer}
                  active={
                    layer.id ===
                    activeTextId
                  }
                  frameRef={
                    frameRef
                  }
                  locked={
                    drawMode
                  }
                  onSelect={() => {
                    setActiveTextId(
                      layer.id
                    );
                    setOverlayText(
                      layer.text
                    );
                    setTextColor(
                      layer.color
                    );
                    setTextSize(
                      layer.size
                    );
                    setShowTextInput(
                      true
                    );
                  }}
                  onChange={(
                    patch
                  ) =>
                    setTextLayers(
                      (items) =>
                        items.map(
                          (item) =>
                            item.id ===
                            layer.id
                              ? {
                                  ...item,
                                  ...patch,
                                }
                              : item
                        )
                    )
                  }
                  onRemove={() => {
                    setTextLayers(
                      (items) =>
                        items.filter(
                          (item) =>
                            item.id !==
                            layer.id
                        )
                    );
                    setActiveTextId(
                      null
                    );
                  }}
                />
              )
            )}

            {/* STICKERS */}

            {stickers.map(
              (sticker) => (
                <button
                  key={sticker.id}
                  onDoubleClick={() =>
                    removeSticker(
                      sticker.id
                    )
                  }
                  className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    fontSize: `${sticker.size}px`,
                  }}
                >
                  {sticker.emoji}
                </button>
              )
            )}

          </div>
        </div>

        {/* DARK GRADIENT */}

        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/80 to-transparent z-40 pointer-events-none" />

        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/95 to-transparent z-40 pointer-events-none" />

        {/* TOP */}

        <div className="absolute left-3 right-3 top-3 z-50 flex items-start justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={retake}
              aria-label="Close editor"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-black/55 backdrop-blur-xl"
            >
              <X size={20} />
            </button>
            <div className="flex min-w-0 items-center gap-2 rounded-full bg-black/45 py-1.5 pl-1.5 pr-3 backdrop-blur-xl">
              <span className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-white/30 bg-gradient-to-br from-pink-500 to-cyan-400">
                <ProfileAvatar
                  user={{
                    full_name: editorName,
                    username: editorUsername,
                    avatar_url: editorAvatarUrl,
                  }}
                />
              </span>
              <span className="min-w-0">
                <span className="block max-w-32 truncate text-[11px] font-bold">
                  {editorName}
                </span>
                <span className="block truncate text-[9px] text-white/55">
                  @{editorUsername} · Today {editorTimeLabel}
                </span>
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setShowTextInput(false);
              setDrawMode(false);
              setShowMusicPanel(false);
              setPanel(null);
              setShowMusicLibrary(true);
            }}
            className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-4 py-2.5 text-xs font-bold whitespace-nowrap backdrop-blur-xl active:scale-95"
          >
            <Music size={14} />
            {selectedAudio || "Add a Sound"}
          </button>

          <div className="flex gap-2">
            {isVideo && (
              <div className="rounded-full bg-black/55 px-3 py-2 text-[10px] font-bold backdrop-blur-xl">
                VIDEO
              </div>
            )}
          </div>
        </div>

        {/* RIGHT TOOLS DOCK */}

        {(() => {
          const closeAll = () => {
            setShowTextInput(false);
            setDrawMode(false);
            setShowMusicPanel(false);
            setPanel(null);
          };

          return (
            <div className="gpu-layer absolute right-3 top-24 z-[85] flex max-h-[calc(100dvh-10rem)] flex-col items-end gap-2 overflow-y-auto py-1 no-scrollbar">
              <EditorTool
                icon={<Pencil />}
                label="Draw"
                active={drawMode}
                onClick={() => {
                  const next = drawMode;
                  closeAll();
                  if (!next) setDrawMode(true);
                }}
              />

              <EditorTool
                icon={<Type />}
                label="Text"
                active={showTextInput}
                onClick={() => {
                  closeAll();
                  addText();
                }}
              />

              <EditorTool
                icon={<Smile />}
                label="Stickers"
                active={panel === "sticker"}
                onClick={() => {
                  const next = panel === "sticker";
                  closeAll();
                  if (!next) setPanel("sticker");
                }}
              />

              <EditorTool
                icon={<Music />}
                label="Sound"
                active={showMusicPanel || showMusicLibrary}
                onClick={() => {
                  closeAll();
                  setShowMusicLibrary(true);
                }}
              />

              <EditorTool
                icon={<Sparkles />}
                label="Filters"
                active={panel === "filter"}
                onClick={() => {
                  const next = panel === "filter";
                  closeAll();
                  if (!next) setPanel("filter");
                }}
              />

              <EditorTool
                icon={<Scissors />}
                label="Cutout"
                onClick={() => {
                  closeAll();
                  setDrawMode(true);
                }}
              />

              <EditorTool
                icon={<Link2 />}
                label="Link"
                onClick={() => {
                  closeAll();
                  setCaption((value) => value || "Add a link in your caption");
                }}
              />

              <EditorTool
                icon={<Crop />}
                label="Transform"
                active={isMediaTransforming}
                onClick={resetMediaTransform}
              />

              <EditorTool
                icon={<Timer />}
                label={
                  snapDuration
                    ? `Timer ${snapDuration}s`
                    : "Timer"
                }
                active={!!snapDuration}
                onClick={() =>
                  setSnapDuration((value) =>
                    value === null
                      ? 3
                      : value === 3
                      ? 5
                      : value === 5
                      ? 10
                      : null
                  )
                }
              />


            </div>
          );
        })()}


        {/* TEXT PANEL */}

        {showTextInput && (
          <div className="gpu-layer transition-transform duration-200 ease-out absolute bottom-0 left-0 right-0 z-[80] bg-black/90 backdrop-blur-2xl rounded-t-3xl p-4 pb-8 border-t border-white/10">
            <input
              autoFocus
              value={overlayText}
              onChange={(e) => {
                setOverlayText(
                  e.target.value
                );
                updateActiveText({
                  text: e.target
                    .value,
                });
              }}
              placeholder="Write text..."
              className="w-full bg-white/10 rounded-xl px-4 py-3 outline-none"
            />

            <div className="flex items-center gap-2 mt-3">
              {[
                "#ffffff",
                "#ff3b81",
                "#00e5ff",
                "#ffd400",
                "#55ff66",
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setTextColor(
                      color
                    );
                    updateActiveText(
                      { color }
                    );
                  }}
                  className="w-8 h-8 rounded-full border-2 border-white/50"
                  style={{
                    backgroundColor:
                      color,
                  }}
                />
              ))}
            </div>

            <input
              type="range"
              min="18"
              max="120"
              value={textSize}
              onChange={(e) => {
                const size =
                  Number(
                    e.target.value
                  );
                setTextSize(size);
                updateActiveText({
                  size,
                });
              }}
              className="w-full mt-3"
            />

            <div className="grid grid-cols-2 gap-2 mt-3">
              <input
                type="range"
                min="10"
                max="90"
                value={textX}
                onChange={(e) => {
                  setTextX(
                    Number(
                      e.target.value
                    )
                  );
                  updateActiveText({
                    x: Number(
                      e.target
                        .value
                    ),
                  });
                }}
              />

              <input
                type="range"
                min="10"
                max="90"
                value={textY}
                onChange={(e) => {
                  setTextY(
                    Number(
                      e.target.value
                    )
                  );
                  updateActiveText({
                    y: Number(
                      e.target
                        .value
                    ),
                  });
                }}
              />
            </div>

            <div className="mt-3">
              <p className="text-[10px] text-white/50 mb-1">
                Rotate
              </p>

              <input
                type="range"
                min="-180"
                max="180"
                value={
                  textLayers.find(
                    (item) =>
                      item.id ===
                      activeTextId
                  )?.rotation ?? 0
                }
                onChange={(e) =>
                  updateActiveText({
                    rotation:
                      Number(
                        e.target
                          .value
                      ),
                  })
                }
                className="w-full"
              />
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={addText}
                className="flex-1 py-2 rounded-xl bg-white/10 text-xs font-bold"
              >
                Add text
              </button>

              <button
                onClick={() =>
                  setShowTextInput(
                    false
                  )
                }
                className="flex-1 py-2 rounded-xl bg-white text-black text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* DRAW PANEL */}

        {drawMode && (
          <div className="gpu-layer transition-transform duration-200 ease-out absolute bottom-0 left-0 right-0 z-[80] bg-black/90 backdrop-blur-2xl rounded-t-3xl p-4 pb-8 border-t border-white/10">
            <div className="flex gap-2 mb-3">
              {[
                "#ffffff",
                "#ff0055",
                "#00e5ff",
                "#ffd400",
                "#55ff55",
              ].map((color) => (
                <button
                  key={color}
                  onClick={() =>
                    setDrawColor(
                      color
                    )
                  }
                  className="w-8 h-8 rounded-full border border-white/50"
                  style={{
                    backgroundColor:
                      color,
                  }}
                />
              ))}
            </div>

            <input
              type="range"
              min="2"
              max="25"
              value={drawSize}
              onChange={(e) =>
                setDrawSize(
                  Number(
                    e.target.value
                  )
                )
              }
            />

            <div className="flex gap-2 mt-3">
              <button
                onClick={
                  undoDrawing
                }
                className="p-2 bg-white/10 rounded-xl"
              >
                <Undo2 />
              </button>

              <button
                onClick={
                  redoDrawing
                }
                className="p-2 bg-white/10 rounded-xl"
              >
                <Redo2 />
              </button>

              <button
                onClick={
                  clearDrawing
                }
                className="px-3 bg-white/10 rounded-xl text-xs"
              >
                Clear
              </button>
              <button
                onClick={() => setDrawMode(false)}
                className="ml-auto px-5 rounded-xl bg-white text-black text-xs font-black"
              >
                Done
              </button>
            </div>
          </div>

        )}

        {/* STICKER DRAWER */}

        {panel === "sticker" && (
        <div className="gpu-layer transition-transform duration-200 ease-out absolute bottom-0 left-0 right-0 z-[80] bg-black/90 backdrop-blur-2xl rounded-t-3xl px-4 pt-4 pb-8 border-t border-white/10 flex gap-2 overflow-x-auto no-scrollbar">

          {[
            "Heart",
            "Laugh",
            "Flame",
            "Love",
            "Cool",
            "Party",
            "Applause",
            "Perfect",
            "Star",
            "Energy",
          ].map((emoji) => (
            <button
              key={emoji}
              onClick={() =>
                addSticker(
                  emoji
                )
              }
              className="min-w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-xl text-[10px] font-semibold"
            >
              {emoji}
            </button>
          ))}
        </div>
        )}


        {/* FILTERS + ADJUSTMENTS DRAWER */}

        {panel === "filter" && (
          <div className="gpu-layer transition-transform duration-200 ease-out absolute bottom-0 left-0 right-0 z-[80] bg-black/90 backdrop-blur-2xl rounded-t-3xl px-4 pt-4 pb-8 border-t border-white/10">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />

            <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
              <div className="flex gap-3">
                {(
                  Object.keys(
                    FILTERS
                  ) as FilterName[]
                ).map((filter) => (
                  <button
                    key={filter}
                    onClick={() =>
                      setSelectedFilter(
                        filter
                      )
                    }
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold ${
                      selectedFilter ===
                      filter
                        ? "bg-white text-black"
                        : "bg-white/10"
                    }`}
                  >
                    {FILTERS[filter].name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar">

          <Adjust
            icon={<Sun />}
            value={brightness}
            min={60}
            max={140}
            onChange={
              setBrightness
            }
          />

          <Adjust
            icon={<Contrast />}
            value={contrast}
            min={60}
            max={140}
            onChange={
              setContrast
            }
          />

          <Adjust
            icon={<Palette />}
            value={saturation}
            min={0}
            max={180}
            onChange={
              setSaturation
            }
          />

          {isVideo && (
            <>
              <Adjust
                icon={<Play />}
                value={videoSpeed}
                min={0.5}
                max={2}
                step={0.25}
                onChange={
                  setVideoSpeed
                }
              />

              <button
                onClick={() =>
                  setVideoMuted(
                    (value) =>
                      !value
                  )
                }
                className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-xl flex items-center justify-center"
              >
                {videoMuted ? (
                  <VolumeX />
                ) : (
                  <Volume2 />
                )}
              </button>
            </>
          )}
            </div>

            <button
              onClick={() => setPanel(null)}
              className="mt-4 w-full py-2.5 rounded-full bg-white text-black text-xs font-black"
            >
              Done
            </button>
          </div>
        )}


        {/* AUDIO */}

        {audioUrl && (
          <audio
            ref={previewAudioRef}
            src={audioUrl}
            preload="metadata"
            className="hidden"
            onLoadedMetadata={(e) => {
              const duration = e.currentTarget.duration;
              if (!Number.isFinite(duration) || duration <= 0) return;
              const segmentLength = Math.min(audioSegmentLength, duration);
              setAudioDuration(duration);
              setAudioStart(0);
              setAudioEnd(segmentLength);
            }}
            onEnded={() =>
              setAudioPlaying(false)
            }
            onTimeUpdate={(e) => {
              const el =
                e.currentTarget;
              if (
                audioEnd > audioStart &&
                el.currentTime >= audioEnd
              ) {
                el.currentTime =
                  audioStart;
              }
            }}
          />
        )}

        {selectedAudio && (
          <button
            onClick={() =>
              setShowMusicPanel(
                (v) => !v
              )
            }
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] bg-black/70 backdrop-blur-xl rounded-full px-4 py-2 text-xs flex items-center gap-2"
          >
            <Music size={14} />

            <span className="max-w-36 truncate">
              {selectedAudio}
            </span>

            <span className="text-[10px] text-white/60 font-mono">
              {fmtTime(audioStart)}–
              {fmtTime(audioEnd)}
            </span>
          </button>
        )}

        {/* MUSIC LIBRARY */}

        {showMusicLibrary && (
          <div className="absolute inset-0 z-[95] flex flex-col justify-end bg-black/60 backdrop-blur-sm">
            <button
              className="flex-1"
              onClick={() => setShowMusicLibrary(false)}
              aria-label="Close music library"
            />
            <div className="gpu-layer rounded-t-3xl border-t border-white/10 bg-neutral-950 p-4 pb-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-black uppercase tracking-wide">Add music</p>
                <button
                  onClick={() => {
                    setShowMusicLibrary(false);
                    audioInputRef.current?.click();
                  }}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase"
                >
                  From device
                </button>
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {NO_COPYRIGHT_MUSIC.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      if (audioUrl?.startsWith("blob:")) {
                        URL.revokeObjectURL(audioUrl);
                        unregisterBlob(audioUrl);
                      }
                      setAudioUrl(track.url);
                      setSelectedAudio(`${track.title} — ${track.artist}`);
                      setMusicTitle(track.title);
                      setMusicArtist(track.artist);
                      setAudioDuration(0);
                      setAudioStart(0);
                      setAudioEnd(0);
                      setShowMusicLibrary(false);
                      setShowMusicPanel(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white/5 p-3 text-left active:scale-[0.98]"
                  >
                    <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-white/10">
                      <Music size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold">{track.title}</span>
                      <span className="block truncate text-[10px] text-white/50">
                        {track.artist} · {track.category} · {track.duration}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MUSIC TRIM PANEL */}

        {showMusicPanel && audioUrl && (
          <div className="gpu-layer absolute bottom-0 left-0 right-0 z-[80] rounded-t-3xl border-t border-white/10 bg-zinc-950/95 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-[0_-20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={
                  toggleAudioPreview
                }
                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0"
              >
                {audioPlaying ? (
                  <Pause size={18} />
                ) : (
                  <Play size={18} />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">
                  {selectedAudio}
                </p>
                <p className="text-[10px] text-white/50 font-mono">
                  {fmtTime(audioStart)} –{" "}
                  {fmtTime(audioEnd)} ·{" "}
                  {(
                    audioEnd - audioStart
                  ).toFixed(1)}
                  s
                </p>
              </div>

              <button
                onClick={() =>
                  setShowMusicLibrary(true)
                }
                className="px-3 py-1.5 rounded-full bg-white/10 text-[10px] font-black uppercase"
              >
                Change
              </button>

              <button
                onClick={removeAudio}
                className="px-3 py-1.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-black uppercase"
              >
                Remove
              </button>
            </div>

            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
                Choose clip
              </span>
            </div>

            <AudioTimeline
              duration={audioDuration}
              start={audioStart}
              end={audioEnd}
              onChangeStart={(nextStart) => moveAudioWindow(nextStart)}
            />

            <label className="block text-[10px] uppercase tracking-wider text-white/50 mt-2 mb-1">
              Volume
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audioVolume}
              onChange={(e) => {
                const v = Number(
                  e.target.value
                );
                setAudioVolume(v);
                if (
                  previewAudioRef.current
                ) {
                  previewAudioRef.current.volume =
                    v;
                }
              }}
              className="w-full accent-pink-500"
            />

            <button
              onClick={() =>
                setShowMusicPanel(false)
              }
              className="mt-3 w-full py-2 rounded-full bg-gradient-to-r from-cyan-400 via-pink-500 to-pink-600 text-xs font-black"
            >
              Done
            </button>
          </div>
        )}


        {/* FILTER THUMBNAILS ROW */}

        {!(showTextInput || drawMode || showMusicPanel || panel) && (
          <div className="absolute bottom-40 left-0 right-0 z-[65] px-4">
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
              {(
                Object.keys(
                  FILTERS
                ) as FilterName[]
              ).map((filter) => (
                <button
                  key={filter}
                  onClick={() =>
                    setSelectedFilter(filter)
                  }
                  className="flex flex-col items-center gap-1 shrink-0"
                >
                  <span
                    className={`w-14 h-14 rounded-full overflow-hidden border-2 bg-zinc-800 ${
                      selectedFilter === filter
                        ? "border-white"
                        : "border-white/30"
                    }`}
                  >
                    {mediaUrl && !isVideo ? (
                      <img
                        src={mediaUrl}
                        decoding="async"
                        loading="lazy"
                        alt={FILTERS[filter].name}
                        className="w-full h-full object-cover"
                        style={{
                          filter:
                            FILTERS[filter].css ||
                            undefined,
                        }}
                      />
                    ) : (
                      <span
                        className="block w-full h-full bg-gradient-to-br from-zinc-600 to-zinc-900"
                        style={{
                          filter:
                            FILTERS[filter].css ||
                            undefined,
                        }}
                      />
                    )}
                  </span>
                  <span className="text-[9px] font-semibold text-white/85">
                    {FILTERS[filter].name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CAPTION */}

        {!(showTextInput || drawMode || showMusicPanel || panel) && (
        <div className="absolute bottom-24 left-0 right-0 z-[70] px-4">
          <input
            value={caption}
            onChange={(e) =>
              setCaption(
                e.target.value
              )
            }
            placeholder="Add a caption..."
            className="w-full bg-black/70 backdrop-blur-xl border border-white/10 rounded-full px-5 py-3.5 outline-none text-sm"
          />
        </div>
        )}

        {/* BOTTOM NAV BAR */}

        {!(showTextInput || drawMode || showMusicPanel || panel) && (
        <div
          className="absolute bottom-4 left-4 right-4 z-[70] flex items-center justify-between gap-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-6 backdrop-blur-md"
        >

          <button
            onClick={handleDownload}
            aria-label="Download"
            className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 flex items-center justify-center active:scale-95"
          >
            <Download size={20} />
          </button>

            <button
              onClick={openFinalPreview}
              disabled={isRenderingPreview}
            className="px-5 py-3 rounded-full bg-zinc-800/90 backdrop-blur-xl border border-white/10 text-sm font-bold active:scale-95"
          >
              {isRenderingPreview ? "Rendering…" : "+ Stories"}
          </button>

          <button
              onClick={openFinalPreview}
              disabled={isRenderingPreview}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-400 via-pink-500 to-pink-600 font-black text-sm flex items-center gap-1.5 active:scale-95"
          >
              {isRenderingPreview ? "Rendering…" : "Send to"}
            <ChevronRight
              size={18}
            />
          </button>
        </div>
        )}

        {/* FINAL PREVIEW */}

        {showFinalPreview && (
          <div className="fixed inset-0 z-[120] bg-black flex flex-col">
            <div className="flex items-center justify-between px-4 pt-5 pb-3">
              <button
                onClick={() => setShowFinalPreview(false)}
                className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center"
                aria-label="Back to editor"
              >
                <X size={18} />
              </button>
              <span className="text-sm font-black uppercase tracking-wide">
                Preview
              </span>
              <span className="w-11" />
            </div>

            <div className="flex-1 min-h-0 flex items-center justify-center px-4">
              <div className="relative w-full h-full max-h-full rounded-2xl overflow-hidden bg-zinc-900">
                {renderedPreviewUrl ? (
                  <img
                    src={renderedPreviewUrl}
                    alt="Rendered Moment preview"
                    className="h-full w-full object-contain"
                  />
                ) : mediaUrl && isVideo ? (
                  <video
                    src={mediaUrl}
                    className="w-full h-full object-contain"
                    style={getMediaRenderTransform()}
                    autoPlay
                    loop
                    playsInline
                    controls
                    muted={videoMuted}
                  />
                ) : mediaUrl ? (
                  <img
                    src={mediaUrl}
                    alt="Moment preview"
                    className="w-full h-full object-contain"
                    style={getMediaRenderTransform()}
                  />
                ) : null}

                {caption && (
                  <div className="absolute bottom-4 left-4 right-4 text-center text-sm font-semibold bg-black/60 backdrop-blur-xl rounded-2xl px-4 py-2">
                    {caption}
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 pb-6 pt-3 space-y-3">
              {selectedAudio && (
                <p className="text-xs text-white/70 font-semibold">
                  {selectedAudio}
                </p>
              )}

              {!isVideo && audioUrl && (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span>Photo duration</span>
                    <span>{photoSeconds}s</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={40}
                    step={1}
                    value={photoSeconds}
                    onChange={(e) =>
                      setPhotoSeconds(Number(e.target.value))
                    }
                    className="w-full accent-pink-500"
                  />
                </div>
              )}

              <button
                onClick={() => {
                  setShowFinalPreview(false);
                  setStep(2);
                }}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-cyan-400 via-pink-500 to-pink-600 font-black text-sm active:scale-95"
              >
                Continue
              </button>
            </div>
          </div>
        )}


      </div>
    );
  }

  // =====================================================
  // SHARE SCREEN
  // =====================================================

  return (
    <div className="h-screen w-full overflow-hidden bg-[#101010] text-white">
      <div className="mx-auto max-w-xl px-3 py-2">
        {/* HEADER */}

        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={() =>
              setStep(1)
            }
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5"
          >
            <X />
          </button>

          <h1 className="text-base font-bold">
            Share Moment
          </h1>

          <div className="w-11" />
        </div>

        {/* PREVIEW */}

        {mediaUrl && (
          <div className="relative mx-auto mb-2 h-28 w-20 overflow-hidden rounded-2xl">
            {renderedPreviewUrl ? (
              <img
                src={renderedPreviewUrl}
                className="h-full w-full object-cover"
                alt="Rendered Moment"
              />
            ) : isVideo ? (
              <video
                src={mediaUrl}
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={mediaUrl}
                className="w-full h-full object-cover"
                alt="Moment"
              />
            )}
          </div>
        )}

        {/* AUDIENCE */}

        <SectionTitle title="AUDIENCE" />

        <div className="mb-2 grid grid-cols-2 gap-1.5">
          <AudienceButton
            active={
              audience ===
              "everyone"
            }
            icon={<Globe2 />}
            title="Everyone"
            subtitle="Anyone on YourWorld"
            onClick={() =>
              setAudience(
                "everyone"
              )
            }
          />

          <AudienceButton
            active={
              audience ===
              "followers"
            }
            icon={<Users />}
            title="Followers"
            subtitle="People who follow you"
            onClick={() =>
              setAudience(
                "followers"
              )
            }
          />

          <AudienceButton
            active={
              audience ===
              "close_friends"
            }
            icon={<Star />}
            title="Close Friends"
            subtitle="Your green-list"
            onClick={() =>
              setAudience(
                "close_friends"
              )
            }
          />

          <AudienceButton
            active={
              audience ===
              "only_me"
            }
            icon={<Lock />}
            title="Only Me"
            subtitle="Private"
            onClick={() =>
              setAudience(
                "only_me"
              )
            }
          />
        </div>

        {/* DURATION */}

        <SectionTitle title="DURATION" />

        <div className="mb-2 grid grid-cols-3 gap-1.5">
          <DurationButton
            active={duration === 12}
            title="12 Hours"
            onClick={() => setDuration(12)}
          />
          <DurationButton
            active={duration === 24}
            title="24 Hours"
            onClick={() => setDuration(24)}
          />
          <DurationButton
            active={duration === 48}
            title="48 Hours"
            onClick={() => setDuration(48)}
          />
        </div>

        {/* SETTINGS */}

        <SectionTitle title="INTERACTION & SAFETY" />

        <div className="grid grid-cols-2 gap-1.5">
          <SettingRow
            icon={<MessageCircle />}
            title="Add a poll"
            subtitle="Let viewers vote"
            checked={allowPoll}
            onChange={() =>
              setAllowPoll(
                (v) => !v
              )
            }
          />

          <SettingRow
            icon={<Heart />}
            title="Allow reactions"
            subtitle="Viewers can react"
            checked={allowReactions}
            onChange={() =>
              setAllowReactions(
                (v) => !v
              )
            }
          />

          <SettingRow
            icon={<MessageCircle />}
            title="Allow replies"
            subtitle="Viewers can reply"
            checked={allowReplies}
            onChange={() =>
              setAllowReplies(
                (v) => !v
              )
            }
          />

          <SettingRow
            icon={<Zap />}
            title="Screenshot alert"
            subtitle="Best-effort detection"
            checked={
              screenshotAlert
            }
            onChange={() =>
              setScreenshotAlert(
                (v) => !v
              )
            }
          />

          <SettingRow
            icon={<Download />}
            title="Allow downloads"
            subtitle="Viewers can save"
            checked={
              allowDownloads
            }
            onChange={() =>
              setAllowDownloads(
                (v) => !v
              )
            }
          />

          <SettingRow
            icon={<Archive />}
            title="Save to archive"
            subtitle="Keep private copy"
            checked={
              saveToArchive
            }
            onChange={() =>
              setSaveToArchive(
                (v) => !v
              )
            }
          />

          <SettingRow
            icon={<MapPin />}
            title="Show location"
            subtitle="Share location"
            checked={
              showLocation
            }
            onChange={() =>
              setShowLocation(
                (v) => !v
              )
            }
          />

          <SettingRow
            icon={<Share2 />}
            title="Allow sharing"
            subtitle="Let viewers share"
            checked={
              allowSharing
            }
            onChange={() =>
              setAllowSharing(
                (v) => !v
              )
            }
          />
        </div>

        {/* SHARE */}

        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={
              handleDownload
            }
            aria-label="Save to gallery"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] transition active:scale-95"
          >
            <Download size={18} />
          </button>

          <button
            onClick={
              handlePublish
            }
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-pink-500 to-pink-600 py-2.5 text-sm font-bold"
          >
            Share Moment
            <Share2 size={17} />
          </button>
        </div>

        <p className="mt-1 text-center text-[9px] text-zinc-500">
          Save to gallery ya seedha share karein
        </p>
      </div>
    </div>
  );
}

// =====================================================
// EDITOR TOOL
// =====================================================

function EditorTool({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2"
      title={label}
    >
      <span className="text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
        {label}
      </span>
      <span
        className={`w-10 h-10 rounded-full backdrop-blur-xl flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5 ${
          active
            ? "bg-white text-black"
            : "bg-black/50 text-white"
        }`}
      >
        {icon}
      </span>
    </button>
  );
}

// =====================================================
// ADJUSTMENT
// =====================================================

function Adjust({
  icon,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (
    value: number
  ) => void;
}) {
  return (
    <div className="min-w-[130px] bg-black/65 backdrop-blur-xl rounded-2xl px-3 py-2 flex items-center gap-2">
      {icon}

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) =>
          onChange(
            Number(
              e.target.value
            )
          )
        }
        className="w-full"
      />
    </div>
  );
}

// =====================================================
// SECTION
// =====================================================

function SectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <h2 className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
      {title}
    </h2>
  );
}

// =====================================================
// AUDIENCE
// =====================================================

function AudienceButton({
  active,
  icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-2 py-1.5 text-left transition-colors ${
        active
          ? "border-pink-500/70 bg-pink-500/10"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div className="mb-1 flex items-center justify-between">
        <span
          className={`[&>svg]:h-4 [&>svg]:w-4 ${
            active
            ? "text-pink-400"
              : "text-zinc-400"
          }`}
        >
          {icon}
        </span>

        {active && (
          <Check
            size={13}
            className="text-pink-400"
          />
        )}
      </div>

      <p className="text-[11px] font-semibold leading-tight">
        {title}
      </p>

      <p className="mt-0.5 text-[9px] leading-tight text-zinc-500">
        {subtitle}
      </p>
    </button>
  );
}

// =====================================================
// DURATION
// =====================================================

function DurationButton({
  active,
  title,
  onClick,
}: {
  active: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-pink-500/80 bg-pink-500/15 text-white shadow-[0_0_18px_rgba(236,72,153,0.2)]"
          : "border-white/10 bg-white/[0.04] text-zinc-400"
      }`}
    >
      {title}
    </button>
  );
}

// =====================================================
// SETTING
// =====================================================

function SettingRow({
  icon,
  title,
  subtitle,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className="flex min-h-[52px] w-full items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-1.5 py-1.5 text-left"
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/5 text-zinc-400 [&>svg]:h-3 [&>svg]:w-3">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold leading-tight">
          {title}
        </p>

        <p className="mt-0.5 truncate text-[9px] leading-tight text-zinc-500">
          {subtitle}
        </p>
      </div>

      <span
        role="switch"
        aria-checked={checked}
        className={`relative h-[18px] w-[32px] shrink-0 rounded-full transition-colors duration-300 ease-out ${
          checked ? "bg-pink-500" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute left-[2px] top-[2px] h-3.5 w-3.5 rounded-full bg-white shadow-md transition-transform duration-300 ease-out ${
          checked ? "translate-x-3.5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

// =====================================================
// TEXT LAYER (move / resize / rotate)
// =====================================================

function TextLayerView({
  layer,
  active,
  locked,
  frameRef,
  onSelect,
  onChange,
  onRemove,
}: {
  layer: TextLayer;
  active: boolean;
  locked?: boolean;
  frameRef: React.RefObject<HTMLDivElement | null>;
  onSelect: () => void;
  onChange: (patch: Partial<TextLayer>) => void;
  onRemove: () => void;
}) {
  const drag = useRef<{
    mode: "move" | "scale";
    startX: number;
    startY: number;
    size: number;
    rotation: number;
    x: number;
    y: number;
  } | null>(null);

  const frameRect = () => frameRef.current?.getBoundingClientRect();

  const centerPx = () => {
    const r = frameRect();
    if (!r) return { cx: 0, cy: 0 };
    return {
      cx: r.left + (layer.x / 100) * r.width,
      cy: r.top + (layer.y / 100) * r.height,
    };
  };

  const start =
    (mode: "move" | "scale") => (e: React.PointerEvent) => {
      if (locked) return;
      e.stopPropagation();
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      onSelect();
      drag.current = {
        mode,
        startX: e.clientX,
        startY: e.clientY,
        size: layer.size,
        rotation: layer.rotation,
        x: layer.x,
        y: layer.y,
      };
    };

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    const r = frameRect();
    if (!d || !r) return;

    if (d.mode === "move") {
      onChange({
        x: Math.min(100, Math.max(0, d.x + ((e.clientX - d.startX) / r.width) * 100)),
        y: Math.min(100, Math.max(0, d.y + ((e.clientY - d.startY) / r.height) * 100)),
      });
      return;
    }

    const { cx, cy } = centerPx();
    const startDist = Math.hypot(d.startX - cx, d.startY - cy) || 1;
    const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
    const startAngle = Math.atan2(d.startY - cy, d.startX - cx);
    const angle = Math.atan2(e.clientY - cy, e.clientX - cx);

    onChange({
      size: Math.min(140, Math.max(12, Math.round(d.size * (dist / startDist)))),
      rotation: Math.round(d.rotation + ((angle - startAngle) * 180) / Math.PI),
    });
  };

  const end = (e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    drag.current = null;
  };

  return (
    <div
      className="absolute z-30"
      style={{
        left: `${layer.x}%`,
        top: `${layer.y}%`,
        transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
        touchAction: "none",
        pointerEvents: locked ? "none" : "auto",
      }}
      onPointerDown={start("move")}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div
        className={`px-2 py-1 font-black text-center whitespace-nowrap ${
          active ? "border border-dashed border-white/70 rounded-xl" : ""
        }`}
        style={{
          color: layer.color,
          fontSize: `${layer.size}px`,
          textShadow: "0 2px 8px rgba(0,0,0,.7)",
        }}
      >
        {layer.text || " "}
      </div>

      {active && !locked && (
        <>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onRemove}
            className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-black/80 border border-white/20 flex items-center justify-center"
          >
            <X size={14} />
          </button>

          <div
            onPointerDown={start("scale")}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            className="absolute -bottom-3 -right-3 w-7 h-7 rounded-full bg-white text-black flex items-center justify-center cursor-nwse-resize"
            style={{ touchAction: "none" }}
          >
            <RotateCcw size={13} />
          </div>
        </>
      )}
    </div>
  );
}

// =====================================================
// FREE CROP OVERLAY
// =====================================================

function AudioTimeline({
  duration,
  start,
  end,
  onChangeStart,
}: {
  duration: number;
  start: number;
  end: number;
  onChangeStart: (start: number) => void;
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const selectionLength = Math.max(0, end - start);
  const safeDuration = Math.max(duration, 0.1);
  const maxStart = Math.max(0, duration - selectionLength);

  const updateFromClientX = (clientX: number) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect || !duration) return;
    const position = ((clientX - rect.left) / rect.width) * duration;
    onChangeStart(Math.min(maxStart, Math.max(0, position - selectionLength / 2)));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!duration) return;
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromClientX(event.clientX);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragging.current) updateFromClientX(event.clientX);
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  return (
    <div className="space-y-1.5">
      <div
        ref={timelineRef}
        role="slider"
        tabIndex={duration ? 0 : -1}
        aria-label="Move selected audio segment"
        aria-valuemin={0}
        aria-valuemax={maxStart}
        aria-valuenow={Math.round(start * 10) / 10}
        className="relative h-14 touch-none select-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2 outline-none focus-visible:ring-2 focus-visible:ring-pink-400/80"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const step = event.shiftKey ? 5 : 1;
          onChangeStart(
            Math.min(
              maxStart,
              Math.max(0, start + (event.key === "ArrowRight" ? step : -step)),
            ),
          );
        }}
      >
        <div className="absolute inset-2 flex items-center justify-between gap-0.5 opacity-55">
          {Array.from({ length: 48 }, (_, index) => {
            const height = 28 + ((index * 37) % 68);
            return (
              <span
                key={index}
                className="w-full rounded-full bg-white/45"
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>

        <div
          className="pointer-events-none absolute bottom-1.5 top-1.5 rounded-lg border border-pink-200/90 bg-pink-400/20 shadow-[0_0_22px_rgba(236,72,153,0.24)]"
          style={{
            left: `${(start / safeDuration) * 100}%`,
            width: `${(selectionLength / safeDuration) * 100}%`,
          }}
        >
          <span className="absolute bottom-0 left-0 top-0 w-1 rounded-full bg-white" />
          <span className="absolute bottom-0 right-0 top-0 w-1 rounded-full bg-white" />
        </div>
      </div>

      <div className="flex items-center justify-between font-mono text-[10px] text-white/55">
        <span>{fmtTime(start)}</span>
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-white/80">
          {fmtTime(start)} / {fmtTime(duration)}
        </span>
        <span>{fmtTime(end)}</span>
      </div>
    </div>
  );
}

function CropOverlay({
  rect,
  onChange,
  frameRef,
}: {
  rect: Rect;
  onChange: (r: Rect) => void;
  frameRef: React.RefObject<HTMLDivElement | null>;
}) {
  const drag = useRef<{
    handle: "move" | "nw" | "ne" | "sw" | "se";
    startX: number;
    startY: number;
    rect: Rect;
  } | null>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<{
    rect: Rect;
    distance: number;
    centerX: number;
    centerY: number;
  } | null>(null);
  const gridTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [gridActive, setGridActive] = useState(false);

  const showGrid = () => {
    setGridActive(true);
    if (gridTimer.current) clearTimeout(gridTimer.current);
    gridTimer.current = setTimeout(() => setGridActive(false), 650);
  };

  const pointerDistance = (points: { x: number; y: number }[]) => {
    const a = points[0];
    const b = points[1];
    if (!a || !b) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const start =
    (handle: "move" | "nw" | "ne" | "sw" | "se") =>
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      showGrid();

      if (handle === "move") {
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const points = [...pointers.current.values()];
        if (points.length >= 2) {
          const frame = frameRef.current?.getBoundingClientRect();
          const center = points.reduce(
            (result, point) => ({
              x: result.x + point.x / points.length,
              y: result.y + point.y / points.length,
            }),
            { x: 0, y: 0 },
          );
          pinch.current = {
            rect,
            distance: Math.max(1, pointerDistance(points)),
            centerX: frame ? (center.x - frame.left) / frame.width : center.x,
            centerY: frame ? (center.y - frame.top) / frame.height : center.y,
          };
          drag.current = null;
        } else {
          drag.current = { handle, startX: e.clientX, startY: e.clientY, rect };
        }
        return;
      }

      drag.current = { handle, startX: e.clientX, startY: e.clientY, rect };
    };

  const move = (e: React.PointerEvent) => {
    const r = frameRef.current?.getBoundingClientRect();
    if (!r) return;

    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    const pinchState = pinch.current;
    const activePoints = [...pointers.current.values()];
    if (pinchState && activePoints.length >= 2) {
      const points = activePoints.slice(0, 2);
      const center = points.reduce(
        (result, point) => ({
          x: result.x + point.x / points.length,
          y: result.y + point.y / points.length,
        }),
        { x: 0, y: 0 },
      );
      // A wider finger distance should zoom the media in, which means the
      // crop window becomes smaller around the current pinch center.
      const scale = pinchState.distance / pointerDistance(points);
      const width = Math.min(1, Math.max(0.1, pinchState.rect.w * scale));
      const height = Math.min(1, Math.max(0.1, pinchState.rect.h * scale));
      const centerX = (center.x - r.left) / r.width;
      const centerY = (center.y - r.top) / r.height;
      onChange({
        x: Math.min(1 - width, Math.max(0, centerX - width / 2)),
        y: Math.min(1 - height, Math.max(0, centerY - height / 2)),
        w: width,
        h: height,
      });
      showGrid();
      return;
    }

    const d = drag.current;
    if (!d) return;

    const dx = (e.clientX - d.startX) / r.width;
    const dy = (e.clientY - d.startY) / r.height;
    const b = d.rect;
    const MIN = 0.1;

    if (d.handle === "move") {
      onChange({
        ...b,
        x: Math.min(1 - b.w, Math.max(0, b.x + dx)),
        y: Math.min(1 - b.h, Math.max(0, b.y + dy)),
      });
      return;
    }

    let x = b.x;
    let y = b.y;
    let w = b.w;
    let h = b.h;
    const right = b.x + b.w;
    const bottom = b.y + b.h;

    if (d.handle === "nw" || d.handle === "sw") {
      x = clamp01(Math.min(right - MIN, b.x + dx));
      w = right - x;
    } else {
      w = Math.max(MIN, Math.min(1 - b.x, b.w + dx));
    }

    if (d.handle === "nw" || d.handle === "ne") {
      y = clamp01(Math.min(bottom - MIN, b.y + dy));
      h = bottom - y;
    } else {
      h = Math.max(MIN, Math.min(1 - b.y, b.h + dy));
    }

    onChange({ x, y, w, h });
  };

  const end = (e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;

    const remaining = [...pointers.current.values()][0];
    if (remaining) {
      drag.current = {
        handle: "move",
        startX: remaining.x,
        startY: remaining.y,
        rect,
      };
    } else {
      drag.current = null;
      pinch.current = null;
      showGrid();
    }
  };

  const handles: Array<["nw" | "ne" | "sw" | "se", string]> = [
    ["nw", "-top-2 -left-2 cursor-nwse-resize"],
    ["ne", "-top-2 -right-2 cursor-nesw-resize"],
    ["sw", "-bottom-2 -left-2 cursor-nesw-resize"],
    ["se", "-bottom-2 -right-2 cursor-nwse-resize"],
  ];

  return (
    <div
      className="absolute inset-0 z-[55]"
      style={{ touchAction: "none" }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div
        className="absolute border-2 border-white"
        style={{
          left: `${rect.x * 100}%`,
          top: `${rect.y * 100}%`,
          width: `${rect.w * 100}%`,
          height: `${rect.h * 100}%`,
          boxShadow: "0 0 0 9999px rgba(0,0,0,.45)",
        }}
        onPointerDown={start("move")}
      >
        <div
          className={`pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 transition-opacity duration-300 ${
            gridActive ? "opacity-100" : "opacity-20"
          }`}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-white/25" />
          ))}
        </div>

        {handles.map(([id, cls]) => (
          <div
            key={id}
            onPointerDown={start(id)}
            className={`absolute w-5 h-5 rounded-full bg-white ${cls}`}
            style={{ touchAction: "none" }}
          />
        ))}
      </div>
    </div>
  );
}

void CropOverlay;
