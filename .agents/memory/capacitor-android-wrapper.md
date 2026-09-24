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

Express routes that serve the packaged APK should resolve its path from `import.meta.url`, not `process.cwd()`, because workflow and deployment working directories can differ.

**Why:** A cwd-relative route returned 404 in the running API workflow even though the APK existed in the web artifact.

**How to apply:** Use the compiled server module directory to resolve `../../yourworld/public/yourworld-debug.apk`, then verify both the API port and the root proxy.