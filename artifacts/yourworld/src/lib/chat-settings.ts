import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  autoDeleteSeconds,
  normalizeAutoDeleteSetting,
  autoDeleteLabel,
  type AutoDeleteSetting,
} from "@/lib/auto-delete";
import { writeCompat } from "@/lib/supabase-compat";

/**
 * Per-conversation chat options (display name, secret lock, view once, auto
 * delete, capture alerts, mute, block) persisted in `orbit_chat_settings`.
 * Used by the Social chat screen; Orbit chat keeps its own richer loader.
 */
export type ChatSettings = {
  displayName: string | null;
  secretLock: boolean;
  secretPinSalt: string | null;
  secretPinHash: string | null;
  viewOnce: boolean;
  autoDeleteSetting: AutoDeleteSetting;
  /** Legacy numeric value retained for older callers and rows. */
  autoDelete: number;
  screenshotAlert: boolean;
  recordingAlert: boolean;
  muted: boolean;
  blocked: boolean;
};

const DEFAULTS: ChatSettings = {
  displayName: null,
  secretLock: false,
  secretPinSalt: null,
  secretPinHash: null,
  viewOnce: false,
  autoDeleteSetting: "off",
  autoDelete: 0,
  screenshotAlert: true,
  recordingAlert: true,
  muted: false,
  blocked: false,
};

type Row = {
  display_name: string | null;
  secret_lock_enabled: boolean;
  secret_pin_salt: string | null;
  secret_pin_hash: string | null;
  view_once_mode: boolean;
  auto_delete_setting?: string | null;
  auto_delete_mode?: string | null;
  auto_delete_seconds: number;
  screenshot_alert: boolean;
  recording_alert: boolean;
  muted: boolean;
  blocked: boolean | null;
};

export function useChatSettings(peerId: string | null, conversationId: string | null = null) {
  const [settings, setSettings] = useState<ChatSettings>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const meRef = useRef<string | null>(null);
  const settingsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    let alive = true;
    setReady(false);
    setSettings(DEFAULTS);
    if (!peerId) return;

    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const me = auth.user?.id ?? null;
      meRef.current = me;
      if (!me || !alive) return;
      const { data } = await supabase
        .from("orbit_chat_settings")
        .select("*")
        .eq("user_id", me)
        .eq("peer_id", peerId)
        .maybeSingle();
      if (!alive) return;
      const row = data as Row | null;
      let conversationSetting: AutoDeleteSetting | null = null;
      if (conversationId) {
        const conversationResult = await supabase
          .from("conversations" as never)
          .select("auto_delete_setting" as never)
          .eq("id" as never, conversationId)
          .maybeSingle();
        if (!conversationResult.error && conversationResult.data) {
          conversationSetting = normalizeAutoDeleteSetting(
            (conversationResult.data as { auto_delete_setting?: unknown }).auto_delete_setting,
          );
        }
      }
      if (row || conversationSetting) {
        setSettings({
          displayName: row?.display_name ?? DEFAULTS.displayName,
          secretLock: row?.secret_lock_enabled ?? DEFAULTS.secretLock,
          secretPinSalt: row?.secret_pin_salt ?? DEFAULTS.secretPinSalt,
          secretPinHash: row?.secret_pin_hash ?? DEFAULTS.secretPinHash,
          viewOnce: row?.view_once_mode ?? DEFAULTS.viewOnce,
          autoDeleteSetting: conversationSetting ??
            normalizeAutoDeleteSetting(
              row?.auto_delete_mode ?? row?.auto_delete_setting,
              row?.auto_delete_seconds,
            ),
          autoDelete: conversationSetting ? autoDeleteSeconds(conversationSetting) : row?.auto_delete_seconds ?? 0,
          screenshotAlert: row?.screenshot_alert ?? DEFAULTS.screenshotAlert,
          recordingAlert: row?.recording_alert ?? DEFAULTS.recordingAlert,
          muted: row?.muted ?? DEFAULTS.muted,
          blocked: !!row?.blocked,
        });
      }
      const channelName = conversationId
        ? `conversation-settings-${conversationId}`
        : `chat-settings-${[me, peerId].sort().join("_")}`;
      const channelBuilder = supabase
        .channel(channelName)
        .on("broadcast", { event: "auto_delete_updated" }, ({ payload }) => {
          const incoming = (payload ?? {}) as { auto_delete_setting?: unknown; new_setting?: unknown };
          const mode = normalizeAutoDeleteSetting(incoming.auto_delete_setting ?? incoming.new_setting);
          setSettings((current) => ({
            ...current,
            autoDeleteSetting: mode,
            autoDelete: autoDeleteSeconds(mode),
          }));
        });
      if (conversationId) {
        channelBuilder.on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "conversations", filter: `id=eq.${conversationId}` },
          (payload) => {
            const mode = normalizeAutoDeleteSetting(
              (payload.new as { auto_delete_setting?: unknown }).auto_delete_setting,
            );
            setSettings((current) => ({
              ...current,
              autoDeleteSetting: mode,
              autoDelete: autoDeleteSeconds(mode),
            }));
          },
        );
      }
      const channel = channelBuilder.subscribe();
      settingsChannelRef.current = channel;
      setReady(true);
    })();

    return () => {
      alive = false;
      if (settingsChannelRef.current) {
        void supabase.removeChannel(settingsChannelRef.current);
        settingsChannelRef.current = null;
      }
    };
  }, [peerId, conversationId]);

  /** Optimistic local update + background upsert so toggles feel instant. */
  const patch = useCallback(
    (next: Partial<ChatSettings>) => {
      setSettings((prev) => {
        const merged = { ...prev, ...next };
        const me = meRef.current;
        if (me && peerId) {
          void writeCompat(
            (payload) =>
              supabase
                .from("orbit_chat_settings")
                .upsert(payload as never, { onConflict: "user_id,peer_id" }),
            {
              user_id: me,
              peer_id: peerId,
              display_name: merged.displayName,
              secret_lock_enabled: merged.secretLock,
              secret_pin_salt: merged.secretPinSalt,
              secret_pin_hash: merged.secretPinHash,
              view_once_mode: merged.viewOnce,
              screenshot_alert: merged.screenshotAlert,
              recording_alert: merged.recordingAlert,
              muted: merged.muted,
              blocked: merged.blocked,
            },
          );
        }
        return merged;
      });
    },
    [peerId],
  );

  const setAutoDeleteSetting = useCallback(async (setting: AutoDeleteSetting) => {
    const me = meRef.current;
    if (!me || !peerId || !conversationId) {
      return { error: "Chat is still syncing. Try again in a moment." };
    }
    const previous = settings.autoDeleteSetting;
    setSettings((current) => ({
      ...current,
      autoDeleteSetting: setting,
      autoDelete: autoDeleteSeconds(setting),
    }));
    const { error: updateError } = await supabase
      .from("conversations" as never)
      .update({ auto_delete_setting: setting, updated_at: new Date().toISOString() } as never)
      .eq("id" as never, conversationId);
    if (updateError) {
      setSettings((current) => ({
        ...current,
        autoDeleteSetting: previous,
        autoDelete: autoDeleteSeconds(previous),
      }));
      return { error: updateError.message };
    }
    const { error: noticeError } = await supabase
      .from("messages" as never)
      .insert({
        sender_id: me,
        receiver_id: peerId,
        conversation_id: conversationId,
        content: `Auto-delete set to ${autoDeleteLabel(setting)}`,
        is_system_message: true,
        auto_delete_setting: "off",
        auto_delete_mode: "off",
        expires_at: null,
        is_deleted: false,
      } as never);
    if (noticeError) {
      return { error: noticeError.message };
    }
    await settingsChannelRef.current?.send({
      type: "broadcast",
      event: "auto_delete_updated",
      payload: {
        conversation_id: conversationId,
        auto_delete_setting: setting,
      },
    });
    return { error: null };
  }, [conversationId, peerId, settings.autoDeleteSetting]);

  return { settings, ready, patch, setAutoDeleteSetting };
}
