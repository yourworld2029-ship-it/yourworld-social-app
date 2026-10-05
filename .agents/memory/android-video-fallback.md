---
name: Long-video compression fallback
description: Browser-file compression and safe chunked fallback for horizontal and vertical Long Videos.
---

Long Videos use the browser `File` from selection for best-effort MP4 compression. `MediaRecorder` has no CRF setting, so size goals must be estimated with a duration-based bitrate; accept encoded output only after validating fast-start layout and audio preservation. If encoding is unsupported, fails, or produces invalid output, silently upload that same original `File` through the existing chunked TUS path. Keep this behavior isolated from Reels.

**Why:** `MediaRecorder` exposes bitrate rather than CRF, and hardware encoder/resource failures vary across Android devices. Retaining the browser `File` avoids whole-file copies and supports chunked recovery; the user explicitly scoped this flow to Long Videos, not Reels.

**How to apply:** Keep compression asynchronous so metadata editing and submit remain available. Preserve the original file object and size through upload; do not materialize a large native content URI into JavaScript memory or change Reel behavior as part of Long Video work.