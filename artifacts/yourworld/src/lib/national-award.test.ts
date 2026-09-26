import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isNationalAwardCode,
  NATIONAL_AWARD_OPTIONS,
  NATIONAL_AWARD_YEARS,
  nationalAwardLabel,
} from "./national-award";

test("National Award choices match the six requested award groups", () => {
  assert.deepEqual(
    NATIONAL_AWARD_OPTIONS.map(({ label }) => label),
    [
      "Bharat Ratna 🎖️",
      "Padma Award (Vibhushan / Bhushan / Shri) 🎖️",
      "Param Vir / Ashoka Chakra ⚔️",
      "Shaurya / Kirti Chakra ⚔️",
      "Sena Medal (Gallantry) 🇮🇳",
      "President's Police Medal for Gallantry (PPMG) 🛡️",
    ],
  );
});

test("award year choices include every year from 1947 through 2026", () => {
  assert.equal(NATIONAL_AWARD_YEARS.length, 80);
  assert.equal(NATIONAL_AWARD_YEARS[0], "1947");
  assert.equal(NATIONAL_AWARD_YEARS.at(-1), "2026");
});

test("award codes and approved badge labels stay separate from Sports identity", () => {
  assert.equal(isNationalAwardCode("bharat_ratna"), true);
  assert.equal(isNationalAwardCode("sports_player"), false);
  assert.equal(nationalAwardLabel("padma_award"), "🎖️ PADMA AWARDEE 🇮🇳");
  assert.equal(
    nationalAwardLabel("presidents_police_medal_gallantry"),
    "🛡️ PRESIDENT'S POLICE MEDAL FOR GALLANTRY 🇮🇳",
  );
});