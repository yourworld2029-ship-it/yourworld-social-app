---
name: Long-video compression fallback
description: Browser-file compression and safe chunked fallback for horizontal and vertical Long Videos.
---

Long Videos use the selected browser `File` for best-effort MP4 compression only when it is at most 300 MiB and five minutes. `MediaRecorder` has no CRF setting, so size goals must be estimated with a duration-based bitrate; accept encoded output only after validating fast-start layout and audio preservation. If encoding is unsupported, fails, is still running at submit, or is skipped by the size/duration limit, upload the original through sequential resumable TUS without waiting for a transcode. Use the local selected file for the pending feed preview. Report actual transferred-byte counts only for Long Video; keep Reels behavior unchanged.

**Why:** `MediaRecorder` exposes bitrate rather than CRF, and hardware encoder/resource failures vary across Android devices. Waiting for a full-length local encode delays the first uploaded byte; retaining the browser `File` avoids whole-file copies and supports chunked recovery.

**How to apply:** Keep compression asynchronous so metadata editing and submit remain available. Preserve the original file object and size through upload; abort unfinished compression on submit. Do not materialize a large native content URI into JavaScript memory or change Reel behavior as part of Long Video work.