---
name: Moment mention delivery
description: Product behavior for delivering Moment mentions through Social Chat rather than the Notifications feed.
---

When someone is mentioned in a Moment, send the recipient a normal one-to-one chat message with the text `@[username] mentioned you in their moment`, a Moment preview, and an “Add to your moment” action. Mention items should not appear as entries in the global Notifications feed.

**Why:** The user requested an Instagram-style direct-message flow and wants the Notifications tab reserved for other activity.

**How to apply:** Preserve the canonical DM thread and ordinary message behavior; identify mention messages with metadata so the chat can render the preview/action and the Notifications feed can suppress both new and legacy mention entries.
