import { supabase } from "@/integrations/supabase/client";
import { resolveMediaUrl } from "@/lib/social-data";
import { resolveNormalProfileCategories } from "@/lib/profile-category";
import type { Hashtag, SuggestedUser } from "@/lib/yw-data";

export type SearchUser = Omit<SuggestedUser, "followerCount"> & {
  /** Omitted when the live follower-count source is unavailable. */
  followerCount?: number;
  avatar_url?: string | null;
};

export type SearchVideo = {
  id: string;
  userId: string;
  kind: "reel" | "video";
  title: string;
  description: string;
  caption: string;
  mediaUrl: string;
  thumbnailUrl: string | null;
  views: number;
  durationSeconds: number | null;
  hashtags: string[];
  createdAt: string;
  author: {
    name: string;
    username: string;
  };
};

export type SearchLiveData = {
  users: SearchUser[];
  reels: SearchVideo[];
  videos: SearchVideo[];
  hashtags: Hashtag[];
};

export type PublicSearchProfile = SearchUser;

type ProfileRow = {
  id: string;
  username: string | null;
  full_name?: string | null;
  display_name: string | null;
  avatar_url?: string | null;
  is_verified?: boolean | null;
  category: string | null;
  normal_categories?: unknown;
};

type OrbitSearchRow = {
  user_id: string;
  name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  about: string | null;
  hobbies: string[] | null;
  looking_for: string | null;
  gender: string | null;
  photos: unknown;
};

type SearchPostRow = {
  id?: unknown;
  user_id?: unknown;
  kind?: unknown;
  type?: unknown;
  is_reel?: unknown;
  media_url?: unknown;
  thumbnail_url?: unknown;
  duration_seconds?: unknown;
  views?: unknown;
  views_count?: unknown;
  created_at?: unknown;
  hashtags?: unknown;
  caption?: unknown;
  content?: unknown;
  title?: unknown;
  description?: unknown;
};

function hueOf(id: string) {
  return id.split("").reduce((h, char) => (h * 31 + char.charCodeAt(0)) % 360, 0);
}

/**
 * Escapes a value embedded in PostgREST's `or` filter grammar while retaining
 * the outer `%` wildcards used for the ILIKE match.
 */
function escapeILikePattern(value: string) {
  return value.replace(/[\\%_.,():"']/g, "\\$&");
}

export function normalizeProfileSearchTerm(search: string) {
  return search.trim().replace(/^[@#]+/, "").trim();
}

function toSearchUsers(
  profiles: ProfileRow[],
  followersById = new Map<string, number>(),
): SearchUser[] {
  return profiles.map((profile) => {
    const followerCount = followersById.get(profile.id);
    return {
      id: profile.id,
      username: profile.username?.trim() ?? "",
      name:
        profile.full_name?.trim() ||
        profile.display_name?.trim() ||
        profile.username?.trim() ||
        "",
      category:
        resolveNormalProfileCategories(profile.normal_categories, profile.category ?? "").join(" • ") ||
        undefined,
      verified: Boolean(profile.is_verified),
      hue: hueOf(profile.id),
      avatar_url: profile.avatar_url ?? null,
      ...(followerCount === undefined ? {} : { followerCount }),
    };
  });
}

async function resolveSearchAvatars(users: SearchUser[]) {
  return Promise.all(
    users.map(async (user) => {
      if (!user.avatar_url) return user;
      return {
        ...user,
        avatar_url: await resolveMediaUrl(user.avatar_url, "avatars"),
      };
    }),
  );
}

function orbitPhotoUrl(photos: unknown) {
  if (!Array.isArray(photos)) return "";
  const photo = photos.find(
    (item): item is { url?: unknown } =>
      typeof item === "object" && item !== null && "url" in item,
  );
  return typeof photo?.url === "string" && !/^(blob|data):/.test(photo.url)
    ? photo.url
    : "";
}

function toOrbitSearchUsers(rows: OrbitSearchRow[]): SearchUser[] {
  return rows.map((row) => {
    const name = row.name?.trim() || "Orbit user";
    return {
      id: row.user_id,
      username: name.toLowerCase().replace(/\s+/g, "."),
      name,
      category: "Orbit",
      hue: hueOf(row.user_id),
      bio: row.about?.trim() || undefined,
      location: [row.city, row.state, row.country].filter(Boolean).join(", "),
      avatar_url: orbitPhotoUrl(row.photos),
    } as SearchUser;
  });
}

async function searchOrbitProfiles(
  term: string,
  client: typeof supabase,
): Promise<SearchUser[]> {
  const pattern = escapeILikePattern(term);
  const { data, error } = await client
    .from("orbit_profiles")
    .select("user_id,name,city,state,country,about,hobbies,looking_for,gender,photos")
    .or(
      [
        `name.ilike.%${pattern}%`,
        `city.ilike.%${pattern}%`,
        `state.ilike.%${pattern}%`,
        `country.ilike.%${pattern}%`,
        `about.ilike.%${pattern}%`,
        `looking_for.ilike.%${pattern}%`,
        `gender.ilike.%${pattern}%`,
        `mood.ilike.%${pattern}%`,
      ].join(","),
    )
    .eq("orbit_enabled", true)
    .eq("visible", true)
    .limit(50);
  if (error) {
    console.warn("[search] Orbit profile search unavailable", error.message);
    return [];
  }
  return toOrbitSearchUsers((data ?? []) as unknown as OrbitSearchRow[]);
}

async function loadFollowerCounts(
  ids: string[],
  client: typeof supabase,
): Promise<Map<string, number>> {
  if (!ids.length) return new Map();

  const { data, error } = await client.rpc("get_follow_counts", { ids });
  // Profiles remain usable if this optional live aggregate is unavailable.
  if (error) return new Map();

  return new Map(
    (data ?? []).map((row: { user_id: string; followers?: number | null }) => [
      row.user_id,
      Number(row.followers),
    ]),
  );
}

/** Searches public profiles directly, using the same RLS rules as the profile table. */
export async function searchPublicProfiles(
  search: string,
  client: typeof supabase = supabase,
): Promise<PublicSearchProfile[]> {
  const searchTerm = normalizeProfileSearchTerm(search);
  if (!searchTerm) return [];

  const [{ data, error }, orbitUsers] = await Promise.all([
    client.rpc("search_profiles", { search: searchTerm }),
    searchOrbitProfiles(searchTerm, client),
  ]);
  if (error) throw error;

  const profiles = (data ?? []) as unknown as ProfileRow[];
  const followersById = await loadFollowerCounts(
    profiles.map((profile) => profile.id),
    client,
  );
  const standardUsers = await resolveSearchAvatars(
    toSearchUsers(profiles, followersById),
  );
  const merged = new Map(standardUsers.map((user) => [user.id, user]));
  for (const orbitUser of orbitUsers) {
    const existing = merged.get(orbitUser.id);
    merged.set(orbitUser.id, existing ? { ...orbitUser, ...existing } : orbitUser);
  }
  return resolveSearchAvatars([...merged.values()].slice(0, 50));
}

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function tagsValue(value: unknown) {
  return Array.isArray(value)
    ? value.map((tag) => String(tag).trim().replace(/^#/, "").toLowerCase()).filter(Boolean)
    : [];
}

function toSearchVideos(rows: SearchPostRow[], profiles: ProfileRow[]) {
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  return rows.flatMap((row): SearchVideo[] => {
    const id = textValue(row.id);
    const userId = textValue(row.user_id);
    const mediaUrl = textValue(row.media_url);
    if (!id || !userId || !mediaUrl) return [];

    const kind = textValue(row.kind || row.type).toLowerCase();
    const isReel = kind === "reel" || row.is_reel === true;
    const isVideo = isReel || kind === "video" || kind === "long_video";
    if (!isVideo) return [];

    const profile = profileById.get(userId);
    const username = profile?.username?.trim() || `user${userId.slice(0, 4)}`;
    const name =
      profile?.display_name?.trim() ||
      profile?.full_name?.trim() ||
      username;
    const caption = textValue(row.caption);

    return [{
      id,
      userId,
      kind: isReel ? "reel" : "video",
      title: textValue(row.title) || caption || "Untitled video",
      description:
        textValue(row.description) ||
        textValue(row.content) ||
        caption,
      caption,
      mediaUrl,
      thumbnailUrl: textValue(row.thumbnail_url) || null,
      views: Number(row.views ?? row.views_count ?? 0) || 0,
      durationSeconds:
        typeof row.duration_seconds === "number"
          ? row.duration_seconds
          : Number.isFinite(Number(row.duration_seconds))
            ? Number(row.duration_seconds)
            : null,
      hashtags: tagsValue(row.hashtags),
      createdAt: textValue(row.created_at),
      author: { name, username },
    }];
  });
}

/** Loads the current public search data directly from Supabase. */
export async function loadSearchData(
  client: typeof supabase = supabase,
): Promise<SearchLiveData> {
  const [{ data: profiles, error: profilesError }, { data: posts, error: postsError }] = await Promise.all([
    client
      .from("profiles")
      .select("id,username,full_name,display_name,avatar_url,is_verified,category,normal_categories")
      .order("updated_at", { ascending: false })
      .limit(100),
    // The live project has both legacy and current post shapes. Selecting the
    // row avoids requesting an optional `hashtags` column that legacy tables
    // do not expose.
    client.from("posts").select("*").limit(500),
  ]);
  if (profilesError) throw profilesError;
  if (postsError) throw postsError;

  const profileRows = (profiles ?? []) as unknown as ProfileRow[];
  const followersById = await loadFollowerCounts(
    profileRows.map((profile) => profile.id),
    client,
  );

  const users = await resolveSearchAvatars(toSearchUsers(profileRows, followersById));

  const totals = new Map<string, number>();
  for (const post of (posts ?? []) as unknown as SearchPostRow[]) {
    const storedTags = Array.isArray(post.hashtags) ? post.hashtags : [];
    const searchableText = [post.caption, post.content, post.title, post.description]
      .filter((value): value is string => typeof value === "string")
      .join(" ");
    const inlineTags = [...searchableText.matchAll(/#([\p{L}\p{N}_-]+)/gu)].map((match) => match[1]);
    for (const tag of [...storedTags, ...inlineTags]) {
      const normalized = String(tag).trim().replace(/^#/, "").toLowerCase();
      if (normalized) totals.set(normalized, (totals.get(normalized) ?? 0) + 1);
    }
  }

  const hashtags = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag, postCount], index) => ({ tag, postCount, trending: index < 6 }));

  const allVideos = toSearchVideos(
    (posts ?? []) as unknown as SearchPostRow[],
    profileRows,
  );

  return {
    users,
    reels: allVideos.filter((video) => video.kind === "reel"),
    videos: allVideos.filter((video) => video.kind === "video"),
    hashtags,
  };
}