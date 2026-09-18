import { Crown, Globe2, Star } from "lucide-react";
import { useVerifiedSportsIdentity, type VerifiedSportsIdentity } from "@/lib/sports-identity";

export type SportsIdentityTier = "international" | "national";

function HorizontalSportsBadge({
  identity,
  tier,
}: {
  identity: VerifiedSportsIdentity;
  tier: SportsIdentityTier;
}) {
  const international = tier === "international";
  const title = `${identity.status.toUpperCase()} ${identity.role.toUpperCase()}`;

  return (
    <span className="sports-identity-badge__badge-frame">
      <span className="sports-identity-badge__mini-crown" aria-hidden="true">
        <Crown />
      </span>
      <span className="sports-identity-badge__laurel sports-identity-badge__laurel--left" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <Globe2 className="sports-identity-badge__globe-icon" aria-hidden="true" />
      <span className="sports-identity-badge__label">{title}</span>
      {international && identity.countryFlag ? (
        <span
          className="sports-identity-badge__country-flag"
          title={`${identity.country} representation`}
          aria-label={`${identity.country} representation`}
        >
          {identity.countryFlag}
        </span>
      ) : null}
      <span className="sports-identity-badge__laurel sports-identity-badge__laurel--right" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </span>
  );
}

export function SportsIdentityBadge({
  identity,
  variant = "compact",
  tier,
}: {
  identity: VerifiedSportsIdentity | null;
  variant?: "compact" | "profile";
  tier?: SportsIdentityTier;
}) {
  if (!identity) return null;

  const identityTier: SportsIdentityTier =
    identity.status === "International" ? "international" : "national";
  const activeTier = tier === identityTier ? tier : identityTier;
  const international = activeTier === "international";
  const label = `${identity.status.toUpperCase()} ${identity.role.toUpperCase()}`;

  if (variant === "profile") {
    return (
      <div
        data-testid="sports-identity-profile-badge"
        role="img"
        aria-label={`${label}${international && identity.countryFlag ? `, ${identity.country} representation` : ""}`}
        title={label}
        className={`sports-identity-badge sports-identity-badge--profile sports-identity-badge--${
          international ? "international" : "national"
        }`}
      >
        <HorizontalSportsBadge identity={identity} tier={activeTier} />
      </div>
    );
  }

  return (
    <span
      data-testid="sports-identity-compact-badge"
      title={label}
      aria-label={`${label} identity badge`}
      className={`sports-identity-badge sports-identity-badge--compact sports-identity-badge--${
        international ? "international" : "national"
      }`}
    >
      {international ? (
        <>
          <span className="sports-identity-badge__compact-diamond" aria-hidden="true" />
          {identity.countryFlag ? <span className="sports-identity-badge__compact-flag">{identity.countryFlag}</span> : null}
        </>
      ) : (
        <Star className="sports-identity-badge__compact-star" aria-hidden="true" />
      )}
    </span>
  );
}

export function SportsIdentityMark({ userId }: { userId: string | null | undefined }) {
  const identity = useVerifiedSportsIdentity(userId ?? null);
  return <SportsIdentityBadge identity={identity} />;
}