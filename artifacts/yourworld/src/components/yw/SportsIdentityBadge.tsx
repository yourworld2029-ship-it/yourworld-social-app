import { Crown, Globe2, Star } from "lucide-react";
import { useVerifiedSportsIdentity, type VerifiedSportsIdentity } from "@/lib/sports-identity";

export function SportsIdentityBadge({
  identity,
  variant = "compact",
}: {
  identity: VerifiedSportsIdentity | null;
  variant?: "compact" | "profile";
}) {
  if (!identity) return null;

  const international = identity.status === "International";
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
        <span className="sports-identity-badge__wing sports-identity-badge__wing--left" aria-hidden="true" />
        <span className="sports-identity-badge__wing sports-identity-badge__wing--right" aria-hidden="true" />
        <span className="sports-identity-badge__top-icon" aria-hidden="true">
          {international ? <Crown /> : <Star />}
        </span>
        <span className="sports-identity-badge__globe" aria-hidden="true">
          {international ? <Globe2 /> : null}
        </span>
        <span className="sports-identity-badge__panel">
          <span className="sports-identity-badge__status">{identity.status}</span>
          <span className="sports-identity-badge__role">{identity.role}</span>
        </span>
        {international && identity.countryFlag ? (
          <span
            title={`${identity.country} representation`}
            aria-label={`${identity.country} representation`}
            className="sports-identity-badge__flag"
          >
            {identity.countryFlag}
          </span>
        ) : null}
        <Star className="sports-identity-badge__bottom-star" aria-hidden="true" />
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