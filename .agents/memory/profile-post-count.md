---
name: Profile post count
description: YourWorld profile Posts count behavior for Videos, Reels, and deletion.
---

The profile Posts number should match its active displayed Videos and Reels, not an unbounded table-wide count that can include rows the profile list does not currently present. Exclude Moments and rows removed from the profile through local deletion or realtime delete events.

**Why:** The user's profile can show a limited active media list while raw database queries return additional rows; showing the raw total produced a count that contradicted the visible 8 Videos + 4 Reels.

**How to apply:** Derive the number from the same filtered Video/Reel arrays used by the profile grid, deduplicate by post ID, and ensure the count recalculates as soon as rows are deleted or additional profile media is loaded.
