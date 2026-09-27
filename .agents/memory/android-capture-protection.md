---
name: Android capture protection
description: Limit Android screenshot and recording prevention to active chat threads.
---

Keep `FLAG_SECURE` off on general app screens. In an active chat, enable it only when that chat's screenshot or recording alert is enabled; either alert blocks both capture types. Clear it when both alerts are off or the chat unmounts, and reapply on resume only while the chat policy still enables it.

**Why:** The user chose a block-first compromise because Android's `FLAG_SECURE` blocks screenshots and recordings together. Android does not report a screenshot attempt for a secure window, so blocking cannot also guarantee a screenshot notice.

**How to apply:** Keep the policy in Social and accepted Orbit chat routes, gate each alert independently, and never set the flag from `MainActivity`. Android 15/API 35 can report when the app is visible in a screen recording; older Android versions have no equivalent recording-state signal here. Use web blur/visibility only as a best-effort screenshot heuristic, ignore focused editable controls, and apply `blur(35px)` before dispatching that notice. Never claim Android screenshot-attempt alerts are guaranteed while the secure flag is active.