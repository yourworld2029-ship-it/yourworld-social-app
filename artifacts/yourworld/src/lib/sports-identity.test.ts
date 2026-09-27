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
    sport: "Handball",
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

test("verified national player and coach keep the country data without showing a flag", () => {
  for (const role of ["Player", "Coach"] as const) {
    const identity = deriveVerifiedSportsIdentity(profile(role, "National"), true);
    assert.equal(identity?.sport, "Handball");
    assert.equal(identity?.status, "National");
    assert.equal(identity?.countryFlag, "🇮🇳");
    assert.equal(identity?.monetized, true);
  }
});

test("approved identity preserves any sport for both supported roles", () => {
  for (const sport of ["Handball", "Cricket", "Football", "Kabaddi", "Badminton", "Boxing"]) {
    for (const role of ["Player", "Coach"] as const) {
      const identity = deriveVerifiedSportsIdentity(
        {
          category: `${role} · ${sport}`,
          bio: "Representation: International\nRepresents: India",
          location: "",
          is_verified: true,
        },
        false,
      );
      assert.equal(identity?.sport, sport);
      assert.equal(identity?.role, role);
      assert.equal(identity?.countryFlag, "🇮🇳");
    }
  }
});

test("monetization controls only the diamond or star", () => {
  const international = deriveVerifiedSportsIdentity(profile("Player", "International"), false);
  const national = deriveVerifiedSportsIdentity(profile("Coach", "National"), false);
  assert.equal(international?.countryFlag, "🇮🇳");
  assert.equal(international?.monetized, false);
  assert.equal(national?.countryFlag, "🇮🇳");
  assert.equal(national?.monetized, false);
  assert.equal(deriveVerifiedSportsIdentity({ ...profile("Player", "National"), is_verified: false }), null);
});

test("missing country values fall back to India's flag", () => {
  assert.equal(countryFlagForSportsIdentity("Unknown representation"), "🇮🇳");
  assert.equal(countryFlagForSportsIdentity("IN"), "🇮🇳");
});

test("international identity flags resolve from public represented-country text or country code", () => {
  const representedCountry = deriveVerifiedSportsIdentity({
    category: "Player · Athletics",
    bio: "Representation: International\nRepresents: Kenya",
    location: "",
    is_verified: true,
  });
  const publicCountryCode = deriveVerifiedSportsIdentity({
    category: "Player · Athletics",
    bio: "Representation: International\nRepresents: Kenya",
    location: "",
    country: "Japan",
    country_code: "NZ",
    is_verified: true,
  });

  assert.equal(representedCountry?.countryFlag, "🇰🇪");
  assert.equal(publicCountryCode?.country, "Japan");
  assert.equal(publicCountryCode?.countryFlag, "🇳🇿");
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
  assert.doesNotMatch(html, /sports-identity-badge__laurel/);
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

test("in-review profiles fail closed even if verification flags are inconsistent", () => {
  assert.equal(
    deriveVerifiedSportsIdentity({
      ...profile("Player", "International"),
      is_verified: true,
      verification_requested: true,
    }),
    null,
  );
});