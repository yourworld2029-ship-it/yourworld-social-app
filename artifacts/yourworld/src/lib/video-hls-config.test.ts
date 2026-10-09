import assert from "node:assert/strict";
import test from "node:test";
import {
  getHlsNetworkHeightCap,
  selectHlsLevelIndex,
} from "./video-hls-config";

test("measured HLS bandwidth below 1 Mbps caps automatic playback at 360p", () => {
  assert.equal(getHlsNetworkHeightCap(999_999), 360);
  assert.equal(getHlsNetworkHeightCap(450_000), 360);
});

test("HLS level cap selects the best available rendition at or below the cap", () => {
  const levels = [
    { height: 1080 },
    { height: 360 },
    { height: 720 },
    { height: 480 },
  ];
  assert.equal(selectHlsLevelIndex(levels, 360), 1);
  assert.equal(selectHlsLevelIndex(levels, 720), 2);
});

test("HLS level cap falls back to the smallest published rendition", () => {
  assert.equal(
    selectHlsLevelIndex([{ height: 1080 }, { height: 720 }], 360),
    1,
  );
  assert.equal(selectHlsLevelIndex([], 360), -1);
});
