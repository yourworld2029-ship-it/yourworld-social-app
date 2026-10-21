import assert from "node:assert/strict";
import test from "node:test";
import { getLiveReplayPosterDimensions } from "./live-replay-thumbnail";

test("poster sizing preserves portrait aspect ratio", () => {
  assert.deepEqual(getLiveReplayPosterDimensions(720, 1280), {
    width: 720,
    height: 1280,
  });
});

test("poster sizing bounds large frames without distortion", () => {
  assert.deepEqual(getLiveReplayPosterDimensions(3840, 2160), {
    width: 1280,
    height: 720,
  });
});

test("invalid poster dimensions return an empty size", () => {
  assert.deepEqual(getLiveReplayPosterDimensions(0, 720), {
    width: 0,
    height: 0,
  });
});
