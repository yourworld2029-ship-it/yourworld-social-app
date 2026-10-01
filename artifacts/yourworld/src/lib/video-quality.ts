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
export type DownloadQualityUrls = Partial<Record<VideoQualityTier, string>>;

export type StoredSourceQualityTier =
  | VideoQualityTier
  | "2k"
  | "4k"
  | "original"
  | "high"
  | "standard";

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

export function sourceQualityTierFromDimensions(
  width: number | null | undefined,
  height: number | null | undefined,
): StoredSourceQualityTier | null {
  const tier = qualityTierFromDimensions(width, height);
  if (tier === "1440p") return "2k";
  if (tier === "2160p") return "4k";
  return tier;
}

export function qualityTierFromSourceMetadata(
  sourceTier: string | null | undefined,
): VideoQualityTier | null {
  if (sourceTier === "2k") return "1440p";
  if (sourceTier === "4k") return "2160p";
  return isVideoQualityTier(sourceTier) ? sourceTier : null;
}

export function qualityTierFromMetadata(
  sourceTier: string | null | undefined,
  width: number | null | undefined,
  height: number | null | undefined,
): VideoQualityTier | null {
  const declaredTier = qualityTierFromSourceMetadata(sourceTier);
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

export function availableDownloadQualityTiers(
  qualityUrls?: DownloadQualityUrls | null,
) {
  return VIDEO_QUALITY_TIERS.filter((tier) => Boolean(qualityUrls?.[tier.id]?.trim()));
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

export function estimateDownloadSizeMbFromSourceFile(
  sourceFileSizeBytes: number | null | undefined,
  sourceTier: VideoQualityTier | null | undefined,
  targetTier: VideoQualityTier | "original",
) {
  const sizeBytes = Number(sourceFileSizeBytes);
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return null;
  if (targetTier === "original") return sizeBytes / 1_000_000;

  const sourceDefinition = VIDEO_QUALITY_TIERS.find((candidate) => candidate.id === sourceTier);
  const targetDefinition = VIDEO_QUALITY_TIERS.find((candidate) => candidate.id === targetTier);
  if (!sourceDefinition || !targetDefinition) return null;

  const audioBitrate = 128_000;
  return Math.ceil(
    (sizeBytes * (targetDefinition.bitrate + audioBitrate)) /
      (sourceDefinition.bitrate + audioBitrate) /
      1_000_000,
  );
}

export function formatDownloadSizeMb(sizeMb: number | null, exact = false) {
  if (sizeMb == null || !Number.isFinite(sizeMb) || sizeMb <= 0) {
    return "Size unavailable";
  }
  const formatted = sizeMb >= 1_000
    ? `${(sizeMb / 1_000).toFixed(1)} GB`
    : `${sizeMb >= 10 ? Math.round(sizeMb) : sizeMb.toFixed(1)} MB`;
  return exact ? formatted : `≈ ${formatted}`;
}