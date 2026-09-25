---
name: Android capture protection
description: Keep screenshot and screen-record prevention enabled across the native app.
---

Android screen-capture protection is app-wide: set `WindowManager.LayoutParams.FLAG_SECURE` in `MainActivity.onCreate` and let privacy-bridge calls reinforce it, but never clear it during route cleanup.

**Why:** The requested policy is strict protection for the entire app surface, not only selected chat or media routes.

**How to apply:** Preserve `FLAG_SECURE` from startup and do not add a `clearFlags(FLAG_SECURE)` path. Android's flag blocks standard OS screenshots and recordings; it cannot guarantee protection against rooted devices or external cameras.