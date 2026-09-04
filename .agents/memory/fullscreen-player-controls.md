---
name: Fullscreen player controls
description: Durable constraints for fullscreen video controls, gestures, and lock overlays.
---

Player lock state, gesture handling, and gesture HUDs should be explicitly gated by fullscreen. Exiting fullscreen must clear lock and transient zoom state so inline playback remains interactive.

**Why:** Inline feed playback must not expose or inherit fullscreen-only controls, and conditional player markup is easy to break when several adjacent controls share similar JSX.

**How to apply:** Keep each conditional control wrapper self-contained, render only the unlock affordance while locked, and place brightness/volume HUDs in a fullscreen-only pointer-events-none overlay above the control layer.