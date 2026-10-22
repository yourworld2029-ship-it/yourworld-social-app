export const NEXT_VIDEO_PRELOAD_SECONDS = 2;

export type BufferedRanges = Pick<TimeRanges, "length" | "start" | "end">;

export function hasNextVideoPrebuffer(
  ranges: BufferedRanges,
  duration: number,
): boolean {
  const targetSeconds =
    Number.isFinite(duration) && duration > 0
      ? Math.min(NEXT_VIDEO_PRELOAD_SECONDS, duration)
      : NEXT_VIDEO_PRELOAD_SECONDS;

  for (let index = 0; index < ranges.length; index += 1) {
    if (ranges.start(index) <= 0.25 && ranges.end(index) >= targetSeconds) {
      return true;
    }
  }

  return false;
}
