---
name: Supabase schema drift
description: How to handle mismatches between generated Supabase types, legacy SQL, and the live data-bearing schema.
---

When the live Supabase schema differs from generated types, use narrowly scoped compatibility reads and writes that react only to explicit PostgREST missing-column errors. Do not reset data or assume generated types prove the live schema.

**Why:** The app can retain older column names while locally generated types describe a newer intended schema. Blind migrations or resets risk existing user data, while unconditional new-column queries break otherwise valid rows.

**How to apply:** Prefer the runtime error as evidence, alias legacy columns where semantics are known, remove only fields explicitly reported missing, and keep unrelated database errors visible. Apply remote schema changes only after confirming the management connection targets the runtime project.

For call signaling specifically, keep SDP and role-separated ICE candidates inside the verified participant-protected `calls.signal_data` envelope unless top-level columns are confirmed in the runtime schema.

**Why:** The live calls table exposes `signal_data`; writing guessed `offer` or `answer` columns would make call setup fail before WebRTC starts.

**How to apply:** Treat the database record as authoritative and let Realtime only accelerate delivery. Poll participant call rows on a short interval and rehydrate offer, answer, ICE, and terminal status from the envelope.