---
name: Video playback and downloads
description: Durable constraints for YourWorld video playback, scrubbing, and downloads
---

Playback and user downloads are separate paths: native video elements may use metadata-first preload and browser byte ranges, but offline downloads must use one full HTTP GET without a Range header. Save completed Android downloads in app-private Directory.Data with owner-scoped metadata. Serve media directly from Supabase Storage/CDN rather than adding an API proxy.

**Why:** Some signed media/CDN endpoints reject or inconsistently serve partial requests, which can corrupt downloads or surface invalid-byte-range errors. Playback still needs browser range support, and private Moments must not receive long-lived public cache headers.

**How to apply:** Preserve valid signed media URLs for playback. Keep all download requests as ordinary full GETs, reject unexpected 206 partial responses, and persist complete offline media with owner-scoped metadata. Keep private Moments no-store.

The user requires the centered Feed/Reels video to start muted without an artificial autoplay delay, with one active player and at most one auxiliary decoder. Departing players must release their sources. Feed, Reels, and Profile Grid must show authentic video images, not purple/cyan gradients, title/author dummy cards, or fabricated SVG posters.

**Why:** The user explicitly rejected static thumbnail substitutes while retaining the strict decoder limit for low-memory Android phones.

**How to apply:** Use a stored real thumbnail, Cloudflare's first-second image at height 720, or an authorized metadata/0.1-second frame read. Serialize missing-frame reads through the same auxiliary budget used by next-video preloading; never allocate a probe per card. Profile tiles remain non-playing images. Preserve the separate offline-download and creator-watermark paths.

Poster-frame extraction is a media read and must not bypass video access checks. If a surface cannot confirm the viewer’s grant, use an existing real thumbnail or explicitly report an unavailable preview instead of resolving protected source bytes or inventing a replacement image.

**Why:** A hidden poster-only video request can expose paid or restricted content even when the watch route itself correctly blocks playback.

**How to apply:** Gate media-based poster extraction on the same authorization decision as playback; do not resolve protected source bytes only to draw a thumbnail.

Homepage portrait discovery must remain a horizontal side-swipe shelf even when its section headings are hidden.

**Why:** The user explicitly rejected replacing the portrait carousel with stacked full-size feed posts. Heading visibility and discovery layout are separate requirements.

**How to apply:** Preserve horizontal grouping when changing feed labels, virtualization, or resume placement; do not promote resumed portrait items into the standard stacked feed.