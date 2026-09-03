import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadOrbitMedia } from "@/lib/orbit-live";
import { loadCachedThread, saveCachedThread, PAGE_SIZE } from "@/lib/chat-db";

export type OrbitMsgKind = "text" | "photo" | "video" | "audio" | "system";

export type OrbitMessage = {
  id: string;
  me: boolean;
  kind: OrbitMsgKind;
  text?: string;
  url?: string;
  viewOnce?: boolean;
  /** Retained in the local cache so an expired row can never be painted offline. */
  expiresAt?: number;
  at: number;
};

type Row = {
  id: string;
  sender_id: string;
  recipient_id: string;
  kind: string;
  text: string | null;
  url: string | null;
  view_once: boolean;
  expires_at: string | null;
  created_at: string;
};

const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

function removeOrbitMediaByUrl(url: string) {
  try {
    const path = new URL(url).pathname.split("/storage/v1/object/sign/orbit-media/")[1];
    if (path) void supabase.storage.from("orbit-media").remove([decodeURIComponent(path)]);
  } catch {
    /* cleanup is best effort and must not change a message result */
  }
}

export const isUnexpiredOrbitRow = (r: Pick<Row, "expires_at">, now = Date.now()) =>
  !r.expires_at || new Date(r.expires_at).getTime() > now;

export const isRenderableOrbitMessage = (m: Pick<OrbitMessage, "expiresAt">, now = Date.now()) =>
  !m.expiresAt || m.expiresAt > now;

const toMsg = (r: Row, me: string): OrbitMessage => ({
  id: r.id,
  me: r.sender_id === me,
  kind: (r.kind as OrbitMsgKind) ?? "text",
  text: r.text ?? undefined,
  url: r.url ?? undefined,
  viewOnce: r.view_once,
  expiresAt: r.expires_at ? new Date(r.expires_at).getTime() : undefined,
  at: new Date(r.created_at).getTime(),
});

/** Real Orbit one-to-one chat: stored in the database and live for both users. */
export function useOrbitChat(peerId: string, enabled: boolean, clearedBefore?: string | null) {
  const [messages, setMessages] = useState<OrbitMessage[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const meRef = useRef<string | null>(null);
  const messagesRef = useRef<OrbitMessage[]>([]);

  const merge = useCallback((next: OrbitMessage[]) => {
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of next) if (isRenderableOrbitMessage(m)) map.set(m.id, m);
      for (const [id, m] of map) if (!isRenderableOrbitMessage(m)) map.delete(id);
      return [...map.values()].sort((a, b) => a.at - b.at);
    });
  }, []);

  // Keep the on-device copy fresh so reopening the chat paints instantly/offline.
  useEffect(() => {
    messagesRef.current = messages;
    if (enabled && isUuid(peerId)) {
      saveCachedThread(
        `orbit:${peerId}`,
        messages.filter((m) => !m.id.startsWith("temp-") && isRenderableOrbitMessage(m)),
      );
    }
  }, [messages, peerId, enabled]);

  useEffect(() => {
    if (!enabled || !isUuid(peerId)) {
      setMessages([]);
      return;
    }
    let cancelled = false;

    void loadCachedThread<OrbitMessage>(`orbit:${peerId}`).then((rows) => {
      if (cancelled || !rows?.length) return;
      merge(rows.filter((row) => isRenderableOrbitMessage(row)));
    });

    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const me = auth.user?.id;
      if (!me || cancelled) return;
      meRef.current = me;
      setMeId(me);
      let query = supabase
        .from("orbit_messages")
        .select("id,sender_id,recipient_id,kind,text,url,view_once,expires_at,created_at")
        .or(
          `and(sender_id.eq.${me},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${me})`,
        );
      if (clearedBefore) query = query.gt("created_at", clearedBefore);
      const { data } = await query.order("created_at", { ascending: false }).limit(PAGE_SIZE);
      if (cancelled) return;
       const rows = ((data ?? []) as Row[]).filter((row) => isUnexpiredOrbitRow(row));
      setHasMore(rows.length >= PAGE_SIZE);
      merge(rows.map((r) => toMsg(r, me)));
    };

    void load();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let retryTimer: number | null = null;
    let retries = 0;
    const reconnect = () => {
      if (cancelled || retryTimer !== null || retries >= 5) return;
      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        retries += 1;
        if (channel) void supabase.removeChannel(channel);
        subscribe();
      }, Math.min(1_000 * 2 ** retries, 16_000));
    };
    const subscribe = () => {
      if (cancelled) return;
      channel = supabase
      .channel(`orbit-chat-${peerId}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orbit_messages" },
        (payload) => {
          const me = meRef.current;
          if (!me) return;
          const row = (payload.new ?? payload.old) as Row | undefined;
          if (!row) return;
          const pair =
            (row.sender_id === me && row.recipient_id === peerId) ||
            (row.sender_id === peerId && row.recipient_id === me);
          if (!pair || !isUnexpiredOrbitRow(row) || (clearedBefore && new Date(row.created_at).getTime() <= new Date(clearedBefore).getTime())) return;
          if (payload.eventType === "DELETE") {
            setMessages((prev) => prev.filter((m) => m.id !== row.id));
            return;
          }
          merge([toMsg(row, me)]);
        },
       )
       .subscribe((status) => {
         if (status === "SUBSCRIBED") {
           retries = 0;
           void load();
         } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
           reconnect();
         }
       });
    };
    const resync = () => {
      if (!cancelled && document.visibilityState === "visible" && navigator.onLine) void load();
    };
    subscribe();
    window.addEventListener("online", resync);
    document.addEventListener("visibilitychange", resync);

    return () => {
      cancelled = true;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      window.removeEventListener("online", resync);
      document.removeEventListener("visibilitychange", resync);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [peerId, enabled, merge, clearedBefore]);

  const insert = useCallback(
    async (msg: { kind: OrbitMsgKind; text?: string; url?: string; viewOnce?: boolean; expiresIn?: number }) => {
      const me = meRef.current;
      if (!me || !isUuid(peerId)) return null;
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      merge([
        {
          id: tempId,
          me: true,
          kind: msg.kind,
          text: msg.text,
          url: msg.url,
          viewOnce: msg.viewOnce,
          at: Date.now(),
        },
      ]);
      const { data, error } = await supabase
        .from("orbit_messages")
        .insert({
          sender_id: me,
          recipient_id: peerId,
          kind: msg.kind,
          text: msg.text ?? null,
          url: msg.url ?? null,
          view_once: !!msg.viewOnce,
          expires_at: msg.expiresIn ? new Date(Date.now() + msg.expiresIn * 1000).toISOString() : null,
        } as never)
        .select("id,sender_id,recipient_id,kind,text,url,view_once,expires_at,created_at")
        .maybeSingle();
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
       if (error || !data) return null;
      merge([toMsg(data as Row, me)]);
      return (data as Row).id;
    },
    [peerId, merge],
  );

  const sendText = useCallback(
    (text: string, expiresIn = 0) => insert({ kind: "text", text, expiresIn }),
    [insert],
  );

  const sendMedia = useCallback(
    async (file: File, kind: "photo" | "video" | "audio", viewOnce = false, expiresIn = 0) => {
      const url = await uploadOrbitMedia(file);
      if (!url) return null;
      const id = await insert({ kind, url, viewOnce, expiresIn });
      if (!id) removeOrbitMediaByUrl(url);
      return id;
    },
    [insert],
  );

  /** Atomically burns received view-once media. The database enforces recipient ownership. */
  const consumeViewOnce = useCallback(async (id: string) => {
    if (!isUuid(id)) return false;
    const message = messagesRef.current.find((m) => m.id === id);
    if (!message || message.me || !message.viewOnce) return false;
    const { data, error } = await supabase.rpc("consume_orbit_view_once" as never, { _msg_id: id } as never);
    if (error) return false;
    const retained = messagesRef.current.filter((m) => m.id !== id && !m.id.startsWith("temp-") && isRenderableOrbitMessage(m));
    messagesRef.current = retained;
    saveCachedThread(`orbit:${peerId}`, retained);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    // Storage deletion is deliberately best-effort: a received signed URL may not
    // grant delete permission, but the database row is already irreversibly burned.
    const url = typeof data === "string" ? data : message.url;
    if (url) removeOrbitMediaByUrl(url);
    return true;
  }, [peerId]);

  const remove = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    setMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
    await supabase.from("orbit_messages").delete().in("id", ids.filter(isUuid));
  }, []);

  const clear = useCallback(async () => {
    const ids = messages.map((m) => m.id);
    await remove(ids);
  }, [messages, remove]);

  /** Infinite scroll: fetch the previous page of older Orbit messages. */
  const loadOlder = useCallback(async () => {
    const me = meRef.current;
    const oldest = messagesRef.current.find((m) => !m.id.startsWith("temp-"))?.at;
    if (!me || !oldest || loadingMore || !hasMore || !isUuid(peerId)) return;
    setLoadingMore(true);
    let query = supabase
      .from("orbit_messages")
      .select("id,sender_id,recipient_id,kind,text,url,view_once,expires_at,created_at")
      .or(
        `and(sender_id.eq.${me},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${me})`,
      )
      .lt("created_at", new Date(oldest).toISOString());
    if (clearedBefore) query = query.gt("created_at", clearedBefore);
    const { data } = await query.order("created_at", { ascending: false }).limit(PAGE_SIZE);
    const rows = ((data ?? []) as Row[]).filter((row) => isUnexpiredOrbitRow(row));
    setHasMore(rows.length >= PAGE_SIZE);
    if (rows.length) merge(rows.map((r) => toMsg(r, me)));
    setLoadingMore(false);
  }, [peerId, clearedBefore, loadingMore, hasMore, merge]);

  useEffect(() => {
    if (!enabled) return;
    const sweep = () => {
      setMessages((prev) => prev.filter((message) => isRenderableOrbitMessage(message)));
      void supabase.rpc("delete_expired_orbit_messages" as never);
    };
    sweep();
    const timer = window.setInterval(sweep, 30_000);
    return () => window.clearInterval(timer);
  }, [enabled]);

  return { messages, meId, sendText, sendMedia, insert, consumeViewOnce, remove, clear, loadOlder, loadingMore, hasMore };
}
