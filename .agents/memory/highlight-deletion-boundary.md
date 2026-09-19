---
name: Highlight deletion boundary
description: The YourWorld Highlights record stores its items in one JSONB row, so deletion must be owner-scoped and verified at the server boundary.
---

Highlights are stored as one row in `public.highlights`; the current live schema has no `highlight_items` or junction table, but the hard-delete RPC conditionally cleans up those legacy mappings when present. Destructive deletion should run through the authenticated server-function boundary, derive the caller from the bearer token, include the owner in the database predicate, use the server-only client for the final mutation, and verify the row is absent before reporting success.

**Why:** A client-side mutation can appear successful while the row remains or while a response representation is ambiguous; a later profile load then restores the bubble. Relying on a deployed RLS policy alone can also hide a stale-policy failure from the user-scoped client, and legacy child mappings can block a parent delete through foreign keys.

**How to apply:** Keep source-media rows untouched. Authenticate first, verify ownership, call the server-only hard-delete RPC so child mappings and the parent are removed in one transaction, log the affected-row result, return an explicit failure when the owner check, delete, or post-delete verification fails, and only then patch the local/query Highlight list. Do not immediately refetch through a stale cache path after success; that can restore the deleted bubble or report a false failure.