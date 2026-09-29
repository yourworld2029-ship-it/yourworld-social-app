---
name: Capacitor native detection
description: Safe runtime detection for native and browser surfaces when Capacitor core is imported.
---

`@capacitor/core` initializes `window.Capacitor` in browsers as well as native shells. Do not treat the object's presence alone as proof of a native app; check `isNativePlatform()` and concrete platform values. Server rendering cannot know the WebView platform, so browser-only root gates must wait for client-side platform resolution to avoid flashing inside a native WebView.

**Why:** The global is created by library initialization on all platforms, and server rendering has no native window. Both facts can make a browser-only gate misclassify or flash in a Capacitor app.

**How to apply:** For native-only route guards, use native status/method/platform signals (not object existence), defer browser gates until the client resolves the platform, and keep a detected native state stable through in-app route changes.