---
name: Chat security load fallback
description: User-approved behavior when chat lock data or PIN verification is missing or unavailable.
---

When a chat thread has missing lock state, security settings, or PIN salt/hash material, it must not remain on the security-loading screen. Catch load and verification failures and allow the affected thread to show its messages. A wrong PIN remains rejected; only absent or broken verification data triggers the open fallback.

**Why:** The user explicitly chose chat availability over fail-closed behavior after the Android WebView crash, accepting that missing lock data can bypass Secret Lock for that thread.

**How to apply:** Keep this fallback limited to opening the affected thread. Do not turn verification failures into a successful PIN comparison or persistently delete lock settings unless separately requested.