import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadOrbitMedia } from "@/lib/orbit-live";
import { loadCachedThread, saveCachedThread, PAGE_SIZE } from "@/lib/chat-db";
import {
  expiresAtForAutoDelete,
  type AutoDeleteSetting,
} from "@/lib/auto-delete";

export type OrbitMsgKind = "text" | "photo" | "video" | "audio" | "system";

export type OrbitMessage = {
  id: string;
  me: boolean;
  kind: OrbitMsgKind;
  text?: string;
  url?: string;
  viewOnce?: boolean;
  autoDeleteSetting?: AutoDeleteSetting;
  isViewed?: boolean;
  viewedAt?: number;
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
  view_once?: boolean | null;
  auto_delete_setting?: AutoDeleteSetting | null;
  expires_at?: string | null;
  is_viewed?: boolean | null;
  viewed_at?: string | null;
  created_at: string;
};

const ORBIT_MESSAGE_COLUMNS =
  "id,sender_id,recipient_id,kind,text,url,view_once,auto_delete_setting,expires_at,is_viewed,viewed_at,created_at";
const ORBIT_BASE_MESSAGE_COLUMNS =
  "id,sender_id,recipient_id,kind,text,url,created_at";

function isMissingOptionalOrbitColumn(error: unknown) {
  const text =
    error && typeof error === "object"
      ? String((error as { message?: unknown }).message ?? "")
      : String(error ?? "");
  return /schema cache|does not exist/i.test(text) &&
    /\b(view_once|auto_delete_setting|expires_at|is_viewed|viewed_at)\b/i.test(text);
}

async function fetchOrbitRows({
  me,
  peerId,
  clearedBefore,
  before,
}: {
  me: string;
  peerId: string;
  clearedBefore?: string | null;
  before?: string;
}): Promise<Row[] | null> {
  const run = async (columns: string) => {
    let query = supabase
      .from("orbit_messages" as never)
      .select(columns)
      .or(
        `and(sender_id.eq.${me},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${me})`,
      );
    if (clearedBefore) query = query.gt("created_at", clearedBefore);
    if (before) query = query.lt("created_at", before);
    return query.order("created_at", { ascending: false }).limit(PAGE_SIZE);
  };

  try {
    let result = await run(ORBIT_MESSAGE_COLUMNS);
    if (result.error && isMissingOptionalOrbitColumn(result.error)) {
      result = await run(ORBIT_BASE_MESSAGE_COLUMNS);
    }
    if (result.error) {
      console.error("[orbit-chat] message fetch failed", result.error);
      return null;
    }
    return ((result.data ?? []) as unknown as Row[]).filter((row) => row?.id && row.sender_id && row.recipient_id);
  } catch (cause) {
    console.error("[orbit-chat] message fetch threw", cause);
    return null;
  }
}

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

export const isUnexpiredOrbitRow = (
  r: { expires_at?: string | null } & Partial<
    Pick<Row, "auto_delete_setting" | "is_viewed" | "sender_id" | "recipient_id">
  >,
  viewerOrNow?: string | null | number,
  now = Date.now(),
) => {
  const viewerId = typeof viewerOrNow === "number" ? undefined : viewerOrNow;
  const timestamp = typeof viewerOrNow === "number" ? viewerOrNow : now;
  return (
    (!r.expires_at || new Date(r.expires_at).getTime() > timestamp) &&
    !(
      viewerId &&
      r.recipient_id === viewerId &&
      r.sender_id !== viewerId &&
      r.auto_delete_setting === "after_view" &&
      r.is_viewed &&
      (r as Row).kind !== "text" &&
      (r as Row).kind !== "system"
    )
  )
};

export const isRenderableOrbitMessage = (
  m: Pick<OrbitMessage, "expiresAt"> &
    Partial<Pick<OrbitMessage, "autoDeleteSetting" | "isViewed" | "me" | "kind" | "viewOnce">>,
  now = Date.now(),
) =>
  (!m.expiresAt || m.expiresAt > now) &&
  !(
    m.autoDeleteSetting === "after_view" &&
    m.isViewed &&
    !m.me &&
    (m.kind === "photo" || m.kind === "video" || m.kind === "audio" || m.viewOnce)
  );

const toMsg = (r: Row, me: string): OrbitMessage => ({
  id: r.id,
  me: r.sender_id === me,
  kind: (r.kind as OrbitMsgKind) ?? "text",
  text: r.text ?? undefined,
  url: r.url ?? undefined,
  viewOnce: r.view_once === true,
  autoDeleteSetting: r.auto_delete_setting ?? "off",
  isViewed: r.is_viewed === true,
  viewedAt: r.viewed_at ? new Date(r.viewed_at).getTime() : undefined,
  expiresAt: r.expires_at ? new Date(r.expires_at).getTime() : undefined,
  at: new Date(r.created_at).getTime(),
});

/** Real Orbit one-to-one chat: stored in the database and live for both users. */
export function useOrbitChat(peerId: string, enabled: boolean, clearedBefore?: string | null) {
  const [messages, setMessages] = useState<OrbitMessage[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const meRef = useRef<string | null>(null);
  const messagesRef = useRef<OrbitMessage[]>([]);
  const clearChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const clearGenerationRef = useRef(0);

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
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    const cachedGeneration = clearGenerationRef.current;
    void loadCachedThread<OrbitMessage>(`orbit:${peerId}`).then((rows) => {
      if (cancelled || cachedGeneration !== clearGenerationRef.current || !rows?.length) return;
      merge(rows.filter((row) => isRenderableOrbitMessage(row)));
    });

    const load = async () => {
      const generation = clearGenerationRef.current;
      try {
        const { data: auth } = await supabase.auth.getUser();
        const me = auth.user?.id;
        if (!me || cancelled) return;
        meRef.current = me;
        setMeId(me);
        const fetched = await fetchOrbitRows({ me, peerId, clearedBefore });
        if (fetched === null) return;
        const rows = fetched
          .filter((row) => isUnexpiredOrbitRow(row, me));
        if (cancelled || generation !== clearGenerationRef.current) return;
        setHasMore(rows.length >= PAGE_SIZE);
        merge(rows.map((r) => toMsg(r, me)));
      } catch (cause) {
        console.error("[orbit-chat] message load failed", cause);
      } finally {
        if (!cancelled) setLoading(false);
      }
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
           if (!pair || !isUnexpiredOrbitRow(row, me, Date.now()) || (clearedBefore && new Date(row.created_at).getTime() <= new Date(clearedBefore).getTime())) return;
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
      if (channel) {
        void channel.unsubscribe();
        void supabase.removeChannel(channel);
      }
    };
  }, [peerId, enabled, merge, clearedBefore]);
  useEffect(() => {
    if (!enabled || !isUuid(peerId)) return;
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    void supabase.auth.getUser().then(({ data }) => {
      const me = data.user?.id;
      if (!me || cancelled) return;
      const channelKey = [me, peerId].sort().join("-");
      channel = supabase
        .channel(`orbit-chat-clear-${channelKey}`)
        .on("broadcast", { event: "chat_cleared" }, () => {
          clearGenerationRef.current += 1;
          messagesRef.current = [];
          setMessages([]);
          setHasMore(false);
          void saveCachedThread(`orbit:${peerId}`, []);
        })
        .subscribe();
      clearChannelRef.current = channel;
    });
    return () => {
      cancelled = true;
      if (clearChannelRef.current === channel) clearChannelRef.current = null;
      if (channel) {
        void channel.unsubscribe();
        void supabase.removeChannel(channel);
      }
    };
  }, [peerId, enabled]);

  const insert = useCallback(
    async (msg: { kind: OrbitMsgKind; text?: string; url?: string; viewOnce?: boolean; autoDeleteSetting?: AutoDeleteSetting }) => {
      const me = meRef.current;
      if (!me || !isUuid(peerId)) return null;
       const autoDeleteSetting =
         msg.viewOnce ||
         ((msg.kind === "photo" || msg.kind === "video" || msg.kind === "audio") &&
           msg.autoDeleteSetting === "after_view")
           ? "after_view"
           : msg.kind === "text" && msg.autoDeleteSetting === "after_view"
             ? "off"
             : msg.autoDeleteSetting ?? "off";
      const expiresAt = expiresAtForAutoDelete(autoDeleteSetting);
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      merge([
        {
          id: tempId,
          me: true,
          kind: msg.kind,
          text: msg.text,
          url: msg.url,
          viewOnce: msg.viewOnce,
           autoDeleteSetting,
           expiresAt: expiresAt ? new Date(expiresAt).getTime() : undefined,
           isViewed: false,
          at: Date.now(),
        },
      ]);
      const { data, error } = await supabase
        .from("orbit_messages" as never)
        .insert({
          sender_id: me,
          recipient_id: peerId,
          kind: msg.kind,
          text: msg.text ?? null,
          url: msg.url ?? null,
          view_once: !!msg.viewOnce,
          auto_delete_setting: autoDeleteSetting,
          expires_at: expiresAt,
          is_viewed: false,
          viewed_at: null,
        } as never)
        .select("id,sender_id,recipient_id,kind,text,url,view_once,auto_delete_setting,expires_at,is_viewed,viewed_at,created_at")
        .maybeSingle();
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
       if (error || !data) return null;
       merge([toMsg(data as unknown as Row, me)]);
      return (data as Row).id;
    },
    [peerId, merge],
  );

  const sendText = useCallback(
    (text: string, autoDeleteSetting: AutoDeleteSetting = "off") =>
      insert({ kind: "text", text, autoDeleteSetting }),
    [insert],
  );

  const sendMedia = useCallback(
    async (file: File, kind: "photo" | "video" | "audio", viewOnce = false, autoDeleteSetting: AutoDeleteSetting = "off") => {
      const url = await uploadOrbitMedia(file);
      if (!url) return null;
      const id = await insert({ kind, url, viewOnce, autoDeleteSetting });
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

  const markViewed = useCallback(async (ids: string[]) => {
    const me = meRef.current;
    if (!me || !ids.length) return;
    const expiringIds = ids.filter((id) => {
      const message = messagesRef.current.find((candidate) => candidate.id === id);
      return Boolean(
        message &&
          message.kind !== "text" &&
          message.kind !== "system" &&
          message.autoDeleteSetting === "after_view",
      );
    });
    if (!expiringIds.length) return;
    const viewedAt = new Date().toISOString();
    const { error } = await supabase
      .from("orbit_messages" as never)
      .update({ is_viewed: true, viewed_at: viewedAt } as never)
      .in("id", expiringIds)
      .eq("recipient_id", me)
      .eq("auto_delete_setting", "after_view");
    if (error) return;
     setMessages((prev) => prev.filter((message) => !expiringIds.includes(message.id) || message.me));
  }, []);

  const remove = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    setMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
    await supabase.from("orbit_messages").delete().in("id", ids.filter(isUuid));
  }, []);

  const clear = useCallback(async () => {
    const ids = messages.map((m) => m.id);
    await remove(ids);
  }, [messages, remove]);
  const clearForEveryone = useCallback(async () => {
    const me = meRef.current;
    if (!me || !isUuid(peerId)) {
      return { error: "Chat is still syncing. Try again in a moment." };
    }
    const { error: clearError } = await supabase.rpc(
      "clear_orbit_conversation" as never,
      { _peer_id: peerId } as never,
    );
    if (clearError) return { error: clearError.message };
    clearGenerationRef.current += 1;
    messagesRef.current = [];
    setMessages([]);
    setHasMore(false);
    void saveCachedThread(`orbit:${peerId}`, []);
    const channel = clearChannelRef.current;
    if (channel) {
      await channel.send({
        type: "broadcast",
        event: "chat_cleared",
        payload: { peerId },
      });
    }
    return { error: null };
  }, [peerId]);

  /** Infinite scroll: fetch the previous page of older Orbit messages. */
  const loadOlder = useCallback(async () => {
    const me = meRef.current;
    const oldest = messagesRef.current.find((m) => !m.id.startsWith("temp-"))?.at;
    if (!me || !oldest || loadingMore || !hasMore || !isUuid(peerId)) return;
    const generation = clearGenerationRef.current;
    setLoadingMore(true);
    try {
      const fetched = await fetchOrbitRows({
        me,
        peerId,
        clearedBefore,
        before: new Date(oldest).toISOString(),
      });
      if (fetched === null) return;
      if (generation !== clearGenerationRef.current) return;
      const rows = fetched.filter((row) => isUnexpiredOrbitRow(row, me));
      setHasMore(rows.length >= PAGE_SIZE);
      if (rows.length) merge(rows.map((r) => toMsg(r, me)));
    } catch (cause) {
      console.error("[orbit-chat] older message load failed", cause);
    } finally {
      setLoadingMore(false);
    }
  }, [peerId, clearedBefore, loadingMore, hasMore, merge]);

  useEffect(() => {
    if (!enabled) return;
    const sweep = () => {
      setMessages((prev) => prev.filter((message) => isRenderableOrbitMessage(message)));
      void supabase.rpc("delete_expired_chat_messages" as never);
    };
    sweep();
    const timer = window.setInterval(sweep, 30_000);
    return () => window.clearInterval(timer);
  }, [enabled]);

  return { messages, meId, sendText, sendMedia, insert, consumeViewOnce, markViewed, remove, clear, clearForEveryone, loadOlder, loading, loadingMore, hasMore };
}
