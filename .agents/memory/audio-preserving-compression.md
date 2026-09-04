---
name: Audio-preserving compression
description: The safety rule for browser-side video compression and Reel uploads.
---

Browser-side MediaRecorder compression must verify that the source video exposes an audio track and attach that track to the output stream before recording. If audio capture is unavailable, the optimized result must be rejected and the original file uploaded instead.

**Why:** Browser capture APIs can expose only the canvas video track, silently producing a playable but silent Reel. The original file is safer than publishing a stripped audio stream.

**How to apply:** Keep audio-track detection immediately before recorder start, preserve the original-upload fallback, and prefer a browser-supported container without treating a codec conversion as permission to drop audio.