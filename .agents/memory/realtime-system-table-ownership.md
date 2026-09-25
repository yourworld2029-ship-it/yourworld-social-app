---
name: Managed Realtime table ownership
description: Supabase-managed Realtime table and publication ownership constraints for the current YourWorld project.
---

Treat `realtime.messages` and the `supabase_realtime` publication as provider-managed. The project's migration connection cannot own or alter them, even when table RLS is already enabled. Public live rooms can use Supabase's default public broadcast/presence topics without modifying these system objects.

**Why:** An attempted live-room migration failed on ownership of `realtime.messages`; the corrected migration succeeded after removing system-table and publication changes.

**How to apply:** Keep app-owned live metadata, comments, and watch sessions in `public` tables with explicit RLS. Do not add DDL or publication operations for managed Realtime objects unless an owner-level connection is deliberately made available.