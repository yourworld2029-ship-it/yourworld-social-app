---
name: Supabase media upload transport
description: Choose direct Storage or TUS based on file size while keeping upload progress tied to server acknowledgements.
---

Use standard Supabase Storage `.upload(path, file, options)` for small media. For large browser uploads, use sequential TUS chunks with persistent URL storage: 3 MiB normally and 1 MiB on weak links or after the first transient upload failure. Keep resumable URLs/fingerprints and retry transient network failures with capped backoff until success or user cancellation; preserve the existing size thresholds except where weak-link uploads need TUS above one chunk. Do not simulate concurrent writes to one TUS URL or promise parallel S3 multipart chunks; browser publishable credentials do not provide the required configuration. Keep completion tied to a successful server response and preserve errors in logs and UI.

**Why:** Sequential TUS plus persistent upload URLs preserves server-offset resume without claiming unsupported parallelism. Smaller chunks reduce the amount retransmitted on weak links while retaining the established 3 MiB path for normal connections.

**How to apply:** Keep the size-based transport choice in the shared upload helper, select chunk size from current connection estimates and retry with the same fingerprint after transient failures. Resume a stored upload URL rather than creating a new one after interruption. Preserve caller-generated paths because storage ownership rules and post metadata depend on them; only use parallel S3 multipart if a separately authorized server-side credential/configuration path is added.

On Android, the foreground upload service currently provides the ongoing notification and a partial wake lock; the actual TUS transfer still runs in the WebView JavaScript task. This supports normal app backgrounding while that process/task remains alive, but it is not a native transfer worker and cannot guarantee continuation after force-stop or process death.

**Why:** A foreground notification alone does not move the upload bytes or resumable state out of the WebView. Claiming process-death recovery without a persisted file/credential handoff and native resumable worker would be misleading.

**How to apply:** Preserve the foreground service for backgrounded transfers, and describe its boundary accurately. If uploads must survive process death, first design a secure durable handoff that lets a native worker resume the same TUS URL and then reconcile the final post metadata.