import assert from "node:assert/strict";
import test from "node:test";
import { getFeedWindowIndices } from "./feed-windowing";

test("feed window renders the center item and one adjacent item", () => {
  assert.deepEqual(getFeedWindowIndices(8, 4), [4, 5]);
  assert.deepEqual(getFeedWindowIndices(8, 4, null, -1), [3, 4]);
});

test("feed window includes only available items at either end of the list", () => {
  assert.deepEqual(getFeedWindowIndices(4, 0), [0, 1]);
  assert.deepEqual(getFeedWindowIndices(4, 99), [3]);
  assert.deepEqual(getFeedWindowIndices(4, 0, null, -1), [0]);
});

test("feed window pins an active item without exceeding two rendered rows", () => {
  assert.deepEqual(getFeedWindowIndices(8, 4, 0), [0, 4]);
  assert.deepEqual(getFeedWindowIndices(8, 4, 5), [4, 5]);
});

test("feed window ignores invalid pin indexes and handles empty lists", () => {
  assert.deepEqual(getFeedWindowIndices(3, 1, -1), [1, 2]);
  assert.deepEqual(getFeedWindowIndices(0, 0), []);
});