---
name: Supabase media upload transport
description: Choose direct Storage or TUS based on file size while keeping upload progress tied to server acknowledgements.
---

Use standard Supabase Storage `.upload(path, file, options)` for small media. For large browser uploads, use sequential TUS chunks with persistent URL storage: 3 MiB normally and 1 MiB on weak links or after the first transient upload failure. Keep resumable URLs/fingerprints and retry transient network failures with capped backoff until success or user cancellation; preserve the existing size thresholds except where weak-link uploads need TUS above one chunk. Do not simulate concurrent writes to one TUS URL or promise parallel S3 multipart chunks; browser publishable credentials do not provide the required configuration. Keep completion tied to a successful server response and preserve errors in logs and UI.

**Why:** Sequential TUS plus persistent upload URLs preserves server-offset resume without claiming unsupported parallelism. Smaller chunks reduce the amount retransmitted on weak links while retaining the established 3 MiB path for normal connections.

**How to apply:** Keep the size-based transport choice in the shared upload helper, select chunk size from current connection estimates and retry with the same fingerprint after transient failures. Resume a stored upload URL rather than creating a new one after interruption. Preserve caller-generated paths because storage ownership rules and post metadata depend on them; only use parallel S3 multipart if a separately authorized server-side credential/configuration path is added.

Cloudflare Stream TUS has separate hard limits: chunks must be at least 5 MiB, no more than 200 MiB, and divisible by 256 KiB. Clamp Cloudflare chunks to those limits even when weak-network detection selects 1 MiB for Supabase Storage.

**Why:** Cloudflare rejects sub-5-MiB chunks; applying the Supabase weak-link setting to Stream can make large-video uploads fail.

**How to apply:** Keep 1 MiB micro-chunks on Supabase Storage only. Before creating a Cloudflare Stream TUS upload, round the requested chunk size to a 256-KiB multiple and clamp it to 5–200 MiB.

On Android, the foreground upload service provides an ongoing notification and partial wake lock; the actual TUS transfer still runs in the WebView JavaScript task. Android 13+ requires notification permission for progress to appear in the notification drawer. Normal home/backgrounding and screen lock are supported while the app process remains alive, but a notification alone cannot guarantee continuation after force-stop or process death.

**Why:** A foreground notification alone does not move the upload bytes or resumable state out of the WebView. Claiming process-death recovery without a persisted file/credential handoff and native resumable worker would be misleading.

**How to apply:** Request notification permission before starting Android media uploads, keep the foreground service active during backgrounding, and describe its process-death boundary accurately. If uploads must survive process death, first design a secure durable handoff that lets a native worker resume the same TUS URL and then reconcile the final post metadata.

Treat TUS `409` offset conflicts and `423` locks as resumable transient failures. After the client’s short same-offset retries are exhausted, reopen the persisted upload session so a fresh HEAD request reconciles against the server’s committed offset before sending more bytes.

**Why:** A network drop can happen after Storage commits a chunk but before the client receives its acknowledgement; replaying that chunk gets `409`, which is not a permanent file-size failure.

**How to apply:** Keep 409/423 eligible for the shared retry path, preserve the matching fingerprint and upload URL, and add regression tests so a resumable conflict does not become a terminal upload failure.