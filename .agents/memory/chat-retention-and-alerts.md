---
name: Chat retention and capture alerts
description: Durable rules for message expiry and screenshot or recording alerts in Social and Orbit chats.
---

Lifetime retention is the default for both chat surfaces. `after_view` is only valid for explicitly expiring media or voice content; ordinary text and system messages must remain permanent. `6_hours` and `24_hours` are opt-in timed modes.

**Why:** Client-only checks are not enough because older clients and direct inserts can still write legacy auto-delete values. The database trigger must normalize the final mode before the row is stored.

**How to apply:** Keep the shared setting and per-message metadata aligned, and preserve the server-side trigger whenever chat schemas or message insert paths change. Screenshot and recording events should be broadcast to the shared conversation channel; the receiving user applies their own alert and mute preferences before creating a local notice.

Clear Chat must remove both message rows and durable `calls` rows for the participant pair. Any realtime clear channel must use a canonical participant key; a peer-relative channel name gives each side a different subscription.

**Why:** Social call outcomes were written as ordinary messages without a conversation ID, and directional Orbit channels allowed one participant to miss the reset event.

**How to apply:** Keep participant-pair fallback deletion in both clear RPCs, and broadcast the local empty-state reset over the canonical Social conversation or sorted Orbit participant channel.