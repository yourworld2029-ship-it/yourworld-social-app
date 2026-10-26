import {
  countryCodeForSportsCountry,
  countryFlagForSportsCountry,
} from "./sports-country";

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
  country: string | null;
  avatarUrl?: string | null;
  profileUrl?: string | null;
}) {
  const profileName = input.profileName.trim() || "YourWorld Creator";
  const badgeTitle = cleanVerificationBadgeTitle(input.badgeTitle);
  const quotaCopy = monetizationQuotaCopy(input.quotaTier);
  const avatarUrl = safeHttpsUrl(input.avatarUrl);
  const profileUrl =
    safeHttpsUrl(input.profileUrl) ??
    "https://your-world-social-app--yourworld2029.replit.app/profile";
  const countryCode = countryCodeForSportsCountry(input.country);
  const isIndianCreator = countryCode === "IN";
  const countryFlag = countryFlagForSportsCountry(input.country);
  const greeting = isIndianCreator
    ? `Badhaai Ho, ${profileName}! 🏆🎉`
    : `Congratulations, ${profileName}! 🏆🎉`;
  const tributeParagraphs = isIndianCreator
    ? [
        "Aapne desh aur samaj ka naam uncha kiya hai, isliye YourWorld par aapka swagat bhi sabse khas hona chahiye! 🇮🇳",
        `Hamein behad garv hai ki hum aapko ${badgeTitle} ke sath verify kar rahe hain.`,
      ]
    : [
        "Your athletic achievements and dedication to sports inspire us all.",
        `We are proud to verify you with the ${badgeTitle} badge. Welcome to YourWorld!${countryFlag ? ` ${countryFlag}` : ""}`,
      ];
  const avatarInitials =
    profileName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toLocaleUpperCase() ?? "")
      .join("") || "Y";
  const badgeLabel = input.badgeKind === "award" ? "National Honours / Gallantry Award" : "Sports Badge";
  const text = [
    "YOURWORLD VERIFIED 🏆",
    greeting,
    ...tributeParagraphs,
    "Your Profile Identity Card:",
    `Profile Name: ${profileName}`,
    `${badgeLabel}: ${badgeTitle}`,
    "Your Monetization Quota Privilege:",
    quotaCopy,
    `[ GO TO MY PROFILE ] ${profileUrl}`,
    "— Team YourWorld Social",
  ].join("\n\n");

  const escapedProfileName = escapeEmailHtml(profileName);
  const escapedBadgeTitle = escapeEmailHtml(badgeTitle);
  const escapedQuotaCopy = escapeEmailHtml(quotaCopy);
  const escapedGreeting = escapeEmailHtml(greeting);
  const htmlTributeParagraphs = tributeParagraphs
    .map((paragraph) => `<p style="margin:0 0 12px;color:#e6deeb;font-size:16px;line-height:1.75">${escapeEmailHtml(paragraph)}</p>`)
    .join("");
  const escapedAvatarInitials = escapeEmailHtml(avatarInitials);
  const escapedAvatarUrl = avatarUrl ? escapeEmailHtml(avatarUrl) : null;
  const escapedProfileUrl = escapeEmailHtml(profileUrl);
  const avatarContent = escapedAvatarUrl
    ? `<img src="${escapedAvatarUrl}" width="72" height="72" alt="${escapedProfileName} profile avatar" style="display:block;width:72px;height:72px;object-fit:cover;border:2px solid #ed69db;border-radius:50%">`
    : `<div aria-label="${escapedProfileName} avatar" style="width:72px;height:72px;line-height:72px;text-align:center;background:#321850;border:2px solid #ed69db;border-radius:50%;color:#ffffff;font-size:22px;font-weight:700">${escapedAvatarInitials}</div>`;
  const html = `
    <div style="margin:0;padding:28px 14px;background:#08080d;font-family:Arial,Helvetica,sans-serif;color:#f7f3fb">
      <div style="max-width:620px;margin:0 auto;overflow:hidden;background:#111019;border:1px solid #392749;border-radius:22px">
        <div style="height:5px;background:#e649c7"></div>
        <div style="padding:30px 28px 28px">
          <div style="margin:0 0 22px;color:#f1a6e3;font-size:13px;font-weight:800;letter-spacing:2px">YOURWORLD VERIFIED 🏆</div>
          <h1 style="margin:0 0 14px;color:#ffffff;font-size:27px;line-height:1.35">${escapedGreeting}</h1>
          ${htmlTributeParagraphs}
          <div style="padding:22px;background:#1a1424;border:1px solid #53375f;border-radius:18px">
            <div style="margin:0 0 15px;color:#f1a6e3;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase">Profile Identity Card</div>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse">
              <tr>
                <td width="88" valign="middle" style="padding:0 16px 0 0">${avatarContent}</td>
                <td valign="middle" style="padding:0">
                  <div style="color:#ffffff;font-size:20px;font-weight:700;line-height:1.35">${escapedProfileName}</div>
                  <div style="margin-top:8px;color:#d5b2e7;font-size:11px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase">${badgeLabel}</div>
                  <div style="margin-top:4px;color:#ffffff;font-size:16px;font-weight:700;line-height:1.4">${escapedBadgeTitle}</div>
                </td>
              </tr>
            </table>
          </div>
          <div style="margin-top:18px;padding:19px;background:#171323;border:1px solid #69417a;border-radius:18px">
            <div style="color:#f1a6e3;font-size:13px;font-weight:800">Your Monetization Quota Privilege</div>
            <p style="margin:9px 0 0;color:#eee5f2;font-size:14px;line-height:1.7">${escapedQuotaCopy}</p>
          </div>
          <div style="margin:26px 0 18px;text-align:center">
            <a href="${escapedProfileUrl}" style="display:inline-block;padding:15px 25px;background:#d638bb;border:1px solid #ef8ce0;border-radius:12px;color:#ffffff;font-size:13px;font-weight:800;letter-spacing:1px;text-decoration:none">GO TO MY PROFILE</a>
          </div>
          <p style="margin:0;color:#bcb2c5;font-size:13px;line-height:1.6;text-align:center">— Team YourWorld Social</p>
        </div>
      </div>
    </div>`;

  return { profileName, badgeTitle, quotaCopy, text, html, profileUrl };
}

function escapeEmailHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeHttpsUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
