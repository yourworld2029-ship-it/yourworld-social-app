---
name: Browser media fixture compatibility
description: Separate automated-browser codec limitations from Android playback defects.
---

When a valid H.264/AVC fixture fails in automated Chromium with `DEMUXER_ERROR_NO_SUPPORTED_STREAMS`, try a VP8 WebM fixture before changing production playback or encoding.

**Why:** The automated browser rejected valid AVC files served with HTTP 200, including complete fetched Blob copies, while the equivalent VP8 fixture successfully exercised real frame extraction and autoplay. This was an automation codec limitation, not evidence that Android AVC playback was broken.

**How to apply:** Use absolute fixture URLs and a matching media type in browser harnesses. Confirm actual decoding, not just a successful HTTP response. Keep browser compatibility checks separate from physical Android codec, latency, FPS, and memory validation.