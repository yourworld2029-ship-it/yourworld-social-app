---
name: Cross-artifact public downloads
description: Resolve workspace-root public files correctly when serving them from the API artifact.
---

When the API server serves a file staged under the workspace-root `public/` directory, do not assume `path.resolve("public/...")` points there. The API process runs from its artifact directory, so that expression resolves inside `artifacts/api-server`.

APK endpoints can use different sources: `/app.apk` serves `artifacts/yourworld/public/app.apk`, while `/get-my-apk` resolves `public/YourWorld-App.apk` from the workspace root. Updating one copy does not update the other.

**Why:** A cwd-relative path returned 404 even though the APK existed at the workspace root; a successful `/app.apk` response also served an older artifact-local copy until both requested destinations matched.

**How to apply:** Resolve cross-artifact files from a stable known path. When refreshing an APK, stage it at the source used by the requested route and verify the proxied response bytes.