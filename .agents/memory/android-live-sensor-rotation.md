---
name: Android Live sensor rotation
description: Native Android orientation handling for Live while the video player also controls orientation.
---

`ScreenOrientation.unlock()` sets `SCREEN_ORIENTATION_UNSPECIFIED`; it does not force rotation when the device's user rotation lock is enabled. Live needs Android `SCREEN_ORIENTATION_FULL_SENSOR` through a native bridge. Coordinate all video-player orientation requests with the Live mode so a pending player lock cannot overwrite it. Save the Activity's requested orientation once and restore that value when leaving Live.

**Why:** Releasing the orientation lock alone did not rotate the user's phone; Android still followed the device's user rotation preference.

**How to apply:** Scope `FULL_SENSOR` to the active Android Live route, serialize it with video-player orientation changes, and restore the previous orientation on exit. Do not change global rotation policy.
