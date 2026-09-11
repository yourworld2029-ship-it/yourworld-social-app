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

For social interactions, verify the runtime table inventory before introducing feature-specific tables: the current YourWorld deployment stores Moments as `posts.kind = 'moment'`, canonical DMs use `messages`, and comments use `public.comments` even though generated types may still describe `post_comments`.

**Why:** Older app code expected standalone Moment tables, legacy direct-message rows, and a generated `post_comments` model, so those writes could fail or appear in a UI path the product no longer reads.

**How to apply:** Preserve the posts-backed Moment path, use dedicated interaction/notification tables only when their runtime schema is applied, keep canonical DM writes in `messages`, query comments through the live `comments` compatibility boundary, and sign private Moment media paths before rendering them in notifications.

For optional creator fields such as audience and price, compatibility writes must expose which columns were removed so the UI can fail visibly instead of claiming a restriction was saved.

**Why:** The live posts table may accept the core upload while silently dropping monetization fields; a successful insert alone does not prove access control persisted.

**How to apply:** Keep public publishing available, but reject VIP/paid publishing when the live schema reports the required fields missing; add the schema/RPC before re-enabling those modes.

Cross-table RLS policies must not recursively query each other: when a posts policy checks grants and a grants policy checks post ownership, put the ownership lookup in a tightly scoped `SECURITY DEFINER` helper.

**Why:** PostgreSQL raised `42P17` while loading the public video feed because the two policy subqueries caused recursive evaluation of `posts`.

**How to apply:** Keep the generated live schema authoritative, isolate retired/optional client paths behind an explicit loose compatibility boundary, and use a security-definer ownership helper for cross-table entitlement policies.