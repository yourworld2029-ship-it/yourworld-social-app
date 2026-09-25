import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const purgeSocialMediaSchema = z.object({
  messageId: z.string().uuid(),
});

type ChatMediaRow = {
  sender_id: string;
  receiver_id: string;
  media_url: string | null;
  voice_note_url: string | null;
  metadata: Record<string, unknown> | null;
  auto_delete_mode: string | null;
  is_viewed: boolean | null;
  expires_at: string | null;
};

const CHAT_BUCKETS = {
  image: "messages",
  audio: "voice_notes",
} as const;

function decodePath(path: string) {
  return path.split("/").map((segment) => decodeURIComponent(segment));
}

function objectPathFromUrl(value: string, expectedBucket: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("The stored chat media URL is invalid.");
  }
  const match = url.pathname.match(
    /^\/storage\/v1\/object\/(?:sign|public|authenticated)\/([^/]+)\/(.+)$/,
  );
  if (!match || decodeURIComponent(match[1]) !== expectedBucket) {
    throw new Error("The stored chat media does not use an approved bucket.");
  }
  return decodeURIComponent(match[2]);
}

function getChatStorageObject(row: ChatMediaRow) {
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
  const rawPath =
    typeof declaredPath === "string"
      ? declaredPath
      : objectPathFromUrl(url!, expectedBucket);
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

    const object = getChatStorageObject(row);
    if (!object) return { removed: false, hadMedia: false };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: removeError } = await supabaseAdmin.storage
      .from(object.bucket)
      .remove([object.path]);
    if (removeError) throw new Error(`Could not remove viewed chat media: ${removeError.message}`);

    return { removed: true, hadMedia: true };
  });