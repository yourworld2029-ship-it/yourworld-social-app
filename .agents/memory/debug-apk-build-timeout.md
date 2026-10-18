---
name: Debug APK build timeout
description: Avoid publishing stale APKs when a clean Gradle build outlasts the foreground shell timeout.
---

Clean Capacitor Android Debug builds can exceed the foreground shell command timeout and be terminated before producing an APK. A file already present in the output directory may therefore be stale. Web source changes must also be bundled before `cap sync`, or Gradle can package old JavaScript.

**Why:** The clean build in this workspace exceeded the five-minute foreground limit while compiling Android plugins, leaving no newly packaged APK. Separately, `cap sync` copies the generated Capacitor web directory; it does not compile changed React source.

**How to apply:** For a web-code fix, run the artifact build first, then `cap sync android`, then `clean assembleDebug --no-build-cache` as a background shell task. Monitor for `BUILD SUCCESSFUL`, verify the expected web bundle is packaged, and only then stage it for download.
