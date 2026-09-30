---
name: Video playback and downloads
description: Durable constraints for YourWorld video playback, scrubbing, and downloads
---

Playback and user downloads are separate paths: native video elements may use metadata-first preload and browser byte ranges, but offline downloads must use one full HTTP GET without a Range header. Save completed Android downloads in app-private Directory.Data with owner-scoped metadata. Serve media directly from Supabase Storage/CDN rather than adding an API proxy.

**Why:** Some signed media/CDN endpoints reject or inconsistently serve partial requests, which can corrupt downloads or surface invalid-byte-range errors. Playback still needs browser range support, and private Moments must not receive long-lived public cache headers.

**How to apply:** Preserve valid signed media URLs for playback. Keep all download requests as ordinary full GETs, reject unexpected 206 partial responses, and persist complete offline media with owner-scoped metadata. Keep private Moments no-store.

Feed previews use one active player: muted autoplay begins at 70% viewport visibility, and the media source is attached only to the active candidate and released when it leaves focus or is paused. Prefer a resolved uploaded thumbnail; when it is missing or broken, defer muted 0.1-second frame extraction until near view. Profile grids remain non-playing poster tiles, and taps open the watch screen.

**Why:** Instagram-style autoplay should not regress Android responsiveness, and fabricated branded poster art obscures the actual uploaded video content.

**How to apply:** Keep feed media source ownership in the autoplay provider, preserve metadata preload on active players, and lazy-load fallback frame extraction for feed, profile tiles, and Reels. A plain dark loading surface is temporary only; never substitute decorative poster art for the uploaded thumbnail or real frame. Keep offline downloads and creator-watermarked exports on their existing paths.