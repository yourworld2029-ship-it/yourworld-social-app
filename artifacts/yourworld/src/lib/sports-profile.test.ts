import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  getSportsProfile,
  serializeSportsProfileBio,
  SportsDetailsPanel,
  SportsProfileCard,
  type SportsProfileDraft,
} from "@/components/yw/SportsProfile";

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

test("Sports Identity card opens details while summary columns stay display-only", () => {
  let opened = false;
  const card = SportsProfileCard({
    profile,
    onClick: () => {
      opened = true;
    },
  });

  assert.equal(card.type, "button");
  assert.equal(card.props["data-testid"], "button-sports-profile-details");
  assert.equal(card.props["aria-label"], "Sports Details");
  card.props.onClick();
  assert.equal(opened, true);

  const children = (Array.isArray(card.props.children) ? card.props.children : [card.props.children]) as Array<{
    type?: unknown;
    props?: {
      onClick?: (event: { stopPropagation: () => void }) => void;
    };
  }>;
  const summary = children.find((child) => child?.type === "dl");
  assert.ok(summary?.props?.onClick);
  let stopped = false;
  summary.props.onClick({
    stopPropagation: () => {
      stopped = true;
    },
  });
  assert.equal(stopped, true);
});

test("Sports Details renders real fields and owner document controls without the promo", () => {
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

  assert.doesNotMatch(html, /Event \/ position/);
  assert.doesNotMatch(html, /Public sports details/);
  assert.doesNotMatch(html, /Sports ID/);
  assert.match(html, /State League/);
  assert.match(html, /Gold medal/);
  assert.match(html, /Top scorer/);
  assert.match(html, /sports-document-upload/);
  assert.match(html, /Delete certificate\.pdf/);
  assert.match(html, /Sports Introduction/);
  assert.match(html, /I Agree to the Terms &amp; Conditions/);
  assert.match(html, /Submit for Verification/);
  assert.match(html, /disabled/);
  assert.ok(html.indexOf(">Documents<") < html.indexOf(">Sports Introduction<"));
  assert.ok(html.indexOf(">Sports Introduction<") < html.indexOf(">Terms &amp; Conditions<"));
  assert.doesNotMatch(html, /YOURWORLD VERIFIED SPORTS PROFILE/);
});

test("Sports Introduction metadata persists without creating a Reel", () => {
  const bio = serializeSportsProfileBio("", {
    username: "player",
    role: "Player",
    sport: "Handball",
    eventPosition: "",
    representation: "National",
    tournaments: [],
    medals: [],
    achievements: "",
    coachName: "",
    coachQualification: "",
    qualificationYear: "",
    institution: "",
    coachingExperience: "",
    teamDetails: "",
    sportsIntroductionPath: "player/sports-introduction/intro.mp4",
  });
  const parsed = getSportsProfile({
    is_verified: false,
    verification_requested: true,
    category: "Player · Handball",
    bio,
    location: "",
  });

  assert.match(bio, /Sports Introduction: player\/sports-introduction\/intro\.mp4/);
  assert.equal(parsed?.sportsIntroductionPath, "player/sports-introduction/intro.mp4");
  assert.equal(parsed?.verificationRequested, true);
  assert.doesNotMatch(bio, /Reel|Post|Moment/);
});

test("structured tournament entries persist independently for Players and Coaches", () => {
  const playerDraft: SportsProfileDraft = {
    username: "player",
    role: "Player",
    sport: "Handball",
    eventPosition: "Goalkeeper",
    representation: "National",
    tournaments: [
      {
        name: "Asian Games",
        date: "",
        level: "",
        result: "Bronze finish",
        startYear: "2023",
        startDate: "2023-09-23",
        endYear: "2023",
        endDate: "2023-10-08",
        country: "India",
        hostLocation: "Hangzhou",
        medal: "Bronze",
        eventPosition: "Handball",
      },
    ],
    medals: [],
    achievements: "",
    coachName: "",
    coachQualification: "",
    qualificationYear: "",
    institution: "",
    coachingExperience: "",
    teamDetails: "",
  };
  const playerBio = serializeSportsProfileBio("", playerDraft);
  const playerProfile = getSportsProfile({
    is_verified: false,
    category: "Player · Handball",
    bio: playerBio,
    location: "",
  });

  assert.match(playerBio, /Tournament: Asian Games/);
  assert.match(playerBio, /Start Date: 2023-09-23/);
  assert.match(playerBio, /End Date: 2023-10-08/);
  assert.equal(playerProfile?.tournamentDetails?.[0].country, "India");
  assert.equal(playerProfile?.tournamentDetails?.[0].medal, "Bronze");
  assert.equal(playerProfile?.tournamentDetails?.[0].eventPosition, "Handball");

  const legacyProfile = getSportsProfile({
    is_verified: false,
    category: "Player · Handball",
    bio: "Tournament: Asian Games | 2023 | Regional | Finalist",
    location: "",
  });
  assert.deepEqual(legacyProfile?.tournamentDetails?.[0], {
    name: "Asian Games",
    date: "2023",
    level: "Regional",
    result: "Finalist",
  });

  const coachDraft: SportsProfileDraft = {
    ...playerDraft,
    username: "coach",
    role: "Coach",
    tournaments: [
      {
        name: "World Championships",
        date: "",
        level: "",
        result: "Qualified team",
        startYear: "2024",
        startDate: "2024-02-01",
        endYear: "2024",
        endDate: "2024-02-15",
        country: "India",
        hostLocation: "Doha",
        medal: "No Medal",
        teamCountry: "India",
        roleResponsibility: "Head Coach",
      },
    ],
  };
  const coachProfile = getSportsProfile({
    is_verified: false,
    category: "Coach · Handball",
    bio: serializeSportsProfileBio("", coachDraft),
    location: "",
  });

  assert.equal(coachProfile?.tournamentDetails?.[0].teamCountry, "India");
  assert.equal(coachProfile?.tournamentDetails?.[0].roleResponsibility, "Head Coach");
  assert.equal(coachProfile?.tournamentDetails?.[0].medal, "No Medal");
});

test("National medal achievements display only for verified primary competitions", () => {
  const verifiedProfile = getSportsProfile({
    is_verified: true,
    category: "Player · Handball",
    bio: "Representation: National\nTournament: National Games (India) | Start Year: 2025 | Medal: Gold",
    location: "India",
  })!;
  const verifiedHtml = renderToStaticMarkup(
    createElement(SportsDetailsPanel, {
      profile: verifiedProfile,
      isOwner: false,
      documents: [],
      documentsLoading: false,
      documentsError: null,
      documentsUploading: false,
      onUploadDocument: () => undefined,
      onDocumentAction: () => undefined,
      onDeleteDocument: () => undefined,
    }),
  );

  assert.match(verifiedHtml, /National Competition/);
  assert.match(verifiedHtml, /🇮🇳 NATIONAL GAMES/);
  assert.match(verifiedHtml, /🥇 Gold Medal/);
  assert.match(verifiedHtml, /📅 2025/);

  const unverifiedProfile = getSportsProfile({
    is_verified: false,
    category: "Player · Handball",
    bio: "Representation: National\nTournament: National Games (India) | Start Year: 2025 | Medal: Gold",
    location: "India",
  })!;
  const unverifiedHtml = renderToStaticMarkup(
    createElement(SportsDetailsPanel, {
      profile: unverifiedProfile,
      isOwner: false,
      documents: [],
      documentsLoading: false,
      documentsError: null,
      documentsUploading: false,
      onUploadDocument: () => undefined,
      onDocumentAction: () => undefined,
      onDeleteDocument: () => undefined,
    }),
  );

  assert.match(unverifiedHtml, /National Competition/);
  assert.doesNotMatch(unverifiedHtml, /🥇 Gold Medal/);
});