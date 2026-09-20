---
name: Video playback and downloads
description: Durable constraints for YourWorld video playback, scrubbing, and downloads
---

Playback and downloading are separate paths: native video elements should use metadata-first preload so the browser can request and reuse byte ranges, while downloads should stream full bytes through a shared task manager and save them as MP4.

**Why:** Remote signed Supabase media is not controlled by the app server, so the client cannot guarantee or retrofit `Accept-Ranges` headers. Intercepting partial video responses in CacheStorage can also break range semantics and signed URLs.

**How to apply:** Preserve valid signed media URLs for playback. For in-app offline video downloads, use a page-owned streamed fetch, report progress from response bytes, and write the completed Blob directly to IndexedDB so the task survives route changes without client-side re-encoding.