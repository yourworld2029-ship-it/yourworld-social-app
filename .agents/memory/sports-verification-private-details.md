---
name: Sports verification private details
description: Privacy boundary for Sports Verification identity fields and evidence metadata.
---

Store Sports Verification identity/contact fields and evidence object paths in a private, owner-scoped table rather than `profiles.bio` or other public profile fields.

**Why:** Village, district, state, account contact snapshots, and document paths must never become public profile data. The live Supabase project may not have the role helper or admin-role table assumed by older migrations, so do not broaden RLS with an unverified admin predicate.

**How to apply:** Reuse the existing private `documents` bucket under the authenticated owner folder. Render only generic upload state such as “Uploaded” in user-facing UI; never render storage paths, UUIDs, or signed URLs. Add a validated admin policy only after confirming the live project’s actual role boundary.