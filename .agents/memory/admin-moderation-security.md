---
name: Owner admin moderation security
description: Security boundary and review rules for the YourWorld moderation console.
---

Sensitive moderation is owner-admin plus Supabase AAL2 only. Keep privileged reads and mutations in server functions, serve private evidence through short-lived signed URLs, and append an immutable audit record containing actor, target, action, reason, assurance level, and time. Account restrictions must block processing without automatic forfeiture; payout holds are review controls, not confiscation. Capacitor server-function requests must send the current Supabase access token as a Bearer header, and Admin access checks should verify that token with `getUser(token)` rather than relying on cookies; never log the token.

**Why:** Browser-side copyright moderation and cosmetic 2FA did not provide trustworthy authorization or an audit trail; the native WebView also cannot depend on persistent web cookies for server-function authentication.

**How to apply:** Preserve the existing admin role and auth provider. Attach the bearer token to native server-function requests, verify the active account server-side, and log only the verified email when diagnosing Admin access. Never auto-grant admin, expose verification documents publicly, or treat a client-side MFA flag as proof of step-up authentication.