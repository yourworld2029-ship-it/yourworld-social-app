export const VIDEO_QUALITY_TIERS = [
  { id: "360p", label: "360p", shortSide: 360, bitrate: 600_000 },
  { id: "480p", label: "480p", shortSide: 480, bitrate: 900_000 },
  { id: "720p", label: "720p", shortSide: 720, bitrate: 2_500_000 },
  { id: "1080p", label: "1080p", shortSide: 1080, bitrate: 5_000_000 },
  { id: "1440p", label: "1440p / 2K", shortSide: 1440, bitrate: 9_000_000 },
  { id: "2160p", label: "2160p / 4K", shortSide: 2160, bitrate: 18_000_000 },
  { id: "4320p", label: "4320p / 8K", shortSide: 4320, bitrate: 45_000_000 },
] as const;

export type VideoQualityTier = (typeof VIDEO_QUALITY_TIERS)[number]["id"];

export function qualityTierFromDimensions(
  width: number | null | undefined,
  height: number | null | undefined,
): VideoQualityTier | null {
  const w = Number(width);
  const h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) return null;
  const shortSide = Math.min(w, h);
  let tier: VideoQualityTier | null = null;
  for (const candidate of VIDEO_QUALITY_TIERS) {
    if (shortSide >= candidate.shortSide) tier = candidate.id;
  }
  return tier;
}

export function qualityTierFromMetadata(
  sourceTier: string | null | undefined,
  width: number | null | undefined,
  height: number | null | undefined,
): VideoQualityTier | null {
  const declaredTier = isVideoQualityTier(sourceTier) ? sourceTier : null;
  const dimensionTier = qualityTierFromDimensions(width, height);
  const hasDimensions =
    Number.isFinite(Number(width)) &&
    Number.isFinite(Number(height)) &&
    Number(width) > 0 &&
    Number(height) > 0;
  if (hasDimensions && !dimensionTier) return null;
  if (!declaredTier || !dimensionTier) return declaredTier ?? dimensionTier;

  const declaredIndex = VIDEO_QUALITY_TIERS.findIndex((candidate) => candidate.id === declaredTier);
  const dimensionIndex = VIDEO_QUALITY_TIERS.findIndex((candidate) => candidate.id === dimensionTier);
  return VIDEO_QUALITY_TIERS[Math.min(declaredIndex, dimensionIndex)]?.id ?? null;
}

export function qualityTierLabel(tier: VideoQualityTier | null | undefined) {
  return VIDEO_QUALITY_TIERS.find((candidate) => candidate.id === tier)?.label ?? "Unknown";
}

export function isVideoQualityTier(value: string | null | undefined): value is VideoQualityTier {
  return VIDEO_QUALITY_TIERS.some((candidate) => candidate.id === value);
}

export function availableVideoQualityTiers(
  sourceTier: VideoQualityTier | null | undefined,
) {
  if (!sourceTier) return [];
  const sourceIndex = VIDEO_QUALITY_TIERS.findIndex((candidate) => candidate.id === sourceTier);
  return VIDEO_QUALITY_TIERS.slice(0, sourceIndex + 1);
}

export function estimateDownloadSizeMb(
  durationSeconds: number | null | undefined,
  tier: VideoQualityTier | "mp3" | "original",
) {
  const duration = Number(durationSeconds);
  if (!Number.isFinite(duration) || duration <= 0) return null;
  if (tier === "original") return null;
  if (tier === "mp3") {
    return Math.ceil((duration * 128_000) / 8 / 1_000_000);
  }
  const definition = VIDEO_QUALITY_TIERS.find((candidate) => candidate.id === tier);
  if (!definition) return null;
  // Estimate includes a small audio track in addition to the tier's video bitrate.
  return Math.ceil((duration * (definition.bitrate + 128_000)) / 8 / 1_000_000);
}

export function formatDownloadSizeMb(sizeMb: number | null) {
  if (sizeMb == null || !Number.isFinite(sizeMb)) return "Size varies";
  return sizeMb >= 1_000
    ? `about ${(sizeMb / 1_000).toFixed(1)} GB`
    : `about ${sizeMb} MB`;
}