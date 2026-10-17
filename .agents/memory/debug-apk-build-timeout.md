---
name: Debug APK build timeout
description: Avoid publishing stale APKs when a clean Gradle build outlasts the foreground shell timeout.
---

Clean Capacitor Android Debug builds can exceed the foreground shell command timeout and be terminated before producing an APK. A file already present in the output directory may therefore be stale.

**Why:** The clean build in this workspace exceeded the five-minute foreground limit while compiling Android plugins, leaving no newly packaged APK.

**How to apply:** Run `clean assembleDebug --no-build-cache` as a background shell task, monitor for `BUILD SUCCESSFUL`, and only then verify its timestamp/signature and stage it for download.
