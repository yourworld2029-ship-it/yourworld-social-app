---
name: Android capture protection
description: Keep Android screenshot and recording prevention limited to opted-in direct chats.
---

Keep `FLAG_SECURE` off by default and enable it only inside a direct-chat thread while that conversation's Secret Lock is enabled. The native bridge must honor both values: set the flag when enabled and clear it when disabled or when the thread unmounts. Do not reassert it from `MainActivity` startup or resume code.

**Why:** App-wide startup protection blocked screenshots and recordings on public surfaces and could not respect a user's per-chat opt-in.

**How to apply:** Gate the native hook on the direct chat's explicit Secret Lock setting, clear on toggle-off and route exit, and reapply only while that opted-in thread is active after resume. Keep status-bar and inset configuration independent. Android's flag blocks standard OS screenshots and recordings; it cannot guarantee protection against rooted devices or external cameras.