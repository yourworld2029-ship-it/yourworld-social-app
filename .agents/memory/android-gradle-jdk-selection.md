---
name: Android Gradle JDK selection
description: Select JDK 21 for both the Gradle runtime and Java compiler toolchains in Capacitor release builds.
---

This project can expose JDK 21 through `JAVA_HOME` and `PATH` while Android's project Gradle properties still pin the Gradle runtime to JDK 17. That leaves Gradle unable to locate the JDK 21 compiler required by the Capacitor Android modules.

**Why:** Gradle's project-level Java home takes precedence over the JDK selected by the APK build helper, so `JAVA_HOME` alone does not guarantee the compiler toolchain uses JDK 21.

**How to apply:** Pass one-off `GRADLE_OPTS` with both `-Dorg.gradle.java.home=<JDK21>` and `-Dorg.gradle.java.installations.paths=<JDK21>` to the Android build. The default `java` may resolve to JDK 17 even when JDK 21 is later in `PATH`, so inspect `PATH` and set JDK 21 explicitly rather than scanning the store. Keep the project-local JDK pin unchanged unless the supported toolchain is intentionally being revised.