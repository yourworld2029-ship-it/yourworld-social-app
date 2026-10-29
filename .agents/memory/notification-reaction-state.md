---
name: Notification filters and reactions
description: Live notification filter mapping and first-render comment-like state.
---

Notification chips should map to real event types and update from current user activity. Treat collaboration invitations as tag-like activity and channel updates as monetization activity when no dedicated chips exist. New-follower rows should derive from actual follow records and refresh from Realtime.

Notification comment rows should receive the current user's liked state as part of notification hydration. Keep only local optimistic overrides in the notification screen; do not render an incorrect default state and replace it after a second post-mount query.

**Why:** The user wants every visible notification filter to show its matching live activity, and reported a visible delay where comment actions first showed “Like” then changed to “Liked.”

**How to apply:** Keep filter mappings aligned with notification kinds and live data sources. Resolve `comment_likes` for displayed comment IDs during hydration, attach the state to each item, and refresh on follow and comment-like Realtime changes.
