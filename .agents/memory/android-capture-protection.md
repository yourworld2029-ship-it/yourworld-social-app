---
name: Android capture protection
description: Limit Android screenshot and recording prevention to active chat threads.
---

Keep `FLAG_SECURE` off on general app screens. Enable it when a chat-thread screen mounts, and clear it as soon as that screen unmounts. Do not set or reassert the flag from `MainActivity`; the native bridge must support both `addFlags` and `clearFlags`.

**Why:** The user explicitly corrected the scope: screenshots and recordings must remain available on Home, Feed, Profile, and Reels, with protection only inside a chat thread.

**How to apply:** Keep the hook inside chat-thread routes only, re-enable on resume while a thread is active, and clear on route cleanup. Android's flag blocks standard OS screenshots and recordings; it cannot guarantee protection against rooted devices or external cameras.