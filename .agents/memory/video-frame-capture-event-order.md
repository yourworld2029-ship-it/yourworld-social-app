---
name: Video frame capture event order
description: Register video metadata and seek listeners before assigning local Blob sources or requesting a frame.
---

For local video thumbnail generation, attach the `loadedmetadata` listener before setting the Blob URL, and attach `seeked` before assigning `currentTime`. Fast local playback can emit either event before a later listener is installed, causing extraction to time out and leave the video without a thumbnail.

**Why:** event ordering is timing-sensitive, especially for short clips; waiting after triggering the event can silently miss the frame.

**How to apply:** use this ordering anywhere browser code extracts frames from a local upload. Keep feed and profile card fallbacks static rather than decoding remote videos.