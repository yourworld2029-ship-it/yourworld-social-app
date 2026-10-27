---
name: Shared Reel Moment playback
description: Use authorized Cloudflare HLS playback URLs for Reels embedded in Moments.
---

When a Moment references a Reel, use the Reel row's `media_url` as its playback source; `video_url` is usually the retained MP4 storage path for downloads, not the player URL. Only use `video_url` as a fallback after removing its `reels/` bucket prefix. For HLS, resolve the public Reel through the authenticated media playback endpoint, just like the full Reel player. On fatal HLS failure, refresh the authorized playback URL once.

**Why:** The Moment viewer can show black while “Watch Full Reel” works if it plays the retained storage path instead of the Reel playback URL, or if an HLS source lacks the playback token.

**How to apply:** Keep the existing public/unpriced Reel access checks, use the shared post ID for playback authorization, and preserve the Moment’s HLS.js playback and 30-second preview cap.
