---
name: Moment expiry cleanup
description: The project’s Moment expiry path must remove both database rows and Supabase Storage objects.
---

Expired Moments require a storage-aware privileged Edge Function, not only a database delete. Schedule that function with `pg_cron`/`pg_net` when the Supabase project supports those extensions, and keep an authenticated app-load invocation as a safety net. Public/active Moment queries must use a strict `expires_at > now()` predicate; any owner-only expired-row query is only for archive recovery and must never surface the row in the active feed. Keep selectable Moment durations aligned with the database check constraint. Poll votes need a server-authoritative, unique per-user record and atomic count update.

**Why:** Deleting only the row leaves uploaded media consuming bucket storage, while owner-specific query exceptions can keep expired Moments visible. UI duration choices can also be rejected by a narrower database constraint, and client-only poll counts permit duplicate or lost votes.

**How to apply:** When changing Moment expiry, update the Edge Function, schedule, storage path extraction, child-row cleanup, and every frontend query together; verify both expired row count and the function’s deleted media count. When adding a duration, update its database check in the same migration. Persist poll votes with a unique `(moment, user)` key and increment totals in the same server transaction.