import assert from "node:assert/strict";
import test from "node:test";
import { isContinuousPlaybackDelta } from "./video-view-validation";

test("video view samples accept real forward playback at supported speeds", () => {
  assert.equal(isContinuousPlaybackDelta(2_000, 2), true);
  assert.equal(isContinuousPlaybackDelta(2_000, 4, 2), true);
});

test("video view samples reject pauses, seeks, and throttled timer gaps", () => {
  assert.equal(isContinuousPlaybackDelta(2_000, 0), false);
  assert.equal(isContinuousPlaybackDelta(2_000, 20), false);
  assert.equal(isContinuousPlaybackDelta(5_000, 5), false);
  assert.equal(isContinuousPlaybackDelta(2_000, 1), true);
});
