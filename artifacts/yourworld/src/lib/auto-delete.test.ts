import test from "node:test";
import assert from "node:assert/strict";
import {
  AFTER_VIEW_DELAY_MS,
  AUTO_DELETE_OPTIONS,
  VANISH_TIMER_OPTIONS,
  afterViewExpiresAt,
  autoDeleteExpiresAt,
  autoDeleteLabel,
  autoDeleteSeconds,
  formatVanishCountdown,
  isAutoDeleteExpired,
  normalizeChatAutoDeleteSetting,
  normalizeAutoDeleteSetting,
  vanishDelaySeconds,
  vanishDelaySecondsFromMetadata,
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

test("Vanish sub-timers preserve the immediate-on-exit default and selected delays", () => {
  assert.deepEqual(
    VANISH_TIMER_OPTIONS.map(({ value, label, delaySeconds }) => [value, label, delaySeconds]),
    [
      ["after_view", "Immediately (On Exit)", 0],
      ["after_view_15s", "15 Seconds", 15],
      ["after_view_1m", "1 Minute", 60],
      ["after_view_10m", "10 Minutes", 600],
    ],
  );
  assert.equal(normalizeChatAutoDeleteSetting("after_view_1m"), "after_view_1m");
  assert.equal(normalizeAutoDeleteSetting("after_view_1m"), "after_view");
  assert.equal(vanishDelaySeconds("after_view"), 0);
  assert.equal(vanishDelaySeconds("after_view_15s"), 15);
  assert.equal(vanishDelaySeconds("after_view_1m"), 60);
  assert.equal(vanishDelaySeconds("after_view_10m"), 600);
  assert.equal(vanishDelaySecondsFromMetadata({ vanish_delay_seconds: "60" }), 60);
  assert.equal(vanishDelaySecondsFromMetadata({ vanish_delay_seconds: 999 }), 0);
  assert.equal(formatVanishCountdown(14_100), "15s");
  assert.equal(formatVanishCountdown(60_000), "1:00");
  assert.equal(formatVanishCountdown(600_000), "10:00");
  assert.equal(formatVanishCountdown(-1), "0s");
});

test("compact database aliases normalize to the existing chat settings", () => {
  assert.equal(normalizeChatAutoDeleteSetting("immediately"), "after_view");
  assert.equal(normalizeChatAutoDeleteSetting("15s"), "after_view_15s");
  assert.equal(normalizeChatAutoDeleteSetting("1m"), "after_view_1m");
  assert.equal(normalizeChatAutoDeleteSetting("10m"), "after_view_10m");
  assert.equal(normalizeChatAutoDeleteSetting("5h"), "5_hours");
  assert.equal(normalizeChatAutoDeleteSetting("24h"), "24_hours");

  assert.equal(normalizeAutoDeleteSetting("15s"), "after_view");
  assert.equal(normalizeAutoDeleteSetting("5h"), "5_hours");
  assert.equal(normalizeAutoDeleteSetting("24h"), "24_hours");
  assert.equal(vanishDelaySeconds("15s"), 15);
  assert.equal(vanishDelaySeconds("1m"), 60);
  assert.equal(vanishDelaySeconds("10m"), 600);
  assert.equal(autoDeleteSeconds("5h"), 5 * 60 * 60);
  assert.equal(autoDeleteSeconds("24h"), 24 * 60 * 60);
  assert.equal(autoDeleteLabel("immediately"), "After View (Vanish Mode)");
  assert.equal(autoDeleteLabel("5h"), "5 Hours");
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