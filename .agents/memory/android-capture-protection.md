---
name: Android capture protection
description: Keep Android screenshot blocking conditional to a user toggle inside chat.
---

Keep `FLAG_SECURE` off globally. Social and Orbit chat routes may set it only while that chat's “Protect Chat (Block Screenshots & Recording)” toggle is on. Clear it when the toggle turns off, when the chat identity changes, and on route unmount. Do not set the flag from `MainActivity` or non-chat routes. This is a native window-level block; separate incoming capture-alert broadcasts may remain.

**Why:** The latest user request explicitly supersedes the earlier no-blocking preference and requires user-controlled protection limited to the active chat.

**How to apply:** Tie flag changes to the per-chat toggle and guarantee a `false` call in cleanup. Do not change feed, Reels, profile, or call capture behavior; preserve app-wide incoming-call discovery and user-initiated per-call setup.