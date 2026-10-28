---
name: Creator monetization settlement
description: Server-authoritative creator revenue splits, buyer surcharge, payout TDS, and agreement gating.
---

Direct Course/VIP earnings use the base price as the settlement base: buyers pay an additional 2% gateway surcharge, creators receive 85%, and the platform receives 15%. Ads and view revenue use a 70% creator / 30% platform split. Payout requests use the creator share as the threshold balance and deduct 1% TDS under Section 194-O exactly once.

**Why:** Creator-facing balances must not expose platform cuts or accidentally reduce the creator share with buyer gateway fees or duplicate TDS.

**How to apply:** Keep the database earning trigger/RPC authoritative for settlement, preserve creator-facing net-only labels, and require `terms_accepted_at` for both payout requests and payout-detail writes.

## Country-specific payout currency and manual USD processing

Payout currency follows the saved profile country: India uses INR, non-India uses USD, and the wallet shows only the profile's currency. Earnings in another currency are not mixed into the displayed balance or silently converted. Payout requests use the fixed monthly 1st–5th window. USD transfers remain manual; an MFA-protected admin records an external transfer reference. No Stripe or automatic USD transfer provider is connected.

**Why:** The user chose actual USD balances and dismissed connecting a payment integration, so the app must not imply automatic USD transfers or hide FX conversions.

**How to apply:** Keep currency attached to each earning and payout request, derive it server-side from the saved country, filter wallet totals and thresholds to that currency, and use MFA-protected manual settlement until the user explicitly selects a transfer provider.

## International payout KYC

For non-Indian creators, keep tax IDs, bank numbers, and PayPal email encrypted with a Vault-held key and inaccessible through direct client table reads. Creators can retrieve only their own details; admin decryption and KYC decisions require MFA and an audit record. Normalize PayPal email before enforcing one-account uniqueness. Require approved KYC before a USD request, then keep the payout itself in the existing manual-review flow. The India payout path stays separate.

**Why:** International payout details include sensitive tax and banking data, and the app has no approved automatic USD transfer provider.

**How to apply:** Keep country validation, encryption, PayPal uniqueness, and KYC state checks in the database; expose owner-scoped form RPCs and audited AAL2 admin review only.

Confirmed copyright/fraud findings may hold unpaid earnings linked to the content for a 7-day dispute period. If unresolved after that, the amount remains held until an admin reviews it; do not automatically forfeit or transfer it to platform revenue. The day-27 payout check evaluates existing active payout holds only, and transfers remain manually processed in the 1–5 window.

**Why:** The user explicitly chose continued hold and admin review instead of automatic forfeiture, and limited the scheduled monthly check to existing payout holds.

**How to apply:** Keep held creator shares out of available balance and payout requests, show them separately in the wallet, require an audited admin release, and preserve the current manual payout flow.

Paid-video purchases use a service-only, idempotent settlement RPC: derive the charge from the paid post, reserve the full 15% platform commission, deduct the actual gateway charge or 2.36% estimate from the creator amount, then write the purchase ledger, access grant, creator wallet credit, and platform balance in one transaction.

**Why:** Payment retries and client-supplied amounts must never create duplicate access or double-credit either side of the 85/15 split.

**How to apply:** Treat the payment provider's verified reference as the idempotency key, validate it against `posts.price`, and keep all balance changes inside the database transaction.

In-app playback must not bypass paid/VIP access checks: only resolve a restricted video's media URL after confirming the creator or an active user-specific access grant. Feed autoplay and poster-frame extraction are limited to public, free videos.

**Why:** A direct video route or an inline preview can bypass the controls shown on a card if it receives a restricted media source before access is confirmed.

**How to apply:** Gate the shared-player activation before URL resolution, and do not register non-public or priced media as feed autoplay candidates.

Creator monetization watch time counts only authenticated views of public-access videos while the creator account is public. Preserve account privacy transitions so watch time accrued during private periods remains excluded after the account becomes public again; for minute-bucketed live watch events, exclude any minute that overlaps a private period.

**Why:** Private periods must pause monetization eligibility without erasing valid public-period watch time or counting time that overlaps a privacy change.

**How to apply:** Use the persisted `profiles.is_private` status and its history in both the long-video and saved-live watch-hour aggregates; do not reset privacy history when the account is made public.