---
name: Supabase schema drift
description: How to handle mismatches between generated Supabase types, legacy SQL, and the live data-bearing schema.
---

When the live Supabase schema differs from generated types, use narrowly scoped compatibility reads and writes that react only to explicit PostgREST missing-column errors. Do not reset data or assume generated types prove the live schema.

**Why:** The app can retain older column names while locally generated types describe a newer intended schema. Blind migrations or resets risk existing user data, while unconditional new-column queries break otherwise valid rows.

**How to apply:** Prefer the runtime error as evidence, alias legacy columns where semantics are known, remove only fields explicitly reported missing, and keep unrelated database errors visible. Apply remote schema changes only after confirming the management connection targets the runtime project.