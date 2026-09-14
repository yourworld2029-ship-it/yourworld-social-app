---
name: Sports introduction verification
description: Storage and persistence boundary for Sports Introduction videos and profile verification requests.
---

Sports Introduction videos use the existing `videos` bucket under an owner-scoped path, while the profile bio stores only that object path and the existing `profiles.verification_requested` field stores request state.

**Why:** The feature must not create a new table, route, Reels record, Sports ID, or separate Sports Profile, and profile bio serialization is the existing durable Sports metadata channel.

**How to apply:** Preserve the Sports Introduction metadata whenever Sports bio fields are reserialized, resolve the stored path before playback, and require the authenticated owner for upload, replacement, deletion, and verification submission.