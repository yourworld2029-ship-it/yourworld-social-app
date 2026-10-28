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

type PostCountResult = {
  count: number | null;
  data: unknown[] | null;
  error: unknown | null;
};

type PostCountQuery = PromiseLike<PostCountResult> & {
  eq: (column: string, value: unknown) => PostCountQuery;
  in: (column: string, values: string[]) => PostCountQuery;
  not: (column: string, operator: "in", value: string) => PostCountQuery;
};

type ProfilePostCountClient = {
  from: (
    table: "posts" | "live_replays" | "reel_collaboration_invites",
  ) => {
    select: (
      columns: string,
      options?: { count?: "exact"; head?: boolean },
    ) => PostCountQuery;
  };
};

const defaultClient = supabase as unknown as ProfilePostsClient;
const countClient = supabase as unknown as ProfilePostCountClient;

/**
 * Count all media rows represented in a profile grid, independent of the
 * currently loaded page. Live replay backing posts are shown in the Live tab,
 * while accepted Reel collaborations are also shown in the collaborator's
 * profile.
 */
export async function fetchProfilePostCount(userId: string): Promise<number> {
  const cleanUserId = userId.trim();
  if (!cleanUserId) return 0;

  const [replayResult, collaborationResult] = await Promise.all([
    countClient
      .from("live_replays")
      .select("post_id")
      .eq("broadcaster_id", cleanUserId),
    countClient
      .from("reel_collaboration_invites")
      .select("post_id")
      .eq("collaborator_id", cleanUserId)
      .eq("status", "accepted"),
  ]);
  if (replayResult.error) throw replayResult.error;
  if (collaborationResult.error) throw collaborationResult.error;

  const liveReplayIds = [
    ...new Set(
      (replayResult.data ?? [])
        .map((row) =>
          row && typeof row === "object"
            ? (row as { post_id?: unknown }).post_id
            : null,
        )
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
  const collaboratorPostIds = [
    ...new Set(
      (collaborationResult.data ?? [])
        .map((row) =>
          row && typeof row === "object"
            ? (row as { post_id?: unknown }).post_id
            : null,
        )
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];

  const runAuthoredCount = (filterArchived: boolean) => {
    let query = countClient
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", cleanUserId);
    if (filterArchived) query = query.eq("archived", false);
    if (liveReplayIds.length > 0) {
      query = query.not("id", "in", `(${liveReplayIds.join(",")})`);
    }
    return query;
  };
  let authoredResult = await runAuthoredCount(true);
  if (authoredResult.error && missingColumn(authoredResult.error) === "archived") {
    authoredResult = await runAuthoredCount(false);
  }
  if (authoredResult.error) throw authoredResult.error;

  let collaboratorCount = 0;
  if (collaboratorPostIds.length > 0) {
    const runCollaboratorCount = (filterArchived: boolean) => {
      let query = countClient
        .from("posts")
        .select("id", { count: "exact", head: true })
        .in("id", collaboratorPostIds)
        .eq("kind", "reel");
      if (filterArchived) query = query.eq("archived", false);
      return query;
    };
    let collaboratorCountResult = await runCollaboratorCount(true);
    if (
      collaboratorCountResult.error &&
      missingColumn(collaboratorCountResult.error) === "archived"
    ) {
      collaboratorCountResult = await runCollaboratorCount(false);
    }
    if (collaboratorCountResult.error) throw collaboratorCountResult.error;
    collaboratorCount = collaboratorCountResult.count ?? 0;
  }

  return Math.max(0, (authoredResult.count ?? 0) + collaboratorCount);
}

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