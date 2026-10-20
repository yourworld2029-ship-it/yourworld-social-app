---
name: Admin operations role boundary
description: YourWorld's separation between owner support administration and operational review access.
---

The support owner admin alone controls operations-admin invitations, legal/community report review, and account restrictions. Operations admins handle sports verification, National Awards, and payout review. Both roles require AAL2; each view of private payout destination details is audited. The exact normalized support-owner email in a Supabase-verified JWT may authorize the owner server-side without depending on a `user_roles` lookup; never trust a client-supplied email. Other admins still require their matching role row.

**Why:** YourWorld requires a separate operations account without exposing copyright, grievance, or user-report administration. The owner needs a trusted recovery path when the matching database role lookup is unavailable, but client-side bypasses cannot authorize private server data.

**How to apply:** Keep recipient separation and server-side role checks aligned whenever admin sections or notification destinations change. Preserve authentication restrictions and AAL2 for sensitive actions, and put bounded timeouts and retryable errors around access/MFA checks. Capacitor APKs still call the published server function, so publish server-side access-check changes as well as delivering a new APK.
