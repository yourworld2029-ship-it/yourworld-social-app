---
name: Video playback and downloads
description: Durable constraints for YourWorld video playback, scrubbing, and downloads
---

Playback and user downloads are separate paths: native video elements should use metadata-first preload so the browser can request and reuse byte ranges, while downloads run as background tasks and save a user-owned offline copy. Serve media directly from Supabase Storage/CDN rather than adding an API proxy.

**Why:** Remote signed Supabase media is not controlled by the app server, so the client cannot guarantee or retrofit `Accept-Ranges` headers. Intercepting partial video responses in CacheStorage can also break range semantics and signed URLs. Direct CDN playback avoids an extra streaming hop; private Moments must not receive long-lived public cache headers.

**How to apply:** Preserve valid signed media URLs for playback and keep playback range requests out of the download task. Store completed offline media with an owner-scoped metadata record, and keep private Moments no-store.