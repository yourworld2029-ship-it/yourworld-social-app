---
name: Reels change boundary
description: Scope boundary for changes to the YourWorld Reels player.
---

For requests scoped to Reels, change only the explicitly requested Reels-player behavior. Preserve existing Reels features and settings, and avoid changes to Feed, Video Detail, global settings, or native status-bar configuration unless asked.

**Why:** The user set a strict Reels-only boundary to avoid regressions outside the requested player changes.

**How to apply:** Keep related UI and behavior changes within the Reels route and verify adjacent routes and settings remain untouched.