import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setUserBlock } from "@/lib/social-data";
import {
  autoDeleteSeconds,
  normalizeAutoDeleteSetting,
  autoDeleteLabel,
  type AutoDeleteSetting,
} from "@/lib/auto-delete";

/**
 * Per-conversation chat options (display name, secret lock, view once, auto
 * delete, capture alerts, chat protection, mute, block) persisted in the
 * conversation-scoped `conversation_preferences` table. Blocks remain in the
 * participant-scoped `user_blocks` table, and auto-delete remains shared on
 * the conversation row.
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
  protectChatEnabled: boolean;
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
  protectChatEnabled: false,
  muted: false,
  blocked: false,
};

type PreferenceRow = {
  display_name?: string | null;
  secret_pin_salt?: string | null;
  secret_pin_hash?: string | null;
  is_locked?: boolean;
  view_once?: boolean;
  auto_delete_setting?: string | null;
  screenshot_alert?: boolean;
  screen_recording_alert?: boolean;
  protect_chat_enabled?: boolean;
  is_muted?: boolean;
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
    if (!peerId) {
      setReady(true);
      return;
    }

    void (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const me = auth?.user?.id ?? null;
        meRef.current = me;
        if (!alive) return;
        if (!me) {
          setSettings(DEFAULTS);
          setReady(true);
          return;
        }
        const [preferenceResult, { data: blockedData }] = await Promise.all([
          conversationId
            ? supabase
                .from("conversation_preferences")
                .select("*")
                .eq("conversation_id", conversationId)
                .eq("user_id", me)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          supabase
            .from("user_blocks" as never)
            .select("blocked_id" as never)
            .eq("blocker_id" as never, me)
            .eq("blocked_id" as never, peerId)
            .maybeSingle(),
        ]);
        if (!alive) return;
        const preference = preferenceResult.data as PreferenceRow | null;
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
        if (!alive) return;
        if (preference || conversationSetting) {
          const preferenceMode = normalizeAutoDeleteSetting(preference?.auto_delete_setting);
          const secretPinSalt = preference?.secret_pin_salt ?? DEFAULTS.secretPinSalt;
          const secretPinHash = preference?.secret_pin_hash ?? DEFAULTS.secretPinHash;
          const lockRequested = preference?.is_locked ?? DEFAULTS.secretLock;
          const lockCanBeVerified =
            typeof secretPinSalt === "string" &&
            secretPinSalt.length > 0 &&
            typeof secretPinHash === "string" &&
            secretPinHash.length > 0;
          setSettings({
            displayName: preference?.display_name ?? DEFAULTS.displayName,
            secretLock: Boolean(lockRequested && lockCanBeVerified),
            secretPinSalt,
            secretPinHash,
            viewOnce: preference?.view_once ?? DEFAULTS.viewOnce,
            autoDeleteSetting: conversationSetting ?? preferenceMode,
            autoDelete: autoDeleteSeconds(conversationSetting ?? preferenceMode),
            screenshotAlert: preference?.screenshot_alert ?? DEFAULTS.screenshotAlert,
            recordingAlert: preference?.screen_recording_alert ?? DEFAULTS.recordingAlert,
            protectChatEnabled: preference?.protect_chat_enabled ?? DEFAULTS.protectChatEnabled,
            muted: preference?.is_muted ?? DEFAULTS.muted,
            blocked: Boolean(blockedData),
          });
        } else {
          setSettings((current) => ({ ...current, blocked: Boolean(blockedData) }));
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
        channelBuilder.on(
          "postgres_changes",
          { event: "*", schema: "public", table: "conversation_preferences", filter: `user_id=eq.${me}` },
          (payload) => {
            const row = payload.new as {
              conversation_id?: string;
              is_locked?: boolean | null;
              secret_pin_salt?: string | null;
              secret_pin_hash?: string | null;
              display_name?: string | null;
              view_once?: boolean;
              screenshot_alert?: boolean;
              screen_recording_alert?: boolean;
              protect_chat_enabled?: boolean;
              is_muted?: boolean;
              auto_delete_setting?: string;
            };
            if (!row || row.conversation_id !== conversationId) return;
            setSettings((current) => {
              const nextSalt = Object.prototype.hasOwnProperty.call(row, "secret_pin_salt")
                ? row.secret_pin_salt ?? null
                : current.secretPinSalt;
              const nextHash = Object.prototype.hasOwnProperty.call(row, "secret_pin_hash")
                ? row.secret_pin_hash ?? null
                : current.secretPinHash;
              const lockCanBeVerified =
                typeof nextSalt === "string" &&
                nextSalt.length > 0 &&
                typeof nextHash === "string" &&
                nextHash.length > 0;
              return {
                ...current,
                secretLock: Boolean((row.is_locked ?? current.secretLock) && lockCanBeVerified),
                secretPinSalt: nextSalt,
                secretPinHash: nextHash,
                displayName: row.display_name ?? current.displayName,
                viewOnce: row.view_once ?? current.viewOnce,
                screenshotAlert: row.screenshot_alert ?? current.screenshotAlert,
                recordingAlert: row.screen_recording_alert ?? current.recordingAlert,
                protectChatEnabled:
                  row.protect_chat_enabled ?? current.protectChatEnabled,
                muted: row.is_muted ?? current.muted,
                autoDeleteSetting: row.auto_delete_setting
                  ? normalizeAutoDeleteSetting(row.auto_delete_setting)
                  : current.autoDeleteSetting,
                autoDelete: row.auto_delete_setting
                  ? autoDeleteSeconds(normalizeAutoDeleteSetting(row.auto_delete_setting))
                  : current.autoDelete,
              };
            });
          },
        );
        channelBuilder.on(
          "postgres_changes",
          { event: "*", schema: "public", table: "user_blocks", filter: `blocker_id=eq.${me}` },
          () => {
            void supabase
              .from("user_blocks" as never)
              .select("blocked_id" as never)
              .eq("blocker_id" as never, me)
              .eq("blocked_id" as never, peerId)
              .maybeSingle()
              .then(
                ({ data }) => {
                  if (!alive) return;
                  setSettings((current) => ({ ...current, blocked: Boolean(data) }));
                },
                (cause: unknown) => {
                  if (alive) console.error("[chat-settings] Unable to refresh block state", cause);
                },
              );
          },
        );
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
      } catch (cause) {
        if (!alive) return;
        console.error("[chat-settings] Unable to load security settings; opening with defaults", cause);
        setSettings(DEFAULTS);
        setReady(true);
      }
    })();

    return () => {
      alive = false;
      if (settingsChannelRef.current) {
        void supabase.removeChannel(settingsChannelRef.current).catch((cause) => {
          console.error("[chat-settings] Unable to remove settings channel", cause);
        });
        settingsChannelRef.current = null;
      }
    };
  }, [peerId, conversationId]);

  /** Optimistic local update + persisted conversation-scoped upsert. */
  const patch = useCallback(
    async (next: Partial<ChatSettings>) => {
      if (!ready) return { error: "Chat settings are still loading. Try again in a moment." };
      const me = meRef.current;
      if (!me || !peerId) return { error: "Chat is still syncing. Try again in a moment." };
      if (!conversationId && Object.keys(next).some((key) => key !== "blocked")) {
        return { error: "Chat is still syncing. Try again in a moment." };
      }
      const previous = settings;
      const merged = { ...previous, ...next };
      setSettings(merged);

      if (conversationId) {
        const preferenceUpdate: Record<string, unknown> = {
          conversation_id: conversationId,
          user_id: me,
          is_locked: merged.secretLock,
          secret_pin_salt: merged.secretPinSalt,
          secret_pin_hash: merged.secretPinHash,
          view_once: merged.viewOnce,
          auto_delete_setting: merged.autoDeleteSetting,
          screenshot_alert: merged.screenshotAlert,
          screen_recording_alert: merged.recordingAlert,
          is_muted: merged.muted,
          updated_at: new Date().toISOString(),
        };
        if (next.displayName !== undefined) {
          preferenceUpdate.display_name = merged.displayName;
        }
        if (next.protectChatEnabled !== undefined) {
          preferenceUpdate.protect_chat_enabled = merged.protectChatEnabled;
        }
        const { error } = await supabase
          .from("conversation_preferences")
          .upsert(preferenceUpdate, { onConflict: "conversation_id,user_id" });
        if (error) {
          setSettings(previous);
          return { error: error.message };
        }
      }

      if (next.blocked !== undefined && next.blocked !== previous.blocked) {
        const blockError = await setUserBlock(me, peerId, next.blocked);
        if (blockError) {
          setSettings(previous);
          return { error: blockError };
        }
      }

      return { error: null };
    },
    [conversationId, peerId, ready, settings],
  );

  const setAutoDeleteSetting = useCallback(async (setting: AutoDeleteSetting) => {
    const me = meRef.current;
    if (!me || !peerId || !conversationId) {
      return { error: "Chat is still syncing. Try again in a moment." };
    }
    const previous = settings.autoDeleteSetting;
    setSettings((current) => ({ ...current, autoDeleteSetting: setting, autoDelete: autoDeleteSeconds(setting) }));
    const { error: preferenceError } = await supabase
      .from("conversation_preferences")
      .upsert({
        conversation_id: conversationId,
        user_id: me,
        auto_delete_setting: setting,
        updated_at: new Date().toISOString(),
      }, { onConflict: "conversation_id,user_id" });
    if (preferenceError) {
      setSettings((current) => ({ ...current, autoDeleteSetting: previous, autoDelete: autoDeleteSeconds(previous) }));
      return { error: preferenceError.message };
    }
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
