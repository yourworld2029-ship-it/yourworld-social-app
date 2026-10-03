---
name: Cloudflare Stream downloads
description: Cloudflare Stream download availability and preserving accurate quality choices.
---

Cloudflare Stream exposes one generated `default.mp4`, not resolution-specific MP4 files. YourWorld's download fallback priority is Cloudflare ID/default MP4, then the active playback URL, then signed/direct Supabase storage. This priority takes precedence over matching a requested quality tier. Keep the saved quality label honest; never invent Cloudflare quality-specific URLs.

**Why:** The user explicitly asked for this fallback order so a playable video is not rejected merely because retained-source metadata is absent. Stream does not expose independent per-tier download URLs.

**How to apply:** Prefer an authorized download-enabled signed Cloudflare URL over an unsigned default URL when available. Preserve active and retained storage sources as fallbacks, and never bypass explicit access or creator download denials.