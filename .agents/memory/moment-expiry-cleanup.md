---
name: Moment expiry cleanup
description: The project’s Moment expiry path must remove both database rows and Supabase Storage objects.
---

Expired Moments require a storage-aware privileged Edge Function, not only a database delete. Schedule that function with `pg_cron`/`pg_net` when the Supabase project supports those extensions, and keep an authenticated app-load invocation as a safety net. Client Moment queries must use a strict `expires_at > now()` predicate without an owner bypass.

**Why:** Deleting only the row leaves uploaded media consuming bucket storage, while owner-specific query exceptions can keep expired Moments visible.

**How to apply:** When changing Moment expiry, update the Edge Function, schedule, storage path extraction, child-row cleanup, and every frontend query together; verify both expired row count and the function’s deleted media count.