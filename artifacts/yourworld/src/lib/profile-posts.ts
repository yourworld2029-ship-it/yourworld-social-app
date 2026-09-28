import { supabase } from "@/integrations/supabase/client";
import { missingColumn, normalizePostRow } from "@/lib/supabase-compat";
import type { DbPost } from "@/lib/social-data";

type PostsResult = {
  data: unknown[] | null;
  error: unknown | null;
};

type PostsQuery = {
  eq: (column: string, value: unknown) => PostsQuery;
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

  const runQuery = () => {
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
      .range(safeOffset, safeOffset + safePageSize - 1);
  };

  let result = await runQuery();
  for (let retry = 0; result.error && retry < 2; retry += 1) {
    const absentColumn = missingColumn(result.error);
    if (absentColumn === "archived" && filterArchived) {
      filterArchived = false;
    } else if (absentColumn === "pinned" && orderPinned) {
      orderPinned = false;
    } else {
      break;
    }
    result = await runQuery();
  }

  if (result.error) throw result.error;

  return (result.data ?? [])
    .filter(
      (row): row is Record<string, unknown> =>
        row !== null && typeof row === "object" && !Array.isArray(row),
    )
    .map(normalizePostRow)
    .filter((post) => options.includeArchived === true || post.archived !== true) as DbPost[];
}