import assert from "node:assert/strict";
import test from "node:test";
import { prependUniqueFeedItem } from "./published-feed";

test("new feed items are prepended once and the first page stays bounded", () => {
  const current = [{ id: "a" }, { id: "b" }, { id: "c" }];

  assert.deepEqual(
    prependUniqueFeedItem(current, { id: "new" }, 3),
    [{ id: "new" }, { id: "a" }, { id: "b" }],
  );
  assert.deepEqual(
    prependUniqueFeedItem(current, { id: "b" }, 3),
    [{ id: "b" }, { id: "a" }, { id: "c" }],
  );
  assert.deepEqual(current, [{ id: "a" }, { id: "b" }, { id: "c" }]);
});