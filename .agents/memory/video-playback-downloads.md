---
name: Video playback and downloads
description: Durable constraints for YourWorld video playback, scrubbing, and downloads
---

Playback and user downloads are separate paths: native video elements may use metadata-first preload and browser byte ranges, but offline downloads must use one full HTTP GET without a Range header. Save completed Android downloads in app-private Directory.Data with owner-scoped metadata. Serve media directly from Supabase Storage/CDN rather than adding an API proxy.

**Why:** Some signed media/CDN endpoints reject or inconsistently serve partial requests, which can corrupt downloads or surface invalid-byte-range errors. Playback still needs browser range support, and private Moments must not receive long-lived public cache headers.

**How to apply:** Preserve valid signed media URLs for playback. Keep all download requests as ordinary full GETs, reject unexpected 206 partial responses, and persist complete offline media with owner-scoped metadata. Keep private Moments no-store.

Feed previews use one active player: muted autoplay begins at 70% viewport visibility, and the media source is attached only to the active candidate and released when it leaves focus or is paused. Feed cards and profile Videos/Reels grids must render stored thumbnail URLs directly through lazy `<img>` elements with a lightweight skeleton. Never mount a hidden video or canvas for list-view poster extraction; profile grids are non-playing image tiles, and taps open the watch screen.

**Why:** Hidden video decoding and canvas sampling in feed/profile lists caused severe memory spikes, black-box freezes, and main-thread stalls. Uploaded thumbnails provide the poster without decoding the source video.

**How to apply:** Keep feed media source ownership in the autoplay provider and preserve metadata preload on the active player, but never attach media for poster extraction. Use the saved thumbnail URL or a static fallback image with native `loading="lazy"`; leave upload-time thumbnail creation, watch-screen playback, offline downloads, and creator-watermarked exports on their separate paths.

Poster-frame extraction is a media read and must not bypass video access checks. If a surface cannot confirm the viewer’s grant, use an uploaded thumbnail or neutral placeholder instead of resolving the protected media URL.

**Why:** A hidden poster-only video request can expose paid or restricted content even when the watch route itself correctly blocks playback.

**How to apply:** Gate media-based poster extraction on the same authorization decision as playback; do not resolve protected source bytes only to draw a thumbnail.

Homepage portrait discovery must remain a horizontal side-swipe shelf even when its section headings are hidden.

**Why:** The user explicitly rejected replacing the portrait carousel with stacked full-size feed posts. Heading visibility and discovery layout are separate requirements.

**How to apply:** Preserve horizontal grouping when changing feed labels, virtualization, or resume placement; do not promote resumed portrait items into the standard stacked feed.