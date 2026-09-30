---
name: Android system-bar insets
description: Handle Android 15+ edge-to-edge requirements in the Capacitor WebView.
---

When the Android app targets SDK 35 or higher, Android 15+ enforces edge-to-edge drawing even when system bars are visible. Disabling fullscreen and showing the status bar do not, by themselves, keep app content clear of the 3-button navigation bar. Apply status-bar, navigation-bar, and display-cutout insets as padding on Capacitor's root layout around the WebView so the WebView viewport itself ends above the system bars. Keep the inset listener responsive to mode changes and preserve IME inset dispatch.

**Why:** The WebView can report a full-height viewport when its own padding is changed, leaving fixed bottom navigation underneath Android's software buttons on devices using 3-button navigation.

**How to apply:** Keep edge-to-edge bars explicit and non-translucent, apply bar insets to the root BridgeLayout, set the viewport to `viewport-fit=cover`, and use a small CSS safe-area floor for bottom navigation. Use `100dvh` for the app shell so it follows the inset-adjusted visible viewport.

Fresh Replit shells may not include the Android SDK, even when a previous APK build succeeded. The managed system-dependency installer may not expose `androidenv.androidPkgs.androidsdk`; a composed Nix SDK is a viable fallback, but Gradle's requested Build Tools versions must be included because the Nix SDK output is read-only.

**Why:** Gradle otherwise attempts to install missing Build Tools into the immutable Nix SDK and fails before compiling.

**How to apply:** Check SDK availability before building; if missing, obtain approval for the Android SDK license, compose the target platform and all AGP-requested Build Tools versions with Nix, then point `ANDROID_HOME` at the resulting SDK.

Fresh shells may still default to a JDK older than the Android project requires, even after the SDK is configured. Run Gradle with JDK 21 by setting `JAVA_HOME` and placing its `bin` directory first in `PATH`.

**Why:** Gradle compilation fails with `invalid source release: 21` when it starts under JDK 17.

**How to apply:** Check `java -version` immediately before `assembleDebug`; if needed, select JDK 21 for that invocation.