import assert from "node:assert/strict";
import test from "node:test";
import {
  hasNextVideoPrebuffer,
  NEXT_VIDEO_PRELOAD_SECONDS,
  type BufferedRanges,
} from "./next-video-preload-utils";

function ranges(values: Array<[number, number]>): BufferedRanges {
  return {
    length: values.length,
    start: (index) => values[index]?.[0] ?? 0,
    end: (index) => values[index]?.[1] ?? 0,
  };
}

test("next-video prebuffer targets the first two seconds only", () => {
  assert.equal(NEXT_VIDEO_PRELOAD_SECONDS, 2);
  assert.equal(hasNextVideoPrebuffer(ranges([[0, 1.99]]), 30), false);
  assert.equal(hasNextVideoPrebuffer(ranges([[0, 2]]), 30), true);
  assert.equal(hasNextVideoPrebuffer(ranges([[0.5, 3]]), 30), false);
});

test("short next videos are ready when their full duration is buffered", () => {
  assert.equal(hasNextVideoPrebuffer(ranges([[0, 1.25]]), 1.25), true);
  assert.equal(hasNextVideoPrebuffer(ranges([[0, 1.1]]), 1.25), false);
});
