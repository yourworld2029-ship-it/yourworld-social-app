---
name: Private media playback
description: Supabase private-bucket URL handling and browser playback constraints.
---

For private Supabase media, preserve a still-valid stored signed URL instead of automatically replacing it with a generated public URL when anonymous re-signing fails.

**Why:** Supabase may mask unauthorized re-sign attempts as “object not found,” while `getPublicUrl` still constructs a URL that returns JSON rather than media. Passing that URL to a video element produces a misleading unsupported-source error.

**How to apply:** Probe the stored URL with a small range request, verify its MIME type, and use it directly when valid. Treat autoplay rejection separately from decode/network failure, especially for unmuted mobile playback.