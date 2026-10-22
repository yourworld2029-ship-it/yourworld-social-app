import Hls from "hls.js";
import { auxiliaryVideoSlot } from "./auxiliary-video";
import { releaseListVideo } from "./media-release";
import { cacheVideoPoster, getVideoPoster } from "./video-prefetch";
import { isHlsMediaUrl, supportsNativeHls } from "./video-playback-engine";
import {
  hasNextVideoPrebuffer,
  NEXT_VIDEO_PRELOAD_SECONDS,
} from "./next-video-preload-utils";

/** One auxiliary decoder preloads only the next video's opening two seconds. */
export function preloadNextVideo(url: string, posterKey = url) {
  const owner = {};
  let disposed = false;
  let failed = false;
  let prebufferReady = false;
  let video: HTMLVideoElement | null = null;
  let hls: Hls | null = null;
  let release: (() => void) | null = null;
  const clear = () => {
    hls?.destroy(); hls = null;
    releaseListVideo(video); video = null;
    const previous = release; release = null; previous?.();
  };
  const start = () => {
    if (disposed || failed || video || typeof document === "undefined" || document.visibilityState === "hidden") return;
    release = auxiliaryVideoSlot.acquire(owner, 0, clear);
    if (!release) return;
    video = document.createElement("video");
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    const stopAfterOpeningBuffer = () => {
      if (!video || prebufferReady) return;
      const playedOpening = video.currentTime >= NEXT_VIDEO_PRELOAD_SECONDS;
      if (!playedOpening && !hasNextVideoPrebuffer(video.buffered, video.duration)) return;
      prebufferReady = true;
      video.pause();
      video.preload = "metadata";
      if (video.currentTime > 0) {
        try {
          video.currentTime = 0;
        } catch {
          // Keep the buffered media if this browser cannot seek yet.
        }
      }
      hls?.stopLoad();
    };
    video.addEventListener("progress", stopAfterOpeningBuffer);
    video.addEventListener("canplay", stopAfterOpeningBuffer);
    video.addEventListener("timeupdate", stopAfterOpeningBuffer);
    video.addEventListener("loadedmetadata", () => {
      if (!video) return;
      video.currentTime = Math.min(
        0.1,
        Number.isFinite(video.duration) ? video.duration / 2 : 0.1,
      );
      void video.play().catch(() => undefined);
    });
    video.addEventListener("loadeddata", () => {
      if (video && !getVideoPoster(posterKey)) cacheVideoPoster(video, posterKey);
    });
    video.addEventListener("error", () => { failed = true; clear(); }, { once: true });
    if (isHlsMediaUrl(url) && !supportsNativeHls(video)) {
      if (!Hls.isSupported()) { clear(); return; }
      hls = new Hls({
        maxBufferLength: NEXT_VIDEO_PRELOAD_SECONDS,
        maxMaxBufferLength: NEXT_VIDEO_PRELOAD_SECONDS,
        maxBufferSize: 2 * 1024 * 1024,
      });
      hls.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) { failed = true; clear(); } });
      hls.loadSource(url);
      hls.attachMedia(video);
    } else {
      video.src = url;
      video.load();
    }
  };
  const unsubscribe = auxiliaryVideoSlot.subscribe(start);
  start();
  return () => { disposed = true; unsubscribe(); clear(); };
}