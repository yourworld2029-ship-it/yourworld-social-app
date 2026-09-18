---
name: Sports verification private details
description: Privacy boundary for Sports Verification identity fields and evidence metadata.
---

Store Sports Verification identity/contact fields, exact-match attestation, and evidence object paths in a private, owner-scoped table rather than `profiles.bio` or other public profile fields. The current submission form uses the normalized full-name/father-name/DOB identity key for active duplicate prevention; legacy document-number columns remain for stored historical records.

**Why:** Identity and document identifiers are sensitive, and duplicate prevention must be race-safe at the database boundary instead of relying only on a client preflight. Passport and certificate number inputs were intentionally removed from the user flow, so new submissions must not require or overwrite those legacy values. The live Supabase project may not have the role helper or admin-role table assumed by older migrations, so do not broaden RLS with an unverified admin predicate.

**How to apply:** Reuse the existing private `documents` bucket under the authenticated owner folder. Normalize and check the identity key on the server, enforce the existing partial unique indexes for pending/approved review states, and render only generic upload state such as “Uploaded” in user-facing UI; never render storage paths, UUIDs, or signed URLs. Add a validated admin policy only after confirming the live project’s actual role boundary.