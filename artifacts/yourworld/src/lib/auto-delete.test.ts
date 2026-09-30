import test from "node:test";
import assert from "node:assert/strict";
import {
  AFTER_VIEW_DELAY_MS,
  AUTO_DELETE_OPTIONS,
  afterViewExpiresAt,
  autoDeleteExpiresAt,
  autoDeleteLabel,
  autoDeleteSeconds,
  isAutoDeleteExpired,
  normalizeAutoDeleteSetting,
} from "./auto-delete";

test("View Once expiry is exactly five seconds after the receiver view time", () => {
  const viewedAt = Date.parse("2026-09-11T10:00:00.000Z");
  assert.equal(
    Date.parse(afterViewExpiresAt(viewedAt)) - viewedAt,
    AFTER_VIEW_DELAY_MS,
  );
});

test("selector exposes only the current four auto-delete modes", () => {
  assert.deepEqual(
    AUTO_DELETE_OPTIONS.map(({ value, label }) => [value, label]),
    [
      ["off", "Off"],
      ["after_view", "After View (Vanish Mode)"],
      ["5_hours", "5 Hours"],
      ["24_hours", "24 Hours"],
    ],
  );
});

test("timed settings expire from their selected duration and legacy values become five hours", () => {
  const createdAt = Date.parse("2026-09-11T10:00:00.000Z");
  assert.equal(autoDeleteSeconds("5_hours"), 5 * 60 * 60);
  assert.equal(autoDeleteSeconds("24_hours"), 24 * 60 * 60);
  assert.equal(autoDeleteExpiresAt("after_view", createdAt), null);
  assert.equal(autoDeleteExpiresAt("off", createdAt), null);
  assert.equal(autoDeleteExpiresAt("5_hours", createdAt), "2026-09-11T15:00:00.000Z");
  assert.equal(autoDeleteExpiresAt("24_hours", createdAt), "2026-09-12T10:00:00.000Z");
  assert.equal(normalizeAutoDeleteSetting("6_hours"), "5_hours");
  assert.equal(normalizeAutoDeleteSetting("3_hours"), "5_hours");
  assert.equal(normalizeAutoDeleteSetting(null, 1), "5_hours");
  assert.equal(autoDeleteLabel("after_view"), "After View (Vanish Mode)");
  assert.equal(autoDeleteLabel("6_hours"), "5 Hours");
});

test("timed expiry is derived from created_at, including legacy modes", () => {
  const createdAt = Date.parse("2026-09-11T10:00:00.000Z");
  const fiveHours = 5 * 60 * 60 * 1000;
  const twentyFourHours = 24 * 60 * 60 * 1000;

  assert.equal(isAutoDeleteExpired("5_hours", new Date(createdAt).toISOString(), createdAt + fiveHours - 1), false);
  assert.equal(isAutoDeleteExpired("5_hours", new Date(createdAt).toISOString(), createdAt + fiveHours), true);
  assert.equal(isAutoDeleteExpired("3_hours", new Date(createdAt).toISOString(), createdAt + fiveHours), true);
  assert.equal(isAutoDeleteExpired("6_hours", new Date(createdAt).toISOString(), createdAt + fiveHours - 1), false);
  assert.equal(isAutoDeleteExpired("24_hours", new Date(createdAt).toISOString(), createdAt + twentyFourHours - 1), false);
  assert.equal(isAutoDeleteExpired("24_hours", new Date(createdAt).toISOString(), createdAt + twentyFourHours), true);
  assert.equal(isAutoDeleteExpired("after_view", new Date(createdAt).toISOString(), createdAt + fiveHours), false);
});