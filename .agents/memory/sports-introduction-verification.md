---
name: Sports introduction verification
description: Storage and persistence boundary for Sports Introduction videos and profile verification requests.
---

Sports Introduction videos use the existing `videos` bucket under an owner-scoped path, while the profile bio stores only that object path and the existing `profiles.verification_requested` field stores request state. On submission, the server copies the stored object into the `reels` bucket and creates one deterministic public Reel for that introduction; retries reuse the same Reel.

**Why:** Profile bio serialization remains the durable verification metadata channel, while the product requirement requires the submitted introduction to become a public Reel without exposing the private source object or creating duplicate posts on retries.

**How to apply:** Preserve the Sports Introduction metadata whenever Sports bio fields are reserialized, resolve the stored path before playback, keep upload/replacement/deletion owner-scoped and mutable only before submission or after correction/rejection, and use the deterministic copied Reel path for idempotent publication.