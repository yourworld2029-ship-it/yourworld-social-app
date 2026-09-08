---
name: Auto-delete messages
description: Auto-delete behavior shared by Social Chat and Orbit Chat.
---

Social DM auto-delete is one setting on the shared conversation, with each new user message snapshotting the active value into its own row. “After View” is represented separately from timed expiry so reading can mark a message viewed without changing older messages when the preference changes. Setting changes create non-expiring system notices and are broadcast to both participants.

**Why:** Per-user settings can diverge between participants; a conversation-level source of truth makes the checkmark and the next-message behavior agree across sessions while preserving existing message lifetimes.

**How to apply:** Keep the exact shared values `off`, `after_view`, `6_hours`, and `24_hours`; read the conversation setting at send time, exclude system messages from auto-delete metadata, and preserve Orbit’s independent view-once media behavior.