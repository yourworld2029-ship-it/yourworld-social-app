---
name: Highlight deletion boundary
description: The YourWorld Highlights record stores its items in one JSONB row, so deletion must be owner-scoped and verified at the server boundary.
---

Highlights are stored as one row in `public.highlights`; the live schema has no `highlight_items` or junction table to clean up. Destructive deletion should run through the authenticated server-function boundary, derive the caller from the bearer token, include the owner in the database predicate, and verify the row is absent before reporting success.

**Why:** A client-side mutation can appear successful while the row remains or while a response representation is ambiguous; a later profile load then restores the bubble.

**How to apply:** Keep source-media rows untouched. Return an explicit failure when the owner check, delete, or post-delete verification fails, and only then update/invalidate the profile Highlights state.