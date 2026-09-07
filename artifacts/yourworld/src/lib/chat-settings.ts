import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  autoDeleteSeconds,
  normalizeAutoDeleteSetting,
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

export function useChatSettings(peerId: string | null) {
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
      if (row) {
        setSettings({
          displayName: row.display_name,
          secretLock: row.secret_lock_enabled,
          secretPinSalt: row.secret_pin_salt,
          secretPinHash: row.secret_pin_hash,
          viewOnce: row.view_once_mode,
          autoDeleteSetting: normalizeAutoDeleteSetting(
            row.auto_delete_mode ?? row.auto_delete_setting,
            row.auto_delete_seconds,
          ),
          autoDelete: row.auto_delete_seconds ?? 0,
          screenshotAlert: row.screenshot_alert,
          recordingAlert: row.recording_alert,
          muted: row.muted,
          blocked: !!row.blocked,
        });
      }
      const channelName = `chat-settings-${[me, peerId].sort().join("_")}`;
      const channel = supabase
        .channel(channelName)
        .on("broadcast", { event: "auto_delete_setting" }, ({ payload }) => {
          const incoming = (payload ?? {}) as { auto_delete_mode?: unknown };
          const mode = normalizeAutoDeleteSetting(incoming.auto_delete_mode);
          setSettings((current) => ({
            ...current,
            autoDeleteSetting: mode,
            autoDelete: autoDeleteSeconds(mode),
          }));
        })
        .subscribe();
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
  }, [peerId]);

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
              auto_delete_setting: merged.autoDeleteSetting,
              auto_delete_mode: merged.autoDeleteSetting,
              auto_delete_seconds: autoDeleteSeconds(merged.autoDeleteSetting),
              screenshot_alert: merged.screenshotAlert,
              recording_alert: merged.recordingAlert,
              muted: merged.muted,
              blocked: merged.blocked,
            },
          );
          if (
            next.autoDeleteSetting !== undefined &&
            next.autoDeleteSetting !== prev.autoDeleteSetting
          ) {
            void settingsChannelRef.current?.send({
              type: "broadcast",
              event: "auto_delete_setting",
              payload: { auto_delete_mode: merged.autoDeleteSetting },
            });
          }
        }
        return merged;
      });
    },
    [peerId],
  );

  return { settings, ready, patch };
}
