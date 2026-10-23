---
name: Long-video upload limits
description: Verified 2 GB Long Video storage cap, optional compression fallback, and separate Reels limits.
---

The Long Video route accepts source files up to 2,000,000,000 bytes, below the verified `videos` bucket limit of 2,097,152,000 bytes. Compression is optional: when it is unavailable, fails, or produces no smaller valid file, keep the original eligible for upload. A pending large-file compression may still be awaited when the user submits; its failure must resolve to the original rather than block the upload. Keep the existing persistent, sequential 3 MiB TUS chunks, local selected-file preview, and Long-Video-only byte reporting. Apply the Long Video mode explicitly in the native optimizer; the non-Long-Video flow retains its prior output cap. The `reels` bucket and API cap remain 524,288,000 bytes.

**Why:** The live `videos` bucket is configured for 2,097,152,000 bytes, but stale client, native, and API caps had prevented uploads above 500 MB or 300 MB. Supabase's global Storage limit can still override a bucket-level limit, so bucket rows alone do not prove the global setting.

**How to apply:** Keep Long Video limits aligned across its picker, native optimizer, uploader, and server processing. If diagnosing a size rejection, verify both the bucket limit and Supabase's global Storage limit. Keep Reels on its separate 512 MiB cap and never replace the sequential resumable TUS transport with parallel chunks.

Before creating an upload task, preflight the selected file against its destination bucket's actual limit. A file known to exceed that cap must be rejected before any bytes transfer, rather than uploaded and rejected by the later processing endpoint; preserve resumable retry for transient network failures.

**Why:** the user asked that known upload problems be caught before starting, and that a transfer not reach late-stage processing only to fail on a known size cap.

**How to apply:** Validate Reel files against the 512 MiB `reels` limit and Long Videos against the 2 GB `videos` limit at selection and again at the shared upload boundary. Keep the caps distinct.

The installed Android client sends playback-preparation requests to the hosted API configured by `VITE_APP_URL`. Building a newer APK does not update the production API's transcode limits; a client-side transfer can finish and still fail when the older server processes the stored object.

**Why:** A production 413 from `/api/media/transcode` persisted after an APK-only update because the production API revision predated the workspace's 2 GB Long Video processing code.

**How to apply:** For persistent size-limit errors, confirm the actual storage bucket and inspect the currently deployed API revision as well as Supabase bucket limits. Publish validated API changes before treating an APK build as the fix. Keep the `videos` cap at 2 GB and align the separate `reels` cap to its configured 500 MiB bucket limit.