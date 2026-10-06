---
name: Android capture protection
description: Keep Android screenshot blocking conditional to a user toggle inside chat.
---

Keep `FLAG_SECURE` off globally. The current device's window must follow only that user's per-chat “Protect Chat (Block Screenshots & Recording)” toggle; do not enable it from the other participant's presence state. Clear it when the toggle turns off, when the chat identity changes, and on route unmount. Do not set the flag from `MainActivity` or non-chat routes. This is a native window-level block; separate incoming capture-alert broadcasts may remain.

**Why:** The latest user request explicitly supersedes the earlier no-blocking preference and requires user-controlled protection limited to the active chat. A protected conversation must not render during the settings/native-flag handshake because even one visible frame can be captured.

**How to apply:** Drive the local native flag directly from locally loaded chat settings so it does not wait for or inherit peer presence. On Android, render only a full-screen black gate until this user's per-chat setting resolves; if enabled, keep the gate until the native flag call resolves. Tie flag changes to the per-chat toggle and guarantee a `false` call in cleanup. Do not change feed, Reels, profile, or call capture behavior; preserve app-wide incoming-call discovery and user-initiated per-call setup.

Android does not reliably report a screenshot attempt that `FLAG_SECURE` blocks. Android 14+'s screenshot callback is not invoked for protected windows, and the older MediaStore observer only sees screenshots that were saved.

**Why:** The operating system prevents the capture before the app receives an event, so there is no event to broadcast to the other participant.

**How to apply:** Keep the block and alert only on captures the OS reports unless the user explicitly chooses to allow captures to enable post-capture alerts. Do not claim blocked attempts were detected or add an accessibility service without explicit approval.