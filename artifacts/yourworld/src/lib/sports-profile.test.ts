import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SportsDetailsPanel, SportsProfileCard } from "@/components/yw/SportsProfile";

const profile = {
  badge: "ATHLETE PROFILE",
  role: "Athlete" as const,
  sport: "Handball",
  eventPosition: "Goalkeeper",
  status: "National" as const,
  sportsId: null,
  represents: "India",
  verified: false,
  publicDetails: "Training #handballcoach",
  tournaments: ["State League"],
  medals: ["Gold medal"],
  achievements: ["Top scorer"],
  coachQualification: "Not recorded",
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
      documents: [],
      documentsLoading: false,
      documentsError: null,
      documentsUploading: false,
      onUploadDocument: () => undefined,
      onDocumentAction: () => undefined,
    }),
  );

  assert.match(html, /Event \/ position/);
  assert.match(html, /Sports ID/);
  assert.match(html, /State League/);
  assert.match(html, /Gold medal/);
  assert.match(html, /Top scorer/);
  assert.match(html, /sports-document-upload/);
  assert.match(html, /No verification documents uploaded/);
});