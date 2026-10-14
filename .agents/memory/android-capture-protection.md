---
name: Android capture protection
description: Keep screenshot blocking scoped to the active chat and synchronize protection between participants.
---

“Protect Chat” is shared conversation state. When a participant enables it, both participants' active Android chat windows must apply `FLAG_SECURE`; only the participant who enabled it may turn it off. Keep the flag off globally, clear it when leaving the protected chat, and do not set it from `MainActivity` or non-chat routes. Keep each viewer's name and user ID visibly watermarked over the protected chat.

**Why:** The user requires one participant's protection setting to cover the other participant's device too. Android can block same-device capture, but secure-window screenshot attempts and external cameras are not reliably observable by the app.

**How to apply:** Load the shared conversation setting for both participants, even when the current user has no private preference row, and require the real conversation ID before treating the security decision as resolved. Fetch failures must retry and keep Android chat content hidden rather than defaulting to unprotected; refresh on Realtime reconnect and app resume. If enabled, keep the gate until `FLAG_SECURE` is applied. Enforce the enabling participant as the off-switch owner in the database and clear the native flag on chat exit. Send in-app/FCM alerts only for capture events Android actually reports; API 35 can report screen-recording state, but a protected screenshot may be blocked without an app callback. The identity watermark deters external-camera capture but cannot detect it.
