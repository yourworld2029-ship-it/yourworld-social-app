---
name: Long-video upload limits
description: Verified 2 GB Long Video storage cap, optional compression fallback, and separate Reels limits.
---

The Long Video route accepts source files up to 2,000,000,000 bytes, below the verified `videos` bucket limit of 2,097,152,000 bytes. Compression is optional: when it is unavailable, fails, or produces no smaller valid file, keep the original eligible for upload. A pending large-file compression may still be awaited when the user submits; its failure must resolve to the original rather than block the upload. Keep the existing persistent, sequential 3 MiB TUS chunks, local selected-file preview, and Long-Video-only byte reporting. Apply the Long Video mode explicitly in the native optimizer; the non-Long-Video flow retains its prior output cap. The `reels` bucket and API cap remain 524,288,000 bytes.

**Why:** The live `videos` bucket is configured for 2,097,152,000 bytes, but stale client, native, and API caps had prevented uploads above 500 MB or 300 MB. Supabase's global Storage limit can still override a bucket-level limit, so bucket rows alone do not prove the global setting.

**How to apply:** Keep Long Video limits aligned across its picker, native optimizer, uploader, and server processing. If diagnosing a size rejection, verify both the bucket limit and Supabase's global Storage limit. Keep Reels on its separate 512 MiB cap and never replace the sequential resumable TUS transport with parallel chunks.