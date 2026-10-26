import { Crown, Globe2, Medal } from "lucide-react";
import "./_group.css";

type VerifiedSportsIdentity = {
  role: "Player" | "Coach";
  sport: string;
  status: "International" | "National";
  country: string;
  countryFlag: string | null;
  monetized: boolean;
};

type NationalAwardCode =
  | "bharat_ratna"
  | "padma_award"
  | "param_vir_ashoka_chakra"
  | "shaurya_kirti_chakra"
  | "sena_medal_gallantry"
  | "presidents_police_medal_gallantry";

function nationalAwardLabel(awardCode: NationalAwardCode): string {
  switch (awardCode) {
    case "bharat_ratna":
      return "🎖️ BHARAT RATNA AWARDEE 🇮🇳";
    case "padma_award":
      return "🎖️ PADMA AWARDEE 🇮🇳";
    case "param_vir_ashoka_chakra":
      return "⚔️ PARAM VIR / ASHOKA CHAKRA 🇮🇳";
    case "shaurya_kirti_chakra":
      return "⚔️ SHAURYA / KIRTI CHAKRA 🇮🇳";
    case "sena_medal_gallantry":
      return "🎖️ SENA MEDAL (GALLANTRY) 🇮🇳";
    case "presidents_police_medal_gallantry":
      return "🛡️ PRESIDENT'S POLICE MEDAL FOR GALLANTRY 🇮🇳";
  }
}

function HorizontalSportsBadge({
  identity,
  showCountryFlag,
}: {
  identity: VerifiedSportsIdentity;
  showCountryFlag: boolean;
}) {
  const title = `${identity.status.toUpperCase()} ${identity.role.toUpperCase()}`;

  return (
    <span className="sports-identity-badge__badge-frame">
      <span className="sports-identity-badge__mini-crown" aria-hidden="true">
        <Crown />
      </span>
      <Globe2 className="sports-identity-badge__globe-icon" aria-hidden="true" />
      <span className="sports-identity-badge__label">{title}</span>
      {showCountryFlag && identity.countryFlag ? (
        <span
          className="sports-identity-badge__country-flag"
          title={`${identity.country} representation`}
          aria-label={`${identity.country} representation`}
        >
          {identity.countryFlag}
        </span>
      ) : null}
    </span>
  );
}

function SportsIdentityBadge({
  identity,
}: {
  identity: VerifiedSportsIdentity;
}) {
  const international = identity.status === "International";
  const label = `${identity.status.toUpperCase()} ${identity.role.toUpperCase()}`;
  const countryFlag = international ? identity.countryFlag ?? "🇮🇳" : null;

  return (
    <div
      role="img"
      aria-label={`${label}${international ? `, ${identity.country || "India"} representation` : ""}`}
      title={label}
      className={`sports-identity-badge sports-identity-badge--profile sports-identity-badge--${
        international ? "international" : "national"
      }`}
    >
      <HorizontalSportsBadge
        identity={{ ...identity, countryFlag }}
        showCountryFlag={international}
      />
    </div>
  );
}

const sportsProfiles = [
  {
    name: "Aarav Mehta",
    handle: "@aarav.mehta",
    initials: "AM",
    category: "Handball · Player",
    tier: "National Player",
    identity: {
      role: "Player",
      sport: "Handball",
      status: "National",
      country: "India",
      countryFlag: "🇮🇳",
      monetized: false,
    } satisfies VerifiedSportsIdentity,
  },
  {
    name: "Meera Nair",
    handle: "@meera.coach",
    initials: "MN",
    category: "Athletics · Coach",
    tier: "National Coach",
    identity: {
      role: "Coach",
      sport: "Athletics",
      status: "National",
      country: "India",
      countryFlag: "🇮🇳",
      monetized: false,
    } satisfies VerifiedSportsIdentity,
  },
  {
    name: "Sana Kapoor",
    handle: "@sana.kapoor",
    initials: "SK",
    category: "Wrestling · Player",
    tier: "International Player · India",
    identity: {
      role: "Player",
      sport: "Wrestling",
      status: "International",
      country: "India",
      countryFlag: "🇮🇳",
      monetized: false,
    } satisfies VerifiedSportsIdentity,
  },
  {
    name: "Amelia Carter",
    handle: "@amelia.coaches",
    initials: "AC",
    category: "Swimming · Coach",
    tier: "International Coach · United States",
    identity: {
      role: "Coach",
      sport: "Swimming",
      status: "International",
      country: "United States",
      countryFlag: "🇺🇸",
      monetized: false,
    } satisfies VerifiedSportsIdentity,
  },
];

const awardProfiles: Array<{
  name: string;
  handle: string;
  initials: string;
  code: NationalAwardCode;
}> = [
  { name: "Kavita Rao", handle: "@kavita.rao", initials: "KR", code: "bharat_ratna" },
  { name: "Devika Sen", handle: "@devika.sen", initials: "DS", code: "padma_award" },
  { name: "Arjun Singh", handle: "@arjun.singh", initials: "AS", code: "param_vir_ashoka_chakra" },
  { name: "Nisha Verma", handle: "@nisha.verma", initials: "NV", code: "shaurya_kirti_chakra" },
  { name: "Kabir Joshi", handle: "@kabir.joshi", initials: "KJ", code: "sena_medal_gallantry" },
  { name: "Leela Thomas", handle: "@leela.thomas", initials: "LT", code: "presidents_police_medal_gallantry" },
];

function ProfilePreview({
  name,
  handle,
  initials,
  kicker,
  category,
  identity,
  awardCode,
}: {
  name: string;
  handle: string;
  initials: string;
  kicker: string;
  category?: string;
  identity?: VerifiedSportsIdentity;
  awardCode?: NationalAwardCode;
}) {
  return (
    <article className="yw-profile-card">
      <p className="yw-card-kicker">{kicker}</p>
      <div className="yw-profile-identity">
        <div className="yw-avatar" aria-hidden="true">{initials}</div>
        <div className="yw-profile-copy">
          <h3 className="yw-profile-name">{name}</h3>
          {identity ? <SportsIdentityBadge identity={identity} /> : null}
          {awardCode ? (
            <span
              className="yw-award-badge"
              aria-label={nationalAwardLabel(awardCode)}
              title="Verified National Award"
            >
              <Medal aria-hidden="true" />
              <span className="yw-award-label">{nationalAwardLabel(awardCode)}</span>
            </span>
          ) : null}
          <p className="yw-profile-handle">{handle}</p>
          {category ? <p className="yw-category-line">{category}</p> : null}
        </div>
      </div>
      <div className="yw-profile-stats">
        <div className="yw-stat">18<span>Posts</span></div>
        <div className="yw-stat">12.4k<span>Followers</span></div>
        <div className="yw-stat">284<span>Following</span></div>
      </div>
    </article>
  );
}

export function BadgeShowcase() {
  return (
    <main className="yw-badge-showcase">
      <h1 className="yw-showcase-heading">YourWorld profile badge preview</h1>
      <p className="yw-showcase-description">
        Sample profiles only. Sports badges and award labels use the current
        profile component markup; this preview does not create or assign real
        badges.
      </p>

      <h2 className="yw-section-title">Sports verification</h2>
      <div className="yw-profile-grid">
        {sportsProfiles.map((profile) => (
          <ProfilePreview
            key={profile.handle}
            {...profile}
            kicker={profile.tier}
          />
        ))}
      </div>
      <div className="yw-global-note">
        <strong>Global Athlete:</strong> the current public profile component
        does not render a separate “Global Athlete” badge. If the approved
        identity is International Player/Coach, the profile shows that
        International badge with the selected country flag.
      </div>

      <h2 className="yw-section-title">National honours & gallantry</h2>
      <div className="yw-profile-grid">
        {awardProfiles.map((profile) => (
          <ProfilePreview
            key={profile.code}
            name={profile.name}
            handle={profile.handle}
            initials={profile.initials}
            kicker="National award · verified"
            awardCode={profile.code}
          />
        ))}
      </div>
    </main>
  );
}
