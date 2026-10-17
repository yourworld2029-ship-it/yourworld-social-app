---
name: Viewed Moment rings
description: Keep Home Moment rings in sync as soon as a viewer opens a Moment.
---

When a viewer opens any Moment segment, immediately add that user to the Moment's local viewer state and still run the existing unique-view persistence. The author's Home ring should become muted once any of their Moments is viewed.

**Why:** The unique-view call can return false for an already-counted view; returning before the local patch left the Home ring bright even after opening the Moment.

**How to apply:** Make local view updates idempotently before awaiting persistence. Derive seen-ring state across all Moment segments for each author; do not add schema or separate tracking.
