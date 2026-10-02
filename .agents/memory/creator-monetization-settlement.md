---
name: Creator monetization settlement
description: Server-authoritative creator revenue splits, buyer surcharge, payout TDS, and agreement gating.
---

Direct Course/VIP earnings use the base price as the settlement base: buyers pay an additional 2% gateway surcharge, creators receive 85%, and the platform receives 15%. Ads and view revenue use a 70% creator / 30% platform split. Payout requests use the creator share as the threshold balance and deduct 1% TDS under Section 194-O exactly once.

**Why:** Creator-facing balances must not expose platform cuts or accidentally reduce the creator share with buyer gateway fees or duplicate TDS.

**How to apply:** Keep the database earning trigger/RPC authoritative for settlement, preserve creator-facing net-only labels, and require `terms_accepted_at` for both payout requests and payout-detail writes.

Paid-video purchases use a service-only, idempotent settlement RPC: derive the charge from the paid post, reserve the full 15% platform commission, deduct the actual gateway charge or 2.36% estimate from the creator amount, then write the purchase ledger, access grant, creator wallet credit, and platform balance in one transaction.

**Why:** Payment retries and client-supplied amounts must never create duplicate access or double-credit either side of the 85/15 split.

**How to apply:** Treat the payment provider's verified reference as the idempotency key, validate it against `posts.price`, and keep all balance changes inside the database transaction.

In-app playback must not bypass paid/VIP access checks: only resolve a restricted video's media URL after confirming the creator or an active user-specific access grant. Feed autoplay and poster-frame extraction are limited to public, free videos.

**Why:** A direct video route or an inline preview can bypass the controls shown on a card if it receives a restricted media source before access is confirmed.

**How to apply:** Gate the shared-player activation before URL resolution, and do not register non-public or priced media as feed autoplay candidates.