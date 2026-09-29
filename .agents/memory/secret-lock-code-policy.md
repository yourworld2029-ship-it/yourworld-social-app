---
name: Secret Lock code policy
description: Secret Lock code format, hash compatibility, and permanent no-recovery behavior.
---

Secret Lock uses 4–8 ASCII alphanumeric characters. Hash newly set codes with the versioned PBKDF2 format, and retain verification for existing legacy numeric salted SHA-256 hashes.

There is no Forgotten Code flow, account-password recovery, reset path, or alternate unlock. A user may remove the lock only after verifying the current code.

**Why:** The user explicitly requires forgotten Secret Codes to remain unrecoverable; this is an intentional permanent-lock policy, not an omitted recovery feature.

**How to apply:** Keep code entry, exact search matching, and unlock verification case-sensitive. Do not reintroduce recovery or weaken the format. Preserve legacy numeric verification until existing owners update their own codes.