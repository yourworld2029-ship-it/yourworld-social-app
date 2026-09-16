import { useVerifiedSportsIdentity, type VerifiedSportsIdentity } from "@/lib/sports-identity";

export function SportsIdentityBadge({
  identity,
  variant = "compact",
}: {
  identity: VerifiedSportsIdentity | null;
  variant?: "compact" | "profile";
}) {
  if (!identity) return null;

  if (variant === "profile") {
    const international = identity.status === "International";
    return (
      <div
        data-testid="sports-identity-profile-badge"
        className={`mt-1.5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-[0.12em] ${
          international
            ? "border-amber-200/45 bg-gradient-to-r from-amber-200/20 via-yellow-100/10 to-amber-300/20 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.16)]"
            : "border-sky-200/35 bg-gradient-to-r from-slate-200/15 via-sky-200/10 to-blue-300/15 text-sky-100"
        }`}
      >
        <span>{`${identity.status.toUpperCase()} ${identity.role.toUpperCase()}`}</span>
        {international && identity.countryFlag ? (
          <span
            title={`${identity.country} representation`}
            aria-label={`${identity.country} representation`}
            className="text-sm leading-none"
          >
            {identity.countryFlag}
          </span>
        ) : null}
        {identity.monetized ? (
          <span
            title={international ? "Monetization active" : "Monetization active"}
            aria-label={international ? "Diamond monetization badge" : "Star monetization badge"}
            className="text-sm leading-none"
          >
            {international ? "💎" : "🌟"}
          </span>
        ) : null}
      </div>
    );
  }

  if (!identity.monetized) return null;

  return (
    <span
      data-testid="sports-identity-compact-badge"
      title={`${identity.status} ${identity.role}`}
      aria-label={`${identity.status} ${identity.role} identity badge`}
      className={`inline-flex shrink-0 items-center gap-0.5 text-[12px] leading-none ${
        identity.status === "International" ? "text-amber-200" : "text-sky-200"
      }`}
    >
      {identity.monetized ? (identity.status === "International" ? "💎" : "🌟") : null}
      {identity.status === "International" && identity.countryFlag ? identity.countryFlag : null}
    </span>
  );
}

export function SportsIdentityMark({ userId }: { userId: string | null | undefined }) {
  const identity = useVerifiedSportsIdentity(userId ?? null);
  return <SportsIdentityBadge identity={identity} />;
}