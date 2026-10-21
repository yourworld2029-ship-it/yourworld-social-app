---
name: Live-only replay playback
description: Use the standard player for live replays without listing them in standard video feeds or profile grids.
---

Ended live recordings use a standard video post as the backing record for the regular watch player, but must appear only in Profile > Live—not in the normal Videos tab or video feed. Keep the replay metadata row as the Live-tab association, make its expiry nullable for permanent posts, and cascade that association when the backing post is deleted. Preserve the owner-scoped storage path in the post and use the authorized playback endpoint for private live-replay objects.

**Why:** users expect one watch experience for regular videos and live replays, but live recordings should not clutter standard video listings; private signed URLs can expire, and deleting replay metadata breaks the Live tab.

**How to apply:** Create or idempotently reuse a backing video post after upload, link it from `live_replays`, exclude linked post IDs from standard feeds/profile video grids, navigate Live cards to the standard video route, and keep storage-source access owner-checked.
