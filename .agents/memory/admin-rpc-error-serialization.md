---
name: Admin RPC error serialization
description: Production TanStack Start server-function errors can be hidden by a failing Seroval error serializer.
---

For Admin Console data reads, expose the result through a structured JSON HTTP response when native server-function calls return opaque or missing values. Invoke the public server-function callable from that route, never its private `__executeServer` hook. Preserve server-side authentication and admin authorization. The user explicitly requested an AAL2 exception only for the authenticated configured owner's read-only console list; payout/KYC reads and sensitive actions must retain AAL2.

**Why:** A production no-session server-function request produced `Seroval Error (step: 3)` caused by a serialization plugin reading a missing `t` field, obscuring the original auth error. A follow-up Admin JSON route under `/api` was then captured by this workspace's separate API artifact and returned 404 instead of reaching YourWorld. TanStack SSR references retain middleware but omit the provider's handler body; directly executing that reference's private hook can authenticate successfully yet produce an undefined result that JSON serialization drops.

**How to apply:** When an Admin RPC appears as `undefined`, inspect production status/body shape and logs. Prefer a narrowly scoped JSON route that invokes the same protected server handler and returns JSON errors; verify its URL is routed to the YourWorld artifact (not the API artifact's `/api/*` namespace). Do not add database-role bypasses.

**Owner-read exception — Why:** The user requested that the configured owner's console list return data without its additional in-function MFA gate. **How to apply:** Scope this exception to the existing authenticated JWT email owner policy and the console list only; do not extend it to payout/KYC details, transfers, moderation writes, or other admins.
