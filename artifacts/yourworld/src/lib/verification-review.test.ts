import assert from "node:assert/strict";
import test from "node:test";
import { isEvidenceFlaggedForReview } from "./verification-review";

const sportsEvidenceKinds = [
  "sportsCertificate",
  "passportFirstPage",
  "passportVisaStampPage",
  "indianIdentityProof",
  "sportsIntroduction",
] as const;

test("a specific review reason enables only the matching evidence", () => {
  assert.equal(
    isEvidenceFlaggedForReview("The passport visa stamp page is unreadable.", "passportVisaStampPage", sportsEvidenceKinds),
    true,
  );
  assert.equal(
    isEvidenceFlaggedForReview("The passport visa stamp page is unreadable.", "passportFirstPage", sportsEvidenceKinds),
    false,
  );
  assert.equal(
    isEvidenceFlaggedForReview("The passport visa stamp page is unreadable.", "sportsCertificate", sportsEvidenceKinds),
    false,
  );
});

test("a general document-quality issue permits document repairs but not video replacement", () => {
  assert.equal(
    isEvidenceFlaggedForReview("Please upload a clearer document.", "indianIdentityProof", sportsEvidenceKinds),
    true,
  );
  assert.equal(
    isEvidenceFlaggedForReview("Please upload a clearer document.", "sportsCertificate", sportsEvidenceKinds),
    true,
  );
  assert.equal(
    isEvidenceFlaggedForReview("Please upload a clearer document.", "sportsIntroduction", sportsEvidenceKinds),
    false,
  );
});

test("unclassifiable reviewer wording keeps the correction path usable", () => {
  assert.equal(
    isEvidenceFlaggedForReview("Please correct the evidence.", "certificate", [
      "identity",
      "certificate",
      "introduction",
    ]),
    true,
  );
});
