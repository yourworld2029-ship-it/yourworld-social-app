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

Keep Android system-bar appearance and contrast stable at native startup. Video detail fullscreen is an explicit exception: use immersive sticky mode only while the Android player is actually fullscreen, hide status and navigation bars, suppress WebView safe-area padding during that state, and restore visible bars plus the saved brightness and cutout settings on every exit. All other app screens keep the native bars and insets.

**Why:** The user explicitly requested edge-to-edge fullscreen playback while normal app screens continue to use native insets. Unscoped bar changes can flash or reposition other routes.

**How to apply:** Gate immersive mode to actual player fullscreen, reapply it on activity focus/resume, and restore it on button exit, external fullscreen changes, and route teardown. Do not change system-bar behavior for unrelated screens.