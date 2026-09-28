---
name: Video playback and downloads
description: Durable constraints for YourWorld video playback, scrubbing, and downloads
---

Playback and user downloads are separate paths: native video elements should use metadata-first preload so the browser can request and reuse byte ranges, while downloads run as background tasks and save a user-owned offline copy. Serve media directly from Supabase Storage/CDN rather than adding an API proxy.

**Why:** Remote signed Supabase media is not controlled by the app server, so the client cannot guarantee or retrofit `Accept-Ranges` headers. Intercepting partial video responses in CacheStorage can also break range semantics and signed URLs. Direct CDN playback avoids an extra streaming hop; private Moments must not receive long-lived public cache headers.

**How to apply:** Preserve valid signed media URLs for playback and keep playback range requests out of the download task. Store completed offline media with an owner-scoped metadata record, and keep private Moments no-store.

Feed previews use one active player: muted autoplay begins at 70% viewport visibility, and the media source is attached only to the active candidate and released when it leaves focus or is paused. Prefer a resolved uploaded thumbnail; when it is missing or broken, defer muted 0.1-second frame extraction until near view. Profile grids remain non-playing poster tiles, and taps open the watch screen.

**Why:** Instagram-style autoplay should not regress Android responsiveness, and fabricated branded poster art obscures the actual uploaded video content.

**How to apply:** Keep feed media source ownership in the autoplay provider, preserve metadata preload on active players, and lazy-load fallback frame extraction for feed, profile tiles, and Reels. A plain dark loading surface is temporary only; never substitute decorative poster art for the uploaded thumbnail or real frame. Keep offline downloads and creator-watermarked exports on their existing paths.