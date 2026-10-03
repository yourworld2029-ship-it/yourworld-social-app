import Hls from "hls.js";
import { auxiliaryVideoSlot } from "./auxiliary-video";
import { releaseListVideo } from "./media-release";
import { cacheVideoPoster, getVideoPoster } from "./video-prefetch";
import { resolveLongVideoUrl } from "./video-data";
import { isHlsMediaUrl, supportsNativeHls } from "./video-playback-engine";

type Job = { url: string; signal: AbortSignal; done: (frame: string | null) => void };
const jobs: Job[] = [];
let running = false;

/** Paused metadata/0.1-second seeks, serialized across every visible card. */
export function requestVideoFirstFrame(url: string, signal: AbortSignal, done: Job["done"]) {
  const cached = getVideoPoster(url);
  if (cached) { done(cached); return; }
  jobs.push({ url, signal, done });
  pump();
}

auxiliaryVideoSlot.subscribe(() => pump());

function pump() {
  if (running || typeof document === "undefined") return;
  while (jobs[0]?.signal.aborted) jobs.shift();
  const job = jobs[0];
  if (!job) return;
  const existing = getVideoPoster(job.url);
  if (existing) { jobs.shift(); job.done(existing); queueMicrotask(pump); return; }
  const owner = {};
  let cancel = () => {};
  const release = auxiliaryVideoSlot.acquire(owner, 1, () => cancel());
  if (!release) return;
  jobs.shift();
  running = true;
  const video = document.createElement("video");
  let hls: Hls | null = null;
  let finished = false;
  const finish = (frame: string | null) => {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
    job.signal.removeEventListener("abort", abort);
    hls?.destroy();
    releaseListVideo(video);
    release();
    running = false;
    if (!job.signal.aborted) job.done(frame);
    queueMicrotask(pump);
  };
  cancel = () => finish(null);
  const abort = () => finish(null);
  const timeout = setTimeout(() => finish(null), 15_000);
  job.signal.addEventListener("abort", abort, { once: true });
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  video.preload = "metadata";
  const capture = () => {
    if (video.readyState < 2 || !video.videoWidth) return;
    finish(cacheVideoPoster(video, job.url));
  };
  video.addEventListener("loadedmetadata", () => {
    if (finished) return;
    video.currentTime = Math.min(0.1, Number.isFinite(video.duration) ? video.duration / 2 : 0.1);
  });
  video.addEventListener("seeked", capture);
  video.addEventListener("loadeddata", () => { if (video.currentTime >= 0.05) capture(); });
  video.addEventListener("error", () => finish(null), { once: true });
  void resolveLongVideoUrl(job.url).then((url) => {
    if (finished || job.signal.aborted) return;
    if (!url) { finish(null); return; }
    if (isHlsMediaUrl(url) && !supportsNativeHls(video)) {
      if (!Hls.isSupported()) { finish(null); return; }
      hls = new Hls({ startPosition: 0.1, maxBufferLength: 1, maxMaxBufferLength: 1, maxBufferSize: 2 * 1024 * 1024 });
      hls.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) finish(null); });
      hls.loadSource(url);
      hls.attachMedia(video);
    } else {
      const source = new URL(url, window.location.href);
      source.hash = "t=0.1";
      video.src = source.toString();
      video.load();
    }
  }).catch(() => finish(null));
}