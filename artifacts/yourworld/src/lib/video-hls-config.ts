import Hls from "hls.js";
import { getAdaptivePerformanceSnapshot } from "@/lib/adaptive-performance";
import { HlsPrefetchCacheLoader } from "@/lib/hls-prefetch-cache";

type NetworkConnection = EventTarget & {
  downlink?: number;
  effectiveType?: string;
  saveData?: boolean;
};

export type HlsQualityLevel = {
  width?: number | null;
  height?: number | null;
  bitrate?: number | null;
};

export function hlsLevelResolution(level: HlsQualityLevel) {
  const width = Number(level.width);
  const height = Number(level.height);
  const validWidth = Number.isFinite(width) && width > 0;
  const validHeight = Number.isFinite(height) && height > 0;
  if (validWidth && validHeight) return Math.min(width, height);
  if (validHeight) return height;
  if (validWidth) return width;
  return 0;
}

export function selectHlsLevelAtOrBelow(
  levels: readonly HlsQualityLevel[],
  resolutionCap: number,
) {
  return levels
    .map((level, index) => ({
      index,
      resolution: hlsLevelResolution(level),
      bitrate: Number(level.bitrate) || 0,
    }))
    .filter(
      (level) =>
        Number.isFinite(level.resolution) &&
        level.resolution > 0 &&
        level.resolution <= resolutionCap,
    )
    .sort(
      (a, b) =>
        b.resolution - a.resolution ||
        b.bitrate - a.bitrate,
    )[0]?.index ?? -1;
}

function getNetworkConnection() {
  if (typeof navigator === "undefined") return null;
  return (navigator as Navigator & { connection?: NetworkConnection }).connection ?? null;
}

export function getHlsNetworkHeightCap(measuredBandwidthBps?: number | null) {
  const connection = getNetworkConnection();
  const networkQuality = getAdaptivePerformanceSnapshot().networkQuality;
  const effectiveType = connection?.effectiveType?.toLowerCase();
  const downlink = connection?.downlink;

  if (
    (typeof measuredBandwidthBps === "number" &&
      Number.isFinite(measuredBandwidthBps) &&
      measuredBandwidthBps > 0 &&
      measuredBandwidthBps < 1_000_000) ||
    connection?.saveData ||
    effectiveType === "slow-2g" ||
    effectiveType === "2g" ||
    networkQuality === "weak" ||
    networkQuality === "offline" ||
    (typeof downlink === "number" && downlink < 1)
  ) {
    return 360;
  }
  if (typeof downlink === "number" && downlink < 1.5) {
    return 480;
  }
  if (
    effectiveType === "3g" ||
    networkQuality === "normal" ||
    (typeof downlink === "number" && downlink < 3)
  ) {
    return 720;
  }
  return 1080;
}

export function selectHlsLevelIndex(
  levels: readonly HlsQualityLevel[],
  heightCap: number,
) {
  const available = levels
    .map((level, index) => ({
      index,
      resolution: hlsLevelResolution(level),
      bitrate: Number(level.bitrate) || 0,
    }))
    .filter((level) => Number.isFinite(level.resolution) && level.resolution > 0);
  const underCap = available.filter((level) => level.resolution <= heightCap);
  const candidates = underCap.length ? underCap : available;
  if (!candidates.length) return -1;
  return candidates.reduce((best, candidate) => {
    if (underCap.length) {
      if (candidate.resolution !== best.resolution) {
        return candidate.resolution > best.resolution ? candidate : best;
      }
      return candidate.bitrate > best.bitrate ? candidate : best;
    }
    if (candidate.resolution !== best.resolution) {
      return candidate.resolution < best.resolution ? candidate : best;
    }
    return candidate.bitrate < best.bitrate ? candidate : best;
  }).index;
}

function getInitialBandwidthEstimate() {
  const downlink = getNetworkConnection()?.downlink;
  if (typeof downlink === "number" && Number.isFinite(downlink) && downlink > 0) {
    return Math.max(350_000, Math.min(8_000_000, Math.round(downlink * 1_000_000 * 0.65)));
  }
  const quality = getAdaptivePerformanceSnapshot().networkQuality;
  if (quality === "weak" || quality === "offline") return 650_000;
  if (quality === "normal") return 1_500_000;
  return 3_000_000;
}

export function createVideoHlsConfig(startPosition = -1) {
  return {
    loader: HlsPrefetchCacheLoader,
    enableWorker: true,
    lowLatencyMode: true,
    autoStartLoad: true,
    startPosition:
      Number.isFinite(startPosition) && startPosition >= 0
        ? startPosition
        : -1,
    startLevel: -1,
    maxBufferLength: 3,
    maxMaxBufferLength: 6,
    maxBufferSize: 6 * 1024 * 1024,
    backBufferLength: 0,
    capLevelToPlayerSize: true,
    abrBandWidthFactor: 0.8,
    abrBandWidthUpFactor: 0.6,
    abrEwmaDefaultEstimate: getInitialBandwidthEstimate(),
  };
}

export function bindHlsNetworkAwareLevelCap(hls: Hls) {
  const connection = getNetworkConnection();
  let disposed = false;
  let measuredBandwidthBps: number | null = null;
  let healthyFragments = 0;
  const update = () => {
    const cap = getHlsNetworkHeightCap(measuredBandwidthBps);
    const capIndex = selectHlsLevelIndex(hls.levels, cap);
    hls.autoLevelCapping = capIndex;

    // Set only the next automatic fragment. Existing buffered media and the
    // currentTime remain intact while HLS.js moves down to a smaller rendition.
    if (
      cap <= 360 &&
      capIndex >= 0 &&
      hls.autoLevelEnabled &&
      hls.currentLevel > capIndex
    ) {
      hls.nextAutoLevel = capIndex;
    }
  };
  const updateFromBandwidthEstimate = () => {
    const estimate = Number(hls.bandwidthEstimate);
    if (!Number.isFinite(estimate) || estimate <= 0) return;
    if (estimate < 1_000_000) {
      measuredBandwidthBps = estimate;
      healthyFragments = 0;
    } else if (estimate >= 1_250_000) {
      healthyFragments += 1;
      if (healthyFragments >= 2) measuredBandwidthBps = null;
    } else {
      healthyFragments = 0;
    }
    update();
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    connection?.removeEventListener("change", update);
    hls.off(Hls.Events.FRAG_LOADED, updateFromBandwidthEstimate);
    hls.off(Hls.Events.MANIFEST_PARSED, update);
    hls.off(Hls.Events.LEVELS_UPDATED, update);
    hls.off(Hls.Events.DESTROYING, dispose);
  };

  connection?.addEventListener("change", update);
  hls.on(Hls.Events.FRAG_LOADED, updateFromBandwidthEstimate);
  hls.on(Hls.Events.MANIFEST_PARSED, update);
  hls.on(Hls.Events.LEVELS_UPDATED, update);
  hls.on(Hls.Events.DESTROYING, dispose);
  update();
  return dispose;
}