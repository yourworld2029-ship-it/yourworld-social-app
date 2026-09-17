import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SportsIdentityBadge } from "@/components/yw/SportsIdentityBadge";
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

test("international profile badge renders the premium gold identity", () => {
  const identity = deriveVerifiedSportsIdentity(profile("Player", "International"), false);
  const html = renderToStaticMarkup(
    createElement(SportsIdentityBadge, { identity, variant: "profile" }),
  );

  assert.match(html, /INTERNATIONAL/);
  assert.match(html, /PLAYER/);
  assert.match(html, /🇮🇳/);
  assert.match(html, /sports-identity-badge--international/);
});

test("national profile badge renders the silver-blue identity without a flag", () => {
  const identity = deriveVerifiedSportsIdentity(profile("Coach", "National"), false);
  const html = renderToStaticMarkup(
    createElement(SportsIdentityBadge, { identity, variant: "profile" }),
  );

  assert.match(html, /NATIONAL/);
  assert.match(html, /COACH/);
  assert.doesNotMatch(html, /🇮🇳/);
  assert.match(html, /sports-identity-badge--national/);
});

test("compact approved identity marks render even when monetization is inactive", () => {
  const international = renderToStaticMarkup(
    createElement(SportsIdentityBadge, {
      identity: deriveVerifiedSportsIdentity(profile("Player", "International"), false),
    }),
  );
  const national = renderToStaticMarkup(
    createElement(SportsIdentityBadge, {
      identity: deriveVerifiedSportsIdentity(profile("Coach", "National"), false),
    }),
  );

  assert.match(international, /sports-identity-compact-badge/);
  assert.match(international, /🇮🇳/);
  assert.match(national, /sports-identity-compact-badge/);
  assert.doesNotMatch(national, /🇮🇳/);
});

test("unverified users render no identity badge", () => {
  const html = renderToStaticMarkup(
    createElement(SportsIdentityBadge, {
      identity: deriveVerifiedSportsIdentity({ ...profile("Player", "National"), is_verified: false }),
      variant: "profile",
    }),
  );

  assert.equal(html, "");
});