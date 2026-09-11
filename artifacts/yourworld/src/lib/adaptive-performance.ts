import { useEffect, useSyncExternalStore } from "react";

export type NetworkQuality = "fast" | "normal" | "weak" | "offline";
export type DeviceCapability = "capable" | "constrained";

type NetworkInformationLike = {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

export type AdaptivePerformanceSnapshot = {
  networkQuality: NetworkQuality;
  deviceCapability: DeviceCapability;
  effectiveType: string | null;
  downlinkMbps: number | null;
  rttMs: number | null;
  saveData: boolean;
  recommendedVideoTier: "480p" | "720p" | "1080p" | "2160p";
  videoBitrate: number;
  videoFrameRate: number;
  videoScaleResolutionDownBy: number;
};

const SERVER_SNAPSHOT: AdaptivePerformanceSnapshot = {
  networkQuality: "normal",
  deviceCapability: "capable",
  effectiveType: null,
  downlinkMbps: null,
  rttMs: null,
  saveData: false,
  recommendedVideoTier: "720p",
  videoBitrate: 1_000_000,
  videoFrameRate: 24,
  videoScaleResolutionDownBy: 1,
};

let snapshot = SERVER_SNAPSHOT;
let started = false;
let mediaPenaltyUntil = 0;
const listeners = new Set<() => void>();

function connectionInfo(): NetworkInformationLike | null {
  if (typeof navigator === "undefined") return null;
  return (navigator as Navigator & { connection?: NetworkInformationLike }).connection ?? null;
}

function deviceCapability(): DeviceCapability {
  if (typeof navigator === "undefined") return "capable";
  const memory = Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory);
  const cores = Number(navigator.hardwareConcurrency);
  const hasSmallScreen = typeof window !== "undefined" && Math.min(window.innerWidth, window.innerHeight) <= 360;
  if ((Number.isFinite(memory) && memory > 0 && memory <= 2) ||
      (Number.isFinite(cores) && cores > 0 && cores <= 4 && memory <= 4) ||
      hasSmallScreen) {
    return "constrained";
  }
  return "capable";
}

export function classifyNetworkQuality(input: {
  online?: boolean;
  effectiveType?: string | null;
  downlink?: number | null;
  rtt?: number | null;
  saveData?: boolean;
}): NetworkQuality {
  if (input.online === false) return "offline";
  if (input.saveData || input.effectiveType === "slow-2g" || input.effectiveType === "2g") return "weak";
  const downlink = Number(input.downlink);
  const rtt = Number(input.rtt);
  if ((Number.isFinite(downlink) && downlink > 0 && downlink < 1.2) ||
      (Number.isFinite(rtt) && rtt >= 600)) {
    return "weak";
  }
  if (input.effectiveType === "5g" ||
      (Number.isFinite(downlink) && downlink >= 8 && (!Number.isFinite(rtt) || rtt < 180))) {
    return "fast";
  }
  return "normal";
}

function classifyNetwork(info: NetworkInformationLike | null): NetworkQuality {
  return classifyNetworkQuality({
    online: typeof navigator === "undefined" ? true : navigator.onLine !== false,
    effectiveType: info?.effectiveType,
    downlink: info?.downlink,
    rtt: info?.rtt,
    saveData: info?.saveData,
  });
}

function lowerQuality(quality: NetworkQuality): NetworkQuality {
  if (quality === "fast") return "normal";
  if (quality === "normal") return "weak";
  return quality;
}

function buildSnapshot(): AdaptivePerformanceSnapshot {
  const info = connectionInfo();
  let quality = classifyNetwork(info);
  if (quality !== "offline" && mediaPenaltyUntil > Date.now()) quality = lowerQuality(quality);

  const capability = deviceCapability();
  const constrained = capability === "constrained";
  if (quality === "fast") {
    return {
      networkQuality: quality,
      deviceCapability: capability,
      effectiveType: info?.effectiveType ?? null,
      downlinkMbps: Number.isFinite(Number(info?.downlink)) ? Number(info?.downlink) : null,
      rttMs: Number.isFinite(Number(info?.rtt)) ? Number(info?.rtt) : null,
      saveData: info?.saveData === true,
      recommendedVideoTier: constrained ? "1080p" : "2160p",
      videoBitrate: constrained ? 1_500_000 : 2_500_000,
      videoFrameRate: 30,
      videoScaleResolutionDownBy: 1,
    };
  }
  if (quality === "weak" || quality === "offline") {
    return {
      networkQuality: quality,
      deviceCapability: capability,
      effectiveType: info?.effectiveType ?? null,
      downlinkMbps: Number.isFinite(Number(info?.downlink)) ? Number(info?.downlink) : null,
      rttMs: Number.isFinite(Number(info?.rtt)) ? Number(info?.rtt) : null,
      saveData: info?.saveData === true,
      recommendedVideoTier: "480p",
      videoBitrate: 450_000,
      videoFrameRate: 15,
      videoScaleResolutionDownBy: constrained ? 2 : 1.5,
    };
  }
  return {
    networkQuality: quality,
    deviceCapability: capability,
    effectiveType: info?.effectiveType ?? null,
    downlinkMbps: Number.isFinite(Number(info?.downlink)) ? Number(info?.downlink) : null,
    rttMs: Number.isFinite(Number(info?.rtt)) ? Number(info?.rtt) : null,
    saveData: info?.saveData === true,
    recommendedVideoTier: constrained ? "720p" : "1080p",
    videoBitrate: constrained ? 700_000 : 1_000_000,
    videoFrameRate: 24,
    videoScaleResolutionDownBy: constrained ? 1.5 : 1,
  };
}

function refresh() {
  const next = buildSnapshot();
  if (JSON.stringify(next) === JSON.stringify(snapshot)) return;
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  const info = connectionInfo();
  const update = () => refresh();
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  info?.addEventListener?.("change", update);
  snapshot = buildSnapshot();
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  start();
  return snapshot;
}

export function getAdaptivePerformanceSnapshot() {
  return getSnapshot();
}

export function useAdaptivePerformance() {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}

export function reportAdaptiveMediaEvent(event: "stalled" | "waiting" | "playing") {
  if (event === "stalled" || event === "waiting") {
    mediaPenaltyUntil = Date.now() + 15_000;
  } else if (Date.now() >= mediaPenaltyUntil) {
    mediaPenaltyUntil = 0;
  }
  refresh();
}

export function waitForNetwork(timeoutMs = 30_000): Promise<boolean> {
  if (getAdaptivePerformanceSnapshot().networkQuality !== "offline") return Promise.resolve(true);
  return new Promise((resolve) => {
    let timer: number | null = null;
    const stop = subscribe(() => {
      if (getAdaptivePerformanceSnapshot().networkQuality === "offline") return;
      if (timer) window.clearTimeout(timer);
      stop();
      resolve(true);
    });
    timer = window.setTimeout(() => {
      stop();
      resolve(getAdaptivePerformanceSnapshot().networkQuality !== "offline");
    }, timeoutMs);
  });
}

export function adaptiveCameraCaptureAttempts(
  facingMode: "user" | "environment",
): MediaStreamConstraints[] {
  const profile = getAdaptivePerformanceSnapshot();
  const dimensions =
    profile.networkQuality === "weak" || profile.networkQuality === "offline"
      ? { width: 640, height: 480, frameRate: 24 }
      : profile.networkQuality === "normal" || profile.deviceCapability === "constrained"
        ? { width: 960, height: 540, frameRate: 30 }
        : { width: 1280, height: 720, frameRate: 30 };
  const audio: MediaTrackConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };
  return [
    {
      video: {
        facingMode,
        width: { ideal: dimensions.width, max: dimensions.width },
        height: { ideal: dimensions.height, max: dimensions.height },
        frameRate: { ideal: dimensions.frameRate, max: dimensions.frameRate },
      },
      audio,
    },
    { video: { facingMode }, audio },
    { video: { facingMode }, audio: true },
  ];
}

function AdaptiveMediaController() {
  const performance = useAdaptivePerformance();

  useEffect(() => {
    const videos = new Set<HTMLVideoElement>();
    const visible = new WeakMap<HTMLVideoElement, boolean>();
    const handlers = new Map<HTMLVideoElement, {
      play: () => void;
      waiting: () => void;
      playing: () => void;
    }>();
    const io = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            const video = entry.target as HTMLVideoElement;
            const isVisible = entry.isIntersecting && entry.intersectionRatio > 0.15;
            visible.set(video, isVisible);
            if (!isVisible && !video.paused && !video.srcObject) video.pause();
            syncVideo(video, performance, isVisible);
          });
        }, { threshold: [0, 0.15, 0.5] })
      : null;

    const syncVideo = (video: HTMLVideoElement, current: AdaptivePerformanceSnapshot, isVisible = true) => {
      if (video.srcObject) return;
      video.playsInline = true;
      if (current.networkQuality === "offline" || (!isVisible && video.paused) ||
          (current.networkQuality === "weak" && video.paused)) {
        video.preload = "none";
      } else {
        video.preload = "metadata";
      }
    };
    const observeVideo = (video: HTMLVideoElement) => {
      if (videos.has(video)) {
        syncVideo(video, performance, visible.get(video) ?? true);
        return;
      }
      videos.add(video);
      visible.set(video, true);
      const play = () => {
        if (video.srcObject) return;
        videos.forEach((other) => {
          if (other !== video && !other.srcObject && !other.dataset.adaptiveMulti && !other.paused) {
            other.pause();
          }
        });
      };
      const waiting = () => reportAdaptiveMediaEvent("waiting");
      const playing = () => reportAdaptiveMediaEvent("playing");
      handlers.set(video, { play, waiting, playing });
      video.addEventListener("play", play);
      video.addEventListener("waiting", waiting);
      video.addEventListener("stalled", waiting);
      video.addEventListener("playing", playing);
      io?.observe(video);
      syncVideo(video, performance);
    };
    const scan = () => document.querySelectorAll("video").forEach((video) => observeVideo(video));
    scan();
    const mutation = typeof MutationObserver !== "undefined"
      ? new MutationObserver(scan)
      : null;
    mutation?.observe(document.body, { childList: true, subtree: true });
    return () => {
      mutation?.disconnect();
      io?.disconnect();
      handlers.forEach((handler, video) => {
        video.removeEventListener("play", handler.play);
        video.removeEventListener("waiting", handler.waiting);
        video.removeEventListener("stalled", handler.waiting);
        video.removeEventListener("playing", handler.playing);
      });
      videos.clear();
    };
  }, [performance]);

  return null;
}

export { AdaptiveMediaController };