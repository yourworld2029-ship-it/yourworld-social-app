---
name: Chat camera stream lifecycle
description: Camera track ownership and recorded video MIME handling in Capacitor Android chat.
---

The chat camera should own only one active `getUserMedia` stream. Before switching cameras or opening a replacement stream, detach the preview and stop every track from the previous stream. Release the stream immediately after a still has been captured or a recording has finalized, before opening the editor or video preview.

For recorded clips, preserve `MediaRecorder.mimeType`; if it is empty, use a non-empty chunk MIME type, then the supported MIME option selected before recording. Avoid inferring the Blob type only from the filename, since an incorrectly typed clip can render as a blank video in WebView.

**Why:** Capacitor Android WebView can fail to start a second camera source while old tracks are still active, and MediaRecorder chunks may omit their MIME type.

**How to apply:** Keep track teardown in camera switching and capture completion paths. Carry the resulting MIME type through local preview and chat-media upload.

For Chat Camera capture, prefer 2K at 30 fps when supported, with HD/720p fallback. Keep high-resolution targets ideal rather than mandatory so unsupported or lower-end phones can open the camera promptly.

**Why:** The user asked for smooth, Snapchat-like HD/2K chat capture rather than a camera that stalls on devices unable to sustain a fixed resolution or frame rate.

**How to apply:** Use a short ordered set of permissive getUserMedia profiles; avoid mandatory 4K/60fps constraints and repeated combinations that delay startup.
