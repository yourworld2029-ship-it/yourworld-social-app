---
name: Shared Reel Moment playback
description: Use authorized Cloudflare HLS playback URLs for Reels embedded in Moments.
---

When a Moment references a Reel, resolve the underlying public Reel through the authenticated media playback endpoint, just like the full Reel player. A raw HLS manifest can fail in the Moment while “Watch Full Reel” works. On fatal HLS failure, refresh the authorized playback URL once.

**Why:** The Moment viewer showed a brief preview and then black on Android because its HLS source lacked the playback token used by the Reel player.

**How to apply:** Keep the existing public/unpriced Reel access checks, use the shared post ID for playback authorization, and preserve the Moment’s HLS.js playback and 30-second preview cap.
