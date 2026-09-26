---
name: Fullscreen player controls
description: Durable constraints for fullscreen video controls, gestures, and lock overlays.
---

Player lock state, gesture handling, and gesture HUDs should be explicitly gated by fullscreen. Exiting fullscreen must clear lock, transient zoom state, and any screen-orientation lock so inline playback remains interactive.

**Why:** Inline feed playback must not expose or inherit fullscreen-only controls, and conditional player markup is easy to break when several adjacent controls share similar JSX.

**How to apply:** Keep each conditional control wrapper self-contained, render only the unlock affordance while locked, and place brightness/volume HUDs in a fullscreen-only pointer-events-none overlay above the control layer.

Fullscreen state should follow the actual fullscreen element, not viewport dimensions. On Android, await Capacitor's native orientation lock after fullscreen entry; landscape videos must lock to landscape. Always unlock on every exit path.

**Why:** Expanding the HTML container alone does not rotate the Android device; native orientation control is required for landscape video playback.

**How to apply:** Keep standard and webkit fullscreen APIs, await `ScreenOrientation.lock({ orientation: "landscape" })` after entering fullscreen for landscape media, and call `ScreenOrientation.unlock()` on button exit, external fullscreen changes, and route teardown. Browser-only fallbacks may use `screen.orientation`.

On every fullscreen exit path, restore the saved page scroll after unlocking orientation, without pausing the persistent video.

**Why:** Device rotation and fullscreen layout changes can shift the page viewport, while leaving fullscreen is a display change rather than a playback stop.

**How to apply:** Capture `scrollY` when entering, then restore it after fullscreen state and orientation have settled on button exit, external exit, or route exit. Do not pause the video as part of fullscreen teardown.