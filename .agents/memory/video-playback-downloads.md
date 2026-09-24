---
name: Video playback and downloads
description: Durable constraints for YourWorld video playback, scrubbing, and downloads
---

Playback and downloading are separate paths: native video elements should use metadata-first preload so the browser can request and reuse byte ranges, while downloads should stream full bytes through a shared task manager and save them as MP4. Keep resumable TUS uploads intact, process completed video objects for fast-start playback, then serve media directly from Supabase Storage/CDN rather than adding an API proxy.

**Why:** Remote signed Supabase media is not controlled by the app server, so the client cannot guarantee or retrofit `Accept-Ranges` headers. Intercepting partial video responses in CacheStorage can also break range semantics and signed URLs. Post-upload processing preserves TUS resume behavior, while direct CDN playback avoids an extra streaming hop; private Moments must not receive long-lived public cache headers.

**How to apply:** Preserve valid signed media URLs for playback. Process only after TUS completes, store the fast-start output and use its path for subsequent signing; keep private Moments no-store. For in-app offline video downloads, use a page-owned streamed fetch, validate `206`/`Content-Range` when splitting requests, fall back to a normal streamed request when ranges are unavailable, report byte progress, and write the completed Blob directly to IndexedDB so the task survives route changes without client-side re-encoding.