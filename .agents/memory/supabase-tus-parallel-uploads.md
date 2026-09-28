---
name: Supabase TUS parallel uploads
description: Supabase Storage chunk sizing and safe concurrency rules for resumable uploads.
---

Use 6 MiB TUS PATCH requests for Supabase Storage uploads. Per-object parallel uploads require the TUS concatenation extension; do not send simultaneous PATCHes to one upload URL or upload separate objects to the same destination path as a substitute. Detect the server extension before enabling parallel parts and keep a single-stream resumable fallback. Prefer the direct Supabase Storage hostname for large-file uploads.

**Why:** Supabase's current resumable-upload guidance specifies 6 MiB chunks and documents conflicts when clients race on one upload URL or destination path; it does not guarantee TUS concatenation support.

**How to apply:** Negotiate the `Tus-Extension` response before using `tus-js-client` parallel uploads. Keep native custom TUS uploaders single-stream until they implement verified concatenation semantics as well.