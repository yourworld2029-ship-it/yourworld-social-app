---
name: Quality-specific downloads
description: Constraints and fallback behavior for source-quality downloads and browser-side exports.
---

Quality-aware downloads should preserve the existing full-file path for the original source tier and only process smaller tiers after the viewer explicitly chooses them. Uploads without stored dimensions need an original-file fallback rather than being treated as a known 480p source.

**Why:** Private Supabase media already has a reliable signed-URL and service-worker download flow, while the web client cannot guarantee server-side transcoding or MP3 encoding on every device.

**How to apply:** Keep source quality metadata optional for legacy rows, derive tiers from native dimensions for new uploads, estimate sizes from duration and bitrate, and treat browser export capability as a runtime constraint.