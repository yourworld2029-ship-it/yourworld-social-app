type UnknownRow = Record<string, unknown>;

function valueText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/** Long-form videos stay separate from Reels even when old rows are incomplete. */
export function isLongVideoRow(row: UnknownRow) {
  const kind = valueText(row.kind ?? row.type).toLowerCase();
  if (kind === "video" || kind === "long_video") return true;
  if (kind) return false;

  const mediaType = valueText(row.media_type ?? row.video_type).toLowerCase();
  const hasVideoMedia = mediaType.startsWith("video");
  const duration = Number(row.duration_seconds);
  return hasVideoMedia && Number.isFinite(duration) && duration >= 90;
}

/** Applies publication state when the current database shape exposes it. */
export function isPublishedPostRow(row: UnknownRow, now = Date.now()) {
  const status = valueText(row.status).toLowerCase();
  if (status && status !== "published") return false;

  const reviewStatus = valueText(row.review_status).toLowerCase();
  if (reviewStatus && reviewStatus !== "approved") return false;

  if (row.archived === true || row.is_archived === true) return false;

  const scheduledAt = valueText(row.scheduled_at);
  if (scheduledAt) {
    const scheduledTime = Date.parse(scheduledAt);
    if (Number.isFinite(scheduledTime) && scheduledTime > now) return false;
  }

  // Legacy posts schemas have no status/review_status columns. RLS remains the
  // source of visibility for those rows; don't hide valid legacy videos.
  return true;
}

export function isPublishedLongVideoRow(row: UnknownRow, now = Date.now()) {
  return isLongVideoRow(row) && isPublishedPostRow(row, now);
}

export function episodeOrdinal(value: unknown): number | null {
  const label = valueText(value);
  if (!label) return null;
  const labeledNumber = label.match(/(?:episode|part|ep|e)\s*#?\s*(\d+)/i);
  const number = labeledNumber?.[1] ?? label.match(/\d+(?!.*\d)/)?.[0];
  if (!number) return null;
  const parsed = Number(number);
  return Number.isFinite(parsed) ? parsed : null;
}

export type SeriesEpisodeOrder = {
  episode_number?: string | null;
  created_at?: string | null;
  title?: string | null;
};

export function sortSeriesEpisodes<T extends SeriesEpisodeOrder>(episodes: T[]) {
  return [...episodes].sort((left, right) => {
    const leftNumber = episodeOrdinal(left.episode_number);
    const rightNumber = episodeOrdinal(right.episode_number);
    if (leftNumber !== null && rightNumber !== null && leftNumber !== rightNumber) {
      return leftNumber - rightNumber;
    }
    if (leftNumber !== null && rightNumber === null) return -1;
    if (leftNumber === null && rightNumber !== null) return 1;
    const byDate = valueText(left.created_at).localeCompare(valueText(right.created_at));
    return byDate || valueText(left.title).localeCompare(valueText(right.title));
  });
}

export function isNextSeriesEpisode(current: unknown, candidate: unknown) {
  const currentNumber = episodeOrdinal(current);
  const candidateNumber = episodeOrdinal(candidate);
  return (
    currentNumber === null ||
    candidateNumber === null ||
    candidateNumber > currentNumber
  );
}