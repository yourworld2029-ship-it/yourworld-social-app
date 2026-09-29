type ActiveChatView = {
  ownerId: string;
  threadId: string;
};

let activeChatView: ActiveChatView | null = null;

/** Registers the mounted chat route and clears only the registration it created. */
export function registerActiveChatView(ownerId: string, threadId: string) {
  if (!ownerId || !threadId) return () => {};

  const registration = { ownerId, threadId };
  activeChatView = registration;
  return () => {
    if (activeChatView === registration) activeChatView = null;
  };
}

export function isActiveChatFocusedForCall(ownerId: string, peerId: string) {
  if (!ownerId || !peerId || !activeChatView || activeChatView.ownerId !== ownerId) {
    return false;
  }

  const canonicalThreadId = `dm_${[ownerId, peerId].sort().join("_")}`;
  // Legacy deep links use the peer ID directly as the route ID.
  if (activeChatView.threadId !== canonicalThreadId && activeChatView.threadId !== peerId) {
    return false;
  }

  if (typeof document === "undefined") return false;
  try {
    return document.visibilityState === "visible" && document.hasFocus();
  } catch {
    return false;
  }
}