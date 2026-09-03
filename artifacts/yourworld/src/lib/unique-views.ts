import { supabase } from "@/integrations/supabase/client";
import { missingTable } from "@/lib/supabase-compat";

export type ViewContentType = "post" | "reel" | "video" | "moment";

type DbError = {
  code?: string;
  message?: string;
  details?: string | null;
};

type RpcClient = {
  rpc: (
    name: string,
    args: { _content_id: string; _content_type: ViewContentType },
  ) => PromiseLike<{ data: boolean | null; error: DbError | null }>;
};

const isMissingUniqueViewRpc = (error: DbError | null) =>
  error?.code === "PGRST202" ||
  /register_unique_view|unique_views/i.test(
    [error?.message, error?.details].filter(Boolean).join(" "),
  );

const isDuplicate = (error: DbError | null) =>
  error?.code === "23505" || /duplicate key|already exists/i.test(error?.message ?? "");

/**
 * Atomically records one view for one authenticated user and content type.
 * The RPC returns true only when it inserted a new unique key and incremented
 * the content counter. Replays and cross-tab races return false.
 */
export async function registerUniqueView(
  contentId: string,
  contentType: ViewContentType,
  client: typeof supabase = supabase,
): Promise<boolean> {
  if (!contentId) return false;

  const { data, error } = await (client as unknown as RpcClient).rpc(
    "register_unique_view",
    { _content_id: contentId, _content_type: contentType },
  );
  if (!error) return data === true;
  if (!isMissingUniqueViewRpc(error)) {
    console.error("Unable to register unique view", error);
    throw error;
  }

  // Compatibility for a live project before migration 0018 is applied.
  const { data: session } = await client.auth.getSession();
  const uid = session.session?.user.id;
  if (!uid) return false;

  if (contentType === "moment") {
    const momentResult = await (client as unknown as {
      from: (table: string) => {
        insert: (values: Record<string, string>) => PromiseLike<{ error: DbError | null }>;
      };
    }).from("moment_views").insert({ moment_id: contentId, viewer_id: uid });
    if (!momentResult.error) return true;
    if (isDuplicate(momentResult.error)) return false;
    if (!missingTable(momentResult.error, "moment_views")) {
      console.error("Unable to register legacy moment view", momentResult.error);
      throw momentResult.error;
    }
  }

  const postResult = await (client as unknown as {
    from: (table: string) => {
      insert: (values: Record<string, string>) => PromiseLike<{ error: DbError | null }>;
    };
  }).from("post_views").insert({ post_id: contentId, viewer_id: uid });
  if (!postResult.error) return true;
  if (isDuplicate(postResult.error)) return false;
  console.error("Unable to register legacy post view", postResult.error);
  throw postResult.error;
}