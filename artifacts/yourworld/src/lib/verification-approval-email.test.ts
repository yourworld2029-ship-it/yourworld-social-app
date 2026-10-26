import assert from "node:assert/strict";
import test from "node:test";
import {
  buildVerificationApprovalEmail,
  cleanVerificationBadgeTitle,
  sportsApprovalBadgeTitle,
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
});

test("approval identity card shows profile name and the exact selected badge title", () => {
  const email = buildVerificationApprovalEmail({
    profileName: "Sample Creator",
    badgeKind: "award",
    badgeTitle: "Padma Award (Vibhushan / Bhushan / Shri) 🎖️",
  });
  assert.match(email.text, /Profile Name: Sample Creator/);
  assert.match(email.text, /Award \/ Sports Badge: Padma Award \(Vibhushan \/ Bhushan \/ Shri\)/);
  assert.match(email.html, /Profile Identity Card/);
  assert.match(email.html, /Sample Creator/);
  assert.match(email.html, /Padma Award \(Vibhushan \/ Bhushan \/ Shri\)/);
  assert.doesNotMatch(email.text, /sports identity/i);
});

test("badge label cleanup removes decorative symbols but preserves the selected name", () => {
  assert.equal(cleanVerificationBadgeTitle("Param Vir / Ashoka Chakra ⚔️"), "Param Vir / Ashoka Chakra");
});
