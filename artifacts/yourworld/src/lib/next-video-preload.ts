import Hls from "hls.js";
import { auxiliaryVideoSlot } from "./auxiliary-video";
import { releaseListVideo } from "./media-release";
import { cacheVideoPoster, getVideoPoster } from "./video-prefetch";
import { isHlsMediaUrl, supportsNativeHls } from "./video-playback-engine";

/** Exactly one paused next-video preload; visible poster work shares its slot. */
export function preloadNextVideo(url: string, posterKey = url) {
  const owner = {};
  let disposed = false;
  let failed = false;
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
    video.preload = "metadata";
    video.addEventListener("loadedmetadata", () => {
      if (video) video.currentTime = Math.min(0.1, Number.isFinite(video.duration) ? video.duration / 2 : 0.1);
    });
    video.addEventListener("loadeddata", () => {
      if (video && !getVideoPoster(posterKey)) cacheVideoPoster(video, posterKey);
    });
    video.addEventListener("error", () => { failed = true; clear(); }, { once: true });
    if (isHlsMediaUrl(url) && !supportsNativeHls(video)) {
      if (!Hls.isSupported()) { clear(); return; }
      hls = new Hls({ maxBufferLength: 1, maxMaxBufferLength: 1, maxBufferSize: 2 * 1024 * 1024 });
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