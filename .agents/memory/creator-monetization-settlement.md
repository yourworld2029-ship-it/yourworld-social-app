---
name: Creator monetization settlement
description: Server-authoritative creator revenue splits, buyer surcharge, payout TDS, and agreement gating.
---

Direct Course/VIP earnings use the base price as the settlement base: buyers pay an additional 2% gateway surcharge, creators receive 85%, and the platform receives 15%. Ads and view revenue use a 70% creator / 30% platform split. Payout requests use the creator share as the threshold balance and deduct 1% TDS under Section 194-O exactly once.

**Why:** Creator-facing balances must not expose platform cuts or accidentally reduce the creator share with buyer gateway fees or duplicate TDS.

**How to apply:** Keep the database earning trigger/RPC authoritative for settlement, preserve creator-facing net-only labels, and require `terms_accepted_at` for both payout requests and payout-detail writes.