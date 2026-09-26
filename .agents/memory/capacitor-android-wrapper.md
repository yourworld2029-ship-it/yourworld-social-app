---
name: Capacitor Android wrapper
description: Constraints for packaging the SSR YourWorld web artifact as a Capacitor Android app.
---

TanStack Start's Nitro build emits SSR server output and hashed client assets but does not emit a static `index.html` for Capacitor. The Capacitor build must generate a small `.output/public/index.html` shell that loads the hashed client entry and stylesheet after the web build.

**Why:** Capacitor's copy/sync step requires a static HTML entry point, while the existing web deployment must continue to use Nitro's SSR server output.

**How to apply:** Keep the post-build shell generation in the web artifact and point `capacitor.config.ts` at `.output/public`. Android Gradle verification also requires a locally configured Android SDK (`ANDROID_HOME` or `sdk.dir`); Java alone is insufficient.

Android Gradle builds for this Capacitor project require Java 21. The workspace's default GraalVM Java 19 fails during Android JDK-image linking; Java 17 fixes that step but cannot compile Capacitor 8's Java 21 source level.

**Why:** The project can have a complete Capacitor wrapper and Gradle dependencies while still lacking the SDK and a compatible JDK, so a build failure may be environment setup rather than app code.

**How to apply:** Before `assembleDebug`, provision Android platform 36 plus build-tools and run Gradle with a JDK 21 `JAVA_HOME`.

This Replit shell may start without an Android SDK, and its system-package index may not expose the Nix Android SDK package even when Nixpkgs contains it. Request explicit user consent before accepting the Android SDK license, then install Google's command-line tools and the required SDK packages under `$HOME/Android/Sdk`; export `ANDROID_HOME`, `ANDROID_SDK_ROOT`, and the JDK 21 `JAVA_HOME` for Gradle.

**Why:** SDK package installation through the Replit package index failed because the Android SDK package was not indexed, and the default shell Java remained at 17 after Java 21 was installed.

**How to apply:** If `sdkmanager` is absent, use Google's official command-line-tools archive and install the project's compile SDK/build-tools with `android sdk install` after license consent. The current `sdkmanager` entry point is deprecated; verify SDK paths before running Gradle.

In September 2026, Google's generic `commandlinetools-linux-latest.zip` URL returned 404, while the repository metadata still advertised the current archive.

**Why:** The official package version changed without the generic download alias resolving in this environment.

**How to apply:** Read `cmdline-tools;latest` from `https://dl.google.com/android/repository/repository2-1.xml`, download its Linux archive URL, and verify the published checksum before extraction instead of guessing or pinning the URL.

Express routes that serve the packaged APK should resolve its path from `import.meta.url`, not `process.cwd()`, because workflow and deployment working directories can differ.

**Why:** A cwd-relative route returned 404 in the running API workflow even though the APK existed in the web artifact.

**How to apply:** Use the compiled server module directory to resolve `../../yourworld/public/yourworld-debug.apk`, then verify both the API port and the root proxy.

Capacitor sync copies public APK downloads into the native app's WebView assets unless Android asset packaging excludes them.

**Why:** Bundling the downloadable APKs inside the app duplicates large binaries and can ship stale installers inside the fresh build.

**How to apply:** Keep APK files in the web artifact's public directory for server downloads, but exclude `*.apk` from Android asset packaging.