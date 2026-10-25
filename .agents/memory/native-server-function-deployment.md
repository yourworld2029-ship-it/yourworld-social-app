---
name: Native server-function deployment alignment
description: Keep hosted TanStack server functions in sync with Android client releases.
---

YourWorld's Capacitor client sends server-function requests to the configured hosted app origin. An APK can contain newer JavaScript than the published server; when server-function manifests or handlers differ, the client may receive `undefined` even though the workspace handler returns data.

**Why:** A fresh APK still got an undefined Admin Console response because production had not been published after server-function changes. Rebuilding the client does not update the remote handler.

**How to apply:** Before distributing an APK that depends on changed server functions, publish and verify the matching web/server build, then confirm the native request against that deployment. Never work around stale handlers by moving privileged reads into direct client-side Supabase queries.
