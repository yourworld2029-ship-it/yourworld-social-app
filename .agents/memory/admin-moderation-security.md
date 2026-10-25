---
name: Owner admin moderation security
description: Security boundary and review rules for the YourWorld moderation console.
---

Sensitive moderation is owner-admin plus Supabase AAL2. The configured owner has a narrowly scoped read-only exception for the Admin Console and Sports Verification review queue; all moderation decisions and other admins still require AAL2. Keep privileged reads and mutations in server functions, serve private evidence through short-lived signed URLs, and append an immutable audit record containing actor, target, action, reason, assurance level, and time. Account restrictions must block processing without automatic forfeiture; payout holds are review controls, not confiscation.

**Why:** Browser-side copyright moderation and cosmetic 2FA did not provide trustworthy authorization or an audit trail. The owner needs to inspect pending review data even when a refreshed JWT does not immediately carry the AAL2 claim.

**How to apply:** Preserve the existing admin role and auth provider. Keep the owner exception read-only and authenticated by the Supabase JWT; never extend it to review actions, payout/KYC, other admins, or public storage access. Never auto-grant admin, expose verification documents publicly, or treat a client-side MFA flag as proof of step-up authentication.