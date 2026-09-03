export const MAX_MOMENT_PART_SECONDS = 20;

export type MomentPart = {
  start: number;
  end: number;
};

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