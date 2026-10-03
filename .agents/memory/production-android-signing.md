---
name: Production Android signing continuity
description: Preserve the established YourWorld Android release certificate across APK builds and updates.
---

Build and deliver production APKs only with the user's existing production signing identity. Never generate or rotate a key, and never treat an unsigned or debug-signed APK as a production release.

**Why:** Android updates must be signed with the same certificate as existing installations; a different signing identity can prevent users from updating.

**How to apply:** If the existing signing material is unavailable, build debug variants only for internal verification, do not stage them as public downloads, and request the existing signing material through Replit Secrets before producing a release APK.