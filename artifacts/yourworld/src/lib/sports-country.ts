const ISO_COUNTRY_CODES = `
AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ
BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ
CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ
DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY
HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ
LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ
NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW
SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ
UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW
`
  .trim()
  .split(/\s+/);

const countryDisplayNames =
  typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

function normalizeCountryName(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function flagFromCode(code: string) {
  return [...code]
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join("");
}

const countryNameToCode = new Map<string, string>();
const countryCodeToName = new Map<string, string>();

for (const code of ISO_COUNTRY_CODES) {
  const name = countryDisplayNames?.of(code) || code;
  countryNameToCode.set(normalizeCountryName(name), code);
  countryCodeToName.set(code, name);
}

countryCodeToName.set("XK", countryDisplayNames?.of("XK") || "Kosovo");

const countryAliases: Record<string, string> = {
  "brunei darussalam": "BN",
  "czech republic": "CZ",
  "ivory coast": "CI",
  "north korea": "KP",
  "republic of korea": "KR",
  russia: "RU",
  swaziland: "SZ",
  "south korea": "KR",
  syria: "SY",
  taiwan: "TW",
  tanzania: "TZ",
  turkey: "TR",
  uae: "AE",
  uk: "GB",
  usa: "US",
  "united states of america": "US",
  venezuela: "VE",
  vietnam: "VN",
};

for (const [alias, code] of Object.entries(countryAliases)) {
  countryNameToCode.set(normalizeCountryName(alias), code);
}

export function countryCodeForSportsCountry(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  if (!normalized) return null;

  const code = normalized.toUpperCase();
  if (countryCodeToName.has(code)) return code;
  return countryNameToCode.get(normalizeCountryName(normalized)) ?? null;
}

export function countryNameForSportsCountry(value: string | null | undefined) {
  const code = countryCodeForSportsCountry(value);
  return code ? countryCodeToName.get(code) ?? null : null;
}

export function countryFlagForSportsCountry(value: string | null | undefined) {
  const code = countryCodeForSportsCountry(value);
  return code ? flagFromCode(code) : null;
}

export function isIndiaSportsCountry(value: string | null | undefined) {
  return countryCodeForSportsCountry(value) === "IN";
}

export const SPORTS_COUNTRY_OPTIONS = ISO_COUNTRY_CODES.map((code) => ({
  code,
  name: countryCodeToName.get(code) ?? code,
  flag: flagFromCode(code),
})).sort((a, b) => a.name.localeCompare(b.name, "en"));

export const NON_INDIA_INTERNATIONAL_COMPETITIONS = [
  { value: "Olympic Games", label: "🏅 Olympic Games" },
  { value: "Paralympic Games", label: "♿ Paralympic Games" },
  {
    value: "Official World Championship / World Cup",
    label: "🏆 Official World Championship / World Cup",
  },
  { value: "Asian Games", label: "🥇 Asian Games" },
  { value: "Asian Championship", label: "🏆 Asian Championship" },
  { value: "Commonwealth Games (CWG)", label: "🌍 Commonwealth Games (CWG)" },
] as const;