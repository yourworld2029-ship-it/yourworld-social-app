---
name: Reel editor performance
description: Performance constraints for timeline thumbnails, scrubbing, and the vertical preview.
---

Thumbnail work must be keyed to stable source identity, not live trim-handle values, and should use a worker-backed OffscreenCanvas encoder with a local fallback.

**Why:** Trim handles update continuously during touch drag; making them thumbnail dependencies causes repeated media seeks and canvas work exactly when the UI needs to stay responsive.

**How to apply:** Generate a small cached frame when a clip URL changes, coalesce scrub and playhead updates with requestAnimationFrame, and keep the preview inside a native 9:16 contain frame.