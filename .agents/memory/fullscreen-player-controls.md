---
name: Fullscreen player controls
description: Durable constraints for fullscreen video controls, gestures, and lock overlays.
---

Player lock state, volume/brightness/pinch gestures, and their HUDs should remain fullscreen-only. Basic detail-player taps are an exception: a single tap toggles playback, while a same-side double tap seeks 20 seconds backward or forward in inline and fullscreen playback.

**Why:** Detail playback needs the requested basic tap controls without exposing fullscreen adjustment gestures in the inline player.

**How to apply:** Keep tap detection active on the detail player in both modes, but gate lock controls, multi-touch/vertical adjustments, and their HUDs to fullscreen. Keep each conditional control wrapper self-contained and render only the unlock affordance while locked.

Fullscreen state should follow the actual fullscreen element, not viewport dimensions. On Android, await Capacitor's native orientation lock after fullscreen entry; landscape videos must lock to landscape. Always unlock on every exit path.

**Why:** Expanding the HTML container alone does not rotate the Android device; native orientation control is required for landscape video playback.

**How to apply:** Keep standard and webkit fullscreen APIs, await `ScreenOrientation.lock({ orientation: "landscape" })` after entering fullscreen for landscape media, and call `ScreenOrientation.unlock()` on button exit, external fullscreen changes, and route teardown. Browser-only fallbacks may use `screen.orientation`.

On every fullscreen exit path, restore the saved page scroll after unlocking orientation, without pausing the persistent video.

**Why:** Device rotation and fullscreen layout changes can shift the page viewport, while leaving fullscreen is a display change rather than a playback stop.

**How to apply:** Capture `scrollY` when entering, then restore it after fullscreen state and orientation have settled on button exit, external exit, or route exit. Do not pause the video as part of fullscreen teardown.