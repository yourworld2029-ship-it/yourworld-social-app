---
name: Foreground chat push routing
description: Native notification suppression must be scoped to the currently open conversation.
---

Suppress a native Android chat-message notification only when YourWorld is foregrounded and the exact conversation in the FCM payload is the active chat. A foreground app on another screen still needs the message notification. Keep call notification routing separate, and keep in-thread delivery realtime-first.

**Why:** Suppressing every message push whenever the app is foregrounded silently drops notifications for chats that are not currently open.

**How to apply:** Sync the active conversation ID from the chat route to the native Capacitor bridge on enter/exit, then compare it with the push's conversation ID. Continue respecting Android notification permission and existing per-conversation mute/lock rules.

Notification taps must carry a same-origin route through both the Android intent and the web service-worker click path. On Android, retain the action until the app root can consume it after a cold start; keep call actions on their separate channel.

**Why:** A notification click can arrive before the React router mounts, and focusing an already-open window without navigating leaves the user on the wrong screen.

**How to apply:** Include the target route plus conversation/sender or content identifiers in the push payload, validate the route before navigation, and route chat, post/reel, and profile notifications directly without changing foreground notification suppression.
