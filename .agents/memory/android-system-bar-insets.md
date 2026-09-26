---
name: Android system-bar insets
description: Handle Android 15+ edge-to-edge requirements in the Capacitor WebView.
---

When the Android app targets SDK 35 or higher, Android 15+ enforces edge-to-edge drawing even when the status bar is visible. Disabling fullscreen and showing the status bar do not, by themselves, guarantee that WebView content starts below the status bar and display cutout. Apply native status-bar and display-cutout insets to the WebView on those Android versions; older versions can use the normal decor-fits-system-windows behavior.

**Why:** The app targets a modern SDK, where status bars can be visible and still overlay edge-to-edge content.

**How to apply:** Check `targetSdk` before treating a top cutout as a CSS-only issue. Keep status-bar visibility/icon contrast explicit and preserve native WebView insets. YourWorld additionally requires a 40px minimum top padding and 70px minimum height on global, chat, and video headers.

**Why:** Native WebView insets keep the page clear of system bars, while the additional header padding keeps back arrows, avatars, and labels comfortably below status icons.

Fresh Replit shells may not include the Android SDK, even when a previous APK build succeeded. The managed system-dependency installer may not expose `androidenv.androidPkgs.androidsdk`; a composed Nix SDK is a viable fallback, but Gradle's requested Build Tools versions must be included because the Nix SDK output is read-only.

**Why:** Gradle otherwise attempts to install missing Build Tools into the immutable Nix SDK and fails before compiling.

**How to apply:** Check SDK availability before building; if missing, obtain approval for the Android SDK license, compose the target platform and all AGP-requested Build Tools versions with Nix, then point `ANDROID_HOME` at the resulting SDK.