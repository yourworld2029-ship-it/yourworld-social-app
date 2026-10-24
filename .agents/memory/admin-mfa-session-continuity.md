---
name: Admin MFA session continuity
description: Supabase MFA assurance-state handling for YourWorld admin access across route changes and app resumes.
---

After a successful `supabase.auth.mfa.verify()`, use the session and assurance state Supabase Auth updates; avoid an unnecessary extra `refreshSession()` immediately afterward. Check `getAuthenticatorAssuranceLevel()` for the UI indicator, and keep the server's verified JWT `aal2` claim as the actual authorization gate. Recheck the client indicator on auth-state changes and when the app returns to the foreground.

**Why:** Admin server functions require AAL2. Redundant refreshes after verification can make the client and the token attached to the next server request disagree about whether MFA is active.

**How to apply:** For Admin Console route or tab refreshes, read the current Supabase session instead of maintaining a separate client-only MFA authorization flag. Never use the UI's verified indicator to grant server access.
