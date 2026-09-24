---
name: Chat retention and capture alerts
description: Durable rules for message expiry and screenshot or recording alerts in Social and Orbit chats.
---

Lifetime retention is the default for both chat surfaces. `after_view` is a shared opt-in mode for user messages, with server-enforced expiry; system messages remain permanent unless they are explicitly removable alert pills. `6_hours` and `24_hours` are opt-in timed modes.

**Why:** Client-only checks are not enough because older clients and direct inserts can still write legacy auto-delete values. The database trigger must normalize the final mode before the row is stored.

**How to apply:** Keep the shared setting and per-message metadata aligned, and preserve the server-side trigger whenever chat schemas or message insert paths change. Screenshot and recording events should be broadcast to the shared conversation channel; screenshot alerts use `send_system_alert`, while legacy screenshot events remain readable. The receiving user applies their own alert and mute preferences before creating a local notice. Web screenshot fallback may use blur/visibility only when enabled, must ignore focused inputs and contenteditable elements, must apply the chat container's `blur(35px)` inline before dispatch, and must throttle to three seconds; native bridge events remain authoritative.

Clear Chat must remove both message rows and durable `calls` rows for the participant pair. Any realtime clear channel must use a canonical participant key; a peer-relative channel name gives each side a different subscription.

**Why:** Social call outcomes were written as ordinary messages without a conversation ID, and directional Orbit channels allowed one participant to miss the reset event.

**How to apply:** Keep participant-pair fallback deletion in both clear RPCs, and broadcast the local empty-state reset over the canonical Social conversation or sorted Orbit participant channel.

After a clear reset, invalidate any in-flight message fetch, pagination request, or cached-thread load before it can merge rows back into local state.

**Why:** Realtime deletion and an earlier fetch can complete in either order; without a generation check, a successful stale fetch can visually resurrect messages that the clear RPC already removed.

**How to apply:** Increment a per-hook clear generation on local and remote resets, capture it when loading, and discard results whose generation no longer matches. Clear pending expiry timers at the same reset boundary.

Unread chat indicators should derive from incoming `messages.is_read` rows for the authenticated receiver, with realtime message updates plus an immediate local event after read mutations so navigation badges do not lag behind an opened thread.

**Why:** The chat list already had per-thread unread data, but the global navigation had no shared count and could remain stale until a later reload.

**How to apply:** Keep the global badge read-only; let thread opening continue to call the existing `markRead` path and refresh the badge from the database after inserts, read updates, auth changes, visibility changes, or reconnects.