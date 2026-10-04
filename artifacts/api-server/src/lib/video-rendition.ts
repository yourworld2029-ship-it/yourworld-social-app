import { spawn } from "node:child_process";

export type RenditionQuality = "360p" | "480p" | "720p" | "1080p";
export type DetectedVideoQuality =
  | RenditionQuality
  | "1440p"
  | "2160p"
  | "original";

const QUALITY_SETTINGS: Record<
  RenditionQuality,
  { shortSide: number; videoBitrate: number }
> = {
  "360p": { shortSide: 360, videoBitrate: 600_000 },
  "480p": { shortSide: 480, videoBitrate: 900_000 },
  "720p": { shortSide: 720, videoBitrate: 2_500_000 },
  "1080p": { shortSide: 1080, videoBitrate: 5_000_000 },
};

const QUALITY_ORDER: DetectedVideoQuality[] = [
  "360p",
  "480p",
  "720p",
  "1080p",
  "1440p",
  "2160p",
];
const TOOL_TIMEOUT_MS = 10 * 60 * 1000;

function runVideoTool(command: "ffmpeg" | "ffprobe", args: string[]) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, TOOL_TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout = `${stdout}${chunk.toString("utf8")}`.slice(-64_000);
    });
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
        resolve({ stdout, stderr });
      } else {
        reject(
          new Error(
            timedOut
              ? "Video processing exceeded the time limit."
              : stderr.trim() || `${command} exited with code ${String(code)}.`,
          ),
        );
      }
    });
  });
}

export function videoQualityFromDimensions(
  width: number,
  height: number,
): DetectedVideoQuality {
  const shortSide = Math.min(width, height);
  if (!Number.isFinite(shortSide) || shortSide < 360) return "original";
  for (const quality of [...QUALITY_ORDER].reverse()) {
    const tierHeight = Number.parseInt(quality, 10);
    if (shortSide >= tierHeight) return quality;
  }
  return "original";
}

export function isLowerRendition(
  sourceQuality: DetectedVideoQuality,
  requestedQuality: RenditionQuality,
) {
  if (sourceQuality === "original") return false;
  return (
    QUALITY_ORDER.indexOf(sourceQuality) >
    QUALITY_ORDER.indexOf(requestedQuality)
  );
}

export function qualityRenditionArgs(
  inputPath: string,
  outputPath: string,
  quality: RenditionQuality,
  bitrateScale = 1,
) {
  const { shortSide, videoBitrate } = QUALITY_SETTINGS[quality];
  const scaledVideoBitrate = Math.round(videoBitrate * bitrateScale);
  const maxRate = Math.round(scaledVideoBitrate * 1.25);
  const audioBitrate = Math.max(48_000, Math.round(128_000 * bitrateScale));
  const filter =
    `scale=w='if(gte(iw,ih),-2,min(iw,${shortSide}))':` +
    `h='if(gte(iw,ih),min(ih,${shortSide}),-2)'`;

  return [
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
    "-vf",
    filter,
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-b:v",
    String(scaledVideoBitrate),
    "-maxrate",
    String(maxRate),
    "-bufsize",
    String(scaledVideoBitrate * 2),
    "-threads",
    "2",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    String(audioBitrate),
    "-movflags",
    "+faststart",
    "-f",
    "mp4",
    outputPath,
  ];
}

export async function probeVideoDimensions(filePath: string) {
  const { stdout } = await runVideoTool("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height",
    "-of",
    "json",
    filePath,
  ]);
  const result: unknown = JSON.parse(stdout);
  const firstStream =
    result &&
    typeof result === "object" &&
    "streams" in result &&
    Array.isArray(result.streams)
      ? result.streams[0]
      : null;
  if (!firstStream || typeof firstStream !== "object") {
    throw new Error("The video has no readable picture dimensions.");
  }
  const width = Number("width" in firstStream ? firstStream.width : NaN);
  const height = Number("height" in firstStream ? firstStream.height : NaN);
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 1 ||
    height < 1
  ) {
    throw new Error("The video has no readable picture dimensions.");
  }
  return { width, height };
}

export async function createVideoRendition(
  inputPath: string,
  outputPath: string,
  quality: RenditionQuality,
  bitrateScale = 1,
) {
  await runVideoTool(
    "ffmpeg",
    qualityRenditionArgs(inputPath, outputPath, quality, bitrateScale),
  );
}