---
name: Video frame capture event order
description: Register video metadata and seek listeners before assigning local Blob sources or requesting a frame.
---

For local video thumbnail generation, attach the `loadedmetadata` listener before setting the Blob URL, and attach `seeked` before assigning `currentTime`. Fast local playback can emit either event before a later listener is installed, causing extraction to time out and leave the video without a thumbnail.

**Why:** event ordering is timing-sensitive, especially for short clips; waiting after triggering the event can silently miss the frame.

**How to apply:** use this ordering anywhere browser code extracts frames from a local upload. Keep feed and profile card fallbacks static rather than decoding remote videos.

For long-video uploads, treat the first `loadeddata` poster as a transient preview, not as a chosen or durable thumbnail; it may capture a black opening frame. Preserve an explicitly selected thumbnail, and otherwise generate and upload a frame from the source.

**Why:** saving the transient preview can suppress the dedicated nonzero-time frame capture, leaving a black thumbnail persisted with the video.

**How to apply:** only persist a user-picked/captured thumbnail when one exists; otherwise run the source-frame generation path and store its uploaded image URL.

An image HTTP 200 is not proof of a useful thumbnail: legacy long-video records can contain valid, entirely black image files as well as missing thumbnails. Repair existing thumbnail metadata from a visible source frame, not only the generator for future uploads.

**Why:** repeated Profile Videos fixes missed successfully loaded black images, so image-error fallbacks never ran and older uploads stayed black.

**How to apply:** inspect actual image pixels before diagnosing transport failures. For Profile Videos, reject almost entirely black frames and sample later timestamps using the shared decoder budget. Preserve meaningful dark scenes, authorization checks, originals, and unrelated Reels/Live behavior.