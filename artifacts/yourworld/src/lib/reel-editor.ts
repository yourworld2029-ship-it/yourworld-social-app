export const MAX_REEL_CLIPS = 5;
export const MAX_REEL_CLIPS_MESSAGE =
  "Maximum 5 clips allowed per Reel for optimal 4K performance";

export const MIN_REEL_DURATION_SECONDS = 5;
export const MAX_REEL_DURATION_SECONDS = 90;
export const MIN_REEL_DURATION_MESSAGE = "Reel must be at least 5 seconds long.";
export const MAX_REEL_DURATION_MESSAGE =
  "Reels are limited to a maximum of 90 seconds.";

export type ReelDurationClip = {
  trimStart?: number;
  trimEnd?: number;
  duration?: number;
};

export function reelClipDuration(clip: ReelDurationClip): number {
  const duration = Math.max(0, clip.duration ?? 0);
  const start = Math.min(duration, Math.max(0, clip.trimStart ?? 0));
  const end = Math.min(duration, Math.max(start, clip.trimEnd ?? duration));
  return Math.max(0, end - start);
}

export function reelSequenceDuration(clips: ReelDurationClip[]): number {
  return clips.reduce((sum, clip) => sum + reelClipDuration(clip), 0);
}

/** Trim only the tail of the sequence, preserving clip order and edits. */
export function capReelSequence(
  clips: ReelDurationClip[],
  maxDuration = MAX_REEL_DURATION_SECONDS,
): ReelDurationClip[] {
  let remaining = Math.max(0, maxDuration);
  return clips.reduce<ReelDurationClip[]>((result, clip) => {
    const length = reelClipDuration(clip);
    if (length <= 0 || remaining <= 0) return result;
    if (length <= remaining) {
      result.push(clip);
      remaining -= length;
      return result;
    }

    const start = Math.max(0, clip.trimStart ?? 0);
    result.push({
      ...clip,
      trimStart: start,
      trimEnd: start + remaining,
    });
    remaining = 0;
    return result;
  }, []);
}