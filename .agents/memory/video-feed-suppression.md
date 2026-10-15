---
name: Video feed suppression
description: Persistence and scope for per-viewer video hiding and creator muting.
---

Treat “Not Interested” and creator mute as per-viewer feed preferences, not account-level blocks. Persist them separately from `user_blocks` and apply them to each personalized feed loader that can show long videos or Reels. Use `user_hidden_creators` as the canonical creator-hidden list while reading/removing legacy `user_muted_creators` entries for compatibility. Do not let these feed preferences disable messaging or access to a direct share/watch link.

**Why:** Hard account blocks affect chat and relationship behavior; feed controls should only change recommendations and feed visibility. The legacy Reels mute table and the long-video hidden table otherwise make Hide/Unhide behavior inconsistent across surfaces.

**How to apply:** Keep video preference and hidden/legacy-muted creator filtering consistent across Reels and horizontal/vertical long-video feeds; allow Settings to review and remove either record, while leaving direct watch routes and unrelated account features alone.
