---
name: Admin RPC error serialization
description: Production TanStack Start server-function errors can be hidden by a failing Seroval error serializer.
---

For Admin Console data reads, keep the existing server-side authentication, owner-admin authorization, and AAL2 checks, but expose the result through a structured JSON HTTP response when native server-function calls return opaque or missing values. Never resolve this by bypassing admin or MFA checks.

**Why:** A production no-session server-function request produced `Seroval Error (step: 3)` caused by a serialization plugin reading a missing `t` field, obscuring the original auth error; the equivalent JSON route returned a clear 401.

**How to apply:** When an Admin RPC appears as `undefined`, inspect production status/body shape and logs. Prefer a narrowly scoped JSON route that invokes the same protected server handler and returns JSON errors; do not add database-role bypasses.
