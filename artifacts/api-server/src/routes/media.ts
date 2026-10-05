import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import {
  Router,
  type IRouter,
  type Request,
  type Response as ExpressResponse,
} from "express";
import {
  GetMediaPlaybackUrlBody,
  GetMediaPlaybackUrlResponse,
  GetVideoOfflineSourceBody,
  GetVideoOfflineSourceResponse,
  ResolveCloudflareStreamAssetBody,
  ResolveCloudflareStreamAssetResponse,
  TranscodeVideoBody,
  TranscodeVideoResponse,
} from "@workspace/api-zod";
import {
  createFastStartMp4,
  createVideoRendition,
  isLowerRendition,
  probeVideoDimensions,
  sourceSupportsRequestedQuality,
  videoQualityFromDimensions,
  type DetectedVideoQuality,
  type RenditionQuality,
} from "../lib/video-rendition";

const router: IRouter = Router();

const MAX_VIDEO_BYTES = 512 * 1024 * 1024;
const STREAM_BUFFER_BYTES = 512 * 1024;
const MAX_CONCURRENT_TRANSCODES = 2;
const FFMPEG_TIMEOUT_MS = 10 * 60 * 1000;
const SIGNED_SOURCE_TTL_SECONDS = 60 * 60;
let activeTranscodes = 0;

class VideoTooLargeError extends Error {}
class VideoProcessingBusyError extends Error {}
class QualityConversionUnavailableError extends Error {}

function storageConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publishableKey || !serviceRoleKey) return null;

  try {
    new URL(url);
  } catch {
    return null;
  }

  return { url, publishableKey, serviceRoleKey };
}

function objectUrl(baseUrl: string, bucket: string, objectPath: string) {
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`;
}

function bearerToken(header: string | undefined) {
  return header?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
}

async function authenticateUser(
  baseUrl: string,
  publishableKey: string,
  token: string,
) {
  const response = await fetch(`${baseUrl}/auth/v1/user`, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) return null;
  const user: unknown = await response.json().catch(() => null);
  if (!user || typeof user !== "object" || !("id" in user)) return null;
  return typeof user.id === "string" ? user.id : null;
}

async function downloadSource(
  sourceResponse: Response,
  destination: string,
) {
  const declaredLength = Number(sourceResponse.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_VIDEO_BYTES) {
    await sourceResponse.body?.cancel().catch(() => {});
    throw new VideoTooLargeError("Video exceeds the 512 MiB processing limit.");
  }
  if (!sourceResponse.body) throw new Error("Storage returned an empty video body.");

  let receivedBytes = 0;
  const sizeLimit = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      receivedBytes += chunk.byteLength;
      if (receivedBytes > MAX_VIDEO_BYTES) {
        callback(new VideoTooLargeError("Video exceeds the 512 MiB processing limit."));
        return;
      }
      callback(null, chunk);
    },
  });

  await pipeline(
    Readable.fromWeb(
      sourceResponse.body as import("node:stream/web").ReadableStream<Uint8Array>,
      { highWaterMark: STREAM_BUFFER_BYTES },
    ),
    sizeLimit,
    createWriteStream(destination, {
      flags: "wx",
      highWaterMark: STREAM_BUFFER_BYTES,
    }),
  );
  return receivedBytes;
}

async function uploadProcessedVideo(
  baseUrl: string,
  serviceRoleKey: string,
  bucket: string,
  objectPath: string,
  filePath: string,
  sizeBytes: number,
  upsert = false,
) {
  const cacheControl =
    bucket === "moments"
      ? "max-age=0, no-store, no-transform"
      : "max-age=604800, stale-while-revalidate=86400, no-transform";
  const body = createReadStreamWithBuffer(filePath);
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": "video/mp4",
      "Content-Length": String(sizeBytes),
      "Cache-Control": cacheControl,
      "x-upsert": upsert ? "true" : "false",
    },
    body,
    duplex: "half",
    signal: AbortSignal.timeout(FFMPEG_TIMEOUT_MS),
  } as RequestInit;

  let response: Response;
  try {
    response = await fetch(objectUrl(baseUrl, bucket, objectPath), options);
  } catch (error) {
    body.destroy();
    throw error;
  }
  if (!response.ok) {
    await response.body?.cancel().catch(() => {});
    await body.destroy();
    throw new Error(`Storage rejected the processed video (${response.status}).`);
  }
}

async function inspectStoredMp4Playback(
  baseUrl: string,
  serviceRoleKey: string,
  bucket: string,
  objectPath: string,
) {
  const response = await fetch(objectUrl(baseUrl, bucket, objectPath), {
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      Range: "bytes=0-1",
    },
    signal: AbortSignal.timeout(20_000),
  });
  const contentType =
    response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() ?? null;
  const contentRange = response.headers.get("content-range");
  const rangeSupported =
    response.status === 206 &&
    (!contentRange || /^bytes\s+0-1\/(?:\d+|\*)$/i.test(contentRange.trim()));
  await response.body?.cancel().catch(() => {});

  if (contentType !== "video/mp4") {
    throw new Error(
      `Storage returned ${contentType ?? "no Content-Type"} for the processed MP4.`,
    );
  }
  return {
    contentType,
    rangeSupported,
    rangeStatus: response.status,
    contentRange,
    acceptRanges: response.headers.get("accept-ranges"),
  };
}

function createReadStreamWithBuffer(filePath: string) {
  // A 512 KiB stream buffer keeps storage uploads bounded without loading the
  // complete processed video into memory.
  return createReadStream(filePath, { highWaterMark: STREAM_BUFFER_BYTES });
}

function cloudflareConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN?.trim();
  return accountId && apiToken ? { accountId, apiToken } : null;
}

async function signStorageObject(
  baseUrl: string,
  serviceRoleKey: string,
  bucket: string,
  objectPath: string,
) {
  const response = await fetch(
    `${baseUrl}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${objectPath
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: SIGNED_SOURCE_TTL_SECONDS }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  const result: unknown = await response.json().catch(() => null);
  const signedPath =
    result && typeof result === "object" && "signedURL" in result &&
    typeof result.signedURL === "string"
      ? result.signedURL
      : null;
  if (!response.ok || !signedPath) {
    throw new Error(`Storage could not create a temporary source URL (${response.status}).`);
  }
  if (/^https?:\/\//i.test(signedPath)) return signedPath;
  if (signedPath.startsWith("/storage/v1/")) return `${baseUrl}${signedPath}`;
  return `${baseUrl}/storage/v1${signedPath.startsWith("/") ? "" : "/"}${signedPath}`;
}

async function createCloudflareStreamAsset(
  config: ReturnType<typeof storageConfig> & {},
  bucket: string,
  objectPath: string,
  requireSignedURLs: boolean,
) {
  const cloudflare = cloudflareConfig();
  if (!cloudflare) {
    throw new Error("Cloudflare Stream is not configured.");
  }

  const sourceUrl = await signStorageObject(
    config.url,
    config.serviceRoleKey,
    bucket,
    objectPath,
  );
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
      cloudflare.accountId,
    )}/stream/copy`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cloudflare.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: sourceUrl,
        requireSignedURLs,
        meta: { name: `${bucket}/${objectPath.split("/").pop() ?? "video"}` },
      }),
      signal: AbortSignal.timeout(60_000),
    },
  );
  const payload: unknown = await response.json().catch(() => null);
  const result =
    payload && typeof payload === "object" && "result" in payload &&
    payload.result && typeof payload.result === "object"
      ? (payload.result as Record<string, unknown>)
      : null;
  const uid = typeof result?.uid === "string" ? result.uid : null;
  if (!response.ok || !uid || !/^[a-zA-Z0-9_-]{8,128}$/.test(uid)) {
    throw new Error(`Cloudflare Stream could not import this video (${response.status}).`);
  }

  const manifest =
    typeof result?.playback === "object" &&
    result.playback !== null &&
    "hls" in result.playback &&
    typeof result.playback.hls === "string"
      ? result.playback.hls
      : `https://videodelivery.net/${uid}/manifest/video.m3u8`;
  const manifestUrl = new URL(manifest);
  if (
    !(
      manifestUrl.hostname === "videodelivery.net" ||
      manifestUrl.hostname.endsWith(".cloudflarestream.com")
    ) ||
    !manifestUrl.pathname.includes(`/${uid}/`)
  ) {
    throw new Error("Cloudflare returned an unexpected playback manifest.");
  }
  return { uid, playbackUrl: manifestUrl.toString() };
}

type VideoPostRow = Record<string, unknown>;

function postQueryUrl(baseUrl: string, table: string, query: Record<string, string>) {
  const url = new URL(`${baseUrl}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  return url;
}

async function loadPostForMedia(
  baseUrl: string,
  serviceRoleKey: string,
  postId: string,
) {
  const response = await fetch(
    postQueryUrl(baseUrl, "posts", { id: `eq.${postId}`, select: "*", limit: "1" }),
    {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!response.ok) throw new Error(`Supabase could not load the video (${response.status}).`);
  const rows: unknown = await response.json().catch(() => null);
  return Array.isArray(rows) && rows[0] && typeof rows[0] === "object"
    ? (rows[0] as VideoPostRow)
    : null;
}

function isRestrictedAudience(row: VideoPostRow) {
  if (
    row.is_private === true ||
    row.is_followers_only === true ||
    row.close_friends_only === true
  ) {
    return true;
  }
  const restricted = new Set(["private", "close_friends", "friends", "followers", "only_me"]);
  return [row.audience, row.privacy, row.visibility]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim().toLowerCase().replace(/[\s-]+/g, "_"))
    .some((value) => restricted.has(value));
}

async function hasActiveVideoGrant(
  baseUrl: string,
  serviceRoleKey: string,
  postId: string,
  userId: string,
) {
  const response = await fetch(
    postQueryUrl(baseUrl, "video_access_grants", {
      post_id: `eq.${postId}`,
      user_id: `eq.${userId}`,
      select: "expires_at",
      limit: "1",
    }),
    {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!response.ok) return false;
  const rows: unknown = await response.json().catch(() => null);
  if (!Array.isArray(rows) || !rows[0] || typeof rows[0] !== "object") return false;
  const expiresAt = (rows[0] as Record<string, unknown>).expires_at;
  return (
    expiresAt === null ||
    (typeof expiresAt === "string" &&
      Number.isFinite(Date.parse(expiresAt)) &&
      Date.parse(expiresAt) > Date.now())
  );
}

async function userCanAccessVideo(
  config: NonNullable<ReturnType<typeof storageConfig>>,
  row: VideoPostRow,
  userId: string,
) {
  if (row.archived === true || row.is_hidden === true) return false;
  if (row.user_id === userId) return true;
  if (isRestrictedAudience(row) || row.review_status === "pending_review") return false;

  const rawAccess = String(row.video_access ?? "").trim().toLowerCase();
  const price = Number(row.price ?? 0);
  const requiresGrant =
    rawAccess !== "" && rawAccess !== "public" ||
    row.is_paid === true ||
    (Number.isFinite(price) && price > 0);
  if (!requiresGrant) return rawAccess === "" || rawAccess === "public";

  return await hasActiveVideoGrant(
    config.url,
    config.serviceRoleKey,
    String(row.id),
    userId,
  );
}

function parseVideoStorageObject(value: unknown, row: VideoPostRow) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;

  let bucket = row.kind === "reel" ? "reels" : "videos";
  let objectPath = raw;
  const bucketPrefix = raw.match(/^(videos|reels)\/(.+)$/);
  if (bucketPrefix) {
    bucket = bucketPrefix[1];
    objectPath = bucketPrefix[2];
  } else if (/^https?:\/\//i.test(raw)) {
    let pathname: string;
    try {
      pathname = new URL(raw).pathname;
    } catch {
      return null;
    }
    const storageMatch = pathname.match(
      /\/storage\/v1\/object\/(?:sign|public)\/(videos|reels)\/(.+)$/,
    );
    if (!storageMatch) return null;
    bucket = storageMatch[1];
    try {
      objectPath = storageMatch[2].split("/").map(decodeURIComponent).join("/");
    } catch {
      return null;
    }
  }

  const segments = objectPath.split("/");
  if (
    !["videos", "reels"].includes(bucket) ||
    segments.length < 2 ||
    segments[0] !== row.user_id ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    return null;
  }
  return { bucket, objectPath };
}

function sourceQuality(row: VideoPostRow) {
  const tier = String(row.source_quality_tier ?? "").toLowerCase();
  if (tier === "2k") return "1440p";
  if (tier === "4k") return "2160p";
  return ["360p", "480p", "720p", "1080p", "1440p", "2160p"].includes(tier)
    ? tier
    : "original";
}

function videoSourceObject(row: VideoPostRow, quality: string) {
  if (quality !== "original") {
    const qualityUrls =
      row.quality_urls && typeof row.quality_urls === "object"
        ? (row.quality_urls as Record<string, unknown>)
        : row.qualityUrls && typeof row.qualityUrls === "object"
          ? (row.qualityUrls as Record<string, unknown>)
          : null;
    const qualityObject = qualityUrls?.[quality]
      ? parseVideoStorageObject(qualityUrls[quality], row)
      : null;
    if (qualityObject) return { ...qualityObject, actualQuality: quality };
  }

  const sourceObject =
    parseVideoStorageObject(row.video_url, row) ??
    parseVideoStorageObject(row.source_url, row) ??
    parseVideoStorageObject(row.media_url, row) ??
    parseVideoStorageObject(row.url, row);
  return sourceObject
    ? {
        ...sourceObject,
        actualQuality: quality === "original" ? "original" : sourceQuality(row),
      }
    : null;
}

async function authenticateAndLoadPost(
  req: Request,
  res: ExpressResponse,
  postId: string,
) {
  const token = bearerToken(req.get("authorization"));
  if (!token) {
    res.status(401).json({ error: "Authentication is required." });
    return null;
  }
  const config = storageConfig();
  if (!config) {
    res.status(502).json({ error: "Video media is temporarily unavailable." });
    return null;
  }

  let userId: string | null;
  try {
    userId = await authenticateUser(config.url, config.publishableKey, token);
  } catch (error) {
    req.log.warn({ err: error }, "Supabase could not validate video access");
    res.status(502).json({ error: "Could not validate the upload session." });
    return null;
  }
  if (!userId) {
    res.status(401).json({ error: "The upload session is no longer valid." });
    return null;
  }

  try {
    const row = await loadPostForMedia(config.url, config.serviceRoleKey, postId);
    if (!row || typeof row.id !== "string" || typeof row.user_id !== "string") {
      res.status(404).json({ error: "This video is unavailable." });
      return null;
    }
    if (!(await userCanAccessVideo(config, row, userId))) {
      res.status(403).json({ error: "You do not have access to this video." });
      return null;
    }
    return { config, row, userId };
  } catch (error) {
    req.log.error({ err: error }, "Could not authorize protected video media");
    res.status(502).json({ error: "Video access could not be checked." });
    return null;
  }
}

function streamUidFromManifest(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (
      url.hostname !== "videodelivery.net" &&
      !url.hostname.endsWith(".cloudflarestream.com")
    ) {
      return null;
    }
    const match = url.pathname.match(/^\/([a-zA-Z0-9_-]{8,128})\/manifest\/video\.m3u8$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function parseTusMetadata(value: string | undefined) {
  if (!value) return null;
  const metadata: Record<string, string> = {};
  try {
    for (const entry of value.split(",")) {
      const [key, encodedValue = ""] = entry.trim().split(/\s+/, 2);
      if (!key || !/^[a-zA-Z0-9_-]{1,64}$/.test(key)) return null;
      metadata[key.toLowerCase()] = Buffer.from(encodedValue, "base64").toString("utf8");
    }
  } catch {
    return null;
  }
  return metadata;
}

function isOwnedStoragePath(userId: string, path: string) {
  const segments = path.split("/");
  return (
    segments.length >= 2 &&
    segments[0] === userId &&
    segments.every((segment) => segment && segment !== "." && segment !== "..")
  );
}

function hasQualitySpecificSource(row: Record<string, unknown>, quality: string) {
  const value = row.quality_urls ?? row.qualityUrls;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const specific = (value as Record<string, unknown>)[quality];
  return typeof specific === "string" || (!!specific && typeof specific === "object");
}

function cloudflareDefaultQuality(sourceQuality: string) {
  const match = sourceQuality.match(/^(\d+)p$/);
  const height = Number(match?.[1]);
  if (!Number.isSafeInteger(height) || height < 1) return null;
  return height > 1080 ? "1080p" : sourceQuality;
}

async function getCloudflareDefaultDownloadUrl(
  accountId: string,
  apiToken: string,
  streamUid: string,
) {
  const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
    accountId,
  )}/stream/${encodeURIComponent(streamUid)}/downloads`;
  const headers = { Authorization: `Bearer ${apiToken}` };
  const readDownloads = async () => {
    const response = await fetch(baseUrl, {
      headers,
      signal: AbortSignal.timeout(4000),
    });
    const payload: unknown = await response.json().catch(() => null);
    const result =
      payload && typeof payload === "object" && "result" in payload &&
      payload.result && typeof payload.result === "object"
        ? (payload.result as Record<string, unknown>)
        : null;
    const download =
      result?.default && typeof result.default === "object"
        ? (result.default as Record<string, unknown>)
        : null;
    if (!response.ok || download?.status !== "ready") {
      return null;
    }
    try {
      const url = new URL(typeof download.url === "string"
        ? download.url : `https://videodelivery.net/${streamUid}/downloads/default.mp4`);
      if (
        url.protocol !== "https:" ||
        (url.hostname !== "videodelivery.net" && url.hostname !== "cloudflarestream.com" &&
          !url.hostname.endsWith(".cloudflarestream.com")) ||
        !url.pathname.includes(`/${streamUid}/downloads/default.mp4`)
      ) {
        return null;
      }
      return url.toString();
    } catch {
      return null;
    }
  };

  const readyUrl = await readDownloads();
  if (readyUrl) return readyUrl;

  await fetch(`${baseUrl}/default`, {
    method: "POST",
    headers,
    signal: AbortSignal.timeout(20_000),
  }).catch(() => null);
  // Generation is asynchronous. Re-reading immediately used to fail every
  // first download, even though the stream was already playing.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const ready = await readDownloads();
    if (ready) return ready;
  }
  return null;
}

async function getDownloadableCloudflareStreamUrl(
  accountId: string,
  apiToken: string,
  streamUid: string,
) {
  const streamDownloadUrl = await getCloudflareDefaultDownloadUrl(
    accountId,
    apiToken,
    streamUid,
  ).catch(() => null);
  if (!streamDownloadUrl) return null;

  const tokenResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
      accountId,
    )}/stream/${encodeURIComponent(streamUid)}/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + SIGNED_SOURCE_TTL_SECONDS,
        downloadable: true,
      }),
      signal: AbortSignal.timeout(20_000),
    },
  );
  const tokenPayload: unknown = await tokenResponse.json().catch(() => null);
  const tokenResult =
    tokenPayload && typeof tokenPayload === "object" && "result" in tokenPayload &&
    tokenPayload.result && typeof tokenPayload.result === "object"
      ? (tokenPayload.result as Record<string, unknown>)
      : null;
  const signedToken = typeof tokenResult?.token === "string" ? tokenResult.token : null;
  if (!tokenResponse.ok || !signedToken) return null;

  const signedUrl = new URL(streamDownloadUrl);
  signedUrl.pathname = signedUrl.pathname.replace(
    `/${streamUid}/`,
    `/${signedToken}/`,
  );
  return signedUrl.toString();
}

async function findCachedRendition(
  req: Request,
  baseUrl: string,
  serviceRoleKey: string,
  ownerId: string,
  postId: string,
  sourceKey: string,
  quality: RenditionQuality,
) {
  const folder = `${ownerId}/.quality-renditions/${postId}`;
  try {
    const namePrefix = `${sourceKey}-${quality}-`;
    let cachedName: string | null = null;
    for (let offset = 0; ; offset += 100) {
      const response = await fetch(`${baseUrl}/storage/v1/object/list/videos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prefix: folder, limit: 100, offset }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        throw new Error(`Storage returned ${response.status} while checking the rendition cache.`);
      }
      const entries: unknown = await response.json();
      if (!Array.isArray(entries)) return null;
      const entry = entries.find(
        (candidate): candidate is { name: string } =>
          !!candidate &&
          typeof candidate === "object" &&
          "name" in candidate &&
          typeof candidate.name === "string" &&
          candidate.name.startsWith(namePrefix) &&
          /^([a-f0-9]{20})-(360p|480p|720p|1080p)-(360p|480p|720p|1080p|1440p|2160p|original)\.mp4$/.test(candidate.name),
      );
      if (entry) {
        cachedName = entry.name;
        break;
      }
      if (entries.length < 100) return null;
    }
    if (!cachedName) return null;

    const match = cachedName.match(
      /^([a-f0-9]{20})-(360p|480p|720p|1080p)-(360p|480p|720p|1080p|1440p|2160p|original)\.mp4$/,
    );
    if (!match || match[1] !== sourceKey || match[2] !== quality) return null;
    const actualQuality = match[3] as DetectedVideoQuality;
    const url = await signStorageObject(
      baseUrl,
      serviceRoleKey,
      "videos",
      `${folder}/${cachedName}`,
    );
    return { url, actualQuality };
  } catch (error) {
    req.log.warn({ err: error, postId, quality }, "Could not check the quality download cache");
    return null;
  }
}

async function createOnDemandQualitySource(
  req: Request,
  authorized: NonNullable<Awaited<ReturnType<typeof authenticateAndLoadPost>>>,
  streamUid: string | null,
  requestedQuality: RenditionQuality,
) {
  const { config, row } = authorized;
  const ownerId = String(row.user_id);
  const postId = String(row.id);
  const cloudflare = cloudflareConfig();
  const cloudflareUrl =
    streamUid && cloudflare
      ? await getDownloadableCloudflareStreamUrl(
          cloudflare.accountId,
          cloudflare.apiToken,
          streamUid,
        ).catch((error) => {
          req.log.warn({ err: error, postId }, "Could not resolve the Cloudflare download source");
          return null;
        })
      : null;
  const source = videoSourceObject(row, "original");
  const sourceQualityFromPost =
    sourceQuality(row) as DetectedVideoQuality;
  let sourceIdentity: string | null = null;
  let knownSourceQuality: DetectedVideoQuality = sourceQualityFromPost;
  let directSourceUrl = cloudflareUrl;

  if (cloudflareUrl && streamUid) {
    sourceIdentity = `cloudflare:${streamUid}`;
    knownSourceQuality =
      (cloudflareDefaultQuality(sourceQualityFromPost) as DetectedVideoQuality | null) ??
      "original";
  } else if (source) {
    sourceIdentity = `storage:${source.bucket}:${source.objectPath}`;
  } else {
    const externalSource = [
      row.video_url,
      row.source_url,
      row.media_url,
      row.hls_url,
      row.url,
    ].find((value): value is string => typeof value === "string" && /^https?:\/\//i.test(value));
    if (
      externalSource &&
      knownSourceQuality !== "original" &&
      !isLowerRendition(knownSourceQuality, requestedQuality)
    ) {
      if (
        row.kind !== "reel" &&
        !sourceSupportsRequestedQuality(knownSourceQuality, requestedQuality)
      ) {
        throw new QualityConversionUnavailableError(
          "The selected quality is above this video's source resolution.",
        );
      }
      return { url: externalSource, actualQuality: knownSourceQuality };
    }
    throw new QualityConversionUnavailableError(
      "This video source cannot be converted to the selected quality. Choose Original instead.",
    );
  }

  if ((!directSourceUrl && !source) || !sourceIdentity) {
    throw new QualityConversionUnavailableError(
      "No downloadable video source is available for this quality.",
    );
  }

  const getDirectSourceUrl = async () =>
    directSourceUrl ??
    (source
      ? signStorageObject(
          config.url,
          config.serviceRoleKey,
          source.bucket,
          source.objectPath,
        )
      : null);

  if (knownSourceQuality !== "original") {
    if (
      row.kind !== "reel" &&
      !sourceSupportsRequestedQuality(knownSourceQuality, requestedQuality)
    ) {
      throw new QualityConversionUnavailableError(
        "The selected quality is above this video's source resolution.",
      );
    }
    if (!isLowerRendition(knownSourceQuality, requestedQuality)) {
      const url = await getDirectSourceUrl();
      if (!url) throw new QualityConversionUnavailableError("No downloadable video source is available.");
      return { url, actualQuality: knownSourceQuality };
    }
  }

  const sourceKey = createHash("sha256")
    .update(sourceIdentity)
    .digest("hex")
    .slice(0, 20);
  const cached = await findCachedRendition(
    req,
    config.url,
    config.serviceRoleKey,
    ownerId,
    postId,
    sourceKey,
    requestedQuality,
  );
  if (cached) return cached;

  if (activeTranscodes >= MAX_CONCURRENT_TRANSCODES) {
    throw new VideoProcessingBusyError("Video processing is busy. Please try again shortly.");
  }
  activeTranscodes += 1;
  let tempDir: string | null = null;

  try {
    tempDir = await mkdtemp(join(tmpdir(), "yourworld-rendition-"));
    const inputPath = join(tempDir, "source.mp4");
    const outputPath = join(tempDir, "rendition.mp4");
    const sourceResponse = cloudflareUrl
      ? await fetch(cloudflareUrl, { signal: AbortSignal.timeout(FFMPEG_TIMEOUT_MS) })
      : await fetch(objectUrl(config.url, source!.bucket, source!.objectPath), {
          headers: {
            Authorization: `Bearer ${config.serviceRoleKey}`,
            apikey: config.serviceRoleKey,
          },
          signal: AbortSignal.timeout(FFMPEG_TIMEOUT_MS),
        });
    if (!sourceResponse.ok) {
      await sourceResponse.body?.cancel().catch(() => {});
      throw new Error(`The authorized video source returned ${sourceResponse.status}.`);
    }

    const inputBytes = await downloadSource(sourceResponse, inputPath);
    const dimensions = await probeVideoDimensions(inputPath);
    const actualSourceQuality = videoQualityFromDimensions(
      dimensions.width,
      dimensions.height,
    );
    if (
      row.kind !== "reel" &&
      !sourceSupportsRequestedQuality(actualSourceQuality, requestedQuality)
    ) {
      throw new QualityConversionUnavailableError(
        "The selected quality is above this video's source resolution.",
      );
    }
    if (!isLowerRendition(actualSourceQuality, requestedQuality)) {
      const url = await getDirectSourceUrl();
      if (!url) throw new QualityConversionUnavailableError("No downloadable video source is available.");
      return { url, actualQuality: actualSourceQuality };
    }

    let outputBytes = 0;
    for (const bitrateScale of [1, 0.75, 0.5, 0.35]) {
      await rm(outputPath, { force: true });
      await createVideoRendition(
        inputPath,
        outputPath,
        requestedQuality,
        bitrateScale,
      );
      const output = await stat(outputPath);
      if (output.size > 0 && output.size < inputBytes && output.size <= MAX_VIDEO_BYTES) {
        outputBytes = output.size;
        break;
      }
    }
    if (!outputBytes) {
      throw new Error("The selected quality could not be made smaller than the source video.");
    }

    const objectPath =
      `${ownerId}/.quality-renditions/${postId}/` +
      `${sourceKey}-${requestedQuality}-${requestedQuality}.mp4`;
    await uploadProcessedVideo(
      config.url,
      config.serviceRoleKey,
      "videos",
      objectPath,
      outputPath,
      outputBytes,
      true,
    );
    const url = await signStorageObject(
      config.url,
      config.serviceRoleKey,
      "videos",
      objectPath,
    );
    req.log.info(
      { postId, requestedQuality, sourceBytes: inputBytes, outputBytes },
      "Created a smaller offline video rendition",
    );
    return { url, actualQuality: requestedQuality };
  } finally {
    activeTranscodes -= 1;
    if (tempDir) await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

router.options("/media/cloudflare-tus-upload", (_req, res): void => {
  res
    .set({
      "Tus-Version": "1.0.0",
      "Tus-Extension": "creation,termination",
      "Tus-Max-Size": String(MAX_VIDEO_BYTES),
      "Access-Control-Expose-Headers":
        "Location, Stream-Media-Id, Tus-Resumable, Tus-Version, Tus-Extension, Tus-Max-Size, Upload-Offset",
      "Access-Control-Allow-Methods": "OPTIONS, POST",
      "Access-Control-Allow-Headers":
        "Authorization, Content-Type, Tus-Resumable, Upload-Length, Upload-Metadata",
      "Access-Control-Max-Age": "86400",
    })
    .status(204)
    .end();
});

router.post("/media/cloudflare-tus-upload", async (req, res): Promise<void> => {
  if (req.get("tus-resumable") !== "1.0.0") {
    res.status(400).json({ error: "A supported TUS version is required." });
    return;
  }

  const uploadLength = Number(req.get("upload-length"));
  const metadata = parseTusMetadata(req.get("upload-metadata"));
  const bucket = metadata?.bucketname;
  const path = metadata?.objectname;
  const contentType = metadata?.contenttype;
  const filename = metadata?.name;
  const requiresSignedUrls = metadata?.requiresignedurls === "true";
  if (
    !Number.isSafeInteger(uploadLength) ||
    uploadLength < 1 ||
    uploadLength > MAX_VIDEO_BYTES ||
    !metadata ||
    (bucket !== "videos" && bucket !== "reels") ||
    !path ||
    !contentType?.toLowerCase().startsWith("video/") ||
    !filename
  ) {
    res.status(400).json({ error: "The resumable video upload metadata is invalid." });
    return;
  }

  const token = bearerToken(req.get("authorization"));
  if (!token) {
    res.status(401).json({ error: "Authentication is required." });
    return;
  }
  const config = storageConfig();
  const cloudflare = cloudflareConfig();
  if (!config || !cloudflare) {
    req.log.error("Cloudflare TUS upload configuration is unavailable");
    res.status(502).json({ error: "Video upload is temporarily unavailable." });
    return;
  }

  let userId: string | null;
  try {
    userId = await authenticateUser(config.url, config.publishableKey, token);
  } catch (error) {
    req.log.warn({ err: error }, "Supabase could not validate Cloudflare uploader");
    res.status(502).json({ error: "Could not validate the upload session." });
    return;
  }
  if (!userId) {
    res.status(401).json({ error: "The upload session is no longer valid." });
    return;
  }
  if (!isOwnedStoragePath(userId, path)) {
    res.status(403).json({ error: "You can only stream your own uploaded videos." });
    return;
  }

  try {
    // Confirm the owner-scoped Supabase source exists before creating a second copy.
    await signStorageObject(config.url, config.serviceRoleKey, bucket, path);
    const requestMetadata: Record<string, string> = {
      name: filename.slice(0, 200),
      filetype: contentType.slice(0, 128),
      requiresignedurls: String(requiresSignedUrls),
      ownerid: userId,
      sourcebucket: bucket,
      sourcepath: path,
    };
    const requestOrigin = req.get("origin");
    if (requestOrigin) {
      try {
        const origin = new URL(requestOrigin).origin;
        if (origin && origin !== "null") {
          requestMetadata.allowedorigins = JSON.stringify([origin]);
        }
      } catch {
        // A missing or invalid origin is not used as a playback allowlist.
      }
    }
    const uploadMetadata = Object.entries(requestMetadata)
      .map(([key, value]) => `${key} ${Buffer.from(value, "utf8").toString("base64")}`)
      .join(",");

    const cloudflareResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
        cloudflare.accountId,
      )}/stream?direct_user=true`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cloudflare.apiToken}`,
          "Tus-Resumable": "1.0.0",
          "Upload-Length": String(uploadLength),
          "Upload-Metadata": uploadMetadata,
          "Upload-Creator": userId,
        },
        signal: AbortSignal.timeout(20_000),
      },
    );
    const location = cloudflareResponse.headers.get("location");
    const streamUid = cloudflareResponse.headers.get("stream-media-id");
    let validLocation = false;
    try {
      const uploadUrl = new URL(location ?? "");
      validLocation =
        uploadUrl.protocol === "https:" &&
        uploadUrl.hostname === "upload.videodelivery.net";
    } catch {
      validLocation = false;
    }
    if (
      cloudflareResponse.status !== 201 ||
      !location ||
      !validLocation ||
      !streamUid ||
      !/^[a-zA-Z0-9_-]{8,128}$/.test(streamUid)
    ) {
      const authorizationRejected =
        cloudflareResponse.status === 401 || cloudflareResponse.status === 403;
      const clientStatus =
        cloudflareResponse.status === 429
          ? 429
          : authorizationRejected
            ? 424
            : 502;
      req.log.warn(
        { status: cloudflareResponse.status, clientStatus },
        "Cloudflare did not create a valid TUS upload",
      );
      res.status(clientStatus).json({
        error: authorizationRejected
          ? "Cloudflare Stream rejected the upload authorization."
          : "Cloudflare Stream could not create this upload.",
      });
      return;
    }

    res
      .status(201)
      .set({
        Location: location,
        "Stream-Media-Id": streamUid,
        "Tus-Resumable": "1.0.0",
        "Access-Control-Expose-Headers":
          "Location, Stream-Media-Id, Tus-Resumable, Tus-Version, Tus-Extension, Tus-Max-Size, Upload-Offset",
        "Cache-Control": "no-store",
      })
      .end();
  } catch (error) {
    req.log.error({ err: error }, "Could not create Cloudflare TUS upload");
    res.status(502).json({ error: "Cloudflare Stream could not create this upload." });
  }
});

router.post("/media/cloudflare-stream-asset", async (req, res): Promise<void> => {
  const parsed = ResolveCloudflareStreamAssetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "A valid Cloudflare Stream video ID is required." });
    return;
  }
  const token = bearerToken(req.get("authorization"));
  if (!token) {
    res.status(401).json({ error: "Authentication is required." });
    return;
  }
  const config = storageConfig();
  const cloudflare = cloudflareConfig();
  if (!config || !cloudflare) {
    res.status(502).json({ error: "Cloudflare Stream metadata is unavailable." });
    return;
  }

  let userId: string | null;
  try {
    userId = await authenticateUser(config.url, config.publishableKey, token);
  } catch (error) {
    req.log.warn({ err: error }, "Supabase could not validate Stream asset owner");
    res.status(502).json({ error: "Could not validate the upload session." });
    return;
  }
  if (!userId) {
    res.status(401).json({ error: "The upload session is no longer valid." });
    return;
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
        cloudflare.accountId,
      )}/stream/${encodeURIComponent(parsed.data.streamUid)}`,
      {
        headers: { Authorization: `Bearer ${cloudflare.apiToken}` },
        signal: AbortSignal.timeout(20_000),
      },
    );
    const payload: unknown = await response.json().catch(() => null);
    const result =
      payload && typeof payload === "object" && "result" in payload &&
      payload.result && typeof payload.result === "object"
        ? (payload.result as Record<string, unknown>)
        : null;
    const meta =
      result?.meta && typeof result.meta === "object"
        ? (result.meta as Record<string, unknown>)
        : {};
    const sourceBucket = meta.sourcebucket ?? meta.sourceBucket;
    const sourcePath = meta.sourcepath ?? meta.sourcePath;
    const ownerId = meta.ownerid ?? meta.ownerId;
    const creator = result?.creator;
    const ownerMatches = creator === userId || ownerId === userId;
    const sourceMatches =
      (sourceBucket === "videos" || sourceBucket === "reels") &&
      typeof sourcePath === "string" &&
      isOwnedStoragePath(userId, sourcePath);
    if (!response.ok || !result) {
      req.log.warn({ status: response.status }, "Cloudflare Stream asset lookup failed");
      res.status(502).json({ error: "Cloudflare Stream metadata is unavailable." });
      return;
    }
    if (!ownerMatches || !sourceMatches) {
      res.status(403).json({ error: "This Stream asset is not owned by the caller." });
      return;
    }

    const streamUid = parsed.data.streamUid;
    const playback =
      result.playback && typeof result.playback === "object"
        ? (result.playback as Record<string, unknown>)
        : {};
    const candidatePlaybackUrl = playback.hls;
    const playbackUrl =
      typeof candidatePlaybackUrl === "string" &&
      streamUidFromManifest(candidatePlaybackUrl) === streamUid
        ? candidatePlaybackUrl
        : `https://videodelivery.net/${streamUid}/manifest/video.m3u8`;
    const rawDuration = Number(result.duration);
    const durationSeconds =
      Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : null;
    const posterUrl = `https://videodelivery.net/${streamUid}/thumbnails/thumbnail.jpg`;

    res.status(200).json(
      ResolveCloudflareStreamAssetResponse.parse({
        streamUid,
        playbackUrl,
        posterUrl,
        durationSeconds,
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Could not resolve Cloudflare Stream metadata");
    res.status(502).json({ error: "Cloudflare Stream metadata is unavailable." });
  }
});

router.post("/media/playback-url", async (req, res): Promise<void> => {
  const parsed = GetMediaPlaybackUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "A video post ID is required." });
    return;
  }
  const authorized = await authenticateAndLoadPost(req, res, parsed.data.postId);
  if (!authorized) return;
  const mediaUrl =
    typeof authorized.row.media_url === "string" ? authorized.row.media_url : "";
  const streamUid = streamUidFromManifest(mediaUrl);
  if (!streamUid) {
    if (/^https?:\/\//i.test(mediaUrl)) {
      res.status(200).json(GetMediaPlaybackUrlResponse.parse({ url: mediaUrl }));
      return;
    }
    res.status(404).json({ error: "The playback source is unavailable." });
    return;
  }

  const cloudflare = cloudflareConfig();
  if (!cloudflare) {
    res.status(502).json({ error: "Secure video playback is temporarily unavailable." });
    return;
  }
  try {
    const tokenResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
        cloudflare.accountId,
      )}/stream/${encodeURIComponent(streamUid)}/token`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cloudflare.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60 }),
        signal: AbortSignal.timeout(20_000),
      },
    );
    const payload: unknown = await tokenResponse.json().catch(() => null);
    const result =
      payload && typeof payload === "object" && "result" in payload &&
      payload.result && typeof payload.result === "object"
        ? (payload.result as Record<string, unknown>)
        : null;
    const signedToken = typeof result?.token === "string" ? result.token : null;
    if (!tokenResponse.ok || !signedToken) {
      req.log.warn({ status: tokenResponse.status }, "Cloudflare did not issue a playback token");
      res.status(502).json({ error: "Secure video playback is temporarily unavailable." });
      return;
    }

    const playbackUrl = new URL(mediaUrl);
    playbackUrl.pathname = playbackUrl.pathname.replace(
      `/${streamUid}/`,
      `/${signedToken}/`,
    );
    res.status(200).json(GetMediaPlaybackUrlResponse.parse({ url: playbackUrl.toString() }));
  } catch (error) {
    req.log.error({ err: error }, "Could not issue a protected playback URL");
    res.status(502).json({ error: "Secure video playback is temporarily unavailable." });
  }
});

router.post("/media/playback-source", async (req, res): Promise<void> => {
  const parsed = GetMediaPlaybackUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "A video post ID is required." });
    return;
  }
  const authorized = await authenticateAndLoadPost(req, res, parsed.data.postId);
  if (!authorized) return;

  const source = videoSourceObject(authorized.row, "original");
  if (!source) {
    res.status(404).json({ error: "The retained MP4 playback source is unavailable." });
    return;
  }

  try {
    const url = await signStorageObject(
      authorized.config.url,
      authorized.config.serviceRoleKey,
      source.bucket,
      source.objectPath,
    );
    res.status(200).json(GetMediaPlaybackUrlResponse.parse({ url }));
  } catch (error) {
    req.log.warn({ err: error, postId: parsed.data.postId }, "Could not sign the MP4 playback fallback");
    res.status(502).json({ error: "The retained MP4 playback source is temporarily unavailable." });
  }
});

router.post("/media/offline-source", async (req, res): Promise<void> => {
  const parsed = GetVideoOfflineSourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "A video post ID is required." });
    return;
  }
  const authorized = await authenticateAndLoadPost(req, res, parsed.data.postId);
  if (!authorized) return;
  if (authorized.row.allow_download === false) {
    res.status(403).json({ error: "The creator has disabled offline downloads." });
    return;
  }
  const requestedQuality = parsed.data.quality ?? "original";
  const source = videoSourceObject(authorized.row, requestedQuality);
  try {
    const explicitUid = authorized.row.cloudflare_stream_id ?? authorized.row.cloudflare_stream_uid;
    const streamUid = typeof explicitUid === "string" && /^[a-zA-Z0-9_-]{8,128}$/.test(explicitUid)
      ? explicitUid : streamUidFromManifest(authorized.row.hls_url ?? authorized.row.media_url);
    const defaultStreamQuality = cloudflareDefaultQuality(sourceQuality(authorized.row)) ?? "original";
    const cloudflare = cloudflareConfig();
    const qualityRendition = ["360p", "480p", "720p", "1080p"].includes(requestedQuality)
      ? (requestedQuality as RenditionQuality)
      : null;

    if (
      qualityRendition &&
      !hasQualitySpecificSource(authorized.row, requestedQuality)
    ) {
      const rendition = await createOnDemandQualitySource(
        req,
        authorized,
        streamUid,
        qualityRendition,
      );
      res.status(200).json(GetVideoOfflineSourceResponse.parse(rendition));
      return;
    }

    if (
      requestedQuality !== "original" &&
      hasQualitySpecificSource(authorized.row, requestedQuality) &&
      source
    ) {
      const url = await signStorageObject(
        authorized.config.url,
        authorized.config.serviceRoleKey,
        source.bucket,
        source.objectPath,
      );
      res.status(200).json(
        GetVideoOfflineSourceResponse.parse({ url, actualQuality: source.actualQuality }),
      );
      return;
    }

    if (streamUid && cloudflare) {
      const downloadableUrl = await getDownloadableCloudflareStreamUrl(
        cloudflare.accountId,
        cloudflare.apiToken,
        streamUid,
      ).catch((error) => {
        req.log.warn({ err: error }, "Cloudflare did not issue a downloadable video URL");
        return null;
      });
      if (downloadableUrl) {
        res.status(200).json(
          GetVideoOfflineSourceResponse.parse({
            url: downloadableUrl,
            actualQuality: defaultStreamQuality,
          }),
        );
        return;
      }
    }

    if (!source) {
      const directSource = [authorized.row.video_url, authorized.row.source_url,
        authorized.row.media_url, authorized.row.hls_url, authorized.row.url]
        .find((value): value is string => typeof value === "string" && /^https?:\/\//i.test(value));
      if (directSource) {
        res.status(200).json(GetVideoOfflineSourceResponse.parse({
          url: directSource, actualQuality: sourceQuality(authorized.row),
        }));
        return;
      }
      res.status(404).json({ error: "This record has no saved media reference. Refresh the video and retry." });
      return;
    }
    const url = await signStorageObject(
      authorized.config.url,
      authorized.config.serviceRoleKey,
      source.bucket,
      source.objectPath,
    );
    res.status(200).json(
      GetVideoOfflineSourceResponse.parse({ url, actualQuality: source.actualQuality }),
    );
  } catch (error) {
    if (error instanceof VideoProcessingBusyError) {
      res.status(429).json({ error: error.message });
      return;
    }
    if (error instanceof VideoTooLargeError) {
      res.status(413).json({ error: error.message });
      return;
    }
    if (error instanceof QualityConversionUnavailableError) {
      res.status(422).json({ error: error.message });
      return;
    }
    req.log.error({ err: error }, "Could not sign an authorized offline source");
    res.status(502).json({ error: "The video could not be prepared for offline viewing." });
  }
});

router.post("/media/transcode", async (req, res): Promise<void> => {
  const parsed = TranscodeVideoBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid video transcode request");
    res.status(400).json({ error: "Provide a supported bucket and storage path." });
    return;
  }

  const token = bearerToken(req.get("authorization"));
  if (!token) {
    res.status(401).json({ error: "Authentication is required." });
    return;
  }

  const config = storageConfig();
  if (!config) {
    req.log.error("Video processing storage configuration is unavailable");
    res.status(502).json({ error: "Video processing is temporarily unavailable." });
    return;
  }

  let userId: string | null;
  try {
    userId = await authenticateUser(config.url, config.publishableKey, token);
  } catch (error) {
    req.log.warn({ err: error }, "Supabase could not validate video uploader");
    res.status(502).json({ error: "Could not validate the upload session." });
    return;
  }
  if (!userId) {
    res.status(401).json({ error: "The upload session is no longer valid." });
    return;
  }

  const { bucket, path: sourcePath } = parsed.data;
  const segments = sourcePath.split("/");
  if (
    segments.length < 2 ||
    segments[0] !== userId ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    res.status(403).json({ error: "You can only process your own uploaded videos." });
    return;
  }

  if (activeTranscodes >= MAX_CONCURRENT_TRANSCODES) {
    res.status(429).json({ error: "Video processing is busy. Please try again shortly." });
    return;
  }
  activeTranscodes += 1;

  let tempDir: string | null = null;
  try {
    tempDir = await mkdtemp(join(tmpdir(), "yourworld-video-"));
    const inputPath = join(tempDir, "source.bin");
    const outputPath = join(tempDir, "faststart.mp4");
    const sourceResponse = await fetch(objectUrl(config.url, bucket, sourcePath), {
      headers: {
        Authorization: `Bearer ${config.serviceRoleKey}`,
        apikey: config.serviceRoleKey,
      },
      signal: AbortSignal.timeout(FFMPEG_TIMEOUT_MS),
    });
    if (!sourceResponse.ok) {
      await sourceResponse.body?.cancel().catch(() => {});
      throw new Error(`Storage could not read the uploaded video (${sourceResponse.status}).`);
    }

    const inputBytes = await downloadSource(sourceResponse, inputPath);
    await createFastStartMp4(inputPath, outputPath);
    const outputStats = await stat(outputPath);
    if (outputStats.size < 1 || outputStats.size > MAX_VIDEO_BYTES) {
      throw new VideoTooLargeError("The processed video is outside the supported size limit.");
    }

    const sourceFilename = segments[segments.length - 1] ?? "video";
    const stem = sourceFilename.replace(/\.[^/.]+$/, "").slice(0, 120) || "video";
    const outputName = `${stem}-faststart-${randomUUID().slice(0, 12)}.mp4`;
    const outputPathInStorage = `${segments.slice(0, -1).join("/")}/${outputName}`;

    await uploadProcessedVideo(
      config.url,
      config.serviceRoleKey,
      bucket,
      outputPathInStorage,
      outputPath,
      outputStats.size,
    );
    if (bucket === "videos") {
      const playbackCheck = await inspectStoredMp4Playback(
        config.url,
        config.serviceRoleKey,
        bucket,
        outputPathInStorage,
      );
      const playbackLog = {
        bucket,
        contentType: playbackCheck.contentType,
        rangeStatus: playbackCheck.rangeStatus,
        rangeSupported: playbackCheck.rangeSupported,
        contentRange: playbackCheck.contentRange,
        acceptRanges: playbackCheck.acceptRanges,
      };
      if (playbackCheck.rangeSupported) {
        req.log.info(playbackLog, "Verified stored MP4 MIME and byte-range playback");
      } else {
        req.log.warn(
          playbackLog,
          "Stored MP4 is fast-started but Storage did not confirm byte-range playback",
        );
      }
    }

    let stream: { uid: string; playbackUrl: string } | null = null;
    if (parsed.data.cloudflareStream) {
      if (bucket === "moments") {
        res.status(400).json({ error: "Moment videos stay in private Supabase storage." });
        return;
      }
      stream = await createCloudflareStreamAsset(
        config,
        bucket,
        outputPathInStorage,
        parsed.data.requireSignedURLs ?? true,
      );
    }

    const result = TranscodeVideoResponse.parse({
      path: outputPathInStorage,
      contentType: "video/mp4",
      faststart: true,
      streamUid: stream?.uid ?? null,
      playbackUrl: stream?.playbackUrl ?? null,
    });
    req.log.info(
      { bucket, inputBytes, outputBytes: outputStats.size },
      "Prepared fast-start video",
    );
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof VideoTooLargeError) {
      res.status(413).json({ error: error.message });
      return;
    }
    req.log.error({ err: error, bucket }, "Video fast-start processing failed");
    res.status(502).json({ error: "Could not prepare this video for playback." });
  } finally {
    activeTranscodes -= 1;
    if (tempDir) await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
});

export default router;