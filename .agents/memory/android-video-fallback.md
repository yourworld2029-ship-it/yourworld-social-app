---
name: Native large-video fallback
description: Safe direct-upload recovery when Android video encoding fails on multi-gigabyte sources.
---

After native Media3 compression fails, do not fetch the original `content://` URI into a JavaScript Blob. Let the user select the original again through the browser video input, then use the existing chunked TUS uploader and mark that exact `File` as ready so browser-side re-encoding is skipped.

**Why:** Copying a 1–2 GB source through the Capacitor bridge or materializing it as a JavaScript Blob can exhaust memory on low-end Android phones. Reusing the browser `File` keeps upload reads chunked.

**How to apply:** Treat optimizer errors as recoverable, clearly explain the reselect action without surfacing a compression error, and preserve the original file object through upload. Avoid adding a parallel native TUS client unless the chunk bridge is deliberately designed and reviewed.