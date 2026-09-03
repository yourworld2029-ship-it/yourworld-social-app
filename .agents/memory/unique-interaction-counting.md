---
name: Unique interaction counting
description: Durable rules for view uniqueness, counter mutation, and compatibility behavior across YourWorld content surfaces.
---

Use a composite database key of user, content, and content type for authenticated views. Increment the content counter only after that key is inserted, inside one atomic server-side operation. Treat a duplicate as a successful no-op, not as another count.

**Why:** Reels, long videos, feed posts, and Moments historically used separate view tables, which allowed duplicate counting and made client-side optimistic increments disagree with the database.

**How to apply:** Keep legacy table writes as a narrowly scoped fallback only when the new RPC/table is genuinely missing. Viewer-list queries may expose unique Moment rows to the Moment owner, while ordinary viewers should only see their own rows.