import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  getSportsProfile,
  getUserEnteredProfileBio,
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

test("Sports Identity card opens details without the removed summary row", () => {
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
  }>;
  assert.equal(children.some((child) => child?.type === "dl"), false);
});

test("profile bio display keeps only user-entered lines", () => {
  assert.equal(
    getUserEnteredProfileBio(
      "A short user bio\nSport: Handball\nRepresentation: National\nTournament: State League",
    ),
    "A short user bio",
  );
  assert.equal(
    getUserEnteredProfileBio("Sports Introduction: player/intro.mp4\nRepresentation: National"),
    "",
  );
});

test("Sports Details renders real fields and the Sports Introduction without the promo", () => {
  const html = renderToStaticMarkup(
    createElement(SportsDetailsPanel, {
      profile,
      isOwner: true,
      onSave: () => undefined,
    }),
  );

  assert.doesNotMatch(html, /Event \/ position/);
  assert.doesNotMatch(html, /Public sports details/);
  assert.doesNotMatch(html, /Sports ID/);
  assert.doesNotMatch(html, /Sports identity/);
  assert.match(html, /State League/);
  assert.doesNotMatch(html, /No public medal details listed/);
  assert.doesNotMatch(html, /No public achievement details listed/);
  assert.doesNotMatch(html, /Edit medals/);
  assert.doesNotMatch(html, /Edit achievements/);
  assert.match(html, /Sports Introduction/);
  assert.match(html, /sports-introduction-upload/);
  assert.match(html, /Upload video/);
  assert.match(html, /Full Name/);
  assert.match(html, /Father(?:&#x27;|'|&apos;)s Name/);
  assert.match(html, /Date of Birth \(DOB\)/);
  assert.match(html, /match my identity documents exactly/);
  assert.match(html, /Phone Number/);
  assert.match(html, /Gmail \/ Email/);
  assert.ok(html.indexOf(">Identity Details<") < html.indexOf("Phone Number"));
  assert.ok(html.indexOf("Phone Number") < html.indexOf("Village / Town"));
  assert.ok(html.indexOf("Country") < html.indexOf("match my identity documents exactly"));
  assert.doesNotMatch(html, /Current residential address/);
  assert.doesNotMatch(html, /Sport Certificate Number/);
  assert.doesNotMatch(html, /Passport Number/);
  assert.doesNotMatch(html, />Documents</);
  assert.doesNotMatch(html, /One Tournament Photo/);
  assert.match(html, /I Agree to the Terms &amp; Conditions/);
  assert.match(html, /Submit for Verification/);
  assert.match(html, /Verification review typically takes between 12 to 72 working hours\./);
  assert.match(
    html,
    /YourWorld reserves the right to cross-verify tournament certificates with recognized sports federations\/bodies\./,
  );
  assert.match(html, /disabled/);
  assert.ok(html.indexOf(">Verification Details<") < html.indexOf(">Sports Introduction<"));
  assert.ok(html.indexOf(">Sports Introduction<") < html.indexOf(">Save Verification Details<"));
  assert.ok(html.indexOf(">Save Verification Details<") < html.indexOf(">Terms &amp; Conditions<"));
  assert.ok(
    html.indexOf("working hours.") < html.indexOf("I Agree to the Terms &amp; Conditions"),
  );
  assert.ok(
    html.indexOf("sports federations/bodies.") < html.indexOf("I Agree to the Terms &amp; Conditions"),
  );
  assert.doesNotMatch(html, /YOURWORLD VERIFIED SPORTS PROFILE/);
});

test("National verification shows the certificate but hides international evidence fields", () => {
  const html = renderToStaticMarkup(
    createElement(SportsDetailsPanel, {
      profile,
      isOwner: true,
      verificationDetails: {
        fullName: "",
        fatherName: "",
        dateOfBirth: "",
        address: "",
        passportNumber: "",
        certificateNumber: "",
        identityDetailsConfirmed: false,
        villageTown: "",
        district: "",
        state: "",
        country: "India",
        mobileNumber: "",
        email: "",
        sportsCertificate: null,
        passportFirstPage: null,
        passportVisaStampPage: null,
        tournamentPhoto: null,
      },
    }),
  );

  assert.match(html, /Sports Certificate/);
  assert.doesNotMatch(html, /Passport First Page/);
  assert.doesNotMatch(html, /Passport Visa \/ Stamp Page/);
  assert.doesNotMatch(html, /One Tournament Photo/);
});

test("International verification shows passport and visa fields", () => {
  const html = renderToStaticMarkup(
    createElement(SportsDetailsPanel, {
      profile: { ...profile, status: "International" as const },
      isOwner: true,
      verificationDetails: {
        fullName: "",
        fatherName: "",
        dateOfBirth: "",
        address: "",
        passportNumber: "",
        certificateNumber: "",
        identityDetailsConfirmed: false,
        villageTown: "",
        district: "",
        state: "",
        country: "India",
        mobileNumber: "",
        email: "",
        sportsCertificate: null,
        passportFirstPage: null,
        passportVisaStampPage: null,
        tournamentPhoto: null,
      },
    }),
  );

  assert.match(html, /Sports Certificate/);
  assert.match(html, /Passport First Page/);
  assert.match(html, /Passport Visa \/ Stamp Page/);
  assert.ok(html.indexOf("Passport Visa / Stamp Page") < html.indexOf(">Sports Introduction<"));
  assert.ok(html.indexOf(">Sports Introduction<") < html.indexOf(">Save Verification Details<"));
  assert.doesNotMatch(html, /One Tournament Photo/);
  assert.doesNotMatch(html, /INTERNATIONAL PLAYER/);
});

test("Non-owners can still view an existing Sports Introduction", () => {
  const html = renderToStaticMarkup(
    createElement(SportsDetailsPanel, {
      profile: { ...profile, sportsIntroductionPath: "player/intro.mp4" },
      isOwner: false,
      sportsIntroductionUrl: "https://example.com/intro.mp4",
    }),
  );

  assert.match(html, /Sports Introduction/);
  assert.match(html, /sports-introduction-video/);
  assert.doesNotMatch(html, /Upload video/);
});

test("Sports Introduction metadata persists without embedding a Reel marker", () => {
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
    }),
  );

  assert.match(unverifiedHtml, /National Competition/);
  assert.doesNotMatch(unverifiedHtml, /🥇 Gold Medal/);
});