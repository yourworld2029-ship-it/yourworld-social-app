import Hls from "hls.js";
import { getAdaptivePerformanceSnapshot } from "@/lib/adaptive-performance";

type NetworkConnection = EventTarget & {
  downlink?: number;
  effectiveType?: string;
  saveData?: boolean;
};

function getNetworkConnection() {
  if (typeof navigator === "undefined") return null;
  return (navigator as Navigator & { connection?: NetworkConnection }).connection ?? null;
}

export function getHlsNetworkHeightCap() {
  const connection = getNetworkConnection();
  const networkQuality = getAdaptivePerformanceSnapshot().networkQuality;
  const effectiveType = connection?.effectiveType?.toLowerCase();
  const downlink = connection?.downlink;

  if (
    connection?.saveData ||
    effectiveType === "slow-2g" ||
    effectiveType === "2g" ||
    networkQuality === "weak" ||
    networkQuality === "offline" ||
    (typeof downlink === "number" && downlink < 1.5)
  ) {
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

export function createVideoHlsConfig() {
  return {
    enableWorker: true,
    lowLatencyMode: true,
    autoStartLoad: true,
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
  const update = () => {
    const cap = getHlsNetworkHeightCap();
    let bestIndex = -1;
    let bestHeight = 0;
    hls.levels.forEach((level, index) => {
      if (level.height > 0 && level.height <= cap && level.height > bestHeight) {
        bestHeight = level.height;
        bestIndex = index;
      }
    });
    hls.autoLevelCapping = bestIndex;
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    connection?.removeEventListener("change", update);
  };

  connection?.addEventListener("change", update);
  hls.on(Hls.Events.MANIFEST_PARSED, update);
  hls.on(Hls.Events.LEVELS_UPDATED, update);
  hls.on(Hls.Events.DESTROYING, dispose);
  update();
  return dispose;
}