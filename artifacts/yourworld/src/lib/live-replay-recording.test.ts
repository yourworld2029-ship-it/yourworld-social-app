import assert from "node:assert/strict";
import test from "node:test";
import {
  chooseLiveReplayMimeType,
  getLiveReplaySourceRect,
  getPortraitSourceRect,
  liveReplayVideoBitrate,
} from "./live-replay-recording";

test("live replay capture center-crops landscape input to an upright 9:16 frame", () => {
  const crop = getPortraitSourceRect(1920, 1080);

  assert.equal(crop.height, 1080);
  assert.equal(crop.width, 607.5);
  assert.equal(crop.x, 656.25);
  assert.equal(crop.y, 0);
  assert.equal(crop.width / crop.height, 9 / 16);
});

test("portrait live replay input is preserved without a rotation transform", () => {
  assert.deepEqual(getPortraitSourceRect(1080, 1920), {
    x: 0,
    y: 0,
    width: 1080,
    height: 1920,
  });
});

test("landscape live replay keeps a 16:9 frame rather than cropping to portrait", () => {
  const crop = getLiveReplaySourceRect(1920, 1080, 16 / 9);

  assert.deepEqual(crop, { x: 0, y: 0, width: 1920, height: 1080 });
});

test("live replay recording prefers H.264 MP4 when it is supported", () => {
  const selected = chooseLiveReplayMimeType((mimeType) =>
    mimeType.includes("mp4") || mimeType.includes("webm"),
  );

  assert.equal(selected, 'video/mp4;codecs="avc1.42E01E,mp4a.40.2"');
});

test("live replay bitrate scales with source size and stays within safe bounds", () => {
  assert.equal(liveReplayVideoBitrate(720, 1280), 2_500_000);
  assert.equal(liveReplayVideoBitrate(1080, 1920), 4_976_640);
  assert.equal(liveReplayVideoBitrate(3840, 2160), 5_000_000);
});

test("live replay capture rejects empty camera dimensions", () => {
  assert.deepEqual(getPortraitSourceRect(0, 1080), {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
});
