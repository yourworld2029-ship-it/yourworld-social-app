import assert from "node:assert/strict";
import test from "node:test";
import { isBlackVideoPoster } from "./video-poster-blank";

test("profile posters reject black and near-black opening frames", () => {
  assert.equal(isBlackVideoPoster(new Uint8ClampedArray(32 * 32 * 4)), true);
  assert.equal(isBlackVideoPoster(new Uint8ClampedArray(32 * 32 * 4).fill(12)), true);
});

test("profile posters preserve visible dark scenes and letterboxed video", () => {
  const pixels = new Uint8ClampedArray(32 * 32 * 4);
  for (let i = 0; i < pixels.length / 2; i += 4) pixels[i] = 45;
  assert.equal(isBlackVideoPoster(pixels), false);
  assert.equal(isBlackVideoPoster(new Uint8ClampedArray(32 * 32 * 4).fill(80)), false);
  assert.equal(isBlackVideoPoster([]), false);
});
