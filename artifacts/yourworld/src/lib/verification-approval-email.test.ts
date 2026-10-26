import assert from "node:assert/strict";
import test from "node:test";
import {
  buildVerificationApprovalEmail,
  cleanVerificationBadgeTitle,
  sportsApprovalBadgeTitle,
  sportsMonetizationQuotaTier,
} from "./verification-approval-email";

test("sports approval email resolves National and International role titles exactly", () => {
  assert.equal(
    sportsApprovalBadgeTitle({
      category: "Player · Handball",
      bio: "Representation: National",
      country: "India",
    }),
    "National Player",
  );
  assert.equal(
    sportsApprovalBadgeTitle({
      category: "Coach · Football",
      bio: "Representation: International",
      country: "United Kingdom",
    }),
    "International Coach",
  );
  assert.equal(
    sportsMonetizationQuotaTier({
      category: "Coach · Football",
      bio: "Representation: International",
      country: "United Kingdom",
    }),
    "special",
  );
  assert.equal(
    sportsMonetizationQuotaTier({
      category: "Player · Handball",
      bio: "Representation: National",
      country: "India",
    }),
    "national",
  );
});

test("explicit Global Athlete tier takes precedence over the general sports role", () => {
  assert.equal(
    sportsApprovalBadgeTitle({
      category: "Global Athlete · Athletics",
      bio: "Representation: International",
      country: "India",
    }),
    "Global Athlete",
  );
  assert.equal(
    sportsMonetizationQuotaTier({
      category: "Global Athlete · Athletics",
      bio: "Representation: International",
      country: "India",
    }),
    "special",
  );
});

test("approval identity card shows profile name and the exact selected badge title", () => {
  const email = buildVerificationApprovalEmail({
    profileName: "Sample Creator",
    badgeKind: "award",
    badgeTitle: "Padma Award (Vibhushan / Bhushan / Shri) 🎖️",
    quotaTier: "special",
  });
  assert.match(email.text, /Profile Name: Sample Creator/);
  assert.match(email.text, /Award \/ Sports Badge: Padma Award \(Vibhushan \/ Bhushan \/ Shri\)/);
  assert.match(email.html, /Profile Identity Card/);
  assert.match(email.html, /Sample Creator/);
  assert.match(email.html, /Padma Award \(Vibhushan \/ Bhushan \/ Shri\)/);
  assert.match(email.text, /Your Monetization Quota Privilege:/);
  assert.match(
    email.text,
    /Special Quota Unlocked: Monetize faster with only 10,000 followers, 1,500 watch hours, and 70,000 video views \(Standard is 15k \/ 2,500 hrs \/ 150k views\)\./,
  );
  assert.match(email.html, /Your Monetization Quota Privilege/);
  assert.doesNotMatch(email.text, /sports identity/i);
});

test("national sports approval email includes the exact national quota", () => {
  const email = buildVerificationApprovalEmail({
    profileName: "Sample Coach",
    badgeKind: "sports",
    badgeTitle: "National Coach",
    quotaTier: "national",
  });
  assert.match(
    email.quotaCopy,
    /National Quota Unlocked: Monetize faster with only 12,000 followers, 2,000 watch hours, and 100,000 video views \(Standard is 15k \/ 2,500 hrs \/ 150k views\)\./,
  );
});

test("badge label cleanup removes decorative symbols but preserves the selected name", () => {
  assert.equal(cleanVerificationBadgeTitle("Param Vir / Ashoka Chakra ⚔️"), "Param Vir / Ashoka Chakra");
});
