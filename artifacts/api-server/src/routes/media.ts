import { spawn } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
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
  TranscodeVideoBody,
  TranscodeVideoResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const MAX_VIDEO_BYTES = 512 * 1024 * 1024;
const STREAM_BUFFER_BYTES = 512 * 1024;
const MAX_CONCURRENT_TRANSCODES = 2;
const FFMPEG_TIMEOUT_MS = 10 * 60 * 1000;
const SIGNED_SOURCE_TTL_SECONDS = 60 * 60;
let activeTranscodes = 0;

class VideoTooLargeError extends Error {}

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

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, FFMPEG_TIMEOUT_MS);

    child.stderr.on("data", (chunk: Buffer) => {
      stderr = `${stderr}${chunk.toString("utf8")}`.slice(-8_000);
    });
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("close", (code) => {
      clearTimeout(timeout);
      if (code === 0 && !timedOut) {
        resolve();
        return;
      }
      reject(
        new Error(
          timedOut
            ? "FFmpeg processing exceeded the time limit."
            : stderr.trim() || `FFmpeg exited with code ${String(code)}.`,
        ),
      );
    });
  });
}

function ffmpegArgs(inputPath: string, outputPath: string, reencode: boolean) {
  const args = [
    "-hide_banner",
    "-loglevel",
    "error",
    "-nostdin",
    "-y",
    "-protocol_whitelist",
    "file,pipe",
    "-i",
    inputPath,
    "-map",
    "0:v:0",
    "-map",
    "0:a?",
  ];

  if (reencode) {
    args.push(
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
    );
  } else {
    args.push("-c", "copy");
  }

  args.push("-movflags", "+faststart", "-f", "mp4", outputPath);
  return args;
}

async function makeFastStartMp4(inputPath: string, outputPath: string) {
  try {
    await runFfmpeg(ffmpegArgs(inputPath, outputPath, false));
  } catch (copyError) {
    await rm(outputPath, { force: true });
    try {
      await runFfmpeg(ffmpegArgs(inputPath, outputPath, true));
    } catch (encodeError) {
      throw new Error(
        `Fast-start remux failed (${copyError instanceof Error ? copyError.message : "unknown error"}); ` +
          `H.264 fallback failed (${encodeError instanceof Error ? encodeError.message : "unknown error"}).`,
      );
    }
  }
}

async function uploadProcessedVideo(
  baseUrl: string,
  serviceRoleKey: string,
  bucket: string,
  objectPath: string,
  filePath: string,
  sizeBytes: number,
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
      "x-upsert": "false",
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
  if (!source) {
    res.status(404).json({ error: "The retained video source is unavailable." });
    return;
  }
  try {
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
    await makeFastStartMp4(inputPath, outputPath);
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