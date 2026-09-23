import test from "node:test";
import assert from "node:assert/strict";
import { AFTER_VIEW_DELAY_MS, afterViewExpiresAt } from "./auto-delete";

test("after-view expiry is exactly five seconds after the receiver view time", () => {
  const viewedAt = Date.parse("2026-09-11T10:00:00.000Z");
  assert.equal(
    Date.parse(afterViewExpiresAt(viewedAt)) - viewedAt,
    AFTER_VIEW_DELAY_MS,
  );
});