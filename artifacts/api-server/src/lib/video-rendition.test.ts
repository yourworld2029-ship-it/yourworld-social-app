import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import {
  createFastStartMp4,
  createVideoRendition,
  hasFastStartMp4Layout,
  isLowerRendition,
  probeVideoDimensions,
  qualityRenditionArgs,
  sourceSupportsRequestedQuality,
  videoQualityFromDimensions,
} from "./video-rendition";

function runFixtureFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr = `${stderr}${chunk.toString("utf8")}`.slice(-4000);
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `ffmpeg exited with code ${String(code)}`));
    });
  });
}

test("quality renditions cap landscape and portrait short sides without upscaling", () => {
  const landscape = qualityRenditionArgs("in.mp4", "out.mp4", "360p");
  const portrait = qualityRenditionArgs("in.mp4", "out.mp4", "720p");

  assert.ok(landscape.includes("scale=w='if(gte(iw,ih),-2,min(iw,360))':h='if(gte(iw,ih),min(ih,360),-2)'"));
  assert.ok(portrait.includes("scale=w='if(gte(iw,ih),-2,min(iw,720))':h='if(gte(iw,ih),min(ih,720),-2)'"));
  assert.equal(videoQualityFromDimensions(1920, 1080), "1080p");
  assert.equal(videoQualityFromDimensions(1080, 1920), "1080p");
  assert.equal(videoQualityFromDimensions(320, 240), "original");
});

test("server quality checks reject tiers above the source resolution", () => {
  assert.equal(sourceSupportsRequestedQuality("720p", "720p"), true);
  assert.equal(sourceSupportsRequestedQuality("720p", "480p"), true);
  assert.equal(sourceSupportsRequestedQuality("360p", "720p"), false);
  assert.equal(sourceSupportsRequestedQuality("original", "360p"), false);
  assert.equal(isLowerRendition("720p", "360p"), true);
  assert.equal(isLowerRendition("720p", "720p"), false);
});

test("360p rendition is an actual smaller MP4 with scaled dimensions", async () => {
  const directory = await mkdtemp(join(tmpdir(), "yourworld-rendition-test-"));
  const inputPath = join(directory, "source.mp4");
  const outputPath = join(directory, "360p.mp4");

  try {
    await runFixtureFfmpeg([
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "testsrc2=size=1280x720:rate=24:duration=4",
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-b:v",
      "4M",
      "-maxrate",
      "4M",
      "-bufsize",
      "4M",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      inputPath,
    ]);

    await createVideoRendition(inputPath, outputPath, "360p");
    const [sourceStats, outputStats, dimensions] = await Promise.all([
      stat(inputPath),
      stat(outputPath),
      probeVideoDimensions(outputPath),
    ]);

    assert.deepEqual(dimensions, { width: 640, height: 360 });
    assert.ok(outputStats.size > 0);
    assert.ok(outputStats.size < sourceStats.size);
    assert.equal(await hasFastStartMp4Layout(outputPath), true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("upload processing moves the MP4 moov atom before mdat", async () => {
  const directory = await mkdtemp(join(tmpdir(), "yourworld-faststart-test-"));
  const inputPath = join(directory, "late-moov.mp4");
  const outputPath = join(directory, "faststart.mp4");

  try {
    await runFixtureFfmpeg([
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "testsrc2=size=1280x720:rate=24:duration=2",
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-b:v",
      "1M",
      "-pix_fmt",
      "yuv420p",
      inputPath,
    ]);

    assert.equal(await hasFastStartMp4Layout(inputPath), false);
    await createFastStartMp4(inputPath, outputPath);
    assert.equal(await hasFastStartMp4Layout(outputPath), true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});