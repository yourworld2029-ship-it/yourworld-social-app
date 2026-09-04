---
name: Auto-delete messages
description: Auto-delete behavior shared by Social Chat and Orbit Chat.
---

Each user message stores the auto-delete setting it was sent with; conversation preferences are only defaults for future messages. “After View” is represented separately from timed expiry so reading can mark a message viewed without changing older messages when the preference changes.

**Why:** Changing a conversation setting must not retroactively change the lifetime of messages already sent, and view-based deletion needs durable read state across sessions and realtime clients.

**How to apply:** Keep the exact shared values `off`, `after_view`, `6_hours`, and `24_hours`; exclude system messages from auto-delete metadata and preserve Orbit’s independent view-once media behavior.