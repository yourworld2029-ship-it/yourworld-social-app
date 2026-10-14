---
name: Android capture protection
description: Keep screenshot blocking scoped to the active chat and synchronize protection between participants.
---

“Protect Chat” is shared conversation state. When a participant enables it, both participants' active Android chat windows must apply `FLAG_SECURE`; only the participant who enabled it may turn it off. Keep the flag off globally, clear it when leaving the protected chat, and do not set it from `MainActivity` or non-chat routes. Keep each viewer's name and user ID visibly watermarked over the protected chat.

**Why:** The user requires one participant's protection setting to cover the other participant's device too. Android can block screenshots and screen recording on the same device with `FLAG_SECURE`, but an external camera cannot be blocked.

**How to apply:** Load the shared conversation setting and subscribe to its realtime updates. On Android, render a black gate until the setting resolves; if enabled, keep the gate until `FLAG_SECURE` is applied. Enforce the enabling participant as the off-switch owner in the database, and guarantee a `false` native call on chat identity change and unmount. Treat the watermark only as visible attribution/deterrence for external-camera capture, not as a guarantee or a capture-detection signal.
