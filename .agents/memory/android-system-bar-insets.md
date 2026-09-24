---
name: Android system-bar insets
description: Handle Android 15+ edge-to-edge requirements in the Capacitor WebView.
---

When the Android app targets SDK 35 or higher, Android 15+ enforces edge-to-edge drawing even when the status bar is visible. Disabling fullscreen and showing the status bar do not, by themselves, guarantee that WebView content starts below the status bar and display cutout. Apply native status-bar and display-cutout insets to the WebView on those Android versions; older versions can use the normal decor-fits-system-windows behavior.

**Why:** The app targets a modern SDK, where status bars can be visible and still overlay edge-to-edge content.

**How to apply:** Check `targetSdk` before treating a top cutout as a CSS-only issue. Keep status-bar visibility/icon contrast explicit, then inset content once at the native WebView boundary rather than adding per-screen workarounds.