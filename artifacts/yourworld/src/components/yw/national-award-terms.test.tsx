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
    "I confirm that all information submitted by me is true and accurate.",
    "I am responsible for the authenticity of my award certificate, gazette records, and identity information.",
    "Fake, forged, altered or misleading documents/information are strictly prohibited.",
    "YourWorld may reject or revoke verification if submitted information is found to be false.",
    "YourWorld may restrict or suspend accounts involved in fraudulent verification.",
    "YourWorld may take appropriate legal action or other remedies permitted under applicable law where applicable.",
    "Verification documents remain private and are used strictly for verification purposes.",
    "The Award Introduction video may be displayed publicly as part of the verified award profile.",
    "YourWorld may retain verification records/evidence for legitimate security, verification and legal purposes.",
    "Verification review typically takes between 12 to 72 working hours.",
    "YourWorld reserves the right to cross-verify award credentials with official government gazettes, ministries, or official honours portals.",
    "I Agree to the Terms &amp; Conditions",
    "Submit for Verification",
  ]) {
    assert.ok(unchecked.includes(phrase), `Missing National Award terms copy: ${phrase}`);
  }

  assert.match(unchecked, /button-submit-national-award-verification[^>]*disabled/);
  assert.doesNotMatch(checked, /button-submit-national-award-verification[^>]*disabled/);
});