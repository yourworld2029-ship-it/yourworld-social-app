---
name: YourWorld Debug APK delivery
description: The user wants a fresh Debug APK link with every YourWorld code update.
---

Har YourWorld code update ke baad fresh Debug APK ka direct link dena. Release build ya release signing secrets use nahi karne.

**Why:** the user explicitly asked.

**How to apply:** Before each shared Debug APK, increment Android `versionCode` and `versionName`, build with `clean assembleDebug --no-build-cache`, stage the APK at the direct-download paths, verify its version and downloaded bytes, and include the link.

Debug APKs for visible app updates should have a higher versionCode than the installed build; same-version rebuilds made it unclear whether the refreshed UI was installed.

**Why:** the user reported seeing the old Notifications screen after a rebuilt APK still used version 1.0.176.

**How to apply:** Check the current Android version metadata before building; increment both values for each shared APK so Android and the user can distinguish the update.

A rollback can restore Gradle metadata to a lower version than the APKs already staged for download.

**Why:** A fresh build must still be installable over the most recently distributed APK after a code rollback.

**How to apply:** Before choosing the next version, compare Gradle metadata with the highest staged APK version and increment above both.
