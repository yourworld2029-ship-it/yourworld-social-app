---
name: Android system-bar insets
description: Handle Android 15+ edge-to-edge requirements in the Capacitor WebView.
---

When the Android app targets SDK 35 or higher, Android 15+ enforces edge-to-edge drawing even when the status bar is visible. Disabling fullscreen and showing the status bar do not, by themselves, guarantee that WebView content starts below the status bar and display cutout. Apply native status-bar and display-cutout insets to the WebView on those Android versions; older versions can use the normal decor-fits-system-windows behavior.

**Why:** The app targets a modern SDK, where status bars can be visible and still overlay edge-to-edge content.

**How to apply:** Check `targetSdk` before treating a top cutout as a CSS-only issue. Keep status-bar visibility/icon contrast explicit and preserve native WebView insets.

Fresh Replit shells may not include the Android SDK, even when a previous APK build succeeded. The managed system-dependency installer may not expose `androidenv.androidPkgs.androidsdk`; a composed Nix SDK is a viable fallback, but Gradle's requested Build Tools versions must be included because the Nix SDK output is read-only.

**Why:** Gradle otherwise attempts to install missing Build Tools into the immutable Nix SDK and fails before compiling.

**How to apply:** Check SDK availability before building; if missing, obtain approval for the Android SDK license, compose the target platform and all AGP-requested Build Tools versions with Nix, then point `ANDROID_HOME` at the resulting SDK.

Fresh shells may still default to a JDK older than the Android project requires, even after the SDK is configured. Run Gradle with JDK 21 by setting `JAVA_HOME` and placing its `bin` directory first in `PATH`.

**Why:** Gradle compilation fails with `invalid source release: 21` when it starts under JDK 17.

**How to apply:** Check `java -version` immediately before `assembleDebug`; if needed, select JDK 21 for that invocation.

Keep Android system-bar visibility, overlay mode, color, and contrast fixed at native startup/Capacitor configuration rather than changing them on route or player transitions. In the current Capacitor StatusBar plugin, `DARK` selects light (white) status icons for a dark background.

**Why:** Reapplying status-bar style or toggling system bars changes WebView insets and can flash or reposition the page.

**How to apply:** Use one startup source of truth for system-bar appearance, keep bars visible through navigation and fullscreen playback, and handle safe areas with native WebView insets.