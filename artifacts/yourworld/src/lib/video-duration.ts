function parseDurationSeconds(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  if (!normalized) return null;

  if (/^\d+(?:\.\d+)?$/.test(normalized)) {
    const seconds = Number(normalized);
    return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
  }

  const parts = normalized.split(":");
  if (
    (parts.length !== 2 && parts.length !== 3) ||
    parts.some((part) => !/^\d+(?:\.\d+)?$/.test(part))
  ) {
    return null;
  }

  const values = parts.map(Number);
  const seconds = values.at(-1) ?? NaN;
  if (!Number.isFinite(seconds) || seconds >= 60) return null;

  if (values.length === 2) {
    return (values[0] ?? 0) * 60 + seconds;
  }

  const minutes = values[1] ?? NaN;
  if (!Number.isFinite(minutes) || minutes >= 60) return null;
  return (values[0] ?? 0) * 3600 + minutes * 60 + seconds;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Read seconds from known post columns and common video-metadata payloads. */
export function readVideoDurationSeconds(row: Record<string, unknown>): number | null {
  const sources = [
    row,
    asRecord(row.metadata),
    asRecord(row.video_metadata),
    asRecord(row.media_metadata),
  ].filter((value): value is Record<string, unknown> => value !== null);

  for (const source of sources) {
    for (const field of ["duration_seconds", "durationSeconds", "duration"]) {
      const seconds = parseDurationSeconds(source[field]);
      if (seconds !== null) return seconds;
    }
  }

  return null;
}

/** Format a genuine positive duration as m:ss or h:mm:ss; omit unknown values. */
export function formatVideoDuration(value: unknown): string | null {
  const seconds = parseDurationSeconds(value);
  if (seconds === null) return null;

  const totalSeconds = Math.floor(seconds);
  if (totalSeconds < 1) return null;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainder = totalSeconds % 60;

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}