---
name: Watermarked video downloads
description: Preserves creator attribution across Reel and long-video download surfaces.
---

Reel and long-video downloads use the same creator-watermarked export. Burn the creator attribution into rendered frames and preserve source audio. If the browser or Android WebView cannot render, record, or read the source for canvas export, fail visibly rather than returning unwatermarked bytes.

**Why:** The user explicitly requested horizontal and vertical video downloads to use the working Reels download pipeline, including its watermark and audio behavior.

**How to apply:** Route Reels and long-video downloads through the same watermarked export after selecting the source quality. Validate watermark visibility, audio, and clear unsupported-source errors on a real Android WebView before treating the feature as device-verified.