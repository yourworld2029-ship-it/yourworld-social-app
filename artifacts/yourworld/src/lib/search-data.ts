import { supabase } from "@/integrations/supabase/client";
import type { Hashtag, SuggestedUser } from "@/lib/yw-data";

export type SearchUser = Omit<SuggestedUser, "followerCount"> & {
  /** Omitted when the live follower-count source is unavailable. */
  followerCount?: number;
};

export type SearchLiveData = {
  users: SearchUser[];
  hashtags: Hashtag[];
};

export type PublicSearchProfile = SearchUser;

type ProfileRow = {
  id: string;
  username: string | null;
  full_name?: string | null;
  display_name: string | null;
  category: string | null;
};

type SearchPostRow = {
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
      category: profile.category || undefined,
      hue: hueOf(profile.id),
      ...(followerCount === undefined ? {} : { followerCount }),
    };
  });
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
    (data ?? []).map((row) => [row.user_id, Number(row.followers)]),
  );
}

/** Searches public profiles directly, using the same RLS rules as the profile table. */
export async function searchPublicProfiles(
  search: string,
  client: typeof supabase = supabase,
): Promise<PublicSearchProfile[]> {
  const term = search.trim().replace(/^[@#]+/, "");
  if (!term) return [];

  const pattern = escapeILikePattern(term);
  const { data, error } = await client
    .from("profiles")
    // full_name is maintained for public profile search; display_name supports
    // older profiles whose public name predates that field.
    .select("id,username,full_name,display_name,category")
    .or(`username.ilike.%${pattern}%,full_name.ilike.%${pattern}%`)
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) throw error;

  const profiles = (data ?? []) as unknown as ProfileRow[];
  const followersById = await loadFollowerCounts(
    profiles.map((profile) => profile.id),
    client,
  );
  return toSearchUsers(profiles, followersById);
}

/** Loads the current public search data directly from Supabase. */
export async function loadSearchData(
  client: typeof supabase = supabase,
): Promise<SearchLiveData> {
  const [{ data: profiles, error: profilesError }, { data: posts, error: postsError }] = await Promise.all([
    client
      .from("profiles")
      .select("id,username,full_name,display_name,category")
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

  const users = toSearchUsers(profileRows, followersById);

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

  return { users, hashtags };
}