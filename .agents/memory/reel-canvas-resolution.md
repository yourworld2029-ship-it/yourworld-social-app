---
name: Reel canvas resolution
description: Keep protected Reel playback crisp on Android without unbounded frame buffers.
---

Protected Reel canvases must size their backing buffer in device pixels, not only CSS viewport pixels.

**Why:** Android WebView uses CSS pixels while the device screen uses physical pixels; stretching a low-resolution canvas can make an HD source look blurry.

**How to apply:** For Reels only, scale the viewport by devicePixelRatio (bounded to 3) and cap the canvas at 1440×2560. Leave other protected-canvas surfaces unchanged.
