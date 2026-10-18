---
name: Cloudflare Stream downloads
description: Cloudflare Stream download availability and preserving accurate quality choices.
---

Cloudflare Stream exposes one generated `default.mp4`, not resolution-specific MP4 files. YourWorld's download fallback priority is Cloudflare ID/default MP4, then the active playback URL, then signed/direct Supabase storage. This priority takes precedence over matching a requested quality tier. Keep the saved quality label honest; never invent Cloudflare quality-specific URLs.

**Why:** The user explicitly asked for this fallback order so a playable video is not rejected merely because retained-source metadata is absent. Stream does not expose independent per-tier download URLs.

**How to apply:** Prefer an authorized download-enabled signed Cloudflare URL over an unsigned default URL when available. Preserve active and retained storage sources as fallbacks, and never bypass explicit access or creator download denials.

For authentic video posters, keep the stored Cloudflare Stream UID available separately from the playback URL. A signed storage or MP4 URL may not contain enough information to derive the Stream poster URL.

**Why:** Video playback can work while notification thumbnails remain black if the preview only receives a storage URL and loses the Stream UID.

**How to apply:** When a viewer is already authorized to see the content, pass both its media source and stored Stream UID to the poster resolver; do not use poster generation to bypass content access checks.