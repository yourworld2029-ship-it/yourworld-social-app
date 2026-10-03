---
name: Video source retention
description: Preserve the original Supabase MP4 source path through HLS publishing, authorized offline downloads, and deletion.
---

Never publish an HLS video post unless its owner-scoped Supabase MP4 path is persisted with the post. If the live schema cannot store that path, stop the post write rather than retrying without it.

**Why:** `posts.video_url` may be absent from the live schema, and compatibility retries that silently remove it can create an HLS-only post whose original source cannot be downloaded or cleaned up through the normal owner flow.

**How to apply:** Keep publish writes fail-closed for the source-path column. Authorize offline-source requests against the post owner and download policy, validate that storage paths remain in the owner's folder, and preserve legacy MP4 references when resolving or deleting media.