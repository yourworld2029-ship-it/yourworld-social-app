export const MAX_NORMAL_PROFILE_CATEGORIES = 2;
export const NORMAL_PROFILE_CATEGORY_SEPARATOR = " • ";

export const NORMAL_PROFILE_MAIN_CATEGORIES = [
  "Music",
  "News & Media",
  "Education",
  "Sports",
  "Player",
  "Coach",
  "Entertainment",
  "Gaming",
  "Business",
  "Photography & Video",
  "Art & Design",
  "Technology",
  "Food",
  "Fitness & Wellness",
  "Travel",
  "Fashion & Beauty",
  "Writing & Books",
  "Community & Organization",
  "Other",
] as const;

export const NORMAL_PROFILE_CATEGORIES = NORMAL_PROFILE_MAIN_CATEGORIES;

export const NORMAL_PROFILE_SUBCATEGORIES: Record<
  (typeof NORMAL_PROFILE_MAIN_CATEGORIES)[number],
  readonly string[]
> = {
  Music: [
    "Singer",
    "Songwriter",
    "Musician",
    "Composer",
    "Music Producer",
    "DJ",
    "Music Director",
    "Music Teacher",
    "Music Creator",
    "Music Studio",
    "Music Label",
    "Singer / Creator",
    "Producer",
  ],
  "News & Media": [
    "News Channel",
    "Live News",
    "Journalist",
    "Reporter",
    "News Anchor",
    "Editor",
    "Newspaper",
    "News Magazine",
    "Media Creator",
    "Photojournalist",
    "News Creator",
  ],
  Education: [
    "Teacher",
    "School Teacher",
    "English Teacher",
    "Maths Teacher",
    "Science Teacher",
    "Subject Teacher",
    "Principal",
    "Professor",
    "Lecturer",
    "Tutor",
    "PTI",
    "DP / Physical Education",
    "Education Creator",
    "Coaching Institute",
    "Education Institute",
    "Student",
    "Educator",
  ],
  Sports: [],
  Player: [],
  Coach: [],
  Entertainment: [
    "Actor",
    "Director",
    "Producer",
    "Comedian",
    "Dancer",
    "Filmmaker",
    "Performer",
    "Content Creator",
    "Artist",
    "Creator",
  ],
  Gaming: [
    "Gamer",
    "Esports Player",
    "Streamer",
    "Gaming Creator",
    "Gaming Coach",
    "Gaming Team",
    "Gaming Organization",
    "YouTuber / Gamer",
  ],
  Business: [
    "Business Owner",
    "Founder",
    "Entrepreneur",
    "CEO",
    "Freelancer",
    "Consultant",
    "Brand",
    "Company",
    "Shop / Store",
    "Business",
    "Professional",
    "Business / Artist",
  ],
  "Photography & Video": [
    "Photographer",
    "Videographer",
    "Cinematographer",
    "Video Creator",
    "Photo Studio",
    "Video Studio",
  ],
  "Art & Design": [
    "Artist",
    "Painter",
    "Illustrator",
    "Graphic Designer",
    "UI/UX Designer",
    "Animator",
    "Designer",
    "Art Studio",
  ],
  Technology: [
    "Developer",
    "Software Engineer",
    "App Developer",
    "Web Developer",
    "AI Creator",
    "Tech Creator",
    "IT Professional",
    "Tech Company",
    "Tech",
  ],
  Food: [
    "Chef",
    "Cook",
    "Baker",
    "Restaurant",
    "Café",
    "Food Creator",
    "Food Blogger",
    "Caterer",
    "Food",
  ],
  "Fitness & Wellness": [
    "Fitness Trainer",
    "Gym",
    "Yoga Trainer",
    "Personal Trainer",
    "Fitness Creator",
    "Fitness",
  ],
  Travel: [
    "Travel Creator",
    "Travel Blogger",
    "Tour Guide",
    "Travel Agency",
    "Photographer",
    "Travel",
  ],
  "Fashion & Beauty": [
    "Fashion Creator",
    "Fashion Designer",
    "Model",
    "Makeup Artist",
    "Hairstylist",
    "Beauty Creator",
    "Fashion Store",
    "Fashion",
    "Beauty",
  ],
  "Writing & Books": [
    "Writer",
    "Author",
    "Poet",
    "Blogger",
    "Publisher",
    "Book Creator",
  ],
  "Community & Organization": [
    "Organization",
    "Community",
    "Club",
    "Team",
    "NGO",
    "Social Group",
    "Nonprofit",
  ],
  Other: ["Lifestyle", "Podcaster", "Other"],
};

export const SPORTS_CATALOGUE = [
  "Handball",
  "Football",
  "Cricket",
  "Hockey",
  "Basketball",
  "Volleyball",
  "Kabaddi",
  "Athletics",
  "Wrestling",
  "Boxing",
  "Badminton",
  "Tennis",
  "Table Tennis",
  "Swimming",
  "Archery",
  "Shooting",
  "Gymnastics",
  "Judo",
  "Kho-Kho",
  "Weightlifting",
  "Cycling",
  "Other recognized sport",
] as const;

export const SPORTS_PROFILE_ROLES = [
  "Player",
  "Coach",
  "Physical Trainer",
  "Referee",
  "Official",
  "Sports Trainer",
  "Sports Instructor",
  "Sports Creator",
] as const;

export function isSportsIdentityCategory(value: string) {
  return /^(athlete|player|coach)(?:\s*[-·•|:]|$)/i.test(value.trim());
}

export function getNormalProfileCategoryMain(value: string) {
  return value.trim().split(/\s+[•·]\s+/)[0]?.trim() ?? "";
}

function categoryKey(value: string) {
  return getNormalProfileCategoryMain(value).toLocaleLowerCase();
}

export function parseNormalProfileCategories(value: string) {
  if (!value.trim() || isSportsIdentityCategory(value)) return [];
  return Array.from(
    new Set(
      value
        .split(/\s+[•·]\s+/)
        .map((category) => category.trim())
        .filter(Boolean),
    ),
  ).slice(0, MAX_NORMAL_PROFILE_CATEGORIES);
}

export function normalizeNormalProfileCategories(value: unknown) {
  if (!Array.isArray(value)) return [];
  const seenMains = new Set<string>();
  const normalized: string[] = [];
  for (const category of value) {
    if (typeof category !== "string") continue;
    const trimmed = category.trim();
    const key = categoryKey(trimmed);
    if (!trimmed || !key || seenMains.has(key)) continue;
    seenMains.add(key);
    normalized.push(trimmed);
    if (normalized.length >= MAX_NORMAL_PROFILE_CATEGORIES) break;
  }
  return normalized;
}

export function resolveNormalProfileCategories(stored: unknown, legacyCategory: string) {
  const storedCategories = normalizeNormalProfileCategories(stored);
  return storedCategories.length ? storedCategories : parseNormalProfileCategories(legacyCategory);
}

export function serializeNormalProfileCategories(categories: string[]) {
  return normalizeNormalProfileCategories(categories)
    .join(NORMAL_PROFILE_CATEGORY_SEPARATOR);
}

export function normalizeProfileCategoryValue(value: string) {
  if (isSportsIdentityCategory(value)) return value.trim();
  return serializeNormalProfileCategories(parseNormalProfileCategories(value));
}