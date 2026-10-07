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

Keep player requests limited to the explicitly requested player behavior and the native bridge it needs. Do not modify uploads, compression, feed layouts, or other modules unless the user asks.

**Why:** The user set a strict scope boundary to avoid regressions in unrelated app features.

**How to apply:** Restrict changes to the shared player and necessary Android fullscreen support; verify the changed-file list before finishing.

Fullscreen detail-player gestures reserve the left 40% for brightness, the right 40% for volume, and the center 20% for next/previous swipes. Android brightness is a per-window override that must restore the previous value on fullscreen exit; browsers use a visual overlay.

**Why:** Edge gestures must not accidentally navigate to a different video, and brightness adjustments must not persist after leaving the player.

**How to apply:** Classify the gesture from its starting position, suppress page/player navigation for both side zones, and restore the native window brightness from every fullscreen cleanup path.

Do not call `preventDefault()` on touch start or end for a fullscreen side-zone tap unless the touch actually moved into a gesture. Cancel the browser click only after movement has been established.

**Why:** Preventing the default on a stationary touch can suppress Android WebView's synthesized click, so tapping the surface cannot show or hide player controls.

**How to apply:** Keep stationary edge taps eligible for the viewport click handler. Stop propagation as needed, then prevent default and suppress synthetic clicks only for moved brightness/volume gestures.