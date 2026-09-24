import { spawn } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Router, type IRouter } from "express";
import {
  TranscodeVideoBody,
  TranscodeVideoResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const MAX_VIDEO_BYTES = 512 * 1024 * 1024;
const STREAM_BUFFER_BYTES = 512 * 1024;
const MAX_CONCURRENT_TRANSCODES = 2;
const FFMPEG_TIMEOUT_MS = 10 * 60 * 1000;
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
      ? "max-age=0, no-store"
      : "max-age=604800, stale-while-revalidate=86400";
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

    const result = TranscodeVideoResponse.parse({
      path: outputPathInStorage,
      contentType: "video/mp4",
      faststart: true,
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