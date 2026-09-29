import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Per-contact custom display names (the "Change Display Name" chat option).
 * Stored in `conversation_preferences.display_name` for the signed-in user
 * and mirrored in a tiny in-memory + localStorage map so every screen (chat
 * header, chat lists, profile views) shows the custom name instantly.
 */

const LS_KEY = "yw.chat.names";

let cache: Record<string, string> | null = null;
const listeners = new Set<() => void>();
let localRevision = 0;

function readLocal(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeLocal(map: Record<string, string>) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function getChatNames(): Record<string, string> {
  if (cache) return cache;
  cache = typeof window === "undefined" ? {} : readLocal();
  return cache;
}

/** Custom name for a contact, or the given fallback. */
export function chatDisplayName(peerId: string | null | undefined, fallback: string) {
  if (!peerId) return fallback;
  const v = getChatNames()[peerId];
  return v && v.trim() ? v : fallback;
}

/** Update locally (instant) — the caller persists to the database. */
export function setChatNameLocal(peerId: string, name: string | null) {
  if (!peerId) return;
  const map = { ...getChatNames() };
  if (name && name.trim()) map[peerId] = name.trim();
  else delete map[peerId];
  cache = map;
  localRevision += 1;
  writeLocal(map);
  emit();
}

/** Pull every saved custom name for the signed-in user into the local map. */
export async function refreshChatNames() {
  const revisionAtStart = localRevision;
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) return;
  const { data, error } = await supabase
    .from("conversation_preferences")
    .select("conversation_id,display_name")
    .eq("user_id", me);
  if (error || revisionAtStart !== localRevision) return;

  const rows = data ?? [];
  if (!rows.length) {
    cache = {};
    writeLocal(cache);
    emit();
    return;
  }
  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select("id,participant_one_id,participant_two_id")
    .in("id", [...new Set(rows.map((row) => row.conversation_id))]);
  if (conversationsError || revisionAtStart !== localRevision) return;

  const peerByConversation = new Map<string, string>();
  for (const conversation of conversations ?? []) {
    const id = String(conversation.id ?? "");
    const first = String(conversation.participant_one_id ?? "");
    const second = String(conversation.participant_two_id ?? "");
    const peerId = first === me ? second : second === me ? first : "";
    if (id && peerId) peerByConversation.set(id, peerId);
  }
  const map: Record<string, string> = {};
  rows.forEach((row) => {
    const peerId = peerByConversation.get(row.conversation_id);
    if (peerId && row.display_name?.trim()) map[peerId] = row.display_name.trim();
  });
  cache = map;
  writeLocal(map);
  emit();
}

/** Subscribe a component to custom-name changes. */
export function useChatNames() {
  const [names, setNames] = useState<Record<string, string>>(() => getChatNames());

  useEffect(() => {
    const sync = () => setNames({ ...getChatNames() });
    listeners.add(sync);
    void refreshChatNames();
    return () => {
      listeners.delete(sync);
    };
  }, []);

  return {
    names,
    nameFor: (peerId: string | null | undefined, fallback: string) =>
      (peerId ? names[peerId] : undefined) || fallback,
  };
}
