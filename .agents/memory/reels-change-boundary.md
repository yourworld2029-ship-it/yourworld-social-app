---
name: Reels change boundary
description: Scope boundary for changes to the YourWorld Reels player.
---

For requests scoped to Reels, change only the explicitly requested Reels-player behavior. Preserve existing Reels features and settings, and avoid changes to Feed, Video Detail, global settings, or native status-bar configuration unless asked.

**Why:** The user set a strict Reels-only boundary to avoid regressions outside the requested player changes.

**How to apply:** Keep related UI and behavior changes within the Reels route and verify adjacent routes and settings remain untouched.

Reposts use a new owner-scoped row in the existing `posts` model, with stable identity per reposter/source pair, visible creator attribution, and no copied source-owner stream identifiers or private media metadata. Only public, free Reels qualify.

**Why:** Existing Reels and profile loaders read from `posts`; using that contract makes reposts visible without a separate relationship table while keeping access and ownership boundaries intact.

**How to apply:** Preserve public/free eligibility, attribution, and duplicate-tap idempotency when changing repost behavior. Treat the media URL as a shared reference, not transferred ownership of the source asset.