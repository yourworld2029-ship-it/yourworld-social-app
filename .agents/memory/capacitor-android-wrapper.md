---
name: Capacitor Android wrapper
description: Constraints for packaging the SSR YourWorld web artifact as a Capacitor Android app.
---

Keep the web app's Nitro SSR output separate from Capacitor's TanStack Start SPA client build. Use Start's prerendered HTML shell in `.output/capacitor`; do not hand-write a shell or bundle a React-only entry.

**Why:** The static shell must retain Start's stream barrier and router hydration state, and its client build must preserve server-function transforms. An empty shell or React-only entry can load assets but leave the native app blank or break RPC calls.

**How to apply:** Keep Nitro output in `.output/public`, generate the Start SPA bundle in `.output/capacitor`, and point `capacitor.config.ts` there with `server.url` unset. Android Gradle verification also requires a locally configured Android SDK (`ANDROID_HOME` or `sdk.dir`); Java alone is insufficient.

Android Gradle builds for this Capacitor project require Java 21. The workspace's default GraalVM Java 19 fails during Android JDK-image linking; Java 17 fixes that step but cannot compile Capacitor 8's Java 21 source level.

**Why:** The project can have a complete Capacitor wrapper and Gradle dependencies while still lacking the SDK and a compatible JDK, so a build failure may be environment setup rather than app code.

**How to apply:** Before `assembleDebug`, provision Android platform 36 plus build-tools, set `JAVA_HOME` to JDK 21, and prepend its `bin` directory to `PATH` so an earlier JDK 17 cannot be selected.

Capacitor 8's `BridgeActivity` exposes `onPause()` and `onStop()` as public lifecycle methods, so overrides in `MainActivity` must also be public.

**Why:** Java compilation rejects protected overrides as weaker access than the Capacitor superclass methods.

**How to apply:** Match or widen visibility when overriding inherited Android lifecycle callbacks, then verify with the Android Gradle compile task.

Installing a JDK 21 system dependency may leave the default shell's `java` command resolving to JDK 17 even when JDK 21 is also on `PATH`.

**Why:** Gradle selects the first Java executable, while the project's APK helper can find a later JDK 21 entry and set `JAVA_HOME` explicitly.

**How to apply:** Do not infer that JDK 21 is absent from `java -version` alone; use the repository Android build helper or inspect every PATH entry before building directly with Gradle.

This Replit shell may leave `ANDROID_HOME` unset even when Nix store packages already contain the Android platform, build tools, and platform tools. The system-package index may not expose the Nix Android SDK package.

**Why:** Gradle needs one coherent SDK directory and Java 21; the default shell may expose neither even when the SDK components are present.

**How to apply:** Before downloading tools, check for the required platform, build-tools, and platform-tools packages in the Nix store. Their payloads may be under each package's `libexec/android-sdk`; link the package's SDK-relative `platforms`, `build-tools`, and `platform-tools` entries into one SDK root. Make `android/local.properties` and `ANDROID_HOME`/`ANDROID_SDK_ROOT` resolve to that same root, then run Gradle with JDK 21. If components are absent, install Google's official command-line tools and SDK packages; get explicit user consent before accepting SDK licenses.

With this Android Gradle setup, `assembleDebug` requested Build Tools 35.0.0 even though the project compiles and targets SDK 36. When composing an SDK root from Nix packages, the `platform-tools` package directory must be linked directly at `$ANDROID_HOME/platform-tools`; placing that link inside a pre-created directory makes package discovery treat it as nested.

**Why:** Gradle may require a build-tools version different from the compile SDK, and SDK package discovery validates each package's expected root path.

**How to apply:** Check the exact package versions requested by Gradle, include them all in the temporary SDK root, and make package-directory links directly at their SDK-relative paths.

Nix-provided SDKs expose Build Tools version directories as symlinks into the store, so `Dirent.isDirectory()` skips them even though their `aapt` and `apksigner` tools are available.

**Why:** A successful Gradle build can still fail the APK verification/copy step if the build helper enumerates only real directories.

**How to apply:** Enumerate Build Tools entry names, then use `stat()` on each candidate path so directory symlinks are followed before checking for SDK tools.

SDK installations staged under `/tmp` may disappear between agent runs even when previously built APK files remain.

**Why:** Temporary SDK state is not durable across runtime resets, so an old APK does not indicate that Gradle's SDK dependencies are still present.

**How to apply:** Before a later Android build, verify the configured SDK root and required platform/build-tools directories still exist; re-provision them if needed.

The Android CLI deprecates `sdkmanager`; its `--licenses` wrapper can warn and exit without recording acceptance. The supported `android sdk install` path records the license marker. Google also distributes Android CLI as a standalone binary at `https://dl.google.com/android/cli/latest/linux_x86_64/android`, so SDK provisioning does not require the legacy command-line-tools ZIP.

**Why:** Google's SDK tooling moved package management to `android sdk`, and command-line-tools archive URLs may be stale. Package installation is the reliable way to record the required SDK license.

**How to apply:** Download the official Android CLI to `$HOME/.local/bin/android` and mark it executable. Use `sdk list --all '*36*'` to find remote packages; its package IDs use slash namespaces such as `platforms/android-36` and `build-tools/35.0.0`. Install the exact platform/build-tools Gradle needs, set `JAVA_HOME` explicitly to JDK 21, and confirm packages plus license files under `$SDK_ROOT`. Avoid `yes | ...` under `set -o pipefail`: `yes` can get SIGPIPE after a successful install and make the shell report exit 141.

In September 2026, the Replit system-dependency installer rejected `androidenv.androidPkgs.androidsdk`, but the official Android Studio page linked a revision-specific Linux command-line tools archive with a published SHA-256. The generic `commandlinetools-linux-latest.zip` URL still returned 404.

**Why:** The workspace's system package index may omit the full Android SDK, while Google's versioned command-line tools remain available as a verified fallback.

**How to apply:** Prefer the supported Android CLI when available. Otherwise, get the current revision-specific archive URL and checksum from Google's Android Studio page, verify the checksum, then install the exact platform and build-tools versions Gradle requests. Avoid guessing or pinning generic download URLs.

The APK download route resolves the web artifact's public directory relative to `import.meta.url` and chooses the latest timestamped APK from `public/downloads`. Its filename matcher accepts both the canonical name and the build helper's `-release-debug-signed` suffix.

**Why:** CWD-relative paths and filename filters that lag the build helper can make `/download-apk` return 404 or serve an older installer.

**How to apply:** Keep the route matcher aligned with the APK build helper, then verify `/download-apk` and its `X-APK-Build` header after each fresh build.

Capacitor sync copies public APK downloads into the native app's WebView assets unless Android asset packaging excludes them.

**Why:** Bundling the downloadable APKs inside the app duplicates large binaries and can ship stale installers inside the fresh build.

**How to apply:** Keep APK files in the web artifact's public directory for server downloads, but exclude `*.apk` from Android asset packaging.

A stale `sdk.dir` in Android `local.properties` can still block Gradle after a valid temporary SDK is supplied through environment variables.

**Why:** Gradle reported the missing configured SDK path until that path resolved to the composed SDK, even though the required SDK components were already available.

**How to apply:** Before building, compare `local.properties` with `ANDROID_HOME`/`ANDROID_SDK_ROOT`; make the configured path resolve to the same SDK root without installing or accepting new licenses when the existing SDK license marker is present.

Capacitor's `server.url` overrides the local `webDir` as the WebView's page source. For a release APK that must display the freshly synced bundle, leave `server.url` unset.

**Why:** `cap sync` can copy current JavaScript and CSS into Android assets while the installed app still loads an older remote deployment.

**How to apply:** Remove `server.url` from the release config, sync the fresh web output, and verify the packaged Capacitor config has no remote URL and the APK contains the same entry HTML and referenced JS/CSS as the web build.

In this Replit workspace, Gradle's debug keystore may be under the workspace config directory rather than `$HOME/.android`.

**Why:** Assuming the default home-directory location can falsely suggest the existing signing key is missing; generating a replacement certificate breaks update-install continuity.

**How to apply:** Locate the existing debug keystore without inspecting or exporting its private contents, compare its certificate fingerprint with the installed/downloaded APK, and use it only when a release-format APK must retain that signing identity. Keep this temporary signing step out of committed Gradle configuration.
