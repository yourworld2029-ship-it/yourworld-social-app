import assert from "node:assert/strict";
import test from "node:test";
import { getFeedWindowIndices } from "./feed-windowing";

test("feed window renders the center item and its immediate neighbors", () => {
  assert.deepEqual(getFeedWindowIndices(8, 4), [3, 4, 5]);
});

test("feed window clamps at either end of the list", () => {
  assert.deepEqual(getFeedWindowIndices(4, 0), [0, 1]);
  assert.deepEqual(getFeedWindowIndices(4, 99), [2, 3]);
});

test("feed window pins an active item even when it is outside the center window", () => {
  assert.deepEqual(getFeedWindowIndices(8, 4, 0), [0, 3, 4, 5]);
});

test("feed window ignores invalid pin indexes and handles empty lists", () => {
  assert.deepEqual(getFeedWindowIndices(3, 1, -1), [0, 1, 2]);
  assert.deepEqual(getFeedWindowIndices(0, 0), []);
});