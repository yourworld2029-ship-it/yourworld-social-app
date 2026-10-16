---
name: YourWorld Debug APK delivery
description: The user wants a fresh Debug APK link with every YourWorld code update.
---

Har YourWorld code update ke baad fresh Debug APK ka direct link dena. Release build ya release signing secrets use nahi karne.

**Why:** the user explicitly asked.

**How to apply:** After implementing a YourWorld code change, build with `clean assembleDebug --no-build-cache`, stage the APK at the direct-download paths, verify the download, and include the link in the response.
