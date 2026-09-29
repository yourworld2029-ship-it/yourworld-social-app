import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type PeerProtectionState = {
  roomKey: string;
  enabled: boolean;
  ready: boolean;
};

type ProtectionPresence = {
  protectChat?: unknown;
};

/**
 * Shares a user's in-chat protection toggle as transient Supabase Presence.
 * The remote flag is intentionally derived only from the other participant.
 */
export function usePeerChatProtectionPresence(
  channelName: string | null,
  currentUserId: string | null,
  peerUserId: string | null,
  enabled: boolean,
  enabledReady: boolean,
) {
  const [peerState, setPeerState] = useState<PeerProtectionState>({
    roomKey: "",
    enabled: false,
    ready: false,
  });
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const enabledRef = useRef(enabled);
  const enabledReadyRef = useRef(enabledReady);
  const subscribedRoomRef = useRef<string | null>(null);
  enabledRef.current = enabled;
  enabledReadyRef.current = enabledReady;

  const roomKey =
    channelName && currentUserId && peerUserId && currentUserId !== peerUserId
      ? `${channelName}|${currentUserId}|${peerUserId}`
      : "";

  useEffect(() => {
    if (!roomKey || !channelName || !currentUserId || !peerUserId) return;

    let alive = true;
    let presenceSynced = false;
    const channel = supabase.channel(channelName, {
      config: { presence: { key: currentUserId } },
    });
    channelRef.current = channel;

    const updatePeerState = () => {
      const presence = channel.presenceState();
      const entries = (presence[peerUserId] ?? []) as ProtectionPresence[];
      const peerEnabled = entries.some((entry) => entry?.protectChat === true);
      if (alive) setPeerState({ roomKey, enabled: peerEnabled, ready: presenceSynced });
    };
    const syncPeerState = () => {
      presenceSynced = true;
      updatePeerState();
    };

    channel
      .on("presence", { event: "sync" }, syncPeerState)
      .on("presence", { event: "join" }, updatePeerState)
      .on("presence", { event: "leave" }, updatePeerState)
      .subscribe((status) => {
        if (!alive) return;
        if (status === "SUBSCRIBED") {
          subscribedRoomRef.current = roomKey;
          if (enabledReadyRef.current) {
            void channel
              .track({
                userId: currentUserId,
                protectChat: enabledRef.current,
              })
              .catch((error: unknown) => {
                console.warn("[chat-protection] Could not share protection state", error);
              });
          }
          updatePeerState();
        }
      });

    return () => {
      alive = false;
      if (channelRef.current === channel) channelRef.current = null;
      if (subscribedRoomRef.current === roomKey) subscribedRoomRef.current = null;
      void supabase.removeChannel(channel).catch((error: unknown) => {
        console.warn("[chat-protection] Could not leave protection room", error);
      });
    };
  }, [channelName, currentUserId, peerUserId, roomKey]);

  useEffect(() => {
    const channel = channelRef.current;
    if (
      !channel ||
      !currentUserId ||
      !roomKey ||
      !enabledReady ||
      subscribedRoomRef.current !== roomKey
    ) {
      return;
    }
    void channel
      .track({ userId: currentUserId, protectChat: enabled })
      .catch((error: unknown) => {
        console.warn("[chat-protection] Could not update protection state", error);
      });
  }, [currentUserId, enabled, enabledReady, roomKey]);

  if (!roomKey) return { enabled: false, ready: true };
  if (peerState.roomKey !== roomKey) return { enabled: false, ready: false };
  return { enabled: peerState.enabled, ready: peerState.ready };
}