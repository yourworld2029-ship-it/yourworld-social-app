import { supabase } from "@/integrations/supabase/client";

/**
 * Deleting a conversation is always "delete for me":
 * my own messages are removed everywhere, and the rest of the thread is
 * hidden from my side only. The other person keeps their copy.
 */

const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const dmPair = (id: string): [string, string] | null => {
  const match = /^dm_([0-9a-f-]{36})_([0-9a-f-]{36})$/i.exec(id);
  return match ? [match[1]!, match[2]!] : null;
};

const HIDDEN_DM_KEY = "yw-hidden-threads";
const HIDDEN_ORBIT_KEY = "yw-hidden-orbit-chats";

function readHidden(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeHidden(key: string, ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify([...new Set(ids)].slice(-500)));
  } catch {
    /* storage full or blocked — hiding is best effort */
  }
}

export const hiddenThreadIds = () => readHidden(HIDDEN_DM_KEY);
export const hiddenOrbitPeerIds = () => readHidden(HIDDEN_ORBIT_KEY);

/** Merge durable per-user hides with the device cache for the signed-in user. */
export async function loadHiddenDirectThreads(userId: string): Promise<string[]> {
  const { data: preferences, error: preferenceError } = await supabase
    .from("conversation_preferences" as never)
    .select("conversation_id" as never)
    .eq("user_id" as never, userId)
    .not("hidden_at" as never, "is", null);
  if (preferenceError) {
    throw new Error(`Could not sync deleted chats. Apply migration 0072: ${preferenceError.message}`);
  }

  const conversationIds = Array.from(
    new Set(
      ((preferences ?? []) as unknown as Array<{ conversation_id: string }>)
        .map((row) => row.conversation_id)
        .filter(Boolean),
    ),
  );
  if (!conversationIds.length) return hiddenThreadIds();

  const { data: conversations, error: conversationError } = await supabase
    .from("conversations" as never)
    .select("thread_id" as never)
    .in("id" as never, conversationIds as never);
  if (conversationError) {
    throw new Error(`Could not load deleted chat threads: ${conversationError.message}`);
  }

  const durableIds = ((conversations ?? []) as unknown as Array<{ thread_id: string }>)
    .map((row) => row.thread_id)
    .filter(Boolean);
  return Array.from(new Set([...hiddenThreadIds(), ...durableIds]));
}

/** Hide direct-message threads for this user and remove their sent messages. */
export async function deleteDirectThreads(
  threadIds: string[],
): Promise<{ error: string | null; persisted: boolean }> {
  const ids = [...new Set(threadIds)].filter(Boolean);
  if (!ids.length) return { error: null, persisted: true };

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) return { error: authError.message, persisted: false };
  const me = auth.user?.id;
  if (!me) return { error: "Sign in again before deleting chats.", persisted: false };

  const hideRows: Array<{ conversation_id: string; user_id: string; hidden_at: string }> = [];
  const pairs: Array<[string, string]> = [];
  const hiddenAt = new Date().toISOString();
  for (const id of ids) {
    const pair = dmPair(id);
    if (!pair || !pair.includes(me)) {
      return { error: "A selected chat could not be verified.", persisted: false };
    }
    const peerId = pair.find((userId) => userId !== me);
    if (!peerId) return { error: "A selected chat could not be verified.", persisted: false };

    const { data: existingConversation, error: lookupError } = await supabase
      .from("conversations" as never)
      .select("id" as never)
      .eq("thread_id" as never, id)
      .maybeSingle();
    if (lookupError) {
      return { error: `Could not load this chat: ${lookupError.message}`, persisted: false };
    }

    let conversationId = (existingConversation as unknown as { id?: string } | null)?.id;
    if (!conversationId) {
      const [participantOneId, participantTwoId] = [...pair].sort();
      const { data: createdConversation, error: createError } = await supabase
        .from("conversations" as never)
        .upsert({
          thread_id: id,
          participant_one_id: participantOneId,
          participant_two_id: participantTwoId,
          auto_delete_setting: "off",
        } as never, { onConflict: "thread_id" })
      .select("id" as never)
      .maybeSingle();
      conversationId = (createdConversation as unknown as { id?: string } | null)?.id;
      if (createError || !conversationId) {
      return {
          error: `Could not save this chat deletion: ${createError?.message ?? "conversation unavailable"}`,
        persisted: false,
      };
      }
    }
    hideRows.push({ conversation_id: conversationId, user_id: me, hidden_at: hiddenAt });
    pairs.push([me, peerId]);
  }

  const { error: hideError } = await supabase
    .from("conversation_preferences" as never)
    .upsert(hideRows as never, { onConflict: "conversation_id,user_id" });
  if (hideError) {
    return {
      error: `Could not save this chat deletion. Apply migration 0072: ${hideError.message}`,
      persisted: false,
    };
  }

  writeHidden(HIDDEN_DM_KEY, [...readHidden(HIDDEN_DM_KEY), ...ids]);

  // Preserve the existing delete-for-me behavior: only sent rows are removed;
  // the other participant's copy is not affected by hiding this thread.
  const deletionResults = await Promise.all(
    pairs.map(async ([senderId, peerId]) =>
      supabase
        .from("messages" as never)
        .delete()
        .eq("sender_id" as never, senderId)
        .eq("receiver_id" as never, peerId),
    ),
  );
  const deleteError = deletionResults.find((result) => result.error)?.error;
  return {
    error: deleteError ? `Chat hidden, but sent messages could not be deleted: ${deleteError.message}` : null,
    persisted: true,
  };
}

/** Delete one or many Orbit conversations for the signed-in user. */
export async function deleteOrbitConversations(peerIds: string[]) {
  const ids = [...new Set(peerIds)].filter(isUuid);
  if (!ids.length) return;

  writeHidden(HIDDEN_ORBIT_KEY, [...readHidden(HIDDEN_ORBIT_KEY), ...ids]);

  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) return;

  const now = new Date().toISOString();

  await supabase
    .from("orbit_messages")
    .delete()
    .eq("sender_id", me)
    .in("recipient_id", ids);

  // Everything received before now stays hidden on my side.
  await supabase.from("orbit_chat_settings").upsert(
    ids.map((peer_id) => ({ user_id: me, peer_id, cleared_before: now })) as never,
    { onConflict: "user_id,peer_id" },
  );
}

/** Undo the local hide, e.g. when a chat is opened again on purpose. */
export function unhideOrbitConversation(peerId: string) {
  writeHidden(
    HIDDEN_ORBIT_KEY,
    readHidden(HIDDEN_ORBIT_KEY).filter((id) => id !== peerId),
  );
}
