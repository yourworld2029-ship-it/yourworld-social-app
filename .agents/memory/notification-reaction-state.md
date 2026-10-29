---
name: Notification reaction state
description: First-render state for comment likes shown on notification rows.
---

Notification comment rows should receive the current user's liked state as part of notification hydration. Keep only local optimistic overrides in the notification screen; do not render an incorrect default state and replace it after a second post-mount query.

**Why:** The user reported a visible delay/glitch where notification comment actions first showed “Like” and then changed to “Liked” after the notification screen opened.

**How to apply:** Resolve `comment_likes` for the displayed comment IDs while building notification items, attach the state to each item, and update the provider on comment-like realtime events.
