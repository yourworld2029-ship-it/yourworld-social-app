---
name: Private media playback
description: Supabase private-bucket URL handling and browser playback constraints.
---

For private Supabase media, preserve a still-valid stored signed URL instead of automatically replacing it with a generated public URL when anonymous re-signing fails. Use authorized direct Storage URLs as the native video source and let the video element make progressive Range requests; do not block playback on a JavaScript byte-range preflight.

**Why:** Supabase may mask unauthorized re-sign attempts as “object not found,” while `getPublicUrl` can still construct a URL that returns JSON rather than media. A separate range probe can also time out before the native player gets a chance to stream a valid source.

**How to apply:** Preserve signed URL query parameters and access checks. Assign the direct authorized Storage URL to the video element and allow native progressive playback; switch to a retained direct MP4 source on playback errors. Treat autoplay rejection separately from decode/network failure, especially for unmuted mobile playback.