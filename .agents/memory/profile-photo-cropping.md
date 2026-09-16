---
name: Profile photo cropping
description: How profile-photo framing persists without adding profile schema fields
---

Profile-photo zoom and position should be baked into a square avatar file before upload; the existing avatar URL remains the only persisted profile-photo value.

**Why:** Profile records currently persist the avatar path but must not gain crop metadata for this feature, and a processed square image renders consistently across all circular avatar surfaces.

**How to apply:** Keep crop controls client-side, export the selected framing to an image file, upload that file through the existing avatar path, and use `object-fit: cover` plus circular clipping for display.