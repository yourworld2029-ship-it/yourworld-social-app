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
    profileName: "Arjun Mehta",
    badgeKind: "award",
    badgeTitle: "Padma Award (Vibhushan / Bhushan / Shri) 🎖️",
    quotaTier: "special",
    country: "India",
    avatarUrl: "https://cdn.example.com/avatars/arjun.jpg",
    profileUrl: "https://your-world-social-app--yourworld2029.replit.app/u/creator-123",
  });
  assert.match(email.text, /YOURWORLD VERIFIED 🏆/);
  assert.match(email.text, /Badhaai Ho, Arjun Mehta! 🏆🎉/);
  assert.match(email.text, /Aapne desh aur samaj ka naam uncha kiya hai/);
  assert.match(email.text, /hum aapko Padma Award \(Vibhushan \/ Bhushan \/ Shri\) ke sath verify kar rahe hain/);
  assert.match(email.text, /Profile Name: Arjun Mehta/);
  assert.match(
    email.text,
    /National Honours \/ Gallantry Award: Padma Award \(Vibhushan \/ Bhushan \/ Shri\)/,
  );
  assert.match(email.html, /Profile Identity Card/);
  assert.match(email.html, /Arjun Mehta/);
  assert.match(email.html, /Padma Award \(Vibhushan \/ Bhushan \/ Shri\)/);
  assert.match(email.html, /YOURWORLD VERIFIED 🏆/);
  assert.match(email.html, /cdn\.example\.com\/avatars\/arjun\.jpg/);
  assert.match(email.html, /GO TO MY PROFILE/);
  assert.match(email.text, /Your Monetization Quota Privilege:/);
  assert.match(
    email.text,
    /Special Quota Unlocked: Monetize faster with only 10,000 followers, 1,500 watch hours, and 70,000 video views \(Standard is 15k \/ 2,500 hrs \/ 150k views\)\./,
  );
  assert.match(email.html, /Your Monetization Quota Privilege/);
  assert.doesNotMatch(email.text, /sports identity/i);
  assert.doesNotMatch(email.text, /share your pride|take a screenshot/i);
});

test("national sports approval email includes the exact national quota", () => {
  const email = buildVerificationApprovalEmail({
    profileName: "Meera Sharma",
    badgeKind: "sports",
    badgeTitle: "National Coach",
    quotaTier: "national",
    country: "India",
  });
  assert.match(
    email.quotaCopy,
    /National Quota Unlocked: Monetize faster with only 12,000 followers, 2,000 watch hours, and 100,000 video views \(Standard is 15k \/ 2,500 hrs \/ 150k views\)\./,
  );
});

test("approval email uses a safe initials avatar when a usable profile image is unavailable", () => {
  const email = buildVerificationApprovalEmail({
    profileName: "Riya Kapoor",
    badgeKind: "sports",
    badgeTitle: "International Athlete",
    quotaTier: "special",
    country: "United States",
    avatarUrl: "javascript:alert(1)",
    profileUrl: "http://unsafe.example.com/profile",
  });
  assert.match(email.html, /aria-label="Riya Kapoor avatar"/);
  assert.match(email.html, />RK<\/div>/);
  assert.match(email.text, /Congratulations, Riya Kapoor! 🏆🎉/);
  assert.match(
    email.text,
    /Your athletic achievements and dedication to sports inspire us all\./,
  );
  assert.match(
    email.text,
    /We are proud to verify you with the International Athlete badge\. Welcome to YourWorld! 🇺🇸/,
  );
  assert.doesNotMatch(email.text, /🇮🇳|Badhaai Ho|Aapne desh/);
  assert.doesNotMatch(email.html, /javascript:|unsafe\.example/);
  assert.equal(
    email.profileUrl,
    "https://your-world-social-app--yourworld2029.replit.app/profile",
  );
});

test("India-based international sports badges retain the Hindi tribute and Indian flag", () => {
  const email = buildVerificationApprovalEmail({
    profileName: "Ananya Rao",
    badgeKind: "sports",
    badgeTitle: "International Athlete",
    quotaTier: "special",
    country: "India",
  });
  assert.match(email.text, /Badhaai Ho, Ananya Rao! 🏆🎉/);
  assert.match(email.text, /🇮🇳/);
  assert.doesNotMatch(email.text, /Congratulations, Ananya Rao|🇺🇸/);
});

test("badge label cleanup removes decorative symbols but preserves the selected name", () => {
  assert.equal(cleanVerificationBadgeTitle("Param Vir / Ashoka Chakra ⚔️"), "Param Vir / Ashoka Chakra");
});
