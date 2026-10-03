---
name: Cloudflare Stream downloads
description: Cloudflare Stream download availability and preserving accurate quality choices.
---

Cloudflare Stream exposes a single generated `default.mp4`, not separate resolution-specific download files. Use it only when its effective tier matches the requested download tier; otherwise return the owner's authorized Supabase source or exact variant. Never invent Cloudflare quality-specific URLs.

**Why:** The documented Stream download API does not provide independent 1080p, 720p, and 480p MP4 URLs, so pretending it does can label the wrong file as a requested quality.

**How to apply:** Keep the original Supabase source path for authorized offline downloads, and use Stream's `default.mp4` only when source metadata proves the tier is accurate.