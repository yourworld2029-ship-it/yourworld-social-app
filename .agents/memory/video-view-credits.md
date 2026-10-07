---
name: Validated video view credits
description: Server-trust boundary and fingerprint limits for long-video and Reel view/watch-time credits.
---

Long-video and Reel credits must use the server-timed playback session and `video_view_ledger`; the legacy user-only `register_unique_view` remains for ordinary posts and Moments, not videos or Reels.

**Why:** the older RPC can be called independently of playback and cannot enforce the continuous-watch threshold or cross-account device uniqueness.

**How to apply:** route new video/Reel counters and creator watch-time totals through the validated ledger. Treat browser fingerprints as persistent best-effort identifiers, not proof of unique physical hardware; Android uses a Keystore-protected token derived from Android ID.
