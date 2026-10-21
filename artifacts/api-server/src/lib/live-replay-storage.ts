const LIVE_REPLAY_BUCKETS = new Set(["videos", "live-replays"]);
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export type LiveReplayStorageObject = {
  bucket: "videos" | "live-replays";
  path: string;
};

function normalizeOwnedReplayObject(
  ownerId: string,
  bucketValue: unknown,
  pathValue: unknown,
): LiveReplayStorageObject | null {
  if (typeof pathValue !== "string" || !pathValue.trim()) return null;

  const parts = pathValue.trim().replace(/^\/+/, "").split("/");
  let bucket =
    typeof bucketValue === "string" && LIVE_REPLAY_BUCKETS.has(bucketValue)
      ? bucketValue
      : null;
  if (LIVE_REPLAY_BUCKETS.has(parts[0] ?? "")) {
    bucket = parts.shift() ?? null;
  }

  const path = parts.join("/");
  const pathParts = path.split("/");
  if (
    !bucket ||
    pathParts.length < 3 ||
    pathParts[0] !== ownerId ||
    pathParts[1] !== "live-replays" ||
    pathParts.some((part) => !part || part === "." || part === "..")
  ) {
    return null;
  }

  return { bucket: bucket as LiveReplayStorageObject["bucket"], path };
}

/**
 * Only return replay-owned paths. A missing, detached, or malformed source path
 * should skip object cleanup, not prevent deleting the replay metadata.
 */
export function getLiveReplayStorageObjects(input: {
  ownerId: string;
  storageBucket: unknown;
  sourcePath: unknown;
  streamId: unknown;
}): LiveReplayStorageObject[] {
  const objects: LiveReplayStorageObject[] = [];
  const source = normalizeOwnedReplayObject(
    input.ownerId,
    input.storageBucket,
    input.sourcePath,
  );
  if (source) objects.push(source);

  const sourceParts =
    typeof input.sourcePath === "string"
      ? input.sourcePath.trim().replace(/^\/+/, "").split("/")
      : [];
  const pathBucket = LIVE_REPLAY_BUCKETS.has(sourceParts[0] ?? "")
    ? sourceParts[0]
    : null;
  const posterBucket =
    source?.bucket ??
    pathBucket ??
    (typeof input.storageBucket === "string" &&
    LIVE_REPLAY_BUCKETS.has(input.storageBucket)
      ? input.storageBucket
      : null);
  if (posterBucket && typeof input.streamId === "string" && UUID_PATTERN.test(input.streamId)) {
    const poster = normalizeOwnedReplayObject(
      input.ownerId,
      posterBucket,
      `${input.ownerId}/live-replays/${input.streamId}-poster.jpg`,
    );
    if (poster) objects.push(poster);
  }

  const unique = new Map(
    objects.map((object) => [`${object.bucket}/${object.path}`, object]),
  );
  return [...unique.values()];
}
