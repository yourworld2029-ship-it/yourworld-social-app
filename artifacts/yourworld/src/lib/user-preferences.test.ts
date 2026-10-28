import assert from "node:assert/strict";
import test from "node:test";
import {
  commentMatchesUserFilters,
  DEFAULT_USER_PREFERENCES,
  normalizeUserPreferences,
  shouldUseDataSaverOnNetwork,
} from "./user-preferences";
import {
  formatDailyUsage,
  localDayKey,
  normalizeDailyUsageRecord,
  shouldShowDailyLimitReminder,
} from "./daily-usage";

test("preference normalization validates each setting and caps hidden words", () => {
  const preferences = normalizeUserPreferences({
    dataSaver: true,
    whoCanMessage: "invalid",
    hiddenWords: ["  phrase  ", "", "phrase", 3],
    dailyLimitMinutes: 45,
  });

  assert.equal(preferences.dataSaver, true);
  assert.equal(preferences.whoCanMessage, DEFAULT_USER_PREFERENCES.whoCanMessage);
  assert.deepEqual(preferences.hiddenWords, ["phrase"]);
  assert.equal(preferences.dailyLimitMinutes, null);
});

test("notification preferences normalize every supported category independently", () => {
  const preferences = normalizeUserPreferences({
    notificationPreferences: {
      likes: false,
      comments: "off",
      followers: true,
      messages: false,
      calls: false,
      monetization: true,
      system: null,
    },
  });

  assert.deepEqual(preferences.notificationPreferences, {
    likes: false,
    comments: true,
    followers: true,
    messages: false,
    calls: false,
    monetization: true,
    system: true,
  });
});

test("data saver activates only on cellular, system-saver, or slow connections", () => {
  assert.equal(shouldUseDataSaverOnNetwork(true, { type: "cellular" }), true);
  assert.equal(shouldUseDataSaverOnNetwork(true, { effectiveType: "3g" }), true);
  assert.equal(shouldUseDataSaverOnNetwork(true, { type: "wifi" }), false);
  assert.equal(shouldUseDataSaverOnNetwork(false, { type: "cellular" }), false);
});

test("comment filters match whole words and phrases without substring false positives", () => {
  const custom = {
    hideOffensiveComments: false,
    hiddenWords: ["spoiler alert"],
  };
  assert.equal(commentMatchesUserFilters("SPOILER   ALERT for the ending", custom), true);
  assert.equal(commentMatchesUserFilters("This is not a spoiler-alert", custom), false);
  assert.equal(commentMatchesUserFilters("class discussion", {
    hideOffensiveComments: true,
    hiddenWords: [],
  }), false);
  assert.equal(commentMatchesUserFilters("What bullshit", {
    hideOffensiveComments: true,
    hiddenWords: [],
  }), true);
});

test("daily usage resets on a new local day and formats elapsed time", () => {
  const today = new Date(2026, 9, 15, 12);
  const yesterday = new Date(2026, 9, 14, 12);
  assert.equal(localDayKey(today), "2026-10-15");
  assert.deepEqual(
    normalizeDailyUsageRecord({ day: "2026-10-14", seconds: 800 }, localDayKey(today)),
    { day: "2026-10-15", seconds: 0 },
  );
  assert.equal(formatDailyUsage(3665), "1h 1m");
  assert.equal(shouldShowDailyLimitReminder(1800, 30), true);
  assert.equal(shouldShowDailyLimitReminder(1799, 30), false);
  assert.equal(shouldShowDailyLimitReminder(6000, null), false);
  assert.notEqual(localDayKey(today), localDayKey(yesterday));
});
