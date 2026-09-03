import { supabase } from "@/integrations/supabase/client";
import type { Hashtag, SuggestedUser } from "@/lib/yw-data";

export type SearchLiveData = {
  users: SuggestedUser[];
  hashtags: Hashtag[];
};

export type PublicSearchProfile = SuggestedUser;

function hueOf(id: string) {
  return id.split("").reduce((h, char) => (h * 31 + char.charCodeAt(0)) % 360, 0);
}

/** Searches profiles on the server so results honour public-profile access rules. */
export async function searchPublicProfiles(
  search: string,
  client: typeof supabase = supabase,
): Promise<PublicSearchProfile[]> {
  const term = search.trim();
  if (!term) return [];
  const { data, error } = await client.rpc("search_profiles", { search: term });
  if (error) throw error;
  return ((data ?? []) as unknown as Array<{
    id: string; username: string | null; display_name: string | null; category: string | null;
  }>).map((profile) => ({
    id: profile.id,
    username: profile.username || "user",
    name: profile.display_name || profile.username || "YourWorld user",
    category: profile.category || undefined,
    hue: hueOf(profile.id),
    followerCount: 0,
  }));
}

/** Loads the current public search data directly from Supabase. */
export async function loadSearchData(
  client: typeof supabase = supabase,
): Promise<SearchLiveData> {
  const [{ data: profiles }, { data: posts }] = await Promise.all([
    client
      .from("profiles")
      .select("id,username,display_name,category")
      .order("updated_at", { ascending: false })
      .limit(100),
    client.from("posts").select("hashtags").limit(500),
  ]);

  const profileRows = profiles ?? [];
  const ids = profileRows.map((profile) => profile.id);
  const { data: counts } = ids.length
    ? await client.rpc("get_follow_counts", { ids })
    : { data: [] };
  const followersById = new Map(
    (counts ?? []).map((row) => [row.user_id as string, Number(row.followers ?? 0)]),
  );

  const users = profileRows.map((profile) => ({
    id: profile.id,
    username: profile.username || "user",
    name: profile.display_name || profile.username || "YourWorld user",
    category: profile.category || undefined,
    hue: hueOf(profile.id),
    followerCount: followersById.get(profile.id) ?? 0,
  }));

  const totals = new Map<string, number>();
  for (const post of posts ?? []) {
    for (const tag of post.hashtags ?? []) {
      const normalized = String(tag).trim().replace(/^#/, "").toLowerCase();
      if (normalized) totals.set(normalized, (totals.get(normalized) ?? 0) + 1);
    }
  }

  const hashtags = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag, postCount], index) => ({ tag, postCount, trending: index < 6 }));

  return { users, hashtags };
}