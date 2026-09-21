---
name: Session and email OTP security
description: Durable rules for YourWorld multi-device sessions and email-based 2FA.
---

Use the Supabase Auth `session_id` claim as the key for one device login. A remote-session removal must mark that session's refresh-token family revoked and set `auth.sessions.not_after` before deleting the app-level session row. The browser-side AuthProvider must poll the app session RPC because an already-issued access token can remain valid until expiry; on a negative result it signs out locally and shows the exact user-facing message required by the product.

Email OTP 2FA is a second step after password validation: send the OTP only after `signInWithPassword` succeeds, immediately remove that preliminary local session, and allow the final session only after `verifyOtp` returns a session. Treat the profile flag as persisted state, not a local toggle.

**Why:** Supabase does not expose a remote device's JWT to the browser that initiated revocation, and refresh-token revocation alone does not instantly invalidate an already-issued access token.

**How to apply:** Keep session management server-authoritative through authenticated SECURITY DEFINER RPCs, explicitly deny `anon` execution, and keep passwords/OTP values out of persistence and logs.