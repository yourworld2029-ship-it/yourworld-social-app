import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type PresenceMeta = { user_id: string; typing_until: number; online_at: string };

function safelyRemovePresenceChannel(
  channel: ReturnType<typeof supabase.channel>,
) {
  try {
    void Promise.resolve(channel.unsubscribe()).catch((cause) => {
      console.warn("[chat-presence] unsubscribe failed", cause);
    });
  } catch (cause) {
    console.warn("[chat-presence] unsubscribe threw", cause);
  }
  try {
    void Promise.resolve(supabase.removeChannel(channel)).catch((cause) => {
      console.warn("[chat-presence] channel removal failed", cause);
    });
  } catch (cause) {
    console.warn("[chat-presence] channel removal threw", cause);
  }
}

function safelyTrackPresence(
  channel: ReturnType<typeof supabase.channel>,
  value: PresenceMeta,
) {
  try {
    void Promise.resolve(channel.track(value)).catch((cause) => {
      console.warn("[chat-presence] presence update failed", cause);
    });
  } catch (cause) {
    console.warn("[chat-presence] presence update threw", cause);
  }
}

/**
 * Live presence for a chat thread: who else is in the room and whether the
 * peer is currently typing. Uses a Supabase Realtime presence channel.
 */
export function useThreadPresence(threadId: string, me: string | null) {
  const [peerOnline, setPeerOnline] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingUntil = useRef(0);
  const lastTypingSentAt = useRef(0);
  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let alive = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    setPeerOnline(false);
    setPeerTyping(false);
    if (!me || !threadId) {
      return () => {
        alive = false;
      };
    }

    const sync = (target: ReturnType<typeof supabase.channel>) => {
      if (!alive || channel !== target) return;
      try {
        const state = target.presenceState<PresenceMeta>();
        const others = Object.entries(state)
          .filter(([key]) => key !== me)
          .flatMap(([, metas]) => metas);
        setPeerOnline(others.length > 0);
        setPeerTyping(others.some((meta) => (meta.typing_until ?? 0) > Date.now()));
      } catch (cause) {
        console.warn("[chat-presence] presence state handler failed", cause);
      }
    };

    const scheduleRetry = () => {
      if (!alive || retry) return;
      const delay = Math.min(15_000, 1000 * 2 ** Math.min(retryCount, 4));
      retryCount += 1;
      retry = setTimeout(() => {
        retry = null;
        subscribe();
      }, delay);
    };

    const subscribe = () => {
      if (!alive) return;
      try {
        const nextChannel = supabase.channel(`presence-thread-${threadId}`, {
          config: { presence: { key: me } },
        });
        channel = nextChannel;
        channelRef.current = nextChannel;
        nextChannel
          .on("presence", { event: "sync" }, () => sync(nextChannel))
          .on("presence", { event: "join" }, () => sync(nextChannel))
          .on("presence", { event: "leave" }, () => sync(nextChannel))
          .subscribe((status) => {
            if (!alive || channel !== nextChannel) return;
            try {
              if (status === "SUBSCRIBED") {
                retryCount = 0;
                safelyTrackPresence(nextChannel, {
                  user_id: me,
                  typing_until: 0,
                  online_at: new Date().toISOString(),
                });
                sync(nextChannel);
                return;
              }
              if (!["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) return;
              channel = null;
              if (channelRef.current === nextChannel) channelRef.current = null;
              safelyRemovePresenceChannel(nextChannel);
              scheduleRetry();
            } catch (cause) {
              console.warn("[chat-presence] realtime status handler failed", cause);
              channel = null;
              if (channelRef.current === nextChannel) channelRef.current = null;
              safelyRemovePresenceChannel(nextChannel);
              scheduleRetry();
            }
          });
      } catch (cause) {
        console.warn("[chat-presence] realtime setup failed", cause);
        const failed = channel;
        channel = null;
        channelRef.current = null;
        if (failed) safelyRemovePresenceChannel(failed);
        scheduleRetry();
      }
    };
    subscribe();

    // Typing flags expire on their own; re-evaluate on a light interval.
    tick.current = setInterval(() => {
      if (channel) sync(channel);
    }, 1000);

    return () => {
      alive = false;
      if (tick.current) clearInterval(tick.current);
      tick.current = null;
      if (retry) clearTimeout(retry);
      if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
      typingStopTimer.current = null;
      const current = channel;
      channel = null;
      if (channelRef.current === current) channelRef.current = null;
      if (current) safelyRemovePresenceChannel(current);
    };
  }, [threadId, me]);

  /** Call on every keystroke — broadcasts while active and ends after 2s idle. */
  const setTyping = useCallback(
    (typing: boolean) => {
      const channel = channelRef.current;
      if (!channel || !me) return;
      const now = Date.now();
      if (typing) {
        if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
        if (now - lastTypingSentAt.current >= 1000) {
          lastTypingSentAt.current = now;
          typingUntil.current = now + 2000;
          safelyTrackPresence(channel, {
            user_id: me,
            typing_until: typingUntil.current,
            online_at: new Date().toISOString(),
          });
        }
        typingStopTimer.current = setTimeout(() => {
          typingUntil.current = 0;
          lastTypingSentAt.current = 0;
          typingStopTimer.current = null;
          safelyTrackPresence(channel, {
            user_id: me,
            typing_until: 0,
            online_at: new Date().toISOString(),
          });
        }, 2000);
        return;
      }

      if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
      typingStopTimer.current = null;
      typingUntil.current = 0;
      lastTypingSentAt.current = 0;
      safelyTrackPresence(channel, {
        user_id: me,
        typing_until: 0,
        online_at: new Date().toISOString(),
      });
    },
    [me],
  );

  return useMemo(() => ({ peerOnline, peerTyping, setTyping }), [peerOnline, peerTyping, setTyping]);
}

/** Live wallet balance for the signed-in user, kept in sync via Realtime. */
export function useWallet() {
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState("INR");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user.id;
      if (!uid || !alive) {
        setLoading(false);
        return;
      }

      const load = async () => {
        const { data } = await supabase
          .from("wallets")
          .select("balance,currency")
          .eq("user_id", uid)
          .maybeSingle();
        if (!alive) return;
        setBalance(data ? Number(data.balance) : 0);
        if (data?.currency) setCurrency(data.currency);
        setLoading(false);
      };
      await load();

      channel = supabase
        .channel(`wallet-${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${uid}` },
          (payload) => {
            const row = payload.new as { balance?: number; currency?: string } | undefined;
            if (row?.balance != null) setBalance(Number(row.balance));
            if (row?.currency) setCurrency(row.currency);
          },
        )
        .subscribe();
    })();

    return () => {
      alive = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  return { balance, currency, loading };
}
