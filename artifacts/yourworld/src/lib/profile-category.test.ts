import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NORMAL_PROFILE_MAIN_CATEGORIES,
  NORMAL_PROFILE_SUBCATEGORIES,
  SPORTS_CATALOGUE,
  SPORTS_PROFILE_ROLES,
  formatNormalProfileCategoryForDisplay,
  getNormalProfileCategoryMain,
  normalizeNormalProfileCategories,
  normalizeProfileCategoryValue,
  parseNormalProfileCategories,
  resolveNormalProfileCategories,
  serializeNormalProfileCategories,
} from "@/lib/profile-category";

test("normal profile categories select and persist at most two values", () => {
  assert.deepEqual(
    parseNormalProfileCategories("Music • Artist • Business"),
    ["Music", "Artist"],
  );
  assert.equal(
    serializeNormalProfileCategories(["Music", "Artist", "Business"]),
    "Music • Artist",
  );
  assert.equal(
    normalizeProfileCategoryValue("Music • Artist • Business"),
    "Music • Artist",
  );
});

test("Sports Identity category values remain unchanged", () => {
  const sportsCategory = "Player · Cricket";
  assert.deepEqual(parseNormalProfileCategories(sportsCategory), []);
  assert.equal(normalizeProfileCategoryValue(sportsCategory), sportsCategory);
});

test("normal Player, Coach, and Sports categories stay separate from Sports Identity", () => {
  assert.deepEqual(
    normalizeNormalProfileCategories(["Player", "Coach", "Sports"]),
    ["Player", "Coach"],
  );
  assert.deepEqual(
    resolveNormalProfileCategories(["Player", "Sports"], "Player · Cricket"),
    ["Player", "Sports"],
  );
});

test("normal categories support searchable main and sub-category values", () => {
  assert.equal(getNormalProfileCategoryMain("Music • Singer"), "Music");
  assert.equal(
    getNormalProfileCategoryMain("Sports • Handball • Player"),
    "Sports",
  );
  assert.ok(NORMAL_PROFILE_MAIN_CATEGORIES.includes("News & Media"));
  assert.ok(NORMAL_PROFILE_SUBCATEGORIES["News & Media"].includes("Journalist"));
  assert.ok(NORMAL_PROFILE_SUBCATEGORIES.Music.includes("Singer"));
});

test("Sports normal categories have a catalogue and role choices without affecting Sports Identity", () => {
  assert.ok(SPORTS_CATALOGUE.includes("Handball"));
  assert.ok(SPORTS_CATALOGUE.includes("Football"));
  assert.ok(SPORTS_PROFILE_ROLES.includes("Player"));
  assert.ok(SPORTS_PROFILE_ROLES.includes("Coach"));
  assert.deepEqual(
    normalizeNormalProfileCategories([
      "Sports • Handball • Player",
      "Sports • Football • Coach",
      "Music • Singer",
    ]),
    ["Sports • Handball • Player", "Music • Singer"],
  );
  assert.deepEqual(parseNormalProfileCategories("Player · Cricket"), []);
});

test("Sports main category is hidden only in the profile display label", () => {
  assert.equal(
    formatNormalProfileCategoryForDisplay("Sports • Handball • Player"),
    "Handball · Player",
  );
  assert.equal(
    formatNormalProfileCategoryForDisplay("Music • Singer"),
    "Music • Singer",
  );
});