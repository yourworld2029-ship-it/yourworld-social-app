import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const purgeSocialMediaSchema = z.object({
  messageId: z.string().uuid(),
});

type ChatMediaRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  media_url: string | null;
  voice_note_url: string | null;
  metadata: Record<string, unknown> | null;
  auto_delete_mode: string | null;
  is_viewed: boolean | null;
  expires_at: string | null;
};

type SocialClearRow = Pick<
  ChatMediaRow,
  "id" | "sender_id" | "receiver_id" | "media_url" | "voice_note_url" | "metadata"
>;

type StorageObject = { bucket: string; path: string };

const CHAT_BUCKETS = {
  image: "messages",
  audio: "voice_notes",
} as const;
const CHAT_STORAGE_BUCKETS = new Set([
  "messages",
  "voice_notes",
]);
const MOMENT_STORAGE_BUCKETS = new Set(["moments"]);
const PAGE_SIZE = 500;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function decodePath(path: string) {
  return path.split("/").map((segment) => decodeURIComponent(segment));
}

function isSharedMomentReference(row: Pick<ChatMediaRow, "media_url" | "metadata">) {
  const metadata = row.metadata ?? {};
  const url = row.media_url;
  if (
    metadata.type !== "moment_reply" ||
    metadata.view_once === true ||
    typeof metadata.moment_id !== "string" ||
    !UUID_PATTERN.test(metadata.moment_id) ||
    !url ||
    metadata.moment_media_url !== url
  ) {
    return false;
  }

  const object = objectFromUrl(url, "moments", MOMENT_STORAGE_BUCKETS);
  if (!object) return false;
  const segments = decodePath(object.path);
  if (
    segments.length !== 2 ||
    !UUID_PATTERN.test(segments[0]) ||
    !/^[a-z0-9_-]+-\d+-[a-z0-9]{6}\.[a-z0-9]{1,8}$/i.test(segments[1])
  ) {
    throw new Error("The shared Moment Storage path failed validation.");
  }
  return true;
}

function objectFromUrl(
  value: string,
  expectedBucket?: string,
  allowedBuckets: ReadonlySet<string> = CHAT_STORAGE_BUCKETS,
): StorageObject | null {
  if (value.startsWith("data:") || value.startsWith("blob:")) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const match = url.pathname.match(
    /^\/storage\/v1\/object\/(?:sign|public|authenticated)\/([^/]+)\/(.+)$/,
  );
  if (!match) return null;
  const bucket = decodeURIComponent(match[1]);
  if (!allowedBuckets.has(bucket) || (expectedBucket && bucket !== expectedBucket)) {
    throw new Error("The stored chat media does not use an approved bucket.");
  }
  const path = decodeURIComponent(match[2]);
  return { bucket, path };
}

function getChatStorageObject(row: ChatMediaRow) {
  if (isSharedMomentReference(row)) return null;
  const kind = row.voice_note_url ? "audio" : row.media_url ? "image" : null;
  if (!kind) return null;

  const expectedBucket = CHAT_BUCKETS[kind];
  const metadata = row.metadata ?? {};
  const declaredBucket = metadata.media_bucket;
  const declaredPath = metadata.media_path;
  if (declaredBucket !== undefined && declaredBucket !== expectedBucket) {
    throw new Error("The chat media bucket does not match its media type.");
  }

  const url = kind === "audio" ? row.voice_note_url : row.media_url;
  const urlObject = objectFromUrl(url!, expectedBucket);
  const rawPath =
    typeof declaredPath === "string"
      ? declaredPath
      : urlObject?.path;
  if (!rawPath) return null;
  const segments = decodePath(rawPath);
  const expectedThread = `dm_${[row.sender_id, row.receiver_id].sort().join("_")}`;
  const filePattern =
    kind === "audio"
      ? /^voice-\d+\.webm$/
      : /^image-\d+\.(?:jpg|jpeg|png|webp)$/i;

  if (
    segments.length !== 3 ||
    segments[0] !== row.sender_id ||
    segments[1] !== expectedThread ||
    !filePattern.test(segments[2]) ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error("The stored path is not a valid Social Chat upload.");
  }

  return { bucket: expectedBucket, path: segments.join("/") };
}

async function removeStorageObjects(objects: Array<StorageObject | null>) {
  const byBucket = new Map<string, Set<string>>();
  for (const object of objects) {
    if (!object) continue;
    const paths = byBucket.get(object.bucket) ?? new Set<string>();
    paths.add(object.path);
    byBucket.set(object.bucket, paths);
  }
  if (!byBucket.size) return;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  for (const [bucket, paths] of byBucket) {
    const { error } = await supabaseAdmin.storage.from(bucket).remove([...paths]);
    if (!error) continue;
    const statusCode = Number((error as { statusCode?: string }).statusCode);
    if (statusCode === 404) continue;
    throw new Error(`Could not remove chat media from ${bucket}: ${error.message}`);
  }
}

async function fetchAllPages<T>(
  loadPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>,
) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const result = await loadPage(from, from + PAGE_SIZE - 1);
    if (result.error) throw new Error(result.error.message);
    const page = (result.data ?? []) as T[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

/**
 * Removes an expired Social Chat attachment using the server-only service
 * client. The authenticated recipient can only purge media after viewing it.
 */
export const purgeViewedSocialMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => purgeSocialMediaSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: messageData, error: messageError } = await context.supabase
      .from("messages" as never)
      .select(
        "sender_id,receiver_id,media_url,voice_note_url,metadata,auto_delete_mode,is_viewed,expires_at" as never,
      )
      .eq("id" as never, data.messageId)
      .eq("receiver_id" as never, context.userId)
      .maybeSingle();

    if (messageError) throw new Error(messageError.message);
    const row = messageData as unknown as ChatMediaRow | null;
    if (!row || row.receiver_id !== context.userId) {
      return { removed: false, hadMedia: false };
    }

    const metadata = row.metadata ?? {};
    const isViewOnce = metadata.view_once === true;
    const expired = row.expires_at
      ? Date.parse(row.expires_at) <= Date.now()
      : false;
    if (
      row.auto_delete_mode !== "after_view" ||
      row.is_viewed !== true ||
      (!isViewOnce && !expired)
    ) {
      return { removed: false, hadMedia: false };
    }

    const hadMedia = Boolean(row.media_url || row.voice_note_url);
    if (!hadMedia) return { removed: false, hadMedia: false, deleted: false };

    await removeStorageObjects([getChatStorageObject(row)]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: deletedRows, error: deleteError } = await supabaseAdmin
      .from("messages" as never)
      .delete()
      .eq("id" as never, data.messageId)
      .eq("receiver_id" as never, context.userId)
      .eq("auto_delete_mode" as never, "after_view")
      .eq("is_viewed" as never, true)
      .select("id" as never);
    if (deleteError) throw new Error(`Could not permanently delete viewed chat media: ${deleteError.message}`);

    return {
      removed: true,
      hadMedia: true,
      deleted: Array.isArray(deletedRows) && deletedRows.length > 0,
    };
  });

const clearSocialSchema = z.object({ conversationId: z.string().uuid() });

/** Removes Social Chat files before invoking the participant-checked hard-delete RPC. */
export const clearSocialConversationWithMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => clearSocialSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: conversationData, error: conversationError } = await context.supabase
      .from("conversations" as never)
      .select("participant_one_id,participant_two_id" as never)
      .eq("id" as never, data.conversationId)
      .maybeSingle();
    if (conversationError) throw new Error(conversationError.message);
    const conversation = conversationData as unknown as {
      participant_one_id: string;
      participant_two_id: string;
    } | null;
    if (
      !conversation ||
      ![conversation.participant_one_id, conversation.participant_two_id].includes(context.userId)
    ) {
      throw new Error("Not a participant in this conversation.");
    }

    const selectColumns =
      "id,sender_id,receiver_id,media_url,voice_note_url,metadata";
    const [byConversation, byPair] = await Promise.all([
      fetchAllPages<SocialClearRow>((from, to) =>
        context.supabase
          .from("messages" as never)
          .select(selectColumns as never)
          .eq("conversation_id" as never, data.conversationId)
          .range(from, to) as never,
      ),
      fetchAllPages<SocialClearRow>((from, to) =>
        context.supabase
          .from("messages" as never)
          .select(selectColumns as never)
          .or(
            `and(sender_id.eq.${conversation.participant_one_id},receiver_id.eq.${conversation.participant_two_id}),and(sender_id.eq.${conversation.participant_two_id},receiver_id.eq.${conversation.participant_one_id})`,
          )
          .range(from, to) as never,
      ),
    ]);
    const rows = [...new Map([...byConversation, ...byPair].map((row) => [row.id, row])).values()];
    await removeStorageObjects(rows.map((row) => getChatStorageObject(row as ChatMediaRow)));

    const { error: clearError } = await context.supabase.rpc(
      "clear_social_conversation" as never,
      { _conversation_id: data.conversationId } as never,
    );
    if (clearError) throw new Error(clearError.message);
    return { cleared: true };
  });
