---
name: Chat security load fallback
description: User-approved behavior when chat lock data or PIN verification is missing or unavailable.
---

Render the thread and message input immediately with defaults while conversation settings load in the background; never block the whole chat on a security-loading screen. A valid stored Secret Lock may arrive after the first render, so preserve its PIN prompt once confirmed. Missing lock state or PIN salt/hash material, and caught verification failures, fall back to showing the thread. A wrong PIN remains rejected.

**Why:** The user explicitly prioritized avoiding the Android WebView crash and requested immediate chat rendering even before settings resolve, accepting that a valid lock can be recognized after the initial render.

**How to apply:** Keep settings and crypto work asynchronous and bounded to data changes or explicit PIN submission; do not add a recurring hash effect. Keep wrong-PIN rejection and do not persistently delete lock settings unless separately requested.