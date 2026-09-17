import { Star } from "lucide-react";
import { useVerifiedSportsIdentity, type VerifiedSportsIdentity } from "@/lib/sports-identity";

export type SportsIdentityTier = "international" | "national";

const wreathLeaves = [
  { x: 43, y: 126, rotation: -34 },
  { x: 35, y: 113, rotation: -48 },
  { x: 31, y: 98, rotation: -62 },
  { x: 30, y: 82, rotation: -74 },
  { x: 35, y: 66, rotation: -92 },
  { x: 45, y: 52, rotation: -112 },
] as const;

function CrestStar({ className = "" }: { className?: string }) {
  return (
    <path
      className={className}
      d="m0-7 1.7 4.7L7 0 1.7 1.7 0 7l-1.7-5.3L-7 0l5.3-2.3L0-7Z"
    />
  );
}

function SportsCrest({
  identity,
  tier,
}: {
  identity: VerifiedSportsIdentity;
  tier: SportsIdentityTier;
}) {
  const international = tier === "international";
  const title = `${identity.status.toUpperCase()} ${identity.role.toUpperCase()}`;

  return (
    <svg
      aria-hidden="true"
      className="sports-identity-badge__crest-art"
      viewBox="0 0 240 176"
      role="presentation"
    >
      <defs>
        <linearGradient id={`sports-crest-${tier}-metal`} x1="0%" y1="0%" x2="100%" y2="100%">
          {international ? (
            <>
              <stop offset="0%" stopColor="#fff4b0" />
              <stop offset="15%" stopColor="#bd7b1a" />
              <stop offset="31%" stopColor="#fff1a0" />
              <stop offset="49%" stopColor="#9b5b13" />
              <stop offset="68%" stopColor="#ffe48a" />
              <stop offset="84%" stopColor="#75400e" />
              <stop offset="100%" stopColor="#e9b94c" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="16%" stopColor="#7e96ad" />
              <stop offset="32%" stopColor="#eef7ff" />
              <stop offset="50%" stopColor="#61788f" />
              <stop offset="69%" stopColor="#dcecff" />
              <stop offset="85%" stopColor="#43596d" />
              <stop offset="100%" stopColor="#b9cde0" />
            </>
          )}
        </linearGradient>
        <linearGradient id={`sports-crest-${tier}-shield`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={international ? "#f9d976" : "#d9e8f5"} stopOpacity="0.28" />
          <stop offset="48%" stopColor={international ? "#6b3d12" : "#1e3d5d"} stopOpacity="0.68" />
          <stop offset="100%" stopColor={international ? "#120d08" : "#08131e"} stopOpacity="0.94" />
        </linearGradient>
        <linearGradient id={`sports-crest-${tier}-shine`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.72" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id={`sports-crest-${tier}-glow`} x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur stdDeviation="2.2" result="softGlow" />
          <feMerge>
            <feMergeNode in="softGlow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`sports-crest-${tier}-shield-clip`}>
          <path d="M120 39c-21 2-43 8-64 19v43c0 28 21 49 64 67 43-18 64-39 64-67V58c-21-11-43-17-64-19Z" />
        </clipPath>
      </defs>

      <g
        className="sports-identity-badge__crest-metal"
        fill={`url(#sports-crest-${tier}-metal)`}
        stroke={`url(#sports-crest-${tier}-metal)`}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g className="sports-identity-badge__wreath" strokeWidth="2.4">
          <path d="M73 148C48 140 29 117 28 89c-1-24 9-43 27-55" fill="none" />
          <path d="M167 148c25-8 44-31 45-59 1-24-9-43-27-55" fill="none" />
          {wreathLeaves.map((leaf) => (
            <path
              key={`left-${leaf.x}-${leaf.y}`}
              d="M0 0c7-6 14-6 20-1-6 8-13 9-20 1Z"
              transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rotation})`}
            />
          ))}
          {wreathLeaves.map((leaf) => (
            <path
              key={`right-${leaf.x}-${leaf.y}`}
              d="M0 0c7-6 14-6 20-1-6 8-13 9-20 1Z"
              transform={`translate(${240 - leaf.x} ${leaf.y}) rotate(${180 - leaf.rotation})`}
            />
          ))}
        </g>

        <g className="sports-identity-badge__scrollwork" fill="none" strokeWidth="2">
          <path d="M62 53c-12-8-18-1-14 6 3 5 10 4 14-1M178 53c12-8 18-1 14 6-3 5-10 4-14-1" />
          <path d="M53 132c-12 2-15 11-7 13 7 2 11-4 8-10M187 132c12 2 15 11 7 13-7 2-11-4-8-10" />
          <path d="M47 75c-10-4-14 3-8 7 4 3 8 0 9-5M193 75c10-4 14 3 8 7-4 3-8 0-9-5" />
        </g>

        <path d="M96 35 101 12l19 16 19-16 5 23c-13 5-35 5-48 0Z" />
        <path d="M94 34h52v7H94z" />
        <circle cx="101" cy="12" r="3" stroke="none" />
        <circle cx="120" cy="28" r="3" stroke="none" />
        <circle cx="139" cy="12" r="3" stroke="none" />

        <path
          className="sports-identity-badge__shield"
          d="M120 39c-21 2-43 8-64 19v43c0 28 21 49 64 67 43-18 64-39 64-67V58c-21-11-43-17-64-19Z"
          fill={`url(#sports-crest-${tier}-shield)`}
          strokeWidth="3.4"
        />
        <path d="M120 45c-19 2-38 7-57 17v38c0 24 18 42 57 59 39-17 57-35 57-59V62c-19-10-38-15-57-17Z" fill="none" strokeWidth="1" opacity="0.72" />

        <g className="sports-identity-badge__globe-detail" fill="none" strokeWidth="1.35">
          <circle cx="120" cy="72" r="21" />
          <path d="M99 72h42M102 61c11 5 25 5 36 0M102 83c11-5 25-5 36 0M120 51c-9 8-9 34 0 42M120 51c9 8 9 34 0 42" />
          <path d="M120 51v42" opacity="0.72" />
        </g>

        <g className="sports-identity-badge__crest-divider" strokeWidth="1.35">
          <path d="M51 108h25M164 108h25" fill="none" />
          <g transform="translate(84 108)">
            <CrestStar />
          </g>
          <g transform="translate(156 108)">
            <CrestStar />
          </g>
        </g>

        <text
          className="sports-identity-badge__crest-title"
          x="120"
          y="112"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="10"
          fontWeight="700"
          letterSpacing="0.9"
        >
          {title}
        </text>

        <g className="sports-identity-badge__bottom-star" transform="translate(120 145)">
          <CrestStar />
        </g>
      </g>

      <g
        className="sports-identity-badge__shimmer"
        clipPath={`url(#sports-crest-${tier}-shield-clip)`}
        aria-hidden="true"
      >
        <rect x="-70" y="37" width="30" height="130" fill={`url(#sports-crest-${tier}-shine)`} />
      </g>
    </svg>
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
        <SportsCrest identity={identity} tier={activeTier} />
        {international && identity.countryFlag ? (
          <span
            title={`${identity.country} representation`}
            aria-label={`${identity.country} representation`}
            className="sports-identity-badge__flag"
          >
            {identity.countryFlag}
          </span>
        ) : null}
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