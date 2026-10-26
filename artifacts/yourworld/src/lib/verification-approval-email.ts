import { countryCodeForSportsCountry } from "./sports-country";

export type VerificationBadgeKind = "award" | "sports";
export type MonetizationQuotaTier = "special" | "national" | "standard";

export type SportsApprovalProfile = {
  category?: string | null;
  bio?: string | null;
  country?: string | null;
};

export function sportsApprovalBadgeTitle(profile: SportsApprovalProfile) {
  const category = profile.category?.trim() ?? "";
  const bio = profile.bio ?? "";
  const labelledTier =
    /^\s*(?:sports tier|verification tier|badge)\s*:\s*([^\r\n]+)/im.exec(bio)?.[1]?.trim() ?? "";
  if (
    /\bglobal\s+athlete\b/i.test(category) ||
    /^global(?:\s+athlete)?$/i.test(labelledTier)
  ) {
    return "Global Athlete";
  }

  const role = /\bcoach\b/i.test(category) ? "Coach" : "Player";
  const representation =
    /^\s*(?:representation|represents|status)\s*:\s*([^\r\n]+)/im.exec(bio)?.[1]?.trim() ??
    category;
  const status = /international/i.test(representation)
    ? "International"
    : /national/i.test(representation)
      ? "National"
      : countryCodeForSportsCountry(profile.country) === "IN"
        ? "National"
        : "International";

  if (status === "International") {
    return role === "Coach" ? "International Coach" : "International Athlete";
  }
  return role === "Coach" ? "National Coach" : "National Player";
}

/** Mirrors the representation branches in enforce_creator_monetization_eligibility. */
export function sportsMonetizationQuotaTier(
  profile: SportsApprovalProfile,
): MonetizationQuotaTier {
  const category = profile.category ?? "";
  const bio = profile.bio ?? "";
  if (!/\b(player|athlete|coach)\b/i.test(category)) return "standard";

  const internationalRepresentation =
    /(?:^|\r?\n)[ \t]*(?:representation|represents|status)[ \t]*:[ \t]*international(?:[ \t]+(?:player|coach))?(?=[ \t\r\n]|$)/i;
  const nationalRepresentation =
    /(?:^|\r?\n)[ \t]*(?:representation|represents|status)[ \t]*:[ \t]*national(?:[ \t]+(?:player|coach))?(?=[ \t\r\n]|$)/i;
  if (internationalRepresentation.test(bio)) return "special";
  if (nationalRepresentation.test(bio)) return "national";
  return "standard";
}

export function cleanVerificationBadgeTitle(title: string) {
  return title.replace(/\s*[🎖️⚔️🛡️🇮🇳]+$/u, "").trim();
}

function monetizationQuotaCopy(tier: MonetizationQuotaTier) {
  if (tier === "special") {
    return "Special Quota Unlocked: Monetize faster with only 10,000 followers, 1,500 watch hours, and 70,000 video views (Standard is 15k / 2,500 hrs / 150k views).";
  }
  if (tier === "national") {
    return "National Quota Unlocked: Monetize faster with only 12,000 followers, 2,000 watch hours, and 100,000 video views (Standard is 15k / 2,500 hrs / 150k views).";
  }
  return "Standard Quota: Monetization eligibility requires 15,000 followers, 2,500 watch hours, and 150,000 video views.";
}

export function buildVerificationApprovalEmail(input: {
  profileName: string;
  badgeKind: VerificationBadgeKind;
  badgeTitle: string;
  quotaTier: MonetizationQuotaTier;
}) {
  const profileName = input.profileName.trim() || "YourWorld Creator";
  const badgeTitle = cleanVerificationBadgeTitle(input.badgeTitle);
  const quotaCopy = monetizationQuotaCopy(input.quotaTier);
  const approvalType =
    input.badgeKind === "award" ? "National Honours / Gallantry Award" : "Sports Verification";
  const text = [
    `Congratulations, ${profileName}!`,
    `Your ${approvalType} has been approved and your profile badge has been updated.`,
    "Your Profile Identity Card:",
    `Profile Name: ${profileName}`,
    `Award / Sports Badge: ${badgeTitle}`,
    "Your Monetization Quota Privilege:",
    quotaCopy,
    "Open YourWorld to view your updated profile.",
    "— YourWorld Creator Admin",
  ].join("\n\n");

  const escapedProfileName = escapeEmailHtml(profileName);
  const escapedBadgeTitle = escapeEmailHtml(badgeTitle);
  const escapedQuotaCopy = escapeEmailHtml(quotaCopy);
  const html = `
    <div style="margin:0;padding:24px;background:#f4f2f8;font-family:Arial,Helvetica,sans-serif;color:#242033">
      <div style="max-width:600px;margin:0 auto;padding:28px;background:#ffffff;border:1px solid #e8e2f0;border-radius:16px">
        <p style="margin:0 0 10px;color:#4b1680;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase">YourWorld Verification</p>
        <h1 style="margin:0 0 14px;font-size:24px;line-height:1.3">Congratulations, ${escapedProfileName}!</h1>
        <p style="margin:0 0 22px;font-size:15px;line-height:1.6">Your ${approvalType} has been approved and your profile badge has been updated.</p>
        <div style="padding:20px;background:#24113e;border:1px solid #eadcf8;border-radius:14px;color:#ffffff">
          <div style="color:#f2a6e8;font-size:11px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase">Profile Identity Card</div>
          <div style="margin-top:8px;font-size:21px;font-weight:700">${escapedProfileName}</div>
          <div style="height:1px;margin:14px 0;background:#684b80"></div>
          <div style="color:#e7d7f4;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">Award / Sports Badge</div>
          <div style="margin-top:6px;color:#ffffff;font-size:17px;font-weight:700">${escapedBadgeTitle}</div>
        </div>
        <div style="margin-top:18px;padding:18px;background:#f8f3ff;border:1px solid #dfc9f2;border-radius:14px">
          <div style="color:#4b1680;font-size:13px;font-weight:700">Your Monetization Quota Privilege</div>
          <p style="margin:8px 0 0;color:#332544;font-size:14px;line-height:1.6">${escapedQuotaCopy}</p>
        </div>
        <p style="margin:22px 0 0;font-size:14px">Open YourWorld to view your updated profile.</p>
        <p style="margin:8px 0 0;font-size:14px">— YourWorld Creator Admin</p>
      </div>
    </div>`;

  return { profileName, badgeTitle, quotaCopy, text, html };
}

function escapeEmailHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
