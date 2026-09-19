---
name: Account deletion pipeline
description: The safe boundary and ordering for deleting a YourWorld account and its related data.
---

Account deletion must run through an authenticated server function that invokes one transactional `SECURITY DEFINER` Supabase function. The function resolves `auth.uid()`, deletes dependent public rows in dependency order, removes the profile, and deletes the matching `auth.users` row last.

**Why:** The app has many social, chat, moderation, and verification tables, while the API server is only a health router. Client-side multi-request deletion would be non-atomic and could leave an account partially deleted or fail on foreign keys.

**How to apply:** Inspect the live schema before adding cleanup statements; keep the RPC permissioned only to `authenticated`, call it through the bearer-authenticated server-function layer, then clear the browser session and query cache locally after success.