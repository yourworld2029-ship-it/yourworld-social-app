import assert from "node:assert/strict";
import { test } from "node:test";
import {
  normalizeProfileCategoryValue,
  parseNormalProfileCategories,
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