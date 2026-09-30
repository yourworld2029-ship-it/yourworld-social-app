---
name: Auto-delete messages
description: Auto-delete behavior shared by Social Chat and Orbit Chat.
---

Social Chat auto-delete is one setting on the shared conversation, with each new user message snapshotting the active value into its own row. The selector is Off, After View (Vanish Mode), 5 Hours, and 24 Hours. Legacy three- and six-hour settings normalize to five hours, and timed expiry is anchored to `created_at` for both new and existing rows. Setting changes create non-expiring system notices and are broadcast to both participants.

**Why:** Per-user settings can diverge between participants; a conversation-level source of truth makes the setting and next-message behavior agree across sessions while preserving existing message lifetimes.

**How to apply:** Keep Social Chat values `off`, `after_view`, `5_hours`, and `24_hours`; normalize legacy `3_hours` and `6_hours` to `5_hours`, calculate timed expiry from `created_at` rather than a stale `expires_at` snapshot, exclude system messages, and do not change Orbit retention.

The live Social schema may not expose the historical `conversations.auto_delete_seconds` column; retention is represented by `auto_delete_setting` and each message's mode and `created_at`.

**Why:** A live migration failed when it tried to write the absent legacy column, while message creation time already provides the required five-hour expiry source.

**How to apply:** Inspect live columns before referencing historical retention fields; do not make Social cleanup depend on a per-conversation seconds snapshot.

Normal `after_view` messages, including text and non-View-Once media, remain available while the chat stays open. On chat exit or unmount, either participant can trigger hard deletion of read or viewed Vanish rows and local cache removal; reopening also filters consumed rows before rendering. Owned chat media is removed first, while validated shared Moment assets remain intact. Explicit View Once media keeps its separate five-second expiry after it is opened.

**Why:** A timed five-second expiry makes Vanish Mode disappear while the recipient is still in the conversation and fails the chat-exit lifecycle.

**How to apply:** Keep read/view triggers, local render guards, cache hydration, exit cleanup, participant-authorized deletion, and realtime DELETE delivery aligned. Do not route Social changes through Orbit; Postgres Changes publishes `messages` deletes to the peer screen.

Timed Social text rows need a server-side scheduled sweep using `created_at` so they are removed when no chat is mounted. Timed media rows must continue through the storage-aware cleanup job; View Once still uses its explicit five-second expiry.

**Why:** A client-mounted sweep alone cannot guarantee expiry when both participants have left the chat.

**How to apply:** Schedule Social-only text cleanup and leave media-bearing rows for the storage-aware Edge Function; avoid broadening Social changes into Orbit cleanup.

Chat media cleanup must distinguish chat-owned uploads from shared Moment assets: a validated non-View-Once `moment_reply` may reference the original file in `moments`; hard-delete the expired chat row but leave the shared file to the Moment lifecycle.

**Why:** Deleting a shared source object while cleaning a chat reply can break a live Moment for its owner and other viewers.

**How to apply:** Preserve the object only when reply type, explicit `moment_media_url`, `moment_id`, bucket, and path validate. Do not apply this shared-source exception to View-Once uploads.