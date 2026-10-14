---
name: Foreground chat push routing
description: Native notification suppression must be scoped to the currently open conversation.
---

Suppress a native Android chat-message notification only when YourWorld is foregrounded and the exact conversation in the FCM payload is the active chat. A foreground app on another screen still needs the message notification. Keep call notification routing separate, and keep in-thread delivery realtime-first.

**Why:** Suppressing every message push whenever the app is foregrounded silently drops notifications for chats that are not currently open.

**How to apply:** Sync the active conversation ID from the chat route to the native Capacitor bridge on enter/exit, then compare it with the push's conversation ID. Continue respecting Android notification permission and existing per-conversation mute/lock rules.
