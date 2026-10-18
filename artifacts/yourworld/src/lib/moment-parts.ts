/** Instagram/WhatsApp-style maximum duration for one video Moment part. */
export const MAX_MOMENT_PART_SECONDS = 30;

export type MomentPart = {
  start: number;
  end: number;
};

export type MomentPlaybackWindow = {
  start: number;
  end: number;
};

/** Returns the playable trim window, including a safe 30-second bound for shared sources with unknown duration. */
export function getMomentPlaybackWindow(
  trim: { start?: number; end?: number } | undefined,
  mediaDuration: number,
  isSharedContent: boolean,
): MomentPlaybackWindow | null {
  const hasDuration = Number.isFinite(mediaDuration) && mediaDuration > 0;
  if (!hasDuration && !isSharedContent) return null;

  const requestedStart = Number(trim?.start ?? 0);
  const start = Number.isFinite(requestedStart)
    ? Math.max(
        0,
        hasDuration
          ? Math.min(requestedStart, Math.max(0, mediaDuration - 0.05))
          : requestedStart,
      )
    : 0;
  const requestedEnd = Number(trim?.end ?? (hasDuration ? mediaDuration : Number.NaN));
  const storedEnd =
    Number.isFinite(requestedEnd) && requestedEnd > start
      ? hasDuration
        ? Math.min(mediaDuration, requestedEnd)
        : requestedEnd
      : hasDuration
        ? mediaDuration
        : start + MAX_MOMENT_PART_SECONDS;
  const end = isSharedContent
    ? Math.min(storedEnd, start + MAX_MOMENT_PART_SECONDS)
    : storedEnd;

  return { start, end };
}

/** Splits a duration into consecutive moment-sized segments. */
export function splitMomentIntoParts(duration: number): MomentPart[] {
  if (!duration || duration <= MAX_MOMENT_PART_SECONDS) {
    return [{ start: 0, end: duration || 0 }];
  }

  const count = Math.ceil(duration / MAX_MOMENT_PART_SECONDS);
  return Array.from({ length: count }, (_, index) => ({
    start: index * MAX_MOMENT_PART_SECONDS,
    end: Math.min(duration, (index + 1) * MAX_MOMENT_PART_SECONDS),
  }));
}