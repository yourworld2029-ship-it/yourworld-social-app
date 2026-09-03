---
name: Quality-specific downloads
description: Constraints and fallback behavior for source-quality downloads and browser-side exports.
---

Quality-aware downloads should preserve the existing full-file path for the original source tier and only process smaller tiers after the viewer explicitly chooses them. Uploads without stored dimensions need an original-file fallback rather than being treated as a known 480p source.

**Why:** Private Supabase media already has a reliable signed-URL and service-worker download flow, while the web client cannot guarantee server-side transcoding or MP3 encoding on every device.

**How to apply:** Keep source quality metadata optional for legacy rows, derive tiers from native dimensions for new uploads, estimate sizes from duration and bitrate, and treat browser export capability as a runtime constraint.

Upload size must not be coupled to compression success. Resumable TUS should receive the original File when browser metadata, codecs, or device memory make adaptive compression unavailable.

**Why:** A client-side compression ceiling turns large uploads into hard failures and defeats resumable storage; preserving the source keeps multi-gigabyte uploads possible.

**How to apply:** Use compression only as a best-effort optimization, retain native dimensions through 4K, and report progress at the chunk level while the upload continues independently of route navigation.