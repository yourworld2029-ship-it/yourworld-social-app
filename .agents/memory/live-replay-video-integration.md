---
name: Permanent live video integration
description: Keep completed live recordings in the standard video system without losing their Live-tab association.
---

Ended live recordings should be linked to the standard video post rather than using a separate replay player. Keep the replay metadata row as the Live-tab association, make its expiry nullable for permanent posts, and cascade that association when the standard post is deleted. Preserve the owner-scoped storage path in the post and use the authorized playback endpoint for private live-replay objects.

**Why:** users expect one watch experience for regular videos and live replays, while private signed URLs can expire and deleting the replay row during promotion breaks the profile Live tab.

**How to apply:** Create or idempotently reuse a standard video post after uploading the recording, link it from `live_replays`, navigate Live cards to the standard video route, and keep storage-source access owner-checked.
