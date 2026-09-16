import assert from "node:assert/strict";
import { test } from "node:test";
import {
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