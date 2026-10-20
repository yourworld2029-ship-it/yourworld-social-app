---
name: Admin operations role boundary
description: YourWorld's separation between owner support administration and operational review access.
---

The support owner admin alone controls operations-admin invitations, legal/community report review, and account restrictions. Operations admins handle sports verification, National Awards, and payout review. Both roles require AAL2; each view of private payout destination details is audited. For console identity, use the verified Supabase JWT email claim alongside the `user_roles` row rather than adding a second Auth Admin lookup.

**Why:** YourWorld requires a separate operations account without exposing copyright, grievance, or user-report administration. A second Auth Admin request can leave the mobile console waiting indefinitely even when the role row is valid.

**How to apply:** Keep recipient separation and server-side role checks aligned whenever admin sections or notification destinations change. Preserve AAL2 for sensitive actions and put bounded timeouts and retryable errors around access/MFA checks.
