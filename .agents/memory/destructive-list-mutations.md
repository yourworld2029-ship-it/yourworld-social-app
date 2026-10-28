---
name: Destructive list mutations
description: Keeping deleted records from reappearing after successful client-side mutations.
---

After a destructive mutation is confirmed by the server, update the local collection directly and avoid an immediate uncoordinated refresh that can reintroduce a stale copy.

For file-backed posts, delete the owner-scoped database row first and treat storage cleanup as best-effort afterward. Never remove the media first: row-level security can return zero deleted rows without a SQL error, leaving a visible post whose file has already disappeared.

**Why:** A fetch started before or near the delete can resolve afterward with the old row still present, visually resurrecting the item even though the database deletion succeeded. Reversing storage and database order can also leave broken public cards when RLS blocks the row delete.

**How to apply:** After the database confirms a deleted row, announce its ID and remove it from local state and relevant query caches immediately. Then clean up owner-scoped storage objects best-effort. If a refresh is required, coordinate it with mutation generations or reconcile its result so older data cannot overwrite the confirmed deletion.