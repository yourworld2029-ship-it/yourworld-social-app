---
name: Watermarked Reel downloads
description: Preserves the creator-branding requirement without changing the shared original-byte video download path.
---

Watermarked Reel downloads are a separate export policy from ordinary video downloads. Burn the exact creator attribution into rendered frames and preserve source audio in the export. If the browser or Android WebView cannot render, record, or read the source for canvas export, fail visibly rather than returning unwatermarked bytes.

**Why:** The requested attribution must never be silently omitted, while changing the shared original-byte path could alter downloads elsewhere in the app.

**How to apply:** Keep ordinary video downloads on the existing byte-preserving path. Validate Reel watermark visibility, audio, and clear unsupported-source errors on a real Android WebView before treating the feature as fully device-verified.