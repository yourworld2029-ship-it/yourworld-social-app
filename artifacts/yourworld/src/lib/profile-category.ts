export const MAX_NORMAL_PROFILE_CATEGORIES = 2;
export const NORMAL_PROFILE_CATEGORY_SEPARATOR = " • ";

export const NORMAL_PROFILE_CATEGORIES = [
  "Music",
  "Singer / Creator",
  "YouTuber / Gamer",
  "Business / Artist",
  "Creator",
  "Artist",
  "Musician",
  "Singer",
  "Dancer",
  "Actor",
  "Filmmaker",
  "Photographer",
  "Designer",
  "Writer",
  "Podcaster",
  "Streamer",
  "Gamer",
  "Entrepreneur",
  "Business",
  "Educator",
  "Developer",
  "Tech",
  "Fashion",
  "Beauty",
  "Fitness",
  "Food",
  "Travel",
  "Lifestyle",
  "Model",
  "Comedian",
  "DJ",
  "Producer",
  "Community",
  "Nonprofit",
  "Student",
  "Professional",
  "Other",
] as const;

export function isSportsIdentityCategory(value: string) {
  return /^(athlete|player|coach)(?:\s*[-·•|:]|$)/i.test(value.trim());
}

export function parseNormalProfileCategories(value: string) {
  if (!value.trim() || isSportsIdentityCategory(value)) return [];
  return Array.from(
    new Set(
      value
        .split(NORMAL_PROFILE_CATEGORY_SEPARATOR)
        .map((category) => category.trim())
        .filter(Boolean),
    ),
  ).slice(0, MAX_NORMAL_PROFILE_CATEGORIES);
}

export function serializeNormalProfileCategories(categories: string[]) {
  return Array.from(
    new Set(categories.map((category) => category.trim()).filter(Boolean)),
  )
    .slice(0, MAX_NORMAL_PROFILE_CATEGORIES)
    .join(NORMAL_PROFILE_CATEGORY_SEPARATOR);
}

export function normalizeProfileCategoryValue(value: string) {
  if (isSportsIdentityCategory(value)) return value.trim();
  return serializeNormalProfileCategories(parseNormalProfileCategories(value));
}