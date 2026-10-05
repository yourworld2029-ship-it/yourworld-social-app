import assert from "node:assert/strict";
import { test } from "node:test";
import {
  compressLongVideoByTier,
  getLongVideoCompressionPlan,
  hasFastStartMp4Layout,
  LONG_VIDEO_AUDIO_BITRATE,
  markVideoBlobAsUploadReady,
  MAX_LONG_VIDEO_INPUT_BYTES,
  optimizeVideoBlob,
  outputSizeForQuality,
  qualityTierForOutput,
  selectSupportedFastStartMp4MimeType,
  selectSupportedRecorderMimeType,
  shouldAttemptLongVideoLocalCompression,
  VIDEO_UPLOAD_BITRATE,
} from "./video-compression";

test("prefers compatible MP4 recording and falls back to AV1 or WebM", () => {
  assert.equal(
    selectSupportedRecorderMimeType((mimeType) => mimeType.includes("avc1.4D401F")),
    'video/mp4;codecs="avc1.4D401F"',
  );
  assert.equal(
    selectSupportedRecorderMimeType((mimeType) => mimeType.includes("av01")),
    'video/mp4;codecs="av01.0.08M.08"',
  );
  assert.equal(
    selectSupportedRecorderMimeType((mimeType) => mimeType.includes("vp9")),
    'video/webm;codecs="vp9,opus"',
  );
  assert.equal(selectSupportedRecorderMimeType(() => false), null);
});

test("quality conversion downsizes without upscaling the source", () => {
  assert.deepEqual(
    outputSizeForQuality({ width: 1920, height: 1080, duration: 60 }, "720p"),
    { width: 1280, height: 720 },
  );
  assert.deepEqual(
    outputSizeForQuality({ width: 640, height: 360, duration: 60 }, "1080p"),
    { width: 640, height: 360 },
  );
  assert.equal(qualityTierForOutput(640, 360, "1080p"), "360p");
  assert.equal(qualityTierForOutput(3840, 2160, "1080p"), "1080p");
});

test("upload optimization targets 2500 kbps video before audio overhead", () => {
  assert.equal(VIDEO_UPLOAD_BITRATE, 2_500_000);
});

test("direct-upload fallback bypasses browser-side video re-encoding", async () => {
  const original = new Blob(["large source placeholder"], { type: "video/mp4" });
  markVideoBlobAsUploadReady(original);

  assert.equal(await optimizeVideoBlob(original), original);
});

test("long-video compression selects size tiers and output budgets at exact boundaries", () => {
  assert.deepEqual(getLongVideoCompressionPlan(500_000_000, 300), {
    tier: "aggressive",
    targetOutputBytes: 70_000_000,
    videoBitrate: Math.floor((70_000_000 * 8) / 300 - LONG_VIDEO_AUDIO_BITRATE),
  });
  assert.equal(
    getLongVideoCompressionPlan(1_000_000_000, 300).targetOutputBytes,
    100_000_000,
  );
  assert.deepEqual(
    getLongVideoCompressionPlan(499_999_999, 300).targetOutputBytes,
    Math.round(499_999_999 * 0.5),
  );
  assert.equal(getLongVideoCompressionPlan(100_000_000, 300).tier, "balanced");
  assert.equal(getLongVideoCompressionPlan(99_999_999, 300).tier, "light");
  assert.equal(MAX_LONG_VIDEO_INPUT_BYTES, 1_000_000_000);
});

test("long-video planning rejects files over the strict 1 GB input limit", () => {
  assert.throws(
    () => getLongVideoCompressionPlan(MAX_LONG_VIDEO_INPUT_BYTES + 1, 300),
    /1 GB or smaller/,
  );
});

test("long videos that would take too long to encode locally use the original upload", () => {
  assert.equal(shouldAttemptLongVideoLocalCompression(100_000_000, 180), true);
  assert.equal(shouldAttemptLongVideoLocalCompression(560_000_000, 900), false);
  assert.equal(shouldAttemptLongVideoLocalCompression(100_000_000, 301), false);
  assert.equal(shouldAttemptLongVideoLocalCompression(0, 120), false);
});

test("very large Long Video files bypass local encoding before metadata probing", async () => {
  const original = { size: 560_000_000, type: "video/mp4" } as Blob;
  const prepared = await compressLongVideoByTier(original);

  assert.equal(prepared.blob, original);
  assert.equal(prepared.compressed, false);
});

test("long-video recorder selection accepts MP4 only", () => {
  assert.equal(
    selectSupportedFastStartMp4MimeType((mimeType) => mimeType === "video/mp4"),
    "video/mp4",
  );
  assert.equal(
    selectSupportedFastStartMp4MimeType((mimeType) => mimeType.startsWith("video/webm")),
    null,
  );
});

function mp4Box(type: string, payload: Uint8Array = new Uint8Array()) {
  const result = new Uint8Array(8 + payload.length);
  new DataView(result.buffer).setUint32(0, result.length);
  for (let index = 0; index < 4; index += 1) {
    result[index + 4] = type.charCodeAt(index);
  }
  result.set(payload, 8);
  return result;
}

test("fast-start MP4 validation requires moov before mdat", async () => {
  const fastStart = new Blob(
    [mp4Box("ftyp"), mp4Box("moov"), mp4Box("mdat", new Uint8Array(16))],
    { type: "video/mp4" },
  );
  const lateMoov = new Blob(
    [mp4Box("ftyp"), mp4Box("mdat", new Uint8Array(16)), mp4Box("moov")],
    { type: "video/mp4" },
  );

  assert.equal(await hasFastStartMp4Layout(fastStart), true);
  assert.equal(await hasFastStartMp4Layout(lateMoov), false);
});

test("long-video compression silently keeps the original when MP4 encoding is unavailable", async () => {
  const original = new Blob(["original"], { type: "video/mp4" });
  const compressed = await compressLongVideoByTier(original);

  assert.equal(compressed.blob, original);
  assert.equal(compressed.compressed, false);
  assert.equal(await optimizeVideoBlob(original), original);
});