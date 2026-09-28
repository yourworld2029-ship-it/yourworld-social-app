---
name: Persistent video player
description: Navigation-safe video playback uses one root-owned media element with route slots and a mini-player fallback.
---

The video element must remain mounted at the application shell level; Video Detail routes provide a visual slot and register metadata/time handlers, while navigation only changes the player’s presentation mode.

**Why:** Route-owned video elements unmount on Back or section changes, which resets playback and can create duplicate audio when a second player is introduced.

**How to apply:** Keep the active media source and currentTime on the persistent player, switch to an in-app mini-player outside the active detail route, and let native Picture-in-Picture remain optional without adding a second player control.

The feed autoplay provider is a separate owner that can activate at most one feed source, and it must be disabled while the root detail player has an active video.

**Why:** Feed autoplay must not compete with detail playback or create two audible streams.

**How to apply:** Preserve the route-level disabled gate whenever changing either the shared player or feed autoplay lifecycle.