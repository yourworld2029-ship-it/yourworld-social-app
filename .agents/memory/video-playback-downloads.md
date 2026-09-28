---
name: Video playback and downloads
description: Durable constraints for YourWorld video playback, scrubbing, and downloads
---

Playback and user downloads are separate paths: native video elements should use metadata-first preload so the browser can request and reuse byte ranges, while downloads run as background tasks and save a user-owned offline copy. Serve media directly from Supabase Storage/CDN rather than adding an API proxy.

**Why:** Remote signed Supabase media is not controlled by the app server, so the client cannot guarantee or retrofit `Accept-Ranges` headers. Intercepting partial video responses in CacheStorage can also break range semantics and signed URLs. Direct CDN playback avoids an extra streaming hop; private Moments must not receive long-lived public cache headers.

**How to apply:** Preserve valid signed media URLs for playback and keep playback range requests out of the download task. Store completed offline media with an owner-scoped metadata record, and keep private Moments no-store.

Feed previews use one active player: muted autoplay begins at 70% viewport visibility, and the media source is attached only to the active candidate and released when it leaves focus or is paused. Every feed/Reel player gets a resolved thumbnail poster, then a cached canvas frame or branded inline fallback; profile grids stay poster-only.

**Why:** Instagram-style autoplay should not regress Android responsiveness or return black cards when thumbnail data is absent or unavailable.

**How to apply:** Keep feed media source ownership in the autoplay provider, preserve metadata preload on active players, and use the same fallback poster contract for feed, profile tiles, and Reels. Keep offline downloads and creator-watermarked exports on their existing paths.