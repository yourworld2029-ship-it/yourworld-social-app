---
name: Direct Supabase media uploads
description: Project decision to use standard Storage requests for the background media queue instead of resumable/chunked transport.
---

Use the standard Supabase Storage `.upload(path, file, options)` request for app media uploads. Do not reintroduce resumable or chunked transport unless the user explicitly changes this choice. Keep progress at upload-start while the request is pending, report completion only after Supabase responds, and preserve the exact storage/network error in logs and UI.

**Why:** The previous background upload path stalled at 44%; the user explicitly requested a direct request and response-based completion.

**How to apply:** Keep this behavior in the shared upload helper so every app media source uses it. Preserve caller-generated paths because storage ownership rules and post metadata depend on them.