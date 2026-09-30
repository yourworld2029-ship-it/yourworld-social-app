---
name: Auto-delete messages
description: Auto-delete behavior shared by Social Chat and Orbit Chat.
---

Social Chat auto-delete is one setting on the shared conversation, with each new user message snapshotting the active value into its own row. The selector is Off, After View (Vanish Mode), 3 Hours, and 24 Hours. Legacy six-hour preferences map to three hours for future messages, while historic message expiry snapshots remain unchanged. Setting changes create non-expiring system notices and are broadcast to both participants.

**Why:** Per-user settings can diverge between participants; a conversation-level source of truth makes the setting and next-message behavior agree across sessions while preserving existing message lifetimes.

**How to apply:** Keep Social Chat values `off`, `after_view`, `3_hours`, and `24_hours`; normalize legacy `6_hours` to `3_hours`, anchor timed expiry to `created_at`, exclude system messages, and do not change Orbit retention.

Normal `after_view` messages, including text and non-View-Once media, remain available while the chat stays open. On exit by either authenticated participant, a participant-checked RPC hard-deletes all viewed Vanish Mode rows in that conversation; owned chat media is removed first, while validated shared Moment assets remain intact. Explicit View Once media keeps its separate five-second expiry after it is opened.

**Why:** Recipient-only cleanup leaves viewed messages sent by the exiting participant behind in Supabase and the peer's cache; normal Vanish messages should disappear from both sides when either participant leaves.

**How to apply:** Keep read/view triggers, local render guards, either-participant exit cleanup, and realtime DELETE delivery aligned. Reconcile cached normal Vanish IDs against Supabase on thread load, even if a delete event arrived while the thread was not mounted. Do not route Social changes through Orbit; Postgres Changes publishes `messages` deletes to the peer screen.

Timed Social text rows need a server-side scheduled sweep so they are removed when no chat is mounted. Timed media rows must continue through the existing storage-aware cleanup job.

**Why:** A client-mounted sweep alone cannot guarantee expiry when both participants have left the chat.

**How to apply:** Schedule Social-only text cleanup and leave media-bearing rows for the storage-aware Edge Function; avoid broadening Social changes into Orbit cleanup.

Chat media cleanup must distinguish chat-owned uploads from shared Moment assets: a validated non-View-Once `moment_reply` may reference the original file in `moments`; hard-delete the expired chat row but leave the shared file to the Moment lifecycle.

**Why:** Deleting a shared source object while cleaning a chat reply can break a live Moment for its owner and other viewers.

**How to apply:** Preserve the object only when reply type, explicit `moment_media_url`, `moment_id`, bucket, and path validate. Do not apply this shared-source exception to View-Once uploads.