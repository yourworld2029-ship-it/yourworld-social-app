import { supabase } from "@/integrations/supabase/client";
import { missingColumn, normalizePostRow } from "@/lib/supabase-compat";
import type { DbPost } from "@/lib/social-data";
import { excludeLiveReplayPosts } from "@/lib/live-replay-visibility";

type PostsResult = {
  data: unknown[] | null;
  error: unknown | null;
};

type PostsQuery = {
  eq: (column: string, value: unknown) => PostsQuery;
  in: (column: string, values: string[]) => PostsQuery;
  order: (
    column: string,
    options: { ascending: boolean; nullsFirst?: boolean },
  ) => PostsQuery;
  range: (from: number, to: number) => PromiseLike<PostsResult>;
};

type ProfilePostsClient = {
  from: (table: "posts") => {
    select: (columns: "*") => PostsQuery;
  };
};

const defaultClient = supabase as unknown as ProfilePostsClient;

/**
 * Load profile media without joins so the posts RLS policy remains authoritative.
 * Some deployed schemas do not have the optional archived/pinned columns.
 */
export async function fetchProfilePostsPage(
  userId: string,
  offset: number,
  pageSize: number,
  options: { includeArchived?: boolean } = {},
): Promise<DbPost[]> {
  const cleanUserId = userId.trim();
  if (!cleanUserId) return [];

  const safeOffset = Math.max(0, Math.floor(offset));
  const safePageSize = Math.max(1, Math.floor(pageSize));
  let filterArchived = options.includeArchived !== true;
  let orderPinned = true;

  const runQuery = (to: number) => {
    let query = defaultClient
      .from("posts")
      .select("*")
      .eq("user_id", cleanUserId);
    if (filterArchived) query = query.eq("archived", false);
    if (orderPinned) {
      query = query.order("pinned", {
        ascending: false,
        nullsFirst: false,
      });
    }
    return query
      .order("created_at", { ascending: false })
      .range(0, to);
  };

  let result = await runQuery(safeOffset + safePageSize - 1);
  for (let retry = 0; result.error && retry < 2; retry += 1) {
    const absentColumn = missingColumn(result.error);
    if (absentColumn === "archived" && filterArchived) {
      filterArchived = false;
    } else if (absentColumn === "pinned" && orderPinned) {
      orderPinned = false;
    } else {
      break;
    }
    result = await runQuery(safeOffset + safePageSize - 1);
  }

  if (result.error) throw result.error;

  const authoredPosts = (result.data ?? [])
    .filter(
      (row): row is Record<string, unknown> =>
        row !== null && typeof row === "object" && !Array.isArray(row),
    )
    .map(normalizePostRow)
    .filter((post) => options.includeArchived === true || post.archived !== true) as DbPost[];

  const { data: collaborationRows, error: collaborationError } = await supabase
    .from("reel_collaboration_invites" as never)
    .select("post_id" as never)
    .eq("collaborator_id" as never, cleanUserId as never)
    .eq("status" as never, "accepted" as never);
  if (collaborationError) throw collaborationError;

  const collaboratorPostIds = [
    ...new Set(
      ((collaborationRows ?? []) as Array<{ post_id?: unknown }>)
        .map((row) => row.post_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
  let collaboratorPosts: DbPost[] = [];
  if (collaboratorPostIds.length > 0) {
    const { data, error } = await defaultClient
      .from("posts")
      .select("*")
      .in("id", collaboratorPostIds)
      .eq("kind", "reel")
      .order("created_at", { ascending: false })
      .range(0, safeOffset + safePageSize - 1);
    if (error) throw error;
    collaboratorPosts = ((data ?? []) as Array<Record<string, unknown>>)
      .map(normalizePostRow)
      .filter((post) => post.archived !== true) as DbPost[];
  }

  const uniquePosts = new Map<string, DbPost>();
  for (const post of [...authoredPosts, ...collaboratorPosts]) {
    if (post.kind === "reel" || post.user_id === cleanUserId) {
      uniquePosts.set(post.id, post);
    }
  }
  const combinedPosts = [...uniquePosts.values()].sort((left, right) => {
    const leftPinned = left.pinned === true ? 1 : 0;
    const rightPinned = right.pinned === true ? 1 : 0;
    return rightPinned - leftPinned ||
      Date.parse(right.created_at) - Date.parse(left.created_at);
  });
  return excludeLiveReplayPosts(
    combinedPosts.slice(safeOffset, safeOffset + safePageSize),
  );
}