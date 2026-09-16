---
name: Picture-in-picture continuity
description: Durable behavior for the long-video player's dedicated native PIP action.
---

The dedicated PIP action should use the existing video element, start playback only when needed for the user-initiated PIP request, and never manually seek on enter or leave. Do not explicitly exit PIP from component cleanup.

**Why:** Native PIP already preserves the media element's playback position. Seeking on lifecycle events can cause visible jumps, and cleanup-triggered exit closes the floating player during same-tab navigation.

**How to apply:** Keep the native browser PIP surface unavailable through custom controls, expose PIP only as a dedicated action, and let the browser own continuity while the route or app changes.