---
name: Imported app dependencies
description: Dependency and typecheck considerations when bringing an external app into the pnpm artifact workspace.
---

Imported applications should keep their own runtime dependency versions explicit when they come from a different toolchain generation; workspace catalog packages can otherwise create cross-artifact type mismatches even when the app itself builds.

**Why:** The imported app and the existing preview artifact resolved different Vite type declarations during the first workspace-wide check.

**How to apply:** After importing a complete app, run both its package typecheck and the root workspace typecheck, then isolate any catalog/version compatibility fixes to the affected artifact.