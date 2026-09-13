import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SportsDetailsPanel, SportsProfileCard } from "@/components/yw/SportsProfile";

const profile = {
  badge: "PLAYER PROFILE",
  role: "Player" as const,
  sport: "Handball",
  eventPosition: "Goalkeeper",
  status: "National" as const,
  represents: "India",
  verified: false,
  publicDetails: "Training #handballcoach",
  tournaments: ["State League"],
  medals: ["Gold medal"],
  achievements: ["Top scorer"],
  coachName: "Coach name",
  coachQualification: "Not recorded",
  qualificationYear: "Not recorded",
  institution: "Not recorded",
  coachingExperience: "Not recorded",
  teamDetails: "Not recorded",
};

test("Premium Sports Profile card invokes its open callback when tapped", () => {
  let opened = false;
  const card = SportsProfileCard({
    profile,
    onClick: () => {
      opened = true;
    },
  });

  assert.equal(card.type, "button");
  assert.equal(card.props["data-testid"], "button-sports-profile-details");
  card.props.onClick();
  assert.equal(opened, true);
});

test("Sports Details renders real fields and owner document controls", () => {
  const html = renderToStaticMarkup(
    createElement(SportsDetailsPanel, {
      profile,
      isOwner: true,
      documents: [
        {
          path: "owner/certificate.pdf",
          name: "certificate.pdf",
          mimeType: "application/pdf",
          size: 120,
          updatedAt: null,
        },
      ],
      documentsLoading: false,
      documentsError: null,
      documentsUploading: false,
      onUploadDocument: () => undefined,
      onDocumentAction: () => undefined,
      onDeleteDocument: () => undefined,
    }),
  );

  assert.match(html, /Event \/ position/);
  assert.doesNotMatch(html, /Sports ID/);
  assert.match(html, /State League/);
  assert.match(html, /Gold medal/);
  assert.match(html, /Top scorer/);
  assert.match(html, /sports-document-upload/);
  assert.match(html, /Delete certificate\.pdf/);
  assert.match(html, /🏆 YOURWORLD VERIFIED SPORTS PROFILE/);
  assert.match(html, /Your Talent\. Your Achievement\. Your Identity\. Verified\./);
  assert.match(html, /Private Certificate\/Documents/);
  assert.match(html, /Private Qualification Documents/);
  assert.match(html, /Verification Video/);
  assert.match(html, /Submit for Verification/);
  assert.match(html, /authorized verification access/);
  assert.match(html, /fake, forged, altered or misleading/);
});