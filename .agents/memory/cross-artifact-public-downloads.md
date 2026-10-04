---
name: Cross-artifact public downloads
description: Resolve workspace-root public files correctly when serving them from the API artifact.
---

When the API server serves a file staged under the workspace-root `public/` directory, do not assume `path.resolve("public/...")` points there. The API process runs from its artifact directory, so that expression resolves inside `artifacts/api-server`.

**Why:** A cwd-relative path returned 404 even though the APK existed at the workspace root.

**How to apply:** Resolve cross-artifact files from a stable known artifact path, and verify the download through the shared proxy using the actual API workflow.