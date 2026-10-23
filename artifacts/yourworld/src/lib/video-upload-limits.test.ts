import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getReelVideoSizeError,
  getVideoUploadSizeError,
  MAX_LONG_VIDEO_BYTES,
  MAX_REEL_VIDEO_BYTES,
} from "./video-upload-limits";

test("Reel size limit is checked before a transfer begins", () => {
  assert.equal(getReelVideoSizeError(MAX_REEL_VIDEO_BYTES), null);
  assert.match(
    getReelVideoSizeError(MAX_REEL_VIDEO_BYTES + 1) ?? "",
    /512 MiB.*Videos upload/,
  );
});

test("Long Videos retain their 2 GB limit, independent of the Reel limit", () => {
  assert.equal(
    getVideoUploadSizeError("videos", "video/mp4", MAX_LONG_VIDEO_BYTES),
    null,
  );
  assert.match(
    getVideoUploadSizeError("videos", "video/mp4", MAX_LONG_VIDEO_BYTES + 1) ?? "",
    /2 GB or smaller/,
  );
  assert.equal(
    getVideoUploadSizeError("videos", "video/mp4", MAX_REEL_VIDEO_BYTES + 1),
    null,
  );
});

test("video preflight does not affect non-video uploads or other buckets", () => {
  assert.equal(
    getVideoUploadSizeError("reels", "image/jpeg", MAX_REEL_VIDEO_BYTES + 1),
    null,
  );
  assert.equal(
    getVideoUploadSizeError("moments", "video/mp4", MAX_LONG_VIDEO_BYTES + 1),
    null,
  );
});
