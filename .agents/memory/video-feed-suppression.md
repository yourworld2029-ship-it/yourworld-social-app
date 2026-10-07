---
name: Video feed suppression
description: Persistence and scope for per-viewer video hiding and creator muting.
---

Treat “Not Interested” and creator mute as per-viewer feed preferences, not account-level blocks. Persist them separately from `user_blocks` and apply them to each personalized feed loader that can show long videos or Reels. Do not let these feed preferences disable messaging or access to a direct share/watch link.

**Why:** Hard account blocks affect chat and relationship behavior; feed controls should only change recommendations and feed visibility.

**How to apply:** Keep video preference and muted-creator filtering consistent across Reels and horizontal/vertical long-video feeds while leaving direct watch routes and unrelated account features alone.
