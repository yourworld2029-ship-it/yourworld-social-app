---
name: Supabase media upload transport
description: Choose direct Storage or TUS based on file size while keeping upload progress tied to server acknowledgements.
---

Use standard Supabase Storage `.upload(path, file, options)` for small media. For large browser uploads, use sequential 3 MiB TUS chunks with persistent URL storage and the configured transient retry schedule; preserve the existing size threshold that selects TUS. Do not simulate concurrent writes to one TUS upload URL or promise parallel S3 multipart chunks; browser publishable credentials do not provide the app with the required configuration. Keep completion tied to a successful server response and preserve storage/network errors in logs and UI.

**Why:** The user reported mobile PATCH socket drops with larger chunks and explicitly requested 3 MiB chunks. Sequential TUS plus persistent upload URLs preserves server-offset resume without claiming unsupported parallelism.

**How to apply:** Keep the size-based transport choice in the shared upload helper and keep path-scoped fingerprints that include filename, size, and last-modified time. Resume a stored upload URL rather than creating a new one after interruption. Preserve caller-generated paths because storage ownership rules and post metadata depend on them; only use parallel S3 multipart if a separately authorized server-side credential/configuration path is added.