import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSportsProfile } from "@/components/yw/SportsProfile";
import { countryFlagForSportsCountry } from "@/lib/sports-country";

type SportsProfileSource = Parameters<typeof getSportsProfile>[0];
type PublicCountryProfile = {
  country?: string | null;
  country_code?: string | null;
  verification_requested?: boolean | null;
};

export type VerifiedSportsIdentity = {
  role: "Player" | "Coach";
  sport: string;
  status: "International" | "National";
  country: string;
  countryFlag: string | null;
  monetized: boolean;
};

const DEFAULT_COUNTRY = "India";
const DEFAULT_COUNTRY_FLAG = "🇮🇳";

export function countryFlagForSportsIdentity(country: string | null | undefined) {
  const normalized = country?.trim() ?? "";
  const isMissing =
    !normalized || /^(?:not specified|not recorded|unknown(?: representation)?)$/i.test(normalized);
  return countryFlagForSportsCountry(isMissing ? DEFAULT_COUNTRY : normalized);
}

export function deriveVerifiedSportsIdentity(
  profile: SportsProfileSource & PublicCountryProfile,
  monetized = false,
): VerifiedSportsIdentity | null {
  const sportsProfile = getSportsProfile(profile);
  if (
    !sportsProfile?.verified ||
    profile.verification_requested === true ||
    (sportsProfile.status !== "International" && sportsProfile.status !== "National")
  ) {
    return null;
  }

  const profileCountry = profile.country?.trim() ?? "";
  const representedCountry = sportsProfile.represents.trim();
  const country =
    profileCountry &&
    !/^(?:not specified|not recorded|unknown(?: representation)?)$/i.test(profileCountry)
      ? profileCountry
      : representedCountry &&
          !/^(?:not specified|not recorded|unknown(?: representation)?)$/i.test(representedCountry)
        ? representedCountry
      : DEFAULT_COUNTRY;
  return {
    role: sportsProfile.role,
    sport: sportsProfile.sport.trim(),
    status: sportsProfile.status,
    country,
    countryFlag:
      countryFlagForSportsIdentity(profile.country_code?.trim() || country) ?? DEFAULT_COUNTRY_FLAG,
    monetized,
  };
}

function monetizationIsActive(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const row = value as { status?: unknown; is_monetized?: unknown };
  return (
    row.is_monetized === true ||
    ["active", "approved"].includes(String(row.status ?? "").trim().toLowerCase())
  );
}

type PublicSportsProfileRow = {
  category?: string | null;
  bio?: string | null;
  country?: string | null;
  country_code?: string | null;
  is_verified?: boolean | null;
  verification_requested?: boolean | null;
};

export async function loadVerifiedSportsIdentity(userId: string): Promise<VerifiedSportsIdentity | null> {
  if (!userId) return null;

  const [profileResult, monetizationResult, channelResult] = await Promise.all([
    supabase.rpc("get_public_profiles", { ids: [userId] }),
    supabase.from("monetization").select("status").eq("user_id", userId).maybeSingle(),
    supabase.from("channels").select("is_monetized").eq("user_id", userId).maybeSingle(),
  ]);

  const profile = ((profileResult.data ?? [])[0] ?? null) as PublicSportsProfileRow | null;
  if (!profile) return null;

  const monetized =
    monetizationIsActive(monetizationResult.data) || monetizationIsActive(channelResult.data);
  return deriveVerifiedSportsIdentity(
    {
      category: profile.category ?? "",
      bio: profile.bio ?? "",
      country: profile.country,
      country_code: profile.country_code,
      location: "",
       is_verified: profile.is_verified === true && profile.verification_requested !== true,
    },
    monetized,
  );
}

export function useVerifiedSportsIdentity(userId: string | null) {
  const [identity, setIdentity] = useState<VerifiedSportsIdentity | null>(null);

  useEffect(() => {
    let active = true;
    // Never keep the previous account's badge visible while the new
    // account's ID-scoped profile lookup is in flight.
    setIdentity(null);
    if (!userId) {
      return;
    }

    const load = () => {
      void loadVerifiedSportsIdentity(userId)
        .then((next) => {
          if (active) setIdentity(next);
        })
        .catch(() => {
          if (active) setIdentity(null);
        });
    };

    load();
    const refresh = window.setInterval(load, 30_000);
    return () => {
      active = false;
      window.clearInterval(refresh);
    };
  }, [userId]);

  return identity;
}