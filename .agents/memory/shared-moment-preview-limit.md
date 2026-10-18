---
name: Shared Moment preview limit
description: Preserve the 30-second shared-video Moment boundary when duration metadata is unavailable.
---

Shared Reel/Video Moments must stop at 30 seconds from the selected trim start even when the underlying player reports an unknown, non-finite, or infinite media duration. Keep the “Watch Full” action as the explicit route to the original content; do not allow preview playback to continue past its Moment boundary.

**Why:** HLS or other streamed media can expose non-finite duration metadata; returning early from the time-update handler skips the shared-preview cutoff.

**How to apply:** When changing shared Moment playback, calculate a bounded fallback window for shared sources regardless of duration metadata, while leaving ordinary uploaded-video trim handling unchanged.
