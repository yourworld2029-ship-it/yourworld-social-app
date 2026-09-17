---
name: Supabase MFA factor listing
description: The Supabase auth-js factor-listing contract relevant to resuming TOTP enrollment verification.
---

Supabase auth-js returns every MFA factor in `listFactors().data.all`, while the type-specific arrays such as `data.totp` contain only factors whose status is `verified`. An enrolled but unverified TOTP factor therefore does not appear in `data.totp`.

**Why:** The Admin MFA flow must be able to resume verification for a factor that was created previously but did not finish its first code verification, without creating a duplicate factor.

**How to apply:** When locating an existing TOTP factor for a verification-resume flow, search `data.all` with the intended factor identity first; use the factor ID for the normal challenge and verify calls. Treat `data.totp` as the verified-only collection.