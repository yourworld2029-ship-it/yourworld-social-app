import assert from "node:assert/strict";
import { test } from "node:test";
import {
  outputSizeForQuality,
  qualityTierForOutput,
  selectSupportedRecorderMimeType,
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