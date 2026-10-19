const evidenceReasonPatterns: Record<string, RegExp[]> = {
  sportsCertificate: [
    /\bsports?\s+certificate\b/i,
    /\bcertificate\b/i,
    /\btournament\b/i,
    /\bmedal\b/i,
    /\bachievement\b/i,
  ],
  certificate: [/\bcertificate\b/i, /\bgazette\b/i, /\baward\b/i],
  indianIdentityProof: [
    /\bidentity\b/i,
    /\baadhaar\b/i,
    /\bvoter(?:\s+id)?\b/i,
    /\bnational\s+id\b/i,
    /\bid\s+proof\b/i,
  ],
  identity: [
    /\bidentity\b/i,
    /\baadhaar\b/i,
    /\bvoter(?:\s+id)?\b/i,
    /\bnational\s+id\b/i,
    /\bid\s+proof\b/i,
  ],
  passportFirstPage: [
    /\bpassport\b(?!.*(?:visa|stamp))/i,
    /\bfirst\s+page\b/i,
    /\bbio(?:data)?\s+page\b/i,
  ],
  passportVisaStampPage: [/\bvisa\b/i, /\bstamp(?:ed)?\b/i],
  introduction: [
    /\bintro(?:duction)?\b/i,
    /\bvideo\b/i,
    /\baudio\b/i,
    /\bvoice\b/i,
    /\bmusic\b/i,
    /\breel\b/i,
  ],
  sportsIntroduction: [
    /\bintro(?:duction)?\b/i,
    /\bvideo\b/i,
    /\baudio\b/i,
    /\bvoice\b/i,
    /\bmusic\b/i,
    /\breel\b/i,
  ],
};

const genericDocumentIssue =
  /\b(document|file|proof|image|photo|blur(?:red|ry)?|illegible|unreadable|quality|scan|upload)\b/i;

export function isEvidenceFlaggedForReview(
  reviewReason: string | null | undefined,
  evidenceKind: string,
  availableKinds: readonly string[],
): boolean {
  const reason = reviewReason?.trim() ?? "";
  if (!reason) return true;

  const specificallyFlagged = availableKinds.filter((kind) =>
    evidenceReasonPatterns[kind]?.some((pattern) => pattern.test(reason)),
  );
  if (specificallyFlagged.length) return specificallyFlagged.includes(evidenceKind);

  if (genericDocumentIssue.test(reason)) {
    return evidenceKind !== "introduction" && evidenceKind !== "sportsIntroduction";
  }

  // If the reviewer used free-form wording that cannot be classified, allow
  // correction uploads rather than trapping the applicant in a rejected state.
  return true;
}
