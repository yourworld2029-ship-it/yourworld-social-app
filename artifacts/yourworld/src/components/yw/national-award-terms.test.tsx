import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NationalAwardTermsSection } from "./NationalAwardTermsSection";

function renderTerms(accepted: boolean) {
  return renderToStaticMarkup(
    createElement(NationalAwardTermsSection, {
      accepted,
      editable: true,
      busy: false,
      submitting: false,
      onAcceptedChange: () => {},
    }),
  );
}

test("National Award terms render the required copy and keep submission gated by consent", () => {
  const unchecked = renderTerms(false);
  const checked = renderTerms(true);

  for (const phrase of [
    "Terms &amp; Conditions",
    "Review these requirements before submitting your National Award Profile for verification.",
    "Verification terms",
    "Tap to read",
    "I confirm that all information, identity details, and sports achievements submitted by me are genuine, true, and accurate.",
    "I bear full legal responsibility for the authenticity of my uploaded documents and credentials.",
    "Submission of fake, forged, or altered documents is strictly prohibited under applicable laws.",
    "YourWorld reserves the right to reject verification, revoke badges, suspend accounts, or take legal action against fraud.",
    "Identity documents and certificates remain strictly private and accessible only to authorized verification reviewers.",
    "I consent that my Introduction Video will be automatically published to my profile&#x27;s Reels feed as a public sports intro upon submission.",
    "All details, uploaded files, and video will be locked from editing or deletion during the 12 to 72-hour review period.",
    "Country selection is permanently locked upon submission to prevent misuse.",
    "YourWorld reserves the right to cross-verify claims with official sports federations and governing bodies.",
    "I Agree to the Terms &amp; Conditions",
    "Submit for Verification",
  ]) {
    assert.ok(unchecked.includes(phrase), `Missing National Award terms copy: ${phrase}`);
  }

  assert.match(unchecked, /button-submit-national-award-verification[^>]*disabled/);
  assert.doesNotMatch(checked, /button-submit-national-award-verification[^>]*disabled/);
});