---
name: Android Gradle JDK selection
description: Select JDK 21 for both the Gradle runtime and Java compiler toolchains in Capacitor release builds.
---

This project can expose JDK 21 through `JAVA_HOME` and `PATH` while Android's project Gradle properties still pin the Gradle runtime to JDK 17. That leaves Gradle unable to locate the JDK 21 compiler required by the Capacitor Android modules.

**Why:** Gradle's project-level Java home takes precedence over the JDK selected by the APK build helper, so `JAVA_HOME` alone does not guarantee the compiler toolchain uses JDK 21. The supplied Android SDK also exposes versioned build-tools through symlinks, which ordinary non-following `find` misses.

**How to apply:** If JDK 21 is installed but the shell still resolves JDK 17, run Gradle inside `nix-shell -p jdk21 --run`, derive `JAVA_HOME` from `readlink -f "$(command -v java)"`, and pass one-off `GRADLE_OPTS` with both `-Dorg.gradle.java.home=<JDK21>` and `-Dorg.gradle.java.installations.paths=<JDK21>`. Use `find -L` or inspect the resolved versioned SDK directory when locating tools such as `aapt`. Keep the project-local JDK pin unchanged unless the supported toolchain is intentionally being revised.