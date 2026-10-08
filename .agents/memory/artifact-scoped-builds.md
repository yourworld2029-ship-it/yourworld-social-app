---
name: Artifact-scoped builds
description: Build and verify only the relevant package first when a change is isolated to one artifact in the workspace.
---

For a change isolated to one artifact, run that package’s typecheck and production build first. Treat a failure in an unrelated package’s toolchain as a separate workspace issue rather than expanding the scope of the feature change.

**Why:** Workspace-wide scripts can execute unrelated artifacts, so an independent dependency problem can block validation of a correct, isolated app change.

**How to apply:** Use the target package scripts for the primary verification; run workspace-wide checks when changes affect shared code or dependencies, or when specifically requested.
