---
name: Long-video playback quality
description: Manual quality switching for long-video HLS playback and retained-MP4 fallbacks.
---

Keep playback quality separate from download permissions. Continue switching Cloudflare HLS quality through its real manifest levels. When a long video is playing from a direct MP4 fallback, resolve a genuine, access-checked on-demand rendition for the selected tier; do not reuse the offline-source endpoint, because a creator may disable downloads while still allowing playback. Reject responses that do not match the requested quality, and preserve playback time and play/pause state during the source switch. Keep Reels unchanged.

**Why:** Playback quality controls how an authorized viewer watches a video, not whether they may retain an offline copy; long videos can use either adaptive HLS or a retained MP4 source.

**How to apply:** Limit the rendition resolver to the long-video detail player. Authenticate and check video access server-side, apply existing source-resolution bounds and rendition caching, and return only the exact requested tier. Do not invent Stream variant URLs or expose download behavior through playback controls.
