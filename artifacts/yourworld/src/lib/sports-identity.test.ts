import assert from "node:assert/strict";
import { test } from "node:test";
import {
  countryFlagForSportsIdentity,
  deriveVerifiedSportsIdentity,
} from "@/lib/sports-identity";

const profile = (role: "Player" | "Coach", representation: "International" | "National") => ({
  category: `${role} · Handball`,
  bio: `Representation: ${representation}\nRepresents: India`,
  location: "",
  is_verified: true,
});

test("verified international player and coach use premium identity data", () => {
  assert.deepEqual(deriveVerifiedSportsIdentity(profile("Player", "International"), true), {
    role: "Player",
    status: "International",
    country: "India",
    countryFlag: "🇮🇳",
    monetized: true,
  });
  assert.equal(
    deriveVerifiedSportsIdentity(profile("Coach", "International"), true)?.role,
    "Coach",
  );
});

test("verified national player and coach never receive a country flag", () => {
  for (const role of ["Player", "Coach"] as const) {
    const identity = deriveVerifiedSportsIdentity(profile(role, "National"), true);
    assert.equal(identity?.status, "National");
    assert.equal(identity?.countryFlag, null);
    assert.equal(identity?.monetized, true);
  }
});

test("monetization controls only the diamond or star", () => {
  const international = deriveVerifiedSportsIdentity(profile("Player", "International"), false);
  const national = deriveVerifiedSportsIdentity(profile("Coach", "National"), false);
  assert.equal(international?.countryFlag, "🇮🇳");
  assert.equal(international?.monetized, false);
  assert.equal(national?.countryFlag, null);
  assert.equal(national?.monetized, false);
  assert.equal(deriveVerifiedSportsIdentity({ ...profile("Player", "National"), is_verified: false }), null);
});

test("unknown country names do not invent a flag", () => {
  assert.equal(countryFlagForSportsIdentity("Unknown representation"), null);
});