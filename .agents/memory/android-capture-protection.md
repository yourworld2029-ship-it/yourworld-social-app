---
name: Android capture protection
description: Keep Android screenshot and recording prevention enabled throughout YourWorld.
---

Keep `FLAG_SECURE` enabled across the entire Android app. Set it when `MainActivity` is created and reassert it on resume. JavaScript bridge calls and route cleanup must never clear it; compatibility bridge calls may only enable the flag.

**Why:** The user explicitly requested screenshot and recording prevention on every Android app screen, replacing the earlier direct-chat-only behavior.

**How to apply:** Enforce the flag in native activity lifecycle code and ensure no bridge or route-unmount path can remove it. Android's flag blocks standard OS screenshots and recordings; it cannot guarantee protection against rooted devices or external cameras.