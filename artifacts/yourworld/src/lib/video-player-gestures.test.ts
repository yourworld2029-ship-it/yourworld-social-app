import assert from "node:assert/strict";
import test from "node:test";
import {
  getFullscreenGestureZone,
  isVerticalAdjustmentGesture,
} from "./video-player-gestures";

test("fullscreen left 40 percent is reserved for brightness", () => {
  assert.equal(getFullscreenGestureZone(0, 1000), "brightness");
  assert.equal(getFullscreenGestureZone(399, 1000), "brightness");
  assert.equal(getFullscreenGestureZone(400, 1000), "navigation");
});

test("only the center navigation zone can swipe between videos", () => {
  assert.equal(getFullscreenGestureZone(500, 1000), "navigation");
  assert.equal(getFullscreenGestureZone(599, 1000), "navigation");
  assert.equal(getFullscreenGestureZone(600, 1000), "volume");
  assert.equal(getFullscreenGestureZone(1000, 1000), "volume");
});

test("brightness and volume gestures require a dominant vertical movement", () => {
  assert.equal(isVerticalAdjustmentGesture(2, -12), true);
  assert.equal(isVerticalAdjustmentGesture(13, 4), false);
  assert.equal(isVerticalAdjustmentGesture(2, 7), false);
});
