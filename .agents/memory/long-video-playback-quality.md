---
name: Long-video playback quality
description: Manual quality switching for long-video HLS playback and retained-MP4 fallbacks.
---

Keep playback quality separate from download permissions. Continue switching Cloudflare HLS quality through its real manifest levels. When a long video is playing from a direct MP4 fallback, resolve a genuine, access-checked on-demand rendition for the selected tier; do not reuse the offline-source endpoint, because a creator may disable downloads while still allowing playback. Reject responses that do not match the requested quality, and preserve playback time and play/pause state during the source switch. Keep Reels unchanged.

**Why:** Playback quality controls how an authorized viewer watches a video, not whether they may retain an offline copy; long videos can use either adaptive HLS or a retained MP4 source.

**How to apply:** Limit the rendition resolver to the long-video detail player. Authenticate and check video access server-side, apply existing source-resolution bounds and rendition caching, and return only the exact requested tier. Do not invent Stream variant URLs or expose download behavior through playback controls.

Manual quality labels apply to both portrait and landscape long videos. Match HLS renditions by their short side, so a 720×1280 portrait stream is treated as 720p rather than 1280p.

**Why:** HLS manifests report full portrait height, which otherwise makes valid lower tiers appear unavailable or select inconsistently.

**How to apply:** Use live manifest levels when the user taps a quality option, match by `min(width, height)` when both dimensions are known, and use HLS.js's immediate level switch rather than waiting for the existing buffer.
