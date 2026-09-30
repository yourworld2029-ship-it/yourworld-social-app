---
name: Fullscreen player controls
description: Durable constraints for fullscreen video controls, gestures, and lock overlays.
---

Player lock state, volume/brightness/pinch gestures, and their HUDs should remain fullscreen-only. Detail-player clicks must toggle immediately through one viewport handler; do not debounce the first click to detect a double tap. A same-side second click may seek 20 seconds without delaying the first toggle. Touch-end is for gestures, not playback toggles.

**Why:** Delayed single-tap handling and a separate touch-end toggle can make Android playback feel unresponsive or toggle twice.

**How to apply:** Route clicks once at the viewport, exclude interactive controls, and suppress the synthetic click only after a moved gesture. Keep lock controls, multi-touch/vertical adjustments, and their HUDs fullscreen-only. Keep each conditional control wrapper self-contained and render only the unlock affordance while locked.

Fullscreen state should follow the actual fullscreen element, not viewport dimensions. On Android, await Capacitor's native orientation lock after fullscreen entry; landscape videos must lock to landscape. Always unlock on every exit path.

**Why:** Expanding the HTML container alone does not rotate the Android device; native orientation control is required for landscape video playback.

**How to apply:** Keep standard and webkit fullscreen APIs, await `ScreenOrientation.lock({ orientation: "landscape" })` after entering fullscreen for landscape media, and call `ScreenOrientation.unlock()` on button exit, external fullscreen changes, and route teardown. Browser-only fallbacks may use `screen.orientation`.

On every fullscreen exit path, restore the saved page scroll after unlocking orientation, without pausing the persistent video.

**Why:** Device rotation and fullscreen layout changes can shift the page viewport, while leaving fullscreen is a display change rather than a playback stop.

**How to apply:** Capture `scrollY` when entering, then restore it after fullscreen state and orientation have settled on button exit, external exit, or route exit. Do not pause the video as part of fullscreen teardown.

On the video detail route, keep the 16:9 player in the page layout above a dedicated scrollable content area with a 24px top gap. Route viewport clicks and fullscreen gestures through the parent and a transparent accessible hit target above the video and below visible controls, rather than depending on native video hit-testing.

**Why:** A fixed overlay and a separate spacer can drift out of alignment and cover the title as content scrolls; on Android, the native video surface can also swallow touch and click events.

**How to apply:** Use a viewport-height column on detail routes, keep the player as a sticky block, and scroll the content below it independently. Do not render the spacer while the detail player is active. Keep the hit target beneath custom controls and overlays, with `pointer-events: none` on decorative loading feedback.