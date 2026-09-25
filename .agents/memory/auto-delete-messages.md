---
name: Auto-delete messages
description: Auto-delete behavior shared by Social Chat and Orbit Chat.
---

Social DM auto-delete is one setting on the shared conversation, with each new user message snapshotting the active value into its own row. “After View” is represented separately from timed expiry so reading can mark a message viewed without changing older messages when the preference changes. Setting changes create non-expiring system notices and are broadcast to both participants.

**Why:** Per-user settings can diverge between participants; a conversation-level source of truth makes the checkmark and the next-message behavior agree across sessions while preserving existing message lifetimes.

**How to apply:** Keep the exact shared values `off`, `after_view`, `6_hours`, and `24_hours`; read the conversation setting at send time, exclude system messages from auto-delete metadata, and preserve Orbit’s independent view-once media behavior.

The current product contract makes `after_view` apply to every user message, including text, and uses a five-second server-enforced grace window before hard deletion. Database triggers, receiver-side viewed marking, render guards, and deletion broadcasts must all use the same contract.

**Why:** Leaving any old media-only guard in place makes text messages appear persistent even though the shared setting and database expiry say otherwise.

**How to apply:** When changing After View semantics, update both Social and Orbit server/client paths together; use a message-specific authenticated delete RPC plus `MESSAGE_DELETED` for the live peer update.

Chat media cleanup must distinguish chat-owned uploads from shared Moment assets: a validated non-View-Once `moment_reply` may reference the original file in `moments`; hard-delete the expired chat row but leave the shared file to the Moment lifecycle.

**Why:** Deleting a shared source object while cleaning a chat reply can break a live Moment for its owner and other viewers.

**How to apply:** Preserve the object only when reply type, explicit `moment_media_url`, `moment_id`, bucket, and path validate. Do not apply this shared-source exception to View-Once uploads.