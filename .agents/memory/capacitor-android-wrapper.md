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

This Replit shell may leave `ANDROID_HOME` unset even when Nix store packages already contain the Android platform, build tools, and platform tools. The system-package index may not expose the Nix Android SDK package.

**Why:** Gradle needs one coherent SDK directory and Java 21; the default shell may expose neither even when the SDK components are present.

**How to apply:** Before downloading tools, check for the required platform, build-tools, and platform-tools packages in the Nix store. If present, assemble a temporary SDK root with symlinks to their standard subdirectories and run Gradle with `ANDROID_HOME`, `ANDROID_SDK_ROOT`, and a JDK 21 `JAVA_HOME`. If components are absent, install Google's official command-line tools and SDK packages; get explicit user consent before accepting SDK licenses.

The current Android CLI deprecates `sdkmanager`; its `--licenses` wrapper warns and exits without recording acceptance. Installing a missing required package with `android sdk install` records the compatible license marker. Python `zipfile` extraction can also drop executable bits from command-line tools.

**Why:** Google's SDK tooling moved package management to `android sdk`, so a successful legacy `sdkmanager --licenses` exit can still leave Gradle blocked. Extracted tools also fail with permission errors if executable modes are lost.

**How to apply:** Use `android --no-metrics --sdk="$SDK_ROOT" sdk install <package>/<version>` for a required missing package, then confirm a license file exists under `$SDK_ROOT/licenses`. After extracting Google's command-line-tools ZIP, restore executable bits under `cmdline-tools/latest/bin`.

In September 2026, Google's generic `commandlinetools-linux-latest.zip` URL returned 404, while the repository metadata still advertised the current archive.

**Why:** The official package version changed without the generic download alias resolving in this environment.

**How to apply:** Read `cmdline-tools;latest` from `https://dl.google.com/android/repository/repository2-1.xml`, download its Linux archive URL, and verify the published checksum before extraction instead of guessing or pinning the URL.

Express routes that serve the packaged APK should resolve its path from `import.meta.url`, not `process.cwd()`, because workflow and deployment working directories can differ.

**Why:** A cwd-relative route returned 404 in the running API workflow even though the APK existed in the web artifact.

**How to apply:** Use the compiled server module directory to resolve `../../yourworld/public/yourworld-debug.apk`, then verify both the API port and the root proxy.

Capacitor sync copies public APK downloads into the native app's WebView assets unless Android asset packaging excludes them.

**Why:** Bundling the downloadable APKs inside the app duplicates large binaries and can ship stale installers inside the fresh build.

**How to apply:** Keep APK files in the web artifact's public directory for server downloads, but exclude `*.apk` from Android asset packaging.