---
name: Supabase project identity
description: Prevents accidental changes to an unrelated Supabase project when connected management accounts and runtime secrets disagree.
---

Use the Supabase project referenced by the app's Replit Secrets as the authoritative production project. Never repoint the app or apply management changes merely because a connected Supabase account exposes a different project.

**Why:** A Supabase management connection can authenticate successfully while listing a project that is not the project currently serving the app's users and data. Treating connection success as project identity risks disconnecting the app from existing data.

**How to apply:** Compare project identity before any provider, Auth, schema, or configuration write. If the connected management project does not match the runtime project, make no remote changes and require access to the matching project.