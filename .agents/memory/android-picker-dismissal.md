---
name: Android picker dismissal
description: Keep Sports and National Award verification overlays open when Android's native file picker steals WebView focus.
---

For document inputs inside Radix dialogs or sheets, mark the picker active synchronously before invoking the native picker. Gate close requests with refs and prevent outside-focus/interact dismissal while the picker or upload is active. Android may recreate the WebView when the native picker returns, so persist a short-lived, owner-scoped resume marker and reopen the same verification form after reload. Release the in-memory guard after upload, or after a short delay when the picker is cancelled.

**Why:** State-only guards did not stop Sports and National Award forms from closing after Android opened or returned from its native evidence picker; focus transitions can trigger dismissal before React commits a state update, and a WebView recreation discards all in-memory state.

**How to apply:** Use this only for document-upload inputs nested in Sports/National Award verification overlays. Keep the guard active from the visible upload control through the upload callback, scope resume state to the signed-in owner and form, and clear it on explicit close or expiry; do not broaden it to unrelated screens or video pickers.
