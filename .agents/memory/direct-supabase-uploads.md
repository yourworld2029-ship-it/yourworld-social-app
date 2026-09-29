---
name: Supabase media upload transport
description: Choose direct Storage or TUS based on file size while keeping upload progress tied to server acknowledgements.
---

Use standard Supabase Storage `.upload(path, file, options)` for small media. For large browser uploads, use Supabase TUS with its documented sequential 6 MiB chunks and retry/resume behavior. Do not simulate concurrent writes to one TUS upload URL or promise parallel 2–5 MiB chunks; browser publishable credentials do not provide the app with the S3 multipart configuration needed for that path. Keep completion tied to a successful server response and preserve storage/network errors in logs and UI.

**Why:** The user later requested more resilient large uploads. Supabase’s documented browser TUS path is resumable but sequential, so it safely improves large-upload recovery without claiming unsupported parallelism.

**How to apply:** Keep the size-based transport choice in the shared upload helper. Preserve caller-generated paths because storage ownership rules and post metadata depend on them; only use parallel S3 multipart if a separately authorized server-side credential/configuration path is added.